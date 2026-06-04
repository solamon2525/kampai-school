// test-globe-3d.mjs — logic test เกม globe-3d (ไม่พึ่ง WebGL)
// ⚠️ CONTINENTS/makeQuestion = สำเนาจาก public/games/social/globe-3d.html — แก้ที่เกมแล้ว sync ที่นี่
const CONTINENTS = [
  {key:'asia',name:'เอเชีย'},{key:'europe',name:'ยุโรป'},{key:'africa',name:'แอฟริกา'},
  {key:'namerica',name:'อเมริกาเหนือ'},{key:'samerica',name:'อเมริกาใต้'},
  {key:'australia',name:'ออสเตรเลีย'},{key:'antarctica',name:'แอนตาร์กติกา'},
];
let qrand = Math.random;
const ri = (n) => Math.floor(qrand() * n);
const pick = (arr) => arr[ri(arr.length)];
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=ri(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function makeQuestion(){
  const target = pick(CONTINENTS);
  const others = shuffle(CONTINENTS.filter(c=>c.key!==target.key)).slice(0,3).map(c=>c.name);
  return { target, answer:target.name, options:shuffle([target.name,...others]) };
}
let pass=0,fail=0; const ok=(c,m)=>{if(c)pass++;else{fail++;console.error('  ❌ '+m);}};
ok(CONTINENTS.length===7,'มี 7 ทวีป');
ok(new Set(CONTINENTS.map(c=>c.name)).size===7,'ชื่อทวีปไม่ซ้ำ');
for(let i=0;i<3000;i++){
  const q=makeQuestion();
  if(q.options.length!==4){ok(false,'ต้องมี 4 ตัวเลือก');break;}
  if(new Set(q.options).size!==4){ok(false,'ตัวเลือกซ้ำ: '+q.options.join(','));break;}
  if(!q.options.includes(q.answer)){ok(false,'ไม่มีคำตอบในตัวเลือก');break;}
  if(!CONTINENTS.some(c=>c.name===q.answer)){ok(false,'คำตอบไม่ใช่ทวีปจริง');break;}
}
ok(true,'makeQuestion 3000 รอบ — ผ่าน (4 ตัวเลือกไม่ซ้ำ + มีคำตอบ + เป็นทวีปจริง)');
console.log(`\n${fail===0?'✅':'❌'} globe-3d: ${pass} ผ่าน, ${fail} พลาด`);
process.exit(fail===0?0:1);
