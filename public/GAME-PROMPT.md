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
  window.KAMPAI = window.KAMPAI || { isEmbed:false, ready:true, student:null, stats:null, leaderboard:[], input:{up:false,down:false,left:false,right:false,a:false,b:false}, onReady:function(cb){cb(this);}, setSlug:function(){return this;}, submitScore:function(){return false;}, goHome:function(){location.href='/h/nattapong';}, controls:{mount:function(){return this;}} };
  </script>
  ```
  (บรรทัด `window.KAMPAI = window.KAMPAI || {...}` คือ fallback ให้เปิดไฟล์ทดสอบเดี่ยว ๆ ได้ไม่พัง)

## API ที่ต้องใช้ (window.KAMPAI)
- `KAMPAI.setSlug('my-game')` — ตั้งครั้งเดียวตอนเริ่ม (ฉันจะบอก slug หรือใช้ค่าชั่วคราวไปก่อน)
- `KAMPAI.onReady(function(k){ ... })` — เรียกเมื่อข้อมูลนักเรียนพร้อม. ใน callback ใช้:
  - `k.student` = `{ displayName, photoUrl, classLabel }` — เอาไปโชว์ชื่อผู้เล่นในเกม
  - `k.stats` = `{ personalBest, level, totalXp }` — เอาไปโชว์ "สถิติส่วนตัว"
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
- เลย์เอาต์ต้อง responsive เต็มจอทั้งแนวตั้ง/แนวนอน

## ห้าม
- ❌ ทำช่องกรอกชื่อผู้เล่น (ใช้ `KAMPAI.student.displayName` แทน)
- ❌ ใช้ Firebase / fetch ไป backend อื่น / ขอ login
- ❌ `window.location.href='...'` เพื่อออกจากเกม (ใช้ `KAMPAI.goHome()`)
- ❌ ส่งคะแนนเป็นทศนิยม หรือส่ง 0 เสมอ — คะแนนต้องสะท้อนผลจริง

## สรุปสิ่งที่ต้องส่งกลับ
ไฟล์ HTML เดียว ที่: เล่นได้ทั้ง desktop+มือถือ, โชว์ชื่อผู้เล่น+leaderboard จาก `KAMPAI`,
และเรียก `KAMPAI.submitScore(score)` ตอนจบเกม.

**ไอเดียเกมของฉันคือ:** _(พิมพ์ต่อท้ายตรงนี้ — เช่น "เกมจับคู่คำศัพท์ภาษาอังกฤษ ป.4")_
