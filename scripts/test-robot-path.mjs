// test-robot-path.mjs — logic test เกม robot-path (ไม่พึ่ง DOM) · สำเนา DIRS/LEVELS/runProgram จาก game
// ยืนยัน: (1) ทุกด่านมีเฉลยที่ผ่านได้จริง (outcome 'goal') (2) เฉลยใช้คำสั่ง ≤ par
//         (3) crash/incomplete ทำงานถูก (4) start/goal/walls/stars ไม่ทับกัน + อยู่ในตาราง
const DIRS = {
    up:    { dx: 0, dy: -1 }, down:  { dx: 0, dy: 1 },
    left:  { dx: -1, dy: 0 }, right: { dx: 1, dy: 0 },
};
const LEVELS = [
    { cols: 5, rows: 3, start: [0,1], goal: [4,1], walls: [], stars: [], par: 4 },
    { cols: 5, rows: 4, start: [0,3], goal: [4,0], walls: [], stars: [], par: 7 },
    { cols: 5, rows: 4, start: [0,3], goal: [4,3], walls: [[2,3],[2,2]], stars: [], par: 8 },
    { cols: 5, rows: 4, start: [0,0], goal: [4,3], walls: [[2,1],[2,2]], stars: [[2,0]], par: 8 },
    { cols: 6, rows: 6, start: [0,5], goal: [5,0], walls: [], stars: [], par: 2 },
    { cols: 6, rows: 5, start: [0,4], goal: [5,0], walls: [[1,4],[1,3],[1,2],[3,0],[3,1],[3,2]], stars: [], par: 13 },
    { cols: 6, rows: 5, start: [0,4], goal: [5,4], walls: [[2,3],[3,3]], stars: [[1,1],[4,1]], par: 11 },
    { cols: 6, rows: 6, start: [0,0], goal: [5,5], walls: [], stars: [], par: 2 },
];
// เฉลยต่อด่าน: { tiles, loopN }
const R = 'right', L = 'left', U = 'up', D = 'down';
const SOLUTIONS = [
    { tiles: [R,R,R,R], loopN: 1 },                              // 1
    { tiles: [U,U,U,R,R,R,R], loopN: 1 },                        // 2
    { tiles: [U,U,R,R,R,R,D,D], loopN: 1 },                      // 3 อ้อมกำแพงขึ้นแถวบน
    { tiles: [R,R,R,D,D,D,R], loopN: 1 },                        // 4 เก็บดาว (2,0) แล้วลงเข้าธง
    { tiles: [U,R], loopN: 5 },                                  // 5 บันได ×5
    { tiles: [U,U,U,R,R,D,D,R,R,U,U,U,R], loopN: 1 },            // 6 เขาวงกต
    { tiles: [U,U,U,R,R,R,R,D,D,D,R], loopN: 1 },                // 7 ขึ้นเก็บดาว (1,1)+(4,1) แล้วลงเข้าธง
    { tiles: [R,D], loopN: 5 },                                  // 8 บันไดลง ×5
];

function runProgram(level, tiles, loopN) {
    const walls = new Set((level.walls || []).map(([x,y]) => x + ',' + y));
    const starSet = new Set((level.stars || []).map(([x,y]) => x + ',' + y));
    const totalStars = starSet.size;
    let pos = { x: level.start[0], y: level.start[1] };
    const path = [];
    let collected = 0;
    const seq = [];
    for (let r = 0; r < loopN; r++) for (const t of tiles) seq.push(t);
    for (const t of seq) {
        const d = DIRS[t];
        const nx = pos.x + d.dx, ny = pos.y + d.dy;
        if (nx < 0 || ny < 0 || nx >= level.cols || ny >= level.rows || walls.has(nx + ',' + ny)) {
            return { outcome: 'crash', path, starsCollected: collected, totalStars, usedTiles: tiles.length };
        }
        pos = { x: nx, y: ny };
        let gotStar = false;
        const key = nx + ',' + ny;
        if (starSet.has(key)) { starSet.delete(key); collected++; gotStar = true; }
        path.push({ x: nx, y: ny, star: gotStar });
        if (pos.x === level.goal[0] && pos.y === level.goal[1] && collected === totalStars) {
            return { outcome: 'goal', path, starsCollected: collected, totalStars, usedTiles: tiles.length };
        }
    }
    return { outcome: 'incomplete', path, starsCollected: collected, totalStars, usedTiles: tiles.length };
}

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.error('  ❌ ' + m); } };

// (1)+(2) ทุกด่าน: เฉลยผ่าน + ใช้คำสั่ง ≤ par
LEVELS.forEach((lv, i) => {
    const sol = SOLUTIONS[i];
    const res = runProgram(lv, sol.tiles, sol.loopN);
    ok(res.outcome === 'goal', `ด่าน ${i + 1}: เฉลยไม่ถึงธง (ได้ '${res.outcome}', ดาว ${res.starsCollected}/${res.totalStars})`);
    ok(sol.tiles.length <= lv.par, `ด่าน ${i + 1}: เฉลยใช้คำสั่ง ${sol.tiles.length} > par ${lv.par}`);
});

// (3) integrity: start/goal/walls/stars อยู่ในตาราง + ไม่ทับกำแพง + start≠goal
LEVELS.forEach((lv, i) => {
    const inGrid = ([x,y]) => x >= 0 && y >= 0 && x < lv.cols && y < lv.rows;
    const wallSet = new Set(lv.walls.map(([x,y]) => x + ',' + y));
    ok(inGrid(lv.start) && inGrid(lv.goal), `ด่าน ${i + 1}: start/goal นอกตาราง`);
    ok(!(lv.start[0] === lv.goal[0] && lv.start[1] === lv.goal[1]), `ด่าน ${i + 1}: start ทับ goal`);
    ok(!wallSet.has(lv.start.join(',')) && !wallSet.has(lv.goal.join(',')), `ด่าน ${i + 1}: start/goal ทับกำแพง`);
    lv.walls.forEach((w) => ok(inGrid(w), `ด่าน ${i + 1}: กำแพง ${w} นอกตาราง`));
    lv.stars.forEach((s) => ok(inGrid(s) && !wallSet.has(s.join(',')), `ด่าน ${i + 1}: ดาว ${s} นอกตาราง/ทับกำแพง`));
});

// (4) crash: เดินชนกำแพงด่าน 3 (เดินขวาตรง ๆ จาก (0,3) จะชน (2,3))
const c = runProgram(LEVELS[2], [R,R,R,R], 1);
ok(c.outcome === 'crash', `crash test: ควร crash แต่ได้ '${c.outcome}'`);

// (5) incomplete: คำสั่งสั้นไม่ถึงธง (ด่าน 1 เดินขวาแค่ 2)
const inc = runProgram(LEVELS[0], [R,R], 1);
ok(inc.outcome === 'incomplete', `incomplete test: ควร incomplete แต่ได้ '${inc.outcome}'`);

// (6) ดาวไม่ครบ → ถึงธงก็ไม่ผ่าน (ด่าน 4 ไม่เก็บดาว เดินเข้าธงตรง)
const noStar = runProgram(LEVELS[3], [D,D,D,R,R,R,R], 1);
ok(noStar.outcome !== 'goal' || noStar.starsCollected === noStar.totalStars,
   `star-gate test: ถึงธงโดยดาวไม่ครบไม่ควรนับผ่าน (outcome ${noStar.outcome}, ดาว ${noStar.starsCollected}/${noStar.totalStars})`);

console.log(`\n${fail === 0 ? '✅' : '❌'} robot-path: ${pass} ผ่าน, ${fail} พลาด`);
process.exit(fail === 0 ? 0 : 1);
