-- Aggiorna la funzione handle_new_user per creare profili con role=cliente di default
-- I metadati dell'invito (role=backoffice) vengono rispettati se presenti
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'cliente')
  )
  on conflict (id) do update
    set
      email     = excluded.email,
      full_name = case when excluded.full_name <> '' then excluded.full_name else profiles.full_name end;
  return new;
end;
$$;
