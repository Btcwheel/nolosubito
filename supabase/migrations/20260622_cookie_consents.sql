-- Registro consenso cookie (GDPR accountability) — issue rilevata da audit iubenda
create table if not exists cookie_consents (
  id              uuid default uuid_generate_v4() primary key,
  consent         jsonb not null,
  user_agent      text,
  page            text,
  created_at      timestamptz default now()
);

alter table cookie_consents enable row level security;

create policy "Admin legge il registro consensi"
  on cookie_consents for select using (get_user_role() = 'admin');

create policy "Chiunque registra il proprio consenso"
  on cookie_consents for insert with check (true);
