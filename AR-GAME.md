# AR-GAME.md — โครงร่าง/มาตรฐานเกม AR (กล้อง + เคลื่อนไหวร่างกาย)

> ⚠️ **อ่านไฟล์นี้ก่อนสร้าง/แก้เกม AR ทุกครั้ง** — กันบัคซ้ำเดิม (โดยเฉพาะ layout ยุบ + ไม่มี fallback)
> เกม AR ใช้ engine กลาง `public/games/kampai-ar.js` (`window.KampaiAR`) — แก้ engine ที่เดียว ทุกเกม AR ดีขึ้นพร้อมกัน
>
> **Engine version:** `KampaiAR v1.1.1` · **Doc version:** v1.1.2

## Changelog
- **v1.1.1** — เพิ่มเวลาตัดสินใจทุกเกม AR: `holdMs` default 2000→**2500** + config ทุกเกม `HOLD_MS:2500` / `ROUND_SEC:20` (ดู Tuning Log §6)
- **doc v1.1.1** — เพิ่ม §2.1 Layout patterns: กล้องเต็มจอ (default) vs **กล้องมุมจอ + เกมเต็มจอ** — อ้างอิง `math/math-move-quiz`
- **v1.1.0** — Tier 2: เพิ่มโหมด `hands` (ยกมือ ซ้าย/ขวา/สองมือ → zones, reuse hold→commit), gesture `jump`/`squat` (`onGesture`), พลัง `onEnergy`/`ar.energy`, สัญญาณ `onSignals` + getters `ar.y`/`ar.hands`. **backward compatible** (default = horizontal). เกมตัวอย่าง `english/hands-up-quiz/`
- **v1.0.0** (เริ่มต้น) — engine `kampai-ar.js` (framediff + pose), template `_template-ar/`, เกมตัวอย่าง `demo/ar-zone-quiz/`, verify Check 10

---

## 1. เมื่อไรใช้ AR

| เหมาะ ✅ | ไม่เหมาะ ❌ |
|---|---|
| ตอบด้วยตำแหน่งร่างกาย (ยืนซ้าย/กลาง/ขวา), เล่นเป็นกลุ่มหน้าจอใหญ่, พละ/เคลื่อนไหว | เกมต้องแม่นยำสูง/พิมพ์/ลากวาง · เล่นมือถือจอเล็กคนเดียว (ใช้ปุ่ม/แตะดีกว่า) |

> **บังคับ:** ทุกเกม AR ต้องเล่นได้แม้**ไม่มีกล้อง** (โหมดแตะ) — engine สลับให้อัตโนมัติ แต่เกมต้อง wire ปุ่ม/zone แตะ

## 2. สถาปัตยกรรม

```
config.js  (knob จูน + DETECTOR + เนื้อหา param)  ─┐
data.js    (โจทย์/เนื้อหา)                          ├─► game.js (logic ล้วน)
kampai-sdk.js (คะแนน/leaderboard/เสียง)            │     │ สร้าง KampaiAR.create(...) จาก config
kampai-ar.js  (กล้อง/ตรวจจับ/zone/hold/fallback) ──┘     │ wire onZone/onHoldProgress/onCommit + ar.tap()
                                                          ▼
                                              KAMPAI.submitScore ตอนจบ
```
- **game.js ไม่มี camera code** — กล้อง/loop/cleanup อยู่ใน engine ทั้งหมด
- จูนประสิทธิภาพ = แก้ `config.js` (ไม่แตะ engine/logic) · แก้พฤติกรรมร่วมทุกเกม = แก้ `kampai-ar.js`

### 2.1 Layout: กล้องเต็มจอ vs กล้องมุมจอ (เลือกตามเกม)

engine **ไม่สนขนาดที่โชว์กล้อง** — detection อ่าน `ar.x` (0..1) ไม่ขึ้นกับขนาด video/canvas → จัด layout ได้ 2 แบบ:

| แบบ | เหมาะกับ | `#arVideo` / `#arCanvas` | UI เกม |
|---|---|---|---|
| **A · กล้องเต็มจอ** (default `_template-ar`) | ยืนในโซน · เล่นกลุ่มจอใหญ่ · เห็นตัวเองเต็ม | `position:absolute; inset:0; width:100%; height:100%` (เป็น background) | zone/HUD ลอยทับกล้อง |
| **B · กล้องมุมจอ + เกมเต็มจอ** | โจทย์/คำตอบต้องเด่น (quiz) · เอียงตัวเลือก · เน้นเนื้อหา | กล่องเล็ก `#camBox` (`position:absolute; right/bottom:14px; width:~180px; aspect-ratio:4/3`) — video/canvas เต็มกล่อง | เวที่เกมเต็มจอ (`#gameScreen` มี background เอง) |

> อ้างอิงแบบ B: `public/games/math/math-move-quiz/` (เอียงซ้าย/ขวาเลือก A/B · กล้องมุมล่างขวา · มี tap fallback)

**ทำแบบ B จากเทมเพลต** (หลัง `cp -r _template-ar`):
1. ห่อ `#arVideo`+`#arCanvas` ใน `<div id="camBox">` แล้วตั้ง camBox เป็นกล่องเล็กมุมจอใน `style.css`
2. ให้ `#gameScreen` มี background ของตัวเอง (ไม่ใช่กล้อง) + วาง UI เกม (โจทย์/แผงคำตอบ) เต็มจอ
3. wire `onZone/onHoldProgress/onCommit` → ไฮไลต์ UI เต็มจอ (ไม่ใช่ zone บนภาพกล้อง) · `ar.tap()` ที่แผง/ปุ่ม
4. 🔴 คงกฎ `.screen{position:absolute; inset:0}` เสมอ (Pitfall §4.1) — camBox เป็นลูกที่ตั้งขนาดเอง จึงไม่ยุบ

## 3. Quick start

```
1. cp -r public/games/_template-ar  public/games/{subject}/{slug}
2. config.js : ตั้ง SLUG, DETECTOR ('framediff'|'pose'), HOLD_MS, ZONES, จูน TUNING
3. data.js   : ใส่โจทย์จริง  ·  game.js : ปรับ logic/คะแนนถ้าต้อง
4. ทำปก 16:9 (1280×720) → {slug}/cover.svg|png
5. migration NNN_seed_{slug}_game.sql (รวม game_docs — ดู GAME.md) + apply remote
6. pnpm verify:game public/games/{subject}/{slug}   # ต้องผ่าน + Check 10 AR = ใช้ engine
7. ทดสอบ browser จริงที่มีกล้อง + เครื่องไม่มีกล้อง (โหมดแตะ)
```

## 4. 🔴 Pitfalls (บังคับเช็ก — เคยพังจริง)

1. **container กล้องต้องเต็มจอด้วย `position:absolute; inset:0` — ห้าม `position:relative`**
   `relative` ทำให้ `inset:0` ไม่ทำงาน → ความสูงยุบ **0px** → กล้อง/zone/canvas (ลูก `inset:0`/`height:100%`) ยุบตาม → **ภาพกล้องดำ + แตะ zone ไม่ได้ เล่นไม่ได้** (เคส `fraction-garden-ar`). template baked ไว้ถูกแล้ว — อย่าเผลอ override
2. **cleanup ทุก exit ผ่าน `ar.stop()`** — quit/home/finish/beforeunload + restart. engine เคลียร์ track + loop + interval ให้ (ห้ามลืมเรียก)
3. **บังคับมี tap fallback** — wire `click` ของ zone → `ar.tap(zone)`. เครื่องโรงเรียนหลายเครื่องไม่มีกล้อง/ปฏิเสธสิทธิ์ → ถ้าไม่มี fallback = เล่นไม่ได้
4. **เปิดกล้องตอน user gesture เท่านั้น** — เรียก `ar.start()` ใน handler ปุ่มเริ่ม (ไม่ใช่ตอน load) — กัน autoplay policy + ให้ Check 7 (jsdom) ผ่าน
5. **mirror + flip x** — video `transform: scaleX(-1)` แล้ว engine flip พิกัด `1-x` ให้ตรง (จัดการในนี้แล้ว)
6. **MediaPipe จาก `cdn.jsdelivr.net` เท่านั้น** (`DETECTOR:'pose'`) — cdnjs มัก 404 (engine ใช้ jsdelivr อยู่แล้ว)
7. **verify ≠ ทดสอบกล้อง** — Check 7 ใช้ jsdom mock กล้องเป็น null → "ผ่าน" ไม่ได้แปลว่ากล้องโอเค → **ต้องเปิด browser จริง**

## 5. ตารางจูนประสิทธิภาพ (`config.js` → `TUNING`)

| knob | หน้าที่ | ช่วงแนะนำ | trade-off |
|---|---|---|---|
| `HOLD_MS` | เวลาค้างท่าก่อนคอมมิต | 1200–2500 | ต่ำ=คอมมิตเร็ว/พลาดง่าย · สูง=มีเวลาคิดแต่ช้า |
| `downsample {w,h}` | ความละเอียดก่อน frame-diff | 80×60 – 160×120 | เล็ก=เบา CPU/หยาบ · ใหญ่=แม่น/หนัก |
| `diffThreshold` | ความต่างพิกเซลที่นับว่าขยับ | 25–50 | ต่ำ=ไว/มี noise · สูง=นิ่ง/ต้องขยับเยอะ |
| `minMotionRatio` | สัดส่วนพิกเซลขยับขั้นต่ำ/เฟรม | 0.008–0.03 | ต่ำ=ไวเกิน(จับ noise) · สูง=ต้องขยับทั้งตัว |
| `smoothing` | หน่วงตำแหน่ง (เก่า·s + ใหม่·(1-s)) | 0.6–0.88 | สูง=นิ่ง/หน่วง · ต่ำ=ไว/สั่น |
| `intervalMs` | คาบ loop (framediff) | 40–80 | ต่ำ=ลื่น/กิน CPU · สูง=ประหยัด/หนืด |
| `minConfidence` | ความมั่นใจขั้นต่ำ (pose) | 0.4–0.6 | ต่ำ=จับง่าย/หลอน · สูง=แม่น/หลุดบ่อย |
| `handRaiseMargin` | ข้อมือต้องสูงกว่าไหล่เกินเท่าไร ถึงนับ "ยกมือ" (Tier 2) | 0.03–0.08 | ต่ำ=ยกนิดก็ติด · สูง=ต้องยกสูงชัด |
| `jumpVel`/`squatVel` | ความเร็วแกน Y ของสะโพกที่นับเป็น กระโดด/ย่อ | 0.03–0.07 | ต่ำ=ไว/ false-fire · สูง=ต้องกระโดดแรง |
| `gestureCooldownMs` | เว้นช่วงขั้นต่ำระหว่าง gesture | 500–900 | กัน double-fire |

> ค่า default ของ engine = "ค่ากลางที่ดีที่สุดปัจจุบัน" — ปรับ default ที่ `kampai-ar.js` `DEFAULT_TUNING` = มีผลทุกเกม

### Tier 2 — รูปแบบตรวจจับเพิ่ม (v1.1.0)
| รูปแบบ | ใช้ยังไง | detector |
|---|---|---|
| **ยกมือ** (`mode:'hands'`) | zones = `['left','right','both']` (ยกมือซ้าย/ขวา/สองมือ) → onZone/hold/commit เดิม + `ar.tap('left'\|'right'\|'both')` | pose (framediff = best-effort) |
| **กระโดด/ย่อ** | `onGesture('jump'\|'squat')` (discrete, ไม่ใช้ hold) | pose แนะนำ |
| **พลังเคลื่อนไหว** | `onEnergy(0..1)` / `ar.energy` (วิ่งอยู่กับที่/เขย่า → เติม meter) | ทั้งสอง |
> เกมอ้างอิงโหมด hands: `public/games/english/hands-up-quiz/`

## 6. Performance Tuning Log (append-only — สะสมความรู้ "ปรับเรื่อยๆ")

| วันที่ | อาการ/อุปกรณ์ | knob ที่ปรับ | ผล |
|---|---|---|---|
| 2026-06-20 | (เริ่มต้น) `fraction-garden-ar` คอมมิตเร็วไป บนแท็บเล็ตโรงเรียน | `HOLD_MS` 1200→2000 | มีเวลาตัดสินใจขึ้น |
| 2026-06-22 | ทุกเกม AR — ขอเวลาตัดสินใจมากขึ้น (เซนเซอร์รอคำตอบ) | `holdMs` default 2000→2500 + ทุก config `HOLD_MS`→2500, `ROUND_SEC`→20 | ค้างนานขึ้นก่อนล็อก + มีเวลาคิดต่อข้อมากขึ้น (เปลี่ยนใจได้) |
| _เพิ่มแถวใหม่ทุกครั้งที่จูน_ | | | |

## 7. Engine API (`window.KampaiAR`)

```js
const ar = KampaiAR.create({
  video:'#arVideo', canvas:'#arCanvas',
  detector:'framediff'|'pose',
  mode:'horizontal'|'hands',                   // v1.1.0 — 'hands' = zones จากการยกมือ (default 'horizontal')
  zones:['left','center','right'], holdMs:2500, tuning:{...},
  onZone(zone){}, onHoldProgress(zone,pct){}, onCommit(zone){}, onStatus(s){}, // 'camera-on'|'no-camera'|'pose-loading'|'error'
  onSignals(s){}, // v1.1.0 ต่อเนื่อง: {x,y,energy,leftUp,rightUp,bothUp}
  onGesture(g){}, // v1.1.0 discrete: 'jump' | 'squat'
  onEnergy(level){} // v1.1.0 พลัง 0..1
});
await ar.start();   // ขอกล้อง (เรียกใน gesture) — reject → onStatus('no-camera') อัตโนมัติ
ar.setActive(true); // เปิดรับ input ต่อรอบ (false ช่วง feedback)
ar.tap('left');     // fallback แตะ → path เดียวกับ hold ครบ (โหมด hands ใช้ 'left'|'right'|'both')
ar.stop();          // cleanup ครบ (track + loop + interval)
// props: ar.mode ('camera'|'tap'), ar.x/ar.y (0..1), ar.energy (0..1), ar.hands ({left,right,both}), ar.zone
```

## 8. Testing

1. `pnpm verify:game <path>` → Check 10 AR ต้อง "ใช้ KampaiAR engine"
2. **browser จริงมีกล้อง** (`/play`): ขยับตัว → marker/zone ตาม · ค้างครบ → ตอบ · ปิดสิทธิ์กล้อง → เข้าโหมดแตะ
3. **headless** (puppeteer `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream`): เช็ก gameScreen ไม่ยุบ 0px · `elementFromPoint(กลางจอ)` = zone · แตะ → commit · `ar.stop()` เคลียร์ loop · ไม่มี console error (ดู pattern ที่เทสต์ `demo/ar-zone-quiz`)
4. สลับ `DETECTOR:'framediff' ↔ 'pose'` ใน config แล้วเล่นได้ทั้งคู่

> เกมอ้างอิง: `public/games/demo/ar-zone-quiz/` (engine ครบ + เล่นได้จริง) · เกม AR เดิม (`english/vocab-move.html`, `math/fraction-garden-ar.html`) ค่อยทยอยย้ายมาใช้ engine (ลง Tuning Log)
