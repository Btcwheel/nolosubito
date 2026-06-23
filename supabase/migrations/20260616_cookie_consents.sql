-- Registro consenso cookie (GDPR accountability) — issue rilevata da audit iubenda
create table if not exists cookie_consents (
  id              uuid default uuid_generate_v4() primary key,
  consent         jsonb not null,
  user_agent      text,
  page            text,
  created_at      timestamptz default now()
);

alter table cookie_consents enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'cookie_consents' and policyname = 'Admin legge il registro consensi') then
    create policy "Admin legge il registro consensi"
      on cookie_consents for select using (get_user_role() = 'admin');
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_policies where tablename = 'cookie_consents' and policyname = 'Chiunque registra il proprio consenso') then
    create policy "Chiunque registra il proprio consenso"
      on cookie_consents for insert with check (true);
  end if;
end $$;
