-- Tabella opzioni veicoli: categorie, carburanti, tipi di cambio
create table if not exists vehicle_options (
  id          uuid primary key default gen_random_uuid(),
  type        text not null check (type in ('category', 'fuel', 'transmission')),
  value       text not null,
  label       text,          -- etichetta visibile (usata per carburanti, es. "Benzina" per value "Petrol")
  sort_order  int  not null default 0,
  created_at  timestamptz default now()
);

-- Indice per query per tipo
create index if not exists vehicle_options_type_idx on vehicle_options (type, sort_order);

-- RLS: lettura pubblica, scrittura solo autenticati
alter table vehicle_options enable row level security;

create policy "Lettura pubblica" on vehicle_options
  for select using (true);

create policy "Scrittura autenticata" on vehicle_options
  for all using (auth.role() = 'authenticated');

-- Dati iniziali (stesse opzioni che erano hardcoded nel frontend)
insert into vehicle_options (type, value, label, sort_order) values
  ('category', 'Berlina',        'Berlina',        0),
  ('category', 'Station',        'Station',        1),
  ('category', 'SUV',            'SUV',            2),
  ('category', 'CityCar',        'CityCar',        3),
  ('category', 'Quadricicli',    'Quadricicli',    4),
  ('category', 'Moto',           'Moto',           5),
  ('category', 'Scooter',        'Scooter',        6),
  ('category', 'Commercial Van', 'Commercial Van', 7),
  ('category', 'Touring',        'Touring',        8),

  ('fuel', 'Diesel',   'Diesel',     0),
  ('fuel', 'Petrol',   'Benzina',    1),
  ('fuel', 'Electric', 'Elettrico',  2),
  ('fuel', 'Hybrid',   'Ibrido',     3),

  ('transmission', 'Automatic', 'Automatic', 0),
  ('transmission', 'Manual',    'Manual',    1)
on conflict do nothing;
