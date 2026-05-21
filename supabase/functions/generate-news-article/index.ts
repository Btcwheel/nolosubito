
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS });
  }

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

    // Genera articolo con Claude basato su topic + region
    const generatedArticle = await generateArticleWithClaude(
      topic,
      region,
      TOPICS[topic]
    );

    // Schema markup per SEO + GEO
    const schemaMarkup = generateSchemaMarkup(
      generatedArticle.title,
      generatedArticle.summary,
      region
    );

    // Salva nel DB
    const postData = {
      title: generatedArticle.title,
      slug: generateSlug(generatedArticle.title),
      summary: generatedArticle.summary,
      content: generatedArticle.content,
      category: TOPICS[topic],
      seo_title: generatedArticle.seoTitle,
      seo_description: generatedArticle.seoDescription,
      seo_keywords: generatedArticle.keywords,
      geo_region: region,
      topic,
      schema_markup: schemaMarkup,
      is_published: false,
      published_date: new Date().toISOString(),
      cover_image_url: null,
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

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`DB insert failed: ${errText}`);
    }

    const savedPost = await response.json();

    return new Response(JSON.stringify({ data: savedPost }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});

// Genera articolo con Claude
async function generateArticleWithClaude(
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
  const prompt = `Sei un esperto SEO e copywriter automotive italiano. Genera un articolo originale per il mercato della Regione ${region}, con focus su noleggio a lungo termine.

TOPIC: ${topicDescription}

ISTRUZIONI:
1. Titolo accattivante per ${region} (max 70 caratteri)
2. Sommario introduttivo (max 150 caratteri)
3. Articolo completo in markdown (H2/H3, paragrafi, punti rilevanti)
4. Titolo SEO-ottimizzato (max 60 car)
5. Meta description (max 160 car)
6. 5 keywords rilevanti (separate da virgola)
7. Contenuto ORIGINALE, NON da altre fonti — creato da zero
8. Parlare specificamente a clienti della Regione ${region}
9. Menzionare vantaggi del noleggio a lungo termine

RISPOSTA JSON (VALIDO):
{
  "title": "Titolo accattivante per ${region}",
  "summary": "Breve introduzione max 150 car",
  "content": "# Articolo completo\n\n## Sezione 1\n\nContenuto in markdown...",
  "seoTitle": "SEO title max 60 car",
  "seoDescription": "Meta description max 160 car",
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

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Claude API error: ${errText}`);
  }

  const data = await response.json() as any;
  const raw = data.content?.[0]?.text ?? "{}";

  // Estrai JSON dalla risposta
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Claude response non contiene JSON valido");
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    title: parsed.title || "Articolo automotive",
    summary: parsed.summary || "Leggi l'articolo completo",
    content: parsed.content || "Contenuto non disponibile",
    seoTitle: parsed.seoTitle || "Articolo",
    seoDescription: parsed.seoDescription || "Leggi il nostro articolo",
    keywords: parsed.keywords || "automotive, noleggio, italy",
  };
}

// Genera schema.org JSON-LD per SEO
function generateSchemaMarkup(
  title: string,
  summary: string,
  region: string
) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    description: summary,
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
  };
}

// Genera slug da titolo
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 100);
}
