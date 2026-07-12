/**
 * Capture Satellite Processor screenshots from a local instance.
 * Usage: node scripts/capture-satellite.js [baseUrl]
 * Defaults to http://localhost:8000 (the Docker stack's API/frontend port).
 * Uses Playwright (already a devDependency) rather than puppeteer.
 */
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const baseUrl = process.argv[2] || 'http://localhost:8000';
  const imgDir = path.join(__dirname, '..', 'src', 'images');
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });

  console.log(`Capturing Satellite Processor dashboard from ${baseUrl}...`);
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(imgDir, 'satellite-1.png') });
  console.log('Saved satellite-1.png');

  await page.evaluate(() => window.scrollBy(0, 600));
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(imgDir, 'satellite-2.png') });
  console.log('Saved satellite-2.png');

  await browser.close();
  console.log('Done! Convert with: cwebp -q 80 src/images/satellite-1.png -o src/images/satellite-1.webp');
})();
