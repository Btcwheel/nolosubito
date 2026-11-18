-- Canoni manuali (es. Leasys), parte 1: flag sul veicolo.
-- Con manual_pricing = true il canone salvato in offer_configs è già quello
-- finale per l'anticipo della riga, senza il ricalcolo "canone − anticipo / durata".
-- Innocua per il codice in produzione: si può applicare PRIMA del deploy
-- (serve al codice nuovo, che salva questa colonna dal CMS).

ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS manual_pricing boolean NOT NULL DEFAULT false;
