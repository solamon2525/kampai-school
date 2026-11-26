import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = process.cwd();
const toolsCode = fs.readFileSync(path.join(root, 'public/games/shared-worksheet-tools.js'), 'utf8');
const topicCss = fs.readFileSync(path.join(root, 'public/games/worksheet-topic.css'), 'utf8');
const topicJsCode = fs.readFileSync(path.join(root, 'public/games/worksheet-topic.js'), 'utf8');

function createToolsContext() {
  const ctx = {
    window: {},
    document: {
      body: { appendChild() {} },
      createElement() {
        return {
          style: {},
          setAttribute() {},
          addEventListener() {},
          querySelector() { return null; },
          remove() {},
        };
      },
      getElementById() { return null; },
    },
    Intl,
    CustomEvent: class CustomEvent {
      constructor(type, init) {
        this.type = type;
        this.detail = init?.detail;
      }
    },
  };
  ctx.window.window = ctx.window;
  vm.runInNewContext(toolsCode, ctx);
  return ctx;
}

const ctx = createToolsContext();
const tools = ctx.window.KampaiWorksheetTools;

assert.ok(tools, 'window.KampaiWorksheetTools must be defined');
assert.equal(typeof tools.renderConceptGrid100, 'function', 'renderConceptGrid100 must be a function');
assert.equal(typeof tools.openConceptGrid100Preview, 'function', 'openConceptGrid100Preview must be a function');

// 1. Deduplication by trimmed word/term and exclusion of quarantined items (multi-subject)
const mixedSubjectItems = [
  { word: 'because', reading: 'บีคอส', meaning: 'เพราะว่า', grade: 'ป.4', content_status: 'approved' },
  { word: ' because ', reading: 'dup', meaning: 'ซ้ำ', grade: 'ป.4', content_status: 'approved' },
  { term: 'photosynthesis', reading: 'โฟโทซินเทซิส', meaning: 'การสังเคราะห์ด้วยแสง', content_status: 'approved' },
  { term: ' photosynthesis ', meaning: 'duplicate term', content_status: 'approved' },
  { word: 'bad-item', meaning: 'should be excluded', content_status: 'quarantined' },
  { term: '6 × 7 = 42', meaning: 'หกคูณเจ็ดเท่ากับสี่สิบสอง', quarantined: true },
  { term: '7 × 8 = 56', meaning: 'เจ็ดคูณแปดเท่ากับห้าสิบหก' },
];

const normalized = tools.normalizeConceptItems(mixedSubjectItems);
assert.equal(normalized.length, 3, 'must deduplicate trimmed word/term and exclude quarantined items');
assert.deepEqual(
  Array.from(normalized.map((item) => item.word)),
  ['because', 'photosynthesis', '7 × 8 = 56'],
);

// 2. Render 100 cells across presets (5x20 portrait, 4x25 portrait, 5x20 landscape),
//    auto-fit font classes (fs-xl..fs-xs), XSS escaping, and floating .no-print toolbar
const englishItems = Array.from({ length: 105 }, (_, i) => {
  if (i === 0) return { word: 'go', reading: 'โก', meaning: 'ไป' };
  if (i === 1) return { word: 'extraordinary-phenomenon', reading: 'long', meaning: 'ปรากฏการณ์ <script>alert("xss")</script>' };
  if (i === 2) return { word: ' go ', meaning: 'duplicate should be deduped' };
  if (i === 3) return { term: 'quarantined-word', content_status: 'quarantined' };
  return { term: `word-${i}`, meaning: `คำที่ ${i}` };
});

const portraitHtml = tools.renderConceptGrid100(englishItems, {
  title: 'English Sight Words <script>alert(1)</script>',
  subject: 'ภาษาอังกฤษ',
  gradeLabel: 'ป.4',
  preset: '5x20-portrait',
  showNumbers: true,
  showReading: true,
  showCheckbox: true,
  includeTeacherKey: true,
});

assert.ok(portraitHtml.includes('size: A4 portrait'), '5x20-portrait must set A4 portrait @page');
assert.ok(!portraitHtml.includes('<script>alert(1)</script>'), 'title must escape <script>');
assert.ok(!portraitHtml.includes('<script>alert("xss")</script>'), 'item meaning must escape <script>');
assert.ok(portraitHtml.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'escaped title text must remain readable');

const cellMatches5x20 = portraitHtml.match(/<td class="concept-cell /g) || [];
assert.equal(cellMatches5x20.length, 100, '5x20-portrait must render exactly 100 cells');
assert.ok(portraitHtml.includes('concept-cell fs-xl'), 'short word must get fs-xl');
assert.ok(portraitHtml.includes('concept-cell fs-xs'), 'very long term must get fs-xs');

// Floating .no-print toolbar controls
assert.ok(portraitHtml.includes('no-print'), 'must include floating .no-print toolbar');
assert.ok(portraitHtml.includes('🖨️ สั่งพิมพ์'), 'toolbar must include สั่งพิมพ์ button');
assert.ok(portraitHtml.includes('📄 บันทึกเป็น PDF'), 'toolbar must include บันทึกเป็น PDF button');
assert.ok(portraitHtml.includes('Save as PDF'), 'toolbar must include Save as PDF hint');
assert.ok(portraitHtml.includes('🎲 สุ่มชุดใหม่'), 'toolbar must include สุ่มชุดใหม่ button');
assert.ok(portraitHtml.includes('✖️ ปิด'), 'toolbar must include ปิด button');

// Teacher key sheet: overflow: visible & minmax(0, 1fr) (zero right-column clipping)
assert.ok(portraitHtml.includes('teacher-key-sheet'), 'must render optional teacher key sheet');
assert.match(portraitHtml, /\.teacher-key-sheet\s*\{[^}]*overflow:\s*visible/i, 'teacher key sheet must have overflow: visible');
assert.match(portraitHtml, /minmax\(0,\s*1fr\)/i, 'teacher key columns must use minmax(0, 1fr)');

// 3. 4x25 portrait & 5x20 landscape presets
const portrait4x25Html = tools.renderConceptGrid100(
  [{ term: '7 × 8 = 56' }, { term: '9 × 6 = 54' }],
  { preset: '4x25-portrait', subject: 'คณิตศาสตร์', includeTeacherKey: false },
);
assert.ok(portrait4x25Html.includes('size: A4 portrait'), '4x25-portrait must set A4 portrait');
assert.equal((portrait4x25Html.match(/<td class="concept-cell/g) || []).length, 100, '4x25-portrait must pad grid to 100 cells');
assert.ok(!portrait4x25Html.includes('<section class="sheet teacher-key-sheet">'), 'must omit teacher key when includeTeacherKey is false');

const landscapeHtml = tools.renderConceptGrid100(
  Array.from({ length: 100 }, (_, i) => ({ word: `คำที่-${i + 1}`, meaning: `ความหมาย ${i + 1}` })),
  { preset: '5x20-landscape', subject: 'ภาษาไทย', includeTeacherKey: true },
);
assert.ok(landscapeHtml.includes('size: A4 landscape'), '5x20-landscape must set A4 landscape');
assert.equal((landscapeHtml.match(/<td class="concept-cell /g) || []).length, 100, '5x20-landscape must render 100 cells');

// 4. Verify worksheet-topic.css wrapping / non-clipping rules for teacher answers & key blocks
assert.match(topicCss, /\.teacher-answer\{[^}]*word-break:\s*break-word/i, 'worksheet-topic.css .teacher-answer must wrap cleanly');
assert.match(topicCss, /minmax\(0,\s*1fr\)/i, 'worksheet-topic.css must use minmax(0, 1fr) for grid columns');
assert.match(topicCss, /\.teacher-key-sheet[^}]*overflow:\s*visible/i, 'worksheet-topic.css .teacher-key-sheet must use overflow: visible');

// 5. Verify worksheet-topic.js enhances #btnPrint without breaking ID or WORKSHEET.md §3 contract
const btnPrintEl = {
  id: 'btnPrint',
  textContent: '🖨 พิมพ์ A4',
  title: '',
  attrs: {},
  onclick: null,
  setAttribute(k, v) { this.attrs[k] = v; },
};
const btnAnswersEl = {
  id: 'btnAnswers',
  textContent: '👁 เฉลยครู',
  onclick: null,
  insertAdjacentHTML() {},
};
let printA4Called = false;
const topicCtx = {
  window: {
    WORKSHEET_CONFIG: {
      icon: '🧪',
      title: 'Test Topic',
      subject: 'วิทยาศาสตร์',
      gradeLabel: 'ป.4',
      mediaLabel: 'สื่อทดสอบ',
      sourceMediaUrl: '/games/science/water-cycle-media.html',
      indicators: ['ว 1.1'],
      directions: 'ทดสอบ',
      getItems: () => [{ prompt: 'ข้อ 1', answer: 'คำตอบ' }],
      renderQuestion: () => '<div class="teacher-answer">คำตอบ</div>',
    },
    KampaiWorksheet: {
      printA4() { printA4Called = true; },
    },
    location: { origin: 'http://localhost:5173' },
    addEventListener() {},
  },
  document: {
    readyState: 'complete',
    body: { classList: { toggle() {} } },
    getElementById(id) {
      if (id === 'btnPrint') return btnPrintEl;
      if (id === 'btnAnswers') return btnAnswersEl;
      if (id === 'pages') return { innerHTML: '' };
      return null;
    },
    querySelectorAll() { return []; },
    addEventListener() {},
  },
  URL,
  console,
  Date,
  Math,
};
topicCtx.window.window = topicCtx.window;
vm.runInNewContext(topicJsCode, topicCtx);

assert.ok(topicCtx.window.KampaiTopicWorksheet, 'KampaiTopicWorksheet must be exposed');
assert.equal(btnPrintEl.id, 'btnPrint', '#btnPrint ID must remain intact');
assert.ok(btnPrintEl.textContent.includes('บันทึกเป็น PDF'), '#btnPrint must advertise Save as PDF / Print A4');
assert.ok(btnPrintEl.title.includes('Save as PDF') || btnPrintEl.title.includes('PDF'), '#btnPrint must have PDF tooltip/hint');
assert.equal(typeof btnPrintEl.onclick, 'function', '#btnPrint must have print handler');
btnPrintEl.onclick();
assert.equal(printA4Called, true, '#btnPrint must invoke KampaiWorksheet.printA4()');

// 6. Verify openConceptGrid100Preview opens preview window & registers reroll handler
let writtenHtml = '';
const mockPreviewWin = {
  document: {
    open() {},
    write(html) { writtenHtml = html; },
    close() {},
  },
};
ctx.window.open = () => mockPreviewWin;
const opened = tools.openConceptGrid100Preview(englishItems, {
  title: 'English Preview',
  subject: 'ภาษาอังกฤษ',
  preset: '5x20-portrait',
  includeTeacherKey: true,
});
assert.equal(opened, mockPreviewWin, 'openConceptGrid100Preview must return opened window');
assert.ok(writtenHtml.includes('English Preview'), 'preview window must receive rendered HTML');
assert.equal(typeof mockPreviewWin.__rerollConceptGrid, 'function', 'preview window must expose __rerollConceptGrid');
const firstHtml = writtenHtml;
mockPreviewWin.__rerollConceptGrid();
assert.ok(writtenHtml.includes('English Preview'), 'reroll must re-render preview HTML');
assert.notEqual(writtenHtml, firstHtml, 'reroll with 105 items must produce a reshuffled order');

console.log('✅ All shared worksheet shell tests passed!');
