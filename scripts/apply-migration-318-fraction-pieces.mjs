#!/usr/bin/env node
/** Apply migration 318 seed (fraction-pieces media) via service role */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(resolve(root, '.env.local'), 'utf8');
const url = env.match(/VITE_SUPABASE_URL="?([^\r\n"]+)/)?.[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="?([^\r\n"]+)/)?.[1];

if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const vUrl = '/games/math/fraction-pieces.html';
const vThumb = '/games/math/fraction-pieces-cover.png';

const { data: staff, error: staffErr } = await sb
  .from('staff')
  .select('id, name')
  .like('name', '%ณัฐพงศ์%สิงห์ชมภู%')
  .eq('staff_type', 'teaching')
  .order('created_at', { ascending: true })
  .limit(1)
  .maybeSingle();
if (staffErr) throw staffErr;
if (!staff) {
  console.error('staff "ครูณัฐพงศ์ สิงห์ชมภู" not found');
  process.exit(1);
}
console.log('staff:', staff.id, staff.name);

const { data: cat, error: catErr } = await sb
  .from('educational_hub_categories')
  .select('id')
  .eq('category_key', 'media')
  .maybeSingle();
if (catErr) throw catErr;
if (!cat) {
  console.error('category media not found');
  process.exit(1);
}
console.log('category media:', cat.id);

const { error: profErr } = await sb
  .from('educational_hub_profiles')
  .upsert({ staff_id: staff.id, is_hub_active: true }, { onConflict: 'staff_id' });
if (profErr) throw profErr;

const payload = {
  owner_staff_id: staff.id,
  category_id: cat.id,
  item_type: 'link',
  title: '🍕 สื่อเศษส่วนวงกลม / แท่ง',
  description:
    'สื่อการสอนคณิตศาสตร์ ป.3-5 — โมเดลเศษส่วนแบบวงกลมและแท่ง ลาก/แตะชิ้นส่วนเทียบสมมูล (เช่น 1/2 = 2/4) คู่กับเกม Pizza เศษส่วน',
  external_url: vUrl,
  thumbnail_url: vThumb,
  subject: 'คณิตศาสตร์',
  grade_levels: ['ป.3', 'ป.4', 'ป.5'],
  tags: ['เศษส่วน', 'สมมูล', 'วงกลม', 'แท่ง', 'พิซซ่า', 'คณิตศาสตร์'],
  sort_order: 20,
  tracked_game: false,
  is_published: true,
};

const { data: existing, error: exErr } = await sb
  .from('educational_hub_items')
  .select('id')
  .eq('owner_staff_id', staff.id)
  .eq('external_url', vUrl)
  .maybeSingle();
if (exErr) throw exErr;

if (!existing) {
  const { data: inserted, error: insErr } = await sb
    .from('educational_hub_items')
    .insert(payload)
    .select('id, title, external_url, thumbnail_url, is_published')
    .single();
  if (insErr) throw insErr;
  console.log('INSERTED:', inserted);
} else {
  const { data: updated, error: upErr } = await sb
    .from('educational_hub_items')
    .update({
      title: payload.title,
      description: payload.description,
      thumbnail_url: payload.thumbnail_url,
      subject: payload.subject,
      grade_levels: payload.grade_levels,
      tags: payload.tags,
      tracked_game: false,
      is_published: true,
      category_id: cat.id,
    })
    .eq('id', existing.id)
    .select('id, title, external_url, thumbnail_url, is_published')
    .single();
  if (upErr) throw upErr;
  console.log('UPDATED:', updated);
}

const { data: verify, error: vErr } = await sb
  .from('educational_hub_items')
  .select('id, title, external_url, thumbnail_url, subject, grade_levels, tracked_game, is_published')
  .eq('external_url', vUrl)
  .single();
if (vErr) throw vErr;
console.log('VERIFY OK:', JSON.stringify(verify, null, 2));
