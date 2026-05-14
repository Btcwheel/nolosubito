-- Tabella bozze AI per news generate automaticamente
create table if not exists news_drafts (
  id                uuid default uuid_generate_v4() primary key,
  title             text not null,
  slug              text not null,
  summary           text not null,
  content           text not null,
  cover_image_url   text,
  category          text check (category in ('Notizie','Approfondimenti','Offerte','Green Mobility','Azienda')),
  meta_description  text,
  source_url        text,
  source_title      text,
  ai_generated_at   timestamptz default now(),
  status            text not null default 'pending'
                      check (status in ('pending','accepted','rejected')),
  rejection_reason  text,
  created_at        timestamptz default now()
);

-- RLS
alter table news_drafts enable row level security;

create policy "CMS può gestire bozze AI"
  on news_drafts for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid()
      and role in ('admin','cms')
    )
  );
