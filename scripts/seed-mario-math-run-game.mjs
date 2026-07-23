#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

// Load env
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
  console.error('✗ Missing Supabase URL or Service Role Key in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
});

async function main() {
  console.log('Seeding Mario Math Run game into database...');

  // 1. Resolve staff_id
  const { data: staffData, error: staffError } = await supabase
    .from('staff')
    .select('id')
    .ilike('name', '%ณัฐพงศ์%สิงห์ชมภู%')
    .eq('staff_type', 'teaching')
    .order('created_at', { ascending: true })
    .limit(1);

  if (staffError || !staffData || staffData.length === 0) {
    console.error('✗ Staff "ครูณัฐพงศ์ สิงห์ชมภู" not found:', staffError);
    process.exit(1);
  }
  const staffId = staffData[0].id;
  console.log(`✓ Resolved staff_id: ${staffId}`);

  // 2. Resolve category_id
  const { data: catData, error: catError } = await supabase
    .from('educational_hub_categories')
    .select('id')
    .eq('category_key', 'games')
    .limit(1);

  if (catError || !catData || catData.length === 0) {
    console.error('✗ Category "games" not found:', catError);
    process.exit(1);
  }
  const categoryId = catData[0].id;
  console.log(`✓ Resolved category_id: ${categoryId}`);

  // 3. Ensure profile is active
  const { error: profileError } = await supabase
    .from('educational_hub_profiles')
    .upsert({ staff_id: staffId, is_hub_active: true }, { onConflict: 'staff_id' });

  if (profileError) {
    console.error('✗ Profile upsert failed:', profileError);
    process.exit(1);
  }
  console.log('✓ Ensured educational_hub_profile is active');

  // 4. Seed item
  const url = '/games/math/mario-math-run/index.html';
  const { data: itemData, error: itemCheckError } = await supabase
    .from('educational_hub_items')
    .select('id')
    .eq('owner_staff_id', staffId)
    .eq('external_url', url);

  if (itemCheckError) {
    console.error('✗ Check item error:', itemCheckError);
    process.exit(1);
  }

  let itemId;
  if (!itemData || itemData.length === 0) {
    // Insert new item
    const { data: insertData, error: insertError } = await supabase
      .from('educational_hub_items')
      .insert({
        owner_staff_id: staffId,
        category_id: categoryId,
        item_type: 'link',
        title: '🍄 Mario Math Run — มาริโอ้ลุยโจทย์คณิต',
        external_url: url,
        subject: 'คณิตศาสตร์',
        sort_order: 36,
        game_slug: 'mario-math-run',
        tracked_game: true,
        is_published: true,
        thumbnail_url: '/games/math/mario-math-run/cover.png',
        bgm_preset: 'cheerful',
        game_play_style: 'platformer-2d'
      })
      .select('id');

    if (insertError) {
      console.error('✗ Item insert failed:', insertError);
      process.exit(1);
    }
    itemId = insertData[0].id;
    console.log(`✓ Inserted new item with ID: ${itemId}`);
  } else {
    // Update existing item
    itemId = itemData[0].id;
    const { error: updateError } = await supabase
      .from('educational_hub_items')
      .update({
        title: '🍄 Mario Math Run — มาริโอ้ลุยโจทย์คณิต',
        sort_order: 36,
        game_slug: 'mario-math-run',
        tracked_game: true,
        is_published: true,
        thumbnail_url: '/games/math/mario-math-run/cover.png',
        bgm_preset: 'cheerful',
        game_play_style: 'platformer-2d',
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);

    if (updateError) {
      console.error('✗ Item update failed:', updateError);
      process.exit(1);
    }
    console.log(`✓ Updated existing item with ID: ${itemId}`);
  }

  // 5. Seed game docs
  const features = [
    'เลือกหมวดคณิตศาสตร์: บวกเลข (1-20), ลบเลข (1-20), สูตรคูณ (แม่ 2-12), หารเลข (ลงตัว), ผสม',
    'ฉากไหลอัตโนมัติจากขวาไปซ้าย มีหลุมข้าม (Pits) มอนสเตอร์ (Goombas) และบล็อกลอยโหม่งเลือกตอบ',
    'โหมดเล่น 1 คน (Solo) และโหมดแข่ง 2 คนในหน้าจอเดียว (Same-Screen Race P1 vs P2)',
    'เชื่อมต่อระบบ KampaiVersus รองรับทั้งแข่ง local hot-seat และแข่งออนไลน์ต่างเครื่อง',
    'รองรับการเล่นบนมือถือ/แท็บเล็ตด้วย Touch D-Pad & Jump Button ปุ่มควบคุมแยก P1/P2',
    'โชว์ตารางอันดับ Top 5 นักเรียน, สถิติคะแนนสูงสุด และบันทึก XP เข้าพอร์ทัลอัตโนมัติ'
  ];

  const { error: docError } = await supabase
    .from('game_docs')
    .upsert({
      item_id: itemId,
      owner_staff_id: staffId,
      game_format: '2D Auto-Scrolling Platformer (Mario style) — ฉากไหลอัตโนมัติ กระโดดข้ามหลุม/หลบมอนสเตอร์ และโหม่งบล็อกคำตอบ',
      features: features,
      version: 'v1.1.0',
      notes: 'อัปเกรดเป็นระบบฉากไหลอัตโนมัติ กระโดดข้ามหลุม หลบมอนสเตอร์ และโหม่งบล็อก 4 เหลี่ยมเพื่อเลือกตอบ',
      updated_at: new Date().toISOString()
    }, { onConflict: 'item_id' });

  if (docError) {
    console.error('✗ Game docs upsert failed:', docError);
    process.exit(1);
  }
  console.log('✓ Seeded game_docs successfully');
  console.log('🌟 Seeding completed successfully!');
}

main().catch(err => {
  console.error('✗ Unexpected error:', err);
  process.exit(1);
});
