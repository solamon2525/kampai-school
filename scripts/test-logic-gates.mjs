// test-logic-gates.mjs — logic test เกม logic-gates (ไม่พึ่ง DOM)
// ดึง LEVELS จากไฟล์ HTML จริง (กัน drift) + สำเนา gate/evalCircuit
// ยืนยัน: (1) truth table ของทุกเกตถูก (2) ทุกวงจรประเมินได้ทุกชุดสวิตช์ (boolean, ไม่ error/undefined)
//         (3) integrity: node.in อ้าง id ที่นิยามมาก่อน (topo), out มีจริง, switches = IN nodes
//         (4) ทุกวงจร "ไม่คงที่" (มีทั้งกรณีติดและดับ) → โจทย์มีความหมาย
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const html = readFileSync(resolve(process.cwd(), 'public/games/tech/logic-gates.html'), 'utf8');
const m = html.match(/const LEVELS = (\[[\s\S]*?\n\];)/);
if (!m) { console.error('❌ หา LEVELS array ในไฟล์ไม่เจอ'); process.exit(1); }
// eslint-disable-next-line no-eval
const LEVELS = eval(m[1].replace(/;$/, ''));

function gate(type, ins) {
    switch (type) {
        case 'AND':  return ins.every((v) => v === 1) ? 1 : 0;
        case 'OR':   return ins.some((v) => v === 1) ? 1 : 0;
        case 'NOT':  return ins[0] === 1 ? 0 : 1;
        case 'XOR':  return (ins.filter((v) => v === 1).length % 2 === 1) ? 1 : 0;
        case 'NAND': return ins.every((v) => v === 1) ? 0 : 1;
        case 'NOR':  return ins.some((v) => v === 1) ? 0 : 1;
        default:     return 0;
    }
}
function evalCircuit(level, state) {
    const val = {};
    for (const n of level.nodes) {
        if (n.type === 'IN') val[n.id] = state[n.id] ? 1 : 0;
        else val[n.id] = gate(n.type, n.in.map((r) => val[r]));
    }
    return val[level.out] === 1;
}

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.error('  ❌ ' + msg); } };

// (1) truth tables
ok(gate('AND',[1,1]) === 1 && gate('AND',[1,0]) === 0 && gate('AND',[0,0]) === 0, 'AND ผิด');
ok(gate('OR',[0,0]) === 0 && gate('OR',[1,0]) === 1 && gate('OR',[1,1]) === 1, 'OR ผิด');
ok(gate('NOT',[0]) === 1 && gate('NOT',[1]) === 0, 'NOT ผิด');
ok(gate('XOR',[0,0]) === 0 && gate('XOR',[1,0]) === 1 && gate('XOR',[1,1]) === 0, 'XOR ผิด');
ok(gate('NAND',[1,1]) === 0 && gate('NAND',[1,0]) === 1 && gate('NAND',[0,0]) === 1, 'NAND ผิด');
ok(gate('NOR',[0,0]) === 1 && gate('NOR',[1,0]) === 0 && gate('NOR',[1,1]) === 0, 'NOR ผิด');

ok(LEVELS.length >= 8, `ควรมี ≥8 วงจร (มี ${LEVELS.length})`);

// helper: วนทุกชุดค่าสวิตช์
function allStates(switches) {
    const out = [];
    const n = switches.length;
    for (let mask = 0; mask < (1 << n); mask++) {
        const st = {};
        switches.forEach((s, i) => { st[s] = (mask >> i) & 1; });
        out.push(st);
    }
    return out;
}

LEVELS.forEach((lv, i) => {
    const tag = `วงจร ${i + 1} (${lv.name})`;
    // (3) integrity
    const defined = new Set();
    let topoOk = true, gatesOk = true;
    for (const n of lv.nodes) {
        if (n.type === 'IN') { defined.add(n.id); }
        else {
            if (!Array.isArray(n.in) || n.in.length === 0) { gatesOk = false; }
            for (const r of (n.in || [])) if (!defined.has(r)) topoOk = false;
            if (n.type === 'NOT' && n.in && n.in.length !== 1) gatesOk = false;
            defined.add(n.id);
        }
    }
    ok(topoOk, `${tag}: มี node.in อ้างถึง id ที่ยังไม่นิยาม (ลำดับ topo ผิด)`);
    ok(gatesOk, `${tag}: เกตมี input ผิดจำนวน`);
    ok(defined.has(lv.out), `${tag}: out '${lv.out}' ไม่มีใน nodes`);
    const inIds = lv.nodes.filter((n) => n.type === 'IN').map((n) => n.id).sort();
    ok(JSON.stringify(inIds) === JSON.stringify([...lv.switches].sort()), `${tag}: switches ${lv.switches} ≠ IN nodes ${inIds}`);
    lv.nodes.forEach((n) => { ok(typeof n.col === 'number' && typeof n.row === 'number', `${tag}: node ${n.id} ไม่มี col/row (วาดไม่ได้)`); });

    // (2)+(4) ประเมินทุกชุดสวิตช์ → boolean เสมอ + ไม่คงที่
    const results = allStates(lv.switches).map((st) => evalCircuit(lv, st));
    ok(results.every((r) => typeof r === 'boolean'), `${tag}: ผลลัพธ์ไม่เป็น boolean (วงจรพัง)`);
    const trues = results.filter((r) => r).length;
    ok(trues > 0 && trues < results.length, `${tag}: ผลคงที่ (${trues}/${results.length} เป็นจริง) — โจทย์ไม่มีความหมาย`);
});

// spot-check ค่าจริงบางวงจร
const andL = LEVELS.find((l) => l.name === 'AND');
if (andL) ok(evalCircuit(andL, {A:1,B:1}) === true && evalCircuit(andL, {A:1,B:0}) === false, 'AND circuit eval ผิด');
const norL = LEVELS.find((l) => l.name === 'NOR');
if (norL) ok(evalCircuit(norL, {A:0,B:0}) === true && evalCircuit(norL, {A:1,B:0}) === false, 'NOR circuit eval ผิด');

console.log(`\n${fail === 0 ? '✅' : '❌'} logic-gates: ${pass} ผ่าน, ${fail} พลาด  (${LEVELS.length} วงจร)`);
process.exit(fail === 0 ? 0 : 1);
