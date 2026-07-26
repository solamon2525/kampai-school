#!/usr/bin/env node
/**
 * Phase P0 — Audit baseline for ALL *-media / *-thinking-media + *-worksheet.
 *
 * Usage:
 *   node scripts/audit-media-worksheets.mjs
 *   node scripts/audit-media-worksheets.mjs --json-only
 *   node scripts/audit-media-worksheets.mjs --out output/audit-media-worksheets-baseline.json
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gamesRoot = path.join(root, 'public', 'games');
const args = process.argv.slice(2);
const jsonOnly = args.includes('--json-only');
const outIdx = args.indexOf('--out');
const outPath =
  outIdx >= 0 && args[outIdx + 1]
    ? path.resolve(root, args[outIdx + 1])
    : path.join(root, 'output', 'audit-media-worksheets-baseline.json');

/** Intentional custom deep boards — exclude from shallow flag. */
const SHALLOW_EXCLUDE = new Set([
  'multiplication-worksheet.html',
  'division-worksheet.html',
  'short-division-worksheet.html',
]);

/** Media stem → worksheet basename stem aliases (after stripping -thinking). */
const WORKSHEET_ALIASES = {
  'long-division': 'division',
  'digestive-system': 'digestive',
  'thai-narration-style': 'narration-style',
  'thai-implied-meaning': 'implied-meaning',
};

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(target);
    return [target];
  });
}

function toRel(filePath) {
  return path.relative(root, filePath).replaceAll('\\', '/');
}

function countMatches(source, re) {
  const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`;
  return [...source.matchAll(new RegExp(re.source, flags))].length;
}

function hasPractice(html) {
  // Same heuristics as scripts/verify-media.mjs (+ #practice per P0 brief)
  return (
    /data-mode\s*=\s*["']practice["']/.test(html) ||
    /mode-practice|id=["']practice["']|class=["'][^"']*practice/.test(html) ||
    /#practice\b/.test(html) ||
    /ฝึกสั้น|โหมดฝึก|✏️\s*ฝึก/.test(html)
  );
}

function hasLearn(html) {
  return (
    /data-mode\s*=\s*["']learn["']/.test(html) ||
    /📖\s*(สอน|เรียนรู้)/.test(html) ||
    /id=["']learn["']/.test(html)
  );
}

function hasSdkVersionQuery(html) {
  return /kampai-sdk\.js\?v=/.test(html);
}

function hasKampaiSdk(html) {
  return /kampai-sdk\.js/.test(html);
}

function mediaCoverExists(mediaAbs) {
  const dir = path.dirname(mediaAbs);
  const base = path.basename(mediaAbs, '.html'); // e.g. foo-media / foo-thinking-media
  const candidates = [
    `${base}-cover.png`,
    `${base}-cover.svg`,
    // thinking equivalent already covered by base ending in -thinking-media
  ];
  for (const name of candidates) {
    if (fs.existsSync(path.join(dir, name))) return { exists: true, file: path.join(dir, name) };
  }
  return { exists: false, file: null };
}

function mediaStemToWorksheetStem(mediaBase) {
  // color-mix-media → color-mix; long-division-thinking-media → long-division
  let stem = mediaBase
    .replace(/-thinking-media$/, '')
    .replace(/-media$/, '');
  if (WORKSHEET_ALIASES[stem]) stem = WORKSHEET_ALIASES[stem];
  return stem;
}

function findSiblingWorksheet(mediaAbs, worksheetByStem) {
  const base = path.basename(mediaAbs, '.html');
  const stem = mediaStemToWorksheetStem(base);
  const hit = worksheetByStem.get(stem);
  if (hit) return hit;
  // same-folder fallback: <stem>-worksheet.html
  const local = path.join(path.dirname(mediaAbs), `${stem}-worksheet.html`);
  if (fs.existsSync(local)) return local;
  return null;
}

function analyzeHubWorksheet(html, rel) {
  const sourceMeta =
    html.match(/<meta\s+name=["']worksheet-source-media["']\s+content=["']([^"']+)["']/i)?.[1] ||
    null;
  const isHubName = /[-/][^/]*-hub-worksheet\.html$/.test(rel) || /hub-worksheet\.html$/.test(path.basename(rel));
  const pointsToHubIndex = Boolean(sourceMeta && /\/[a-z0-9-]+-hub\/index\.html$/i.test(sourceMeta));
  return {
    isHubWorksheet: isHubName,
    sourceMeta,
    sourcePointsToHubIndex: pointsToHubIndex,
    hubMetaOk: !isHubName || pointsToHubIndex,
  };
}

const allFiles = walk(gamesRoot);

const mediaFiles = allFiles
  .filter((f) => {
    const name = path.basename(f);
    if (name.startsWith('_template')) return false;
    return /-(?:thinking-)?media\.html$/.test(name) || name.endsWith('-thinking-media.html');
  })
  .filter((f) => {
    const name = path.basename(f);
    // Include both *-media.html and *-thinking-media.html (thinking already matches *-media)
    return name.endsWith('-media.html');
  })
  .sort();

const worksheetFiles = allFiles
  .filter((f) => {
    const name = path.basename(f);
    if (name.startsWith('_template') || name.includes('template')) return false;
    return name.endsWith('-worksheet.html');
  })
  .sort();

const worksheetByStem = new Map();
for (const f of worksheetFiles) {
  const stem = path.basename(f, '.html').replace(/-worksheet$/, '');
  worksheetByStem.set(stem, f);
}

const media = mediaFiles.map((abs) => {
  const html = fs.readFileSync(abs, 'utf8');
  const rel = toRel(abs);
  const base = path.basename(abs, '.html');
  const cover = mediaCoverExists(abs);
  const wsAbs = findSiblingWorksheet(abs, worksheetByStem);
  const practiceOk = hasPractice(html);
  const learnOk = hasLearn(html);
  return {
    file: rel,
    base,
    isThinking: base.endsWith('-thinking-media'),
    practiceOk,
    learnOk,
    hasCover: cover.exists,
    coverFile: cover.file ? toRel(cover.file) : null,
    hasKampaiSdk: hasKampaiSdk(html),
    sdkHasVersionQuery: hasSdkVersionQuery(html),
    worksheetPaired: Boolean(wsAbs),
    worksheetFile: wsAbs ? toRel(wsAbs) : null,
    worksheetStem: mediaStemToWorksheetStem(base),
  };
});

const worksheets = worksheetFiles.map((abs) => {
  const html = fs.readFileSync(abs, 'utf8');
  const rel = toRel(abs);
  const base = path.basename(abs);
  const stepRowCount = countMatches(html, /step-row/g);
  const reasonLineCount = countMatches(html, /reason-line/g);
  const excluded = SHALLOW_EXCLUDE.has(base);
  const shallowRaw = stepRowCount === 0 && reasonLineCount <= 2;
  const shallow = excluded ? false : shallowRaw;
  const hub = analyzeHubWorksheet(html, rel);
  return {
    file: rel,
    base,
    stepRowCount,
    reasonLineCount,
    shallowExcluded: excluded,
    shallowRaw,
    shallow,
    ...hub,
  };
});

const hubWorksheets = worksheets.filter((w) => w.isHubWorksheet);
/** P3: hub-backed = source meta points at *-hub/index.html (includes vocab-grammar, data-chart, science-explorer). */
const hubBySourceMeta = worksheets.filter((w) => w.sourcePointsToHubIndex);
const hubShallow = hubBySourceMeta.filter((w) => w.shallow);

const summary = {
  mediaTotal: media.length,
  thinkingMedia: media.filter((m) => m.isThinking).length,
  practiceFail: media.filter((m) => !m.practiceOk).length,
  learnFail: media.filter((m) => !m.learnOk).length,
  missingCover: media.filter((m) => !m.hasCover).length,
  sdkMissing: media.filter((m) => !m.hasKampaiSdk).length,
  sdkNoVersion: media.filter((m) => m.hasKampaiSdk && !m.sdkHasVersionQuery).length,
  mediaUnpaired: media.filter((m) => !m.worksheetPaired).length,
  worksheetTotal: worksheets.length,
  shallow: worksheets.filter((w) => w.shallow).length,
  shallowRaw: worksheets.filter((w) => w.shallowRaw).length,
  hubWorksheets: hubWorksheets.length,
  hubBySourceMeta: hubBySourceMeta.length,
  hubShallow: hubShallow.length,
  hubMetaOk: hubWorksheets.filter((w) => w.hubMetaOk).length,
  hubMetaFail: hubWorksheets.filter((w) => !w.hubMetaOk).length,
};

const report = {
  generatedAt: new Date().toISOString(),
  summary,
  practiceFailFiles: media.filter((m) => !m.practiceOk).map((m) => m.file),
  learnFailFiles: media.filter((m) => !m.learnOk).map((m) => m.file),
  missingCoverFiles: media.filter((m) => !m.hasCover).map((m) => m.file),
  sdkNoVersionFiles: media.filter((m) => m.hasKampaiSdk && !m.sdkHasVersionQuery).map((m) => m.file),
  mediaUnpairedFiles: media.filter((m) => !m.worksheetPaired).map((m) => m.file),
  shallowFiles: worksheets.filter((w) => w.shallow).map((w) => w.file),
  hubBySourceMetaFiles: hubBySourceMeta.map((w) => w.file),
  hubShallowFiles: hubShallow.map((w) => w.file),
  hubMetaFailFiles: hubWorksheets.filter((w) => !w.hubMetaOk).map((w) => ({
    file: w.file,
    sourceMeta: w.sourceMeta,
  })),
  media,
  worksheets,
};

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf8');

if (jsonOnly) {
  console.log(JSON.stringify(report, null, 2));
  process.exit(0);
}

console.log('=== Phase P0 media + worksheet audit baseline ===\n');
console.log(
  `media=${summary.mediaTotal} (thinking=${summary.thinkingMedia})  worksheets=${summary.worksheetTotal}  hubsNamed=${summary.hubWorksheets}  hubsBySource=${summary.hubBySourceMeta}`,
);
console.log(
  `practiceFail=${summary.practiceFail}  learnFail=${summary.learnFail}  missingCover=${summary.missingCover}  sdkNoVersion=${summary.sdkNoVersion}  unpaired=${summary.mediaUnpaired}`,
);
console.log(
  `shallow=${summary.shallow} (raw=${summary.shallowRaw}, excl intentional boards)  hubShallow=${summary.hubShallow}/${summary.hubBySourceMeta}  hubMetaOk=${summary.hubMetaOk}/${summary.hubWorksheets}`,
);

if (summary.practiceFail) {
  console.log('\nPractice contract FAIL:');
  for (const f of report.practiceFailFiles) console.log(`  • ${f}`);
}
if (summary.learnFail) {
  console.log('\nLearn signal FAIL:');
  for (const f of report.learnFailFiles) console.log(`  • ${f}`);
}
if (summary.mediaUnpaired) {
  console.log('\nMedia without worksheet pair:');
  for (const f of report.mediaUnpairedFiles) console.log(`  • ${f}`);
}
if (summary.shallow) {
  console.log('\nShallow worksheets:');
  for (const f of report.shallowFiles) console.log(`  • ${f}`);
}
if (summary.hubMetaFail) {
  console.log('\nHub worksheets with bad/missing *-hub/index.html source meta:');
  for (const row of report.hubMetaFailFiles) {
    console.log(`  • ${row.file}  source=${row.sourceMeta || '(none)'}`);
  }
}

console.log(`\nWrote JSON → ${toRel(outPath)}`);
