import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { test, expect } from '@playwright/test';
import { transform } from 'esbuild';

// analyze-preventivo è una Edge Function Deno e non si può importare: si estrae la funzione tra i due marcatori
// del sorgente, si compila e si importa. Se i marcatori spariscono il test lo dice con un errore chiaro.
const SORGENTE = 'supabase/functions/analyze-preventivo/index.ts';

let kmAnnuiDaKmTotali;
test.beforeAll(async () => {
  const src = fs.readFileSync(path.resolve(SORGENTE), 'utf8');
  const blocco = src.match(/\/\/ <km-annui-da-km-totali>([\s\S]*?)\/\/ <\/km-annui-da-km-totali>/);
  if (!blocco) throw new Error(`Marcatori km-annui-da-km-totali non trovati in ${SORGENTE}`);
  const { code } = await transform(`${blocco[1]}\nexport { kmAnnuiDaKmTotali };`, { loader: 'ts', format: 'esm' });
  const outfile = path.resolve('tests/.output/compiled', `kmAnnui.${process.pid}.mjs`);
  fs.mkdirSync(path.dirname(outfile), { recursive: true });
  fs.writeFileSync(outfile, code);
  ({ kmAnnuiDaKmTotali } = await import(pathToFileURL(outfile).href));
});

test.describe('km annui ricavati dai "KM totali" del documento', () => {
  test('caso reale: 120000 km totali in 48 mesi sono 30000 km/anno (il modello scriveva 25000)', () => {
    const testo = 'Consumo: 4.7 litri/mese (84.20833). Km totali: 120000. Pneumatici inclusi: Estivi';
    expect(kmAnnuiDaKmTotali(testo, 48)).toBe(30000);
  });

  test('caso reale: 40000 km totali in 48 mesi sono 10000 km/anno (era salvato 8000)', () => {
    expect(kmAnnuiDaKmTotali('Durata: 48 mesi. KM totali: 40000. Km eccedenti: 0.0600 euro', 48)).toBe(10000);
  });

  test('accetta il formato con separatore delle migliaia', () => {
    expect(kmAnnuiDaKmTotali('KM totali: 90.000', 36)).toBe(30000);
    expect(kmAnnuiDaKmTotali('KM totali 90 000', 36)).toBe(30000);
    expect(kmAnnuiDaKmTotali('Km totali: 45.000', 36)).toBe(15000);
  });

  test('km moto bassi (5000, 8000) non vengono arrotondati', () => {
    expect(kmAnnuiDaKmTotali('Km totali: 20000', 48)).toBe(5000);
    expect(kmAnnuiDaKmTotali('Km totali: 32000', 48)).toBe(8000);
  });

  test('l\'intestazione della tabella senza numero non conta', () => {
    const testo = 'Durata mesi* KM totali Canone mensile Puro noleggio Km eccedenti * Oltre 15% Km totali Entro 15% Km totali';
    expect(kmAnnuiDaKmTotali(testo, 48)).toBeNull();
  });

  test('un prezzo al km come "Km totali 0.122" non è un totale', () => {
    expect(kmAnnuiDaKmTotali('Km totali 0.122 euro', 36)).toBeNull();
  });

  test('senza durata o con durata sotto i 12 mesi non calcola', () => {
    expect(kmAnnuiDaKmTotali('Km totali: 120000', null)).toBeNull();
    expect(kmAnnuiDaKmTotali('Km totali: 120000', 0)).toBeNull();
    expect(kmAnnuiDaKmTotali('Km totali: 120000', 6)).toBeNull();
  });

  test('un risultato non tondo o implausibile viene scartato (si tiene il valore del modello)', () => {
    expect(kmAnnuiDaKmTotali('Km totali: 100000', 36)).toBeNull(); // 33333,33
    expect(kmAnnuiDaKmTotali('Km totali: 1000', 48)).toBeNull();   // 250 km/anno
    expect(kmAnnuiDaKmTotali('Km totali: 900000', 12)).toBeNull(); // 900000 km/anno
  });

  test('testo vuoto o assente', () => {
    expect(kmAnnuiDaKmTotali(null, 48)).toBeNull();
    expect(kmAnnuiDaKmTotali('', 48)).toBeNull();
    expect(kmAnnuiDaKmTotali('nessun dato chilometrico', 48)).toBeNull();
  });
});
