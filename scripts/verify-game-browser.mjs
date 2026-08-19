#!/usr/bin/env node

import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = join(repoRoot, 'public');
const cliArgs = process.argv.slice(2);
const targetArg = cliArgs.find((arg) => !arg.startsWith('--'));
const reportArg = cliArgs.find((arg) => arg.startsWith('--report='));
const reportPath = resolve(repoRoot, reportArg ? reportArg.slice('--report='.length) : '.artifacts/game-verify/browser.json');
const artifactDir = dirname(reportPath);

if (!targetArg) fail('Usage: pnpm verify:game:browser -- <game-path>');

let targetPath = resolve(repoRoot, targetArg);
if (!existsSync(targetPath)) fail(`ไม่พบไฟล์หรือโฟลเดอร์: ${targetArg}`);
if (statSync(targetPath).isDirectory()) targetPath = join(targetPath, 'index.html');
if (!existsSync(targetPath) || extname(targetPath).toLowerCase() !== '.html') fail(`target ต้องเป็นเกม HTML: ${targetArg}`);
if (!targetPath.startsWith(publicRoot)) fail('browser verifier รองรับเฉพาะไฟล์ใต้ public/');

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  fail('ไม่พบ Playwright — รัน pnpm install แล้ว pnpm exec playwright install chromium');
}

mkdirSync(artifactDir, { recursive: true });
const gameUrl = '/' + relative(publicRoot, targetPath).replaceAll('\\', '/');
const server = createStaticServer();
await new Promise((resolveReady) => server.listen(0, '127.0.0.1', resolveReady));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;
const viewports = [
  { name: 'phone', width: 360, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 720 },
];
const results = [];
let browser;

try {
  browser = await chromium.launch({ headless: true });
  for (const viewport of viewports) results.push(await verifyViewport(browser, viewport));
} catch (error) {
  results.push({ viewport: 'runner', passed: false, errors: [error.stack || error.message] });
} finally {
  await browser?.close();
  await new Promise((resolveClose) => server.close(resolveClose));
}

const failed = results.some((result) => !result.passed);
const report = {
  schemaVersion: 1,
  tool: 'verify-game-browser',
  target: targetArg,
  gameUrl,
  status: failed ? 'failed' : 'passed',
  results,
  generatedAt: new Date().toISOString(),
};
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
console.log(JSON.stringify(report, null, 2));
process.exit(failed ? 1 : 0);

async function verifyViewport(browserInstance, viewport) {
  const errors = [];
  const context = await browserInstance.newContext({ viewport });
  await context.grantPermissions(['camera'], { origin: baseUrl });
  await context.addInitScript(() => {
    const track = { enabled: true, readyState: 'live', stop() { this.readyState = 'ended'; }, getSettings() { return { width: 640, height: 480 }; } };
    const stream = { active: true, getTracks: () => [track], getVideoTracks: () => [track] };
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia: async () => stream, enumerateDevices: async () => [{ kind: 'videoinput', deviceId: 'kampai-ci-camera' }] },
    });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: (query) => ({ matches: query.includes('prefers-reduced-motion'), media: query, addEventListener() {}, removeEventListener() {} }),
    });
  });
  await context.tracing.start({ screenshots: true, snapshots: true });
  const page = await context.newPage();
  page.on('console', (message) => {
    if (message.type() === 'error' && !/^Failed to load resource: net::ERR_NETWORK_ACCESS_DENIED/.test(message.text())) {
      errors.push(`console: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  page.on('requestfailed', (request) => {
    if (['document', 'script', 'xhr', 'fetch'].includes(request.resourceType())) {
      errors.push(`requestfailed: ${request.url()} (${request.failure()?.errorText || 'unknown'})`);
    }
  });

  try {
    await page.goto(`${baseUrl}/__kampai_harness?game=${encodeURIComponent(gameUrl)}`, { waitUntil: 'domcontentloaded' });
    const iframe = await page.locator('#game').elementHandle();
    const frame = await iframe?.contentFrame();
    if (!frame) throw new Error('ไม่พบ game iframe');
    await frame.waitForLoadState('domcontentloaded');
    await frame.waitForTimeout(500);

    const metrics = await frame.evaluate(() => ({
      horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      bodyText: document.body?.innerText?.trim().length || 0,
      hooks: [...document.querySelectorAll('[data-kampai-action]')].map((node) => node.getAttribute('data-kampai-action')),
      smallControls: [...document.querySelectorAll('button, [role="button"], a')]
        .filter((node) => {
          const rect = node.getBoundingClientRect();
          const style = getComputedStyle(node);
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44);
        }).map((node) => {
          const rect = node.getBoundingClientRect();
          return { label: node.id || node.getAttribute('aria-label') || node.textContent?.trim().slice(0, 30), width: Math.round(rect.width), height: Math.round(rect.height) };
        }),
    }));
    if (metrics.horizontalOverflow) errors.push('horizontal overflow');
    if (metrics.bodyText === 0) errors.push('เกม render เป็นหน้าว่าง');
    if (metrics.smallControls.length > 0) errors.push(`พบ controls เล็กกว่า 44px: ${JSON.stringify(metrics.smallControls)}`);
    for (const hook of ['start', 'finish-test', 'restart']) {
      if (!metrics.hooks.includes(hook)) errors.push(`ขาด data-kampai-action="${hook}"`);
    }

    if (errors.length === 0) {
      await clickHook(frame, 'start');
      await clickHook(frame, 'finish-test');
      await waitForSubmissions(page, 1);
      await clickHook(frame, 'restart');
      await clickHook(frame, 'finish-test');
      await waitForSubmissions(page, 2);
      const submissions = await page.evaluate(() => window.__kampaiMessages.filter((message) => message?.type === 'gameEnd').length);
      if (submissions !== 2) errors.push(`คาดว่า submit 2 รอบ แต่ได้ ${submissions}`);
    }

    const screenshot = join(artifactDir, `browser-${viewport.name}.png`);
    await page.screenshot({ path: screenshot, fullPage: true });
  } catch (error) {
    errors.push(error.message);
  }

  const trace = join(artifactDir, `trace-${viewport.name}.zip`);
  await context.tracing.stop({ path: trace });
  await context.close();
  return { viewport: viewport.name, width: viewport.width, height: viewport.height, passed: errors.length === 0, errors };
}

async function clickHook(frame, hook) {
  const locator = frame.locator(`[data-kampai-action="${hook}"]`).first();
  await locator.waitFor({ state: 'attached', timeout: 3000 });
  await locator.evaluate((node) => node.click());
}

async function waitForSubmissions(page, count) {
  await page.waitForFunction((expected) => window.__kampaiMessages.filter((message) => message?.type === 'gameEnd').length >= expected, count, { timeout: 5000 });
}

function createStaticServer() {
  return createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.pathname === '/__kampai_harness') {
      const requestedGame = url.searchParams.get('game') || '';
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      response.end(`<!doctype html><html><body style="margin:0"><iframe id="game" style="border:0;width:100vw;height:100vh" src="${escapeHtml(requestedGame)}?embed=1&kampai_test=1"></iframe><script>window.__kampaiMessages=[];addEventListener('message',function(e){window.__kampaiMessages.push(e.data);});document.getElementById('game').addEventListener('load',function(){this.contentWindow.postMessage({type:'init',studentCode:'CI001',student:{id:'ci-student',displayName:'ผู้เล่นทดสอบ'},stats:{playsCount:0,personalBest:0,totalXp:0,level:1},leaderboard:[]},'*');});</script></body></html>`);
      return;
    }
    const decoded = decodeURIComponent(url.pathname).replace(/^\/+/, '');
    const file = normalize(join(publicRoot, decoded));
    if (!file.startsWith(publicRoot) || !existsSync(file) || statSync(file).isDirectory()) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.writeHead(200, { 'content-type': mime(extname(file)) });
    createReadStream(file).pipe(response);
  });
}

function mime(extension) {
  return ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg' })[extension.toLowerCase()] || 'application/octet-stream';
}

function escapeHtml(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}
