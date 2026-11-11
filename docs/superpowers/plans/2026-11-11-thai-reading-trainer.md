# Thai Reading Studio Theater (`reading-studio`) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Thai Reading Studio Theater (`reading-trainer.js`), a dedicated 200-word reading trainer category (`reading-studio`) curating 100 difficult words and 100 royal words with projector-sized screen, step-by-step syllable decomposition, and audio synthesis in `thai-vocab-hub`.

**Architecture:** A standalone client-side engine (`reading-trainer.js`) in IIFE style exposing `window.ThaiReadingTrainer`, integrated with the existing Thai Vocab Hub dataset and card grid. The engine splits hyphenated phonetic syllables into interactive chips, drives a 3-step state machine (Word ➔ Syllables ➔ Meaning/Context), synthesizes audio effects via Web Audio API, and reads aloud via Web Speech API.

**Tech Stack:** Vanilla JavaScript (IIFE, no ES modules), Web Audio API, Web Speech API, CSS3 Keyframe Animations, HTML5, Node.js build tooling (`pnpm build:vocab`).

**Spec:** [`docs/superpowers/specs/2026-11-11-thai-reading-trainer-design.md`](file:///d:/kampai-school-main/docs/superpowers/specs/2026-11-11-thai-reading-trainer-design.md)

## Global Constraints

- **Classroom-first viewport rules:** Zero horizontal overflow across Phone (360×800), Tablet (768×1024), and Desktop (1280×720).
- **Light mode only:** No dark mode classes (`dark:`), clean high contrast with dark text (`#0f172a`) on white stage (`#ffffff`).
- **No ES Modules in game scripts:** Game files in `public/games/` use IIFE and attach to `window`.
- **Package manager:** `pnpm` only.
- **Dataset conformity:** Exactly 200 approved words per category enforced by `scripts/build-vocab-data.mjs`.

## Review Focus

1. **Missing hyphen in word reading:** A small number of words might lack hyphens in `reading`; the syllable parser must fall back gracefully to displaying the single full phonetic string without crashing or rendering empty chips.
2. **Speech synthesis cancellation:** Rapidly pressing `Spacebar` or clicking next word must call `window.speechSynthesis.cancel()` to prevent queued audio overlap.
3. **AudioContext policy on mobile:** Web Audio `AudioContext` must initialize/resume on explicit user gesture (click/keydown) to prevent browser console warnings.
4. **Touch targets on mobile:** All buttons and syllable chips in the theater modal must be at least 44×44px or have minimum touch padding for small screens.
5. **Card click event propagation:** Clicking the `📖 ฝึกอ่าน` badge on a vocabulary card must call `event.stopPropagation()` so it doesn't trigger card flip or route navigation.

---

### Task 1: Generate & Validate Curated Word Dataset (`reading-studio.json`) and Update `categories.json`

**Files:**
- Create: `public/games/thai/thai-vocab-hub/data/words/reading-studio.json`
- Modify: `public/games/thai/thai-vocab-hub/data/categories.json`
- Target Artifact: `public/games/thai/thai-vocab-hub/data.js`

**Interfaces:**
- Produces: 200 curated approved items with `{ id, word, reading, meaning, pos, grade, example, sub_category, image_url?, emoji, content_status: 'approved' }`

- [ ] **Step 1: Write generation script to curate 100 difficult words + 100 royal words**
  Extract 100 multi-syllable items from `difficult.json` and 100 items from `royal.json`, tagging them with `sub_category: 'difficult'` and `sub_category: 'royal'`.

- [ ] **Step 2: Add category entry in `public/games/thai/thai-vocab-hub/data/categories.json`**
  ```json
  {
    "slug": "reading-studio",
    "title": "ฝึกอ่านคำยากและราชาศัพท์",
    "icon": "📖",
    "desc": "ฝึกแจกพยางค์คำอ่านคำยากและคำราชาศัพท์ พร้อมเสียงอ่านและจอใหญ่ฉายห้องเรียน"
  }
  ```

- [ ] **Step 3: Run `node scripts/build-vocab-data.mjs` and verify dataset**
  Run: `node scripts/build-vocab-data.mjs --check`
  Expected: All categories pass with 200 approved words, including `reading-studio`.

- [ ] **Step 4: Compile `data.js`**
  Run: `node scripts/build-vocab-data.mjs`
  Expected: `✅ Wrote .../public/games/thai/thai-vocab-hub/data.js`

---

### Task 2: Implement Reading Studio Theater Module (`reading-trainer.js`)

**Files:**
- Create: `public/games/thai/thai-vocab-hub/reading-trainer.js`

**Interfaces:**
- Produces: `window.ThaiReadingTrainer` with methods:
  - `open(word?: string, filter?: string)`: Opens modal and navigates to target word
  - `close()`: Closes modal and cancels speech
  - `nextStep()`: Advances step 1 ➔ 2 ➔ 3 ➔ Next word
  - `prevStep()`: Goes back a step or previous word
  - `selectWord(index: number)`: Jumps to specific word in playlist
  - `setFilter(filter: 'all' | 'difficult' | 'royal')`: Changes active filter
  - `speakWord()`: Speaks the full word via Web Speech API
  - `speakSyllable(syllableText: string)`: Speaks single syllable via Web Speech API
  - `isReadingWord(word: string)`: Returns boolean if word exists in curated set

- [ ] **Step 1: Implement Web Audio synthesis class (`ReadingAudio`)**
  Synthesizes `playPop()` (short percussive sine chirp for chip entry) and `playChime()` (harmonic chord for meaning resolution).

- [ ] **Step 2: Implement modal DOM generator and template (`ensureModal`)**
  Generates `#tvh-reading-modal` containing:
  - Header with title, sound toggle, and close button
  - Filter bar tabs: *ทั้งหมด (๒๐๐)*, *คำยาก (๑๐๐)*, *คำราชาศัพท์ (๑๐๐)*
  - Theater stage wrapper (`#reading-stage-screen`)
  - Subtitle equation / word reading summary (`#reading-reading-text`)
  - Examples / Quick Word Jumper chips row
  - Footer with step indicator and action buttons (`Spacebar`)

- [ ] **Step 3: Implement Syllable Parser & 3-Step Renderer (`renderStage`)**
  - Step 1: Full word displayed in `clamp(72px, 14vw, 140px)` bold text.
  - Step 2: Hyphenated reading split into pastel candy chips `[ อะ ] [ ทิด ] [ ถาน ]`. Clicking any chip invokes `speakSyllable()`.
  - Step 3: Resolution with definition, common Thai synonym (for royal words), example sentence, and thumbnail (if `image_url` available).
  - Web Speech synthesis readout automatically on Step 2 / Step 3.

- [ ] **Step 4: Implement Keyboard Navigation**
  Event listener for `Spacebar` / `ArrowRight` (Next), `ArrowLeft` (Prev), and `Escape` (Close).

---

### Task 3: Implement Reading Studio Styles & Keyframes (`style.css`)

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/style.css`

**Interfaces:**
- Produces CSS classes:
  - `.reading-theater-card`, `.reading-stage-wrapper`, `.reading-stage-screen`
  - `.reading-word-full`, `.syllable-chips-group`, `.syllable-chip`
  - `.syllable-chip-0`, `.syllable-chip-1`, `.syllable-chip-2`, `.syllable-chip-3`, `.syllable-chip-4`
  - `.reading-meaning-card`, `.reading-example-box`, `.badge-reading-trigger`

- [ ] **Step 1: Add modal layout and backdrop styles**
  Style `.reading-theater-card` with max-width 880px, responsive padding, and high-contrast card borders.

- [ ] **Step 2: Add stage typography and candy syllable chips**
  Style `.syllable-chip` with rounded 16px borders, vibrant pastel backgrounds, hover effects, and minimum 44px height for touch accessibility.

- [ ] **Step 3: Add keyframe animations**
  `@keyframes syllablePop`: staggered pop-in animation for syllable chips.

- [ ] **Step 4: Add `.badge-reading-trigger` styling for word cards**
  Soft purple pill badge (`background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff;`).

---

### Task 4: Integrate Reading Studio into Thai Vocab Hub (`index.html` & `game.js`)

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/index.html`
- Modify: `public/games/thai/thai-vocab-hub/game.js`

**Interfaces:**
- Consumes: `window.ThaiReadingTrainer`

- [ ] **Step 1: Update `index.html`**
  - Add `<script src="reading-trainer.js"></script>` before `game.js`.
  - Add header launcher button:
    `<button type="button" class="cbtn" id="btn-reading-theater-toggle" onclick="window.ThaiReadingTrainer.open()" title="ห้องเรียนฝึกอ่านคำยากและคำราชาศัพท์">📖 ฝึกอ่านคำยาก-ราชาศัพท์</button>`
  - Add toolbar launcher button in bottom bar:
    `<button type="button" class="cbtn" onclick="window.ThaiReadingTrainer.open()" title="ฝึกอ่านคำยาก-ราชาศัพท์">📖 ฝึกอ่าน</button>`

- [ ] **Step 2: Update `createGridCardElement` in `game.js`**
  Check `window.ThaiReadingTrainer && window.ThaiReadingTrainer.isReadingWord(item.word)`. If true, render `badge-reading-trigger` next to word. Wire click event to `window.ThaiReadingTrainer.open(item.word)`.

- [ ] **Step 3: Update `createSearchCardElement` in `game.js`**
  Render `badge-reading-trigger` in search result cards for matching words.

---

### Task 5: End-to-End Verification, Documentation & Production Readiness

**Files:**
- Modify: `src/components/admin/system/SystemOverview.tsx`
- Modify: `walkthrough.md`

- [ ] **Step 1: Run static and browser verification suite**
  Run: `pnpm verify:game:all -- public/games/thai/thai-vocab-hub`
  Expected: Checks 1–12 pass + Playwright viewports (Phone, Tablet, Desktop) pass with zero errors.

- [ ] **Step 2: Run Vite production build**
  Run: `pnpm build`
  Expected: Build succeeds with zero errors.

- [ ] **Step 3: Update `SystemOverview.tsx` with version history `v2.8.9`**
  Document the Thai Reading Studio Theater release under `versionHistory`.

- [ ] **Step 4: Update `walkthrough.md`**
  Document changes, features, and verification evidence.

- [ ] **Step 5: Git commit and push to `origin/main`**
  Stage only the task-specific files:
  `git add public/games/thai/thai-vocab-hub/data/words/reading-studio.json public/games/thai/thai-vocab-hub/data/categories.json public/games/thai/thai-vocab-hub/data.js public/games/thai/thai-vocab-hub/reading-trainer.js public/games/thai/thai-vocab-hub/style.css public/games/thai/thai-vocab-hub/index.html public/games/thai/thai-vocab-hub/game.js src/components/admin/system/SystemOverview.tsx docs/superpowers/specs/2026-11-11-thai-reading-trainer-design.md docs/superpowers/plans/2026-11-11-thai-reading-trainer.md`
  Commit with Conventional Commits message and push.
