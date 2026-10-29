import { defineConfig, devices } from '@playwright/test';

// Contro cosa girano i test:
//  - senza variabili: avvia il server locale (npm run dev) su E2E_PORT (default 4173)
//  - E2E_BASE_URL=https://<deploy-preview>.vercel.app: usa quel deploy, nessun server locale
// Non puntare mai i test sul dominio di produzione.
const baseURL = process.env.E2E_BASE_URL || `http://localhost:${process.env.E2E_PORT || 4173}`;
const useLocalServer = !process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: './tests/e2e',
  outputDir: './tests/.output',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never', outputFolder: 'tests/.report' }]] : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: useLocalServer
    ? {
        command: `npm run dev -- --port ${process.env.E2E_PORT || 4173}`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
