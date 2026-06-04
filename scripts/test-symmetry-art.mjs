// test-symmetry-art.mjs — engine + DOM-playthrough test สำหรับเกม symmetry-art
// รัน: node scripts/test-symmetry-art.mjs
// ตรวจ: (1) ทุกลายเป็นกริดสี่เหลี่ยม + สมมาตรตามแกนจริง + มีช่องให้เติม
//        (2) เล่นจริงทุกระดับ — เติมถูก → คะแนนขึ้น · เติมผิด → คะแนนไม่ขึ้น
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'public/games/arts/symmetry-art.html'), 'utf8');

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('  ❌ ' + msg); } }

function newGame() {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
  const w = dom.window;
  w.Element.prototype.scrollIntoView = function () {}; // jsdom ไม่มี
  return { w, ev: (s) => w.eval(s) };
}

// ── (1) ความสมมาตรของทุกลาย ──
{
  const { w, ev } = newGame();
  const n = ev('PATTERNS.length');
  ok(n === 12, `มี 12 ลาย (ได้ ${n})`);
  for (let i = 0; i < n; i++) {
    ev(`buildRound(PATTERNS[${i}])`);
    const slug = ev('curPat.slug'), axis = ev('curPat.axis'), W = ev('W'), H = ev('H');
    ok(ev('answer.every(r => r.length === W)'), `${slug}: กริดสี่เหลี่ยม`);
    const sym = axis === 'v'
      ? ev('answer.every(r => r.every((v,c) => v === r[W-1-c]))')
      : ev('answer.every((r,ri) => r.every((v,c) => v === answer[H-1-ri][c]))');
    ok(sym, `${slug}: สมมาตรแกน ${axis}`);
    ok(ev('fillCount') > 0, `${slug}: มีช่องให้เติม (${ev('fillCount')})`);
    // ครึ่งที่ให้ + ครึ่งที่ซ่อน ต้องแบ่งครบทุกช่อง
    const givenCount = ev('given.flat().filter(Boolean).length');
    ok(givenCount > 0 && givenCount < W * H, `${slug}: แบ่งฝั่ง given/target ถูก`);
  }
}

// ── (2) playthrough ทุกระดับ ──
for (const tier of ['easy', 'medium', 'hard']) {
  const { w, ev } = newGame();
  w.chooseMode('practice');
  w.startGame(tier);
  ok(ev('started') === true, `${tier}: เริ่มเกมได้`);
  ok(ev('document.getElementById("board").children.length') > 0, `${tier}: วาด board`);
  ok(ev('document.querySelectorAll(".pchip").length') > 0, `${tier}: วาดจานสี`);

  for (let k = 0; k < 6; k++) {
    // เติมให้ตรงเฉลยทุกช่องที่ซ่อน
    ev('for(let r=0;r<H;r++)for(let c=0;c<W;c++){ if(!given[r][c]) player[r][c]=answer[r][c]; }');
    const before = ev('score');
    w.checkAnswer();
    ok(ev('score') > before, `${tier} รอบ ${k + 1}: เติมถูก → คะแนนขึ้น`);
    // เดินหน้าด้วยมือ (ข้าม setTimeout)
    ev('locked=false');
    w.nextRound();
  }

  // เติมผิด 1 ช่อง → คะแนนต้องไม่ขึ้น
  ev('for(let r=0;r<H;r++)for(let c=0;c<W;c++){ if(!given[r][c]) player[r][c]=answer[r][c]; }');
  ev('outer: for(let r=0;r<H;r++)for(let c=0;c<W;c++){ if(!given[r][c]){ player[r][c]=(answer[r][c]==="0"?"1":"0"); break outer; } }');
  const b2 = ev('score');
  w.checkAnswer();
  ok(ev('score') === b2, `${tier}: เติมผิด → คะแนนไม่ขึ้น`);
  ok(ev('document.querySelectorAll(".cell.cellwrong").length') > 0, `${tier}: ไฮไลต์ช่องผิด`);
}

console.log(`\n${fail === 0 ? '✅' : '❌'} symmetry-art: ${pass} ผ่าน, ${fail} พลาด`);
process.exit(fail === 0 ? 0 : 1);
