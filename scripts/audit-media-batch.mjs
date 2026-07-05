#!/usr/bin/env node
/**
 * Batch audit สื่อการสอน (tracked_game=false media)
 */
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const MEDIA = [
  { path: 'public/games/math/rounding.html', cover: 'public/games/math/rounding-cover.png', slug: 'rounding' },
  { path: 'public/games/math/fraction-pieces.html', cover: 'public/games/math/fraction-pieces-cover.png', slug: 'fraction-pieces' },
  { path: 'public/games/math/math-fraction-hub/index.html', cover: 'public/games/math/math-fraction-hub-cover.png', slug: 'math-fraction-hub' },
  { path: 'public/games/math/times-table.html', cover: 'public/games/math/times-table-cover.png', slug: 'times-table' },
  { path: 'public/games/thai/thai-sara-chart.html', cover: 'public/games/thai/thai-sara-chart-cover.png', slug: 'thai-sara-chart' },
  { path: 'public/games/thai/thai-matra-chart.html', cover: 'public/games/thai/thai-matra-chart-cover.png', slug: 'thai-matra-chart' },
  { path: 'public/games/thai/thai-word-types.html', cover: 'public/games/thai/thai-word-types-cover.png', slug: 'thai-word-types' },
  { path: 'public/games/thai/thai-grammar-hub/index.html', cover: 'public/games/thai/thai-grammar-hub-cover.png', slug: 'thai-grammar-hub' },
  { path: 'public/games/thai/thai-script-hub/index.html', cover: null, slug: 'thai-script-hub' },
  { path: 'public/games/english/phonics-chart.html', cover: 'public/games/english/phonics-chart-cover.png', slug: 'phonics-chart' },
  { path: 'public/games/english/grammar-mini.html', cover: 'public/games/english/grammar-mini-cover.png', slug: 'grammar-mini' },
  { path: 'public/games/science/water-cycle.html', cover: 'public/games/science/water-cycle-cover.png', slug: 'water-cycle' },
  { path: 'public/games/math/decimal-media.html', cover: 'public/games/math/decimal-media-cover.png', slug: 'decimal-media' },
  { path: 'public/games/science/states-of-matter.html', cover: 'public/games/science/states-of-matter-cover.png', slug: 'states-of-matter' },
  { path: 'public/games/social/thailand-map.html', cover: 'public/games/social/thailand-map-cover.png', slug: 'thailand-map' },
  { path: 'public/games/english/sight-words-p4.html', cover: 'public/games/english/sight-words-p4-cover.png', slug: 'sight-words-p4' },
  { path: 'public/games/thai/fact-opinion.html', cover: 'public/games/thai/fact-opinion-cover.png', slug: 'fact-opinion' },
  { path: 'public/games/math/bar-chart-media.html', cover: 'public/games/math/bar-chart-media-cover.png', slug: 'bar-chart-media' },
  { path: 'public/games/social/good-citizen-media.html', cover: 'public/games/social/good-citizen-media-cover.png', slug: 'good-citizen-media' },
  { path: 'public/games/science/vertebrate-sort.html', cover: 'public/games/science/vertebrate-sort-cover.png', slug: 'vertebrate-sort' },
  { path: 'public/games/math/angle-media.html', cover: 'public/games/math/angle-media-cover.png', slug: 'angle-media' },
  { path: 'public/games/social/sukhothai-timeline.html', cover: 'public/games/social/sukhothai-timeline-cover.png', slug: 'sukhothai-timeline' },
  { path: 'public/games/health/food-label-media.html', cover: 'public/games/health/food-label-media-cover.png', slug: 'food-label-media' },
  { path: 'public/games/english/follow-instructions.html', cover: 'public/games/english/follow-instructions-cover.png', slug: 'follow-instructions' },
  { path: 'public/games/math/number-line-media.html', cover: 'public/games/math/number-line-media-cover.png', slug: 'number-line-media' },
  { path: 'public/games/science/digestive-system-media.html', cover: 'public/games/science/digestive-system-media-cover.png', slug: 'digestive-system-media' },
  { path: 'public/games/health/handwash-media.html', cover: 'public/games/health/handwash-media-cover.png', slug: 'handwash-media' },
];

function readPngSize(p) {
  const buf = readFileSync(p);
  if (buf.length >= 24 && buf[0] === 0x89) return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  return null;
}

const findings = [];

for (const m of MEDIA) {
  const abs = resolve(root, m.path);
  const item = { name: basename(m.path, '.html'), path: m.path, issues: [], warns: [] };

  if (!existsSync(abs)) {
    item.issues.push('HTML ไม่พบ');
    findings.push(item);
    continue;
  }

  const html = readFileSync(abs, 'utf8');

  if (!/kampai-sdk\.js/.test(html)) item.issues.push('ไม่มี kampai-sdk.js');
  if (/submitScore\s*\(/.test(html) && !/ไม่.*submitScore/.test(html)) item.warns.push('มี submitScore ในไฟล์ (สื่อไม่ควรเก็บคะแนน)');
  if (!/goHome|navigateBack|\/h\/|target=["']_top["']/.test(html)) item.issues.push('ไม่มีทางกลับหน้าหลัก');
  if (!/setSlug\s*\(/.test(html)) item.issues.push('ไม่มี setSlug');
  else {
    const slugM = html.match(/setSlug\(\s*['"]([^'"]+)['"]/);
    if (slugM && slugM[1] !== m.slug && !html.includes(`MEDIA_SLUG = '${m.slug}'`) && !html.includes(`MEDIA_SLUG='${m.slug}'`)) {
      const mediaSlug = html.match(/MEDIA_SLUG\s*=\s*['"]([^'"]+)['"]/);
      const actual = mediaSlug ? mediaSlug[1] : slugM[1];
      if (actual !== m.slug) item.warns.push(`slug ไม่ตรง: คาด ${m.slug} ได้ ${actual}`);
    }
  }
  if (/bg-white|text-black|#fff\b|#000\b/.test(html)) item.warns.push('hardcode สี bg-white/text-black/hex');
  if (/dark:/.test(html)) item.issues.push('มี dark: prefix (ห้าม light-only)');

  if (m.cover) {
    const coverAbs = resolve(root, m.cover);
    if (!existsSync(coverAbs)) item.issues.push(`ปกหาย: ${m.cover}`);
    else {
      const sz = readPngSize(coverAbs);
      if (sz && (sz.w !== 1280 || sz.h !== 720)) item.issues.push(`ปกขนาดผิด: ${sz.w}x${sz.h} (ต้อง 1280x720)`);
    }
  } else {
    item.warns.push('ไม่มีปกในรายการ audit');
  }

  // verify:game checks 7+9 (smoke + aspect)
  try {
    const out = execSync(`node scripts/verify-game.mjs "${m.path}"`, { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    if (/Check 7.*❌/.test(out)) item.issues.push('verify Check 7 render smoke FAIL');
    if (/Check 9.*❌/.test(out)) item.issues.push('verify Check 9 aspect ratio FAIL');
    if (/Check 7.*⚠️/.test(out)) item.warns.push('verify Check 7 skipped/warn');
  } catch (e) {
    const out = (e.stdout || '') + (e.stderr || '');
    if (/Check 7.*❌/.test(out)) item.issues.push('verify Check 7 render smoke FAIL');
    if (/Check 9.*❌/.test(out)) item.issues.push('verify Check 9 aspect ratio FAIL');
    // media expected to fail check 5/6 for no score
    if (!/Check 7.*❌/.test(out) && !/Check 9.*❌/.test(out) && /Check [56].*❌/.test(out)) {
      item.warns.push('verify fail check 5/6 (ปกติสำหรับสื่อ)');
    } else if (e.status === 1 && !/Check 7.*❌/.test(out) && !/Check 9.*❌/.test(out)) {
      item.warns.push('verify exit 1 (น่าจะเป็น check เกม ไม่ใช่สื่อ)');
    }
  }

  findings.push(item);
}

// indicator map coverage from migration 340
const map340 = readFileSync(resolve(root, 'supabase/migrations/340_seed_indicator_media_map.sql'), 'utf8');
const mappedUrls = [...map340.matchAll(/\('([^']+\.html)',\s*'[^']+'\)/g)].map((m) => m[1]);
const unmapped = MEDIA.filter((m) => {
  const url = '/' + m.path.replace(/^public/, '').replace(/\\/g, '/');
  return !mappedUrls.includes(url);
});

console.log('\n=== MEDIA AUDIT SUMMARY ===\n');
let issueCount = 0;
for (const f of findings) {
  if (f.issues.length === 0 && f.warns.length === 0) {
    console.log(`OK  ${f.path}`);
    continue;
  }
  console.log(`\n${f.issues.length ? '!!' : '??'} ${f.path}`);
  for (const i of f.issues) { console.log(`   ISSUE: ${i}`); issueCount++; }
  for (const w of f.warns) console.log(`   WARN:  ${w}`);
}

console.log('\n--- ไม่มีใน migration 340 indicator map ---');
for (const m of unmapped) {
  const url = '/' + m.path.replace(/^public/, '').replace(/\\/g, '/');
  console.log(`   ${url}`);
}

console.log(`\nTotal issues: ${issueCount}`);
console.log(`Unmapped media: ${unmapped.length}`);
