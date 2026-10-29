import { test, expect } from '@playwright/test';

// Smoke test della Fase 0: verifica solo che l'infrastruttura giri e che le pagine
// pubbliche principali si carichino senza errori JavaScript. I test sul preventivo
// (Fase 1) stanno in file separati.

const PAGINE = ['/', '/offers', '/private-offers', '/moto', '/news', '/contact', '/privacy'];

for (const url of PAGINE) {
  test(`si carica senza errori JS: ${url}`, async ({ page }) => {
    const erroriJs = [];
    page.on('pageerror', (e) => erroriJs.push(e.message));

    const risposta = await page.goto(url);

    expect(risposta?.status(), `stato HTTP di ${url}`).toBeLessThan(400);
    await expect(page.locator('body')).not.toBeEmpty();
    expect(erroriJs, `errori JS su ${url}`).toEqual([]);
  });
}
