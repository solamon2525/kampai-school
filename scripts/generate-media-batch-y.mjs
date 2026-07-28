#!/usr/bin/env node
/**
 * Generate Media Batch Y (E2/M4/M5/H2/light): HTML + 1280×720 covers
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
  <text x="640" y="360" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="52" font-weight="800" fill="${ink}">${title}</text>
  <text x="640" y="430" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="700" fill="${ink}" opacity=".85">${subtitle}</text>
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

const shell = ({ slug, title, badge, accent, accent2, bodyCss, bodyHtml, script }) => `<!DOCTYPE html>
<html lang="th"><head>
  <script src="/games/kampai-sdk.js"></script>
  <meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>${title} — บ้านคำไผ่</title>
  <link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700;800&display=swap" rel="stylesheet"/>
  <style>
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    :root{--deep:${accent};--line:${accent2};--muted:#64748b;--ok:#16a34a;--bad:#dc2626}
    body{font-family:'Sarabun',sans-serif;background:linear-gradient(145deg,${accent2},${accent}22);min-height:100%;padding:12px;color:#0f172a}
    .shell{max-width:1100px;margin:0 auto;background:#fff;border-radius:1.5rem;box-shadow:0 20px 50px rgba(15,23,42,.12);overflow:hidden;min-height:calc(100vh - 24px);display:flex;flex-direction:column}
    header{display:flex;flex-wrap:wrap;align-items:center;gap:10px;padding:12px 16px;background:linear-gradient(90deg,var(--deep),${accent});color:#fff}
    header h1{font-size:1.1rem;font-weight:800;flex:1;min-width:160px}
    .badge{font-size:.75rem;background:rgba(255,255,255,.2);padding:4px 10px;border-radius:999px;font-weight:700}
    .btn{font-family:inherit;font-weight:700;border:none;border-radius:12px;padding:10px 14px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px}
    .btn:active{transform:scale(.97)}
    .btn-back{background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.35);padding:8px 12px;font-size:.85rem}
    .btn-primary{background:var(--deep);color:#fff}
    .btn-accent{background:#fbbf24;color:#78350f}
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
    <h1>${title}</h1>
    <span class="badge">${badge}</span>
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
const MEDIA_SLUG='${slug}';
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

// ─── 1) Sight Words P.1–3 ───
write('public/games/english/sight-words-p123-media.html', shell({
  slug: 'sight-words-p123-media',
  title: '👁️ Sight Words ป.1–3',
  badge: 'ป.1–3 · ภาษาอังกฤษ',
  accent: '#0f766e',
  accent2: '#99f6e4',
  bodyCss: `
    .grade-tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
    .grade-tabs button{font-family:inherit;font-weight:800;border:2px solid var(--line);background:#fff;color:var(--deep);border-radius:12px;padding:8px 14px;cursor:pointer}
    .grade-tabs button.on{background:var(--deep);color:#fff}
    .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:8px}
    .tile{aspect-ratio:1.25;border-radius:14px;border:2px solid var(--line);background:#fff;cursor:pointer;display:grid;place-items:center;font-weight:800;color:var(--deep)}
    .tile.on{background:var(--deep);color:#fff}
    .panel{margin-top:14px;background:#f0fdfa;border:2px dashed var(--line);border-radius:16px;padding:16px;text-align:center}
    .word-big{font-size:2.6rem;font-weight:800;color:var(--deep);text-transform:lowercase}
    .th{font-weight:700;color:var(--muted);margin-top:6px}
    .sent{font-weight:600;margin-top:8px;line-height:1.45}
    .actions{display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap}
    .practice{display:none;max-width:480px;margin:0 auto;flex-direction:column;gap:12px;align-items:center}
    .shell.mode-practice .learn{display:none}.shell.mode-practice .practice{display:flex}
    .choices{display:flex;flex-direction:column;gap:8px;width:100%}
    .choice{font-family:inherit;font-weight:800;padding:12px;border:2px solid var(--line);border-radius:12px;background:#fff;cursor:pointer;text-align:left}
    .choice.ok{background:#dcfce7;border-color:#86efac}.choice.no{background:#fee2e2;border-color:#fca5a5}
  `,
  bodyHtml: `<div class="learn" id="learn">
    <div class="grade-tabs" id="gradeTabs"></div>
    <div class="grid" id="grid"></div>
    <div class="panel" id="panel"><p class="th">เลือกคำจากตาราง</p></div>
  </div>
  <div class="practice" id="practice">
    <p class="word-big" id="prWord">the</p>
    <p style="font-weight:700;color:var(--deep)">ความหมายใดถูกต้อง?</p>
    <div class="choices" id="prChoices"></div>
    <p id="prFb" style="font-weight:800;min-height:24px"></p>
  </div>`,
  script: `
const BANK={
  'ป.1':[{w:'I',th:'ฉัน',s:'I am happy.'},{w:'a',th:'หนึ่ง/ก',s:'I see a cat.'},{w:'the',th:'คำนำหน้านาม',s:'The dog runs.'},{w:'is',th:'เป็น/คือ',s:'She is kind.'},{w:'my',th:'ของฉัน',s:'This is my book.'},{w:'you',th:'คุณ/เธอ',s:'You are my friend.'},{w:'and',th:'และ',s:'Cats and dogs.'},{w:'to',th:'ไป/ถึง',s:'I go to school.'},{w:'it',th:'มัน',s:'It is red.'},{w:'we',th:'เรา',s:'We play.'},{w:'go',th:'ไป',s:'Go home.'},{w:'see',th:'เห็น',s:'I see you.'}],
  'ป.2':[{w:'he',th:'เขา (ผู้ชาย)',s:'He is tall.'},{w:'she',th:'เขา (ผู้หญิง)',s:'She can read.'},{w:'they',th:'พวกเขา',s:'They are friends.'},{w:'are',th:'เป็น (พหูพจน์)',s:'We are ready.'},{w:'have',th:'มี',s:'I have a pencil.'},{w:'like',th:'ชอบ',s:'I like mangoes.'},{w:'this',th:'นี่ (ใกล้)',s:'This is a pen.'},{w:'that',th:'นั่น (ไกล)',s:'That is a bird.'},{w:'can',th:'สามารถ',s:'I can jump.'},{w:'come',th:'มา',s:'Come here.'},{w:'look',th:'ดู',s:'Look at me.'},{w:'from',th:'จาก',s:'I am from Thailand.'}],
  'ป.3':[{w:'where',th:'ที่ไหน',s:'Where is my bag?'},{w:'what',th:'อะไร',s:'What is this?'},{w:'when',th:'เมื่อไร',s:'When do we eat?'},{w:'who',th:'ใคร',s:'Who is she?'},{w:'with',th:'กับ',s:'I play with friends.'},{w:'your',th:'ของคุณ',s:'Is this your book?'},{w:'said',th:'พูดว่า',s:'She said hello.'},{w:'was',th:'เคยเป็น',s:'He was happy.'},{w:'were',th:'เคยเป็น (พหูพจน์)',s:'They were here.'},{w:'some',th:'บาง/หลาย',s:'I want some water.'},{w:'many',th:'หลาย',s:'Many birds fly.'},{w:'because',th:'เพราะ',s:'I rest because I am tired.'}]
};
let grade='ป.1', cur=null, mode='learn';
function setMode(m){mode=m;document.getElementById('shell').classList.toggle('mode-practice',m==='practice');document.getElementById('hintText').textContent=m==='learn'?'แตะคำ → ฟังเสียง · ดูความหมาย':'เลือกความหมายที่ถูก';if(m==='practice')nextPractice();}
function renderTabs(){const el=document.getElementById('gradeTabs');el.innerHTML=['ป.1','ป.2','ป.3'].map(g=>'<button type="button" data-g="'+g+'" class="'+(g===grade?'on':'')+'">'+g+'</button>').join('');el.onclick=e=>{const b=e.target.closest('button');if(!b)return;grade=b.dataset.g;renderTabs();renderGrid();};}
function renderGrid(){const words=BANK[grade];const g=document.getElementById('grid');g.innerHTML=words.map((x,i)=>'<button type="button" class="tile" data-i="'+i+'">'+x.w+'</button>').join('');g.onclick=e=>{const t=e.target.closest('.tile');if(!t)return;[...g.children].forEach(c=>c.classList.toggle('on',c===t));cur=words[+t.dataset.i];showCard();};}
function showCard(){if(!cur)return;document.getElementById('panel').innerHTML='<div class="word-big">'+cur.w+'</div><div class="th">'+cur.th+'</div><div class="sent">'+cur.s+'</div><div class="actions"><button type="button" class="btn btn-primary" id="btnSpeak">🔊 ฟัง</button></div>';document.getElementById('btnSpeak').onclick=()=>{if(KAMPAI&&KAMPAI.sound)KAMPAI.sound.speak(cur.w,'en-US');else speechSynthesis.speak(new SpeechSynthesisUtterance(cur.w));};}
function nextPractice(){const words=BANK[grade];cur=words[Math.floor(Math.random()*words.length)];document.getElementById('prWord').textContent=cur.w;document.getElementById('prFb').textContent='';
  const wrong=words.filter(w=>w.w!==cur.w).sort(()=>Math.random()-0.5).slice(0,2).map(w=>w.th);
  const opts=[cur.th,...wrong].sort(()=>Math.random()-0.5);
  const box=document.getElementById('prChoices');box.innerHTML=opts.map(o=>'<button type="button" class="choice">'+o+'</button>').join('');
  box.onclick=e=>{const b=e.target.closest('.choice');if(!b||b.classList.contains('ok')||b.classList.contains('no'))return;const ok=b.textContent===cur.th;b.classList.add(ok?'ok':'no');document.getElementById('prFb').textContent=ok?'✅ ถูกต้อง!':'ลองใหม่';if(ok){if(KAMPAI&&KAMPAI.sound)KAMPAI.sound.correct();setTimeout(nextPractice,700);}else if(KAMPAI&&KAMPAI.sound)KAMPAI.sound.wrong();};}
renderTabs();renderGrid();setMode('learn');
`,
}));

// ─── 2) Clock ───
write('public/games/math/clock-media.html', shell({
  slug: 'clock-media',
  title: '🕐 นาฬิกาบอกเวลา',
  badge: 'ป.1–4 · คณิตศาสตร์',
  accent: '#1d4ed8',
  accent2: '#bfdbfe',
  bodyCss: `
    .layout{display:grid;gap:16px}@media(min-width:860px){.layout{grid-template-columns:1fr 1fr}}
    .clock-wrap{display:flex;flex-direction:column;align-items:center;gap:12px}
    .clock{width:min(280px,80vw);aspect-ratio:1;border-radius:50%;border:8px solid var(--deep);background:#fff;position:relative;box-shadow:0 12px 30px rgba(29,78,216,.15)}
    .num{position:absolute;font-weight:800;color:var(--deep);font-size:1.1rem;transform:translate(-50%,-50%)}
    .hand{position:absolute;left:50%;bottom:50%;transform-origin:50% 100%;border-radius:8px}
    .hour{width:8px;height:28%;background:#0f172a;margin-left:-4px}
    .minute{width:5px;height:38%;background:#2563eb;margin-left:-2.5px}
    .dot{position:absolute;left:50%;top:50%;width:16px;height:16px;background:var(--deep);border-radius:50%;transform:translate(-50%,-50%);z-index:2}
    .time-big{font-size:2rem;font-weight:800;color:var(--deep)}
    .ctrls{display:grid;gap:10px}
    .ctrls label{font-weight:700;color:var(--deep);display:block;margin-bottom:4px}
    .ctrls input{width:100%}
    .box{background:#eff6ff;border:2px dashed var(--line);border-radius:14px;padding:14px;font-weight:600;line-height:1.5}
    .practice{display:none;max-width:480px;margin:0 auto;flex-direction:column;gap:12px;align-items:center}
    .shell.mode-practice .learn{display:none}.shell.mode-practice .practice{display:flex}
    .choices{display:grid;grid-template-columns:1fr 1fr;gap:8px;width:100%}
    .choice{font-family:inherit;font-weight:800;padding:14px;border:2px solid var(--line);border-radius:12px;background:#fff;cursor:pointer}
    .choice.ok{background:#dcfce7;border-color:#86efac}.choice.no{background:#fee2e2;border-color:#fca5a5}
  `,
  bodyHtml: `<div class="learn" id="learn"><div class="layout">
    <div class="clock-wrap">
      <div class="clock" id="clock"></div>
      <div class="time-big" id="timeText">3:00</div>
    </div>
    <div class="ctrls">
      <div><label for="hour">ชั่วโมง (1–12)</label><input type="range" id="hour" min="1" max="12" value="3"></div>
      <div><label for="minute">นาที (ทีละ 5)</label><input type="range" id="minute" min="0" max="55" step="5" value="0"></div>
      <button type="button" class="btn btn-accent" id="btnRandom">🎲 สุ่มเวลา</button>
      <div class="box" id="explain">เข็มสั้น = ชั่วโมง · เข็มยาว = นาที · นาที 0 = ตรง</div>
    </div>
  </div></div>
  <div class="practice" id="practice">
    <div class="clock" id="prClock" style="width:220px"></div>
    <p style="font-weight:800;color:var(--deep)">เวลานี้คือเท่าไร?</p>
    <div class="choices" id="prChoices"></div>
    <p id="prFb" style="font-weight:800;min-height:24px"></p>
    <button type="button" class="btn btn-primary" id="btnNextPr">ข้อถัดไป</button>
  </div>`,
  script: `
let H=3,M=0,mode='learn',pr={h:3,m:0};
function setMode(m){mode=m;document.getElementById('shell').classList.toggle('mode-practice',m==='practice');document.getElementById('hintText').textContent=m==='learn'?'เลื่อนเข็มดูเวลา':'เลือกคำตอบที่ถูก';if(m==='practice')nextPractice();}
function fmt(h,m){return h+':'+(m<10?'0':'')+m;}
function placeNums(el){el.innerHTML='';for(let i=1;i<=12;i++){const a=(i%12)*30*Math.PI/180;const x=50+42*Math.sin(a);const y=50-42*Math.cos(a);const n=document.createElement('div');n.className='num';n.style.left=x+'%';n.style.top=y+'%';n.textContent=i;el.appendChild(n);}
  const hour=document.createElement('div');hour.className='hand hour';hour.id=el.id+'Hour';
  const minute=document.createElement('div');minute.className='hand minute';minute.id=el.id+'Minute';
  const dot=document.createElement('div');dot.className='dot';
  el.append(hour,minute,dot);}
function draw(elId,h,m){const hour=document.getElementById(elId+'Hour');const minute=document.getElementById(elId+'Minute');if(!hour)return;hour.style.transform='rotate('+((h%12)*30+m*0.5)+'deg)';minute.style.transform='rotate('+(m*6)+'deg)';}
function explain(){const words=M===0?'ตรง':M===15?'เศษหนึ่งส่วนสี่':M===30?'ครึ่ง':M===45?'สามเศษสี่':'นาทีที่ '+M;document.getElementById('explain').textContent='เวลา '+fmt(H,M)+' · '+words+' · เข็มสั้นชี้ใกล้ '+H+(M?'และเลยไปตามนาที':'');document.getElementById('timeText').textContent=fmt(H,M);}
function sync(){H=+document.getElementById('hour').value;M=+document.getElementById('minute').value;draw('clock',H,M);explain();}
function nextPractice(){pr={h:1+Math.floor(Math.random()*12),m:Math.floor(Math.random()*12)*5};draw('prClock',pr.h,pr.m);document.getElementById('prFb').textContent='';
  const ans=fmt(pr.h,pr.m);const opts=new Set([ans]);while(opts.size<4){opts.add(fmt(1+Math.floor(Math.random()*12),Math.floor(Math.random()*12)*5));}
  const box=document.getElementById('prChoices');box.innerHTML=[...opts].sort(()=>Math.random()-0.5).map(o=>'<button type="button" class="choice">'+o+'</button>').join('');
  box.onclick=e=>{const b=e.target.closest('.choice');if(!b)return;const ok=b.textContent===ans;b.classList.add(ok?'ok':'no');document.getElementById('prFb').textContent=ok?'✅ ถูกต้อง!':'เฉลย '+ans;if(KAMPAI&&KAMPAI.sound)(ok?KAMPAI.sound.correct:KAMPAI.sound.wrong)();};}
placeNums(document.getElementById('clock'));placeNums(document.getElementById('prClock'));
document.getElementById('hour').oninput=sync;document.getElementById('minute').oninput=sync;
document.getElementById('btnRandom').onclick=()=>{document.getElementById('hour').value=1+Math.floor(Math.random()*12);document.getElementById('minute').value=Math.floor(Math.random()*12)*5;sync();};
document.getElementById('btnNextPr').onclick=nextPractice;sync();setMode('learn');
`,
}));

// ─── 3) Thai money ───
write('public/games/math/thai-money-media.html', shell({
  slug: 'thai-money-media',
  title: '🪙 เงินไทย — บาทและสตางค์',
  badge: 'ป.1–3 · คณิตศาสตร์',
  accent: '#b45309',
  accent2: '#fde68a',
  bodyCss: `
    .layout{display:grid;gap:14px}@media(min-width:860px){.layout{grid-template-columns:1.1fr .9fr}}
    .coins{display:flex;flex-wrap:wrap;gap:10px}
    .coin{font-family:inherit;border:3px solid #fbbf24;border-radius:16px;padding:12px 14px;background:#fffbeb;cursor:pointer;font-weight:800;color:#92400e;min-width:88px;text-align:center}
    .coin .v{font-size:1.3rem;display:block}
    .coin .u{font-size:.75rem;color:#a16207}
    .sum{font-size:2rem;font-weight:800;color:#92400e;text-align:center;margin:10px 0}
    .box{background:#fffbeb;border:2px dashed #fbbf24;border-radius:14px;padding:14px;font-weight:600;line-height:1.5}
    .actions{display:flex;gap:8px;flex-wrap:wrap}
    .practice{display:none;max-width:520px;margin:0 auto;flex-direction:column;gap:12px}
    .shell.mode-practice .learn{display:none}.shell.mode-practice .practice{display:flex}
    .target{font-size:1.6rem;font-weight:800;color:#92400e;text-align:center}
    .choices{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .choice{font-family:inherit;font-weight:800;padding:14px;border:2px solid #fde68a;border-radius:12px;background:#fff;cursor:pointer}
    .choice.ok{background:#dcfce7;border-color:#86efac}.choice.no{background:#fee2e2;border-color:#fca5a5}
  `,
  bodyHtml: `<div class="learn" id="learn"><div class="layout">
    <div>
      <p style="font-weight:800;color:#92400e;margin-bottom:8px">แตะเหรียญ/ธนบัตรเพื่อบวกยอด</p>
      <div class="coins" id="coins"></div>
      <div class="sum" id="sum">0 บาท</div>
      <div class="actions">
        <button type="button" class="btn btn-ghost" id="btnClear">ล้างยอด</button>
        <button type="button" class="btn btn-accent" id="btnSpeakSum">🔊 อ่านยอด</button>
      </div>
    </div>
    <div class="box" id="tip">1 บาท = 100 สตางค์ · เหรียญ 1, 2, 5, 10 บาท · ธนบัตรเริ่ม 20 บาท</div>
  </div></div>
  <div class="practice" id="practice">
    <p class="target" id="target">ซื้อของราคา 25 บาท</p>
    <p style="font-weight:700;text-align:center">ควรจ่ายเท่าไร?</p>
    <div class="choices" id="prChoices"></div>
    <p id="prFb" style="font-weight:800;text-align:center;min-height:24px"></p>
    <button type="button" class="btn btn-primary" id="btnNextPr">ข้อถัดไป</button>
  </div>`,
  script: `
const ITEMS=[{v:1,u:'บาท',emoji:'🪙'},{v:2,u:'บาท',emoji:'🪙'},{v:5,u:'บาท',emoji:'🪙'},{v:10,u:'บาท',emoji:'🪙'},{v:20,u:'บาท',emoji:'💵'},{v:50,u:'บาท',emoji:'💵'},{v:100,u:'บาท',emoji:'💵'}];
let total=0,mode='learn';
function setMode(m){mode=m;document.getElementById('shell').classList.toggle('mode-practice',m==='practice');document.getElementById('hintText').textContent=m==='learn'?'บวกเงินจากเหรียญ/ธนบัตร':'เลือกจำนวนเงินที่ถูกต้อง';if(m==='practice')nextPractice();}
function renderCoins(){const el=document.getElementById('coins');el.innerHTML=ITEMS.map(i=>'<button type="button" class="coin" data-v="'+i.v+'"><span>'+i.emoji+'</span><span class="v">'+i.v+'</span><span class="u">'+i.u+'</span></button>').join('');
  el.onclick=e=>{const b=e.target.closest('.coin');if(!b)return;total+=+b.dataset.v;document.getElementById('sum').textContent=total+' บาท';document.getElementById('tip').textContent='ยอดปัจจุบัน '+total+' บาท · ลองคิดว่าซื้อของชิ้นไหนได้';};}
function nextPractice(){const price=[12,15,20,25,30,35,40,50,55,60][Math.floor(Math.random()*10)];document.getElementById('target').textContent='ซื้อของราคา '+price+' บาท';document.getElementById('prFb').textContent='';
  const opts=new Set([price+' บาท']);while(opts.size<4){opts.add((price+[5,10,-5,20,-10][Math.floor(Math.random()*5)])+' บาท');}
  const box=document.getElementById('prChoices');box.innerHTML=[...opts].sort(()=>Math.random()-0.5).map(o=>'<button type="button" class="choice">'+o+'</button>').join('');
  box.onclick=e=>{const b=e.target.closest('.choice');if(!b)return;const ok=b.textContent===price+' บาท';b.classList.add(ok?'ok':'no');document.getElementById('prFb').textContent=ok?'✅ ถูกต้อง!':'เฉลย '+price+' บาท';if(KAMPAI&&KAMPAI.sound)(ok?KAMPAI.sound.correct:KAMPAI.sound.wrong)();};}
document.getElementById('btnClear').onclick=()=>{total=0;document.getElementById('sum').textContent='0 บาท';};
document.getElementById('btnSpeakSum').onclick=()=>{const t=total+' บาท';if(KAMPAI&&KAMPAI.sound)KAMPAI.sound.speak(t,'th-TH');else speechSynthesis.speak(new SpeechSynthesisUtterance(t));};
document.getElementById('btnNextPr').onclick=nextPractice;renderCoins();setMode('learn');
`,
}));

// ─── 4) Brush teeth ───
write('public/games/health/brush-teeth-media.html', shell({
  slug: 'brush-teeth-media',
  title: '🪥 แปรงฟันถูกวิธี',
  badge: 'ป.3 · สุขศึกษา',
  accent: '#0e7490',
  accent2: '#a5f3fc',
  bodyCss: `
    .layout{display:grid;gap:14px}@media(min-width:860px){.layout{grid-template-columns:1fr 1fr}}
    .visual{display:flex;flex-direction:column;align-items:center;gap:12px;background:linear-gradient(180deg,#e0f2fe,#cffafe);border-radius:16px;padding:20px}
    .emo{width:140px;height:140px;border-radius:50%;background:#fff;border:4px solid #67e8f9;display:grid;place-items:center;font-size:4.5rem}
    .dots{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
    .dot{width:36px;height:36px;border-radius:50%;border:2px solid #67e8f9;background:#fff;font-weight:800;color:var(--deep);cursor:pointer;font-family:inherit}
    .dot.on{background:var(--deep);color:#fff}
    .detail{display:flex;flex-direction:column;gap:10px}
    .num{align-self:flex-start;background:var(--deep);color:#fff;font-weight:800;border-radius:999px;padding:4px 12px;font-size:.85rem}
    .title{font-size:1.35rem;font-weight:800;color:var(--deep)}
    .body{font-weight:600;line-height:1.55}
    .tip{background:#fff;border:2px dashed #67e8f9;border-radius:12px;padding:10px;font-weight:600;color:var(--muted)}
    .actions{display:flex;gap:8px;flex-wrap:wrap}
    .practice{display:none;max-width:520px;margin:0 auto;flex-direction:column;gap:12px}
    .shell.mode-practice .learn{display:none}.shell.mode-practice .practice{display:flex}
    .prompt{font-weight:800;color:var(--deep);text-align:center;background:#ecfeff;border:2px dashed #67e8f9;border-radius:14px;padding:12px}
    .pool{display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .pbtn{font-family:inherit;font-weight:700;border:2px solid var(--line);border-radius:14px;background:#fff;padding:12px;cursor:pointer;text-align:left}
    .pbtn.done{opacity:.45;pointer-events:none;background:#dcfce7}
    .pbtn.bad{background:#fee2e2;border-color:#fca5a5}
    .track{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
    .slot{width:40px;height:40px;border-radius:12px;border:2px dashed #67e8f9;display:grid;place-items:center;font-weight:800;color:#67e8f9}
    .slot.filled{background:#dcfce7;border-color:#86efac;color:#166534}
  `,
  bodyHtml: `<div class="learn" id="learn"><div class="layout">
    <div class="visual"><div class="emo" id="emo">🪥</div><div class="dots" id="dots"></div></div>
    <div class="detail">
      <span class="num" id="dNum">ขั้นที่ 1</span>
      <h2 class="title" id="dTitle"></h2>
      <p class="body" id="dBody"></p>
      <p class="tip" id="dTip"></p>
      <div class="actions">
        <button type="button" class="btn btn-ghost" id="btnPrev">← ก่อนหน้า</button>
        <button type="button" class="btn btn-primary" id="btnNext">ถัดไป →</button>
        <button type="button" class="btn btn-accent" id="btnPlay">▶ เล่นวน</button>
      </div>
    </div>
  </div></div>
  <div class="practice" id="practice">
    <p class="prompt">เรียงขั้นตอนแปรงฟันให้ถูกต้อง</p>
    <div class="track" id="track"></div>
    <div class="pool" id="pool"></div>
    <p id="prFb" style="font-weight:800;text-align:center;min-height:24px"></p>
    <button type="button" class="btn btn-ghost" id="btnResetPr">เริ่มใหม่</button>
  </div>`,
  script: `
const STEPS=[
  {emo:'🚰',title:'เตรียมแปรงและน้ำ',body:'เลือกแปรงขนนุ่ม เปียกน้ำเล็กน้อย บีบยาสีฟันขนาดเมล็ดถั่ว',tip:'เด็กเล็กใช้ยาสีฟันผสมฟลูออไรด์ตามอายุ'},
  {emo:'😬',title:'แปรงด้านนอก',body:'แปรงฟันด้านที่เห็นเมื่อยิ้ม บน–ล่าง วนเบา ๆ',tip:'อย่าแปรงแรงเกินไป อาจทำเหงือกเป็นแผล'},
  {emo:'🦷',title:'แปรงด้านใน',body:'เงย/ก้มแปรงด้านในใกล้ลิ้นและเพดาน',tip:'ด้านในทำความสะอาดยาก อย่าลืม'},
  {emo:'🌽',title:'แปรงบดเคี้ยว',body:'ถูไปมาบนด้านบดเคี้ยวของฟันกราม',tip:'เศษอาหารมักค้างตรงนี้'},
  {emo:'👅',title:'แปรงลิ้นเบา ๆ',body:'ปาดลิ้นจากโคนมาปลายเพื่อลดกลิ่นปาก',tip:'อย่าแรงจนเจ็บ'},
  {emo:'💦',title:'บ้วนปากและล้างแปรง',body:'บ้วนน้ำให้สะอาด ล้างแปรงตั้งให้แห้ง',tip:'แปรงฟันเช้า–ก่อนนอนอย่างน้อยวันละ 2 ครั้ง'}
];
let i=0,timer=null,mode='learn',order=[],pool=[];
function setMode(m){mode=m;document.getElementById('shell').classList.toggle('mode-practice',m==='practice');document.getElementById('hintText').textContent=m==='learn'?'เรียนทีละขั้น · กดเล่นวนได้':'เรียงลำดับขั้นตอน';if(timer){clearInterval(timer);timer=null;}if(m==='practice')resetPractice();}
function show(){const s=STEPS[i];document.getElementById('emo').textContent=s.emo;document.getElementById('dNum').textContent='ขั้นที่ '+(i+1);document.getElementById('dTitle').textContent=s.title;document.getElementById('dBody').textContent=s.body;document.getElementById('dTip').textContent='💡 '+s.tip;
  document.getElementById('dots').innerHTML=STEPS.map((_,k)=>'<button type="button" class="dot '+(k===i?'on':'')+'" data-i="'+k+'">'+(k+1)+'</button>').join('');}
document.getElementById('dots').onclick=e=>{const b=e.target.closest('.dot');if(!b)return;i=+b.dataset.i;show();};
document.getElementById('btnPrev').onclick=()=>{i=(i-1+STEPS.length)%STEPS.length;show();};
document.getElementById('btnNext').onclick=()=>{i=(i+1)%STEPS.length;show();};
document.getElementById('btnPlay').onclick=()=>{if(timer){clearInterval(timer);timer=null;document.getElementById('btnPlay').textContent='▶ เล่นวน';return;}document.getElementById('btnPlay').textContent='⏸ หยุด';timer=setInterval(()=>{i=(i+1)%STEPS.length;show();},2200);};
function resetPractice(){order=[];pool=STEPS.map((s,idx)=>({idx,label:(idx+1)+'. '+s.title,emo:s.emo})).sort(()=>Math.random()-0.5);renderPractice();document.getElementById('prFb').textContent='';}
function renderPractice(){document.getElementById('track').innerHTML=STEPS.map((_,k)=>'<div class="slot '+(order[k]!=null?'filled':'')+'">'+(order[k]!=null?order[k]+1:'')+'</div>').join('');
  document.getElementById('pool').innerHTML=pool.map(p=>'<button type="button" class="pbtn" data-i="'+p.idx+'"><span style="font-size:1.4rem">'+p.emo+'</span> '+p.label+'</button>').join('');}
document.getElementById('pool').onclick=e=>{const b=e.target.closest('.pbtn');if(!b)return;const idx=+b.dataset.i;const expect=order.length;if(idx===expect){order.push(idx);pool=pool.filter(p=>p.idx!==idx);b.classList.add('done');renderPractice();if(order.length===STEPS.length){document.getElementById('prFb').textContent='✅ เรียงถูกต้องทั้งหมด!';if(KAMPAI&&KAMPAI.sound)KAMPAI.sound.correct();}}else{b.classList.add('bad');document.getElementById('prFb').textContent='ยังไม่ใช่ขั้นนี้';if(KAMPAI&&KAMPAI.sound)KAMPAI.sound.wrong();setTimeout(()=>b.classList.remove('bad'),400);}};
document.getElementById('btnResetPr').onclick=resetPractice;show();setMode('learn');
`,
}));

// ─── 5) Light properties ───
write('public/games/science/light-properties-media.html', shell({
  slug: 'light-properties-media',
  title: '💡 สมบัติของแสง',
  badge: 'ป.4 · วิทยาศาสตร์',
  accent: '#7c3aed',
  accent2: '#ddd6fe',
  bodyCss: `
    .tabs{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px}
    .tabs button{font-family:inherit;font-weight:800;border:2px solid var(--line);background:#fff;color:var(--deep);border-radius:12px;padding:8px 14px;cursor:pointer}
    .tabs button.on{background:var(--deep);color:#fff}
    .cards{display:grid;gap:10px;grid-template-columns:repeat(auto-fill,minmax(160px,1fr))}
    .card{border:2px solid var(--line);border-radius:14px;padding:12px;background:#fff;cursor:pointer;text-align:center}
    .card.on{border-color:var(--deep);background:#f5f3ff}
    .card .e{font-size:2.2rem}
    .card .n{font-weight:800;color:var(--deep);margin-top:6px}
    .info{margin-top:14px;background:#f5f3ff;border:2px dashed var(--line);border-radius:14px;padding:14px;font-weight:600;line-height:1.55}
    .practice{display:none;max-width:520px;margin:0 auto;flex-direction:column;gap:12px}
    .shell.mode-practice .learn{display:none}.shell.mode-practice .practice{display:flex}
    .q{font-weight:800;color:var(--deep);text-align:center;font-size:1.15rem}
    .choices{display:flex;flex-direction:column;gap:8px}
    .choice{font-family:inherit;font-weight:800;padding:12px;border:2px solid var(--line);border-radius:12px;background:#fff;cursor:pointer;text-align:left}
    .choice.ok{background:#dcfce7;border-color:#86efac}.choice.no{background:#fee2e2;border-color:#fca5a5}
  `,
  bodyHtml: `<div class="learn" id="learn">
    <div class="tabs" id="tabs"></div>
    <div class="cards" id="cards"></div>
    <div class="info" id="info">เลือกวัตถุเพื่อดูว่าแสงผ่านได้มากน้อยแค่ไหน</div>
  </div>
  <div class="practice" id="practice">
    <p class="q" id="prQ">?</p>
    <div class="choices" id="prChoices"></div>
    <p id="prFb" style="font-weight:800;text-align:center;min-height:24px"></p>
    <button type="button" class="btn btn-primary" id="btnNextPr">ข้อถัดไป</button>
  </div>`,
  script: `
const TYPES=[
  {id:'opaque',name:'ทึบแสง',desc:'แสงผ่านไม่ได้ หรือผ่านได้น้อยมาก ทำให้เกิดเงาชัด',color:'#4c1d95'},
  {id:'translucent',name:'ผ่านแสงบางส่วน',desc:'แสงผ่านได้บางส่วน เห็นเงาไม่คมชัด',color:'#7c3aed'},
  {id:'transparent',name:'โปร่งใส',desc:'แสงผ่านได้ดี เห็นวัตถุอีกฝั่งชัด',color:'#a78bfa'}
];
const ITEMS=[
  {name:'ไม้',emoji:'🪵',type:'opaque'},{name:'หิน',emoji:'🪨',type:'opaque'},{name:'หนังสือ',emoji:'📘',type:'opaque'},{name:'โลหะ',emoji:'🪙',type:'opaque'},
  {name:'กระดาษไข',emoji:'📄',type:'translucent'},{name:'ผ้าม่านบาง',emoji:'🪟',type:'translucent'},{name:'พลาสติกฝ้า',emoji:'🧴',type:'translucent'},
  {name:'กระจกใส',emoji:'🪞',type:'transparent'},{name:'น้ำสะอาด',emoji:'💧',type:'transparent'},{name:'อากาศ',emoji:'🌬️',type:'transparent'},{name:'พลาสติกใส',emoji:'🥤',type:'transparent'}
];
let filter='all',mode='learn';
function setMode(m){mode=m;document.getElementById('shell').classList.toggle('mode-practice',m==='practice');document.getElementById('hintText').textContent=m==='learn'?'จัดกลุ่มวัตถุตามสมบัติของแสง':'เลือกคำตอบที่ถูก';if(m==='practice')nextPractice();}
function renderTabs(){const el=document.getElementById('tabs');const opts=[{id:'all',name:'ทั้งหมด'},...TYPES];el.innerHTML=opts.map(t=>'<button type="button" data-id="'+t.id+'" class="'+(t.id===filter?'on':'')+'">'+t.name+'</button>').join('');
  el.onclick=e=>{const b=e.target.closest('button');if(!b)return;filter=b.dataset.id;renderTabs();renderCards();};}
function renderCards(){const list=ITEMS.filter(x=>filter==='all'||x.type===filter);const el=document.getElementById('cards');el.innerHTML=list.map((x,i)=>'<button type="button" class="card" data-i="'+ITEMS.indexOf(x)+'"><div class="e">'+x.emoji+'</div><div class="n">'+x.name+'</div></button>').join('');
  el.onclick=e=>{const b=e.target.closest('.card');if(!b)return;[...el.children].forEach(c=>c.classList.toggle('on',c===b));const it=ITEMS[+b.dataset.i];const t=TYPES.find(z=>z.id===it.type);document.getElementById('info').innerHTML='<strong>'+it.name+'</strong> → <span style="color:'+t.color+'">'+t.name+'</span><br>'+t.desc;};}
function nextPractice(){const it=ITEMS[Math.floor(Math.random()*ITEMS.length)];const t=TYPES.find(z=>z.id===it.type);document.getElementById('prQ').textContent=it.emoji+' '+it.name+' จัดเป็นกลุ่มใด?';document.getElementById('prFb').textContent='';
  const box=document.getElementById('prChoices');box.innerHTML=TYPES.map(x=>'<button type="button" class="choice" data-id="'+x.id+'">'+x.name+'</button>').join('');
  box.onclick=e=>{const b=e.target.closest('.choice');if(!b)return;const ok=b.dataset.id===t.id;b.classList.add(ok?'ok':'no');document.getElementById('prFb').textContent=ok?'✅ ถูกต้อง!':'เฉลย: '+t.name;if(KAMPAI&&KAMPAI.sound)(ok?KAMPAI.sound.correct:KAMPAI.sound.wrong)();};}
document.getElementById('btnNextPr').onclick=nextPractice;renderTabs();renderCards();setMode('learn');
`,
}));

await cover({ out: 'public/games/english/sight-words-p123-media-cover.png', title: 'Sight Words ป.1–3', subtitle: 'คำอ่านจำ · แฟลชการ์ด · ฝึกความหมาย', emoji: '👁️', c1: '#ccfbf1', c2: '#5eead4', ink: '#0f766e' });
await cover({ out: 'public/games/math/clock-media-cover.png', title: 'นาฬิกาบอกเวลา', subtitle: 'เข็มสั้น–เข็มยาว · อ่านเวลา', emoji: '🕐', c1: '#dbeafe', c2: '#60a5fa', ink: '#1e3a8a' });
await cover({ out: 'public/games/math/thai-money-media-cover.png', title: 'เงินไทย', subtitle: 'บาท · สตางค์ · เหรียญและธนบัตร', emoji: '🪙', c1: '#fef3c7', c2: '#fbbf24', ink: '#92400e' });
await cover({ out: 'public/games/health/brush-teeth-media-cover.png', title: 'แปรงฟันถูกวิธี', subtitle: '6 ขั้น · เรียงลำดับ', emoji: '🪥', c1: '#cffafe', c2: '#22d3ee', ink: '#0e7490' });
await cover({ out: 'public/games/science/light-properties-media-cover.png', title: 'สมบัติของแสง', subtitle: 'ทึบแสง · ผ่านบางส่วน · โปร่งใส', emoji: '💡', c1: '#ede9fe', c2: '#a78bfa', ink: '#5b21b6' });

console.log('done media batch Y');
