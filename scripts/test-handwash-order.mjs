// test-handwash-order.mjs — engine + DOM-playthrough test สำหรับเกม handwash-order
// รัน: node scripts/test-handwash-order.mjs
// ตรวจ: (1) STEPS = 7 ขั้น ลำดับ 1..7 ครบไม่ซ้ำ + shuffled() คืน permutation ครบ
//        (2) เล่นจริง — แตะถูกลำดับ → คะแนนขึ้น + เรียงครบ 7 → จบรอบ (roundsDone++)
//        (3) แตะผิดลำดับ → ไม่คืบหน้า + race เสียชีวิต
import { JSDOM } from 'jsdom';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(join(root, 'public/games/health/handwash-order.html'), 'utf8');

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('  ❌ ' + msg); } }

function newGame() {
  const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
  const w = dom.window;
  w.Element.prototype.scrollIntoView = function () {};
  return { w, ev: (s) => w.eval(s) };
}
function cardFor(w, n) { return w.document.querySelector(`.card[data-step="${n}"]`); }
function tapNext(w, ev) { const n = ev('nextExpected'); w.tapCard(n, cardFor(w, n)); }

// ── (1) ความถูกต้องของข้อมูลขั้นตอน ──
{
  const { ev } = newGame();
  ok(ev('STEPS.length') === 7, `มี 7 ขั้น (ได้ ${ev('STEPS.length')})`);
  ok(ev('STEPS.map(s=>s.n).join(",")') === '1,2,3,4,5,6,7', 'ลำดับ n = 1..7 เรียงถูก');
  ok(ev('STEPS.every(s=>s.emoji && s.label)'), 'ทุกขั้นมี emoji + label');
  // shuffled() คืนการ์ดครบ 7 ใบ (permutation ไม่หล่น/ไม่ซ้ำ)
  for (let i = 0; i < 5; i++) {
    const sig = ev('shuffled(STEPS).map(s=>s.n).sort((a,b)=>a-b).join(",")');
    ok(sig === '1,2,3,4,5,6,7', `shuffled() ครั้ง ${i + 1}: ครบ 7 ใบไม่ซ้ำ`);
  }
}

// ── (2) playthrough ถูกลำดับ (practice — ไม่มี timer/ชีวิตกวน) ──
{
  const { w, ev } = newGame();
  w.chooseMode('practice');
  ok(ev('started') === true, 'practice: เริ่มเกมได้');
  ok(ev('document.querySelectorAll(".card").length') === 7, 'practice: วางการ์ด 7 ใบ');
  ok(ev('document.querySelectorAll(".slot").length') === 7, 'practice: วางราง 7 ช่อง');

  // เล่น 3 รอบ — แต่ละรอบแตะถูกลำดับครบ 7 ขั้น
  for (let round = 1; round <= 3; round++) {
    for (let step = 1; step <= 7; step++) {
      const before = ev('score');
      const expBefore = ev('nextExpected');
      ok(expBefore === step, `รอบ ${round} ขั้น ${step}: nextExpected ถูก (${expBefore})`);
      tapNext(w, ev);
      ok(ev('score') > before, `รอบ ${round} ขั้น ${step}: แตะถูก → คะแนนขึ้น`);
      ok(cardFor(w, step).classList.contains('done'), `รอบ ${round} ขั้น ${step}: การ์ด done`);
      ok(w.document.getElementById('slot-' + step).classList.contains('filled'), `รอบ ${round} ขั้น ${step}: รางเติม`);
    }
    ok(ev('roundsDone') === round, `รอบ ${round}: จบรอบ (roundsDone=${ev('roundsDone')})`);
    // เดินหน้ารอบใหม่ด้วยมือ (ข้าม setTimeout)
    ev('locked=false'); w.newRound();
  }
  // เรียงครบไร้พลาด → คอมโบขึ้น (ทุก 2 รอบ +1)
  ok(ev('maxStreak') >= 3, `practice: maxStreak สะสม (${ev('maxStreak')})`);
}

// ── (3) แตะผิดลำดับ → ไม่คืบหน้า + race เสียชีวิต ──
{
  const { w, ev } = newGame();
  w.chooseMode('race');
  ev('cancelAnimationFrame(rafId)');   // หยุด timer rAF ระหว่างตรวจ
  ok(ev('lives') === 3, 'race: เริ่ม 3 ชีวิต');
  const before = ev('score');
  // แตะการ์ดที่ "ไม่ใช่" ขั้นแรก (nextExpected=1) → ผิด
  const wrongN = ev('nextExpected') === 1 ? 3 : 1;
  w.tapCard(wrongN, cardFor(w, wrongN));
  ok(ev('score') === before, 'race: แตะผิด → คะแนนไม่ขึ้น');
  ok(ev('nextExpected') === 1, 'race: แตะผิด → nextExpected ไม่เลื่อน');
  ok(ev('lives') === 2, 'race: แตะผิด → เสีย 1 ชีวิต');
  ok(!cardFor(w, wrongN).classList.contains('done'), 'race: การ์ดผิดไม่ถูก mark done');
}

console.log(`\n${fail === 0 ? '✅' : '❌'} handwash-order: ${pass} ผ่าน, ${fail} พลาด`);
process.exit(fail === 0 ? 0 : 1);
