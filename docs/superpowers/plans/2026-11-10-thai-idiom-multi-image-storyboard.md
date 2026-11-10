# Thai Idiom Multi-Image Storyboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ยกระดับหมวด "สำนวนไทยมีคติ" ใน Thai Vocab Hub ให้สามารถเปิดการ์ดดูภาพประกอบแบบต่อเนื่องหลายภาพต่อ 1 สำนวน (2–3 panels: ที่มาเปรียบเทียบ ➔ การกระทำ/ผลลัพธ์ ➔ คติสอนใจจริง) พร้อมระบบดูแบบสไลด์และกระดานเรื่องราวการ์ตูน (Comic Strip) สำหรับการสอนในห้องเรียน

**Architecture:** ขยายสกีมาของคำศัพท์ใน `data/words/idioms.json` ให้รองรับโครงสร้าง `images: Array<{ step, phase, url, alt, caption }>` ควบคู่กับ fallback `image_url` เดิม; พัฒนาตัวแสดงผล `IdiomStoryboardModal` รองรับทั้งโหมดเลื่อนทีละตอน (Slide View) พร้อมปุ่มอ่านเสียง TTS และโหมดกระดานรวมเรื่องราว (Comic Strip View) ที่ฉายขึ้นจอโปรเจกเตอร์ได้เต็มจอไม่ล้น; อัปเดต pipeline ตรวจสอบข้อมูลใน `validate-vocab.mjs` และ `build-vocab-data.mjs` พร้อมชุดภาพตัวอย่างระดับคุณภาพสูง (Chibi clean line art, safe zone 16:9)

**Tech Stack:** Vanilla JavaScript (ES6, zero external bundling/ES modules in game files), CSS Variables (Tailwind semantic tokens, Light-only), HTML5 Audio / KAMPAI Sound SDK, Sharp / WebP image optimization, Node.js validation scripts.

**Spec:** [AGENTS.md](../../../AGENTS.md), [.agents/AGENTS.md](../../../.agents/AGENTS.md) Rule 3.F (Cover & Illustration guidelines), Rule 3.G (Child Cognitive Pacing), [DESIGN.md](../../../DESIGN.md) Rule 14.x.

## Global Constraints

- **Styling:** Light mode only (`bg-background`, `bg-card`, `text-foreground`, `border-border`, gold+navy brand accent); ห้าม `dark:` หรือ hardcoded hex colors ใน markup
- **Package Manager:** `pnpm` เท่านั้น
- **Modularity in Game:** ห้ามใช้ ES Modules (`import`/`export`) ในไฟล์ของเกม (`game.js`, `data.js`, `config.js`)
- **Classroom-First:** Real-screen truth (ตรวจ 360×800 และ 1280×720); Touch targets $\ge 44\times 44\text{px}$; Zero vertical overflow ในหน้าจอหลัก
- **Non-Violent & Kid-Friendly:** ภาพประกอบต้องน่ารัก ลายเส้นสะอาด (Chibi clean line art), สอดคล้องกับคติสอนใจ ไม่มีความรุนแรง

## Review Focus

1. **Idiom without images:** การ์ดสำนวนที่ยังไม่มีภาพหลายตอน ต้องแสดงผลตามปกติ (Emoji + คำศัพท์ + คำอ่าน + ความหมาย) โดยไม่มีข้อผิดพลาด JavaScript หรือปุ่มที่กดแล้วค้าง
2. **Missing image file / 404 handling:** หากไฟล์ภาพไม่สามารถโหลดได้ ตัวแสดงผลต้องมี `onerror` fallback ที่นุ่มนวล พร้อมป้ายเตือนแบบสุภาพ ไม่ทำให้หน้าจอค้าง
3. **Sequential Navigation Boundaries:** ปุ่มก่อนหน้า (Prev) บนภาพที่ 1 และปุ่มถัดไป (Next) บนภาพสุดท้าย ต้องถูก disable หรือวนรอบอย่างถูกต้อง และแป้นพิมพ์ลูกศร (Left/Right arrow) ต้องตอบสนองแม่นยำ
4. **Projector Screen Fit vs Mobile View:** ในโหมดกระดานรวม (Comic Strip) บนจอขนาดเล็ก (Mobile 360×800) ต้องแสดงผลเป็น vertical stacked cards อ่านง่าย และบนจอใหญ่ (1280×720) ต้องเรียงเป็น 2-3 คอลัมน์ที่มองเห็นพร้อมกันโดยไม่ตกขอบ
5. **TTS Audio Interruptions:** เมื่อกดฟังเสียงอ่านคำบรรยายภาพในตอนใดตอนหนึ่ง แล้วเปลี่ยนไปยังตอนถัดไปหรือปิด modal เสียงอ่านเดิมต้องถูกยกเลิก (`cancelSpeech()` / `stopSpeak()`) ทันที ไม่ซ้อนทับกัน

---

### Task 1: Data Model & Validation Pipeline for Multi-Image Idioms

**Files:**
- Modify: `scripts/validate-vocab.mjs`
- Modify: `scripts/build-vocab-data.mjs`
- Create: `tests/thai-vocab-hub/idiom-images-schema.test.mjs`

**Interfaces:**
- Consumes: `public/games/thai/thai-vocab-hub/data/words/idioms.json`, `data/categories.json`
- Produces: `window.GAME_DATA.words.idioms` with preserved `images` array in `public/games/thai/thai-vocab-hub/data.js`
- Schema for each image step:
  ```ts
  interface IdiomImageStep {
    step: number;        // 1, 2, 3
    phase: string;       // e.g. "ที่มาเปรียบเทียบ", "การกระทำ/ผลลัพธ์", "คติสอนใจจริง"
    url: string;         // e.g. "assets/idiom-visuals/pig-tail-mud-1.webp"
    alt: string;         // accessibility description
    caption: string;     // textual explanation read aloud by TTS
  }
  ```

- [ ] **Step 1: Write the failing test**

Create `tests/thai-vocab-hub/idiom-images-schema.test.mjs` asserting that:
1. `validate-vocab.mjs` allows `images` array and `image_url` on `slug === 'idioms'` (not just `royal`).
2. Each item in `images` has valid `step`, `phase`, `url`, `alt`, and `caption`.
3. Referenced local files inside `public/games/thai/thai-vocab-hub/` exist.
4. `build-vocab-data.mjs` preserves `images` property in the compiled `data.js`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/thai-vocab-hub/idiom-images-schema.test.mjs`
Expected: FAIL (because `validate-vocab.mjs` currently limits pilot images strictly to `slug === 'royal'`).

- [ ] **Step 3: Update `validate-vocab.mjs` and `build-vocab-data.mjs`**

1. In `scripts/validate-vocab.mjs`:
   - Extend the image validation check: allow `slug === 'royal' || slug === 'idioms'`.
   - Add validation for `item.images`: if present, ensure it is a non-empty Array of objects with non-empty `url`, `alt`, `caption`, and ensure the file exists on disk.
2. In `scripts/build-vocab-data.mjs`:
   - Ensure the whitelist/strip logic preserves `images` alongside `image_url` and `image_alt`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/thai-vocab-hub/idiom-images-schema.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/validate-vocab.mjs scripts/build-vocab-data.mjs tests/thai-vocab-hub/idiom-images-schema.test.mjs
git commit -m "feat(thai-vocab-hub): support multi-image storyboard schema and validation for idioms"
```

---

### Task 2: Pilot Multi-Image Storyboard Visual Assets Generation

**Files:**
- Create: `public/games/thai/thai-vocab-hub/assets/idiom-visuals/` (directory for storyboard panels)
- Create: `scripts/process-idiom-visuals.mjs` (sharp pipeline to resize and convert raw panels to 16:9 WebP)
- Create: Storyboard panels for the top 10 iconic moral idioms:
  1. `pig-tail-mud-1.webp`, `pig-tail-mud-2.webp`, `pig-tail-mud-3.webp` (ดินพอกหางหมู)
  2. `ride-elephant-catch-grasshopper-1.webp`, `-2.webp`, `-3.webp` (ขี่ช้างจับตั๊กแตน)
  3. `water-rise-fetch-1.webp`, `-2.webp`, `-3.webp` (น้ำขึ้นให้รีบตัก)
  4. `rabbit-alarmist-1.webp`, `-2.webp`, `-3.webp` (กระต่ายตื่นตูม)
  5. `toad-on-palanquin-1.webp`, `-2.webp`, `-3.webp` (คางคกขึ้นวอ)
  6. `good-carry-gable-1.webp`, `-2.webp`, `-3.webp` (รักดีหามจั่ว รักชั่วหามเสา)
  7. `frog-in-coconut-shell-1.webp`, `-2.webp`, `-3.webp` (กบในกะลาครอบ)
  8. `dip-hand-take-food-1.webp`, `-2.webp` (ชุบมือเปิบ)
  9. `bow-arrow-not-eat-1.webp`, `-2.webp` (ศรศิลป์ไม่กินกัน)
  10. `draw-five-rivers-1.webp`, `-2.webp` (ชักแม่น้ำทั้งห้า)
- Modify: `public/games/thai/thai-vocab-hub/data/words/idioms.json` (attach `images` array and `image_url` to the 10 pilot idioms)

**Interfaces:**
- Produces: High-quality, lightweight 16:9 WebP assets in `public/games/thai/thai-vocab-hub/assets/idiom-visuals/*.webp`
- Enriches: 10 idioms with sequential panels in `idioms.json`.

- [ ] **Step 1: Write test for asset integrity and dimensions**

Create `tests/thai-vocab-hub/idiom-assets-integrity.test.mjs` checking that:
- Every image file exists in `public/games/thai/thai-vocab-hub/assets/idiom-visuals/`.
- File format is valid WebP or SVG, file size is under 200KB per panel.
- 10 pilot idioms in `idioms.json` have complete metadata (`step`, `phase`, `url`, `alt`, `caption`).

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/thai-vocab-hub/idiom-assets-integrity.test.mjs`
Expected: FAIL (assets and JSON links do not exist yet).

- [ ] **Step 3: Implement asset generation and JSON integration**

1. Create `scripts/process-idiom-visuals.mjs` using `sharp` to process high-resolution chibi vector/artwork into clean 16:9 WebP assets ($800\times 450$ px, quality 85) with bright, kid-friendly palettes.
2. Generate and store the panels for all 10 pilot idioms.
3. Update `public/games/thai/thai-vocab-hub/data/words/idioms.json` with the sequential `images` array and backward-compatible `image_url: images[0].url` for each of the 10 pilot idioms.
4. Run `pnpm build:vocab` to update `public/games/thai/thai-vocab-hub/data.js`.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/thai-vocab-hub/idiom-assets-integrity.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add public/games/thai/thai-vocab-hub/assets/idiom-visuals/ public/games/thai/thai-vocab-hub/data/words/idioms.json public/games/thai/thai-vocab-hub/data.js scripts/process-idiom-visuals.mjs tests/thai-vocab-hub/idiom-assets-integrity.test.mjs
git commit -m "feat(thai-vocab-hub): add multi-image storyboard assets for 10 iconic Thai idioms"
```

---

### Task 3: Idiom Storyboard Modal UI (Slide Mode & Comic Strip Mode)

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/index.html` (add `#idiom-storyboard-modal` template)
- Modify: `public/games/thai/thai-vocab-hub/style.css` (modal styling, slide transitions, comic strip grid, badges)
- Modify: `public/games/thai/thai-vocab-hub/game.js` (card visual badges, open storyboard modal, slide/strip toggles, TTS integration)

**Interfaces:**
- Consumes: `item.images` or `item.image_url` from clicked vocab card.
- Produces: Interactive modal with:
  - `openIdiomStoryboard(item)`
  - `closeIdiomStoryboard()`
  - `setStoryboardViewMode('slide' | 'strip')`
  - `goToStoryboardStep(stepIndex)`
  - `speakStoryboardCaption(stepIndex)`

- [ ] **Step 1: Write smoke test for Storyboard Modal in browser/JSDOM**

Create `tests/thai-vocab-hub/idiom-storyboard-ui.test.mjs`:
- Renders a card with `images` array.
- Checks that the card displays a visual badge (e.g., `🎬 3 ตอน` or `🖼️ ภาพเรื่องราว`).
- Simulates clicking the visual button: modal opens, title matches idiom word, displays step 1 image and caption.
- Simulates next step: switches to step 2 image and caption.
- Simulates switching to Comic Strip mode: renders 3 panels side-by-side.
- Simulates closing modal: modal closes, audio stops.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/thai-vocab-hub/idiom-storyboard-ui.test.mjs`
Expected: FAIL (`openIdiomStoryboard` not defined).

- [ ] **Step 3: Implement Storyboard Modal UI & Logic**

1. In `public/games/thai/thai-vocab-hub/index.html`:
   - Add `<div id="idiom-storyboard-modal" class="storyboard-modal" style="display:none" role="dialog" aria-modal="true">` with:
     - Header: Word title, reading, TTS button, View Mode Switcher `[ 🖼️ สไลด์ | 🎬 เรียงเรื่องราว ]`, Close button `×`.
     - Slide View Container: Image display with safe 16:9 aspect ratio, Step dots (`1`, `2`, `3`), Caption card, TTS speak button, Prev/Next navigation buttons.
     - Strip View Container: Responsive flex/grid container showing all steps in sequence with numbered phase headers and descriptions.
     - Footer: Moral takeaway callout ("💡 คติสอนใจ") and real-world usage example.
2. In `public/games/thai/thai-vocab-hub/style.css`:
   - Add responsive styles using Light-only tokens (`bg-card`, `text-foreground`, gold/navy accents).
   - Ensure touch targets $\ge 48\times 48\text{px}$, smooth transitions, zero body scroll when modal is active (`overflow: hidden` on body).
3. In `public/games/thai/thai-vocab-hub/game.js`:
   - In `createGridCardElement`: If `item.images && item.images.length > 0`, add badge `🎬 ${item.images.length} ตอน` on front and a prominent button `🖼️ ดูเรื่องราว (${item.images.length} ภาพ)` on back.
   - Implement `openIdiomStoryboard(item)`, `closeIdiomStoryboard()`, `setStoryboardViewMode(mode)`, and keyboard navigation (Escape to close, Left/Right arrows for slides).

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/thai-vocab-hub/idiom-storyboard-ui.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add public/games/thai/thai-vocab-hub/index.html public/games/thai/thai-vocab-hub/style.css public/games/thai/thai-vocab-hub/game.js tests/thai-vocab-hub/idiom-storyboard-ui.test.mjs
git commit -m "feat(thai-vocab-hub): implement multi-image storyboard modal with slide and comic strip modes"
```

---

### Task 4: Storyboard Filter & Classroom Worksheet Integration

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/game.js` (add quick filter pill for idioms with storyboards)
- Modify: `public/games/thai/thai-vocab-hub/worksheet-generator.js` (add printable Comic Storyboard worksheet format)
- Test: `tests/thai-vocab-hub/idiom-worksheet.test.mjs`

**Interfaces:**
- Consumes: Filtered idiom list containing `images` array.
- Produces:
  - Filter pill `🎬 เฉพาะคำที่มีภาพเรื่องราว` in the grid header.
  - Printable A4 worksheet layout: "ใบงานสำนวนไทยจากภาพเรื่องราว (Sequential Idiom Storyboard Worksheet)".

- [ ] **Step 1: Write test for filter pill and worksheet generation**

Create `tests/thai-vocab-hub/idiom-worksheet.test.mjs`:
- Verifies that filtering by `has_storyboard` returns only idioms with `images.length > 0`.
- Verifies that `generateStoryboardWorksheet()` produces valid HTML containing image panels and question lines for students.

- [ ] **Step 2: Run test to verify it fails**

Run: `node tests/thai-vocab-hub/idiom-worksheet.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement filter and worksheet layout**

1. In `public/games/thai/thai-vocab-hub/game.js`:
   - Add filter toggle in `buildGridFilterPickers`: button `🎬 มีภาพเรื่องราว (${count})`.
2. In `public/games/thai/thai-vocab-hub/worksheet-generator.js`:
   - Add template `storyboard-panels`: generates an A4 worksheet with 2-3 visual panels per idiom, asking students to identify the idiom, explain what is happening in each panel, and write the moral lesson.

- [ ] **Step 4: Run test to verify it passes**

Run: `node tests/thai-vocab-hub/idiom-worksheet.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add public/games/thai/thai-vocab-hub/game.js public/games/thai/thai-vocab-hub/worksheet-generator.js tests/thai-vocab-hub/idiom-worksheet.test.mjs
git commit -m "feat(thai-vocab-hub): add storyboard filter and printable comic worksheet layout"
```

---

### Task 5: End-to-End Verification, Browser Smoke Test, and Documentation Sync

**Files:**
- Modify: `DESIGN.md` (document multi-image storyboard pattern and visual idiom standard)
- Modify: `DESIGN-COMPONENTS.md` (add IdiomStoryboardModal spec)
- Modify: `src/components/admin/system/SystemOverview.tsx` (add entry to `versionHistory`)

- [ ] **Step 1: Run comprehensive verification suite**

1. Run: `node scripts/validate-vocab.mjs --strict`
   Expected: Validation passes without errors for royal and idiom visual assets.
2. Run: `pnpm build:vocab`
   Expected: Wrote `data.js` successfully with all categories and approved words intact.
3. Run: `pnpm verify:game:all -- public/games/thai/thai-vocab-hub`
   Expected: PASS all static and runtime checks.
4. Verify HTTP/browser on 360×800 (mobile) and 1280×720 (desktop/projector).

- [ ] **Step 2: Sync documentation**

1. In `DESIGN.md`: Add section on Multi-Image Storyboard component for educational metaphors.
2. In `DESIGN-COMPONENTS.md`: Add component specification for `IdiomStoryboardModal` and its dual viewing modes.
3. In `src/components/admin/system/SystemOverview.tsx`: Add entry to `versionHistory` describing the Thai Idiom Multi-Image Storyboard evolution.

- [ ] **Step 3: Commit**

```bash
git add DESIGN.md DESIGN-COMPONENTS.md src/components/admin/system/SystemOverview.tsx
git commit -m "docs: sync design standards and system overview for thai idiom storyboard"
```
