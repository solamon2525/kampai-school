import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const HUB_DIR = resolve(ROOT, 'public/games/thai/thai-vocab-hub');
const VISUALS_DIR = resolve(HUB_DIR, 'assets/idiom-visuals');
const IDIOMS_JSON_PATH = resolve(HUB_DIR, 'data/words/idioms.json');

console.log('🧪 Starting Thai Vocab Hub idiom assets integrity & dimensions tests...\n');

const EXPECTED_IDIOMS = [
  {
    word: 'ดินพอกหางหมู',
    panels: ['pig-tail-mud-1.webp', 'pig-tail-mud-2.webp', 'pig-tail-mud-3.webp']
  },
  {
    word: 'ขี่ช้างจับตั๊กแตน',
    panels: ['ride-elephant-catch-grasshopper-1.webp', 'ride-elephant-catch-grasshopper-2.webp', 'ride-elephant-catch-grasshopper-3.webp']
  },
  {
    word: 'น้ำขึ้นให้รีบตัก',
    panels: ['water-rise-fetch-1.webp', 'water-rise-fetch-2.webp', 'water-rise-fetch-3.webp']
  },
  {
    word: 'กระต่ายตื่นตูม',
    panels: ['rabbit-alarmist-1.webp', 'rabbit-alarmist-2.webp', 'rabbit-alarmist-3.webp']
  },
  {
    word: 'คางคกขึ้นวอ',
    panels: ['toad-on-palanquin-1.webp', 'toad-on-palanquin-2.webp', 'toad-on-palanquin-3.webp']
  },
  {
    word: 'รักดีหามจั่ว รักชั่วหามเสา',
    panels: ['good-carry-gable-1.webp', 'good-carry-gable-2.webp', 'good-carry-gable-3.webp']
  },
  {
    word: 'กบในกะลาครอบ',
    panels: ['frog-in-coconut-shell-1.webp', 'frog-in-coconut-shell-2.webp', 'frog-in-coconut-shell-3.webp']
  },
  {
    word: 'ชุบมือเปิบ',
    panels: ['dip-hand-take-food-1.webp', 'dip-hand-take-food-2.webp']
  },
  {
    word: 'ศรศิลป์ไม่กินกัน',
    panels: ['bow-arrow-not-eat-1.webp', 'bow-arrow-not-eat-2.webp']
  },
  {
    word: 'ชักแม่น้ำทั้งห้า',
    panels: ['draw-five-rivers-1.webp', 'draw-five-rivers-2.webp']
  }
];

const ALL_PANEL_FILES = EXPECTED_IDIOMS.flatMap((item) => item.panels);
assert.equal(ALL_PANEL_FILES.length, 27, 'Total expected storyboard panels count must be exactly 27');

// 1. Verify all 27 panel files exist on disk, are valid WebP, and < 200KB
console.log('1. Checking panel files on disk...');
for (const file of ALL_PANEL_FILES) {
  const filePath = join(VISUALS_DIR, file);
  assert.ok(existsSync(filePath), `Panel file must exist: ${file}`);

  const stat = statSync(filePath);
  assert.ok(stat.size > 500, `Panel file must not be empty or too small: ${file} (${stat.size} bytes)`);
  assert.ok(stat.size < 200 * 1024, `Panel file must be under 200KB: ${file} (${Math.round(stat.size / 1024)} KB)`);

  const meta = await sharp(filePath).metadata();
  assert.equal(meta.format, 'webp', `Panel file must be webp format: ${file}`);
  assert.equal(meta.width, 800, `Panel width must be 800: ${file}`);
  assert.equal(meta.height, 450, `Panel height must be 450 (16:9 ratio): ${file}`);
}
console.log(`   Checked ${ALL_PANEL_FILES.length} files successfully.`);

// 2. Verify metadata in idioms.json
console.log('\n2. Checking idioms.json storyboard metadata...');
assert.ok(existsSync(IDIOMS_JSON_PATH), 'idioms.json must exist');
const idiomsData = JSON.parse(readFileSync(IDIOMS_JSON_PATH, 'utf8'));

for (const expected of EXPECTED_IDIOMS) {
  const item = idiomsData.find((w) => w.word === expected.word);
  assert.ok(item, `Idiom "${expected.word}" must exist in idioms.json`);

  assert.ok(Array.isArray(item.images), `Idiom "${expected.word}" must have images array`);
  assert.equal(item.images.length, expected.panels.length, `Idiom "${expected.word}" must have ${expected.panels.length} panels`);

  // Check backward compatibility
  assert.equal(item.image_url, `assets/idiom-visuals/${expected.panels[0]}`, `Idiom "${expected.word}" image_url must match step 1`);
  assert.ok(typeof item.image_alt === 'string' && item.image_alt.trim().length > 0, `Idiom "${expected.word}" image_alt must be non-empty`);

  // Check each panel metadata
  expected.panels.forEach((panelFileName, idx) => {
    const img = item.images[idx];
    assert.ok(img, `Panel ${idx + 1} for "${expected.word}" must exist`);
    assert.equal(img.step, idx + 1, `Panel step must be ${idx + 1}`);
    assert.ok(typeof img.phase === 'string' && img.phase.trim().length > 0, `Panel phase must be non-empty string`);
    assert.equal(img.url, `assets/idiom-visuals/${panelFileName}`, `Panel url must match expected path`);
    assert.ok(typeof img.alt === 'string' && img.alt.trim().length > 0, `Panel alt must be non-empty string`);
    assert.ok(typeof img.caption === 'string' && img.caption.trim().length > 0, `Panel caption must be non-empty string`);
  });
}
console.log(`   Checked all 10 idioms metadata successfully.`);

console.log('\n✅ All idiom assets and metadata integrity checks PASSED!\n');
