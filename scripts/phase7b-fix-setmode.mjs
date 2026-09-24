import fs from 'node:fs';

const files = [
  'public/games/career/community-jobs-media.html',
  'public/games/social/sufficiency-media.html',
  'public/games/health/bone-muscle-media.html',
];

const replacement = `function setMode(m) {
      mode = m;
      document.querySelectorAll('#modeSeg button').forEach((b) => b.classList.toggle('on', b.dataset.mode === m));
      const pmcq = document.getElementById('practiceMcq');
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('on'));
      if (pmcq) pmcq.classList.toggle('on', m === 'practice');
      if (m === 'practice') {
        const hint = document.getElementById('hintText');
        if (hint) hint.textContent = 'เลือกคำตอบ 4 ตัวเลือก — ฝึกสั้น';
        nextPracticeMcq();
        return;
      }
      document.getElementById('p-' + m).classList.add('on');`;

for (const f of files) {
  let t = fs.readFileSync(f, 'utf8');
  const start = t.indexOf('function setMode(m) {');
  const marker = "document.getElementById('p-' + m).classList.add('on');";
  const end = t.indexOf(marker, start);
  if (start < 0 || end < 0) {
    console.log('pattern miss', f);
    continue;
  }
  t = t.slice(0, start) + replacement + t.slice(end + marker.length);
  fs.writeFileSync(f, t);
  console.log('fixed', f);
}

// rect-area + plant-parts: guard HINTS[m] and early return for practice
for (const f of [
  'public/games/math/rect-area-media.html',
  'public/games/science/plant-parts-media.html',
]) {
  let t = fs.readFileSync(f, 'utf8');
  if (t.includes("if (m === 'practice') {\n        const hint")) {
    console.log('already early', f);
    continue;
  }
  const needle =
    "if(pmcq){ pmcq.classList.toggle('on', m==='practice'); document.querySelectorAll('.panel').forEach(p=>{ if(m==='practice') p.classList.remove('on'); }); }\n      if(m==='practice') nextPracticeMcq();\n      document.getElementById('hintText').textContent = HINTS[m];";
  const rep = `if(pmcq){ pmcq.classList.toggle('on', m==='practice'); document.querySelectorAll('.panel').forEach(p=>{ if(m==='practice') p.classList.remove('on'); }); }
      if(m==='practice'){
        document.getElementById('hintText').textContent = 'เลือกคำตอบ 4 ตัวเลือก — ฝึกสั้น';
        nextPracticeMcq();
        return;
      }
      document.getElementById('hintText').textContent = HINTS[m];`;
  if (!t.includes(needle)) {
    console.log('needle miss', f);
    continue;
  }
  t = t.split(needle).join(rep);
  fs.writeFileSync(f, t);
  console.log('early-return', f);
}
