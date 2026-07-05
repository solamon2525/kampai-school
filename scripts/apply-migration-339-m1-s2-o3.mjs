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

const { data: staff } = await sb.from('staff').select('id').like('name', '%ณัฐพงศ์%สิงห์ชมภู%')
  .eq('staff_type', 'teaching').order('created_at', { ascending: true }).limit(1).maybeSingle();
const { data: cat } = await sb.from('educational_hub_categories').select('id').eq('category_key', 'media').maybeSingle();
if (!staff || !cat) { console.error('staff/cat missing'); process.exit(1); }

await sb.from('educational_hub_profiles').upsert({ staff_id: staff.id, is_hub_active: true }, { onConflict: 'staff_id' });

const items = [
  {
    external_url: '/games/math/number-line-media.html',
    thumbnail_url: '/games/math/number-line-media-cover.png',
    title: '📏 เส้นจำนวน — เปรียบเทียบ · เรียงลำดับ',
    description: 'สื่อการสอนคณิตศาสตร์ ป.1–3 — ลากจุดบนเส้นจำนวน · เปรียบเทียบ · เรียงลำดับ · ไม่เก็บคะแนน (fork จาก number-line)',
    subject: 'คณิตศาสตร์',
    grade_levels: ['ป.1', 'ป.2', 'ป.3'],
    tags: ['เส้นจำนวน', 'เปรียบเทียบ', 'เรียงลำดับ', 'คณิตศาสตร์'],
    sort_order: 86,
  },
  {
    external_url: '/games/science/digestive-system-media.html',
    thumbnail_url: '/games/science/digestive-system-media-cover.png',
    title: '🫁 ระบบย่อยอาหาร — แผนภาพคลิกได้',
    description: 'สื่อการสอนวิทยาศาสตร์ ป.4–6 — แตะอวัยวะระบบย่อย · เรียงลำดับการย่อย · คู่เกม digestive-ar',
    subject: 'วิทยาศาสตร์',
    grade_levels: ['ป.4', 'ป.5', 'ป.6'],
    tags: ['ระบบย่อยอาหาร', 'ร่างกายมนุษย์', 'ชีววิทยา', 'วิทยาศาสตร์'],
    sort_order: 87,
  },
  {
    external_url: '/games/health/handwash-media.html',
    thumbnail_url: '/games/health/handwash-media-cover.png',
    title: '🧼 ล้างมือ 7 ขั้นตอน',
    description: 'สื่อการสอนสุขศึกษา ป.1–3 — เรียงขั้นตอนล้างมือถูกวิธี · สุขบัญญัติ · คู่เกม handwash-order',
    subject: 'สุขศึกษา',
    grade_levels: ['ป.1', 'ป.2', 'ป.3'],
    tags: ['ล้างมือ', 'สุขบัญญัติ', 'สุขศึกษา', 'สุขอนามัย'],
    sort_order: 88,
  },
];

for (const item of items) {
  const payload = {
    owner_staff_id: staff.id,
    category_id: cat.id,
    item_type: 'link',
    tracked_game: false,
    is_published: true,
    ...item,
  };
  const { data: existing } = await sb.from('educational_hub_items').select('id')
    .eq('owner_staff_id', staff.id).eq('external_url', item.external_url).maybeSingle();
  if (!existing) {
    const { data, error } = await sb.from('educational_hub_items').insert(payload).select('title').single();
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
      sort_order: payload.sort_order,
      tracked_game: false,
      is_published: true,
      category_id: cat.id,
    }).eq('id', existing.id).select('title').single();
    if (error) throw error;
    console.log('UPDATED', data);
  }
}
