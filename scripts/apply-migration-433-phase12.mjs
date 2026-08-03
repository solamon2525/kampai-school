#!/usr/bin/env node
/** Apply Phase 12 — ป.ต้น daily-use 10+10 (migration 433) */
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
const { data: wsCat } = await sb.from('educational_hub_categories').select('id').eq('category_key', 'worksheets').eq('is_active', true).maybeSingle();
if (!staff || !mediaCat || !wsCat) { console.error('staff/cats missing'); process.exit(1); }
await sb.from('educational_hub_profiles').upsert({ staff_id: staff.id, is_hub_active: true }, { onConflict: 'staff_id' });

const mediaItems = [
  {
    external_url: '/games/thai/word-blend-media.html', thumbnail_url: '/games/thai/word-blend-media-cover.png',
    title: '🔤 ประสมคำ ป.ต้น', description: 'สื่อภาษาไทย ป.1–2 — ประสมพยัญชนะกับสระ · ตัวใหญ่ · ฝึกตอบ · ไม่เก็บคะแนน',
    subject: 'ภาษาไทย', grade_levels: ['ป.1', 'ป.2'], tags: ['ประสมคำ', 'ป.ต้น', 'Phase12'], sort_order: 220,
    indicators: ['ท 1.1 ป.1/1', 'ท 1.1 ป.1/2', 'ท 1.1 ป.2/1'],
    docs: { game_format: 'ประสมคำ ป.ต้น', features: ['6 ชุดประสม', 'โหมดฝึก', 'รอยประ'], version: 'v1.0.0', notes: 'Phase 12' },
  },
  {
    external_url: '/games/thai/read-write-fluency-media.html', thumbnail_url: '/games/thai/read-write-fluency-media-cover.png',
    title: '📖 อ่านคล่อง · เขียนคล่อง', description: 'สื่อภาษาไทย ป.1–2 — อ่านซ้ำ คัดลายมือ ประโยคสั้น · ไม่เก็บคะแนน',
    subject: 'ภาษาไทย', grade_levels: ['ป.1', 'ป.2'], tags: ['อ่านคล่อง', 'เขียนคล่อง', 'Phase12'], sort_order: 221,
    indicators: ['ท 1.1 ป.1/3', 'ท 1.1 ป.2/2', 'ท 2.1 ป.1/1'],
    docs: { game_format: 'อ่าน-เขียนคล่อง', features: ['6 ทักษะ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 12' },
  },
  {
    external_url: '/games/thai/basic-vocab-p12-media.html', thumbnail_url: '/games/thai/basic-vocab-p12-media-cover.png',
    title: '📚 คำพื้นฐานใกล้ตัว', description: 'สื่อภาษาไทย ป.1–2 — คำบ้าน อาหาร สัตว์ ธรรมชาติ · ไม่เก็บคะแนน',
    subject: 'ภาษาไทย', grade_levels: ['ป.1', 'ป.2'], tags: ['คำพื้นฐาน', 'ป.ต้น', 'Phase12'], sort_order: 222,
    indicators: ['ท 1.1 ป.1/4', 'ท 1.1 ป.2/3'],
    docs: { game_format: 'คำพื้นฐาน ป.ต้น', features: ['6 หมวด', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 12' },
  },
  {
    external_url: '/games/math/numbers-1-100-media.html', thumbnail_url: '/games/math/numbers-1-100-media-cover.png',
    title: '🔢 จำนวนนับ 1–100', description: 'สื่อคณิต ป.1–2 — นับ เปรียบเทียบ เรียงลำดับ · ไม่เก็บคะแนน',
    subject: 'คณิตศาสตร์', grade_levels: ['ป.1', 'ป.2'], tags: ['จำนวน', '1-100', 'Phase12'], sort_order: 223,
    indicators: ['ค 1.1 ป.1/1', 'ค 1.1 ป.1/2', 'ค 1.1 ป.1/3'],
    docs: { game_format: 'จำนวน 1–100', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 12' },
  },
  {
    external_url: '/games/math/add-sub-within-100-media.html', thumbnail_url: '/games/math/add-sub-within-100-media-cover.png',
    title: '➕➖ บวก–ลบ ไม่เกิน 100', description: 'สื่อคณิต ป.1–2 — บวกลบและโจทย์สั้น · ไม่เก็บคะแนน',
    subject: 'คณิตศาสตร์', grade_levels: ['ป.1', 'ป.2'], tags: ['บวกลบ', 'ป.ต้น', 'Phase12'], sort_order: 224,
    indicators: ['ค 1.1 ป.1/4', 'ค 1.1 ป.1/5', 'ค 1.1 ป.2/1'],
    docs: { game_format: 'บวกลบ ≤100', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 12' },
  },
  {
    external_url: '/games/math/basic-shapes-p12-media.html', thumbnail_url: '/games/math/basic-shapes-p12-media-cover.png',
    title: '⬛ รูปทรงพื้นฐาน', description: 'สื่อคณิต ป.1–2 — วงกลม สี่เหลี่ยม สามเหลี่ยม · ไม่เก็บคะแนน',
    subject: 'คณิตศาสตร์', grade_levels: ['ป.1', 'ป.2'], tags: ['รูปทรง', 'ป.ต้น', 'Phase12'], sort_order: 225,
    indicators: ['ค 2.2 ป.1/1', 'ค 2.2 ป.2/1'],
    docs: { game_format: 'รูปทรงพื้นฐาน', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 12' },
  },
  {
    external_url: '/games/english/alphabet-phonics-media.html', thumbnail_url: '/games/english/alphabet-phonics-media-cover.png',
    title: '🔤 ABC & Phonics', description: 'สื่ออังกฤษ ป.1–2 — ตัวอักษรและเสียงต้น · ไม่เก็บคะแนน',
    subject: 'ภาษาอังกฤษ', grade_levels: ['ป.1', 'ป.2'], tags: ['phonics', 'ABC', 'Phase12'], sort_order: 226,
    indicators: ['ต 1.1 ป.1/2', 'ต 1.1 ป.2/2'],
    docs: { game_format: 'ABC Phonics', features: ['6 ตัวอักษร', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 12' },
  },
  {
    external_url: '/games/english/sight-words-daily-media.html', thumbnail_url: '/games/english/sight-words-daily-media-cover.png',
    title: '👁️ Sight Words ใช้ทุกวัน', description: 'สื่ออังกฤษ ป.1–2 — คำใช้บ่อย I you we the to and · ไม่เก็บคะแนน',
    subject: 'ภาษาอังกฤษ', grade_levels: ['ป.1', 'ป.2'], tags: ['sight words', 'daily', 'Phase12'], sort_order: 227,
    indicators: ['ต 1.1 ป.1/3', 'ต 1.1 ป.2/1'],
    docs: { game_format: 'Sight Words Daily', features: ['6 กลุ่มคำ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 12' },
  },
  {
    external_url: '/games/science/living-nonliving-media.html', thumbnail_url: '/games/science/living-nonliving-media-cover.png',
    title: '🌱 สิ่งมีชีวิต · สิ่งไม่มีชีวิต', description: 'สื่อวิทย์ ป.1–2 — จำแนกสิ่งมีชีวิต/ไม่มีชีวิต · ไม่เก็บคะแนน',
    subject: 'วิทยาศาสตร์', grade_levels: ['ป.1', 'ป.2'], tags: ['สิ่งมีชีวิต', 'ป.ต้น', 'Phase12'], sort_order: 228,
    indicators: ['ว 1.1 ป.1/1', 'ว 1.3 ป.2/1'],
    docs: { game_format: 'สิ่งมีชีวิต-ไม่มีชีวิต', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 12' },
  },
  {
    external_url: '/games/science/materials-around-media.html', thumbnail_url: '/games/science/materials-around-media-cover.png',
    title: '🧱 วัสดุรอบตัว', description: 'สื่อวิทย์ ป.1–2 — ไม้ ผ้า พลาสติก โลหะ สมบัติ · ไม่เก็บคะแนน',
    subject: 'วิทยาศาสตร์', grade_levels: ['ป.1', 'ป.2'], tags: ['วัสดุ', 'ป.ต้น', 'Phase12'], sort_order: 229,
    indicators: ['ว 2.1 ป.1/1', 'ว 2.1 ป.1/2', 'ว 2.1 ป.2/1'],
    docs: { game_format: 'วัสดุรอบตัว', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 12' },
  },
];

const worksheets = [
  ['/games/thai/word-blend-media.html', '/games/thai/word-blend-worksheet.html', '📝 ใบงานประสมคำ', 'ใบงาน A4 ป.ต้น คู่สื่อประสมคำ — ตัวใหญ่ รอยประ', '/games/thai/word-blend-media-cover.png', 'ภาษาไทย', ['ป.1', 'ป.2'], 230],
  ['/games/thai/read-write-fluency-media.html', '/games/thai/read-write-fluency-worksheet.html', '📝 ใบงานอ่านคล่องเขียนคล่อง', 'ใบงาน A4 ป.ต้น คู่สื่ออ่าน-เขียนคล่อง', '/games/thai/read-write-fluency-media-cover.png', 'ภาษาไทย', ['ป.1', 'ป.2'], 231],
  ['/games/thai/basic-vocab-p12-media.html', '/games/thai/basic-vocab-p12-worksheet.html', '📝 ใบงานคำพื้นฐาน', 'ใบงาน A4 ป.ต้น คู่สื่อคำพื้นฐาน', '/games/thai/basic-vocab-p12-media-cover.png', 'ภาษาไทย', ['ป.1', 'ป.2'], 232],
  ['/games/math/numbers-1-100-media.html', '/games/math/numbers-1-100-worksheet.html', '📝 ใบงานจำนวน 1–100', 'ใบงาน A4 ป.ต้น คู่สื่อจำนวน 1–100', '/games/math/numbers-1-100-media-cover.png', 'คณิตศาสตร์', ['ป.1', 'ป.2'], 233],
  ['/games/math/add-sub-within-100-media.html', '/games/math/add-sub-within-100-worksheet.html', '📝 ใบงานบวกลบไม่เกิน 100', 'ใบงาน A4 ป.ต้น คู่สื่อบวกลบ', '/games/math/add-sub-within-100-media-cover.png', 'คณิตศาสตร์', ['ป.1', 'ป.2'], 234],
  ['/games/math/basic-shapes-p12-media.html', '/games/math/basic-shapes-p12-worksheet.html', '📝 ใบงานรูปทรงพื้นฐาน', 'ใบงาน A4 ป.ต้น คู่สื่อรูปทรง', '/games/math/basic-shapes-p12-media-cover.png', 'คณิตศาสตร์', ['ป.1', 'ป.2'], 235],
  ['/games/english/alphabet-phonics-media.html', '/games/english/alphabet-phonics-worksheet.html', '📝 ใบงาน ABC Phonics', 'ใบงาน A4 ป.ต้น คู่สื่อ ABC Phonics', '/games/english/alphabet-phonics-media-cover.png', 'ภาษาอังกฤษ', ['ป.1', 'ป.2'], 236],
  ['/games/english/sight-words-daily-media.html', '/games/english/sight-words-daily-worksheet.html', '📝 ใบงาน Sight Words Daily', 'ใบงาน A4 ป.ต้น คู่สื่อ Sight Words Daily', '/games/english/sight-words-daily-media-cover.png', 'ภาษาอังกฤษ', ['ป.1', 'ป.2'], 237],
  ['/games/science/living-nonliving-media.html', '/games/science/living-nonliving-worksheet.html', '📝 ใบงานสิ่งมีชีวิต-ไม่มีชีวิต', 'ใบงาน A4 ป.ต้น คู่สื่อสิ่งมีชีวิต', '/games/science/living-nonliving-media-cover.png', 'วิทยาศาสตร์', ['ป.1', 'ป.2'], 238],
  ['/games/science/materials-around-media.html', '/games/science/materials-around-worksheet.html', '📝 ใบงานวัสดุรอบตัว', 'ใบงาน A4 ป.ต้น คู่สื่อวัสดุรอบตัว', '/games/science/materials-around-media-cover.png', 'วิทยาศาสตร์', ['ป.1', 'ป.2'], 239],
];

async function upsertMedia(it) {
  const payload = {
    owner_staff_id: staff.id, category_id: mediaCat.id, item_type: 'link',
    title: it.title, description: it.description, external_url: it.external_url,
    thumbnail_url: it.thumbnail_url, subject: it.subject, grade_levels: it.grade_levels,
    tags: it.tags, sort_order: it.sort_order, tracked_game: false, is_published: true,
  };
  const { data: existing } = await sb.from('educational_hub_items').select('id')
    .eq('owner_staff_id', staff.id).eq('external_url', it.external_url).maybeSingle();
  let itemId = existing?.id;
  if (!existing) {
    const { data, error } = await sb.from('educational_hub_items').insert(payload).select('id').single();
    if (error) throw error;
    itemId = data.id;
    console.log('MEDIA INSERT', it.external_url);
  } else {
    const { error } = await sb.from('educational_hub_items').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', existing.id);
    if (error) throw error;
    console.log('MEDIA UPDATE', it.external_url);
  }
  const { data: inds } = await sb.from('curriculum_indicators').select('id, indicator_code').in('indicator_code', it.indicators);
  for (const code of it.indicators) {
    const ind = (inds || []).find((r) => r.indicator_code === code);
    if (!ind) { console.warn('MISS', code); continue; }
    await sb.from('indicator_games').upsert(
      { edu_hub_item_id: itemId, indicator_id: ind.id },
      { onConflict: 'edu_hub_item_id,indicator_id', ignoreDuplicates: true },
    );
    console.log('LINK', code);
  }
  await sb.from('game_docs').upsert({
    item_id: itemId, owner_staff_id: staff.id,
    game_format: it.docs.game_format, features: it.docs.features,
    version: it.docs.version, notes: it.docs.notes,
  }, { onConflict: 'item_id' });
}

async function upsertWorksheet(row, codes) {
  const [, worksheetUrl, title, description, thumb, subject, grades, sortOrder] = row;
  const payload = {
    owner_staff_id: staff.id, category_id: wsCat.id, item_type: 'link',
    title, description, external_url: worksheetUrl, thumbnail_url: thumb,
    subject, grade_levels: grades, tags: ['ใบงาน', 'Phase12', 'ป.ต้น', 'พิมพ์ได้'],
    sort_order: sortOrder, tracked_game: false, is_published: true,
  };
  const { data: existing } = await sb.from('educational_hub_items').select('id')
    .eq('owner_staff_id', staff.id).eq('external_url', worksheetUrl).maybeSingle();
  let itemId = existing?.id;
  if (!existing) {
    const { data, error } = await sb.from('educational_hub_items').insert(payload).select('id').single();
    if (error) throw error;
    itemId = data.id;
    console.log('WS INSERT', worksheetUrl);
  } else {
    await sb.from('educational_hub_items').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', existing.id);
    console.log('WS UPDATE', worksheetUrl);
  }
  if (codes?.length) {
    const { data: inds } = await sb.from('curriculum_indicators').select('id, indicator_code').in('indicator_code', codes);
    for (const code of codes) {
      const ind = (inds || []).find((r) => r.indicator_code === code);
      if (!ind) continue;
      await sb.from('indicator_games').upsert(
        { edu_hub_item_id: itemId, indicator_id: ind.id },
        { onConflict: 'edu_hub_item_id,indicator_id', ignoreDuplicates: true },
      );
    }
  }
  await sb.from('game_docs').upsert({
    item_id: itemId, owner_staff_id: staff.id,
    game_format: title.replace(/^📝\s*/, ''),
    features: ['พิมพ์ A4', 'ตัวใหญ่', 'รอยประ/ลากเส้น', 'QR คู่สื่อ'],
    version: 'v1.0.0', notes: `Phase 12 worksheet · ${row[0]}`,
  }, { onConflict: 'item_id' });
}

for (const it of mediaItems) await upsertMedia(it);
for (const row of worksheets) {
  const media = mediaItems.find((m) => m.external_url === row[0]);
  await upsertWorksheet(row, media?.indicators || []);
}
console.log('done Phase 12 seed (433)');
