-- Aggiunge featured_advance_payment all'RPC get_vehicle_prices
-- per mostrare l'anticipo della config in evidenza nelle card della gallery
DROP FUNCTION IF EXISTS get_vehicle_prices(text);

CREATE OR REPLACE FUNCTION get_vehicle_prices(p_segment text DEFAULT NULL)
RETURNS TABLE (make text, model text, featured_rent numeric, min_rent numeric, featured_advance_payment numeric)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    make,
    model,
    MAX(CASE WHEN is_featured THEN monthly_rent   END) AS featured_rent,
    MIN(monthly_rent)                                   AS min_rent,
    MAX(CASE WHEN is_featured THEN advance_payment END) AS featured_advance_payment
  FROM offer_configs
  WHERE is_active = true
    AND (p_segment IS NULL OR segment = p_segment)
  GROUP BY make, model;
$$;
