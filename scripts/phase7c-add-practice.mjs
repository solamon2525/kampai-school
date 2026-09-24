import fs from 'node:fs';

const PRACTICE_CSS = `
    .practice-mcq{display:none;flex-direction:column;gap:12px;max-width:520px;margin:0 auto;padding:8px 0;width:100%}
    .practice-mcq.on{display:flex}
    .practice-mcq .pq{font-weight:800;font-size:1.15rem;text-align:center;line-height:1.45}
    .practice-mcq .popts{display:flex;flex-direction:column;gap:8px}
    .practice-mcq .popt{font-family:inherit;font-weight:700;padding:12px;border:2px solid #cbd5e1;border-radius:12px;background:#fff;cursor:pointer;text-align:left}
    .practice-mcq .popt.ok{background:#dcfce7;border-color:#86efac}
    .practice-mcq .popt.no{background:#fee2e2;border-color:#fca5a5}
    .practice-mcq .pfb{font-weight:800;text-align:center;min-height:24px}
`;

const PANEL = `
    <div class="practice-mcq" id="practiceMcq">
      <p class="pq"></p>
      <div class="popts"></div>
      <p class="pfb"></p>
      <button type="button" class="btn btn-primary" id="btnPracticeNext" style="align-self:center">ข้อถัดไป</button>
    </div>
`;

function makeJs(qs) {
  return `
<script>
(function(){
  var PRACTICE_Q = ${JSON.stringify(qs)};
  function nextPracticeMcq(){
    var item = PRACTICE_Q[(Math.random()*PRACTICE_Q.length)|0];
    var box = document.getElementById('practiceMcq');
    if(!box) return;
    box.querySelector('.pq').textContent = item.q;
    var fb = box.querySelector('.pfb'); fb.textContent=''; fb.style.color='';
    var opts = item.opts.slice().sort(function(){return Math.random()-0.5;});
    var popts = box.querySelector('.popts');
    popts.innerHTML = opts.map(function(o){return '<button type="button" class="popt" data-a="'+o+'">'+o+'</button>';}).join('');
    popts.querySelectorAll('.popt').forEach(function(btn){
      btn.onclick=function(){
        var ok = btn.getAttribute('data-a') === item.a;
        btn.classList.add(ok?'ok':'no');
        popts.querySelectorAll('.popt').forEach(function(b){
          b.disabled=true;
          if(b.getAttribute('data-a')===item.a) b.classList.add('ok');
        });
        fb.textContent = ok ? '✓ ถูกต้อง!' : '✗ คำตอบ: '+item.a;
        fb.style.color = ok ? '#16a34a' : '#dc2626';
        if(window.KAMPAI&&KAMPAI.sound) (ok?KAMPAI.sound.correct:KAMPAI.sound.wrong)();
      };
    });
  }
  function wire(){
    var seg = document.getElementById('modeSeg') || document.querySelector('.seg') || document.querySelector('.toolbar');
    if(!seg) return;
    if(!document.querySelector('[data-mode="practice"]')){
      var b=document.createElement('button');
      b.type='button'; b.setAttribute('data-mode','practice'); b.textContent='✏️ ฝึกสั้น';
      b.style.cssText='font-family:inherit;font-weight:800;border:none;background:#fff;padding:8px 14px;cursor:pointer;border-radius:10px;margin-left:6px';
      seg.appendChild(b);
    }
    document.body.addEventListener('click', function(e){
      var btn = e.target.closest('[data-mode="practice"]');
      if(!btn) return;
      document.querySelectorAll('[data-mode]').forEach(function(x){ x.classList.toggle('on', x===btn); });
      var pmcq=document.getElementById('practiceMcq');
      if(pmcq) pmcq.classList.add('on');
      document.querySelectorAll('.panel,.stage > div,.display-area > div').forEach(function(p){
        if(p.id==='practiceMcq') return;
        if(p.classList && p.classList.contains('practice-mcq')) return;
      });
      // hide common learn panels loosely
      document.querySelectorAll('.panel.on').forEach(function(p){ p.classList.remove('on'); });
      nextPracticeMcq();
    }, true);
    document.getElementById('btnPracticeNext')?.addEventListener('click', nextPracticeMcq);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', wire); else wire();
})();
</script>
`;
}

const targets = [
  {
    path: 'public/games/social/thailand-map-media.html',
    qs: [
      { q: 'ประเทศไทยมีกี่ภูมิภาคหลักที่เรียนกันบ่อย?', opts: ['6', '2', '10', '1'], a: '6' },
      { q: 'กรุงเทพฯ อยู่ในภาคใด?', opts: ['กลาง', 'เหนือ', 'ใต้', 'ตะวันออกเฉียงเหนือ'], a: 'กลาง' },
      { q: 'ภาคเหนือมักมีลักษณะภูมิประเทศแบบใด?', opts: ['ภูเขาและหุบเขา', 'ทะเลทราย', 'เกาะปะการังอย่างเดียว', 'ทุ่งน้ำแข็ง'], a: 'ภูเขาและหุบเขา' },
      { q: 'อ่านแผนที่ควรดูอะไรก่อน?', opts: ['ชื่อแผนที่ ทิศ และสัญลักษณ์', 'สีที่สวยที่สุด', 'ขนาดตัวอักษรอย่างเดียว', 'ปีที่พิมพ์อย่างเดียว'], a: 'ชื่อแผนที่ ทิศ และสัญลักษณ์' },
      { q: 'ภาคใต้ติดทะเลสำคัญด้านใด?', opts: ['อ่าวไทยและอันดามัน', 'ทะเลสาบแคสเปียน', 'ทะเลเหนือ', 'มหาสมุทรอาร์กติก'], a: 'อ่าวไทยและอันดามัน' },
      { q: 'จังหวัดเชียงใหม่อยู่ภาคใด?', opts: ['เหนือ', 'ใต้', 'กลาง', 'ตะวันออก'], a: 'เหนือ' },
    ],
  },
  {
    path: 'public/games/social/sukhothai-timeline-media.html',
    qs: [
      { q: 'สุโขทัยเป็นอาณาจักรสำคัญในประวัติศาสตร์ไทยช่วงใดโดยประมาณ?', opts: ['พุทธศตวรรษที่ 18–19', 'ปัจจุบันเท่านั้น', 'ยุคหินเก่า', 'ปี ค.ศ. 2000+'], a: 'พุทธศตวรรษที่ 18–19' },
      { q: 'พ่อขุนรามคำแหงเกี่ยวข้องกับสุโขทัยอย่างไร?', opts: ['กษัตริย์สำคัญของสุโขทัย', 'นักสำรวจยุโรป', 'พ่อค้าชาวจีนสมัยใหม่', 'ครูโรงเรียน'], a: 'กษัตริย์สำคัญของสุโขทัย' },
      { q: 'เส้นเวลาช่วยอะไร?', opts: ['เรียงเหตุการณ์ตามลำดับเวลา', 'วัดอุณหภูมิ', 'นับเงิน', 'วาดแผนที่ถนน'], a: 'เรียงเหตุการณ์ตามลำดับเวลา' },
      { q: 'เมื่ออ่านเหตุการณ์บนเส้นเวลา ควรดู…', opts: ['ปี/ศักราช และคำอธิบายสั้น', 'สีตัวอักษรอย่างเดียว', 'จำนวนจุด', 'ชื่อไฟล์'], a: 'ปี/ศักราช และคำอธิบายสั้น' },
      { q: 'อักษรไทยมีตำนานเชื่อมกับยุคสุโขทัยอย่างไร?', opts: ['มีการประดิษฐ์/พัฒนาระบบเขียน', 'ไม่มีตัวอักษร', 'ใช้เฉพาะตัวเลขโรมัน', 'ใช้เฉพาะภาพวาด'], a: 'มีการประดิษฐ์/พัฒนาระบบเขียน' },
      { q: 'เหตุการณ์ที่เกิดก่อนควรอยู่ทางใดของเส้นเวลา (ซ้าย→ขวา)?', opts: ['ซ้าย', 'ขวาสุดเสมอ', 'ตรงกลางเท่านั้น', 'สุ่มตำแหน่ง'], a: 'ซ้าย' },
    ],
  },
  {
    path: 'public/games/science/water-cycle-media.html',
    qs: [
      { q: 'น้ำบนผิวโลกระเหยเพราะ…', opts: ['ความร้อนจากดวงอาทิตย์', 'แรงโน้มถ่วงหายไป', 'ลมหนาวเท่านั้น', 'ไม่มีแสง'], a: 'ความร้อนจากดวงอาทิตย์' },
      { q: 'เมฆเกิดจากกระบวนการใดเป็นหลัก?', opts: ['การควบแน่น', 'การละลายน้ำแข็งอย่างเดียว', 'การเผาไหม้', 'การย่อยอาหาร'], a: 'การควบแน่น' },
      { q: 'ฝนคือตัวอย่างของ…', opts: ['หยาดน้ำฟ้า', 'การระเหย', 'การละลายหิน', 'การสังเคราะห์แสง'], a: 'หยาดน้ำฟ้า' },
      { q: 'ลำดับคร่าว ๆ ของวัฏจักรน้ำคือ…', opts: ['ระเหย → ควบแน่น → หยาดน้ำฟ้า', 'ฝน → ไฟ → ลม', 'หิน → ทราย → แก้ว', 'ราก → ใบ → ดอก'], a: 'ระเหย → ควบแน่น → หยาดน้ำฟ้า' },
      { q: 'น้ำใต้ดินเกิดได้อย่างไร?', opts: ['น้ำซึมลงดิน', 'น้ำลอยขึ้นฟ้าทันที', 'น้ำกลายเป็นหิน', 'น้ำหายไป'], a: 'น้ำซึมลงดิน' },
      { q: 'ทำไมวัฏจักรน้ำสำคัญ?', opts: ['หมุนเวียนน้ำให้สิ่งมีชีวิตใช้', 'ทำให้โลกไม่มีเมฆ', 'หยุดฝนตลอดกาล', 'สร้างไฟฟ้าเองโดยไม่มีน้ำ'], a: 'หมุนเวียนน้ำให้สิ่งมีชีวิตใช้' },
    ],
  },
];

for (const { path, qs } of targets) {
  let html = fs.readFileSync(path, 'utf8');
  if (html.includes('id="practiceMcq"')) {
    console.log('skip', path);
    continue;
  }
  html = html.replace('</style>', PRACTICE_CSS + '\n</style>');
  if (html.includes('</body>')) {
    html = html.replace('</body>', PANEL + makeJs(qs) + '\n</body>');
  } else {
    html += PANEL + makeJs(qs);
  }
  fs.writeFileSync(path, html);
  console.log('practice+', path);
}
