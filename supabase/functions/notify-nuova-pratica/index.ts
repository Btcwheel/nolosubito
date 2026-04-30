/**
 * Edge Function: notify-nuova-pratica
 *
 * Invia:
 *  1. Notifica al backoffice (info@nolosubito.it) quando arriva una nuova richiesta
 *  2. Email di conferma al cliente
 *
 * Secret da configurare in Supabase → Settings → Edge Functions → Secrets:
 *   SMTP_HOST     = mail.nolosubito.it
 *   SMTP_PORT     = 587
 *   SMTP_USER     = preventivi@nolosubito.it
 *   SMTP_PASS     = xxxxxxxx
 *   SMTP_FROM     = Nolosubito <preventivi@nolosubito.it>
 *   SMTP_SECURE   = false
 *   NOTIFY_TO     = info@nolosubito.it
 *   BACKOFFICE_URL = https://nolosubito.quixel.it/backoffice
 *   SITE_URL      = https://nolosubito.quixel.it
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import nodemailer from "npm:nodemailer@6.9.13";

const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey, x-client-info",
};

const SMTP_HOST      = Deno.env.get("SMTP_HOST")      ?? "";
const SMTP_PORT      = parseInt(Deno.env.get("SMTP_PORT") ?? "587");
const SMTP_USER      = Deno.env.get("SMTP_USER")      ?? "";
const SMTP_PASS      = Deno.env.get("SMTP_PASS")      ?? "";
const SMTP_FROM      = Deno.env.get("SMTP_FROM")      ?? SMTP_USER;
const SMTP_SECURE    = Deno.env.get("SMTP_SECURE")    === "true";
const NOTIFY_TO      = Deno.env.get("NOTIFY_TO")      ?? "info@nolosubito.it";
const BACKOFFICE_URL = Deno.env.get("BACKOFFICE_URL") ?? "https://nolosubito.quixel.it/backoffice";
const SITE_URL       = Deno.env.get("SITE_URL")       ?? "https://nolosubito.quixel.it";

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

  let praticaId: string | null, codice: string, clienteNome: string, clienteEmail: string;
  let clienteTelefono: string | null, segmento: string | null, veicoloInteresse: string | null;
  try {
    ({ praticaId = null, codice, clienteNome, clienteEmail, clienteTelefono, segmento, veicoloInteresse } = await req.json());
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  const areaClienteLink = `${SITE_URL}/mia-pratica?email=${encodeURIComponent(clienteEmail)}`;
  const praticaLink = praticaId
    ? `${BACKOFFICE_URL}/pratica/${praticaId}`
    : BACKOFFICE_URL;
  const dataRichiesta = new Date().toLocaleString("it-IT", {
    day: "2-digit", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });

  const transporter = nodemailer.createTransport({
    host:   SMTP_HOST,
    port:   SMTP_PORT,
    secure: SMTP_SECURE,
    auth:   { user: SMTP_USER, pass: SMTP_PASS },
    tls:    { rejectUnauthorized: false },
  });

  try {
    // 1. Notifica al backoffice
    await transporter.sendMail({
      from:    SMTP_FROM,
      to:      NOTIFY_TO,
      subject: `[Nolosubito] Nuova richiesta — ${clienteNome} (${codice})`,
      html:    buildNotifica({ codice, clienteNome, clienteEmail, clienteTelefono, segmento, veicoloInteresse, dataRichiesta, praticaLink }),
    });

    // 2. Conferma al cliente
    await transporter.sendMail({
      from:    SMTP_FROM,
      to:      clienteEmail,
      subject: `Richiesta ricevuta! Ti contatteremo presto — Nolosubito`,
      html:    buildConfermaCliente({ nome: clienteNome, codice, veicoloInteresse, areaLink: areaClienteLink }),
    });
  } catch (err) {
    console.error("Errore SMTP:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500, headers: { "Content-Type": "application/json", ...CORS } });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...CORS },
  });
});

// ─── Templates ────────────────────────────────────────────────────────────────

function esc(s: string | null | undefined): string {
  if (!s) return "—";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function row(label: string, value: string): string {
  return `
  <tr>
    <td style="padding:10px 0;border-bottom:1px solid #f1f3f9;font-size:13px;color:#6b7280;width:38%;font-weight:600;">${label}</td>
    <td style="padding:10px 0;border-bottom:1px solid #f1f3f9;font-size:13px;color:#1e2250;font-weight:500;">${value}</td>
  </tr>`;
}

interface NotificaData {
  codice: string;
  clienteNome: string;
  clienteEmail: string;
  clienteTelefono: string | null;
  segmento: string | null;
  veicoloInteresse: string | null;
  dataRichiesta: string;
  praticaLink: string;
}

function buildNotifica(d: NotificaData): string {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Nuova richiesta preventivo</title></head>
<body style="margin:0;padding:0;background:#f1f3f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f3f9;padding:32px 16px;">
<tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;">
  <tr><td style="background:#2F3589;border-radius:16px 16px 0 0;padding:24px 32px;">
    <p style="margin:0;color:#fff;font-size:20px;font-weight:700;">Nolosubito</p>
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:12px;">Backoffice — Nuova richiesta</p>
  </td></tr>
  <tr><td style="background:#ffffff;padding:32px;">
    <div style="display:inline-block;background:#FFF3E0;border:1px solid #FED7AA;border-radius:8px;padding:6px 14px;margin-bottom:20px;">
      <span style="font-size:11px;font-weight:700;color:#F96209;text-transform:uppercase;letter-spacing:0.08em;">Nuova richiesta</span>
    </div>
    <h1 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#1e2250;">${esc(d.clienteNome)}</h1>
    <p style="margin:0 0 24px;font-size:13px;color:#9ca3af;">
      Ricevuta il ${esc(d.dataRichiesta)} · Pratica <strong style="color:#374151;">${esc(d.codice)}</strong>
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:28px;">
      ${row("Email", `<a href="mailto:${esc(d.clienteEmail)}" style="color:#2F3589;">${esc(d.clienteEmail)}</a>`)}
      ${row("Telefono", d.clienteTelefono ? `<a href="tel:${esc(d.clienteTelefono)}" style="color:#2F3589;">${esc(d.clienteTelefono)}</a>` : "—")}
      ${row("Segmento", esc(d.segmento))}
      ${row("Veicolo d'interesse", esc(d.veicoloInteresse))}
    </table>
    <div style="text-align:center;margin:28px 0 0;">
      <a href="${d.praticaLink}" style="display:inline-block;background:#2F3589;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:10px;font-size:14px;font-weight:700;">
        Apri pratica nel backoffice &rarr;
      </a>
    </div>
  </td></tr>
  <tr><td style="background:#f8f9fc;border:1px solid #e5e7f0;border-top:none;border-radius:0 0 16px 16px;padding:16px 32px;text-align:center;">
    <p style="margin:0;font-size:11px;color:#9ca3af;">Notifica automatica Nolosubito · Non rispondere a questa email</p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

interface ConfermaClienteData {
  nome: string;
  codice: string;
  veicoloInteresse: string | null;
  areaLink: string;
}

function buildConfermaCliente(d: ConfermaClienteData): string {
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Richiesta ricevuta</title></head>
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
    <h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#1e2250;line-height:1.2;">Richiesta ricevuta!</h1>
    <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.65;">
      Abbiamo ricevuto la tua richiesta di preventivo${d.veicoloInteresse && d.veicoloInteresse !== "—" ? ` per <strong style="color:#1e2250;">${esc(d.veicoloInteresse)}</strong>` : ""}.
      Il nostro team la analizzerà e ti contatterà entro <strong>24 ore</strong> lavorative.
    </p>
    <div style="background:#f8f9fc;border:1px solid #e5e7f0;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
      <p style="margin:0 0 3px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Numero pratica</p>
      <p style="margin:0;font-size:20px;font-weight:800;color:#2F3589;letter-spacing:0.04em;">${esc(d.codice)}</p>
    </div>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.65;">
      Puoi seguire lo stato della tua pratica dalla tua area personale:
    </p>
    <div style="text-align:center;margin:0 0 24px;">
      <a href="${d.areaLink}" style="display:inline-block;background:#F96209;color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:10px;font-size:15px;font-weight:700;">
        Accedi alla tua area pratica &rarr;
      </a>
    </div>
    <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.7;">
      Oppure copia questo link:<br/>
      <a href="${d.areaLink}" style="color:#2F3589;word-break:break-all;font-size:12px;">${d.areaLink}</a>
    </p>
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
