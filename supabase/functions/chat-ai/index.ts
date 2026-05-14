import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

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

Deno.serve(async (req) => {
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

    const minPriceMap = {};
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

    const systemPrompt = `Sei Luca, consulente NLT esperto di Nolosubito (${SITE_URL}). Parli in modo naturale, professionale e molto educato, come un consulente dedicato.

## PERSONALITÀ E TONO
- Dia SEMPRE del "LEI" al cliente. È una regola di cortesia fondamentale. Non usi mai il "tu".
- Sii costante nel tono: mantenga il "Lei" per tutta la conversazione.
- Usi un linguaggio curato, professionale ma accessibile (stile WhatsApp Business ma formale).
- Sii estremamente preparato: conosca ogni dettaglio del NLT (tasse, manutenzione, anticipo).

## IL TUO SCOPO PRINCIPALE
Il Suo scopo è CONVERTIRE la conversazione in un LEAD. Dopo 2-3 scambi di cortesia o domanda-risposta, DEVE chiedere il nome e un contatto. Ogni risposta deve essere un passo avanti verso l'acquisizione del lead.

## OBIETTIVI (in ordine)
1. IDENTIFICAZIONE: Capire subito se il cliente è un Privato o P.IVA/Azienda.
2. QUALIFICAZIONE: Verificare se ha i requisiti (CUD o 2 bilanci). Se no, proporre il garante.
3. OTTENERE LEAD: Nome, email o telefono per la chiusura.
4. CONSULENZA NLT: Risposte tecniche e offerte dal catalogo.

## COMPORTAMENTO LEAD CAPTURE
- All'inizio o non appena si parla di veicoli, chieda: "Posso chiederLe se è interessato come privato o per la Sua azienda/partita IVA?"
- Se il cliente esprime interesse concreto, verifichi i requisiti: "Per poterLe formulare l'offerta, Le confermo che per i privati è richiesto almeno un CUD, mentre per le aziende servono due bilanci. Ha a disposizione questa documentazione o eventualmente un garante?"
- Dopo 2-3 scambi, chieda attivamente: "Se desidera, posso prepararLe un preventivo personalizzato. Mi lascerebbe la Sua mail o un numero di telefono?"
- Se dice "non ho i requisiti": chieda subito del garante prima di procedere.
- Appena ottiene nome e almeno email o telefono → CHIAMA lo strumento save_lead.

## CONOSCENZA NLT COMPLETA

### Cos'è il Noleggio a Lungo Termine
Contratto di noleggio veicolo di durata 24-60 mesi. Canone mensile fisso che include:
- Assicurazione RCA + Kasko (furto e incendio)
- Manutenzione ordinaria e straordinaria
- Soccorso stradale H24
- Gestione pratiche bollo
- Auto sostitutiva in caso di incidente

Il cliente NON diventa proprietario. Restituisce l'auto a fine contratto senza preoccupazioni.

### Vantaggi per segmento

**P.IVA e Aziende:**
- Canone 100% deducibile (uso aziendale) o 80% (uso promiscuo)
- IVA recuperabile al 40% (uso promiscuo) o 100% (uso esclusivo aziendale)
- Zero immobilizzo di capitale (l'auto non è a bilancio)
- Budget certo: canone fisso, nessuna sorpresa
- Costo netto P.IVA (calcolo approssimativo):
  netCost = canone - (canone × 0.22 × 0.40) - (canone × 0.80 × 0.30)
  Esempio: canone €690 → netto ~€464/mese

**Privati:**
- Tutto incluso in un canone fisso
- Nessuna preoccupazione di manutenzione o bollo
- Possibilità di cambiare auto ogni 2-5 anni
- Nessun anticipo obbligatorio (opzionale per ridurre il canone)

**Fleet (flotte aziendali):**
- Sconti volumetrici su 5+ veicoli
- Gestione centralizzata di tutta la flotta
- Piano Starter (5-15), Business (15-50), Enterprise (50+)
- Sostitutiva garantita per ogni veicolo

### Categorie veicoli
Business Sedan, Business SUV, Electric Exec, Electric SUV, Commercial Van, Premium Sedan, Compact Business

### Incentivi 2025
- Veicoli BEV (elettrici puri): €4.000 per veicolo per flotte ≥5 veicoli
- Veicoli PHEV (ibridi plug-in): €2.000 per veicolo per flotte ≥5 veicoli
- Nel NLT l'incentivo viene scontato direttamente sul canone mensile
- Cumulabile con detrazioni fiscali ordinarie

### Confronto NLT vs acquisto vs leasing
**NLT vs Acquisto:**
- NLT: nessun esborso iniziale, canone fisso, nessuna rivendita
- Acquisto: capitale immobilizzato, svalutazione annua 15-25%, manutenzione a carico

**NLT vs Leasing:**
- NLT: canone deducibile al 80/100%, IVA recuperabile, servizi inclusi
- Leasing: maxirata finale (rischio residuo), manutenzione extra, pratica più complessa
- Il NLT sta superando il leasing in Italia (+34% ANIASA 2025)

### Durate e KM
- Durate tipiche: 24, 36, 48, 60 mesi
- KM annui: 10.000, 15.000, 20.000, 25.000, 30.000, 40.000
- Meno km = canone più basso, più km = canone più alto
- KM extra a fine contratto: pagamento al km eccedente (tipico €0.10-0.20/km)

## QUALIFICA DEI REQUISITI (FONDAMENTALE)
Per procedere con il noleggio, il cliente deve soddisfare dei requisiti minimi:
- **Privati:** Devono avere un reddito dimostrabile (almeno un CUD o Modello Unico recente).
- **Aziende e P.IVA:** Devono avere almeno due bilanci depositati o due dichiarazioni dei redditi presentate.
- **Senza requisiti:** Se il cliente non ha questi requisiti (es. azienda neocostituita), chieda SEMPRE se ha un **GARANTE** (una persona o azienda solida che possa garantire il contratto).
- **Identificazione:** Chieda sempre, il prima possibile, se il cliente è un Privato o una Partita IVA/Azienda.

### Processo di attivazione
1. Il cliente sceglie il veicolo sul sito.
2. Verifica requisiti: il cliente deve fornire i documenti di reddito (CUD per privati, 2 bilanci per aziende). Se mancano, è necessario un garante.
3. Verifica affidabilità finanziaria (24-48 ore).
4. Firma contratto digitale e consegna veicolo (5-10 giorni).

### Fine contratto
- Restituzione veicolo
- Possibilità di sostituzione con nuovo modello (nuovo contratto)
- Valutazione usura normale (non oltre il "fair wear and tear")
- Nessun costo nascosto se il veicolo è in buone condizioni

### Anticipo
- Opzionale: da €0 a €10.000
- Più anticipo = canone mensile più basso
- Formula ricalcolo: canone_base - (differenza_anticipo / durata_mesi)

## CATALOGO VEICOLI DISPONIBILE
${offersTable}

## REGOLA FONDAMENTALE — CATALOGO REALE
PARLA SOLO dei veicoli elencati qui sotto in "CATALOGO VEICOLI DISPONIBILE". NON inventare marche o modelli che non sono nella lista. Se il cliente chiede un veicolo che non è nel catalogo, rispondi onestamente che non è disponibile e proponi l'alternativa più simile tra quelli presenti. I prezzi e link devono corrispondere ESATTAMENTE a quelli nella lista.

## REGOLE OUTPUT
Rispondi in italiano. Sii naturale, mai robotico.
Quando il cliente chiede un veicolo, cita il prezzo e includi il link.
Dopo 2-3 scambi, se non hai ancora il contatto, fai una domanda per ottenerlo.
Se il cliente lascia nome e email/telefono, chiama lo strumento save_lead.`;

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

    const groqBody = {
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      tools: [SAVE_LEAD_TOOL],
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 1024,
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
      const errText = await groqRes.text();
      throw new Error(`Groq error ${groqRes.status}: ${errText}`);
    }

    const groqData = await groqRes.json();
    const choice = groqData.choices?.[0];

    let replyParts = [];
    let leadSaved = false;

    if (choice?.finish_reason === "tool_calls" && choice.message?.tool_calls) {
      const toolCall = choice.message.tool_calls[0];
      if (toolCall.function.name === "save_lead") {
        const args = JSON.parse(toolCall.function.arguments);
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

        const followUpRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${GROQ_API_KEY}`,
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            messages: [
              { role: "system", content: systemPrompt },
              ...messages,
              choice.message,
              { role: "tool", tool_call_id: toolCall.id, content: "Lead salvato con successo. Ora ringrazia il cliente e conferma che un consulente lo contatterà entro 24 ore. Sii cordiale e professionale." },
            ],
            temperature: 0.7,
            max_tokens: 512,
          }),
        });

        if (followUpRes.ok) {
          const followUpData = await followUpRes.json();
          const content = followUpData.choices?.[0]?.message?.content || "Grazie! Un consulente la contatterà presto.";
          replyParts = content.split("||").map(s => s.trim()).filter(Boolean);
        } else {
          replyParts = ["Grazie! Un consulente Nolosubito la contatterà entro 24 ore."];
        }
      }
    }
    const content = choice?.message?.content || "";
    // Rimuove eventuali tag <function=...>... </function> che il modello potrebbe aver scritto nel testo
    const cleanContent = content.replace(/<function=[^>]+>.*?<\/function>/gs, "").trim();
    
    replyParts = cleanContent ? cleanContent.split("||").map(s => s.trim()).filter(Boolean) : [];
    
    // Se non c'è testo ma c'è un tool_call, la risposta testuale verrà generata dal follow-up
    // Se non c'è né testo né tool_call, mostra un messaggio di fallback
    if (replyParts.length === 0 && !leadSaved) {
      replyParts = ["Mi dispiace, riprova."];
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
