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
    external_url: '/games/thai/fact-opinion.html',
    thumbnail_url: '/games/thai/fact-opinion-cover.png',
    title: '📰 ข้อเท็จจริง vs ความคิดเห็น',
    description: 'สื่อการสอนภาษาไทย ป.4 — เรียนรู้แยกข้อเท็จจริงกับความคิดเห็น · โหมดฝึกจำแนก · คู่เกม reading-game',
    subject: 'ภาษาไทย',
    grade_levels: ['ป.4'],
    tags: ['ข้อเท็จจริง', 'ความคิดเห็น', 'การอ่าน', 'ภาษาไทย'],
    sort_order: 78,
  },
  {
    external_url: '/games/math/bar-chart-media.html',
    thumbnail_url: '/games/math/bar-chart-media-cover.png',
    title: '📊 แผนภูมิแท่ง — อ่านและเปรียบเทียบ',
    description: 'สื่อการสอนคณิตศาสตร์ ป.4 — กรอกข้อมูลวาดกราฟแท่ง · อ่านค่าสูงสุด/ต่ำสุด · โหมดฝึกอ่านกราฟ',
    subject: 'คณิตศาสตร์',
    grade_levels: ['ป.4', 'ป.5'],
    tags: ['แผนภูมิ', 'กราฟ', 'สถิติ', 'คณิตศาสตร์'],
    sort_order: 79,
  },
  {
    external_url: '/games/social/good-citizen-media.html',
    thumbnail_url: '/games/social/good-citizen-media-cover.png',
    title: '🤝 พลเมืองดี — หน้าที่และจริยธรรม',
    description: 'สื่อการสอนสังคมศึกษา ป.4 — คุณลักษณะพลเมืองดี · สถานการณ์เลือกพฤติกรรม · คู่เกม good-citizen',
    subject: 'สังคมศึกษา',
    grade_levels: ['ป.4', 'ป.5'],
    tags: ['พลเมืองดี', 'จริยธรรม', 'สังคมศึกษา', 'หน้าที่'],
    sort_order: 80,
  },
  {
    external_url: '/games/science/vertebrate-sort.html',
    thumbnail_url: '/games/science/vertebrate-sort-cover.png',
    title: '🦴 สัตว์มี/ไม่มีกระดูกสันหลัง',
    description: 'สื่อการสอนวิทยาศาสตร์ ป.4 — เรียนรู้สัตว์มีกระดูกสันหลัง vs ไม่มี · โหมดจัดกลุ่ม · ทดสอบ · คู่เกม blocky-safari',
    subject: 'วิทยาศาสตร์',
    grade_levels: ['ป.3', 'ป.4'],
    tags: ['สัตว์', 'กระดูกสันหลัง', 'ชีววิทยา', 'วิทยาศาสตร์'],
    sort_order: 81,
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
