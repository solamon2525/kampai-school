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
  { match: { game_slug: 'multiply-burst' }, thumbnail_url: '/games/math/multiply-burst/cover-full.png' },
  { match: { external_url: '/games/english/voxel-quiz-adventure/index.html' }, thumbnail_url: '/games/english/voxel-quiz-adventure/cover-full.png' },
  { match: { external_url: '/games/engine/platformer-2d/index.html' }, thumbnail_url: '/games/engine/platformer-2d/cover-full.png' },
  { match: { game_slug: 'math-rally' }, thumbnail_url: '/games/math/math-rally/cover-full.png' },
  { match: { game_slug: 'multiply-rally' }, thumbnail_url: '/games/math/math-rally/cover-full.png' },
  { match: { external_url: '/games/math/math-rally/index.html' }, thumbnail_url: '/games/math/math-rally/cover-full.png' },
  { match: { external_url: '/games/math/multiply-rally/index.html' }, thumbnail_url: '/games/math/math-rally/cover-full.png' },
];

for (const u of updates) {
  let q = sb.from('educational_hub_items').update({
    thumbnail_url: u.thumbnail_url,
    updated_at: new Date().toISOString(),
  });
  if (u.match.game_slug) q = q.eq('game_slug', u.match.game_slug);
  if (u.match.external_url) q = q.eq('external_url', u.match.external_url);
  const { data, error } = await q.select('title, game_slug, thumbnail_url');
  if (error) throw error;
  console.log(u.thumbnail_url, '→', (data || []).map((d) => d.title).join(', ') || '(no row)');
}
