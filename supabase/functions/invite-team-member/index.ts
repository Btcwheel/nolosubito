/// <reference lib="deno.ns" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const SUPABASE_URL             = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL                 = Deno.env.get("SITE_URL") ?? "https://nolosubito.it";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verifica che chi chiama sia admin
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");
  const { data: { user: caller } } = await adminClient.auth.getUser(token);
  if (!caller) {
    return new Response(JSON.stringify({ error: "Non autenticato" }), { status: 401, headers: CORS });
  }
  const { data: callerProfile } = await adminClient
    .from("profiles").select("role").eq("id", caller.id).single();
  if (callerProfile?.role !== "admin") {
    return new Response(JSON.stringify({ error: "Solo gli admin possono invitare" }), { status: 403, headers: CORS });
  }

  const { email, fullName, backofficeRole, permissions } = await req.json();
  if (!email || !fullName || !backofficeRole) {
    return new Response(JSON.stringify({ error: "email, fullName e backofficeRole sono obbligatori" }), { status: 400, headers: CORS });
  }

  // Invita l'utente — Supabase invia l'email di attivazione
  const { data: invited, error: inviteErr } = await adminClient.auth.admin.inviteUserByEmail(email, {
    redirectTo: `${SITE_URL}/backoffice`,
    data: {
      full_name: fullName,
      role: "backoffice",
    },
  });

  if (inviteErr) {
    return new Response(JSON.stringify({ error: inviteErr.message }), { status: 400, headers: CORS });
  }

  // Aggiorna il profilo con ruolo e permessi
  await adminClient.from("profiles").update({
    full_name: fullName,
    role: "backoffice",
    backoffice_role: backofficeRole,
    permissions: permissions ?? {},
    invited_by: caller.id,
    invited_at: new Date().toISOString(),
  }).eq("id", invited.user!.id);

  return new Response(JSON.stringify({ ok: true, userId: invited.user!.id }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});
