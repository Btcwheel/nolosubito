const { chromium } = require('../node_modules/playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch();
  const fp = path.resolve(__dirname, 'artifacts/mockup-homepage.html').split('\\').join('/');
  const url = 'file:///' + fp;

  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.waitForTimeout(2500);
  await page.screenshot({ path: path.resolve(__dirname, 'artifacts/mockup-preview-desktop.png'), fullPage: true });
  await ctx.close();

  const mctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mp = await mctx.newPage();
  await mp.goto(url);
  await mp.waitForTimeout(2500);
  await mp.screenshot({ path: path.resolve(__dirname, 'artifacts/mockup-preview-mobile.png'), fullPage: true });
  await mctx.close();

  await browser.close();
  console.log('done');
})();
