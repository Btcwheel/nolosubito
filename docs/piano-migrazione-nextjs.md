# Piano di migrazione a Next.js — parte pubblica di Nolosubito

Bozza del 2026-09-30. Basata su un inventario del codice a `origin/main` (commit `acef1e5`) e su test con `curl` su `nolosubito.it`. Le stime di tempo sono grossolane (uno sviluppatore full-time) e vanno riviste dopo la Fase 1.

## 1. Obiettivo e perimetro

**Obiettivo:** far vedere ai crawler (Google, motori AI/AEO, social) HTML reale con testi, `<h1>` e dati strutturati, e portare l'LCP mobile sotto i 2,5 s, senza cambiare gli URL.

**In perimetro (sito pubblico, 17 rotte):**

| Rotta | Righe | Dati da Supabase |
|---|---|---|
| `/` (Home = `FeaturedVehicles` + `PromoHero`) | 12 | `offers` + rpc `get_vehicle_prices`, `site_settings` |
| `/offers`, `/private-offers`, `/commercial`, `/moto`, `/reuse`, `/green` | 83–130 | `offers` |
| `/vehicle/:make/:model` | 774 | `offers`, `offer_configs` |
| `/news`, `/news/:slug` | 82 / 268 | `posts` |
| `/fleet`, `/contact`, `/careers`, `/usato`, `/privacy`, `/cookie-policy`, `/termini` | 41–265 | (form → `leads`) |

**Fuori perimetro (restano SPA):** `/admin`, `/cms`, `/backoffice`, `/agente`, pratiche, login, `/risposta/:token`, stampa preventivo. Non servono alla SEO e portano le dipendenze pesanti (recharts, quill, react-pdf, jspdf, pdfmake). Non cambiano: schema Supabase, edge functions, `operator-desktop`, URL pubblici.

## 2. Punto di partenza (cosa c'è già)

- **SPA pura** (`createRoot`, nessun SSR/SSG). Il `<body>` servito a un browser o a un bot generico ha 0 caratteri di testo, 0 `<h1>`, 0 JSON-LD.
- **`middleware.ts` (Vercel Edge)**: già serve un HTML minimo a crawler con user-agent noti (Googlebot, bingbot, Applebot, social) su `/`, `/vehicle/:make/:model` e `/news/:slug`. Verificato con `curl -A Googlebot`: ~1,5 KB, un `<h1>`, ~160 caratteri di testo, nessun JSON-LD.
  - **Correzione a quanto detto prima:** non è vero che non esista nessun prerender. Esiste questo stopgap, ma **non copre GPTBot, ClaudeBot, PerplexityBot, OAI-SearchBot**, che ricevono la SPA vuota (verificato), e serve un contenuto molto più povero di quello reale.
  - Il test su `/vehicle/Peugeot/208` con Googlebot ha restituito la SPA: non so se il veicolo esista nel catalogo o se il middleware sia fallito. Da verificare.
- `api/sitemap.ts`, `api/robots.ts` e `supabase/functions/sitemap`: sitemap e robots generati a runtime.
- `api/sitemap.ts` ha un fallback su `VITE_SUPABASE_SERVICE_ROLE_KEY`: una chiave con prefisso `VITE_` finirebbe nel bundle client. In `.env` c'è solo `SUPABASE_SERVICE_ROLE_KEY`, quindi oggi non è esposta, ma il fallback va rimosso.
- Stack: React 18, Vite 6, React Router 6, Tailwind 3.4, shadcn, react-query 5, framer-motion 11, Supabase (client diretto dal browser). 376 import con alias `@/`, 29 usi di `import.meta.env` in 15 file (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SITE_URL`, `BASE_URL`, `VITE_AS…`).
- Il layout pubblico (`Navbar`, `Footer`) **non usa `useAuth`**: il sito pubblico non dipende dall'autenticazione, quindi si può separare bene.
- Solo 3 file pubblici toccano `window`/`localStorage`: `NewsDetail`, `VehicleDetail`, `PromoHero`.

## 3. Architettura di destinazione

**Un solo progetto Next.js (App Router) nello stesso repo e nello stesso dominio Vercel**, con approccio *strangler*:

1. Il progetto Next.js contiene una rotta **catch-all** `app/[[...slug]]/page.tsx` che carica la SPA attuale solo lato client (`dynamic(..., { ssr: false })` con `BrowserRouter`). All'inizio tutto funziona come oggi.
2. Ogni rotta pubblica viene poi riscritta come pagina Next.js vera. In Next.js una rotta specifica ha la precedenza sul catch-all, quindi **si migra una rotta alla volta**.
3. **Rollback per rotta:** cancellando il file della pagina, la rotta torna alla SPA.
4. Alla fine la SPA resta solo per l'area riservata (`/admin`, `/cms`, `/backoffice`, `/agente`, ecc.).

Perché non due progetti Vercel con proxy: due deploy, cookie/sessioni da verificare tra origini e rewrite fragili. Con il catch-all tutto sta in un deploy e nella stessa origine (il login Supabase in `localStorage` non cambia).

### Strategia di rendering

| Rotta | Rendering | Revalidazione |
|---|---|---|
| `/` , `/offers`, `/private-offers`, `/commercial`, `/moto`, `/reuse`, `/green` | Server Component + ISR; filtri come Client Component con dati iniziali già inclusi | tag `offers` + webhook, fallback 5 min |
| `/vehicle/[make]/[model]` | `generateStaticParams` dai make/model attivi, `dynamicParams` attivo, `generateMetadata`, JSON-LD `Product`/`Offer` | tag `offers` + webhook, fallback 1 h |
| `/news`, `/news/[slug]` | ISR | tag `posts` + webhook |
| `/fleet`, `/careers`, pagine legali | statiche | deploy |
| `/contact`, form | statica con form Client Component (server action o chiamata a `leads`) | – |
| `/usato` | da verificare (`services/usato.js` ha solo codice AutoScout24 commentato) | – |

**Prezzi:** la home e le liste mostrano il canone minimo da `get_vehicle_prices`. Con ISR possono restare vecchi fino alla revalidazione. Serve un webhook Supabase → `/api/revalidate` (con segreto) che invalida il tag quando cambiano `offers` o i prezzi, oltre a una revalidazione a tempo corta come rete di sicurezza.

## 4. Fasi

### Fase 0 — Decisioni e baseline (1–2 giorni)
- Scegliere: versione di Next.js (l'ultima stabile al momento), gestione di `/usato`, sottodominio o percorso per l'area riservata (oggi resta sugli stessi percorsi).
- Salvare la baseline: Lighthouse mobile (home, offerta, veicolo, news), Search Console (pagine indicizzate, impression), sitemap attuale, elenco URL con status, HTML che ricevono Googlebot e un bot AI (`curl -A`).
- Decidere se fare uno stopgap AEO (vedi §6) nel frattempo.

### Fase 1 — Fondamenta con SPA nel catch-all (3–5 giorni)
- Aggiungere Next.js al repo (`app/`, `next.config`, `tsconfig`/`jsconfig` con alias `@/`), Tailwind e shadcn invariati.
- Rinominare le variabili: `VITE_SUPABASE_*` → `NEXT_PUBLIC_SUPABASE_*` (29 punti); la service role resta solo lato server.
- Portare in Next: `sw.js` e `public/` (la whitelist di `copyLeanPublicPlugin` non serve più), `vercel.json` (header e cache), CSP se presente.
- Wrapper client della SPA nel catch-all.
- **Punto delicato:** i `Link` di React Router verso rotte già migrate fanno navigazione interna alla SPA e finiscono nella `PageNotFound`. Serve un componente link che usi un `<a>` (navigazione completa) verso le rotte migrate. `Navbar`, `Footer`, `HeroSection` e `PromoHero` importano `react-router-dom`.
- Bundler: verificare che `react-pdf`, `pdfmake`, `jspdf`, `quill` (già usati) si carichino con il bundler di Next; il `define: { global: 'globalThis' }` e il polyfill `buffer` di `vite.config.js` vanno riprodotti solo nel client SPA.
- **Uscita:** ogni rotta esistente funziona identica sulla preview; Lighthouse non peggiora.

### Fase 2 — Layout pubblico e infrastruttura SEO (3–5 giorni)
- Root layout con `next/font` (Inter e Space Grotesk self-hosted al posto del preload da Google Fonts).
- Consent Mode v2 e `gtag` (oggi inline in `index.html`, `window.__updateConsent` usato da `CookieBanner`) spostati in `next/script`, mantenendo il caricamento alla prima interazione.
- `Navbar` e `Footer` come componenti condivisi: durante la transizione esistono in due versioni (layout Next e `AppLayout` della SPA), quindi vanno estratti una volta sola.
- `app/sitemap.ts`, `app/robots.ts` (stesse regole di oggi, stesso `Disallow` per le aree riservate e `meta-externalagent`), `llms.txt`, `.well-known/ai-catalog.json` e `ard.json`. Rimpiazzano `api/sitemap.ts` e `api/robots.ts`; si toglie il fallback su `VITE_..._SERVICE_ROLE_KEY`.
- JSON-LD `Organization` nel layout.

### Fase 3 — Home e liste offerte (5–8 giorni)
- Data layer server: riscrivere `offersService.listWithMinPrice` (query `offers` + rpc `get_vehicle_prices`) come funzione server con cache a tag. Riusare `vehicleFallbacks.js`, `vehiclePricing.js` e `vehicleText.js`, che sono logica pura.
- `Home`: hero e testi come Server Component; `PromoHero` (countdown, `sessionStorage`, framer-motion) e i filtri come Client Component. Questo sostituisce anche il lavoro sull'hero statica della PR #18/analisi LCP: l'hero arriva nell'HTML.
- Liste `/offers`, `/private-offers`, `/commercial`, `/moto`, `/reuse`, `/green`: stessa base, condivisa.
- Immagini: `next/image` con `remotePatterns` per Supabase Storage e Unsplash. Attenzione al costo dell'ottimizzazione immagini di Vercel sul piano in uso; alternativa: trasformazioni di Supabase Storage.
- Webhook di revalidazione `/api/revalidate`.

### Fase 4 — Dettaglio veicolo (5–8 giorni)
È la pagina più grande (774 righe, ha già `document.title` e JSON-LD lato client).
- Parte statica (titolo, `<h1>`, descrizione, specifiche, breadcrumb) come Server Component; configuratore e richiesta preventivo come Client Component.
- `generateMetadata`, canonical, Open Graph, JSON-LD `Product`/`Offer`/`BreadcrumbList`.
- URL invariati: oggi `make` e `model` sono decodificati con `decodeURIComponent`; gli URL con maiuscole, spazi o caratteri speciali devono continuare a funzionare uguali (test su tutto l'elenco dalla sitemap).

### Fase 5 — News, statiche e form (4–6 giorni)
- `/news` e `/news/[slug]` con ISR (`NewsDetail` usa `window`; contenuto HTML da sanificare come oggi).
- `/fleet`, `/careers`, `/contact`, pagine legali; form verso `leadsService`.
- `/usato`: decisione presa in Fase 0.

### Fase 6 — Cutover e pulizia (2–3 giorni + monitoraggio)
- Rimuovere `middleware.ts` (non serve più: le pagine sono già server-rendered per tutti), `api/sitemap.ts`, `api/robots.ts`.
- Reinviare la sitemap in Search Console e confrontare pagine indicizzate e impression per 2–4 settimane.
- Ricontrollare i dati di campo (CrUX) solo dopo ~28 giorni.

### Fase 7 (facoltativa) — Area riservata
Consiglio di **non** migrarla: nessun beneficio SEO, costo alto. Se un giorno servisse, sarebbe un progetto a parte.

**Stima totale:** circa 4–7 settimane per uno sviluppatore (Fasi 1–6), molto incerta prima di aver completato la Fase 1.

## 5. Verifica e criteri di successo

- **Crawler:** `curl -A "GPTBot"`, `ClaudeBot`, `PerplexityBot`, `Googlebot` e uno user-agent normale sulle 17 rotte devono restituire lo stesso HTML con `<h1>`, testo reale e JSON-LD.
- **Performance:** Lighthouse mobile in locale e su preview per ogni fase; obiettivo LCP < 2,5 s, TBT < 200 ms. Il confronto con CrUX richiede ~28 giorni.
- **URL:** confronto automatico degli status di tutti gli URL della sitemap prima e dopo; nessun URL indicizzato deve cambiare né diventare 404.
- **Regressioni funzionali:** test Playwright su form contatti, filtri catalogo, configuratore, banner cookie, login e aree riservate (la skill Playwright è disponibile nel progetto).
- **Business:** lead/preventivi per giorno, sessioni e impression in Search Console non devono calare.

## 6. Stopgap AEO (opzionale, prima della migrazione)

Se la migrazione non parte entro poche settimane, si possono aggiungere GPTBot, ClaudeBot, PerplexityBot e OAI-SearchBot al `CRAWLER_UA` di `middleware.ts` e arricchire l'HTML servito (testo reale e JSON-LD). Limiti: è rendering dinamico per user-agent, è fragile e non migliora l'LCP degli utenti; il contenuto servito ai bot deve corrispondere a quello mostrato agli utenti, altrimenti è cloaking. Lo vedo come ponte di 1–2 giorni, da eliminare in Fase 6.

## 7. Rischi

| Rischio | Impatto | Mitigazione |
|---|---|---|
| Prezzi/offerte non aggiornati con ISR | Prezzi errati mostrati ai clienti | Webhook + revalidazione breve; test con modifica di un'offerta da CMS |
| Link tra SPA e pagine Next.js verso 404 | Navigazione rotta durante la transizione | Componente link con navigazione completa; test di tutti i link di `Navbar`/`Footer` a ogni fase |
| Cambio URL involontario (`make`/`model`) | Perdita di posizionamento | Confronto automatico degli URL; nessun redirect senza motivo |
| Costo ottimizzazione immagini e ISR su Vercel | Costi imprevisti | Verificare il piano e le quote prima della Fase 3 |
| Duplicazione `Navbar`/`Footer` | Divergenza visiva | Estrarre i componenti in Fase 2 |
| Dipendenze pesanti (pdf, quill) col bundler di Next | Build rotta | Provarle già in Fase 1, nel catch-all client |
| `gtag`/consenso | Perdita dati o non conformità | Portare invariato il Consent Mode v2 e ricontrollare in GA4 Realtime |
| Dimenticare `Vary`/cache CDN col middleware | Bot che ricevono HTML sbagliato | Rimuovere `middleware.ts` solo dopo che tutte le rotte sono migrate |

## 8. Come lo faremo rispettando CLAUDE.md

- Mai push diretto su `main`: un branch e una PR per fase (o per rotta nelle fasi 3–5).
- Ogni modifica di `vite.config.js`, `index.html`, `vercel.json` o di build passa da una **preview Vercel** prima del merge; dopo il deploy in produzione, hard refresh (Cmd+Shift+R).
- Rollback: `git revert` del merge (oppure rollback istantaneo da Vercel) e `npx vercel deploy --prod --yes`; per una singola rotta basta rimuovere la sua pagina Next.js.
- Dopo ogni modifica di codice: `graphify update .`.

## 9. Decisioni da prendere prima di iniziare

1. Confermi l'approccio **catch-all + strangler** in un solo progetto, invece di due progetti separati?
2. `/usato`: che cosa mostra oggi e da dove vengono i dati (AutoScout24 è commentato)?
3. Piano Vercel in uso (quote per ISR e ottimizzazione immagini)?
4. Vuoi lo **stopgap AEO** del §6 nel frattempo?
5. Chi può testare le funzioni interne (CMS, configuratore) a ogni fase?
