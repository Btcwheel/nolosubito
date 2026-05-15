/// <reference lib="deno.ns" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const GROQ_API_KEY           = Deno.env.get("GROQ_API_KEY")!;
const SUPABASE_URL           = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://nolosubito.quixel.it";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GROQ_MODEL = "llama-3.3-70b-versatile";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: CORS });
  }

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const [offersRes, configsRes] = await Promise.all([
      supabase.from("offers").select("make, model, category, fuel_type, segments, vehicle_image").eq("is_active", true),
      supabase.from("offer_configs").select("make, model, segment, duration_months, annual_km, advance_payment, monthly_rent").eq("is_active", true),
    ]);

    if (offersRes.error) throw new Error("offers query: " + offersRes.error.message);
    if (configsRes.error) throw new Error("configs query: " + configsRes.error.message);

    const offers = offersRes.data || [];
    const configs = configsRes.data || [];

    const minPriceMap: Record<string, number> = {};
    for (const c of configs) {
      const key = `${c.make}|${c.model}`;
      if (!minPriceMap[key] || c.monthly_rent < minPriceMap[key]) {
        minPriceMap[key] = c.monthly_rent;
      }
    }

    const offersTable = offers
      .map(o => {
        const price = minPriceMap[`${o.make}|${o.model}`];
        const link = `${SITE_URL}/vehicle/${encodeURIComponent(o.make)}/${encodeURIComponent(o.model)}`;
        const segmentLabels = (o.segments || []).join(", ") || "P.IVA";
        return `- ${o.make} ${o.model} | ${o.category} | ${o.fuel_type} | da €${price ?? "—"}/mese | ${segmentLabels} | ${link}`;
      })
      .join("\n");

    const systemPrompt = `Sei Luca, consulente NLT di Nolosubito (${SITE_URL}). Sei un professionista preparato, cordiale e diretto — non un chatbot.

## PRIMA DI SCRIVERE QUALSIASI RISPOSTA — OBBLIGATORIO
Fai questo ragionamento interno (non scriverlo, usalo solo per formulare la risposta):
1. Cosa so già di questo cliente? (tipo cliente, esigenze, nome, contatto — da tutta la cronologia)
2. Cosa gli ho già chiesto o detto? (per non ripetermi)
3. Qual è il passo logico successivo per questa specifica conversazione?
4. La risposta che sto per dare aggiunge valore o ripete qualcosa di già detto?
Solo dopo aver fatto questo ragionamento, scrivi la risposta.

## MEMORIA DELLA CONVERSAZIONE
Non ripetere MAI:
- Domande già poste (es. se hai già chiesto privato/P.IVA, non chiedere di nuovo)
- Informazioni già condivise dal cliente
- Stesse frasi o formule usate nei messaggi precedenti
- La stessa richiesta di contatto già fatta
Ogni messaggio deve avanzare la conversazione, non girare in tondo.

## TONO
- Usa SEMPRE il "Lei". Mai il "tu". Mai eccezioni.
- Linguaggio professionale ma caldo — come un consulente esperto al telefono.
- Risposte brevi e mirate: max 3-4 frasi per messaggio. Non elenchi infiniti.
- Varia le formule di apertura: non iniziare sempre con "Certamente" o "Ottima domanda".

## OBIETTIVI (in ordine di priorità)
1. Capire se è Privato, P.IVA o Azienda — chiederlo UNA SOLA VOLTA se non emerge naturalmente.
2. Verificare i requisiti documentali — solo quando c'è interesse concreto a procedere.
3. Ottenere nome + contatto (email o telefono) per passare al preventivo.
4. Rispondere a domande tecniche sul NLT o sul catalogo.

## COME OTTENERE IL LEAD — NATURALMENTE
Non usare formule fisse. Adatta la richiesta al contesto:
- Se parla di un veicolo specifico: "Vuole che Le prepari un preventivo su misura? Bastano nome e contatto."
- Se ha fatto domande tecniche: "La situazione è chiara — per procedere mi serve solo un riferimento per ricontattarLa."
- Se esita: "Nessun impegno — posso inviarLe le opzioni via mail così le valuta con calma."
- Non chiedere il contatto se lo ha già fornito. Non chiederlo più di una volta per conversazione se rifiuta.

## QUALIFICA REQUISITI
- Privati: serve CUD o Modello Unico recente.
- Aziende/P.IVA: servono 2 bilanci o 2 dichiarazioni dei redditi.
- Se mancano i requisiti: proporre un garante.
- Chiedi i requisiti SOLO quando l'interesse è concreto, non all'inizio.

## CONOSCENZA NLT

### Cosa include il canone
Assicurazione RCA + Kasko, manutenzione ordinaria e straordinaria, soccorso stradale H24, bollo, auto sostitutiva. Il cliente non diventa proprietario.

### Vantaggi per segmento
**P.IVA/Aziende:** canone deducibile 80-100%, IVA recuperabile 40-100%, zero immobilizzo capitale.
Costo netto approssimativo: canone − (canone × 0.22 × 0.40) − (canone × 0.80 × 0.30)
Esempio: €690/mese → netto ~€464/mese

**Privati:** tutto incluso, canone fisso, cambio auto ogni 2-5 anni, anticipo opzionale.

**Fleet 5+ veicoli:** sconti volumetrici, gestione centralizzata, sostitutiva garantita.

### Durate e KM
24, 36, 48, 60 mesi — 10.000 / 15.000 / 20.000 / 25.000 / 30.000 / 40.000 km/anno.
Anticipo opzionale da €0 a €10.000 (più anticipo = canone più basso).

### Incentivi 2025
BEV (elettrici): €4.000/veicolo per flotte ≥5. PHEV (ibridi plug-in): €2.000/veicolo per flotte ≥5.

### NLT vs Leasing vs Acquisto
NLT batte il leasing su deducibilità e servizi inclusi; batte l'acquisto su liquidità e semplicità.
Il NLT è in crescita +34% in Italia (ANIASA 2025).

### Processo
1. Scelta veicolo → 2. Verifica documenti → 3. Approvazione 24-48h → 4. Consegna 5-10 giorni.

## CATALOGO VEICOLI
${offersTable}

## REGOLE CATALOGO
Parla SOLO dei veicoli in lista. Se il modello richiesto non c'è, proponi l'alternativa più simile.
Quando citi un veicolo, includi sempre il link e il prezzo da catalogo.

## FORMATO RISPOSTE
- Italiano, naturale, mai robotico.
- Spezza la risposta in 2-3 messaggi brevi separati dal separatore || (come farebbe un umano su WhatsApp).
- Ogni segmento: 1-2 frasi max. Naturale, non elenchi.
- I link devono essere SEMPRE nella forma completa: https://nolosubito.quixel.it/vehicle/MARCA/MODELLO
- Non ricapitolare quello che il cliente ha appena detto.
- Non iniziare con "Certamente!", "Ottima domanda!", "Capisco perfettamente!" — sono frasi da bot.
- NON scrivere mai istruzioni interne o note tra parentesi. Scrivi solo ciò che il cliente legge.
- Esempio formato: "Prima cosa da dire || Seconda cosa || Eventuale domanda o link"`;

    const SAVE_LEAD_TOOL = {
      type: "function",
      function: {
        name: "save_lead",
        description: "Salva i dati del cliente nel CRM quando hai raccolto nome e almeno email o telefono",
        parameters: {
          type: "object",
          properties: {
            nome:         { type: "string",  description: "Nome e cognome del cliente" },
            email:        { type: "string",  description: "Email del cliente (stringa vuota se non fornita)" },
            telefono:     { type: "string",  description: "Numero di telefono (stringa vuota se non fornito)" },
            tipo_cliente: { type: "string",  enum: ["Privato", "P.IVA", "Azienda"] },
            interesse:    { type: "string",  description: "Veicolo/configurazione/esigenze emerse nella conversazione" },
          },
          required: ["nome", "tipo_cliente", "interesse"],
        },
      },
    };

    const FALLBACK_REPLY = { reply: ["Posso ricontattarLa tra poco — mi lascia un recapito? Grazie."], offerLink: null, leadSaved: false };
    const FALLBACK_RES = new Response(JSON.stringify(FALLBACK_REPLY), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });

    // Rimuovi messaggi di errore dall'history prima di inviarli a Groq
    const cleanMessages = messages.filter((m: { role: string; content: string }) =>
      !(m.role === "assistant" && m.content?.startsWith("Posso ricontattarLa"))
    );

    const groqBody = {
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...cleanMessages,
      ],
      tools: [SAVE_LEAD_TOOL],
      tool_choice: "auto",
      temperature: 0.85,
      max_tokens: 600,
    };

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify(groqBody),
    });

    if (!groqRes.ok) {
      console.error("Groq error:", groqRes.status, await groqRes.text().catch(() => ""));
      return FALLBACK_RES;
    }

    const groqData = await groqRes.json();
    const choice = groqData.choices?.[0];

    let replyParts = [];
    let leadSaved = false;

    if (choice?.finish_reason === "tool_calls" && choice.message?.tool_calls) {
      const toolCall = choice.message.tool_calls[0];
      if (toolCall.function.name === "save_lead") {
        try {
          const args = JSON.parse(toolCall.function.arguments);
          // Salva solo se ha almeno nome e (email o telefono)
          if (args.nome && (args.email || args.telefono)) {
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
          }
        } catch (_) { /* argomenti malformati — ignora */ }

        if (leadSaved) {
          const followUpRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
            body: JSON.stringify({
              model: GROQ_MODEL,
              messages: [
                { role: "system", content: systemPrompt },
                ...messages,
                choice.message,
                { role: "tool", tool_call_id: toolCall.id, content: "Lead salvato. Ringrazia il cliente e conferma che un consulente lo contatterà entro 24 ore." },
              ],
              temperature: 0.7,
              max_tokens: 300,
            }),
          });
          if (followUpRes.ok) {
            const followUpData = await followUpRes.json();
            const txt = followUpData.choices?.[0]?.message?.content || "Grazie! Un consulente la contatterà presto.";
            replyParts = txt.split("||").map((s: string) => s.trim()).filter(Boolean);
          } else {
            replyParts = ["Grazie! Un consulente Nolosubito la contatterà entro 24 ore."];
          }
        }
      }
    }

    // Risposta testuale normale (non sovrascrivere se leadSaved ha già impostato replyParts)
    if (!leadSaved) {
      const content = choice?.message?.content || "";
      const cleanContent = content
        .replace(/<function=[^>]+>.*?<\/function>/gs, "")
        .replace(/^\(.*\)\s*$/gm, "")
        .trim();
      replyParts = cleanContent ? cleanContent.split("||").map((s: string) => s.trim()).filter(Boolean) : [];
    }

    if (replyParts.length === 0) {
      replyParts = ["Ho ricevuto la sua richiesta, un attimo."];
    }

    const reply = replyParts.join("\n\n");

    const vehicleRegex = new RegExp(`(${SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\/vehicle\\/[^\\s).,;!?]+)`);
    const offerLinkMatch = reply.match(vehicleRegex);
    const offerLink = offerLinkMatch ? offerLinkMatch[1].replace(/[.,;!?]+$/, '') : null;

    const replyPartsArray = reply.split("\n\n").filter(Boolean);

    return new Response(JSON.stringify({ reply: replyPartsArray, offerLink, leadSaved }), {
      status: 200,
      headers: { ...CORS, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("chat-ai error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
