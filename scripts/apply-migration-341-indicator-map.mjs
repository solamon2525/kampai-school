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

const MAP = [
  ['/games/thai/thai-matra-chart.html', 'ท 4.1 ป.2/1'],
  ['/games/english/phonics-chart.html', 'ต 1.1 ป.1/2'],
  ['/games/english/phonics-chart.html', 'ต 2.2 ป.1/1'],
  ['/games/thai/thai-grammar-hub/index.html', 'ท 4.1 ป.4/2'],
  ['/games/thai/thai-grammar-hub/index.html', 'ท 4.1 ป.5/1'],
  ['/games/thai/thai-script-hub/index.html', 'ท 4.1 ป.1/1'],
  ['/games/thai/thai-script-hub/index.html', 'ท 4.1 ป.2/1'],
];

const { data: indicators } = await sb.from('curriculum_indicators').select('id, indicator_code').eq('is_active', true);
const codeToId = new Map((indicators || []).map((r) => [r.indicator_code, r.id]));
const urls = [...new Set(MAP.map(([u]) => u))];
const { data: items } = await sb.from('educational_hub_items').select('id, external_url')
  .in('external_url', urls).eq('tracked_game', false).eq('is_published', true);
const urlToId = new Map((items || []).map((r) => [r.external_url, r.id]));

for (const [extUrl, code] of MAP) {
  const itemId = urlToId.get(extUrl);
  const indId = codeToId.get(code);
  if (!itemId || !indId) { console.warn('SKIP', extUrl, code); continue; }
  const { error } = await sb.from('indicator_games').insert({ edu_hub_item_id: itemId, indicator_id: indId });
  if (error && !error.message.includes('duplicate')) throw error;
  console.log('MAP', extUrl, '→', code);
}
