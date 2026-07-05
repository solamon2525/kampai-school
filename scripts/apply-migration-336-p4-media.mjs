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
    external_url: '/games/math/decimal-media.html',
    thumbnail_url: '/games/math/decimal-media-cover.png',
    title: '🔢 ทศนิยม — อ่าน · เปรียบเทียบ · บวกลบ',
    description: 'สื่อการสอนคณิตศาสตร์ ป.4 — แผ่นหลักสิบ อ่านทศนิยม เปรียบเทียบ บวกลบทศนิยม · โหมดฝึก · คู่เกม rounding',
    subject: 'คณิตศาสตร์',
    grade_levels: ['ป.4', 'ป.5'],
    tags: ['ทศนิยม', 'หลักสิบ', 'คณิตศาสตร์', 'เปรียบเทียบ'],
    sort_order: 74,
  },
  {
    external_url: '/games/science/states-of-matter.html',
    thumbnail_url: '/games/science/states-of-matter-cover.png',
    title: '🧊 สสาร 3 สถานะ — แข็ง · ของเหลว · ก๊าซ',
    description: 'สื่อการสอนวิทยาศาสตร์ ป.4 — สไลเดอร์อุณหภูมิ น้ำแข็ง↔น้ำ↔ไอ · โหมดทดสอบ · คู่เกม sci-sort',
    subject: 'วิทยาศาสตร์',
    grade_levels: ['ป.3', 'ป.4'],
    tags: ['สสาร', 'สถานะของสสาร', 'อุณหภูมิ', 'วิทยาศาสตร์'],
    sort_order: 75,
  },
  {
    external_url: '/games/social/thailand-map.html',
    thumbnail_url: '/games/social/thailand-map-cover.png',
    title: '🗺️ แผนที่ประเทศไทย — ภาคและจังหวัด',
    description: 'สื่อการสอนสังคมศึกษา ป.4 — แตะภาคดูจังหวัดตัวอย่าง ลักษณะทางกายภาพ · ฝึกทายภาค · คู่เกม globe-3d',
    subject: 'สังคมศึกษา',
    grade_levels: ['ป.4'],
    tags: ['แผนที่', 'จังหวัด', 'ภาค', 'สังคมศึกษา', 'ประเทศไทย'],
    sort_order: 76,
  },
  {
    external_url: '/games/english/sight-words-p4.html',
    thumbnail_url: '/games/english/sight-words-p4-cover.png',
    title: '👁️ Sight Words — คำอ่านจำ ป.4',
    description: 'สื่อการสอนภาษาอังกฤษ ป.4 — การ์ดพลิกคำอ่านจำ 24 คำ พร้อมประโยคตัวอย่าง · โหมดฝึกความหมาย · คู่เกม reading-quest',
    subject: 'ภาษาอังกฤษ',
    grade_levels: ['ป.4'],
    tags: ['sight words', 'คำอ่านจำ', 'ภาษาอังกฤษ', 'อ่าน'],
    sort_order: 77,
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
