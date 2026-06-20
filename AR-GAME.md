# AR-GAME.md — โครงร่าง/มาตรฐานเกม AR (กล้อง + เคลื่อนไหวร่างกาย)

> ⚠️ **อ่านไฟล์นี้ก่อนสร้าง/แก้เกม AR ทุกครั้ง** — กันบัคซ้ำเดิม (โดยเฉพาะ layout ยุบ + ไม่มี fallback)
> เกม AR ใช้ engine กลาง `public/games/kampai-ar.js` (`window.KampaiAR`) — แก้ engine ที่เดียว ทุกเกม AR ดีขึ้นพร้อมกัน
>
> **Engine version:** `KampaiAR v1.0.0` · **Doc version:** v1.0.0

## Changelog
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

> ค่า default ของ engine = "ค่ากลางที่ดีที่สุดปัจจุบัน" — ปรับ default ที่ `kampai-ar.js` `DEFAULT_TUNING` = มีผลทุกเกม

## 6. Performance Tuning Log (append-only — สะสมความรู้ "ปรับเรื่อยๆ")

| วันที่ | อาการ/อุปกรณ์ | knob ที่ปรับ | ผล |
|---|---|---|---|
| 2026-06-20 | (เริ่มต้น) `fraction-garden-ar` คอมมิตเร็วไป บนแท็บเล็ตโรงเรียน | `HOLD_MS` 1200→2000 | มีเวลาตัดสินใจขึ้น |
| _เพิ่มแถวใหม่ทุกครั้งที่จูน_ | | | |

## 7. Engine API (`window.KampaiAR`)

```js
const ar = KampaiAR.create({
  video:'#arVideo', canvas:'#arCanvas',
  detector:'framediff'|'pose', zones:['left','center','right'], holdMs:2000, tuning:{...},
  onZone(zone){}, onHoldProgress(zone,pct){}, onCommit(zone){}, onStatus(s){}  // 'camera-on'|'no-camera'|'pose-loading'|'error'
});
await ar.start();   // ขอกล้อง (เรียกใน gesture) — reject → onStatus('no-camera') อัตโนมัติ
ar.setActive(true); // เปิดรับ input ต่อรอบ (false ช่วง feedback)
ar.tap('left');     // fallback แตะ → path เดียวกับ hold ครบ
ar.stop();          // cleanup ครบ (track + loop + interval)
// props: ar.mode ('camera'|'tap'), ar.x (0..1), ar.zone, ar.VERSION ผ่าน KampaiAR.VERSION
```

## 8. Testing

1. `pnpm verify:game <path>` → Check 10 AR ต้อง "ใช้ KampaiAR engine"
2. **browser จริงมีกล้อง** (`/play`): ขยับตัว → marker/zone ตาม · ค้างครบ → ตอบ · ปิดสิทธิ์กล้อง → เข้าโหมดแตะ
3. **headless** (puppeteer `--use-fake-ui-for-media-stream --use-fake-device-for-media-stream`): เช็ก gameScreen ไม่ยุบ 0px · `elementFromPoint(กลางจอ)` = zone · แตะ → commit · `ar.stop()` เคลียร์ loop · ไม่มี console error (ดู pattern ที่เทสต์ `demo/ar-zone-quiz`)
4. สลับ `DETECTOR:'framediff' ↔ 'pose'` ใน config แล้วเล่นได้ทั้งคู่

> เกมอ้างอิง: `public/games/demo/ar-zone-quiz/` (engine ครบ + เล่นได้จริง) · เกม AR เดิม (`english/vocab-move.html`, `math/fraction-garden-ar.html`) ค่อยทยอยย้ายมาใช้ engine (ลง Tuning Log)
