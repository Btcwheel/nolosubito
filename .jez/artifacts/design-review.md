# Design Review: NoloSubito
**Data**: 2026-04-25
**URL**: https://nolosubito.quixel.it

## Impressione generale
Funzionale e tecnicamente solido, ma tradisce immediatamente la sua origine AI: ogni sezione, pattern e scelta tipografica è identica a mille altri siti automotive/finance generati negli ultimi 2 anni. Il QuoteBox è il punto di forza reale — il resto è intercambiabile.

## High — sembrano generici o rotti

- **Pattern "3 icone + titolo + testo"** (sezione Perché Sceglierci) → il pattern più abusato del web AI. Sostituire con qualcosa editoriale o visivo.
- **Stats row (500+, 98%, 24h)** nella hero → questo blocco 3 numeri su sfondo scuro è su ogni landing page AI. Eliminare o riformattare completamente.
- **Header identico su tutte le pagine** → ogni pagina usa lo stesso banner dark navy con badge arancione + titolo + sottotitolo. Zero differenziazione. L'utente non percepisce di essere in una sezione diversa.
- **Enorme spazio bianco** tra hero e brand logos nella homepage → sembra la pagina sia rotta.
- **4° card isolata** nella grid "Veicoli in Evidenza" → 3 colonne con 4 card lascia la quarta card sola su nuova riga.
- **Thumbnail galleria** nel dettaglio veicolo → 80px, praticamente invisibile. L'utente non capisce che esistono altre foto.

## Medium — non lucidati

- **Font generico** → sembra Inter. Zero carattere tipografico. Un brand automotive premium non usa mai font di default.
- **Bottone CTA arancione** → il colore amber è talmente usato nei template italiani che non comunica più nulla di premium.
- **Sezione brand loghi** → 8 loghi in fila grigia su bianco, nessun contesto, nessuna narrazione.
- **Offerte Privati vs Business** → layout identico, solo il titolo cambia. L'utente non percepisce differenza di tono.
- **Cookie banner** copre il QuoteBox e le card al primo caricamento.
- **P.IVA e telefono** nel footer sono chiaramente placeholder (IT10234567890I, +39 02 1234 5678).

## Low — dettagli

- "Guida il Tuo / Sogno" — line break involontario, "Sogno" va a capo da solo
- Badge (Electric Exec, Business SUV) con testi troncati su alcune card
- Il numero "+39 02 1234 5678" è un placeholder

## Cosa funziona bene

- **QuoteBox** — il configuratore a step è genuinamente ben fatto, chiaro e differenziante
- **Sezione Vantaggi Fiscali P.IVA** — smart, utile, ben presentata
- **Pagina Usato** — card con immagine grande e prezzo più forti delle card NLT
- **Layout mobile** della pagina veicolo — scorre bene
- **Footer** gradient coerente con struttura pulita

## Top 5 interventi ad alto impatto

1. **Font** → rimpiazza Inter con Clash Display (heading) + DM Sans (body)
2. **Hero homepage** → split asimmetrico: testo bold su navy a sinistra, auto a piena altezza a destra senza overlay. Elimina stats row.
3. **Header di pagina differenziato** per segmento (Business=freddo, Privati=caldo, Green=natura)
4. **Vehicle cards asimmetriche** → 1 card featured grande + 2 piccole invece di 3 identiche
5. **Elimina "3 colonne di icone"** → sostituisci con cifre editoriali grandi stile magazine

## Direzione stilistica: Dark Editorial Luxury

Riferimenti: Polestar, Rimac, Lotus — non Ferrari/BMW (troppo corporate).

Palette invariata ma usata con coraggio:
- Navy #2D2E82 dominante ovunque, non solo header/footer
- Bianco freddo per i contenuti
- Electric/arancio solo come accento puntuale (1 elemento per sezione max)
- Aggiungere #0F0F14 quasi-nero per sezioni premium

Cosa NON fare mai più:
- 3 card identiche icona+titolo+testo
- Gradient hero con foto e testo overlay full-page
- Barra di statistiche (500+ clienti, 98% soddisfatti)
- Font di default
