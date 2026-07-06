#!/usr/bin/env node
/**
 * Clone thai-grammar-hub → punctuation / sentence / reading hubs + patch metadata
 * Usage: node scripts/setup-thai-hub-batch.mjs
 */
import { cpSync, existsSync, readFileSync, writeFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC = join(ROOT, 'public/games/thai/thai-grammar-hub');

const HUBS = [
  {
    slug: 'thai-punctuation-hub',
    prefix: 'tph',
    title: 'คลังวรรคตอนไทย ป.4-5',
    sub: 'จุด · จุลภาค · คำถาม · อัศเจรีย์ · วงเล็บ · คำพูด · ขีด · ลาก',
    pageTitle: '📍 คลังวรรคตอนไทย ป.4-5 — เครื่องหมายวรรคตอน',
    classLabel: 'ทายเครื่องหมาย',
    classBtn: 'm-class',
    seed: 'seed-thai-punctuation-data.mjs',
    buildName: 'punctuation',
    grammarLink: '/games/thai/thai-grammar-hub/index.html',
    extraModes: '',
  },
  {
    slug: 'thai-sentence-hub',
    prefix: 'tsh',
    title: 'คลังประโยคไทย ป.4-5',
    sub: 'ประธาน · กริยา · กรรม · ส่วนขยาย · ประโยคคู่ · ประเด็น · คำย่อย',
    pageTitle: '🧩 คลังประโยคไทย ป.4-5 — โครงสร้างประโยค',
    classLabel: 'ทายส่วนประโยค',
    classBtn: 'm-class',
    seed: 'seed-thai-sentence-data.mjs',
    buildName: 'sentence',
    grammarLink: '/games/thai/thai-grammar-hub/index.html',
    extraModes: '',
  },
  {
    slug: 'thai-reading-hub',
    prefix: 'trh',
    title: 'คลังอ่านจับใจความ ป.4-5',
    sub: 'เรื่องสั้น · ข่าวเด็ก · วิทย์ง่าย · จับใจความ',
    pageTitle: '📚 คลังอ่านจับใจความ ป.4-5',
    classLabel: 'อ่านแล้วตอบ',
    classBtn: 'm-reading',
    seed: 'seed-thai-reading-data.mjs',
    buildName: 'reading',
    grammarLink: '/games/thai/thai-grammar-hub/index.html',
    extraModes: 'reading',
  },
];

function buildDataJs(hubPath, buildScript) {
  const hubDir = join(ROOT, 'public/games/thai', hubPath.split('/').pop());
  const DATA_DIR = join(hubDir, 'data');
  const categories = JSON.parse(readFileSync(join(DATA_DIR, 'categories.json'), 'utf8'));
  const words = {};
  for (const cat of categories) {
    words[cat.slug] = JSON.parse(readFileSync(join(DATA_DIR, 'items', `${cat.slug}.json`), 'utf8'));
  }
  const header = `/* data.js — AUTO-GENERATED — DO NOT EDIT BY HAND */\n`;
  writeFileSync(join(hubDir, 'data.js'), header + `window.GAME_DATA = ${JSON.stringify({ categories, words }, null, 2)};\n`, 'utf8');
  const total = Object.values(words).reduce((s, a) => s + a.length, 0);
  console.log(`  built data.js — ${total} items`);
}

function patchHub(h) {
  const dir = join(ROOT, 'public/games/thai', h.slug);
  if (!existsSync(SRC)) throw new Error('source grammar hub missing');

  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  cpSync(SRC, dir, { recursive: true });

  // remove old grammar data items — seed will recreate
  rmSync(join(dir, 'data'), { recursive: true, force: true });

  execSync(`node scripts/${h.seed}`, { cwd: ROOT, stdio: 'inherit' });
  buildDataJs(h.slug, h.buildName);

  // config.js
  writeFileSync(join(dir, 'config.js'), `/* config.js — ${h.title} */
window.GAME_CONFIG = {
  SLUG: '${h.slug}',
  BGM: 'cheerful',
  LIVES: 5,
  BASE_SCORE: 10,
  STAR_THRESHOLDS: [50, 100, 150],
  ENABLE_ONLINE: false,
};
`, 'utf8');

  // index.html patches
  let html = readFileSync(join(dir, 'index.html'), 'utf8');
  html = html
    .replace(/Thai Grammar Hub/g, h.title)
    .replace(/คลังไวยากรณ์ไทย ป\.4-5/g, h.title)
    .replace(/นาม · กริยา · คุณศัพท์ · กริยาวิเศษณ์ · บุพบท · สันธาน · คำอุทาน · คำบ่งชี้/g, h.sub)
    .replace(/📐 คลังไวยากรณ์ไทย ป\.4-5 — ชนิดและหน้าที่ของคำ/g, h.pageTitle)
    .replace(/thai-grammar-hub/g, h.slug)
    .replace(/tgh-/g, `${h.prefix}-`)
    .replace(/href="\/play\/thai-vocab-hub"/g, `href="/games/thai/thai-grammar-hub/index.html"`)
    .replace(/📚 คลังคำศัพท์/g, '📐 คลังไวยากรณ์')
    .replace(/ทายชนิดคำ/g, h.classLabel)
    .replace(/id="m-class" onclick="switchMode\('class'\)"/g, `id="${h.classBtn}" onclick="switchMode('${h.extraModes === 'reading' ? 'reading' : 'class'}')"`);

  if (h.extraModes === 'reading') {
    const readingPanel = `
        <!-- 6. Reading comprehension -->
        <div id="reading-mode" class="mode-panel" style="display:none">
            <div class="reading-wrap">
                <h3 id="reading-title" class="reading-title"></h3>
                <div id="reading-passage" class="reading-passage"></div>
                <div id="reading-question-text" class="choice-q"></div>
                <div id="reading-options" class="options-grid"></div>
            </div>
        </div>
`;
    html = html.replace('<!-- 5. Listen (ฟังเสียงทายคำ) -->', readingPanel + '\n        <!-- 5. Listen (ฟังเสียงทายคำ) -->');
    html = html.replace(
      `<button class="cbtn mbtn" id="m-dictation"`,
      `<button class="cbtn mbtn" id="m-reading" onclick="switchMode('reading')">📖 อ่านแล้วตอบ</button>\n            <button class="cbtn mbtn" id="m-dictation"`,
    );
    html = html.replace(
      `<button class="cbtn mbtn" id="m-class" onclick="switchMode('class')">🎯 ${h.classLabel}</button>`,
      '',
    );
  }

  writeFileSync(join(dir, 'index.html'), html, 'utf8');

  // game.js patches
  let js = readFileSync(join(dir, 'game.js'), 'utf8');
  js = js
    .replace(/คลังไวยากรณ์ไทย ป\.4-5: ชนิดและหน้าที่ของคำ/g, `${h.title}`)
    .replace(/thai-grammar-hub/g, h.slug)
    .replace(/tgh_/g, `${h.prefix}_`)
    .replace(/ทายชนิดคำ/g, h.classLabel);

  if (h.slug === 'thai-punctuation-hub') {
    js = js.replace(
      `function loadClassQuizWord() {
  isAnswered = false;
  currentQuizAnswer = '';
  if (currentWordIndex >= quizList.length || currentLives <= 0) {
    endGame();
    return;
  }

  const wordItem = quizList[currentWordIndex];
  const pool = getQuizWords();
  const target = wordItem.highlight || wordItem.word;
  const questionText = wordItem.sentence
    ? \`ในประโยค "\${wordItem.sentence}" คำ "\${target}" เป็นชนิดใด?\`
    : \`คำ "\${target}" เป็นชนิดใด?\`;
  currentQuizAnswer = wordItem.pos_label || wordItem.reading;
  const allLabels = [...new Set(pool.map((w) => w.pos_label).filter(Boolean))];
  const decoys = shuffle(allLabels.filter((l) => l !== currentQuizAnswer)).slice(0, 3);
  const options = shuffle([currentQuizAnswer, ...decoys]);`,
      `function loadClassQuizWord() {
  isAnswered = false;
  currentQuizAnswer = '';
  if (currentWordIndex >= quizList.length || currentLives <= 0) {
    endGame();
    return;
  }

  const wordItem = quizList[currentWordIndex];
  const pool = getQuizWords();
  const target = wordItem.highlight || wordItem.mark || wordItem.word;
  let questionText;
  let options;
  if (wordItem.mark && wordItem.sentence && wordItem.sentence.includes('___')) {
    questionText = \`เติมเครื่องหมายที่ถูก: "\${wordItem.sentence}"\`;
    currentQuizAnswer = wordItem.mark;
    const allMarks = [...new Set(pool.map((w) => w.mark).filter(Boolean))];
    const decoys = shuffle(allMarks.filter((m) => m !== currentQuizAnswer)).slice(0, 3);
    options = shuffle([currentQuizAnswer, ...decoys]);
  } else {
    questionText = wordItem.sentence
      ? \`ในประโยค "\${wordItem.sentence}" ใช้เครื่องหมายใด?\`
      : \`เครื่องหมาย "\${target}" ใช้เมื่อใด?\`;
    currentQuizAnswer = wordItem.mark || wordItem.pos_label || wordItem.reading;
    const allLabels = [...new Set(pool.map((w) => w.mark || w.pos_label).filter(Boolean))];
    const decoys = shuffle(allLabels.filter((l) => l !== currentQuizAnswer)).slice(0, 3);
    options = shuffle([currentQuizAnswer, ...decoys]);
  }`,
    );
  }

  if (h.slug === 'thai-sentence-hub') {
    js = js.replace(
      `? \`ในประโยค "\${wordItem.sentence}" คำ "\${target}" เป็นชนิดใด?\``,
      `? \`ในประโยค "\${wordItem.sentence}" คำ "\${target}" เป็นส่วนใดของประโยค?\``,
    );
    js = js.replace(
      `: \`คำ "\${target}" เป็นชนิดใด?\`;`,
      `: \`คำ "\${target}" เป็นส่วนใดของประโยค?\`;`,
    );
  }

  if (h.slug === 'thai-reading-hub') {
    js += `

// ═══ MODE: READING COMPREHENSION ═══
let readingQIndex = 0;

function loadReadingItem() {
  isAnswered = false;
  if (currentWordIndex >= quizList.length || currentLives <= 0) {
    endGame();
    return;
  }
  const item = quizList[currentWordIndex];
  const qs = item.questions || [];
  if (!qs.length) {
    currentWordIndex++;
    loadReadingItem();
    return;
  }
  readingQIndex = readingQIndex % qs.length;
  const q = qs[readingQIndex];
  document.getElementById('reading-title').textContent = item.word + ' · ' + (item.reading || '');
  document.getElementById('reading-passage').textContent = item.passage || item.sentence || '';
  document.getElementById('reading-question-text').textContent = q.q;
  document.getElementById('wfront-word').textContent = item.word;
  document.getElementById('wfront-cat').textContent = 'อ่านแล้วตอบ';
  document.getElementById('tcard').classList.remove('flipped');
  const container = document.getElementById('reading-options');
  container.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.onclick = () => selectReadingAnswer(i, q.answer, btn, item, q);
    container.appendChild(btn);
  });
  const pct = (currentWordIndex / quizList.length) * 100;
  document.getElementById('bar').style.width = pct + '%';
}

function selectReadingAnswer(selected, correctIdx, clickedBtn, item, q) {
  if (isAnswered) return;
  isAnswered = true;
  const btns = document.querySelectorAll('#reading-options .option-btn');
  btns.forEach((btn) => { btn.disabled = true; });
  const correctText = q.options[correctIdx];
  if (selected === correctIdx) {
    clickedBtn.classList.add('correct');
    currentScore += CONFIG.BASE_SCORE;
    recordAnswer(item, true);
    showToast('ถูกต้อง! 🎉', 'correct');
    KAMPAI.sound.correct();
  } else {
    clickedBtn.classList.add('wrong');
    btns.forEach((btn) => { if (btn.textContent === correctText) btn.classList.add('correct'); });
    currentLives--;
    recordAnswer(item, false);
    showToast(q.explain || 'ยังไม่ถูกนะ 😢', 'wrong');
    KAMPAI.sound.wrong();
  }
  document.getElementById('wback-meaning').textContent = q.explain || correctText;
  document.getElementById('tcard').classList.add('flipped');
  setTimeout(() => {
    if (currentLives <= 0) endGame();
    else {
      readingQIndex++;
      const item = quizList[currentWordIndex];
      if (readingQIndex >= (item.questions || []).length) {
        currentWordIndex++;
        readingQIndex = 0;
      }
      loadReadingItem();
    }
  }, 2800);
  updateHUD();
}
`;
    // wire switchMode for reading
    js = js.replace(
      "case 'class':",
      "case 'reading':\n      document.getElementById('reading-mode').style.display = 'block';\n      document.getElementById('words-grid').style.display = 'none';\n      document.getElementById('word-area').style.display = 'none';\n      document.getElementById('flash-controls').style.display = 'none';\n      document.getElementById('autoplay-controls').style.display = 'none';\n      document.getElementById('score-display').style.display = 'flex';\n      resetSession();\n      currentWordIndex = 0;\n      readingQIndex = 0;\n      quizList = shuffle([...categoryWords]);\n      currentLives = CONFIG.LIVES || 5;\n      loadReadingItem();\n      break;\n    case 'class':",
    );
    js = js.replace(
      "document.getElementById('listen-mode').style.display = 'none';",
      "document.getElementById('listen-mode').style.display = 'none';\n    document.getElementById('reading-mode').style.display = 'none';",
    );
  }

  writeFileSync(join(dir, 'game.js'), js, 'utf8');

  // style.css — reading passage
  if (h.slug === 'thai-reading-hub') {
    let css = readFileSync(join(dir, 'style.css'), 'utf8');
    if (!css.includes('.reading-passage')) {
      css += `
.reading-wrap { max-width: 720px; margin: 0 auto; padding: 8px; }
.reading-title { font-size: 1.1rem; font-weight: 800; margin-bottom: 8px; color: var(--foreground, #1e293b); }
.reading-passage { font-size: 1.05rem; line-height: 1.65; padding: 14px; border-radius: 12px; border: 2px solid var(--border, #e2e8f0); background: var(--card, #f8fafc); margin-bottom: 14px; white-space: pre-wrap; }
`;
      writeFileSync(join(dir, 'style.css'), css, 'utf8');
    }
  }

  // copy cover from grammar as placeholder
  try {
    cpSync(join(SRC, 'cover.png'), join(dir, 'cover.png'));
  } catch (_) { /* optional */ }

  console.log(`✅ ${h.slug} ready`);
}

for (const h of HUBS) {
  console.log(`\n— ${h.slug}`);
  patchHub(h);
}

console.log('\n🎉 All 3 hubs set up');
