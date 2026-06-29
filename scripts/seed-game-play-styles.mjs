#!/usr/bin/env node
/**
 * seed-game-play-styles.mjs — ตั้ง game_play_style ให้ทุกเกม + ผูกกระต่าย thai-sara-run
 * ใช้: node scripts/seed-game-play-styles.mjs [--dry-run]
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');

const envFile = resolve(REPO_ROOT, '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const SLUG_STYLE = {
  'thai-sara-run': 'platformer-2d', 'math-runner': 'platformer-2d', 'farm-adventure': 'platformer-2d',
  'fraction-adventure': 'platformer-2d', 'kingdom': 'platformer-2d', 'weight-adventure': 'platformer-2d',
  'fishing': 'platformer-2d', 'fishing-2': 'platformer-2d', 'multiplication-kingdom': 'platformer-2d',
  'measure-up': 'platformer-2d', 'jump-even-odd': 'platformer-2d', 'attack-noun': 'platformer-2d',
  'attack-on-noun': 'platformer-2d', 'waipot': 'platformer-2d', 'wipod': 'platformer-2d',
  'sonnum': 'platformer-2d', 'attnoun': 'platformer-2d', 'ppp': 'platformer-2d', 'tug-of-war': 'platformer-2d',
  'thai-vocab-arena': 'platformer-2d', 'genetic-quest': 'platformer-2d', 'probability-zoo-board': 'platformer-2d',
  'catch-numbers': 'platformer-2d', 'reading-quest': 'platformer-2d', 'english-quest': 'platformer-2d',
  'reading-game': 'platformer-2d', 'thai-story': 'platformer-2d', 'pizza-master-chef': 'platformer-2d',
  'thai-edu-rpg': 'top-down', 'battle-city': 'top-down', 'tank-commander': 'top-down', 'robot-path': 'top-down',
  'veggie-garden': 'top-down', 'cyberdrop': 'top-down', 'vocab-move': 'top-down', 'food-chain': 'top-down',
  'good-citizen': 'top-down', 'debug-it': 'top-down',
  'flappy-bird': 'jump', 'math-jumper': 'jump', 'balloon-fighter': 'jump',
  'nitro-arena': 'racing', 'math-racer': 'racing', 'math-rally': 'racing', 'multiply-race': 'racing',
  'multiply-rally': 'racing', 'vocab-race': 'racing', 'thai-spelling-moto': 'racing',
  'math-blaster': 'shooter', 'math-tank-raid': 'shooter', 'energy-rocket': 'shooter', 'word-shield': 'shooter',
  'block-3d': 'sandbox-3d', 'room-3d': 'sandbox-3d', 'solid-3d': 'sandbox-3d', 'net-3d': 'sandbox-3d',
  'coord-3d': 'sandbox-3d', 'globe-3d': 'sandbox-3d', 'snake-3d': 'sandbox-3d', 'blocky-safari': 'sandbox-3d',
  'ai-hand-gesture-game': 'puzzle', 'ar-zone-quiz': 'puzzle', 'binary-bits': 'puzzle', 'cashier': 'puzzle',
  'circuit-builder': 'puzzle', 'coin-exchange': 'puzzle', 'color-mix': 'puzzle', 'color-wheel': 'puzzle',
  'detective': 'puzzle', 'digestive-ar': 'puzzle', 'english-ar-quiz': 'puzzle', 'fraction-garden-ar': 'puzzle',
  'hands-up-quiz': 'puzzle', 'handwash-order': 'puzzle', 'line-trace': 'puzzle', 'listen-spell': 'puzzle',
  'logic-gates': 'puzzle', 'math-24': 'puzzle', 'math-hand-raising': 'puzzle', 'math-han': 'puzzle',
  'math-move-quiz': 'puzzle', 'math-pizza': 'puzzle', 'pizza': 'puzzle', 'number-line': 'puzzle',
  'online-safety': 'puzzle', 'order-it': 'puzzle', 'phonics-pop': 'puzzle', 'plate-builder': 'puzzle',
  'rhythm-master': 'puzzle', 'rounding': 'puzzle', 'sci-sort': 'puzzle', 'sentence-builder': 'puzzle',
  'sentence-craft': 'puzzle', 'sink-float': 'puzzle', 'social-quiz': 'puzzle', 'spelling': 'puzzle',
  'symmetry-art': 'puzzle', 'thai-instruments': 'puzzle', 'thai-spelling': 'puzzle', 'thai-vocab-hub': 'puzzle',
  'typing': 'puzzle', 'tech-typing': 'puzzle', 'blockly': 'puzzle', 'tech-blockly': 'puzzle',
  'vocab-hub': 'puzzle', 'waste-sort': 'puzzle', 'wizard-thai': 'puzzle',
};

const TITLE_HINTS = [
  [/3d|voxel|block|sandbox/i, 'sandbox-3d'],
  [/racer|racing|moto|rally|แข่ง|รถ/i, 'racing'],
  [/blaster|shooter|rocket|tank|raid|ยิง/i, 'shooter'],
  [/flappy|jumper|jump|กระโดด/i, 'jump'],
  [/runner|platform|วิ่ง|sara-run|adventure|kingdom/i, 'platformer-2d'],
  [/rpg|top-down|battle-city|robot-path|tank-commander/i, 'top-down'],
];

function slugFromUrl(url) {
  if (!url) return null;
  const m = url.match(/\/games\/[^/]+\/([^/?#]+)\.html/i)
    || url.match(/\/edu-hub-games\/[^/]+\/([^/?#]+)\.html/i);
  return m ? m[1].toLowerCase() : null;
}

function resolveStyle(item) {
  const slug = (item.game_slug || slugFromUrl(item.external_url) || '').toLowerCase();
  if (slug && SLUG_STYLE[slug]) return SLUG_STYLE[slug];
  for (const [re, style] of TITLE_HINTS) {
    if (re.test(item.title || '')) return style;
  }
  return 'puzzle';
}

const BUNNY_ID = 'f8e3a1c2-4b5d-6e7f-8a9b-0c1d2e3f4a5b';
const BUNNY_ANIM = {
  preset: 'grid-3x6-18', layout: 'grid', cols: 6, rows: 3,
  idle: [12, 13, 14, 15, 16, 17], walk: [12, 13, 14, 15, 16, 17],
  run: [0, 1, 2, 3, 4, 5], jump: [6, 7, 8, 9, 10, 11],
  hurt: 12, happy: 12, walkFps: 4, runFps: 12, jumpFps: 10,
  runFaces: 'left', anchorFoot: 0.94, feetPad: 14,
};

async function seedBunny() {
  const row = {
    id: BUNNY_ID,
    title: 'กระต่าย Thai Sara Run',
    slug: 'thai-sara-run-bunny',
    sheet_url: 'https://kampai-school.vercel.app/games/thai/assets/thai-sara-run/bunny-white-sheet.png',
    sheet_url_p2: 'https://kampai-school.vercel.app/games/thai/assets/thai-sara-run/bunny-blue-sheet.png',
    storage_path: 'git:games/thai/assets/thai-sara-run/bunny-white-sheet.png',
    storage_path_p2: 'git:games/thai/assets/thai-sara-run/bunny-blue-sheet.png',
    frame_width: 170, frame_height: 227, frame_count: 18,
    animation_config: BUNNY_ANIM,
    notes: 'Seed จาก git',
  };
  if (dryRun) {
    console.log('  [dry-run] upsert bunny + link thai-sara-run');
    return;
  }
  const { error } = await admin.from('game_character_sheets').upsert(row, { onConflict: 'slug' });
  if (error) throw new Error(`bunny: ${error.message}`);

  const { error: linkErr } = await admin.from('educational_hub_items').update({
    character_sheet_id: BUNNY_ID,
    character_sheet_url: row.sheet_url,
    character_sheet_url_p2: row.sheet_url_p2,
    character_frame_w: 170,
    character_frame_h: 227,
    character_frame_count: 18,
    character_animation_config: BUNNY_ANIM,
    game_play_style: 'platformer-2d',
  }).eq('game_slug', 'thai-sara-run');
  if (linkErr) throw new Error(`link: ${linkErr.message}`);
  console.log('bunny seed + thai-sara-run linked');
}

async function main() {
  console.log(`\nSeed game_play_style${dryRun ? ' (dry-run)' : ''}\n`);

  const { data: games, error } = await admin
    .from('educational_hub_items')
    .select('id, title, game_slug, external_url, game_play_style')
    .eq('item_type', 'link')
    .or('external_url.like.%/edu-hub-games/%,external_url.like.%/games/%');
  if (error) throw error;

  const counts = {};
  let updated = 0;
  let skipped = 0;

  for (const g of games ?? []) {
    const style = resolveStyle(g);
    counts[style] = (counts[style] ?? 0) + 1;
    if (g.game_play_style === style) {
      skipped++;
      continue;
    }
    if (!dryRun) {
      const { error: upErr } = await admin.from('educational_hub_items').update({ game_play_style: style }).eq('id', g.id);
      if (upErr) console.error(`FAIL ${g.title}: ${upErr.message}`);
      else updated++;
    } else {
      console.log(`  ${g.game_slug || slugFromUrl(g.external_url) || '?'} -> ${style}`);
      updated++;
    }
  }

  console.log('\nBy style:');
  for (const [k, v] of Object.entries(counts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${k}: ${v}`);
  }
  console.log(`\nUpdated ${updated}, skipped ${skipped}, total ${games?.length ?? 0}\n`);

  await seedBunny();
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
