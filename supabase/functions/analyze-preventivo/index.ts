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
      text: `Analizza questo preventivo di noleggio a lungo termine ed estrai i dati in formato JSON.
${textInput ? `Testo del documento:\n${textInput}` : ""}

Restituisci SOLO un oggetto JSON valido con questa struttura esatta (usa null per i campi non trovati):
{
  "veicolo_marca": "...",
  "veicolo_modello": "...",
  "veicolo_allestimento": "...",
  "alimentazione": "...",
  "durata_mesi": 36,
  "km_annui": 15000,
  "anticipo": 0,
  "deposito_cauzionale": 0,
  "canone_mensile": 0,
  "servizi": ["manutenzione ordinaria", "assicurazione RC", "..."],
  "note_aggiuntive": "..."
}

Regole:
- I valori numerici (durata, km, anticipo, deposito, canone) devono essere numeri puri senza simboli
- I km_annui devono essere il valore annuale (non totale)
- I servizi devono essere una lista di stringhe descrittive
- Non includere mai il nome del fornitore originale (Leasys, Ayvens, ALD, Arval, ecc.) nei dati estratti
- Se trovi un canone IVA inclusa ed esclusa, usa quello IVA inclusa`,
    });

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
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
