import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(repoRoot, 'public/games/math/math-24-worksheet.html'), 'utf8');
const match = html.match(/const MATH24_TYPES=[\s\S]*?function selectMath24Pages\([\s\S]*?\n}\n(?=window\.__MATH24_BANK_STATS)/);
if (!match) throw new Error('ไม่พบตัวสร้างคลังและตัวเลือกโจทย์เกม 24');
const context = {};
vm.runInNewContext(`${match[0]}\nresultItems=MATH24_ITEMS;resultSelector=selectMath24Pages;`, context, { timeout: 10000 });
const items = context.resultItems;
const selectPages = context.resultSelector;
const errors = [];
const canonicalKeys = new Set();
const topicCounts = new Map();

function parseExpression(expression) {
  const compact = expression.replaceAll(' ', '');
  const tokens = compact.match(/\d+|[()+×÷−-]/g) || [];
  if (tokens.join('') !== compact) throw new Error(`มีอักขระที่ไม่อนุญาต: ${expression}`);
  let index = 0;
  const makeNode = (operator, left, right) => {
    if (!Number.isInteger(left.value) || !Number.isInteger(right.value) || left.value <= 0 || right.value <= 0) throw new Error('พบเศษส่วนหรือค่าที่ไม่เป็นบวก');
    let value;
    if (operator === '+') value = left.value + right.value;
    else if (operator === '−' || operator === '-') {
      value = left.value - right.value;
      if (value <= 0) throw new Error('พบผลลัพธ์ศูนย์หรือติดลบ');
    } else if (operator === '×') {
      if (left.value === 1 || right.value === 1) throw new Error('พบการคูณด้วย 1');
      value = left.value * right.value;
    } else if (operator === '÷') {
      if (right.value === 1 || left.value === right.value) throw new Error('พบการหารแบบ neutral padding');
      if (left.value % right.value !== 0) throw new Error('พบการหารไม่ลงตัว');
      value = left.value / right.value;
    }
    if (!Number.isInteger(value) || value <= 0) throw new Error('พบเศษส่วนหรือค่าที่ไม่เป็นบวก');
    return { value, numbers: [...left.numbers, ...right.numbers], operations: [...left.operations, ...right.operations, operator] };
  };
  const factor = () => {
    if (tokens[index] === '(') {
      index += 1;
      const node = expressionNode();
      if (tokens[index] !== ')') throw new Error('วงเล็บไม่ครบ');
      index += 1;
      return node;
    }
    const token = tokens[index++];
    if (!/^\d+$/.test(token || '')) throw new Error('คาดว่าจะพบตัวเลข');
    return { value: Number(token), numbers: [Number(token)], operations: [] };
  };
  const term = () => {
    let node = factor();
    while (tokens[index] === '×' || tokens[index] === '÷') node = makeNode(tokens[index++], node, factor());
    return node;
  };
  const expressionNode = () => {
    let node = term();
    while (tokens[index] === '+' || tokens[index] === '−' || tokens[index] === '-') node = makeNode(tokens[index++], node, term());
    return node;
  };
  const result = expressionNode();
  if (index !== tokens.length) throw new Error('สมการมี token เหลือ');
  return result;
}

for (const [itemIndex, item] of items.entries()) {
  const label = `ข้อ ${itemIndex + 1}`;
  const numbers = String(item.nums).match(/\d+/g)?.map(Number) || [];
  const key = [...numbers].sort((a, b) => a - b).join(',');
  const answerExpression = String(item.answer).split('=')[0].trim();
  if (numbers.length !== 4 || numbers.some(number => number < 1 || number > 9)) errors.push(`${label}: ต้องมีเลขหลักเดียว 1–9 จำนวน 4 ตัว`);
  if (canonicalKeys.has(key)) errors.push(`${label}: ชุดเลขซ้ำ ${key}`);
  canonicalKeys.add(key);
  try {
    const result = parseExpression(answerExpression);
    if (result.value !== 24) errors.push(`${label}: สมการไม่ได้ผลลัพธ์ 24`);
    if ([...result.numbers].sort((a, b) => a - b).join(',') !== key) errors.push(`${label}: สมการไม่ได้ใช้เลขต้นทางครบหนึ่งครั้ง`);
    if (result.operations.includes('÷') !== Boolean(item.hasDivision)) errors.push(`${label}: ป้ายกำกับการหารไม่ตรงกับสมการ`);
  } catch (error) {
    errors.push(`${label}: ${error.message}`);
  }
  for (const stepName of ['step1', 'step2', 'step3']) {
    const [left, right] = String(item[stepName] || '').split('=').map(value => value.trim());
    try {
      const result = parseExpression(left);
      if (result.value !== Number(right) || !Number.isInteger(Number(right)) || Number(right) <= 0) errors.push(`${label} ${stepName}: ขั้นตอนไม่ถูกต้อง`);
    } catch (error) {
      errors.push(`${label} ${stepName}: ${error.message}`);
    }
  }
  topicCounts.set(item.type, (topicCounts.get(item.type) || 0) + 1);
}
for (const topic of ['compute', 'plan', 'check', 'strategy']) if (topicCounts.get(topic) < 30) errors.push(`หัวข้อ ${topic}: ต้องมีอย่างน้อย 30 ข้อ`);
if (items.length < 120) errors.push(`คลังโจทย์มีเพียง ${items.length} ข้อ (ต้องมีอย่างน้อย 120)`);
if (items.filter(item => item.hasOne).length > items.length * 0.2) errors.push('คลังมีโจทย์เลข 1 มากกว่า 20%');

function createRng(seed) {
  let state = seed >>> 0;
  const random = () => { state += 0x6D2B79F5; let value = state; value = Math.imul(value ^ (value >>> 15), value | 1); value ^= value + Math.imul(value ^ (value >>> 7), value | 61); return ((value ^ (value >>> 14)) >>> 0) / 4294967296; };
  return { random, shuffle(list) { const output = [...list]; for (let i = output.length - 1; i > 0; i -= 1) { const pick = Math.floor(random() * (i + 1)); [output[i], output[pick]] = [output[pick], output[i]]; } return output; } };
}
for (let seed = 1; seed <= 500; seed += 1) {
  for (const topic of ['mixed', 'compute', 'plan', 'check', 'strategy']) {
    for (const count of [5, 10]) {
      const rng = createRng(seed * 97 + count);
      const selectedPool = topic === 'mixed' ? items : items.filter(item => item.type === topic);
      const pages = selectPages({ fullPool: items, selectedPool, count, pageCount: 3, shuffle: list => rng.shuffle(list), nextRandom: rng.random });
      const seen = new Set();
      for (const [pageIndex, page] of pages.entries()) {
        const divisionCount = page.filter(item => item.hasDivision).length;
        const oneCount = page.filter(item => item.hasOne).length;
        if (page.length !== count) errors.push(`seed ${seed} ${topic} หน้า ${pageIndex + 1}: จำนวนข้อไม่ครบ`);
        if (divisionCount < (count === 10 ? 2 : 1) || divisionCount > (count === 10 ? 3 : 2)) errors.push(`seed ${seed} ${topic} หน้า ${pageIndex + 1}: สัดส่วนการหารผิด`);
        if (oneCount > (count === 10 ? 2 : 1)) errors.push(`seed ${seed} ${topic} หน้า ${pageIndex + 1}: มีเลข 1 มากเกินกำหนด`);
        for (const item of page) { if (seen.has(item.key)) errors.push(`seed ${seed} ${topic}: ชุดเลขซ้ำข้ามหน้า ${item.key}`); seen.add(item.key); }
      }
    }
  }
}
if (errors.length) {
  console.error(errors.slice(0, 100).map(error => `FAIL ${error}`).join('\n'));
  if (errors.length > 100) console.error(`... และอีก ${errors.length - 100} รายการ`);
  process.exit(1);
}
console.log(`PASS math-24 worksheet: ${items.length} unique problems, 4 topics, exact-integer division, 500-seed quota matrix`);
