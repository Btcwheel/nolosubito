-- Offerte carrier caricate dal backoffice come fonte del preventivo Nolosubito.
-- Dati interni: il cliente finale non deve mai leggerle (nessuna policy per anon/client).
create table if not exists preventivo_fonti (
  id              uuid default uuid_generate_v4() primary key,
  preventivo_id   uuid references preventivi(id) on delete cascade not null,
  carrier         text,
  dati            jsonb not null default '{}'::jsonb,  -- output di analyze-preventivo
  documento_path  text,                                -- path nel bucket preventivi-broker
  documento_nome  text,
  usata           boolean not null default false,      -- offerta da cui è stato compilato il preventivo
  created_at      timestamptz default now()
);

create index if not exists preventivo_fonti_preventivo_idx on preventivo_fonti (preventivo_id);

alter table preventivo_fonti enable row level security;

drop policy if exists "Staff gestisce fonti preventivo" on preventivo_fonti;
create policy "Staff gestisce fonti preventivo"
  on preventivo_fonti for all using (get_user_role() in ('admin','backoffice'));

drop policy if exists "Agente gestisce fonti proprie pratiche" on preventivo_fonti;
create policy "Agente gestisce fonti proprie pratiche"
  on preventivo_fonti for all using (
    exists (
      select 1 from preventivi p
      join pratiche pr on pr.id = p.pratica_id
      where p.id = preventivo_id and pr.agente_id = auth.uid()
    )
  );
