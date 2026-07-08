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

for (const term of ['voxel', 'platformer', 'blueprint', 'rally']) {
  const { data } = await sb
    .from('educational_hub_items')
    .select('title, game_slug, thumbnail_url, external_url, is_published')
    .or(`title.ilike.%${term}%,game_slug.ilike.%${term}%,external_url.ilike.%${term}%`);
  console.log(term, data);
}
