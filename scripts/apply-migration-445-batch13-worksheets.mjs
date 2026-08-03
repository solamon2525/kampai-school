#!/usr/bin/env node
/** Apply migration 445 Batch 13 worksheets via service role */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(resolve(root, '.env.local'), 'utf8');
const url = env.match(/VITE_SUPABASE_URL="?([^\r\n"]+)/)?.[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="?([^\r\n"]+)/)?.[1];
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const specs = [
  ['/games/math/clock-media.html', '/games/math/clock-media-worksheet.html', '📝 ใบงานนาฬิกาบอกเวลา', 'ใบงาน A4 คู่สื่อนาฬิกา — อ่านเวลา วาดเข็ม โจทย์สถานการณ์', '/games/math/clock-media-cover.png', 'คณิตศาสตร์', ['ป.1', 'ป.2', 'ป.3', 'ป.4'], ['ใบงาน', 'นาฬิกา', 'พิมพ์ได้'], 186],
  ['/games/math/thai-money-media.html', '/games/math/thai-money-media-worksheet.html', '📝 ใบงานเงินไทย', 'ใบงาน A4 คู่สื่อเงินไทย — นับยอด ทอนเงิน เลือกจ่าย', '/games/math/thai-money-media-cover.png', 'คณิตศาสตร์', ['ป.1', 'ป.2', 'ป.3'], ['ใบงาน', 'เงิน', 'พิมพ์ได้'], 187],
  ['/games/math/geometry-3d-media.html', '/games/math/geometry-3d-media-worksheet.html', '📝 ใบงานเรขาคณิต 2D/3D', 'ใบงาน A4 คู่สื่อเรขา — นับหน้า/ขอบ/จุดยอด รูปคลี่', '/games/math/geometry-3d-media-cover.png', 'คณิตศาสตร์', ['ป.4', 'ป.5', 'ป.6'], ['ใบงาน', 'เรขาคณิต', 'พิมพ์ได้'], 188],
  ['/games/health/brush-teeth-media.html', '/games/health/brush-teeth-media-worksheet.html', '📝 ใบงานแปรงฟันถูกวิธี', 'ใบงาน A4 คู่สื่อแปรงฟัน — ลำดับขั้นตอนและอนามัยช่องปาก', '/games/health/brush-teeth-media-cover.png', 'สุขศึกษา', ['ป.3'], ['ใบงาน', 'แปรงฟัน', 'พิมพ์ได้'], 189],
  ['/games/science/light-properties-media.html', '/games/science/light-properties-media-worksheet.html', '📝 ใบงานสมบัติของแสง', 'ใบงาน A4 คู่สื่อแสง — ทึบแสง ผ่านบางส่วน โปร่งใส', '/games/science/light-properties-media-cover.png', 'วิทยาศาสตร์', ['ป.4'], ['ใบงาน', 'แสง', 'พิมพ์ได้'], 190],
  ['/games/english/sight-words-p123-media.html', '/games/english/sight-words-p123-media-worksheet.html', '📝 ใบงาน Sight Words ป.1–3', 'ใบงาน A4 คู่สื่อ Sight Words ป.1–3', '/games/english/sight-words-p123-media-cover.png', 'ภาษาอังกฤษ', ['ป.1', 'ป.2', 'ป.3'], ['ใบงาน', 'sight words', 'พิมพ์ได้'], 191],
  ['/games/english/classroom-english-media.html', '/games/english/classroom-english-media-worksheet.html', '📝 ใบงาน Classroom English', 'ใบงาน A4 คู่สื่อวลีในห้องเรียน', '/games/english/classroom-english-media-cover.png', 'ภาษาอังกฤษ', ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'], ['ใบงาน', 'classroom english', 'พิมพ์ได้'], 192],
  ['/games/thai/literature-short-media.html', '/games/thai/literature-short-media-worksheet.html', '📝 ใบงานวรรณคดีสั้น', 'ใบงาน A4 คู่สื่อวรรณคดีสั้น — ตัวละคร ข้อคิด', '/games/thai/literature-short-media-cover.png', 'ภาษาไทย', ['ป.4', 'ป.5', 'ป.6'], ['ใบงาน', 'วรรณคดี', 'พิมพ์ได้'], 193],
  ['/games/social/thai-calendar-media.html', '/games/social/thai-calendar-media-worksheet.html', '📝 ใบงานปฏิทินวันสำคัญไทย', 'ใบงาน A4 คู่สื่อปฏิทินวันสำคัญ', '/games/social/thai-calendar-media-cover.png', 'สังคมศึกษา', ['ป.1', 'ป.2', 'ป.3', 'ป.4', 'ป.5', 'ป.6'], ['ใบงาน', 'วันสำคัญ', 'พิมพ์ได้'], 194],
  ['/games/science/human-organs-media.html', '/games/science/human-organs-media-worksheet.html', '📝 ใบงานอวัยวะสำคัญ', 'ใบงาน A4 คู่สื่ออวัยวะ — หน้าที่และการดูแล', '/games/science/human-organs-media-cover.png', 'วิทยาศาสตร์', ['ป.4', 'ป.5', 'ป.6'], ['ใบงาน', 'อวัยวะ', 'พิมพ์ได้'], 195],
];

const indicators = [
  ['/games/math/clock-media-worksheet.html', 'ค 2.1 ป.2/1'],
  ['/games/math/clock-media-worksheet.html', 'ค 2.1 ป.3/2'],
  ['/games/math/clock-media-worksheet.html', 'ค 2.1 ป.4/1'],
  ['/games/math/thai-money-media-worksheet.html', 'ค 2.1 ป.3/1'],
  ['/games/math/geometry-3d-media-worksheet.html', 'ค 2.2 ป.5/4'],
  ['/games/math/geometry-3d-media-worksheet.html', 'ค 2.2 ป.6/3'],
  ['/games/math/geometry-3d-media-worksheet.html', 'ค 2.2 ป.6/4'],
  ['/games/health/brush-teeth-media-worksheet.html', 'พ 4.1 ป.3/4'],
  ['/games/science/light-properties-media-worksheet.html', 'ว 2.3 ป.4/1'],
  ['/games/english/sight-words-p123-media-worksheet.html', 'ต 1.1 ป.1/2'],
  ['/games/english/sight-words-p123-media-worksheet.html', 'ต 1.1 ป.2/2'],
  ['/games/english/classroom-english-media-worksheet.html', 'ต 1.1 ป.1/1'],
  ['/games/english/classroom-english-media-worksheet.html', 'ต 1.1 ป.2/1'],
  ['/games/english/classroom-english-media-worksheet.html', 'ต 1.2 ป.3/1'],
  ['/games/thai/literature-short-media-worksheet.html', 'ท 1.1 ป.4/5'],
  ['/games/thai/literature-short-media-worksheet.html', 'ท 1.1 ป.5/5'],
  ['/games/thai/literature-short-media-worksheet.html', 'ท 1.1 ป.6/4'],
  ['/games/social/thai-calendar-media-worksheet.html', 'ส 4.3 ป.4/1'],
  ['/games/social/thai-calendar-media-worksheet.html', 'ส 4.3 ป.5/1'],
  ['/games/social/thai-calendar-media-worksheet.html', 'ส 2.1 ป.3/1'],
  ['/games/science/human-organs-media-worksheet.html', 'ว 1.2 ป.4/1'],
  ['/games/science/human-organs-media-worksheet.html', 'ว 1.2 ป.6/1'],
];

const { data: wsCat, error: catErr } = await sb
  .from('educational_hub_categories')
  .select('id')
  .eq('category_key', 'worksheets')
  .eq('is_active', true)
  .limit(1)
  .maybeSingle();
if (catErr || !wsCat) throw catErr || new Error('worksheets category missing');

for (const [sourceUrl, worksheetUrl, title, description, thumb, subject, grades, tags, sortOrder] of specs) {
  const { data: source, error: srcErr } = await sb
    .from('educational_hub_items')
    .select('owner_staff_id')
    .eq('external_url', sourceUrl)
    .eq('is_published', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (srcErr) throw srcErr;
  if (!source?.owner_staff_id) throw new Error(`source not found: ${sourceUrl}`);

  const ownerId = source.owner_staff_id;
  const payload = {
    owner_staff_id: ownerId,
    category_id: wsCat.id,
    item_type: 'link',
    title,
    description,
    external_url: worksheetUrl,
    thumbnail_url: thumb,
    subject,
    grade_levels: grades,
    tags,
    sort_order: sortOrder,
    tracked_game: false,
    is_published: true,
  };

  const { data: existing } = await sb
    .from('educational_hub_items')
    .select('id')
    .eq('owner_staff_id', ownerId)
    .eq('external_url', worksheetUrl)
    .maybeSingle();

  if (!existing) {
    const { error } = await sb.from('educational_hub_items').insert(payload);
    if (error) throw error;
    console.log('INSERT', worksheetUrl);
  } else {
    const { error } = await sb.from('educational_hub_items').update({
      ...payload,
      updated_at: new Date().toISOString(),
    }).eq('id', existing.id);
    if (error) throw error;
    console.log('UPDATE', worksheetUrl);
  }
}

const urls = [...new Set(indicators.map(([u]) => u))];
const codes = [...new Set(indicators.map(([, c]) => c))];
const { data: items } = await sb.from('educational_hub_items').select('id, external_url').in('external_url', urls).eq('is_published', true).eq('tracked_game', false);
const { data: inds } = await sb.from('curriculum_indicators').select('id, indicator_code').in('indicator_code', codes);
const itemByUrl = new Map((items || []).map((r) => [r.external_url, r.id]));
const indByCode = new Map((inds || []).map((r) => [r.indicator_code, r.id]));

let linked = 0;
let missing = 0;
for (const [wUrl, code] of indicators) {
  const eduId = itemByUrl.get(wUrl);
  const indId = indByCode.get(code);
  if (!eduId || !indId) {
    console.warn('MISS', wUrl, code);
    missing++;
    continue;
  }
  const { error } = await sb.from('indicator_games').upsert(
    { edu_hub_item_id: eduId, indicator_id: indId },
    { onConflict: 'edu_hub_item_id,indicator_id', ignoreDuplicates: true },
  );
  if (error && String(error.code) !== '23505') throw error;
  linked++;
}
console.log(`indicators linked=${linked} missing=${missing}`);
console.log('done migration 445');
