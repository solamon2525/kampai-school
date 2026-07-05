#!/usr/bin/env node
import { execSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const target = process.argv[2];
if (!target) {
  console.error('Usage: pnpm verify:media <path-to-media.html>');
  process.exit(1);
}

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
let out = '';
try {
  out = execSync(`node scripts/verify-game.mjs "${target}"`, { cwd: root, encoding: 'utf8' });
} catch (e) {
  out = (e.stdout || '') + (e.stderr || '');
}

const required = [1, 3, 7, 9];
const failed = required.filter((n) => new RegExp(`Check ${n}[^\\n]*❌`).test(out));
if (failed.length) {
  console.error(out);
  console.error(`\nverify:media FAIL — checks ${failed.join(', ')}`);
  process.exit(1);
}
console.log(out);
console.log('\n✅ verify:media OK (checks 1, 3, 7, 9)');
