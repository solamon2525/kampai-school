# Thai Vocab Hub 100-Word A4 Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 100-word-per-A4 vocabulary sheet generator inside Thai Vocab Hub (`public/games/thai/thai-vocab-hub/`) where teachers can pick or randomize multiple categories, merge words into 100-word sets, maximize cell/font size on A4 grid tables, and print or export crisp PDFs.

**Architecture:** Extract the 100-word pool mixing, deterministic set builder, and A4 grid HTML/CSS renderer into a dedicated non-module IIFE `public/games/thai/thai-vocab-hub/vocab-sheet-100.js` (`window.ThaiVocabSheet100`), then wire it into the existing `🖨️ พิมพ์ใบงาน A4` modal in `worksheet-generator.js` and `style.css` so it works seamlessly from both the Hub view and any category view. PDF export uses native browser vector print-to-PDF (`@page` A4 + `Sarabun` font + clean document title + `.no-print` preview toolbar) so Thai vowels/tone marks render with zero raster blur.

**Tech Stack:** Vanilla JS (IIFE, no ES modules per `AGENTS.md`), HTML5/CSS3 (`@page` A4 Print CSS, CSS Grid/Table), Node `node:assert/strict` + `node:vm` unit tests, Playwright browser/A4 verification.

**Spec:** User request for Thai Vocab Hub (`public/games/thai/thai-vocab-hub/`): 100 words per A4 sheet, multi-category selection & random category picker, merged word sets, largest readable grid cells fitting 100 words on A4, direct print & PDF export, plus helpful classroom options.

## Global Constraints

- **No ES Modules in game scripts:** `public/games/thai/thai-vocab-hub/*.js` must use IIFE / `window.*` globals and load in sequence in `index.html` (`config.js` → `data.js` → `vocab-sheet-100.js` → `worksheet-generator.js` → ... → `game.js`).
- **Sanitization & Quarantine:** Always exclude `content_status === 'quarantined'` words and HTML-escape all dynamic text (`sanitize()`).
- **Real-screen truth:** Verify modal and A4 layout in a real browser at `360×800` and `1280×720` plus A4 dimensions with zero overflow/clipping, and run `pnpm verify:game:all -- public/games/thai/thai-vocab-hub`.
- **Single-page A4 fit:** 100 words must fit cleanly on 1 A4 page per set (with optional separate Teacher Reference/Answer Key page), maximizing cell area and Thai font readability.

## Review Focus

- **Hub view entry (`activeCat === null`):** Clicking `🖨️ พิมพ์ใบงาน A4` from the Hub must not fail with an empty word pool; it must default to the 100-word multi-category builder.
- **Duplicate words across categories:** Selecting overlapping categories (e.g. `misspelled` + `lesson` + `difficult`) must deduplicate by trimmed `word` so the same word never appears twice in a 100-word set.
- **Pool smaller than 100 words:** Selecting a single narrow category+grade with fewer than 100 unique words must still render cleanly (filling available words and showing exact count, or padding empty practice cells if desired without crashing or producing `undefined`).
- **Long Thai words / idioms in fixed cells:** Words from `idioms` or `reading-studio` (15–35+ graphemes) must auto-scale down cleanly inside fixed-height A4 table cells without overflowing or pushing row 20 onto page 2.
- **Popup blocker / Print-to-PDF UX:** Opening the preview window must handle blocked popups gracefully and provide an in-preview toolbar (`🖨️ สั่งพิมพ์`, `📄 บันทึกเป็น PDF`, `🎲 สุ่มชุดใหม่`, `✖️ ปิด`) without auto-printing before the teacher sees the layout.

---

### Task 1: Core 100-Word Set Builder & Typography Sizing (`vocab-sheet-100.js`)

**Files:**
- Create: `public/games/thai/thai-vocab-hub/vocab-sheet-100.js`
- Test: `scripts/test-thai-vocab-100-sheet.mjs`

**Interfaces:**
- Consumes: `window.GAME_DATA.categories` (`Array<{slug, title, icon}>`), `window.GAME_DATA.words` (`Record<string, Array<WordItem>>`)
- Produces: `window.ThaiVocabSheet100` with:
  - `collectPoolWords(allWords, categories, selectedSlugs, grade)` → `Array<PoolWord>`
  - `build100WordSets({ pool, setSize, setCount, mixMode, seed })` → `{ sets: Array<Array<PoolWord>>, totalAvailable: number, seed: number }`
  - `computeCellTypography(word, options)` → `{ fontClass: string, graphemeCount: number }`
  - `GRID_PRESETS` (`'5x20-portrait' | '4x25-portrait' | '5x20-landscape' | '10x10-landscape'`)

- [ ] **Step 1: Write the failing unit tests for pool collection, deduplication, mixing, and cell typography**

Create `scripts/test-thai-vocab-100-sheet.mjs`:

```javascript
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

// 2. Balanced mixing from real GAME_DATA across 4 categories -> exact 100 unique words
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test-thai-vocab-100-sheet.mjs`
Expected: FAIL with `ENOENT: no such file or directory, open '.../vocab-sheet-100.js'`

- [ ] **Step 3: Implement `collectPoolWords`, `build100WordSets`, `computeCellTypography`, and `GRID_PRESETS` in `public/games/thai/thai-vocab-hub/vocab-sheet-100.js`**

Key implementation details:
- `mulberry32(seed)` deterministic PRNG + `shuffleWithRng(arr, rng)`.
- `collectPoolWords(allWords, categories, selectedSlugs, grade)`:
  - Iterates `selectedSlugs`, skips `content_status === 'quarantined'`, filters by `grade` if `grade !== 'all'`, trims `word`, deduplicates with a `Set`, attaches `_categorySlug` and `_categoryTitle`.
- `build100WordSets({ pool, setSize = 100, setCount = 1, mixMode = 'balanced', seed })`:
  - `balanced`: groups `pool` by `_categorySlug`, shuffles each group with `rng`, takes `Math.floor(setSize / groupCount)` from each group round-robin, then fills any remainder from remaining unused words in `pool`. For `setCount > 1`, consumes from remaining unused words first so sets don't overlap unless `pool.length < setSize * setCount`.
  - `random`: shuffles entire `pool` with `rng` and slices `setSize` chunks.
  - `sequential`: keeps original order and slices `setSize` chunks.
- `computeCellTypography(word, options)`:
  - Uses `Intl.Segmenter('th', { granularity: 'grapheme' })` (with regex fallback) to count Thai graphemes.
  - Maps grapheme count + `options.showReading` to `fs-xl` (≤ 5), `fs-lg` (6–9), `fs-md` (10–14), `fs-sm` (15–22), `fs-xs` (23+).

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/test-thai-vocab-100-sheet.mjs`
Expected: PASS (exit code 0)

- [ ] **Step 5: Commit**

```bash
git add public/games/thai/thai-vocab-hub/vocab-sheet-100.js scripts/test-thai-vocab-100-sheet.mjs
git commit -m "feat(thai-vocab-hub): add 100-word set builder and typography sizing"
```

---

### Task 2: A4 100-Cell HTML/CSS Print & PDF Preview Renderer (`vocab-sheet-100.js`)

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/vocab-sheet-100.js`
- Test: `scripts/test-thai-vocab-100-sheet.mjs`

**Interfaces:**
- Consumes: `build100WordSets`, `computeCellTypography`, `GRID_PRESETS` (from Task 1)
- Produces: `window.ThaiVocabSheet100.render100SheetDocument(config)` → `string` (complete HTML document) and `window.ThaiVocabSheet100.openPreviewWindow(config)` → `Window | null`

- [ ] **Step 1: Add failing tests for `render100SheetDocument` to `scripts/test-thai-vocab-100-sheet.mjs`**

Append assertions to `scripts/test-thai-vocab-100-sheet.mjs`:
- Calls `api.render100SheetDocument({ sets: built.sets.slice(0, 1), categoriesSummary: '4 หมวด', grade: 'all', preset: '5x20-portrait', showNumbers: true, showReading: false, showCheckbox: true, includeTeacherKey: true, title: 'ชุดคำศัพท์ 100 คำ' })`.
- Asserts HTML contains `size: A4 portrait`, `vocab-100-table`, exactly 100 `<td class="vocab-cell` elements in the student sheet, teacher key page `.teacher-key-sheet`, `window.print()`, and escaped text (test with `<script>` in `title` to confirm XSS escaping).
- Also test `preset: '5x20-landscape'` produces `size: A4 landscape`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test-thai-vocab-100-sheet.mjs`
Expected: FAIL with `api.render100SheetDocument is not a function`

- [ ] **Step 3: Implement `render100SheetDocument(config)` and `openPreviewWindow(config)` in `public/games/thai/thai-vocab-hub/vocab-sheet-100.js`**

Key design details:
- `@page { size: A4 <portrait|landscape>; margin: 7mm 8mm; }`
- Floating `.no-print` toolbar at top of preview window:
  - `🖨️ สั่งพิมพ์ (Print)` → `window.print()`
  - `📄 บันทึกเป็น PDF` → `window.print()` + brief Thai hint badge `เลือกปลายทาง "บันทึกเป็น PDF / Save as PDF"`
  - `🎲 สุ่มชุดใหม่` → calls `window.opener?.ThaiVocabSheet100?.rerollPreview?.(window, config)` if opener exists
  - `✖️ ปิด` → `window.close()`
- Student `.sheet`:
  - Compact 1-row header: Title + selected categories summary + Set badge (`ชุดที่ 1/2`) + `ชื่อ–สกุล .................. ชั้น ...... เลขที่ ......`
  - `table.vocab-100-table` with `cols` × `rows` (`5×20` or `4×25` or `10×10`), fixed `height: 254mm` (portrait) / `168mm` (landscape) so all 100 cells expand to fill the entire A4 page!
  - Cell font sizes tuned for maximum readability:
    - Portrait 5×20: `fs-xl: 17pt`, `fs-lg: 15pt`, `fs-md: 13pt`, `fs-sm: 11pt`, `fs-xs: 9.5pt`
    - Portrait 4×25: `fs-xl: 15pt`, `fs-lg: 13.5pt`, `fs-md: 12pt`, `fs-sm: 10.5pt`, `fs-xs: 9pt`
    - Landscape 5×20: `fs-xl: 14pt`, `fs-lg: 12.5pt`, `fs-md: 11.5pt`, `fs-sm: 10pt`, `fs-xs: 8.5pt`
    - Landscape 10×10: `fs-xl: 13.5pt`, `fs-lg: 12pt`, `fs-md: 10.5pt`, `fs-sm: 9pt`, `fs-xs: 8pt`
  - Optional cell number (`1–100`), optional `[reading]`, optional `☐` corner checkbox.
  - Compact footer with date + score/reading fluency summary (`อ่านได้ ........ / 100 คำ`).
- Optional Teacher Reference Key `.teacher-key-sheet` (new page):
  - 2-column compact table/grid listing `1–100`: word, `[reading]`, `meaning`, and `categoryTitle`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/test-thai-vocab-100-sheet.mjs`
Expected: PASS (exit code 0)

- [ ] **Step 5: Commit**

```bash
git add public/games/thai/thai-vocab-hub/vocab-sheet-100.js scripts/test-thai-vocab-100-sheet.mjs
git commit -m "feat(thai-vocab-hub): add A4 100-cell print and PDF preview renderer"
```

---

### Task 3: Multi-Category Modal UI & Hub/Topic Integration (`index.html`, `worksheet-generator.js`, `style.css`)

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/index.html:600-612`
- Modify: `public/games/thai/thai-vocab-hub/worksheet-generator.js:100-203`
- Modify: `public/games/thai/thai-vocab-hub/style.css:1975-2065`

**Interfaces:**
- Consumes: `window.ThaiVocabSheet100` (`collectPoolWords`, `build100WordSets`, `openPreviewWindow`, `GRID_PRESETS`), `window.GAME_DATA.categories`, `window.GAME_DATA.words`
- Produces: Updated `window.ThaiVocabWorksheet.openModal(activeCat, words)` supporting both Hub multi-category 100-word mode and single-category modes.

- [ ] **Step 1: Load `vocab-sheet-100.js` in `public/games/thai/thai-vocab-hub/index.html`**

Add `<script src="vocab-sheet-100.js"></script>` right before `<script src="worksheet-generator.js"></script>` around line 605.

- [ ] **Step 2: Upgrade `openWorksheetModal` and `confirmPrint` in `public/games/thai/thai-vocab-hub/worksheet-generator.js`**

- Add `<option value="vocab-sheet-100">📋 ชุดคำศัพท์ 100 คำ (ตารางเต็มแผ่น A4)</option>` to `#ws-type`.
- Add `#ws-100-panel` inside `.tvh-modal-body` (visible when `#ws-type` is `vocab-sheet-100`):
  - Category checkboxes for all `window.GAME_DATA.categories` (each showing `icon`, `title`, and approved word count).
  - Quick action buttons: `เลือกทั้งหมด`, `ล้างทั้งหมด`, `🎲 สุ่ม 4 หมวด`, `🎲 สุ่ม 6 หมวด`.
  - Live pool counter: `คลังที่เลือก: X คำ (สร้างได้ Y ชุด ชุดละ 100 คำ)`.
  - Controls:
    - `#ws100-mix`: `balanced` (เฉลี่ยเท่ากันทุกหมวด) / `random` (สุ่มรวม) / `sequential` (เรียงตามลำดับ)
    - `#ws100-preset`: `5x20-portrait` (A4 แนวตั้ง 5×20 ช่อง — ตัวใหญ่สุด) / `4x25-portrait` (A4 แนวตั้ง 4×25 ช่อง — คำยาว) / `5x20-landscape` (A4 แนวนอน 5×20 ช่อง) / `10x10-landscape` (A4 แนวนอน 10×10 ช่อง)
    - `#ws100-set-count`: `1`, `2`, `3`, `5` ชุด
    - Checkboxes: `#ws100-numbers` (แสดงเลขข้อ 1–100, default checked), `#ws100-reading` (แสดงคำอ่าน `[...]`, default unchecked), `#ws100-checkbox` (แสดงช่องติ๊ก `☐` ทดสอบอ่าน, default unchecked).
- When `openWorksheetModal(activeCat, words)` is called:
  - If `!activeCat` (opened from Hub), set `#ws-type` to `'vocab-sheet-100'` and pre-select the first 4–6 core categories (or keep user's previous selection) so 1-click generates immediately.
  - If `activeCat` is provided, pre-check `activeCat.slug` in the category list and keep `#ws-type` flexible.
- In `confirmPrint()`:
  - When `type === 'vocab-sheet-100'`, collect selected slugs, validate `selectedSlugs.length > 0`, call `ThaiVocabSheet100.collectPoolWords(...)`, `build100WordSets(...)`, and `openPreviewWindow(...)` (with popup-blocked fallback alert).
  - Keep existing `dictation-10`, `dictation-20`, `matching-10`, `crossword-grid`, `storyboard-idioms` working unchanged when `slug` is present; if `slug` is empty and user picks a single-category type, pick from all selected/available words instead of returning `[]`.

- [ ] **Step 3: Add responsive modal & category checklist styles in `public/games/thai/thai-vocab-hub/style.css`**

- Ensure `.tvh-modal-card` has `max-width: 680px; max-height: 90vh;` and `.tvh-modal-body` has `overflow-y: auto;` so on `360×800` mobile the modal never overflows the viewport.
- Style `.ws100-cat-grid` (2 columns on desktop, 1 column on `< 520px`), `.ws100-cat-chip`, `.ws100-quick-actions`, `.ws100-pool-badge`, and `.ws100-options-grid`.

- [ ] **Step 4: Commit**

```bash
git add public/games/thai/thai-vocab-hub/index.html public/games/thai/thai-vocab-hub/worksheet-generator.js public/games/thai/thai-vocab-hub/style.css
git commit -m "feat(thai-vocab-hub): integrate 100-word A4 multi-category builder into modal"
```

---

### Task 4: Real-Screen Browser & A4 Verification (`scripts/test-thai-vocab-100-sheet-browser.mjs`)

**Files:**
- Create: `scripts/test-thai-vocab-100-sheet-browser.mjs`

**Interfaces:**
- Consumes: Live local HTTP server serving `public/games/thai/thai-vocab-hub/index.html`

- [ ] **Step 1: Write Playwright browser + A4 verification script `scripts/test-thai-vocab-100-sheet-browser.mjs`**

Test cases (covering all 5 Review Focus items):
1. Open `/games/thai/thai-vocab-hub/index.html` at `1280×720` and `360×800` with zero `pageerror` / `console.error`.
2. Click `🖨️ พิมพ์ใบงาน A4` on the Hub view → assert modal opens with `#ws-type` = `vocab-sheet-100` and `#ws-100-panel` visible, zero modal horizontal overflow (`scrollWidth <= clientWidth + 1`).
3. Click `🎲 สุ่ม 4 หมวด`, verify live word count updates (> 100), then click generate and capture the opened preview popup page.
4. On the preview popup page:
   - Assert `.vocab-100-table td.vocab-cell` count is `100`.
   - Assert `.no-print` toolbar has Print, Export PDF, Reroll, and Close buttons.
   - Assert student `.sheet` fits within A4 height (`scrollHeight <= 1123 + 2` px at 96dpi for A4 portrait) with zero horizontal overflow (`scrollWidth <= clientWidth + 1`).
5. Also verify `pnpm verify:game:all -- public/games/thai/thai-vocab-hub` passes.

- [ ] **Step 2: Run unit tests, browser test, and game verifier**

Run:
1. `node scripts/test-thai-vocab-100-sheet.mjs`
2. Start static server / run `node scripts/test-thai-vocab-100-sheet-browser.mjs`
3. `pnpm verify:game:all -- public/games/thai/thai-vocab-hub`

Expected: All assertions PASS, zero errors, zero A4 overflow.

- [ ] **Step 3: Commit**

```bash
git add scripts/test-thai-vocab-100-sheet-browser.mjs
git commit -m "test(thai-vocab-hub): add Playwright browser and A4 layout verification"
```
