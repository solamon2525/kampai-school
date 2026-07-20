#!/usr/bin/env node
/**
 * Batch 4 — ใบงานคู่สื่อละเอียด (5 เรื่อง ตาม WORKSHEET.md §8)
 * หลักการ: ดึงสถานการณ์จากสื่อจริง · 16 ข้อ/ใบ · scaffold 3 บรรทัด · เฉลยครูลงเหตุผลทีละขั้น
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
  return `<!DOCTYPE html><html lang="th"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="worksheet-source-media" content="${sourceMedia}"><meta name="curriculum-indicators" content="${indicators.join(', ')}"><title>${title} ป.4–6 — โรงเรียนบ้านคำไผ่</title><link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&display=swap" rel="stylesheet"><link href="/games/worksheet-topic.css?v=${VER}" rel="stylesheet"><link href="/games/worksheet-modes.css?v=${VER}" rel="stylesheet"></head><body>
<header class="toolbar"><h1>${icon} ${title}</h1><div class="toolbar-ctrls"><select class="t-select" id="selStyle" aria-label="รูปแบบใบงาน"><option value="standard">มาตรฐาน</option><option value="progressive">บันไดระดับ</option><option value="booklet">รวมเล่ม</option></select><select class="t-select" id="selPageCount" aria-label="จำนวนหน้า"><option value="1">1 หน้า</option><option value="2">2 หน้า</option><option value="3">3 หน้า</option></select><select class="t-select" id="selGrade" aria-label="ระดับชั้น">${gradeOpts}</select><select class="t-select" id="selTopic" aria-label="ทักษะ"><option value="mixed">ผสมทุกทักษะ</option>${topicOpts}</select><select class="t-select" id="selCount" aria-label="จำนวนข้อ"><option value="10">10 ข้อ</option><option value="5">5 ข้อ</option></select><input class="t-input" id="inpSchool" value="โรงเรียนบ้านคำไผ่" aria-label="ชื่อโรงเรียน"><select class="t-select" id="selTeacher" aria-label="ครูผู้สอน"><option value="">-- เลือกครูผู้สอน --</option></select><button class="btn primary" id="btnRandom">🎲 สุ่มใหม่</button><button class="btn" id="btnAnswers">👁 เฉลยครู</button><button class="btn green" id="btnPrint">🖨 พิมพ์ A4</button></div></header><main class="pages" id="pages"><section class="sheet"><div class="questions"><article class="q">กำลังสร้างใบงาน</article></div></section></main>
<script src="/games/worksheet-runtime.js?v=${VER}"></script><script>
${bodyScript}
${FOOTER}`;
}

const worksheets = [
  // ── 1 พลเมืองดี ──────────────────────────────────────────
  {
    out: 'public/games/social/good-citizen-worksheet.html',
    html: shell({
      icon: '🤝',
      title: 'ใบงานพลเมืองดี',
      sourceMedia: '/games/social/good-citizen-media.html',
      indicators: ['ส 2.1 ป.4/1', 'ส 2.1 ป.4/2'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'trait', label: 'คุณลักษณะพลเมืองดี' },
        { value: 'decide', label: 'ตัดสินใจจากสถานการณ์' },
        { value: 'reason', label: 'ให้เหตุผล' },
        { value: 'apply', label: 'นำไปใช้ที่โรงเรียน' },
      ],
      bodyScript: `const CITIZEN_ITEMS=[
 {type:'trait',prompt:'คุณลักษณะ “เคารพกฎระเบียบ” หมายถึงอะไร',focus:'เคารพกฎ',choices:['ปฏิบัติตามกฎหมาย/กฎโรงเรียน','ทำตามใจตัวเอง','เลี่ยงงานบ้าน'],answer:'ปฏิบัติตามกฎหมาย กฎโรงเรียน และสัญญาณสาธารณะ',step1:'ดูคำสำคัญ: กฎ = ข้อที่ต้องปฏิบัติร่วมกัน',step2:'พลเมืองดีไม่ฝ่าฝืนเพื่อความสะดวกชั่วคราว',step3:'ตัวอย่าง: รอไฟเขียวแม้ไม่มีรถ'},
 {type:'trait',prompt:'คุณลักษณะ “มีน้ำใจ” แสดงออกอย่างไร',focus:'มีน้ำใจ',choices:['ช่วยเหลือ แบ่งปัน ไม่รังแก','เก็บของตัวเองอย่างเดียว','แกล้งเพื่อนเล่น'],answer:'ช่วยเหลือผู้อื่น แบ่งปัน และไม่รังแกเพื่อน',step1:'น้ำใจ = ใส่ใจผู้อื่นโดยไม่หวังผล',step2:'แยกจาก “ช่วยผิดวิธี” เช่น ให้ลอกการบ้าน',step3:'ตัวอย่าง: ช่วยคุณยายแบกของ'},
 {type:'trait',prompt:'“ซื่อสัตย์” ในโรงเรียนหมายถึงอะไร',focus:'ซื่อสัตย์',choices:['พูดความจริง ไม่โกง ไม่ขโมย','โกหกเพื่อไม่ให้เพื่อนเสียใจ','ลอกเพื่อนเพื่อได้คะแนน'],answer:'พูดความจริง ไม่โกงสอบ ไม่ขโมยของ',step1:'ซื่อสัตย์ = ไม่หลอกลวง',step2:'การให้ลอกทำให้ทั้งสองฝ่ายไม่ได้เรียนรู้',step3:'เลือกช่วยทบทวนแทนการให้ลอก'},
 {type:'trait',prompt:'“รักษาความสะอาด” รวมถึงอะไรบ้าง',focus:'สะอาด',choices:['ทิ้งขยะถูกที่ ดูแลของส่วนรวม','ทิ้งพื้นแล้วค่อยเก็บ','วาดเล่นบนกำแพง'],answer:'ทิ้งขยะถูกที่และดูแลทรัพย์สินสาธารณะ',step1:'สถานที่ส่วนรวมเป็นของทุกคน',step2:'ขยะบนพื้นทำลายความสะอาดและความปลอดภัย',step3:'เก็บไว้จนเจอถัง หรือแจ้งครูถ้าเห็นคนทำลาย'},
 {type:'decide',prompt:'เพื่อนขอให้ลอกการบ้าน คุณควรทำอย่างไร',focus:'การบ้าน',scene:'🏫 เพื่อนลืมทำการบ้าน',bad:'ให้ลอกทันที',good:'ปฏิเสธสุภาพและชวนทบทวน',answer:'ปฏิเสธอย่างสุภาพ แล้วชวนทบทวนด้วยกัน',step1:'ถาม: การให้ลอกช่วยให้เพื่อนเรียนหรือไม่?',step2:'ไม่ — เพื่อนไม่ได้คิดเอง และฉันไม่ซื่อสัตย์',step3:'ทางเลือกที่ดี: อธิบาย/ชวนทบทวนโดยไม่ให้ลอก'},
 {type:'decide',prompt:'ไฟแดงติด แต่ไม่มีรถ คุณจะทำอย่างไร',focus:'ไฟแดง',scene:'🚦 ทางม้าลาย',bad:'ข้ามเลย',good:'รอไฟเขียว',answer:'รอไฟเขียวก่อนข้าม',step1:'กฎจราจรมีไว้เพื่อความปลอดภัยของทุกคน',step2:'แม้ไม่มีรถก็อาจมีรถเลี้ยว/รถเร็วเข้ามา',step3:'เคารพสัญญาณ = คุณลักษณะพลเมืองดี'},
 {type:'decide',prompt:'กินขนมเสร็จ ถังขยะอยู่ไกล',focus:'ขยะ',scene:'🗑️ ลานโรงเรียน',bad:'ทิ้งพื้น',good:'เก็บไว้จนเจอถัง',answer:'เก็บขยะไว้กับตัวจนเจอถังขยะ',step1:'ทิ้งพื้นทำให้สกปรกและอาจเป็นอันตราย',step2:'พลเมืองดีรับผิดชอบของตัวเอง',step3:'พกไว้ในกระเป๋า/มือจนถึงถัง'},
 {type:'decide',prompt:'เห็นคุณยายแบกของหนัก',focus:'ผู้สูงอายุ',scene:'👴 หน้าโรงเรียน',bad:'เดินผ่าน',good:'เสนอช่วย',answer:'เสนอช่วยแบกของหรือพาไปหาที่นั่ง',step1:'ผู้สูงอายุอาจต้องการความช่วยเหลือ',step2:'มีน้ำใจ = เสนอช่วยโดยไม่รบกวนถ้าเขาปฏิเสธ',step3:'ถามสุภาพ: “ช่วยถือของให้นะคะ/ครับ”'},
 {type:'decide',prompt:'เพื่อนชวนเล่นเกมตอนครูสอน',focus:'ตั้งใจเรียน',scene:'📖 ในห้องเรียน',bad:'เล่นด้วย',good:'ปฏิเสธและฟังครู',answer:'ปฏิเสธและตั้งใจฟังครูสอน',step1:'เวลาเรียนเป็นเวลาของทุกคนในชั้น',step2:'เล่นเกมรบกวนเพื่อนและไม่เคารพครู',step3:'บอกเพื่อนว่าค่อยเล่นพัก/หลังเลิกเรียน'},
 {type:'decide',prompt:'เพื่อนวาดภาพเล่นบนกำแพงโรงเรียน',focus:'ทรัพย์สิน',scene:'🎨 กำแพงอาคาร',bad:'วาดด้วย',good:'ห้ามและแจ้งครู',answer:'ห้ามเพื่อนและแจ้งครู',step1:'กำแพงเป็นทรัพย์สินสาธารณะ',step2:'วาดเล่น = ทำลายของส่วนรวม',step3:'ห้ามอย่างสุภาพ + แจ้งครูเพื่อแก้ไข'},
 {type:'reason',prompt:'ทำไมการให้เพื่อนลอกจึงไม่ใช่การมีน้ำใจที่ถูกต้อง',focus:'เหตุผล',answer:'เพราะไม่ได้ช่วยให้เพื่อนเรียนรู้ และทำให้ทั้งคู่ไม่ซื่อสัตย์',step1:'น้ำใจที่ถูกต้องช่วยให้เขาเก่งขึ้น',step2:'การลอกได้คะแนนโดยไม่เข้าใจ',step3:'ทางเลือก: อธิบาย ชวนทบทวน ส่งงานของตัวเอง'},
 {type:'reason',prompt:'ทำไมต้องรอไฟแดงแม้ไม่มีรถ',focus:'เหตุผล',answer:'เพื่อความปลอดภัยและฝึกเคารพกฎร่วมกัน',step1:'กฎมีไว้ใช้ทุกสถานการณ์ ไม่ใช่เฉพาะตอนมีคนดู',step2:'นิสัยเคารพกฎสร้างสังคมปลอดภัย',step3:'เป็นแบบอย่างให้ผู้อื่น'},
 {type:'apply',prompt:'ยกตัวอย่างพฤติกรรมพลเมืองดีในห้องเรียน 1 ข้อ',focus:'ห้องเรียน',answer:'เช่น ตั้งใจเรียน ไม่ลอก ช่วยเพื่อนทบทวน เก็บขยะ',step1:'เลือกสถานการณ์ในห้องเรียน',step2:'เชื่อมกับคุณลักษณะ 1 ข้อ (ซื่อสัตย์/น้ำใจ/กฎ)',step3:'เขียนพฤติกรรมที่ทำได้จริงวันนี้'},
 {type:'apply',prompt:'ยกตัวอย่างพฤติกรรมพลเมืองดีในชุมชน 1 ข้อ',focus:'ชุมชน',answer:'เช่น ช่วยผู้สูงอายุ ทิ้งขยะถูกที่ ไม่ทำลายของส่วนรวม',step1:'คิดสถานที่: บ้าน ตลาด ถนน',step2:'เลือกคุณลักษณะที่ตรง',step3:'เขียนการกระทำที่สังเกต/ทำได้'},
 {type:'apply',prompt:'ถ้าเห็นเพื่อนทิ้งขยะลงพื้น ควรทำอย่างไรเป็นขั้น ๆ',focus:'แก้ปัญหา',answer:'เตือนสุภาพ → ชวนเก็บ → ถ้าไม่ฟังแจ้งครู',step1:'ขั้น 1: เตือนด้วยคำสุภาพ',step2:'ขั้น 2: ชวนเก็บด้วยกัน',step3:'ขั้น 3: ถ้ายังไม่แก้ไข แจ้งครู'},
 {type:'apply',prompt:'เขียนคำมั่นสัญญาพลเมืองดีของตนเอง 1 ข้อ',focus:'คำมั่น',answer:'เช่น “ฉันจะไม่ลอกและช่วยเพื่อนทบทวนสัปดาห์นี้”',step1:'เลือกคุณลักษณะที่อยากพัฒนา',step2:'เขียนพฤติกรรมที่วัดได้',step3:'ระบุเวลา/สถานที่ให้ชัด'}
];
window.WORKSHEET_CONFIG={icon:'🤝',title:'ใบงานพลเมืองดี',subject:'สังคมศึกษา',gradeLabel:'ป.4–6',mediaLabel:'พลเมืองดี',sourceMediaUrl:'/games/social/good-citizen-media.html',indicators:['ส 2.1 ป.4/1','ส 2.1 ป.4/2'],directions:'อ่านสถานการณ์ เลือกพฤติกรรมที่เหมาะสม แล้วเขียนเหตุผลเชื่อมกับคุณลักษณะพลเมืองดี',getItems(topic){return topic==='mixed'?CITIZEN_ITEMS:CITIZEN_ITEMS.filter(i=>i.type===topic);},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;let stem='<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div>';if(item.scene)stem+='<div class="q-context">'+e(item.scene)+'</div>';if(item.choices)stem+='<div class="classify-grid">'+item.choices.map(c=>'<div class="classify-box">'+e(c)+'</div>').join('')+'</div>';else if(item.bad)stem+='<div class="classify-grid"><div class="classify-box">ไม่เหมาะสม: '+e(item.bad)+'</div><div class="classify-box">เหมาะสม: '+e(item.good)+'</div></div>';stem+='<div>ลงวิธีคิด 3 ขั้น</div></div>';return stem+'<div class="q-work-block"><div class="reason-line"><span class="work-fill">'+e(item.step1)+'</span></div><div class="reason-line"><span class="work-fill">'+e(item.step2)+'</span></div><div class="reason-line"><span class="work-fill">'+e(item.step3)+'</span></div></div><div class="q-foot"><div class="answer-line">สรุป <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },

  // ── 2 ระบบย่อยอาหาร ─────────────────────────────────────
  {
    out: 'public/games/science/digestive-worksheet.html',
    html: shell({
      icon: '🍽️',
      title: 'ใบงานระบบย่อยอาหาร',
      sourceMedia: '/games/science/digestive-system-media.html',
      indicators: ['ว 1.2 ป.6/4', 'ว 1.2 ป.6/5', 'พ 1.1 ป.5/1'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'order', label: 'เรียงลำดับทางเดินอาหาร' },
        { value: 'function', label: 'หน้าที่อวัยวะ' },
        { value: 'compare', label: 'เปรียบเทียบส่วน' },
        { value: 'health', label: 'ดูแลสุขภาพ' },
      ],
      bodyScript: `const DIGEST_ITEMS=[
 {type:'order',prompt:'เรียงทางเดินอาหารให้ถูกต้อง',flow:['ปาก','หลอดอาหาร','กระเพาะ','ลำไส้'],answer:'ปาก → หลอดอาหาร → กระเพาะ → ลำไส้',step1:'เริ่มที่ปาก: เคี้ยวและเริ่มย่อย',step2:'ส่งต่อทางหลอดอาหารลงกระเพาะ',step3:'สุดท้ายลำไส้ดูดซึมและขับของเสีย'},
 {type:'order',prompt:'เติมขั้นที่หายไป: ปาก → ______ → กระเพาะ → ลำไส้',flow:['ปาก','?','กระเพาะ','ลำไส้'],answer:'หลอดอาหาร',step1:'อาหารจากปากต้องผ่านท่อลงกระเพาะ',step2:'ท่อนั้นคือหลอดอาหาร',step3:'ลำดับเต็ม: ปาก→หลอดอาหาร→กระเพาะ→ลำไส้'},
 {type:'order',prompt:'อาหารถึงกระเพาะแล้วขั้นถัดไปคืออะไร',flow:['กระเพาะ','?'],answer:'ลำไส้ (เล็กแล้วใหญ่)',step1:'กระเพาะย่อยโปรตีนจนเป็นแหลว',step2:'ส่งต่อไปลำไส้เล็กเพื่อดูดซึม',step3:'ลำไส้ใหญ่ดูดน้ำและเตรียมขับของเสีย'},
 {type:'order',prompt:'ทำไมลำดับปาก→กระเพาะโดยข้ามหลอดอาหารจึงผิด',flow:['ผิดลำดับ'],answer:'เพราะหลอดอาหารเป็นทางเชื่อมที่จำเป็น',step1:'อวัยวะแต่ละส่วนอยู่คนละตำแหน่ง',step2:'ต้องมีท่อส่งอาหาร',step3:'ข้ามขั้น = ทางเดินอาหารไม่ต่อเนื่อง'},
 {type:'function',prompt:'ปากมีหน้าที่อะไรในการย่อย',org:'ปาก',answer:'เคี้ยวให้เล็กลง และน้ำลายเริ่มย่อยแป้ง',step1:'ฟันช่วยบดอาหารทางกายภาพ',step2:'น้ำลายมีอะไมเลสเริ่มย่อยแป้ง',step3:'เคี้ยวละเอียดช่วยกระเพาะทำงานง่ายขึ้น'},
 {type:'function',prompt:'หลอดอาหารทำหน้าที่อะไร',org:'หลอดอาหาร',answer:'บีบรัดส่งอาหารจากปากลงกระเพาะ',step1:'เป็นท่อเชื่อมปากกับกระเพาะ',step2:'การกลืนเป็นรีเฟล็กซ์ส่งอาหารลง',step3:'อาหารไม่ควรเข้าหลอดลม'},
 {type:'function',prompt:'กระเพาะอาหารย่อยสารอาหารกลุ่มใดเป็นหลัก',org:'กระเพาะ',answer:'โปรตีน (ด้วยกรดและเอนไซม์)',step1:'กระเพาะมีกรดและเอนไซม์',step2:'โปรตีนถูกย่อยเป็นชิ้นเล็กลง',step3:'อาหารกลายเป็นแหลวคล้ายซุป'},
 {type:'function',prompt:'ลำไส้เล็กมีบทบาทสำคัญอย่างไร',org:'ลำไส้เล็ก',answer:'ดูดซึมสารอาหารเข้าสู่เลือด',step1:'สารอาหารที่ย่อยแล้วพร้อมดูดซึม',step2:'ผนังมีรากทอง (villi) เพิ่มพื้นที่',step3:'สารอาหารเข้าเลือดไปเลี้ยงเซลล์'},
 {type:'function',prompt:'ลำไส้ใหญ่ทำหน้าที่อะไร',org:'ลำไส้ใหญ่',answer:'ดูดซึมน้ำและขับของเสีย',step1:'หลังดูดซึมสารอาหารแล้วเหลือกาก',step2:'ดูดน้ำออกจากกากอาหาร',step3:'เตรียมของเสียเพื่อขับออก'},
 {type:'compare',prompt:'แยกความต่าง: การย่อยในปาก vs กระเพาะ',org:'เปรียบเทียบ',answer:'ปากเริ่มย่อยแป้ง+เคี้ยว · กระเพาะเน้นย่อยโปรตีนด้วยกรด',step1:'ปาก = กายภาพ + เริ่มย่อยแป้ง',step2:'กระเพาะ = กรด/เอนไซม์ย่อยโปรตีน',step3:'ต่างสารอาหารหลักที่ถูกย่อย'},
 {type:'compare',prompt:'ลำไส้เล็กกับลำไส้ใหญ่ต่างกันอย่างไร',org:'เปรียบเทียบ',answer:'เล็กดูดซึมสารอาหาร · ใหญ่ดูดน้ำและขับของเสีย',step1:'ทั้งคู่เป็นลำไส้แต่หน้าที่ต่าง',step2:'เล็ก = สารอาหารเข้าเลือด',step3:'ใหญ่ = น้ำ + ของเสีย'},
 {type:'compare',prompt:'ทำไมกระเพาะต้องมีผนังหนา',org:'กระเพาะ',answer:'เพื่อป้องกันตัวเองจากกรดที่ย่อยอาหาร',step1:'กรดในกระเพาะแรงมาก',step2:'ถ้าไม่มีผนังหนาจะทำลายตัวเอง',step3:'ผนังหนา = กลไกป้องกัน'},
 {type:'health',prompt:'ทำไมควรกินอาหารเคี้ยวให้ละเอียด',org:'สุขภาพ',answer:'ช่วยให้ย่อยง่ายและลดภาระกระเพาะ',step1:'ชิ้นเล็กย่อยได้เร็วกว่า',step2:'น้ำลายผสมดีขึ้น',step3:'กระเพาะทำงานน้อยลง ลดไม่สบายท้อง'},
 {type:'health',prompt:'ดื่มน้ำและกินใยอาหารช่วยระบบย่อยอย่างไร',org:'สุขภาพ',answer:'ช่วยการเคลื่อนไหวลำไส้และขับถ่าย',step1:'น้ำช่วยลำเลียงและดูดซึม',step2:'ใยอาหารเพิ่มกากที่ลำไส้ใหญ่ต้องการ',step3:'ลดท้องผูก'},
 {type:'health',prompt:'ถ้ารีบกลืนอาหารใหญ่ ๆ อาจเกิดปัญหาใด',org:'สุขภาพ',answer:'สำลัก/ย่อยยาก/ท้องอืด',step1:'ชิ้นใหญ่อาจติดหลอดอาหาร',step2:'กระเพาะย่อยช้า',step3:'นิสัยดี: เคี้ยวช้า ๆ นั่งกิน'},
 {type:'health',prompt:'เขียนแนวทางดูแลระบบย่อยของตนเอง 2 ข้อ',org:'แผน',answer:'เช่น เคี้ยวละเอียด กินผักผลไม้ ดื่มน้ำ พักผ่อน',step1:'เลือกพฤติกรรมที่ทำได้จริง',step2:'เชื่อมกับอวัยวะที่ได้รับประโยชน์',step3:'เขียนเป็นข้อปฏิบัติประจำวัน'}
];
window.WORKSHEET_CONFIG={icon:'🍽️',title:'ใบงานระบบย่อยอาหาร',subject:'วิทยาศาสตร์',gradeLabel:'ป.4–6',mediaLabel:'ระบบย่อยอาหาร',sourceMediaUrl:'/games/science/digestive-system-media.html',indicators:['ว 1.2 ป.6/4','ว 1.2 ป.6/5','พ 1.1 ป.5/1'],directions:'เรียงทางเดินอาหาร อธิบายหน้าที่อวัยวะ เปรียบเทียบส่วน และเชื่อมกับการดูแลสุขภาพ',getItems(topic){return topic==='mixed'?DIGEST_ITEMS:DIGEST_ITEMS.filter(i=>i.type===topic);},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;let stem='<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div>';if(item.flow)stem+='<div class="cycle-flow">'+item.flow.map((s,i)=>'<div class="cycle-step">'+e(s)+'</div>'+(i<item.flow.length-1?'<span class="cycle-arrow">→</span>':'')).join('')+'</div>';else stem+='<div class="q-context">โฟกัส: '+e(item.org)+'</div><div class="classify-grid"><div class="classify-box">ปาก</div><div class="classify-box">หลอดอาหาร</div><div class="classify-box">กระเพาะ</div><div class="classify-box">ลำไส้</div></div>';stem+='</div>';return stem+'<div class="q-work-block"><div class="reason-line"><span class="work-fill">'+e(item.step1)+'</span></div><div class="reason-line"><span class="work-fill">'+e(item.step2)+'</span></div><div class="reason-line"><span class="work-fill">'+e(item.step3)+'</span></div></div><div class="q-foot"><div class="answer-line">สรุป <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },

  // ── 3 ความหมายโดยนัย ────────────────────────────────────
  {
    out: 'public/games/thai/implied-meaning-worksheet.html',
    html: shell({
      icon: '🔍',
      title: 'ใบงานความหมายตรงตัวและโดยนัย',
      sourceMedia: '/games/thai/thai-implied-meaning-media.html',
      indicators: ['ท 1.1 ป.5/5'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'classify', label: 'จำแนกตรงตัว/โดยนัย' },
        { value: 'interpret', label: 'ตีความสำนวน' },
        { value: 'evidence', label: 'หาหลักฐานในประโยค' },
        { value: 'create', label: 'สร้างประโยค' },
      ],
      bodyScript: `const IMPLY_ITEMS=[
 {type:'classify',prompt:'จำแนก: “แมวสีขาวนอนบนเก้าอี้”',phrase:'แมวสีขาวนอนบนเก้าอี้',kind:'ตรงตัว',answer:'ความหมายตรงตัว',step1:'ถาม: เอาตามตัวอักษรได้เลยไหม?',step2:'ได้ — มีแมวสีขาวและเก้าอี้จริง',step3:'ไม่ต้องอุปมา → ตรงตัว'},
 {type:'classify',prompt:'จำแนก: “เขามีหัวใจทองคำ”',phrase:'เขามีหัวใจทองคำ',kind:'โดยนัย',answer:'ความหมายโดยนัย = ใจดี',step1:'หัวใจทองคำจริงไม่ได้',step2:'ต้องตีความเชิงอุปมา',step3:'หมายถึงใจดี มีน้ำใจ'},
 {type:'classify',prompt:'จำแนก: “ฝนตกหนักมาก”',phrase:'ฝนตกหนักมาก',kind:'ตรงตัว',answer:'ความหมายตรงตัว',step1:'บรรยายสภาพอากาศได้ตรง ๆ',step2:'ไม่ใช่สำนวนซ่อนความหมาย',step3:'ตรงตัว'},
 {type:'classify',prompt:'จำแนก: “ปากหวาน”',phrase:'ปากหวาน',kind:'โดยนัย',answer:'โดยนัย = พูดจาดี ไพเราะ',step1:'ปากไม่ได้มีรสถูกต้อง',step2:'เป็นสำนวน',step3:'หมายถึงพูดดี'},
 {type:'interpret',prompt:'ตีความ: “น้ำท่วมปาก”',phrase:'น้ำท่วมปาก',answer:'ปากแข็ง ไม่พูดความลับ',step1:'ไม่ใช่น้ำเข้าปากจริง',step2:'สำนวนเรื่องการเก็บความลับ',step3:'สรุป: ไม่พูดความลับ'},
 {type:'interpret',prompt:'ตีความ: “หูตาล่าไปทั่ว”',phrase:'หูตาล่าไปทั่ว',answer:'อยากรู้อยากเห็น สนใจทุกอย่าง',step1:'หูตาไม่ได้เดินเอง',step2:'หมายถึงอยากรู้ข่าว/เรื่องรอบตัว',step3:'สรุป: อยากรู้'},
 {type:'interpret',prompt:'ตีความ: “มือทอง”',phrase:'มือทอง',answer:'ทำงานเก่ง สร้างผลงานดี',step1:'มือไม่ได้ทำจากทอง',step2:'ชมว่าฝีมือดี',step3:'สรุป: เก่งงาน'},
 {type:'interpret',prompt:'ตีความ: “ใจแข็ง”',phrase:'ใจแข็ง',answer:'อดทน ไม่ยอมแพ้ง่าย',step1:'หัวใจไม่ได้แข็งเหมือนหิน',step2:'หมายถึงความอดทน/หนักแน่น',step3:'สรุป: อดทน'},
 {type:'interpret',prompt:'ตีความ: “กินลิ้นกินเสียง”',phrase:'กินลิ้นกินเสียง',answer:'อิจฉา เมื่อเห็นคนอื่นดีแล้วไม่พอใจ',step1:'ไม่ได้กินลิ้นจริง',step2:'สำนวนเรื่องความอิจฉา',step3:'สรุป: อิจฉา'},
 {type:'interpret',prompt:'ตีความ: “น้ำใจดี”',phrase:'น้ำใจดี',answer:'มีน้ำใจ ช่วยเหลือผู้อื่น',step1:'ไม่ใช่น้ำในใจ',step2:'ชมนิสัยช่วยเหลือ',step3:'สรุป: ใจดี ช่วยคน'},
 {type:'evidence',prompt:'ทำไม “หัวใจทองคำ” จึงเป็นโดยนัย ให้หลักฐาน',phrase:'หัวใจทองคำ',answer:'เพราะหัวใจไม่ได้ทำจากทอง ต้องตีความว่าใจดี',step1:'ตรวจความเป็นไปได้ตามตัวอักษร',step2:'เป็นไปไม่ได้ → มีความหมายซ่อน',step3:'หลักฐาน: ใช้คำเปรียบเทียบ “ทองคำ”'},
 {type:'evidence',prompt:'ทำไม “นกสีฟ้าบินบนท้องฟ้า” จึงตรงตัว',phrase:'นกสีฟ้าบินบนท้องฟ้า',answer:'เพราะอธิบายสิ่งที่เกิดได้จริงโดยไม่อุปมา',step1:'นกบินได้จริง',step2:'สีฟ้าเป็นลักษณะที่สังเกตได้',step3:'ไม่ต้องตีความเพิ่ม'},
 {type:'evidence',prompt:'แยก: “ตาไม่ดี” ในประโยค “ตาไม่ดี มองกระดานไม่ชัด”',phrase:'ตาไม่ดี',answer:'ตรงตัว = สายตาไม่ดี มองไม่ชัด',step1:'ดูบริบทหลังประโยค',step2:'“มองกระดานไม่ชัด” ชี้สายตา',step3:'สรุปเป็นตรงตัวในบริบทนี้'},
 {type:'create',prompt:'เขียนประโยคที่ใช้สำนวนโดยนัย “ปากหวาน”',phrase:'ปากหวาน',answer:'เช่น พี่สาวปากหวาน จึงมีเพื่อนมาก',step1:'เลือกสำนวน',step2:'ใส่ในประโยคที่มีบริบท',step3:'ตรวจว่าไม่ได้หมายรสถูกต้อง'},
 {type:'create',prompt:'เขียนประโยคความหมายตรงตัวเกี่ยวกับฝน',phrase:'ฝน',answer:'เช่น เช้านี้ฝนตกหนักจนถนนเปียก',step1:'เล่าเหตุการณ์จริง',step2:'ไม่ใช้คำอุปมา',step3:'ตรวจ: อ่านแล้วเข้าใจทันที'},
 {type:'create',prompt:'แปลงประโยคตรงตัวให้เป็นโดยนัย: “เขาใจดีมาก”',phrase:'เขาใจดีมาก',answer:'เช่น เขามีหัวใจทองคำ / เขาน้ำใจดี',step1:'หาคำอุปมาแทน “ใจดี”',step2:'เลือกสำนวนที่เรียนแล้ว',step3:'เขียนประโยคใหม่ให้สมบูรณ์'}
];
window.WORKSHEET_CONFIG={icon:'🔍',title:'ใบงานความหมายตรงตัวและโดยนัย',subject:'ภาษาไทย',gradeLabel:'ป.4–6',mediaLabel:'ความหมายโดยนัย',sourceMediaUrl:'/games/thai/thai-implied-meaning-media.html',indicators:['ท 1.1 ป.5/5'],directions:'จำแนกตรงตัว/โดยนัย ตีความสำนวน หาหลักฐานจากบริบท และสร้างประโยคเอง',getItems(topic){return topic==='mixed'?IMPLY_ITEMS:IMPLY_ITEMS.filter(i=>i.type===topic);},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><div class="q-context">“'+e(item.phrase)+'”</div><div class="classify-grid"><div class="classify-box">ตรงตัว</div><div class="classify-box">โดยนัย</div></div></div><div class="q-work-block"><div class="evidence-line"><span class="work-fill">'+e(item.step1)+'</span></div><div class="reason-line"><span class="work-fill">'+e(item.step2)+'</span></div><div class="reason-line"><span class="work-fill">'+e(item.step3)+'</span></div></div><div class="q-foot"><div class="answer-line">สรุป <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },

  // ── 4 การบรรยาย–พรรณนา ──────────────────────────────────
  {
    out: 'public/games/thai/narration-style-worksheet.html',
    html: shell({
      icon: '📚',
      title: 'ใบงานการบรรยายและการพรรณนา',
      sourceMedia: '/games/thai/thai-narration-style-media.html',
      indicators: ['ท 1.1 ป.5/4'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'classify', label: 'จำแนกบรรยาย/พรรณนา' },
        { value: 'signal', label: 'หาคำบอกประเภท' },
        { value: 'rewrite', label: 'เขียนใหม่' },
        { value: 'compose', label: 'แต่งข้อความสั้น' },
      ],
      bodyScript: `const NARR_ITEMS=[
 {type:'classify',prompt:'จำแนกประเภทข้อความ',text:'เด็กๆ วิ่งเล่นในสนาม จากนั้นกลับเข้าห้องเรียน',answer:'การบรรยาย',step1:'มีลำดับเหตุการณ์: วิ่งเล่น → กลับห้อง',step2:'เล่าสิ่งที่เกิดขึ้นตามเวลา',step3:'สรุป: บรรยาย'},
 {type:'classify',prompt:'จำแนกประเภทข้อความ',text:'ต้นมะม่วงใหญ่ ใบเขียวหนา เงาเย็นสบาย',answer:'การพรรณนา',step1:'บอกลักษณะ: ใหญ่ เขียวหนา เย็น',step2:'ไม่เล่าเหตุการณ์ต่อเนื่อง',step3:'สรุป: พรรณนา'},
 {type:'classify',prompt:'จำแนกประเภทข้อความ',text:'ครูอธิบายบทเรียน แล้วให้ทำแบบฝึกหัด',answer:'การบรรยาย',step1:'ลำดับ: อธิบาย → ให้ทำแบบฝึก',step2:'เล่าเหตุการณ์ในชั้นเรียน',step3:'สรุป: บรรยาย'},
 {type:'classify',prompt:'จำแนกประเภทข้อความ',text:'ทะเลสีฟ้าใส คลื่นซัดชายหาดทรายขาว',answer:'การพรรณนา',step1:'สี ภาพ ลักษณะทะเล',step2:'สร้างภาพในใจ',step3:'สรุป: พรรณนา'},
 {type:'classify',prompt:'จำแนกประเภทข้อความ',text:'ฉันลืมการบ้าน จึงขอโทษครูและสัญญาจะทำให้ทัน',answer:'การบรรยาย',step1:'เหตุ → ผล: ลืม → ขอโทษ → สัญญา',step2:'เล่าเรื่องที่เกิดกับตัวละคร',step3:'สรุป: บรรยาย'},
 {type:'classify',prompt:'จำแนกประเภทข้อความ',text:'ยามเย็นท้องฟ้าเปลี่ยนเป็นสีส้มทอง',answer:'การพรรณนา',step1:'เน้นสีและบรรยากาศ',step2:'ไม่ได้เล่าเหตุการณ์หลายขั้น',step3:'สรุป: พรรณนา'},
 {type:'signal',prompt:'คำใดในข้อความบอกว่าเป็นบรรยาย',text:'แม่ไปตลาด ซื้อผักและผลไม้ แล้วกลับมาทำอาหาร',answer:'ไป / ซื้อ / แล้วกลับ — คำแสดงลำดับเหตุการณ์',step1:'หาคำที่บอกเวลาหรือลำดับ',step2:'“แล้ว” เชื่อมเหตุการณ์',step3:'สรุปคำสัญญาณบรรยาย'},
 {type:'signal',prompt:'คำใดบอกว่าเป็นพรรณนา',text:'ห้องสมุดเงียบสงบ มีชั้นหนังสือเรียงเป็นแถว',answer:'เงียบสงบ / เรียงเป็นแถว — คำบอกลักษณะ',step1:'หาคำคุณศัพท์/ลักษณะ',step2:'ไม่เน้นการกระทำต่อเนื่อง',step3:'สรุปคำสัญญาณพรรณนา'},
 {type:'signal',prompt:'ทำไมข้อความนี้จึงเป็นพรรณนา',text:'ลมพัดเบาๆ ใบไม้ไหวโซ่แซว',answer:'เพราะบรรยายภาพและความรู้สึกของบรรยากาศ',step1:'มีภาพการเคลื่อนไหวเบา ๆ',step2:'ไม่เล่าเรื่องมีจุดเริ่ม–จบชัด',step3:'เน้นความรู้สึก/ภาพ'},
 {type:'rewrite',prompt:'เปลี่ยนเป็นพรรณนา: “ฉันไปสวนสาธารณะ”',text:'ฉันไปสวนสาธารณะ',answer:'เช่น สวนสาธารณะมีต้นไม้เขียวขจี ลมเย็นสบาย และดอกไม้สีสันสดใส',step1:'คงสถานที่เดิม',step2:'เติมลักษณะ สี กลิ่น เสียง',step3:'ลดการเล่าเหตุการณ์ เน้นภาพ'},
 {type:'rewrite',prompt:'เปลี่ยนเป็นบรรยาย: “ดอกไม้สีชมพูบานสะพรั่ง”',text:'ดอกไม้สีชมพูบานสะพรั่ง',answer:'เช่น เช้านี้ฉันรดน้ำต้นไม้ แล้วเก็บดอกไม้สีชมพูไปให้ครู',step1:'เพิ่มตัวละครและการกระทำ',step2:'เรียงลำดับเหตุการณ์',step3:'ตรวจว่ามีก่อน–หลัง'},
 {type:'rewrite',prompt:'เติมให้เป็นบรรยายสมบูรณ์',text:'นักเรียนตั้งแถวสวดมนต์',answer:'เช่น นักเรียนตั้งแถวสวดมนต์ แล้วเดินเข้าห้องเรียน',step1:'มีเหตุการณ์แรกแล้ว',step2:'เติมเหตุการณ์ถัดไป',step3:'ใช้คำเชื่อม “แล้ว/จากนั้น”'},
 {type:'compose',prompt:'แต่งข้อความบรรยาย 2–3 ประโยค เรื่องเช้าที่โรงเรียน',text:'เช้าที่โรงเรียน',answer:'เช่น ฉันมาโรงเรียนแต่เช้า เข้าแถวเคารพธงชาติ แล้วเข้าห้องเรียน',step1:'เลือก 2–3 เหตุการณ์',step2:'เรียงตามเวลา',step3:'ใช้คำเชื่อมลำดับ'},
 {type:'compose',prompt:'แต่งข้อความพรรณนา 2–3 ประโยค เรื่องท้องฟ้า',text:'ท้องฟ้า',answer:'เช่น ท้องฟ้าสีคราม มีเมฆขาวฟูฟ่อง แสงแดดอุ่นอ่อน ๆ',step1:'เลือกภาพหลัก',step2:'เติมสี รูปร่าง ความรู้สึก',step3:'หลีกเลี่ยงลำดับเหตุการณ์ยาว'},
 {type:'compose',prompt:'เขียนข้อความผสม: 1 ประโยคบรรยาย + 1 ประโยคพรรณนา',text:'ผสม',answer:'เช่น เราเดินเข้าสวน (บรรยาย) ดอกไม้หอมหวานสีสดใส (พรรณนา)',step1:'ประโยคแรกเล่าการกระทำ',step2:'ประโยคหลังบรรยายลักษณะ',step3:'ตรวจทั้งสองประเภทชัดเจน'},
 {type:'compose',prompt:'อธิบายสั้น ๆ ว่าบรรยายกับพรรณนาต่างกันอย่างไร',text:'เปรียบเทียบ',answer:'บรรยายเล่าเหตุการณ์ตามลำดับ · พรรณนาวาดภาพลักษณะ/บรรยากาศ',step1:'บรรยาย = เกิดอะไรขึ้น',step2:'พรรณนา = หน้าตา/ความรู้สึกเป็นอย่างไร',step3:'สรุปความต่างเป็นประโยคเดียว'}
];
window.WORKSHEET_CONFIG={icon:'📚',title:'ใบงานการบรรยายและการพรรณนา',subject:'ภาษาไทย',gradeLabel:'ป.4–6',mediaLabel:'บรรยาย–พรรณนา',sourceMediaUrl:'/games/thai/thai-narration-style-media.html',indicators:['ท 1.1 ป.5/4'],directions:'จำแนกข้อความ หาคำสัญญาณ เขียนใหม่ และแต่งข้อความสั้นทั้งสองประเภท',getItems(topic){return topic==='mixed'?NARR_ITEMS:NARR_ITEMS.filter(i=>i.type===topic);},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><div class="q-context">“'+e(item.text)+'”</div><div class="classify-grid"><div class="classify-box">📖 การบรรยาย</div><div class="classify-box">🎨 การพรรณนา</div></div></div><div class="q-work-block"><div class="evidence-line"><span class="work-fill">'+e(item.step1)+'</span></div><div class="reason-line"><span class="work-fill">'+e(item.step2)+'</span></div><div class="reason-line"><span class="work-fill">'+e(item.step3)+'</span></div></div><div class="q-foot"><div class="answer-line">สรุป <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },

  // ── 5 เกม 24 วิธีคิด ─────────────────────────────────────
  {
    out: 'public/games/math/math-24-worksheet.html',
    html: shell({
      icon: '🧮',
      title: 'ใบงานเกม 24 วิธีคิดทีละขั้น',
      sourceMedia: '/games/math/math-24-thinking-media.html',
      indicators: ['ค 1.1 ป.4/10', 'ค 1.1 ป.4/12'],
      gradeOptions: [4, 5, 6],
      topics: [
        { value: 'plan', label: 'วางแผนหา 24' },
        { value: 'compute', label: 'คำนวณทีละขั้น' },
        { value: 'check', label: 'ตรวจคำตอบ' },
        { value: 'strategy', label: 'กลยุทธ์' },
      ],
      bodyScript: `const MATH24_ITEMS=[
 {type:'plan',prompt:'วางแผนให้ได้ 24 จาก 8, 3, 3, 1',nums:'8 3 3 1',answer:'8×3×(3÷3)=24',step1:'เป้า=24 · เลข 8,3,3,1',step2:'8×3=24',step3:'3÷3=1 แล้ว 24×1=24'},
 {type:'compute',prompt:'หา 24 จาก 6, 4, 2, 1',nums:'6 4 2 1',answer:'6×4×(2÷2)=24',step1:'6×4=24',step2:'2÷2=1',step3:'24×1=24 · ใช้ครบ'},
 {type:'compute',prompt:'หา 24 จาก 5, 5, 5, 1',nums:'5 5 5 1',answer:'(5−1÷5)×5=24',step1:'1÷5=0.2',step2:'5−0.2=4.8',step3:'4.8×5=24'},
 {type:'compute',prompt:'หา 24 จาก 8, 8, 3, 3',nums:'8 8 3 3',answer:'8÷(3−8÷3)=24',step1:'8÷3=8/3',step2:'3−8/3=1/3',step3:'8÷(1/3)=24'},
 {type:'compute',prompt:'หา 24 จาก 4, 4, 4, 4',nums:'4 4 4 4',answer:'4×4+4+4=24',step1:'4×4=16',step2:'16+4=20',step3:'20+4=24'},
 {type:'compute',prompt:'หา 24 จาก 1, 2, 3, 8',nums:'1 2 3 8',answer:'8×3×(2−1)=24',step1:'2−1=1',step2:'8×3=24',step3:'24×1=24'},
 {type:'compute',prompt:'หา 24 จาก 2, 2, 4, 6',nums:'2 2 4 6',answer:'6×4×(2÷2)=24',step1:'6×4=24',step2:'2÷2=1',step3:'24×1=24'},
 {type:'compute',prompt:'หา 24 จาก 3, 3, 4, 6',nums:'3 3 4 6',answer:'6×4×(3÷3)=24',step1:'6×4=24',step2:'3÷3=1',step3:'24×1=24'},
 {type:'check',prompt:'ตรวจวิธี: (8−2)×4 = 24 ใช้เลข 8,2,4,? ขาดอะไร',nums:'8 2 4 ?',answer:'ยังใช้ไม่ครบ 4 ตัว ต้องมีตัวที่ 4 และใช้ให้ครบ',step1:'นับเลขที่ใช้: 8,2,4 = 3 ตัว',step2:'เกม 24 ต้องใช้ครบ 4 ตัวพอดี',step3:'วิธีนี้ยังไม่ครบเงื่อนไข'},
 {type:'check',prompt:'ตรวจ: 6×3 + 4 + 2 = 24 ใช้ 6,3,4,2 ถูกต้องหรือไม่',nums:'6 3 4 2',answer:'ถูกต้อง ได้ 18+4+2=24 และใช้ครบ',step1:'6×3 = 18',step2:'18+4 = 22 · 22+2 = 24',step3:'ใช้ครบ 4 ตัว → ผ่าน'},
 {type:'check',prompt:'ทำไม 24÷1 = 24 อย่างเดียวจึงยังไม่พอ',nums:'24 1',answer:'เพราะต้องเริ่มจากเลข 4 ตัวที่กำหนด ไม่ใช่มี 24 อยู่แล้ว',step1:'เงื่อนไข: ใช้เลขที่ให้มาเท่านั้น',step2:'ห้ามสร้าง 24 มาก่อนแล้วหาร 1',step3:'ต้องประกอบจาก 4 ตัวครบ'},
 {type:'plan',prompt:'กลยุทธ์: เห็นเลข 8 และ 3 ควรคิดอะไรก่อน',nums:'8 3 ? ?',answer:'ลอง 8×3 = 24 แล้วจัดการอีก 2 ตัวให้ได้ตัวคูณ 1 หรือบวกลบศูนย์',step1:'หาคู่ที่คูณ/บวกได้ใกล้ 24',step2:'8×3 = 24 เป็นทางลัดดี',step3:'ทำอีกสองตัวให้เป็น ×1 หรือ +0'},
 {type:'strategy',prompt:'กลยุทธ์ทำ 24 เมื่อมีเลขซ้ำ เช่น 4,4,4,4',nums:'4 4 4 4',answer:'สร้างตัวประกอบของ 24 เช่น 4×6 แต่สร้าง 6 จาก 4+4÷2… หรือ 4×4+4+4',step1:'24 = 4×6 = 8×3 = 12×2',step2:'ลองสร้างตัวประกอบจากเลขที่มี',step3:'ตรวจใช้ครบทุกตัว'},
 {type:'strategy',prompt:'ถ้าติดขัด ควรลองดำเนินการใดก่อน',nums:'ทั่วไป',answer:'ลองคูณคู่ที่ให้ผลใกล้ 24 ก่อน แล้วค่อยบวกลบ/หารจัดส่วนที่เหลือ',step1:'เขียนเป้า 24',step2:'ลิสต์คู่คูณที่เป็นไปได้',step3:'ทดลองทีละคู่และจดขั้น'},
 {type:'plan',prompt:'วางแผนจาก 9, 3, 2, 2',nums:'9 3 2 2',answer:'(9+3)×2×(2÷2)=24',step1:'9+3=12',step2:'12×2=24',step3:'2÷2=1 แล้ว 24×1=24'},
 {type:'compute',prompt:'หา 24 จาก 7, 7, 3, 3',nums:'7 7 3 3',answer:'(7×3+3)×(7÷7)=24',step1:'7×3=21',step2:'21+3=24',step3:'7÷7=1 แล้ว 24×1=24'}
];
window.WORKSHEET_CONFIG={icon:'🧮',title:'ใบงานเกม 24 วิธีคิดทีละขั้น',subject:'คณิตศาสตร์',gradeLabel:'ป.4–6',mediaLabel:'เกม 24 วิธีคิด',sourceMediaUrl:'/games/math/math-24-thinking-media.html',indicators:['ค 1.1 ป.4/10','ค 1.1 ป.4/12'],directions:'ใช้เลข 4 ตัวให้ครบ วางแผน คำนวณทีละขั้น และตรวจว่าได้ 24',getItems(topic){return topic==='mixed'?MATH24_ITEMS:MATH24_ITEMS.filter(i=>i.type===topic);},renderQuestion(item){const e=window.KampaiTopicWorksheet.escapeHtml;return '<div class="q-stem"><div class="q-prompt">'+e(item.prompt)+'</div><table class="mini-table"><tr><th>เลขที่ใช้</th><th>เป้า</th></tr><tr><td>'+e(item.nums)+'</td><td>24</td></tr></table><div>ลงวิธีคิดทีละขั้น (ใช้ครบ 4 ตัว)</div></div><div class="q-work-block"><div class="calc-line"><span class="work-fill">'+e(item.step1)+'</span></div><div class="calc-line"><span class="work-fill">'+e(item.step2)+'</span></div><div class="calc-line"><span class="work-fill">'+e(item.step3)+'</span></div></div><div class="q-foot"><div class="answer-line">สรุป <span class="answer-fill">'+e(item.answer)+'</span></div></div>';}};`,
    }),
  },
];

for (const ws of worksheets) {
  const target = path.join(repoRoot, ws.out);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, ws.html, 'utf8');
  console.log('Wrote', ws.out);
}
console.log(`Generated ${worksheets.length} detailed worksheets.`);
