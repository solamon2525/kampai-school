# Reading Practice Theater Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand "โรงละครฝึกอ่านคำยากและคำราชาศัพท์" (Reading Practice Theater Studio) in `thai-vocab-hub` by adding 4 new pedagogical categories (คำที่มักอ่านผิด, คำสะกดยาก-การันต์ซับซ้อน, คำควบไม่แท้ ทร=ซ, คำสะกดไม่ตรงมาตราพาฉงน), boosting vocabulary count from 200 to 520 words, with dynamic Thai numeral counter tabs, pronunciation warning callouts, in-modal search, and classroom projector-ready typography.

**Architecture:** 
Expand the `reading-studio.json` dataset to 520 curated words with phonetic reading breakdowns, syllable chips, and pronunciation trap warnings (`warning_hint`). Upgrade `reading-trainer.js` with multi-category state filtering, dynamic Thai numeral counters, real-time search filtering, and warning badge callouts in the theater stage. Recompile `data.js` via `pnpm build:vocab` and verify against full test suite and responsive viewports.

**Tech Stack:** Vanilla JavaScript (IIFE, Web Audio API, Web SpeechSynthesis API), CSS3 (Flexbox, CSS Variables, SVG, Light-only Sarabun typography), Node.js build pipeline (`scripts/build-vocab-data.mjs`), Playwright E2E testing.

**Spec:** User request: `/writing-plans โหมดฝึกงาน ให้ เพิ่มหมวดหมู่ และคำศัพท์ เข้าไปอีก  เน้นคำที่อ่านยาก  สะกดยาก อ่านผิดบ่อย` and UI reference images showing category grid, theater typography, and filter tabs (`ทั้งหมด (๒๐๐)`, `คำยากชวนฝึก (๑๐๐)`, `คำราชาศัพท์ (๑๐๐)`).

## Global Constraints

- Light mode only: Zero `dark:` classes, no hardcoded dark backgrounds outside theater stage card, use CSS variables / established palette.
- Package Manager: `pnpm` only.
- Zero ES Modules in Game scripts: `reading-trainer.js` remains a clean IIFE exposing `window.ThaiReadingTrainer`.
- Thai Orthography: Strictly conform to Royal Institute Thai Dictionary (พจนานุกรมฉบับราชบัณฑิตยสภา) and Ministry of Education Thai Curriculum P.4-P.6.
- Real-screen truth: Verified on 360×800 (mobile) and 1280×720 (classroom projector) without overflow or clipping.

## Review Focus

- Filter tab switching updates the word jumper chips and resets stage without runtime null errors.
- Dynamic Thai numeral counters accurately reflect dataset counts (`๕๒๐`, `๑๐๐`, `๖๐`).
- Pronunciation warning badges render gracefully when `warning_hint` is provided and do not break cards that lack it.
- Keyboard navigation (Spacebar, Arrows, Esc) functions seamlessly across all newly added categories.
- `verify:game:all` passes all 12 checks cleanly.

---

### Task 1: Curriculum Dataset Expansion (`reading-studio.json` & `build:vocab`)

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/data/words/reading-studio.json`
- Test: `tests/reading-studio-dataset.test.mjs`

**Interfaces:**
- Consumes: Existing 200 words (`difficult: 100`, `royal: 100`) in `reading-studio.json`.
- Produces: 520 total approved items across 6 sub-categories:
  - `difficult`: 100 words (คำยากชวนฝึก)
  - `royal`: 100 words (คำราชาศัพท์)
  - `mispronounced`: 100 words (คำที่มักอ่านผิด / คำปราบเซียน)
  - `complex-spelling`: 100 words (คำสะกดยาก / การันต์ซับซ้อน)
  - `pseudo-clusters`: 60 words (คำควบไม่แท้และ ทร ออกเสียง ซ)
  - `irregular-spelling`: 60 words (คำสะกดไม่ตรงมาตราพาฉงน)
  Each new item includes `id`, `word`, `reading`, `meaning`, `pos`, `grade`, `emoji`, `example`, `sub_category`, `warning_hint` (optional), `content_status: "approved"`, `category_evidence`.

- [ ] **Step 1: Write the failing test**

Create `tests/reading-studio-dataset.test.mjs`:
```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('reading-studio.json contains >= 500 approved words across 6 categories', () => {
  const filePath = resolve('public/games/thai/thai-vocab-hub/data/words/reading-studio.json');
  const items = JSON.parse(readFileSync(filePath, 'utf8'));

  assert.ok(items.length >= 500, `Expected >= 500 items, got ${items.length}`);

  const counts = {};
  items.forEach((item, idx) => {
    assert.ok(item.word && typeof item.word === 'string', `Item ${idx} missing word`);
    assert.ok(item.reading && item.reading.includes('-') || item.reading.length > 0, `Item ${idx} (${item.word}) invalid reading`);
    assert.ok(item.meaning && item.meaning.length >= 4, `Item ${idx} (${item.word}) meaning too short`);
    assert.ok(['ป.4', 'ป.5', 'ป.6'].includes(item.grade), `Item ${idx} (${item.word}) invalid grade: ${item.grade}`);
    assert.equal(item.content_status, 'approved', `Item ${idx} (${item.word}) not approved`);
    counts[item.sub_category] = (counts[item.sub_category] || 0) + 1;
  });

  const expectedSubs = ['difficult', 'royal', 'mispronounced', 'complex-spelling', 'pseudo-clusters', 'irregular-spelling'];
  for (const sub of expectedSubs) {
    assert.ok(counts[sub] >= 50, `Sub-category ${sub} has fewer than 50 words (${counts[sub]})`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/reading-studio-dataset.test.mjs`
Expected: FAIL with `Expected >= 500 items, got 200`

- [ ] **Step 3: Curate and append 320 high-frequency Thai words to `reading-studio.json` and compile `data.js`**

Append curated, pedagogically vetted words for:
1. `mispronounced` (100 words): e.g. ขะมักเขม้น, สัปดาห์, กรกฎาคม, ปรารถนา, เพชฌฆาต, มณฑป, กาลเทศะ, อุณหภูมิ, สมาธิ, ทรราช, ประวัติศาสตร์, พลศึกษา, จระเข้, ดุลยภาพ, ปาฏิหาริย์, ชันสูตร, อุทาหรณ์, ตรึงตรา, รสนิยม, สรรพสามิต, บรรพชา, ฯลฯ พร้อม `warning_hint`
2. `complex-spelling` (100 words): e.g. ภาพยนตร์, พระพักตร์, เวทมนตร์, สัญลักษณ์, บริสุทธิ์, ประดิษฐ์, อัศจรรย์, รัตนโกสินทร์, วิทยาศาสตร์, พันธุ์ไม้, พิสูจน์, สัตวแพทย์, ศักดิ์ศรี, กาญจนาภิเษก, กษัตริย์, ทรัพยากร, สัมฤทธิ์, อิทธิฤทธิ์, ฯลฯ
3. `pseudo-clusters` (60 words): e.g. ทราย, ทราบ, ทราม, ไทร, ทรุดโทรม, พุทรา, อินทรี, นนทรี, ฉะเชิงเทรา, แทรก, ทรวดทรง, มัทรี, จริง, ศรัทธา, สร้าง, เสริม, สร้อย, เศร้า, ไซร้, ปราศรัย, สระน้ำ, สรรเสริญ, สรงน้ำ, โศกเศร้า, ฯลฯ
4. `irregular-spelling` (60 words): e.g. มลพิษ, ปฏิเสธ, กัลปังหา, มัคคุเทศก์, อุตสาหกรรม, สาธารณสุข, เกียรติยศ, มัสยิด, พัฒนา, วัฒนธรรม, มณฑล, ปฏิรูป, กัลยาณมิตร, อาเพศ, ทวยเทพ, สำเร็จ, ทิพยเนตร, ฯลฯ

Then run:
`pnpm build:vocab`

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/reading-studio-dataset.test.mjs`
Expected: PASS with all assertions satisfied.

- [ ] **Step 5: Commit**

```bash
git add public/games/thai/thai-vocab-hub/data/words/reading-studio.json public/games/thai/thai-vocab-hub/data.js tests/reading-studio-dataset.test.mjs
git commit -m "feat(thai-vocab-hub): expand reading studio dataset to 520 words across 6 categories"
```

---

### Task 2: Reading Theater Engine & Filter State Expansion (`reading-trainer.js`)

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/reading-trainer.js`
- Test: `tests/reading-trainer-engine.test.mjs`

**Interfaces:**
- Consumes: 520 items from `window.GAME_DATA.words['reading-studio']`.
- Produces: Updated `window.ThaiReadingTrainer` with:
  - 6 sub-category filter handling: `all`, `mispronounced`, `complex-spelling`, `pseudo-clusters`, `irregular-spelling`, `difficult`, `royal`.
  - Dynamic Thai numeral counters for tab pills: `toThaiNumeral(num)`.
  - In-modal search method `window.ThaiReadingTrainer.searchWord(query)`.
  - Category metadata lookup mapping category slug to Thai title, icon, and classroom hint.

- [ ] **Step 1: Write the failing test**

Create `tests/reading-trainer-engine.test.mjs`:
```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('reading-trainer.js supports 6 sub-categories, thai numerals, and in-modal search', () => {
  const code = readFileSync(resolve('public/games/thai/thai-vocab-hub/reading-trainer.js'), 'utf8');

  // Verify filter names supported
  assert.ok(code.includes('mispronounced'), 'Missing mispronounced filter');
  assert.ok(code.includes('complex-spelling'), 'Missing complex-spelling filter');
  assert.ok(code.includes('pseudo-clusters'), 'Missing pseudo-clusters filter');
  assert.ok(code.includes('irregular-spelling'), 'Missing irregular-spelling filter');

  // Verify Thai numeral conversion helper
  assert.ok(code.includes('toThaiNumeral') || code.includes('๑๒๓๔๕๖๗๘๙๐'), 'Missing Thai numeral conversion');

  // Verify searchWord functionality
  assert.ok(code.includes('searchWord'), 'Missing in-modal searchWord method');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/reading-trainer-engine.test.mjs`
Expected: FAIL with `Missing mispronounced filter`

- [ ] **Step 3: Implement expanded category filtering, Thai numeral formatting, and search in `reading-trainer.js`**

1. Define `CATEGORY_CONFIG`:
```javascript
const CATEGORY_CONFIG = {
  all: { label: 'ทั้งหมด', icon: '📚', desc: 'คัดสรรคำศัพท์สำหรับฝึกอ่านออกเสียงทุกหมวดหมู่' },
  mispronounced: { label: 'คำมักอ่านผิด', icon: '🚨', desc: 'คำปราบเซียนที่คนส่วนใหญ่มักอ่านผิดตามความเคยชิน' },
  'complex-spelling': { label: 'สะกดยาก-การันต์', icon: '🧩', desc: 'คำที่มีตัวการันต์คุมพยัญชนะซับซ้อนและโครงสร้างอักษรพิเศษ' },
  'pseudo-clusters': { label: 'คำควบไม่แท้ (ทร=ซ)', icon: '🌀', desc: 'คำควบไม่แท้ไม่ออกเสียง ร หรือแปลงรูป ทร เป็นเสียง ซ' },
  'irregular-spelling': { label: 'สะกดไม่ตรงมาตรา', icon: '🛡️', desc: 'คำที่มีตัวสะกดพิเศษในแม่กด แม่กน แม่กบ แม่กก ที่สะกดยาก' },
  difficult: { label: 'คำยากชวนฝึก', icon: '✍️', desc: 'คำศัพท์โครงสร้างยากตามระดับชั้น ป.4-ป.6' },
  royal: { label: 'คำราชาศัพท์', icon: '👑', desc: 'คำราชาศัพท์น่ารู้พร้อมความหมายและคำแปลสามัญ' },
};
```
2. Helper `toThaiNumeral(num)`:
```javascript
function toThaiNumeral(n) {
  const digits = ['๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙'];
  return String(n).replace(/\d/g, d => digits[Number(d)] || d);
}
```
3. Update `applyFilter(filterName)` to match any configured `sub_category`.
4. Add `searchWord(query)` to filter current playlist dynamically by word or reading.
5. In `ensureModal()`:
   - Render horizontal scrollable filter tabs with dynamic counts:
     `📚 ทั้งหมด (๕๒๐)`, `🚨 คำมักอ่านผิด (๑๐๐)`, `🧩 สะกดยาก-การันต์ (๑๐๐)`, `🌀 คำควบไม่แท้ (๖๐)`, `🛡️ สะกดไม่ตรงมาตรา (๖๐)`, `✍️ คำยากชวนฝึก (๑๐๐)`, `👑 คำราชาศัพท์ (๑๐๐)`
   - Add search input in the filter bar: `<input type="search" id="reading-theater-search" placeholder="🔍 ค้นหาคำฝึกอ่าน...">`

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/reading-trainer-engine.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add public/games/thai/thai-vocab-hub/reading-trainer.js tests/reading-trainer-engine.test.mjs
git commit -m "feat(thai-vocab-hub): add 6-category filter logic, thai numerals, and in-modal search"
```

---

### Task 3: Reading Stage Visual Polish & Warning Hint Callouts (`reading-trainer.js` & `style.css`)

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/reading-trainer.js`
- Modify: `public/games/thai/thai-vocab-hub/style.css`
- Test: `tests/reading-trainer-stage.test.mjs`

**Interfaces:**
- Consumes: `item.warning_hint` from dataset.
- Produces:
  - Special warning callout bubble (`.reading-warning-box`) on the theater stage when entering Step 1 & 2 for words with pronunciation pitfalls.
  - Horizontal scroll tabs styling with custom scrollbar, active pill glow, and badge indicator.
  - Category badge theme styling for all 6 categories (`badge-mispronounced`, `badge-complex`, `badge-pseudo`, `badge-irregular`, `badge-diff`, `badge-royal`).

- [ ] **Step 1: Write the failing test**

Create `tests/reading-trainer-stage.test.mjs`:
```javascript
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

test('style.css and reading-trainer.js contain warning box styles and category badges', () => {
  const css = readFileSync(resolve('public/games/thai/thai-vocab-hub/style.css'), 'utf8');
  const js = readFileSync(resolve('public/games/thai/thai-vocab-hub/reading-trainer.js'), 'utf8');

  assert.ok(css.includes('.reading-warning-box'), 'Missing .reading-warning-box in style.css');
  assert.ok(css.includes('.badge-mispronounced'), 'Missing .badge-mispronounced in style.css');
  assert.ok(js.includes('reading-warning-box'), 'Missing warning box markup in reading-trainer.js');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/reading-trainer-stage.test.mjs`
Expected: FAIL with `Missing .reading-warning-box in style.css`

- [ ] **Step 3: Implement warning box callout and category theme styling in `style.css` and `reading-trainer.js`**

1. In `style.css`:
   - Add `.reading-warning-box`: Soft amber/orange container with warning icon, subtle pulse, rounded border, high readability.
   - Add category badge colors:
     - `.badge-mispronounced`: Crimson/Rose `#ffe4e6`, text `#9f1239`
     - `.badge-complex`: Violet/Purple `#ede9fe`, text `#5b21b6`
     - `.badge-pseudo`: Cyan/Sky `#e0f2fe`, text `#0369a1`
     - `.badge-irregular`: Emerald/Green `#dcfce7`, text `#166534`
     - `.badge-diff`: Indigo `#e0e7ff`, text `#3730a3`
     - `.badge-royal`: Amber/Gold `#fef3c7`, text `#92400e`
   - Add `.reading-filter-bar` horizontal scroll styling with `overflow-x: auto`, `scrollbar-width: thin`, `scroll-snap-type: x mandatory`.
   - Add `.reading-search-input` styling matching hub theme.
2. In `reading-trainer.js`:
   - In `renderStage()`, if `item.warning_hint` exists, render:
     ```html
     <div class="reading-warning-box animate-pop-in">
       <span class="warning-icon">⚠️</span>
       <span class="warning-text">${item.warning_hint}</span>
     </div>
     ```
   - Update rule banner badge to match category theme class.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/reading-trainer-stage.test.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add public/games/thai/thai-vocab-hub/reading-trainer.js public/games/thai/thai-vocab-hub/style.css tests/reading-trainer-stage.test.mjs
git commit -m "feat(thai-vocab-hub): style warning hint box and category themes in reading theater"
```

---

### Task 4: Automated E2E & Visual Verification (Playwright & `verify:game:all`)

**Files:**
- Create: `tests/e2e-reading-trainer.spec.mjs`
- Test: Run via Node Playwright test script

**Interfaces:**
- Consumes: Running HTTP server on `http://localhost:4173` or static file server.
- Produces: Verified screenshots and DOM assertion logs for 360×800 and 1280×720 viewports.

- [ ] **Step 1: Write E2E Playwright test script `tests/e2e-reading-trainer.spec.mjs`**

Test verifies:
1. Modal opens via button `btn-reading-theater-toggle`.
2. Total words count shows `๕๒๐` (or $\ge 500$).
3. All 6 category tabs are present and clickable.
4. Switching to `🚨 คำมักอ่านผิด` loads words like "ขะมักเขม้น" and displays the warning hint box.
5. Syllable button breakdown triggers correctly and plays audio chimes.
6. Responsive check on 360×800 (mobile) and 1280×720 (desktop projector) without horizontal scrollbar on body or clipped text.

- [ ] **Step 2: Run E2E test script**

Run: `node tests/e2e-reading-trainer.spec.mjs`
Expected: PASS with 0 DOM overflow errors.

- [ ] **Step 3: Run full game verification suite**

Run: `pnpm verify:game:all -- public/games/thai/thai-vocab-hub`
Expected: All 12 checks PASS.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e-reading-trainer.spec.mjs
git commit -m "test(thai-vocab-hub): add e2e playwright verification for reading studio expansion"
```

---

### Task 5: Documentation & System Overview Sync

**Files:**
- Modify: `src/components/admin/system/SystemOverview.tsx`

**Interfaces:**
- Consumes: Final feature details and vocabulary count.
- Produces: Top-entry update in `versionHistory` conforming to DESIGN.md Rule 14.9.

- [ ] **Step 1: Add new entry to `versionHistory` in `SystemOverview.tsx`**

Add top entry:
```typescript
{
  version: '2.34.0', // or next sequential version
  date: '12 พ.ย. 2569',
  title: 'Thai Vocab Hub: ขยายโรงละครฝึกอ่านคำยาก 520 คำ พร้อม 6 หมวดปราบเซียน',
  description: 'เพิ่มหมวดคำที่มักอ่านผิด, คำสะกดยาก-การันต์ซับซ้อน, คำควบไม่แท้ (ทร=ซ), คำสะกดไม่ตรงมาตรา พร้อมระบบป้ายเตือนจุดอ่านผิด ป้ายนับเลขไทย และค้นหาคำด่วนในโรงละคร',
  type: 'feature',
}
```

- [ ] **Step 2: Run build check to verify TypeScript compilation**

Run: `pnpm build`
Expected: Build succeeds without TypeScript or Vite errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin/system/SystemOverview.tsx
git commit -m "docs(system): document reading practice theater 520-word expansion in version history"
```
