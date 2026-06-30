#!/usr/bin/env node
/** ตรวจสถานะ migration 278 + seed + game_docs — อ่านจาก .env */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv() {
  for (const f of ['.env.local', '.env']) {
    const p = join(ROOT, f);
    if (!existsSync(p)) continue;
    const env = {};
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      const m = line.match(/^([^#=]+)=(.*)$/);
      if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
    }
    return env;
  }
  return {};
}

const env = loadEnv();
const url = env.VITE_SUPABASE_URL;
const key = env.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!url || !key) {
  console.error('❌ ไม่พบ VITE_SUPABASE_URL / ANON_KEY ใน .env');
  process.exit(1);
}

const headers = {
  apikey: key,
  Authorization: `Bearer ${key}`,
  'Content-Type': 'application/json',
};

async function rpc(name, body = {}) {
  const res = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${name}: ${res.status} ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

async function count(table) {
  const res = await fetch(`${url}/rest/v1/${table}?select=id&limit=0`, {
    headers: { ...headers, Prefer: 'count=exact' },
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`${table}: ${res.status} ${t.slice(0, 120)}`);
  }
  const range = res.headers.get('content-range') || '';
  const m = range.match(/\/(\d+)$/);
  return m ? Number(m[1]) : 0;
}

async function main() {
  console.log('🔍 ตรวจ Thai Vocab Hub บน Supabase remote\n');

  // 278 — tables + RPC
  let catCount = 0;
  let itemCount = 0;
  let catalogOk = false;
  try {
    const catalog = await rpc('get_thai_vocab_catalog');
    const cats = catalog?.categories?.length ?? 0;
    const wordKeys = catalog?.words ? Object.keys(catalog.words).length : 0;
    let totalWords = 0;
    if (catalog?.words) {
      for (const k of Object.keys(catalog.words)) {
        totalWords += (catalog.words[k]?.length ?? 0);
      }
    }
    catalogOk = cats > 0;
    console.log(`✅ Migration 278 — RPC get_thai_vocab_catalog ทำงาน`);
    console.log(`   catalog: ${cats} หมวด, ${wordKeys} กลุ่ม, ${totalWords} คำรวม`);
    try {
      catCount = await count('thai_vocab_categories');
      itemCount = await count('thai_vocab_items');
      console.log(`   thai_vocab_categories: ${catCount} แถว`);
      console.log(`   thai_vocab_items:      ${itemCount} แถว`);
    } catch {
      console.log(`   (นับแถวตารางตรงไม่ได้ — ใช้ค่าจาก catalog แทน)`);
      catCount = cats;
      itemCount = totalWords;
    }
  } catch (e) {
    console.log(`❌ Migration 278 — ยังไม่พร้อมหรือ seed ไม่ครบ`);
    console.log(`   ${e.message}`);
  }

  // Seed status
  console.log('');
  if (itemCount >= 1500) {
    console.log('✅ Seed — ครบ ~1,500 คำ');
  } else if (itemCount > 0) {
    console.log(`⚠️  Seed — มีแค่ ${itemCount} คำ (ยังไม่ครบ 1,500)`);
  } else if (catalogOk || catCount > 0) {
    console.log('❌ Seed — ยังไม่ได้รัน (ตารางว่าง)');
    console.log('   → node scripts/seed-thai-vocab-db.mjs (ต้องมี SUPABASE_SERVICE_ROLE_KEY)');
  }

  // game_docs version via hub item (public read on items may work)
  console.log('');
  try {
    const res = await fetch(
      `${url}/rest/v1/educational_hub_items?external_url=eq./games/thai/thai-vocab-hub/index.html&select=id,title`,
      { headers },
    );
    const items = await res.json();
    const itemId = items?.[0]?.id;
    if (!itemId) {
      console.log('⚠️  ไม่พบ educational_hub_items thai-vocab-hub');
    } else {
      const docRes = await fetch(
        `${url}/rest/v1/game_docs?item_id=eq.${itemId}&select=version,updated_at`,
        { headers },
      );
      const docs = await docRes.json();
      if (!docs?.length) {
        console.log('❌ game_docs — ยังไม่มี row (276–279 อาจยังไม่รัน)');
      } else {
        const v = docs[0].version;
        const at = docs[0].updated_at;
        console.log(`📄 game_docs version: ${v ?? '(null)'} (updated ${at ?? '?'})`);
        const expected = 'v1.5.0';
        if (v === expected) {
          console.log(`✅ Migrations 276–279 (game_docs) — น่าจะรันครบแล้ว (${expected})`);
        } else if (v === 'v1.4.0') {
          console.log('⚠️  อยู่ที่ v1.4.0 — รัน 279 ยัง');
        } else if (v === 'v1.3.0') {
          console.log('⚠️  อยู่ที่ v1.3.0 — รัน 277, 279 ยัง');
        } else {
          console.log(`⚠️  เปรียบเทียบกับเป้า ${expected} — อาจต้องรัน 276–279`);
        }
      }
    }
  } catch (e) {
    console.log(`⚠️  game_docs — เช็กไม่ได้ (RLS): ${e.message}`);
    console.log('   รัน SQL ใน Dashboard แทน (ดูด้านล่าง)');
  }

  console.log('\n--- SQL เช็กใน Dashboard (ถ้าต้องการยืนยัน) ---');
  console.log("SELECT version, updated_at FROM game_docs gd");
  console.log("JOIN educational_hub_items i ON i.id = gd.item_id");
  console.log("WHERE i.external_url LIKE '%thai-vocab-hub%';");
}

main().catch((e) => {
  console.error('❌', e.message);
  process.exit(1);
});
