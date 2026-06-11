-- ==============================================================================
-- FIX PERMESSI BACKOFFICE SUL CMS E STORAGE
-- ==============================================================================
-- Questo script aggiunge il ruolo "backoffice" (assegnato ad operatori come
-- s.galdieri) a tutte le policy del CMS e dello Storage, permettendo loro di:
-- 1. Caricare e modificare immagini dei veicoli.
-- 2. Caricare e modificare immagini delle news.
-- 3. Gestire Offerte, Prezzi e Articoli.
-- 4. Caricare e gestire Materiali (PDF per agenti).
-- ==============================================================================

-- 1. OFFERS (Veicoli)
DROP POLICY IF EXISTS "Admin e CMS gestiscono le offerte" ON public.offers;
CREATE POLICY "Admin e CMS gestiscono le offerte"
  ON public.offers FOR ALL
  USING (public.get_user_role() IN ('admin','cms','backoffice'))
  WITH CHECK (public.get_user_role() IN ('admin','cms','backoffice'));

-- 2. OFFER CONFIGS (Prezzi e configurazioni)
DROP POLICY IF EXISTS "Admin e CMS gestiscono i prezzi" ON public.offer_configs;
CREATE POLICY "Admin e CMS gestiscono i prezzi"
  ON public.offer_configs FOR ALL
  USING (public.get_user_role() IN ('admin','cms','backoffice'))
  WITH CHECK (public.get_user_role() IN ('admin','cms','backoffice'));

-- 3. POSTS (News e articoli)
DROP POLICY IF EXISTS "Admin e CMS gestiscono i post" ON public.posts;
CREATE POLICY "Admin e CMS gestiscono i post"
  ON public.posts FOR ALL
  USING (public.get_user_role() IN ('admin','cms','backoffice'))
  WITH CHECK (public.get_user_role() IN ('admin','cms','backoffice'));

-- 4. MATERIALI (PDF per agenti)
DROP POLICY IF EXISTS "Admin gestisce i materiali" ON public.materiali;
CREATE POLICY "Admin gestisce i materiali"
  ON public.materiali FOR ALL
  USING (public.get_user_role() IN ('admin','backoffice'))
  WITH CHECK (public.get_user_role() IN ('admin','backoffice'));

-- 5. STORAGE BUCKET: VEHICLE IMAGES
DROP POLICY IF EXISTS "Admin e CMS gestiscono immagini veicoli" ON storage.objects;
CREATE POLICY "Admin e CMS gestiscono immagini veicoli"
  ON storage.objects FOR ALL
  USING (bucket_id = 'vehicle-images' AND public.get_user_role() IN ('admin','cms','backoffice'))
  WITH CHECK (bucket_id = 'vehicle-images' AND public.get_user_role() IN ('admin','cms','backoffice'));

DROP POLICY IF EXISTS "vehicle-images staff write" ON storage.objects;
CREATE POLICY "vehicle-images staff write"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'vehicle-images' AND public.get_user_role() IN ('admin','cms','backoffice'));

DROP POLICY IF EXISTS "vehicle-images staff update" ON storage.objects;
CREATE POLICY "vehicle-images staff update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'vehicle-images' AND public.get_user_role() IN ('admin','cms','backoffice'))
  WITH CHECK (bucket_id = 'vehicle-images' AND public.get_user_role() IN ('admin','cms','backoffice'));

DROP POLICY IF EXISTS "vehicle-images staff delete" ON storage.objects;
CREATE POLICY "vehicle-images staff delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'vehicle-images' AND public.get_user_role() IN ('admin','cms','backoffice'));

-- 6. STORAGE BUCKET: NEWS IMAGES
DROP POLICY IF EXISTS "news-images cms upload" ON storage.objects;
CREATE POLICY "news-images cms upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'news-images' AND public.get_user_role() IN ('admin','cms','backoffice'));

DROP POLICY IF EXISTS "news-images cms delete" ON storage.objects;
CREATE POLICY "news-images cms delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'news-images' AND public.get_user_role() IN ('admin','cms','backoffice'));

-- 7. STORAGE BUCKET: MATERIALI
DROP POLICY IF EXISTS "Admin gestisce materiali storage" ON storage.objects;
CREATE POLICY "Admin gestisce materiali storage"
  ON storage.objects FOR ALL
  USING (bucket_id = 'materiali' AND public.get_user_role() IN ('admin','backoffice'))
  WITH CHECK (bucket_id = 'materiali' AND public.get_user_role() IN ('admin','backoffice'));
