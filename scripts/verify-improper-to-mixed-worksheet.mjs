import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'public/games/math/improper-to-mixed-worksheet.html'), 'utf8');
const source = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1])
  .find((script) => script.includes('createImproperItem') && script.includes('WORKSHEET_CONFIG'));
if (!source) throw new Error('ไม่พบตัวสร้างโจทย์แปลงเศษเกินและจำนวนคละ');

const controls = { selDirection: { value: 'both' }, selTopic: { value: 'mixed' }, selCount: { value: '8' } };
const context = {
  document: { getElementById: (id) => controls[id] || null },
  window: { KampaiTopicWorksheet: { escapeHtml: String } },
};
vm.runInNewContext(`${source}\nresult={createImproperItem,getAllPools,selectMultiPageItems,config:window.WORKSHEET_CONFIG,gcd};`, context, { timeout: 10000 });
const { createImproperItem, getAllPools, selectMultiPageItems, config, gcd } = context.result;
const errors = [];
const fail = (message) => errors.push(message);

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffled(values, random) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    [result[index], result[swap]] = [result[swap], result[index]];
  }
  return result;
}

const reducible = { ...createImproperItem(3, 16, 18, 'reducible'), direction: 'improper-to-mixed' };
for (const count of [5, 8]) {
  const rendered = config.renderQuestion(reducible, 0, { count });
  if (rendered.includes('18 × 3 = 54') || rendered.includes('70 − 54 = 16')) fail(`${count} ข้อ: 70/18 เปิดค่าคำนวณก่อนเฉลย`);
  for (const value of ['3', '16', '54', '2']) {
    if (!rendered.includes(`class="slot short">${value}</span>`)) fail(`${count} ข้อ: ขาดช่องซ่อนค่า ${value}`);
  }
  if (!rendered.includes('class="slot mixed"><span class="frac-box"')) fail(`${count} ข้อ: ขาดช่องซ่อนเศษส่วนอย่างต่ำ`);
}

const reverse = { ...createImproperItem(3, 2, 5, 'standard'), direction: 'mixed-to-improper' };
for (const count of [5, 8]) {
  const rendered = config.renderQuestion(reverse, 0, { count });
  for (const value of ['15', '17', '5']) {
    if (!rendered.includes(`class="slot short">${value}</span>`)) fail(`${count} ข้อ: โหมดย้อนกลับขาดช่องซ่อนค่า ${value}`);
  }
  if (!rendered.includes('3 × 5') || !rendered.includes('+ 2') || !rendered.includes('แปลงเป็นเศษเกิน')) fail(`${count} ข้อ: scaffold 3 2/5 ไม่ครบ`);
  if (!rendered.includes('<span class="ans-fill"><span class="frac-box"><span class="num">17</span><span class="den">5</span>')) fail(`${count} ข้อ: คำตอบ 17/5 ไม่ถูกต้อง`);
}

const pools = getAllPools();
for (const item of pools.mixed) {
  if (item.numerator !== item.whole * item.denominator + item.remainder) fail(`สมการต้นทางผิด ${item.key}`);
  if (item.remainder <= 0 || item.remainder >= item.denominator) fail(`ส่วนเศษไม่เป็นเศษส่วนแท้ ${item.key}`);
  if (gcd(item.simpleNum, item.simpleDen) !== 1) fail(`จำนวนคละย้อนกลับไม่อย่างต่ำ ${item.key}`);
}

for (const direction of ['improper-to-mixed', 'mixed-to-improper', 'both']) {
  controls.selDirection.value = direction;
  for (const count of [5, 8]) {
    for (const pageCount of [1, 3, 5, 10]) {
      const random = seededRandom(2272206187 + count * 100 + pageCount);
      const pages = selectMultiPageItems({
        fullPool: pools.mixed,
        selectedPool: pools.mixed,
        count,
        pageCount,
        shuffle: (values) => shuffled(values, random),
        nextRandom: random,
      });
      const items = pages.flat();
      if (items.length !== count * pageCount) fail(`${direction}: จำนวนข้อไม่ครบ ${count}×${pageCount}`);
      if (new Set(items.map((item) => item.valueKey)).size !== items.length) fail(`${direction}: มีโจทย์ค่าซ้ำข้ามหน้า`);
      if (direction !== 'both' && items.some((item) => item.direction !== direction)) fail(`${direction}: มีทิศทางอื่นปะปน`);
      if (direction === 'both') {
        for (const page of pages) {
          const forward = page.filter((item) => item.direction === 'improper-to-mixed').length;
          if (Math.abs(forward - (page.length - forward)) > 1) fail('both: กระจายสองทิศทางไม่สมดุล');
        }
      }
    }
  }
}

controls.selCount.value = '';
config.applyExtraControls({ count: 10 });
if (controls.selCount.value !== '8') fail('saved set รุ่นเดิม count=10 ไม่ถูกปรับเป็น 8');

for (const required of [
  'questions.count-8',
  'grid-template-rows: repeat(4, minmax(0, 1fr))',
  'font-size: 13pt',
  'grid-auto-rows: 7mm',
  '<option value="8" selected>',
  'data-standard-count="8"',
]) if (!html.includes(required)) fail(`ขาดกติกา 8 ข้อ: ${required}`);
if (html.includes('questions.count-10') || html.includes('10 ข้อ/หน้า')) fail('ยังมีโหมด 10 ข้อต่อหน้าในใบงาน');

if (errors.length) {
  console.error(errors.map((error) => `FAIL ${error}`).join('\n'));
  process.exit(1);
}
console.log('PASS mixed-number worksheet: 8/5 layout, bidirectional math, hidden values, balanced unique sets');
