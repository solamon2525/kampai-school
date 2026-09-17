#!/usr/bin/env node
/**
 * Empirical Challenger 1 Test Harness for Math Decimal Learning Studio
 * Adversarial stress testing for:
 * 1. Floating point arithmetic & rounding (Mode 3, Worksheet)
 * 2. Decimal comparison edge cases & step breakdown (Mode 2, Worksheet)
 * 3. Thai currency change calculations & banknote/coin distribution
 * 4. Fraction-to-decimal conversion equivalences & matching tile logic
 * 5. Full question bank and worksheet mathematical correctness
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const indexPath = resolve(repoRoot, 'public/games/math/math-decimal-hub/index.html');
const worksheetPath = resolve(repoRoot, 'public/games/math/math-decimal-hub-worksheet.html');

const indexHtml = readFileSync(indexPath, 'utf-8');
const worksheetHtml = readFileSync(worksheetPath, 'utf-8');

console.log('================================================================');
console.log('CHALLENGER 1: EMPIRICAL MATHEMATICAL & NUMERIC STRESS HARNESS');
console.log('================================================================\n');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const findings = [];

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  [FAIL] ${testName}: ${details}`);
    findings.push({ testName, details });
  }
}

// ----------------------------------------------------------------------
// 1. FLOATING POINT ARITHMETIC & ROUNDING QUIRKS (Mode 3 & System)
// ----------------------------------------------------------------------
console.log('--- TEST 1: Floating Point Representation & Rounding Quirks ---');

// In JS IEEE 754:
// 0.1 + 0.2 = 0.30000000000000004
// 10 - 0.01 = 9.99
// 0.07 + 0.03 = 0.10000000000000002
function testVcalc(curValA, curValB, curOpType) {
  const res = curOpType === '+' ? curValA + curValB : curValA - curValB;
  const resFormatted = Math.round(res * 1000) / 1000;
  const strRes = resFormatted.toFixed(2);
  return { res, resFormatted, strRes };
}

const vcalcCases = [
  { a: 0.1, b: 0.2, op: '+', expected: '0.30' },
  { a: 10.0, b: 0.01, op: '-', expected: '9.99' },
  { a: 0.07, b: 0.03, op: '+', expected: '0.10' },
  { a: 25.5, b: 14.25, op: '+', expected: '39.75' },
  { a: 50.0, b: 23.45, op: '-', expected: '26.55' },
  { a: 12.35, b: 7.8, op: '-', expected: '4.55' },
  { a: 8.03, b: 0.7, op: '-', expected: '7.33' },
  { a: 5.4, b: 1.25, op: '-', expected: '4.15' }
];

for (const tc of vcalcCases) {
  const out = testVcalc(tc.a, tc.b, tc.op);
  assert(out.strRes === tc.expected, `Vcalc ${tc.a} ${tc.op} ${tc.b} -> ${out.strRes}`, `Expected ${tc.expected}, got ${out.strRes}`);
}

// Adversarial investigation of IEEE 754 modulo check:
// In index.html line 1540: `curReadingVal % 0.01 === 0 ? 2 : 3`
// In index.html line 1696: `curCmpA.toFixed(curCmpA % 0.01 === 0 ? 2 : 3)`
console.log('\n--- Checking IEEE 754 Modulo Bug: `val % 0.01 === 0` ---');
const moduloChecks = [0.7, 0.65, 2.45, 0.09, 0.1];
let moduloBugCount = 0;
for (const v of moduloChecks) {
  const modVal = v % 0.01;
  const isZero = modVal === 0;
  const formatted = v.toFixed(v % 0.01 === 0 ? 2 : 3);
  if (!isZero) {
    moduloBugCount++;
    console.log(`  [BUG CONFIRMED] ${v} % 0.01 = ${modVal} !== 0 -> formatted as "${formatted}" instead of 2 decimals!`);
  }
}
assert(moduloBugCount > 0, `Discovered IEEE 754 modulo formatting bug in Mode 1 & 2`, `(val % 0.01 === 0) fails for ${moduloBugCount}/${moduloChecks.length} standard decimals`);

// ----------------------------------------------------------------------
// 2. DECIMAL COMPARISON EDGE CASES (Mode 2)
// ----------------------------------------------------------------------
console.log('\n--- TEST 2: Decimal Comparison Edge Cases ---');

function compareDecimals(curCmpA, curCmpB) {
  let symbol = '=';
  if (curCmpA > curCmpB) symbol = '>';
  else if (curCmpA < curCmpB) symbol = '<';

  // Step by step logic from index.html
  const partsA = curCmpA.toFixed(3).split('.');
  const partsB = curCmpB.toFixed(3).split('.');
  const intA = parseInt(partsA[0], 10);
  const intB = parseInt(partsB[0], 10);
  const tA = parseInt(partsA[1][0], 10);
  const tB = parseInt(partsB[1][0], 10);
  const hA = parseInt(partsA[1][1], 10);
  const hB = parseInt(partsB[1][1], 10);

  let stepConclusion = '';
  if (intA !== intB) {
    stepConclusion = intA > intB ? '>' : '<';
  } else if (tA !== tB) {
    stepConclusion = tA > tB ? '>' : '<';
  } else if (hA !== hB) {
    stepConclusion = hA > hB ? '>' : '<';
  } else {
    stepConclusion = '=';
  }
  return { symbol, stepConclusion };
}

const comparisonCases = [
  { a: 0.7, b: 0.70, expected: '=' },
  { a: 0.65, b: 0.7, expected: '<' },
  { a: 0.09, b: 0.10, expected: '<' },
  { a: 0.009, b: 0.01, expected: '<' },
  { a: 1.2, b: 1.18, expected: '>' },
  { a: 2.35, b: 2.53, expected: '<' },
  { a: 0.08, b: 0.8, expected: '<' },
  { a: 0.4, b: 0.40, expected: '=' }
];

for (const tc of comparisonCases) {
  const { symbol, stepConclusion } = compareDecimals(tc.a, tc.b);
  assert(symbol === tc.expected, `Symbol Comparison ${tc.a} vs ${tc.b} -> ${symbol}`, `Expected ${tc.expected}, got ${symbol}`);
  assert(stepConclusion === tc.expected, `Step Breakdown Comparison ${tc.a} vs ${tc.b} -> ${stepConclusion}`, `Expected ${tc.expected}, got ${stepConclusion}`);
}

// Adversarial test: numbers differing only in thousandths (3rd decimal place)
console.log('\n--- Checking 3-Decimal Thousandths Comparison Edge Case ---');
const thousandthsCase = compareDecimals(0.125, 0.128);
console.log(`  Comparing 0.125 vs 0.128: symbol="${thousandthsCase.symbol}", stepConclusion="${thousandthsCase.stepConclusion}"`);
if (thousandthsCase.symbol === '<' && thousandthsCase.stepConclusion === '=') {
  console.log(`  [BUG CONFIRMED] Mode 2 step breakdown fails for 3-decimal differences (reports "=" while symbol is "<")!`);
  findings.push({
    testName: 'Mode 2 thousandths step breakdown truncation',
    details: '0.125 vs 0.128 evaluates symbol to "<" but step logic has no thousandths check and concludes "0.125 = 0.128"'
  });
}

// ----------------------------------------------------------------------
// 3. THAI CURRENCY CHANGE CALCULATIONS
// ----------------------------------------------------------------------
console.log('\n--- TEST 3: Thai Currency Change Calculations ---');

function formatChangeCoins(amount) {
  let rem = Math.round(amount * 100);
  const coins = [];
  if (rem >= 2000) { const c = Math.floor(rem / 2000); coins.push({ name: 'ธนบัตร 20 บาท', count: c, val: c * 20 }); rem %= 2000; }
  if (rem >= 1000) { const c = Math.floor(rem / 1000); coins.push({ name: 'เหรียญ 10 บาท', count: c, val: c * 10 }); rem %= 1000; }
  if (rem >= 500) { const c = Math.floor(rem / 500); coins.push({ name: 'เหรียญ 5 บาท', count: c, val: c * 5 }); rem %= 500; }
  if (rem >= 200) { const c = Math.floor(rem / 200); coins.push({ name: 'เหรียญ 2 บาท', count: c, val: c * 2 }); rem %= 200; }
  if (rem >= 100) { const c = Math.floor(rem / 100); coins.push({ name: 'เหรียญ 1 บาท', count: c, val: c * 1 }); rem %= 100; }
  if (rem >= 50) { const c = Math.floor(rem / 50); coins.push({ name: 'เหรียญ 50 สตางค์', count: c, val: c * 0.5 }); rem %= 50; }
  if (rem >= 25) { const c = Math.floor(rem / 25); coins.push({ name: 'เหรียญ 25 สตางค์', count: c, val: c * 0.25 }); rem %= 25; }
  return { coins, remainingRem: rem };
}

// Target test from prompt: 100 บาท paying for 38.75 บาท -> change 61.25 บาท
const targetChange = 100 - 38.75;
assert(Math.abs(targetChange - 61.25) < 1e-9, `Target change 100 - 38.75 = 61.25`, `Got ${targetChange}`);
const changeDistribution = formatChangeCoins(targetChange);
const totalCoinsVal = changeDistribution.coins.reduce((acc, c) => acc + c.val, 0);
assert(Math.abs(totalCoinsVal - 61.25) < 1e-9, `Sum of change denominations = 61.25 บาท`, `Got ${totalCoinsVal}`);
assert(changeDistribution.remainingRem === 0, `Zero leftover satang in 61.25 change`, `Leftover: ${changeDistribution.remainingRem}`);
console.log(`  61.25 Denominations:`, changeDistribution.coins.map(c => `${c.name} x ${c.count}`).join(', '));

// Test all 5 SHOPPING_STORIES in index.html
const SHOPPING_STORIES = [
  { item1: 'สมุดบันทึก', p1: 25.50, item2: 'ดินสอกด', p2: 14.25, pay: 50 },
  { item1: 'นมกล่องรสหวาน', p1: 12.75, item2: 'ขนมปังเนยสด', p2: 18.50, pay: 50 },
  { item1: 'กล่องดินสอ', p1: 45.50, item2: 'ยางลบแท่ง', p2: 8.50, pay: 100 },
  { item1: 'สมุดวาดภาพ', p1: 32.25, item2: 'สีไม้ 12 สี', p2: 42.50, pay: 100 },
  { item1: 'กรรไกรตัดกระดาษ', p1: 20.25, item2: 'กาวน้ำ', p2: 15.50, pay: 50 }
];

for (let i = 0; i < SHOPPING_STORIES.length; i++) {
  const s = SHOPPING_STORIES[i];
  const total = Math.round((s.p1 + s.p2) * 100) / 100;
  const change = Math.round((s.pay - total) * 100) / 100;
  const dist = formatChangeCoins(change);
  const sumVal = dist.coins.reduce((acc, c) => acc + c.val, 0);
  assert(Math.abs(sumVal - change) < 1e-9 && dist.remainingRem === 0, `Shopping Story ${i+1}: pay ${s.pay} - (${s.p1}+${s.p2}=${total}) = ${change}`, `Denomination mismatch: sum=${sumVal}, rem=${dist.remainingRem}`);
}

// ----------------------------------------------------------------------
// 4. FRACTION-TO-DECIMAL CONVERSION EQUIVALENCES & MATCHING GAME
// ----------------------------------------------------------------------
console.log('\n--- TEST 4: Fraction-to-Decimal Equivalences & Matching Game ---');

const MATCH_PAIRS_ALL = [
  { frac: '1/2', dec: '0.5' },
  { frac: '1/4', dec: '0.25' },
  { frac: '3/4', dec: '0.75' },
  { frac: '1/10', dec: '0.1' },
  { frac: '3/10', dec: '0.3' },
  { frac: '7/10', dec: '0.7' },
  { frac: '1/5', dec: '0.2' },
  { frac: '2/5', dec: '0.4' },
  { frac: '50/100', dec: '0.5' },
  { frac: '25/100', dec: '0.25' }
];

for (const pair of MATCH_PAIRS_ALL) {
  const [num, den] = pair.frac.split('/').map(Number);
  const val = num / den;
  const decVal = parseFloat(pair.dec);
  assert(Math.abs(val - decVal) < 1e-9, `Fraction equivalence: ${pair.frac} === ${pair.dec}`);
}

// Adversarial test: Mode 4 Matching Game Duplicate Card Hazard!
console.log('\n--- Checking Matching Game Duplicate Card Collision Bug ---');
// Notice:
// pair 0: '1/2' -> '0.5'
// pair 8: '50/100' -> '0.5'
// pair 1: '1/4' -> '0.25'
// pair 9: '25/100' -> '0.25'
let duplicateDetected = false;
const decCount = {};
for (const p of MATCH_PAIRS_ALL) {
  decCount[p.dec] = (decCount[p.dec] || 0) + 1;
}
for (const [dec, count] of Object.entries(decCount)) {
  if (count > 1) {
    duplicateDetected = true;
    console.log(`  [BUG CONFIRMED] MATCH_PAIRS_ALL contains ${count} items with identical dec: "${dec}"`);
  }
}
assert(duplicateDetected, `Duplicate decimal representations in MATCH_PAIRS_ALL verified (0.5 and 0.25)`);

// Simulate collision in 10,000 random 6-pair selections
let collisionGames = 0;
const SIM_ROUNDS = 10000;
for (let r = 0; r < SIM_ROUNDS; r++) {
  const shuffled = [...MATCH_PAIRS_ALL].sort(() => Math.random() - 0.5).slice(0, 6);
  const seenDecs = new Set();
  let hasDup = false;
  for (const p of shuffled) {
    if (seenDecs.has(p.dec)) {
      hasDup = true;
      break;
    }
    seenDecs.add(p.dec);
  }
  if (hasDup) collisionGames++;
}
const collisionPct = ((collisionGames / SIM_ROUNDS) * 100).toFixed(1);
console.log(`  In 10,000 randomized games: ${collisionGames} (${collisionPct}%) contain duplicate decimal tiles!`);
findings.push({
  testName: 'Matching Game Duplicate Tile & False Mismatch Bug',
  details: `MATCH_PAIRS_ALL contains both 1/2=0.5 and 50/100=0.5, as well as 1/4=0.25 and 25/100=0.25. When both appear (in ~${collisionPct}% of games), two identical tiles ("0.5" or "0.25") appear with different pairIds. If a student matches 1/2 with the second 0.5 tile, it falsely rejects as a mismatch.`
});

// ----------------------------------------------------------------------
// 5. WORKSHEET 50-ITEM MATHEMATICAL AUDIT
// ----------------------------------------------------------------------
console.log('\n--- TEST 5: Comprehensive Worksheet 50-Item Mathematical Audit ---');

// Extract ITEMS array from worksheetHtml
const itemsMatch = worksheetHtml.match(/const ITEMS = (\[[\s\S]*?\]);/);
if (!itemsMatch) {
  assert(false, 'Extract ITEMS from worksheetHtml', 'Could not locate const ITEMS');
} else {
  const itemsStr = itemsMatch[1];
  const items = eval(itemsStr);
  assert(items.length === 50, `Worksheet has 50 items (found ${items.length})`);

  let mathErrors = 0;
  for (const item of items) {
    if (item.type === 'addsub') {
      // Check arithmetic expressions
      if (item.expr.includes('+')) {
        const parts = item.expr.split('+').map(s => parseFloat(s.trim()));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          const sum = Math.round((parts[0] + parts[1]) * 1000) / 1000;
          const ans = parseFloat(item.answer);
          if (Math.abs(sum - ans) > 1e-4) {
            mathErrors++;
            console.error(`  [MATH ERROR] Worksheet item ${item.id}: ${item.expr} computed=${sum}, answer=${item.answer}`);
          }
        }
      } else if (item.expr.includes('−') || item.expr.includes('-')) {
        const op = item.expr.includes('−') ? '−' : '-';
        if (!item.expr.includes('(')) {
          const parts = item.expr.split(op).map(s => parseFloat(s.trim()));
          if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
            const diff = Math.round((parts[0] - parts[1]) * 1000) / 1000;
            const ans = parseFloat(item.answer);
            if (Math.abs(diff - ans) > 1e-4) {
              mathErrors++;
              console.error(`  [MATH ERROR] Worksheet item ${item.id}: ${item.expr} computed=${diff}, answer=${item.answer}`);
            }
          }
        }
      }
    } else if (item.type === 'compare') {
      if (item.checkSymbol) {
        // e.g. "2.45 กับ 2.5"
        const nums = item.val.split('กับ').map(s => parseFloat(s.trim()));
        if (nums.length === 2 && !isNaN(nums[0]) && !isNaN(nums[1])) {
          let expectedSym = '=';
          if (nums[0] > nums[1]) expectedSym = '>';
          else if (nums[0] < nums[1]) expectedSym = '<';
          if (expectedSym !== item.checkSymbol) {
            mathErrors++;
            console.error(`  [MATH ERROR] Worksheet comparison ${item.id}: ${item.val} expected=${expectedSym}, checkSymbol=${item.checkSymbol}`);
          }
        }
      }
    }
  }
  assert(mathErrors === 0, `All worksheet arithmetic and comparison items mathematically verified`);
}

// ----------------------------------------------------------------------
// SUMMARY
// ----------------------------------------------------------------------
console.log('\n================================================================');
console.log(`TOTAL CHECKS: ${totalTests} | PASSED: ${passedTests} | FAILED: ${failedTests}`);
console.log(`CONFIRMED FINDINGS & BUGS: ${findings.length}`);
console.log('================================================================\n');

for (let i = 0; i < findings.length; i++) {
  console.log(`${i + 1}. [${findings[i].testName}] ${findings[i].details}`);
}
