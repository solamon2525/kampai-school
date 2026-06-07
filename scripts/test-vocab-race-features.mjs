// Logic test: ฟีเจอร์ใหม่ vocab-race (ระดับชั้น/ชนิดคำถาม/คำพลาด/เหรียญ/คำประจำวัน)
// โหลด HTML จริงใน jsdom (SDK ภายนอกไม่โหลด → fallback shim, sound = no-op)
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../public/games/english/vocab-race.html', import.meta.url), 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/games/english/vocab-race.html' });
const { window } = dom;
window.Element.prototype.scrollIntoView = function () {};   // jsdom ไม่มี (เบราว์เซอร์จริงมี)
const $ = (id) => window.document.getElementById(id);

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('❌', m); } };

// 1) คำประจำวัน — เสถียร (วันเดียวกันได้คำเดิม) + โครงสร้างครบ
const d1 = window.dailyWord(), d2 = window.dailyWord();
ok(d1 && d1.id === d2.id, 'dailyWord เสถียร (เรียกซ้ำได้คำเดิม)');
ok(d1 && d1.en && d1.th && d1.emoji && d1.ex && (d1.g === 1 || d1.g === 2), 'word มี en/th/emoji/ex/g ครบ');
ok(/\.dw-en|dw-en/.test($('daily-card').innerHTML) && $('daily-card').textContent.length > 0, 'การ์ดคำประจำวัน render แล้ว');

// 2) ระดับชั้น — pool กรองตาม g
window.setGrade(1);
const p1 = window.pool();
ok(p1.length >= 4 && p1.every(w => w.g === 1), `ป.1-3 → ทุกคำ g=1 (${p1.length} คำ)`);
window.setGrade(2);
const p2 = window.pool();
ok(p2.length >= 4 && p2.every(w => w.g === 2), `ป.4-6 → ทุกคำ g=2 (${p2.length} คำ)`);
window.setGrade('all');
const pa = window.pool();
ok(pa.some(w => w.g === 1) && pa.some(w => w.g === 2) && pa.length > p1.length, `ทั้งหมด → ปนทุกระดับ (${pa.length} คำ)`);
ok($('start').querySelector('.grade-chip.on').dataset.g === 'all', 'ชิประดับ "ทั้งหมด" ติดสถานะ on');

// 3) ชนิดคำถาม — pickKind ครบ 3 แบบ
const kinds = new Set();
for (let i = 0; i < 400; i++) kinds.add(window.pickKind());
ok(kinds.has('th2en') && kinds.has('en2th') && kinds.has('listen'), `pickKind ครบ 3 แบบ (${[...kinds].join(',')})`);

// 4) render คำถามแต่ละชนิด (stub Math.random บังคับ kind) — โครงสร้างถูก
window.chooseMode('practice');   // mode=practice → ไม่มี timer
const realRand = Math.random;
function forceKind(r) { window.Math.random = () => r; window.nextQuestion(); window.Math.random = realRand; }
forceKind(0.1);   // th2en
ok($('answers').querySelectorAll('.ans').length === 4, 'th2en → 4 ตัวเลือก');
ok(!$('q-th').classList.contains('en') && $('q-emoji').textContent !== '🔊', 'th2en → โจทย์เป็นไทย+รูป');
forceKind(0.65);  // en2th
ok($('q-th').classList.contains('en'), 'en2th → โจทย์เป็นคำอังกฤษ (q-th.en)');
forceKind(0.95);  // listen
ok($('answers').classList.contains('listen-grid'), 'listen → answers เป็น listen-grid');
ok(/ans-emoji/.test($('answers').innerHTML) && $('q-emoji').textContent === '🔊', 'listen → ตัวเลือกเป็นรูป + โจทย์เป็น 🔊');
// ทุกตัวเลือก id ไม่ซ้ำ
const ids = [...$('answers').querySelectorAll('.ans')].map(b => b.dataset.id);
ok(new Set(ids).size === ids.length && ids.every(x => x !== ''), 'ตัวเลือก 4 ตัว id ไม่ซ้ำ');

// 5) คลังคำที่พลาด + ปุ่มทบทวน
window.localStorage.removeItem('vr_missed');
ok(window.missedWords().length === 0, 'เริ่มต้น: ไม่มีคำพลาด');
window.renderReviewBtn();
ok($('review-btn').style.display === 'none', 'ไม่มีคำพลาด → ปุ่มทบทวนซ่อน');
window.addMissed({ cat: 'animals', en: 'cat', th: 'แมว', id: 0 });
const mw = window.missedWords();
ok(mw.some(w => w.en === 'cat' && w.cat === 'animals'), 'addMissed → missedWords มีคำนั้น');
ok(JSON.parse(window.localStorage.getItem('vr_missed')).includes('animals:cat'), 'addMissed → เก็บลง localStorage');
window.renderReviewBtn();
ok($('review-btn').style.display !== 'none' && /ทบทวน/.test($('review-btn').textContent), 'มีคำพลาด → ปุ่มทบทวนโชว์ พร้อมจำนวน');
window.clearMissedWord({ cat: 'animals', en: 'cat' });
ok(window.missedWords().length === 0, 'clearMissedWord → เอาคำออกจากคลังพลาด');

// 6) เหรียญ
window.localStorage.removeItem('vr_badges');
ok(!window.getBadges().first_play, 'เริ่มต้น: ยังไม่มีเหรียญ first_play');
const just = window.evalBadges();
ok(just.includes('first_play'), 'evalBadges ครั้งแรก → ปลดล็อก first_play');
ok(window.getBadges().first_play === 1, 'เหรียญถูกบันทึก');
ok(window.evalBadges().length === 0, 'evalBadges ซ้ำ → ไม่ปลดเหรียญเดิมอีก');

// 7) แข่งเร็ว เลือกหมวด (รวม/แยก/ผสม)
window.chooseMode('race');
const allCount = window.pool().length;
ok(allCount > 50, `race default (รวม) → ทุกคำ (${allCount})`);
ok($('race-picker').classList.contains('on'), 'race → เปิด race-picker');
ok(!!$('race-chips').querySelector('.rp-all.on'), 'default → ชิป "รวมทั้งหมด" ติด');
window.toggleRaceCat('animals');
let rp = window.pool();
ok(rp.length === 12 && rp.every(w => w.cat === 'animals'), `เลือก animals → 12 คำเฉพาะหมวด (${rp.length})`);
ok(!$('race-chips').querySelector('.rp-all.on'), 'เลือกหมวด → "รวม" ดับ');
window.toggleRaceCat('colors');
rp = window.pool();
ok(rp.every(w => w.cat === 'animals' || w.cat === 'colors') && rp.some(w => w.cat === 'colors'), `ผสม animals+colors (${rp.length} คำ)`);
window.toggleRaceAll();
ok(window.pool().length === allCount, 'แตะรวมทั้งหมด → กลับเป็นทุกคำ');
window.toggleRaceCat('jobs'); window.toggleRaceCat('jobs');
ok(window.pool().length === allCount, 'เปิดหมวดแล้วปิดจนว่าง → auto กลับรวมทั้งหมด');

console.log(`\n${fail === 0 ? '✨ ผ่านทุก check' : '⚠️ มี fail'} — pass ${pass}, fail ${fail}`);
process.exit(fail === 0 ? 0 : 1);
