// Logic test: โหมดฝึกอ่าน (บัตรคำ) ของ vocab-race — โหลด HTML จริงใน jsdom แล้วขับเคลื่อน flow
// (SDK ภายนอกไม่ถูกโหลด → ใช้ fallback shim ในไฟล์, sound.speak = no-op)
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../public/games/english/vocab-race.html', import.meta.url), 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true, url: 'http://localhost/games/english/vocab-race.html' });
const { window } = dom;
const $ = (id) => window.document.getElementById(id);
const txt = (id) => ($(id) ? $(id).textContent : null);
const hasOn = (id) => $(id).classList.contains('on');

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log('❌', m); } };

const total = () => parseInt(txt('fc-progress').split('/')[1].trim(), 10);

// 1) เปิดฝึกอ่านหมวด animals (12 คำ)
window.openStudy('animals');
ok(hasOn('study'), 'openStudy → จอ #study แสดง (.on)');
ok(!hasOn('start'), 'openStudy → ซ่อนจอ start');
ok(total() === 12, `หมวด animals = 12 คำ (filter ถูก, ได้ ${total()})`);
ok(/\w/.test(txt('fc-en')), 'การ์ดแรกโชว์คำอังกฤษ');
ok((txt('fc-th') || '').length > 0, 'การ์ดแรกโชว์คำแปลไทย');
ok(txt('fc-progress').startsWith('1 /'), `progress เริ่ม 1 (ได้ "${txt('fc-progress')}")`);
const arrows = $('study').querySelectorAll('.fc-arrow');
ok(arrows[0].disabled === true, 'การ์ดแรก → ปุ่มก่อนหน้า disabled');
ok(arrows[1].disabled === false, 'การ์ดแรก → ปุ่มถัดไป enabled');
const first = txt('fc-en');

// 2) ถัดไป → คำเปลี่ยน + progress 2 + ปุ่มก่อนหน้าใช้ได้
window.studyNext();
ok(txt('fc-en') !== first, 'studyNext → คำเปลี่ยน');
ok(txt('fc-progress').startsWith('2 /'), 'studyNext → progress 2');
ok(arrows[0].disabled === false, 'คำที่ 2 → ปุ่มก่อนหน้า enabled');

// 3) ย้อนกลับ + clamp ขอบล่าง
window.studyPrev();
ok(txt('fc-progress').startsWith('1 /'), 'studyPrev → กลับคำที่ 1');
ok(txt('fc-en') === first, 'studyPrev → กลับมาคำแรกเดิม');
window.studyPrev();   // ห้ามต่ำกว่า 1
ok(txt('fc-progress').startsWith('1 /'), 'studyPrev ที่คำแรก → ไม่หลุดขอบ (clamp)');

// 4) clamp ขอบบน
for (let i = 0; i < 20; i++) window.studyNext();
ok(txt('fc-progress') === '12 / 12', 'studyNext จนสุด → clamp ที่คำสุดท้าย (12/12)');
ok(arrows[1].disabled === true, 'คำสุดท้าย → ปุ่มถัดไป disabled');

// 5) เล่นเกมหมวดนี้เลย → เข้าโหมดฝึกหมวด animals
window.studyPlay();
ok(!hasOn('study'), 'studyPlay → ปิดจอฝึกอ่าน');
ok(hasOn('play'), 'studyPlay → เข้าจอเล่น (#play .on)');
const answers = $('answers').querySelectorAll('.ans');
ok(answers.length === 4, `studyPlay → มี 4 ตัวเลือก (ได้ ${answers.length})`);

// 6) คำแปลไทย + เสียงไทย ในบัตรเรียน
window.openStudy('food');
ok((txt('fc-th') || '').length > 0, 'บัตรเรียนมีคำแปลไทย (fc-th)');
ok(/[ก-๙]/.test(txt('fc-ex') ? txt('fc-ex-th') : ''), 'บัตรเรียนมีประโยคแปลไทย (fc-ex-th เป็นไทย)');
ok(/[A-Za-z]/.test(txt('fc-ex') || ''), 'บัตรเรียนมีประโยคอังกฤษ (fc-ex)');
ok(typeof window.speakStudyTh === 'function' && typeof window.speakStudyExTh === 'function' && typeof window.speakStudyAuto === 'function', 'มีฟังก์ชันเสียงไทย speakStudyTh/speakStudyExTh + auto');

console.log(`\n${fail === 0 ? '✨ ผ่านทุก check' : '⚠️ มี fail'} — pass ${pass}, fail ${fail}`);
process.exit(fail === 0 ? 0 : 1);
