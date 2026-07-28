#!/usr/bin/env node
/** Generate Batch 13: paired worksheets for Media Y/Z/AA */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const V = '1.191.0';

function sheet({ dir, file, hub, subject, indicators, icon, title, gradeLabel, mediaLabel, directions, topicOptions, items, renderBody, scaffoldClass }) {
  const html = `<!DOCTYPE html>
<html lang="th"><head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="worksheet-source-media" content="${hub}">
  <meta name="curriculum-indicators" content="${indicators.join(',')}">
  <title>${title} ${gradeLabel} — โรงเรียนบ้านคำไผ่</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet">
  <link href="/games/worksheet-topic.css?v=${V}" rel="stylesheet">
  <link href="/games/worksheet-modes.css?v=${V}" rel="stylesheet">
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
<script src="/games/qrcode-generator.min.js?v=${V}"></script>
<script src="/games/kampai-qr.js?v=${V}"></script>
<script src="/games/worksheet-runtime.js?v=${V}"></script>
<script>
const ITEMS=${JSON.stringify(items)};
window.WORKSHEET_CONFIG={
  icon:'${icon}',title:'${title}',subject:'${subject}',gradeLabel:'${gradeLabel}',
  mediaLabel:'${mediaLabel}',sourceMediaUrl:'${hub}',
  indicators:${JSON.stringify(indicators)},
  directions:${JSON.stringify(directions)},
  getItems(topic){return topic==='mixed'?ITEMS:ITEMS.filter(item=>item.type===topic);},
  renderQuestion(item){${renderBody}}
};
</script>
<script src="/games/worksheet-topic.js?v=${V}"></script>
<script>
function render(){window.KampaiTopicWorksheet.render();}
document.getElementById('btnRandom').onclick=window.KampaiTopicWorksheet.randomize;
document.getElementById('btnAnswers').onclick=()=>document.body.classList.toggle('show-answers');
document.getElementById('btnPrint').onclick=()=>window.print();
window.KampaiWorksheet.loadTeachers();
render();
</script>
<script src="/games/worksheet-modes.js?v=${V}"></script>
</body></html>
`;
  writeFileSync(resolve(root, 'public/games', dir, file), html, 'utf8');
  console.log('wrote', dir + '/' + file, 'items', items.length, scaffoldClass || '');
}

const esc = "window.KampaiTopicWorksheet.escapeHtml";

// —— 1 clock ——
sheet({
  dir: 'math', file: 'clock-media-worksheet.html', hub: '/games/math/clock-media.html',
  subject: 'คณิตศาสตร์', indicators: ['ค 2.1 ป.2/1', 'ค 2.1 ป.3/2', 'ค 2.1 ป.4/1'],
  icon: '🕐', title: 'ใบงานนาฬิกาบอกเวลา', gradeLabel: 'ป.1–ป.4', mediaLabel: 'สื่อนาฬิกา',
  directions: 'ดูเข็มนาฬิกาหรือโจทย์ แล้วตอบเวลา / วาดเข็ม · แสดงวิธีคิดสั้น ๆ',
  topicOptions: '<option value="mixed">รวม</option><option value="read">อ่านเวลา</option><option value="draw">วาดเข็ม</option><option value="word">โจทย์สถานการณ์</option>',
  scaffoldClass: 'clock-ws-grid',
  items: [
    { type: 'read', prompt: 'เข็มสั้นชี้ 3 เข็มยาวชี้ 12', answer: '3:00' },
    { type: 'read', prompt: 'เข็มสั้นชี้ 9 เข็มยาวชี้ 6', answer: '9:30' },
    { type: 'read', prompt: 'เข็มสั้นใกล้ 2 เข็มยาวชี้ 3', answer: '2:15' },
    { type: 'read', prompt: 'เข็มสั้นใกล้ 7 เข็มยาวชี้ 9', answer: '7:45' },
    { type: 'draw', prompt: 'วาดเข็มให้เป็น 4:00', answer: 'สั้นชี้ 4 · ยาวชี้ 12' },
    { type: 'draw', prompt: 'วาดเข็มให้เป็น 10:30', answer: 'สั้นระหว่าง 10–11 · ยาวชี้ 6' },
    { type: 'draw', prompt: 'วาดเข็มให้เป็น 1:15', answer: 'สั้นเลย 1 นิด · ยาวชี้ 3' },
    { type: 'word', prompt: 'โรงเรียนเริ่ม 8:00 น. มาถึงช้า 15 นาที ถึงกี่โมง', answer: '8:15' },
    { type: 'word', prompt: 'เล่น 30 นาที จาก 3:00 จบเมื่อไร', answer: '3:30' },
    { type: 'read', prompt: 'เขียนคำว่า "ครึ่ง" สำหรับ 6:30', answer: 'หกโมงครึ่ง / 18:30 (บริบท)' },
    { type: 'word', prompt: 'จาก 2:00 ถึง 2:45 ผ่านไปกี่นาที', answer: '45 นาที' },
    { type: 'draw', prompt: 'วาดเข็ม 12:00', answer: 'สั้นและยาวชี้ 12' },
    { type: 'read', prompt: 'เข็มยาวชี้ 12 หมายถึงนาทีเท่าไร', answer: '0 นาที / ตรง' },
    { type: 'word', prompt: 'นอน 9:00 ตื่นหลัง 8 ชม. ตื่นกี่โมง', answer: '5:00' },
    { type: 'read', prompt: '3:00 เรียกว่าเศษหนึ่งส่วนสี่ของชั่วโมงถัดไปเมื่อไร', answer: '3:15' },
    { type: 'draw', prompt: 'วาดเข็ม 5:45', answer: 'สั้นใกล้ 6 · ยาวชี้ 9' },
    { type: 'word', prompt: 'สอบยาว 1 ชม. เริ่ม 9:30 จบเมื่อไร', answer: '10:30' },
    { type: 'read', prompt: 'เข็มสั้นชี้ 11 เข็มยาวชี้ 12', answer: '11:00' },
  ],
  renderBody: `const e=${esc};return '<div class="clock-ws-grid work-line"><div class="prompt"><strong>'+e(item.prompt)+'</strong></div><div class="answer-line">คำตอบ <span class="blank long"></span></div><div class="reason-line">วิธีคิด <span class="blank long"></span></div><div class="answer teacher-answer">เฉลย: '+e(item.answer)+'</div></div>';`,
});

// —— 2 money ——
sheet({
  dir: 'math', file: 'thai-money-media-worksheet.html', hub: '/games/math/thai-money-media.html',
  subject: 'คณิตศาสตร์', indicators: ['ค 2.1 ป.3/1'],
  icon: '🪙', title: 'ใบงานเงินไทย', gradeLabel: 'ป.1–ป.3', mediaLabel: 'สื่อเงินไทย',
  directions: 'นับเงิน ทอนเงิน หรือเลือกว่าใช้ธนบัตร/เหรียญใด · เขียนวิธีคิด',
  topicOptions: '<option value="mixed">รวม</option><option value="count">นับยอด</option><option value="change">ทอนเงิน</option><option value="choose">เลือกจ่าย</option>',
  items: [
    { type: 'count', prompt: 'เหรียญ 10 บาท 3 เหรียญ + 5 บาท 2 เหรียญ', answer: '40 บาท' },
    { type: 'count', prompt: 'ธนบัตร 20 + เหรียญ 10 + เหรียญ 1 สองเหรียญ', answer: '32 บาท' },
    { type: 'count', prompt: '50 บาท สองใบ + 10 บาท หนึ่งเหรียญ', answer: '110 บาท' },
    { type: 'change', prompt: 'ซื้อของ 27 บาท จ่าย 50 ทอนเท่าไร', answer: '23 บาท' },
    { type: 'change', prompt: 'ซื้อของ 45 บาท จ่าย 100 ทอนเท่าไร', answer: '55 บาท' },
    { type: 'change', prompt: 'ซื้อของ 8 บาท จ่าย 20 ทอนเท่าไร', answer: '12 บาท' },
    { type: 'choose', prompt: 'ต้องการ 15 บาท ใช้เหรียญใดได้บ้าง (อย่างน้อย 1 วิธี)', answer: 'เช่น 10+5 หรือ 5×3' },
    { type: 'choose', prompt: 'ต้องการ 60 บาท โดยไม่ใช้ธนบัตร 100', answer: 'เช่น 50+10 หรือ 20×3' },
    { type: 'count', prompt: 'เหรียญ 5 บาท 6 เหรียญ', answer: '30 บาท' },
    { type: 'change', prompt: 'ซื้อดินสอ 12 บาท จ่าย 20 ทอน', answer: '8 บาท' },
    { type: 'count', prompt: '100 บาท + 20 บาท + 5 บาท', answer: '125 บาท' },
    { type: 'choose', prompt: 'จ่ายค่าขนม 35 บาท ให้พอดีที่สุดด้วยธนบัตร/เหรียญ', answer: 'เช่น 20+10+5' },
    { type: 'change', prompt: 'ซื้อหนังสือ 75 จ่าย 100 ทอน', answer: '25 บาท' },
    { type: 'count', prompt: 'เหรียญ 1 บาท 15 เหรียญ + เหรียญ 10 สองเหรียญ', answer: '35 บาท' },
    { type: 'choose', prompt: 'มีเงิน 40 บาท ซื้อของ 28 เหลือเท่าไร', answer: '12 บาท' },
    { type: 'count', prompt: 'ธนบัตร 20 สามใบ', answer: '60 บาท' },
    { type: 'change', prompt: 'ซื้อนม 18 จ่าย 50 ทอน', answer: '32 บาท' },
    { type: 'choose', prompt: 'อธิบายว่าทำไมควรตรวจเงินทอน', answer: 'เพื่อไม่ให้ทอนผิด / ฝึกความรับผิดชอบ' },
  ],
  renderBody: `const e=${esc};return '<div class="money-ws-grid work-line calc-line"><div class="prompt"><strong>'+e(item.prompt)+'</strong></div><div class="answer-line">คำตอบ <span class="blank long"></span></div><div class="reason-line">วิธีคิด / เหรียญที่ใช้ <span class="blank long"></span></div><div class="answer teacher-answer">เฉลย: '+e(item.answer)+'</div></div>';`,
});

// —— 3 geometry ——
sheet({
  dir: 'math', file: 'geometry-3d-media-worksheet.html', hub: '/games/math/geometry-3d-media.html',
  subject: 'คณิตศาสตร์', indicators: ['ค 2.2 ป.5/4', 'ค 2.2 ป.6/3', 'ค 2.2 ป.6/4'],
  icon: '🧊', title: 'ใบงานเรขาคณิต 2D/3D', gradeLabel: 'ป.4–ป.6', mediaLabel: 'สื่อเรขา 2D/3D',
  directions: 'นับหน้า ขอบ จุดยอด หรือตอบเกี่ยวกับรูปคลี่ · เขียนเหตุผลสั้น ๆ',
  topicOptions: '<option value="mixed">รวม</option><option value="count">นับส่วน</option><option value="net">รูปคลี่</option><option value="name">ชื่อทรง</option>',
  items: [
    { type: 'count', prompt: 'ลูกบาศก์มีกี่หน้า', answer: '6' },
    { type: 'count', prompt: 'ลูกบาศก์มีกี่ขอบ', answer: '12' },
    { type: 'count', prompt: 'ลูกบาศก์มีกี่จุดยอด', answer: '8' },
    { type: 'count', prompt: 'พีระมิดฐานสี่เหลี่ยมมีกี่หน้า', answer: '5' },
    { type: 'count', prompt: 'ปริซึมฐานสามเหลี่ยมมีกี่จุดยอด', answer: '6' },
    { type: 'net', prompt: 'รูปคลี่ลูกบาศก์เป็นรูปอะไรกี่ชิ้น', answer: 'จัตุรัส 6 ชิ้น' },
    { type: 'net', prompt: 'รูปคลี่ทรงกระบอกมีอะไรบ้าง', answer: 'สี่เหลี่ยมผืนผ้า + วงกลม 2' },
    { type: 'name', prompt: 'ทรงที่มีผิวโค้งอย่างเดียว ไม่มีขอบตรง', answer: 'ทรงกลม' },
    { type: 'name', prompt: 'กล่องรองเท้าใกล้เคียงทรงใด', answer: 'ปริซึมสี่เหลี่ยมมุมฉาก' },
    { type: 'count', prompt: 'ทรงกรวยมีจุดยอดกี่จุด', answer: '1' },
    { type: 'count', prompt: 'ตรวจออยเลอร์ลูกบาศก์: หน้า+จุดยอด กับ ขอบ+2', answer: '6+8=12+2 ✓' },
    { type: 'name', prompt: 'สี่เหลี่ยมจัตุรัสเป็นกี่มิติ', answer: '2 มิติ' },
    { type: 'net', prompt: 'ทำไมทรงกลมกางเป็นแผ่นแบนยาก', answer: 'ผิวโค้งทั้งหมด' },
    { type: 'count', prompt: 'พีระมิดฐานสี่เหลี่ยมมีกี่ขอบ', answer: '8' },
    { type: 'name', prompt: 'กระป๋องน้ำอัดลมใกล้เคียงทรงใด', answer: 'ทรงกระบอก' },
    { type: 'count', prompt: 'ปริซึมสี่เหลี่ยมมุมฉากมีกี่หน้า', answer: '6' },
    { type: 'net', prompt: 'วาดคร่าว ๆ รูปคลี่ลูกบาศก์แบบกากบาท', answer: 'ตามสื่อ · 6 ช่อง' },
    { type: 'name', prompt: 'กรวยไอศกรีมใกล้เคียงทรงใด', answer: 'ทรงกรวย' },
  ],
  renderBody: `const e=${esc};return '<div class="geometry-ws-grid calc-line reason-line"><div class="prompt"><strong>'+e(item.prompt)+'</strong></div><div class="answer-line">คำตอบ <span class="blank long"></span></div><div class="reason-line">เหตุผล / สูตรจำ <span class="blank long"></span></div><div class="answer teacher-answer">เฉลย: '+e(item.answer)+'</div></div>';`,
});

// —— 4 brush ——
sheet({
  dir: 'health', file: 'brush-teeth-media-worksheet.html', hub: '/games/health/brush-teeth-media.html',
  subject: 'สุขศึกษา', indicators: ['พ 4.1 ป.3/4'],
  icon: '🪥', title: 'ใบงานแปรงฟันถูกวิธี', gradeLabel: 'ป.3', mediaLabel: 'สื่อแปรงฟัน',
  directions: 'เรียงลำดับขั้นตอน หรือตอบคำถามอนามัยช่องปาก · อธิบายเหตุผลสั้น ๆ',
  topicOptions: '<option value="mixed">รวม</option><option value="order">เรียงลำดับ</option><option value="why">เหตุผล</option><option value="habit">นิสัย</option>',
  items: [
    { type: 'order', prompt: 'ขั้นแรกก่อนแปรงฟันควรทำอะไร', answer: 'ล้างมือ / เตรียมแปรงและยาสีฟัน' },
    { type: 'order', prompt: 'ควรวางยาสีฟันประมาณเท่าไร', answer: 'ขนาดเมล็ดถั่ว / ไม่เยอะเกิน' },
    { type: 'order', prompt: 'แปรงซี่ฟันด้านนอกควรทำอย่างไร', answer: 'ถูขึ้น–ลง หรือวนเบา ๆ' },
    { type: 'why', prompt: 'ทำไมต้องแปรงลิ้นด้วย', answer: 'ลดเชื้อ/กลิ่นปาก' },
    { type: 'why', prompt: 'ทำไมไม่ควรกลืนยาสีฟัน', answer: 'มีฟลูออไรด์ กลืนมากไม่ดี' },
    { type: 'habit', prompt: 'ควรแปรงวันละกี่ครั้ง', answer: 'อย่างน้อย 2 ครั้ง' },
    { type: 'habit', prompt: 'ควรแปรงนานประมาณกี่นาที', answer: 'ประมาณ 2 นาที' },
    { type: 'order', prompt: 'หลังแปรงควรบ้วนน้ำอย่างไร', answer: 'บ้วนเบา ๆ ไม่ต้องแรงมาก' },
    { type: 'why', prompt: 'ทำไมต้องเปลี่ยนแปรงสีฟันเป็นระยะ', answer: 'ขนแปรงเสื่อม ทำความสะอาดได้น้อยลง' },
    { type: 'habit', prompt: 'กินขนมหวานแล้วควรรีบทำอะไร', answer: 'บ้วนปาก / แปรงเมื่อได้' },
    { type: 'order', prompt: 'เรียง 3 ขั้นสุดท้ายของการแปรง', answer: 'ตามสื่อ (เช่น ด้านใน→ลิ้น→บ้วน)' },
    { type: 'why', prompt: 'ทำไมแปรงแรง ๆ ไม่ดี', answer: 'ทำลายเหงือก/เคลือบฟัน' },
    { type: 'habit', prompt: 'ควรพบทันตแพทย์ประมาณปีละกี่ครั้ง', answer: 'อย่างน้อย 1–2 ครั้ง' },
    { type: 'order', prompt: 'ก่อนนอนควรแปรงฟันหรือไม่ เพราะเหตุใด', answer: 'ควร · ลดเชื้อตอนนอน' },
    { type: 'why', prompt: 'ใช้ไหมขัดฟันช่วยอะไร', answer: 'ทำความสะอาดซอกฟัน' },
    { type: 'habit', prompt: 'เขียนนิสัยดี 1 ข้อที่ตนเองจะทำ', answer: 'เช่น แปรงเช้า–ก่อนนอน' },
    { type: 'order', prompt: 'ตรวจลำดับ: ยาสีฟัน → แปรงซี่ → บ้วน ถูกต้องหรือไม่', answer: 'ถูกในภาพรวม (มีรายละเอียดเพิ่มได้)' },
    { type: 'why', prompt: 'น้ำลายช่วยปกป้องฟันอย่างไร (สั้น ๆ)', answer: 'ชะล้าง/มีแร่ธาตุช่วยปกป้อง' },
  ],
  renderBody: `const e=${esc};return '<div class="brush-ws-grid decision-box reason-line"><div class="prompt"><strong>'+e(item.prompt)+'</strong></div><div class="answer-line">คำตอบ <span class="blank long"></span></div><div class="reason-line">เหตุผล <span class="blank long"></span></div><div class="answer teacher-answer">เฉลย: '+e(item.answer)+'</div></div>';`,
});

// —— 5 light ——
sheet({
  dir: 'science', file: 'light-properties-media-worksheet.html', hub: '/games/science/light-properties-media.html',
  subject: 'วิทยาศาสตร์', indicators: ['ว 2.3 ป.4/1'],
  icon: '💡', title: 'ใบงานสมบัติของแสง', gradeLabel: 'ป.4', mediaLabel: 'สื่อสมบัติของแสง',
  directions: 'จำแนกวัตถุทึบแสง / ผ่านแสงบางส่วน / โปร่งใส · อธิบายเหตุผล',
  topicOptions: '<option value="mixed">รวม</option><option value="classify">จำแนก</option><option value="explain">อธิบาย</option><option value="shadow">เงา</option>',
  items: [
    { type: 'classify', prompt: 'ไม้บรรทัดเหล็กจัดเป็นประเภทใด', answer: 'ทึบแสง' },
    { type: 'classify', prompt: 'กระจกใสหน้าต่าง', answer: 'โปร่งใส' },
    { type: 'classify', prompt: 'กระดาษไข / พลาสติกขุ่น', answer: 'ผ่านแสงบางส่วน' },
    { type: 'classify', prompt: 'หนังสือเรียน', answer: 'ทึบแสง' },
    { type: 'explain', prompt: 'ทำไมมองทะลุน้ำสะอาดในแก้วได้', answer: 'น้ำ/แก้วโปร่งใส แสงผ่านได้' },
    { type: 'explain', prompt: 'ทำไมมองไม่ทะลุกำแพง', answer: 'ทึบแสง แสงผ่านไม่ได้' },
    { type: 'shadow', prompt: 'เงาเกิดเมื่อใด', answer: 'เมื่อวัตถุทึบแสงบังแสง' },
    { type: 'shadow', prompt: 'ถ้าไม่มีแสง จะมีเงาหรือไม่', answer: 'ไม่มี' },
    { type: 'classify', prompt: 'ถุงพลาสติกขุ่นใส่ของ', answer: 'ผ่านแสงบางส่วน' },
    { type: 'explain', prompt: 'แว่นตาเลนส์ใสช่วยให้เห็นได้อย่างไร', answer: 'แสงผ่านเลนส์โปร่งใสเข้าตา' },
    { type: 'shadow', prompt: 'ยิ่งใกล้แหล่งแสง เงามักเป็นอย่างไร', answer: 'ใหญ่ขึ้น (โดยทั่วไป)' },
    { type: 'classify', prompt: 'ผ้าม่านหนา', answer: 'ทึบแสง (หรือผ่านน้อยมาก)' },
    { type: 'explain', prompt: 'เขียนตัวอย่างวัตถุโปร่งใส 2 อย่าง', answer: 'เช่น แก้วใส อากาศ น้ำสะอาด' },
    { type: 'classify', prompt: 'กระจกเงา (สะท้อน) ต่างจากกระจกใสอย่างไร', answer: 'เงาสะท้อนแสง / ใสทะลุได้' },
    { type: 'shadow', prompt: 'ทำไมกลางคืนใต้โคมไฟมีเงา', answer: 'มีแหล่งแสงและวัตถุบัง' },
    { type: 'explain', prompt: 'กระดาษทิชชูเปียกแล้วยังทึบเท่าเดิมหรือไม่', answer: 'อาจผ่านแสงมากขึ้น (สังเกตได้)' },
    { type: 'classify', prompt: 'ขวดพลาสติกน้ำดื่มใส', answer: 'โปร่งใส' },
    { type: 'explain', prompt: 'สรุป 3 ประเภทการผ่านแสงสั้น ๆ', answer: 'ทึบ / ผ่านบางส่วน / โปร่งใส' },
  ],
  renderBody: `const e=${esc};return '<div class="light-ws-grid classify-grid reason-line"><div class="prompt"><strong>'+e(item.prompt)+'</strong></div><div class="answer-line">คำตอบ <span class="blank long"></span></div><div class="reason-line">เหตุผล <span class="blank long"></span></div><div class="answer teacher-answer">เฉลย: '+e(item.answer)+'</div></div>';`,
});

// —— 6 sight p123 ——
sheet({
  dir: 'english', file: 'sight-words-p123-media-worksheet.html', hub: '/games/english/sight-words-p123-media.html',
  subject: 'ภาษาอังกฤษ', indicators: ['ต 1.1 ป.1/2', 'ต 1.1 ป.2/2'],
  icon: '👁️', title: 'ใบงาน Sight Words ป.1–3', gradeLabel: 'ป.1–ป.3', mediaLabel: 'สื่อ Sight Words ป.1–3',
  directions: 'อ่านคำ วงคำ หรือเติมประโยค · เขียนความหมายสั้น ๆ',
  topicOptions: '<option value="mixed">รวม</option><option value="read">อ่านคำ</option><option value="fill">เติมประโยค</option><option value="mean">ความหมาย</option>',
  items: [
    { type: 'read', prompt: 'วงคำ: the · I · you', answer: 'อ่านออกเสียงได้' },
    { type: 'read', prompt: 'วงคำ: and · is · a', answer: 'อ่านออกเสียงได้' },
    { type: 'mean', prompt: 'คำว่า "go" แปลว่า', answer: 'ไป' },
    { type: 'mean', prompt: 'คำว่า "see" แปลว่า', answer: 'เห็น' },
    { type: 'fill', prompt: '___ am a student. (I/You)', answer: 'I' },
    { type: 'fill', prompt: 'This ___ a cat. (is/are)', answer: 'is' },
    { type: 'fill', prompt: 'I ___ to school. (go/see)', answer: 'go' },
    { type: 'mean', prompt: '"we" หมายถึง', answer: 'พวกเรา' },
    { type: 'read', prompt: 'เขียนคำ: can / like / have', answer: 'สะกดถูก' },
    { type: 'fill', prompt: 'I ___ apples. (like)', answer: 'like' },
    { type: 'mean', prompt: '"come" แปลว่า', answer: 'มา' },
    { type: 'fill', prompt: '___ you my friend? (Are/Is)', answer: 'Are' },
    { type: 'read', prompt: 'อ่านประโยค: I can see you.', answer: 'อ่านคล่อง' },
    { type: 'mean', prompt: '"play" แปลว่า', answer: 'เล่น' },
    { type: 'fill', prompt: 'We ___ happy. (are/is)', answer: 'are' },
    { type: 'read', prompt: 'จับคู่: me–ฉัน(กรรม) · my–ของฉัน', answer: 'ถูก' },
    { type: 'mean', prompt: '"look" แปลว่า', answer: 'มอง / ดู' },
    { type: 'fill', prompt: '___ is my book. (This/These)', answer: 'This' },
  ],
  renderBody: `const e=${esc};return '<div class="sight-p123-ws-grid sight-words-grid work-line reason-line"><div class="prompt"><strong>'+e(item.prompt)+'</strong></div><div class="sight-words-bank">คำที่เกี่ยวข้อง: the I you and is go see we can like</div><div class="answer-line">คำตอบ <span class="blank long"></span></div><div class="reason-line">ความหมาย / เหตุผล <span class="blank long"></span></div><div class="answer teacher-answer">เฉลย: '+e(item.answer)+'</div></div>';`,
});

// —— 7 classroom english ——
sheet({
  dir: 'english', file: 'classroom-english-media-worksheet.html', hub: '/games/english/classroom-english-media.html',
  subject: 'ภาษาอังกฤษ', indicators: ['ต 1.1 ป.1/1', 'ต 1.1 ป.2/1', 'ต 1.2 ป.3/1'],
  icon: '🗣️', title: 'ใบงาน Classroom English', gradeLabel: 'ป.1–ป.6', mediaLabel: 'สื่อ Classroom English',
  directions: 'จับคู่ประโยคภาษาอังกฤษกับความหมาย หรือเติมบทสนทนาในห้องเรียน',
  topicOptions: '<option value="mixed">รวม</option><option value="greet">ทักทาย</option><option value="polite">มารยาท</option><option value="room">ในห้องเรียน</option>',
  items: [
    { type: 'greet', prompt: 'Good morning แปลว่า', answer: 'สวัสดีตอนเช้า' },
    { type: 'greet', prompt: 'How are you? แปลว่า', answer: 'สบายดีไหม' },
    { type: 'greet', prompt: 'ตอบ How are you?', answer: 'I am fine, thank you.' },
    { type: 'polite', prompt: 'Thank you แปลว่า', answer: 'ขอบคุณ' },
    { type: 'polite', prompt: 'Excuse me ใช้เมื่อไร', answer: 'ขอโทษเมื่อแทรก/เรียก' },
    { type: 'polite', prompt: 'Please แปลว่า', answer: 'ได้โปรด / กรุณา' },
    { type: 'room', prompt: 'May I come in? แปลว่า', answer: 'ขออนุญาตเข้าได้ไหม' },
    { type: 'room', prompt: 'May I go to the toilet?', answer: 'ขออนุญาตไปห้องน้ำ' },
    { type: 'room', prompt: 'I do not understand แปลว่า', answer: 'ฉันไม่เข้าใจ' },
    { type: 'room', prompt: 'Please repeat แปลว่า', answer: 'ช่วยพูดอีกครั้ง' },
    { type: 'room', prompt: 'Open your book แปลว่า', answer: 'เปิดหนังสือ' },
    { type: 'greet', prompt: 'See you tomorrow แปลว่า', answer: 'พรุ่งนี้นะ' },
    { type: 'polite', prompt: 'I am sorry แปลว่า', answer: 'ขอโทษ' },
    { type: 'room', prompt: 'Listen carefully แปลว่า', answer: 'ตั้งใจฟัง' },
    { type: 'greet', prompt: 'เขียนบทสนทนาทักทายสั้น 2 บรรทัด', answer: 'เช่น Hi! / How are you?' },
    { type: 'room', prompt: 'ครูชม Well done! แปลว่า', answer: 'เก่งมาก' },
    { type: 'polite', prompt: 'เมื่อต้องการของเพื่อน ควรพูดว่า', answer: 'Please / May I …' },
    { type: 'room', prompt: 'Try again แปลว่า', answer: 'ลองอีกครั้ง' },
  ],
  renderBody: `const e=${esc};return '<div class="classroom-en-ws-grid work-line reason-line"><div class="prompt"><strong>'+e(item.prompt)+'</strong></div><div class="answer-line">คำตอบ <span class="blank long"></span></div><div class="reason-line">ใช้เมื่อไร / ประโยคเต็ม <span class="blank long"></span></div><div class="answer teacher-answer">เฉลย: '+e(item.answer)+'</div></div>';`,
});

// —— 8 literature ——
sheet({
  dir: 'thai', file: 'literature-short-media-worksheet.html', hub: '/games/thai/literature-short-media.html',
  subject: 'ภาษาไทย', indicators: ['ท 1.1 ป.4/5', 'ท 1.1 ป.5/5', 'ท 1.1 ป.6/4'],
  icon: '📖', title: 'ใบงานวรรณคดีสั้น', gradeLabel: 'ป.4–ป.6', mediaLabel: 'สื่อวรรณคดีสั้น',
  directions: 'อ่านเรื่องย่อแล้วตอบตัวละคร ข้อคิด หรือเหตุการณ์ · อ้างหลักฐานจากเรื่อง',
  topicOptions: '<option value="mixed">รวม</option><option value="char">ตัวละคร</option><option value="plot">เหตุการณ์</option><option value="moral">ข้อคิด</option>',
  items: [
    { type: 'char', prompt: 'ใครช่วยพระสังข์ตอนลอยน้ำ', answer: 'แม่ย่านาง' },
    { type: 'plot', prompt: 'พระสังข์ถอดรูปอะไร', answer: 'เปลือกหอย / กงจักร' },
    { type: 'char', prompt: 'พระอภัยมณีเก่งด้านใด', answer: 'ดนตรี' },
    { type: 'plot', prompt: 'ใครจับพระอภัยมณีไป (ย่อ)', answer: 'นางผีเสื้อสมุทร' },
    { type: 'char', prompt: 'ใครพานางสีดาไปในรามเกียรติ์', answer: 'ทศกัณฐ์' },
    { type: 'char', prompt: 'ใครช่วยพระรามรบ (วานร)', answer: 'หนุมาน' },
    { type: 'moral', prompt: 'นิทานพื้นบ้านมักสอนเรื่องใด', answer: 'คติสอนใจ' },
    { type: 'moral', prompt: 'ข้อคิดจากความขยัน (สั้น ๆ)', answer: 'เช่น ขยันนำมาซึ่งผลดี' },
    { type: 'plot', prompt: 'สรุปสังข์ทอง 1 ประโยค', answer: 'ตามย่อในสื่อ' },
    { type: 'plot', prompt: 'สรุปรามเกียรติ์ 1 ประโยค', answer: 'พระรามตามนางสีดา…' },
    { type: 'char', prompt: 'นางรอฉานเกี่ยวข้องกับเรื่องใด', answer: 'สังข์ทอง' },
    { type: 'char', prompt: 'นางสุวรรณมาลีเกี่ยวข้องกับเรื่องใด', answer: 'พระอภัยมณี' },
    { type: 'moral', prompt: 'ศิลปะ/สติจากพระอภัยมณีสอนอะไร', answer: 'ใช้ปัญญา/ศิลปะช่วยชีวิต' },
    { type: 'plot', prompt: 'ทำไมต้องมีคำถามท้ายบท', answer: 'ตรวจความเข้าใจ' },
    { type: 'moral', prompt: 'เลือกเรื่อง 1 เรื่อง เขียนข้อคิดของตน', answer: 'คำตอบอิสระตามเรื่อง' },
    { type: 'char', prompt: 'ทศกัณฐ์เป็นตัวละครฝ่ายใด', answer: 'ฝ่ายตรงข้าม / ยักษ์' },
    { type: 'plot', prompt: 'เรียงลำดับ: ถูกลอยน้ำ → ได้อภิเษก (สังข์ทอง)', answer: 'มีเหตุการณ์กลางตามสื่อ' },
    { type: 'moral', prompt: 'ความโลภในนิทานมักนำไปสู่ผลใด', answer: 'ผลเสีย / สอนไม่โลภ' },
  ],
  renderBody: `const e=${esc};return '<div class="literature-ws-grid literature-hub-grid evidence-line reason-line"><div class="prompt"><strong>'+e(item.prompt)+'</strong></div><div class="evidence-line">หลักฐานจากเรื่อง <span class="blank long"></span></div><div class="answer-line">คำตอบ <span class="blank long"></span></div><div class="reason-line">ข้อคิด / เหตุผล <span class="blank long"></span></div><div class="answer teacher-answer">เฉลย: '+e(item.answer)+'</div></div>';`,
});

// —— 9 calendar ——
sheet({
  dir: 'social', file: 'thai-calendar-media-worksheet.html', hub: '/games/social/thai-calendar-media.html',
  subject: 'สังคมศึกษา', indicators: ['ส 4.3 ป.4/1', 'ส 4.3 ป.5/1', 'ส 2.1 ป.3/1'],
  icon: '📅', title: 'ใบงานปฏิทินวันสำคัญไทย', gradeLabel: 'ป.1–ป.6', mediaLabel: 'สื่อปฏิทินวันสำคัญ',
  directions: 'จับคู่วันสำคัญกับวันที่ หรืออธิบายความหมายสั้น ๆ',
  topicOptions: '<option value="mixed">รวม</option><option value="date">วันที่</option><option value="meaning">ความหมาย</option><option value="nation">วันชาติ</option>',
  items: [
    { type: 'date', prompt: 'วันครูตรงกับวันที่เท่าไร', answer: '16 มกราคม' },
    { type: 'date', prompt: 'วันสงกรานต์ช่วงใด', answer: 'ประมาณ 13 เมษายน' },
    { type: 'date', prompt: 'วันแม่แห่งชาติ', answer: '12 สิงหาคม' },
    { type: 'date', prompt: 'วันพ่อแห่งชาติ', answer: '5 ธันวาคม' },
    { type: 'date', prompt: 'วันจักรี', answer: '6 เมษายน' },
    { type: 'date', prompt: 'วันรัฐธรรมนูญ', answer: '10 ธันวาคม' },
    { type: 'meaning', prompt: 'วันครูสำคัญอย่างไร', answer: 'ระลึกพระคุณครู' },
    { type: 'meaning', prompt: 'วันสงกรานต์คืออะไร', answer: 'ปีใหม่ไทย / สรงน้ำพระ' },
    { type: 'nation', prompt: 'วันปิยมหาราชเกี่ยวข้องกับรัชกาลใด', answer: 'ร.5' },
    { type: 'nation', prompt: 'วันนวมินทรมหาราชเกี่ยวข้องกับรัชกาลใด', answer: 'ร.9' },
    { type: 'date', prompt: 'วันขึ้นปีใหม่สากล', answer: '1 มกราคม' },
    { type: 'meaning', prompt: 'วันแรงงานระลึกถึงใคร', answer: 'ผู้ใช้แรงงาน' },
    { type: 'date', prompt: 'วันเฉลิมพระชนมพรรษา ร.10', answer: '28 กรกฎาคม' },
    { type: 'meaning', prompt: 'เลือกวันสำคัญ 1 วัน เขียนสิ่งที่ควรปฏิบัติ', answer: 'เช่น ไหว้ครู / ทำดีถวาย' },
    { type: 'nation', prompt: 'ทำไมต้องมีวันสำคัญของชาติ', answer: 'ระลึก/เทิดทูน/เรียนรู้ประวัติ' },
    { type: 'date', prompt: 'วันสิ้นปี', answer: '31 ธันวาคม' },
    { type: 'meaning', prompt: 'วันแม่ตรงกับวันเฉลิมพระชนมพรรษาของใคร', answer: 'สมเด็จพระนางเจ้าสิริกิติ์' },
    { type: 'date', prompt: 'จับคู่: 23 ตุลาคม = ?', answer: 'วันปิยมหาราช' },
  ],
  renderBody: `const e=${esc};return '<div class="calendar-ws-grid work-line reason-line"><div class="prompt"><strong>'+e(item.prompt)+'</strong></div><div class="answer-line">คำตอบ <span class="blank long"></span></div><div class="reason-line">ความหมาย / สิ่งที่ควรทำ <span class="blank long"></span></div><div class="answer teacher-answer">เฉลย: '+e(item.answer)+'</div></div>';`,
});

// —— 10 organs ——
sheet({
  dir: 'science', file: 'human-organs-media-worksheet.html', hub: '/games/science/human-organs-media.html',
  subject: 'วิทยาศาสตร์', indicators: ['ว 1.2 ป.4/1', 'ว 1.2 ป.6/1'],
  icon: '🫀', title: 'ใบงานอวัยวะสำคัญ', gradeLabel: 'ป.4–ป.6', mediaLabel: 'สื่ออวัยวะสำคัญ',
  directions: 'จับคู่ชื่ออวัยวะกับหน้าที่ หรืออธิบายสั้น ๆ · เขียนเหตุผล',
  topicOptions: '<option value="mixed">รวม</option><option value="match">จับคู่หน้าที่</option><option value="name">ชื่ออวัยวะ</option><option value="care">ดูแล</option>',
  items: [
    { type: 'match', prompt: 'หัวใจมีหน้าที่อะไร', answer: 'สูบฉีดเลือด' },
    { type: 'match', prompt: 'ปอดมีหน้าที่อะไร', answer: 'แลกเปลี่ยนแก๊ส / หายใจ' },
    { type: 'match', prompt: 'สมองมีหน้าที่อะไร', answer: 'ควบคุมความคิด การเคลื่อนไหว' },
    { type: 'match', prompt: 'กระเพาะอาหารทำอะไร', answer: 'ย่อยอาหาร' },
    { type: 'match', prompt: 'ไตทำอะไร', answer: 'กรองของเสียจากเลือด' },
    { type: 'match', prompt: 'ตับช่วยอะไร', answer: 'ช่วยย่อยไขมัน/เก็บพลังงาน' },
    { type: 'name', prompt: 'อวัยวะแลกเปลี่ยนออกซิเจน', answer: 'ปอด' },
    { type: 'name', prompt: 'อวัยวะสูบฉีดเลือด', answer: 'หัวใจ' },
    { type: 'name', prompt: 'อวัยวะควบคุมร่างกาย (ในกะโหลก)', answer: 'สมอง' },
    { type: 'care', prompt: 'ออกกำลังกายสม่ำเสมอดีต่ออวัยวะใดเป็นพิเศษ', answer: 'หัวใจ / ปอด' },
    { type: 'care', prompt: 'สวมหมวกกันน็อกช่วยปกป้องอะไร', answer: 'สมอง' },
    { type: 'match', prompt: 'ลำไส้เล็กมีหน้าที่หลัก', answer: 'ดูดซึมสารอาหาร' },
    { type: 'name', prompt: 'อวัยวะค้ำจุนร่างกาย', answer: 'กระดูก' },
    { type: 'care', prompt: 'กินอาหารครบหมู่ช่วยระบบใด', answer: 'ย่อย / ทั้งร่างกาย' },
    { type: 'match', prompt: 'ปอดมีกี่ข้าง', answer: '2' },
    { type: 'match', prompt: 'ไตมีกี่ข้าง', answer: '2' },
    { type: 'care', prompt: 'นอนหลับพักผ่อนเพียงพอดีต่ออะไร', answer: 'สมอง / การฟื้นฟูร่างกาย' },
    { type: 'name', prompt: 'เขียนอวัยวะ 3 อย่างที่เรียนวันนี้', answer: 'เช่น หัวใจ ปอด สมอง' },
  ],
  renderBody: `const e=${esc};return '<div class="organs-ws-grid classify-grid reason-line work-line"><div class="prompt"><strong>'+e(item.prompt)+'</strong></div><div class="answer-line">คำตอบ <span class="blank long"></span></div><div class="reason-line">เหตุผล / หน้าที่เพิ่ม <span class="blank long"></span></div><div class="answer teacher-answer">เฉลย: '+e(item.answer)+'</div></div>';`,
});

console.log('done batch 13 worksheets');
