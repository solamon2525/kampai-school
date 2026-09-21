#!/usr/bin/env node

import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, '..');
const publicRoot = join(repoRoot, 'public');
const artifactDir = join(repoRoot, '.artifacts', 'game-verify');

mkdirSync(artifactDir, { recursive: true });

const TARGET_COVERS = [
  {
    id: 'clock-quest',
    subject: 'คณิตศาสตร์',
    url: '/games/math/clock-quest-cover.png',
    titleEn: 'Clock Quest',
    titleTh: 'นาฬิกาแสนสนุก',
    curriculum: 'ค 2.1 ป.2–ป.3'
  },
  {
    id: 'light-sort',
    subject: 'วิทยาศาสตร์',
    url: '/games/science/light-sort-cover.png',
    titleEn: 'Light Sort',
    titleTh: 'แสงผ่านได้ไหม?',
    curriculum: 'ว 2.3 ป.4–ป.5'
  },
  {
    id: 'moon-phases-race',
    subject: 'วิทยาศาสตร์',
    url: '/games/science/moon-phases-race-cover.png',
    titleEn: 'Moon Phases Race',
    titleTh: 'แข่งเฟสดวงจันทร์',
    curriculum: 'ว 3.1 ป.4–ป.5'
  },
  {
    id: 'maglev-rush',
    subject: 'วิทยาศาสตร์',
    url: '/games/science/maglev-rush/cover.png',
    titleEn: 'Maglev Rush',
    titleTh: 'รถไฟแม่เหล็กความเร็วสูง',
    curriculum: 'ว 2.2 ป.3–ป.6'
  },
  {
    id: 'animal-feast',
    subject: 'วิทยาศาสตร์',
    url: '/games/science/animal-feast/cover.png',
    titleEn: 'Animal Feast',
    titleTh: 'ยอดนักป้อนอาหารสัตว์',
    curriculum: 'ว 1.2 ป.1–ป.3'
  },
  {
    id: 'follow-instructions-lab',
    subject: 'ภาษาอังกฤษ',
    url: '/games/english/follow-instructions-lab-cover.png',
    titleEn: 'Follow Instructions Lab',
    titleTh: 'ห้องทดลองทำตามคำสั่ง',
    curriculum: 'ต 1.1 ป.3–ป.4'
  },
  {
    id: 'past-tense-run',
    subject: 'ภาษาอังกฤษ',
    url: '/games/english/past-tense-run-cover.png',
    titleEn: 'Past Tense Run',
    titleTh: 'วิ่งตะลุยอดีตกาล',
    curriculum: 'ต 1.1 ป.4–ป.5'
  },
  {
    id: 'bone-muscle-quest',
    subject: 'สุขศึกษา',
    url: '/games/health/bone-muscle-quest-cover.png',
    titleEn: 'Bone & Muscle Quest',
    titleTh: 'กระดูก–กล้ามเนื้อควิซ',
    curriculum: 'พ 1.1 ป.4–ป.5'
  },
  {
    id: 'first-aid-rush',
    subject: 'สุขศึกษา',
    url: '/games/health/first-aid-rush-cover.png',
    titleEn: 'First Aid Rush',
    titleTh: 'ปฐมพยาบาลด่วน',
    curriculum: 'พ 5.1 ป.4–ป.5'
  },
  {
    id: 'fact-opinion-duel',
    subject: 'ภาษาไทย',
    url: '/games/thai/fact-opinion-duel-cover.png',
    titleEn: 'Fact vs Opinion Duel',
    titleTh: 'ข้อเท็จจริง vs ความคิดเห็น',
    curriculum: 'ท 1.1 ป.4–ป.5'
  }
];

// 1. Static file check & Sharp metadata validation
console.log('=== Step 1: Disk & Image Metadata Validation ===');
for (const item of TARGET_COVERS) {
  const diskPath = join(publicRoot, item.url.replace(/^\/+/, ''));
  if (!existsSync(diskPath)) {
    console.error(`❌ Missing file: ${diskPath}`);
    process.exit(1);
  }
  const stat = statSync(diskPath);
  const meta = await sharp(diskPath).metadata();
  console.log(`✓ [Disk] ${item.id.padEnd(25)} -> ${meta.width}x${meta.height} ${meta.format.toUpperCase()} (${(stat.size / 1024).toFixed(1)} KB)`);
  assert.equal(meta.width, 1280, `${item.id} width must be 1280`);
  assert.equal(meta.height, 720, `${item.id} height must be 720`);
  assert.equal(meta.format, 'png', `${item.id} format must be PNG`);
}

// 2. Start HTTP static server
function mime(extension) {
  return ({
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp'
  })[extension.toLowerCase()] || 'application/octet-stream';
}

function generateHarnessHtml() {
  const cardsHtml = TARGET_COVERS.map((c) => `
    <article class="hub-card" data-cover-id="${c.id}">
      <div class="thumb-wrapper">
        <img
          src="${c.url}"
          alt="${c.titleEn} (${c.titleTh})"
          data-cover-img="${c.id}"
          loading="eager"
        />
        <div class="badge-overlay">${c.subject}</div>
      </div>
      <div class="card-body">
        <span class="curriculum-tag">${c.curriculum}</span>
        <h3 class="card-title">${c.titleEn}</h3>
        <p class="card-subtitle">${c.titleTh}</p>
        <button class="play-btn">เล่นเกม</button>
      </div>
    </article>
  `).join('\n');

  return `<!doctype html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Educational Hub — 10 Covers Audit</title>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      min-height: 100vh;
      background: #0f172a;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Sarabun', sans-serif;
      overflow-x: hidden;
    }
    .header {
      padding: 1.5rem 1rem;
      text-align: center;
      background: #1e293b;
      border-bottom: 1px solid #334155;
    }
    .header h1 {
      font-size: 1.5rem;
      font-weight: 800;
      color: #38bdf8;
      margin-bottom: 0.25rem;
    }
    .header p {
      font-size: 0.875rem;
      color: #94a3b8;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 1.5rem 1rem;
    }
    .grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.25rem;
    }
    @media (min-width: 640px) {
      .grid {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @media (min-width: 1024px) {
      .grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    .hub-card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 0.75rem;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
      transition: transform 0.2s;
    }
    .thumb-wrapper {
      position: relative;
      width: 100%;
      aspect-ratio: 16 / 9;
      background: #020617;
      overflow: hidden;
    }
    .thumb-wrapper img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .badge-overlay {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(4px);
      color: #38bdf8;
      border: 1px solid #0284c7;
      border-radius: 9999px;
      padding: 0.2rem 0.6rem;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .card-body {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      flex: 1;
      gap: 0.35rem;
    }
    .curriculum-tag {
      font-size: 0.75rem;
      color: #fbbf24;
      font-weight: 600;
    }
    .card-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #f8fafc;
    }
    .card-subtitle {
      font-size: 0.875rem;
      color: #cbd5e1;
    }
    .play-btn {
      margin-top: auto;
      padding: 0.5rem 1rem;
      background: #0284c7;
      color: white;
      border: none;
      border-radius: 0.5rem;
      font-weight: 700;
      cursor: pointer;
      font-size: 0.875rem;
    }
  </style>
</head>
<body>
  <header class="header">
    <h1>คลังเกมการศึกษา — Educational Hub</h1>
    <p>10 Studio-Quality 16:9 Covers Real-Screen Browser Audit</p>
  </header>
  <main class="container">
    <div class="grid" id="covers-grid">
      ${cardsHtml}
    </div>
  </main>
</body>
</html>`;
}

const server = createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname === '/test-hub-covers.html') {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(generateHarnessHtml());
    return;
  }
  const decoded = decodeURIComponent(url.pathname).replace(/^\/+/, '');
  const file = normalize(join(publicRoot, decoded));
  if (!file.startsWith(publicRoot) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404, { 'content-type': 'text/plain' });
    res.end('Not found: ' + url.pathname);
    return;
  }
  res.writeHead(200, { 'content-type': mime(extname(file)) });
  createReadStream(file).pipe(res);
});

await new Promise((resolveReady) => server.listen(0, '127.0.0.1', resolveReady));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}`;
console.log(`Server started on ${baseUrl}`);

// 3. Playwright Real Browser Verification
let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch (e) {
  console.error('Playwright import failed:', e);
  process.exit(1);
}

const viewports = [
  { name: 'mobile', width: 360, height: 800, screenshotFile: 'covers-hub-360x800.png' },
  { name: 'desktop', width: 1280, height: 720, screenshotFile: 'covers-hub-1280x720.png' }
];

const auditResults = {
  viewports: {},
  directHttp: {},
  passed: true,
  summary: []
};

let browser;
try {
  browser = await chromium.launch({ headless: true });

  for (const vp of viewports) {
    console.log(`\n=== Testing Viewport: ${vp.name.toUpperCase()} (${vp.width}x${vp.height}) ===`);
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1
    });

    const networkResponses = new Map();
    const networkErrors = [];

    page.on('response', (response) => {
      const u = new URL(response.url());
      networkResponses.set(u.pathname, {
        status: response.status(),
        contentType: response.headers()['content-type'],
        contentLength: response.headers()['content-length']
      });
      if (response.status() >= 400) {
        networkErrors.push({ url: u.pathname, status: response.status() });
      }
    });

    page.on('requestfailed', (req) => {
      networkErrors.push({ url: req.url(), error: req.failure()?.errorText });
    });

    await page.goto(`${baseUrl}/test-hub-covers.html`, { waitUntil: 'networkidle' });

    // Evaluate DOM properties for all 10 cover images
    const domEval = await page.evaluate((targets) => {
      const results = [];
      for (const t of targets) {
        const img = document.querySelector(`img[data-cover-img="${t.id}"]`);
        if (!img) {
          results.push({ id: t.id, url: t.url, found: false });
          continue;
        }
        const rect = img.getBoundingClientRect();
        results.push({
          id: t.id,
          url: t.url,
          found: true,
          complete: img.complete,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          renderedWidth: Math.round(rect.width),
          renderedHeight: Math.round(rect.height),
          visible: rect.width > 0 && rect.height > 0
        });
      }
      const scrollW = document.documentElement.scrollWidth;
      const clientW = document.documentElement.clientWidth;
      return {
        items: results,
        scrollWidth: scrollW,
        clientWidth: clientW,
        hasOverflow: scrollW > clientW + 1
      };
    }, TARGET_COVERS);

    // Assertions for this viewport
    console.log(`Horizontal Scroll Check: scrollWidth=${domEval.scrollWidth}px, clientWidth=${domEval.clientWidth}px`);
    assert.equal(domEval.hasOverflow, false, `Horizontal overflow detected at ${vp.width}px!`);

    assert.equal(networkErrors.length, 0, `Network errors detected: ${JSON.stringify(networkErrors)}`);

    for (const item of domEval.items) {
      assert.equal(item.found, true, `Image for ${item.id} not found in DOM`);
      assert.equal(item.complete, true, `Image for ${item.id} did not finish loading`);
      assert.ok(item.naturalWidth > 0, `Image for ${item.id} naturalWidth is 0 (broken!)`);
      assert.ok(item.naturalHeight > 0, `Image for ${item.id} naturalHeight is 0 (broken!)`);
      assert.equal(item.naturalWidth, 1280, `Image for ${item.id} naturalWidth is ${item.naturalWidth}, expected 1280`);
      assert.equal(item.naturalHeight, 720, `Image for ${item.id} naturalHeight is ${item.naturalHeight}, expected 720`);
      assert.ok(item.visible, `Image for ${item.id} rendered size is 0`);

      const resp = networkResponses.get(item.url);
      assert.ok(resp, `No network response recorded for ${item.url}`);
      assert.equal(resp.status, 200, `HTTP status for ${item.url} is ${resp?.status}, expected 200`);

      console.log(`  ✓ [${vp.name}] ${item.id.padEnd(25)} -> HTTP ${resp.status} OK | Nat: ${item.naturalWidth}x${item.naturalHeight} | Box: ${item.renderedWidth}x${item.renderedHeight}px`);
    }

    // Special verification on animal-feast
    const animalFeastResp = networkResponses.get('/games/science/animal-feast/cover.png');
    assert.ok(animalFeastResp, 'animal-feast response missing');
    assert.equal(animalFeastResp.status, 200, 'animal-feast MUST return HTTP 200 OK (no 404!)');
    console.log(`  ⭐ Special check: animal-feast HTTP ${animalFeastResp.status} OK (Zero 404 broken image guaranteed!)`);

    // Capture screenshot
    const screenshotPath = join(artifactDir, vp.screenshotFile);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`  📸 Screenshot saved: ${screenshotPath}`);

    auditResults.viewports[vp.name] = {
      width: vp.width,
      height: vp.height,
      scrollWidth: domEval.scrollWidth,
      clientWidth: domEval.clientWidth,
      hasOverflow: domEval.hasOverflow,
      items: domEval.items,
      screenshot: screenshotPath
    };

    await page.close();
  }

  // 4. Direct HTTP requests check
  console.log('\n=== Direct HTTP GET Verification for 10 Covers ===');
  for (const c of TARGET_COVERS) {
    const res = await fetch(`${baseUrl}${c.url}`);
    const buf = await res.arrayBuffer();
    console.log(`✓ [HTTP GET] ${c.url.padEnd(45)} -> Status ${res.status} | Content-Type: ${res.headers.get('content-type')} | Bytes: ${buf.byteLength}`);
    assert.equal(res.status, 200, `Expected 200 for ${c.url}`);
    assert.equal(res.headers.get('content-type'), 'image/png');
    assert.ok(buf.byteLength > 100000, `Image file size suspiciously small: ${buf.byteLength} bytes`);
    auditResults.directHttp[c.id] = {
      url: c.url,
      status: res.status,
      bytes: buf.byteLength,
      contentType: res.headers.get('content-type')
    };
  }

} catch (err) {
  auditResults.passed = false;
  auditResults.error = err.message;
  console.error('\n❌ AUDIT FAILED:', err);
} finally {
  await browser?.close();
  await new Promise((r) => server.close(r));
}

// Write json report
const reportPath = join(artifactDir, 'covers-audit-report.json');
writeFileSync(reportPath, JSON.stringify(auditResults, null, 2) + '\n', 'utf8');
console.log(`\nAudit report saved to: ${reportPath}`);

if (!auditResults.passed) {
  process.exit(1);
}

console.log('\n======================================================');
console.log('🎉 ALL 10 GAME COVERS PASSED REAL BROWSER AUDIT 100%!');
console.log('- 10/10 covers load with HTTP 200 OK');
console.log('- 10/10 covers have naturalWidth=1280 and naturalHeight=720');
console.log('- Zero 404 broken image (animal-feast confirmed HTTP 200 OK)');
console.log('- Zero horizontal overflow across 360x800 and 1280x720 viewports');
console.log('======================================================\n');
