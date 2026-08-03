-- ============================================================
-- Migration: aggiunge richiesta_tipo su pratiche
-- Distingue le richieste che bloccano l'offerta esatta della box
-- (marca, modello, mesi, km, anticipo fissi) dalle richieste
-- personalizzate compilate liberamente dal cliente, cosi'
-- l'operatore in backoffice vede subito di che tipo si tratta.
-- ============================================================

ALTER TABLE public.pratiche
  ADD COLUMN IF NOT EXISTS richiesta_tipo text NOT NULL DEFAULT 'personalizzata'
    CHECK (richiesta_tipo IN ('bloccata', 'personalizzata'));
