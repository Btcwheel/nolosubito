/**
 * Edge Function: send-preventivo-email
 *
 * Invia:
 *  1. Email con il preventivo al cliente
 *  2. Copia notifica al backoffice (info@nolosubito.it)
 *
 * Secret da configurare in Supabase → Settings → Edge Functions → Secrets:
 *   SMTP_HOST        = mail.nolosubito.it
 *   SMTP_PORT        = 587
 *   SMTP_USER        = preventivi@nolosubito.it
 *   SMTP_PASS        = xxxxxxxx
 *   SMTP_FROM        = Nolosubito <preventivi@nolosubito.it>
 *   SMTP_SECURE      = false
 *   BACKOFFICE_EMAIL = info@nolosubito.it
 *   SITE_URL         = https://nolosubito.quixel.it
 */

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import nodemailer from "npm:nodemailer@6.9.13";

const SMTP_HOST        = Deno.env.get("SMTP_HOST")        ?? "";
const SMTP_PORT        = parseInt(Deno.env.get("SMTP_PORT") ?? "587");
const SMTP_USER        = Deno.env.get("SMTP_USER")        ?? "";
const SMTP_PASS        = Deno.env.get("SMTP_PASS")        ?? "";
const SMTP_FROM        = Deno.env.get("SMTP_FROM")        ?? SMTP_USER;
const SMTP_SECURE      = Deno.env.get("SMTP_SECURE")      === "true";
const BACKOFFICE_EMAIL = Deno.env.get("BACKOFFICE_EMAIL") ?? "info@nolosubito.it";

const SUPABASE_URL         = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL             = Deno.env.get("SITE_URL") ?? "https://nolosubito.quixel.it";

serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.warn("Configurazione SMTP mancante — email non inviata");
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: "SMTP not configured" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  let preventivoId: string, praticaId: string;
  try {
    ({ preventivoId, praticaId } = await req.json());
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), { status: 400 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: pratica, error: pe } = await supabase
    .from("pratiche")
    .select("cliente_nome, cliente_email, codice")
    .eq("id", praticaId)
    .single();

  if (pe || !pratica) {
    return new Response(JSON.stringify({ error: "Pratica not found" }), { status: 404 });
  }

  const { data: prev, error: ve } = await supabase
    .from("preventivi")
    .select("*")
    .eq("id", preventivoId)
    .single();

  if (ve || !prev) {
    return new Response(JSON.stringify({ error: "Preventivo not found" }), { status: 404 });
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
    // 1. Email al cliente
    await transporter.sendMail({
      from:    SMTP_FROM,
      to:      pratica.cliente_email,
      subject: `Il tuo preventivo è pronto — ${prev.veicolo_marca} ${prev.veicolo_modello}`,
      html:    buildEmail({
        nome:          pratica.cliente_nome,
        codice:        pratica.codice,
        marca:         prev.veicolo_marca,
        modello:       prev.veicolo_modello,
        alimentazione: prev.alimentazione,
        durata:        prev.durata_mesi,
        kmAnnui:       prev.km_annui,
        anticipo:      prev.anticipo ?? 0,
        canone:        prev.canone_finale ?? prev.canone_mensile,
        noteCliente:   prev.note_cliente,
        areaLink,
      }),
    });

    // 2. Copia al backoffice
    await transporter.sendMail({
      from:    SMTP_FROM,
      to:      BACKOFFICE_EMAIL,
      subject: `[Preventivo Inviato] ${prev.veicolo_marca} ${prev.veicolo_modello} — ${pratica.cliente_nome} (${pratica.codice})`,
      html:    buildBackofficeNotifica({
        codice:       pratica.codice,
        clienteNome:  pratica.cliente_nome,
        clienteEmail: pratica.cliente_email,
        marca:        prev.veicolo_marca,
        modello:      prev.veicolo_modello,
        durata:       prev.durata_mesi,
        kmAnnui:      prev.km_annui,
        anticipo:     prev.anticipo ?? 0,
        canone:       prev.canone_finale ?? prev.canone_mensile,
      }),
    });
  } catch (err) {
    console.error("Errore SMTP:", err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

// ─── Templates ────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return n?.toLocaleString("it-IT") ?? "—";
}

function esc(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

interface EmailData {
  nome: string;
  codice: string;
  marca: string;
  modello: string;
  alimentazione: string | null;
  durata: number;
  kmAnnui: number;
  anticipo: number;
  canone: number;
  noteCliente: string | null;
  areaLink: string;
}

interface BackofficeNotificaData {
  codice: string;
  clienteNome: string;
  clienteEmail: string;
  marca: string;
  modello: string;
  durata: number;
  kmAnnui: number;
  anticipo: number;
  canone: number;
}

function buildBackofficeNotifica(d: BackofficeNotificaData): string {
  const anticipoLabel = d.anticipo > 0 ? `€${fmt(d.anticipo)}` : "Senza anticipo";
  return `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"/><title>Preventivo inviato</title></head>
<body style="margin:0;padding:0;background:#f1f3f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f3f9;padding:32px 16px;">
<tr><td align="center">
<table width="540" cellpadding="0" cellspacing="0" style="max-width:540px;width:100%;">
  <tr><td style="background:#2F3589;border-radius:16px 16px 0 0;padding:24px 32px;">
    <p style="margin:0;color:#fff;font-size:20px;font-weight:700;">Nolosubito</p>
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.6);font-size:12px;">Backoffice — Preventivo inviato</p>
  </td></tr>
  <tr><td style="background:#ffffff;padding:32px;">
    <div style="display:inline-block;background:#E8F5E9;border:1px solid #A5D6A7;border-radius:8px;padding:6px 14px;margin-bottom:20px;">
      <span style="font-size:11px;font-weight:700;color:#2E7D32;text-transform:uppercase;letter-spacing:0.08em;">Preventivo inviato al cliente</span>
    </div>
    <h1 style="margin:0 0 4px;font-size:22px;font-weight:800;color:#1e2250;">${esc(d.clienteNome)}</h1>
    <p style="margin:0 0 24px;font-size:13px;color:#9ca3af;">
      <a href="mailto:${esc(d.clienteEmail)}" style="color:#2F3589;">${esc(d.clienteEmail)}</a>
      &nbsp;·&nbsp;Pratica <strong style="color:#374151;">${esc(d.codice)}</strong>
    </p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f3f9;font-size:13px;color:#6b7280;width:38%;font-weight:600;">Veicolo</td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f3f9;font-size:13px;color:#1e2250;font-weight:500;">${esc(d.marca)} ${esc(d.modello)}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f3f9;font-size:13px;color:#6b7280;font-weight:600;">Durata</td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f3f9;font-size:13px;color:#1e2250;font-weight:500;">${d.durata} mesi</td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f3f9;font-size:13px;color:#6b7280;font-weight:600;">Km/anno</td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f3f9;font-size:13px;color:#1e2250;font-weight:500;">${fmt(d.kmAnnui)}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #f1f3f9;font-size:13px;color:#6b7280;font-weight:600;">Anticipo</td>
        <td style="padding:10px 0;border-bottom:1px solid #f1f3f9;font-size:13px;color:#1e2250;font-weight:500;">${anticipoLabel}</td>
      </tr>
      <tr>
        <td style="padding:10px 0;font-size:13px;color:#6b7280;font-weight:600;">Canone mensile</td>
        <td style="padding:10px 0;font-size:15px;color:#F96209;font-weight:800;">€${fmt(d.canone)}/mese</td>
      </tr>
    </table>
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

function buildEmail(d: EmailData): string {
  const anticipoLabel = d.anticipo > 0 ? `€${fmt(d.anticipo)}` : "Senza anticipo";

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Il tuo preventivo è pronto</title>
</head>
<body style="margin:0;padding:0;background:#f1f3f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f3f9;padding:32px 16px;">
<tr><td align="center">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

  <tr><td style="background:#2F3589;border-radius:16px 16px 0 0;padding:28px 36px;">
    <p style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">Nolosubito</p>
    <p style="margin:5px 0 0;color:rgba(255,255,255,0.6);font-size:13px;">Noleggio a Lungo Termine</p>
  </td></tr>

  <tr><td style="background:#ffffff;padding:36px;">
    <p style="margin:0 0 6px;font-size:12px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Ciao ${esc(d.nome)},</p>
    <h1 style="margin:0 0 10px;font-size:26px;font-weight:800;color:#1e2250;line-height:1.2;">Il tuo preventivo è pronto!</h1>
    <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.65;">
      Abbiamo elaborato un preventivo per la tua richiesta di noleggio a lungo termine.
      Puoi visionarlo e accettarlo direttamente dalla tua area personale.
    </p>

    <div style="background:#f8f9fc;border:1px solid #e5e7f0;border-radius:12px;padding:20px 24px;margin-bottom:24px;">
      <p style="margin:0 0 3px;font-size:11px;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em;font-weight:600;">Veicolo</p>
      <p style="margin:0 0 2px;font-size:21px;font-weight:800;color:#1e2250;">${esc(d.marca)} ${esc(d.modello)}</p>
      ${d.alimentazione ? `<p style="margin:0;font-size:13px;color:#6b7280;">${esc(d.alimentazione)}</p>` : ""}
    </div>

    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-collapse:collapse;">
      <tr>
        <td style="width:25%;padding:14px 8px 14px 0;border-bottom:1px solid #f1f3f9;vertical-align:top;">
          <p style="margin:0;font-size:10px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;">Durata</p>
          <p style="margin:5px 0 0;font-size:17px;font-weight:700;color:#1e2250;">${d.durata} mesi</p>
        </td>
        <td style="width:25%;padding:14px 8px;border-bottom:1px solid #f1f3f9;vertical-align:top;">
          <p style="margin:0;font-size:10px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;">Km/anno</p>
          <p style="margin:5px 0 0;font-size:17px;font-weight:700;color:#1e2250;">${fmt(d.kmAnnui)}</p>
        </td>
        <td style="width:25%;padding:14px 8px;border-bottom:1px solid #f1f3f9;vertical-align:top;">
          <p style="margin:0;font-size:10px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;">Anticipo</p>
          <p style="margin:5px 0 0;font-size:17px;font-weight:700;color:#1e2250;">${anticipoLabel}</p>
        </td>
        <td style="width:25%;padding:14px 0 14px 8px;border-bottom:1px solid #f1f3f9;vertical-align:top;text-align:right;">
          <p style="margin:0;font-size:10px;color:#9ca3af;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;">Canone mensile</p>
          <p style="margin:5px 0 0;font-size:24px;font-weight:800;color:#F96209;">
            €${fmt(d.canone)}<span style="font-size:13px;font-weight:500;color:#9ca3af;">/mese</span>
          </p>
        </td>
      </tr>
    </table>

    ${d.noteCliente ? `
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;margin-bottom:24px;">
      <p style="margin:0 0 6px;font-size:10px;color:#f97316;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;">Note dal team</p>
      <p style="margin:0;font-size:14px;color:#374151;line-height:1.65;">${esc(d.noteCliente)}</p>
    </div>` : ""}

    <div style="text-align:center;margin:32px 0 24px;">
      <a href="${d.areaLink}" style="display:inline-block;background:#F96209;color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:10px;font-size:15px;font-weight:700;">
        Vedi il preventivo &rarr;
      </a>
    </div>

    <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;line-height:1.7;">
      Oppure copia questo link nel browser:<br/>
      <a href="${d.areaLink}" style="color:#2F3589;word-break:break-all;font-size:12px;">${d.areaLink}</a>
    </p>
  </td></tr>

  <tr><td style="background:#f8f9fc;border:1px solid #e5e7f0;border-top:none;border-radius:0 0 16px 16px;padding:18px 36px;text-align:center;">
    <p style="margin:0 0 3px;font-size:12px;color:#9ca3af;">
      Pratica <strong style="color:#374151;">${esc(d.codice)}</strong>
    </p>
    <p style="margin:0;font-size:12px;color:#9ca3af;">
      Domande? Scrivici a <a href="mailto:info@nolosubito.it" style="color:#2F3589;text-decoration:none;">info@nolosubito.it</a>
    </p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}
