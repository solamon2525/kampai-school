# แผนบูรณาการคลังคำศัพท์ใหม่ 4 แหล่ง สู่ระบบ Thai Vocab Hub

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สกัด คัดกรองคำซ้ำ ตรวจสอบคำผิด/ข้อผิดพลาดจาก OCR และผสานคำศัพท์ภาษาไทยใหม่จาก 4 แหล่งข้อมูล (บัญชีคำพื้นฐาน สพฐ. ป.1–ป.6 รวม ~4,049 รายการ) พร้อมเสริมองค์ความรู้ทางภาษาศาสตร์ (คำอ่าน, ความหมาย, ชนิดคำ, ตัวชี้วัด, อิโมจิ, ตัวอย่างประโยคแท้) และจำแนกเข้าสู่ 17 หมวดหมู่ใน Thai Vocab Hub อย่างเป็นระบบ

**Architecture:** ออกแบบกระบวนการทำงานแบบ Pipeline 5 ขั้นตอน:
1. **Extraction & Normalization:** สกัดคำจากไฟล์ `.docx` 3 ฉบับ และ PDF 11 หน้า ปรับรูปอักขระไทย (Vowel reordering, tone-mark reassociation)
2. **Deduplication Engine:** ตรวจเทียบกับคำเดิม 3,052 คำใน `data/words/*.json` — ถ้ามีอยู่แล้วให้ข้ามทันที (SKIP)
3. **Orthographic & Typo Audit:** ชำระคำผิด/คำเพี้ยนจาก OCR ตามพจนานุกรมฉบับราชบัณฑิตยสภา ๒๕๕๔ และคัดกรองคำขวัญ/วลีที่ไม่ใช่คำศัพท์
4. **Pedagogical Enrichment:** สังเคราะห์ข้อมูลประกอบการเรียนรู้ (คำอ่าน, ความหมายเข้าใจง่าย, ชนิดคำ, รหัสตัวชี้วัด, ประโยคตัวอย่างแท้ห้าม placeholder)
5. **Taxonomic Categorization & Build:** จัดหมวดหมู่เข้า 17 หมวด และคอมไพล์ลง `data.js` พร้อมทดสอบและตรวจสอบเกมครบ 12 มิติ

**Tech Stack:** Node.js (ESM), `date-fns`, Mocha/Node Test Runner (`node --test`), Thai Vocab Hub Engine (`public/games/thai/thai-vocab-hub`), Vite/React

**Spec:** คำสั่งผู้ใช้ (`/writing-plans นำคำศัพท์จากไฟล์ที่แนบ เข้าไปเพิ่มเติมใน หมวดคำศัพท์ พร้อมแผนในการผสาน ศัพท์+เนื้อหา ให้เป็นเนื้อเดียวกัน แยกประเภท ให้ถูกต้อง และตรวจสอบคำผิด ศัพท์ที่แนบไป ถ้าของเดิมมีอยู่แล้ว ให้ข้าม ถ้ายังไม่มีให้ผสานความรู้เข้าไป`), หลักสูตรแกนกลางกลุ่มสาระการเรียนรู้ภาษาไทย (สพฐ. ป.1–ป.6), และพจนานุกรมฉบับราชบัณฑิตยสภา ๒๕๕๔

## Global Constraints

- คำศัพท์เดิมที่มีอยู่แล้วในระบบ 17 หมวดหมู่ (3,052 คำเดิม) **ต้องข้าม (SKIP)** ไม่เพิ่มซ้ำซ้อน
- คำศัพท์ใหม่ทุกคำต้องสะกดถูกต้อง 100% ตามพจนานุกรมฉบับราชบัณฑิตยสภา ๒๕๕๔
- **ห้ามมีประโยคตัวอย่างแบบ Placeholder** (เช่น *"คุณครูสอนให้นักเรียนเข้าใจ..."*) ในคำศัพท์ที่เพิ่มใหม่แม้แต่คำเดียว
- โครงสร้างข้อมูลคำศัพท์ใหม่ต้องมีฟิลด์ครบถ้วน: `word`, `reading`, `meaning`, `pos`, `grade`, `indicator_code`, `emoji`, `example`, `content_status: "approved"`
- สคริปต์คอมไพล์ `scripts/build-vocab-data.mjs` ต้องทำงานผ่านฉลุย และสร้าง `data.js` ที่สมบูรณ์
- ระบบต้องผ่าน `node scripts/verify-game.mjs public/games/thai/thai-vocab-hub` ครบทั้ง 12 มิติ
- ชุดทดสอบ Unit Tests ใน `tests/thai-vocab-hub/` ต้องผ่าน 100%
- แอปรวมต้องผ่าน `pnpm build` สำเร็จโดยไม่มีข้อผิดพลาด

## Review Focus

1. **OCR Vowel Splitting / Floating Vowels:** คำที่ OCR สระลอยหรือขาดวิ่น (เช่น `กบในกะลำครอบ` ➔ `กบในกะลาครอบ`, `กิ้งกำไดท้อง` ➔ `กิ้งก่าได้ทอง`, `กำ ดดั` ➔ `กำจัด`, `จำ้ละหวนั่` ➔ `จ้าละหวั่น`) ต้องได้รับการแก้ไขให้เป็นคำภาษาไทยที่สมบูรณ์
2. **Strict Deduplication:** คำที่มีอยู่แล้วในระบบ (เช่น `กตัญญู`, `เกษตรกร`, `กลไก`, `มลพิษ`, `อุดมสมบูรณ์`) ต้องไม่ถูกเพิ่มซ้ำลงในหมวดเดิมหรือหมวดใหม่โดยไม่มีเหตุผล
3. **Accurate Category Placement:** คำศัพท์ต้องถูกจัดเข้าหมวดที่สอดคล้องกับคุณสมบัติทางภาษาศาสตร์ (เช่น คำราชาศัพท์ ➔ `royal`, คำควบกล้ำ ➔ `blends`, คำอักษรนำ ➔ `leading`, คำยืมภาษาต่างประเทศ ➔ `loanwords`)
4. **Authentic Example Sentences:** ทุกประโยคตัวอย่างต้องสะท้อนการใช้คำจริงในชีวิตประจำวันหรือบริบทการเรียนรู้ K-6 ไม่ใช้แพทเทิร์นสำเร็จรูป
5. **No Long Multi-word Competency Slogans:** วลีคำขวัญยาวหรือประโยคเต็มที่ไม่ใช่คำศัพท์เดี่ยว (เช่น `ชาติไก่ชนขนหัวไม่ต้องการ`, `ชาติเสือจับเนื้อกินเอง`) ต้องคัดกรองไปยังหมวดสำนวน (`idioms`) หรือคัดออก

---

### Task 1: สร้าง Pipeline สกัดและแปลงรูปอักขระคำศัพท์จาก 4 แหล่งข้อมูล

**Files:**
- Create: `scripts/thai-vocab/ingest-sources.mjs`
- Test: `tests/thai-vocab-hub/source-ingestion.test.mjs`

**Interfaces:**
- Consumes:
  - `scratch/media_1794403932892_fae20491/word/document.xml` (Doc 1: 1,000 คำ)
  - `scratch/media_1794403932892_86b9b2fe/word/document.xml` (Doc 2: 1,000 คำ)
  - `scratch/media_1794403932892_b5e26ef6/word/document.xml` (Doc 3: 1,000 คำ)
  - PDF 11-page OCR extracted text (Doc 4: 1,049 คำ)
- Produces:
  - `scripts/thai-vocab/ingest-sources.mjs:extractAllRawWords() -> Array<{ source: string, rawWord: string, index: number }>`
  - `scripts/thai-vocab/ingest-sources.mjs:normalizeThaiWord(raw: string) -> string`

- [ ] **Step 1: เขียน Unit Test ตรวจการสกัดและแปลงรูปคำ (failing test)**

```javascript
// tests/thai-vocab-hub/source-ingestion.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeThaiWord, extractAllRawWords } from '../../scripts/thai-vocab/ingest-sources.mjs';

test('normalizeThaiWord cleans whitespace, numbers, and abnormal zero-width spaces', () => {
  assert.equal(normalizeThaiWord(' ๑.  บ้าน \u200B'), 'บ้าน');
  assert.equal(normalizeThaiWord('12. บิดา'), 'บิดา');
  assert.equal(normalizeThaiWord('สึ นามิ'), 'สึนามิ');
});

test('extractAllRawWords loads entries across all 4 sources', () => {
  const words = extractAllRawWords();
  assert.ok(words.length >= 3500, `Expected >= 3500 words, got ${words.length}`);
});
```

- [ ] **Step 2: รันการทดสอบเพื่อยืนยันว่าล้มเหลว (FAIL)**

Run: `node --test tests/thai-vocab-hub/source-ingestion.test.mjs`
Expected: FAIL with "Cannot find module '../../scripts/thai-vocab/ingest-sources.mjs'"

- [ ] **Step 3: พัฒนา `scripts/thai-vocab/ingest-sources.mjs`**

สร้างฟังก์ชัน:
- `normalizeThaiWord(raw)`: ลบเลขลำดับไทย/อารบิก, จุด, ช่องว่างผิดปกติ, จัดเรียงสระ/วรรณยุกต์
- `extractAllRawWords()`: อ่านและรวมรายการคำศัพท์จากทั้ง 4 แหล่งข้อมูล

- [ ] **Step 4: รันการทดสอบเพื่อยืนยันว่าผ่าน (PASS)**

Run: `node --test tests/thai-vocab-hub/source-ingestion.test.mjs`
Expected: PASS

- [ ] **Step 5: Git commit**

```bash
git add scripts/thai-vocab/ingest-sources.mjs tests/thai-vocab-hub/source-ingestion.test.mjs
git commit -m "feat(thai-vocab-hub): implement multi-source vocabulary ingestion and normalization pipeline"
```

---

### Task 2: พัฒนา Deduplication Engine และชุดตรวจแก้คำผิดตามราชบัณฑิตยสภา

**Files:**
- Create: `scripts/thai-vocab/dedup-and-correct.mjs`
- Test: `tests/thai-vocab-hub/dedup-and-orthography.test.mjs`

**Interfaces:**
- Consumes:
  - `scripts/thai-vocab/ingest-sources.mjs:extractAllRawWords()`
  - `public/games/thai/thai-vocab-hub/data/words/*.json` (ฐานข้อมูลเดิม 17 หมวด)
- Produces:
  - `dedupAndAuditWords(words, existingCatalog) -> { skippedWords: Array, correctedWords: Array, newCandidates: Array }`

- [ ] **Step 1: เขียน Unit Test ตรวจการข้ามคำเดิมและแก้คำผิด (failing test)**

```javascript
// tests/thai-vocab-hub/dedup-and-orthography.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { dedupAndAuditWords, ORTHOGRAPHY_FIXES } from '../../scripts/thai-vocab/dedup-and-correct.mjs';

test('dedupAndAuditWords skips existing words and tags them with existing category', () => {
  const sample = ['กตัญญู', 'เกษตรกร', 'คำแปลกใหม่ที่ไม่เคยมี'];
  const existingSet = new Set(['กตัญญู', 'เกษตรกร']);
  const result = dedupAndAuditWords(sample, existingSet);
  
  assert.equal(result.skippedWords.length, 2);
  assert.equal(result.newCandidates.length, 1);
  assert.equal(result.newCandidates[0], 'คำแปลกใหม่ที่ไม่เคยมี');
});

test('ORTHOGRAPHY_FIXES contains Royal Society fixes for OCR/typos', () => {
  assert.equal(ORTHOGRAPHY_FIXES['กบในกะลำครอบ'], 'กบในกะลาครอบ');
  assert.equal(ORTHOGRAPHY_FIXES['กิ้งกำไดท้อง'], 'กิ้งก่าได้ทอง');
  assert.equal(ORTHOGRAPHY_FIXES['กำ ดดั'], 'กำจัด');
  assert.equal(ORTHOGRAPHY_FIXES['จำ้ละหวนั่'], 'จ้าละหวั่น');
  assert.equal(ORTHOGRAPHY_FIXES['ฌำณ'], 'ฌาน');
  assert.equal(ORTHOGRAPHY_FIXES['อภิปาย'], 'อภิปราย');
  assert.equal(ORTHOGRAPHY_FIXES['สปาเก็ตตี้'], 'สปาเกตตี');
});
```

- [ ] **Step 2: รันการทดสอบเพื่อยืนยันว่าล้มเหลว (FAIL)**

Run: `node --test tests/thai-vocab-hub/dedup-and-orthography.test.mjs`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: พัฒนา `scripts/thai-vocab/dedup-and-correct.mjs`**

- สร้าง Dictionary `ORTHOGRAPHY_FIXES` ครอบคลุมคำเพี้ยน/คำสระแตกจาก OCR ทั้งหมด
- พัฒนากลไก `dedupAndAuditWords`:
  1. กรองคำผิดผ่าน `ORTHOGRAPHY_FIXES`
  2. กรองคำซ้ำกับฐานข้อมูลคำเดิม 17 หมวด (บันทึกลง `skippedWords`)
  3. คัดกรองคำใหม่แท้จริง 100% ที่ถูกต้องตามหลักภาษาศาสตร์ (ส่งออกไปยัง `newCandidates`)

- [ ] **Step 4: รันการทดสอบเพื่อยืนยันว่าผ่าน (PASS)**

Run: `node --test tests/thai-vocab-hub/dedup-and-orthography.test.mjs`
Expected: PASS

- [ ] **Step 5: Git commit**

```bash
git add scripts/thai-vocab/dedup-and-correct.mjs tests/thai-vocab-hub/dedup-and-orthography.test.mjs
git commit -m "fix(thai-vocab-hub): deduplicate incoming words and correct orthographic and OCR typos"
```

---

### Task 3: ผสานเนื้อหาการเรียนรู้ (คำอ่าน, ความหมาย, ชนิดคำ, ตัวชี้วัด, ประโยคตัวอย่างแท้)

**Files:**
- Create: `scripts/thai-vocab/enrich-pedagogy.mjs`
- Test: `tests/thai-vocab-hub/pedagogical-enrichment.test.mjs`

**Interfaces:**
- Consumes:
  - `newCandidates` จาก Task 2
- Produces:
  - `enrichWordItem(word: string, category: string) -> WordItem`
  - ครบทุกคุณสมบัติ: `word`, `reading`, `meaning`, `pos`, `grade`, `indicator_code`, `emoji`, `example`, `content_status`

- [ ] **Step 1: เขียน Unit Test ตรวจคุณภาพเนื้อหาการเรียนรู้ (failing test)**

```javascript
// tests/thai-vocab-hub/pedagogical-enrichment.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { enrichWordItem, validateEnrichedItem } from '../../scripts/thai-vocab/enrich-pedagogy.mjs';

test('enrichWordItem creates complete pedagogical payload without placeholders', () => {
  const item = enrichWordItem('กติกา', 'lesson');
  assert.equal(item.word, 'กติกา');
  assert.equal(item.reading, 'กะ-ติ-กา');
  assert.ok(item.meaning && item.meaning.length > 5);
  assert.equal(item.pos, 'คำนาม');
  assert.ok(item.emoji);
  assert.ok(item.example && item.example.includes('กติกา'));
  assert.ok(!item.example.includes('คุณครูสอนให้นักเรียนเข้าใจความหมายของ'));
  assert.equal(item.content_status, 'approved');
});

test('validateEnrichedItem enforces strict schema rules', () => {
  const valid = enrichWordItem('เนรมิต', 'difficult');
  assert.equal(validateEnrichedItem(valid).isValid, true);
});
```

- [ ] **Step 2: รันการทดสอบเพื่อยืนยันว่าล้มเหลว (FAIL)**

Run: `node --test tests/thai-vocab-hub/pedagogical-enrichment.test.mjs`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: พัฒนา `scripts/thai-vocab/enrich-pedagogy.mjs`**

- พัฒนาโมดูลสร้างคำอ่านสัทอักษรไทย (Thai Phonetic Syllables)
- พัฒนาพจนานุกรมความหมายฉบับกระชับสำหรับระดับประถม (K-6)
- พัฒนาระบบจับคู่อิโมจิและชนิดของคำ (`pos`)
- พัฒนาระบบสร้างประโยคตัวอย่างแท้ตามบริบทจริงในห้องเรียนและชีวิตประจำวัน (100% Non-placeholder)

- [ ] **Step 4: รันการทดสอบเพื่อยืนยันว่าผ่าน (PASS)**

Run: `node --test tests/thai-vocab-hub/pedagogical-enrichment.test.mjs`
Expected: PASS

- [ ] **Step 5: Git commit**

```bash
git add scripts/thai-vocab/enrich-pedagogy.mjs tests/thai-vocab-hub/pedagogical-enrichment.test.mjs
git commit -m "feat(thai-vocab-hub): enrich new vocabulary words with complete pedagogical metadata"
```

---

### Task 4: จัดหมวดหมู่ทางภาษาศาสตร์ และผนวกเข้าสู่ 17 หมวดหมู่ใน Thai Vocab Hub

**Files:**
- Create: `scripts/thai-vocab/categorize-and-integrate.mjs`
- Modify: `public/games/thai/thai-vocab-hub/data/words/*.json`
- Modify: `scripts/build-vocab-data.mjs:15-37`
- Test: `tests/thai-vocab-hub/category-distribution.test.mjs`

**Interfaces:**
- Consumes:
  - Enriched Word Items จาก Task 3
- Produces:
  - อัปเดตไฟล์ JSON ใน `public/games/thai/thai-vocab-hub/data/words/*.json`
  - คลังคำศัพท์ขยายที่สมดุลและถูกต้องตามหลักไวยากรณ์

- [ ] **Step 1: เขียน Unit Test ตรวจสอบความถูกต้องของการจำแนกหมวดหมู่ (failing test)**

```javascript
// tests/thai-vocab-hub/category-distribution.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { categorizeWord } from '../../scripts/thai-vocab/categorize-and-integrate.mjs';

test('categorizeWord assigns correct category by linguistic rules', () => {
  assert.equal(categorizeWord('กราบบังคมทูล'), 'royal');
  assert.equal(categorizeWord('กบในกะลาครอบ'), 'idioms');
  assert.equal(categorizeWord('คอมพิวเตอร์'), 'loanwords');
  assert.equal(categorizeWord('กะพริบ'), 'misspelled');
  assert.equal(categorizeWord('กระฉับกระเฉง'), 'reduplication');
  assert.equal(categorizeWord('ขวักไขว่'), 'blends');
  assert.equal(categorizeWord('ขมุกขมัว'), 'leading');
});
```

- [ ] **Step 2: รันการทดสอบเพื่อยืนยันว่าล้มเหลว (FAIL)**

Run: `node --test tests/thai-vocab-hub/category-distribution.test.mjs`
Expected: FAIL with "Cannot find module"

- [ ] **Step 3: พัฒนา `scripts/thai-vocab/categorize-and-integrate.mjs` และผสานคำเข้าหมวด**

- จัดสรรคำศัพท์ใหม่เข้าสู่หมวดหมู่ที่เหมาะสมตามเกณฑ์:
  - คำราชาศัพท์ / กริยาราชาศัพท์ ➔ `royal.json`
  - สำนวน สุภาษิต คำพังเพย ➔ `idioms.json`
  - คำยืมภาษาต่างประเทศ / ทับศัพท์ ➔ `loanwords.json`
  - คำที่มักเขียนผิด ➔ `misspelled.json`
  - คำควบกล้ำ ➔ `blends.json`
  - คำอักษรนำ ➔ `leading.json`
  - คำซ้ำ-คำซ้อน ➔ `reduplication.json`
  - คำศัพท์บทเรียนและวรรณคดี ➔ `lesson.json`
  - คำศัพท์หน่วยการเรียนรู้ สังคม-วิทย์ ➔ `p5-focus.json`
  - คำยากและศัพท์โครงสร้างซับซ้อน ➔ `difficult.json`
- ปรับปรุง `scripts/build-vocab-data.mjs` ให้รองรับการขยายตัวของคลังคำศัพท์แต่ละหมวดอย่างยืดหยุ่น

- [ ] **Step 4: รันการทดสอบเพื่อยืนยันว่าผ่าน (PASS)**

Run: `node --test tests/thai-vocab-hub/category-distribution.test.mjs`
Expected: PASS

- [ ] **Step 5: Git commit**

```bash
git add scripts/thai-vocab/categorize-and-integrate.mjs public/games/thai/thai-vocab-hub/data/words/*.json scripts/build-vocab-data.mjs tests/thai-vocab-hub/category-distribution.test.mjs
git commit -m "feat(thai-vocab-hub): classify and integrate new vocabulary across Thai Vocab Hub categories"
```

---

### Task 5: คอมไพล์ฐานข้อมูล, รันการตรวจเกม, และอัปเดตเวอร์ชันระบบ

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/data.js`
- Modify: `src/components/admin/system/SystemOverview.tsx`
- Test: `node scripts/build-vocab-data.mjs --check`
- Test: `node scripts/verify-game.mjs public/games/thai/thai-vocab-hub`
- Test: `node --test tests/thai-vocab-hub/*.test.mjs`
- Test: `pnpm build`

**Interfaces:**
- Consumes:
  - ทุกหมวดหมู่ใน `public/games/thai/thai-vocab-hub/data/words/*.json`
- Produces:
  - `public/games/thai/thai-vocab-hub/data.js` คอมไพล์ใหม่สมบูรณ์
  - บันทึกเวอร์ชัน `v2.8.18` ในประวัติระบบ

- [ ] **Step 1: รันคำสั่งคอมไพล์ฐานข้อมูลคำศัพท์**

Run: `node scripts/build-vocab-data.mjs`
Expected: Output `✅ Wrote public/games/thai/thai-vocab-hub/data.js`

- [ ] **Step 2: ตรวจสอบความถูกต้องของคลังข้อมูลคำศัพท์ทั้งหมด**

Run: `node scripts/build-vocab-data.mjs --check`
Expected: ตรวจสอบผ่านทุกหมวดหมู่ รายงานจำนวนคำอนุมัติครบถ้วน

- [ ] **Step 3: ตรวจสอบความสมบูรณ์ของ Game Engine และ SDK Integration**

Run: `node scripts/verify-game.mjs public/games/thai/thai-vocab-hub`
Expected: ผ่านครบทั้ง 12 มิติ (DOM element, Cover, SDK, Audio, Lifecycle)

- [ ] **Step 4: รันชุดทดสอบ Unit Tests ทั้งหมดของ Thai Vocab Hub**

Run: `node --test tests/thai-vocab-hub/*.test.mjs`
Expected: ผ่าน 100% ทุกข้อทดสอบ

- [ ] **Step 5: อัปเดต System Overview และบันทึกประวัติเวอร์ชัน**

เพิ่ม entry เวอร์ชัน `v2.8.18` ใน `versionHistory` ของ `src/components/admin/system/SystemOverview.tsx` บันทึกการบูรณาการคลังคำศัพท์ใหม่ 4 แหล่งและการชำระคำผิด

- [ ] **Step 6: ตรวจสอบการ Build ของแอปพลิเคชันหลัก**

Run: `pnpm build`
Expected: `✓ built in ...` สำเร็จสมบูรณ์ ไม่มี error

- [ ] **Step 7: Git commit และ push สู่ remote**

```bash
git add public/games/thai/thai-vocab-hub/data.js src/components/admin/system/SystemOverview.tsx
git commit -m "feat(thai-vocab-hub): compile unified vocabulary hub with enriched curriculum words v2.8.18"
```
