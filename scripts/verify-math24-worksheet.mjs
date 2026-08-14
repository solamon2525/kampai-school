import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const worksheetPath = path.join(repoRoot, 'public/games/math/math-24-worksheet.html');
const html = fs.readFileSync(worksheetPath, 'utf8');
const match = html.match(/const MATH24_ITEMS=(\[[\s\S]*?\n\]);\s*window\.WORKSHEET_CONFIG=/);

if (!match) {
  throw new Error('ไม่พบ MATH24_ITEMS ในใบงานเกม 24');
}

const context = {};
vm.runInNewContext(`items = ${match[1]}`, context, { timeout: 1000 });
const items = context.items;
const errors = [];
const canonicalKeys = new Set();
const topicCounts = new Map();

function evaluate(expression) {
  const normalized = expression.replaceAll('×', '*').replaceAll('÷', '/').replaceAll('−', '-');
  if (!/^[\d+\-*/().\s]+$/.test(normalized)) throw new Error(`มีอักขระที่ไม่อนุญาต: ${expression}`);
  return Function(`"use strict"; return (${normalized});`)();
}

for (const [index, item] of items.entries()) {
  const label = `ข้อ ${index + 1}`;
  const numbers = String(item.nums).match(/\d+/g)?.map(Number) || [];
  const key = [...numbers].sort((a, b) => a - b).join(',');
  const answerExpression = String(item.answer).split('=')[0].trim();
  const usedNumbers = answerExpression.match(/\d+/g)?.map(Number) || [];

  if (numbers.length !== 4 || numbers.some(number => number < 1 || number > 9)) {
    errors.push(`${label}: ต้องมีเลขหลักเดียว 1–9 จำนวน 4 ตัว`);
  }
  if (canonicalKeys.has(key)) errors.push(`${label}: ชุดเลขซ้ำ ${key}`);
  canonicalKeys.add(key);

  if ([...numbers].sort((a, b) => a - b).join(',') !== [...usedNumbers].sort((a, b) => a - b).join(',')) {
    errors.push(`${label}: สมการไม่ได้ใช้เลขต้นทางครบหนึ่งครั้ง`);
  }
  if (/(?:×\s*1\b|\b1\s*×|÷\s*1\b|[+−-]\s*0\b)/.test(answerExpression)) {
    errors.push(`${label}: พบ neutral-operation padding ใน ${answerExpression}`);
  }
  if (/\b(\d+)\s*÷\s*\1\b/.test(answerExpression)) {
    errors.push(`${label}: พบการหารเลขตัวเองใน ${answerExpression}`);
  }

  try {
    if (evaluate(answerExpression) !== 24) errors.push(`${label}: สมการไม่ได้ผลลัพธ์ 24`);
  } catch (error) {
    errors.push(`${label}: ประเมินสมการไม่ได้ (${error.message})`);
  }

  for (const stepName of ['step1', 'step2', 'step3']) {
    const [left, right] = String(item[stepName] || '').split('=').map(value => value.trim());
    try {
      const leftValue = evaluate(left);
      const rightValue = evaluate(right);
      if (leftValue !== rightValue || !Number.isInteger(rightValue) || rightValue <= 0) {
        errors.push(`${label} ${stepName}: ขั้นตอนไม่ถูกต้องหรือมีเศษส่วน/ค่าติดลบ`);
      }
    } catch (error) {
      errors.push(`${label} ${stepName}: ประเมินขั้นตอนไม่ได้ (${error.message})`);
    }
  }

  topicCounts.set(item.type, (topicCounts.get(item.type) || 0) + 1);
}

for (const topic of ['compute', 'plan', 'check', 'strategy']) {
  if (topicCounts.get(topic) !== 10) errors.push(`หัวข้อ ${topic}: ต้องมี 10 ข้อ`);
}
if (items.length < 40) errors.push(`คลังโจทย์มีเพียง ${items.length} ข้อ (ต้องมีอย่างน้อย 40)`);

if (errors.length) {
  console.error(errors.map(error => `FAIL ${error}`).join('\n'));
  process.exit(1);
}

console.log(`PASS math-24 worksheet: ${items.length} unique problems, 4 topics, integer-only steps`);
