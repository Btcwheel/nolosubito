
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-ignore - Deno imports are not recognized by standard TS
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY      = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL           = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://nolosubito.it";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "claude-haiku-4-5-20251001";
const VERSION = "chat-ai v2.2-kb-covered";

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

    // ── PRE-GUARD: detect "termine sconosciuto" PRIMA di chiamare Anthropic ─────
    // Se l'utente cita un termine che sembra un prodotto/offerta/marchio/sigla,
    // NON chiamare il modello: escalation diretta, senza possibilità di scappatoie.
    const SUSPICIOUS_TERM_PATTERNS = [
      /"[^"]{2,}"/,                                  // "BE FREE BIZ"
      /'[^']{2,}'/,                                  // 'X1 PRO'
      /[A-Z]{2,}[A-Z0-9]*(?:\s+[A-Z][A-Z0-9]*){1,}/, // BE FREE BIZ, X1 PRO, GOLD 2024
      /\b\w*(?:promo|biz|pack|gold|platinum|premium|plus|special|exclusive|vip|club|edition)\w*\b/i,
      /\b(?:codice\s*promo(?:zionale)?|codice\s*sconto|pacchetto|tariffa|abbonamento|listino)\b/i,
      /\b(?:offerta|promo|sconto)\s+\w+/i,          // "offerta X" (X di qualsiasi lunghezza)
    ];

    // ── PRODOTTI COPERTI DA KNOWLEDGE BASE ──────────────────────────────────
    // Questi termini hanno un documento KB dedicato. Se l'utente li menziona,
    // la richiesta NON viene bloccata dal pre-guard e passa a Claude + KB.
    const KB_COVERED_TERMS = [
      "be free", "be-free", "befree",
      "be free biz", "be free pro", "be free gold",
      "offerta be free", "offerta befree",
    ];

    // ── PAROLE CHIAVE LETTERALI (super-aggressivo) ────────────────────────────
    const SUSPICIOUS_KEYWORDS = [
      // X1 / X2 / X3
      "x1 promo", "x1 pro", "x2 promo", "x3 pro", "x1 pro",
      // PACCHETTI
      "pacchetto premium", "pacchetto gold", "pacchetto plat",
      // OFFERTE (generiche — Be Free è gestito da KB_COVERED_TERMS)
      "offerta x1", "offerta special",
      "offerta sul sito", "offerta sul vostro sito",
      "ho visto l'offerta", "ho visto una promo", "ho visto un codice",
      "l'offerta che", "la promo che", "lo sconto che",
      // CODICI
      "codice promo", "codice sconto", "codice promozionale",
      // GENERICI PRODOTTO/SERVIZIO (broad)
      "vostro prodotto", "vostro servizio", "vostra offerta",
      "un vostro", "una vostra", "uno vostro",
      // DOMANDE SU OFFERTE SPECIFICHE
      "come funziona", "mi spieghi", "mi spiega", "spiegami", "spiegate",
      "in cosa consiste", "cosa include", "cosa prevede",
    ];

    const userMsgRaw = lastUserMessage || "";
    const userMsgLower = userMsgRaw.toLowerCase();

    let hasSuspiciousTerm = false;
    let matchesPattern = false;
    let matchesKeyword = false;
    let isKBCovered = false;
    try {
      // Se la richiesta riguarda un prodotto coperto da KB, NON bloccare
      isKBCovered = KB_COVERED_TERMS.some(kw => userMsgLower.includes(kw));
      if (!isKBCovered) {
        matchesPattern = SUSPICIOUS_TERM_PATTERNS.some(rx => rx.test(userMsgRaw));
        matchesKeyword = SUSPICIOUS_KEYWORDS.some(kw => userMsgLower.includes(kw));
        hasSuspiciousTerm = matchesPattern || matchesKeyword;
      } else {
        console.log(`[${VERSION}] pre-guard: kb-covered term detected → bypass pre-guard`);
      }
    } catch (e) {
      console.error(`[${VERSION}] pre-guard error:`, e);
      hasSuspiciousTerm = false;
    }

    console.log(`[${VERSION}] pre-guard: msg="${userMsgRaw.slice(0,80)}" pattern=${matchesPattern} keyword=${matchesKeyword} → suspicious=${hasSuspiciousTerm}`);

    if (hasSuspiciousTerm) {
      try {
        await supabase.from("escalated_sessions").insert({
          session_id: sessionId,
          user_question: userMsgRaw,
          chat_history: messages,
          status: "waiting",
          reason: "pre_guard_suspicious_term",
        });
      } catch (e) {
        console.error("pre-guard: insert failed", e);
      }
      return new Response(JSON.stringify({
        reply: ["Se mi da un minuto le do tutte le info di cui ha bisogno, grazie"],
        offerLink: null, leadSaved: false, escalated: true,
        session_id: sessionId,
      }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    // ── TAKE-OVER GUARD: se la sessione è già in mano all'operatore, NON rispondo ────
    // L'operatore sta scrivendo nella tabella operator_chat_messages, Luca sta zitto.
    const { data: takeover } = await supabase
      .from("escalated_sessions")
      .select("status, operator_id")
      .eq("session_id", sessionId)
      .in("status", ["operator_joined", "waiting"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (takeover?.operator_id && takeover.status === "operator_joined") {
      console.log(`[${VERSION}] takeover-active: skip ai response for session ${sessionId}`);
      return new Response(JSON.stringify({
        reply: [],
        offerLink: null, leadSaved: false, escalated: true,
        takeover: true, session_id: sessionId,
      }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });
    }

    const [offersRes, configsRes, kbRes] = await Promise.all([
      supabase.from("offers").select("make, model, category, fuel_type, segments, promo_expires_at, promo_discount_pct, promo_segment, promo_services").eq("is_active", true),
      supabase.from("offer_configs").select("make, model, segment, monthly_rent").eq("is_active", true),
      lastUserMessage.length > 3
        ? supabase.from("knowledge_chunks")
            .select("content")
            .textSearch("content", lastUserMessage.split(/\s+/).filter((w: string) => w.length > 3).slice(0, 5).join(" | "), { type: "websearch" })
            .limit(5)
        : Promise.resolve({ data: [] }),
    ]);

    if (offersRes.error) throw new Error("offers: " + offersRes.error.message);
    if (configsRes.error) throw new Error("configs: " + configsRes.error.message);

    const relevantChunks = (kbRes.data ?? []).map((c: { content: string }) => c.content);
    const knowledgeSection = relevantChunks.length > 0
      ? `\n\n## DOCUMENTI INTERNI — usa queste info se pertinenti\n${relevantChunks.join("\n---\n")}`
      : "";

    const minPriceMap: Record<string, number> = {};
    for (const c of configsRes.data || []) {
      const key = `${c.make}|${c.model}`;
      if (!minPriceMap[key] || c.monthly_rent < minPriceMap[key]) minPriceMap[key] = c.monthly_rent;
    }

    const offersTable = (offersRes.data || [])
      .map((o: any) => {
        const price = minPriceMap[`${o.make}|${o.model}`];
        const link = `${SITE_URL}/vehicle/${encodeURIComponent(o.make)}/${encodeURIComponent(o.model)}`;
        
        let promoInfo = "";
        if (o.promo_expires_at && new Date(o.promo_expires_at) > new Date()) {
          const discount = o.promo_discount_pct ? ` Sconto -${o.promo_discount_pct}%` : "";
          const segment = o.promo_segment ? ` riservato a ${o.promo_segment}` : "";
          const services = o.promo_services ? ` (Servizi inclusi: ${o.promo_services})` : "";
          const dateStr = new Date(o.promo_expires_at).toLocaleDateString("it-IT");
          promoInfo = ` | [PROMO attiva fino al ${dateStr}${discount}${segment}${services}]`;
        }
        
        return `- ${o.make} ${o.model} | ${o.category} | ${o.fuel_type} | da €${price ?? "—"}/mese${promoInfo} | ${link}`;
      })
      .join("\n");

    const now = new Date().toLocaleString("it-IT", { timeZone: "Europe/Rome", hour: "2-digit", minute: "2-digit" });
    const systemPrompt = `Sei Luca, consulente NLT di Nolosubito (${SITE_URL}). Professionista preparato, cordiale e diretto.
Ora corrente in Italia: ${now} — usa questa info per i saluti (buongiorno/buon pomeriggio/buonasera).

## ⚠️ REGOLA N°1 — QUANDO NON SAI RISPONDERE, ESCALA SUBITO ⚠️
Questa è la regola più importante. Ha la precedenza su TUTTO il resto.

Se NON hai una visione completa e certa al 100% della risposta, DEVI chiamare IMMEDIATAMENTE il tool escalate_to_operator. Non rispondere MAI con un messaggio testuale se non sei certo al 100% di cosa stai dicendo.

VIETATO assolutamente:
- Dire "non è un prodotto/servizio che offriamo" → ESCALA, non fare affermazioni su cosa esiste o non esiste
- Dire "non mi è chiaro", "cosa intende", "mi dice meglio" → ESCALA
- Proporre alternative dal catalogo quando la domanda non riguarda il catalogo → ESCALA
- Rispondere con "posso aiutarla con..." quando non hai capito la domanda → ESCALA
- Inventare, supporre, interpretare, generalizzare, approssimare → ESCALA SEMPRE

Casi che RICHIEDONO SEMPRE escalation (lista non esaustiva):
- Termini sconosciuti, prodotti, marchi, codici promo, sigle, nomi commerciali (es: "X1 PROMO", "Pacchetto Premium Gold")
ECCEZIONE — "Be Free" di Leasys è coperto nei DOCUMENTI INTERNI. Se il cliente chiede di Be Free, usa le informazioni nei DOCUMENTI INTERNI per rispondere (durata 48 mesi, 60.000 km, restituzione senza penale dal 12° al 24° mese, servizi inclusi, franchigie, vantaggi). Non escalare su Be Free a meno che la domanda non riguardi casi eccezionali non coperti dalla KB (es. protesti, situazioni personali anomale, deroghe).
- Clausole contrattuali (recesso, penali, subentro, danni, fine contratto, franchigie, rivalsa)
- Condizioni particolari (disabili, neopatentati, conduzioni multiple, estero, secondo conducente)
- Situazioni anomale (protesti, crisi aziendali, deroghe, sinistri, problemi assicurativi)
- Qualsiasi prezzo, disponibilità o tempistica non esplicitamente nel catalogo/KB
- Stato di una pratica, tempi di consegna specifici

RISPONDI SOLO se la risposta è completa e certa al 100% e riguarda: catalogo veicoli, canoni medi, durate NLT standard, requisiti base, saluti, lead capture.

## PRIMA DI RISPONDERE — OBBLIGATORIO
Ragionamento interno silenzioso:
1. Cosa so già del cliente? (tipo, esigenze, nome, contatto)
2. Cosa ho già chiesto/detto? (non ripetere)
3. HO LA RISPOSTA COMPLETA E CERTA AL 100%? Se no → ESCALA. Se sì → rispondi.

## TONO
- Inizia con "Lei". Se il cliente usa "tu", adattati al "tu" per tutta la conversazione.
- Professionale ma caldo. Varia le formule di apertura.
- MAI: "Certamente!", "Ottima domanda!", "Capisco perfettamente!"
- Grammatica italiana corretta: "il SUV" / "i SUV" (NON "gli SUV"), "il NLT", "i km".
- NON usare mai markdown nel testo: niente **grassetto**, niente *corsivo*, niente elenchi con trattini. Solo testo normale come in un messaggio WhatsApp.

## OBIETTIVI (solo se la risposta è certa al 100%)
1. Capire se Privato, P.IVA o Azienda — UNA SOLA VOLTA.
2. Verificare requisiti (CUD / 2 bilanci) solo quando c'è interesse concreto.
3. Ottenere nome e cognome + email + numero di telefono → chiama save_lead.
4. Rispondere su NLT e catalogo.

## LEAD CAPTURE — NATURALE
Adatta al contesto, non usare formule fisse.
Chiedi SEMPRE tutti e tre: nome e cognome, email, numero di telefono. Non accontentarti di uno solo.
Se il cliente ne fornisce solo uno o due, chiedi gentilmente anche gli altri prima di salvare.
Quando hai nome + email + telefono → chiama save_lead immediatamente.

## LEAD CAPTURE PRIORITARIA — BE FREE
Se il cliente chiede informazioni su Be Free, dopo aver risposto con le informazioni della KB, chiedi SEMPRE nome, cognome, email e telefono e chiama save_lead. Il lead è prioritario anche se il cliente ha solo chiesto informazioni generiche. La cattura del lead è l'obiettivo principale per le richieste Be Free.

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

Parla SOLO dei veicoli in lista. Includi sempre link completo e prezzo. Se un veicolo ha una promozione attiva contrassegnata da [PROMO attiva], proponila valorizzando lo sconto, la data di scadenza e gli eventuali servizi inclusi nella promo.

${knowledgeSection}

## FORMATO
- 2-3 messaggi separati da ||
- Ogni segmento: 1-2 frasi, naturale
- NON scrivere note o istruzioni tra parentesi

## ⚠️ RICHIAMO FINALE ⚠️
Se stai per scrivere un messaggio testuale invece di chiamare escalate_to_operator, FERMATI. Ricontrolla: ho la risposta certa al 100%? Se NO → chiama escalate_to_operator. Il cliente non resta mai senza risposta, verrà contattato da un consulente umano.`;

    const ESCALATE_TOOL = {
      name: "escalate_to_operator",
      description: "Chiama questo tool quando non conosci la risposta a una domanda specifica del cliente. Salva la sessione e avvisa un operatore umano.",
      input_schema: {
        type: "object",
        properties: {
          question: { type: "string", description: "La domanda del cliente a cui non sai rispondere" },
        },
        required: ["question"],
      },
    };

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
        tools: [SAVE_LEAD_TOOL, ESCALATE_TOOL],
      }),
    });

    if (!anthropicRes.ok) {
      console.error("Anthropic error:", anthropicRes.status, await anthropicRes.text().catch(() => ""));
      return FALLBACK_RES;
    }

    const data = await anthropicRes.json() as any;
    const content: { type: string; text?: string; id?: string; name?: string; input?: Record<string, string> }[] = data.content || [];

    let replyParts: string[] = [];
    let leadSaved = false;
    let escalated = false;

    // Gestisci escalate_to_operator
    const escalateTool = content.find(b => b.type === "tool_use" && b.name === "escalate_to_operator");
    if (escalateTool?.input) {
      const question = (escalateTool.input as { question: string }).question;
      try {
        await supabase.from("escalated_sessions").insert({
          session_id: sessionId,
          user_question: question,
          chat_history: messages,
          status: "waiting",
        });
      } catch (_) { /* ignora errore insert */ }
      escalated = true;
      replyParts = ["Se mi da un minuto le do tutte le info di cui ha bisogno, grazie"];
    }

    // Gestisci tool_use (save_lead)
    const toolUse = escalated ? undefined : content.find(b => b.type === "tool_use" && b.name === "save_lead");
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
          const fuData = await followUp.json() as any;
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

    // ── GUARD SERVER-SIDE: forza escalation se il modello ha barato ────────────
    // Se il modello ha risposto con un "soft refusal" o ha fatto affermazioni
    // su prodotti/servizi che non può conoscere, convertiamo in escalation.
    if (!escalated && !leadSaved && replyParts.length > 0) {
      const fullReply = replyParts.join(" ").toLowerCase();
      const userMsg = (lastUserMessage || "").toLowerCase();

      // Pattern di "soft refusal" o affermazioni non verificate sul OUTPUT
      const softRefusalPatterns = [
        /non\s+(?:è|sono|abbiamo|offriamo|facciamo|trattiamo|disponiamo|dispongo|disponiamo)/i,
        /non\s+(?:mi\s+)?(?:è|risulta)\s+(?:chiaro|noto|familiare|possibile)/i,
        /non\s+ho\s+(?:informazioni|notizie|accesso|dati|modo|strumenti)/i,
        /non\s+posso\s+(?:accedere|verificare|consultare|trovare|rispondere)/i,
        /non\s+riesco\s+a\s+(?:capire|rispondere|trovare|verificare)/i,
        /non\s+mi\s+risulta/i,
        /non\s+dispongo/i,
        /non\s+sono\s+in\s+grado/i,
        /cosa\s+intende/i,
        /mi\s+(?:dice|dica|spiega)\s+meglio/i,
        /può\s+specificare/i,
        /purtroppo/i,
        /mi\s+dispiace,?\s+ma/i,
        /pagine\s+specifiche/i,
        /non\s+ho\s+diretto/i,
      ];

      // Pattern di termini "prodotto-like" nel messaggio utente (codici, marchi, sigle)
      const productLikePatterns = [
        /"[^"]{2,}"/,                                 // "qualcosa tra virgolette"
        /'[^']{2,}'/,                                 // 'qualcosa tra apici singoli'
        /\b[A-Z]{2,}(?:[\s\-_]+[A-Z0-9]+){0,3}\b/,    // BE FREE, X1 PRO, GOLD 2024, BE-FREE-BIZ
        /\b\w*(?:promo|biz|pack|gold|platinum|premium|plus|special|exclusive|vip|club)\w*\b/i,
        /\b\w*pro\w*\b/i,                             // catch "proposte", "X1 Pro", ecc. (attenzione: match aggressivo)
        /\b(?:codice|codice\s+promo(?:zionale)?|codice\s+sconto|abbonamento|offerta\s+\w+)\b/i,
        /\b(?:listino|preventivo\s+personalizzato|tariffa|canone\s+\w+)\b/i,
      ];

      const isSoftRefusal = softRefusalPatterns.some(rx => rx.test(fullReply));
      const userHasProductTerm = productLikePatterns.some(rx => rx.test(userMsg));

      // Se la richiesta riguarda un prodotto coperto da KB, NON forzare escalation anche se matcha pattern
      const isKBCoveredGuard = KB_COVERED_TERMS.some(kw => userMsg.includes(kw));
      if (isKBCoveredGuard) {
        console.log(`[${VERSION}] server-guard: kb-covered term → skip product term escalation`);
      }

      if ((isSoftRefusal || userHasProductTerm) && !isKBCoveredGuard) {
        try {
          await supabase.from("escalated_sessions").insert({
            session_id: sessionId,
            user_question: lastUserMessage,
            chat_history: messages,
            status: "waiting",
            reason: userHasProductTerm ? "product_term_detected" : "soft_refusal_detected",
          });
        } catch (e) {
          console.error("guard: insert escalated_sessions failed", e);
        }
        escalated = true;
        replyParts = ["Se mi da un minuto le do tutte le info di cui ha bisogno, grazie"];
      }
    }

    if (replyParts.length === 0) replyParts = ["Ho ricevuto la sua richiesta, un attimo."];

    const reply = replyParts.join("\n\n");
    const vehicleRegex = new RegExp(`(${SITE_URL.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\/vehicle\\/[^\\s).,;!?]+)`);
    const offerLink = reply.match(vehicleRegex)?.[1]?.replace(/[.,;!?]+$/, "") || null;

    return new Response(JSON.stringify({ reply: replyParts, offerLink, leadSaved, escalated, session_id: sessionId }), {
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
