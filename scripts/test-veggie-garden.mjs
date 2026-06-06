// test-veggie-garden.mjs — data-integrity + ordering-logic test เกม veggie-garden
// ดึง CROPS จาก data.js จริง (กัน drift) แล้วตรวจ + จำลองกลไกเรียงลำดับ
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const js = readFileSync(resolve(process.cwd(), 'public/games/career/veggie-garden/data.js'), 'utf8');
const m = js.match(/CROPS:\s*(\[[\s\S]*?\n\s*\],)/);
if (!m) { console.error('❌ หา CROPS array ใน data.js ไม่เจอ'); process.exit(1); }
// eslint-disable-next-line no-eval
const CROPS = eval(m[1].replace(/,\s*$/, ''));

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.error('  ❌ ' + msg); } };

ok(CROPS.length >= 6, `ควรมี ≥6 ชนิดผัก (มี ${CROPS.length})`);

CROPS.forEach((c, i) => {
    const tag = `ผัก ${i + 1} (${c && c.crop})`;
    ok(typeof c.crop === 'string' && c.crop.trim().length > 0, `${tag}: ไม่มีชื่อผัก`);
    ok(typeof c.icon === 'string' && c.icon.trim().length > 0, `${tag}: ไม่มี icon`);
    ok(Array.isArray(c.steps) && c.steps.length >= 3 && c.steps.length <= 5, `${tag}: ขั้นควร 3–5 (ได้ ${c.steps && c.steps.length})`);
    (c.steps || []).forEach((s, k) => {
        ok(typeof s.e === 'string' && s.e.trim().length > 0, `${tag} ขั้น ${k + 1}: ไม่มี emoji`);
        ok(typeof s.name === 'string' && s.name.trim().length > 0, `${tag} ขั้น ${k + 1}: ไม่มีชื่อ`);
    });
    // ขั้นแรกควรเป็นเตรียมดิน, ขั้นสุดท้ายควรเป็นเก็บเกี่ยว (🧺)
    ok(c.steps[0].e === '⛏️', `${tag}: ขั้นแรกควรเตรียมดิน (⛏️)`);
    ok(c.steps[c.steps.length - 1].e === '🧺', `${tag}: ขั้นสุดท้ายควรเก็บเกี่ยว (🧺)`);
    // emoji ในรอบเดียวต้องไม่ซ้ำ (กันตีกันตอนแตะ)
    const emos = c.steps.map((s) => s.e);
    ok(new Set(emos).size === emos.length, `${tag}: emoji ขั้นซ้ำกันในรอบเดียว`);
});

// จำลองกลไกเรียงลำดับ (ตรงกับ tapCard): nextExpected เริ่ม 1, ถูก→+1, ครบเมื่อ > N
function playOrder(N, taps) {
    let next = 1, mistakes = 0;
    for (const ord of taps) {
        if (ord === next) next++;
        else mistakes++;
        if (next > N) break;
    }
    return { complete: next > N, mistakes };
}
CROPS.forEach((c, i) => {
    const N = c.steps.length;
    const correctTaps = Array.from({ length: N }, (_, k) => k + 1);
    const r = playOrder(N, correctTaps);
    ok(r.complete && r.mistakes === 0, `ผัก ${i + 1}: แตะ 1..${N} ตามลำดับควรครบไม่มีพลาด`);
});
// แตะผิดลำดับ → นับพลาด
const N0 = CROPS[0].steps.length;
ok(playOrder(N0, [2, 1]).mistakes >= 1, 'แตะขั้นที่ 2 ก่อนขั้นที่ 1 ต้องนับว่าพลาด');

// GROWTH ต้องมีพอสำหรับโชว์ความเติบโต
const gm = js.match(/GROWTH:\s*(\[[^\]]*\])/);
ok(!!gm, 'มี GROWTH array');

console.log(`\n${fail === 0 ? '✅' : '❌'} veggie-garden: ${pass} ผ่าน, ${fail} พลาด  (${CROPS.length} ชนิดผัก)`);
process.exit(fail === 0 ? 0 : 1);
