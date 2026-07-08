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
  .select('id, title, game_slug, external_url, thumbnail_url, is_published')
  .eq('is_published', true)
  .not('thumbnail_url', 'is', null)
  .order('title');
if (error) throw error;

const missing = [];
const svgOnly = [];
for (const r of data || []) {
  const thumb = (r.thumbnail_url || '').split('?')[0];
  if (!thumb.startsWith('/games/')) continue;
  const local = join(root, 'public', thumb.slice(1));
  const svgPath = local.replace(/\.png$/i, '.svg');
  const pngOk = existsSync(local);
  const svgOk = existsSync(svgPath);
  if (!pngOk) {
    missing.push({ ...r, thumb, svgOk });
  }
  if (!pngOk && svgOk) svgOnly.push(r);
}

console.log('Published items missing PNG cover:', missing.length);
for (const r of missing) {
  console.log([
    r.title,
    r.game_slug || '-',
    r.thumb,
    r.svgOk ? 'HAS_SVG' : 'NO_SVG',
  ].join(' | '));
}
