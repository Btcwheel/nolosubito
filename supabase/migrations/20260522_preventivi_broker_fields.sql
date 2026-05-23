ALTER TABLE preventivi
  ADD COLUMN IF NOT EXISTS veicolo_versione text,
  ADD COLUMN IF NOT EXISTS colore_esterno text,
  ADD COLUMN IF NOT EXISTS interni text,
  ADD COLUMN IF NOT EXISTS cambio text,
  ADD COLUMN IF NOT EXISTS carrozzeria text,
  ADD COLUMN IF NOT EXISTS potenza integer,
  ADD COLUMN IF NOT EXISTS valore_listing numeric(10,2),
  ADD COLUMN IF NOT EXISTS valore_optional numeric(10,2),
  ADD COLUMN IF NOT EXISTS valore_accessori numeric(10,2),
  ADD COLUMN IF NOT EXISTS deposito_cauzionale numeric(10,2);
