import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GOOGLE_AI_API_KEY = Deno.env.get("GOOGLE_AI_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-region",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BATCH_SIZE = 20;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: CORS });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: chunks, error } = await supabase
      .from("knowledge_chunks")
      .select("id, content")
      .is("embedding", null)
      .limit(BATCH_SIZE);

    if (error) throw new Error("fetch chunks: " + error.message);
    if (!chunks || chunks.length === 0) {
      return new Response(JSON.stringify({ processed: 0, message: "Nessun chunk da processare" }), {
        status: 200, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const texts = chunks.map((c: { content: string }) => c.content.slice(0, 8000));
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:batchEmbedContents?key=${GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: texts.map((t: string) => ({
            model: "models/gemini-embedding-2",
            content: { parts: [{ text: t }] },
            outputDimensionality: 768,
          })),
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini embedding error ${geminiRes.status}: ${errText}`);
    }

    const geminiData = await geminiRes.json() as { embeddings: { values: number[] }[] };

    const updates = chunks.map((chunk: { id: string }, i: number) => ({
      id: chunk.id,
      embedding: geminiData.embeddings[i].values,
    }));

    for (const update of updates) {
      const { error: updateError } = await supabase
        .from("knowledge_chunks")
        .update({ embedding: update.embedding })
        .eq("id", update.id);

      if (updateError) {
        console.error(`Failed to update chunk ${update.id}:`, updateError.message);
      }
    }

    return new Response(JSON.stringify({
      processed: chunks.length,
      message: `Processati ${chunks.length} chunk(s)`,
    }), { status: 200, headers: { ...CORS, "Content-Type": "application/json" } });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("generate-embeddings error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
