-- ============================================================
-- Migration: allineamento schema profiles allo stato attuale
-- Aggiunge colonne mancanti in modo idempotente
-- Esegui nel SQL Editor di Supabase (sicuro, riusabile)
-- ============================================================

-- ── Timestamp columns ─────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- ── Trigger per mantenere updated_at automatico ────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ── Colonne team permissions (se mancanti) ────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS backoffice_role text
    CHECK (backoffice_role IN ('operatore_base','operatore_senior','supervisore'))
    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS permissions jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS agente_info jsonb DEFAULT '{}'::jsonb;

-- ── CHECK constraint sul role (include cms) ────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'profiles' AND constraint_name = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('admin','backoffice','agente','cliente','cms'));
  END IF;
END $$;
