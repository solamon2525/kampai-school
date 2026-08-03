#!/usr/bin/env node
/**
 * Media Batch AA: O2 calendar · S5 organs · E4 classroom English · T6 literature note
 */
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function cover({ out, title, subtitle, emoji, c1, c2, ink }) {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/>
  </linearGradient></defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <text x="640" y="220" text-anchor="middle" font-size="110">${emoji}</text>
  <text x="640" y="360" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="46" font-weight="800" fill="${ink}">${title}</text>
  <text x="640" y="430" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="26" font-weight="700" fill="${ink}" opacity=".85">${subtitle}</text>
  <text x="640" y="620" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="26" font-weight="700" fill="#64748b">📚 สื่อการสอน · โรงเรียนบ้านคำไผ่</text>
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
  </div>
  <div class="stage" id="stage">${bodyHtml}</div>
  <div class="footer">โรงเรียนบ้านคำไผ่ · สื่อการสอน · ไม่เก็บคะแนน</div>
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

// —— O2 Calendar ——
write('public/games/social/thai-calendar-media.html', shell(
  { title: 'ปฏิทินวันสำคัญไทย', h1: '📅 ปฏิทินวันสำคัญไทย', badge: 'ป.1–6 · สังคม', accent: '#b45309', line: '#fde68a', slug: 'thai-calendar-media' },
  `.grid{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
   .card{border:2px solid var(--line);border-radius:14px;padding:12px;background:#fffbeb;cursor:pointer;font-weight:700}
   .card.on{border-color:var(--deep);background:#ffedd5}
   .card .d{font-size:1.3rem;color:var(--deep)}
   .detail{margin-top:14px;padding:14px;border-radius:14px;background:#fff7ed;border:2px dashed var(--line);font-weight:600;line-height:1.55;min-height:90px}
   .practice{display:none;flex-direction:column;gap:12px;max-width:480px;margin:0 auto}
   .shell.mode-practice .learn{display:none}.shell.mode-practice .practice{display:flex}
   .choice{font-family:inherit;font-weight:800;padding:12px;border:2px solid var(--line);border-radius:12px;background:#fff;cursor:pointer;text-align:left}
   .choice.ok{background:#dcfce7}.choice.no{background:#fee2e2}`,
  `<div class="learn"><div class="grid" id="days"></div><div class="detail" id="detail">แตะวันสำคัญเพื่ออ่านรายละเอียด</div></div>
   <div class="practice"><p style="font-weight:800;color:var(--deep)" id="prQ"></p><div id="prChoices" style="display:grid;gap:8px"></div><p id="prFb" style="font-weight:800;min-height:24px"></p><button type="button" class="btn btn-primary" id="btnNext">ข้อถัดไป</button></div>`,
  `const DAYS=[
  {m:1,d:1,name:'วันขึ้นปีใหม่',why:'เริ่มต้นปีใหม่ตามสากล · อวยพรกัน'},
  {m:1,d:16,name:'วันครู',why:'ระลึกพระคุณครู · พิธีไหว้ครูในโรงเรียน'},
  {m:2,d:14,name:'วันแห่งความรัก (ทั่วไป)',why:'รู้จักในวัฒนธรรมร่วมสมัย · ไม่ใช่วันหยุดราชการ'},
  {m:4,d:6,name:'วันจักรี',why:'วันสถาปนาราชวงศ์จักรี'},
  {m:4,d:13,name:'วันสงกรานต์',why:'ปีใหม่ไทย · สรงน้ำพระ · รดน้ำผู้ใหญ่'},
  {m:5,d:1,name:'วันแรงงาน',why:'เทิดทูนผู้ใช้แรงงาน'},
  {m:5,d:5,name:'วันฉัตรมงคล',why:'พิธีบรมราชาภิเษก (วันสำคัญของชาติ)'},
  {m:6,d:3,name:'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าฯ',why:'วันสำคัญของชาติ'},
  {m:7,d:28,name:'วันเฉลิมพระชนมพรรษา ร.10',why:'วันสำคัญของชาติ'},
  {m:8,d:12,name:'วันแม่แห่งชาติ',why:'วันเฉลิมพระชนมพรรษาสมเด็จพระนางเจ้าสิริกิติ์'},
  {m:10,d:13,name:'วันนวมินทรมหาราช',why:'วันคล้ายวันสวรรคต ร.9'},
  {m:10,d:23,name:'วันปิยมหาราช',why:'วันคล้ายวันสวรรคต ร.5'},
  {m:12,d:5,name:'วันพ่อแห่งชาติ',why:'วันเฉลิมพระชนมพรรษา ร.9'},
  {m:12,d:10,name:'วันรัฐธรรมนูญ',why:'ระลึกการประกาศใช้รัฐธรรมนูญ'},
  {m:12,d:31,name:'วันสิ้นปี',why:'ปิดปี · เตรียมปีใหม่'},
];
let cur=DAYS[0];
function setMode(m){document.getElementById('shell').classList.toggle('mode-practice',m==='practice');document.getElementById('hintText').textContent=m==='learn'?'แตะวันสำคัญ':'ตอบคำถาม';if(m==='practice')nextPr();}
function render(){document.getElementById('days').innerHTML=DAYS.map((x,i)=>'<button type="button" class="card'+(x===cur?' on':'')+'" data-i="'+i+'"><div class="d">'+x.d+'/'+x.m+'</div>'+x.name+'</button>').join('');
  document.getElementById('detail').innerHTML='<strong>'+cur.name+'</strong> ('+cur.d+'/'+cur.m+')<br/>'+cur.why;}
document.getElementById('days').onclick=e=>{const b=e.target.closest('[data-i]');if(!b)return;cur=DAYS[+b.dataset.i];render();};
function nextPr(){const a=DAYS[Math.floor(Math.random()*DAYS.length)];document.getElementById('prQ').textContent='วันสำคัญในวันที่ '+a.d+'/'+a.m+' คือข้อใด?';document.getElementById('prFb').textContent='';
  const opts=new Set([a.name]);while(opts.size<4)opts.add(DAYS[Math.floor(Math.random()*DAYS.length)].name);
  const box=document.getElementById('prChoices');box.innerHTML=[...opts].sort(()=>Math.random()-0.5).map(o=>'<button type="button" class="choice">'+o+'</button>').join('');
  box.onclick=e=>{const b=e.target.closest('.choice');if(!b)return;const ok=b.textContent===a.name;b.classList.add(ok?'ok':'no');document.getElementById('prFb').textContent=ok?'✅ ถูกต้อง!':'เฉลย '+a.name;if(KAMPAI&&KAMPAI.sound)(ok?KAMPAI.sound.correct:KAMPAI.sound.wrong)();};}
document.getElementById('btnNext').onclick=nextPr;render();setMode('learn');`
));

// —— S5 organs ——
write('public/games/science/human-organs-media.html', shell(
  { title: 'อวัยวะสำคัญของร่างกาย', h1: '🫀 อวัยวะสำคัญของร่างกาย', badge: 'ป.4–6 · วิทยาศาสตร์', accent: '#be123c', line: '#fecdd3', slug: 'human-organs-media' },
  `.layout{display:grid;gap:14px}@media(min-width:860px){.layout{grid-template-columns:1fr 1fr}}
   .pick{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:10px}
   .pick button{font-family:inherit;font-weight:800;padding:10px 12px;border:2px solid var(--line);border-radius:12px;background:#fff;cursor:pointer;color:var(--deep)}
   .pick button.on{background:var(--deep);color:#fff}
   .viz{min-height:220px;border:2px dashed var(--line);border-radius:16px;background:#fff1f2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:16px;text-align:center}
   .viz .big{font-size:4rem}
   .box{background:#fff1f2;border:2px solid var(--line);border-radius:14px;padding:14px;font-weight:600;line-height:1.55}
   .practice{display:none;flex-direction:column;gap:12px;max-width:480px;margin:0 auto}
   .shell.mode-practice .learn{display:none}.shell.mode-practice .practice{display:flex}
   .choice{font-family:inherit;font-weight:800;padding:12px;border:2px solid var(--line);border-radius:12px;background:#fff;cursor:pointer;text-align:left}
   .choice.ok{background:#dcfce7}.choice.no{background:#fee2e2}`,
  `<div class="learn"><div class="pick" id="pick"></div><div class="layout"><div class="viz" id="viz"></div><div class="box" id="info"></div></div></div>
   <div class="practice"><p style="font-weight:800;color:var(--deep)" id="prQ"></p><div id="prChoices" style="display:grid;gap:8px"></div><p id="prFb" style="font-weight:800;min-height:24px"></p><button type="button" class="btn btn-primary" id="btnNext">ข้อถัดไป</button></div>`,
  `const ORG=[
  {id:'heart',emoji:'❤️',name:'หัวใจ',job:'สูบฉีดเลือดไปทั่วร่างกาย',tip:'เต้นประมาณ 60–100 ครั้ง/นาที เมื่อพัก'},
  {id:'lung',emoji:'🫁',name:'ปอด',job:'แลกเปลี่ยนแก๊ส — รับออกซิเจน คายคาร์บอนไดออกไซด์',tip:'มี 2 ข้าง ซ้าย–ขวา'},
  {id:'brain',emoji:'🧠',name:'สมอง',job:'ควบคุมความคิด ความจำ การเคลื่อนไหว',tip:'อยู่ในการป้องกันของกะโหลกศีรษะ'},
  {id:'stomach',emoji:'🫙',name:'กระเพาะอาหาร',job:'ย่อยอาหารด้วยกรดและเอนไซม์',tip:'ต่อกับหลอดอาหารและลำไส้เล็ก'},
  {id:'liver',emoji:'🟤',name:'ตับ',job:'ช่วยย่อยไขมัน เก็บพลังงาน กรองสารบางชนิด',tip:'อวัยวะภายในที่ใหญ่'},
  {id:'kidney',emoji:'🫘',name:'ไต',job:'กรองของเสียจากเลือด เป็นปัสสาวะ',tip:'มี 2 ข้าง'},
  {id:'intestine',emoji:'🌀',name:'ลำไส้',job:'ดูดซึมสารอาหาร (เล็ก) และน้ำ (ใหญ่)',tip:'ยาวมากเมื่อคลี่ออก'},
  {id:'bone',emoji:'🦴',name:'กระดูก',job:'ค้ำจุนร่างกาย ปกป้องอวัยวะ สำคัญต่อการเคลื่อนไหว',tip:'ดูสื่อกระดูก–กล้ามเนื้อเพิ่มได้'},
];
let cur=ORG[0];
function setMode(m){document.getElementById('shell').classList.toggle('mode-practice',m==='practice');document.getElementById('hintText').textContent=m==='learn'?'เลือกอวัยวะ':'จับคู่หน้าที่';if(m==='practice')nextPr();}
function render(){
  document.getElementById('pick').innerHTML=ORG.map(o=>'<button type="button" data-id="'+o.id+'" class="'+(o.id===cur.id?'on':'')+'">'+o.emoji+' '+o.name+'</button>').join('');
  document.getElementById('viz').innerHTML='<div class="big">'+cur.emoji+'</div><div style="font-size:1.4rem;font-weight:800;color:var(--deep)">'+cur.name+'</div>';
  document.getElementById('info').innerHTML='<strong>หน้าที่:</strong> '+cur.job+'<br/><br/><strong>เกร็ด:</strong> '+cur.tip;
}
document.getElementById('pick').onclick=e=>{const b=e.target.closest('[data-id]');if(!b)return;cur=ORG.find(o=>o.id===b.dataset.id);render();};
function nextPr(){const a=ORG[Math.floor(Math.random()*ORG.length)];document.getElementById('prQ').textContent=a.emoji+' อวัยวะนี้มีหน้าที่ข้อใด?';document.getElementById('prFb').textContent='';
  const opts=new Set([a.job]);while(opts.size<4)opts.add(ORG[Math.floor(Math.random()*ORG.length)].job);
  const box=document.getElementById('prChoices');box.innerHTML=[...opts].sort(()=>Math.random()-0.5).map(o=>'<button type="button" class="choice">'+o+'</button>').join('');
  box.onclick=e=>{const b=e.target.closest('.choice');if(!b)return;const ok=b.textContent===a.job;b.classList.add(ok?'ok':'no');document.getElementById('prFb').textContent=ok?'✅ ถูกต้อง!':'เฉลย: '+a.job;if(KAMPAI&&KAMPAI.sound)(ok?KAMPAI.sound.correct:KAMPAI.sound.wrong)();};}
document.getElementById('btnNext').onclick=nextPr;render();setMode('learn');`
));

// —— E4 Classroom English ——
write('public/games/english/classroom-english-media.html', shell(
  { title: 'Classroom English', h1: '🗣️ Classroom English Phrases', badge: 'ป.1–6 · English', accent: '#1d4ed8', line: '#bfdbfe', slug: 'classroom-english-media' },
  `.cats{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
   .cats button{font-family:inherit;font-weight:800;padding:8px 12px;border:2px solid var(--line);border-radius:999px;background:#fff;cursor:pointer;color:var(--deep)}
   .cats button.on{background:var(--deep);color:#fff}
   .list{display:grid;gap:8px}
   .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center;padding:12px;border:2px solid var(--line);border-radius:14px;background:#eff6ff}
   .en{font-weight:800;color:var(--deep);font-size:1.1rem;flex:1;min-width:140px}
   .th{font-weight:600;color:#334155;flex:1;min-width:120px}
   .practice{display:none;flex-direction:column;gap:12px;max-width:480px;margin:0 auto}
   .shell.mode-practice .learn{display:none}.shell.mode-practice .practice{display:flex}
   .choice{font-family:inherit;font-weight:800;padding:12px;border:2px solid var(--line);border-radius:12px;background:#fff;cursor:pointer;text-align:left}
   .choice.ok{background:#dcfce7}.choice.no{background:#fee2e2}`,
  `<div class="learn"><div class="cats" id="cats"></div><div class="list" id="list"></div></div>
   <div class="practice"><p style="font-weight:800;color:var(--deep)" id="prQ"></p><div id="prChoices" style="display:grid;gap:8px"></div><p id="prFb" style="font-weight:800;min-height:24px"></p><button type="button" class="btn btn-primary" id="btnNext">Next</button></div>`,
  `const DATA={
  Greetings:[{en:'Good morning',th:'สวัสดีตอนเช้า'},{en:'How are you?',th:'สบายดีไหม'},{en:'I am fine, thank you.',th:'ฉันสบายดี ขอบคุณ'},{en:'See you tomorrow',th:'พรุ่งนี้นะ'}],
  Polite:[{en:'Please',th:'ได้โปรด / กรุณา'},{en:'Thank you',th:'ขอบคุณ'},{en:'Excuse me',th:'ขอโทษ (แทรก/เรียก)'},{en:'I am sorry',th:'ขอโทษ'}],
  Classroom:[{en:'May I come in?',th:'ขออนุญาตเข้าได้ไหม'},{en:'May I go to the toilet?',th:'ขออนุญาตไปห้องน้ำ'},{en:'I do not understand',th:'ฉันไม่เข้าใจ'},{en:'Please repeat',th:'ช่วยพูดอีกครั้ง'},{en:'Open your book',th:'เปิดหนังสือ'},{en:'Listen carefully',th:'ตั้งใจฟัง'}],
  Praise:[{en:'Well done!',th:'เก่งมาก'},{en:'Good job!',th:'ทำได้ดี'},{en:'Try again',th:'ลองอีกครั้ง'}],
};
let cat='Greetings';
function setMode(m){document.getElementById('shell').classList.toggle('mode-practice',m==='practice');document.getElementById('hintText').textContent=m==='learn'?'แตะ 🔊 เพื่อฟัง':'จับคู่ความหมาย';if(m==='practice')nextPr();}
function speak(t){if(window.KAMPAI&&KAMPAI.sound&&KAMPAI.sound.speak)KAMPAI.sound.speak(t,'en-US');else if(window.speechSynthesis){const u=new SpeechSynthesisUtterance(t);u.lang='en-US';speechSynthesis.speak(u);}}
function render(){
  document.getElementById('cats').innerHTML=Object.keys(DATA).map(k=>'<button type="button" data-c="'+k+'" class="'+(k===cat?'on':'')+'">'+k+'</button>').join('');
  document.getElementById('list').innerHTML=DATA[cat].map((r,i)=>'<div class="row"><div class="en">'+r.en+'</div><div class="th">'+r.th+'</div><button type="button" class="btn btn-ghost" data-say="'+i+'">🔊</button></div>').join('');
}
document.getElementById('cats').onclick=e=>{const b=e.target.closest('[data-c]');if(!b)return;cat=b.dataset.c;render();};
document.getElementById('list').onclick=e=>{const b=e.target.closest('[data-say]');if(!b)return;speak(DATA[cat][+b.dataset.say].en);};
function flat(){return Object.values(DATA).flat();}
function nextPr(){const all=flat();const a=all[Math.floor(Math.random()*all.length)];document.getElementById('prQ').textContent='“'+a.en+'” แปลว่า?';document.getElementById('prFb').textContent='';
  const opts=new Set([a.th]);while(opts.size<4)opts.add(all[Math.floor(Math.random()*all.length)].th);
  const box=document.getElementById('prChoices');box.innerHTML=[...opts].sort(()=>Math.random()-0.5).map(o=>'<button type="button" class="choice">'+o+'</button>').join('');
  box.onclick=e=>{const b=e.target.closest('.choice');if(!b)return;const ok=b.textContent===a.th;b.classList.add(ok?'ok':'no');document.getElementById('prFb').textContent=ok?'✅ Correct!':'Answer: '+a.th;if(KAMPAI&&KAMPAI.sound)(ok?KAMPAI.sound.correct:KAMPAI.sound.wrong)();};}
document.getElementById('btnNext').onclick=nextPr;render();setMode('learn');`
));

// —— T6 literature note (reading sheet) ——
write('public/games/thai/literature-short-media.html', shell(
  { title: 'ใบความรู้วรรณคดีสั้น', h1: '📖 ใบความรู้วรรณคดีสั้น', badge: 'ป.4–6 · ภาษาไทย', accent: '#7c3aed', line: '#ddd6fe', slug: 'literature-short-media' },
  `.pick{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px}
   .pick button{font-family:inherit;font-weight:800;padding:10px 12px;border:2px solid var(--line);border-radius:12px;background:#fff;cursor:pointer;color:var(--deep)}
   .pick button.on{background:var(--deep);color:#fff}
   .paper{background:#faf5ff;border:2px solid var(--line);border-radius:16px;padding:16px;font-weight:600;line-height:1.65}
   .paper h2{color:var(--deep);margin-bottom:8px;font-size:1.2rem}
   .q{margin-top:12px;padding-top:12px;border-top:1px dashed var(--line)}
   .practice{display:none;flex-direction:column;gap:12px;max-width:520px;margin:0 auto}
   .shell.mode-practice .learn{display:none}.shell.mode-practice .practice{display:flex}
   .choice{font-family:inherit;font-weight:800;padding:12px;border:2px solid var(--line);border-radius:12px;background:#fff;cursor:pointer;text-align:left}
   .choice.ok{background:#dcfce7}.choice.no{background:#fee2e2}`,
  `<div class="learn"><div class="pick" id="pick"></div><div class="paper" id="paper"></div></div>
   <div class="practice"><p style="font-weight:800;color:var(--deep)" id="prQ"></p><div id="prChoices" style="display:grid;gap:8px"></div><p id="prFb" style="font-weight:800;min-height:24px"></p><button type="button" class="btn btn-primary" id="btnNext">ข้อถัดไป</button></div>`,
  `const STORIES=[
  {id:'sung',title:'สังข์ทอง (ย่อ)',body:'พระสังข์ถูกใส่ในกงจักรลอยน้ำ แม่ย่านางช่วยไว้ ต่อมาถอดรูปเปลือกหอย แสดงฝีมือจนได้อภิเษกกับนางรอฉาน',q:'ใครช่วยพระสังข์ตอนลอยน้ำ?',a:'แม่ย่านาง',opts:['แม่ย่านาง','ท้าวสักกะ','นางรอฉาน','พระอินทร์']},
  {id:'phra',title:'พระอภัยมณี (ย่อ)',body:'พระอภัยมณีเก่งดนตรี ถูกนางผีเสื้อสมุทรจับไป ต่อมาหนีไปกับนางสุวรรณมาลี มีบทเรียนเรื่องสติและศิลปะ',q:'พระอภัยมณีมีวิชาเด่นด้านใด?',a:'ดนตรี',opts:['ดนตรี','ดาบ','เวทมนตร์','ขี่ม้า']},
  {id:'rama',title:'รามเกียรติ์ (ย่อ)',body:'พระรามตามนางสีดาที่ถูกราวพาไป หนุมานและทหารวานรช่วยรบกับทศกัณฐ์ จนช่วยนางสีดาได้',q:'ใครพานางสีดาไป?',a:'ทศกัณฐ์',opts:['ทศกัณฐ์','หนุมาน','พระลักษมณ์','อินทรชิต']},
  {id:'folk',title:'นิทานพื้นบ้าน — ตาเจี้ย ตาแก้ว (แนว)',body:'นิทานสอนใจเรื่องความขยัน ความโลภ และผลของการเลือกทำดี/ชั่ว ใช้ถามนักเรียนว่าตัวละครควรทำอย่างไร',q:'นิทานพื้นบ้านมักสอนเรื่องใด?',a:'คติสอนใจ',opts:['คติสอนใจ','สูตรคูณ','แผนที่','วงจรไฟฟ้า']},
];
let cur=STORIES[0];
function setMode(m){document.getElementById('shell').classList.toggle('mode-practice',m==='practice');document.getElementById('hintText').textContent=m==='learn'?'อ่านใบความรู้':'ตอบคำถามท้ายเรื่อง';if(m==='practice')nextPr();}
function render(){
  document.getElementById('pick').innerHTML=STORIES.map(s=>'<button type="button" data-id="'+s.id+'" class="'+(s.id===cur.id?'on':'')+'">'+s.title+'</button>').join('');
  document.getElementById('paper').innerHTML='<h2>'+cur.title+'</h2><p>'+cur.body+'</p><div class="q"><strong>คำถามท้ายบท:</strong> '+cur.q+'</div>';
}
document.getElementById('pick').onclick=e=>{const b=e.target.closest('[data-id]');if(!b)return;cur=STORIES.find(s=>s.id===b.dataset.id);render();};
function nextPr(){const a=STORIES[Math.floor(Math.random()*STORIES.length)];document.getElementById('prQ').textContent=a.title+' — '+a.q;document.getElementById('prFb').textContent='';
  const box=document.getElementById('prChoices');box.innerHTML=a.opts.sort(()=>Math.random()-0.5).map(o=>'<button type="button" class="choice">'+o+'</button>').join('');
  box.onclick=e=>{const b=e.target.closest('.choice');if(!b)return;const ok=b.textContent===a.a;b.classList.add(ok?'ok':'no');document.getElementById('prFb').textContent=ok?'✅ ถูกต้อง!':'เฉลย '+a.a;if(KAMPAI&&KAMPAI.sound)(ok?KAMPAI.sound.correct:KAMPAI.sound.wrong)();};}
document.getElementById('btnNext').onclick=nextPr;render();setMode('learn');`
));

await cover({ out: 'public/games/social/thai-calendar-media-cover.png', title: 'ปฏิทินวันสำคัญไทย', subtitle: 'วันชาติ · วันสำคัญ · ฝึกจำ', emoji: '📅', c1: '#fef3c7', c2: '#fbbf24', ink: '#92400e' });
await cover({ out: 'public/games/science/human-organs-media-cover.png', title: 'อวัยวะสำคัญ', subtitle: 'หัวใจ · ปอด · สมอง · อื่น ๆ', emoji: '🫀', c1: '#ffe4e6', c2: '#fb7185', ink: '#9f1239' });
await cover({ out: 'public/games/english/classroom-english-media-cover.png', title: 'Classroom English', subtitle: 'Phrases for the classroom', emoji: '🗣️', c1: '#dbeafe', c2: '#60a5fa', ink: '#1e3a8a' });
await cover({ out: 'public/games/thai/literature-short-media-cover.png', title: 'วรรณคดีสั้น', subtitle: 'อ่านย่อ · คำถามท้ายบท', emoji: '📖', c1: '#ede9fe', c2: '#a78bfa', ink: '#5b21b6' });

console.log('done batch AA assets');
