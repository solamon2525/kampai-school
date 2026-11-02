# Thai Vocab Hub 3-Dimensional Evolution Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** ยกระดับสื่อการเรียนรู้ Thai Vocab Hub (https://kampai-school.vercel.app/games/thai/thai-vocab-hub/index.html) ให้กลายเป็นแพลตฟอร์มการสอนภาษาไทยชั้นนำ ครอบคลุม 3 มิติหลัก: มิติรูปแบบการเรียนรู้ (Active Learning & Spaced Repetition), มิติการจัดการเรียนการสอนในห้องเรียน (Classroom Projector Mode, Random Spinner, Team Battle, Instant Printable Worksheet), และมิติคลังคำศัพท์มาตรฐาน 2,400 คำ (Grade-level tagging ป.4-6, Parts of Speech, Contextual Sentences).

**Architecture:** สถาปัตยกรรมแบบ 5-File Vanilla Web Game (`index.html`, `style.css`, `config.js`, `data.js`, `game.js`) ภายใต้ Kampai Game SDK รองรับทั้งโหมดใช้งานบนอุปกรณ์ส่วนตัวของนักเรียน (Mobile/Tablet) และโหมดฉายจอห้องเรียนสำหรับครู (Big-Screen Projector / Smartboard) พร้อมโมดูลสร้างใบงาน A4 สั่งพิมพ์ได้ในคลิกเดียว.

**Tech Stack:** Vanilla JavaScript (ES6+), HTML5, CSS3 Custom Properties (Light-mode only), Web Speech API (Thai TTS), Canvas API, Kampai Game SDK (`/games/kampai-sdk.js`), Kampai Worksheet Runtime.

**Spec:** เอกสารสเปกการปฏิรูปสื่อการเรียนรู้ภาษาไทยตามเกณฑ์ Classroom-First Product Rules (AGENTS.md) และคู่มือ GAME.md / WORKSHEET.md.

---

## Global Constraints

- **5-File Architecture:** ห้ามใช้ ES Modules (`import`/`export`) ในไฟล์ของเกม; โหลดผ่าน `<script>` ตามลำดับ `config.js` -> `data.js` -> `game.js`.
- **Light-Mode Only:** ห้ามมี `bg-white`, `text-black` หรือ hardcoded hex colors ใน selector; ใช้ CSS Variables (`--primary`, `--background`, `--card`, `--text-main`, `--border`) เสมอ.
- **Classroom-First & Real-Screen Truth:** ทดสอบบนวิวพอร์ตจริง 360×800 (มือถือเด็ก), 1024×768 (แท็บเล็ตครู), และ 1280×720 / 1920×1080 (โปรเจกเตอร์ห้องเรียน) โดยต้องไม่มีข้อความล้นหรือ layout thrashing.
- **Child Cognitive Pacing:** จังหวะการประมวลผลและการแสดงผลต้องเป็นมิตรกับเด็ก K-6 ไม่เร่งรีบจนเกิด Cognitive Overload.
- **No-Spoiler Labels:** การ์ดคำศัพท์ต้องไม่ติดป้ายเฉลยคุณสมบัติไว้ล่วงหน้า.
- **Local Verification Gate:** ต้องผ่าน `pnpm validate:vocab --strict` และ `pnpm verify:game:all -- public/games/thai/thai-vocab-hub` ทุกครั้งก่อนส่งมอบงาน.

---

## Review Focus

1. **Grade-Level Filter Integrity:** นักเรียนชั้น ป.4 ต้องไม่ถูกสุ่มเจอคำศัพท์ระดับยากของ ป.6 เว้นแต่เลือกโหมดท้าทายทุกระดับชั้น.
2. **Classroom Projector Legibility:** ตัวหนังสือคำศัพท์ในโหมด Projector ต้องมีขนาด $\ge 48\text{px}$ อ่านได้ชัดเจนจากระยะห่าง 5–8 เมตรในห้องเรียน.
3. **Print Layout Pagination:** ใบงานเขียนตามคำบอก A4 ที่สร้างขึ้นต้องพอดี 1 แผ่นถ้วน ไม่แตกหน้า และมีช่องลงชื่อ/คะแนนตามมาตรฐานราชการ.
4. **Thai TTS Naturalness:** เสียงอ่านสังเคราะห์ต้องออกเสียงควบกล้ำและวรรณยุกต์ถูกต้อง โดยมี fallback เป็นการสะกดคำอ่านตามพยางค์เมื่อเสียงเบราว์เซอร์ไม่ชัด.
5. **DOM Reflow Performance:** การสลับโหมดและเปลี่ยนการ์ดต้องไม่ทำให้เฟรมเรตตกต่ำกว่า 60 FPS โดยไม่มี Forced Synchronous Layout ในลูป.

---

## Task Breakdown

### Task 1: Enrich Vocabulary Dataset Architecture (มิติคลังคำศัพท์)
**Files:**
- Modify: `public/games/thai/thai-vocab-hub/data/words/*.json`
- Modify: `scripts/build-vocab.mjs`
- Test: `scripts/validate-vocab.mjs`

- [ ] **Step 1: กำหนด Schema ส่วนขยายของคลังคำศัพท์**
  เพิ่มฟิลด์ `grade` (`4` | `5` | `6`), `pos` (`noun` | `verb` | `adj` | `adv`), และ `example` (ตัวอย่างประโยคบริบท) ใน metadata ของคำศัพท์ทั้ง 16 หมวด
- [ ] **Step 2: อัปเดต `scripts/validate-vocab.mjs`**
  เพิ่มการตรวจสอบว่าทุกคำต้องมีระดับชั้น `grade` ที่ถูกต้อง และตัวอย่างประโยคต้องมีคำศัพท์นั้นปรากฏอยู่จริง
- [ ] **Step 3: ปรับปรุง `scripts/build-vocab.mjs` และคอมไพล์ `data.js`**
  รัน `pnpm build:vocab` เพื่อสร้าง `public/games/thai/thai-vocab-hub/data.js` รุ่นสมบูรณ์
- [ ] **Step 4: ทดสอบ Dataset Integrity**
  รัน `pnpm validate:vocab --strict` ให้ผ่าน 100% ปราศจากข้อผิดพลาด

---

### Task 2: Leitner Spaced Repetition & Mastery Learning Mode (มิติรูปแบบการเรียน)
**Files:**
- Modify: `public/games/thai/thai-vocab-hub/index.html`
- Modify: `public/games/thai/thai-vocab-hub/style.css`
- Modify: `public/games/thai/thai-vocab-hub/game.js`

- [ ] **Step 1: ระบบ Spaced Repetition (กล่องทบทวน 3 ระดับ Leitner System)**
  - กล่อง 1 (กำลังเรียนรู้ - โผล่มาบ่อย)
  - กล่อง 2 (เริ่มจำได้ - เว้นระยะ)
  - กล่อง 3 (แม่นยำแล้ว - บันทึก Mastery)
- [ ] **Step 2: เพิ่มการแสดงตัวอย่างประโยคและบริบทบนหลังการ์ดคำศัพท์**
  เมื่อพลิกการ์ด (Flip) นอกจากคำอ่านและความหมาย ให้แสดงตัวอย่างประโยคจริงพร้อมไฮไลต์คำศัพท์
- [ ] **Step 3: ตัวกรองระดับชั้น (Grade Filter: ป.4 / ป.5 / ป.6 / ทั้งหมด)**
  เพิ่ม Dropdown/Segmented Control ในหน้าเลือกหมวด ให้เด็กเลือกฝึกเฉพาะระดับชั้นของตนเองได้
- [ ] **Step 4: บันทึกความก้าวหน้าลงใน `localStorage` แยกตามหมวดและระดับชั้น**
  เก็บคะแนนความเชี่ยวชาญ (Mastery %) และแถบแสดงความคืบหน้า (Progress Bar) ต่อหมวดหมู่

---

### Task 3: Classroom Big-Screen Projector Mode (มิติรูปแบบการสอน 1)
**Files:**
- Modify: `public/games/thai/thai-vocab-hub/index.html`
- Modify: `public/games/thai/thai-vocab-hub/style.css`
- Modify: `public/games/thai/thai-vocab-hub/game.js`

- [ ] **Step 1: เพิ่มปุ่มสลับ "โหมดจอใหญ่ห้องเรียน (Projector Mode)"**
  เพิ่มปุ่มรูป 📽️ ฉายจอห้องเรียน บนแถบเครื่องมือหลัก
- [ ] **Step 2: เลย์เอาต์และ Typography พิเศษสำหรับจอใหญ่**
  - ซ่อนองค์ประกอบ UI ที่ไม่จำเป็น (ปุ่มย่อย, แถบเมนูจิปาถะ)
  - ขยายฟอนต์คำศัพท์หลักขึ้นเป็น $48\text{px} - 72\text{px}$
  - จัดการ์ดไว้กึ่งกลางจออย่างสง่างาม รองรับการคลิกด้วยปากกา Smartboard หรือแอร์เมาส์
- [ ] **Step 3: ปุ่มลัดคีย์บอร์ดสำหรับครูผู้สอน**
  - กด `Spacebar`: พลิกการ์ดดูความหมาย
  - กด `ลูกศร ขวา/ซ้าย`: ไปคำถัดไป / คำก่อนหน้า
  - กด `S`: เล่นเสียงอ่านภาษาไทย (TTS)
  - กด `F`: เปิด/ปิด Fullscreen

---

### Task 4: Interactive Classroom Tools: Spinner & Team Battle (มิติรูปแบบการสอน 2)
**Files:**
- Modify: `public/games/thai/thai-vocab-hub/index.html`
- Modify: `public/games/thai/thai-vocab-hub/style.css`
- Modify: `public/games/thai/thai-vocab-hub/game.js`

- [ ] **Step 1: โหมดวงล้อสุ่มคำศัพท์ (Word Spinner Wheel)**
  วงล้อสุ่มคำศัพท์ในหมวด สำหรับให้ครูกดหมุนเรียกสุ่มให้นักเรียนในห้องสะกดคำหรือบอกความหมาย พร้อมเอฟเฟกต์เสียงหมุนและพลุฉลอง
- [ ] **Step 2: โหมดแข่งขัน 2 ทีมหน้าชั้น (Classroom Team Battle Hot-Seat)**
  แบ่งหน้าจอเป็น 2 ฝั่ง (ทีมสีแดง 🔴 vs ทีมสีน้ำเงิน 🔵) แข่งตอบคำถามทายคำหรือเขียนสะกดคำเก็บแต้มสะสมบนจอเดียวกัน
- [ ] **Step 3: ปุ่มเสียงเอฟเฟกต์สนับสนุนการสอน**
  ปุ่มกดเสียงกระดิ่งถูกต้อง 🔔, เสียงตอบผิด ❌, เสียงปรบมือ 👏 ช่วยสร้างบรรยากาศสนุกสนานในห้องเรียน

---

### Task 5: 1-Click Instant Printable Worksheet Generator (มิติใบงานและการวัดผล)
**Files:**
- Modify: `public/games/thai/thai-vocab-hub/index.html`
- Modify: `public/games/thai/thai-vocab-hub/game.js`
- Create: `public/games/thai/thai-vocab-hub/worksheet-export.js`

- [ ] **Step 1: พัฒนาโมดูลส่งออกใบงานขนาด A4**
  สร้างเทมเพลตใบงานมาตรฐานโรงเรียนบ้านคำไผ่ 2 รูปแบบ:
  1. ใบงานเขียนตามคำบอก 10–20 ข้อ (Dictation Worksheet) พร้อมแผ่นเฉลยสำหรับครู
  2. ใบงานโยงเส้นจับคู่คำศัพท์กับความหมาย (Matching Worksheet)
- [ ] **Step 2: ปุ่ม "🖨️ พิมพ์ใบงานชุดนี้"**
  ในแต่ละหมวดคำศัพท์ ให้ครูกดปุ่มพิมพ์ใบงาน ระบบจะเปิดหน้าต่าง Print Preview พร้อมจัดหน้า A4 1 แผ่นถ้วนทันที
- [ ] **Step 3: ตรวจสอบความถูกต้องตาม WORKSHEET.md**
  ใช้ฟอนต์ Sarabun, มีช่องลงชื่อ/เลขที่/คะแนน, ไม่มีสีพื้นหลังเปลืองหมึกพิมพ์, และจัดหน้าพอดีเป๊ะ

---

### Task 6: Rigorous E2E, Performance & Quality Verification
**Files:**
- Create: `tests/e2e/thai-vocab-hub-evolution.spec.ts`

- [ ] **Step 1: รัน Vocabulary Strict Validator**
  ```bash
  pnpm validate:vocab --strict
  ```
- [ ] **Step 2: รัน Game Verification Suite**
  ```bash
  pnpm verify:game:all -- public/games/thai/thai-vocab-hub
  ```
- [ ] **Step 3: รันการทดสอบเบราว์เซอร์จริงด้วย Playwright**
  ทดสอบการทำงานของโหมดปกติ, โหมด Projector (1280×720), โหมดมือถือ (360×800), และการพิมพ์ใบงาน A4
- [ ] **Step 4: บันทึก System Overview & Deploy**
  อัปเดต `SystemOverview.tsx` และ commit พร้อม deploy ไปยัง `origin/main`
