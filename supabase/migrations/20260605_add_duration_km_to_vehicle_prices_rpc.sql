-- Aggiunge featured_duration_months e featured_annual_km all'RPC get_vehicle_prices
-- per mostrare i termini dell'offerta (mesi e km/anno) nelle VehicleCard
DROP FUNCTION IF EXISTS get_vehicle_prices(text);

CREATE OR REPLACE FUNCTION get_vehicle_prices(p_segment text DEFAULT NULL)
RETURNS TABLE (
  make text,
  model text,
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
    MAX(CASE WHEN is_featured THEN monthly_rent   END) AS featured_rent,
    MIN(monthly_rent)                                   AS min_rent,
    MAX(CASE WHEN is_featured THEN advance_payment END) AS featured_advance_payment,
    MAX(CASE WHEN is_featured THEN duration_months END) AS featured_duration_months,
    MAX(CASE WHEN is_featured THEN annual_km       END) AS featured_annual_km
  FROM offer_configs
  WHERE is_active = true
    AND (p_segment IS NULL OR segment = p_segment)
  GROUP BY make, model;
$$;
