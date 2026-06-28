# GAME.md — มาตรฐาน Integrate เกม HTML เข้าระบบ kampai-school

> **Single source of truth สำหรับ AI + นักพัฒนา**
> เป้าหมาย: integrate เกมใหม่ภายใน 5 นาที — ผ่าน verify ครบ ไม่มี bug ซ้ำเดิม

---

## ⚡ TL;DR

```
1.  cp public/games/_template-full.html  public/games/{subject}/{slug}.html
2.  แก้ GAME_SLUG = '{slug}'  (1 ที่ใน <script>)
3.  เขียน game logic ใน SECTION C
4.  สร้าง supabase/migrations/NNN_seed_{slug}_game.sql  (รวม upsert game_docs — รูปแบบ/ฟีเจอร์/เวอร์ชัน, บังคับ)
5.  pnpm verify:game public/games/{subject}/{slug}.html   # ต้องผ่าน 9/9 checks (Check 9 = ปก 16:9)
```

> 🔖 **บังคับทุกเกม:** ทุกครั้งที่สร้าง/แก้เกม ต้องเขียน/อัปเดต `game_docs` (รูปแบบ + ฟีเจอร์ + เวอร์ชัน)
> ใน migration เดียวกัน + เด้งเวอร์ชัน — ดูเทมเพลตใน "🗄️ DB Migration Pattern". เห็นในหลังบ้านที่ปุ่ม
> "รายละเอียด" ในการ์ดเกม GamesTab (เฉพาะเจ้าของ+admin)

มีแล้ว: kampai postMessage + Supabase leaderboard + Score HUD + Lives HUD + ระบบเสียงรวม (SFX/TTS/BGM)
ห้ามทำ: input ชื่อผู้เล่น, Firebase SDK, `window.location.href` ตรง ๆ

---

## 🧭 Decision Tree

```
ก่อนเริ่ม → ถามผู้ใช้: "ทำโหมดออนไลน์ไหม?" (ดู §"🌐 ก่อนสร้างเกม")

เริ่มเกมใหม่
├─ สร้างจากศูนย์ (แนะนำ)   → cp -r _template-folder    (โครงสร้าง 5 ไฟล์ + online — ดู §"📁 โครงสร้างโฟลเดอร์")
├─ แข่ง 2 คน (เดี่ยว+local+online) ⭐ → cp _template-versus.html (kampai-versus: เมนูโหมด + hot-seat + online — มาตรฐานใหม่)
├─ เกมเล็ก/ไฟล์เดียว        → cp _template-full.html    (single-file + leaderboard + sound)
├─ รองรับแนวตั้ง+แนวนอน ⭐   → cp -r _template-orient     (kampai-orient.js + HUD/menu responsive — อ่าน ORIENT-GAME.md)
├─ เล่นหลายคนออนไลน์อย่างเดียว → cp _template-online.html (kampai-match: lobby+แข่งสด+อันดับ)
├─ ไม่อยาก leaderboard      → cp _template.html         (basic version)
├─ เกมเป็น React component   → cp _template-react.html   (JSX/lucide-react → single-file)
├─ ใช้กล้อง/ตรวจจับร่างกาย (AR) → อ่าน AR-GAME.md + cp -r _template-ar (engine kampai-ar.js)
└─ มีไฟล์เกมเก่าอยู่แล้ว     → /integrate-game <path>   (Claude slash command)

แก้ไขเกมเดิม
├─ ตรวจสอบสถานะ        → pnpm verify:game <path>   (รวม Check 7 render smoke-test)
├─ Claude ช่วย integrate → /integrate-game <path>
└─ แก้เอง              → อ่าน Section "EMBED Block" + "postMessage Protocol"
```

---

## ✅ วัฒนธรรมเกมมาตรฐาน (ทุกเกมต้องมีครบ)

> เช็กลิสต์จุดเดียว — เกมในระบบนี้หน้าตา/พฤติกรรมเหมือนกันหมด. เทมเพลต `_template-full.html` มีให้ครบแล้ว

| ส่วน | ต้องมี |
|---|---|
| **จอเริ่ม (title)** | การ์ด "สถิติฉัน" (`personalBest`+`playsCount`) + ตารางอันดับ Top 5 (`leaderboard`, ไฮไลต์ `isMe`) + ปุ่มเริ่ม · **ไม่มี input ชื่อ** (ไม่มีข้อมูล → ซ่อนการ์ด) |
| **ระหว่างเล่น (HUD)** | คะแนน + ชีวิต/เวลา + ป้ายผู้เล่น (`student.displayName`+รูป) |
| **จอจบ (game over)** | คะแนนรอบนี้ + ตารางอันดับ (ชุดเดียวกัน) + ปุ่มเล่นใหม่ + `KAMPAI.goHome()` + **เรียก `KAMPAI.submitScore(...)`** · **ต้องมี `<div id="kampai-result"></div>`** ในการ์ดจอจบ (SDK เติม XP/เลเวล/เหรียญให้อัตโนมัติ → จอเดียว ไม่มีการ์ด XP ลอยซ้ำของ wrapper). **ห้ามมีปุ่มเล่นซ้ำ/ออก ซ้ำกับของ wrapper** |
| **เสียง** | `KAMPAI.sound.defaultBgm(preset)` + `mountToggles()` ตอนเริ่ม · `correct()/wrong()/timeUp()/gameOver()` ตามเหตุการณ์ · `speak(word,lang)` สำหรับ**เกมภาษา** (TTS) |
| **มือถือ** | `controls.mount()` หรือ tap · responsive ~360px **ไม่ล้นแนวนอน** · ปุ่ม ≥44px |

⚠️ gotcha: ปุ่มเสียง `#kampai-snd` (จาก `mountToggles`) อยู่ **มุมล่างขวา z-index 40** (SDK default) — วาง HUD/ปุ่มเกม
ไม่ให้ทับมุมล่าง · dpad SDK อยู่ **ซ้ายล่าง**. เกม landscape/runner → ใช้ `_template-orient` + อ่าน `ORIENT-GAME.md`

---

## 🏁 ทุกเกมต้องแข่ง 2 คนได้ (มาตรฐาน — KampaiVersus)

**กฎ: ทุกเกมที่สร้าง/แก้ ต้อง wire ผ่าน `/games/kampai-versus.js` ให้ครบ 3 โหมด** —
เดี่ยว · **2 คนเครื่องนี้ (local hot-seat จอเดียว)** · ออนไลน์ (ต่างเครื่อง).
เฟรมเวิร์กจัดการ เมนูเลือกโหมด/เลือกคู่แข่ง P2/นับถอยหลัง/สลับตา/จอเทียบผล/สถิติแชมป์ ให้หมด —
เกมเขียนแค่ `onPlay`/`onEnd` + `report`/`finish` (ดู §"🤝 Two-Player Framework"). **`verify:game` Check 11 บังคับ.**

| โหมด (ได้ทุกเกม) | ทำงานต่อชนิดเกม |
|---|---|
| **เดี่ยว** — ปุ่ม "เริ่มเกม" เดิม | คงพฤติกรรมเดิม (`submitScore` + จอจบ) |
| **2 คนเครื่องนี้ (hot-seat)** — P1 จบ → ส่งเครื่อง → P2 → เทียบผล | quiz/คณิต/สะกด: seed เดียว = โจทย์ตรงกัน · action/แข่งรถ: รอบจับเวลา (โลก seed เดียว) · AR: ผลัดทำรอบกล้อง |
| **ออนไลน์** — รหัสห้อง 4 หลัก แข่งสด | reuse `kampai-match.js` ผ่าน KampaiVersus (delegate) |

**P2 เลือกได้ 2 แบบ:** เลือกจากรายชื่อห้อง (`KAMPAI.classmates`) → เก็บสถิติแชมป์ห้อง/head-to-head ·
หรือ "เล่นเร็ว" (ไม่ระบุชื่อ ไม่เก็บสถิติ). sabotage "ตอบถูก = ป่วนคู่แข่ง" = ออปชั่นรายเกม
(`sabotage:true` + ใช้ `onOpponent`) — ตัวอย่าง `science/blocky-safari`.
เริ่มจาก `_template-versus.html` · online เดิม `math/multiply-race.html`

---

## 📁 โครงสร้างโฟลเดอร์ต่อเกม (5 ไฟล์ — แนะนำสำหรับเกมใหม่)

เกมไฟล์เดียวหลายร้อยบรรทัดแก้ยาก → แตกเป็นโฟลเดอร์ `public/games/{subject}/{slug}/` แยกหน้าที่:

| ไฟล์ | หน้าที่ | แก้เมื่อ |
|---|---|---|
| `index.html` | โครง markup + โหลด script ตามลำดับ | เพิ่ม/ลบ element |
| `style.css` | หน้าตา/ธีม/สี | ปรับดีไซน์ |
| `config.js` | `window.GAME_CONFIG` — **พารามิเตอร์** (เวลา/คะแนน/ชีวิต/bgm/online) | จูนความยาก, เปิดออนไลน์ |
| `data.js` | `window.GAME_DATA` — **เนื้อหา** (คลังคำ/โจทย์/ด่าน) | เพิ่ม/แก้เนื้อหา |
| `game.js` | **ลอจิก** อ่านจาก config/data + SDK/leaderboard/sound | แก้กลไกเกม |
| `cover.{png,svg}` | ปก 16:9 | — |

**เทมเพลตแนวจอ:** `cp -r public/games/_template-orient` — เพิ่ม `kampai-orient.js` + `ORIENTATION` ใน config (ดู `ORIENT-GAME.md`)

**กฎ:**
- โหลดด้วย **plain `<script src>` เรียงลำดับ** (`config → data → game`) — **ห้าม `import/export`** (แชร์ global
  scope; verifier + เบราว์เซอร์ eval ตามลำดับ). ค่าส่งผ่าน global: `window.GAME_CONFIG`/`window.GAME_DATA`
- `external_url` ใน DB = `/games/{subject}/{slug}/index.html` · `thumbnail_url` = `…/{slug}/cover.png`
- `verify:game` รองรับแล้ว: `pnpm verify:game public/games/{subject}/{slug}` (หรือ `…/index.html`) — รวม
  sibling เข้าตรวจ static + render
- **เฉพาะเกมใน repo** (`public/games/`) — เกมอัปโหลดผ่าน Storage (ครู) ยังต้องไฟล์เดียว (โหลดผ่าน Blob → relative พัง)
- เกมเดิม ~30 เกมยังเป็นไฟล์เดียวได้ (ทั้ง 2 แบบอยู่ร่วมกัน) — ค่อยทยอยย้ายทีละเกม
- เริ่ม: `cp -r public/games/_template-folder public/games/{subject}/{slug}` · นำร่อง: `english/listen-spell/`

---

## 🚀 KAMPAI SDK (แนะนำ — เทมเพลตใหม่ใช้ตัวนี้)

เกมใหม่โหลด **ไฟล์เดียว** `/games/kampai-sdk.js` แทนการ copy boilerplate เอง → integration อัปเดต
ที่เดียว ทุกเกมได้ตาม. ใส่ใน `<body>` ก่อน script เกม + fallback stub (กัน standalone พัง):
```html
<script src="/games/kampai-sdk.js"></script>
<script>window.KAMPAI = window.KAMPAI || { isEmbed:false, ready:true, student:null, stats:null, leaderboard:[], input:{up:false,down:false,left:false,right:false,a:false,b:false}, onReady:function(cb){cb(this);}, setSlug:function(){return this;}, submitScore:function(){return false;}, goHome:function(){location.href='/h/nattapong';}, controls:{mount:function(){return this;}} };</script>
```

**API (`window.KAMPAI`):**
| เมธอด / property | ใช้ทำอะไร |
|---|---|
| `KAMPAI.setSlug('slug')` | ตั้ง game_slug (ครั้งเดียวตอนเริ่ม) |
| `KAMPAI.onReady(cb)` | `cb(k)` รันเมื่อข้อมูลนักเรียนมาถึง — ใช้ `k.student/k.stats/k.leaderboard` ไปโชว์ |
| `KAMPAI.student` | `{id, code, displayName, photoUrl, classLabel}` |
| `KAMPAI.stats` | `{playsCount, personalBest, totalXp, level}` |
| `KAMPAI.leaderboard` | `[{rank, studentId, displayName, photoUrl, classLabel, personalBest, isMe}]` |
| `KAMPAI.submitScore(score,{mode,...meta})` | ส่งคะแนนตอนจบเกม (= gameEnd เดิม) — **ต้องเรียก** |
| `KAMPAI.goHome()` | ปุ่มกลับหน้าหลัก (= navigate เดิม) |
| `KAMPAI.controls.mount({dpad,buttons,onTap})` | วาด D-pad+ปุ่มบนมือถือ + sync คีย์บอร์ด → อ่าน `KAMPAI.input{up,down,left,right,a,b}` |
| `KAMPAI.sound.mountToggles()` | วางปุ่ม 🔊/🗣️/🎵 (เปิด/ปิด SFX·TTS·BGM) มุมล่างขวา — เรียกตอนเริ่ม |
| `KAMPAI.sound.defaultBgm('preset')` | ตั้งเพลงพื้นหลังเริ่มต้น (cheerful/calm/warm/playful/bright/mellow) ถ้าหลังบ้านไม่กำหนด |
| `KAMPAI.sound.bgmStart()` / `bgmStop()` | เริ่ม/หยุดเพลง (เรียกตอน startGame / endGame) |
| `KAMPAI.sound.correct()` / `wrong()` / `timeUp()` / `gameOver()` | เสียงเอฟเฟกต์ตามเหตุการณ์ |
| `KAMPAI.sound.speak(text, lang)` | TTS อ่านออกเสียง (เกมภาษา เช่น `speak('apple','en-US')`) · `stopSpeak()` หยุด |
| `KAMPAI.sound.fxFlash(good)` | แฟลชจอเขียว(ถูก)/แดง(ผิด) · `unlock()` ปลดล็อก audio ตอน gesture แรก |
| `KAMPAI.character` | `{sheetUrl, sheetUrlP2, fw, fh, frames, anim}` จากหลังบ้าน — `null` = ใช้ sprite bundled ใน git |
| `KAMPAI.loadCharacterSheets()` | Promise โหลด Image P1 (+ P2 ถ้ามี) จาก `KAMPAI.character` — เกม opt-in เรียกก่อนเริ่ม |
| `KAMPAI.pickCharacterFrame(p, opt?)` | เลือก index เฟรมจาก `p.state/vx/vy/animTime` + `anim`/`anim.extras` · รองรับ attack/crouch/slide/special ฯลฯ |
| `KAMPAI.poseKeyFromPlayerState(p, opt?)` | แปลง state → ท่า (จุดเท้า preview) |
| `KAMPAI.resolveFootAnchor(anim, pose)` | จุดเท้าแยกตามท่า — `anim.poseAnchors[pose]` หรือ default |
| `KAMPAI.online.available` | `true` ถ้าเล่นใน embed (standalone เล่นออนไลน์ไม่ได้) |
| `KAMPAI.online.makeCode()` | สุ่มรหัสห้อง 4 หลัก |
| `KAMPAI.online.join(room,{onJoined,onPresence,onEvent})` | เข้าห้อง realtime — wrapper เปิด Supabase channel ให้ (เกมไม่ต้องมี anon key). meta presence ดึงจาก `KAMPAI.student` อัตโนมัติ |
| `KAMPAI.online.send(event,payload)` | broadcast event ให้ทุกคนในห้อง → ปลายทางได้ผ่าน `onEvent(event,payload,fromKey)` |
| `KAMPAI.online.leave()` | ออกจากห้อง |

> **`KAMPAI.online` = ระดับล่าง** (join/send/leave ดิบ ๆ). เกมส่วนใหญ่ **ไม่ต้องเรียกเอง** — ใช้เฟรมเวิร์ก
> `kampai-match.js` ด้านล่างที่ห่อ logic+UI ให้ครบแล้ว.

---

## 🤝 Two-Player Framework (`kampai-versus.js`) — ใช้ตัวนี้ก่อนเสมอ

**drop-in เดียว ครอบ 3 โหมดจาก wiring ชุดเดียว** — เดี่ยว · 2 คนเครื่องนี้ (local hot-seat) · ออนไลน์
(delegate `kampai-match.js` ให้อัตโนมัติ). เกมไม่ต้องเขียนเมนู/เลือกคู่/นับถอยหลัง/สลับตา/จอเทียบ/สถิติเอง.

```html
<script src="/games/kampai-sdk.js"></script>
<script src="/games/kampai-match.js"></script>   <!-- online (delegate) -->
<script src="/games/kampai-versus.js"></script>
<script>window.KampaiVersus = window.KampaiVersus || { create:function(o){ var m=(window.KampaiMatch&&window.KampaiMatch.create)?window.KampaiMatch.create(o):null; return { available:false, openMenu:function(){ if(m)m.openMenu(); }, report:function(s,i){ if(m)m.report(s,i); }, finish:function(s,i){ if(m){m.finish(s,i);return true;} return false; }, leave:function(){}, mode:null }; } };</script>
```

```js
const vs = KampaiVersus.create({
  duration: 60, title: 'แข่งบวกเลข', rankBy: 'score',  // 'score' | 'correct'
  rounds: 1,                       // best-of-N (local) — default 1
  onPlay: ({ rng, player }) => startRound(rng, player), // player: 'P1'|'P2'|null(เดี่ยว/online) — ใช้ rng ทำโจทย์
  onEnd:  () => freezeInput(),                          // หมดเวลา/จบตา → หยุดรับ input
  onOpponent: (list) => {},        // online live + local sabotage (optional)
  sabotage: false,                 // กลไก "ตอบถูก = ป่วนคู่แข่ง" รายเกม
});
```

**สูตร retrofit (ทุกเกน 6 จุด):**
1. โหลด 3 script + stub ข้างบน
2. `const vs = KampaiVersus.create({...onPlay,onEnd})`
3. ปุ่มจอเริ่ม **"🏁 แข่ง 2 คน"** → `onclick="vs.openMenu()"` (คู่กับปุ่ม "เริ่มเกม" เดิม)
4. `startRound(rng, player)` — ใช้ `rng` (ไม่ใช่ `Math.random`) ทำโจทย์ → P1/P2 ได้โจทย์ตรงกัน
5. ตอนได้คะแนน: `vs.report(score, { correct })`
6. ใน `endGame`: ขึ้นต้นด้วย `if (vs.finish(score, { correct })) return;` (versus จัดการเทียบผล/สถิติ) → ไม่งั้น `submitScore` + จอจบ (เดี่ยว)

> เฟรมเวิร์ก: local hot-seat = P1 จบ → "ส่งเครื่อง" → P2 (seed เดียว = โจทย์ตรง) → จอเทียบผู้ชนะ ·
> เลือก P2 จาก `KAMPAI.classmates` → ส่ง `versusEnd` ให้ wrapper เก็บสถิติแชมป์ (migration 208) · online → KampaiMatch.
> `verify:game` Check 11 บังคับว่าเกมต้องมี KampaiVersus (หรืออย่างน้อย KampaiMatch). เริ่มจาก `_template-versus.html`.

---

## 🤝 Online Multiplayer Framework (`kampai-match.js`) — internal ที่ KampaiVersus ใช้ต่อ

เกม "นักเรียนเล่นด้วยกัน" (แข่งสดต่างเครื่อง) — **อย่าเขียน lobby/presence/นับถอยหลัง/scoreboard เอง**.
โหลด `/games/kampai-match.js` (สร้างบน `KAMPAI.online`) แล้วเรียก `KampaiMatch.create()` ครั้งเดียว.
เฟรมเวิร์กจัดการให้: **สร้าง/เข้าห้อง (รหัส 4 หลัก) · lobby + presence สด · ซิงค์เริ่มพร้อมกัน ·
นับถอยหลัง · นาฬิกา · แถบคะแนนคู่แข่งสด · จัดอันดับผู้ชนะ · seeded RNG (โจทย์ตรงกัน)**.
จบแมต → **โชว์จออันดับ/ผู้ชนะก่อน → ปุ่ม "รับ XP →"** ค่อยยิง `submitScore(mode:'online')` (= wrapper ขึ้นจอ +XP).
ถ้าไม่กดภายใน 20 วิ → บันทึกอัตโนมัติ (กันลืมรับ XP).

```html
<script src="/games/kampai-sdk.js"></script>
<script src="/games/kampai-match.js"></script>
<script>window.KampaiMatch = window.KampaiMatch || { create:function(){return{available:false,openMenu:function(){alert('เล่นผ่านระบบเท่านั้น');},report:function(){},finish:function(){},leave:function(){}};} };</script>
```

```js
const match = KampaiMatch.create({
  duration: 60,                         // วินาที (โหมด race ตามเวลา)
  title: 'แข่งสูตรคูณ',
  onPlay: ({ rng, seed, room }) => startMyGame(rng),  // GO! เริ่มเล่นจริง — ใช้ rng ให้โจทย์ตรงกันทุกเครื่อง
  onEnd:  () => stopMyGame(),                          // หมดเวลา → หยุดรับ input (เฟรมเวิร์กคิดอันดับเอง)
});
// ปุ่ม "ออนไลน์": onclick = () => match.openMenu();
// ตอนได้คะแนน:   match.report(score, { correct });   // อัปเดตคะแนนสด (เรียงอันดับด้วย correct → score)
```

| API | ใช้ทำอะไร |
|---|---|
| `KampaiMatch.create(opts)` | สร้าง controller (1 ครั้ง). opts: `duration, title, onPlay, onEnd, autoSubmit=true` (autoSubmit=auto บันทึก XP หลังโชว์ผล 20 วิ ถ้าไม่กดปุ่ม) |
| `match.openMenu()` | เปิดจอสร้าง/เข้าห้อง (ปุ่ม "ออนไลน์" เรียกตัวนี้) |
| `match.report(score,{correct})` | อัปเดตคะแนนสดของฉัน → broadcast + scoreboard (เรียกทุกครั้งที่ได้คะแนน) |
| `match.available` | `true` ถ้าเล่นผ่าน /play (standalone = false → ปุ่มแจ้งเล่นผ่านระบบ) |
| `onPlay({rng,seed,room})` | callback ตอน GO — **ใช้ `rng`** (mulberry32 จากรหัสห้อง) สร้างโจทย์ให้ตรงกันทุกเครื่อง |

> **ไม่ต้องแก้ wrapper/SDK/migration** — relay (`live:<gameSlug>:<room>`) namespaced ตาม slug อัตโนมัติ.
> ตัวอย่างจริง: `math/multiply-race.html` (โหมด 🌐 ออนไลน์). starter: `_template-online.html`.
> ข้อจำกัดปัจจุบัน: รองรับ **race ตามเวลา** (host ออกห้องไม่มี reassign — ยอมรับได้ในห้องเรียน).

### 🛰️ Netcode (`kampai-net.js`) — ทำเกมออนไลน์ "ลื่น ไม่กระตุก" + รองรับหลายคน

ปัญหาคลาสสิก: เซ็ตตำแหน่งคู่แข่งดิบ ๆ ตอนรับ event (เช่น `rival.x = data.x`) → กระโดดเป็นก้อนทุก ~100ms = **กระตุก**.
`kampai-net.js` แก้ด้วย **snapshot interpolation** (network tick แยก render + เรนเดอร์ย้อนหลัง ~100ms แล้ว lerp). โหลดคู่ SDK:
```html
<script src="/games/kampai-sdk.js"></script>
<script src="/games/kampai-net.js"></script>   <!-- ก่อน kampai-match.js -->
```

**ทางลัด (เกม race/score ที่ใช้ KampaiMatch/KampaiVersus):** ไม่ต้องเรียก kampai-net เอง — แค่อ่าน `match.opponents()`
**ต่อเฟรมใน loop** (ตำแหน่งคู่แข่งถูก interpolate ให้แล้ว) แทนการเซ็ตใน `onOpponent`:
```js
// ใน loop() (ทุกเฟรม) — แทน rival.x = leader.score ดิบ ๆ
const others = match.opponents().filter((m) => !m.me);   // [{id,name,score,correct,me, v}]
if (others.length) rival.dist = others.sort((a,b)=>b.v-a.v)[0].v;   // v = ตำแหน่ง interpolated (ลื่น)
```
ถ้าไม่โหลด `kampai-net.js` → `v` = ค่าดิบ (ทำงานได้ แต่ไม่ลื่น) = backward-safe. ตัวอย่างจริง: `math/math-rally`.

**เกมแอ็กชันหลายคน (host-authority — รองรับ 4-8 คน):** ใช้ `KampaiNet.create()` ตรง ๆ:
| โหมด | host | peer |
|---|---|---|
| **peer-broadcast** (ต่างคนต่างจำลอง) | `net.localState({x,y})` ทุกเฟรม · `net.view(peerId)` ตอนวาด | เหมือนกัน |
| **host-authority** (host จำลองโลก) | `net.localWorld({p1:{x,y},ball:{...}})` + อ่าน `net.input(peerId)` | `net.localInput({up,fire})` · วาดด้วย `net.viewEntity(id)` |

- `net.predictor({step,fields,blend,maxLead,init,localId})` + `net.predictStep(dt,input)` → `net.localView()` = ตัวเราตอบสนอง input ทันที (client prediction) · `maxLead` กันทำนายทะลุกำแพง
- ป้อน event เข้า net: ใน `onEvent` ของห้อง → `if (net.receive(ev,data,from)) return;` · เริ่ม/หยุด: `net.start()`/`net.stop()`
- supabase client ตั้ง `eventsPerSecond: 30` แล้ว (รองรับ network tick 15-20Hz) — ดู `src/integrations/supabase/client.ts`

**Prompt สำหรับสั่ง AI เจ้าอื่นสร้างเกม:** `public/GAME-PROMPT.md` (served ที่ `/GAME-PROMPT.md`) —
แอดมินมีปุ่ม "คัดลอก Prompt" + ดาวน์โหลดเทมเพลตที่ เมนูเกม HTML (GamesTab).

**init payload ที่ wrapper ส่งให้** (PlayGame.tsx — SDK แปลงให้แล้ว, เกมไม่ต้องอ่านเอง):
```js
{ type:'init', studentCode, student:{id,displayName,photoUrl,classLabel},
  stats:{playsCount,personalBest,totalXp,level},
  leaderboard:[{rank,studentId,displayName,photoUrl,classLabel,personalBest,isMe}],
  audio:{ bgm, bgmUrl },          // เพลงจากหลังบ้าน (optional)
  character:{ sheetUrl, sheetUrlP2, fw, fh, frames, anim } | null  // sprite จากคลังตัวละคร (optional)
}
```
> เกมเก่าที่อ่านแค่ `studentCode` ยังทำงานได้ (additive). ถ้า `character === null` → ใช้ sprite bundled ใน git ตามเดิม.
> เกมที่ opt-in: อ่าน `KAMPAI.character` ใน `onReady` หรือเรียก `KAMPAI.loadCharacterSheets()` + `KAMPAI.pickCharacterFrame(player)`.
> **คลังตัวละคร admin:** อัปโหลดแล้ว **ตัดพื้นหลังอัตโนมัติ** (flood fill จากขอบ → PNG โปร่งใส) · ปรับความไวได้ · bundled git ใช้ `pnpm process:sprite-bg`
> `anim` = mapping เฟรม core `{ idle[], walk[], run[], jump, hurt, happy }` + ท่าเสริมใน `extras` (optional).
> **Pose catalog (5 กลุ่ม):** เคลื่อนที่ · ต่อสู้ (attack/block/dodge) · ท่าทาง (crouch/sit/…) · แพลตฟอร์ม (slide/climb/fall) · พิเศษ (special/emote/death).
> เกมเรียกท่าด้วย `player.state` — ตัวอย่าง `'attack'`, `'crouch'`, `'slide'`, `'special'`. ท่าที่ยังไม่ map → fallback idle/walk/run/jump อัตโนมัติ.
> `KAMPAI.pickCharacterFrame(p, { runSpeed })` · `KAMPAI.poseKeyFromPlayerState(p)` · `KAMPAI.resolveFootAnchor(anim, pose)`.
> Admin: **Character Studio** — map ท่าแยกกลุ่ม · Auto fit ขนาดเฟรม · palette สี · จุดเท้าแยกตามท่า (poseAnchors).
> `_template-react.html` (React) — ทั้งคู่ใช้ SDK + โชว์ leaderboard ในเกม + D-pad มือถือ.

---

## 🏆 ตารางอันดับในจอแรก (drop-in — เกม legacy/vanilla)

เกมที่ไม่ได้ใช้ SDK (อ่าน init เอง) เพิ่มตารางอันดับในจอ title ได้ด้วย **2 บรรทัด** —
ไม่ต้องเขียน render เอง / ไม่ฝัง anon key (อ่าน `leaderboard` จาก init ที่ wrapper ส่งให้):

```html
<script src="/games/kampai-leaderboard.js"></script>
<div data-kampai-lb></div>   <!-- วางในจอ title (หรือ game-over) มีได้หลายจุด -->
```

- ไม่มีข้อมูล (เล่นนอกระบบ) → ซ่อน container อัตโนมัติ · inject style เอง (white card + gold)
- เกม React (Babel) ที่คุม DOM เอง → อย่าใช้ drop-in นี้ (React จะ overwrite) ให้ทำ panel จาก
  `e.data.leaderboard` ใน state แทน (ดูตัวอย่าง `thai/wizard-thai.html`, `math/mth.html`)

## 🔌 EMBED Block (legacy — manual, ไม่ใช้ SDK)

วาง **ต้นสุดของ `<script>` tag หลัก** ก่อนตัวแปรอื่นทั้งหมด:

```javascript
const GAME_SLUG = 'CHANGE-ME';   // ⚠️ ต้องตรงกับ educational_hub_items.game_slug

const IS_EMBED = window.self !== window.top ||
                 new URLSearchParams(location.search).get('embed') === '1';

let STUDENT_CODE       = null;
let DISPLAY_NAME_INIT  = '';
let SESSION_START_TS   = Date.now();

if (IS_EMBED) {
    window.addEventListener('message', (e) => {
        if (e?.data?.type === 'init' && typeof e.data.studentCode === 'string') {
            STUDENT_CODE      = e.data.studentCode;
            DISPLAY_NAME_INIT = e.data.displayName ?? '';
            SESSION_START_TS  = Date.now();
        }
    });

    // anchor target=_top interceptor
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a[target="_top"]');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!href) return;
        e.preventDefault();
        try { window.parent.postMessage({ type: 'navigate', to: href }, '*'); } catch (_) {}
    });
}

function sendGameEnd(finalScore, mode, extra) {
    if (!IS_EMBED || !STUDENT_CODE) return;
    try {
        window.parent.postMessage({
            type:        'gameEnd',
            gameSlug:    GAME_SLUG,
            studentCode: STUDENT_CODE,
            score:       Math.round(finalScore),
            mode:        mode || 'normal',
            metadata: {
                duration: Math.max(1, Math.floor((Date.now() - SESSION_START_TS) / 1000)),
                ...(extra || {}),
            },
        }, '*');
    } catch (_) {}
}

function navigateBack() {
    if (IS_EMBED) {
        try { window.parent.postMessage({ type: 'navigate', to: '/h/nattapong' }, '*'); } catch (_) {}
    } else {
        window.location.href = '/h/nattapong';
    }
}
```

**สำคัญ:** ต้องเรียก `sendGameEnd(score, mode, extra)` ในฟังก์ชันจุดจบเกมทุกครั้ง — ไม่งั้นคะแนนไม่ถูกบันทึก

---

## 📨 postMessage Protocol

| message | direction | fields |
|---|---|---|
| `init` | parent → iframe | `{type:'init', studentCode, displayName?}` |
| `gameEnd` | iframe → parent | `{type:'gameEnd', gameSlug, studentCode, score, mode, metadata:{duration,...}}` |
| `navigate` | iframe → parent | `{type:'navigate', to:'/h/nattapong'}` |
| `rtJoin` | iframe → parent | `{type:'rtJoin', room, meta}` — เข้าห้องออนไลน์ (wrapper เปิด channel) |
| `rtSend` | iframe → parent | `{type:'rtSend', event, payload}` — broadcast ให้ทุกคนในห้อง |
| `rtLeave` | iframe → parent | `{type:'rtLeave'}` — ออกจากห้อง |
| `rtJoined` | parent → iframe | `{type:'rtJoined', room}` — subscribe สำเร็จ |
| `rtPresence` | parent → iframe | `{type:'rtPresence', members:[{id,name,photoUrl,classLabel}]}` |
| `rtEvent` | parent → iframe | `{type:'rtEvent', event, payload, fromKey}` — broadcast จากคนอื่น |

**Constraints:**
- `score` ต้องเป็น integer (ใช้ `Math.round(...)`)
- `gameSlug` ต้องตรงกับ `educational_hub_items.game_slug` ใน DB
- `metadata.duration` หน่วยวินาที (auto-calc จาก SESSION_START_TS)
- รอ `STUDENT_CODE !== null` ก่อนเรียก `sendGameEnd` (เพราะ init อาจมาช้า ~500ms)

---

## 🎯 Score Formula

| รูปแบบเกม | mode | formula | ตัวอย่าง |
|---|---|---|---|
| สะสมต่อเนื่อง | `'normal'` | ตัวแปร `score` ตรงๆ | `word-shield`, `fishing` |
| Level-based pass | `'test'` | `(level + 1) * 10 + hp * 2` | `mth.html` |
| Level-based fail | `'test'` | `level * 10` | `mth.html` |
| Tutorial | `'tutorial'` | flat `50` | `mth.html` |
| Custom (ครูตั้งโจทย์) | `'custom'` | ไม่เรียก sendGameEnd | `mth.html` |

**หลักการ:** คะแนนต้องสะท้อนความสำเร็จจริง — ห้ามส่ง 0 เสมอ ห้ามส่ง float

---

## 🧩 เกม React component (single-file Babel)

เมื่อ source เป็น React/JSX ดิบ (เช่นได้จาก AI/Stitch — `import React...` + `import {...} from 'lucide-react'`)
มันรันใน iframe ตรง ๆ ไม่ได้ (ไม่มี bundler) → ต้อง port เป็น single-file:

1. `cp public/games/_template-react.html  public/games/{subject}/{slug}.html`
2. ตั้ง `GAME_SLUG = '{slug}'` (SECTION A)
3. ลบ 2 บรรทัด `import` ออกจาก source
4. `export default function App()` → `function App()` แล้ววางใน SECTION C
5. **lucide:** ใช้ `_mkIcon` ที่ template ให้ (SECTION B) แล้ว destructure ไอคอนที่ใช้ —
   **อย่าเขียน shim เอง**
6. ปิดท้ายด้วย `ReactDOM.createRoot(document.getElementById('root')).render(<App/>)`
7. `pnpm verify:game <path>` ต้องผ่าน **8/8** (Check 7 = render จริง, Check 8 = ไอคอนไม่ชน JS global)

**⚠️ lucide IconNode shape:** `window.lucide.icons.X = ["svg", attrs, [["path",{...}], ...]]`
— drawing children อยู่ที่ **index 2** (`node[2]`). เคยพลาด map ผิด level (คิดว่าเป็น array ของ
`[tag,attrs]`) → `React.createElement(undefined)` → React crash → **จอดำ**.

> **บทเรียน (wizard-thai):** `verify:game` เดิมเป็น static regex ล้วน — ผ่าน 6/6 ทั้งที่เกมจอดำ
> เพราะไม่เคย render จริง. ตอนนี้เพิ่ม **Check 7 (render smoke-test)** ด้วย jsdom + React UMD
> จับ runtime crash / root ว่างได้แล้ว. แต่ **ยังต้องเปิด browser จริง** เพื่อเช็ค UX/gameplay/layout.

---

## 🎥 เกม AR / กล้อง (camera-permission)

> 📖 **อ่าน [`AR-GAME.md`](AR-GAME.md) ก่อนทำเกม AR ทุกครั้ง** (สถาปัตยกรรม + pitfalls + ตารางจูน + tuning log)
> เกม AR มี **engine กลาง** `public/games/kampai-ar.js` (`KampaiAR`) + **เทมเพลต** `_template-ar/` แล้ว
> → `cp -r public/games/_template-ar public/games/{subject}/{slug}` (เกมตัวอย่าง: `demo/ar-zone-quiz/`)

เกมที่ใช้กล้อง + ตรวจจับร่างกาย — `game.js` ไม่มี camera code (อยู่ใน engine). จูนที่ `config.js` · pattern เฉพาะ:

- **สิทธิ์กล้องในระบบ:** iframe wrapper เปิดให้แล้ว — `allow="...camera; microphone"`
  (`src/pages/PlayGame.tsx`) → กล้องทำงานในโหมด embed ได้ ไม่ต้องตั้งค่าเพิ่ม
- **เปิดกล้อง:** `getUserMedia({ video:{ facingMode:'user' } })` · mirror วิดีโอด้วย CSS `transform: scaleX(-1)`
  แล้ว **flip landmark x** (`1 - x`) ให้ภาพกับพิกัดตรงกัน
- **pose:** โหลด `@mediapipe/pose` จาก **jsdelivr ตัวเดียว**
  (`https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.x/pose.js`) — ⚠️ อย่าโหลด `pose.js` จาก cdnjs ก่อน (มัก 404)
- **บังคับมี input fallback:** กล้อง/permission/pose **อาจล้มได้** (อุปกรณ์โรงเรียน) → ต้องเล่นได้เสมอ
  ด้วย **แตะ zone/ปุ่ม**. กรณี `getUserMedia` reject → สลับเข้าโหมดแตะอัตโนมัติ (ดู `initCamera` catch ใน vocab-move)
- **verify:** Check 7 (render) ผ่านได้ เพราะกล้อง init เฉพาะตอน **user gesture** (กดเริ่ม) ไม่ใช่ตอน load —
  MediaPipe จึงไม่ถูกเรียกใน jsdom. แต่ **ต้องเปิด browser จริงที่มีกล้อง** เพื่อทดสอบ gameplay

---

## ❌ Anti-Patterns (ห้ามทำ)

| ❌ ผิด | ✅ ถูก |
|---|---|
| `<script src="firebasejs/...">` Firebase SDK | ลบ/comment ออก — kampai ใช้ Supabase |
| `<input id="player-name">` ถามชื่อในเกม | ใช้ `DISPLAY_NAME_INIT` ที่ wrapper ส่งให้ |
| `window.location.href = '../index.html'` | `navigateBack()` หรือ `<a target="_top" href="/h/nattapong">` |
| `sendGameEnd(score)` แค่บรรทัดเดียว | ส่ง mode + metadata.duration ด้วย |
| `score: 25.5` (float) | `score: Math.round(25.5)` (integer) |
| `gameSlug: 'TODO-CHANGE-ME'` | `gameSlug: 'fishing'` ตรงกับ DB |
| Save score ที่ localStorage แทน sendGameEnd | sendGameEnd ส่งคืน wrapper (wrapper บันทึก DB) |
| เขียน lucide shim เอง map ผิด level (node 3-tuple) | ใช้ `_mkIcon` จาก `_template-react.html` (อ่าน `node[2]`) |
| `const Map = _mkIcon('Map')` (ไอคอนชื่อชน JS global: Map/Set/Promise) | เปลี่ยนชื่อ binding → `MapIcon`/`SetIcon` — `const` ทับ global ใน lexical scope ที่แชร์ทุก script → Tailwind Play CDN เรียก `new Map().set()` พัง (`i.set is not a function`) → **ไม่มี CSS เลย** (เกมขึ้นแต่จอเบี้ยว ไม่ใช่จอดำ → render check ผ่าน จับไม่ได้ ต้องเปิด browser) |

---

## 🗄️ DB Migration Pattern

สร้างไฟล์ `supabase/migrations/NNN_seed_{slug}_game.sql` — **idempotent** (re-run ได้ไม่ซ้ำ):
keyed ที่ staff(เจ้าของ) + external_url, `INSERT ... WHERE NOT EXISTS` แล้ว `UPDATE` flags ทุกครั้ง
(ตัวอย่างจริง: `supabase/migrations/136_seed_vocab_move_game.sql`)

```sql
-- NNN_seed_{slug}_game.sql
DO $$
DECLARE
  v_staff_id  UUID;
  v_cat_games UUID;
  v_url       TEXT := '/games/{subject}/{slug}.html';
BEGIN
  SELECT id INTO v_staff_id FROM public.staff
  WHERE name LIKE '%ณัฐพงศ์%สิงห์ชมภู%' AND staff_type = 'teaching'
  ORDER BY created_at LIMIT 1;
  IF v_staff_id IS NULL THEN RAISE EXCEPTION 'staff not found'; END IF;

  SELECT id INTO v_cat_games FROM public.educational_hub_categories WHERE category_key = 'games';
  IF v_cat_games IS NULL THEN RAISE EXCEPTION 'category games not found (migration 061)'; END IF;

  INSERT INTO public.educational_hub_profiles (staff_id, is_hub_active)
  VALUES (v_staff_id, true) ON CONFLICT (staff_id) DO NOTHING;

  INSERT INTO public.educational_hub_items
    (owner_staff_id, category_id, item_type, title, external_url, subject, sort_order)
  SELECT v_staff_id, v_cat_games, 'link', '{ชื่อไทย}', v_url, '{วิชา}', {sort}
  WHERE NOT EXISTS (
    SELECT 1 FROM public.educational_hub_items
    WHERE owner_staff_id = v_staff_id AND external_url = v_url
  );

  UPDATE public.educational_hub_items
  SET game_slug = '{slug}', tracked_game = true, is_published = true,
      thumbnail_url = '/games/{subject}/{slug}-cover.svg', bgm_preset = 'playful', updated_at = now()
  WHERE owner_staff_id = v_staff_id AND external_url = v_url;

  -- 🔖 บังคับ: รายละเอียดเกม (game_docs) — รูปแบบ/ฟีเจอร์/เวอร์ชัน (สเปกเดียวต่อเกม, แก้ทับ)
  --    เห็นเฉพาะเจ้าของ+admin · ต้องอัปเดต + เด้งเวอร์ชันทุกครั้งที่สร้าง/แก้เกม (CLAUDE.md)
  INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
  SELECT i.id, i.owner_staff_id,
         '{รูปแบบ เช่น ตอบคำถาม/quiz}',
         ARRAY['{ฟีเจอร์ 1}','{ฟีเจอร์ 2}','{ฟีเจอร์ 3}'],
         'v1.0.0',
         'สร้างครั้งแรก'
  FROM public.educational_hub_items i
  WHERE i.owner_staff_id = v_staff_id AND i.external_url = v_url
  ON CONFLICT (item_id) DO UPDATE
    SET game_format = EXCLUDED.game_format,
        features    = EXCLUDED.features,
        version     = EXCLUDED.version,
        notes       = EXCLUDED.notes,
        updated_at  = now();
END $$;
```

ดู NNN ถัดไปจาก `ls supabase/migrations/ | tail`

⚠️ **ต้อง apply เข้า remote ด้วย** (ไฟล์ migration อย่างเดียวไม่พอ — DB จริงต้องมี row) ผ่าน
Supabase MCP `apply_migration` (project `lkpqssbqxxpasidfqhpb`) หรือ `supabase db push`

---

## 🤖 AI Prompt Templates

### A. Integrate เกมที่มีอยู่แล้ว (ที่ดีสุด: ใช้ slash command)

```
/integrate-game public/games/{subject}/{slug}.html
```

หรือ prompt แบบ manual:

```
อ่าน GAME.md และไฟล์ public/games/{subject}/{slug}.html
แล้วทำตาม integration checklist:
1. เพิ่ม EMBED block (ถ้ายังไม่มี)
2. ตั้ง GAME_SLUG = '{slug}'
3. เรียก sendGameEnd() ในจุดจบเกม
4. แทน window.location.href ด้วย navigateBack()
5. สร้าง migration NNN_seed_{slug}_game.sql
แล้วรัน pnpm verify:game public/games/{subject}/{slug}.html
```

### B. สร้างเกมใหม่จากศูนย์

```
สร้างเกม "{ชื่อเกม}" สำหรับนักเรียน {ระดับชั้น} วิชา {subject}
กติกา: {คำอธิบาย}
- copy public/games/_template-full.html → public/games/{subject}/{slug}.html
- GAME_SLUG = '{slug}'
- เขียน game logic ใน SECTION C เท่านั้น (ห้ามแก้ Section A/B)
- สร้าง migration NNN_seed_{slug}_game.sql
- รัน pnpm verify:game
```

### C. Debug เกมที่ส่งคะแนนไม่ได้

```
รัน pnpm verify:game <path> ก่อน
รายงานว่าผ่าน/ไม่ผ่าน check ไหน
ถ้าผ่านหมดแล้วแต่คะแนนไม่เข้า DB:
- ตรวจ console: STUDENT_CODE ถูก set ไหม
- ตรวจ Network: postMessage 'gameEnd' ถูกยิงไหม
- ตรวจ DB: SELECT * FROM educational_hub_items WHERE game_slug = '{slug}'
            ต้องมี tracked_game=true AND is_published=true
```

---

## 🛠️ Automation

| คำสั่ง | หน้าที่ |
|---|---|
| `pnpm verify:game <file>` | ตรวจ 8 จุด: 6 static (GAME_SLUG, sendGameEnd, navigateBack, init listener, sendGameEnd called, migration) + **Check 7 render smoke-test** (jsdom + React UMD — จับจอดำ/crash) + **Check 8 global-shadow** (ไอคอนชื่อชน JS global เช่น Map/Image → Tailwind ล่ม จอเบี้ยว) |
| `/integrate-game <file>` | Claude slash command — auto-integrate ตาม checklist |

> Check 7 ใช้ `jsdom` + `@babel/standalone` (devDeps) + ดาวน์โหลด React/lucide UMD cache ที่
> `node_modules/.cache/game-verify/`. ถ้า offline/ไม่มี deps → WARN skip (ไม่ทำให้ verifier fail).

**Template files (copy เป็นจุดเริ่มต้น):**
- `public/games/_template-folder/` — **แนะนำ** · โครงสร้าง 5 ไฟล์ (index/style/config/data/game) + sound + leaderboard + online (`cp -r`)
- `public/games/_template-full.html` — kampai + leaderboard + score HUD + lives HUD (canvas-based ตัวอย่าง)
- `public/games/_template-online.html` — เกมออนไลน์หลายคน (kampai-match: lobby+แข่งสด+อันดับ — เขียนแค่ gameplay)
- `public/games/_template.html` — basic kampai integration (ไม่มี leaderboard)
- `public/games/_template-react.html` — React 18 + Babel + lucide shim ที่ถูกต้อง (สำหรับเกม React component)

**Reference เกมจริง (copy pattern ได้):**
- `public/games/tech/word-shield.html` — Vanilla JS + leaderboard ครบ
- `public/games/thai/fishing.html` — pattern เกมเก่าที่ integrate แล้ว
- `public/games/math/mth.html` — React/Babel pattern (single-file JSX)

---

## ✅ Pre-Commit Checklist

รัน `pnpm verify:game <file>` — ต้องผ่าน 8/8 + ไม่มี anti-pattern warning

หรือเช็คด้วยตา:
- [ ] `GAME_SLUG` ตรงกับ `game_slug` ใน DB (ไม่ใช่ placeholder)
- [ ] `sendGameEnd()` ถูกเรียกในจุดจบเกม
- [ ] `navigateBack()` ใช้กับปุ่มกลับหน้าหลัก
- [ ] ไม่มี Firebase SDK ที่ active
- [ ] ไม่มี input ชื่อผู้เล่น (ใช้ DISPLAY_NAME_INIT)
- [ ] Migration SQL พร้อม
- [ ] **`pnpm verify:game` ผ่าน 8/8 (Check 7 render — ไม่จอดำ + Check 8 — ไอคอนไม่ชน JS global)**
- [ ] **เปิด browser จริง: เกมแสดงผล + ไอคอนขึ้นครบ + เล่นจบได้** (static + render check ไม่พอสำหรับ UX)
- [ ] ทดสอบ local: `/play/{slug}` → กรอกรหัส → เล่น → คะแนนขึ้น GamePlayDashboard

---

## 🎮 Wrapper จัดการให้อัตโนมัติ (เกมไม่ต้องทำ)

PlayGame wrapper ทำสิ่งเหล่านี้ — เกม HTML **ไม่ต้องเขียนเอง**:

- กรอกรหัสนักเรียน + lookup
- จำรหัสด้วย `localStorage` (auto-login ครั้งถัดไป)
- Exit menu 4 ตัวเลือก (เล่นซ้ำ / เลือกเกมอื่น / เปลี่ยนผู้เล่น / กลับหน้าหลัก)
- บันทึก `gameEnd` ลง `game_sessions` table
- อัปเดต XP / Achievement / Leaderboard
- จัดการ session persistence

---

## 🎨 มาตรฐานปกเกม (Game Cover Standard)

> 🔒 **กฎบังคับ — ปกต้องเป็น 16:9 เต็มช่องเสมอ:** ปกเกม = `educational_hub_items.thumbnail_url`
> **ต้องมีอัตราส่วน 16:9 (1280×720 พอดี)** ทุกครั้งที่สร้าง/เปลี่ยนปก — การ์ดเกม/Educational Hub/ตาราง
> แอดมินใช้กรอบ `aspect-video` (16:9) + `object-contain` (ไม่ครอป) → **ถ้าปกไม่ใช่ 16:9 จะมีขอบขาว/ดำ
> ไม่เต็มช่อง** (เคยพลาด: tank-commander ปกจัตุรัส 1024×1024). ไฟล์อยู่ `public/games/{subject}/{slug}-cover.{png|svg}`
>
> ✅ **บังคับด้วยอัตโนมัติ:** `pnpm verify:game <path>` **Check 9** จะ **fail** ถ้าปกไม่ใช่ 16:9 (±3%) —
> ต้องผ่านก่อน ship. SVG: ตั้ง `viewBox="0 0 1280 720"` · PNG/JPG: export ที่ 1280×720

**4 หลักการ (+ เพิ่มเติม):**
1. **สดใสระดับประถม** — โทนสีสดใส พื้นหลังไล่เฉดสว่าง + ประกายดาว/ไอคอนธีมวิชา
2. **มีเด็กนักเรียนเป็นตัวเอก** — chibi หัวโตน่ารัก **ใส่ชุดนักเรียนไทย** (เสื้อขาว/กรมท่า) ยิ้มสดใส
3. **ภาพประกอบ + ฉากเด่น** — เด็กกำลังทำกิจกรรมของเกม ฉากเด่นชัดเป็นจุดสนใจกลางภาพ
4. **ปกตรงกับเกม สื่อความหมายจากรูป** — มองรูปแล้วเดาได้ว่าเกมเกี่ยวกับอะไร
- **ตัวหนังสือ:** ชื่อเกมไทยตัวใหญ่อ่านชัด (ไม่ถูกภาพบัง) + ป้ายเล็ก `{วิชา} {ระดับชั้น}` · โทนสีตามวิชา

**ตัวอย่างที่ทำตามมาตรฐานนี้:**

| ต่อวงจรไฟฟ้า (วิทยาศาสตร์) | เติมลายสมมาตร (ศิลปะ) |
|---|---|
| ![circuit-builder](public/games/science/circuit-builder-cover.png) | ![symmetry-art](public/games/arts/symmetry-art-cover.png) |

**Prompt คัดลอกใช้:** `public/COVER-PROMPT.md` (served `/COVER-PROMPT.md` — มีปุ่ม "คัดลอก Prompt ปก" ใน GamesTab)
เติม `{ชื่อเกม}/{วิชา}/{ระดับชั้น}/{ฉาก}/{โทนสี}` แล้ววางใน Canva (YouTube Thumbnail) หรือ AI สร้างภาพอื่น

**Workflow ทำปกด้วย Canva (Claude Code + Canva MCP):**
```
1. generate-design  design_type='youtube_thumbnail'  query=<prompt ตาม COVER-PROMPT.md>  → 4 candidates
2. create-design-from-candidate (job_id + candidate_id) ทีละอัน
3. start-editing-transaction (design_id) → ได้ thumbnail preview + element_ids  → เลือกอันสวย/ธีมตรง
4. perform-editing-operations แก้ตัวหนังสือไทยให้ถูก (AI มักหล่นคำ):
     replace_text · resize_element (text ใส่แค่ width) · position_element · format_text
5. commit-editing-transaction
6. export-design  type=png 1280×720 export_quality=pro  → curl download URL ลง public/games/{subj}/{slug}-cover.png
7. migration NNN เปลี่ยน thumbnail_url เป็น '.png' (+ apply remote) · ลบไฟล์ปกเก่า
```
> Canva **export ได้แค่ PNG/JPG (ไม่มี SVG)** · candidate thumbnail URL (design.canva.ai) เปิดตรงไม่ได้
> ต้อง create+start-transaction ถึงเห็นภาพ · **verify ด้วยตาเสมอ** (Read PNG) ตรวจตัวหนังสือไทย + 16:9 ไม่เพี้ยน

**Checklist ก่อนใช้ปก:** [ ] 16:9 · [ ] เด็กนักเรียน + ฉากตรงเกม · [ ] ชื่อไทยถูก+อ่านชัด · [ ] สีสดใส · [ ] verify ด้วยตา

---

*v1.64.0 — วัฒนธรรมเกม v2: โครงสร้างโฟลเดอร์ 5 ไฟล์ (`_template-folder` + นำร่อง `english/listen-spell/`) + โหมดออนไลน์ "ถามก่อนสร้าง" + verify รองรับเกมโฟลเดอร์ (inline siblings). v1.63.x — sync วัฒนธรรมเกม: เช็กลิสต์มาตรฐานจุดเดียว + sound API ในตาราง SDK + หมวด AR/กล้อง + migration pattern (idempotent + apply remote) + 8/8 checks. v1.41.0 — KAMPAI SDK (/games/kampai-sdk.js) + in-game leaderboard ผ่าน init + D-pad มือถือ + GAME-PROMPT.md. v1.40.6 — Check 7 render smoke-test + _template-react.html. อัปเดตล่าสุดดู `src/components/admin/system/SystemOverview.tsx`*
