-- ── Preventivi Log ──────────────────────────────────────────────────────────
-- Traccia ogni preventivo generato dall'operatore: chi, quando, per chi,
-- quali azioni ha completato (estrazione AI, PDF scaricato, email inviata).

create table if not exists preventivi_log (
  id                  uuid default uuid_generate_v4() primary key,

  -- Operatore che ha gestito la pratica
  operator_id         uuid references profiles(id) on delete set null,

  -- Cliente destinatario
  cliente_nome        text,
  cliente_email       text,

  -- Dati veicolo estratti dal documento concorrente
  veicolo_marca       text,
  veicolo_modello     text,
  veicolo_allestimento text,
  alimentazione       text,
  durata_mesi         integer,
  km_annui            integer,
  anticipo            numeric(10,2),
  deposito_cauzionale numeric(10,2),
  canone_mensile      numeric(10,2),
  servizi             text[],

  -- File sorgente (preventivo concorrente caricato)
  fonte_filename      text,
  fonte_tipo          text,  -- 'pdf' | 'image'

  -- Timestamp azioni
  analisi_completata_at  timestamptz,   -- quando l'AI ha estratto i dati
  pdf_scaricato_at       timestamptz,   -- quando l'operatore ha scaricato il PDF
  email_inviata_at       timestamptz,   -- quando l'email è stata inviata al cliente

  -- Link opzionale a una pratica esistente
  pratica_id          uuid references pratiche(id) on delete set null,

  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

-- Indici per query frequenti
create index if not exists idx_preventivi_log_operator on preventivi_log(operator_id);
create index if not exists idx_preventivi_log_created  on preventivi_log(created_at desc);
create index if not exists idx_preventivi_log_pratica  on preventivi_log(pratica_id);

-- RLS: solo backoffice e admin vedono i log
alter table preventivi_log enable row level security;

create policy "backoffice_read_preventivi_log" on preventivi_log
  for select using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('backoffice', 'admin')
    )
  );

create policy "backoffice_insert_preventivi_log" on preventivi_log
  for insert with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('backoffice', 'admin')
    )
  );

create policy "backoffice_update_preventivi_log" on preventivi_log
  for update using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('backoffice', 'admin')
    )
  );

-- Trigger updated_at
create or replace function update_preventivi_log_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_preventivi_log_updated_at on preventivi_log;
create trigger trg_preventivi_log_updated_at
  before update on preventivi_log
  for each row execute function update_preventivi_log_updated_at();
