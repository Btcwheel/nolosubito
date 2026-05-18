/// <reference lib="deno.ns" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import nodemailer from "npm:nodemailer@6.9.13";

const SMTP_HOST        = Deno.env.get("SMTP_HOST")        ?? "";
const SMTP_PORT        = parseInt(Deno.env.get("SMTP_PORT") ?? "587");
const SMTP_USER        = Deno.env.get("SMTP_USER")        ?? "";
const SMTP_PASS        = Deno.env.get("SMTP_PASS")        ?? "";
const SMTP_FROM        = Deno.env.get("SMTP_FROM")        ?? SMTP_USER;
const SMTP_SECURE      = Deno.env.get("SMTP_SECURE")      === "true";
const BACKOFFICE_EMAIL = Deno.env.get("BACKOFFICE_EMAIL") ?? "info@nolosubito.it";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return new Response(JSON.stringify({ ok: true, skipped: true, reason: "SMTP not configured" }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const { clienteNome, clienteEmail, pdfBase64, veicolo, canone } = await req.json() as any;

  if (!clienteEmail || !pdfBase64) {
    return new Response(JSON.stringify({ error: "clienteEmail e pdfBase64 sono obbligatori" }), {
      status: 400,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: false },
  });

  const nomeDisplay = clienteNome || "Cliente";
  const veicoloDisplay = veicolo || "veicolo selezionato";
  const canoneDisplay = canone ? `€ ${Number(canone).toLocaleString("it-IT")}/mese` : "";

  const html = `<!DOCTYPE html>
<html lang="it">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f1f3f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f3f9;padding:32px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
  <tr><td style="background:#2F3589;border-radius:16px 16px 0 0;padding:26px 32px;">
    <p style="margin:0;color:#fff;font-size:20px;font-weight:700;">Nolosubito</p>
    <p style="margin:4px 0 0;color:rgba(255,255,255,0.55);font-size:12px;">Noleggio a Lungo Termine</p>
  </td></tr>
  <tr><td style="background:#fff;padding:32px;">
    <p style="margin:0 0 20px;font-size:15px;color:#374151;line-height:1.7;">
      Ciao <strong>${nomeDisplay}</strong>,<br/>
      in allegato trovi il preventivo personalizzato per il <strong>${veicoloDisplay}</strong>${canoneDisplay ? ` con un canone mensile di <strong style="color:#F96209;">${canoneDisplay}</strong>` : ""}.
    </p>
    <p style="margin:0 0 20px;font-size:14px;color:#6b7280;line-height:1.7;">
      Per qualsiasi domanda o per procedere con la pratica, rispondi a questa email o contattaci direttamente.
    </p>
    <div style="background:#f8f9fc;border-radius:10px;padding:16px 20px;">
      <p style="margin:0;font-size:13px;color:#374151;">
        📎 Il preventivo è allegato a questa email in formato PDF.
      </p>
    </div>
  </td></tr>
  <tr><td style="background:#f8f9fc;border:1px solid #e5e7f0;border-top:none;border-radius:0 0 16px 16px;padding:16px 32px;text-align:center;">
    <p style="margin:0;font-size:12px;color:#9ca3af;">
      Nolosubito · <a href="mailto:info@nolosubito.it" style="color:#2F3589;text-decoration:none;">info@nolosubito.it</a> · nolosubito.it
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const filename = `Nolosubito_${(veicoloDisplay).replace(/\s+/g, "_")}.pdf`;

  try {
    await transporter.sendMail({
      from: SMTP_FROM,
      to: clienteEmail,
      bcc: BACKOFFICE_EMAIL,
      subject: `Il tuo preventivo Nolosubito — ${veicoloDisplay}`,
      html,
      attachments: [{
        filename,
        content: pdfBase64,
        encoding: "base64",
        contentType: "application/pdf",
      }],
    });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
