// Logic test: KAMPAI.sound.speak() interrupt — กันบั๊ก "เสียงอ่านหายตอนตอบถูก" (vocab-race)
// โหลด SDK จริงใน jsdom + mock speechSynthesis → ยืนยันพฤติกรรม guard vs interrupt
import { JSDOM } from 'jsdom';
import { readFileSync } from 'node:fs';

const dom = new JSDOM('<!doctype html><body></body>', { runScripts: 'outside-only', url: 'http://localhost/' });
const { window } = dom;

const state = { speaking: false, pending: false };
const calls = { cancel: 0, speak: 0 };
window.speechSynthesis = {
  getVoices: () => [],
  cancel: () => { calls.cancel++; state.speaking = false; state.pending = false; },
  speak: () => { calls.speak++; state.speaking = true; },
  get speaking() { return state.speaking; },
  get pending() { return state.pending; },
  set onvoiceschanged(_v) {},
  get onvoiceschanged() { return null; },
};
window.SpeechSynthesisUtterance = class { constructor(t) { this.text = t; this.lang = ''; this.rate = 1; this.pitch = 1; this.voice = null; } };

window.eval(readFileSync(new URL('../public/games/kampai-sdk.js', import.meta.url), 'utf8'));
const speak = window.KAMPAI.sound.speak;

let pass = 0, fail = 0;
const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log('❌', m); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 1) ไม่มีเสียงค้าง + ไม่ interrupt → พูดได้ปกติ (regression: เกมอื่นเรียก 2 args)
state.speaking = false; calls.speak = 0; calls.cancel = 0;
speak('แมว', 'th-TH');
ok(calls.speak === 1, 'idle + no-interrupt → ควร speak 1 ครั้ง');
ok(calls.cancel === 0, 'idle + no-interrupt → ไม่ควร cancel');

// 2) มีเสียงค้าง + ไม่ interrupt → guard ทิ้ง (พฤติกรรมเดิม ไม่กระทบเกมอื่น)
state.speaking = true; calls.speak = 0; calls.cancel = 0;
speak('cat', 'en-US');
ok(calls.speak === 0, 'busy + no-interrupt → guard ต้องทิ้ง (ไม่ speak)');

// 3) มีเสียงค้าง + interrupt=true → cancel ทันที แล้ว speak (นี่คือ fix ของบั๊ก)
state.speaking = true; calls.speak = 0; calls.cancel = 0;
speak('cat', 'en-US', true);
ok(calls.cancel === 1, 'busy + interrupt → ต้อง cancel เสียงค้างทันที');
ok(calls.speak === 0, 'busy + interrupt → speak ถูก defer (ยังไม่เรียกทันที)');
await sleep(160);
ok(calls.speak === 1, 'busy + interrupt → หลัง defer ต้อง speak คำใหม่ (เสียงไม่หาย)');

console.log(`\n${fail === 0 ? '✨ ผ่านทุก check' : '⚠️ มี fail'} — pass ${pass}, fail ${fail}`);
process.exit(fail === 0 ? 0 : 1);
