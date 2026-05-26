-- Bucket pubblico per le immagini delle news caricate dal CMS
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'news-images',
  'news-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg','image/png','image/webp','image/gif','image/avif']
)
on conflict (id) do nothing;

-- Chiunque può leggere (pubblico)
drop policy if exists "news-images public read" on storage.objects;
create policy "news-images public read"
  on storage.objects for select
  using (bucket_id = 'news-images');

-- Solo admin e cms possono caricare
drop policy if exists "news-images cms upload" on storage.objects;
create policy "news-images cms upload"
  on storage.objects for insert
  with check (
    bucket_id = 'news-images'
    and get_user_role() in ('admin','cms')
  );

-- Solo admin e cms possono eliminare
drop policy if exists "news-images cms delete" on storage.objects;
create policy "news-images cms delete"
  on storage.objects for delete
  using (
    bucket_id = 'news-images'
    and get_user_role() in ('admin','cms')
  );
