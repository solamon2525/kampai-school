import fs from 'fs';
import path from 'path';

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function frac(n, d = 1) {
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

function add(x, y) { return frac(x.n * y.d + y.n * x.d, x.d * y.d); }
function sub(x, y) { return frac(x.n * y.d - y.n * x.d, x.d * y.d); }
function mul(x, y) { return frac(x.n * y.n, x.d * y.d); }
function div(x, y) { if (y.n === 0) return null; return frac(x.n * y.d, x.d * y.n); }

const ops = [
  { op: '+', sym: '+', fn: add },
  { op: '-', sym: '−', fn: sub },
  { op: '*', sym: '×', fn: mul },
  { op: '/', sym: '÷', fn: div }
];

function solve(list) {
  const solutions = [];
  function search(curr) {
    if (curr.length === 1) {
      if (curr[0].val.d === 1 && curr[0].val.n === 24) {
        solutions.push(curr[0]);
      }
      return;
    }
    for (let i = 0; i < curr.length; i++) {
      for (let j = 0; j < curr.length; j++) {
        if (i === j) continue;
        const rest = curr.filter((_, idx) => idx !== i && idx !== j);
        const a = curr[i], b = curr[j];
        for (const { op, sym } of ops) {
          let res = null;
          if (op === '+') res = add(a.val, b.val);
          else if (op === '-') res = sub(a.val, b.val);
          else if (op === '*') res = mul(a.val, b.val);
          else if (op === '/') res = div(a.val, b.val);
          if (res === null) continue;

          const hasFrac = a.hasFrac || b.hasFrac || res.d !== 1;
          const usesDiv = a.usesDiv || b.usesDiv || op === '/';
          const expr = `(${a.expr} ${sym} ${b.expr})`;
          const item = {
            val: res,
            expr,
            hasFrac,
            usesDiv,
            op: sym,
            left: a,
            right: b,
            complexity: (a.complexity || 0) + (b.complexity || 0) + (hasFrac ? 15 : (op === '/' ? 3 : (op === '*' ? 1 : 0)))
          };
          search([...rest, item]);
          if (solutions.length >= 6) return;
        }
      }
    }
  }
  search(list);
  if (solutions.length === 0) return null;
  solutions.sort((x, y) => {
    if (x.hasFrac !== y.hasFrac) return x.hasFrac ? 1 : -1;
    if (x.usesDiv !== y.usesDiv) return x.usesDiv ? 1 : -1;
    return x.complexity - y.complexity;
  });
  return solutions[0];
}

function formatFrac(f) {
  if (f.d === 1) return `${f.n}`;
  return `${f.n}/${f.d}`;
}

function makeHint(sol) {
  const left = sol.left;
  const right = sol.right;
  const op = sol.op;
  const lv = formatFrac(left.val);
  const rv = formatFrac(right.val);

  if (op === '×') {
    const v1 = left.val.n / left.val.d;
    const v2 = right.val.n / right.val.d;
    const pair = [v1, v2].sort((a, b) => a - b);
    if (pair[0] === 4 && pair[1] === 6) return 'สร้างกลุ่มตัวเลข 6 กับ 4 แล้วนำมาคูณกัน (6 × 4 = 24)';
    if (pair[0] === 3 && pair[1] === 8) return 'สร้างกลุ่มตัวเลข 8 กับ 3 แล้วนำมาคูณกัน (8 × 3 = 24)';
    if (pair[0] === 2 && pair[1] === 12) return 'สร้างกลุ่มตัวเลข 12 กับ 2 แล้วนำมาคูณกัน (12 × 2 = 24)';
    if (pair[0] === 1 && pair[1] === 24) return 'รวมกลุ่มให้ได้ 24 แล้วคูณด้วย 1 (24 × 1 = 24)';
    if (sol.hasFrac) return `สร้างเศษส่วน (${right.expr} = ${rv}) แล้วนำมาคูณ ${lv} (${lv} × ${rv} = 24)`;
    return `สร้างกลุ่มตัวเลข ${lv} กับ ${rv} แล้วนำมาคูณกัน (${lv} × ${rv} = 24)`;
  }
  if (op === '÷') {
    if (right.val.d !== 1) {
      return `สร้างเศษส่วน (${right.expr} = ${rv}) แล้วนำไปหาร ${lv} (${lv} ÷ ${rv} = 24)`;
    }
    return `สร้างกลุ่มตัวตั้ง ${lv} แล้วนำมาหารด้วย ${rv} (${lv} ÷ ${rv} = 24)`;
  }
  if (op === '+') {
    return `รวมกลุ่มตัวเลขให้ได้ ${lv} กับ ${rv} แล้วบวกกัน (${lv} + ${rv} = 24)`;
  }
  if (op === '−') {
    return `รวมกลุ่มตัวเลขให้ได้ ${lv} แล้วลบออกด้วย ${rv} (${lv} − ${rv} = 24)`;
  }
  return `โครงสร้างคำตอบ: ${sol.expr}`;
}

function getSubTarget(sol) {
  const op = sol.op;
  const lv = formatFrac(sol.left.val);
  const rv = formatFrac(sol.right.val);
  return `${lv} ${op} ${rv}`;
}

function getDifficulty(sol) {
  if (sol.hasFrac) return 'master';
  if (sol.usesDiv) return 'medium';
  if (sol.op === '×') {
    const pair = [sol.left.val.n, sol.right.val.n].sort((a, b) => a - b);
    if ((pair[0] === 4 && pair[1] === 6) || (pair[0] === 3 && pair[1] === 8) || (pair[0] === 2 && pair[1] === 12) || (pair[0] === 1 && pair[1] === 24)) {
      return 'easy';
    }
  }
  return 'medium';
}

const allSets = [];
const seenKey = new Set();

// 1. All numbers 1-10
for (let a = 1; a <= 10; a++) {
  for (let b = a; b <= 10; b++) {
    for (let c = b; c <= 10; c++) {
      for (let d = c; d <= 10; d++) {
        const key = `${a},${b},${c},${d}`;
        if (seenKey.has(key)) continue;
        const items = [
          { val: frac(a), expr: `${a}`, hasFrac: false, complexity: 0 },
          { val: frac(b), expr: `${b}`, hasFrac: false, complexity: 0 },
          { val: frac(c), expr: `${c}`, hasFrac: false, complexity: 0 },
          { val: frac(d), expr: `${d}`, hasFrac: false, complexity: 0 }
        ];
        const sol = solve(items);
        if (sol) {
          seenKey.add(key);
          const diff = getDifficulty(sol);
          allSets.push({
            nums: [a, b, c, d],
            solution: `${sol.expr} = 24`,
            hint: makeHint(sol),
            subTarget: getSubTarget(sol),
            difficulty: diff
          });
        }
      }
    }
  }
}

// 2. Add extra master sets up to 13 (playing cards) to ensure strong master level bank
for (let a = 1; a <= 13; a++) {
  for (let b = Math.max(a, 2); b <= 13; b++) {
    for (let c = Math.max(b, 3); c <= 13; c++) {
      for (let d = Math.max(c, 4); d <= 13; d++) {
        if (d <= 10) continue; // already scanned
        const key = `${a},${b},${c},${d}`;
        if (seenKey.has(key)) continue;
        const items = [
          { val: frac(a), expr: `${a}`, hasFrac: false, complexity: 0 },
          { val: frac(b), expr: `${b}`, hasFrac: false, complexity: 0 },
          { val: frac(c), expr: `${c}`, hasFrac: false, complexity: 0 },
          { val: frac(d), expr: `${d}`, hasFrac: false, complexity: 0 }
        ];
        const sol = solve(items);
        if (sol && sol.hasFrac) { // only take fraction master sets for 11-13
          seenKey.add(key);
          allSets.push({
            nums: [a, b, c, d],
            solution: `${sol.expr} = 24`,
            hint: makeHint(sol),
            subTarget: getSubTarget(sol),
            difficulty: 'master'
          });
        }
      }
    }
  }
}

console.log(`Generated ${allSets.length} sets:`);
const counts = { easy: 0, medium: 0, master: 0 };
allSets.forEach(s => counts[s.difficulty]++);
console.log(counts);

const fileHeader = `/**
 * math-24-data.js
 * Guaranteed Solvable 24-Number Dataset & Algorithmic Hint Engine
 * Kampai School • สพฐ. มาตรฐานการแข่งขันคณิตคิดเร็ว 24
 * Total Verified Solvable Sets: ${allSets.length}
 * Easy: ${counts.easy} | Medium: ${counts.medium} | Master: ${counts.master}
 */
(function() {
  'use strict';

  var DATASET = ${JSON.stringify(allSets, null, 2)};

  var BY_DIFF = {
    easy: DATASET.filter(function(d) { return d.difficulty === 'easy'; }),
    medium: DATASET.filter(function(d) { return d.difficulty === 'medium'; }),
    master: DATASET.filter(function(d) { return d.difficulty === 'master'; })
  };

  window.MATH_24_DATA = DATASET;
  window.MATH_24_BY_DIFF = BY_DIFF;

  window.MATH_24_ENGINE = {
    getAll: function() { return DATASET; },
    getByDifficulty: function(diff) { return BY_DIFF[diff] || DATASET; },
    getRandom: function(diff, rng) {
      var rand = rng || Math.random;
      var pool = (diff && BY_DIFF[diff] && BY_DIFF[diff].length > 0) ? BY_DIFF[diff] : DATASET;
      var idx = Math.floor(rand() * pool.length);
      var item = pool[idx];
      // Return a copy with shuffled nums for presentation
      var shuffledNums = item.nums.slice();
      for (var i = shuffledNums.length - 1; i > 0; i--) {
        var j = Math.floor(rand() * (i + 1));
        var temp = shuffledNums[i];
        shuffledNums[i] = shuffledNums[j];
        shuffledNums[j] = temp;
      }
      return {
        nums: shuffledNums,
        originalNums: item.nums.slice(),
        solution: item.solution,
        hint: item.hint,
        subTarget: item.subTarget,
        difficulty: item.difficulty
      };
    }
  };
})();
`;

fs.writeFileSync('public/games/math/math-24-data.js', fileHeader, 'utf8');
console.log('Saved public/games/math/math-24-data.js successfully!');
