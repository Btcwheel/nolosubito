# Procedura dopo ogni merge su `main`

Il merge aggiorna solo il sito (Vercel). **Edge Functions e database di Supabase (progetto `nowoiywrzfnjocvsbmih`) non si aggiornano da soli**: vanno allineati a mano. Quasi tutti i bug "tornati" sui preventivi nascevano da lavoro in `main` mai arrivato in produzione.

## 1. Cosa ha toccato la PR?
`git diff --name-only <commit-prima>..<merge>` e guarda:

| Cartella | Serve |
|---|---|
| `supabase/functions/<nome>/` | pubblicare quella funzione (punto 2) |
| `supabase/migrations/` | applicare la migrazione (punto 3) |
| altro | solo il controllo del deploy Vercel (punto 4) |

## 2. Edge Functions
Chiedere conferma prima. Mai pubblicare dal branch di lavoro: sempre da una copia pulita di `main`.
```
git fetch origin
git worktree add -f <scratchpad>/deploy-main origin/main
cd <scratchpad>/deploy-main
npx --yes supabase@latest functions deploy <nome> --project-ref nowoiywrzfnjocvsbmih --use-api
```
- Prima: salvare la versione online in `~/Documents/nolosubito-archivio-pulizia-2026-10-29/supabase-online/` e confrontarla con `main`.
- Dopo: `list_edge_functions` deve mostrare cambiata **solo** la funzione pubblicata (versione +1, data di oggi).

## 3. Migrazioni
Chiedere conferma prima. Il collegamento MCP è in sola lettura: usare la CLI.
1. Confrontare `ls supabase/migrations` con `list_migrations`: cercare file mancanti.
2. Leggere il file. **Mai rieseguire migrazioni di dati una tantum** (es. `20260526`, divide i canoni per 1,22 a ogni esecuzione). Applicare solo quelle idempotenti (`if not exists`, `drop policy if exists`).
3. `npx --yes supabase@latest db query --linked -f supabase/migrations/<file>.sql` (non `db push`).
4. Verificare: tabella, colonne, RLS e policy esistono.
5. Nota: `db query` non scrive nel registro delle migrazioni, quindi `list_migrations` non la mostrerà.

## 4. Deploy Vercel e prova
- Controllare lo stato del commit di `main`: `gh api repos/Btcwheel/nolosubito/commits/<sha>/status --jq .state` deve essere `success` per `nolosubito` e `fleet-flow-nolo`.
- Hard refresh (Cmd+Shift+R) e provare a mano la funzione toccata.
- Se il sito crasha: tornare subito all'ultimo commit stabile (`git revert`), poi `npx vercel deploy --prod --yes`.

## 5. Dopo modifiche a SEO, sitemap, redirect o `vercel.json`
Audit da Googlebot (User-Agent `Googlebot`) su `https://nolosubito.it`:
- `robots.txt` e `sitemap.xml` rispondono 200; nessun URL della sitemap con `noindex` o non-200.
- Ogni pagina: un titolo, una description, un canonical uguale all'URL, un solo H1, JSON-LD valido.
- Nessun titolo duplicato tra articoli; slug senza lettere perse (es. `Š`).
- Link interni tutti 200; i vecchi URL WordPress arrivano ancora ai nuovi.
- Un 404 inventato risponde 404 con `noindex` (non soft 404).
- Gli `alt=""` sulle immagini decorative (loghi marche accanto al nome) sono voluti.
- Poi: Search Console → rinviare la sitemap e controllare "Pagine".

## Regole fisse
- Mai push su `main`: branch → PR → merge. Il branch può tracciare `origin/main`: fare il push con `git push origin <branch>:<branch>`.
- Conferma esplicita prima di ogni merge, deploy di funzioni o modifica al database.
