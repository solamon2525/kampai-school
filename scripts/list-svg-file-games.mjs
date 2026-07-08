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

// Games that still have cover.svg on disk (real games, not templates)
const svgGames = [
  { slug: 'multiply-burst', svg: '/games/math/multiply-burst/cover.svg', png: '/games/math/multiply-burst/cover.png' },
  { slug: 'platformer-blueprint', svg: '/games/engine/platformer-2d/cover.svg', png: '/games/engine/platformer-2d/cover.png' },
  { slug: 'voxel-quiz-adventure', svg: '/games/english/voxel-quiz-adventure/cover.svg', png: '/games/english/voxel-quiz-adventure/cover.png' },
  { slug: null, titleLike: 'คลังอักษร', svg: '/games/thai/thai-script-hub/cover.svg', png: '/games/thai/thai-script-hub/cover.png' },
  { slug: 'multiply-rally', svg: null, png: '/games/math/multiply-rally/cover.png', altPng: '/games/math/math-rally/cover.png' },
];

for (const g of svgGames) {
  let q = sb.from('educational_hub_items').select('title, game_slug, thumbnail_url, is_published');
  if (g.slug) q = q.eq('game_slug', g.slug);
  else q = q.ilike('title', '%อักษรไทย%');
  const { data } = await q.maybeSingle();
  const png = join(root, 'public', (g.png || '').slice(1));
  const svg = g.svg ? join(root, 'public', g.svg.slice(1)) : '';
  const alt = g.altPng ? join(root, 'public', g.altPng.slice(1)) : '';
  console.log('---');
  console.log('slug', g.slug, 'row', data);
  console.log('png', existsSync(png), g.png);
  if (svg) console.log('svg', existsSync(svg), g.svg);
  if (alt) console.log('alt', existsSync(alt), g.altPng);
}
