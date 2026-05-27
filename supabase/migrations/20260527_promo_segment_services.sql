-- Aggiunge segmento target e testo servizi aggiuntivi alla promo
ALTER TABLE offers
  ADD COLUMN IF NOT EXISTS promo_segment  text DEFAULT NULL,  -- 'P.IVA' | 'Privati' | NULL (entrambi)
  ADD COLUMN IF NOT EXISTS promo_services text DEFAULT NULL;  -- es. "I primi 3 mesi sono gratis"
