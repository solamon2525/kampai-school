#!/usr/bin/env node
/** Harden Batch 9 Thai hub worksheets: Thai labels, richer scaffolds, larger banks */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function sheet({ file, hub, indicators, icon, title, gradeLabel, mediaLabel, directions, topicOptions, items, renderBody }) {
  const html = `<!DOCTYPE html>
<html lang="th"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="worksheet-source-media" content="${hub}">
  <meta name="curriculum-indicators" content="${indicators.join(',')}">
  <title>${title} ${gradeLabel} — โรงเรียนบ้านคำไผ่</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet">
  <link href="/games/worksheet-topic.css?v=1.172.0" rel="stylesheet">
  <link href="/games/worksheet-modes.css?v=1.172.0" rel="stylesheet">
</head><body>
<header class="toolbar"><h1>${icon} ${title}</h1><div class="toolbar-ctrls">
  <select class="t-select" id="selStyle" aria-label="รูปแบบใบงาน"><option value="standard">มาตรฐาน</option><option value="progressive">บันไดระดับ</option><option value="booklet">รวมเล่ม</option></select>
  <select class="t-select" id="selPageCount" aria-label="จำนวนหน้า"><option value="1">1 หน้า</option><option value="2">2 หน้า</option><option value="3">3 หน้า</option></select>
  <select class="t-select" id="selGrade" aria-label="ระดับชั้น"><option value="4">${gradeLabel}</option></select>
  <select class="t-select" id="selTopic" aria-label="ทักษะ">${topicOptions}</select>
  <select class="t-select" id="selCount" aria-label="จำนวนข้อ"><option value="10">10 ข้อ</option><option value="5">5 ข้อ</option></select>
  <input class="t-input" id="inpSchool" value="โรงเรียนบ้านคำไผ่" aria-label="ชื่อโรงเรียน">
  <select class="t-select" id="selTeacher" aria-label="ครูผู้สอน"><option value="">-- เลือกครูผู้สอน --</option></select>
  <button class="btn primary" id="btnRandom">🎲 สุ่มใหม่</button>
  <button class="btn" id="btnAnswers">👁 เฉลยครู</button>
  <button class="btn green" id="btnPrint">🖨 พิมพ์ A4</button>
</div></header>
<main class="pages" id="pages"><section class="sheet"><div class="questions"><article class="q">กำลังสร้างใบงาน</article></div></section></main>
<script src="/games/worksheet-runtime.js?v=1.172.0"></script>
<script>
const ITEMS=${JSON.stringify(items)};
window.WORKSHEET_CONFIG={
  icon:'${icon}',title:'${title}',subject:'ภาษาไทย',gradeLabel:'${gradeLabel}',
  mediaLabel:'${mediaLabel}',sourceMediaUrl:'${hub}',
  indicators:${JSON.stringify(indicators)},
  directions:${JSON.stringify(directions)},
  getItems(topic){return topic==='mixed'?ITEMS:ITEMS.filter(item=>item.type===topic);},
  renderQuestion(item){${renderBody}}
};
</script>
<script src="/games/worksheet-topic.js?v=1.172.0"></script>
<script>
function render(){window.KampaiTopicWorksheet.render();}
document.getElementById('btnRandom').onclick=window.KampaiTopicWorksheet.randomize;
document.getElementById('btnAnswers').onclick=()=>document.body.classList.toggle('show-answers');
document.getElementById('btnPrint').onclick=()=>window.print();
window.KampaiWorksheet.loadTeachers();
render();
</script>
<script src="/games/worksheet-modes.js?v=1.172.0"></script>
</body></html>
`;
  writeFileSync(resolve(root, 'public/games/thai', file), html, 'utf8');
  console.log('hardened', file, 'items', items.length);
}

const scriptItems = [
  { type: 'mid', prompt: 'จัดกลุ่มพยัญชนะกลางแล้วยกตัวอย่างคำ', hint: 'ก จ ฎ ฏ ด ต บ ป อ', answer: 'พยัญชนะกลาง · เช่น กา จาน' },
  { type: 'high', prompt: 'จัดกลุ่มพยัญชนะสูงแล้วยกตัวอย่างคำ', hint: 'ข ฃ ฉ ฐ ถ ผ ฝ ศ ษ ส ห', answer: 'พยัญชนะสูง · เช่น ขา ฝน' },
  { type: 'low', prompt: 'จัดกลุ่มพยัญชนะต่ำแล้วยกตัวอย่างคำ', hint: 'ค ฅ ฆ ช ซ ฌ ญ ฑ ฒ ณ ท ธ น พ ฟ ภ ม ย ร ล ว ฬ ฮ', answer: 'พยัญชนะต่ำ · เช่น คอ นา' },
  { type: 'vowel', prompt: 'แยกสระสั้น–ยาวจากคู่คำ', hint: 'กะ/กา · ติ/ตี · ตุ/ตู', answer: 'สั้น: กะ ติ ตุ · ยาว: กา ตี ตู' },
  { type: 'tone', prompt: 'เรียงวรรณยุกต์และบอกชื่อ', hint: 'กา ก่า ก้า ก๊า ก๋า', answer: 'สามัญ เอก โท ตรี จัตวา' },
  { type: 'lead', prompt: 'หาอักษรนำและอธิบาย', hint: 'หวาย ขนม ตลาด', answer: 'ห+ว / ข+น / ต+ล' },
  { type: 'matra', prompt: 'บอกแม่มาตราตัวสะกด', hint: 'มาก บ้าน จาน บอก', answer: 'แม่กก / แม่กน / แม่กน / แม่กก' },
  { type: 'mixed', prompt: 'วิเคราะห์คำ: หมู่พยัญชนะ สระ วรรณยุกต์', hint: 'น้ำ', answer: 'น (ต่ำ) + ำ + ไม้โท' },
  { type: 'mid', prompt: 'เขียนคำพยัญชนะกลาง 4 คำ', hint: 'ก จ ด ต', answer: 'เช่น กบ จาน ดอก ตา' },
  { type: 'high', prompt: 'เขียนคำพยัญชนะสูง 4 คำ', hint: 'ข ผ ฝ ส', answer: 'เช่น ขา ผี ฝน สาว' },
  { type: 'low', prompt: 'เขียนคำพยัญชนะต่ำ 4 คำ', hint: 'ค น ม ร', answer: 'เช่น คอ นา มา เรือ' },
  { type: 'vowel', prompt: 'เติมสระให้คำอ่านได้', hint: 'ข_น / ต_น / บ_น', answer: 'เช่น ขน/ขอน · ตน/โต้น · บน/บอน' },
  { type: 'tone', prompt: 'เปลี่ยนวรรณยุกต์ของคำ “มา” ให้ได้ 3 เสียง', hint: 'มา', answer: 'เช่น ม่า ม้า ม๊า' },
  { type: 'lead', prompt: 'วงอักษรนำในคำ', hint: 'หนู หวาน ขนม', answer: 'ห+น / ห+ว / ข+น' },
  { type: 'matra', prompt: 'จัดคำตามแม่กก กน กด', hint: 'มาก จาน บาด', answer: 'กก: มาก บาด · กน: จาน' },
  { type: 'mixed', prompt: 'วิเคราะห์คำ “ช้าง”', hint: 'ช้าง', answer: 'ช (ต่ำ) + า + ง · แม่กง' },
  { type: 'vowel', prompt: 'จับคู่สระสั้น–ยาว', hint: 'อิ/อี · อุ/อู · เอะ/เอ', answer: 'อิ↔อี · อุ↔อู · เอะ↔เอ' },
  { type: 'tone', prompt: 'บอกวรรณยุกต์ในคำ “ม้า”', hint: 'ม้า', answer: 'ไม้โท' },
];

const grammarItems = [
  { type: 'noun', prompt: 'ขีดเส้นใต้นามทุกคำ', text: 'แมวนอนบนเสื่อ', answer: 'แมว · เสื่อ' },
  { type: 'verb', prompt: 'ขีดเส้นใต้กริยา', text: 'เด็ก ๆ วิ่งเล่นในสนาม', answer: 'วิ่งเล่น' },
  { type: 'adj', prompt: 'หาคุณศัพท์และบอกคำที่ถูกขยาย', text: 'ดอกไม้สีแดงบานสะพรั่ง', answer: 'สีแดง ขยายดอกไม้' },
  { type: 'adv', prompt: 'หาวิเศษณ์และบอกหน้าที่', text: 'นกบินสูงเหนือต้นไม้', answer: 'สูง · บอกอาการของกริยาบิน' },
  { type: 'prep', prompt: 'หาบุพบทและคำที่ตามมา', text: 'หนังสืออยู่บนโต๊ะ', answer: 'บน + โต๊ะ' },
  { type: 'conj', prompt: 'หาสันธานและความสัมพันธ์', text: 'ฝนตกจึงถนนลื่น', answer: 'จึง · แสดงผล' },
  { type: 'mixed', prompt: 'จำแนกชนิดคำทีละคำ', text: 'น้องสาวอ่านหนังสืออย่างตั้งใจ', answer: 'นาม กริยา นาม วิเศษณ์' },
  { type: 'noun', prompt: 'แต่งประโยคที่มีนามอย่างน้อย 2 คำ', text: 'ใช้คำ: ครู / นักเรียน', answer: 'เช่น ครูชมนักเรียน' },
  { type: 'verb', prompt: 'เติมกริยาให้เหมาะ', text: 'ปลา___ในน้ำ', answer: 'ว่าย / ว่ายน้ำ' },
  { type: 'adj', prompt: 'เติมคุณศัพท์', text: 'ท้องฟ้า___หลังฝนตก', answer: 'เช่น สดใส / แจ่มใส' },
  { type: 'adv', prompt: 'เติมวิเศษณ์', text: 'นักเรียนอ่านหนังสือ___', answer: 'เช่น อย่างตั้งใจ / ช้า ๆ' },
  { type: 'prep', prompt: 'เติมบุพบท', text: 'ดินสออยู่ใน___', answer: 'เช่น กล่อง / กระเป๋า' },
  { type: 'conj', prompt: 'เชื่อมประโยคด้วยสันธาน', text: 'อากาศร้อน / อยากดื่มน้ำ', answer: 'เช่น อากาศร้อนจึงอยากดื่มน้ำ' },
  { type: 'noun', prompt: 'หาคำนามเฉพาะ', text: 'ครูสมชายสอนวิชาคณิตศาสตร์', answer: 'สมชาย' },
  { type: 'verb', prompt: 'เปลี่ยนกริยาให้เป็นอดีตในความหมาย', text: 'ฉันกินข้าว', answer: 'เช่น ฉันกินข้าวแล้ว' },
  { type: 'mixed', prompt: 'วงนามและขีดกริยา', text: 'แม่หุงข้าวในครัว', answer: 'นาม: แม่ ข้าว ครัว · กริยา: หุง' },
  { type: 'adj', prompt: 'หาคุณศัพท์ 2 คำ', text: 'รถคันสีแดงวิ่งเร็วมาก', answer: 'สีแดง · เร็ว' },
  { type: 'conj', prompt: 'เลือกสันธานที่เหมาะ', text: 'อยากไปเที่ยว ___ ฝนตกหนัก', answer: 'แต่ / แต่เนื่องจาก' },
];

const idiomItems = [
  { type: 'animal', prompt: 'อธิบายความหมายและแต่งประโยค', idiom: 'เอาหูไปนา เอาตาไปไร่', literal: 'เอาหูไปนาและเอาตาไปไร่', answer: 'ไม่สนใจ / ไม่ใส่ใจ' },
  { type: 'life', prompt: 'อธิบายและยกสถานการณ์ใช้', idiom: 'น้ำขึ้นให้รีบตัก', literal: 'ตักน้ำตอนน้ำขึ้น', answer: 'ฉวยโอกาสเมื่อสถานการณ์ดี' },
  { type: 'proverb', prompt: 'อธิบายด้วยคำของตนเอง', idiom: 'ช้า ๆ ได้พร้าเล่มงาม', literal: 'ทำช้าแล้วได้พร้าสวย', answer: 'ทำอย่างรอบคอบได้ผลดี' },
  { type: 'animal', prompt: 'จับคู่ความหมาย', idiom: 'ปิดทองหลังพระ', literal: 'ปิดทองด้านหลังพระ', answer: 'ทำดีโดยไม่ต้องการคำชม' },
  { type: 'life', prompt: 'อธิบายสถานการณ์', idiom: 'ตกกระไดพลอยโจน', literal: 'ตกลงไปกับกระได', answer: 'พลอยทำตามโดยไม่ตั้งใจ' },
  { type: 'proverb', prompt: 'บอกบทเรียนจากสำนวน', idiom: 'คบคนพาลพาลพาไปหาผิด', literal: 'คบคนพาลแล้วพาไปผิด', answer: 'คบเพื่อนไม่ดีอาจเสียหาย' },
  { type: 'animal', prompt: 'แต่งประโยคในโรงเรียน', idiom: 'นกน้อยทำรังแต่พอตัว', literal: 'นกทำรังเล็กพอตัว', answer: 'อยู่อย่างพอเพียงตามกำลัง' },
  { type: 'life', prompt: 'เลือกสำนวนที่เหมาะ', idiom: 'พยายามทบทวนก่อนสอบ', literal: '—', answer: 'เช่น ขยันไขว่คว้า / ขยันไว้ตัว' },
  { type: 'mixed', prompt: 'แยกความหมายตรงกับโดยนัย', idiom: 'หัวใจสลาย', literal: 'หัวใจพัง', answer: 'นัย: เสียใจมาก' },
  { type: 'proverb', prompt: 'อธิบายและให้เหตุผล', idiom: 'รักพี่เสียดายน้อง', literal: 'รักพี่และเสียดายน้อง', answer: 'ลังเลเลือกระหว่างสองทาง' },
  { type: 'animal', prompt: 'อธิบายสำนวน', idiom: 'วัวหายล้อมคอก', literal: 'ล้อมคอกหลังวัวหาย', answer: 'แก้ปัญหาหลังเกิดเหตุแล้ว' },
  { type: 'life', prompt: 'แต่งประโยคใช้สำนวน', idiom: 'สู้เพื่ออนาคต', literal: '—', answer: 'เช่น ขยันไขว่คว้าเพื่ออนาคต' },
  { type: 'proverb', prompt: 'บอกสถานการณ์ใช้', idiom: 'พูดไปสองไพเบี้ย นิ่งเสียตำลึงทอง', literal: 'พูดเสียสองไพ นิ่งได้ตำลึง', answer: 'บางครั้งนิ่งไว้ดีกว่าพูด' },
  { type: 'mixed', prompt: 'แยกตรง/นัย', idiom: 'หน้าดำคร่ำเครียด', literal: 'หน้าดำ', answer: 'นัย: กังวลหรือเครียดมาก' },
  { type: 'life', prompt: 'อธิบายสำนวน', idiom: 'ยื่นแมวให้วัน', literal: 'ให้แมวแก่คนชื่อวัน', answer: 'มอบสิ่งให้คนที่ไม่เหมาะ' },
  { type: 'animal', prompt: 'อธิบายและยกตัวอย่าง', idiom: 'เสือซ่อนเล็บ', literal: 'เสือซ่อนเล็บไว้', answer: 'คนเก่งแต่ไม่โอ้อวด' },
  { type: 'proverb', prompt: 'สรุปข้อคิด', idiom: 'ทำดีได้ดี ทำชั่วได้ชั่ว', literal: 'ทำดีได้ผลดี', answer: 'ผลลัพธ์ตามการกระทำ' },
  { type: 'mixed', prompt: 'แยกตรง/นัย', idiom: 'ไฟไหม้ฟาง', literal: 'ไฟไหม้กองฟาง', answer: 'นัย: โกรธง่าย/รุนแรงเร็ว' },
];

const punctItems = [
  { type: 'question', prompt: 'เติมเครื่องหมายและอธิบายหน้าที่', text: 'หนูชื่ออะไร', answer: 'หนูชื่ออะไร? · ใช้เมื่อถาม' },
  { type: 'exclaim', prompt: 'เติมเครื่องหมายและบอกอารมณ์', text: 'สุดยอดมาก', answer: 'สุดยอดมาก! · ดีใจ/ทึ่ง' },
  { type: 'dash', prompt: 'ใช้ขีดช่วยความหมาย', text: 'เปิด ปิด ประตูให้ถูกวิธี', answer: 'เปิด–ปิดประตูให้ถูกวิธี' },
  { type: 'paren', prompt: 'ใส่วงเล็บข้อมูลเสริม', text: 'ครูสมชาย ครูประจำชั้นป.4 มาแล้ว', answer: 'ครูสมชาย (ครูประจำชั้นป.4) มาแล้ว' },
  { type: 'quote', prompt: 'ใส่เครื่องหมายคำพูด', text: 'แม่บอก ให้ทำการบ้านก่อน', answer: 'แม่บอก “ให้ทำการบ้านก่อน”' },
  { type: 'mixed', prompt: 'แก้เครื่องหมายทั้งประโยค', text: 'ใครไปบ้าง น้องสาว พี่ชาย และฉัน', answer: 'ใครไปบ้าง? น้องสาว พี่ชาย และฉัน' },
  { type: 'question', prompt: 'เขียนประโยคคำถาม 2 ประโยค', text: 'เกี่ยวกับโรงเรียน', answer: 'เช่น โรงเรียนเปิดกี่โมง?' },
  { type: 'exclaim', prompt: 'เขียนประโยคแสดงความประหลาดใจ', text: 'เหตุการณ์ในห้องเรียน', answer: 'เช่น คะแนนเต็มแล้ว!' },
  { type: 'paren', prompt: 'เพิ่มข้อมูลในวงเล็บ', text: 'พรุ่งนี้มีการสอบวิชาคณิตศาสตร์', answer: 'พรุ่งนี้มีการสอบ (วิชาคณิตศาสตร์)' },
  { type: 'dash', prompt: 'ใช้ขีดแสดงช่วงเวลา', text: 'เรียนเวลา 08.30 ถึง 15.30', answer: 'เรียนเวลา 08.30–15.30' },
  { type: 'quote', prompt: 'ใส่คำพูดของตัวละคร', text: 'ครูกล่าว ตั้งใจเรียนนะ', answer: 'ครูกล่าว “ตั้งใจเรียนนะ”' },
  { type: 'mixed', prompt: 'เติมเครื่องหมายที่หายไป', text: 'วันนี้อากาศดีจัง', answer: 'วันนี้อากาศดีจัง!' },
  { type: 'question', prompt: 'เปลี่ยนเป็นประโยคคำถาม', text: 'หนูชอบวิชาคณิตศาสตร์', answer: 'หนูชอบวิชาคณิตศาสตร์ไหม?' },
  { type: 'exclaim', prompt: 'เปลี่ยนเป็นประโยคอุทาน', text: 'ของเล่นชิ้นนี้สวย', answer: 'ของเล่นชิ้นนี้สวยจัง!' },
  { type: 'paren', prompt: 'ใส่วงเล็บชื่อย่อ', text: 'องค์การสหประชาชาติ UN', answer: 'องค์การสหประชาชาติ (UN)' },
  { type: 'dash', prompt: 'ใช้ขีดคั่นรายการสั้น', text: 'สีที่ใช้ แดง เขียว น้ำเงิน', answer: 'สีที่ใช้: แดง–เขียว–น้ำเงิน หรือ แดง เขียว น้ำเงิน' },
  { type: 'mixed', prompt: 'แก้ประโยคให้ถูกวรรคตอน', text: 'คุณครูถาม ใครทำการบ้านเสร็จแล้ว', answer: 'คุณครูถาม “ใครทำการบ้านเสร็จแล้ว?”' },
  { type: 'quote', prompt: 'แยกคำพูดกับคำเล่า', text: 'พี่ชายบอกพรุ่งนี้ไปเที่ยวทะเล', answer: 'พี่ชายบอก “พรุ่งนี้ไปเที่ยวทะเล”' },
];

const sentenceItems = [
  { type: 'subject', prompt: 'ขีดเส้นใต้ประธานและบอกชนิด', text: 'นักเรียนทำการบ้าน', answer: 'นักเรียน · นาม' },
  { type: 'verb', prompt: 'หาภาคแสดง', text: 'แมววิ่งไล่หนู', answer: 'วิ่งไล่หนู' },
  { type: 'object', prompt: 'หากรรมของกริยา', text: 'แม่หุงข้าว', answer: 'ข้าว · กรรมของหุง' },
  { type: 'expand', prompt: 'ขยายด้วยสถานที่/เวลา', text: 'เด็กอ่านหนังสือ', answer: 'เช่น เด็กอ่านหนังสือที่ห้องสมุดตอนเย็น' },
  { type: 'compound', prompt: 'รวมสองประโยคด้วยคำเชื่อม', text: 'ฝนตก / ถนนลื่น', answer: 'ฝนตกจึงถนนลื่น' },
  { type: 'order', prompt: 'เรียงคำให้เป็นประโยค', text: 'สนาม / ใน / เล่น / เด็ก', answer: 'เด็กเล่นในสนาม' },
  { type: 'subject', prompt: 'แต่งประโยคที่มีประธานชัด', text: 'ใช้กริยา: ช่วยเหลือ', answer: 'เช่น เพื่อนช่วยเหลือกัน' },
  { type: 'expand', prompt: 'เติมส่วนขยาย', text: 'นกบิน', answer: 'เช่น นกบินเหนือต้นไม้สูง' },
  { type: 'compound', prompt: 'เขียนประโยคเหตุ–ผล', text: 'เหตุ–ผล', answer: 'เช่น เพราะฝนตก เราจึงอยู่บ้าน' },
  { type: 'order', prompt: 'แก้ลำดับคำ', text: 'หนังสือ อ่าน น้องสาว', answer: 'น้องสาวอ่านหนังสือ' },
  { type: 'subject', prompt: 'แยกประธานออกจากภาคแสดง', text: 'นักเรียนชั้นป.4 ร้องเพลง', answer: 'ประธาน: นักเรียนชั้นป.4' },
  { type: 'object', prompt: 'เติมกรรมให้สมบูรณ์', text: 'ครูตรวจ___', answer: 'เช่น สมุด / การบ้าน' },
  { type: 'verb', prompt: 'เปลี่ยนภาคแสดงให้อ่านลื่น', text: 'แมวบนหลังคา', answer: 'เช่น แมวนอนบนหลังคา' },
  { type: 'expand', prompt: 'ขยายด้วยคำคุณศัพท์', text: 'ดอกไม้บาน', answer: 'เช่น ดอกไม้สีชมพูบานสะพรั่ง' },
  { type: 'compound', prompt: 'เชื่อมด้วย “และ/แต่/จึง”', text: 'อยากเล่น / ต้องทำการบ้านก่อน', answer: 'อยากเล่นแต่ต้องทำการบ้านก่อน' },
  { type: 'order', prompt: 'เรียงใหม่ให้ถูก', text: 'ทุกวัน / อ่านหนังสือ / น้องชาย', answer: 'น้องชายอ่านหนังสือทุกวัน' },
  { type: 'object', prompt: 'ระบุประธาน กริยา กรรม', text: 'พ่อซื้อผลไม้', answer: 'พ่อ / ซื้อ / ผลไม้' },
  { type: 'subject', prompt: 'เขียนประโยค 2 ประโยคคนละประธาน', text: 'เกี่ยวกับโรงเรียน', answer: 'เช่น ครูสอน / นักเรียนเรียน' },
];

sheet({
  file: 'thai-script-hub-worksheet.html',
  hub: '/games/thai/thai-script-hub/index.html',
  indicators: ['ท 4.1 ป.1/1', 'ท 4.1 ป.2/1', 'ท 4.1 ป.4/1'],
  icon: '🔤', title: 'ใบงานคลังอักษรไทย', gradeLabel: 'ป.1–ป.4', mediaLabel: 'คลังอักษรไทย',
  directions: 'จัดกลุ่มพยัญชนะ วิเคราะห์สระ–วรรณยุกต์ และอธิบายเหตุผล',
  topicOptions: '<option value="mixed">ผสมทุกทักษะ</option><option value="mid">พยัญชนะกลาง</option><option value="high">พยัญชนะสูง</option><option value="low">พยัญชนะต่ำ</option><option value="vowel">สระ</option><option value="tone">วรรณยุกต์</option><option value="lead">อักษรนำ</option><option value="matra">มาตรา</option>',
  items: scriptItems,
  renderBody: `const e=window.KampaiTopicWorksheet.escapeHtml;
    return '<div class="q-prompt">'+e(item.prompt)+'</div>'
      +'<div class="q-context">คำใบ้: '+e(item.hint)+'</div>'
      +'<table class="mini-table thai-script-grid"><tr><th>หมู่พยัญชนะ</th><th>สระ</th><th>วรรณยุกต์</th></tr>'
      +'<tr><td>________</td><td>________</td><td>________</td></tr></table>'
      +'<div>ตัวอย่างคำ / การวิเคราะห์</div><div class="work-line"></div><div class="work-line"></div>'
      +'<div>เหตุผลสั้น ๆ</div><div class="reason-line"></div>'
      +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';`,
});

sheet({
  file: 'thai-grammar-hub-worksheet.html',
  hub: '/games/thai/thai-grammar-hub/index.html',
  indicators: ['ท 4.1 ป.4/2', 'ท 4.1 ป.4/6', 'ท 4.1 ป.5/2'],
  icon: '📘', title: 'ใบงานคลังไวยากรณ์ไทย', gradeLabel: 'ป.4–ป.5', mediaLabel: 'คลังไวยากรณ์ไทย',
  directions: 'จำแนกชนิดของคำ ขีดเส้นใต้ และแต่งประโยคสั้น',
  topicOptions: '<option value="mixed">ผสมทุกทักษะ</option><option value="noun">นาม</option><option value="verb">กริยา</option><option value="adj">คุณศัพท์</option><option value="adv">วิเศษณ์</option><option value="prep">บุพบท</option><option value="conj">สันธาน</option>',
  items: grammarItems,
  renderBody: `const e=window.KampaiTopicWorksheet.escapeHtml;
    return '<div class="q-prompt">'+e(item.prompt)+'</div>'
      +'<div class="q-context">“'+e(item.text)+'”</div>'
      +'<div class="classify-grid word-types-grid">'
      +'<div class="classify-box">[ ] นาม</div><div class="classify-box">[ ] กริยา</div>'
      +'<div class="classify-box">[ ] คุณศัพท์</div><div class="classify-box">[ ] อื่น ๆ</div></div>'
      +'<div>ขีดเส้นใต้ / ระบุชนิดคำ</div><div class="work-line"></div>'
      +'<div>เหตุผลสั้น ๆ</div><div class="reason-line"></div>'
      +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';`,
});

sheet({
  file: 'thai-idiom-hub-worksheet.html',
  hub: '/games/thai/thai-idiom-hub/index.html',
  indicators: ['ท 1.1 ป.4/2', 'ท 1.1 ป.5/2'],
  icon: '💬', title: 'ใบงานคลังสำนวนไทย', gradeLabel: 'ป.4–ป.6', mediaLabel: 'คลังสำนวนไทย',
  directions: 'แยกความหมายตรงกับโดยนัย ใช้ในประโยค และบอกสถานการณ์',
  topicOptions: '<option value="mixed">ผสมทุกทักษะ</option><option value="animal">สำนวนสัตว์</option><option value="life">ชีวิตประจำวัน</option><option value="proverb">สุภาษิต</option>',
  items: idiomItems,
  renderBody: `const e=window.KampaiTopicWorksheet.escapeHtml;
    return '<div class="q-prompt">'+e(item.prompt)+'</div>'
      +'<div class="q-context idiom-case">สำนวน: “'+e(item.idiom)+'”</div>'
      +'<div>ความหมายตรง</div><div class="work-line"></div>'
      +'<div>ความหมายโดยนัย</div><div class="evidence-line"></div>'
      +'<div>สถานการณ์ใช้ / ประโยคตัวอย่าง</div><div class="reason-line"></div><div class="reason-line"></div>'
      +'<span class="teacher-answer">เฉลย: '+e(item.answer)+(item.literal?' · ตรง: '+e(item.literal):'')+'</span>';`,
});

sheet({
  file: 'thai-punctuation-hub-worksheet.html',
  hub: '/games/thai/thai-punctuation-hub/index.html',
  indicators: ['ท 2.1 ป.3/1', 'ท 2.1 ป.4/1'],
  icon: '✒️', title: 'ใบงานเครื่องหมายวรรคตอน', gradeLabel: 'ป.3–ป.5', mediaLabel: 'เครื่องหมายวรรคตอน',
  directions: 'เติมเครื่องหมายวรรคตอน อธิบายหน้าที่ และแก้ประโยค',
  topicOptions: '<option value="mixed">ผสมทุกทักษะ</option><option value="question">เครื่องหมายคำถาม</option><option value="exclaim">เครื่องหมายอัศเจรีย์</option><option value="dash">ขีด</option><option value="paren">วงเล็บ</option><option value="quote">คำพูด</option>',
  items: punctItems,
  renderBody: `const e=window.KampaiTopicWorksheet.escapeHtml;
    return '<div class="q-prompt">'+e(item.prompt)+'</div>'
      +'<div class="q-context">'+e(item.text)+'</div>'
      +'<div class="classify-grid thai-punct-grid">'
      +'<div class="classify-box">เติมเครื่องหมาย: ______</div>'
      +'<div class="classify-box">หน้าที่: ____________</div></div>'
      +'<div>ประโยคที่แก้แล้ว</div><div class="work-line"></div><div class="work-line"></div>'
      +'<div>อธิบายสั้น ๆ</div><div class="reason-line"></div>'
      +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';`,
});

sheet({
  file: 'thai-sentence-hub-worksheet.html',
  hub: '/games/thai/thai-sentence-hub/index.html',
  indicators: ['ท 4.1 ป.3/4', 'ท 4.1 ป.5/2'],
  icon: '🧩', title: 'ใบงานคลังประโยคไทย', gradeLabel: 'ป.3–ป.5', mediaLabel: 'คลังประโยคไทย',
  directions: 'แยกประธาน กริยา กรรม ขยาย และเรียงประโยคให้สมบูรณ์',
  topicOptions: '<option value="mixed">ผสมทุกทักษะ</option><option value="subject">ประธาน</option><option value="verb">ภาคแสดง</option><option value="object">กรรม</option><option value="expand">ขยายประโยค</option><option value="compound">ประโยคเชื่อม</option><option value="order">เรียงคำ</option>',
  items: sentenceItems,
  renderBody: `const e=window.KampaiTopicWorksheet.escapeHtml;
    return '<div class="q-prompt">'+e(item.prompt)+'</div>'
      +'<div class="q-context sentence-case">'+e(item.text)+'</div>'
      +'<div class="classify-grid sentence-slot-grid">'
      +'<div class="classify-box">ประธาน: ________</div>'
      +'<div class="classify-box">กริยา: ________</div>'
      +'<div class="classify-box">กรรม: ________</div>'
      +'<div class="classify-box">ส่วนขยาย: ________</div></div>'
      +'<div>ประโยคที่สมบูรณ์</div><div class="work-line"></div><div class="work-line"></div>'
      +'<div>เหตุผล / วิธีจัดเรียง</div><div class="reason-line"></div>'
      +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';`,
});
