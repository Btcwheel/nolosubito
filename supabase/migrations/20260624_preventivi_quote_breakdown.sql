-- Nolosubito — Aggiunge quota_veicolo e quota_servizi ai preventivi
-- Questi campi vengono estratti dal PDF broker originale e sostituiscono
-- la vecchia suddivisione 67/33 calcolata artificialmente

alter table preventivi
  add column if not exists quota_veicolo numeric(10,2),
  add column if not exists quota_servizi numeric(10,2);

comment on column preventivi.quota_veicolo is 'Quota canone relativa al veicolo (IVA inclusa) — dal preventivo broker originale';
comment on column preventivi.quota_servizi is 'Quota canone relativa ai servizi (IVA inclusa) — dal preventivo broker originale';
