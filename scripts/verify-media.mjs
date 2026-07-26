#!/usr/bin/env node
/**
 * verify:media — media-aware checks (Phase 8G)
 * Runs a subset of verify-game, then asserts MEDIA.md contract:
 * - setSlug / MEDIA_SLUG present
 * - learn + practice mode (or equivalent)
 * - no competitive score submission
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const target = process.argv[2];
if (!target) {
  console.error('Usage: pnpm verify:media <path-to-media.html>');
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const abs = resolve(root, target);
let html = '';
try {
  html = readFileSync(abs, 'utf8');
} catch (e) {
  console.error(`Cannot read ${abs}:`, e.message || e);
  process.exit(1);
}

let out = '';
try {
  out = execSync(`node scripts/verify-game.mjs "${target}"`, { cwd: root, encoding: 'utf8' });
} catch (e) {
  out = (e.stdout || '') + (e.stderr || '');
}

const required = [1, 3, 7, 9];
const failed = required.filter((n) => new RegExp(`Check ${n}[^\\n]*❌`).test(out));

const contractFails = [];
const hasSlug =
  /setSlug\s*\(\s*['"`][^'"`]+['"`]\s*\)/.test(html) ||
  /MEDIA_SLUG\s*=\s*['"`][^'"`]+['"`]/.test(html);
if (!hasSlug) contractFails.push('missing setSlug() or MEDIA_SLUG');

const hasPractice =
  /data-mode\s*=\s*["']practice["']/.test(html) ||
  /mode-practice|id=["']practice["']|class=["'][^"']*practice/.test(html) ||
  /ฝึกสั้น|โหมดฝึก|✏️\s*ฝึก/.test(html);
if (!hasPractice) contractFails.push('missing practice / ฝึกสั้น mode');

const hasLearn =
  /data-mode\s*=\s*["']learn["']/.test(html) ||
  /📖\s*(สอน|เรียนรู้)/.test(html) ||
  /id=["']learn["']/.test(html);
if (!hasLearn) contractFails.push('missing learn / สอน mode');

const hasSubmitScore = /submitScore\s*\(/.test(html);
if (hasSubmitScore) contractFails.push('must not call submitScore (media ≠ game)');

if (failed.length || contractFails.length) {
  console.error(out);
  if (failed.length) console.error(`\nverify:media FAIL — game checks ${failed.join(', ')}`);
  if (contractFails.length) {
    console.error('verify:media FAIL — media contract:');
    contractFails.forEach((f) => console.error('  •', f));
  }
  process.exit(1);
}

console.log(out);
console.log('\n✅ verify:media OK (checks 1, 3, 7, 9 + media contract: slug, learn, practice, no submitScore)');
