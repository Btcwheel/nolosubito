-- Abilita le estensioni necessarie (già disponibili su Supabase)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Cron job: genera bozze AI ogni giorno alle 08:00 (UTC)
-- Nota: adatta a UTC+2 (Italia) → 06:00 UTC = 08:00 ora italiana
select cron.schedule(
  'generate-news-drafts-daily',   -- nome job
  '0 6 * * *',                    -- ogni giorno alle 06:00 UTC (08:00 Italia)
  $$
  select net.http_post(
    url    := (select value from vault.secrets where name = 'supabase_url') || '/functions/v1/generate-news-drafts',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select value from vault.secrets where name = 'supabase_service_role_key')
    ),
    body   := '{}'::jsonb
  );
  $$
);

-- Per verificare i job attivi:
-- select * from cron.job;

-- Per rimuovere il job se necessario:
-- select cron.unschedule('generate-news-drafts-daily');
