-- Tabella chiave-valore per configurazioni interne (usata anche dallo script di migrazione)
create table if not exists app_settings (
  key   text primary key,
  value text not null
);

-- Solo service_role può leggere/scrivere
alter table app_settings enable row level security;
-- Nessuna policy pubblica: accesso solo via service_role key (bypassa RLS)
