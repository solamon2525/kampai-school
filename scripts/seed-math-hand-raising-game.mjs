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
  console.log('Seeding Math Hand Raising game into database...');

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
  const oldUrl = '/games/math/math-hand-raising.html';
  const newUrl = '/games/math/math-hand-raising/index.html';
  const coverUrl = '/games/math/math-hand-raising/cover.png';

  // Check if old item exists
  const { data: oldItemData } = await supabase
    .from('educational_hub_items')
    .select('id')
    .eq('owner_staff_id', staffId)
    .eq('external_url', oldUrl);

  let itemId;
  if (oldItemData && oldItemData.length > 0) {
    itemId = oldItemData[0].id;
    console.log(`✓ Found existing item under old url (id: ${itemId}), updating to new url...`);
    const { error: updateUrlError } = await supabase
      .from('educational_hub_items')
      .update({
        external_url: newUrl,
        thumbnail_url: coverUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', itemId);

    if (updateUrlError) {
      console.error('✗ Failed to update item URL:', updateUrlError);
      process.exit(1);
    }
  } else {
    // Check if new item already exists
    const { data: newItemData, error: itemCheckError } = await supabase
      .from('educational_hub_items')
      .select('id')
      .eq('owner_staff_id', staffId)
      .eq('external_url', newUrl);

    if (itemCheckError) {
      console.error('✗ Check item error:', itemCheckError);
      process.exit(1);
    }

    if (!newItemData || newItemData.length === 0) {
      // Insert new item
      const { data: insertData, error: insertError } = await supabase
        .from('educational_hub_items')
        .insert({
          owner_staff_id: staffId,
          category_id: categoryId,
          item_type: 'link',
          title: 'เกมคณิตศาสตร์ ยกมือตอบคำถาม',
          external_url: newUrl,
          subject: 'คณิตศาสตร์',
          sort_order: 78
        })
        .select('id');

      if (insertError || !insertData || insertData.length === 0) {
        console.error('✗ Insert item error:', insertError);
        process.exit(1);
      }
      itemId = insertData[0].id;
      console.log(`✓ Created new item in educational_hub_items (id: ${itemId})`);
    } else {
      itemId = newItemData[0].id;
      console.log(`✓ Found existing item in educational_hub_items (id: ${itemId})`);
    }
  }

  // 5. Update settings
  const { error: updateError } = await supabase
    .from('educational_hub_items')
    .update({
      game_slug: 'math-hand-raising',
      tracked_game: true,
      is_published: true,
      thumbnail_url: coverUrl,
      updated_at: new Date().toISOString()
    })
    .eq('id', itemId);

  if (updateError) {
    console.error('✗ Update item settings error:', updateError);
    process.exit(1);
  }
  console.log('✓ Updated item settings (slug, thumbnail, is_published)');

  // 6. Seed game documentation (game_docs)
  const { error: docsError } = await supabase
    .from('game_docs')
    .upsert({
      item_id: itemId,
      owner_staff_id: staffId,
      game_format: 'เกมฝึกทักษะคณิตศาสตร์ระดับประถมศึกษา โดยการตรวจจับและวิเคราะห์ท่าทางเปิด/ปิดมือผ่านกล้องเว็บแคม',
      features: [
        'ควบคุมการเลือกคำตอบด้วยการยกมือ (แบมือ 5 นิ้ว) ในฝั่งที่ต้องการเลือกคำตอบ',
        'ระบบนาฬิกาจับเวลาต่อข้อ ปรับเวลาตามระดับชั้น ป.4 (15s), ป.5 (12s), ป.6 (10s)',
        'หมวดหมู่คณิตศาสตร์หลากหลาย: บวก, ลบ, คูณ, หาร และโหมดสุ่มผสม',
        'ระบบโบนัสสำหรับการคิดเลขเร็วเมื่อตอบได้ถูกต้องภายในครึ่งเวลา',
        'ระบบช่วยเหลือแบบครบวงจร รองรับการแตะสัมผัสหน้าจอหรือคลิกเมาส์เป็นทางเลือกสำรอง (Fallback Mode)',
        'รองรับการเซฟประวัติคะแนนส่วนตัว บอร์ดคะแนนห้องเรียน (Leaderboard) และเล่นคู่แบบดวลสองคน/ออนไลน์ (KampaiVersus)'
      ],
      version: 'v1.1.0',
      notes: 'อัปเกรดเป็นระบบ 5-File Architecture พร้อมระบบเลือกหมวดหมู่และระดับชั้น ป.4-ป.6 และระบบจับเวลา',
      updated_at: new Date().toISOString()
    }, { onConflict: 'item_id' });

  if (docsError) {
    console.error('✗ game_docs upsert error:', docsError);
    process.exit(1);
  }
  console.log('✓ Seeded game_docs details successfully!');
  console.log('🎉 Seeding successfully completed!');
}

main().catch(console.error);
