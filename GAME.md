# GAME.md — คู่มือมาตรฐาน: Integrate เกม HTML เข้าระบบ kampai-school

> **เอกสารนี้สำหรับ:** Claude AI + นักพัฒนา เมื่อต้องการนำเกม HTML ใหม่เข้าระบบ  
> **เป้าหมาย:** ลดเวลา integrate จาก ~2 ชั่วโมง → ~15 นาที โดยไม่ต้องแก้ปัญหาเดิมซ้ำ

---

## 1. สถาปัตยกรรมภาพรวม

```
Browser
└── /play/{slug}   (PlayGame.tsx — React wrapper)
    ├── หน้ากรอกรหัส (lookup phase)
    ├── หน้ายืนยันตัวตน (confirm phase)
    └── <iframe src="/games/{subject}/{slug}.html">  ← เกม HTML อยู่ตรงนี้
```

### หน้าที่แบ่งระหว่าง Wrapper vs เกม HTML

| สิ่งที่ต้องทำ | PlayGame Wrapper (อัตโนมัติ) | เกม HTML (ต้องทำเอง) |
|---|---|---|
| กรอกรหัสนักเรียน | ✅ | — |
| Auto-login (จำรหัสด้วย localStorage) | ✅ | — |
| Exit menu (เล่นซ้ำ / เปลี่ยนผู้เล่น / กลับหน้าหลัก) | ✅ | — |
| Session persistence ข้ามเกม | ✅ | — |
| ส่ง `init` message พร้อม studentCode + displayName | ✅ | — |
| รับ `init` message, เก็บ studentCode | — | ✅ |
| คำนวณคะแนน | — | ✅ |
| ส่ง `gameEnd` message กลับ wrapper | — | ✅ |
| ส่ง `navigate` message เมื่อกดปุ่มกลับ | — | ✅ |
| บันทึกคะแนนลง Supabase | ✅ (รับจาก gameEnd) | — |
| อัปเดต XP / Badge / Leaderboard | ✅ | — |

**สรุป:** เกม HTML ต้องทำแค่ 4 จุด — รับ init, คำนวณ score, ส่ง gameEnd, ส่ง navigate

---

## 2. kampai EMBED Block (copy-paste ready)

### 2A. Vanilla JS (เกม HTML ทั่วไป — แนะนำ)

วางไว้ **ต้นสุดของ `<script>` tag หลัก** ก่อนตัวแปรอื่นทั้งหมด:

```javascript
// ─── kampai-school integration ────────────────────────────────────────────────
// อย่าแก้ส่วนนี้ — ทำงานร่วมกับ PlayGame wrapper (/play/{slug})
const IS_EMBED = window.self !== window.top ||
                 new URLSearchParams(location.search).get('embed') === '1';

const GAME_SLUG = 'CHANGE-ME';   // ← ต้องตรงกับ educational_hub_items.game_slug ใน DB

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

    // anchor interceptor: เปลี่ยน <a target="_top"> → postMessage
    document.addEventListener('click', (e) => {
        const a = e.target.closest('a[target="_top"]');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!href) return;
        e.preventDefault();
        try { window.parent.postMessage({ type: 'navigate', to: href }, '*'); } catch (_) {}
    });
}

/**
 * เรียกเมื่อเกมจบ (แพ้/ชนะ/ครบเวลา)
 * @param {number} finalScore  - คะแนนสุดท้าย (integer)
 * @param {string} mode        - ชื่อ mode เกม เช่น 'normal', 'hard', 'test'
 * @param {Object} extra       - metadata เพิ่มเติม เช่น { wave, lives }
 */
function sendGameEnd(finalScore, mode, extra) {
    if (!IS_EMBED || !STUDENT_CODE) return;
    try {
        window.parent.postMessage({
            type:        'gameEnd',
            gameSlug:    GAME_SLUG,
            studentCode: STUDENT_CODE,
            score:       Math.round(finalScore),
            mode:        mode,
            metadata: {
                duration: Math.max(1, Math.floor((Date.now() - SESSION_START_TS) / 1000)),
                ...extra,
            },
        }, '*');
    } catch (_) {}
}

/** เรียกเมื่อกดปุ่ม "กลับหน้าหลัก" หรือ "ออกจากเกม" */
function navigateBack() {
    if (IS_EMBED) {
        try { window.parent.postMessage({ type: 'navigate', to: '/h/nattapong' }, '*'); } catch (_) {}
    } else {
        window.location.href = '/h/nattapong';
    }
}
// ──────────────────────────────────────────────────────────────────────────────
```

### 2B. React/Babel (เกมที่ใช้ JSX in `<script type="text/babel">`)

วางไว้ **ก่อน** `const { useState, useEffect, ... } = React;`:

```javascript
// ─── kampai-school integration ────────────────────────────────────────────────
const IS_EMBED = window.self !== window.top ||
                 new URLSearchParams(location.search).get('embed') === '1';

const GAME_SLUG = 'CHANGE-ME';   // ← ต้องตรงกับ game_slug ใน DB

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
}

function sendGameEnd(finalScore, mode, extra) {
    if (!IS_EMBED || !STUDENT_CODE) return;
    try {
        window.parent.postMessage({
            type:        'gameEnd',
            gameSlug:    GAME_SLUG,
            studentCode: STUDENT_CODE,
            score:       Math.round(finalScore),
            mode:        mode,
            metadata: {
                duration: Math.max(1, Math.floor((Date.now() - SESSION_START_TS) / 1000)),
                ...extra,
            },
        }, '*');
    } catch (_) {}
}

function navigateBack() {
    if (IS_EMBED) {
        try { window.parent.postMessage({ type: 'navigate', to: '/h/nattapong' }, '*'); } catch (_) {}
    }
}
// ──────────────────────────────────────────────────────────────────────────────
```

**เพิ่มเติมสำหรับ React component** (ป้องกัน stale closure):

```javascript
// ใน App component — หลัง state declarations:
const levelIndexRef = useRef(0);
const hpRef         = useRef(5);
useEffect(() => { levelIndexRef.current = levelIndex; }, [levelIndex]);
useEffect(() => { hpRef.current = hp; }, [hp]);

// Pre-fill ชื่อจาก wrapper (run once on mount):
useEffect(() => {
    if (IS_EMBED && DISPLAY_NAME_INIT && !playerName) {
        setPlayerName(DISPLAY_NAME_INIT);
    }
}, []); // eslint-disable-line react-hooks/exhaustive-deps

// Fire gameEnd เมื่อ mode เปลี่ยนเป็น 'gameover' หรือ 'certificate':
useEffect(() => {
    if (mode === 'certificate') {
        sendGameEnd(
            (levelIndexRef.current + 1) * 10 + hpRef.current * 2,
            'test',
            { levelReached: levelIndexRef.current + 1, hpRemaining: hpRef.current, result: 'pass' }
        );
    } else if (mode === 'gameover') {
        sendGameEnd(
            levelIndexRef.current * 10,
            'test',
            { levelReached: levelIndexRef.current, hpRemaining: 0, result: 'fail' }
        );
    }
}, [mode]); // eslint-disable-line react-hooks/exhaustive-deps
```

---

## 3. postMessage Protocol

### 3A. Parent → iframe: `init`

```json
{
  "type":        "init",
  "studentCode": "S001",
  "displayName": "น้องแพนด้า ม.2/3"
}
```

ส่งมาหลัง iframe โหลดเสร็จ (ประมาณ 500ms delay) — เกมควรรอให้ `STUDENT_CODE !== null` ก่อน

### 3B. iframe → Parent: `gameEnd`

```json
{
  "type":        "gameEnd",
  "gameSlug":    "word-shield",
  "studentCode": "S001",
  "score":       1250,
  "mode":        "hard",
  "metadata": {
    "duration":    87,
    "wordsTyped":  32,
    "wave":        5,
    "lives":       1
  }
}
```

| field | type | หมายเหตุ |
|---|---|---|
| `gameSlug` | string | ต้องตรงกับ `educational_hub_items.game_slug` |
| `studentCode` | string | จาก `STUDENT_CODE` (รับมาจาก init) |
| `score` | integer | `Math.round(...)` — ห้ามส่ง float |
| `mode` | string | ชื่อ mode ใดก็ได้ เช่น `'normal'`, `'hard'`, `'test'`, `'tutorial'` |
| `metadata.duration` | integer | วินาที (คำนวณจาก `SESSION_START_TS`) |
| `metadata.*` | any | เพิ่ม field อื่นๆ ตามต้องการ (wave, level, hp ฯลฯ) |

### 3C. iframe → Parent: `navigate`

```json
{
  "type": "navigate",
  "to":   "/h/nattapong"
}
```

ใช้แทนการเปลี่ยน `window.location.href` ตรงๆ เพราะ iframe ไม่มีสิทธิ์ navigate parent โดยตรง

---

## 4. Supabase Leaderboard (ตัวเลือก — copy-paste ready)

เพิ่มใน Start Screen เพื่อกระตุ้น engagement แสดง top-5 นักเรียน

### 4A. HTML (start screen + gameover screen)

```html
<!-- ใน start screen — วางแทนที่ input ชื่อผู้เล่น -->
<div class="leaderboard-box">
    <h3 class="lb-title">🏆 อันดับนักเรียน</h3>
    <ul id="score-list" class="leaderboard-list">
        <li class="lb-loading">กำลังโหลด...</li>
    </ul>
</div>

<!-- ใน gameover screen (ถ้าต้องการ) -->
<div class="leaderboard-box" style="margin-top:12px;">
    <h3 class="lb-title">🏆 อันดับล่าสุด</h3>
    <ul id="score-list-gameover" class="leaderboard-list">
        <li class="lb-loading">กำลังโหลด...</li>
    </ul>
</div>
```

### 4B. CSS

```css
/* Leaderboard */
.leaderboard-box        { background:#f8f9fa; border-radius:12px; padding:12px 15px; margin:10px 0; }
.lb-title               { font-family:'Fredoka One',cursive; color:#2c3e50; font-size:1rem; margin:0 0 8px 0; }
.leaderboard-list       { list-style:none; padding:0; margin:0; display:flex; flex-direction:column; gap:4px; }
.leaderboard-list li    { display:flex; align-items:center; gap:8px; padding:4px 2px; border-bottom:1px dashed #dee2e6; }
.leaderboard-list li:last-child { border-bottom:none; }
.lb-entry               { display:flex; align-items:center; gap:8px; width:100%; }
.lb-avatar              { width:36px; height:36px; border-radius:50%; object-fit:cover; border:2px solid #f39c12; flex-shrink:0; }
.lb-avatar-init         { width:36px; height:36px; border-radius:50%; background:linear-gradient(135deg,#6c5ce7,#a29bfe);
                          color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:1rem; flex-shrink:0; }
.lb-entry-info          { display:flex; flex-direction:column; min-width:0; flex:1; }
.lb-entry-name          { font-family:'Fredoka One',cursive; font-size:0.9rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; color:#2c3e50; }
.lb-entry-sub           { font-size:0.72rem; color:#868e96; }
.lb-loading             { color:#868e96; text-align:center; padding:8px; font-size:0.85rem; }
```

### 4C. JavaScript

```javascript
// ─── Supabase Leaderboard ─────────────────────────────────────────────────────
const SB_URL  = 'https://lkpqssbqxxpasidfqhpb.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcHFzc2JxeHhwYXNpZGZxaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjUyMjgsImV4cCI6MjA5MTI0MTIyOH0.X7YsSlrgYl9ifLWvgyZI04PtebK572pacadfNlmNO-A';

async function fetchGameLeaderboard(slug, limit = 5) {
    try {
        const res = await fetch(`${SB_URL}/rest/v1/rpc/get_game_leaderboard`, {
            method:  'POST',
            headers: { 'apikey': SB_ANON, 'Content-Type': 'application/json' },
            body:    JSON.stringify({ p_game_slug: slug, p_limit: limit }),
        });
        return res.ok ? await res.json() : [];
    } catch { return []; }
}

function renderGameLeaderboard(rows, listId = 'score-list') {
    const medals = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
    const el = document.getElementById(listId);
    if (!el) return;
    if (!rows.length) {
        el.innerHTML = '<li class="lb-loading">ยังไม่มีผู้เล่น — เป็นคนแรกสิ!</li>';
        return;
    }
    el.innerHTML = rows.map((r, i) => {
        const av = r.photo_url
            ? `<img class="lb-avatar" src="${r.photo_url}" alt="${r.display_name}">`
            : `<div class="lb-avatar-init">${(r.display_name || '?')[0].toUpperCase()}</div>`;
        return `<li><div class="lb-entry">
            <span style="font-family:'Fredoka One',cursive;color:#f39c12;min-width:26px;text-align:center;font-size:1.1rem">${medals[i] || i + 1}</span>
            ${av}
            <div class="lb-entry-info">
                <div class="lb-entry-name">${r.display_name}</div>
                <div class="lb-entry-sub">${(r.personal_best || 0).toLocaleString()} คะแนน · ${r.class_label || ''}</div>
            </div>
        </div></li>`;
    }).join('');
}

// เรียกตอนโหลดหน้า (แก้ GAME_SLUG ให้ตรง)
fetchGameLeaderboard(GAME_SLUG, 5).then(rows => renderGameLeaderboard(rows, 'score-list'));

// เรียกอีกครั้งหลังเกมจบ (ก่อน showScreen('gameover')):
// fetchGameLeaderboard(GAME_SLUG, 5).then(rows => renderGameLeaderboard(rows, 'score-list-gameover'));
// ──────────────────────────────────────────────────────────────────────────────
```

**LeaderboardRow fields** จาก RPC:

| field | type | หมายเหตุ |
|---|---|---|
| `display_name` | string | ชื่อนักเรียน |
| `photo_url` | string\|null | URL รูปโปรไฟล์ |
| `class_label` | string | ชั้นเรียน เช่น "ม.2/3" |
| `personal_best` | integer | คะแนนสูงสุดตลอดกาล |
| `plays_count` | integer | จำนวนครั้งที่เล่น |

---

## 5. DB Migration Pattern

สร้างไฟล์ `supabase/migrations/NNN_seed_{slug}_game.sql`:

```sql
-- NNN_seed_{slug}_game.sql
-- Register {Game Name} in educational_hub_items

UPDATE educational_hub_items
SET
    external_url  = '/games/{subject}/{slug}.html',
    game_slug     = '{slug}',
    tracked_game  = true,
    is_published  = true,
    updated_at    = now()
WHERE id = 'UUID-OF-THE-ITEM';

-- ถ้าไม่รู้ UUID → ค้นหาด้วย:
-- SELECT id, name, external_url FROM educational_hub_items WHERE name ILIKE '%ชื่อเกม%';

-- ถ้ายังไม่มี record เลย → INSERT ใหม่:
-- INSERT INTO educational_hub_items
--     (id, name, description, category_id, subject, external_url, game_slug, tracked_game, is_published)
-- VALUES
--     (gen_random_uuid(), 'ชื่อเกม', 'คำอธิบาย', 'UUID-CATEGORY', 'เทคโนโลยี',
--      '/games/tech/{slug}.html', '{slug}', true, true);
```

**ชื่อไฟล์ migration:** ใช้ prefix ต่อจากไฟล์ล่าสุดใน `supabase/migrations/` เช่น `100_seed_my_game.sql`  
**ห้ามแก้ migration เก่า** — สร้างไฟล์ใหม่เสมอ

---

## 6. Score Formula แนะนำ

| รูปแบบเกม | mode | score formula | ตัวอย่าง |
|---|---|---|---|
| เกมสะสมคะแนนต่อเนื่อง | `'normal'` | ส่งตัวแปร `score` ตรงๆ | fishing, word-shield |
| เกมมี wave/level | `'normal'` | `score` (ระบบเกมคำนวณเอง) | math-jumper |
| เกมมี HP/lives | `'normal'` | `score` + metadata lives | word-shield |
| เกมทดสอบ (pass) | `'test'` | `(level + 1) * 10 + hp * 2` | mth.html |
| เกมทดสอบ (fail) | `'test'` | `level * 10` | mth.html |
| เกมฝึก/tutorial | `'tutorial'` | flat `50` (participation) | mth.html |
| custom mode (ครูตั้งโจทย์) | `'custom'` | ไม่ส่ง sendGameEnd | mth.html |

**หลักการ:** คะแนนต้องเป็น integer, สะท้อนความสำเร็จจริง (ไม่ควรส่ง 0 เสมอ)

---

## 7. สิ่งที่ต้องลบออกจากเกมเดิม

เกมส่วนใหญ่มี 3rd-party ที่ขัดแย้งกับระบบ kampai:

| สิ่งที่พบบ่อย | วิธีจัดการ |
|---|---|
| Firebase SDK (`<script src="gstatic.com/firebasejs/...">`) | ลบ/comment `<script>` tags ทั้งหมด |
| `saveScoreToFirebase()` | comment ออก + แทนด้วย `sendGameEnd()` |
| `loadLeaderboard()` จาก Firebase | ลบ + แทนด้วย `fetchGameLeaderboard()` |
| input ชื่อผู้เล่น (`#player-name`) | ลบออก + ใช้ `DISPLAY_NAME_INIT` แทน |
| `window.location.href = '../index.html'` | แทนด้วย `navigateBack()` |
| localStorage highscore (เกมเดิม) | เก็บไว้ได้ถ้าไม่ขัด — แต่ไม่บังคับ |

---

## 8. ไฟล์อ้างอิง (Reference)

| ไฟล์ | ใช้เป็น reference สำหรับ |
|---|---|
| `public/games/_template.html` | เกม Vanilla JS ใหม่ — โครงสร้างครบทุกส่วน |
| `public/games/tech/word-shield.html` | เกม Vanilla JS ที่ integrate แล้ว — kampai + leaderboard |
| `public/games/math/mth.html` | เกม React/Babel — pattern `useEffect` + `useRef` |
| `public/games/thai/fishing.html` | เกมเก่าที่มี kampai ครบ |
| `src/pages/PlayGame.tsx` | React wrapper — ดูว่า init/gameEnd ถูก handle อย่างไร |

---

## 9. เช็คลิสต์ก่อน Commit/Push

```
□ GAME_SLUG ใน HTML ตรงกับ game_slug ใน DB
□ sendGameEnd() ส่งครบ: gameSlug, studentCode, score, mode, metadata.duration
□ navigateBack() ใช้ postMessage (ไม่ใช่ window.location.href ตรงๆ)
□ ลบ Firebase SDK และ saveScoreToFirebase() ออกแล้ว (ถ้ามี)
□ ลบ input ชื่อผู้เล่นออกแล้ว (ถ้ามี) — ใช้ DISPLAY_NAME_INIT แทน
□ ไม่มี external JS library ที่ไม่จำเป็นหรืออาจ timeout
□ สร้าง migration SQL แล้ว (NNN_seed_{slug}_game.sql)
□ ทดสอบ local: pnpm dev → /play/{slug} → กรอกรหัส → เล่น → คะแนนขึ้น
□ อัปเดต versionHistory ใน SystemOverview.tsx
```

---

## 10. ขั้นตอน Integrate สรุป (5 นาที)

```
1. copy EMBED block (Section 2A หรือ 2B) → วางต้นสุด <script>
2. แก้ GAME_SLUG = '{slug}'
3. แก้ endGame() หรือ gameOver() → เรียก sendGameEnd()
4. แก้ปุ่มกลับ → เรียก navigateBack()
5. (ถ้าต้องการ) เพิ่ม leaderboard HTML+CSS+JS (Section 4)
6. สร้าง migration SQL (Section 5)
7. git push → apply migration → test /play/{slug}
```

---

*อัปเดตล่าสุด: v1.38.8 — ดู commit history สำหรับ changelog เต็ม*
