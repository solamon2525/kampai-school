#!/usr/bin/env node
/** Apply migration 441 Batch 12 worksheets via service role */
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
  ['/games/english/grammar-mini.html', '/games/english/grammar-mini-worksheet.html', '📝 ใบงาน Grammar Mini ป.4', 'ใบงาน A4 คู่ Grammar Mini ฝึก is/are · a/an · demonstratives', '/games/english/grammar-mini-cover.png', 'ภาษาอังกฤษ', ['ป.4'], ['ใบงาน', 'grammar', 'อังกฤษ', 'พิมพ์ได้'], 171],
  ['/games/math/math-data-hub/index.html', '/games/math/math-data-hub-worksheet.html', '📝 ใบงานคลังข้อมูลและกราฟ ป.4–ป.5', 'ใบงาน A4 คู่คลังข้อมูล ฝึกตาราง แผนภูมิแท่ง และแผนภาพรูปภาพ', '/games/math/math-data-hub/cover.png', 'คณิตศาสตร์', ['ป.4', 'ป.5'], ['ใบงาน', 'hub', 'ข้อมูล', 'พิมพ์ได้'], 172],
  ['/games/english/english-grammar-p45-hub/index.html', '/games/english/english-grammar-p45-hub-worksheet.html', '📝 ใบงานคลัง English ป.4–ป.5', 'ใบงาน A4 คู่ English Hub ฝึก Grammar · Sight Words · Follow Instructions', '/games/english/english-grammar-p45-hub/cover.png', 'ภาษาอังกฤษ', ['ป.4', 'ป.5'], ['ใบงาน', 'hub', 'อังกฤษ', 'พิมพ์ได้'], 173],
  ['/games/science/science-p45-hub/index.html', '/games/science/science-p45-hub-worksheet.html', '📝 ใบงานคลังวิทย์ ป.4–ป.5', 'ใบงาน A4 คู่ Science Hub ฝึกสสาร วัฏจักรน้ำ สัตว์ และร่างกาย', '/games/science/science-p45-hub/cover.png', 'วิทยาศาสตร์', ['ป.4', 'ป.5'], ['ใบงาน', 'hub', 'วิทย์', 'พิมพ์ได้'], 174],
  ['/games/thai/thai-vocab-hub/index.html', '/games/thai/thai-vocab-hub-worksheet.html', '📝 ใบงานคลังคำศัพท์ไทย ป.4–ป.6', 'ใบงาน A4 คู่คลังคำศัพท์ ฝึกความหมาย คำพ้อง/ตรงข้าม และแต่งประโยค', '/games/thai/thai-vocab-hub/cover.png', 'ภาษาไทย', ['ป.4', 'ป.5', 'ป.6'], ['ใบงาน', 'hub', 'คำศัพท์', 'พิมพ์ได้'], 175],
];

const indicators = [
  ['/games/english/grammar-mini-worksheet.html', 'ต 2.1 ป.4/1'],
  ['/games/math/math-data-hub-worksheet.html', 'ค 3.1 ป.4/1'],
  ['/games/english/english-grammar-p45-hub-worksheet.html', 'ต 2.1 ป.4/1'],
  ['/games/english/english-grammar-p45-hub-worksheet.html', 'ต 1.1 ป.4/1'],
  ['/games/english/english-grammar-p45-hub-worksheet.html', 'ต 1.1 ป.4/2'],
  ['/games/science/science-p45-hub-worksheet.html', 'ว 2.1 ป.4/3'],
  ['/games/science/science-p45-hub-worksheet.html', 'ว 3.2 ป.5/3'],
  ['/games/science/science-p45-hub-worksheet.html', 'ว 1.3 ป.4/3'],
  ['/games/thai/thai-vocab-hub-worksheet.html', 'ท 4.1 ป.4/1'],
  ['/games/thai/thai-vocab-hub-worksheet.html', 'ท 4.1 ป.4/6'],
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
console.log('done migration 441');
