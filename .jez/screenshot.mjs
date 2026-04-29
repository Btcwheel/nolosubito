import { chromium } from 'playwright';
import { mkdirSync } from 'fs';

const BASE = 'https://nolosubito.quixel.it';
const OUT  = '.jez/artifacts/screenshots';
mkdirSync(OUT, { recursive: true });

const pages = [
  { name: '01-homepage',        url: '/' },
  { name: '02-business-offers', url: '/business' },
  { name: '03-private-offers',  url: '/privati' },
  { name: '04-fleet-offers',    url: '/fleet' },
  { name: '05-green',           url: '/green' },
  { name: '06-usato',           url: '/usato' },
  { name: '07-news',            url: '/news' },
  { name: '08-contact',         url: '/contatti' },
];

const browser = await chromium.launch();

for (const p of pages) {
  // Desktop
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + p.url, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/${p.name}-desktop.png`, fullPage: true });
  await ctx.close();

  // Mobile
  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mpage = await mctx.newPage();
  await mpage.goto(BASE + p.url, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await mpage.waitForTimeout(1500);
  await mpage.screenshot({ path: `${OUT}/${p.name}-mobile.png`, fullPage: true });
  await mctx.close();

  console.log('✓', p.name);
}

// Try vehicle detail
const vctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const vpage = await vctx.newPage();
await vpage.goto(BASE + '/business', { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
await vpage.waitForTimeout(1500);
const firstCard = vpage.locator('a[href*="/vehicle/"]').first();
const href = await firstCard.getAttribute('href').catch(() => null);
if (href) {
  await vpage.goto(BASE + href, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => {});
  await vpage.waitForTimeout(1500);
  await vpage.screenshot({ path: `${OUT}/09-vehicle-detail-desktop.png`, fullPage: true });
  console.log('✓ vehicle-detail');
}
await vctx.close();

await browser.close();
console.log('Done');
