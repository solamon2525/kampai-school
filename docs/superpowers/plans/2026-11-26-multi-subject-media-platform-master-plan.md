# Multi-Subject Media & Worksheet Platform Master Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate per-subject/per-file guesswork by building a unified platform layer (`public/games/engine/` + shared `worksheet-*` and `media-lab-runtime.js` upgrades + automated audit & matrix verification) that upgrades all 111 teaching media files, 148 worksheets, and educational games across all 9 subjects in structured waves.

**Architecture:** Instead of designing 9 subjects individually, consolidate shared classroom, audio, A4 print/PDF, and interactive mechanics into central runtimes (`public/games/` and `public/games/engine/`), classify all 259+ learning items into 5 content-agnostic Learning Archetypes via an automated inventory audit, and roll out upgrades in parallel archetype waves gated by `verify:media:matrix` and `verify:worksheet:matrix`.

**Tech Stack:** Vanilla JS (IIFE, no ES modules for game/media scripts per `AGENTS.md`), HTML5/CSS3 (`Sarabun`, `@page` A4 Print CSS, WCAG AA), Node `.mjs` audit/codemod & matrix verification scripts, Playwright browser verification (`360×800`, `768×1024`, `1280×720`).

**Spec:** User request for a master plan to systematically develop and upgrade multiple subjects, teaching media, and worksheets together at scale without brainstorming each item individually. Grounded in [MEDIA.md](file:///d:/kampai-school-main/MEDIA.md), [WORKSHEET.md](file:///d:/kampai-school-main/WORKSHEET.md), and [GAME.md](file:///d:/kampai-school-main/GAME.md).

## Global Constraints

- **No ES Modules in `public/games/` HTML scripts:** Shared engines under `public/games/` and `public/games/engine/` must use IIFE / `window.*` globals.
- **Keep existing URLs & contracts:** Never rename/break existing `*-media.html` or `*-worksheet.html` URLs; preserve `MEDIA.md` rules (no `submitScore`, no timer/lives in media, `learn` + `practice` modes, user-triggered audio, `Sarabun` font, WCAG AA contrast) and `WORKSHEET.md` §3 contract (`#selStyle`, `#selPageCount`, `#pages > .sheet`, `render()`).
- **Non-destructive rollout:** Every wave must pass `pnpm verify:media:matrix`, `pnpm verify:worksheet:matrix`, and real-browser viewport checks (`360×800`, `1280×720`) before committing.
- **Respect `MEDIA.md` visual rules:** Never replace real educational illustrations with enlarged emojis or SVG placeholders when upgrading media files; keep existing verified images intact.

## Review Focus

- **Breaking legacy standalone media/worksheets:** Old files that do not load `media-lab-runtime.js` or `worksheet-topic.js` must not break when central runtimes are upgraded; new shared hooks must degrade gracefully (`if (!el) return;`).
- **Audio & timer leaks across mode switches:** Central audio wrappers must cancel `speechSynthesis` on `visibilitychange`, `pagehide`, and mode switch so old audio never plays in a new scene (`MEDIA.md` rule).
- **Mobile `360×800` overlap with floating SDK controls:** Shared classroom/font/audio toolbars must reserve safe bottom/corner clearance so `#kampai-snd` or floating controls never intercept taps on `360×800`.
- **Worksheet vs Media separation (`verify:media`):** Shared quiz/practice engines used inside `*-media.html` must offer a "media mode" flag (`noScoreSubmit: true, noLives: true, noTimer: true`) so `verify:media` never fails with `must not call submitScore`.
- **Batch drift during parallel waves:** Running multiple files in parallel must lock shared engine interfaces first (Tasks 1–4) before fanning out Wave migrations (Task 5).

---

### Task 1: Automated Cross-Subject Inventory & Archetype Audit (`scripts/audit-platform-adoption.mjs`)

**Files:**
- Create: `scripts/audit-platform-adoption.mjs`
- Test: `scripts/test-audit-platform-adoption.mjs`

**Interfaces:**
- Consumes: `public/games/{subject}/**/*.html` (111 `*-media.html`, 148 `*-worksheet.html`, plus hubs/games)
- Produces: `.artifacts/platform-audit/inventory.json` and `.artifacts/platform-audit/SUMMARY.md` classifying every file by:
  - `kind`: `'media' | 'worksheet' | 'game'`
  - `subject`: `arts | career | english | health | math | science | social | tech | thai`
  - `archetype`: `'vocab-concept' | 'visual-lab' | 'classify-sort' | 'math-scaffold' | 'reading-story'`
  - `sharedRuntimes`: `{ hasKampaiSdk, hasMediaLabRuntime, hasWorksheetRuntime, hasWorksheetTopic, hasWorksheetModes, hasClassroomTools }`
  - `gaps`: `Array<string>` (e.g. missing `prefers-reduced-motion`, missing `speak` fallback, missing paired worksheet/media meta, missing `getState()`, mobile viewport issues)

- [ ] **Step 1: Write failing unit test `scripts/test-audit-platform-adoption.mjs`**

Tests `classifyArchetype(filePath, html)` and `auditHtmlFile(filePath, html)` against representative fixtures (a `vocab` media, a `science` visual lab, a `math` division worksheet, and a non-compliant media missing `prefers-reduced-motion`).

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test-audit-platform-adoption.mjs`
Expected: FAIL with `ERR_MODULE_NOT_FOUND`

- [ ] **Step 3: Implement `scripts/audit-platform-adoption.mjs`**

Scans `public/games/` excluding `_template*`, `engine`, `media-lab-assets`, `ar-calibration`, classifies every file, writes `.artifacts/platform-audit/inventory.json` + `SUMMARY.md`, and prints a per-subject & per-archetype rollout table.

- [ ] **Step 4: Run test and execute full repo audit**

Run: `node scripts/test-audit-platform-adoption.mjs && node scripts/audit-platform-adoption.mjs`
Expected: PASS and generates `.artifacts/platform-audit/SUMMARY.md` covering all 9 subjects.

- [ ] **Step 5: Commit**

```bash
git add scripts/audit-platform-adoption.mjs scripts/test-audit-platform-adoption.mjs
git commit -m "feat(platform): add cross-subject media and worksheet archetype audit"
```

---

### Task 2: Upgrade Central Media & Classroom Runtime (`media-lab-runtime.js`, `shared-classroom-tools.js`)

**Files:**
- Modify: `public/games/media-lab-runtime.js`
- Modify: `public/games/shared-classroom-tools.js`
- Test: `scripts/test-shared-media-runtime.mjs`

**Interfaces:**
- Consumes: `window.KAMPAI`, `document`
- Produces:
  - `window.KampaiMediaLab` enhanced with:
    - Safe Speech Controller (`speakSafe(text, { lang, rate })` with `KAMPAI.sound.speak` → `speechSynthesis` fallback, automatic cancel on `visibilitychange` / `pagehide` / `setMode`, and non-blocking status message if TTS unavailable).
    - Font-scale pill (`Aa` `0.85x–1.30x` persisted to `localStorage`) + Projector Mode (`📽️ ฉายจอห้องเรียน`) + `prefers-reduced-motion` class hook.
    - Read-only `getState()` QA hook per `MEDIA.md`.
  - `window.KampaiClassroomTools` enhanced with Buzzer Team Battle (zero `confirm()` dialogs, keyboard `A`/`L` + touch buzzers) & Spinner Reroll generalized from `thai-vocab-hub/classroom-tools.js`!

- [ ] **Step 1: Write failing test `scripts/test-shared-media-runtime.mjs`**

Loads `media-lab-runtime.js` and `shared-classroom-tools.js` in JSDOM/VM, verifies `speakSafe` cancels on `visibilitychange`, `getState()` returns read-only snapshot, and `KampaiClassroomTools` buzzer works without `window.confirm`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test-shared-media-runtime.mjs`
Expected: FAIL (missing `speakSafe` / `getState` / buzzer API)

- [ ] **Step 3: Upgrade `public/games/media-lab-runtime.js` and `public/games/shared-classroom-tools.js`**

- [ ] **Step 4: Run unit test + `pnpm verify:media:matrix`**

Run: `node scripts/test-shared-media-runtime.mjs && pnpm verify:media:matrix`
Expected: PASS (zero regressions across all existing 111 media files!)

- [ ] **Step 5: Commit**

```bash
git add public/games/media-lab-runtime.js public/games/shared-classroom-tools.js scripts/test-shared-media-runtime.mjs
git commit -m "feat(platform): upgrade shared media runtime and classroom buzzer tools"
```

---

### Task 3: Upgrade Central Worksheet & Print-to-PDF Shell (`worksheet-topic.js`, `worksheet-modes.js`, `shared-worksheet-tools.js`)

**Files:**
- Modify: `public/games/worksheet-topic.js`
- Modify: `public/games/worksheet-topic.css`
- Modify: `public/games/shared-worksheet-tools.js`
- Test: `scripts/test-shared-worksheet-shell.mjs`

**Interfaces:**
- Consumes: `window.WORKSHEET_CONFIG`, `window.KampaiWorksheet`
- Produces:
  - Unified **Print / Save as PDF** toolbar button (`📄 บันทึกเป็น PDF` hint + crisp `@page` A4 layout) across all topic worksheets.
  - Reusable **Dense Concept Grid Mode** (`renderConceptGrid100(items, options)` — generalized from `vocab-sheet-100.js` so English Sight Words, Science Terms, Multiplication/Formula facts, and Social Studies keywords can also print 50–100 items on 1 A4 page!).
  - Strict `overflow: visible` on teacher answer key sheets so answers never clip on the right or bottom edge.

- [ ] **Step 1: Write failing test `scripts/test-shared-worksheet-shell.mjs`**

Tests `renderConceptGrid100` across English, Math, and Thai sample items (`5×20` portrait & `4×25` portrait, XSS escaping, deduplication).

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test-shared-worksheet-shell.mjs`
Expected: FAIL (`renderConceptGrid100` not defined)

- [ ] **Step 3: Implement shared PDF hint + `renderConceptGrid100` in `shared-worksheet-tools.js` / `worksheet-topic.js` / `worksheet-topic.css`**

- [ ] **Step 4: Run unit test + `pnpm verify:worksheet:matrix`**

Run: `node scripts/test-shared-worksheet-shell.mjs && pnpm verify:worksheet:matrix`
Expected: PASS across all worksheets!

- [ ] **Step 5: Commit**

```bash
git add public/games/worksheet-topic.js public/games/worksheet-topic.css public/games/shared-worksheet-tools.js scripts/test-shared-worksheet-shell.mjs
git commit -m "feat(platform): add shared PDF export polish and 100-item concept grid to worksheet runtime"
```

---

### Task 4: Extract Subject-Agnostic Archetype Engines (`public/games/engine/`)

**Files:**
- Create: `public/games/engine/vocab-quiz-engine.js` (generalized from `thai-vocab-hub/quiz-engine.js`)
- Create: `public/games/engine/connect-match-engine.js` (generalized from `thai-vocab-hub/match-engine.js`)
- Create: `public/games/engine/classify-bucket-engine.js` (reusable multi-bucket sorting engine for Science/Career/Health/Thai/English)
- Test: `scripts/test-archetype-engines.mjs`

**Interfaces:**
- Consumes: Generic `{ items, buckets, locale, mode: 'media' | 'game' }` config objects
- Produces:
  - `window.KampaiEngines.Quiz` (`createDeck`, `mountChoice`, `mountListen`, supporting `mode: 'media'` with no lives/timer/submitScore for `MEDIA.md` compliance!)
  - `window.KampaiEngines.ConnectMatch` (SVG curve matching + Memory Flip for any `left ↔ right` pairs: English↔Thai, Term↔Definition, Cause↔Effect, Country↔Capital!)
  - `window.KampaiEngines.ClassifyBucket` (2–4 bucket sorting with immediate educational reasoning feedback & keyboard/tap accessibility!)

- [ ] **Step 1: Write failing unit tests `scripts/test-archetype-engines.mjs`**

Verifies all 3 engines work with English (`en-US`), Science, and Social datasets, and verifies `mode: 'media'` omits lives/timer/score submission.

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test-archetype-engines.mjs`
Expected: FAIL (`ENOENT` for engine files)

- [ ] **Step 3: Implement the 3 archetype engines under `public/games/engine/`**

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/test-archetype-engines.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add public/games/engine/vocab-quiz-engine.js public/games/engine/connect-match-engine.js public/games/engine/classify-bucket-engine.js scripts/test-archetype-engines.mjs
git commit -m "feat(engine): add reusable quiz, connect-match, and classify-bucket archetype engines"
```

---

### Task 5: Wave Rollout Pipeline & Multi-Subject Verification (`scripts/verify-platform-batch.mjs`)

**Files:**
- Create: `scripts/verify-platform-batch.mjs`
- Pilot Wave 1 targets (selected from Task 1's `.artifacts/platform-audit/inventory.json`):
  - **English Vocab/Phonics Hub** (`public/games/english/vocab-hub.html` or `grammar-vocab-media.html`) adopting `KampaiEngines.ConnectMatch` & `KampaiEngines.Quiz`
  - **Science / Career / Health Classification Media** (1–2 pilot media files per archetype) adopting `KampaiEngines.ClassifyBucket` + upgraded `media-lab-runtime.js`

**Interfaces:**
- Consumes: Target file list (or `--wave <archetype>`)
- Produces: Automated Playwright sweep (`360×800`, `1280×720`) asserting zero console/page errors, zero horizontal overflow, working `learn`+`practice` flows, and passes `verify:media:matrix` / `verify:worksheet:matrix`.

- [ ] **Step 1: Create `scripts/verify-platform-batch.mjs` accepting a list of URLs or `--archetype <name>` from `inventory.json`**

- [ ] **Step 2: Roll out Pilot Wave 1 (e.g. `vocab-concept` + `classify-sort` pilot across English, Science, and Health/Career)** using parallel subagents (`dispatching-parallel-agents` / `run_workflow`) — 1 subagent per subject/file batch, locked to the shared Task 2–4 interfaces.

- [ ] **Step 3: Run full platform verification gate**

Run:
```bash
node scripts/verify-platform-batch.mjs --pilot && pnpm verify:media:matrix && pnpm verify:worksheet:matrix
```
Expected: 100% pass across pilot wave + zero regressions across all 111 media & 148 worksheets.

- [ ] **Step 4: Commit**

```bash
git add scripts/verify-platform-batch.mjs <pilot-files>
git commit -m "feat(platform): add batch verification runner and roll out Wave 1 across subjects"
```
