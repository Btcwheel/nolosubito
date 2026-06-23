-- ── Aggiunge 'ReUse' (e altri segmenti mancanti) al CHECK constraint di offer_configs ──

ALTER TABLE offer_configs DROP CONSTRAINT IF EXISTS offer_configs_segment_check;

ALTER TABLE offer_configs ADD CONSTRAINT offer_configs_segment_check
  CHECK (segment IN ('P.IVA', 'Fleet', 'Privati', 'Veicoli Commerciali', 'Moto', 'ReUse', 'ReUse-Business', 'ReUse-Privati'));