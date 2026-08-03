#!/usr/bin/env node
/** Apply Phase 13 — ป.6 + indicators (migration 434) + backfill old media links */
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
    external_url: '/games/math/percent-ratio-media.html', thumbnail_url: '/games/math/percent-ratio-media-cover.png',
    title: '📊 ร้อยละ · อัตราส่วน ป.6', description: 'สื่อคณิต ป.6 — อัตราส่วน ร้อยละ โจทย์วิธีคิด · ไม่เก็บคะแนน',
    subject: 'คณิตศาสตร์', grade_levels: ['ป.6'], tags: ['ร้อยละ', 'อัตราส่วน', 'Phase13', 'ป.6'], sort_order: 240,
    indicators: ['ค 1.1 ป.6/2', 'ค 1.1 ป.6/11', 'ค 1.1 ป.6/12'],
    docs: { game_format: 'ร้อยละ·อัตราส่วน ป.6', features: ['6 หัวข้อ', 'โหมดฝึก', 'ใบงานคู่'], version: 'v1.0.0', notes: 'Phase 13' },
  },
  {
    external_url: '/games/math/simple-equation-media.html', thumbnail_url: '/games/math/simple-equation-media-cover.png',
    title: '🧩 สมการอย่างง่าย · แบบรูป ป.6', description: 'สื่อคณิต ป.6 — หาค่าที่หายไป แบบรูป ตรวจคำตอบ · ไม่เก็บคะแนน',
    subject: 'คณิตศาสตร์', grade_levels: ['ป.6'], tags: ['สมการ', 'แบบรูป', 'Phase13', 'ป.6'], sort_order: 241,
    indicators: ['ค 1.2 ป.6/1'],
    docs: { game_format: 'สมการอย่างง่าย ป.6', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 13' },
  },
  {
    external_url: '/games/thai/rhetoric-literature-p6-media.html', thumbnail_url: '/games/thai/rhetoric-literature-p6-media-cover.png',
    title: '📜 โวหาร · วรรณคดี ป.6', description: 'สื่อไทย ป.6 — โวหาร ความหมายแฝง ข้อคิดวรรณกรรม · ไม่เก็บคะแนน',
    subject: 'ภาษาไทย', grade_levels: ['ป.6'], tags: ['โวหาร', 'วรรณคดี', 'Phase13', 'ป.6'], sort_order: 242,
    indicators: ['ท 1.1 ป.6/2', 'ท 5.1 ป.6/1', 'ท 5.1 ป.6/3'],
    docs: { game_format: 'โวหาร·วรรณคดี ป.6', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 13' },
  },
  {
    external_url: '/games/science/electric-circuit-media.html', thumbnail_url: '/games/science/electric-circuit-media-cover.png',
    title: '⚡ ไฟฟ้า · วงจรอย่างง่าย ป.6', description: 'สื่อวิทย์ ป.6 — ส่วนประกอบวงจร แผนภาพ อนุกรม/ขนาน · ไม่เก็บคะแนน',
    subject: 'วิทยาศาสตร์', grade_levels: ['ป.6'], tags: ['ไฟฟ้า', 'วงจร', 'Phase13', 'ป.6'], sort_order: 243,
    indicators: ['ว 2.3 ป.6/1', 'ว 2.3 ป.6/2', 'ว 2.3 ป.6/4'],
    docs: { game_format: 'ไฟฟ้า·วงจร ป.6', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 13' },
  },
  {
    external_url: '/games/science/body-systems-p6-media.html', thumbnail_url: '/games/science/body-systems-p6-media-cover.png',
    title: '🫀 สารอาหาร · ระบบย่อย ป.6', description: 'สื่อวิทย์ ป.6 — สารอาหาร ระบบย่อย การดูแล · ไม่เก็บคะแนน',
    subject: 'วิทยาศาสตร์', grade_levels: ['ป.6'], tags: ['ระบบย่อย', 'สารอาหาร', 'Phase13', 'ป.6'], sort_order: 244,
    indicators: ['ว 1.2 ป.6/1', 'ว 1.2 ป.6/4', 'ว 1.2 ป.6/5'],
    docs: { game_format: 'สารอาหาร·ระบบย่อย ป.6', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 13' },
  },
  {
    external_url: '/games/english/english-tenses-p6-media.html', thumbnail_url: '/games/english/english-tenses-p6-media-cover.png',
    title: '⏱️ Tenses รวม ป.6', description: 'สื่ออังกฤษ ป.6 — Present / Past / Future · ไม่เก็บคะแนน',
    subject: 'ภาษาอังกฤษ', grade_levels: ['ป.6'], tags: ['tenses', 'grammar', 'Phase13', 'ป.6'], sort_order: 245,
    indicators: ['ต 1.2 ป.6/1', 'ต 1.2 ป.6/4', 'ต 2.2 ป.6/1'],
    docs: { game_format: 'Tenses ป.6', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 13' },
  },
  {
    external_url: '/games/english/english-reading-p6-media.html', thumbnail_url: '/games/english/english-reading-p6-media-cover.png',
    title: '📖 Reading Comprehension ป.6', description: 'สื่ออังกฤษ ป.6 — อ่านจับใจความ ตอบคำถาม · ไม่เก็บคะแนน',
    subject: 'ภาษาอังกฤษ', grade_levels: ['ป.6'], tags: ['reading', 'comprehension', 'Phase13', 'ป.6'], sort_order: 246,
    indicators: ['ต 1.1 ป.6/2', 'ต 1.1 ป.6/3', 'ต 1.1 ป.6/4'],
    docs: { game_format: 'Reading ป.6', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 13' },
  },
  {
    external_url: '/games/social/economics-p6-media.html', thumbnail_url: '/games/social/economics-p6-media-cover.png',
    title: '💹 เศรษฐศาสตร์ ป.6', description: 'สื่อสังคม ป.6 — ผู้ผลิต ผู้บริโภค ทรัพยากรยั่งยืน · ไม่เก็บคะแนน',
    subject: 'สังคมศึกษา', grade_levels: ['ป.6'], tags: ['เศรษฐศาสตร์', 'Phase13', 'ป.6'], sort_order: 247,
    indicators: ['ส 3.1 ป.6/1', 'ส 3.1 ป.6/2', 'ส 3.1 ป.6/3', 'ส 3.2 ป.6/1'],
    docs: { game_format: 'เศรษฐศาสตร์ ป.6', features: ['6 หัวข้อ', 'โหมดฝึก'], version: 'v1.0.0', notes: 'Phase 13' },
  },
];

const worksheets = [
  ['/games/math/percent-ratio-media.html', '/games/math/percent-ratio-worksheet.html', '📝 ใบงานร้อยละ·อัตราส่วน', 'ใบงาน A4 ป.6 คู่สื่อร้อยละ·อัตราส่วน', '/games/math/percent-ratio-media-cover.png', 'คณิตศาสตร์', ['ป.6'], 248],
  ['/games/math/simple-equation-media.html', '/games/math/simple-equation-worksheet.html', '📝 ใบงานสมการอย่างง่าย', 'ใบงาน A4 ป.6 คู่สื่อสมการอย่างง่าย', '/games/math/simple-equation-media-cover.png', 'คณิตศาสตร์', ['ป.6'], 249],
  ['/games/thai/rhetoric-literature-p6-media.html', '/games/thai/rhetoric-literature-p6-worksheet.html', '📝 ใบงานโวหาร·วรรณคดี', 'ใบงาน A4 ป.6 คู่สื่อโวหาร·วรรณคดี', '/games/thai/rhetoric-literature-p6-media-cover.png', 'ภาษาไทย', ['ป.6'], 250],
  ['/games/science/electric-circuit-media.html', '/games/science/electric-circuit-worksheet.html', '📝 ใบงานไฟฟ้า·วงจร', 'ใบงาน A4 ป.6 คู่สื่อไฟฟ้า·วงจร', '/games/science/electric-circuit-media-cover.png', 'วิทยาศาสตร์', ['ป.6'], 251],
  ['/games/science/body-systems-p6-media.html', '/games/science/body-systems-p6-worksheet.html', '📝 ใบงานสารอาหาร·ระบบย่อย', 'ใบงาน A4 ป.6 คู่สื่อระบบร่างกาย', '/games/science/body-systems-p6-media-cover.png', 'วิทยาศาสตร์', ['ป.6'], 252],
  ['/games/english/english-tenses-p6-media.html', '/games/english/english-tenses-p6-worksheet.html', '📝 ใบงาน Tenses ป.6', 'ใบงาน A4 ป.6 คู่สื่อ Tenses', '/games/english/english-tenses-p6-media-cover.png', 'ภาษาอังกฤษ', ['ป.6'], 253],
  ['/games/english/english-reading-p6-media.html', '/games/english/english-reading-p6-worksheet.html', '📝 ใบงาน Reading ป.6', 'ใบงาน A4 ป.6 คู่สื่อ Reading', '/games/english/english-reading-p6-media-cover.png', 'ภาษาอังกฤษ', ['ป.6'], 254],
  ['/games/social/economics-p6-media.html', '/games/social/economics-p6-worksheet.html', '📝 ใบงานเศรษฐศาสตร์ ป.6', 'ใบงาน A4 ป.6 คู่สื่อเศรษฐศาสตร์', '/games/social/economics-p6-media-cover.png', 'สังคมศึกษา', ['ป.6'], 255],
];

/** Backfill indicator links for older media that often lack mappings */
const BACKFILL = [
  ['/games/science/digestive-system-media.html', ['ว 1.2 ป.6/4', 'ว 1.2 ป.6/5']],
  ['/games/science/human-organs-media.html', ['ว 1.2 ป.6/4', 'ว 1.2 ป.4/1']],
  ['/games/math/decimal-media.html', ['ค 1.1 ป.6/9', 'ค 1.1 ป.6/10']],
  ['/games/math/math-word-problem-media.html', ['ค 1.1 ป.6/10', 'ค 1.1 ป.6/12']],
  ['/games/science/light-properties-media.html', ['ว 2.3 ป.6/7', 'ว 2.3 ป.6/8']],
  ['/games/thai/literature-short-media.html', ['ท 5.1 ป.6/1', 'ท 5.1 ป.6/3']],
  ['/games/social/sufficiency-media.html', ['ส 3.1 ป.4/3', 'ส 3.1 ป.5/2']],
  ['/games/math/geometry-3d-media.html', ['ค 2.2 ป.6/3', 'ค 2.2 ป.6/4']],
  ['/games/math/bar-chart-media.html', ['ค 3.1 ป.6/1']],
  ['/games/math/thai-money-media.html', ['ค 1.1 ป.4/1', 'ส 3.1 ป.4/2']],
  ['/games/english/classroom-english-media.html', ['ต 4.1 ป.6/1', 'ต 1.2 ป.6/2']],
  ['/games/english/sight-words-p123-media.html', ['ต 1.1 ป.3/1', 'ต 1.1 ป.2/1']],
  ['/games/health/food-groups-media.html', ['ว 1.2 ป.6/1', 'ว 1.2 ป.6/2']],
  ['/games/science/moon-phases-media.html', ['ว 3.1 ป.6/1']],
  ['/games/social/thai-geography-media.html', ['ส 5.2 ป.6/1']],
  ['/games/tech/algorithm-unplugged-media.html', ['ว 4.2 ป.6/1', 'ว 4.2 ป.6/2']],
  ['/games/tech/data-presentation-media.html', ['ว 4.2 ป.6/3']],
  ['/games/career/food-nutrition-media.html', ['ว 1.2 ป.6/2', 'ว 1.2 ป.6/3']],
  ['/games/math/clock-media.html', ['ค 2.1 ป.4/1']],
  ['/games/math/rect-area-media.html', ['ค 2.1 ป.6/2']],
];

async function linkIndicators(itemId, codes) {
  if (!codes?.length) return;
  const { data: inds } = await sb.from('curriculum_indicators').select('id, indicator_code').in('indicator_code', codes);
  for (const code of codes) {
    const ind = (inds || []).find((r) => r.indicator_code === code);
    if (!ind) { console.warn('MISS', code); continue; }
    await sb.from('indicator_games').upsert(
      { edu_hub_item_id: itemId, indicator_id: ind.id },
      { onConflict: 'edu_hub_item_id,indicator_id', ignoreDuplicates: true },
    );
    console.log('LINK', code);
  }
}

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
  await linkIndicators(itemId, it.indicators);
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
    subject, grade_levels: grades, tags: ['ใบงาน', 'Phase13', 'ป.6', 'พิมพ์ได้'],
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
  await linkIndicators(itemId, codes);
  await sb.from('game_docs').upsert({
    item_id: itemId, owner_staff_id: staff.id,
    game_format: title.replace(/^📝\s*/, ''),
    features: ['พิมพ์ A4', 'วิธีทำ/เหตุผล', 'QR คู่สื่อ', 'เฉลยครู'],
    version: 'v1.0.0', notes: `Phase 13 worksheet · ${row[0]}`,
  }, { onConflict: 'item_id' });
}

async function backfillOldMedia() {
  for (const [externalUrl, codes] of BACKFILL) {
    const { data: item } = await sb.from('educational_hub_items').select('id')
      .eq('external_url', externalUrl).maybeSingle();
    if (!item) { console.log('BACKFILL SKIP (missing)', externalUrl); continue; }
    await linkIndicators(item.id, codes);
    console.log('BACKFILL', externalUrl);
  }
}

for (const it of mediaItems) await upsertMedia(it);
for (const row of worksheets) {
  const media = mediaItems.find((m) => m.external_url === row[0]);
  await upsertWorksheet(row, media?.indicators || []);
}
await backfillOldMedia();
console.log('done Phase 13 seed (434)');
