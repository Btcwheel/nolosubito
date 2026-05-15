/// <reference lib="deno.ns" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY      = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL           = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://nolosubito.quixel.it";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "claude-haiku-4-5-20251001";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS });

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const [offersRes, configsRes] = await Promise.all([
      supabase.from("offers").select("make, model, category, fuel_type, segments").eq("is_active", true),
      supabase.from("offer_configs").select("make, model, segment, monthly_rent").eq("is_active", true),
    ]);

    if (offersRes.error) throw new Error("offers: " + offersRes.error.message);
    if (configsRes.error) throw new Error("configs: " + configsRes.error.message);

    const minPriceMap: Record<string, number> = {};
    for (const c of configsRes.data || []) {
      const key = `${c.make}|${c.model}`;
      if (!minPriceMap[key] || c.monthly_rent < minPriceMap[key]) minPriceMap[key] = c.monthly_rent;
    }

    const offersTable = (offersRes.data || [])
      .map(o => {
        const price = minPriceMap[`${o.make}|${o.model}`];
        const link = `${SITE_URL}/vehicle/${encodeURIComponent(o.make)}/${encodeURIComponent(o.model)}`;
        return `- ${o.make} ${o.model} | ${o.category} | ${o.fuel_type} | da €${price ?? "—"}/mese | ${link}`;
      })
      .join("\n");

    const now = new Date().toLocaleString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });
    const systemPrompt = `Sei Luca, consulente NLT di Nolosubito (${SITE_URL}). Professionista preparato, cordiale e diretto.
Ora corrente in Italia: ${now} — usa questa info per i saluti (buongiorno/buon pomeriggio/buonasera).

## PRIMA DI RISPONDERE — OBBLIGATORIO
Ragionamento interno silenzioso:
1. Cosa so già del cliente? (tipo, esigenze, nome, contatto)
2. Cosa ho già chiesto/detto? (non ripetere)
3. Qual è il passo logico successivo?

## TONO
- Inizia con "Lei". Se il cliente usa "tu", adattati al "tu" per tutta la conversazione.
- Professionale ma caldo. Varia le formule di apertura.
- MAI: "Certamente!", "Ottima domanda!", "Capisco perfettamente!"
- Grammatica italiana corretta: "il SUV" / "i SUV" (NON "gli SUV"), "il NLT", "i km".
- NON usare mai markdown nel testo: niente **grassetto**, niente *corsivo*, niente elenchi con trattini. Solo testo normale come in un messaggio WhatsApp.

## OBIETTIVI
1. Capire se Privato, P.IVA o Azienda — UNA SOLA VOLTA.
2. Verificare requisiti (CUD / 2 bilanci) solo quando c'è interesse concreto.
3. Ottenere nome + contatto → chiama save_lead.
4. Rispondere su NLT e catalogo.

## LEAD CAPTURE — NATURALE
Adatta al contesto, non usare formule fisse. Non chiedere il contatto più di una volta se rifiuta.
Quando hai nome + (email o telefono) → chiama save_lead immediatamente.

## GESTIONE REQUISITI MANCANTI
Se il cliente dice che non ha CUD (privati) o bilanci (aziende), rispondi ESATTAMENTE così:
"Capito, nessun problema. Ma senza CUD possiamo comunque procedere, solo se ci possiamo avvalere di un garante (una persona fisica con CUD). Cosa ne pensa, vuole prima provare a trovare un garante e poi mi ricontatta? Oppure ha già un garante e quindi andiamo avanti?"
Non aggiungere altro. Aspetta la risposta del cliente.

## CONOSCENZA NLT
Canone include: RCA+Kasko, manutenzione, soccorso H24, bollo, auto sostitutiva.
Privati: CUD richiesto. Aziende/P.IVA: 2 bilanci. Senza requisiti: proponi garante.
Durate: 24-60 mesi. KM: 10K-40K/anno. Anticipo: €0-10K opzionale.
P.IVA: canone deducibile 80-100%, IVA recuperabile 40-100%.

## CATALOGO
${offersTable}

Parla SOLO dei veicoli in lista. Includi sempre link completo e prezzo.

## FORMATO
- 2-3 messaggi separati da ||
- Ogni segmento: 1-2 frasi, naturale
- NON scrivere note o istruzioni tra parentesi`;

    const SAVE_LEAD_TOOL = {
      name: "save_lead",
      description: "Salva i dati del cliente nel CRM quando hai nome e almeno email o telefono",
      input_schema: {
        type: "object",
        properties: {
          nome:         { type: "string",  description: "Nome e cognome" },
          email:        { type: "string",  description: "Email (vuota se non fornita)" },
          telefono:     { type: "string",  description: "Telefono (vuoto se non fornito)" },
          tipo_cliente: { type: "string",  enum: ["Privato", "P.IVA", "Azienda"] },
          interesse:    { type: "string",  description: "Esigenze emerse nella conversazione" },
        },
        required: ["nome", "tipo_cliente", "interesse"],
      },
    };

    const FALLBACK_REPLY = {
      reply: ["Posso ricontattarLa tra poco — mi lascia un recapito? Grazie."],
      offerLink: null, leadSaved: false,
    };
    const FALLBACK_RES = new Response(JSON.stringify(FALLBACK_REPLY), {
      status: 200, headers: { ...CORS, "Content-Type": "application/json" },
    });

    // Rimuovi messaggi di errore dall'history
    const cleanMessages = messages.filter((m: { role: string; content: string }) =>
      !(m.role === "assistant" && m.content?.startsWith("Posso ricontattarLa"))
    );

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 600,
        system: systemPrompt,
        messages: cleanMessages,
        tools: [SAVE_LEAD_TOOL],
      }),
    });

    if (!anthropicRes.ok) {
      console.error("Anthropic error:", anthropicRes.status, await anthropicRes.text().catch(() => ""));
      return FALLBACK_RES;
    }

    const data = await anthropicRes.json();
    const content: { type: string; text?: string; id?: string; name?: string; input?: Record<string, string> }[] = data.content || [];

    let replyParts: string[] = [];
    let leadSaved = false;

    // Gestisci tool_use (save_lead)
    const toolUse = content.find(b => b.type === "tool_use" && b.name === "save_lead");
    if (toolUse?.input) {
      const args = toolUse.input;
      if (args.nome && (args.email || args.telefono)) {
        try {
          await supabase.from("leads").insert({
            nome: args.nome,
            email: args.email || null,
            telefono: args.telefono || null,
            tipo_cliente: args.tipo_cliente || null,
            interesse: args.interesse,
            chat_history: messages,
            source: "chat-ai",
            status: "Nuovo",
          });
          leadSaved = true;
        } catch (_) { /* ignora errore insert */ }
      }

      // Follow-up dopo save_lead
      if (leadSaved) {
        const followUp = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model: MODEL,
            max_tokens: 300,
            system: systemPrompt,
            messages: [
              ...cleanMessages,
              { role: "assistant", content },
              { role: "user", content: [{ type: "tool_result", tool_use_id: toolUse.id, content: "Lead salvato." }] },
            ],
          }),
        });
        if (followUp.ok) {
          const fuData = await followUp.json();
          const txt = fuData.content?.find((b: { type: string; text?: string }) => b.type === "text")?.text || "Grazie! Un consulente la contatterà presto.";
          replyParts = txt.split("||").map((s: string) => s.trim()).filter(Boolean);
        } else {
          replyParts = ["Grazie! La contatteremo entro 24 ore."];
        }
      }
    }

    // Risposta testuale normale
    if (!leadSaved) {
      const textBlock = content.find(b => b.type === "text");
      const raw = textBlock?.text || "";
      const clean = raw.replace(/^\(.*\)\s*$/gm, "").trim();
      replyParts = clean ? clean.split("||").map((s: string) => s.trim()).filter(Boolean) : [];
    }

    if (replyParts.length === 0) replyParts = ["Ho ricevuto la sua richiesta, un attimo."];

    const reply = replyParts.join("\n\n");
    const vehicleRegex = new RegExp(`(${SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\/vehicle\\/[^\\s).,;!?]+)`);
    const offerLink = reply.match(vehicleRegex)?.[1]?.replace(/[.,;!?]+$/, "") || null;

    return new Response(JSON.stringify({ reply: replyParts, offerLink, leadSaved }), {
      status: 200, headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("chat-ai error:", msg);
    return new Response(JSON.stringify({
      reply: ["Posso ricontattarLa tra poco — mi lascia un recapito? Grazie."],
      offerLink: null, leadSaved: false,
    }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
