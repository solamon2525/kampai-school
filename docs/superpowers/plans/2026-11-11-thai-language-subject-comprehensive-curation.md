# Thai Language Subject Comprehensive Content Curation & Bug Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Curate all Thai language content, correct serious pedagogical and linguistic misconceptions across teaching media hubs, repair data schema issues, fix gameplay/integration bugs in Thai games, and ensure 100% curriculum accuracy aligned with the Ministry of Education (สพฐ.) and the Royal Society of Thailand (ราชบัณฑิตยสภา).

**Architecture:** 
Decompose the remediation across 5 thematic content/technical areas:
1. Punctuation Hub (`thai-punctuation-hub`): Fix the critical "period at end of Thai sentence" fallacy, adopt official Thai grammatical terminology (มหัพภาค, ปรัศนี, นขลิขิต, อัญประกาศ, ยัติภังค์, จุดไข่ปลา), fix broken comma/dash data, and introduce core Thai punctuation (ไม้ยมก, ไปยาลน้อย, ไปยาลใหญ่, สัญประกาศ).
2. Grammar & Sentence Hubs (`thai-grammar-hub`, `thai-sentence-hub`): Fix pronunciation/reading fields (replace part-of-speech labels like "นาม"/"กริยา" with actual phonetic readings), clean inline sentence strings in meanings, restore distinct card words instead of repetitive generic labels, and fix typos (`โรงเรียนเปิดเว้าแรก` ➔ `โรงเรียนเปิดวันแรก`).
3. Poetry & Writing Hubs (`thai-poetry-hub`, `thai-writing-hub`): Disentangle prose (ร้อยแก้ว) from verse (ร้อยกรอง), enforce genuine phonetic rhyme rules (สัมผัสสระและมาตราตัวสะกด), replace mismatched slogans with authentic rhyming mottoes, and correct writing hub typos and sentence errors.
4. Literature & Script Hubs (`thai-literature-hub`, `thai-script-hub`): Restore authentic Thai Ministry of Education memorized poems/verses (บทอาขยาน: พฤษภกาสร, ตนเป็นที่พึ่งแห่งตน, นิราศภูเขาทอง, ขุนช้างขุนแผน) and genuine Thai folklore (ปลาบู่ทอง, สังข์ทอง, ไกรทอง), fix Mae Ko Ka (แม่ ก กา = ไม่มีตัวสะกด) definition, and remove non-existent word typos ("ยาวน์").
5. Thai Game Integration & Modernization (`battle-city`): Integrate KAMPAI SDK, enforce light-mode color variables, replace out-of-place English words with Thai vocabulary suitable for elementary students, and verify three standard modes.
6. System Verification & Version Sync: Execute end-to-end unit tests in `tests/thai-vocab-hub/` and new test suites, verify game integrity, build production app, and register `v2.8.21` in `SystemOverview.tsx`.

**Tech Stack:** Vanilla JS, Node.js (test runner), Vite, TailwindCSS (light mode variables), Supabase, KAMPAI SDK.

**Spec:** [thai_language_subject_curation_plan.md](file:///C:/Users/Administrator/.gemini/antigravity/brain/69e6c65e-f3af-41b7-887d-8613b064e511/thai_language_subject_curation_plan.md) and Royal Institute Dictionary 2011 / Basic Education Core Curriculum B.E. 2551 (ท 1.1, ท 2.1, ท 3.1, ท 4.1, ท 5.1).

---

## Global Constraints

- **Light Mode Only:** Strictly no `dark:` prefix or hardcoded dark backgrounds (`#0b0f19`, `bg-slate-900`); use CSS semantic variables.
- **Package Manager:** `pnpm` only.
- **Thai Orthography & Grammar:** Follow the Royal Society of Thailand (พจนานุกรมฉบับราชบัณฑิตยสภา ๒๕๕๔) and Ministry of Education Thai curriculum standards strictly.
- **Zero Placeholders:** No dummy placeholder texts or generic templates.
- **Verification Gates:** All unit tests must pass via `node --test tests/**/*.test.mjs`, and modified games must satisfy `pnpm verify:game:all`.

---

## Review Focus

1. **Punctuation Fallacy Check:** Ensure no question or example teaches that Thai sentences end with a period (`.`). มหัพภาค must be taught exclusively for abbreviations, numbered lists, timestamps, and decimals.
2. **Pronunciation Field Integrity:** Ensure `reading` fields contain genuine Thai phonetic pronunciation strings (e.g. `หฺนัง-สือ`, `วิ่ง`), never category names or POS labels (`นาม`, `กริยา`).
3. **Card Word Distinctness:** In `thai-sentence-hub`, each card must feature the actual subject, verb, or object being taught, not the word "ประธาน" or "กริยา" repeated dozens of times.
4. **Poetic Rhyme Accuracy:** In `thai-poetry-hub`, rhyme pairs must strictly match both vowel sound (เสียงสระ) and final consonant sound (มาตราตัวสะกด).
5. **No Broken Mobile Overflows:** Viewports 360×800 and 1280×720 must render with zero horizontal scrollbars or truncated content.

---

## Tasks

### Task 1: Curate `thai-punctuation-hub` & Fix Punctuation Fallacies

**Files:**
- Modify: `public/games/thai/thai-punctuation-hub/data/categories.json`
- Modify: `public/games/thai/thai-punctuation-hub/data/items/period.json`
- Modify: `public/games/thai/thai-punctuation-hub/data/items/question.json`
- Modify: `public/games/thai/thai-punctuation-hub/data/items/comma.json`
- Modify: `public/games/thai/thai-punctuation-hub/data/items/dash.json`
- Modify: `public/games/thai/thai-punctuation-hub/data/items/ellipsis.json`
- Modify: `public/games/thai/thai-punctuation-hub/data/items/parentheses.json`
- Modify: `public/games/thai/thai-punctuation-hub/data/items/quotes.json`
- Create: `public/games/thai/thai-punctuation-hub/data/items/maiyamok.json` (ไม้ยมก)
- Create: `public/games/thai/thai-punctuation-hub/data/items/paiyannoi.json` (ไปยาลน้อย & ไปยาลใหญ่)
- Create: `tests/thai-subject/punctuation-hub.test.mjs`

- [ ] **Step 1.1: Write failing test for punctuation facts and Thai terminology**
  Create `tests/thai-subject/punctuation-hub.test.mjs` asserting:
  - `period.json` does NOT contain sentences ending with `.` as standard Thai sentence endings; all examples must be abbreviations (`พ.ศ.`, `ร.ร.`), time (`๐๘.๓๐ น.`), or list numbers (`๑.`, `๒.`).
  - Category titles use official Thai terms: `มหัพภาค ( . )`, `ปรัศนี ( ? )`, `นขลิขิต ( ( ) )`, `อัญประกาศ ( " " )`, `ยัติภังค์ ( - )`, `จุดไข่ปลา ( ... )`.
  - `comma.json` sentences contain actual commas (`,`), not periods.
  - `dash.json` does not teach hyphenated compounds like `รถ-ไฟ`.
  - New high-value punctuation marks (`maiyamok`, `paiyannoi`) exist.

- [ ] **Step 1.2: Run test to confirm failure**
  Run: `node --test tests/thai-subject/punctuation-hub.test.mjs` (must fail).

- [ ] **Step 1.3: Update `categories.json` with official Thai terminology**
  Replace colloquial labels with official grammar names and add `maiyamok` (ไม้ยมก) and `paiyannoi` (ไปยาลน้อย / ไปยาลใหญ่).

- [ ] **Step 1.4: Rewrite `period.json` with authentic Thai abbreviation & time usages**
  Replace English-style terminal periods with:
  - `พ.ศ. ๒๕๖๙` (พุทธศักราช)
  - `ร.ร. บ้านคำไผ่` (โรงเรียน)
  - `เวลา ๐๘.๓๐ น.` (นาฬิกา)
  - `ด.ช. สมศักดิ์` (เด็กชาย)
  - `จ. ขอนแก่น` (จังหวัด)
  - `ข้อ ๑. ให้อ่านคำชี้แจง` (ลำดับข้อย่อย)

- [ ] **Step 1.5: Fix `comma.json`, `dash.json`, and `ellipsis.json`**
  - In `comma.json`: Ensure `sentence_answer` and `sentence` contain genuine Thai comma usage (คั่นจำนวนเลขอารบิก `๑,๐๐๐`, คั่นรายการสิ่งของในการแจกแจงแบบวิชาการ).
  - In `dash.json`: Change meaning from "เชื่อมคำประกอบ" to "แยกพยางค์บอกคำอ่าน" (เช่น `กัลปังหา` ➔ `กัน-ปัง-หา`) และ "บอกช่วงเวลาหรือจำนวน" (เช่น `หน้า ๑-๑๐`, `เวลา ๐๘.๓๐-๑๖.๓๐ น.`).
  - In `ellipsis.json`: Rename to `จุดไข่ปลา ( ... )` with authentic Thai reading and meaning.

- [ ] **Step 1.6: Run test and ensure passing**
  Run: `node --test tests/thai-subject/punctuation-hub.test.mjs` (must pass).

- [ ] **Step 1.7: Commit Task 1**
  `git commit -m "feat(thai-punctuation-hub): curate official thai terminology and eliminate period misconception"`

---

### Task 2: Curate `thai-grammar-hub` & `thai-sentence-hub`

**Files:**
- Modify: `public/games/thai/thai-grammar-hub/data/items/noun.json`
- Modify: `public/games/thai/thai-grammar-hub/data/items/verb.json`
- Modify: `public/games/thai/thai-grammar-hub/data/items/adjective.json`
- Modify: `public/games/thai/thai-grammar-hub/data/items/adverb.json`
- Modify: `public/games/thai/thai-grammar-hub/data/items/preposition.json`
- Modify: `public/games/thai/thai-grammar-hub/data/items/conjunction.json`
- Modify: `public/games/thai/thai-sentence-hub/data/items/subject.json`
- Modify: `public/games/thai/thai-sentence-hub/data/items/verb.json`
- Modify: `public/games/thai/thai-sentence-hub/data/items/object.json`
- Modify: `public/games/thai/thai-sentence-hub/data/items/modifier.json`
- Create: `tests/thai-subject/grammar-sentence-hub.test.mjs`

- [ ] **Step 2.1: Write failing test for grammar readings and sentence distinctness**
  Create `tests/thai-subject/grammar-sentence-hub.test.mjs` asserting:
  - In `thai-grammar-hub`, `reading` fields must NOT equal the category name ("นาม", "กริยา", "คุณศัพท์"); they must match the phonetic reading of the target word.
  - In `thai-grammar-hub`, `meaning` strings must not contain messy inline `· ประโยค: ...` substrings (sentences belong in the `sentence` field).
  - In `thai-sentence-hub`, `word` fields in `subject.json` must NOT all equal "ประธาน"; they must contain the distinct subject word from the sentence (e.g. `เด็กชาย`, `แมว`, `โรงเรียน`).
  - `โรงเรียนเปิดเว้าแรก` typo is fixed to `โรงเรียนเปิดวันแรก`.

- [ ] **Step 2.2: Run test to confirm failure**
  Run: `node --test tests/thai-subject/grammar-sentence-hub.test.mjs` (must fail).

- [ ] **Step 2.3: Fix `reading` and `meaning` across all `thai-grammar-hub` item files**
  Populate phonetic readings (e.g. `หนังสือ` ➔ `หฺนัง-สือ`, `โรงเรียน` ➔ `โรง-เรียน`, `วิ่ง` ➔ `วิ่ง`, `สวย` ➔ `สวย`) and cleanly format definitions.

- [ ] **Step 2.4: Fix card target words and typos across `thai-sentence-hub`**
  - Set `word` to the highlighted constituent (e.g. `เด็กชาย` for subject, `บิน` for verb, `ฟุตบอล` for object).
  - Fix typo: `โรงเรียนเปิดเว้าแรก` ➔ `โรงเรียนเปิดวันแรก`.

- [ ] **Step 2.5: Run test and ensure passing**
  Run: `node --test tests/thai-subject/grammar-sentence-hub.test.mjs` (must pass).

- [ ] **Step 2.6: Commit Task 2**
  `git commit -m "feat(thai-grammar-sentence): enrich phonetic readings and set distinct card targets"`

---

### Task 3: Curate `thai-poetry-hub` & `thai-writing-hub`

**Files:**
- Modify: `public/games/thai/thai-poetry-hub/data/items/rojak.json` (บทร้อยแก้ว)
- Modify: `public/games/thai/thai-poetry-hub/data/items/kong.json` (บทร้อยกรอง)
- Modify: `public/games/thai/thai-poetry-hub/data/items/rhyme-near.json`
- Modify: `public/games/thai/thai-poetry-hub/data/items/rhyme-far.json`
- Modify: `public/games/thai/thai-poetry-hub/data/items/khanman.json`
- Modify: `public/games/thai/thai-writing-hub/index.html`
- Create: `tests/thai-subject/poetry-writing-hub.test.mjs`

- [ ] **Step 3.1: Write failing test for poetic rhymes and writing hub texts**
  Create `tests/thai-subject/poetry-writing-hub.test.mjs` asserting:
  - In `rojak.json` (ร้อยแก้ว), items are categorized as prose passages without bogus rhyme hints.
  - In `rhyme-near.json` and `rhyme-far.json`, rhyme pairs strictly share identical vowel sounds and coda consonants (e.g. `คราม` rhymes with `งาม`, NOT with `ว่า`; `มอง` does NOT rhyme with `ทาง`).
  - In `khanman.json` (คำขวัญ), each item is an authentic rhyming motto, not generic labels like "คำขวัญโรงเรียน".
  - `thai-writing-hub/index.html` does not contain `ฉันร่มกับแม่` or duplicate `สวัสดี หหวัดดี`.

- [ ] **Step 3.2: Run test to confirm failure**
  Run: `node --test tests/thai-subject/poetry-writing-hub.test.mjs` (must fail).

- [ ] **Step 3.3: Rewrite `rojak.json`, `rhyme-near.json`, `rhyme-far.json`, and `khanman.json`**
  - Curate authentic Thai children's rhymes and mottoes following standard Thai prosody (กาพย์ยานี ๑๑, กลอนสี่).
  - Ensure all question answers match true Thai rhyme rules.

- [ ] **Step 3.4: Fix prose and slogan examples in `thai-writing-hub/index.html`**
  - Line 77: `ฉันกางร่มไปกับแม่`
  - Line 95: `สวัสดีเพื่อนรัก`
  - Line 114: `ตั้งใจเรียนทุกวัน / สร้างความฝันในอนาคต` (วัน - ฝัน สัมผัสคล้องจอง)

- [ ] **Step 3.5: Run test and ensure passing**
  Run: `node --test tests/thai-subject/poetry-writing-hub.test.mjs` (must pass).

- [ ] **Step 3.6: Commit Task 3**
  `git commit -m "feat(thai-poetry-writing): enforce authentic thai rhyme prosody and fix writing hub copy"`

---

### Task 4: Curate `thai-literature-hub` & `thai-script-hub`

**Files:**
- Modify: `public/games/thai/thai-literature-hub/data/items/akhayarn.json`
- Modify: `public/games/thai/thai-literature-hub/data/items/folktale.json`
- Modify: `public/games/thai/thai-script-hub/data/items/spelling-mattra.json`
- Create: `tests/thai-subject/literature-script-hub.test.mjs`

- [ ] **Step 4.1: Write failing test for literature texts and script hub rules**
  Create `tests/thai-subject/literature-script-hub.test.mjs` asserting:
  - `akhayarn.json` contains authentic Ministry of Education memorized poems (พฤษภกาสร, ตนเป็นที่พึ่งแห่งตน, นิราศภูเขาทอง, ขุนช้างขุนแผน), not synthetic prose.
  - `folktale.json` contains genuine Thai folk literature (ปลาบู่ทอง, สังข์ทอง, ไกรทอง, โสนน้อยเรือนงาม), not European/Aesop tales.
  - In `spelling-mattra.json`, `แม่ ก กา` is correctly defined as having NO coda consonant (`mattra_final: null` / `ไม่มีตัวสะกด`), NOT `ลงท้าย ก`.
  - In `spelling-mattra.json`, `ยาวน์` typo is removed.

- [ ] **Step 4.2: Run test to confirm failure**
  Run: `node --test tests/thai-subject/literature-script-hub.test.mjs` (must fail).

- [ ] **Step 4.3: Populate authentic literature passages in `akhayarn.json` and `folktale.json`**
  - Add real classical stanzas with grade-level context and moral lessons.
  - Insert Thai folk narratives with local cultural roots.

- [ ] **Step 4.4: Fix Mae Ko Ka definition and typos in `thai-script-hub`**
  - Correct `แม่ ก กา`: `reading: "ไม่มีตัวสะกด"`, `mattra_final: null`.
  - Fix `ยาวน์` ➔ `ยาว` หรือ `แกง`.

- [ ] **Step 4.5: Run test and ensure passing**
  Run: `node --test tests/thai-subject/literature-script-hub.test.mjs` (must pass).

- [ ] **Step 4.6: Commit Task 4**
  `git commit -m "feat(thai-literature-script): restore authentic thai ministry verse and fix mae ko ka definition"`

---

### Task 5: Remediate `battle-city` Thai Educational Game

**Files:**
- Modify: `public/games/thai/battle-city/index.html`
- Modify: `public/games/thai/battle-city/style.css`
- Modify: `public/games/thai/battle-city/data.js`
- Modify: `public/games/thai/battle-city/game.js`
- Modify: `public/games/thai/battle-city/config.js`
- Create: `tests/thai-subject/battle-city-remediation.test.mjs`

- [ ] **Step 5.1: Write failing test for `battle-city` Thai integration**
  Create `tests/thai-subject/battle-city-remediation.test.mjs` asserting:
  - `index.html` loads `/games/kampai-sdk.js`.
  - `data.js` contains Thai vocabulary targets (e.g. Thai consonant clusters, vocabulary words, and Thai spelling) suitable for Thai subject, instead of raw English words.
  - Background is light-mode compliant (no dark `#0b0f19`).

- [ ] **Step 5.2: Run test to confirm failure**
  Run: `node --test tests/thai-subject/battle-city-remediation.test.mjs` (must fail).

- [ ] **Step 5.3: Integrate KAMPAI SDK & KampaiVersus into `battle-city`**
  - Add `<script src="/games/kampai-sdk.js"></script>` and `/games/kampai-versus.js`.
  - Add standard `KAMPAI.onReady` initialization, score submission on game over, and back navigation button.

- [ ] **Step 5.4: Replace English words with curriculum Thai vocabulary in `battle-city/data.js`**
  - Update `GAME_DATA.words` to Thai vocabulary targets with syllable tiles for spelling (e.g. `ชนะ`, `ปัญญา`, `ขยัน`, `กตัญญู`, `สามัคคี`).

- [ ] **Step 5.5: Update style to light theme**
  - Update background from dark `#0b0f19` to crisp educational light theme canvas frame.

- [ ] **Step 5.6: Run test and ensure passing**
  Run: `node --test tests/thai-subject/battle-city-remediation.test.mjs` (must pass).

- [ ] **Step 5.7: Commit Task 5**
  `git commit -m "feat(battle-city): integrate kampai sdk, light theme, and thai curriculum vocabulary"`

---

### Task 6: Full Verification, App Build, and Version History Sync

**Files:**
- Modify: `src/components/admin/system/SystemOverview.tsx`
- Run: `node --test tests/thai-subject/*.test.mjs`
- Run: `node --test tests/thai-vocab-hub/*.test.mjs`
- Run: `pnpm build`

- [ ] **Step 6.1: Run all Thai subject unit test suites**
  Run: `node --test tests/thai-subject/*.test.mjs tests/thai-vocab-hub/*.test.mjs`
  Confirm all tests pass 100%.

- [ ] **Step 6.2: Run Vite production build**
  Run: `pnpm build`
  Ensure zero TypeScript errors and clean bundle output.

- [ ] **Step 6.3: Add version entry `v2.8.21` to `SystemOverview.tsx`**
  Add entry at the top of `versionHistory` detailing the Thai subject comprehensive curation across Punctuation, Grammar, Sentence, Poetry, Literature, Script hubs, and Battle City.

- [ ] **Step 6.4: Commit Task 6 & Push to remote**
  Stage files and commit:
  `git commit -m "feat(system): sync thai language subject comprehensive curation v2.8.21"`
  Push to `origin main`:
  `git push origin main`
