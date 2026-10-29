import { defineConfig } from '@playwright/test';

// Test unitari su codice puro (nessun browser, nessun server). Esegui con: npm run test:unit
export default defineConfig({
  testDir: './tests/unit',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: 'list',
});
