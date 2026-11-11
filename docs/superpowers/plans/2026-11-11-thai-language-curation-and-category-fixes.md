# Thai Language Subject Curation & Category Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Audit, correct, and curate the entire Thai Language subject vocabulary database across all 17 categories in Thai Vocab Hub (3,400 words), fixing factual orthography bugs, categorical mismatches, nonsensical entries, and placeholder templates according to the Royal Society of Thailand (ราชบัณฑิตยสภา) and Ministry of Education K-6 curriculum standards.

**Architecture:** Update category JSON files in `public/games/thai/thai-vocab-hub/data/words/*.json`, then run `scripts/build-vocab-data.mjs` to synchronize `public/games/thai/thai-vocab-hub/data.js` and verify with rigorous linguistic rule assertions and automated game integration tests.

**Tech Stack:** Node.js (ESM), JSON data store, Vanilla JS Thai Vocab Hub engine, Playwright/JSDOM verification tools.

**Spec:** User instruction to plan comprehensive improvements for the Thai language subject, strictly focusing on:
1. จุดผิดพลาด (Factual/orthographic errors e.g. Devanagari characters, wrong spellings, wrong syllable/consonant rules)
2. ความไม่สมเหตุสมผล (Inconsistencies, syllabus phrases on flashcard chips, lazy placeholder examples)
3. ผิดหมวดหมู่ (Miscategorized words e.g. non-blends in blends, non-leading consonants in leading, verbs in classifiers)

## Global Constraints

- Exactly 200 words must be maintained per category across all 17 categories (Total 3,400 words).
- All words must be spelled according to the Royal Society of Thailand (พจนานุกรม ฉบับราชบัณฑิตยสถาน).
- Zero duplicate collisions across the 3,400 vocabulary bank without valid pedagogical rationale.
- Must pass `node scripts/build-vocab-data.mjs --check` (3,400 approved words, 200 per category).
- Must pass `node scripts/verify-game.mjs public/games/thai/thai-vocab-hub`.
- Synchronize documentation in `SystemOverview.tsx` (`versionHistory`) per DESIGN.md Rule 14.9.

## Review Focus

1. Verify that `synonyms.json` #114 no longer contains Devanagari script `ปवन` and is replaced with Thai script `ปวัน`.
2. Verify that `misspelled.json` #103 `กะปริบ` is corrected to `กะพริบ`.
3. Verify that in `spelling.json`, words ending in สระเกิน (อำ, ไอ, ใอ, เอา) like `น้ำ`, `ไถ่`, `ใคร่`, `เงา` are correctly classified under `แม่ ก กา` (NOT แม่กม, แม่เกย, or แม่เกอว).
4. Verify that in `blends.json`, non-clusters (`โศกา`, `มลาสา`, `โศก`) are removed and replaced with authentic consonant clusters (คำควบกล้ำ).
5. Verify that in `leading.json`, non-leading words (`สกปรก`, `สคราญ`, `ขโมย`, `เผชิญ`, `ผสม`) are removed and replaced with genuine leading consonant words (อักษรนำ).

---

### Task 1: Fix Critical Factual & Orthographic Bugs (แก้ไขจุดผิดพลาดทางภาษาศาสตร์และอักขรวิธีเร่งด่วน)

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/data/words/synonyms.json`
- Modify: `public/games/thai/thai-vocab-hub/data/words/misspelled.json`
- Modify: `public/games/thai/thai-vocab-hub/data/words/spelling.json`
- Modify: `public/games/thai/thai-vocab-hub/data/words/livedead.json`
- Test: `tests/thai-vocab-hub/orthography-facts.test.mjs`

**Interfaces:**
- Input: JSON files in `public/games/thai/thai-vocab-hub/data/words/`
- Output: Orthographically accurate JSON definitions

- [ ] **Step 1: Write failing test asserting zero foreign script characters, correct spelling of กะพริบ, and proper ก กา classification for สระเกิน**

```javascript
// tests/thai-vocab-hub/orthography-facts.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

test('no devanagari characters in synonyms', () => {
  const synonyms = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/words/synonyms.json', 'utf8'));
  const hasDevanagari = synonyms.some(w => /[\u0900-\u097F]/.test(w.word));
  assert.equal(hasDevanagari, false, 'Devanagari script found in synonyms');
});

test('กะพริบ is spelled correctly in misspelled.json', () => {
  const misspelled = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/words/misspelled.json', 'utf8'));
  const hasKaprip = misspelled.some(w => w.word === 'กะปริบ');
  assert.equal(hasKaprip, false, 'กะปริบ found instead of กะพริบ');
  const hasKaphrip = misspelled.some(w => w.word === 'กะพริบ');
  assert.equal(hasKaphrip, true, 'กะพริบ missing in misspelled');
});

test('spelling.json words with sara am, ai, ao belong to Mae Ko Ka', () => {
  const spelling = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/words/spelling.json', 'utf8'));
  const amInKom = spelling.some(w => w.meaning.includes('แม่กม') && w.word.includes('ำ'));
  const aiInKoey = spelling.some(w => w.meaning.includes('แม่เกย') && (w.word.includes('ไ') || w.word.includes('ใ')));
  const aoInKoeo = spelling.some(w => w.meaning.includes('แม่เกอว') && (w.word.includes('เ') && w.word.includes('า')));
  assert.equal(amInKom, false, 'Sara Am wrongly categorized as Mae Kom');
  assert.equal(aiInKoey, false, 'Sara Ai wrongly categorized as Mae Koey');
  assert.equal(aoInKoeo, false, 'Sara Ao wrongly categorized as Mae Koeo');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/thai-vocab-hub/orthography-facts.test.mjs`
Expected: FAIL on all 3 assertions

- [ ] **Step 3: Implement fixes in the 4 target JSON files**
  - In `synonyms.json`: Replace Devanagari `ปवन` with `ปวัน` (reading: `ปะ-วัน`, meaning: `ลม หรืออากาศที่พัดผ่าน (ยืมมาจากภาษาสันสกฤต pavana)`, example: `สายลมปวันพัดผ่านทิวสนส่งเสียงหวีดหวิวอย่างไพเราะ`).
  - In `misspelled.json`: Change `กะปริบ` ➔ `กะพริบ` (reading: `กะ-พริบ`, meaning: `หลับตาแล้วลืมตาขึ้นโดยเร็ว (มักเขียนผิดเป็น กระพริบ)`, example: `เด็กหญิงกะพริบตาถี่ๆ เมื่อมีฝุ่นละอองปลิวเข้าตา`).
  - In `spelling.json`: Replace words falsely mapped to แม่กม/เกย/เกอว (`น้ำ`, `ไถ่`, `ใคร่`, `เงา`) with authentic final consonant words:
    - Replace `น้ำ` in แม่กม ➔ `ทับทิม` (แม่กม: ทับ-ทิม)
    - Replace `ไถ่` in แม่เกย ➔ `เนย` (แม่เกย: เนย)
    - Replace `ใคร่` in แม่เกย ➔ `เฉย` (แม่เกย: เฉย)
    - Replace `เงา` in แม่เกอว ➔ `กริ้ว` หรือ `แก้ว` (แม่เกอว: แก้ว)
  - In `livedead.json`: Update meaning of `เงา` to correctly state: `"คำเป็น — ประสมสระเกิน (สระเอา) ออกเสียงคล้ายมีตัวสะกดแม่เกอว"`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/thai-vocab-hub/orthography-facts.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit Task 1**

```bash
git add public/games/thai/thai-vocab-hub/data/words/ tests/thai-vocab-hub/orthography-facts.test.mjs
git commit -m "fix(thai-vocab-hub): resolve critical factual and orthographic errors across vocabulary categories"
```

---

### Task 2: Correct Categorical Mismatches in Blends, Leading Consonants, Classifiers, and Homophones (แก้ไขคำผิดหมวดหมู่)

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/data/words/blends.json`
- Modify: `public/games/thai/thai-vocab-hub/data/words/leading.json`
- Modify: `public/games/thai/thai-vocab-hub/data/words/classifiers.json`
- Modify: `public/games/thai/thai-vocab-hub/data/words/homophones.json`
- Test: `tests/thai-vocab-hub/category-accuracy.test.mjs`

- [ ] **Step 1: Write failing test asserting zero non-clusters in blends, zero non-leading words in leading, zero verbs in classifiers, and valid homograph pairs**

```javascript
// tests/thai-vocab-hub/category-accuracy.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

test('blends only contain valid Thai consonant clusters', () => {
  const blends = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/words/blends.json', 'utf8'));
  const invalid = ['โศกา', 'มลาสา', 'โศก'];
  assert.equal(blends.some(w => invalid.includes(w.word)), false, 'Invalid non-cluster words found in blends');
});

test('leading consonants only contain genuine leading consonant words', () => {
  const leading = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/words/leading.json', 'utf8'));
  const invalid = ['สกปรก', 'สคราญ', 'ขโมย', 'เผชิญ', 'ผสม'];
  assert.equal(leading.some(w => invalid.includes(w.word)), false, 'Non-leading words found in leading');
});

test('classifiers do not contain verbs or non-classifier nouns', () => {
  const classifiers = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/words/classifiers.json', 'utf8'));
  const invalid = ['ตอนกิ่ง', 'ใบงาน'];
  assert.equal(classifiers.some(w => invalid.includes(w.word)), false, 'Verbs or nouns found in classifiers');
});

test('homophones contain accurate root word forms', () => {
  const homophones = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/words/homophones.json', 'utf8'));
  const invalid = ['หัวกรี', 'กะรีช้าง', 'เซ็นชื่อ', 'วิถีเซน', 'ทศกันต์'];
  assert.equal(homophones.some(w => invalid.includes(w.word)), false, 'Malformed homophone entries found');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/thai-vocab-hub/category-accuracy.test.mjs`
Expected: FAIL

- [ ] **Step 3: Implement category corrections in target files**
  - In `blends.json`:
    - Replace `โศกา` ➔ `กริ่ง` (กร ควบ)
    - Replace `มลาสา` ➔ `ขรุขระ` (ขร ควบ)
    - Replace `โศก` ➔ `โศกเศร้า` (ศร ควบไม่แท้)
  - In `leading.json`:
    - Replace `สกปรก` ➔ `กนก` (อักษรกลาง ก นำ น)
    - Replace `สคราญ` ➔ `สลัด` (อักษรสูง ส นำ ล)
    - Replace `ขโมย` ➔ `ขมุกขมัว` (อักษรสูง ข นำ ม)
    - Replace `เผชิญ` ➔ `ผลิต` (อักษรสูง ผ นำ ล)
    - Replace `ผสม` ➔ `ฉลาม` (อักษรสูง ฉ นำ ล)
  - In `classifiers.json`:
    - Replace `ตอนกิ่ง` ➔ `กิ่ง` (ลักษณนามของกิ่งไม้)
    - Replace `ใบงาน` ➔ `แผ่น` (ลักษณนามของกระดาษ ใบงาน)
  - In `homophones.json`:
    - Replace `หัวกรี` / `กะรีช้าง` ➔ `กรี` (คำพ้องรูป: กฺรี [กระดูกหัวกุ้ง] vs กะ-รี [ช้าง])
    - Replace `เซ็นชื่อ` / `วิถีเซน` ➔ `เซ็น` (ยืมจากอังกฤษ sign) vs `เซน` (นิกายเซน)
    - Replace `ทศกันต์` ➔ `ศุกร์` (วันศุกร์) คู่กับ `สุก` (ผลไม้สุก)

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/thai-vocab-hub/category-accuracy.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit Task 2**

```bash
git add public/games/thai/thai-vocab-hub/data/words/ tests/thai-vocab-hub/category-accuracy.test.mjs
git commit -m "fix(thai-vocab-hub): correct miscategorized words in blends, leading consonants, classifiers, and homophones"
```

---

### Task 3: Rationalize Syllabus Headings in `lesson` & `p5-focus` (ปรับปรุงคำยาวที่ไม่สมเหตุสมผล)

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/data/words/lesson.json`
- Modify: `public/games/thai/thai-vocab-hub/data/words/p5-focus.json`
- Test: `tests/thai-vocab-hub/word-length-rationality.test.mjs`

- [ ] **Step 1: Write test asserting no multi-phrase syllabus sentences in vocabulary flashcards**

```javascript
// tests/thai-vocab-hub/word-length-rationality.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

test('no long syllabus learning outcome phrases in lesson and p5-focus', () => {
  const lesson = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/words/lesson.json', 'utf8'));
  const p5Focus = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/words/p5-focus.json', 'utf8'));
  const longPhrases = [
    'การคิดอย่างมีวิจารณญาณ',
    'การคิดเชิงเหตุผล',
    'การคิดเชิงระบบ',
    'การรู้เท่าทันสื่อ',
    'ความปลอดภัยออนไลน์'
  ];
  const allWords = [...lesson, ...p5Focus].map(w => w.word);
  const foundLong = longPhrases.filter(p => allWords.includes(p));
  assert.equal(foundLong.length, 0, `Long syllabus phrases found: ${foundLong.join(', ')}`);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/thai-vocab-hub/word-length-rationality.test.mjs`
Expected: FAIL

- [ ] **Step 3: Replace long abstract phrases with authentic lesson vocabulary**
  - `การคิดอย่างมีวิจารณญาณ` ➔ `วิจารณญาณ` (คำศัพท์หลัก ป.5)
  - `การคิดเชิงเหตุผล` ➔ `เหตุผล` (คำศัพท์หลัก ป.5)
  - `การคิดเชิงระบบ` ➔ `ระบบ` (คำศัพท์หลัก ป.5)
  - `การรู้เท่าทันสื่อ` ➔ `วิเคราะห์` (คำศัพท์หลัก ป.5)
  - `ความปลอดภัยออนไลน์` ➔ `ปลอดภัย` (คำศัพท์หลัก ป.5)

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/thai-vocab-hub/word-length-rationality.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit Task 3**

```bash
git add public/games/thai/thai-vocab-hub/data/words/ tests/thai-vocab-hub/word-length-rationality.test.mjs
git commit -m "fix(thai-vocab-hub): rationalize long syllabus outcome phrases into authentic lesson words"
```

---

### Task 4: Complete Curation of Placeholder Examples & Antonym Definitions (ขจัดแม่แบบซ้ำซากและเติมความหมายสมบูรณ์)

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/data/words/antonyms.json`
- Modify: `public/games/thai/thai-vocab-hub/data/words/*.json` (all remaining categories with placeholders)
- Test: `tests/thai-vocab-hub/zero-placeholders.test.mjs`

- [ ] **Step 1: Write test asserting zero placeholder sentences across all 17 categories**

```javascript
// tests/thai-vocab-hub/zero-placeholders.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';

test('zero placeholder example sentences across all 17 categories', () => {
  const dir = 'public/games/thai/thai-vocab-hub/data/words';
  const categories = JSON.parse(fs.readFileSync('public/games/thai/thai-vocab-hub/data/categories.json', 'utf8'));
  
  let totalPlaceholders = 0;
  for (const cat of categories) {
    const items = JSON.parse(fs.readFileSync(`${dir}/${cat.slug}.json`, 'utf8'));
    const count = items.filter(w => w.example && w.example.includes('คุณครูสอนให้นักเรียนเข้าใจความหมายของ')).length;
    totalPlaceholders += count;
  }
  assert.equal(totalPlaceholders, 0, `Found ${totalPlaceholders} placeholder examples remaining`);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/thai-vocab-hub/zero-placeholders.test.mjs`
Expected: FAIL with ~1,900 placeholders found

- [ ] **Step 3: Script-curate and replace all placeholder sentences with context-rich, educational Thai classroom sentences**
  - Create a modular generator/curation script that maps each word's POS and meaning to a natural, authentic sentence.
  - In `antonyms.json`: Replace generic definitions (`คำตรงข้าม: คู่ตรงข้ามกับ...`) with standard descriptive meanings.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/thai-vocab-hub/zero-placeholders.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit Task 4**

```bash
git add public/games/thai/thai-vocab-hub/data/words/ tests/thai-vocab-hub/zero-placeholders.test.mjs
git commit -m "fix(thai-vocab-hub): replace 1,900+ placeholder examples with authentic educational sentences"
```

---

### Task 5: Compilation, Zero-Collision Verification, and Regression Testing

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/data.js` (rebuilt via script)
- Modify: `src/components/admin/system/SystemOverview.tsx` (version history sync)

- [ ] **Step 1: Rebuild data.js**

Run: `pnpm build:vocab`
Expected: 17 categories, 3,400 approved words written to `data.js`

- [ ] **Step 2: Verify zero duplicate collisions across the 3,400 dictionary**

Run: `node scripts/build-vocab-data.mjs --check`
Expected: 200 approved words per category, 0 warnings

- [ ] **Step 3: Run game integration verifier**

Run: `node scripts/verify-game.mjs public/games/thai/thai-vocab-hub`
Expected: Passes all 12 checks (Score submit, SDK initialization, DOM render, 16:9 Cover, Lifecycle, Accessibility)

- [ ] **Step 4: Update version history in SystemOverview.tsx**
  - Add version `v2.8.15` entry documenting comprehensive curation of Thai language subject (orthography fixes, category cleansing, syllabus phrase rationalization, zero placeholders).

- [ ] **Step 5: Commit & Push to origin/main**

```bash
git add public/games/thai/thai-vocab-hub/data.js src/components/admin/system/SystemOverview.tsx docs/superpowers/plans/
git commit -m "feat(thai-vocab-hub): complete Thai language subject deep curation across all 17 categories"
git push origin main
```
