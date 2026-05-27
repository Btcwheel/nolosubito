-- Aggiunge campi promozione a tempo sulla tabella offers
ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS promo_expires_at  timestamptz DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS promo_discount_pct numeric(5,2) DEFAULT NULL;

-- Index per query veloci su promozioni attive
CREATE INDEX IF NOT EXISTS idx_offers_promo_expires_at ON offers (promo_expires_at)
  WHERE promo_expires_at IS NOT NULL;
