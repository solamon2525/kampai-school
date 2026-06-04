// test-room-3d.mjs — data integrity test เกม room-3d (gameplay จริง=raycast ต้องเทสต์ browser)
// ⚠️ OBJECTS = สำเนา keys/en/th จาก public/games/english/room-3d.html
const OBJECTS = [
  {key:'chair',en:'chair',th:'เก้าอี้'},{key:'ball',en:'ball',th:'ลูกบอล'},{key:'book',en:'book',th:'หนังสือ'},
  {key:'cup',en:'cup',th:'ถ้วย'},{key:'bag',en:'bag',th:'กระเป๋า'},{key:'plant',en:'plant',th:'ต้นไม้'},
  {key:'lamp',en:'lamp',th:'โคมไฟ'},{key:'bed',en:'bed',th:'เตียง'},{key:'clock',en:'clock',th:'นาฬิกา'},{key:'door',en:'door',th:'ประตู'},
];
let pass=0,fail=0; const ok=(c,m)=>{if(c)pass++;else{fail++;console.error('  ❌ '+m);}};
ok(OBJECTS.length===10,'มี 10 สิ่งของ');
ok(new Set(OBJECTS.map(o=>o.key)).size===10,'key ไม่ซ้ำ');
ok(new Set(OBJECTS.map(o=>o.en)).size===10,'คำอังกฤษไม่ซ้ำ');
ok(OBJECTS.every(o=>o.key&&o.en&&o.th),'ทุกชิ้นมี key/en/th ครบ');
ok(OBJECTS.every(o=>/^[a-z]+$/.test(o.en)),'คำอังกฤษเป็นตัวพิมพ์เล็กล้วน');
console.log(`\n${fail===0?'✅':'❌'} room-3d: ${pass} ผ่าน, ${fail} พลาด`);
process.exit(fail===0?0:1);
