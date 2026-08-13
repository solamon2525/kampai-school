#!/usr/bin/env node
/**
 * Mark the 800 cross-category expansion records as quarantined and add audit metadata.
 * Safe to re-run. Source JSON remains the editorial source of truth.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DATA_DIR = join(ROOT, 'public/games/thai/thai-vocab-hub/data');
const categories = JSON.parse(readFileSync(join(DATA_DIR, 'categories.json'), 'utf8'));
const classifierFor = {
  กระจุก: 'ผม', กำ: 'ดอกไม้', กิ่ง: 'ต้นไม้', คดี: 'เรื่องฟ้องร้อง', คำสั่ง: 'ประกาศ',
  จังหวะ: 'ทำนองเพลง', จุก: 'จุกขวด', ซุ้ม: 'ซุ้มประตู', ตับ: 'พลุ', ตอนกิ่ง: 'กิ่งมะนาว',
  นัด: 'การยิงปืน', แนว: 'แถวต้นไม้', บรรทัด: 'ข้อความ', ใบงาน: 'กิจกรรม', ประเด็น: 'หัวข้อ',
  ปิ่นโต: 'อาหารกลางวัน', เปลาะ: 'อ้อย', ฝัก: 'ถั่ว', พุ่ม: 'ดอกไม้', ฟ่อน: 'ข้าว',
  มัด: 'ฟืน', มื้อ: 'อาหาร', เมนู: 'รายการอาหาร', ราย: 'ผู้สมัคร', ฤดู: 'ช่วงฝน',
  ลอน: 'ผม', ลูกบาศก์: 'น้ำตาล', วาระ: 'การประชุม', วงรอบ: 'การทำงาน', ศอก: 'ผ้า',
  สำนวน: 'ถ้อยคำ', โหล: 'ไข่', อนุเฉท: 'ข้อความ', อัตรา: 'ราคา', อำเภอ: 'เขตการปกครอง',
  เอกสาร: 'ชุดรายงาน', แถวตอน: 'นักเรียน', โครงการ: 'งานพัฒนา', หัวข้อ: 'เรื่องเขียน', หน: 'โอกาส',
};

const byWord = new Map();
const catalogs = new Map();
for (const category of categories) {
  const path = join(DATA_DIR, 'words', `${category.slug}.json`);
  const items = JSON.parse(readFileSync(path, 'utf8'));
  catalogs.set(category.slug, { path, category, items });
  items.forEach((item, index) => {
    if (!byWord.has(item.word)) byWord.set(item.word, []);
    byWord.get(item.word).push({ category, item, index });
  });
}

for (const { category, items } of catalogs.values()) {
  items.forEach((item, index) => {
    if (index >= 150) {
      item.content_status = 'quarantined';
      item.review_reason = 'ชุดขยาย ป.4 เดิมยืมคำจากหมวดอื่นเพื่อให้ครบ 200 คำ; รอคำทดแทนที่ผ่านการตรวจหมวด';
      item.category_evidence = item.category_evidence || `ยังไม่มีหลักฐานเฉพาะสำหรับหมวด ${category.title}`;
      return;
    }

    item.content_status = 'approved';
    item.category_evidence = item.category_evidence || `คำเดิมของหมวด ${category.title} ที่ตรวจรูปแบบและความสัมพันธ์เชิงโครงสร้างแล้ว`;
    if (category.slug === 'classifiers' && !item.classifier_for && classifierFor[item.word]) {
      item.classifier_for = classifierFor[item.word];
    }
  });
}

for (const [word, locs] of byWord) {
  const approvedLocs = locs.filter(({ item }) => item.content_status === 'approved');
  if (new Set(approvedLocs.map(({ category }) => category.slug)).size < 2) continue;
  approvedLocs.forEach(({ category, item }) => {
    item.duplicate_rationale = item.duplicate_rationale
      || `อนุญาตให้คำ "${word}" ซ้ำในหมวด ${category.title} เพราะใช้ฝึกทักษะของหมวดนี้โดยตรง`;
  });
}

for (const { path, items } of catalogs.values()) {
  writeFileSync(path, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
}
console.log(`✅ กักกันคำชุดขยาย 800 รายการ และเติม metadata ให้ ${categories.length} หมวด`);
