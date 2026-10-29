import path from 'node:path';
import { createElement } from 'react';
import { test, expect } from '@playwright/test';
import { importaJsx } from './helpers/compilaJsx.js';

// Il componente legge i font da FONT_BASE_PATH quando gira fuori dal browser (vedi PreventivoPdfDoc.jsx).
// Va impostato prima di importarlo.
process.env.FONT_BASE_PATH = path.resolve('public');

const NOTA_CLIENTE = 'NOTA-RISERVATA-XYZ123 chiamare dopo le 18';

const SERVIZI_BASE = [
  { codice: 'RCA', originale: 'R.C.A. Responsabilità Civile' },
  { codice: 'DANNI', originale: 'Copertura Danni', penale: '500' },
  { codice: 'FURTO_INCENDIO', originale: 'Incendio e Furto', penale: '10' },
  { originale: 'Manutenzione Ordinaria e Straordinaria' },
  { originale: 'Soccorso Stradale' },
  { originale: 'Cristalli' },
  { originale: 'Gestione Multe' },
  { originale: 'Gestione Sinistri' },
];

function preventivo(extra = {}) {
  return {
    id: 'test-0001',
    veicolo_marca: 'Kia',
    veicolo_modello: 'Picanto',
    veicolo_versione: '1.0 12V Urban',
    durata_mesi: 48,
    km_annui: 10000,
    anticipo: 0,
    canone_mensile: 249,
    canone_finale: 249,
    servizi: SERVIZI_BASE,
    note_cliente: NOTA_CLIENTE,
    note_operative: '',
    ...extra,
  };
}

async function generaPdf(prev) {
  const { pdf } = await import('@react-pdf/renderer');
  const { PreventivoPdfDoc } = await importaJsx('src/lib/PreventivoPdfDoc.jsx');
  const stream = await pdf(createElement(PreventivoPdfDoc, { prev, clienteNome: 'Mario Rossi' })).toBuffer();
  const chunks = [];
  for await (const c of stream) chunks.push(c);
  return Buffer.concat(chunks);
}

async function leggiPdf(buffer) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), useSystemFonts: true }).promise;
  const pagine = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    pagine.push(content.items.map((it) => it.str).join(' '));
  }
  return pagine;
}

test.describe('PDF del preventivo', () => {
  test.setTimeout(60_000);

  test('la nota per il cliente non compare mai nel PDF', async () => {
    const pagine = await leggiPdf(await generaPdf(preventivo()));
    const testo = pagine.join('\n');
    expect(testo).not.toContain('NOTA-RISERVATA-XYZ123');
    expect(testo).not.toContain('chiamare dopo le 18');
  });

  test('il PDF contiene i dati del veicolo e il servizio Copertura Danni con penale', async () => {
    const testo = (await leggiPdf(await generaPdf(preventivo()))).join('\n');
    expect(testo).toContain('Picanto');
    expect(testo).toContain('Copertura Danni');
    expect(testo).toMatch(/Penale\s*€\s*500/);
  });

  test('Furto e Incendio mostra la percentuale di penale', async () => {
    const testo = (await leggiPdf(await generaPdf(preventivo()))).join('\n');
    expect(testo).toContain('Furto e Incendio');
    expect(testo).toMatch(/Penale\s*10\s*%/);
  });

  test('con molti servizi la prima pagina non resta vuota', async () => {
    const molti = [
      ...SERVIZI_BASE,
      { originale: 'Pneumatici' },
      { originale: 'Tassa di Proprietà' },
      { originale: 'Auto Sostitutiva' },
      { originale: 'Telematica' },
      { originale: 'Infortuni Conducente' },
      { originale: 'Tutela Legale' },
      { originale: 'Consegna del Veicolo' },
      { originale: 'Eventi Atmosferici' },
      { originale: 'Immatricolazione' },
    ];
    const pagine = await leggiPdf(await generaPdf(preventivo({ servizi: molti })));
    expect(pagine.length).toBeLessThanOrEqual(3);
    // La pagina 1 deve avere contenuto oltre alla testata: almeno veicolo e un servizio
    expect(pagine[0]).toContain('Picanto');
    expect(pagine[0]).toContain('Copertura Danni');
  });
});
