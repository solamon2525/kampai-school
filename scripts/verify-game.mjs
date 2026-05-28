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

import { readFileSync, existsSync, readdirSync } from 'node:fs';
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
