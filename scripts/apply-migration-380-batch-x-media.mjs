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
    external_url: '/games/health/food-groups-media.html',
    thumbnail_url: '/games/health/food-groups-media-cover.png',
    title: '🥗 อาหารหลัก 5 หมู่',
    description: 'สื่อการสอนสุขศึกษา ป.3–4 — เรียนรู้หมู่ الطعام · สำรวจอาหาร · จัดจานครบ 5 หมู่ · คู่เกม plate-builder · ไม่เก็บคะแนน',
    subject: 'สุขศึกษา',
    grade_levels: ['ป.3', 'ป.4'],
    tags: ['อาหาร5หมู่', 'โภชนาการ', 'สุขศึกษา', 'จัดจาน'],
    sort_order: 92,
    indicators: ['พ 4.1 ป.3/2', 'พ 4.1 ป.3/3'],
    docs: {
      game_format: 'อาหารหลัก 5 หมู่',
      features: ['เรียนรู้ 5 หมู่', 'สำรวจอาหาร', 'จัดจานฝึก', 'ถูก/ผิด', 'จานครู 3 มื้อ', 'คู่ plate-builder'],
      version: 'v1.0.0',
      notes: 'H1 · พ 4.1 ป.3/2–3 · Batch X1',
    },
  },
  {
    external_url: '/games/arts/color-wheel-media.html',
    thumbnail_url: '/games/arts/color-wheel-media-cover.png',
    title: '🎨 วงล้อสี — วรรณะอุ่น–เย็น',
    description: 'สื่อการสอนศิลปะ ป.1–4 — สำรวจวงล้อสี · วรรณะอุ่น/เย็น · จัดฉาก · ผสมแม่สี · คู่เกม color-wheel · ไม่เก็บคะแนน',
    subject: 'ศิลปะ',
    grade_levels: ['ป.1', 'ป.2', 'ป.3', 'ป.4'],
    tags: ['วงล้อสี', 'วรรณะ', 'ศิลปะ', 'สี'],
    sort_order: 93,
    indicators: ['ศ 1.1 ป.4/2', 'ศ 1.1 ป.4/7'],
    docs: {
      game_format: 'วงล้อสีวรรณะ',
      features: ['วงล้อสำรวจ', 'อุ่น vs เย็น', 'จัดฉาก', 'ผสมแม่สี', 'quiz', 'คู่ color-wheel'],
      version: 'v1.0.0',
      notes: 'A1 · ศ 1.1 ป.4/2,/7 · Batch X1',
    },
  },
  {
    external_url: '/games/thai/synonym-media.html',
    thumbnail_url: '/games/thai/synonym-media-cover.png',
    title: '📝 ไวพจน์ — คำพ้องความหมาย',
    description: 'สื่อการสอนภาษาไทย ป.4–6 — กลุ่มไวพจน์คัดสรร · โทนใช้ · แฟลชการ์ด · ฝึกเลือก · คู่เกม waipot · ไม่ซ้ำคลังคำทั้งก้อน',
    subject: 'ภาษาไทย',
    grade_levels: ['ป.4', 'ป.5', 'ป.6'],
    tags: ['ไวพจน์', 'คำพ้อง', 'ภาษาไทย', 'ความหมาย'],
    sort_order: 94,
    indicators: ['ท 1.1 ป.4/2'],
    docs: {
      game_format: 'ไวพจน์',
      features: ['เรียนรู้ 24 กลุ่ม', 'แฟลชการ์ด', 'เลือกไวพจน์', 'จับคู่กลุ่ม', 'คู่ waipot'],
      version: 'v1.0.0',
      notes: 'T4 · ท 1.1 ป.4/2 · ไม่ copy thai-vocab-hub ทั้งก้อน · Batch X1',
    },
  },
  {
    external_url: '/games/science/plant-parts-media.html',
    thumbnail_url: '/games/science/plant-parts-media-cover.png',
    title: '🌱 ส่วนของพืชดอก',
    description: 'สื่อการสอนวิทยาศาสตร์ ป.4 — คลิกส่วนพืช · จับคู่หน้าที่ · กินส่วนไหน · คู่เกม veggie-garden · ไม่เก็บคะแนน',
    subject: 'วิทยาศาสตร์',
    grade_levels: ['ป.4'],
    tags: ['ส่วนพืช', 'รากลำต้นใบดอก', 'วิทยาศาสตร์'],
    sort_order: 95,
    indicators: ['ว 1.2 ป.4/1'],
    docs: {
      game_format: 'ส่วนพืชดอก',
      features: ['แผนภาพคลิก', 'จับคู่หน้าที่', 'กินส่วนไหน', 'เรียงเติบโต', 'คู่ veggie-garden'],
      version: 'v1.0.0',
      notes: 'S-plant · ว 1.2 ป.4/1 · Batch X2',
    },
  },
  {
    external_url: '/games/science/moon-phases-media.html',
    thumbnail_url: '/games/science/moon-phases-media-cover.png',
    title: '🌙 ดวงจันทร์ 8 ข้าง',
    description: 'สื่อการสอนวิทยาศาสตร์ ป.4 — วงโคจร · ไทม์ไลน์ 8 ข้าง · เรียงลำดับ · ทายข้าง · พยากรณ์ · ไม่เก็บคะแนน',
    subject: 'วิทยาศาสตร์',
    grade_levels: ['ป.4'],
    tags: ['ดวงจันทร์', 'ข้างขึ้นข้างแรม', 'วิทยาศาสตร์', 'ดาราศาสตร์'],
    sort_order: 96,
    indicators: ['ว 3.1 ป.4/1', 'ว 3.1 ป.4/2'],
    docs: {
      game_format: 'ดวงจันทร์ 8 ข้าง',
      features: ['วงโคจรจำลอง', 'ไทม์ไลน์', 'เรียงลำดับ', 'ทายข้าง', 'พยากรณ์'],
      version: 'v1.0.0',
      notes: 'S-moon · ว 3.1 ป.4/1–2 · Batch X2',
    },
  },
  {
    external_url: '/games/math/rect-area-media.html',
    thumbnail_url: '/games/math/rect-area-media-cover.png',
    title: '📐 พื้นที่สี่เหลี่ยมมุมฉาก',
    description: 'สื่อการสอนคณิตศาสตร์ ป.4 — กริดนับช่อง · สูตร ก×ย · โจทย์เรื่อง · แยกพื้นที่กับเส้นรอบรูป · คู่เกม mini-farm-island',
    subject: 'คณิตศาสตร์',
    grade_levels: ['ป.4'],
    tags: ['พื้นที่', 'สี่เหลี่ยม', 'คณิตศาสตร์', 'กริด'],
    sort_order: 97,
    indicators: ['ค 2.1 ป.4/3'],
    docs: {
      game_format: 'พื้นที่สี่เหลี่ยมมุมฉาก',
      features: ['กริดโต้ตอบ', 'นับช่อง', 'สูตร', 'โจทย์เรื่อง', 'พื้นที่ vs เส้นรอบรูป', 'คู่ mini-farm-island'],
      version: 'v1.0.0',
      notes: 'M-area · ค 2.1 ป.4/3 · Batch X2',
    },
  },
  {
    external_url: '/games/health/bone-muscle-media.html',
    thumbnail_url: '/games/health/bone-muscle-media-cover.png',
    title: '🦴 กระดูก กล้ามเนื้อ ข้อ',
    description: 'สื่อการสอนสุขศึกษา ป.4–5 — แผนภาพคลิก · แยกประเภท · นิสัยดูแลร่างกาย · ไม่เก็บคะแนน',
    subject: 'สุขศึกษา',
    grade_levels: ['ป.4', 'ป.5'],
    tags: ['กระดูก', 'กล้ามเนื้อ', 'ข้อ', 'สุขศึกษา', 'ร่างกาย'],
    sort_order: 98,
    indicators: ['พ 1.1 ป.4/2', 'พ 1.1 ป.4/3'],
    docs: {
      game_format: 'กระดูก กล้ามเนื้อ ข้อ',
      features: ['hotspot แผนภาพ', 'แยกประเภท', 'ดูแลร่างกาย', 'ทายตำแหน่ง'],
      version: 'v1.0.0',
      notes: 'H-body · พ 1.1 ป.4/2–3 · Batch X3',
    },
  },
  {
    external_url: '/games/career/community-jobs-media.html',
    thumbnail_url: '/games/career/community-jobs-media-cover.png',
    title: '👷 อาชีพในชุมชน',
    description: 'สื่อการสอนการงานอาชีพ ป.1–4 — การ์ดอาชีพไทยชุมชน · จัดกลุ่มภาค · สำคัญต่อชุมชน · คู่เกม veggie-garden',
    subject: 'การงานอาชีพ',
    grade_levels: ['ป.1', 'ป.2', 'ป.3', 'ป.4'],
    tags: ['อาชีพ', 'ชุมชน', 'การงานอาชีพ'],
    sort_order: 99,
    indicators: ['ง 2.1 ป.4/1'],
    docs: {
      game_format: 'อาชีพในชุมชน',
      features: ['การ์ดอาชีพ', 'จัดกลุ่มภาค', 'ใครทำอะไร', 'สำคัญต่อชุมชน', 'สำรวจตัวเอง'],
      version: 'v1.0.0',
      notes: 'C1 · ง 2.1 ป.4/1 · Batch X3',
    },
  },
  {
    external_url: '/games/social/sufficiency-media.html',
    thumbnail_url: '/games/social/sufficiency-media-cover.png',
    title: '🌾 เศรษฐกิจพอเพียง',
    description: 'สื่อการสอนสังคมศึกษา ป.4–6 — 3 ห่วง 2 เงื่อนไข · สถานการณ์เด็ก · แผนพอเพียงของฉัน · ไม่เก็บคะแนน',
    subject: 'สังคมศึกษา',
    grade_levels: ['ป.4', 'ป.5', 'ป.6'],
    tags: ['เศรษฐกิจพอเพียง', 'สังคมศึกษา', '3ห่วง'],
    sort_order: 100,
    indicators: ['ส 3.1 ป.4/3'],
    docs: {
      game_format: 'เศรษฐกิจพอเพียง',
      features: ['เรียนรู้ 3 ห่วง 2 เงื่อนไข', 'จับคู่', 'สถานการณ์', 'แผนของฉัน'],
      version: 'v1.0.0',
      notes: 'O-suff · ส 3.1 ป.4/3 · Batch X3',
    },
  },
  {
    external_url: '/games/thai/dictionary-media.html',
    thumbnail_url: '/games/thai/dictionary-media-cover.png',
    title: '📖 พจนานุกรมดิจิทัล',
    description: 'สื่อการสอนภาษาไทย ป.3–4 — สอนวิธีเปิดพจนานุกรม · ค้นหา · ฝึกเปิด · จัดเรียงตัวอักษร · ไม่เก็บคะแนน',
    subject: 'ภาษาไทย',
    grade_levels: ['ป.3', 'ป.4'],
    tags: ['พจนานุกรม', 'ภาษาไทย', 'ค้นหาคำ'],
    sort_order: 101,
    indicators: ['ท 4.1 ป.3/3', 'ท 4.1 ป.4/3'],
    docs: {
      game_format: 'พจนานุกรมดิจิทัล',
      features: ['สาธิต 5 ขั้น', 'ค้นหา', 'ฝึกเปิด', 'จัดเรียง', 'อ่านบทความ'],
      version: 'v1.0.0',
      notes: 'T-dict · ท 4.1 ป.3/3,/4/3 · Batch X3',
    },
  },
];

for (const item of items) {
  const { indicators, docs, ...rest } = item;
  const payload = {
    owner_staff_id: staff.id,
    category_id: cat.id,
    item_type: 'link',
    tracked_game: false,
    is_published: true,
    ...rest,
  };
  const { data: existing } = await sb.from('educational_hub_items').select('id')
    .eq('owner_staff_id', staff.id).eq('external_url', item.external_url).maybeSingle();

  let itemId;
  if (!existing) {
    const { data, error } = await sb.from('educational_hub_items').insert(payload).select('id, title').single();
    if (error) throw error;
    itemId = data.id;
    console.log('INSERTED', data.title);
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
    }).eq('id', existing.id).select('id, title').single();
    if (error) throw error;
    itemId = data.id;
    console.log('UPDATED', data.title);
  }

  for (const code of indicators) {
    const { data: ci } = await sb.from('curriculum_indicators').select('id')
      .eq('indicator_code', code).eq('is_active', true).maybeSingle();
    if (!ci) { console.warn('indicator missing', code); continue; }
    const { error } = await sb.from('indicator_games').upsert(
      { edu_hub_item_id: itemId, indicator_id: ci.id },
      { onConflict: 'indicator_id,edu_hub_item_id', ignoreDuplicates: true },
    );
    if (error) console.warn('map err', code, error.message);
    else console.log('MAP', code);
  }

  const { error: docsErr } = await sb.from('game_docs').upsert({
    item_id: itemId,
    owner_staff_id: staff.id,
    game_format: docs.game_format,
    features: docs.features,
    version: docs.version,
    notes: docs.notes,
  }, { onConflict: 'item_id' });
  if (docsErr) console.warn('docs err', docsErr.message);
  else console.log('DOCS', docs.game_format);
}

console.log('DONE batch X media seed');
