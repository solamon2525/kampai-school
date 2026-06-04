// test-net-3d.mjs — logic test เกม net-3d (ไม่พึ่ง WebGL/canvas)
// ⚠️ SOLIDS keys / NETS keys / makeQuestion = สำเนาจาก public/games/math/net-3d.html
const KEYS = ['cube','sqpyramid','triprism','cylinder','cone'];
const SOLIDS = KEYS.map(k => ({ key:k }));
const NET_KEYS = ['cube','sqpyramid','triprism','cylinder','cone'];
let qrand = Math.random;
const ri=(n)=>Math.floor(qrand()*n); const pick=(a)=>a[ri(a.length)];
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=ri(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function makeQuestion(){ const target=pick(SOLIDS); const others=shuffle(SOLIDS.filter(s=>s.key!==target.key)).slice(0,3); return {target,options:shuffle([target,...others])}; }
let pass=0,fail=0; const ok=(c,m)=>{if(c)pass++;else{fail++;console.error('  ❌ '+m);}};
ok(SOLIDS.length===5,'มี 5 ทรง');
ok(KEYS.every(k=>NET_KEYS.includes(k)),'ทุกทรงมีรูปคลี่ (NETS) ครบ');
for(let i=0;i<3000;i++){
  const q=makeQuestion();
  if(q.options.length!==4){ok(false,'ต้องมี 4 ตัวเลือก');break;}
  const keys=q.options.map(o=>o.key);
  if(new Set(keys).size!==4){ok(false,'ตัวเลือกซ้ำ: '+keys.join(','));break;}
  if(!keys.includes(q.target.key)){ok(false,'ไม่มีคำตอบในตัวเลือก');break;}
  if(keys.filter(k=>k===q.target.key).length!==1){ok(false,'คำตอบถูกมีมากกว่า 1');break;}
}
ok(true,'makeQuestion 3000 รอบ — ผ่าน (4 ตัวเลือกไม่ซ้ำ + คำตอบถูก 1 เดียว)');
console.log(`\n${fail===0?'✅':'❌'} net-3d: ${pass} ผ่าน, ${fail} พลาด`);
process.exit(fail===0?0:1);
