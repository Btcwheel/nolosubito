-- ── Permessi team backoffice ─────────────────────────────────────────────────
-- Aggiunge colonne a profiles per ruolo base backoffice e override moduli

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS backoffice_role text
    CHECK (backoffice_role IN ('operatore_base','operatore_senior','supervisore'))
    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invited_at timestamptz;

-- Permessi default per ruolo
-- {
--   "pratiche": true/false,
--   "lead": true/false,
--   "escalation": true/false,
--   "knowledge_base": true/false,
--   "preventivi": true/false,
--   "report": true/false
-- }

COMMENT ON COLUMN profiles.backoffice_role IS 'Ruolo base per operatori backoffice';
COMMENT ON COLUMN profiles.permissions IS 'Override permessi per modulo: pratiche, lead, escalation, knowledge_base, preventivi, report';
COMMENT ON COLUMN profiles.is_active IS 'Account attivo/disattivato (non elimina l utente)';
