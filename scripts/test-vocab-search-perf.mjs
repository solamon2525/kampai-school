import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const HUB_DIR = path.join(REPO_ROOT, 'public/games/thai/thai-vocab-hub');

console.log('🧪 Starting Thai Vocab Hub Search & Progressive Chunking Performance Verification...\n');

// ────────────────────────────────────────────────────────────────────────────
// Suite 1: Static CSS and JavaScript Code Inspection
// ────────────────────────────────────────────────────────────────────────────
console.log('--- [Test 1] Static Code Inspection: CSS Custom Properties & Search Indexing ---');

const cssPath = path.join(HUB_DIR, 'style.css');
assert(fs.existsSync(cssPath), 'style.css must exist');
const cssContent = fs.readFileSync(cssPath, 'utf8');

assert(
  cssContent.includes('--vocab-text-scale'),
  'style.css must declare and utilize --vocab-text-scale custom property'
);
assert(
  cssContent.includes('.hub-search-word') && cssContent.includes('var(--vocab-text-scale'),
  '.hub-search-word in style.css must use --vocab-text-scale'
);

const gamePath = path.join(HUB_DIR, 'game.js');
assert(fs.existsSync(gamePath), 'game.js must exist');
const gameContent = fs.readFileSync(gamePath, 'utf8');

assert(
  gameContent.includes('buildVocabSearchIndex') && gameContent.includes('_vocabSearchIndex'),
  'game.js must define buildVocabSearchIndex and set window._vocabSearchIndex'
);
assert(
  gameContent.includes('renderGenId'),
  'game.js must declare and manage renderGenId cancellation token'
);
assert(
  gameContent.includes('DocumentFragment') || gameContent.includes('createDocumentFragment'),
  'game.js must use DocumentFragment for batched DOM insertions'
);

console.log('✓ PASS: Static code requirements verified.\n');

// ────────────────────────────────────────────────────────────────────────────
// Suite 2: JSDOM Setup & Search Index Population
// ────────────────────────────────────────────────────────────────────────────
console.log('--- [Test 2] JSDOM Setup & Search Index Initialization ---');

const { JSDOM, VirtualConsole } = await import('jsdom');

const htmlContent = fs.readFileSync(path.join(HUB_DIR, 'index.html'), 'utf8');
const sdkContent = fs.readFileSync(path.join(REPO_ROOT, 'public/games/kampai-sdk.js'), 'utf8');
const configContent = fs.readFileSync(path.join(HUB_DIR, 'config.js'), 'utf8');
const dataContent = fs.readFileSync(path.join(HUB_DIR, 'data.js'), 'utf8');

// Controlled RAF queue for step-by-step frame testing
const rafQueue = [];
let nextRafId = 1;
const rafMap = new Map();

const storageStore = new Map();
const storageMock = {
  getItem: (key) => storageStore.get(key) || null,
  setItem: (key, val) => storageStore.set(key, String(val)),
  removeItem: (key) => storageStore.delete(key),
  clear: () => storageStore.clear(),
};

const vc = new VirtualConsole();
vc.on('jsdomError', (e) => {
  if (!/Not implemented/i.test(e.message || String(e))) {
    console.warn('[JSDOM]', e.message);
  }
});

const dom = new JSDOM(htmlContent, {
  url: 'https://kampai.local/games/thai/thai-vocab-hub/index.html?embed=1',
  runScripts: 'outside-only',
  pretendToBeVisual: true,
  virtualConsole: vc,
});

const win = dom.window;
Object.defineProperty(win, 'localStorage', { value: storageMock, configurable: true });
win.matchMedia = () => ({
  matches: false,
  media: '',
  onchange: null,
  addEventListener() {},
  removeEventListener() {},
  addListener() {},
  removeListener() {},
  dispatchEvent() { return false; },
});
win.speechSynthesis = {
  speak() {},
  cancel() {},
  pause() {},
  resume() {},
  getVoices() { return []; },
};
win.AudioContext = function () {
  return {
    createOscillator: () => ({ connect() {}, start() {}, stop() {}, frequency: { setValueAtTime() {} } }),
    createGain: () => ({ connect() {}, gain: { setValueAtTime() {} } }),
    currentTime: 0,
    state: 'running',
    resume() {},
    close() { return Promise.resolve(); },
  };
};

win.requestAnimationFrame = (cb) => {
  const id = nextRafId++;
  rafMap.set(id, cb);
  rafQueue.push({ id, cb });
  return id;
};
win.cancelAnimationFrame = (id) => {
  rafMap.delete(id);
};

win.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Evaluate scripts in order
win.eval(sdkContent);
win.eval(configContent);
win.eval(dataContent);
win.eval(gameContent);

if (win.document.readyState === 'loading') {
  win.document.dispatchEvent(new win.Event('DOMContentLoaded'));
}

// Flush initial startup RAFs
while (rafQueue.length > 0) {
  const item = rafQueue.shift();
  item.cb();
}

assert(win._vocabSearchIndex, 'window._vocabSearchIndex must be created');
const totalIndexed = win._vocabSearchIndex.items.length;
console.log(`Indexed ${totalIndexed} words across categories in window._vocabSearchIndex.`);
assert(totalIndexed >= 2400, `Expected at least 2,400 indexed words, got ${totalIndexed}`);

console.log('✓ PASS: Search index initialized with full vocabulary.\n');

// ────────────────────────────────────────────────────────────────────────────
// Suite 3: Search Latency Benchmark (< 5ms over 2,400–3,200 items)
// ────────────────────────────────────────────────────────────────────────────
console.log('--- [Test 3] Search Filtering Latency Benchmark (< 5ms budget) ---');

const testQueries = [
  'ก',
  'กะ',
  'คม',
  'ปลา',
  'น้ำ',
  'ใจ',
  'พระ',
  'ราช',
  'กริยา',
  'คำนาม',
  'ป.4',
  'ป.5',
  'ป.6',
  'สม',
  'ตา',
  'ทอง',
  'นก',
  'ความหมาย',
  'เรียน',
  'ไม่พบคำนี้แน่นอน999'
];

const latencies = [];

for (const q of testQueries) {
  const t0 = performance.now();
  const results = win._vocabSearchIndex.search(q);
  const dt = performance.now() - t0;
  latencies.push(dt);

  // Each query must individually complete in < 5ms
  assert(
    dt < 5.0,
    `Search query "${q}" took ${dt.toFixed(3)}ms, which exceeds the 5.0ms budget!`
  );
}

const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
const maxLatency = Math.max(...latencies);

console.log(`Average search query latency: ${avgLatency.toFixed(3)}ms`);
console.log(`Max search query latency: ${maxLatency.toFixed(3)}ms (Budget: < 5.000ms)`);

assert(
  avgLatency < 2.0,
  `Expected average search latency < 2ms with indexing, got ${avgLatency.toFixed(3)}ms`
);
assert(
  maxLatency < 5.0,
  `Expected max search latency < 5ms, got ${maxLatency.toFixed(3)}ms`
);

// Verify search accuracy
const kaResults = win._vocabSearchIndex.search('กะ');
assert(kaResults.length > 0, 'Search for "กะ" must return matching entries');
assert(
  kaResults.every(item => item.searchStr.includes('กะ')),
  'All returned results must contain search term'
);

// Verify consonant and grade filter options
const gradeP4Results = win._vocabSearchIndex.search('', { grade: 'ป.4' });
assert(gradeP4Results.length > 0, 'Grade filtering must return entries');
assert(
  gradeP4Results.every(item => item.grade === 'ป.4'),
  'All returned results must match grade ป.4'
);

console.log('✓ PASS: Search latency benchmark and accuracy verified.\n');

// ────────────────────────────────────────────────────────────────────────────
// Suite 4: Progressive Chunked Rendering (Initial 24 immediate, rest in RAF chunks)
// ────────────────────────────────────────────────────────────────────────────
console.log('--- [Test 4] Progressive Chunked Rendering (24 Immediate + RAF Chunks) ---');

// Create mock 100 words
const mock100Words = Array.from({ length: 100 }, (_, i) => ({
  word: `คำทดสอบ${i + 1}`,
  reading: `คำ-ทด-สอบ-${i + 1}`,
  meaning: `ความหมายจำลองคำที่ ${i + 1}`,
  pos: i % 2 === 0 ? 'คำนาม' : 'คำกริยา',
  grade: 'ป.4',
  categorySlug: 'misspelled',
  categoryTitle: 'คำที่มักเขียนผิด',
  categoryIcon: '✍️'
}));

const container = win.document.createElement('div');
container.className = 'hub-search-grid';
win.document.body.appendChild(container);

rafQueue.length = 0;

// Execute render
win.renderSearchWordCards(mock100Words, container);

// 4.1 First frame (synchronous): Exactly 24 cards rendered immediately
const immediateCount = container.querySelectorAll('.hub-search-card').length;
console.log(`Initial immediate cards rendered: ${immediateCount} (Expected: 24)`);
assert.strictEqual(
  immediateCount,
  24,
  `First Contentful Paint must render exactly initial batch of 24 cards synchronously! Got ${immediateCount}`
);

// 4.2 Must have scheduled next chunk in RAF
assert(
  rafQueue.length > 0,
  'Remaining cards must be scheduled via requestAnimationFrame'
);

// Drain frame 2 (24 -> 48)
const step1 = rafQueue.shift();
step1.cb();
const countAfterFrame2 = container.querySelectorAll('.hub-search-card').length;
console.log(`Cards after RAF chunk 1: ${countAfterFrame2} (Expected: 48)`);
assert.strictEqual(countAfterFrame2, 48, 'After 1 RAF, total cards must be 48');

// Drain frame 3 (48 -> 72)
const step2 = rafQueue.shift();
step2.cb();
const countAfterFrame3 = container.querySelectorAll('.hub-search-card').length;
console.log(`Cards after RAF chunk 2: ${countAfterFrame3} (Expected: 72)`);
assert.strictEqual(countAfterFrame3, 72, 'After 2 RAFs, total cards must be 72');

// Drain frame 4 (72 -> 96)
const step3 = rafQueue.shift();
step3.cb();
const countAfterFrame4 = container.querySelectorAll('.hub-search-card').length;
console.log(`Cards after RAF chunk 3: ${countAfterFrame4} (Expected: 96)`);
assert.strictEqual(countAfterFrame4, 96, 'After 3 RAFs, total cards must be 96');

// Drain frame 5 (96 -> 100)
const step4 = rafQueue.shift();
step4.cb();
const countAfterFrame5 = container.querySelectorAll('.hub-search-card').length;
console.log(`Cards after RAF chunk 4 (Final): ${countAfterFrame5} (Expected: 100)`);
assert.strictEqual(countAfterFrame5, 100, 'After final chunk, total cards must be 100');

// 4.3 Test list <= 30 items: renders all immediately without scheduling RAF
const mock15Words = mock100Words.slice(0, 15);
rafQueue.length = 0;
win.renderSearchWordCards(mock15Words, container);
const smallListCount = container.querySelectorAll('.hub-search-card').length;
console.log(`Small list (<=30) immediate count: ${smallListCount} (Expected: 15)`);
assert.strictEqual(smallListCount, 15, 'Small lists (<=30) must render completely without chunking');
assert.strictEqual(rafQueue.length, 0, 'No RAF chunks should be scheduled for small lists <= 30');

console.log('✓ PASS: Progressive chunked rendering batches and RAF execution verified.\n');

// ────────────────────────────────────────────────────────────────────────────
// Suite 5: Render Generation Token Cancellation (renderGenId)
// ────────────────────────────────────────────────────────────────────────────
console.log('--- [Test 5] Render Generation Token Cancellation on Rapid Query Changes ---');

rafQueue.length = 0;
container.innerHTML = '';

// Start rendering Search Query A (100 words)
const initialGenId = win.getVocabRenderGenId ? win.getVocabRenderGenId() : 0;
win.renderSearchWordCards(mock100Words, container);
const genAfterA = win.getVocabRenderGenId();
assert(genAfterA > initialGenId, 'renderGenId must increment on each render start');

assert.strictEqual(container.querySelectorAll('.hub-search-card').length, 24);
assert.strictEqual(rafQueue.length, 1, 'Query A scheduled chunk 1');
const pendingChunkQueryA = rafQueue.shift(); // Hold callback from Query A

// User rapidly types a new query -> Trigger Search Query B (50 words) before Query A finishes
const mock50Words = mock100Words.slice(0, 50).map(w => ({ ...w, word: `คำค้นบี_${w.word}` }));
win.renderSearchWordCards(mock50Words, container);
const genAfterB = win.getVocabRenderGenId();
assert(genAfterB > genAfterA, 'renderGenId must increment on Query B');

// Container now shows Query B initial batch (24 cards)
assert.strictEqual(container.querySelectorAll('.hub-search-card').length, 24);

// Now execute the stale chunk callback from Query A
// It MUST abort because thisGen !== renderGenId
pendingChunkQueryA.cb();

// Verify no cards from Query A were appended
const countAfterStaleExecution = container.querySelectorAll('.hub-search-card').length;
console.log(`Card count after executing cancelled Query A chunk: ${countAfterStaleExecution} (Expected: 24 from Query B)`);
assert.strictEqual(
  countAfterStaleExecution,
  24,
  'Cancelled RAF callback from prior generation must not mutate DOM or append stale cards'
);

// Drain remaining Query B chunks
while (rafQueue.length > 0) {
  const item = rafQueue.shift();
  item.cb();
}

assert.strictEqual(
  container.querySelectorAll('.hub-search-card').length,
  50,
  'Query B must finish cleanly with 50 cards total'
);

console.log('✓ PASS: In-flight chunk cancellation via renderGenId verified.\n');

// ────────────────────────────────────────────────────────────────────────────
// Suite 6: Font-size Slider CSS Variable Setting (No DOM Node Traversals)
// ────────────────────────────────────────────────────────────────────────────
console.log('--- [Test 6] Font-Size Slider CSS Variable Setting ---');

const slider = win.document.getElementById('tvh-fontsize-slider');
if (slider) {
  slider.value = '1.20';
  slider.dispatchEvent(new win.Event('input'));

  const rootScale = win.document.documentElement.style.getPropertyValue('--vocab-text-scale');
  console.log(`Root --vocab-text-scale set to: "${rootScale}"`);
  assert.strictEqual(rootScale, '1.2', '--vocab-text-scale must be updated to slider value');

  const wordsGrid = win.document.getElementById('words-grid');
  if (wordsGrid) {
    const gridScale = wordsGrid.style.getPropertyValue('--vocab-text-scale');
    assert.strictEqual(gridScale, '1.2', '#words-grid --vocab-text-scale must also reflect scale');
  }
}

console.log('✓ PASS: Font-size slider dynamically updates CSS custom properties.\n');

console.log('🎉 ALL SEARCH ACCELERATION & PROGRESSIVE CHUNKING TESTS PASSED SUCCESSFULLY!');
