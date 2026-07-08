#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(resolve(root, '.env.local'), 'utf8');
const url = env.match(/VITE_SUPABASE_URL="?([^\r\n"]+)/)?.[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="?([^\r\n"]+)/)?.[1];
if (!url || !key) { console.error('missing env'); process.exit(1); }

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const vUrl = '/games/math/times-table.html';
const vThumb = '/games/math/times-table-cover.png';

const { data: staff } = await sb.from('staff').select('id').like('name', '%ณัฐพงศ์%สิงห์ชมภู%')
  .eq('staff_type', 'teaching').order('created_at', { ascending: true }).limit(1).maybeSingle();
const { data: cat } = await sb.from('educational_hub_categories').select('id').eq('category_key', 'media').maybeSingle();
if (!staff || !cat) { console.error('staff/cat missing'); process.exit(1); }

await sb.from('educational_hub_profiles').upsert({ staff_id: staff.id, is_hub_active: true }, { onConflict: 'staff_id' });

const payload = {
  owner_staff_id: staff.id,
  category_id: cat.id,
  item_type: 'link',
  title: '✖️ ตารางสูตรคูณ',
  description: 'สื่อการสอนคณิตศาสตร์ ป.2-4 — ตารางสูตรคูณ 1–12 แตะช่องไฮไลต์แถว/คอลัมน์ + อ่านสูตร · โหมดฝึกเลือกคำตอบ',
  external_url: vUrl,
  thumbnail_url: vThumb,
  subject: 'คณิตศาสตร์',
  grade_levels: ['ป.2', 'ป.3', 'ป.4'],
  tags: ['สูตรคูณ', 'ตารางคูณ', 'คณิตศาสตร์', 'แม่สูตร'],
  sort_order: 60,
  tracked_game: false,
  is_published: true,
};

const { data: existing } = await sb.from('educational_hub_items').select('id')
  .eq('owner_staff_id', staff.id).eq('external_url', vUrl).maybeSingle();

if (!existing) {
  const { data, error } = await sb.from('educational_hub_items').insert(payload).select('id, title').single();
  if (error) throw error;
  console.log('INSERTED', data);
} else {
  const { data, error } = await sb.from('educational_hub_items').update({
    title: payload.title,
    description: payload.description,
    thumbnail_url: payload.thumbnail_url,
    subject: payload.subject,
    grade_levels: payload.grade_levels,
    tags: payload.tags,
    tracked_game: false,
    is_published: true,
    category_id: cat.id,
  }).eq('id', existing.id).select('id, title').single();
  if (error) throw error;
  console.log('UPDATED', data);
}
