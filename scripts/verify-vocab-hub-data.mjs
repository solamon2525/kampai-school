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
const basicImages = context.window.VOCAB_HUB_BASIC_IMAGES || {};
Object.entries(basicImages).forEach(([slug, images]) => {
  Object.entries(images).forEach(([en, file]) => {
    const item = topics[slug]?.find(candidate => candidate.level !== 'extended' && candidate.en === en);
    if (item) item.image = `./vocab-hub-assets/${slug}/${file}`;
  });
});
const fruitImages = context.window.VOCAB_HUB_FRUIT_IMAGES || {};
Object.entries(fruitImages).forEach(([en, file]) => {
  const item = topics.fruits.find(candidate => candidate.en === en);
  if (item) item.image = `./vocab-hub-assets/fruits/${file}`;
});

const fixedCounts = { numbers: 100, days: 7, months: 12, alphabet: 26, seasons: 4 };
const basicImageTopicCounts = {
  body: 10, family: 8, clothes: 10, classroom: 10, 'house-rooms': 8, toys: 8,
  food: 12, animals: 12, shapes: 8, weather: 10, transportation: 10, places: 10,
  vegetables: 10, insects: 8, 'sea-animals': 8, seasons: 4, directions: 10,
  jobs: 12, verbs: 12, sports: 8, instruments: 7, emotions: 10,
};
const textOnlyTopics = ['numbers','colors','days','months','alphabet'];
const metaSlugs = context.meta.map(item => item.slug);
const errors = [];

async function verifyImageAsset(label, assetPath) {
  if (!fs.existsSync(assetPath)) {
    errors.push(`${label}: ไม่พบไฟล์ ${assetPath}`);
    return;
  }
  const image = sharp(assetPath);
  const metadata = await image.metadata();
  if (metadata.width !== 512 || metadata.height !== 512 || metadata.format !== 'webp') {
    errors.push(`${label}: ภาพต้องเป็น WebP 512x512 แต่พบ ${metadata.format} ${metadata.width}x${metadata.height}`);
    return;
  }
  const stats = await image.stats();
  const channels = stats.channels.slice(0, 3);
  const mean = channels.reduce((sum, channel) => sum + channel.mean, 0) / channels.length;
  const deviation = channels.reduce((sum, channel) => sum + channel.stdev, 0) / channels.length;
  if (mean < 10 || deviation < 5) errors.push(`${label}: ภาพมืดหรือว่างผิดปกติ`);
}

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

if (Object.keys(basicImages).length !== 22) {
  errors.push(`ภาพคำพื้นฐาน: ต้องมี 22 หมวด แต่พบ ${Object.keys(basicImages).length}`);
}
for (const slug of textOnlyTopics) {
  if (basicImages[slug]) errors.push(`ภาพคำพื้นฐาน: ${slug} ต้องคงรูปแบบข้อความ/สีเดิม`);
}
const basicImageEntries = Object.entries(basicImages)
  .flatMap(([slug, images]) => Object.entries(images).map(([en, file]) => ({ slug, en, file })));
if (basicImageEntries.length !== 205) {
  errors.push(`ภาพคำพื้นฐาน: ต้องมี mapping 205 คำ แต่พบ ${basicImageEntries.length}`);
}
const basicImagePaths = basicImageEntries.map(({ slug, file }) => `${slug}/${file}`);
if (new Set(basicImagePaths).size !== basicImagePaths.length) {
  errors.push('ภาพคำพื้นฐาน: พบ path ภาพซ้ำ');
}
for (const [slug, expected] of Object.entries(basicImageTopicCounts)) {
  const images = basicImages[slug] || {};
  if (Object.keys(images).length !== expected) {
    errors.push(`ภาพคำพื้นฐาน/${slug}: ต้องมี ${expected} ภาพ แต่พบ ${Object.keys(images).length}`);
  }
}
for (const { slug, en, file } of basicImageEntries) {
  const item = topics[slug]?.find(candidate => candidate.level !== 'extended' && candidate.en === en);
  if (!item) {
    errors.push(`ภาพคำพื้นฐาน/${slug}: ไม่พบคำ ${en}`);
    continue;
  }
  if (item.image !== `./vocab-hub-assets/${slug}/${file}`) {
    errors.push(`ภาพคำพื้นฐาน/${slug}/${en}: mapping ไม่ตรงข้อมูลคำศัพท์`);
  }
  await verifyImageAsset(
    `ภาพคำพื้นฐาน/${slug}/${en}`,
    path.join('public/games/english/vocab-hub-assets', slug, file),
  );
}
for (const [slug, items] of Object.entries(topics)) {
  for (const item of items) {
    if (slug !== 'fruits' && item.level === 'extended' && item.image) {
      errors.push(`ภาพคำพื้นฐาน/${slug}/${item.en}: คำต่อยอดต้องไม่รับ image mapping`);
    }
  }
}

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
  await verifyImageAsset(`fruits/${item.en}`, assetPath);
}

if (errors.length) {
  console.error(`Vocab Hub data verification failed (${errors.length})`);
  errors.forEach(error => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Vocab Hub data verified: ${metaSlugs.length} topics, ${total} words (${extendedTotal} extended), ${basicImageEntries.length} basic images`);
