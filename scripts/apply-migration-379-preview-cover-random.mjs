#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(resolve(root, '.env.local'), 'utf8');
const url = env.match(/VITE_SUPABASE_URL=\"?([^\r\n\"]+)/)?.[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=\"?([^\r\n\"]+)/)?.[1];
if (!url || !key) {
  console.error('missing env');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const updates = [
  { key: 'game_preview_cover_round2_min_seconds', value: '3' },
  { key: 'game_preview_cover_round2_max_seconds', value: '5' },
];

for (const row of updates) {
  const { data: existing } = await sb
    .from('school_settings')
    .select('key')
    .eq('key', row.key)
    .maybeSingle();

  if (existing) {
    console.log('exists', row.key);
    continue;
  }

  const { error } = await sb.from('school_settings').insert(row);
  if (error) console.error(row.key, error.message);
  else console.log('inserted', row.key);
}

const { data } = await sb.from('school_settings').select('key,value').in('key', updates.map((u) => u.key));
console.log(data);

