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

const VERSION = "chat-ai v3.4-iva-per-segmento-no-arval";

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

const ESCALATION_KEYWORDS = [
  "operatore", "umano", "agente", "persona", "consulente reale", "parla con",
  "contattami", "richiamata", "telefonata", "non so", "non sai", "non risponde",
  "non mi aiuta", "sbagliato", "reclamo", "assistenza clienti", "vivo",
];

function shouldEscalate(query: string): boolean {
  const lower = query.toLowerCase();
  return ESCALATION_KEYWORDS.some(k => lower.includes(k));
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
    if (data) return filterKbChunks(data.map((r: { content: string }) => r.content));
  } catch (_) {
    // fallback: niente KB
  }
  return [];
}

// ── CARRIER NON PIÙ PROPOSTI ─────────────────────────────────────────
// Nolosubito non lavora più con Arval: le informazioni Arval presenti nella base di conoscenza
// non devono arrivare al modello. Si tolgono i paragrafi e le frasi che parlano di Arval;
// dagli elenchi ("Arval, Leasys, ...") si toglie solo il nome.
const EXCLUDED_CARRIERS = ["arval"];
const ACTIVE_CARRIERS = "Leasys, Ayvens e UnipolRental";

function stripExcludedCarriers(text: string): string {
  const startsExcluded = (t: string) => EXCLUDED_CARRIERS.some((c) => t.trim().toLowerCase().startsWith(c));
  return String(text)
    .split(/\n{2,}/)
    .filter((para) => !startsExcluded(para))
    .map((para) => para.split(/(?<=[.!?])\s+/).filter((sentence) => !startsExcluded(sentence)).join(" "))
    .filter((para) => para.trim().length > 0)
    .join("\n\n")
    // Arval citato dentro un elenco: "(Arval, Leasys, ...)" → "(Leasys, ...)", "come Arval o Ayvens" → "come Ayvens".
    .replace(new RegExp(`\\b(${EXCLUDED_CARRIERS.join("|")})\\b\\s*(,|\\so\\s|\\se\\s)\\s*`, "gi"), "")
    .replace(new RegExp(`\\s*(,|\\so|\\se)\\s+\\b(${EXCLUDED_CARRIERS.join("|")})\\b`, "gi"), "");
}

function filterKbChunks(chunks: string[]): string[] {
  return chunks.map(stripExcludedCarriers).filter((c) => c.trim().length > 0);
}

// ── PREZZI (stessa logica di src/lib/vehiclePricing.js) ──────────────
// In CMS il canone è l'imponibile "pieno" (anticipo zero): con anticipo si abbassa di anticipo/durata.
// Privati e Moto vedono il canone IVA inclusa, gli altri segmenti + IVA.
const VAT_RATE = 0.22;
const MIN_DISPLAYED_RENT = 50;

function displayedRent(c: { monthly_rent: number; advance_payment?: number; duration_months?: number; segment?: string }) {
  const base = Number(c.monthly_rent);
  if (!Number.isFinite(base)) return null;
  const adv = Number(c.advance_payment) || 0;
  const duration = Number(c.duration_months);
  const net = adv > 0 && duration ? Math.max(Math.round(base - adv / duration), MIN_DISPLAYED_RENT) : base;
  const vatIncluded = c.segment === "Privati" || c.segment === "Moto";
  return { amount: Math.round(vatIncluded ? net * (1 + VAT_RATE) : net), vat: vatIncluded ? "IVA inclusa" : "+ IVA" };
}

function vehicleLink(make: string, model: string) {
  const slug = (s: string) => encodeURIComponent(String(s).trim().toLowerCase().replace(/\s+/g, "-"));
  return `${SITE_URL}/vehicle/${slug(make)}/${slug(model)}`;
}

// ── TOOL EXECUTORS ───────────────────────────────────────────────────
async function getVehicles(supabase: any, args: Record<string, string>) {
  let query = supabase.from("offers").select("make, model, category, fuel_type, segments, promo_expires_at, promo_discount_pct, promo_segment, promo_services").eq("is_active", true);
  if (args.make) query = query.ilike("make", `%${args.make}%`);
  if (args.model) query = query.ilike("model", `%${args.model}%`);
  if (args.category) query = query.ilike("category", `%${args.category}%`);
  if (args.fuel) query = query.ilike("fuel_type", `%${args.fuel}%`);
  const { data: offers, error } = await query.limit(30);
  if (error) {
    console.error("[chat-ai] get_vehicles error:", error.message);
    return "ERRORE: catalogo non disponibile. Non indicare prezzi né disponibilità.";
  }
  if (!offers || offers.length === 0) return "Nessun veicolo trovato nel catalogo con questi criteri.";

  const makes = [...new Set(offers.map((o: any) => o.make))];
  const models = [...new Set(offers.map((o: any) => o.model))];

  const { data: configs } = await supabase
    .from("offer_configs")
    .select("make, model, segment, monthly_rent, advance_payment, duration_months")
    .in("make", makes)
    .in("model", models)
    .eq("is_active", true);

  // Prezzo di partenza per ogni segmento: un'unica forbice mescolava Privati (IVA inclusa) e P.IVA (+ IVA).
  const minPrice: Record<string, Record<string, { amount: number; vat: string }>> = {};
  for (const c of configs || []) {
    const key = `${c.make}|${c.model}`;
    const seg = c.segment || "N/A";
    const p = displayedRent(c);
    if (!p) continue;
    minPrice[key] ??= {};
    if (!minPrice[key][seg] || p.amount < minPrice[key][seg].amount) minPrice[key][seg] = p;
  }

  return offers.map((o: any) => {
    const price = minPrice[`${o.make}|${o.model}`];
    let promo = "";
    if (o.promo_expires_at && new Date(o.promo_expires_at) > new Date()) {
      const discount = o.promo_discount_pct ? ` -${o.promo_discount_pct}%` : "";
      promo = ` [PROMO${discount}]`;
    }
    const priceText = price
      ? Object.entries(price).map(([seg, p]) => `${seg} da €${p.amount}/mese ${p.vat}`).join("; ")
      : "prezzo non disponibile";
    return `${o.make} ${o.model} | ${o.category} | ${o.fuel_type} | ${priceText}${promo} | ${vehicleLink(o.make, o.model)}`;
  }).join("\n");
}

async function getVehicleDetail(supabase: any, args: Record<string, string>) {
  // Prima colonne inesistenti (foto_url, gallery, duration, km, advance): la query falliva sempre
  // e il tool rispondeva "Veicolo non trovato", così Luca non poteva verificare prezzi e configurazioni.
  const { data: offers, error } = await supabase
    .from("offers")
    .select("make, model, category, fuel_type, segments, description, promo_expires_at, promo_discount_pct, promo_segment, promo_services")
    .eq("is_active", true)
    .ilike("make", `%${args.make ?? ""}%`)
    .ilike("model", `%${args.model ?? ""}%`)
    .limit(10);

  if (error) {
    console.error("[chat-ai] get_vehicle_detail error:", error.message);
    return "ERRORE: dettaglio veicolo non disponibile. Non indicare prezzi né configurazioni.";
  }
  if (!offers || offers.length === 0) return "Veicolo non presente nel catalogo attivo.";
  // "Puma" deve dare la PUMA, non la "PUMA hybrid": si preferisce la corrispondenza esatta.
  const wanted = String(args.model ?? "").trim().toLowerCase();
  const o = offers.find((x: any) => String(x.model).trim().toLowerCase() === wanted) ?? offers[0];
  const others = offers.filter((x: any) => x !== o).map((x: any) => `${x.make} ${x.model}`);

  const { data: configs, error: cfgError } = await supabase
    .from("offer_configs")
    .select("segment, duration_months, annual_km, advance_payment, monthly_rent")
    .eq("make", o.make)
    .eq("model", o.model)
    .eq("is_active", true)
    .order("monthly_rent");
  if (cfgError) console.error("[chat-ai] get_vehicle_detail configs error:", cfgError.message);

  let detail = `${o.make} ${o.model}\nCategoria: ${o.category} | Alimentazione: ${o.fuel_type}\nSegmenti: ${o.segments || "—"}\nScheda: ${vehicleLink(o.make, o.model)}`;
  if (o.description) detail += `\n\nDescrizione: ${String(o.description).slice(0, 600)}`;
  if (o.promo_expires_at && new Date(o.promo_expires_at) > new Date()) {
    detail += `\n\nPROMO: sconto ${o.promo_discount_pct || 0}% fino al ${new Date(o.promo_expires_at).toLocaleDateString("it-IT")}`;
  }
  if (configs && configs.length > 0) {
    const fromBySegment: Record<string, { amount: number; vat: string }> = {};
    for (const c of configs) {
      const p = displayedRent(c);
      const seg = c.segment || "N/A";
      if (p && (!fromBySegment[seg] || p.amount < fromBySegment[seg].amount)) fromBySegment[seg] = p;
    }
    detail += "\n\nPrezzo di partenza per segmento (non mescolarli):";
    for (const [seg, p] of Object.entries(fromBySegment)) detail += `\n- ${seg}: da €${p.amount}/mese ${p.vat}`;
    detail += "\n\nConfigurazioni disponibili (canone come mostrato sul sito):";
    for (const c of configs.slice(0, 15)) {
      const p = displayedRent(c);
      detail += `\n- ${c.segment || "N/A"} | ${c.duration_months || "—"} mesi | ${c.annual_km || "—"} km/anno | anticipo €${Number(c.advance_payment) || 0} | ${p ? `€${p.amount}/mese ${p.vat}` : "canone non disponibile"}`;
    }
  } else {
    detail += "\n\nNessuna configurazione di prezzo attiva: non indicare cifre, proponi un preventivo.";
  }
  if (others.length > 0) detail += `\n\nAltre versioni a catalogo: ${others.join(", ")}`;
  return detail;
}

async function getCarrier(supabase: any, args: Record<string, string>) {
  const name = args.name?.toLowerCase() || "";
  if (EXCLUDED_CARRIERS.some((c) => name.includes(c))) {
    return `Nolosubito non propone più offerte ${args.name}. Non dare condizioni, franchigie o penali di questo carrier: proponi le alternative con cui lavoriamo (${ACTIVE_CARRIERS}).`;
  }
  const { data: chunks } = await supabase
    .from("knowledge_chunks")
    .select("content")
    .textSearch("content", name || "carrier franchigie penali", { type: "websearch" })
    .limit(5);

  const texts = filterKbChunks((chunks || []).map((c: { content: string }) => c.content));
  if (texts.length === 0) return "Nessuna informazione carrier trovata.";
  return texts.join("\n---\n");
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

  const texts = filterKbChunks((chunks || []).map((c: { content: string }) => c.content));
  if (texts.length === 0) return "Nessun dettaglio trovato.";
  return texts.join("\n");
}

// id del lead creato in questa richiesta: viene restituito al client, che lo rimanda nei messaggi
// successivi così la cronologia del lead si aggiorna fino alla fine della chat (prima restava ferma
// al messaggio in cui il cliente lasciava i contatti).
type RequestCtx = { leadId: string | null; existingLeadId: string | null };

async function saveLead(supabase: any, args: Record<string, string>, sessionId: string, messages: any[], ctx: RequestCtx) {
  if (!args.nome || (!args.email && !args.telefono)) return "Dati insufficienti per salvare il lead.";
  // Lead già creato in questa chat: non se ne crea un secondo (resterebbe orfano il primo).
  if (ctx.existingLeadId) return "Lead già salvato in precedenza: i contatti sono già registrati.";
  const { data, error } = await supabase.from("leads").insert({
    nome: args.nome, email: args.email || null, telefono: args.telefono || null,
    tipo_cliente: args.tipo_cliente || null, interesse: args.interesse,
    chat_history: messages, source: "chat-ai", status: "Nuovo",
  }).select("id").single();
  if (error) {
    console.error("[chat-ai] save_lead error:", error.message);
    return "Errore nel salvataggio del lead.";
  }
  ctx.leadId = data?.id ?? null;
  return "Lead salvato con successo.";
}

async function updateLeadHistory(supabase: any, leadId: string, history: any[]) {
  // Il lead_id arriva dal browser: si aggiorna solo se la cronologia salvata è l'inizio di questa
  // conversazione, così un id preso altrove non permette di sovrascrivere la chat di un altro lead.
  const { data: lead } = await supabase
    .from("leads")
    .select("chat_history")
    .eq("id", leadId)
    .eq("source", "chat-ai")
    .maybeSingle();
  const saved = Array.isArray(lead?.chat_history) ? lead.chat_history : null;
  const samePrefix = saved && saved.length > 0 && saved.length <= history.length &&
    saved.every((m: any, i: number) => m?.role === history[i]?.role && m?.content === history[i]?.content);
  if (!samePrefix) {
    console.warn("[chat-ai] lead history not updated: conversation mismatch");
    return;
  }
  const { error } = await supabase
    .from("leads")
    .update({ chat_history: history, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .eq("source", "chat-ai");
  if (error) console.error("[chat-ai] lead history update error:", error.message);
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
async function handleTool(name: string, input: Record<string, string>, supabase: any, sessionId: string, messages: any[], ctx: RequestCtx): Promise<string> {
  switch (name) {
    case "get_vehicles": return await getVehicles(supabase, input);
    case "get_vehicle_detail": return await getVehicleDetail(supabase, input);
    case "get_carrier": return await getCarrier(supabase, input);
    case "get_product": return await getProduct(supabase, input);
    case "save_lead": return await saveLead(supabase, input, sessionId, messages, ctx);
    case "escalate_to_operator": return await escalateToOperator(supabase, input, sessionId, messages);
    default: return `Tool sconosciuto: ${name}`;
  }
}

// ── SYSTEM PROMPT (trasparente: assistente AI) ────────────────────────
function buildSystemPrompt(now: string, kbContext: string[]) {
  const kbSection = kbContext.length > 0
    ? `\n\n## INFO UTILI (usa se pertinenti)\n${kbContext.join("\n---\n")}`
    : "";

  return `Sei Luca, l'assistente AI di Nolosubito (${SITE_URL}). Parli italiano. Sei cordiale, diretto e trasparente: sei un'intelligenza artificiale, non un umano. Se il cliente te lo chiede, confermalo apertamente. Niente fronzoli.

Ora: ${now}.

## COME PARLARE
- Naturale e diretto, come in una conversazione WhatsApp con un commerciale esperto.
- MAI: "Certamente", "Ottima domanda", "In qualità di", "Ecco", "Perfetto!"
- MAI elenchi puntati, grassetto, corsivo o markdown.
- MAI fingere di essere umano: non dire "sto verificando dal vivo" o frasi che suggeriscano una presenza fisica.
- Se il cliente usa "tu", usa "tu". Altrimenti "Lei".
- Varia i saluti. Non ripetere sempre la stessa formula.
- Risposte BREVISSIME: massimo 1-2 frasi. Raramente 3 se strettamente necessario.
- Non dilungarti. Semplifica il dialogo, mantieni solo il senso utile.
- Non rispondere in modo letterale o pedante. Interpreta il contesto e guida la conversazione.
- Se manca un dato, chiedilo con una domanda corta invece di spiegare troppo.
- Non scrivere romanzi.

## ESEMPI — COME RISPONDERE (lo stile, non i dati: le cifre vengono SOLO dai tool)
Cliente: "Quanto costa la BMW X1?"
Luca: [chiama get_vehicle_detail con make "BMW", model "X1", poi risponde con il canone restituito dal tool] "La X1 parte da [canone del tool] al mese con [durata/km del tool]. È per privato o partita IVA?"

Cliente: "Ciao, vorrei informazioni"
Luca: "Ciao! Sono Luca, l'assistente AI di Nolosubito. Che tipo di auto sta cercando? Per privato o per la sua attività?"

Cliente: "Sei un robot?"
Luca: "Sì, sono un assistente AI: non c'è un essere umano dall'altra parte. Posso aiutarla con veicoli, prezzi e condizioni del noleggio a lungo termine. Se serve, posso farla ricontattare da un consulente."

## REGOLE
0. VERIFICA SEMPRE. Prezzi, canoni, anticipi, durate, km, disponibilità, promozioni, franchigie e penali li puoi dire SOLO se compaiono nel risultato di un tool o nelle INFO UTILI qui sotto. Se non li hai, non inventarli e non stimarli: chiedi il dato mancante o proponi un preventivo.
1. Se un cliente chiede di un veicolo, usa get_vehicles per cercarlo. Se chiede prezzo, canone o dettagli di un modello, usa get_vehicle_detail.
2. Se chiede di carrier (Leasys, Ayvens, UnipolRental), usa get_carrier.
3. Se chiede di un prodotto specifico (Be Free, Be Free Biz, Miles), usa get_product.
4. Se la domanda è semplice o richiede solo un orientamento generale, rispondi tu in modo utile. Usa escalate_to_operator solo se manca un dato davvero critico, se la richiesta è contrattuale/complessa o se rischieresti di dare un'informazione sbagliata.
5. Quando hai nome + email + telefono, chiama save_lead. Fatto con naturalezza.
6. Se un tool risponde "ERRORE" o "non presente", dillo con naturalezza e proponi di farsi ricontattare: non riempire il vuoto con cifre.
7. Ogni canone che citi va detto con il suo segmento e l'IVA come li dà il tool: "per privati … IVA inclusa" oppure "per partita IVA … + IVA". Non unire in un'unica forbice prezzi di segmenti diversi. Se non sai se il cliente è privato o partita IVA, dai il prezzo di partenza di entrambi e chiedilo.
8. Nolosubito lavora con Leasys, Ayvens e UnipolRental. NON lavora più con Arval: non proporlo, non citarlo come opzione e non dare sue condizioni (franchigie, penali, km). Se il cliente chiede Arval, spiega con garbo che non lo proponiamo più e offri le alternative.

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
        name: { type: "string", description: "Nome del carrier (Leasys, Ayvens, UnipolRental)" },
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

// toolChoice "none": usato nel follow-up dopo un tool. Prima si passava tools: [] con blocchi
// tool_use nella cronologia, e Anthropic rispondeva 400 → errore → chat bloccata in escalation.
async function callClaude(systemPrompt: string, messages: any[], tools: typeof CLAUDE_TOOLS, toolChoice: "auto" | "none" = "auto") {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      // 150 token troncavano le risposte a metà frase; la brevità la impone il prompt.
      max_tokens: 500,
      system: systemPrompt,
      messages,
      tools,
      tool_choice: { type: toolChoice },
    }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Claude ${res.status}: ${detail.slice(0, 300)}`);
  }
  return await res.json() as { content: { type: string; text?: string; id?: string; name?: string; input?: Record<string, string> }[] };
}

async function callGroq(systemPrompt: string, messages: any[], tools?: any[], toolChoice: "auto" | "none" = "auto") {
  const groqMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m: any) => {
      const base: Record<string, any> = { role: m.role, content: m.content ?? null };
      if (m.tool_calls) base.tool_calls = m.tool_calls;
      if (m.tool_call_id) base.tool_call_id = m.tool_call_id;
      return base;
    }),
  ];

  // gpt-oss è un modello "reasoning": il ragionamento consuma max_tokens. Con 160 token la risposta
  // usciva troncata o vuota e le chiamate ai tool fallivano (Groq 400 tool_use_failed).
  const body: Record<string, any> = {
    model: "openai/gpt-oss-120b",
    max_tokens: 1500,
    reasoning_effort: "low",
    messages: groqMessages,
  };
  if (tools && tools.length > 0) {
    body.tools = tools;
    body.tool_choice = toolChoice;
  }

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Groq ${res.status}: ${detail.slice(0, 300)}`);
  }
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

  let messages: any[] = [];
  let sessionId = "";
  let supabase: any;

  try {
    const body = await req.json() as any;
    messages = body.messages || [];
    sessionId = body.session_id || crypto.randomUUID();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages array required" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const lastUserMessage = (messages[messages.length - 1]?.content ?? "").slice(0, 200);

    // Le sessioni di addestramento (Knowledge) ignorano il toggle AI: LUCA risponde sempre.
    const isTrainingSession = String(sessionId).startsWith("training_");

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

    // ── AI DISABLED GUARD ─────────────────────────────────────────────
    try {
      const { data: aiSettings } = await supabase
        .from("chat_operator_settings")
        .select("ai_enabled")
        .eq("id", "global")
        .maybeSingle();

      if (aiSettings && !aiSettings.ai_enabled && !isTrainingSession) {
        console.log(`[${VERSION}] ai-disabled: routing session ${sessionId} to operator`);
        const lastQuestion = messages[messages.length - 1]?.content ?? "";
        await supabase.from("escalated_sessions").upsert({
          session_id: sessionId,
          user_question: String(lastQuestion).slice(0, 200),
          chat_history: messages,
          status: "waiting",
          source: "direct",
        }, { onConflict: "session_id" });
        return new Response(JSON.stringify({
          reply: [], escalated: true, direct_mode: true, session_id: sessionId,
        }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
      }
    } catch (_) {
      // Tabella non ancora creata: procedi normalmente
    }

    // ── SEARCH KB (automatico, semantico via pgvector) ───────────────
    const kbChunks = await searchKb(supabase, lastUserMessage);

    // ── ROUTING ──────────────────────────────────────────────────────
    const complexity = classifyComplexity(lastUserMessage);
    console.log(`[${VERSION}] routing: complexity=${complexity}`);

    // ── ESCALATION DETERMINISTICA ─────────────────────────────────────
    if (shouldEscalate(lastUserMessage) && !isTrainingSession) {
      await escalateToOperator(supabase, { question: lastUserMessage }, sessionId, messages);
      return new Response(JSON.stringify({
        reply: ["Se mi da un minuto le do tutte le info di cui ha bisogno, grazie"],
        offerLink: null,
        leadSaved: false,
        escalated: true,
        session_id: sessionId,
        response_length: 66,
      }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const now = new Date().toLocaleString("it-IT", {
      timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit",
    });
    const systemPrompt = buildSystemPrompt(now, kbChunks);
    const cleanMessages = messages.filter((m: { role: string; content: string }) =>
      !(m.role === "assistant" && typeof m.content === "string" && m.content.startsWith("Posso ricontattarLa"))
    );

    // Le risposte preconfezionate (buildQuickReply) scattavano su qualsiasi messaggio con "auto" o
    // "noleggio" e ignoravano la domanda: rimosse, ora risponde sempre il modello con i tool.

    const clientLeadId = typeof body.lead_id === "string" && /^[0-9a-f-]{36}$/i.test(body.lead_id) ? body.lead_id : null;
    const ctx: RequestCtx = { leadId: null, existingLeadId: clientLeadId };
    const splitReply = (txt: string) => txt ? txt.split("||").map((s: string) => s.trim()).filter(Boolean) : [];
    const escalationReply = async (input: Record<string, string>) => {
      if (isTrainingSession) {
        replyParts = ["Non ho una risposta certa su questo punto — mi corregga e imparerò per le prossime volte."];
      } else {
        await escalateToOperator(supabase, input, sessionId, messages);
        escalated = true;
        replyParts = ["Se mi da un minuto le do tutte le info di cui ha bisogno, grazie"];
      }
    };

    let replyParts: string[] = [];
    let leadSaved = false;
    let escalated = false;

    const runClaude = async () => {
      const claudeRes = await callClaude(systemPrompt, cleanMessages, CLAUDE_TOOLS);
      const content: any[] = claudeRes.content || [];

      const escalateTool = content.find((b: any) => b.type === "tool_use" && b.name === "escalate_to_operator");
      if (escalateTool?.input) return await escalationReply(escalateTool.input as Record<string, string>);

      const toolUse = content.find((b: any) => b.type === "tool_use");
      if (!toolUse?.input) {
        replyParts = splitReply(content.find((b: any) => b.type === "text")?.text || "");
        return;
      }
      const result = await handleTool(toolUse.name, toolUse.input as Record<string, string>, supabase, sessionId, messages, ctx);
      if (toolUse.name === "save_lead") leadSaved = result.includes("salvato con successo");
      // Ogni tool_use va chiuso con il suo tool_result; i tool restano dichiarati ma non richiamabili.
      const toolResults = content
        .filter((b: any) => b.type === "tool_use")
        .map((b: any) => ({ type: "tool_result", tool_use_id: b.id, content: b.id === toolUse.id ? result : "Non eseguito." }));
      const followRes = await callClaude(systemPrompt, [
        ...cleanMessages,
        { role: "assistant", content },
        { role: "user", content: toolResults },
      ], CLAUDE_TOOLS, "none");
      const txt = followRes.content?.find((b: any) => b.type === "text")?.text || "";
      replyParts = splitReply(txt);
      if (replyParts.length === 0 && toolUse.name === "save_lead" && leadSaved) replyParts = ["Grazie! Un consulente la contatterà presto."];
    };

    const runGroq = async () => {
      const groqRes = await callGroq(systemPrompt, cleanMessages, toOpenAITools(CLAUDE_TOOLS));
      const choice = groqRes.choices?.[0];

      if (!(choice?.finish_reason === "tool_calls" && choice.message?.tool_calls)) {
        replyParts = splitReply(choice?.message?.content || "");
        return;
      }
      const tc = choice.message.tool_calls[0];
      const name = tc.function.name;
      let input: Record<string, string> = {};
      try { input = JSON.parse(tc.function.arguments); } catch { input = {}; }

      if (name === "escalate_to_operator") return await escalationReply(input);

      const result = await handleTool(name, input, supabase, sessionId, messages, ctx);
      if (name === "save_lead") {
        leadSaved = result.includes("salvato con successo");
        replyParts = leadSaved
          ? ["Grazie! Un consulente la contatterà presto."]
          : ctx.existingLeadId
            ? ["I suoi contatti li abbiamo già, un consulente la ricontatterà a breve."]
            : ["Non sono riuscito a registrare i dati: me li può riscrivere, nome e telefono o email?"];
        return;
      }
      const followRes = await callGroq(systemPrompt, [
        ...cleanMessages,
        { role: "assistant", content: choice.message.content ?? null, tool_calls: [tc] },
        { role: "tool", tool_call_id: tc.id, content: result },
      ], toOpenAITools(CLAUDE_TOOLS), "none");
      replyParts = splitReply(followRes.choices?.[0]?.message?.content || "");
    };

    let claudeTried = false;
    if (complexity === "complex") {
      await runClaude();
    } else {
      // Se Groq fallisce (es. 400 tool_use_failed) si riprova con Claude invece di bloccare la chat.
      try {
        await runGroq();
      } catch (groqErr) {
        console.error(`[${VERSION}] groq failed, fallback to Claude:`, groqErr instanceof Error ? groqErr.message : String(groqErr));
        if (!escalated && !leadSaved) { claudeTried = true; await runClaude(); }
      }
      if (replyParts.length === 0 && !escalated && !claudeTried) {
        console.warn(`[${VERSION}] groq empty reply, fallback to Claude`);
        await runClaude();
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

    // Cronologia completa nel lead: quello appena creato o quello già creato in questa chat (lead_id dal client).
    const leadId = ctx.leadId ?? clientLeadId;
    if (leadId) {
      await updateLeadHistory(supabase, leadId, [
        ...messages,
        ...replyParts.map((content) => ({ role: "assistant", content })),
      ]);
    }

    return new Response(JSON.stringify({
      reply: replyParts,
      offerLink,
      leadSaved,
      lead_id: leadId,
      escalated,
      session_id: sessionId,
      response_length: responseLength,
    }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(`[${VERSION}] error:`, msg, stack);

    try {
      if (!supabase) {
        supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      }
      const lastQuestion = messages.slice().reverse().find((m: any) => m.role === "user")?.content || "";
      await escalateToOperator(supabase, { question: String(lastQuestion) }, sessionId, messages);
    } catch (escErr: unknown) {
      const escMsg = escErr instanceof Error ? escErr.message : String(escErr);
      console.error(`[${VERSION}] auto-escalation failed:`, escMsg);
    }

    return new Response(JSON.stringify({
      reply: ["Posso ricontattarLa tra poco — mi lascia un recapito? Grazie."],
      offerLink: null, leadSaved: false, escalated: true,
      session_id: sessionId, response_length: 0,
    }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
  }
});
