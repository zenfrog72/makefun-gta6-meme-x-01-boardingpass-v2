// Render concept1 v2 (HTML -> 1600x1600 PNG) plus a 480x480 feed-size preview.
import puppeteer from 'puppeteer';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = path.join(dir, 'concept1_v2.html');
const pngPath = path.join(dir, 'concept1_boardingpass_v2.png');
const smallPath = path.join(dir, 'concept1_boardingpass_v2_small.png');

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb'],
});

// full-size render
{
  const page = await browser.newPage();
  await page.setViewport({ width: 1600, height: 1600, deviceScaleFactor: 1 });
  await page.goto('file://' + htmlPath, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 500));
  await page.screenshot({ path: pngPath });
  console.log('wrote', pngPath);
  await page.close();
}

// 480px preview: load a small on-disk page that shows the full PNG scaled down
{
  const fs = await import('node:fs');
  const previewPath = path.join(dir, 'preview_c1v2.html');
  fs.writeFileSync(
    previewPath,
    `<html><body style="margin:0"><img src="file://${pngPath}" width="480" height="480"></body></html>`
  );
  const page = await browser.newPage();
  await page.setViewport({ width: 480, height: 480, deviceScaleFactor: 1 });
  await page.goto('file://' + previewPath, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 300));
  await page.screenshot({ path: smallPath });
  console.log('wrote', smallPath);
  await page.close();
}

await browser.close();
