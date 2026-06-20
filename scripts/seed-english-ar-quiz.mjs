#!/usr/bin/env node
/**
 * seed-english-ar-quiz.mjs
 *
 * One-shot REST seeder ที่ทำงานเทียบเท่า migration
 *   supabase/migrations/212_seed_english_ar_quiz_game.sql
 * ใช้เมื่อ supabase CLI ไม่พร้อม (apply remote ผ่าน service_role key + PostgREST)
 *
 * Idempotent: รันซ้ำได้ ไม่เพิ่มแถวซ้ำ + sync flags + upsert game_docs
 *
 * USAGE:
 *   node scripts/seed-english-ar-quiz.mjs --dry-run   # preview เฉย ๆ
 *   node scripts/seed-english-ar-quiz.mjs             # apply จริง
 *
 * ENV (.env.local): VITE_SUPABASE_URL · SUPABASE_SERVICE_ROLE_KEY
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const dryRun = process.argv.slice(2).includes('--dry-run');

// ─── Load env (.env.local) ──────────────────────────────────────────────────
const envFile = resolve(REPO_ROOT, '.env.local');
if (existsSync(envFile)) {
    for (const line of readFileSync(envFile, 'utf8').split('\n')) {
        const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.+?)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
}
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
    console.error('✗ Missing env: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (.env.local)');
    process.exit(1);
}
const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

// ─── ค่าจาก migration 212 ───────────────────────────────────────────────────
const V_URL = '/games/english/english-ar-quiz/index.html';
const TITLE = '🔤 English AR Quiz (ป.4)';
const die = (msg) => { console.error('✗ ' + msg); process.exit(1); };

console.log(`▶ Seed English AR Quiz (${dryRun ? 'DRY RUN' : 'LIVE'}) → ${SUPABASE_URL}`);

// 1) staff: ครูณัฐพงศ์ สิงห์ชมภู (teaching)
const { data: staff, error: e1 } = await sb.from('staff')
    .select('id, name').ilike('name', '%ณัฐพงศ์%สิงห์ชมภู%')
    .eq('staff_type', 'teaching').order('created_at', { ascending: true }).limit(1);
if (e1) die('query staff: ' + e1.message);
if (!staff?.length) die('staff "ครูณัฐพงศ์ สิงห์ชมภู" not found');
const staffId = staff[0].id;
console.log(`  staff: ${staff[0].name} (${staffId})`);

// 2) category games
const { data: cat, error: e2 } = await sb.from('educational_hub_categories')
    .select('id').eq('category_key', 'games').maybeSingle();
if (e2) die('query category: ' + e2.message);
if (!cat) die('category "games" not found (migration 061)');

if (dryRun) {
    const { data: ex } = await sb.from('educational_hub_items')
        .select('id').eq('owner_staff_id', staffId).eq('external_url', V_URL).maybeSingle();
    console.log(`  [dry] item ${ex ? 'มีอยู่แล้ว → จะ update flags' : 'ยังไม่มี → จะ insert'}; game_docs จะ upsert`);
    console.log('  (dry-run — ไม่เขียนอะไร)');
    process.exit(0);
}

// 3) profile (ON CONFLICT staff_id DO NOTHING)
{
    const { error } = await sb.from('educational_hub_profiles')
        .upsert({ staff_id: staffId, is_hub_active: true }, { onConflict: 'staff_id', ignoreDuplicates: true });
    if (error) die('upsert profile: ' + error.message);
}

// 4) item insert WHERE NOT EXISTS (owner + external_url)
let { data: item, error: e4 } = await sb.from('educational_hub_items')
    .select('id').eq('owner_staff_id', staffId).eq('external_url', V_URL).maybeSingle();
if (e4) die('query item: ' + e4.message);
if (!item) {
    const { data, error } = await sb.from('educational_hub_items').insert({
        owner_staff_id: staffId, category_id: cat.id, item_type: 'link',
        title: TITLE, external_url: V_URL, subject: 'ภาษาอังกฤษ', sort_order: 212,
    }).select('id').single();
    if (error) die('insert item: ' + error.message);
    item = data;
    console.log(`  + inserted item ${item.id}`);
} else {
    console.log(`  = item exists ${item.id}`);
}

// 5) update flags
{
    const { error } = await sb.from('educational_hub_items').update({
        game_slug: 'english-ar-quiz', tracked_game: true, is_published: true,
        thumbnail_url: '/games/english/english-ar-quiz/cover.svg',
        bgm_preset: 'playful', updated_at: new Date().toISOString(),
    }).eq('id', item.id);
    if (error) die('update item flags: ' + error.message);
    console.log('  ↻ flags synced (published, tracked, slug, cover, bgm)');
}

// 6) game_docs upsert (ON CONFLICT item_id DO UPDATE)
{
    const { error } = await sb.from('game_docs').upsert({
        item_id: item.id, owner_staff_id: staffId,
        game_format: 'AR/กล้อง — ยืนหรือแตะ 3 โซน (ซ้าย/กลาง/ขวา) เลือกคำตอบภาษาอังกฤษ',
        features: [
            'เนื้อหาคำศัพท์และไวยากรณ์พื้นฐาน ป.4 (12 ข้อ สุ่ม 10 ข้อ/รอบ)',
            'อ่านเสียงคำศัพท์อังกฤษ (TTS) ต่อข้อเมื่อมี speak ใน data.js',
            'ตรวจจับการเคลื่อนไหว framediff + hold-to-select + fallback แตะโซน',
            'แก้โจทย์ที่ data.js · จูน AR ที่ config.js (AR-GAME.md)',
        ],
        version: 'v1.0.0',
        notes: 'English AR Quiz ป.4 (kampai-ar.js v1.0.0, migration 212)',
        updated_at: new Date().toISOString(),
    }, { onConflict: 'item_id' });
    if (error) die('upsert game_docs: ' + error.message);
    console.log('  ↻ game_docs upserted');
}

console.log('✅ Seed สำเร็จ — เกมพร้อมแสดงในหลังบ้าน GamesTab');
