/// <reference lib="deno.ns" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Siti automotive italiani da scrapare
const AUTOMOTIVE_SOURCES = [
  "https://www.quattroruote.it/articoli/",
  "https://www.motorbox.it/articoli/",
  "https://www.automoto.it/notizie/",
  "https://newsauto.it/",
  "https://www.infomotori.it/",
];

// Topic mapping
const TOPICS = {
  auto: "Nuove auto e modelli",
  incentivi: "Incentivi per il noleggio a lungo termine",
  codice_strada: "Novità nel codice della strada",
  tecnologie: "Nuove tecnologie automobilistiche",
  mezzi_commerciali: "Mezzi commerciali",
};

const REGIONS = ["Campania", "Lazio", "Toscana", "Umbria", "Marche", "Emilia Romagna"];

interface GenerateRequest {
  topic: keyof typeof TOPICS;
  region: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const body = (await req.json()) as GenerateRequest;
    const { topic, region } = body;

    if (!topic || !TOPICS[topic]) {
      return new Response(JSON.stringify({ error: "Topic non valido" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    if (!REGIONS.includes(region)) {
      return new Response(JSON.stringify({ error: "Regione non valida" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Scraping semplificato: prova a estrarre ultimi articoli da una fonte
    const sourceContent = await fetchSourceArticle(AUTOMOTIVE_SOURCES[0]);

    if (!sourceContent) {
      return new Response(JSON.stringify({ error: "Nessun articolo trovato da fonte" }), {
        status: 500,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // Riscrittura con Claude + SEO
    const generatedArticle = await generateArticleWithClaude(
      sourceContent,
      topic,
      region,
      TOPICS[topic]
    );

    // Downloader immagine e upload su Supabase Storage
    let coverImageUrl = null;
    if (sourceContent.photoUrl) {
      coverImageUrl = await downloadAndUploadImage(
        sourceContent.photoUrl,
        sourceContent.photoAuthor
      );
    }

    // Schema markup per SEO + GEO
    const schemaMarkup = generateSchemaMarkup(
      generatedArticle.title,
      generatedArticle.summary,
      region,
      sourceContent.sourceUrl,
      coverImageUrl
    );

    // Salva nel DB
    const postData = {
      title: generatedArticle.title,
      slug: generateSlug(generatedArticle.title),
      summary: generatedArticle.summary,
      content: generatedArticle.content,
      category: TOPICS[topic],
      cover_image_url: coverImageUrl || sourceContent.photoUrl,
      seo_title: generatedArticle.seoTitle,
      seo_description: generatedArticle.seoDescription,
      seo_keywords: generatedArticle.keywords,
      geo_region: region,
      topic,
      source_url: sourceContent.sourceUrl,
      source_author: sourceContent.author,
      source_photo_url: sourceContent.photoUrl,
      source_photo_author: sourceContent.photoAuthor,
      schema_markup: schemaMarkup,
      is_published: false,
      published_date: new Date().toISOString(),
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify(postData),
    });

    const savedPost = await response.json();

    return new Response(JSON.stringify({ data: savedPost }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});

// Fetch articolo da fonte (semplificato per ora)
async function fetchSourceArticle(sourceUrl: string): Promise<{
  sourceUrl: string;
  author: string;
  title: string;
  summary: string;
  content: string;
  photoUrl: string;
  photoAuthor: string;
} | null> {
  try {
    const response = await fetch(sourceUrl);
    const html = await response.text();

    // Estrazione semplificata con regex (in produzione usare deno_dom)
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/);
    const contentMatch = html.match(/<article[^>]*>(.+?)<\/article>/s);
    const photoMatch = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*alt=["']([^"']+)["']/);

    return {
      sourceUrl,
      author: "Fonte automotive italiana",
      title: titleMatch ? titleMatch[1].trim() : "Articolo automotive",
      summary: contentMatch ? contentMatch[1].substring(0, 200) + "..." : "Leggi l'articolo completo",
      content: contentMatch ? contentMatch[1] : "Contenuto non disponibile",
      photoUrl: photoMatch ? photoMatch[1] : "",
      photoAuthor: photoMatch ? photoMatch[2] : "Foto fonte originale",
    };
  } catch {
    return null;
  }
}

// Usa Claude per riscrivere articolo con SEO
async function generateArticleWithClaude(
  source: any,
  topic: string,
  region: string,
  topicDescription: string
): Promise<{
  title: string;
  summary: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string;
}> {
  const prompt = `Sei un esperto SEO e copywriter automotive italiano. Riscrivere l'articolo seguente per il mercato della Regione ${region}, con focus su noleggio a lungo termine.

TOPIC: ${topicDescription}
FONTE ORIGINALE: "${source.title}" - ${source.sourceUrl}

TESTO ORIGINALE:
${source.content}

ISTRUZIONI:
1. Riscrivere COMPLETAMENTE il contenuto (non copia-incolla)
2. Includere riferimento a: "Basato su: ${source.sourceUrl}" (cita la fonte)
3. Ottimizzare per SEO locale (Regione ${region})
4. Generare titolo SEO (max 60 car)
5. Generare meta description (max 160 car)
6. Generare 5 keywords rilevanti (separate da virgola)
7. Strutturare con H2/H3 in markdown

RISPOSTA JSON:
{
  "title": "Titolo accattivante per ${region}",
  "summary": "Breve introduzione (max 150 car)",
  "content": "Articolo completo in markdown...",
  "seoTitle": "SEO title (max 60 car)",
  "seoDescription": "Meta description (max 160 car)",
  "keywords": "keyword1, keyword2, keyword3, keyword4, keyword5"
}`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await response.json() as any;
  const raw = data.content?.[0]?.text ?? "{}";

  // Estrai JSON dalla risposta
  const match = raw.match(/\{[\s\S]*\}/);
  const parsed = match ? JSON.parse(match[0]) : {};

  return {
    title: parsed.title || "Articolo automotive",
    summary: parsed.summary || "Leggi l'articolo completo",
    content: parsed.content || "Contenuto non disponibile",
    seoTitle: parsed.seoTitle || "Articolo",
    seoDescription: parsed.seoDescription || "Leggi il nostro articolo",
    keywords: parsed.keywords || "automotive, noleggio, italy",
  };
}

// Download immagine e upload su Supabase Storage
async function downloadAndUploadImage(
  imageUrl: string,
  photoAuthor: string
): Promise<string> {
  try {
    const response = await fetch(imageUrl);
    const buffer = await response.arrayBuffer();

    // Upload a Supabase Storage
    const fileName = `news-${Date.now()}.jpg`;
    const uploadResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/gigi-images/news/${fileName}`,
      {
        method: "POST",
        headers: {
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: buffer,
      }
    );

    if (!uploadResponse.ok) {
      console.error("Upload image failed:", await uploadResponse.text());
      return imageUrl; // Fallback a URL originale
    }

    return `${SUPABASE_URL}/storage/v1/object/public/gigi-images/news/${fileName}`;
  } catch (err) {
    console.error("Download image error:", err);
    return imageUrl; // Fallback a URL originale
  }
}

// Genera schema.org JSON-LD per SEO
function generateSchemaMarkup(
  title: string,
  summary: string,
  region: string,
  sourceUrl: string,
  imageUrl: string | null
) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    description: summary,
    image: imageUrl || undefined,
    author: {
      "@type": "Organization",
      name: "Nolosubito",
      url: "https://nolosubito.quixel.it",
    },
    publisher: {
      "@type": "Organization",
      name: "Nolosubito",
      logo: "https://nolosubito.quixel.it/logo.svg",
    },
    datePublished: new Date().toISOString(),
    isAccessibleForFree: true,
    areaServed: {
      "@type": "AdministrativeArea",
      name: region,
    },
    mainEntity: {
      "@type": "Article",
      url: sourceUrl,
      name: "Articolo fonte",
    },
  };
}

// Genera slug da titolo
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
