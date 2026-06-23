-- ============================================================
-- Migration: realtime escalation per clienti anonimi
-- La tabella escalated_sessions ha RLS che permette SELECT solo
-- a admin/backoffice. Il cliente chat è anonimo (no auth.uid()),
-- quindi gli eventi realtime UPDATE vengono filtrati da RLS
-- e la risposta dell'operatore non raggiunge il client della chat.
-- ============================================================

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'escalated_sessions'
      and policyname = 'anon_realtime_escalated_sessions'
  ) then
    create policy "anon_realtime_escalated_sessions"
      on escalated_sessions for select to anon using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'escalated_sessions'
      and policyname = 'authenticated_realtime_escalated_sessions'
  ) then
    create policy "authenticated_realtime_escalated_sessions"
      on escalated_sessions for select to authenticated using (true);
  end if;
end $$;

-- Verifica che realtime sia abilitato sulla tabella
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename = 'escalated_sessions'
  ) then
    alter publication supabase_realtime add table escalated_sessions;
  end if;
end $$;
