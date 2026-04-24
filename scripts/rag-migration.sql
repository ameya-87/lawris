-- RAG retrieval RPC — run once in Supabase SQL Editor after migrate.sql.
-- Assumes:
--   * pgvector extension is enabled (Supabase has this by default)
--   * document_chunks table exists with an `embedding vector(768)` column,
--     case_id uuid, document_id uuid, chunk_index int, content text.
--
-- The research route calls this via supabase.rpc('match_chunks', ...).
-- Cosine similarity (0 = unrelated, 1 = identical) is returned as
-- 1 - (embedding <=> query_embedding) so higher is better.

create or replace function match_chunks(
  query_embedding vector(768),
  match_case_id uuid,
  match_count int default 5
)
returns table (
  content text,
  chunk_index int,
  document_id uuid,
  similarity float
)
language sql
stable
as $$
  select
    dc.content,
    dc.chunk_index,
    dc.document_id,
    1 - (dc.embedding <=> query_embedding) as similarity
  from document_chunks dc
  where dc.case_id = match_case_id
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;
