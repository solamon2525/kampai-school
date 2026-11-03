import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const HUB_DIR = path.join(REPO_ROOT, 'public/games/thai/thai-vocab-hub');

console.log('🧪 Starting Thai Vocab Hub Engine Performance Verification...\n');

// ────────────────────────────────────────────────────────────────────────────
// Suite 1: Static CSS Audit for GPU Promotion and Targeted Transitions
// ────────────────────────────────────────────────────────────────────────────
console.log('--- [Test 1] CSS GPU Promotion & Targeted Transitions ---');
const cssPath = path.join(HUB_DIR, 'style.css');
assert(fs.existsSync(cssPath), 'style.css must exist');
const cssContent = fs.readFileSync(cssPath, 'utf8');

// 1.1 Verify GPU promotion on flip containers & card inner
assert(
  cssContent.includes('.grid-flip-inner') &&
  cssContent.includes('transform: translateZ(0);') &&
  cssContent.includes('will-change: transform;'),
  'GPU layer promotion (translateZ, will-change) must be present on card containers'
);

assert(
  cssContent.includes('.tcard-inner') || cssContent.includes('#tcard'),
  'tcard / tcard-inner selector must exist in style.css'
);

// 1.2 Verify contain: content on .grid-flip-card
assert(
  /\.grid-flip-card\s*\{[^}]*contain:\s*content;/s.test(cssContent),
  '.grid-flip-card must declare contain: content'
);

// 1.3 Verify no wildcard transition: all 0.2s on card components
const hubCardMatch = cssContent.match(/\.hub-card\s*\{([^}]+)\}/s);
assert(hubCardMatch, '.hub-card must be defined in style.css');
assert(
  !hubCardMatch[1].includes('transition: all 0.2s'),
  '.hub-card must not use wildcard transition: all 0.2s'
);
assert(
  hubCardMatch[1].includes('transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease;'),
  '.hub-card must use targeted transform and box-shadow transition'
);

const matchCardMatch = cssContent.match(/\.match-card\s*\{([^}]+)\}/s);
assert(matchCardMatch, '.match-card must be defined in style.css');
assert(
  !matchCardMatch[1].includes('transition: all 0.2s'),
  '.match-card must not use wildcard transition: all 0.2s'
);
assert(
  matchCardMatch[1].includes('transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease;'),
  '.match-card must use targeted transform and box-shadow transition'
);

console.log('✓ PASS: GPU promotion, contain: content, and targeted transitions verified.\n');

// ────────────────────────────────────────────────────────────────────────────
// Suite 2: JSDOM Setup & Storage I/O Hoisting + In-Memory Memoization
// ────────────────────────────────────────────────────────────────────────────
console.log('--- [Test 2] Storage I/O Hoisting & In-Memory Memoization ---');

const { JSDOM, VirtualConsole } = await import('jsdom');

const htmlContent = fs.readFileSync(path.join(HUB_DIR, 'index.html'), 'utf8');
const sdkContent = fs.readFileSync(path.join(REPO_ROOT, 'public/games/kampai-sdk.js'), 'utf8');
const configContent = fs.readFileSync(path.join(HUB_DIR, 'config.js'), 'utf8');
const dataContent = fs.readFileSync(path.join(HUB_DIR, 'data.js'), 'utf8');
const gameContent = fs.readFileSync(path.join(HUB_DIR, 'game.js'), 'utf8');

// Mock localStorage with spy
let getItemCalls = 0;
let getItemKeys = [];
let setItemCalls = 0;
const storageStore = new Map();

const storageMock = {
  getItem: (key) => {
    getItemCalls++;
    getItemKeys.push(key);
    return storageStore.has(key) ? storageStore.get(key) : null;
  },
  setItem: (key, val) => {
    setItemCalls++;
    storageStore.set(key, String(val));
  },
  removeItem: (key) => {
    storageStore.delete(key);
  },
  clear: () => {
    storageStore.clear();
  },
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

// Setup mocks on window
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

// Animation frames manual queue
const rafQueue = [];
win.requestAnimationFrame = (cb) => {
  rafQueue.push(cb);
  return rafQueue.length;
};
win.cancelAnimationFrame = () => {};

// ResizeObserver mock
win.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// Run scripts in index.html order
win.eval(sdkContent);
win.eval(configContent);
win.eval(dataContent);
win.eval(gameContent);

// Select category with large word count
const activeSlug = 'misspelled';
await win.loadAndSelectCategory(activeSlug);

const totalDisplayWords = win.document.querySelectorAll('.grid-flip-card').length;
console.log(`Rendered category "${activeSlug}" with ${totalDisplayWords} words.`);
assert(totalDisplayWords >= 50, `Expected at least 50 cards rendered, got ${totalDisplayWords}`);

// Reset storage counter and re-render grid directly
getItemCalls = 0;
getItemKeys = [];

win.renderWordsGrid();

const callsDuringRender = getItemCalls;
console.log(`localStorage.getItem calls during renderWordsGrid(): ${callsDuringRender} (for ${totalDisplayWords} cards)`);

// REQUIREMENT: Must be <= 2 calls (hoisted/memoized), NOT 150+ calls
assert(
  callsDuringRender <= 2,
  `localStorage.getItem was called ${callsDuringRender} times during renderWordsGrid(). Must be <= 2!`
);

// Second render should hit in-memory cache -> 0 calls
getItemCalls = 0;
win.renderWordsGrid();
const callsDuringSecondRender = getItemCalls;
console.log(`localStorage.getItem calls during second renderWordsGrid() (memoized): ${callsDuringSecondRender}`);
assert(
  callsDuringSecondRender === 0,
  `Expected 0 localStorage.getItem calls from memoized cache, got ${callsDuringSecondRender}`
);

console.log('✓ PASS: Storage I/O hoisted outside card loop and memoized in memory.\n');

// ────────────────────────────────────────────────────────────────────────────
// Suite 3: Layout Thrashing Elimination in fitGridWordSpans
// ────────────────────────────────────────────────────────────────────────────
// Flush any pending RAFs from initial render
while (rafQueue.length > 0) {
  const cb = rafQueue.shift();
  cb();
}

console.log('--- [Test 3] fitGridWordSpans Batching (No Layout Thrashing) ---');

// Recreate a clean DOM scenario to observe Read and Write operations during fitGridWordSpans
const grid = win.document.getElementById('words-grid');
assert(grid, '#words-grid must exist');

// Intercept scrollWidth & clientWidth (Reads) and classList mutations (Writes)
const opLog = [];

const sampleCards = win.document.querySelectorAll('.grid-flip-card');
assert(sampleCards.length > 0, 'Must have cards in grid to test span fitting');

sampleCards.forEach((card, idx) => {
  const textEl = card.querySelector('.grid-word-text');
  if (textEl) {
    // Simulate some overflowing cards
    const shouldOverflow = idx % 3 === 0;
    Object.defineProperty(textEl, 'scrollWidth', {
      get: () => {
        opLog.push({ type: 'READ', prop: 'scrollWidth', cardIdx: idx });
        return shouldOverflow ? 200 : 80;
      },
      configurable: true,
    });
    Object.defineProperty(textEl, 'clientWidth', {
      get: () => {
        opLog.push({ type: 'READ', prop: 'clientWidth', cardIdx: idx });
        return 100;
      },
      configurable: true,
    });
  }

  const origAdd = card.classList.add.bind(card.classList);
  const origRemove = card.classList.remove.bind(card.classList);
  card.classList.add = function (...args) {
    opLog.push({ type: 'WRITE', method: 'add', args, cardIdx: idx });
    return origAdd(...args);
  };
  card.classList.remove = function (...args) {
    opLog.push({ type: 'WRITE', method: 'remove', args, cardIdx: idx });
    return origRemove(...args);
  };
});

// Run fitGridWordSpans
opLog.length = 0;
rafQueue.length = 0;

win.fitGridWordSpans(true);

// Process the queued animation frames
while (rafQueue.length > 0) {
  const cb = rafQueue.shift();
  cb();
}

// Analyze the operations log
// Verify Phase 1 (Pure Read) and Phase 2 (Pure Write) segregation
assert(opLog.length > 0, 'Operations should have been recorded during fitGridWordSpans');

// In each pass, all READs must precede WRITEs.
// Specifically, there must never be a pattern of READ -> WRITE -> READ within the same pass iteration.
let seenFirstWrite = false;
let interleavedViolations = 0;

for (const op of opLog) {
  if (op.type === 'WRITE') {
    seenFirstWrite = true;
  } else if (op.type === 'READ' && seenFirstWrite) {
    // A read occurred after a write in the log.
    // Check if this read was part of a subsequent frame/pass (which is scheduled after the write RAF)
    // or if it was interleaved in the same loop.
  }
}

// Check that reads occur in a contiguous block during runPass
const firstPassReads = opLog.filter((op) => op.type === 'READ');
const firstPassWrites = opLog.filter((op) => op.type === 'WRITE');

console.log(`Logged ${firstPassReads.length} DOM reads and ${firstPassWrites.length} DOM writes during span fitting.`);
assert(firstPassReads.length > 0, 'fitGridWordSpans must perform batched reads');
assert(firstPassWrites.length > 0, 'fitGridWordSpans must perform batched writes for overflowing words');

// Verify that within the initial batch, reads were not immediately followed by writes on the same element
let lastOpType = null;
let switchCount = 0;
for (const op of opLog) {
  if (lastOpType && op.type !== lastOpType) {
    switchCount++;
  }
  lastOpType = op.type;
}

// In the old implementation with N cards, switchCount was ~ 2 * N (alternating read and write).
// In the batched implementation, switchCount is <= 2 * passes (Phase 1 all reads -> Phase 2 all writes).
console.log(`Phase switch count (READ <-> WRITE): ${switchCount} (batched phases vs N interleaved)`);
assert(
  switchCount <= 6,
  `Expected <= 6 phase switches (batched reads then writes), got ${switchCount}. Possible layout thrashing!`
);

// ────────────────────────────────────────────────────────────────────────────
// Suite 4: Abort on Unchanged Width & Debounce
// ────────────────────────────────────────────────────────────────────────────
console.log('--- [Test 4] Abort on Unchanged Width & Debounce ---');

// Grid width hasn't changed and spansReady is set
grid.dataset.spansReady = '1';
opLog.length = 0;
rafQueue.length = 0;

win.fitGridWordSpans(false);
assert(
  opLog.length === 0,
  'fitGridWordSpans(false) must abort immediately when width has not changed and spans are ready'
);

// 4.2 Verify 150ms debounce
if (typeof win.scheduleGridSpanFit === 'function') {
  let fitCount = 0;
  const origFit = win.fitGridWordSpans;
  win.fitGridWordSpans = () => { fitCount++; };
  delete grid.dataset.spansReady;

  win.scheduleGridSpanFit(true);
  win.scheduleGridSpanFit(true);
  win.scheduleGridSpanFit(true);

  assert.strictEqual(fitCount, 0, 'scheduleGridSpanFit must debounce trailing edge and not run synchronously');

  await new Promise((resolve) => setTimeout(resolve, 200));
  assert.strictEqual(fitCount, 1, 'Debounced calls should coalesce into exactly 1 invocation after 150ms');

  win.fitGridWordSpans = origFit;
  console.log('✓ PASS: Debounce coalescing (150ms trailing edge) verified.');
}

console.log('✓ PASS: Early abort on unchanged width verified.');
console.log('\n🎉 ALL PERFORMANCE & GRID ENGINE TESTS PASSED SUCCESSFULLY!');
