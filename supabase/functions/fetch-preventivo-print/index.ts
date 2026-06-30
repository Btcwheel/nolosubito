import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return new Response(JSON.stringify({ error: "id param required" }), {
      status: 400, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: prev, error: ve } = await supabase
    .from("preventivi")
    .select("*")
    .eq("id", id)
    .single();

  if (ve || !prev) {
    return new Response(JSON.stringify({ error: "Preventivo non trovato", detail: ve?.message }), {
      status: 404, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const { data: pratica } = await supabase
    .from("pratiche")
    .select("cliente_nome, cliente_email, cliente_telefono, codice")
    .eq("id", prev.pratica_id)
    .single();

  // DEBUG: logga i dati restituiti per diagnosticare problemi di stampa
  console.log('[fetch-preventivo-print] preventivo:', {
    id: prev.id,
    servizi: prev.servizi,
    note_operative: prev.note_operative,
  });

  return new Response(JSON.stringify({ preventivo: prev, pratica }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
