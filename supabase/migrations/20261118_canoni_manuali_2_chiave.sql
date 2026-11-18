-- Canoni manuali (es. Leasys), parte 2: una riga per ogni anticipo sulla stessa
-- combinazione segmento/durata/km, quindi l'anticipo entra nella chiave unique.
-- ORDINE: applicare DOPO il deploy del codice. Il codice precedente faceva
-- upsert con onConflict sulla vecchia chiave e fallirebbe; quello nuovo non usa
-- onConflict (vedi offersService.bulkUpsertConfigs) e funziona con entrambe.

ALTER TABLE public.offer_configs
  DROP CONSTRAINT IF EXISTS offer_configs_make_model_segment_duration_months_annual_km_key;

ALTER TABLE public.offer_configs
  ADD CONSTRAINT offer_configs_make_model_segment_duration_km_advance_key
  UNIQUE (make, model, segment, duration_months, annual_km, advance_payment);
