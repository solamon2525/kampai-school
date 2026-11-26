# Thai Vocab Hub Choice, Listen & Toolbar Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `🎯 ทายความหมาย` (Choice Quiz) and `🎧 ฟังทายคำ` (Listen Quiz) in `public/games/thai/thai-vocab-hub/` to an Arcade + Classroom Balance experience (12-question non-repeating rounds, combo multipliers, 50/50 & meaning hints, context-sentence variety, smart decoys, snappy feedback) and reorganize `#bottom-bar` into clean Student Modes vs Teacher Tools groups.

**Architecture:** Extract Choice & Listen round state, non-repeating deck queues, smart decoy selection, context-cloze question formatting, and combo scoring into a dedicated IIFE `public/games/thai/thai-vocab-hub/quiz-engine.js` (`window.ThaiVocabQuiz`), wired into `game.js`, `index.html`, and `style.css` while preserving all existing `KAMPAI` SDK hooks (`beginRound`, `submitScore`, `endGame`) and `#m-*` button IDs.

**Tech Stack:** Vanilla JS (IIFE, no ES modules per `AGENTS.md`), HTML5/CSS3, Node `node:assert/strict` + `node:vm` unit tests, Playwright browser verification (`360×800`, `1280×720`).

**Spec:** User-approved design choices:
- Target modes: `🎯 ทายความหมาย` & `🎧 ฟังทายคำ` (combo, context sentences, smart decoys, non-repeating deck)
- Gameplay feel: `Arcade + Classroom Balance` (combo multiplier, hints, 10–15 questions per round [default 12], 3 stars, gentle pacing)
- Bottom toolbar: Reorganize into Student Practice Modes vs Teacher/Classroom Tools for easy mobile & desktop access.

## Global Constraints

- **No ES Modules in game scripts:** `quiz-engine.js` must be an IIFE attaching `window.ThaiVocabQuiz` and loaded in `index.html` before `game.js`.
- **Preserve existing IDs & contracts:** Keep `#m-auto`, `#m-flash`, `#m-listen`, `#m-dictation`, `#m-choice`, `#m-match`, `#m-visual`, `#score-val`, `#life-display` intact so existing tests and `verify:game:all` pass.
- **KAMPAI SDK & Scoring:** Call `KAMPAI.beginRound()` when starting `choice` or `listen`; call `endGame()` after 12 questions (or when lives reach `0`); record every answer via `recordAnswer(wordItem, isCorrect)`.
- **User-triggered audio default:** Never auto-play audio before a user gesture; `switchMode('listen')` is a user click, and replay/slow-speak buttons are explicit gestures.

## Review Focus

- **Small category pool (< 12 words):** If a grade-filtered pool has fewer than 12 words (e.g. 5 words), the round length must clamp to `pool.length` cleanly without crashing or repeating the same word in one round.
- **Missing `example` or `meaning` fields:** Context-cloze questions must only trigger when `wordItem.example` actually contains `wordItem.word`; otherwise fall back cleanly to standard meaning/classifier question.
- **Double-click / rapid answer guard:** Clicking multiple option buttons before advancing must be ignored (`isAnswered` lock), and switching modes mid-timeout must cancel pending advance timers so stale questions never overwrite the new mode.
- **Mobile `360×800` toolbar & quiz cards:** Reorganized `#bottom-bar` and quiz HUD must have zero horizontal overflow (`scrollWidth <= clientWidth + 1`) and keep all mode buttons reachable.
- **Smart decoys with few candidates:** If a category lacks 3 unique smart decoys (e.g. only 2 homophones with the same reading), fill remaining decoy slots from the wider category pool without duplicate options.

---

### Task 1: Quiz Deck, Smart Decoys, Context Cloze & Combo Engine (`quiz-engine.js`)

**Files:**
- Create: `public/games/thai/thai-vocab-hub/quiz-engine.js`
- Test: `scripts/test-thai-vocab-quiz.mjs`

**Interfaces:**
- Consumes: `pool` (`Array<WordItem>`), `categorySlug` (`string`), `baseScore` (`number`)
- Produces: `window.ThaiVocabQuiz` pure helpers:
  - `createQuizDeck(pool, categorySlug, roundSize)` → `{ nextRound(): Array<WordItem>, remaining(): number }`
  - `buildChoiceQuestion(wordItem, pool, categorySlug)` → `{ kind: 'meaning' | 'cloze' | 'classifier', prompt: string, badge: string, answer: string, options: Array<string> }`
  - `buildListenQuestion(wordItem, pool, categorySlug)` → `{ prompt: string, clue: string, answer: string, options: Array<string> }`
  - `computeQuizCombo(baseScore, streak)` → `{ points: number, multiplier: number }`

- [ ] **Step 1: Write failing unit tests in `scripts/test-thai-vocab-quiz.mjs`**

Test cases:
1. `createQuizDeck(pool, 'misspelled', 12)` returns 12 unique words on round 1 and 12 different unique words on round 2 (24 unique total), and clamps cleanly when `pool.length < 12`.
2. `buildChoiceQuestion` returns 4 unique options containing `wordItem.meaning`, and produces `kind: 'cloze'` (with `_____` masking `wordItem.word`) when `wordItem.example` contains `wordItem.word`.
3. `buildListenQuestion` returns 4 unique word options containing `wordItem.word`, preferring same-reading decoys for `homophones` and same-initial-char decoys when available.
4. `computeQuizCombo(10, streak)` returns `10 (×1)` for streak 1–2, `15 (×1.5)` for streak 3–4, `20 (×2)` for streak 5+.

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test-thai-vocab-quiz.mjs`
Expected: FAIL with `ENOENT` for `quiz-engine.js`

- [ ] **Step 3: Implement `quiz-engine.js` pure functions**

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/test-thai-vocab-quiz.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add public/games/thai/thai-vocab-hub/quiz-engine.js scripts/test-thai-vocab-quiz.mjs
git commit -m "feat(thai-vocab-hub): add quiz deck, smart decoys, cloze, and combo engine"
```

---

### Task 2: Choice & Listen Arena UI + Reorganized Bottom Toolbar (`index.html`, `style.css`)

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/index.html:231-299,630-638`
- Modify: `public/games/thai/thai-vocab-hub/style.css`

**Interfaces:**
- Consumes: `window.ThaiVocabQuiz`
- Produces:
  - Upgraded `#choice-mode` stage: `#choice-hud-bar` (`ข้อ 1/12`, `🔥 คอมโบ`, `💡 ตัดตัวเลือก 50/50 (2)`, `🔊 ฟังเสียง`), `#choice-kind-badge`, `#choice-question-text`, `#choice-options`, `#choice-feedback-box` (shows reading + example sentence after answering).
  - Upgraded `#listen-mode` stage: `#listen-hud-bar` (`ข้อ 1/12`, `🔥 คอมโบ`, `💡 ใบ้ความหมาย (2)`), `🔊 ฟังปกติ` + `🐢 ฟังช้าๆ`, `#listen-clue-box`, `#listen-options`.
  - Reorganized `#bottom-bar`: `.toolbar-group-student` (6 student modes + `← คลังหัวข้อ`) and `.toolbar-group-teacher` (`🧰 เครื่องมือครู` toggle/group containing `🎡 วงล้อสุ่ม`, `⚔️ แข่ง ๒ ทีม`, `🖨️ ใบงาน A4`, `✨ สระแปลงร่าง`, `📖 ฝึกอ่าน`).
  - Load `<script src="quiz-engine.js"></script>` before `game.js`.

- [ ] **Step 1: Update `#choice-mode`, `#listen-mode`, `#bottom-bar`, and script tags in `index.html`**

- [ ] **Step 2: Add responsive styles for `#choice-hud-bar`, `#listen-hud-bar`, `.option-btn.hint-eliminated`, `#choice-feedback-box`, and `.toolbar-group-student` / `.toolbar-group-teacher` in `style.css`**

- [ ] **Step 3: Commit**

```bash
git add public/games/thai/thai-vocab-hub/index.html public/games/thai/thai-vocab-hub/style.css
git commit -m "feat(thai-vocab-hub): upgrade choice/listen UI and organize bottom toolbar"
```

---

### Task 3: Wire `game.js` Interactive Choice & Listen Controllers + Browser Verification

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/quiz-engine.js`
- Modify: `public/games/thai/thai-vocab-hub/game.js:1630-1740,2507-2678`
- Create: `scripts/test-thai-vocab-quiz-browser.mjs`

**Interfaces:**
- Consumes: `window.ThaiVocabQuiz.mountChoice(...)`, `window.ThaiVocabQuiz.mountListen(...)`, `window.ThaiVocabQuiz.cleanup()`
- Produces: Clean `switchMode('choice')` and `switchMode('listen')` hiding `#word-area`, calling `KAMPAI.beginRound()`, using 12-question non-repeating rounds, and calling `endGame()` on completion.

- [ ] **Step 1: Add interactive `mountChoice`, `mountListen`, and `cleanup` controllers to `quiz-engine.js`**

- Choice controller: 12-question round, 2× `50/50` hints (disables 2 wrong options), `🔊` speak button, `1400ms` snappy auto-advance (or instant `ข้อถัดไป ▶` button), combo multiplier, and context/meaning feedback card.
- Listen controller: 12-question round, `🔊 ฟังปกติ` + `🐢 ฟังช้าๆ` (`rate: 0.72` via `speechSynthesis` fallback or `speak`), 2× `💡 ใบ้ความหมาย` hints, combo multiplier, and snappy auto-advance.

- [ ] **Step 2: Wire `game.js` (`switchMode`, `loadChoiceWord`, `loadListenWord`, `stopAllMediaAndTimers`) to `ThaiVocabQuiz`**

- [ ] **Step 3: Write Playwright E2E test `scripts/test-thai-vocab-quiz-browser.mjs`**

Verify at `1280×720` and `360×800`:
1. Enter `misspelled` category, click `#m-choice` → `#word-area` hidden, `#choice-hud-bar` shows `ข้อ 1/12`, 4 options rendered, `💡 ตัดตัวเลือก` disables 2 wrong options, answering updates score & shows feedback.
2. Click `#m-listen` → `#listen-hud-bar` shows `ข้อ 1/12`, `💡 ใบ้ความหมาย` reveals `#listen-clue-box`, 4 word options rendered.
3. Verify organized bottom toolbar (`🧰 เครื่องมือครู` toggle works on mobile `360×800` and all student mode buttons are accessible with zero horizontal overflow).
4. Zero `pageerror`s.

- [ ] **Step 4: Run full verification suite**

Run:
1. `node scripts/test-thai-vocab-quiz.mjs`
2. `node scripts/test-thai-vocab-quiz-browser.mjs`
3. `node scripts/test-vocab-engine-perf.mjs`
4. `pnpm verify:game:all -- public/games/thai/thai-vocab-hub`

Expected: All assertions and gates PASS.

- [ ] **Step 5: Commit**

```bash
git add public/games/thai/thai-vocab-hub/quiz-engine.js public/games/thai/thai-vocab-hub/game.js scripts/test-thai-vocab-quiz-browser.mjs
git commit -m "feat(thai-vocab-hub): wire choice/listen quiz engine and add browser tests"
```
