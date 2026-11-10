import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JSDOM } from 'jsdom';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const HUB_DIR = resolve(ROOT, 'public/games/thai/thai-vocab-hub');

console.log('🧪 Starting Thai Vocab Hub idiom worksheet & filter tests...\n');

const htmlContent = readFileSync(resolve(HUB_DIR, 'index.html'), 'utf8');
const configCode = readFileSync(resolve(HUB_DIR, 'config.js'), 'utf8');
const dataCode = readFileSync(resolve(HUB_DIR, 'data.js'), 'utf8');
const worksheetCode = readFileSync(resolve(HUB_DIR, 'worksheet-generator.js'), 'utf8');
const gameCode = readFileSync(resolve(HUB_DIR, 'game.js'), 'utf8');

function setupTestDom() {
  const dom = new JSDOM(htmlContent, {
    url: 'http://localhost/games/thai/thai-vocab-hub/',
    runScripts: 'dangerously'
  });
  const win = dom.window;

  // Polyfills & Mocks for JSDOM
  win.requestAnimationFrame = (cb) => setTimeout(cb, 0);
  win.cancelAnimationFrame = (id) => clearTimeout(id);

  win.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  win.IntersectionObserver = class IntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  const storageStore = {};
  Object.defineProperty(win, 'localStorage', {
    value: {
      getItem: (k) => storageStore[k] || null,
      setItem: (k, v) => { storageStore[k] = String(v); },
      removeItem: (k) => { delete storageStore[k]; },
      clear: () => {}
    }
  });

  win.speechSynthesis = {
    speak: () => {},
    cancel: () => {},
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
  win.eval(worksheetCode);
  win.eval(gameCode);

  return { dom, win, doc: win.document };
}

// ─── Test Suite ──────────────────────────────────────────────────────────────

const { win, doc } = setupTestDom();

// 1. Check GRID_VIEW_OPTIONS contains storyboard option
console.log('1. Checking GRID_VIEW_OPTIONS for storyboard filter...');
const hasStoryboardOption = win.GRID_VIEW_OPTIONS && win.GRID_VIEW_OPTIONS.some(
  (opt) => opt.value === 'storyboard' && opt.label.includes('ภาพเรื่องราว')
);
assert.ok(hasStoryboardOption, 'GRID_VIEW_OPTIONS must include { value: "storyboard", label: "🎬 ภาพเรื่องราว" }');

// 2. Check getGridDisplayWords() filters only words with images when gridViewMode is 'storyboard'
console.log('2. Checking getGridDisplayWords() filtering by storyboard...');
win.selectCategory('idioms');
win.setGridViewMode('storyboard');
const filteredWords = win.getGridDisplayWords();
assert.ok(filteredWords.length > 0, 'Idioms category must have items with storyboard');
for (const word of filteredWords) {
  assert.ok(Array.isArray(word.images) && word.images.length > 0, `${word.word} must have images array with length > 0`);
}
assert.equal(filteredWords.length, 10, 'Expected 10 iconic idioms with storyboards in idioms category');

// 3. Check empty state message when gridViewMode is 'storyboard'
console.log('3. Checking renderWordsGrid() empty state message for storyboard...');
// Filtering by ป.4 has no storyboard items (all 10 are in ป.6)
win.setGridGradeFilter('ป.4');
win.renderWordsGrid();
const emptyMsg = doc.querySelector('.grid-empty-msg');
assert.ok(emptyMsg, 'Empty message element must exist');
assert.equal(emptyMsg.textContent.trim(), 'ไม่มีคำที่มีภาพเรื่องราวในตัวกรองนี้');
win.setGridGradeFilter('all');
win.renderWordsGrid();

// 4. Check keyboard accessibility on .grid-storyboard-btn (Enter & Space keydown)
console.log('4. Checking keyboard listener on .grid-storyboard-btn...');
const sampleIdiom = filteredWords[0];
const card = win.createGridCardElement(sampleIdiom, 0, {});
const sbBtn = card.querySelector('.grid-storyboard-btn');
assert.ok(sbBtn, '.grid-storyboard-btn must exist on card back');

let modalOpened = false;
const origOpen = win.openIdiomStoryboard;
win.openIdiomStoryboard = () => { modalOpened = true; };

// Enter key
modalOpened = false;
let enterPrevented = false;
const enterEvent = new win.KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
Object.defineProperty(enterEvent, 'preventDefault', { value: () => { enterPrevented = true; } });
sbBtn.dispatchEvent(enterEvent);
assert.ok(modalOpened, 'Enter key on .grid-storyboard-btn must open storyboard modal');
assert.ok(enterPrevented, 'Enter key on .grid-storyboard-btn must call preventDefault()');

// Space key
modalOpened = false;
let spacePrevented = false;
const spaceEvent = new win.KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
Object.defineProperty(spaceEvent, 'preventDefault', { value: () => { spacePrevented = true; } });
sbBtn.dispatchEvent(spaceEvent);
assert.ok(modalOpened, 'Space key on .grid-storyboard-btn must open storyboard modal');
assert.ok(spacePrevented, 'Space key on .grid-storyboard-btn must call preventDefault()');

win.openIdiomStoryboard = origOpen;

// 5. Check #ws-type dropdown in worksheet modal includes storyboard-idioms
console.log('5. Checking worksheet modal #ws-type dropdown...');
assert.ok(win.ThaiVocabWorksheet, 'window.ThaiVocabWorksheet must be defined');
win.ThaiVocabWorksheet.openModal({ slug: 'idioms', title: 'สำนวนไทยมีคติ' }, filteredWords);
const wsTypeSelect = doc.getElementById('ws-type');
assert.ok(wsTypeSelect, '#ws-type select must exist');
const sbOption = wsTypeSelect.querySelector('option[value="storyboard-idioms"]');
assert.ok(sbOption, '<option value="storyboard-idioms"> must exist in #ws-type');
assert.match(sbOption.textContent, /ภาพเรื่องราว|เรื่องเล่าสำนวนไทย/, 'Option label must mention ภาพเรื่องราว');
win.ThaiVocabWorksheet.closeModal();

// 6. Check ThaiVocabWorksheet.generateStoryboardWorksheet(words, options)
console.log('6. Checking generateStoryboardWorksheet() output...');
assert.equal(typeof win.ThaiVocabWorksheet.generateStoryboardWorksheet, 'function',
  'generateStoryboardWorksheet must be exposed on window.ThaiVocabWorksheet');

const generatedHtml = win.ThaiVocabWorksheet.generateStoryboardWorksheet(filteredWords, {
  grade: 'all',
  catTitle: 'สำนวนไทยมีคติ',
  includeAnswerKey: true,
  count: 2
});

assert.equal(typeof generatedHtml, 'string', 'generateStoryboardWorksheet must return an HTML string');
assert.ok(generatedHtml.length > 500, 'Generated HTML must not be empty');

// Check header elements
assert.match(generatedHtml, /โรงเรียนบ้านคำไผ่/, 'Must contain school name in header');
assert.match(generatedHtml, /ชื่อ\s*-\s*สกุล/, 'Must contain student name field');
assert.match(generatedHtml, /ชั้น:/, 'Must contain class/grade field');
assert.match(generatedHtml, /เลขที่:/, 'Must contain student number field');
assert.match(generatedHtml, /คะแนน/, 'Must contain score box');

// Check panel images
const matchedIdiom = filteredWords.find((w) => generatedHtml.includes(w.word)) || sampleIdiom;
for (const img of matchedIdiom.images) {
  assert.ok(generatedHtml.includes(img.url), `Worksheet must include panel image url ${img.url}`);
}

// Check student prompt questions
assert.match(generatedHtml, /สำนวนไทยจากภาพนี้คือ/, 'Must contain prompt for idiom name');
assert.match(generatedHtml, /คติสอนใจ|ความหมายเปรียบเทียบ/, 'Must contain prompt for moral lesson');
assert.match(generatedHtml, /\.{5,}|dotted/, 'Must contain dotted lines for student answers');

// Check teacher answer key
assert.match(generatedHtml, /แผ่นเฉลยสำหรับครู/, 'Must contain teacher answer key sheet');
assert.ok(generatedHtml.includes(matchedIdiom.word), 'Teacher answer key must include idiom word');
assert.ok(generatedHtml.includes(matchedIdiom.meaning), 'Teacher answer key must include idiom meaning');

console.log('\n✅ All Thai Vocab Hub idiom worksheet & filter tests passed successfully!');
