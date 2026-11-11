# Original User Request

## Initial Request — 2026-09-17T15:33:17Z

Upgrade and transform 4 core English educational packages into comprehensive, audio-narrated, and visually engaging Learning Studios with synchronized A4 companion worksheets and 16:9 kid-friendly cover art for Primary School (K-6).

Working directory: d:/kampai-school-main
Integrity mode: development

## Target Educational Hub Packages (4 Items)

1. **Package 1: Sight Words — คำอ่านจำ ป.4**
   - Media: `public/games/english/sight-words-media.html`
   - Worksheet: `public/games/english/sight-words-worksheet.html`
   - Cover: `public/games/english/sight-words-media-cover.png` (1280×720)
   - Curriculum: ต 1.1 ป.4/2, ต 1.2 ป.4/1 (Fry/Dolch Grade 4 Sight Words)

2. **Package 2: Sight Words ป.1–3**
   - Media: `public/games/english/sight-words-p123-media.html`
   - Worksheet: `public/games/english/sight-words-p123-media-worksheet.html`
   - Cover: `public/games/english/sight-words-p123-media-cover.png` (1280×720)
   - Curriculum: ต 1.1 ป.1/2, ต 1.1 ป.2/2, ต 1.1 ป.3/2 (Foundational Sight Words & Phonics)

3. **Package 3: Grammar & Vocab — สอนและฝึกสั้น**
   - Media: `public/games/english/grammar-vocab-media.html`
   - Worksheet: `public/games/english/grammar-vocab-worksheet.html`
   - Cover: `public/games/english/grammar-vocab-media-cover.png` (1280×720)
   - Curriculum: ต 1.1 ป.4/1, ต 1.2 ป.4/1, ต 2.2 ป.4/1 (Verb to be, Articles, Pronouns, Helping Verbs)

4. **Package 4: Past Tense Mini — สอนและฝึกสั้น**
   - Media: `public/games/english/past-tense-mini-media.html`
   - Worksheet: `public/games/english/past-tense-mini-worksheet.html`
   - Cover: `public/games/english/past-tense-mini-media-cover.png` (1280×720)
   - Curriculum: ต 1.1 ป.5/1–2, ต 1.2 ป.6/1 (Past Simple regular -ed vs irregular, was/were, time signals)

## Requirements

### R1. Interactive Learning Studio Upgrades (Media HTML)
Upgrade all 4 media HTML files into production-grade, Classroom-first interactive studios:
- **Web Speech API multi-accent audio:** Clear English speech synthesis with accent selection (US/UK) and Thai translations.
- **Multiple learning modes:**
  - *Package 1 (Sight Words ป.4):* Interactive Flashcard Studio, Sentence Context Explorer, Spelling/Read Challenge Quiz.
  - *Package 2 (Sight Words ป.1–3):* Graded Level Selector (ป.1, ป.2, ป.3), Audio Phonics Soundboard, Visual Flashcards, Word Practice Quiz.
  - *Package 3 (Grammar & Vocab):* Grammar Rule Navigator (Verb to Be, a/an/the, Do/Does, Pronouns), Illustrated Vocabulary Bank, MCQ Practice Quiz.
  - *Package 4 (Past Tense Mini):* Interactive Past Timeline, Regular (-ed) vs Irregular Verb Matrix, Verb Conjugation Lab, Time Signal Quiz.
- **Classroom-first UI:**
  - Responsive design on 360×800 (mobile) and 1280×720 (desktop) with zero horizontal overflow (`scrollWidth <= clientWidth + 1`).
  - WCAG AAA touch targets (>= 44x44 px) on all interactive buttons, tiles, and controls.
  - Teacher Smartboard keyboard shortcuts (`1`–`4`, `Space` for audio/play, `F` for fullscreen).
  - `window.__getState()` hook exposed for automated test verification.

### R2. Kid-Friendly 16:9 Cover Art (1280×720 PNG)
Render custom 1280×720 full-bleed cover images for each package following workspace guidelines (`scripts/make-cover.mjs` or Playwright script):
- `public/games/english/sight-words-media-cover.png`
- `public/games/english/sight-words-p123-media-cover.png`
- `public/games/english/grammar-vocab-media-cover.png`
- `public/games/english/past-tense-mini-media-cover.png`
- Clean chibi character illustrations, playful learning themes, bilingual typography, and all critical elements centered in the 60% safe zone.

### R3. Synchronized Companion A4 Worksheets
Upgrade or construct A4 companion worksheets using the `worksheet-topic.js` architecture:
- 40–50 curated question items per worksheet across 4–5 core curriculum skills.
- Zero-shift teacher answer keys (`👁 เฉลยครู`), randomizer (`🎲 สุ่มใหม่`), and direct QR code linking to media.
- Pass `node scripts/verify-worksheet.mjs` with 18/18 checks and 0 failures for all 4 worksheets.

### R4. Database Registration & Release Sync
- Create and execute Supabase migration 535 on project `lkpqssbqxxpasidfqhpb`:
  - Register/update all 4 media and worksheets in `educational_hub_items`.
  - Update `thumbnail_url` to link the new 16:9 cover PNGs.
  - Insert or update detailed feature documentation in `game_docs` (10 features per item).
- Add version release entry in `src/components/admin/system/SystemOverview.tsx` (`v1.229.87`).
- Run `pnpm build`, stage files, commit with Conventional Commits + Codex co-author, and push to `origin/main`.

## Acceptance Criteria

### Media Verification
- [ ] Mobile viewport (360×800) has zero horizontal overflow (`scrollWidth <= clientWidth + 1`) across all 4 media.
- [ ] Desktop viewport (1280×720) renders cleanly with all modes functional.
- [ ] All interactive touch targets >= 44x44 px.
- [ ] `window.__getState()` returns active state object on all 4 media.
- [ ] Web Speech API TTS audio functions with US/UK accent options and Thai translation support.

### Worksheet Verification
- [ ] All 4 companion worksheets pass `scripts/verify-worksheet.mjs` (18/18 checks, 0 failures).
- [ ] A4 print layout renders cleanly with zero-shift teacher answers.

### Release & Catalog
- [ ] All 4 items have valid 1280×720 PNG cover images.
- [ ] All items properly updated in Supabase `educational_hub_items` and `game_docs`.
- [ ] `pnpm build` compiles cleanly with exit code 0.
- [ ] Automatic commit and push to `origin/main` upon passing all tests.

## Follow-up — 2026-09-18T03:10:25Z

# Classroom Action & TPR Commands Studio (สื่อคำสั่งและการปฏิบัติตามในห้องเรียน)

พัฒนาสื่อการสอนอินเทอร์แอ็กทีฟภาษาอังกฤษ-ภาษาไทย "Classroom Action & TPR Commands Studio" สำหรับใช้บนจอ Smartboard ในห้องเรียน เพื่อให้ครูสั่งนักเรียนทำท่าทางตามคำสั่ง เช่น ลุก นั่ง หันซ้าย-ขวา หันหลังกลับ กระโดด อ้าปาก ปิดตา ยกมือ นั่งย่อ หัวเราะ ร้องไห้ พร้อมระบบซ่อนภาพปิดตาทดสอบการฟัง และเปิดเฉลยภาพการ์ตูนเคลื่อนไหวประกอบ

Working directory: d:/kampai-school-main
Integrity mode: development

## Requirements

### R1. คลังคำสั่งและการเคลื่อนไหวร่างกาย 2 ภาษา (24+ Bilingual Action & TPR Commands)
รวบรวมคำสั่งพื้นฐานและการเคลื่อนไหวร่างกายอย่างครอบคลุม จัดเป็น 4 หมวดหมู่ พร้อมภาพประกอบเพื่อการศึกษาคุณภาพสูง (WebP), ประโยคภาษาอังกฤษ และคำแปลภาษาไทย:
1. **ท่าทางและการเคลื่อนไหวพื้นฐาน (Basic Body Movements):**
   - *Stand up!* (ลุกขึ้นยืน)
   - *Sit down!* (นั่งลง)
   - *Walk!* (เดิน)
   - *Jump!* (กระโดด)
   - *Squat down! / Crouch!* (นั่งย่อ)
   - *Kneel down!* (คุกเข่า)
2. **ทิศทางและตำแหน่ง (Directions & Placements):**
   - *Turn left!* (หันไปทางซ้าย)
   - *Turn right!* (หันไปทางขวา)
   - *Turn around!* (หันหลังกลับ / หมุนรอบตัว)
   - *Put it up / Raise it high!* (เอาไว้ข้างบน / ชูขึ้นสูง)
   - *Put it down!* (เอาไว้ข้างล่าง / วางลง)
3. **ใบหน้า ร่างกาย และอวัยวะ (Face, Eyes & Gestures):**
   - *Open your mouth!* (อ้าปาก)
   - *Close your left eye!* (ปิดตาซ้าย)
   - *Close your right eye!* (ปิดตาขวา)
   - *Raise your hands!* (เอามือยกขึ้น)
   - *Touch your head!* (แตะศีรษะ)
   - *Clap your hands!* (ปรบมือ)
4. **อารมณ์และการแสดงออก (Emotions & Expressions):**
   - *Laugh! / Smile happily!* (หัวเราะ / ยิ้มสดใส 😄)
   - *Cry! / Look sad!* (ร้องไห้ / ทำหน้าเศร้า 😢)
   - *Shout 'Hooray!'* (ร้องไชโย)
   - *Whisper quietly!* (กระซิบเบาๆ)

### R2. 4 โหมดกิจกรรมในห้องเรียน (Classroom Interactive Modes)
1. **โหมดปิดภาพทายท่าทาง (Blind Listen & Reveal Mode):**
   - ครูสามารถกดปุ่ม "ซ่อนภาพ" (Hide Picture) เพื่อปิดม่านบังภาพการ์ตูนไว้ก่อน ให้นักเรียนในห้องฟังเฉพาะเสียงคำสั่ง (หรือเสียงครู) แล้วทำท่าทางตาม
   - กดปุ่ม "เปิดเฉลย" (Reveal) หรือกดคีย์ลัด เพื่อเปิดม่านแสดงภาพการ์ตูนท่าทางเฉลย พร้อมเฉลยว่าคำนั้นใช้ทำอะไรและมีความหมายอย่างไร
2. **โหมดเกม "ครูสั่งว่า..." (Simon Says Challenge Mode):**
   - ระบบสุ่มประโยคคำสั่งทั้งแบบที่มี *"Simon says..."* (เช่น *"Simon says: Stand up!"*) ให้นักเรียนทำตาม และแบบที่ไม่มี *"Simon says"* (เช่น *"Sit down!"*) ซึ่งนักเรียนต้องอยู่นิ่งๆ ห้ามทำตาม
   - มีปุ่มเฉลยให้ครูตัดสินว่ารอบนี้นักเรียนต้องทำตามหรือต้องอยู่นิ่ง
3. **โหมดสุ่มสปีดคำสั่ง (Speed Randomizer Mode):**
   - สุ่มคำสั่งแบบอัตโนมัติขึ้นหน้าจอใหญ่ โดยครูสามารถปรับสปีดได้: ช้า (3.5 วินาที), ปานกลาง (2.5 วินาที), เร็ว (1.5 วินาที) สำหรับกิจกรรมกระตุ้นพลังงานและความตื่นตัว (Warm-up Activity)
4. **โหมดตัวต่อประโยคคำสั่ง (Command Sentence Builder Mode):**
   - กิจกรรมลากหรือแตะบล็อกคำศัพท์ Action Verb + Direction/Body Part (เช่น [Raise] + [your hands], [Turn] + [left]) เพื่อประกอบเป็นประโยคคำสั่งที่ถูกต้อง

### R3. ระบบเสียงสังเคราะห์สองภาษาและการควบคุม Smartboard สำหรับครู
- รองรับเสียงอ่านออกเสียงคำสั่งชัดเจน (Web Speech API): ภาษาอังกฤษสำเนียงอเมริกัน 🇺🇸 US / บริติช 🇬🇧 UK และปุ่มฟังคำแปลภาษาไทย
- คีย์ลัด Smartboard เต็มรูปแบบ:
  - `Space`: เล่นเสียงอ่านคำสั่งซ้ำ
  - `Enter` หรือ `KeyR`: สลับเปิด/ปิดม่านเฉลยภาพ
  - `ArrowRight` / `ArrowLeft`: เปลี่ยนคำสั่งถัดไป / ก่อนหน้า
  - `1`, `2`, `3`, `4`: สลับโหมดการเรียนรู้ทั้ง 4 โหมด
  - `KeyF`: เปิดเต็มหน้าจอ
- ติดตั้ง State Inspection Hook: `window.__getState()` สำหรับการทดสอบอัตโนมัติ

### R4. สื่อการสอน ใบงานพิมพ์ A4 และการลงทะเบียนแค็ตตาล็อก
- ไฟล์สื่อการสอน: `public/games/english/classroom-action-media.html`
- ภาพปกมาตรฐาน 16:9 (1280×720): `public/games/english/classroom-action-media-cover.png` สไตล์จิบิ ปลอดความรุนแรง
- ใบงานพิมพ์ A4 คู่ขนาน: `public/games/english/classroom-action-worksheet.html` รองรับการจับคู่คำสั่งกับภาพ, กิจกรรม Simon Says checklist และเฉลยครูแบบ Zero-shift
- สร้าง DB Migration อัปเดต `educational_hub_items` และลงทะเบียน `game_docs`
- บันทึกประวัติเวอร์ชันใน `SystemOverview.tsx`

## Acceptance Criteria

### Interactive Classroom Quality Bar
- [ ] มีชุดคำสั่งครบทั้ง 24+ ท่าทางตามที่กำหนด พร้อมภาพประกอบเพื่อการศึกษาคุณภาพสูง
- [ ] โหมดปิดภาพ (Blind Mode) มีม่าน/แผ่นการ์ดปิดภาพได้อย่างมิดชิด และสามารถเปิดเฉลยได้อย่างรวดเร็วทั้งผ่านการคลิกและคีย์ลัด (`Enter`/`R`)
- [ ] มีครบทั้ง 4 โหมดกิจกรรม: Blind Reveal, Simon Says, Speed Randomizer, Command Builder
- [ ] รองรับเสียงอ่านทั้งภาษาอังกฤษ (US/UK) และภาษาไทย
- [ ] ผ่านการทดสอบ Automated E2E ด้วย Playwright บนวิวพอร์ต 360×800 (Mobile) และ 1280×720 (Smartboard) โดยไม่มี horizontal scrollbar และปุ่มสัมผัส >= 44x44 px
- [ ] ใบงานพิมพ์ A4 ผ่านการตรวจสอบ `verify-worksheet.mjs` 18/18 checks (0 failures)
- [ ] คำสั่ง `pnpm build` รันผ่านสมบูรณ์ (exit code 0)
- [ ] อัปเดตฐานข้อมูล Supabase และ Sync commit/push สู่ branch `main` เรียบร้อย

## Follow-up — 2026-09-21T14:51:48Z

ยกระดับและออกแบบภาพปกใหม่ระดับสตูดิโอ (16:9 ขนาด 1280×720 px) สำหรับ 10 เกมการศึกษาบน Educational Hub ที่ปรากฏในรูปภาพตัวอย่าง โดยใช้สไตล์ Cute Cartoon Clean Line Art (การ์ตูนอนิเมะลายเส้นสะอาดตา สีสันสดใส อบอุ่น สมวัยประถมศึกษา K–6) แก้ไขปัญหาภาพปกไม่สวย ตัวอักษรขยะฟอนต์เพี้ยน (Mojibake) และภาพขาดหาย (Broken image) ให้สวยงาม มีชีวิตชีวา และได้มาตรฐาน Kampai Cover Art Guidelines

Working directory: d:/kampai-school-main
Integrity mode: development

## Requirements

### R1. ชุดภาพปก 16:9 สไตล์ Cute Cartoon Clean Line Art ครบทั้ง 10 เกม (10 Studio-Quality Covers)
สร้างและจัดทำภาพปก 16:9 ขนาด 1280×720 px แบบ Full-bleed สำหรับ 10 เกมเป้าหมาย:
1. `clock-quest` (`public/games/math/clock-quest-cover.png`):
   - **ธีม:** นาฬิกาแสนสนุก (Fun Clock & Time Adventure — คณิต ป.2–ป.3)
   - **ภาพ:** ตัวละครเด็กนักเรียนจิบิน่ารักถือเข็มสั้น-เข็มยาว หน้าปัดนาฬิกาการ์ตูนยิ้มแย้มมีตัวเลข 1–12 ชัดเจน แสงแดดสดใส ปราศจากฟอนต์เพี้ยน
2. `follow-instructions-lab` (`public/games/english/follow-instructions-lab-cover.png`):
   - **ธีม:** Follow Instructions Lab (ห้องทดลองทำตามคำสั่ง — ภาษาอังกฤษ ป.3–ป.4)
   - **ภาพ:** เด็กนักเรียนสวมแว่นตาทดลองจิปิ แตะบล็อกรูปทรงเรขาคณิตการ์ตูนสีสดใส (วงกลมสีแดง สี่เหลี่ยมสีน้ำเงิน สามเหลี่ยมสีเขียว)
3. `light-sort` (`public/games/science/light-sort-cover.png`):
   - **ธีม:** แสงผ่านได้ไหม? (Light Passage Adventure — วิทย์ ป.4–ป.5)
   - **ภาพ:** เด็กนักเรียนส่องไฟฉายผ่านวัตถุโปร่งใส (แก้วน้ำ), โปร่งแสง (กระดาษไข), และทึบแสง (กล่องไม้) ลำแสงการ์ตูนสว่างสวยงาม ปราศจากตัวอักษรขยะ
4. `bone-muscle-quest` (`public/games/health/bone-muscle-quest-cover.png`):
   - **ธีม:** กระดูก–กล้ามเนื้อควิซ (Bone & Muscle Quest — สุขศึกษา ป.4–ป.5)
   - **ภาพ:** เด็กนักเรียนสไตล์จิบิเบ่งกล้ามอย่างแข็งแรง มีภาพโครงกระดูกการ์ตูนน่ารักหน้ายิ้มยืนเคียงข้างอย่างเป็นมิตร ปลอดภัย ไม่น่ากลัว
5. `fact-opinion-duel` (`public/games/thai/fact-opinion-duel-cover.png`):
   - **ธีม:** ข้อเท็จจริง vs ความคิดเห็น (Fact vs Opinion Duel — ภาษาไทย ป.4–ป.5)
   - **ภาพ:** ตัวละครเด็กนักสืบจิบิถือแว่นขยายตรวจดูป้ายข้อความการ์ตูนสดใส มีตาชั่งความจริงและประกายดาวปัญญา
6. `moon-phases-race` (`public/games/science/moon-phases-race-cover.png`):
   - **ธีม:** แข่งเฟสดวงจันทร์ (Moon Phases Race — วิทย์ ป.4–ป.5)
   - **ภาพ:** เด็กนักบินอวกาศจิบิขับยานอวกาศจิ๋วบินรอบดวงจันทร์ในระยะต่างๆ (จันทร์เพ็ญ จันทร์เสี้ยว จันทร์ดับ) ท้องฟ้าอวกาศสีน้ำเงินเข้มประกายดาวสดใส
7. `past-tense-run` (`public/games/english/past-tense-run-cover.png`):
   - **ธีม:** Past Tense Run (วิ่งตะลุยอดีตกาล — ภาษาอังกฤษ ป.4–ป.5)
   - **ภาพ:** เด็กนักเรียนวิ่งกระฉับกระเฉงบนทางวิ่งกาลเวลา เก็บเหรียญคำกริยาช่อง 2 (went, saw, ate, played) ตัวหนังสือคมชัดสวยงาม
8. `first-aid-rush` (`public/games/health/first-aid-rush-cover.png`):
   - **ธีม:** ปฐมพยาบาลด่วน (First Aid Rush — สุขศึกษา ป.4–ป.5)
   - **ภาพ:** เด็กนักเรียนหน่วยปฐมพยาบาลจิบิถือกล่องปฐมพยาบาลสีแดงสด พลาสเตอร์ยาการ์ตูนหน้ายิ้ม และสำลีสะอาด ปราศจากตัวอักษรขยะ
9. `animal-feast` (`public/games/science/animal-feast/cover.png`):
   - **ธีม:** Animal Feast (ยอดนักป้อนอาหารสัตว์ — วิทยาศาสตร์)
   - **ภาพ:** สวนสัตว์การ์ตูนสดใส ตัวละครเด็กจิบิให้อาหารสัตว์น่ารัก (กระต่ายกินแครอท สิงโตกินเนื้อ ลิงกินกล้วย) แก้ปัญหาภาพ broken
10. `maglev-rush` (`public/games/science/maglev-rush/cover.png`):
    - **ธีม:** Maglev Rush (รถไฟแม่เหล็กความเร็วสูง — วิทยาศาสตร์)
    - **ภาพ:** รถไฟหัวกระสุนสไตล์การ์ตูนอนิเมะลอยเหนือรางแม่เหล็ก แสงนีออนสีฟ้า-ทองสดใส ขั้วแม่เหล็ก N-S การ์ตูนน่ารัก ทันสมัยและเข้าถึงง่าย

### R2. มาตรฐานความปลอดภัย อัตราส่วน และ Safe Zone (16:9 & Safe Zone Rule)
- ทุกภาพต้องเป็นสัดส่วน 16:9 ขนาด 1280×720 pixels พอดีขอบ (Full-bleed) โดยผ่านการย่อ/ครอบด้วย `scripts/make-cover.mjs` หรือ Playwright render
- องค์ประกอบสำคัญ (ตัวละครหลัก ชื่อเกมสองภาษา ไทย-อังกฤษ และสัญลักษณ์สำคัญ) ต้องอยู่กึ่งกลางภายใน Safe Zone 60% ของภาพ (vertical range 27%–73%)
- ปราศจากฟอนต์เพี้ยน สัญลักษณ์ mojibake (`=P 2,42A**8`, `? A*H2DID+!?`, `I-@G#4`) 100%

### R3. ซิงค์แค็ตตาล็อกฐานข้อมูล Supabase และ SystemOverview
- ตรวจสอบและอัปเดต `thumbnail_url` ใน `educational_hub_items` ให้ตรงกับไฟล์ภาพใหม่ครบทั้ง 10 เกม
- สร้างและจัดวางไฟล์ปกในไดเรกทอรีที่ถูกต้องสำหรับทุกเกม
- อัปเดตบันทึกเวอร์ชันใน `src/components/admin/system/SystemOverview.tsx`

## Acceptance Criteria

### Technical & Quality Verification
- [ ] ภาพปกทั้ง 10 ภาพมีขนาด 1280×720 px และบันทึกลงพาธเป้าหมายครบถ้วน
- [ ] แก้ไขปัญหารูป broken ของ `animal-feast` บน Educational Hub สำเร็จ
- [ ] ลบและแก้ไขปัญหาฟอนต์เพี้ยน/mojibake glyphs ออกทั้งหมด 100%
- [ ] ตัวหนังสือชื่อเกมทั้งสองภาษา (ไทยและอังกฤษ) อ่านง่าย คมชัด และจัดวางใน Safe Zone 60%
- [ ] รันตรวจสอบผ่าน HTTP/Browser จริงบนหน้า Educational Hub ทั้งขนาด 360×800 และ 1280×720
- [ ] `pnpm build` สำเร็จ (exit code 0)
- [ ] ทำการ commit และ push สู่ `origin/main` อัตโนมัติ

## Follow-up — 2026-09-23T04:12:41Z

ยกระดับ **Phonics Reading Studio** (`public/games/english/phonics-media.html`) สำหรับคุณครูใช้จัดการเรียนรู้ในห้องเรียน: เพิ่มฟีเจอร์ซ่อน/แสดงคำสำหรับฝึกทายคำศัพท์, ขยายคลังคำศัพท์และภาพประกอบแท้จาก `vocab-hub-assets` (จากเดิม 115 คำ เพิ่มเป็น 150+ คำ ครอบคลุมทั้ง 10 หมวด), ลบสัญลักษณ์สัทอักษร IPA (`/kæt/`) ออกทั้งหมด และเพิ่มระบบถอดเสียงตัวอักษรภาษาอังกฤษเทียบเคียงพยัญชนะ/สระไทย (Thai Phonetic Mapping) พร้อมรองรับการแสดงผล Smartboard และอุปกรณ์พกพา

Working directory: `d:/kampai-school-main`
Integrity mode: development

## Requirements

### R1. ระบบซ่อน/แสดงคำสำหรับทายในห้องเรียน (Word Reveal & Quiz Mode)
- เพิ่มปุ่มสลับซ่อนคำ (Toggle Hide/Show: `👁️ ซ่อนคำ` / `👁️🗨️ แสดงคำ`) บนแถบเครื่องมือ (Toolbar) ที่ครูเข้าถึงได้สะดวก
- **พฤติกรรมเมื่อเปิดโหมดซ่อนคำ:**
  - ซ่อนตัวอักษรภาษาอังกฤษขนาดใหญ่บนการ์ด และแสดงกล่อง placeholder `❓ แตะเพื่อเฉลย` แทน
  - ซ่อนคำอ่านไทยและคำแปล เพื่อให้เด็กฝึกดูภาพ หรือฟังเสียงจากครู/ระบบ แล้ววิเคราะห์ทายคำศัพท์ด้วยตนเอง
  - ซ่อนชิปถอดเสียงไทย (Thai Phonetic Mapping) ชั่วคราว และจะเปิดเผยพร้อมกันเมื่อแตะเฉลย
  - **คงรูปภาพประกอบขนาดใหญ่และปุ่มฟังเสียงไว้ตามปกติ** (ฟังคำอ่าน, สะกดทีละเสียง, ฝึกพูดตาม) เพื่อให้ครูใช้เปิดเป็นคำใบ้เสียงได้
  - แตะที่กล่อง placeholder หรือกดปุ่มเฉลย สามารถเปิดเผยคำศัพท์และรายละเอียดทั้งหมดได้ทันที
- รองรับคีย์ลัด Smartboard: กดปุ่ม `H` เพื่อสลับซ่อน/แสดงคำได้ทันที
- ในโหมด Gallery (คลังคำศัพท์): เมื่อซ่อนคำ ให้ซ่อนชื่อคำและคำอ่านไทย แสดงเฉพาะภาพและปุ่มฟังเสียง

### R2. ลบสัญลักษณ์ IPA ออกจากระบบทั้งหมด (Complete IPA Removal)
- ลบการแสดงผลสัญลักษณ์ IPA (เช่น `/kæt/`) ออกจากหน้าจอการ์ดคำศัพท์ทุกจุด
- ลบฟิลด์ `ipa` ออกจากชุดข้อมูลคำศัพท์ทุกคำในทุกหมวดอย่างหมดจด ไม่ให้เหลือค้างในโค้ด

### R3. ระบบถอดเสียงเทียบพยัญชนะ-สระไทย (Thai Phonetic Mapping)
- แสดงชิปถอดเสียงเทียบเคียงตัวอักษรภาษาอังกฤษกับพยัญชนะ/สระภาษาไทยแทนที่ตำแหน่งเดิมของ IPA
- จำแนกประเภทของเสียงด้วยรหัสสีตามมาตรฐานการเรียนรู้:
  - 🔵 **พยัญชนะ (Consonant):** ชิปสีฟ้า/น้ำเงิน (เช่น `c → ค`, `t → ท`, `sh → ช`)
  - 🟡 **สระ (Vowel):** ชิปสีส้ม/ทอง (เช่น `a → แอ`, `e → เอะ`, `ee → อี`)
  - 🟢 **พยางค์/เสียงผสม (Syllable/Cluster):** ชิปสีเขียว (สำหรับคำหลายพยางค์)
  - ⚪ **ตัวอักษรไม่ออกเสียง (Silent Letter):** ชิปสีเทา (เช่น `e` ท้ายคำใน Magic E: `cake` → `e → (เงียบ)`)
- แสดงคำอธิบายสัญลักษณ์ (Legend) ด้านล่างชิปอย่างชัดเจน
- แมปข้อมูลอย่างถูกต้องตามหลักภาษาศาสตร์และการออกเสียงภาษาอังกฤษ-ไทยสำหรับทุกคำศัพท์

### R4. เพิ่มเติมคลังคำศัพท์และภาพประกอบคุณภาพสูง (Expanded Vocabulary & Real WebP Images)
- คัดเลือกและเพิ่มคำศัพท์โฟนิกส์ใหม่ที่มีภาพประกอบจริงใน `public/games/english/vocab-hub-assets/` เข้าสู่ทั้ง 10 หมวด
- ขยายจำนวนคำศัพท์จากเดิม 115 คำ เป็น **150+ คำ** (เฉลี่ยหมวดละ 15–18 คำ)
- ทุกคำที่เพิ่มต้องมี:
  - ภาพประกอบจริง (`.webp` จาก `vocab-hub-assets`)
  - การแยกเสียง Phonemes สำหรับ Sound Blending
  - การถอดเสียงเทียบพยัญชนะ-สระไทย (Thai Phonetic Mapping)
  - คำอ่านภาษาไทยและคำแปลไทยที่ถูกต้องชัดเจน

### R5. UI/UX สอดคล้องตามมาตรฐาน Classroom-First & Design System
- ยึดหลัก Light-only theme โดยใช้ CSS Custom Variables ตามที่กำหนดในระบบ
- ปุ่มกดและเป้าหมายสัมผัสขนาดอย่างน้อย 44×44 px เหมาะสำหรับนิ้วมือและหน้าจอสัมผัส Smartboard
- ไม่เกิดข้อความล้น (No overflow) ทั้งบนหน้าจอมือถือ (360×800) และจอเดสก์ท็อป/Smartboard (1280×720)
- บันทึกประวัติการปรับปรุงระบบลงใน `src/components/admin/system/SystemOverview.tsx`

## Acceptance Criteria

### ฟังก์ชันการทำงาน (Functionality)
- [ ] ปุ่มสลับซ่อน/แสดงคำทำงานได้ราบรื่น ทั้งการกดปุ่มบนจอและการกดคีย์ลัด `H`
- [ ] เมื่อซ่อนคำ ตัวหนังสือและคำอ่านถูกซ่อนอย่างมิดชิด แต่ภาพและปุ่มฟังเสียงยังทำงานปกติ แตะเฉลยแล้วแสดงผลครบถ้วน
- [ ] ไม่ปรากฏสัญลักษณ์ IPA (`/.../`) ในหน้าจอใดๆ ทั้งในโหมด Studio, Gallery, Quiz หรือ Builder
- [ ] Thai Phonetic Mapping แสดงผลถูกต้อง ครบทุกคำ มีสีแยกพยัญชนะ/สระชัดเจน
- [ ] มีคำศัพท์รวมไม่น้อยกว่า 150 คำ ครบทั้ง 10 หมวด ทุกคำมีภาพประกอบ `.webp` แท้ ไม่ใช้ placeholder หรือ emoji

### คุณภาพและการทดสอบ (Quality & Verification)
- [ ] ตรวจสอบผ่าน HTTP / Browser จริงที่ 360×800 และ 1280×720 ไม่มี overflow
- [ ] คำสั่ง `pnpm verify:media` รันผ่านสมบูรณ์ 100%
- [ ] คำสั่ง `pnpm build` ผ่านโดยไม่มี TypeScript หรือ Vite error
- [ ] อัปเดต `SystemOverview.tsx` พร้อม commit และ push ขึ้น `origin/main`

## Follow-up — 2026-09-23T14:06:57Z

ปรับปรุงและจัดระเบียบระบบ **Sound Blending (การสะกดทีละเสียงโฟนิกส์)** ใน **Phonics Reading Studio** (`public/games/english/phonics-media.html`) ให้เป็นมาตรฐานเดียวกัน 100% ตามหลักสูตรโฟนิกส์แท้ (Phoneme-level Blending): ยกเลิกการตัดคำแบบพยางค์คำอ่าน (Syllables เช่น `ted · dy · bear`, `ap · ple`, `sand · wich`) เปลี่ยนคำศัพท์ที่ไม่ตรงหมวดเสียงให้เป็นคำโฟนิกส์แท้ พร้อมปรับระบบ `phonemes`, `thaiPhonics`, ชิปถอดเสียงภาษาไทย และโหมดต่อบล็อกเสียง (Sound Builder) ให้สอดคล้องกันทุกคำ

Working directory: `d:/kampai-school-main`
Integrity mode: development

## Requirements

### R1. จัดมาตรฐานการสะกดโฟนิกส์แท้ (Pure Phoneme Blending) ครบทั้ง 170 คำ
- ตรวจสอบ `phonemes` ของคำศัพท์ทั้งหมด 170 คำใน 10 หมวด
- **ยกเลิกการตัดคำแบบพยางค์คำอ่าน (Syllables)** เช่น `ted · dy · bear`, `ap · ple`, `doc · tor`, `hos · pi · tal`, `sand · wich`
- **เปลี่ยนเป็นหน่วยเสียงโฟนิกส์แท้ (Letter-Sound Phonemes) ทุกคำ:**
  - พยัญชนะเดี่ยว: `c`, `b`, `t`, `m`, `d`, `p`, `s`, `h`, `f`, ฯลฯ
  - พยัญชนะคู่/เสียงควบกล้ำ (Digraphs/Blends): `ch`, `sh`, `th`, `wh`, `ph`, `qu`, `ck`, `ng`, `nk`, `bl`, `cl`, `fl`, `gl`, `pl`, `sl`, `br`, `cr`, `dr`, `fr`, `gr`, `pr`, `tr`, `sp`, `st`, `sn`, `sw`
  - สระสั้น: `a`, `e`, `i`, `o`, `u`
  - สระคู่ (Vowel Teams): `ee`, `ea`, `ai`, `oa`, `oo`, `ou`, `ow`, `ue`, `ui`
  - สระ Magic E: เช่น `c` · `a` · `k` · `e` (โดย `e` เป็นตัวอักษรเงียบ)
  - สระ Bossy R: `ar`, `or`, `ir`, `ur`, `er`

### R2. ตรวจสอบและแทนที่คำที่ไม่ตรงตามหลักสูตรโฟนิกส์ (Phonics Integrity & Word Replacement)
- ตรวจสอบและแทนที่คำศัพท์ที่ยาวเกินไป (3+ พยางค์), คำประสม (Compound Words), หรือเสียงสระไม่ตรงหมวด เช่น:
  - `teddy-bear` ในหมวด Short E (`bear` ออกเสียงสระแอร์) ➔ แทนที่ด้วยคำโฟนิกส์ Short E แท้ เช่น `bed` (เตียงนอน) หรือ `ten` (เลขสิบ) หรือ `red` (สีแดง)
  - คำศัพท์ 3 พยางค์ในหมวดสระเสียงสั้น เช่น `broccoli`, `hospital`, `crocodile`, `cucumber` ➔ แทนที่ด้วยคำโฟนิกส์แท้ 1-2 พยางค์ที่สะกดง่ายและตรงเสียงสระนั้นๆ
- **ทุกคำที่เปลี่ยนใหม่ต้องมีภาพ `.webp` คุณภาพสูงรองรับอยู่ใน `public/games/english/vocab-hub-assets/` อย่างแน่นอน**

### R3. ซิงค์ระบบ Thai Phonetic Mapping และ Sound Builder ให้ตรงกัน 1-ต่อ-1
- ทุกหน่วยเสียงใน `phonemes` จะต้องมีคู่แมปใน `thaiPhonics` ที่ตรงกันเป๊ะ (จำนวนสมาชิกเท่ากัน)
- ชิปถอดเสียงภาษาไทยต้องแสดงเสียงสะกดโฟนิกส์ที่สอดคล้องกับตัวอักษรภาษาอังกฤษ
- โหมดต่อบล็อกเสียง (Sound Builder): บล็อกเสียงที่ให้เด็กต่อจะต้องสะท้อนหน่วยเสียงโฟนิกส์ที่ถูกต้อง ไม่แสดงบล็อกเป็นคำอ่านทั้งพยางค์

### R4. ระบบเสียง TTS สำหรับการสะกดคำ (Phonetic Audio Pacing)
- ตรวจสอบฟังก์ชัน `speakPhonicsBlend()` เมื่อเด็กกดปุ่ม "🗣️ สะกดทีละเสียง" ให้เปล่งเสียงทีละหน่วยเสียงอย่างชัดเจนตามจังหวะที่กำหนด แล้วตามด้วยการอ่านคำเต็ม

### R5. UI/UX และการทดสอบตามมาตรฐาน Classroom-First
- ทดสอบการแสดงผลชิป Sound Blending และ Thai Mapping บนจอจริง ทั้งขนาด 360×800 (มือถือ) และ 1280×720 (Smartboard) ไม่ให้ชิปล้นหรือทับซ้อน
- ตรวจสอบ `pnpm verify:media` และ `pnpm build` ให้ผ่านสมบูรณ์ 100%
- บันทึกการอัปเดตเวอร์ชันลงใน `src/components/admin/system/SystemOverview.tsx` พร้อม commit และ push ขึ้น `origin/main`

## Acceptance Criteria

### ฟังก์ชันและข้อมูล (Data & Functionality)
- [ ] คำศัพท์ทั้ง 170 คำใน 10 หมวด ใช้มาตรฐานการสะกดโฟนิกส์แท้ (Phoneme Blending) 100% ไม่มีคำใดที่แยกเป็นพยางค์คำอ่าน (0 syllable-split words)
- [ ] คำที่ไม่ตรงหมวดโฟนิกส์ (เช่น `teddy-bear`, `crocodile`, `hospital`) ถูกเปลี่ยนเป็นคำโฟนิกส์แท้ที่ตรงหมวดเสียง และมีภาพ WebP แท้บนดิสก์ 100%
- [ ] `phonemes.length === thaiPhonics.length` ครบทั้ง 170 คำ โดยไม่มีข้อยกเว้น
- [ ] ชิป Sound Blending และ Thai Phonetic Mapping แสดงผลสัมพันธ์กันอย่างถูกต้องทั้ง 170 คำ
- [ ] โหมดต่อบล็อกเสียง (Sound Builder) รองรับหน่วยเสียงโฟนิกส์ที่ปรับปรุงใหม่อย่างราบรื่น

### คุณภาพและการทดสอบ (Quality & Verification)
- [ ] ผ่านการตรวจสอบบนเบราว์เซอร์จริงทั้งขนาด 360×800 และ 1280×720 ไม่เกิด horizontal overflow
- [ ] คำสั่ง `pnpm verify:media` ผ่าน 100%
- [ ] คำสั่ง `pnpm build` ผ่านสมบูรณ์ (Exit code 0)
- [ ] บันทึก `SystemOverview.tsx` พร้อม commit และ push ขึ้น `origin/main`

## Follow-up — 2026-09-24T03:10:32Z

This is a single self-contained fix; keep it small and focused.
ขยายระบบธนาคารความดี (Conduct Management) ให้รองรับหมวดหมู่พฤติกรรมทั้งด้านบวกและลบที่ครอบคลุมบริบทโรงเรียนยิ่งขึ้น เพิ่มเหตุผลสำเร็จรูปให้หลากหลายในทุกหมวดหมู่ และเพิ่มปุ่มกดเลือกคะแนนด่วน (Quick Score Buttons: 1, 2, 5, 10 คะแนน) ควบคู่กับช่องระบุคะแนนอิสระ ทั้งในโหมดบันทึกรายคนและหลายคน โดยคงความเข้ากันได้ 100% กับข้อมูลเดิมและระบบแสดงผลที่เกี่ยวข้อง

Working directory: d:/kampai-school-main
Integrity mode: development

## Requirements

### R1. ขยายหมวดหมู่คะแนนความดีทั้งด้านบวก (+) และหักคะแนน (-)
- เพิ่มหมวดหมู่ทั้งสองด้านให้ครอบคลุมบริบทชีวิตประจำวันในโรงเรียน (เช่น มารยาทและการพูดจา, ความเป็นผู้นำ/การทำงานเป็นทีม, สุขอนามัยและความสะอาด, วินัย/ตรงต่อเวลา, การดูแลรักษาทรัพย์สิน, การใช้อุปกรณ์สื่อสาร) พร้อม Badge สีและ Emoji ที่ชัดเจน
- รองรับการเชื่อมโยง (mapping) หมวดหมู่เข้ากับ 5 มิติคุณธรรมหลักเดิมของโรงเรียน (จิตสาธารณะ, ความรับผิดชอบ, วินัย, ซื่อสัตย์, น้ำใจ) ในระดับ Service/Helper เพื่อไม่ให้กระทบต่อประวัติเดิม, หน้าระบบ Hall of Fame, และการคำนวณ XP ในโปรไฟล์ฮีโร่

### R2. เพิ่มคลังเหตุผลสำเร็จรูป (Preset Reasons) ที่หลากหลายในแต่ละหมวดหมู่
- เพิ่มตัวเลือกเหตุผลสำเร็จรูปในทุกหมวดหมู่ทั้งด้านบวกและลบ ให้มีสถานการณ์ที่ครูพบบ่อยในโรงเรียน เช่น การช่วยเหลือเพื่อน, การส่งงาน, การร่วมกิจกรรม, การมาสาย, การไม่ทำการบ้าน, การพูดไม่สุภาพ, การทำเวรทำความสะอาด
- เมื่อผู้ใช้กดเลือกเหตุผลสำเร็จรูป ให้ระบบนำข้อความใส่ลงในช่องเหตุผลทันที และยังคงพิมพ์แก้ไขหรือเพิ่มรายละเอียดเพิ่มเติมต่อท้ายได้

### R3. ปุ่มกดเลือกคะแนนด่วน (Quick Score Buttons) และคงช่องระบุตัวเลขอิสระ
- เพิ่มปุ่มกดเลือกคะแนนด่วน [1, 2, 5, 10] เพื่อให้ผู้ใช้งานกดเลือกคะแนนได้ทันทีในคลิกเดียว พร้อมมีไฮไลต์ระบุว่าปัจจุบันเลือกคะแนนเท่าใด
- คงปุ่มบวกลบทีละ 1 (`+` / `-`) และช่องกรอกตัวเลขแบบพิมพ์เองได้ (Input number 1-100) เพื่อความยืดหยุ่นสูงสุด
- ใช้งานได้ทั้งในหน้าบันทึก "ทีละคน" (RecordTab) และหน้าบันทึก "หลายคน" (BulkRecordTab)

### R4. ความเข้ากันได้ย้อนหลัง 100% (Backward Compatibility)
- ข้อมูลประวัติเดิมทั้งหมดในตาราง `conduct_scores` ยังคงสามารถเปิดดูในแท็บ "ประวัติ" (History) และหน้าสรุปอันดับ (Leaderboard) ได้อย่างถูกต้อง ไม่เกิด runtime error หรือ badge สีหาย
- ไม่แก้ไข Schema ในลักษณะที่ทำลายความเข้ากันได้ของข้อมูล
- ทุก component แสดงชื่อบุคคลต้องคงมาตรฐาน `<PersonAvatar>` ตามกฎของระบบ

## Verification Resources

- การตรวจสอบการคอมไพล์และ Typescript: `pnpm build`
- การตรวจสอบ Lint: `pnpm lint`
- การตรวจสอบ UI หน้า ConductManagement (`/admin/dashboard/conduct`) ทั้งแท็บบันทึกทีละคน, บันทึกหลายคน, อันดับ และประวัติ

## Acceptance Criteria

### UI & Usability
- [ ] แสดงปุ่มคะแนนด่วน 1, 2, 5, 10 คะแนน ทั้งในแท็บทีละคนและหลายคน โดยกดแล้วอัปเดตคะแนนทันที
- [ ] ช่องกรอกคะแนนยังคงพิมพ์ตัวเลขเองได้ และปุ่ม +/- ยังคงปรับค่าคะแนนได้ถูกต้อง
- [ ] หมวดหมู่ด้านบวกและด้านลบมีตัวเลือกเพิ่มขึ้น และแสดงสี Badge / Emoji เหมาะสม
- [ ] เหตุผลสำเร็จรูปมีตัวเลือกหลากหลายในทุกหมวดหมู่ และกดแล้วลงในช่องเหตุผลได้ถูกต้อง

### Data & Backward Compatibility
- [ ] บันทึกคะแนนใหม่ทั้งด้านบวกและลบสำเร็จ บันทึกลงฐานข้อมูลและแจ้งเตือนถูกต้อง
- [ ] ประวัติเดิมที่เคยบันทึกไว้ในฐานข้อมูลยังคงแสดงผลชื่อหมวดและรายละเอียดได้ถูกต้อง
- [ ] ระบบคำนวณคะแนนรวมและหน้าอันดับ (Leaderboard) ทำงานสอดคล้องกับข้อมูลเดิม
- [ ] ตรวจผ่านคำสั่ง `pnpm build` โดยไม่มีข้อผิดพลาด

## Follow-up — 2026-09-24T11:56:12Z

This is a single self-contained fix; keep it small and focused.
เพิ่มและปรับปรุงระบบเสียงตอบรับทันที (Instant Sound & Speech Summary) ในระบบธนาคารความดี (Conduct Management) เมื่อมีการบวกหรือหักคะแนนความดี โดยเมื่อผู้ใช้กดปุ่มบันทึก ให้ระบบส่งเสียงเอฟเฟกต์ (Chime) ตอบสนองทันทีในระดับเสี้ยววินาที (Zero Latency) ควบคู่กับเสียงพูดสังเคราะห์ภาษาไทยสรุปคะแนนอย่างลื่นไหล ไม่ต้องรอความหน่วงจากเครือข่าย ทั้งในโหมดบันทึกทีละคนและหลายคน

Working directory: d:/kampai-school-main
Integrity mode: demo

## Requirements

### R1. ระบบเสียงเอฟเฟกต์ตอบสนองทันที (Zero-Delay Audio Chime) เมื่อกดบันทึก
- ใช้ Web Audio API เล่นเสียงเอฟเฟกต์สังเคราะห์ (Chime/Tone) สั้นๆ ทันทีที่ผู้ใช้คลิกปุ่มบันทึก (โทนสดใสกระชับสำหรับบวกคะแนน และโทนเตือนนุ่มนวลสำหรับหักคะแนน)
- ทำงานทันทีโดยอิสระจากสถานะการรอเครือข่าย เพื่อให้ผู้ใช้งานสัมผัสได้ถึงการตอบสนองของระบบใน 0 วินาที

### R2. เสียงพูดสังเคราะห์ภาษาไทยสรุปผลคะแนนแบบฉับไว (Immediate Thai Speech Summary)
- ในโหมดบันทึกทีละคน (RecordTab):
  - โหลดหรือคำนวณคะแนนสะสมของนักเรียนที่เลือกไว้ล่วงหน้า (Pre-fetch / Optimistic Calculation) เพื่อให้สามารถสร้างและเริ่มเล่นเสียงสรุปภาษาไทยได้ทันทีเมื่อกดบันทึก โดยไม่ต้องรอ round-trip ของ Supabase
  - รูปแบบเสียงพูดสรุป: "เพิ่ม/หัก คะแนนความดีสำเร็จ ชื่อ [ชื่อนักเรียน] เพิ่ม/หัก [X] คะแนน คะแนนคงเหลือ [Y] คะแนน"
- ในโหมดบันทึกหลายคน (BulkRecordTab):
  - เพิ่มเสียงสรุปภาษาไทยทันทีเมื่อกดบันทึก เช่น "บันทึกคะแนนความดีสำเร็จ [X] คน บวก/หักคนละ [Y] คะแนน"
- รวมหรือเรียงประโยคให้พูดต่อเนื่องเป็นธรรมชาติ ไม่สะดุดหรือเว้นวรรคขาดช่วงนาน

### R3. การควบคุมเสียงและความปลอดภัย (Audio Control & Safety Guards)
- เมื่อผู้ใช้กดปุ่มปิด (Dismiss) บนหน้าต่างยืนยันคะแนน หรือเปลี่ยนหน้า ให้สั่งหยุดเสียงพูดและเสียงเอฟเฟกต์ทันที (`stopThaiSpeech`)
- มี Fallback ปลอดภัยหากบราวเซอร์ยังไม่ได้ปลดล็อก AudioContext หรือไม่รองรับ SpeechSynthesis โดยไม่ทำให้การบันทึกข้อมูลหลักเสียหาย
- ไม่กระทบต่อการทำงานเดิมของตาราง `conduct_scores`, RLS, และการแสดงผลของหน้าอื่นๆ

## Verification Resources

- การตรวจสอบการคอมไพล์: `pnpm build`
- สคริปต์ตรวจสอบระบบ: `node scripts/test-conduct-deep-audit.mjs`
- การทดสอบเสียงบน Browser ทั้งบนมือถือและเดสก์ท็อป

## Acceptance Criteria

### Audio & UX Responsiveness
- [ ] เมื่อกดปุ่มบวกหรือหักคะแนน จะได้ยินเสียงเอฟเฟกต์ (Chime) ดังทันทีในเสี้ยววินาทีแรก
- [ ] เสียงพูดภาษาไทยสรุปคะแนนเริ่มเปล่งเสียงทันที ไม่ต้องรอนานหลังกดบันทึก
- [ ] โหมดบันทึกทีละคนพูดสรุปชื่อ, คะแนนบวก/หัก, และคะแนนสะสมอย่างถูกต้องและต่อเนื่อง
- [ ] โหมดบันทึกหลายคนมีเสียงสรุปจำนวนนักเรียนและคะแนนที่บันทึก
- [ ] การกดปิดกล่องยืนยันสามารถหยุดเสียงพูดได้ทันที

### Stability & Backward Compatibility
- [ ] บันทึกคะแนนลงฐานข้อมูล `conduct_scores` ได้ถูกต้องแม่นยำเช่นเดิม
- [ ] ไม่เกิด Uncaught Exception กรณีปิดเสียงหรือไม่มี Audio Device
- [ ] ผ่านคำสั่ง `pnpm build` และชุดตรวจสอบ Deep Audit

## Follow-up — 2026-11-11T15:35:00Z

แก้ไขตำแหน่งสระบน (สระอิ, ไม้หันอากาศ, ไม้ไต่คู้) สำหรับคำควบกล้ำและอักษรนำในโรงละครสระแปลงร่าง (Thai Vowel Morph Studio):
แยกโครงสร้าง DOM พยัญชนะต้นตัวนำ (leading initial) ออกจากพยัญชนะต้นตัวที่ ๒ (target initial) เพื่อให้สระบนเกาะอยู่เหนือกึ่งกลางพยัญชนะต้นตัวที่ ๒ อย่างถูกต้องตามหลักอักขรวิธีไทยของราชบัณฑิตยสภา 100% ทั้ง 200 คำ (hOffset ≤ 1.5px, vGap 1–4px) ครบทุก viewports (360x800, 768x1024, 1280x720)


