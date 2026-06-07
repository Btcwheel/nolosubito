-- ── Segmentazione ReUse per Privati e Business ──────────────────────────────
-- Aggiunge due nuovi valori al CHECK constraint di offer_configs:
--   'ReUse-Privati'  → offerte usate visibili nella listing Privati
--   'ReUse-Business' → offerte usate visibili nella listing Aziende/P.IVA
-- Il valore 'ReUse' resta come "legacy" per le offerte create prima di questa migration.

ALTER TABLE offer_configs DROP CONSTRAINT IF EXISTS offer_configs_segment_check;

ALTER TABLE offer_configs ADD CONSTRAINT offer_configs_segment_check
  CHECK (segment IN (
    'P.IVA', 'Fleet', 'Privati',
    'Veicoli Commerciali', 'Moto',
    'ReUse', 'ReUse-Privati', 'ReUse-Business'
  ));

-- ── Aggiorna RPC: accetta text[] per supportare segmenti multipli ────────────
-- Esempi d'uso dal client:
--   get_vehicle_prices({ p_segments: ['P.IVA', 'ReUse-Business'] })  -- BusinessOffers
--   get_vehicle_prices({ p_segments: ['Privati', 'ReUse-Privati'] }) -- PrivateOffers
--   get_vehicle_prices({ p_segments: ['ReUse', 'ReUse-Privati', 'ReUse-Business'] }) -- /reuse
--   get_vehicle_prices({ p_segments: null })                       -- tutti
-- Ritorna anche `segment` cosi' il client puo' distinguere ReUse da P.IVA nello stesso listing.

DROP FUNCTION IF EXISTS get_vehicle_prices(text);

CREATE OR REPLACE FUNCTION get_vehicle_prices(p_segments text[] DEFAULT NULL)
RETURNS TABLE (
  make text,
  model text,
  segment text,
  featured_rent numeric,
  min_rent numeric,
  featured_advance_payment numeric,
  featured_duration_months integer,
  featured_annual_km integer
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    make,
    model,
    segment,
    MAX(CASE WHEN is_featured THEN monthly_rent   END) AS featured_rent,
    MIN(monthly_rent)                                   AS min_rent,
    MAX(CASE WHEN is_featured THEN advance_payment END) AS featured_advance_payment,
    MAX(CASE WHEN is_featured THEN duration_months END) AS featured_duration_months,
    MAX(CASE WHEN is_featured THEN annual_km       END) AS featured_annual_km
  FROM offer_configs
  WHERE is_active = true
    AND (p_segments IS NULL OR segment = ANY(p_segments))
  GROUP BY make, model, segment;
$$;
