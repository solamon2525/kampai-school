#!/usr/bin/env node
/**
 * Remaining 21 paired teaching-media worksheets (exclude _template-media.html)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const VER = '1.172.0';

const FOOTER = `</script><script src="/games/worksheet-topic.js?v=${VER}"></script><script>function render(){window.KampaiTopicWorksheet.render();}document.getElementById('btnRandom').onclick=window.KampaiTopicWorksheet.randomize;document.getElementById('btnAnswers').onclick=()=>document.body.classList.toggle('show-answers');document.getElementById('btnPrint').onclick=()=>window.print();window.KampaiWorksheet.loadTeachers();render();</script><script src="/games/worksheet-modes.js?v=${VER}"></script></body></html>`;

function shell({ icon, title, sourceMedia, indicators, topics, gradeOptions, bodyScript }) {
  const topicOpts = topics.map((t) => `<option value="${t.value}">${t.label}</option>`).join('');
  const gradeOpts = gradeOptions.map((g) => `<option value="${g}">ป.${g}</option>`).join('');
  const gradeLabel = gradeOptions.length === 1
    ? `ป.${gradeOptions[0]}`
    : `ป.${gradeOptions[0]}–${gradeOptions[gradeOptions.length - 1]}`;
  return `<!DOCTYPE html><html lang="th"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="worksheet-source-media" content="${sourceMedia}"><meta name="curriculum-indicators" content="${indicators.join(', ')}"><title>${title} ${gradeLabel} — โรงเรียนบ้านคำไผ่</title><link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet"><link href="/games/worksheet-topic.css?v=${VER}" rel="stylesheet"><link href="/games/worksheet-modes.css?v=${VER}" rel="stylesheet"></head><body>
<header class="toolbar"><h1>${icon} ${title}</h1><div class="toolbar-ctrls"><select class="t-select" id="selStyle" aria-label="รูปแบบใบงาน"><option value="standard">มาตรฐาน</option><option value="progressive">บันไดระดับ</option><option value="booklet">รวมเล่ม</option></select><select class="t-select" id="selPageCount" aria-label="จำนวนหน้า"><option value="1">1 หน้า</option><option value="2">2 หน้า</option><option value="3">3 หน้า</option></select><select class="t-select" id="selGrade" aria-label="ระดับชั้น">${gradeOpts}</select><select class="t-select" id="selTopic" aria-label="ทักษะ"><option value="mixed">ผสมทุกทักษะ</option>${topicOpts}</select><select class="t-select" id="selCount" aria-label="จำนวนข้อ"><option value="10">10 ข้อ</option><option value="5">5 ข้อ</option></select><input class="t-input" id="inpSchool" value="โรงเรียนบ้านคำไผ่" aria-label="ชื่อโรงเรียน"><select class="t-select" id="selTeacher" aria-label="ครูผู้สอน"><option value="">-- เลือกครูผู้สอน --</option></select><button class="btn primary" id="btnRandom">🎲 สุ่มใหม่</button><button class="btn" id="btnAnswers">👁 เฉลยครู</button><button class="btn green" id="btnPrint">🖨 พิมพ์ A4</button></div></header><main class="pages" id="pages"><section class="sheet"><div class="questions"><article class="q">กำลังสร้างใบงาน</article></div></section></main>
<script src="/games/worksheet-runtime.js?v=${VER}"></script><script>
${bodyScript}
${FOOTER}`;
}

const REASON_CFG = `renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;let stem='<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div>';if(item.context)stem+='<div class="q-context">'+e(item.context)+'</div>';if(item.choices)stem+='<div class="classify-grid">'+item.choices.map(c=>'<div class="classify-box">'+e(c)+'</div>').join('')+'</div>';stem+='<div>ลงวิธีคิด 3 ขั้น</div></div>';return stem+'<div class="q-work-block"><div class="reason-line"><span class="work-fill">'+e(item.step1)+'</span></div><div class="reason-line"><span class="work-fill">'+e(item.step2)+'</span></div><div class="reason-line"><span class="work-fill">'+e(item.step3)+'</span></div></div><div class="q-foot"><div class="answer-line">สรุป <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}`;

const CALC_CFG = `renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;let stem='<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div>';if(item.nums)stem+='<table class="mini-table"><tr><th>โจทย์</th><th>ข้อมูล</th></tr><tr><td>'+e(item.prompt.split(' ')[0])+'</td><td>'+e(item.nums)+'</td></tr></table>';stem+='<div>ลงวิธีคิดทีละขั้น</div></div>';return stem+'<div class="q-work-block"><div class="calc-line"><span class="work-fill">'+e(item.step1)+'</span></div><div class="calc-line"><span class="work-fill">'+e(item.step2)+'</span></div><div class="calc-line"><span class="work-fill">'+e(item.step3)+'</span></div></div><div class="q-foot"><div class="answer-line">สรุป <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}`;

const worksheets = [];

worksheets.push(
  {
    out: 'public/games/english/follow-instructions-worksheet.html',
    html: shell({
      icon: '📋',
      title: 'ใบงาน Follow Instructions',
      sourceMedia: '/games/english/follow-instructions.html',
      indicators: ['ต 1.1 ป.4/1', 'ต 1.1 ป.4/3'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'circle', label: 'Circle — วงกลม' },
        { value: 'underline', label: 'Underline — ขีดเส้นใต้' },
        { value: 'tick', label: 'Tick — ติ๊กถูก' },
        { value: 'read', label: 'อ่านคำสั่ง' },
      ],
      bodyScript: `const FOLLOW_ITEMS=[
{type:'circle',prompt:'อ่านคำสั่งแล้วเลือกสิ่งที่ต้อง "Circle"',context:'"Circle the apple."',choices:['🍎 แอปเปิล','🍌 กล้วย','🐱 แมว'],answer:'วงกลม 🍎 แอปเปิล',step1:'Circle = วาดวงกลมรอบสิ่งที่ถูกเรียกชื่อ',step2:'apple = แอปเปิล → เลือก 🍎',step3:'ไม่วงกลมกล้วยหรือแมว'},
{type:'circle',prompt:'"Circle the dog." ต้องทำอย่างไร',context:'🐕 🐈 🐦 🐟',choices:['วงกลมสุนัข','ขีดเส้นใต้แมว','ติ๊กนก'],answer:'วงกลม 🐕 สุนัข',step1:'อ่านคำกริยา Circle ก่อน',step2:'dog = สุนัข',step3:'วงกลมเฉพาะสุนัข'},
{type:'underline',prompt:'"Underline the cat." หมายถึงอะไร',context:'🐱 🐶 🐰 🐻',choices:['ขีดเส้นใต้แมว','วงกลมสุนัข','ติ๊กกระต่าย'],answer:'ขีดเส้นใต้ 🐱 แมว',step1:'Underline = ขีดเส้นใต้',step2:'cat = แมว',step3:'ขีดเส้นใต้แมวเท่านั้น'},
{type:'underline',prompt:'"Underline the word book." ในประโยค "I read a book."',context:'I read a book.',choices:['ขีดเส้นใต้ book','วงกลม read','ติ๊ก a'],answer:'ขีดเส้นใต้คำว่า book',step1:'หาคำ book ในประโยค',step2:'Underline = ขีดเส้นใต้คำนั้น',step3:'ไม่ขีด read หรือ a'},
{type:'tick',prompt:'"Tick the correct answer." หมายถึงอะไร',context:'2 + 3 = ? · 4 · 5 · 6',choices:['ติ๊ก 5','วงกลม 4','ขีด 6'],answer:'ติ๊ก ✓ ที่ 5',step1:'Tick = ติ๊กถูก/เลือกคำตอบที่ถูก',step2:'2+3=5',step3:'ติ๊ก 5 ไม่ใช่วงกลมหรือขีด'},
{type:'tick',prompt:'"Tick the banana." เลือกอะไร',context:'🍎 🍌 🍊 🍇',choices:['ติ๊กกล้วย','วงกลมแอปเปิล','ขีดส้ม'],answer:'ติ๊ก 🍌 กล้วย',step1:'Tick = ติ๊กถูกที่สิ่งที่ถูกเรียก',step2:'banana = กล้วย',step3:'ติ๊กกล้วยเท่านั้น'},
{type:'read',prompt:'แปลความหมาย: "Circle the red ball."',context:'🔴 ⚽ 🔵 ⚽',choices:['วงกลมลูกบอลสีแดง','ขีดลูกบอลสีน้ำเงิน'],answer:'วงกลมลูกบอลสีแดง',step1:'Circle = วงกลม · red = แดง · ball = ลูกบอล',step2:'เลือกลูกบอลที่เป็นสีแดง',step3:'ไม่เลือกลูกบอลสีน้ำเงิน'},
{type:'read',prompt:'แปล: "Underline the big tree."',context:'🌳เล็ก 🌳ใหญ่ 🌸',choices:['ขีดเส้นใต้ต้นไม้ใหญ่','วงกลมดอกไม้'],answer:'ขีดเส้นใต้ต้นไม้ใหญ่',step1:'big = ใหญ่ · tree = ต้นไม้',step2:'Underline = ขีดเส้นใต้',step3:'เลือกต้นไม้ใหญ่'},
{type:'circle',prompt:'"Circle all the stars." ต่างจาก Circle the star อย่างไร',context:'⭐ ⭐ 🌙 ⭐',choices:['วงกลมทุกดาว','วงกลมดวงเดียว'],answer:'วงกลมทุกดาว (all = ทั้งหมด)',step1:'all = ทั้งหมดที่เป็นดาว',step2:'ต้องวงกลมทุก ⭐',step3:'ไม่วงกลมพระจันทร์'},
{type:'underline',prompt:'"Underline the verb run." ในประโยค "They run fast."',context:'They run fast.',choices:['ขีด run','ขีด They','ขีด fast'],answer:'ขีดเส้นใต้ run',step1:'verb = คำกริยา = run',step2:'Underline ใต้ run',step3:'They=คำนาม · fast=คำวิเศษณ์'},
{type:'tick',prompt:'"Tick the sentence that is correct."',context:'A) He are happy. B) He is happy.',choices:['ติ๊ก B','ติ๊ก A'],answer:'ติ๊ก B) He is happy.',step1:'He ใช้ is ไม่ใช่ are',step2:'อ่านทั้งสองประโยค',step3:'B ถูกต้อง'},
{type:'read',prompt:'เรียงขั้นตอนเมื่อได้รับคำสั่งภาษาอังกฤษ',context:'Circle / Underline / Tick',choices:['1 อ่านคำกริยา 2 หาคำเป้า 3 ทำตามคำสั่ง','1 ทายความหมาย 2 ข้าม'],answer:'1 อ่านคำกริยา → 2 หาคำเป้า → 3 ทำตามคำสั่ง',step1:'อ่านคำสั่งให้ครบก่อน',step2:'แยกประเภท: วงกลม/ขีด/ติ๊ก',step3:'ทำตามคำสั่งอย่างแม่นยำ'}
];
window.WORKSHEET_CONFIG={icon:'📋',title:'ใบงาน Follow Instructions',subject:'ภาษาอังกฤษ',gradeLabel:'ป.4–6',mediaLabel:'Follow Instructions',sourceMediaUrl:'/games/english/follow-instructions.html',indicators:['ต 1.1 ป.4/1','ต 1.1 ป.4/3'],directions:'อ่านคำสั่งภาษาอังกฤษ Circle/Underline/Tick แล้วเลือกหรืออธิบายสิ่งที่ต้องทำ',getItems(topic){return topic==='mixed'?FOLLOW_ITEMS:FOLLOW_ITEMS.filter(i=>i.type===topic);},${REASON_CFG}};`,
    }),
  },
  {
    out: 'public/games/english/grammar-mini-worksheet.html',
    html: shell({
      icon: '📝',
      title: 'ใบงาน Grammar Mini',
      sourceMedia: '/games/english/grammar-mini.html',
      indicators: ['ต 2.1 ป.4/1'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'isare', label: 'is / are' },
        { value: 'aan', label: 'a / an' },
        { value: 'demonstrative', label: 'this/that/these/those' },
        { value: 'apply', label: 'ใช้ในประโยค' },
      ],
      bodyScript: `const GRAMMAR_ITEMS=[
{type:'isare',prompt:'เติม is หรือ are: They ___ happy.',context:'They = พหูพจน์',choices:['is','are'],answer:'are',step1:'They = มากกว่า 1 → ใช้ are',step2:'happy = คำคุณศัพท์',step3:'They are happy.'},
{type:'isare',prompt:'She ___ a teacher.',context:'She = เอกพจน์',choices:['is','are'],answer:'is',step1:'She = คนเดียว → is',step2:'a teacher = คำนาม',step3:'She is a teacher.'},
{type:'isare',prompt:'The books ___ on the desk.',context:'books = พหูพจน์',choices:['is','are'],answer:'are',step1:'books ลงท้าย s = หลายเล่ม',step2:'ใช้ are',step3:'The books are on the desk.'},
{type:'isare',prompt:'My cat ___ cute.',context:'cat = เอกพจน์',choices:['is','are'],answer:'is',step1:'My cat = สัตว์เลี้ยงตัวเดียว',step2:'ใช้ is',step3:'My cat is cute.'},
{type:'aan',prompt:'___ apple',context:'apple ขึ้นต้นด้วยเสียงสระ',choices:['a','an'],answer:'an',step1:'apple ออกเสียง /æ/ = สระ',step2:'สระ → an',step3:'an apple'},
{type:'aan',prompt:'___ book',context:'book ขึ้นต้นด้วยเสียงพยัญชนะ',choices:['a','an'],answer:'a',step1:'book ออกเสียง /b/ = พยัญชนะ',step2:'พยัญชนะ → a',step3:'a book'},
{type:'aan',prompt:'___ umbrella',context:'u ออกเสียง /ʌ/',choices:['a','an'],answer:'an',step1:'umbrella ออกเสียงสระ /ʌ/',step2:'ใช้ an',step3:'an umbrella'},
{type:'aan',prompt:'___ dog',context:'dog = /d/',choices:['a','an'],answer:'a',step1:'dog เริ่มพยัญชนะ',step2:'ใช้ a',step3:'a dog'},
{type:'demonstrative',prompt:'___ (ใกล้ เอก) pen on my desk',context:'ปากกาบนโต๊ะ — ใกล้มือ',choices:['This','That','These','Those'],answer:'This',step1:'ใกล้ + เอกพจน์ pen → This',step2:'That=ไกล · These/Those=พหู',step3:'This pen on my desk.'},
{type:'demonstrative',prompt:'___ (ไกล เอก) tree over there',context:'ต้นไม้ไกล ๆ',choices:['This','That','These','Those'],answer:'That',step1:'ไกล + เอกพจน์ → That',step2:'over there = อยู่โน่น',step3:'That tree over there.'},
{type:'demonstrative',prompt:'___ (ใกล้ พหู) books are mine',context:'หนังสือหลายเล่มใกล้มือ',choices:['This','That','These','Those'],answer:'These',step1:'ใกล้ + พหู books → These',step2:'are = พหูพจน์',step3:'These books are mine.'},
{type:'demonstrative',prompt:'___ (ไกล พหู) shoes are dirty',context:'รองเท้าหลายคู่ไกล ๆ',choices:['This','That','These','Those'],answer:'Those',step1:'ไกล + พหู shoes → Those',step2:'are สอดคล้องพหู',step3:'Those shoes are dirty.'},
{type:'apply',prompt:'แก้ประโยค: "He are my friend."',context:'He are my friend.',choices:['He is my friend.','He are my friends.'],answer:'He is my friend.',step1:'He = เอก → is',step2:'friend เอกพจน์',step3:'He is my friend.'},
{type:'apply',prompt:'เลือกถูก: ___ hour ago',context:'hour ออกเสียง /aʊ/',choices:['a hour','an hour'],answer:'an hour',step1:'hour เริ่มเสียงสระ /aʊ/',step2:'ใช้ an',step3:'an hour ago'}
];
window.WORKSHEET_CONFIG={icon:'📝',title:'ใบงาน Grammar Mini',subject:'ภาษาอังกฤษ',gradeLabel:'ป.4–6',mediaLabel:'Grammar Mini',sourceMediaUrl:'/games/english/grammar-mini.html',indicators:['ต 2.1 ป.4/1'],directions:'ฝึก is/are · a/an · this/that/these/those ตามกฎไวยากรณ์พื้นฐาน',getItems(topic){return topic==='mixed'?GRAMMAR_ITEMS:GRAMMAR_ITEMS.filter(i=>i.type===topic);},${REASON_CFG}};`,
    }),
  },
  {
    out: 'public/games/english/sight-words-worksheet.html',
    html: shell({
      icon: '👁️',
      title: 'ใบงาน Sight Words',
      sourceMedia: '/games/english/sight-words-p4.html',
      indicators: ['ต 1.1 ป.4/2'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'meaning', label: 'ความหมายคำ' },
        { value: 'sentence', label: 'ใช้ในประโยค' },
        { value: 'compare', label: 'เปรียบเทียบคำ' },
        { value: 'read', label: 'อ่านจำ' },
      ],
      bodyScript: `const SIGHT_ITEMS=[
{type:'meaning',prompt:'because หมายความว่าอะไร',context:'because',choices:['เพราะว่า','ก่อน','ระหว่าง'],answer:'เพราะว่า',step1:'because = ให้เหตุผล',step2:'ใช้เชื่อมเหตุ–ผล',step3:'I stayed home because it rained.'},
{type:'meaning',prompt:'before หมายความว่าอะไร',context:'before',choices:['ก่อน','หลัง','เพราะ'],answer:'ก่อน',step1:'before = ก่อนเวลา/เหตุการณ์',step2:'ตรงข้าม after',step3:'Wash hands before eating.'},
{type:'meaning',prompt:'between หมายความว่าอะไร',context:'between',choices:['ระหว่าง','ข้างใน','ข้างนอก'],answer:'ระหว่าง',step1:'between = อยู่กลางสองสิ่ง',step2:'between A and B',step3:'The ball is between the chairs.'},
{type:'meaning',prompt:'important หมายความว่าอะไร',context:'important',choices:['สำคัญ','ง่าย','เร็ว'],answer:'สำคัญ',step1:'important = มีความสำคัญ',step2:'Health is important.',step3:'ไม่ใช่ easy หรือ fast'},
{type:'sentence',prompt:'เติมคำ: I was tired ___ I went to bed early.',context:'because / before / between',choices:['because','before','between'],answer:'because',step1:'ต้องการเหตุผล',step2:'because = เพราะว่า',step3:'I was tired because I played all day.'},
{type:'sentence',prompt:'เติม: ___ dinner, wash your hands.',context:'before / because / important',choices:['Before','Because','Important'],answer:'Before',step1:'ล้างมือก่อนกิน',step2:'Before = ก่อน',step3:'Before dinner, wash your hands.'},
{type:'sentence',prompt:'เติม: Reading is ___ for learning.',context:'important / between / before',choices:['important','between','before'],answer:'important',step1:'การอ่านมีความสำคัญ',step2:'important for learning',step3:'Reading is important for learning.'},
{type:'compare',prompt:'แยกความต่าง before กับ because',context:'before · because',choices:['before=เวลา · because=เหตุผล','ความหมายเหมือนกัน'],answer:'before บอกเวลา · because บอกเหตุผล',step1:'before = ก่อนเหตุการณ์',step2:'because = เพราะว่า',step3:'ใช้คนละหน้าที่ในประโยค'},
{type:'compare',prompt:'between ใช้กับกี่สิ่ง',context:'between',choices:['สองสิ่ง','สามสิ่งขึ้นไป','สิ่งเดียว'],answer:'สองสิ่ง (between A and B)',step1:'between = กลางสอง',step2:'among = หลายสิ่ง',step3:'between the desk and chair'},
{type:'read',prompt:'อ่านและแปล: "This is important."',context:'This is important.',choices:['นี่สำคัญ','นี่ก่อน','นี่เพราะ'],answer:'นี่สำคัญ / สิ่งนี้สำคัญ',step1:'This = นี่/สิ่งนี้',step2:'important = สำคัญ',step3:'This is important.'},
{type:'read',prompt:'อ่าน: "Sit between Tom and Ann."',context:'Sit between Tom and Ann.',choices:['นั่งระหว่าง Tom กับ Ann','นั่งก่อน Tom'],answer:'นั่งระหว่าง Tom กับ Ann',step1:'Sit = นั่ง',step2:'between Tom and Ann',step3:'นั่งกลางสองคน'},
{type:'sentence',prompt:'สร้างประโยคใช้ because อย่างน้อย 1 คำ',context:'because',choices:['เช่น I like math because it is fun.','เช่น Because I run.'],answer:'เช่น I like math because it is fun.',step1:'because ตามด้วยเหตุผล',step2:'ประโยคต้องสมบูรณ์',step3:'มีประธาน+กริยา+because+เหตุผล'}
];
window.WORKSHEET_CONFIG={icon:'👁️',title:'ใบงาน Sight Words',subject:'ภาษาอังกฤษ',gradeLabel:'ป.4–6',mediaLabel:'Sight Words ป.4',sourceMediaUrl:'/games/english/sight-words-p4.html',indicators:['ต 1.1 ป.4/2'],directions:'ฝึกอ่านจำและใช้คำสำคัญ because, before, between, important ในประโยค',getItems(topic){return topic==='mixed'?SIGHT_ITEMS:SIGHT_ITEMS.filter(i=>i.type===topic);},${REASON_CFG}};`,
    }),
  },
  {
    out: 'public/games/health/handwash-worksheet.html',
    html: shell({
      icon: '🧼',
      title: 'ใบงานล้างมือ 7 ขั้น',
      sourceMedia: '/games/health/handwash-media.html',
      indicators: ['พ 4.1 ป.1/1', 'ว 1.2 ป.1/2'],
      gradeOptions: [1, 2, 3, 4],
      topics: [
        { value: 'order', label: 'เรียงลำดับ 7 ขั้น' },
        { value: 'detail', label: 'รายละเอียดแต่ละขั้น' },
        { value: 'why', label: 'ทำไมต้องทำ' },
        { value: 'apply', label: 'นำไปใช้' },
      ],
      bodyScript: `const HAND_ITEMS=[
{type:'order',prompt:'ขั้นที่ 1 ของการล้างมือคืออะไร',context:'7 ขั้นตามสื่อ',choices:['ฝ่ามือถูฝ่ามือ','ข้อมือ','ปลายนิ้ว'],answer:'ฝ่ามือถูฝ่ามือ',step1:'เริ่มทาสบู่ที่ฝ่ามือ',step2:'ถูฝ่ามือเข้าหากัน',step3:'ขั้น 1 = ฝ่ามือถูฝ่ามือ'},
{type:'order',prompt:'ขั้นที่ 2 คืออะไร',context:'หลังฝ่ามือถูฝ่ามือ',choices:['ฝ่ามือถูหลังมือ','ประสานนิ้ว','หลังนิ้ว'],answer:'ฝ่ามือถูหลังมือ',step1:'ฝ่ามือข้างหนึ่งถูหลังมืออีกข้าง',step2:'สลับมือ',step3:'ขั้น 2 = ฝ่ามือถูหลังมือ'},
{type:'order',prompt:'ขั้นที่ 3 คืออะไร',context:'หลังขั้น 2',choices:['ประสานนิ้ว','นิ้วหัวแม่มือ','ข้อมือ'],answer:'ประสานนิ้ว',step1:'ประสานนิ้วมือเข้าหากัน',step2:'ถูซอกนิ้วไปมา',step3:'ขั้น 3 = ประสานนิ้ว'},
{type:'order',prompt:'ขั้นที่ 4–7 เรียงถูกต้อง',context:'4→5→6→7',choices:['หลังนิ้ว→หัวแม่มือ→ปลายนิ้ว→ข้อมือ','ข้อมือ→ปลายนิ้ว→หลังนิ้ว→หัวแม่มือ'],answer:'หลังนิ้ว → หัวแม่มือ → ปลายนิ้ว → ข้อมือ',step1:'4 หลังนิ้ว · 5 หัวแม่มือ',step2:'6 ปลายนิ้ว · 7 ข้อมือ+ล้างน้ำ',step3:'ลำดับครบ 7 ขั้น'},
{type:'detail',prompt:'ขั้น "หลังนิ้ว" ทำอย่างไร',context:'✊ หลังนิ้ว',choices:['กำมือ เอานิ้วถูฝ่ามือ สลับมือ','ประสานนิ้วถูซอก'],answer:'กำมือ เอานิ้วมือถูฝ่ามืออีกข้าง สลับมือ',step1:'กำมือ (fist)',step2:'นิ้วถูฝ่ามืออีกข้าง',step3:'สลับมือทั้งสองข้าง'},
{type:'detail',prompt:'ขั้น "นิ้วหัวแม่มือ" ทำอย่างไร',context:'👍 หัวแม่มือ',choices:['บีบหมุนหัวแม่มือ สลับมือ','ถูปลายนิ้วลงฝ่ามือ'],answer:'บีบนิ้วหัวแม่มือของมือหนึ่งด้วยมืออีกข้าง หมุนโรล สลับมือ',step1:'หัวแม่มือจับของบ่อย',step2:'บีบ+หมุนโรล',step3:'สลับมือ'},
{type:'detail',prompt:'ขั้น "ปลายนิ้ว" ทำอย่างไร',context:'👆 ปลายนิ้ว',choices:['ประสานนิ้ว ถูปลายลงฝ่ามือ สลับ','ถูข้อมือ'],answer:'ประสานนิ้วมือ แล้วถูปลายนิ้วลงบนฝ่ามืออีกข้าง สลับมือ',step1:'ปลายนิ้วสัมผัสสิ่งของมาก',step2:'ประสานแล้วถูลงฝ่ามือ',step3:'สลับมือ'},
{type:'detail',prompt:'ขั้นสุดท้าย (ข้อมือ) ทำอย่างไร',context:'🔄 ข้อมือ',choices:['ถูรอบข้อมือ ล้างน้ำให้หมด','ถูแค่ฝ่ามือ'],answer:'ถูรอบข้อมือทั้งสองข้างด้วยสบู่ แล้วล้างน้ำออกให้หมด',step1:'ข้อมือมักถูกลืม',step2:'ถูรอบข้อมือทั้งสองข้าง',step3:'ล้างน้ำอย่างน้อย 20 วินาที'},
{type:'why',prompt:'ทำไมต้องล้างมือก่อนกินอาหาร',context:'🍽️ ก่อนกิน',choices:['ลดเชื้อโรค','ทำให้มือหอม'],answer:'ลดเชื้อโรคและสิ่งสกปรกที่ติดมือ',step1:'มือสัมผัสสิ่งต่าง ๆ',step2:'เชื้อโรคเข้าปากได้',step3:'7 ขั้นช่วยล้างทุกจุด'},
{type:'why',prompt:'ทำไมขั้น "ประสานนิ้ว" สำคัญ',context:'🙏 ซอกนิ้ว',choices:['ซอกนิ้วสกปรกบ่อย','ไม่จำเป็น'],answer:'นิ้วกลางและนิ้วนางมักมีเชื้อโรคในซอก',step1:'ซอกนิ้วล้างยาก',step2:'ต้องถูไปมา',step3:'ไม่ข้ามขั้นนี้'},
{type:'apply',prompt:'เมื่อไหร่ควรล้างมือ 3 กรณี',context:'ชีวิตประจำวัน',choices:['ก่อนกิน หลังเข้าห้องน้ำ หลังเล่น','เฉพาะตอนมือสกปรกมาก'],answer:'เช่น ก่อนกิน · หลังเข้าห้องน้ำ · หลังเล่น/สัมผัสสัตว์',step1:'เลือกกิจกรรมที่มือสกปรก',step2:'เชื่อม 7 ขั้น',step3:'ทำเป็นประจำ'},
{type:'apply',prompt:'ถ้าข้ามขั้น "ข้อมือ" จะเกิดอะไร',context:'🔄 ข้อมือ',choices:['เชื้อโรคอาจเหลือที่ข้อมือ','ไม่มีผล'],answer:'เชื้อโรคอาจเหลือที่ข้อมือและติดสู่สิ่งอื่น',step1:'ข้อมือสัมผัสโต๊ะ/ประตู',step2:'ข้าม = ล้างไม่ครบ',step3:'ต้องครบ 7 ขั้น'}
];
window.WORKSHEET_CONFIG={icon:'🧼',title:'ใบงานล้างมือ 7 ขั้น',subject:'สุขศึกษา',gradeLabel:'ป.1–4',mediaLabel:'ล้างมือ 7 ขั้น',sourceMediaUrl:'/games/health/handwash-media.html',indicators:['พ 4.1 ป.1/1','ว 1.2 ป.1/2'],directions:'เรียนลำดับ 7 ขั้นล้างมือจากสื่อ อธิบายวิธีทำ และเชื่อมกับการดูแลสุขภาพ',getItems(topic){return topic==='mixed'?HAND_ITEMS:HAND_ITEMS.filter(i=>i.type===topic);},${REASON_CFG}};`,
    }),
  },
  {
    out: 'public/games/math/bar-chart-worksheet.html',
    html: shell({
      icon: '📊', title: 'ใบงานแผนภูมิแท่ง',
      sourceMedia: '/games/math/bar-chart-media.html', indicators: ['ค 3.1 ป.4/1'],
      gradeOptions: [4, 5, 6],
      topics: [{ value: 'read', label: 'อ่านค่า' }, { value: 'compare', label: 'เปรียบเทียบ' }, { value: 'total', label: 'หาผลรวม' }, { value: 'scale', label: 'กำหนดสเกล' }],
      bodyScript: `const BAR_ITEMS=[
{type:'read',labels:['มะม่วง','กล้วย','ส้ม'],values:[6,9,4],prompt:'ผลไม้ชนิดใดมีจำนวนมากที่สุด',answer:'กล้วย 9 ผล',step1:'อ่าน: 6, 9, 4',step2:'9 มากสุด',step3:'กล้วย'},
{type:'read',labels:['แดง','ฟ้า','เขียว'],values:[8,5,7],prompt:'สีใดน้อยที่สุด',answer:'ฟ้า 5',step1:'8,5,7',step2:'5 น้อยสุด',step3:'สีฟ้า'},
{type:'compare',labels:['จันทร์','อังคาร','พุธ'],values:[5,8,6],prompt:'อังคารมากกว่าจันทร์เท่าไร',answer:'3 (8−5)',step1:'8 และ 5',step2:'8−5=3',step3:'มากกว่า 3'},
{type:'compare',labels:['A','B','C'],values:[12,10,14],prompt:'C มากกว่า B เท่าไร',answer:'4 (14−10)',step1:'C=14 B=10',step2:'14−10=4',step3:'ต่าง 4'},
{type:'total',labels:['ป.4/1','ป.4/2','ป.4/3'],values:[12,10,14],prompt:'รวมทั้งสามห้อง',answer:'36',step1:'12+10+14',step2:'=36',step3:'36 คน'},
{type:'total',labels:['ข้าว','นม','ไข่'],values:[10,6,8],prompt:'รวมทั้งสาม',answer:'24',step1:'10+6+8',step2:'=24',step3:'24'},
{type:'scale',labels:['A','B','C'],values:[4,6,10],prompt:'สเกลครั้งละ 2 แท่งสูง 10 หมายถึง',answer:'10 หน่วย',step1:'สเกล=2/ช่อง',step2:'แท่ง=10',step3:'10 หน่วย'},
{type:'scale',labels:['X','Y'],values:[3,5],prompt:'สเกล 1 อ่าน Y',answer:'5',step1:'1/ช่อง',step2:'Y=5',step3:'5 หน่วย'},
{type:'read',labels:['Q1','Q2','Q3','Q4'],values:[15,12,18,9],prompt:'ไตรมาสน้อยสุด',answer:'Q4=9',step1:'อ่านค่า',step2:'9 น้อยสุด',step3:'Q4'},
{type:'compare',labels:['เหนือ','กลาง','ใต้'],values:[7,11,8],prompt:'เรียงมาก→น้อย',answer:'กลาง11 ใต้8 เหนือ7',step1:'11>8>7',step2:'เรียง',step3:'กลาง ใต้ เหนือ'},
{type:'total',labels:['A','B'],values:[25,17],prompt:'รวม A+B',answer:'42',step1:'25+17',step2:'=42',step3:'42'},
{type:'scale',labels:['P','Q'],values:[6,9],prompt:'แกน 0 สเกล 3 แท่ง Q=9',answer:'9 หน่วย',step1:'ดูแกน',step2:'Q=9',step3:'9'}
];
window.WORKSHEET_CONFIG={icon:'📊',title:'ใบงานแผนภูมิแท่ง',subject:'คณิตศาสตร์',gradeLabel:'ป.4–6',mediaLabel:'แผนภูมิแท่ง',sourceMediaUrl:'/games/math/bar-chart-media.html',indicators:['ค 3.1 ป.4/1'],directions:'อ่านตารางและแผนภูมิแท่ง เปรียบเทียบ หาผลรวม และกำหนดสเกล',getItems(t){return t==='mixed'?BAR_ITEMS:BAR_ITEMS.filter(i=>i.type===t);},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;const p=item.labels.map((l,i)=>l+'='+item.values[i]).join(' · ');return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><table class="mini-table"><tr><th>รายการ</th><th>จำนวน</th></tr>'+item.labels.map((l,i)=>'<tr><td>'+e(l)+'</td><td>'+item.values[i]+'</td></tr>').join('')+'</table><div class="chart-grid"><div class="scale-box">'+e(p)+'</div></div><div>ลงวิธีคิด 3 ขั้น</div></div><div class="q-work-block"><div class="reason-line"><span class="work-fill">'+e(item.step1)+'</span></div><div class="reason-line"><span class="work-fill">'+e(item.step2)+'</span></div><div class="reason-line"><span class="work-fill">'+e(item.step3)+'</span></div></div><div class="q-foot"><div class="answer-line">สรุป <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },
  {
    out: 'public/games/math/number-line-worksheet.html',
    html: shell({
      icon: '📏', title: 'ใบงานเส้นจำนวน',
      sourceMedia: '/games/math/number-line-media.html', indicators: ['ค 1.1 ป.1/2', 'ค 1.1 ป.2/1', 'ค 1.1 ป.3/1'],
      gradeOptions: [1, 2, 3, 4],
      topics: [{ value: 'locate', label: 'ระบุตำแหน่ง' }, { value: 'compare', label: 'เปรียบเทียบ' }, { value: 'order', label: 'เรียงลำดับ' }, { value: 'jump', label: 'กระโดดบนเส้น' }],
      bodyScript: `const NL_ITEMS=[
{type:'locate',prompt:'7 อยู่ระหว่างใดบนเส้น 0–10',context:'0–10',choices:['5 กับ 10','0 กับ 5'],answer:'ระหว่าง 5 กับ 10',step1:'7>5 และ 7<10',step2:'นับ ...5,6,7...',step3:'ครึ่งหลัง'},
{type:'locate',prompt:'3 บนเส้น 0–10',context:'0–10',choices:['ก่อน 5','หลัง 8'],answer:'ก่อน 5',step1:'3<5',step2:'ครึ่งแรก',step3:'0–5'},
{type:'compare',prompt:'4 กับ 9',context:'4 · 9',choices:['4<9','4>9'],answer:'4<9',step1:'ซ้าย=น้อย',step2:'4 ซ้าย 9',step3:'4<9'},
{type:'compare',prompt:'6 กับ 6',context:'6 · 6',choices:['6=6','6<6'],answer:'6=6',step1:'ตำแหน่งเดียว',step2:'เท่ากัน',step3:'6=6'},
{type:'order',prompt:'เรียง 8,2,5 น้อย→มาก',context:'8·2·5',choices:['2,5,8','8,5,2'],answer:'2,5,8',step1:'2 น้อยสุด',step2:'5 กลาง',step3:'2→5→8'},
{type:'order',prompt:'เรียง 10,7,9 มาก→น้อย',context:'10·7·9',choices:['10,9,7','7,9,10'],answer:'10,9,7',step1:'10 มากสุด',step2:'9 กลาง',step3:'10→9→7'},
{type:'jump',prompt:'3 +4 → ?',context:'3+4',choices:['7','6'],answer:'7',step1:'เริ่ม 3',step2:'+4 ช่อง',step3:'=7'},
{type:'jump',prompt:'9 −3 → ?',context:'9−3',choices:['6','12'],answer:'6',step1:'เริ่ม 9',step2:'−3 ช่อง',step3:'=6'},
{type:'locate',prompt:'0.5 บนเส้น 0–1',context:'ทศนิยม',choices:['กลาง 0–1','หลัง 1'],answer:'กลาง 0–1',step1:'0.5=ครึ่ง',step2:'กลางเส้น',step3:'0.5'},
{type:'compare',prompt:'0.3 กับ 0.7',context:'ทศนิยม',choices:['0.3<0.7','0.3>0.7'],answer:'0.3<0.7',step1:'0.3 ซ้าย',step2:'ซ้าย=น้อย',step3:'0.3<0.7'},
{type:'jump',prompt:'0 +0.2×3',context:'ทศนิยม',choices:['0.6','0.3'],answer:'0.6',step1:'0.2×3',step2:'=0.6',step3:'0.6'},
{type:'order',prompt:'เรียง 0.8,0.2,0.5',context:'ทศนิยม',choices:['0.2,0.5,0.8','0.8,0.5,0.2'],answer:'0.2,0.5,0.8',step1:'บนเส้น 0–1',step2:'0.2 ซ้ายสุด',step3:'0.2→0.5→0.8'}
];
window.WORKSHEET_CONFIG={icon:'📏',title:'ใบงานเส้นจำนวน',subject:'คณิตศาสตร์',gradeLabel:'ป.1–4',mediaLabel:'เส้นจำนวน',sourceMediaUrl:'/games/math/number-line-media.html',indicators:['ค 1.1 ป.1/2','ค 1.1 ป.2/1','ค 1.1 ป.3/1'],directions:'ใช้เส้นจำนวนระบุตำแหน่ง เปรียบเทียบ เรียง และกระโดดบวกลบ',getItems(t){return t==='mixed'?NL_ITEMS:NL_ITEMS.filter(i=>i.type===t);},${REASON_CFG}};`,
    }),
  },
  {
    out: 'public/games/math/short-division-worksheet.html',
    html: shell({
      icon: '➗', title: 'ใบงานหารสั้นวิธีคิด',
      sourceMedia: '/games/math/short-division-thinking-media.html', indicators: ['ค 1.1 ป.4/9', 'ค 1.1 ป.4/10', 'ค 1.1 ป.4/11'],
      gradeOptions: [4, 5, 6],
      topics: [{ value: 'divide', label: 'หาร' }, { value: 'check', label: 'ตรวจคำตอบ' }, { value: 'word', label: 'โจทย์ปัญหา' }, { value: 'strategy', label: 'กลยุทธ์' }],
      bodyScript: `const SD_ITEMS=[
{type:'divide',prompt:'84 ÷ 4 = ?',nums:'84÷4',answer:'21',step1:'8÷4=2',step2:'4×2=8 ลบ · 4÷4=1',step3:'=21'},
{type:'divide',prompt:'96 ÷ 3 = ?',nums:'96÷3',answer:'32',step1:'9÷3=3',step2:'6÷3=2',step3:'=32'},
{type:'divide',prompt:'75 ÷ 5 = ?',nums:'75÷5',answer:'15',step1:'75÷5',step2:'5×15=75',step3:'=15'},
{type:'divide',prompt:'63 ÷ 7 = ?',nums:'63÷7',answer:'9',step1:'7×9=63',step2:'สูตรคูณ',step3:'=9'},
{type:'divide',prompt:'58 ÷ 2 = ?',nums:'58÷2',answer:'29',step1:'58÷2',step2:'2×29=58',step3:'=29'},
{type:'check',prompt:'48÷6=7 ถูกไหม',nums:'48÷6',answer:'ผิด · =8',step1:'6×7=42',step2:'6×8=48',step3:'=8'},
{type:'check',prompt:'56÷8=7 ตรวจ',nums:'56÷8',answer:'ถูก · 8×7=56',step1:'คูณย้อน',step2:'8×7=56',step3:'ถูก'},
{type:'word',prompt:'72 ชิ้น แจก 8 คน',nums:'72÷8',answer:'9/คน',step1:'แบ่งเท่า=หาร',step2:'72÷8',step3:'9'},
{type:'word',prompt:'45 แท่ง 5/กล่อง',nums:'45÷5',answer:'9 กล่อง',step1:'45÷5',step2:'5×9=45',step3:'9'},
{type:'strategy',prompt:'84÷4 แยก 80÷4+4÷4',nums:'84÷4',answer:'21',step1:'80÷4=20',step2:'4÷4=1',step3:'21'},
{type:'strategy',prompt:'หาร 9 ใช้วิธี',nums:'÷9',answer:'หา ×9 ได้เลขถูกหาร',step1:'คูณ 9 ย้อน',step2:'63÷9→7',step3:'สูตรคูณ'},
{type:'word',prompt:'96 คน 4 คัน',nums:'96÷4',answer:'24/คัน',step1:'96÷4',step2:'4×24=96',step3:'24'}
];
window.WORKSHEET_CONFIG={icon:'➗',title:'ใบงานหารสั้นวิธีคิด',subject:'คณิตศาสตร์',gradeLabel:'ป.4–6',mediaLabel:'หารสั้น',sourceMediaUrl:'/games/math/short-division-thinking-media.html',indicators:['ค 1.1 ป.4/9','ค 1.1 ป.4/10','ค 1.1 ป.4/11'],directions:'หารสั้นทีละขั้น ตรวจด้วยคูณย้อน แก้โจทย์ปัญหา',getItems(t){return t==='mixed'?SD_ITEMS:SD_ITEMS.filter(i=>i.type===t);},${CALC_CFG}};`,
    }),
  },
  {
    out: 'public/games/math/decimal-hub-worksheet.html',
    html: shell({ icon: '🔢', title: 'ใบงานทศนิยม Hub', sourceMedia: '/games/math/math-decimal-hub/index.html', indicators: ['ค 1.1 ป.4/5', 'ค 1.1 ป.4/6'], gradeOptions: [4, 5, 6],
      topics: [{ value: 'read', label: 'อ่านค่า' }, { value: 'compare', label: 'เปรียบเทียบ' }, { value: 'place', label: 'ค่าประจำหลัก' }, { value: 'compute', label: 'บวกลบ' }],
      bodyScript: `const DEC_ITEMS=[
{type:'read',prompt:'0.7 อ่านอย่างไร',context:'0.7',choices:['ศูนย์จุดเจ็ด','เจ็ดสิบ'],answer:'ศูนย์จุดเจ็ด / จุดเจ็ด',step1:'0 = ศูนย์',step2:'.7 = 7 ในหลัก tenths',step3:'ศูนย์จุดเจ็ด'},
{type:'read',prompt:'2.35 มีกี่หลักทศนิยม',context:'2.35',choices:['2 หลัก','3 หลัก'],answer:'2 หลัก (3 และ 5)',step1:'หลังจุด = ทศนิยม',step2:'3 หลับสิบ · 5 หลับร้อย',step3:'2 หลัก'},
{type:'compare',prompt:'0.6 ___ 0.8',context:'0.6 · 0.8',choices:['<','>'],answer:'0.6 < 0.8',step1:'6 tenths < 8 tenths',step2:'0.6 น้อยกว่า',step3:'<'},
{type:'compare',prompt:'1.2 ___ 1.20',context:'1.2 · 1.20',choices:['=','<'],answer:'1.2 = 1.20',step1:'0 ท้ายไม่เปลี่ยนค่า',step2:'เท่ากัน',step3:'='},
{type:'place',prompt:'ใน 4.56 หลักสิบ = ?',context:'4.56',choices:['4','5'],answer:'4',step1:'4 อยู่หลักสิบ',step2:'5 หลับสิบ · 6 หลับร้อย',step3:'หลักสิบ=4'},
{type:'place',prompt:'0.08 หลักร้อย = ?',context:'0.08',choices:['8','0'],answer:'8',step1:'0 หลับสิบ',step2:'8 หลับร้อย',step3:'8'},
{type:'compute',prompt:'1.2 + 0.5 = ?',nums:'1.2+0.5',answer:'1.7',step1:'1.2+0.5',step2:'=1.7',step3:'1.7'},
{type:'compute',prompt:'3.6 − 1.4 = ?',nums:'3.6−1.4',answer:'2.2',step1:'3.6−1.4',step2:'=2.2',step3:'2.2'},
{type:'read',prompt:'0.05 อ่านอย่างไร',context:'0.05',choices:['ศูนย์จุดศูนย์ห้า','ห้าสิบ'],answer:'ศูนย์จุดศูนย์ห้า',step1:'0 tenths',step2:'5 hundredths',step3:'ศูนย์จุดศูนย์ห้า'},
{type:'compare',prompt:'เรียง 0.9, 0.09, 0.5 น้อย→มาก',context:'ทศนิยม',choices:['0.09,0.5,0.9','0.9,0.5,0.09'],answer:'0.09, 0.5, 0.9',step1:'0.09 น้อยสุด',step2:'0.5 กลาง',step3:'0.09→0.5→0.9'},
{type:'compute',prompt:'0.3 + 0.4 = ?',nums:'0.3+0.4',answer:'0.7',step1:'3 tenths + 4 tenths',step2:'=7 tenths',step3:'0.7'},
{type:'place',prompt:'5.0 = 5 หรือไม่',context:'5.0',choices:['เท่ากัน','ต่างกัน'],answer:'เท่ากัน (5.0=5)',step1:'.0 ไม่เปลี่ยนค่า',step2:'5.0=5',step3:'เท่ากัน'}
];
window.WORKSHEET_CONFIG={icon:'🔢',title:'ใบงานทศนิยม Hub',subject:'คณิตศาสตร์',gradeLabel:'ป.4–6',mediaLabel:'ทศนิยม Hub',sourceMediaUrl:'/games/math/math-decimal-hub/index.html',indicators:['ค 1.1 ป.4/5','ค 1.1 ป.4/6'],directions:'อ่าน เปรียบเทียบ ค่าประจำหลัก และบวกลบทศนิยม',getItems(t){return t==='mixed'?DEC_ITEMS:DEC_ITEMS.filter(i=>i.type===t);},${REASON_CFG}};`,
    }),
  },
  {
    out: 'public/games/math/fraction-hub-worksheet.html',
    html: shell({ icon: '🍰', title: 'ใบงานเศษส่วน Hub', sourceMedia: '/games/math/math-fraction-hub/index.html', indicators: ['ค 1.1 ป.4/13', 'ค 1.1 ป.4/14'], gradeOptions: [4, 5, 6],
      topics: [{ value: 'meaning', label: 'ความหมาย' }, { value: 'compare', label: 'เปรียบเทียบ' }, { value: 'equivalent', label: 'เท่ากัน' }, { value: 'operate', label: 'บวกลบ' }],
      bodyScript: `const FRAC_ITEMS=[
{type:'meaning',prompt:'1/4 หมายถึงอะไร',context:'1/4',choices:['แบ่ง 4 ส่วน เอา 1','แบ่ง 1 เอา 4'],answer:'แบ่งเท่า 4 ส่วน เอา 1 ส่วน',step1:'分母=4 ส่วน',step2:'分子=1 ส่วน',step3:'1 จาก 4'},
{type:'meaning',prompt:'3/5 อ่านอย่างไร',context:'3/5',choices:['สามส่วนห้า','ห้าส่วนสาม'],answer:'สามส่วนห้า',step1:'3 ด้านบน',step2:'5 ด้านล่าง',step3:'สามส่วนห้า'},
{type:'compare',prompt:'1/2 ___ 1/4',context:'1/2 · 1/4',choices:['>','<'],answer:'1/2 > 1/4',step1:'ครึ่ง > หนึ่งส่วนสี่',step2:'分母เล็ก=ชิ้นใหญ่',step3:'>'},
{type:'compare',prompt:'2/3 ___ 2/5',context:'ตัวเศษเท่า',choices:['>','<'],answer:'2/3 > 2/5',step1:'เศษเท่า ดู分母',step2:'3<5 → 2/3 ใหญ่กว่า',step3:'>'},
{type:'equivalent',prompt:'1/2 = ?/4',context:'เท่ากัน',choices:['2/4','1/4'],answer:'2/4',step1:'2×2=4',step2:'1×2=2',step3:'2/4'},
{type:'equivalent',prompt:'3/6 = ?/2',context:'ย่อ',choices:['1/2','3/2'],answer:'1/2',step1:'หาร 3',step2:'3÷3=1 · 6÷3=2',step3:'1/2'},
{type:'operate',prompt:'1/4 + 1/4 = ?',nums:'1/4+1/4',answer:'2/4 = 1/2',step1:'分母เท่า บวกเศษ',step2:'1+1=2',step3:'2/4=1/2'},
{type:'operate',prompt:'3/4 − 1/4 = ?',nums:'3/4−1/4',answer:'2/4 = 1/2',step1:'分母เท่า',step2:'3−1=2',step3:'2/4=1/2'},
{type:'meaning',prompt:'เศษส่วนที่มากกว่า 1 เช่น 5/4',context:'5/4',choices:['มากกว่า 1 ชิ้นเต็ม','น้อยกว่า 1'],answer:'มากกว่า 1 (1 ชิ้นเต็ม + 1/4)',step1:'4/4=1',step2:'5/4=1+1/4',step3:'>1'},
{type:'compare',prompt:'เรียง 1/3, 1/2, 1/5 มาก→น้อย',context:'เศษส่วน',choices:['1/2,1/3,1/5','1/5,1/3,1/2'],answer:'1/2, 1/3, 1/5',step1:'1/2 มากสุด',step2:'1/5 น้อยสุด',step3:'1/2→1/3→1/5'},
{type:'equivalent',prompt:'2/3 = 4/?',context:'ขยาย',choices:['6','5'],answer:'6',step1:'×2 ทั้งคู่',step2:'3×2=6',step3:'4/6'},
{type:'operate',prompt:'1/2 + 1/4 = ?',nums:'1/2+1/4',answer:'3/4',step1:'1/2=2/4',step2:'2/4+1/4=3/4',step3:'3/4'}
];
window.WORKSHEET_CONFIG={icon:'🍰',title:'ใบงานเศษส่วน Hub',subject:'คณิตศาสตร์',gradeLabel:'ป.4–6',mediaLabel:'เศษส่วน Hub',sourceMediaUrl:'/games/math/math-fraction-hub/index.html',indicators:['ค 1.1 ป.4/13','ค 1.1 ป.4/14'],directions:'ความหมาย เปรียบเทียบ เศษส่วนเท่ากัน และบวกลบ',getItems(t){return t==='mixed'?FRAC_ITEMS:FRAC_ITEMS.filter(i=>i.type===t);},${REASON_CFG}};`,
    }),
  },
  {
    out: 'public/games/math/geometry-hub-worksheet.html',
    html: shell({ icon: '📐', title: 'ใบงานเรขาคณิต Hub', sourceMedia: '/games/math/math-geometry-hub/index.html', indicators: ['ค 2.2 ป.4/1', 'ค 2.2 ป.4/2'], gradeOptions: [4, 5, 6],
      topics: [{ value: 'shape', label: 'รูปทรง' }, { value: 'angle', label: 'มุม' }, { value: 'perimeter', label: 'เส้นรอบ' }, { value: 'area', label: 'พื้นที่' }],
      bodyScript: `const GEO_ITEMS=[
{type:'shape',prompt:'สามเหลี่ยมมีกี่ด้าน',context:'△',choices:['3','4'],answer:'3 ด้าน',step1:'นับด้าน',step2:'3 ด้าน',step3:'สามเหลี่ยม'},
{type:'shape',prompt:'สี่เหลี่ยมจัตุรัส vs สี่เหลี่ยมผืนผ้า',context:'□',choices:['จัตุรัส=ด้านเท่า · ผืนผ้า=2 คู่เท่า','เหมือนกัน'],answer:'จัตุรัสทุกด้านเท่า · ผืนผ้าคู่ตรงข้ามเท่า',step1:'จัตุรัส 4 ด้านเท่า',step2:'ผืนผ้า 2 คู่',step3:'ต่างกัน'},
{type:'angle',prompt:'มุมฉาก = ? องศา',context:'∟',choices:['90°','180°'],answer:'90°',step1:'มุมฉาก=ฉาก',step2:'=90°',step3:'90°'},
{type:'angle',prompt:'มุมแหลม vs มุมป้าน',context:'มุม',choices:['แหลม<90° · ป้าน>90°','แหลม>90°'],answer:'แหลม<90° · ป้าน>90°',step1:'แหลมแคบ',step2:'ป้านกว้าง',step3:'<90 vs >90'},
{type:'perimeter',prompt:'สquare ด้าน 5 cm เส้นรอบ',context:'5 cm',choices:['20 cm','25 cm'],answer:'20 cm (5×4)',step1:'4 ด้านเท่า',step2:'5×4=20',step3:'20 cm'},
{type:'perimeter',prompt:'สี่เหลี่ยม ยาว 6 กว้าง 4 เส้นรอบ',context:'6×4',choices:['20','24'],answer:'20 (6+4+6+4)',step1:'2×(6+4)',step2:'=20',step3:'20'},
{type:'area',prompt:'สี่เหลี่ยม ยาว 5 กว้าง 3 พื้นที่',context:'5×3',choices:['15','8'],answer:'15 ตร.หน่วย',step1:'ก×ย',step2:'5×3=15',step3:'15'},
{type:'area',prompt:'สquare ด้าน 4 พื้นที่',context:'4×4',choices:['16','8'],answer:'16',step1:'4×4',step2:'=16',step3:'16'},
{type:'shape',prompt:'วงกลมมีมุมกี่มุม',context:'○',choices:['0','4'],answer:'0 มุม',step1:'วงกลมโค้ง',step2:'ไม่มีมุม',step3:'0'},
{type:'angle',prompt:'มุมตรง = ? องศา',context:'180°',choices:['180°','90°'],answer:'180°',step1:'เส้นตรง',step2:'=180°',step3:'180°'},
{type:'perimeter',prompt:'สามเหลี่ยม ด้าน 3,4,5 เส้นรอบ',context:'3+4+5',choices:['12','15'],answer:'12',step1:'3+4+5',step2:'=12',step3:'12'},
{type:'area',prompt:'สูตรพื้นที่สี่เหลี่ยม',context:'สูตร',choices:['ก×ย','2(ก+ย)'],answer:'ก×ย (ยาว×กว้าง)',step1:'พื้นที่=ก×ย',step2:'เส้นรอบ=2(ก+ย)',step3:'แยกสูตร'}
];
window.WORKSHEET_CONFIG={icon:'📐',title:'ใบงานเรขาคณิต Hub',subject:'คณิตศาสตร์',gradeLabel:'ป.4–6',mediaLabel:'เรขาคณิต Hub',sourceMediaUrl:'/games/math/math-geometry-hub/index.html',indicators:['ค 2.2 ป.4/1','ค 2.2 ป.4/2'],directions:'รูปทรง มุม เส้นรอบ และพื้นที่',getItems(t){return t==='mixed'?GEO_ITEMS:GEO_ITEMS.filter(i=>i.type===t);},${REASON_CFG}};`,
    }),
  },
  {
    out: 'public/games/math/word-problem-hub-worksheet.html',
    html: shell({ icon: '📝', title: 'ใบงานโจทย์ปัญหา Hub', sourceMedia: '/games/math/math-word-problem-hub/index.html', indicators: ['ค 1.2 ป.4/1', 'ค 1.2 ป.5/1'], gradeOptions: [4, 5, 6],
      topics: [{ value: 'read', label: 'อ่านโจทย์' }, { value: 'plan', label: 'วางแผน' }, { value: 'compute', label: 'คำนวณ' }, { value: 'check', label: 'ตรวจคำตอบ' }],
      bodyScript: `const WP_ITEMS=[
{type:'read',prompt:'มีแอปple 12 ลูก กิน 5 ลูก เหลือ?',context:'12−5',choices:['ลบ','บวก'],answer:'ลบ (12−5)',step1:'เริ่ม 12',step2:'กิน=ลด',step3:'12−5=7'},
{type:'read',prompt:'มีลูกอม 8 ถุง ถุงละ 6 ลูก รวม?',context:'8×6',choices:['คูณ','บวก'],answer:'คูณ 8×6=48',step1:'ถุงละ 6',step2:'8 ถุง',step3:'8×6=48'},
{type:'plan',prompt:'แจก 24 ลูก 6 คนเท่ากัน สมการ',context:'24÷6',choices:['24÷6','24−6'],answer:'24÷6=4',step1:'แบ่งเท่า=หาร',step2:'24÷6',step3:'=4/คน'},
{type:'plan',prompt:'ซื้อ 3 แพ็ก แพ็กละ 15 บาท',context:'3×15',choices:['3×15','3+15'],answer:'3×15=45',step1:'แพ็กละ 15',step2:'3 แพ็ก',step3:'45 บาท'},
{type:'compute',prompt:'ร้านขาย 45 ชิ้น เช้า 28 บ่าย 17 รวม?',context:'28+17',answer:'45',step1:'28+17',step2:'=45',step3:'45'},
{type:'compute',prompt:'มีเงิน 100 ซื้อ 37 เหลือ?',context:'100−37',answer:'63',step1:'100−37',step2:'=63',step3:'63 บาท'},
{type:'check',prompt:'7×8=54 ถูกไหม',context:'ตรวจ',choices:['ผิด','ถูก'],answer:'ผิด · 7×8=56',step1:'7×8',step2:'=56≠54',step3:'ผิด'},
{type:'check',prompt:'48÷6=8 ตรวจ',context:'คูณย้อน',choices:['ถูก','ผิด'],answer:'ถูก · 6×8=48',step1:'6×8=48',step2:'ตรง',step3:'ถูก'},
{type:'read',prompt:'ย طย 40 km ไป 15 km เหลือ?',context:'40−15',choices:['25 km','55 km'],answer:'25 km',step1:'40−15',step2:'=25',step3:'25 km'},
{type:'plan',prompt:'เรียน 5 วัน วันละ 2 ชม. รวม?',context:'5×2',choices:['10 ชม.','7 ชม.'],answer:'10 ชม.',step1:'5×2',step2:'=10',step3:'10 ชม.'},
{type:'compute',prompt:'หนังสือ 3 เล่ม 125,98,77 บาท รวม',context:'125+98+77',answer:'300',step1:'125+98=223',step2:'223+77=300',step3:'300'},
{type:'check',prompt:'โจทย์: มี 50 แจก 12 เหลือ 38 — ตรวจ',context:'50−12',choices:['ถูก','ผิด'],answer:'ถูก · 50−12=38',step1:'50−12',step2:'=38',step3:'ถูก'}
];
window.WORKSHEET_CONFIG={icon:'📝',title:'ใบงานโจทย์ปัญหา Hub',subject:'คณิตศาสตร์',gradeLabel:'ป.4–6',mediaLabel:'โจทย์ปัญหา Hub',sourceMediaUrl:'/games/math/math-word-problem-hub/index.html',indicators:['ค 1.2 ป.4/1','ค 1.2 ป.5/1'],directions:'อ่านโจทย์ วางแผน คำนวณ และตรวจคำตอบ',getItems(t){return t==='mixed'?WP_ITEMS:WP_ITEMS.filter(i=>i.type===t);},${CALC_CFG}};`,
    }),
  },
  {
    out: 'public/games/social/thailand-hub-worksheet.html',
    html: shell({ icon: '🇹🇭', title: 'ใบงานประเทศไทย Hub', sourceMedia: '/games/social/social-thailand-hub/index.html', indicators: ['ส 5.1 ป.4/1', 'ส 4.3 ป.4/1', 'ส 2.1 ป.4/1'], gradeOptions: [4, 5, 6],
      topics: [{ value: 'region', label: 'ภูมิภาค' }, { value: 'culture', label: 'วัฒนธรรม' }, { value: 'history', label: 'ประวัติศาสตร์' }, { value: 'citizen', label: 'พลเมือง' }],
      bodyScript: `const THAI_SOC_ITEMS=[
{type:'region',prompt:'ไทยแบ่งกี่ภูมิภาค',context:'ภูมิศาสตร์',choices:['4','6'],answer:'4 ภูมิภาค (เหนือ กลาง ตะวันออก ใต้)',step1:'4 ภูมิภาคหลัก',step2:'เหนือ·กลาง·อีสาน·ใต้',step3:'4'},
{type:'region',prompt:'ภาคใต้ลักษณะภูมิอากาศ',context:'ใต้',choices:['ฝนชุก ใกล้ทะเล','หนาวจัด'],answer:'ฝนชุก ใกล้ทะเล',step1:'ใกล้ทะเล',step2:'มรสุม',step3:'ฝนชุก'},
{type:'culture',prompt:'สongkran คืออะไร',context:'วัฒนธรรม',choices:['สงกรานต์/ปีใหม่ไทย','ลอยกระทง'],answer:'สงกรานต์ — ปีใหม่ไทย',step1:'เดือนเมษายน',step2:'รดน้ำดำหัว',step3:'สงกรานต์'},
{type:'culture',prompt:'รำไทยสะท้อนอะไร',context:'ศิลปะ',choices:['วัฒนธรรมไทย','กีฬา'],answer:'ศิลปะและวัฒนธรรมไทย',step1:'ท่วงท่า',step2:'เครื่องแต่งกาย',step3:'มรดกวัฒนธรรม'},
{type:'history',prompt:'สุโขทัยสำคัญอย่างไร',context:'ประวัติ',choices:['อาณาจักรแรกของไทย','เมืองใหม่'],answer:'อาณาจักรไทยโบราณสำคัญ',step1:'พ่อขุนรามคำแหง',step2:'อักษรไทย',step3:'รากเหง้า'},
{type:'history',prompt:'อยุธยาเป็นเมืองหลวงกี่ปี',context:'อยุธยา',choices:['417 ปี','100 ปี'],answer:'417 ปี (1351–1767)',step1:'1351–1767',step2:'417 ปี',step3:'417'},
{type:'citizen',prompt:'หน้าที่พลเมืองไทย',context:'พลเมือง',choices:['เคารพกฎหมาย รักชาติ','ไม่ต้องปฏิบัติกฎ'],answer:'เคารพกฎหมาย รักชาติ ศาสน์ กษัตริย์',step1:'กฎหมาย',step2:'ร่วมพัฒนาประเทศ',step3:'หน้าที่พลเมือง'},
{type:'citizen',prompt:'ทำไมต้องรักษาวัฒนธรรมท้องถิ่น',context:'วัฒนธรรม',choices:['อัตลักษณ์ชาติ','ไม่สำคัญ'],answer:'รักษาอัตลักษณ์และความหลากหลาย',step1:'วัฒนธรรม=ตัวตน',step2:'สืบทอด',step3:'อัตลักษณ์'},
{type:'region',prompt:'ภาคเหนือขึ้นชื่อเรื่อง',context:'เหนือ',choices:['ภูเขา อากาศเย็น','ทะเลทราย'],answer:'ภูเขา อากาศเย็น วัฒนธรรมล้านนา',step1:'ล้านนา',step2:'ภูเขา',step3:'เย็น'},
{type:'culture',prompt:'Wai หมายถึง',context:'ไหว้',choices:['ทักทาย/แสดงความเคารพ','ลา'],answer:'ทักทายและแสดงความเคารพ',step1:'มือไหว้',step2:'สุภาพ',step3:'ทักทายไทย'},
{type:'history',prompt:'รัฐธรรมนูญไทยฉบับแรก',context:'1932',choices:['2475','2443'],answer:'2475 (1932)',step1:'2475',step2:'เปลี่ยนแปลงการปกครอง',step3:'2475'},
{type:'citizen',prompt:'ยกตัวอย่างพฤติกรรมดีต่อชาติ',context:'พลเมือง',choices:['รักษาความสะอาด ช่วยสังคม','ทิ้งขยะ'],answer:'เช่น รักษาความสะอาด ช่วยชุมชน ตั้งใจเรียน',step1:'เลือกพฤติกรรมจริง',step2:'เชื่อมชาติ',step3:'ทำได้วันนี้'}
];
window.WORKSHEET_CONFIG={icon:'🇹🇭',title:'ใบงานประเทศไทย Hub',subject:'สังคมศึกษา',gradeLabel:'ป.4–6',mediaLabel:'ประเทศไทย Hub',sourceMediaUrl:'/games/social/social-thailand-hub/index.html',indicators:['ส 5.1 ป.4/1','ส 4.3 ป.4/1','ส 2.1 ป.4/1'],directions:'ภูมิภาค วัฒนธรรม ประวัติศาสตร์ และพลเมืองไทย',getItems(t){return t==='mixed'?THAI_SOC_ITEMS:THAI_SOC_ITEMS.filter(i=>i.type===t);},${REASON_CFG}};`,
    }),
  },
  {
    out: 'public/games/thai/grammar-hub-worksheet.html',
    html: shell({ icon: '📖', title: 'ใบงานไวยากรณ์ไทย Hub', sourceMedia: '/games/thai/thai-grammar-hub/index.html', indicators: ['ท 4.1 ป.4/2', 'ท 4.1 ป.5/1'], gradeOptions: [4, 5, 6],
      topics: [{ value: 'pos', label: 'ชนิดคำ' }, { value: 'sentence', label: 'ประโยค' }, { value: 'classifier', label: 'ลักษณนาม' }, { value: 'fix', label: 'แก้ประโยค' }],
      bodyScript: `const TG_ITEMS=[
{type:'pos',prompt:'"วิ่ง" เป็นคำชนิดใด',context:'วิ่ง',choices:['กริยา','นาม'],answer:'คำกริยา',step1:'แสดงการกระทำ',step2:'วิ่ง=กริยา',step3:'กริยา'},
{type:'pos',prompt:'"สวย" เป็นคำชนิดใด',context:'สวย',choices:['คุณศัพท์','กริยา'],answer:'คำคุณศัพท์',step1:'บอกลักษณะ',step2:'สวย=คุณศัพท์',step3:'คุณศัพท์'},
{type:'sentence',prompt:'ประโยค "นกบิน" มีกี่ส่วน',context:'นกบิน',choices:['ประธาน+กริยา','นาม+คุณศัพท์'],answer:'ประธาน(นก)+กริยา(บิน)',step1:'นก=ประธาน',step2:'บิน=กริยา',step3:'2 ส่วน'},
{type:'sentence',prompt:'"เด็กๆ เล่นสนุก" ประธานคือ',context:'เด็กๆ เล่นสนุก',choices:['เด็กๆ','เล่นสนุก'],answer:'เด็กๆ',step1:'ทำกริยา',step2:'เด็กๆ เล่น',step3:'เด็กๆ'},
{type:'classifier',prompt:'หนังสือ 1 ___',context:'ลักษณนาม',choices:['เล่ม','ตัว'],answer:'เล่ม',step1:'หนังสือ→เล่ม',step2:'1 เล่ม',step3:'เล่ม'},
{type:'classifier',prompt:'ช้าง 1 ___',context:'ลักษณนาม',choices:['เชือก/ตัว','เล่ม'],answer:'เชือก หรือ ตัว',step1:'ช้าง→เชือก/ตัว',step2:'1 เชือก',step3:'เชือก'},
{type:'fix',prompt:'แก้: "เขาไปโรงเรียนแล้วไป" ',context:'ซ้ำ',choices:['เขาไปโรงเรียนแล้ว','เขาไปไป'],answer:'เขาไปโรงเรียนแล้ว',step1:'ไปซ้ำ',step2:'ตัดไปท้าย',step3:'เขาไปโรงเรียนแล้ว'},
{type:'fix',prompt:'แก้: "ฉันชอบมากๆ มาก" ',context:'ซ้ำ',choices:['ฉันชอบมากๆ','ฉันชอบมาก มาก'],answer:'ฉันชอบมากๆ',step1:'มากซ้ำ',step2:'เหลือมากๆ',step3:'ฉันชอบมากๆ'},
{type:'pos',prompt:'"ความสุข" เป็นคำ',context:'ความสุข',choices:['นาม','กริยา'],answer:'คำนาม',step1:'สิ่ง/ความรู้สึก',step2:'นาม',step3:'คำนาม'},
{type:'sentence',prompt:'ประโยค "ฝนตก" กริยาคือ',context:'ฝนตก',choices:['ตก','ฝน'],answer:'ตก (ฝน=ประธาน)',step1:'ฝน=ประธาน',step2:'ตก=กริยา',step3:'ตก'},
{type:'classifier',prompt:'ดินสอ 1 ___',context:'ลักษณนาม',choices:['แท่ง','เล่ม'],answer:'แท่ง',step1:'ดินสอ→แท่ง',step2:'1 แท่ง',step3:'แท่ง'},
{type:'fix',prompt:'เติมคำ: "แมว ___ บนหลังคา"',context:'นอน/วิ่ง',choices:['นอน','สวย'],answer:'นอน (กริยา)',step1:'ต้องการกริยา',step2:'นอน',step3:'แมวนอนบนหลังคา'}
];
window.WORKSHEET_CONFIG={icon:'📖',title:'ใบงานไวยากรณ์ไทย Hub',subject:'ภาษาไทย',gradeLabel:'ป.4–6',mediaLabel:'ไวยากรณ์ Hub',sourceMediaUrl:'/games/thai/thai-grammar-hub/index.html',indicators:['ท 4.1 ป.4/2','ท 4.1 ป.5/1'],directions:'ชนิดคำ ประโยค ลักษณนาม และแก้ประโยค',getItems(t){return t==='mixed'?TG_ITEMS:TG_ITEMS.filter(i=>i.type===t);},${REASON_CFG}};`,
    }),
  },
  {
    out: 'public/games/thai/idiom-hub-worksheet.html',
    html: shell({ icon: '💬', title: 'ใบงานสำนวนไทย Hub', sourceMedia: '/games/thai/thai-idiom-hub/index.html', indicators: ['ท 4.1 ป.4/1', 'ท 4.1 ป.5/1'], gradeOptions: [4, 5, 6],
      topics: [{ value: 'meaning', label: 'ความหมาย' }, { value: 'use', label: 'ใช้ในประโยค' }, { value: 'match', label: 'จับคู่' }, { value: 'create', label: 'สร้างประโยค' }],
      bodyScript: `const IDM_ITEMS=[
{type:'meaning',prompt:'"ช้างเผือก" หมายถึง',context:'ช้างเผือก',choices:['ของหายาก/มีค่า','ช้างสีขาวจริง'],answer:'ของหายาก มีค่า หาได้ยาก',step1:'ไม่ใช่ช้างจริง',step2:'สำนวน',step3:'ของหายาก'},
{type:'meaning',prompt:'"น้ำท่วมปาก" หมายถึง',context:'น้ำท่วมปาก',choices:['ปากแข็ง ไม่พูด','น้ำเข้าปาก'],answer:'ปากแข็ง ไม่พูดความลับ',step1:'ไม่ใช่น้ำจริง',step2:'เก็บความลับ',step3:'ปากแข็ง'},
{type:'use',prompt:'ใช้ "มือทอง" ในประโยค',context:'มือทอง',choices:['เขามือทอง ทำงานเก่ง','เขามือทองเป็นทอง'],answer:'เขามือทอง ทำงานเก่ง',step1:'มือทอง=เก่ง',step2:'ไม่ใช่ทองจริง',step3:'ทำงานเก่ง'},
{type:'use',prompt:'"ใจแข็ง" ใช้เมื่อ',context:'ใจแข็ง',choices:['อดทน ไม่ยอมแพ้','หัวใจแข็ง'],answer:'อดทน ไม่ยอมแพ้',step1:'ไม่ใช่หัวใจแข็ง',step2:'อดทน',step3:'ไม่ยอมแพ้'},
{type:'match',prompt:'จับคู่: ปากหวาน = ?',context:'ปากหวาน',choices:['พูดจาดี','รสหวาน'],answer:'พูดจาดี ไพเราะ',step1:'ปากไม่มีรส',step2:'สำนวน',step3:'พูดดี'},
{type:'match',prompt:'"ตาไม่ดี" ในบริบทสายตา',context:'ตาไม่ดี',choices:['สายตาไม่ดี','ใจร้าย'],answer:'สายตาไม่ดี มองไม่ชัด',step1:'บริบทสายตา',step2:'ตรงตัว',step3:'มองไม่ชัด'},
{type:'create',prompt:'สร้างประโยคใช้ "น้ำใจดี"',context:'น้ำใจดี',choices:['ป้ามีน้ำใจดี ช่วยเพื่อนบ้าน','ป้าน้ำใจดีเป็นน้ำ'],answer:'ป้ามีน้ำใจดี ช่วยเพื่อนบ้าน',step1:'น้ำใจดี=ใจดี',step2:'ใส่บริบท',step3:'ประโยคสมบูรณ์'},
{type:'create',prompt:'สร้างประโยค "หูตาล่าไปทั่ว"',context:'หูตาล่า',choices:['เด็กหูตาล่าไปทั่ว อยากรู้ทุกอย่าง','หูตาเดิน'],answer:'เด็กหูตาล่าไปทั่ว อยากรู้ทุกอย่าง',step1:'อยากรู้',step2:'ไม่ใช่หูตาเดิน',step3:'อยากรู้ทุกอย่าง'},
{type:'meaning',prompt:'"กินลิ้นกินเสียง" หมายถึง',context:'กินลิ้น',choices:['อิจฉา','กินลิ้น'],answer:'อิจฉา เมื่อเห็นคนอื่นดี',step1:'ไม่กินลิ้นจริง',step2:'อิจฉา',step3:'ไม่พอใจ'},
{type:'use',prompt:'"มือทอง" กับ "มือเหล็ก" ต่างกัน',context:'เปรียบเทียบ',choices:['ทอง=เก่ง · เหล็ก=แข็งแรง','เหมือนกัน'],answer:'มือทอง=ทำงานเก่ง · มือเหล็ก=แข็งแรงอดทน',step1:'ทอง=ฝีมือ',step2:'เหล็ก=แข็ง',step3:'ต่างความหมาย'},
{type:'match',prompt:'"หัวใจทองคำ" = ?',context:'หัวใจทองคำ',choices:['ใจดี','หัวใจทอง'],answer:'ใจดี มีน้ำใจ',step1:'ไม่ใช่ทองจริง',step2:'อุปมา',step3:'ใจดี'},
{type:'meaning',prompt:'"ช้าๆ ได้พร้าเล่มงาม" สอน',context:'สำนวน',choices:['อดทนทำทีละน้อย','รีบร้อน'],answer:'อดทนทำทีละน้อย จะได้ผลดี',step1:'ช้าแต่ดี',step2:'อดทน',step3:'ทีละน้อย'}
];
window.WORKSHEET_CONFIG={icon:'💬',title:'ใบงานสำนวนไทย Hub',subject:'ภาษาไทย',gradeLabel:'ป.4–6',mediaLabel:'สำนวน Hub',sourceMediaUrl:'/games/thai/thai-idiom-hub/index.html',indicators:['ท 4.1 ป.4/1','ท 4.1 ป.5/1'],directions:'ความหมายสำนวน ใช้ในประโยค จับคู่ และสร้างประโยค',getItems(t){return t==='mixed'?IDM_ITEMS:IDM_ITEMS.filter(i=>i.type===t);},${REASON_CFG}};`,
    }),
  },
  {
    out: 'public/games/thai/literature-hub-worksheet.html',
    html: shell({ icon: '📚', title: 'ใบงานวรรณคดี Hub', sourceMedia: '/games/thai/thai-literature-hub/index.html', indicators: ['ท 5.1 ป.5/2'], gradeOptions: [4, 5, 6],
      topics: [{ value: 'genre', label: 'ประเภทวรรณคดี' }, { value: 'element', label: 'องค์ประกอบ' }, { value: 'analyze', label: 'วิเคราะห์' }, { value: 'reflect', label: 'สะท้อนใจ' }],
      bodyScript: `const LIT_ITEMS=[
{type:'genre',prompt:'นิทานสอนอะไร',context:'นิทาน',choices:['ข้อคิด/คติ','แค่ความสนุก'],answer:'ข้อคิด คติชีวิต คุณธรรม',step1:'นิทานมีข้อคิด',step2:'สอนคุณธรรม',step3:'ข้อคิด'},
{type:'genre',prompt:'กลอนสอนใจ vs กลอนแปด',context:'กลอน',choices:['สอนใจ=ข้อคิด · แปด=รูปแบบ','เหมือนกัน'],answer:'กลอนสอนใจเน้นข้อคิด · กลอนแปดเป็นรูปแบบ',step1:'สอนใจ=เนื้อหา',step2:'แปด=8 บท',step3:'ต่างกัน'},
{type:'element',prompt:'ตัวละครในเรื่องคือ',context:'องค์ประกอบ',choices:['ผู้กระทำในเรื่อง','ผู้เขียน'],answer:'ผู้กระทำ/มีบทบาทในเรื่อง',step1:'ไม่ใช่ผู้เขียน',step2:'มีบทบาท',step3:'ตัวละคร'},
{type:'element',prompt:'ฉากในเรื่องคือ',context:'ฉาก',choices:['สถานที่/เวลา','ตัวละคร'],answer:'สถานที่และเวลาเกิดเหตุการณ์',step1:'where/when',step2:'สถานที่',step3:'ฉาก'},
{type:'analyze',prompt:'เรื่อง "หมีกับนก" สอน',context:'นิทาน',choices:['ช่วยเหลือกัน','แข่งขัน'],answer:'ช่วยเหลือและให้อภัย',step1:'อ่านเหตุการณ์',step2:'ข้อคิด',step3:'ช่วยเหลือ'},
{type:'analyze',prompt:'จุดส climax คือ',context:'องค์ประกอบ',choices:['จุดสูงสุดของเรื่อง','จุดเริ่ม'],answer:'จุดที่ความตึงเครียดสูงสุด',step1:'ก่อนจบ',step2:'สูงสุด',step3:'climax'},
{type:'reflect',prompt:'อ่านนิทานแล้วได้อะไร',context:'สะท้อน',choices:['ข้อคิดนำไปใช้','แค่จำเรื่อง'],answer:'ข้อคิดนำไปใช้ในชีวิต',step1:'ไม่ใช่แค่สนุก',step2:'สะท้อน',step3:'นำไปใช้'},
{type:'reflect',prompt:'ทำไมต้องอ่านวรรณคดีไทย',context:'วรรณคดี',choices:['รักษามรดก ภาษา คุณธรรม','ไม่จำเป็น'],answer:'รักษามรดก ภาษา และคุณธรรม',step1:'มรดก',step2:'ภาษาไทย',step3:'คุณธรรม'},
{type:'genre',prompt:'โคลงสี่สอนอะไร',context:'โคลง',choices:['ข้อคิดสั้นกระชับ','เรื่องยาว'],answer:'ข้อคิดสั้นกระชับ',step1:'4 บรรทัด',step2:'ข้อคิด',step3:'กระชับ'},
{type:'element',prompt:'พล็อต คือ',context:'พล็อต',choices:['ลำดับเหตุการณ์','ตัวละคร'],answer:'ลำดับเหตุการณ์ในเรื่อง',step1:'เรื่องราว',step2:'ลำดับ',step3:'plot'},
{type:'analyze',prompt:'แยก: บทเริ่ม vs บทจบ',context:'โครงเรื่อง',choices:['เริ่ม=แนะนำ · จบ=สรุป/ข้อคิด','เหมือนกัน'],answer:'เริ่มแนะนำ · จบสรุป/ข้อคิด',step1:'เริ่ม=ตั้งฉาก',step2:'จบ=ปิดเรื่อง',step3:'ต่างหน้าที่'},
{type:'reflect',prompt:'เขียนข้อคิดจากนิทานที่อ่าน 1 ข้อ',context:'สะท้อน',choices:['เช่น ต้องซื่อสัตย์','เช่น ชอบ'],answer:'เช่น ต้องซื่อสัตย์ / ช่วยเพื่อน',step1:'เลือกเรื่อง',step2:'หาข้อคิด',step3:'เขียนเป็นประโยค'}
];
window.WORKSHEET_CONFIG={icon:'📚',title:'ใบงานวรรณคดี Hub',subject:'ภาษาไทย',gradeLabel:'ป.4–6',mediaLabel:'วรรณคดี Hub',sourceMediaUrl:'/games/thai/thai-literature-hub/index.html',indicators:['ท 5.1 ป.5/2'],directions:'ประเภทวรรณคดี องค์ประกอบ วิเคราะห์ และสะท้อนข้อคิด',getItems(t){return t==='mixed'?LIT_ITEMS:LIT_ITEMS.filter(i=>i.type===t);},${REASON_CFG}};`,
    }),
  },
  {
    out: 'public/games/thai/poetry-hub-worksheet.html',
    html: shell({ icon: '🎵', title: 'ใบงานบทกวี Hub', sourceMedia: '/games/thai/thai-poetry-hub/index.html', indicators: ['ท 5.1 ป.4/4', 'ท 4.1 ป.4/5'], gradeOptions: [4, 5, 6],
      topics: [{ value: 'form', label: 'รูปแบบกลอน' }, { value: 'rhyme', label: 'สัมผัส' }, { value: 'meaning', label: 'ความหมาย' }, { value: 'compose', label: 'แต่งกลอน' }],
      bodyScript: `const POETRY_ITEMS=[
{type:'form',prompt:'กลอนแปดมีกี่บท',context:'กลอนแปด',choices:['8','4'],answer:'8 บท',step1:'แปด=8',step2:'8 บท',step3:'8'},
{type:'form',prompt:'โคลงมีกี่บรรทัด',context:'โคลง',choices:['4','8'],answer:'4 บรรทัด',step1:'โคลงสั้น',step2:'4 บรรทัด',step3:'4'},
{type:'rhyme',prompt:'สัมผัสคือ',context:'สัมผัส',choices:['เสียงท้ายสลอง','ความหมายเหมือน'],answer:'เสียงท้ายคำสลองกัน',step1:'ฟังเสียงท้าย',step2:'สลอง',step3:'สัมผัส'},
{type:'rhyme',prompt:'คำว่า "ดอก" สัมผัส " ___ "',context:'ดอก',choices:['หมอก','ต้น'],answer:'หมอก (สัมผัส อก)',step1:'ท้าย อก',step2:'หมอก',step3:'สัมผัส'},
{type:'meaning',prompt:'กลอนสอนใจสอนอะไร',context:'กลอนสอนใจ',choices:['ข้อคิดชีวิต','เล่าเรื่องราว'],answer:'ข้อคิด คติชีวิต',step1:'สอนใจ',step2:'ข้อคิด',step3:'คติชีวิต'},
{type:'meaning',prompt:'อ่านบทกวีแล้วหาอารมณ์',context:'อารมณ์',choices:['เศร้า สนุก ชื่นชม ฯลฯ','มีแค่หนึ่ง'],answer:'เช่น เศร้า สนุก ชื่นชม ตามเนื้อหา',step1:'อ่านเนื้อหา',step2:'รู้สึก',step3:'อารมณ์'},
{type:'compose',prompt:'เติมคำสัมผัส: ฟ้า ___ ใส',context:'ฟ้า ___ ใส',choices:['สี','มืด'],answer:'สี (ฟ้าสีใส)',step1:'สัมผัสหรือความหมาย',step2:'สี',step3:'ฟ้าสีใส'},
{type:'compose',prompt:'แต่งโคลง 2 บรรทัดเกี่ยวกับธรรมชาติ',context:'แต่ง',choices:['เช่น ต้นไม้เขียว / ลมพัดเบา','เช่น กินข้าว'],answer:'เช่น ต้นไม้เขียว / ลมพัดเบา',step1:'เลือกธรรมชาติ',step2:'2 บรรทัด',step3:'ภาพธรรมชาติ'},
{type:'form',prompt:'กลอนสุภาพ vs กลอนแปด',context:'รูปแบบ',choices:['สุภาพ=4 วรรค · แปด=8 บท','เหมือนกัน'],answer:'สุภาพ 4 วรรค · แปด 8 บท',step1:'รูปแบบต่าง',step2:'นับวรรค/บท',step3:'ต่างกัน'},
{type:'rhyme',prompt:'ทำไมสัมผัสช่วยจำบทกวี',context:'สัมผัส',choices:['เสียงสลองจำง่าย','ไม่ช่วย'],answer:'เสียงสลองทำให้จำและไหลลื่น',step1:'จังหวะ',step2:'สลอง',step3:'จำง่าย'},
{type:'meaning',prompt:'คำอุปมาในบทกวีคือ',context:'อุปมา',choices:['เปรียบเทียบ','เล่าเหตุจริง'],answer:'เปรียบเทียบให้เห็นภาพ',step1:'ไม่ตรงตัว',step2:'เปรียบ',step3:'อุปมา'},
{type:'compose',prompt:'หาคำสัมผัสกับ "ใจ"',context:'ใจ',choices:['ไหว','มือ'],answer:'ไหว (ใจไหว)',step1:'ท้าย ใจ',step2:'ไหว',step3:'สัมผัส'}
];
window.WORKSHEET_CONFIG={icon:'🎵',title:'ใบงานบทกวี Hub',subject:'ภาษาไทย',gradeLabel:'ป.4–6',mediaLabel:'บทกวี Hub',sourceMediaUrl:'/games/thai/thai-poetry-hub/index.html',indicators:['ท 5.1 ป.4/4','ท 4.1 ป.4/5'],directions:'รูปแบบกลอน สัมผัส ความหมาย และแต่งกลอนสั้น',getItems(t){return t==='mixed'?POETRY_ITEMS:POETRY_ITEMS.filter(i=>i.type===t);},${REASON_CFG}};`,
    }),
  },
  {
    out: 'public/games/thai/punctuation-hub-worksheet.html',
    html: shell({ icon: '❗', title: 'ใบงานเครื่องหมายวรรคตอน Hub', sourceMedia: '/games/thai/thai-punctuation-hub/index.html', indicators: ['ท 4.1 ป.4/3', 'ท 4.1 ป.4/4'], gradeOptions: [4, 5, 6],
      topics: [{ value: 'mark', label: 'เครื่องหมาย' }, { value: 'fix', label: 'แก้วรรคตอน' }, { value: 'use', label: 'ใช้ถูกต้อง' }, { value: 'read', label: 'อ่านจังหวะ' }],
      bodyScript: `const PUNCT_ITEMS=[
{type:'mark',prompt:'จุด (.) ใช้เมื่อ',context:'.',choices:['จบประโยค','คำถาม'],answer:'จบประโยค',step1:'จบความ',step2:'.',step3:'จบประโยค'},
{type:'mark',prompt:'? ใช้เมื่อ',context:'?',choices:['ประโยคคำถาม','อ้างคำพูด'],answer:'ประโยคคำถาม',step1:'ถาม',step2:'?',step3:'คำถาม'},
{type:'mark',prompt:'! ใช้เมื่อ',context:'!',choices:['แสดงอารมณ์รุนแรง','จบเรื่อง'],answer:'แสดงอารมณ์รุนแรง/ตื่นเต้น',step1:'อารมณ์',step2:'!',step3:'ตื่นเต้น/สั่ง'},
{type:'mark',prompt:'"  " ใช้เมื่อ',context:'อัญประกาศ',choices:['อ้างคำพูด','จบประโยค'],answer:'อ้างคำพูดโดยตรง',step1:'พูด',step2:'" "',step3:'อ้างคำพูด'},
{type:'fix',prompt:'แก้: "วันนี้อากาศดี"',context:'ขาดจุด',choices:['วันนี้อากาศดี.','วันนี้อากาศดี?'],answer:'วันนี้อากาศดี.',step1:'จบประโยค',step2:'.',step3:'วันนี้อากาศดี.'},
{type:'fix',prompt:'แก้: "คุณชื่ออะไร"',context:'คำถาม',choices:['คุณชื่ออะไร?','คุณชื่ออะไร.'],answer:'คุณชื่ออะไร?',step1:'ถาม',step2:'?',step3:'คุณชื่ออะไร?'},
{type:'use',prompt:'( ) ใช้เมื่อ',context:'วงเล็บ',choices:['ข้อความเสริม/อธิบาย','จบประโยค'],answer:'ข้อความเสริมหรืออธิบาย',step1:'เสริม',step2:'( )',step3:'อธิบาย'},
{type:'use',prompt:'เครื่องหมายคั่น (,) ใช้เมื่อ',context:'comma',choices:['คั่นส่วน/พัก','จบประโยค'],answer:'คั่นส่วนหรือพัก',step1:'ไม่จบประโยค',step2:',',step3:'คั่น/พัก'},
{type:'read',prompt:'"ไปโรงเรียน. แล้วกลับบ้าน." กี่ประโยค',context:'2 ประโยค',choices:['2','1'],answer:'2 ประโยค',step1:'. จบประโยคแรก',step2:'ประโยคสอง',step3:'2'},
{type:'read',prompt:'"ช่วยด้วย!" อารมณ์',context:'!',choices:['ตกใจ/ขอความช่วยเหลือ','ถาม'],answer:'ตกใจ/ขอความช่วยเหลือ',step1:'!',step2:'อารมณ์รุน',step3:'ขอความช่วย'},
{type:'fix',prompt:'แก้: ครูพูดว่า "ตั้งใจเรียน"',context:'อัญประกาศ',choices:['ครูพูดว่า "ตั้งใจเรียน"','ครูพูดว่า ตั้งใจเรียน.'],answer:'ครูพูดว่า "ตั้งใจเรียน"',step1:'อ้างคำพูด',step2:'" "',step3:'มีอัญประกาศ'},
{type:'use',prompt:'... ใช้เมื่อ',context:'จุดไข่ปลา',choices:['ข้อความค้าง/ไม่จบ','จบสนุก'],answer:'ข้อความค้างหรือไม่จบ',step1:'ค้าง',step2:'...',step3:'ไม่จบ/ค้าง'}
];
window.WORKSHEET_CONFIG={icon:'❗',title:'ใบงานเครื่องหมายวรรคตอน Hub',subject:'ภาษาไทย',gradeLabel:'ป.4–6',mediaLabel:'วรรคตอน Hub',sourceMediaUrl:'/games/thai/thai-punctuation-hub/index.html',indicators:['ท 4.1 ป.4/3','ท 4.1 ป.4/4'],directions:'เครื่องหมายวรรคตอน แก้ไข ใช้ถูกต้อง และอ่านจังหวะ',getItems(t){return t==='mixed'?PUNCT_ITEMS:PUNCT_ITEMS.filter(i=>i.type===t);},${REASON_CFG}};`,
    }),
  },
  {
    out: 'public/games/thai/reading-hub-worksheet.html',
    html: shell({ icon: '📖', title: 'ใบงานการอ่าน Hub', sourceMedia: '/games/thai/thai-reading-hub/index.html', indicators: ['ท 1.1 ป.5/2', 'ท 1.1 ป.5/3'], gradeOptions: [4, 5, 6],
      topics: [{ value: 'main', label: 'ใจความสำคัญ' }, { value: 'detail', label: 'รายละเอียด' }, { value: 'infer', label: 'อนุมาน' }, { value: 'vocab', label: 'คำศัพท์' }],
      bodyScript: `const READ_ITEMS=[
{type:'main',prompt:'ใจความสำคัญของเรื่อง "เด็กช่วยคุณยาย"' ,context:'ช่วยคุณยาย',choices:['มีน้ำใจช่วยผู้อื่น','เล่นสนุก'],answer:'มีน้ำใจช่วยผู้อื่น',step1:'เหตุการณ์หลัก',step2:'ช่วยคุณยาย',step3:'มีน้ำใจ'},
{type:'main',prompt:'ข่าว: "โรงเรียนเปิดเทอม" ใจความ',context:'ข่าว',choices:['แจ้งวันเปิดเทอม','เล่านิทาน'],answer:'แจ้งข้อมูลวันเปิดเทอม',step1:'ข่าว=แจ้งข้อมูล',step2:'เปิดเทอม',step3:'แจ้งวัน'},
{type:'detail',prompt:'"ฝนตกหนัก" รายละเอียดอะไร',context:'ฝนตกหนัก',choices:['ปริมาณฝนมาก','อากาศร้อน'],answer:'ฝนตกมาก/หนัก',step1:'หนัก=มาก',step2:'ฝน',step3:'ฝนตกมาก'},
{type:'detail',prompt:'หาข้อมูลจากข้อความ: "นก 3 ตัว บนต้นมะม่วง"',context:'3 ตัว',choices:['3 ตัว','มะม่วง'],answer:'นก 3 ตัว บนต้นมะม่วง',step1:'3 ตัว',step2:'มะม่วง',step3:'ครบทั้งสอง'},
{type:'infer',prompt:'"เขายิ้มเมื่อได้รับรางวัล" เขารู้สึก',context:'ยิ้ม+รางวัล',choices:['ดีใจ','เศร้า'],answer:'ดีใจ/ภูมิใจ',step1:'ยิ้ม=positive',step2:'รางวัล',step3:'ดีใจ'},
{type:'infer',prompt:'"ท้องฟ้ามืดครึ้ม" อาจเกิด',context:'มืดครึ้ม',choices:['ฝนจะตก','แดดจัด'],answer:'ฝนจะตก/พายุ',step1:'มืดครึ้ม',step2:'สัญญาณฝน',step3:'ฝน'},
{type:'vocab',prompt:'"ร่มเย็น" หมายถึง',context:'ร่มเย็น',choices:['เย็นสบาย มีร่ม','ร้อน'],answer:'เย็นสบาย มีร่มเงา',step1:'ร่ม=มีเงา',step2:'เย็น',step3:'เย็นสบาย'},
{type:'vocab',prompt:'"ตื่นเต้น" ใกล้เคียง',context:'ตื่นเต้น',choices:['ดีใจ/ระทึก','เศร้า'],answer:'ดีใจ ระทึก ใจสั่น',step1:'อารมณ์บวก/ระทึก',step2:'ไม่ใช่เศร้า',step3:'ดีใจ/ระทึก'},
{type:'main',prompt:'บทความสอน "ประหยัดน้ำ" ใจความ',context:'ประหยัดน้ำ',choices:['ใช้น้ำอย่างประหยัด','ใช้น้ำมาก'],answer:'ใช้น้ำอย่างประหยัด',step1:'หัวข้อ',step2:'ประหยัด',step3:'ใช้น้อยลง'},
{type:'detail',prompt:'"เช้า 6 โมง" บอก',context:'เวลา',choices:['เวลา','สถานที่'],answer:'เวลา (6:00)',step1:'6 โมง',step2:'เวลา',step3:'6:00'},
{type:'infer',prompt:'"เธอร้องไห้" อาจเพราะ',context:'ร้องไห้',choices:['เสียใจ/เจ็บปวด','ดีใจมาก'],answer:'เสียใจ เจ็บปวด หรือโกรธ',step1:'ร้องไห้=negative',step2:'อนุมาน',step3:'เสียใจ'},
{type:'vocab',prompt:'สรุปวิธีหาใจความสำคัญ',context:'วิธี',choices:['ถามว่าเรื่องเกี่ยวกับอะไร','อ่านประโยคแรกอย่างเดียว'],answer:'ถามว่าเรื่อง/ย่อหน้าเกี่ยวกับอะไร หาประเด็นหลัก',step1:'อ่านทั้งหมด',step2:'หาประเด็น',step3:'ใจความสำคัญ'}
];
window.WORKSHEET_CONFIG={icon:'📖',title:'ใบงานการอ่าน Hub',subject:'ภาษาไทย',gradeLabel:'ป.4–6',mediaLabel:'การอ่าน Hub',sourceMediaUrl:'/games/thai/thai-reading-hub/index.html',indicators:['ท 1.1 ป.5/2','ท 1.1 ป.5/3'],directions:'หาใจความสำคัญ รายละเอียด อนุมาน และคำศัพท์',getItems(t){return t==='mixed'?READ_ITEMS:READ_ITEMS.filter(i=>i.type===t);},${REASON_CFG}};`,
    }),
  },
  {
    out: 'public/games/thai/script-hub-worksheet.html',
    html: shell({ icon: '✍️', title: 'ใบงานอักษรไทย Hub', sourceMedia: '/games/thai/thai-script-hub/index.html', indicators: ['ท 4.1 ป.1/1', 'ท 4.1 ป.2/1'], gradeOptions: [1, 2, 3, 4],
      topics: [{ value: 'class', label: 'ชนิดพยัญชนะ' }, { value: 'vowel', label: 'สระ' }, { value: 'tone', label: 'วรรณยุกต์' }, { value: 'spell', label: 'สะกดคำ' }],
      bodyScript: `const SCRIPT_ITEMS=[
{type:'class',prompt:'พยัญชนะ ก อยู่กลุ่มใด',context:'ก',choices:['ก-ฮ','สระ'],answer:'พยัญชนะ ก-ฮ',step1:'ก=พยัญชนะ',step2:'44 ตัว',step3:'ก-ฮ'},
{type:'class',prompt:'พยัญชนะควบกล้ำ เช่น กร',context:'กร',choices:['ก+ร ไม่มีสระ','ก+ร+สระ'],answer:'ก+ร ควบกล้ำ ไม่มีสระแทรก',step1:'2 พยัญชนะติด',step2:'ไม่มีสระ',step3:'ควบกล้ำ'},
{type:'vowel',prompt:'สระ -ะ ออกเสียง',context:'-ะ',choices:['สระอะ','สระอา'],answer:'สระอะ (สั้น)',step1:'-ะ สั้น',step2:'อะ',step3:'สระอะ'},
{type:'vowel',prompt:'สระ -า ออกเสียง',context:'-า',choices:['สระอา (ยาว)','สระอะ'],answer:'สระอา (ยาว)',step1:'-า ยาว',step2:'อา',step3:'สระอา'},
{type:'tone',prompt:'ไม้เอก ใช้เมื่อ',context:'่',choices:['เสียงสูง','เสียงต่ำ'],answer:'เสียงสูง (เอก)',step1:'ไม้เอก',step2:'สูง',step3:'เอก=สูง'},
{type:'tone',prompt:'ไม้โท ใช้เมื่อ',context:'้',choices:['เสียงต่ำ','เสียงสูง'],answer:'เสียงต่ำ (โท)',step1:'ไม้โท',step2:'ต่ำ',step3:'โท=ต่ำ'},
{type:'spell',prompt:'สะกด: /gai/ (ไก่)',context:'ไก่',choices:['ก+ไ+่','ก+า+่'],answer:'ก + ไ + ่ = ไก่',step1:'ก',step2:'สระไ- ไม้โท',step3:'ไก่'},
{type:'spell',prompt:'สะกด: /maa/ (มา)',context:'มา',choices:['ม+า','ม+ะ'],answer:'ม + า = มา',step1:'ม',step2:'-า',step3:'มา'},
{type:'class',prompt:'พยัญชนะต้น vs ท้าย',context:'ร ต้น/ท้าย',choices:['ร ต้น=รหัน · ท้าย=ร ล',answer:'ร ต้นคำ=รหัน · ท้าย=ร ล',step1:'ตำแหน่ง',step2:'รหัน vs ร ล',step3:'ต่างเสียง'},
{type:'vowel',prompt:'สระเอีย ตัวอย่าง',context:'เ-ีย',choices:['เกีย','กา'],answer:'เกีย (เ+ี+ย)',step1:'เ-ีย',step2:'เกีย',step3:'สระเอีย'},
{type:'tone',prompt:'คำว่า "ไหม" (คำถาม) วรรณยุกต์',context:'ไหม?',choices:['ไม้ขึ้น','ไม้โท'],answer:'ไม้ขึ้น (หม)',step1:'คำถาม',step2:'ไม้ขึ้น',step3:'ไหม'},
{type:'spell',prompt:'แยกพยางค์: นักเรียน',context:'นักเรียน',choices:['นัก·เรียน','นั·กเร·ียน'],answer:'นัก · เรียน (2 พยางค์)',step1:'นัก',step2:'เรียน',step3:'2 พยางค์'}
];
window.WORKSHEET_CONFIG={icon:'✍️',title:'ใบงานอักษรไทย Hub',subject:'ภาษาไทย',gradeLabel:'ป.1–4',mediaLabel:'อักษรไทย Hub',sourceMediaUrl:'/games/thai/thai-script-hub/index.html',indicators:['ท 4.1 ป.1/1','ท 4.1 ป.2/1'],directions:'พยัญชนะ สระ วรรณยุกต์ และการสะกดคำ',getItems(t){return t==='mixed'?SCRIPT_ITEMS:SCRIPT_ITEMS.filter(i=>i.type===t);},${REASON_CFG}};`,
    }),
  },
  {
    out: 'public/games/thai/sentence-hub-worksheet.html',
    html: shell({ icon: '📝', title: 'ใบงานประโยคไทย Hub', sourceMedia: '/games/thai/thai-sentence-hub/index.html', indicators: ['ท 4.1 ป.5/2'], gradeOptions: [4, 5, 6],
      topics: [{ value: 'type', label: 'ชนิดประโยค' }, { value: 'part', label: 'ส่วนประโยค' }, { value: 'expand', label: 'ขยายประโยค' }, { value: 'combine', label: 'รวมประโยค' }],
      bodyScript: `const SENT_ITEMS=[
{type:'type',prompt:'"วันนี้อากาศดี" ประโยคประเภท',context:'บอกเล่า',choices:['บอกเล่า','คำถาม'],answer:'ประโยคบอกเล่า',step1:'ไม่ถาม',step2:'บอกข้อมูล',step3:'บอกเล่า'},
{type:'type',prompt:'"คุณชื่ออะไร" ประเภท',context:'?',choices:['คำถาม','คำสั่ง'],answer:'ประโยคคำถาม',step1:'ถาม',step2:'?',step3:'คำถาม'},
{type:'type',prompt:'"ตั้งใจเรียน" ประเภท',context:'สั่ง',choices:['คำสั่ง/แนะนำ','บอกเล่า'],answer:'ประโยคคำสั่ง/แนะนำ',step1:'ชักชวน/สั่ง',step2:'ตั้งใจเรียน',step3:'คำสั่ง'},
{type:'part',prompt:'"เด็กๆ เล่นฟุตบอล" ประธาน',context:'เด็กๆ',choices:['เด็กๆ','เล่นฟุตบอล'],answer:'เด็กๆ',step1:'ทำกริยา',step2:'เด็กๆ เล่น',step3:'เด็กๆ'},
{type:'part',prompt:'"แมวนอนบนหลังคา" กริยา',context:'นอน',choices:['นอน','แมว'],answer:'นอน',step1:'แมว=ประธาน',step2:'นอน=กริยา',step3:'นอน'},
{type:'expand',prompt:'ขยาย: "ฝนตก"',context:'ขยาย',choices:['เช้านี้ฝนตกหนักมาก','ฝนตกแล้วฝนตก'],answer:'เช้านี้ฝนตกหนักมาก',step1:'เติมเวลา',step2:'เติมคำขยาย',step3:'ประโยคสมบูรณ์'},
{type:'expand',prompt:'ขยาย: "นกบิน"',context:'ขยาย',choices:['นกสีฟ้าบินบนท้องฟ้า','นกบินบิน'],answer:'นกสีฟ้าบินบนท้องฟ้า',step1:'เติมคำนาม',step2:'เติมสถานที่',step3:'สมบูรณ์'},
{type:'combine',prompt:'รวม: "ฝนตก" + "ฉันไม่ไป"',context:'เพราะ',choices:['เพราะฝนตก ฉันจึงไม่ไป','ฝนตก ฉันไม่ไป'],answer:'เพราะฝนตก ฉันจึงไม่ไป',step1:'เหตุ–ผล',step2:'เพราะ...จึง',step3:'เชื่อม'},
{type:'combine',prompt:'รวม: "เรียนหนังสือ" + "ฟังเพลง"',context:'และ',choices:['เรียนหนังสือและฟังเพลง','เรียนหนังสือฟังเพลง'],answer:'เรียนหนังสือและฟังเพลง',step1:'ทำทั้งสอง',step2:'และ',step3:'เชื่อมด้วยและ'},
{type:'type',prompt:'"อย่าวิ่งในห้อง" ประเภท',context:'ห้าม',choices:['คำสั่ง/ห้าม','คำถาม'],answer:'ประโยคคำสั่ง/ห้าม',step1:'อย่า=ห้าม',step2:'สั่ง',step3:'คำสั่ง'},
{type:'part',prompt:'"ครูสอนหนังสือ" กรรม',context:'หนังสือ',choices:['หนังสือ','ครู'],answer:'หนังสือ (สอนอะไร)',step1:'สอน+กรรม',step2:'หนังสือ',step3:'กรรม'},
{type:'expand',prompt:'แยกประโยคยาว: "เช้านี้ฉันไปโรงเรียน"',context:'ส่วน',choices:['เวลา+ประธาน+กริยา+สถานที่','ประโยคเดียวไม่แยก'],answer:'เช้านี้(เวลา) ฉัน(ประธาน) ไป(กริยา) โรงเรียน(สถานที่)',step1:'เช้านี้',step2:'ฉันไป',step3:'โรงเรียน'}
];
window.WORKSHEET_CONFIG={icon:'📝',title:'ใบงานประโยคไทย Hub',subject:'ภาษาไทย',gradeLabel:'ป.4–6',mediaLabel:'ประโยค Hub',sourceMediaUrl:'/games/thai/thai-sentence-hub/index.html',indicators:['ท 4.1 ป.5/2'],directions:'ชนิดประโยค ส่วนประโยค ขยาย และรวมประโยค',getItems(t){return t==='mixed'?SENT_ITEMS:SENT_ITEMS.filter(i=>i.type===t);},${REASON_CFG}};`,
    }),
  },
  {
    out: 'public/games/thai/writing-hub-worksheet.html',
    html: shell({ icon: '✏️', title: 'ใบงานการเขียน Hub', sourceMedia: '/games/thai/thai-writing-hub/index.html', indicators: ['ท 2.1 ป.4/1', 'ท 4.1 ป.5/3'], gradeOptions: [4, 5, 6],
      topics: [{ value: 'plan', label: 'วางแผนเขียน' }, { value: 'paragraph', label: 'ย่อหน้า' }, { value: 'revise', label: 'แก้ไข' }, { value: 'style', label: 'สำนวน' }],
      bodyScript: `const WRITE_ITEMS=[
{type:'plan',prompt:'เขียนเรื่อง "วันหยุด" วางแผน 3 ส่วน',context:'วันหยุด',choices:['เริ่ม–เหตุการณ์–จบ','เขียนอย่างเดียว'],answer:'เริ่ม(แนะนำ) → เหตุการณ์ → จบ(สรุป)',step1:'เริ่ม=แนะนำ',step2:'กลาง=เหตุการณ์',step3:'จบ=สรุป'},
{type:'plan',prompt:'ก่อนเขียน ควรทำอะไร',context:'ขั้นตอน',choices:[' brainstorm + โครงร่าง','เขียนเลย'],answer:'ระดมความคิด + ทำโครงร่าง',step1:'คิดหัวข้อ',step2:'โครงร่าง',step3:'แล้วเขียน'},
{type:'paragraph',prompt:'ย่อหน้าแรกควรมี',context:'ย่อหน้า 1',choices:['แนะนำหัวข้อ','สรุป'],answer:'แนะนำหัวข้อ/ดึงดูดผู้อ่าน',step1:'เริ่มเรื่อง',step2:'แนะนำ',step3:'หัวข้อ'},
{type:'paragraph',prompt:'ย่อหน้าสุดท้ายควร',context:'ย่อหน้าสุดท้าย',choices:['สรุป/ข้อคิด','เริ่มใหม่'],answer:'สรุปและ/หรือข้อคิด',step1:'ปิดเรื่อง',step2:'สรุป',step3:'ข้อคิด'},
{type:'revise',prompt:'แก้: "ฉันไปไปโรงเรียน"',context:'ซ้ำ',choices:['ฉันไปโรงเรียน','ฉันไปไป'],answer:'ฉันไปโรงเรียน',step1:'ไปซ้ำ',step2:'ตัด',step3:'ฉันไปโรงเรียน'},
{type:'revise',prompt:'แก้: "เขาชอบมากๆ มาก"',context:'ซ้ำ',choices:['เขาชอบมากๆ','เขาชอบมาก มาก'],answer:'เขาชอบมากๆ',step1:'มากซ้ำ',step2:'เหลือมากๆ',step3:'เขาชอบมากๆ'},
{type:'style',prompt:'การเขียนบรรยาย vs พรรณนา',context:'สำนวน',choices:['บรรยาย=เหตุการณ์ · พรรณนา=ภาพ','เหมือนกัน'],answer:'บรรยายเล่าเหตุการณ์ · พรรณนาวาดภาพ',step1:'บรรยาย=เกิดอะไร',step2:'พรรณนา=หน้าตา',step3:'ต่างกัน'},
{type:'style',prompt:'ใช้คำเชื่อม "จากนั้น" เมื่อ',context:'คำเชื่อม',choices:['ต่อเหตุการณ์ถัดไป','จบเรื่อง'],answer:'เชื่อมเหตุการณ์ถัดไป (ลำดับเวลา)',step1:'ลำดับ',step2:'จากนั้น',step3:'เหตุการณ์ถัด'},
{type:'plan',prompt:'เขียนจดหมายถึงครู ควรมี',context:'จดหมาย',choices:['คำขึ้นต้น เนื้อหา คำลงท้าย','แค่เนื้อหา'],answer:'คำขึ้นต้น + เนื้อหา + คำลงท้าย + ชื่อ',step1:'เรียนครู',step2:'เนื้อหา',step3:'ลงท้าย+ชื่อ'},
{type:'paragraph',prompt:'1 ย่อหน้าควรมีกี่ประโยค',context:'ย่อหน้า',choices:['3–5 ประโยค (เหมาะสม)','20 ประโยค'],answer:'ประมาณ 3–5 ประโยค เน้นประเด็นเดียว',step1:'1 ประเด็น',step2:'3–5',step3:'ไม่ยาวเกิน'},
{type:'revise',prompt:'ตรวจก่อนส่ง: ต้องดู',context:'ตรวจ',choices:['ตัวสะกด วรรคตอน ความสมบูรณ์','แค่อ่านครั้งเดียว'],answer:'ตัวสะกด · วรรคตอน · ความต่อเนื่อง · ความสมบูรณ์',step1:'สะกด',step2:'วรรคตอน',step3:'สมบูรณ์'},
{type:'style',prompt:'เขียนให้สุภาพ ใช้',context:'สุภาพ',choices:['ครับ/ค่ะ คำสุภาพ','คำหยาบ'],answer:'ครับ/ค่ะ และคำสุภาพ',step1:'สุภาพ',step2:'ครับ/ค่ะ',step3:'เหมาะสม'}
];
window.WORKSHEET_CONFIG={icon:'✏️',title:'ใบงานการเขียน Hub',subject:'ภาษาไทย',gradeLabel:'ป.4–6',mediaLabel:'การเขียน Hub',sourceMediaUrl:'/games/thai/thai-writing-hub/index.html',indicators:['ท 2.1 ป.4/1','ท 4.1 ป.5/3'],directions:'วางแผนเขียน ย่อหน้า แก้ไข และสำนวน',getItems(t){return t==='mixed'?WRITE_ITEMS:WRITE_ITEMS.filter(i=>i.type===t);},${REASON_CFG}};`,
    }),
  },
);

for (const ws of worksheets) {
  const target = path.join(repoRoot, ws.out);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, ws.html, 'utf8');
  console.log('Wrote', ws.out);
}
console.log(`Generated ${worksheets.length} remaining paired worksheets.`);
