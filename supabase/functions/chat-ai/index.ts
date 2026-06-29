import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY")!;
const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://nolosubito.it";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VERSION = "chat-ai v3.1-gemini-embedding";

// ── ROUTER ──────────────────────────────────────────────────────────
const COMPLEX_KEYWORDS = [
  "franchigia", "penale", "penali", "confront", "differenza", "contratto",
  "clausola", "condizioni", "risoluzione", "anticipata", "multa",
  "danno", "sinistro", "kaskara", "furto", "incendio", "recesso",
  "subentro", "riconsegna", "usura", "danni", "secondo conducente",
  "garante", "finanziaria", "approvazione", "carrier", "arval", "leasys",
  "ayvens", "unipolrental", "unipol",
];

function classifyComplexity(query: string): "simple" | "complex" {
  const lower = query.toLowerCase();
  const wordCount = query.split(/\s+/).length;
  const matchedKeywords = COMPLEX_KEYWORDS.filter(k => lower.includes(k)).length;
  const hasStrongSignals = matchedKeywords >= 2;
  if (wordCount > 24 || hasStrongSignals) return "complex";
  return "simple";
}

// ── KB EMBEDDING SEARCH ──────────────────────────────────────────────
async function getEmbedding(text: string): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:embedContent?key=${GOOGLE_AI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/gemini-embedding-2",
        content: { parts: [{ text: text.slice(0, 8000) }] },
        outputDimensionality: 768,
      }),
    },
  );
  if (!res.ok) throw new Error("embedding API error");
  const data = await res.json() as { embedding: { values: number[] } };
  return data.embedding.values;
}

async function searchKb(supabase: any, query: string): Promise<string[]> {
  if (query.length < 3) return [];
  try {
    const embedding = await getEmbedding(query);
    const { data } = await supabase.rpc("match_knowledge_chunks", {
      query_embedding: embedding,
      match_threshold: 0.7,
      match_count: 5,
    });
    if (data) return data.map((r: { content: string }) => r.content);
  } catch (_) {
    // fallback: niente KB
  }
  return [];
}

// ── TOOL EXECUTORS ───────────────────────────────────────────────────
async function getVehicles(supabase: any, args: Record<string, string>) {
  let query = supabase.from("offers").select("make, model, category, fuel_type, segments, promo_expires_at, promo_discount_pct, promo_segment, promo_services").eq("is_active", true);
  if (args.make) query = query.ilike("make", `%${args.make}%`);
  if (args.model) query = query.ilike("model", `%${args.model}%`);
  if (args.category) query = query.ilike("category", `%${args.category}%`);
  if (args.fuel) query = query.ilike("fuel_type", `%${args.fuel}%`);
  const { data: offers } = await query;
  if (!offers || offers.length === 0) return "Nessun veicolo trovato.";

  const makes = [...new Set(offers.map((o: any) => o.make))];
  const models = [...new Set(offers.map((o: any) => o.model))];

  const { data: configs } = await supabase
    .from("offer_configs")
    .select("make, model, segment, monthly_rent")
    .in("make", makes)
    .in("model", models)
    .eq("is_active", true);

  const minPrice: Record<string, number> = {};
  for (const c of configs || []) {
    const key = `${c.make}|${c.model}`;
    if (!minPrice[key] || c.monthly_rent < minPrice[key]) minPrice[key] = c.monthly_rent;
  }

  return offers.map((o: any) => {
    const price = minPrice[`${o.make}|${o.model}`];
    let promo = "";
    if (o.promo_expires_at && new Date(o.promo_expires_at) > new Date()) {
      const discount = o.promo_discount_pct ? ` -${o.promo_discount_pct}%` : "";
      promo = ` [PROMO${discount}]`;
    }
    return `${o.make} ${o.model} | ${o.category} | ${o.fuel_type} | da €${price ?? "—"}/mese${promo} | ${SITE_URL}/vehicle/${encodeURIComponent(o.make)}/${encodeURIComponent(o.model)}`;
  }).join("\n");
}

async function getVehicleDetail(supabase: any, args: Record<string, string>) {
  const { data: offers } = await supabase
    .from("offers")
    .select("make, model, category, fuel_type, segments, description, promo_expires_at, promo_discount_pct, promo_segment, promo_services, foto_prev, foto_url, gallery")
    .eq("is_active", true)
    .ilike("make", `%${args.make}%`)
    .ilike("model", `%${args.model}%`)
    .limit(1);

  if (!offers || offers.length === 0) return "Veicolo non trovato.";
  const o = offers[0];

  const { data: configs } = await supabase
    .from("offer_configs")
    .select("segment, duration, km, monthly_rent, advance")
    .eq("make", o.make)
    .eq("model", o.model)
    .eq("is_active", true)
    .order("monthly_rent");

  let detail = `${o.make} ${o.model}\nCategoria: ${o.category} | Alimentazione: ${o.fuel_type}\nSegmenti: ${o.segments || "—"}`;
  if (o.description) detail += `\n\nDescrizione: ${o.description}`;
  if (o.promo_expires_at && new Date(o.promo_expires_at) > new Date()) {
    detail += `\n\nPROMO: sconto ${o.promo_discount_pct || 0}% fino al ${new Date(o.promo_expires_at).toLocaleDateString("it-IT")}`;
  }
  if (configs && configs.length > 0) {
    detail += "\n\nConfigurazioni disponibili:";
    for (const c of configs) {
      detail += `\n- ${c.segment || "N/A"} | ${c.duration || "—"} mesi | ${c.km || "—"} km | €${c.monthly_rent}/mese${c.advance ? ` (anticipo €${c.advance})` : ""}`;
    }
  }
  return detail;
}

async function getCarrier(supabase: any, args: Record<string, string>) {
  const name = args.name?.toLowerCase() || "";
  const { data: chunks } = await supabase
    .from("knowledge_chunks")
    .select("content")
    .textSearch("content", name || "carrier franchigie penali", { type: "websearch" })
    .limit(5);

  if (!chunks || chunks.length === 0) return "Nessuna informazione carrier trovata.";
  return chunks.map((c: { content: string }) => c.content).join("\n---\n");
}

async function getProduct(supabase: any, args: Record<string, string>) {
  const name = args.name?.toLowerCase() || "";
  const { data: docs } = await supabase
    .from("knowledge_documents")
    .select("id, title")
    .ilike("title", `%${name}%`)
    .eq("is_active", true)
    .limit(1);

  if (!docs || docs.length === 0) return "Prodotto non trovato.";
  const { data: chunks } = await supabase
    .from("knowledge_chunks")
    .select("content")
    .eq("document_id", docs[0].id)
    .order("created_at")
    .limit(20);

  if (!chunks || chunks.length === 0) return "Nessun dettaglio trovato.";
  return chunks.map((c: { content: string }) => c.content).join("\n");
}

async function saveLead(supabase: any, args: Record<string, string>, sessionId: string, messages: any[]) {
  if (!args.nome || (!args.email && !args.telefono)) return "Dati insufficienti per salvare il lead.";
  try {
    await supabase.from("leads").insert({
      nome: args.nome, email: args.email || null, telefono: args.telefono || null,
      tipo_cliente: args.tipo_cliente || null, interesse: args.interesse,
      chat_history: messages, source: "chat-ai", status: "Nuovo",
    });
    return "Lead salvato con successo.";
  } catch (_) {
    return "Errore nel salvataggio del lead.";
  }
}

async function escalateToOperator(supabase: any, args: Record<string, string>, sessionId: string, messages: any[]) {
  const payload = {
    session_id: sessionId,
    user_question: args.question || "",
    chat_history: messages,
    status: "waiting",
    operator_id: null,
    taken_at: null,
    resolved_at: null,
  };

  let { error } = await supabase
    .from("escalated_sessions")
    .upsert(payload, { onConflict: "session_id" });

  if (error) {
    console.warn("[chat-ai] escalation upsert failed, retrying insert:", error.message);
    const retry = await supabase.from("escalated_sessions").insert(payload);
    error = retry.error;
  }

  if (error) {
    console.error("[chat-ai] escalation insert failed:", error.message);
    throw new Error(`Escalation failed: ${error.message}`);
  }
  return "Escalation creata.";
}

// ── TOOL HANDLER ──────────────────────────────────────────────────────
async function handleTool(name: string, input: Record<string, string>, supabase: any, sessionId: string, messages: any[]): Promise<string> {
  switch (name) {
    case "get_vehicles": return await getVehicles(supabase, input);
    case "get_vehicle_detail": return await getVehicleDetail(supabase, input);
    case "get_carrier": return await getCarrier(supabase, input);
    case "get_product": return await getProduct(supabase, input);
    case "save_lead": return await saveLead(supabase, input, sessionId, messages);
    case "escalate_to_operator": return await escalateToOperator(supabase, input, sessionId, messages);
    default: return `Tool sconosciuto: ${name}`;
  }
}

// ── SYSTEM PROMPT (umanizzato) ────────────────────────────────────────
function buildSystemPrompt(now: string, kbContext: string[]) {
  const kbSection = kbContext.length > 0
    ? `\n\n## INFO UTILI (usa se pertinenti)\n${kbContext.join("\n---\n")}`
    : "";

  return `Sei Luca, consulente NLT di Nolosubito (${SITE_URL}). Parli italiano. Sei cordiale, diretto, umano. Niente fronzoli.

Ora: ${now}.

## COME PARLARE
- Naturale, come in una conversazione WhatsApp.
- MAI: "Certamente", "Ottima domanda", "In qualità di", "Ecco", "Perfetto!"
- MAI elenchi puntati, grassetto, corsivo o markdown.
- MAI frasi fatte da bot.
- Se il cliente usa "tu", usa "tu". Altrimenti "Lei".
- Varia i saluti. Non ripetere sempre la stessa formula.
- Frasi brevi. Messaggi di 1-3 frasi. Non scrivere romanzi.

## ESEMPI — COME RISPONDERE
Cliente: "Quanto costa la BMW X1?"
Luca: "Buongiorno! La BMW X1 parte da circa 350 € al mese, dipende dall'anticipo e dai km. Che tipo di contratto sta cercando?"

Cliente: "Mi spieghi Be Free"
Luca: "Be Free di Leasys è un'offerta interessante: 48 mesi, 60.000 km, restituzione senza penale dal 12° al 24° mese. Include RCA, Kasko, manutenzione. Posso mandarle un preventivo personalizzato?"

Cliente: "Ciao, vorrei informazioni"
Luca: "Ciao! Sono Luca, consulente Nolosubito. Che tipo di auto sta cercando? Per privato o per la sua attività?"

Cliente: "Quali sono le franchigie Arval?"
Luca: "Le franchigie Arval dipendono dal modello. In generale, collisione tra 500 e 1.200 €, furto e incendio 10-15%. Se vuole Le faccio un esempio sul modello che Le interessa."

## COME NON RISPONDERE MAI
Cliente: "Quanto costa la BMW X1?"
✗ "Certamente! Ecco le informazioni richieste: La BMW X1 è disponibile a partire da 350 € mensili..."
✗ "Ottima domanda! La BMW X1 rientra nella nostra gamma di SUV premium..."
✗ "Grazie per avermi contattato! In qualità di consulente Nolosubito, Le posso confermare che..."

## REGOLE
1. Se un cliente chiede di un veicolo, usa get_vehicles per cercarlo. Se chiede dettagli, usa get_vehicle_detail.
2. Se chiede di carrier (Arval, Leasys, Ayvens, UnipolRental), usa get_carrier.
3. Se chiede di un prodotto specifico (Be Free, Be Free Biz, Miles), usa get_product.
4. Se non hai la risposta certa al 100%, usa escalate_to_operator. Non inventare.
5. Quando hai nome + email + telefono, chiama save_lead. Fatto con naturalezza.
6. Non chiedere "posso aiutarla?" — si vede che è una risposta da bot.

## INFO NLT BASE
Il noleggio a lungo termine include: RCA, Kasko, manutenzione, soccorso H24, bollo, auto sostitutiva. Durate 24-60 mesi, km 10.000-40.000/anno. Per privati serve CUD, per aziende 2 bilanci. Senza requisiti si può proporre un garante.
${kbSection}`;
}

// ── TOOL DEFINITIONS ─────────────────────────────────────────────────

// Formato Claude
const CLAUDE_TOOLS = [
  {
    name: "get_vehicles",
    description: "Cerca veicoli disponibili nel catalogo per marca, modello, categoria o alimentazione.",
    input_schema: {
      type: "object",
      properties: {
        make: { type: "string", description: "Marca (es. BMW, Mercedes, Audi)" },
        model: { type: "string", description: "Modello (es. X1, Classe A, Q5)" },
        category: { type: "string", description: "Categoria (es. SUV, Berlina, Station Wagon)" },
        fuel: { type: "string", description: "Alimentazione (es. Benzina, Diesel, Ibrido, Elettrico)" },
      },
    },
  },
  {
    name: "get_vehicle_detail",
    description: "Ottieni dettagli completi di un veicolo (descrizione, configurazioni, promozioni).",
    input_schema: {
      type: "object",
      properties: {
        make: { type: "string", description: "Marca" },
        model: { type: "string", description: "Modello" },
      },
      required: ["make", "model"],
    },
  },
  {
    name: "get_carrier",
    description: "Ottieni informazioni su un carrier (franchigie, penali, condizioni).",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nome del carrier (Arval, Leasys, Ayvens, UnipolRental)" },
      },
    },
  },
  {
    name: "get_product",
    description: "Ottieni informazioni dettagliate su un prodotto Nolosubito (Be Free, Be Free Biz, Miles, ecc.).",
    input_schema: {
      type: "object",
      properties: {
        name: { type: "string", description: "Nome del prodotto" },
      },
      required: ["name"],
    },
  },
  {
    name: "save_lead",
    description: "Salva i dati del cliente nel CRM quando hai nome e almeno email o telefono.",
    input_schema: {
      type: "object",
      properties: {
        nome: { type: "string", description: "Nome e cognome" },
        email: { type: "string", description: "Email" },
        telefono: { type: "string", description: "Telefono" },
        tipo_cliente: { type: "string", enum: ["Privato", "P.IVA", "Azienda"] },
        interesse: { type: "string", description: "Esigenze emerse" },
      },
      required: ["nome", "tipo_cliente", "interesse"],
    },
  },
  {
    name: "escalate_to_operator",
    description: "Chiama questo tool quando non sai rispondere a una domanda. Un operatore umano prenderà in carico il cliente.",
    input_schema: {
      type: "object",
      properties: {
        question: { type: "string", description: "La domanda del cliente" },
      },
      required: ["question"],
    },
  },
];

// Formato OpenAI (Groq)
function toOpenAITools(claudeTools: typeof CLAUDE_TOOLS) {
  return claudeTools.map(t => ({
    type: "function" as const,
    function: {
      name: t.name,
      description: t.description,
      parameters: t.input_schema,
    },
  }));
}

// ── LLM CALLERS ───────────────────────────────────────────────────────

async function callClaude(systemPrompt: string, messages: any[], tools: typeof CLAUDE_TOOLS) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 600,
      system: systemPrompt,
      messages,
      tools,
    }),
  });
  if (!res.ok) throw new Error(`Claude ${res.status}`);
  return await res.json() as { content: { type: string; text?: string; id?: string; name?: string; input?: Record<string, string> }[] };
}

async function callGroq(systemPrompt: string, messages: any[]) {
  const groqMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m: any) => ({ role: m.role, content: m.content })),
  ];

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.1-70b-versatile",
      max_tokens: 400,
      messages: groqMessages,
      tools: toOpenAITools(CLAUDE_TOOLS),
      tool_choice: "auto",
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  return await res.json() as {
    choices: {
      finish_reason: string;
      message: { content: string; tool_calls?: { id: string; function: { name: string; arguments: string } }[] };
    }[];
  };
}

// ── MAIN ──────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  console.log(`[${VERSION}] request received`);
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS });

  try {
    const { messages, session_id } = await req.json() as any;
    const sessionId: string = session_id || crypto.randomUUID();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const lastUserMessage = (messages[messages.length - 1]?.content ?? "").slice(0, 200);

    // ── TAKE-OVER GUARD ──────────────────────────────────────────────
    const { data: takeover } = await supabase
      .from("escalated_sessions")
      .select("status, operator_id")
      .eq("session_id", sessionId)
      .in("status", ["operator_joined", "waiting"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (takeover?.operator_id && takeover.status === "operator_joined") {
      console.log(`[${VERSION}] takeover-active: session ${sessionId}`);
      return new Response(JSON.stringify({
        reply: [], escalated: true, takeover: true, session_id: sessionId,
      }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    // ── SEARCH KB (automatico, semantico via pgvector) ───────────────
    const kbChunks = await searchKb(supabase, lastUserMessage);

    // ── ROUTING ──────────────────────────────────────────────────────
    const complexity = classifyComplexity(lastUserMessage);
    console.log(`[${VERSION}] routing: complexity=${complexity}`);

    const now = new Date().toLocaleString("it-IT", {
      timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit",
    });
    const systemPrompt = buildSystemPrompt(now, kbChunks);
    const cleanMessages = messages.filter((m: { role: string; content: string }) =>
      !(m.role === "assistant" && typeof m.content === "string" && m.content.startsWith("Posso ricontattarLa"))
    );

    let replyParts: string[] = [];
    let leadSaved = false;
    let escalated = false;
    let isToolCall = false;
    let toolName = "";
    let toolInput: Record<string, string> = {};

    if (complexity === "complex") {
      // Usa Claude Haiku
      const claudeRes = await callClaude(systemPrompt, cleanMessages, CLAUDE_TOOLS);
      const content: any[] = claudeRes.content || [];

      const escalateTool = content.find((b: any) => b.type === "tool_use" && b.name === "escalate_to_operator");
      if (escalateTool?.input) {
        await escalateToOperator(supabase, escalateTool.input as Record<string, string>, sessionId, messages);
        escalated = true;
        replyParts = ["Se mi da un minuto le do tutte le info di cui ha bisogno, grazie"];
      } else {
        const toolUse = content.find((b: any) => b.type === "tool_use");
        if (toolUse?.input) {
          isToolCall = true;
          toolName = toolUse.name;
          toolInput = toolUse.input as Record<string, string>;
          const result = await handleTool(toolUse.name, toolInput, supabase, sessionId, messages);

          if (toolUse.name === "save_lead") {
            leadSaved = result.includes("salvato");
            // Follow-up con Claude
            const followRes = await callClaude(systemPrompt, [
              ...cleanMessages,
              { role: "assistant", content },
              { role: "user", content: [{ type: "tool_result", tool_use_id: toolUse.id, content: result }] },
            ], []);
            const txt = followRes.content?.find((b: any) => b.type === "text")?.text || "";
            replyParts = txt ? txt.split("||").map((s: string) => s.trim()).filter(Boolean) : ["Grazie! Un consulente la contatterà presto."];
          } else {
            // Tool → risposta testuale
            const followRes = await callClaude(systemPrompt, [
              ...cleanMessages,
              { role: "assistant", content },
              { role: "user", content: [{ type: "tool_result", tool_use_id: toolUse.id, content: result }] },
            ], []);
            const txt = followRes.content?.find((b: any) => b.type === "text")?.text || "";
            replyParts = txt ? txt.split("||").map((s: string) => s.trim()).filter(Boolean) : [];
          }
        } else {
          const textBlock = content.find((b: any) => b.type === "text");
          const raw = textBlock?.text || "";
          replyParts = raw ? raw.split("||").map((s: string) => s.trim()).filter(Boolean) : [];
        }
      }
    } else {
      // Usa Groq (Llama 3.1-70B)
      const groqRes = await callGroq(systemPrompt, cleanMessages);
      const choice = groqRes.choices?.[0];

      if (choice?.finish_reason === "tool_calls" && choice.message?.tool_calls) {
        const tc = choice.message.tool_calls[0];
        toolName = tc.function.name;
        try { toolInput = JSON.parse(tc.function.arguments); } catch { toolInput = {}; }

        if (toolName === "escalate_to_operator") {
          await escalateToOperator(supabase, toolInput, sessionId, messages);
          escalated = true;
          replyParts = ["Se mi da un minuto le do tutte le info di cui ha bisogno, grazie"];
        } else {
          isToolCall = true;
          const result = await handleTool(toolName, toolInput, supabase, sessionId, messages);

          if (toolName === "save_lead") {
            leadSaved = true;
            replyParts = ["Grazie! Un consulente la contatterà presto."];
          } else {
            // Tool → risposta testuale: richiama Groq con il risultato
            const followRes = await callGroq(systemPrompt, [
              ...cleanMessages,
              choice.message,
              { role: "tool", tool_call_id: tc.id, content: result },
            ]);
            const followChoice = followRes.choices?.[0];
            const txt = followChoice?.message?.content || "";
            replyParts = txt ? txt.split("||").map((s: string) => s.trim()).filter(Boolean) : [];
          }
        }
      } else {
        const txt = choice?.message?.content || "";
        replyParts = txt ? txt.split("||").map((s: string) => s.trim()).filter(Boolean) : [];
      }
    }

    if (replyParts.length === 0) {
      replyParts = ["Ho ricevuto la sua richiesta, un attimo."];
    }

    const fullReply = replyParts.join("\n\n");
    const responseLength = fullReply.length;

    const vehicleRegex = new RegExp(
      `(${SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\/vehicle\\/[^\\s).,;!?]+)`
    );
    const offerLink = fullReply.match(vehicleRegex)?.[1]?.replace(/[.,;!?]+$/, "") || null;

    return new Response(JSON.stringify({
      reply: replyParts,
      offerLink,
      leadSaved,
      escalated,
      session_id: sessionId,
      response_length: responseLength,
    }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[${VERSION}] error:`, msg);
    return new Response(JSON.stringify({
      reply: ["Posso ricontattarLa tra poco — mi lascia un recapito? Grazie."],
      offerLink: null, leadSaved: false, response_length: 0,
    }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
