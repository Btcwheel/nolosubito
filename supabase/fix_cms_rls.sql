-- Allinea le policy RLS del CMS con i permessi previsti dal frontend.
-- Da eseguire nel SQL Editor di Supabase sul database esistente.

drop policy if exists "Admin gestisce le offerte" on public.offers;
drop policy if exists "Admin e CMS gestiscono le offerte" on public.offers;
create policy "Admin e CMS gestiscono le offerte"
  on public.offers
  for all
  using (public.get_user_role() in ('admin','cms'))
  with check (public.get_user_role() in ('admin','cms'));

drop policy if exists "Admin gestisce i prezzi" on public.offer_configs;
drop policy if exists "Admin e CMS gestiscono i prezzi" on public.offer_configs;
create policy "Admin e CMS gestiscono i prezzi"
  on public.offer_configs
  for all
  using (public.get_user_role() in ('admin','cms'))
  with check (public.get_user_role() in ('admin','cms'));

drop policy if exists "Admin gestisce i post" on public.posts;
drop policy if exists "Admin e CMS gestiscono i post" on public.posts;
create policy "Admin e CMS gestiscono i post"
  on public.posts
  for all
  using (public.get_user_role() in ('admin','cms'))
  with check (public.get_user_role() in ('admin','cms'));

drop policy if exists "Admin gestisce immagini veicoli" on storage.objects;
drop policy if exists "Admin e CMS gestiscono immagini veicoli" on storage.objects;
create policy "Admin e CMS gestiscono immagini veicoli"
  on storage.objects
  for all
  using (bucket_id = 'vehicle-images' and public.get_user_role() in ('admin','cms'))
  with check (bucket_id = 'vehicle-images' and public.get_user_role() in ('admin','cms'));

drop policy if exists "vehicle-images admin write" on storage.objects;
drop policy if exists "vehicle-images staff write" on storage.objects;
create policy "vehicle-images staff write"
  on storage.objects
  for insert
  with check (
    bucket_id = 'vehicle-images'
    and (select role from public.profiles where id = auth.uid()) in ('admin','cms')
  );

drop policy if exists "vehicle-images admin update" on storage.objects;
drop policy if exists "vehicle-images staff update" on storage.objects;
create policy "vehicle-images staff update"
  on storage.objects
  for update
  using (
    bucket_id = 'vehicle-images'
    and (select role from public.profiles where id = auth.uid()) in ('admin','cms')
  )
  with check (
    bucket_id = 'vehicle-images'
    and (select role from public.profiles where id = auth.uid()) in ('admin','cms')
  );

drop policy if exists "vehicle-images admin delete" on storage.objects;
drop policy if exists "vehicle-images staff delete" on storage.objects;
create policy "vehicle-images staff delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'vehicle-images'
    and (select role from public.profiles where id = auth.uid()) in ('admin','cms')
  );
