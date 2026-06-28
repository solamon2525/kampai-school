#!/usr/bin/env node
/**
 * ตั้ง preset กระต่ายฟ้า บน thai-sara-run-bunny + sync ลงเกม
 * ต้องรัน migration 269 ก่อน (scripts/apply-migration-269-only.sql)
 *
 *   node scripts/seed-bunny-color-preset.mjs
 *   node scripts/seed-bunny-color-preset.mjs --dry-run
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const DRY = process.argv.includes('--dry-run');

const BUNNY_SLUG = 'thai-sara-run-bunny';
const COLOR_CONFIG = {
  version: 1,
  mode: 'palette',
  preset: 'bunny-blue',
  slots: [
    { id: 'slot-0', label: 'ตัว', source: { r: 245, g: 240, b: 230 }, target: '#bae6fd', tolerance: 22, enabled: true },
    { id: 'slot-1', label: 'เงา', source: { r: 180, g: 160, b: 140 }, target: '#3b82f6', tolerance: 28, enabled: true },
    { id: 'slot-2', label: 'หู', source: { r: 255, g: 180, b: 200 }, target: '#93c5fd', tolerance: 24, enabled: true },
    { id: 'slot-3', label: 'ขอบ', source: { r: 60, g: 40, b: 30 }, target: '#1e3a8a', tolerance: 20, enabled: true },
  ],
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

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('✗ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function main() {
  console.log(DRY ? '\n🔍 dry-run seed bunny-blue color preset\n' : '\n🎨 seed bunny-blue color preset\n');

  const { data: sheet, error: findErr } = await admin
    .from('game_character_sheets')
    .select('id, title, slug')
    .eq('slug', BUNNY_SLUG)
    .maybeSingle();

  if (findErr?.message?.includes('color_config')) {
    console.error('✗ คอลัมน์ color_config ยังไม่มี — รัน scripts/apply-migration-269-only.sql ก่อน');
    process.exit(1);
  }
  if (findErr || !sheet?.id) {
    console.error('✗ ไม่พบ', BUNNY_SLUG, findErr?.message ?? '');
    process.exit(1);
  }

  console.log(`   sheet: ${sheet.title} (${sheet.id})`);

  if (DRY) {
    console.log('   color_config:', JSON.stringify(COLOR_CONFIG, null, 2));
    return;
  }

  const { error: upErr } = await admin
    .from('game_character_sheets')
    .update({ color_config: COLOR_CONFIG })
    .eq('id', sheet.id);

  if (upErr) {
    console.error('✗ update sheet:', upErr.message);
    process.exit(1);
  }

  const { error: syncErr } = await admin
    .from('educational_hub_items')
    .update({ character_color_config: COLOR_CONFIG })
    .eq('character_sheet_id', sheet.id);

  if (syncErr) {
    console.error('✗ sync items:', syncErr.message);
    process.exit(1);
  }

  console.log('✅ ตั้ง preset กระต่ายฟ้า + sync เกมที่ผูกแล้ว');
  console.log('   ทดสอบ: admin → คลังตัวละคร → แก้ไขกระต่าย → preview P1 ควรเป็นสีฟ้า\n');
}

main().catch((e) => {
  console.error('✗', e.message);
  process.exit(1);
});
