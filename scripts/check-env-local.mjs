#!/usr/bin/env node
/** เช็กว่า .env.local มีค่าที่ seed script ต้องการ (ไม่พิมพ์ secret เต็ม) */
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseEnvFile(path) {
  if (!existsSync(path)) return null;
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const m = t.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
  return env;
}

function mask(v) {
  if (!v) return 'MISSING';
  if (/YOUR_|^\.\.\.$|placeholder/i.test(v)) return 'PLACEHOLDER (ยังไม่ใส่จริง)';
  if (v.length <= 8) return `(set, len=${v.length})`;
  return `${v.slice(0, 6)}…${v.slice(-4)} (len=${v.length})`;
}

const names = [
  'VITE_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'VITE_SUPABASE_ANON_KEY',
];

for (const file of ['.env.local', '.env']) {
  const path = join(ROOT, file);
  console.log(`\n📁 ${file}${existsSync(path) ? '' : ' — ไม่มีไฟล์'}`);
  const env = parseEnvFile(path);
  if (!env) continue;
  for (const n of names) {
    const v = env[n];
    console.log(`   ${n}: ${mask(v)}`);
  }
}

const local = parseEnvFile(join(ROOT, '.env.local')) ?? {};
const dotenv = parseEnvFile(join(ROOT, '.env')) ?? {};
const url = local.VITE_SUPABASE_URL || dotenv.VITE_SUPABASE_URL;
const service = local.SUPABASE_SERVICE_ROLE_KEY || dotenv.SUPABASE_SERVICE_ROLE_KEY;

console.log('\n--- สรุปสำหรับ seed-thai-vocab-db.mjs ---');
console.log(`   VITE_SUPABASE_URL:           ${url ? '✅ มี' : '❌ ไม่มี'}`);
console.log(`   SUPABASE_SERVICE_ROLE_KEY:   ${service && !/YOUR_|^\.\.\.$/i.test(service) ? '✅ มี' : '❌ ไม่มี (ต้องใส่ใน .env.local)'}`);
console.log('\nหมายเหตุ: seed script อ่านเฉพาะ .env.local — ถ้ามีแค่ใน .env ต้อง copy ไป .env.local');
