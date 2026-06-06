// test-binary-bits.mjs — logic test เกม binary-bits (ไม่พึ่ง DOM) · สำเนา places/bitsToInt/intToBits/makeQuestion
// ยืนยัน: (1) intToBits↔bitsToInt round-trip ทุกค่า 0..31 (2) places ถูก (3) makeQuestion หลายพันรอบสมเหตุผล
function places(width) { const p = []; for (let i = width - 1; i >= 0; i--) p.push(1 << i); return p; }
function bitsToInt(bits, width) { const p = places(width); return bits.reduce((s, b, i) => s + (b ? p[i] : 0), 0); }
function intToBits(n, width) { const p = places(width); return p.map((v) => (n & v) ? 1 : 0); }
function rnd(n) { return Math.floor(Math.random() * n); }
function makeQuestion(tier) {
    const width = tier >= 2 ? 5 : 4;
    const max = (1 << width) - 1;
    const type = (rnd(2) === 0) ? 'build' : 'read';
    const target = 1 + rnd(max);
    const bits = intToBits(target, width);
    let options = null;
    if (type === 'read') {
        const set = new Set([target]);
        let guard = 0;
        while (set.size < 4 && guard++ < 80) {
            let d = 1 + rnd(max);
            if (rnd(2) === 0) { const flip = 1 << rnd(width); d = target ^ flip; }
            if (d >= 1 && d <= max) set.add(d);
        }
        options = [...set];
        for (let i = options.length - 1; i > 0; i--) { const j = rnd(i + 1); [options[i], options[j]] = [options[j], options[i]]; }
    }
    return { type, width, places: places(width), target, bits, options };
}

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.error('  ❌ ' + m); } };

// (1) places ถูกต้อง
ok(JSON.stringify(places(4)) === JSON.stringify([8,4,2,1]), `places(4) ผิด: ${places(4)}`);
ok(JSON.stringify(places(5)) === JSON.stringify([16,8,4,2,1]), `places(5) ผิด: ${places(5)}`);

// (2) round-trip ทุกค่าในช่วง สำหรับทั้ง 4 และ 5 บิต
for (const width of [4, 5]) {
    const max = (1 << width) - 1;
    let allOk = true;
    for (let n = 0; n <= max; n++) {
        const bits = intToBits(n, width);
        if (bits.length !== width) { allOk = false; ok(false, `width ${width}: intToBits(${n}) ยาวผิด`); break; }
        if (!bits.every((b) => b === 0 || b === 1)) { allOk = false; ok(false, `width ${width}: bits ไม่ใช่ 0/1 ที่ ${n}`); break; }
        if (bitsToInt(bits, width) !== n) { allOk = false; ok(false, `width ${width}: round-trip ${n} → ${bitsToInt(bits, width)}`); break; }
    }
    ok(allOk, `width ${width}: round-trip ไม่ครบ`);
}
// ตัวอย่างเฉพาะ: 13 = 1101, 31 = 11111
ok(intToBits(13, 4).join('') === '1101', `13 ควร 1101 (ได้ ${intToBits(13,4).join('')})`);
ok(intToBits(31, 5).join('') === '11111', `31 ควร 11111 (ได้ ${intToBits(31,5).join('')})`);
ok(bitsToInt([1,0,1,1], 4) === 11, `1011 ควร = 11 (ได้ ${bitsToInt([1,0,1,1],4)})`);

// (3) makeQuestion หลายพันรอบ — สมเหตุผล
for (const tier of [1, 2]) {
    const width = tier >= 2 ? 5 : 4;
    const max = (1 << width) - 1;
    for (let i = 0; i < 4000; i++) {
        const Q = makeQuestion(tier);
        if (Q.width !== width) { ok(false, `tier ${tier}: width ${Q.width}≠${width}`); break; }
        if (!(Q.target >= 1 && Q.target <= max)) { ok(false, `tier ${tier}: target ${Q.target} นอกช่วง 1..${max}`); break; }
        if (bitsToInt(Q.bits, Q.width) !== Q.target) { ok(false, `tier ${tier}: bits ${Q.bits} ≠ target ${Q.target}`); break; }
        if (Q.type === 'read') {
            if (Q.options.length !== 4) { ok(false, `tier ${tier}: read ต้อง 4 ตัวเลือก (ได้ ${Q.options.length})`); break; }
            if (new Set(Q.options).size !== 4) { ok(false, `tier ${tier}: ตัวเลือกซ้ำ: ${Q.options}`); break; }
            if (!Q.options.includes(Q.target)) { ok(false, `tier ${tier}: ไม่มีคำตอบในตัวเลือก: ${Q.options} (target ${Q.target})`); break; }
            if (!Q.options.every((v) => v >= 1 && v <= max)) { ok(false, `tier ${tier}: ตัวเลือกนอกช่วง: ${Q.options}`); break; }
        } else {
            if (Q.options !== null) { ok(false, `tier ${tier}: build ไม่ควรมี options`); break; }
        }
    }
}
ok(true, 'makeQuestion 4000×2 รอบ — ผ่าน (target ในช่วง + bits↔target ตรง + MCQ 4 ไม่ซ้ำมีคำตอบ)');

console.log(`\n${fail === 0 ? '✅' : '❌'} binary-bits: ${pass} ผ่าน, ${fail} พลาด`);
process.exit(fail === 0 ? 0 : 1);
