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
    external_url: '/games/thai/sentence-structure.html',
    thumbnail_url: '/games/thai/sentence-structure-cover.png',
    title: '📝 โครงสร้างประโยค — ประธาน กริยา กรรม',
    description: 'สื่อการสอนภาษาไทย ป.3–5 — เรียนรู้โครงสร้างประโยค · เรียงคำให้ถูก · คู่เกม sentence-craft · ไม่เก็บคะแนน',
    subject: 'ภาษาไทย',
    grade_levels: ['ป.3', 'ป.4', 'ป.5'],
    tags: ['โครงสร้างประโยค', 'ประธาน', 'กริยา', 'กรรม', 'ภาษาไทย'],
    sort_order: 89,
    indicators: ['ท 4.1 ป.3/4', 'ท 4.1 ป.5/2'],
    docs: {
      game_format: 'โครงสร้างประโยค',
      features: ['โหมดเรียนรู้ ประธาน/กริยา/กรรม', 'โหมดเรียงประโยคแตะคำ', 'เฉลย + TTS optional', 'คู่ sentence-craft'],
      version: 'v1.0.0',
      notes: 'T5 · ท 4.1 ป.3/4 · ท 4.1 ป.5/2 · ไม่ทับ thai-sentence-hub',
    },
  },
  {
    external_url: '/games/science/food-chain-media.html',
    thumbnail_url: '/games/science/food-chain-media-cover.png',
    title: '🌿 ห่วงโซ่อาหาร — ผู้ผลิตถึงผู้ล่า',
    description: 'สื่อการสอนวิทยาศาสตร์ ป.4–5 — เรียนรู้บทบาทในโซ่อาหาร · เรียงตามการไหลของพลังงาน · คู่เกม food-chain',
    subject: 'วิทยาศาสตร์',
    grade_levels: ['ป.4', 'ป.5'],
    tags: ['ห่วงโซ่อาหาร', 'ผู้ผลิต', 'ผู้บริโภค', 'วิทยาศาสตร์'],
    sort_order: 90,
    indicators: ['ว 1.1 ป.5/3', 'ว 1.1 ป.5/2'],
    docs: {
      game_format: 'ห่วงโซ่อาหาร',
      features: ['อธิบายผู้ผลิต/ผู้บริโภค/ผู้ล่า', 'ตัวอย่างระบบนิเวศไทย', 'เรียงโซ่ตามพลังงาน', 'คู่ food-chain'],
      version: 'v1.0.0',
      notes: 'S4 · ว 1.1 ป.5/3',
    },
  },
  {
    external_url: '/games/career/waste-sort-media.html',
    thumbnail_url: '/games/career/waste-sort-media-cover.png',
    title: '♻️ คัดแยกขยะ 4 ถัง',
    description: 'สื่อการสอนการงานอาชีพ ป.1–4 — เรียนรู้ถังขยะมาตรฐานไทย · ฝึกแยกขยะ · คู่เกม waste-sort · ไม่เก็บคะแนน',
    subject: 'การงานอาชีพ',
    grade_levels: ['ป.1', 'ป.2', 'ป.3', 'ป.4'],
    tags: ['คัดแยกขยะ', 'รีไซเคิล', 'สิ่งแวดล้อม', 'การงานอาชีพ'],
    sort_order: 91,
    indicators: ['ง 1.1 ป.3/3', 'ง 1.1 ป.4/4'],
    docs: {
      game_format: 'คัดแยกขยะ 4 ถัง',
      features: ['ถังขยะ 4 สีมาตรฐานไทย', 'ฝึกแยกขยะ', 'เฉลย + คำอธิบาย', 'คู่ waste-sort'],
      version: 'v1.0.0',
      notes: 'O4 · ง 1.1 ป.3/3 · ง 1.1 ป.4/4',
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
    ...docs,
  }, { onConflict: 'item_id' });
  if (docsErr) console.warn('docs err', docsErr.message);
  else console.log('DOCS', item.external_url);
}

console.log('done');
