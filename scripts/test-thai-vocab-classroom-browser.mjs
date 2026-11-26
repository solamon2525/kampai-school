import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const PUBLIC_DIR = path.resolve(process.cwd(), 'public');
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  const urlPath = (req.url || '/').split('?')[0];
  let filePath = path.join(PUBLIC_DIR, decodeURIComponent(urlPath));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
});

await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;
const baseUrl = `http://127.0.0.1:${port}/games/thai/thai-vocab-hub/index.html`;

const browser = await chromium.launch();
const pageErrors = [];

try {
  for (const vp of [{ width: 1280, height: 720 }, { width: 360, height: 800 }]) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    page.on('pageerror', (err) => pageErrors.push(`${vp.width}x${vp.height}: ${err.message}`));

    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.ThaiVocabClassroom && document.querySelectorAll('.hub-card').length > 0);

    await page.locator('.hub-card[data-slug="misspelled"]').click();
    await page.waitForSelector('#topic-view', { state: 'visible' });

    if (vp.width === 360) {
      await page.click('#btn-teacher-tools-toggle');
      await page.waitForSelector('#teacher-tools-drawer', { state: 'visible' });
    }

    // 1. Spinner modal + reroll button
    await page.click('button[title="วงล้อสุ่มคำศัพท์"]');
    await page.waitForSelector('#tvh-spinner-modal', { state: 'visible' });
    assert.equal(await page.isVisible('#btn-reroll-wheel'), true, 'Reroll wheel button must be visible');
    await page.click('#btn-reroll-wheel');
    await page.click('#tvh-spinner-modal .tvh-modal-close');

    // 2. Team Battle modal + Buzzer + Reset
    if (vp.width === 360) {
      // ensure drawer stays open or open again if needed
      const vis = await page.isVisible('button[title="แข่งขัน ๒ ทีม"]');
      if (!vis) await page.click('#btn-teacher-tools-toggle');
    }
    await page.click('button[title="แข่งขัน ๒ ทีม"]');
    await page.waitForSelector('#tvh-battle-modal', { state: 'visible' });

    // Buzz Blue team, answer correctly -> blue score becomes 10 (no confirm() dialog!)
    await page.click('#buzzer-blue-btn');
    assert.equal(await page.locator('#buzzer-blue-btn.is-buzzed').count(), 1, 'Blue buzzer must activate');

    const correctWord = await page.evaluate(() => {
      const meaning = document.getElementById('battle-q-text')?.textContent;
      const list = window.GAME_DATA.words.misspelled || [];
      const found = list.find(w => w.meaning === meaning);
      return found ? found.word : '';
    });
    assert.ok(correctWord, 'Must find matching word for battle prompt');
    await page.locator('#battle-choices .battle-choice-btn', { hasText: correctWord }).click();
    assert.equal((await page.textContent('#battle-blue-score')).trim(), '10', 'Blue score must increment to 10');

    // Reset works cleanly without crash
    await page.click('#tvh-battle-modal button:has-text("เริ่มเกมใหม่")');
    assert.equal((await page.textContent('#battle-blue-score')).trim(), '0');
    await page.click('#tvh-battle-modal .tvh-modal-close');

    // Zero horizontal overflow
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    assert.equal(overflow, false, `Horizontal overflow at ${vp.width}x${vp.height}`);

    await ctx.close();
  }

  assert.deepEqual(pageErrors, [], `Unexpected page errors: ${pageErrors.join('; ')}`);
  console.log('✅ Classroom Tools (Spinner & Buzzer Team Battle) browser tests passed on 1280x720 and 360x800!');
} finally {
  await browser.close();
  server.close();
}
