
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
// @ts-ignore
import { createClient } from "jsr:@supabase/supabase-js@2";
// @ts-ignore
import nodemailer from "npm:nodemailer@6.9.13";

const SUPABASE_URL              = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL                  = Deno.env.get("SITE_URL")       ?? "https://nolosubito.it";
const SMTP_HOST                 = Deno.env.get("SMTP_HOST")      ?? "";
const SMTP_PORT                 = parseInt(Deno.env.get("SMTP_PORT") ?? "587");
const SMTP_USER                 = Deno.env.get("SMTP_USER")      ?? "";
const SMTP_PASS                 = Deno.env.get("SMTP_PASS")      ?? "";
const SMTP_FROM                 = Deno.env.get("SMTP_FROM")      ?? SMTP_USER;
const SMTP_SECURE               = Deno.env.get("SMTP_SECURE")    === "true";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Verifica che chi chiama sia admin
  const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "");
  const { data: { user: caller } } = await adminClient.auth.getUser(token);
  if (!caller) {
    return new Response(JSON.stringify({ error: "Non autenticato" }), { status: 401, headers: CORS });
  }
  const { data: callerProfile } = await adminClient
    .from("profiles").select("role, full_name, is_owner").eq("id", caller.id).single();
  if (callerProfile?.role !== "admin") {
    return new Response(JSON.stringify({ error: "Solo gli admin possono invitare" }), { status: 403, headers: CORS });
  }

  const { email, fullName, targetRole, backofficeRole, permissions } = await req.json() as any;
  const role = targetRole ?? "backoffice"; // retrocompatibilita' con chiamate esistenti

  if (!["backoffice", "agente", "admin"].includes(role)) {
    return new Response(JSON.stringify({ error: "targetRole non valido" }), { status: 400, headers: CORS });
  }
  if (role === "admin" && !callerProfile?.is_owner) {
    return new Response(JSON.stringify({ error: "Solo il titolare puo' invitare nuovi Admin" }), { status: 403, headers: CORS });
  }
  if (!email || !fullName || (role === "backoffice" && !backofficeRole)) {
    return new Response(JSON.stringify({ error: "email, fullName (e backofficeRole per il backoffice) sono obbligatori" }), { status: 400, headers: CORS });
  }

  // 1. Crea l'utente senza mandare email di Supabase
  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });
  if (createErr) {
    return new Response(JSON.stringify({ error: createErr.message }), { status: 400, headers: { ...CORS, "Content-Type": "application/json" } });
  }

  const userId = created.user!.id;

  // 2. Aggiorna il profilo
  await adminClient.from("profiles").update({
    full_name:       fullName,
    role,
    backoffice_role: role === "backoffice" ? backofficeRole : null,
    permissions:     role === "backoffice" ? (permissions ?? {}) : {},
    is_active:       true,
    invited_by:      caller.id,
    invited_at:      new Date().toISOString(),
  }).eq("id", userId);

  // 3. Genera link per impostare la password
  const DEST_BY_ROLE: Record<string, string> = { backoffice: "/backoffice", agente: "/agente", admin: "/admin" };
  const { data: linkData, error: linkErr } = await adminClient.auth.admin.generateLink({
    type:        "recovery",
    email,
    options:     { redirectTo: `${SITE_URL}${DEST_BY_ROLE[role]}` },
  });
  if (linkErr || !linkData?.properties?.action_link) {
    return new Response(JSON.stringify({ error: "Errore generazione link: " + linkErr?.message }), { status: 500, headers: CORS });
  }

  const actionLink = linkData.properties.action_link;

  // 4. Manda la nostra email brandizzata
  if (SMTP_HOST && SMTP_USER && SMTP_PASS) {
    const transporter = nodemailer.createTransport({
      host:   SMTP_HOST,
      port:   SMTP_PORT,
      secure: SMTP_SECURE,
      auth:   { user: SMTP_USER, pass: SMTP_PASS },
      tls:    { rejectUnauthorized: false },
    });

    const ruoloLabel: Record<string, string> = {
      operatore_base:   "Operatore Base",
      operatore_senior: "Operatore Senior",
      supervisore:      "Supervisore",
      agente:           "Agente",
      admin:            "Amministratore",
    };

    await transporter.sendMail({
      from:    SMTP_FROM,
      to:      email,
      subject: `Sei stato invitato nel team Nolosubito`,
      html:    buildInviteEmail({
        fullName,
        ruolo:      ruoloLabel[role === "backoffice" ? backofficeRole : role] ?? role,
        actionLink,
        invitedBy:  callerProfile?.full_name || "L'amministratore",
      }),
    });
  }

  return new Response(JSON.stringify({ ok: true, userId }), {
    headers: { ...CORS, "Content-Type": "application/json" },
  });
});

// ─── Template email ───────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

interface InviteEmailData {
  fullName:  string;
  ruolo:     string;
  actionLink: string;
  invitedBy: string;
}

function buildInviteEmail(d: InviteEmailData): string {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Invito team Nolosubito</title></head>
<body style="margin:0;padding:0;background:#f1f3f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f3f9;padding:32px 16px;">
<tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;">

  <!-- Header -->
  <tr><td style="background:#2F3589;border-radius:16px 16px 0 0;padding:28px 36px;">
    <p style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Nolosubito</p>
    <p style="margin:5px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">Noleggio a Lungo Termine — Area Backoffice</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:#ffffff;padding:36px;">
    <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Benvenuto nel team,</p>
    <h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#1e2250;line-height:1.2;">${esc(d.fullName)} 👋</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.65;">
      ${esc(d.invitedBy)} ti ha invitato ad accedere alla piattaforma di gestione <strong style="color:#1e2250;">Nolosubito</strong>
      con il ruolo di <strong style="color:#2F3589;">${esc(d.ruolo)}</strong>.
    </p>

    <!-- Ruolo badge -->
    <div style="background:#f0f2ff;border:1px solid #c7d0f8;border-radius:10px;padding:14px 20px;margin-bottom:28px;display:inline-block;width:100%;box-sizing:border-box;">
      <p style="margin:0 0 3px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Il tuo ruolo</p>
      <p style="margin:0;font-size:16px;font-weight:700;color:#2F3589;">${esc(d.ruolo)}</p>
    </div>

    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.65;">
      Clicca il pulsante qui sotto per impostare la tua password e accedere al backoffice.
      Il link è valido per <strong>24 ore</strong>.
    </p>

    <!-- CTA -->
    <div style="text-align:center;margin:0 0 28px;">
      <a href="${d.actionLink}" style="display:inline-block;background:#F96209;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.01em;">
        Imposta password e accedi &rarr;
      </a>
    </div>

    <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.7;">
      Se non riesci a cliccare il pulsante, copia questo link nel browser:<br/>
      <a href="${d.actionLink}" style="color:#2F3589;word-break:break-all;font-size:11px;">${d.actionLink}</a>
    </p>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#f8f9fc;border:1px solid #e5e7f0;border-top:none;border-radius:0 0 16px 16px;padding:18px 36px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">
      Hai ricevuto questa email perché sei stato invitato nel team Nolosubito.<br/>
      Domande? Scrivici a <a href="mailto:info@nolosubito.it" style="color:#2F3589;text-decoration:none;">info@nolosubito.it</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
