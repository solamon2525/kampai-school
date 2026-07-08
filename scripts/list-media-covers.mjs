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

const { data: cat } = await sb.from('educational_hub_categories').select('id').eq('category_key', 'media').single();
const { data } = await sb
  .from('educational_hub_items')
  .select('id,title,external_url,thumbnail_url,subject')
  .eq('category_id', cat.id)
  .eq('is_published', true)
  .order('title');

for (const r of data || []) {
  const thumb = r.thumbnail_url || '';
  const local = thumb.startsWith('/') ? join(root, 'public', thumb.slice(1)) : '';
  const exists = local ? existsSync(local) : false;
  console.log([
    r.title,
    r.external_url,
    thumb || '(no thumb)',
    exists ? 'FILE_OK' : 'FILE_MISSING',
  ].join(' | '));
}
console.log('COUNT', (data || []).length);
