/// <reference lib="deno.ns" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const body = await req.json() as {
      base64?: string;       // singola immagine (legacy)
      pages?: string[];      // array di pagine PDF renderizzate come immagini
      mediaType?: string;
      text?: string;
    };

    const userContent: unknown[] = [];

    // Più pagine PDF come immagini (preferito — Claude Vision legge le tabelle correttamente)
    if (body.pages && body.pages.length > 0) {
      for (const pageB64 of body.pages) {
        userContent.push({
          type: "image",
          source: { type: "base64", media_type: "image/jpeg", data: pageB64 },
        });
      }
    } else if (body.base64 && body.mediaType) {
      userContent.push({
        type: "image",
        source: { type: "base64", media_type: body.mediaType, data: body.base64 },
      });
    }

    const textInput = body.text ?? "";
    userContent.push({
      type: "text",
      text: `Sei un esperto di noleggio a lungo termine (NLT) italiano. Estrai i dati dal preventivo e restituisci SOLO JSON valido, senza testo aggiuntivo.
${textInput ? `Testo estratto:\n${textInput}` : ""}

STEP 1 — Identifica il carrier leggendo intestazione/logo:
- DRIVALIA → regole Drivalia
- AYVENS / ALD Automotive → regole Ayvens
- VOLKSWAGEN FINANCIAL SERVICES / VOLKSWAGEN LEASING → regole VW
- LEASYS → regole Leasys
- SANTANDER / Santander Consumer Renting → regole Santander
- Altro → regole generiche

STEP 2 — Estrai canone_mensile (SEMPRE IVA inclusa, arrotondato a 2 decimali):
- DRIVALIA: campo "CANONE TOTALE" è IVA ESCLUSA → moltiplica ×1.22
- AYVENS: usa "Canone mensile I.V.A. inclusa" (es. €443.52)
- VW: usa il valore dopo "Totale €" nel "Canone totale" (es. €807,23)
- LEASYS: usa colonna "Iva Inclusa" del "Canone Totale" (es. €772,20)
- SANTANDER: ignora il box "Canone mensile" principale (IVA esclusa); usa "Canone Mensile inclusa IVA" dalla tabella sotto (es. 898,60€)
- Generico: preferisci sempre il valore con IVA inclusa

STEP 3 — Estrai km_annui (sempre annui, numero intero):
- Se il doc mostra "Km/Anno" o "km annui" → usa direttamente quel valore
- Se mostra solo "km totali" o "KM" senza /anno → calcola: km_totali / durata_mesi * 12
- DRIVALIA: campo "KM" = km totali → dividi per durata_mesi e moltiplica per 12
- AYVENS: "KM totali" → calcola come sopra
- VW: "Km totali" → calcola come sopra
- LEASYS: "km totali" → calcola come sopra
- SANTANDER: "Km / Anno" → usa direttamente

STEP 4 — Estrai anticipo (IVA inclusa se disponibile, altrimenti IVA esclusa):
- LEASYS: usa la colonna "Iva Inclusa" dell'anticipo (es. €1.830,00)
- Altri: usa il valore indicato come anticipo/acconto

STEP 5 — Estrai SOLO i servizi ESPLICITAMENTE elencati come inclusi nel documento.
NON aggiungere servizi non presenti. NON assumere servizi standard. Se un servizio è marcato "No", "Escluso" o non è presente nella lista, NON includerlo.

Normalizza i nomi dei servizi trovati (mapping per carrier):
RCA: RCA, Assicurazione RC, RCA max 25 milioni
Incendio e Furto: Copertura Incendio e Furto, Incendio e Furto, Limitazione Furto-Incendio, Limitazione responsabilità Furto-Incendio, Assicurazione Incendio e Furto
Copertura Danni: Copertura Danni, Danni, Limitazione danni, Limitazione responsabilità danni, Copertura Danni base, Kasko, Copertura Incendio/Furto/Danni
Manutenzione: Manutenzione Ordinaria e Straordinaria, Manutenzione Ordinaria/Straordinaria, Manutenzione Meccanica, Manutenzione meccanica (Plus)
Soccorso Stradale: Soccorso Stradale, Assistenza stradale, Ald Automotive Assistance, Traino Standard, Assistenza al parcheggio posteriore, Sostitutiva Z + Traino
Cristalli: Copertura Cristalli, Cristalli, Cristalli Penale
Gestione Multe: Gestione Multe, Gestione Sinistri, Rinotifica Contravvenzioni, Rinotifica al Cliente, Gestione Sinistri, Gestione Sinistri
Pneumatici: Pneumatici, Pneumatici Performance a numero limitato
Tassa di Proprietà: Tassa di Proprietà, Tassa Automobilistica, Tassa di Possesso con Riaddebito, Servizio pagamento tasse auto, Tassa Automobilistica - Riaddebito Periodico
Auto Sostitutiva: Auto Sostitutiva, Veicolo Sostitutivo, Sostitutiva Z, Auto Piccola dopo 24H
Kasko: Kasko, KASKO
Telematica: Telematica, GPS, Blackbox, I-Care Smart, My-Leasys App, Telematica (Basic)
Infortuni Conducente: Infortuni Conducente, PAI, Assicurazione Infortuni Conducente
Tutela Legale: Tutela Legale

ATTENZIONE:
- Per Ayvens: tabella "Servizi inclusi" ha colonne "Si"/"No" — includi solo quelli con "Si"
- Per Leasys: tabella con colonne Sì/No — includi solo quelli con "Sì"
- Per Drivalia: sezione gialla "SERVIZI INCLUSI" — leggi la lista
- Per Santander: sezione gialla "Pack Servizi" — leggi la lista
- Per VW: sezione gialla "SERVIZI INCLUSI" — leggi la lista

Schema output:
{
  "carrier": string|null,
  "veicolo_marca": string|null,
  "veicolo_modello": string|null,
  "veicolo_allestimento": string|null,
  "alimentazione": string|null,
  "durata_mesi": number|null,
  "km_annui": number|null,
  "anticipo": number|null,
  "deposito_cauzionale": number|null,
  "canone_mensile": number|null,
  "servizi": string[],
  "note_aggiuntive": string|null
}`,
    });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    const data = await response.json() as any;
    const raw = data.content?.[0]?.text ?? "{}";

    // Estrai il JSON dalla risposta (Claude potrebbe aggiungere testo intorno)
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : {};

    return new Response(JSON.stringify({ data: parsed }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
