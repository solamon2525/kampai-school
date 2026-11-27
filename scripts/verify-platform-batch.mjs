#!/usr/bin/env node
/**
 * Multi-Subject Platform Batch Browser Verifier
 *
 * Reads `.artifacts/platform-audit/inventory.json` (generating it via `audit-platform-adoption.mjs` if missing),
 * starts a local static HTTP server for `public/`, and runs Playwright at `360x800` and `1280x720` asserting:
 * - HTTP 200 load
 * - Zero `pageerror`s and zero local `console.error`s / `requestfailed`
 * - Non-empty rendered body
 * - Zero horizontal overflow (`document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1`)
 * - Interactive smoke checks on upgraded Wave 1 pilot media and representative media/worksheets
 *
 * Usage:
 *   node scripts/verify-platform-batch.mjs --pilot
 *   node scripts/verify-platform-batch.mjs --archetype vocab-concept [--kind media] [--limit 10]
 *   node scripts/verify-platform-batch.mjs public/games/english/sight-words-media.html ...
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runAudit } from './audit-platform-adoption.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolve(__dirname, '..');
const PUBLIC_ROOT = join(REPO_ROOT, 'public');
const INVENTORY_PATH = join(REPO_ROOT, '.artifacts', 'platform-audit', 'inventory.json');

const PILOT_FILES = [
  'public/games/english/everyday-conversation-p4-media.html',
  'public/games/english/sight-words-media.html',
  'public/games/career/waste-sort-media.html',
];

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

const VIEWPORTS = [
  { name: 'phone', width: 360, height: 800 },
  { name: 'desktop', width: 1280, height: 720 },
];

function parseArgs(argv) {
  const opts = {
    pilot: false,
    archetype: null,
    kind: null,
    limit: null,
    reportPath: join(REPO_ROOT, '.artifacts', 'platform-audit', 'batch-verify.json'),
    files: [],
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--pilot') {
      opts.pilot = true;
    } else if (arg === '--archetype' && argv[i + 1]) {
      opts.archetype = argv[++i];
    } else if (arg.startsWith('--archetype=')) {
      opts.archetype = arg.slice('--archetype='.length);
    } else if (arg === '--kind' && argv[i + 1]) {
      opts.kind = arg[++i];
    } else if (arg.startsWith('--kind=')) {
      opts.kind = arg.slice('--kind='.length);
    } else if (arg === '--limit' && argv[i + 1]) {
      opts.limit = Number(argv[++i]);
    } else if (arg.startsWith('--limit=')) {
      opts.limit = Number(arg.slice('--limit='.length));
    } else if (arg.startsWith('--report=')) {
      opts.reportPath = resolve(REPO_ROOT, arg.slice('--report='.length));
    } else if (!arg.startsWith('--')) {
      opts.files.push(arg.replaceAll('\\', '/').replace(/^\.\//, ''));
    }
  }
  return opts;
}

function loadInventory() {
  if (!existsSync(INVENTORY_PATH)) {
    console.log('inventory.json not found — running audit-platform-adoption.mjs...');
    runAudit();
  }
  return JSON.parse(readFileSync(INVENTORY_PATH, 'utf8'));
}

function selectTargets(opts, inventory) {
  const items = Array.isArray(inventory?.items) ? inventory.items : [];

  if (opts.files.length > 0) {
    return [...new Set(opts.files)];
  }

  if (opts.archetype) {
    let matched = items.filter((item) => item.archetype === opts.archetype);
    if (opts.kind) matched = matched.filter((item) => item.kind === opts.kind);
    if (Number.isFinite(opts.limit) && opts.limit > 0) matched = matched.slice(0, opts.limit);
    return matched.map((item) => item.file);
  }

  // Default or --pilot: Wave 1 pilots + representative media & worksheets across all 9 subjects
  const selected = new Set(PILOT_FILES);
  const subjects = ['arts', 'career', 'english', 'health', 'math', 'science', 'social', 'tech', 'thai'];

  for (const subject of subjects) {
    const subjMedia = items.find((i) => i.subject === subject && i.kind === 'media' && !selected.has(i.file));
    if (subjMedia) selected.add(subjMedia.file);

    const subjWs = items.find((i) => i.subject === subject && i.kind === 'worksheet' && !selected.has(i.file));
    if (subjWs) selected.add(subjWs.file);
  }

  let list = [...selected];
  if (Number.isFinite(opts.limit) && opts.limit > 0) list = list.slice(0, opts.limit);
  return list;
}

function createStaticServer() {
  return createServer((req, res) => {
    const reqUrl = new URL(req.url || '/', 'http://127.0.0.1');
    let relPath = decodeURIComponent(reqUrl.pathname).replace(/^\/+/, '');
    if (!relPath) relPath = 'index.html';
    const normalized = normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
    let filePath = join(PUBLIC_ROOT, normalized);

    if (existsSync(filePath) && statSync(filePath).isDirectory()) {
      filePath = join(filePath, 'index.html');
    }

    if (!filePath.startsWith(PUBLIC_ROOT) || !existsSync(filePath)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not found');
      return;
    }

    const ext = extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    createReadStream(filePath).pipe(res);
  });
}

function isIgnorableExternalConsoleError(text) {
  return /fonts\.googleapis\.com|fonts\.gstatic\.com|ERR_NAME_NOT_RESOLVED|ERR_NETWORK_ACCESS_DENIED|Failed to load resource: net::ERR_/i.test(text);
}

async function runPilotInteractiveChecks(page, relFile, viewport, errors) {
  if (relFile === 'public/games/english/everyday-conversation-p4-media.html') {
    const hasState = await page.evaluate(() => typeof window.EverydayConversationP4?.getState === 'function');
    if (!hasState) errors.push(`[${viewport.name}] missing EverydayConversationP4.getState()`);

    const practiceBtn = page.locator('[data-mode="practice"]').first();
    if (await practiceBtn.count()) {
      await practiceBtn.click();
      await page.waitForTimeout(150);
    }
    const visualBtn = page.locator('[data-mode="visual"]').first();
    if (await visualBtn.count()) {
      await visualBtn.click();
      await page.waitForTimeout(150);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (overflow) errors.push(`[${viewport.name}] horizontal overflow after mode switch`);
    return;
  }

  if (relFile === 'public/games/english/sight-words-media.html') {
    const initCheck = await page.evaluate(() => ({
      hasGetState: typeof window.getState === 'function',
      hasQuiz: Boolean(window.KampaiEngines?.Quiz),
      hasMatch: Boolean(window.KampaiEngines?.ConnectMatch),
      state: typeof window.getState === 'function' ? window.getState() : null,
    }));
    if (!initCheck.hasGetState) errors.push(`[${viewport.name}] missing window.getState()`);
    if (!initCheck.hasQuiz) errors.push(`[${viewport.name}] missing KampaiEngines.Quiz`);
    if (!initCheck.hasMatch) errors.push(`[${viewport.name}] missing KampaiEngines.ConnectMatch`);
    if (initCheck.state?.matchState?.scoreEnabled !== false) errors.push(`[${viewport.name}] ConnectMatch scoreEnabled must be false in media mode`);
    if (initCheck.state?.quizState?.scoreEnabled !== false) errors.push(`[${viewport.name}] Quiz scoreEnabled must be false in media mode`);

    // Test ConnectMatch tab
    await page.locator('.tab-btn[data-tab="match"]').click();
    await page.waitForTimeout(150);
    const leftCards = page.locator('#matchEngineRoot .ke-match-card-left');
    const rightCards = page.locator('#matchEngineRoot .ke-match-card-right');
    if ((await leftCards.count()) < 4 || (await rightCards.count()) < 4) {
      errors.push(`[${viewport.name}] ConnectMatch did not render >=4 pairs`);
    } else {
      await leftCards.first().click();
      await rightCards.first().click();
      await page.waitForTimeout(120);
    }
    const overflowMatch = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (overflowMatch) errors.push(`[${viewport.name}] horizontal overflow in ConnectMatch tab`);

    // Test Quiz tab
    await page.locator('.tab-btn[data-tab="quiz"]').click();
    await page.waitForTimeout(150);
    const quizOpts = page.locator('#quizEngineRoot .ke-option');
    if ((await quizOpts.count()) !== 4) {
      errors.push(`[${viewport.name}] Quiz did not render 4 options`);
    } else {
      await quizOpts.first().click();
      await page.waitForTimeout(120);
      const fbText = await page.locator('#quizEngineRoot .ke-feedback').textContent();
      if (!fbText || !fbText.trim()) errors.push(`[${viewport.name}] Quiz feedback did not update on option click`);
    }
    const overflowQuiz = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (overflowQuiz) errors.push(`[${viewport.name}] horizontal overflow in Quiz tab`);
    return;
  }

  if (relFile === 'public/games/career/waste-sort-media.html') {
    const initCheck = await page.evaluate(() => ({
      hasGetState: typeof window.getState === 'function',
      hasClassify: Boolean(window.KampaiEngines?.ClassifyBucket),
    }));
    if (!initCheck.hasGetState) errors.push(`[${viewport.name}] missing window.getState()`);
    if (!initCheck.hasClassify) errors.push(`[${viewport.name}] missing KampaiEngines.ClassifyBucket`);

    await page.locator('#modeSeg [data-mode="practice"]').click();
    await page.waitForTimeout(150);
    const bucketBtns = page.locator('#classifyEngineRoot .ke-bucket-btn');
    if ((await bucketBtns.count()) !== 4) {
      errors.push(`[${viewport.name}] ClassifyBucket did not render 4 buckets`);
    } else {
      await bucketBtns.first().click();
      await page.waitForTimeout(120);
      const fbText = await page.locator('#classifyEngineRoot .ke-classify-feedback').textContent();
      if (!fbText || !fbText.trim()) errors.push(`[${viewport.name}] ClassifyBucket feedback did not update on bucket click`);
    }
    const classifyState = await page.evaluate(() => window.getState?.().classify);
    if (!classifyState || classifyState.scoreEnabled !== false) {
      errors.push(`[${viewport.name}] ClassifyBucket scoreEnabled must be false in media mode`);
    }
    const overflowPractice = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (overflowPractice) errors.push(`[${viewport.name}] horizontal overflow in ClassifyBucket practice mode`);
    return;
  }

  // Generic smoke check for other media or worksheets
  if (relFile.endsWith('-worksheet.html') || relFile.endsWith('worksheet.html')) {
    const wsCheck = await page.evaluate(() => ({
      hasPages: document.querySelectorAll('#pages > .sheet').length > 0,
    }));
    if (!wsCheck.hasPages) errors.push(`[${viewport.name}] worksheet missing #pages > .sheet`);
    return;
  }

  const practiceToggle = page.locator('[data-mode="practice"]').first();
  if ((await practiceToggle.count()) > 0 && (await practiceToggle.isVisible())) {
    await practiceToggle.click();
    await page.waitForTimeout(150);
    const overflowAfter = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    if (overflowAfter) errors.push(`[${viewport.name}] horizontal overflow after switching to practice`);
  }
}

async function verifyFile(browser, baseUrl, relFile) {
  const absPath = resolve(REPO_ROOT, relFile);
  if (!existsSync(absPath)) {
    return { file: relFile, passed: false, errors: [`File not found: ${relFile}`] };
  }
  const relFromPublic = relative(PUBLIC_ROOT, absPath).replaceAll('\\', '/');
  if (relFromPublic.startsWith('..')) {
    return { file: relFile, passed: false, errors: [`File must live under public/: ${relFile}`] };
  }

  const errors = [];
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height } });
    const page = await context.newPage();

    page.on('pageerror', (err) => {
      errors.push(`[${viewport.name}] pageerror: ${err.message}`);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (!isIgnorableExternalConsoleError(text)) {
          errors.push(`[${viewport.name}] console.error: ${text}`);
        }
      }
    });
    page.on('requestfailed', (req) => {
      const url = req.url();
      if (url.startsWith(baseUrl)) {
        errors.push(`[${viewport.name}] requestfailed: ${url} (${req.failure()?.errorText || 'unknown'})`);
      }
    });

    try {
      const resp = await page.goto(`${baseUrl}/${relFromPublic}`, { waitUntil: 'domcontentloaded', timeout: 20000 });
      if (!resp || resp.status() !== 200) {
        errors.push(`[${viewport.name}] HTTP ${resp ? resp.status() : 'no-response'}`);
      } else {
        await page.waitForTimeout(300);
        const metrics = await page.evaluate(() => ({
          bodyLen: document.body?.innerText?.trim().length || 0,
          scrollWidth: document.documentElement.scrollWidth,
          clientWidth: document.documentElement.clientWidth,
        }));
        if (metrics.bodyLen === 0) {
          errors.push(`[${viewport.name}] blank page (body text length = 0)`);
        }
        if (metrics.scrollWidth > metrics.clientWidth + 1) {
          errors.push(`[${viewport.name}] horizontal overflow (${metrics.scrollWidth} > ${metrics.clientWidth})`);
        }
        await runPilotInteractiveChecks(page, relFile, viewport, errors);
      }
    } catch (err) {
      errors.push(`[${viewport.name}] navigation/runtime error: ${err.message}`);
    } finally {
      await context.close();
    }
  }

  return { file: relFile, passed: errors.length === 0, errors };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const inventory = loadInventory();
  const targets = selectTargets(opts, inventory);

  if (targets.length === 0) {
    console.error('No matching files found for the given filter.');
    process.exit(1);
  }

  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch (err) {
    console.error('Playwright is required. Run: pnpm install && pnpm exec playwright install chromium');
    process.exit(1);
  }

  const server = createStaticServer();
  await new Promise((resolveReady) => server.listen(0, '127.0.0.1', resolveReady));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  console.log(`\n=== Kampai Platform Batch Verification (${targets.length} files @ 360x800 & 1280x720) ===\n`);

  let browser;
  const results = [];
  try {
    browser = await chromium.launch({ headless: true });
    for (const file of targets) {
      const res = await verifyFile(browser, baseUrl, file);
      results.push(res);
      if (res.passed) {
        console.log(`✅ ${res.file}`);
      } else {
        console.log(`❌ ${res.file}`);
        for (const err of res.errors) console.log(`   • ${err}`);
      }
    }
  } finally {
    await browser?.close();
    await new Promise((resolveClose) => server.close(resolveClose));
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - passedCount;

  mkdirSync(dirname(opts.reportPath), { recursive: true });
  writeFileSync(
    opts.reportPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        total: results.length,
        passed: passedCount,
        failed: failedCount,
        results,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`\nPlatform batch verify: ${passedCount}/${results.length} passed`);
  console.log(`Report: ${relative(REPO_ROOT, opts.reportPath).replaceAll('\\', '/')}`);
  process.exit(failedCount > 0 ? 1 : 0);
}

main();
