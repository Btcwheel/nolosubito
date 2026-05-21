-- Colonna per il PDF originale del carrier
ALTER TABLE preventivi
  ADD COLUMN IF NOT EXISTS documento_broker_url text,
  ADD COLUMN IF NOT EXISTS documento_broker_nome text;

-- Bucket privato per i PDF broker dei preventivi
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'preventivi-broker',
  'preventivi-broker',
  false,
  10485760, -- 10 MB
  array['application/pdf','image/jpeg','image/png','image/webp']
)
on conflict (id) do nothing;

-- Solo utenti autenticati con ruolo interno possono caricare
create policy "preventivi-broker upload"
  on storage.objects for insert
  with check (
    bucket_id = 'preventivi-broker'
    and get_user_role() in ('admin','backoffice','agente')
  );

-- Solo utenti autenticati con ruolo interno possono leggere
create policy "preventivi-broker read"
  on storage.objects for select
  using (
    bucket_id = 'preventivi-broker'
    and get_user_role() in ('admin','backoffice','agente')
  );

-- Solo admin e backoffice possono eliminare
create policy "preventivi-broker delete"
  on storage.objects for delete
  using (
    bucket_id = 'preventivi-broker'
    and get_user_role() in ('admin','backoffice')
  );
