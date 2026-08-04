-- ============================================================
-- Migration: allinea i permessi di update su chat_operator_settings
-- a quelli già usati per escalated_sessions (operator_escalated_sessions),
-- cosi' anche gli operatori con solo permesso "escalation" (non admin/backoffice)
-- possono attivare/disattivare la chat AI dall'app desktop.
-- ============================================================

drop policy if exists "chat_operator_settings_update_backoffice" on public.chat_operator_settings;
drop policy if exists "chat_operator_settings_insert_backoffice" on public.chat_operator_settings;

create policy "chat_operator_settings_update_backoffice" on public.chat_operator_settings
  for update to authenticated
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

create policy "chat_operator_settings_insert_backoffice" on public.chat_operator_settings
  for insert to authenticated
  with check (
    auth.uid() in (
      select id from public.profiles
      where role in ('admin', 'backoffice')
         or backoffice_role in ('operatore_senior', 'supervisore')
         or coalesce(permissions->>'escalation', 'false') = 'true'
    )
  );
