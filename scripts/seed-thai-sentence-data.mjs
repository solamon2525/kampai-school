#!/usr/bin/env node
/** สร้าง data สำหรับ thai-sentence-hub */
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HUB = join(__dirname, '..', 'public/games/thai/thai-sentence-hub');
const DATA = join(HUB, 'data');
const ITEMS = join(DATA, 'items');
mkdirSync(ITEMS, { recursive: true });

const IND_P4 = 'ท 4.1 ป.4/2';
const IND_P5 = 'ท 4.1 ป.5/2';

function mk(part, partLabel, gloss, emoji, sentence, highlight, grade = 'ป.4') {
  return {
    word: partLabel,
    reading: partLabel,
    meaning: `${gloss} · ประโยค: ${sentence}`,
    emoji,
    grade,
    indicator_code: grade === 'ป.5' ? IND_P5 : IND_P4,
    item_type: 'sentence',
    pos: part,
    pos_label: partLabel,
    sentence,
    highlight,
  };
}

const categories = [
  { slug: 'subject', title: 'ประธาน', icon: '👤', desc: 'คนหรือสิ่งที่ประโยคพูดถึง', grades: ['ป.4', 'ป.5'] },
  { slug: 'verb', title: 'กริยา', icon: '🏃', desc: 'การกระทำหรือสภาวะของประธาน', grades: ['ป.4', 'ป.5'] },
  { slug: 'object', title: 'กรรม', icon: '🎯', desc: 'ผู้ถูกกระทำหรือสิ่งที่รับการกระทำ', grades: ['ป.4', 'ป.5'] },
  { slug: 'modifier', title: 'ส่วนขยาย', icon: '✨', desc: 'ขยายความของคำในประโยค', grades: ['ป.4', 'ป.5'] },
  { slug: 'compound', title: 'ประโยคคู่', icon: '🔗', desc: 'สองประโยคเชื่อมด้วยสันธาน', grades: ['ป.5'] },
  { slug: 'main-clause', title: 'ประโยคประเด็น', icon: '📌', desc: 'ส่วนสำคัญที่สุดของประโยค', grades: ['ป.5'] },
  { slug: 'sub-clause', title: 'ประโยคคำย่อย', icon: '📎', desc: 'ประโยคย่อยขยายหรือเสริม', grades: ['ป.5'] },
  { slug: 'sv-pattern', title: 'แบบ ก.+ข.', icon: '📐', desc: 'ประธาน + ส่วนขยาย', grades: ['ป.4', 'ป.5'] },
  { slug: 'mixed-drill', title: 'รวมฝึกทบทวน', icon: '📝', desc: 'สุ่มทุกส่วนประโยค', grades: ['ป.4', 'ป.5'] },
];

const subject = [
  mk('subject', 'ประธาน', 'ผู้กระทำหรือสิ่งที่ประโยคพูดถึง', '👤', 'เด็กชายเล่นฟุตบอล', 'เด็กชาย'),
  mk('subject', 'ประธาน', 'ประธานเป็นสัตว์', '👤', 'แมวนอนบนเก้าอี้', 'แมว'),
  mk('subject', 'ประธาน', 'ประธานเป็นสิ่งของ', '👤', 'หนังสือเล่มนี้น่าสนใจ', 'หนังสือเล่มนี้'),
  mk('subject', 'ประธาน', 'ประธานเป็นสถานที่', '👤', 'โรงเรียนเปิดเว้าแรก', 'โรงเรียน'),
  mk('subject', 'ประธาน', 'ประธานเป็นกลุ่มคน', '👤', 'นักเรียนตั้งใจเรียน', 'นักเรียน'),
  mk('subject', 'ประธาน', 'ประธานมีส่วนขยาย', '👤', 'เด็กหญิงตัวเล็กร้องเพลง', 'เด็กหญิงตัวเล็ก', 'ป.5'),
];

const verb = [
  mk('verb', 'กริยา', 'แสดงการกระทำ', '🏃', 'นกบินบนท้องฟ้า', 'บิน'),
  mk('verb', 'กริยา', 'กริยาสภาวะ', '🏃', 'ดอกไม้สวยงาม', 'สวยงาม'),
  mk('verb', 'กริยา', 'กริยาในอดีต', '🏃', 'แม่ทำอาหารเช้า', 'ทำ'),
  mk('verb', 'กริยา', 'กริยาในอนาคต', '🏃', 'พรุ่งนี้เราจะไปเที่ยว', 'จะไป'),
  mk('verb', 'กริยา', 'กริยาสองคำ', '🏃', 'ครูกำลังสอนหนังสือ', 'กำลังสอน'),
  mk('verb', 'กริยา', 'กริยาเชิงคุณภาพ', '🏃', 'อาหารรสชาติดี', 'รสชาติดี', 'ป.5'),
];

const object = [
  mk('object', 'กรรม', 'สิ่งที่รับการกระทำ', '🎯', 'ครูอ่านหนังสือ', 'หนังสือ'),
  mk('object', 'กรรม', 'ผู้ถูกกระทำ', '🎯', 'เด็กชายช่วยเพื่อน', 'เพื่อน'),
  mk('object', 'กรรม', 'กรรมเป็นสถานที่', '🎯', 'เราไปโรงเรียน', 'โรงเรียน'),
  mk('object', 'กรรม', 'กรรมเป็นสิ่งของ', '🎯', 'แม่ซื้อผลไม้', 'ผลไม้'),
  mk('object', 'กรรม', 'กรรมชัดเจน', '🎯', 'นักเรียนเขียนคำตอบ', 'คำตอบ'),
];

const modifier = [
  mk('modifier', 'ส่วนขยาย', 'ขยายนาม', '✨', 'เด็กชายตัวเล็กวิ่งเร็ว', 'ตัวเล็ก'),
  mk('modifier', 'ส่วนขยาย', 'ขยายกริยา', '✨', 'เขาวิ่งอย่างเร็ว', 'อย่างเร็ว'),
  mk('modifier', 'ส่วนขยาย', 'ขยายคุณศัพท์', '✨', 'ดอกไม้สีแดงสวยมาก', 'สีแดง'),
  mk('modifier', 'ส่วนขยาย', 'วลีขยาย', '✨', 'เมื่อฝนตกเราหยุดเล่น', 'เมื่อฝนตก'),
  mk('modifier', 'ส่วนขยาย', 'บอกสถานที่', '✨', 'นกบินในท้องฟ้า', 'ในท้องฟ้า', 'ป.5'),
];

const compound = [
  mk('compound', 'ประโยคคู่', 'เชื่อมด้วยและ', '🔗', 'ฝนตกและลมแรง', 'และ', 'ป.5'),
  mk('compound', 'ประโยคคู่', 'เชื่อมด้วยแต่', '🔗', 'อากาศร้อนแต่มีลม', 'แต่', 'ป.5'),
  mk('compound', 'ประโยคคู่', 'เชื่อมด้วยหรือ', '🔗', 'จะไปเที่ยวหรืออยู่บ้าน', 'หรือ', 'ป.5'),
  mk('compound', 'ประโยคคู่', 'สองเหตุการณ์', '🔗', 'แม่ทำอาหารและพ่อล้างจาน', 'และ', 'ป.5'),
];

const mainClause = [
  mk('main-clause', 'ประโยคประเด็น', 'ส่วนสำคัญสุด', '📌', 'เมื่อฝนตก เราหยุดเล่น', 'เราหยุดเล่น', 'ป.5'),
  mk('main-clause', 'ประโยคประเด็น', 'บอกเหตุการณ์หลัก', '📌', 'แม้จะเหนื่อย เขาก็ตั้งใจเรียน', 'เขาก็ตั้งใจเรียน', 'ป.5'),
  mk('main-clause', 'ประโยคประเด็น', 'ข้อความหลัก', '📌', 'ถ้าตั้งใจ จะประสบความสำเร็จ', 'จะประสบความสำเร็จ', 'ป.5'),
];

const subClause = [
  mk('sub-clause', 'ประโยคคำย่อย', 'บอกเงื่อนไข', '📎', 'เมื่อฝนตก เราหยุดเล่น', 'เมื่อฝนตก', 'ป.5'),
  mk('sub-clause', 'ประโยคคำย่อย', 'บอกเหตุผล', '📎', 'เพราะฝนตก เราจึงไม่ไปเที่ยว', 'เพราะฝนตก', 'ป.5'),
  mk('sub-clause', 'ประโยคคำย่อย', 'บอกเวลา', '📎', 'ตอนเช้า นกร้องเพลง', 'ตอนเช้า', 'ป.5'),
];

const svPattern = [
  mk('sv-pattern', 'แบบ ก.+ข.', 'ประธาน+ส่วนขยาย', '📐', 'เด็กชายตัวเล็กวิ่งเร็ว', 'เด็กชายตัวเล็ก'),
  mk('sv-pattern', 'แบบ ก.+ข.', 'นาม+คุณศัพท์', '📐', 'ดอกไม้สีแดงหอมหวาน', 'ดอกไม้สีแดง'),
  mk('sv-pattern', 'แบบ ก.+ข.', 'กริยา+วิเศษณ์', '📐', 'เขาพูดอย่างชัดเจน', 'อย่างชัดเจน'),
  mk('sv-pattern', 'แบบ ก.+ข.', 'สถานที่+คำบอก', '📐', 'บ้านหลังนี้สวยงาม', 'บ้านหลังนี้'),
  mk('sv-pattern', 'แบบ ก.+ข.', 'รวมหลายส่วนขยาย', '📐', 'นักเรียนตัวเล็กตั้งใจเรียนมาก', 'นักเรียนตัวเล็ก', 'ป.5'),
];

const allItems = [...subject, ...verb, ...object, ...modifier, ...compound, ...mainClause, ...subClause, ...svPattern];
const mixed = [...allItems].sort(() => Math.random() - 0.5).slice(0, 24);

const map = { subject, verb, object, modifier, compound, 'main-clause': mainClause, 'sub-clause': subClause, 'sv-pattern': svPattern, 'mixed-drill': mixed };

writeFileSync(join(DATA, 'categories.json'), JSON.stringify(categories, null, 2) + '\n', 'utf8');
for (const [slug, items] of Object.entries(map)) {
  writeFileSync(join(ITEMS, `${slug}.json`), JSON.stringify(items, null, 2) + '\n', 'utf8');
}
console.log(`✅ sentence seed — ${allItems.length} base items`);
