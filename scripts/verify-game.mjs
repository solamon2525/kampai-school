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

import { readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
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
const targetArg = process.argv[2];
if (!targetArg) {
    console.error(`${FAIL} ${BOLD}Usage:${RESET} pnpm verify:game <path-to-game.html>`);
    console.error(`        เช่น: pnpm verify:game public/games/tech/word-shield.html`);
    process.exit(1);
}

const filePath = resolve(REPO_ROOT, targetArg);
if (!existsSync(filePath)) {
    console.error(`${FAIL} ไม่พบไฟล์: ${filePath}`);
    process.exit(1);
}

const html = readFileSync(filePath, 'utf8');
const fileName = basename(filePath, '.html');

// เกมที่ใช้ KAMPAI SDK (/games/kampai-sdk.js) — integration อยู่ใน SDK ไม่ใช่ในไฟล์เกม
const usesSdk = /kampai-sdk\.js/.test(html) || /KAMPAI\s*\.\s*(submitScore|setSlug|onReady|goHome)/.test(html);

console.log(`\n${BOLD}${CYAN}🎮 Verify Game Integration${RESET}`);
console.log(`${CYAN}File:${RESET} ${targetArg}\n`);

const issues = [];
const warnings = [];

// ─── Check 1: GAME_SLUG ─────────────────────────────────────────────────────
const slugMatch = html.match(/const\s+GAME_SLUG\s*=\s*['"]([^'"]+)['"]/);
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
if (!(usesSdk || /function\s+sendGameEnd\s*\(/.test(html))) {
    issues.push({
        check: 'sendGameEnd',
        msg:   'ไม่พบ `KAMPAI.submitScore` (SDK) หรือ `function sendGameEnd(...)` — โหลด /games/kampai-sdk.js หรือ copy EMBED block',
    });
    console.log(`${FAIL} Check 2 — score submit: ไม่พบ (SDK/sendGameEnd)`);
} else {
    console.log(`${PASS} Check 2 — score submit: ${usesSdk ? 'KAMPAI SDK' : 'sendGameEnd'}`);
}

// ─── Check 3: กลับหน้าหลัก (SDK: KAMPAI.goHome | legacy: navigateBack | a[target=_top]) ──
if (!(usesSdk || /function\s+navigateBack\s*\(/.test(html) || /target=["']_top["']/.test(html))) {
    issues.push({
        check: 'navigateBack',
        msg:   'ไม่พบทางกลับหน้าหลัก — `KAMPAI.goHome()` (SDK) หรือ `function navigateBack()` หรือ <a target="_top">',
    });
    console.log(`${FAIL} Check 3 — navigate back: ไม่พบ`);
} else {
    console.log(`${PASS} Check 3 — navigate back: ${usesSdk ? 'KAMPAI.goHome' : 'OK'}`);
}

// ─── Check 4: รับข้อมูลนักเรียน (SDK จัดการ init ให้ | legacy: init listener) ──────────
const hasInitListener = /addEventListener\s*\(\s*['"]message['"][\s\S]{0,500}type\s*===?\s*['"]init['"]/.test(html);
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
const sdkSubmitCalls = (html.match(/KAMPAI\s*\.\s*submitScore\s*\(/g) || []).length;
const sendCalls = (html.match(/sendGameEnd\s*\(/g) || []).length;
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
if (detectedSlug && detectedSlug !== 'placeholder-slug' && existsSync(migrationsDir)) {
    const files = readdirSync(migrationsDir);
    const slugNoDash = detectedSlug.replace(/-/g, '_');
    migrationFound = files.some((f) => {
        const lower = f.toLowerCase();
        return lower.includes(detectedSlug.toLowerCase()) || lower.includes(slugNoDash.toLowerCase());
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
}

// ─── Anti-patterns (warnings) ───────────────────────────────────────────────
if (/firebase|firestore/i.test(html)) {
    if (/firebasejs|getFirestore|signInAnonymously/.test(html) && !/\/\/.*firebase/i.test(html)) {
        warnings.push({
            check: 'anti-pattern',
            msg:   'พบ Firebase SDK ที่ยังไม่ comment ออก — ระบบ kampai ใช้ Supabase แทน',
        });
        console.log(`${WARN} Anti-pattern: Firebase SDK ยัง active`);
    }
}
if (/id\s*=\s*['"]player[-_]?name['"]/i.test(html)) {
    warnings.push({
        check: 'anti-pattern',
        msg:   'พบ <input id="player-name"> — ลบออกแล้วใช้ DISPLAY_NAME_INIT แทน',
    });
    console.log(`${WARN} Anti-pattern: input ชื่อผู้เล่นยังอยู่`);
}
if (/window\.location\.href\s*=\s*['"][^/]*\.\.?\/index/.test(html)) {
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
    const r = await renderSmokeTest(html);
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
for (const m of html.matchAll(/\b([A-Z][A-Za-z0-9_]*)\s*=\s*_mkIcon\b/g)) {
    if (JS_GLOBALS.includes(m[1])) shadowed.add(m[1]);
}
// (ข) const { A, Map, B } = ...lucide...  — destructure ไอคอนตามชื่อ global
for (const m of html.matchAll(/(?:const|let|var)\s*\{([^}]*)\}\s*=\s*[^;]*lucide/gi)) {
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

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log('');
if (issues.length === 0 && warnings.length === 0) {
    console.log(`${BOLD}${GREEN}✨ ผ่านทุก check — เกมพร้อมใช้งาน!${RESET}\n`);
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
process.exit(issues.length > 0 ? 1 : 0);

// ────────────────────────────────────────────────────────────────────────────
// Render smoke-test helpers (hoisted)
// ────────────────────────────────────────────────────────────────────────────

/**
 * โหลดเกมใน jsdom จริง (React UMD / KAMPAI SDK) + post mock init แล้วเช็คว่าไม่ throw
 * + (React) render ขึ้น — จับ "จอดำ"/crash ที่ static regex มองไม่เห็น
 * คืน { status: 'pass'|'fail'|'skip', ... }
 */
async function renderSmokeTest(html) {
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
                }
                // ข้าม tailwind/babel CDN (ไม่ต้องตอน runtime)
            } else if (isBabel) {
                steps.push({ kind: 'babel', code: inner });
            } else if (inner.trim()) {
                steps.push({ kind: 'eval', code: inner });
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
    try { window.navigator.vibrate = () => {}; } catch { /* readonly */ }
    try { window.HTMLCanvasElement.prototype.getContext = () => null; } catch { /* ignore */ }

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
