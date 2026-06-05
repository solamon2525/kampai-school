# Prompt: สร้างเกม HTML สำหรับระบบ kampai-school

> คัดลอกข้อความทั้งหมดด้านล่างนี้ไปวางให้ AI (ChatGPT / Gemini / Claude / ฯลฯ)
> แล้วบอกไอเดียเกมที่อยากได้ต่อท้าย. ผลลัพธ์ที่ได้จะเชื่อมเข้าระบบเราได้ทันที.

---

คุณคือผู้เชี่ยวชาญสร้างเกมการศึกษาแบบ **single-file HTML** (HTML+CSS+JS ในไฟล์เดียว).
สร้างเกมตามไอเดียที่ฉันจะบอก โดย **ต้องทำตามข้อกำหนดการเชื่อมต่อ (contract) นี้อย่างเคร่งครัด**:

## โครงไฟล์
- เป็นไฟล์ `.html` ไฟล์เดียว รันได้ในเบราว์เซอร์ทันที (เปิดไฟล์ตรง ๆ ก็เล่นได้)
- ใช้ canvas หรือ DOM ก็ได้ · ใช้ CDN ได้ (เช่น Tailwind) · **ห้ามใช้ Firebase / backend อื่น**
- ใส่บรรทัดนี้ใน `<body>` ก่อน script เกม (ระบบจะเสิร์ฟไฟล์นี้ให้เอง):
  ```html
  <script src="/games/kampai-sdk.js"></script>
  <script>
  window.KAMPAI = window.KAMPAI || { isEmbed:false, ready:true, student:null, stats:null, leaderboard:[], input:{up:false,down:false,left:false,right:false,a:false,b:false}, onReady:function(cb){cb(this);}, setSlug:function(){return this;}, submitScore:function(){return false;}, goHome:function(){location.href='/h/nattapong';}, controls:{mount:function(){return this;}}, sound:{correct:function(){},wrong:function(){},timeUp:function(){},gameOver:function(){},speak:function(){},stopSpeak:function(){},fxFlash:function(){},mountToggles:function(){},defaultBgm:function(){},bgmStart:function(){},bgmStop:function(){},unlock:function(){}} };
  </script>
  ```
  (บรรทัด `window.KAMPAI = window.KAMPAI || {...}` คือ fallback ให้เปิดไฟล์ทดสอบเดี่ยว ๆ ได้ไม่พัง)

## API ที่ต้องใช้ (window.KAMPAI)
- `KAMPAI.setSlug('my-game')` — ตั้งครั้งเดียวตอนเริ่ม (ฉันจะบอก slug หรือใช้ค่าชั่วคราวไปก่อน)
- `KAMPAI.onReady(function(k){ ... })` — เรียกเมื่อข้อมูลนักเรียนพร้อม. ใน callback ใช้:
  - `k.student` = `{ displayName, photoUrl, classLabel }` — เอาไปโชว์ชื่อผู้เล่นในเกม
  - `k.stats` = `{ personalBest, playsCount, level, totalXp }` — เอาไปโชว์ **การ์ด "สถิติฉัน"
    ในหน้าเริ่มเกม**: คะแนนสูงสุด (`personalBest`) + จำนวนครั้งที่เล่น (`playsCount`)
  - `k.leaderboard` = array ของ `{ rank, displayName, photoUrl, classLabel, personalBest, isMe }`
    — **เอาไปแสดงตาราง 5 อันดับในหน้าเริ่มเกมและหน้าจบเกม** (ไฮไลต์คนที่ `isMe === true`)
- `KAMPAI.submitScore(score, { mode:'normal', ...extra })` — **เรียกทุกครั้งที่เกมจบ** (สำคัญที่สุด!
  ถ้าไม่เรียก คะแนนจะไม่ถูกบันทึก). `score` เป็นจำนวนเต็ม. `extra` ใส่ข้อมูลเสริมได้ (combo, accuracy ฯลฯ)
- `KAMPAI.goHome()` — ใช้กับปุ่ม "กลับหน้าหลัก" / "เลือกเกมใหม่"

## รองรับ Desktop + มือถือ (บังคับ)
- เดสก์ท็อป: คีย์บอร์ด (ลูกศร/WASD/Space)
- มือถือ: เรียก `KAMPAI.controls.mount({ dpad:true, buttons:['a'] })` → ระบบจะวาดปุ่ม D-pad + ปุ่ม
  บนจอให้อัตโนมัติ (เฉพาะอุปกรณ์ touch) แล้วอ่านสถานะที่ `KAMPAI.input.left/right/up/down/a/b`
  (ปุ่มเหล่านี้ผูกกับคีย์บอร์ดให้ด้วย — เขียนเกมอ่านจาก `KAMPAI.input` ที่เดียวพอ)
- ถ้าเกมเป็นแบบ "แตะเลย" (tap) ก็ใช้ `pointerdown`/`touchstart` ได้ตามปกติ ไม่ต้อง mount controls
- **เกมที่ใช้กล้อง (AR/ตรวจจับร่างกาย):** ต้องมี **แตะสำรอง** เสมอ — กล้อง/สิทธิ์อาจล้ม ต้องเล่นได้แม้ไม่มีกล้อง
- เลย์เอาต์ต้อง responsive เต็มจอทั้งแนวตั้ง/แนวนอน
- **มือถือ (สำคัญ):** เนื้อหาต้องพอดีจอแคบ **~360px โดยไม่ล้นแนวนอน** (ห้ามมี horizontal scroll) —
  ใช้ `flex-col`/`grid-cols-1` บนจอเล็ก, ตัวอักษร/ปุ่ม responsive, ปุ่มกด **ใหญ่พอนิ้ว (≥44px)**,
  ปุ่มสำคัญต้องเห็นโดย **ไม่ต้องเลื่อนหา**. อย่าใส่ความกว้างคงที่ (`width:600px`) — ใช้ `max-w-*` + `w-full`

## เสียง (ระบบเสียงรวม — แนะนำให้ใส่ทุกเกม)
ระบบมีเสียงสำเร็จรูป ไม่ต้องหาไฟล์เสียงเอง — เรียกผ่าน `KAMPAI.sound`:
- ตอนเริ่มเกม: `KAMPAI.sound.defaultBgm('cheerful')` (เพลงพื้นหลัง: cheerful/calm/warm/playful/bright/mellow)
  + `KAMPAI.sound.mountToggles()` (วางปุ่ม 🔊/🗣️/🎵 ให้ผู้เล่นเปิด/ปิดเอง) + `KAMPAI.sound.bgmStart()`
- ตามเหตุการณ์: `KAMPAI.sound.correct()` (ตอบถูก) · `wrong()` (ผิด) · `timeUp()` (หมดเวลา) · `gameOver()` (จบเกม)
- **เกมภาษา (อังกฤษ/คำศัพท์):** `KAMPAI.sound.speak('apple','en-US')` อ่านออกเสียงคำ (TTS) — ช่วยฝึกการฟัง

## โครงสร้างหน้าจอมาตรฐาน (ต้องมีครบ)
เกมทุกเกมในระบบนี้มีโครงสร้างเหมือนกัน — สร้างให้ครบทั้ง 4 จอ/ส่วน:

1. **จอเริ่ม (title)** — ชื่อเกม + **การ์ด "สถิติฉัน"** (คะแนนสูงสุด `personalBest` +
   จำนวนครั้งที่เล่น `playsCount` จาก `k.stats`) + **ตารางอันดับ Top 5** (จาก `k.leaderboard`,
   ไฮไลต์แถว `isMe`) + ปุ่มเริ่มเล่น · ❌ **ไม่มีช่องกรอกชื่อ**
   (ถ้ายังไม่มีข้อมูล เช่นเปิดทดสอบเดี่ยว ๆ → ซ่อนการ์ดสถิติ/อันดับไว้ ไม่ต้องโชว์ค่าว่าง)
2. **ระหว่างเล่น (HUD)** — คะแนนปัจจุบัน + ชีวิต/เวลา (ถ้ามี) + ป้ายชื่อผู้เล่น (`student.displayName`)
3. **จอจบเกม (game over)** — คะแนนรอบนี้ + ตารางอันดับ (ชุดเดียวกับจอเริ่ม) +
   ปุ่ม "เล่นใหม่" + ปุ่มกลับหน้าหลัก (`KAMPAI.goHome()`) · เรียก `KAMPAI.submitScore(...)` ตรงนี้
4. **มือถือ** — `KAMPAI.controls.mount({dpad:true, buttons:[...]})` หรือ tap (`pointerdown`) — เล่นได้ทั้ง desktop + มือถือ

## ห้าม
- ❌ ทำช่องกรอกชื่อผู้เล่น (ใช้ `KAMPAI.student.displayName` แทน)
- ❌ ใช้ Firebase / fetch ไป backend อื่น / ขอ login
- ❌ `window.location.href='...'` เพื่อออกจากเกม (ใช้ `KAMPAI.goHome()`)
- ❌ ส่งคะแนนเป็นทศนิยม หรือส่ง 0 เสมอ — คะแนนต้องสะท้อนผลจริง
- ❌ **ตั้งชื่อตัวแปรทับ JavaScript global** — โดยเฉพาะตัวแปรไอคอน (React/lucide) เช่น
  `const Map = ...`, `const Image/Set/Promise/Text/History/Date/Event = ...` →
  มันทับ global ที่ Tailwind/เบราว์เซอร์ใช้ → **Tailwind ล่มเงียบ ๆ จอเบี้ยวไม่มีสไตล์**
  (ใช้ชื่ออื่น เช่น `MapIcon`, `ImageIcon`)
- ❌ ส่งงานโดยไม่เปิดทดสอบในเบราว์เซอร์จริง (ทั้ง desktop + ย่อจอเป็นมือถือ) — โค้ดผ่าน ≠ จอสวย
- ❌ **โชว์คำตอบ/นับให้อัตโนมัติจนเกมง่ายเกินไป** — อย่าขึ้นตัวเลขที่เฉลยให้ (เช่น "เลือกไปแล้ว 3/8")
  ระหว่างที่เด็กกำลังคิด. ให้เด็ก **คิด/นับเอง** ก่อน แล้วค่อย **เฉลย/ไฮไลต์คำตอบที่ถูกตอน "ตอบผิด"**
  (เรียนรู้จากที่พลาด) — ท้าทายกำลังดีและสอนไปในตัว สำหรับเด็กประถม

## (ออปชัน) ทำเป็นเกมออนไลน์หลายคน — แข่งกันต่างเครื่อง
ถ้าฉันบอกว่าอยากให้ "เล่นด้วยกัน / แข่งออนไลน์" → ใช้เฟรมเวิร์ก `kampai-match.js` (อย่าเขียน lobby/realtime เอง):
- เพิ่ม 2 บรรทัดใน `<body>`:
  ```html
  <script src="/games/kampai-match.js"></script>
  <script>window.KampaiMatch = window.KampaiMatch || { create:function(){return{available:false,openMenu:function(){alert('เล่นผ่านระบบเท่านั้น');},report:function(){},finish:function(){},leave:function(){}};} };</script>
  ```
- สร้าง match ครั้งเดียว + เพิ่มปุ่ม "ออนไลน์" ที่เรียก `match.openMenu()`:
  ```js
  const match = KampaiMatch.create({
    duration: 60,                              // แข่งตามเวลา (วินาที)
    onPlay: ({ rng }) => startGame(rng),       // GO! เริ่มเล่น — ใช้ rng สร้างโจทย์ให้ "ตรงกันทุกเครื่อง"
    onEnd:  () => stopGame(),                   // หมดเวลา → หยุดรับ input
  });
  ```
- ตอนผู้เล่นได้คะแนน เรียก `match.report(score, { correct })` ทุกครั้ง (คู่แข่งจะเห็นคะแนนวิ่งสด + เรียงอันดับ)
- เฟรมเวิร์กจัดการให้หมด: สร้าง/เข้าห้อง (รหัส 4 หลัก) · lobby · นับถอยหลังพร้อมกัน · นาฬิกา · แถบคะแนนสด · อันดับผู้ชนะ · บันทึกคะแนน
- **สำคัญ:** โจทย์ในโหมดออนไลน์ต้องสุ่มจาก `rng` ที่ได้จาก `onPlay` เท่านั้น (อย่าใช้ `Math.random` กับตัวโจทย์) ไม่งั้นแต่ละเครื่องได้คนละโจทย์

## สรุปสิ่งที่ต้องส่งกลับ
ไฟล์ HTML เดียว ที่: ครบ 4 จอตามโครงสร้างมาตรฐาน (จอเริ่มมีการ์ดสถิติฉัน + ตารางอันดับ /
HUD / จอจบมีอันดับ + ปุ่มกลับหน้าหลัก), เล่นได้ทั้ง desktop+มือถือ, โชว์ชื่อผู้เล่น+สถิติ+
leaderboard จาก `KAMPAI`, และเรียก `KAMPAI.submitScore(score)` ตอนจบเกม.

**ไอเดียเกมของฉันคือ:** _(พิมพ์ต่อท้ายตรงนี้ — เช่น "เกมจับคู่คำศัพท์ภาษาอังกฤษ ป.4")_
