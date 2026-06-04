// test-block-3d.mjs — logic test เกม block-3d (ไม่พึ่ง WebGL) · สำเนา makeQuestion จาก game
let qrand = Math.random;
const ri=(n)=>Math.floor(qrand()*n); const rint=(lo,hi)=>lo+ri(hi-lo+1); const pick=(a)=>a[ri(a.length)];
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=ri(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;}
function numOpts(correct){const s=new Set([correct]);const pool=shuffle([correct-1,correct+1,correct-2,correct+2,correct+3,correct-3].filter(n=>n>0));for(const c of pool){if(s.size>=4)break;s.add(c);}let g=correct+4;while(s.size<4){if(g>0)s.add(g);g++;}return shuffle([...s]).map(String);}
function fracOpts(M,N){const s=new Set([`${M}/${N}`]);const cand=shuffle([[M+1,N],[M-1,N],[M,N+1],[M,N-1],[N-M,N],[M+1,N+1]].filter(([a,b])=>a>0&&b>1&&a<b));for(const[a,b]of cand){if(s.size>=4)break;s.add(`${a}/${b}`);}let n=N+1;while(s.size<4&&n<20){if(M<n)s.add(`${M}/${n}`);n++;}let m=1;while(s.size<4){if(m<N)s.add(`${m}/${N}`);m++;if(m>30)break;}return shuffle([...s]);}
function makeQuestion(forceType){
  const type=forceType||(qrand()<0.5?'volume':'fraction');
  if(type==='volume'){let a,b,c,total;do{a=rint(2,4);b=rint(1,3);c=rint(1,2);total=a*b*c;}while(total<4||total>16);return{type,a,b,c,answer:total,options:numOpts(total)};}
  const N=rint(3,6),M=rint(1,N-1);return{type,M,N,answer:`${M}/${N}`,options:fracOpts(M,N)};
}
let pass=0,fail=0; const ok=(c,m)=>{if(c)pass++;else{fail++;console.error('  ❌ '+m);}};
for(const t of [undefined,'volume','fraction']){
  for(let i=0;i<2000;i++){
    const q=makeQuestion(t);
    if(q.options.length!==4){ok(false,`[${t}] ต้อง 4 ตัวเลือก`);break;}
    if(new Set(q.options).size!==4){ok(false,`[${t}] ตัวเลือกซ้ำ: ${q.options.join(',')}`);break;}
    if(!q.options.map(String).includes(String(q.answer))){ok(false,`[${t}] ไม่มีคำตอบ: ans=${q.answer} opts=${q.options.join(',')}`);break;}
    if(q.type==='volume'){ if(q.answer!==q.a*q.b*q.c){ok(false,'ปริมาตรไม่ตรง a*b*c');break;} if(q.answer<4||q.answer>16){ok(false,'ปริมาตรนอกช่วง 4-16');break;} }
    if(q.type==='fraction'){ if(!(q.M>0&&q.M<q.N)){ok(false,'เศษส่วน M ไม่อยู่ใน 1..N-1');break;} }
  }
}
ok(true,'makeQuestion 6000 รอบ — ผ่าน (4 ตัวเลือกไม่ซ้ำ + มีคำตอบ + ปริมาตร=a*b*c + เศษส่วนถูก)');
console.log(`\n${fail===0?'✅':'❌'} block-3d: ${pass} ผ่าน, ${fail} พลาด`);
process.exit(fail===0?0:1);
