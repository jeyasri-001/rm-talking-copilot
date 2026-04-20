import { supabase } from "./supabase";
import { embed } from "./embeddings";

export type RetrievedChunk = {
  id: string;
  source: string;
  doc_type: string | null;
  client_id: string | null;
  content: string;
  similarity: number;
};

/**
 * Retrieve top-k chunks for a query. Prefers client-specific chunks,
 * then firm-wide. Uses the Postgres RPC `match_chunks` created in migrate.ts.
 */
export async function retrieve(
  query: string,
  opts: { k?: number; clientId?: string | null } = {}
): Promise<RetrievedChunk[]> {
  const k = opts.k ?? 6;
  const embedding = await embed(query);

  const { data, error } = await supabase.rpc("match_chunks", {
    query_embedding: embedding,
    match_count: k,
    filter_client: opts.clientId ?? null,
  });

  if (error) {
    console.error("match_chunks error", error);
    return [];
  }
  return (data ?? []) as RetrievedChunk[];
}

export function formatContext(chunks: RetrievedChunk[]): string {
  if (!chunks.length) return "No relevant documents found.";
  return chunks
    .map(
      (c, i) =>
        `[${i + 1}] source: ${c.source} (${c.doc_type ?? "doc"})\n${c.content.trim()}`
    )
    .join("\n\n---\n\n");
}
