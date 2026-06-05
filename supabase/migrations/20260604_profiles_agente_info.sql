-- ============================================================
-- Migration: colonne agente_info su profiles
-- Aggiunge la colonna jsonb se non esiste (idempotente)
-- Esegui nel SQL Editor di Supabase
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS agente_info jsonb DEFAULT '{}'::jsonb;

COMMENT ON COLUMN profiles.agente_info IS 'Info aggiuntive agente: partita IVA, agenzia, contatti, ecc.';
