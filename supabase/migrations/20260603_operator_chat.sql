-- ============================================================
-- Migration: operator_chat_messages
-- Conversazione bidirezionale operatore ↔ cliente durante escalation
-- Sostituisce il vecchio modello one-shot con supporto multi-messaggio
-- ============================================================

create table if not exists public.operator_chat_messages (
  id          uuid primary key default gen_random_uuid(),
  session_id  text not null,                              -- match con chat session_id
  sender      text not null check (sender in ('operator','customer')),
  operator_id uuid references public.profiles(id) on delete set null,
  content     text not null,
  created_at  timestamptz default now()
);

create index if not exists idx_op_chat_session_created
  on public.operator_chat_messages(session_id, created_at);

-- ── RLS ──────────────────────────────────────────────────────
alter table public.operator_chat_messages enable row level security;

-- Cliente anonimo: può scrivere solo come 'customer' e leggere la propria sessione
drop policy if exists "anon_op_chat_select" on public.operator_chat_messages;
create policy "anon_op_chat_select" on public.operator_chat_messages
  for select to anon using (true);

drop policy if exists "anon_op_chat_insert_customer" on public.operator_chat_messages;
create policy "anon_op_chat_insert_customer" on public.operator_chat_messages
  for insert to anon
  with check (sender = 'customer');

-- Authenticated (cliente loggato + operatori): pieno accesso
drop policy if exists "authenticated_op_chat_all" on public.operator_chat_messages;
create policy "authenticated_op_chat_all" on public.operator_chat_messages
  for all to authenticated
  using (true) with check (true);

-- ── Realtime ─────────────────────────────────────────────────
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename = 'operator_chat_messages'
  ) then
    alter publication supabase_realtime add table operator_chat_messages;
  end if;
end $$;
