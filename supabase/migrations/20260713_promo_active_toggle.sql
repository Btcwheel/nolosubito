-- Aggiunge un flag manuale indipendente dalla data di scadenza, per poter
-- disattivare/riattivare una promo dal CMS senza perdere sconto/data/servizi
-- già configurati (prima l'unico modo per "spegnere" una promo era cancellarla).
ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS promo_active boolean NOT NULL DEFAULT true;

-- Indice mirato alla query "c'è una promo attiva?" usata dalla home per
-- decidere in modo economico se caricare la sezione promo, senza dover
-- interrogare l'intero catalogo + RPC prezzi quando non c'è nessuna promo.
DROP INDEX IF EXISTS idx_offers_promo_expires_at;
CREATE INDEX IF NOT EXISTS idx_offers_active_promo ON offers (promo_expires_at)
  WHERE promo_active = true AND promo_expires_at IS NOT NULL;
