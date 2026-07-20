#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VER = '1.172.0';

const FOOTER = `</script><script src="/games/worksheet-topic.js?v=${VER}"></script><script>function render(){window.KampaiTopicWorksheet.render();}document.getElementById('btnRandom').onclick=window.KampaiTopicWorksheet.randomize;document.getElementById('btnAnswers').onclick=()=>document.body.classList.toggle('show-answers');document.getElementById('btnPrint').onclick=()=>window.print();window.KampaiWorksheet.loadTeachers();render();</script><script src="/games/worksheet-modes.js?v=${VER}"></script></body></html>`;

function shell({ icon, title, sourceMedia, indicators, topics, gradeOptions, bodyScript }) {
  const topicOpts = topics.map((t) => `<option value="${t.value}">${t.label}</option>`).join('');
  const gradeOpts = gradeOptions.map((g) => `<option value="${g}">ป.${g}</option>`).join('');
  const indMeta = indicators.join(', ');
  return `<!DOCTYPE html><html lang="th"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="worksheet-source-media" content="${sourceMedia}"><meta name="curriculum-indicators" content="${indMeta}"><title>${title} ป.4–6 — โรงเรียนบ้านคำไผ่</title><link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet"><link href="/games/worksheet-topic.css?v=${VER}" rel="stylesheet"><link href="/games/worksheet-modes.css?v=${VER}" rel="stylesheet"></head><body>
<header class="toolbar"><h1>${icon} ${title}</h1><div class="toolbar-ctrls"><select class="t-select" id="selStyle" aria-label="รูปแบบใบงาน"><option value="standard">มาตรฐาน</option><option value="progressive">บันไดระดับ</option><option value="booklet">รวมเล่ม</option></select><select class="t-select" id="selPageCount" aria-label="จำนวนหน้า"><option value="1">1 หน้า</option><option value="2">2 หน้า</option><option value="3">3 หน้า</option></select><select class="t-select" id="selGrade" aria-label="ระดับชั้น">${gradeOpts}</select><select class="t-select" id="selTopic" aria-label="ทักษะ"><option value="mixed">ผสมทุกทักษะ</option>${topicOpts}</select><select class="t-select" id="selCount" aria-label="จำนวนข้อ"><option value="10">10 ข้อ</option><option value="5">5 ข้อ</option></select><input class="t-input" id="inpSchool" value="โรงเรียนบ้านคำไผ่" aria-label="ชื่อโรงเรียน"><select class="t-select" id="selTeacher" aria-label="ครูผู้สอน"><option value="">-- เลือกครูผู้สอน --</option></select><button class="btn primary" id="btnRandom">🎲 สุ่มใหม่</button><button class="btn" id="btnAnswers">👁 เฉลยครู</button><button class="btn green" id="btnPrint">🖨 พิมพ์ A4</button></div></header><main class="pages" id="pages"><section class="sheet"><div class="questions"><article class="q">กำลังสร้างใบงาน</article></div></section></main>
<script src="/games/worksheet-runtime.js?v=${VER}"></script><script>
${bodyScript}
${FOOTER}`;
}

const worksheets = [
  {
    out: 'public/games/science/plant-parts-worksheet.html',
    html: shell({
      icon: '🌱',
      title: 'ใบงานส่วนต่าง ๆ ของพืช',
      sourceMedia: '/games/science/plant-parts-media.html',
      indicators: ['ว 1.2 ป.4/1'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'label', label: 'ระบุส่วน' },
        { value: 'function', label: 'หน้าที่' },
        { value: 'apply', label: 'ประยุกต์ใช้' },
      ],
      bodyScript: `const PLANT_ITEMS=[
 {type:'label',prompt:'ส่วนที่ดูดน้ำและแร่ธาตุจากดิน',part:'ราก',answer:'ราก'},
 {type:'label',prompt:'ส่วนที่ลำเลียงน้ำและยึดใบ',part:'ลำต้น',answer:'ลำต้น'},
 {type:'label',prompt:'ส่วนที่สร้างอาหารด้วยแสง',part:'ใบ',answer:'ใบ'},
 {type:'label',prompt:'ส่วนที่ช่วยสืบพันธุ์ของพืชดอก',part:'ดอก',answer:'ดอก'},
 {type:'function',prompt:'รากมีหน้าที่สำคัญอย่างไร',part:'ราก',answer:'ดูดน้ำ–แร่ธาตุ และยึดพืชให้อยู่กับที่'},
 {type:'function',prompt:'ใบสร้างอาหารได้อย่างไร',part:'ใบ',answer:'สังเคราะห์ด้วยแสง ใช้แสง คาร์บอนไดออกไซด์ และน้ำ'},
 {type:'function',prompt:'ดอกมีบทบาทต่อการสืบพันธุ์อย่างไร',part:'ดอก',answer:'ผลิตเกสรและออวุล เพื่อสร้างเมล็ด'},
 {type:'apply',prompt:'กินส่วนใดของแครอท',part:'แครอท',answer:'ราก'},
 {type:'apply',prompt:'กินส่วนใดของกะหล่ำปลี',part:'กะหล่ำปลี',answer:'ใบ'},
 {type:'apply',prompt:'ถ้าตัดรากออก พืชจะได้รับผลอย่างไร',part:'รากถูกตัด',answer:'ดูดน้ำไม่ได้ เหี่ยวและตายได้'},
 {type:'apply',prompt:'เรียงลำดับการเติบโต: เมล็ด → ? → ต้นอ่อน',part:'การเติบโต',answer:'งอก'},
 {type:'apply',prompt:'ทำไมใบจึงมักแผ่กว้าง',part:'ใบ',answer:'เพื่อรับแสงได้มากในการสังเคราะห์ด้วยแสง'}
];
window.WORKSHEET_CONFIG={icon:'🌱',title:'ใบงานส่วนต่าง ๆ ของพืช',subject:'วิทยาศาสตร์',gradeLabel:'ป.4–6',mediaLabel:'ส่วนพืชดอก',sourceMediaUrl:'/games/science/plant-parts-media.html',indicators:['ว 1.2 ป.4/1'],directions:'ระบุส่วนพืช อธิบายหน้าที่ และเชื่อมกับอาหาร/ชีวิตประจำวัน',getItems(topic){return topic==='mixed'?PLANT_ITEMS:PLANT_ITEMS.filter(i=>i.type===topic);},buildPlantWork(item){if(item.type==='label')return{line1:'พิจารณาหน้าที่ → ส่วนที่เกี่ยวข้อง',line2:'ตอบ: '+item.answer};if(item.type==='function')return{line1:'หน้าที่ของ '+item.part,line2:item.answer};return{line1:'เชื่อมความรู้กับ '+item.part,line2:item.answer};},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;const w=this.buildPlantWork(item);return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><div class="classify-grid"><div class="classify-box">ราก</div><div class="classify-box">ลำต้น</div><div class="classify-box">ใบ</div><div class="classify-box">ดอก/ผล</div></div><div class="q-context">โฟกัส: '+e(item.part)+'</div></div><div class="q-work-block"><div class="reason-line"><span class="work-fill">'+e(w.line1)+'</span></div><div class="reason-line"><span class="work-fill">'+e(w.line2)+'</span></div></div><div class="q-foot"><div class="answer-line">ตอบ <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },
  {
    out: 'public/games/science/food-chain-worksheet.html',
    html: shell({
      icon: '🔗',
      title: 'ใบงานห่วงโซ่อาหาร',
      sourceMedia: '/games/science/food-chain-media.html',
      indicators: ['ว 1.1 ป.5/2', 'ว 1.1 ป.5/3'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'order', label: 'เรียงลำดับ' },
        { value: 'role', label: 'บทบาทสิ่งมีชีวิต' },
        { value: 'apply', label: 'วิเคราะห์สถานการณ์' },
      ],
      bodyScript: `const CHAIN_ITEMS=[
 {type:'order',prompt:'เรียงห่วงโซ่: หญ้า → กวาง → ?',flow:['หญ้า','กวาง','?'],answer:'เสือ/สิงโต (ผู้ล่า)'},
 {type:'order',prompt:'เรียง: พืช → แมลง → กบ → ?',flow:['พืช','แมลง','กบ','?'],answer:'งู/นก (ผู้ล่าระดับถัดไป)'},
 {type:'order',prompt:'เติมบทบาท: ข้าว → หนู → งู',flow:['ผู้ผลิต','ผู้บริโภค 1','ผู้บริโภค 2'],answer:'ผู้ผลิต → ผู้บริโภคขั้นที่ 1 → ผู้บริโภคขั้นที่ 2'},
 {type:'role',prompt:'พืชสีเขียวจัดเป็นบทบาทใด',flow:['พืช'],answer:'ผู้ผลิต'},
 {type:'role',prompt:'สัตว์ที่กินพืชเป็นอาหารเรียกว่า',flow:['กินพืช'],answer:'ผู้บริโภคขั้นที่ 1 / สัตว์กินพืช'},
 {type:'role',prompt:'สัตว์ที่กินเนื้อเป็นอาหารเรียกว่า',flow:['กินเนื้อ'],answer:'ผู้บริโภคขั้นที่ 2+ / สัตว์กินเนื้อ'},
 {type:'role',prompt:'จุลินทรีย์ที่ย่อยซากเรียกว่า',flow:['ย่อยสลาย'],answer:'ผู้ย่อยสลาย'},
 {type:'apply',prompt:'ถ้าพืชหายไป ใครได้รับผลกระทบก่อน',flow:['พืช','→','?'],answer:'สัตว์กินพืช / ผู้บริโภคขั้นที่ 1'},
 {type:'apply',prompt:'ลูกศรในห่วงโซ่อาหารแสดงอะไร',flow:['ลูกศร'],answer:'ทิศทางการถ่ายทอดพลังงาน'},
 {type:'apply',prompt:'ทำไมห่วงโซ่จึงเริ่มจากพืช',flow:['แสงอาทิตย์','พืช'],answer:'พืชสร้างอาหารจากแสงเป็นพลังงานเริ่มต้น'},
 {type:'apply',prompt:'เขียนห่วงโซ่ในนาข้าว 1 ชุด',flow:['นา'],answer:'เช่น ข้าว → หนู → งู → นกอินทรี'},
 {type:'apply',prompt:'ถ้าผู้ย่อยสลายหายไป จะเกิดอะไร',flow:['ซาก'],answer:'ซากสะสม แร่ธาตุคืนสู่ดินช้าลง'}
];
window.WORKSHEET_CONFIG={icon:'🔗',title:'ใบงานห่วงโซ่อาหาร',subject:'วิทยาศาสตร์',gradeLabel:'ป.4–6',mediaLabel:'ห่วงโซ่อาหาร',sourceMediaUrl:'/games/science/food-chain-media.html',indicators:['ว 1.1 ป.5/2','ว 1.1 ป.5/3'],directions:'เรียงลำดับ ระบุบทบาท และวิเคราะห์ผลกระทบในห่วงโซ่อาหาร',getItems(topic){return topic==='mixed'?CHAIN_ITEMS:CHAIN_ITEMS.filter(i=>i.type===topic);},buildChainWork(item){if(item.type==='order')return{line1:'เรียง: '+item.flow.join(' → '),line2:'ตอบ: '+item.answer};if(item.type==='role')return{line1:'พิจารณาการกิน/สร้างอาหาร',line2:'ตอบ: '+item.answer};return{line1:'วิเคราะห์เหตุ–ผลในระบบ',line2:item.answer};},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;const w=this.buildChainWork(item);return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><div class="cycle-flow">'+item.flow.map((step,i)=>'<div class="cycle-step">'+e(step)+'</div>'+(i<item.flow.length-1?'<span class="cycle-arrow">→</span>':'')).join('')+'</div></div><div class="q-work-block"><div class="reason-line"><span class="work-fill">'+e(w.line1)+'</span></div><div class="reason-line"><span class="work-fill">'+e(w.line2)+'</span></div></div><div class="q-foot"><div class="answer-line">ตอบ <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },
  {
    out: 'public/games/health/food-groups-worksheet.html',
    html: shell({
      icon: '🥗',
      title: 'ใบงานอาหารหลัก 5 หมู่',
      sourceMedia: '/games/health/food-groups-media.html',
      indicators: ['พ 4.1 ป.3/2', 'พ 4.1 ป.3/3'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'sort', label: 'จัดหมู่' },
        { value: 'benefit', label: 'ประโยชน์' },
        { value: 'plan', label: 'จัดจาน' },
      ],
      bodyScript: `const FOOD_ITEMS=[
 {type:'sort',prompt:'จัดหมู่: นม',food:'นม',answer:'หมู่ที่ 5 นมและผลิตภัณฑ์นม'},
 {type:'sort',prompt:'จัดหมู่: ข้าวสวย',food:'ข้าวสวย',answer:'หมู่ที่ 1 แป้งและน้ำตาล'},
 {type:'sort',prompt:'จัดหมู่: ไข่ไก่',food:'ไข่ไก่',answer:'หมู่ที่ 2 เนื้อสัตว์และโปรตีน'},
 {type:'sort',prompt:'จัดหมู่: ผักบุ้ง',food:'ผักบุ้ง',answer:'หมู่ที่ 3 ผัก'},
 {type:'sort',prompt:'จัดหมู่: กล้วย',food:'กล้วย',answer:'หมู่ที่ 4 ผลไม้'},
 {type:'benefit',prompt:'หมู่แป้งช่วยร่างกายอย่างไร',food:'แป้ง',answer:'ให้พลังงาน'},
 {type:'benefit',prompt:'หมู่โปรตีนช่วยอย่างไร',food:'โปรตีน',answer:'สร้างและซ่อมแซมกล้ามเนื้อ/เนื้อเยื่อ'},
 {type:'benefit',prompt:'ผักและผลไม้ให้สารอาหารใดสำคัญ',food:'ผักผลไม้',answer:'วิตามิน เกลือแร่ ใยอาหาร'},
 {type:'plan',prompt:'จานมื้อเที่ยงควรมีครบกี่หมู่โดยประมาณ',food:'จาน',answer:'ครบหรือใกล้ครบ 5 หมู่'},
 {type:'plan',prompt:'ถ้าขาดผักควรเพิ่มอะไร',food:'ผัก',answer:'ผักสด/ผักต้มอย่างน้อย 1 ส่วน'},
 {type:'plan',prompt:'ขนมกรุบกรอบจัดเป็นหมู่ใดและควรกินอย่างไร',food:'ขนม',answer:'กลุ่มแป้ง/ไขมัน ควรกินเป็นครั้งคราว'},
 {type:'plan',prompt:'เขียนจานอาหารเช้าที่สมดุล 1 ตัวอย่าง',food:'เช้า',answer:'เช่น ข้าวต้ม + ไข่ + ผัก + กล้วย + นม'}
];
window.WORKSHEET_CONFIG={icon:'🥗',title:'ใบงานอาหารหลัก 5 หมู่',subject:'สุขศึกษา',gradeLabel:'ป.4–6',mediaLabel:'อาหารหลัก 5 หมู่',sourceMediaUrl:'/games/health/food-groups-media.html',indicators:['พ 4.1 ป.3/2','พ 4.1 ป.3/3'],directions:'จัดหมู่ อธิบายประโยชน์ และวางแผนจานอาหารสมดุล',getItems(topic){return topic==='mixed'?FOOD_ITEMS:FOOD_ITEMS.filter(i=>i.type===topic);},buildFoodWork(item){if(item.type==='sort')return{line1:'พิจารณาแหล่งของ '+item.food,line2:'ตอบ: '+item.answer};if(item.type==='benefit')return{line1:'ประโยชน์ของหมู่ '+item.food,line2:item.answer};return{line1:'วางแผนจานให้ครบหมู่',line2:item.answer};},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;const w=this.buildFoodWork(item);return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><table class="mini-table"><tr><th>1 แป้ง</th><th>2 โปรตีน</th><th>3 ผัก</th><th>4 ผลไม้</th><th>5 นม</th></tr><tr><td colspan="5">'+e(item.food)+'</td></tr></table></div><div class="q-work-block"><div class="calc-line"><span class="work-fill">'+e(w.line1)+'</span></div><div class="calc-line"><span class="work-fill">'+e(w.line2)+'</span></div></div><div class="q-foot"><div class="answer-line">ตอบ <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },
  {
    out: 'public/games/arts/color-wheel-worksheet.html',
    html: shell({
      icon: '🎨',
      title: 'ใบงานวงล้อสี',
      sourceMedia: '/games/arts/color-wheel-media.html',
      indicators: ['ศ 1.1 ป.4/2', 'ศ 1.1 ป.4/7'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'primary', label: 'แม่สี' },
        { value: 'mix', label: 'ผสมสี' },
        { value: 'mood', label: 'วรรณะ/อารมณ์' },
      ],
      bodyScript: `const COLOR_ITEMS=[
 {type:'primary',prompt:'แม่สีมีกี่สี อะไรบ้าง',color:'แม่สี',answer:'3 สี: แดง เหลือง น้ำเงิน'},
 {type:'primary',prompt:'สีใดเป็นแม่สี',color:'แดง',answer:'แม่สี'},
 {type:'primary',prompt:'สีเขียวเป็นแม่สีหรือไม่',color:'เขียว',answer:'ไม่ เป็นสีทุติยภูมิ'},
 {type:'mix',prompt:'แดง + เหลือง ได้สีใด',color:'แดง+เหลือง',answer:'ส้ม'},
 {type:'mix',prompt:'เหลือง + น้ำเงิน ได้สีใด',color:'เหลือง+น้ำเงิน',answer:'เขียว'},
 {type:'mix',prompt:'แดง + น้ำเงิน ได้สีใด',color:'แดง+น้ำเงิน',answer:'ม่วง'},
 {type:'mix',prompt:'ถ้าต้องการส้มอ่อน ควรทำอย่างไร',color:'ส้ม',answer:'ผสมแดงกับเหลือง แล้วเพิ่มขาว/ลดความเข้ม'},
 {type:'mood',prompt:'สีวรรณะอุ่นมีตัวอย่างใด',color:'วรรณะอุ่น',answer:'แดง ส้ม เหลือง'},
 {type:'mood',prompt:'สีวรรณะเย็นมีตัวอย่างใด',color:'วรรณะเย็น',answer:'น้ำเงิน เขียว ม่วง'},
 {type:'mood',prompt:'ถ้าอยากสื่อความสงบ ควรใช้วรรณะใด',color:'สงบ',answer:'วรรณะเย็น'},
 {type:'mood',prompt:'ถ้าอยากสื่อความร้อนแรง ควรใช้วรรณะใด',color:'ร้อนแรง',answer:'วรรณะอุ่น'},
 {type:'mood',prompt:'เลือกสีคู่ตัดกันบนวงล้อ: แดงคู่กับ',color:'คู่ตัด',answer:'เขียว'}
];
window.WORKSHEET_CONFIG={icon:'🎨',title:'ใบงานวงล้อสี',subject:'ศิลปะ',gradeLabel:'ป.4–6',mediaLabel:'วงล้อสี',sourceMediaUrl:'/games/arts/color-wheel-media.html',indicators:['ศ 1.1 ป.4/2','ศ 1.1 ป.4/7'],directions:'ระบุแม่สี ผสมสี และเลือกวรรณะให้เหมาะกับอารมณ์ภาพ',getItems(topic){return topic==='mixed'?COLOR_ITEMS:COLOR_ITEMS.filter(i=>i.type===topic);},buildColorWork(item){if(item.type==='primary')return{line1:'จำแนกจากวงล้อสี: '+item.color,line2:'ตอบ: '+item.answer};if(item.type==='mix')return{line1:'ผสม: '+item.color,line2:'ตอบ: '+item.answer};return{line1:'เชื่อมสีกับอารมณ์/วรรณะ',line2:item.answer};},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;const w=this.buildColorWork(item);return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><div class="classify-grid"><div class="classify-box">แดง</div><div class="classify-box">เหลือง</div><div class="classify-box">น้ำเงิน</div><div class="classify-box">'+e(item.color)+'</div></div></div><div class="q-work-block"><div class="calc-line"><span class="work-fill">'+e(w.line1)+'</span></div><div class="calc-line"><span class="work-fill">'+e(w.line2)+'</span></div></div><div class="q-foot"><div class="answer-line">ตอบ <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },
  {
    out: 'public/games/career/community-jobs-worksheet.html',
    html: shell({
      icon: '👷',
      title: 'ใบงานอาชีพในชุมชน',
      sourceMedia: '/games/career/community-jobs-media.html',
      indicators: ['ง 2.1 ป.4/1'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'identify', label: 'ระบุอาชีพ' },
        { value: 'role', label: 'บทบาทต่อชุมชน' },
        { value: 'reflect', label: 'สำรวจตัวเอง' },
      ],
      bodyScript: `const JOB_ITEMS=[
 {type:'identify',prompt:'ใครรักษาคนไข้ในชุมชน',job:'หมอ/พยาบาล',answer:'แพทย์ พยาบาล หรือบุคลากรสาธารณสุข'},
 {type:'identify',prompt:'ใครสอนนักเรียน',job:'ครู',answer:'ครู'},
 {type:'identify',prompt:'ใครปลูกพืชเพื่อเป็นอาหาร',job:'เกษตรกร',answer:'เกษตรกร'},
 {type:'identify',prompt:'ใครช่วยจับผู้กระทำผิดและรักษาความสงบ',job:'ตำรวจ',answer:'ตำรวจ'},
 {type:'role',prompt:'ทำไมชุมชนต้องมีพ่อค้าแม่ค้า',job:'ค้าขาย',answer:'กระจายสินค้าและบริการให้คนในชุมชน'},
 {type:'role',prompt:'อาชีพช่างซ่อมช่วยชุมชนอย่างไร',job:'ช่าง',answer:'ซ่อมสิ่งของ/บ้านเรือนให้ใช้ได้ต่อ'},
 {type:'role',prompt:'อาชีพเก็บขยะสำคัญอย่างไร',job:'เก็บขยะ',answer:'รักษาความสะอาดและสุขภาพชุมชน'},
 {type:'role',prompt:'จัดกลุ่มอาชีพ: หมอ ครู ตำรวจ',job:'บริการสาธารณะ',answer:'อาชีพบริการสาธารณะ'},
 {type:'reflect',prompt:'อาชีพใดใกล้ตัวในหมู่บ้านคำไผ่',job:'ใกล้ตัว',answer:'เช่น ครู เกษตรกร ค้าขาย (ตอบตามชุมชนจริง)'},
 {type:'reflect',prompt:'ทักษะใดจำเป็นต่ออาชีพครู',job:'ครู',answer:'สื่อสาร อธิบาย ใจเย็น รักการเรียนรู้'},
 {type:'reflect',prompt:'ถ้าอยากเป็นเกษตรกรควรฝึกอะไร',job:'เกษตร',answer:'ปลูกพืช ดูแลดิน วางแผนการผลิต'},
 {type:'reflect',prompt:'เขียนเหตุผลว่าทำไมอาชีพทุกชนิดจึงมีคุณค่า',job:'คุณค่า',answer:'แต่ละอาชีพช่วยให้ชุมชนอยู่ได้และพึ่งพากัน'}
];
window.WORKSHEET_CONFIG={icon:'👷',title:'ใบงานอาชีพในชุมชน',subject:'การงานอาชีพ',gradeLabel:'ป.4–6',mediaLabel:'อาชีพในชุมชน',sourceMediaUrl:'/games/career/community-jobs-media.html',indicators:['ง 2.1 ป.4/1'],directions:'ระบุอาชีพ อธิบายบทบาทต่อชุมชน และเชื่อมกับความสนใจของตนเอง',getItems(topic){return topic==='mixed'?JOB_ITEMS:JOB_ITEMS.filter(i=>i.type===topic);},buildJobWork(item){if(item.type==='identify')return{line1:'ดูหน้าที่งาน → อาชีพ',line2:'ตอบ: '+item.answer};if(item.type==='role')return{line1:'บทบาทของ '+item.job+' ต่อชุมชน',line2:item.answer};return{line1:'เชื่อมอาชีพกับตัวเอง/ชุมชน',line2:item.answer};},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;const w=this.buildJobWork(item);return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><div class="q-context">โฟกัส: '+e(item.job)+'</div><div class="classify-grid"><div class="classify-box">บริการ</div><div class="classify-box">ผลิต</div><div class="classify-box">ค้าขาย</div></div></div><div class="q-work-block"><div class="reason-line"><span class="work-fill">'+e(w.line1)+'</span></div><div class="reason-line"><span class="work-fill">'+e(w.line2)+'</span></div></div><div class="q-foot"><div class="answer-line">ตอบ <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },
  {
    out: 'public/games/social/sufficiency-worksheet.html',
    html: shell({
      icon: '⚖️',
      title: 'ใบงานเศรษฐกิจพอเพียง',
      sourceMedia: '/games/social/sufficiency-media.html',
      indicators: ['ส 3.1 ป.4/3'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'principle', label: 'หลัก 3 ห่วง' },
        { value: 'condition', label: '2 เงื่อนไข' },
        { value: 'apply', label: 'ใช้ในชีวิต' },
      ],
      bodyScript: `const SUFF_ITEMS=[
 {type:'principle',prompt:'หลักพอประมาณหมายถึงอะไร',topic:'พอประมาณ',answer:'ใช้จ่าย/ทำในขอบเขตที่เหมาะสม ไม่มากไม่น้อยเกินไป'},
 {type:'principle',prompt:'หลักมีเหตุผลหมายถึงอะไร',topic:'มีเหตุผล',answer:'ตัดสินใจโดยคิดผลดี–ผลเสียอย่างมีเหตุผล'},
 {type:'principle',prompt:'หลักมีภูมิคุ้มกันหมายถึงอะไร',topic:'ภูมิคุ้มกัน',answer:'เตรียมพร้อมรับความเปลี่ยนแปลงและความเสี่ยง'},
 {type:'principle',prompt:'3 ห่วงของเศรษฐกิจพอเพียงคืออะไร',topic:'3 ห่วง',answer:'พอประมาณ มีเหตุผล มีภูมิคุ้มกัน'},
 {type:'condition',prompt:'เงื่อนไขความรู้หมายถึงอะไร',topic:'ความรู้',answer:'ใช้ความรู้รอบด้านประกอบการตัดสินใจ'},
 {type:'condition',prompt:'เงื่อนไขคุณธรรมหมายถึงอะไร',topic:'คุณธรรม',answer:'ซื่อสัตย์ ขยัน อดทน แบ่งปัน ไม่เอาเปรียบ'},
 {type:'condition',prompt:'2 เงื่อนไขคืออะไร',topic:'2 เงื่อนไข',answer:'เงื่อนไขความรู้ และเงื่อนไขคุณธรรม'},
 {type:'apply',prompt:'นักเรียนใช้จ่ายเงินอย่างไรให้พอประมาณ',topic:'เงิน',answer:'ซื้อของจำเป็น เก็บออม ไม่ตามเพื่อนทุกอย่าง'},
 {type:'apply',prompt:'ตัวอย่างภูมิคุ้มกันในครอบครัว',topic:'ครอบครัว',answer:'มีเงินออม สำรองอาหาร วางแผนก่อนใช้จ่ายใหญ่'},
 {type:'apply',prompt:'ถ้าฝนทิ้งช่วง เกษตรกรมีภูมิคุ้มกันอย่างไร',topic:'เกษตร',answer:'เก็บน้ำ ปลูกพืชหลากชนิด มีอาชีพเสริม'},
 {type:'apply',prompt:'ทำไมต้องมีทั้งความรู้และคุณธรรม',topic:'เงื่อนไข',answer:'ความรู้ช่วยตัดสินใจถูก คุณธรรมช่วยไม่เบียดเบียนผู้อื่น'},
 {type:'apply',prompt:'เขียนแผนพอเพียงของตนเอง 1 ข้อ',topic:'แผน',answer:'เช่น ออมสัปดาห์ละ 10 บาท และช่วยงานบ้าน'}
];
window.WORKSHEET_CONFIG={icon:'⚖️',title:'ใบงานเศรษฐกิจพอเพียง',subject:'สังคมศึกษา',gradeLabel:'ป.4–6',mediaLabel:'เศรษฐกิจพอเพียง',sourceMediaUrl:'/games/social/sufficiency-media.html',indicators:['ส 3.1 ป.4/3'],directions:'อธิบาย 3 ห่วง 2 เงื่อนไข และประยุกต์ใช้ในชีวิตประจำวัน',getItems(topic){return topic==='mixed'?SUFF_ITEMS:SUFF_ITEMS.filter(i=>i.type===topic);},buildSuffWork(item){if(item.type==='principle')return{line1:'หลัก: '+item.topic,line2:item.answer};if(item.type==='condition')return{line1:'เงื่อนไข: '+item.topic,line2:item.answer};return{line1:'ประยุกต์ใช้: '+item.topic,line2:item.answer};},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;const w=this.buildSuffWork(item);return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><div class="classify-grid"><div class="classify-box">พอประมาณ</div><div class="classify-box">มีเหตุผล</div><div class="classify-box">มีภูมิคุ้มกัน</div><div class="classify-box">ความรู้+คุณธรรม</div></div></div><div class="q-work-block"><div class="reason-line"><span class="work-fill">'+e(w.line1)+'</span></div><div class="reason-line"><span class="work-fill">'+e(w.line2)+'</span></div></div><div class="q-foot"><div class="answer-line">ตอบ <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },
  {
    out: 'public/games/thai/dictionary-worksheet.html',
    html: shell({
      icon: '📖',
      title: 'ใบงานใช้พจนานุกรม',
      sourceMedia: '/games/thai/dictionary-media.html',
      indicators: ['ท 4.1 ป.3/3', 'ท 4.1 ป.4/3'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'order', label: 'เรียงพยัญชนะ' },
        { value: 'lookup', label: 'หาความหมาย' },
        { value: 'use', label: 'ใช้ในประโยค' },
      ],
      bodyScript: `const DICT_ITEMS=[
 {type:'order',prompt:'เรียงตามพจนานุกรม: กา เก ไก่',words:'กา เก ไก่',answer:'กา → ไก่ → เก'},
 {type:'order',prompt:'เรียง: บ้าน ป่า ปา',words:'บ้าน ป่า ปา',answer:'ป่า → ปา → บ้าน'},
 {type:'order',prompt:'คำใดมาก่อน: สวย หรือ สวัสดี',words:'สวย สวัสดี',answer:'สวัสดี มาก่อน สวย'},
 {type:'lookup',prompt:'เมื่อไม่รู้ความหมายคำ ควรทำอะไรก่อน',words:'ขั้นตอน',answer:'เปิดพจนานุกรม/ค้นหาตามพยัญชนะต้น'},
 {type:'lookup',prompt:'หาความหมายของคำว่า "อดทน"',words:'อดทน',answer:'ทนต่อความยากลำบากได้โดยไม่ท้อ'},
 {type:'lookup',prompt:'หาความหมายของคำว่า "ขยัน"',words:'ขยัน',answer:'ตั้งใจทำกิจโดยไม่เกียจคร้าน'},
 {type:'lookup',prompt:'ส่วนใดของพจนานุกรมบอกวิธีอ่าน',words:'โครงสร้าง',answer:'สัทอักษร/คำอ่าน (ถ้ามี)'},
 {type:'use',prompt:'ใช้คำ "อดทน" ในประโยค 1 ประโยค',words:'อดทน',answer:'เช่น นักเรียนต้องอดทนฝึกอ่านทุกวัน'},
 {type:'use',prompt:'ใช้คำ "ขยัน" ในประโยค 1 ประโยค',words:'ขยัน',answer:'เช่น เด็กขยันช่วยงานบ้าน'},
 {type:'use',prompt:'ทำไมต้องเรียงพยัญชนะก่อนค้น',words:'เหตุผล',answer:'เพื่อหาหน้าคำได้เร็วและถูกต้อง'},
 {type:'use',prompt:'ถ้าคำมีหลายความหมาย ควรเลือกอย่างไร',words:'บริบท',answer:'เลือกความหมายที่เข้ากับประโยค'},
 {type:'lookup',prompt:'ขั้นค้นหาในพจนานุกรมมีอะไรบ้าง',words:'5 ขั้น',answer:'ดูพยัญชนะต้น → สระ → วรรณยุกต์ → อ่านความหมาย → เลือกใช้'}
];
window.WORKSHEET_CONFIG={icon:'📖',title:'ใบงานใช้พจนานุกรม',subject:'ภาษาไทย',gradeLabel:'ป.4–6',mediaLabel:'พจนานุกรมดิจิทัล',sourceMediaUrl:'/games/thai/dictionary-media.html',indicators:['ท 4.1 ป.3/3','ท 4.1 ป.4/3'],directions:'เรียงคำตามพจนานุกรม หาความหมาย และนำไปใช้ในประโยค',getItems(topic){return topic==='mixed'?DICT_ITEMS:DICT_ITEMS.filter(i=>i.type===topic);},buildDictWork(item){if(item.type==='order')return{line1:'เรียงตามพยัญชนะ/สระ: '+item.words,line2:'ตอบ: '+item.answer};if(item.type==='lookup')return{line1:'ค้นหา: '+item.words,line2:item.answer};return{line1:'ใช้คำให้ถูกบริบท',line2:item.answer};},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;const w=this.buildDictWork(item);return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><div class="word-bank"><span>'+e(item.words)+'</span></div><div>ลงวิธีค้น/เรียง</div></div><div class="q-work-block"><div class="reason-line"><span class="work-fill">'+e(w.line1)+'</span></div><div class="reason-line"><span class="work-fill">'+e(w.line2)+'</span></div></div><div class="q-foot"><div class="answer-line">ตอบ <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },
  {
    out: 'public/games/thai/sentence-structure-worksheet.html',
    html: shell({
      icon: '✍️',
      title: 'ใบงานโครงสร้างประโยค',
      sourceMedia: '/games/thai/sentence-structure.html',
      indicators: ['ท 4.1 ป.3/4', 'ท 4.1 ป.5/2'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'parts', label: 'ประธาน–กริยา–กรรม' },
        { value: 'expand', label: 'ขยายประโยค' },
        { value: 'fix', label: 'แก้ประโยค' },
      ],
      bodyScript: `const SENT_ITEMS=[
 {type:'parts',prompt:'หาประธาน: แมวกินปลา',sentence:'แมวกินปลา',answer:'แมว'},
 {type:'parts',prompt:'หากริยา: เด็กอ่านหนังสือ',sentence:'เด็กอ่านหนังสือ',answer:'อ่าน'},
 {type:'parts',prompt:'หากรม: ครูสอนนักเรียน',sentence:'ครูสอนนักเรียน',answer:'นักเรียน'},
 {type:'parts',prompt:'แยกโครงสร้าง: นกบิน',sentence:'นกบิน',answer:'ประธาน=นก · กริยา=บิน'},
 {type:'expand',prompt:'ขยายประโยค "เด็กวิ่ง" ให้สมบูรณ์ขึ้น',sentence:'เด็กวิ่ง',answer:'เช่น เด็กวิ่งเร็วในสนาม'},
 {type:'expand',prompt:'เติมส่วนขยายเวลา: แม่ทำอาหาร',sentence:'แม่ทำอาหาร',answer:'เช่น แม่ทำอาหารตอนเช้า'},
 {type:'expand',prompt:'เติมส่วนขยายสถานที่: น้องเล่น',sentence:'น้องเล่น',answer:'เช่น น้องเล่นที่สวนสาธารณะ'},
 {type:'fix',prompt:'แก้ประโยคไม่สมบูรณ์: กินข้าว',sentence:'กินข้าว',answer:'เติมประธาน เช่น ฉันกินข้าว'},
 {type:'fix',prompt:'แก้ลำดับคำ: หนังสือ อ่าน นักเรียน',sentence:'หนังสือ อ่าน นักเรียน',answer:'นักเรียนอ่านหนังสือ'},
 {type:'fix',prompt:'ทำไมประโยคต้องมีกริยา',sentence:'เหตุผล',answer:'กริยาบอกการกระทำหรือสภาพของประธาน'},
 {type:'parts',prompt:'ในประโยค "พ่อซื้อผลไม้ที่ตลาด" กรรมคืออะไร',sentence:'พ่อซื้อผลไม้ที่ตลาด',answer:'ผลไม้'},
 {type:'expand',prompt:'เขียนประโยคที่มีประธาน กริยา กรรม และส่วนขยาย',sentence:'สร้างเอง',answer:'เช่น น้องเลี้ยงแมวที่บ้านทุกวัน'}
];
window.WORKSHEET_CONFIG={icon:'✍️',title:'ใบงานโครงสร้างประโยค',subject:'ภาษาไทย',gradeLabel:'ป.4–6',mediaLabel:'โครงสร้างประโยค',sourceMediaUrl:'/games/thai/sentence-structure.html',indicators:['ท 4.1 ป.3/4','ท 4.1 ป.5/2'],directions:'แยกประธาน–กริยา–กรรม ขยายประโยค และแก้ประโยคให้ถูกต้อง',getItems(topic){return topic==='mixed'?SENT_ITEMS:SENT_ITEMS.filter(i=>i.type===topic);},buildSentWork(item){if(item.type==='parts')return{line1:'วิเคราะห์: '+item.sentence,line2:'ตอบ: '+item.answer};if(item.type==='expand')return{line1:'ขยายจาก: '+item.sentence,line2:item.answer};return{line1:'ตรวจและแก้: '+item.sentence,line2:item.answer};},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;const w=this.buildSentWork(item);return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><div class="q-context">'+e(item.sentence)+'</div><div class="classify-grid"><div class="classify-box">ประธาน</div><div class="classify-box">กริยา</div><div class="classify-box">กรรม</div><div class="classify-box">ส่วนขยาย</div></div></div><div class="q-work-block"><div class="reason-line"><span class="work-fill">'+e(w.line1)+'</span></div><div class="reason-line"><span class="work-fill">'+e(w.line2)+'</span></div></div><div class="q-foot"><div class="answer-line">ตอบ <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },
  {
    out: 'public/games/career/waste-sort-worksheet.html',
    html: shell({
      icon: '♻️',
      title: 'ใบงานแยกขยะ',
      sourceMedia: '/games/career/waste-sort-media.html',
      indicators: ['ง 1.1 ป.3/3', 'ง 1.1 ป.4/4'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'sort', label: 'จำแนกประเภท' },
        { value: 'reason', label: 'เหตุผล' },
        { value: 'action', label: 'แนวปฏิบัติ' },
      ],
      bodyScript: `const WASTE_ITEMS=[
 {type:'sort',prompt:'ขวดพลาสติกเปล่าจัดเป็นขยะประเภทใด',item:'ขวดพลาสติก',answer:'ขยะรีไซเคิล'},
 {type:'sort',prompt:'เปลือกผลไม้จัดเป็นขยะประเภทใด',item:'เปลือกผลไม้',answer:'ขยะเปียก/ย่อยสลายได้'},
 {type:'sort',prompt:'ถ่านไฟฉายหมดอายุจัดเป็นขยะประเภทใด',item:'ถ่านไฟฉาย',answer:'ขยะอันตราย'},
 {type:'sort',prompt:'ถุงพลาสติกสกปรกที่ใช้แล้วจัดอย่างไร',item:'ถุงสกปรก',answer:'ขยะทั่วไป (ถ้าสกปรกรีไซเคิลไม่ได้)'},
 {type:'reason',prompt:'ทำไมต้องแยกขยะรีไซเคิล',item:'รีไซเคิล',answer:'เพื่อนำกลับมาใช้ใหม่ ลดขยะและประหยัดทรัพยากร'},
 {type:'reason',prompt:'ทำไมขยะอันตรายต้องแยกต่างหาก',item:'อันตราย',answer:'สารเคมีอาจปนเปื้อนและทำร้ายคน/สิ่งแวดล้อม'},
 {type:'reason',prompt:'ขยะเปียกนำไปทำอะไรได้',item:'ขยะเปียก',answer:'ทำปุ๋ยหมัก'},
 {type:'action',prompt:'ที่โรงเรียนควรทิ้งกระดาษใช้แล้วที่ใด',item:'กระดาษ',answer:'ถังขยะรีไซเคิล/ถังกระดาษ'},
 {type:'action',prompt:'ก่อนทิ้งขวดน้ำควรทำอะไร',item:'ขวดน้ำ',answer:'เทน้ำออก ล้าง/บีบให้เล็กลง'},
 {type:'action',prompt:'ลดขยะพลาสติกได้อย่างไร 1 วิธี',item:'ลดใช้',answer:'ใช้ถุงผ้า/กระติกน้ำส่วนตัว'},
 {type:'action',prompt:'ถ้าเห็นถ่านไฟฉายทิ้งปนขยะทั่วไป ควรทำอย่างไร',item:'ถ่าน',answer:'แยกไปจุดรับขยะอันตราย/แจ้งครู'},
 {type:'sort',prompt:'เศษอาหารกลางวันจัดประเภทใด',item:'เศษอาหาร',answer:'ขยะเปียก'}
];
window.WORKSHEET_CONFIG={icon:'♻️',title:'ใบงานแยกขยะ',subject:'การงานอาชีพ',gradeLabel:'ป.4–6',mediaLabel:'แยกขยะ',sourceMediaUrl:'/games/career/waste-sort-media.html',indicators:['ง 1.1 ป.3/3','ง 1.1 ป.4/4'],directions:'จำแนกประเภทขยะ อธิบายเหตุผล และเสนอแนวปฏิบัติในโรงเรียน',getItems(topic){return topic==='mixed'?WASTE_ITEMS:WASTE_ITEMS.filter(i=>i.type===topic);},buildWasteWork(item){if(item.type==='sort')return{line1:'พิจารณาลักษณะของ '+item.item,line2:'ตอบ: '+item.answer};if(item.type==='reason')return{line1:'เหตุผลด้านสิ่งแวดล้อม/ความปลอดภัย',line2:item.answer};return{line1:'แนวปฏิบัติ: '+item.item,line2:item.answer};},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;const w=this.buildWasteWork(item);return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><div class="classify-grid"><div class="classify-box">ทั่วไป</div><div class="classify-box">รีไซเคิล</div><div class="classify-box">เปียก</div><div class="classify-box">อันตราย</div></div><div class="q-context">'+e(item.item)+'</div></div><div class="q-work-block"><div class="reason-line"><span class="work-fill">'+e(w.line1)+'</span></div><div class="reason-line"><span class="work-fill">'+e(w.line2)+'</span></div></div><div class="q-foot"><div class="answer-line">ตอบ <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },
  {
    out: 'public/games/social/thailand-map-worksheet.html',
    html: shell({
      icon: '🗺️',
      title: 'ใบงานแผนที่ประเทศไทย',
      sourceMedia: '/games/social/thailand-map.html',
      indicators: ['ส 5.1 ป.4/1', 'ส 5.1 ป.4/2'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'region', label: 'ภาค' },
        { value: 'direction', label: 'ทิศ/ตำแหน่ง' },
        { value: 'apply', label: 'อ่านแผนที่' },
      ],
      bodyScript: `const MAP_ITEMS=[
 {type:'region',prompt:'ภาคเหนือมีจังหวัดตัวอย่างใด',place:'ภาคเหนือ',answer:'เช่น เชียงใหม่ เชียงราย ลำปาง'},
 {type:'region',prompt:'เชียงใหม่ตั้งอยู่ภาคใด',place:'เชียงใหม่',answer:'ภาคเหนือ'},
 {type:'region',prompt:'ขอนแก่นตั้งอยู่ภาคใด',place:'ขอนแก่น',answer:'ภาคตะวันออกเฉียงเหนือ (อีสาน)'},
 {type:'region',prompt:'ภูเก็ตตั้งอยู่ภาคใด',place:'ภูเก็ต',answer:'ภาคใต้'},
 {type:'region',prompt:'กรุงเทพมหานครอยู่ภาคใด',place:'กรุงเทพฯ',answer:'ภาคกลาง'},
 {type:'direction',prompt:'ถ้าหันหน้าไปทิศเหนือ ด้านขวาคือทิศใด',place:'ทิศ',answer:'ทิศตะวันออก'},
 {type:'direction',prompt:'สัญลักษณ์เข็มทิศบนแผนที่บอกอะไร',place:'เข็มทิศ',answer:'ทิศทางหลักบนแผนที่'},
 {type:'direction',prompt:'ภาคใต้ของไทยอยู่ทางทิศใดของกรุงเทพฯ',place:'ภาคใต้',answer:'ทิศใต้'},
 {type:'apply',prompt:'อ่านแผนที่: จังหวัดใกล้บ้านเราอยู่ภาคใด',place:'ชุมชน',answer:'ตอบตามจังหวัดจริงของนักเรียน'},
 {type:'apply',prompt:'ทำไมต้องมีมาตราส่วนบนแผนที่',place:'มาตราส่วน',answer:'เพื่อเทียบระยะบนแผนที่กับระยะจริง'},
 {type:'apply',prompt:'เส้นขอบเขตจังหวัดใช้สังเกตอย่างไร',place:'ขอบเขต',answer:'เส้นแบ่งระหว่างจังหวัดบนแผนที่'},
 {type:'apply',prompt:'ยกตัวอย่างทรัพยากรหรือลักษณะเด่นของภาคอีสาน 1 ข้อ',place:'อีสาน',answer:'เช่น ที่ราบสูง วัฒนธรรมผ้าไหม อาหารอีสาน'}
];
window.WORKSHEET_CONFIG={icon:'🗺️',title:'ใบงานแผนที่ประเทศไทย',subject:'สังคมศึกษา',gradeLabel:'ป.4–6',mediaLabel:'แผนที่ประเทศไทย',sourceMediaUrl:'/games/social/thailand-map.html',indicators:['ส 5.1 ป.4/1','ส 5.1 ป.4/2'],directions:'ระบุภาค อ่านทิศทาง และใช้สัญลักษณ์แผนที่อย่างมีเหตุผล',getItems(topic){return topic==='mixed'?MAP_ITEMS:MAP_ITEMS.filter(i=>i.type===topic);},buildMapWork(item){if(item.type==='region')return{line1:'หาตำแหน่ง: '+item.place,line2:'ตอบ: '+item.answer};if(item.type==='direction')return{line1:'ใช้เข็มทิศ/ทิศหลัก',line2:item.answer};return{line1:'อ่านแผนที่: '+item.place,line2:item.answer};},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;const w=this.buildMapWork(item);return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><div class="classify-grid"><div class="classify-box">เหนือ</div><div class="classify-box">กลาง</div><div class="classify-box">อีสาน</div><div class="classify-box">ใต้</div></div><div class="q-context">'+e(item.place)+'</div></div><div class="q-work-block"><div class="reason-line"><span class="work-fill">'+e(w.line1)+'</span></div><div class="reason-line"><span class="work-fill">'+e(w.line2)+'</span></div></div><div class="q-foot"><div class="answer-line">ตอบ <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
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
