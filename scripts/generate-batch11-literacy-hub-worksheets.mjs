#!/usr/bin/env node
/** Generate Batch 11 literacy/culture hub worksheets */
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

const readingItems = [
  { type: 'main', passage: 'เช้านี้ฝนตกเล็กน้อย นักเรียนพกร่มมาโรงเรียน ครูชมว่าทุกคนเตรียมตัวดี', prompt: 'ใจความสำคัญของข้อความคืออะไร', answer: 'นักเรียนเตรียมตัวดีเมื่อฝนตก' },
  { type: 'main', passage: 'แมวส้มชอบนอนแดดหน้าต่าง มันยืดตัวแล้วครางเบา ๆ เมื่อมีคนลูบหัว', prompt: 'ข้อความนี้พูดถึงเรื่องอะไรเป็นหลัก', answer: 'นิสัย/พฤติกรรมของแมวส้ม' },
  { type: 'detail', passage: 'ตลาดนัดวันเสาร์ขายผลไม้ ผักสด และของเล่นไม้ จากชาวบ้านใกล้เคียง', prompt: 'ตลาดนัดมีวันใด', answer: 'วันเสาร์' },
  { type: 'detail', passage: 'นกกาฝากสร้างรังบนต้นไม้สูงเพื่อความปลอดภัยจากสัตว์อื่น', prompt: 'ทำไมนกจึงสร้างรังบนต้นไม้สูง', answer: 'เพื่อความปลอดภัยจากสัตว์อื่น' },
  { type: 'infer', passage: 'น้องเล็กห่มผ้าหนาและจามบ่อย แม่รีบต้มน้ำขิงให้ดื่ม', prompt: 'คาดว่าน้องเล็กเป็นอย่างไร', answer: 'อาจเป็นหวัด/หนาว' },
  { type: 'infer', passage: 'ไฟในห้องดับและทุกคนหาไฟฉาย ฟ้าผ่าดังสนั่นข้างนอก', prompt: 'สถานการณ์นอกบ้านเป็นอย่างไร', answer: 'พายุ/ฝนฟ้าคะนอง' },
  { type: 'fact', passage: 'ดวงอาทิตย์เป็นดาวฤกษ์ที่ใกล้โลกที่สุด ให้แสงและความร้อน', prompt: 'ข้อใดเป็นข้อเท็จจริง', answer: 'ดวงอาทิตย์ใกล้โลกและให้แสงความร้อน' },
  { type: 'fact', passage: 'ฉันคิดว่าผลไม้สีม่วงอร่อยที่สุดในโลก', prompt: 'ข้อความนี้เป็นข้อเท็จจริงหรือความคิดเห็น', answer: 'ความคิดเห็น' },
  { type: 'main', passage: 'ห้องสมุดเปิดหลังเลิกเรียน นักเรียนมาอ่านการ์ตูนความรู้และทำรายงาน', prompt: 'สรุปใจความสั้น ๆ', answer: 'นักเรียนใช้ห้องสมุดหลังเลิกเรียน' },
  { type: 'detail', passage: 'แม่น้ำโขงไหลผ่านหลายประเทศในเอเชียตะวันออกเฉียงใต้', prompt: 'แม่น้ำโขงไหลผ่านบริเวณใด', answer: 'เอเชียตะวันออกเฉียงใต้' },
  { type: 'infer', passage: 'เพื่อนยิ้มกว้างเมื่อได้รับของขวัญวันเกิดจากชั้นเรียน', prompt: 'เพื่อนรู้สึกอย่างไร', answer: 'ดีใจ/มีความสุข' },
  { type: 'fact', passage: 'กรุงเทพฯ เป็นเมืองหลวงของประเทศไทย', prompt: 'ยืนยันข้อเท็จจริงจากข้อความ', answer: 'กรุงเทพฯ เป็นเมืองหลวง' },
  { type: 'main', passage: 'การล้างมือก่อนกินอาหารช่วยลดเชื้อโรคที่อาจเข้าสู่ร่างกาย', prompt: 'ใจความสำคัญ', answer: 'ล้างมือก่อนกินลดเชื้อโรค' },
  { type: 'detail', passage: 'ต้นมะม่วงในสวนหลังบ้านออกผลช่วงหน้าร้อน', prompt: 'มะม่วงออกผลช่วงใด', answer: 'หน้าร้อน' },
  { type: 'infer', passage: 'นักเรียนรีบเก็บสมุดเมื่อได้ยินเสียงกริ่งหมดเวลาสอบ', prompt: 'เกิดเหตุการณ์ใด', answer: 'หมดเวลาสอบแล้ว' },
  { type: 'fact', passage: 'ปลาหายใจด้วยเหงือก ไม่ใช่ปอดเหมือนคน', prompt: 'ข้อเท็จจริงในข้อความ', answer: 'ปลาหายใจด้วยเหงือก' },
  { type: 'main', passage: 'ชุมชนช่วยกันเก็บขยะริมคลอง ทำให้คลองใสขึ้นและไม่มีกลิ่นเหม็น', prompt: 'ผลจากการร่วมมือของชุมชน', answer: 'คลองสะอาดขึ้น' },
  { type: 'detail', passage: 'พิพิธภัณฑ์เปิดเวลา 09.00–16.00 น. ปิดวันจันทร์', prompt: 'พิพิธภัณฑ์ปิดวันใด', answer: 'วันจันทร์' },
];

const writingItems = [
  { type: 'sentence', prompt: 'แต่งประโยคให้สมบูรณ์จากคำสั่ง', hint: 'ใช้คำ: โรงเรียน / สนุก', answer: 'เช่น การเรียนที่โรงเรียนสนุกมาก' },
  { type: 'sentence', prompt: 'แต่งประโยคบอกเล่า 1 ประโยค', hint: 'เรื่องเพื่อนช่วยเหลือ', answer: 'เช่น เพื่อนช่วยฉันเก็บหนังสือ' },
  { type: 'paragraph', prompt: 'เขียนย่อหน้าสั้น 3–4 ประโยค', hint: 'หัวข้อ: วันหยุดของฉัน', answer: 'มี开头 กลาง จบ ชัดเจน' },
  { type: 'paragraph', prompt: 'เขียนย่อหน้าเชิญชวน', hint: 'ชวนเพื่อนมาอ่านหนังสือ', answer: 'มีเหตุผลและคำเชิญ' },
  { type: 'letter', prompt: 'เขียนจดหมายสั้นถึงคุณครู', hint: 'ขอบคุณที่สอน', answer: 'มีคำขึ้นต้น เนื้อความ คำลงท้าย' },
  { type: 'letter', prompt: 'เขียนข้อความถึงผู้ปกครอง', hint: 'เล่าผลการเรียนวันนี้', answer: 'สุภาพ ชัดเจน มีใจความ' },
  { type: 'fix', prompt: 'แก้ประโยคให้ถูกและลื่น', text: 'ฉันไปแล้วตลาดซื้อผลไม้', answer: 'ฉันไปตลาดแล้วเพื่อซื้อผลไม้' },
  { type: 'fix', prompt: 'แก้เครื่องหมายและคำซ้ำ', text: 'วันนี้ วันนี้ อากาศดีจัง', answer: 'วันนี้อากาศดีจัง!' },
  { type: 'sentence', prompt: 'แต่งประโยคคำถาม', hint: 'ถามเพื่อนเรื่องการบ้าน', answer: 'เช่น เธอทำการบ้านเสร็จหรือยัง' },
  { type: 'sentence', prompt: 'แต่งประโยคแสดงเหตุผล', hint: 'ใช้คำว่า เพราะ', answer: 'เช่น ฉันตื่นเช้าเพราะต้องไปโรงเรียน' },
  { type: 'paragraph', prompt: 'เขียนเล่าเหตุการณ์ในโรงเรียน', hint: 'งานกีฬาสี', answer: 'ลำดับเหตุการณ์ชัด' },
  { type: 'paragraph', prompt: 'เขียนอธิบายวิธีทำสิ่งหนึ่ง', hint: 'วิธีปลูกต้นไม้', answer: 'มีขั้นตอน 1–2–3' },
  { type: 'letter', prompt: 'เขียนการ์ดอวยพรสั้น', hint: 'วันเกิดเพื่อน', answer: 'มีคำอวยพรและชื่อผู้ส่ง' },
  { type: 'fix', prompt: 'จัดเรียงประโยคให้เป็นย่อหน้า', text: '(1) ฝนหยุด (2) เราออกไปเล่น (3) ท้องฟ้ามืด', answer: '3→1→2' },
  { type: 'sentence', prompt: 'แต่งประโยคเปรียบเทียบ', hint: 'ใช้คำว่า กว่า', answer: 'เช่น ช้างใหญ่กว่าม้า' },
  { type: 'paragraph', prompt: 'เขียนแสดงความคิดเห็นสั้น', hint: 'ควรช่วยงานบ้านหรือไม่', answer: 'มีเหตุผลสนับสนุน' },
  { type: 'fix', prompt: 'เติมคำเชื่อมให้ข้อความต่อเนื่อง', text: 'อยากเล่น ___ ต้องทำการบ้านก่อน', answer: 'แต่ / จึง' },
  { type: 'letter', prompt: 'เขียนขออนุญาตสั้น ๆ', hint: 'ขอยืมหนังสือจากห้องสมุด', answer: 'มีคำขอและเหตุผล' },
];

const poetryItems = [
  { type: 'rhyme', prompt: 'หาคำสัมผัสกับคำที่กำหนด', word: 'มา', answer: 'เช่น กา นา ตา ลา' },
  { type: 'rhyme', prompt: 'หาคำสัมผัสกับคำที่กำหนด', word: 'เรียน', answer: 'เช่น เพียร เขียน เปลี่ยน' },
  { type: 'genre', prompt: 'ข้อความนี้ใกล้เคียงร้อยแก้วหรือร้อยกรอง', text: 'ฝนตกพรำ ๆ บนหลังคาบ้าน', answer: 'ร้อยแก้ว (หรือร้อยกรองง่าย ๆ ตามจังหวะ)' },
  { type: 'genre', prompt: 'จำแนกชนิดบทร้อยกรองง่าย ๆ', text: 'คำขวัญวันเด็กสั้น ๆ มีสัมผัส', answer: 'คำขวัญ / ร้อยกรองสั้น' },
  { type: 'compose', prompt: 'แต่งคำขวัญ 1 บรรทัด', hint: 'หัวข้อ: รักการอ่าน', answer: 'เช่น อ่านทุกวัน พัฒนาปัญญา' },
  { type: 'compose', prompt: 'แต่งกลอนสั้น 2 วรรคให้มีสัมผัส', hint: 'เรื่องโรงเรียน', answer: 'มีสัมผัสท้ายวรรค' },
  { type: 'sound', prompt: 'วงคำที่มีเสียงซ้ำพยัญชนะต้น', text: 'ฝนฟ้าพร่างพร้อย', answer: 'พร่างพร้อย / ฝนฟ้า' },
  { type: 'sound', prompt: 'บอกจังหวะหรือการเว้นวรรคที่เหมาะสม', text: 'นกน้อยโบยบินบนท้องฟ้า', answer: 'เว้นวรรคตามจังหวะอ่าน' },
  { type: 'rhyme', prompt: 'จับคู่คำสัมผัส', word: 'ใจ–?', answer: 'เช่น ใคร ไป ไหน' },
  { type: 'genre', prompt: 'ข้อใดเป็นลักษณะร้อยกรอง', text: 'มีคำสัมผัสและจังหวะอ่าน', answer: 'ร้อยกรอง' },
  { type: 'compose', prompt: 'แต่งคำขวัญรณรงค์ความสะอาด', hint: 'โรงเรียนสะอาด', answer: 'สั้น จำง่าย มีสัมผัส' },
  { type: 'sound', prompt: 'อ่านออกเสียงแล้วขีดคำเน้นจังหวะ', text: 'ยิ้มแย้มแจ่มใสทุกวัน', answer: 'เน้นตามจังหวะธรรมชาติ' },
  { type: 'rhyme', prompt: 'เติมคำสัมผัสท้ายบรรทัด', text: 'พระอาทิตย์ขึ้นทาบพื้น___', answer: 'เช่น ดิน / ถิ่น' },
  { type: 'compose', prompt: 'เขียนบรรยายภาพด้วยภาษาภาพพจน์สั้น ๆ', hint: 'พระจันทร์', answer: 'เช่น พระจันทร์ยิ้มบนฟ้า' },
  { type: 'genre', prompt: 'แยกร้อยแก้วกับร้อยกรอง', text: 'นิทานเด็ก vs คำขวัญวันแม่', answer: 'นิทาน=ร้อยแก้ว · คำขวัญ=ร้อยกรองสั้น' },
  { type: 'sound', prompt: 'หาคำเลียนเสียงธรรมชาติ', text: 'ฝนตก ___ บนหลังคา', answer: 'เช่น แปะ ๆ / กรุ้มกริ่ม' },
  { type: 'compose', prompt: 'แต่ง 2 บรรทัดเชิญชวนรักษาสิ่งแวดล้อม', hint: 'สัมผัสท้ายบรรทัด', answer: 'มีสาระและสัมผัส' },
  { type: 'rhyme', prompt: 'เลือกคำสัมผัสที่เหมาะที่สุด', word: 'นก', choices: 'อก / โต๊ะ / ดิน', answer: 'อก' },
];

const literatureItems = [
  { type: 'tale', prompt: 'อ่านนิทานสั้นแล้วตอบคำถาม', text: 'กระต่ายหยิ่งแข่งกับเต่า เต่าเดินช้าแต่ไม่หยุด พอถึงเส้นชัยกระต่ายยังหลับอยู่', ask: 'ใครชนะ เพราะอะไร', answer: 'เต่าชนะ เพราะพากเพียรไม่หยุด' },
  { type: 'tale', prompt: 'บอกตัวละครเอกและตัวละครรอง', text: 'ลูกหมูสามตัวสร้างบ้าน คนละแบบ หมาป่ามาเป่าบ้านฟางและไม้ล้ม', ask: 'ตัวละครเอกคือใคร', answer: 'ลูกหมูสามตัว (หรือลูกหมูสร้างบ้านอิฐ)' },
  { type: 'proverb', prompt: 'อธิบายสุภาษิต', text: 'ช้า ๆ ได้พร้าเล่มงาม', answer: 'ทำอย่างรอบคอบได้ผลดี' },
  { type: 'proverb', prompt: 'เลือกสุภาษิตที่เหมาะกับสถานการณ์', text: 'เพื่อนชวนโกหกครู', answer: 'เช่น คบคนพาลพาลพาไปหาผิด' },
  { type: 'moral', prompt: 'สรุปข้อคิดจากเรื่อง', text: 'เด็กเห็นคนแก่ถือของหนักจึงเข้าไปช่วย', answer: 'มีน้ำใจ ช่วยเหลือผู้อื่น' },
  { type: 'moral', prompt: 'ข้อคิดที่สอดคล้องกับเรื่อง', text: 'คนโกหกจนไม่มีใครเชื่อ', answer: 'ความซื่อสัตย์สำคัญ' },
  { type: 'character', prompt: 'บอกลักษณะนิสัยตัวละคร', text: 'นายทองใจเย็น ฟังเพื่อนจบก่อนตอบ', answer: 'ใจเย็น รู้จักฟัง' },
  { type: 'character', prompt: 'เปรียบเทียบตัวละครสองตัว', text: 'พี่ขยันทบทวน น้องเล่นตลอดเวลา', answer: 'พี่ขยัน น้องยังไม่ตั้งใจ' },
  { type: 'tale', prompt: 'เรียงลำดับเหตุการณ์', text: 'หิว → หาอาหาร → แบ่งให้เพื่อน', ask: 'ลำดับที่ถูก', answer: 'หิว หาอาหาร แบ่งเพื่อน' },
  { type: 'proverb', prompt: 'แต่งประโยคใช้สุภาษิต', text: 'น้ำขึ้นให้รีบตัก', answer: 'เช่น ตอนลดราคาควรซื้อของจำเป็น' },
  { type: 'moral', prompt: 'เลือกข้อคิดที่เหมาะสมที่สุด', text: 'ช่วยเพื่อนที่ล้มโดยไม่หัวเราะ', answer: 'เมตตา / เห็นอกเห็นใจ' },
  { type: 'character', prompt: 'ตัวละครทำไมจึงน่าชื่นชม', text: 'เด็กเก็บของได้แล้วคืนเจ้าของ', answer: 'ซื่อสัตย์ มีคุณธรรม' },
  { type: 'tale', prompt: 'ถ้าเปลี่ยนตอนจบจะเป็นอย่างไร', text: 'กระต่ายไม่หลับแต่ยังประมาท', ask: 'จบแบบสอนใจ', answer: 'ยังแพ้ถ้าไม่จริงจัง หรือชนะถ้าตั้งใจ' },
  { type: 'proverb', prompt: 'จับคู่ความหมาย', text: 'ปิดทองหลังพระ', answer: 'ทำดีโดยไม่โอ้อวด' },
  { type: 'moral', prompt: 'เขียนข้อคิด 1 ประโยคด้วยคำของตนเอง', text: 'เรื่องเพื่อนช่วยกันทำการบ้านเข้าใจ', answer: 'การช่วยเหลือทำให้สำเร็จร่วมกัน' },
  { type: 'character', prompt: 'ระบุบทบาทตัวละคร', text: 'พ่อเล่าเรื่องให้ลูกฟังก่อนนอน', answer: 'พ่อ=ผู้เล่า · ลูก=ผู้ฟัง' },
  { type: 'tale', prompt: 'หาปัญหาและวิธีแก้ในเรื่อง', text: 'เรือรั่วกลางลำน้ำ ทุกคนช่วยตักน้ำ', ask: 'ปัญหา/วิธีแก้', answer: 'เรือรั่ว / ช่วยกันตักน้ำ' },
  { type: 'proverb', prompt: 'อธิบายสั้น ๆ', text: 'พูดไปสองไพเบี้ย นิ่งเสียตำลึงทอง', answer: 'บางครั้งนิ่งไว้ดีกว่าพูด' },
];

const socialItems = [
  { type: 'map', prompt: 'จังหวัดในภาคตะวันออกเฉียงเหนือข้อใด', choices: ['ขอนแก่น', 'เชียงใหม่', 'ภูเก็ต'], answer: 'ขอนแก่น' },
  { type: 'map', prompt: 'ภาคใต้ติดทะเลสำคัญข้อใด', choices: ['อันดามัน/อ่าวไทย', 'ทะเลสาบแคสเปียน', 'ทะเลเหนือ'], answer: 'อันดามัน/อ่าวไทย' },
  { type: 'history', prompt: 'สุโขทัยมีความสำคัญอย่างไร', text: 'เป็นราชอาณาจักรไทยช่วงแรก ๆ ที่สำคัญ', answer: 'จุดเริ่มต้นประวัติศาสตร์ไทยสำคัญ' },
  { type: 'history', prompt: 'เรียงยุคอย่างง่าย', text: 'สุโขทัย → อยุธยา → รัตนโกสินทร์', answer: 'สุโขทัย อยุธยา รัตนโกสินทร์' },
  { type: 'citizen', prompt: 'พฤติกรรมพลเมืองดีข้อใด', choices: ['ทิ้งขยะลงถัง', 'ขีดเขียนฝาผนัง', 'แย่งคิว'], answer: 'ทิ้งขยะลงถัง' },
  { type: 'citizen', prompt: 'เมื่อพบของมีค่าในโรงเรียนควรทำอย่างไร', choices: ['ส่งครู/ประกาศหาเจ้าของ', 'เก็บไว้เอง', 'ทิ้ง'], answer: 'ส่งครู/ประกาศหาเจ้าของ' },
  { type: 'map', prompt: 'กรุงเทพฯ อยู่ในภาคใด', choices: ['กลาง', 'เหนือ', 'ใต้'], answer: 'กลาง' },
  { type: 'map', prompt: 'แม่น้ำเจ้าพระยาสำคัญอย่างไร', text: 'เป็นแม่น้ำสายหลักของภาคกลาง', answer: 'สายหลักภาคกลาง / คมนาคม เกษตร' },
  { type: 'history', prompt: 'วันสำคัญทางประวัติศาสตร์ที่รู้จัก', text: 'วันจักรี / วันสงกรานต์ (วัฒนธรรม)', answer: 'ระบุได้อย่างน้อย 1 วันพร้อมความหมาย' },
  { type: 'citizen', prompt: 'สิทธิและหน้าที่ของนักเรียน', text: 'มีสิทธิ์เรียนและมีหน้าที่ตั้งใจเรียน', answer: 'เรียนรู้อย่างตั้งใจ เคารพกฎ' },
  { type: 'map', prompt: 'ภาคเหนือมีลักษณะภูมิประเทศเด่น', choices: ['ภูเขา/หุบเขา', 'ทะเลทราย', 'ธารน้ำแข็ง'], answer: 'ภูเขา/หุบเขา' },
  { type: 'history', prompt: 'ทำไมต้องเรียนรู้ประวัติศาสตร์ท้องถิ่น', text: 'เข้าใจรากเหง้าและรักบ้านเกิด', answer: 'รู้ที่มาของชุมชน/รักท้องถิ่น' },
  { type: 'citizen', prompt: 'การอยู่ร่วมกันในห้องเรียน', choices: ['รับฟังเพื่อน', 'เยาะเย้ย', 'แย่งของ'], answer: 'รับฟังเพื่อน' },
  { type: 'map', prompt: 'ชี้จังหวัดของโรงเรียนบนแผนที่ความคิด', text: 'เขียนชื่ออำเภอ/จังหวัดตนเอง', answer: 'ระบุถิ่นที่อยู่ถูกต้อง' },
  { type: 'history', prompt: 'บุคคลสำคัญในประวัติศาสตร์ไทยที่รู้จัก', text: 'เช่น พ่อขุนรามคำแหง', answer: 'ระบุชื่อ+ผลงานสั้น ๆ' },
  { type: 'citizen', prompt: 'เมื่อเห็นเพื่อนถูกรังแกควรทำอย่างไร', choices: ['บอกครู/ช่วยเหลืออย่างปลอดภัย', 'นิ่งเฉยตลอด', 'ร่วมรังแก'], answer: 'บอกครู/ช่วยเหลืออย่างปลอดภัย' },
  { type: 'map', prompt: 'ทรัพยากรสำคัญของท้องถิ่นตนเอง', text: 'เช่น ข้าว ยางพารา การท่องเที่ยว', answer: 'ระบุทรัพยากรท้องถิ่น+เหตุผล' },
  { type: 'history', prompt: 'เชื่อมโยงอดีต–ปัจจุบัน', text: 'ตลาดเก่าของชุมชนยังมีอยู่', answer: 'อธิบายสิ่งที่เปลี่ยน/คงเดิม' },
];

sheet({
  dir: 'thai', file: 'thai-reading-hub-worksheet.html',
  hub: '/games/thai/thai-reading-hub/index.html', subject: 'ภาษาไทย',
  indicators: ['ท 1.1 ป.5/2', 'ท 1.1 ป.5/3'],
  icon: '📖', title: 'ใบงานคลังอ่านจับใจความ', gradeLabel: 'ป.4–ป.5', mediaLabel: 'คลังอ่านจับใจความ',
  directions: 'อ่านข้อความสั้น จับใจความ หาข้อมูล และสรุป/อนุมานอย่างมีเหตุผล',
  topicOptions: '<option value="mixed">ผสมทุกทักษะ</option><option value="main">ใจความสำคัญ</option><option value="detail">รายละเอียด</option><option value="infer">อนุมาน</option><option value="fact">ข้อเท็จจริง/ความคิดเห็น</option>',
  items: readingItems,
  renderBody: `const e=window.KampaiTopicWorksheet.escapeHtml;
    return '<div class="q-prompt">'+e(item.prompt)+'</div>'
      +'<div class="q-context reading-passage">'+e(item.passage)+'</div>'
      +'<div class="classify-grid reading-hub-grid">'
      +'<div class="classify-box">ใจความ: ____________</div>'
      +'<div class="classify-box">หลักฐานในข้อความ: ____________</div></div>'
      +'<div>คำตอบ / คำอธิบาย</div><div class="evidence-line"></div><div class="reason-line"></div>'
      +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';`,
});

sheet({
  dir: 'thai', file: 'thai-writing-hub-worksheet.html',
  hub: '/games/thai/thai-writing-hub/index.html', subject: 'ภาษาไทย',
  indicators: ['ท 2.1 ป.4/1', 'ท 4.1 ป.5/3'],
  icon: '✍️', title: 'ใบงานคลังแต่งข้อความ', gradeLabel: 'ป.4–ป.5', mediaLabel: 'คลังแต่งข้อความ',
  directions: 'แต่งประโยค ย่อหน้า จดหมายสั้น และตรวจแก้ข้อความให้ถูกต้อง',
  topicOptions: '<option value="mixed">ผสมทุกทักษะ</option><option value="sentence">ประโยค</option><option value="paragraph">ย่อหน้า</option><option value="letter">จดหมาย/ข้อความ</option><option value="fix">ตรวจแก้</option>',
  items: writingItems,
  renderBody: `const e=window.KampaiTopicWorksheet.escapeHtml;
    return '<div class="q-prompt">'+e(item.prompt)+'</div>'
      +(item.hint?'<div class="q-context">คำใบ้: '+e(item.hint)+'</div>':'')
      +(item.text?'<div class="q-context writing-case">'+e(item.text)+'</div>':'')
      +'<div class="decision-box writing-hub-grid">โครงร่าง: เริ่ม ___ · กลาง ___ · จบ ___</div>'
      +'<div>เขียนคำตอบ</div><div class="work-line"></div><div class="work-line"></div><div class="work-line"></div>'
      +'<div>ตรวจภาษา / เหตุผล</div><div class="reason-line"></div>'
      +'<span class="teacher-answer">เฉลยแนว: '+e(item.answer)+'</span>';`,
});

sheet({
  dir: 'thai', file: 'thai-poetry-hub-worksheet.html',
  hub: '/games/thai/thai-poetry-hub/index.html', subject: 'ภาษาไทย',
  indicators: ['ท 5.1 ป.4/4', 'ท 4.1 ป.4/5'],
  icon: '🎭', title: 'ใบงานคลังบทร้อยกรอง', gradeLabel: 'ป.4–ป.5', mediaLabel: 'คลังบทร้อยกรอง',
  directions: 'ฝึกสัมผัส จำแนกร้อยแก้ว/ร้อยกรอง และแต่งคำขวัญสั้น',
  topicOptions: '<option value="mixed">ผสมทุกทักษะ</option><option value="rhyme">สัมผัส</option><option value="genre">ร้อยแก้ว/ร้อยกรอง</option><option value="compose">แต่งสั้น</option><option value="sound">จังหวะ/เสียง</option>',
  items: poetryItems,
  renderBody: `const e=window.KampaiTopicWorksheet.escapeHtml;
    return '<div class="q-prompt">'+e(item.prompt)+'</div>'
      +(item.word?'<div class="q-context">คำหลัก: '+e(item.word)+'</div>':'')
      +(item.text?'<div class="q-context poetry-case">'+e(item.text)+'</div>':'')
      +(item.hint?'<div class="q-context">'+e(item.hint)+'</div>':'')
      +(item.choices?'<div class="q-context">ตัวเลือก: '+e(item.choices)+'</div>':'')
      +'<div class="classify-grid poetry-hub-grid">'
      +'<div class="classify-box">สัมผัส/ชนิด: ________</div>'
      +'<div class="classify-box">ตัวอย่างคำ: ________</div></div>'
      +'<div class="work-line"></div><div class="work-line"></div><div class="reason-line"></div>'
      +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';`,
});

sheet({
  dir: 'thai', file: 'thai-literature-hub-worksheet.html',
  hub: '/games/thai/thai-literature-hub/index.html', subject: 'ภาษาไทย',
  indicators: ['ท 5.1 ป.4/1', 'ท 5.1 ป.4/2'],
  icon: '📚', title: 'ใบงานคลังวรรณคดีวรรณกรรม', gradeLabel: 'ป.4–ป.5', mediaLabel: 'คลังวรรณคดีวรรณกรรม',
  directions: 'อ่านนิทาน/สุภาษิต วิเคราะห์ตัวละคร และสรุปข้อคิด',
  topicOptions: '<option value="mixed">ผสมทุกทักษะ</option><option value="tale">นิทาน</option><option value="proverb">สุภาษิต</option><option value="moral">ข้อคิด</option><option value="character">ตัวละคร</option>',
  items: literatureItems,
  renderBody: `const e=window.KampaiTopicWorksheet.escapeHtml;
    return '<div class="q-prompt">'+e(item.prompt)+'</div>'
      +'<div class="q-context literature-case">'+e(item.text)+'</div>'
      +(item.ask?'<div class="q-context">'+e(item.ask)+'</div>':'')
      +'<div class="classify-grid literature-hub-grid">'
      +'<div class="classify-box">ตัวละคร/ประเด็น: ________</div>'
      +'<div class="classify-box">ข้อคิด: ________</div></div>'
      +'<div class="evidence-line"></div><div class="reason-line"></div>'
      +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';`,
});

sheet({
  dir: 'social', file: 'social-thailand-hub-worksheet.html',
  hub: '/games/social/social-thailand-hub/index.html', subject: 'สังคมศึกษา',
  indicators: ['ส 5.1 ป.4/1', 'ส 4.3 ป.4/1', 'ส 2.1 ป.4/1'],
  icon: '🇹🇭', title: 'ใบงานคลังสังคมศึกษาไทย', gradeLabel: 'ป.4–ป.5', mediaLabel: 'คลังสังคมศึกษาไทย',
  directions: 'ฝึกแผนที่ไทย ประวัติศาสตร์อย่างง่าย และพฤติกรรมพลเมืองดี',
  topicOptions: '<option value="mixed">ผสมทุกทักษะ</option><option value="map">แผนที่/ภูมิศาสตร์</option><option value="history">ประวัติศาสตร์</option><option value="citizen">พลเมืองดี</option>',
  items: socialItems,
  renderBody: `const e=window.KampaiTopicWorksheet.escapeHtml;
    return '<div class="q-prompt">'+e(item.prompt)+'</div>'
      +(item.text?'<div class="q-context social-case">'+e(item.text)+'</div>':'')
      +(item.choices?'<div class="classify-grid social-thailand-hub-grid">'+item.choices.map(c=>'<div class="classify-box">[ ] '+e(c)+'</div>').join('')+'</div>':'<div class="decision-box social-thailand-hub-grid">ตอบ / อธิบาย: ____________________</div>')
      +'<div class="work-line"></div><div class="reason-line"></div>'
      +'<span class="teacher-answer">เฉลย: '+e(item.answer)+'</span>';`,
});
