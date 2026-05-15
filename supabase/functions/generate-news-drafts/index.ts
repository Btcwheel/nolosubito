import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GROQ_API_KEY           = Deno.env.get("GROQ_API_KEY")!;
const PEXELS_API_KEY         = Deno.env.get("PEXELS_API_KEY")!;
const SUPABASE_URL           = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[àáâä]/g, "a").replace(/[èéêë]/g, "e")
    .replace(/[ìíîï]/g, "i").replace(/[òóôö]/g, "o")
    .replace(/[ùúûü]/g, "u")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function fetchPexelsPhoto(keyword: string): Promise<string> {
  try {
    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(keyword)}&per_page=5&orientation=landscape`,
      { headers: { Authorization: PEXELS_API_KEY } }
    );
    const data = await res.json();
    const photo = data.photos?.[0];
    return photo?.src?.large2x || photo?.src?.large || "";
  } catch (_) {
    return "";
  }
}

// Temi ruotanti per variare gli articoli ogni giorno
const TOPIC_POOL = [
  "vantaggi fiscali del noleggio a lungo termine per le partite IVA italiane nel 2025",
  "confronto NLT vs acquisto auto per privati italiani: qual è più conveniente",
  "auto elettriche in noleggio lungo termine: incentivi statali e regionali disponibili in Italia",
  "noleggio lungo termine per aziende: come ottimizzare la flotta e ridurre i costi",
  "le migliori SUV in NLT sotto i 400 euro al mese per privati",
  "trend del mercato NLT italiano: dati UNRAE e previsioni per il 2025",
  "noleggio a lungo termine senza anticipo: come funziona e chi può richiederlo",
  "auto ibride plug-in in NLT: convenienza e deducibilità fiscale per le aziende",
  "differenze tra noleggio breve, medio e lungo termine: guida completa",
  "come scegliere i km annui giusti nel contratto NLT ed evitare costi extra",
  "noleggio lungo termine per neopatentati: modelli disponibili e condizioni",
  "flotte aziendali elettriche: il noleggio come soluzione per la transizione green",
  "cosa include davvero un canone NLT: assicurazione, manutenzione, soccorso stradale",
  "noleggio lungo termine veicoli commerciali: vantaggi per artigiani e PMI italiane",
  "fine contratto NLT: cosa succede all'auto e quali opzioni hai",
];

function pickTopics(seed: number, count: number): string[] {
  // Ruota i temi in base al giorno dell'anno per non ripetersi
  const start = seed % TOPIC_POOL.length;
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(TOPIC_POOL[(start + i) % TOPIC_POOL.length]);
  }
  return result;
}

async function generateArticles(): Promise<any[]> {
  const now = new Date();
  const today = now.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
  const topics = pickTopics(dayOfYear, 2);

  const systemPrompt = `Sei Marco Ferretti, giornalista automotive freelance con 18 anni di esperienza. Hai scritto per Quattroruote, Il Sole 24 Ore Motori e AutomotoIT. Ora curi il blog editoriale di NoloSubito.it, la piattaforma italiana di noleggio a lungo termine.

REGOLE ASSOLUTE — violare anche una sola è inaccettabile:
- MAI iniziare un paragrafo con "In questo articolo", "È importante", "In conclusione", "Come è noto", "Va sottolineato", "In un mondo in cui"
- MAI usare frasi passive e vuote tipo "risulta essere", "si può affermare", "è possibile notare"
- MAI elenchi generici e ovvi: ogni punto deve portare un dato o un esempio concreto
- MAI tono enciclopedico o scolastico — scrivi come parli con un cliente intelligente al telefono
- USA il gergo settoriale in modo naturale: canone, anticipo, massimale km, restituzione, fringe benefit, deducibilità al 20%/80%/100%, benefit in kind
- CITA fonti plausibili e dati numerici specifici: UNRAE, Aniasa, normativa TUIR art. 164, soglie 2024/2025
- Il lettore conosce già il NLT — non spiegare cos'è, approfondisci un aspetto specifico

Rispondi SOLO con JSON valido, zero testo fuori dal JSON.`;

  const userPrompt = `Oggi è ${today}. Scrivi 2 articoli professionali per il blog di NoloSubito.it, uno per tema:
1. ${topics[0]}
2. ${topics[1]}

Struttura obbligatoria per ogni articolo:
- APERTURA: 2-3 righe di hook — un dato scomodo, un paradosso di mercato, o una domanda che nessuno si pone ma tutti dovrebbero. Niente presentazioni generiche.
- CORPO: 3-4 sezioni con ## sottotitolo incisivo (non generico come "Vantaggi" ma specifico come "Perché il 78% delle P.IVA sceglie NLT nel 2025"). Ogni sezione min 120 parole, con numeri, esempi reali, ragionamenti pratici.
- CHIUSURA: 1 paragrafo con implicazione pratica per il lettore + 1 frase di transizione verso NoloSubito (mai aggressiva, mai "Contattaci subito!")

Restituisci JSON con chiave "articles", array di 2 oggetti:
- "title": max 72 caratteri, specifico e curioso (no clickbait)
- "summary": max 160 caratteri, risponde a "perché leggere questo?"
- "meta_description": max 155 caratteri ottimizzata SEO
- "category": una tra Notizie, Approfondimenti, Offerte, Green Mobility, Azienda
- "content": Markdown min 850 parole, \\n per ritorni a capo, struttura ## e ### dove serve
- "photo_keyword": 3 parole inglese per Pexels
- "source_url": ""
- "source_title": ""`;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.85,
      max_tokens: 6000,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = (data.choices?.[0]?.message?.content || "").trim();
  console.log("Groq raw response (first 300 chars):", text.slice(0, 300));

  // Groq con json_object wrappa in un oggetto — gestiamo entrambi i casi
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error("JSON parse failed: " + text.slice(0, 200));
  }

  // Supporta sia { "articles": [...] } sia [...] sia { "0": {...}, "1": {...} }
  if (Array.isArray(parsed)) return parsed;
  if (Array.isArray(parsed.articles)) return parsed.articles;
  if (Array.isArray(parsed.data)) return parsed.data;
  // Oggetto con chiavi numeriche
  const values = Object.values(parsed);
  if (values.length > 0 && typeof values[0] === "object") return values as any[];

  throw new Error("Formato risposta Groq non riconosciuto: " + text.slice(0, 200));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method not allowed", { status: 405, headers: CORS });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // 1. Genera articoli con Groq
    const articles = await generateArticles();
    console.log(`Articoli generati da Groq: ${articles.length}`);

    // 2. Per ogni articolo cerca foto Pexels e salva in DB
    const saved = [];
    for (const article of articles) {
      const photoUrl = await fetchPexelsPhoto(article.photo_keyword || "car road italy");
      const baseSlug = slugify(article.title || "articolo");
      const slug = `${baseSlug}-${Date.now()}`;

      const { data, error } = await supabase.from("news_drafts").insert({
        title:            article.title,
        slug,
        summary:          article.summary,
        content:          article.content,
        cover_image_url:  photoUrl,
        category:         article.category,
        meta_description: article.meta_description,
        source_url:       article.source_url || null,
        source_title:     article.source_title || null,
        status:           "pending",
      }).select().single();

      if (error) console.error("DB insert error:", error.message);
      else saved.push(data);
    }

    return new Response(
      JSON.stringify({ ok: true, generated: saved.length }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    console.error("generate-news-drafts error:", err.message);
    return new Response(
      JSON.stringify({ ok: false, error: err.message }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
});
