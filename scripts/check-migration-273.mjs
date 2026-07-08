#!/usr/bin/env node
/** ตรวจว่า migration 273 apply แล้วหรือยัง (query Supabase REST ด้วย anon key) */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(resolve(root, '.env.local'), 'utf8');
const url = env.match(/VITE_SUPABASE_URL="([^"]+)"/)?.[1];
const anon = env.match(/VITE_SUPABASE_ANON_KEY="([^"]+)"/)?.[1];

if (!url || !anon) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env.local');
    process.exit(1);
}

const headers = { apikey: anon, Authorization: `Bearer ${anon}` };

async function get(label, path) {
    const res = await fetch(`${url}/rest/v1/${path}`, { headers });
    const text = await res.text();
    let body;
    try { body = JSON.parse(text); } catch { body = text; }
    return { label, status: res.status, body };
}

const results = await Promise.all([
    get('columns blueprint_id/json on educational_hub_items', 'educational_hub_items?select=blueprint_id,blueprint_json&limit=1'),
    get('game_blueprints table', 'game_blueprints?select=id,title&limit=1'),
    get('platformer-blueprint seed game', 'educational_hub_items?select=title,game_slug,blueprint_id&game_slug=eq.platformer-blueprint'),
    get('thai-sara-run blueprint link', 'educational_hub_items?select=title,game_slug,blueprint_id,blueprint_json&game_slug=eq.thai-sara-run'),
]);

let migrationOk = true;
for (const r of results) {
    const colMissing = typeof r.body === 'object' && r.body?.code === '42703';
    const ok = r.status === 200 && !colMissing;
    if (!ok) migrationOk = false;
    console.log(`${ok ? '✅' : '❌'} ${r.label} — HTTP ${r.status}`);
    console.log(JSON.stringify(r.body, null, 2));
    console.log('');
}

console.log(migrationOk
    ? 'สรุป: migration 273 schema apply แล้ว'
    : 'สรุป: migration 273 schema ยังไม่ apply — รัน scripts/apply-migration-273-only.sql');

const thai = results.find((r) => r.label.includes('thai-sara-run'));
const thaiRow = Array.isArray(thai?.body) ? thai.body[0] : null;
if (thaiRow?.blueprint_json || thaiRow?.blueprint_id) {
    console.log('✅ thai-sara-run มี blueprint แล้ว — เล่นได้ที่ /play/thai-sara-run');
} else if (migrationOk) {
    console.log('⚠️  thai-sara-run ยังไม่มีด่าน — รัน scripts/apply-migration-273-thai-sara-run-seed.sql');
    console.log('   หรือ Admin → เกม HTML → thai-sara-run → ออกแบบด่าน → บันทึก');
}

process.exit(migrationOk ? 0 : 1);
