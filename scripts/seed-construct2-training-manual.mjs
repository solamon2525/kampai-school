#!/usr/bin/env node
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

if (existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
    }
  }
}

const url = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, serviceRoleKey, { auth: { persistSession: false } });
const OWNER_STAFF_ID = 'a5f53911-b9cb-465a-b963-7202bcb907b1';
const EXTERNAL_URL = '/training/construct2-learning/';

async function main() {
  const { data: category, error: categoryError } = await supabase
    .from('educational_hub_categories')
    .select('id')
    .eq('category_key', 'training')
    .eq('is_active', true)
    .single();
  if (categoryError) throw categoryError;

  const payload = {
    owner_staff_id: OWNER_STAFF_ID,
    category_id: category.id,
    item_type: 'link',
    title: 'คู่มือฝึกสร้างเกมด้วย Construct 2 — Step by Step',
    description: 'คู่มือสร้างเกม Platform สำหรับมือใหม่ 10 บท 67 ขั้นตอน พร้อมภาพหน้าจอ 134 ภาพ คลัง Event 524 คำสั่ง คำแปลไทย และ Action Simulator แบบกดทดลองได้',
    thumbnail_url: '/training/construct2-learning/manual-steps/l2-s8-b.svg',
    external_url: EXTERNAL_URL,
    tags: ['Construct 2', 'สร้างเกม', 'คู่มือฝึก', 'Game Development'],
    grade_levels: ['ป.4', 'ป.5', 'ป.6', 'มัธยมศึกษา'],
    subject: 'คอมพิวเตอร์',
    sort_order: 0,
    is_published: true,
    tracked_game: false,
    game_slug: null,
    corner_badge: 'คู่มือใหม่',
    build_version: '1.0.0',
    build_updated_at: new Date().toISOString(),
  };

  const { data: existing, error: findError } = await supabase
    .from('educational_hub_items')
    .select('id')
    .eq('owner_staff_id', OWNER_STAFF_ID)
    .eq('external_url', EXTERNAL_URL)
    .maybeSingle();
  if (findError) throw findError;

  let itemId;
  if (existing) {
    const { error } = await supabase
      .from('educational_hub_items')
      .update(payload)
      .eq('id', existing.id);
    if (error) throw error;
    itemId = existing.id;
    console.log('Updated Construct 2 training manual:', itemId);
  } else {
    const { data, error } = await supabase
      .from('educational_hub_items')
      .insert(payload)
      .select('id')
      .single();
    if (error) throw error;
    itemId = data.id;
    console.log('Inserted Construct 2 training manual:', itemId);
  }

  const { data: verified, error: verifyError } = await supabase
    .from('educational_hub_items')
    .select('id,title,external_url,is_published,category_id')
    .eq('id', itemId)
    .single();
  if (verifyError) throw verifyError;
  console.log(JSON.stringify(verified, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
