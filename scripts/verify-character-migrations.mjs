#!/usr/bin/env node
/** ตรวจ migration 263–266 บน Supabase remote — ไม่พิมพ์ secret */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

const envFile = resolve(REPO_ROOT, '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('✗ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = ANON_KEY
  ? createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } })
  : null;

const PASS = '✅';
const FAIL = '❌';

function report(name, ok, detail = '') {
  console.log(`${ok ? PASS : FAIL} ${name}${detail ? ` — ${detail}` : ''}`);
  return ok;
}

async function main() {
  console.log('\n🔍 Verify character sheet migrations (263–266)\n');

  let allOk = true;

  // 263: table exists
  const { error: tableErr, count } = await admin
    .from('game_character_sheets')
    .select('id', { count: 'exact', head: true });
  allOk = report(
    '263 — ตาราง game_character_sheets',
    !tableErr,
    tableErr ? tableErr.message : `มีอยู่ (rows: ${count ?? 0})`,
  ) && allOk;

  // 263: columns on educational_hub_items
  const { data: saraItem, error: itemErr } = await admin
    .from('educational_hub_items')
    .select(
      'id, game_slug, character_sheet_id, character_sheet_url, character_sheet_url_p2, character_frame_w, character_frame_h, character_frame_count, character_animation_config',
    )
    .eq('game_slug', 'thai-sara-run')
    .maybeSingle();

  if (itemErr?.message?.includes('character_sheet')) {
    allOk = report('263 — คอลัมน์ character_* บน educational_hub_items', false, itemErr.message) && allOk;
  } else {
    allOk = report(
      '263 — คอลัมน์ character_* บน educational_hub_items',
      !itemErr,
      itemErr ? itemErr.message : 'OK',
    ) && allOk;
    if (saraItem) {
      const assigned = Boolean(saraItem.character_sheet_url);
      console.log(`   thai-sara-run: character_sheet_id=${saraItem.character_sheet_id ?? 'null'}, assigned=${assigned}`);
      if (assigned) {
        console.log(`   URL P1: ${saraItem.character_sheet_url?.slice(0, 80)}…`);
        if (saraItem.character_frame_w) {
          console.log(`   frames: ${saraItem.character_frame_w}×${saraItem.character_frame_h} × ${saraItem.character_frame_count}`);
        }
      }
    } else {
      console.log('   ⚠ ไม่พบเกม game_slug=thai-sara-run');
    }
  }

  // 265: animation_config column
  const { error: animColErr } = await admin
    .from('game_character_sheets')
    .select('animation_config')
    .limit(0);
  allOk = report(
    '265 — animation_config บน game_character_sheets + items',
    !animColErr && !itemErr?.message?.includes('character_animation_config'),
    animColErr ? animColErr.message : itemErr?.message?.includes('character_animation_config') ? itemErr.message : 'OK',
  ) && allOk;

  // game_docs (264 หรือ 266)
  if (saraItem?.id) {
    const { data: doc, error: docErr } = await admin
      .from('game_docs')
      .select('version, notes, game_format')
      .eq('item_id', saraItem.id)
      .maybeSingle();

    const docOk = !docErr && (doc?.version === 'v1.2.0' || doc?.version === 'v1.1.0');
    allOk = report(
      'game_docs thai-sara-run',
      docOk,
      docErr ? docErr.message : doc ? `version=${doc.version}` : 'ไม่มีแถว game_docs',
    ) && allOk;
    if (doc?.notes) console.log(`   notes: ${doc.notes.slice(0, 70)}…`);
  } else {
    allOk = report('game_docs thai-sara-run', false, 'ข้าม — ไม่มี item') && allOk;
  }

  // RLS: anon อ่าน library ไม่ได้
  if (anon) {
    const { data: anonRows, error: anonErr } = await anon.from('game_character_sheets').select('id').limit(1);
    allOk = report(
      'RLS — anon อ่าน game_character_sheets ไม่ได้',
      !anonErr && (anonRows?.length ?? 0) === 0,
      anonErr ? anonErr.message : `rows=${anonRows?.length ?? 0}`,
    ) && allOk;
  }

  // anon อ่าน character URL ผ่าน published item ได้ (ถ้ามี assignment)
  if (anon && saraItem?.character_sheet_url) {
    const { data: pubItem, error: pubErr } = await anon
      .from('educational_hub_items')
      .select('character_sheet_url')
      .eq('game_slug', 'thai-sara-run')
      .maybeSingle();
    allOk = report(
      'Runtime — anon อ่าน character_sheet_url จาก item',
      !pubErr && Boolean(pubItem?.character_sheet_url),
      pubErr ? pubErr.message : pubItem?.character_sheet_url ? 'OK' : 'null',
    ) && allOk;
  }

  console.log(allOk ? '\n✨ Migration 263–266 ผ่านทุก check\n' : '\n⚠ มี check ที่ยังไม่ผ่าน — ดูด้านบน\n');
  process.exit(allOk ? 0 : 1);
}

main().catch((e) => {
  console.error('✗', e.message);
  process.exit(1);
});
