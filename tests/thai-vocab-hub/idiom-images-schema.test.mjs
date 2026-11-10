import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const HUB_DIR = resolve(ROOT, 'public/games/thai/thai-vocab-hub');

console.log('🧪 Starting Thai Vocab Hub idiom images schema & validation tests...\n');

// 1. Static contract check on validate-vocab.mjs: must allow slug === 'royal' || slug === 'idioms'
const validateVocabSrc = readFileSync(resolve(ROOT, 'scripts/validate-vocab.mjs'), 'utf8');
assert.ok(
  /slug\s*===\s*['"]royal['"]\s*\|\|\s*slug\s*===\s*['"]idioms['"]|slug\s*!==\s*['"]royal['"]\s*&&\s*slug\s*!==\s*['"]idioms['"]/.test(validateVocabSrc),
  'validate-vocab.mjs must allow idioms for images (currently limits pilot images strictly to slug === royal)'
);

// Dynamically import validateWordItem and sanitizeWordItem
const { validateWordItem } = await import('../../scripts/validate-vocab.mjs');
const { sanitizeWordItem } = await import('../../scripts/build-vocab-data.mjs');

assert.equal(typeof validateWordItem, 'function', 'validateWordItem must be exported from validate-vocab.mjs');
assert.equal(typeof sanitizeWordItem, 'function', 'sanitizeWordItem must be exported from build-vocab-data.mjs');

// 2. Test: validateWordItem allows slug === 'idioms' with single image and multi-image array
const validIdiomBase = {
  word: 'ดินพอกหางหมู',
  reading: 'ดิน-พอก-หาง-หมู',
  meaning: 'การผัดวันประกันพรุ่งจนงานคั่งค้างสะสมมากขึ้นเรื่อย ๆ จนจัดการได้ยาก',
  grade: 'ป.4',
  content_status: 'approved',
  category_evidence: 'สำนวนไทยมาตรฐาน'
};

// Existing dummy file in hub for path existence verification
assert.ok(existsSync(join(HUB_DIR, 'index.html')), 'index.html exists in hub');

const validStoryboardItem = {
  ...validIdiomBase,
  image_url: 'index.html',
  image_alt: 'ภาพหน้าแรกของเกม',
  images: [
    {
      step: 1,
      phase: 'ที่มาเปรียบเทียบ',
      url: 'index.html',
      alt: 'การเปรียบเทียบดินพอกหางหมู',
      caption: 'หมูปล่อยให้ดินโคลนเกาะหางจนหนาหนัก'
    },
    {
      step: 2,
      phase: 'การกระทำ/ผลลัพธ์',
      url: 'index.html',
      alt: 'คนผัดผ่อนการทำงาน',
      caption: 'งานที่สะสมไม่ยอมทำกลายเป็นปัญหาใหญ่'
    },
    {
      step: 3,
      phase: 'คติสอนใจจริง',
      url: 'index.html',
      alt: 'ทำให้เสร็จทันที',
      caption: 'ควรทำงานให้เสร็จตรงเวลา ไม่ผัดวันประกันพรุ่ง'
    }
  ]
};

const validRes = validateWordItem(validStoryboardItem, 'idioms', 'idioms[0]', { root: ROOT });
assert.deepEqual(validRes.errors, [], 'Valid idiom with storyboard images must have no errors');

// 3. Test: Reject when slug is not royal or idioms
const otherSlugItem = { ...validStoryboardItem };
const otherSlugRes = validateWordItem(otherSlugItem, 'misspelled', 'misspelled[0]', { root: ROOT });
assert.ok(
  otherSlugRes.errors.some((e) => e.includes('pilot ภาพประกอบอนุญาตเฉพาะหมวด royal หรือ idioms')),
  'Images on non-royal / non-idioms must produce an error'
);

// 4. Test: Reject when content_status is not approved
const quarantinedItem = { ...validStoryboardItem, content_status: 'quarantined', review_reason: 'อยู่ระหว่างตรวจ' };
const quarantinedRes = validateWordItem(quarantinedItem, 'idioms', 'idioms[0]', { root: ROOT });
assert.ok(
  quarantinedRes.errors.some((e) => e.includes('ภาพประกอบต้องอยู่กับคำ approved เท่านั้น')),
  'Images on quarantined items must produce an error'
);

// 5. Test: Validate images schema fields
// 5a. step must be number
const badStepItem = {
  ...validIdiomBase,
  images: [{ step: 'one', phase: 'ที่มา', url: 'index.html', alt: 'alt', caption: 'caption' }]
};
const badStepRes = validateWordItem(badStepItem, 'idioms', 'idioms[0]', { root: ROOT });
assert.ok(badStepRes.errors.some((e) => e.includes('step ต้องเป็น number')), 'Missing or invalid step must produce error');

// 5b. phase must be non-empty string
const badPhaseItem = {
  ...validIdiomBase,
  images: [{ step: 1, phase: '   ', url: 'index.html', alt: 'alt', caption: 'caption' }]
};
const badPhaseRes = validateWordItem(badPhaseItem, 'idioms', 'idioms[0]', { root: ROOT });
assert.ok(badPhaseRes.errors.some((e) => e.includes('phase ว่าง')), 'Empty phase must produce error');

// 5c. url must be non-empty string
const badUrlItem = {
  ...validIdiomBase,
  images: [{ step: 1, phase: 'ที่มา', url: '', alt: 'alt', caption: 'caption' }]
};
const badUrlRes = validateWordItem(badUrlItem, 'idioms', 'idioms[0]', { root: ROOT });
assert.ok(badUrlRes.errors.some((e) => e.includes('url ว่าง')), 'Empty url must produce error');

// 5d. alt must be non-empty string
const badAltItem = {
  ...validIdiomBase,
  images: [{ step: 1, phase: 'ที่มา', url: 'index.html', alt: '', caption: 'caption' }]
};
const badAltRes = validateWordItem(badAltItem, 'idioms', 'idioms[0]', { root: ROOT });
assert.ok(badAltRes.errors.some((e) => e.includes('alt ว่าง')), 'Empty alt must produce error');

// 5e. caption must be non-empty string
const badCaptionItem = {
  ...validIdiomBase,
  images: [{ step: 1, phase: 'ที่มา', url: 'index.html', alt: 'alt', caption: '   ' }]
};
const badCaptionRes = validateWordItem(badCaptionItem, 'idioms', 'idioms[0]', { root: ROOT });
assert.ok(badCaptionRes.errors.some((e) => e.includes('caption ว่าง')), 'Empty caption must produce error');

// 6. Test: Referenced local files must exist
const missingFileItem = {
  ...validIdiomBase,
  images: [{ step: 1, phase: 'ที่มา', url: 'assets/idiom-visuals/non-existent-image-404.webp', alt: 'alt', caption: 'caption' }]
};
const missingFileRes = validateWordItem(missingFileItem, 'idioms', 'idioms[0]', { root: ROOT });
assert.ok(
  missingFileRes.errors.some((e) => e.includes('ไม่พบไฟล์ assets/idiom-visuals/non-existent-image-404.webp')),
  'Missing image file must produce error'
);

// 7. Test: Existing dataset files with images in data/words/*.json must reference existing files
const idiomsJsonPath = resolve(ROOT, 'public/games/thai/thai-vocab-hub/data/words/idioms.json');
if (existsSync(idiomsJsonPath)) {
  const idiomsData = JSON.parse(readFileSync(idiomsJsonPath, 'utf8'));
  for (const [idx, item] of idiomsData.entries()) {
    if (item.image_url) {
      assert.ok(
        existsSync(resolve(HUB_DIR, item.image_url)),
        `idioms[${idx}] image_url file must exist: ${item.image_url}`
      );
    }
    if (Array.isArray(item.images)) {
      for (const [imgIdx, img] of item.images.entries()) {
        assert.ok(
          existsSync(resolve(HUB_DIR, img.url)),
          `idioms[${idx}].images[${imgIdx}] file must exist: ${img.url}`
        );
      }
    }
  }
}

// 8. Test: build-vocab-data preserves images property
const sanitized = sanitizeWordItem({
  word: 'ดินพอกหางหมู',
  reading: 'ดิน-พอก-หาง-หมู',
  meaning: 'การผัดวันประกันพรุ่ง',
  content_status: 'approved',
  review_reason: 'reviewed',
  category_evidence: 'พจนานุกรม',
  duplicate_rationale: 'unique idiom',
  image_url: 'assets/idiom-visuals/pig-1.webp',
  image_alt: 'หมู',
  images: [{ step: 1, phase: 'ที่มา', url: 'assets/idiom-visuals/pig-1.webp', alt: 'หมู', caption: 'ดินพอก' }]
});

assert.equal(sanitized.content_status, undefined, 'content_status must be stripped');
assert.equal(sanitized.review_reason, undefined, 'review_reason must be stripped');
assert.equal(sanitized.category_evidence, undefined, 'category_evidence must be stripped');
assert.equal(sanitized.duplicate_rationale, undefined, 'duplicate_rationale must be stripped');
assert.equal(sanitized.image_url, 'assets/idiom-visuals/pig-1.webp', 'image_url must be preserved');
assert.equal(sanitized.image_alt, 'หมู', 'image_alt must be preserved');
assert.ok(Array.isArray(sanitized.images), 'images array must be preserved');
assert.equal(sanitized.images.length, 1, 'images array elements must be preserved');

console.log('✅ All idiom images schema and validation tests passed successfully!\n');
