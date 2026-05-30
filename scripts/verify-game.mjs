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

// ─── Check 2: sendGameEnd function defined ──────────────────────────────────
if (!/function\s+sendGameEnd\s*\(/.test(html)) {
    issues.push({
        check: 'sendGameEnd',
        msg:   'ไม่พบ `function sendGameEnd(...)` — copy EMBED block จาก GAME.md Section 3',
    });
    console.log(`${FAIL} Check 2 — sendGameEnd: ไม่ถูก define`);
} else {
    console.log(`${PASS} Check 2 — sendGameEnd: ถูก define`);
}

// ─── Check 3: navigateBack function defined ─────────────────────────────────
if (!/function\s+navigateBack\s*\(/.test(html)) {
    issues.push({
        check: 'navigateBack',
        msg:   'ไม่พบ `function navigateBack(...)` — copy EMBED block จาก GAME.md Section 3',
    });
    console.log(`${FAIL} Check 3 — navigateBack: ไม่ถูก define`);
} else {
    console.log(`${PASS} Check 3 — navigateBack: ถูก define`);
}

// ─── Check 4: 'init' message listener present ───────────────────────────────
const hasInitListener = /addEventListener\s*\(\s*['"]message['"][\s\S]{0,500}type\s*===?\s*['"]init['"]/.test(html);
if (!hasInitListener) {
    issues.push({
        check: 'init listener',
        msg:   "ไม่พบ message listener สำหรับ type 'init' — EMBED block ขาด หรือ STUDENT_CODE ไม่ถูก capture",
    });
    console.log(`${FAIL} Check 4 — init listener: ไม่พบ`);
} else {
    console.log(`${PASS} Check 4 — init listener: ทำงาน`);
}

// ─── Check 5: sendGameEnd actually called (not just defined) ────────────────
// นับ occurrences — define จะมี 1 ครั้ง, ถ้ามีแค่ 1 = ไม่ถูกเรียก
const sendCalls = (html.match(/sendGameEnd\s*\(/g) || []).length;
if (sendCalls < 2) {
    issues.push({
        check: 'sendGameEnd called',
        msg:   'sendGameEnd ถูก define แต่ไม่ถูก "เรียก" จริงในเกม — ต้องเรียกในฟังก์ชัน endGame()/gameOver() เมื่อเกมจบ',
    });
    console.log(`${FAIL} Check 5 — sendGameEnd called: พบเพียง ${sendCalls} (ต้อง ≥ 2)`);
} else {
    console.log(`${PASS} Check 5 — sendGameEnd called: ${sendCalls - 1} ครั้ง`);
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
if (/<script\s+type="text\/babel">/.test(html)) {
    const r = await renderSmokeTest(html);
    if (r.status === 'pass') {
        console.log(`${PASS} Check 7 — render: เกม render สำเร็จ (root ${r.size} ตัวอักษร)`);
    } else if (r.status === 'skip') {
        warnings.push({ check: 'render', msg: r.msg });
        console.log(`${WARN} Check 7 — render: ข้าม (${r.msg})`);
    } else {
        issues.push({ check: 'render', msg: r.msg });
        console.log(`${FAIL} Check 7 — render: ${r.msg}`);
    }
} else {
    console.log(`${WARN} Check 7 — render: ข้าม (เกม vanilla ไม่ใช่ React/Babel — ต้องทดสอบ browser เอง)`);
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
 * โหลดเกม React/Babel ใน jsdom + React UMD จริง แล้วเช็คว่า render ขึ้น (root ไม่ว่าง)
 * และไม่มี runtime error — จับเคส "จอดำ" ที่ static regex มองไม่เห็น
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

    // ดึง UMD ที่ต้องโหลด (react, react-dom, lucide; ข้าม tailwind/babel/อื่นๆ)
    const srcs = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
    const need = srcs.filter((u) => /(^|\/)react(-dom)?[@./]|lucide/i.test(u) && !/babel|tailwind/i.test(u));

    const cacheDir = join(REPO_ROOT, 'node_modules', '.cache', 'game-verify');
    let bundles;
    try {
        bundles = [];
        for (const u of need) bundles.push(await fetchCached(u, cacheDir));
    } catch (e) {
        return { status: 'skip', msg: `โหลด CDN ไม่ได้ (offline?) — ${e.message}` };
    }

    const vc = new VirtualConsole();
    const errs = [];
    // uncaught exception จริง = crash (กรอง "Not implemented" ของ jsdom ที่ไม่ใช่บั๊กเกม)
    vc.on('jsdomError', (e) => { const m = e.message || String(e); if (!/Not implemented/i.test(m)) errs.push(m); });
    const dom = new JSDOM('<!DOCTYPE html><html><body><div id="root"></div></body></html>', {
        runScripts: 'outside-only', pretendToBeVisual: true, virtualConsole: vc,
    });
    const { window } = dom;
    window.onerror = (m) => errs.push(String(m));
    // console.error เงียบ (React warnings = noise ไม่ใช่ crash); crash จริงมาทาง jsdomError/onerror + root ว่าง
    window.console = { log() {}, info() {}, warn() {}, debug() {}, error() {} };
    window.matchMedia = () => ({ matches: false, media: '', onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent() { return false; } });
    const noopOsc = () => ({ connect() {}, frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} }, type: '', start() {}, stop() {} });
    const noopGain = () => ({ connect() {}, gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {} } });
    const NoopAudio = function () { return { createOscillator: noopOsc, createGain: noopGain, destination: {}, currentTime: 0, state: 'running', resume() {}, close() { return Promise.resolve(); } }; };
    window.AudioContext = NoopAudio; window.webkitAudioContext = NoopAudio;
    try { window.navigator.vibrate = () => {}; } catch { /* readonly */ }
    try { window.HTMLCanvasElement.prototype.getContext = () => null; } catch { /* ignore */ }

    try {
        for (const code of bundles) window.eval(code);
        const blocks = [...html.matchAll(/<script type="text\/babel">([\s\S]*?)<\/script>/g)].map((m) => m[1]);
        for (const block of blocks) window.eval(Babel.transform(block, { presets: ['react', 'env'] }).code);
    } catch (e) {
        return { status: 'fail', msg: `เกม throw ตอนโหลด/compile: ${e.message}` };
    }

    await new Promise((r) => setTimeout(r, 500)); // รอ React 18 commit (async)
    const root = window.document.getElementById('root') || window.document.body;
    const size = root ? root.innerHTML.length : 0;
    if (errs.length) return { status: 'fail', msg: `พบ error ขณะ render: ${errs[0].slice(0, 220)}` };
    if (size <= 50) return { status: 'fail', msg: `เกม render ไม่ขึ้น (จอดำ) — root ว่าง (${size} ตัวอักษร)` };
    return { status: 'pass', size };
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
