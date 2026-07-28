#!/usr/bin/env node
/** Apply migration 436 — remap word-problem indicators (no ค 1.2 ป.4/1 in curriculum) */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(resolve(root, '.env.local'), 'utf8');
const url = env.match(/VITE_SUPABASE_URL="?([^\r\n"]+)/)?.[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="?([^\r\n"]+)/)?.[1];
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const pairs = [
  ['/games/math/math-word-problem-media.html', 'ค 1.1 ป.4/10'],
  ['/games/math/math-word-problem-worksheet.html', 'ค 1.1 ป.4/10'],
  ['/games/math/math-word-problem-hub/index.html', 'ค 1.1 ป.4/10'],
];

const urls = [...new Set(pairs.map(([u]) => u))];
const codes = [...new Set(pairs.map(([, c]) => c))];

const { data: items, error: iErr } = await sb
  .from('educational_hub_items')
  .select('id, external_url')
  .in('external_url', urls)
  .eq('is_published', true);
if (iErr) throw iErr;

const { data: inds, error: indErr } = await sb
  .from('curriculum_indicators')
  .select('id, indicator_code')
  .in('indicator_code', codes);
if (indErr) throw indErr;

const itemByUrl = new Map((items || []).map((r) => [r.external_url, r.id]));
const indByCode = new Map((inds || []).map((r) => [r.indicator_code, r.id]));

let linked = 0;
for (const [u, code] of pairs) {
  const eduId = itemByUrl.get(u);
  const indId = indByCode.get(code);
  if (!eduId || !indId) {
    console.warn('MISS', u, code);
    continue;
  }
  const { error } = await sb
    .from('indicator_games')
    .upsert(
      { edu_hub_item_id: eduId, indicator_id: indId },
      { onConflict: 'edu_hub_item_id,indicator_id', ignoreDuplicates: true },
    );
  if (error && String(error.code) !== '23505') throw error;
  linked++;
  console.log('OK', u, '↔', code);
}
console.log('linked', linked);
