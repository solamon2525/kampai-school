// test-sink-float.mjs — data-integrity test เกม sink-float
// ดึง OBJECTS จาก data.js จริง (กัน drift) แล้วตรวจความถูกต้องของคลังสิ่งของ
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const js = readFileSync(resolve(process.cwd(), 'public/games/science/sink-float/data.js'), 'utf8');
const m = js.match(/OBJECTS:\s*(\[[\s\S]*?\n\s*\],)/);
if (!m) { console.error('❌ หา OBJECTS array ใน data.js ไม่เจอ'); process.exit(1); }
// eslint-disable-next-line no-eval
const OBJECTS = eval(m[1].replace(/,\s*$/, ''));

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.error('  ❌ ' + msg); } };

ok(OBJECTS.length >= 20, `ควรมี ≥20 สิ่งของ (มี ${OBJECTS.length})`);

OBJECTS.forEach((o, i) => {
    const tag = `สิ่งของ ${i + 1} (${o && o.name})`;
    ok(o && typeof o.e === 'string' && o.e.trim().length > 0, `${tag}: ไม่มี emoji`);
    ok(o && typeof o.name === 'string' && o.name.trim().length > 0, `${tag}: ไม่มีชื่อ`);
    ok(o && typeof o.floats === 'boolean', `${tag}: floats ต้องเป็น boolean`);
    ok(o && typeof o.why === 'string' && o.why.trim().length > 0, `${tag}: ไม่มีเหตุผล (why)`);
});

const floaters = OBJECTS.filter((o) => o.floats).length;
const sinkers = OBJECTS.filter((o) => !o.floats).length;
ok(floaters >= 5, `ควรมีของลอย ≥5 ชิ้น (มี ${floaters})`);
ok(sinkers >= 5, `ควรมีของจม ≥5 ชิ้น (มี ${sinkers})`);

// ชื่อต้องไม่ซ้ำ (กันใส่ของซ้ำ)
const names = OBJECTS.map((o) => o.name);
ok(new Set(names).size === names.length, 'ชื่อสิ่งของซ้ำกัน');

console.log(`\n${fail === 0 ? '✅' : '❌'} sink-float: ${pass} ผ่าน, ${fail} พลาด  (${OBJECTS.length} สิ่งของ · ลอย ${floaters} / จม ${sinkers})`);
process.exit(fail === 0 ? 0 : 1);
