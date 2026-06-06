// test-food-chain.mjs — data-integrity + ordering-logic test เกม food-chain
// ดึง CHAINS จากไฟล์ HTML จริง (กัน drift) แล้วตรวจ + จำลองกลไกเรียงลำดับ
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const html = readFileSync(resolve(process.cwd(), 'public/games/science/food-chain.html'), 'utf8');
const m = html.match(/const CHAINS = (\[[\s\S]*?\n\];)/);
if (!m) { console.error('❌ หา CHAINS array ในไฟล์ไม่เจอ'); process.exit(1); }
// eslint-disable-next-line no-eval
const CHAINS = eval(m[1].replace(/;$/, ''));

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.error('  ❌ ' + msg); } };

ok(CHAINS.length >= 8, `ควรมี ≥8 ห่วงโซ่ (มี ${CHAINS.length})`);

CHAINS.forEach((ch, i) => {
    const tag = `ห่วงโซ่ ${i + 1} (${ch.eco})`;
    ok(typeof ch.eco === 'string' && ch.eco.trim().length > 0, `${tag}: eco ว่าง`);
    ok(Array.isArray(ch.steps) && ch.steps.length >= 3 && ch.steps.length <= 5, `${tag}: ความยาวควร 3–5 (ได้ ${ch.steps && ch.steps.length})`);
    (ch.steps || []).forEach((s, k) => {
        ok(typeof s.e === 'string' && s.e.trim().length > 0, `${tag} ตัวที่ ${k + 1}: ไม่มี emoji`);
        ok(typeof s.name === 'string' && s.name.trim().length > 0, `${tag} ตัวที่ ${k + 1}: ไม่มีชื่อ`);
    });
});

// roleName ตรงกับในเกม
function roleName(i, N) { if (i === 0) return 'ผู้ผลิต'; if (i === N - 1) return 'ผู้ล่าสูงสุด'; return 'ผู้บริโภค ' + i; }
const c4 = CHAINS.find((c) => c.steps.length === 4) || CHAINS[0];
ok(roleName(0, c4.steps.length) === 'ผู้ผลิต', 'roleName(0) ควร = ผู้ผลิต');
ok(roleName(c4.steps.length - 1, c4.steps.length) === 'ผู้ล่าสูงสุด', 'roleName(last) ควร = ผู้ล่าสูงสุด');

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
CHAINS.forEach((ch, i) => {
    const N = ch.steps.length;
    const correctTaps = Array.from({ length: N }, (_, k) => k + 1);
    const r = playOrder(N, correctTaps);
    ok(r.complete && r.mistakes === 0, `ห่วงโซ่ ${i + 1}: แตะ 1..${N} ตามลำดับควรครบไม่มีพลาด (complete ${r.complete}, mistakes ${r.mistakes})`);
});
// แตะผิดลำดับ → นับพลาด + ยังไม่ครบทันที
const N0 = CHAINS[0].steps.length;
const wrong = playOrder(N0, [2, 1]);
ok(wrong.mistakes >= 1, 'แตะตัวที่ 2 ก่อนตัวที่ 1 ต้องนับว่าพลาด');

console.log(`\n${fail === 0 ? '✅' : '❌'} food-chain: ${pass} ผ่าน, ${fail} พลาด  (${CHAINS.length} ห่วงโซ่)`);
process.exit(fail === 0 ? 0 : 1);
