#!/usr/bin/env node
/** ตรวจว่า thai-sara-run เล่นผ่าน PlayGame ได้ (anon query เหมือน getBySlug) */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const envFile = resolve(REPO_ROOT, '.env.local');
if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, 'utf8').split('\n')) {
        const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
}

const anon = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
    auth: { persistSession: false },
});

const { data, error } = await anon
    .from('educational_hub_items')
    .select('id, title, game_slug, tracked_game, is_published, external_url')
    .eq('tracked_game', true)
    .eq('is_published', true)
    .eq('game_slug', 'thai-sara-run')
    .maybeSingle();

if (error) {
    console.error('❌ query failed:', error.message);
    process.exit(1);
}
if (!data) {
    console.error('❌ ไม่พบ thai-sara-run (tracked + published)');
    console.error('   รัน: node scripts/seed-thai-sara-run-game.mjs');
    process.exit(1);
}
console.log('✅ thai-sara-run พร้อมเล่น');
console.log('   id:', data.id);
console.log('   title:', data.title);
console.log('   url:', data.external_url);
