-- RPC per ottenere il prezzo aggregato per veicolo (featured o minimo)
-- Evita il limite di 1000 righe di PostgREST sulla tabella offer_configs
CREATE OR REPLACE FUNCTION get_vehicle_prices(p_segment text DEFAULT NULL)
RETURNS TABLE (make text, model text, featured_rent numeric, min_rent numeric)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    make,
    model,
    MAX(CASE WHEN is_featured THEN monthly_rent END) AS featured_rent,
    MIN(monthly_rent)                                 AS min_rent
  FROM offer_configs
  WHERE is_active = true
    AND (p_segment IS NULL OR segment = p_segment)
  GROUP BY make, model;
$$;

-- Permesso di esecuzione per ruolo anon e authenticated
GRANT EXECUTE ON FUNCTION get_vehicle_prices(text) TO anon, authenticated;
