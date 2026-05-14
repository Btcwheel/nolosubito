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

  const prompt = `Sei un copywriter senior con 15 anni di esperienza nel settore automotive e nel Noleggio Lungo Termine (NLT) in Italia. Scrivi per il blog di NoloSubito.it. Oggi è ${today}.

Il tuo stile: diretto, autorevole, mai banale. Usi il gergo del settore con naturalezza (canone, anticipo, massimale km, deducibilità, fringe benefit). Citi dati reali (UNRAE, Aniasa, normativa fiscale italiana) e fai esempi numerici concreti. Il lettore è un professionista o un privato che sa già cos'è il NLT — non spiegare le basi, vai al sodo.

Scrivi 2 articoli, uno per ciascun tema:
1. ${topics[0]}
2. ${topics[1]}

Ogni articolo deve:
- Aprire con un hook forte — una domanda, un dato sorprendente, o un'affermazione controcorrente
- Sviluppare il tema con sottotitoli chiari, dati numerici, esempi pratici italiani
- Avere un tono da consulente esperto, non da enciclopedia
- Chiudersi con una call-to-action naturale verso il noleggio

Restituisci SOLO un JSON con chiave "articles" contenente array di 2 oggetti, ognuno con:
- "title": titolo italiano accattivante max 70 caratteri (no clickbait, ma curioso)
- "summary": sommario SEO max 160 caratteri
- "meta_description": meta SEO max 155 caratteri
- "category": esattamente una tra: Notizie, Approfondimenti, Offerte, Green Mobility, Azienda
- "content": articolo Markdown min 600 parole, con sottotitoli ## e ###, lista puntata dove utile — usa \\n per andare a capo
- "photo_keyword": 2-3 parole inglese per Pexels (es. "electric car Italy", "business fleet")
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
        {
          role: "system",
          content: "Sei un copywriter NLT italiano. Rispondi SEMPRE e SOLO con JSON valido, senza markdown, senza testo aggiuntivo.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 4000,
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
