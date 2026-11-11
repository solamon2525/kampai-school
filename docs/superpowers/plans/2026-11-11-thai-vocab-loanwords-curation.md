# Thai Vocab Hub Loanwords Curation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cleanse and replace 21 non-loanwords in Thai Vocab Hub's "คำภาษาต่างประเทศ" (loanwords) category with 100% verified textbook-grade foreign loanwords and transliterations.

**Architecture:** Update `public/games/thai/thai-vocab-hub/data/words/loanwords.json` with rigorous linguistic accuracy, then run `scripts/build-vocab-data.mjs` to synchronize `public/games/thai/thai-vocab-hub/data.js` and verify with `scripts/build-vocab-data.mjs --check` and test suites.

**Tech Stack:** Node.js (ESM), JSON data store, Vanilla JS Thai Vocab Hub engine.

**Spec:** User instruction to thoroughly scan and eliminate Thai native/compound words (e.g. ข้าวเหนียวมะม่วง, เครื่องซักผ้า, พัดลม, ตู้เย็น) and ensure 100% authentic loanwords / transliterations across the entire 200-word catalog.

## Global Constraints

- Total words in `loanwords.json` must remain exactly 200 words.
- Each word item must contain: `word`, `reading`, `meaning`, `emoji`, `grade`, `indicator_code`, `origin_lang`, `content_status: "approved"`, `category_evidence`, `pos`, and `example`.
- Zero duplicate collisions across the 3,400 vocabulary bank without valid rationale.
- Must pass `node scripts/build-vocab-data.mjs --check` (3,400 approved words, 200 per category).

## Review Focus

1. Verify that all 21 non-loanwords are completely removed from `loanwords.json`.
2. Verify that all 21 replacement words are 100% authentic foreign loanwords (English, Chinese, Japanese, Pali-Sanskrit).
3. Verify that `origin_lang` codes are properly mapped (`en`, `zh`, `ja`, `pa`, `sa`, `km`, etc.).
4. Verify that `build-vocab-data.mjs` rebuilds `public/games/thai/thai-vocab-hub/data.js` cleanly.
5. Verify that the vocabulary flashcard UI renders with audio TTS and search functional.

---

### Task 1: Cleanse and update `loanwords.json` with 21 curated words

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/data/words/loanwords.json`
- Test: `scripts/audit-loanwords-details.mjs`

- [x] **Step 1: Write verification script to assert 0 non-loanwords in `loanwords.json`**
- [x] **Step 2: Run verification script to confirm it currently flags 21 words**
- [x] **Step 3: Update `loanwords.json` replacing all 21 non-loanwords with verified replacements**
- [x] **Step 4: Run verification script to confirm 0 flagged words**

---

### Task 2: Build and compile `data.js` and verify dictionary integrity

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/data.js` (via build script)
- Test: `scripts/build-vocab-data.mjs --check`

- [x] **Step 1: Run `pnpm build:vocab` to regenerate `data.js`**
- [x] **Step 2: Run `node scripts/build-vocab-data.mjs --check` to verify 200 approved words**
- [x] **Step 3: Verify no duplicate collisions across all 17 categories**

---

### Task 3: Regression test and verify Thai Vocab Hub

**Files:**
- Test: `public/games/thai/thai-vocab-hub/index.html`

- [x] **Step 1: Run game verification checks**
- [x] **Step 2: Clean up temporary audit scripts**
- [x] **Step 3: Commit changes with Conventional Commits**
