#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(resolve(root, '.env.local'), 'utf8');
const url = env.match(/VITE_SUPABASE_URL="?([^\r\n"]+)/)?.[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="?([^\r\n"]+)/)?.[1];
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const { data, error } = await sb
  .from('educational_hub_items')
  .select('id, title, game_slug, external_url, thumbnail_url')
  .or('thumbnail_url.ilike.%.svg%,thumbnail_url.ilike.%.svg')
  .order('title');
if (error) throw error;

console.log('DB rows with .svg in thumbnail_url:', (data || []).length);
for (const r of data || []) {
  const thumb = (r.thumbnail_url || '').split('?')[0];
  const local = thumb.startsWith('/') ? join(root, 'public', thumb.slice(1)) : '';
  const pngPath = local.replace(/\.svg$/i, '.png');
  console.log([
    r.title,
    r.game_slug || '-',
    r.thumbnail_url,
    existsSync(local) ? 'svg_ok' : 'svg_missing',
    existsSync(pngPath) ? 'png_exists' : 'png_missing',
  ].join(' | '));
}
