#!/bin/bash
# Run from repo root: ./scripts/update-screenshots.sh
# Captures fresh screenshots of all projects
set -e

echo "=== Capturing MegaBonk screenshots ==="
# MegaBonk default view (public, via microlink API)
curl -L "https://api.microlink.io/?url=https://neuhard.dev/megabonk/&screenshot=true&meta=false&embed=screenshot.url&waitForTimeout=5000" \
  -o src/images/megabonk-1.png
echo "Saved megabonk-1.png"

# MegaBonk scrolled (via puppeteer)
node -e "
const puppeteer = require('puppeteer');
(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  await page.goto('https://neuhard.dev/megabonk/', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 5000));
  await page.evaluate(() => window.scrollBy(0, 500));
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: 'src/images/megabonk-2.png' });
  await browser.close();
  console.log('Saved megabonk-2.png');
})();
"

echo ""
echo "=== Capturing VoltTracker screenshots ==="
node scripts/capture-volttracker.js

echo ""
echo "=== Done! ==="
ls -la src/images/*.png
