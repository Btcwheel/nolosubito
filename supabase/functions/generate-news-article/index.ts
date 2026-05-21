
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

console.error("ENV_CHECK:", {
  ANTHROPIC_API_KEY: ANTHROPIC_API_KEY ? "✓ set" : "✗ missing",
  SUPABASE_URL: SUPABASE_URL ? "✓ set" : "✗ missing",
  SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY ? "✓ set" : "✗ missing",
});

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
const DEFAULT_POST_CATEGORY = "Notizie";

interface GenerateRequest {
  topic: keyof typeof TOPICS;
  region: string;
}

Deno.serve(async (req: Request) => {
  console.error("REQUEST_STARTED:", req.method);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: CORS });
  }

  try {
    console.error("PARSING_BODY...");
    const body = (await req.json()) as GenerateRequest;
    console.error("BODY_PARSED:", JSON.stringify(body));
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

    // Salva prima i campi garantiti dallo schema, poi aggiunge i metadati opzionali.
    const basePostData = {
      title: generatedArticle.title,
      summary: generatedArticle.summary,
      content: generatedArticle.content,
      category: DEFAULT_POST_CATEGORY,
      is_published: false,
      published_date: new Date().toISOString(),
      cover_image_url: null,
    };

    console.error("POST_DATA_BASE:", JSON.stringify(basePostData, null, 2));

    const slugBase = generateSlug(generatedArticle.title);
    const { data: savedPost, error: insertError } = await supabase
      .from("posts")
      .insert({ ...basePostData, slug: slugBase })
      .select("*")
      .single();

    let finalSavedPost = savedPost;
    let finalInsertError = insertError;

    if (insertError && insertError.code === "23505") {
      const fallbackSlug = `${slugBase}-${Date.now().toString(36)}`;
      console.error("SLUG_CONFLICT_RETRY:", { slugBase, fallbackSlug, message: insertError.message });
      const retry = await supabase
        .from("posts")
        .insert({ ...basePostData, slug: fallbackSlug })
        .select("*")
        .single();
      finalSavedPost = retry.data;
      finalInsertError = retry.error;
    }

    if (finalInsertError) {
      console.error("DB_INSERT_ERROR:", finalInsertError);
      throw new Error(`DB insert failed: ${finalInsertError.message}`);
    }

    const optionalMetadata = {
      seo_title: generatedArticle.seoTitle,
      seo_description: generatedArticle.seoDescription,
      seo_keywords: normalizeKeywords(generatedArticle.keywords),
      geo_region: region,
      topic,
      schema_markup: schemaMarkup,
    };

    const { error: metadataError } = await supabase
      .from("posts")
      .update(optionalMetadata)
      .eq("id", finalSavedPost.id);

    if (metadataError) {
      console.error("OPTIONAL_METADATA_UPDATE_FAILED:", metadataError);
    }

    return new Response(JSON.stringify({ data: finalSavedPost }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Errore nella generazione dell'articolo. Riprova tra alcuni secondi." }), {
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
3. Articolo in markdown (H2/H3, paragrafi) — BREVE, circa 800-1000 parole max
4. Titolo SEO-ottimizzato (max 60 car)
5. Meta description (max 160 car)
6. 5 keywords rilevanti (separate da virgola)

RISPOSTA JSON SOLO:
{
  "title": "Titolo",
  "summary": "Sommario",
  "content": "# Titolo\n\n## Sezione\n\nTesto breve...",
  "seoTitle": "SEO title",
  "seoDescription": "Meta description",
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
      max_tokens: 2500,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("CLAUDE_API_ERROR:", response.status, errText);
    throw new Error(`Claude API error (${response.status}): ${errText}`);
  }

  const data = await response.json() as any;
  console.error("CLAUDE_RESPONSE:", JSON.stringify(data, null, 2));
  const raw = data.content?.[0]?.text ?? "{}";

  // Estrai JSON dalla risposta (con o senza markdown code fences)
  let jsonMatch = raw.match(/```json\s*(\{[\s\S]*\})\s*```/) || raw.match(/```\s*(\{[\s\S]*\})\s*```/) || raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("NO_JSON_FOUND:", raw.substring(0, 300));
    throw new Error("JSON non trovato");
  }

  const jsonStr = jsonMatch[1] || jsonMatch[0];
  console.error("EXTRACTED_JSON_LENGTH:", jsonStr.length);

  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (parseErr) {
    console.error("JSON_PARSE_ERROR:", String(parseErr), "JSON:", jsonStr.substring(0, 200));
    throw new Error("JSON invalido");
  }

  return {
    title: parsed.title || "Articolo automotive",
    summary: parsed.summary || "Leggi l'articolo completo",
    content: parsed.content || "Contenuto non disponibile",
    seoTitle: parsed.seoTitle || "Articolo",
    seoDescription: parsed.seoDescription || "Leggi il nostro articolo",
    keywords: parsed.keywords || "automotive, noleggio, italy",
  };
}

function normalizeKeywords(keywords: string): string[] {
  return keywords
    .split(",")
    .map(k => k.trim())
    .filter(Boolean);
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
