#!/usr/bin/env node
/**
 * audit-game-score-submit.mjs
 * ตรวจเกม tracked ว่าผ่านกฎเก็บคะแนน (GAME.md §กฎเก็บคะแนน) หรือไม่
 * + ดึง top N เกมจาก game_sessions (ถ้ามี service role)
 *
 * Usage: node scripts/audit-game-score-submit.mjs [--top=10]
 */
import { readFileSync, existsSync, statSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const topN = Number((process.argv.find((a) => a.startsWith('--top=')) || '--top=15').split('=')[1]) || 15;

const envFile = resolve(REPO_ROOT, '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

function collectGameScripts(src, dir) {
  let extra = '';
  for (const m of src.matchAll(/<script\b[^>]*\ssrc=["']([^"']+)["'][^>]*><\/script>/g)) {
    const s = m[1];
    if (/^https?:/.test(s) || /^\/\//.test(s) || /^\//.test(s)) continue;
    const p = join(dir, s);
    if (existsSync(p)) {
      try { extra += `\n/* ${s} */\n` + readFileSync(p, 'utf8'); } catch { /* */ }
    }
  }
  return extra ? src + extra : src;
}

function resolveGameFile(externalUrl) {
  if (!externalUrl) return null;
  const m = externalUrl.match(/^\/games\/(.+)$/);
  if (!m) return null;
  const rel = m[1];
  const direct = resolve(REPO_ROOT, 'public/games', rel);
  if (existsSync(direct) && statSync(direct).isFile()) return direct;
  const folder = join(dirname(direct), basename(direct, '.html'), 'index.html');
  if (existsSync(folder)) return folder;
  const idx = join(dirname(direct), 'index.html');
  if (existsSync(idx)) return idx;
  return direct;
}

function auditSource(src, filePath) {
  const usesSdk = /kampai-sdk\.js/.test(src) || /KAMPAI\s*\.\s*(submitScore|setSlug)/.test(src);
  const hasSubmit = usesSdk
    ? /KAMPAI\s*\.\s*submitScore\s*\(/.test(src)
    : /sendGameEnd\s*\(/.test(src);
  const hasSetSlug = /setSlug\s*\(\s*['"][^'"]+['"]/.test(src)
    || /setSlug\s*\(\s*[A-Za-z_$][\w.$]*\s*\)/.test(src)
    || /const\s+GAME_SLUG\s*=\s*['"][^'"]+['"]/.test(src);
  const hasGameStart = /type\s*:\s*['"]gameStart['"]/.test(src)
    || /type:\s*'gameStart'/.test(src);
  const resetsSubmitted = /_submitted\s*=\s*false/.test(src);
  const hasPracticeBlock = /practice/.test(src) && (
    /if\s*\(\s*this\.state\.practice\s*\)/.test(src)
    || /if\s*\(\s*.*practice.*\)\s*\{[^}]*ไม่ส่ง/.test(src)
    || /practice mode.*not submitted/i.test(src)
    || (/practice/.test(src) && /submitScore/.test(src) && /practice/.test(src.split('submitScore')[0]))
  );
  const hidesPracticeEmbed = /embed-mode.*practice|btn-practice.*display:\s*none/.test(src.replace(/\s+/g, ' '));
  const allowResubmit = /allowResubmit\s*:\s*true/.test(src);

  const issues = [];
  if (!hasSubmit) issues.push('no_submit');
  if (usesSdk && !hasSetSlug) issues.push('no_setSlug');
  if (hasSubmit && !hasGameStart && !resetsSubmitted && !allowResubmit) issues.push('no_gameStart_replay');
  if (/practice/.test(src) && hasSubmit && !hidesPracticeEmbed && !hasPracticeBlock) {
    issues.push('practice_risk');
  }
  if (/practice/.test(src) && hasSubmit && hasPracticeBlock && !hidesPracticeEmbed) {
    issues.push('practice_visible_embed');
  }

  return {
    filePath,
    usesSdk,
    hasSubmit,
    hasSetSlug,
    hasGameStart,
    resetsSubmitted,
    allowResubmit,
    hasPracticeBlock,
    hidesPracticeEmbed,
    issues,
    risk: issues.filter((i) => i !== 'practice_risk').length > 0 ? 'high' : issues.length > 0 ? 'medium' : 'ok',
  };
}

function auditFile(filePath) {
  if (!filePath || !existsSync(filePath)) return { filePath, issues: ['file_missing'], risk: 'high' };
  const html = readFileSync(filePath, 'utf8');
  const dir = dirname(filePath);
  const src = collectGameScripts(html, dir);
  return auditSource(src, filePath);
}

async function main() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Need VITE_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }
  const admin = createClient(url, key, { auth: { persistSession: false } });

  const { data: items, error: itemsErr } = await admin
    .from('educational_hub_items')
    .select('game_slug, title, external_url, tracked_game, is_published')
    .eq('tracked_game', true)
    .not('game_slug', 'is', null);
  if (itemsErr) throw itemsErr;

  const since = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: sessions, error: sessErr } = await admin
    .from('game_sessions')
    .select('game_slug')
    .gte('created_at', since);
  if (sessErr) throw sessErr;

  const playCounts = new Map();
  for (const s of sessions ?? []) {
    playCounts.set(s.game_slug, (playCounts.get(s.game_slug) || 0) + 1);
  }
  const topSlugs = [...playCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([slug, count]) => ({ slug, count }));

  const slugToItem = new Map((items ?? []).map((i) => [i.game_slug, i]));
  const allAudits = new Map();

  for (const item of items ?? []) {
    const fp = resolveGameFile(item.external_url);
    allAudits.set(item.game_slug, { ...auditFile(fp), title: item.title, slug: item.game_slug });
  }

  console.log(`\n=== Top ${topN} games by sessions (last 90 days) ===\n`);
  const topResults = [];
  for (const { slug, count } of topSlugs) {
    const a = allAudits.get(slug) || { issues: ['not_tracked_or_missing'], risk: 'high', title: slug };
    const item = slugToItem.get(slug);
    topResults.push({ slug, count, title: item?.title ?? slug, ...a });
    const flag = a.risk === 'ok' ? 'OK' : a.risk === 'medium' ? 'MED' : 'HIGH';
    console.log(`${flag.padEnd(4)} ${String(count).padStart(5)}x  ${slug}`);
    console.log(`       ${(a.issues || []).join(', ') || 'pass'}`);
  }

  const broken = [...allAudits.values()].filter((a) => a.risk === 'high');
  const medium = [...allAudits.values()].filter((a) => a.risk === 'medium');

  console.log(`\n=== Summary (${items?.length ?? 0} tracked games) ===`);
  console.log(`OK: ${[...allAudits.values()].filter((a) => a.risk === 'ok').length}`);
  console.log(`Medium risk: ${medium.length}`);
  console.log(`High risk: ${broken.length}`);

  console.log('\n=== High risk slugs (all tracked) ===');
  for (const a of broken.sort((x, y) => (playCounts.get(y.slug) || 0) - (playCounts.get(x.slug) || 0))) {
    console.log(`  ${a.slug}: ${a.issues.join(', ')}`);
  }

  const issueBreakdown = {};
  for (const a of allAudits.values()) {
    for (const i of a.issues || []) issueBreakdown[i] = (issueBreakdown[i] || 0) + 1;
  }
  console.log('\n=== Issue breakdown ===');
  for (const [k, v] of Object.entries(issueBreakdown).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`);
  }

  // JSON for agent
  const outPath = resolve(REPO_ROOT, 'scripts/.audit-score-submit.json');
  try {
    writeFileSync(outPath, JSON.stringify({ topResults, issueBreakdown, generatedAt: new Date().toISOString() }, null, 2));
  } catch { /* optional */ }
}

main().catch((e) => { console.error(e); process.exit(1); });
