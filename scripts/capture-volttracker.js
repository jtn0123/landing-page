const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  const imgDir = path.join(__dirname, '..', 'src', 'images');

  // Screenshot 1: Dashboard
  console.log('Capturing VoltTracker dashboard...');
  await page.goto('http://localhost:8080', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await new Promise(r => setTimeout(r, 5000));
  await page.screenshot({ path: path.join(imgDir, 'volttracker-1.png') });
  console.log('Saved volttracker-1.png');

  // Screenshot 2: Scroll down
  console.log('Capturing VoltTracker scrolled...');
  await page.evaluate(() => window.scrollBy(0, 600));
  await new Promise(r => setTimeout(r, 2000));
  await page.screenshot({ path: path.join(imgDir, 'volttracker-2.png') });
  console.log('Saved volttracker-2.png');

  // Screenshot 3: Try /map
  console.log('Trying /map...');
  try {
    await page.goto('http://localhost:8080/map', { waitUntil: 'domcontentloaded', timeout: 10000 });
    await new Promise(r => setTimeout(r, 5000));
    await page.screenshot({ path: path.join(imgDir, 'volttracker-3.png') });
    console.log('Saved volttracker-3.png');
  } catch (e) {
    console.log('No /map route, skipping:', e.message);
  }

  await browser.close();
  console.log('Done!');
})();
