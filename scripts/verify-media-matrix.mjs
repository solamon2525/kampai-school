#!/usr/bin/env node
/**
 * Media verify matrix — Phase P4
 * Finds all *-media.html / *-thinking-media.html (skip _template*) and runs verify:media on each.
 * Exit non-zero if any fail. Prints summary X/Y.
 *
 * Usage:
 *   node scripts/verify-media-matrix.mjs
 *   pnpm verify:media:matrix
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gamesRoot = path.join(repoRoot, 'public', 'games');

function isMediaHtml(name) {
  if (name.startsWith('_')) return false;
  return name.endsWith('-media.html') || name.endsWith('-thinking-media.html');
}

function findMedia(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return findMedia(target);
    return isMediaHtml(entry.name) ? [target] : [];
  });
}

const files = findMedia(gamesRoot).sort();
if (!files.length) {
  console.error('No media HTML files found under public/games');
  process.exit(1);
}

let passed = 0;
const failures = [];

for (const file of files) {
  const relative = path.relative(repoRoot, file).replaceAll('\\', '/');
  const result = spawnSync(process.execPath, ['scripts/verify-media.mjs', relative], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  if (result.status === 0) {
    passed += 1;
    console.log(`✅ ${relative}`);
  } else {
    failures.push(relative);
    console.log(`❌ ${relative}`);
    const detail = `${result.stdout || ''}${result.stderr || ''}`.trim();
    if (detail) {
      const lines = detail.split(/\r?\n/).slice(-12);
      for (const line of lines) console.log(`   ${line}`);
    }
  }
}

const total = files.length;
console.log(`\nMedia verify matrix: ${passed}/${total} passed`);
if (failures.length) {
  console.error(`Failed (${failures.length}):`);
  for (const f of failures) console.error(`  • ${f}`);
  process.exit(1);
}
process.exit(0);
