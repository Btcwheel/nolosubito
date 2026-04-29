import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'https://nolosubito.quixel.it';
const OUT  = '.jez/artifacts/screenshots';
mkdirSync(OUT, { recursive: true });

const pages = [
  { name: '02-offers-business',  url: '/offers' },
  { name: '03-private-offers',   url: '/private-offers' },
  { name: '04-commercial',       url: '/commercial' },
  { name: '05-green',            url: '/green' },
  { name: '06-fleet',            url: '/fleet' },
  { name: '09-contact',          url: '/contact' },
];

const browser = await chromium.launch();

for (const p of pages) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + p.url, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${p.name}-desktop.png`, fullPage: true });
  await ctx.close();
  console.log('✓', p.name);
}

// Vehicle detail
const vctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const vpage = await vctx.newPage();
await vpage.goto(BASE + '/offers', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
await vpage.waitForTimeout(1500);
const href = await vpage.locator('a[href*="/vehicle/"]').first().getAttribute('href').catch(() => null);
if (href) {
  await vpage.goto(BASE + href, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await vpage.waitForTimeout(1500);
  await vpage.screenshot({ path: `${OUT}/10-vehicle-detail-desktop.png`, fullPage: true });
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mctx.newPage();
  await mp.goto(BASE + href, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await mp.waitForTimeout(1500);
  await mp.screenshot({ path: `${OUT}/10-vehicle-detail-mobile.png`, fullPage: true });
  await mctx.close();
  console.log('✓ vehicle-detail', href);
}
await vctx.close();
await browser.close();
console.log('Done');
