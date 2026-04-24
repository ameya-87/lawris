-- Hybrid retrieval migration — paste into Supabase SQL Editor and run.
-- Creates two new RPCs used by retrieveCorpusChunksHybrid:
--   1. match_corpus_stratified — top-K per source_type (statute + judgment), then ORDER BY similarity
--   2. match_corpus_keyword    — exact ILIKE matches against statute chunks (for section-number boosting)
-- Assumes the existing corpus_chunks table with vector(768) embedding column.

create or replace function match_corpus_stratified(
  query_embedding vector(768),
  per_type_count int default 3
)
returns table (
  content text,
  source_name text,
  section_reference text,
  category text,
  source_type text,
  similarity float
)
language sql as $$
  (
    select
      content, source_name, section_reference, category, source_type,
      1 - (embedding <=> query_embedding) as similarity
    from corpus_chunks
    where source_type = 'statute'
    order by embedding <=> query_embedding
    limit per_type_count
  )
  union all
  (
    select
      content, source_name, section_reference, category, source_type,
      1 - (embedding <=> query_embedding) as similarity
    from corpus_chunks
    where source_type = 'judgment'
    order by embedding <=> query_embedding
    limit per_type_count
  )
  order by similarity desc;
$$;

create or replace function match_corpus_keyword(
  keyword_pattern text,
  match_count int default 3
)
returns table (
  content text,
  source_name text,
  section_reference text,
  category text,
  source_type text,
  similarity float
)
language sql as $$
  select
    content, source_name, section_reference, category, source_type,
    1.0::float as similarity
  from corpus_chunks
  where content ilike keyword_pattern
    and source_type = 'statute'
  limit match_count;
$$;
