#!/usr/bin/env node
/**
 * Phase 11 — เติมวิชาบาง (+10 คู่): ศิลปะ×3 · การงาน×3 · เทคโนโลยี×2 · สังคม×2
 * Files: {slug}-media.html + {slug}-worksheet.html + {slug}-media-cover.png
 */
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const V = '1.194.0';

async function cover({ out, title, subtitle, emoji, c1, c2, ink }) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="220" text-anchor="middle" font-size="110">${emoji}</text>
  <text x="640" y="360" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="44" font-weight="800" fill="${ink}">${title}</text>
  <text x="640" y="430" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="24" font-weight="700" fill="${ink}" opacity=".85">${subtitle}</text>
  <text x="640" y="620" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="24" font-weight="700" fill="#64748b">📚 สื่อการสอน · Phase 11 · บ้านคำไผ่</text>
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
    :root{--deep:${opts.accent};--line:${opts.line};--muted:#64748b;--ok:#16a34a;--bad:#dc2626}
    body{font-family:'Sarabun',sans-serif;background:linear-gradient(145deg,${opts.line},${opts.accent}22);min-height:100%;padding:12px;color:#0f172a}
    .shell{max-width:1100px;margin:0 auto;background:#fff;border-radius:1.5rem;box-shadow:0 20px 50px rgba(15,23,42,.12);overflow:hidden;min-height:calc(100vh - 24px);display:flex;flex-direction:column}
    header{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 16px;background:linear-gradient(90deg,var(--deep),${opts.accent});color:#fff}
    header h1{font-size:1.1rem;font-weight:800;flex:1;min-width:160px}
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
    .hint{font-size:.85rem;color:var(--deep);font-weight:600;flex:1;min-width:140px}
    .stage{flex:1;padding:16px;overflow:auto}
    .footer{padding:10px;font-size:.8rem;color:var(--muted);text-align:center;border-top:1px solid var(--line)}
    .practice{display:none;flex-direction:column;gap:12px;max-width:480px;margin:0 auto}
    .shell.mode-practice .learn{display:none}.shell.mode-practice .practice{display:flex}
    .choice{font-family:inherit;font-weight:800;padding:12px;border:2px solid var(--line);border-radius:12px;background:#fff;cursor:pointer;text-align:left}
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
    <p class="hint" id="hintText">สื่อการสอน — ไม่เก็บคะแนน</p>
    <button type="button" class="btn btn-ghost" id="btnFs">⛶ เต็มจอ</button>
    <a class="btn btn-ghost" href="${opts.ws}" target="_blank" rel="noopener">📝 เปิดใบงาน</a>
  </div>
  <div class="stage" id="stage">${bodyHtml}</div>
  <div class="footer">โรงเรียนบ้านคำไผ่ · สื่อการสอน · Phase 11 · ไม่เก็บคะแนน</div>
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

function cardPickMedia(opts, items, qField = 'q', aField = 'a') {
  const dataJson = JSON.stringify(items);
  return shell(
    opts,
    `.pick{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
     .pick button{font-family:inherit;font-weight:800;padding:10px 12px;border:2px solid var(--line);border-radius:12px;background:#fff;cursor:pointer;color:var(--deep)}
     .pick button.on{background:var(--deep);color:#fff}
     .box{background:#f8fafc;border:2px solid var(--line);border-radius:16px;padding:16px;font-weight:600;line-height:1.6}
     .box h2{color:var(--deep);margin-bottom:8px;font-size:1.25rem}
     .emo{font-size:3rem;margin-bottom:8px}`,
    `<div class="learn"><div class="pick" id="pick"></div><div class="box" id="box"></div></div>
     <div class="practice"><p style="font-weight:800;color:var(--deep)" id="prQ"></p><div id="prChoices" style="display:grid;gap:8px"></div><p id="prFb" style="font-weight:800;min-height:24px"></p><button type="button" class="btn btn-primary" id="btnNext">ข้อถัดไป</button></div>`,
    `const ITEMS=${dataJson};
let cur=ITEMS[0];
function setMode(m){document.getElementById('shell').classList.toggle('mode-practice',m==='practice');document.getElementById('hintText').textContent=m==='learn'?'เลือกหัวข้ออ่าน':'ตอบคำถาม';if(m==='practice')nextPr();}
function render(){
  document.getElementById('pick').innerHTML=ITEMS.map((x,i)=>'<button type="button" data-i="'+i+'" class="'+(x===cur?'on':'')+'">'+(x.emoji?x.emoji+' ':'')+x.name+'</button>').join('');
  document.getElementById('box').innerHTML=(cur.emoji?'<div class="emo">'+cur.emoji+'</div>':'')+'<h2>'+cur.name+'</h2><p>'+cur.body+'</p>'+(cur.tip?'<p style="margin-top:10px;color:var(--muted)">💡 '+cur.tip+'</p>':'');
}
document.getElementById('pick').onclick=e=>{const b=e.target.closest('[data-i]');if(!b)return;cur=ITEMS[+b.dataset.i];render();};
function nextPr(){const a=ITEMS[Math.floor(Math.random()*ITEMS.length)];document.getElementById('prQ').textContent=a.${qField};document.getElementById('prFb').textContent='';
  const opts=new Set([a.${aField}]);while(opts.size<4)opts.add(ITEMS[Math.floor(Math.random()*ITEMS.length)].${aField});
  const box=document.getElementById('prChoices');box.innerHTML=[...opts].sort(()=>Math.random()-0.5).map(o=>'<button type="button" class="choice">'+o+'</button>').join('');
  box.onclick=e=>{const b=e.target.closest('.choice');if(!b)return;const ok=b.textContent===a.${aField};b.classList.add(ok?'ok':'no');document.getElementById('prFb').textContent=ok?'✅ ถูกต้อง!':'เฉลย: '+a.${aField};if(KAMPAI&&KAMPAI.sound)(ok?KAMPAI.sound.correct:KAMPAI.sound.wrong)();};}
document.getElementById('btnNext').onclick=nextPr;render();setMode('learn');`
  );
}

function sheet({ dir, file, hub, subject, indicators, icon, title, gradeLabel, mediaLabel, directions, topicOptions, items, renderBody }) {
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
</body></html>`;
  write(`public/games/${dir}/${file}`, html);
}

const esc = 'window.KampaiTopicWorksheet.escapeHtml';
const reasonBody = `const e=${esc};return '<div class="work-line reason-line"><div class="prompt"><strong>'+e(item.prompt)+'</strong></div><div class="answer-line">คำตอบ <span class="blank long"></span></div><div class="reason-line">เหตุผล / ตัวอย่าง <span class="blank long"></span></div><div class="answer teacher-answer">เฉลย: '+e(item.answer)+'</div></div>';`;

// —— 1 visual-elements ——
write('public/games/arts/visual-elements-media.html', cardPickMedia(
  { title: 'ทัศนธาตุ', h1: '🎨 ทัศนธาตุในงานศิลปะ', badge: 'ป.2–4 · ศิลปะ', accent: '#c026d3', line: '#f5d0fe', slug: 'visual-elements-media', ws: '/games/arts/visual-elements-worksheet.html' },
  [
    { emoji: '➖', name: 'เส้น', body: 'เส้นบอกทิศทาง ความรู้สึก เช่น เส้นตรง=มั่นคง เส้นโค้ง=นุ่มนวล', tip: 'ลองวาดเส้นหนา-บางให้ความรู้สึกต่างกัน', q: 'เส้นโค้งมักให้ความรู้สึกใด?', a: 'นุ่มนวล / เคลื่อนไหว' },
    { emoji: '⬛', name: 'รูปทรง', body: 'รูปเรขาคณิตและรูปอิสระประกอบเป็นภาพ', tip: 'วงกลม สามเหลี่ยม สี่เหลี่ยมใช้บ่อย', q: 'วงกลมเป็นตัวอย่างของอะไร?', a: 'รูปทรง' },
    { emoji: '🎨', name: 'สี', body: 'สีอุ่น (แดง เหลือง) สีเย็น (ฟ้า เขียว) สื่ออารมณ์ต่างกัน', tip: 'สีตรงข้ามตัดกันชัด', q: 'สีฟ้าจัดเป็นกลุ่มสีใด?', a: 'สีเย็น' },
    { emoji: '⬜', name: 'พื้นผิว', body: 'รู้สึกหยาบ-เรียบจากการมองหรือสัมผัส', tip: 'ทราย vs กระจก', q: 'พื้นผิวหยาบตัวอย่างใด?', a: 'ทราย / เปลือกไม้' },
    { emoji: '⬛⬜', name: 'ค่าน้ำหนัก', body: 'ความอ่อน-แก่ของสีหรือแสงเงา', tip: 'แรเงาทำให้ดูมีมิติ', q: 'แรเงาช่วยเรื่องใด?', a: 'ค่าน้ำหนัก / มิติ' },
    { emoji: '📦', name: 'พื้นที่ว่าง', body: 'ช่องว่างรอบวัตถุทำให้ภาพไม่อึดอัด', tip: 'อย่าวางของเต็มทุกมุม', q: 'ช่องว่างรอบวัตถุเรียกว่า?', a: 'พื้นที่ว่าง' },
  ]
));

// —— 2 rhythm-music ——
write('public/games/arts/rhythm-music-media.html', cardPickMedia(
  { title: 'จังหวะดนตรี', h1: '🥁 จังหวะและดนตรีพื้นฐาน', badge: 'ป.1–3 · ศิลปะ', accent: '#db2777', line: '#fbcfe8', slug: 'rhythm-music-media', ws: '/games/arts/rhythm-music-worksheet.html' },
  [
    { emoji: '👏', name: 'จังหวะ', body: 'การตบมือ/เคาะตามจังหวะเท่า ๆ กัน', tip: 'นับ 1-2-3-4 แล้วตบ', q: 'จังหวะคืออะไร?', a: 'การเคาะ/ตบเป็นจังหวะเท่ากัน' },
    { emoji: '🎵', name: 'ทำนอง', body: 'เสียงสูง-ต่ำเรียงกันเป็นเพลง', tip: 'ร้องตามครูทีละประโยค', q: 'ทำนองเกี่ยวกับอะไร?', a: 'เสียงสูง-ต่ำ' },
    { emoji: '🔊', name: 'ความดัง-เบา', body: 'เล่นดังหรือเบาเพื่อสื่ออารมณ์', tip: 'ท่อนเกริ่นเบา ท่อนฮุคดังขึ้น', q: 'เล่นเบาแล้วดังขึ้นเรียกแนวใด?', a: 'ความดัง-เบา / พลวัต' },
    { emoji: '🥁', name: 'เครื่องตี', body: 'กลอง ฉิ่ง ฉาบ ให้จังหวะชัด', tip: 'เริ่มจากฉิ่งจังหวะช้า', q: 'กลองจัดเป็นเครื่องอะไร?', a: 'เครื่องตี' },
    { emoji: '🎶', name: 'เครื่องเป่า/สี', body: 'ขลุ่ย ไวโอลิน ให้ทำนอง', tip: 'ฟังแล้วบอกว่าเครื่องไหนดัง', q: 'ขลุ่ยเป็นเครื่องประเภทใด?', a: 'เครื่องเป่า' },
    { emoji: '🇹🇭', name: 'เพลงไทยง่าย ๆ', body: 'เพลงเด็กไทยมีจังหวะชัด จำง่าย', tip: 'เช่น ช้าง / ดาวจุดเดียว', q: 'ทำไมเพลงเด็กเหมาะฝึกจังหวะ?', a: 'จังหวะชัด จำง่าย' },
  ]
));

// —— 3 dance-basics ——
write('public/games/arts/dance-basics-media.html', cardPickMedia(
  { title: 'นาฏศิลป์พื้นฐาน', h1: '💃 นาฏศิลป์พื้นฐาน', badge: 'ป.1–3 · ศิลปะ', accent: '#e11d48', line: '#fecdd3', slug: 'dance-basics-media', ws: '/games/arts/dance-basics-worksheet.html' },
  [
    { emoji: '🧍', name: 'ท่าเตรียม', body: 'ยืนตรง ไหล่ผ่อนคลาย พร้อมเริ่ม', tip: 'หายใจเข้าออกก่อนเริ่ม', q: 'ก่อนรำควรทำอย่างไร?', a: 'ยืนตรง / เตรียมตัว' },
    { emoji: '🙏', name: 'ไหว้', body: 'พนมมือไหว้แสดงความเคารพ', tip: 'ยกมือช้า ๆ ระดับหน้าอก–คิ้วตามระดับ', q: 'ไหว้แสดงถึงอะไร?', a: 'ความเคารพ' },
    { emoji: '✋', name: 'จีบมือ', body: 'ปลายนิ้วชิดกันเป็นดอกบัวตูม', tip: 'อย่าเกร็งข้อมือมาก', q: 'จีบมือคล้ายรูปอะไร?', a: 'ดอกบัวตูม' },
    { emoji: '👣', name: 'ก้าวเท้า', body: 'ก้าวตามจังหวะเพลง ไม่เร่ง', tip: 'นับจังหวะในใจ', q: 'ก้าวเท้าควรทำอย่างไร?', a: 'ตามจังหวะ ไม่เร่ง' },
    { emoji: '😊', name: 'สีหน้า', body: 'ยิ้มสุภาพ สื่ออารมณ์บท', tip: 'อย่าเม้มปากเกร็ง', q: 'สีหน้าช่วยเรื่องใด?', a: 'สื่ออารมณ์' },
    { emoji: '🎭', name: 'มารยาทเวที', body: 'ไม่ส่งเสียงดัง เข้า-ออกแถวเป็นระเบียบ', tip: 'รอคิวหลังเวที', q: 'มารยาทเวทีข้อสำคัญ?', a: 'เป็นระเบียบ / ไม่ส่งเสียงดัง' },
  ]
));

// —— 4 home-crafts ——
write('public/games/career/home-crafts-media.html', cardPickMedia(
  { title: 'งานบ้าน-งานประดิษฐ์', h1: '🧵 งานบ้านและงานประดิษฐ์', badge: 'ป.1–3 · การงาน', accent: '#ea580c', line: '#fed7aa', slug: 'home-crafts-media', ws: '/games/career/home-crafts-worksheet.html' },
  [
    { emoji: '🧹', name: 'เก็บกวาด', body: 'กวาด ถู เก็บของเข้าที่หลังใช้', tip: 'ทำทีละมุมห้อง', q: 'หลังใช้ของควรทำอะไร?', a: 'เก็บเข้าที่' },
    { emoji: '🧺', name: 'จัดของ', body: 'แยกประเภท ของเล่น หนังสือ เสื้อผ้า', tip: 'กล่องป้ายชื่อช่วยจำ', q: 'จัดของดีอย่างไร?', a: 'แยกประเภท / มีที่เก็บ' },
    { emoji: '✂️', name: 'ตัดปะ', body: 'ใช้กรรไกรอย่างปลอดภัย ตัดตามเส้น', tip: 'ส่งกรรไกรให้จับด้าม', q: 'ส่งกรรไกรอย่างไรให้ปลอดภัย?', a: 'จับด้ามส่ง' },
    { emoji: '🧷', name: 'พับ/ติด', body: 'พับกระดาษตรง ใช้กาวแตะบาง ๆ', tip: 'กาวเยอะทำให้ยับ', q: 'ใช้กาวอย่างไรดี?', a: 'แตะบาง ๆ' },
    { emoji: '♻️', name: 'วัสดุเหลือใช้', body: 'กล่อง นมกล่อง กระดาษใช้ซ้ำทำของเล่น', tip: 'ล้างให้สะอาดก่อนใช้', q: 'ทำไมใช้วัสดุเหลือใช้?', a: 'ประหยัด / รักษ์โลก' },
    { emoji: '🧼', name: 'ล้างมือหลังงาน', body: 'หลังประดิษฐ์หรือเก็บบ้านให้ล้างมือ', tip: 'ใช้สบู่ถูให้ทั่ว', q: 'หลังงานฝีมือควรทำอะไร?', a: 'ล้างมือ' },
  ]
));

// —— 5 school-garden ——
write('public/games/career/school-garden-media.html', cardPickMedia(
  { title: 'การเกษตรในโรงเรียน', h1: '🌱 การเกษตรในโรงเรียน', badge: 'ป.3–4 · การงาน', accent: '#16a34a', line: '#bbf7d0', slug: 'school-garden-media', ws: '/games/career/school-garden-worksheet.html' },
  [
    { emoji: '🪴', name: 'เตรียมดิน', body: 'พรวนดิน ใส่ปุ๋ยคอกเล็กน้อย', tip: 'ดินร่วนซุยรากเดินดี', q: 'ทำไมต้องพรวนดิน?', a: 'ให้ร่วนซุย / รากเดินดี' },
    { emoji: '🌰', name: 'เพาะเมล็ด', body: 'หยอดเมล็ดลึกพอเหมาะ กลบดินบาง ๆ', tip: 'อย่าฝังลึกเกิน', q: 'ฝังเมล็ดลึกเกินเกิดอะไร?', a: 'งอกยาก' },
    { emoji: '💧', name: 'รดน้ำ', body: 'รดเช้าหรือเย็น ไม่แฉะแฉะ', tip: 'ดูความชื้นดินก่อนรด', q: 'ควรรดน้ำช่วงใด?', a: 'เช้าหรือเย็น' },
    { emoji: '🌿', name: 'ถอนวัชพืช', body: 'ถอนหญ้ารอบโคนพืช', tip: 'ระวังถอนต้นกล้า', q: 'วัชพืชแย่งอะไรจากพืช?', a: 'น้ำ / อาหาร / แสง' },
    { emoji: '🐛', name: 'สังเกตแมลง', body: 'แยกแมลงศัตรูกับแมลงมีประโยชน์', tip: 'เต่าทองกินเพลี้ย', q: 'เต่าทองมีประโยชน์อย่างไร?', a: 'กินเพลี้ย' },
    { emoji: '🥬', name: 'เก็บเกี่ยว', body: 'เก็บเมื่อโตพอ ตัด/เด็ดถูกวิธี', tip: 'ไม่ดึงรุนแรงจนรากหลุด', q: 'เก็บเกี่ยวควรทำอย่างไร?', a: 'เมื่อโตพอ / ถูกวิธี' },
  ]
));

// —— 6 food-nutrition ——
write('public/games/career/food-nutrition-media.html', cardPickMedia(
  { title: 'อาหาร-โภชนาการ', h1: '🥗 อาหารและโภชนาการเบื้องต้น', badge: 'ป.2–3 · การงาน', accent: '#ca8a04', line: '#fef08a', slug: 'food-nutrition-media', ws: '/games/career/food-nutrition-worksheet.html' },
  [
    { emoji: '🍚', name: 'พลังงาน', body: 'ข้าว ขนมปัง ให้พลังงานทำกิจกรรม', tip: 'มื้อเช้าสำคัญ', q: 'ข้าวจัดเป็นกลุ่มใด?', a: 'พลังงาน / แป้ง' },
    { emoji: '🍗', name: 'โปรตีน', body: 'เนื้อ ไข่ ถั่ว ช่วยซ่อมแซมร่างกาย', tip: 'มังสวิรัติใช้ถั่วแทนได้', q: 'ไข่ให้สารอาหารหลักใด?', a: 'โปรตีน' },
    { emoji: '🥦', name: 'ผักผลไม้', body: 'วิตามิน แร่ธาตุ ใยอาหาร', tip: 'สีหลากหลายในจาน', q: 'ผักช่วยเรื่องใด?', a: 'วิตามิน / ใยอาหาร' },
    { emoji: '🥛', name: 'นม', body: 'แคลเซียมแข็งแรงกระดูก', tip: 'เลือกนมจืดดีกว่าหวานจัด', q: 'นมเด่นเรื่องใด?', a: 'แคลเซียม' },
    { emoji: '🚫', name: 'ของหวานจัด', body: 'กินบ่อยทำฟันผุ อ้วนง่าย', tip: 'เป็นของว่างไม่ใช่มื้อหลัก', q: 'ทำไมไม่ควรหวานจัดบ่อย?', a: 'ฟันผุ / อ้วน' },
    { emoji: '🧼', name: 'สุขลักษณะอาหาร', body: 'ล้างมือ ล้างผัก ภาชนะสะอาด', tip: 'ไม่ใช้ของสุกปนดิบ', q: 'ก่อนปรุงอาหารควรทำอะไร?', a: 'ล้างมือ / ล้างวัตถุดิบ' },
  ]
));

// —— 7 algorithm-unplugged ——
write('public/games/tech/algorithm-unplugged-media.html', cardPickMedia(
  { title: 'อัลกอริทึม unplugged', h1: '🧭 อัลกอริทึมแบบไม่ใช้คอมพิวเตอร์', badge: 'ป.1–3 · เทคโนโลยี', accent: '#2563eb', line: '#bfdbfe', slug: 'algorithm-unplugged-media', ws: '/games/tech/algorithm-unplugged-worksheet.html' },
  [
    { emoji: '📝', name: 'ลำดับขั้นตอน', body: 'งานใด ๆ แตกเป็นขั้น 1→2→3 ได้', tip: 'แปรงฟัน / ผูกเชือกรองเท้า', q: 'อัลกอริทึมคืออะไร?', a: 'ลำดับขั้นตอนแก้ปัญหา' },
    { emoji: '➡️', name: 'คำสั่งชัด', body: 'คำสั่งต้องเข้าใจตรงกัน ไม่คลุมเครือ', tip: 'ก้าวไปข้างหน้า 2 ก้าว ดีกว่า “ไปนิดหน่อย”', q: 'คำสั่งดีควรเป็นอย่างไร?', a: 'ชัดเจน' },
    { emoji: '🔁', name: 'ทำซ้ำ', body: 'บางขั้นทำซ้ำหลายรอบ (ลูป)', tip: 'ตบมือ 4 ครั้ง = ทำซ้ำ', q: 'ทำซ้ำในอัลกอริทึมเรียกแนวใด?', a: 'ลูป / ทำซ้ำ' },
    { emoji: '🔀', name: 'เงื่อนไข', body: 'ถ้า…แล้ว… เช่น ถ้าฝนตก เอาร่ม', tip: 'เลือกทางตามสถานการณ์', q: '“ถ้าฝนตกเอาร่ม” คืออะไร?', a: 'เงื่อนไข' },
    { emoji: '🐛', name: 'ดีบัก', body: 'ขั้นไหนพลาดให้ย้อนแก้', tip: 'ลองทีละขั้น', q: 'ดีบักคืออะไร?', a: 'หาและแก้จุดผิด' },
    { emoji: '🗺️', name: 'แผนที่คำสั่ง', body: 'ใช้ลูกศรนำทางบนตาราง', tip: 'ห้ามชนกำแพง', q: 'ลูกศรบนตารางใช้ทำอะไร?', a: 'สั่งทิศทาง / นำทาง' },
  ]
));

// —— 8 data-presentation ——
write('public/games/tech/data-presentation-media.html', cardPickMedia(
  { title: 'ข้อมูลและการนำเสนอ', h1: '📊 ข้อมูลและการนำเสนอ', badge: 'ป.3–4 · เทคโนโลยี', accent: '#0891b2', line: '#a5f3fc', slug: 'data-presentation-media', ws: '/games/tech/data-presentation-worksheet.html' },
  [
    { emoji: '🔢', name: 'เก็บข้อมูล', body: 'นับ บันทึก เช่น จำนวนเพื่อนชอบผลไม้', tip: 'ใช้ตารางติ๊กถูก', q: 'เก็บข้อมูลเริ่มจากอะไร?', a: 'นับ / บันทึก' },
    { emoji: '📋', name: 'ตาราง', body: 'แถว-คอลัมน์จัดข้อมูลให้อ่านง่าย', tip: 'หัวตารางต้องชัด', q: 'ตารางช่วยเรื่องใด?', a: 'จัดข้อมูลให้อ่านง่าย' },
    { emoji: '📶', name: 'กราฟแท่ง', body: 'เปรียบเทียบปริมาณด้วยความสูงแท่ง', tip: 'แกนต้องมีหน่วย', q: 'กราฟแท่งเหมาะกับอะไร?', a: 'เปรียบเทียบปริมาณ' },
    { emoji: '🥧', name: 'แผนภาพวงกลม', body: 'แสดงสัดส่วนของทั้งหมด', tip: 'รวมต้องครบ 100%', q: 'วงกลมแสดงอะไรได้ดี?', a: 'สัดส่วน' },
    { emoji: '🗣️', name: 'เล่าผล', body: 'สรุปสั้น ๆ ว่าข้อมูลบอกอะไร', tip: 'พูด 2–3 ประโยค', q: 'หลังทำกราฟควรทำอะไร?', a: 'สรุป / เล่าผล' },
    { emoji: '✅', name: 'ตรวจสอบ', body: 'ตัวเลขรวมตรงไหม กราฟตรงตารางไหม', tip: 'นับใหม่ถ้าสงสัย', q: 'ตรวจข้อมูลเพื่ออะไร?', a: 'ความถูกต้อง' },
  ]
));

// —— 9 thai-geography ——
write('public/games/social/thai-geography-media.html', cardPickMedia(
  { title: 'ภูมิศาสตร์ไทย', h1: '🗺️ ภูมิศาสตร์ไทยเบื้องต้น', badge: 'ป.3–4 · สังคม', accent: '#0f766e', line: '#99f6e4', slug: 'thai-geography-media', ws: '/games/social/thai-geography-worksheet.html' },
  [
    { emoji: '🧭', name: 'ทิศ', body: 'เหนือ ใต้ ออก ตก ใช้เข็มทิศ/แผนที่', tip: 'ดวงอาทิตย์ขึ้นทางตะวันออก', q: 'ดวงอาทิตย์ขึ้นทางทิศใด?', a: 'ตะวันออก' },
    { emoji: '🏔️', name: 'ภาคเหนือ', body: 'ภูเขา หุบเขา อากาศเย็นกว่า', tip: 'จังหวัดเช่น เชียงใหม่', q: 'ภาคเหนือมีลักษณะเด่น?', a: 'ภูเขา / อากาศเย็น' },
    { emoji: '🌾', name: 'ภาคกลาง', body: 'ที่ราบลุ่มแม่น้ำเจ้าพระยา นาข้าว', tip: 'กรุงเทพฯ อยู่ในภาคกลาง', q: 'ภาคกลางเหมาะปลูกอะไร?', a: 'ข้าว' },
    { emoji: '🏜️', name: 'ภาคตะวันออกเฉียงเหนือ', body: 'ที่ราบสูง แห้งแล้งกว่าบางพื้นที่', tip: 'เรียกอีกอย่างว่าอีสาน', q: 'อีสานคือภาคใด?', a: 'ตะวันออกเฉียงเหนือ' },
    { emoji: '🏖️', name: 'ภาคใต้', body: 'คาบสมุทร ทะเล สวนยาง ปาล์ม', tip: 'ฝนชุกบางฤดู', q: 'ภาคใต้ติดอะไร?', a: 'ทะเล' },
    { emoji: '📍', name: 'ที่ตั้งโรงเรียน', body: 'อุดรธานีอยู่ในภาคตะวันออกเฉียงเหนือ', tip: 'ชี้บนแผนที่ประเทศไทย', q: 'อุดรธานีอยู่ภาคใด?', a: 'ตะวันออกเฉียงเหนือ' },
  ]
));

// —— 10 citizen-duties-p123 ——
write('public/games/social/citizen-duties-p123-media.html', cardPickMedia(
  { title: 'หน้าที่พลเมือง ป.ต้น', h1: '🏛️ หน้าที่พลเมือง (ป.ต้น)', badge: 'ป.1–3 · สังคม', accent: '#1d4ed8', line: '#bfdbfe', slug: 'citizen-duties-p123-media', ws: '/games/social/citizen-duties-p123-worksheet.html' },
  [
    { emoji: '🇹🇭', name: 'เคารพชาติ', body: 'ยืนตรงเคารพธงชาติ ร้องเพลงชาติ', tip: 'ถอดหมวกตอนเคารพธง', q: 'ตอนเพลงชาติควรทำอย่างไร?', a: 'ยืนตรงเคารพ' },
    { emoji: '👨‍🏫', name: 'เชื่อฟังครู', body: 'ฟังคำสั่งครูในห้องและนอกห้อง', tip: 'ถามเมื่อไม่เข้าใจอย่างสุภาพ', q: 'เมื่อครูอธิบายควรทำอะไร?', a: 'ตั้งใจฟัง' },
    { emoji: '🤝', name: 'ช่วยเหลือ', body: 'ช่วยเพื่อน แบ่งปัน ไม่รังแก', tip: 'เห็นเพื่อนล้ม ช่วยพยุง', q: 'พลเมืองดีทำอย่างไรกับเพื่อน?', a: 'ช่วยเหลือ / ไม่รังแก' },
    { emoji: '🗑️', name: 'รักษาความสะอาด', body: 'ทิ้งขยะลงถัง ไม่ขีดเขียนโต๊ะ', tip: 'แยกขยะถ้ามีถังแยก', q: 'ขยะควรทิ้งที่ไหน?', a: 'ถังขยะ' },
    { emoji: '📢', name: 'ใช้สิทธิอย่างถูก', body: 'เข้าคิว พูดสุภาพ แสดงความเห็นโดยไม่ตะโกน', tip: 'ยกมือก่อนพูดในห้อง', q: 'อยากพูดในห้องควรทำอย่างไร?', a: 'ยกมือ' },
    { emoji: '🏠', name: 'หน้าที่ที่บ้าน', body: 'ช่วยงานบ้านเล็ก ๆ ตามวัย', tip: 'เก็บของเล่น กวาดบ้าน', q: 'หน้าที่ที่บ้านของเด็กตัวอย่าง?', a: 'ช่วยงานบ้าน / เก็บของ' },
  ]
));

// Worksheets (16 items each)
const wsCommon = (extra = []) => [
  ...extra,
];

sheet({
  dir: 'arts', file: 'visual-elements-worksheet.html', hub: '/games/arts/visual-elements-media.html',
  subject: 'ศิลปะ', indicators: ['ศ 1.1 ป.2/2', 'ศ 1.1 ป.3/3', 'ศ 1.1 ป.4/3'],
  icon: '🎨', title: 'ใบงานทัศนธาตุ', gradeLabel: 'ป.2–ป.4', mediaLabel: 'สื่อทัศนธาตุ',
  directions: 'ตอบเกี่ยวกับเส้น รูปทรง สี พื้นผิว ค่าน้ำหนัก พื้นที่ว่าง · วาด/อธิบายสั้น ๆ',
  topicOptions: '<option value="mixed">รวม</option><option value="line">เส้น</option><option value="shape">รูปทรง</option><option value="color">สี</option><option value="other">อื่น ๆ</option>',
  items: [
    { type: 'line', prompt: 'เส้นตรงมักให้ความรู้สึกใด', answer: 'มั่นคง / แข็งแรง' },
    { type: 'line', prompt: 'วาดเส้นโค้ง 3 เส้นที่ให้ความรู้สึกนุ่มนวล', answer: 'ตามสื่อ · เส้นโค้งมน' },
    { type: 'shape', prompt: 'วงกลม สามเหลี่ยม สี่เหลี่ยม เรียกว่าอะไร', answer: 'รูปทรง' },
    { type: 'shape', prompt: 'รูปอิสระต่างจากรูปเรขาคณิตอย่างไร', answer: 'ไม่เป็นแบบเรขาคณิตตายตัว' },
    { type: 'color', prompt: 'สีแดง เหลือง จัดเป็นกลุ่มสีใด', answer: 'สีอุ่น' },
    { type: 'color', prompt: 'สีฟ้า เขียว จัดเป็นกลุ่มสีใด', answer: 'สีเย็น' },
    { type: 'other', prompt: 'พื้นผิวหยาบยกตัวอย่าง 1 อย่าง', answer: 'ทราย / เปลือกไม้ ฯลฯ' },
    { type: 'other', prompt: 'แรเงาช่วยสร้างสิ่งใดในภาพ', answer: 'ค่าน้ำหนัก / มิติ' },
    { type: 'other', prompt: 'ทำไมต้องมีพื้นที่ว่างในภาพ', answer: 'ไม่อึดอัด / โฟกัสชัด' },
    { type: 'line', prompt: 'เส้นหนาและเส้นบางสื่อความต่างอย่างไร', answer: 'น้ำหนัก/ความรู้สึกต่างกัน' },
    { type: 'color', prompt: 'สีตรงข้ามใช้แล้วเกิดผลอย่างไร', answer: 'ตัดกันชัด / สะดุดตา' },
    { type: 'shape', prompt: 'วงกลมในห้องเรียนเจอที่ไหนได้บ้าง', answer: 'นาฬิกา / จาน ฯลฯ' },
    { type: 'other', prompt: 'เลือกทัศนธาตุ 1 อย่าง วาดตัวอย่างสั้น ๆ', answer: 'ตามที่นักเรียนวาด' },
    { type: 'line', prompt: 'เส้นซิกแซกอาจให้ความรู้สึกใด', answer: 'ตื่นเต้น / ไม่สงบ' },
    { type: 'color', prompt: 'ทำไมศิลปินเลือกสีเย็นในภาพทะเล', answer: 'สื่อความเย็น/สงบ' },
    { type: 'other', prompt: 'สรุปทัศนธาตุที่เรียนมา 3 ข้อ', answer: 'เช่น เส้น รูปทรง สี' },
  ],
  renderBody: reasonBody,
});

sheet({
  dir: 'arts', file: 'rhythm-music-worksheet.html', hub: '/games/arts/rhythm-music-media.html',
  subject: 'ศิลปะ', indicators: ['ศ 2.1 ป.1/2', 'ศ 2.1 ป.2/3', 'ศ 2.1 ป.3/2'],
  icon: '🥁', title: 'ใบงานจังหวะดนตรี', gradeLabel: 'ป.1–ป.3', mediaLabel: 'สื่อจังหวะดนตรี',
  directions: 'ตอบเรื่องจังหวะ ทำนอง เครื่องดนตรี · ตบจังหวะ/อธิบายสั้น ๆ',
  topicOptions: '<option value="mixed">รวม</option><option value="beat">จังหวะ</option><option value="inst">เครื่องดนตรี</option><option value="feel">ความรู้สึก</option>',
  items: [
    { type: 'beat', prompt: 'จังหวะหมายถึงอะไร', answer: 'การเคาะ/ตบเป็นจังหวะเท่ากัน' },
    { type: 'beat', prompt: 'นับ 1-2-3-4 แล้วตบมือ ช่วยเรื่องใด', answer: 'ฝึกจังหวะ' },
    { type: 'feel', prompt: 'ทำนองเกี่ยวกับเสียงแบบใด', answer: 'สูง-ต่ำ' },
    { type: 'feel', prompt: 'เล่นเบาแล้วดังขึ้นใช้สื่ออะไร', answer: 'อารมณ์ / พลวัต' },
    { type: 'inst', prompt: 'กลองจัดเป็นเครื่องประเภทใด', answer: 'เครื่องตี' },
    { type: 'inst', prompt: 'ขลุ่ยจัดเป็นเครื่องประเภทใด', answer: 'เครื่องเป่า' },
    { type: 'inst', prompt: 'ฉิ่งใช้ทำอะไรในวง', answer: 'ให้จังหวะ' },
    { type: 'beat', prompt: 'ทำไมเพลงเด็กเหมาะฝึกจังหวะ', answer: 'จังหวะชัด จำง่าย' },
    { type: 'feel', prompt: 'เพลงช้าอาจให้ความรู้สึกใด', answer: 'สงบ / เศร้า ฯลฯ' },
    { type: 'beat', prompt: 'เขียนรูปแบบตบมือสั้น ๆ (เช่น × - × -)', answer: 'ตามที่ออกแบบ' },
    { type: 'inst', prompt: 'ยกตัวอย่างเครื่องสี 1 อย่าง', answer: 'ไวโอลิน / จะเข้ ฯลฯ' },
    { type: 'feel', prompt: 'ทำไมต้องฟังจบประโยคเพลงก่อนปรบมือ', answer: 'มารยาท / ไม่รบจังหวะ' },
    { type: 'beat', prompt: 'ทำซ้ำจังหวะเดิม 4 ครั้งเรียกแนวใด', answer: 'ทำซ้ำ / แพทเทิร์น' },
    { type: 'inst', prompt: 'แยกเครื่องตีกับเครื่องเป่าให้ถูก', answer: 'กลอง≠ขลุ่ย' },
    { type: 'beat', prompt: 'ฝึกเคาะโต๊ะตามจังหวะครู สรุปผล', answer: 'ตามประสบการณ์' },
    { type: 'feel', prompt: 'เลือกเพลงไทยเด็ก 1 เพลงที่จำจังหวะได้', answer: 'เช่น ช้าง' },
  ],
  renderBody: reasonBody,
});

sheet({
  dir: 'arts', file: 'dance-basics-worksheet.html', hub: '/games/arts/dance-basics-media.html',
  subject: 'ศิลปะ', indicators: ['ศ 3.1 ป.1/1', 'ศ 3.1 ป.1/2', 'ศ 3.1 ป.2/1'],
  icon: '💃', title: 'ใบงานนาฏศิลป์พื้นฐาน', gradeLabel: 'ป.1–ป.3', mediaLabel: 'สื่อนาฏศิลป์',
  directions: 'ตอบเรื่องท่าเตรียม ไหว้ จีบมือ ก้าวเท้า มารยาทเวที',
  topicOptions: '<option value="mixed">รวม</option><option value="pose">ท่าทาง</option><option value="manner">มารยาท</option><option value="why">เหตุผล</option>',
  items: [
    { type: 'pose', prompt: 'ก่อนเริ่มรำควรยืนอย่างไร', answer: 'ยืนตรง พร้อม' },
    { type: 'pose', prompt: 'ไหว้แสดงถึงอะไร', answer: 'ความเคารพ' },
    { type: 'pose', prompt: 'จีบมือคล้ายรูปอะไร', answer: 'ดอกบัวตูม' },
    { type: 'pose', prompt: 'ก้าวเท้าควรสัมพันธ์กับอะไร', answer: 'จังหวะเพลง' },
    { type: 'manner', prompt: 'มารยาทหลังเวทีข้อสำคัญ', answer: 'ไม่ส่งเสียงดัง / เป็นระเบียบ' },
    { type: 'manner', prompt: 'เข้าแถวบนเวทีควรทำอย่างไร', answer: 'เป็นระเบียบตามคิว' },
    { type: 'why', prompt: 'ทำไมสีหน้าสำคัญในการรำ', answer: 'สื่ออารมณ์' },
    { type: 'why', prompt: 'ทำไมไม่ควรเกร็งข้อมือตอนจีบ', answer: 'ท่าไม่สวย / เจ็บ' },
    { type: 'pose', prompt: 'ลำดับง่าย ๆ: เตรียม → ไหว้ → …', answer: 'เริ่มท่ารำ / ก้าว' },
    { type: 'manner', prompt: 'ทำอย่างไรเมื่อทำท่าผิดบนเวที', answer: 'นิ่งต่อ / ไม่หัวเราะเสียงดัง' },
    { type: 'why', prompt: 'หายใจก่อนเริ่มช่วยอะไร', answer: 'ผ่อนคลาย / พร้อม' },
    { type: 'pose', prompt: 'วาดมือจีบแบบง่าย ๆ', answer: 'ตามที่วาด' },
    { type: 'manner', prompt: 'ถอดรองเท้า/เตรียมชุดก่อนขึ้นเวทีหรือไม่', answer: 'ตามข้อตกลงครู · เตรียมตัว' },
    { type: 'why', prompt: 'ทำไมต้องซ้อมช้าก่อนเร็ว', answer: 'จำท่าได้แม่น' },
    { type: 'pose', prompt: 'ท่ารำที่บ้านฝึกได้โดยไม่ต้องมีเพลงหรือไม่', answer: 'ได้ · นับจังหวะเอง' },
    { type: 'manner', prompt: 'สรุปมารยาทนาฏศิลป์ 2 ข้อ', answer: 'เช่น เคารพ/เป็นระเบียบ' },
  ],
  renderBody: reasonBody,
});

sheet({
  dir: 'career', file: 'home-crafts-worksheet.html', hub: '/games/career/home-crafts-media.html',
  subject: 'การงานอาชีพ', indicators: ['ง 1.1 ป.1/1', 'ง 1.1 ป.1/2', 'ง 1.1 ป.2/1'],
  icon: '🧵', title: 'ใบงานงานบ้าน-งานประดิษฐ์', gradeLabel: 'ป.1–ป.3', mediaLabel: 'สื่องานบ้าน-ประดิษฐ์',
  directions: 'ตอบเรื่องงานบ้าน ความปลอดภัย และงานฝีมือเบื้องต้น',
  topicOptions: '<option value="mixed">รวม</option><option value="home">งานบ้าน</option><option value="craft">ประดิษฐ์</option><option value="safe">ปลอดภัย</option>',
  items: [
    { type: 'home', prompt: 'หลังเล่นของเล่นควรทำอะไร', answer: 'เก็บเข้าที่' },
    { type: 'home', prompt: 'จัดของดีอย่างไร', answer: 'แยกประเภท' },
    { type: 'craft', prompt: 'ใช้กาวอย่างไรไม่เลอะ', answer: 'แตะบาง ๆ' },
    { type: 'safe', prompt: 'ส่งกรรไกรอย่างไร', answer: 'จับด้ามส่ง' },
    { type: 'craft', prompt: 'วัสดุเหลือใช้ตัวอย่าง', answer: 'กล่องนม / กระดาษ' },
    { type: 'safe', prompt: 'หลังงานฝีมือควรทำอะไร', answer: 'ล้างมือ' },
    { type: 'home', prompt: 'งานบ้านที่เด็กทำได้ 1 อย่าง', answer: 'กวาด / เก็บผ้า ฯลฯ' },
    { type: 'craft', prompt: 'พับกระดาษให้สวยควรทำอย่างไร', answer: 'พับตรง กดรอย' },
    { type: 'safe', prompt: 'ทำไมไม่วิ่งขณะถือกรรไกร', answer: 'อันตราย' },
    { type: 'home', prompt: 'ทำไมต้องรักษาความสะอาดบ้าน', answer: 'สุขภาพ / น่าอยู่' },
    { type: 'craft', prompt: 'ออกแบบของประดิษฐ์จากกล่อง 1 ชิ้น', answer: 'ตามไอเดีย' },
    { type: 'safe', prompt: 'เครื่องมือคมต้องเก็บอย่างไร', answer: 'เก็บให้พ้นเด็กเล็ก / เข้าที่' },
    { type: 'home', prompt: 'ช่วยพ่อแม่ทำงานบ้านแล้วรู้สึกอย่างไร', answer: 'ตามนักเรียน' },
    { type: 'craft', prompt: 'ทำไมใช้วัสดุเหลือใช้ดีต่อสิ่งแวดล้อม', answer: 'ลดขยะ' },
    { type: 'safe', prompt: 'ตัดกระดาษควรหันคมกรรไกรไปทางใด', answer: 'ออกจากตัว/เพื่อน' },
    { type: 'home', prompt: 'สรุปขั้นตอนเก็บห้อง 3 ขั้น', answer: 'เก็บของ→กวาด→ตรวจ' },
  ],
  renderBody: reasonBody,
});

sheet({
  dir: 'career', file: 'school-garden-worksheet.html', hub: '/games/career/school-garden-media.html',
  subject: 'การงานอาชีพ', indicators: ['ง 1.1 ป.3/3', 'ง 1.1 ป.4/4'],
  icon: '🌱', title: 'ใบงานการเกษตรในโรงเรียน', gradeLabel: 'ป.3–ป.4', mediaLabel: 'สื่อเกษตรโรงเรียน',
  directions: 'ตอบขั้นตอนปลูกพืช รดน้ำ ดูแลแปลง · เขียนเหตุผลสั้น ๆ',
  topicOptions: '<option value="mixed">รวม</option><option value="grow">ปลูก</option><option value="care">ดูแล</option><option value="why">เหตุผล</option>',
  items: [
    { type: 'grow', prompt: 'ทำไมต้องพรวนดิน', answer: 'ร่วนซุย รากเดินดี' },
    { type: 'grow', prompt: 'ฝังเมล็ดลึกเกินเกิดอะไร', answer: 'งอกยาก' },
    { type: 'care', prompt: 'ควรรดน้ำช่วงใด', answer: 'เช้าหรือเย็น' },
    { type: 'care', prompt: 'วัชพืชแย่งอะไรจากพืช', answer: 'น้ำ อาหาร แสง' },
    { type: 'why', prompt: 'เต่าทองมีประโยชน์อย่างไร', answer: 'กินเพลี้ย' },
    { type: 'grow', prompt: 'ลำดับ: เตรียมดิน → … → รดน้ำ', answer: 'เพาะเมล็ด' },
    { type: 'care', prompt: 'ดินแฉะเกินไปเสี่ยงอะไร', answer: 'รากเน่า' },
    { type: 'why', prompt: 'ทำไมต้องสังเกตแมลงในแปลง', answer: 'แยกศัตรู/มีประโยชน์' },
    { type: 'grow', prompt: 'เก็บเกี่ยวเมื่อใด', answer: 'เมื่อโตพอ' },
    { type: 'care', prompt: 'ถอนวัชพืชควรระวังอะไร', answer: 'อย่าถอนต้นกล้า' },
    { type: 'why', prompt: 'ปลูกผักในโรงเรียนได้อะไรบ้าง', answer: 'อาหาร / ทักษะ / รับผิดชอบ' },
    { type: 'grow', prompt: 'วาดขั้นตอนปลูก 4 ช่อง', answer: 'ตามสื่อ' },
    { type: 'care', prompt: 'ถ้าลืมรดน้ำหลายวันพืชเป็นอย่างไร', answer: 'เหี่ยว / ตาย' },
    { type: 'why', prompt: 'ปุ๋ยคอกช่วยดินอย่างไร', answer: 'เพิ่มอินทรียวัตถุ' },
    { type: 'grow', prompt: 'เลือกพืชที่ปลูกง่ายในโรงเรียน 1 ชนิด', answer: 'เช่น ผักบุ้ง มะเขือ' },
    { type: 'care', prompt: 'สรุปหน้าที่นักเรียนเวรแปลงผัก', answer: 'รดน้ำ ถอนหญ้า สังเกต' },
  ],
  renderBody: reasonBody,
});

sheet({
  dir: 'career', file: 'food-nutrition-worksheet.html', hub: '/games/career/food-nutrition-media.html',
  subject: 'การงานอาชีพ', indicators: ['ง 1.1 ป.2/1', 'ง 1.1 ป.3/1'],
  icon: '🥗', title: 'ใบงานอาหาร-โภชนาการ', gradeLabel: 'ป.2–ป.3', mediaLabel: 'สื่ออาหาร-โภชนาการ',
  directions: 'จำแนกกลุ่มอาหารและสุขลักษณะ · อธิบายเหตุผลสั้น ๆ',
  topicOptions: '<option value="mixed">รวม</option><option value="group">กลุ่มอาหาร</option><option value="habit">นิสัย</option><option value="safe">สุขลักษณะ</option>',
  items: [
    { type: 'group', prompt: 'ข้าวจัดเป็นกลุ่มใด', answer: 'พลังงาน / แป้ง' },
    { type: 'group', prompt: 'ไข่ให้สารอาหารหลักใด', answer: 'โปรตีน' },
    { type: 'group', prompt: 'ผักช่วยเรื่องใด', answer: 'วิตามิน / ใยอาหาร' },
    { type: 'group', prompt: 'นมเด่นเรื่องใด', answer: 'แคลเซียม' },
    { type: 'habit', prompt: 'ทำไมไม่ควรหวานจัดบ่อย', answer: 'ฟันผุ / อ้วน' },
    { type: 'habit', prompt: 'ทำไมมื้อเช้าสำคัญ', answer: 'มีแรงเรียน / พลังงาน' },
    { type: 'safe', prompt: 'ก่อนปรุงอาหารควรทำอะไร', answer: 'ล้างมือ / ล้างวัตถุดิบ' },
    { type: 'safe', prompt: 'ของสุกกับดิบควรแยกอย่างไร', answer: 'ไม่ปนกัน' },
    { type: 'group', prompt: 'จัดอาหารกลางวันสมดุล 1 จาน', answer: 'มีข้าว โปรตีน ผัก' },
    { type: 'habit', prompt: 'ผลไม้แทนของหวานได้อย่างไร', answer: 'ให้วิตามิน หวานธรรมชาติ' },
    { type: 'safe', prompt: 'ภาชนะไม่สะอาดเสี่ยงอะไร', answer: 'ท้องเสีย / เชื้อโรค' },
    { type: 'group', prompt: 'ถั่วเหลืองแทนเนื้อได้อย่างไร', answer: 'โปรตีนพืช' },
    { type: 'habit', prompt: 'ดื่มน้ำเปล่าสำคัญอย่างไร', answer: 'ร่างกายต้องการน้ำ' },
    { type: 'safe', prompt: 'ล้างผักผลไม้เพื่ออะไร', answer: 'ลดสาร/สิ่งสกปรก' },
    { type: 'group', prompt: 'ของทอดบ่อย ๆ ดีหรือไม่ เพราะเหตุใด', answer: 'ไม่ดี · ไขมันสูง' },
    { type: 'habit', prompt: 'ตั้งเป้าหมายอาหารดี 1 ข้อของตน', answer: 'ตามนักเรียน' },
  ],
  renderBody: reasonBody,
});

sheet({
  dir: 'tech', file: 'algorithm-unplugged-worksheet.html', hub: '/games/tech/algorithm-unplugged-media.html',
  subject: 'วิทยาศาสตร์', indicators: ['ว 4.2 ป.1/2', 'ว 4.2 ป.2/1', 'ว 4.2 ป.3/1'],
  icon: '🧭', title: 'ใบงานอัลกอริทึม unplugged', gradeLabel: 'ป.1–ป.3', mediaLabel: 'สื่ออัลกอริทึม',
  directions: 'เขียนลำดับขั้นตอน เงื่อนไข ทำซ้ำ · แก้จุดผิด',
  topicOptions: '<option value="mixed">รวม</option><option value="steps">ลำดับ</option><option value="logic">เงื่อนไข/ลูป</option><option value="debug">ดีบัก</option>',
  items: [
    { type: 'steps', prompt: 'อัลกอริทึมคืออะไร', answer: 'ลำดับขั้นตอนแก้ปัญหา' },
    { type: 'steps', prompt: 'เขียน 4 ขั้นการแปรงฟัน', answer: 'ตามลำดับสมเหตุสมผล' },
    { type: 'steps', prompt: 'คำสั่งดีควรเป็นอย่างไร', answer: 'ชัดเจน' },
    { type: 'logic', prompt: 'ตบมือ 4 ครั้งคือแนวคิดใด', answer: 'ทำซ้ำ / ลูป' },
    { type: 'logic', prompt: 'ถ้าฝนตกเอาร่ม คืออะไร', answer: 'เงื่อนไข' },
    { type: 'debug', prompt: 'ดีบักคืออะไร', answer: 'หาและแก้จุดผิด' },
    { type: 'steps', prompt: 'ลำดับผูกเชือกรองเท้า (อย่างน้อย 3 ขั้น)', answer: 'ตามที่เขียน' },
    { type: 'logic', prompt: 'ถ้าหิวแล้ว… เติมเงื่อนไข', answer: 'เช่น กินข้าว' },
    { type: 'debug', prompt: 'ขั้น “ใส่ถุงเท้า” มาก่อน “ถอดรองเท้า” ผิดตรงไหน', answer: 'ลำดับสลับ' },
    { type: 'steps', prompt: 'ใช้ลูกศรนำทางบนตารางทำอะไร', answer: 'สั่งทิศทาง' },
    { type: 'logic', prompt: 'ทำซ้ำจนถึงกำแพงแล้วหยุด ออกแบบคำสั่ง', answer: 'ลูป+เงื่อนไข' },
    { type: 'debug', prompt: 'เพื่อนทำตามคำสั่งแล้วชนกำแพง แก้ยังไง', answer: 'ตรวจทิศ/จำนวนก้าว' },
    { type: 'steps', prompt: 'ทำไมต้องเรียงขั้นให้ถูก', answer: 'ผลลัพธ์จะถูก' },
    { type: 'logic', prompt: 'ยกตัวอย่างเงื่อนไขในชีวิตประจำวัน', answer: 'ตามนักเรียน' },
    { type: 'debug', prompt: 'ลองทีละขั้นช่วยดีบักอย่างไร', answer: 'เจอจุดผิดเร็ว' },
    { type: 'steps', prompt: 'สรุปอัลกอริทึมด้วยคำของคุณ', answer: 'ตามนักเรียน' },
  ],
  renderBody: reasonBody,
});

sheet({
  dir: 'tech', file: 'data-presentation-worksheet.html', hub: '/games/tech/data-presentation-media.html',
  subject: 'วิทยาศาสตร์', indicators: ['ว 4.2 ป.3/4', 'ว 4.2 ป.4/4'],
  icon: '📊', title: 'ใบงานข้อมูลและการนำเสนอ', gradeLabel: 'ป.3–ป.4', mediaLabel: 'สื่อข้อมูล-นำเสนอ',
  directions: 'อ่านตาราง/กราฟ สรุปข้อมูล · ตรวจความถูกต้อง',
  topicOptions: '<option value="mixed">รวม</option><option value="collect">เก็บข้อมูล</option><option value="chart">กราฟ</option><option value="tell">สรุป</option>',
  items: [
    { type: 'collect', prompt: 'เก็บข้อมูลเริ่มจากอะไร', answer: 'นับ / บันทึก' },
    { type: 'collect', prompt: 'ตารางช่วยเรื่องใด', answer: 'จัดข้อมูลให้อ่านง่าย' },
    { type: 'chart', prompt: 'กราฟแท่งเหมาะกับอะไร', answer: 'เปรียบเทียบปริมาณ' },
    { type: 'chart', prompt: 'แผนภาพวงกลมแสดงอะไรได้ดี', answer: 'สัดส่วน' },
    { type: 'tell', prompt: 'หลังทำกราฟควรทำอะไร', answer: 'สรุปผล' },
    { type: 'tell', prompt: 'ตรวจข้อมูลเพื่ออะไร', answer: 'ความถูกต้อง' },
    { type: 'collect', prompt: 'ออกแบบตารางสำรวจผลไม้โปรด (หัวตาราง)', answer: 'ชื่อ / จำนวน' },
    { type: 'chart', prompt: 'แกนกราฟควรมีอะไรกำกับ', answer: 'หน่วย / ชื่อแกน' },
    { type: 'chart', prompt: 'ถ้าแท่ง A สูงกว่า B แปลว่าอะไร', answer: 'A มากกว่า B' },
    { type: 'tell', prompt: 'สรุปผลสำรวจ 2 ประโยค', answer: 'ตามข้อมูลสมมติ/จริง' },
    { type: 'collect', prompt: 'ทำไมหัวตารางต้องชัด', answer: 'ไม่งง / อ่านถูก' },
    { type: 'chart', prompt: 'วงกลมรวมต้องครบกี่เปอร์เซ็นต์', answer: '100%' },
    { type: 'tell', prompt: 'ถ้าตัวเลขในตารางกับกราฟไม่ตรง ทำไง', answer: 'นับใหม่ / แก้กราฟ' },
    { type: 'collect', prompt: 'วิธีเก็บข้อมูลเพื่อนชอบสี', answer: 'ถามแล้วติ๊กตาราง' },
    { type: 'chart', prompt: 'เลือกกราฟแท่งหรือวงกลมเมื่อเปรียบเทียบจำนวน', answer: 'แท่ง' },
    { type: 'tell', prompt: 'นำเสนอหน้าชั้นควรพูดสั้นหรือยาว', answer: 'สั้น ชัด' },
  ],
  renderBody: reasonBody,
});

sheet({
  dir: 'social', file: 'thai-geography-worksheet.html', hub: '/games/social/thai-geography-media.html',
  subject: 'สังคมศึกษา', indicators: ['ส 5.1 ป.3/1', 'ส 5.1 ป.3/2', 'ส 5.1 ป.4/1'],
  icon: '🗺️', title: 'ใบงานภูมิศาสตร์ไทย', gradeLabel: 'ป.3–ป.4', mediaLabel: 'สื่อภูมิศาสตร์ไทย',
  directions: 'ตอบเรื่องทิศ ภาคของไทย ลักษณะภูมิประเทศ',
  topicOptions: '<option value="mixed">รวม</option><option value="dir">ทิศ</option><option value="region">ภาค</option><option value="place">ที่ตั้ง</option>',
  items: [
    { type: 'dir', prompt: 'ดวงอาทิตย์ขึ้นทางทิศใด', answer: 'ตะวันออก' },
    { type: 'dir', prompt: 'ทิศตรงข้ามเหนือคือทิศใด', answer: 'ใต้' },
    { type: 'region', prompt: 'ภาคเหนือมีลักษณะเด่น', answer: 'ภูเขา / อากาศเย็น' },
    { type: 'region', prompt: 'ภาคกลางเหมาะปลูกอะไร', answer: 'ข้าว' },
    { type: 'region', prompt: 'อีสานคือภาคใด', answer: 'ตะวันออกเฉียงเหนือ' },
    { type: 'region', prompt: 'ภาคใต้ติดอะไร', answer: 'ทะเล' },
    { type: 'place', prompt: 'อุดรธานีอยู่ภาคใด', answer: 'ตะวันออกเฉียงเหนือ' },
    { type: 'place', prompt: 'กรุงเทพฯ อยู่ภาคใด', answer: 'กลาง' },
    { type: 'dir', prompt: 'ใช้เข็มทิศทำไม', answer: 'หาทิศ' },
    { type: 'region', prompt: 'จับคู่: สวนยาง–ภาค…', answer: 'ใต้' },
    { type: 'region', prompt: 'จับคู่: ที่ราบสูง–ภาค…', answer: 'ตะวันออกเฉียงเหนือ' },
    { type: 'place', prompt: 'ชี้จังหวัดตนเองบนแผนที่ (อธิบาย)', answer: 'อุดรธานี / ตามจริง' },
    { type: 'dir', prompt: 'ถ้าหันหน้าไปทิศเหนือ ซ้ายมือคือทิศใด', answer: 'ตะวันตก' },
    { type: 'region', prompt: 'ทำไมภาคกลางมีนาข้าวมาก', answer: 'ที่ราบลุ่มแม่น้ำ' },
    { type: 'place', prompt: 'โรงเรียนบ้านคำไผ่อยู่จังหวัดใด', answer: 'อุดรธานี' },
    { type: 'region', prompt: 'สรุปภาคของไทยมีกี่ภาคหลักที่เรียน', answer: '4 (เหนือ กลาง อีสาน ใต้) หรือตามที่ครูสอน' },
  ],
  renderBody: reasonBody,
});

sheet({
  dir: 'social', file: 'citizen-duties-p123-worksheet.html', hub: '/games/social/citizen-duties-p123-media.html',
  subject: 'สังคมศึกษา', indicators: ['ส 2.1 ป.1/1', 'ส 2.1 ป.2/1', 'ส 2.2 ป.1/2'],
  icon: '🏛️', title: 'ใบงานหน้าที่พลเมือง ป.ต้น', gradeLabel: 'ป.1–ป.3', mediaLabel: 'สื่อหน้าที่พลเมือง',
  directions: 'ตอบหน้าที่พลเมืองดีในโรงเรียน บ้าน และสังคม',
  topicOptions: '<option value="mixed">รวม</option><option value="school">โรงเรียน</option><option value="home">บ้าน</option><option value="society">สังคม</option>',
  items: [
    { type: 'society', prompt: 'ตอนเพลงชาติควรทำอย่างไร', answer: 'ยืนตรงเคารพ' },
    { type: 'school', prompt: 'เมื่อครูอธิบายควรทำอะไร', answer: 'ตั้งใจฟัง' },
    { type: 'school', prompt: 'อยากพูดในห้องควรทำอย่างไร', answer: 'ยกมือ' },
    { type: 'society', prompt: 'ขยะควรทิ้งที่ไหน', answer: 'ถังขยะ' },
    { type: 'home', prompt: 'หน้าที่ที่บ้านของเด็กตัวอย่าง', answer: 'ช่วยงานบ้าน / เก็บของ' },
    { type: 'school', prompt: 'พลเมืองดีทำอย่างไรกับเพื่อน', answer: 'ช่วยเหลือ ไม่รังแก' },
    { type: 'society', prompt: 'เข้าคิวแสดงถึงอะไร', answer: 'ระเบียบ / ยุติธรรม' },
    { type: 'home', prompt: 'ช่วยพ่อแม่แล้วได้อะไร', answer: 'ความรับผิดชอบ / ความอบอุ่น' },
    { type: 'school', prompt: 'ไม่ขีดเขียนโต๊ะเพราะอะไร', answer: 'รักษาสมบัติส่วนรวม' },
    { type: 'society', prompt: 'พูดสุภาพสำคัญอย่างไร', answer: 'ไม่ทำให้ผู้อื่นเสียใจ' },
    { type: 'school', prompt: 'เห็นเพื่อนล้มควรทำอย่างไร', answer: 'ช่วยพยุง / บอกครู' },
    { type: 'home', prompt: 'ตั้งหน้าที่บ้าน 1 ข้อที่จะทำสัปดาห์นี้', answer: 'ตามนักเรียน' },
    { type: 'society', prompt: 'ถอดหมวกตอนเคารพธงชาติหรือไม่', answer: 'ควร' },
    { type: 'school', prompt: 'ถามครูเมื่อไม่เข้าใจอย่างสุภาพอย่างไร', answer: 'ยกมือ / ใช้คำสุภาพ' },
    { type: 'society', prompt: 'แยกขยะช่วยอะไร', answer: 'สิ่งแวดล้อม' },
    { type: 'home', prompt: 'สรุปหน้าที่พลเมืองดี 3 ข้อ', answer: 'เช่น เคารพ ช่วยเหลือ รักษาความสะอาด' },
  ],
  renderBody: reasonBody,
});

const covers = [
  { out: 'public/games/arts/visual-elements-media-cover.png', title: 'ทัศนธาตุ', subtitle: 'เส้น · รูปทรง · สี · พื้นผิว', emoji: '🎨', c1: '#fae8ff', c2: '#e879f9', ink: '#86198f' },
  { out: 'public/games/arts/rhythm-music-media-cover.png', title: 'จังหวะดนตรี', subtitle: 'ตบจังหวะ · ทำนอง · เครื่องดนตรี', emoji: '🥁', c1: '#fce7f3', c2: '#f472b6', ink: '#9d174d' },
  { out: 'public/games/arts/dance-basics-media-cover.png', title: 'นาฏศิลป์พื้นฐาน', subtitle: 'ไหว้ · จีบ · ก้าวเท้า', emoji: '💃', c1: '#ffe4e6', c2: '#fb7185', ink: '#9f1239' },
  { out: 'public/games/career/home-crafts-media-cover.png', title: 'งานบ้าน-ประดิษฐ์', subtitle: 'เก็บกวาด · ตัดปะ · ปลอดภัย', emoji: '🧵', c1: '#ffedd5', c2: '#fb923c', ink: '#9a3412' },
  { out: 'public/games/career/school-garden-media-cover.png', title: 'เกษตรโรงเรียน', subtitle: 'ปลูก · รดน้ำ · ดูแลแปลง', emoji: '🌱', c1: '#dcfce7', c2: '#4ade80', ink: '#166534' },
  { out: 'public/games/career/food-nutrition-media-cover.png', title: 'อาหาร-โภชนาการ', subtitle: 'กลุ่มอาหาร · สุขลักษณะ', emoji: '🥗', c1: '#fef9c3', c2: '#facc15', ink: '#854d0e' },
  { out: 'public/games/tech/algorithm-unplugged-media-cover.png', title: 'อัลกอริทึม', subtitle: 'ลำดับ · เงื่อนไข · ทำซ้ำ', emoji: '🧭', c1: '#dbeafe', c2: '#60a5fa', ink: '#1e3a8a' },
  { out: 'public/games/tech/data-presentation-media-cover.png', title: 'ข้อมูล-นำเสนอ', subtitle: 'ตาราง · กราฟ · สรุปผล', emoji: '📊', c1: '#cffafe', c2: '#22d3ee', ink: '#155e75' },
  { out: 'public/games/social/thai-geography-media-cover.png', title: 'ภูมิศาสตร์ไทย', subtitle: 'ทิศ · ภาค · ที่ตั้ง', emoji: '🗺️', c1: '#ccfbf1', c2: '#2dd4bf', ink: '#115e59' },
  { out: 'public/games/social/citizen-duties-p123-media-cover.png', title: 'หน้าที่พลเมือง', subtitle: 'ป.ต้น · โรงเรียน · สังคม', emoji: '🏛️', c1: '#dbeafe', c2: '#818cf8', ink: '#312e81' },
];

for (const c of covers) await cover(c);
console.log('done Phase 11 assets (10 media + 10 worksheets + 10 covers)');
