#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync, statSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(resolve(root, '.env.local'), 'utf8');
const url = env.match(/VITE_SUPABASE_URL="?([^\r\n"]+)/)?.[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="?([^\r\n"]+)/)?.[1];
const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

const slugs = ['multiply-burst', 'catch-numbers', 'multiply-rally', 'net-3d', 'ai-hand-gesture-game'];
const { data, error } = await sb
  .from('educational_hub_items')
  .select('id, title, game_slug, thumbnail_url, is_published, updated_at')
  .in('game_slug', slugs);
if (error) throw error;
console.log('DB rows:', data);

for (const row of data ?? []) {
  const path = row.thumbnail_url?.split('?')[0];
  if (!path) continue;
  const local = resolve(root, 'public', path.replace(/^\//, ''));
  try {
    const s = statSync(local);
    const r = await fetch(`https://kampai-school.vercel.app${row.thumbnail_url}`, { method: 'HEAD' });
    console.log(`\n${row.game_slug}:`, row.thumbnail_url);
    console.log('  local bytes:', s.size, 'prod status:', r.status, 'prod len:', r.headers.get('content-length'));
  } catch (e) {
    console.log(`\n${row.game_slug}: LOCAL MISSING`, local);
  }
}
