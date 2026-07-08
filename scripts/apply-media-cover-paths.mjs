#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(resolve(root, '.env.local'), 'utf8');
const url = env.match(/VITE_SUPABASE_URL="?([^\r\n"]+)/)?.[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="?([^\r\n"]+)/)?.[1];
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const updates = [
  ['/games/math/math-fraction-hub/index.html', '/games/math/math-fraction-hub/cover-bars.png'],
  ['/games/thai/thai-grammar-hub/index.html', '/games/thai/thai-grammar-hub/cover-pos.png'],
  ['/games/english/phonics-chart.html', '/games/english/phonics-chart-cover.png'],
];

for (const [external_url, thumbnail_url] of updates) {
  const { data, error } = await sb
    .from('educational_hub_items')
    .update({ thumbnail_url })
    .eq('external_url', external_url)
    .select('title, thumbnail_url')
    .maybeSingle();
  if (error) throw error;
  console.log(data ? `OK ${data.title} → ${data.thumbnail_url}` : `SKIP ${external_url}`);
}
