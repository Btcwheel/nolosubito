-- Aggiunge colonne backoffice al profilo operatore
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS backoffice_role  text    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS permissions      jsonb   DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active        boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS invited_by       uuid    REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invited_at       timestamptz DEFAULT NULL;
