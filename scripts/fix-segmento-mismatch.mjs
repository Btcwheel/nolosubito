#!/usr/bin/env node
// Corregge le pratiche esistenti dove il "segmento" (listino P.IVA/Privati) non
// coincide col "cliente_tipo" dichiarato dal cliente nel LeadForm, causato dal bug
// per cui il segmento veniva preso dal tab prezzi attivo sulla pagina veicolo invece
// che dal tipo cliente selezionato nel form (vedi src/components/lead/LeadForm.jsx).
//
// Non tocca segmenti legati alla categoria del veicolo (Veicoli Commerciali, ReUse,
// Fleet, Moto, Green): quelli sono corretti a prescindere dal tipo cliente.
//
// Uso:
//   node scripts/fix-segmento-mismatch.mjs            # dry-run: mostra solo cosa cambierebbe
//   node scripts/fix-segmento-mismatch.mjs --apply     # applica le correzioni

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing required env vars: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  console.error("La service role key si trova in Supabase → Project Settings → API.");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function expectedSegmento(clienteTipo) {
  return clienteTipo === "Privato" ? "Privati" : "P.IVA";
}

async function main() {
  const { data: pratiche, error } = await supabase
    .from("pratiche")
    .select("id, cliente_nome, cliente_tipo, segmento, created_at")
    .in("segmento", ["P.IVA", "Privati"])
    .not("cliente_tipo", "is", null);

  if (error) {
    console.error("Errore nel leggere le pratiche:", error.message);
    process.exit(1);
  }

  const mismatched = pratiche.filter(
    (p) => p.segmento !== expectedSegmento(p.cliente_tipo)
  );

  if (mismatched.length === 0) {
    console.log("Nessuna pratica con segmento disallineato dal tipo cliente. Tutto ok.");
    return;
  }

  console.log(`Trovate ${mismatched.length} pratiche con segmento disallineato:\n`);
  for (const p of mismatched) {
    const nuovoSegmento = expectedSegmento(p.cliente_tipo);
    console.log(
      `- [${p.created_at?.slice(0, 10)}] ${p.cliente_nome || "(senza nome)"} (${p.id}): ` +
      `cliente_tipo="${p.cliente_tipo}" segmento="${p.segmento}" -> "${nuovoSegmento}"`
    );
  }

  if (!APPLY) {
    console.log("\nDry-run: nessuna modifica applicata. Rilancia con --apply per correggere questi record.");
    return;
  }

  console.log("\nApplico le correzioni...");
  let ok = 0;
  for (const p of mismatched) {
    const nuovoSegmento = expectedSegmento(p.cliente_tipo);
    const { error: updateError } = await supabase
      .from("pratiche")
      .update({ segmento: nuovoSegmento })
      .eq("id", p.id);
    if (updateError) {
      console.error(`Errore aggiornando ${p.id}:`, updateError.message);
    } else {
      ok++;
    }
  }
  console.log(`\nFatto: ${ok}/${mismatched.length} pratiche corrette.`);
}

main();
