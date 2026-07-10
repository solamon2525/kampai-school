#!/usr/bin/env node
/** ตรวจสถานะ Thai Vocab Hub บน Supabase remote — migrations 278–282 + seed + game_docs */
import { readFileSync, existsSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseEnvFile(path) {
  if (!existsSync(path)) return {};
  const env = {};
  const raw = readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
  for (const line of raw.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const m = t.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

/** .env ก่อน แล้ว .env.local ทับ (เหมือน Vite) */
function loadEnv() {
  const env = { ...parseEnvFile(join(ROOT, '.env')) };
  Object.assign(env, parseEnvFile(join(ROOT, '.env.local')));
  return env;
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey) {
  console.error('❌ ไม่พบ VITE_SUPABASE_URL หรือ VITE_SUPABASE_ANON_KEY');
  console.error('   ใส่ใน .env.local หรือ .env (merge อัตโนมัติ)');
  process.exit(1);
}

function makeHeaders(key) {
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

const anonHeaders = makeHeaders(anonKey);
const privilegedHeaders = serviceKey && !/YOUR_|^\.\.\.$/i.test(serviceKey)
  ? makeHeaders(serviceKey)
  : anonHeaders;

async function rpc(name, body = {}) {
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: anonHeaders,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${name}: ${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

async function count(table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=0`, {
    headers: { ...privilegedHeaders, Prefer: 'count=exact' },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${table}: ${res.status} ${t.slice(0, 120)}`);
  }
  const range = res.headers.get('content-range') || '';
  const m = range.match(/\/(\d+)$/);
  return m ? Number(m[1]) : 0;
}

/** ตรวจว่า migration 282 อัปเดตฟังก์ชันแล้ว (มี subquery recent) */
function checkClassMissedRecentSql() {
  const sql = `SELECT (p.prosrc LIKE '%last_missed_at%') AS has_recent FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace WHERE n.nspname = 'public' AND p.proname = 'get_thai_vocab_class_missed';`;
  try {
    const out = execSync(`supabase db query --linked "${sql.replace(/"/g, '\\"')}"`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    if (/true/i.test(out)) return true;
    if (/false/i.test(out)) return false;
    return null;
  } catch {
    return null;
  }
}

async function main() {
  console.log('🔍 ตรวจ Thai Vocab Hub บน Supabase remote\n');

  let catCount = 0;
  let itemCount = 0;
  let catalogOk = false;

  // 278 — full catalog
  try {
    const catalog = await rpc('get_thai_vocab_catalog');
    const cats = catalog?.categories?.length ?? 0;
    const wordKeys = catalog?.words ? Object.keys(catalog.words).length : 0;
    let totalWords = 0;
    if (catalog?.words) {
      for (const k of Object.keys(catalog.words)) {
        totalWords += catalog.words[k]?.length ?? 0;
      }
    }
    catalogOk = cats > 0;
    console.log('✅ Migration 278 — RPC get_thai_vocab_catalog');
    console.log(`   catalog: ${cats} หมวด, ${wordKeys} กลุ่ม, ${totalWords} คำรวม`);
    try {
      catCount = await count('thai_vocab_categories');
      itemCount = await count('thai_vocab_items');
      console.log(`   thai_vocab_categories: ${catCount} แถว`);
      console.log(`   thai_vocab_items:      ${itemCount} แถว`);
    } catch {
      console.log('   (นับแถวตารางตรงไม่ได้ — ใช้ค่าจาก catalog)');
      catCount = cats;
      itemCount = totalWords;
    }
  } catch (e) {
    console.log('❌ Migration 278 — ยังไม่พร้อมหรือ seed ไม่ครบ');
    console.log(`   ${e.message}`);
  }

  // 280 — lazy RPC + metadata
  console.log('');
  try {
    const catsOnly = await rpc('get_thai_vocab_categories_only');
    const nCats = Array.isArray(catsOnly) ? catsOnly.length : 0;
    const lessonWords = await rpc('get_thai_vocab_words', { p_category_slug: 'lesson' });
    const nLesson = Array.isArray(lessonWords) ? lessonWords.length : 0;
    const sample = lessonWords?.[0];
    const hasMeta = sample && (
      'classifier_for' in sample
      || 'pair_id' in sample
      || 'synonym_group' in sample
      || 'origin_lang' in sample
    );
    console.log('✅ Migration 280 — lazy RPC');
    console.log(`   get_thai_vocab_categories_only: ${nCats} หมวด`);
    console.log(`   get_thai_vocab_words('lesson'): ${nLesson} คำ`);
    console.log(`   metadata keys ใน response: ${hasMeta ? '✅ มี' : '⚠️  ไม่เห็น (รัน 280 + re-seed)'}`);
  } catch (e) {
    console.log('❌ Migration 280 — RPC lazy/metadata ยังไม่พร้อม');
    console.log(`   ${e.message}`);
    console.log('   → supabase db query --linked -f supabase/migrations/280_thai_vocab_hub_efg.sql');
  }

  // Seed
  console.log('');
  if (itemCount >= 2400) {
    console.log('✅ Seed — ครบ ~2,400 คำ');
  } else if (itemCount > 0) {
    console.log(`⚠️  Seed — มีแค่ ${itemCount} คำ (ยังไม่ครบ 2,400)`);
  } else if (catalogOk || catCount > 0) {
    console.log('❌ Seed — ยังไม่ได้รัน');
    console.log('   → pnpm seed:thai-vocab');
  }

  // game_docs v1.8.0 (387) — ใช้ service role ถ้ามี (RLS บล็อก anon)
  console.log('');
  const expectedVersion = 'v1.8.0';
  try {
    const res = await fetch(
      `${url}/rest/v1/educational_hub_items?external_url=eq./games/thai/thai-vocab-hub/index.html&select=id,title`,
      { headers: privilegedHeaders },
    );
    const items = await res.json();
    const itemId = items?.[0]?.id;
    if (!itemId) {
      console.log('⚠️  ไม่พบ educational_hub_items thai-vocab-hub');
    } else {
      const docRes = await fetch(
        `${url}/rest/v1/game_docs?item_id=eq.${itemId}&select=version,updated_at`,
        { headers: privilegedHeaders },
      );
      const docs = await docRes.json();
      if (!docs?.length) {
        console.log('❌ game_docs — ยังไม่มี row');
        console.log('   → supabase db query --linked -f supabase/migrations/281_update_thai_vocab_hub_phase_efg_docs.sql');
      } else {
        const v = docs[0].version;
        const at = docs[0].updated_at;
        console.log(`📄 game_docs version: ${v ?? '(null)'} (updated ${at ?? '?'})`);
        if (v === expectedVersion) {
          console.log(`✅ Migration 281 — game_docs ${expectedVersion}`);
        } else if (v === 'v1.5.0') {
          console.log(`⚠️  อยู่ที่ v1.5.0 — รัน migration 281`);
          console.log('   → supabase db query --linked -f supabase/migrations/281_update_thai_vocab_hub_phase_efg_docs.sql');
        } else {
          console.log(`⚠️  เป้า ${expectedVersion} — ได้ ${v ?? '?'}`);
        }
      }
    }
  } catch (e) {
    console.log(`⚠️  game_docs — เช็กไม่ได้: ${e.message}`);
  }

  // 282 — class report recent words subquery
  console.log('');
  const recentOk = checkClassMissedRecentSql();
  if (recentOk === true) {
    console.log('✅ Migration 282 — get_thai_vocab_class_missed มี recent subquery');
    console.log('   (ทดสอบ UI: Teacher Edu Hub → คำศัพท์ที่พลาด → เลือกชั้น)');
  } else if (recentOk === false) {
    console.log('⚠️  Migration 282 — ฟังก์ชันยังไม่มี recent (รัน 282)');
    console.log('   → supabase db query --linked -f supabase/migrations/282_thai_vocab_class_missed_recent.sql');
  } else {
    console.log('⚠️  Migration 282 — เช็กไม่ได้ (ต้องมี supabase CLI + link)');
    console.log('   → supabase db query --linked -f supabase/migrations/282_thai_vocab_class_missed_recent.sql');
  }

  if (!serviceKey || /YOUR_|^\.\.\.$/i.test(serviceKey)) {
    console.log('\n💡 ใส่ SUPABASE_SERVICE_ROLE_KEY ใน .env.local เพื่อเช็ก game_docs แม่นขึ้น');
  }
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
