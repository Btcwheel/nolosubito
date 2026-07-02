-- ============================================================
-- Migration: permetti agli operatori desktop di leggere/aggiornare
-- le escalation in base al permesso escalation nel profilo.
-- ============================================================

-- Rimuovi la policy vecchia stretta (admin/backoffice solo per compatibilita')
drop policy if exists "backoffice_escalated_sessions" on public.escalated_sessions;
drop policy if exists "operator_escalated_sessions" on public.escalated_sessions;

-- Policy per operatori autenticati con permesso escalation:
-- - possono leggere tutte le sessioni in escalation
-- - possono aggiornare lo stato (prendi in carico, chiudi)
create policy "operator_escalated_sessions" on public.escalated_sessions
  for all to authenticated
  using (
    auth.uid() in (
      select id from public.profiles
      where role in ('admin', 'backoffice')
         or backoffice_role in ('operatore_senior', 'supervisore')
         or coalesce(permissions->>'escalation', 'false') = 'true'
    )
  )
  with check (
    auth.uid() in (
      select id from public.profiles
      where role in ('admin', 'backoffice')
         or backoffice_role in ('operatore_senior', 'supervisore')
         or coalesce(permissions->>'escalation', 'false') = 'true'
    )
  );

-- Nota: gli admin sono già coperti dalla policy sopra (role in ('admin', 'backoffice')).
