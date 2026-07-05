#!/usr/bin/env node
/**
 * audit-cover-safe-top.mjs — หาปกที่มีหัวข้อขาวฝังชิดขอบบน (เสี่ยงสระไทยล้น)
 * Usage: node scripts/audit-cover-safe-top.mjs [--json]
 */
import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { analyzeTopTitleBand } from './lib/cover-safe-zone.mjs';

const ROOT = 'public/games';

async function walk(dir, out = []) {
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) await walk(p, out);
    else if (/cover(-full|-chibi-full|-chibi)?\.png$/i.test(name)) out.push(p);
  }
  return out;
}

const files = await walk(ROOT);
const results = [];
for (const f of files.sort()) {
  try {
    const r = await analyzeTopTitleBand(f);
    results.push({ ...r, path: relative(process.cwd(), f).replace(/\\/g, '/') });
  } catch (e) {
    results.push({ path: f, error: e.message, risky: false });
  }
}

const risky = results.filter((r) => r.risky);
if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ risky, all: results }, null, 2));
} else {
  console.log(`Scanned ${results.length} covers — ${risky.length} with baked title near top\n`);
  for (const r of risky) {
    console.log(`⚠️  ${r.path}  bright=${r.brightPct}%  titleRow@${r.topBrightPct}%`);
  }
}
