#!/usr/bin/env node
/**
 * Seed กระต่าย thai-sara-run ลง game_character_sheets + ผูกเกม
 * ใช้ asset จาก public/ (อัปโหลดเข้า Storage ถ้ามี SERVICE_ROLE_KEY)
 *
 *   node scripts/seed-bunny-character.mjs
 *   node scripts/seed-bunny-character.mjs --dry-run
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const DRY = process.argv.includes('--dry-run');

const BUNNY_ID = 'f8e3a1c2-4b5d-6e7f-8a9b-0c1d2e3f4a5b';
const ANIM_CONFIG = {
  preset: 'grid-3x6-18',
  layout: 'grid',
  cols: 6,
  rows: 3,
  idle: [12, 13, 14, 15, 16, 17],
  walk: [12, 13, 14, 15, 16, 17],
  run: [0, 1, 2, 3, 4, 5],
  jump: [6, 7, 8, 9, 10, 11],
  hurt: 12,
  happy: 12,
  walkFps: 4,
  runFps: 12,
  jumpFps: 10,
  runFaces: 'left',
  anchorFoot: 0.94,
  feetPad: 14,
};

const envFile = resolve(REPO_ROOT, '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SITE = process.env.VITE_SITE_URL || 'https://kampai-school.vercel.app';

const WHITE = resolve(REPO_ROOT, 'public/games/thai/assets/thai-sara-run/bunny-white-sheet.png');
const BLUE = resolve(REPO_ROOT, 'public/games/thai/assets/thai-sara-run/bunny-blue-sheet.png');

async function main() {
  if (!existsSync(WHITE) || !existsSync(BLUE)) {
    console.error('✗ Missing bunny sheet PNGs in public/games/thai/assets/thai-sara-run/');
    process.exit(1);
  }

  let sheetUrl = `${SITE}/games/thai/assets/thai-sara-run/bunny-white-sheet.png`;
  let sheetUrlP2 = `${SITE}/games/thai/assets/thai-sara-run/bunny-blue-sheet.png`;
  let storagePath = 'git:games/thai/assets/thai-sara-run/bunny-white-sheet.png';
  let storagePathP2 = 'git:games/thai/assets/thai-sara-run/bunny-blue-sheet.png';

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.warn('⚠ No SUPABASE_SERVICE_ROLE_KEY — ใช้ URL จาก git เท่านั้น (รัน migration 267 แทนได้)');
  } else {
    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
    const base = `characters/${BUNNY_ID}`;
    const path1 = `${base}/sheet.png`;
    const path2 = `${base}/sheet-p2.png`;
    const buf1 = readFileSync(WHITE);
    const buf2 = readFileSync(BLUE);

    if (!DRY) {
      const { error: e1 } = await supabase.storage.from('educational-hub').upload(path1, buf1, {
        upsert: true,
        contentType: 'image/png',
        cacheControl: '3600',
      });
      if (e1) console.warn('⚠ Upload P1:', e1.message);
      else {
        storagePath = path1;
        sheetUrl = supabase.storage.from('educational-hub').getPublicUrl(path1).data.publicUrl;
      }

      const { error: e2 } = await supabase.storage.from('educational-hub').upload(path2, buf2, {
        upsert: true,
        contentType: 'image/png',
        cacheControl: '3600',
      });
      if (e2) console.warn('⚠ Upload P2:', e2.message);
      else {
        storagePathP2 = path2;
        sheetUrlP2 = supabase.storage.from('educational-hub').getPublicUrl(path2).data.publicUrl;
      }

      const row = {
        id: BUNNY_ID,
        title: 'กระต่าย Thai Sara Run',
        slug: 'thai-sara-run-bunny',
        sheet_url: sheetUrl,
        sheet_url_p2: sheetUrlP2,
        storage_path: storagePath,
        storage_path_p2: storagePathP2,
        frame_width: 170,
        frame_height: 227,
        frame_count: 18,
        animation_config: ANIM_CONFIG,
        notes: 'Seed จาก public/games/thai/assets/thai-sara-run/',
      };

      const { error: upErr } = await supabase.from('game_character_sheets').upsert(row, { onConflict: 'slug' });
      if (upErr) {
        console.error('✗ upsert game_character_sheets:', upErr.message);
        process.exit(1);
      }

      const assign = {
        character_sheet_id: BUNNY_ID,
        character_sheet_url: sheetUrl,
        character_sheet_url_p2: sheetUrlP2,
        character_frame_w: 170,
        character_frame_h: 227,
        character_frame_count: 18,
        character_animation_config: ANIM_CONFIG,
      };
      const { data: games, error: gErr } = await supabase
        .from('educational_hub_items')
        .update(assign)
        .eq('game_slug', 'thai-sara-run')
        .select('id, title');
      if (gErr) console.warn('⚠ assign game:', gErr.message);
      else console.log('✓ Assigned to games:', games?.length ?? 0, games?.map((g) => g.title).join(', '));
    }

    console.log(DRY ? '(dry-run)' : '✓ Done');
    console.log('  sheet_url:', sheetUrl);
    console.log('  sheet_url_p2:', sheetUrlP2);
    return;
  }

  console.log('Run migration 267 on Supabase SQL editor for DB-only seed.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
