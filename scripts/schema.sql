-- RM Talking Copilot schema
create extension if not exists vector;

create table if not exists clients (
  id text primary key,
  rm_id text not null default 'demo-rm',
  name text not null,
  profile jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists interactions (
  id uuid primary key default gen_random_uuid(),
  client_id text references clients(id) on delete cascade,
  rm_id text not null default 'demo-rm',
  ts timestamptz not null default now(),
  kind text,
  summary text
);

create table if not exists doc_chunks (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  doc_type text,
  client_id text references clients(id) on delete cascade,
  chunk_index int not null default 0,
  content text not null,
  embedding vector(384) not null
);

create index if not exists doc_chunks_embedding_idx
  on doc_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create index if not exists doc_chunks_client_idx on doc_chunks(client_id);

-- top-k retrieval, prefers chunks tagged for the given client,
-- then firm-wide (client_id is null). Returns similarity (higher = better).
create or replace function match_chunks(
  query_embedding vector(384),
  match_count int default 6,
  filter_client text default null
)
returns table (
  id uuid,
  source text,
  doc_type text,
  client_id text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    c.id,
    c.source,
    c.doc_type,
    c.client_id,
    c.content,
    1 - (c.embedding <=> query_embedding) as similarity
  from doc_chunks c
  where (filter_client is null)
     or (c.client_id is null)
     or (c.client_id = filter_client)
  order by
    -- prefer exact client match
    case when c.client_id = filter_client then 0 else 1 end,
    c.embedding <=> query_embedding
  limit match_count
$$;
