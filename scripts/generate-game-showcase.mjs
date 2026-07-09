#!/usr/bin/env node
/**
 * generate-game-showcase.mjs
 * สร้าง public/catalog/showcase-data.json จาก migrations + ไฟล์ cover บน disk
 * ใช้กับ public/catalog/game-showcase.html (หน้านำเสนอสไลด์)
 */
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { resolve, dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const migDir = join(root, 'supabase/migrations');
const gamesDir = join(root, 'public/games');
const outJson = join(root, 'public/catalog/showcase-data.json');

const SUBJECT_ORDER = [
  'คณิตศาสตร์',
  'ภาษาไทย',
  'วิทยาศาสตร์',
  'สังคมศึกษา',
  'สุขศึกษาและพลศึกษา',
  'ศิลปะ',
  'การงานอาชีพ',
  'ภาษาอังกฤษ',
  'วิทยาศาสตร์และเทคโนโลยี',
];

const SUBJECT_SHORT = {
  'คณิตศาสตร์': 'คณิต',
  'ภาษาไทย': 'ไทย',
  'วิทยาศาสตร์': 'วิทย์',
  'วิทยาศาสตร์และเทคโนโลยี': 'วิทย์/เทค',
  'สังคมศึกษา': 'สังคม',
  'สังคมศึกษา ศาสนา และวัฒนธรรม': 'สังคม',
  'สุขศึกษาและพลศึกษา': 'สุขศึกษา',
  'ศิลปะ': 'ศิลปะ',
  'การงานอาชีพ': 'การงาน',
  'ภาษาอังกฤษ': 'อังกฤษ',
};

const SUBJECT_COLOR = {
  'คณิตศาสตร์': '#1e40af',
  'ภาษาไทย': '#b91c1c',
  'วิทยาศาสตร์': '#047857',
  'วิทยาศาสตร์และเทคโนโลยี': '#0f766e',
  'สังคมศึกษา': '#7c3aed',
  'สังคมศึกษา ศาสนา และวัฒนธรรม': '#7c3aed',
  'สุขศึกษาและพลศึกษา': '#c2410c',
  'ศิลปะ': '#db2777',
  'การงานอาชีพ': '#a16207',
  'ภาษาอังกฤษ': '#0369a1',
};

/** @type {Map<string, object>} */
const items = new Map();

/** @type {Map<string, Set<string>>} url -> indicator codes */
const urlIndicators = new Map();
/** @type {Map<string, Set<string>>} slug -> indicator codes */
const slugIndicators = new Map();

function stripEmoji(s) {
  return s.replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}\s]+/u, '').trim();
}

function parseGrades(arrStr) {
  const m = arrStr?.match(/ARRAY\[([^\]]*)\]/);
  if (!m) return [];
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

function addItem(key, row) {
  const existing = items.get(key);
  if (!existing) {
    items.set(key, row);
    return;
  }
  // merge: keep richer data
  items.set(key, {
    ...existing,
    ...row,
    title: row.title || existing.title,
    description: row.description || existing.description,
    thumbnail: row.thumbnail || existing.thumbnail,
    grades: row.grades?.length ? row.grades : existing.grades,
    tracked: row.tracked ?? existing.tracked,
    gameSlug: row.gameSlug || existing.gameSlug,
  });
}

// ── 1. Parse educational_hub_items from migrations ──
const migFiles = readdirSync(migDir).filter((f) => f.endsWith('.sql'));
for (const file of migFiles) {
  const sql = readFileSync(join(migDir, file), 'utf8');

  // Pattern: SELECT ... 'title', 'desc', '/games/url', '/thumb', 'subject', ARRAY[...], sort, tracked, published
  const blockRe =
    /SELECT\s+v_staff_id,\s*v_cat_\w+,\s*'link',\s*\n\s*'([^']*)',\s*\n\s*'([^']*)',\s*\n\s*'(\/games\/[^']+)',\s*\n\s*'([^']*)',\s*\n\s*'([^']*)',\s*\n\s*(ARRAY\[[^\]]*\])/g;
  let m;
  while ((m = blockRe.exec(sql))) {
    const [, title, description, externalUrl, thumbnail, subject, gradesArr] = m;
    const grades = parseGrades(gradesArr);
    const trackedMatch = sql.slice(m.index, m.index + 600).match(/,\s*(\d+),\s*(true|false),\s*(true|false)/);
    const tracked = trackedMatch ? trackedMatch[2] === 'true' : false;
    addItem(externalUrl, {
      title: stripEmoji(title),
      description,
      externalUrl,
      thumbnail,
      subject,
      grades,
      tracked,
      type: tracked ? 'game' : 'media',
      source: file,
    });
  }

  // game_slug updates: SET game_slug = 'slug' WHERE external_url = '/games/...'
  const slugRe = /SET\s+game_slug\s*=\s*'([^']+)'[^;]*external_url\s*=\s*'(\/games\/[^']+)'/g;
  while ((m = slugRe.exec(sql))) {
    const row = items.get(m[2]);
    if (row) row.gameSlug = m[1];
    else addItem(m[2], { externalUrl: m[2], gameSlug: m[1], title: m[1], subject: 'อื่นๆ', grades: [], type: 'game' });
  }

  // INSERT with game_slug inline (older pattern)
  const inlineSlugRe =
    /'(\/games\/[^']+)',\s*\n\s*'([^']*)',\s*\n\s*'([^']*)',\s*\n\s*'([^']*)',\s*\n\s*(ARRAY\[[^\]]*\]),\s*\n\s*[^,]+,\s*\n\s*'([^']+)'/g;
}

// Parse indicator_games mappings
for (const file of migFiles) {
  const sql = readFileSync(join(migDir, file), 'utf8');
  const mapRe = /\('([^']+)',\s*'([^']+ ป\.\d+\/\d+)'\)/g;
  let m;
  while ((m = mapRe.exec(sql))) {
    const key = m[1];
    const code = m[2];
    if (key.startsWith('/games/')) {
      if (!urlIndicators.has(key)) urlIndicators.set(key, new Set());
      urlIndicators.get(key).add(code);
    } else {
      if (!slugIndicators.has(key)) slugIndicators.set(key, new Set());
      slugIndicators.get(key).add(code);
    }
  }
}

// ── 2. Scan hub folders with config.js ──
const SUBJECT_FOLDERS = ['thai', 'math', 'science', 'tech', 'social', 'health', 'arts', 'career', 'english'];
const FOLDER_SUBJECT = {
  thai: 'ภาษาไทย',
  math: 'คณิตศาสตร์',
  science: 'วิทยาศาสตร์',
  tech: 'วิทยาศาสตร์และเทคโนโลยี',
  social: 'สังคมศึกษา ศาสนา และวัฒนธรรม',
  health: 'สุขศึกษาและพลศึกษา',
  arts: 'ศิลปะ',
  career: 'การงานอาชีพ',
  english: 'ภาษาอังกฤษ',
};

for (const folder of SUBJECT_FOLDERS) {
  const base = join(gamesDir, folder);
  if (!existsSync(base)) continue;
  for (const name of readdirSync(base)) {
    if (name.startsWith('_') || name.startsWith('.')) continue;
    const full = join(base, name);
    if (!statSync(full).isDirectory()) continue;
    const configPath = join(full, 'config.js');
    const indexPath = join(full, 'index.html');
    if (!existsSync(indexPath)) continue;
    const externalUrl = `/games/${folder}/${name}/index.html`;
    let title = name;
    let slug = name;
    if (existsSync(configPath)) {
      const cfg = readFileSync(configPath, 'utf8');
      title = cfg.match(/TITLE:\s*'([^']+)'/)?.[1] || title;
      slug = cfg.match(/SLUG:\s*'([^']+)'/)?.[1] || slug;
    }
    const coverA = `/games/${folder}/${name}/cover.png`;
    const coverB = `/games/${folder}/${name}-cover.png`;
    const thumbnail = existsSync(join(root, 'public', coverA.slice(1)))
      ? coverA
      : existsSync(join(root, 'public', coverB.slice(1)))
        ? coverB
        : '';
    addItem(externalUrl, {
      title,
      externalUrl,
      thumbnail,
      subject: FOLDER_SUBJECT[folder],
      grades: ['ป.4', 'ป.5'],
      tracked: name.includes('hub') ? false : true,
      type: name.includes('hub') ? 'hub' : 'game',
      gameSlug: slug,
      source: 'filesystem',
    });
  }
}

// ── 3. Resolve indicators + covers + play URLs ──
function resolveCover(row) {
  if (row.thumbnail && existsSync(join(root, 'public', row.thumbnail.replace(/\?.*$/, '').slice(1)))) {
    return row.thumbnail.replace(/\?.*$/, '');
  }
  const url = row.externalUrl || '';
  const base = url.replace(/\/index\.html$/, '').replace(/\.html$/, '');
  const candidates = [
    `${base}/cover.png`,
    `${base}-cover.png`,
    url.replace(/\.html$/, '-cover.png'),
    url.replace(/\/index\.html$/, '/cover.png'),
  ];
  for (const c of candidates) {
    if (existsSync(join(root, 'public', c.slice(1)))) return c;
  }
  return '';
}

function resolveIndicators(row) {
  const codes = new Set();
  if (row.externalUrl && urlIndicators.has(row.externalUrl)) {
    urlIndicators.get(row.externalUrl).forEach((c) => codes.add(c));
  }
  if (row.gameSlug && slugIndicators.has(row.gameSlug)) {
    slugIndicators.get(row.gameSlug).forEach((c) => codes.add(c));
  }
  return [...codes].sort();
}

const all = [...items.values()]
  .map((row) => {
    const indicators = resolveIndicators(row);
    const p4Indicators = indicators.filter((c) => c.includes('ป.4'));
    const thumbnail = resolveCover(row);
    const playUrl = row.gameSlug && row.tracked !== false
      ? `/play/${row.gameSlug}`
      : row.externalUrl;
    return {
      title: row.title || row.gameSlug || 'ไม่ระบุชื่อ',
      description: (row.description || '').slice(0, 120),
      subject: row.subject || 'อื่นๆ',
      subjectShort: SUBJECT_SHORT[row.subject] || row.subject,
      subjectColor: SUBJECT_COLOR[row.subject] || '#475569',
      grades: row.grades || [],
      type: row.type || (row.tracked ? 'game' : 'media'),
      thumbnail,
      externalUrl: row.externalUrl,
      playUrl,
      gameSlug: row.gameSlug || null,
      indicators,
      p4Indicators,
      hasP4: (row.grades || []).includes('ป.4') || p4Indicators.length > 0,
    };
  })
  .filter((r) => r.externalUrl && (r.thumbnail || r.title))
  .sort((a, b) => {
    const si = SUBJECT_ORDER.indexOf(a.subject) - SUBJECT_ORDER.indexOf(b.subject);
    if (si !== 0) return si;
    return a.title.localeCompare(b.title, 'th');
  });

// Focus set: ป.4 relevant + hubs
const showcase = all.filter(
  (r) => r.hasP4 || r.type === 'hub' || r.grades.some((g) => ['ป.3', 'ป.4', 'ป.5'].includes(g)),
);

const bySubject = {};
for (const item of showcase) {
  const key = item.subject;
  if (!bySubject[key]) bySubject[key] = [];
  bySubject[key].push(item);
}

const payload = {
  generatedAt: new Date().toISOString(),
  totalAll: all.length,
  totalShowcase: showcase.length,
  totalWithCover: showcase.filter((r) => r.thumbnail).length,
  totalWithIndicators: showcase.filter((r) => r.indicators.length).length,
  subjects: Object.keys(bySubject).sort(
    (a, b) => SUBJECT_ORDER.indexOf(a) - SUBJECT_ORDER.indexOf(b),
  ),
  bySubject,
  items: showcase,
};

writeFileSync(outJson, JSON.stringify(payload, null, 2), 'utf8');
console.log(`✅ showcase-data.json — ${showcase.length} รายการ (${payload.totalWithCover} มีปก, ${payload.totalWithIndicators} มีตัวชี้วัด)`);
console.log(`   → ${relative(root, outJson)}`);
