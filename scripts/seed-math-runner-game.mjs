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
  console.log('Seeding Math Runner game into database...');

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
  const url = '/games/math/math-runner/index.html';
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
        title: 'Math Runner (วิ่งสู้สูตรคูณ)',
        external_url: url,
        subject: 'คณิตศาสตร์',
        sort_order: 25
      })
      .select('id');

    if (insertError || !insertData || insertData.length === 0) {
      console.error('✗ Insert item error:', insertError);
      process.exit(1);
    }
    itemId = insertData[0].id;
    console.log(`✓ Created new item in educational_hub_items (id: ${itemId})`);
  } else {
    itemId = itemData[0].id;
    console.log(`✓ Found existing item in educational_hub_items (id: ${itemId})`);
  }

  // 5. Update settings
  const { error: updateError } = await supabase
    .from('educational_hub_items')
    .update({
      game_slug: 'math-runner',
      tracked_game: true,
      is_published: true,
      thumbnail_url: '/games/math/math-runner/cover.svg',
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
      game_format: 'วิ่งสลับเลน/ตอบคำถาม/จับเวลา',
      features: ['เล่นเดี่ยวผจญภัย', 'เล่นเดี่ยวแข่งเวลา', 'เล่น 2 คนในจอเดียว', 'โหมดแข่งออนไลน์', 'ปรับระดับโจทย์ตามความสามารถ'],
      version: 'v1.0.0',
      notes: 'สร้างเกมครั้งแรก',
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
