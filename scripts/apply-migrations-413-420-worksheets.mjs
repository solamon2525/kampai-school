#!/usr/bin/env node
/**
 * Apply pending worksheet migrations 413–420 via service role
 * (equivalent to SQL seeds — used when supabase db push is unavailable)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const env = readFileSync(resolve(root, '.env.local'), 'utf8');
const url = env.match(/VITE_SUPABASE_URL="?([^\r\n"]+)/)?.[1];
const key = env.match(/SUPABASE_SERVICE_ROLE_KEY="?([^\r\n"]+)/)?.[1];
if (!url || !key) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function fail(msg, err) {
  console.error(msg, err || '');
  process.exit(1);
}

const batches = [
  {
    name: '413 batch 2',
    specs: [
      ['/games/math/decimal-media.html', '/games/math/decimal-worksheet.html', '📝 ใบงานทศนิยม ป.4', 'ใบงาน A4 คู่สื่อทศนิยม ฝึกค่าประจำหลัก เปรียบเทียบ และบวกลบพร้อมแสดงวิธีคิด', '/games/math/decimal-media-cover.png', 'คณิตศาสตร์', ['ป.4'], ['ใบงาน', 'ทศนิยม', 'ค่าประจำหลัก', 'เปรียบเทียบ', 'พิมพ์ได้'], 121],
      ['/games/thai/synonym-media.html', '/games/thai/synonym-worksheet.html', '📝 ใบงานคำพ้องความหมาย ป.4', 'ใบงาน A4 คู่สื่อคำพ้อง ฝึกจับคู่ แทนที่ในประโยค และอธิบายความหมาย', '/games/thai/synonym-media-cover.png', 'ภาษาไทย', ['ป.4'], ['ใบงาน', 'คำพ้อง', 'คำศัพท์', 'พิมพ์ได้'], 122],
      ['/games/science/moon-phases-media.html', '/games/science/moon-phases-worksheet.html', '📝 ใบงานข้างขึ้นข้างแรม ป.4', 'ใบงาน A4 คู่สื่อข้างขึ้นข้างแรม ฝึกเรียงเฟส อธิบายเหตุของแสง และบันทึกการสังเกต', '/games/science/moon-phases-media-cover.png', 'วิทยาศาสตร์', ['ป.4'], ['ใบงาน', 'ดวงจันทร์', 'ข้างขึ้นข้างแรม', 'พิมพ์ได้'], 123],
      ['/games/health/food-groups-media.html', '/games/health/food-groups-worksheet.html', '📝 ใบงานกลุ่มอาหาร ป.3–ป.4', 'ใบงาน A4 คู่สื่อกลุ่มอาหาร ฝึกจัดกลุ่ม ออกแบบมื้อสมดุล และตัดสินใจอย่างมีเหตุผล', '/games/health/food-groups-media-cover.png', 'สุขศึกษา', ['ป.3', 'ป.4'], ['ใบงาน', 'กลุ่มอาหาร', 'โภชนาการ', 'พิมพ์ได้'], 124],
      ['/games/social/good-citizen-media.html', '/games/social/good-citizen-worksheet.html', '📝 ใบงานพลเมืองดี ป.4', 'ใบงาน A4 คู่สื่อพลเมืองดี ฝึกเลือกพฤติกรรมในสถานการณ์ และเขียนเหตุผลอย่างสุภาพ', '/games/social/good-citizen-media-cover.png', 'สังคมศึกษา', ['ป.4'], ['ใบงาน', 'พลเมืองดี', 'คุณธรรม', 'พิมพ์ได้'], 125],
    ],
    indicators: [
      ['/games/math/decimal-worksheet.html', 'ค 1.1 ป.4/5'],
      ['/games/math/decimal-worksheet.html', 'ค 1.1 ป.4/6'],
      ['/games/thai/synonym-worksheet.html', 'ท 1.1 ป.4/2'],
      ['/games/science/moon-phases-worksheet.html', 'ว 3.1 ป.4/1'],
      ['/games/science/moon-phases-worksheet.html', 'ว 3.1 ป.4/2'],
      ['/games/health/food-groups-worksheet.html', 'พ 4.1 ป.3/2'],
      ['/games/health/food-groups-worksheet.html', 'พ 4.1 ป.3/3'],
      ['/games/social/good-citizen-worksheet.html', 'ส 2.1 ป.4/1'],
    ],
  },
  {
    name: '414 batch 3',
    specs: [
      ['/games/math/angle-media.html', '/games/math/angle-worksheet.html', '📝 ใบงานมุม ป.4', 'ใบงาน A4 คู่สื่อมุม ฝึกจำแนกมุมแหลม/ฉาก/ป้าน ประมาณค่า และวาดพร้อมอธิบาย', '/games/math/angle-media-cover.png', 'คณิตศาสตร์', ['ป.4'], ['ใบงาน', 'มุม', 'เรขาคณิต', 'พิมพ์ได้'], 126],
      ['/games/thai/thai-implied-meaning-media.html', '/games/thai/thai-implied-meaning-worksheet.html', '📝 ใบงานความหมายโดยนัย ป.5', 'ใบงาน A4 คู่สื่อความหมายโดยนัย ฝึกแยกความหมายตรงกับโดยนัย และเขียนหลักฐาน', '/games/thai/thai-implied-meaning-media-cover.png', 'ภาษาไทย', ['ป.5'], ['ใบงาน', 'โดยนัย', 'การอ่าน', 'พิมพ์ได้'], 127],
      ['/games/science/food-chain-media.html', '/games/science/food-chain-worksheet.html', '📝 ใบงานโซ่อาหาร ป.5', 'ใบงาน A4 คู่สื่อโซ่อาหาร ฝึกเรียงโซ่ ระบุบทบาท และอธิบายการส่งต่อพลังงาน', '/games/science/food-chain-media-cover.png', 'วิทยาศาสตร์', ['ป.5'], ['ใบงาน', 'โซ่อาหาร', 'ระบบนิเวศ', 'พิมพ์ได้'], 128],
      ['/games/health/handwash-media.html', '/games/health/handwash-worksheet.html', '📝 ใบงานล้างมือ 7 ขั้น ป.1–ป.3', 'ใบงาน A4 คู่สื่อล้างมือ ฝึกเรียงขั้นตอน อธิบายเหตุผล และนำไปใช้ในชีวิตประจำวัน', '/games/health/handwash-media-cover.png', 'สุขศึกษา', ['ป.1', 'ป.2', 'ป.3'], ['ใบงาน', 'ล้างมือ', 'สุขอนามัย', 'พิมพ์ได้'], 129],
      ['/games/career/waste-sort-media.html', '/games/career/waste-sort-worksheet.html', '📝 ใบงานคัดแยกขยะ ป.3–ป.4', 'ใบงาน A4 คู่สื่อคัดแยกขยะ ฝึกจัดประเภท เลือกวิธีจัดการ และนำไปใช้จริง', '/games/career/waste-sort-media-cover.png', 'การงานอาชีพ', ['ป.3', 'ป.4'], ['ใบงาน', 'คัดแยกขยะ', '3Rs', 'พิมพ์ได้'], 130],
    ],
    indicators: [
      ['/games/math/angle-worksheet.html', 'ค 2.2 ป.4/1'],
      ['/games/math/angle-worksheet.html', 'ค 2.2 ป.4/2'],
      ['/games/thai/thai-implied-meaning-worksheet.html', 'ท 1.1 ป.5/5'],
      ['/games/science/food-chain-worksheet.html', 'ว 1.1 ป.5/2'],
      ['/games/science/food-chain-worksheet.html', 'ว 1.1 ป.5/3'],
      ['/games/health/handwash-worksheet.html', 'พ 4.1 ป.1/1'],
      ['/games/health/handwash-worksheet.html', 'ว 1.2 ป.1/2'],
      ['/games/career/waste-sort-worksheet.html', 'ง 1.1 ป.3/3'],
      ['/games/career/waste-sort-worksheet.html', 'ง 1.1 ป.4/4'],
    ],
  },
  {
    name: '415 batch 4',
    specs: [
      ['/games/math/number-line-media.html', '/games/math/number-line-worksheet.html', '📝 ใบงานเส้นจำนวน ป.1–ป.3', 'ใบงาน A4 คู่สื่อเส้นจำนวน ฝึกหาตำแหน่ง เปรียบเทียบ และกระโดดบนเส้นพร้อมแสดงวิธี', '/games/math/number-line-media-cover.png', 'คณิตศาสตร์', ['ป.1', 'ป.2', 'ป.3'], ['ใบงาน', 'เส้นจำนวน', 'จำนวน', 'พิมพ์ได้'], 131],
      ['/games/math/bar-chart-media.html', '/games/math/bar-chart-worksheet.html', '📝 ใบงานแผนภูมิแท่ง ป.4', 'ใบงาน A4 คู่สื่อแผนภูมิแท่ง ฝึกอ่านตาราง กำหนดสเกล และสร้าง/สรุปแผนภูมิ', '/games/math/bar-chart-media-cover.png', 'คณิตศาสตร์', ['ป.4'], ['ใบงาน', 'แผนภูมิแท่ง', 'ข้อมูล', 'พิมพ์ได้'], 132],
      ['/games/science/plant-parts-media.html', '/games/science/plant-parts-worksheet.html', '📝 ใบงานส่วนประกอบของพืช ป.4', 'ใบงาน A4 คู่สื่อส่วนประกอบพืช ฝึกระบุส่วน บอกหน้าที่ และอธิบายสถานการณ์', '/games/science/plant-parts-media-cover.png', 'วิทยาศาสตร์', ['ป.4'], ['ใบงาน', 'พืช', 'รากลำต้นใบ', 'พิมพ์ได้'], 133],
      ['/games/social/sufficiency-media.html', '/games/social/sufficiency-worksheet.html', '📝 ใบงานเศรษฐกิจพอเพียง ป.4', 'ใบงาน A4 คู่สื่อเศรษฐกิจพอเพียง ฝึกหลัก 3 ห่วง ตัดสินใจ และนำไปใช้จริง', '/games/social/sufficiency-media-cover.png', 'สังคมศึกษา', ['ป.4'], ['ใบงาน', 'พอเพียง', '3 ห่วง', 'พิมพ์ได้'], 134],
      ['/games/thai/dictionary-media.html', '/games/thai/dictionary-worksheet.html', '📝 ใบงานพจนานุกรม ป.3–ป.4', 'ใบงาน A4 คู่สื่อพจนานุกรม ฝึกเรียงคำ อ่านรายการคำ และใช้หาความหมาย', '/games/thai/dictionary-media-cover.png', 'ภาษาไทย', ['ป.3', 'ป.4'], ['ใบงาน', 'พจนานุกรม', 'คำศัพท์', 'พิมพ์ได้'], 135],
    ],
    indicators: [
      ['/games/math/number-line-worksheet.html', 'ค 1.1 ป.1/2'],
      ['/games/math/number-line-worksheet.html', 'ค 1.1 ป.2/1'],
      ['/games/math/number-line-worksheet.html', 'ค 1.1 ป.3/1'],
      ['/games/math/bar-chart-worksheet.html', 'ค 3.1 ป.4/1'],
      ['/games/science/plant-parts-worksheet.html', 'ว 1.2 ป.4/1'],
      ['/games/social/sufficiency-worksheet.html', 'ส 3.1 ป.4/3'],
      ['/games/thai/dictionary-worksheet.html', 'ท 4.1 ป.3/3'],
      ['/games/thai/dictionary-worksheet.html', 'ท 4.1 ป.4/3'],
    ],
  },
  {
    name: '416 batch 5',
    specs: [
      ['/games/math/rounding.html', '/games/math/rounding-worksheet.html', '📝 ใบงานการประมาณค่า ป.4', 'ใบงาน A4 คู่สื่อประมาณค่า ฝึกเต็มสิบ ร้อย พัน พร้อมแสดงหลักที่ใช้ตัดสิน', '/games/math/rounding-cover.png', 'คณิตศาสตร์', ['ป.4'], ['ใบงาน', 'ประมาณค่า', 'เต็มสิบ', 'พิมพ์ได้'], 136],
      ['/games/thai/thai-narration-style-media.html', '/games/thai/thai-narration-style-worksheet.html', '📝 ใบงานการบรรยายและการพรรณนา ป.5', 'ใบงาน A4 คู่สื่อการบรรยาย–พรรณนา ฝึกจำแนกและเขียนตัวอย่างสั้น ๆ', '/games/thai/thai-narration-style-media-cover.png', 'ภาษาไทย', ['ป.5'], ['ใบงาน', 'บรรยาย', 'พรรณนา', 'พิมพ์ได้'], 137],
      ['/games/science/digestive-system-media.html', '/games/science/digestive-system-worksheet.html', '📝 ใบงานระบบย่อยอาหาร ป.5–ป.6', 'ใบงาน A4 คู่สื่อระบบย่อยอาหาร ฝึกเรียงลำดับอวัยวะ บอกหน้าที่ และดูแลสุขภาพ', '/games/science/digestive-system-media-cover.png', 'วิทยาศาสตร์', ['ป.5', 'ป.6'], ['ใบงาน', 'ระบบย่อย', 'สุขภาพ', 'พิมพ์ได้'], 138],
      ['/games/health/bone-muscle-media.html', '/games/health/bone-muscle-worksheet.html', '📝 ใบงานกระดูกและกล้ามเนื้อ ป.4', 'ใบงาน A4 คู่สื่อกระดูก–กล้ามเนื้อ ฝึกระบุส่วน บอกหน้าที่ และดูแลสุขภาพ', '/games/health/bone-muscle-media-cover.png', 'สุขศึกษา', ['ป.4'], ['ใบงาน', 'กระดูก', 'กล้ามเนื้อ', 'พิมพ์ได้'], 139],
      ['/games/arts/color-wheel-media.html', '/games/arts/color-wheel-worksheet.html', '📝 ใบงานวงล้อสี ป.4', 'ใบงาน A4 คู่สื่อวงล้อสี ฝึกแม่สี ผสมสี และจำแนกสีอุ่น–เย็น', '/games/arts/color-wheel-media-cover.png', 'ศิลปะ', ['ป.4'], ['ใบงาน', 'วงล้อสี', 'แม่สี', 'พิมพ์ได้'], 140],
    ],
    indicators: [
      ['/games/math/rounding-worksheet.html', 'ค 1.1 ป.4/7'],
      ['/games/thai/thai-narration-style-worksheet.html', 'ท 1.1 ป.5/4'],
      ['/games/science/digestive-system-worksheet.html', 'ว 1.2 ป.6/4'],
      ['/games/science/digestive-system-worksheet.html', 'ว 1.2 ป.6/5'],
      ['/games/science/digestive-system-worksheet.html', 'พ 1.1 ป.5/1'],
      ['/games/health/bone-muscle-worksheet.html', 'พ 1.1 ป.4/2'],
      ['/games/health/bone-muscle-worksheet.html', 'พ 1.1 ป.4/3'],
      ['/games/arts/color-wheel-worksheet.html', 'ศ 1.1 ป.4/2'],
      ['/games/arts/color-wheel-worksheet.html', 'ศ 1.1 ป.4/7'],
    ],
  },
  {
    name: '417 batch 6',
    specs: [
      ['/games/math/fraction-pieces.html', '/games/math/fraction-pieces-worksheet.html', '📝 ใบงานเศษส่วน ป.3–ป.5', 'ใบงาน A4 คู่สื่อเศษส่วนวงกลม/แท่ง ฝึกระบาย อ่านค่า และเศษส่วนสมมูล', '/games/math/fraction-pieces-cover.png', 'คณิตศาสตร์', ['ป.3', 'ป.4', 'ป.5'], ['ใบงาน', 'เศษส่วน', 'สมมูล', 'พิมพ์ได้'], 141],
      ['/games/thai/sentence-structure.html', '/games/thai/sentence-structure-worksheet.html', '📝 ใบงานโครงสร้างประโยค ป.3–ป.5', 'ใบงาน A4 คู่สื่อโครงสร้างประโยค ฝึกแยกส่วน เรียงคำ และแต่งประโยค', '/games/thai/sentence-structure-cover.png', 'ภาษาไทย', ['ป.3', 'ป.4', 'ป.5'], ['ใบงาน', 'ประโยค', 'โครงสร้าง', 'พิมพ์ได้'], 142],
      ['/games/science/states-of-matter.html', '/games/science/states-of-matter-worksheet.html', '📝 ใบงานสถานะของสาร ป.4', 'ใบงาน A4 คู่สื่อสถานะของสาร ฝึกจำแนก สมบัติ และการเปลี่ยนสถานะ', '/games/science/states-of-matter-cover.png', 'วิทยาศาสตร์', ['ป.4'], ['ใบงาน', 'สถานะของสาร', 'ของแข็ง', 'พิมพ์ได้'], 143],
      ['/games/social/thailand-map.html', '/games/social/thailand-map-worksheet.html', '📝 ใบงานแผนที่ประเทศไทย ป.4', 'ใบงาน A4 คู่สื่อแผนที่ไทย ฝึกภาค จังหวัด และลักษณะภูมิศาสตร์', '/games/social/thailand-map-cover.png', 'สังคมศึกษา', ['ป.4'], ['ใบงาน', 'แผนที่', 'ภาค', 'พิมพ์ได้'], 144],
      ['/games/career/community-jobs-media.html', '/games/career/community-jobs-worksheet.html', '📝 ใบงานอาชีพในชุมชน ป.4', 'ใบงาน A4 คู่สื่ออาชีพชุมชน ฝึกจับคู่เครื่องมือ จัดกลุ่ม และความสำคัญ', '/games/career/community-jobs-media-cover.png', 'การงานอาชีพ', ['ป.4'], ['ใบงาน', 'อาชีพ', 'ชุมชน', 'พิมพ์ได้'], 145],
    ],
    indicators: [
      ['/games/math/fraction-pieces-worksheet.html', 'ค 1.1 ป.4/3'],
      ['/games/math/fraction-pieces-worksheet.html', 'ค 1.1 ป.4/4'],
      ['/games/thai/sentence-structure-worksheet.html', 'ท 4.1 ป.3/4'],
      ['/games/thai/sentence-structure-worksheet.html', 'ท 4.1 ป.5/2'],
      ['/games/science/states-of-matter-worksheet.html', 'ว 2.1 ป.4/3'],
      ['/games/science/states-of-matter-worksheet.html', 'ว 2.1 ป.4/4'],
      ['/games/social/thailand-map-worksheet.html', 'ส 5.1 ป.4/1'],
      ['/games/social/thailand-map-worksheet.html', 'ส 5.1 ป.4/2'],
      ['/games/career/community-jobs-worksheet.html', 'ง 2.1 ป.4/1'],
    ],
  },
  {
    name: '418 batch 7',
    specs: [
      ['/games/math/math-24-thinking-media.html', '/games/math/math-24-thinking-worksheet.html', '📝 ใบงานเกม 24 วิธีคิด ป.4', 'ใบงาน A4 คู่สื่อเกม 24 ฝึกใช้เครื่องหมาย + − × ÷ ให้ได้ 24 พร้อมขั้นตอน', '/games/math/math-24-thinking-media-cover.png', 'คณิตศาสตร์', ['ป.4'], ['ใบงาน', 'เกม24', 'คิดเลข', 'พิมพ์ได้'], 146],
      ['/games/thai/thai-word-types.html', '/games/thai/thai-word-types-worksheet.html', '📝 ใบงานชนิดของคำ ป.3–ป.4', 'ใบงาน A4 คู่สื่อชนิดของคำ ฝึกจำแนกนาม กริยา คุณศัพท์', '/games/thai/thai-word-types-cover.png', 'ภาษาไทย', ['ป.3', 'ป.4'], ['ใบงาน', 'ชนิดของคำ', 'นาม', 'พิมพ์ได้'], 147],
      ['/games/science/vertebrate-sort.html', '/games/science/vertebrate-sort-worksheet.html', '📝 ใบงานสัตว์มีกระดูกสันหลัง ป.4', 'ใบงาน A4 คู่สื่อจัดกลุ่มสัตว์มีกระดูกสันหลัง ฝึกจำแนกและยกตัวอย่าง', '/games/science/vertebrate-sort-cover.png', 'วิทยาศาสตร์', ['ป.4'], ['ใบงาน', 'สัตว์', 'กระดูกสันหลัง', 'พิมพ์ได้'], 148],
      ['/games/social/sukhothai-timeline.html', '/games/social/sukhothai-timeline-worksheet.html', '📝 ใบงานเส้นเวลาสุโขทัย ป.4', 'ใบงาน A4 คู่สื่อเส้นเวลาสุโขทัย ฝึกเรียงเหตุการณ์ บุคคลสำคัญ และมรดก', '/games/social/sukhothai-timeline-cover.png', 'สังคมศึกษา', ['ป.4'], ['ใบงาน', 'สุโขทัย', 'เส้นเวลา', 'พิมพ์ได้'], 149],
      ['/games/english/sight-words-p4.html', '/games/english/sight-words-p4-worksheet.html', '📝 ใบงาน Sight Words ป.4', 'ใบงาน A4 คู่สื่อ Sight Words ฝึกอ่านจำ เติมคำ และแต่งประโยคสั้น', '/games/english/sight-words-p4-cover.png', 'ภาษาอังกฤษ', ['ป.4'], ['ใบงาน', 'sight words', 'อังกฤษ', 'พิมพ์ได้'], 150],
    ],
    indicators: [
      ['/games/math/math-24-thinking-worksheet.html', 'ค 1.1 ป.4/10'],
      ['/games/math/math-24-thinking-worksheet.html', 'ค 1.1 ป.4/12'],
      ['/games/thai/thai-word-types-worksheet.html', 'ท 4.1 ป.4/2'],
      ['/games/thai/thai-word-types-worksheet.html', 'ท 4.1 ป.4/6'],
      ['/games/science/vertebrate-sort-worksheet.html', 'ว 1.3 ป.4/3'],
      ['/games/science/vertebrate-sort-worksheet.html', 'ว 1.3 ป.4/4'],
      ['/games/social/sukhothai-timeline-worksheet.html', 'ส 4.3 ป.4/1'],
      ['/games/social/sukhothai-timeline-worksheet.html', 'ส 4.3 ป.4/2'],
      ['/games/social/sukhothai-timeline-worksheet.html', 'ส 4.3 ป.4/3'],
      ['/games/english/sight-words-p4-worksheet.html', 'ต 1.1 ป.4/2'],
    ],
  },
  {
    name: '419 batch 8',
    specs: [
      ['/games/math/short-division-thinking-media.html', '/games/math/short-division-worksheet.html', '📝 ใบงานการหารสั้น ป.4', 'ใบงาน A4 คู่สื่อหารสั้น ฝึกเขียนตัวทดและผลหารทีละหลัก', '/games/math/short-division-thinking-media-cover.png', 'คณิตศาสตร์', ['ป.4'], ['ใบงาน', 'หารสั้น', 'พิมพ์ได้'], 151],
      ['/games/thai/thai-sara-chart.html', '/games/thai/thai-sara-chart-worksheet.html', '📝 ใบงานสระไทย ป.1–ป.2', 'ใบงาน A4 คู่สื่อแผนภาพสระ ฝึกจับคู่ เติมสระ และจำแนกสั้น–ยาว', '/games/thai/thai-sara-chart-cover.png', 'ภาษาไทย', ['ป.1', 'ป.2'], ['ใบงาน', 'สระ', 'พิมพ์ได้'], 152],
      ['/games/thai/thai-matra-chart.html', '/games/thai/thai-matra-chart-worksheet.html', '📝 ใบงานมาตราตัวสะกด ป.2', 'ใบงาน A4 คู่สื่อมาตราตัวสะกด ฝึกจำแนกแม่และวิเคราะห์คำ', '/games/thai/thai-matra-chart-cover.png', 'ภาษาไทย', ['ป.1', 'ป.2', 'ป.3'], ['ใบงาน', 'มาตรา', 'พิมพ์ได้'], 153],
      ['/games/english/follow-instructions.html', '/games/english/follow-instructions-worksheet.html', '📝 ใบงาน Follow Instructions ป.4', 'ใบงาน A4 คู่สื่อ Follow Instructions ฝึกอ่านคำสั่งแล้วทำเครื่องหมายบนภาพ', '/games/english/follow-instructions-cover.png', 'ภาษาอังกฤษ', ['ป.4'], ['ใบงาน', 'instructions', 'พิมพ์ได้'], 154],
      ['/games/math/times-table.html', '/games/math/times-table-worksheet.html', '📝 ใบงานตารางสูตรคูณ ป.2–ป.4', 'ใบงาน A4 คู่สื่อตารางสูตรคูณ ฝึกเติมผลคูณและกรอกแถว', '/games/math/times-table-cover.png', 'คณิตศาสตร์', ['ป.2', 'ป.3', 'ป.4'], ['ใบงาน', 'สูตรคูณ', 'พิมพ์ได้'], 155],
    ],
    indicators: [
      ['/games/math/short-division-worksheet.html', 'ค 1.1 ป.4/9'],
      ['/games/math/short-division-worksheet.html', 'ค 1.1 ป.4/10'],
      ['/games/math/short-division-worksheet.html', 'ค 1.1 ป.4/11'],
      ['/games/thai/thai-sara-chart-worksheet.html', 'ท 4.1 ป.1/1'],
      ['/games/thai/thai-sara-chart-worksheet.html', 'ท 4.1 ป.2/1'],
      ['/games/thai/thai-matra-chart-worksheet.html', 'ท 4.1 ป.2/1'],
      ['/games/english/follow-instructions-worksheet.html', 'ต 1.1 ป.4/1'],
      ['/games/english/follow-instructions-worksheet.html', 'ต 1.1 ป.4/3'],
      ['/games/math/times-table-worksheet.html', 'ค 1.1 ป.2/5'],
      ['/games/math/times-table-worksheet.html', 'ค 1.1 ป.3/6'],
      ['/games/math/times-table-worksheet.html', 'ค 1.1 ป.4/9'],
    ],
  },
];

async function upsertWorksheet(catId, sourceUrl, worksheetUrl, title, description, thumb, subject, grades, tags, sortOrder) {
  const { data: source, error: srcErr } = await sb
    .from('educational_hub_items')
    .select('owner_staff_id')
    .eq('external_url', sourceUrl)
    .eq('is_published', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (srcErr) fail(`source lookup ${sourceUrl}`, srcErr);
  if (!source?.owner_staff_id) fail(`source media not found: ${sourceUrl}`);

  const ownerId = source.owner_staff_id;
  const payload = {
    owner_staff_id: ownerId,
    category_id: catId,
    item_type: 'link',
    title,
    description,
    external_url: worksheetUrl,
    thumbnail_url: thumb,
    subject,
    grade_levels: grades,
    tags,
    sort_order: sortOrder,
    tracked_game: false,
    is_published: true,
  };

  const { data: existing, error: exErr } = await sb
    .from('educational_hub_items')
    .select('id')
    .eq('owner_staff_id', ownerId)
    .eq('external_url', worksheetUrl)
    .maybeSingle();
  if (exErr) fail(`existing ${worksheetUrl}`, exErr);

  if (!existing) {
    const { error } = await sb.from('educational_hub_items').insert(payload);
    if (error) fail(`insert ${worksheetUrl}`, error);
    console.log('  INSERT', worksheetUrl);
  } else {
    const { error } = await sb
      .from('educational_hub_items')
      .update({
        category_id: catId,
        title,
        description,
        thumbnail_url: thumb,
        subject,
        grade_levels: grades,
        tags,
        sort_order: sortOrder,
        tracked_game: false,
        is_published: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
    if (error) fail(`update ${worksheetUrl}`, error);
    console.log('  UPDATE', worksheetUrl);
  }
}

async function linkIndicators(pairs) {
  const urls = [...new Set(pairs.map(([u]) => u))];
  const codes = [...new Set(pairs.map(([, c]) => c))];

  const { data: items, error: iErr } = await sb
    .from('educational_hub_items')
    .select('id, external_url')
    .in('external_url', urls)
    .eq('is_published', true)
    .eq('tracked_game', false);
  if (iErr) fail('items for indicators', iErr);

  const { data: inds, error: indErr } = await sb
    .from('curriculum_indicators')
    .select('id, indicator_code')
    .in('indicator_code', codes);
  if (indErr) fail('indicators lookup', indErr);

  const itemByUrl = new Map((items || []).map((r) => [r.external_url, r.id]));
  const indByCode = new Map((inds || []).map((r) => [r.indicator_code, r.id]));

  let linked = 0;
  let skipped = 0;
  let missing = 0;
  for (const [wUrl, code] of pairs) {
    const eduId = itemByUrl.get(wUrl);
    const indId = indByCode.get(code);
    if (!eduId || !indId) {
      console.warn(`  MISS indicator map ${wUrl} ↔ ${code} (item=${!!eduId} ind=${!!indId})`);
      missing++;
      continue;
    }
    const { error } = await sb
      .from('indicator_games')
      .upsert({ edu_hub_item_id: eduId, indicator_id: indId }, { onConflict: 'edu_hub_item_id,indicator_id', ignoreDuplicates: true });
    if (error) {
      // fallback: ignore unique violation
      if (String(error.code) === '23505' || /duplicate/i.test(error.message || '')) {
        skipped++;
        continue;
      }
      fail(`indicator link ${wUrl} ${code}`, error);
    } else {
      linked++;
    }
  }
  console.log(`  indicators linked=${linked} skipped=${skipped} missing=${missing}`);
}

async function apply420() {
  console.log('\n== 420 word-problem media + worksheet ==');
  const { data: mediaCat, error: mcErr } = await sb
    .from('educational_hub_categories')
    .select('id')
    .eq('category_key', 'media')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (mcErr) fail('media cat', mcErr);

  const { data: wsCat, error: wcErr } = await sb
    .from('educational_hub_categories')
    .select('id')
    .eq('category_key', 'worksheets')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();
  if (wcErr) fail('worksheets cat', wcErr);
  if (!mediaCat || !wsCat) fail('category media/worksheets not found');

  let ownerId = null;
  const { data: hub } = await sb
    .from('educational_hub_items')
    .select('owner_staff_id')
    .eq('external_url', '/games/math/math-word-problem-hub/index.html')
    .eq('is_published', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  ownerId = hub?.owner_staff_id || null;

  if (!ownerId) {
    const { data: staff } = await sb
      .from('staff')
      .select('id')
      .like('name', '%ณัฐพงศ์%สิงห์ชมภู%')
      .eq('staff_type', 'teaching')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    ownerId = staff?.id || null;
  }
  if (!ownerId) fail('owner staff not found for word-problem');

  const mediaUrl = '/games/math/math-word-problem-media.html';
  const wsUrl = '/games/math/math-word-problem-worksheet.html';
  const thumb = '/games/math/math-word-problem-hub/cover.png';

  async function upsertItem(catId, externalUrl, title, description, sortOrder, tags) {
    const payload = {
      owner_staff_id: ownerId,
      category_id: catId,
      item_type: 'link',
      title,
      description,
      external_url: externalUrl,
      thumbnail_url: thumb,
      subject: 'คณิตศาสตร์',
      grade_levels: ['ป.4', 'ป.5'],
      tags,
      sort_order: sortOrder,
      tracked_game: false,
      is_published: true,
    };
    const { data: existing, error: exErr } = await sb
      .from('educational_hub_items')
      .select('id')
      .eq('owner_staff_id', ownerId)
      .eq('external_url', externalUrl)
      .maybeSingle();
    if (exErr) fail(`existing ${externalUrl}`, exErr);
    if (!existing) {
      const { error } = await sb.from('educational_hub_items').insert(payload);
      if (error) fail(`insert ${externalUrl}`, error);
      console.log('  INSERT', externalUrl);
    } else {
      const { error } = await sb.from('educational_hub_items').update({
        ...payload,
        updated_at: new Date().toISOString(),
      }).eq('id', existing.id);
      if (error) fail(`update ${externalUrl}`, error);
      console.log('  UPDATE', externalUrl);
    }
  }

  await upsertItem(
    mediaCat.id,
    mediaUrl,
    '🧮 โจทย์ปัญหา 4 ขั้น ป.4–ป.5',
    'สื่อสาธิตแก้โจทย์ปัญหาแบบไล่ขั้น: เข้าใจ · วางแผน · คำนวณ · ตรวจ พร้อมไฮไลต์คำสำคัญ',
    156,
    ['โจทย์ปัญหา', '4ขั้น', 'สื่อการสอน'],
  );
  await upsertItem(
    wsCat.id,
    wsUrl,
    '📝 ใบงานโจทย์ปัญหา 4 ขั้น ป.4',
    'ใบงาน A4 คู่สื่อโจทย์ปัญหา ฝึกกรอก รู้แล้ว/หาอะไร · วางแผน · คำนวณ · ตรวจ',
    157,
    ['ใบงาน', 'โจทย์ปัญหา', 'พิมพ์ได้'],
  );

  // 420 indicators: tracked_game not required for media
  const pairs = [
    [mediaUrl, 'ค 1.1 ป.4/10'],
    [mediaUrl, 'ค 1.1 ป.4/11'],
    [mediaUrl, 'ค 1.1 ป.4/12'],
    [wsUrl, 'ค 1.1 ป.4/10'],
    [wsUrl, 'ค 1.1 ป.4/11'],
    [wsUrl, 'ค 1.1 ป.4/12'],
  ];
  const urls = [...new Set(pairs.map(([u]) => u))];
  const codes = [...new Set(pairs.map(([, c]) => c))];
  const { data: items } = await sb.from('educational_hub_items').select('id, external_url').in('external_url', urls).eq('is_published', true);
  const { data: inds } = await sb.from('curriculum_indicators').select('id, indicator_code').in('indicator_code', codes);
  const itemByUrl = new Map((items || []).map((r) => [r.external_url, r.id]));
  const indByCode = new Map((inds || []).map((r) => [r.indicator_code, r.id]));
  let linked = 0;
  for (const [u, code] of pairs) {
    const eduId = itemByUrl.get(u);
    const indId = indByCode.get(code);
    if (!eduId || !indId) {
      console.warn(`  MISS ${u} ↔ ${code}`);
      continue;
    }
    const { error } = await sb
      .from('indicator_games')
      .upsert({ edu_hub_item_id: eduId, indicator_id: indId }, { onConflict: 'edu_hub_item_id,indicator_id', ignoreDuplicates: true });
    if (!error || String(error.code) === '23505') linked++;
    else if (error) fail(`420 indicator ${u}`, error);
  }
  console.log(`  indicators linked≈${linked}`);
}

const { data: wsCat, error: catErr } = await sb
  .from('educational_hub_categories')
  .select('id')
  .eq('category_key', 'worksheets')
  .eq('is_active', true)
  .limit(1)
  .maybeSingle();
if (catErr) fail('worksheets category', catErr);
if (!wsCat) fail('category worksheets not found');
console.log('worksheets category:', wsCat.id);

for (const batch of batches) {
  console.log(`\n== ${batch.name} ==`);
  for (const s of batch.specs) {
    await upsertWorksheet(wsCat.id, ...s);
  }
  await linkIndicators(batch.indicators);
}

await apply420();

const verifyUrls = batches.flatMap((b) => b.specs.map((s) => s[1]));
verifyUrls.push('/games/math/math-word-problem-media.html', '/games/math/math-word-problem-worksheet.html');
const { data: verify, error: vErr } = await sb
  .from('educational_hub_items')
  .select('external_url, title, is_published')
  .in('external_url', verifyUrls);
if (vErr) fail('verify', vErr);
const present = new Set((verify || []).map((r) => r.external_url));
console.log('\n== VERIFY ==');
let miss = 0;
for (const u of verifyUrls) {
  const ok = present.has(u);
  if (!ok) miss++;
  console.log(`${ok ? 'OK ' : 'MISS'} ${u}`);
}
const { count } = await sb
  .from('educational_hub_items')
  .select('*', { count: 'exact', head: true })
  .like('external_url', '%-worksheet.html');
console.log(`total worksheet items: ${count}`);
console.log(miss === 0 ? '\nALL PENDING MIGRATIONS APPLIED' : `\nDONE WITH ${miss} MISSING`);
process.exit(miss === 0 ? 0 : 1);
