#!/usr/bin/env node
/** Apply Media Batch AA (444) via service role */
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
if (!staff || !mediaCat) { console.error('staff/media cat missing'); process.exit(1); }
await sb.from('educational_hub_profiles').upsert({ staff_id: staff.id, is_hub_active: true }, { onConflict: 'staff_id' });

const items = [
  {
    external_url: '/games/social/thai-calendar-media.html',
    thumbnail_url: '/games/social/thai-calendar-media-cover.png',
    title: '📅 ปฏิทินวันสำคัญไทย',
    description: 'สื่อการสอนสังคม ป.1–6 — วันสำคัญของชาติ/ประเพณี · อ่านรายละเอียด · ฝึกจำวันที่ · ไม่เก็บคะแนน',
    subject: 'สังคมศึกษา', grade_levels: ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'],
    tags: ['ปฏิทิน', 'วันสำคัญ', 'สังคม'], sort_order: 182,
    indicators: ['ส 4.3 ป.4/1', 'ส 4.3 ป.5/1', 'ส 2.1 ป.3/1'],
    docs: { game_format: 'ปฏิทินวันสำคัญไทย', features: ['รายการวันสำคัญ', 'รายละเอียด', 'โหมดฝึก'], version: 'v1.0.0', notes: 'O2 · Media Batch AA' },
  },
  {
    external_url: '/games/science/human-organs-media.html',
    thumbnail_url: '/games/science/human-organs-media-cover.png',
    title: '🫀 อวัยวะสำคัญของร่างกาย',
    description: 'สื่อการสอนวิทยาศาสตร์ ป.4–6 — หัวใจ ปอด สมอง กระเพาะ ตับ ไต ลำไส้ กระดูก · หน้าที่ · ฝึกจับคู่ · ต่อยอดจากกระดูก–กล้ามเนื้อ · ไม่เก็บคะแนน',
    subject: 'วิทยาศาสตร์', grade_levels: ['ป.4', 'ป.5', 'ป.6'],
    tags: ['อวัยวะ', 'ร่างกาย', 'วิทยาศาสตร์'], sort_order: 183,
    indicators: ['ว 1.2 ป.4/1', 'ว 1.2 ป.5/1', 'ว 1.2 ป.6/1'],
    docs: { game_format: 'อวัยวะสำคัญ', features: ['8 อวัยวะ', 'หน้าที่', 'โหมดฝึก'], version: 'v1.0.0', notes: 'S5 · Media Batch AA' },
  },
  {
    external_url: '/games/english/classroom-english-media.html',
    thumbnail_url: '/games/english/classroom-english-media-cover.png',
    title: '🗣️ Classroom English Phrases',
    description: 'สื่อการสอนภาษาอังกฤษ ป.1–6 — ทักทาย มารยาท ในห้องเรียน คำชม · TTS · ฝึกแปล · ไม่เก็บคะแนน',
    subject: 'ภาษาอังกฤษ', grade_levels: ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'],
    tags: ['classroom english', 'phrases', 'ภาษาอังกฤษ'], sort_order: 184,
    indicators: ['ต 1.1 ป.1/1', 'ต 1.1 ป.2/1', 'ต 1.2 ป.3/1'],
    docs: { game_format: 'Classroom English', features: ['4 หมวดวลี', 'TTS', 'โหมดฝึก'], version: 'v1.0.0', notes: 'E4 · Media Batch AA' },
  },
  {
    external_url: '/games/thai/literature-short-media.html',
    thumbnail_url: '/games/thai/literature-short-media-cover.png',
    title: '📖 ใบความรู้วรรณคดีสั้น',
    description: 'สื่อการสอนภาษาไทย ป.4–6 — สังข์ทอง · พระอภัยมณี · รามเกียรติ์ · นิทานพื้นบ้าน (ย่อ) · คำถามท้ายบท · ไม่เก็บคะแนน',
    subject: 'ภาษาไทย', grade_levels: ['ป.4', 'ป.5', 'ป.6'],
    tags: ['วรรณคดี', 'นิทาน', 'ภาษาไทย'], sort_order: 185,
    indicators: ['ท 1.1 ป.4/5', 'ท 1.1 ป.5/5', 'ท 1.1 ป.6/4'],
    docs: { game_format: 'วรรณคดีสั้น', features: ['4 เรื่องย่อ', 'คำถามท้ายบท', 'โหมดฝึก'], version: 'v1.0.0', notes: 'T6 · Media Batch AA' },
  },
];

for (const it of items) {
  const payload = {
    owner_staff_id: staff.id,
    category_id: mediaCat.id,
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

console.log('done media batch AA');
