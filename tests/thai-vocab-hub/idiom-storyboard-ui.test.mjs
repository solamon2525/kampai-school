import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const HUB_DIR = resolve(ROOT, 'public/games/thai/thai-vocab-hub');

console.log('🧪 Starting Thai Vocab Hub idiom storyboard UI tests...\n');

const htmlContent = readFileSync(resolve(HUB_DIR, 'index.html'), 'utf8');
const configCode = readFileSync(resolve(HUB_DIR, 'config.js'), 'utf8');
const dataCode = readFileSync(resolve(HUB_DIR, 'data.js'), 'utf8');
const gameCode = readFileSync(resolve(HUB_DIR, 'game.js'), 'utf8');

const sampleIdiom = {
  word: 'ดินพอกหางหมู',
  reading: 'ดิน-พอก-หาง-หมู',
  meaning: 'งานหรือสิ่งค้างคาที่สะสมพอกพูนจนยากจะจัดการ',
  emoji: '🐷',
  grade: 'ป.6',
  indicator_code: 'ท 4.1 ป.4/1',
  content_status: 'approved',
  category_evidence: 'คำเดิมของหมวด สำนวนไทยมีคติ',
  pos: 'สำนวน',
  example: 'ผู้ใหญ่สอนเตือนสติด้วยสำนวน "ดินพอกหางหมู"',
  images: [
    {
      step: 1,
      phase: 'จุดเริ่มต้น',
      url: 'assets/idiom-visuals/pig-tail-mud-1.webp',
      alt: 'ลูกหมูนอนเล่นในโคลน มีโคลนติดหางนิดเดียวแต่ผัดวันไม่ยอมล้าง',
      caption: 'ลูกหมูนอนเล่นในโคลน มีโคลนติดหางนิดเดียวแต่ผัดวันไม่ยอมล้าง'
    },
    {
      step: 2,
      phase: 'พอกพูน',
      url: 'assets/idiom-visuals/pig-tail-mud-2.webp',
      alt: 'โคลนพอกสะสมจนกลายเป็นก้อนหินใหญ่ หนักจนหมูขยับตัวไม่ไหว',
      caption: 'โคลนพอกสะสมจนกลายเป็นก้อนหินใหญ่ หนักจนหมูขยับตัวไม่ไหว'
    },
    {
      step: 3,
      phase: 'คติสอนใจ',
      url: 'assets/idiom-visuals/pig-tail-mud-3.webp',
      alt: 'เด็กนักเรียนดองการบ้านจนกองท่วมโต๊ะ สะท้อนว่างานค้างยิ่งปล่อยยิ่งแก้ยาก',
      caption: 'เด็กนักเรียนดองการบ้านจนกองท่วมโต๊ะ สะท้อนว่างานค้างยิ่งปล่อยยิ่งแก้ยาก'
    }
  ],
  image_url: 'assets/idiom-visuals/pig-tail-mud-1.webp',
  image_alt: 'ลูกหมูนอนเล่นในโคลน มีโคลนติดหางนิดเดียวแต่ผัดวันไม่ยอมล้าง'
};

function setupTestDom() {
  const dom = new JSDOM(htmlContent, {
    url: 'http://localhost/games/thai/thai-vocab-hub/',
    runScripts: 'dangerously'
  });
  const win = dom.window;

  // Polyfills & Mocks for JSDOM
  win.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  win.cancelAnimationFrame = (id) => clearTimeout(id);

  const storageStore = {};
  Object.defineProperty(win, 'localStorage', {
    value: {
      getItem: (k) => storageStore[k] || null,
      setItem: (k, v) => { storageStore[k] = String(v); },
      removeItem: (k) => { delete storageStore[k]; },
      clear: () => {}
    }
  });

  let speechCancelCount = 0;
  let lastSpokenText = '';
  win.speechSynthesis = {
    speak: (utt) => { lastSpokenText = utt?.text || ''; },
    cancel: () => { speechCancelCount++; },
    getVoices: () => []
  };
  win.SpeechSynthesisUtterance = function (t) { this.text = t; };

  win.HTMLCanvasElement.prototype.getContext = () => ({
    save: () => {}, restore: () => {}, beginPath: () => {}, closePath: () => {},
    arc: () => {}, fill: () => {}, stroke: () => {}, moveTo: () => {}, lineTo: () => {},
    clearRect: () => {}, fillRect: () => {}, strokeRect: () => {}, fillText: () => {},
    measureText: () => ({ width: 50 })
  });

  win.eval(configCode);
  win.eval(dataCode);
  win.eval(gameCode);

  return {
    dom,
    win,
    doc: win.document,
    getSpeechCancelCount: () => speechCancelCount,
    getLastSpokenText: () => lastSpokenText
  };
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

const { win, doc, getSpeechCancelCount } = setupTestDom();

// 1. Check createGridCardElement renders badge on front and button on back
console.log('1. Checking createGridCardElement with multi-image item...');
assert.equal(typeof win.createGridCardElement, 'function', 'createGridCardElement must be a function');
const cardEl = win.createGridCardElement(sampleIdiom, 0, {});

const frontBadge = cardEl.querySelector('.badge-storyboard-trigger');
assert.ok(frontBadge, 'Front face must contain .badge-storyboard-trigger');
assert.match(frontBadge.textContent, /🎬\s*3\s*ตอน/, 'Front badge text should mention 3 ตอน');

const backBtn = cardEl.querySelector('.grid-storyboard-btn');
assert.ok(backBtn, 'Back face must contain .grid-storyboard-btn');
assert.match(backBtn.textContent, /🎬.*ดูภาพเรื่องราว.*3.*ตอน/, 'Back button text should mention ดูภาพเรื่องราว (3 ตอน)');

// Single image item (no images array) fallback check
const singleImgItem = {
  word: 'พระเนตร',
  reading: 'พระ-เนตร',
  meaning: 'ดวงตา',
  image_url: 'assets/royal/eyes.webp'
};
const singleCard = win.createGridCardElement(singleImgItem, 1, {});
assert.ok(!singleCard.querySelector('.badge-storyboard-trigger'), 'No storyboard badge when item has no images array');
assert.ok(singleCard.querySelector('.grid-visual-btn'), 'Should render .grid-visual-btn for item with only image_url');

// 2. Storyboard modal functions exist
console.log('2. Verifying Storyboard functions exist on window...');
assert.equal(typeof win.openIdiomStoryboard, 'function', 'openIdiomStoryboard must be defined');
assert.equal(typeof win.closeIdiomStoryboard, 'function', 'closeIdiomStoryboard must be defined');
assert.equal(typeof win.setStoryboardViewMode, 'function', 'setStoryboardViewMode must be defined');
assert.equal(typeof win.goToStoryboardStep, 'function', 'goToStoryboardStep must be defined');
assert.equal(typeof win.speakStoryboardCaption, 'function', 'speakStoryboardCaption must be defined');

// 3. Opening modal via button click
console.log('3. Opening modal and checking initial state...');
const modal = doc.getElementById('idiom-storyboard-modal');
assert.ok(modal, '#idiom-storyboard-modal must exist in DOM');
assert.equal(modal.style.display, 'none', 'Modal should be hidden initially');

// Click storyboard button on card
backBtn.click();
assert.notEqual(modal.style.display, 'none', 'Modal should be visible after clicking storyboard button');
assert.ok(doc.body.classList.contains('modal-open'), 'Body should have modal-open class');

// 4. Modal Header & Content verification
console.log('4. Verifying modal header, reading, meaning, and default step 0...');
const titleEl = doc.getElementById('storyboard-title');
const readingEl = doc.getElementById('storyboard-reading');
const meaningEl = doc.getElementById('storyboard-meaning');
const exampleEl = doc.getElementById('storyboard-example');

assert.equal(titleEl.textContent.trim(), 'ดินพอกหางหมู', 'Title should match idiom word');
assert.match(readingEl.textContent, /ดิน-พอก-หาง-หมู/, 'Reading should match idiom reading');
assert.match(meaningEl.textContent, /งานหรือสิ่งค้างคาที่สะสม/, 'Meaning should match');
assert.match(exampleEl.textContent, /ผู้ใหญ่สอนเตือนสติ/, 'Example should match');

// Slide Mode: Check Step 0 (Step 1)
const slideImg = doc.getElementById('storyboard-slide-img');
const captionEl = doc.getElementById('storyboard-caption-text');
assert.equal(slideImg.getAttribute('src'), 'assets/idiom-visuals/pig-tail-mud-1.webp', 'Step 1 image URL must match');
assert.equal(captionEl.textContent.trim(), sampleIdiom.images[0].caption, 'Step 1 caption must match');

// Step chips
const chips = doc.querySelectorAll('#storyboard-step-chips .storyboard-step-chip');
assert.equal(chips.length, 3, 'Should render 3 step chips');
assert.ok(chips[0].classList.contains('active'), 'First step chip should be active');

// 5. Navigation: Next and Prev buttons
console.log('5. Navigating steps with Next/Prev buttons...');
const nextBtn = doc.getElementById('btn-storyboard-next');
const prevBtn = doc.getElementById('btn-storyboard-prev');
assert.ok(nextBtn, 'Next button exists');
assert.ok(prevBtn, 'Prev button exists');

// Advance to Step 1 (Step 2 in 1-based index)
nextBtn.click();
assert.equal(slideImg.getAttribute('src'), 'assets/idiom-visuals/pig-tail-mud-2.webp', 'Step 2 image URL must match');
assert.equal(captionEl.textContent.trim(), sampleIdiom.images[1].caption, 'Step 2 caption must match');
assert.ok(chips[1].classList.contains('active'), 'Second step chip should be active');

// Advance to Step 2 (Step 3)
nextBtn.click();
assert.equal(slideImg.getAttribute('src'), 'assets/idiom-visuals/pig-tail-mud-3.webp', 'Step 3 image URL must match');
assert.ok(chips[2].classList.contains('active'), 'Third step chip should be active');

// Advance past end should clamp or loop safely (clamp to step 2 or stay within bounds)
nextBtn.click();
assert.equal(slideImg.getAttribute('src'), 'assets/idiom-visuals/pig-tail-mud-3.webp', 'Should stay on last step or clamp');

// Prev button back to Step 1
prevBtn.click();
assert.equal(slideImg.getAttribute('src'), 'assets/idiom-visuals/pig-tail-mud-2.webp', 'Prev button returns to Step 2');

// 6. Mode Switcher: Comic Strip Mode
console.log('6. Switching to Comic Strip mode...');
const slideView = doc.getElementById('storyboard-slide-view');
const stripView = doc.getElementById('storyboard-strip-view');
const btnModeSlide = doc.getElementById('btn-mode-slide');
const btnModeStrip = doc.getElementById('btn-mode-strip');

assert.ok(slideView, '#storyboard-slide-view exists');
assert.ok(stripView, '#storyboard-strip-view exists');
assert.ok(btnModeStrip, '#btn-mode-strip exists');

btnModeStrip.click();
assert.equal(slideView.style.display, 'none', 'Slide view should be hidden in strip mode');
assert.notEqual(stripView.style.display, 'none', 'Strip view should be visible in strip mode');
assert.ok(btnModeStrip.classList.contains('active'), 'Strip mode button should have active class');

const stripPanels = doc.querySelectorAll('#storyboard-strip-container .storyboard-strip-panel');
assert.equal(stripPanels.length, 3, 'Strip view should render 3 panels');

// Each panel must have step badge, image, caption, and audio button
stripPanels.forEach((panel, i) => {
  const panelImg = panel.querySelector('img');
  const panelCaption = panel.querySelector('.storyboard-strip-caption');
  const panelBadge = panel.querySelector('.storyboard-strip-phase');
  const panelAudio = panel.querySelector('.btn-strip-speak');

  assert.ok(panelImg, `Panel ${i + 1} has image`);
  assert.equal(panelImg.getAttribute('src'), sampleIdiom.images[i].url, `Panel ${i + 1} image matches`);
  assert.ok(panelCaption, `Panel ${i + 1} has caption`);
  assert.equal(panelCaption.textContent.trim(), sampleIdiom.images[i].caption, `Panel ${i + 1} caption matches`);
  assert.ok(panelBadge, `Panel ${i + 1} has phase badge`);
  assert.ok(panelAudio, `Panel ${i + 1} has listen button`);
});

// Switch back to Slide mode
btnModeSlide.click();
assert.notEqual(slideView.style.display, 'none', 'Slide view visible when switching back');
assert.equal(stripView.style.display, 'none', 'Strip view hidden when switching back');

// 7. Closing modal via close button and Escape key
console.log('7. Testing modal close and speech cancellation...');
const closeBtn = doc.getElementById('btn-storyboard-close');
assert.ok(closeBtn, 'Close button exists');

const initialCancelCount = getSpeechCancelCount();
closeBtn.click();

assert.equal(modal.style.display, 'none', 'Modal should be hidden after closing');
assert.ok(!doc.body.classList.contains('modal-open'), 'modal-open removed from body');
assert.ok(getSpeechCancelCount() > initialCancelCount, 'Speech must be cancelled on modal close');

// Reopen and test Escape key
win.openIdiomStoryboard(sampleIdiom);
assert.notEqual(modal.style.display, 'none', 'Modal reopened');
doc.dispatchEvent(new win.KeyboardEvent('keydown', { key: 'Escape' }));
assert.equal(modal.style.display, 'none', 'Modal should be closed by Escape key');

console.log('✅ All Storyboard UI tests passed!\n');
