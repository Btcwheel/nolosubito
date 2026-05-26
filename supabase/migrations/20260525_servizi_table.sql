-- Nolosubito — Tabella servizi + colonna servizi_richiesti
-- Crea la tabella di nomenclatura con nomi Nolosubito (neutrali)
-- e aggiunge servizi_richiesti ai preventivi per servizi on-demand

-- ── 1. Tabella servizi ────────────────────────────────────────

create table if not exists servizi (
  id              uuid default uuid_generate_v4() primary key,
  codice          text unique not null,
  nome_nolosubito text not null,
  descrizione     text,
  categoria       text check (categoria in ('Assicurativo','Manutenzione','Assistenza','Amministrativo','Accessorio','Logistica')),
  has_penale      boolean default false,
  richiedibile    boolean default false,
  ordinamento     int default 0,
  is_attivo       boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── 2. Seed: 19 servizi Nolosubito ────────────────────────────

insert into servizi (codice, nome_nolosubito, descrizione, categoria, has_penale, richiedibile, ordinamento) values
  ('RCA',              'RC Auto',                      'Responsabilità Civile Auto verso terzi',                                    'Assicurativo',  true,  false, 1),
  ('DANNI',            'Copertura Danni',               'Copertura per danni al veicolo (Kasko)',                                     'Assicurativo',  true,  false, 2),
  ('FURTO_INCENDIO',   'Furto e Incendio',              'Copertura contro furto e incendio del veicolo',                              'Assicurativo',  true,  false, 3),
  ('CRISTALLI',        'Cristalli',                     'Riparazione e sostituzione cristalli',                                       'Assicurativo',  true,  false, 4),
  ('INFORTUNI',        'Infortuni Conducente',          'Polizza assicurativa infortuni del conducente',                              'Assicurativo',  false, false, 5),
  ('TUTELA_LEGALE',    'Tutela Legale',                 'Assistenza legale e tutela giudiziaria',                                     'Assicurativo',  false, false, 6),
  ('ATMOSFERICI',      'Eventi Atmosferici',            'Copertura per eventi atmosferici e grandine',                                'Assicurativo',  true,  false, 7),
  ('MANUTENZIONE',     'Manutenzione',                  'Manutenzione ordinaria e straordinaria del veicolo',                          'Manutenzione',  false, false, 8),
  ('CAMBIO_PNEUMATICI','Cambio Pneumatici',             'Cambio stagionale e sostituzione pneumatici',                                 'Manutenzione',  false, true,  9),
  ('SOCCORSO',         'Soccorso Stradale',              'Assistenza stradale e servizio di traino',                                   'Assistenza',    false, false, 10),
  ('AUTO_SOSTITUTIVA', 'Auto Sostitutiva',              'Veicolo sostitutivo in caso di fermo per guasto o incidente',                 'Assistenza',    false, true,  11),
  ('CONSEGNA',         'Consegna Veicolo',              'Consegna del veicolo presso hub o domicilio',                                 'Logistica',     false, false, 12),
  ('BOLLO',            'Tassa di Proprietà',             'Gestione e pagamento del bollo auto (tassa automobilistica)',                'Amministrativo',false, false, 13),
  ('MULTE',            'Gestione Multe',                 'Rinotifica contravvenzioni e gestione multe',                                'Amministrativo',false, false, 14),
  ('SINISTRI',         'Gestione Sinistri',              'Supporto nella gestione e liquidazione sinistri',                             'Amministrativo',false, false, 15),
  ('FATTURAZIONE',     'Fatturazione Elettronica',      'Emissione e gestione fatturazione elettronica',                               'Amministrativo',false, false, 16),
  ('IMMATRICOLAZIONE', 'Immatricolazione',               'Pratiche di immatricolazione e messa su strada',                              'Amministrativo',false, false, 17),
  ('TELEMATICA',       'Telematica',                     'Dispositivo telematico GPS e servizi connessi',                               'Accessorio',    false, false, 18),
  ('SERVIZIO_CLIENTI', 'Servizio Clienti',               'Assistenza clienti dedicata e supporto continuativo',                         'Accessorio',    false, false, 19)
on conflict (codice) do nothing;

-- ── 3. Colonna servizi_richiesti su preventivi ────────────────

alter table preventivi
  add column if not exists servizi_richiesti jsonb default '[]'::jsonb;

comment on column preventivi.servizi_richiesti is 'Servizi richiedibili on-demand: [{codice, richiesto, prezzo}]';

-- ── 4. RLS ────────────────────────────────────────────────────

alter table servizi enable row level security;

-- Pubblica lettura
drop policy if exists "Chiunque legge i servizi" on servizi;
create policy "Chiunque legge i servizi"
  on servizi for select using (true);

-- Solo admin e backoffice gestiscono
drop policy if exists "Admin e backoffice gestiscono i servizi" on servizi;
create policy "Admin e backoffice gestiscono i servizi"
  on servizi for all using (get_user_role() in ('admin','backoffice'));
