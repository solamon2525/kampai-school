# Language Media Suite Evolution & Future Roadmap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Evolve the two flagship pinned language learning media shown in the Media Hub—`Everyday Conversation ป.4` and `คลังคำศัพท์ภาษาไทย ป.4–6 (Thai Vocab Hub)`—into a unified, modern, classroom-ready Language Learning Suite with speech evaluation, rich interactive dialogues, advanced vocabulary mastery, multi-tier classroom tools, and a structured 3-phase strategic roadmap.

**Architecture:** A dual-engine client-side architecture leveraging Web Speech API (Synthesis & Recognition) and HTML5 Canvas/Audio, paired with shared runtimes (`shared-classroom-tools.js`, `shared-worksheet-tools.js`, `worksheet-runtime.js`) and Supabase state synchronization (`game_docs`, `educational_hub_items`, and student learning progress).

**Tech Stack:** HTML5 Canvas, Web Speech API (TTS & SpeechRecognition), Web Audio API, Vanilla JS (ES6+ modular, no-bundler 5-file architecture for standalone games/media), Tailwind CSS utility classes, Supabase Postgres, Sarabun & Atkinson Hyperlegible fonts.

**Spec:** `docs/superpowers/plans/2026-11-02-language-media-suite-evolution-roadmap.md`

## Global Constraints

- **Classroom-First & Light Mode Only:** Standard Kampai CSS variables (`--navy`, `--gold`, `--coral`, `--aqua`, `--paper`, `--line`), Sarabun & Atkinson Hyperlegible fonts, light-mode only, zero hardcoded dark mode overrides.
- **Minimum Touch Targets:** All interactive buttons, speaker targets, flashcards, and navigation items must measure $\ge 44 \times 44\text{px}$.
- **Cognitive Pacing & Accessibility (Rule G & 14.x):** Natural conversation cadence, adjustable TTS speed ($0.75\times, 1.0\times, 1.25\times$), synchronized karaoke highlighting, high contrast focus outlines (`:focus-visible`), and `@media (prefers-reduced-motion: reduce)`.
- **Quality Contract & In-Memory Lifecycle:** Zero `location.reload()`, clean in-memory state resets, `KAMPAI.beginRound()`, `#kampai-result` slot, and test hooks.
- **Standards Alignment:** OBEC Indicators for English (ต 1.1, ต 1.2, ต 1.3, ต 2.1) and Thai (ท 1.1, ท 2.1, ท 4.1).

## Review Focus

1. **Speech Synthesis Resilience:** Web Speech API can stall or hang on rapid card skipping or mobile iOS/Android webviews. Must implement watchdog timer fallback and `speechSynthesis.cancel()` cleanup.
2. **Classroom Viewport Adaptability:** Large projector/whiteboard views ($1280 \times 720$) require distinct font magnification ($\ge 36\text{px}$ dialogue text, $80\text{px}$ keywords) while mobile devices ($360 \times 800$) must prevent horizontal overflow.
3. **Audio Autoplay & Speech Recognition Permissions:** Browser autoplay and microphone permission denial must degrade gracefully without crashing the application.
4. **Pedagogical Integrity:** Dialogue lines must reflect authentic everyday Thai student life and accurate English orthography/grammar without awkward direct translations.
5. **Print Worksheet Fidelity:** Standalone A4 worksheets must render crisp 300dpi print layouts with teacher answer keys and no truncated lines.

---

### Phase 1: Immediate Elevation & Optimization (Q4 2026)

#### Task 1: Everyday Conversation Core Optimization (Speech Rate, Karaoke Precision & Voice Safeguards)

**Files:**
- Modify: `public/games/english/everyday-conversation-p4-media.html`
- Modify: `public/games/english/everyday-conversation-p4-worksheet.html`
- Test: `pnpm verify:game:all -- public/games/english/everyday-conversation-p4-media.html`
- Test: `node scripts/verify-worksheet.mjs public/games/english/everyday-conversation-p4-worksheet.html`

**Interfaces:**
- Consumes: Native Web Speech API Synthesis and `window.KAMPAI`.
- Produces: Adjustable speech tempo selector ($0.75\times, 1.0\times, 1.25\times$), boundary-synced word highlighting, watchdog recovery, and enhanced A4 comic worksheet generator.

- [ ] **Step 1: Implement Speech Rate & Pitch Controls**
  Add a three-speed tempo toggle (`🐢 ช้า 0.75x`, `🚶 ปกติ 1.0x`, `🏃 คล่อง 1.25x`) enabling differentiated learning for struggling and advanced learners.
- [ ] **Step 2: Harden Web Speech Synthesis with Watchdog Timer**
  Implement `SpeechWatchdog` that cancels hung utterances if `onend` fails to fire within duration threshold, preventing frozen UI states.
- [ ] **Step 3: Synchronized Karaoke Word Highlighting**
  Wire `utterance.onboundary` to dynamically wrap and illuminate the currently spoken English word (`.spoken-word`) in both dialogue lines and speech bubbles.
- [ ] **Step 4: Expand A4 Printable Dialogue Comic Worksheets**
  Add Comic Strip dialogue bubble completion format to `everyday-conversation-p4-worksheet.html` with teacher answer key toggle.
- [ ] **Step 5: Run Multi-Viewport Smoke Tests & Verify**
  Verify across Phone (360×800), Tablet (768×1024), and Desktop (1280×720).
- [ ] **Step 6: Commit**
  `git commit -m "feat(everyday-conversation): speech rate controls, karaoke precision, watchdog recovery and comic worksheet"`

---

#### Task 2: Everyday Conversation Curriculum Expansion (45 Situations & Digital Life)

**Files:**
- Modify: `public/games/english/everyday-conversation-p4-media.html`
- Test: Browser automated dialogue traversal test.

**Interfaces:**
- Consumes: OBEC Primary English Curriculum Core Competencies.
- Produces: 15 new high-impact dialogues (expanding from 30 to 45 lessons) across 3 new thematic categories: Digital Life & Safety, Health & Hygiene, and ASEAN Cultural Exchange.

- [ ] **Step 1: Curate 15 Authentic New Primary English Dialogues**
  Draft 15 four-line dialogues with phonetic Thai reading and natural Thai translations:
  - **Category 7: Digital Life & Technology (5 lessons):** Using a tablet in class, searching for knowledge online, safe passwords, video calls with friends, sending an email to teacher.
  - **Category 8: Health, Hygiene & Wellness (5 lessons):** Washing hands before lunch, wearing a mask when sick, eating nutritious vegetables, sports day warmups, visiting the school infirmary.
  - **Category 9: Culture, Weather & ASEAN Friends (5 lessons):** Welcoming an exchange student, Thai festivals (Songkran & Loy Krathong), rainy season weather report, favorite Thai fruits, asking for directions in the community.
- [ ] **Step 2: Generate Matching SVG/WebP Illustrated Stage Scenes**
  Add illustrated visual stage assets corresponding to new dialogues in `SCENE_VISUALS`.
- [ ] **Step 3: Update Lesson Selector Grid & Indicator Mapping**
  Expand sidebar lesson navigator to support 9 categories with 5 lessons each (total 45 lessons) mapped to indicators ต 1.1 ป.4/1–4, ต 1.2 ป.4/1–5, ต 2.1 ป.4/1–3.
- [ ] **Step 4: Verify and Commit**
  `git commit -m "feat(everyday-conversation): expand dialogue curriculum to 45 lessons across 9 thematic categories"`

---

#### Task 3: Thai Vocab Hub Enhanced Exploration (Instant Search, POS Badges & Crossword)

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/index.html`
- Modify: `public/games/thai/thai-vocab-hub/game.js`
- Modify: `public/games/thai/thai-vocab-hub/style.css`
- Modify: `public/games/thai/thai-vocab-worksheet.html`
- Test: `pnpm verify:game:all -- public/games/thai/thai-vocab-hub/index.html`

**Interfaces:**
- Consumes: 2,400 cleaned approved vocabulary records from `thai-vocab-data.js`.
- Produces: Instant live search filter, grammatical part-of-speech (POS) tags, interactive sentence builder, and 1-click A4 Thai Crossword puzzle generator.

- [ ] **Step 1: Build Instant Real-Time Search & Alphabet Quick-Jump**
  Add search bar with debounce (250ms) and Thai consonant quick-index (`ก ข ค ... ฮ`) enabling teachers and students to instantly find any word in seconds.
- [ ] **Step 2: Visual Part-of-Speech (POS) Tags & Sentence Example Drawer**
  Highlight grammatical category (`คำนาม`, `คำกริยา`, `คำวิเศษณ์`, `คำสรรพนาม`, `คำบุพบท`) with distinct color badges, and add an expandable "ประโยคตัวอย่าง" drawer on flashcards.
- [ ] **Step 3: A4 Thai Crossword / Word Grid Generator**
  Add a 4th worksheet mode to `thai-vocab-worksheet.html`: A4 Thai Word Search / Crossword grid generator with teacher answer key.
- [ ] **Step 4: Verify across 3 viewports and Commit**
  `git commit -m "feat(thai-vocab-hub): instant search, POS badges, sentence drawer and A4 crossword generator"`

---

### Phase 2: Medium-Term Strategic Evolution (Q1 2027)

#### Task 4: Interactive Speech Recognition & Pronunciation Scoring (AI Voice Coach)

**Files:**
- Create: `public/games/english/speech-recognition-coach.js`
- Modify: `public/games/english/everyday-conversation-p4-media.html`
- Test: `tests/speech-recognition-coach.test.mjs`

**Interfaces:**
- Consumes: Browser `webkitSpeechRecognition` / `SpeechRecognition` API.
- Produces: Real-time phonetic word match score (0–100%), acoustic wave animation, and supportive constructive feedback for elementary school students.

- [ ] **Step 1: Build Standalone Speech Recognition Coach Engine**
  Implement `SpeechRecognitionCoach` with:
  - Graceful microphone permission handler with Thai instruction banner.
  - Normalized Levenshtein distance string matching ignoring punctuation and capitalization.
  - Word-by-word correctness feedback (Green = accurate, Yellow = close, Red = try again).
  - Child-friendly growth-mindset praise ("เยี่ยมมาก! สำเนียงชัดเจน", "เก่งมาก พยายามพูดให้ดังขึ้นอีกนิดนะ").
- [ ] **Step 2: Wire "🎙️ ลองพูดดูซิ" Practice Mode in Everyday Conversation**
  Add an interactive microphone button on student lines in "เรื่องของฉัน" and "จับคู่ A/B" modes allowing children to practice speaking against the computer.
- [ ] **Step 3: Offline / Browser Fallback Stub**
  Provide graceful fallback when speech recognition is unsupported or denied: switches smoothly to "โหมดฟังและพูดตาม" (Listen & Repeat).
- [ ] **Step 4: Test, Verify and Commit**
  `git commit -m "feat(everyday-conversation): interactive speech recognition coach and pronunciation scoring"`

---

#### Task 5: 2-Player Interactive Language Duel (KampaiVersus Integration)

**Files:**
- Modify: `public/games/english/everyday-conversation-p4-media.html`
- Modify: `public/games/thai/thai-vocab-hub/index.html`
- Test: `pnpm verify:game:all` on both targets.

**Interfaces:**
- Consumes: `/games/kampai-versus.js` and `/games/kampai-match.js`.
- Produces: Two-player Language Duels (English Dialogue Speed Match & Thai Vocab Meaning Clash).

- [ ] **Step 1: Wire Everyday Conversation 2-Player Roleplay Duel**
  Add "👥 แข่งบทบาทสมมติ (Roleplay Duel)" where P1 acts as Role A and P2 acts as Role B, scoring points based on rapid response and dialogue comprehension.
- [ ] **Step 2: Wire Thai Vocab Hub 2-Player Flash Duel**
  Add "⚔️ ประลองคำศัพท์ 2 คน (Vocab Flash Duel)" with seeded RNG: P1 and P2 compete to select the correct definition or synonym within 60 seconds.
- [ ] **Step 3: Real-Time Score Reporting & Quality Contract Compliance**
  Ensure both duels broadcast live scores via `vs.report(score, { correct })` and finalize gracefully with `vs.finish(...)`.
- [ ] **Step 4: Verify and Commit**
  `git commit -m "feat(media-hub): 2-player interactive language duels with KampaiVersus integration"`

---

#### Task 6: Expansion to Multi-Grade Suite (English & Thai Grade 4–6 Complete Coverage)

**Files:**
- Create: `public/games/english/everyday-conversation-p5-media.html`
- Create: `public/games/english/everyday-conversation-p6-media.html`
- Modify: Database migration registering new curriculum items in `educational_hub_items`.

**Interfaces:**
- Consumes: OBEC English Grade 5 & 6 Standards.
- Produces: Complete Grade 4–6 Everyday Conversation Suite with specialized Grade 5 (Social & School Life) and Grade 6 (Community, Travel & Basic Work).

- [ ] **Step 1: Scaffolding Grade 5 & 6 Media Implementations**
  Reuse tested shared modules and style architectures, loading grade-specific dialogue databases.
- [ ] **Step 2: Indicator Mapping & Curriculum Documentation**
  Map indicators for Grade 5 (ต 1.1 ป.5/1–4, ต 1.2 ป.5/1–5) and Grade 6 (ต 1.1 ป.6/1–4, ต 1.2 ป.6/1–5).
- [ ] **Step 3: Database Registration & Hub Catalog Integration**
  Register items in `educational_hub_items` and `game_docs` via migration.
- [ ] **Step 4: Verify and Commit**
  `git commit -m "feat(english-suite): release everyday conversation p5 and p6 media items"`

---

### Phase 3: Long-Term Future Vision (Q2–Q3 2027)

#### Task 7: Adaptive Student Learning Analytics & Voice Homework Portfolio

**Files:**
- Create: `src/services/student-language-portfolio.service.ts`
- Create: `src/components/shared/VoiceHomeworkRecorder.tsx`
- Modify: `src/pages/portal/TeacherEduHubManager.tsx`

**Interfaces:**
- Consumes: Supabase database table `student_language_submissions`.
- Produces: Teacher voice review dashboard, student audio recording portfolio, and adaptive spaced repetition recommendations.

- [ ] **Step 1: Database Migration for Student Audio Submissions**
  Create migration for `student_language_submissions` storing student audio blobs / base64 recordings, scores, and teacher audio feedback.
- [ ] **Step 2: Student Voice Homework Submission Component**
  Implement 1-click recording button inside Everyday Conversation allowing students to record their roleplay lines and submit directly to their homeroom teacher.
- [ ] **Step 3: Teacher Review & Star Grading Dashboard**
  Add teacher review panel in `TeacherEduHubManager` allowing teachers to listen to student recordings, assign 1–3 stars, and leave voice/text comments.
- [ ] **Step 4: Verify and Commit**
  `git commit -m "feat(portfolio): adaptive student language analytics and voice homework submission suite"`

---

#### Task 8: National Assessment Test Preparation Modules (O-NET & NT Simulated Exams)

**Files:**
- Modify: `public/games/thai/thai-vocab-hub/game.js`
- Modify: `public/games/english/everyday-conversation-p4-media.html`
- Test: Verification against past 5-year O-NET / NT exam question patterns.

**Interfaces:**
- Consumes: Past O-NET English Conversation & Thai Vocabulary question formats.
- Produces: Simulated National Assessment Practice Mode with timer, real exam layout, and diagnostic score breakdown by indicator.

- [ ] **Step 1: Curate O-NET / NT Question Bank**
  Assemble 100 authentic past-exam style dialogue items (English) and 100 contextual vocabulary analysis items (Thai).
- [ ] **Step 2: Add "🎯 โหมดจำลองสอบระดับชาติ (O-NET Prep)"**
  Integrate clean timed exam mode with detailed post-exam diagnostic review showing student strengths and areas for remediation.
- [ ] **Step 3: System Overview Documentation & Deployment**
  Update `SystemOverview.tsx` to document language learning milestone.
- [ ] **Step 4: Verify and Commit**
  `git commit -m "feat(assessment): national test prep mode for O-NET and NT language indicators"`
