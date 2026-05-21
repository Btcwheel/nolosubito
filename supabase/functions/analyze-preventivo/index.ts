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
      base64?: string;
      mediaType?: string;
      text?: string;
    };

    const userContent: unknown[] = [];

    if (body.base64 && body.mediaType) {
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

STEP 5 — Estrai servizi inclusi come array di stringhe brevi (max 60 caratteri ciascuna).
Normalizza i nomi comuni:
- RCA / Assicurazione RC → "RCA"
- Manutenzione Ordinaria/Straordinaria → "Manutenzione Ordinaria e Straordinaria"
- Incendio e Furto / Limitazione Furto-Incendio → "Copertura Incendio e Furto"
- Danni / Copertura Danni / Limitazione danni → "Copertura Danni"
- Cristalli → "Copertura Cristalli"
- Soccorso Stradale / Assistenza stradale → "Soccorso Stradale"
- Pneumatici → "Pneumatici"
- Gestione Multe / Rinotifica Contravvenzioni → "Gestione Multe"
- Auto sostitutiva / Veicolo Sostitutivo → "Auto Sostitutiva"
- Tassa di Proprietà / Tassa Automobilistica → "Tassa di Proprietà"
- Kasko → "Kasko"
- Infortuni Conducente / PAI → "Infortuni Conducente"
- Tutela Legale → "Tutela Legale"
- GPS / Telematica / Blackbox → "Telematica"

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
