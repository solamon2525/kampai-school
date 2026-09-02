import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import sharp from 'sharp';

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
const fruitImages = context.window.VOCAB_HUB_FRUIT_IMAGES || {};
Object.entries(fruitImages).forEach(([en, file]) => {
  const item = topics.fruits.find(candidate => candidate.en === en);
  if (item) item.image = `./vocab-hub-assets/fruits/${file}`;
});

const fixedCounts = { numbers: 100, days: 7, months: 12, alphabet: 26, seasons: 4 };
const metaSlugs = context.meta.map(item => item.slug);
const errors = [];

if (metaSlugs.length !== 28) errors.push(`ต้องมี 28 หมวด แต่พบ ${metaSlugs.length}`);
if (new Set(metaSlugs).size !== metaSlugs.length) errors.push('พบ slug ซ้ำใน TOPIC_META');
if (!/className='cell-reading'/.test(html) || !/isVisualTopic && item\.th/.test(html)) {
  errors.push('visual topics: กริดต้องแสดงคำอ่านภาษาไทยด้วย .cell-reading');
}
if (!/currentSlug === 'fruits' && item\.th[\s\S]{0,120}'คำอ่าน: '\+item\.th/.test(html)) {
  errors.push('fruits: การ์ดหลักต้องแสดงคำอ่านภาษาไทยใต้คำอังกฤษ');
}
if (!/vocab_hub_show_thai_reading/.test(html) || !/id="btn-reading"/.test(html)) {
  errors.push('visual topics: ขาดตัวเลือกเปิด/ปิดคำอ่านที่จำค่า global');
}
if (!/\.cell\.hl \.cell-reading\{color:#1A237E\}/.test(html)) {
  errors.push('visual topics: คำอ่านบนการ์ดไฮไลต์ต้องใช้สีกรมท่าที่อ่านชัดบนพื้นเหลือง');
}
if (!/currentSlug === 'fruits' && item\.th && showThaiReading/.test(html)
    || !/if\(mode==='auto' && curItem\) setBannerAuto\(curItem\)/.test(html)) {
  errors.push('fruits: ปุ่มคำอ่านต้องซ่อนคำอ่านในส่วนหัวทันทีและแสดงความหมายแทน');
}
if (!/const hasVisual = it => !!\(it\.image \|\| it\.emoji \|\| it\.bgColor\)/.test(html)) {
  errors.push('visual topics: hasVisual ต้องรองรับ image');
}

const removedSoundControls = [
  'cell-spk',
  'btn-mute-all',
  'btn-unmute-all',
  'btn-sound',
  'audioOn',
  'speakEnabled',
  'vocab_hub_muted_',
];
for (const token of removedSoundControls) {
  if (html.includes(token)) errors.push(`เสียงอ่าน: ยังพบ state/control ซ้ำซ้อน ${token}`);
}
if ((html.match(/id="btn-say"/g) || []).length !== 1
    || !/btnSay\.addEventListener\('click',[\s\S]{0,120}speak\(curItem\)/.test(html)) {
  errors.push('เสียงอ่าน: ต้องเหลือปุ่ม #btn-say เพียงจุดเดียวสำหรับอ่านคำที่เลือก');
}
const setHlSource = html.slice(html.indexOf('function setHl('), html.indexOf('function goTo('));
if (!setHlSource || /\bspeak\s*\(/.test(setHlSource)) {
  errors.push('เสียงอ่าน: การเลือกหรือเลื่อนคำผ่าน setHl ต้องไม่อ่านอัตโนมัติ');
}
const voiceButtonStart = html.indexOf("btnVoice.addEventListener('click'");
const voiceButtonEnd = html.indexOf('\n});\napplyVoiceMode();', voiceButtonStart);
const voiceButtonSource = html.slice(voiceButtonStart, voiceButtonEnd);
if (voiceButtonStart < 0 || voiceButtonEnd < 0 || /\bspeak\s*\(/.test(voiceButtonSource)) {
  errors.push('เสียงอ่าน: ปุ่มเปลี่ยนภาษาต้องไม่เล่นเสียงตัวอย่าง');
}
if (!/เลือกคำ แล้วกดลำโพงข้างคำใหญ่เพื่อฟัง/.test(html)) {
  errors.push('เสียงอ่าน: คำแนะนำต้องชี้ไปยังปุ่มอ่านด้านบนเพียงจุดเดียว');
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

if (Object.keys(fruitImages).length !== 30) {
  errors.push(`fruits: ต้องมี image mapping 30 คำ แต่พบ ${Object.keys(fruitImages).length}`);
}
if (new Set(Object.values(fruitImages)).size !== Object.keys(fruitImages).length) {
  errors.push('fruits: พบชื่อไฟล์ภาพซ้ำ');
}
for (const item of topics.fruits) {
  if (!item.image) {
    errors.push(`fruits/${item.en}: ขาด image`);
    continue;
  }
  const assetPath = path.join('public/games/english', item.image.replace(/^\.\//, ''));
  if (!fs.existsSync(assetPath)) {
    errors.push(`fruits/${item.en}: ไม่พบไฟล์ ${assetPath}`);
    continue;
  }
  const metadata = await sharp(assetPath).metadata();
  if (metadata.width !== 512 || metadata.height !== 512 || metadata.format !== 'webp') {
    errors.push(`fruits/${item.en}: ภาพต้องเป็น WebP 512x512 แต่พบ ${metadata.format} ${metadata.width}x${metadata.height}`);
  }
}

if (errors.length) {
  console.error(`Vocab Hub data verification failed (${errors.length})`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Vocab Hub data verified: ${metaSlugs.length} topics, ${total} words (${extendedTotal} extended)`);
