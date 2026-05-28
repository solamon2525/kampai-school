# GAME.md — มาตรฐาน Integrate เกม HTML เข้าระบบ kampai-school

> **Single source of truth สำหรับ AI + นักพัฒนา**
> เป้าหมาย: integrate เกมใหม่ภายใน 5 นาที — ผ่าน verify ครบ ไม่มี bug ซ้ำเดิม

---

## ⚡ TL;DR

```
1.  cp public/games/_template-full.html  public/games/{subject}/{slug}.html
2.  แก้ GAME_SLUG = '{slug}'  (1 ที่ใน <script>)
3.  เขียน game logic ใน SECTION C
4.  สร้าง supabase/migrations/NNN_seed_{slug}_game.sql
5.  pnpm verify:game public/games/{subject}/{slug}.html   # ต้องผ่าน 6/6 checks
```

มีแล้ว: kampai postMessage + Supabase leaderboard + Score HUD + Lives HUD
ห้ามทำ: input ชื่อผู้เล่น, Firebase SDK, `window.location.href` ตรง ๆ

---

## 🧭 Decision Tree

```
เริ่มเกมใหม่
├─ สร้างจากศูนย์         → cp _template-full.html  (มี leaderboard ครบ)
├─ ไม่อยาก leaderboard   → cp _template.html       (basic version)
└─ มีไฟล์เกมเก่าอยู่แล้ว    → /integrate-game <path>  (Claude slash command)

แก้ไขเกมเดิม
├─ ตรวจสอบสถานะ        → pnpm verify:game <path>
├─ Claude ช่วย integrate → /integrate-game <path>
└─ แก้เอง              → อ่าน Section "EMBED Block" + "postMessage Protocol"
```

---

## 🔌 EMBED Block (canonical version)

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

---

## 🗄️ DB Migration Pattern

สร้างไฟล์ `supabase/migrations/NNN_seed_{slug}_game.sql`:

```sql
-- NNN_seed_{slug}_game.sql
UPDATE educational_hub_items
SET
    external_url  = '/games/{subject}/{slug}.html',
    game_slug     = '{slug}',
    tracked_game  = true,
    is_published  = true,
    updated_at    = now()
WHERE id = 'UUID-OF-ITEM';
-- หา UUID: SELECT id, name FROM educational_hub_items WHERE name ILIKE '%ชื่อเกม%';
```

ดู NNN ถัดไปจาก `ls supabase/migrations/ | tail`

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
| `pnpm verify:game <file>` | ตรวจ 6 จุด integration (GAME_SLUG, sendGameEnd, navigateBack, init listener, sendGameEnd called, migration) |
| `/integrate-game <file>` | Claude slash command — auto-integrate ตาม checklist |

**Template files (copy เป็นจุดเริ่มต้น):**
- `public/games/_template-full.html` — kampai + leaderboard + score HUD + lives HUD (canvas-based ตัวอย่าง)
- `public/games/_template.html` — basic kampai integration (ไม่มี leaderboard)

**Reference เกมจริง (copy pattern ได้):**
- `public/games/tech/word-shield.html` — Vanilla JS + leaderboard ครบ
- `public/games/thai/fishing.html` — pattern เกมเก่าที่ integrate แล้ว
- `public/games/math/mth.html` — React/Babel pattern (single-file JSX)

---

## ✅ Pre-Commit Checklist

รัน `pnpm verify:game <file>` — ต้องผ่าน 6/6 + ไม่มี anti-pattern warning

หรือเช็คด้วยตา:
- [ ] `GAME_SLUG` ตรงกับ `game_slug` ใน DB (ไม่ใช่ placeholder)
- [ ] `sendGameEnd()` ถูกเรียกในจุดจบเกม
- [ ] `navigateBack()` ใช้กับปุ่มกลับหน้าหลัก
- [ ] ไม่มี Firebase SDK ที่ active
- [ ] ไม่มี input ชื่อผู้เล่น (ใช้ DISPLAY_NAME_INIT)
- [ ] Migration SQL พร้อม
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

*v1.39.0 — อัปเดตล่าสุดดู `src/components/admin/system/SystemOverview.tsx`*
