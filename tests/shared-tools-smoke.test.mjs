import { JSDOM } from 'jsdom';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const classroomToolsPath = resolve(ROOT, 'public/games/shared-classroom-tools.js');
const worksheetToolsPath = resolve(ROOT, 'public/games/shared-worksheet-tools.js');

console.log('🧪 Starting shared classroom tools & worksheet generator tests...\n');

// 1. Verify files exist
if (!existsSync(classroomToolsPath)) {
  throw new Error(`File not found: ${classroomToolsPath}`);
}
if (!existsSync(worksheetToolsPath)) {
  throw new Error(`File not found: ${worksheetToolsPath}`);
}

const classroomCode = readFileSync(classroomToolsPath, 'utf8');
const worksheetCode = readFileSync(worksheetToolsPath, 'utf8');

// Mock HTML5 Canvas 2D context for jsdom
function createMockCanvasContext() {
  return {
    save: () => {},
    restore: () => {},
    beginPath: () => {},
    closePath: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    moveTo: () => {},
    lineTo: () => {},
    clearRect: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    measureText: () => ({ width: 50 }),
    rotate: () => {},
    translate: () => {},
    scale: () => {},
    fillStyle: '#000000',
    strokeStyle: '#000000',
    lineWidth: 1,
    font: '16px sans-serif',
    textAlign: 'center',
    textBaseline: 'middle'
  };
}

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><head></head><body><div id="game-container"></div></body></html>', {
  runScripts: 'dangerously',
  url: 'http://localhost/'
});

const win = dom.window;
const doc = win.document;

// Mock requestAnimationFrame / cancelAnimationFrame for jsdom
if (!win.requestAnimationFrame) {
  win.requestAnimationFrame = (cb) => setTimeout(cb, 16);
  win.cancelAnimationFrame = (id) => clearTimeout(id);
}

// Attach mock canvas 2d context
win.HTMLCanvasElement.prototype.getContext = function (type) {
  if (type === '2d') return createMockCanvasContext();
  return null;
};

// Mock SpeechSynthesis if not present in jsdom
if (!win.speechSynthesis) {
  win.speechSynthesis = {
    speak: () => {},
    cancel: () => {},
    getVoices: () => []
  };
  win.SpeechSynthesisUtterance = function (text) {
    this.text = text;
  };
}

// Execute scripts in the window context
win.eval(classroomCode);
win.eval(worksheetCode);

console.log('✅ Scripts evaluated successfully in JSDOM context.');

// ==========================================
// Test KampaiClassroom
// ==========================================
assert.ok(win.KampaiClassroom, 'window.KampaiClassroom should be defined');
assert.equal(typeof win.KampaiClassroom.toggleProjector, 'function', 'toggleProjector should be a function');
assert.equal(typeof win.KampaiClassroom.openWheel, 'function', 'openWheel should be a function');
assert.equal(typeof win.KampaiClassroom.openTeamBattle, 'function', 'openTeamBattle should be a function');

console.log('✅ KampaiClassroom interface verified');

// Test Projector Mode Toggle
assert.equal(doc.body.classList.contains('kampai-projector-mode'), false, 'Initially not in projector mode');

// Toggle ON
const active = win.KampaiClassroom.toggleProjector(true);
assert.equal(active, true, 'toggleProjector(true) should return true');
assert.equal(doc.body.classList.contains('kampai-projector-mode'), true, 'Body has kampai-projector-mode class');

const toolbar = doc.getElementById('kampai-projector-bar');
assert.ok(toolbar, '#kampai-projector-bar should be present in DOM when projector mode is active');

// Verify toolbar buttons: Next, Prev, Flip, Speak, Exit
const btnNext = toolbar.querySelector('[data-action="next"]');
const btnPrev = toolbar.querySelector('[data-action="prev"]');
const btnFlip = toolbar.querySelector('[data-action="flip"]');
const btnSpeak = toolbar.querySelector('[data-action="speak"]');
const btnExit = toolbar.querySelector('[data-action="exit"]');

assert.ok(btnNext, 'Toolbar contains Next button');
assert.ok(btnPrev, 'Toolbar contains Prev button');
assert.ok(btnFlip, 'Toolbar contains Flip button');
assert.ok(btnSpeak, 'Toolbar contains Speak button');
assert.ok(btnExit, 'Toolbar contains Exit button');

// Test Event Dispatch
let nextFired = false;
win.addEventListener('kampai:projector:next', () => { nextFired = true; });
btnNext.click();
assert.equal(nextFired, true, 'Next button dispatches kampai:projector:next event');

// Toggle OFF
win.KampaiClassroom.toggleProjector(false);
assert.equal(doc.body.classList.contains('kampai-projector-mode'), false, 'Body kampai-projector-mode removed');
assert.equal(toolbar.style.display, 'none', 'Toolbar hidden when projector mode disabled');

console.log('✅ Projector mode toggle and toolbar verified');

// Test Wheel Randomizer
let pickedResult = null;
win.KampaiClassroom.openWheel(['ข้อ 1', 'ข้อ 2', 'ข้อ 3', 'ข้อ 4'], (item) => {
  pickedResult = item;
});

const wheelModal = doc.getElementById('kampai-wheel-modal');
assert.ok(wheelModal, '#kampai-wheel-modal mounted');
const wheelCanvas = wheelModal.querySelector('canvas');
assert.ok(wheelCanvas, 'Wheel modal contains canvas element');
const spinBtn = wheelModal.querySelector('#kampai-wheel-spin-btn');
assert.ok(spinBtn, 'Wheel modal contains spin button');

// Close wheel
if (typeof win.KampaiClassroom.closeWheel === 'function') {
  win.KampaiClassroom.closeWheel();
} else {
  const closeBtn = wheelModal.querySelector('[data-action="close"]');
  closeBtn?.click();
}
assert.equal(wheelModal.style.display === 'none' || !doc.body.contains(wheelModal), true, 'Wheel modal closed');

console.log('✅ Wheel randomizer modal verified');

// Test Team Battle
let lastScores = null;
win.KampaiClassroom.openTeamBattle('ศึกคิดเลขเร็ว แดง VS น้ำเงิน', (scores) => {
  lastScores = scores;
});

const battleModal = doc.getElementById('kampai-battle-modal');
assert.ok(battleModal, '#kampai-battle-modal mounted');

const redScoreEl = battleModal.querySelector('#kampai-score-red');
const blueScoreEl = battleModal.querySelector('#kampai-score-blue');
const btnRedAdd = battleModal.querySelector('[data-action="red-add-1"]');
const btnBlueAdd = battleModal.querySelector('[data-action="blue-add-1"]');

assert.ok(redScoreEl, 'Red score element exists');
assert.ok(blueScoreEl, 'Blue score element exists');
assert.ok(btnRedAdd, 'Red +1 button exists');
assert.ok(btnBlueAdd, 'Blue +1 button exists');

// Add score to Red team
btnRedAdd.click();
assert.equal(redScoreEl.textContent.trim(), '1', 'Red score incremented to 1');
assert.equal(lastScores?.red, 1, 'onScore red score is 1');
assert.equal(lastScores?.blue, 0, 'onScore blue score is 0');

// Close battle modal
if (typeof win.KampaiClassroom.closeTeamBattle === 'function') {
  win.KampaiClassroom.closeTeamBattle();
} else {
  const closeBtn = battleModal.querySelector('[data-action="close"]');
  closeBtn?.click();
}
assert.equal(battleModal.style.display === 'none' || !doc.body.contains(battleModal), true, 'Battle modal closed');

console.log('✅ Team Battle hotseat modal verified');

// ==========================================
// Test KampaiWorksheet
// ==========================================
assert.ok(win.KampaiWorksheet, 'window.KampaiWorksheet should be defined');
assert.equal(typeof win.KampaiWorksheet.generateA4, 'function', 'generateA4 should be a function');
assert.equal(typeof win.KampaiWorksheet.openPrintModal, 'function', 'openPrintModal should be a function');

console.log('✅ KampaiWorksheet interface verified');

// Test generateA4 formatting
const sampleQuestions = [
  { question: '2 × 1 = ?', answer: '2' },
  { question: '2 × 2 = ?', answer: '4' },
  { question: '2 × 3 = ?', answer: '6' },
  { question: '2 × 4 = ?', answer: '8' },
  { question: '2 × 5 = ?', answer: '10' },
  { question: '2 × 6 = ?', answer: '12' },
  { question: '2 × 7 = ?', answer: '14' },
  { question: '2 × 8 = ?', answer: '16' },
  { question: '2 × 9 = ?', answer: '18' },
  { question: '2 × 10 = ?', answer: '20' }
];

const htmlOutput = win.KampaiWorksheet.generateA4({
  title: 'แบบฝึกหัดสูตรคูณแม่ 2',
  subtitle: 'ชั้นประถมศึกษาปีที่ 2 • ฝึกคิดเลขเร็ว',
  instructions: 'จงหาผลคูณของจำนวนต่อไปนี้ให้ถูกต้อง',
  items: sampleQuestions,
  includeAnswerKey: true
});

assert.ok(typeof htmlOutput === 'string' && htmlOutput.length > 200, 'generateA4 returns non-empty HTML string');

// Verify critical print elements
assert.match(htmlOutput, /@page\s*\{[^}]*size:\s*A4/i, 'HTML contains @page with size: A4');
assert.match(htmlOutput, /ชื่อ-นามสกุล/i, 'Contains student name field');
assert.match(htmlOutput, /ชั้น/i, 'Contains grade field');
assert.match(htmlOutput, /เลขที่/i, 'Contains student number field');
assert.match(htmlOutput, /คะแนน/i, 'Contains score box');
assert.match(htmlOutput, /ลงชื่อครูผู้สอน/i, 'Contains teacher signature line');
assert.match(htmlOutput, /แบบฝึกหัดสูตรคูณแม่ 2/i, 'Contains title');
assert.match(htmlOutput, /2\s*×\s*1\s*=\s*\?/i, 'Contains sample question item');
assert.match(htmlOutput, /เฉลยคำตอบ/i, 'Contains answer key section');
assert.match(htmlOutput, /page-break-before:\s*always/i, 'Contains page break before answer key');

console.log('✅ generateA4 HTML structure and print specs verified');

// Test openPrintModal
win.KampaiWorksheet.openPrintModal({
  title: 'แบบฝึกหัดทดสอบ',
  items: sampleQuestions
});

const printModal = doc.getElementById('kampai-worksheet-modal');
assert.ok(printModal, '#kampai-worksheet-modal mounted');
const printBtn = printModal.querySelector('[data-action="print"]');
assert.ok(printBtn, 'Print button exists in worksheet modal');

console.log('✅ openPrintModal verified');

console.log('\n🎉 ALL SMOKE TESTS PASSED SUCCESSFULLY!');
