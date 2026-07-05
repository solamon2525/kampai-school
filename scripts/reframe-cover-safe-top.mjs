#!/usr/bin/env node
/**
 * reframe-cover-safe-top.mjs — เพิ่ม safe zone ด้านบนแล้วบีบกลับ 1280×720
 * Usage:
 *   node scripts/reframe-cover-safe-top.mjs <path> [topPx]
 *   node scripts/reframe-cover-safe-top.mjs --all-risky [--dry-run]
 */
import { writeFile, rename, unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { reframeCoverSafeTop, TOP_SAFE_PX, analyzeTopTitleBand } from './lib/cover-safe-zone.mjs';
import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';

async function walk(dir, out = []) {
  for (const name of await readdir(dir)) {
    const p = join(dir, name);
    const s = await stat(p);
    if (s.isDirectory()) await walk(p, out);
    else if (/cover(-full|-chibi-full|-chibi)?\.png$/i.test(name)) out.push(p);
  }
  return out;
}

async function reframeOne(src, topSafe, dryRun) {
  const abs = resolve(src);
  const analysis = await analyzeTopTitleBand(abs);
  if (!analysis.risky) {
    console.log(`⏭️  skip ${relative(process.cwd(), abs)} (no baked title band)`);
    return false;
  }
  if (dryRun) {
    console.log(`🔍 would reframe ${relative(process.cwd(), abs)} bright=${analysis.brightPct}%`);
    return true;
  }
  const buf = await reframeCoverSafeTop(abs, topSafe);
  const out = abs.replace(/(\.[^.]+)$/, '-safe$1');
  await writeFile(out, buf);
  await unlink(abs).catch(() => {});
  await rename(out, abs);
  const m = await sharp(abs).metadata();
  console.log(`✅ ${relative(process.cwd(), abs)} → ${m.width}×${m.height} safe=${topSafe}px`);
  return true;
}

const dryRun = process.argv.includes('--dry-run');
const allRisky = process.argv.includes('--all-risky');
const topSafe = Number(process.argv.find((a) => /^\d+$/.test(a))) || TOP_SAFE_PX;

if (allRisky) {
  const files = await walk('public/games');
  let n = 0;
  for (const f of files.sort()) {
    if (await reframeOne(f, topSafe, dryRun)) n++;
  }
  console.log(`\n${dryRun ? 'Would reframe' : 'Reframed'} ${n} cover(s)`);
} else {
  const src = process.argv[2] || 'public/games/math/mini-farm-island/cover.png';
  await reframeOne(src, topSafe, dryRun);
}
