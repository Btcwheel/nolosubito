ALTER TABLE preventivi
  ADD COLUMN IF NOT EXISTS servizi text[] DEFAULT '{}';
