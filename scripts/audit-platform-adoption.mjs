#!/usr/bin/env node
/**
 * Automated Cross-Subject Inventory & Archetype Audit
 *
 * Scans `public/games/` recursively (skipping `_template*`, `engine`, `media-lab-assets`, `ar-calibration`),
 * classifies every `.html` file by kind, subject, learning archetype, shared runtime adoption, and gaps,
 * and writes `.artifacts/platform-audit/inventory.json` and `.artifacts/platform-audit/SUMMARY.md`.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const DEFAULT_GAMES_DIR = path.join(REPO_ROOT, 'public', 'games');
const DEFAULT_OUT_DIR = path.join(REPO_ROOT, '.artifacts', 'platform-audit');

const SKIP_DIRS = new Set(['engine', 'media-lab-assets', 'ar-calibration']);
const KNOWN_SUBJECTS = new Set([
  'arts',
  'career',
  'english',
  'health',
  'math',
  'science',
  'social',
  'tech',
  'thai',
  'general',
  'demo',
]);

const ARCHETYPE_RULES = [
  {
    archetype: 'classify-sort',
    pathPatterns: [
      /\bsort\b/,
      /\bclassify\b/,
      /waste-sort/,
      /food-groups/,
      /food-label/,
      /living-nonliving/,
      /vertebrate/,
      /materials-around/,
      /light-sort/,
      /good-citizen/,
      /citizen-duties/,
      /civic-duty/,
      /online-safety/,
      /coding-social/,
      /ai-data-literacy/,
      /algorithm-unplugged/,
      /data-presentation/,
      /sufficiency/,
      /housework/,
      /home-crafts/,
      /workplace-safety/,
      /emotional-wellbeing/,
      /safety-help/,
      /school-garden/,
      /agriculture/,
      /cooking-basics/,
      /food-nutrition/,
      /community-jobs/,
      /exercise-care/,
      /economics/,
    ],
    htmlPatterns: [
      /จำแนก/,
      /จัดกลุ่ม/,
      /แยกประเภท/,
      /แยกขยะ/,
      /หมวดหมู่/,
      /\bsort\b/,
      /\bclassify\b/,
      /\bbucket\b/,
    ],
  },
  {
    archetype: 'math-scaffold',
    pathPatterns: [
      /division/,
      /short-division/,
      /long-division/,
      /divide/,
      /multiply/,
      /multiplication/,
      /times-table/,
      /fraction/,
      /improper-to-mixed/,
      /mixed-number/,
      /decimal/,
      /add-sub/,
      /number-line/,
      /angle/,
      /area/,
      /perimeter/,
      /geometry/,
      /basic-shapes/,
      /rounding/,
      /math24/,
      /\b24\.html$/,
      /equation/,
      /clock/,
      /coin-exchange/,
      /cashier/,
      /budget-planning/,
      /bar-chart/,
      /coord-3d/,
      /block-3d/,
      /catch-numbers/,
    ],
    htmlPatterns: [
      /step-row/,
      /reason-line/,
      /หารยาว|หารสั้น|การหาร|\bหาร\b/,
      /การคูณ|สูตรคูณ/,
      /เศษส่วน/,
      /ทศนิยม/,
      /สมการ/,
      /โจทย์ปัญหา/,
      /เส้นจำนวน/,
      /รูปเรขาคณิต|มุมแหลม|มุมฉาก|มุมป้าน/,
    ],
  },
  {
    archetype: 'reading-story',
    pathPatterns: [
      /wannakhadi/,
      /literature/,
      /reading/,
      /story/,
      /poetry/,
      /poem/,
      /idiom/,
      /sentence/,
      /conversation/,
      /grammar/,
      /punctuation/,
      /fact-opinion/,
      /implied-meaning/,
      /narration/,
      /follow-instructions/,
      /tense/,
      /rhetoric/,
      /fluency/,
      /script-hub/,
      /art-critique/,
    ],
    htmlPatterns: [
      /วรรณคดี/,
      /อ่านจับใจความ/,
      /\bอ่าน\b/,
      /นิทาน/,
      /บทความ/,
      /สำนวน/,
      /สุภาษิต/,
      /ร้อยกรอง/,
      /บทสนทนา/,
      /ประโยค/,
      /เรื่องเล่า|เนื้อเรื่อง/,
    ],
  },
  {
    archetype: 'visual-lab',
    pathPatterns: [
      /water-cycle/,
      /digestive/,
      /circuit/,
      /force-motion/,
      /body-systems/,
      /human-organs/,
      /bone-muscle/,
      /food-chain/,
      /plant-parts/,
      /light-properties/,
      /states-of-matter/,
      /solar/,
      /globe/,
      /thailand-map/,
      /map-directions/,
      /thai-geography/,
      /thai-regions/,
      /thai-calendar/,
      /sukhothai/,
      /timeline/,
      /color-mix/,
      /color-wheel/,
      /symmetry/,
      /rhythm/,
      /music/,
      /instrument/,
      /dance/,
      /visual-elements/,
      /handwash/,
      /brush-teeth/,
      /first-aid/,
      /line-trace/,
      /3d/,
      /-ar\b/,
      /ar-/,
      /lab/,
      /sim/,
    ],
    htmlPatterns: [
      /media-lab-runtime/,
      /\bdiagram\b/,
      /แผนภาพ/,
      /วัฏจักร/,
      /วงจรไฟฟ้า|วงจร/,
      /อวัยวะ/,
      /โครงสร้าง/,
      /แผนที่/,
      /ไทม์ไลน์/,
      /ทดลอง/,
      /จำลอง/,
      /ผสมสี/,
      /แม่สี/,
      /นาฏศิลป์|เครื่องดนตรี/,
    ],
  },
  {
    archetype: 'vocab-concept',
    pathPatterns: [
      /vocab/,
      /sight-words/,
      /phonics/,
      /alphabet/,
      /word-types/,
      /attack-on-noun/,
      /attack-noun/,
      /synonym/,
      /homophone/,
      /dictionary/,
      /matra/,
      /sara/,
      /spelling/,
      /listen-spell/,
      /classroom-action/,
      /classroom-english/,
      /thai-sara/,
      /thai-matra/,
      /thai-script/,
      /binary-bits/,
      /logic-gates/,
    ],
    htmlPatterns: [
      /\bvocab\b/,
      /sight\s*words/,
      /phonics/,
      /คำศัพท์/,
      /มาตราตัวสะกด/,
      /พจนานุกรม/,
      /คำพ้อง/,
      /คำนาม|คำกริยา|คำวิเศษณ์/,
      /พยัญชนะ|สระ/,
    ],
  },
];

function normalizePath(filePath) {
  return String(filePath || '').replaceAll('\\', '/').replace(/^\.\//, '');
}

function detectSubject(normalizedPath) {
  const parts = normalizedPath.split('/').filter(Boolean);
  const gamesIdx = parts.indexOf('games');
  const candidate = gamesIdx >= 0 ? parts[gamesIdx + 1] : parts[0];
  if (candidate && KNOWN_SUBJECTS.has(candidate) && !candidate.endsWith('.html')) {
    return candidate;
  }
  return 'root';
}

function detectKind(normalizedPath, html) {
  const base = path.posix.basename(normalizedPath).toLowerCase();
  if (base.endsWith('-worksheet.html') || base === 'worksheet.html') {
    return 'worksheet';
  }
  if (
    base.endsWith('-media.html') ||
    base.endsWith('-thinking-media.html') ||
    /media-lab-runtime\.js/i.test(html)
  ) {
    return 'media';
  }
  if (
    /worksheet-runtime\.js/i.test(html) &&
    /id=["']selStyle["']/i.test(html) &&
    /id=["']selPageCount["']/i.test(html)
  ) {
    return 'worksheet';
  }
  return 'game';
}

function stripScriptAndStyle(html) {
  return String(html || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ');
}

function stripCommentsForCodeScan(html) {
  return String(html || '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/(?<!:)\/\/[^\n]*/g, ' ')
    .replace(/\/\*[\s\S]*?\*\//g, ' ');
}

export function classifyArchetype(filePath, html = '') {
  const normPath = normalizePath(filePath).toLowerCase();
  const rawHtml = String(html || '');
  const titleMatch = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const titleText = titleMatch ? titleMatch[1].toLowerCase() : '';
  const visibleHtml = stripScriptAndStyle(rawHtml).toLowerCase();
  const fullLower = rawHtml.toLowerCase();

  const scores = new Map();
  for (const rule of ARCHETYPE_RULES) {
    let score = 0;
    for (const re of rule.pathPatterns) {
      if (re.test(normPath)) score += 4;
    }
    for (const re of rule.htmlPatterns) {
      if (re.test(titleText)) score += 3;
      if (re.test(visibleHtml)) score += 2;
      else if (re.test(fullLower)) score += 1;
    }
    scores.set(rule.archetype, score);
  }

  let bestArchetype = null;
  let bestScore = 0;
  for (const rule of ARCHETYPE_RULES) {
    const score = scores.get(rule.archetype) || 0;
    if (score > bestScore) {
      bestScore = score;
      bestArchetype = rule.archetype;
    }
  }

  if (bestArchetype) return bestArchetype;

  const subject = detectSubject(normPath);
  if (subject === 'math') return 'math-scaffold';
  if (subject === 'thai' || subject === 'english') return 'vocab-concept';
  if (subject === 'science' || subject === 'arts' || subject === 'health' || subject === 'tech') {
    return 'visual-lab';
  }
  if (subject === 'career' || subject === 'social') return 'classify-sort';
  return 'vocab-concept';
}

export function auditHtmlFile(filePath, html = '') {
  const normPath = normalizePath(filePath);
  const rawHtml = String(html || '');
  const kind = detectKind(normPath, rawHtml);
  const subject = detectSubject(normPath);
  const archetype = classifyArchetype(normPath, rawHtml);

  const sharedRuntimes = {
    hasKampaiSdk: /kampai-sdk\.js/i.test(rawHtml),
    hasMediaLabRuntime: /media-lab-runtime\.js/i.test(rawHtml),
    hasWorksheetRuntime: /worksheet-runtime\.js/i.test(rawHtml),
    hasWorksheetTopic: /worksheet-topic\.js/i.test(rawHtml),
    hasWorksheetModes: /worksheet-modes\.js/i.test(rawHtml),
    hasClassroomTools: /(?:shared-)?classroom-tools\.js/i.test(rawHtml),
  };

  const codeOnly = stripCommentsForCodeScan(rawHtml);
  const gaps = [];

  if (kind === 'media') {
    if (!sharedRuntimes.hasMediaLabRuntime && !/prefers-reduced-motion/i.test(rawHtml)) {
      gaps.push('missing-reduced-motion');
    }
    if (
      !sharedRuntimes.hasMediaLabRuntime &&
      !/(?:KAMPAI\s*\.\s*sound\s*\.\s*speak|speechSynthesis)/i.test(rawHtml)
    ) {
      gaps.push('missing-speak-api');
    }
    if (/submitScore\s*\(/i.test(codeOnly)) {
      gaps.push('media-has-submitScore');
    }
    if (
      !sharedRuntimes.hasMediaLabRuntime &&
      !/(?:getState\s*[:=]|function\s+getState|\bgetState\s*\()/i.test(rawHtml)
    ) {
      gaps.push('missing-getState');
    }
    if (!/<meta[^>]+name=["']viewport["']/i.test(rawHtml)) {
      gaps.push('missing-viewport');
    }
  } else if (kind === 'worksheet') {
    if (!/<meta[^>]+name=["']worksheet-source-media["']/i.test(rawHtml)) {
      gaps.push('missing-paired-media-meta');
    }
    if (!/<meta[^>]+name=["']curriculum-indicators["']/i.test(rawHtml)) {
      gaps.push('missing-curriculum-indicators');
    }
    if (!sharedRuntimes.hasWorksheetRuntime) {
      gaps.push('missing-worksheet-runtime');
    }
    if (!sharedRuntimes.hasWorksheetModes) {
      gaps.push('missing-worksheet-modes');
    }
  } else {
    if (!/prefers-reduced-motion/i.test(rawHtml)) {
      gaps.push('missing-reduced-motion');
    }
    if (!sharedRuntimes.hasKampaiSdk && subject !== 'root') {
      gaps.push('missing-kampai-sdk');
    }
    if (!/<meta[^>]+name=["']viewport["']/i.test(rawHtml)) {
      gaps.push('missing-viewport');
    }
  }

  return {
    file: normPath,
    kind,
    subject,
    archetype,
    sharedRuntimes,
    gaps,
  };
}

function walkHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name.startsWith('_template') || SKIP_DIRS.has(entry.name)) continue;
      results.push(...walkHtmlFiles(path.join(dir, entry.name)));
    } else if (entry.name.endsWith('.html') && !entry.name.startsWith('_template')) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

function buildSummaryMarkdown(items) {
  const total = items.length;
  const byKind = { media: 0, worksheet: 0, game: 0 };
  const bySubject = new Map();
  const byArchetype = new Map();
  const gapCounts = new Map();
  const runtimeCounts = {
    hasKampaiSdk: 0,
    hasMediaLabRuntime: 0,
    hasWorksheetRuntime: 0,
    hasWorksheetTopic: 0,
    hasWorksheetModes: 0,
    hasClassroomTools: 0,
  };

  for (const item of items) {
    byKind[item.kind] = (byKind[item.kind] || 0) + 1;

    if (!bySubject.has(item.subject)) {
      bySubject.set(item.subject, { total: 0, media: 0, worksheet: 0, game: 0, gaps: 0 });
    }
    const s = bySubject.get(item.subject);
    s.total++;
    s[item.kind]++;
    if (item.gaps.length > 0) s.gaps++;

    if (!byArchetype.has(item.archetype)) {
      byArchetype.set(item.archetype, { total: 0, media: 0, worksheet: 0, game: 0, gaps: 0 });
    }
    const a = byArchetype.get(item.archetype);
    a.total++;
    a[item.kind]++;
    if (item.gaps.length > 0) a.gaps++;

    for (const [key, val] of Object.entries(item.sharedRuntimes)) {
      if (val) runtimeCounts[key]++;
    }
    for (const gap of item.gaps) {
      gapCounts.set(gap, (gapCounts.get(gap) || 0) + 1);
    }
  }

  const lines = [
    '# Cross-Subject Media & Worksheet Platform Audit',
    '',
    `- **Total HTML files:** ${total}`,
    `- **By Kind:** media=${byKind.media}, worksheet=${byKind.worksheet}, game=${byKind.game}`,
    `- **Shared Runtime Adoption:** kampai-sdk=${runtimeCounts.hasKampaiSdk}, media-lab-runtime=${runtimeCounts.hasMediaLabRuntime}, worksheet-runtime=${runtimeCounts.hasWorksheetRuntime}, worksheet-topic=${runtimeCounts.hasWorksheetTopic}, worksheet-modes=${runtimeCounts.hasWorksheetModes}, classroom-tools=${runtimeCounts.hasClassroomTools}`,
    '',
    '## By Subject',
    '',
    '| Subject | Total | Media | Worksheet | Game | Files With Gaps |',
    '|---|---:|---:|---:|---:|---:|',
  ];

  for (const [subj, row] of [...bySubject.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    lines.push(`| ${subj} | ${row.total} | ${row.media} | ${row.worksheet} | ${row.game} | ${row.gaps} |`);
  }

  lines.push(
    '',
    '## By Archetype',
    '',
    '| Archetype | Total | Media | Worksheet | Game | Files With Gaps |',
    '|---|---:|---:|---:|---:|---:|',
  );

  for (const [arch, row] of [...byArchetype.entries()].sort((a, b) => b[1].total - a[1].total)) {
    lines.push(`| ${arch} | ${row.total} | ${row.media} | ${row.worksheet} | ${row.game} | ${row.gaps} |`);
  }

  lines.push('', '## Top Actionable Gaps', '', '| Gap | Count |', '|---|---:|');
  for (const [gap, count] of [...gapCounts.entries()].sort((a, b) => b[1] - a[1])) {
    lines.push(`| \`${gap}\` | ${count} |`);
  }
  lines.push('');

  return {
    markdown: lines.join('\n'),
    byKind,
    bySubject: Object.fromEntries(bySubject),
    byArchetype: Object.fromEntries(byArchetype),
    gapCounts: Object.fromEntries(gapCounts),
    runtimeCounts,
  };
}

export function runAudit({ gamesDir = DEFAULT_GAMES_DIR, outDir = DEFAULT_OUT_DIR } = {}) {
  const files = walkHtmlFiles(gamesDir).sort();
  const items = files.map((abs) => {
    const rel = normalizePath(path.relative(REPO_ROOT, abs));
    const html = fs.readFileSync(abs, 'utf8');
    return auditHtmlFile(rel, html);
  });

  const summary = buildSummaryMarkdown(items);
  fs.mkdirSync(outDir, { recursive: true });
  const inventoryPath = path.join(outDir, 'inventory.json');
  const summaryPath = path.join(outDir, 'SUMMARY.md');

  fs.writeFileSync(
    inventoryPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        total: items.length,
        byKind: summary.byKind,
        runtimeCounts: summary.runtimeCounts,
        bySubject: summary.bySubject,
        byArchetype: summary.byArchetype,
        gapCounts: summary.gapCounts,
        items,
      },
      null,
      2,
    ),
    'utf8',
  );
  fs.writeFileSync(summaryPath, summary.markdown, 'utf8');

  return { items, summary, inventoryPath, summaryPath };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const { items, summary, inventoryPath, summaryPath } = runAudit();
  console.log(`\n=== Platform Adoption Audit (${items.length} HTML files) ===`);
  console.log(`Kind: media=${summary.byKind.media}, worksheet=${summary.byKind.worksheet}, game=${summary.byKind.game}`);
  console.log('\nBy Subject:');
  for (const [subj, row] of Object.entries(summary.bySubject).sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`  ${subj.padEnd(10)} total=${String(row.total).padStart(3)}  media=${String(row.media).padStart(3)}  ws=${String(row.worksheet).padStart(3)}  game=${String(row.game).padStart(3)}  gaps=${row.gaps}`);
  }
  console.log('\nBy Archetype:');
  for (const [arch, row] of Object.entries(summary.byArchetype).sort((a, b) => b[1].total - a[1].total)) {
    console.log(`  ${arch.padEnd(16)} total=${String(row.total).padStart(3)}  media=${String(row.media).padStart(3)}  ws=${String(row.worksheet).padStart(3)}  game=${String(row.game).padStart(3)}  gaps=${row.gaps}`);
  }
  console.log('\nTop Gaps:');
  for (const [gap, count] of Object.entries(summary.gapCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${gap.padEnd(32)} ${count}`);
  }
  console.log(`\nWrote:\n  ${normalizePath(path.relative(REPO_ROOT, inventoryPath))}\n  ${normalizePath(path.relative(REPO_ROOT, summaryPath))}`);
}
