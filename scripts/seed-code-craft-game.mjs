#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

// โหลดตัวแปรสภาพแวดล้อมจาก .env.local
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
  console.log('Seeding Code Craft game into database...');

  // 1. ดึง staff_id ครูณัฐพงศ์
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

  // 2. ดึง category_id สำหรับหมวดหมู่เกม
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

  // 3. ตรวจสอบให้มั่นใจว่าโปรไฟล์ hub เปิดใช้งานอยู่
  const { error: profileError } = await supabase
    .from('educational_hub_profiles')
    .upsert({ staff_id: staffId, is_hub_active: true }, { onConflict: 'staff_id' });

  if (profileError) {
    console.error('✗ Profile upsert failed:', profileError);
    process.exit(1);
  }
  console.log('✓ Ensured educational_hub_profile is active');

  // 4. Seed รายการเกมลงในตาราง educational_hub_items
  const url = '/games/tech/code-craft/index.html';
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
    // เพิ่มข้อมูลเกมรายการใหม่
    const { data: insertData, error: insertError } = await supabase
      .from('educational_hub_items')
      .insert({
        owner_staff_id: staffId,
        category_id: categoryId,
        item_type: 'link',
        title: '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์',
        external_url: url,
        subject: 'เทคโนโลยี',
        sort_order: 395,
        game_slug: 'code-craft',
        tracked_game: true,
        is_published: true,
        thumbnail_url: '/games/tech/code-craft/cover.png',
        bgm_preset: 'playful'
      })
      .select('id');

    if (insertError) {
      console.error('✗ Item insert failed:', insertError);
      process.exit(1);
    }
    itemId = insertData[0].id;
    console.log(`✓ Inserted new item with ID: ${itemId}`);
  } else {
    // อัปเดตข้อมูลเกมเดิม
    itemId = itemData[0].id;
    const { error: updateError } = await supabase
      .from('educational_hub_items')
      .update({
        title: '🤖 Code Craft — วิศวกรโค้ดดิ้งหุ่นยนต์',
        sort_order: 395,
        game_slug: 'code-craft',
        tracked_game: true,
        is_published: true,
        thumbnail_url: '/games/tech/code-craft/cover.png',
        bgm_preset: 'playful'
      })
      .eq('id', itemId);

    if (updateError) {
      console.error('✗ Item update failed:', updateError);
      process.exit(1);
    }
    console.log(`✓ Updated existing item with ID: ${itemId}`);
  }

  // 5. Seed รายละเอียดเพิ่มเติมลงตาราง game_docs (1:1 Relation)
  const features = [
    'เขียนบล็อกคำสั่งควบคุมการทำงานของหุ่นยนต์คัดแยกพัสดุในคลังสินค้า',
    'ศึกษาหลักการลำดับคำสั่ง (Sequence), เงื่อนไข (If-Else), และการวนลูป (Loop)',
    'ตัวประเมินคำสั่งรันทีละขั้นตอน (Step-by-step Visual Interpreter) เพื่อตรวจดีบั๊ก',
    'จำกัดโควตาบรรทัดคำสั่งในแต่ละด่านเพื่อกระตุ้นวิธีคิดเชิงขั้นตอนและการย่อโค้ด'
  ];

  const { error: docError } = await supabase
    .from('game_docs')
    .upsert({
      item_id: itemId,
      owner_staff_id: staffId,
      game_format: '2D Grid / Blockly-like Visual Command Puzzle',
      features: features,
      version: 'v1.0.0',
      notes: 'วิศวกรโค้ดดิ้งหุ่นยนต์ วิทยาการคำนวณ ป.4-6 (programmatic seed)'
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
