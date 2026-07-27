-- ============================================================
-- Migration: chat operator settings + direct chat source
-- ============================================================

-- Tabella per il toggle globale AI on/off
create table if not exists chat_operator_settings (
  id text primary key default 'global',
  ai_enabled boolean not null default true,
  updated_by uuid references profiles(id),
  updated_at timestamptz default now()
);

insert into chat_operator_settings (id, ai_enabled) values ('global', true)
on conflict (id) do nothing;

-- RLS
alter table chat_operator_settings enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'chat_operator_settings'
      and policyname = 'chat_operator_settings_select_anon'
  ) then
    create policy "chat_operator_settings_select_anon"
      on chat_operator_settings for select to anon using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'chat_operator_settings'
      and policyname = 'chat_operator_settings_select_auth'
  ) then
    create policy "chat_operator_settings_select_auth"
      on chat_operator_settings for select to authenticated using (true);
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'chat_operator_settings'
      and policyname = 'chat_operator_settings_update_backoffice'
  ) then
    create policy "chat_operator_settings_update_backoffice"
      on chat_operator_settings for update
      using (
        exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'backoffice'))
      )
      with check (
        exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'backoffice'))
      );
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'chat_operator_settings'
      and policyname = 'chat_operator_settings_insert_backoffice'
  ) then
    create policy "chat_operator_settings_insert_backoffice"
      on chat_operator_settings for insert
      with check (
        exists (select 1 from profiles where id = auth.uid() and role in ('admin', 'backoffice'))
      );
  end if;
end $$;

-- Realtime
do $$ begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and tablename = 'chat_operator_settings'
  ) then
    alter publication supabase_realtime add table chat_operator_settings;
  end if;
end $$;

-- Colonna source su escalated_sessions per distinguere chat dirette
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'escalated_sessions'
      and column_name = 'source'
  ) then
    alter table escalated_sessions
      add column source text not null default 'luca_escalation'
      check (source in ('luca_escalation', 'direct'));
  end if;
end $$;

-- Colonna operator_name per mostrare il nome dell'operatore nella chat
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'escalated_sessions'
      and column_name = 'operator_name'
  ) then
    alter table escalated_sessions
      add column operator_name text;
  end if;
end $$;

-- Colonna operator_name su operator_chat_messages per mostrare il nome in tempo reale
do $$ begin
  if not exists (
    select 1 from information_schema.columns
    where table_name = 'operator_chat_messages'
      and column_name = 'operator_name'
  ) then
    alter table operator_chat_messages
      add column operator_name text;
  end if;
end $$;

-- Permette agli anon (clienti chat) di creare sessioni chat dirette in escalated_sessions
do $$ begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'escalated_sessions'
      and policyname = 'anon_insert_direct_chat'
  ) then
    create policy "anon_insert_direct_chat"
      on escalated_sessions for insert to anon
      with check (source = 'direct');
  end if;
end $$;
