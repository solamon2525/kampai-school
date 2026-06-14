---
description: หาบัคในเกม HTML/JS แบบ evidence-first ไล่ทีละระบบ + กัน false-positive — list ก่อนแก้
argument-hint: <path-to-game.html|folder> [อาการ/ขอบเขตที่อยากให้เน้น]
---

# /hunt-game-bugs $ARGUMENTS

คุณคือ **นักหาบัคเกม kampai-school** ทำงานแบบ evidence-first ลึก และ **กันการรายงานผิด**
เป้าหมายไม่ใช่ "หาบัคให้ได้เยอะ" แต่คือ **หาบัคจริงโดยไม่หลอน ไม่โทษผิดตัว ไม่แตะของที่ถูกอยู่แล้ว**

---

## ⛔ กฎเหล็ก (operating rules) — อ่านก่อนเริ่ม

1. **ลิสต์ก่อน ห้ามแก้** — รอบนี้ **ห้าม** regenerate / เขียนโค้ดใหม่ / แก้ไฟล์เกมเด็ดขาด
   ออกมาเป็น **list** อย่างเดียว รอ user เลือกว่าจะแก้ข้อไหนก่อน
2. **Evidence-first** — ทุก finding ต้องมีครบ:
   - (ก) `file:line` + **quote โค้ดจริง** ที่คุณเปิดอ่านมากับตา (ไม่ใช่จำ/เดา)
   - (ข) **trigger** — เล่นยังไง/กดอะไรถึงเจออาการ
   - (ค) **tag ความมั่นใจ**: `[ยืนยันจากโค้ด]` (เห็นชัดในโค้ด) หรือ `[ต้องลองใน browser]` (สงสัย ต้องรันจริงยืนยัน)
   - ❌ ห้าม assert บัคที่ยังไม่ได้เปิดไฟล์อ่านบรรทัดนั้นจริง
3. **Scope guard** — รีวิว **เฉพาะระบบที่เจอ signature จริง** (ดู STEP 1) ระบบไหนเกมไม่มี → ข้าม ห้ามเดาบัค
4. **Self-check ก่อน output** (STEP 5) — ไล่ยืนยันทุกบรรทัดที่อ้าง + เทียบกับ "ห้าม flag list" →
   ตัด finding ที่ยืนยันไม่ได้หรือชนกับ guard ทิ้ง

---

## STEP 0 — แยก argument

- **token แรก** ของ `$ARGUMENTS` = path เกม (ไฟล์ `.html` หรือโฟลเดอร์)
- **ที่เหลือ** (ถ้ามี) = อาการ/ขอบเขตที่ user อยากให้เน้น เช่น `... เสียงค้างตอนออกเกม`
  → ถ้ามี ให้ยกเรื่องนี้เป็น **priority อันดับ 1** ของการรีวิว แล้วค่อยไล่ระบบอื่นต่อ

---

## STEP 1 — อ่านบริบท + ตรวจว่าเกมมี "ระบบ" อะไรบ้าง

- อ่าน `GAME.md` (โฟกัส section anti-patterns + score formula)
- อ่านไฟล์เกมที่ path:
  - ไฟล์ `.html` เดี่ยว → อ่านทั้งไฟล์ (ไฟล์ใหญ่มาก → อ่านเป็นช่วง อย่าข้าม logic หลัก)
  - โฟลเดอร์ → อ่าน `index.html` + `style.css` + `config.js` + `data.js` + `game.js` ให้ครบ
- grep หา signature เพื่อ **scope** การรีวิว (ระบบไหนไม่เจอ = ข้ามหัวข้อนั้นใน STEP 3):

  | ระบบ | signature ที่ใช้ตรวจ |
  |---|---|
  | SDK vs legacy | `kampai-sdk.js` / `KAMPAI\.` ↔ `function sendGameEnd(` |
  | canvas loop | `getContext('2d')` + `requestAnimationFrame` |
  | เสียงที่เขียนเอง (นอก SDK) | `new AudioContext` / `webkitAudioContext` / `<audio` |
  | online / PvP | `KAMPAI.online` / `kampai-match.js` / `ENABLE_ONLINE` |
  | touch / มือถือ | `touchstart` / `controls.mount` / `KAMPAI.input` |

---

## STEP 2 — รัน verify แล้ว "ตีความให้ถูก"

```
rtk pnpm verify:game <path>
```

⚠️ **กล่องเตือนการตีความ** (verify มี trap — อย่าสรุปผิด):

- **Check 7 (render smoke-test) mock `canvas.getContext`→null และ `AudioContext`→noop**
  → เกมที่เป็น canvas หรือมีเสียง **"ผ่าน Check 7" ไม่ได้แปลว่า render/เสียงจริงโอเค**
  ของพวกนี้ต้องติด tag `[ต้องลองใน browser]` เสมอ
- **Check 7 ขึ้น "ข้าม"** สำหรับเกม vanilla non-SDK → **ไม่ใช่ความผิด** อย่ารายงานว่า "ตก"
- **Check 5**: SDK ต้องเรียก `KAMPAI.submitScore(` **≥1 ครั้ง**; legacy ต้อง `sendGameEnd(` **≥2** (define + call)
- **เกมโฟลเดอร์**: verify รวม sibling `.js` (config/data/game) เข้าสแกนให้แล้ว แต่ **ข้าม** `/games/*.js` (framework)

สรุปผล verify เป็นข้อ ๆ ก่อน (ตก check ไหน = severity สูง เพราะบล็อก commit) แล้วค่อยไปรีวิว manual

---

## STEP 3 — รีวิว manual ทีละระบบ (เฉพาะที่ detect เจอใน STEP 1)

### 🧭 ตารางความรับผิดชอบ — "โทษให้ถูกตัว" (อ่านก่อนรีวิว)

| เรื่อง | เจ้าของ → รายงานยังไง |
|---|---|
| reset state / `cancelAnimationFrame` ตอนจบ-ออก / `bgmStop()` ตอนจบ-ออก / เรียก `online.leave()` | **เกม** — SDK ไม่ทำให้ ถ้าขาด = บัคจริง |
| AudioContext resume, กันส่ง score ซ้ำ, init listener, ready fallback 1.2s, TTS กันพูดซ้อน | **SDK** — จัดการแล้ว **ห้าม flag** (ดู STEP 3.5) |
| Supabase realtime channel cleanup, ส่ง `init` | **wrapper (`PlayGame.tsx`)** — ไม่ใช่บัคในไฟล์เกม |

### 🔁 เช็กแรกสุด — Lifecycle pairing (ของจริงที่เจอบ่อยสุดในเกมหลายโหมด)

ก่อนไล่หัวข้ออื่น ให้ทำตารางคู่ **start ↔ stop** ก่อน: ทุกอย่างที่ "เปิด/เริ่ม/เพิ่ม" ต้องมีคู่
"ปิด/หยุด/ถอด" ใน **ทุก exit path ของทุกโหมด** (race/endless/daily/online/practice + ออกกลางเกม):

| เปิด/เริ่ม | ต้องมีคู่ | ตรวจทุก exit ไหม |
|---|---|---|
| `bgmStart()` | `bgmStop()` | จบเกม **ทุกโหมด** + online `onEnd` + goHome |
| `requestAnimationFrame` | `cancelAnimationFrame` | จบ/ออก/เปลี่ยนข้อ |
| `body.classList.add('x')` / โหมดพิเศษ | `.remove('x')` | เมื่อพ้นสถานะนั้น ไม่ใช่แค่ตอนจบเกม |
| `setInterval` / `speak()` / `online.join()` | `clearInterval` / `stopSpeak()` / `online.leave()` | ออก/จบ |
| UI element โชว์ (`display=''`) | ซ่อนหรือปรับตามโหมด | โหมดที่ไม่ใช้ element นั้น (เช่น lives ในโหมดที่ไม่หักชีวิต) |

> ⚠️ เกมหลายโหมดเขียน exit path **แยกกันต่อโหมด** → cleanup มักหลุดไปบางโหมด. จุดที่เจอบ่อย:
> online `onEnd` ลืม `bgmStop()`; โหมด timed ลืมจัดการตอนสลับแท็บ (rAF throttle); UI reuse ข้ามโหมด

### หัวข้อรีวิว

- **Game state** — `score`/`level`/`lives`/`combo` ติดลบ, เกินลิมิต, overflow; เริ่มเกมใหม่แล้ว
  **reset ครบทุกตัวแปร** ไหม (timer/loop ซ้อน, คะแนนค้างจากรอบก่อน); เปลี่ยนค่า **ผิดจังหวะ**
  (บวกคะแนนก่อนเช็กคำตอบ, ลด life หลังเกมจบ); ส่ง score เป็น **integer**
- **เสียง** — รายงานเฉพาะเมื่อ (ก) เกมเขียน `AudioContext` เอง (นอก SDK) แล้วจัดการพลาด **หรือ**
  (ข) เกม **ลืมเรียก `bgmStop()`** ตอนจบ/ออก (เพลงค้างต่อ — เคสจริงที่เจอบ่อย).
  ถ้าเกมแค่ใช้ `KAMPAI.sound.*` ปกติ → **ไม่ใช่บัค**
- **Canvas / render** — `requestAnimationFrame` loop **ไม่ถูก `cancelAnimationFrame`** ตอนจบ/ออกจอ
  (loop leak: หลายลูปทับกัน เกมเร็วขึ้น/กิน CPU); entity array ไม่เคยล้าง (memory leak);
  ไม่ `clearRect` / วาดทับผิด z-order
- **Online / PvP** (ถ้ามี) — race condition ตอนหลายคนอัปเดตพร้อมกัน; handle disconnect/ออกกลางคัน;
  **ลืม `KAMPAI.online.leave()`** ตอนออก; seeded RNG ทำให้คำถามตรงกันทุกเครื่องไหม
- **touch / มือถือ** — touch event ครบไหม; **double-tap zoom** กวนตอนกดรัว (`touch-action`);
  ปุ่ม **≥44px** + ระยะห่างพอ (นิ้วเด็ก ป.4–5); HUD/ปุ่มเกมทับ **ปุ่มเสียง top-left** (`#kampai-snd`, z-40) ไหม

---

## STEP 3.5 — 🛡️ FALSE-POSITIVE GUARD (ห้าม flag เด็ดขาด)

สิ่งเหล่านี้ "เหมือนบัค" แต่ SDK **ตั้งใจทำ** — ถ้าจะรายงาน ให้หยุดแล้วตัดทิ้ง:

- `submitScore` คืน `false` ตอน standalone หรือ `!K.student` → **no-op สำหรับเทสต์** (sdk:55) ✋
- กันส่ง score ซ้ำด้วยธง `_submitted` แล้ว (sdk:56) → **อย่าเตือน "submit ซ้ำ"** ✋
- `_ac()` resume `AudioContext` ให้เอง + มี `unlock()` (sdk:263) → **เกมไม่ต้องจัด autoplay policy เอง** ✋
- BGM mp3 ใช้ `.play().catch()` กัน autoplay ถูกบล็อกแล้ว (sdk:300) ✋
- `setTimeout(fireReady, 1200)` = กันค้างถ้า init ไม่มา → **ตั้งใจ ไม่ใช่ leak** (sdk:133) ✋
- `window.parent.postMessage(..., '*')` = wire format มาตรฐานของระบบ → **ไม่ใช่ช่องโหว่ที่ต้องแก้ในเกม** ✋
- TTS `speak()` early-return เมื่อกำลังพูดอยู่ = กันพูดซ้อน (sdk:291); `correct/wrong/...` no-op เมื่อ toggle ปิด → **ตั้งใจ** ✋

> ⚠️ ถ้าจะรายงานเรื่องที่เกี่ยวกับ SDK ให้ **เปิด [kampai-sdk.js](public/games/kampai-sdk.js) อ่านยืนยันก่อน**
> ว่า SDK ไม่ได้จัดการให้แล้ว — มิฉะนั้นถือเป็น false positive

---

## STEP 4 — Persona test "เด็ก ป.4 กดมั่ว ๆ"

จำลองพฤติกรรมเด็กกดมั่ว แล้วชี้จุดพังจริง (ผูกกับ **state/loop ของเกม** ไม่ใช่ SDK guard):
- **กดคำตอบ/Start รัว ๆ** → นับคะแนนซ้ำ? เริ่มเกมซ้อน? เสียงรัว?
- **กด goHome / ย้อนกลับกลางเกม** → timer/rAF loop/BGM ของเกมยังทำงานต่อหลังออกไหม (ลืม stop/cancel)?
- **ปิด/เปิดแท็บ (visibilitychange)** → กลับมาแล้ว timer กระโดด / loop ซ้อน / state เพี้ยน?
- **กดตอบก่อนข้อมูลมา (`KAMPAI.ready` ยัง false)** → พังไหม?
- **submit ซ้ำ** → ดู STEP 3.5 (SDK กันให้แล้ว) — รายงานเฉพาะถ้าเกมส่งคะแนนซ้ำ **ก่อน**ถึง SDK (เช่น loop คำนวณผิด)

---

## STEP 5 — Self-check แล้วค่อย output

**ก่อนพิมพ์ผลลัพธ์ ทำ self-check เงียบ ๆ:**
1. ทุก finding มี `file:line` + quote จริงไหม? เปิดอ่านบรรทัดนั้นซ้ำ ยืนยันว่ามีจริง
2. ชนกับ FALSE-POSITIVE GUARD ไหม? ถ้าชน → ตัดทิ้ง
3. โทษถูกตัวตาม "ตารางความรับผิดชอบ" ไหม?
4. ติด tag ความมั่นใจถูกไหม (canvas/เสียง = `[ต้องลองใน browser]`)?

**รูปแบบ output** — list เรียงตามความรุนแรง (🔴 พังจริง → 🟡 ควรแก้ → 🟢 ปรับให้ดีขึ้น):

```
🔴 [ระบบ] path/to/file.js:123 — ฟังก์ชัน endGame()   [ยืนยันจากโค้ด]
   โค้ด:    requestAnimationFrame(loop);   // ← ไม่เคยเก็บ id ไว้ cancel
   อาการ:   กด "เล่นอีกครั้ง" → loop เก่ายังวิ่ง ซ้อนลูปใหม่ เกมเร็วขึ้นทุกรอบ
   เจ้าของ: เกม
   วิธีแก้:  เก็บ id = requestAnimationFrame(...) แล้ว cancelAnimationFrame(id) ตอน endGame/goHome
```

ปิดท้าย:
> เจอ N จุด (🔴 x / 🟡 y / 🟢 z) — อยากให้ลงมือแก้ข้อไหน? (บอกเลขข้อ หรือ "ทั้งหมด")

**ย้ำ: รอบนี้แค่ลิสต์ — ห้ามแก้โค้ดจนกว่า user จะเลือกข้อ**
