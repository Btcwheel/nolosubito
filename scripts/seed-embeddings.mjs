#!/usr/bin/env node
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const GOOGLE_AI_API_KEY = process.env.GOOGLE_AI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !GOOGLE_AI_API_KEY) {
  console.error("Missing required env vars: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GOOGLE_AI_API_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log("Fetching chunks without embeddings...");

  const { data: chunks, error } = await supabase
    .from("knowledge_chunks")
    .select("id, content")
    .is("embedding", null);

  if (error) {
    console.error("Error fetching chunks:", error.message);
    process.exit(1);
  }

  if (!chunks || chunks.length === 0) {
    console.log("All chunks already have embeddings. Nothing to do.");
    return;
  }

  console.log(`Found ${chunks.length} chunk(s) to process.`);

  const BATCH_SIZE = 20;
  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(chunks.length / BATCH_SIZE)} (${batch.length} chunks)...`);

    const texts = batch.map((c) => c.content);
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-2:batchEmbedContents?key=${GOOGLE_AI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: texts.map((t) => ({
            model: "models/gemini-embedding-2",
            content: { parts: [{ text: t }] },
            outputDimensionality: 768,
          })),
        }),
      },
    );

    if (!res.ok) {
      const err = await res.text();
      console.error(`Batch failed: ${res.status} ${err}`);
      continue;
    }

    const data = await res.json();

    for (let j = 0; j < batch.length; j++) {
      const { error: updateError } = await supabase
        .from("knowledge_chunks")
        .update({ embedding: data.embeddings[j].values })
        .eq("id", batch[j].id);

      if (updateError) {
        console.error(`Failed to update chunk ${batch[j].id}:`, updateError.message);
      } else {
        console.log(`  OK Chunk ${j + 1}/${batch.length} updated`);
      }
    }
  }

  console.log("Done. All chunks embedded.");
}

main().catch(console.error);
