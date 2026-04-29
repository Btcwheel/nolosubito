-- ============================================================
-- NoloSubito — Schema Supabase
-- Esegui questo script nel SQL Editor di Supabase
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Profiles (estende auth.users) ───────────────────────────
create table if not exists profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  email         text unique not null,
  full_name     text,
  avatar_url    text,
  role          text not null default 'cliente'
                  check (role in ('admin','backoffice','agente','cliente','cms')),
  agente_info   jsonb default '{}',  -- partita IVA, agenzia, ecc.
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Trigger: crea profile automaticamente al signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'cliente')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Offers (catalogo veicoli) ────────────────────────────────
create table if not exists offers (
  id              uuid default uuid_generate_v4() primary key,
  make            text not null,
  model           text not null,
  category        text not null
                    check (category in ('Business Sedan','Business SUV','Electric Exec',
                                        'Electric SUV','Commercial Van','Premium Sedan','Compact Business')),
  fuel_type       text check (fuel_type in ('Diesel','Petrol','Electric','Hybrid')),
  transmission    text check (transmission in ('Automatic','Manual')),
  power_hp        integer,
  co2_emissions   integer,
  vehicle_image   text,
  features        text[] default '{}',
  description     text,
  is_active       boolean default true,
  is_featured     boolean default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now(),
  unique (make, model)
);

-- ── Offer Configs (prezzi QuoteBox) ─────────────────────────
-- Una riga per ogni combinazione make/model/segment/durata/km
create table if not exists offer_configs (
  id              uuid default uuid_generate_v4() primary key,
  make            text not null,
  model           text not null,
  segment         text not null check (segment in ('P.IVA','Fleet','Privati')),
  duration_months integer not null,
  annual_km       integer not null,
  advance_payment numeric(10,2) default 0,
  monthly_rent    numeric(10,2) not null,
  is_active       boolean default true,
  created_at      timestamptz default now(),
  unique (make, model, segment, duration_months, annual_km)
);

-- ── Posts (news pubbliche) ───────────────────────────────────
create table if not exists posts (
  id              uuid default uuid_generate_v4() primary key,
  title           text not null,
  slug            text unique not null,
  summary         text not null,
  content         text not null,
  cover_image_url text,
  category        text check (category in ('Notizie','Approfondimenti','Offerte','Green Mobility','Azienda')),
  published_date  timestamptz default now(),
  is_published    boolean default true,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

-- ── Pratiche ────────────────────────────────────────────────
create table if not exists pratiche (
  id                          uuid default uuid_generate_v4() primary key,
  codice                      text unique not null,
  status                      text not null default 'Nuova'
                                check (status in (
                                  'Nuova','In Lavorazione','Documenti Richiesti','Documenti Caricati',
                                  'Attesa Affidamento Finanziaria','Affidamento Ricevuto',
                                  'Stipula Contratto','Attesa Consegna','Approvata','Consegnata','Chiusa'
                                )),
  -- Cliente
  cliente_nome                text not null,
  cliente_cognome             text,
  cliente_email               text not null,
  cliente_telefono            text,
  cliente_tipo                text check (cliente_tipo in ('Privato','P.IVA','Azienda')),
  cliente_cf                  text,
  cliente_piva                text,
  cliente_denominazione       text,
  cliente_indirizzo           text,
  cliente_citta               text,
  cliente_provincia           text,
  cliente_cap                 text,
  cliente_occupazione         text,
  cliente_tipo_contratto      text,
  cliente_garante             boolean,
  cliente_anno_inizio_lavoro  integer,
  cliente_residente_italia    boolean default true,
  -- Veicolo
  veicolo_marca               text,
  veicolo_modello             text,
  veicolo_alimentazione       text,
  segmento                    text check (segmento in ('P.IVA','Fleet','Privati')),
  durata_mesi                 integer,
  km_annui                    integer,
  anticipo                    numeric(10,2),
  canone_mensile              numeric(10,2),
  canone_finale               numeric(10,2),  -- definito dopo master broker
  -- Agente
  agente_id                   uuid references profiles(id),
  agente_nome                 text,
  provvigione                 numeric(10,2),          -- importo fisso definito da admin
  provvigione_pagata          boolean default false,  -- segnata come pagata dall'admin
  -- AI check
  ai_check_status             text default 'pending'
                                check (ai_check_status in ('pending','passed','failed','skipped')),
  ai_check_issues             jsonb default '[]',
  -- Meta
  note_cliente                text,
  access_token                uuid default uuid_generate_v4() unique,
  ultimo_aggiornamento_stato  timestamptz default now(),
  created_at                  timestamptz default now(),
  updated_at                  timestamptz default now()
);

-- ── Pratica Documenti ────────────────────────────────────────
create table if not exists pratica_documenti (
  id              uuid default uuid_generate_v4() primary key,
  pratica_id      uuid references pratiche(id) on delete cascade not null,
  nome_file       text not null,
  tipo_documento  text not null,
  file_url        text,
  storage_path    text,
  stato_verifica  text default 'In attesa'
                    check (stato_verifica in ('In attesa','Verificato','Rifiutato','Da rifare')),
  note_verifica   text,
  caricato_da     text,
  created_at      timestamptz default now()
);

-- ── Pratica Note ─────────────────────────────────────────────
create table if not exists pratica_note (
  id                uuid default uuid_generate_v4() primary key,
  pratica_id        uuid references pratiche(id) on delete cascade not null,
  autore_nome       text not null,
  autore_ruolo      text check (autore_ruolo in ('admin','backoffice','agente','cliente','sistema')),
  testo             text not null,
  visibile_cliente  boolean default false,
  created_at        timestamptz default now()
);

-- ── Materiali (PDF admin → agenti) ───────────────────────────
create table if not exists materiali (
  id            uuid default uuid_generate_v4() primary key,
  titolo        text not null,
  descrizione   text,
  tipo          text not null
                  check (tipo in ('Listino','Canvass','Offerta a Tempo','Comunicazione')),
  file_url      text not null,
  storage_path  text,
  visibilita    text not null default 'tutti'
                  check (visibilita in ('tutti','selezionati')),
  is_active     boolean default true,
  expires_at    timestamptz,  -- per offerte a tempo
  created_at    timestamptz default now()
);

-- ── Materiale Visibilità (selettiva per agente) ──────────────
create table if not exists materiale_visibilita (
  materiale_id  uuid references materiali(id) on delete cascade,
  agente_id     uuid references profiles(id) on delete cascade,
  primary key (materiale_id, agente_id)
);

-- ── Leads (da AI chat) ───────────────────────────────────────
create table if not exists leads (
  id              uuid default uuid_generate_v4() primary key,
  nome            text,
  email           text,
  telefono        text,
  tipo_cliente    text check (tipo_cliente in ('Privato','P.IVA','Azienda')),
  interesse       text,
  chat_history    jsonb default '[]',
  status          text default 'Nuovo'
                    check (status in ('Nuovo','Contattato','Convertito','Non qualificato')),
  source          text default 'chat',
  created_at      timestamptz default now()
);

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

alter table profiles enable row level security;
alter table offers enable row level security;
alter table offer_configs enable row level security;
alter table posts enable row level security;
alter table pratiche enable row level security;
alter table pratica_documenti enable row level security;
alter table pratica_note enable row level security;
alter table materiali enable row level security;
alter table materiale_visibilita enable row level security;
alter table leads enable row level security;

-- Helper: ruolo utente corrente
create or replace function get_user_role()
returns text language sql security definer as $$
  select role from profiles where id = auth.uid();
$$;

-- ── RLS Profiles ─────────────────────────────────────────────
create policy "Utente vede il proprio profilo"
  on profiles for select using (id = auth.uid());

create policy "Admin vede tutti i profili"
  on profiles for select using (get_user_role() in ('admin','backoffice'));

create policy "Utente aggiorna il proprio profilo"
  on profiles for update using (id = auth.uid());

-- ── RLS Offers (pubbliche in lettura) ────────────────────────
create policy "Chiunque legge le offerte attive"
  on offers for select using (is_active = true);

create policy "Admin e CMS gestiscono le offerte"
  on offers for all using (get_user_role() in ('admin','cms'));

-- ── RLS Offer Configs (pubbliche in lettura) ─────────────────
create policy "Chiunque legge i prezzi attivi"
  on offer_configs for select using (is_active = true);

create policy "Admin e CMS gestiscono i prezzi"
  on offer_configs for all using (get_user_role() in ('admin','cms'));

-- ── RLS Posts (pubbliche in lettura) ─────────────────────────
create policy "Chiunque legge i post pubblicati"
  on posts for select using (is_published = true);

create policy "Admin e CMS gestiscono i post"
  on posts for all using (get_user_role() in ('admin','cms'));

-- ── RLS Pratiche ─────────────────────────────────────────────
create policy "Admin e backoffice vedono tutte le pratiche"
  on pratiche for all using (get_user_role() in ('admin','backoffice'));

create policy "Agente vede le proprie pratiche"
  on pratiche for select using (agente_id = auth.uid());

create policy "Agente crea pratiche"
  on pratiche for insert with check (get_user_role() = 'agente');

create policy "Agente aggiorna le proprie pratiche"
  on pratiche for update using (
    agente_id = auth.uid() and get_user_role() = 'agente'
  );

create policy "Cliente vede la propria pratica via access_token"
  on pratiche for select using (
    cliente_email = (select email from profiles where id = auth.uid())
  );

-- ── RLS Pratica Documenti ────────────────────────────────────
create policy "Staff vede tutti i documenti"
  on pratica_documenti for all using (get_user_role() in ('admin','backoffice'));

create policy "Agente vede documenti delle proprie pratiche"
  on pratica_documenti for select using (
    exists (select 1 from pratiche where id = pratica_id and agente_id = auth.uid())
  );

create policy "Agente carica documenti nelle proprie pratiche"
  on pratica_documenti for insert with check (
    exists (select 1 from pratiche where id = pratica_id and agente_id = auth.uid())
  );

create policy "Cliente vede i propri documenti"
  on pratica_documenti for select using (
    exists (
      select 1 from pratiche p
      join profiles pr on pr.email = p.cliente_email
      where p.id = pratica_id and pr.id = auth.uid()
    )
  );

-- ── RLS Note ─────────────────────────────────────────────────
create policy "Staff vede tutte le note"
  on pratica_note for all using (get_user_role() in ('admin','backoffice'));

create policy "Agente vede note delle proprie pratiche"
  on pratica_note for select using (
    exists (select 1 from pratiche where id = pratica_id and agente_id = auth.uid())
  );

create policy "Cliente vede note visibili"
  on pratica_note for select using (
    visibile_cliente = true and
    exists (
      select 1 from pratiche p
      join profiles pr on pr.email = p.cliente_email
      where p.id = pratica_id and pr.id = auth.uid()
    )
  );

-- ── RLS Materiali ────────────────────────────────────────────
create policy "Admin gestisce i materiali"
  on materiali for all using (get_user_role() = 'admin');

create policy "Agente vede materiali visibili a tutti"
  on materiali for select using (
    get_user_role() = 'agente' and
    (visibilita = 'tutti' or
     exists (select 1 from materiale_visibilita where materiale_id = id and agente_id = auth.uid()))
  );

-- ── RLS Leads ────────────────────────────────────────────────
create policy "Admin e backoffice gestiscono i lead"
  on leads for all using (get_user_role() in ('admin','backoffice'));

create policy "Chiunque inserisce un lead"
  on leads for insert with check (true);

-- ============================================================
-- Storage Buckets
-- ============================================================

insert into storage.buckets (id, name, public)
  values ('documenti', 'documenti', false)
  on conflict do nothing;

insert into storage.buckets (id, name, public)
  values ('materiali', 'materiali', true)
  on conflict do nothing;

insert into storage.buckets (id, name, public)
  values ('vehicle-images', 'vehicle-images', true)
  on conflict do nothing;

-- Storage policy: agente carica documenti
create policy "Agente carica documenti"
  on storage.objects for insert
  with check (bucket_id = 'documenti' and get_user_role() in ('agente','cliente'));

create policy "Staff legge documenti"
  on storage.objects for select
  using (bucket_id = 'documenti' and get_user_role() in ('admin','backoffice','agente'));

create policy "Admin gestisce materiali storage"
  on storage.objects for all
  using (bucket_id = 'materiali' and get_user_role() = 'admin');

create policy "Chiunque legge materiali pubblici"
  on storage.objects for select
  using (bucket_id = 'materiali');

create policy "Admin e CMS gestiscono immagini veicoli"
  on storage.objects for all
  using (bucket_id = 'vehicle-images' and get_user_role() in ('admin','cms'));

create policy "Chiunque legge immagini veicoli"
  on storage.objects for select
  using (bucket_id = 'vehicle-images');

-- ── Preventivi ───────────────────────────────────────────────
create table if not exists preventivi (
  id               uuid default uuid_generate_v4() primary key,
  pratica_id       uuid references pratiche(id) on delete cascade not null,
  -- Veicolo
  veicolo_marca    text not null,
  veicolo_modello  text not null,
  alimentazione    text,
  -- Configurazione
  durata_mesi      integer not null,
  km_annui         integer not null,
  anticipo         numeric(10,2) default 0,
  canone_mensile   numeric(10,2) not null,
  canone_finale    numeric(10,2),
  -- Comunicazione
  note_operative   text,   -- interna, non visibile al cliente
  note_cliente     text,   -- allegata all'email e visibile al cliente
  -- Stato
  status           text not null default 'Bozza'
                     check (status in ('Bozza','Inviato','Accettato','Rifiutato')),
  inviato_at       timestamptz,
  accettato_at     timestamptz,
  created_by       uuid references profiles(id),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table preventivi enable row level security;

create policy "Staff gestisce preventivi"
  on preventivi for all using (get_user_role() in ('admin','backoffice'));

create policy "Agente gestisce preventivi proprie pratiche"
  on preventivi for all using (
    exists (select 1 from pratiche where id = pratica_id and agente_id = auth.uid())
  );

-- Clients/anon can read sent preventivi (non-bozza)
create policy "Chiunque legge preventivi inviati"
  on preventivi for select using (status != 'Bozza');

-- Clients/anon can accept or reject a preventivo
create policy "Chiunque aggiorna stato preventivo"
  on preventivi for update
  using (status = 'Inviato')
  with check (status in ('Accettato','Rifiutato'));

-- ── Trigger: quando preventivo → Inviato, pratica → In Lavorazione ──
create or replace function handle_preventivo_inviato()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'Inviato' and (old.status = 'Bozza' or old.status is null) then
    update pratiche
    set status = 'In Lavorazione',
        ultimo_aggiornamento_stato = now()
    where id = new.pratica_id and status = 'Nuova';
  end if;
  return new;
end;
$$;

drop trigger if exists on_preventivo_inviato on preventivi;
create trigger on_preventivo_inviato
  after update on preventivi
  for each row execute procedure handle_preventivo_inviato();

-- ── Trigger: quando preventivo → Accettato, pratica → Documenti Richiesti ──
create or replace function handle_preventivo_accettato()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'Accettato' and old.status = 'Inviato' then
    update pratiche
    set status = 'Documenti Richiesti',
        ultimo_aggiornamento_stato = now()
    where id = new.pratica_id;
    new.accettato_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists on_preventivo_accettato on preventivi;
create trigger on_preventivo_accettato
  before update on preventivi
  for each row execute procedure handle_preventivo_accettato();

-- ── Missing policies for anon (LeadForm + MiaPratica) ────────
-- Allow unauthenticated lead submissions
create policy "Chiunque invia una richiesta di preventivo"
  on pratiche for insert with check (true);

-- Allow unauthenticated client tracking (TODO: switch to token-based auth in prod)
create policy "Chiunque legge pratiche pubblicamente"
  on pratiche for select using (true);

-- Allow clients to add notes (richiesta nuovo preventivo)
create policy "Anon aggiunge nota da cliente"
  on pratica_note for insert
  with check (autore_ruolo = 'cliente');

-- ============================================================
-- Migrations (run on existing databases)
-- ============================================================

-- ── Migration: segmento constraint in pratiche ─────────────
alter table pratiche drop constraint if exists pratiche_segmento_check;
alter table pratiche
  add constraint pratiche_segmento_check
  check (segmento in ('P.IVA','Fleet','Privati','Moto','Green'));

-- ── Migration: colonne mancanti in offers ───────────────────
alter table offers
  add column if not exists segments       text[]    default '{}',
  add column if not exists gallery_images text[]    default '{}',
  add column if not exists seo_title      text,
  add column if not exists seo_description text,
  add column if not exists seo_keywords   text[]    default '{}',
  add column if not exists is_featured    boolean   default false;

-- Rimuove il CHECK su category (ora gestito lato app) e aggiunge tutte le categorie
alter table offers drop constraint if exists offers_category_check;

-- Rimuove il CHECK su offer_configs.segment e lo ricrea includendo Moto e Green
alter table offer_configs drop constraint if exists offer_configs_segment_check;
alter table offer_configs
  add constraint offer_configs_segment_check
  check (segment in ('P.IVA','Fleet','Privati','Moto','Green'));



-- preventivi table (see CREATE TABLE above for fresh installs)
create table if not exists preventivi (id uuid default uuid_generate_v4() primary key, pratica_id uuid references pratiche(id) on delete cascade not null, veicolo_marca text not null, veicolo_modello text not null, alimentazione text, durata_mesi integer not null, km_annui integer not null, anticipo numeric(10,2) default 0, canone_mensile numeric(10,2) not null, canone_finale numeric(10,2), note_operative text, note_cliente text, status text not null default 'Bozza' check (status in ('Bozza','Inviato','Accettato','Rifiutato')), inviato_at timestamptz, accettato_at timestamptz, created_by uuid references profiles(id), created_at timestamptz default now(), updated_at timestamptz default now());

alter table pratiche
  add column if not exists cliente_cognome            text,
  add column if not exists cliente_cf                 text,
  add column if not exists cliente_denominazione      text,
  add column if not exists cliente_indirizzo          text,
  add column if not exists cliente_citta              text,
  add column if not exists cliente_provincia          text,
  add column if not exists cliente_cap                text,
  add column if not exists cliente_occupazione        text,
  add column if not exists cliente_tipo_contratto     text,
  add column if not exists cliente_garante            boolean,
  add column if not exists cliente_anno_inizio_lavoro integer,
  add column if not exists veicolo_alimentazione      text;

-- Update status constraint to include In Lavorazione and Approvata
alter table pratiche drop constraint if exists pratiche_status_check;
alter table pratiche add constraint pratiche_status_check
  check (status in (
    'Nuova','In Lavorazione','Documenti Richiesti','Documenti Caricati',
    'Attesa Affidamento Finanziaria','Affidamento Ricevuto',
    'Stipula Contratto','Attesa Consegna','Approvata','Consegnata','Chiusa'
  ));

-- ── Storage: bucket vehicle-images ──────────────────────────────────────────
-- Eseguire nel SQL Editor di Supabase oppure creare il bucket dalla dashboard

insert into storage.buckets (id, name, public)
  values ('vehicle-images', 'vehicle-images', true)
  on conflict (id) do nothing;

-- Policy: chiunque può leggere (immagini pubbliche)
create policy "vehicle-images public read"
  on storage.objects for select
  using ( bucket_id = 'vehicle-images' );

-- Policy: admin e cms possono caricare/modificare/eliminare
create policy "vehicle-images staff write"
  on storage.objects for insert
  with check (
    bucket_id = 'vehicle-images'
    and (select role from public.profiles where id = auth.uid()) in ('admin','cms')
  );

create policy "vehicle-images staff update"
  on storage.objects for update
  using (
    bucket_id = 'vehicle-images'
    and (select role from public.profiles where id = auth.uid()) in ('admin','cms')
  );

create policy "vehicle-images staff delete"
  on storage.objects for delete
  using (
    bucket_id = 'vehicle-images'
    and (select role from public.profiles where id = auth.uid()) in ('admin','cms')
  );
