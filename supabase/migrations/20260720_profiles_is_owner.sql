-- ============================================================
-- Migration: introduce il flag is_owner su profiles
-- Distingue il titolare (unico che puo' invitare nuovi Admin
-- dalla pagina Team) dagli altri account con role='admin',
-- che restano equivalenti a tutti gli altri effetti.
-- ============================================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_owner boolean NOT NULL DEFAULT false;

UPDATE public.profiles
SET is_owner = true
WHERE email = 'lcoccimiglio@gmail.com';

-- Verifica
SELECT email, role, is_owner
FROM public.profiles
WHERE role = 'admin'
ORDER BY is_owner DESC;
