/**
 * extract-indicators.mjs — แปลง PDF "ตัวชี้วัดระหว่างทางและตัวชี้วัดปลายทาง" (สพฐ.)
 * เป็น SQL seed สำหรับตาราง curriculum_indicators (เฉพาะ ป.1-6)
 *
 * วิธีใช้:
 *   node scripts/extract-indicators.mjs "<pdf>" <subject_key> [--sql]
 *     ไม่ใส่ --sql  → พิมพ์ checksum (จำนวน total/ระหว่างทาง/ปลายทาง ต่อชั้น) + list รหัส (debug)
 *     ใส่ --sql     → พิมพ์ SQL INSERT ... ON CONFLICT DO UPDATE (stdout)
 *
 * 2 แหล่งข้อมูล:
 *   • asText (รวมคอลัมน์)        → ชุดรหัส + คำอธิบาย (ครบที่สุด, completeness = gate หลัก)
 *   • structuredText (พิกัด x)   → ระบุ kind ระหว่างทาง(ซ้าย x<385) / ปลายทาง(ขวา x≥385) — best-effort
 *   รหัสที่ structured ทิ้ง (ActualText no position) จะได้ kind = NULL (คอลัมน์ nullable)
 *   มัธยม: ข้าม (regex จับเฉพาะ 'ป.'; ตรวจหัว "ชั้นมัธยม" กันคำอธิบายปน)
 */
import * as mupdf from 'mupdf';
import fs from 'node:fs';

const [pdfPath, subjectKey, ...flags] = process.argv.slice(2);
const EMIT_SQL = flags.includes('--sql');
if (!pdfPath || !subjectKey) {
    console.error('usage: node extract-indicators.mjs "<pdf>" <subject_key> [--sql]');
    process.exit(1);
}

// คอลัมน์: ซ้าย(ระหว่างทาง) content x≈120-135 · ขวา(ปลายทาง) content x≈355-396
// (ตำแหน่งเลื่อนได้ต่อหน้า เช่น health ป.2-6 ขวา=360) → threshold กลางช่องว่างที่ 250
const X_RIGHT_MIN = 250;
const X_LEFT_MIN = 110;

const TD = { '๐': '0', '๑': '1', '๒': '2', '๓': '3', '๔': '4', '๕': '5', '๖': '6', '๗': '7', '๘': '8', '๙': '9' };
const toArabic = (s) => s.replace(/[๐-๙]/g, (d) => TD[d]);
const clean = (s) => s.replace(/\s+/g, ' ').trim();
// ลบ noise ที่หลุดเข้า desc ตอนตารางข้ามหน้า: เลขหน้า + แถวหัว "กลุ่มที่ ระหว่างทาง ปลายทาง" + เลขกลุ่ม/ขีด
const cleanDesc = (s) => clean(
    s.replace(/[๐-๙\d]*\s*กลุ่มที่\s*ตัวชี้วัดระหว่างทาง\s*ตัวชี้วัดปลายทาง\s*[๐-๙\d]*\s*-?/gu, ' ')
        .replace(/\s*รวม\s*[๐-๙\d]+\s*ตัวชี้วัด[\s\S]*$/u, '')   // footer สรุปท้ายชั้น
        .replace(/\s+[๐-๙\d]{1,2}\s*-\s*$/u, '')   // เลขกลุ่ม + ขีด ท้ายสุด
        .replace(/\s+-\s*$/u, '')                    // ขีดเดี่ยวท้าย
);
const esc = (s) => s == null ? 'NULL' : `'${String(s).replace(/'/g, "''")}'`;

// รหัสตัวชี้วัด: <พยัญชนะ> <มาตรฐาน>.<ย่อย> ป<.|sp><ชั้น>/<ลำดับ> <คำอธิบาย...>
const CODE_RE = /^([ก-ฮ])\s*([๐-๙\d]+)\.([๐-๙\d]+)\s*ป\s*\.?\s*([๐-๙\d]+)\s*\/\s*([๐-๙\d]+)\s*(.*)$/u;
const STRAND_RE = /^สาระที่\s*([๐-๙\d]+)\s*(.*)$/u;
const mkCode = (l, maj, min, g, seq) => `${l} ${toArabic(maj)}.${toArabic(min)} ป.${toArabic(g)}/${toArabic(seq)}`;

const doc = mupdf.Document.openDocument(new Uint8Array(fs.readFileSync(pdfPath)), 'application/pdf');
const N = doc.countPages();

// ── PASS 1: kind map จาก structured text (x-position) ──
const kindByCode = new Map();
for (let p = 0; p < N; p++) {
    const j = JSON.parse(doc.loadPage(p).toStructuredText().asJSON());
    for (const blk of j.blocks) {
        if (blk.type !== 'text') continue;
        for (const ln of blk.lines) {
            const x = ln.bbox?.x ?? 0;
            if (x < X_LEFT_MIN) continue;
            const m = clean(ln.text).match(CODE_RE);
            if (!m) continue;
            const code = mkCode(m[1], m[2], m[3], m[4], m[5]);
            kindByCode.set(code, x >= X_RIGHT_MIN ? 'ปลายทาง' : 'ระหว่างทาง');
        }
    }
}

// ── โหมด --kind-sql: emit UPDATE indicator_kind สำหรับ seed ที่มีอยู่แล้ว (เช่น thai) ──
if (flags.includes('--kind-sql')) {
    const PG = (code) => `ป.${code.match(/ป\.(\d+)\//)[1]}`;
    const vals = [...kindByCode.entries()]
        .filter(([code]) => /ป\.[1-6]\//.test(code))
        .sort((a, b) => a[0].localeCompare(b[0], 'th'))
        .map(([code, kind]) => `  (${esc(code)}, ${esc(PG(code))}, ${esc(kind)})`);
    console.log(`-- AUTO-GENERATED kind UPDATE — subject=${subjectKey} (${vals.length} rows from structured text)`);
    console.log(`UPDATE public.curriculum_indicators AS c SET indicator_kind = v.kind, updated_at = now()`);
    console.log(`FROM (VALUES`);
    console.log(vals.join(',\n'));
    console.log(`) AS v(code, grade, kind)`);
    console.log(`WHERE c.indicator_code = v.code AND c.grade = v.grade AND c.subject_key = ${esc(subjectKey)};`);
    process.exit(0);
}

// ── PASS 2: รหัส + คำอธิบาย จาก asText (merged tokenizer — กันรหัสถูกตัดข้ามบรรทัด) ──
let full = '';
for (let p = 0; p < N; p++) full += '\n' + doc.loadPage(p).toStructuredText().asText();

// เก็บ token (code + header) พร้อม index แล้วเรียงตามตำแหน่ง
const tokens = [];
const push = (re, fn) => { re.lastIndex = 0; let m; while ((m = re.exec(full))) tokens.push({ i: m.index, end: re.lastIndex, ...fn(m) }); };
push(/([ก-ฮ])\s*([๐-๙\d]+)\.([๐-๙\d]+)\s*ป\s*\.?\s*([๐-๙\d]+)\s*\/\s*([๐-๙\d]+)/gu,
    (m) => ({ type: 'code', letter: m[1], maj: m[2], min: m[3], g: m[4], seq: m[5] }));
push(/สาระที่\s*([๐-๙\d]+)[ \t]*([^\n]*)/gu, (m) => ({ type: 'strand', no: toArabic(m[1]), title: clean(m[2]) || null }));
push(/ชั้นประถม\S*ปีที่\s*[๐-๙\d]+/gu, () => ({ type: 'gradeP' }));
push(/ชั้นมัธยม/gu, () => ({ type: 'gradeM' }));
push(/มาตรฐาน/gu, () => ({ type: 'std' }));
tokens.sort((a, b) => a.i - b.i);

const rows = [];
const seen = new Set();
let inPrathom = false, strandNo = null, strandTitle = null;
for (let k = 0; k < tokens.length; k++) {
    const tk = tokens[k];
    if (tk.type === 'gradeP') { inPrathom = true; continue; }
    if (tk.type === 'gradeM') { inPrathom = false; continue; }
    if (tk.type === 'strand') { strandNo = tk.no; strandTitle = tk.title; continue; }
    if (tk.type === 'std') continue;
    // code
    if (!inPrathom) continue;
    const code = mkCode(tk.letter, tk.maj, tk.min, tk.g, tk.seq);
    if (seen.has(code)) continue;
    seen.add(code);
    const next = tokens[k + 1];
    const desc = cleanDesc(full.slice(tk.end, next ? next.i : full.length));
    rows.push({
        grade: `ป.${toArabic(tk.g)}`,
        strandNo, strandTitle,
        standard: `${tk.letter} ${toArabic(tk.maj)}.${toArabic(tk.min)}`,
        code, desc, kind: kindByCode.get(code) ?? null,
    });
}

rows.sort((a, b) => {
    const ga = +a.grade.slice(2), gb = +b.grade.slice(2);
    return ga !== gb ? ga - gb : a.code.localeCompare(b.code, 'th');
});

// ── checksum ──
const sum = {};
for (const it of rows) {
    const s = (sum[it.grade] ??= { total: 0, 'ระหว่างทาง': 0, 'ปลายทาง': 0, 'null': 0 });
    s.total++; s[it.kind ?? 'null']++;
}

if (!EMIT_SQL) {
    console.error(`# ${pdfPath.split(/[\\/]/).pop()}  subject=${subjectKey}`);
    console.error('ชั้น\tรวม\tระหว่างทาง\tปลายทาง\tnull');
    let T = 0, M = 0, F = 0, Z = 0;
    for (const g of Object.keys(sum).sort((a, b) => +a.slice(2) - +b.slice(2))) {
        const s = sum[g];
        console.error(`${g}\t${s.total}\t${s['ระหว่างทาง']}\t${s['ปลายทาง']}\t${s['null']}`);
        T += s.total; M += s['ระหว่างทาง']; F += s['ปลายทาง']; Z += s['null'];
    }
    console.error(`รวม\t${T}\t${M}\t${F}\t${Z}`);
    if (flags.includes('--list')) for (const it of rows) console.error(`${it.code}\t${it.kind ?? '?'}\t${it.desc.slice(0, 40)}`);
    process.exit(0);
}

const out = [
    `-- AUTO-GENERATED by scripts/extract-indicators.mjs — subject=${subjectKey}`,
    `-- source: ${pdfPath.split(/[\\/]/).pop()}`,
    `INSERT INTO public.curriculum_indicators`,
    `  (subject_key, grade, strand_no, strand_title, standard_code, indicator_code, description, indicator_kind, sort_order)`,
    `VALUES`,
    rows.map((it, i) =>
        `  (${esc(subjectKey)}, ${esc(it.grade)}, ${esc(it.strandNo)}, ${esc(it.strandTitle)}, ${esc(it.standard)}, ${esc(it.code)}, ${esc(it.desc)}, ${esc(it.kind)}, ${i + 1})`
    ).join(',\n'),
    `ON CONFLICT (indicator_code, grade) DO UPDATE SET`,
    `  subject_key = EXCLUDED.subject_key, strand_no = EXCLUDED.strand_no,`,
    `  strand_title = EXCLUDED.strand_title, standard_code = EXCLUDED.standard_code,`,
    `  description = EXCLUDED.description, indicator_kind = EXCLUDED.indicator_kind,`,
    `  sort_order = EXCLUDED.sort_order, updated_at = now();`,
];
console.log(out.join('\n'));
