// test-debug-it.mjs — logic test เกม debug-it (ไม่พึ่ง DOM)
// ดึง BUGS จากไฟล์ HTML จริง (กัน drift) + สำเนา DIRS/runProgram
// ยืนยันต่อด่าน: (1) buggy ให้ outcome ≠ 'goal' (มีบั๊กจริง) (2) fix ให้ outcome = 'goal'
//               (3) fix ต่างจาก buggy แค่ "หมุนทิศ" ได้ (ยาวเท่ากัน → แก้ด้วยการแตะหมุน) (4) integrity grid
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const html = readFileSync(resolve(process.cwd(), 'public/games/tech/debug-it.html'), 'utf8');
const m = html.match(/const BUGS = (\[[\s\S]*?\]);/);
if (!m) { console.error('❌ หา BUGS array ในไฟล์ไม่เจอ'); process.exit(1); }
// eslint-disable-next-line no-eval
const BUGS = eval(m[1]);

const DIRS = {
    up:    { dx: 0, dy: -1 }, down:  { dx: 0, dy: 1 },
    left:  { dx: -1, dy: 0 }, right: { dx: 1, dy: 0 },
};
function runProgram(level, tiles, loopN) {
    const walls = new Set((level.walls || []).map(([x,y]) => x + ',' + y));
    const starSet = new Set((level.stars || []).map(([x,y]) => x + ',' + y));
    const totalStars = starSet.size;
    let pos = { x: level.start[0], y: level.start[1] };
    let collected = 0;
    const seq = [];
    for (let r = 0; r < loopN; r++) for (const t of tiles) seq.push(t);
    for (const t of seq) {
        const d = DIRS[t];
        const nx = pos.x + d.dx, ny = pos.y + d.dy;
        if (nx < 0 || ny < 0 || nx >= level.cols || ny >= level.rows || walls.has(nx + ',' + ny)) {
            return { outcome: 'crash', starsCollected: collected, totalStars };
        }
        pos = { x: nx, y: ny };
        const key = nx + ',' + ny;
        if (starSet.has(key)) { starSet.delete(key); collected++; }
        if (pos.x === level.goal[0] && pos.y === level.goal[1] && collected === totalStars) {
            return { outcome: 'goal', starsCollected: collected, totalStars };
        }
    }
    return { outcome: 'incomplete', starsCollected: collected, totalStars };
}

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.error('  ❌ ' + msg); } };

ok(BUGS.length >= 6, `ควรมี ≥6 ด่าน (มี ${BUGS.length})`);

BUGS.forEach((lv, i) => {
    const tag = `บั๊ก ${i + 1}`;
    // (1) buggy ต้องไม่ผ่าน (มีบั๊กจริง)
    const rb = runProgram(lv, lv.buggy, lv.loopN);
    ok(rb.outcome !== 'goal', `${tag}: buggy ไม่ควรถึงธง แต่ outcome='${rb.outcome}' (บั๊กไม่จริง)`);
    // (2) fix ต้องผ่าน
    const rf = runProgram(lv, lv.fix, lv.loopN);
    ok(rf.outcome === 'goal', `${tag}: fix ต้องถึงธง แต่ outcome='${rf.outcome}' (ดาว ${rf.starsCollected}/${rf.totalStars})`);
    // (3) fix แก้ได้ด้วย "การหมุนทิศ" ในตำแหน่งเดิม (ยาวเท่ากัน + loopN เท่ากัน) → ตรงกับกลไก cycleCmd
    ok(lv.fix.length === lv.buggy.length, `${tag}: fix/buggy ยาวไม่เท่ากัน (แก้ด้วยการแตะหมุนอย่างเดียวไม่ได้)`);
    const diffs = lv.buggy.filter((t, k) => t !== lv.fix[k]).length;
    ok(diffs >= 1 && diffs <= 2, `${tag}: จำนวนคำสั่งที่ต้องแก้ ${diffs} (ควร 1–2 เพื่อพอดีความยาก)`);
    // (4) integrity: start/goal/walls/stars อยู่ในตาราง + start≠goal + ไม่ทับกำแพง
    const inGrid = ([x,y]) => x >= 0 && y >= 0 && x < lv.cols && y < lv.rows;
    const wallSet = new Set(lv.walls.map(([x,y]) => x + ',' + y));
    ok(inGrid(lv.start) && inGrid(lv.goal), `${tag}: start/goal นอกตาราง`);
    ok(!(lv.start[0] === lv.goal[0] && lv.start[1] === lv.goal[1]), `${tag}: start ทับ goal`);
    ok(!wallSet.has(lv.start.join(',')) && !wallSet.has(lv.goal.join(',')), `${tag}: start/goal ทับกำแพง`);
    lv.stars.forEach((s) => ok(inGrid(s) && !wallSet.has(s.join(',')), `${tag}: ดาว ${s} นอกตาราง/ทับกำแพง`));
    // par = ความยาว fix
    ok(lv.par === lv.fix.length, `${tag}: par (${lv.par}) ควรเท่าความยาว fix (${lv.fix.length})`);
});

console.log(`\n${fail === 0 ? '✅' : '❌'} debug-it: ${pass} ผ่าน, ${fail} พลาด  (${BUGS.length} ด่าน)`);
process.exit(fail === 0 ? 0 : 1);
