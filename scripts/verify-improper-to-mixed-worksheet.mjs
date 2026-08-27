import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'public/games/math/improper-to-mixed-worksheet.html'), 'utf8');
const script = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  .map((match) => match[1])
  .find((source) => source.includes('createImproperItem') && source.includes('WORKSHEET_CONFIG'));
if (!script) throw new Error('ไม่พบตัวสร้างโจทย์แปลงเศษเกิน');

const context = { window: { KampaiTopicWorksheet: { escapeHtml: String } } };
vm.runInNewContext(`${script}\nresult={createImproperItem,config:window.WORKSHEET_CONFIG};`, context, { timeout: 10000 });
const { createImproperItem, config } = context.result;
const errors = [];

function visibleText(rendered) {
  return rendered
    .replace(/<span class="(?:slot(?: [^"]*)?|ans-fill)"[^>]*>[\s\S]*?<\/span>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const reducible = createImproperItem(3, 16, 18, 'reducible');
for (const count of [5, 10]) {
  const rendered = config.renderQuestion(reducible, 0, { count });
  const visible = visibleText(rendered);
  if (visible.includes('18 × 3') || visible.includes('= 54') || visible.includes('= 16') || visible.includes('8/9')) {
    errors.push(`${count} ข้อ: ค่าคำนวณของ 70/18 รั่วก่อนเปิดเฉลย (${visible})`);
  }
  for (const value of ['3', '16', '54', '2']) {
    if (!rendered.includes(`class="slot short">${value}</span>`)) errors.push(`${count} ข้อ: ขาดช่องเฉลยค่า ${value}`);
  }
  if (!rendered.includes('class="slot mixed"><span class="frac-box"')) errors.push(`${count} ข้อ: ขาดช่องเศษส่วนอย่างต่ำ`);
}

const simple = createImproperItem(2, 1, 6, 'basic');
for (const count of [5, 10]) {
  const rendered = config.renderQuestion(simple, 0, { count });
  if (!rendered.includes('ส่วนเศษเป็นเศษส่วนอย่างต่ำแล้ว')) errors.push(`${count} ข้อ: ขาดขั้นตรวจกรณีไม่ต้องย่อ`);
}

for (const required of [
  'grid-auto-rows: 6.2mm',
  'justify-content: flex-start',
  'gap: 4mm',
  'margin-top: auto',
]) if (!html.includes(required)) errors.push(`CSS ขาดกติกา ${required}`);

if (errors.length) {
  console.error(errors.map((error) => `FAIL ${error}`).join('\n'));
  process.exit(1);
}
console.log('PASS improper-to-mixed: hidden calculations, fixed writable rows, left-aligned answer');
