#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VER = '1.172.0';
const CSS_VER = '1.172.0';

const FOOTER = `</script><script src="/games/worksheet-topic.js?v=${VER}"></script><script>function render(){window.KampaiTopicWorksheet.render();}document.getElementById('btnRandom').onclick=window.KampaiTopicWorksheet.randomize;document.getElementById('btnAnswers').onclick=()=>document.body.classList.toggle('show-answers');document.getElementById('btnPrint').onclick=()=>window.print();window.KampaiWorksheet.loadTeachers();render();</script><script src="/games/worksheet-modes.js?v=${VER}"></script></body></html>`;

function shell({ icon, title, sourceMedia, indicators, topics, gradeOptions, bodyScript }) {
  const topicOpts = topics.map((t) => `<option value="${t.value}">${t.label}</option>`).join('');
  const gradeOpts = gradeOptions.map((g) => `<option value="${g}">ป.${g}</option>`).join('');
  const indMeta = indicators.join(', ');
  return `<!DOCTYPE html><html lang="th"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="worksheet-source-media" content="${sourceMedia}"><meta name="curriculum-indicators" content="${indMeta}"><title>${title} ป.4–6 — โรงเรียนบ้านคำไผ่</title><link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet"><link href="/games/worksheet-topic.css?v=${CSS_VER}" rel="stylesheet"><link href="/games/worksheet-modes.css?v=${VER}" rel="stylesheet"></head><body>
<header class="toolbar"><h1>${icon} ${title}</h1><div class="toolbar-ctrls"><select class="t-select" id="selStyle" aria-label="รูปแบบใบงาน"><option value="standard">มาตรฐาน</option><option value="progressive">บันไดระดับ</option><option value="booklet">รวมเล่ม</option></select><select class="t-select" id="selPageCount" aria-label="จำนวนหน้า"><option value="1">1 หน้า</option><option value="2">2 หน้า</option><option value="3">3 หน้า</option></select><select class="t-select" id="selGrade" aria-label="ระดับชั้น">${gradeOpts}</select><select class="t-select" id="selTopic" aria-label="ทักษะ"><option value="mixed">ผสมทุกทักษะ</option>${topicOpts}</select><select class="t-select" id="selCount" aria-label="จำนวนข้อ"><option value="10">10 ข้อ</option><option value="5">5 ข้อ</option></select><input class="t-input" id="inpSchool" value="โรงเรียนบ้านคำไผ่" aria-label="ชื่อโรงเรียน"><select class="t-select" id="selTeacher" aria-label="ครูผู้สอน"><option value="">-- เลือกครูผู้สอน --</option></select><button class="btn primary" id="btnRandom">🎲 สุ่มใหม่</button><button class="btn" id="btnAnswers">👁 เฉลยครู</button><button class="btn green" id="btnPrint">🖨 พิมพ์ A4</button></div></header><main class="pages" id="pages"><section class="sheet"><div class="questions"><article class="q">กำลังสร้างใบงาน</article></div></section></main>
<script src="/games/worksheet-runtime.js?v=${VER}"></script><script>
${bodyScript}
${FOOTER}`;
}

const worksheets = [
  {
    out: 'public/games/math/decimal-worksheet.html',
    html: shell({
      icon: '🔢',
      title: 'ใบงานทศนิยม',
      sourceMedia: '/games/math/decimal-media.html',
      indicators: ['ค 1.1 ป.4/5', 'ค 1.1 ป.4/6'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'read', label: 'อ่านค่า' },
        { value: 'compare', label: 'เปรียบเทียบ' },
        { value: 'add', label: 'บวก–ลบ' },
        { value: 'apply', label: 'ประยุกต์ใช้' },
      ],
      bodyScript: `const DECIMAL_ITEMS=[
 {type:'read',prompt:'เขียนค่าทศนิยมเป็นตัวเลข',word:'สองจุดห้า',value:'2.5',answer:'2.5'},
 {type:'read',prompt:'อ่านค่าทศนิยมเป็นคำไทย',word:'3.75',value:'3.75',answer:'สามจุดเจ็ดห้า'},
 {type:'read',prompt:'ระบุค่าหลักสิบและหลักทศนิยม',word:'4.08',value:'4.08',answer:'หลักสิบ=0 · หลักทศนิยม=8'},
 {type:'compare',prompt:'ใส่ > < = ให้ถูกต้อง',word:'2.5 ___ 2.50',value:'2.5 vs 2.50',answer:'='},
 {type:'compare',prompt:'เรียงจากน้อยไปมาก (เขียนคำตอบ)',word:'1.2 , 1.05 , 1.20',value:'สามค่า',answer:'1.05 < 1.2 = 1.20'},
 {type:'compare',prompt:'ค่าใดมากกว่า',word:'0.9 หรือ 0.89',value:'0.9 vs 0.89',answer:'0.9'},
 {type:'add',prompt:'คำนวณผลบวก',word:'2.3 + 1.4',value:'2.3+1.4',answer:'3.7'},
 {type:'add',prompt:'คำนวณผลลบ',word:'5.6 − 2.15',value:'5.6-2.15',answer:'3.45'},
 {type:'add',prompt:'หาเงินทอน',word:'มี 10 บาท ซื้อของ 7.25 บาท',value:'10-7.25',answer:'2.75 บาท'},
 {type:'apply',prompt:'วัดความยาวได้ 3.5 ซม. อีก 0.8 ซม. รวมเท่าไร',word:'3.5+0.8',value:'ความยาว',answer:'4.3 ซม.'},
 {type:'apply',prompt:'น้ำหนัก 2.25 กก. กับ 2.3 กก. หนักกว่ากันเท่าไร',word:'2.3-2.25',value:'กก.',answer:'2.3 กก. หนักกว่า 0.05 กก.'},
 {type:'apply',prompt:'ถ้า 1 แท่ง = 0.1 มี 12 แท่ง รวมเท่าไร',word:'12×0.1',value:'แท่ง',answer:'1.2'}
];
window.WORKSHEET_CONFIG={icon:'🔢',title:'ใบงานทศนิยม',subject:'คณิตศาสตร์',gradeLabel:'ป.4–6',mediaLabel:'ทศนิยม',sourceMediaUrl:'/games/math/decimal-media.html',indicators:['ค 1.1 ป.4/5','ค 1.1 ป.4/6'],directions:'อ่านค่า เปรียบเทียบ บวกลบ และใช้ทศนิยมในชีวิตจริง',getItems(topic){return topic==='mixed'?DECIMAL_ITEMS:DECIMAL_ITEMS.filter(i=>i.type===topic);},buildDecimalWork(item){if(item.type==='read'){if(item.prompt.includes('หลัก'))return{line1:'4.08 → หลักหน่วย=4 หลักสิบ=0 หลักทศนิยม=8',line2:item.answer};return{line1:item.prompt.includes('คำ')?'อ่าน '+item.word+' = '+item.answer:'เขียน '+item.word+' → '+item.value,line2:'ตอบ: '+item.answer};}if(item.type==='compare'){if(item.word.includes('___'))return{line1:'2.5 กับ 2.50 ค่าเท่ากัน (ศูนย์ท้ายไม่เปลี่ยนค่า)',line2:'ตอบ: '+item.answer};if(item.prompt.includes('เรียง'))return{line1:'เทียบหลักหน่วยเท่ากัน → ดูทศนิยม',line2:'ตอบ: '+item.answer};return{line1:'เทียบหลัก: '+item.word,line2:'ตอบ: '+item.answer};}if(item.type==='add'){if(item.value==='10-7.25')return{line1:'10.00 − 7.25 = 2.75',line2:'ตอบ: '+item.answer};if(item.value==='5.6-2.15')return{line1:'5.60 − 2.15 = 3.45',line2:'ตอบ: '+item.answer};return{line1:item.word+' = '+item.answer.split(' ')[0],line2:'ตอบ: '+item.answer};}return{line1:'ลงวิธี: '+item.word,line2:'ตอบ: '+item.answer};},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;const w=this.buildDecimalWork(item);return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><table class="mini-table"><tr><th>โจทย์</th><th>ข้อมูล</th></tr><tr><td>'+e(item.word)+'</td><td>'+e(item.value)+'</td></tr></table><div>ลงวิธีคิด</div></div><div class="q-work-block"><div class="calc-line"><span class="work-fill">'+e(w.line1)+'</span></div><div class="calc-line"><span class="work-fill">'+e(w.line2)+'</span></div></div><div class="q-foot"><div class="answer-line">ตอบ <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },
  {
    out: 'public/games/math/angle-worksheet.html',
    html: shell({
      icon: '📐',
      title: 'ใบงานมุม',
      sourceMedia: '/games/math/angle-media.html',
      indicators: ['ค 2.2 ป.4/1', 'ค 2.2 ป.4/2'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'classify', label: 'จำแนกชนิดมุม' },
        { value: 'measure', label: 'วัด/อ่านค่า' },
        { value: 'apply', label: 'ประยุกต์ใช้' },
      ],
      bodyScript: `const ANGLE_ITEMS=[
 {type:'classify',prompt:'จำแนกชนิดมุม',deg:35,answer:'มุมแหลม (< 90°)'},
 {type:'classify',prompt:'จำแนกชนิดมุม',deg:90,answer:'มุมฉาก (= 90°)'},
 {type:'classify',prompt:'จำแนกชนิดมุม',deg:110,answer:'มุมป้าน (> 90° แต่ < 180°)'},
 {type:'classify',prompt:'จำแนกชนิดมุม',deg:180,answer:'มุมตรง (= 180°)'},
 {type:'measure',prompt:'อ่านขนาดมุมจากโพรแทรกเตอร์',deg:45,answer:'45°'},
 {type:'measure',prompt:'มุมนี้มีขนาดเท่าไร',deg:120,answer:'120°'},
 {type:'measure',prompt:'มุมที่โคจรเคลื่อนที่จาก 0° ไปถึงเส้นนี้',deg:75,answer:'75°'},
 {type:'apply',prompt:'มุมใดเป็นมุมฉากในห้องเรียน',deg:90,answer:'มุมหน้าต่าง/มุมโต๊ะ'},
 {type:'apply',prompt:'ถ้ามุม A = 30° และมุม B = 60° รวมเป็นมุมฉากหรือไม่',deg:90,answer:'ใช่ 30°+60°=90°'},
 {type:'apply',prompt:'มุม 95° ควรจำแนกเป็น',deg:95,answer:'มุมป้าน'},
 {type:'apply',prompt:'เขียนเหตุผลว่าทำไม 89° จึงเป็นมุมแหลม',deg:89,answer:'เพราะน้อยกว่า 90°'},
 {type:'apply',prompt:'มุมสามเหลี่ยมหนึ่งมุม 40° อีกมุม 50° มุมที่สามเท่าไร',deg:90,answer:'90° (180°−40°−50°)'}
];
window.WORKSHEET_CONFIG={icon:'📐',title:'ใบงานมุม',subject:'คณิตศาสตร์',gradeLabel:'ป.4–6',mediaLabel:'มุม',sourceMediaUrl:'/games/math/angle-media.html',indicators:['ค 2.2 ป.4/1','ค 2.2 ป.4/2'],directions:'จำแนกมุมแหลม ฉาก ป้าน อ่านค่า และใช้เหตุผล',getItems(topic){return topic==='mixed'?ANGLE_ITEMS:ANGLE_ITEMS.filter(i=>i.type===topic);},buildAngleWork(item){if(item.type==='classify'){const d=item.deg;if(d<90)return{line1:''+d+'° < 90° → มุมแหลม',line2:item.answer};if(d===90)return{line1:d+'° = 90° → มุมฉาก',line2:item.answer};if(d<180)return{line1:d+'° > 90° และ < 180° → มุมป้าน',line2:item.answer};return{line1:d+'° = 180° → มุมตรง',line2:item.answer};}if(item.type==='measure')return{line1:'อ่านจากโพรแทรกเตอร์ที่ '+item.deg+'°',line2:'ตอบ: '+item.answer};return{line1:'ใช้ความรู้มุม '+item.deg+'°',line2:item.answer};},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;const w=this.buildAngleWork(item);return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><div class="classify-grid"><div class="classify-box">มุม '+item.deg+'°</div><div class="classify-box">แหลม / ฉาก / ป้าน / ตรง</div></div><div>ลงเหตุผล</div></div><div class="q-work-block"><div class="calc-line"><span class="work-fill">'+e(w.line1)+'</span></div><div class="calc-line"><span class="work-fill">'+e(w.line2)+'</span></div></div><div class="q-foot"><div class="answer-line">ตอบ <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },
  {
    out: 'public/games/math/fraction-pieces-worksheet.html',
    html: shell({
      icon: '🍰',
      title: 'ใบงานเศษส่วน',
      sourceMedia: '/games/math/fraction-pieces.html',
      indicators: ['ค 1.1 ป.4/3', 'ค 1.1 ป.4/4'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'shade', label: 'แทนค่าเศษส่วน' },
        { value: 'compare', label: 'เปรียบเทียบ' },
        { value: 'equivalent', label: 'เท่ากัน' },
        { value: 'add', label: 'บวกเศษส่วน' },
      ],
      bodyScript: `const FRACTION_ITEMS=[
 {type:'shade',prompt:'เศษส่วนใดแทนแท่งที่ทึบ 2 จาก 4 ช่อง',frac:'2/4',answer:'2/4 หรือ 1/2'},
 {type:'shade',prompt:'เขียนเศษส่วนที่แทน 3 ชิ้นจาก 8 ชิ้น',frac:'3/8',answer:'3/8'},
 {type:'shade',prompt:'ถ้าเต็ม 1 แผ่น มี 6 ช่อง ทึบ 1 ช่อง คือ',frac:'1/6',answer:'1/6'},
 {type:'compare',prompt:'ใส่ > < = : 3/4 ___ 2/4',frac:'3/4 vs 2/4',answer:'>'},
 {type:'compare',prompt:'เศษส่วนใดมากกว่า 5/8 หรือ 3/8',frac:'5/8 vs 3/8',answer:'5/8'},
 {type:'compare',prompt:'เรียงจากน้อยไปมาก: 1/2 , 1/4 , 3/4',frac:'สามค่า',answer:'1/4 < 1/2 < 3/4'},
 {type:'equivalent',prompt:'เศษส่วนใดเท่ากับ 1/2',frac:'2/4',answer:'2/4 = 1/2'},
 {type:'equivalent',prompt:'3/6 เท่ากับเศษส่วนใด',frac:'3/6',answer:'1/2'},
 {type:'add',prompt:'1/4 + 1/4 =',frac:'1/4+1/4',answer:'2/4 = 1/2'},
 {type:'add',prompt:'1/8 + 3/8 =',frac:'1/8+3/8',answer:'4/8 = 1/2'},
 {type:'add',prompt:'2/5 + 1/5 =',frac:'2/5+1/5',answer:'3/5'},
 {type:'add',prompt:'1/3 + 1/3 =',frac:'1/3+1/3',answer:'2/3'}
];
window.WORKSHEET_CONFIG={icon:'🍰',title:'ใบงานเศษส่วน',subject:'คณิตศาสตร์',gradeLabel:'ป.4–6',mediaLabel:'เศษส่วนชิ้น',sourceMediaUrl:'/games/math/fraction-pieces.html',indicators:['ค 1.1 ป.4/3','ค 1.1 ป.4/4'],directions:'แทนเศษส่วน เปรียบเทียบ หาเท่ากัน และบวกเศษส่วนที่ตัวส่วนเท่ากัน',getItems(topic){return topic==='mixed'?FRACTION_ITEMS:FRACTION_ITEMS.filter(i=>i.type===topic);},buildFractionWork(item){if(item.type==='shade')return{line1:'ทึบ/เต็ม → '+item.frac,line2:'ตอบ: '+item.answer};if(item.type==='compare'){if(item.frac.includes('vs'))return{line1:'ตัวส่วนเท่ากัน → ดูตัวเศษ',line2:'ตอบ: '+item.answer};return{line1:'เทียบขนาดชิ้น/ตัวเศษ',line2:'ตอบ: '+item.answer};}if(item.type==='equivalent')return{line1:'ขยาย/ย่อตัวเศษและตัวส่วน',line2:'ตอบ: '+item.answer};return{line1:item.frac+' → ตัวส่วนเท่ากัน บวกตัวเศษ',line2:'ตอบ: '+item.answer};},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;const w=this.buildFractionWork(item);return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><div class="bar-preview"><i style="height:55%"></i><i style="height:80%"></i><i style="height:35%"></i><i style="height:100%"></i></div><div class="q-context">เศษส่วน: '+e(item.frac)+'</div></div><div class="q-work-block"><div class="calc-line"><span class="work-fill">'+e(w.line1)+'</span></div><div class="calc-line"><span class="work-fill">'+e(w.line2)+'</span></div></div><div class="q-foot"><div class="answer-line">ตอบ <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },
  {
    out: 'public/games/science/states-of-matter-worksheet.html',
    html: shell({
      icon: '🧊',
      title: 'ใบงานสสารสามสถานะ',
      sourceMedia: '/games/science/states-of-matter.html',
      indicators: ['ว 2.1 ป.4/3', 'ว 2.1 ป.4/4'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'identify', label: 'จำแนกสถานะ' },
        { value: 'change', label: 'การเปลี่ยนสถานะ' },
        { value: 'explain', label: 'อธิบายเหตุผล' },
      ],
      bodyScript: `const MATTER_ITEMS=[
 {type:'identify',prompt:'น้ำแข็งอยู่สถานะใด',sample:'น้ำแข็ง',answer:'ของแข็ง'},
 {type:'identify',prompt:'ไอน้ำอยู่สถานะใด',sample:'ไอน้ำ',answer:'ของแก๊ส'},
 {type:'identify',prompt:'น้ำในขวดอยู่สถานะใด',sample:'น้ำในขวด',answer:'ของเหลว'},
 {type:'identify',prompt:'อากาศที่หายใจอยู่สถานะใด',sample:'อากาศ',answer:'ของแก๊ส'},
 {type:'change',prompt:'น้ำแข็งละลายกลายเป็น',sample:'ละลาย',answer:'ของเหลว (น้ำ)'},
 {type:'change',prompt:'น้ำเดือดกลายเป็น',sample:'เดือด',answer:'ของแก๊ส (ไอน้ำ)'},
 {type:'change',prompt:'ไอน้ำเย็นตัวกลายเป็น',sample:'ควบแน่น',answer:'ของเหลว (หยดน้ำ)'},
 {type:'change',prompt:'ของเหลวแข็งตัวเรียกว่า',sample:'แช่แข็ง',answer:'การแข็งตัว'},
 {type:'explain',prompt:'ทำไมของแข็งมีรูปร่างคงที่',sample:'ของแข็ง',answer:'อนุภาคจัดเรียงแน่นและสั่นในตำแหน่ง'},
 {type:'explain',prompt:'ทำไมของเหลวรับรูปตามภาชนะ',sample:'ของเหลว',answer:'อนุภาคเลื่อนตัวได้แต่ยังใกล้กัน'},
 {type:'explain',prompt:'ทำไมของแก๊สกระจายเต็มพื้นที่',sample:'ของแก๊ส',answer:'อนุภาคเคลื่อนที่เร็วและห่างกันมาก'},
 {type:'explain',prompt:'ความร้อนส่งผลต่อการเปลี่ยนสถานะอย่างไร',sample:'ความร้อน',answer:'เพิ่มพลังงานให้อนุภาค ทำให้เปลี่ยนสถานะได้'}
];
window.WORKSHEET_CONFIG={icon:'🧊',title:'ใบงานสสารสามสถานะ',subject:'วิทยาศาสตร์',gradeLabel:'ป.4–6',mediaLabel:'สสารสามสถานะ',sourceMediaUrl:'/games/science/states-of-matter.html',indicators:['ว 2.1 ป.4/3','ว 2.1 ป.4/4'],directions:'จำแนกของแข็ง ของเหลว ของแก๊ส อธิบายการเปลี่ยนสถานะและเหตุผล',getItems(topic){return topic==='mixed'?MATTER_ITEMS:MATTER_ITEMS.filter(i=>i.type===topic);},buildMatterWork(item){if(item.type==='identify')return{line1:'สังเกต '+item.sample+' → จัดกลุ่มสถานะ',line2:'ตอบ: '+item.answer};if(item.type==='change')return{line1:'การเปลี่ยนสถานะ: '+item.sample,line2:'ตอบ: '+item.answer};return{line1:'อธิบายพฤติกรรมอนุภาค',line2:item.answer};},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;const w=this.buildMatterWork(item);return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><div class="classify-grid"><div class="classify-box">ของแข็ง</div><div class="classify-box">ของเหลว</div><div class="classify-box">ของแก๊ส</div><div class="classify-box">'+e(item.sample)+'</div></div></div><div class="q-work-block"><div class="reason-line"><span class="work-fill">'+e(w.line1)+'</span></div><div class="reason-line"><span class="work-fill">'+e(w.line2)+'</span></div></div><div class="q-foot"><div class="answer-line">ตอบ <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },
  {
    out: 'public/games/science/vertebrate-sort-worksheet.html',
    html: shell({
      icon: '🦴',
      title: 'ใบงานสัตว์มี/ไม่มีกระดูกสันหลัง',
      sourceMedia: '/games/science/vertebrate-sort.html',
      indicators: ['ว 1.3 ป.4/3', 'ว 1.3 ป.4/4'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'sort', label: 'จำแนกกลุ่ม' },
        { value: 'feature', label: 'ลักษณะสำคัญ' },
        { value: 'apply', label: 'ยกตัวอย่าง' },
      ],
      bodyScript: `const VERT_ITEMS=[
 {type:'sort',prompt:'จำแนก: ปลา',animal:'ปลา',answer:'สัตว์มีกระดูกสันหลัง (สัตว์มีกระดูก)'},
 {type:'sort',prompt:'จำแนก: แมลง',animal:'แมลง',answer:'สัตว์ไม่มีกระดูกสันหลัง (arthropod)'},
 {type:'sort',prompt:'จำแนก: นก',animal:'นก',answer:'สัตว์มีกระดูกสันหลัง'},
 {type:'sort',prompt:'จำแนก: หมึก',animal:'หมึก',answer:'สัตว์ไม่มีกระดูกสันหลัง'},
 {type:'feature',prompt:'สัตว์มีกระดูกสันหลังมีโครงสร้างใดสำคัญ',animal:'กระดูกสันหลัง',answer:'กระดูกสันหลังค้ำและปกป้องอวัยวะภายใน'},
 {type:'feature',prompt:'สัตว์ไม่มีกระดูกสันหลังมักมีลักษณะใด',animal:'ไม่มีกระดูก',answer:'ร่างกายหุ้มเปลือกแข็งหรือเนื้อนุ่ม'},
 {type:'feature',prompt:'ทำไมปลาถึงอยู่ในกลุ่มสัตว์มีกระดูก',animal:'ปลา',answer:'มีกระดูกสันหลังภายใน'},
 {type:'apply',prompt:'ยกตัวอย่างสัตว์มีกระดูกสันหลังอีก 1 ชนิด',animal:'ตัวอย่าง',answer:'เช่น กบ แมว งู'},
 {type:'apply',prompt:'ยกตัวอย่างสัตว์ไม่มีกระดูกสันหลังอีก 1 ชนิด',animal:'ตัวอย่าง',answer:'เช่น กุ้ง ปลาหมึก หนอน'},
 {type:'apply',prompt:'มนุษย์จัดอยู่กลุ่มใด เพราะอะไร',animal:'มนุษย์',answer:'สัตว์มีกระดูกสันหลัง เพราะมีกระดูกสันหลัง'},
 {type:'apply',prompt:'ถ้าพบสัตว์มีเปลือกแข็งแต่ไม่มีกระดูก จัดกลุ่มใด',animal:'เปลือกแข็ง',answer:'สัตว์ไม่มีกระดูกสันหลัง'},
 {type:'apply',prompt:'เขียนเกณฑ์หนึ่งข้อในการจำแนก',animal:'เกณฑ์',answer:'ดูว่ามีกระดูกสันหลังภายในหรือไม่'}
];
window.WORKSHEET_CONFIG={icon:'🦴',title:'ใบงานสัตว์มี/ไม่มีกระดูกสันหลัง',subject:'วิทยาศาสตร์',gradeLabel:'ป.4–6',mediaLabel:'จำแนกสัตว์',sourceMediaUrl:'/games/science/vertebrate-sort.html',indicators:['ว 1.3 ป.4/3','ว 1.3 ป.4/4'],directions:'จำแนกสัตว์ อธิบายลักษณะ และยกตัวอย่างอย่างมีเหตุผล',getItems(topic){return topic==='mixed'?VERT_ITEMS:VERT_ITEMS.filter(i=>i.type===topic);},buildVertWork(item){if(item.type==='sort')return{line1:'พิจารณา '+item.animal+': มีกระดูกสันหลังหรือไม่',line2:'ตอบ: '+item.answer};if(item.type==='feature')return{line1:'ลักษณะสำคัญของ '+item.animal,line2:item.answer};return{line1:'ยกตัวอย่าง/ใช้เกณฑ์จำแนก',line2:item.answer};},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;const w=this.buildVertWork(item);return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><div class="classify-grid"><div class="classify-box">มีกระดูกสันหลัง</div><div class="classify-box">ไม่มีกระดูกสันหลัง</div></div><div class="q-context">'+e(item.animal)+'</div></div><div class="q-work-block"><div class="reason-line"><span class="work-fill">'+e(w.line1)+'</span></div><div class="reason-line"><span class="work-fill">'+e(w.line2)+'</span></div></div><div class="q-foot"><div class="answer-line">ตอบ <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },
  {
    out: 'public/games/thai/thai-word-types-worksheet.html',
    html: shell({
      icon: '📝',
      title: 'ใบงานชนิดของคำ',
      sourceMedia: '/games/thai/thai-word-types.html',
      indicators: ['ท 4.1 ป.4/2', 'ท 4.1 ป.4/6'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'noun', label: 'คำนาม' },
        { value: 'verb', label: 'คำกริยา' },
        { value: 'adj', label: 'คำคุณศัพท์' },
        { value: 'sentence', label: 'วิเคราะห์ในประโยค' },
      ],
      bodyScript: `const WORDTYPE_ITEMS=[
 {type:'noun',prompt:'จำแนกชนิดคำ: นักเรียน',word:'นักเรียน',answer:'คำนาม (ชื่อคน)'},
 {type:'noun',prompt:'จำแนกชนิดคำ: โต๊ะ',word:'โต๊ะ',answer:'คำนาม (ชื่อสิ่งของ)'},
 {type:'noun',prompt:'จำแนกชนิดคำ: โรงเรียน',word:'โรงเรียน',answer:'คำนาม (ชื่อสถานที่)'},
 {type:'verb',prompt:'จำแนกชนิดคำ: วิ่ง',word:'วิ่ง',answer:'คำกริยา (แสดงการกระทำ)'},
 {type:'verb',prompt:'จำแนกชนิดคำ: อ่าน',word:'อ่าน',answer:'คำกริยา'},
 {type:'verb',prompt:'จำแนกชนิดคำ: คิด',word:'คิด',answer:'คำกริยา (แสดงกิริยา/สภาวะ)'},
 {type:'adj',prompt:'จำแนกชนิดคำ: สวย',word:'สวย',answer:'คำคุณศัพท์ (บอกคุณลักษณะ)'},
 {type:'adj',prompt:'จำแนกชนิดคำ: เก่ง',word:'เก่ง',answer:'คำคุณศัพท์'},
 {type:'adj',prompt:'จำแนกชนิดคำ: ร้อน',word:'ร้อน',answer:'คำคุณศัพท์ (บอกสภาพ)'},
 {type:'sentence',prompt:'ในประโยค "เด็กเก่งอ่านหนังสือ" คำใดเป็นกริยา',word:'เด็กเก่งอ่านหนังสือ',answer:'อ่าน'},
 {type:'sentence',prompt:'ในประโยค "ดอกไม้สวยมาก" คำใดเป็นคุณศัพท์',word:'ดอกไม้สวยมาก',answer:'สวย'},
 {type:'sentence',prompt:'ในประโยค "ครูสอนดี" คำใดเป็นนาม',word:'ครูสอนดี',answer:'ครู'}
];
window.WORKSHEET_CONFIG={icon:'📝',title:'ใบงานชนิดของคำ',subject:'ภาษาไทย',gradeLabel:'ป.4–6',mediaLabel:'ชนิดของคำ',sourceMediaUrl:'/games/thai/thai-word-types.html',indicators:['ท 4.1 ป.4/2','ท 4.1 ป.4/6'],directions:'จำแนกคำนาม คำกริยา คำคุณศัพท์ และวิเคราะห์ในประโยค',getItems(topic){return topic==='mixed'?WORDTYPE_ITEMS:WORDTYPE_ITEMS.filter(i=>i.type===topic);},buildWordTypeWork(item){if(item.type==='sentence')return{line1:'แยกคำในประโยค: '+item.word,line2:'ตอบ: '+item.answer};return{line1:''+item.word+' → ดูหน้าที่ของคำ',line2:item.answer};},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;const w=this.buildWordTypeWork(item);return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><div class="classify-grid"><div class="classify-box">คำนาม</div><div class="classify-box">คำกริยา</div><div class="classify-box">คำคุณศัพท์</div></div><div class="word-bank"><span>'+e(item.word)+'</span></div></div><div class="q-work-block"><div class="calc-line"><span class="work-fill">'+e(w.line1)+'</span></div><div class="calc-line"><span class="work-fill">'+e(w.line2)+'</span></div></div><div class="q-foot"><div class="answer-line">ตอบ <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },
  {
    out: 'public/games/thai/synonym-worksheet.html',
    html: shell({
      icon: '🔤',
      title: 'ใบงานคำพ้อง/คำตรงข้าม',
      sourceMedia: '/games/thai/synonym-media.html',
      indicators: ['ท 1.1 ป.4/2'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'synonym', label: 'คำพ้องความหมาย' },
        { value: 'sentence', label: 'ใช้ในประโยค' },
        { value: 'reason', label: 'อธิบายเหตุผล' },
      ],
      bodyScript: `const SYN_ITEMS=[
 {type:'synonym',prompt:'หาคำพ้องความหมาย: สวย',word:'สวย',answer:'งาม / งดงาม'},
 {type:'synonym',prompt:'หาคำพ้องความหมาย: เร็ว',word:'เร็ว',answer:'ไว / รวดเร็ว'},
 {type:'synonym',prompt:'หาคำพ้องความหมาย: ใหญ่',word:'ใหญ่',answer:'มหึมา / ใหญ่โต'},
 {type:'synonym',prompt:'หาคำพ้องความหมาย: กล้า',word:'กล้า',answer:'เด็ดเดี่ยว / กล้าหาญ'},
 {type:'sentence',prompt:'เลือกคำพ้องที่เหมาะ: ดอกไม้___มาก',word:'สวย/งาม',answer:'งาม'},
 {type:'sentence',prompt:'เติมคำพ้อง: นักเรียน___ไปโรงเรียน',word:'เร็ว/ไว',answer:'รีบ / ไว'},
 {type:'sentence',prompt:'เขียนประโยคใช้คำพ้องของ "เศร้า"',word:'เศร้า',answer:'เช่น วันนี้เขารู้สึกโศกเศร้า'},
 {type:'reason',prompt:'ทำไม "โต" และ "ใหญ่" จึงเป็นคำพ้อง',word:'โต/ใหญ่',answer:'ใกล้เคียงความหมาย บอกขนาดเพิ่มขึ้น'},
 {type:'reason',prompt:'คำใดไม่ใช่คำพ้องของ "ดี"',word:'ดี',answer:'เลว (เป็นคำตรงข้าม)'},
 {type:'reason',prompt:'อธิบายความต่างคำพ้องกับคำตรงข้าม',word:'เปรียบเทียบ',answer:'คำพ้องใกล้ความหมาย คำตรงข้ามตรงกันข้าม'},
 {type:'sentence',prompt:'แทนที่คำให้หลากหลาย: อากาศ___มาก',word:'ร้อน/ร้อนระอุ',answer:'ร้อนระอุ / ร้อนจัด'},
 {type:'synonym',prompt:'หาคำพ้องความหมาย: ฉลาด',word:'ฉลาด',answer:'เฉลียว / หลักแหลม'}
];
window.WORKSHEET_CONFIG={icon:'🔤',title:'ใบงานคำพ้อง/คำตรงข้าม',subject:'ภาษาไทย',gradeLabel:'ป.4–6',mediaLabel:'คำพ้องความหมาย',sourceMediaUrl:'/games/thai/synonym-media.html',indicators:['ท 1.1 ป.4/2'],directions:'หาคำพ้อง ใช้ในประโยค และอธิบายความสัมพันธ์ของคำ',getItems(topic){return topic==='mixed'?SYN_ITEMS:SYN_ITEMS.filter(i=>i.type===topic);},buildSynWork(item){if(item.type==='synonym')return{line1:'คำตั้ง: '+item.word+' → หาความหมายใกล้เคียง',line2:'ตอบ: '+item.answer};if(item.type==='sentence')return{line1:'เลือกคำที่สมความหมายในช่องว่าง',line2:'ตอบ: '+item.answer};return{line1:'เปรียบเทียบความหมายของคำ',line2:item.answer};},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;const w=this.buildSynWork(item);return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><div class="word-bank"><span>'+e(item.word)+'</span></div><div>เหตุผล/ประโยค</div></div><div class="q-work-block"><div class="reason-line"><span class="work-fill">'+e(w.line1)+'</span></div><div class="reason-line"><span class="work-fill">'+e(w.line2)+'</span></div></div><div class="q-foot"><div class="answer-line">ตอบ <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },
  {
    out: 'public/games/science/moon-phases-worksheet.html',
    html: shell({
      icon: '🌙',
      title: 'ใบงานดวงจันทร์และข้างขึ้น',
      sourceMedia: '/games/science/moon-phases-media.html',
      indicators: ['ว 3.1 ป.4/1', 'ว 3.1 ป.4/2'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'order', label: 'เรียงลำดับ' },
        { value: 'name', label: 'เรียกชื่อ' },
        { value: 'cause', label: 'อธิบายเหตุ' },
      ],
      bodyScript: `const MOON_ITEMS=[
 {type:'order',prompt:'เรียงลำดับหลังข้างขึ้น: ขึ้น → ? → ขึ้นเต็มดวง',flow:['ขึ้น','?','ขึ้นเต็มดวง'],answer:'ขึ้น 7 คืน / ขึ้น 8 คืน'},
 {type:'order',prompt:'เรียงหลังขึ้นเต็มดวง',flow:['ขึ้นเต็มดวง','?','?','ดับ'],answer:'แรม → แรม 8 คืน → ดับ'},
 {type:'order',prompt:'ลำดับใกล้เคียง: ดับ → ? → ขึ้น',flow:['ดับ','?','ขึ้น'],answer:'เสี้ยว (ขึ้น)'},
 {type:'name',prompt:'เรียกชื่อข้างขึ้นเมื่อเห็นครึ่งซีกขวา',flow:['ขึ้น','ครึ่ง','?'],answer:'ขึ้น 7 คืน (ครึ่งซีก)'},
 {type:'name',prompt:'คืนที่ไม่เห็นดวงจันทร์เรียกว่า',flow:['ดับ'],answer:'ดับ / จันทร์ดับ'},
 {type:'name',prompt:'คืนที่เห็นดวงจันทร์เต็มวงเรียกว่า',flow:['ขึ้นเต็มดวง'],answer:'ขึ้น 15 คืน / ขึ้นเต็มดวง'},
 {type:'cause',prompt:'ทำไมดวงจันทร์จึงมีข้างขึ้นต่างกัน',flow:['แสง','ดวงจันทร์','โลก'],answer:'เพราะรับแสงจากดวงอาทิตย์และเห็นส่วนสว่างต่างกัน'},
 {type:'cause',prompt:'ดวงจันทร์โคจรรอบโลกใช้เวลาประมาณ',flow:['29-30','วัน'],answer:'29–30 วัน'},
 {type:'cause',prompt:'ทำไมขึ้นเต็มดวงจึงเห็นทั้งดวง',flow:['โลก','ดวงจันทร์','ดวงอาทิตย์'],answer:'โลกอยู่ระหว่างดวงอาทิตย์กับดวงจันทร์ เห็นด้านสว่างเต็ม'},
 {type:'cause',prompt:'ถ้าวันนี้ขึ้น คืนพรุ่งนี้น่าจะเป็นข้างขึ้นใด',flow:['ขึ้น','→','?'],answer:'ขึ้น 2 คืน (ใหญ่ขึ้น)'},
 {type:'cause',prompt:'ยกตัวอย่างกิจกรรมที่ใช้ความรู้ข้างขึ้น',flow:['ปลูก','ประมง','ปฏิทิน'],answer:'ปฏิทินจันทรคติ/วางแผนเก็บเกี่ยว'},
 {type:'cause',prompt:'ดวงจันทร์ส่องแสงเองหรือไม่',flow:['ดวงอาทิตย์','สะท้อน'],answer:'ไม่ สะท้อนแสงจากดวงอาทิตย์'}
];
window.WORKSHEET_CONFIG={icon:'🌙',title:'ใบงานดวงจันทร์และข้างขึ้น',subject:'วิทยาศาสตร์',gradeLabel:'ป.4–6',mediaLabel:'ดวงจันทร์',sourceMediaUrl:'/games/science/moon-phases-media.html',indicators:['ว 3.1 ป.4/1','ว 3.1 ป.4/2'],directions:'เรียงลำดับข้างขึ้น เรียกชื่อ และอธิบายเหตุผลทางดาราศาสตร์',getItems(topic){return topic==='mixed'?MOON_ITEMS:MOON_ITEMS.filter(i=>i.type===topic);},buildMoonWork(item){if(item.type==='order'){const missing=item.flow.indexOf('?');if(missing>=0)return{line1:'ขั้นที่ขาด: '+item.answer.split(' / ')[0],line2:'ลำดับ: '+item.answer};return{line1:'เรียง: '+item.answer,line2:item.flow.join(' → ')};}if(item.type==='name')return{line1:'สังเกตรูปร่างที่สว่าง',line2:'ตอบ: '+item.answer};return{line1:'เชื่อมเหตุ–ผล',line2:item.answer};},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;const w=this.buildMoonWork(item);return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><div class="cycle-flow">'+item.flow.map((step,i)=>'<div class="cycle-step">'+e(step)+'</div>'+(i<item.flow.length-1?'<span class="cycle-arrow">→</span>':'')).join('')+'</div></div><div class="q-work-block"><div class="reason-line"><span class="work-fill">'+e(w.line1)+'</span></div><div class="reason-line"><span class="work-fill">'+e(w.line2)+'</span></div></div><div class="q-foot"><div class="answer-line">ตอบ <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },
  {
    out: 'public/games/social/sukhothai-timeline-worksheet.html',
    html: shell({
      icon: '🏛️',
      title: 'ใบงานไทยสุโขทัย',
      sourceMedia: '/games/social/sukhothai-timeline.html',
      indicators: ['ส 4.3 ป.4/1', 'ส 4.3 ป.4/2', 'ส 4.3 ป.4/3'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'order', label: 'เรียงเหตุการณ์' },
        { value: 'person', label: 'บุคคลสำคัญ' },
        { value: 'significance', label: 'ความสำคัญ' },
      ],
      bodyScript: `const SUK_ITEMS=[
 {type:'order',prompt:'เรียงเหตุการณ์: ก่อตั้งเมือง → ? → มีพระรามาธิบดีที่ 1',flow:['ก่อตั้ง','?','รามาธิบดี I'],answer:'รวมอำนาจ/ขยายเมือง'},
 {type:'order',prompt:'ลำดับการปกครองสุโขทัย',flow:['อิสระ','?','อยุธยา'],answer:'เสื่อม/ถูกรวมเข้ากับอยุธยา'},
 {type:'order',prompt:'เรียง: พ่อขุน → สุโขทัย → ?',flow:['พ่อขุน','สุโขทัย','?'],answer:'อาณาจักรขยาย/ลุ่มน้ำเจ้าพระยา'},
 {type:'person',prompt:'พ่อขุนรามคำแหงมีบทบาทอย่างไร',flow:['พ่อขุน'],answer:'ก่อตั้งและรวมอำนาจเป็นราชอาณาจักรสุโขทัย'},
 {type:'person',prompt:'พระรามาธิบดีที่ 1 มีชื่อเดิมว่า',flow:['รามาธิบดี I'],answer:'พ่อขุนรามคำแหง'},
 {type:'person',prompt:'ใครเป็นผู้ก่อตั้งเมืองสุโขทัย',flow:['ผู้ก่อตั้ง'],answer:'พ่อขุนรามคำแหง (และพ่อขุนศรีอินทร)'},
 {type:'significance',prompt:'อักษรไทยเริ่มใช้ในสมัยใด',flow:['อักษรไทย'],answer:'สมัยสุโขทัย (พ.ศ. 1826)'},
 {type:'significance',prompt:'หลักประชาธิปไตยในศิลาจารึก 1 คือ',flow:['ศิลาจารึก'],answer:'เสรีภาพ/ความสุขของประชาชน (ตามจารึก)'},
 {type:'significance',prompt:'ทำไมสุโขทัยจึงสำคัญต่อประวัติศาสตร์ไทย',flow:['รากเหง้า'],answer:'เป็นราชอาณาจักรไทยรัฐแรก/ต้นกำเนิดอารยธรรมไทย'},
 {type:'significance',prompt:'ลักษณะเมืองสุโขทัยที่เห็นได้',flow:['เมือง'],answer:'มีคูเมือง กำแพง วัดโบราณ เช่น วัดมหาธาตุ'},
 {type:'person',prompt:'พ่อขุนศรีอินทรมีบทบาท',flow:['ศรีอินทร'],answer:'ร่วมก่อตั้งและปกครองช่วงแรก'},
 {type:'order',prompt:'เหตุการณ์ใดแสดงการขยายอำนาจ',flow:['สงคราม','?','รวมเมือง'],answer:'ขยายอำนาจสู่ลุ่มน้ำเจ้าพระยา'}
];
window.WORKSHEET_CONFIG={icon:'🏛️',title:'ใบงานไทยสุโขทัย',subject:'สังคมศึกษา',gradeLabel:'ป.4–6',mediaLabel:'สุโขทัย',sourceMediaUrl:'/games/social/sukhothai-timeline.html',indicators:['ส 4.3 ป.4/1','ส 4.3 ป.4/2','ส 4.3 ป.4/3'],directions:'เรียงเหตุการณ์ ระบุบุคคลสำคัญ และอธิบายความสำคัญของสุโขทัย',getItems(topic){return topic==='mixed'?SUK_ITEMS:SUK_ITEMS.filter(i=>i.type===topic);},buildSukWork(item){if(item.type==='order')return{line1:'เชื่อมเหตุการณ์: '+item.flow.join(' → '),line2:'ตอบ: '+item.answer};if(item.type==='person')return{line1:'บุคคล/บทบาท',line2:item.answer};return{line1:'ความสำคัญทางประวัติศาสตร์',line2:item.answer};},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;const w=this.buildSukWork(item);return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><div class="cycle-flow">'+item.flow.map((step,i)=>'<div class="cycle-step">'+e(step)+'</div>'+(i<item.flow.length-1?'<span class="cycle-arrow">→</span>':'')).join('')+'</div></div><div class="q-work-block"><div class="reason-line"><span class="work-fill">'+e(w.line1)+'</span></div><div class="reason-line"><span class="work-fill">'+e(w.line2)+'</span></div></div><div class="q-foot"><div class="answer-line">ตอบ <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },
  {
    out: 'public/games/health/bone-muscle-worksheet.html',
    html: shell({
      icon: '💪',
      title: 'ใบงานกระดูกและกล้ามเนื้อ',
      sourceMedia: '/games/health/bone-muscle-media.html',
      indicators: ['พ 1.1 ป.4/2', 'พ 1.1 ป.4/3'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'label', label: 'ระบุส่วน' },
        { value: 'function', label: 'หน้าที่' },
        { value: 'care', label: 'การดูแล' },
      ],
      bodyScript: `const BODY_ITEMS=[
 {type:'label',prompt:'โครงสร้างที่ค้ำร่างกายและปกป้องอวัยวะภายใน',part:'กระดูก',answer:'โครงกระดูก'},
 {type:'label',prompt:'เนื้อเยื่อที่ยืดหดทำให้เกิดการเคลื่อนไหว',part:'กล้ามเนื้อ',answer:'กล้ามเนื้อ'},
 {type:'label',prompt:'ข้อต่อระหว่างกระดูกสองชิ้น',part:'ข้อต่อ',answer:'ข้อ (joint)'},
 {type:'function',prompt:'กระดูกทำหน้าที่อะไร',part:'กระดูก',answer:'ค้ำร่างกาย ปกป้องอวัยวะ ยึดเกาะกล้ามเนื้อ'},
 {type:'function',prompt:'กล้ามเนื้อทำหน้าที่อะไร',part:'กล้ามเนื้อ',answer:'ยืดหดเพื่อเคลื่อนไหว'},
 {type:'function',prompt:'ทำไมต้องมีทั้งกระดูกและกล้ามเนื้อ',part:'ทั้งคู่',answer:'กระดูกค้ำโครง กล้ามเนื้อดึงให้ขยับได้'},
 {type:'care',prompt:'วิธีดูแลกระดูกให้แข็งแรง',part:'กระดูก',answer:'กินอาหารมีแคลเซียม ออกกำลัง หลีกเลี่ยงของหนักเกินไป'},
 {type:'care',prompt:'วิธีดูแลกล้ามเนื้อ',part:'กล้ามเนื้อ',answer:'ออกกำลังสม่ำเสมอ พักผ่อน ยืดเหยียด'},
 {type:'care',prompt:'ทำไมต้องวอร์มอัพก่อนออกกำลัง',part:'ข้อต่อ',answer:'ลดการบาดเจ็บ ข้อต่อและกล้ามเนื้อพร้อมทำงาน'},
 {type:'apply',prompt:'ยกกิจกรรมที่ใช้กล้ามเนื้อแขนหนัก',part:'แขน',answer:'ยกของ วิ่ง ปีนบันได'},
 {type:'apply',prompt:'ถ้านั่งนานโดยไม่ขยับ ส่งผลอย่างไร',part:'สุขภาพ',answer:'กล้ามเนื้ออ่อนแรง ลดการไหลเวียน'},
 {type:'apply',prompt:'อาหารใดช่วยกระดูก',part:'แคลเซียม',answer:'นม โยเกิร์ต ปลาเล็ก ผักใบเขียว'}
];
window.WORKSHEET_CONFIG={icon:'💪',title:'ใบงานกระดูกและกล้ามเนื้อ',subject:'สุขศึกษา',gradeLabel:'ป.4–6',mediaLabel:'กระดูก–กล้ามเนื้อ',sourceMediaUrl:'/games/health/bone-muscle-media.html',indicators:['พ 1.1 ป.4/2','พ 1.1 ป.4/3'],directions:'ระบุส่วนสำคัญ อธิบายหน้าที่ และวิธีดูแลกระดูก–กล้ามเนื้อ',getItems(topic){return topic==='mixed'?BODY_ITEMS:BODY_ITEMS.filter(i=>i.type===topic);},buildBodyWork(item){if(item.type==='label')return{line1:'ส่วนที่เกี่ยว: '+item.part,line2:'ตอบ: '+item.answer};if(item.type==='function')return{line1:'หน้าที่ของ '+item.part,line2:item.answer};if(item.type==='care')return{line1:'การดูแล '+item.part,line2:item.answer};return{line1:'ประยุกต์/ตัวอย่าง',line2:item.answer};},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;const w=this.buildBodyWork(item);return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><table class="mini-table"><tr><th>โฟกัส</th><th>หมายเหตุ</th></tr><tr><td>'+e(item.part)+'</td><td>กระดูก · กล้ามเนื้อ · ข้อต่อ</td></tr></table></div><div class="q-work-block"><div class="calc-line"><span class="work-fill">'+e(w.line1)+'</span></div><div class="calc-line"><span class="work-fill">'+e(w.line2)+'</span></div></div><div class="q-foot"><div class="answer-line">ตอบ <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },
];

for (const ws of worksheets) {
  const target = path.join(repoRoot, ws.out);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, ws.html, 'utf8');
  console.log('Wrote', ws.out);
}

console.log(`Generated ${worksheets.length} worksheets.`);
