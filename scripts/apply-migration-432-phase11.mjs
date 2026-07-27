#!/usr/bin/env node
/** Apply Phase 11 — 10 media + 10 worksheets (migration 432) */
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
if (!staff || !mediaCat || !wsCat) { console.error('staff/cats missing', { staff: !!staff, mediaCat: !!mediaCat, wsCat: !!wsCat }); process.exit(1); }
await sb.from('educational_hub_profiles').upsert({ staff_id: staff.id, is_hub_active: true }, { onConflict: 'staff_id' });

const mediaItems = [
  {
    external_url: '/games/arts/visual-elements-media.html',
    thumbnail_url: '/games/arts/visual-elements-media-cover.png',
    title: '🎨 ทัศนธาตุในงานศิลปะ',
    description: 'สื่อศิลปะ ป.2–4 — เส้น รูปทรง สี พื้นผิว ค่าน้ำหนัก พื้นที่ว่าง · ฝึกตอบ · ไม่เก็บคะแนน',
    subject: 'ศิลปะ', grade_levels: ['ป.2', 'ป.3', 'ป.4'], tags: ['ทัศนธาตุ', 'ศิลปะ', 'Phase11'], sort_order: 200,
    indicators: ['ศ 1.1 ป.2/2', 'ศ 1.1 ป.3/3', 'ศ 1.1 ป.4/3'],
    docs: { game_format: 'ทัศนธาตุ', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 11 · ศิลปะ' },
  },
  {
    external_url: '/games/arts/rhythm-music-media.html',
    thumbnail_url: '/games/arts/rhythm-music-media-cover.png',
    title: '🥁 จังหวะและดนตรีพื้นฐาน',
    description: 'สื่อศิลปะ ป.1–3 — จังหวะ ทำนอง เครื่องดนตรี · ฝึกตอบ · ไม่เก็บคะแนน',
    subject: 'ศิลปะ', grade_levels: ['ป.1', 'ป.2', 'ป.3'], tags: ['จังหวะ', 'ดนตรี', 'Phase11'], sort_order: 201,
    indicators: ['ศ 2.1 ป.1/2', 'ศ 2.1 ป.2/3', 'ศ 2.1 ป.3/2'],
    docs: { game_format: 'จังหวะดนตรี', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 11 · ศิลปะ' },
  },
  {
    external_url: '/games/arts/dance-basics-media.html',
    thumbnail_url: '/games/arts/dance-basics-media-cover.png',
    title: '💃 นาฏศิลป์พื้นฐาน',
    description: 'สื่อศิลปะ ป.1–3 — ท่าเตรียม ไหว้ จีบมือ ก้าวเท้า มารยาทเวที · ไม่เก็บคะแนน',
    subject: 'ศิลปะ', grade_levels: ['ป.1', 'ป.2', 'ป.3'], tags: ['นาฏศิลป์', 'ศิลปะ', 'Phase11'], sort_order: 202,
    indicators: ['ศ 3.1 ป.1/1', 'ศ 3.1 ป.2/1', 'ศ 3.1 ป.3/2'],
    docs: { game_format: 'นาฏศิลป์พื้นฐาน', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 11 · ศิลปะ' },
  },
  {
    external_url: '/games/career/home-crafts-media.html',
    thumbnail_url: '/games/career/home-crafts-media-cover.png',
    title: '🧵 งานบ้านและงานประดิษฐ์',
    description: 'สื่อการงาน ป.1–3 — เก็บกวาด ตัดปะ ความปลอดภัย · ไม่เก็บคะแนน',
    subject: 'การงานอาชีพ', grade_levels: ['ป.1', 'ป.2', 'ป.3'], tags: ['งานบ้าน', 'ประดิษฐ์', 'Phase11'], sort_order: 203,
    indicators: ['ง 1.1 ป.1/1', 'ง 1.1 ป.1/2', 'ง 1.1 ป.2/1'],
    docs: { game_format: 'งานบ้าน-ประดิษฐ์', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 11 · การงาน' },
  },
  {
    external_url: '/games/career/school-garden-media.html',
    thumbnail_url: '/games/career/school-garden-media-cover.png',
    title: '🌱 การเกษตรในโรงเรียน',
    description: 'สื่อการงาน ป.3–4 — ปลูก รดน้ำ ดูแลแปลง · ไม่เก็บคะแนน',
    subject: 'การงานอาชีพ', grade_levels: ['ป.3', 'ป.4'], tags: ['เกษตร', 'แปลงผัก', 'Phase11'], sort_order: 204,
    indicators: ['ง 1.1 ป.3/3', 'ง 1.1 ป.4/4'],
    docs: { game_format: 'เกษตรโรงเรียน', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 11 · การงาน' },
  },
  {
    external_url: '/games/career/food-nutrition-media.html',
    thumbnail_url: '/games/career/food-nutrition-media-cover.png',
    title: '🥗 อาหารและโภชนาการเบื้องต้น',
    description: 'สื่อการงาน ป.2–3 — กลุ่มอาหาร สุขลักษณะ · ไม่เก็บคะแนน',
    subject: 'การงานอาชีพ', grade_levels: ['ป.2', 'ป.3'], tags: ['โภชนาการ', 'อาหาร', 'Phase11'], sort_order: 205,
    indicators: ['ง 1.1 ป.2/1', 'ง 1.1 ป.3/1'],
    docs: { game_format: 'อาหาร-โภชนาการ', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 11 · การงาน' },
  },
  {
    external_url: '/games/tech/algorithm-unplugged-media.html',
    thumbnail_url: '/games/tech/algorithm-unplugged-media-cover.png',
    title: '🧭 อัลกอริทึมแบบไม่ใช้คอมพิวเตอร์',
    description: 'สื่อวิทยาการคำนวณ ป.1–3 — ลำดับ เงื่อนไข ทำซ้ำ ดีบัก · ไม่เก็บคะแนน',
    subject: 'วิทยาศาสตร์', grade_levels: ['ป.1', 'ป.2', 'ป.3'], tags: ['อัลกอริทึม', 'unplugged', 'Phase11'], sort_order: 206,
    indicators: ['ว 4.2 ป.1/2', 'ว 4.2 ป.2/1', 'ว 4.2 ป.3/1'],
    docs: { game_format: 'อัลกอริทึม unplugged', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 11 · เทคโนโลยี' },
  },
  {
    external_url: '/games/tech/data-presentation-media.html',
    thumbnail_url: '/games/tech/data-presentation-media-cover.png',
    title: '📊 ข้อมูลและการนำเสนอ',
    description: 'สื่อวิทยาการคำนวณ ป.3–4 — ตาราง กราฟ สรุปผล · ไม่เก็บคะแนน',
    subject: 'วิทยาศาสตร์', grade_levels: ['ป.3', 'ป.4'], tags: ['ข้อมูล', 'กราฟ', 'Phase11'], sort_order: 207,
    indicators: ['ว 4.2 ป.3/4', 'ว 4.2 ป.4/4'],
    docs: { game_format: 'ข้อมูล-นำเสนอ', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 11 · เทคโนโลยี' },
  },
  {
    external_url: '/games/social/thai-geography-media.html',
    thumbnail_url: '/games/social/thai-geography-media-cover.png',
    title: '🗺️ ภูมิศาสตร์ไทยเบื้องต้น',
    description: 'สื่อสังคม ป.3–4 — ทิศ ภาค ที่ตั้ง · ไม่เก็บคะแนน',
    subject: 'สังคมศึกษา', grade_levels: ['ป.3', 'ป.4'], tags: ['ภูมิศาสตร์', 'ภาค', 'Phase11'], sort_order: 208,
    indicators: ['ส 5.1 ป.3/1', 'ส 5.1 ป.3/2', 'ส 5.1 ป.4/1'],
    docs: { game_format: 'ภูมิศาสตร์ไทย', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 11 · สังคม' },
  },
  {
    external_url: '/games/social/citizen-duties-p123-media.html',
    thumbnail_url: '/games/social/citizen-duties-p123-media-cover.png',
    title: '🏛️ หน้าที่พลเมือง (ป.ต้น)',
    description: 'สื่อสังคม ป.1–3 — หน้าที่พลเมืองดีในโรงเรียน บ้าน สังคม · ไม่เก็บคะแนน',
    subject: 'สังคมศึกษา', grade_levels: ['ป.1', 'ป.2', 'ป.3'], tags: ['พลเมือง', 'หน้าที่', 'Phase11'], sort_order: 209,
    indicators: ['ส 2.1 ป.1/1', 'ส 2.1 ป.2/1', 'ส 2.2 ป.1/2'],
    docs: { game_format: 'หน้าที่พลเมือง ป.ต้น', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 11 · สังคม' },
  },
];

const worksheets = [
  ['/games/arts/visual-elements-media.html', '/games/arts/visual-elements-worksheet.html', '📝 ใบงานทัศนธาตุ', 'ใบงาน A4 คู่สื่อทัศนธาตุ', '/games/arts/visual-elements-media-cover.png', 'ศิลปะ', ['ป.2', 'ป.3', 'ป.4'], 210],
  ['/games/arts/rhythm-music-media.html', '/games/arts/rhythm-music-worksheet.html', '📝 ใบงานจังหวะดนตรี', 'ใบงาน A4 คู่สื่อจังหวะดนตรี', '/games/arts/rhythm-music-media-cover.png', 'ศิลปะ', ['ป.1', 'ป.2', 'ป.3'], 211],
  ['/games/arts/dance-basics-media.html', '/games/arts/dance-basics-worksheet.html', '📝 ใบงานนาฏศิลป์พื้นฐาน', 'ใบงาน A4 คู่สื่อนาฏศิลป์', '/games/arts/dance-basics-media-cover.png', 'ศิลปะ', ['ป.1', 'ป.2', 'ป.3'], 212],
  ['/games/career/home-crafts-media.html', '/games/career/home-crafts-worksheet.html', '📝 ใบงานงานบ้าน-ประดิษฐ์', 'ใบงาน A4 คู่สื่องานบ้าน-ประดิษฐ์', '/games/career/home-crafts-media-cover.png', 'การงานอาชีพ', ['ป.1', 'ป.2', 'ป.3'], 213],
  ['/games/career/school-garden-media.html', '/games/career/school-garden-worksheet.html', '📝 ใบงานเกษตรโรงเรียน', 'ใบงาน A4 คู่สื่อเกษตรโรงเรียน', '/games/career/school-garden-media-cover.png', 'การงานอาชีพ', ['ป.3', 'ป.4'], 214],
  ['/games/career/food-nutrition-media.html', '/games/career/food-nutrition-worksheet.html', '📝 ใบงานอาหาร-โภชนาการ', 'ใบงาน A4 คู่สื่อโภชนาการ', '/games/career/food-nutrition-media-cover.png', 'การงานอาชีพ', ['ป.2', 'ป.3'], 215],
  ['/games/tech/algorithm-unplugged-media.html', '/games/tech/algorithm-unplugged-worksheet.html', '📝 ใบงานอัลกอริทึม unplugged', 'ใบงาน A4 คู่สื่ออัลกอริทึม', '/games/tech/algorithm-unplugged-media-cover.png', 'วิทยาศาสตร์', ['ป.1', 'ป.2', 'ป.3'], 216],
  ['/games/tech/data-presentation-media.html', '/games/tech/data-presentation-worksheet.html', '📝 ใบงานข้อมูลและการนำเสนอ', 'ใบงาน A4 คู่สื่อข้อมูล-กราฟ', '/games/tech/data-presentation-media-cover.png', 'วิทยาศาสตร์', ['ป.3', 'ป.4'], 217],
  ['/games/social/thai-geography-media.html', '/games/social/thai-geography-worksheet.html', '📝 ใบงานภูมิศาสตร์ไทย', 'ใบงาน A4 คู่สื่อภูมิศาสตร์ไทย', '/games/social/thai-geography-media-cover.png', 'สังคมศึกษา', ['ป.3', 'ป.4'], 218],
  ['/games/social/citizen-duties-p123-media.html', '/games/social/citizen-duties-p123-worksheet.html', '📝 ใบงานหน้าที่พลเมือง ป.ต้น', 'ใบงาน A4 คู่สื่อหน้าที่พลเมือง', '/games/social/citizen-duties-p123-media-cover.png', 'สังคมศึกษา', ['ป.1', 'ป.2', 'ป.3'], 219],
];

async function upsertMedia(it) {
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
    console.log('MEDIA INSERT', it.external_url);
  } else {
    const { error } = await sb.from('educational_hub_items').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', existing.id);
    if (error) throw error;
    console.log('MEDIA UPDATE', it.external_url);
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
    else console.log('LINK', code);
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
  return itemId;
}

async function upsertWorksheet([sourceUrl, worksheetUrl, title, description, thumb, subject, grades, sortOrder], indicatorCodes) {
  const payload = {
    owner_staff_id: staff.id,
    category_id: wsCat.id,
    item_type: 'link',
    title,
    description,
    external_url: worksheetUrl,
    thumbnail_url: thumb,
    subject,
    grade_levels: grades,
    tags: ['ใบงาน', 'Phase11', 'พิมพ์ได้'],
    sort_order: sortOrder,
    tracked_game: false,
    is_published: true,
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
    const { error } = await sb.from('educational_hub_items').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', existing.id);
    if (error) throw error;
    console.log('WS UPDATE', worksheetUrl);
  }

  if (indicatorCodes?.length) {
    const { data: inds } = await sb.from('curriculum_indicators').select('id, indicator_code').in('indicator_code', indicatorCodes);
    for (const code of indicatorCodes) {
      const ind = (inds || []).find((r) => r.indicator_code === code);
      if (!ind) { console.warn('MISS WS indicator', code); continue; }
      await sb.from('indicator_games').upsert(
        { edu_hub_item_id: itemId, indicator_id: ind.id },
        { onConflict: 'edu_hub_item_id,indicator_id', ignoreDuplicates: true },
      );
    }
  }

  await sb.from('game_docs').upsert({
    item_id: itemId,
    owner_staff_id: staff.id,
    game_format: title.replace(/^📝\s*/, ''),
    features: ['พิมพ์ A4', 'สุ่มข้อ', 'เฉลยครู', 'QR คู่สื่อ'],
    version: 'v1.0.0',
    notes: `Phase 11 worksheet · pair ${sourceUrl}`,
  }, { onConflict: 'item_id' });
}

for (const it of mediaItems) await upsertMedia(it);
for (const row of worksheets) {
  const media = mediaItems.find((m) => m.external_url === row[0]);
  await upsertWorksheet(row, media?.indicators || []);
}

console.log('done Phase 11 seed (432)');
