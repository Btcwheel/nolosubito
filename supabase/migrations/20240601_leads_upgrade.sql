-- ============================================================
-- LEADS UPGRADE — activity log, campi strutturati, preferenze
-- ============================================================

-- 1. Nuovi campi sulla tabella leads
alter table leads
  add column if not exists agente_id        uuid references profiles(id) on delete set null,
  add column if not exists pratica_id       uuid references pratiche(id) on delete set null,
  add column if not exists last_contacted_at timestamptz,
  add column if not exists follow_up_at      timestamptz,
  add column if not exists contact_attempts  int default 0,
  add column if not exists updated_at        timestamptz default now(),
  add column if not exists converted_at      timestamptz,
  -- preferenze strutturate (estratte dal testo libero o compilate dall'agente AI)
  add column if not exists pref_marca        text,
  add column if not exists pref_modello      text,
  add column if not exists pref_carburante   text check (pref_carburante in ('Benzina','Diesel','Ibrido','Elettrico','GPL','Metano')),
  add column if not exists pref_durata_mesi  int,
  add column if not exists pref_budget_min   int,
  add column if not exists pref_budget_max   int,
  add column if not exists pref_km_anno      int,
  add column if not exists pref_anticipo     int;

-- Trigger per updated_at automatico
create or replace function update_leads_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_leads_updated_at on leads;
create trigger trg_leads_updated_at
  before update on leads
  for each row execute function update_leads_updated_at();

-- 2. Tabella attività lead (audit trail completo)
create table if not exists lead_attivita (
  id          uuid default uuid_generate_v4() primary key,
  lead_id     uuid references leads(id) on delete cascade not null,
  tipo        text not null check (tipo in (
                'creazione',
                'cambio_status',
                'contatto_operatore',
                'follow_up_ai',
                'nota',
                'assegnazione',
                'conversione',
                'follow_up_programmato'
              )),
  descrizione text,
  vecchio_valore text,
  nuovo_valore   text,
  autore_id   uuid references profiles(id) on delete set null,
  autore_nome text,           -- snapshot del nome al momento dell'evento
  autore_tipo text check (autore_tipo in ('admin','backoffice','agente','ai','sistema')),
  created_at  timestamptz default now()
);

create index if not exists idx_lead_attivita_lead_id on lead_attivita(lead_id);
create index if not exists idx_lead_attivita_created_at on lead_attivita(created_at desc);

-- RLS per lead_attivita: admin e backoffice vedono tutto
alter table lead_attivita enable row level security;

create policy "Admin e backoffice vedono tutte le attività lead"
  on lead_attivita for select
  using (get_user_role() in ('admin','backoffice'));

create policy "Admin e backoffice inseriscono attività"
  on lead_attivita for insert
  with check (get_user_role() in ('admin','backoffice'));

-- 3. Trigger automatico: registra cambio status e contatto
create or replace function trg_lead_activity_on_update()
returns trigger language plpgsql security definer as $$
begin
  -- Cambio status
  if old.status is distinct from new.status then
    insert into lead_attivita(lead_id, tipo, descrizione, vecchio_valore, nuovo_valore, autore_tipo)
    values(new.id, 'cambio_status',
           'Status aggiornato da ' || coalesce(old.status,'—') || ' a ' || new.status,
           old.status, new.status, 'sistema');

    -- Se diventa Convertito, salva converted_at
    if new.status = 'Convertito' and old.status <> 'Convertito' then
      new.converted_at = now();
    end if;
  end if;

  -- Cambio last_contacted_at = contatto registrato
  if old.last_contacted_at is distinct from new.last_contacted_at and new.last_contacted_at is not null then
    new.contact_attempts = coalesce(old.contact_attempts, 0) + 1;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_lead_activity on leads;
create trigger trg_lead_activity
  before update on leads
  for each row execute function trg_lead_activity_on_update();

-- 4. Funzione per aggiungere attività manuale (usata dal backend/edge functions)
create or replace function add_lead_activity(
  p_lead_id     uuid,
  p_tipo        text,
  p_descrizione text default null,
  p_autore_id   uuid default null,
  p_autore_nome text default null,
  p_autore_tipo text default 'sistema'
)
returns void language plpgsql security definer as $$
begin
  insert into lead_attivita(lead_id, tipo, descrizione, autore_id, autore_nome, autore_tipo)
  values(p_lead_id, p_tipo, p_descrizione, p_autore_id, p_autore_nome, p_autore_tipo);
end;
$$;
