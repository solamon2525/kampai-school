#!/usr/bin/env node
/**
 * ตรวจคุณภาพคลังคำศัพท์ Thai Vocab Hub
 * Usage: node scripts/validate-vocab.mjs [--strict] [--report]
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'public/games/thai/thai-vocab-hub/data');
const TARGET = 200;
const strict = process.argv.includes('--strict');
const reportOnly = process.argv.includes('--report');
const VALID_STATUSES = new Set(['approved', 'quarantined']);
const ROYAL_MARKERS = /ราช|พระ|กษัตริย์|เสด็จ|ถวาย|ทรง|สวรรคต|ตรัส|ประทับ|เสวย|บรม|ฉลอง|โปรด|กราบ|ประพาส/;

function loadJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const categories = loadJson(join(DATA_DIR, 'categories.json'));
const slugs = categories.map((c) => c.slug);
const errors = [];
const warnings = [];
const byWord = new Map();
const summary = [];

for (const slug of slugs) {
  const path = join(DATA_DIR, 'words', `${slug}.json`);
  if (!existsSync(path)) {
    errors.push(`[${slug}] ไม่พบไฟล์ words/${slug}.json`);
    continue;
  }

  const items = loadJson(path);
  if (!Array.isArray(items)) {
    errors.push(`[${slug}] ต้องเป็น array`);
    continue;
  }

  const approved = items.filter((item) => item?.content_status !== 'quarantined');
  const quarantined = items.filter((item) => item?.content_status === 'quarantined');
  summary.push({ slug, raw: items.length, approved: approved.length, quarantined: quarantined.length });
  if (items.length !== TARGET) errors.push(`[${slug}] จำนวนข้อมูลดิบ ${items.length}/${TARGET}`);
  if (approved.length !== TARGET) warnings.push(`[${slug}] คำที่เปิดเรียน ${approved.length}/${TARGET}; ต้องเติมคำทดแทนก่อนเคลมว่าครบ`);

  const seen = new Set();
  for (const [idx, item] of items.entries()) {
    const loc = `${slug}[${idx}]`;
    if (!item || typeof item !== 'object') {
      errors.push(`${loc}: ไม่ใช่ object`);
      continue;
    }
    const status = item.content_status ?? 'approved';
    if (!VALID_STATUSES.has(status)) errors.push(`${loc}: content_status ต้องเป็น approved | quarantined`);
    if (!item.word || typeof item.word !== 'string' || !item.word.trim()) errors.push(`${loc}: word ว่าง`);
    if (!item.reading || typeof item.reading !== 'string' || !item.reading.trim()) errors.push(`${loc}: reading ว่าง`);
    if (!item.meaning || typeof item.meaning !== 'string' || item.meaning.trim().length < 4) errors.push(`${loc}: meaning สั้นเกินไป`);
    if (item.grade != null && item.grade !== '' && !['ป.4', 'ป.5', 'ป.6'].includes(item.grade)) errors.push(`${loc}: grade ต้องเป็น ป.4 | ป.5 | ป.6`);
    if (status === 'quarantined' && !item.review_reason) errors.push(`${loc}: quarantined ต้องมี review_reason`);
    if (status === 'approved' && !item.category_evidence) warnings.push(`${loc}: approved ควรมี category_evidence ก่อนใช้เป็นคำทดแทน`);
    if (item.image_url != null || item.image_alt != null) {
      if (status !== 'approved') errors.push(`${loc}: ภาพประกอบต้องอยู่กับคำ approved เท่านั้น`);
      if (slug !== 'royal') errors.push(`${loc}: pilot ภาพประกอบอนุญาตเฉพาะหมวด royal`);
      if (!item.image_url || typeof item.image_url !== 'string') errors.push(`${loc}: image_url ว่าง`);
      if (!item.image_alt || typeof item.image_alt !== 'string' || !item.image_alt.trim()) errors.push(`${loc}: image_alt ว่าง`);
      if (item.image_url && !existsSync(join(ROOT, 'public/games/thai/thai-vocab-hub', item.image_url))) errors.push(`${loc}: ไม่พบไฟล์ ${item.image_url}`);
    }

    if (status === 'approved' && slug === 'classifiers' && !item.classifier_for) {
      errors.push(`${loc}: หมวดลักษณนามต้องมี classifier_for`);
    }
    if (status === 'approved' && slug === 'synonyms' && !item.synonym_group) {
      errors.push(`${loc}: หมวดคำไวพจน์ต้องมี synonym_group`);
    }
    if (status === 'approved' && slug === 'antonyms' && !item.pair_id) {
      errors.push(`${loc}: หมวดคำตรงข้ามต้องมี pair_id`);
    }
    if (status === 'approved' && slug === 'royal' && !ROYAL_MARKERS.test(`${item.word} ${item.meaning}`) && !item.category_evidence) {
      errors.push(`${loc}: หมวดคำราชาศัพท์ต้องมีหลักฐานความเกี่ยวข้อง`);
    }

    if (item.word) {
      const key = `${item.word.trim()}\0${(item.reading || '').trim()}`;
      if (seen.has(key)) errors.push(`${loc}: คำซ้ำในหมวดเดียวกัน "${item.word}" [${item.reading}]`);
      seen.add(key);
      if (!byWord.has(item.word.trim())) byWord.set(item.word.trim(), []);
      byWord.get(item.word.trim()).push({ slug, idx, item, status });
    }
  }

  if (slug === 'homophones') {
    const groups = new Map();
    approved.forEach((item) => groups.set(item.reading, [...(groups.get(item.reading) || []), item]));
    for (const [reading, group] of groups) {
      if (group.length < 2 && !group[0].category_evidence) errors.push(`[${slug}] คำอ่าน "${reading}" ต้องมีอย่างน้อย 2 คำ หรือมี category_evidence`);
    }
  }
  for (const [key, label] of [['synonym_group', 'คำไวพจน์'], ['pair_id', 'คำตรงข้าม']]) {
    if ((slug === 'synonyms' && key === 'synonym_group') || (slug === 'antonyms' && key === 'pair_id')) {
      const groups = new Map();
      approved.forEach((item) => groups.set(item[key], [...(groups.get(item[key]) || []), item]));
      for (const [group, members] of groups) if (members.length < 2) errors.push(`[${slug}] ${label} กลุ่ม "${group}" มีไม่ครบคู่`);
    }
  }
}

const royalItems = loadJson(join(DATA_DIR, 'words', 'royal.json'));
const visualPilot = royalItems.filter((item) => item.content_status !== 'quarantined' && item.image_url);
if (visualPilot.length !== 25) errors.push(`[royal] pilot ภาพประกอบต้องมี 25 คำ (พบ ${visualPilot.length})`);

for (const [word, locs] of byWord) {
  const approvedLocs = locs.filter((loc) => loc.status === 'approved');
  const uniqueSlugs = [...new Set(approvedLocs.map((loc) => loc.slug))];
  if (uniqueSlugs.length > 1 && approvedLocs.some((loc) => !loc.item.duplicate_rationale)) {
    errors.push(`คำ "${word}" ซ้ำในคำที่เปิดเรียน: ${uniqueSlugs.join(', ')} ต้องมี duplicate_rationale ทุกหมวดที่อนุญาต`);
  }
}

console.log('\n📋 Thai Vocab Hub content quality\n');
summary.forEach(({ slug, raw, approved, quarantined }) => console.log(`  ${slug}: ${approved} approved / ${quarantined} quarantined / ${raw} raw`));
const total = summary.reduce((sum, item) => sum + item.approved, 0);
console.log(`\nรวมคำที่เปิดเรียน ${total} คำ / ข้อมูลดิบ ${summary.reduce((sum, item) => sum + item.raw, 0)} คำ`);

if (!reportOnly && warnings.length) {
  console.log(`\n⚠️  ${warnings.length} warning(s):`);
  warnings.slice(0, 30).forEach((warning) => console.log('  ', warning));
  if (warnings.length > 30) console.log(`   ... และอีก ${warnings.length - 30}`);
}
if (!reportOnly && errors.length) {
  console.log(`\n❌ ${errors.length} error(s):`);
  errors.slice(0, 50).forEach((error) => console.log('  ', error));
  if (errors.length > 50) console.log(`   ... และอีก ${errors.length - 50}`);
  process.exit(1);
}
if (reportOnly) {
  console.log('\n✅ รายงานพร้อมสำหรับครูสุ่มตรวจ');
  process.exit(0);
}
console.log(`\n✅ ${strict ? 'strict ' : ''}validation ผ่าน`);
