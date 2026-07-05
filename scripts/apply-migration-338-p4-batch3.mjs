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
    external_url: '/games/math/angle-media.html',
    thumbnail_url: '/games/math/angle-media-cover.png',
    title: '📐 มุม — แหลม · ฉาก · ป้าน',
    description: 'สื่อการสอนคณิตศาสตร์ ป.4 — จำแนกชนิดมุม · โพรแทรกเตอร์ · โหมดฝึก · สร้างมุม',
    subject: 'คณิตศาสตร์',
    grade_levels: ['ป.4', 'ป.5'],
    tags: ['มุม', 'โพรแทรกเตอร์', 'เรขาคณิต', 'คณิตศาสตร์'],
    sort_order: 82,
  },
  {
    external_url: '/games/social/sukhothai-timeline.html',
    thumbnail_url: '/games/social/sukhothai-timeline-cover.png',
    title: '🏛️ สมัยสุโขทัย — ไทม์ไลน์',
    description: 'สื่อการสอนสังคมศึกษา ป.4 — ไทม์ไลน์เหตุการณ์สำคัญ · บุคคลสำคัญ · โหมดทดสอบ · คู่เกม social-quiz',
    subject: 'สังคมศึกษา',
    grade_levels: ['ป.4', 'ป.5'],
    tags: ['สุโขทัย', 'ประวัติศาสตร์', 'ไทม์ไลน์', 'สังคมศึกษา'],
    sort_order: 83,
  },
  {
    external_url: '/games/health/food-label-media.html',
    thumbnail_url: '/games/health/food-label-media-cover.png',
    title: '🥫 อ่านฉลากอาหาร',
    description: 'สื่อการสอนสุขศึกษา ป.4 — สารอาหาร · วันหมดอายุ · โหมดฝึกอ่านฉลาก',
    subject: 'สุขศึกษา',
    grade_levels: ['ป.4', 'ป.5'],
    tags: ['ฉลากอาหาร', 'สารอาหาร', 'สุขศึกษา', 'โภชนาการ'],
    sort_order: 84,
  },
  {
    external_url: '/games/english/follow-instructions.html',
    thumbnail_url: '/games/english/follow-instructions-cover.png',
    title: '👂 Follow Instructions',
    description: 'สื่อการสอนภาษาอังกฤษ ป.4 — ฟัง/อ่านคำสั่งแล้วเลือกภาพ · โหมดฝึก · คู่เกม sentence-builder',
    subject: 'ภาษาอังกฤษ',
    grade_levels: ['ป.4'],
    tags: ['คำสั่ง', 'ฟัง', 'อ่าน', 'ภาษาอังกฤษ'],
    sort_order: 85,
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
