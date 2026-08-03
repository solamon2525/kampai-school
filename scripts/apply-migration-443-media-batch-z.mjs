#!/usr/bin/env node
/** Apply Media Batch Z + W8 (443) via service role */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(resolve(root, '.env.local'), 'utf8');
const url = env.match(/VITE_SUPABASE_URL="?([^\r\n"]+)/)?.[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="?([^\r\n"]+)/)?.[1];
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: staff } = await sb.from('staff').select('id').like('name', '%ณัฐพงศ์%สิงห์ชมภู%')
  .eq('staff_type', 'teaching').order('created_at', { ascending: true }).limit(1).maybeSingle();
const { data: mediaCat } = await sb.from('educational_hub_categories').select('id').eq('category_key', 'media').maybeSingle();
const { data: videosCat } = await sb.from('educational_hub_categories').select('id').eq('category_key', 'videos').maybeSingle();
if (!staff || !mediaCat) { console.error('staff/media cat missing'); process.exit(1); }
await sb.from('educational_hub_profiles').upsert({ staff_id: staff.id, is_hub_active: true }, { onConflict: 'staff_id' });

const videosId = videosCat?.id || mediaCat.id;

const items = [
  {
    category_id: mediaCat.id,
    external_url: '/games/math/geometry-3d-media.html',
    thumbnail_url: '/games/math/geometry-3d-media-cover.png',
    title: '🧊 เรขาคณิต 2D/3D — หน้า ขอบ จุดยอด',
    description: 'สื่อการสอนคณิตศาสตร์ ป.4–6 — เลือกทรง · นับหน้า/ขอบ/จุดยอด · รูปคลี่ · สมมาตร · คู่เกม solid-3d/net-3d · ไม่เก็บคะแนน',
    subject: 'คณิตศาสตร์', grade_levels: ['ป.4', 'ป.5', 'ป.6'],
    tags: ['เรขาคณิต', '3D', 'รูปคลี่', 'สมมาตร'], sort_order: 181,
    indicators: ['ค 2.2 ป.5/4', 'ค 2.2 ป.6/3', 'ค 2.2 ป.6/4', 'ค 2.2 ป.3/1'],
    docs: { game_format: 'เรขาคณิต 2D/3D', features: ['เลือกทรง', 'นับหน้า/ขอบ/จุดยอด', 'รูปคลี่', 'โหมดฝึก'], version: 'v1.0.0', notes: 'M6 · Media Batch Z' },
  },
  {
    category_id: mediaCat.id,
    external_url: '/docs/teacher-upload-media-guide.html',
    thumbnail_url: null,
    title: '📘 คู่มือครูอัปสื่อใน 5 นาที (W8)',
    description: 'คู่มือ 1 หน้า — เข้า /teacher/edu-hub → เพิ่ม PDF/YouTube/ข้อความ → ใส่วิชา·ชั้น·tags → เผยแพร่ · พิมพ์ได้',
    subject: 'ทั่วไป', grade_levels: ['ครู'],
    tags: ['คู่มือครู', 'W8', 'อัปสื่อ'], sort_order: 10,
    indicators: [],
    docs: null,
  },
  {
    category_id: videosId,
    external_url: '/docs/starter-media/math-place-value-note.html',
    title: '📌 ความรู้สั้น: ค่าประจำหลัก',
    description: 'ตัวอย่างสื่อข้อความคณิต — ครูอัปเองได้ที่ Teacher Portal',
    subject: 'คณิตศาสตร์', grade_levels: ['ป.3', 'ป.4'],
    tags: ['ความรู้สั้น', 'ตัวอย่างครู'], sort_order: 200,
    indicators: [], docs: null,
  },
  {
    category_id: videosId,
    external_url: '/docs/starter-media/thai-vowel-note.html',
    title: '📌 ความรู้สั้น: สระสั้น–สระยาว',
    description: 'ตัวอย่างสื่อข้อความไทย — ใช้คู่แผนภาพสระ',
    subject: 'ภาษาไทย', grade_levels: ['ป.1', 'ป.2'],
    tags: ['ความรู้สั้น', 'ตัวอย่างครู'], sort_order: 201,
    indicators: [], docs: null,
  },
  {
    category_id: videosId,
    external_url: '/docs/starter-media/english-greetings-note.html',
    title: '📌 Classroom English: Greetings',
    description: 'ตัวอย่างสื่อข้อความอังกฤษ — ทักทายในห้องเรียน',
    subject: 'ภาษาอังกฤษ', grade_levels: ['ป.1', 'ป.2', 'ป.3'],
    tags: ['ความรู้สั้น', 'ตัวอย่างครู', 'classroom english'], sort_order: 202,
    indicators: [], docs: null,
  },
  {
    category_id: videosId,
    external_url: '/docs/starter-media/science-water-cycle-note.html',
    title: '📌 ความรู้สั้น: วัฏจักรน้ำ 4 ขั้น',
    description: 'ตัวอย่างสื่อข้อความวิทย์ — ใช้คู่สื่อแผนภาพวัฏจักรน้ำ',
    subject: 'วิทยาศาสตร์', grade_levels: ['ป.3', 'ป.4', 'ป.5'],
    tags: ['ความรู้สั้น', 'ตัวอย่างครู'], sort_order: 203,
    indicators: [], docs: null,
  },
];

for (const it of items) {
  const payload = {
    owner_staff_id: staff.id,
    category_id: it.category_id,
    item_type: 'link',
    title: it.title,
    description: it.description,
    external_url: it.external_url,
    thumbnail_url: it.thumbnail_url ?? null,
    subject: it.subject,
    grade_levels: it.grade_levels,
    tags: it.tags,
    sort_order: it.sort_order,
    tracked_game: false,
    is_published: true,
  };
  const { data: existing } = await sb.from('educational_hub_items').select('id')
    .eq('owner_staff_id', staff.id).eq('external_url', it.external_url).maybeSingle();
  let itemId = existing?.id;
  if (!existing) {
    const { data, error } = await sb.from('educational_hub_items').insert(payload).select('id').single();
    if (error) throw error;
    itemId = data.id;
    console.log('INSERT', it.external_url);
  } else {
    const { error } = await sb.from('educational_hub_items').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', existing.id);
    if (error) throw error;
    console.log('UPDATE', it.external_url);
  }

  if (it.indicators?.length) {
    const { data: inds } = await sb.from('curriculum_indicators').select('id, indicator_code').in('indicator_code', it.indicators);
    for (const code of it.indicators) {
      const ind = (inds || []).find((r) => r.indicator_code === code);
      if (!ind) { console.warn('MISS indicator', code); continue; }
      const { error } = await sb.from('indicator_games').upsert(
        { edu_hub_item_id: itemId, indicator_id: ind.id },
        { onConflict: 'edu_hub_item_id,indicator_id', ignoreDuplicates: true },
      );
      if (error && String(error.code) !== '23505') console.warn('link', code, error.message);
      else console.log('LINK', it.external_url, code);
    }
  }

  if (it.docs) {
    const { error: docErr } = await sb.from('game_docs').upsert({
      item_id: itemId,
      owner_staff_id: staff.id,
      game_format: it.docs.game_format,
      features: it.docs.features,
      version: it.docs.version,
      notes: it.docs.notes,
    }, { onConflict: 'item_id' });
    if (docErr) console.warn('docs', docErr.message);
    else console.log('DOCS', it.external_url);
  }
}

console.log('done media batch Z + W8');
