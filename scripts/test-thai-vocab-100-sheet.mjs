import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const dataCode = fs.readFileSync(path.join(root, 'public/games/thai/thai-vocab-hub/data.js'), 'utf8');
const sheetCode = fs.readFileSync(path.join(root, 'public/games/thai/thai-vocab-hub/vocab-sheet-100.js'), 'utf8');

const ctx = { window: {}, Intl };
vm.runInNewContext(dataCode, ctx);
vm.runInNewContext(sheetCode, ctx);

const api = ctx.window.ThaiVocabSheet100;
assert.ok(api, 'ThaiVocabSheet100 must be defined on window');

// 1. Deduplication & quarantine filtering
const mockWords = {
  catA: [
    { word: 'กะเพรา', reading: 'กะ-เพรา', meaning: 'ผัก', grade: 'ป.4', content_status: 'approved' },
    { word: 'อนุญาต', reading: 'อะ-นุ-ยาด', meaning: 'ยินยอม', grade: 'ป.4', content_status: 'quarantined' },
  ],
  catB: [
    { word: ' กะเพรา ', reading: 'กะ-เพรา', meaning: 'ซ้ำ', grade: 'ป.5', content_status: 'approved' },
    { word: 'สังเกต', reading: 'สัง-เกด', meaning: 'ดู', grade: 'ป.5', content_status: 'approved' },
  ],
};
const mockCats = [{ slug: 'catA', title: 'หมวด A' }, { slug: 'catB', title: 'หมวด B' }];
const deduped = api.collectPoolWords(mockWords, mockCats, ['catA', 'catB'], 'all');
assert.equal(deduped.length, 2, 'must deduplicate trimmed words and exclude quarantined');

// 2. Balanced mixing from real GAME_DATA across 4 categories -> exact 100 unique words per set
const realPool = api.collectPoolWords(
  ctx.window.GAME_DATA.words,
  ctx.window.GAME_DATA.categories,
  ['misspelled', 'homophones', 'royal', 'blends'],
  'all'
);
assert.ok(realPool.length >= 400, 'real pool across 4 categories should have >= 400 words');
const built = api.build100WordSets({ pool: realPool, setSize: 100, setCount: 2, mixMode: 'balanced', seed: 12345 });
assert.equal(built.sets.length, 2);
assert.equal(built.sets[0].length, 100);
assert.equal(built.sets[1].length, 100);
const uniqueAcrossSets = new Set([...built.sets[0], ...built.sets[1]].map(w => w.word.trim()));
assert.equal(uniqueAcrossSets.size, 200, '2 sets of 100 must not repeat words when pool is large enough');

// 3. Small pool (< 100) graceful handling
const smallBuilt = api.build100WordSets({ pool: deduped, setSize: 100, setCount: 1, mixMode: 'random', seed: 99 });
assert.equal(smallBuilt.sets[0].length, 2, 'must return available words without undefined entries');

// 4. Typography sizing for short vs long words
const shortTypo = api.computeCellTypography('กะเพรา', { showReading: false });
const longTypo = api.computeCellTypography('ขี่ช้างจับตั๊กแตน', { showReading: false });
assert.notEqual(shortTypo.fontClass, longTypo.fontClass, 'long idioms must get a smaller font class than short words');

// Task 2: render100SheetDocument tests
const htmlPortrait = api.render100SheetDocument({
  sets: built.sets.slice(0, 1),
  categoriesSummary: '4 หมวด',
  grade: 'all',
  preset: '5x20-portrait',
  showNumbers: true,
  showReading: false,
  showCheckbox: true,
  includeTeacherKey: true,
  title: 'ชุดคำศัพท์ <script>alert(1)</script>',
});
assert.ok(htmlPortrait.includes('size: A4 portrait'), 'must include A4 portrait @page rule');
assert.ok(htmlPortrait.includes('vocab-100-table'), 'must include vocab-100-table');
assert.ok(htmlPortrait.includes('teacher-key-sheet'), 'must include teacher key sheet when enabled');
assert.ok(htmlPortrait.includes('window.print()'), 'must include print trigger');
assert.ok(!htmlPortrait.includes('<script>alert(1)</script>'), 'must sanitize title against XSS');
const cellMatches = htmlPortrait.match(/<td class="vocab-cell /g) || [];
assert.equal(cellMatches.length, 100, 'student sheet must render exactly 100 cells');

const htmlLandscape = api.render100SheetDocument({
  sets: built.sets.slice(0, 1),
  categoriesSummary: '4 หมวด',
  grade: 'ป.4',
  preset: '5x20-landscape',
  showNumbers: false,
  showReading: true,
  showCheckbox: false,
  includeTeacherKey: false,
  title: 'ชุดคำศัพท์ 100 คำ',
});
assert.ok(htmlLandscape.includes('size: A4 landscape'), 'must include A4 landscape @page rule');
assert.ok(!htmlLandscape.includes('<section class="sheet teacher-key-sheet">'), 'must omit teacher key when disabled');

console.log('✅ Task 1 & 2 unit tests passed!');
