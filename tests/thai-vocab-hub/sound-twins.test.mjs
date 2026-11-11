import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '../../public');

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(publicDir, reqPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': mime[ext] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(0, async () => {
  const port = server.address().port;
  console.log(`🧪 Test server running at http://localhost:${port}`);

  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto(`http://localhost:${port}/games/thai/thai-vocab-hub/index.html`);
    await page.waitForLoadState('networkidle');

    console.log('1. Checking window.ThaiSoundTwins global object and launcher button...');
    const hasLauncher = await page.locator('#btn-sound-twins-toggle').count() > 0;
    assert.ok(hasLauncher, '#btn-sound-twins-toggle must exist in index.html');

    const hasTwinsObj = await page.evaluate(() => typeof window.ThaiSoundTwins === 'object' && window.ThaiSoundTwins !== null);
    assert.ok(hasTwinsObj, 'window.ThaiSoundTwins must be defined');

    console.log('2. Opening Sound Twins Modal via launcher button...');
    await page.locator('#btn-sound-twins-toggle').click();
    await page.waitForTimeout(200);

    const modal = page.locator('#modal-sound-twins');
    const isVisible = await modal.isVisible();
    assert.ok(isVisible, '#modal-sound-twins must be visible after clicking launcher');

    console.log('3. Testing Sound Twins Matrix (Mode 1)...');
    // Ensure Matrix mode is active
    await page.evaluate(() => window.ThaiSoundTwins.switchMode('matrix'));
    await page.waitForTimeout(100);

    // Switch family to "กาน"
    await page.evaluate(() => window.ThaiSoundTwins.selectFamily('กาน'));
    await page.waitForTimeout(150);

    const familyHeader = await page.locator('#sound-twins-header-badge').textContent();
    assert.ok(familyHeader.includes('กาน') && familyHeader.includes('แม่กน'), `Header badge must show family sound & section, got: "${familyHeader}"`);

    // Verify twin cards for "กาน" family (e.g. การ, กาล, กาฬ, กานต์, กาน)
    const twinCards = page.locator('.twin-card');
    const twinCount = await twinCards.count();
    assert.ok(twinCount >= 4, `Family "กาน" should have at least 4 twin cards, got: ${twinCount}`);

    const cardTexts = await twinCards.allTextContents();
    const joinedText = cardTexts.join(' ');
    assert.ok(joinedText.includes('การ'), 'Twin cards should contain "การ"');
    assert.ok(joinedText.includes('กาล'), 'Twin cards should contain "กาล"');
    assert.ok(joinedText.includes('กาฬ'), 'Twin cards should contain "กาฬ"');

    // Test selectTwin and speakWord
    console.log('4. Testing selectTwin and speakWord...');
    await page.evaluate(() => window.ThaiSoundTwins.selectTwin('กาล'));
    await page.waitForTimeout(100);
    const activeCard = page.locator('.twin-card.active');
    assert.ok(await activeCard.count() > 0, 'Active twin card should have .active class');
    const activeText = await activeCard.textContent();
    assert.ok(activeText.includes('กาล'), `Active card text must contain "กาล", got: "${activeText}"`);

    // Speak without throw
    await page.evaluate(() => window.ThaiSoundTwins.speakWord('กาล'));

    // Switch family to "พุด"
    console.log('5. Switching family to "พุด" (แม่กด)...');
    await page.evaluate(() => window.ThaiSoundTwins.selectFamily('พุด'));
    await page.waitForTimeout(150);
    const headerPud = await page.locator('#sound-twins-header-badge').textContent();
    assert.ok(headerPud.includes('พุด') && headerPud.includes('แม่กด'), `Header badge for "พุด" must show แม่กด, got: "${headerPud}"`);
    const pudCardsText = (await page.locator('.twin-card').allTextContents()).join(' ');
    assert.ok(pudCardsText.includes('พุธ') && pudCardsText.includes('พุทธ'), 'Pud family must contain "พุธ" and "พุทธ"');

    console.log('6. Switching to 4 Castles Sorting Challenge (Mode 2)...');
    await page.evaluate(() => window.ThaiSoundTwins.switchMode('castles'));
    await page.waitForTimeout(200);

    const castlesView = page.locator('#sound-twins-castles-view');
    assert.ok(await castlesView.isVisible(), '#sound-twins-castles-view must be visible in castles mode');

    // Verify 4 Castle buttons exist
    const castleButtons = page.locator('.btn-castle');
    assert.equal(await castleButtons.count(), 4, 'Must have exactly 4 castle buttons');
    const castleKod = page.locator('.btn-castle[data-castle="kod"]');
    const castleKon = page.locator('.btn-castle[data-castle="kon"]');
    const castleKob = page.locator('.btn-castle[data-castle="kob"]');
    const castleKok = page.locator('.btn-castle[data-castle="kok"]');
    assert.ok(await castleKod.count() > 0, 'Castle แม่กด must exist');
    assert.ok(await castleKon.count() > 0, 'Castle แม่กน must exist');
    assert.ok(await castleKob.count() > 0, 'Castle แม่กบ must exist');
    assert.ok(await castleKok.count() > 0, 'Castle แม่กก must exist');

    console.log('7. Testing 4 Castles answering and scoring logic...');
    // Inspect current prompt word
    const promptWordObj = await page.evaluate(() => window.ThaiSoundTwins.getCurrentPrompt());
    assert.ok(promptWordObj && promptWordObj.word, 'Current challenge prompt word must exist');
    assert.ok(['kod', 'kon', 'kob', 'kok'].includes(promptWordObj.targetSection), `targetSection must be one of 4 castles, got: ${promptWordObj.targetSection}`);

    const initialScore = await page.evaluate(() => window.ThaiSoundTwins.getScore());

    // Submit correct answer
    const correctCastle = promptWordObj.targetSection;
    await page.evaluate((c) => window.ThaiSoundTwins.answerCastle(c), correctCastle);
    await page.waitForTimeout(200);

    const scoreAfterCorrect = await page.evaluate(() => window.ThaiSoundTwins.getScore());
    const streakAfterCorrect = await page.evaluate(() => window.ThaiSoundTwins.getStreak());
    assert.ok(scoreAfterCorrect > initialScore, `Score must increase after correct answer, was ${initialScore}, now ${scoreAfterCorrect}`);
    assert.ok(streakAfterCorrect >= 1, `Streak must be at least 1, got ${streakAfterCorrect}`);

    // Feedback message should celebrate
    const feedbackText = await page.locator('#castle-feedback-banner').textContent();
    assert.ok(feedbackText.includes('ถูกต้อง') || feedbackText.includes('ยอดเยี่ยม') || feedbackText.includes('แม่'), `Feedback text must show success, got: "${feedbackText}"`);

    // Advance to next prompt
    await page.evaluate(() => window.ThaiSoundTwins.nextCastlePrompt());
    await page.waitForTimeout(200);

    // Submit intentionally wrong answer
    const nextPrompt = await page.evaluate(() => window.ThaiSoundTwins.getCurrentPrompt());
    const wrongCastle = ['kod', 'kon', 'kob', 'kok'].find(c => c !== nextPrompt.targetSection);
    await page.evaluate((c) => window.ThaiSoundTwins.answerCastle(c), wrongCastle);
    await page.waitForTimeout(200);

    const streakAfterWrong = await page.evaluate(() => window.ThaiSoundTwins.getStreak());
    assert.equal(streakAfterWrong, 0, 'Streak must reset to 0 after wrong answer');

    console.log('8. Testing close() method...');
    await page.evaluate(() => window.ThaiSoundTwins.close());
    await page.waitForTimeout(200);
    assert.ok(!(await modal.isVisible()), '#modal-sound-twins must be hidden after close()');

    console.log('9. Testing Responsive layout on 360x800 (Mobile) and 1280x720 (Desktop)...');
    for (const vp of [{ width: 360, height: 800 }, { width: 1280, height: 720 }]) {
      await page.setViewportSize(vp);
      await page.evaluate(() => {
        window.ThaiSoundTwins.open();
      });
      await page.waitForTimeout(200);

      const hasOverflow = await page.evaluate(() => {
        const dialog = document.querySelector('#modal-sound-twins .tvh-modal-card') ||
                       document.querySelector('#modal-sound-twins');
        return dialog ? dialog.scrollWidth > dialog.clientWidth + 1 : false;
      });
      assert.equal(hasOverflow, false, `No horizontal overflow allowed at ${vp.width}x${vp.height}`);
    }

    console.log('10. Verifying touch targets >= 40px for interactive buttons...');
    const buttons = page.locator('#modal-sound-twins button.touch-target, #modal-sound-twins .btn-castle, #modal-sound-twins .tvh-modal-close');
    const btnCount = await buttons.count();
    assert.ok(btnCount > 0, 'Must have primary interactive buttons');
    for (let i = 0; i < btnCount; i++) {
      const box = await buttons.nth(i).boundingBox();
      if (box) {
        assert.ok(box.width >= 38 && box.height >= 38, `Button [${i}] size must be >= 38px, got ${box.width}x${box.height}`);
      }
    }

    console.log('✅ All Sound Twin Matrix and 4 Castles Challenge tests passed!');
  } finally {
    await browser.close();
    server.close();
  }
});
