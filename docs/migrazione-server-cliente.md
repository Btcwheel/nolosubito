# Migrazione sui server del cliente

Obiettivo: portare sito, Supabase e funzioni sui server di proprietà del cliente, provare tutto sul nuovo ambiente e **spostare il DNS solo a prova completata**. Il vecchio ambiente (Vercel + Supabase cloud) resta acceso e funzionante fino alla fine, per poter tornare indietro.

Stato: pianificazione. Nessuna modifica è stata fatta alla produzione.

## 1. Dimensioni (misurate il 2026-10-30)
- Database: 42 MB. Utenti (`auth.users`): 29.
- Storage: 2.675 file, 506 MB, bucket `gigi-images`, `news-images`, `preventivi-broker`, `site-images`, `vehicle-images`.
- Estensioni Postgres: `vector`, `pgcrypto`, `uuid-ossp`, `supabase_vault`, `pg_stat_statements` (nessun `pg_cron`).
- Server indicativo: 4 CPU, 8 GB RAM, 100 GB disco.

## 2. Architettura di arrivo
- **Supabase self-hosted** (docker-compose ufficiale): Postgres, Auth (GoTrue), PostgREST, Realtime, Storage, Edge Runtime, Studio, **imgproxy** (il sito usa l'API di trasformazione immagini: `src/lib/imageUtils.js`).
- **Next.js** con `next build` + `next start` (Node), dietro Caddy o nginx con certificato automatico.
- **Backup** giornalieri di database e storage su un'altra macchina, con ripristino provato (su Supabase self-hosted non ci sono backup gestiti).
- Mail: server SMTP già del cliente (`mail.nolosubito.it`), nessun cambio di fornitore.

## 3. Inventario variabili (solo nomi, mai i valori)
**Sito (Next.js)**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL` (incorporate nella build: cambiano → rifare la build), `SUPABASE_SERVICE_ROLE_KEY` (sitemap, solo server), `REVALIDATE_SECRET` (`app/api/revalidate`), `FONT_BASE_PATH` (PDF).
**Attenzione**: `proxy.ts` legge a runtime `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`; `next.config.mjs` mappa i `VITE_*` su `NEXT_PUBLIC_*` solo in build. Sul server devono esistere **entrambe** le famiglie.

**Edge Functions** (da impostare come segreti del nuovo Supabase):
| Funzione | Variabili |
|---|---|
| analyze-preventivo, ocr-document | `ANTHROPIC_API_KEY` |
| chat-ai | `ANTHROPIC_API_KEY`, `GOOGLE_AI_API_KEY`, `GROQ_API_KEY`, `SITE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| generate-embeddings | `GOOGLE_AI_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| generate-news-article | `ANTHROPIC_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| generate-news-drafts | `GROQ_API_KEY`, `PEXELS_API_KEY`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
| send-preventivo-email | `SMTP_*`, `BACKOFFICE_EMAIL`, `SITE_URL`, `SUPABASE_*` |
| send-preventivo-custom | `SMTP_*`, `BACKOFFICE_EMAIL` |
| notify-nuova-pratica | `SMTP_*`, `NOTIFY_TO`, `BACKOFFICE_URL`, `SITE_URL` |
| notify-nota-cliente, invite-team-member | `SMTP_*`, `SITE_URL`, `SUPABASE_*` |
| fetch-preventivo-print | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` |
`SMTP_*` = `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`, `SMTP_SECURE`.

**Da chiarire**
- `resend-email`: funzione senza variabili e senza chiamanti nel codice → probabile residuo, da non migrare.
- `sitemap`: esiste in `supabase/functions` ma **non è pubblicata** (la sitemap vera è `app/sitemap.xml/route.ts`).
- `@vercel/analytics`: in `package.json`, non usato nel codice → da confermare e togliere.
- Le variabili impostate su Vercel non sono leggibili da qui: vanno esportate dal cliente/dal pannello Vercel.
- Nessuna chiave `service_role` finisce nel sito pubblico (verificato: solo script e sitemap sul server).

## 4. Redirect e header
`vercel.json` ha 607 redirect permanenti (vecchio sito WordPress + `www`→apex), 32 rewrite verso `/api/gone` (410) e 12 header. `next.config.mjs` li legge da lì, quindi valgono anche con `next start`. Verificato: 638 URL (redirect e rewrite) hanno lo stesso risultato della produzione; `www`→apex e gli header di sicurezza sono identici.

## 5. Fasi
1. **Preparazione** (nessun impatto): inventario, esportazione delle variabili da Vercel, accessi ai server, DNS e dominio, redirect in `next.config.mjs` (fatto).
2. **Backup completo** di database, storage, utenti e segreti; ripristino provato su una copia.
3. **Ambiente nuovo in parallelo**, su un dominio di prova: installare Supabase self-hosted, ripristinare DB e utenti (le password si portano via intatte), copiare i 506 MB di storage, pubblicare le 11 funzioni con i segreti, build e avvio di Next.js.
4. **Riscrivere gli URL assoluti** `https://nowoiywrzfnjocvsbmih.supabase.co/…` presenti nel database (offerte, articoli, gallerie, `site_settings`) verso il nuovo dominio dello storage; poi contare che non ne restino.
5. **Prova completa** sul nuovo ambiente: login e magic link, preventivo con PDF e mail, carrier come fonte (`preventivo_fonti`), CMS "Nuovo Articolo", chat con operatore (realtime), generazione articoli, 404, redirect, immagini e trasformazioni, app Electron dell'operatore con i nuovi indirizzi. Audit da Googlebot e confronto con la produzione.
6. **Mail**: SPF, DKIM, DMARC; certificato di `mail.nolosubito.it` (poi togliere `rejectUnauthorized: false`).
7. **Passaggio**: abbassare il TTL del DNS qualche giorno prima; in una fascia a basso traffico congelare le scritture, ultimo allineamento di database e storage, spostare il DNS.
8. **Dopo**: log, mail consegnate, Search Console; vecchio ambiente acceso 2-4 settimane; spegnere solo dopo un ripristino di prova dei backup del nuovo.

## 6. Piano di ritorno
Finché il vecchio ambiente è acceso, tornare indietro = rimettere il DNS sul vecchio. I dati scritti sul nuovo dopo il passaggio vanno riportati a mano: per questo si congelano le scritture durante lo switch e si tiene il periodo di sovrapposizione corto.

## 7. Rischi
- Foto rotte se la riscrittura degli URL salta una tabella → controllo con conteggio degli indirizzi vecchi rimasti.
- Differenze di comportamento delle Edge Functions self-hosted (permessi, `verify_jwt`, variabili) → ognuna provata nella fase 5.
- Manutenzione futura (aggiornamenti, backup, sicurezza di Supabase) a carico del cliente o vostro: da concordare per iscritto prima.
- Cache ISR su disco: verificare il comportamento al riavvio e dopo il deploy.
