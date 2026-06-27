# ORIENT-GAME.md — มาตรฐานเกมแนวตั้ง / แนวนอน

> **Single source สำหรับ orientation** — อ่านก่อนทำ runner, split-screen, หรือเกมที่ต้องหมุนจอ
> Engine กลาง: `/games/kampai-orient.js` · เทมเพลต: `cp -r public/games/_template-orient`

---

## ⚡ TL;DR

```
1. cp -r public/games/_template-orient  public/games/{subject}/{slug}
2. config.js → ORIENTATION: 'any' | 'portrait' | 'landscape'
3. โหลด kampai-orient.js ก่อน game.js (เทมเพลตมีให้แล้ว)
4. resize canvas ด้วย KampaiOrient.getViewportSize() — อย่าใช้ innerWidth ตรง ๆ ใน iframe
5. ปุ่มควบคุม: dpad SDK ซ้าย · ปุ่มเสียง SDK ขวาล่าง (kampai-sdk.js)
```

---

## 🧭 เลือก ORIENTATION

| ค่า | เมื่อไหร่ | ตัวอย่าง |
|---|---|---|
| `any` | quiz, puzzle, HUD ทั่วไป | coin-exchange, spelling |
| `landscape` | runner, แข่งรถ, split-screen 2P | math-runner |
| `portrait` | one-hand, stack, flappy แนวตั้ง | (เกมใหม่ที่ออกแบบแนวตั้ง) |

---

## 📦 KampaiOrient API

```html
<script src="/games/kampai-sdk.js"></script>
<script src="/games/kampai-orient.js"></script>
```

```js
KampaiOrient.init({
  prefer: CFG.ORIENTATION,           // 'any' | 'portrait' | 'landscape'
  lockOnStart: CFG.LOCK_ORIENTATION_ON_START,
  overlayLandscape: 'ข้อความ overlay แนวนอน (HTML ได้)',
  overlayPortrait: 'ข้อความ overlay แนวตั้ง',
  onChange: ({ portrait, landscape, blocked, viewport }) => { resizeCanvas(); },
  onPauseChange: (paused) => { /* หยุด loop เมื่อแนวจอผิด */ },
});

// ก่อนเริ่มเกม
if (!KampaiOrient.canStart()) return;

// ตอน startGame
KampaiOrient.notifyGameStart();  // แจ้ง PlayGame iframe
KampaiOrient.setPlaying(true);

// ใน game loop
if (KampaiOrient.isPaused()) { requestAnimationFrame(loop); return; }

// resize
const { w, h } = KampaiOrient.getViewportSize();
canvas.width = w; canvas.height = h;
```

**Body classes (CSS hook):**

| Class | ความหมาย |
|---|---|
| `ui-portrait` | จอแนวตั้งตอนนี้ |
| `ui-landscape` | จอแนวนอน · เมนู 2 คอลัมน์บน touch (จาก kampai-orient.css) |
| `show-rotate` | แสดง `#rotate-overlay` (บังคับแนวจอ · standalone) |
| `is-touch` | `(pointer: coarse)` |
| `ko-blocked` | แนวจอไม่ตรง prefer |

---

## 🖼️ Layout มาตรฐาน

```
┌─────────────────────────────────────┐
│ HUD (บน · safe-area)                │
│                                     │
│         พื้นที่เกม (canvas)         │
│                                     │
│ ▲▼ dpad          🔊🗣️🎵 ปุ่มเสียง   │
│ (ซ้ายล่าง)         (ขวาล่าง SDK)    │
└─────────────────────────────────────┘
```

- **HUD** อยู่ด้านบน — อย่าวางปุ่มสำคัญมุมล่างซ้าย/ขวา
- **ปุ่มเสียง** ใช้ `KAMPAI.sound.mountToggles()` — default มุมล่างขวา (อย่า override ไปซ้าย)
- **D-pad** `KAMPAI.controls.mount()` — ซ้ายล่าง · 2P แยกซ้าย/ขวา (ดู math-runner)

---

## 📱 Embed ใน PlayGame (iframe not iframe gotchas)

| สถานการณ์ | พฤติกรรม |
|---|---|
| เกมใน iframe + `ORIENTATION: landscape` | overlay หมุนจอ = **parent** (PlayGame) · เกมใช้ `canStart()` = true ใน iframe |
| `kampai:parentViewport` | parent ส่ง `{ type, landscape, width, height }` · KampaiOrient ฟังให้อัตโนมัติ |
| `kampai:gameStart` | เรียก `notifyGameStart()` ก่อนเริ่ม session |
| PWA manifest | ตั้ง `"orientation": "any"` ถ้าเกมต้องหมุนได้ (ดู math-runner migration) |

---

## 🔄 ปรับปรุงเรื่อย ๆ (where to edit)

| ต้องการแก้ | แก้ที่ |
|---|---|
| ตรวจจอ / overlay / iframe | `public/games/kampai-orient.js` |
| ตำแหน่งปุ่มเสียง / dpad | `public/games/kampai-sdk.js` |
| เมนู 2 คอลัมน์ landscape | `kampai-orient.js` (`.menu-body` grid) + `style.css` เกม |
| เทมเพลตเริ่มต้น | `public/games/_template-orient/` |
| เกม landscape ขั้นสูง (2P split) | อ้างอิง `math/math-runner/` |

---

## ✅ Checklist ก่อ ship

- [ ] `ORIENTATION` ใน config ตรงกับดีไซน์จริง
- [ ] `#rotate-overlay` ใน index.html (ถ้า ≠ any)
- [ ] `resize` ใช้ `KampaiOrient.getViewportSize()`
- [ ] loop เคารพ `KampaiOrient.isPaused()`
- [ ] `pnpm verify:game` ผ่าน 9/9 + ปก 16:9
- [ ] ทดสอบมือถือ: portrait + landscape + embed `/play/{slug}`

---

## 🔗 อ่านเพิ่ม

- `GAME.md` — integration ทั่วไป
- `AR-GAME.md` — เกมกล้อง (orientation แยกต่างหาก)
- `public/GAME-PROMPT.md` — prompt ให้ AI สร้างเกม
