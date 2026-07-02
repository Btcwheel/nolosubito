-- ============================================================
-- Luca Escalation System
-- Esegui nel SQL Editor di Supabase
-- ============================================================

-- ── Estensioni necessarie ────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Knowledge Documents (documenti caricati dal backoffice) ──
create table if not exists knowledge_documents (
  id          uuid default uuid_generate_v4() primary key,
  title       text not null,
  content     text not null,
  source      text,                        -- 'manual' | 'upload' | 'operator_answer'
  created_by  uuid references profiles(id) on delete set null,
  is_active   boolean default true,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── Knowledge Chunks (paragrafi indicizzabili) ───────────────
create table if not exists knowledge_chunks (
  id          uuid default uuid_generate_v4() primary key,
  document_id uuid references knowledge_documents(id) on delete cascade,
  content     text not null,
  metadata    jsonb default '{}',          -- { "page": 1, "section": "recesso" }
  created_at  timestamptz default now()
);

-- ── Escalated Sessions (chat dove Luca non sa rispondere) ────
create table if not exists escalated_sessions (
  id                uuid default uuid_generate_v4() primary key,
  session_id        text not null,         -- ID univoco della sessione chat lato client
  user_question     text not null,         -- la domanda che ha mandato in crisi Luca
  chat_history      jsonb default '[]',    -- tutta la chat fino all'escalation
  status            text not null default 'waiting'
                      check (status in ('waiting','operator_joined','resolved','contact_left')),
  -- Operatore
  operator_id       uuid references profiles(id) on delete set null,
  operator_answer   text,                  -- risposta scritta dall'operatore
  -- Recapito lasciato dal cliente
  contact_name      text,
  contact_phone     text,
  contact_email     text,
  -- Timestamps
  created_at        timestamptz default now(),
  taken_at          timestamptz,           -- quando l'operatore ha cliccato "Prendi in carico"
  resolved_at       timestamptz,           -- quando la chat è stata chiusa/risolta
  -- Training
  added_to_kb       boolean default false  -- se la risposta è stata aggiunta alla knowledge base
);

-- ── Indici ───────────────────────────────────────────────────
create index if not exists idx_escalated_sessions_status     on escalated_sessions(status);
create index if not exists idx_escalated_sessions_session_id on escalated_sessions(session_id);
create index if not exists idx_knowledge_chunks_document_id  on knowledge_chunks(document_id);
create index if not exists idx_knowledge_chunks_fts          on knowledge_chunks using gin(to_tsvector('italian', content));

-- ── RLS ──────────────────────────────────────────────────────
alter table knowledge_documents  enable row level security;
alter table knowledge_chunks     enable row level security;
alter table escalated_sessions   enable row level security;

-- knowledge_documents: backoffice e admin leggono/scrivono
create policy "backoffice_knowledge_documents" on knowledge_documents
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'backoffice')
    )
  );

-- knowledge_chunks: backoffice e admin leggono/scrivono
create policy "backoffice_knowledge_chunks" on knowledge_chunks
  for all using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'backoffice')
    )
  );

-- escalated_sessions: admin, backoffice e operatori con permesso escalation
-- possono leggere/aggiornare le sessioni (prendi in carico, chiudi).
create policy "operator_escalated_sessions" on escalated_sessions
  for all to authenticated
  using (
    auth.uid() in (
      select id from profiles
      where role in ('admin', 'backoffice')
         or backoffice_role in ('operatore_senior', 'supervisore')
         or coalesce(permissions->>'escalation', 'false') = 'true'
    )
  )
  with check (
    auth.uid() in (
      select id from profiles
      where role in ('admin', 'backoffice')
         or backoffice_role in ('operatore_senior', 'supervisore')
         or coalesce(permissions->>'escalation', 'false') = 'true'
    )
  );

-- escalated_sessions: service_role (Edge Functions) può fare tutto — bypassa RLS automaticamente

-- ── Realtime ─────────────────────────────────────────────────
-- Abilita Realtime sulla tabella escalated_sessions
-- (da fare anche nella dashboard Supabase: Database → Replication → escalated_sessions)
alter publication supabase_realtime add table escalated_sessions;
