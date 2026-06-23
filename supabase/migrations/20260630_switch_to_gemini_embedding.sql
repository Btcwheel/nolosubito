-- Switch da OpenAI text-embedding-3-small (1536) a Google Gemini gemini-embedding-2 (768 via outputDimensionality)

ALTER TABLE knowledge_chunks ALTER COLUMN embedding TYPE vector(768);

DROP INDEX IF EXISTS idx_knowledge_chunks_embedding;
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
  ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 5);

CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE(id uuid, document_id uuid, content text, metadata jsonb, similarity float)
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.document_id,
    kc.content,
    kc.metadata,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
