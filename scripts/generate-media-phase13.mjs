#!/usr/bin/env node
/**
 * Phase 13 — ป.6 + ระบบตัวชี้วัด (+8 คู่)
 * คณิต×2 · ไทย×1 · วิทย์×2 · อังกฤษ×2 · สังคม×1
 */
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const V = '1.196.0';

async function cover({ out, title, subtitle, emoji, c1, c2, ink }) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="220" text-anchor="middle" font-size="110">${emoji}</text>
  <text x="640" y="360" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="40" font-weight="800" fill="${ink}">${title}</text>
  <text x="640" y="430" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="22" font-weight="700" fill="${ink}" opacity=".85">${subtitle}</text>
  <text x="640" y="620" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="24" font-weight="700" fill="#64748b">📚 สื่อ ป.6 · Phase 13 · บ้านคำไผ่</text>
</svg>`;
  const path = resolve(root, out);
  mkdirSync(dirname(path), { recursive: true });
  await sharp(Buffer.from(svg)).png().toFile(path);
  console.log('cover', out);
}

function write(rel, html) {
  const path = resolve(root, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, html, 'utf8');
  console.log('html', rel);
}

const shell = (opts, bodyCss, bodyHtml, script) => `<!DOCTYPE html>
<html lang="th"><head>
  <script src="/games/kampai-sdk.js"></script>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${opts.title} — บ้านคำไผ่</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700;800&display=swap" rel="stylesheet"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--deep:${opts.accent};--line:${opts.line};--muted:#64748b}
    body{font-family:'Sarabun',sans-serif;background:linear-gradient(145deg,${opts.line},${opts.accent}22);min-height:100%;padding:12px;color:#0f172a}
    .shell{max-width:1100px;margin:0 auto;background:#fff;border-radius:1.5rem;box-shadow:0 20px 50px rgba(15,23,42,.12);overflow:hidden;min-height:calc(100vh - 24px);display:flex;flex-direction:column}
    header{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 16px;background:linear-gradient(90deg,var(--deep),${opts.accent});color:#fff}
    header h1{font-size:1.15rem;font-weight:800;flex:1;min-width:160px}
    .badge{font-size:.75rem;background:rgba(255,255,255,.2);padding:4px 10px;border-radius:999px;font-weight:700}
    .btn{font-family:inherit;font-weight:700;border:none;border-radius:12px;padding:10px 14px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px}
    .btn:active{transform:scale(.97)}
    .btn-back{background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.35);padding:8px 12px;font-size:.85rem}
    .btn-primary{background:var(--deep);color:#fff}
    .btn-ghost{background:#fff;color:var(--deep);border:2px solid var(--line)}
    .toolbar{display:flex;flex-wrap:wrap;gap:8px;padding:12px 16px;background:#f8fafc;border-bottom:1px solid var(--line);align-items:center}
    .seg{display:inline-flex;border-radius:12px;overflow:hidden;border:2px solid var(--line)}
    .seg button{font-family:inherit;font-weight:800;border:none;background:#fff;color:var(--deep);padding:8px 14px;cursor:pointer}
    .seg button.on{background:var(--deep);color:#fff}
    .hint{font-size:.9rem;color:var(--deep);font-weight:700;flex:1;min-width:140px}
    .stage{flex:1;padding:16px;overflow:auto}
    .footer{padding:10px;font-size:.8rem;color:var(--muted);text-align:center;border-top:1px solid var(--line)}
    .practice{display:none;flex-direction:column;gap:12px;max-width:520px;margin:0 auto}
    .shell.mode-practice .learn{display:none}.shell.mode-practice .practice{display:flex}
    .choice{font-family:inherit;font-weight:800;font-size:1.05rem;padding:14px;border:2px solid var(--line);border-radius:12px;background:#fff;cursor:pointer;text-align:left}
    .choice.ok{background:#dcfce7}.choice.no{background:#fee2e2}
    ${bodyCss}
  </style>
</head><body>
<div class="shell" id="shell">
  <header>
    <button type="button" class="btn btn-back" onclick="if(window.KAMPAI&&KAMPAI.goHome)KAMPAI.goHome();else history.back()">← กลับคลังสื่อ</button>
    <h1>${opts.h1}</h1>
    <span class="badge">${opts.badge}</span>
  </header>
  <div class="toolbar">
    <span class="seg" id="modeSeg">
      <button type="button" data-mode="learn" class="on">📖 เรียนรู้</button>
      <button type="button" data-mode="practice">✏️ ฝึก</button>
    </span>
    <p class="hint" id="hintText">สื่อ ป.6 — ไม่เก็บคะแนน</p>
    <button type="button" class="btn btn-ghost" id="btnFs">⛶ เต็มจอ</button>
    <a class="btn btn-ghost" href="${opts.ws}" target="_blank" rel="noopener">📝 เปิดใบงาน</a>
  </div>
  <div class="stage" id="stage">${bodyHtml}</div>
  <div class="footer">โรงเรียนบ้านคำไผ่ · สื่อ ป.6 · Phase 13 · ไม่เก็บคะแนน</div>
</div>
<script>
const MEDIA_SLUG='${opts.slug}';
if(window.KAMPAI){KAMPAI.setSlug(MEDIA_SLUG);if(KAMPAI.sound&&KAMPAI.sound.mountToggles)KAMPAI.sound.mountToggles();}
${script}
document.getElementById('modeSeg').onclick=e=>{
  const b=e.target.closest('button[data-mode]');if(!b)return;
  [...document.querySelectorAll('#modeSeg button')].forEach(x=>x.classList.toggle('on',x===b));
  setMode(b.dataset.mode);
};
document.getElementById('btnFs').onclick=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen?.();else document.exitFullscreen?.();};
</script>
</body></html>`;

function cardPick(opts, items) {
  return shell(
    opts,
    `.pick{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
     .pick button{font-family:inherit;font-weight:800;font-size:1rem;padding:12px 14px;border:2px solid var(--line);border-radius:14px;background:#fff;cursor:pointer;color:var(--deep)}
     .pick button.on{background:var(--deep);color:#fff}
     .box{background:#f8fafc;border:2px solid var(--line);border-radius:16px;padding:18px;font-weight:700;line-height:1.7;font-size:1.1rem}
     .box h2{color:var(--deep);margin-bottom:8px;font-size:1.45rem}
     .emo{font-size:3.2rem;margin-bottom:8px}
     .ex{margin-top:10px;padding:10px 12px;border-radius:12px;background:#fff;border:1px dashed var(--line);font-size:1rem}`,
    `<div class="learn"><div class="pick" id="pick"></div><div class="box" id="box"></div></div>
     <div class="practice"><p style="font-weight:800;font-size:1.15rem;color:var(--deep)" id="prQ"></p><div id="prChoices" style="display:grid;gap:8px"></div><p id="prFb" style="font-weight:800;min-height:24px"></p><button type="button" class="btn btn-primary" id="btnNext">ข้อถัดไป</button></div>`,
    `const ITEMS=${JSON.stringify(items)};
let cur=ITEMS[0];
function setMode(m){document.getElementById('shell').classList.toggle('mode-practice',m==='practice');document.getElementById('hintText').textContent=m==='learn'?'เลือกหัวข้อ · อ่านให้เข้าใจ':'ตอบคำถาม';if(m==='practice')nextPr();}
function render(){
  document.getElementById('pick').innerHTML=ITEMS.map((x,i)=>'<button type="button" data-i="'+i+'" class="'+(x===cur?'on':'')+'">'+(x.emoji?x.emoji+' ':'')+x.name+'</button>').join('');
  document.getElementById('box').innerHTML=(cur.emoji?'<div class="emo">'+cur.emoji+'</div>':'')+'<h2>'+cur.name+'</h2><p>'+cur.body+'</p>'+(cur.tip?'<p style="margin-top:10px;color:var(--muted);font-size:1rem">💡 '+cur.tip+'</p>':'')+(cur.ex?'<div class="ex">'+cur.ex+'</div>':'');
}
document.getElementById('pick').onclick=e=>{const b=e.target.closest('[data-i]');if(!b)return;cur=ITEMS[+b.dataset.i];render();};
function nextPr(){const a=ITEMS[Math.floor(Math.random()*ITEMS.length)];document.getElementById('prQ').textContent=a.q;document.getElementById('prFb').textContent='';
  const opts=new Set([a.a]);while(opts.size<4)opts.add(ITEMS[Math.floor(Math.random()*ITEMS.length)].a);
  const box=document.getElementById('prChoices');box.innerHTML=[...opts].sort(()=>Math.random()-0.5).map(o=>'<button type="button" class="choice">'+o+'</button>').join('');
  box.onclick=e=>{const b=e.target.closest('.choice');if(!b)return;const ok=b.textContent===a.a;b.classList.add(ok?'ok':'no');document.getElementById('prFb').textContent=ok?'✅ เก่งมาก!':'เฉลย: '+a.a;if(KAMPAI&&KAMPAI.sound)(ok?KAMPAI.sound.correct:KAMPAI.sound.wrong)();};}
document.getElementById('btnNext').onclick=nextPr;render();setMode('learn');`
  );
}

function sheet({ dir, file, hub, subject, indicators, icon, title, gradeLabel, mediaLabel, directions, topicOptions, items }) {
  const esc = 'window.KampaiTopicWorksheet.escapeHtml';
  const renderBody = `const e=${esc};return '<div class="work-line reason-line" style="font-size:1.05rem"><div class="prompt"><strong>'+e(item.prompt)+'</strong></div><div class="answer-line" style="min-height:2em">คำตอบ <span class="blank long"></span></div><div class="reason-line" style="min-height:2.2em;border-bottom:2px dotted #94a3b8">วิธีทำ/เหตุผล <span class="blank long"></span></div><div class="answer teacher-answer">เฉลย: '+e(item.answer)+'</div></div>';`;
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
  <select class="t-select" id="selGrade" aria-label="ระดับชั้น"><option value="1">${gradeLabel}</option></select>
  <select class="t-select" id="selTopic" aria-label="ทักษะ">${topicOptions}</select>
  <select class="t-select" id="selCount" aria-label="จำนวนข้อ"><option value="8">8 ข้อ</option><option value="5">5 ข้อ</option><option value="10">10 ข้อ</option></select>
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
document.getElementById('btnRandom').onclick=window.KampaiTopicWorksheet.randomize;
document.getElementById('btnAnswers').onclick=()=>document.body.classList.toggle('show-answers');
document.getElementById('btnPrint').onclick=()=>window.print();
window.KampaiWorksheet.loadTeachers();
window.KampaiTopicWorksheet.render();
</script>
<script src="/games/worksheet-modes.js?v=${V}"></script>
</body></html>`;
  write(`public/games/${dir}/${file}`, html);
}

// —— 1 ร้อยละ·อัตราส่วน ——
write('public/games/math/percent-ratio-media.html', cardPick(
  { title: 'ร้อยละ·อัตราส่วน', h1: '📊 ร้อยละ · อัตราส่วน ป.6', badge: 'ป.6 · คณิตศาสตร์', accent: '#1d4ed8', line: '#bfdbfe', slug: 'percent-ratio-media', ws: '/games/math/percent-ratio-worksheet.html' },
  [
    { emoji: '⚖️', name: 'อัตราส่วน', body: 'อัตราส่วนเปรียบเทียบปริมาณ 2 ปริมาณ เช่น นักเรียนชาย:หญิง = 3:2', tip: 'เขียน a:b หรือ a/b', ex: 'ตัวอย่าง: ไข่ 5 ฟองต่อแป้ง 2 ถ้วย → 5:2', q: 'อัตราส่วนใช้เปรียบเทียบกี่ปริมาณเป็นหลัก?', a: '2 ปริมาณ' },
    { emoji: '🔁', name: 'อัตราส่วนเท่ากัน', body: 'คูณหรือหารทั้งสองข้างด้วยจำนวนเดียวกันได้อัตราส่วนเท่ากัน', tip: '2:3 = 4:6 = 6:9', ex: 'ตรวจ: 2×3=6 และ 3×3=9 → 2:3 = 6:9', q: '2:3 เท่ากับข้อใด?', a: '4:6' },
    { emoji: '%', name: 'ร้อยละคืออะไร', body: 'ร้อยละ (เปอร์เซ็นต์) คือส่วนของร้อย เช่น 25% = 25 ใน 100', tip: 'เปลี่ยนเศษส่วนเป็น % โดยทำให้ส่วนเป็น 100', ex: '1/4 = 25/100 = 25%', q: '25% หมายถึงกี่ส่วนในร้อย?', a: '25' },
    { emoji: '🧮', name: 'หาค่าของร้อยละ', body: 'หา a% ของ N → (a/100)×N', tip: '20% ของ 50 = 10', ex: 'ลดราคา 10% จาก 200 บาท = ลด 20 บาท', q: '20% ของ 50 เท่ากับเท่าใด?', a: '10' },
    { emoji: '📝', name: 'โจทย์อัตราส่วน', body: 'ตั้งอัตราส่วนจากข้อความ แล้วหาค่าที่หายไปด้วยอัตราส่วนเท่ากัน', tip: 'เขียนสัดส่วน a/b = c/d', ex: 'น้ำตาล:แป้ง = 2:5 ถ้าน้ำตาล 6 ช้อน แป้งกี่ช้อน? → 15', q: 'น้ำตาล:แป้ง=2:5 น้ำตาล 6 → แป้ง?', a: '15' },
    { emoji: '📈', name: 'โจทย์ร้อยละ', body: 'อ่านโจทย์หาส่วนเต็ม ส่วนที่สนใจ หรือร้อยละที่หายไป', tip: 'ระบุว่าอะไรคือ 100%', ex: 'สอบได้ 36 จาก 40 → (36/40)×100 = 90%', q: 'ได้ 36 จาก 40 คิดเป็นกี่เปอร์เซ็นต์?', a: '90%' },
  ]
));

// —— 2 สมการอย่างง่าย ——
write('public/games/math/simple-equation-media.html', cardPick(
  { title: 'สมการอย่างง่าย', h1: '🧩 สมการอย่างง่าย · แบบรูป ป.6', badge: 'ป.6 · คณิตศาสตร์', accent: '#7c3aed', line: '#ddd6fe', slug: 'simple-equation-media', ws: '/games/math/simple-equation-worksheet.html' },
  [
    { emoji: '⬜', name: 'หาค่าที่หายไป', body: 'กล่อง □ แทนจำนวนที่ไม่ทราบค่า เช่น □ + 7 = 15 → □ = 8', tip: 'ทำย้อนกลับ: ลบ/หารฝั่งตรงข้าม', ex: '15 − 7 = 8', q: '□ + 7 = 15 ค่า □ คือ?', a: '8' },
    { emoji: '✖️', name: 'สมการคูณหาร', body: '3 × □ = 24 → □ = 8 · □ ÷ 4 = 5 → □ = 20', tip: 'คูณกับหารเป็นคู่ตรงข้าม', ex: '24 ÷ 3 = 8', q: '3 × □ = 24 ค่า □ คือ?', a: '8' },
    { emoji: '🔢', name: 'แบบรูปจำนวน', body: 'หาความสัมพันธ์ของลำดับ เช่น 2, 5, 8, 11 (+3 ทุกครั้ง)', tip: 'เขียนกฎแล้วหาพจน์ถัดไป', ex: 'พจน์ถัดไปของ 2,5,8 คือ 11', q: 'แบบรูป 2,5,8,11 เพิ่มทีละเท่าใด?', a: '3' },
    { emoji: '🧮', name: 'แบบรูป 2 ขั้น', body: 'บางแบบรูปคูณแล้วบวก เช่น ×2 แล้ว +1', tip: 'ทดลองกฎกับ 2–3 พจน์แรก', ex: '1,3,7,15 → ×2+1', q: 'ถ้ากฎคือ ×2+1 เริ่มจาก 1 พจน์ที่ 3 คือ?', a: '7' },
    { emoji: '📦', name: 'สมการ 2 ขั้น', body: '2 × □ + 3 = 11 → 2×□ = 8 → □ = 4', tip: 'แก้ทีละชั้นจากนอกเข้าใน', ex: 'ถอด +3 ก่อน แล้วหารด้วย 2', q: '2 × □ + 3 = 11 ค่า □ คือ?', a: '4' },
    { emoji: '🎯', name: 'ตรวจคำตอบ', body: 'แทนค่า □ กลับสมการ ถ้าซ้าย=ขวา แสดงถูกต้อง', tip: 'อย่าลืมตรวจทุกครั้ง', ex: '□=4 ใน 2×□+3 → 8+3=11 ✓', q: 'ทำไมต้องแทนค่ากลับสมการ?', a: 'เพื่อตรวจคำตอบ' },
  ]
));

// —— 3 โวหาร·วรรณคดี ——
write('public/games/thai/rhetoric-literature-p6-media.html', cardPick(
  { title: 'โวหาร·วรรณคดี', h1: '📜 โวหาร · วรรณคดี ป.6', badge: 'ป.6 · ภาษาไทย', accent: '#b91c1c', line: '#fecaca', slug: 'rhetoric-literature-p6-media', ws: '/games/thai/rhetoric-literature-p6-worksheet.html' },
  [
    { emoji: '✨', name: 'โวหารคืออะไร', body: 'โวหารคือการใช้ภาษาให้สวยงาม มีพลัง หรือสื่อความรู้สึกพิเศษ', tip: 'ไม่ใช่พูดตรง ๆ อย่างเดียว', ex: '“หัวใจสลาย” = โวหารเปรียบเทียบความเสียใจ', q: 'โวหารใช้เพื่ออะไรเป็นหลัก?', a: 'ให้ภาษาสวย/มีพลัง' },
    { emoji: '🪞', name: 'อุปมา·อุปลักษณ์', body: 'อุปมา: เหมือน/ดุจ · อุปลักษณ์: กล่าวว่าเป็นโดยไม่ใช้คำเหมือน', tip: 'ดูคำเชื่อม “เหมือน/ดัง/ดุจ”', ex: 'ใจเย็นเหมือนน้ำแข็ง = อุปมา', q: 'ประโยคมีคำว่า “เหมือน” มักเป็นโวหารใด?', a: 'อุปมา' },
    { emoji: '📚', name: 'วรรณคดี', body: 'วรรณคดีคืองานเขียนที่มีคุณค่าทางวรรณศิลป์และมักเป็นแบบอย่างทางภาษา', tip: 'อ่านแล้ววิเคราะห์ข้อคิด', ex: 'นิทานพื้นบ้าน/กลอนสุภาพ เป็นวรรณกรรมใกล้ตัว', q: 'เมื่ออ่านวรรณคดีควรทำอะไรด้วย?', a: 'แสดงความคิดเห็น/หาข้อคิด' },
    { emoji: '💬', name: 'ข้อคิดจากเรื่อง', body: 'จับใจความ → หาข้อคิด → เชื่อมกับชีวิตจริง', tip: 'ถามว่า “ถ้าเป็นเราจะทำอย่างไร”', ex: 'ความซื่อสัตย์นำมาซึ่งความไว้ใจ', q: 'ข้อคิดจากวรรณคดีควรนำไปใช้ที่ไหน?', a: 'ชีวิตจริง' },
    { emoji: '🗣️', name: 'ความหมายของโวหาร', body: 'อธิบายคำ ประโยค ข้อความที่เป็นโวหารให้เข้าใจความหมายแฝง', tip: 'แยกความหมายตรงกับความหมายแฝง', ex: '“ไฟในอก” = ความโกรธ/ความรักแรง', q: '“ไฟในอก” มักหมายถึงอะไร?', a: 'ความรู้สึกรุนแรง' },
    { emoji: '🏆', name: 'คุณค่าวรรณกรรม', body: 'คุณค่าทางภาษา ความรู้ ความบันเทิง และคุณธรรม', tip: 'บอกได้อย่างน้อย 1 คุณค่าต่อเรื่อง', ex: 'สอนให้รู้จักแบ่งปัน', q: 'คุณค่าวรรณกรรมอย่างหนึ่งคือ?', a: 'คุณธรรม/ข้อคิด' },
  ]
));

// —— 4 ไฟฟ้า·วงจร ——
write('public/games/science/electric-circuit-media.html', cardPick(
  { title: 'ไฟฟ้า·วงจร', h1: '⚡ ไฟฟ้า · วงจรอย่างง่าย ป.6', badge: 'ป.6 · วิทยาศาสตร์', accent: '#ca8a04', line: '#fef08a', slug: 'electric-circuit-media', ws: '/games/science/electric-circuit-worksheet.html' },
  [
    { emoji: '🔋', name: 'ส่วนประกอบวงจร', body: 'วงจรอย่างง่ายมีแหล่งจ่าย (ถ่าน), สายไฟ, สวิตช์, โหลด (หลอด)', tip: 'ขาดชิ้นใดชิ้นหนึ่งอาจไม่ติด', ex: 'ถ่าน → สาย → สวิตช์ → หลอด → กลับถ่าน', q: 'แหล่งจ่ายในวงจรถ่านคืออะไร?', a: 'ถ่าน/เซลล์ไฟฟ้า' },
    { emoji: '🔁', name: 'วงจรปิด·เปิด', body: 'วงจรปิด = กระแสไหลได้ หลอดติด · วงจรเปิด = ขาดช่วง หลอดดับ', tip: 'สวิตช์ทำหน้าที่เปิด/ปิดวงจร', ex: 'เปิดสวิตช์ = วงจรปิด', q: 'หลอดติดเมื่อวงจรเป็นแบบใด?', a: 'วงจรปิด' },
    { emoji: '✏️', name: 'แผนภาพวงจร', body: 'ใช้สัญลักษณ์มาตรฐานแทนถ่าน หลอด สวิตช์ สาย', tip: 'วาดให้ครบและต่อกันเป็นวง', ex: 'หลอด = วงกลมมีกากบาท', q: 'ทำไมต้องเขียนแผนภาพวงจร?', a: 'สื่อสาร/ออกแบบการต่อ' },
    { emoji: '🔗', name: 'อนุกรม', body: 'ต่ออนุกรม = ชิ้นส่วนต่อเรียงเส้นเดียว · หลอดดับดวงหนึ่งอาจดับทั้งวง', tip: 'กระแสเส้นทางเดียว', ex: 'ถ่านหลายก้อนต่ออนุกรมแรงดันรวมเพิ่ม', q: 'ต่อถ่านอนุกรมผลต่อแรงดันโดยทั่วไป?', a: 'แรงดันรวมเพิ่ม' },
    { emoji: '🔀', name: 'ขนาน', body: 'ต่อขนาน = มีทางแยก · หลอดดับดวงหนึ่งอีกดวงอาจยังติด', tip: 'ใช้ในบ้านบ่อย', ex: 'หลอดห้องนอนต่อขนานกัน', q: 'ข้อดีของการต่อหลอดแบบขนาน?', a: 'ดับดวงหนึ่งอีกดวงยังติดได้' },
    { emoji: '🛡️', name: 'ใช้ไฟฟ้าอย่างปลอดภัย', body: 'มือแห้ง ไม่เล่นกับปลั๊ก อย่าต่อวงจรเกินกำลัง', tip: 'ความรู้วงจรต้องคู่ความปลอดภัย', ex: 'ถอดปลั๊กด้วยการจับหัวปลั๊ก', q: 'ข้อปฏิบัติปลอดภัยข้อหนึ่งคือ?', a: 'มือแห้ง/ไม่เล่นปลั๊ก' },
  ]
));

// —— 5 ระบบร่างกาย·สารอาหาร ——
write('public/games/science/body-systems-p6-media.html', cardPick(
  { title: 'ระบบร่างกาย ป.6', h1: '🫀 สารอาหาร · ระบบย่อย ป.6', badge: 'ป.6 · วิทยาศาสตร์', accent: '#be123c', line: '#fecdd3', slug: 'body-systems-p6-media', ws: '/games/science/body-systems-p6-worksheet.html' },
  [
    { emoji: '🥗', name: 'สารอาหารหลัก', body: 'คาร์โบไฮเดรต โปรตีน ไขมัน วิตามิน แร่ธาตุ น้ำ — แต่ละชนิดมีประโยชน์ต่างกัน', tip: 'กินครบสัดส่วนตามเพศวัย', ex: 'ข้าว = พลังงาน · เนื้อไข่ = ซ่อมแซม', q: 'โปรตีนมีประโยชน์หลักอย่างไร?', a: 'ซ่อมแซม/สร้างกล้ามเนื้อ' },
    { emoji: '🍽️', name: 'เลือกอาหารปลอดภัย', body: 'เลือกอาหารสด สะอาด สัดส่วนเหมาะ ไม่หวานเค็มมันเกิน', tip: 'อ่านฉลากเมื่อซื้อของสำเร็จรูป', ex: 'ผักผลไม้ทุกมื้อ', q: 'การเลือกอาหารควรคำนึงถึงอะไร?', a: 'ครบถ้วนและปลอดภัย' },
    { emoji: '👄', name: 'เริ่มที่ย่อย', body: 'ปากเคี้ยว+น้ำลาย · หลอดอาหาร · กระเพาะ · ลำไส้เล็กดูดซึม · ลำไส้ใหญ่', tip: 'เคี้ยวให้ละเอียดช่วยย่อย', ex: 'กระเพาะมีน้ำย่อยช่วยย่อยโปรตีน', q: 'การดูดซึมสารอาหารเกิดที่ใดเป็นหลัก?', a: 'ลำไส้เล็ก' },
    { emoji: '🧪', name: 'หน้าที่อวัยวะ', body: 'แต่ละอวัยวะในระบบย่อยมีหน้าที่เฉพาะ ทำงานต่อเนื่องเป็นระบบ', tip: 'จำลำดับทางเดินอาหาร', ex: 'ลำไส้ใหญ่ดูดน้ำและสร้างอุจจาระ', q: 'ลำไส้ใหญ่ทำหน้าที่สำคัญข้อใด?', a: 'ดูดน้ำ' },
    { emoji: '💚', name: 'ดูแลระบบย่อย', body: 'กินสุก สะอาด เคี้ยวดี ดื่มน้ำ พักผ่อน ไม่กินจุกจิกเกิน', tip: 'ปวดท้องบ่อยควรปรึกษาผู้ใหญ่/แพทย์', ex: 'ล้างมือก่อนกิน', q: 'วิธีดูแลระบบย่อยข้อหนึ่งคือ?', a: 'เคี้ยวให้ละเอียด/กินสะอาด' },
    { emoji: '🧱', name: 'แบบจำลองระบบย่อย', body: 'สร้างแบบจำลองช่วยอธิบายลำดับและหน้าที่อวัยวะ', tip: 'ใช้ภาพหรือของจำลองเรียงลำดับ', ex: 'ติดป้ายชื่ออวัยวะบนแผนภาพ', q: 'แบบจำลองช่วยให้นักเรียนทำอะไร?', a: 'อธิบายระบบย่อยได้ชัด' },
  ]
));

// —— 6 English tenses ——
write('public/games/english/english-tenses-p6-media.html', cardPick(
  { title: 'Tenses ป.6', h1: '⏱️ Tenses รวม ป.6', badge: 'ป.6 · English', accent: '#0369a1', line: '#bae6fd', slug: 'english-tenses-p6-media', ws: '/games/english/english-tenses-p6-worksheet.html' },
  [
    { emoji: '1️⃣', name: 'Present Simple', body: 'Habit / fact: I play football. She plays football.', tip: 'He/She/It → verb+s', ex: 'The sun rises in the east.', q: 'She ___ football every day. (play)', a: 'plays' },
    { emoji: '2️⃣', name: 'Present Continuous', body: 'Now: I am reading. They are playing.', tip: 'be + V-ing', ex: 'Look! It is raining.', q: 'I ___ reading now. (am/is/are)', a: 'am' },
    { emoji: '3️⃣', name: 'Past Simple', body: 'Finished past: I played yesterday. She went home.', tip: 'regular +ed / irregular forms', ex: 'go → went, eat → ate', q: 'Yesterday I ___ to school. (go)', a: 'went' },
    { emoji: '4️⃣', name: 'Future (will)', body: 'Will + V1: I will help you. It will rain.', tip: 'decisions / predictions', ex: 'I think it will be sunny.', q: 'I ___ help you. (will)', a: 'will' },
    { emoji: '🔀', name: 'เลือกกาลให้ถูก', body: 'ดูคำบอกเวลา: every day / now / yesterday / tomorrow', tip: 'time words = tense clues', ex: 'now → continuous · yesterday → past', q: 'คำว่า yesterday มักใช้กับกาลใด?', a: 'Past Simple' },
    { emoji: '✍️', name: 'เขียนสั้น ๆ', body: 'พูด/เขียนเกี่ยวกับตนเอง ครอบครัว กิจกรรมใกล้ตัวด้วยกาลที่ถูก', tip: 'เริ่มจากประโยคสั้น 1 ประโยคต่อกาล', ex: 'I study English every day.', q: 'Present Simple ใช้กับสถานการณ์ใด?', a: 'นิสัย/ข้อเท็จจริง' },
  ]
));

// —— 7 English reading ——
write('public/games/english/english-reading-p6-media.html', cardPick(
  { title: 'Reading ป.6', h1: '📖 Reading Comprehension ป.6', badge: 'ป.6 · English', accent: '#0f766e', line: '#99f6e4', slug: 'english-reading-p6-media', ws: '/games/english/english-reading-p6-worksheet.html' },
  [
    { emoji: '👂', name: 'Follow instructions', body: 'Read and do: Open your book. Circle the word. Draw a line.', tip: 'หา action verbs', ex: 'Underline the title.', q: 'คำสั่ง “Circle the word” แปลว่า?', a: 'วงกลมคำ' },
    { emoji: '🔤', name: 'Read aloud', body: 'อ่านข้อความสั้น นิทาน บทกลอนให้ออกเสียงชัด', tip: 'หยุดตามเครื่องหมายวรรคตอน', ex: 'Once upon a time…', q: 'เมื่ออ่านออกเสียงควรทำอย่างไร?', a: 'ชัดและถูกหลัก' },
    { emoji: '🖼️', name: 'Match text–picture', body: 'เลือกประโยคให้ตรงภาพ/สัญลักษณ์', tip: 'หา keyword ในประโยค', ex: 'A boy is running. → ภาพเด็กวิ่ง', q: 'วิธีจับคู่ประโยคกับภาพคือ?', a: 'หาคำสำคัญ' },
    { emoji: '🎯', name: 'Main idea', body: 'ใจความสำคัญ = สิ่งที่เรื่องพูดถึงเป็นหลัก', tip: 'ถาม Who? What? Where?', ex: 'เรื่องเกี่ยวกับการช่วยเพื่อน', q: 'ใจความสำคัญคืออะไร?', a: 'ประเด็นหลักของเรื่อง' },
    { emoji: '❓', name: 'Answer questions', body: 'ตอบคำถามจากเรื่องที่อ่าน/ฟัง: Who did what?', tip: 'กลับไปหาหลักฐานในข้อความ', ex: 'Where did Mia go? → to the park', q: 'ก่อนตอบควหาก่อน?', a: 'หลักฐานในข้อความ' },
    { emoji: '📝', name: 'Short retell', body: 'เล่า/เขียนสรุปสั้น ๆ 2–3 ประโยค', tip: 'beginning → middle → end', ex: 'First… Then… Finally…', q: 'สรุปเรื่องสั้นควรมีกี่ส่วนคร่าว ๆ?', a: 'ต้น-กลาง-จบ' },
  ]
));

// —— 8 เศรษฐศาสตร์ ป.6 ——
write('public/games/social/economics-p6-media.html', cardPick(
  { title: 'เศรษฐศาสตร์ ป.6', h1: '💹 เศรษฐศาสตร์ ป.6', badge: 'ป.6 · สังคมศึกษา', accent: '#047857', line: '#a7f3d0', slug: 'economics-p6-media', ws: '/games/social/economics-p6-worksheet.html' },
  [
    { emoji: '🏭', name: 'ผู้ผลิตที่รับผิดชอบ', body: 'ผลิตสินค้าปลอดภัย ไม่หลอกลวง ดูแลสิ่งแวดล้อม', tip: 'คุณภาพ + จริยธรรม', ex: 'ติดฉลากส่วนประกอบครบ', q: 'ผู้ผลิตที่รับผิดชอบควรทำอย่างไร?', a: 'ผลิตปลอดภัย/ไม่หลอกลวง' },
    { emoji: '🛒', name: 'ผู้บริโภครู้เท่าทัน', body: 'เปรียบเทียบราคา คุณภาพ อ่านฉลาก ไม่เชื่อโฆษณาเกินจริง', tip: 'สิทธิผู้บริโภค', ex: 'เช็กวันหมดอายุก่อนซื้อ', q: 'ผู้บริโภครู้เท่าทันควรทำอะไรก่อนซื้อ?', a: 'เปรียบเทียบ/อ่านฉลาก' },
    { emoji: '🌱', name: 'ใช้ทรัพยากรยั่งยืน', body: 'ใช้พอดี ลด ใช้ซ้ำ รีไซเคิล เลือกวัสดุที่เป็นมิตร', tip: 'ทรัพยากรมีจำกัด', ex: 'พกถุงผ้า ลดพลาสติก', q: 'การใช้ทรัพยากรอย่างยั่งยืนหมายถึง?', a: 'ใช้พอดีและรักษ์โลก' },
    { emoji: '🏦', name: 'ผู้ผลิต·ผู้บริโภค·ธนาคาร·รัฐ', body: 'เกี่ยวข้องกัน: ผลิต→ขาย→ซื้อ→ออม/กู้→ภาษี/บริการรัฐ', tip: 'มองเป็นระบบ', ex: 'ร้านฝากเงินธนาคาร · รัฐเก็บภาษีให้บริการ', q: 'ธนาคารเกี่ยวข้องอย่างไร?', a: 'ออม/กู้/บริการการเงิน' },
    { emoji: '🤝', name: 'รวมกลุ่มเศรษฐกิจท้องถิ่น', body: 'กลุ่มอาชีพ วิสาหกิจชุมชน สหกรณ์ ช่วยเพิ่มอำนาจต่อรอง', tip: 'ร่วมมือกันในชุมชน', ex: 'กลุ่มทอผ้าพื้นบ้าน', q: 'ตัวอย่างการรวมกลุ่มทางเศรษฐกิจ?', a: 'วิสาหกิจชุมชน/สหกรณ์' },
    { emoji: '🧭', name: 'ตัดสินใจทางเศรษฐกิจ', body: 'ชั่งน้ำหนักความต้องการ ความจำเป็น ผลกระทบระยะยาว', tip: 'คิดก่อนซื้อ', ex: 'ออมก่อนซื้อของฟุ่มเฟือย', q: 'ก่อนใช้จ่ายควรถามอะไร?', a: 'จำเป็นหรืออยากได้' },
  ]
));

const sheets = [
  {
    dir: 'math', file: 'percent-ratio-worksheet.html', hub: '/games/math/percent-ratio-media.html',
    subject: 'คณิตศาสตร์', indicators: ['ค 1.1 ป.6/2', 'ค 1.1 ป.6/11', 'ค 1.1 ป.6/12'],
    icon: '📊', title: 'ใบงานร้อยละ·อัตราส่วน', gradeLabel: 'ป.6', mediaLabel: 'สื่อร้อยละ·อัตราส่วน',
    directions: 'แสดงวิธีทำอัตราส่วน/ร้อยละ · เขียนขั้นตอนให้ชัด',
    topicOptions: '<option value="mixed">รวม</option><option value="ratio">อัตราส่วน</option><option value="percent">ร้อยละ</option>',
    items: [
      { type: 'ratio', prompt: 'เขียนอัตราส่วน ชาย 12 คน หญิง 8 คน', answer: '12:8 หรือ 3:2' },
      { type: 'ratio', prompt: '2:5 เท่ากับข้อใดเมื่อคูณ 3', answer: '6:15' },
      { type: 'ratio', prompt: 'น้ำตาล:แป้ง=2:5 น้ำตาล 8 ช้อน แป้งกี่ช้อน', answer: '20' },
      { type: 'percent', prompt: '25% เท่ากับเศษส่วนอย่างต่ำ', answer: '1/4' },
      { type: 'percent', prompt: 'หา 20% ของ 150', answer: '30' },
      { type: 'percent', prompt: 'ได้ 45 จาก 50 คิดเป็นกี่เปอร์เซ็นต์', answer: '90%' },
      { type: 'ratio', prompt: 'ของผสม A:B=3:4 ถ้า A=9 หา B', answer: '12' },
      { type: 'percent', prompt: 'ลดราคา 10% จาก 280 บาท ลดกี่บาท', answer: '28' },
      { type: 'percent', prompt: 'ราคาหลังลด 10% จาก 200 บาท', answer: '180' },
      { type: 'ratio', prompt: 'อธิบายความหมายอัตราส่วน 4:1', answer: '4 ส่วนต่อ 1 ส่วน' },
      { type: 'percent', prompt: 'โจทย์: นักเรียน 40 คน มา 90% มากี่คน', answer: '36' },
      { type: 'ratio', prompt: 'หาอัตราส่วนเท่ากับ 3:7 โดยคูณ 2', answer: '6:14' },
      { type: 'percent', prompt: 'ส่วนลด 15% ของ 400', answer: '60' },
      { type: 'ratio', prompt: 'แผนที่ 1:1000 ระยะจริง 5 ซม. บนแผนที่กี่ซม. (ถ้าใช้สเกลนี้กลับกันให้อธิบาย)', answer: 'ตามวิธี / ตรวจครู' },
      { type: 'percent', prompt: 'สรุปขั้นตอนหา a% ของ N', answer: '(a/100)×N' },
      { type: 'ratio', prompt: 'ตั้งโจทย์อัตราส่วน 1 ข้อแล้วแก้', answer: 'ตามนักเรียน' },
    ],
  },
  {
    dir: 'math', file: 'simple-equation-worksheet.html', hub: '/games/math/simple-equation-media.html',
    subject: 'คณิตศาสตร์', indicators: ['ค 1.2 ป.6/1'],
    icon: '🧩', title: 'ใบงานสมการอย่างง่าย', gradeLabel: 'ป.6', mediaLabel: 'สื่อสมการอย่างง่าย',
    directions: 'หาค่าที่หายไป / แบบรูป · แสดงวิธีคิดและตรวจคำตอบ',
    topicOptions: '<option value="mixed">รวม</option><option value="eq">สมการ</option><option value="pat">แบบรูป</option>',
    items: [
      { type: 'eq', prompt: '□ + 9 = 20', answer: '11' },
      { type: 'eq', prompt: '□ − 6 = 14', answer: '20' },
      { type: 'eq', prompt: '5 × □ = 35', answer: '7' },
      { type: 'eq', prompt: '□ ÷ 4 = 9', answer: '36' },
      { type: 'eq', prompt: '2 × □ + 5 = 17', answer: '6' },
      { type: 'pat', prompt: 'แบบรูป 3,6,9,12 พจน์ถัดไป', answer: '15' },
      { type: 'pat', prompt: 'แบบรูป 2,4,8,16 พจน์ถัดไป', answer: '32' },
      { type: 'eq', prompt: 'ตรวจ: ถ้า □=4 ใน 3×□−2 ได้เท่าใด', answer: '10' },
      { type: 'pat', prompt: 'หาความสัมพันธ์ 5,8,11,14', answer: '+3' },
      { type: 'eq', prompt: '□/2 + 3 = 10', answer: '14' },
      { type: 'pat', prompt: '1,3,7,15 กฎคืออะไร', answer: '×2+1' },
      { type: 'eq', prompt: 'สร้างสมการที่มีคำตอบ 8', answer: 'ตามนักเรียน' },
      { type: 'eq', prompt: '7 + □ = 7 × 2', answer: '7' },
      { type: 'pat', prompt: 'วาดแบบรูปรูปเรขาคณิต 4 พจน์', answer: 'ตามนักเรียน' },
      { type: 'eq', prompt: 'อธิบายวิธีแก้ 4×□=28', answer: 'หารทั้งสองข้างด้วย 4' },
      { type: 'pat', prompt: 'พจน์ที่ 5 ของ 10,20,30,40', answer: '50' },
    ],
  },
  {
    dir: 'thai', file: 'rhetoric-literature-p6-worksheet.html', hub: '/games/thai/rhetoric-literature-p6-media.html',
    subject: 'ภาษาไทย', indicators: ['ท 1.1 ป.6/2', 'ท 5.1 ป.6/1', 'ท 5.1 ป.6/3'],
    icon: '📜', title: 'ใบงานโวหาร·วรรณคดี', gradeLabel: 'ป.6', mediaLabel: 'สื่อโวหาร·วรรณคดี',
    directions: 'อธิบายโวหาร · แสดงความคิดเห็นและข้อคิดจากวรรณกรรม',
    topicOptions: '<option value="mixed">รวม</option><option value="rhetoric">โวหาร</option><option value="lit">วรรณคดี</option>',
    items: [
      { type: 'rhetoric', prompt: 'โวหารคืออะไร อธิบายสั้น ๆ', answer: 'การใช้ภาษาให้สวย/มีพลัง' },
      { type: 'rhetoric', prompt: '“ใจเย็นเหมือนน้ำแข็ง” เป็นโวหารแบบใด', answer: 'อุปมา' },
      { type: 'rhetoric', prompt: 'อธิบายความหมาย “ไฟในอก”', answer: 'ความรู้สึกรุนแรง' },
      { type: 'lit', prompt: 'วรรณคดีต่างจากข้อความทั่วไปอย่างไร', answer: 'มีคุณค่าทางวรรณศิลป์' },
      { type: 'lit', prompt: 'เล่าข้อคิดจากนิทานที่เคยอ่าน 1 ข้อ', answer: 'ตามนักเรียน' },
      { type: 'rhetoric', prompt: 'แต่งประโยคอุปมา 1 ประโยค', answer: 'ตามนักเรียน' },
      { type: 'lit', prompt: 'คุณค่าของวรรณกรรมที่อ่านได้แก่อะไร', answer: 'คุณธรรม/ความรู้/ภาษา' },
      { type: 'rhetoric', prompt: 'แยกความหมายตรง/แฝงของ “หน้าตาย”', answer: 'ไม่แสดงอารมณ์' },
      { type: 'lit', prompt: 'แสดงความคิดเห็นต่อตัวละครในเรื่องที่อ่าน', answer: 'ตามนักเรียน' },
      { type: 'lit', prompt: 'นำข้อคิดไปใช้ในชีวิตได้อย่างไร', answer: 'ตามนักเรียน' },
      { type: 'rhetoric', prompt: 'หาโวหารจากเพลง/กลอน 1 ตัวอย่าง', answer: 'ตามนักเรียน' },
      { type: 'lit', prompt: 'สรุปใจความเรื่องสั้นที่อ่าน', answer: 'ตามนักเรียน' },
      { type: 'rhetoric', prompt: 'ทำไมต้องอธิบายข้อความที่เป็นโวหาร', answer: 'เข้าใจความหมายแฝง' },
      { type: 'lit', prompt: 'นิทานพื้นบ้านท้องถิ่นสอนอะไร', answer: 'ตามท้องถิ่น' },
      { type: 'rhetoric', prompt: 'วงคำที่เป็นโวหารในประโยคที่ครูให้', answer: 'ตามข้อสอบ' },
      { type: 'lit', prompt: 'เปรียบเทียบคุณค่า 2 เรื่องสั้น ๆ', answer: 'ตามนักเรียน' },
    ],
  },
  {
    dir: 'science', file: 'electric-circuit-worksheet.html', hub: '/games/science/electric-circuit-media.html',
    subject: 'วิทยาศาสตร์', indicators: ['ว 2.3 ป.6/1', 'ว 2.3 ป.6/2', 'ว 2.3 ป.6/4'],
    icon: '⚡', title: 'ใบงานไฟฟ้า·วงจร', gradeLabel: 'ป.6', mediaLabel: 'สื่อไฟฟ้า·วงจร',
    directions: 'ระบุส่วนประกอบ · วาดแผนภาพ · อธิบายอนุกรม/ขนานและความปลอดภัย',
    topicOptions: '<option value="mixed">รวม</option><option value="parts">ส่วนประกอบ</option><option value="wire">การต่อ</option>',
    items: [
      { type: 'parts', prompt: 'ส่วนประกอบวงจรอย่างง่ายมีอะไรบ้าง', answer: 'ถ่าน สาย สวิตช์ หลอด' },
      { type: 'parts', prompt: 'วงจรปิดหมายความว่าอย่างไร', answer: 'กระแสไหลได้/หลอดติด' },
      { type: 'wire', prompt: 'วาดแผนภาพวงจรอย่างง่าย 1 วง', answer: 'ตามแผนภาพนักเรียน' },
      { type: 'wire', prompt: 'ต่อถ่านอนุกรมมีผลอย่างไร', answer: 'แรงดันรวมเพิ่ม' },
      { type: 'wire', prompt: 'ข้อดีต่อหลอดแบบขนาน', answer: 'ดับดวงหนึ่งอีกดวงยังติด' },
      { type: 'parts', prompt: 'สวิตช์ทำหน้าที่อะไร', answer: 'เปิด/ปิดวงจร' },
      { type: 'wire', prompt: 'เปรียบเทียบอนุกรมกับขนานสั้น ๆ', answer: 'เส้นทางเดียว vs มีทางแยก' },
      { type: 'parts', prompt: 'โหลดในวงจรหลอดคืออะไร', answer: 'หลอดไฟ' },
      { type: 'wire', prompt: 'ยกประโยชน์ความรู้ต่อเซลล์อนุกรม', answer: 'ใช้กับอุปกรณ์ที่ต้องการแรงดันสูงขึ้น' },
      { type: 'parts', prompt: 'ทำไมมือเปียกห้ามเล่นปลั๊ก', answer: 'อันตราย/ไฟดูด' },
      { type: 'wire', prompt: 'ถ้าสายขาดหนึ่งเส้นหลอดจะเป็นอย่างไร', answer: 'ดับ (วงจรเปิด)' },
      { type: 'parts', prompt: 'สัญลักษณ์หลอดในแผนภาพคืออะไร', answer: 'วงกลมมีกากบาท' },
      { type: 'wire', prompt: 'ออกแบบวงจรมีสวิตช์และหลอด 2 ดวง', answer: 'ตามนักเรียน' },
      { type: 'parts', prompt: 'แหล่งจ่ายพลังงานในวงจรถ่าน', answer: 'ถ่าน/เซลล์' },
      { type: 'wire', prompt: 'สรุปความปลอดภัย 2 ข้อ', answer: 'มือแห้ง ไม่เล่นปลั๊ก ฯลฯ' },
      { type: 'parts', prompt: 'อธิบายจากหลักฐานเชิงประจักษ์ที่ทดลอง', answer: 'ตามการทดลอง' },
    ],
  },
  {
    dir: 'science', file: 'body-systems-p6-worksheet.html', hub: '/games/science/body-systems-p6-media.html',
    subject: 'วิทยาศาสตร์', indicators: ['ว 1.2 ป.6/1', 'ว 1.2 ป.6/4', 'ว 1.2 ป.6/5'],
    icon: '🫀', title: 'ใบงานสารอาหาร·ระบบย่อย', gradeLabel: 'ป.6', mediaLabel: 'สื่อระบบร่างกาย ป.6',
    directions: 'ระบุสารอาหาร · เรียงอวัยวะระบบย่อย · เสนอแนวทางดูแล',
    topicOptions: '<option value="mixed">รวม</option><option value="food">สารอาหาร</option><option value="digest">ระบบย่อย</option>',
    items: [
      { type: 'food', prompt: 'สารอาหารหลักมีอะไรบ้าง', answer: 'คาร์โบฯ โปรตีน ไขมัน วิตามิน แร่ธาตุ น้ำ' },
      { type: 'food', prompt: 'โปรตีนมีประโยชน์อย่างไร', answer: 'ซ่อมแซม/สร้างกล้ามเนื้อ' },
      { type: 'digest', prompt: 'เรียงลำดับทางเดินอาหารสั้น ๆ', answer: 'ปาก→หลอดอาหาร→กระเพาะ→ลำไส้' },
      { type: 'digest', prompt: 'การดูดซึมเกิดที่ใดเป็นหลัก', answer: 'ลำไส้เล็ก' },
      { type: 'digest', prompt: 'ลำไส้ใหญ่ทำหน้าที่ใด', answer: 'ดูดน้ำ' },
      { type: 'food', prompt: 'เลือกอาหารให้เหมาะเพศวัยหมายความว่า', answer: 'สัดส่วนเหมาะสมและปลอดภัย' },
      { type: 'digest', prompt: 'แนวทางดูแลระบบย่อย 2 ข้อ', answer: 'เคี้ยวดี กินสะอาด ดื่มน้ำ' },
      { type: 'food', prompt: 'ยกตัวอย่างอาหารให้พลังงาน', answer: 'ข้าว/ขนมปัง' },
      { type: 'digest', prompt: 'ทำไมต้องเคี้ยวให้ละเอียด', answer: 'ช่วยย่อย' },
      { type: 'food', prompt: 'บันทึกอาหารมื้อกลางวันแล้วระบุสารอาหาร', answer: 'ตามนักเรียน' },
      { type: 'digest', prompt: 'วาดแบบจำลองระบบย่อยติดป้าย', answer: 'ตามนักเรียน' },
      { type: 'digest', prompt: 'กระเพาะช่วยย่อยสารอาหารประเภทใดเด่น', answer: 'โปรตีน' },
      { type: 'food', prompt: 'อันตรายของการกินหวานเค็มมันเกิน', answer: 'สุขภาพเสีย' },
      { type: 'digest', prompt: 'ถ้าปวดท้องบ่อยควรทำอย่างไร', answer: 'บอกผู้ใหญ่/พบแพทย์' },
      { type: 'food', prompt: 'น้ำมีความสำคัญอย่างไร', answer: 'หล่อเลี้ยงร่างกาย' },
      { type: 'digest', prompt: 'สรุปหน้าที่อวัยวะในระบบย่อย 3 อวัยวะ', answer: 'ตามสื่อ' },
    ],
  },
  {
    dir: 'english', file: 'english-tenses-p6-worksheet.html', hub: '/games/english/english-tenses-p6-media.html',
    subject: 'ภาษาอังกฤษ', indicators: ['ต 1.2 ป.6/1', 'ต 1.2 ป.6/4', 'ต 2.2 ป.6/1'],
    icon: '⏱️', title: 'ใบงาน Tenses ป.6', gradeLabel: 'ป.6', mediaLabel: 'สื่อ Tenses',
    directions: 'เลือกกาลให้ถูก · เขียนประโยคสั้นเกี่ยวกับตนเอง',
    topicOptions: '<option value="mixed">รวม</option><option value="form">รูปกาล</option><option value="use">ใช้จริง</option>',
    items: [
      { type: 'form', prompt: 'She ___ (play) football every day.', answer: 'plays' },
      { type: 'form', prompt: 'I ___ (be) reading now.', answer: 'am' },
      { type: 'form', prompt: 'Yesterday I ___ (go) to school.', answer: 'went' },
      { type: 'form', prompt: 'I ___ help you tomorrow. (will)', answer: 'will' },
      { type: 'use', prompt: 'เขียน Present Simple 1 ประโยคเกี่ยวกับนิสัย', answer: 'ตามนักเรียน' },
      { type: 'use', prompt: 'เขียน Past Simple 1 ประโยคเกี่ยวกับเมื่อวาน', answer: 'ตามนักเรียน' },
      { type: 'form', prompt: 'They ___ playing now. (is/are)', answer: 'are' },
      { type: 'use', prompt: 'วงคำบอกเวลา: yesterday / now / every day', answer: 'past / continuous / present' },
      { type: 'form', prompt: 'go ในอดีตคือ', answer: 'went' },
      { type: 'use', prompt: 'แต่งประโยค will เกี่ยวกับแผนวันหยุด', answer: 'ตามนักเรียน' },
      { type: 'form', prompt: 'He ___ (eat) breakfast every morning.', answer: 'eats' },
      { type: 'use', prompt: 'อธิบายความต่าง Present vs Past สั้น ๆ', answer: 'ปัจจุบันนิสัย vs อดีตจบแล้ว' },
      { type: 'form', prompt: 'Look! It ___ raining. (is)', answer: 'is' },
      { type: 'use', prompt: 'แก้ประโยคผิด: She play football.', answer: 'She plays football.' },
      { type: 'form', prompt: 'We ___ (watch) TV yesterday.', answer: 'watched' },
      { type: 'use', prompt: 'เขียน 3 ประโยค คนละกาล', answer: 'ตามนักเรียน' },
    ],
  },
  {
    dir: 'english', file: 'english-reading-p6-worksheet.html', hub: '/games/english/english-reading-p6-media.html',
    subject: 'ภาษาอังกฤษ', indicators: ['ต 1.1 ป.6/2', 'ต 1.1 ป.6/3', 'ต 1.1 ป.6/4'],
    icon: '📖', title: 'ใบงาน Reading ป.6', gradeLabel: 'ป.6', mediaLabel: 'สื่อ Reading',
    directions: 'อ่านข้อความสั้น · ตอบคำถาม · จับใจความ',
    topicOptions: '<option value="mixed">รวม</option><option value="comp">เข้าใจเรื่อง</option><option value="skill">ทักษะอ่าน</option>',
    items: [
      { type: 'skill', prompt: 'แปลคำสั่ง: Underline the title', answer: 'ขีดเส้นใต้ชื่อเรื่อง' },
      { type: 'comp', prompt: 'ใจความสำคัญหมายถึงอะไร', answer: 'ประเด็นหลักของเรื่อง' },
      { type: 'skill', prompt: 'อ่านออกเสียงควรทำอย่างไร', answer: 'ชัดและถูกหลัก' },
      { type: 'comp', prompt: 'ก่อนตอบคำถามจากเรื่องควรทำอะไร', answer: 'หากหลักฐานในข้อความ' },
      { type: 'skill', prompt: 'จับคู่ประโยคกับภาพใช้วิธีใด', answer: 'หาคำสำคัญ' },
      { type: 'comp', prompt: 'อ่านเรื่องสั้นแล้วตอบ Who / Where', answer: 'ตามเรื่อง' },
      { type: 'skill', prompt: 'Circle the word แปลว่า', answer: 'วงกลมคำ' },
      { type: 'comp', prompt: 'สรุปเรื่อง 3 ประโยค (ต้น-กลาง-จบ)', answer: 'ตามนักเรียน' },
      { type: 'comp', prompt: 'ข้อความตรงภาพเด็กวิ่ง ข้อใดเหมาะ', answer: 'A boy is running.' },
      { type: 'skill', prompt: 'เครื่องหมายวรรคตอนช่วยการอ่านอย่างไร', answer: 'บอกจังหวะหยุด' },
      { type: 'comp', prompt: 'ตั้งคำถามจากเรื่อง 1 ข้อ', answer: 'ตามนักเรียน' },
      { type: 'skill', prompt: 'ปฏิบัติตามคำสั่ง: Draw a line under…', answer: 'ทำตามคำสั่ง' },
      { type: 'comp', prompt: 'บอกใจความจากนิทานสั้นที่ครูให้อ่าน', answer: 'ตามเรื่อง' },
      { type: 'skill', prompt: 'เลือกประโยคให้ตรงสัญลักษณ์ห้าม', answer: 'Do not… / No…' },
      { type: 'comp', prompt: 'ตอบคำถาม: What happened first?', answer: 'ตามเรื่อง' },
      { type: 'comp', prompt: 'เขียน retell สั้น ๆ ภาษาอังกฤษ', answer: 'ตามนักเรียน' },
    ],
  },
  {
    dir: 'social', file: 'economics-p6-worksheet.html', hub: '/games/social/economics-p6-media.html',
    subject: 'สังคมศึกษา', indicators: ['ส 3.1 ป.6/1', 'ส 3.1 ป.6/2', 'ส 3.1 ป.6/3', 'ส 3.2 ป.6/1'],
    icon: '💹', title: 'ใบงานเศรษฐศาสตร์ ป.6', gradeLabel: 'ป.6', mediaLabel: 'สื่อเศรษฐศาสตร์',
    directions: 'อธิบายบทบาทผู้ผลิต/ผู้บริโภค · ทรัพยากรยั่งยืน · ความสัมพันธ์ทางเศรษฐกิจ',
    topicOptions: '<option value="mixed">รวม</option><option value="role">บทบาท</option><option value="sustain">ยั่งยืน</option>',
    items: [
      { type: 'role', prompt: 'ผู้ผลิตที่รับผิดชอบควรทำอย่างไร', answer: 'ผลิตปลอดภัย ไม่หลอกลวง' },
      { type: 'role', prompt: 'ผู้บริโภครู้เท่าทันทำอะไรก่อนซื้อ', answer: 'เปรียบเทียบ/อ่านฉลาก' },
      { type: 'sustain', prompt: 'ใช้ทรัพยากรอย่างยั่งยืนหมายถึง', answer: 'ใช้พอดี รักษ์โลก' },
      { type: 'role', prompt: 'ธนาคารเกี่ยวข้องกับผู้บริโภคอย่างไร', answer: 'ออม/กู้/บริการการเงิน' },
      { type: 'role', prompt: 'ยกตัวอย่างการรวมกลุ่มเศรษฐกิจท้องถิ่น', answer: 'วิสาหกิจชุมชน/สหกรณ์' },
      { type: 'sustain', prompt: 'ลด ใช้ซ้ำ รีไซเคิล ช่วยอะไร', answer: 'ประหยัดทรัพยากร' },
      { type: 'role', prompt: 'รัฐบาลเกี่ยวข้องอย่างไรในระบบเศรษฐกิจ', answer: 'ภาษี/บริการสาธารณะ' },
      { type: 'sustain', prompt: 'ยกพฤติกรรมรักษ์ทรัพยากร 2 ข้อ', answer: 'ถุงผ้า ปิดไฟ ฯลฯ' },
      { type: 'role', prompt: 'สิทธิผู้บริโภคข้อหนึ่งคือ', answer: 'ได้ข้อมูลถูกต้อง/ปลอดภัย' },
      { type: 'role', prompt: 'วาดแผนภาพผู้ผลิต-ผู้บริโภค-ธนาคาร-รัฐ', answer: 'ตามนักเรียน' },
      { type: 'sustain', prompt: 'ทำไมทรัพยากรจึงต้องใช้แบบยั่งยืน', answer: 'มีจำกัด' },
      { type: 'role', prompt: 'โฆษณาเกินจริงควรตอบสนองอย่างไร', answer: 'ไม่หลงเชื่อ ตรวจสอบ' },
      { type: 'role', prompt: 'เปรียบเทียบร้านค้าซื่อสัตย์กับไม่ซื่อสัตย์', answer: 'ตามนักเรียน' },
      { type: 'sustain', prompt: 'โครงการโรงเรียนที่ช่วยใช้ทรัพยากรดี', answer: 'ตามบริบทโรงเรียน' },
      { type: 'role', prompt: 'สรุปความสัมพันธ์ 4 ฝ่ายสั้น ๆ', answer: 'ผลิต ขาย ซื้อ ออม/ภาษี' },
      { type: 'sustain', prompt: 'ตั้งเป้าหมายส่วนตัวเรื่องการใช้จ่าย 1 ข้อ', answer: 'ตามนักเรียน' },
    ],
  },
];

for (const s of sheets) sheet(s);

const covers = [
  { out: 'public/games/math/percent-ratio-media-cover.png', title: 'ร้อยละ · อัตราส่วน', subtitle: 'โจทย์ ป.6 · วิธีคิดชัด', emoji: '📊', c1: '#dbeafe', c2: '#3b82f6', ink: '#1e3a8a' },
  { out: 'public/games/math/simple-equation-media-cover.png', title: 'สมการอย่างง่าย', subtitle: 'หาค่าหาย · แบบรูป', emoji: '🧩', c1: '#ede9fe', c2: '#8b5cf6', ink: '#4c1d95' },
  { out: 'public/games/thai/rhetoric-literature-p6-media-cover.png', title: 'โวหาร · วรรณคดี', subtitle: 'ความหมายแฝง · ข้อคิด', emoji: '📜', c1: '#fee2e2', c2: '#f87171', ink: '#7f1d1d' },
  { out: 'public/games/science/electric-circuit-media-cover.png', title: 'ไฟฟ้า · วงจร', subtitle: 'ส่วนประกอบ · แผนภาพ', emoji: '⚡', c1: '#fef9c3', c2: '#eab308', ink: '#713f12' },
  { out: 'public/games/science/body-systems-p6-media-cover.png', title: 'สารอาหาร · ระบบย่อย', subtitle: 'ร่างกาย ป.6', emoji: '🫀', c1: '#ffe4e6', c2: '#fb7185', ink: '#881337' },
  { out: 'public/games/english/english-tenses-p6-media-cover.png', title: 'Tenses รวม', subtitle: 'Present · Past · Future', emoji: '⏱️', c1: '#e0f2fe', c2: '#0ea5e9', ink: '#0c4a6e' },
  { out: 'public/games/english/english-reading-p6-media-cover.png', title: 'Reading ป.6', subtitle: 'ใจความ · ตอบคำถาม', emoji: '📖', c1: '#ccfbf1', c2: '#14b8a6', ink: '#134e4a' },
  { out: 'public/games/social/economics-p6-media-cover.png', title: 'เศรษฐศาสตร์ ป.6', subtitle: 'ผู้ผลิต · ผู้บริโภค · ยั่งยืน', emoji: '💹', c1: '#d1fae5', c2: '#10b981', ink: '#064e3b' },
];

for (const c of covers) await cover(c);
console.log('done Phase 13 assets');
