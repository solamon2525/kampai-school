// test-solid-3d.mjs — logic test สำหรับเกม solid-3d (ไม่พึ่ง WebGL/Three.js)
// รัน: node scripts/test-solid-3d.mjs
// ตรวจ: (1) ทรงหลายหน้าถูกต้องตามสูตรออยเลอร์ V−E+F=2
//        (2) makeQuestion สร้างโจทย์ถูก: 4 ตัวเลือกไม่ซ้ำ + มีคำตอบเสมอ + count ใช้เฉพาะ poly
// ⚠️ SOLIDS/makeQuestion = สำเนาตรรกะจาก public/games/math/solid-3d.html (ไม่รวมส่วน THREE) — แก้ที่เกมแล้ว sync ที่นี่ด้วย

const SOLIDS = [
    { key:'cube',      name:'ลูกบาศก์',              poly:true,  F:6, E:12, V:8 },
    { key:'cuboid',    name:'ทรงสี่เหลี่ยมมุมฉาก',   poly:true,  F:6, E:12, V:8 },
    { key:'sqpyramid', name:'พีระมิดฐานสี่เหลี่ยม',  poly:true,  F:5, E:8,  V:5 },
    { key:'triprism',  name:'ปริซึมสามเหลี่ยม',      poly:true,  F:5, E:9,  V:6 },
    { key:'sphere',    name:'ทรงกลม',               poly:false },
    { key:'cylinder',  name:'ทรงกระบอก',            poly:false },
    { key:'cone',      name:'กรวย',                 poly:false },
];
const ATTRS = [ { k:'F', label:'หน้า' }, { k:'E', label:'ขอบ' }, { k:'V', label:'มุม' } ];
const POLY = SOLIDS.filter(s => s.poly);

let qrand = Math.random;
const ri = (n) => Math.floor(qrand() * n);
const pick = (arr) => arr[ri(arr.length)];
function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = ri(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function makeQuestion(forceType) {
    const type = forceType || (qrand() < 0.5 ? 'name' : 'count');
    if (type === 'name') {
        const solid = pick(SOLIDS);
        const others = shuffle(SOLIDS.filter(s => s.key !== solid.key)).slice(0, 3).map(s => s.name);
        return { solid, type, qText: 'ทรงนี้ชื่ออะไร?', answer: solid.name, options: shuffle([solid.name, ...others]) };
    }
    const solid = pick(POLY);
    const attr = pick(ATTRS);
    const correct = solid[attr.k];
    const opts = new Set([correct]);
    const pool = shuffle(POLY.map(s => s[attr.k]).concat([correct - 2, correct - 1, correct + 1, correct + 2, correct + 3]).filter(n => n > 0 && n !== correct));
    for (const c of pool) { if (opts.size >= 4) break; opts.add(c); }
    let g = correct + 4; while (opts.size < 4) { if (g > 0) opts.add(g); g++; }
    return { solid, type, qText: `ทรงนี้มีกี่${attr.label}?`, answer: correct, attrK: attr.k, options: shuffle([...opts]).map(String) };
}

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error('  ❌ ' + m); } };

// (1) Euler V−E+F=2 สำหรับทรงหลายหน้า
for (const s of POLY) {
    ok(s.V - s.E + s.F === 2, `${s.name}: Euler V−E+F=2 (ได้ ${s.V}−${s.E}+${s.F}=${s.V - s.E + s.F})`);
    ok(s.F > 0 && s.E > 0 && s.V > 0, `${s.name}: หน้า/ขอบ/มุม > 0`);
}
ok(POLY.length === 4 && SOLIDS.length === 7, `มี 7 ทรง (poly 4)`);

// (2) makeQuestion — รัน 4000 รอบทั้ง mix/name/count
const types = [undefined, 'name', 'count'];
for (const t of types) {
    for (let i = 0; i < 1500; i++) {
        const q = makeQuestion(t);
        const uniq = new Set(q.options);
        if (q.options.length !== 4) { ok(false, `[${t}] ต้องมี 4 ตัวเลือก (ได้ ${q.options.length})`); break; }
        if (uniq.size !== 4) { ok(false, `[${t}] ตัวเลือกซ้ำ: ${q.options.join(',')}`); break; }
        if (!q.options.map(String).includes(String(q.answer))) { ok(false, `[${t}] ไม่มีคำตอบในตัวเลือก: ans=${q.answer} opts=${q.options.join(',')}`); break; }
        if (q.type === 'count') {
            if (!q.solid.poly) { ok(false, `count ใช้ทรงผิวโค้ง: ${q.solid.name}`); break; }
            if (q.answer !== q.solid[q.attrK]) { ok(false, `count คำตอบไม่ตรง metadata`); break; }
        }
        if (q.type === 'name' && !SOLIDS.some(s => s.name === q.answer)) { ok(false, `name คำตอบไม่ใช่ชื่อทรงจริง`); break; }
    }
}
ok(true, 'makeQuestion 4500 รอบ — ผ่าน (4 ตัวเลือกไม่ซ้ำ + มีคำตอบ + count เฉพาะ poly)');

// (3) forceType='count' ต้องไม่หลุดทรงผิวโค้งเลย
ok(Array.from({length: 500}, () => makeQuestion('count')).every(q => q.solid.poly), 'count ไม่เคยใช้ทรงผิวโค้ง');

console.log(`\n${fail === 0 ? '✅' : '❌'} solid-3d: ${pass} ผ่าน, ${fail} พลาด`);
process.exit(fail === 0 ? 0 : 1);
