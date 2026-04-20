# RM Talking Copilot

An AI copilot for Relationship Managers. Two modes:

- **Pre-call brief** — pick a client, get a generated markdown brief: portfolio snapshot, recent activity, 2-3 talking points (with citations), and watch-outs.
- **Real-time assist** — type a client question, get a sourced, sub-2s streamed response.

Built for the hackathon PS 07 (RM Talking Framework / Copilot).

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 (App Router, TypeScript) |
| UI | Tailwind CSS + lucide-react + react-markdown |
| LLM | **Groq** `llama-3.3-70b-versatile` (primary) · Gemini 1.5 Flash (fallback) via Vercel AI SDK |
| Embeddings | HuggingFace Inference API, `sentence-transformers/all-MiniLM-L6-v2` (384-dim) |
| DB + vector | Supabase Postgres + `pgvector` |
| Deploy | Vercel |

## Setup

### 1. Install
```bash
npm install
```

### 2. Environment
Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service role key — server only>
GROQ_API_KEY=<gsk_…>
GOOGLE_GENERATIVE_AI_API_KEY=<gemini key>
HF_TOKEN=<hf_…>
DEMO_RM_ID=demo-rm
```

### 3. Database schema
Supabase JS can't execute DDL, so apply the schema once via the dashboard:

```bash
npm run migrate                  # prints instructions + dashboard URL
npm run migrate -- --print | pbcopy   # copies schema.sql to clipboard (macOS)
```

Paste into **Supabase Dashboard → SQL Editor → Run**.

Verify:
```sql
select proname from pg_proc where proname = 'match_chunks';
-- should return 1 row
```

### 4. Seed data + embeddings
```bash
npm run seed
```

This upserts 8 clients, ~17 interactions, and chunks + embeds ~7 markdown docs into `doc_chunks`. First HF call may take 15-20s (cold start); subsequent calls are fast.

### 5. Run
```bash
npm run dev
```

Open http://localhost:3000.

## Usage

- Home: search clients by name / risk / ID, then click **Pre-call brief** or **Real-time assist**.
- Brief page: streams the brief as Markdown with inline numbered citations (e.g., `[1]`, `[2]`) rendered as superscript pills. Sidebar lists the numbered sources.
- Assist page: chat input with sample questions; each assistant message shows first-token latency, inline numbered citations, and source chips at the bottom.

## Architecture

```
UI (Next.js App Router)
  ├─ /               Client search + mode toggle
  ├─ /brief/:id      Pre-call brief view (streamed)
  └─ /assist/:id     Real-time chat (streamed)

API (Route Handlers, Node runtime)
  ├─ /api/clients    list + detail (Supabase)
  ├─ /api/brief      retrieval → prompt → stream (Groq/Gemini)
  └─ /api/assist     retrieval → prompt → stream (Groq/Gemini)

RAG pipeline
  query → HF embed (384-d) → pgvector `match_chunks` RPC
         → top-k chunks (client-first, then firm-wide) → prompt context

Store (Supabase)
  ├─ clients(id, rm_id, name, profile jsonb)
  ├─ interactions(client_id, ts, kind, summary)
  └─ doc_chunks(source, doc_type, client_id?, content, embedding vector(384))
```

## Deployment (Vercel)

1. Push to GitHub.
2. Go to https://vercel.com/new → import the repo → framework auto-detects Next.js.
3. Add all env vars (same as `.env.local`) in **Project Settings → Environment Variables** for Production + Preview.
4. Click **Deploy**. First build: ~90s. URL: `https://<project>.vercel.app`.

**Pre-deploy checklist:**
- Supabase schema applied (migrate).
- `npm run seed` run at least once locally — chunks exist in production DB.
- `npm run build` passes locally.

**Custom domain:** Vercel → Project → Settings → Domains → add → CNAME to `cname.vercel-dns.com`. HTTPS auto.

**CI/CD:** push to `main` → production deploy. PRs get preview URLs. No GitHub Actions needed.

## Scripts

| Command | What it does |
|---------|--------------|
| `npm run dev` | Next.js dev server |
| `npm run build` | Production build |
| `npm run migrate` | Prints instructions to apply `scripts/schema.sql` |
| `npm run seed` | Ingests clients + docs + embeddings into Supabase |

## What's mocked vs real

- **Real**: embeddings, vector search, Groq LLM, streaming, Supabase DB, prompt engineering.
- **Mocked (JSON seeded)**: clients, portfolios, interactions, CIO reports, product sheets, market commentary. All in `seed/`.

## Known tradeoffs (hackathon scope)

- **No auth**: RM identity is a hardcoded `demo-rm`. Schema has `rm_id` + RLS-ready columns — flip on when needed.
- **Ingest is CLI, not HTTP**: avoids Vercel's 10s function timeout. Re-run locally when seed docs change.
- **HF free inference** can cold-start (one-time 15-20s). Query-time (one embed per request) is usually <1s.
- **Not in scope**: CRM integration, PDF parsing, agentic flows, compliance doc parsing.

## Security

**Do not commit `.env.local`.** After the demo, rotate any keys pasted into chat transcripts or README drafts.
