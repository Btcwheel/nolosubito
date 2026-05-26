-- Aggiungi colonne SEO, GEO, source tracking a posts
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text,
  ADD COLUMN IF NOT EXISTS geo_region text,
  ADD COLUMN IF NOT EXISTS topic text,
  ADD COLUMN IF NOT EXISTS source_url text,
  ADD COLUMN IF NOT EXISTS source_author text,
  ADD COLUMN IF NOT EXISTS source_photo_url text,
  ADD COLUMN IF NOT EXISTS source_photo_author text,
  ADD COLUMN IF NOT EXISTS schema_markup jsonb;
