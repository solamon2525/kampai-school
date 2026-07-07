#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

// Load env.local for local development database keys
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
  console.log('Seeding Super Math-Blaster game into database...');

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
  const url = '/games/math/math-blaster/index.html';
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
        title: '🚀 Super Math-Blaster: Galactic Duel — ดวลเลขกู้กาแล็กซี',
        external_url: url,
        subject: 'คณิตศาสตร์',
        sort_order: 180,
        game_slug: 'math-blaster',
        tracked_game: true,
        is_published: true,
        thumbnail_url: '/games/math/math-blaster/cover.png',
        bgm_preset: 'cheerful'
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
        title: '🚀 Super Math-Blaster: Galactic Duel — ดวลเลขกู้กาแล็กซี',
        sort_order: 180,
        game_slug: 'math-blaster',
        tracked_game: true,
        is_published: true,
        thumbnail_url: '/games/math/math-blaster/cover.png',
        bgm_preset: 'cheerful'
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
    'เกมยิงสเปซชูตเตอร์คลาสสิก ดวลทำลายอุกกาบาตที่เป็นโจทย์คณิตศาสตร์',
    'เลือกเล่นได้ทั้ง 1 คน หรือ 2 คนพร้อมกันบนจอเดียว (คีย์บอร์ดเดียวกัน)',
    'ระบบสุ่มระดับความยาก (1-5) และเลือกหมวดหมู่วิชา (บวก, ลบ, คูณ, หาร, เศษส่วน, ทศนิยม หรือแบบผสม)',
    'ต่อสู้บอสใหญ่ท้าทายด้วยเกราะเลขคณิตและการยิงโต้ตอบ',
    'เชื่อมต่อกับ KampaiVersus สมบูรณ์แบบ รองรับ 3 โหมด: เล่นเดี่ยว, ผลัดตาเล่น 2 คน, และดวลออนไลน์ข้ามเครื่องผ่าน Seeded RNG (โจทย์และไอเทมตรงกันอย่างยุติธรรม)'
  ];

  const { error: docError } = await supabase
    .from('game_docs')
    .upsert({
      item_id: itemId,
      owner_staff_id: staffId,
      game_format: 'Vertical Space Shooter Canvas Game (บวก ลบ คูณ หาร เศษส่วน ทศนิยม)',
      features: features,
      version: 'v1.1.0',
      notes: 'Super Math-Blaster ดวลเลขกู้กาแล็กซี ป.3-6 (programmatic seed)'
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
