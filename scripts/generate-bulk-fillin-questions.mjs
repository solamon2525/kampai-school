// scripts/generate-bulk-fillin-questions.mjs
// Generates 180 high-quality multi-dimensional fill-in exam questions across Thai, Math, and English
import fs from 'fs';
import path from 'path';

// Helper to escape single quotes in SQL strings
function esc(str) {
  if (str === null || str === undefined) return 'NULL';
  return "'" + String(str).replace(/'/g, "''") + "'";
}

// Helper for ARRAY['...']
function sqlArray(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return "'{}'::text[]";
  const items = arr.map(a => "'" + String(a).replace(/'/g, "''") + "'").join(', ');
  return `ARRAY[${items}]`;
}

// Helper for to_jsonb('...'::text)
function sqlJsonbText(val) {
  return `to_jsonb(${esc(val)}::text)`;
}

// Build questions list
const questions = [];

// ==============================================================================
// 1. ภาษาไทย (60 ข้อ)
// ==============================================================================

// TH-D1: คำศัพท์และคำที่มักเขียนผิด (10 ข้อ)
const thD1 = [
  {
    topic: 'คำที่มักเขียนผิด',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จากสื่อ "คลังคำศัพท์ภาษาไทย" คำอ่านว่า "กะ-เพรา" ที่หมายถึงไม้ล้มลุกใช้ปรุงอาหารผัดกะเพรา เขียนสะกดเป็นคำไทยที่ถูกต้องว่าอย่างไร?',
    answer: 'กะเพรา',
    accepted: ['กะเพรา', 'ผัดกะเพรา', 'ใบกะเพรา'],
    explanation: 'คำที่ถูกต้องคือ "กะเพรา" ไม่ใช่ "กระเพรา" (ไม่มี ร ควบกล้ำที่พยางค์แรก)',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'คำที่มักเขียนผิด',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'จากสื่อ "คลังคำศัพท์ภาษาไทย" คำว่า "บังสุกุล" (พิธีทอดผ้าบังสุกุล) มักเขียนผิดเป็น "บังสกุล" จงเขียนคำที่สะกดถูกต้องตามพจนานุกรมฉบับราชบัณฑิตยสถาน',
    answer: 'บังสุกุล',
    accepted: ['บังสุกุล', 'ผ้าบังสุกุล'],
    explanation: 'สะกดที่ถูกต้องคือ "บังสุกุล" มีสระอุที่ ส (มาจากภาษาบาลี ปํสุกล)',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'คำที่มักเขียนผิด',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จากสื่อ "คลังคำศัพท์ภาษาไทย" คำว่า "กาลเทศะ" (ความเหมาะสมตามเวลาและสถานที่) มักมีผู้เขียนผิดเป็น "กาละเทศะ" จงเขียนคำสะกดที่ถูกต้อง',
    answer: 'กาลเทศะ',
    accepted: ['กาลเทศะ', 'รู้กาลเทศะ'],
    explanation: 'สะกดที่ถูกต้องคือ "กาลเทศะ" ไม่มีรูปสระอะหลัง ล ลิง',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'คำที่มักเขียนผิด',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'คำว่า "อนุญาต" (ยินยอม ตกลง) เขียนสะกดอย่างไรจึงจะถูกต้อง? (ระวังความสับสนกับคำว่า ญาติพี่น้อง)',
    answer: 'อนุญาต',
    accepted: ['อนุญาต', 'การอนุญาต', 'ขออนุญาต'],
    explanation: 'คำว่า "อนุญาต" ไม่มีสระอิบน ต เต่า ส่วนคำว่า "ญาติ" (ญาติพี่น้อง) จึงจะมีสระอิ',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'คำที่มักเขียนผิด',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'คำว่า "กฎหมาย" พยัญชนะตัวสะกดของคำว่า "กฎ" ใช้ตัว ฎ ชฎา หรือ ฏ ปฏัก?',
    answer: 'ฎ ชฎา',
    accepted: ['ฎ ชฎา', 'ฎ', 'ชฎา', 'ด ชฎา', 'ตัว ฎ'],
    explanation: 'คำว่า "กฎ" ใน กฎหมาย, กฎเกณฑ์, กฎระเบียบ สะกดด้วย ฎ ชฎา',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'คำที่มักเขียนผิด',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'คำว่า "ปรากฏ" พยัญชนะตัวสะกดของคำว่า "กฏ" ใช้ตัว ฎ ชฎา หรือ ฏ ปฏัก?',
    answer: 'ฏ ปฏัก',
    accepted: ['ฏ ปฏัก', 'ฏ', 'ปฏัก', 'ต ปฏัก', 'ตัว ฏ'],
    explanation: 'คำว่า "ปรากฏ", "กบฏ" สะกดด้วย ฏ ปฏัก (มีหยัก)',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'คำที่มักเขียนผิด',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จากสื่อ "คลังคำศัพท์ภาษาไทย" คำว่า "คาดคะเน" หรือการประมาณ พยางค์คำว่า "คะเน" เขียนด้วย ค ควาย หรือ ก ไก่?',
    answer: 'ค ควาย',
    accepted: ['ค ควาย', 'ค', 'ตัว ค', 'คอ ควาย'],
    explanation: 'คำว่า "คะเน", "คาดคะเน" สะกดด้วย ค ควาย (ไม่ใช่ กะเน)',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'คำที่มักเขียนผิด',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'ผลไม้ที่มีตารอบตัว รสเปรี้ยวอมหวาน เขียนสะกดถูกต้องว่า "สับปะรด" หรือ "สับปรด"?',
    answer: 'สับปะรด',
    accepted: ['สับปะรด', 'ผลสับปะรด', 'ลูกสับปะรด'],
    explanation: 'สะกดที่ถูกต้องคือ "สับปะรด" มีสระอะคั่นกลาง',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'คำที่มักเขียนผิด',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'คำว่า "สังเกต" มีสระอุที่ ต เต่า หรือไม่? (ตอบว่า "มี" หรือ "ไม่มี")',
    answer: 'ไม่มี',
    accepted: ['ไม่มี', 'ไม่มีสระอุ', 'ไม่'],
    explanation: 'คำว่า "สังเกต" ไม่มีสระอุ ส่วนคำว่า "สาเหตุ" จึงจะมีสระอุ',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'คำที่มักเขียนผิด',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'คำว่า "รสชาติ" (รสของอาหาร เช่น เปรี้ยว หวาน เค็ม) ตัวสะกดพยางค์หลังใช้คำว่า "ชาด" หรือ "ชาติ"?',
    answer: 'ชาติ',
    accepted: ['ชาติ', 'รสชาติ'],
    explanation: 'สะกดที่ถูกต้องคือ "รสชาติ" มี ต เต่า สระอิ',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  }
];
questions.push(...thD1);

// TH-D2: เติมคำในประโยคให้สมบูรณ์ (10 ข้อ)
const thD2 = [
  {
    topic: 'การเติมคำในประโยค',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จงเติมคำในช่องว่างให้ประโยคสมบูรณ์: "นักเรียนควรใช้จ่ายเงินอย่าง... เพื่อให้มีเงินเหลือเก็บเข้าธนาคารพอเพียง"',
    answer: 'ประหยัด',
    accepted: ['ประหยัด', 'มัธยัสถ์', 'รอบคอบ'],
    explanation: 'คำว่า "ประหยัด" หมายถึงการใช้จ่ายเท่าที่จำเป็นและไม่ฟุ่มเฟือย สอดคล้องกับหลักปรัชญาเศรษฐกิจพอเพียง',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'การเติมคำในประโยค',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จงเติมคำในช่องว่างให้ประโยคสมบูรณ์: "ลูกที่ดีควรมีความ... รู้คุณและตอบแทนบุญคุณของบิดามารดา"',
    answer: 'กตัญญู',
    accepted: ['กตัญญู', 'กตเวที', 'กตัญญูกตเวที'],
    explanation: 'คำว่า "กตัญญู" หมายถึงการรู้คุณและสำนึกในบุญคุณของผู้มีอุปการคุณ',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'การเติมคำในประโยค',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จงเติมคำในช่องว่าง: "การเข้าแถวเคารพธงชาติและการเดินขึ้นบันไดอย่างเป็นระเบียบเป็นการฝึกความมี..."',
    answer: 'วินัย',
    accepted: ['วินัย', 'ระเบียบวินัย'],
    explanation: 'คำว่า "วินัย" หรือ "ระเบียบวินัย" คือการปฏิบัติตามกฎเกณฑ์และแบบแผนของสังคม',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'การเติมคำในประโยค',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จงเติมคำในช่องว่าง: "คนที่มีความ... เมื่อเก็บสิ่งของของผู้อื่นได้จะนำมาส่งคืนเจ้าของ ไม่คิดเอาเป็นของตนเอง"',
    answer: 'ซื่อสัตย์',
    accepted: ['ซื่อสัตย์', 'ซื่อสัตย์สุจริต', 'สุจริต'],
    explanation: 'ความซื่อสัตย์ หมายถึงการประพฤติตรง ไม่คดโกง ไม่เอาของผู้อื่น',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'การเติมคำในประโยค',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จงเติมคำในช่องว่าง: "พวกเราร่วมแรงร่วมใจกันพัฒนาโรงเรียนบ้านคำไผ่ด้วยความรักและความ..."',
    answer: 'สามัคคี',
    accepted: ['สามัคคี', 'ความสามัคคี', 'ปรองดอง'],
    explanation: 'ความสามัคคี หมายถึง ความพร้อมเพรียงกัน ความร่วมมือร่วมใจกันทำงาน',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'การเติมคำในประโยค',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'จงเติมคำในช่องว่าง: "การคัดแยกขวดพลาสติก กล่องนม และกระป๋องอะลูมิเนียม เพื่อนำไปแปรรูปกลับมาใช้ใหม่ เรียกว่ากระบวนการ..."',
    answer: 'รีไซเคิล',
    accepted: ['รีไซเคิล', 'การรีไซเคิล', 'recycle', 'Recycle'],
    explanation: 'รีไซเคิล (Recycle) คือการนำวัสดุเหลือใช้มาแปรรูปเป็นผลิตภัณฑ์ใหม่',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'การเติมคำในประโยค',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'จงเติมคำในช่องว่าง: "ควันพิษจากท่อไอเสียรถยนต์และการเผาขยะก่อให้เกิด... ทางอากาศที่เป็นอันตรายต่อระบบทางเดินหายใจ"',
    answer: 'มลพิษ',
    accepted: ['มลพิษ', 'มลภาวะ'],
    explanation: 'มลพิษ หมายถึง ของเสีย วัตถุอันตราย หรือสิ่งปนเปื้อนที่ส่งผลเสียต่อสิ่งแวดล้อม',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'การเติมคำในประโยค',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จงเติมคำในช่องว่าง: "เราควรมีจิตใจโอบอ้อมอารีและมีความ... กรุณาต่อสัตว์ร่วมโลก ไม่รังแกสัตว์"',
    answer: 'เมตตา',
    accepted: ['เมตตา', 'ความเมตตา', 'เมตตากรุณา'],
    explanation: 'เมตตา หมายถึง ความปรารถนาจะให้ผู้อื่นหรือสัตว์มีความสุข',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'การเติมคำในประโยค',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จงเติมคำในช่องว่าง: "การลอยกระทงในคืนวันเพ็ญเดือนสิบสองเป็น... อันดีงามที่สืบทอดกันมาแต่โบราณ"',
    answer: 'ประเพณี',
    accepted: ['ประเพณี', 'ขนบประเพณี', 'วัฒนธรรมประเพณี'],
    explanation: 'ประเพณี หมายถึง สิ่งที่นิยมถือประพฤติปฏิบัติสืบต่อกันมาจนเป็นแบบแผน',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'การเติมคำในประโยค',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จงเติมคำในช่องว่าง: "การทำงานที่ยากลำบากให้สำเร็จได้ต้องอาศัยความพยายามและความ... พากเพียร ไม่ย่อท้อต่ออุปสรรค"',
    answer: 'อดทน',
    accepted: ['อดทน', 'ความอดทน', 'มานะ', 'ความพยายาม'],
    explanation: 'ความอดทน หมายถึง ความกลั้นอยู่ได้ ไม่ยอมแพ้ต่อความยากลำบาก',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  }
];
questions.push(...thD2);

// TH-D3: ลักษณนามน่ารู้ (10 ข้อ)
const thD3 = [
  {
    topic: 'ลักษณนาม',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จากสื่อ "คลังคำศัพท์ภาษาไทย หมวดลักษณนาม" คำว่า "ปากกา" มีลักษณนามว่าอะไร? (เช่น ปากกา 1 ...)',
    answer: 'ด้าม',
    accepted: ['ด้าม', '1 ด้าม'],
    explanation: 'ปากกามีลักษณนามเรียกเป็น "ด้าม" ส่วนดินสอเรียกเป็น "แท่ง"',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'ลักษณนาม',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'คำว่า "ดินสอ" ใช้ลักษณนามเรียกสิ่งของว่าอะไร? (เช่น ดินสอ 2 ...)',
    answer: 'แท่ง',
    accepted: ['แท่ง', '2 แท่ง'],
    explanation: 'ดินสอใช้ลักษณนามว่า "แท่ง"',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'ลักษณนาม',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'กระดาษพิมพ์งานที่หยิบออกมาทีละชิ้น มีลักษณนามเรียกว่าอะไร? (เช่น กระดาษ A4 จำนวน 5 ...)',
    answer: 'แผ่น',
    accepted: ['แผ่น', '5 แผ่น'],
    explanation: 'กระดาษ ใบไม้ ภาพถ่าย ใช้ลักษณนามว่า "แผ่น"',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'ลักษณนาม',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'จากสื่อ "คลังคำศัพท์ไทย" ช้างที่เลี้ยงไว้ในบ้านหรือควาญช้างดูแล มีลักษณนามเรียกว่าอะไร? (เช่น ช้างเลี้ยง 1 ...)',
    answer: 'เชือก',
    accepted: ['เชือก', '1 เชือก'],
    explanation: 'ช้างบ้าน (ช้างที่นำมาเลี้ยงและฝึกแล้ว) ใช้ลักษณนามว่า "เชือก" ส่วนช้างป่าใช้ "ตัว" และช้างเผือกใช้ "ช้าง"',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'ลักษณนาม',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'ฝูงช้างป่าที่อาศัยอยู่ร่วมกันเป็นครอบครัวในอุทยานแห่งชาติ มีลักษณนามเรียกว่าอะไร? (เช่น ช้างป่า 1 ...)',
    answer: 'โขลง',
    accepted: ['โขลง', '1 โขลง', 'ฝูง'],
    explanation: 'ช้างป่าที่รวมตัวกันเป็นกลุ่มใหญ่ตามธรรมชาติ มีลักษณนามว่า "โขลง"',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'ลักษณนาม',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'พระภิกษุสงฆ์ในทางพระพุทธศาสนา มีลักษณนามเรียกว่าอะไร? (เช่น นิมนต์พระสงฆ์ 9 ...)',
    answer: 'รูป',
    accepted: ['รูป', '9 รูป'],
    explanation: 'พระภิกษุสงฆ์และสามเณร ใช้ลักษณนามว่า "รูป" (พระพุทธรูปใช้ "องค์")',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'ลักษณนาม',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'พระพุทธรูปปางสมาธิที่ประดิษฐานอยู่ในอุโบสถ มีลักษณนามเรียกว่าอะไร? (เช่น พระพุทธรูป 1 ...)',
    answer: 'องค์',
    accepted: ['องค์', '1 องค์'],
    explanation: 'พระพุทธรูป เจดีย์ และพระมหากษัตริย์ ใช้ลักษณนามว่า "องค์"',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'ลักษณนาม',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'สิ่งปลูกสร้างที่อยู่อาศัย เช่น "บ้าน" มีลักษณนามเรียกว่าอะไร? (เช่น บ้าน 1 ...)',
    answer: 'หลัง',
    accepted: ['หลัง', '1 หลัง'],
    explanation: 'บ้าน ตึก มุ้ง ก่อสร้างที่พักอาศัย ใช้ลักษณนามว่า "หลัง"',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'ลักษณนาม',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'ยานพาหนะทางบก เช่น รถยนต์ รถจักรยาน มีลักษณนามเรียกว่าอะไร? (เช่น รถยนต์ 1 ...)',
    answer: 'คัน',
    accepted: ['คัน', '1 คัน'],
    explanation: 'รถยนต์ รถจักรยาน รถไฟ ช้อน ร่ม ใช้ลักษณนามว่า "คัน"',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'ลักษณนาม',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'ของมีคม เช่น กรรไกร มีด เล่มเทียน มีลักษณนามเรียกว่าอะไร? (เช่น กรรไกร 1 ...)',
    answer: 'เล่ม',
    accepted: ['เล่ม', '1 เล่ม'],
    explanation: 'กรรไกร มีด หนังสือ สมุด เทียน ใช้ลักษณนามว่า "เล่ม"',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  }
];
questions.push(...thD3);

// TH-D4: สำนวน สุภาษิต คำพังเพย (10 ข้อ)
const thD4 = [
  {
    topic: 'สำนวนไทย',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จงเติมคำในสำนวนไทยให้ถูกต้อง: "น้ำขึ้นให้รีบ..." (ความหมาย: เมื่อมีโอกาสดีควรรีบคว้าไว้)',
    answer: 'ตัก',
    accepted: ['ตัก', 'รีบตัก'],
    explanation: 'สำนวนไทยคือ "น้ำขึ้นให้รีบตัก" สอนให้ฉวยโอกาสดีเมื่อมีมาถึง',
    indicator_code: 'ท 4.1 ป.4/6',
    indicator_desc: 'บอกความหมายของสำนวน',
    media_item_id: 'a736cc4c-d55d-46a8-9ee2-1edaee9d8b1c',
    media_title: '📚 คลังวรรณคดีวรรณกรรม — นิทาน · สุภาษิต · ข้อคิด',
    media_image_url: '/games/thai/thai-literature-hub/cover.png'
  },
  {
    topic: 'สำนวนไทย',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จงเติมคำในสำนวนไทย: "ขี่ช้างจับ..." (ความหมาย: ลงทุนมากแต่ได้ผลประโยชน์นิดเดียว)',
    answer: 'ตั๊กแตน',
    accepted: ['ตั๊กแตน', 'ตั๊กแตน'],
    explanation: 'สำนวน "ขี่ช้างจับตั๊กแตน" หมายถึง ลงทุนลงแรงอย่างใหญ่โตแต่ได้ผลลัพธ์เพียงเล็กน้อย ไม่คุ้มค่า',
    indicator_code: 'ท 4.1 ป.4/6',
    indicator_desc: 'บอกความหมายของสำนวน',
    media_item_id: 'a736cc4c-d55d-46a8-9ee2-1edaee9d8b1c',
    media_title: '📚 คลังวรรณคดีวรรณกรรม — นิทาน · สุภาษิต · ข้อคิด',
    media_image_url: '/games/thai/thai-literature-hub/cover.png'
  },
  {
    topic: 'สำนวนไทย',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'จงเติมคำในสำนวนไทย: "ไก่เห็นตีนงู งูเห็น...ไก่" (ความหมาย: ต่างฝ่ายต่างรู้ความลับหรือเล่ห์เหลี่ยมของกันและกัน)',
    answer: 'นม',
    accepted: ['นม', 'นมไก่'],
    explanation: 'สำนวนเต็มคือ "ไก่เห็นตีนงู งูเห็นนมไก่"',
    indicator_code: 'ท 4.1 ป.4/6',
    indicator_desc: 'บอกความหมายของสำนวน',
    media_item_id: 'a736cc4c-d55d-46a8-9ee2-1edaee9d8b1c',
    media_title: '📚 คลังวรรณคดีวรรณกรรม — นิทาน · สุภาษิต · ข้อคิด',
    media_image_url: '/games/thai/thai-literature-hub/cover.png'
  },
  {
    topic: 'สำนวนไทย',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'จงเติมคำในสำนวนไทย: "ช้างตายทั้งตัว เอา...มาปิด" (ความหมาย: ความชั่วหรือความผิดร้ายแรงที่รู้กันทั่วไป ย่อมไม่สามารถปิดบังได้)',
    answer: 'ใบบัว',
    accepted: ['ใบบัว', 'ใบ บัว'],
    explanation: 'สำนวน "ช้างตายทั้งตัว เอาใบบัวมาปิด" หมายถึง การพยายามปกปิดความผิดใหญ่หลวงแต่ไม่สำเร็จ',
    indicator_code: 'ท 4.1 ป.4/6',
    indicator_desc: 'บอกความหมายของสำนวน',
    media_item_id: 'a736cc4c-d55d-46a8-9ee2-1edaee9d8b1c',
    media_title: '📚 คลังวรรณคดีวรรณกรรม — นิทาน · สุภาษิต · ข้อคิด',
    media_image_url: '/games/thai/thai-literature-hub/cover.png'
  },
  {
    topic: 'สำนวนไทย',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จงเติมคำในสำนวนไทย: "เข็นครกขึ้น..." (ความหมาย: ทำงานที่ยากลำบากเกินกำลังความสามารถ)',
    answer: 'ภูเขา',
    accepted: ['ภูเขา', 'เขา'],
    explanation: 'สำนวน "เข็นครกขึ้นภูเขา" เปรียบเทียบกับการทำงานที่หนักและยากลำบากอย่างยิ่ง',
    indicator_code: 'ท 4.1 ป.4/6',
    indicator_desc: 'บอกความหมายของสำนวน',
    media_item_id: 'a736cc4c-d55d-46a8-9ee2-1edaee9d8b1c',
    media_title: '📚 คลังวรรณคดีวรรณกรรม — นิทาน · สุภาษิต · ข้อคิด',
    media_image_url: '/games/thai/thai-literature-hub/cover.png'
  },
  {
    topic: 'สำนวนไทย',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จงเติมคำในสำนวนไทย: "วัวหายล้อม..." (ความหมาย: เกิดเรื่องเสียหายขึ้นแล้วจึงคิดหาทางป้องกัน)',
    answer: 'คอก',
    accepted: ['คอก', 'ล้อมคอก'],
    explanation: 'สำนวน "วัวหายล้อมคอก" หมายถึง เกิดความเสียหายแล้วจึงค่อยคิดหาทางป้องกัน',
    indicator_code: 'ท 4.1 ป.4/6',
    indicator_desc: 'บอกความหมายของสำนวน',
    media_item_id: 'a736cc4c-d55d-46a8-9ee2-1edaee9d8b1c',
    media_title: '📚 คลังวรรณคดีวรรณกรรม — นิทาน · สุภาษิต · ข้อคิด',
    media_image_url: '/games/thai/thai-literature-hub/cover.png'
  },
  {
    topic: 'สำนวนไทย',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จงเติมคำในสำนวนไทย: "กบในกะลา..." (ความหมาย: ผู้ที่มีความรู้หรือประสบการณ์น้อยแต่นึกว่าตนเองรอบรู้มาก)',
    answer: 'ครอบ',
    accepted: ['ครอบ', 'กะลาครอบ'],
    explanation: 'สำนวน "กบในกะลาครอบ" เปรียบเสมือนคนที่อยู่ในโลกแคบแต่เข้าใจผิดว่าตนเองรู้หมดทุกเรื่อง',
    indicator_code: 'ท 4.1 ป.4/6',
    indicator_desc: 'บอกความหมายของสำนวน',
    media_item_id: 'a736cc4c-d55d-46a8-9ee2-1edaee9d8b1c',
    media_title: '📚 คลังวรรณคดีวรรณกรรม — นิทาน · สุภาษิต · ข้อคิด',
    media_image_url: '/games/thai/thai-literature-hub/cover.png'
  },
  {
    topic: 'สำนวนไทย',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จงเติมคำในสำนวนไทย: "หนีเสือปะ..." (ความหมาย: หนีภัยอันตรายอย่างหนึ่งแต่กลับไปเจออันตรายอีกอย่างหนึ่งที่ร้ายแรงพอกัน)',
    answer: 'จระเข้',
    accepted: ['จระเข้'],
    explanation: 'สำนวน "หนีเสือปะจระเข้" หมายถึง หลบภัยอย่างหนึ่งพ้นแล้วแต่ต้องมาเจอกับภัยร้ายอีกอย่างหนึ่ง',
    indicator_code: 'ท 4.1 ป.4/6',
    indicator_desc: 'บอกความหมายของสำนวน',
    media_item_id: 'a736cc4c-d55d-46a8-9ee2-1edaee9d8b1c',
    media_title: '📚 คลังวรรณคดีวรรณกรรม — นิทาน · สุภาษิต · ข้อคิด',
    media_image_url: '/games/thai/thai-literature-hub/cover.png'
  },
  {
    topic: 'สำนวนไทย',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จงเติมคำในสำนวนไทย: "สอนจระเข้ให้..." (ความหมาย: สั่งสอนผู้ที่มีความชำนาญในเรื่องนั้นๆ ดีอยู่แล้ว)',
    answer: 'ว่ายน้ำ',
    accepted: ['ว่ายน้ำ', 'ว่าย'],
    explanation: 'สำนวน "สอนจระเข้ให้ว่ายน้ำ" หมายถึง การไปสอนผู้ที่มีความเชี่ยวชาญในเรื่องนั้นอยู่แล้ว',
    indicator_code: 'ท 4.1 ป.4/6',
    indicator_desc: 'บอกความหมายของสำนวน',
    media_item_id: 'a736cc4c-d55d-46a8-9ee2-1edaee9d8b1c',
    media_title: '📚 คลังวรรณคดีวรรณกรรม — นิทาน · สุภาษิต · ข้อคิด',
    media_image_url: '/games/thai/thai-literature-hub/cover.png'
  },
  {
    topic: 'สำนวนไทย',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'จงเติมคำในสำนวนไทย: "เอาหูไปนา เอาตาไป..." (ความหมาย: แกล้งทำเป็นไม่รู้ไม่เห็น ไม่เอาใจใส่)',
    answer: 'ไร่',
    accepted: ['ไร่'],
    explanation: 'สำนวน "เอาหูไปนา เอาตาไปไร่" หมายถึง แสร้งทำเป็นไม่ได้ยินหรือไม่เห็นเรื่องราว',
    indicator_code: 'ท 4.1 ป.4/6',
    indicator_desc: 'บอกความหมายของสำนวน',
    media_item_id: 'a736cc4c-d55d-46a8-9ee2-1edaee9d8b1c',
    media_title: '📚 คลังวรรณคดีวรรณกรรม — นิทาน · สุภาษิต · ข้อคิด',
    media_image_url: '/games/thai/thai-literature-hub/cover.png'
  }
];
questions.push(...thD4);

// TH-D5: คำพ้อง คำไวพจน์ และคำตรงข้าม (10 ข้อ)
const thD5 = [
  {
    topic: 'คำไวพจน์',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จากสื่อ "คลังคำศัพท์ภาษาไทย" คำว่า "สุริยา", "ทินกร" และ "ภาสกร" มีความหมายตรงกับคำสามัญว่าอะไร?',
    answer: 'ดวงอาทิตย์',
    accepted: ['ดวงอาทิตย์', 'พระอาทิตย์', 'อาทิตย์'],
    explanation: 'สุริยา ทินกร ภาสกร ตะวัน เป็นคำไวพจน์หมายถึง ดวงอาทิตย์',
    indicator_code: 'ท 4.1 ป.5/1',
    indicator_desc: 'ระบุชนิดและหน้าที่ของคำในประโยค',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'คำไวพจน์',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'คำว่า "จันทรา", "ศศิธร" และ "รัชนีกร" มีความหมายตรงกับคำสามัญว่าอะไร?',
    answer: 'ดวงจันทร์',
    accepted: ['ดวงจันทร์', 'พระจันทร์', 'จันทร์'],
    explanation: 'จันทรา ศศิธร รัชนีกร แข บุหลัน เป็นคำไวพจน์ของ ดวงจันทร์',
    indicator_code: 'ท 4.1 ป.5/1',
    indicator_desc: 'ระบุชนิดและหน้าที่ของคำในประโยค',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'คำไวพจน์',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'คำว่า "วารี", "ชล", "คงคา" และ "ธารา" มีความหมายตรงกับคำสามัญว่าอะไร?',
    answer: 'น้ำ',
    accepted: ['น้ำ', 'สายนํ้า', 'แม่น้ำ'],
    explanation: 'วารี ชล คงคา ธารา ชลาลัย เป็นคำไวพจน์หมายถึง น้ำ หรือ แม่น้ำ',
    indicator_code: 'ท 4.1 ป.5/1',
    indicator_desc: 'ระบุชนิดและหน้าที่ของคำในประโยค',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'คำไวพจน์',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'คำว่า "คชสาร", "กุญชร", "หัตถี" และ "ไอยรา" เป็นคำไวพจน์ที่หมายถึงสัตว์ชนิดใด?',
    answer: 'ช้าง',
    accepted: ['ช้าง', 'สัตว์ช้าง'],
    explanation: 'คช กุญชร หัตถี ไอยรา คชสาร เป็นคำไวพจน์ของ ช้าง',
    indicator_code: 'ท 4.1 ป.5/1',
    indicator_desc: 'ระบุชนิดและหน้าที่ของคำในประโยค',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'คำไวพจน์',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'คำว่า "บุปผา", "มาลี", "ผกา" และ "บุษบา" มีความหมายตรงกับคำสามัญว่าอะไร?',
    answer: 'ดอกไม้',
    accepted: ['ดอกไม้', 'ดอก'],
    explanation: 'บุปผา มาลี ผกา บุษบา บุษบัน เป็นคำไวพจน์ของ ดอกไม้',
    indicator_code: 'ท 4.1 ป.5/1',
    indicator_desc: 'ระบุชนิดและหน้าที่ของคำในประโยค',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'คำตรงข้าม',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'คำว่า "ขยัน" มีความหมายตรงข้ามกับคำว่าอะไร?',
    answer: 'ขี้เกียจ',
    accepted: ['ขี้เกียจ', 'เกียจคร้าน', 'ความขี้เกียจ'],
    explanation: 'คำตรงข้ามของ ขยัน คือ ขี้เกียจ หรือ เกียจคร้าน',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'คำตรงข้าม',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'คำว่า "ประหยัด" มีความหมายตรงกันข้ามกับคำว่าอะไร? (คำ 4 พยางค์ หมายถึงการใช้จ่ายอย่างไม่ระมัดระวัง)',
    answer: 'สุรุ่ยสุร่าย',
    accepted: ['สุรุ่ยสุร่าย', 'ฟุ่มเฟือย'],
    explanation: 'คำตรงข้ามของ ประหยัด คือ สุรุ่ยสุร่าย หรือ ฟุ่มเฟือย',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'คำตรงข้าม',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'คำว่า "กล้าหาญ" มีความหมายตรงกันข้ามกับคำว่าอะไร?',
    answer: 'ขลาดกลัว',
    accepted: ['ขลาดกลัว', 'ขลาด', 'ขี้ขลาด'],
    explanation: 'คำตรงข้ามของ กล้าหาญ คือ ขลาด หรือ ขี้ขลาด',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'คำพ้องเสียง',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'จากคำพ้องเสียง "การ", "กาล", "กานต์" คำที่หมายถึง "เวลา" (เช่น กาลเวลา) เขียนสะกดด้วยพยัญชนะตัวสะกดใด?',
    answer: 'ล ลิง',
    accepted: ['ล ลิง', 'ล', 'ตัว ล'],
    explanation: 'กาล (เวลา) สะกดด้วย ล ลิง, การ (งาน) สะกดด้วย ร เรือ, กานต์ (เป็นที่รัก) มี ต การันต์',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'คำพ้องรูป',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'คำพ้องรูป "เพลา" หากอ่านออกเสียงสองพยางค์ว่า "เพ-ลา" จะมีความหมายตรงกับคำว่าอะไร?',
    answer: 'เวลา',
    accepted: ['เวลา', 'คราว', 'กาลเวลา'],
    explanation: 'เพ-ลา หมายถึง เวลา ส่วน เพลา (คำควบกล้ำพยางค์เดียว) หมายถึง แกนดุมล้อรถ หรือ เบาลง',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  }
];
questions.push(...thD5);

// TH-D6: หลักภาษา วรรคตอน และราชาศัพท์ (10 ข้อ)
const thD6 = [
  {
    topic: 'เครื่องหมายวรรคตอน',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จากสื่อ "คลังเครื่องหมายวรรคตอนไทย" เครื่องหมาย " ๆ " ที่ใช้สำหรับเขียนหลังคำหรือข้อความเพื่อให้อ่านซ้ำ มีชื่อเรียกว่าเครื่องหมายอะไร?',
    answer: 'ไม้ยมก',
    accepted: ['ไม้ยมก', 'เครื่องหมายไม้ยมก'],
    explanation: 'เครื่องหมาย " ๆ " เรียกว่า ไม้ยมก ใช้เขียนหลังคำ วลี หรือประโยค เพื่อให้อ่านซ้ำ',
    indicator_code: 'ท 4.1 ป.4/2',
    indicator_desc: 'ใช้เครื่องหมายวรรคตอนและอักษรย่อ',
    media_item_id: 'f4564c46-7d74-4f33-b3e7-81cfeae4f493',
    media_title: '✒️ คลังเครื่องหมายวรรคตอนไทย ป.3–ป.5 — Thai Punctuation Studio',
    media_image_url: '/games/thai/thai-punctuation-hub/cover.png'
  },
  {
    topic: 'เครื่องหมายวรรคตอน',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'เครื่องหมาย " ฯ " ที่ใช้ละข้อความตอนท้ายของชื่อเฉพาะ เช่น "กรุงเทพฯ" มีชื่อเรียกว่าเครื่องหมายอะไร?',
    answer: 'ไปยาลน้อย',
    accepted: ['ไปยาลน้อย', 'เครื่องหมายไปยาลน้อย'],
    explanation: 'เครื่องหมาย " ฯ " เรียกว่า ไปยาลน้อย ใช้ละคำที่ยาวให้สั้นลงโดยรู้กันทั่วไป',
    indicator_code: 'ท 4.1 ป.4/2',
    indicator_desc: 'ใช้เครื่องหมายวรรคตอนและอักษรย่อ',
    media_item_id: 'f4564c46-7d74-4f33-b3e7-81cfeae4f493',
    media_title: '✒️ คลังเครื่องหมายวรรคตอนไทย ป.3–ป.5 — Thai Punctuation Studio',
    media_image_url: '/games/thai/thai-punctuation-hub/cover.png'
  },
  {
    topic: 'เครื่องหมายวรรคตอน',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'เครื่องหมาย " ฯลฯ " ที่ใช้ละข้อความในรายการสิ่งของที่มีอยู่อีกมาก มีชื่อเรียกว่าเครื่องหมายอะไร?',
    answer: 'ไปยาลใหญ่',
    accepted: ['ไปยาลใหญ่', 'เครื่องหมายไปยาลใหญ่'],
    explanation: 'เครื่องหมาย " ฯลฯ " เรียกว่า ไปยาลใหญ่ อ่านว่า "ละ" หรือ "และอื่นๆ"',
    indicator_code: 'ท 4.1 ป.4/2',
    indicator_desc: 'ใช้เครื่องหมายวรรคตอนและอักษรย่อ',
    media_item_id: 'f4564c46-7d74-4f33-b3e7-81cfeae4f493',
    media_title: '✒️ คลังเครื่องหมายวรรคตอนไทย ป.3–ป.5 — Thai Punctuation Studio',
    media_image_url: '/games/thai/thai-punctuation-hub/cover.png'
  },
  {
    topic: 'เครื่องหมายวรรคตอน',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'เครื่องหมาย " ? " ที่ใช้แสดงประโยคคำถาม มีชื่อเรียกในภาษาไทยว่าเครื่องหมายอะไร?',
    answer: 'ปรัศนี',
    accepted: ['ปรัศนี', 'เครื่องหมายคำถาม', 'เครื่องหมายปรัศนี'],
    explanation: 'เครื่องหมาย " ? " เรียกว่า ปรัศนี หรือ เครื่องหมายคำถาม',
    indicator_code: 'ท 4.1 ป.4/2',
    indicator_desc: 'ใช้เครื่องหมายวรรคตอนและอักษรย่อ',
    media_item_id: 'f4564c46-7d74-4f33-b3e7-81cfeae4f493',
    media_title: '✒️ คลังเครื่องหมายวรรคตอนไทย ป.3–ป.5 — Thai Punctuation Studio',
    media_image_url: '/games/thai/thai-punctuation-hub/cover.png'
  },
  {
    topic: 'เครื่องหมายวรรคตอน',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'เครื่องหมายคำพูด "..." ที่ใช้คร่อมข้อความสนทนา มีชื่อเรียกทางการว่าเครื่องหมายอะไร?',
    answer: 'อัญประกาศ',
    accepted: ['อัญประกาศ', 'เครื่องหมายอัญประกาศ', 'เครื่องหมายคำพูด'],
    explanation: 'เครื่องหมาย "..." เรียกว่า อัญประกาศ หรือ เครื่องหมายคำพูด',
    indicator_code: 'ท 4.1 ป.4/2',
    indicator_desc: 'ใช้เครื่องหมายวรรคตอนและอักษรย่อ',
    media_item_id: 'f4564c46-7d74-4f33-b3e7-81cfeae4f493',
    media_title: '✒️ คลังเครื่องหมายวรรคตอนไทย ป.3–ป.5 — Thai Punctuation Studio',
    media_image_url: '/games/thai/thai-punctuation-hub/cover.png'
  },
  {
    topic: 'ชนิดของคำ',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จากสื่อเกม "ตัดคำนามนินจา" คำว่า "คุณครู" และ "โรงเรียน" เป็นคำนามทั่วไปที่ไม่ชี้เฉพาะ จัดเป็นคำนามชนิดใด (ตอบ สามานยนาม หรือ วิสามานยนาม)?',
    answer: 'สามานยนาม',
    accepted: ['สามานยนาม', 'คำสามานยนาม', 'นามทั่วไป'],
    explanation: 'สามานยนาม คือ คำนามทั่วไปที่ใช้เรียกคน สัตว์ สิ่งของ สถานที่ โดยไม่ระบุชี้เฉพาะเจาะจง',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '48f34117-7739-4972-87d9-8223f27fbad7',
    media_title: '⚔️ ตัดคำนามนินจา (AR)',
    media_image_url: '/games/thai/word-ninja-noun/cover.png'
  },
  {
    topic: 'ชนิดของคำ',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'คำว่า "เดิน", "วิ่ง", "กระโดด", "หัวเราะ" แสดงอาการหรือการกระทำ จัดเป็นคำชนิดใดในภาษาไทย?',
    answer: 'คำกริยา',
    accepted: ['คำกริยา', 'กริยา'],
    explanation: 'คำกริยา คือ คำที่แสดงกิริยา อาการ หรือสภาพของคำนามและคำสรรพนาม',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '5c4eb300-2f8c-475d-bdfc-ba8014215e8f',
    media_title: '📚 ชนิดของคำ — นาม · กริยา · คุณศัพท์',
    media_image_url: '/games/thai/thai-word-types-cover.png'
  },
  {
    topic: 'คำราชาศัพท์',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จากสื่อ "คลังคำศัพท์ภาษาไทย หมวดคำราชาศัพท์" คำราชาศัพท์ที่หมายถึง "ดวงตา" คือคำว่าอะไร?',
    answer: 'พระเนตร',
    accepted: ['พระเนตร', 'เนตร'],
    explanation: 'พระเนตร หมายถึง ดวงตา, พระกรรณ หมายถึง หู, พระนาสิก หมายถึง จมูก',
    indicator_code: 'ท 4.1 ป.5/2',
    indicator_desc: 'จำแนกคำราชาศัพท์',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'คำราชาศัพท์',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'คำราชาศัพท์สำหรับพระมหากษัตริย์ที่หมายถึง "กิน" หรือ "รับประทานอาหาร" คือคำว่าอะไร?',
    answer: 'เสวย',
    accepted: ['เสวย', 'ทรงเสวย'],
    explanation: 'เสวย เป็นคำกริยาราชาศัพท์หมายถึง กิน หรือ ดื่ม',
    indicator_code: 'ท 4.1 ป.5/2',
    indicator_desc: 'จำแนกคำราชาศัพท์',
    media_item_id: '09148797-df6c-42fd-a5a5-653fe6067de8',
    media_title: '📚 คลังคำศัพท์ภาษาไทย ป.4-6 (Thai Vocab Hub)',
    media_image_url: '/games/thai/thai-vocab-hub/cover.png'
  },
  {
    topic: 'มาตราตัวสะกด',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จากสื่อ "🎣 มาตราตัวสะกด" คำว่า "ความสุข" มีพยัญชนะ ข เป็นตัวสะกด จัดอยู่ในมาตราตัวสะกดแม่ใด?',
    answer: 'แม่กก',
    accepted: ['แม่กก', 'กก', 'มาตรากก', 'มาตราแม่กก'],
    explanation: 'พยัญชนะ ก, ข, ค, ฆ เมื่อเป็นตัวสะกดจะออกเสียงเหมือน ก จัดอยู่ในมาตราแม่กก',
    indicator_code: 'ท 4.1 ป.4/1',
    indicator_desc: 'สะกดคำและบอกความหมายของคำในบริบทต่างๆ',
    media_item_id: '63ea18cb-3ac9-48b9-872e-becd2142d3a3',
    media_title: '🎣 มาตราตัวสะกด',
    media_image_url: '/games/thai/thai-matra-chart-cover.png'
  }
];
questions.push(...thD6);

// Verify Thai questions count
console.log('Thai questions generated:', questions.length);

// ==============================================================================
// 2. คณิตศาสตร์ (60 ข้อ)
// ==============================================================================
const mathStartIndex = questions.length;

// MA-D1: การหารสั้นและหารยาว (10 ข้อ)
const maD1 = [
  {
    topic: 'การหาร',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จากสื่อ "ใบงานการหารสั้น ป.4" จงหาผลลัพธ์ของ 3,648 ÷ 6 = ... (ตอบเป็นตัวเลข)',
    answer: '608',
    accepted: ['608', '๖๐๘'],
    explanation: '3,648 ÷ 6 = 608 ลงตัว (6 × 600 = 3600, 6 × 8 = 48)',
    indicator_code: 'ค 1.1 ป.4/7',
    indicator_desc: 'หาผลลัพธ์การคูณและการหารจำนวนนับ',
    media_item_id: '6da528c7-0c21-4074-899d-24ab386831ce',
    media_title: '📝 ใบงานการหารสั้น ป.4',
    media_image_url: '/games/math/short-division-thinking-media-cover.png'
  },
  {
    topic: 'การหาร',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จงหาผลหารของ 5,825 ÷ 5 = ... (ตอบเป็นตัวเลข)',
    answer: '1165',
    accepted: ['1165', '1,165', '๑,๑๖๕', '๑๑๖๕'],
    explanation: '5,825 ÷ 5 = 1,165',
    indicator_code: 'ค 1.1 ป.4/7',
    indicator_desc: 'หาผลลัพธ์การคูณและการหารจำนวนนับ',
    media_item_id: '056124f4-77a2-47d6-839d-abed64b72023',
    media_title: '📝 ใบงานการหารยาว ป.4–ป.6',
    media_image_url: '/games/math/long-division-thinking-media-cover.png'
  },
  {
    topic: 'การหาร',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จงหาผลหารของ 4,320 ÷ 9 = ... (ตอบเป็นตัวเลข)',
    answer: '480',
    accepted: ['480', '๔๘๐'],
    explanation: '4,320 ÷ 9 = 480',
    indicator_code: 'ค 1.1 ป.4/7',
    indicator_desc: 'หาผลลัพธ์การคูณและการหารจำนวนนับ',
    media_item_id: '6da528c7-0c21-4074-899d-24ab386831ce',
    media_title: '📝 ใบงานการหารสั้น ป.4',
    media_image_url: '/games/math/short-division-thinking-media-cover.png'
  },
  {
    topic: 'การหารมีเศษ',
    difficulty: 'medium',
    bloom_level: 'L3',
    text: 'จากสื่อ "ใบงานการหารยาว ป.4–ป.6" นำ 7,452 ÷ 8 จงหาว่าได้ "ผลหาร" เท่ากับเท่าใด? (ตอบเฉพาะตัวเลขผลหาร ไม่รวมเศษ)',
    answer: '931',
    accepted: ['931', '๙๓๑'],
    explanation: '7,452 ÷ 8 = 931 เศษ 4 (ผลหารคือ 931)',
    indicator_code: 'ค 1.1 ป.4/7',
    indicator_desc: 'หาผลลัพธ์การคูณและการหารจำนวนนับ',
    media_item_id: '056124f4-77a2-47d6-839d-abed64b72023',
    media_title: '📝 ใบงานการหารยาว ป.4–ป.6',
    media_image_url: '/games/math/long-division-thinking-media-cover.png'
  },
  {
    topic: 'การหารมีเศษ',
    difficulty: 'medium',
    bloom_level: 'L3',
    text: 'จากข้อที่แล้ว 7,452 ÷ 8 ได้ 931 เศษเท่าใด? (ตอบเฉพาะตัวเลขเศษที่เหลือ)',
    answer: '4',
    accepted: ['4', 'เศษ 4', '๔'],
    explanation: '7,452 = (8 × 931) + 4 ดังนั้นเหลือเศษ 4',
    indicator_code: 'ค 1.1 ป.4/7',
    indicator_desc: 'หาผลลัพธ์การคูณและการหารจำนวนนับ',
    media_item_id: '056124f4-77a2-47d6-839d-abed64b72023',
    media_title: '📝 ใบงานการหารยาว ป.4–ป.6',
    media_image_url: '/games/math/long-division-thinking-media-cover.png'
  },
  {
    topic: 'การหารด้วยสองหลัก',
    difficulty: 'medium',
    bloom_level: 'L3',
    text: 'จงหาผลหารของ 9,045 ÷ 15 = ... (ตอบเป็นตัวเลข)',
    answer: '603',
    accepted: ['603', '๖๐๓'],
    explanation: '9,045 ÷ 15 = 603 (15 × 600 = 9000, 15 × 3 = 45)',
    indicator_code: 'ค 1.1 ป.4/7',
    indicator_desc: 'หาผลลัพธ์การคูณและการหารจำนวนนับ',
    media_item_id: '056124f4-77a2-47d6-839d-abed64b72023',
    media_title: '📝 ใบงานการหารยาว ป.4–ป.6',
    media_image_url: '/games/math/long-division-thinking-media-cover.png'
  },
  {
    topic: 'หาตัวไม่ทราบค่าในการหาร',
    difficulty: 'medium',
    bloom_level: 'L3',
    text: 'ถ้าตัวเลขปริศนา □ ÷ 7 = 340 แล้วตัวเลขในช่อง □ คือจำนวนใด?',
    answer: '2380',
    accepted: ['2380', '2,380', '๒,๓๘๐', '๒๓๘๐'],
    explanation: '□ = 340 × 7 = 2,380',
    indicator_code: 'ค 1.1 ป.4/9',
    indicator_desc: 'หาค่าของตัวไม่ทราบค่าในประโยคสัญลักษณ์แสดงการคูณและการหาร',
    media_item_id: '6da528c7-0c21-4074-899d-24ab386831ce',
    media_title: '📝 ใบงานการหารสั้น ป.4',
    media_image_url: '/games/math/short-division-thinking-media-cover.png'
  },
  {
    topic: 'หาตัวไม่ทราบค่าในการหาร',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'ประโยคสัญลักษณ์ 2,800 ÷ □ = 400 ตัวเลขในช่อง □ มีค่าเท่ากับเท่าใด?',
    answer: '7',
    accepted: ['7', '๗'],
    explanation: '□ = 2,800 ÷ 400 = 7',
    indicator_code: 'ค 1.1 ป.4/9',
    indicator_desc: 'หาค่าของตัวไม่ทราบค่าในประโยคสัญลักษณ์แสดงการคูณและการหาร',
    media_item_id: '6da528c7-0c21-4074-899d-24ab386831ce',
    media_title: '📝 ใบงานการหารสั้น ป.4',
    media_image_url: '/games/math/short-division-thinking-media-cover.png'
  },
  {
    topic: 'การหารด้วยสองหลัก',
    difficulty: 'medium',
    bloom_level: 'L3',
    text: 'โรงเรียนต้องการจัดเก้าอี้ 4,550 ตัว ใส่ห้องประชุม 25 แถวเท่าๆ กัน จะได้แถวละกี่ตัว? (ตอบเป็นตัวเลข)',
    answer: '182',
    accepted: ['182', '182 ตัว', '๑๘๒'],
    explanation: '4,550 ÷ 25 = 182 ตัว',
    indicator_code: 'ค 1.1 ป.4/7',
    indicator_desc: 'หาผลลัพธ์การคูณและการหารจำนวนนับ',
    media_item_id: '056124f4-77a2-47d6-839d-abed64b72023',
    media_title: '📝 ใบงานการหารยาว ป.4–ป.6',
    media_image_url: '/games/math/long-division-thinking-media-cover.png'
  },
  {
    topic: 'การหารมีเศษ',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'นำลูกอม 1,500 เม็ด แบ่งใส่ถุง ถุงละ 8 เม็ด จะเหลือลูกอมที่ใส่ถุงไม่ครบกี่เม็ด? (ตอบเป็นตัวเลขเศษ)',
    answer: '4',
    accepted: ['4', '4 เม็ด', '๔', '๔ เม็ด'],
    explanation: '1,500 ÷ 8 = 187 เศษ 4 ดังนั้นเหลือลูกอม 4 เม็ด',
    indicator_code: 'ค 1.1 ป.4/7',
    indicator_desc: 'หาผลลัพธ์การคูณและการหารจำนวนนับ',
    media_item_id: '6da528c7-0c21-4074-899d-24ab386831ce',
    media_title: '📝 ใบงานการหารสั้น ป.4',
    media_image_url: '/games/math/short-division-thinking-media-cover.png'
  }
];
questions.push(...maD1);

// MA-D2: การคูณแนวตั้งและพหุคูณ (10 ข้อ)
const maD2 = [
  {
    topic: 'การคูณแนวตั้ง',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จากสื่อ "ใบงานการคูณแนวตั้ง ป.4–ป.6" จงหาผลลัพธ์ของ 45 × 25 = ... (ตอบเป็นตัวเลข)',
    answer: '1125',
    accepted: ['1125', '1,125', '๑,๑๒๕', '๑๑๒๕'],
    explanation: '45 × 25 = 1,125',
    indicator_code: 'ค 1.1 ป.4/7',
    indicator_desc: 'หาผลลัพธ์การคูณและการหารจำนวนนับ',
    media_item_id: 'd0c39aab-2da3-4970-93b7-2f36feeb72b5',
    media_title: '📝 ใบงานการคูณแนวตั้ง ป.4–ป.6',
    media_image_url: '/games/math/multiplication-thinking-media-cover.png'
  },
  {
    topic: 'การคูณแนวตั้ง',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จงหาผลคูณของ 128 × 8 = ... (ตอบเป็นตัวเลข)',
    answer: '1024',
    accepted: ['1024', '1,024', '๑,๐๒๔', '๑๐๒๔'],
    explanation: '128 × 8 = 1,024',
    indicator_code: 'ค 1.1 ป.4/7',
    indicator_desc: 'หาผลลัพธ์การคูณและการหารจำนวนนับ',
    media_item_id: 'd0c39aab-2da3-4970-93b7-2f36feeb72b5',
    media_title: '📝 ใบงานการคูณแนวตั้ง ป.4–ป.6',
    media_image_url: '/games/math/multiplication-thinking-media-cover.png'
  },
  {
    topic: 'การคูณพหุคูณสิบ',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จงหาผลคูณของ 350 × 40 = ... (ตอบเป็นตัวเลข)',
    answer: '14000',
    accepted: ['14000', '14,000', '๑๔,๐๐๐', '๑๔๐๐๐'],
    explanation: '35 × 4 = 140 แล้วเติม 0 สองตัว = 14,000',
    indicator_code: 'ค 1.1 ป.4/7',
    indicator_desc: 'หาผลลัพธ์การคูณและการหารจำนวนนับ',
    media_item_id: 'd0c39aab-2da3-4970-93b7-2f36feeb72b5',
    media_title: '📝 ใบงานการคูณแนวตั้ง ป.4–ป.6',
    media_image_url: '/games/math/multiplication-thinking-media-cover.png'
  },
  {
    topic: 'การคูณแนวตั้ง',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จงหาผลคูณของ 24 × 15 = ... (ตอบเป็นตัวเลข)',
    answer: '360',
    accepted: ['360', '๓๖๐'],
    explanation: '24 × 15 = 360',
    indicator_code: 'ค 1.1 ป.4/7',
    indicator_desc: 'หาผลลัพธ์การคูณและการหารจำนวนนับ',
    media_item_id: 'd0c39aab-2da3-4970-93b7-2f36feeb72b5',
    media_title: '📝 ใบงานการคูณแนวตั้ง ป.4–ป.6',
    media_image_url: '/games/math/multiplication-thinking-media-cover.png'
  },
  {
    topic: 'การคูณสามหลักกับสองหลัก',
    difficulty: 'medium',
    bloom_level: 'L3',
    text: 'จงหาผลคูณของ 205 × 18 = ... (ตอบเป็นตัวเลข)',
    answer: '3690',
    accepted: ['3690', '3,690', '๓,๖๙๐', '๓๖๙๐'],
    explanation: '205 × 18 = 3,690',
    indicator_code: 'ค 1.1 ป.4/7',
    indicator_desc: 'หาผลลัพธ์การคูณและการหารจำนวนนับ',
    media_item_id: 'd0c39aab-2da3-4970-93b7-2f36feeb72b5',
    media_title: '📝 ใบงานการคูณแนวตั้ง ป.4–ป.6',
    media_image_url: '/games/math/multiplication-thinking-media-cover.png'
  },
  {
    topic: 'การคูณพหุคูณร้อย',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จงหาผลคูณของ 630 × 100 = ... (ตอบเป็นตัวเลข)',
    answer: '63000',
    accepted: ['63000', '63,000', '๖๓,๐๐๐', '๖๓๐๐๐'],
    explanation: 'การคูณด้วย 100 เติมเลขศูนย์ท้ายสองตัว = 63,000',
    indicator_code: 'ค 1.1 ป.4/7',
    indicator_desc: 'หาผลลัพธ์การคูณและการหารจำนวนนับ',
    media_item_id: 'd0c39aab-2da3-4970-93b7-2f36feeb72b5',
    media_title: '📝 ใบงานการคูณแนวตั้ง ป.4–ป.6',
    media_image_url: '/games/math/multiplication-thinking-media-cover.png'
  },
  {
    topic: 'หาตัวไม่ทราบค่าในการคูณ',
    difficulty: 'medium',
    bloom_level: 'L3',
    text: 'ประโยคสัญลักษณ์ 75 × □ = 1,500 ตัวเลขในช่อง □ มีค่าเท่ากับเท่าใด?',
    answer: '20',
    accepted: ['20', '๒๐'],
    explanation: '□ = 1,500 ÷ 75 = 20',
    indicator_code: 'ค 1.1 ป.4/9',
    indicator_desc: 'หาค่าของตัวไม่ทราบค่าในประโยคสัญลักษณ์แสดงการคูณและการหาร',
    media_item_id: 'd0c39aab-2da3-4970-93b7-2f36feeb72b5',
    media_title: '📝 ใบงานการคูณแนวตั้ง ป.4–ป.6',
    media_image_url: '/games/math/multiplication-thinking-media-cover.png'
  },
  {
    topic: 'การคูณสามหลักกับสองหลัก',
    difficulty: 'medium',
    bloom_level: 'L3',
    text: 'จงหาผลคูณของ 312 × 14 = ... (ตอบเป็นตัวเลข)',
    answer: '4368',
    accepted: ['4368', '4,368', '๔,๓๖๘', '๔๓๖๘'],
    explanation: '312 × 14 = 4,368',
    indicator_code: 'ค 1.1 ป.4/7',
    indicator_desc: 'หาผลลัพธ์การคูณและการหารจำนวนนับ',
    media_item_id: 'd0c39aab-2da3-4970-93b7-2f36feeb72b5',
    media_title: '📝 ใบงานการคูณแนวตั้ง ป.4–ป.6',
    media_image_url: '/games/math/multiplication-thinking-media-cover.png'
  },
  {
    topic: 'โจทย์ปัญหาการคูณ',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'คุณครูซื้อสมุดบันทึกความดี 35 เล่ม ราคาเล่มละ 12 บาท คุณครูต้องจ่ายเงินทั้งหมดกี่บาท? (ตอบเป็นตัวเลข)',
    answer: '420',
    accepted: ['420', '420 บาท', '๔๒๐', '๔๒๐ บาท'],
    explanation: '35 × 12 = 420 บาท',
    indicator_code: 'ค 1.1 ป.4/11',
    indicator_desc: 'แสดงวิธีหาคำตอบของโจทย์ปัญหา',
    media_item_id: 'd0c39aab-2da3-4970-93b7-2f36feeb72b5',
    media_title: '📝 ใบงานการคูณแนวตั้ง ป.4–ป.6',
    media_image_url: '/games/math/multiplication-thinking-media-cover.png'
  },
  {
    topic: 'การคูณพหุคูณ',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จงหาผลคูณของ 500 × 60 = ... (ตอบเป็นตัวเลข)',
    answer: '30000',
    accepted: ['30000', '30,000', '๓๐,๐๐๐', '๓๐๐๐๐'],
    explanation: '5 × 6 = 30 แล้วเติม 0 สามตัว = 30,000',
    indicator_code: 'ค 1.1 ป.4/7',
    indicator_desc: 'หาผลลัพธ์การคูณและการหารจำนวนนับ',
    media_item_id: 'd0c39aab-2da3-4970-93b7-2f36feeb72b5',
    media_title: '📝 ใบงานการคูณแนวตั้ง ป.4–ป.6',
    media_image_url: '/games/math/multiplication-thinking-media-cover.png'
  }
];
questions.push(...maD2);

// MA-D3: ค่าประมาณใกล้เคียง (10 ข้อ)
const maD3 = [
  {
    topic: 'ค่าประมาณ',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จากสื่อ "สื่อการสอนค่าประมาณ เต็มสิบ/ร้อย/พัน" ค่าประมาณใกล้เคียงจำนวนเต็มสิบของ 584 คือจำนวนใด?',
    answer: '580',
    accepted: ['580', '๕๘๐'],
    explanation: 'หลักหน่วยคือ 4 ซึ่งน้อยกว่า 5 จึงปัดลง ได้ 580',
    indicator_code: 'ค 1.1 ป.4/2',
    indicator_desc: 'เปรียบเทียบและเรียงลำดับจำนวนนับที่มากกว่า ๑๐๐,๐๐๐ จากสถานการณ์ต่างๆ',
    media_item_id: '20532b23-b5a1-4754-bff8-24eaa216bc42',
    media_title: '📐 สื่อการสอนค่าประมาณ เต็มสิบ/ร้อย/พัน',
    media_image_url: '/games/math/rounding-cover.png'
  },
  {
    topic: 'ค่าประมาณ',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'ค่าประมาณใกล้เคียงจำนวนเต็มสิบของ 1,267 คือจำนวนใด?',
    answer: '1270',
    accepted: ['1270', '1,270', '๑,๒๗๐', '๑๒๗๐'],
    explanation: 'หลักหน่วยคือ 7 ซึ่งมากกว่าหรือเท่ากับ 5 จึงปัดขึ้น ได้ 1,270',
    indicator_code: 'ค 1.1 ป.4/2',
    indicator_desc: 'เปรียบเทียบและเรียงลำดับจำนวนนับที่มากกว่า ๑๐๐,๐๐๐ จากสถานการณ์ต่างๆ',
    media_item_id: '20532b23-b5a1-4754-bff8-24eaa216bc42',
    media_title: '📐 สื่อการสอนค่าประมาณ เต็มสิบ/ร้อย/พัน',
    media_image_url: '/games/math/rounding-cover.png'
  },
  {
    topic: 'ค่าประมาณ',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'ค่าประมาณใกล้เคียงจำนวนเต็มร้อยของ 4,782 คือจำนวนใด?',
    answer: '4800',
    accepted: ['4800', '4,800', '๔,๘๐๐', '๔๘๐๐'],
    explanation: 'พิจารณาหลักสิบคือ 8 ซึ่งมากกว่าหรือเท่ากับ 5 จึงปัดขึ้น ได้ 4,800',
    indicator_code: 'ค 1.1 ป.4/2',
    indicator_desc: 'เปรียบเทียบและเรียงลำดับจำนวนนับที่มากกว่า ๑๐๐,๐๐๐ จากสถานการณ์ต่างๆ',
    media_item_id: '20532b23-b5a1-4754-bff8-24eaa216bc42',
    media_title: '📐 สื่อการสอนค่าประมาณ เต็มสิบ/ร้อย/พัน',
    media_image_url: '/games/math/rounding-cover.png'
  },
  {
    topic: 'ค่าประมาณ',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'ค่าประมาณใกล้เคียงจำนวนเต็มร้อยของ 8,235 คือจำนวนใด?',
    answer: '8200',
    accepted: ['8200', '8,200', '๘,๒๐๐', '๘๒๐๐'],
    explanation: 'หลักสิบคือ 3 ซึ่งน้อยกว่า 5 จึงปัดลง ได้ 8,200',
    indicator_code: 'ค 1.1 ป.4/2',
    indicator_desc: 'เปรียบเทียบและเรียงลำดับจำนวนนับที่มากกว่า ๑๐๐,๐๐๐ จากสถานการณ์ต่างๆ',
    media_item_id: '20532b23-b5a1-4754-bff8-24eaa216bc42',
    media_title: '📐 สื่อการสอนค่าประมาณ เต็มสิบ/ร้อย/พัน',
    media_image_url: '/games/math/rounding-cover.png'
  },
  {
    topic: 'ค่าประมาณ',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'ค่าประมาณใกล้เคียงจำนวนเต็มพันของ 6,499 คือจำนวนใด?',
    answer: '6000',
    accepted: ['6000', '6,000', '๖,๐๐๐', '๖๐๐๐'],
    explanation: 'หลักร้อยคือ 4 ซึ่งน้อยกว่า 5 จึงปัดลง ได้ 6,000',
    indicator_code: 'ค 1.1 ป.4/2',
    indicator_desc: 'เปรียบเทียบและเรียงลำดับจำนวนนับที่มากกว่า ๑๐๐,๐๐๐ จากสถานการณ์ต่างๆ',
    media_item_id: '20532b23-b5a1-4754-bff8-24eaa216bc42',
    media_title: '📐 สื่อการสอนค่าประมาณ เต็มสิบ/ร้อย/พัน',
    media_image_url: '/games/math/rounding-cover.png'
  },
  {
    topic: 'ค่าประมาณ',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'ค่าประมาณใกล้เคียงจำนวนเต็มพันของ 15,820 คือจำนวนใด?',
    answer: '16000',
    accepted: ['16000', '16,000', '๑๖,๐๐๐', '๑๖๐๐๐'],
    explanation: 'หลักร้อยคือ 8 ซึ่งมากกว่าหรือเท่ากับ 5 จึงปัดขึ้น ได้ 16,000',
    indicator_code: 'ค 1.1 ป.4/2',
    indicator_desc: 'เปรียบเทียบและเรียงลำดับจำนวนนับที่มากกว่า ๑๐๐,๐๐๐ จากสถานการณ์ต่างๆ',
    media_item_id: '20532b23-b5a1-4754-bff8-24eaa216bc42',
    media_title: '📐 สื่อการสอนค่าประมาณ เต็มสิบ/ร้อย/พัน',
    media_image_url: '/games/math/rounding-cover.png'
  },
  {
    topic: 'ค่าประมาณ',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'ค่าประมาณใกล้เคียงจำนวนเต็มหมื่นของ 47,300 คือจำนวนใด?',
    answer: '50000',
    accepted: ['50000', '50,000', '๕๐,๐๐๐', '๕๐๐๐๐'],
    explanation: 'หลักพันคือ 7 ซึ่งมากกว่าหรือเท่ากับ 5 จึงปัดขึ้น ได้ 50,000',
    indicator_code: 'ค 1.1 ป.4/2',
    indicator_desc: 'เปรียบเทียบและเรียงลำดับจำนวนนับที่มากกว่า ๑๐๐,๐๐๐ จากสถานการณ์ต่างๆ',
    media_item_id: '20532b23-b5a1-4754-bff8-24eaa216bc42',
    media_title: '📐 สื่อการสอนค่าประมาณ เต็มสิบ/ร้อย/พัน',
    media_image_url: '/games/math/rounding-cover.png'
  },
  {
    topic: 'ค่าประมาณ',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'ค่าประมาณใกล้เคียงจำนวนเต็มหมื่นของ 82,900 คือจำนวนใด?',
    answer: '80000',
    accepted: ['80000', '80,000', '๘๐,๐๐๐', '๘๐๐๐๐'],
    explanation: 'หลักพันคือ 2 ซึ่งน้อยกว่า 5 จึงปัดลง ได้ 80,000',
    indicator_code: 'ค 1.1 ป.4/2',
    indicator_desc: 'เปรียบเทียบและเรียงลำดับจำนวนนับที่มากกว่า ๑๐๐,๐๐๐ จากสถานการณ์ต่างๆ',
    media_item_id: '20532b23-b5a1-4754-bff8-24eaa216bc42',
    media_title: '📐 สื่อการสอนค่าประมาณ เต็มสิบ/ร้อย/พัน',
    media_image_url: '/games/math/rounding-cover.png'
  },
  {
    topic: 'ค่าประมาณประยุกต์',
    difficulty: 'medium',
    bloom_level: 'L3',
    text: 'โรงเรียนมีนักเรียนชาย 348 คน และนักเรียนหญิง 521 คน ถ้าประมาณการจำนวนนักเรียนทั้งหมดเป็น "จำนวนเต็มร้อย" จะได้ประมาณกี่คน?',
    answer: '900',
    accepted: ['900', '900 คน', '๙๐๐', '๙๐๐ คน'],
    explanation: 'ผลบวกจริง = 348 + 521 = 869 ประมาณเป็นจำนวนเต็มร้อย (หลักสิบคือ 6 ปัดขึ้น) ได้ 900 คน',
    indicator_code: 'ค 1.1 ป.4/2',
    indicator_desc: 'เปรียบเทียบและเรียงลำดับจำนวนนับที่มากกว่า ๑๐๐,๐๐๐ จากสถานการณ์ต่างๆ',
    media_item_id: '20532b23-b5a1-4754-bff8-24eaa216bc42',
    media_title: '📐 สื่อการสอนค่าประมาณ เต็มสิบ/ร้อย/พัน',
    media_image_url: '/games/math/rounding-cover.png'
  },
  {
    topic: 'ค่าประมาณ',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'ค่าประมาณใกล้เคียงจำนวนเต็มร้อยของ 950 คือจำนวนใด?',
    answer: '1000',
    accepted: ['1000', '1,000', '๑,๐๐๐', '๑๐๐๐'],
    explanation: 'หลักสิบคือ 5 ซึ่งมากกว่าหรือเท่ากับ 5 จึงปัดขึ้น ได้ 1,000',
    indicator_code: 'ค 1.1 ป.4/2',
    indicator_desc: 'เปรียบเทียบและเรียงลำดับจำนวนนับที่มากกว่า ๑๐๐,๐๐๐ จากสถานการณ์ต่างๆ',
    media_item_id: '20532b23-b5a1-4754-bff8-24eaa216bc42',
    media_title: '📐 สื่อการสอนค่าประมาณ เต็มสิบ/ร้อย/พัน',
    media_image_url: '/games/math/rounding-cover.png'
  }
];
questions.push(...maD3);

// MA-D4: เศษเกินและจำนวนคละ (10 ข้อ)
const maD4 = [
  {
    topic: 'เศษเกินและจำนวนคละ',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'จากสื่อ "ผจญภัยเศษส่วน ป.4" จงเขียนเศษเกิน 11/4 ให้อยู่ในรูปจำนวนคละ (เขียนในรูป เช่น 2 3/4 หรือ 2 เศษ 3 ส่วน 4)',
    answer: '2 3/4',
    accepted: ['2 3/4', '2 เศษ 3 ส่วน 4', '๒ ๓/๔', '2เศษ3ส่วน4', '๒ เศษ ๓ ส่วน ๔'],
    explanation: '11 ÷ 4 ได้ 2 เศษ 3 ดังนั้นเขียนเป็นจำนวนคละได้ 2 3/4',
    indicator_code: 'ค 1.1 ป.4/3',
    indicator_desc: 'บอก อ่าน และเขียนเศษส่วน จำนวนคละแสดงปริมาณสิ่งต่างๆ',
    media_item_id: '861da52c-00be-4f20-b36e-78b18cf15ecf',
    media_title: '🍕 ผจญภัยเศษส่วน ป.4 — Fraction Adventure',
    media_image_url: '/games/math/fraction-adventure-cover.png'
  },
  {
    topic: 'เศษเกินและจำนวนคละ',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'จงเขียนเศษเกิน 17/5 ให้อยู่ในรูปจำนวนคละ (เขียนในรูป เช่น 3 2/5)',
    answer: '3 2/5',
    accepted: ['3 2/5', '3 เศษ 2 ส่วน 5', '๓ ๒/๕', '3เศษ2ส่วน5', '๓ เศษ ๒ ส่วน ๕'],
    explanation: '17 ÷ 5 ได้ 3 เศษ 2 ดังนั้นได้ 3 2/5',
    indicator_code: 'ค 1.1 ป.4/3',
    indicator_desc: 'บอก อ่าน และเขียนเศษส่วน จำนวนคละแสดงปริมาณสิ่งต่างๆ',
    media_item_id: '861da52c-00be-4f20-b36e-78b18cf15ecf',
    media_title: '🍕 ผจญภัยเศษส่วน ป.4 — Fraction Adventure',
    media_image_url: '/games/math/fraction-adventure-cover.png'
  },
  {
    topic: 'เศษเกินและจำนวนคละ',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'จงเขียนเศษเกิน 19/3 ให้อยู่ในรูปจำนวนคละ (เขียนในรูป เช่น 6 1/3)',
    answer: '6 1/3',
    accepted: ['6 1/3', '6 เศษ 1 ส่วน 3', '๖ ๑/๓', '6เศษ1ส่วน3', '๖ เศษ ๑ ส่วน ๓'],
    explanation: '19 ÷ 3 ได้ 6 เศษ 1 ดังนั้นได้ 6 1/3',
    indicator_code: 'ค 1.1 ป.4/3',
    indicator_desc: 'บอก อ่าน และเขียนเศษส่วน จำนวนคละแสดงปริมาณสิ่งต่างๆ',
    media_item_id: '861da52c-00be-4f20-b36e-78b18cf15ecf',
    media_title: '🍕 ผจญภัยเศษส่วน ป.4 — Fraction Adventure',
    media_image_url: '/games/math/fraction-adventure-cover.png'
  },
  {
    topic: 'เศษเกินและจำนวนคละ',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'จงเขียนเศษเกิน 23/7 ให้อยู่ในรูปจำนวนคละ (เขียนในรูป เช่น 3 2/7)',
    answer: '3 2/7',
    accepted: ['3 2/7', '3 เศษ 2 ส่วน 7', '๓ ๒/๗', '3เศษ2ส่วน7', '๓ เศษ ๒ ส่วน ๗'],
    explanation: '23 ÷ 7 ได้ 3 เศษ 2 ได้ 3 2/7',
    indicator_code: 'ค 1.1 ป.4/3',
    indicator_desc: 'บอก อ่าน และเขียนเศษส่วน จำนวนคละแสดงปริมาณสิ่งต่างๆ',
    media_item_id: '861da52c-00be-4f20-b36e-78b18cf15ecf',
    media_title: '🍕 ผจญภัยเศษส่วน ป.4 — Fraction Adventure',
    media_image_url: '/games/math/fraction-adventure-cover.png'
  },
  {
    topic: 'แปลงจำนวนคละเป็นเศษเกิน',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'จงเขียนจำนวนคละ 2 1/3 ให้อยู่ในรูปเศษเกิน (เขียนในรูป เช่น 7/3 หรือ เศษ 7 ส่วน 3)',
    answer: '7/3',
    accepted: ['7/3', 'เศษ 7 ส่วน 3', '๗/๓', 'เศษ7ส่วน3', 'เศษ ๗ ส่วน ๓'],
    explanation: '(2 × 3) + 1 = 7 ได้ 7/3',
    indicator_code: 'ค 1.1 ป.4/3',
    indicator_desc: 'บอก อ่าน และเขียนเศษส่วน จำนวนคละแสดงปริมาณสิ่งต่างๆ',
    media_item_id: '5e1c246c-36f8-4904-ab3f-5c1236ff2e84',
    media_title: '🍕 สื่อการสอนเศษส่วน — แท่งเศษส่วน & บวกลบ ป.4',
    media_image_url: '/games/math/math-fraction-hub/cover-bars.png'
  },
  {
    topic: 'แปลงจำนวนคละเป็นเศษเกิน',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'จงเขียนจำนวนคละ 4 3/5 ให้อยู่ในรูปเศษเกิน (เขียนในรูป เช่น 23/5)',
    answer: '23/5',
    accepted: ['23/5', 'เศษ 23 ส่วน 5', '๒๓/๕', 'เศษ23ส่วน5', 'เศษ ๒๓ ส่วน ๕'],
    explanation: '(4 × 5) + 3 = 23 ได้ 23/5',
    indicator_code: 'ค 1.1 ป.4/3',
    indicator_desc: 'บอก อ่าน และเขียนเศษส่วน จำนวนคละแสดงปริมาณสิ่งต่างๆ',
    media_item_id: '5e1c246c-36f8-4904-ab3f-5c1236ff2e84',
    media_title: '🍕 สื่อการสอนเศษส่วน — แท่งเศษส่วน & บวกลบ ป.4',
    media_image_url: '/games/math/math-fraction-hub/cover-bars.png'
  },
  {
    topic: 'แปลงจำนวนคละเป็นเศษเกิน',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จงเขียนจำนวนคละ 5 1/2 ให้อยู่ในรูปเศษเกิน (เขียนในรูป เช่น 11/2)',
    answer: '11/2',
    accepted: ['11/2', 'เศษ 11 ส่วน 2', '๑๑/๒', 'เศษ11ส่วน2', 'เศษ ๑๑ ส่วน ๒'],
    explanation: '(5 × 2) + 1 = 11 ได้ 11/2',
    indicator_code: 'ค 1.1 ป.4/3',
    indicator_desc: 'บอก อ่าน และเขียนเศษส่วน จำนวนคละแสดงปริมาณสิ่งต่างๆ',
    media_item_id: '5e1c246c-36f8-4904-ab3f-5c1236ff2e84',
    media_title: '🍕 สื่อการสอนเศษส่วน — แท่งเศษส่วน & บวกลบ ป.4',
    media_image_url: '/games/math/math-fraction-hub/cover-bars.png'
  },
  {
    topic: 'เศษส่วนที่เท่ากัน',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'เศษส่วนที่เท่ากัน 3/4 = □/12 ตัวเลขในช่อง □ คือจำนวนใด?',
    answer: '9',
    accepted: ['9', '๙'],
    explanation: 'ตัวส่วน 4 คูณ 3 ได้ 12 ดังนั้นตัวเศษ 3 ต้องคูณ 3 ได้ 9',
    indicator_code: 'ค 1.1 ป.4/4',
    indicator_desc: 'เปรียบเทียบและเรียงลำดับเศษส่วนและจำนวนคละ',
    media_item_id: '5e1c246c-36f8-4904-ab3f-5c1236ff2e84',
    media_title: '🍕 สื่อการสอนเศษส่วน — แท่งเศษส่วน & บวกลบ ป.4',
    media_image_url: '/games/math/math-fraction-hub/cover-bars.png'
  },
  {
    topic: 'การบวกเศษส่วน',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จงหาผลบวกของ 2/7 + 3/7 = ... (ตอบในรูปเศษส่วน เช่น 5/7)',
    answer: '5/7',
    accepted: ['5/7', 'เศษ 5 ส่วน 7', '๕/๗', 'เศษ5ส่วน7', 'เศษ ๕ ส่วน ๗'],
    explanation: 'ตัวส่วนเท่ากัน นำตัวเศษบวกกัน 2 + 3 = 5 ได้ 5/7',
    indicator_code: 'ค 1.1 ป.4/13',
    indicator_desc: 'หาผลบวก ผลลบของเศษส่วนและจำนวนคละที่ตัวส่วนตัวหนึ่งเป็นพหุคูณของอีกตัวหนึ่ง',
    media_item_id: '5e1c246c-36f8-4904-ab3f-5c1236ff2e84',
    media_title: '🍕 สื่อการสอนเศษส่วน — แท่งเศษส่วน & บวกลบ ป.4',
    media_image_url: '/games/math/math-fraction-hub/cover-bars.png'
  },
  {
    topic: 'การลบเศษส่วน',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จงหาผลลบของ 8/9 - 5/9 = ... (ตอบในรูปเศษส่วน เช่น 3/9 หรือ 1/3)',
    answer: '3/9',
    accepted: ['3/9', '1/3', 'เศษ 3 ส่วน 9', 'เศษ 1 ส่วน 3', '๓/๙', '๑/๓', 'เศษ3ส่วน9', 'เศษ1ส่วน3'],
    explanation: '8 - 5 = 3 ได้ 3/9 (หรือทอนเป็นเศษส่วนอย่างต่ำ 1/3)',
    indicator_code: 'ค 1.1 ป.4/13',
    indicator_desc: 'หาผลบวก ผลลบของเศษส่วนและจำนวนคละที่ตัวส่วนตัวหนึ่งเป็นพหุคูณของอีกตัวหนึ่ง',
    media_item_id: '5e1c246c-36f8-4904-ab3f-5c1236ff2e84',
    media_title: '🍕 สื่อการสอนเศษส่วน — แท่งเศษส่วน & บวกลบ ป.4',
    media_image_url: '/games/math/math-fraction-hub/cover-bars.png'
  }
];
questions.push(...maD4);

// MA-D5: ทศนิยมและแบบรูปตัวเลข (10 ข้อ)
const maD5 = [
  {
    topic: 'การบวกทศนิยม',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จงหาผลบวกของ 14.25 + 8.70 = ... (ตอบเป็นทศนิยม)',
    answer: '22.95',
    accepted: ['22.95', '22.950', '๒๒.๙๕'],
    explanation: '14.25 + 8.70 = 22.95',
    indicator_code: 'ค 1.1 ป.4/15',
    indicator_desc: 'หาผลบวก ผลลบของทศนิยมไม่เกิน ๓ ตำแหน่ง',
    media_item_id: '20532b23-b5a1-4754-bff8-24eaa216bc42',
    media_title: '📐 สื่อการสอนค่าประมาณ เต็มสิบ/ร้อย/พัน',
    media_image_url: '/games/math/rounding-cover.png'
  },
  {
    topic: 'การลบทศนิยม',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จงหาผลลบของ 35.6 - 12.4 = ... (ตอบเป็นทศนิยม)',
    answer: '23.2',
    accepted: ['23.2', '23.20', '๒๓.๒'],
    explanation: '35.6 - 12.4 = 23.2',
    indicator_code: 'ค 1.1 ป.4/15',
    indicator_desc: 'หาผลบวก ผลลบของทศนิยมไม่เกิน ๓ ตำแหน่ง',
    media_item_id: '20532b23-b5a1-4754-bff8-24eaa216bc42',
    media_title: '📐 สื่อการสอนค่าประมาณ เต็มสิบ/ร้อย/พัน',
    media_image_url: '/games/math/rounding-cover.png'
  },
  {
    topic: 'การลบทศนิยม',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'จงหาผลลัพธ์ของ 50.00 - 18.75 = ... (ตอบเป็นทศนิยม)',
    answer: '31.25',
    accepted: ['31.25', '๒๑.๒๕', '๓๑.๒๕'],
    explanation: '50.00 - 18.75 = 31.25',
    indicator_code: 'ค 1.1 ป.4/15',
    indicator_desc: 'หาผลบวก ผลลบของทศนิยมไม่เกิน ๓ ตำแหน่ง',
    media_item_id: '20532b23-b5a1-4754-bff8-24eaa216bc42',
    media_title: '📐 สื่อการสอนค่าประมาณ เต็มสิบ/ร้อย/พัน',
    media_image_url: '/games/math/rounding-cover.png'
  },
  {
    topic: 'เขียนเศษส่วนในรูปทศนิยม',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จงเขียนเศษส่วน 7/10 ให้อยู่ในรูปทศนิยม 1 ตำแหน่ง',
    answer: '0.7',
    accepted: ['0.7', '.7', '๐.๗'],
    explanation: '7/10 = 0.7',
    indicator_code: 'ค 1.1 ป.4/5',
    indicator_desc: 'บอก อ่าน และเขียนทศนิยมไม่เกิน ๓ ตำแหน่งแสดงปริมาณสิ่งต่างๆ',
    media_item_id: '20532b23-b5a1-4754-bff8-24eaa216bc42',
    media_title: '📐 สื่อการสอนค่าประมาณ เต็มสิบ/ร้อย/พัน',
    media_image_url: '/games/math/rounding-cover.png'
  },
  {
    topic: 'เขียนเศษส่วนในรูปทศนิยม',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'จงเขียนเศษส่วน 45/100 ให้อยู่ในรูปทศนิยม 2 ตำแหน่ง',
    answer: '0.45',
    accepted: ['0.45', '.45', '๐.๔๕'],
    explanation: '45/100 = 0.45',
    indicator_code: 'ค 1.1 ป.4/5',
    indicator_desc: 'บอก อ่าน และเขียนทศนิยมไม่เกิน ๓ ตำแหน่งแสดงปริมาณสิ่งต่างๆ',
    media_item_id: '20532b23-b5a1-4754-bff8-24eaa216bc42',
    media_title: '📐 สื่อการสอนค่าประมาณ เต็มสิบ/ร้อย/พัน',
    media_image_url: '/games/math/rounding-cover.png'
  },
  {
    topic: 'ค่าประจำหลักทศนิยม',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'จากจำนวน 38.52 ตัวเลข 5 อยู่ในหลักใด? (ตอบ: หลักส่วนสิบ หรือ หลักส่วนร้อย)',
    answer: 'หลักส่วนสิบ',
    accepted: ['หลักส่วนสิบ', 'ส่วนสิบ'],
    explanation: 'ตัวเลขหลังจุดทศนิยมตำแหน่งแรก คือ หลักส่วนสิบ มีค่า 0.5',
    indicator_code: 'ค 1.1 ป.4/5',
    indicator_desc: 'บอก อ่าน และเขียนทศนิยมไม่เกิน ๓ ตำแหน่งแสดงปริมาณสิ่งต่างๆ',
    media_item_id: '20532b23-b5a1-4754-bff8-24eaa216bc42',
    media_title: '📐 สื่อการสอนค่าประมาณ เต็มสิบ/ร้อย/พัน',
    media_image_url: '/games/math/rounding-cover.png'
  },
  {
    topic: 'แบบรูปตัวเลข',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จากแบบรูป 12, 19, 26, 33, ... ตัวเลขถัดไปคือจำนวนใด?',
    answer: '40',
    accepted: ['40', '๔๐'],
    explanation: 'แบบรูปเพิ่มขึ้นทีละ 7 (33 + 7 = 40)',
    indicator_code: 'ค 1.2 ป.4/1',
    indicator_desc: 'ระบุจำนวนที่หายไปในแบบรูปของจำนวนที่เพิ่มขึ้นหรือลดลงทีละเท่าๆ กัน',
    media_item_id: '53ba9064-f679-46cb-8212-ce964fbf2e82',
    media_title: '✖️ สูตรคูณตาไว (Multiply Burst)',
    media_image_url: '/games/math/multiply-burst/cover.png?v=4'
  },
  {
    topic: 'แบบรูปตัวเลข',
    difficulty: 'medium',
    bloom_level: 'L3',
    text: 'จากแบบรูป 3, 9, 27, 81, ... ตัวเลขถัดไปคือจำนวนใด?',
    answer: '243',
    accepted: ['243', '๒๔๓'],
    explanation: 'แบบรูปคูณเพิ่มขึ้นทีละ 3 เท่า (81 × 3 = 243)',
    indicator_code: 'ค 1.2 ป.4/1',
    indicator_desc: 'ระบุจำนวนที่หายไปในแบบรูปของจำนวนที่เพิ่มขึ้นหรือลดลงทีละเท่าๆ กัน',
    media_item_id: '53ba9064-f679-46cb-8212-ce964fbf2e82',
    media_title: '✖️ สูตรคูณตาไว (Multiply Burst)',
    media_image_url: '/games/math/multiply-burst/cover.png?v=4'
  },
  {
    topic: 'แบบรูปตัวเลข',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จากแบบรูป 100, 85, 70, 55, ... ตัวเลขถัดไปคือจำนวนใด?',
    answer: '40',
    accepted: ['40', '๔๐'],
    explanation: 'แบบรูปลดลงทีละ 15 (55 - 15 = 40)',
    indicator_code: 'ค 1.2 ป.4/1',
    indicator_desc: 'ระบุจำนวนที่หายไปในแบบรูปของจำนวนที่เพิ่มขึ้นหรือลดลงทีละเท่าๆ กัน',
    media_item_id: '53ba9064-f679-46cb-8212-ce964fbf2e82',
    media_title: '✖️ สูตรคูณตาไว (Multiply Burst)',
    media_image_url: '/games/math/multiply-burst/cover.png?v=4'
  },
  {
    topic: 'การบวกทศนิยม',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จงหาผลลัพธ์ของ 3.8 + 4.5 = ... (ตอบเป็นทศนิยม)',
    answer: '8.3',
    accepted: ['8.3', '8.30', '๘.๓'],
    explanation: '3.8 + 4.5 = 8.3',
    indicator_code: 'ค 1.1 ป.4/15',
    indicator_desc: 'หาผลบวก ผลลบของทศนิยมไม่เกิน ๓ ตำแหน่ง',
    media_item_id: '20532b23-b5a1-4754-bff8-24eaa216bc42',
    media_title: '📐 สื่อการสอนค่าประมาณ เต็มสิบ/ร้อย/พัน',
    media_image_url: '/games/math/rounding-cover.png'
  }
];
questions.push(...maD5);

// MA-D6: เรขาคณิต พื้นที่ และโจทย์ปัญหา (10 ข้อ)
const maD6 = [
  {
    topic: 'พื้นที่สี่เหลี่ยม',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'จากสื่อ "พื้นที่สี่เหลี่ยมมุมฉาก" แปลงผักรูปสี่เหลี่ยมผืนผ้า กว้าง 6 เมตร ยาว 9 เมตร มีพื้นที่กี่ตารางเมตร? (ตอบเป็นตัวเลข)',
    answer: '54',
    accepted: ['54', '54 ตารางเมตร', '54 ตร.ม.', '๕๔', '๕๔ ตารางเมตร'],
    explanation: 'พื้นที่สี่เหลี่ยมผืนผ้า = กว้าง × ยาว = 6 × 9 = 54 ตารางเมตร',
    indicator_code: 'ค 2.1 ป.4/3',
    indicator_desc: 'หาพื้นที่ของรูปสี่เหลี่ยมมุมฉาก',
    media_item_id: 'ea84c27b-dd37-4a79-bb86-8590dc2e7bb2',
    media_title: '📐 พื้นที่สี่เหลี่ยมมุมฉาก',
    media_image_url: '/games/math/rect-area-media-cover.png'
  },
  {
    topic: 'พื้นที่สี่เหลี่ยม',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'กระดานไวท์บอร์ดรูปสี่เหลี่ยมจัตุรัส มีความยาวด้านละ 8 เซนติเมตร จะมีพื้นที่กี่ตารางเซนติเมตร? (ตอบเป็นตัวเลข)',
    answer: '64',
    accepted: ['64', '64 ตารางเซนติเมตร', '64 ตร.ซม.', '๖๔'],
    explanation: 'พื้นที่สี่เหลี่ยมจัตุรัส = ด้าน × ด้าน = 8 × 8 = 64 ตารางเซนติเมตร',
    indicator_code: 'ค 2.1 ป.4/3',
    indicator_desc: 'หาพื้นที่ของรูปสี่เหลี่ยมมุมฉาก',
    media_item_id: 'ea84c27b-dd37-4a79-bb86-8590dc2e7bb2',
    media_title: '📐 พื้นที่สี่เหลี่ยมมุมฉาก',
    media_image_url: '/games/math/rect-area-media-cover.png'
  },
  {
    topic: 'ความยาวรอบรูป',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'สนามหญ้ารูปสี่เหลี่ยมผืนผ้า กว้าง 5 เมตร ยาว 12 เมตร มีความยาวรอบรูปกี่เมตร? (ตอบเป็นตัวเลข)',
    answer: '34',
    accepted: ['34', '34 เมตร', '๓๔', '๓๔ เมตร'],
    explanation: 'ความยาวรอบรูป = (กว้าง + ยาว) × 2 = (5 + 12) × 2 = 17 × 2 = 34 เมตร',
    indicator_code: 'ค 2.1 ป.4/3',
    indicator_desc: 'หาพื้นที่ของรูปสี่เหลี่ยมมุมฉาก',
    media_item_id: 'ea84c27b-dd37-4a79-bb86-8590dc2e7bb2',
    media_title: '📐 พื้นที่สี่เหลี่ยมมุมฉาก',
    media_image_url: '/games/math/rect-area-media-cover.png'
  },
  {
    topic: 'มุมและองศา',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'มุมฉากมีขนาดกี่องศา? (ตอบเฉพาะตัวเลข)',
    answer: '90',
    accepted: ['90', '90 องศา', '๙๐', '๙๐ องศา'],
    explanation: 'มุมฉากมีขนาดเท่ากับ 90 องศา',
    indicator_code: 'ค 2.2 ป.4/1',
    indicator_desc: 'จำแนกชนิดของมุม บอกชื่อมุม ส่วนประกอบของมุมและเขียนสัญลักษณ์แสดงมุม',
    media_item_id: '4349af79-3ee2-4e28-b72a-055bb14d4f9e',
    media_title: '📐 มุม — แหลม · ฉาก · ป้าน',
    media_image_url: '/games/math/angle-media-cover.png'
  },
  {
    topic: 'มุมและองศา',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'มุมตรง (เส้นตรง) มีขนาดกี่องศา? (ตอบเฉพาะตัวเลข)',
    answer: '180',
    accepted: ['180', '180 องศา', '๑๘๐', '๑๘๐ องศา'],
    explanation: 'มุมตรงมีขนาดเป็น 2 เท่าของมุมฉาก คือ 180 องศา',
    indicator_code: 'ค 2.2 ป.4/1',
    indicator_desc: 'จำแนกชนิดของมุม บอกชื่อมุม ส่วนประกอบของมุมและเขียนสัญลักษณ์แสดงมุม',
    media_item_id: '4349af79-3ee2-4e28-b72a-055bb14d4f9e',
    media_title: '📐 มุม — แหลม · ฉาก · ป้าน',
    media_image_url: '/games/math/angle-media-cover.png'
  },
  {
    topic: 'มุมภายในรูปสี่เหลี่ยม',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'ผลรวมของมุมภายในของรูปสี่เหลี่ยมมุมฉาก รวมกันได้ทั้งหมดกี่องศา? (ตอบเฉพาะตัวเลข)',
    answer: '360',
    accepted: ['360', '360 องศา', '๓๖๐', '๓๖๐ องศา'],
    explanation: 'มุมฉาก 4 มุม มุมละ 90 องศา รวมกันได้ 90 × 4 = 360 องศา',
    indicator_code: 'ค 2.2 ป.4/1',
    indicator_desc: 'จำแนกชนิดของมุม บอกชื่อมุม ส่วนประกอบของมุมและเขียนสัญลักษณ์แสดงมุม',
    media_item_id: '4349af79-3ee2-4e28-b72a-055bb14d4f9e',
    media_title: '📐 มุม — แหลม · ฉาก · ป้าน',
    media_image_url: '/games/math/angle-media-cover.png'
  },
  {
    topic: 'รูปทรงเรขาคณิตสามมิติ',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'รูปทรงลูกบาศก์ (Cube) มี "จุดยอด" (Vertices) ทั้งหมดกี่จุด? (ตอบเฉพาะตัวเลข)',
    answer: '8',
    accepted: ['8', '8 จุด', '๘', '๘ จุด'],
    explanation: 'ลูกบาศก์มี 6 หน้า, 12 ขอบ, และ 8 จุดยอด',
    indicator_code: 'ค 2.2 ป.4/1',
    indicator_desc: 'จำแนกชนิดของมุม บอกชื่อมุม ส่วนประกอบของมุมและเขียนสัญลักษณ์แสดงมุม',
    media_item_id: '5503879e-d4bf-402f-9063-7051cacb717d',
    media_title: '📐 คลังเรขาคณิต — มุม · เส้นรอบ · พื้นที่',
    media_image_url: '/games/math/math-geometry-hub/cover.png'
  },
  {
    topic: 'โจทย์ปัญหาการเงิน',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'ซื้อหนังสือเรียนราคา 145 บาท ให้ธนบัตรฉบับละ 500 บาท 1 ฉบับ จะได้รับเงินทอนกี่บาท? (ตอบเป็นตัวเลข)',
    answer: '355',
    accepted: ['355', '355 บาท', '๓๕๕', '๓๕๕ บาท'],
    explanation: 'เงินทอน = 500 - 145 = 355 บาท',
    indicator_code: 'ค 1.1 ป.4/11',
    indicator_desc: 'แสดงวิธีหาคำตอบของโจทย์ปัญหา',
    media_item_id: 'efd981ee-0f4e-416e-844a-b20bfc48feda',
    media_title: '💰 แลกเหรียญ (Coin Exchange)',
    media_image_url: '/games/math/coin-exchange/cover.png'
  },
  {
    topic: 'โจทย์ปัญหาการออมเงิน',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'นักเรียนฝากเงินเข้าธนาคารพอเพียงวันละ 15 บาท เป็นเวลา 20 วัน นักเรียนจะมีเงินออมสะสมทั้งหมดกี่บาท? (ตอบเป็นตัวเลข)',
    answer: '300',
    accepted: ['300', '300 บาท', '๓๐๐', '๓๐๐ บาท'],
    explanation: '15 × 20 = 300 บาท',
    indicator_code: 'ค 1.1 ป.4/11',
    indicator_desc: 'แสดงวิธีหาคำตอบของโจทย์ปัญหา',
    media_item_id: 'efd981ee-0f4e-416e-844a-b20bfc48feda',
    media_title: '💰 แลกเหรียญ (Coin Exchange)',
    media_image_url: '/games/math/coin-exchange/cover.png'
  },
  {
    topic: 'ความยาวรอบรูปสี่เหลี่ยมจัตุรัส',
    difficulty: 'medium',
    bloom_level: 'L3',
    text: 'เส้นลวดเส้นหนึ่งยาว 48 เซนติเมตร นำมาดัดเป็นรูปสี่เหลี่ยมจัตุรัส จะได้รูปสี่เหลี่ยมจัตุรัสที่มีความยาวด้านละกี่เซนติเมตร? (ตอบเป็นตัวเลข)',
    answer: '12',
    accepted: ['12', '12 เซนติเมตร', '12 ซม.', '๑๒', '๑๒ ซม.'],
    explanation: 'สี่เหลี่ยมจัตุรัสมี 4 ด้านยาวเท่ากัน ความยาวด้าน = 48 ÷ 4 = 12 เซนติเมตร',
    indicator_code: 'ค 2.1 ป.4/3',
    indicator_desc: 'หาพื้นที่ของรูปสี่เหลี่ยมมุมฉาก',
    media_item_id: 'ea84c27b-dd37-4a79-bb86-8590dc2e7bb2',
    media_title: '📐 พื้นที่สี่เหลี่ยมมุมฉาก',
    media_image_url: '/games/math/rect-area-media-cover.png'
  }
];
questions.push(...maD1, ...maD2, ...maD3, ...maD4, ...maD5, ...maD6);
// Filter out duplicates if any
const mathQuestions = [
  ...maD1, ...maD2, ...maD3, ...maD4, ...maD5, ...maD6
];
console.log('Math questions count:', mathQuestions.length);

// Reset questions to strictly th (60) + math (60)
questions.length = 0;
questions.push(...thD1, ...thD2, ...thD3, ...thD4, ...thD5, ...thD6);
questions.push(...maD1, ...maD2, ...maD3, ...maD4, ...maD5, ...maD6);

// ==============================================================================
// 3. ภาษาอังกฤษ (60 ข้อ)
// ==============================================================================

// EN-D1: Vocab Hub & หมวดหมู่คำศัพท์ (10 ข้อ)
const enD1 = [
  {
    topic: 'Classroom Vocabulary',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'From "English Vocab Hub", what is the English word for the classroom item used to erase pencil marks on paper? (ยางลบ)',
    answer: 'eraser',
    accepted: ['eraser', 'Eraser', 'rubber', 'Rubber', 'an eraser', 'An eraser'],
    explanation: 'ยางลบ ในภาษาอังกฤษคือ eraser (หรือ rubber ใน British English)',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Colors',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'What color is formed by nature in grass, trees, and leaves? (สีเขียว)',
    answer: 'green',
    accepted: ['green', 'Green', 'GREEN'],
    explanation: 'สีเขียว คือ green',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Body Parts',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'What body part is at the end of the leg, that we put shoes onto? (เท้า)',
    answer: 'foot',
    accepted: ['foot', 'Foot', 'feet', 'Feet'],
    explanation: 'เท้าข้างเดียวคือ foot (สองข้างคือ feet)',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Classroom Tools',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'What classroom tool with two blades is used for cutting paper? (กรรไกร)',
    answer: 'scissors',
    accepted: ['scissors', 'Scissors', 'a pair of scissors'],
    explanation: 'กรรไกร คือ scissors (เป็นคำพหูพจน์เสมอ)',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Animals',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Which big gray wild animal has a long nose called a trunk and big ears? (ช้าง)',
    answer: 'elephant',
    accepted: ['elephant', 'Elephant', 'an elephant', 'An elephant'],
    explanation: 'ช้าง คือ elephant',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Animals',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Which farm animal gives us fresh milk and says "moo"? (วัว)',
    answer: 'cow',
    accepted: ['cow', 'Cow', 'a cow'],
    explanation: 'วัว คือ cow',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'School Places',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'A quiet room in school where students read books and study is called the ... . (ห้องสมุด)',
    answer: 'library',
    accepted: ['library', 'Library', 'the library'],
    explanation: 'ห้องสมุด คือ library',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Food & Meals',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'What is the first meal of the day, eaten in the morning? (อาหารเช้า)',
    answer: 'breakfast',
    accepted: ['breakfast', 'Breakfast'],
    explanation: 'อาหารเช้า คือ breakfast, กลางวันคือ lunch, เย็นคือ dinner',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Family',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'The mother of your mother or father is your ... . (คุณย่าหรือคุณยาย)',
    answer: 'grandmother',
    accepted: ['grandmother', 'Grandmother', 'grandma', 'Grandma'],
    explanation: 'ย่าหรือยาย คือ grandmother หรือ grandma',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Clothes',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'What do we wear on our feet before putting on our school shoes? (ถุงเท้า)',
    answer: 'socks',
    accepted: ['socks', 'Socks', 'a pair of socks'],
    explanation: 'ถุงเท้า คือ socks',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  }
];

// EN-D2: Sentence Completion & Cloze (10 ข้อ)
const enD2 = [
  {
    topic: 'Sentence Completion',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'Complete the sentence: "Birds have wings so they can ..., but fish use fins to swim in water."',
    answer: 'fly',
    accepted: ['fly', 'Fly'],
    explanation: 'นกมีปีกจึงสามารถบินได้ (fly)',
    indicator_code: 'ต 1.1 ป.4/3',
    indicator_desc: 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Sentence Completion',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'Complete the sentence: "I am hungry. I want to ... some bread and rice."',
    answer: 'eat',
    accepted: ['eat', 'Eat'],
    explanation: 'เมื่อรู้สึกหิว (hungry) ย่อมต้องการรับประทานอาหาร (eat)',
    indicator_code: 'ต 1.1 ป.4/3',
    indicator_desc: 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Sentence Completion',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'Complete the sentence: "I am thirsty after playing football. Please give me some cold ... to drink."',
    answer: 'water',
    accepted: ['water', 'Water'],
    explanation: 'เมื่อกระหายน้ำ (thirsty) ต้องการดื่มน้ำ (water)',
    indicator_code: 'ต 1.1 ป.4/3',
    indicator_desc: 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Sentence Completion',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'Complete the sentence: "Every morning, I brush my ... with a toothbrush and toothpaste."',
    answer: 'teeth',
    accepted: ['teeth', 'Teeth'],
    explanation: 'แปรงฟัน ใช้คำว่า brush my teeth',
    indicator_code: 'ต 1.1 ป.4/3',
    indicator_desc: 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Sentence Completion',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'Complete the sentence: "The sun rises in the ... and sets in the west." (ทิศตะวันออก)',
    answer: 'east',
    accepted: ['east', 'East', 'the east', 'The east'],
    explanation: 'ดวงอาทิตย์ขึ้นทางทิศตะวันออก (east) และตกทางทิศตะวันตก (west)',
    indicator_code: 'ต 1.1 ป.4/3',
    indicator_desc: 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Sentence Completion',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'Complete the sentence: "Cats meow and dogs ... when they see strangers."',
    answer: 'bark',
    accepted: ['bark', 'Bark'],
    explanation: 'สุนัขเห่า คือ bark',
    indicator_code: 'ต 1.1 ป.4/3',
    indicator_desc: 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Sentence Completion',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'Complete the sentence: "We use our eyes to see and our ears to ... sounds."',
    answer: 'hear',
    accepted: ['hear', 'Hear', 'listen to', 'listen'],
    explanation: 'เราใช้หูในการได้ยินเสียง (hear หรือ listen)',
    indicator_code: 'ต 1.1 ป.4/3',
    indicator_desc: 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Numbers and Calendar',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'How many days are there in one week? (Write the English word or number)',
    answer: 'seven',
    accepted: ['seven', 'Seven', '7'],
    explanation: 'หนึ่งสัปดาห์มี 7 วัน (seven days)',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Numbers and Calendar',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'How many months are there in one year? (Write the English word or number)',
    answer: 'twelve',
    accepted: ['twelve', 'Twelve', '12'],
    explanation: 'หนึ่งปีมี 12 เดือน (twelve months)',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Opposites in Context',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Complete the sentence: "Ice is cold, but boiling fire is very ... ."',
    answer: 'hot',
    accepted: ['hot', 'Hot'],
    explanation: 'คำตรงข้ามของ cold (หนาว/เย็น) คือ hot (ร้อน)',
    indicator_code: 'ต 1.1 ป.4/3',
    indicator_desc: 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  }
];

// EN-D3: Classroom TPR Commands (10 ข้อ)
const enD3 = [
  {
    topic: 'Classroom Commands',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'From "Classroom Action Studio", fill in the verb: "... up, please!" (คำสั่งให้ยืนขึ้น)',
    answer: 'Stand',
    accepted: ['Stand', 'stand', 'STAND'],
    explanation: 'Stand up แปลว่า ยืนขึ้น',
    indicator_code: 'ต 1.1 ป.4/1',
    indicator_desc: 'ปฏิบัติตามคำสั่ง คำขอร้อง และคำแนะนำที่ฟังหรืออ่าน',
    media_item_id: 'e1b1d3e4-eb09-43a2-8170-82950a9f2818',
    media_title: 'Classroom Action & TPR Commands Studio',
    media_image_url: '/games/english/classroom-action-media-cover.png'
  },
  {
    topic: 'Classroom Commands',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'From "Classroom Action Studio", fill in the verb: "... down, please!" (คำสั่งให้นั่งลง)',
    answer: 'Sit',
    accepted: ['Sit', 'sit', 'SIT'],
    explanation: 'Sit down แปลว่า นั่งลง',
    indicator_code: 'ต 1.1 ป.4/1',
    indicator_desc: 'ปฏิบัติตามคำสั่ง คำขอร้อง และคำแนะนำที่ฟังหรืออ่าน',
    media_item_id: 'e1b1d3e4-eb09-43a2-8170-82950a9f2818',
    media_title: 'Classroom Action & TPR Commands Studio',
    media_image_url: '/games/english/classroom-action-media-cover.png'
  },
  {
    topic: 'Classroom Commands',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Fill in the verb: "... your English book to page 15." (คำสั่งให้เปิดหนังสือ)',
    answer: 'Open',
    accepted: ['Open', 'open', 'OPEN'],
    explanation: 'Open your book แปลว่า เปิดหนังสือของคุณ',
    indicator_code: 'ต 1.1 ป.4/1',
    indicator_desc: 'ปฏิบัติตามคำสั่ง คำขอร้อง และคำแนะนำที่ฟังหรืออ่าน',
    media_item_id: 'e1b1d3e4-eb09-43a2-8170-82950a9f2818',
    media_title: 'Classroom Action & TPR Commands Studio',
    media_image_url: '/games/english/classroom-action-media-cover.png'
  },
  {
    topic: 'Classroom Commands',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Fill in the verb: "... your notebook and listen to the teacher." (คำสั่งให้ปิดสมุด)',
    answer: 'Close',
    accepted: ['Close', 'close', 'CLOSE'],
    explanation: 'Close your notebook แปลว่า ปิดสมุดของคุณ',
    indicator_code: 'ต 1.1 ป.4/1',
    indicator_desc: 'ปฏิบัติตามคำสั่ง คำขอร้อง และคำแนะนำที่ฟังหรืออ่าน',
    media_item_id: 'e1b1d3e4-eb09-43a2-8170-82950a9f2818',
    media_title: 'Classroom Action & TPR Commands Studio',
    media_image_url: '/games/english/classroom-action-media-cover.png'
  },
  {
    topic: 'Classroom Commands',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'From "Classroom Action Studio", fill in the verb: "... your hand if you want to answer." (คำสั่งให้ยกมือ)',
    answer: 'Raise',
    accepted: ['Raise', 'raise', 'RAISE', 'Put up', 'put up'],
    explanation: 'Raise your hand แปลว่า ยกมือขึ้น',
    indicator_code: 'ต 1.1 ป.4/1',
    indicator_desc: 'ปฏิบัติตามคำสั่ง คำขอร้อง และคำแนะนำที่ฟังหรืออ่าน',
    media_item_id: 'e1b1d3e4-eb09-43a2-8170-82950a9f2818',
    media_title: 'Classroom Action & TPR Commands Studio',
    media_image_url: '/games/english/classroom-action-media-cover.png'
  },
  {
    topic: 'Classroom Commands',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Fill in the verb: "... to the teacher carefully." (คำสั่งให้ตั้งใจฟังครู)',
    answer: 'Listen',
    accepted: ['Listen', 'listen', 'LISTEN'],
    explanation: 'Listen to the teacher แปลว่า ฟังคุณครู',
    indicator_code: 'ต 1.1 ป.4/1',
    indicator_desc: 'ปฏิบัติตามคำสั่ง คำขอร้อง และคำแนะนำที่ฟังหรืออ่าน',
    media_item_id: 'e1b1d3e4-eb09-43a2-8170-82950a9f2818',
    media_title: 'Classroom Action & TPR Commands Studio',
    media_image_url: '/games/english/classroom-action-media-cover.png'
  },
  {
    topic: 'Classroom Commands',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Fill in the verb: "... at the whiteboard." (คำสั่งให้มองดูที่กระดาน)',
    answer: 'Look',
    accepted: ['Look', 'look', 'LOOK'],
    explanation: 'Look at the board แปลว่า มองดูที่กระดาน',
    indicator_code: 'ต 1.1 ป.4/1',
    indicator_desc: 'ปฏิบัติตามคำสั่ง คำขอร้อง และคำแนะนำที่ฟังหรืออ่าน',
    media_item_id: 'e1b1d3e4-eb09-43a2-8170-82950a9f2818',
    media_title: 'Classroom Action & TPR Commands Studio',
    media_image_url: '/games/english/classroom-action-media-cover.png'
  },
  {
    topic: 'Classroom Commands',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Fill in the verb: "... your name and number on the test paper." (คำสั่งให้เขียนชื่อ)',
    answer: 'Write',
    accepted: ['Write', 'write', 'WRITE'],
    explanation: 'Write your name แปลว่า เขียนชื่อของคุณ',
    indicator_code: 'ต 1.1 ป.4/1',
    indicator_desc: 'ปฏิบัติตามคำสั่ง คำขอร้อง และคำแนะนำที่ฟังหรืออ่าน',
    media_item_id: 'e1b1d3e4-eb09-43a2-8170-82950a9f2818',
    media_title: 'Classroom Action & TPR Commands Studio',
    media_image_url: '/games/english/classroom-action-media-cover.png'
  },
  {
    topic: 'Classroom Commands',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Fill in the word: "Be ..., please! Do not speak loud in the library." (คำสั่งให้เงียบ)',
    answer: 'quiet',
    accepted: ['quiet', 'Quiet', 'QUIET'],
    explanation: 'Be quiet แปลว่า โปรดเงียบ',
    indicator_code: 'ต 1.1 ป.4/1',
    indicator_desc: 'ปฏิบัติตามคำสั่ง คำขอร้อง และคำแนะนำที่ฟังหรืออ่าน',
    media_item_id: 'e1b1d3e4-eb09-43a2-8170-82950a9f2818',
    media_title: 'Classroom Action & TPR Commands Studio',
    media_image_url: '/games/english/classroom-action-media-cover.png'
  },
  {
    topic: 'Classroom Commands',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'From "Classroom Action Studio", fill in the verb: "... the door when you leave the air-conditioned classroom." (ปิดประตู)',
    answer: 'Close',
    accepted: ['Close', 'close', 'Shut', 'shut'],
    explanation: 'Close the door แปลว่า ปิดประตู',
    indicator_code: 'ต 1.1 ป.4/1',
    indicator_desc: 'ปฏิบัติตามคำสั่ง คำขอร้อง และคำแนะนำที่ฟังหรืออ่าน',
    media_item_id: 'e1b1d3e4-eb09-43a2-8170-82950a9f2818',
    media_title: 'Classroom Action & TPR Commands Studio',
    media_image_url: '/games/english/classroom-action-media-cover.png'
  }
];

// EN-D4: Phonics & Spelling Missing Letters (10 ข้อ)
const enD4 = [
  {
    topic: 'Phonics Magic E',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'From "Phonics Reading Studio", fill in the missing vowel letter for the Magic E word: "c _ k e" (ขนมเค้ก)',
    answer: 'a',
    accepted: ['a', 'A', 'cake', 'Cake'],
    explanation: 'c-a-k-e สระเอ ออกเสียงเสียงยาว /eɪ/ ด้วย Magic E',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '5b960ebf-8929-463f-b239-0f2b03b2dd0e',
    media_title: '🔤 Phonics Reading Studio — สื่อฝึกอ่านออกเสียงโฟนิกส์และคำศัพท์ภาพ',
    media_image_url: '/games/english/phonics-media-cover.png'
  },
  {
    topic: 'Phonics Magic E',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'From "Phonics Reading Studio", fill in the missing vowel letter for the Magic E word: "b _ k e" (รถจักรยาน)',
    answer: 'i',
    accepted: ['i', 'I', 'bike', 'Bike'],
    explanation: 'b-i-k-e ตัว i ออกเสียงยาว /aɪ/ ด้วย Magic E',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '5b960ebf-8929-463f-b239-0f2b03b2dd0e',
    media_title: '🔤 Phonics Reading Studio — สื่อฝึกอ่านออกเสียงโฟนิกส์และคำศัพท์ภาพ',
    media_image_url: '/games/english/phonics-media-cover.png'
  },
  {
    topic: 'Phonics Magic E',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'From "Phonics Reading Studio", fill in the missing vowel letter for: "h _ m e" (บ้าน)',
    answer: 'o',
    accepted: ['o', 'O', 'home', 'Home'],
    explanation: 'h-o-m-e ตัว o ออกเสียงยาว /oʊ/ ด้วย Magic E',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '5b960ebf-8929-463f-b239-0f2b03b2dd0e',
    media_title: '🔤 Phonics Reading Studio — สื่อฝึกอ่านออกเสียงโฟนิกส์และคำศัพท์ภาพ',
    media_image_url: '/games/english/phonics-media-cover.png'
  },
  {
    topic: 'Phonics Vowel Digraphs',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Fill in the two missing letters for: "b _ _ k" (หนังสือ - สระอูสั้น)',
    answer: 'oo',
    accepted: ['oo', 'OO', 'book', 'Book'],
    explanation: 'b-o-o-k สะกดด้วยสระคู่ oo',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '5b960ebf-8929-463f-b239-0f2b03b2dd0e',
    media_title: '🔤 Phonics Reading Studio — สื่อฝึกอ่านออกเสียงโฟนิกส์และคำศัพท์ภาพ',
    media_image_url: '/games/english/phonics-media-cover.png'
  },
  {
    topic: 'Phonics Vowel Digraphs',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Fill in the two missing letters for: "t r _ _" (ต้นไม้ - สระอีเสียงยาว)',
    answer: 'ee',
    accepted: ['ee', 'EE', 'tree', 'Tree'],
    explanation: 't-r-e-e สะกดด้วยสระคู่ ee ออกเสียง /iː/',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '5b960ebf-8929-463f-b239-0f2b03b2dd0e',
    media_title: '🔤 Phonics Reading Studio — สื่อฝึกอ่านออกเสียงโฟนิกส์และคำศัพท์ภาพ',
    media_image_url: '/games/english/phonics-media-cover.png'
  },
  {
    topic: 'Short Vowels CVC',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Fill in the short vowel letter for: "c _ t" (สัตว์เลี้ยงแมว)',
    answer: 'a',
    accepted: ['a', 'A', 'cat', 'Cat'],
    explanation: 'c-a-t แมว สระแอะ /æ/',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '5b960ebf-8929-463f-b239-0f2b03b2dd0e',
    media_title: '🔤 Phonics Reading Studio — สื่อฝึกอ่านออกเสียงโฟนิกส์และคำศัพท์ภาพ',
    media_image_url: '/games/english/phonics-media-cover.png'
  },
  {
    topic: 'Short Vowels CVC',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Fill in the short vowel letter for: "p _ n" (เครื่องเขียนปากกา)',
    answer: 'e',
    accepted: ['e', 'E', 'pen', 'Pen'],
    explanation: 'p-e-n ปากกา สระเอะ /e/',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '5b960ebf-8929-463f-b239-0f2b03b2dd0e',
    media_title: '🔤 Phonics Reading Studio — สื่อฝึกอ่านออกเสียงโฟนิกส์และคำศัพท์ภาพ',
    media_image_url: '/games/english/phonics-media-cover.png'
  },
  {
    topic: 'Short Vowels CVC',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Fill in the short vowel letter for: "s _ n" (ดวงอาทิตย์)',
    answer: 'u',
    accepted: ['u', 'U', 'sun', 'Sun'],
    explanation: 's-u-n ดวงอาทิตย์ สระอะ /ʌ/',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '5b960ebf-8929-463f-b239-0f2b03b2dd0e',
    media_title: '🔤 Phonics Reading Studio — สื่อฝึกอ่านออกเสียงโฟนิกส์และคำศัพท์ภาพ',
    media_image_url: '/games/english/phonics-media-cover.png'
  },
  {
    topic: 'Consonant Digraphs',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'Fill in the two beginning letters for: "_ _ i p" (เรือเดินสมุทรขนาดใหญ่ - เสียง sh)',
    answer: 'sh',
    accepted: ['sh', 'SH', 'Sh', 'ship', 'Ship'],
    explanation: 's-h-i-p เรือ สะกดด้วยเสียง sh /ʃ/',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '5b960ebf-8929-463f-b239-0f2b03b2dd0e',
    media_title: '🔤 Phonics Reading Studio — สื่อฝึกอ่านออกเสียงโฟนิกส์และคำศัพท์ภาพ',
    media_image_url: '/games/english/phonics-media-cover.png'
  },
  {
    topic: 'Consonant Digraphs',
    difficulty: 'medium',
    bloom_level: 'L2',
    text: 'Fill in the two beginning letters for: "_ _ i c k" (ลูกเจี๊ยบ - เสียง ch)',
    answer: 'ch',
    accepted: ['ch', 'CH', 'Ch', 'chick', 'Chick'],
    explanation: 'c-h-i-c-k ลูกเจี๊ยบ สะกดด้วยเสียง ch /tʃ/',
    indicator_code: 'ต 1.1 ป.4/2',
    indicator_desc: 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค ข้อความง่ายๆ',
    media_item_id: '5b960ebf-8929-463f-b239-0f2b03b2dd0e',
    media_title: '🔤 Phonics Reading Studio — สื่อฝึกอ่านออกเสียงโฟนิกส์และคำศัพท์ภาพ',
    media_image_url: '/games/english/phonics-media-cover.png'
  }
];

// EN-D5: Grammar, Tenses & Prepositions (10 ข้อ)
const enD5 = [
  {
    topic: 'Past Simple Tense',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'From "English Tenses Studio", what is the past simple form of the verb "go"? ("Yesterday, Jack ... to the market.")',
    answer: 'went',
    accepted: ['went', 'Went'],
    explanation: 'กริยาช่อง 2 ของ go คือ went',
    indicator_code: 'ต 1.1 ป.4/3',
    indicator_desc: 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ',
    media_item_id: '5b2edf31-1ed5-4bc0-a6bd-be073152af1a',
    media_title: '⏱️ English Tenses Learning Studio — สื่อเรียนรู้กาลภาษาอังกฤษ ป.4–ป.6',
    media_image_url: '/games/english/english-tenses-p6-media-cover.png'
  },
  {
    topic: 'Past Simple Tense',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'What is the past simple form of the verb "see"? ("Last night, we ... a bright star in the sky.")',
    answer: 'saw',
    accepted: ['saw', 'Saw'],
    explanation: 'กริยาช่อง 2 ของ see คือ saw',
    indicator_code: 'ต 1.1 ป.4/3',
    indicator_desc: 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ',
    media_item_id: '5b2edf31-1ed5-4bc0-a6bd-be073152af1a',
    media_title: '⏱️ English Tenses Learning Studio — สื่อเรียนรู้กาลภาษาอังกฤษ ป.4–ป.6',
    media_image_url: '/games/english/english-tenses-p6-media-cover.png'
  },
  {
    topic: 'Past Simple Tense',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'What is the past simple form of the verb "eat"? ("This morning, Lisa ... a sandwich for breakfast.")',
    answer: 'ate',
    accepted: ['ate', 'Ate'],
    explanation: 'กริยาช่อง 2 ของ eat คือ ate',
    indicator_code: 'ต 1.1 ป.4/3',
    indicator_desc: 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ',
    media_item_id: '5b2edf31-1ed5-4bc0-a6bd-be073152af1a',
    media_title: '⏱️ English Tenses Learning Studio — สื่อเรียนรู้กาลภาษาอังกฤษ ป.4–ป.6',
    media_image_url: '/games/english/english-tenses-p6-media-cover.png'
  },
  {
    topic: 'Past Simple Tense',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'What is the past simple form of the regular verb "play"? ("Yesterday, the boys ... badminton.")',
    answer: 'played',
    accepted: ['played', 'Played'],
    explanation: 'กริยาปกติ play เติม -ed เป็น played',
    indicator_code: 'ต 1.1 ป.4/3',
    indicator_desc: 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ',
    media_item_id: '5b2edf31-1ed5-4bc0-a6bd-be073152af1a',
    media_title: '⏱️ English Tenses Learning Studio — สื่อเรียนรู้กาลภาษาอังกฤษ ป.4–ป.6',
    media_image_url: '/games/english/english-tenses-p6-media-cover.png'
  },
  {
    topic: 'Subject-Verb Agreement',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'Choose between "have" or "has": "She ... a lovely brown puppy."',
    answer: 'has',
    accepted: ['has', 'Has'],
    explanation: 'ประธานเอกพจน์บุรุษที่ 3 (He, She, It) ใช้ has',
    indicator_code: 'ต 1.1 ป.4/3',
    indicator_desc: 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Subject-Verb Agreement',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'Choose between "is", "am", or "are": "They ... good students at Ban Kampai School."',
    answer: 'are',
    accepted: ['are', 'Are'],
    explanation: 'ประธานพหูพจน์ They ใช้ are',
    indicator_code: 'ต 1.1 ป.4/3',
    indicator_desc: 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Prepositions of Place',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Fill in the preposition: "The sleeping cat is hiding ... the table." (อยู่ใต้โต๊ะ: in / on / under)',
    answer: 'under',
    accepted: ['under', 'Under'],
    explanation: 'under แปลว่า ข้างใต้/อยู่ใต้',
    indicator_code: 'ต 1.1 ป.4/3',
    indicator_desc: 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Prepositions of Place',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Fill in the preposition: "The crayons are ... the pencil box." (อยู่ในกล่องดินสอ: in / on / under)',
    answer: 'in',
    accepted: ['in', 'In', 'inside'],
    explanation: 'in แปลว่า ข้างใน',
    indicator_code: 'ต 1.1 ป.4/3',
    indicator_desc: 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Prepositions of Place',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Fill in the preposition: "The computer is placed ... the teacher desk." (อยู่บนโต๊ะ: in / on / under)',
    answer: 'on',
    accepted: ['on', 'On'],
    explanation: 'on แปลว่า บน/อยู่บนพื้นผิว',
    indicator_code: 'ต 1.1 ป.4/3',
    indicator_desc: 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  },
  {
    topic: 'Articles A / An',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Fill in the article "a" or "an": "I see ... elephant in the zoo."',
    answer: 'an',
    accepted: ['an', 'An'],
    explanation: 'elephant ขึ้นต้นด้วยสระ e จึงใช้ an',
    indicator_code: 'ต 1.1 ป.4/3',
    indicator_desc: 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ',
    media_item_id: '60ddd3be-9a00-4d83-876a-b3337409ec0c',
    media_title: '🇬🇧 English Grammar & Sight Words Studio',
    media_image_url: '/games/english/english-grammar-p45-hub/cover.png'
  }
];

// EN-D6: Everyday Conversations (10 ข้อ)
const enD6 = [
  {
    topic: 'Everyday Conversations',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'From "Everyday Conversation Studio", complete the dialogue: A: "Where are you from?" — B: "I am from ... ." (ประเทศไทย)',
    answer: 'Thailand',
    accepted: ['Thailand', 'thailand', 'THAILAND'],
    explanation: 'I am from Thailand แปลว่า ฉันมาจากประเทศไทย',
    indicator_code: 'ต 1.2 ป.4/1',
    indicator_desc: 'พูด/เขียนโต้ตอบในการสื่อสารระหว่างบุคคล',
    media_item_id: 'abf350a4-8f83-477a-b9a7-c1387d2f7fa0',
    media_title: '🗣️ Everyday Conversation ป.4',
    media_image_url: '/games/english/everyday-conversation-p4-media-cover.png'
  },
  {
    topic: 'Everyday Conversations',
    difficulty: 'easy',
    bloom_level: 'L2',
    text: 'Complete the dialogue: A: "How are you today?" — B: "I am ..., thank you." (สบายดี)',
    answer: 'fine',
    accepted: ['fine', 'Fine', 'good', 'Good', 'well', 'Well', 'okay', 'Okay'],
    explanation: 'I am fine, thank you แปลว่า ฉันสบายดี ขอบคุณครับ/ค่ะ',
    indicator_code: 'ต 1.2 ป.4/1',
    indicator_desc: 'พูด/เขียนโต้ตอบในการสื่อสารระหว่างบุคคล',
    media_item_id: 'abf350a4-8f83-477a-b9a7-c1387d2f7fa0',
    media_title: '🗣️ Everyday Conversation ป.4',
    media_image_url: '/games/english/everyday-conversation-p4-media-cover.png'
  },
  {
    topic: 'Everyday Conversations',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Complete the question: "What is your ...?" — "My name is Danny."',
    answer: 'name',
    accepted: ['name', 'Name'],
    explanation: 'What is your name? แปลว่า คุณชื่ออะไร?',
    indicator_code: 'ต 1.2 ป.4/1',
    indicator_desc: 'พูด/เขียนโต้ตอบในการสื่อสารระหว่างบุคคล',
    media_item_id: 'abf350a4-8f83-477a-b9a7-c1387d2f7fa0',
    media_title: '🗣️ Everyday Conversation ป.4',
    media_image_url: '/games/english/everyday-conversation-p4-media-cover.png'
  },
  {
    topic: 'Everyday Conversations',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Complete the question: "How ... are you?" — "I am ten years old."',
    answer: 'old',
    accepted: ['old', 'Old'],
    explanation: 'How old are you? แปลว่า คุณอายุเท่าไหร่?',
    indicator_code: 'ต 1.2 ป.4/1',
    indicator_desc: 'พูด/เขียนโต้ตอบในการสื่อสารระหว่างบุคคล',
    media_item_id: 'abf350a4-8f83-477a-b9a7-c1387d2f7fa0',
    media_title: '🗣️ Everyday Conversation ป.4',
    media_image_url: '/games/english/everyday-conversation-p4-media-cover.png'
  },
  {
    topic: 'Everyday Conversations',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'When someone says "Thank you very much", the polite reply is "You are ... ."',
    answer: 'welcome',
    accepted: ['welcome', 'Welcome'],
    explanation: 'You are welcome แปลว่า ด้วยความยินดี/ไม่เป็นไรครับ',
    indicator_code: 'ต 1.2 ป.4/1',
    indicator_desc: 'พูด/เขียนโต้ตอบในการสื่อสารระหว่างบุคคล',
    media_item_id: 'abf350a4-8f83-477a-b9a7-c1387d2f7fa0',
    media_title: '🗣️ Everyday Conversation ป.4',
    media_image_url: '/games/english/everyday-conversation-p4-media-cover.png'
  },
  {
    topic: 'Everyday Conversations',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Complete the greeting reply: A: "Nice to meet you." — B: "Nice to meet you, ... ."',
    answer: 'too',
    accepted: ['too', 'Too'],
    explanation: 'Nice to meet you, too แปลว่า ยินดีที่ได้รู้จักเช่นกัน',
    indicator_code: 'ต 1.2 ป.4/1',
    indicator_desc: 'พูด/เขียนโต้ตอบในการสื่อสารระหว่างบุคคล',
    media_item_id: 'abf350a4-8f83-477a-b9a7-c1387d2f7fa0',
    media_title: '🗣️ Everyday Conversation ป.4',
    media_image_url: '/games/english/everyday-conversation-p4-media-cover.png'
  },
  {
    topic: 'Telling Time',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Complete the time response: A: "What time is it?" — B: "It is eight ... ." (แปดนาฬิกาตรง)',
    answer: "o'clock",
    accepted: ["o'clock", "O'clock", "oclock", "Oclock"],
    explanation: "แปดนาฬิกาตรง คือ eight o'clock",
    indicator_code: 'ต 1.2 ป.4/1',
    indicator_desc: 'พูด/เขียนโต้ตอบในการสื่อสารระหว่างบุคคล',
    media_item_id: 'abf350a4-8f83-477a-b9a7-c1387d2f7fa0',
    media_title: '🗣️ Everyday Conversation ป.4',
    media_image_url: '/games/english/everyday-conversation-p4-media-cover.png'
  },
  {
    topic: 'Days of the Week',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'What is the first school day of the week, following Sunday? (วันจันทร์)',
    answer: 'Monday',
    accepted: ['Monday', 'monday'],
    explanation: 'วันจันทร์ คือ Monday',
    indicator_code: 'ต 1.2 ป.4/1',
    indicator_desc: 'พูด/เขียนโต้ตอบในการสื่อสารระหว่างบุคคล',
    media_item_id: 'abf350a4-8f83-477a-b9a7-c1387d2f7fa0',
    media_title: '🗣️ Everyday Conversation ป.4',
    media_image_url: '/games/english/everyday-conversation-p4-media-cover.png'
  },
  {
    topic: 'Short Answers',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Complete the short answer: "Do you like apples?" — "Yes, I ... ."',
    answer: 'do',
    accepted: ['do', 'Do'],
    explanation: 'คำถามที่ขึ้นต้นด้วย Do ตอบรับคือ Yes, I do.',
    indicator_code: 'ต 1.2 ป.4/1',
    indicator_desc: 'พูด/เขียนโต้ตอบในการสื่อสารระหว่างบุคคล',
    media_item_id: 'abf350a4-8f83-477a-b9a7-c1387d2f7fa0',
    media_title: '🗣️ Everyday Conversation ป.4',
    media_image_url: '/games/english/everyday-conversation-p4-media-cover.png'
  },
  {
    topic: 'Everyday Conversations',
    difficulty: 'easy',
    bloom_level: 'L1',
    text: 'Complete the parting phrase: "Goodbye teacher, see you ... ." (พบกันใหม่พรุ่งนี้)',
    answer: 'tomorrow',
    accepted: ['tomorrow', 'Tomorrow', 'again', 'later', 'soon'],
    explanation: 'See you tomorrow แปลว่า พบกันใหม่วันพรุ่งนี้',
    indicator_code: 'ต 1.2 ป.4/1',
    indicator_desc: 'พูด/เขียนโต้ตอบในการสื่อสารระหว่างบุคคล',
    media_item_id: 'abf350a4-8f83-477a-b9a7-c1387d2f7fa0',
    media_title: '🗣️ Everyday Conversation ป.4',
    media_image_url: '/games/english/everyday-conversation-p4-media-cover.png'
  }
];

questions.push(...enD1, ...enD2, ...enD3, ...enD4, ...enD5, ...enD6);

console.log('Total questions defined:', questions.length);

// Generate SQL migration
let sql = `-- ============================================================================
-- Migration 553: Seed Bulk Fill-in Exam Bank (180 Questions across Thai, Math, English)
-- โรงเรียนบ้านคำไผ่ · ระบบคลังข้อสอบมาตรฐานพหุรูปแบบ อิงคลังสื่อการสอนจริง
-- ============================================================================

INSERT INTO public.exam_questions (
  subject, grade, topic, difficulty, bloom_level, question_type,
  question_text, answer, accepted_answers, explanation,
  indicator_code, indicator_desc, media_item_id, media_title, media_image_url
) VALUES
`;

const rows = questions.map((q, idx) => {
  let subj = 'ภาษาไทย';
  if (idx >= 60 && idx < 120) subj = 'คณิตศาสตร์';
  else if (idx >= 120) subj = 'ภาษาอังกฤษ';

  return `(
  ${esc(subj)}, 'ป.4', ${esc(q.topic)}, ${esc(q.difficulty)}, ${esc(q.bloom_level)}, 'fillin',
  ${esc(q.text)},
  ${sqlJsonbText(q.answer)},
  ${sqlArray(q.accepted)},
  ${esc(q.explanation)},
  ${esc(q.indicator_code)}, ${esc(q.indicator_desc)},
  ${q.media_item_id ? esc(q.media_item_id) + '::uuid' : 'NULL'},
  ${esc(q.media_title)},
  ${esc(q.media_image_url)}
)`;
});

sql += rows.join(',\n') + ';\n\n';

// 3 Standard Dedicated Fill-in Sets
sql += `-- ============================================================================
-- 3 Dedicated Standard Fill-in Exam Sets (ชุดข้อสอบเติมคำล้วนมาตรฐาน 3 วิชา)
-- ============================================================================

-- 1. ภาษาไทย เติมคำล้วน 60 ข้อ
INSERT INTO public.exam_sets (
  id, title, subject, grade, time_limit_minutes, pass_threshold_pct, is_active, pin_code, questions
) VALUES (
  'c0055555-1111-2222-3333-444455556666',
  'แบบทดสอบเติมคำมาตรฐาน วิชาภาษาไทย ป.4–5 (คลังคำศัพท์ · สะกดคำ · เติมประโยค · สำนวน · ลักษณนาม)',
  'ภาษาไทย', 'ป.4', 60, 50, true, 'THAIFILL60',
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'question_type', question_type,
        'question_text', question_text,
        'answer', answer,
        'accepted_answers', accepted_answers,
        'explanation', explanation,
        'points', 1,
        'indicator_code', indicator_code,
        'media_title', media_title,
        'media_image_url', media_image_url
      )
    )
    FROM (
      SELECT * FROM public.exam_questions 
      WHERE subject = 'ภาษาไทย' AND question_type = 'fillin'
      ORDER BY id
      LIMIT 60
    ) sub
  )
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  questions = EXCLUDED.questions,
  updated_at = now();

-- 2. คณิตศาสตร์ เติมคำล้วน 60 ข้อ
INSERT INTO public.exam_sets (
  id, title, subject, grade, time_limit_minutes, pass_threshold_pct, is_active, pin_code, questions
) VALUES (
  'c0066666-2222-3333-4444-555566667777',
  'แบบทดสอบเติมคำมาตรฐาน วิชาคณิตศาสตร์ ป.4–5 (หารสั้น · หารยาว · การคูณ · ค่าประมาณ · เศษเกิน · จำนวนคละ)',
  'คณิตศาสตร์', 'ป.4', 60, 50, true, 'MATHFILL60',
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'question_type', question_type,
        'question_text', question_text,
        'answer', answer,
        'accepted_answers', accepted_answers,
        'explanation', explanation,
        'points', 1,
        'indicator_code', indicator_code,
        'media_title', media_title,
        'media_image_url', media_image_url
      )
    )
    FROM (
      SELECT * FROM public.exam_questions 
      WHERE subject = 'คณิตศาสตร์' AND question_type = 'fillin'
      ORDER BY id
      LIMIT 60
    ) sub
  )
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  questions = EXCLUDED.questions,
  updated_at = now();

-- 3. ภาษาอังกฤษ เติมคำล้วน 60 ข้อ
INSERT INTO public.exam_sets (
  id, title, subject, grade, time_limit_minutes, pass_threshold_pct, is_active, pin_code, questions
) VALUES (
  'c0077777-3333-4444-5555-666677778888',
  'แบบทดสอบเติมคำมาตรฐาน วิชาภาษาอังกฤษ ป.4–5 (Vocab Hub · Commands · Phonics · Tenses · Cloze · Dialogues)',
  'ภาษาอังกฤษ', 'ป.4', 60, 50, true, 'ENGFILL60',
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', id,
        'question_type', question_type,
        'question_text', question_text,
        'answer', answer,
        'accepted_answers', accepted_answers,
        'explanation', explanation,
        'points', 1,
        'indicator_code', indicator_code,
        'media_title', media_title,
        'media_image_url', media_image_url
      )
    )
    FROM (
      SELECT * FROM public.exam_questions 
      WHERE subject = 'ภาษาอังกฤษ' AND question_type = 'fillin'
      ORDER BY id
      LIMIT 60
    ) sub
  )
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  questions = EXCLUDED.questions,
  updated_at = now();
`;

fs.writeFileSync('supabase/migrations/553_seed_bulk_fillin_exam_bank.sql', sql);
console.log('Successfully written supabase/migrations/553_seed_bulk_fillin_exam_bank.sql');

// Also write clean individual parts for reliable execution
fs.mkdirSync('supabase/.temp', { recursive: true });
const makeSql = (items) => {
  const pfx = `INSERT INTO public.exam_questions (
  subject, grade, topic, difficulty, bloom_level, question_type,
  question_text, answer, accepted_answers, explanation,
  indicator_code, indicator_desc, media_item_id, media_title, media_image_url
) VALUES
`;
  return pfx + items.map(q => {
    let subj = 'ภาษาไทย';
    const idx = questions.indexOf(q);
    if (idx >= 60 && idx < 120) subj = 'คณิตศาสตร์';
    else if (idx >= 120) subj = 'ภาษาอังกฤษ';
    return `(
  ${esc(subj)}, 'ป.4', ${esc(q.topic)}, ${esc(q.difficulty)}, ${esc(q.bloom_level)}, 'fillin',
  ${esc(q.text)},
  ${sqlJsonbText(q.answer)},
  ${sqlArray(q.accepted)},
  ${esc(q.explanation)},
  ${esc(q.indicator_code)}, ${esc(q.indicator_desc)},
  ${q.media_item_id ? esc(q.media_item_id) + '::uuid' : 'NULL'},
  ${esc(q.media_title)},
  ${esc(q.media_image_url)}
)`;
  }).join(',\n') + ';\n';
};

fs.writeFileSync('supabase/.temp/part1_thai.sql', makeSql(questions.slice(0, 60)));
fs.writeFileSync('supabase/.temp/part2_math.sql', makeSql(questions.slice(60, 120)));
fs.writeFileSync('supabase/.temp/part3_english.sql', makeSql(questions.slice(120, 180)));

const setsSql = sql.substring(sql.indexOf('-- ============================================================================\n-- 3 Dedicated Standard Fill-in Exam Sets'));
fs.writeFileSync('supabase/.temp/part4_sets.sql', setsSql);
console.log('Successfully exported 4 clean parts to supabase/.temp/');
