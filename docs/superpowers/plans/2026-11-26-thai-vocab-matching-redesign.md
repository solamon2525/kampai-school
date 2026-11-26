# Thai Vocab Hub Matching Mode Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the broken 4-pair reading-only matching mode in `public/games/thai/thai-vocab-hub/` with an engaging, randomized, meaning-based matching arena (`match-engine.js`) featuring non-repeating deck queues, 6/8/10-pair waves, SVG glowing connection lines, combo multipliers, hints, and a Memory Flip sub-mode.

**Architecture:** Extract matching state, non-repeating deck shuffling, meaning/antonym pair builders, combo scoring, SVG line geometry, and Memory Flip logic into a dedicated IIFE `public/games/thai/thai-vocab-hub/match-engine.js` (`window.ThaiVocabMatch`), wired into `game.js` (`switchMode('match')`), `index.html`, and `style.css` while preserving `.match-card`'s GPU-promoted transition contract required by `scripts/test-vocab-engine-perf.mjs`.

**Tech Stack:** Vanilla JS (IIFE, no ES modules per `AGENTS.md`), HTML5/CSS3 (SVG overlay, 3D card flip, CSS Grid), Node `node:assert/strict` + `node:vm` unit tests, Playwright browser verification (`360×800`, `1280×720`).

**Spec:** User request for Thai Vocab Hub Matching Mode (`#match-mode`): fix missing meanings (was showing only `[reading]`), increase word count & add non-repeating random deck across the full category, hide stale `#word-area` banner ("เลือกความหมาย"), and redesign mechanics to be genuinely fun (SVG connector lines, combo multipliers, hints, Memory Flip mode, multi-wave round completion).

## Global Constraints

- **No ES Modules in game scripts:** `match-engine.js` must be an IIFE attaching `window.ThaiVocabMatch` and loaded in `index.html` before `game.js`.
- **Preserve `.match-card` CSS transition:** `scripts/test-vocab-engine-perf.mjs` asserts `.match-card` keeps `transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease;` — do not remove or alter that property.
- **KAMPAI SDK & Scoring:** Call `KAMPAI.beginRound()` when a matching round starts; call `endGame()` on round completion (3 waves cleared) or when lives reach `0`; record every answer via `recordAnswer(wordItem, isCorrect)`.
- **Real-screen truth:** Verify at `360×800` and `1280×720` with zero horizontal overflow, zero console/page errors, and run `pnpm verify:game:all -- public/games/thai/thai-vocab-hub`.

## Review Focus

- **Stale `#word-area` banner:** Switching from `choice` ("เลือกความหมาย") to `match` must hide `#word-area` so no misleading header appears above the matching board.
- **Missing or duplicate meanings in a wave:** Words with empty `meaning` must be filtered out for meaning-match mode (falling back to `reading` only if the entire category lacks meanings), and two words in the same wave must never have identical `meaning` strings.
- **Non-repeating random deck:** Playing consecutive waves/rounds must draw from a shuffled deck queue without repeating words until the category pool is exhausted, then reshuffle cleanly.
- **Responsive SVG connector lines:** Resizing or scrolling between `360×800` and `1280×720` must keep SVG lines aligned with card centers (or redraw on `resize`) and never cause horizontal overflow.
- **Antonyms category special pairing:** When `activeCategorySlug === 'antonyms'`, pairs must match `word ↔ opposite word` (via `pair_id`) with subtle meaning/reading hints rather than breaking `pair_id` grouping.

---

### Task 1: Core Matching Deck, Pair Builder & Combo Scoring (`match-engine.js`)

**Files:**
- Create: `public/games/thai/thai-vocab-hub/match-engine.js`
- Test: `scripts/test-thai-vocab-match.mjs`

**Interfaces:**
- Consumes: `pool` (`Array<WordItem>`), `activeCategorySlug` (`string`), `rng` (`() => number`)
- Produces: `window.ThaiVocabMatch` pure helpers:
  - `createMatchDeck(pool, categorySlug)` → `{ drawWave(pairCount): Array<MatchPair>, remaining(): number, total(): number }`
  - `buildWavePairs(words, categorySlug)` → `Array<{ id, leftText, leftSub, rightText, rightSub, wordItem }>`
  - `computeComboPoints(baseScore, streak)` → `{ points: number, multiplier: number }`

- [ ] **Step 1: Write failing unit tests in `scripts/test-thai-vocab-match.mjs`**

Test cases:
1. `buildWavePairs` on `misspelled` (real `GAME_DATA.words.misspelled`) returns `rightText === w.meaning` (NOT `[w.reading]`), and deduplicates identical meanings within the same wave.
2. `buildWavePairs` on `antonyms` pairs `word ↔ partner.word` using `pair_id`.
3. `createMatchDeck` draws 6 pairs × 3 waves = 18 unique words without any duplicate `word` across waves, and reshuffles cleanly after exhausting a small pool (e.g. 10 words).
4. `computeComboPoints(10, streak)` scales points with streak (`streak 1 -> 10 (1x)`, `streak 3 -> 15 (1.5x)`, `streak 5 -> 20 (2x)`).

- [ ] **Step 2: Run test to verify it fails**

Run: `node scripts/test-thai-vocab-match.mjs`
Expected: FAIL with `ENOENT` for `match-engine.js`

- [ ] **Step 3: Implement `createMatchDeck`, `buildWavePairs`, `computeComboPoints` in `public/games/thai/thai-vocab-hub/match-engine.js`**

- [ ] **Step 4: Run test to verify it passes**

Run: `node scripts/test-thai-vocab-match.mjs`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add public/games/thai/thai-vocab-hub/match-engine.js scripts/test-thai-vocab-match.mjs
git commit -m "feat(thai-vocab-hub): add matching deck, meaning pair builder, and combo scoring"
```

---

### Task 2: Interactive Match Arena UI, SVG Connectors & Memory Flip (`match-engine.js`, `index.html`, `style.css`)

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/match-engine.js`
- Modify: `public/games/thai/thai-vocab-hub/index.html:239-246,603-612`
- Modify: `public/games/thai/thai-vocab-hub/style.css:1232-1293,1898-1910`

**Interfaces:**
- Consumes: Host callbacks passed via `ThaiVocabMatch.mount({ getPool, getCategorySlug, speak, onCorrect, onWrong, onRoundEnd, getBaseScore })`
- Produces: `window.ThaiVocabMatch.start(options)` and `window.ThaiVocabMatch.cleanup()`

- [ ] **Step 1: Add Match Arena markup in `public/games/thai/thai-vocab-hub/index.html`**

Replace `#match-mode` inner markup with:
- `#match-hud-bar`: Sub-mode toggle (`🔗 โยงเส้นความหมาย` | `🃏 การ์ดคว่ำจำคู่`), Pair count selector (`6 คู่` | `8 คู่` | `10 คู่`), Wave indicator (`ด่าน 1/3`), Combo badge (`🔥 x1`), Hint button (`💡 ตัวช่วย (2)`), Shuffle/New Round button (`🎲 สุ่มชุดใหม่`).
- `#match-board-wrap`: relative container holding `<svg id="match-svg-layer" aria-hidden="true">` + `.match-container` (`#match-left`, `#match-right`) for Connect mode, and `#match-memory-grid` for Memory Flip mode.
- Load `<script src="match-engine.js"></script>` before `<script src="game.js"></script>`.

- [ ] **Step 2: Implement Connect-Pairs SVG lines, Hint pulse, and Memory Flip 3D cards in `match-engine.js`**

- Connect-Pairs mode:
  - Renders `6`, `8`, or `10` pairs per wave (3 waves per round).
  - Each left card shows `word` + small `🔊` speak button; each right card shows `meaning` (cleanly wrapped, max 2–3 lines).
  - Selecting a pair draws an animated cubic-bezier `<path>` in `#match-svg-layer` using one of 10 distinct pair colors (`#34d399`, `#fbbf24`, `#38bdf8`, `#f472b6`, `#a78bfa`, etc.) and updates combo multiplier + floating `+score` toast.
  - Wrong match shakes both cards, resets combo to `0`, deducts 1 life, and calls `onWrong(wordItem)`.
  - Hint button highlights one unmatched left+right pair with `.hint-pulse` for 1.8s (up to 2 hints per round).
  - Clearing all pairs in a wave advances to the next wave (`ด่าน 2/3`, `ด่าน 3/3`), and clearing wave 3 triggers `onRoundEnd()`.
- Memory Flip mode:
  - Renders `12` cards (6 pairs: 6 words + 6 meanings) in a 3×4 / 4×3 grid.
  - Clicking flips cards with 3D `rotateY(180deg)`, matches pairs with green glow + combo points, or flips back after 850ms on mismatch.

- [ ] **Step 3: Style `#match-hud-bar`, `#match-svg-layer`, `.match-card` states, and `#match-memory-grid` in `public/games/thai/thai-vocab-hub/style.css`**

- Keep `.match-card` `transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s ease;` verbatim for `test-vocab-engine-perf.mjs`.
- Add responsive rules for `<= 640px` so meanings remain readable and zero horizontal overflow occurs at `360×800`.

- [ ] **Step 4: Commit**

```bash
git add public/games/thai/thai-vocab-hub/match-engine.js public/games/thai/thai-vocab-hub/index.html public/games/thai/thai-vocab-hub/style.css
git commit -m "feat(thai-vocab-hub): build interactive SVG connect-pairs and memory flip arena"
```

---

### Task 3: Wire `game.js` Lifecycle, Fix `#word-area` Bug & Verify in Browser

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/game.js:1710-1735,2895-3025`
- Create: `scripts/test-thai-vocab-match-browser.mjs`

**Interfaces:**
- Consumes: `window.ThaiVocabMatch` (`mount`, `start`, `cleanup`)
- Produces: Clean `switchMode('match')` hiding `#word-area` and calling `KAMPAI.beginRound()`, plus `endGame()` on round finish.

- [ ] **Step 1: Update `switchMode('match')` and `initMatchingGame()` in `public/games/thai/thai-vocab-hub/game.js`**

- In `switchMode(mode)`: when `mode === 'match'`, hide `#word-area` (`wordArea.style.display = 'none'`), call `KAMPAI.beginRound()`, and call `initMatchingGame()`. When leaving `match` mode (or in `stopAllMediaAndTimers()`), call `window.ThaiVocabMatch.cleanup()`.
- In `initMatchingGame()`: delegate to `window.ThaiVocabMatch.mount(...)` and `window.ThaiVocabMatch.start()` so `currentScore`, `currentLives`, `recordAnswer`, `updateHUD`, `speakThai`, and `endGame` stay synchronized.

- [ ] **Step 2: Write Playwright E2E test `scripts/test-thai-vocab-match-browser.mjs`**

Verify at `1280×720` and `360×800`:
1. Enter a category (e.g. `p5-focus` or `misspelled`), switch to `🎯 ทายความหมาย` first, then switch to `🔗 จับคู่` → assert `#word-area` is NOT visible (`"เลือกความหมาย"` bug is gone!).
2. Assert `#match-left .match-card` count is `6` (default, > 4) and `#match-right .match-card` shows Thai meanings (not `[ reading ]`).
3. Match a valid pair → assert `#match-svg-layer path` count increments to `1`, combo badge updates, and `#score-val` increases.
4. Switch to `🃏 การ์ดคว่ำจำคู่` → assert `12` memory cards render and flip on click.
5. Assert zero horizontal overflow at `360×800` and `1280×720` and zero `pageerror`s.

- [ ] **Step 3: Run full test & verification suite**

Run:
1. `node scripts/test-thai-vocab-match.mjs`
2. `node scripts/test-thai-vocab-match-browser.mjs`
3. `node scripts/test-vocab-engine-perf.mjs`
4. `pnpm verify:game:all -- public/games/thai/thai-vocab-hub`

Expected: All assertions and gates PASS.

- [ ] **Step 4: Commit**

```bash
git add public/games/thai/thai-vocab-hub/game.js scripts/test-thai-vocab-match-browser.mjs
git commit -m "feat(thai-vocab-hub): wire redesigned matching arena and add browser tests"
```
