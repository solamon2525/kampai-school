# สื่อแปลกลอนสุภาพ วรรณคดีลำนำ ป.4 (Wannakhadi Lamnam Thai Poetry Translator Media) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** สร้างสื่อการเรียนรู้เชิงโต้ตอบ "สื่อแปลกลอนสุภาพ วรรณคดีลำนำ ป.4" (Interactive Poetry & Translation Media) ครอบคลุมทั้ง 7 บทตามสารบัญแบบเรียนวรรณคดีลำนำ ชั้น ป.4 พร้อมระบบถอดคำประพันธ์รายวรรค/รายบท, คลังคำศัพท์ยากพร้อมป๊อปอัปความหมาย, ระบบเสียงอ่านคำกลอนและคำแปล (TTS), โหมดฝึกทักษะการถอดความโดยไม่แข่งขัน, ใบงานพิมพ์ A4 คู่บทเรียน, และภาพปก 16:9 ตามมาตรฐานสื่อระดับ Production

**Architecture:** พัฒนาสื่อการสอนรูปแบบ Standalone Web Application (`wannakhadi-p4-media.html`) ภายใต้สถาปัตยกรรม Teaching Media ของ Kampai School; จัดเก็บฐานข้อมูลวรรณคดี คำประพันธ์ การแบ่งจังหวะวรรค คำแปล และคำศัพท์ยากทั้ง 7 บทในโครงสร้างข้อมูล JavaScript ที่มีสกีมาชัดเจน; รองรับการแสดงผล Responsive สำหรับหน้าจอโปรเจกเตอร์ห้องเรียน (1280×720) และมือถือ/แท็บเล็ต (360×800); ผสาน KAMPAI Sound SDK สำหรับเสียงเอฟเฟกต์และเสียงอ่านบทกลอน; พร้อมใบงานคู่บทเรียน (`wannakhadi-p4-media-worksheet.html`) และ Migration ลงทะเบียน Educational Hub (`588_seed_wannakhadi_p4_media.sql`)

**Tech Stack:** Vanilla JavaScript (ES6, No external bundling), Semantic CSS Variables (Light-only, Gold & Navy theme), KAMPAI SDK (`/games/kampai-sdk.js`), Web Speech API (TTS), Node.js native test runner (`node:test`), Sharp/SVG for 16:9 cover image, Supabase SQL migration.

**Spec:**
- [AGENTS.md](../../../AGENTS.md) (Hard rules, Classroom-first product rules, Documentation discipline)
- [.agents/AGENTS.md](../../../.agents/AGENTS.md) (Section 3: Educational Game & Media Guidelines)
- [MEDIA.md](../../../MEDIA.md) (Production Teaching Media standards, zero competitive scoring, learn + practice modes, accessibility, viewport support)
- [WORKSHEET.md](../../../WORKSHEET.md) (Printable A4 worksheet standards)
- [DESIGN.md](../../../DESIGN.md) (Rule 14.x: Light-only styling, typography, touch targets)

---

## Global Constraints

- **Styling:** Light mode only (`bg-background`, `bg-card`, `text-foreground`, `border-border`, gold `#f59e0b` / navy `#1e3a8a` brand accents); ห้ามใช้ `dark:` หรือ hardcoded hex colors ใน selector ที่ไม่ผ่าน CSS variables
- **Package Manager:** `pnpm` เท่านั้น ห้ามใช้ `npm` หรือ `yarn`
- **Media Contract:** ต้องมี `MEDIA_SLUG = 'wannakhadi-p4-media'` หรือ `KAMPAI.setSlug()`, มีโหมด `learn` และ `practice`, มีปุ่ม `KAMPAI.goHome()`, และ **ห้ามมี `submitScore`** (สื่อการสอนไม่ใช่เกมแข่งขัน)
- **Classroom-First Truth:** ตรวจสอบผ่าน HTTP/browser จริงที่ 360×800 (มือถือ) และ 1280×720 (จอห้องเรียน); Touch targets $\ge 44\times 44\text{px}$; Zero horizontal overflow
- **Authentic Literature Content:** ห้ามแต่งบทร้อยกรองปลอมขึ้นมาเอง; ต้องใช้บทอาขยานและบทกลอนแท้จากหนังสือเรียนวรรณคดีลำนำ ชั้น ป.4 ครบทั้ง 7 บทตามสารบัญ
- **No Autoplay Audio:** เสียงอ่านบทกลอนและคำแปลต้องเริ่มจากการกดปุ่มของผู้ใช้เท่านั้น (User gesture) และหยุดทันทีเมื่อเปลี่ยนบทหรือเปลี่ยนโหมด

---

## Review Focus

1. **Chapter Navigation & State Isolation:** เมื่อผู้ใช้เปลี่ยนบทเรียน (เช่น จากบทที่ ๑ ไปบทที่ ๒) ต้องรีเซ็ตสถานะการแสดงผล คำแปล และยกเลิกเสียงอ่าน TTS ที่กำลังเล่นอยู่ทันที ไม่ให้อ่านค้างหรือเสียงซ้อนทับกัน
2. **Interactive Vocabulary Tooltip/Popover on Mobile:** การแตะคำศัพท์ยากในวรรคกลอนบนหน้าจอมือถือ (360×800) ต้องเปิด Popover แสดงคำอ่านและความหมายที่ไม่ล้นออกนอกขอบจอ (Viewport bounding check) และสามารถปิดได้ง่ายโดยการแตะซ้ำหรือแตะพื้นที่ว่าง
3. **Parallel Translation Sync & Toggle:** ในโหมดอ่านกลอน เมื่อเปิดฟังก์ชัน "แสดงคำแปล" กล่องถอดความต้องวางคู่ขนานกับวรรคกลอนอย่างตรงบรรทัด และเมื่อปิดคำแปล บทกลอนต้องกลับมาแสดงในรูปแบบฉันทลักษณ์ที่อ่านง่าย
4. **Speech Synthesis Graceful Fallback:** กรณีที่เบราว์เซอร์หรืออุปกรณ์ไม่รองรับภาษาไทยใน Web Speech API (`th-TH`) ระบบต้องแสดงข้อความคำแปลบนหน้าจออย่างสมบูรณ์โดยไม่เกิด JavaScript Runtime Crash และมีป้ายกำกับบอกสถานะเสียงอย่างสุภาพ
5. **Print Worksheet A4 Clean Layout:** หน้าใบงานพิมพ์ (`wannakhadi-p4-media-worksheet.html`) ต้องจัดหน้าแบบ A4 พอดี 1-2 หน้า ไม่ตกขอบ ไม่มีปุ่มควบคุมบนเว็บติดไปในหน้าพิมพ์ และมีช่องลงชื่อ/คะแนนตามมาตรฐาน `WORKSHEET.md`

---

## Chapter Content Mapping (อ้างอิงจากภาพสารบัญทั้ง 2 ภาพ)

| บทที่ | ชื่อบทในสารบัญ | วรรณคดีต้นฉบับ / ผู้แต่ง | คำประพันธ์สำคัญในสื่อ | สาระสำคัญ / คุณค่า |
|---|---|---|---|---|
| **บทที่ ๑** | **การผจญภัยของสุดสาคร** (หน้า ๑) | นิทานคำกลอน เรื่อง *พระอภัยมณี* (สุนทรภู่) | บทอาขยานบทหลัก: ตอนสุดสาครเข้าเมืองการะเวก (*"บัดเดี๋ยวดังหง่างเหง่งวังเวงแว่ว... แล้วสอนว่าอย่าไว้ใจมนุษย์..."*) | การเตือนสติไม่ให้ไว้ใจคนแปลกหน้า, การพึ่งพาตนเอง, และการมีความกตัญญู |
| **บทที่ ๒** | **น้ำผึ้งหยดเดียว** (หน้า ๕๔) | นิทานเทียบสุภาษิต (*น้ำผึ้งหยดเดียวก่อเหตุ*) | นิทานร้อยแก้วเทียบสุภาษิต & กลอนสุภาษิตสอนใจ (*"น้ำผึ้งหยดเดียวพาเรื่องลุกลาม..."*) | เรื่องเล็กน้อยหากขาดสติ อาจลุกลามเป็นศึกใหญ่พินาศทั้งเมือง |
| **บทที่ ๓** | **ระบำสายฟ้า** (หน้า ๗๒) | บทเห่กล่อมพระบรรทม เรื่อง *จับระบำ* (สุนทรภู่) | กาพย์เห่กล่อม/บทกลอนจับระบำ (*"เมขลากล้าหาญ ล่อแก้วแววไว... รามสูรเห็นแก้ว สว่างแวววาบวับ..."*) | ตำนานพื้นบ้านอธิบายปรากฏการณ์ฟ้าแลบ ฟ้าร้อง ฟ้าผ่า อย่างไพเราะ |
| **บทที่ ๔** | **เรื่องเล่าจากพัทลุง** (หน้า ๙๐) | บทละคร เรื่อง *เงาะป่า* (พระราชนิพนธ์ ร.๕) | กลอนบทละคร: ตอนคะนังและไม้ไผ่ออกเที่ยวป่าล่าสัตว์ (*"เมื่อนั้น คะนังไม้ไผ่ใจกล้าหาญ..."*) | วิถีชีวิตธรรมชาติของเด็กชาวซาไก มิตรภาพ ความสามัคคี และการสังเกตธรรมชาติ |
| **บทที่ ๕** | **ดวงจันทร์ของลำเจียก** (หน้า ๑๒๐) | *นิราศเดือน* (นายมี) & เพลงกล่อมชมจันทร์ | กลอนนิราศ: บทชมจันทร์วันเพ็ญเดือนสิบสอง & บทราหูอมจันทร์ (*"เดือนสิบสองล่องลอยกระทงหลวง..."*) | ความงดงามของคืนวันเพ็ญ ประเพณีไทย และนิทานพื้นบ้านเรื่องราหูอมจันทร์ |
| **บทที่ ๖** | **คมความคิด** (หน้า ๑๔๒) | 1) โคลงพฤษภกาสร (*กฤษณาสอนน้องคำฉันท์*)<br>2) กลอนสุภาพ *ปากเป็นเอก เลขเป็นโท หนังสือเป็นตรี ชั่วดีเป็นตรา* (ท่านผู้หญิงสมโรจน์ สวัสดิกุลฯ) | 1) โคลงโลกนิติ/กฤษณาสอนน้อง: *"พฤษภกาสร อีกกุญชรอันปลดปลง..."*<br>2) กลอนสุภาพ: *"ปากเป็นเอกเหมือนเสกมนตร์ให้คนเชื่อ..."* | คุณค่าของการทำความดีที่คงอยู่หลังความตาย, ความสำคัญของวาจา การคิดคำนวณ ความรู้ และคุณธรรม |
| **บทที่ ๗** | **เที่ยวเมืองพระร่วง** (หน้า ๑๖๔) | 1) บทอาขยานบทหลัก: พระราชนิพนธ์ *สยามานุสสติ* (ร.๖)<br>2) บทอาขยานบทเลือก: *ไทยรวมกำลังตั้งมั่น* (ร.๖) | 1) โคลงสี่สุภาพ: *"ใครรานใครรุกด้าว แดนไทย..."*<br>2) กลอนปลุกใจ: *"ไทยรวมกำลังตั้งมั่น..."* | ความรักชาติ ความเสียสละเพื่อแผ่นดิน ความเป็นน้ำหนึ่งใจเดียวกัน และประวัติศาสตร์สุโขทัย |

---

### Task 1: Literature Dataset & Verification Tests for All 7 Chapters

**Files:**
- Create: `public/games/thai/assets/wannakhadi-p4/wannakhadi-data.js`
- Create: `tests/thai-subject/wannakhadi-p4-data.test.mjs`

**Interfaces:**
- Produces: `window.WANNAKHADI_P4_DATA` with 7 chapters containing:
  ```ts
  interface VocabularyItem {
    word: string;
    reading: string;
    pos: 'นาม' | 'กริยา' | 'วิเศษณ์' | 'สรรพนาม' | 'บุพบท';
    meaning: string;
    example: string;
  }

  interface VerseStanza {
    stanzaIndex: number;
    meter: 'กลอนสุภาพ' | 'กลอนบทละคร' | 'กาพย์เห่กล่อม' | 'โคลงสี่สุภาพ' | 'ร้อยแก้วเทียบสุภาษิต';
    lines: Array<{
      role: 'สดับ' | 'รับ' | 'รอง' | 'ส่ง' | 'บาท๑' | 'บาท๒' | 'บาท๓' | 'บาท๔' | 'เนื้อความ';
      text: string;
      segments: string[]; // จังหวะการอ่าน เช่น ["บัดเดี๋ยวดัง", "หง่างเหง่ง", "วังเวงแว่ว"]
    }>;
    translation: string; // คำแปลถอดความเป็นภาษาง่ายสำหรับเด็ก ป.4
    vocabKeywords: string[]; // คำศัพท์ยากที่ปรากฏในบทนี้
  }

  interface ChapterData {
    id: string; // e.g. "ch1-sud-sakorn"
    chapterNum: number; // 1 - 7
    title: string;
    sourceWork: string;
    author: string;
    category: string;
    moralLesson: string;
    summary: string;
    stanzas: VerseStanza[];
    vocabularies: VocabularyItem[];
    practiceQuizzes: Array<{
      id: string;
      type: 'translate-match' | 'vocab-meaning' | 'rhyme-sequence';
      question: string;
      options: string[];
      answerIndex: number;
      explanation: string;
    }>;
  }
  ```

- [ ] **Step 1: Write the failing test for the dataset**

Create `tests/thai-subject/wannakhadi-p4-data.test.mjs` with assertions:
1. `public/games/thai/assets/wannakhadi-p4/wannakhadi-data.js` exists and loads cleanly in Node.
2. Contains exactly 7 chapters matching the table of contents in the images (`ch1-sud-sakorn`, `ch2-nam-phueng`, `ch3-rabaam-saifah`, `ch4-ngao-pa`, `ch5-duang-jan`, `ch6-khom-khwam-khit`, `ch7-mueang-phra-ruang`).
3. Each chapter contains authentic historical verses, word-by-word/stanza-by-stanza translations, at least 5 vocabulary items with readings and meanings, and at least 3 practice questions.
4. No placeholder strings (such as "Lorem ipsum", "ทดสอบ", "รอดำเนินการ", "TBD").

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/thai-subject/wannakhadi-p4-data.test.mjs`
Expected: FAIL with "Cannot find module" or missing file.

- [ ] **Step 3: Implement `wannakhadi-data.js` with complete educational content**

Write `public/games/thai/assets/wannakhadi-p4/wannakhadi-data.js` with:
- บทที่ ๑: กลอนพระอภัยมณี ตอน สุดสาครเข้าเมืองการะเวก (8 บทเต็ม พร้อมแบ่งวรรค ๓-๒-๓ และแปลถอดความ) + ศัพท์ เช่น หง่างเหง่ง, วังเวง, โยคี, บรรพต, สองสถาน, เจรจา
- บทที่ ๒: นิทานเทียบสุภาษิตน้ำผึ้งหยดเดียวก่อเหตุ + สุภาษิตสอนใจ + ศัพท์ เช่น โกลาหล, ระงับเหตุ, อธิกรณ์, ปรึกษาหารือ
- บทที่ ๓: บทเห่กล่อมจับระบำ เมขลา-รามสูร + ศัพท์ เช่น เมขลา, รามสูร, อสูร, วาววับ, ขวานเพชร, บรรทม
- บทที่ ๔: บทละครเงาะป่า คะนังและไม้ไผ่ + ศัพท์ เช่น ทับ, รโหฐาน, พงไพร, ดงดอน, สกุณา, ซุมเปาะ, พนา
- บทที่ ๕: นิราศเดือนและราหูอมจันทร์ + ศัพท์ เช่น นิราศ, วันเพ็ญ, ราหู, จันทรุปราคา, หฤทัย, อัมพร
- บทที่ ๖: โคลงพฤษภกาสร & กลอนปากเป็นเอก เลขเป็นโทฯ + ศัพท์ เช่น พฤษภ, กาสร, กุญชร, โททนต์, นรชาติ, อินทรีย์, ปรีชาฉาน, สังวรณ์
- บทที่ ๗: โคลงสยามานุสสติ & ไทยรวมกำลังตั้งมั่น + ศัพท์ เช่น ราน, รุก, ด้าว, ขาดดิ้น, ไป่, สยาม, ยืนยง, มอดม้วย

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/thai-subject/wannakhadi-p4-data.test.mjs`
Expected: PASS with 7 valid chapters verified.

- [ ] **Step 5: Commit dataset & tests**

```bash
git add public/games/thai/assets/wannakhadi-p4/wannakhadi-data.js tests/thai-subject/wannakhadi-p4-data.test.mjs
git commit -m "feat(thai): add authentic Wannakhadi Lamnam P4 poetry and translation dataset"
```

---

### Task 2: Interactive Media UI & Parallel Translation View (`wannakhadi-p4-media.html`)

**Files:**
- Create: `public/games/thai/wannakhadi-p4-media.html`
- Create: `tests/thai-subject/wannakhadi-p4-media-contract.test.mjs`

**Interfaces:**
- Implements: Teaching Media Contract (MEDIA_SLUG, `learn` mode, `practice` mode, `KAMPAI.goHome`, zero `submitScore`).
- Consumes: `/games/kampai-sdk.js`, `assets/wannakhadi-p4/wannakhadi-data.js`.
- Controls:
  - Header: Back to Hub (`KAMPAI.goHome`), Title "สื่อแปลกลอนสุภาพ วรรณคดีลำนำ ป.4", Grade Badge "ป.4 · ภาษาไทย"
  - Mode Switcher Toolbar: `📖 เรียนรู้ & แปลกลอน` (learn), `🔍 คลังคำศัพท์`, `✏️ ฝึกถอดความ` (practice), `⛶ เต็มจอ`, `📝 เปิดใบงาน`
  - Chapter Navigation: Tab/Drawer list for Chapters 1 to 7
  - Translation Display Switch: "แสดงคำแปลภาษาเด็ก" (On/Off toggle)
  - Rhythm Highlighter: ปุ่มเปิดไฮไลต์จังหวะการอ่าน (เช่น `๓-๒-๓`)
  - Audio Player: ปุ่ม `🔊 ฟังเสียงอ่านกลอน` และ `🎧 ฟังเสียงแปลถอดความ` (ใช้ `KAMPAI.sound.speak` พร้อม cancel speech เมื่อเปลี่ยนบท)
  - Vocabulary Tooltip: คลิกคำศัพท์ที่ขีดเส้นใต้ประเพื่อแสดงกล่องความหมาย

- [ ] **Step 1: Write media contract test**

Create `tests/thai-subject/wannakhadi-p4-media-contract.test.mjs` asserting:
1. `public/games/thai/wannakhadi-p4-media.html` contains `MEDIA_SLUG = 'wannakhadi-p4-media'`.
2. Has `data-mode="learn"` and `data-mode="practice"`.
3. Does NOT contain `submitScore` (complies with `MEDIA.md`).
4. Contains `<meta name="kampai-content-kind" content="teaching-media">`.
5. Contains Sarabun font and Light-only semantic variables.
6. Passes `scripts/verify-media.mjs`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/thai-subject/wannakhadi-p4-media-contract.test.mjs`
Expected: FAIL (file does not exist).

- [ ] **Step 3: Implement `wannakhadi-p4-media.html`**

Construct the HTML file with:
- Proper styling with CSS custom properties (Navy `#1e3a8a`, Gold `#f59e0b`, Amber `#d97706`, Paper `#fffdf7`, Slate `#334155`).
- Sidebar/Tab navigation for 7 chapters.
- Stanza render engine:
  - Stanza title & rhyme meter badge.
  - Interactive lines with highlighted rhyming syllables and rhythm brackets.
  - Parallel translation block (Side-by-side on wide screens $\ge 1024\text{px}$, stacked accordion on mobile $< 768\text{px}$).
  - Inline vocabulary tags with data attributes for click-to-view meaning popover.
- Responsive layout with touch-friendly buttons ($\ge 44\times 44\text{px}$) and clear WCAG AA contrast.
- Speech synthesis handler with clean cancel on navigation:
  ```js
  function speakVerse(text) {
    if (window.KAMPAI && KAMPAI.sound && KAMPAI.sound.speak) {
      KAMPAI.sound.speak(text, 'th');
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'th-TH';
      u.rate = 0.85; // ท่วงทำนองช้าชัดเจนสำหรับเด็กประถม
      window.speechSynthesis.speak(u);
    }
  }
  ```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/thai-subject/wannakhadi-p4-media-contract.test.mjs`
Expected: PASS.

- [ ] **Step 5: Run repository verify script**

Run: `pnpm verify:media public/games/thai/wannakhadi-p4-media.html`
Expected: PASS (checks 1, 3, 7, 9 + media contract: slug, learn, practice, no submitScore).

- [ ] **Step 6: Commit media core implementation**

```bash
git add public/games/thai/wannakhadi-p4-media.html tests/thai-subject/wannakhadi-p4-media-contract.test.mjs
git commit -m "feat(thai): implement Wannakhadi Lamnam P4 poetry translator interactive media"
```

---

### Task 3: Vocabulary Explorer & Non-Competitive Practice Modules

**Files:**
- Modify: `public/games/thai/wannakhadi-p4-media.html`
- Create: `tests/thai-subject/wannakhadi-p4-practice.test.mjs`

**Interfaces:**
- Consumes: `window.WANNAKHADI_P4_DATA` (vocabularies and practiceQuizzes).
- Produces:
  - **Mode 2: Vocabulary Explorer:**
    - Search input field to filter words across all 7 chapters.
    - Category filter chips (คำโบราณ, สัตว์ในวรรณคดี, กริยาท่าทาง, ธรรมชาติ).
    - Flip cards or detail dialog with pronunciation, word type, meaning, and contextual sentence from the poem.
  - **Mode 3: Practice & Meaning Challenge:**
    - Non-competitive, growth-mindset quiz engine (no timer, no lives deduction, no score submission).
    - 3 activity types:
      1. *ถอดความวรรคทอง:* เลือกว่าบทกลอนที่กำหนดหมายความว่าอย่างไร
      2. *ค้นหาคำศัพท์โบราณ:* จับคู่คำศัพท์กับความหมายที่ถูกต้อง
      3. *เรียงสัมผัสกลอน:* เรียงวรรค ๔ วรรค (สดับ รับ รอง ส่ง) ให้ถูกต้องตามสัมผัส
    - Immediate constructive feedback with explanations for both correct and incorrect choices, allowing students to retry without penalty.

- [ ] **Step 1: Write practice engine unit test**

Create `tests/thai-subject/wannakhadi-p4-practice.test.mjs` asserting:
1. All 7 chapters have valid practice quizzes without null answers.
2. The quiz engine provides retry capabilities on incorrect answers.
3. Audio feedback handles both correct and retry states politely.
4. Filter and search mechanisms return expected word matches.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/thai-subject/wannakhadi-p4-practice.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement Vocabulary Explorer and Practice Engine in `wannakhadi-p4-media.html`**

Add the interactive JavaScript components:
- `renderVocabTab()`: dynamically builds the vocabulary catalog with live instant search and chapter filtering.
- `renderPracticeTab()`: renders questions, manages selection state, displays educational explanations, and triggers celebratory sounds on success without game-over states.
- Clean cleanup listeners when switching tabs.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/thai-subject/wannakhadi-p4-practice.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit practice & vocabulary features**

```bash
git add public/games/thai/wannakhadi-p4-media.html tests/thai-subject/wannakhadi-p4-practice.test.mjs
git commit -m "feat(thai): add vocabulary explorer and non-competitive practice modes to Wannakhadi media"
```

---

### Task 4: Printable Companion Worksheet (`wannakhadi-p4-media-worksheet.html`)

**Files:**
- Create: `public/games/thai/wannakhadi-p4-media-worksheet.html`
- Create: `tests/thai-subject/wannakhadi-p4-worksheet.test.mjs`

**Interfaces:**
- Implements: `WORKSHEET.md` standards:
  - Sheet title: "ใบงานภาษาไทย ป.4: ถอดความวรรณคดีและแปลกลอนสุภาพ (วรรณคดีลำนำ)"
  - Metadata: `worksheet_key = 'wannakhadi-p4-media-worksheet'`, `worksheet-source-media = '/games/thai/wannakhadi-p4-media.html'`
  - Clean A4 CSS `@media print` rules (`@page { size: A4 portrait; margin: 12mm; }`)
  - Staff selector & header bar (using `/games/worksheet-runtime.js`)
  - 3 structured learning sections:
    1. ตอนที่ ๑: ถอดความคำประพันธ์จากบทอาขยานสำคัญ (สุดสาคร / พฤษภกาสร / ปากเป็นเอก)
    2. ตอนที่ ๒: โยงเส้นจับคู่คำศัพท์ยากในวรรณคดีกับความหมาย
    3. ตอนที่ ๓: วิเคราะห์ข้อคิดและคุณค่าที่ได้รับจากวรรณคดีนำไปใช้ในชีวิตจริง

- [ ] **Step 1: Write worksheet verifier test**

Create `tests/thai-subject/wannakhadi-p4-worksheet.test.mjs` asserting:
1. `public/games/thai/wannakhadi-p4-media-worksheet.html` exists.
2. Contains print CSS `@media print` and `@page` rules.
3. Includes `worksheet-runtime.js` and standard student metadata inputs (ชื่อ-นามสกุล, เลขที่, ชั้น).
4. References the media companion URL.
5. Passes `pnpm verify:worksheet`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/thai-subject/wannakhadi-p4-worksheet.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Implement `wannakhadi-p4-media-worksheet.html`**

Write standard, print-optimized HTML following `WORKSHEET.md`:
- High contrast, crisp vector borders, zero black-box printing artifacts.
- Questions covering:
  - การแปลกลอนบทอาขยาน "แล้วสอนว่าอย่าไว้ใจมนุษย์..."
  - การจับคู่คำศัพท์: กาสร, กุญชร, โยคี, บรรพต, สยามานุสสติ, เมขลา
  - การเขียนสรุปข้อคิดจากนิทานเทียบสุภาษิต "น้ำผึ้งหยดเดียวก่อเหตุ"
- Print button `🖨️ พิมพ์ใบงาน (A4)` with clean print preview.

- [ ] **Step 4: Run worksheet verification**

Run: `pnpm verify:worksheet public/games/thai/wannakhadi-p4-media-worksheet.html`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit worksheet implementation**

```bash
git add public/games/thai/wannakhadi-p4-media-worksheet.html tests/thai-subject/wannakhadi-p4-worksheet.test.mjs
git commit -m "feat(thai): add companion printable A4 worksheet for Wannakhadi P4 media"
```

---

### Task 5: 16:9 Cover Artwork & Database Registration Migration

**Files:**
- Create: `public/games/thai/wannakhadi-p4-media-cover.png` (1280×720 pixels, 16:9)
- Create: `supabase/migrations/588_seed_wannakhadi_p4_media.sql`
- Create: `tests/thai-subject/wannakhadi-p4-catalog.test.mjs`

**Interfaces:**
- Produces:
  - 16:9 1280×720 Cover image containing bilingual titles: "สื่อแปลกลอนสุภาพ วรรณคดีลำนำ ป.4 / Wannakhadi Lamnam Thai Poetry", chibi characters (สุดสาคร ม้านิลมังกร เมขลา รามสูร) within the 60% safe zone.
  - SQL migration `588_seed_wannakhadi_p4_media.sql` registering:
    - `educational_hub_items` (`item_type = 'link'`, `subject = 'ภาษาไทย'`, `grade_levels = ARRAY['ป.4']`, `tracked_game = false`)
    - `indicator_games` linking indicators `ท 1.1 ป.4/1`, `ท 1.1 ป.4/2`, `ท 5.1 ป.4/1`, `ท 5.1 ป.4/3`
    - `game_docs` describing features, format, version `v1.0.0`, and pedagogical goals.

- [ ] **Step 1: Write catalog and cover assertion test**

Create `tests/thai-subject/wannakhadi-p4-catalog.test.mjs` asserting:
1. Cover image exists at `public/games/thai/wannakhadi-p4-media-cover.png`.
2. Image width is 1280 and height is 720 (16:9 aspect ratio).
3. Migration file `supabase/migrations/588_seed_wannakhadi_p4_media.sql` exists and contains required upserts for `educational_hub_items`, `indicator_games`, and `game_docs`.

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test tests/thai-subject/wannakhadi-p4-catalog.test.mjs`
Expected: FAIL.

- [ ] **Step 3: Generate 16:9 cover image & write migration 588**

1. Create high-resolution SVG/Canvas template with clean chibi characters and bubble typography, then rasterize to 1280×720 PNG via `sharp` or `scripts/make-cover.mjs`.
2. Write `supabase/migrations/588_seed_wannakhadi_p4_media.sql` following the structure of migration 496.

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test tests/thai-subject/wannakhadi-p4-catalog.test.mjs`
Expected: PASS.

- [ ] **Step 5: Run full media verification**

Run: `pnpm verify:media public/games/thai/wannakhadi-p4-media.html`
Expected: PASS (All checks passing including Check 9 cover 16:9).

- [ ] **Step 6: Commit cover and migration**

```bash
git add public/games/thai/wannakhadi-p4-media-cover.png supabase/migrations/588_seed_wannakhadi_p4_media.sql tests/thai-subject/wannakhadi-p4-catalog.test.mjs
git commit -m "feat(thai): add 16:9 cover image and hub registration migration 588 for Wannakhadi media"
```

---

### Task 6: Real-Screen Classroom Viewport Audit & Production Verification

**Files:**
- Modify: `public/games/thai/wannakhadi-p4-media.html` (if any viewport adjustments are needed)
- Modify: `src/components/admin/system/SystemOverview.tsx` (add entry in `versionHistory`)
- Create: `tests/thai-subject/wannakhadi-p4-e2e-viewport.test.mjs`

**Interfaces:**
- Audits:
  - 360×800 (Mobile Phone Viewport): Stacked layout, no horizontal scroll, readable font size $\ge 16\text{px}$, tap targets $\ge 44\text{px}$.
  - 768×1024 (Tablet Viewport): Balanced 2-column or drawer layout.
  - 1280×720 (Classroom Projector Fullscreen): Large, readable text for classroom presentation, parallel translation side-by-side, unobstructed touch/click controls.
- Documentation:
  - Add version update in `src/components/admin/system/SystemOverview.tsx` under `versionHistory` according to `AGENTS.md` Rule 14.9.

- [ ] **Step 1: Write viewport and responsive smoke test**

Create `tests/thai-subject/wannakhadi-p4-e2e-viewport.test.mjs` testing layout constraints and absence of overflow elements across all 7 chapters.

- [ ] **Step 2: Run viewport smoke test**

Run: `node --test tests/thai-subject/wannakhadi-p4-e2e-viewport.test.mjs`
Expected: PASS.

- [ ] **Step 3: Update `SystemOverview.tsx` version history**

Prepend new version release entry in `versionHistory` in `src/components/admin/system/SystemOverview.tsx`:
```tsx
{
  version: 'v1.182.0',
  date: '16 พ.ย. 2569',
  title: 'สื่อแปลกลอนสุภาพ วรรณคดีลำนำ ป.4 (7 บทเรียน)',
  description: 'เปิดตัวสื่อการเรียนรู้วรรณคดีลำนำ ชั้น ป.4 พร้อมระบบถอดคำประพันธ์รายวรรค คลังคำศัพท์ยากพร้อมป๊อปอัปความหมาย เสียงอ่านคำกลอนและคำแปล TTS โหมดฝึกทักษะ และใบงานพิมพ์ A4',
  tag: 'Media'
}
```

- [ ] **Step 4: Run production build check**

Run: `pnpm build`
Expected: Vite production build succeeds with exit code 0.

- [ ] **Step 5: Commit documentation and system update**

```bash
git add src/components/admin/system/SystemOverview.tsx tests/thai-subject/wannakhadi-p4-e2e-viewport.test.mjs
git commit -m "docs(system): register Wannakhadi P4 poetry translator media in version history"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** ครอบคลุมทั้ง 7 บทตามภาพถ่ายสารบัญ (สุดสาคร, น้ำผึ้งหยดเดียว, ระบำสายฟ้า, เงาะป่า, นิราศเดือน, คมความคิด/พฤษภกาสร/ปากเป็นเอก, เที่ยวเมืองพระร่วง/สยามานุสสติ) มีระบบแปลกลอน คลังคำศัพท์ เสียงอ่าน TTS แบบฝึกหัด และใบงาน A4
- [x] **Step scan:** ทุกขั้นตอนมีคำสั่งทดสอบ (Run command) และผลลัพธ์ที่คาดหวัง (Expected output) ชัดเจน ทำตามได้ทีละคำสั่ง
- [x] **Type consistency:** โครงสร้างข้อมูล `window.WANNAKHADI_P4_DATA` สอดคล้องกันตลอดทุก Task ทั้งชื่อพร็อพเพอร์ตี้และชนิดข้อมูล
- [x] **Review Focus:** ครอบคลุมจุดเสี่ยงสำคัญทั้ง 5 ประการ (State Isolation เมื่อเปลี่ยนบท, Mobile Viewport Popover, Parallel Sync Toggle, TTS Fallback, A4 Print Clean Layout)
- [x] **Proportion:** แผนกระชับ ชัดเจน มีสเปกและขั้นตอนการทำงานครบถ้วนโดยไม่เยิ่นเย้อ
