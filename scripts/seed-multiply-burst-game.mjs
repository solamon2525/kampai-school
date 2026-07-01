#!/usr/bin/env node
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

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('✗ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  console.log('Seeding Multiply Burst game into database...');

  const { data: staffData, error: staffError } = await supabase
    .from('staff')
    .select('id')
    .ilike('name', '%ณัฐพงศ์%สิงห์ชมภู%')
    .eq('staff_type', 'teaching')
    .order('created_at', { ascending: true })
    .limit(1);

  if (staffError || !staffData?.length) {
    console.error('✗ Staff not found:', staffError);
    process.exit(1);
  }
  const staffId = staffData[0].id;
  console.log(`✓ staff_id: ${staffId}`);

  const { data: catData, error: catError } = await supabase
    .from('educational_hub_categories')
    .select('id')
    .eq('category_key', 'games')
    .limit(1);

  if (catError || !catData?.length) {
    console.error('✗ Category games not found:', catError);
    process.exit(1);
  }
  const categoryId = catData[0].id;
  console.log(`✓ category_id: ${categoryId}`);

  const { error: profileError } = await supabase
    .from('educational_hub_profiles')
    .upsert({ staff_id: staffId, is_hub_active: true }, { onConflict: 'staff_id' });

  if (profileError) {
    console.error('✗ Profile upsert failed:', profileError);
    process.exit(1);
  }
  console.log('✓ hub profile active');

  const url = '/games/math/multiply-burst/index.html';
  const { data: existing, error: checkError } = await supabase
    .from('educational_hub_items')
    .select('id')
    .eq('owner_staff_id', staffId)
    .eq('external_url', url);

  if (checkError) {
    console.error('✗ Check item error:', checkError);
    process.exit(1);
  }

  const payload = {
    owner_staff_id: staffId,
    category_id: categoryId,
    item_type: 'link',
    title: '✖️ สูตรคูณตาไว (Multiply Burst)',
    external_url: url,
    subject: 'คณิตศาสตร์',
    sort_order: 11,
    game_slug: 'multiply-burst',
    tracked_game: true,
    is_published: true,
    thumbnail_url: '/games/math/multiply-burst/cover.png',
    bgm_preset: 'playful',
  };

  let itemId;
  if (!existing?.length) {
    const { data: inserted, error: insertError } = await supabase
      .from('educational_hub_items')
      .insert(payload)
      .select('id');

    if (insertError) {
      console.error('✗ Item insert failed:', insertError);
      process.exit(1);
    }
    itemId = inserted[0].id;
    console.log(`✓ inserted item: ${itemId}`);
  } else {
    itemId = existing[0].id;
    const { error: updateError } = await supabase
      .from('educational_hub_items')
      .update(payload)
      .eq('id', itemId);

    if (updateError) {
      console.error('✗ Item update failed:', updateError);
      process.exit(1);
    }
    console.log(`✓ updated item: ${itemId}`);
  }

  const features = [
    'โจทย์สูตรคูณแบบ 2×9=? แสดงบนจอตลอดเกม ตารางคูณ 2–9',
    'ลูกโป่งตัวเลขลอยขึ้นมา — จิ้มคำตอบถูก +10 คะแนน · จิ้มผิด -5 คะแนน (เวลา 60 วินาที)',
    'เสียงตอบถูก: ไดอะลอกสั้นภาษาไทย (TTS) · ตอบผิด: เสียงบิ้ว buzz ผ่าน KAMPAI SDK',
    'KampaiHands engine — ติดตามปลายนิ้วชี้ผ่านกล้อง + fallback แตะสัมผัส',
    'โหมดแข่ง 2 คน (KampaiVersus) · บันทึกคะแนนและตารางอันดับพอร์ทัล',
  ];

  const { error: docError } = await supabase
    .from('game_docs')
    .upsert(
      {
        item_id: itemId,
        owner_staff_id: staffId,
        game_format: 'AR Balloon Popper — ฝึกสูตรคูณตาไวด้วยลูกโป่งตัวเลข จิ้มนิ้วหรือแตะหน้าจอเลือกคำตอบ',
        features,
        version: 'v1.0.0',
        notes: 'สำเนาและดัดแปลงจาก balloon-burst — เปลี่ยนเป็นเกมคณิตศาสตร์สูตรคูณตาไว',
      },
      { onConflict: 'item_id' },
    );

  if (docError) {
    console.error('✗ game_docs upsert failed:', docError);
    process.exit(1);
  }
  console.log('✓ game_docs seeded');
  console.log('🌟 Multiply Burst is live in educational_hub_items');
}

main().catch((err) => {
  console.error('✗ Unexpected error:', err);
  process.exit(1);
});
