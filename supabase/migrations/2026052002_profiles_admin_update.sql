-- Permetti all'admin di aggiornare qualsiasi profilo
drop policy if exists "Admin può aggiornare tutti i profili" on profiles;
create policy "Admin può aggiornare tutti i profili"
  on profiles for update
  using (get_user_role() = 'admin')
  with check (get_user_role() = 'admin');
