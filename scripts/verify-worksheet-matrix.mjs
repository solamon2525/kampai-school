#!/usr/bin/env node
/**
 * Worksheet quality matrix — Phase 5C
 * Scans all *-worksheet.html and reports scaffold / sets / parent-slip / hub3 / version / subjectGuide coverage.
 *
 * Usage:
 *   node scripts/verify-worksheet-matrix.mjs
 *   node scripts/verify-worksheet-matrix.mjs --strict   # exit 1 if bare hub3 remain
 *   node scripts/verify-worksheet-matrix.mjs --json
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const gamesRoot = path.join(repoRoot, 'public', 'games');
const modesPath = path.join(gamesRoot, 'worksheet-modes.js');
const args = new Set(process.argv.slice(2));
const asJson = args.has('--json');
const strict = args.has('--strict');

function findWorksheets(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return findWorksheets(target);
    if (entry.name.startsWith('_')) return [];
    return entry.name.endsWith('worksheet.html') ? [target] : [];
  });
}

function extractVersion(source, assetName) {
  const match = source.match(new RegExp(`${assetName.replace('.', '\\.')}(?:\\?v=([^"'&>]+))?`));
  return match ? (match[1] ?? '') : null;
}

function loadGuideMatches() {
  if (!fs.existsSync(modesPath)) return [];
  const source = fs.readFileSync(modesPath, 'utf8');
  return [...source.matchAll(/match:\s*'([^']+)'/g)].map((m) => m[1]);
}

const guideMatches = loadGuideMatches();

function analyze(file) {
  const source = fs.readFileSync(file, 'utf8');
  const relative = path.relative(repoRoot, file).replaceAll('\\', '/');
  const base = path.basename(file);
  const usesTopic = /worksheet-topic\.js/.test(source);
  const usesSets = /WORKSHEET_KEY\s*=|KampaiWorksheetSets|mountToolbar/.test(source) || usesTopic;
  const parentSlip = /parent-slip|KampaiTopicWorksheet/.test(source) || usesTopic;
  const hub3 = /ลงวิธีคิด 3 ขั้น/.test(source) && /reason-line/.test(source);
  const calcShallow = /calc-line/.test(source) && !/step-tag|ld-|short-div|mg\b|fraction-bar|number-line-svg/.test(source);
  const labeledSteps = /step-tag/.test(source) || /ld-quotient|class=["']mg["']|short-div/.test(source);
  const answerReveal = /btnAnswerNext|createAnswerReveal|answerStepLabel/.test(source) || usesTopic;
  const topicVer = extractVersion(source, 'worksheet-topic.js');
  const modesVer = extractVersion(source, 'worksheet-modes.js');
  const runtimeVer = extractVersion(source, 'worksheet-runtime.js');
  const hasGuide = guideMatches.some((m) => relative.includes(m) || base.includes(m.replace('-worksheet', '')));

  let depth = 'A';
  if (hub3) depth = 'hub3';
  else if (calcShallow && !labeledSteps) depth = 'shallow';
  else if (labeledSteps || /classify-grid|cycle-flow|nutrition-label|sound-box/.test(source)) depth = 'B+';
  else if (usesTopic) depth = 'B';

  return {
    file: relative,
    depth,
    usesTopic,
    usesSets,
    parentSlip,
    hub3,
    calcShallow,
    labeledSteps,
    answerReveal,
    hasGuide,
    topicVer,
    modesVer,
    runtimeVer,
  };
}

const rows = findWorksheets(gamesRoot).sort().map(analyze);
const summary = {
  total: rows.length,
  hub3: rows.filter((r) => r.hub3).length,
  shallow: rows.filter((r) => r.depth === 'shallow').length,
  labeledSteps: rows.filter((r) => r.labeledSteps).length,
  sets: rows.filter((r) => r.usesSets).length,
  parentSlip: rows.filter((r) => r.parentSlip).length,
  guides: rows.filter((r) => r.hasGuide).length,
  answerReveal: rows.filter((r) => r.answerReveal).length,
};

if (asJson) {
  console.log(JSON.stringify({ summary, rows }, null, 2));
} else {
  console.log('Worksheet quality matrix\n');
  console.log(
    `total=${summary.total}  sets=${summary.sets}  parent-slip=${summary.parentSlip}  guides=${summary.guides}  labeled=${summary.labeledSteps}  reveal=${summary.answerReveal}  hub3=${summary.hub3}  shallow=${summary.shallow}`,
  );
  console.log('\nDepth flags:');
  for (const row of rows.filter((r) => r.hub3 || r.depth === 'shallow')) {
    console.log(`  [${row.depth}] ${row.file}`);
  }
  const versions = new Set(rows.flatMap((r) => [r.topicVer, r.modesVer, r.runtimeVer].filter(Boolean)));
  console.log(`\nAsset versions seen: ${[...versions].join(', ') || '(none)'}`);
  if (!guideMatches.length) console.log('WARN: no subjectGuides matches found in worksheet-modes.js');
}

if (strict && summary.hub3 > 0) {
  console.error(`\nSTRICT: ${summary.hub3} worksheet(s) still use bare hub3 scaffold`);
  process.exit(1);
}

process.exit(0);
