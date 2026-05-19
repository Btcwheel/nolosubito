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
      text: `Estrai i dati di questo preventivo di noleggio a lungo termine e restituisci solo JSON valido.
${textInput ? `Testo:\n${textInput}` : ""}

Schema:
{
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
}

Regole: numeri senza simboli, km_annui annuali, usa il canone IVA inclusa se presente, non aggiungere testo extra.`,
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
