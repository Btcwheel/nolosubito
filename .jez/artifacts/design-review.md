# Design Review: NoloSubito — Fleet Flow
**Data**: 2026-04-19
**Fonte**: analisi statica del codice sorgente (no Playwright disponibile)

---

## Impressione generale
Il sito ha una base solida e ambiziosa — hero scroll-jacking con parallax, sistema di token CSS, due font premium (Space Grotesk + Inter), dark mode — ma perde punti su dettagli che tradiscono la rifinitura finale: emoji nelle badge, un colore viola spuntato dal nulla, e due/tre placeholder visibili nel footer.

---

## Findings

### High

- **Emoji nelle badge VehicleCard** (`🔥 Più richiesto`, `✦ Novità`, `⚡ 0 CO₂`, `🌿 Ibrido`) — incompatibili con il tono premium del resto del sito. Le emoji non scalano bene, non rispettano il tema dark/light, e si mangiano la coerenza visiva. → **Fix**: sostituire con icone Lucide (`Flame`, `Sparkles`, `Zap`, `Leaf`) già usate altrove.

- **`bg-violet-500` nel badge "Novità"** (`VehicleCard.jsx:87`) — colore completamente fuori palette (navy + electric blue). Il viola non ha nessun token nel sistema, nessuna motivazione semantica, e si vede subito come un ripensamento. → **Fix**: usare `bg-electric/90` o `bg-navy/80` come gli altri badge.

- **`onError` loop infinito su immagine** (`VehicleCard.jsx:70`) — `onError={(e) => { e.target.src = imgSrc; }}` assegna la stessa src che ha fallito, creando un loop di richieste HTTP. In produzione con immagini mancanti questo spamma la console e lancia richieste in loop. → **Fix**: impostare un fallback reale (es. placeholder grigio o logo marca).

- **Footer con link morti** (`Footer.jsx:36-37`) — "Privacy Policy" e "Termini e Condizioni" sono `<span>` non cliccabili. Visivamente identici agli altri link ma completamente inerti. → **Fix**: o aggiungere le pagine, o renderli `<a>` con `href="#"` + nota TODO, non lasciare span mimetizzati.

---

### Medium

- **`FUEL_COLORS` raw Tailwind senza dark mode** (`VehicleCard.jsx:11-16`) — `bg-green-100 text-green-700 border-green-200` ecc. funzionano solo in light mode. In dark mode le badge fuel type diventano sfondo chiaro su sfondo scuro. → **Fix**: usare variabili semantiche oppure aggiungere `dark:` prefissi.

- **`hover:bg-white/8` — sintassi non valida** (`SocialProof.jsx:84`) — Tailwind v3 non riconosce `/8` come opacità arbitraria inline senza le parentesi `[0.08]`. La regola non viene generata. → **Fix**: `hover:bg-white/[0.08]`.

- **`SCENE_COUNT` hardcoded a 5 in HeroScene** (`HeroScene.jsx:6`) mentre mobile usa solo 3 scene — i calcoli `start/end` per opacity diventano sbagliati sulle prime 3 scene su mobile (es. la scena 3 va da 0.4 a 0.6 invece che 0 a 0.33). → **Fix**: passare `totalScenes` come prop e usarlo al posto di `SCENE_COUNT`.

- **`isMobile()` valutato una volta sola a render** (`HeroSection.jsx:45`) — il resize finestra non aggiorna `activeScenes`, e in SSR/pre-render potrebbe restituire valori errati. → **Fix**: `useEffect` + `useState` oppure direttamente `useMediaQuery`.

- **Stats duplicate** — i numeri 500+/98%/24h appaiono sia nell'hero (HeroScene) che nella sezione SocialProof. Su una pagina lunga l'utente li legge due volte a poca distanza. → **Fix**: rimuovere dall'hero oppure differenziare i KPI.

---

### Low

- **Colore electric troppo generico** — `hsl(220 100% 50%)` è un blu elettrico saturato molto standard (#0055ff). Non è sbagliato ma non ha carattere. Un piccolo offset verso il ciano (es. `hsl(215 100% 52%)`) darebbe più personalità al brand.

- **Footer "Azienda" ha solo 3 voci** di cui 2 non funzionanti — la colonna appare sottile rispetto alle altre. Aggiungere "News", "Carriere", "Chi siamo" riempirebbe l'area e non richiede nuove pagine.

- **Telefono e P.IVA nel footer sono placeholder** — `+39 02 1234 5678` e `IT12345678901` sono dati fake. Visibile subito a chi conosce la struttura. Rimuovere o sostituire prima del go-live.

- **Logo caricato da URL esterno nolosubito.it** — sia nel Navbar che nel Footer. Se il dominio sorgente è irraggiungibile, il logo scompare. → Inserire il file nella cartella `public/`.

---

## Cosa funziona bene (da preservare)

- **Sistema di token CSS** — `--electric`, `--navy`, `--background`, `--foreground` usati in modo coerente. Dark mode implementata con variabili. Solido.
- **Hero scroll-jacking** — parallax su immagini + transizione opacity tra scene è fluida e ambiziosa. L'hint "Scorri per esplorare" con fade-out è un bel dettaglio.
- **VehicleCard price block** — il riquadro prezzo con gradiente per tipo di carburante (verde per EV, slate per diesel ecc.) è un differenziatore visivo intelligente.
- **BusinessOffers filter UX** — barra filtri inline su desktop + Sheet bottom drawer su mobile è la scelta giusta. I skeleton loader corrispondono esattamente al layout della card.
- **Navbar comportamento** — trasparente sull'hero homepage, navy altrove. Mobile accordion con animazione. Tutto corretto.
- **Tipografia** — gerarchia chiara: Space Grotesk bold per titoli, Inter per body. Le dimensioni seguono una scala ragionevole (text-4xl hero → text-3xl sezioni → text-sm body).

---

## Top 3 fix ad alto impatto visivo

1. **Rimuovere le emoji dalle badge VehicleCard** — è la cosa più immediatamente visibile e che abbassa il tono del prodotto. Sostituire con Lucide icons.
2. **Eliminare `bg-violet-500`** dalla badge "Novità" — rompere la palette è un errore evidente a colpo d'occhio.
3. **Fixare il footer** — link morti + placeholder dati = sensazione di prodotto non finito. 5 minuti di lavoro con impatto percepito enorme.
