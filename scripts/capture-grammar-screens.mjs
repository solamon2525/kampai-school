import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';
import { chromium } from 'playwright';

const root = resolve('public');
const server = createServer((request, response) => {
  const file = normalize(join(root, decodeURIComponent(new URL(request.url, 'http://localhost').pathname)));
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) return response.writeHead(404).end();
  const mime = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.webp': 'image/webp',
    '.png': 'image/png',
    '.svg': 'image/svg+xml'
  };
  response.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(response);
});

await new Promise(resolveReady => server.listen(0, '127.0.0.1', resolveReady));
const base = `http://127.0.0.1:${server.address().port}`;

const browser = await chromium.launch();
try {
  // Desktop
  const pageDesk = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await pageDesk.goto(`${base}/games/english/grammar-vocab-media.html`);
  await pageDesk.waitForTimeout(400);
  await pageDesk.screenshot({ path: 'output/grammar-studio-desktop.png' });

  // Switch to Storyboard tab
  await pageDesk.click('.tab-btn[data-tab="story"]');
  await pageDesk.waitForTimeout(400);
  await pageDesk.screenshot({ path: 'output/grammar-storyboard-desktop.png' });

  // Mobile
  const pageMob = await browser.newPage({ viewport: { width: 360, height: 800 }, isMobile: true });
  await pageMob.goto(`${base}/games/english/grammar-vocab-media.html`);
  await pageMob.waitForTimeout(400);
  await pageMob.screenshot({ path: 'output/grammar-studio-mobile.png' });

  await pageMob.click('.tab-btn[data-tab="story"]');
  await pageMob.waitForTimeout(400);
  await pageMob.screenshot({ path: 'output/grammar-storyboard-mobile.png' });

  console.log('Screenshots captured successfully in output/');
} finally {
  await browser.close();
  server.close();
}
