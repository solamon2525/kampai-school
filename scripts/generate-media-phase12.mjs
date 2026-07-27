#!/usr/bin/env node
/**
 * Phase 12 — ป.ต้น daily-use (+10 คู่)
 * ไทย×3 · คณิต×3 · อังกฤษ×2 · วิทย์×2
 */
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const V = '1.195.0';

async function cover({ out, title, subtitle, emoji, c1, c2, ink }) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="220" text-anchor="middle" font-size="110">${emoji}</text>
  <text x="640" y="360" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="42" font-weight="800" fill="${ink}">${title}</text>
  <text x="640" y="430" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="24" font-weight="700" fill="${ink}" opacity=".85">${subtitle}</text>
  <text x="640" y="620" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="24" font-weight="700" fill="#64748b">📚 สื่อ ป.ต้น · Phase 12 · บ้านคำไผ่</text>
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
    <p class="hint" id="hintText">สื่อ ป.ต้น — ไม่เก็บคะแนน</p>
    <button type="button" class="btn btn-ghost" id="btnFs">⛶ เต็มจอ</button>
    <a class="btn btn-ghost" href="${opts.ws}" target="_blank" rel="noopener">📝 เปิดใบงาน</a>
  </div>
  <div class="stage" id="stage">${bodyHtml}</div>
  <div class="footer">โรงเรียนบ้านคำไผ่ · สื่อ ป.ต้น · Phase 12 · ไม่เก็บคะแนน</div>
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
     .box h2{color:var(--deep);margin-bottom:8px;font-size:1.5rem}
     .emo{font-size:3.2rem;margin-bottom:8px}
     .trace{margin-top:12px;padding:12px;border:2px dashed var(--line);border-radius:12px;font-size:2rem;letter-spacing:.12em;color:#94a3b8;font-weight:800}`,
    `<div class="learn"><div class="pick" id="pick"></div><div class="box" id="box"></div></div>
     <div class="practice"><p style="font-weight:800;font-size:1.15rem;color:var(--deep)" id="prQ"></p><div id="prChoices" style="display:grid;gap:8px"></div><p id="prFb" style="font-weight:800;min-height:24px"></p><button type="button" class="btn btn-primary" id="btnNext">ข้อถัดไป</button></div>`,
    `const ITEMS=${JSON.stringify(items)};
let cur=ITEMS[0];
function setMode(m){document.getElementById('shell').classList.toggle('mode-practice',m==='practice');document.getElementById('hintText').textContent=m==='learn'?'เลือกหัวข้อ · ตัวใหญ่ชัด':'ตอบคำถาม';if(m==='practice')nextPr();}
function render(){
  document.getElementById('pick').innerHTML=ITEMS.map((x,i)=>'<button type="button" data-i="'+i+'" class="'+(x===cur?'on':'')+'">'+(x.emoji?x.emoji+' ':'')+x.name+'</button>').join('');
  document.getElementById('box').innerHTML=(cur.emoji?'<div class="emo">'+cur.emoji+'</div>':'')+'<h2>'+cur.name+'</h2><p>'+cur.body+'</p>'+(cur.tip?'<p style="margin-top:10px;color:var(--muted);font-size:1rem">💡 '+cur.tip+'</p>':'')+(cur.trace?'<div class="trace">'+cur.trace+'</div>':'');
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
  const renderBody = `const e=${esc};return '<div class="work-line reason-line" style="font-size:1.15rem"><div class="prompt"><strong style="font-size:1.2rem">'+e(item.prompt)+'</strong></div><div class="answer-line" style="min-height:2.2em">คำตอบ <span class="blank long"></span></div><div class="reason-line" style="min-height:2.4em;border-bottom:2px dotted #94a3b8">เขียน/ลากเส้น <span class="blank long"></span></div><div class="answer teacher-answer">เฉลย: '+e(item.answer)+'</div></div>';`;
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

// —— 1 ประสมคำ ——
write('public/games/thai/word-blend-media.html', cardPick(
  { title: 'ประสมคำ', h1: '🔤 ประสมคำ ป.ต้น', badge: 'ป.1–2 · ภาษาไทย', accent: '#b91c1c', line: '#fecaca', slug: 'word-blend-media', ws: '/games/thai/word-blend-worksheet.html' },
  [
    { emoji: 'ก', name: 'ก+า = กา', body: 'พยัญชนะ ก กับสระ า ประสมเป็นคำว่า “กา”', tip: 'อ่านทีละส่วนแล้วรวมเสียง', trace: 'ก า → กา', q: 'ก + า เป็นคำว่าอะไร?', a: 'กา' },
    { emoji: 'ม', name: 'ม+า = มา', body: 'ม กับ า ได้คำว่า “มา”', tip: 'ใช้ในประโยค: มาโรงเรียน', trace: 'ม า → มา', q: 'ม + า เป็นคำว่าอะไร?', a: 'มา' },
    { emoji: 'ป', name: 'ป+า = ปา', body: 'ป กับ า ได้คำว่า “ปา”', tip: 'เช่น ปลา (มีตัวสะกดเพิ่ม)', trace: 'ป า → ปา', q: 'ป + า เป็นคำว่าอะไร?', a: 'ปา' },
    { emoji: 'ด', name: 'ด+ี = ดี', body: 'ด กับสระ อี ได้คำว่า “ดี”', tip: 'สระอยู่เหนือพยัญชนะ', trace: 'ด ี → ดี', q: 'ด + ี เป็นคำว่าอะไร?', a: 'ดี' },
    { emoji: 'น', name: 'น+ู = นู', body: 'น กับสระ อู ได้ “นู”', tip: 'สระอยู่ใต้พยัญชนะ', trace: 'น ู → นู', q: 'น + ู เป็นคำว่าอะไร?', a: 'นู' },
    { emoji: 'ร', name: 'ร+ู = รู', body: 'ร กับ อู ได้ “รู”', tip: 'เช่น รู้ (มีวรรณยุกต์)', trace: 'ร ู → รู', q: 'ร + ู เป็นคำว่าอะไร?', a: 'รู' },
  ]
));

// —— 2 อ่าน-เขียนคล่อง ——
write('public/games/thai/read-write-fluency-media.html', cardPick(
  { title: 'อ่านคล่องเขียนคล่อง', h1: '📖 อ่านคล่อง · เขียนคล่อง', badge: 'ป.1–2 · ภาษาไทย', accent: '#c2410c', line: '#fed7aa', slug: 'read-write-fluency-media', ws: '/games/thai/read-write-fluency-worksheet.html' },
  [
    { emoji: '👀', name: 'อ่านทีละคำ', body: 'ชี้คำ อ่านออกเสียงชัด ไม่รีบ', tip: 'นิ้วชี้ตามคำ', q: 'อ่านคล่องเริ่มจากอะไร?', a: 'อ่านทีละคำชัด ๆ' },
    { emoji: '🔁', name: 'อ่านซ้ำ', body: 'อ่านประโยคเดิม 2–3 รอบ ให้ลื่นขึ้น', tip: 'รอบหลังเร็วขึ้นได้', q: 'ทำไมต้องอ่านซ้ำ?', a: 'ให้ลื่นขึ้น / จำได้' },
    { emoji: '✍️', name: 'คัดลายมือ', body: 'เขียนตามบรรทัด ตัวสูงเท่ากัน', tip: 'เริ่มจากคำสั้น', trace: 'มา — ไป — กิน', q: 'เขียนคล่องควรทำอย่างไร?', a: 'คัดตามบรรทัด / สม่ำเสมอ' },
    { emoji: '🧩', name: 'ประกอบประโยค', body: 'คำ + คำ = ประโยคสั้น เช่น “กากิน”', tip: 'มีประธานกับกริยา', q: 'ประโยคสั้นต้องมีอะไร?', a: 'ประธานและกริยา' },
    { emoji: '⏱️', name: 'จับเวลาเบา ๆ', body: 'อ่าน 1 นาที นับคำ (ไม่ต้องแข่งแรง)', tip: 'เน้นถูกก่อนเร็ว', q: 'จับเวลาเพื่ออะไร?', a: 'ดูพัฒนาการ / ฝึก' },
    { emoji: '🎉', name: 'ชมตัวเอง', body: 'ทำได้ดีขึ้นทุกวัน ชมตัวเองได้', tip: 'ติดสติกเกอร์ความพยายาม', q: 'เมื่ออ่านได้ดีขึ้นควรทำอะไร?', a: 'ชมตัวเอง / บันทึกความก้าวหน้า' },
  ]
));

// —— 3 คำพื้นฐาน ——
write('public/games/thai/basic-vocab-p12-media.html', cardPick(
  { title: 'คำพื้นฐาน ป.ต้น', h1: '📚 คำพื้นฐานใกล้ตัว', badge: 'ป.1–2 · ภาษาไทย', accent: '#a16207', line: '#fde68a', slug: 'basic-vocab-p12-media', ws: '/games/thai/basic-vocab-p12-worksheet.html' },
  [
    { emoji: '👤', name: 'คนในบ้าน', body: 'พ่อ แม่ พี่ น้อง ครู', tip: 'ชี้รูปแล้วพูดคำ', q: 'ใครสอนที่โรงเรียน?', a: 'ครู' },
    { emoji: '🏠', name: 'สิ่งของบ้าน', body: 'โต๊ะ เก้าอี้ ประตู หน้าต่าง', tip: 'เดินชี้ของจริง', q: 'นั่งบนอะไร?', a: 'เก้าอี้' },
    { emoji: '🍎', name: 'อาหาร', body: 'ข้าว น้ำ ผลไม้ ขนม', tip: 'พูดชื่อของในกล่องอาหาร', q: 'ดื่มอะไรเมื่อกระหาย?', a: 'น้ำ' },
    { emoji: '🐶', name: 'สัตว์', body: 'หมา แมว นก ปลา', tip: 'เลียนเสียงสัตว์สนุก ๆ', q: 'สัตว์ที่เห่าคือ?', a: 'หมา' },
    { emoji: '🚌', name: 'การเดินทาง', body: 'รถ เรือ เดิน วิ่ง', tip: 'เล่าว่ามาโรงเรียนอย่างไร', q: 'มาโรงเรียนอย่างไรได้บ้าง?', a: 'รถ / เดิน ฯลฯ' },
    { emoji: '🌤️', name: 'ธรรมชาติ', body: 'แดด ฝน ลม ต้นไม้', tip: 'มองนอกหน้าต่างแล้วบอก', q: 'มีเมฆดำมักเกิดอะไร?', a: 'ฝน' },
  ]
));

// —— 4 จำนวน 1–100 ——
write('public/games/math/numbers-1-100-media.html', cardPick(
  { title: 'จำนวน 1–100', h1: '🔢 จำนวนนับ 1–100', badge: 'ป.1–2 · คณิต', accent: '#1d4ed8', line: '#bfdbfe', slug: 'numbers-1-100-media', ws: '/games/math/numbers-1-100-worksheet.html' },
  [
    { emoji: '1️⃣', name: 'นับ 1–10', body: 'นับทีละหนึ่งให้ครบสิบ', tip: 'ใช้นิ้วมือช่วย', trace: '1 2 3 4 5 6 7 8 9 10', q: 'หลัง 9 คือเลขใด?', a: '10' },
    { emoji: '🔟', name: 'กลุ่มละสิบ', body: '10, 20, 30 … เป็นกลุ่มสิบ', tip: 'มัดไม้ไอติมเป็นมัด', q: 'สองมัดละสิบเท่ากับ?', a: '20' },
    { emoji: '↕️', name: 'เปรียบเทียบ', body: 'ใช้เครื่องหมาย > < =', tip: 'ปากจระเข้กินตัวใหญ่', q: '35 กับ 53 อันไหนมากกว่า?', a: '53' },
    { emoji: '📶', name: 'เรียงลำดับ', body: 'เรียงจากน้อยไปมาก', tip: 'ดูหลักสิบก่อน', q: 'เรียง 12, 5, 20 จากน้อยไปมาก', a: '5, 12, 20' },
    { emoji: '📍', name: 'เส้นจำนวน', body: 'จุดเลขบนเส้นตรง', tip: 'ก้าวทีละช่อง', q: 'บนเส้นจำนวน หลัง 49 คือ?', a: '50' },
    { emoji: '💯', name: 'ถึง 100', body: '10 กลุ่มของสิบ = 100', tip: 'ตาราง 10×10', q: 'สิบกลุ่มของสิบเท่ากับ?', a: '100' },
  ]
));

// —— 5 บวกลบไม่เกิน 100 ——
write('public/games/math/add-sub-within-100-media.html', cardPick(
  { title: 'บวกลบไม่เกิน 100', h1: '➕➖ บวก–ลบ ไม่เกิน 100', badge: 'ป.1–2 · คณิต', accent: '#0369a1', line: '#bae6fd', slug: 'add-sub-within-100-media', ws: '/games/math/add-sub-within-100-worksheet.html' },
  [
    { emoji: '➕', name: 'บวกในใจเล็ก', body: 'เช่น 3+4=7 ใช้ของนับช่วย', tip: 'เริ่มจากเลขใหญ่แล้วนับต่อ', q: '5+3 เท่ากับ?', a: '8' },
    { emoji: '➖', name: 'ลบในใจเล็ก', body: 'เช่น 9−2=7', tip: 'นับถอยหลัง', q: '8−3 เท่ากับ?', a: '5' },
    { emoji: '🧱', name: 'บวกหลักหน่วย', body: '24+3 ดูหน่วย 4+3=7 ได้ 27', tip: 'อย่าลืมหลักสิบ', q: '24+3 เท่ากับ?', a: '27' },
    { emoji: '🎯', name: 'ลบหลักหน่วย', body: '28−5=23', tip: 'หน่วยพอหรือต้องยืม', q: '28−5 เท่ากับ?', a: '23' },
    { emoji: '🔟', name: 'บวกทีละสิบ', body: '40+20=60', tip: 'นับกระโดดทีละสิบ', q: '30+40 เท่ากับ?', a: '70' },
    { emoji: '📝', name: 'โจทย์สั้น', body: 'มี 12 เอาไป 4 เหลือเท่าไร', tip: 'หาคำสำคัญ: รวม/เหลือ', q: 'มี 12 เอาไป 4 เหลือ?', a: '8' },
  ]
));

// —— 6 รูปทรงพื้นฐาน ——
write('public/games/math/basic-shapes-p12-media.html', cardPick(
  { title: 'รูปทรงพื้นฐาน', h1: '⬛ รูปทรงพื้นฐาน', badge: 'ป.1–2 · คณิต', accent: '#7c3aed', line: '#ddd6fe', slug: 'basic-shapes-p12-media', ws: '/games/math/basic-shapes-p12-worksheet.html' },
  [
    { emoji: '⚪', name: 'วงกลม', body: 'ขอบโค้ง ไม่มีมุม', tip: 'เช่น นาฬิกา ลูกบอล', q: 'รูปไม่มีมุมคือ?', a: 'วงกลม' },
    { emoji: '⬛', name: 'สี่เหลี่ยมจัตุรัส', body: 'ด้านเท่า มุมฉาก', tip: 'เช่น หน้าต่างบางแบบ', q: 'ด้านเท่าทั้งสี่คือ?', a: 'สี่เหลี่ยมจัตุรัส' },
    { emoji: '▬', name: 'สี่เหลี่ยมผืนผ้า', body: 'ด้านตรงข้ามเท่ากัน', tip: 'เช่น ประตู หนังสือ', q: 'ประตูมักเป็นรูปอะไร?', a: 'สี่เหลี่ยมผืนผ้า' },
    { emoji: '🔺', name: 'สามเหลี่ยม', body: 'มี 3 ด้าน 3 มุม', tip: 'หลังคากระท่อม', q: 'สามเหลี่ยมมีกี่ด้าน?', a: '3' },
    { emoji: '🔍', name: 'หาในห้อง', body: 'ชี้รูปทรงของจริงรอบตัว', tip: 'เดินสำรวจ 1 นาที', q: 'ทำไมต้องหาของจริง?', a: 'เชื่อมโยงชีวิตประจำวัน' },
    { emoji: '✏️', name: 'วาดรูปทรง', body: 'ลากเส้นให้ปิดรูป', tip: 'ใช้ไม้บรรทัดถ้ามี', q: 'ก่อนระบายสีควรทำอะไร?', a: 'วาดโครงรูปทรง' },
  ]
));

// —— 7 ABC phonics ——
write('public/games/english/alphabet-phonics-media.html', cardPick(
  { title: 'ABC Phonics', h1: '🔤 ABC & Phonics', badge: 'ป.1–2 · English', accent: '#2563eb', line: '#bfdbfe', slug: 'alphabet-phonics-media', ws: '/games/english/alphabet-phonics-worksheet.html' },
  [
    { emoji: 'A', name: 'A a /æ/', body: 'Apple — เสียงต้น a', tip: 'แตะ 🔊 ในใจ: æ', q: 'Apple ขึ้นต้นด้วยตัว?', a: 'A' },
    { emoji: 'B', name: 'B b /b/', body: 'Ball — เสียง b', tip: 'ริมฝีปากปิดแล้วเปิด', q: 'Ball ขึ้นต้นด้วย?', a: 'B' },
    { emoji: 'C', name: 'C c /k/', body: 'Cat — เสียง c แบบ k', tip: 'ไม่ใช่เสียง s ใน cat', q: 'Cat ขึ้นต้นด้วย?', a: 'C' },
    { emoji: 'D', name: 'D d /d/', body: 'Dog — เสียง d', tip: 'ปลายลิ้นแตะปุ่มเหงือก', q: 'Dog ขึ้นต้นด้วย?', a: 'D' },
    { emoji: 'S', name: 'S s /s/', body: 'Sun — เสียง s', tip: 'เสียงฟ่อเบา ๆ', q: 'Sun ขึ้นต้นด้วย?', a: 'S' },
    { emoji: 'T', name: 'T t /t/', body: 'Tiger — เสียง t', tip: 'ลมปะทุสั้น', q: 'Tiger ขึ้นต้นด้วย?', a: 'T' },
  ]
));

// —— 8 sight words daily ——
write('public/games/english/sight-words-daily-media.html', cardPick(
  { title: 'Sight Words Daily', h1: '👁️ Sight Words ใช้ทุกวัน', badge: 'ป.1–2 · English', accent: '#4f46e5', line: '#c7d2fe', slug: 'sight-words-daily-media', ws: '/games/english/sight-words-daily-worksheet.html' },
  [
    { emoji: '👀', name: 'I / you', body: 'I = ฉัน, you = คุณ/เธอ', tip: 'I am a student.', q: 'I แปลว่า?', a: 'ฉัน' },
    { emoji: '🤝', name: 'we / they', body: 'we = พวกเรา, they = พวกเขา', tip: 'We play.', q: 'we แปลว่า?', a: 'พวกเรา' },
    { emoji: '📦', name: 'a / the', body: 'a = หนึ่ง/ไม่เจาะจง, the = ชี้เฉพาะ', tip: 'a cat / the cat', q: 'the ใช้เมื่อใด?', a: 'ชี้เฉพาะ / ของที่รู้แล้ว' },
    { emoji: '➡️', name: 'to / for', body: 'to = ไป/ถึง, for = สำหรับ', tip: 'go to school', q: 'go ___ school', a: 'to' },
    { emoji: '✅', name: 'is / are', body: 'is สำหรับหนึ่ง, are สำหรับหลาย', tip: 'He is / They are', q: 'They ___ happy', a: 'are' },
    { emoji: '🔁', name: 'and / with', body: 'and = และ, with = กับ', tip: 'mom and dad', q: 'and แปลว่า?', a: 'และ' },
  ]
));

// —— 9 living-nonliving ——
write('public/games/science/living-nonliving-media.html', cardPick(
  { title: 'สิ่งมีชีวิต-ไม่มีชีวิต', h1: '🌱 สิ่งมีชีวิต · สิ่งไม่มีชีวิต', badge: 'ป.1–2 · วิทย์', accent: '#15803d', line: '#bbf7d0', slug: 'living-nonliving-media', ws: '/games/science/living-nonliving-worksheet.html' },
  [
    { emoji: '🐱', name: 'สิ่งมีชีวิต', body: 'กินอาหาร เติบโต หายใจ สืบพันธุ์ได้', tip: 'คน สัตว์ พืช', q: 'แมวเป็นสิ่งใด?', a: 'สิ่งมีชีวิต' },
    { emoji: '🪨', name: 'สิ่งไม่มีชีวิต', body: 'ไม่กิน ไม่เติบโตเองแบบสิ่งมีชีวิต', tip: 'หิน น้ำ โต๊ะ', q: 'หินเป็นสิ่งใด?', a: 'สิ่งไม่มีชีวิต' },
    { emoji: '🌳', name: 'พืช', body: 'พืชมีชีวิต ต้องการน้ำ แสง', tip: 'ต้นไม้ในโรงเรียน', q: 'ต้นไม้ต้องการอะไร?', a: 'น้ำและแสง' },
    { emoji: '💧', name: 'น้ำ', body: 'น้ำไม่มีชีวิต แต่สำคัญต่อชีวิต', tip: 'อย่าสับสนว่าไหล=มีชีวิต', q: 'น้ำมีชีวิตหรือไม่?', a: 'ไม่มีชีวิต' },
    { emoji: '🚗', name: 'ของใช้', body: 'รถ หุ่นยนต์ ของเล่น ไม่มีชีวิต', tip: 'ขยับได้≠มีชีวิตเสมอ', q: 'รถมีชีวิตหรือไม่?', a: 'ไม่มีชีวิต' },
    { emoji: '🔍', name: 'สำรวจรอบตัว', body: 'แบ่งกลุ่มของรอบตัวเป็น 2 กอง', tip: 'ทำเป็นตารางติ๊ก', q: 'สำรวจแล้วควรทำอะไร?', a: 'จัดกลุ่ม / บันทึก' },
  ]
));

// —— 10 materials ——
write('public/games/science/materials-around-media.html', cardPick(
  { title: 'วัสดุรอบตัว', h1: '🧱 วัสดุรอบตัว', badge: 'ป.1–2 · วิทย์', accent: '#0f766e', line: '#99f6e4', slug: 'materials-around-media', ws: '/games/science/materials-around-worksheet.html' },
  [
    { emoji: '🪵', name: 'ไม้', body: 'แข็ง ลอยน้ำได้บางชนิด ใช้ทำโต๊ะ', tip: 'สัมผัสเนื้อไม้', q: 'โต๊ะมักทำจาก?', a: 'ไม้' },
    { emoji: '🪨', name: 'หิน/ดิน', body: 'แข็ง หนัก ใช้ก่อสร้าง', tip: 'หินไม่ยืด', q: 'หินมีสมบัติใด?', a: 'แข็ง / หนัก' },
    { emoji: '🧵', name: 'ผ้า', body: 'นิ่ม พับได้ ใช้ทำเสื้อ', tip: 'เทียบกับพลาสติก', q: 'เสื้อทำจากอะไรได้?', a: 'ผ้า' },
    { emoji: '🧴', name: 'พลาสติก', body: 'เบา กันน้ำ ใช้ทำขวด', tip: 'รีไซเคิลได้บางชนิด', q: 'ขวดน้ำมักเป็นวัสดุใด?', a: 'พลาสติก' },
    { emoji: '🔩', name: 'โลหะ', body: 'แข็ง เป็นเงา ใช้ทำช้อน', tip: 'เย็นเมื่อสัมผัส', q: 'ช้อนส้อมมักเป็น?', a: 'โลหะ' },
    { emoji: '🧪', name: 'จัดกลุ่มสมบัติ', body: 'แข็ง/นิ่ม · หนัก/เบา · ดูดน้ำ/ไม่ดูด', tip: 'ทดลองง่าย ๆ ด้วยน้ำ', q: 'ทำไมต้องจัดกลุ่มวัสดุ?', a: 'เลือกใช้ให้เหมาะงาน' },
  ]
));

const sheets = [
  {
    dir: 'thai', file: 'word-blend-worksheet.html', hub: '/games/thai/word-blend-media.html',
    subject: 'ภาษาไทย', indicators: ['ท 1.1 ป.1/1', 'ท 1.1 ป.1/2', 'ท 1.1 ป.2/1'],
    icon: '🔤', title: 'ใบงานประสมคำ', gradeLabel: 'ป.1–ป.2', mediaLabel: 'สื่อประสมคำ',
    directions: 'ประสมพยัญชนะกับสระ · เขียนตัวใหญ่ · มีช่องลากเส้น',
    topicOptions: '<option value="mixed">รวม</option><option value="blend">ประสม</option><option value="read">อ่าน</option>',
    items: [
      { type: 'blend', prompt: 'ก + า =', answer: 'กา' },
      { type: 'blend', prompt: 'ม + า =', answer: 'มา' },
      { type: 'blend', prompt: 'ป + า =', answer: 'ปา' },
      { type: 'blend', prompt: 'ด + ี =', answer: 'ดี' },
      { type: 'blend', prompt: 'น + ู =', answer: 'นู' },
      { type: 'read', prompt: 'อ่านคำ: กา', answer: 'กา' },
      { type: 'read', prompt: 'เขียนตามรอย: มา', answer: 'มา' },
      { type: 'blend', prompt: 'ร + ู =', answer: 'รู' },
      { type: 'read', prompt: 'เลือกคำที่ประสมจาก ม+า', answer: 'มา' },
      { type: 'blend', prompt: 'สร้างคำจาก ก กับสระ า', answer: 'กา' },
      { type: 'read', prompt: 'คัดลายมือคำว่า ดี สองบรรทัด', answer: 'ดี' },
      { type: 'blend', prompt: 'พยัญชนะใด + า = กา', answer: 'ก' },
      { type: 'read', prompt: 'วงกลมคำที่อ่านว่า มา', answer: 'มา' },
      { type: 'blend', prompt: 'น + สระอะไร = นู', answer: 'อู / ู' },
      { type: 'read', prompt: 'แต่งประโยคสั้นมีคำว่า มา', answer: 'เช่น หนูมาโรงเรียน' },
      { type: 'blend', prompt: 'สรุปขั้นตอนประสมคำ 2 ขั้น', answer: 'ดูพยัญชนะ+สระ แล้วรวมเสียง' },
    ],
  },
  {
    dir: 'thai', file: 'read-write-fluency-worksheet.html', hub: '/games/thai/read-write-fluency-media.html',
    subject: 'ภาษาไทย', indicators: ['ท 1.1 ป.1/3', 'ท 1.1 ป.2/2', 'ท 2.1 ป.1/1'],
    icon: '📖', title: 'ใบงานอ่านคล่องเขียนคล่อง', gradeLabel: 'ป.1–ป.2', mediaLabel: 'สื่ออ่าน-เขียนคล่อง',
    directions: 'ฝึกอ่านและคัดลายมือตัวใหญ่ · ช่องลากเส้นกว้าง',
    topicOptions: '<option value="mixed">รวม</option><option value="read">อ่าน</option><option value="write">เขียน</option>',
    items: [
      { type: 'read', prompt: 'อ่านคำ: ไป', answer: 'ไป' },
      { type: 'write', prompt: 'คัดคำ: กิน', answer: 'กิน' },
      { type: 'read', prompt: 'อ่านประโยค: กากิน', answer: 'กากิน' },
      { type: 'write', prompt: 'คัดประโยค: มาโรงเรียน', answer: 'มาโรงเรียน' },
      { type: 'read', prompt: 'ทำไมต้องอ่านซ้ำ', answer: 'ให้ลื่นขึ้น' },
      { type: 'write', prompt: 'เขียนชื่อตนเอง', answer: 'ตามนักเรียน' },
      { type: 'read', prompt: 'ชี้คำทีละคำช่วยอะไร', answer: 'ไม่วางตำแหน่งผิด' },
      { type: 'write', prompt: 'คัด: ดี ใจ', answer: 'ดีใจ / ดี ใจ' },
      { type: 'read', prompt: 'ประโยคสั้นต้องมีอะไร', answer: 'ประธานและกริยา' },
      { type: 'write', prompt: 'แต่งประโยค 3 คำขึ้นไป', answer: 'ตามนักเรียน' },
      { type: 'read', prompt: 'อ่านให้เพื่อนฟัง 1 ประโยค', answer: 'ฝึกจริง' },
      { type: 'write', prompt: 'ลากเส้นใต้คำว่า โรงเรียน', answer: 'โรงเรียน' },
      { type: 'read', prompt: 'จับเวลาอ่าน 1 นาที (ครูช่วย)', answer: 'บันทึกจำนวนคำ' },
      { type: 'write', prompt: 'คัดตัวอักษร ก–จ', answer: 'กขฃคฅฆงจ' },
      { type: 'read', prompt: 'เมื่ออ่านผิดควรทำอย่างไร', answer: 'อ่านใหม่ช้า ๆ' },
      { type: 'write', prompt: 'ชมตัวเอง 1 ประโยค', answer: 'ตามนักเรียน' },
    ],
  },
  {
    dir: 'thai', file: 'basic-vocab-p12-worksheet.html', hub: '/games/thai/basic-vocab-p12-media.html',
    subject: 'ภาษาไทย', indicators: ['ท 1.1 ป.1/4', 'ท 1.1 ป.2/3'],
    icon: '📚', title: 'ใบงานคำพื้นฐาน', gradeLabel: 'ป.1–ป.2', mediaLabel: 'สื่อคำพื้นฐาน',
    directions: 'จับคู่คำใกล้ตัว · เขียนคำ · วาดประกอบ',
    topicOptions: '<option value="mixed">รวม</option><option value="home">บ้าน</option><option value="nature">ธรรมชาติ</option>',
    items: [
      { type: 'home', prompt: 'ใครสอนที่โรงเรียน', answer: 'ครู' },
      { type: 'home', prompt: 'นั่งบนอะไร', answer: 'เก้าอี้' },
      { type: 'home', prompt: 'ดื่มเมื่อกระหาย', answer: 'น้ำ' },
      { type: 'nature', prompt: 'สัตว์ที่เห่า', answer: 'หมา' },
      { type: 'nature', prompt: 'เมฆดำมักเกิด', answer: 'ฝน' },
      { type: 'home', prompt: 'เขียนคำว่า พ่อ แม่', answer: 'พ่อ แม่' },
      { type: 'home', prompt: 'วาดโต๊ะแล้วเขียนคำ', answer: 'โต๊ะ' },
      { type: 'nature', prompt: 'นก ปลา แมว รวมว่า', answer: 'สัตว์' },
      { type: 'home', prompt: 'มาโรงเรียนอย่างไรได้บ้าง', answer: 'รถ/เดิน' },
      { type: 'nature', prompt: 'ต้นไม้จัดเป็น', answer: 'ธรรมชาติ / พืช' },
      { type: 'home', prompt: 'ของในกล่องข้าว 1 อย่าง', answer: 'ตามนักเรียน' },
      { type: 'home', prompt: 'คำเรียกพี่ชาย', answer: 'พี่' },
      { type: 'nature', prompt: 'แดด ฝน ลม คือ', answer: 'ธรรมชาติ' },
      { type: 'home', prompt: 'เปิดเข้าห้องใช้สิ่งใด', answer: 'ประตู' },
      { type: 'nature', prompt: 'วาดฝนแล้วเขียนคำ', answer: 'ฝน' },
      { type: 'home', prompt: 'สรุปคำใหม่ที่จำได้ 3 คำ', answer: 'ตามนักเรียน' },
    ],
  },
  {
    dir: 'math', file: 'numbers-1-100-worksheet.html', hub: '/games/math/numbers-1-100-media.html',
    subject: 'คณิตศาสตร์', indicators: ['ค 1.1 ป.1/1', 'ค 1.1 ป.1/2', 'ค 1.1 ป.1/3'],
    icon: '🔢', title: 'ใบงานจำนวน 1–100', gradeLabel: 'ป.1–ป.2', mediaLabel: 'สื่อจำนวน 1–100',
    directions: 'นับ เปรียบเทียบ เรียงลำดับ · เขียนตัวเลขใหญ่',
    topicOptions: '<option value="mixed">รวม</option><option value="count">นับ</option><option value="compare">เปรียบเทียบ</option>',
    items: [
      { type: 'count', prompt: 'หลัง 9 คือ', answer: '10' },
      { type: 'count', prompt: 'สองมัดละสิบ =', answer: '20' },
      { type: 'compare', prompt: '35 กับ 53 อันไหนมากกว่า', answer: '53' },
      { type: 'compare', prompt: 'เรียง 12, 5, 20 น้อย→มาก', answer: '5, 12, 20' },
      { type: 'count', prompt: 'หลัง 49 คือ', answer: '50' },
      { type: 'count', prompt: 'สิบกลุ่มของสิบ =', answer: '100' },
      { type: 'compare', prompt: 'ใส่เครื่องหมาย 40 ___ 40', answer: '=' },
      { type: 'compare', prompt: 'ใส่เครื่องหมาย 18 ___ 81', answer: '<' },
      { type: 'count', prompt: 'นับทีละ 10 จาก 10 ถึง 50', answer: '10 20 30 40 50' },
      { type: 'count', prompt: 'เขียนตัวเลข ๗๔ เป็นฮินดูอารบิก', answer: '74' },
      { type: 'compare', prompt: 'จำนวนที่อยู่ระหว่าง 29 กับ 31', answer: '30' },
      { type: 'count', prompt: 'วงกลมจำนวนคู่: 2 5 8 11', answer: '2, 8' },
      { type: 'count', prompt: 'เติม  __, 98, 99, 100', answer: '97' },
      { type: 'compare', prompt: 'น้อยที่สุดใน 44 14 41', answer: '14' },
      { type: 'count', prompt: 'วาดจุด 7 จุด แล้วเขียนเลข', answer: '7' },
      { type: 'compare', prompt: 'อธิบายว่าทำไม 70 > 67', answer: 'หลักสิบมากกว่า / 70 มากกว่า' },
    ],
  },
  {
    dir: 'math', file: 'add-sub-within-100-worksheet.html', hub: '/games/math/add-sub-within-100-media.html',
    subject: 'คณิตศาสตร์', indicators: ['ค 1.1 ป.1/4', 'ค 1.1 ป.1/5', 'ค 1.1 ป.2/1'],
    icon: '➕', title: 'ใบงานบวกลบไม่เกิน 100', gradeLabel: 'ป.1–ป.2', mediaLabel: 'สื่อบวกลบ',
    directions: 'บวก–ลบ และโจทย์สั้น · แสดงวิธีคิด',
    topicOptions: '<option value="mixed">รวม</option><option value="add">บวก</option><option value="sub">ลบ</option><option value="word">โจทย์</option>',
    items: [
      { type: 'add', prompt: '5+3 =', answer: '8' },
      { type: 'sub', prompt: '8−3 =', answer: '5' },
      { type: 'add', prompt: '24+3 =', answer: '27' },
      { type: 'sub', prompt: '28−5 =', answer: '23' },
      { type: 'add', prompt: '30+40 =', answer: '70' },
      { type: 'word', prompt: 'มี 12 เอาไป 4 เหลือ', answer: '8' },
      { type: 'add', prompt: '15+10 =', answer: '25' },
      { type: 'sub', prompt: '50−20 =', answer: '30' },
      { type: 'word', prompt: 'มี 7 ได้เพิ่ม 5 รวม', answer: '12' },
      { type: 'add', prompt: '6+6 =', answer: '12' },
      { type: 'sub', prompt: '19−9 =', answer: '10' },
      { type: 'word', prompt: 'ไข่ 20 ฟอง แตก 3 เหลือ', answer: '17' },
      { type: 'add', prompt: '45+5 =', answer: '50' },
      { type: 'sub', prompt: '100−10 =', answer: '90' },
      { type: 'add', prompt: '2+8+5 =', answer: '15' },
      { type: 'word', prompt: 'สร้างโจทย์บวกเอง 1 ข้อพร้อมคำตอบ', answer: 'ตามนักเรียน' },
    ],
  },
  {
    dir: 'math', file: 'basic-shapes-p12-worksheet.html', hub: '/games/math/basic-shapes-p12-media.html',
    subject: 'คณิตศาสตร์', indicators: ['ค 2.2 ป.1/1', 'ค 2.2 ป.2/1'],
    icon: '⬛', title: 'ใบงานรูปทรงพื้นฐาน', gradeLabel: 'ป.1–ป.2', mediaLabel: 'สื่อรูปทรง',
    directions: 'จำแนกรูปทรง · วาดและลากเส้น',
    topicOptions: '<option value="mixed">รวม</option><option value="name">ชื่อรูป</option><option value="find">ของจริง</option>',
    items: [
      { type: 'name', prompt: 'รูปไม่มีมุม', answer: 'วงกลม' },
      { type: 'name', prompt: 'ด้านเท่าทั้งสี่', answer: 'สี่เหลี่ยมจัตุรัส' },
      { type: 'name', prompt: 'ประตูมักเป็นรูป', answer: 'สี่เหลี่ยมผืนผ้า' },
      { type: 'name', prompt: 'สามเหลี่ยมมีกี่ด้าน', answer: '3' },
      { type: 'find', prompt: 'ของที่เป็นวงกลมในห้อง', answer: 'นาฬิกา/ลูกบอล ฯลฯ' },
      { type: 'name', prompt: 'วาดวงกลม 1 รูป', answer: 'ตามที่วาด' },
      { type: 'name', prompt: 'วาดสามเหลี่ยม', answer: 'ตามที่วาด' },
      { type: 'find', prompt: 'หนังสือเป็นรูปอะไรโดยประมาณ', answer: 'สี่เหลี่ยมผืนผ้า' },
      { type: 'name', prompt: 'มุมฉากพบในรูปใด', answer: 'สี่เหลี่ยม' },
      { type: 'find', prompt: 'ทำไมต้องหาของจริง', answer: 'เชื่อมโยงชีวิตประจำวัน' },
      { type: 'name', prompt: 'นับมุมสี่เหลี่ยมจัตุรัส', answer: '4' },
      { type: 'name', prompt: 'แยควงกลมกับวงรีสั้น ๆ', answer: 'วงกลมกลมเท่า / วงรียาว' },
      { type: 'find', prompt: 'วาดของจริงรูปสี่เหลี่ยม', answer: 'ตามนักเรียน' },
      { type: 'name', prompt: 'ก่อนระบายสีควรทำอะไร', answer: 'วาดโครงรูปทรง' },
      { type: 'name', prompt: 'รูปที่มี 3 มุม', answer: 'สามเหลี่ยม' },
      { type: 'find', prompt: 'สำรวจรูปทรงรอบตัว 2 อย่าง', answer: 'ตามนักเรียน' },
    ],
  },
  {
    dir: 'english', file: 'alphabet-phonics-worksheet.html', hub: '/games/english/alphabet-phonics-media.html',
    subject: 'ภาษาอังกฤษ', indicators: ['ต 1.1 ป.1/2', 'ต 1.1 ป.2/2'],
    icon: '🔤', title: 'ใบงาน ABC Phonics', gradeLabel: 'ป.1–ป.2', mediaLabel: 'สื่อ ABC Phonics',
    directions: 'จับคู่ตัวอักษร-เสียง-คำ · เขียนตัวใหญ่',
    topicOptions: '<option value="mixed">รวม</option><option value="letter">ตัวอักษร</option><option value="sound">เสียง</option>',
    items: [
      { type: 'letter', prompt: 'Apple ขึ้นต้นด้วย', answer: 'A' },
      { type: 'letter', prompt: 'Ball ขึ้นต้นด้วย', answer: 'B' },
      { type: 'letter', prompt: 'Cat ขึ้นต้นด้วย', answer: 'C' },
      { type: 'letter', prompt: 'Dog ขึ้นต้นด้วย', answer: 'D' },
      { type: 'letter', prompt: 'Sun ขึ้นต้นด้วย', answer: 'S' },
      { type: 'letter', prompt: 'Tiger ขึ้นต้นด้วย', answer: 'T' },
      { type: 'sound', prompt: 'เขียนตัว a–f', answer: 'abcdef' },
      { type: 'sound', prompt: 'วงกลมตัวที่เสียง /b/', answer: 'B' },
      { type: 'letter', prompt: 'คัด: A a', answer: 'A a' },
      { type: 'letter', prompt: 'คัด: B b', answer: 'B b' },
      { type: 'sound', prompt: 'คำที่ขึ้นต้นด้วย S', answer: 'Sun / ฯลฯ' },
      { type: 'letter', prompt: 'เรียง A C B ให้ถูก', answer: 'A B C' },
      { type: 'sound', prompt: 'เลียนเสียงต้นของ Dog', answer: '/d/' },
      { type: 'letter', prompt: 'วาดรูป Apple แล้วเขียน A', answer: 'A' },
      { type: 'letter', prompt: 'จับคู่ C–Cat', answer: 'C–Cat' },
      { type: 'sound', prompt: 'สรุปตัวอักษรที่จำได้วันนี้', answer: 'ตามนักเรียน' },
    ],
  },
  {
    dir: 'english', file: 'sight-words-daily-worksheet.html', hub: '/games/english/sight-words-daily-media.html',
    subject: 'ภาษาอังกฤษ', indicators: ['ต 1.1 ป.1/3', 'ต 1.1 ป.2/1'],
    icon: '👁️', title: 'ใบงาน Sight Words Daily', gradeLabel: 'ป.1–ป.2', mediaLabel: 'สื่อ Sight Words Daily',
    directions: 'จำคำใช้บ่อย · คัดและแต่งประโยคสั้น',
    topicOptions: '<option value="mixed">รวม</option><option value="mean">ความหมาย</option><option value="use">ใช้ในประโยค</option>',
    items: [
      { type: 'mean', prompt: 'I แปลว่า', answer: 'ฉัน' },
      { type: 'mean', prompt: 'we แปลว่า', answer: 'พวกเรา' },
      { type: 'mean', prompt: 'and แปลว่า', answer: 'และ' },
      { type: 'use', prompt: 'go ___ school', answer: 'to' },
      { type: 'use', prompt: 'They ___ happy', answer: 'are' },
      { type: 'mean', prompt: 'the ใช้เมื่อใด', answer: 'ชี้เฉพาะ' },
      { type: 'use', prompt: 'คัด: I am', answer: 'I am' },
      { type: 'use', prompt: 'แต่งประโยคมีคำว่า and', answer: 'ตามนักเรียน' },
      { type: 'mean', prompt: 'you แปลโดยประมาณ', answer: 'คุณ/เธอ' },
      { type: 'use', prompt: 'He ___ a boy (is/are)', answer: 'is' },
      { type: 'use', prompt: 'คัด: we play', answer: 'we play' },
      { type: 'mean', prompt: 'with แปลว่า', answer: 'กับ' },
      { type: 'use', prompt: 'วงกลม sight word ใน: I see a cat', answer: 'I, a' },
      { type: 'use', prompt: 'เขียนคำ: the to for', answer: 'the to for' },
      { type: 'mean', prompt: 'a ต่างจาก the อย่างไรสั้น ๆ', answer: 'ไม่เจาะจง vs เจาะจง' },
      { type: 'use', prompt: 'อ่านให้ครูฟัง 3 คำ', answer: 'ฝึกจริง' },
    ],
  },
  {
    dir: 'science', file: 'living-nonliving-worksheet.html', hub: '/games/science/living-nonliving-media.html',
    subject: 'วิทยาศาสตร์', indicators: ['ว 1.1 ป.1/1', 'ว 1.3 ป.2/1'],
    icon: '🌱', title: 'ใบงานสิ่งมีชีวิต-ไม่มีชีวิต', gradeLabel: 'ป.1–ป.2', mediaLabel: 'สื่อสิ่งมีชีวิต',
    directions: 'จำแนกสิ่งมีชีวิต/ไม่มีชีวิต · อธิบายเหตุผลสั้น',
    topicOptions: '<option value="mixed">รวม</option><option value="live">มีชีวิต</option><option value="non">ไม่มีชีวิต</option>',
    items: [
      { type: 'live', prompt: 'แมวเป็นสิ่งใด', answer: 'สิ่งมีชีวิต' },
      { type: 'non', prompt: 'หินเป็นสิ่งใด', answer: 'สิ่งไม่มีชีวิต' },
      { type: 'live', prompt: 'ต้นไม้ต้องการอะไร', answer: 'น้ำและแสง' },
      { type: 'non', prompt: 'น้ำมีชีวิตหรือไม่', answer: 'ไม่มีชีวิต' },
      { type: 'non', prompt: 'รถมีชีวิตหรือไม่', answer: 'ไม่มีชีวิต' },
      { type: 'live', prompt: 'สิ่งมีชีวิตทำอะไรได้บ้าง', answer: 'กิน เติบโต ฯลฯ' },
      { type: 'non', prompt: 'โต๊ะ จัดเป็น', answer: 'สิ่งไม่มีชีวิต' },
      { type: 'live', prompt: 'คนเป็นสิ่งมีชีวิตเพราะ', answer: 'กิน/เติบโต/หายใจ' },
      { type: 'non', prompt: 'หุ่นยนต์ขยับได้แต่', answer: 'ไม่มีชีวิต' },
      { type: 'live', prompt: 'จัดกลุ่ม: นก หิน ปลา', answer: 'นก·ปลา = มีชีวิต; หิน = ไม่มี' },
      { type: 'live', prompt: 'วาดสิ่งมีชีวิต 1 อย่าง', answer: 'ตามที่วาด' },
      { type: 'non', prompt: 'วาดสิ่งไม่มีชีวิต 1 อย่าง', answer: 'ตามที่วาด' },
      { type: 'live', prompt: 'พืชมีชีวิตหรือไม่', answer: 'มีชีวิต' },
      { type: 'non', prompt: 'ทำไมของเล่นไม่ใช่สิ่งมีชีวิต', answer: 'ไม่กินไม่เติบโตเอง' },
      { type: 'live', prompt: 'สำรวจรอบตัวแล้วบันทึก 2 อย่าง', answer: 'ตามนักเรียน' },
      { type: 'non', prompt: 'สรุปความต่างมีชีวิต/ไม่มีชีวิต', answer: 'ตามสื่อ' },
    ],
  },
  {
    dir: 'science', file: 'materials-around-worksheet.html', hub: '/games/science/materials-around-media.html',
    subject: 'วิทยาศาสตร์', indicators: ['ว 2.1 ป.1/1', 'ว 2.1 ป.1/2', 'ว 2.1 ป.2/1'],
    icon: '🧱', title: 'ใบงานวัสดุรอบตัว', gradeLabel: 'ป.1–ป.2', mediaLabel: 'สื่อวัสดุรอบตัว',
    directions: 'ระบุชนิดวัสดุและสมบัติ · จัดกลุ่ม',
    topicOptions: '<option value="mixed">รวม</option><option value="type">ชนิด</option><option value="prop">สมบัติ</option>',
    items: [
      { type: 'type', prompt: 'โต๊ะมักทำจาก', answer: 'ไม้' },
      { type: 'prop', prompt: 'หินมีสมบัติใด', answer: 'แข็ง / หนัก' },
      { type: 'type', prompt: 'เสื้อทำจาก', answer: 'ผ้า' },
      { type: 'type', prompt: 'ขวดน้ำมักเป็น', answer: 'พลาสติก' },
      { type: 'type', prompt: 'ช้อนส้อมมักเป็น', answer: 'โลหะ' },
      { type: 'prop', prompt: 'ทำไมต้องจัดกลุ่มวัสดุ', answer: 'เลือกใช้ให้เหมาะงาน' },
      { type: 'prop', prompt: 'ผ้าสัมผัสแล้วรู้สึก', answer: 'นิ่ม' },
      { type: 'prop', prompt: 'โลหะเมื่อจับมัก', answer: 'เย็น / แข็ง' },
      { type: 'type', prompt: 'ยกตัวอย่างของที่เป็นไม้', answer: 'ดินสอ/เก้าอี้ ฯลฯ' },
      { type: 'prop', prompt: 'พลาสติกดีเรื่องใด', answer: 'เบา กันน้ำ' },
      { type: 'type', prompt: 'จัดกลุ่ม: ช้อน เสื้อ หิน', answer: 'โลหะ ผ้า หิน' },
      { type: 'prop', prompt: 'ทดลองวัสดุดูดน้ำ (อธิบายสั้น)', answer: 'ผ้าดูด / พลาสติกไม่ดูด ฯลฯ' },
      { type: 'type', prompt: 'วาดขวดพลาสติกแล้วติดป้ายวัสดุ', answer: 'พลาสติก' },
      { type: 'prop', prompt: 'ของแข็งกับของนิ่ม ยกตัวอย่าง', answer: 'หิน vs ผ้า' },
      { type: 'type', prompt: 'ของในกระเป๋านักเรียน 1 อย่างบอกวัสดุ', answer: 'ตามนักเรียน' },
      { type: 'prop', prompt: 'สรุปวัสดุ 3 ชนิดที่เรียน', answer: 'ไม้ ผ้า พลาสติก ฯลฯ' },
    ],
  },
];

for (const s of sheets) sheet(s);

const covers = [
  { out: 'public/games/thai/word-blend-media-cover.png', title: 'ประสมคำ', subtitle: 'ก+า = กา · ตัวใหญ่ชัด', emoji: '🔤', c1: '#fee2e2', c2: '#f87171', ink: '#7f1d1d' },
  { out: 'public/games/thai/read-write-fluency-media-cover.png', title: 'อ่าน-เขียนคล่อง', subtitle: 'อ่านซ้ำ · คัดลายมือ', emoji: '📖', c1: '#ffedd5', c2: '#fb923c', ink: '#9a3412' },
  { out: 'public/games/thai/basic-vocab-p12-media-cover.png', title: 'คำพื้นฐาน', subtitle: 'บ้าน · อาหาร · สัตว์', emoji: '📚', c1: '#fef3c7', c2: '#fbbf24', ink: '#78350f' },
  { out: 'public/games/math/numbers-1-100-media-cover.png', title: 'จำนวน 1–100', subtitle: 'นับ · เปรียบเทียบ · เรียง', emoji: '🔢', c1: '#dbeafe', c2: '#60a5fa', ink: '#1e3a8a' },
  { out: 'public/games/math/add-sub-within-100-media-cover.png', title: 'บวก–ลบ ≤100', subtitle: 'โจทย์สั้น · วิธีคิด', emoji: '➕', c1: '#e0f2fe', c2: '#38bdf8', ink: '#0c4a6e' },
  { out: 'public/games/math/basic-shapes-p12-media-cover.png', title: 'รูปทรงพื้นฐาน', subtitle: 'วงกลม · สี่เหลี่ยม · สามเหลี่ยม', emoji: '⬛', c1: '#ede9fe', c2: '#a78bfa', ink: '#5b21b6' },
  { out: 'public/games/english/alphabet-phonics-media-cover.png', title: 'ABC Phonics', subtitle: 'Letter · Sound · Word', emoji: '🔤', c1: '#dbeafe', c2: '#818cf8', ink: '#312e81' },
  { out: 'public/games/english/sight-words-daily-media-cover.png', title: 'Sight Words Daily', subtitle: 'I you we the to and', emoji: '👁️', c1: '#e0e7ff', c2: '#6366f1', ink: '#312e81' },
  { out: 'public/games/science/living-nonliving-media-cover.png', title: 'สิ่งมีชีวิต', subtitle: 'มีชีวิต · ไม่มีชีวิต', emoji: '🌱', c1: '#dcfce7', c2: '#4ade80', ink: '#14532d' },
  { out: 'public/games/science/materials-around-media-cover.png', title: 'วัสดุรอบตัว', subtitle: 'ไม้ ผ้า พลาสติก โลหะ', emoji: '🧱', c1: '#ccfbf1', c2: '#2dd4bf', ink: '#134e4a' },
];

for (const c of covers) await cover(c);
console.log('done Phase 12 assets');
