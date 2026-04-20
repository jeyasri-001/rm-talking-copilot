/**
 * Ingest: loads clients + interactions + markdown docs,
 * chunks the docs, embeds each chunk via HF, and upserts into Supabase.
 *
 * Usage:  npm run seed
 *
 * Idempotent: truncates doc_chunks before inserting; upserts clients and interactions.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { supabaseAdmin } from "../lib/supabase";
import { embed, EMBEDDING_DIM } from "../lib/embeddings";

const ROOT = process.cwd();
const SEED_DIR = join(ROOT, "seed");
const DOCS_DIR = join(SEED_DIR, "docs");

type Client = { id: string; name: string; profile: unknown };
type Interaction = {
  client_id: string;
  ts: string;
  kind: string;
  summary: string;
};

function chunkText(text: string, targetChars = 1500, overlap = 200): string[] {
  // Paragraph-first splitter with char cap; good enough for markdown notes.
  const paras = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const out: string[] = [];
  let buf = "";
  for (const p of paras) {
    if ((buf + "\n\n" + p).length > targetChars && buf.length) {
      out.push(buf);
      buf = buf.slice(Math.max(0, buf.length - overlap)) + "\n\n" + p;
    } else {
      buf = buf ? buf + "\n\n" + p : p;
    }
  }
  if (buf.length) out.push(buf);
  return out;
}

function parseFrontmatter(md: string): { meta: Record<string, string>; body: string } {
  const m = md.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
  if (!m) return { meta: {}, body: md };
  const meta: Record<string, string> = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^\s*([a-zA-Z_]+)\s*:\s*(.+?)\s*$/);
    if (kv) meta[kv[1]] = kv[2];
  }
  return { meta, body: m[2] };
}

async function main() {
  const db = supabaseAdmin();

  console.log("→ Loading clients…");
  const clients = JSON.parse(
    readFileSync(join(SEED_DIR, "clients.json"), "utf8")
  ) as Client[];

  const { error: cErr } = await db.from("clients").upsert(
    clients.map((c) => ({
      id: c.id,
      name: c.name,
      profile: c.profile,
      rm_id: process.env.DEMO_RM_ID ?? "demo-rm",
    })),
    { onConflict: "id" }
  );
  if (cErr) throw cErr;
  console.log(`  upserted ${clients.length} clients`);

  console.log("→ Loading interactions…");
  const interactions = JSON.parse(
    readFileSync(join(SEED_DIR, "interactions.json"), "utf8")
  ) as Interaction[];
  // wipe + reinsert (simpler than diffing)
  await db.from("interactions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { error: iErr } = await db.from("interactions").insert(
    interactions.map((i) => ({
      ...i,
      rm_id: process.env.DEMO_RM_ID ?? "demo-rm",
    }))
  );
  if (iErr) throw iErr;
  console.log(`  inserted ${interactions.length} interactions`);

  console.log("→ Clearing existing doc_chunks…");
  await db.from("doc_chunks").delete().neq("id", "00000000-0000-0000-0000-000000000000");

  console.log("→ Chunking + embedding docs…");
  const files = readdirSync(DOCS_DIR).filter((f) => f.endsWith(".md"));
  let totalChunks = 0;

  for (const file of files) {
    const raw = readFileSync(join(DOCS_DIR, file), "utf8");
    const { meta, body } = parseFrontmatter(raw);
    const chunks = chunkText(body);
    console.log(`  ${file}: ${chunks.length} chunk(s), type=${meta.doc_type ?? "-"}, client=${meta.client_id ?? "-"}`);

    const rows: Array<{
      source: string;
      doc_type: string | null;
      client_id: string | null;
      chunk_index: number;
      content: string;
      embedding: number[];
    }> = [];

    for (let i = 0; i < chunks.length; i++) {
      const vec = await embed(chunks[i]);
      if (vec.length !== EMBEDDING_DIM) {
        throw new Error(`bad dim for ${file}#${i}: ${vec.length}`);
      }
      rows.push({
        source: file,
        doc_type: meta.doc_type ?? null,
        client_id: meta.client_id ?? null,
        chunk_index: i,
        content: chunks[i],
        embedding: vec,
      });
    }

    // insert in one shot per file
    const { error: dErr } = await db.from("doc_chunks").insert(rows);
    if (dErr) {
      console.error(`insert failed for ${file}:`, dErr);
      throw dErr;
    }
    totalChunks += rows.length;
  }

  console.log(`\n✓ Ingest complete: ${clients.length} clients, ${interactions.length} interactions, ${totalChunks} chunks embedded.`);
}

main().catch((e) => {
  console.error("\n✗ Ingest failed:", e);
  process.exit(1);
});
