-- ============================================================
-- Knowledge Base di Luca
-- Tabelle per i documenti e i chunk usati dall'agente AI Luca
-- ============================================================

-- Documenti sorgente (PDF, testi manuali, correzioni operatore)
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title       text NOT NULL,
  content     text NOT NULL,
  source      text NOT NULL DEFAULT 'manual',
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Chunk indicizzati (porzioni di ~800 char usate per full-text search)
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  content     text NOT NULL,
  metadata    jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Indice full-text per la ricerca in chat-ai
CREATE INDEX IF NOT EXISTS idx_knowledge_chunks_fts
  ON knowledge_chunks USING gin(to_tsvector('italian', content));

-- Trigger per updated_at su knowledge_documents
CREATE OR REPLACE FUNCTION update_knowledge_documents_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_knowledge_documents_updated_at ON knowledge_documents;
CREATE TRIGGER trg_knowledge_documents_updated_at
  BEFORE UPDATE ON knowledge_documents
  FOR EACH ROW EXECUTE FUNCTION update_knowledge_documents_updated_at();

-- ── RLS ────────────────────────────────────────────────────
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks    ENABLE ROW LEVEL SECURITY;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'knowledge_documents' and policyname = 'backoffice_read_knowledge_documents') then
    CREATE POLICY "backoffice_read_knowledge_documents"
      ON knowledge_documents FOR SELECT
      TO authenticated
      USING (is_active = true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'knowledge_documents' and policyname = 'backoffice_insert_knowledge_documents') then
    CREATE POLICY "backoffice_insert_knowledge_documents"
      ON knowledge_documents FOR INSERT
      TO authenticated
      WITH CHECK (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'knowledge_documents' and policyname = 'backoffice_update_knowledge_documents') then
    CREATE POLICY "backoffice_update_knowledge_documents"
      ON knowledge_documents FOR UPDATE
      TO authenticated
      USING (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'knowledge_chunks' and policyname = 'service_role_all_knowledge_chunks') then
    CREATE POLICY "service_role_all_knowledge_chunks"
      ON knowledge_chunks FOR ALL
      TO service_role
      USING (true)
      WITH CHECK (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'knowledge_chunks' and policyname = 'authenticated_read_knowledge_chunks') then
    CREATE POLICY "authenticated_read_knowledge_chunks"
      ON knowledge_chunks FOR SELECT
      TO authenticated
      USING (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'knowledge_chunks' and policyname = 'authenticated_insert_knowledge_chunks') then
    CREATE POLICY "authenticated_insert_knowledge_chunks"
      ON knowledge_chunks FOR INSERT
      TO authenticated
      WITH CHECK (true);
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'knowledge_chunks' and policyname = 'authenticated_delete_knowledge_chunks') then
    CREATE POLICY "authenticated_delete_knowledge_chunks"
      ON knowledge_chunks FOR DELETE
      TO authenticated
      USING (true);
  end if;
end $$;
