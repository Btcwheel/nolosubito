-- ─ Site Settings: tabella key-value per impostazioni globali ─────────────────

CREATE TABLE IF NOT EXISTS site_settings (
  key   text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'
);

-- RLS: lettura pubblica (serve al middleware edge)
DROP POLICY IF EXISTS "site-settings public read" ON site_settings;
CREATE POLICY "site-settings public read"
  ON site_settings FOR SELECT
  USING (true);

-- RLS: scrittura solo per staff autenticato
DROP POLICY IF EXISTS "site-settings staff write" ON site_settings;
CREATE POLICY "site-settings staff write"
  ON site_settings FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── Storage: bucket site-images (OG image + Hero image) ──────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "site-images public read" ON storage.objects;
CREATE POLICY "site-images public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-images');

DROP POLICY IF EXISTS "site-images staff write" ON storage.objects;
CREATE POLICY "site-images staff write"
  ON storage.objects FOR ALL
  USING (bucket_id = 'site-images' AND auth.role() = 'authenticated')
  WITH CHECK (bucket_id = 'site-images' AND auth.role() = 'authenticated');

-- ── Seed: valori di default ──────────────────────────────────────────────────

INSERT INTO site_settings (key, value)
VALUES (
  'seo_homepage',
  '{
    "title": "Nolosubito | Noleggio Lungo Termine",
    "description": "Scopri le migliori offerte di Noleggio Lungo Termine per Aziende e Privati. Preventivi veloci e canoni trasparenti.",
    "og_image_url": ""
  }'::jsonb
)
ON CONFLICT (key) DO NOTHING;

INSERT INTO site_settings (key, value)
VALUES (
  'hero_image',
  '{"url": ""}'::jsonb
)
ON CONFLICT (key) DO NOTHING;
