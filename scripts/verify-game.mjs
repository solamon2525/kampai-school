#!/usr/bin/env node
/**
 * verify-game.mjs
 *
 * ตรวจสอบว่าเกม HTML มี kampai integration ครบหรือไม่ ตาม GAME.md
 *
 * USAGE:
 *   pnpm verify:game public/games/tech/word-shield.html
 *   pnpm verify:game public/games/_template-full.html
 *   node scripts/verify-game.mjs public/games/thai/fishing.html
 *
 * EXIT CODE:
 *   0 = ผ่านทุก check
 *   1 = ขาด integration หรือมี anti-pattern
 */

import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

// ─── Color helpers ──────────────────────────────────────────────────────────
const RESET = '\x1b[0m', RED = '\x1b[31m', GREEN = '\x1b[32m', YELLOW = '\x1b[33m', CYAN = '\x1b[36m', BOLD = '\x1b[1m';
const PASS = `${GREEN}✅${RESET}`;
const FAIL = `${RED}❌${RESET}`;
const WARN = `${YELLOW}⚠️${RESET}`;

// ─── CLI args ────────────────────────────────────────────────────────────────
const cliArgs = process.argv.slice(2);
const targetArg = cliArgs.find((arg) => !arg.startsWith('--'));
const strictMode = cliArgs.includes('--strict');
const jsonOnly = cliArgs.includes('--json');
const reportArg = cliArgs.find((arg) => arg.startsWith('--report='));
const reportPath = resolve(REPO_ROOT, reportArg ? reportArg.slice('--report='.length) : '.artifacts/game-verify/static.json');
if (!targetArg) {
    console.error(`${FAIL} ${BOLD}Usage:${RESET} pnpm verify:game <path-to-game.html>`);
    console.error(`        เช่น: pnpm verify:game public/games/tech/word-shield.html`);
    process.exit(1);
}

// รองรับ "เกมโฟลเดอร์" (5 ไฟล์): ชี้ที่โฟลเดอร์ → ใช้ index.html ข้างใน
let filePath = resolve(REPO_ROOT, targetArg);
if (existsSync(filePath) && statSync(filePath).isDirectory()) filePath = join(filePath, 'index.html');
if (!existsSync(filePath)) {
    console.error(`${FAIL} ไม่พบไฟล์: ${filePath}`);
    process.exit(1);
}

const gameDir = dirname(filePath);
const isFolderGame = basename(filePath).toLowerCase() === 'index.html';
const html = readFileSync(filePath, 'utf8');
const fileName = isFolderGame ? basename(gameDir) : basename(filePath, '.html');

/**
 * เกมโฟลเดอร์แตก logic/data/config เป็น <script src="relative.js"> sibling —
 * static checks ต้องเห็นโค้ดครบ → ต่อเนื้อไฟล์ sibling (relative เท่านั้น = ไฟล์ของเกมเอง)
 * เข้ากับ html. ข้าม CDN + local-absolute (/games/kampai-*.js = framework ไม่ใช่โค้ดเกม
 * — กัน submitScore ของ framework ทำให้ Check 5 ผ่านปลอม)
 */
function collectGameScripts(src, dir) {
    let extra = '';
    for (const m of src.matchAll(/<script\b[^>]*\ssrc=["']([^"']+)["'][^>]*><\/script>/g)) {
        const s = m[1];
        if (/^https?:/.test(s) || /^\/\//.test(s) || /^\//.test(s)) continue; // CDN/framework → ข้าม
        const p = join(dir, s);
        if (existsSync(p)) { try { extra += `\n/* ${s} */\n` + readFileSync(p, 'utf8'); } catch { /* */ } }
    }
    return extra ? src + extra : src;
}
const scanSource = collectGameScripts(html, gameDir);

// เกมที่ใช้ KAMPAI SDK (/games/kampai-sdk.js) — integration อยู่ใน SDK ไม่ใช่ในไฟล์เกม
const usesSdk = /kampai-sdk\.js/.test(html) || /KAMPAI\s*\.\s*(submitScore|setSlug|onReady|goHome)/.test(scanSource);

if (!jsonOnly) {
    console.log(`\n${BOLD}${CYAN}🎮 Verify Game Integration${RESET}`);
    console.log(`${CYAN}File:${RESET} ${targetArg}\n`);
}

const issues = [];
const warnings = [];

// ─── Check 1: GAME_SLUG ─────────────────────────────────────────────────────
// รับได้ทั้ง `const GAME_SLUG='x'` (ไฟล์เดียว) และ `SLUG:'x'` (config.js เกมโฟลเดอร์) / `setSlug('x')`
const slugMatch = scanSource.match(/const\s+GAME_SLUG\s*=\s*['"]([^'"]+)['"]/)
    || scanSource.match(/\bSLUG\s*:\s*['"]([^'"]+)['"]/)
    || scanSource.match(/setSlug\(\s*['"]([^'"]+)['"]\s*\)/);
let detectedSlug = null;
if (!slugMatch) {
    issues.push({
        check: 'GAME_SLUG',
        msg:   "ไม่พบ `const GAME_SLUG = '...'` — copy EMBED block จาก GAME.md Section 3",
    });
    console.log(`${FAIL} Check 1 — GAME_SLUG: ไม่พบการประกาศ`);
} else {
    detectedSlug = slugMatch[1];
    if (detectedSlug === 'placeholder-slug' || detectedSlug === 'TODO-CHANGE-ME' || detectedSlug === 'CHANGE-ME') {
        issues.push({
            check: 'GAME_SLUG',
            msg:   `GAME_SLUG ยังเป็น '${detectedSlug}' — เปลี่ยนเป็น slug จริง (แนะนำ: '${fileName}')`,
        });
        console.log(`${FAIL} Check 1 — GAME_SLUG: ยังเป็น placeholder ('${detectedSlug}')`);
    } else {
        console.log(`${PASS} Check 1 — GAME_SLUG: '${detectedSlug}'`);
    }
}

// ─── Check 2: score-submit available (SDK: KAMPAI.submitScore | legacy: sendGameEnd) ──
if (!(usesSdk || /function\s+sendGameEnd\s*\(/.test(scanSource))) {
    issues.push({
        check: 'sendGameEnd',
        msg:   'ไม่พบ `KAMPAI.submitScore` (SDK) หรือ `function sendGameEnd(...)` — โหลด /games/kampai-sdk.js หรือ copy EMBED block',
    });
    console.log(`${FAIL} Check 2 — score submit: ไม่พบ (SDK/sendGameEnd)`);
} else {
    console.log(`${PASS} Check 2 — score submit: ${usesSdk ? 'KAMPAI SDK' : 'sendGameEnd'}`);
}

// ─── Check 3: กลับหน้าหลัก (SDK: KAMPAI.goHome | legacy: navigateBack | a[target=_top]) ──
if (!(usesSdk || /function\s+navigateBack\s*\(/.test(scanSource) || /target=["']_top["']/.test(scanSource))) {
    issues.push({
        check: 'navigateBack',
        msg:   'ไม่พบทางกลับหน้าหลัก — `KAMPAI.goHome()` (SDK) หรือ `function navigateBack()` หรือ <a target="_top">',
    });
    console.log(`${FAIL} Check 3 — navigate back: ไม่พบ`);
} else {
    console.log(`${PASS} Check 3 — navigate back: ${usesSdk ? 'KAMPAI.goHome' : 'OK'}`);
}

// ─── Check 4: รับข้อมูลนักเรียน (SDK จัดการ init ให้ | legacy: init listener) ──────────
const hasInitListener = /addEventListener\s*\(\s*['"]message['"][\s\S]{0,500}type\s*===?\s*['"]init['"]/.test(scanSource);
if (!(usesSdk || hasInitListener)) {
    issues.push({
        check: 'init listener',
        msg:   "ไม่พบการรับ init — โหลด /games/kampai-sdk.js หรือเพิ่ม message listener สำหรับ type 'init'",
    });
    console.log(`${FAIL} Check 4 — init: ไม่พบ`);
} else {
    console.log(`${PASS} Check 4 — init: ${usesSdk ? 'KAMPAI SDK' : 'listener'}`);
}

// ─── Check 5: ต้อง "เรียก" submit จริง (SDK: KAMPAI.submitScore( | legacy: sendGameEnd ≥2) ──
const sdkSubmitCalls = (scanSource.match(/KAMPAI\s*\.\s*submitScore\s*\(/g) || []).length;
const sendCalls = (scanSource.match(/sendGameEnd\s*\(/g) || []).length;
const submitCalled = usesSdk ? sdkSubmitCalls >= 1 : sendCalls >= 2;
if (!submitCalled) {
    issues.push({
        check: 'sendGameEnd called',
        msg:   usesSdk
            ? 'ไม่พบการเรียก `KAMPAI.submitScore(...)` — ต้องเรียกตอนเกมจบ (endGame/gameOver)'
            : 'sendGameEnd ถูก define แต่ไม่ถูก "เรียก" จริง — ต้องเรียกตอนเกมจบ',
    });
    console.log(`${FAIL} Check 5 — submit called: ${usesSdk ? `KAMPAI.submitScore ${sdkSubmitCalls} ครั้ง` : `พบเพียง ${sendCalls}`}`);
} else {
    console.log(`${PASS} Check 5 — submit called: ${usesSdk ? `KAMPAI.submitScore ${sdkSubmitCalls} ครั้ง` : `${sendCalls - 1} ครั้ง`}`);
}

// ─── Check 6: migration file exists for this slug ───────────────────────────
const migrationsDir = join(REPO_ROOT, 'supabase', 'migrations');
let migrationFound = false;
let migrationPath = null;
if (detectedSlug && detectedSlug !== 'placeholder-slug' && existsSync(migrationsDir)) {
    const files = readdirSync(migrationsDir);
    const slugNoDash = detectedSlug.replace(/-/g, '_');
    migrationFound = files.some((f) => {
        const lower = f.toLowerCase();
        const filenameMatch = lower.includes(detectedSlug.toLowerCase()) || lower.includes(slugNoDash.toLowerCase());
        if (filenameMatch) { migrationPath = join(migrationsDir, f); return true; }
        if (f.endsWith('075_track_all_legacy_games.sql')) {
            try {
                const content = readFileSync(join(migrationsDir, f), 'utf8');
                if (content.includes(detectedSlug)) { migrationPath = join(migrationsDir, f); return true; }
                return false;
            } catch { return false; }
        }
        return false;
    });
}
if (!detectedSlug || detectedSlug === 'placeholder-slug') {
    warnings.push({
        check: 'migration',
        msg:   'ข้าม Check 6 (ไม่มี slug จริง)',
    });
    console.log(`${WARN} Check 6 — migration: ข้าม (ไม่มี slug จริง)`);
} else if (!migrationFound) {
    issues.push({
        check: 'migration',
        msg:   `ไม่พบ migration สำหรับ slug='${detectedSlug}' — สร้างไฟล์ supabase/migrations/NNN_seed_${detectedSlug.replace(/-/g, '_')}_game.sql`,
    });
    console.log(`${FAIL} Check 6 — migration: ไม่พบ`);
} else {
    console.log(`${PASS} Check 6 — migration: พบไฟล์ที่อ้างถึง '${detectedSlug}'`);
    const migrationSource = migrationPath ? readFileSync(migrationPath, 'utf8') : '';
    if (!/INSERT\s+INTO\s+public\.game_docs/i.test(migrationSource) || !/version\s*[,)]/i.test(migrationSource)) {
        issues.push({
            check: 'game_docs',
            msg: 'migration ของเกมต้อง upsert public.game_docs พร้อม version ในไฟล์เดียวกัน',
        });
        console.log(`${FAIL} Check 6b — game_docs: ไม่พบ upsert/version ใน migration`);
    } else {
        console.log(`${PASS} Check 6b — game_docs: migration มีรายละเอียดและ version`);
    }
}

// ─── Anti-patterns (warnings) ───────────────────────────────────────────────
if (/firebase|firestore/i.test(scanSource)) {
    if (/firebasejs|getFirestore|signInAnonymously/.test(scanSource) && !/\/\/.*firebase/i.test(scanSource)) {
        warnings.push({
            check: 'anti-pattern',
            msg:   'พบ Firebase SDK ที่ยังไม่ comment ออก — ระบบ kampai ใช้ Supabase แทน',
        });
        console.log(`${WARN} Anti-pattern: Firebase SDK ยัง active`);
    }
}
if (/id\s*=\s*['"]player[-_]?name['"]/i.test(scanSource)) {
    warnings.push({
        check: 'anti-pattern',
        msg:   'พบ <input id="player-name"> — ลบออกแล้วใช้ DISPLAY_NAME_INIT แทน',
    });
    console.log(`${WARN} Anti-pattern: input ชื่อผู้เล่นยังอยู่`);
}
if (/window\.location\.href\s*=\s*['"][^/]*\.\.?\/index/.test(scanSource)) {
    warnings.push({
        check: 'anti-pattern',
        msg:   'พบ window.location.href ที่ navigate ไป ../index.html — ใช้ navigateBack() แทน',
    });
    console.log(`${WARN} Anti-pattern: window.location.href ตรงๆ`);
}

// ─── Check 7: render smoke-test (จับ "จอดำ" — runtime error/crash ที่ static ไม่เห็น) ──
// static checks ข้างบนเคยปล่อยเกมจอดำผ่าน (เคส wizard-thai) เพราะไม่เคย render จริง
const isReactGame = /<script\s+type="text\/babel">/.test(html);
if (isReactGame || usesSdk) {
    const r = await renderSmokeTest(html, gameDir);
    if (r.status === 'pass') {
        console.log(`${PASS} Check 7 — render: เกมโหลด+render สำเร็จ${r.size ? ` (DOM ${r.size} ตัวอักษร)` : ''}`);
    } else if (r.status === 'skip') {
        warnings.push({ check: 'render', msg: r.msg });
        console.log(`${WARN} Check 7 — render: ข้าม (${r.msg})`);
    } else {
        issues.push({ check: 'render', msg: r.msg });
        console.log(`${FAIL} Check 7 — render: ${r.msg}`);
    }
} else {
    console.log(`${WARN} Check 7 — render: ข้าม (เกม vanilla เก่า ไม่ใช่ SDK — ต้องทดสอบ browser เอง)`);
}

// ─── Check 8: icon binding ชื่อชน JS global → ทำ Tailwind Play CDN ล่ม (จอเบี้ยว ไม่มี CSS) ──
// const Map = _mkIcon('Map') สร้าง lexical binding ทับ global Map ใน scope ที่ทุก <script> แชร์
// → Tailwind rebuild เรียก new Map().set() พัง ("i.set is not a function") → ไม่ generate CSS เลย.
// render check (Check 7) จับไม่ได้เพราะเกม render สำเร็จ (ไม่จอดำ) แค่ไม่มีสไตล์. (ดู GAME.md)
const JS_GLOBALS = [
    'Map', 'Set', 'WeakMap', 'WeakSet', 'Promise', 'Proxy', 'Reflect', 'Symbol',
    'Image', 'Audio', 'History', 'Text', 'Range', 'Date', 'Event', 'Worker',
    'Notification', 'Selection', 'Navigator', 'Screen', 'Location', 'Frame',
    'Array', 'Object', 'Number', 'String', 'Boolean', 'Document', 'Window',
];
const shadowed = new Set();
// (ก) X = _mkIcon('...')  — icon factory ของเทมเพลต
for (const m of scanSource.matchAll(/\b([A-Z][A-Za-z0-9_]*)\s*=\s*_mkIcon\b/g)) {
    if (JS_GLOBALS.includes(m[1])) shadowed.add(m[1]);
}
// (ข) const { A, Map, B } = ...lucide...  — destructure ไอคอนตามชื่อ global
for (const m of scanSource.matchAll(/(?:const|let|var)\s*\{([^}]*)\}\s*=\s*[^;]*lucide/gi)) {
    m[1].split(',').map((s) => s.trim().split(':').pop().trim()).forEach((n) => {
        if (JS_GLOBALS.includes(n)) shadowed.add(n);
    });
}
if (shadowed.size) {
    const names = [...shadowed].join(', ');
    issues.push({
        check: 'global-shadow',
        msg: `ตัวแปรไอคอน [${names}] ทับ JS global → Tailwind/SDK ล่ม (จอเบี้ยว ไม่มี CSS). เปลี่ยนชื่อ เช่น ${[...shadowed][0]} → ${[...shadowed][0]}Icon`,
    });
    console.log(`${FAIL} Check 8 — global-shadow: ไอคอน [${names}] ทับ JS global (rename → ${[...shadowed][0]}Icon)`);
} else {
    console.log(`${PASS} Check 8 — global-shadow: ไม่มีไอคอนชื่อชน JS global`);
}

// ─── Check 9: ปกเกม 16:9 เต็มช่อง ───────────────────────────────────────────
// การ์ดเกม/Educational Hub ใช้กรอบ aspect-video (16:9) + object-contain → ถ้าปกไม่ใช่ 16:9
// จะมีขอบขาว/ดำ ไม่เต็มช่อง (เคส tank-commander). กฎ: ปกต้องเป็น 16:9 เสมอ (1280×720). ดู GAME.md
const cover = findCover(gameDir, [detectedSlug, fileName]);
if (!cover) {
    warnings.push({ check: 'cover', msg: 'ไม่พบไฟล์ปก ({slug}-cover.svg/png) ในโฟลเดอร์เกม — ตรวจเองว่า thumbnail_url เป็น 16:9 (1280×720)' });
    console.log(`${WARN} Check 9 — cover 16:9: ข้าม (ไม่พบไฟล์ปกในโฟลเดอร์)`);
} else if (!cover.w || !cover.h) {
    warnings.push({ check: 'cover', msg: `อ่านขนาดปก ${cover.name} ไม่ได้ — ตรวจเองว่าเป็น 16:9 (1280×720)` });
    console.log(`${WARN} Check 9 — cover 16:9: ข้าม (อ่านขนาด ${cover.name} ไม่ได้)`);
} else {
    const ratio = cover.w / cover.h;
    if (Math.abs(ratio - 16 / 9) <= 0.03) {
        console.log(`${PASS} Check 9 — cover 16:9: ${cover.name} (${cover.w}×${cover.h})`);
    } else {
        issues.push({
            check: 'cover',
            msg: `ปก ${cover.name} ขนาด ${cover.w}×${cover.h} (≈${ratio.toFixed(2)}:1) ไม่ใช่ 16:9 → การ์ด aspect-video มีขอบ/ไม่เต็มช่อง. ทำใหม่ที่ 1280×720 (16:9)`,
        });
        console.log(`${FAIL} Check 9 — cover 16:9: ${cover.name} ${cover.w}×${cover.h} ไม่ใช่ 16:9 (ทำใหม่ 1280×720)`);
    }
}

// ─── Check 9b: ปก safe zone หัวข้อไทย (หัวข้อฝังใน PNG ชิดขอบบน) ───────────────
if (cover && /\.png$/i.test(cover.name)) {
    try {
        const { analyzeTopTitleBand } = await import('./lib/cover-safe-zone.mjs');
        const band = await analyzeTopTitleBand(join(gameDir, cover.name));
        if (band.risky) {
            warnings.push({
                check: 'cover-safe-top',
                msg: `ปก ${cover.name} มีหัวข้อขาวฝังชิดขอบบน (bright=${band.brightPct}% row@${band.topBrightPct}%) → สระไทยอาจล้นกรอบการ์ด. ใช้ปุ่ม "ปก AI" (overlay Sarabun) หรือ pnpm fix:covers-safe-top`,
            });
            console.log(`${WARN} Check 9b — cover safe-top: หัวข้อชิดขอบบน (pnpm fix:covers-safe-top ${join(gameDir, cover.name)})`);
        } else {
            console.log(`${PASS} Check 9b — cover safe-top: หัวข้อไม่ชิดขอบบน`);
        }
    } catch (e) {
        warnings.push({ check: 'cover-safe-top', msg: `วิเคราะห์ safe zone ไม่ได้: ${e.message}` });
        console.log(`${WARN} Check 9b — cover safe-top: ข้าม (${e.message})`);
    }
}

// ─── Check 10: AR / กล้อง (fire เฉพาะเกมที่ใช้กล้อง) ─────────────────────────
// เกมที่ใช้ KampaiAR engine → engine จัดการ camera/cleanup/fallback/mediapipe ให้ = ผ่าน
// เกม raw getUserMedia (ไม่ใช้ engine) → เตือนเรื่อง cleanup/fallback/jsdelivr (ดู AR-GAME.md)
const usesCamera = /getUserMedia|kampai-ar\.js|KampaiAR|kampai-hands\.js|KampaiHands/.test(scanSource) || /getUserMedia|kampai-ar\.js|kampai-hands\.js/.test(html);
if (usesCamera) {
    const usesHandsEngine = /kampai-hands\.js/.test(html) || /KampaiHands\s*\.\s*create/.test(scanSource);
    const usesArEngine = /kampai-ar\.js/.test(html) || /KampaiAR\s*\.\s*create/.test(scanSource);
    if (usesHandsEngine) {
        console.log(`${PASS} Check 10 — AR: ใช้ KampaiHands (finger poke/grab — camera/cleanup จัดการให้)`);
        if (/hands\.stop\(\)/.test(scanSource) && !/hands\s*=\s*null/.test(scanSource)) {
            warnings.push({
                check: 'AR-restart',
                msg: 'KampaiHands: หลัง hands.stop() ควร hands=null ก่อน restart — ดู AR-GAME.md §4.12',
            });
            console.log(`${WARN} Check 10 — AR restart: ไม่พบ hands=null หลัง stop (แนะนำ — AR-GAME.md §4.12)`);
        }
    } else if (usesArEngine) {
        console.log(`${PASS} Check 10 — AR: ใช้ KampaiAR engine (camera/cleanup/fallback จัดการให้)`);
    } else {
        const arWarn = [];
        if (!/getTracks\(\)|\.stop\(\)|clearInterval|cancelAnimationFrame/.test(scanSource))
            arWarn.push('AR: ไม่พบ cleanup กล้อง/loop (getTracks().stop()/clearInterval/cancelAnimationFrame) — ต้องเรียกตอนออก/จบ');
        if (!/addEventListener\(\s*['"]click|onclick|\.tap\(|no-camera|catch\s*\(/.test(scanSource))
            arWarn.push('AR: ไม่พบ fallback แตะ/no-camera — บังคับมี (เครื่องไม่มีกล้องต้องเล่นได้)');
        if (/@?mediapipe/i.test(scanSource) && !/cdn\.jsdelivr\.net/.test(scanSource))
            arWarn.push('AR: MediaPipe ต้องโหลดจาก cdn.jsdelivr.net เท่านั้น (cdnjs มัก 404)');
        arWarn.push('AR: แนะนำใช้ /games/kampai-hands.js (จิ้ม/ชนวัตถุ) หรือ /games/kampai-ar.js (zone/body) — ดู AR-GAME.md');
        arWarn.forEach((m) => warnings.push({ check: 'AR', msg: m }));
        console.log(`${WARN} Check 10 — AR: raw camera (${arWarn.length} คำเตือน — ดู AR-GAME.md)`);
    }
}

// ─── Check 11: รองรับ 2 ผู้เล่น (local hot-seat + online) — กฎใหม่ "ทุกเกมแข่ง 2 คนได้" ──
// keystone = /games/kampai-versus.js (KampaiVersus.create) → เดี่ยว + 2 คนเครื่องนี้ + ออนไลน์
// เกมออนไลน์เดิม (KampaiMatch อย่างเดียว) = มี online แต่ยังไม่มี local hot-seat → WARN ให้อัป
// ไม่มีทั้งคู่ = FAIL (1P ล้วน). ดู _template-versus.html / GAME.md (Two-Player Framework)
const loadsVersus = /kampai-versus\.js/.test(html);
const loadsMatch = /kampai-match\.js/.test(html);
const wiresVersus = /KampaiVersus\s*\.\s*create\s*\(/.test(scanSource);
const wiresMatch = /KampaiMatch\s*\.\s*create\s*\(/.test(scanSource);
if (loadsVersus && wiresVersus) {
    console.log(`${PASS} Check 11 — 2 ผู้เล่น: KampaiVersus (เดี่ยว + local hot-seat + online)`);
} else if (loadsMatch && wiresMatch) {
    warnings.push({
        check: '2-player',
        msg: 'มีเฉพาะออนไลน์ (KampaiMatch) — อัปเป็น KampaiVersus เพิ่มโหมด "2 คนเครื่องนี้" (local hot-seat). ดู _template-versus.html',
    });
    console.log(`${WARN} Check 11 — 2 ผู้เล่น: KampaiMatch (online เท่านั้น — ยังไม่มี local hot-seat)`);
} else {
    issues.push({
        check: '2-player',
        msg: 'ไม่พบทางแข่ง 2 คน — โหลด /games/kampai-versus.js + KampaiVersus.create({onPlay,onEnd}) + ปุ่ม "แข่ง 2 คน" (vs.openMenu()). ดู _template-versus.html / GAME.md',
    });
    console.log(`${FAIL} Check 11 — 2 ผู้เล่น: ไม่พบ (ต้องมี KampaiVersus หรืออย่างน้อย KampaiMatch)`);
}

// ─── Check 12: quality contract (warning in compatibility mode, gate in --strict) ──
const qualityRules = [
    ['begin-round', /KAMPAI\s*\.\s*beginRound\s*\(/.test(scanSource), 'ไม่พบ KAMPAI.beginRound() ตอนเริ่มรอบ'],
    ['result-slot', /id=["']kampai-result["']/.test(html), 'ไม่พบ #kampai-result ในจอจบ'],
    ['test-hooks', /data-kampai-action=["']start["']/.test(html) && /data-kampai-action=["']restart["']/.test(html), 'ไม่พบ browser hooks start/restart'],
    ['reload-restart', !/(?:location\s*\.\s*reload|location\s*=)/.test(scanSource), 'restart ต้อง cleanup+start โดยไม่ reload iframe'],
    ['reduced-motion', /prefers-reduced-motion\s*:\s*reduce/.test(scanSource), 'ไม่พบ reduced-motion fallback'],
    ['focus-visible', /:focus-visible/.test(scanSource), 'ไม่พบ visible keyboard focus style'],
    ['duplicate-hooks', (html.match(/data-kampai-action=["']restart["']/g) || []).length === 1, 'ต้องมี restart hook เพียงจุดเดียว เพื่อไม่ให้ wrapper controls ซ้ำ'],
];
const qualityFailures = qualityRules.filter(([, pass]) => !pass);
if (qualityFailures.length === 0) {
    console.log(`${PASS} Check 12 — quality contract: lifecycle + accessibility hooks ครบ`);
} else {
    for (const [check, , msg] of qualityFailures) warnings.push({ check, msg });
    console.log(`${WARN} Check 12 — quality contract: ขาด ${qualityFailures.length} รายการ${strictMode ? ' (--strict = fail)' : ''}`);
}

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log('');
if (issues.length === 0 && warnings.length === 0) {
    console.log(`${BOLD}${GREEN}✨ ผ่านทุก check — เกมพร้อมใช้งาน!${RESET}\n`);
    writeReport({ status: 'passed', exitCode: 0 });
    process.exit(0);
}

if (issues.length > 0) {
    console.log(`${BOLD}${RED}❌ พบปัญหา ${issues.length} จุด:${RESET}`);
    issues.forEach((it, i) => {
        console.log(`  ${i + 1}. [${it.check}] ${it.msg}`);
    });
    console.log('');
}
if (warnings.length > 0) {
    console.log(`${BOLD}${YELLOW}⚠️ คำเตือน ${warnings.length} จุด:${RESET}`);
    warnings.forEach((it, i) => {
        console.log(`  ${i + 1}. [${it.check}] ${it.msg}`);
    });
    console.log('');
}

console.log(`${CYAN}💡 อ่าน GAME.md สำหรับ EMBED block + checklist เต็ม${RESET}\n`);
const exitCode = issues.length > 0 || (strictMode && warnings.length > 0) ? 1 : 0;
writeReport({ status: exitCode === 0 ? 'passed-with-warnings' : 'failed', exitCode });
process.exit(exitCode);

function writeReport({ status, exitCode }) {
    const report = {
        schemaVersion: 1,
        tool: 'verify-game',
        target: targetArg,
        slug: detectedSlug,
        strict: strictMode,
        status,
        exitCode,
        issues,
        warnings,
        generatedAt: new Date().toISOString(),
    };
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n', 'utf8');
    if (jsonOnly) console.log(JSON.stringify(report));
    else console.log(`${CYAN}JSON:${RESET} ${relativePath(reportPath)}`);
}

function relativePath(path) {
    return path.startsWith(REPO_ROOT) ? path.slice(REPO_ROOT.length + 1) : path;
}

// ────────────────────────────────────────────────────────────────────────────
// Cover helpers (hoisted) — หาไฟล์ปก + อ่านขนาดจริง (sniff magic bytes ไม่เชื่อ extension)
// ────────────────────────────────────────────────────────────────────────────

/**
 * หาปก "ของเกมนี้" — คืน {name,w,h}|null
 * 1) authoritative: `thumbnail_url` ใน migration ของ slug (ตรงสุด — ชื่อไฟล์ไม่ต้องตรง slug)
 * 2) convention: `{slug}-cover.*` หรือ `cover.*` ใน gameDir
 * ❌ ไม่ fallback ไปปกเกม "อื่น" — ถ้าไม่เจอของเกมนี้ → คืน null (Check 9 จะ WARN ไม่ใช่ผ่านหลอก)
 */
function findCover(dir, slugs) {
    const norm = slugs.filter(Boolean).map((s) => String(s).toLowerCase());
    const fromMig = coverFromMigration(norm[0]);
    if (fromMig) return fromMig;
    let files;
    try { files = readdirSync(dir); } catch { return null; }
    const candidates = files.filter((n) => /(?:^cover|[-_]cover)\.(svg|png|jpe?g|webp)$/i.test(n));
    const pick =
        candidates.find((n) => norm.some((s) => n.toLowerCase().startsWith(s + '-cover'))) ||
        candidates.find((n) => /^cover\./i.test(n));
    if (!pick) return null;
    const size = readImageSize(join(dir, pick));
    return { name: pick, w: size?.w, h: size?.h };
}

/** ดึงไฟล์ปกจาก thumbnail_url ใน migration ของ slug (local path เท่านั้น) — คืน {name,w,h}|null */
function coverFromMigration(slug) {
    if (!slug) return null;
    const migDir = join(REPO_ROOT, 'supabase', 'migrations');
    let files;
    try { files = readdirSync(migDir); } catch { return null; }
    const slugNoDash = slug.replace(/-/g, '_');
    const mig = files.find((f) => { const l = f.toLowerCase(); return l.includes(slug) || l.includes(slugNoDash); });
    if (!mig) return null;
    let txt;
    try { txt = readFileSync(join(migDir, mig), 'utf8'); } catch { return null; }
    const m = txt.match(/thumbnail_url\s*=\s*['"]([^'"]+)['"]/);
    if (!m) return null;
    const url = m[1].split('?')[0];
    if (!url.startsWith('/')) return null;   // remote / non-local → ข้าม (ให้ convention หรือ WARN จัดการ)
    const p = join(REPO_ROOT, 'public', url);
    if (!existsSync(p)) return null;
    const size = readImageSize(p);
    return { name: basename(p), w: size?.w, h: size?.h };
}

/** อ่าน width/height จาก PNG/JPEG/SVG (ตรวจ magic bytes ก่อน — ไฟล์ .png ที่จริงเป็น JPEG ก็อ่านถูก) */
function readImageSize(path) {
    let buf;
    try { buf = readFileSync(path); } catch { return null; }
    // PNG: 89 50 4E 47 … IHDR width@16 height@20 (BE)
    if (buf.length >= 24 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
        return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    }
    // JPEG: FF D8 … สแกนหา SOF marker (C0–CF ยกเว้น C4/C8/CC) → height@+5 width@+7 (BE)
    if (buf[0] === 0xff && buf[1] === 0xd8) {
        let i = 2;
        while (i + 9 < buf.length) {
            if (buf[i] !== 0xff) { i++; continue; }
            const m = buf[i + 1];
            if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) {
                return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
            }
            if (m === 0xd8 || m === 0xd9 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
            i += 2 + buf.readUInt16BE(i + 2);
        }
        return null;
    }
    // SVG (text): viewBox="0 0 W H" → ใช้ W,H ; ไม่งั้น width/height attr
    const head = buf.slice(0, 4000).toString('utf8');
    if (head.includes('<svg')) {
        const text = buf.toString('utf8');
        const vb = text.match(/viewBox\s*=\s*["']\s*[\d.+-]+\s+[\d.+-]+\s+([\d.]+)\s+([\d.]+)/i);
        if (vb) return { w: parseFloat(vb[1]), h: parseFloat(vb[2]) };
        const w = text.match(/\bwidth\s*=\s*["']?([\d.]+)/i);
        const h = text.match(/\bheight\s*=\s*["']?([\d.]+)/i);
        if (w && h) return { w: parseFloat(w[1]), h: parseFloat(h[1]) };
    }
    return null;
}

// ────────────────────────────────────────────────────────────────────────────
// Render smoke-test helpers (hoisted)
// ────────────────────────────────────────────────────────────────────────────

/**
 * โหลดเกมใน jsdom จริง (React UMD / KAMPAI SDK) + post mock init แล้วเช็คว่าไม่ throw
 * + (React) render ขึ้น — จับ "จอดำ"/crash ที่ static regex มองไม่เห็น
 * คืน { status: 'pass'|'fail'|'skip', ... }
 */
async function renderSmokeTest(html, gameDir) {
    let JSDOM, VirtualConsole, Babel;
    try {
        ({ JSDOM, VirtualConsole } = await import('jsdom'));
        const b = await import('@babel/standalone');
        Babel = b.transform ? b : (b.default ?? b);
        if (typeof Babel.transform !== 'function') throw new Error('no Babel.transform');
    } catch {
        return { status: 'skip', msg: 'ไม่มี jsdom/@babel/standalone — รัน: pnpm add -D jsdom @babel/standalone' };
    }

    const isReact = /<script\s+type="text\/babel">/.test(html);
    const cacheDir = join(REPO_ROOT, 'node_modules', '.cache', 'game-verify');

    // เดิน <script> ตามลำดับเอกสาร: CDN(react/lucide)=fetch, /...js=local public, babel=transform, inline=eval
    const scriptTags = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)];
    const steps = []; // { kind:'eval'|'babel', code }
    try {
        for (const m of scriptTags) {
            const attrs = m[1] || '', inner = m[2] || '';
            const srcM = attrs.match(/\ssrc=["']([^"']+)["']/);
            const isBabel = /type=["']text\/babel["']/.test(attrs);
            if (srcM) {
                const src = srcM[1];
                if (/^\/(?!\/)/.test(src)) {
                    // absolute local เช่น /games/kampai-sdk.js → public/
                    const lp = join(REPO_ROOT, 'public', src.replace(/^\//, ''));
                    if (existsSync(lp)) steps.push({ kind: 'eval', code: readFileSync(lp, 'utf8') });
                } else if (/(^|\/)react(-dom)?[@./]|lucide/i.test(src) && !/babel|tailwind/i.test(src)) {
                    steps.push({ kind: 'eval', code: await fetchCached(src, cacheDir) });
                } else if (!/^https?:/.test(src) && !/^\/\//.test(src)) {
                    // relative sibling (เกมโฟลเดอร์): config.js / data.js / game.js — อ่านจาก dir เกม
                    const lp = join(gameDir, src);
                    if (existsSync(lp)) steps.push({ kind: 'eval', code: readFileSync(lp, 'utf8') });
                }
                // ข้าม tailwind/babel CDN (ไม่ต้องตอน runtime)
            } else if (isBabel) {
                steps.push({ kind: 'babel', code: inner });
            } else if (inner.trim()) {
                const isModule = /type=["']module["']/.test(attrs) || /\bimport\s+[^;]+;/.test(inner);
                if (isModule) {
                    steps.push({ kind: 'babel', code: inner });
                } else {
                    steps.push({ kind: 'eval', code: inner });
                }
            }
        }
    } catch (e) {
        return { status: 'skip', msg: `โหลด dependency ไม่ได้ (offline?) — ${e.message}` };
    }

    const vc = new VirtualConsole();
    const errs = [];
    vc.on('jsdomError', (e) => { const m = e.message || String(e); if (!/Not implemented/i.test(m)) errs.push(m); });
    // ใช้ DOM จริงของเกม (canvas/#root/ปุ่ม ครบ) แต่ปิด auto-run script — เรา eval เองตามลำดับ
    const dom = new JSDOM(html, {
        url: 'https://verify.local/?embed=1', // ให้ KAMPAI SDK เข้าโหมด embed → ทดสอบ init path
        runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc,
    });
    const { window } = dom;
    window.onerror = (m) => errs.push(String(m));
    window.console = { log() {}, info() {}, warn() {}, debug() {}, error() {} };
    window.matchMedia = () => ({ matches: false, media: '', onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; } });
    const noopOsc = () => ({ connect() {}, frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, type: '', start() {}, stop() {} });
    const noopGain = () => ({ connect() {}, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} } });
    const NoopAudio = function () { return { createOscillator: noopOsc, createGain: noopGain, destination: {}, currentTime: 0, state: 'running', resume() {}, close() { return Promise.resolve(); } }; };
    window.AudioContext = NoopAudio; window.webkitAudioContext = NoopAudio;
    const dummyProxy = new Proxy(function() {}, {
        get: (target, prop) => {
            if (prop === 'valueOf') {
                return () => 0;
            }
            if (prop === 'toString' || prop === Symbol.toStringTag) {
                return () => 'dummy';
            }
            if (prop === Symbol.toPrimitive) {
                return (hint) => {
                    if (hint === 'number') return 0;
                    return 'dummy';
                };
            }
            if (prop === 'domElement') {
                return window.document.createElement('canvas');
            }
            if (prop === 'shadowMap') {
                return {};
            }
            if (prop === 'WebGLRenderer') {
                return function() {
                    return dummyProxy;
                };
            }
            if (prop === 'canvas') {
                return {};
            }
            return dummyProxy;
        },
        construct: (target, args) => {
            return dummyProxy;
        },
        apply: (target, thisArg, argumentsList) => {
            return dummyProxy;
        },
        set: (target, prop, value) => {
            return true;
        }
    });
    try { window.HTMLCanvasElement.prototype.getContext = () => dummyProxy; } catch { /* ignore */ }
    window.CanvasRenderingContext2D = function() {};
    window.CanvasRenderingContext2D.prototype = dummyProxy;
    window.require = () => dummyProxy;
    window.THREE = dummyProxy;
    window.firebase = dummyProxy;
    window.__firebase_config = {};
    window.Hands = dummyProxy;
    window.Camera = dummyProxy;

    try {
        for (const step of steps) {
            window.eval(step.kind === 'babel' ? Babel.transform(step.code, { presets: ['react', 'env'] }).code : step.code);
        }
    } catch (e) {
        return { status: 'fail', msg: `เกม throw ตอนโหลด/compile: ${e.message}` };
    }

    // จำลอง wrapper ส่ง init (student + stats + leaderboard) → exercise onReady/leaderboard path
    try {
        window.postMessage({
            type: 'init', studentCode: '9999',
            student: { id: 'test-id', displayName: 'ทดสอบ นักเรียน', photoUrl: null, classLabel: 'ป.6' },
            stats: { playsCount: 3, personalBest: 120, totalXp: 340, level: 3 },
            leaderboard: [
                { rank: 1, studentId: 'a', displayName: 'เอ', photoUrl: null, classLabel: 'ป.6', personalBest: 200, isMe: false },
                { rank: 2, studentId: 'test-id', displayName: 'ทดสอบ นักเรียน', photoUrl: null, classLabel: 'ป.6', personalBest: 120, isMe: true },
            ],
        }, '*');
    } catch { /* ignore */ }

    await new Promise((r) => setTimeout(r, 500)); // รอ message delivery + React commit
    if (errs.length) return { status: 'fail', msg: `พบ error ขณะ render: ${errs[0].slice(0, 220)}` };
    if (isReact) {
        const root = window.document.getElementById('root') || window.document.body;
        const size = root ? root.innerHTML.length : 0;
        if (size <= 50) return { status: 'fail', msg: `เกม render ไม่ขึ้น (จอดำ) — root ว่าง (${size} ตัวอักษร)` };
        return { status: 'pass', size };
    }
    return { status: 'pass', size: window.document.body.innerHTML.length };
}

async function fetchCached(url, cacheDir) {
    const file = join(cacheDir, createHash('sha1').update(url).digest('hex').slice(0, 16) + '.js');
    if (existsSync(file)) return readFileSync(file, 'utf8');
    const res = await fetch(url, { redirect: 'follow' });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
    const text = await res.text();
    mkdirSync(cacheDir, { recursive: true });
    writeFileSync(file, text, 'utf8');
    return text;
}
