/**
 * Phase 7B — inject ✏️ ฝึกสั้น MCQ panel into 5 media files.
 * Idempotent: skips if data-mode="practice" already present for ฝึกสั้น.
 */
import fs from 'node:fs';

const PRACTICE_CSS = `
    .practice-mcq{display:none;flex-direction:column;gap:12px;max-width:520px;margin:0 auto;padding:8px 0;width:100%}
    .practice-mcq.on{display:flex}
    .practice-mcq .pq{font-weight:800;font-size:1.15rem;text-align:center;line-height:1.45;color:inherit}
    .practice-mcq .popts{display:flex;flex-direction:column;gap:8px}
    .practice-mcq .popt{font-family:inherit;font-weight:700;padding:12px;border:2px solid currentColor;border-radius:12px;background:#fff;cursor:pointer;text-align:left;opacity:.92}
    .practice-mcq .popt.ok{background:#dcfce7;border-color:#86efac}
    .practice-mcq .popt.no{background:#fee2e2;border-color:#fca5a5}
    .practice-mcq .pfb{font-weight:800;text-align:center;min-height:24px}
`;

function practiceJs(questionsJson) {
  return `
    const PRACTICE_Q = ${questionsJson};
    function nextPracticeMcq(){
      const item = PRACTICE_Q[(Math.random()*PRACTICE_Q.length)|0];
      const box = document.getElementById('practiceMcq');
      if(!box) return;
      box.querySelector('.pq').textContent = item.q;
      const fb = box.querySelector('.pfb');
      fb.textContent=''; fb.style.color='';
      const opts = item.opts.slice().sort(()=>Math.random()-0.5);
      const popts = box.querySelector('.popts');
      popts.innerHTML = opts.map(o=>'<button type="button" class="popt" data-a="'+o.replace(/"/g,'&quot;')+'">'+o+'</button>').join('');
      popts.querySelectorAll('.popt').forEach(btn=>{
        btn.onclick=()=>{
          const ok = btn.dataset.a === item.a;
          btn.classList.add(ok?'ok':'no');
          popts.querySelectorAll('.popt').forEach(b=>{
            b.disabled=true;
            if(b.dataset.a===item.a) b.classList.add('ok');
          });
          fb.textContent = ok ? '✓ ถูกต้อง!' : '✗ คำตอบ: '+item.a;
          fb.style.color = ok ? '#16a34a' : '#dc2626';
          if(window.KAMPAI&&KAMPAI.sound) (ok?KAMPAI.sound.correct:KAMPAI.sound.wrong)();
        };
      });
    }
    document.getElementById('btnPracticeNext')?.addEventListener('click', nextPracticeMcq);
`;
}

const PANEL_HTML = `
    <div class="practice-mcq" id="practiceMcq">
      <p class="pq"></p>
      <div class="popts"></div>
      <p class="pfb"></p>
      <button type="button" class="btn btn-primary" id="btnPracticeNext">ข้อถัดไป</button>
    </div>
`;

const files = [
  {
    path: 'public/games/math/rect-area-media.html',
    qs: [
      { q: 'สี่เหลี่ยมผืนผ้า กว้าง 4 ยาว 6 พื้นที่เท่าไร?', opts: ['24', '20', '10', '12'], a: '24' },
      { q: 'เส้นรอบรูปสี่เหลี่ยมจัตุรัสด้าน 5 คือ?', opts: ['20', '25', '10', '15'], a: '20' },
      { q: 'พื้นที่ ≠ เส้นรอบรูป เพราะ…', opts: ['พื้นที่นับช่องข้างใน เส้นรอบนับขอบ', 'เหมือนกันเสมอ', 'พื้นที่ต้องเป็นเศษส่วน', 'เส้นรอบใช้แค่รูปวงกลม'], a: 'พื้นที่นับช่องข้างใน เส้นรอบนับขอบ' },
      { q: 'สามเหลี่ยมฐาน 8 สูง 5 พื้นที่?', opts: ['20', '40', '13', '25'], a: '20' },
      { q: 'กริด 3×4 มีกี่ช่อง?', opts: ['12', '7', '16', '9'], a: '12' },
      { q: 'สูตรพื้นที่สี่เหลี่ยมผืนผ้าคือ?', opts: ['กว้าง × ยาว', '2×(กว้าง+ยาว)', 'ฐาน×สูง÷2', 'πr²'], a: 'กว้าง × ยาว' },
    ],
  },
  {
    path: 'public/games/career/community-jobs-media.html',
    qs: [
      { q: 'ครูจัดอยู่ในภาคใด?', opts: ['บริการ', 'เกษตร', 'อุตสาหกรรมหนัก', 'ขนส่งทางน้ำ'], a: 'บริการ' },
      { q: 'ชาวนาผลิตอะไรเป็นหลัก?', opts: ['ข้าว/พืชผล', 'รถยนต์', 'ซอฟต์แวร์', 'ไฟฟ้า'], a: 'ข้าว/พืชผล' },
      { q: 'ถ้าชุมชนไม่มีพยาบาลจะขาดอะไร?', opts: ['การดูแลสุขภาพ', 'การก่อสร้างถนน', 'การจับปลา', 'การตัดผม'], a: 'การดูแลสุขภาพ' },
      { q: 'ช่างซ่อมรถช่วยชุมชนด้านใด?', opts: ['ซ่อมยานพาหนะให้ใช้ได้', 'สอนหนังสือ', 'ปลูกผัก', 'รักษาฟัน'], a: 'ซ่อมยานพาหนะให้ใช้ได้' },
      { q: 'อาชีพในภาคอุตสาหกรรมมักเกี่ยวกับ…', opts: ['โรงงาน/ผลิตสิ่งของ', 'ทำนา', 'ขายของในตลาดนัดเท่านั้น', 'สอนในโรงเรียน'], a: 'โรงงาน/ผลิตสิ่งของ' },
      { q: 'การเลือกอาชีพควรดูอะไรเป็นหลัก?', opts: ['ความสนใจ ทักษะ และประโยชน์ต่อชุมชน', 'เงินอย่างเดียว', 'ตามเพื่อนเท่านั้น', 'อะไรก็ได้'], a: 'ความสนใจ ทักษะ และประโยชน์ต่อชุมชน' },
    ],
  },
  {
    path: 'public/games/science/plant-parts-media.html',
    qs: [
      { q: 'รากทำหน้าที่หลักอะไร?', opts: ['ดูดน้ำและยึดลำต้น', 'สังเคราะห์แสง', 'ผลิตเมล็ด', 'ดึงดูดแมลง'], a: 'ดูดน้ำและยึดลำต้น' },
      { q: 'ใบช่วยพืชอย่างไร?', opts: ['สังเคราะห์แสง', 'ดูดน้ำจากดิน', 'เก็บไข่', 'เดิน'], a: 'สังเคราะห์แสง' },
      { q: 'ดอกเกี่ยวข้องกับอะไร?', opts: ['การสืบพันธุ์', 'ดูดน้ำ', 'ยึดดิน', 'สร้างคลอโรฟิลล์อย่างเดียว'], a: 'การสืบพันธุ์' },
      { q: 'ลำต้นทำหน้าที่…', opts: ['ลำเลียงน้ำ/อาหาร และพยุง', 'ดูดน้ำจากอากาศ', 'สร้างรากอากาศเท่านั้น', 'เป็นเมล็ด'], a: 'ลำเลียงน้ำ/อาหาร และพยุง' },
      { q: 'ผลมักเกิดหลัง…', opts: ['ดอกได้รับการผสมเกสร', 'ใบร่วงหมด', 'รากสั้นลง', 'ลำต้นกลวง'], a: 'ดอกได้รับการผสมเกสร' },
      { q: 'เราทานแครอท คือทานส่วนใดของพืช?', opts: ['ราก', 'ใบ', 'ดอก', 'เมล็ด'], a: 'ราก' },
    ],
  },
  {
    path: 'public/games/social/sufficiency-media.html',
    qs: [
      { q: 'เศรษฐกิจพอเพียงเน้นอะไร?', opts: ['พอประมาณ มีเหตุผล มีภูมิคุ้มกัน', 'ใช้จ่ายเกินตัว', 'กู้เงินให้มาก', 'ทำตามกระแสอย่างเดียว'], a: 'พอประมาณ มีเหตุผล มีภูมิคุ้มกัน' },
      { q: '“พอประมาณ” หมายถึง…', opts: ['ใช้ทรัพยากรตามกำลัง', 'ไม่ทำงาน', 'ซื้อของแพงที่สุด', 'ไม่แบ่งปัน'], a: 'ใช้ทรัพยากรตามกำลัง' },
      { q: 'ภูมิคุ้มกันในปรัชญาพอเพียงช่วย…', opts: ['พร้อมรับความเปลี่ยนแปลง', 'หลีกเลี่ยงการเรียนรู้', 'ใช้หนี้ให้เร็ว', 'ไม่เก็บออม'], a: 'พร้อมรับความเปลี่ยนแปลง' },
      { q: 'เงื่อนไขสำคัญคู่กับเศรษฐกิจพอเพียงคือ…', opts: ['ความรู้และคุณธรรม', 'การพนัน', 'การแข่งขันตัดราคา', 'การปิดกั้นข้อมูล'], a: 'ความรู้และคุณธรรม' },
      { q: 'ตัวอย่างการใช้ชีวิตพอเพียงในโรงเรียน…', opts: ['ประหยัดน้ำไฟ แยกขยะ', 'ทิ้งอาหารทุกมื้อ', 'เปิดแอร์ทิ้งไว้', 'ซื้อของใช้แล้วทิ้ง'], a: 'ประหยัดน้ำไฟ แยกขยะ' },
      { q: 'มีเหตุผล หมายถึง…', opts: ['ตัดสินใจโดยคิดผลดี–ผลเสีย', 'ทำตามอารมณ์ทันที', 'ไม่ฟังคำแนะนำ', 'เลือกทางที่ง่ายที่สุดเสมอ'], a: 'ตัดสินใจโดยคิดผลดี–ผลเสีย' },
    ],
  },
  {
    path: 'public/games/health/bone-muscle-media.html',
    qs: [
      { q: 'กระดูกทำหน้าที่หลักอะไร?', opts: ['ค้ำจุนและป้องกันอวัยวะ', 'ย่อยอาหาร', 'สูบฉีดเลือด', 'กรองอากาศ'], a: 'ค้ำจุนและป้องกันอวัยวะ' },
      { q: 'กล้ามเนื้อช่วยให้ร่างกาย…', opts: ['เคลื่อนไหว', 'สร้างเม็ดเลือดแดงอย่างเดียว', 'เก็บแคลเซียมในฟัน', 'หายใจแทนปอด'], a: 'เคลื่อนไหว' },
      { q: 'การดูแลกระดูกดีคือ…', opts: ['ดื่มนม/อาหารแคลเซียม + ออกกำลัง', 'ไม่เคยเดิน', 'นั่งหลังคดงอทั้งวัน', 'ไม่โดนแสงแดดเลย'], a: 'ดื่มนม/อาหารแคลเซียม + ออกกำลัง' },
      { q: 'ยืดเหยียดก่อนออกกำลังช่วย…', opts: ['ลดการบาดเจ็บของกล้ามเนื้อ', 'ทำให้กระดูกหักง่าย', 'หยุดการหายใจ', 'เพิ่มไขมันทันที'], a: 'ลดการบาดเจ็บของกล้ามเนื้อ' },
      { q: 'กะโหลกศีรษะป้องกันอวัยวะใด?', opts: ['สมอง', 'หัวใจ', 'ตับ', 'ไต'], a: 'สมอง' },
      { q: 'ยกของถูกวิธีควร…', opts: ['งอเข่า หลังตรง', 'ก้มหลังอย่างเดียว', 'บิดตัวขณะยกหนัก', 'กลั้นหายใจนาน ๆ'], a: 'งอเข่า หลังตรง' },
    ],
  },
];

function inject(file, questions) {
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes('id="practiceMcq"') || html.includes('data-mode="practice">✏️ ฝึกสั้น')) {
    console.log('skip (already)', file);
    return;
  }

  if (!html.includes(PRACTICE_CSS.trim().slice(0, 40))) {
    html = html.replace('</style>', PRACTICE_CSS + '\n  </style>');
  }

  // Add practice button before closing </span> of modeSeg — first occurrence after modeSeg
  const btn = '        <button type="button" data-mode="practice">✏️ ฝึกสั้น</button>\n';
  if (html.includes('id="modeSeg"')) {
    // insert before the closing </span> that follows modeSeg buttons — use last button before </span> after modeSeg
    const idx = html.indexOf('id="modeSeg"');
    const close = html.indexOf('</span>', idx);
    html = html.slice(0, close) + btn + html.slice(close);
  }

  // Insert panel before </div> of stage or before footer — prefer before last toolbar sibling: after all panels
  if (html.includes('</div>\n    <footer') || html.includes('</div>\n  <footer') || html.includes('<footer')) {
    html = html.replace(/(<\/div>\s*)(<footer)/, PANEL_HTML + '\n    $1$2');
  } else {
    html = html.replace('</body>', PANEL_HTML + '\n</body>');
  }

  const js = practiceJs(JSON.stringify(questions, null, 2));
  // Hook into setMode if present
  if (html.includes('function setMode(m)')) {
    html = html.replace(
      /function setMode\(m\) \{/,
      `${js}\n    function setMode(m) {`
    );
    // After mode assignment / panel toggles, add practice handling
    if (html.includes("p.id === 'panel-' + m")) {
      html = html.replace(
        "document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('on', p.id === 'panel-' + m));",
        `document.querySelectorAll('.panel').forEach((p) => p.classList.toggle('on', p.id === 'panel-' + m));
      const pmcq=document.getElementById('practiceMcq');
      if(pmcq){ pmcq.classList.toggle('on', m==='practice'); document.querySelectorAll('.panel').forEach(p=>{ if(m==='practice') p.classList.remove('on'); }); }
      if(m==='practice') nextPracticeMcq();`
      );
    } else {
      // generic: after classList toggle on buttons
      html = html.replace(
        /document\.querySelectorAll\('#modeSeg button'\)\.forEach\([^;]+;/,
        (m) => `${m}
      const pmcq=document.getElementById('practiceMcq');
      if(pmcq){
        pmcq.classList.toggle('on', m==='practice');
        document.querySelectorAll('.panel.on, .stage .panel').forEach(p=>{ if(m==='practice') p.classList.remove('on'); });
        if(m==='practice') nextPracticeMcq();
        else {
          // restore: leave existing setMode logic to show panels
        }
      }`
      );
    }
  } else {
    html = html.replace('</script>', js + '\n</script>');
  }

  fs.writeFileSync(file, html);
  console.log('patched', file);
}

for (const f of files) inject(f.path, f.qs);

const mig = `-- 428: Phase 7B — ฝึกสั้น MCQ บนสื่อ leftover 5 ชิ้น

INSERT INTO public.game_docs (item_id, owner_staff_id, game_format, features, version, notes)
SELECT ehi.id, ehi.owner_staff_id, d.fmt, d.feats, d.ver, d.notes
FROM public.educational_hub_items ehi
JOIN (
  VALUES
    ('/games/math/rect-area-media.html',
     'ห้องทดลองพื้นที่',
     ARRAY['รูปทรงและสูตร','กริดนับช่อง','โจทย์เรื่อง','พื้นที่ vs เส้นรอบ','ฝึกสั้น MCQ'],
     'v1.1.0',
     'Phase 7B เพิ่มโหมดฝึกสั้น MCQ'),
    ('/games/career/community-jobs-media.html',
     'อาชีพในชุมชน',
     ARRAY['การ์ดอาชีพ','จัดกลุ่มภาค','ใครทำอะไร','สำรวจตัวเอง','ฝึกสั้น MCQ'],
     'v1.1.0',
     'Phase 7B เพิ่มโหมดฝึกสั้น MCQ'),
    ('/games/science/plant-parts-media.html',
     'ส่วนต่าง ๆ ของพืช',
     ARRAY['แผนภาพ','จับคู่หน้าที่','กินส่วนไหน','เรียงเติบโต','ฝึกสั้น MCQ'],
     'v1.1.0',
     'Phase 7B เพิ่มโหมดฝึกสั้น MCQ'),
    ('/games/social/sufficiency-media.html',
     'เศรษฐกิจพอเพียง',
     ARRAY['เรียนรู้','จับคู่','สถานการณ์','แผนของฉัน','ฝึกสั้น MCQ'],
     'v1.1.0',
     'Phase 7B เพิ่มโหมดฝึกสั้น MCQ'),
    ('/games/health/bone-muscle-media.html',
     'กระดูกและกล้ามเนื้อ',
     ARRAY['เรียนรู้','แยกประเภท','ดูแลร่างกาย','ทายตำแหน่ง','ฝึกสั้น MCQ'],
     'v1.1.0',
     'Phase 7B เพิ่มโหมดฝึกสั้น MCQ')
) AS d(url, fmt, feats, ver, notes)
  ON ehi.external_url = d.url
 AND ehi.tracked_game = false
ON CONFLICT (item_id) DO UPDATE SET
  game_format = EXCLUDED.game_format,
  features = EXCLUDED.features,
  version = EXCLUDED.version,
  notes = EXCLUDED.notes,
  updated_at = now();
`;
fs.writeFileSync('supabase/migrations/428_media_practice_mcq_batch_b.sql', mig);
console.log('wrote migration 428');
