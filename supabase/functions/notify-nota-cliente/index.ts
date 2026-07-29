import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.13";

const SMTP_HOST    = Deno.env.get("SMTP_HOST")    ?? "";
const SMTP_PORT    = parseInt(Deno.env.get("SMTP_PORT") ?? "587");
const SMTP_USER    = Deno.env.get("SMTP_USER")    ?? "";
const SMTP_PASS    = Deno.env.get("SMTP_PASS")    ?? "";
const SMTP_FROM    = Deno.env.get("SMTP_FROM")    ?? SMTP_USER;
const SMTP_SECURE  = Deno.env.get("SMTP_SECURE")  === "true";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL             = Deno.env.get("SITE_URL") ?? "https://nolosubito.it";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: CORS });
  }

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("Configurazione SMTP mancante — email non inviata");
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: "SMTP not configured" }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  let praticaId: string, testo: string, autoreNome: string;
  try {
    ({ praticaId, testo, autoreNome } = await req.json());
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400, headers: CORS });
  }

  if (!praticaId || !testo) {
    return new Response(JSON.stringify({ error: "Missing required fields: praticaId, testo" }), {
      status: 400,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: pratica, error: pe } = await supabase
    .from("pratiche")
    .select("cliente_nome, cliente_email, codice")
    .eq("id", praticaId)
    .single();

  if (pe || !pratica) {
    console.error("Pratica non trovata:", pe?.message);
    return new Response(JSON.stringify({ error: "Pratica not found" }), { status: 404, headers: CORS });
  }

  const areaLink = `${SITE_URL}/mia-pratica?email=${encodeURIComponent(pratica.cliente_email)}`;

  const transporter = nodemailer.createTransport({
    host:   SMTP_HOST,
    port:   SMTP_PORT,
    secure: SMTP_SECURE,
    auth:   { user: SMTP_USER, pass: SMTP_PASS },
    tls:    { rejectUnauthorized: false },
  });

  try {
    await transporter.sendMail({
      from:    SMTP_FROM,
      to:      pratica.cliente_email,
      subject: `Nuovo messaggio dal team Nolosubito — Pratica ${pratica.codice}`,
      html:    buildEmail({
        nome:      pratica.cliente_nome,
        codice:    pratica.codice,
        testo,
        autore:    autoreNome,
        areaLink,
      }),
    });
  } catch (err) {
    console.error("Errore SMTP:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...CORS },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS },
  });
});

// ─── Template ───────────────────────────────────────────────────────────────

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

interface EmailData {
  nome: string;
  codice: string;
  testo: string;
  autore: string;
  areaLink: string;
}

function buildEmail(d: EmailData): string {
  const lines = d.testo.split("\n").filter(Boolean);
  const preview = lines.length > 3
    ? lines.slice(0, 3).map(l => `<p style="margin:0 0 6px;font-size:15px;color:#374151;line-height:1.65;">${esc(l)}</p>`).join("") +
      `<p style="margin:6px 0 0;font-size:14px;color:#9ca3af;font-style:italic;">... continua</p>`
    : lines.map(l => `<p style="margin:0 0 6px;font-size:15px;color:#374151;line-height:1.65;">${esc(l)}</p>`).join("");

  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Nuovo messaggio</title></head>
<body style="margin:0;padding:0;background:#f1f3f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f3f9;padding:32px 16px;">
<tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;">
  <tr><td style="background:#2F3589;border-radius:16px 16px 0 0;padding:28px 36px;">
    <p style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Nolosubito</p>
    <p style="margin:5px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">Noleggio a Lungo Termine</p>
  </td></tr>
  <tr><td style="background:#ffffff;padding:36px;">
    <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Ciao ${esc(d.nome)},</p>
    <h1 style="margin:0 0 10px;font-size:24px;font-weight:800;color:#1e2250;line-height:1.2;">Hai un nuovo messaggio</h1>
    <p style="margin:0 0 20px;font-size:15px;color:#6b7280;line-height:1.65;">
      <strong style="color:#1e2250;">${esc(d.autore)}</strong> del team Nolosubito ha scritto un messaggio per la tua pratica <strong style="color:#2F3589;">${esc(d.codice)}</strong>:
    </p>
    <div style="background:#f8f9fc;border:1px solid #e5e7f0;border-radius:12px;padding:20px 24px;margin-bottom:28px;">
      ${preview}
    </div>
    <div style="text-align:center;margin:0 0 8px;">
      <a href="${d.areaLink}" style="display:inline-block;background:#F96209;color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:10px;font-size:15px;font-weight:700;">
        Accedi all'area pratica &rarr;
      </a>
    </div>
  </td></tr>
  <tr><td style="background:#f8f9fc;border:1px solid #e5e7f0;border-top:none;border-radius:0 0 16px 16px;padding:18px 36px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">Domande? Scrivici a <a href="mailto:info@nolosubito.it" style="color:#2F3589;text-decoration:none;">info@nolosubito.it</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
