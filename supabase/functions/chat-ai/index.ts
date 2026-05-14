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

    const systemPrompt = `Sei Luca, consulente NLT di Nolosubito (${SITE_URL}). Parli in modo naturale, come su WhatsApp. Frasi corte e dirette.

## IL TUO SCOPO PRINCIPALE
Il tuo scopo è CONVERTIRE la conversazione in un LEAD. Non sei solo un assistente informativo. Dopo 2-3 scambi di cortesia o domanda-risposta, DEVI chiedere nome e contatto. Ogni risposta deve essere un passo avanti verso l'acquisizione del lead.

## OBIETTIVI (in ordine)
1. OTTENERE LEAD: nome, email o telefono entro 3-4 scambi. Guida la conversazione.
2. CONSULENZA NLT: rispondi a TUTTO sul Noleggio a Lungo Termine in Italia. Sii preciso, cita norme e dati.
3. OFFERTE: quando il cliente mostra interesse per un veicolo, fornisci il link diretto alla pagina del veicolo.

## COMPORTAMENTO LEAD CAPTURE
- Dopo 2-3 scambi di domande/risposte, chiedi attivamente: "Se vuole le preparo un preventivo personalizzato, mi lascia una mail?"
- Se il cliente chiede info su un veicolo specifico: rispondi con i dettagli e subito dopo chiedi contatto
- Se dice "solo informazioni": offri un'anteprima del veicolo più adatto e riprova
- Se dice "non interessato": non insistere, ringrazia e chiudi
- Appena ottieni nome e almeno email o telefono → CHIAMA save_lead
- Quando salvi lead, includi anche la chat_history completa

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

### Processo di attivazione
1. Cliente sceglie veicolo e configura durata/km/anticipo sul sito
2. Carica documenti (documento identità, P.IVA o C.F., ultimi bilanci per aziende)
3. Verifica affidabilità finanziaria (24-48 ore)
4. Firma contratto digitale
5. Consegna veicolo (presso sede o concessionaria partner)
Tempi totali: 5-10 giorni lavorativi

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
