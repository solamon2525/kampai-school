# Top 10 Most-Used Educational Games Comprehensive Evolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simultaneously elevate the 10 most frequently used educational games in Kampai School across learning & teaching dimensions, visuals & audio, quality contract compliance, speed/performance, and curriculum accuracy.

**Architecture:** A shared modular architecture where games integrate standardized `/games/kampai-versus.js` for 3-mode play (Solo, Local Hotseat, Online), shared classroom tools (Projector Mode & Canvas randomizer), 1-click A4 printable worksheets, and localized sound/visual assets. Each game's problem generator and dataset are vetted against Thailand's Ministry of Education (สพฐ.) K-6 curriculum standards.

**Tech Stack:** Vanilla JavaScript (ES5/ES6 without bundler/ESM in public scripts), HTML5 Canvas, CSS Variables / Tailwind utility classes, Web Audio API / Web Speech API, Playwright browser verification, PostgreSQL / Supabase migration.

**Spec:** [Classroom-first Product Rules & Educational Game Dev Standards (AGENTS.md / GAME.md)](file:///d:/kampai-school-main/AGENTS.md)

---

## Global Constraints

- Package manager: `pnpm` only. Lockfile: `pnpm-lock.yaml`.
- Game scripts loaded by `index.html` must load in sequential order; no ES Module `import`/`export` syntax allowed in standalone game files.
- Light mode only; use CSS variables (`bg-background`, `bg-card`, `text-foreground`, `border-border`) without hardcoded black/white or arbitrary hex colors in new styles.
- Quality contract mandatory for all games:
  - `begin-round`: `KAMPAI.beginRound()` called at start of each playable round.
  - `result-slot`: `<div id="kampai-result"></div>` in end-game modal.
  - `test-hooks`: `data-kampai-action="start"`, `data-kampai-action="finish-test"`, and single `data-kampai-action="restart"`.
  - `reload-restart`: Restart must reset state in-memory without `location.reload()`.
  - `reduced-motion`: `@media (prefers-reduced-motion: reduce)` in CSS.
  - `focus-visible`: `:focus-visible` styling in CSS.
  - Touch target accessibility: All interactive buttons must be $\ge 44\text{px} \times 44\text{px}$.
- Two-Player Mode: Every game must wire `/games/kampai-versus.js` (`KampaiVersus.create({ duration, onPlay, onEnd })`).
- Educational covers: Must be 16:9 ratio (1280×720px), kid-friendly non-violent chibi artwork with bilingual title, and 60% centered safe zone.
- Database: Every updated game must register its version and features in `game_docs` using `INSERT ... ON CONFLICT (item_id) DO UPDATE`.

---

## Review Focus

1. **Unsolvable or Invalid Problems**: Math 24 card combinations must have mathematical proof of solvability; fraction division must not produce zero denominators; Thai spelling pairs must cite authentic OBEC wordlists.
2. **Cognitive Overload & Traversal Speeds**: Traversal time across screen must be $\ge 5-10$ seconds, and on-screen obstacle density $\le 1-2$ items for elementary students.
3. **Audio Permission Denied**: Web Audio / Speech Synthesis must unlock on first user gesture and handle browser auto-play restrictions gracefully without freezing game logic.
4. **Touch Target Collisions on Mobile (360×800)**: All control buttons, keypad cells, and navigation chips must maintain $\ge 44\text{px}$ touch targets without horizontal overflow.
5. **Memory Leaks & Infinite RAF Loops**: `requestAnimationFrame` loops, interval timers, and audio nodes must cleanly terminate on game over, modal open, or tab hide.

---

## Target Games Directory & Baseline Audit

Based on real production usage data from `game_sessions`:
1. `multiply-race` (`public/games/math/multiply-race.html`) — 308 plays
2. `math-runner` (`public/games/math/math-runner/index.html`) — 168 plays
3. `math-24` (`public/games/math/24.html`) — 125 plays
4. `math-jumper` (`public/games/math/math-jumper.html`) — 114 plays
5. `pizza-master-chef` (`public/games/thai/pizza-master-chef.html`) — 76 plays
6. `tank-commander` (`public/games/tech/tank-commander.html`) — 76 plays
7. `energy-rocket` (`public/games/science/energy-rocket/index.html`) — 74 plays
8. `waste-sort` (`public/games/career/waste-sort.html`) — 59 plays
9. `vocab-race` (`public/games/english/vocab-race.html`) — 49 plays
10. `spelling` (`public/games/thai/spelling.html`) — 41 plays

---

## Implementation Tasks

### Task 1: Shared Framework & Reusable Classroom / Worksheet Runtime Extensions

**Files:**
- Create: `public/games/shared-classroom-tools.js`
- Create: `public/games/shared-worksheet-tools.js`
- Test: `tests/shared-tools-smoke.test.mjs`

**Interfaces:**
- Produces: `window.KampaiClassroom` with `{ toggleProjector(forced), openWheel(items, onPick), openTeamBattle(title, onScore) }`
- Produces: `window.KampaiWorksheet` with `{ openPrintModal(config), generateA4(options) }`

- [ ] **Step 1: Write unit test for shared classroom tools & worksheet generator**
  Create `tests/shared-tools-smoke.test.mjs` verifying object initialization, projector class toggles, and A4 print HTML formatting.
- [ ] **Step 2: Run test to verify it fails**
  Run: `node tests/shared-tools-smoke.test.mjs` (Expected: FAIL with "module not found").
- [ ] **Step 3: Implement `public/games/shared-classroom-tools.js`**
  Implement Projector mode with floating toolbar (Next, Prev, Flip, Speak, Exit), HTML5 Canvas 10-item wheel spinner, and Red vs Blue Team Hotseat scoring with confetti.
- [ ] **Step 4: Implement `public/games/shared-worksheet-tools.js`**
  Implement customizable single-page A4 print stylesheet generator supporting 10/20 item question sheets, student header, score box, teacher signature, and answer key page.
- [ ] **Step 5: Run test to verify it passes**
  Run: `node tests/shared-tools-smoke.test.mjs` (Expected: PASS).
- [ ] **Step 6: Commit**
  `git add public/games/shared-*.js tests/shared-tools-smoke.test.mjs && git commit -m "feat(games): create shared classroom tools and worksheet generator runtimes"`

---

### Task 2: Math Pillar 1 — `multiply-race` (แข่งสูตรคูณ)

**Files:**
- Modify: `public/games/math/multiply-race.html`
- Test: `scripts/verify-game.mjs public/games/math/multiply-race.html --strict`

**Interfaces:**
- Consumes: `window.KampaiVersus`, `window.KAMPAI`, `window.KampaiClassroom`, `window.KampaiWorksheet`
- Produces: Multiplication Table 2–12 speed race, 2-player local split-screen/hotseat, Projector Big Screen mode, A4 Multiplication Drill Generator.

- [ ] **Step 1: Audit and verify current failures**
  Run: `node scripts/verify-game.mjs public/games/math/multiply-race.html --strict`
  Expected: Warnings for KampaiMatch (needs KampaiVersus), quality contract missing items.
- [ ] **Step 2: Upgrade Two-Player system to `kampai-versus.js`**
  Replace `<script src="/games/kampai-match.js"></script>` with `<script src="/games/kampai-versus.js"></script>` and initialize `KampaiVersus.create({ duration: 60, title: 'แข่งสูตรคูณ', onPlay, onEnd })`.
- [ ] **Step 3: Enforce Quality Contract & Accessibility**
  - Add `KAMPAI.beginRound()` when starting countdown finishes.
  - Insert `<div id="kampai-result"></div>` inside `#game-over` screen.
  - Add `data-kampai-action="start"` to start button, `data-kampai-action="finish-test"` in hidden container, and single `data-kampai-action="restart"` on `#btn-restart`.
  - Replace `location.reload()` with `restartGame()` resetting score, lives, combo, and timers in-memory.
  - Add `@media (prefers-reduced-motion: reduce)` and `:focus-visible` in `<style>`.
  - Ensure all choice buttons and chips have `min-height: 44px; min-width: 44px`.
- [ ] **Step 4: Integrate Classroom Projector Mode & 1-Click A4 Worksheet**
  - Add "📽️ โปรเจกเตอร์" button triggering big-screen multiplication display with keyboard shortcuts (1-4 or numpad for answers).
  - Add "🖨️ ใบงานสูตรคูณ A4" generating 20/40 math multiplication drill problems with answer key.
- [ ] **Step 5: Run strict static and browser verification**
  Run: `pnpm verify:game:all -- public/games/math/multiply-race.html`
  Expected: PASS 100% (0 errors, 0 warnings across Phone, Tablet, Desktop).
- [ ] **Step 6: Commit**
  `git add public/games/math/multiply-race.html && git commit -m "feat(multiply-race): upgrade to KampaiVersus, classroom projector, A4 worksheet and strict quality compliance"`

---

### Task 3: Math Pillar 2 — `math-runner` (วิ่งสู้สูตรคูณ)

**Files:**
- Modify: `public/games/math/math-runner/index.html`
- Modify: `public/games/math/math-runner/game.js`
- Modify: `public/games/math/math-runner/style.css`
- Test: `pnpm verify:game:all -- public/games/math/math-runner`

**Interfaces:**
- Consumes: `window.KAMPAI`, `window.KampaiVersus`
- Produces: 60fps delta-time runner loop, child-friendly cognitive pacing ($\ge 6\text{s}$ gate traversal), quality contract compliance.

- [ ] **Step 1: Audit current failures**
  Run: `node scripts/verify-game.mjs public/games/math/math-runner/index.html --strict`
  Expected: Warnings for KampaiMatch and quality contract items.
- [ ] **Step 2: Upgrade to `kampai-versus.js`**
  Replace `kampai-match.js` with `kampai-versus.js` and wire `KampaiVersus.create(...)`.
- [ ] **Step 3: Pacing & Cognitive Balance Adjustment (Rule G)**
  Adjust runner speed and gate spawn intervals in `config.js` / `game.js`:
  - Increase question gate visibility distance so students have $\ge 6$ seconds to compute before jumping or sliding.
  - Limit obstacle density to max 1 active decision point on screen.
  - Forgiving collision: Reduce penalty to -5 pts rather than instant death; start with 6 hearts.
- [ ] **Step 4: Quality Contract, Reduced Motion & In-Memory Restart**
  - Wire `KAMPAI.beginRound()`, `<div id="kampai-result"></div>`, and single `data-kampai-action="restart"`.
  - Implement smooth delta-time loop (`requestAnimationFrame(timestamp)`) preventing stutter on high refresh rate displays.
  - Ensure all control buttons meet $\ge 44\text{px}$ touch targets.
- [ ] **Step 5: Run strict verification**
  Run: `pnpm verify:game:all -- public/games/math/math-runner`
  Expected: PASS 100%.
- [ ] **Step 6: Commit**
  `git add public/games/math/math-runner/ && git commit -m "feat(math-runner): optimize cognitive pacing, KampaiVersus 2-player and strict quality compliance"`

---

### Task 4: Math Pillar 3 — `math-24` (เกม 24 แต้ม)

**Files:**
- Modify: `public/games/math/24.html`
- Create: `public/games/math/math-24-data.js` (500+ guaranteed solvable 4-card permutations)
- Create: `public/games/math/math-24-cover.png` (16:9 safe zone cover)
- Test: `pnpm verify:game:all -- public/games/math/24.html`

**Interfaces:**
- Consumes: Solvable 4-number card database with verified algorithmic solution paths.
- Produces: 100% solvable 24 puzzles, step-by-step hint engine, Classroom Big-Screen Mental Math Mode, A4 Printable 24 Challenge Sheet.

- [ ] **Step 1: Build guaranteed solvable 24-number dataset**
  Create `public/games/math/math-24-data.js` containing 500 verified 4-number sets (e.g. `[3, 3, 8, 8] -> (8 / (3 - 8/3)) = 24`, `[1, 5, 5, 5] -> (5 - 1/5) * 5 = 24`) categorized into Easy, Medium, and Master levels.
- [ ] **Step 2: Implement Quality Contract & KampaiVersus**
  - Load `/games/kampai-versus.js` and wire `KampaiVersus.create({ duration: 90, title: 'เกม 24 แต้ม' })`.
  - Add `KAMPAI.beginRound()`, `#kampai-result`, `data-kampai-action="start"`, `data-kampai-action="restart"`, and `data-kampai-action="finish-test"`.
  - Replace `location.reload()` with in-memory `resetGame()` and undo history stack.
- [ ] **Step 3: Add Step-by-Step Hint & Classroom Projector Mode**
  - Add "💡 ใบ้คำตอบ": reveals a sub-target (e.g. "สร้างเลข 6 กับ 4" or "สร้างเลข 8 กับ 3").
  - Add "📽️ โหมดห้องเรียน": Large high-contrast cards ($80\text{px}$ numbers) for classroom discussion.
  - Add "🖨️ ใบงานเกม 24 A4": Generates 12 puzzle cards per sheet with QR/Teacher answer key.
- [ ] **Step 4: Generate 16:9 1280x720 Cover**
  Save `public/games/math/math-24-cover.png` following AI Cover Art Guidelines.
- [ ] **Step 5: Run strict verification**
  Run: `pnpm verify:game:all -- public/games/math/24.html`
  Expected: PASS 100%.
- [ ] **Step 6: Commit**
  `git add public/games/math/24.html public/games/math/math-24-* && git commit -m "feat(math-24): solvable card database, hint engine, KampaiVersus and A4 printable generator"`

---

### Task 5: Math Pillar 4 — `math-jumper` (Math Jumper)

**Files:**
- Modify: `public/games/math/math-jumper.html`
- Create: `public/games/math/math-jumper-cover.png`
- Test: `pnpm verify:game:all -- public/games/math/math-jumper.html`

**Interfaces:**
- Consumes: `window.KAMPAI`, `window.KampaiVersus`
- Produces: Platform jumping calculation game, stepped grade-level difficulty, quality contract compliance.

- [ ] **Step 1: Audit current failures**
  Run: `node scripts/verify-game.mjs public/games/math/math-jumper.html --strict`
  Expected: Missing 16:9 png cover, KampaiVersus warnings, quality contract items.
- [ ] **Step 2: Upgrade to KampaiVersus & Quality Hooks**
  - Include `/games/kampai-versus.js` and wire `KampaiVersus.create(...)`.
  - Wire `KAMPAI.beginRound()`, `#kampai-result`, test action hooks.
  - Fix in-memory restart without reloading iframe.
- [ ] **Step 3: Gameplay & Math Curriculum Enrichment**
  - Support selectable grade levels: ป.1-2 (บวก-ลบไม่เกิน 20/100), ป.3-4 (คูณ-หารเบื้องต้น), ป.5-6 (ระคนและการดำเนินการ).
  - Ensure jumping platforms have large legible numbers and audio cues upon landing.
- [ ] **Step 4: Generate 16:9 1280x720 PNG Cover**
  Convert/render `math-jumper-cover.png` from SVG with safe zone verification.
- [ ] **Step 5: Run strict verification**
  Run: `pnpm verify:game:all -- public/games/math/math-jumper.html`
  Expected: PASS 100%.
- [ ] **Step 6: Commit**
  `git add public/games/math/math-jumper.* && git commit -m "feat(math-jumper): grade-level difficulty, KampaiVersus and 16:9 cover standardization"`

---

### Task 6: Math Pillar 5 — `pizza-master-chef` (Pizza Master Chef เศษส่วน)

**Files:**
- Modify: `public/games/thai/pizza-master-chef.html`
- Create: `public/games/math/pizza-master-chef-cover.png`
- Test: `pnpm verify:game:all -- public/games/thai/pizza-master-chef.html`

**Interfaces:**
- Consumes: Visual fraction geometry models ($1/2, 1/3, 1/4, 2/4, 3/8, 5/6, 1\frac{1}{2}$).
- Produces: Interactive fraction slicing canvas, equivalent fraction matching, Classroom Pizza Workshop mode, A4 Fraction Coloring Worksheet.

- [ ] **Step 1: Audit current failures**
  Run: `node scripts/verify-game.mjs public/games/thai/pizza-master-chef.html --strict`
  Expected: Missing local 16:9 cover, KampaiVersus missing, quality contract missing.
- [ ] **Step 2: Upgrade to KampaiVersus & Quality Hooks**
  - Add `/games/kampai-versus.js` and wire `KampaiVersus.create({ duration: 90, title: 'Pizza Master Chef' })`.
  - Wire `KAMPAI.beginRound()`, `#kampai-result`, test hooks.
  - Implement in-memory `restartPizzaGame()`.
- [ ] **Step 3: Fraction Learning & Curriculum Enrichment**
  - Add equivalent fraction hints (e.g. highlighting that $\frac{2}{4}$ pizza is identical to $\frac{1}{2}$).
  - Audio FX: Crispy pizza cutter roll sound, oven chime on correct, friendly chef encouragement.
- [ ] **Step 4: Classroom Workshop & A4 Fraction Worksheet**
  - Add 1-Click Printable A4 Fraction Pizza Worksheet (students color slices matching fractions $\frac{1}{4}, \frac{3}{8}$, etc.).
  - Add 16:9 safe-zone cover `pizza-master-chef-cover.png`.
- [ ] **Step 5: Run strict verification**
  Run: `pnpm verify:game:all -- public/games/thai/pizza-master-chef.html`
  Expected: PASS 100%.
- [ ] **Step 6: Commit**
  `git add public/games/thai/pizza-master-chef.html public/games/math/pizza-master-chef-cover.png && git commit -m "feat(pizza-master-chef): visual equivalent fractions, KampaiVersus, A4 worksheet and 16:9 cover"`

---

### Task 7: Science & Career — `waste-sort` (แยกขยะ 4 ถัง) & `energy-rocket` (จรวดพลังงาน)

**Files:**
- Modify: `public/games/career/waste-sort.html`
- Modify: `public/games/science/energy-rocket/index.html`
- Create: `public/games/career/waste-sort-cover.png`
- Test: `pnpm verify:game:all -- public/games/career/waste-sort.html`
- Test: `pnpm verify:game:all -- public/games/science/energy-rocket/index.html`

**Interfaces:**
- Consumes: Official Thai Pollution Control Department 4-bin classification standard (ขยะรีไซเคิล-เหลือง, ขยะอินทรีย์-เขียว, ขยะอันตราย-แดง, ขยะทั่วไป-น้ำเงิน).
- Produces: 80+ categorized authentic waste items with educational rationale tooltips, 2-Team Eco-Battle, A4 Printable Waste Sorting Worksheet.

- [ ] **Step 1: Audit current failures in `waste-sort.html`**
  Run: `node scripts/verify-game.mjs public/games/career/waste-sort.html --strict`
  Expected: KampaiVersus missing, quality contract missing items.
- [ ] **Step 2: Upgrade `waste-sort.html` to KampaiVersus & Quality Hooks**
  - Wire `/games/kampai-versus.js` with `KampaiVersus.create({ duration: 60, title: 'แยกขยะ 4 ถัง' })`.
  - Add `KAMPAI.beginRound()`, `#kampai-result`, `data-kampai-action="start"` and single `"restart"`.
  - Replace `location.reload()` with clean in-memory restart.
- [ ] **Step 3: Enrich Curriculum Data & Item Explanations**
  - Expand item pool to 80 verified common objects (e.g., หลอดฟลูออเรสเซนต์, ถ่านไฟฉาย, ซองบะหมี่กึ่งสำเร็จรูป, เศษใบไม้, กล่องนม UHT, กระป๋องอะลูมิเนียม).
  - Add instant learning feedback explaining *why* an item goes to that specific bin.
- [ ] **Step 4: Classroom Suite & Printable A4 Worksheet**
  - Integrate A4 Waste Sorting Worksheet (cut & paste or line matching items to 4 colored bins).
  - Update `waste-sort-cover.png` to meet 16:9 1280x720 safe zone rules.
- [ ] **Step 5: Polish `energy-rocket`**
  - Add energy transformation science summary card (solar $\rightarrow$ chemical $\rightarrow$ kinetic) and ensure touch buttons are $\ge 44\text{px}$.
- [ ] **Step 6: Run strict verification on both games**
  Run: `pnpm verify:game:all -- public/games/career/waste-sort.html`
  Run: `pnpm verify:game:all -- public/games/science/energy-rocket/index.html`
  Expected: Both PASS 100%.
- [ ] **Step 7: Commit**
  `git add public/games/career/waste-sort* public/games/science/energy-rocket/ && git commit -m "feat(waste-sort, energy-rocket): curriculum waste classification, KampaiVersus, A4 worksheet and quality compliance"`

---

### Task 8: Language Arts — `vocab-race` (English) & `spelling` (Thai)

**Files:**
- Modify: `public/games/english/vocab-race.html`
- Modify: `public/games/thai/spelling.html`
- Create: `public/games/thai/spelling-cover.png`
- Test: `pnpm verify:game:all -- public/games/english/vocab-race.html`
- Test: `pnpm verify:game:all -- public/games/thai/spelling.html`

**Interfaces:**
- Consumes: OBEC K-6 English Core Vocabulary & OBEC Thai Misspelled Word Frequency List.
- Produces: Web Speech API native English/Thai TTS, side-by-side orthography correction, Classroom Big-Screen Spelling Bee, A4 Printable Dictation Worksheets.

- [ ] **Step 1: Audit current failures in `vocab-race` & `spelling`**
  Run: `node scripts/verify-game.mjs public/games/english/vocab-race.html --strict`
  Run: `node scripts/verify-game.mjs public/games/thai/spelling.html --strict`
  Expected: Warnings for KampaiMatch, missing 16:9 covers, quality contract gaps.
- [ ] **Step 2: Upgrade `vocab-race.html` (English)**
  - Upgrade to `/games/kampai-versus.js` (`KampaiVersus.create(...)`).
  - Wire native Web Speech API English pronunciation on every question card with toggle.
  - Enrich vocabulary themes: Animals, Classroom, Food, Action Verbs, Weather, Jobs.
  - Add A4 Printable English Vocab Match & Word Search Generator.
  - Wire quality hooks, `#kampai-result`, `KAMPAI.beginRound()`, in-memory restart.
- [ ] **Step 3: Upgrade `spelling.html` (Thai Top-Down Shooter)**
  - Upgrade to `/games/kampai-versus.js` (`KampaiVersus.create(...)`).
  - Update Thai word dataset with 300 verified commonly misspelled pairs from official OBEC lists.
  - Add side-by-side correction popup: e.g. "กะเพรา ✅ (ไม่มี ร ควบ) vs กระเพรา ❌".
  - Add 1-Click Printable A4 Thai Dictation Worksheet with answer key.
  - Generate `spelling-cover.png` (1280x720, 16:9 safe zone).
  - Wire quality hooks, `#kampai-result`, `KAMPAI.beginRound()`, in-memory restart.
- [ ] **Step 4: Run strict verification on both language games**
  Run: `pnpm verify:game:all -- public/games/english/vocab-race.html`
  Run: `pnpm verify:game:all -- public/games/thai/spelling.html`
  Expected: Both PASS 100%.
- [ ] **Step 5: Commit**
  `git add public/games/english/vocab-race* public/games/thai/spelling* && git commit -m "feat(vocab-race, spelling): TTS pronunciation, OBEC wordlists, KampaiVersus and A4 worksheets"`

---

### Task 9: Computational Thinking — `tank-commander` (ผู้บังคับการรถถัง)

**Files:**
- Modify: `public/games/tech/tank-commander.html`
- Test: `pnpm verify:game:all -- public/games/tech/tank-commander.html`

**Interfaces:**
- Consumes: Block/directional command queue (Step Forward, Turn Left/Right, Shoot, Repeat).
- Produces: Stepped algorithm challenges (วิทยาการคำนวณ สพฐ.), 2-Player Coding Duel, Classroom Step Tracing mode.

- [ ] **Step 1: Audit current failures in `tank-commander.html`**
  Run: `node scripts/verify-game.mjs public/games/tech/tank-commander.html --strict`
  Expected: Quality contract missing items, duplicate hooks.
- [ ] **Step 2: Upgrade to KampaiVersus & Quality Hooks**
  - Load `/games/kampai-versus.js` and wire `KampaiVersus.create({ duration: 90, title: 'Tank Commander' })`.
  - Wire `KAMPAI.beginRound()`, `#kampai-result`, `data-kampai-action="start"` and single `"restart"`.
  - Replace `location.reload()` with clean board state reset.
- [ ] **Step 3: Algorithm Curriculum & Classroom Step Tracing**
  - Add visual command queue stepper: Highlights currently executing command block so teachers can pause and discuss algorithmic logic with the class.
  - Add efficiency stars: 3 stars for minimal command count (Algorithm Optimization).
  - Ensure all command buttons are $\ge 48\text{px} \times 48\text{px}$ with high contrast.
- [ ] **Step 4: Run strict verification**
  Run: `pnpm verify:game:all -- public/games/tech/tank-commander.html`
  Expected: PASS 100%.
- [ ] **Step 5: Commit**
  `git add public/games/tech/tank-commander.html && git commit -m "feat(tank-commander): algorithm stepper, KampaiVersus coding duel and quality compliance"`

---

### Task 10: Unified Database Migration (`game_docs` & Version Tracking for all 10 Games)

**Files:**
- Create: `supabase/migrations/473_top10_games_evolution_and_docs.sql`
- Test: `node scripts/verify-game.mjs` on all 10 games checking Check 6b.

**Interfaces:**
- Consumes: Database schema `public.game_docs` and `public.educational_hub_items`.
- Produces: Updated version numbers, detailed educational features, and build metadata for all 10 games.

- [ ] **Step 1: Write migration `473_top10_games_evolution_and_docs.sql`**
  Write SQL statements using `INSERT INTO public.game_docs (...) VALUES (...) ON CONFLICT (item_id) DO UPDATE` for each of the 10 games:
  - `multiply-race` (v2.0.0)
  - `math-runner` (v2.3.0)
  - `math-24` (v2.0.0)
  - `math-jumper` (v2.0.0)
  - `pizza-master-chef` (v2.1.0)
  - `tank-commander` (v2.0.0)
  - `energy-rocket` (v1.2.0)
  - `waste-sort` (v2.0.0)
  - `vocab-race` (v2.0.0)
  - `spelling` (v2.0.0)
- [ ] **Step 2: Apply migration to Supabase database**
  Apply the migration using `supabase:apply_migration` or `supabase:execute_sql`.
- [ ] **Step 3: Verify Check 6b on all 10 games**
  Run `node scripts/verify-game.mjs` across all 10 games to verify `Check 6b — game_docs: migration มีรายละเอียดและ version` passes with `✅`.
- [ ] **Step 4: Commit**
  `git add supabase/migrations/473_top10_games_evolution_and_docs.sql && git commit -m "feat(db): register game_docs and bump versions for top 10 educational games"`

---

### Task 11: Multi-Viewport Automated Smoke Testing, SystemOverview & Documentation Sync

**Files:**
- Modify: `src/components/admin/system/SystemOverview.tsx`
- Modify: `DESIGN.md` (if any UI rules updated)
- Test: Multi-game test loop running `pnpm verify:game:all -- <path>` across all 10 games.

**Interfaces:**
- Consumes: Playwright automated runner across Phone (360×800), Tablet (768×1024), and Desktop (1280×720).
- Produces: 10/10 games passing all static and browser verification gates with 0 errors.

- [ ] **Step 1: Run full verification loop across all 10 games**
  Run batch verification script ensuring every single game passes:
  1. `pnpm verify:game:all -- public/games/math/multiply-race.html`
  2. `pnpm verify:game:all -- public/games/math/math-runner`
  3. `pnpm verify:game:all -- public/games/math/24.html`
  4. `pnpm verify:game:all -- public/games/math/math-jumper.html`
  5. `pnpm verify:game:all -- public/games/thai/pizza-master-chef.html`
  6. `pnpm verify:game:all -- public/games/tech/tank-commander.html`
  7. `pnpm verify:game:all -- public/games/science/energy-rocket`
  8. `pnpm verify:game:all -- public/games/career/waste-sort.html`
  9. `pnpm verify:game:all -- public/games/english/vocab-race.html`
  10. `pnpm verify:game:all -- public/games/thai/spelling.html`
- [ ] **Step 2: Update SystemOverview.tsx versionHistory**
  Record version `v1.233.35` documenting the 10-media simultaneous evolution across Learning, Visual/Audio, Stability, Performance, and Curriculum Accuracy.
- [ ] **Step 3: Build Vite Production Bundle**
  Run `pnpm build` to ensure 0 build errors.
- [ ] **Step 4: Commit and Push**
  Stage modified files, commit conventional commit with Codex co-author, and push to `origin/main`.
- [ ] **Step 5: Generate Walkthrough Artifact**
  Generate `walkthrough.md` summarizing the upgrades, test proofs, screenshots, and live links.
