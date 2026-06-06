// test-online-safety.mjs — data-integrity + scoring-logic test เกม online-safety
// ดึง CARDS จากไฟล์ HTML จริง (กัน drift) แล้วตรวจความถูกต้องของข้อมูล + จำลองกลไกคะแนน
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const html = readFileSync(resolve(process.cwd(), 'public/games/tech/online-safety.html'), 'utf8');
const m = html.match(/const CARDS = (\[[\s\S]*?\]);/);
if (!m) { console.error('❌ หา CARDS array ในไฟล์ไม่เจอ'); process.exit(1); }
// eslint-disable-next-line no-eval
const CARDS = eval(m[1]);

let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.error('  ❌ ' + msg); } };

// (1) จำนวนการ์ดพอเหมาะ
ok(CARDS.length >= 30, `ควรมี ≥30 การ์ด (มี ${CARDS.length})`);

// (2) ทุกการ์ดมีฟิลด์ครบ + ชนิดถูก
const seen = new Set();
CARDS.forEach((c, i) => {
    const tag = `การ์ด#${i + 1}`;
    ok(typeof c.cat === 'string' && c.cat.trim().length > 0, `${tag}: cat ว่าง`);
    ok(typeof c.emoji === 'string' && c.emoji.trim().length > 0, `${tag}: emoji ว่าง`);
    ok(typeof c.scene === 'string' && c.scene.trim().length >= 4, `${tag}: scene สั้น/ว่าง`);
    ok(typeof c.action === 'string' && c.action.trim().length >= 3, `${tag}: action สั้น/ว่าง`);
    ok(typeof c.good === 'boolean', `${tag}: good ต้องเป็น boolean (ได้ ${typeof c.good})`);
    ok(typeof c.why === 'string' && c.why.trim().length >= 6, `${tag}: why สั้น/ว่าง — "${c.scene}"`);
    const key = (c.scene + '|' + c.action).trim();
    ok(!seen.has(key), `${tag}: ซ้ำ (scene+action) — "${c.scene} / ${c.action}"`);
    seen.add(key);
});

// (3) มีทั้งกรณีควร(good) และไม่ควร(bad) + สมดุลพอใช้ (กัน "กดข้างเดียวชนะ")
const goods = CARDS.filter((c) => c.good).length;
const bads = CARDS.length - goods;
ok(goods >= 8 && bads >= 8, `ต้องมีทั้ง good/bad ≥8 (good ${goods}, bad ${bads})`);
ok(Math.abs(goods - bads) <= Math.ceil(CARDS.length * 0.34), `สัดส่วน good/bad เอียงเกินไป (good ${goods}, bad ${bads})`);

// (4) ครบ 6 หมวด (จับจาก emoji prefix ของ cat)
const cats = new Set(CARDS.map((c) => c.cat.trim().split(' ')[0]));
ok(cats.size >= 6, `ควรมี ≥6 หมวด (มี ${cats.size}: ${[...cats].join(' ')})`);

// (5) จำลองกลไกคะแนน (ตรงกับ answer() ในเกม): ถูก→combo++ & +10*max(1,combo) · ผิด→combo=0
function simulate(answers) { // answers: [{good, choice}]
    let score = 0, combo = 0;
    for (const a of answers) {
        if (a.choice === a.good) { combo++; score += 10 * Math.max(1, combo); }
        else combo = 0;
    }
    return { score, combo };
}
// ตอบถูก 3 ครั้งติด: 10*1 + 10*2 + 10*3 = 60, combo 3
let r = simulate([{good:true,choice:true},{good:false,choice:false},{good:true,choice:true}]);
ok(r.score === 60 && r.combo === 3, `scoring ถูก 3 ติด ควร 60/combo3 (ได้ ${r.score}/${r.combo})`);
// ตอบผิดกลางคัน → combo รีเซ็ต
r = simulate([{good:true,choice:true},{good:true,choice:false},{good:true,choice:true}]);
ok(r.score === 20 && r.combo === 1, `scoring ผิดกลางคัน ควร 20/combo1 (ได้ ${r.score}/${r.combo})`);

console.log(`\n${fail === 0 ? '✅' : '❌'} online-safety: ${pass} ผ่าน, ${fail} พลาด  (การ์ด ${CARDS.length}, good ${goods}/bad ${bads}, ${cats.size} หมวด)`);
process.exit(fail === 0 ? 0 : 1);
