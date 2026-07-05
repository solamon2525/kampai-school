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
  ['/games/math/decimal-media.html', 'ค 1.1 ป.4/5'],
  ['/games/math/decimal-media.html', 'ค 1.1 ป.4/6'],
  ['/games/science/states-of-matter.html', 'ว 2.1 ป.4/3'],
  ['/games/science/states-of-matter.html', 'ว 2.1 ป.4/4'],
  ['/games/social/thailand-map.html', 'ส 5.1 ป.4/1'],
  ['/games/social/thailand-map.html', 'ส 5.1 ป.4/2'],
  ['/games/english/sight-words-p4.html', 'ต 1.1 ป.4/2'],
  ['/games/thai/fact-opinion.html', 'ท 1.1 ป.4/4'],
  ['/games/thai/fact-opinion.html', 'ท 3.1 ป.4/1'],
  ['/games/math/bar-chart-media.html', 'ค 3.1 ป.4/1'],
  ['/games/social/good-citizen-media.html', 'ส 2.1 ป.4/1'],
  ['/games/science/vertebrate-sort.html', 'ว 1.3 ป.4/3'],
  ['/games/science/vertebrate-sort.html', 'ว 1.3 ป.4/4'],
  ['/games/math/angle-media.html', 'ค 2.2 ป.4/1'],
  ['/games/math/angle-media.html', 'ค 2.2 ป.4/2'],
  ['/games/social/sukhothai-timeline.html', 'ส 4.3 ป.4/1'],
  ['/games/social/sukhothai-timeline.html', 'ส 4.3 ป.4/2'],
  ['/games/social/sukhothai-timeline.html', 'ส 4.3 ป.4/3'],
  ['/games/health/food-label-media.html', 'พ 4.1 ป.4/3'],
  ['/games/english/follow-instructions.html', 'ต 1.1 ป.4/1'],
  ['/games/english/follow-instructions.html', 'ต 1.1 ป.4/3'],
  ['/games/math/number-line-media.html', 'ค 1.1 ป.1/2'],
  ['/games/math/number-line-media.html', 'ค 1.1 ป.2/1'],
  ['/games/math/number-line-media.html', 'ค 1.1 ป.3/1'],
  ['/games/science/digestive-system-media.html', 'ว 1.2 ป.6/4'],
  ['/games/science/digestive-system-media.html', 'ว 1.2 ป.6/5'],
  ['/games/science/digestive-system-media.html', 'พ 1.1 ป.5/1'],
  ['/games/health/handwash-media.html', 'พ 4.1 ป.1/1'],
  ['/games/health/handwash-media.html', 'ว 1.2 ป.1/2'],
  ['/games/math/rounding.html', 'ค 1.1 ป.4/7'],
  ['/games/math/math-fraction-hub/index.html', 'ค 1.1 ป.4/13'],
  ['/games/math/math-fraction-hub/index.html', 'ค 1.1 ป.4/14'],
  ['/games/math/fraction-pieces.html', 'ค 1.1 ป.4/3'],
  ['/games/math/fraction-pieces.html', 'ค 1.1 ป.4/4'],
  ['/games/math/times-table.html', 'ค 1.1 ป.2/5'],
  ['/games/math/times-table.html', 'ค 1.1 ป.3/6'],
  ['/games/math/times-table.html', 'ค 1.1 ป.4/9'],
  ['/games/thai/thai-word-types.html', 'ท 4.1 ป.4/2'],
  ['/games/thai/thai-word-types.html', 'ท 4.1 ป.4/6'],
  ['/games/english/grammar-mini.html', 'ต 2.1 ป.4/1'],
  ['/games/thai/thai-sara-chart.html', 'ท 4.1 ป.1/1'],
  ['/games/thai/thai-sara-chart.html', 'ท 4.1 ป.2/1'],
  ['/games/science/water-cycle.html', 'ว 3.2 ป.5/3'],
];

const { data: indicators } = await sb.from('curriculum_indicators')
  .select('id, indicator_code').eq('is_active', true);
const codeToId = new Map((indicators || []).map((r) => [r.indicator_code, r.id]));

const urls = [...new Set(MAP.map(([u]) => u))];
const { data: items } = await sb.from('educational_hub_items')
  .select('id, external_url')
  .in('external_url', urls)
  .eq('tracked_game', false)
  .eq('is_published', true);
const urlToId = new Map((items || []).map((r) => [r.external_url, r.id]));

let inserted = 0;
let skipped = 0;
for (const [extUrl, code] of MAP) {
  const itemId = urlToId.get(extUrl);
  const indId = codeToId.get(code);
  if (!itemId || !indId) {
    console.warn('SKIP missing', extUrl, code, { itemId: !!itemId, indId: !!indId });
    skipped++;
    continue;
  }
  const { error } = await sb.from('indicator_games')
    .upsert({ edu_hub_item_id: itemId, indicator_id: indId }, { onConflict: 'indicator_id,edu_hub_item_id', ignoreDuplicates: true });
  if (error) {
    const { error: e2 } = await sb.from('indicator_games').insert({ edu_hub_item_id: itemId, indicator_id: indId });
    if (e2 && !e2.message.includes('duplicate')) throw e2;
  }
  inserted++;
  console.log('MAP', extUrl, '→', code);
}
console.log('Done:', inserted, 'mappings,', skipped, 'skipped');
