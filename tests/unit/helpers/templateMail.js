import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { transform } from 'esbuild';

// send-preventivo-email è una Edge Function Deno: non si può importare (fa partire il server e usa URL remoti).
// Qui si estraggono dal sorgente solo le costanti dei contatti e le funzioni del template (da "function fmt" in poi),
// si compilano e si importano. Il file di produzione non viene toccato; se i marcatori cambiano il test lo dice.
const SORGENTE = 'supabase/functions/send-preventivo-email/index.ts';

export async function caricaTemplateMail() {
  const src = fs.readFileSync(path.resolve(SORGENTE), 'utf8').replace(/\r\n/g, '\n');

  const costanti = src.match(/const WHATSAPP_NUMBER[\s\S]*?const PHONE_LABEL[^\n]*\n/);
  const inizioTemplate = src.indexOf('function fmt(');
  if (!costanti || inizioTemplate === -1) {
    throw new Error(`Struttura di ${SORGENTE} cambiata: non trovo le costanti dei contatti o "function fmt(". Aggiorna tests/unit/helpers/templateMail.js`);
  }

  const codice = `${costanti[0]}\n${src.slice(inizioTemplate)}\nexport { buildEmail, buildBackofficeNotifica };\n`;
  const { code } = await transform(codice, { loader: 'ts', format: 'esm' });

  const outfile = path.resolve('tests/.output/compiled', `templateMail.${process.pid}.mjs`);
  fs.mkdirSync(path.dirname(outfile), { recursive: true });
  fs.writeFileSync(outfile, code);
  return import(pathToFileURL(outfile).href);
}
