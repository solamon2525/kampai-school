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
  { slug: 'multiply-burst', thumbnail_url: '/games/math/multiply-burst/cover.png?v=3' },
  { slug: 'catch-numbers', thumbnail_url: '/games/math/catch-numbers/cover.png?v=3' },
  { slug: 'math-rally', thumbnail_url: '/games/math/math-rally/cover.png?v=3' },
  { slug: 'net-3d', thumbnail_url: '/games/math/net-3d-cover.png?v=3' },
  { slug: 'ai-hand-gesture-game', thumbnail_url: '/games/thai/ai-hand-gesture-game-cover.png?v=3' },
];

for (const { slug, thumbnail_url } of updates) {
  const { data, error } = await sb
    .from('educational_hub_items')
    .update({ thumbnail_url, updated_at: new Date().toISOString() })
    .eq('game_slug', slug)
    .select('title, game_slug, thumbnail_url')
    .maybeSingle();
  if (error) throw error;
  console.log(data || `[skip slug] ${slug}`);
}

// math-rally อาจ slug เก่า multiply-rally หรือ external_url อย่างเดียว
const rallyUrl = '/games/math/math-rally/cover.png?v=3';
const { data: rally, error: rallyErr } = await sb
  .from('educational_hub_items')
  .update({ thumbnail_url: rallyUrl, updated_at: new Date().toISOString() })
  .or('game_slug.eq.math-rally,game_slug.eq.multiply-rally,external_url.eq./games/math/math-rally/index.html')
  .select('title, game_slug, thumbnail_url');
if (rallyErr) throw rallyErr;
console.log('math-rally:', rally);

console.log('Done 5 covers v3');
