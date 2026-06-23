-- Add embedding column to knowledge_chunks for pgvector similarity search
ALTER TABLE knowledge_chunks ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- IVFFlat index for cosine similarity search (lists = sqrt(n_rows) ≈ sqrt(27) ≈ 5)
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_embedding
  ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 5);

-- Trigger function to auto-embed new chunks via Supabase Database Webhook
-- The webhook (configured in Supabase Dashboard) calls the generate-embeddings Edge Function
CREATE OR REPLACE FUNCTION notify_chunk_inserted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- The actual embedding generation happens via a Database Webhook:
  -- In Supabase Dashboard → Database → Webhooks → Create webhook:
  --   Event: INSERT on knowledge_chunks
  --   Target: supabase/functions/generate-embeddings
  --   HTTP method: POST
  --   Headers: Authorization: Bearer <anon_key>
  --   Body: {"type": "INSERT", "table": "knowledge_chunks", "record": <new record>}
  RETURN NEW;
END;
$$;

-- RPC function for pgvector similarity search (used by chat-ai via supabase.rpc)
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1536),
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
