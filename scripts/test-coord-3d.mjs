// test-coord-3d.mjs — logic test เกม coord-3d (ไม่พึ่ง WebGL) · สำเนา makeQuestion จาก game
const NX=4,NY=3,NZ=4;
let qrand=Math.random;
const ri=(n)=>Math.floor(qrand()*n); const rint=(lo,hi)=>lo+ri(hi-lo+1); const cl=(v,m)=>Math.max(0,Math.min(m,v));
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=ri(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
const fmt=(t)=>`(${t[0]}, ${t[1]}, ${t[2]})`;
function makeQuestion(){
  const x=rint(0,NX),y=rint(0,NY),z=rint(0,NZ);
  const correct=fmt([x,y,z]); const opts=new Set([correct]);
  const cands=shuffle([[z,y,x],[cl(x+1,NX),y,z],[cl(x-1,NX),y,z],[x,cl(y+1,NY),z],[x,cl(y-1,NY),z],[x,y,cl(z+1,NZ)],[x,y,cl(z-1,NZ)]]);
  for(const c of cands){if(opts.size>=4)break;opts.add(fmt(c));}
  let g=0;while(opts.size<4&&g++<60)opts.add(fmt([rint(0,NX),rint(0,NY),rint(0,NZ)]));
  return {x,y,z,answer:correct,options:shuffle([...opts])};
}
let pass=0,fail=0; const ok=(c,m)=>{if(c)pass++;else{fail++;console.error('  ❌ '+m);}};
const re=/^\(([0-4]), ([0-3]), ([0-4])\)$/;
for(let i=0;i<6000;i++){
  const q=makeQuestion();
  if(q.options.length!==4){ok(false,`ต้อง 4 ตัวเลือก (ได้ ${q.options.length})`);break;}
  if(new Set(q.options).size!==4){ok(false,'ตัวเลือกซ้ำ: '+q.options.join(' '));break;}
  if(!q.options.includes(q.answer)){ok(false,'ไม่มีคำตอบในตัวเลือก');break;}
  if(q.answer!==`(${q.x}, ${q.y}, ${q.z})`){ok(false,'answer ไม่ตรงพิกัด');break;}
  if(!q.options.every(o=>re.test(o))){ok(false,'ตัวเลือกนอกช่วง/รูปแบบผิด: '+q.options.join(' '));break;}
}
ok(true,'makeQuestion 6000 รอบ — ผ่าน (4 ตัวเลือกไม่ซ้ำ + มีคำตอบ + พิกัดในช่วง 0..NX/NY/NZ)');
console.log(`\n${fail===0?'✅':'❌'} coord-3d: ${pass} ผ่าน, ${fail} พลาด`);
process.exit(fail===0?0:1);
