#!/usr/bin/env node
/**
 * gen-cover.mjs — สร้างปกเกมด้วย Gemini Image API (Nano Banana) → PNG 1280×720
 *
 * อ่าน key จาก env (GEMINI_API_KEY / GOOGLE_API_KEY) หรือจาก .env.local (ห้าม commit key)
 *
 * USAGE:
 *   node scripts/gen-cover.mjs --list                       # ดูรายชื่อโมเดลที่ key นี้ใช้ได้ (หา image model)
 *   node scripts/gen-cover.mjs --prompt="..." --out=public/games/math/multiply-race-cover.png
 *   node scripts/gen-cover.mjs --prompt-file=scene.txt --out=... [--model=gemini-2.5-flash-image-preview]
 *
 * หมายเหตุ: Gemini image gen มีค่าใช้จ่ายต่อรูป — รันทีละใบ ตรวจด้วยตา (Read PNG) ก่อนใช้
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import sharp from 'sharp';

function loadKey() {
  if (process.env.GEMINI_API_KEY) return process.env.GEMINI_API_KEY;
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;
  try {
    const env = readFileSync(resolve(process.cwd(), '.env.local'), 'utf8');
    const m = env.match(/^\s*(?:GEMINI_API_KEY|GOOGLE_API_KEY|VITE_GEMINI_API_KEY)\s*=\s*(.+?)\s*$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, '');
  } catch { /* */ }
  return null;
}

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const i = a.indexOf('=');
  return i > 0 ? [a.slice(2, i), a.slice(i + 1)] : [a.replace(/^--/, ''), true];
}));

const KEY = loadKey();
if (!KEY) { console.error('❌ ไม่พบ GEMINI_API_KEY — ใส่ใน .env.local เป็น  GEMINI_API_KEY=xxxx'); process.exit(1); }
const BASE = 'https://generativelanguage.googleapis.com/v1beta';

// ─── --list: ดูโมเดลที่ใช้ได้ (เน้นตัวที่สร้างรูปได้) ───
if (args.list) {
  const r = await fetch(`${BASE}/models?key=${KEY}&pageSize=200`);
  if (!r.ok) { console.error('❌ HTTP', r.status, (await r.text()).slice(0, 400)); process.exit(1); }
  const j = await r.json();
  const all = (j.models || []).map((m) => m.name.replace('models/', ''));
  const img = all.filter((n) => /image/i.test(n));
  console.log('🖼️  image models:\n  ' + (img.join('\n  ') || '(ไม่พบ — key/แพลนนี้อาจไม่รองรับ image gen)'));
  console.log('\nทั้งหมด ' + all.length + ' โมเดล');
  process.exit(0);
}

const model = args.model || 'gemini-2.5-flash-image-preview';
const prompt = args['prompt-file'] ? readFileSync(resolve(process.cwd(), args['prompt-file']), 'utf8') : args.prompt;
const out = args.out;
if (!prompt || !out) { console.error('usage: node scripts/gen-cover.mjs --prompt="..." --out=public/games/.../x-cover.png'); process.exit(1); }

const body = { contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseModalities: ['IMAGE'] } };
const res = await fetch(`${BASE}/models/${model}:generateContent?key=${KEY}`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
if (!res.ok) {
  let t = await res.text();
  // ถ้า responseModalities ไม่ถูกใจโมเดล ลองใหม่ด้วย TEXT+IMAGE
  if (/responseModalities|modal/i.test(t)) {
    body.generationConfig.responseModalities = ['TEXT', 'IMAGE'];
    const r2 = await fetch(`${BASE}/models/${model}:generateContent?key=${KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r2.ok) { console.error('❌ HTTP', r2.status, (await r2.text()).slice(0, 500)); process.exit(1); }
    var json = await r2.json();
  } else { console.error('❌ HTTP', res.status, t.slice(0, 500)); process.exit(1); }
} else { var json = await res.json(); }

const parts = json?.candidates?.[0]?.content?.parts || [];
const img = parts.find((p) => p.inlineData || p.inline_data);
if (!img) { console.error('❌ ไม่มีรูปใน response:', JSON.stringify(json).slice(0, 600)); process.exit(1); }
const buf = Buffer.from((img.inlineData || img.inline_data).data, 'base64');
await sharp(buf).resize(1280, 720, { fit: 'cover', position: 'centre' }).png().toFile(resolve(process.cwd(), out));
const meta = await sharp(resolve(process.cwd(), out)).metadata();
console.log(`✅ saved ${out} (${meta.width}×${meta.height})`);
