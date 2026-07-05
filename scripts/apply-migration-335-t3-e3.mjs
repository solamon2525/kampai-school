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
    external_url: '/games/thai/thai-word-types.html',
    thumbnail_url: '/games/thai/thai-word-types-cover.png',
    title: '📚 ชนิดของคำ — นาม · กริยา · คุณศัพท์',
    description: 'สื่อการสอนภาษาไทย ป.3-4 — เรียนรู้คำนาม คำกริยา คำคุณศัพท์ · โหมดฝึก · จัดคำใส่กล่อง · คู่เกม Attack on Noun',
    subject: 'ภาษาไทย',
    grade_levels: ['ป.3', 'ป.4'],
    tags: ['ชนิดของคำ', 'คำนาม', 'คำกริยา', 'คำคุณศัพท์', 'ไวยากรณ์'],
    sort_order: 72,
  },
  {
    external_url: '/games/english/grammar-mini.html',
    thumbnail_url: '/games/english/grammar-mini-cover.png',
    title: '📝 Grammar Mini — is/are · a/an',
    description: 'สื่อการสอนภาษาอังกฤษ ป.3-4 — กฎ is/are และ a/an พร้อมตัวอย่าง · โหมดฝึกเลือกคำตอบ (ไม่จับเวลา)',
    subject: 'ภาษาอังกฤษ',
    grade_levels: ['ป.3', 'ป.4'],
    tags: ['grammar', 'is are', 'a an', 'ภาษาอังกฤษ', 'ไวยากรณ์'],
    sort_order: 73,
  },
];

for (const item of items) {
  const payload = {
    owner_staff_id: staff.id,
    category_id: cat.id,
    item_type: 'link',
    tracked_game: false,
    is_published: true,
    ...item,
  };
  const { data: existing } = await sb.from('educational_hub_items').select('id')
    .eq('owner_staff_id', staff.id).eq('external_url', item.external_url).maybeSingle();
  if (!existing) {
    const { data, error } = await sb.from('educational_hub_items').insert(payload).select('title').single();
    if (error) throw error;
    console.log('INSERTED', data);
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
    }).eq('id', existing.id).select('title').single();
    if (error) throw error;
    console.log('UPDATED', data);
  }
}
