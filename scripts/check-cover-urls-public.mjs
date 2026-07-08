#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(resolve(root, '.env.local'), 'utf8');
const url = env.match(/VITE_SUPABASE_URL="?([^\r\n"]+)/)?.[1];
const anon = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY="?([^\r\n"]+)/)?.[1];
const sb = createClient(url, anon);

const slugs = ['multiply-burst', 'catch-numbers', 'multiply-rally', 'net-3d', 'ai-hand-gesture-game'];
const { data, error } = await sb
  .from('educational_hub_items')
  .select('title, game_slug, thumbnail_url, is_published')
  .in('game_slug', slugs);
if (error) throw error;
console.table(data);
