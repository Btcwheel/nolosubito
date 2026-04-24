create extension if not exists "uuid-ossp";

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  full_name text,
  role text not null default 'cliente' check (role in ('admin','backoffice','agente','cliente')),
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "self_select" on profiles for select using (id = auth.uid());
create policy "self_update" on profiles for update using (id = auth.uid());
create policy "staff_select" on profiles for select using (
  (select role from profiles where id = auth.uid()) in ('admin','backoffice')
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''), 'cliente');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
