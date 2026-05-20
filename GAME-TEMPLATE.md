# 🎮 Game Template — คู่มือสร้างเกมการศึกษาสำหรับ kampai-school

> Spec & playbook สำหรับใช้กับไฟล์ `public/games/_template.html`
> ใช้สร้างเกมใหม่ — single-file HTML — ที่บันทึกคะแนน/XP/Badge ผ่านระบบ kampai
> เวอร์ชัน 1.0 (ตั้งแต่ commit `90e8285`)

---

## 1. ทำไมเลือก single-file?

**Single-file (.html ไฟล์เดียว) เหมาะกับ kampai-school เพราะ:**

| ปัจจัย | Single-file | Multi-file |
|---|---|---|
| Admin UI อัพโหลด | ✅ มีแล้ว (drag .html) | ❌ ต้อง refactor รับ ZIP |
| Storage bucket scheme | ✅ `{subject}/{slug}.html` | ❌ ต้องเป็นโฟลเดอร์ |
| v.1 → v.2 ทับไฟล์ | ✅ admin UI ปุ่ม "อัพเดท v.2" | ⚠️ ต้อง re-upload หลายไฟล์ |
| Standalone เล่นได้ | ✅ เปิดในเบราว์เซอร์อะไรก็ได้ | ⚠️ ต้อง serve folder |
| AI สร้างให้ (Claude/Cursor) | ✅ generate ไฟล์เดียวเร็ว | ⚠️ generate หลายไฟล์ช้า + path ผิด |
| Debug | ✅ View source ดูได้หมด | ⚠️ ดูแยกหลายแท็บ |
| Game ใหญ่ ๆ (>10k lines) | ⚠️ จัดการยาก | ✅ tooling ช่วย |

**สรุป:** เกมโรงเรียน (เน้นง่ายต่อครู + AI สร้างได้) → single-file ดีกว่า
**เมื่อไหร่ค่อยพิจารณา multi-file:** เกมใหญ่มาก, ทีม dev ทำเกมเดียว, ใช้ engine ร่วม 10+ เกม

---

## 2. Quick start (5 ขั้นตอน)

```
1. Copy public/games/_template.html → public/games/<subject>/<slug>.html
   เช่น: public/games/thai/my-spelling-game.html

2. แก้ <title> + <slug> ใน gameOver() ให้ตรงกัน
   gameSlug: 'TODO-CHANGE-ME'  →  gameSlug: 'my-spelling-game'

3. เขียนเกมในส่วน SECTION B (TODO sections)

4. อัพโหลดผ่าน Admin Dashboard:
   /admin/dashboard/educational-hub → tab "เกม HTML" → "อัพโหลดเกมใหม่"
   (admin set tracked_game=true + game_slug=<slug> ใน item form)

5. ทดสอบที่ /play/<slug> → กรอกรหัสนักเรียน → เล่น → score เข้าระบบ
```

---

## 3. โครงสร้าง template

### A. **SECTION A — KAMPAI INTEGRATION BOILERPLATE** (ห้ามแก้)

ส่วนนี้ทำงานร่วมกับ PlayGame wrapper อย่ายุ่ง:

| # | สิ่งที่ทำ | ทำไม |
|---|---|---|
| 1 | `EMBED` detection (`?embed=1`) | แยก standalone vs iframe |
| 2 | `STUDENT_CODE` caching (postMessage init) | ผูก score กับ student |
| 3 | `SESSION_START_TS` | คำนวณ duration metric |
| 4 | `IS_TOUCH` detection | สลับ control scheme |
| 5 | Anchor `target="_top"` interceptor | iframe-safe navigation (postMessage `{type:'navigate', to: href}`) |
| 6 | `score` state + `setScore()` + HUD | UI + pop animation |
| 7 | `lives` state + `setLives()` + HUD | ❤️ × 3 — ลบทิ้งได้ถ้าเกมไม่ใช้ |
| 8 | `gameOver()` + postMessage `{type:'gameEnd', score, metadata}` | ส่งคะแนนกลับ wrapper |

### B. **SECTION B — TODO: GAME LOGIC** (ครู/AI เขียนตรงนี้)

ใน template ปัจจุบันมี mini-game ตัวอย่าง **"Tap the Dot"** ใช้ canvas:
- จุดสีแดงเด้งสุ่ม → tap ทัน +50 → miss = -1 life
- ลบ/แทนที่ section นี้ได้ทั้งหมดเมื่อจะเริ่มเกมจริง

**สิ่งที่ต้องปรับ:**
1. **เปลี่ยน `gameSlug`** — ใน `gameOver()` ให้ match `game_slug` ที่ admin ตั้งใน DB
2. **Game state** — ตัวแปรของเกมคุณ
3. **Game loop / event handlers** — รับ input + update state
4. **Scoring rules** — เรียก `setScore()` เมื่อตอบถูก/ผิด
5. **Win/Lose condition** — เรียก `gameOver()` เมื่อจบ

### C. **SECTION C — ENTRY POINT** (`window.startGame`)

จุดเริ่มต้นเมื่อ user กดปุ่ม "เริ่มเกม":
- ซ่อน `#blocker`
- เริ่ม `SESSION_START_TS`
- โชว์ touch hint (ถ้า mobile)
- เริ่ม game loop / spawn เริ่ม

---

## 4. Naming conventions

| สิ่ง | กฎ | ตัวอย่าง |
|---|---|---|
| **Slug** | a-z, 0-9, `-` เท่านั้น | `pizza-master-chef`, `attack-on-noun`, `my-spelling` |
| **Filename** | `<slug>.html` | `pizza-master-chef.html` |
| **Subject folder** | `math`, `tech`, `thai`, `science`, ... | `public/games/thai/my-game.html` |
| **gameSlug ใน postMessage** | ต้อง = slug ในชื่อไฟล์ + game_slug ใน DB | `gameSlug: 'pizza-master-chef'` |

---

## 5. Upload workflow

### A. ผ่าน Admin UI (สำหรับ admin/ครู)
1. Login admin → `/admin/dashboard/educational-hub` → tab **"เกม HTML"**
2. คลิก **"อัพโหลดเกมใหม่"** กรอก:
   - **เจ้าของ:** ครูที่จะเก็บเกมนี้
   - **ชื่อเกม:** ที่จะแสดงในการ์ด (เช่น "Pizza Master Chef")
   - **หมวด:** ภาษาไทย / คณิตศาสตร์ / ฯลฯ
   - **Slug:** a-z + 0-9 + `-` (ตรงกับ `gameSlug` ใน postMessage)
   - **ไฟล์ HTML:** เลือกจากเครื่อง
   - **ปกเกม:** รูปขนาดเล็ก (จะถูก compress อัตโนมัติ)
3. กด **บันทึก** → ไฟล์เก็บที่ Supabase Storage bucket `edu-hub-games`
4. ระบบจะ set `tracked_game=true` + `game_slug=<slug>` ใน `educational_hub_items`

### B. ผ่าน git (สำหรับ dev)
- Copy ไฟล์ไป `public/games/<subject>/<slug>.html`
- Commit + push → Vercel deploy → URL `/games/<subject>/<slug>.html`
- Admin UPDATE `educational_hub_items.tracked_game=true` + `game_slug` (SQL ตรง)

---

## 6. Testing checklist

หลังสร้างเกมใหม่ ทดสอบ:

- [ ] **Standalone** เปิด `/games/<subject>/<slug>.html` direct → เล่นได้ปกติ (ไม่มี postMessage)
- [ ] **Embed** เปิดผ่าน `/play/<slug>` → กรอกรหัส → เล่น → score เพิ่ม
- [ ] **gameOver** → ส่ง postMessage → wrapper รับ + เพิ่ม XP
- [ ] **ปุ่ม "เลือกเกมใหม่"** → กลับไป `/h/<teacher-username>`
- [ ] **ปุ่ม "ออกจากเกม"** → กลับไป `/`
- [ ] **Mobile** (Chrome DevTools touch emulation หรือมือถือจริง):
  - Touch HUD โผล่
  - Tap/drag ทำงาน
  - ปุ่ม UI กดได้
- [ ] **Desktop:**
  - Mouse + keyboard ทำงาน
  - Pointer lock (ถ้าใช้) ขอ permission

---

## 7. AI prompt template (สำหรับสั่ง Claude/Cursor สร้างเกมใหม่)

```
สร้างเกม HTML แบบ single-file สำหรับ kampai-school

ใช้ template เดิมที่ /public/games/_template.html เป็นโครงตั้งต้น
อย่าแก้ SECTION A (KAMPAI INTEGRATION BOILERPLATE) — ใช้ตามนั้น

ไอเดียเกม:
- ประเภท: [puzzle / shooter / quiz / drag-drop / typing / ...]
- วิชา: [ภาษาไทย / คณิต / วิทย์ / ...]
- ระดับชั้น: [ป.X-Y]
- โจทย์: [อธิบายว่าผู้เล่นต้องทำอะไร]
- Win/Lose: [ตอบถูก X ข้อ / หมดชีวิต / หมดเวลา]
- Scoring: [+N เมื่อถูก / -M เมื่อผิด]

ข้อกำหนด:
- เปลี่ยน gameSlug ใน gameOver() เป็น <slug>
- รองรับ mobile + desktop (ใช้ IS_TOUCH)
- ใช้ Thai UI (ฟอนต์ Kanit + Sarabun)
- ขนาดไฟล์ < 200 KB (asset เป็น base64 / SVG inline / CDN)
- เกมเล่นได้จริง — ตั้งแต่ start → play → gameOver → final score

ส่งกลับเป็นไฟล์ <slug>.html สมบูรณ์
```

---

## 8. ไอเดียเกมตัวอย่าง (สำหรับ inspiration)

### ภาษาไทย
- **Tap the Correct Word** — แสดงคำ ผู้เล่นแตะคำที่สะกดถูก
- **Drag-Drop Sentence** — ลาก-วางคำให้ประโยคถูกต้อง
- **Tone Mark Hunt** — หาคำที่ใช้วรรณยุกต์ถูก
- **Spelling Race** — พิมพ์คำให้ทันก่อนหมดเวลา

### คณิตศาสตร์
- **Bubble Math** — กดฟองที่ผลลัพธ์ถูก
- **Sort the Numbers** — จัดเรียงจากน้อยไปมาก
- **Fraction Pizza** — เลือกชิ้นพิซซ่าให้ตรงเศษส่วน

### วิทยาศาสตร์
- **Food Chain Builder** — ลากสัตว์เรียงห่วงโซ่อาหาร
- **Solar System Quiz** — ตอบชื่อดาวเคราะห์
- **Weather Match** — จับคู่ปรากฏการณ์กับฤดู

### Action / Fast-paced
- **Whack-a-mole** สไตล์ — จุดเด้ง tap ทัน (มี example ใน template แล้ว!)
- **Catch the falling letters** — รับตัวอักษรประกอบคำ
- **Maze runner** — เดินมาเขาวงกตหาคำตอบ

---

## 9. FAQ / Troubleshooting

### Q: ทำไมเกมไม่บันทึกคะแนน?
- ตรวจ `gameSlug` ใน `gameOver()` ตรงกับ `game_slug` ใน DB หรือเปล่า
- ตรวจ `tracked_game=true` ใน `educational_hub_items` (SQL)
- เปิด DevTools Console — ดู postMessage ส่งหรือเปล่า

### Q: ปุ่มออก/เลือกเกมใหม่ไม่ทำงาน?
- Template ใช้ `target="_top"` + interceptor ถ้า EMBED
- ถ้าเขียน button onclick เอง → ต้องเช็ค `EMBED` + postMessage manually
- หรือเก็บใช้ `<a target="_top" href="...">` — interceptor จัดการให้

### Q: Mobile กดปุ่มเริ่มเกมไม่ได้?
- ตรวจ `IS_TOUCH` detection
- ตรวจว่า startGame() ไม่ pause/lock pointer (mobile ไม่มี pointer lock)
- ตรวจ touch event handlers ใช้ `{ passive: false }` + `preventDefault()`

### Q: ไฟล์ใหญ่เกิน (>5MB)?
- ใช้ external CDN library (THREE.js, Phaser, Howler.js) แทน inline
- รูปใหญ่ → ใช้ relative path `../shared/foo.png` (สร้าง `public/games/shared/`)
- เสียง → ใช้ CDN หรือ Web Audio API สังเคราะห์

### Q: เกมเก่าใช้ template ใหม่ไหม?
- ไม่จำเป็น — เกมเดิม (pizza, attack-on-noun) ทำงานได้ดี ไม่ต้อง refactor
- template ใหม่ = สำหรับเกมที่จะสร้างใหม่
- ถ้าอยากเทียบ pattern: ดู `pizza-master-chef.html` กับ `attack-on-noun.html` — มี EMBED + postMessage + score + touch ครบ

---

## 10. ไฟล์ที่เกี่ยวข้อง

| Path | บทบาท |
|---|---|
| `public/games/_template.html` | Template หลัก (copy ไปใช้) |
| `public/games/thai/pizza-master-chef.html` | Reference: 2D game with score + pause modal |
| `public/games/thai/attack-on-noun.html` | Reference: 3D FPS with touch controls + pointer lock |
| `src/pages/PlayGame.tsx` | Wrapper React component — รับ postMessage → submit RPC |
| `src/services/game-play.service.ts` | API: lookup student, record session |
| `supabase/migrations/066_game_play_tracking.sql` | Schema: game_sessions + achievements |
| `src/components/admin/educational-hub/GameUploadDialog.tsx` | Admin UI สำหรับ upload |

---

## 11. Versioning

- **v1.0** (commit `90e8285`) — template แรก พร้อม Tap-the-Dot example
- **v1.1+** — ทุกครั้งที่อัพ template ใหม่ → bump version comment ตรงบนสุดของ template + log ใน CHANGELOG.md

---

**End of doc.** ถ้าอยากปรับ template หรือเพิ่ม example อื่น — แก้ที่ `public/games/_template.html` แล้ว update ไฟล์นี้ตามครับ
