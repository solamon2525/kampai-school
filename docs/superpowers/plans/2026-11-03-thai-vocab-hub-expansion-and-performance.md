# Thai Vocab Hub Expansion & Performance Optimization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ยกระดับสื่อการเรียนรู้ "คลังคำศัพท์ภาษาไทย ป.4–6 (Thai Vocab Hub)" ให้แสดงผลลื่นไหลระดับ 60 FPS ปราศจากอาการจอกระตุก/แลคกิ้ง (Eliminate Jank & Layout Thrashing) และขยายคลังคำศัพท์มาตรฐานหลักสูตร สพฐ. จาก 2,400 คำ เป็น 3,200 คำอนุมัติเต็ม 100% (ปลดล็อกและทดแทนคำกักกัน 800 คำในทั้ง 16 หมวดหมู่อย่างสมบูรณ์ พร้อมระบุชนิดของคำ ตัวอย่างประโยค และระดับชั้น ป.4-6)

**Architecture:** สถาปัตยกรรมแบบ 5-File Vanilla Web Game (`index.html`, `style.css`, `config.js`, `data.js`, `game.js`) ภายใต้ Kampai Game SDK ปรับปรุงเอนจินการแสดงผลด้วย Batch DOM Mutation, Progressive RAF Chunking, CSS Containment & GPU Layer Promotion ร่วมกับ In-Memory Cache เพื่อกำจัดการอ่าน Storage แบบ Synchronous ในลูป

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5, CSS3 Custom Properties (Light-mode only), Web Speech API, Kampai Game SDK (`/games/kampai-sdk.js`), Playwright / Node.js test verifiers

**Spec:** เกณฑ์ Classroom-First Product Rules (AGENTS.md), คู่มือ GAME.md / WORKSHEET.md, และคู่มือ DESIGN.md / DESIGN-COMPONENTS.md

---

## Global Constraints

- **5-File Architecture:** ห้ามใช้ ES Modules (`import`/`export`) ในไฟล์ของเกม; โหลดผ่าน `<script>` ตามลำดับ `config.js` -> `data.js` -> `game.js`.
- **Light-Mode Only:** ห้ามมี `bg-white`, `text-black` หรือ hardcoded hex colors ใน selector; ใช้ CSS Variables (`--primary`, `--background`, `--card`, `--text-main`, `--border`) เสมอ.
- **Performance Budget (60 FPS):** การเลื่อนหน้าจอ (Scrolling), การค้นหาแบบ Instant Search, การพลิกการ์ด (3D Card Flip), และการสลับหมวดหมู่ต้องคงอัตราเฟรมไม่ต่ำกว่า 55–60 FPS โดยไม่มี Long Task เกิน 50ms บน CPU ระดับมือถือ/แท็บเล็ตนักเรียน.
- **No Synchronous Disk I/O in Render Loops:** ห้ามเรียก `localStorage.getItem` หรือ `JSON.parse` ซ้ำๆ ในลูปเรนเดอร์การ์ดคำศัพท์อย่างเด็ดขาด.
- **Batch DOM Operations:** แยกเฟสการอ่านมิติ (DOM Reads) ออกจากเฟสการแก้ไขสไตล์/คลาส (DOM Writes) เพื่อป้องกัน Forced Synchronous Layout / Layout Thrashing.
- **Child Cognitive Pacing & Legibility:** ตัวอักษรต้องคมชัด สื่อความหมายเข้าใจง่ายสำหรับเด็กประถมศึกษา และมีเป้าสัมผัส $\ge 44\times 44\text{px}$.
- **Verification Gate:** ต้องผ่าน `node scripts/build-vocab-data.mjs --check` (3,200 คำอนุมัติ 100%) และ `pnpm verify:game:all -- public/games/thai/thai-vocab-hub` ครบทั้ง 12 เช็คก่อนส่งมอบงาน.

---

## Review Focus

1. **Forced Synchronous Layout Elimination:** ตรวจสอบว่าใน `fitGridWordSpans` ไม่มีการสลับอ่าน `scrollWidth`/`clientWidth` และเขียน `classList.add` ซ้ำๆ ในลูปเดียวกัน.
2. **Storage I/O Hoisting:** ตรวจสอบว่า `loadLeitnerMap` และ `loadFlashKnown` ถูกเรียกเพียง 1 ครั้งต่อการโหลดหมวดหมู่ ไม่ใช่ 150-200 ครั้งต่อการเรนเดอร์การ์ด.
3. **Progressive Render Responsiveness:** การค้นหาคำศัพท์หรือการแสดงคำศัพท์ 200 คำต่อหมวดต้องไม่บล็อก UI เธรด โดยใช้ DocumentFragment และ Progressive RAF chunking.
4. **Vocabulary Dataset Integrity:** คำศัพท์ใหม่ 800 คำที่ทดแทนชุด quarantined ต้องมี `word`, `reading`, `meaning`, `pos`, `grade` (ป.4/ป.5/ป.6), และ `example` ที่ถูกต้องตามพจนานุกรมฉบับราชบัณฑิตยสถานและบริบทประถมศึกษา.
5. **Multi-Viewport Responsiveness:** แสดงผลสมบูรณ์ ไม่ล้น ไม่เหลื่อมล้ำ ทั้งบน 360×800 (มือถือ), 768×1024 (แท็บเล็ต), 1280×720 (แล็ปท็อป) และ 1920×1080 (โปรเจกเตอร์ห้องเรียน).

---

## Task Breakdown

### Task 1: Eliminate Main-Thread Bottlenecks & Synchronous Storage I/O in Grid Engine

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/game.js:200-450, 1350-1465`
- Modify: `public/games/thai/thai-vocab-hub/style.css:840-980`
- Test: `scripts/test-vocab-engine-perf.mjs`

**Interfaces:**
- Consumes: `activeCategorySlug`, `gridDisplayWords`, `loadLeitnerMap()`, `loadFlashKnown()`
- Produces: Optimized `renderWordsGrid()`, batched `fitGridWordSpans()`, memoized Leitner progress cache

- [ ] **Step 1: Write performance test to detect layout thrashing and storage read counts in render loop**
  Create `scripts/test-vocab-engine-perf.mjs` with JSDOM tracking:
  - Count calls to `localStorage.getItem` during single `renderWordsGrid()` execution (must be $\le 2$).
  - Detect whether `scrollWidth`/`clientWidth` reads alternate with DOM class mutations.

- [ ] **Step 2: Run test to verify it catches the existing bottlenecks**
  Run: `node scripts/test-vocab-engine-perf.mjs`
  Expected: FAIL with "excessive localStorage calls (>150 detected)" and "layout thrashing detected".

- [ ] **Step 3: Implement Storage I/O Hoisting & Memoization in `game.js`**
  - Hoist `const leitnerMap = loadLeitnerMap(activeCategorySlug);` outside of the `gridDisplayWords.forEach` loop in `renderWordsGrid()`.
  - Add in-memory cache for `leitnerMap` and `flashKnown` so repeated renders within the same session don't re-read `localStorage`.
  - Pass the memoized `leitnerMap` into card creation.

- [ ] **Step 4: Refactor `fitGridWordSpans` to 2-Phase Batched Measurement**
  - Phase 1 (Pure Read): Collect all cards needing span expansion by reading `textEl.scrollWidth > textEl.clientWidth + 1` into an array without modifying any DOM properties.
  - Phase 2 (Pure Write): Schedule class updates (`classList.add('grid-flip-card--span2')`, etc.) inside a single `requestAnimationFrame` callback.
  - Debounce the resize trigger with 150ms trailing edge and abort if width hasn't changed.

- [ ] **Step 5: Apply GPU Layer Promotion & Targeted CSS Transitions in `style.css`**
  - Add `transform: translateZ(0);`, `backface-visibility: hidden;`, and `will-change: transform;` to `.grid-flip-inner`, `.grid-flip-face`, and `.tcard-inner`.
  - Replace wildcard `transition: all 0.2s` on cards with `transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease;`.
  - Add `contain: content;` to `.grid-flip-card` so changes inside a card do not invalidate sibling card layouts.

- [ ] **Step 6: Run test to verify it passes**
  Run: `node scripts/test-vocab-engine-perf.mjs`
  Expected: PASS (0 layout thrashing, localStorage reads $\le 2$, render time $< 16\text{ms}$).

- [ ] **Step 7: Commit**
  ```bash
  git add public/games/thai/thai-vocab-hub/game.js public/games/thai/thai-vocab-hub/style.css scripts/test-vocab-engine-perf.mjs
  git commit -m "perf(thai-vocab-hub): hoist storage I/O and batch grid measurement to eliminate jank"
  ```

---

### Task 2: Progressive Chunked Rendering & Search Acceleration

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/game.js:848-1150`
- Modify: `public/games/thai/thai-vocab-hub/style.css:2800-2950`
- Test: `scripts/test-vocab-search-perf.mjs`

**Interfaces:**
- Consumes: `hubSearchQuery`, `allCategoryWords`, `renderSearchWordCards()`
- Produces: Instant token search index, progressive chunked DOM appender using `DocumentFragment` & `requestAnimationFrame`

- [ ] **Step 1: Write test for search and list rendering responsiveness**
  Create `scripts/test-vocab-search-perf.mjs` verifying:
  - Query filtering executes in $< 5\text{ms}$ over 3,200 items.
  - DOM rendering appends cards using `DocumentFragment` without synchronous main thread freeze $> 16\text{ms}$.

- [ ] **Step 2: Run test to verify initial benchmark**
  Run: `node scripts/test-vocab-search-perf.mjs`
  Expected: Benchmark baseline captured.

- [ ] **Step 3: Implement Pre-Indexed Token Search in `game.js`**
  - Build an inverted search index `window._vocabSearchIndex` mapping normalized search tokens (word, reading, meaning) upon data load.
  - Accelerate `performHubSearch()` to use indexed lookups rather than flat full-scan string filtering.

- [ ] **Step 4: Implement Progressive Chunked Rendering in `renderSearchWordCards` & `renderWordsGrid`**
  - Use `DocumentFragment` to batch initial DOM insertions.
  - If total cards $> 30$, immediately render the first 24 cards (above the fold) to guarantee sub-16ms First Contentful Paint.
  - Yield control to the browser and render remaining cards in chunks of 24 via `requestAnimationFrame`.
  - Provide an active cancellation token so rapid typing cancels prior unrendered chunks immediately.

- [ ] **Step 5: Optimize Font-Size Slider to Root CSS Variable**
  - Replace JavaScript inline DOM tree font modification with setting a CSS custom property `--vocab-text-scale: X` on `#words-grid` or `:root`.
  - Card fonts calculate dynamically via `calc(1rem * var(--vocab-text-scale, 1))` eliminating JavaScript DOM traversals during slider drags.

- [ ] **Step 6: Run test to verify performance criteria**
  Run: `node scripts/test-vocab-search-perf.mjs`
  Expected: PASS (Search latency $< 5\text{ms}$, chunked render maintains 60 FPS).

- [ ] **Step 7: Commit**
  ```bash
  git add public/games/thai/thai-vocab-hub/game.js public/games/thai/thai-vocab-hub/style.css scripts/test-vocab-search-perf.mjs
  git commit -m "perf(thai-vocab-hub): implement progressive chunked rendering and indexed search"
  ```

---

### Task 3: Replace Quarantined Entries & Curate 800+ Authentic Curriculum Words (3,200 Total Approved)

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/data/words/*.json` (16 files)
- Modify: `scripts/build-vocab-data.mjs`
- Test: `scripts/build-vocab-data.mjs --check`

**Interfaces:**
- Consumes: Raw word datasets in `data/words/*.json`
- Produces: 3,200 fully approved curriculum words (200 words $\times$ 16 categories), 0 quarantined items, updated `data.js`

- [ ] **Step 1: Write dataset validation and completeness check**
  Run: `node scripts/build-vocab-data.mjs --check`
  Expected: Shows 16 warnings: 150/200 approved (quarantined excluded), 2,400 approved words.

- [ ] **Step 2: Replace 50 quarantined words in Categories 1–4 with authentic curriculum entries**
  - `misspelled.json` (คำที่มักเขียนผิด): เพิ่ม 50 คำ เช่น กะพริบ, กาลเทศะ, คอนเสิร์ต, จะละเม็ด, ชวาลา, ทัณฑฆาต, ทะนุถนอม, นิทรรศการ, บัณฑิต, พะแนง, ผัดไทย, สับปะรด ฯลฯ พร้อม `pos`, `grade`, `reading`, `example`.
  - `homophones.json` (คำพ้องรูปพ้องเสียง): เพิ่ม 50 คำพ้องเสียง/พ้องรูป เช่น สรรค์/สรร/ศัลย์, การ/กาล/กาญจน์, บาท/บาตร/บาป, พุทธ/พุธ ฯลฯ.
  - `classifiers.json` (ลักษณนามน่ารู้): เพิ่ม 50 ลักษณนามเฉพาะ เช่น พระองค์, รูป, เล่ม, ใบ, ปาก, หลัง, ตน, เชือก, คัน, ปื้น ฯลฯ.
  - `royal.json` (คำราชาศัพท์และคำสุภาพ): เพิ่ม 50 คำ เช่น พระราชหัตถเลขา, พระเนตร, พระนลาฏ, สถิต, เสวย, เสด็จพระราชดำเนิน, สวรรคต ฯลฯ.

- [ ] **Step 3: Replace 50 quarantined words in Categories 5–8 with authentic curriculum entries**
  - `idioms.json` (สำนวนไทยมีคติ): เพิ่ม 50 สำนวน เช่น ไก่งามเพราะขน คนงามเพราะแต่ง, คมในฝัก, ชักน้ำเข้าลึก ชักศึกเข้าบ้าน, น้ำขึ้นให้รีบตัก, ฝนตกไม่ทั่วฟ้า ฯลฯ.
  - `blends.json` (คำควบกล้ำแท้-ไม่แท้): เพิ่ม 50 คำ เช่น ปรับปรุง, กว้างขวาง, ขลาดเขลา, ตรากตรำ, คลาดแคล้ว, เพริศพริ้ง, แทรกซึม, ทราบ ฯลฯ.
  - `leading.json` (คำอักษรนำจำง่าย): เพิ่ม 50 คำ เช่น ตลาด, ตลอด, ฉลาด, ผลิต, ปรอท, จริต, สมัคร, องุ่น, ขนม, สยาย ฯลฯ.
  - `lesson.json` (คำศัพท์ภาษาพาที): เพิ่ม 50 คำจากบทเรียน ป.4–6 เช่น คร่ำครวญ, อหังการ, วิกฤตการณ์, กัลปพฤกษ์, อัศจรรย์, วรรณกรรม ฯลฯ.

- [ ] **Step 4: Replace 50 quarantined words in Categories 9–12 with authentic curriculum entries**
  - `p5-focus.json` (คำศัพท์ตามหน่วยการเรียน): เพิ่ม 50 คำระดับ ป.5–6 เช่น ประชาธิปไตย, สิ่งแวดล้อม, อุดมสมบูรณ์, วัฒนธรรม, เอกลักษณ์ ฯลฯ.
  - `difficult.json` (คำยากชวนฝึก): เพิ่ม 50 คำ เช่น ทัศนียภาพ, อุตสาหกรรม, ปรากฏการณ์, วิทยาการ, สุนทรียภาพ ฯลฯ.
  - `loanwords.json` (คำภาษาต่างประเทศ): เพิ่ม 50 คำภาษาเขมร/บาลี-สันสกฤต/อังกฤษ/จีน เช่น บรรทม, ดำริ, เสวย, ปัญญา, มหาสมุทร, คอมพิวเตอร์, อินเทอร์เน็ต, ก๋วยเตี๋ยว ฯลฯ.
  - `spelling.json` (มาตราตัวสะกด 8 แม่): เพิ่ม 50 คำเน้นแม่กด กบ กน กก เช่น ปราโมทย์, มารยาท, อนุญาต, อภิปราย, สัญญา, สังเกต ฯลฯ.

- [ ] **Step 5: Replace 50 quarantined words in Categories 13–16 with authentic curriculum entries**
  - `synonyms.json` (คำพ้องความหมาย / ไวพจน์): เพิ่ม 50 คำ เช่น กุญชร/คชสาร (ช้าง), สุริยา/ทินกร (พระอาทิตย์), ธารา/คงคา (น้ำ) ฯลฯ.
  - `antonyms.json` (คำตรงข้าม): เพิ่ม 50 คำ เช่น ประหยัด-สุรุ่ยสุร่าย, ถ่อมตน-เย่อหยิ่ง, สรรเสริญ-นินทา, สามัคคี-แตกแยก ฯลฯ.
  - `livedead.json` (คำเป็น-คำตาย): เพิ่ม 50 คำแยกตามกฎเสียงยาว-สั้นและมาตราตัวสะกดอย่างชัดเจน.
  - `reduplication.json` (คำซ้ำ-คำซ้อน): เพิ่ม 50 คำ เช่น บ้านเรือน, เสื้อผ้า, ข้าวปลา, ไปๆ มาๆ, เงียบกริบ, อ่อนนุ่ม ฯลฯ.

- [ ] **Step 6: Build and compile updated `data.js`**
  Run: `node scripts/build-vocab-data.mjs`
  Expected: Output `✅ Wrote public/games/thai/thai-vocab-hub/data.js (16 หมวด · 3200 คำ, 200 คำต่อหมวดครบ 100%)`.

- [ ] **Step 7: Run verification check**
  Run: `node scripts/build-vocab-data.mjs --check`
  Expected: All 16 categories show `✅ 200 approved (0 quarantined)`.

- [ ] **Step 8: Commit**
  ```bash
  git add public/games/thai/thai-vocab-hub/data/words/*.json public/games/thai/thai-vocab-hub/data.js
  git commit -m "feat(thai-vocab-hub): expand approved curriculum vocabulary bank to 3,200 words"
  ```

---

### Task 4: Automated Verification, Game SDK Quality Gate & 60 FPS Multi-Viewport Testing

**Files:**
- Modify: `scripts/test-vocab-engine-perf.mjs`
- Modify: `src/components/admin/system/SystemOverview.tsx`
- Run: `pnpm verify:game:all -- public/games/thai/thai-vocab-hub`

**Interfaces:**
- Consumes: All updated Thai Vocab Hub components, data, and styles
- Produces: System version entry update, verification artifacts, 0 console errors across viewports

- [ ] **Step 1: Run comprehensive Thai Vocab Hub verification suite**
  Run: `pnpm verify:game:all -- public/games/thai/thai-vocab-hub`
  Expected: Checks 1–12 PASS (DOM dependency check, SDK integration, light mode vars, 16:9 cover ratio, browser smoke tests).

- [ ] **Step 2: Run automated multi-viewport frame rate and render check**
  Execute Playwright headless test across 360×800 (Mobile), 768×1024 (Tablet), 1280×720 (Desktop), and 1920×1080 (Projector):
  - Verify card layout does not overflow or truncate Thai tone marks / vowels (`ปี่`, `กึ่ง`, `น้ำ`).
  - Verify 3D card flip animation completes cleanly without stutter.
  - Verify search query typing maintains consistent 60 FPS.

- [ ] **Step 3: Update `SystemOverview.tsx` version history**
  Add entry at top of `versionHistory` recording Thai Vocab Hub v2.2 performance overhaul (60 FPS engine, 3,200 approved vocabulary bank, zero layout thrashing).

- [ ] **Step 4: Commit and Push**
  ```bash
  git add src/components/admin/system/SystemOverview.tsx
  git commit -m "docs(system): log thai vocab hub v2.2 performance and 3,200 words expansion"
  git push origin main
  ```
