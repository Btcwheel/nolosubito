---
name: new-migration
description: Crea una nuova migration Supabase in supabase/migrations con naming e checklist RLS del progetto.
disable-model-invocation: true
---

Crea una migration per: $ARGUMENTS

1. Guarda le ultime migration in `supabase/migrations/` e rispetta il naming `YYYYMMDD_descrizione_snake_case.sql` (data odierna; se esiste già una migration con la stessa data va bene, il nome resta univoco).
2. Scrivi SQL idempotente (`create table if not exists`, `drop policy if exists` prima di `create policy`, `create or replace function`).
3. Ogni nuova tabella: `enable row level security` e policy esplicite per i ruoli reali del progetto (verifica in `supabase/create-team-permissions.sql` e nelle migration recenti).
4. Mai SQL fuori da `supabase/migrations/` (niente nuovi file stile `fix_*.sql` nella root di `supabase/`).
5. Non applicare la migration: mostra il file e ricorda di testarla prima su un branch/preview. `supabase db push` solo su richiesta esplicita.
