#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import sharp from 'sharp';
import { chromium } from 'playwright';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = join(repoRoot, 'public');
const args = parseArgs(process.argv.slice(2));
if (!['media', 'worksheet'].includes(args.kind) || !args.before || !args.after) {
  fail('Usage: pnpm compare:learning-artifact -- --kind media|worksheet --before <path|ref:path> --after <path|ref:path> [--scenario name] [--seed value]');
}

const before = loadSource(args.before);
const after = loadSource(args.after);
const scenario = safeName(args.scenario || 'default');
const seed = String(args.seed || 'preference-review');
const runId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${scenario}`;
const outputDir = resolve(repoRoot, args.output || join('.artifacts', 'learning-preferences', runId));
mkdirSync(outputDir, { recursive: true });

const server = createComparisonServer(before, after);
await new Promise((ready) => server.listen(0, '127.0.0.1', ready));
const baseUrl = `http://127.0.0.1:${server.address().port}`;
const cases = args.kind === 'media'
  ? [
      { name: 'phone', width: 360, height: 800, media: 'screen' },
      { name: 'tablet', width: 768, height: 1024, media: 'screen' },
      { name: 'desktop', width: 1280, height: 720, media: 'screen' },
    ]
  : [
      { name: 'a4-screen', width: 794, height: 1123, media: 'screen' },
      { name: 'a4-print', width: 794, height: 1123, media: 'print' },
    ];

let browser;
const results = [];
try {
  browser = await chromium.launch({ headless: true });
  for (const testCase of cases) results.push(await compareCase(browser, testCase));
} finally {
  await browser?.close();
  await new Promise((closed) => server.close(closed));
}

const manifest = {
  schemaVersion: 1,
  tool: 'compare-learning-artifact',
  kind: args.kind,
  scenario,
  seed,
  generatedAt: new Date().toISOString(),
  before: { input: args.before, sourcePath: before.repoPath, sha256: sha256(before.html) },
  after: { input: args.after, sourcePath: after.repoPath, sha256: sha256(after.html) },
  results,
};
writeFileSync(join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
writeFileSync(join(outputDir, 'report.md'), renderReport(manifest), 'utf8');
console.log(`Learning artifact comparison written to ${relative(repoRoot, outputDir).replaceAll('\\', '/')}`);
console.log(`Cases: ${results.length}; before=${manifest.before.sha256.slice(0, 12)} after=${manifest.after.sha256.slice(0, 12)}`);

async function compareCase(browserInstance, testCase) {
  const context = await browserInstance.newContext({ viewport: { width: testCase.width, height: testCase.height } });
  const page = await context.newPage();
  const records = {};
  for (const side of ['before', 'after']) {
    const errors = [];
    page.removeAllListeners('console');
    page.removeAllListeners('pageerror');
    page.on('console', (message) => message.type() === 'error' && errors.push(`console: ${message.text()}`));
    page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
    await page.emulateMedia({ media: testCase.media });
    const url = `${baseUrl}/__learning/${side}?seed=${encodeURIComponent(seed)}&scenario=${encodeURIComponent(scenario)}`;
    await page.goto(url, { waitUntil: 'networkidle' });
    await page.evaluate(async () => document.fonts?.ready);
    const metrics = await page.evaluate(() => {
      const visible = (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
      };
      const controls = [...document.querySelectorAll('button,a,input,select,textarea,[role="button"]')].filter(visible);
      const clipped = [...document.querySelectorAll('body *')].filter((element) => visible(element)
        && (element.scrollWidth > element.clientWidth + 1 || element.scrollHeight > element.clientHeight + 1)
        && ['hidden', 'clip'].includes(getComputedStyle(element).overflow)).length;
      const sheets = [...document.querySelectorAll('.sheet')].map((sheet) => ({
        width: Math.round(sheet.getBoundingClientRect().width),
        height: Math.round(sheet.getBoundingClientRect().height),
        scrollWidth: sheet.scrollWidth,
        scrollHeight: sheet.scrollHeight,
        clientWidth: sheet.clientWidth,
        clientHeight: sheet.clientHeight,
      }));
      const important = [...document.querySelectorAll('button,a,input,select,textarea,[role="button"],.questions > .q')].filter(visible);
      const rects = important.map((element) => element.getBoundingClientRect());
      let overlappingPairs = 0;
      for (let left = 0; left < rects.length; left += 1) {
        for (let right = left + 1; right < rects.length; right += 1) {
          const a = rects[left];
          const b = rects[right];
          if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) overlappingPairs += 1;
        }
      }
      const fontSizes = [...document.querySelectorAll('body *')].filter((element) => visible(element) && element.childNodes.length > 0 && [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim()))
        .map((element) => Number.parseFloat(getComputedStyle(element).fontSize)).filter(Number.isFinite).sort((a, b) => a - b);
      const sampleColumns = 20;
      const sampleRows = 30;
      let emptySamples = 0;
      for (let row = 0; row < sampleRows; row += 1) {
        for (let column = 0; column < sampleColumns; column += 1) {
          const x = ((column + 0.5) / sampleColumns) * innerWidth;
          const y = ((row + 0.5) / sampleRows) * innerHeight;
          const element = document.elementFromPoint(x, y);
          if (!element || element === document.body || element === document.documentElement) emptySamples += 1;
        }
      }
      return {
        bodyTextLength: document.body?.innerText.trim().length || 0,
        documentWidth: document.documentElement.scrollWidth,
        documentHeight: document.documentElement.scrollHeight,
        horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        clippedElements: clipped,
        controlCount: controls.length,
        smallControls: controls.filter((element) => {
          const rect = element.getBoundingClientRect();
          return rect.width < 44 || rect.height < 44;
        }).length,
        minTextPx: fontSizes[0] || 0,
        medianTextPx: fontSizes.length ? fontSizes[Math.floor(fontSizes.length / 2)] : 0,
        overlappingImportantPairs: overlappingPairs,
        viewportWhitespaceRatio: Number((emptySamples / (sampleColumns * sampleRows)).toFixed(3)),
        questionCount: document.querySelectorAll('.questions > .q').length,
        sheetCount: sheets.length,
        overflowingSheets: sheets.filter((sheet) => sheet.scrollWidth > sheet.clientWidth + 1 || sheet.scrollHeight > sheet.clientHeight + 1).length,
        sheets,
      };
    });
    const firstSnapshot = await page.evaluate(() => JSON.stringify({
      text: document.body?.innerText || '',
      questions: [...document.querySelectorAll('.questions > .q')].map((element) => element.textContent),
      sheets: document.querySelectorAll('.sheet').length,
    }));
    await page.reload({ waitUntil: 'networkidle' });
    const secondSnapshot = await page.evaluate(() => JSON.stringify({
      text: document.body?.innerText || '',
      questions: [...document.querySelectorAll('.questions > .q')].map((element) => element.textContent),
      sheets: document.querySelectorAll('.sheet').length,
    }));
    metrics.deterministicReload = firstSnapshot === secondSnapshot;
    const imagePath = join(outputDir, `${testCase.name}-${side}.png`);
    await page.screenshot({ path: imagePath, fullPage: true });
    records[side] = { url, image: relative(repoRoot, imagePath).replaceAll('\\', '/'), imageSha256: sha256(readFileSync(imagePath)), errors, metrics };
  }
  const diffPath = join(outputDir, `${testCase.name}-diff.png`);
  await createVisualDiff(resolve(repoRoot, records.before.image), resolve(repoRoot, records.after.image), diffPath);
  await context.close();
  return {
    ...testCase,
    before: records.before,
    after: records.after,
    diff: relative(repoRoot, diffPath).replaceAll('\\', '/'),
    diffSha256: sha256(readFileSync(diffPath)),
  };
}

async function createVisualDiff(beforePath, afterPath, destination) {
  const [beforeMeta, afterMeta] = await Promise.all([sharp(beforePath).metadata(), sharp(afterPath).metadata()]);
  const width = Math.max(beforeMeta.width, afterMeta.width);
  const height = Math.max(beforeMeta.height, afterMeta.height);
  const normalizeImage = (file, meta) => sharp(file).extend({
    top: 0,
    left: 0,
    right: width - meta.width,
    bottom: height - meta.height,
    background: '#ffffff',
  }).png().toBuffer();
  const [left, right] = await Promise.all([normalizeImage(beforePath, beforeMeta), normalizeImage(afterPath, afterMeta)]);
  await sharp(left).composite([{ input: right, blend: 'difference' }]).png().toFile(destination);
}

function loadSource(input) {
  const direct = resolve(repoRoot, input);
  let html;
  let repoPath;
  if (existsSync(direct) && statSync(direct).isFile()) {
    html = readFileSync(direct, 'utf8');
    repoPath = relative(repoRoot, direct).replaceAll('\\', '/');
  } else {
    const match = input.match(/^([^:]+):(.+)$/);
    if (!match) fail(`ไม่พบ input: ${input}`);
    [, , repoPath] = match;
    repoPath = repoPath.replaceAll('\\', '/').replace(/^\.\//, '');
    try {
      html = execFileSync('git', ['show', `${match[1]}:${repoPath}`], { cwd: repoRoot, encoding: 'utf8' });
    } catch {
      fail(`อ่าน git ref ไม่ได้: ${input}`);
    }
  }
  if (!repoPath.startsWith('public/') || !repoPath.endsWith('.html')) fail('รองรับเฉพาะไฟล์ HTML ใต้ public/');
  const assetBase = `/${dirname(repoPath.slice('public/'.length)).replaceAll('\\', '/')}/`;
  return { html: injectBase(html, assetBase), repoPath };
}

function injectBase(html, base) {
  const tag = `<base href="${base}">`;
  return /<head[\s>]/i.test(html) ? html.replace(/<head([^>]*)>/i, `<head$1>${tag}`) : `${tag}${html}`;
}

function createComparisonServer(beforeSource, afterSource) {
  return createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.pathname === '/__learning/before' || url.pathname === '/__learning/after') {
      const source = url.pathname.endsWith('before') ? beforeSource : afterSource;
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      response.end(source.html);
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

function renderReport(manifest) {
  const lines = [`# Learning artifact comparison`, '', `- Kind: ${manifest.kind}`, `- Scenario: ${manifest.scenario}`, `- Seed: ${manifest.seed}`, `- Before: ${manifest.before.input} (${manifest.before.sha256})`, `- After: ${manifest.after.input} (${manifest.after.sha256})`, ''];
  for (const result of manifest.results) {
    lines.push(`## ${result.name}`, '', `- Before image: ${result.before.image} (${result.before.imageSha256})`, `- After image: ${result.after.image} (${result.after.imageSha256})`, `- Visual diff: ${result.diff} (${result.diffSha256})`, `- Before metrics: \`${JSON.stringify(result.before.metrics)}\``, `- After metrics: \`${JSON.stringify(result.after.metrics)}\``, `- Browser errors: before=${result.before.errors.length}, after=${result.after.errors.length}`, '');
  }
  return `${lines.join('\n')}\n`;
}

function parseArgs(argv) {
  return Object.fromEntries(argv.filter((arg) => arg.startsWith('--') && arg.includes('=')).map((arg) => {
    const index = arg.indexOf('=');
    return [arg.slice(2, index), arg.slice(index + 1)];
  }).concat(argv.flatMap((arg, index) => arg.startsWith('--') && !arg.includes('=') && argv[index + 1] && !argv[index + 1].startsWith('--') ? [[arg.slice(2), argv[index + 1]]] : [])));
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function safeName(value) {
  return value.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-|-$/g, '') || 'default';
}

function mime(extension) {
  return ({ '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg' })[extension.toLowerCase()] || 'application/octet-stream';
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exit(1);
}
