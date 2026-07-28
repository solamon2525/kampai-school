#!/usr/bin/env node
/** Apply migration 440 literacy hub worksheets via service role */
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
  ['/games/thai/thai-reading-hub/index.html', '/games/thai/thai-reading-hub-worksheet.html', '📝 ใบงานคลังอ่านจับใจความ ป.4–ป.5', 'ใบงาน A4 คู่คลังอ่านจับใจความ ฝึกใจความ รายละเอียด อนุมาน และข้อเท็จจริง', '/games/thai/thai-reading-hub/cover.png', 'ภาษาไทย', ['ป.4', 'ป.5'], ['ใบงาน', 'hub', 'อ่าน', 'พิมพ์ได้'], 166],
  ['/games/thai/thai-writing-hub/index.html', '/games/thai/thai-writing-hub-worksheet.html', '📝 ใบงานคลังแต่งข้อความ ป.4–ป.5', 'ใบงาน A4 คู่คลังแต่งข้อความ ฝึกประโยค ย่อหน้า จดหมายสั้น และตรวจแก้', '/games/thai/thai-writing-hub/cover.png', 'ภาษาไทย', ['ป.4', 'ป.5'], ['ใบงาน', 'hub', 'เขียน', 'พิมพ์ได้'], 167],
  ['/games/thai/thai-poetry-hub/index.html', '/games/thai/thai-poetry-hub-worksheet.html', '📝 ใบงานคลังบทร้อยกรอง ป.4–ป.5', 'ใบงาน A4 คู่คลังบทร้อยกรอง ฝึกสัมผัส คำขวัญ และจำแนกร้อยแก้ว/ร้อยกรอง', '/games/thai/thai-poetry-hub/cover.png', 'ภาษาไทย', ['ป.4', 'ป.5'], ['ใบงาน', 'hub', 'ร้อยกรอง', 'พิมพ์ได้'], 168],
  ['/games/thai/thai-literature-hub/index.html', '/games/thai/thai-literature-hub-worksheet.html', '📝 ใบงานคลังวรรณคดีวรรณกรรม ป.4–ป.5', 'ใบงาน A4 คู่คลังวรรณคดี ฝึกนิทาน สุภาษิต ตัวละคร และข้อคิด', '/games/thai/thai-literature-hub/cover.png', 'ภาษาไทย', ['ป.4', 'ป.5'], ['ใบงาน', 'hub', 'วรรณคดี', 'พิมพ์ได้'], 169],
  ['/games/social/social-thailand-hub/index.html', '/games/social/social-thailand-hub-worksheet.html', '📝 ใบงานคลังสังคมศึกษาไทย ป.4–ป.5', 'ใบงาน A4 คู่คลังสังคมไทย ฝึกแผนที่ ประวัติศาสตร์อย่างง่าย และพลเมืองดี', '/games/social/social-thailand-hub/cover.png', 'สังคมศึกษา', ['ป.4', 'ป.5'], ['ใบงาน', 'hub', 'สังคม', 'พิมพ์ได้'], 170],
];

const indicators = [
  ['/games/thai/thai-reading-hub-worksheet.html', 'ท 1.1 ป.5/2'],
  ['/games/thai/thai-reading-hub-worksheet.html', 'ท 1.1 ป.5/3'],
  ['/games/thai/thai-writing-hub-worksheet.html', 'ท 2.1 ป.4/1'],
  ['/games/thai/thai-writing-hub-worksheet.html', 'ท 4.1 ป.5/3'],
  ['/games/thai/thai-poetry-hub-worksheet.html', 'ท 5.1 ป.4/4'],
  ['/games/thai/thai-poetry-hub-worksheet.html', 'ท 4.1 ป.4/5'],
  ['/games/thai/thai-literature-hub-worksheet.html', 'ท 5.1 ป.4/1'],
  ['/games/thai/thai-literature-hub-worksheet.html', 'ท 5.1 ป.4/2'],
  ['/games/social/social-thailand-hub-worksheet.html', 'ส 5.1 ป.4/1'],
  ['/games/social/social-thailand-hub-worksheet.html', 'ส 4.3 ป.4/1'],
  ['/games/social/social-thailand-hub-worksheet.html', 'ส 2.1 ป.4/1'],
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
console.log('done migration 440');
