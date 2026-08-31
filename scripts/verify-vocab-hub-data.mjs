import fs from 'node:fs';
import vm from 'node:vm';

const htmlPath = 'public/games/english/vocab-hub.html';
const dataPath = 'public/games/english/vocab-hub-data.js';
const html = fs.readFileSync(htmlPath, 'utf8').replace(/\r\n/g, '\n');
const dataCode = fs.readFileSync(dataPath, 'utf8');

function extractConst(name, nextMarker) {
  const start = html.indexOf(`const ${name} =`);
  const end = html.indexOf(nextMarker, start);
  if (start < 0 || end < 0) throw new Error(`หา ${name} ใน ${htmlPath} ไม่พบ`);
  return html.slice(start, end);
}

const context = { window: {} };
vm.createContext(context);
vm.runInContext(`${extractConst('TOPIC_META', '// =====================================================================\n// VOCABULARY DATA')};globalThis.meta=TOPIC_META;`, context);
vm.runInContext(`${extractConst('TOPICS', 'const EXTENDED_TOPICS')};globalThis.base=TOPICS;`, context);
vm.runInContext(dataCode, context);

const topics = context.base;
const extended = context.window.VOCAB_HUB_EXTENDED_TOPICS || {};
Object.entries(extended).forEach(([slug, items]) => topics[slug].push(...items));

const fixedCounts = { numbers: 100, days: 7, months: 12, alphabet: 26, seasons: 4 };
const metaSlugs = context.meta.map(item => item.slug);
const errors = [];

if (metaSlugs.length !== 28) errors.push(`ต้องมี 28 หมวด แต่พบ ${metaSlugs.length}`);
if (new Set(metaSlugs).size !== metaSlugs.length) errors.push('พบ slug ซ้ำใน TOPIC_META');
if (!/className='cell-reading'/.test(html) || !/reading\.textContent='คำอ่าน: '/.test(html)) {
  errors.push('fruits: กริดต้องแสดงคำอ่านภาษาไทยด้วย .cell-reading');
}
if (!/currentSlug === 'fruits' && item\.th[\s\S]{0,120}'คำอ่าน: '\+item\.th/.test(html)) {
  errors.push('fruits: การ์ดหลักต้องแสดงคำอ่านภาษาไทยใต้คำอังกฤษ');
}

for (const slug of metaSlugs) {
  const items = topics[slug];
  if (!Array.isArray(items)) {
    errors.push(`${slug}: ไม่พบรายการคำศัพท์`);
    continue;
  }
  const expected = fixedCounts[slug] ?? 30;
  if (items.length !== expected) errors.push(`${slug}: ต้องมี ${expected} คำ แต่พบ ${items.length}`);

  const seen = new Set();
  items.forEach((item, index) => {
    const key = String(item.en || '').trim().toLowerCase();
    if (!item.label || !item.en || !item.th) errors.push(`${slug}[${index}]: ขาด label/en/th`);
    if (seen.has(key)) errors.push(`${slug}: คำซ้ำ ${item.en}`);
    seen.add(key);
    if (item.level === 'extended') {
      if (!item.meaning || !item.example) errors.push(`${slug}/${item.en}: คำต่อยอดขาด meaning/example`);
      if (!/[ก-๙]/.test(item.th) || !/[ก-๙]/.test(item.meaning)) errors.push(`${slug}/${item.en}: คำอ่านหรือความหมายต้องเป็นภาษาไทย`);
      if (!/[A-Za-z]/.test(item.example)) errors.push(`${slug}/${item.en}: example ต้องเป็นประโยคอังกฤษ`);
    }
    if (slug === 'fruits' && (!Array.isArray(item.phonics) || !item.phonics.length)) {
      errors.push(`fruits/${item.en}: ขาด phonics`);
    }
  });
}

const total = Object.values(topics).reduce((sum, items) => sum + items.length, 0);
const extendedTotal = Object.values(extended).reduce((sum, items) => sum + items.length, 0);
if (total !== 839) errors.push(`คำศัพท์รวมต้องเป็น 839 แต่พบ ${total}`);
if (extendedTotal !== 467) errors.push(`คำต่อยอดต้องเป็น 467 แต่พบ ${extendedTotal}`);

if (errors.length) {
  console.error(`Vocab Hub data verification failed (${errors.length})`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Vocab Hub data verified: ${metaSlugs.length} topics, ${total} words (${extendedTotal} extended)`);
