#!/usr/bin/env node
/** Generate Batch 10 math hub worksheets (decimal / fraction / geometry) */
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
  icon:'${icon}',title:'${title}',subject:'คณิตศาสตร์',gradeLabel:'${gradeLabel}',
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
  writeFileSync(resolve(root, 'public/games/math', file), html, 'utf8');
  console.log('wrote', file, 'items', items.length);
}

const decimalItems = [
  { type: 'read', prompt: 'อ่านทศนิยมและเติมตารางค่าประจำหลัก', value: '4.56', answer: 'สี่จุดห้าหก' },
  { type: 'read', prompt: 'อ่านทศนิยมและเติมตารางค่าประจำหลัก', value: '10.08', answer: 'สิบจุดศูนย์แปด' },
  { type: 'read', prompt: 'บอกค่าประจำหลักสิบส่วน', value: '7.29', answer: '2 สิบส่วน = 0.2' },
  { type: 'read', prompt: 'เขียนทศนิยมจากคำอ่าน', value: 'สามจุดเจ็ดห้า', answer: '3.75' },
  { type: 'compare', prompt: 'เปรียบเทียบด้วย > < =', left: '2.45', right: '2.5', answer: '2.45 < 2.5' },
  { type: 'compare', prompt: 'เปรียบเทียบด้วย > < =', left: '6.30', right: '6.3', answer: '6.30 = 6.3' },
  { type: 'compare', prompt: 'เรียงจากน้อยไปมาก', left: '0.9, 0.89, 1.01', right: '', answer: '0.89 < 0.9 < 1.01' },
  { type: 'compare', prompt: 'วงค่าที่มากกว่า', left: '5.08', right: '5.8', answer: '5.8' },
  { type: 'addsub', prompt: 'หาผลบวก ตั้งจุดให้ตรงกัน', expr: '1.25 + 0.47', answer: '1.72' },
  { type: 'addsub', prompt: 'หาผลบวก ตั้งจุดให้ตรงกัน', expr: '3.6 + 0.85', answer: '4.45' },
  { type: 'addsub', prompt: 'หาผลลบ ตั้งจุดให้ตรงกัน', expr: '5.4 − 1.25', answer: '4.15' },
  { type: 'addsub', prompt: 'หาผลลบ ตั้งจุดให้ตรงกัน', expr: '8.03 − 0.7', answer: '7.33' },
  { type: 'money', prompt: 'เขียนเงินเป็นทศนิยมบาท', value: '12 บาท 50 สตางค์', answer: '12.50 บาท' },
  { type: 'money', prompt: 'เขียนเงินเป็นทศนิยมบาท', value: '3 บาท 5 สตางค์', answer: '3.05 บาท' },
  { type: 'money', prompt: 'บวกราคาสินค้า', expr: '15.75 + 4.50', answer: '20.25 บาท' },
  { type: 'money', prompt: 'ทอนเงินจาก 50 บาท', expr: '50.00 − 32.75', answer: '17.25 บาท' },
  { type: 'read', prompt: 'เติมหลักร้อยส่วนที่หายไป', value: '9.4_', answer: 'เช่น 9.40 หรือตามบริบทโจทย์' },
  { type: 'addsub', prompt: 'ตรวจคำตอบด้วยการลบย้อนกลับ', expr: '2.15 + 1.4 = ?', answer: '3.55 · ตรวจ 3.55−1.4=2.15' },
];

const fractionItems = [
  { type: 'bar', prompt: 'ระบายเศษส่วนบนแท่ง', frac: '3/4', parts: 4, fill: 3, answer: '3/4' },
  { type: 'bar', prompt: 'ระบายเศษส่วนบนแท่ง', frac: '2/5', parts: 5, fill: 2, answer: '2/5' },
  { type: 'bar', prompt: 'ระบายเศษส่วนบนแท่ง', frac: '5/8', parts: 8, fill: 5, answer: '5/8' },
  { type: 'bar', prompt: 'ระบายเศษส่วนบนแท่ง', frac: '1/3', parts: 3, fill: 1, answer: '1/3' },
  { type: 'compare', prompt: 'เปรียบเทียบเศษส่วนตัวส่วนเท่ากัน', left: '2/7', right: '5/7', answer: '2/7 < 5/7' },
  { type: 'compare', prompt: 'เปรียบเทียบเศษส่วนตัวส่วนเท่ากัน', left: '4/5', right: '1/5', answer: '4/5 > 1/5' },
  { type: 'compare', prompt: 'หาเศษส่วนสมมูล', left: '1/2', right: '?/8', answer: '4/8' },
  { type: 'compare', prompt: 'หาเศษส่วนสมมูล', left: '2/3', right: '?/6', answer: '4/6' },
  { type: 'add', prompt: 'บวกเศษส่วนตัวส่วนเท่ากัน', expr: '1/5 + 2/5', answer: '3/5' },
  { type: 'add', prompt: 'บวกเศษส่วนตัวส่วนเท่ากัน', expr: '3/8 + 2/8', answer: '5/8' },
  { type: 'sub', prompt: 'ลบเศษส่วนตัวส่วนเท่ากัน', expr: '5/6 − 1/6', answer: '4/6 หรือ 2/3' },
  { type: 'sub', prompt: 'ลบเศษส่วนตัวส่วนเท่ากัน', expr: '7/10 − 3/10', answer: '4/10 หรือ 2/5' },
  { type: 'whole', prompt: 'เขียนจำนวนคละเป็นเศษเกิน', value: '2 1/4', answer: '9/4' },
  { type: 'whole', prompt: 'เขียนเศษเกินเป็นจำนวนคละ', value: '11/3', answer: '3 2/3' },
  { type: 'whole', prompt: 'บวกจำนวนคละอย่างง่าย', expr: '1 1/4 + 2 1/4', answer: '3 2/4 หรือ 3 1/2' },
  { type: 'whole', prompt: 'ลบจำนวนคละอย่างง่าย', expr: '3 3/5 − 1 1/5', answer: '2 2/5' },
  { type: 'bar', prompt: 'เขียนเศษส่วนจากส่วนที่ระบาย 3 ใน 6', frac: '3/6', parts: 6, fill: 3, answer: '3/6 = 1/2' },
  { type: 'add', prompt: 'แสดงวิธีคิดทีละขั้น', expr: '2/9 + 4/9', answer: '6/9 หรือ 2/3' },
];

const geometryItems = [
  { type: 'angle', prompt: 'จำแนกชนิดมุม', degrees: '35°', answer: 'มุมแหลม' },
  { type: 'angle', prompt: 'จำแนกชนิดมุม', degrees: '90°', answer: 'มุมฉาก' },
  { type: 'angle', prompt: 'จำแนกชนิดมุม', degrees: '135°', answer: 'มุมป้าน' },
  { type: 'angle', prompt: 'จำแนกชนิดมุม', degrees: '180°', answer: 'มุมตรง' },
  { type: 'perimeter', prompt: 'หาเส้นรอบรูปสี่เหลี่ยมผืนผ้า', w: 8, h: 3, answer: '22 หน่วย' },
  { type: 'perimeter', prompt: 'หาเส้นรอบรูปสี่เหลี่ยมจัตุรัส', w: 6, h: 6, answer: '24 หน่วย' },
  { type: 'perimeter', prompt: 'หาเส้นรอบรูปสี่เหลี่ยมผืนผ้า', w: 12, h: 5, answer: '34 หน่วย' },
  { type: 'perimeter', prompt: 'เขียนสูตรแล้วแทนค่า', w: 9, h: 4, answer: '2(9+4)=26' },
  { type: 'area', prompt: 'หาพื้นที่สี่เหลี่ยมผืนผ้า', w: 7, h: 4, answer: '28 ตารางหน่วย' },
  { type: 'area', prompt: 'หาพื้นที่สี่เหลี่ยมจัตุรัส', w: 5, h: 5, answer: '25 ตารางหน่วย' },
  { type: 'area', prompt: 'หาพื้นที่สี่เหลี่ยมผืนผ้า', w: 10, h: 6, answer: '60 ตารางหน่วย' },
  { type: 'area', prompt: 'เขียนสูตร กว้าง×ยาว', w: 11, h: 3, answer: '11×3=33' },
  { type: 'shapes', prompt: 'บอกจำนวนด้านและมุม', shape: 'สามเหลี่ยม', answer: '3 ด้าน 3 มุม' },
  { type: 'shapes', prompt: 'บอกจำนวนด้านและมุม', shape: 'สี่เหลี่ยมผืนผ้า', answer: '4 ด้าน 4 มุมฉาก' },
  { type: 'shapes', prompt: 'บอกลักษณะพิเศษ', shape: 'สี่เหลี่ยมจัตุรัส', answer: 'ด้านเท่า มุมฉากทั้ง 4' },
  { type: 'shapes', prompt: 'บอกลักษณะพิเศษ', shape: 'วงกลม', answer: 'ไม่มีมุม · มีรัศมี/เส้นผ่านศูนย์กลาง' },
  { type: 'angle', prompt: 'ประมาณชนิดมุมจากคำอธิบาย', degrees: 'มุมเปิดประตูเล็กน้อย', answer: 'มุมแหลม' },
  { type: 'area', prompt: 'ตรวจด้วยการคูณย้อนกลับ', w: 8, h: 2, answer: '16 · ตรวจ 16÷8=2' },
];

sheet({
  file: 'math-decimal-hub-worksheet.html',
  hub: '/games/math/math-decimal-hub/index.html',
  indicators: ['ค 1.1 ป.4/5', 'ค 1.1 ป.4/6'],
  icon: '🔢', title: 'ใบงานคลังทศนิยม', gradeLabel: 'ป.4–ป.5', mediaLabel: 'คลังทศนิยม',
  directions: 'อ่านค่าประจำหลัก เปรียบเทียบ บวกลบ และแก้โจทย์เงินบาท/สตางค์',
  topicOptions: '<option value="mixed">ผสมทุกทักษะ</option><option value="read">อ่านทศนิยม</option><option value="compare">เปรียบเทียบ</option><option value="addsub">บวกลบ</option><option value="money">เงินบาท/สตางค์</option>',
  items: decimalItems,
  renderBody: `const e=window.KampaiTopicWorksheet.escapeHtml;
    if(item.type==='read'){
      return '<div class="q-prompt">'+e(item.prompt)+' · '+e(item.value)+'</div>'
        +'<table class="mini-table place-value-table"><tr><th>หลักสิบ</th><th>หลักหน่วย</th><th>.</th><th>สิบส่วน</th><th>ร้อยส่วน</th></tr>'
        +'<tr><td>____</td><td>____</td><td>.</td><td>____</td><td>____</td></tr></table>'
        +'<div>อ่านค่า / อธิบาย</div><div class="work-line"></div><div class="reason-line"></div>'
        +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';
    }
    if(item.type==='compare'){
      return '<div class="q-prompt">'+e(item.prompt)+'</div>'
        +'<div class="q-context">'+e(item.left)+(item.right?' กับ '+e(item.right):'')+'</div>'
        +'<div class="choice-row"><span class="check">[ ] &gt;</span><span class="check">[ ] &lt;</span><span class="check">[ ] =</span></div>'
        +'<div>วิธีเทียบ</div><div class="calc-line"></div><div class="work-line"></div>'
        +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';
    }
    if(item.type==='money'){
      return '<div class="q-prompt">'+e(item.prompt)+'</div>'
        +'<div class="q-context">'+e(item.value||item.expr)+'</div>'
        +'<div>ตั้งตามหลักเงิน · จุดทศนิยมตรงกัน</div><div class="calc-line"></div><div class="work-line"></div>'
        +'<div>คำตอบ ____________ บาท</div>'
        +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';
    }
    return '<div class="q-prompt">'+e(item.prompt)+'</div><div class="q-context">'+e(item.expr)+'</div>'
      +'<div>ตั้งตามหลัก · จุดทศนิยมตรงกัน</div><div class="calc-line"></div><div class="work-line"></div>'
      +'<div>คำตอบ ____________</div><span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';`,
});

sheet({
  file: 'math-fraction-hub-worksheet.html',
  hub: '/games/math/math-fraction-hub/index.html',
  indicators: ['ค 1.1 ป.4/13', 'ค 1.1 ป.4/14'],
  icon: '🍕', title: 'ใบงานคลังเศษส่วน', gradeLabel: 'ป.4', mediaLabel: 'คลังเศษส่วน',
  directions: 'ระบายแท่งเศษส่วน เทียบค่า บวกลบตัวส่วนเท่า และจำนวนคละ',
  topicOptions: '<option value="mixed">ผสมทุกทักษะ</option><option value="bar">แท่งเศษส่วน</option><option value="compare">เทียบเศษส่วน</option><option value="add">บวก</option><option value="sub">ลบ</option><option value="whole">จำนวนคละ</option>',
  items: fractionItems,
  renderBody: `const e=window.KampaiTopicWorksheet.escapeHtml;
    if(item.type==='bar'){
      const boxes=Array.from({length:item.parts},()=>'<div class="fraction-cell">[ ]</div>').join('');
      return '<div class="q-prompt">'+e(item.prompt)+' · '+e(item.frac)+'</div>'
        +'<div class="fraction-bar fraction-hub-grid">'+boxes+'</div>'
        +'<div>เศษส่วน = ________</div><div class="work-line"></div><div class="reason-line"></div>'
        +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';
    }
    if(item.type==='compare'){
      return '<div class="q-prompt">'+e(item.prompt)+'</div>'
        +'<div class="q-context">'+e(item.left)+' กับ '+e(item.right)+'</div>'
        +'<div class="classify-grid fraction-hub-grid"><div class="classify-box">[ ] &lt;</div><div class="classify-box">[ ] =</div><div class="classify-box">[ ] &gt;</div><div class="classify-box">สมมูล: ____</div></div>'
        +'<div class="work-line"></div><div class="reason-line"></div>'
        +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';
    }
    if(item.type==='whole'){
      return '<div class="q-prompt">'+e(item.prompt)+'</div>'
        +'<div class="q-context">'+e(item.value||item.expr)+'</div>'
        +'<div class="decision-box fraction-hub-grid">จำนวนคละ / เศษเกิน: ________</div>'
        +'<div class="calc-line"></div><div class="work-line"></div><div class="reason-line"></div>'
        +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';
    }
    return '<div class="q-prompt">'+e(item.prompt)+'</div><div class="q-context">'+e(item.expr)+'</div>'
      +'<div class="fraction-hub-grid"><div class="decision-box">ตัวเศษ ____ · ตัวส่วน ____</div></div>'
      +'<div class="calc-line"></div><div class="work-line"></div><div class="reason-line"></div>'
      +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';`,
});

sheet({
  file: 'math-geometry-hub-worksheet.html',
  hub: '/games/math/math-geometry-hub/index.html',
  indicators: ['ค 2.2 ป.4/1', 'ค 2.2 ป.4/2'],
  icon: '📐', title: 'ใบงานคลังเรขาคณิต', gradeLabel: 'ป.4–ป.5', mediaLabel: 'คลังเรขาคณิต',
  directions: 'จำแนกมุม คำนวณเส้นรอบรูป/พื้นที่ และบอกลักษณะรูปเรขา',
  topicOptions: '<option value="mixed">ผสมทุกทักษะ</option><option value="angle">มุม</option><option value="perimeter">เส้นรอบรูป</option><option value="area">พื้นที่</option><option value="shapes">รูปเรขา 2D</option>',
  items: geometryItems,
  renderBody: `const e=window.KampaiTopicWorksheet.escapeHtml;
    if(item.type==='angle'){
      return '<div class="q-prompt">'+e(item.prompt)+' · '+e(item.degrees)+'</div>'
        +'<div class="classify-grid geometry-hub-grid angle-type-grid">'
        +'<div class="classify-box">[ ] มุมแหลม</div><div class="classify-box">[ ] มุมฉาก</div>'
        +'<div class="classify-box">[ ] มุมป้าน</div><div class="classify-box">[ ] มุมตรง</div></div>'
        +'<div class="reason-line"></div>'
        +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';
    }
    if(item.type==='perimeter'){
      return '<div class="q-prompt">'+e(item.prompt)+'</div>'
        +'<div class="q-context">กว้าง '+item.w+' · ยาว '+item.h+'</div>'
        +'<div class="decision-box geometry-hub-grid">สูตรเส้นรอบรูป: ____________________</div>'
        +'<div class="calc-line"></div><div class="work-line"></div><div class="reason-line"></div>'
        +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';
    }
    if(item.type==='area'){
      return '<div class="q-prompt">'+e(item.prompt)+'</div>'
        +'<div class="q-context">กว้าง '+item.w+' · ยาว '+item.h+'</div>'
        +'<div class="decision-box geometry-hub-grid">สูตรพื้นที่: กว้าง × ยาว = ________</div>'
        +'<div class="calc-line"></div><div class="work-line"></div><div class="reason-line"></div>'
        +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';
    }
    return '<div class="q-prompt">'+e(item.prompt)+' · '+e(item.shape)+'</div>'
      +'<div class="classify-grid geometry-hub-grid">'
      +'<div class="classify-box">ด้าน: ____</div><div class="classify-box">มุม: ____</div>'
      +'<div class="classify-box">ลักษณะ: ________</div><div class="classify-box">ตัวอย่างในชีวิต: ________</div></div>'
      +'<div class="reason-line"></div>'
      +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';`,
});
