#!/usr/bin/env node
/** Apply Media Batch Y (442) via service role */
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
const { data: cat } = await sb.from('educational_hub_categories').select('id').eq('category_key', 'media').maybeSingle();
if (!staff || !cat) { console.error('staff/cat missing'); process.exit(1); }
await sb.from('educational_hub_profiles').upsert({ staff_id: staff.id, is_hub_active: true }, { onConflict: 'staff_id' });

const items = [
  {
    external_url: '/games/english/sight-words-p123-media.html',
    thumbnail_url: '/games/english/sight-words-p123-media-cover.png',
    title: '👁️ Sight Words ป.1–3',
    description: 'สื่อการสอนภาษาอังกฤษ ป.1–3 — คำอ่านจำแยกชั้น · แฟลชการ์ด · ฝึกเลือกความหมาย · คนละชุดจาก Sight Words ป.4 · ไม่เก็บคะแนน',
    subject: 'ภาษาอังกฤษ', grade_levels: ['ป.1', 'ป.2', 'ป.3'],
    tags: ['sight words', 'คำอ่านจำ', 'ภาษาอังกฤษ', 'แฟลชการ์ด'], sort_order: 176,
    indicators: ['ต 1.1 ป.1/2', 'ต 1.1 ป.2/2'],
    docs: { game_format: 'Sight Words ป.1–3', features: ['แยกชั้น ป.1–3', 'แฟลชการ์ด', 'TTS', 'ฝึกเลือกความหมาย'], version: 'v1.0.0', notes: 'E2 · Media Batch Y' },
  },
  {
    external_url: '/games/math/clock-media.html',
    thumbnail_url: '/games/math/clock-media-cover.png',
    title: '🕐 นาฬิกาบอกเวลา',
    description: 'สื่อการสอนคณิตศาสตร์ ป.1–4 — เลื่อนเข็มสั้น–ยาว · อ่านเวลา · ฝึกเลือกคำตอบ · ไม่เก็บคะแนน',
    subject: 'คณิตศาสตร์', grade_levels: ['ป.1', 'ป.2', 'ป.3', 'ป.4'],
    tags: ['นาฬิกา', 'เวลา', 'คณิตศาสตร์'], sort_order: 177,
    indicators: ['ค 2.1 ป.2/1', 'ค 2.1 ป.3/2', 'ค 2.1 ป.4/1'],
    docs: { game_format: 'นาฬิกาบอกเวลา', features: ['เลื่อนเข็ม', 'อธิบายเวลา', 'ฝึกเลือกคำตอบ'], version: 'v1.0.0', notes: 'M4 · Media Batch Y' },
  },
  {
    external_url: '/games/math/thai-money-media.html',
    thumbnail_url: '/games/math/thai-money-media-cover.png',
    title: '🪙 เงินไทย — บาทและสตางค์',
    description: 'สื่อการสอนคณิตศาสตร์ ป.1–3 — เหรียญ/ธนบัตร · บวกยอด · ฝึกจ่ายเงิน · คู่แนว cashier · ไม่เก็บคะแนน',
    subject: 'คณิตศาสตร์', grade_levels: ['ป.1', 'ป.2', 'ป.3'],
    tags: ['เงิน', 'บาท', 'สตางค์', 'คณิตศาสตร์'], sort_order: 178,
    indicators: ['ค 2.1 ป.3/1'],
    docs: { game_format: 'เงินไทย', features: ['เหรียญ/ธนบัตร', 'บวกยอด', 'ฝึกจ่ายเงิน'], version: 'v1.0.0', notes: 'M5 · Media Batch Y' },
  },
  {
    external_url: '/games/health/brush-teeth-media.html',
    thumbnail_url: '/games/health/brush-teeth-media-cover.png',
    title: '🪥 แปรงฟันถูกวิธี',
    description: 'สื่อการสอนสุขศึกษา ป.3 — 6 ขั้นตอนแปรงฟัน · เล่นวน · เรียงลำดับ · ไม่เก็บคะแนน',
    subject: 'สุขศึกษา', grade_levels: ['ป.3'],
    tags: ['แปรงฟัน', 'สุขศึกษา', 'อนามัยช่องปาก'], sort_order: 179,
    indicators: ['พ 4.1 ป.3/4'],
    docs: { game_format: 'แปรงฟัน 6 ขั้น', features: ['เรียนรู้ทีละขั้น', 'เล่นวน', 'เรียงลำดับ'], version: 'v1.0.0', notes: 'H2 · Media Batch Y' },
  },
  {
    external_url: '/games/science/light-properties-media.html',
    thumbnail_url: '/games/science/light-properties-media-cover.png',
    title: '💡 สมบัติของแสง',
    description: 'สื่อการสอนวิทยาศาสตร์ ป.4 — ทึบแสง · ผ่านแสงบางส่วน · โปร่งใส · จัดกลุ่มวัตถุ · ฝึกจำแนก · ไม่เก็บคะแนน',
    subject: 'วิทยาศาสตร์', grade_levels: ['ป.4'],
    tags: ['แสง', 'ทึบแสง', 'โปร่งใส', 'วิทยาศาสตร์'], sort_order: 180,
    indicators: ['ว 2.3 ป.4/1'],
    docs: { game_format: 'สมบัติของแสง', features: ['ทึบ/ผ่านบางส่วน/โปร่งใส', 'จัดกลุ่มวัตถุ', 'ฝึกจำแนก'], version: 'v1.0.0', notes: 'Light · Media Batch Y' },
  },
];

for (const it of items) {
  const payload = {
    owner_staff_id: staff.id,
    category_id: cat.id,
    item_type: 'link',
    title: it.title,
    description: it.description,
    external_url: it.external_url,
    thumbnail_url: it.thumbnail_url,
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

console.log('done media batch Y');
