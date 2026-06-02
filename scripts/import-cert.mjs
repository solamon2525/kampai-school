#!/usr/bin/env node
/**
 * import-cert.mjs
 *
 * ลงเกียรติบัตรครู (training_records) จาก CLI โดยให้ Claude อ่านรูปด้วย vision แล้ว
 * เตรียม data JSON มาให้ — script นี้ทำงาน deterministic 3 อย่าง:
 *   1) จับคู่ชื่อผู้รับ → staff_id
 *   2) อัปรูปเกียรติบัตรเข้า bucket `school-images/training-certificates/`
 *   3) insert ระเบียน training_records (status='ผ่านการอบรม' → โชว์ที่ /training-showcase)
 *
 * USAGE:
 *   node scripts/import-cert.mjs --image=<path> --data=<jsonPath> [--staff-id=<uuid>] [--dry-run]
 *
 * --data JSON (Claude เขียนจากการอ่านรูป):
 *   {
 *     "recipient_name": "สมหญิง ใจดี",            // ชื่อผู้รับบนเกียรติบัตร (ใช้ match staff)
 *     "course_name": "การจัดการเรียนรู้เชิงรุก",   // required
 *     "provider": "สพป.ขอนแก่น เขต 1",
 *     "training_type": "อบรม",                     // อบรม|สัมมนา|ศึกษาดูงาน|ประชุมวิชาการ
 *     "start_date": "2025-03-15",                  // ISO ค.ศ. (Claude แปลง พ.ศ.→ค.ศ. แล้ว)
 *     "end_date": "2025-03-16",                    // optional
 *     "hours": 12,
 *     "location": "โรงแรม...",                     // optional
 *     "budget": 0,                                 // optional (เกียรติบัตรมักไม่มี → 0)
 *     "notes": null                                // optional
 *   }
 *
 * ENV REQUIRED (ใน .env.local):
 *   VITE_SUPABASE_URL          — e.g. https://lkpqssbqxxpasidfqhpb.supabase.co
 *   SUPABASE_SERVICE_ROLE_KEY  — Supabase Dashboard → Settings → API → service_role key
 *                                (จำเป็น: storage policy ให้แค่ authenticated อัปได้, anon ไม่ผ่าน)
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');

// ─── Parse CLI args ─────────────────────────────────────────────────────────
const args = Object.fromEntries(
    process.argv.slice(2).map((a) => {
        const [k, v] = a.replace(/^--/, '').split('=');
        return [k, v ?? true];
    }),
);
const imagePath = args.image ?? null;
const dataPath = args.data ?? null;
const staffIdOverride = typeof args['staff-id'] === 'string' ? args['staff-id'] : null;
const dryRun = !!args['dry-run'];

if (!imagePath || !dataPath) {
    console.error('✗ Missing args. Usage:');
    console.error('  node scripts/import-cert.mjs --image=<path> --data=<jsonPath> [--staff-id=<uuid>] [--dry-run]');
    process.exit(1);
}

// ─── Load env (.env.local loader, no external deps) ──────────────────────────
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
    console.error('✗ Missing env: VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    console.error('  เพิ่มใน .env.local (service_role key จาก Supabase Dashboard → Settings → API)');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
});

const BUCKET = 'school-images';
const FOLDER = 'training-certificates';
const TRAINING_TYPES = ['อบรม', 'สัมมนา', 'ศึกษาดูงาน', 'ประชุมวิชาการ', 'รางวัล/เกียรติยศ'];
const CONTENT_TYPES = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
};

// ─── Load + validate inputs ──────────────────────────────────────────────────
const absImage = resolve(REPO_ROOT, imagePath);
if (!existsSync(absImage)) {
    console.error(`✗ ไม่พบไฟล์รูป: ${absImage}`);
    process.exit(1);
}
const ext = extname(absImage).toLowerCase();
if (ext !== '.pdf' && !CONTENT_TYPES[ext]) {
    console.error(`✗ นามสกุลไม่รองรับ: ${ext} (รองรับ ${Object.keys(CONTENT_TYPES).join(', ')}, .pdf)`);
    process.exit(1);
}

const absData = resolve(REPO_ROOT, dataPath);
if (!existsSync(absData)) {
    console.error(`✗ ไม่พบไฟล์ data JSON: ${absData}`);
    process.exit(1);
}
let data;
try {
    data = JSON.parse(readFileSync(absData, 'utf8'));
} catch (e) {
    console.error(`✗ อ่าน data JSON ไม่ได้: ${e.message}`);
    process.exit(1);
}

if (!data.course_name) {
    console.error('✗ data.course_name จำเป็น (required)');
    process.exit(1);
}
if (!data.start_date || !/^\d{4}-\d{2}-\d{2}$/.test(data.start_date)) {
    console.error('✗ data.start_date จำเป็น และต้องเป็น ISO ค.ศ. YYYY-MM-DD');
    process.exit(1);
}
if (data.training_type && !TRAINING_TYPES.includes(data.training_type)) {
    console.error(`✗ data.training_type ต้องเป็น 1 ใน: ${TRAINING_TYPES.join(' / ')}`);
    process.exit(1);
}
if (!staffIdOverride && !data.recipient_name) {
    console.error('✗ ต้องมี data.recipient_name (เพื่อ match staff) หรือส่ง --staff-id=<uuid>');
    process.exit(1);
}

console.log(`▶ Import certificate (${dryRun ? 'DRY RUN' : 'LIVE'})`);
console.log(`  รูป:       ${basename(absImage)}`);
console.log(`  หลักสูตร:  ${data.course_name}`);

// ─── 1. จับคู่ครู ─────────────────────────────────────────────────────────────
/** ตัดคำนำหน้าออกเพื่อให้ match ชื่อ-สกุลในตาราง staff ได้ */
function stripPrefix(name) {
    return String(name)
        .replace(/^(นาย|นางสาว|นาง|ครู|ดร\.|อาจารย์|ผอ\.|ว่าที่ ?ร\.?ต\.?)\s*/g, '')
        .trim();
}

let staffId = staffIdOverride;
let staffName = null;

if (staffId) {
    const { data: row, error } = await supabase
        .from('staff')
        .select('id, name, position')
        .eq('id', staffId)
        .maybeSingle();
    if (error) {
        console.error(`✗ query staff (by id) ล้มเหลว: ${error.message}`);
        process.exit(1);
    }
    if (!row) {
        console.error(`✗ ไม่พบ staff id: ${staffId}`);
        process.exit(1);
    }
    staffName = row.name;
    console.log(`  ครู:       ${staffName} (${row.position ?? '-'}) [--staff-id]`);
} else {
    const cleaned = stripPrefix(data.recipient_name);
    const { data: rows, error } = await supabase
        .from('staff')
        .select('id, name, position')
        .ilike('name', `%${cleaned}%`);
    if (error) {
        console.error(`✗ query staff (by name) ล้มเหลว: ${error.message}`);
        process.exit(1);
    }
    if (!rows || rows.length === 0) {
        console.error(`✗ ไม่พบครูชื่อ "${data.recipient_name}" (ค้นด้วย "${cleaned}")`);
        console.error('  ส่ง --staff-id=<uuid> เพื่อระบุตรง ๆ');
        process.exit(1);
    }
    if (rows.length > 1) {
        console.error(`✗ ชื่อ "${cleaned}" match หลายคน — เลือกแล้วส่ง --staff-id:`);
        rows.forEach((r) => console.error(`    ${r.id}  ${r.name} (${r.position ?? '-'})`));
        process.exit(1);
    }
    staffId = rows[0].id;
    staffName = rows[0].name;
    console.log(`  ครู:       ${staffName} (${rows[0].position ?? '-'}) → ${staffId}`);
}

// ─── เตรียม payload ───────────────────────────────────────────────────────────
const record = {
    staff_id: staffId,
    course_name: data.course_name,
    provider: data.provider ?? null,
    training_type: data.training_type ?? 'อบรม',
    start_date: data.start_date,
    end_date: data.end_date ?? null,
    hours: data.hours ?? 0,
    location: data.location ?? null,
    budget: data.budget ?? 0,
    status: data.status ?? 'ผ่านการอบรม',
    notes: data.notes ?? null,
    // certificate_url เติมหลังอัปรูป
};

if (dryRun) {
    console.log('\n◌ DRY RUN — payload ที่จะ insert (ยังไม่อัปรูป/insert จริง):');
    console.log(JSON.stringify({ ...record, certificate_url: '<public-url-after-upload>' }, null, 2));
    process.exit(0);
}

// ─── 2. เตรียมรูป (PDF → render หน้าแรกเป็น PNG ด้วย mupdf) + อัป ──────────────
let fileBuf;
let uploadExt = ext;
let contentType = CONTENT_TYPES[ext];
if (ext === '.pdf') {
    const mupdf = await import('mupdf');
    const doc = mupdf.Document.openDocument(readFileSync(absImage), 'application/pdf');
    const page = doc.loadPage(0); // หน้าแรก
    const pix = page.toPixmap(mupdf.Matrix.scale(2, 2), mupdf.ColorSpace.DeviceRGB, false);
    fileBuf = Buffer.from(pix.asPNG());
    uploadExt = '.png';
    contentType = 'image/png';
    console.log('  ✓ แปลง PDF → PNG (หน้าแรก @2x)');
} else {
    fileBuf = readFileSync(absImage);
}
const storagePath = `${FOLDER}/${Date.now()}_${randomBytes(4).toString('hex')}${uploadExt}`;

const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, fileBuf, {
        contentType,
        cacheControl: '3600',
        upsert: false,
    });
if (upErr) {
    console.error(`✗ อัปรูปล้มเหลว: ${upErr.message}`);
    process.exit(1);
}
const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
record.certificate_url = urlData.publicUrl;
console.log(`  ✓ อัปรูป: ${(fileBuf.length / 1024).toFixed(1)} KB → ${record.certificate_url}`);

// ─── 3. insert training_records ──────────────────────────────────────────────
const { data: inserted, error: insErr } = await supabase
    .from('training_records')
    .insert(record)
    .select('id')
    .single();
if (insErr) {
    console.error(`✗ insert training_records ล้มเหลว: ${insErr.message}`);
    console.error('  (รูปอัปไปแล้วที่ ' + storagePath + ' — ลบเองได้จาก Storage ถ้าต้องการ)');
    process.exit(1);
}

// ─── รายงานผล ────────────────────────────────────────────────────────────────
const SITE = 'https://kampai-school.vercel.app';
console.log(`\n✓ ลงเกียรติบัตรสำเร็จ`);
console.log(`  record id:  ${inserted.id}`);
console.log(`  ครู:        ${staffName}`);
console.log(`  รูป:        ${record.certificate_url}`);
console.log(`  ดูได้ที่:    ${SITE}/training-showcase`);
console.log(`              ${SITE}/staff/${staffId}`);
