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

const { data, error } = await sb
  .from('educational_hub_items')
  .update({
    thumbnail_url: '/games/math/mini-farm-island/cover.png?v=3',
    updated_at: new Date().toISOString(),
  })
  .eq('game_slug', 'mini-farm-island')
  .select('title, thumbnail_url')
  .maybeSingle();
if (error) throw error;
console.log(data);
