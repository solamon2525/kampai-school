import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const worksheetPath = path.join(repoRoot, 'public/games/math/fraction-pieces-worksheet.html');
const html = fs.readFileSync(worksheetPath, 'utf8');
const scriptMatch = html.match(/<script src="\/games\/worksheet-runtime[^>]*><\/script>\s*<script>([\s\S]*?)<\/script>\s*<script src="\/games\/worksheet-topic/);

if (!scriptMatch) throw new Error('ไม่พบสคริปต์สร้างโจทย์เศษส่วน');

let grade = 4;
const context = {
  window: {},
  document: { getElementById: (id) => id === 'selGrade' ? { value: String(grade) } : null },
};
vm.runInNewContext(`${scriptMatch[1]}\nglobalThis.__fractionApi={TOPICS,buildPool,shapeSvg,compareValue,simplify};`, context, { timeout: 3000 });
const { TOPICS, buildPool, shapeSvg, compareValue } = context.__fractionApi;
const errors = [];

for (grade = 4; grade <= 5; grade += 1) {
  const allKeys = new Set();
  for (const topic of TOPICS) {
    const items = buildPool(topic);
    if (items.length < 80) errors.push(`ป.${grade} ${topic}: มีโจทย์น้อยกว่า 80 ข้อ`);
    for (const item of items) {
      if (allKeys.has(item.key)) errors.push(`ป.${grade}: key ซ้ำ ${item.key}`);
      allKeys.add(item.key);
      if (!(item.n > 0 && item.d > item.n)) errors.push(`${item.key}: เศษส่วนพื้นฐานไม่ถูกต้อง ${item.n}/${item.d}`);

      const svg = shapeSvg(item.n, item.d, item.shape, item.blank);
      const partCount = (svg.match(/class="fraction-part/g) || []).length;
      if (partCount !== item.d) errors.push(`${item.key}: ภาพมี ${partCount} ส่วน แต่ตัวส่วนเป็น ${item.d}`);
      const fillCount = (svg.match(/is-filled/g) || []).length;
      if (fillCount !== (item.blank ? 0 : item.n)) errors.push(`${item.key}: จำนวนส่วนที่ระบายไม่ตรงตัวเศษ`);

      if (topic === 'compare') {
        const expected = `${item.n}/${item.d} ${compareValue(item.n,item.d,item.n2,item.d2)} ${item.n2}/${item.d2}`;
        if (item.answer !== expected) errors.push(`${item.key}: เครื่องหมายเปรียบเทียบผิด`);
      } else if (topic === 'equivalent') {
        const expected = String(item.missing === 'num' ? item.n * item.factor : item.d * item.factor);
        if (item.answer !== expected) errors.push(`${item.key}: เศษส่วนเท่ากันผิด`);
      } else if (topic === 'numberline' && item.answer !== `${item.n}/${item.d}`) {
        errors.push(`${item.key}: ค่าบนเส้นจำนวนผิด`);
      } else if (topic === 'mixednumber' && item.imp !== item.whole * item.d + item.n) {
        errors.push(`${item.key}: แปลงจำนวนคละผิด`);
      }
    }
  }
}

if (!html.includes('/games/math/fraction-pieces-media.html')) errors.push('source media ไม่ใช่ canonical URL');
if (!html.includes('data-fixed-count="5"')) errors.push('โหมดการสอนไม่ได้ล็อกจำนวนข้อเฉพาะกิจ 5 ข้อ');

if (errors.length) {
  console.error(errors.slice(0, 30).map(error => `FAIL ${error}`).join('\n'));
  if (errors.length > 30) console.error(`... และอีก ${errors.length - 30} รายการ`);
  process.exit(1);
}

console.log('PASS fraction-pieces worksheet: 2 grades, 10 topics, 80+ unique items/topic, equal visual partitions');
