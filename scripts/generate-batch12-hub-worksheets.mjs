#!/usr/bin/env node
/** Generate Batch 12: grammar-mini + dedicated hub worksheets (data/english/science/vocab) */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function sheet({ dir, file, hub, subject, indicators, icon, title, gradeLabel, mediaLabel, directions, topicOptions, items, renderBody }) {
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
  icon:'${icon}',title:'${title}',subject:'${subject}',gradeLabel:'${gradeLabel}',
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
  writeFileSync(resolve(root, 'public/games', dir, file), html, 'utf8');
  console.log('wrote', dir + '/' + file, 'items', items.length);
}

const grammarMini = [
  { type: 'isare', prompt: 'เลือก is / are', text: 'The cats ___ cute.', answer: 'are' },
  { type: 'isare', prompt: 'เลือก is / are', text: 'My friend ___ kind.', answer: 'is' },
  { type: 'isare', prompt: 'เลือก is / are', text: 'These books ___ new.', answer: 'are' },
  { type: 'isare', prompt: 'เลือก is / are', text: 'This school ___ big.', answer: 'is' },
  { type: 'aan', prompt: 'เลือก a / an', text: '___ apple', answer: 'an' },
  { type: 'aan', prompt: 'เลือก a / an', text: '___ banana', answer: 'a' },
  { type: 'aan', prompt: 'เลือก a / an', text: '___ orange', answer: 'an' },
  { type: 'aan', prompt: 'เลือก a / an', text: '___ umbrella', answer: 'an' },
  { type: 'demo', prompt: 'เลือก this / that / these / those', text: '___ is my pencil. (ใกล้ 1 ชิ้น)', answer: 'This' },
  { type: 'demo', prompt: 'เลือก this / that / these / those', text: '___ are my friends. (ใกล้ หลายคน)', answer: 'These' },
  { type: 'demo', prompt: 'เลือก this / that / these / those', text: '___ is a bird. (ไกล 1 ตัว)', answer: 'That' },
  { type: 'demo', prompt: 'เลือก this / that / these / those', text: '___ are trees. (ไกล หลายต้น)', answer: 'Those' },
  { type: 'isare', prompt: 'แก้ประโยคให้ถูก', text: 'He are a student.', answer: 'He is a student.' },
  { type: 'aan', prompt: 'แก้ประโยคให้ถูก', text: 'I see a elephant.', answer: 'I see an elephant.' },
  { type: 'demo', prompt: 'แต่งประโยคสั้นใช้ this/these', text: 'ปากกา / ใกล้', answer: 'This is a pen. / These are pens.' },
  { type: 'isare', prompt: 'เติมคำให้สมบูรณ์', text: 'There ___ two dogs.', answer: 'are' },
  { type: 'aan', prompt: 'วงคำนำหน้าที่ถูก', text: 'I want ___ ice cream.', answer: 'an' },
  { type: 'demo', prompt: 'อธิบายความต่าง this กับ that', text: 'short answer', answer: 'this=ใกล้ · that=ไกล (เอกพจน์)' },
];

const dataHub = [
  { type: 'bar', labels: ['มะม่วง', 'กล้วย', 'ส้ม'], values: [6, 9, 4], ask: 'ผลไม้ใดมากที่สุด', answer: 'กล้วย 9' },
  { type: 'bar', labels: ['แดง', 'ฟ้า', 'เขียว'], values: [8, 5, 7], ask: 'มากสุดต่างน้อยสุดเท่าไร', answer: '3' },
  { type: 'bar', labels: ['จ.', 'อ.', 'พ.'], values: [5, 8, 6], ask: 'อังคารมากกว่าจันทร์เท่าไร', answer: '3' },
  { type: 'bar', labels: ['ป.4/1', 'ป.4/2', 'ป.4/3'], values: [12, 10, 14], ask: 'รวมสามห้อง', answer: '36' },
  { type: 'picto', labels: ['แมว', 'สุนัข', 'ปลา'], values: [4, 6, 3], ask: '● = 2 ตัว → สุนัขกี่ตัว', answer: '12' },
  { type: 'picto', labels: ['ฟุตบอล', 'ว่ายน้ำ', 'วิ่ง'], values: [5, 3, 4], ask: '★ = 2 → ฟุตบอล+ว่ายน้ำ', answer: '16 คน (8★)' },
  { type: 'picto', labels: ['นิทาน', 'วิทย์', 'การ์ตูน'], values: [3, 5, 4], ask: '■ = 3 เล่ม → วิทย์กี่เล่ม', answer: '15' },
  { type: 'table', labels: ['ดินสอ', 'ปากกา', 'ยาง'], values: [12, 7, 9], ask: 'น้อยกว่าดินสอ 3 ชิ้นคืออะไร', answer: 'ยางลบ' },
  { type: 'table', labels: ['เช้า', 'กลางวัน', 'เย็น'], values: [24, 31, 27], ask: 'ช่วงใดมากสุด และมากกว่าเช้าเท่าไร', answer: 'กลางวัน +7' },
  { type: 'table', labels: ['ก', 'ข', 'ค'], values: [18, 15, 20], ask: 'ก+ข', answer: '33' },
  { type: 'quiz', labels: ['ข้าว', 'นม', 'ไข่'], values: [10, 6, 8], ask: 'กำหนดสเกลครั้งละ 2 แล้ววาดแท่ง', answer: 'สูง 10,6,8' },
  { type: 'quiz', labels: ['เหนือ', 'กลาง', 'ใต้'], values: [7, 11, 8], ask: 'เรียงจากน้อย→มาก', answer: 'เหนือ 7, ใต้ 8, กลาง 11' },
  { type: 'bar', labels: ['ฝน', 'แดด', 'ลม'], values: [4, 9, 2], ask: 'ผลรวมทั้งหมด', answer: '15' },
  { type: 'picto', labels: ['รถ', 'เรือ', 'เครื่องบิน'], values: [2, 3, 1], ask: '△ = 5 → รวมทั้งหมด', answer: '30' },
  { type: 'table', labels: ['A', 'B', 'C', 'D'], values: [5, 8, 6, 7], ask: 'ค่าเฉลี่ยอย่างง่าย (รวม÷4)', answer: '6.5' },
  { type: 'quiz', labels: ['จันทร์', 'อังคาร'], values: [10, 14], ask: 'เขียนคำถามจากข้อมูลนี้ 1 ข้อ', answer: 'เช่น อังคารมากกว่าจันทร์กี่หน่วย' },
  { type: 'bar', labels: ['อ่าน', 'เขียน', 'คิด'], values: [7, 5, 9], ask: 'วิชาใดน้อยสุด', answer: 'เขียน 5' },
  { type: 'table', labels: ['เช้า', 'บ่าย'], values: [15, 20], ask: 'บ่ายคิดเป็นกี่เท่าของเช้า', answer: '4/3 เท่า' },
];

const engHub = [
  { type: 'grammar', prompt: 'Fill in: is / are', text: 'She ___ my teacher.', answer: 'is' },
  { type: 'grammar', prompt: 'Fill in: a / an', text: 'I have ___ egg.', answer: 'an' },
  { type: 'grammar', prompt: 'Choose: this / these', text: '___ books are mine. (near)', answer: 'These' },
  { type: 'grammar', prompt: 'Rewrite correctly', text: 'They is happy.', answer: 'They are happy.' },
  { type: 'sight', prompt: 'เขียนประโยคใช้คำ sight word', word: 'because', answer: 'เช่น I like mangoes because they are sweet.' },
  { type: 'sight', prompt: 'เขียนประโยคใช้คำ sight word', word: 'friend', answer: 'เช่น My friend is kind.' },
  { type: 'sight', prompt: 'วงคำที่สะกดถูก', word: 'school / scool / schol', answer: 'school' },
  { type: 'sight', prompt: 'แปลและแต่งประโยค', word: 'always', answer: 'เสมอ · เช่น I always wash my hands.' },
  { type: 'instr', prompt: 'อ่านคำสั่งแล้วทำเครื่องหมาย', text: 'Circle the apple.', answer: 'วงผลไม้แอปเปิล' },
  { type: 'instr', prompt: 'อ่านคำสั่งแล้วทำเครื่องหมาย', text: 'Underline the cat.', answer: 'ขีดเส้นใต้แมว' },
  { type: 'instr', prompt: 'อ่านคำสั่งแล้วทำเครื่องหมาย', text: 'Tick the big book.', answer: 'ติ๊กหนังสือเล่มใหญ่' },
  { type: 'instr', prompt: 'เขียนคำสั่งภาษาอังกฤษสั้น ๆ', text: 'สั่งให้เพื่อนวงกลมดวงดาว', answer: 'Circle the star.' },
  { type: 'grammar', prompt: 'เลือก that / those', text: '___ bird is far away.', answer: 'That' },
  { type: 'grammar', prompt: 'แต่งประโยค 1 ประโยคใช้ are', text: 'two dogs', answer: 'There are two dogs. / The dogs are cute.' },
  { type: 'sight', prompt: 'เติมคำในช่องว่าง', text: 'I ___ to school every day. (go)', answer: 'go' },
  { type: 'instr', prompt: 'เรียงคำสั่งให้ถูก', text: 'the / Circle / sun', answer: 'Circle the sun.' },
  { type: 'grammar', prompt: 'อธิบายกฎสั้น ๆ', text: 'ใช้ an เมื่อไร', answer: 'ก่อนเสียงสระ (a,e,i,o,u)' },
  { type: 'sight', prompt: 'เขียนคำและประโยค', word: 'people', answer: 'people · เช่น Many people smile.' },
];

const sciHub = [
  { type: 'matter', prompt: 'จำแนกสถานะของสสาร', text: 'น้ำแข็ง', answer: 'ของแข็ง' },
  { type: 'matter', prompt: 'จำแนกสถานะของสสาร', text: 'ไอน้ำ', answer: 'แก๊ส' },
  { type: 'matter', prompt: 'เมื่อน้ำเดือดจะเปลี่ยนสถานะเป็นอะไร', text: 'ของเหลว → ?', answer: 'แก๊ส / ไอน้ำ' },
  { type: 'matter', prompt: 'น้ำแข็งละลายกลายเป็นอะไร', text: 'ของแข็ง → ?', answer: 'ของเหลว' },
  { type: 'water', prompt: 'เรียงขั้นวัฏจักรน้ำ', text: 'ระเหย · ควบแน่น · ตกเป็นฝน · ไหลรวม', answer: 'ระเหย→ควบแน่น→ฝน→ไหลรวม' },
  { type: 'water', prompt: 'พลังงานใดทำให้น้ำระเหย', text: 'ดวงอาทิตย์', answer: 'ความร้อนจากดวงอาทิตย์' },
  { type: 'water', prompt: 'เมฆเกิดจากกระบวนการใด', text: 'ไอน้ำในอากาศ', answer: 'การควบแน่น' },
  { type: 'water', prompt: 'น้ำฝนไหลลงแม่น้ำเรียกว่าอะไร', text: 'ขั้นสุดท้ายอย่างง่าย', answer: 'การไหลรวม / การไหลบ่า' },
  { type: 'animals', prompt: 'จัดกลุ่มสัตว์มีกระดูกสันหลัง', text: 'ปลา', answer: 'มีกระดูกสันหลัง' },
  { type: 'animals', prompt: 'จัดกลุ่ม', text: 'แมลงสาบ', answer: 'ไม่มีกระดูกสันหลัง' },
  { type: 'animals', prompt: 'นกจัดอยู่ในกลุ่มใด', text: 'สัตว์มีกระดูกสันหลัง', answer: 'สัตว์มีกระดูกสันหลัง / สัตว์ปีก' },
  { type: 'animals', prompt: 'ข้อแตกต่างสำคัญของสัตว์มีกระดูกสันหลัง', text: 'สั้น ๆ', answer: 'มีกระดูกสันหลังค้ำลำตัว' },
  { type: 'body', prompt: 'อวัยวะย่อยอาหารลำดับต้น', text: 'ปาก → ?', answer: 'หลอดอาหาร / คอ' },
  { type: 'body', prompt: 'กระเพาะอาหารทำหน้าที่หลักอะไร', text: 'ย่อยอาหาร', answer: 'ย่อยอาหารด้วยน้ำย่อย/กล้ามเนื้อ' },
  { type: 'body', prompt: 'ลำไส้เล็กสำคัญอย่างไร', text: 'ดูดซึม', answer: 'ดูดซึมสารอาหาร' },
  { type: 'body', prompt: 'เรียงอวัยวะอย่างง่าย', text: 'ปาก กระเพาะ ลำไส้', answer: 'ปาก→หลอดอาหาร→กระเพาะ→ลำไส้' },
  { type: 'matter', prompt: 'อากาศจัดเป็นสถานะใด', text: 'หายใจเข้า', answer: 'แก๊ส' },
  { type: 'water', prompt: 'วาดลูกศรวัฏจักรน้ำสั้น ๆ', text: 'ทะเล→เมฆ→ฝน', answer: 'ระเหย→ควบแน่น→ตก' },
];

const vocabHub = [
  { type: 'meaning', word: 'กล้าหาญ', prompt: 'เขียนความหมายและแต่งประโยค', answer: 'ไม่กลัว · เช่น เขากล้าหาญช่วยเพื่อน' },
  { type: 'meaning', word: 'เมตตา', prompt: 'เขียนความหมายและแต่งประโยค', answer: 'สงสาร/เอ็นดู · เช่น แม่มีเมตตา' },
  { type: 'meaning', word: 'ขยัน', prompt: 'เขียนความหมายและแต่งประโยค', answer: 'ตั้งใจทำ · เช่น น้องขยันทำการบ้าน' },
  { type: 'synonym', word: 'สวย', prompt: 'หาคำพ้อง/ใกล้เคียง 2 คำ', answer: 'งาม · สละสลวย' },
  { type: 'synonym', word: 'เร็ว', prompt: 'หาคำพ้อง/ใกล้เคียง 2 คำ', answer: 'ไว · ฉับพลัน' },
  { type: 'antonym', word: 'ร้อน', prompt: 'หาคำตรงข้าม', answer: 'เย็น / หนาว' },
  { type: 'antonym', word: 'สูง', prompt: 'หาคำตรงข้าม', answer: 'ต่ำ' },
  { type: 'use', word: 'รับผิดชอบ', prompt: 'แต่งประโยคในโรงเรียน', answer: 'เช่น นักเรียนรับผิดชอบงานที่ได้รับ' },
  { type: 'use', word: 'ร่วมมือ', prompt: 'แต่งประโยคในโรงเรียน', answer: 'เช่น เพื่อนร่วมมือทำความสะอาดห้อง' },
  { type: 'meaning', word: 'สุภาพ', prompt: 'อธิบายและยกตัวอย่างพฤติกรรม', answer: 'พูดจาอ่อนน้อม · เช่น ทักทายครู' },
  { type: 'synonym', word: 'ดีใจ', prompt: 'หาคำใกล้เคียง', answer: 'ยินดี · มีความสุข' },
  { type: 'antonym', word: 'เข้า', prompt: 'หาคำตรงข้าม', answer: 'ออก' },
  { type: 'use', word: 'อดทน', prompt: 'เขียนสถานการณ์ใช้คำ', answer: 'เช่น อดทนรอคิวโดยไม่แซง' },
  { type: 'meaning', word: 'อนุรักษ์', prompt: 'ความหมาย + ประโยค', answer: 'รักษาไว้ · เช่น อนุรักษ์ต้นไม้ในโรงเรียน' },
  { type: 'synonym', word: 'พูด', prompt: 'คำใกล้เคียง', answer: 'กล่าว · เล่า · สนทนา' },
  { type: 'antonym', word: 'กลางวัน', prompt: 'คำตรงข้าม', answer: 'กลางคืน' },
  { type: 'use', word: 'ใฝ่รู้', prompt: 'แต่งประโยค', answer: 'เช่น เด็กใฝ่รู้ถามครูบ่อย' },
  { type: 'meaning', word: 'สามัคคี', prompt: 'ความหมาย + ข้อคิดสั้น', answer: 'พร้อมเพรียง · รวมกันเราอยู่' },
];

sheet({
  dir: 'english', file: 'grammar-mini-worksheet.html',
  hub: '/games/english/grammar-mini.html', subject: 'ภาษาอังกฤษ',
  indicators: ['ต 2.1 ป.4/1'],
  icon: '🔤', title: 'ใบงาน Grammar Mini', gradeLabel: 'ป.4', mediaLabel: 'Grammar Mini',
  directions: 'ฝึก is/are · a/an · this/that/these/those พร้อมอธิบายเหตุผลสั้น ๆ',
  topicOptions: '<option value="mixed">ผสมทุกทักษะ</option><option value="isare">is / are</option><option value="aan">a / an</option><option value="demo">this/that/these/those</option>',
  items: grammarMini,
  renderBody: `const e=window.KampaiTopicWorksheet.escapeHtml;
    return '<div class="q-prompt">'+e(item.prompt)+'</div>'
      +'<div class="q-context grammar-mini-case">'+e(item.text)+'</div>'
      +'<div class="classify-grid grammar-mini-grid">'
      +'<div class="classify-box">คำตอบ: ________</div>'
      +'<div class="classify-box">เหตุผลสั้น ๆ: ________</div></div>'
      +'<div class="work-line"></div><div class="reason-line"></div>'
      +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';`,
});

sheet({
  dir: 'math', file: 'math-data-hub-worksheet.html',
  hub: '/games/math/math-data-hub/index.html', subject: 'คณิตศาสตร์',
  indicators: ['ค 3.1 ป.4/1'],
  icon: '📊', title: 'ใบงานคลังข้อมูลและกราฟ', gradeLabel: 'ป.4–ป.5', mediaLabel: 'คลังข้อมูลและกราฟ',
  directions: 'อ่านตาราง กำหนดสเกล วาด/อ่านแผนภูมิ และอธิบายเหตุผล',
  topicOptions: '<option value="mixed">ผสมทุกทักษะ</option><option value="bar">แผนภูมิแท่ง</option><option value="picto">แผนภาพรูปภาพ</option><option value="table">ตาราง</option><option value="quiz">วิเคราะห์ข้อมูล</option>',
  items: dataHub,
  renderBody: `const e=window.KampaiTopicWorksheet.escapeHtml;
    const heads=item.labels.map(l=>'<th>'+e(l)+'</th>').join('');
    const cells=item.values.map(v=>'<td>'+v+'</td>').join('');
    return '<div class="q-prompt">'+e(item.ask)+'</div>'
      +'<table class="mini-table math-data-hub-grid"><tr>'+heads+'</tr><tr>'+cells+'</tr></table>'
      +'<div class="chart-grid" aria-label="พื้นที่วาดกราฟ"></div>'
      +'<div class="scale-box">สเกล/สัญลักษณ์: ____________________</div>'
      +'<div class="calc-line"></div><div class="work-line"></div><div class="reason-line"></div>'
      +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';`,
});

sheet({
  dir: 'english', file: 'english-grammar-p45-hub-worksheet.html',
  hub: '/games/english/english-grammar-p45-hub/index.html', subject: 'ภาษาอังกฤษ',
  indicators: ['ต 2.1 ป.4/1', 'ต 1.1 ป.4/1', 'ต 1.1 ป.4/2'],
  icon: '🇬🇧', title: 'ใบงานคลัง English ป.4–5', gradeLabel: 'ป.4–ป.5', mediaLabel: 'English Grammar Hub',
  directions: 'ฝึก Grammar · Sight Words · Follow Instructions พร้อมเหตุผลสั้น ๆ',
  topicOptions: '<option value="mixed">ผสมทุกทักษะ</option><option value="grammar">Grammar</option><option value="sight">Sight Words</option><option value="instr">Follow Instructions</option>',
  items: engHub,
  renderBody: `const e=window.KampaiTopicWorksheet.escapeHtml;
    return '<div class="q-prompt">'+e(item.prompt)+'</div>'
      +'<div class="q-context english-hub-case">'+e(item.text||item.word||'')+'</div>'
      +'<div class="classify-grid english-grammar-hub-grid">'
      +'<div class="classify-box">Answer: ________</div>'
      +'<div class="classify-box">Why / Example: ________</div></div>'
      +'<div class="work-line"></div><div class="reason-line"></div>'
      +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';`,
});

sheet({
  dir: 'science', file: 'science-p45-hub-worksheet.html',
  hub: '/games/science/science-p45-hub/index.html', subject: 'วิทยาศาสตร์',
  indicators: ['ว 2.1 ป.4/3', 'ว 3.2 ป.5/3', 'ว 1.3 ป.4/3'],
  icon: '🔬', title: 'ใบงานคลังวิทย์ ป.4–5', gradeLabel: 'ป.4–ป.5', mediaLabel: 'Science Hub ป.4-5',
  directions: 'ฝึกสถานะสสาร วัฏจักรน้ำ สัตว์มีกระดูกสันหลัง และระบบย่อยอาหาร',
  topicOptions: '<option value="mixed">ผสมทุกทักษะ</option><option value="matter">สถานะสสาร</option><option value="water">วัฏจักรน้ำ</option><option value="animals">สัตว์</option><option value="body">ร่างกาย</option>',
  items: sciHub,
  renderBody: `const e=window.KampaiTopicWorksheet.escapeHtml;
    return '<div class="q-prompt">'+e(item.prompt)+'</div>'
      +'<div class="q-context science-hub-case">'+e(item.text)+'</div>'
      +'<div class="classify-grid science-p45-hub-grid">'
      +'<div class="classify-box">คำตอบ: ________</div>'
      +'<div class="classify-box">เหตุผล/ขั้นตอน: ________</div></div>'
      +(item.type==='water'?'<div class="cycle-flow"><div class="cycle-step">1</div><div class="cycle-arrow">→</div><div class="cycle-step">2</div><div class="cycle-arrow">→</div><div class="cycle-step">3</div><div class="cycle-arrow">→</div><div class="cycle-step">4</div></div>':'')
      +'<div class="work-line"></div><div class="reason-line"></div>'
      +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';`,
});

sheet({
  dir: 'thai', file: 'thai-vocab-hub-worksheet.html',
  hub: '/games/thai/thai-vocab-hub/index.html', subject: 'ภาษาไทย',
  indicators: ['ท 4.1 ป.4/1', 'ท 4.1 ป.4/6'],
  icon: '📗', title: 'ใบงานคลังคำศัพท์ไทย', gradeLabel: 'ป.4–ป.6', mediaLabel: 'คลังคำศัพท์ไทย',
  directions: 'หาความหมาย คำพ้อง/ตรงข้าม และแต่งประโยคใช้คำ',
  topicOptions: '<option value="mixed">ผสมทุกทักษะ</option><option value="meaning">ความหมาย</option><option value="synonym">คำพ้อง</option><option value="antonym">คำตรงข้าม</option><option value="use">ใช้ในประโยค</option>',
  items: vocabHub,
  renderBody: `const e=window.KampaiTopicWorksheet.escapeHtml;
    return '<div class="q-prompt">'+e(item.prompt)+'</div>'
      +'<div class="q-context vocab-hub-word">คำ: '+e(item.word)+'</div>'
      +'<div class="classify-grid thai-vocab-hub-grid">'
      +'<div class="classify-box">ความหมาย/คำเกี่ยวข้อง: ________</div>'
      +'<div class="classify-box">ประโยคตัวอย่าง: ________</div></div>'
      +'<div class="work-line"></div><div class="work-line"></div><div class="reason-line"></div>'
      +'<span class="teacher-answer">เฉลยแนว: '+e(item.answer)+'</span>';`,
});
