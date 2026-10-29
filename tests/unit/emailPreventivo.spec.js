import { test, expect } from '@playwright/test';
import { caricaTemplateMail } from './helpers/templateMail.js';

const DATI = {
  nome: 'Mario Rossi',
  codice: 'NS-2026-000123',
  marca: 'Kia',
  modello: 'Picanto',
  alimentazione: 'Benzina',
  durata: 48,
  kmAnnui: 10000,
  anticipo: 0,
  canone: 249,
  noteCliente: 'Vi chiamo domani mattina per la consegna',
  areaLink: 'https://nolosubito.it/mia-pratica?email=mario%40example.it',
};

let buildEmail;
test.beforeAll(async () => {
  ({ buildEmail } = await caricaTemplateMail());
});

test.describe('Mail del preventivo al cliente', () => {
  test('contiene la nota per il cliente nel corpo', () => {
    const html = buildEmail(DATI);
    expect(html).toContain('Note dal team');
    expect(html).toContain('Vi chiamo domani mattina per la consegna');
  });

  test('senza nota il blocco "Note dal team" non compare', () => {
    expect(buildEmail({ ...DATI, noteCliente: null })).not.toContain('Note dal team');
    expect(buildEmail({ ...DATI, noteCliente: '' })).not.toContain('Note dal team');
  });

  test('la nota è protetta da HTML (nessuna iniezione)', () => {
    const html = buildEmail({ ...DATI, noteCliente: '<script>alert(1)</script> "x" & y' });
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  test('ha il pulsante WhatsApp con il numero giusto e il messaggio precompilato', () => {
    const html = buildEmail(DATI);
    expect(html).toContain('Chatta su WhatsApp');
    const link = html.match(/href="(https:\/\/wa\.me\/[^"]+)"/)?.[1];
    expect(link, 'link WhatsApp presente').toBeTruthy();
    const url = new URL(link);
    expect(url.pathname).toBe('/393454300936');
    const testo = url.searchParams.get('text');
    expect(testo).toContain('Kia Picanto');
    expect(testo).toContain('NS-2026-000123');
  });

  test('ha il pulsante Chiama con il fisso e gli orari', () => {
    const html = buildEmail(DATI);
    expect(html).toContain('Chiama ora');
    expect(html).toContain('href="tel:+390640049490"');
    expect(html).toContain('06 4004 9490');
    expect(html).toMatch(/Lun&ndash;Ven 9:00&ndash;18:00/);
  });

  test('il link all\'area personale è presente (pulsante e testo)', () => {
    const html = buildEmail(DATI);
    expect(html.split(DATI.areaLink).length - 1).toBeGreaterThanOrEqual(2);
    expect(html).toContain('Vedi il preventivo');
  });

  test('mostra i dati economici: canone, durata, km, anticipo', () => {
    const html = buildEmail(DATI);
    expect(html).toContain('€249');
    expect(html).toContain('48 mesi');
    expect(html).toContain('Senza anticipo');
    // Il punto delle migliaia dipende dai dati locali del runtime (Node scrive 5000, altri 5.000): il test li accetta entrambi
    expect(buildEmail({ ...DATI, anticipo: 5000 })).toMatch(/€5\.?000/);
  });
});
