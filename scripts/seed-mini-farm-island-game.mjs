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
  console.log('Seeding Mini Farm Island game into database...');

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
  const url = '/games/math/mini-farm-island/index.html';
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
        title: '🌴 มินิฟาร์มไอส์แลนด์ (Mini Farm Island)',
        external_url: url,
        subject: 'คณิตศาสตร์',
        sort_order: 10,
        game_slug: 'mini-farm-island',
        tracked_game: true,
        is_published: true,
        thumbnail_url: '/games/math/mini-farm-island/cover.png',
        bgm_preset: 'chill'
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
        title: '🌴 มินิฟาร์มไอส์แลนด์ (Mini Farm Island)',
        sort_order: 10,
        game_slug: 'mini-farm-island',
        tracked_game: true,
        is_published: true,
        thumbnail_url: '/games/math/mini-farm-island/cover.png',
        bgm_preset: 'chill'
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
    'ระบบ 3D แบบ Isometric Island สวยงามด้วย Three.js พร้อมน้ำทะเลเคลื่อนไหว ต้นไม้ไหว และควันปล่องไฟ',
    'จำลองระบบเศรษฐกิจพื้นฐาน: ปลูก (ลงทุน 10 เหรียญ) → รอเติบโต → เก็บเกี่ยว → ขาย (ได้ 25 เหรียญ/ชิ้น)',
    'เอฟเฟกต์ Particle อลังการตอนปลูก/เก็บเกี่ยว/ขาย พร้อม Toast แจ้งเตือนสวยงาม',
    'ระบบ Progress Bar แบบ Billboard ลอยเหนือแปลงดิน แสดงความก้าวหน้าการเติบโต',
    'รองรับ KampaiVersus สำหรับแข่ง 2 คน — ใครปลูกขายได้มากกว่าในเวลาจำกัดชนะ!'
  ];

  const { error: docError } = await supabase
    .from('game_docs')
    .upsert({
      item_id: itemId,
      owner_staff_id: staffId,
      game_format: 'เกมจำลองฟาร์ม 3 มิติ (Three.js) ฝึกทักษะคิดเรื่องต้นทุน-กำไร-การบริหารเงิน สำหรับนักเรียนประถมศึกษา',
      features: features,
      version: 'v1.0.0',
      notes: 'เปิดตัวเกมฟาร์ม 3D วิชาคณิตศาสตร์ เรื่องต้นทุน-กำไร ป.4 — เป็นมิตรต่อเด็ก ดีไซน์ Glassmorphism'
    }, { onConflict: 'item_id' });

  if (docError) {
    console.error('✗ Game docs upsert failed:', docError);
    process.exit(1);
  }
  console.log('✓ Seeded game_docs successfully');
  console.log('🌴 Seeding completed successfully!');
}

main().catch(err => {
  console.error('✗ Unexpected error:', err);
  process.exit(1);
});
