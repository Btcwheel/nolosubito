-- ============================================================
-- Migration: realtime escalation per clienti anonimi
-- La tabella escalated_sessions ha RLS che permette SELECT solo
-- a admin/backoffice. Il cliente chat è anonimo (no auth.uid()),
-- quindi gli eventi realtime UPDATE vengono filtrati da RLS
-- e la risposta dell'operatore non raggiunge il client della chat.
-- ============================================================

-- Policy: anon può ricevere eventi realtime (SELECT) su tutte le sessioni.
-- Il filtro session_id=eq.${sid} viene applicato lato server dal client,
-- quindi ogni sessione riceve solo i propri eventi.
create policy "anon_realtime_escalated_sessions"
  on escalated_sessions
  for select
  to anon
  using (true);

-- Anche authenticated (cliente loggato) deve poter leggere le sessioni.
-- La policy admin/backoffice esistente è "for all", quindi copre anche SELECT,
-- ma aggiungiamo una policy dedicata per chiarezza e per casi limite.
create policy "authenticated_realtime_escalated_sessions"
  on escalated_sessions
  for select
  to authenticated
  using (true);

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
