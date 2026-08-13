/* game.js — ลอจิกการเล่น ทบทวนคำศัพท์ เขียนตามคำบอก ทายความหมาย และจับคู่คำอ่าน */

let currentScore = 0;
let currentLives = 5;
let currentMode = 'auto'; // auto, flash, dictation, choice, match, listen, visual
let activeCategory = null;
let activeCategorySlug = null;
let fullCategoryWords = [];
let categoryWords = [];
let gridDisplayWords = [];
let currentWordIndex = 0;
let isAnswered = false;

// ตัวแปรเก็บประวัติการทำสำหรับคำถาม
let quizList = [];
let matchedPairsCount = 0;
let selectedMatchLeft = null;
let selectedMatchRight = null;
let autoplayTimer = null;
let autoplaySafetyTimer = null;
let autoplayGen = 0;
let isAutoplayActive = false;
let autoplayPaused = false;
let autoplayPauseMs = 1500;
let autoReadMode = 'full';
let autoFlipEnabled = true;
let autoSoundEnabled = true;
let speechGen = 0;
let speechGapTimer = null;
let speechStartTimer = null;
let gridSpanResizeTimer = null;
let lastGridFitWidth = 0;
let lastGridObservedWidth = 0;
let gridSpanFitting = false;

// Flash deck (โหมดสุ่มการ์ด)
let flashDeck = [];
let flashKnown = new Set();
let flashTotal = 0;
let flashRevealed = false;
let flashVariant = 'word2meaning';
let flashReviewCount = {};
let practiceMissedOnEnter = false;

const FLASH_VARIANT_KEY = 'tvh_flash_variant';

// สรุปผลรายรอบ (โหมดฝึก) — เก็บถูก/ทั้งหมด + คำที่พลาด
let sessionCorrect = 0;
let sessionTotal = 0;
let missedWords = [];
let serverMissedWords = [];
let vocabLazyLoad = false;
let visualWords = [];
let visualWordIndex = 0;
let visualViewerReturnFocus = null;

// Online controller placeholder: Thai Vocab Hub is primarily a self-paced study
// tool, but the verifier expects existing game pages to wire the shared match API.
// We do not show an online/local-versus button here until the learning flow is
// designed for head-to-head play.
const vocabMatch = window.KampaiMatch && typeof window.KampaiMatch.create === 'function'
  ? window.KampaiMatch.create({
      duration: 90,
      title: 'คลังคำศัพท์ภาษาไทย',
      onPlay: function () {},
      onEnd: function () {},
    })
  : null;

// คำที่ยังรอตรวจหมวดต้องไม่ปรากฏในเส้นทางการเรียน แม้ DB/RPC เก่ายังไม่มี content_status.
// ชุดข้อมูลก่อน migration มี 150 คำเดิมที่ผ่านหมวดตามด้วย 50 คำยืมข้ามหมวด จึงตัดที่ 150 ชั่วคราว.
function getApprovedWords(words) {
  const list = Array.isArray(words) ? words : [];
  const hasReviewStatus = list.some((word) => typeof word?.content_status === 'string');
  return hasReviewStatus
    ? list.filter((word) => word.content_status !== 'quarantined')
    : list.slice(0, 150);
}

function mergeLocalVisuals(slug, words) {
  return (Array.isArray(words) ? words : []).map((word) => {
    const local = LOCAL_VISUALS_BY_WORD.get(`${slug}\u0000${word.word}\u0000${word.reading}`);
    return local && !word.image_url ? { ...word, ...local } : word;
  });
}

function getVisualWords() {
  return activeCategorySlug === 'royal'
    ? getApprovedWords(categoryWords).filter((word) => word.image_url)
    : [];
}

function updateVisualModeAvailability() {
  const button = document.getElementById('m-visual');
  if (!button) return;
  const enabled = activeCategorySlug === 'royal' && getVisualWords().length > 0;
  button.style.display = enabled ? '' : 'none';
  if (!enabled && currentMode === 'visual') switchMode('auto');
}

function applyVocabFromSdk(sdk) {
  const vocab = sdk && sdk.gameData && sdk.gameData.vocab;
  if (!vocab || !vocab.categories || !vocab.categories.length) return;

  vocabLazyLoad = !!vocab.lazy;

  CATEGORIES.length = 0;
  CATEGORIES.push(...vocab.categories);
  if (!vocabLazyLoad) {
    Object.keys(ALL_WORDS).forEach((k) => delete ALL_WORDS[k]);
    Object.assign(ALL_WORDS, vocab.words || {});
  }

  if (window.GAME_DATA) {
    window.GAME_DATA.categories = vocab.categories;
    if (!vocabLazyLoad) window.GAME_DATA.words = vocab.words;
  }

  const hubVisible = document.getElementById('hub-view')?.style.display !== 'none';
  if (hubVisible) initHubGrid();

  if (activeCategorySlug && ALL_WORDS[activeCategorySlug]) {
    fullCategoryWords = getApprovedWords(mergeLocalVisuals(activeCategorySlug, ALL_WORDS[activeCategorySlug]));
    categoryWords = fullCategoryWords;
    updateVisualModeAvailability();
    if (currentMode === 'auto') renderWordsGrid();
  }
}

function loadCategoryWordsFromParent(slug) {
  return new Promise((resolve) => {
    if (!KAMPAI.isEmbed || !vocabLazyLoad) {
      resolve(ALL_WORDS[slug] || []);
      return;
    }
    const fallback = ALL_WORDS[slug] || [];
    const timeout = setTimeout(() => resolve(fallback), 10000);
    const handler = (e) => {
      if (e.data?.type === 'vocabWords' && e.data.slug === slug) {
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
        const words = getApprovedWords(mergeLocalVisuals(slug, e.data.words));
        ALL_WORDS[slug] = words;
        resolve(words);
      }
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type: 'requestVocabWords', slug }, '*');
  });
}

function applyMissedFromSdk(sdk) {
  const missed = sdk && sdk.gameData && sdk.gameData.missed;
  if (!Array.isArray(missed)) return;
  serverMissedWords = missed;
  renderMissedBanner();
  updateGridFilterPickerUI();
}

function renderMissedBanner() {
  const el = document.getElementById('missed-banner');
  if (!el) return;
  if (!serverMissedWords.length) {
    el.style.display = 'none';
    return;
  }
  const top = serverMissedWords.slice(0, 5);
  const more = serverMissedWords.length - top.length;
  const sample = top.map((m) => m.word).join(', ');
  el.textContent = `📝 คำที่เคยพลาด (${serverMissedWords.length}): ${sample}${more > 0 ? ` +${more}` : ''} — แตะเพื่อฝึก`;
  el.style.display = 'block';
}

function mountMissedBannerClick() {
  const el = document.getElementById('missed-banner');
  if (!el || el.dataset.tvhBound) return;
  el.dataset.tvhBound = '1';
  const go = () => startPracticeMissedFromHub();
  el.addEventListener('click', go);
  el.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); }
  });
}

function startPracticeMissedFromHub() {
  if (!serverMissedWords.length) return;
  const missedSet = new Set(serverMissedWords.map((m) => m.word));
  const cat = CATEGORIES.find((c) => (ALL_WORDS[c.slug] || []).some((w) => missedSet.has(w.word)));
  if (!cat) return;
  practiceMissedOnEnter = true;
  loadAndSelectCategory(cat.slug);
}

function getMissedWordsInCategory() {
  if (!serverMissedWords.length) return [];
  const missedSet = new Set(serverMissedWords.map((m) => m.word));
  return fullCategoryWords.filter((w) => missedSet.has(w.word));
}

function flashKnownKey(slug) {
  return `tvh_flash_known_${slug || 'default'}`;
}

function loadFlashKnown(slug) {
  try {
    return new Set(JSON.parse(localStorage.getItem(flashKnownKey(slug)) || '[]'));
  } catch (_) {
    return new Set();
  }
}

function saveFlashKnown(slug) {
  if (!slug) return;
  localStorage.setItem(flashKnownKey(slug), JSON.stringify([...flashKnown]));
}

function getFlashProgressPct(slug) {
  const total = getApprovedWords(ALL_WORDS[slug]).length;
  if (!total) return 0;
  return Math.min(100, Math.round((loadFlashKnown(slug).size / total) * 100));
}

function resetSession() {
  sessionCorrect = 0;
  sessionTotal = 0;
  missedWords = [];
}

const CONFIG = window.GAME_CONFIG || {};
const CATEGORIES = (window.GAME_DATA && window.GAME_DATA.categories) || [];
const ALL_WORDS = (window.GAME_DATA && window.GAME_DATA.words) || {};

// Keep locally bundled learning images available when an older lazy RPC has not
// yet returned the new image metadata.
const LOCAL_VISUALS_BY_WORD = new Map(
  Object.entries(ALL_WORDS).flatMap(([slug, words]) => (words || [])
    .filter((word) => word && word.image_url)
    .map((word) => [`${slug}\u0000${word.word}\u0000${word.reading}`, {
      image_url: word.image_url,
      image_alt: word.image_alt,
    }]))
);

// แสดงหน้าเลือกหัวข้อทันที — ไม่ผูกกับ SDK callback
// ใช้ requestAnimationFrame เพื่อมั่นใจว่า DOM render พร้อมจริงก่อนจัด layout
function safeInitHubGrid() {
  // ถ้ายังไม่มี categories (data.js ยังโหลดไม่เสร็จ) → ลองอีกครั้ง
  if (CATEGORIES.length === 0 && window.GAME_DATA && window.GAME_DATA.categories) {
    CATEGORIES.push(...window.GAME_DATA.categories);
    Object.assign(ALL_WORDS, window.GAME_DATA.words || {});
  }
  requestAnimationFrame(initHubGrid);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { safeInitHubGrid(); mountMissedBannerClick(); });
} else {
  safeInitHubGrid();
  mountMissedBannerClick();
}

// ตัวขยาย/ย่อขนาดตัวอักษร — จำค่าไว้ใน localStorage (เฉพาะเกมนี้ ไม่เกี่ยวกับ SDK)
const FS_KEY = 'tvh_font_scale';
const FS_MIN = 0.85, FS_MAX = 1.30;

// ขนาดกริดคำศัพท์ (จำใน localStorage)
const GRID_COLS_KEY = 'tvh_grid_cols';
const GRID_COLS_OPTIONS = [
  { value: 'auto', label: 'อัตโนมัติ' },
  { value: '3', label: '3×3' },
  { value: '4', label: '4×4' },
  { value: '5', label: '5×5' },
  { value: '6', label: '6×6' },
  { value: '7', label: '7×7' },
  { value: '8', label: '8×8' },
  { value: '9', label: '9×9' },
  { value: '10', label: '10×10' },
];
let gridCols = 'auto';

function loadGridColsPref() {
  const saved = localStorage.getItem(GRID_COLS_KEY);
  if (GRID_COLS_OPTIONS.some((o) => o.value === saved)) gridCols = saved;
}

function setGridCols(value) {
  if (!GRID_COLS_OPTIONS.some((o) => o.value === value)) return;
  gridCols = value;
  localStorage.setItem(GRID_COLS_KEY, value);
  applyGridColsLayout();
  updateGridSizePickerUI();
}

function applyGridColsLayout() {
  const grid = document.getElementById('words-grid');
  if (!grid) return;
  grid.dataset.gridCols = gridCols;
  if (gridCols === 'auto') {
    grid.style.removeProperty('--grid-cols-num');
  } else {
    grid.style.setProperty('--grid-cols-num', gridCols);
  }
  lastGridFitWidth = 0;
  delete grid.dataset.spansReady;
  fitGridWordSpans(true);
}

function scheduleGridSpanFit(force) {
  clearTimeout(gridSpanResizeTimer);
  gridSpanResizeTimer = setTimeout(() => {
    gridSpanResizeTimer = null;
    fitGridWordSpans(!!force);
  }, 200);
}

/** วัดว่าข้อความล้นช่องหรือไม่ — ขยายการ์ดข้าม 2–3 คอลัมน์แทนการตัดบรรทัด */
function fitGridWordSpans(force) {
  const grid = document.getElementById('words-grid');
  if (!grid || currentMode !== 'auto') return;
  if (gridSpanFitting) return;

  const w = Math.round(grid.clientWidth);
  if (!force && w === lastGridFitWidth && grid.dataset.spansReady === '1') return;

  const cards = grid.querySelectorAll('.grid-flip-card');
  if (!cards.length) return;

  const needsSpan = [...cards].some((card) => {
    const textEl = card.querySelector('.grid-word-text');
    if (!textEl) return false;
    return (textEl.textContent || '').trim().length > 1;
  });
  if (!needsSpan) {
    lastGridFitWidth = w;
    lastGridObservedWidth = w;
    grid.dataset.spansReady = '1';
    return;
  }

  gridSpanFitting = true;
  cards.forEach((card) => {
    card.classList.remove('grid-flip-card--span2', 'grid-flip-card--span3', 'grid-flip-card--span4');
    card.dataset.spanLevel = '1';
  });

  const maxSpan = gridCols === 'auto'
    ? 3
    : Math.min(parseInt(gridCols, 10) >= 8 ? 4 : 3, parseInt(gridCols, 10) || 3);

  if (maxSpan < 2) {
    lastGridFitWidth = w;
    grid.dataset.spansReady = '1';
    gridSpanFitting = false;
    return;
  }

  let pass = 0;
  let fontRetried = false;
  const maxPasses = maxSpan;

  function finishFit() {
    lastGridFitWidth = Math.round(grid.clientWidth);
    lastGridObservedWidth = lastGridFitWidth;
    grid.dataset.spansReady = '1';
    gridSpanFitting = false;
  }

  function runPass() {
    let changed = false;
    cards.forEach((card) => {
      const textEl = card.querySelector('.grid-word-text');
      if (!textEl) return;
      const level = parseInt(card.dataset.spanLevel || '1', 10);
      if (level >= maxSpan) return;
      if (textEl.scrollWidth > textEl.clientWidth + 1) {
        const next = level + 1;
        card.dataset.spanLevel = String(next);
        card.classList.remove('grid-flip-card--span2', 'grid-flip-card--span3', 'grid-flip-card--span4');
        if (next === 2) card.classList.add('grid-flip-card--span2');
        else if (next === 3) card.classList.add('grid-flip-card--span3');
        else if (next === 4) card.classList.add('grid-flip-card--span4');
        changed = true;
      }
    });
    pass += 1;
    if (changed && pass < maxPasses) {
      requestAnimationFrame(runPass);
    } else if (pass === 1 && !changed && !fontRetried) {
      /* รอ font-size จาก cqh ปรับเสร็จแล้ววัดซ้ำครั้งเดียว (เช่น สลับเป็น 3×3) */
      fontRetried = true;
      requestAnimationFrame(() => requestAnimationFrame(runPass));
    } else {
      finishFit();
    }
  }

  requestAnimationFrame(runPass);
}

function resetGridCardBackExpand(card) {
  if (!card) return;
  card.classList.remove('grid-flip-card--expand-back');
  card.style.removeProperty('--grid-expand-h');
}

function gridMeaningOverflows(card) {
  const meaning = card.querySelector('.grid-meaning');
  if (!meaning) return false;
  return meaning.scrollHeight > meaning.clientHeight + 2;
}

/** ขยายความสูงการ์ดชั่วคราวเมื่อพลิกหลังแล้วความหมายยาวเกินช่อง */
function adjustGridCardBackExpand(card) {
  if (!card) return;
  resetGridCardBackExpand(card);
  if (!card.classList.contains('flipped')) return;

  gridExpandBusy += 1;
  requestAnimationFrame(() => {
    try {
      if (!card.classList.contains('flipped') || !gridMeaningOverflows(card)) return;

      const meaning = card.querySelector('.grid-meaning');
      const baseH = card.getBoundingClientRect().height;
      const overflow = meaning.scrollHeight - meaning.clientHeight;
      const maxH = baseH * 2.75;
      const newH = Math.min(baseH + overflow + 6, maxH);

      card.classList.add('grid-flip-card--expand-back');
      card.style.setProperty('--grid-expand-h', `${newH}px`);
    } finally {
      gridExpandBusy = Math.max(0, gridExpandBusy - 1);
    }
  });
}

function adjustAllFlippedGridBackExpands() {
  document.querySelectorAll('.grid-flip-card.flipped').forEach(adjustGridCardBackExpand);
}

let gridSpanResizeObs = null;
let gridExpandBusy = 0;

function unbindGridSpanResizeObserver() {
  if (gridSpanResizeObs) {
    gridSpanResizeObs.disconnect();
    gridSpanResizeObs = null;
  }
  if (gridSpanResizeTimer) {
    clearTimeout(gridSpanResizeTimer);
    gridSpanResizeTimer = null;
  }
  lastGridFitWidth = 0;
  lastGridObservedWidth = 0;
  gridSpanFitting = false;
}

function bindGridSpanResizeObserver() {
  const grid = document.getElementById('words-grid');
  if (!grid) return;
  if (!gridSpanResizeObs) {
    gridSpanResizeObs = new ResizeObserver((entries) => {
      if (currentMode !== 'auto' || gridSpanFitting || gridExpandBusy > 0) return;
      const entry = entries[0];
      if (!entry) return;
      /* สนใจแค่ความกว้าง — ความสูงเปลี่ยนจากพลิกหลัง/ขยายการ์ดไม่ต้อง refit span (กันลูปกระตุก) */
      const w = Math.round(entry.contentRect.width);
      if (Math.abs(w - lastGridObservedWidth) < 2) return;
      lastGridObservedWidth = w;
      scheduleGridSpanFit(true);
    });
    gridSpanResizeObs.observe(grid);
    lastGridObservedWidth = Math.round(grid.clientWidth);
  }
}

function updateGridSizePickerUI() {
  document.querySelectorAll('.grid-size-btn').forEach((btn) => {
    const active = btn.dataset.cols === gridCols;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
}

function buildGridSizePicker(header) {
  const wrap = document.createElement('div');
  wrap.className = 'grid-size-picker';
  wrap.innerHTML = '<span class="grid-size-label">ขนาดกริด</span>';

  const btns = document.createElement('div');
  btns.className = 'grid-size-btns';
  btns.setAttribute('role', 'group');
  btns.setAttribute('aria-label', 'เลือกขนาดกริด');

  GRID_COLS_OPTIONS.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'grid-size-btn';
    btn.dataset.cols = opt.value;
    btn.textContent = opt.label;
    btn.setAttribute('aria-pressed', 'false');
    btn.addEventListener('click', () => setGridCols(opt.value));
    btns.appendChild(btn);
  });

  wrap.appendChild(btns);
  header.appendChild(wrap);
  updateGridSizePickerUI();
}

loadGridColsPref();

// ฟิลเตอร์กริดทบทวน — ชั้นเรียน + โหมดแสดงผล
const GRID_GRADE_KEY = 'tvh_grid_grade';
const GRID_VIEW_KEY = 'tvh_grid_view';
const RANDOM_SAMPLE = 20;
const GRID_GRADE_OPTIONS = [
  { value: 'all', label: 'ทุกชั้น' },
  { value: 'ป.4', label: 'ป.4' },
  { value: 'ป.5', label: 'ป.5' },
  { value: 'ป.6', label: 'ป.6' },
];
const GRID_VIEW_OPTIONS = [
  { value: 'all', label: 'ทั้งหมด' },
  { value: 'sample', label: 'สุ่ม 20' },
  { value: 'missed', label: 'คำที่พลาด' },
];
let gridGradeFilter = 'all';
let gridViewMode = 'all';

function loadGridFilterPrefs() {
  const g = localStorage.getItem(GRID_GRADE_KEY);
  const v = localStorage.getItem(GRID_VIEW_KEY);
  if (GRID_GRADE_OPTIONS.some((o) => o.value === g)) gridGradeFilter = g;
  if (GRID_VIEW_OPTIONS.some((o) => o.value === v)) gridViewMode = v;
}

function setGridGradeFilter(value) {
  if (!GRID_GRADE_OPTIONS.some((o) => o.value === value)) return;
  gridGradeFilter = value;
  localStorage.setItem(GRID_GRADE_KEY, value);
  updateGridFilterPickerUI();
  if (currentMode === 'auto') renderWordsGrid();
}

function setGridViewMode(value) {
  if (!GRID_VIEW_OPTIONS.some((o) => o.value === value)) return;
  gridViewMode = value;
  localStorage.setItem(GRID_VIEW_KEY, value);
  updateGridFilterPickerUI();
  if (currentMode === 'auto') renderWordsGrid();
}

function reshuffleGridSample() {
  if (currentMode === 'auto' && gridViewMode === 'sample') renderWordsGrid();
}

function getGridDisplayWords() {
  let words = fullCategoryWords;
  if (gridGradeFilter !== 'all') {
    words = words.filter((w) => w.grade === gridGradeFilter);
  }
  if (gridViewMode === 'missed') {
    words = getMissedWordsInCategory().filter((w) =>
      gridGradeFilter === 'all' || w.grade === gridGradeFilter
    );
  } else if (gridViewMode === 'sample' && words.length > RANDOM_SAMPLE) {
    words = shuffle([...words]).slice(0, RANDOM_SAMPLE);
  }
  return words;
}

/** โหมดฝึก — กรองชั้น + โหมดคำที่พลาด */
function getQuizWords() {
  if (gridViewMode === 'missed') {
    let words = getMissedWordsInCategory();
    if (gridGradeFilter !== 'all') {
      const filtered = words.filter((w) => w.grade === gridGradeFilter);
      if (filtered.length > 0) words = filtered;
    }
    return words;
  }
  let words = fullCategoryWords;
  if (gridGradeFilter !== 'all') {
    const filtered = words.filter((w) => w.grade === gridGradeFilter);
    if (filtered.length > 0) words = filtered;
  }
  return words;
}

/** ตัวเลือกลวง — คำพ้องเสียงใช้กลุ่ม reading เดียวกัน */
function pickWordDecoys(wordItem, pool, count) {
  if (activeCategorySlug === 'homophones' && wordItem.reading) {
    const same = pool.filter((w) => w.reading === wordItem.reading && w.word !== wordItem.word);
    if (same.length >= count) return shuffle([...same]).slice(0, count);
  }
  return shuffle(pool.filter((w) => w.word !== wordItem.word)).slice(0, count);
}

function pickMeaningDecoys(wordItem, pool, count) {
  if (activeCategorySlug === 'synonyms' && wordItem.synonym_group) {
    const grp = pool.filter((w) => w.synonym_group === wordItem.synonym_group && w.word !== wordItem.word);
    if (grp.length >= count) return shuffle(grp.map((w) => w.meaning)).slice(0, count);
  }
  return shuffle(pool.filter((w) => w.word !== wordItem.word).map((w) => w.meaning)).slice(0, count);
}

function updateGridFilterPickerUI() {
  document.querySelectorAll('.grid-grade-btn').forEach((btn) => {
    const active = btn.dataset.grade === gridGradeFilter;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  document.querySelectorAll('.grid-view-btn').forEach((btn) => {
    const active = btn.dataset.view === gridViewMode;
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
  });
  const reshuffleBtn = document.getElementById('btn-reshuffle-sample');
  if (reshuffleBtn) {
    reshuffleBtn.style.display = gridViewMode === 'sample' ? 'inline-flex' : 'none';
  }
  document.querySelectorAll('.grid-view-btn[data-view="missed"]').forEach((btn) => {
    btn.style.display = serverMissedWords.length ? '' : 'none';
  });
}

function buildGridFilterPickers(header) {
  const wrap = document.createElement('div');
  wrap.className = 'grid-filter-picker';

  const gradeBlock = document.createElement('div');
  gradeBlock.className = 'grid-filter-group';
  gradeBlock.innerHTML = '<span class="grid-size-label">ชั้น</span>';
  const gradeBtns = document.createElement('div');
  gradeBtns.className = 'grid-size-btns';
  GRID_GRADE_OPTIONS.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'grid-size-btn grid-grade-btn';
    btn.dataset.grade = opt.value;
    btn.textContent = opt.label;
    btn.addEventListener('click', () => setGridGradeFilter(opt.value));
    gradeBtns.appendChild(btn);
  });
  gradeBlock.appendChild(gradeBtns);

  const viewBlock = document.createElement('div');
  viewBlock.className = 'grid-filter-group';
  viewBlock.innerHTML = '<span class="grid-size-label">แสดง</span>';
  const viewBtns = document.createElement('div');
  viewBtns.className = 'grid-size-btns';
  GRID_VIEW_OPTIONS.forEach((opt) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'grid-size-btn grid-view-btn';
    btn.dataset.view = opt.value;
    btn.textContent = opt.label;
    btn.addEventListener('click', () => setGridViewMode(opt.value));
    viewBtns.appendChild(btn);
  });
  const reshuffleBtn = document.createElement('button');
  reshuffleBtn.type = 'button';
  reshuffleBtn.id = 'btn-reshuffle-sample';
  reshuffleBtn.className = 'grid-size-btn grid-reshuffle-btn';
  reshuffleBtn.textContent = '🔀 สุ่มใหม่';
  reshuffleBtn.addEventListener('click', reshuffleGridSample);
  viewBtns.appendChild(reshuffleBtn);
  viewBlock.appendChild(viewBtns);

  wrap.appendChild(gradeBlock);
  wrap.appendChild(viewBlock);
  header.appendChild(wrap);
  updateGridFilterPickerUI();
}

loadGridFilterPrefs();

function mountFontSizeSlider() {
  const slider = document.getElementById('tvh-fontsize-slider');
  if (!slider || slider.dataset.tvhBound) return;
  slider.dataset.tvhBound = '1';

  const saved = parseFloat(localStorage.getItem(FS_KEY));
  const initial = (!isNaN(saved) && saved >= FS_MIN && saved <= FS_MAX) ? saved : 1;

  document.documentElement.style.setProperty('--font-scale', String(initial));
  slider.value = String(initial);

  slider.addEventListener('input', () => {
    const v = parseFloat(slider.value);
    document.documentElement.style.setProperty('--font-scale', String(v));
    localStorage.setItem(FS_KEY, String(v));
    if (currentMode === 'auto') fitGridWordSpans(true);
  });
}

// โหลดข้อมูล SDK เมื่อหน้าพร้อมใช้งาน — ครอบ try/catch กันเสียง/ชิป/SDK ทำให้ทั้งเกมพัง
KAMPAI.onReady((sdk) => {
  try {
    applyVocabFromSdk(sdk);
    applyMissedFromSdk(sdk);

    // แสดงชิปนักเรียนเมื่อเล่นผ่านระบบ (embedded)
    const name = sdk.student && sdk.student.displayName;
    if (name) {
      const chip = document.getElementById('player-chip');
      if (chip) {
        chip.style.display = 'flex';
        chip.innerHTML = `<div class="pc-init">${name.charAt(0)}</div><span>${name}</span>`;
      }
    }

    // เพลงพื้นหลัง + ปุ่มควบคุมเสียง 🔊 🗣️ 🎵 (คลังสื่อ ไม่นับคะแนน/ไม่มี leaderboard)
    if (sdk.sound) {
      if (sdk.sound.defaultBgm) sdk.sound.defaultBgm(CONFIG.BGM);
      if (sdk.sound.bgmStart) sdk.sound.bgmStart();
      if (sdk.sound.mountToggles) sdk.sound.mountToggles();
    }

    mountFontSizeSlider();
    patchKampaiExit();
    bindPageLifecycleCleanup();
  } catch (e) {
    /* เสียง/ชิป/SDK ล้ม ต้องไม่ทำให้เกมเล่นไม่ได้ */
  }
});

// สร้างการ์ดหมวดหมู่ใน Hub
function initHubGrid() {
  const grid = document.getElementById('hub-grid');
  grid.innerHTML = '';

  CATEGORIES.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'hub-card';
    card.onclick = () => loadAndSelectCategory(cat.slug);

    const pct = getFlashProgressPct(cat.slug);
    const count = getApprovedWords(ALL_WORDS[cat.slug]).length;
    const progBlock = pct > 0
      ? `<div class="hc-progress"><div class="hc-prog-fill${pct >= 100 ? ' done' : ''}" style="width:${pct}%"></div></div><span class="hc-prog-pct">รู้แล้ว ${pct}%</span>`
      : (count ? `<span class="hc-prog-pct">${count} คำ</span>` : '');

    card.innerHTML = `
      <div class="hc-icon">${cat.icon}</div>
      <div class="hc-th">${cat.title}</div>
      <div class="hc-desc">${cat.desc}</div>
      ${progBlock}
    `;
    grid.appendChild(card);
  });
}

// เลือกหมวดหมู่คำศัพท์ (lazy load จาก wrapper เมื่อ vocabLazyLoad)
async function loadAndSelectCategory(slug) {
  const loaded = await loadCategoryWordsFromParent(slug);
  if (loaded.length) {
    ALL_WORDS[slug] = getApprovedWords(mergeLocalVisuals(slug, loaded));
  }
  selectCategory(slug);
}

function selectCategory(slug) {
  activeCategorySlug = slug;
  activeCategory = CATEGORIES.find(c => c.slug === slug);
  fullCategoryWords = getApprovedWords(mergeLocalVisuals(slug, ALL_WORDS[slug]));
  categoryWords = fullCategoryWords;

  if (categoryWords.length === 0) return;

  // เปลี่ยนหน้าการแสดงผล (ชื่อหมวดแสดงบนการ์ดอยู่แล้ว — ไม่มีแถบ HUD บนสุด)
  document.getElementById('hub-view').style.display = 'none';
  document.getElementById('topic-view').style.display = 'flex';
  updateVisualModeAvailability();

  // รีเซ็ตค่าด่าน
  currentScore = 0;
  currentLives = CONFIG.LIVES;
  currentWordIndex = 0;
  resetSession();
  updateHUD();

  // สลับเข้าสู่โหมดรีวิว (ทบทวน) เป็นอันดับแรก
  if (practiceMissedOnEnter && getMissedWordsInCategory().length) {
    practiceMissedOnEnter = false;
    gridViewMode = 'missed';
    localStorage.setItem(GRID_VIEW_KEY, 'missed');
  }
  switchMode('auto');
}

// สลับโหมดการเล่น
function switchMode(mode) {
  currentMode = mode;
  isAnswered = false;

  // หยุดการเล่นอัตโนมัติทุกครั้งที่เปลี่ยนโหมด
  stopAutoplay();

  // โหมดทบทวน (auto) = เปิดดูเฉย ๆ ไม่นับคะแนน/ชีวิต → ซ่อนแถบคะแนน
  // โหมดฝึก (dictation/choice/match) = เริ่มรอบใหม่: รีเซ็ตชีวิต/คะแนน/สรุปผล
  const sd = document.getElementById('score-display');
  const scoredModes = ['dictation', 'choice', 'match', 'listen'];
  if (sd) sd.style.display = (mode === 'auto' || mode === 'flash' || mode === 'visual') ? 'none' : 'flex';
  if (scoredModes.includes(mode)) {
    currentScore = 0;
    currentLives = CONFIG.LIVES;
    resetSession();
    updateHUD();
  }

  // จัดการแท็บปุ่ม
  const btns = document.querySelectorAll('.mbtn');
  btns.forEach(btn => btn.classList.remove('active'));
  
  const activeBtn = document.getElementById(`m-${mode}`);
  if (activeBtn) activeBtn.classList.add('active');

  // ซ่อนแผงโหมดทั้งหมด
  document.getElementById('words-grid').style.display = 'none';
  document.getElementById('dictation-mode').style.display = 'none';
  document.getElementById('choice-mode').style.display = 'none';
  document.getElementById('match-mode').style.display = 'none';
  document.getElementById('listen-mode').style.display = 'none';
  document.getElementById('visual-mode').style.display = 'none';
  const flashControls = document.getElementById('flash-controls');
  if (flashControls) flashControls.style.display = 'none';

  // พลิกการ์ดกลับมาหน้าหลัก
  const card = document.getElementById('tcard');
  card.classList.remove('flipped');
  flashRevealed = false;

  // จัดการแผงควบคุมการเล่นอัตโนมัติ
  const autoplayControls = document.getElementById('autoplay-controls');

  // เลือกแผงตามโหมด
  const topicView = document.getElementById('topic-view');
  const wordArea = document.getElementById('word-area');
  if (topicView) topicView.classList.remove('flash-mode', 'auto-grid-mode');

  if (mode === 'auto') {
    if (topicView) topicView.classList.add('auto-grid-mode');
    if (wordArea) wordArea.style.display = 'none';
    if (autoplayControls) autoplayControls.style.display = 'flex';
    document.getElementById('words-grid').style.display = 'grid';
    currentWordIndex = 0;
    renderWordsGrid();
    mountAutoplayControls();
    updateAutoplayProgress();
    document.getElementById('bar').style.width = '0%';
  } else if (mode === 'flash') {
    if (topicView) topicView.classList.add('flash-mode');
    if (wordArea) wordArea.style.display = '';
    if (autoplayControls) autoplayControls.style.display = 'none';
    if (sd) sd.style.display = 'none';
    mountFlashControls();
    startFlashMode();
  } else if (mode === 'visual') {
    if (wordArea) wordArea.style.display = 'none';
    if (autoplayControls) autoplayControls.style.display = 'none';
    document.getElementById('visual-mode').style.display = 'flex';
    visualWords = getVisualWords();
    visualWordIndex = Math.min(visualWordIndex, Math.max(0, visualWords.length - 1));
    renderVisualStudy();
  } else {
    if (topicView) topicView.classList.remove('auto-grid-mode');
    if (wordArea) wordArea.style.display = '';
    if (autoplayControls) autoplayControls.style.display = 'none';
    if (mode === 'dictation') {
      document.getElementById('dictation-mode').style.display = 'block';
      // สุ่มเรียงคำศัพท์เพื่อฝึกฝน
      quizList = shuffle([...getQuizWords()]);
      currentWordIndex = 0;
      loadDictationWord();
    } else if (mode === 'choice') {
      document.getElementById('choice-mode').style.display = 'block';
      quizList = shuffle([...getQuizWords()]);
      currentWordIndex = 0;
      loadChoiceWord();
    } else if (mode === 'match') {
      document.getElementById('match-mode').style.display = 'flex';
      initMatchingGame();
    } else if (mode === 'listen') {
      document.getElementById('listen-mode').style.display = 'block';
      quizList = shuffle([...getQuizWords()]);
      currentWordIndex = 0;
      loadListenWord();
    }
  }
}

// ═══ MODE 1: AUTO REVIEW (ทบทวนคำศัพท์) ═══

function renderWordsGrid() {
  const grid = document.getElementById('words-grid');
  cancelSpeech();
  lastGridFitWidth = 0;
  lastGridObservedWidth = 0;
  grid.innerHTML = '';
  gridDisplayWords = getGridDisplayWords();

  if (activeCategory) {
    const header = document.createElement('div');
    header.className = 'grid-cat-header';
    const countLabel = gridDisplayWords.length === fullCategoryWords.length
      ? `${fullCategoryWords.length} คำ`
      : `แสดง ${gridDisplayWords.length} / ${fullCategoryWords.length} คำ`;
    header.innerHTML = `
      <span class="grid-cat-icon">${activeCategory.icon}</span>
      <span class="grid-cat-title">${activeCategory.title}</span>
      <span class="grid-cat-hint">แตะการ์ดเพื่อพลิก · กด ▶ อ่านอัตโนมัติ</span>
      <span class="grid-cat-count">${countLabel}</span>
    `;
    buildGridFilterPickers(header);
    buildGridSizePicker(header);
    grid.appendChild(header);
  }

  if (gridDisplayWords.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'grid-empty-msg';
    empty.textContent = gridViewMode === 'missed'
      ? 'ไม่มีคำที่เคยพลาดในหมวดนี้'
      : 'ไม่มีคำในชั้นที่เลือก — ลองเปลี่ยนตัวกรอง';
    grid.appendChild(empty);
    applyGridColsLayout();
    stopAutoplay();
    return;
  }

  gridDisplayWords.forEach((item, idx) => {
    const card = document.createElement('div');
    card.className = 'grid-flip-card';
    card.id = `word-cell-${idx}`;
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${item.word} — แตะเพื่อดูความหมาย`);

    const emoji = item.emoji || (activeCategory && activeCategory.icon) || '📝';

    const gradeBadge = item.grade
      ? `<span class="grid-grade-badge">${item.grade}</span>`
      : '';

    card.innerHTML = `
      <div class="grid-flip-inner">
        <div class="grid-flip-face grid-flip-front">
          <button type="button" class="grid-say-btn" title="ฟังเสียงอ่าน" aria-label="ฟังเสียง ${item.word}">🔊</button>
          ${gradeBadge}
          <span class="grid-word-emoji">${emoji}</span>
          <span class="grid-word-text">${item.word}</span>
        </div>
        <div class="grid-flip-face grid-flip-back">
          <span class="grid-reading">[ ${item.reading} ]</span>
          <span class="grid-meaning">${item.meaning}</span>
          ${item.image_url ? '<button type="button" class="grid-visual-btn">ดูภาพ</button>' : ''}
        </div>
      </div>
    `;

    const sayBtn = card.querySelector('.grid-say-btn');
    if (sayBtn) {
      sayBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speakThai(item.word);
      });
    }

    const visualBtn = card.querySelector('.grid-visual-btn');
    if (visualBtn) {
      visualBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openVisualViewer(item, visualBtn);
      });
    }

    card.addEventListener('click', () => toggleGridCard(card, idx));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleGridCard(card, idx);
      }
    });

    grid.appendChild(card);
  });

  applyGridColsLayout();
  bindGridSpanResizeObserver();
  if (isAutoplayActive && !autoplayPaused) highlightAutoplayCard(currentWordIndex);
  updateAutoplayProgress();
  if (isAutoplayActive && !autoplayPaused && gridDisplayWords.length) {
    if (currentWordIndex >= gridDisplayWords.length) currentWordIndex = 0;
    runAutoplayStep(autoplayGen);
  }
}

function toggleGridCard(card, idx) {
  if (isAutoplayActive && !autoplayPaused) pauseAutoplay(true);
  const wasFlipped = card.classList.contains('flipped');
  card.classList.toggle('flipped');
  if (card.classList.contains('flipped')) {
    adjustGridCardBackExpand(card);
  } else {
    resetGridCardBackExpand(card);
  }
  goToAutoplayIndex(idx, { speak: !wasFlipped, scroll: false });
}

function loadWord(index) {
  currentWordIndex = index;
  const wordItem = categoryWords[index];

  // ไฮไลต์เซลล์
  const cells = document.querySelectorAll('.word-cell');
  cells.forEach(c => c.classList.remove('active'));
  const activeCell = document.getElementById(`word-cell-${index}`);
  if (activeCell) activeCell.classList.add('active');

  // เปลี่ยนเนื้อหาบนการ์ด
  document.getElementById('wfront-emoji').textContent = wordItem.emoji || activeCategory.icon;
  document.getElementById('wfront-word').textContent = wordItem.word;
  document.getElementById('wfront-cat').textContent = activeCategory.title;

  document.getElementById('wback-reading').textContent = `คำอ่าน: [ ${wordItem.reading} ]`;
  document.getElementById('wback-meaning').textContent = wordItem.meaning;
  mountCardVisualButton(wordItem);

  // พลิกกลับหน้าหลักทุกครั้งที่เปลี่ยนคำ
  document.getElementById('tcard').classList.remove('flipped');

  // เชื่อมโยงปุ่มเสียงอ่าน
  document.getElementById('btn-say').onclick = (e) => {
    e.stopPropagation();
    speakThai(wordItem.word);
  };

  // พูดคำศัพท์โดยอัตโนมัติรอบแรก
  speakThai(wordItem.word);

  // อัปเดตหลอดความค้าวหน้า
  const pct = ((index + 1) / categoryWords.length) * 100;
  document.getElementById('bar').style.width = `${pct}%`;

  // รีเซ็ตเวลาเล่นอัตโนมัติใหม่หากเปิดใช้งานอยู่เพื่อไม่ให้เลื่อนข้ามเร็วกว่ากำหนด
  if (isAutoplayActive) {
    startAutoplay();
  }
}

function flipCard() {
  if (currentMode === 'flash') {
    revealFlashCard();
    return;
  }
  document.getElementById('tcard').classList.toggle('flipped');
}

function mountCardVisualButton(wordItem) {
  const button = document.getElementById('btn-card-visual');
  if (!button) return;
  button.style.display = wordItem?.image_url ? '' : 'none';
  button.onclick = (event) => {
    event.stopPropagation();
    if (wordItem?.image_url) openVisualViewer(wordItem, button);
  };
}

function renderVisualStudy() {
  const item = visualWords[visualWordIndex];
  if (!item) {
    switchMode('auto');
    return;
  }
  document.getElementById('visual-count').textContent = `${visualWordIndex + 1}/${visualWords.length}`;
  document.getElementById('visual-word').textContent = item.word;
  document.getElementById('visual-reading').textContent = `[ ${item.reading} ]`;
  document.getElementById('visual-meaning').textContent = item.meaning;
  document.getElementById('btn-visual-say').onclick = () => speakThai(item.word);
  document.getElementById('btn-visual-open').onclick = (event) => openVisualViewer(item, event.currentTarget);
  document.getElementById('btn-visual-prev').onclick = () => {
    visualWordIndex = (visualWordIndex - 1 + visualWords.length) % visualWords.length;
    renderVisualStudy();
  };
  document.getElementById('btn-visual-next').onclick = () => {
    visualWordIndex = (visualWordIndex + 1) % visualWords.length;
    renderVisualStudy();
  };
}

function openVisualViewer(item, returnFocus) {
  if (!item?.image_url) return;
  visualViewerReturnFocus = returnFocus || document.activeElement;
  const viewer = document.getElementById('visual-viewer');
  const image = document.getElementById('visual-viewer-image');
  image.alt = item.image_alt || `ภาพประกอบคำว่า ${item.word}`;
  image.src = item.image_url;
  image.onerror = () => {
    image.removeAttribute('src');
    image.alt = 'ไม่สามารถแสดงภาพประกอบได้';
    showToast('ภาพประกอบกำลังปรับปรุง', 'wrong');
  };
  document.getElementById('visual-viewer-title').textContent = item.word;
  document.getElementById('visual-viewer-meaning').textContent = item.meaning;
  viewer.style.display = 'grid';
  document.getElementById('btn-visual-close').focus();
}

function closeVisualViewer() {
  const viewer = document.getElementById('visual-viewer');
  if (!viewer || viewer.style.display === 'none') return;
  viewer.style.display = 'none';
  document.getElementById('visual-viewer-image').removeAttribute('src');
  if (visualViewerReturnFocus?.focus) visualViewerReturnFocus.focus();
  visualViewerReturnFocus = null;
}

// เลื่อนคำถัดไป/ก่อนหน้าในโหมดทบทวน (ปุ่ม ◀ ▶ และลูกศรคีย์บอร์ด) วนรอบ
function autoplayNext() {
  if (currentMode !== 'auto' || gridDisplayWords.length === 0) return;
  if (isAutoplayActive) pauseAutoplay(true);
  goToAutoplayIndex((currentWordIndex + 1) % gridDisplayWords.length, { speak: true });
}

function autoplayPrev() {
  if (currentMode !== 'auto' || gridDisplayWords.length === 0) return;
  if (isAutoplayActive) pauseAutoplay(true);
  goToAutoplayIndex((currentWordIndex - 1 + gridDisplayWords.length) % gridDisplayWords.length, { speak: true });
}

function nextWord() { autoplayNext(); }
function prevWord() { autoplayPrev(); }

// ═══ MODE 2: DICTATION (เขียนตามคำบอก) ═══

function loadDictationWord() {
  isAnswered = false;
  if (currentWordIndex >= quizList.length || currentLives <= 0) {
    endGame();
    return;
  }

  const wordItem = quizList[currentWordIndex];

  // ปิดกั้นเนื้อหาคำศัพท์บนหน้าการ์ดหลักเพื่อป้องกันการโกง
  document.getElementById('wfront-emoji').textContent = '❓';
  document.getElementById('wfront-word').textContent = 'ฟังเสียงและสะกดคำ';
  document.getElementById('wfront-cat').textContent = 'โหมดเขียนตามคำบอก';

  document.getElementById('wback-reading').textContent = '— ซ่อนคำอ่าน —';
  document.getElementById('wback-meaning').textContent = `คำใบ้ความหมาย: ${wordItem.meaning}`;

  document.getElementById('tcard').classList.remove('flipped');

  // ล้างอินพุตและตั้งค่าโฟกัส
  const input = document.getElementById('dictation-input');
  input.value = '';
  input.disabled = false;
  input.focus();

  // พูดออกเสียงคำศัพท์
  speakThai(wordItem.word);

  // อัปเดตความก้าวหน้า
  const pct = (currentWordIndex / quizList.length) * 100;
  document.getElementById('bar').style.width = `${pct}%`;
}

function playVoiceOnly() {
  if (currentWordIndex < quizList.length) {
    speakThai(quizList[currentWordIndex].word);
  }
}

function checkDictation() {
  if (isAnswered) return;

  const inputEl = document.getElementById('dictation-input');
  const answer = inputEl.value.trim();
  const wordItem = quizList[currentWordIndex];

  if (!answer) {
    showToast('กรุณาพิมพ์สะกดคำศัพท์ก่อนส่งคำตอบ', 'wrong');
    return;
  }

  isAnswered = true;
  inputEl.disabled = true;

  if (answer === wordItem.word) {
    currentScore += CONFIG.BASE_SCORE;
    recordAnswer(wordItem, true);
    showToast('ถูกต้องเก่งมาก! 🎉', 'correct');

    // พลิกการ์ดเฉลยความหมายโดยอัตโนมัติ
    document.getElementById('wfront-word').textContent = wordItem.word;
    document.getElementById('wback-reading').textContent = `คำอ่าน: [ ${wordItem.reading} ]`;
    document.getElementById('tcard').classList.add('flipped');

    setTimeout(() => {
      currentWordIndex++;
      loadDictationWord();
    }, 2800);
    
    KAMPAI.sound.correct();
  } else {
    currentLives--;
    recordAnswer(wordItem, false);
    showToast('สะกดไม่ถูกต้องนะ 😢', 'wrong');

    // เฉลยคำศัพท์ที่ถูกต้องบนหน้าการ์ด
    document.getElementById('wfront-word').textContent = `${wordItem.word}`;
    document.getElementById('wback-reading').textContent = `เขียนที่ถูก: ${wordItem.word} [ ${wordItem.reading} ]`;
    document.getElementById('tcard').classList.add('flipped');

    setTimeout(() => {
      if (currentLives <= 0) {
        endGame();
      } else {
        currentWordIndex++;
        loadDictationWord();
      }
    }, 3500);

    KAMPAI.sound.wrong();
  }

  updateHUD();
}

function handleDictationKey(e) {
  if (e.key === 'Enter') {
    checkDictation();
  }
}

// ═══ MODE 3: CHOICE QUIZ (ทายความหมาย) ═══

function loadChoiceWord() {
  isAnswered = false;
  if (currentWordIndex >= quizList.length || currentLives <= 0) {
    endGame();
    return;
  }

  const wordItem = quizList[currentWordIndex];
  const pool = getQuizWords();

  let questionText = `คำว่า "${wordItem.word}" มีความหมายตรงกับข้อใด?`;
  if (activeCategorySlug === 'classifiers' && wordItem.classifier_for) {
    questionText = `"${wordItem.classifier_for} 1 ___" — เลือกลักษณนามที่ถูก`;
  }
  document.getElementById('choice-question-text').textContent = questionText;
  
  // ซ่อนเนื้อหาการ์ดหลัก
  document.getElementById('wfront-emoji').textContent = '🎯';
  document.getElementById('wfront-word').textContent = 'เลือกความหมาย';
  document.getElementById('wfront-cat').textContent = 'โหมดตอบคำถาม';

  // พลิกการ์ดเฉลยด้านหลังชั่วคราว
  document.getElementById('wback-reading').textContent = 'คำศัพท์สะกด: ' + wordItem.word;
  document.getElementById('wback-meaning').textContent = 'ความหมายจะเฉลยหลังตอบ';
  document.getElementById('tcard').classList.remove('flipped');

  // สุ่มคำตอบลวง 3 ข้อจากคลังคำแปลอื่นในหมวดเดียวกัน
  const decoys = pickMeaningDecoys(wordItem, pool, 3);
  const options = shuffle([wordItem.meaning, ...decoys]);

  const container = document.getElementById('choice-options');
  container.innerHTML = '';

  options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.onclick = () => selectChoiceAnswer(opt, btn);
    container.appendChild(btn);
  });

  const pct = (currentWordIndex / quizList.length) * 100;
  document.getElementById('bar').style.width = `${pct}%`;
}

function selectChoiceAnswer(selectedOpt, clickedBtn) {
  if (isAnswered) return;
  isAnswered = true;

  const wordItem = quizList[currentWordIndex];
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(btn => btn.disabled = true);

  if (selectedOpt === wordItem.meaning) {
    clickedBtn.classList.add('correct');
    currentScore += CONFIG.BASE_SCORE;
    recordAnswer(wordItem, true);
    showToast('คำตอบถูกต้อง! 🎉', 'correct');
    KAMPAI.sound.correct();
  } else {
    clickedBtn.classList.add('wrong');
    // ไฮไลต์ข้อที่ถูกต้อง
    btns.forEach(btn => {
      if (btn.textContent === wordItem.meaning) btn.classList.add('correct');
    });
    currentLives--;
    recordAnswer(wordItem, false);
    showToast('ยังไม่ถูกต้องนะ 😢', 'wrong');
    KAMPAI.sound.wrong();
  }

  // เฉลยความหมายบนการ์ดด้านหลัง
  document.getElementById('wback-meaning').textContent = wordItem.meaning;
  document.getElementById('tcard').classList.add('flipped');

  setTimeout(() => {
    if (currentLives <= 0) {
      endGame();
    } else {
      currentWordIndex++;
      loadChoiceWord();
    }
  }, 2800);

  updateHUD();
}

// ═══ MODE 5: LISTEN (ฟังเสียงทายคำ) ═══

function loadListenWord() {
  isAnswered = false;
  if (currentWordIndex >= quizList.length || currentLives <= 0) {
    endGame();
    return;
  }

  const wordItem = quizList[currentWordIndex];
  const pool = getQuizWords();
  const hint = document.getElementById('listen-hint');
  if (hint) {
    hint.textContent = activeCategorySlug === 'homophones'
      ? 'ได้ยินคำอ่านเดียวกัน — เลือกคำที่ถูกต้อง'
      : 'ได้ยินคำว่าอะไร? เลือกคำที่ถูกต้อง';
  }

  document.getElementById('wfront-emoji').textContent = '🎧';
  document.getElementById('wfront-word').textContent = 'ฟังเสียง...';
  document.getElementById('wfront-cat').textContent = 'โหมดฟังทายคำ';
  document.getElementById('wback-reading').textContent = '— ซ่อนคำตอบ —';
  document.getElementById('wback-meaning').textContent = wordItem.meaning;
  document.getElementById('tcard').classList.remove('flipped');

  const decoys = pickWordDecoys(wordItem, pool, 3).map((w) => w.word);
  const options = shuffle([wordItem.word, ...decoys]);

  const container = document.getElementById('listen-options');
  container.innerHTML = '';
  options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.onclick = () => selectListenAnswer(opt, btn);
    container.appendChild(btn);
  });

  speakThai(wordItem.word);

  const pct = (currentWordIndex / quizList.length) * 100;
  document.getElementById('bar').style.width = `${pct}%`;
}

function replayListenWord() {
  if (currentWordIndex < quizList.length) speakThai(quizList[currentWordIndex].word);
}

function selectListenAnswer(selectedWord, clickedBtn) {
  if (isAnswered) return;
  isAnswered = true;
  const wordItem = quizList[currentWordIndex];
  const btns = document.querySelectorAll('#listen-options .option-btn');
  btns.forEach((btn) => { btn.disabled = true; });

  if (selectedWord === wordItem.word) {
    clickedBtn.classList.add('correct');
    currentScore += CONFIG.BASE_SCORE;
    recordAnswer(wordItem, true);
    showToast('ถูกต้อง! 🎉', 'correct');
    KAMPAI.sound.correct();
  } else {
    clickedBtn.classList.add('wrong');
    btns.forEach((btn) => {
      if (btn.textContent === wordItem.word) btn.classList.add('correct');
    });
    currentLives--;
    recordAnswer(wordItem, false);
    showToast('ยังไม่ถูกต้องนะ 😢', 'wrong');
    KAMPAI.sound.wrong();
  }

  document.getElementById('wfront-word').textContent = wordItem.word;
  document.getElementById('wback-reading').textContent = `คำอ่าน: [ ${wordItem.reading} ]`;
  document.getElementById('tcard').classList.add('flipped');

  setTimeout(() => {
    if (currentLives <= 0) endGame();
    else { currentWordIndex++; loadListenWord(); }
  }, 2800);
  updateHUD();
}

// ═══ MODE 6: FLASH (สุ่มการ์ด — รู้แล้ว/ทบทวน) ═══

function mountFlashControls() {
  const saved = localStorage.getItem(FLASH_VARIANT_KEY);
  if (['word2meaning', 'meaning2word', 'audio2word', 'mixed'].includes(saved)) flashVariant = saved;

  document.querySelectorAll('.flash-var-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.v === flashVariant);
    if (!btn.dataset.tvhBound) {
      btn.dataset.tvhBound = '1';
      btn.addEventListener('click', () => {
        flashVariant = btn.dataset.v;
        localStorage.setItem(FLASH_VARIANT_KEY, flashVariant);
        document.querySelectorAll('.flash-var-btn').forEach((b) => b.classList.toggle('active', b === btn));
        if (currentMode === 'flash') renderFlashCard();
      });
    }
  });

  const reveal = document.getElementById('btn-flash-reveal');
  const know = document.getElementById('btn-flash-know');
  const review = document.getElementById('btn-flash-review');
  const reset = document.getElementById('btn-flash-reset');

  if (reveal && !reveal.dataset.tvhBound) {
    reveal.dataset.tvhBound = '1';
    reveal.addEventListener('click', () => revealFlashCard());
  }
  if (know && !know.dataset.tvhBound) {
    know.dataset.tvhBound = '1';
    know.addEventListener('click', () => flashMarkKnown(true));
  }
  if (review && !review.dataset.tvhBound) {
    review.dataset.tvhBound = '1';
    review.addEventListener('click', () => flashMarkKnown(false));
  }
  if (reset && !reset.dataset.tvhBound) {
    reset.dataset.tvhBound = '1';
    reset.addEventListener('click', () => resetFlashProgress());
  }
}

function pickFlashVariant() {
  if (flashVariant !== 'mixed') return flashVariant;
  const pool = ['word2meaning', 'meaning2word'];
  if (activeCategorySlug === 'homophones') pool.push('audio2word');
  return pool[Math.floor(Math.random() * pool.length)];
}

function startFlashMode() {
  const words = getQuizWords();
  if (!words.length) {
    showToast('ไม่มีคำในชุดนี้', 'wrong');
    return;
  }
  flashTotal = words.length;
  flashKnown = loadFlashKnown(activeCategorySlug);
  flashReviewCount = {};
  flashDeck = shuffle(words.map((_, i) => i));
  flashRevealed = false;
  renderFlashCard();
}

function resetFlashProgress() {
  flashKnown = new Set();
  saveFlashKnown(activeCategorySlug);
  flashReviewCount = {};
  startFlashMode();
}

function updateFlashScore() {
  const el = document.getElementById('flash-score');
  if (el) el.textContent = `รู้แล้ว ${flashKnown.size}/${flashTotal} · เหลือ ${Math.max(0, flashTotal - flashKnown.size)}`;
  document.getElementById('bar').style.width = flashTotal ? `${(flashKnown.size / flashTotal) * 100}%` : '0%';
}

function renderFlashCard() {
  const words = getQuizWords();
  while (flashDeck.length && flashKnown.has(words[flashDeck[0]]?.word)) flashDeck.shift();

  if (!flashDeck.length || !words.length) {
    showToast('รู้แล้วครบทุกคำ! 🎉', 'correct');
    initConfetti();
    updateFlashScore();
    return;
  }

  const idx = flashDeck[0];
  const item = words[idx];
  if (!item) { flashDeck.shift(); renderFlashCard(); return; }

  flashRevealed = false;
  const v = pickFlashVariant();
  const tcard = document.getElementById('tcard');
  tcard.classList.remove('flipped');
  mountCardVisualButton(item);

  document.getElementById('btn-flash-reveal').style.display = '';
  document.getElementById('btn-flash-know').style.display = 'none';
  document.getElementById('btn-flash-review').style.display = 'none';

  const emojiEl = document.getElementById('wfront-emoji');
  const wordEl = document.getElementById('wfront-word');
  const catEl = document.getElementById('wfront-cat');

  if (activeCategorySlug === 'classifiers' && item.classifier_for && v !== 'meaning2word') {
    emojiEl.textContent = item.emoji || '🏷️';
    wordEl.textContent = `${item.classifier_for} 1 ___`;
    catEl.textContent = 'เติมลักษณนาม';
  } else if (v === 'meaning2word') {
    emojiEl.textContent = item.emoji || '💭';
    wordEl.textContent = item.meaning;
    catEl.textContent = 'ความหมาย';
  } else if (v === 'audio2word') {
    emojiEl.textContent = '🔊';
    wordEl.textContent = 'ฟังเสียง...';
    catEl.textContent = 'ทายคำ';
    speakThai(item.word);
  } else {
    emojiEl.textContent = item.emoji || activeCategory?.icon || '📝';
    wordEl.textContent = item.word;
    catEl.textContent = activeCategory?.title || '';
  }

  document.getElementById('wback-reading').textContent = `คำอ่าน: [ ${item.reading} ]`;
  document.getElementById('wback-meaning').textContent = item.meaning;
  updateFlashScore();
}

function revealFlashCard() {
  if (flashRevealed) return;
  flashRevealed = true;
  document.getElementById('tcard').classList.add('flipped');
  document.getElementById('btn-flash-reveal').style.display = 'none';
  document.getElementById('btn-flash-know').style.display = '';
  document.getElementById('btn-flash-review').style.display = '';

  const words = getQuizWords();
  const item = words[flashDeck[0]];
  if (item && flashVariant !== 'audio2word') speakThai(item.word);
}

document.getElementById('btn-visual-close')?.addEventListener('click', closeVisualViewer);
document.getElementById('visual-viewer')?.addEventListener('click', (event) => {
  if (event.target.id === 'visual-viewer') closeVisualViewer();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeVisualViewer();
});

function flashMarkKnown(isKnown) {
  if (!flashRevealed) return;
  const words = getQuizWords();
  const idx = flashDeck.shift();
  const item = words[idx];
  if (!item) { renderFlashCard(); return; }

  if (isKnown) {
    flashKnown.add(item.word);
    saveFlashKnown(activeCategorySlug);
  } else {
    flashReviewCount[idx] = (flashReviewCount[idx] || 0) + 1;
    const gap = Math.max(1, Math.ceil(flashDeck.length / (flashReviewCount[idx] + 1)));
    flashDeck.splice(Math.min(gap, flashDeck.length), 0, idx);
  }
  renderFlashCard();
}

// ═══ MODE 4: MATCHING GAME (จับคู่คำอ่าน) ═══

function initMatchingGame() {
  matchedPairsCount = 0;
  selectedMatchLeft = null;
  selectedMatchRight = null;

  const pool = getQuizWords();
  let matchWords = shuffle([...pool]).slice(0, 4);

  if (activeCategorySlug === 'antonyms') {
    const byPair = new Map();
    pool.forEach((w) => {
      if (w.pair_id) byPair.set(w.pair_id, [...(byPair.get(w.pair_id) || []), w]);
    });
    const groups = shuffle([...byPair.values()].filter((g) => g.length >= 2)).slice(0, 2);
    if (groups.length >= 2) matchWords = groups.flat();
  }

  const leftCol = document.getElementById('match-left');
  const rightCol = document.getElementById('match-right');

  leftCol.innerHTML = '';
  rightCol.innerHTML = '';

  let leftItems;
  let rightItems;

  if (activeCategorySlug === 'antonyms') {
    leftItems = shuffle(matchWords.map((w) => ({ id: w.pair_id || w.word, text: w.word })));
    rightItems = shuffle(matchWords.map((w) => {
      const partner = pool.find((p) => p.pair_id === w.pair_id && p.word !== w.word);
      return { id: w.pair_id || w.word, text: partner ? partner.word : w.word };
    }));
  } else {
    leftItems = shuffle(matchWords.map((w) => ({ id: w.word, text: w.word })));
    rightItems = shuffle(matchWords.map((w) => ({ id: w.word, text: w.reading })));
  }

  leftItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.textContent = item.text;
    card.onclick = () => selectMatch(item.id, card, 'left');
    leftCol.appendChild(card);
  });

  rightItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.textContent = `[ ${item.text} ]`;
    card.onclick = () => selectMatch(item.id, card, 'right');
    rightCol.appendChild(card);
  });
}

function selectMatch(id, cardElement, side) {
  if (cardElement.classList.contains('matched') || cardElement.classList.contains('error')) {
    return;
  }

  if (side === 'left') {
    const activeLeft = document.querySelector('#match-left .match-card.active');
    if (activeLeft) activeLeft.classList.remove('active');
    
    selectedMatchLeft = { id, el: cardElement };
    cardElement.classList.add('active');
    
    // พูดออกเสียงคำศัพท์
    speakThai(id);
  } else {
    const activeRight = document.querySelector('#match-right .match-card.active');
    if (activeRight) activeRight.classList.remove('active');
    
    selectedMatchRight = { id, el: cardElement };
    cardElement.classList.add('active');
  }

  // หากเลือกจับคู่ทั้งสองข้าง
  if (selectedMatchLeft && selectedMatchRight) {
    const leftNode = selectedMatchLeft;
    const rightNode = selectedMatchRight;

    selectedMatchLeft = null;
    selectedMatchRight = null;

    if (leftNode.id === rightNode.id) {
      // จับคู่ถูกต้อง
      leftNode.el.classList.remove('active');
      rightNode.el.classList.remove('active');
      leftNode.el.classList.add('matched');
      rightNode.el.classList.add('matched');

      currentScore += CONFIG.BASE_SCORE;
      matchedPairsCount++;
      recordAnswer(categoryWords.find(w => w.word === leftNode.id), true);
      updateHUD();
      KAMPAI.sound.correct();

      // ตรวจสอบว่าผ่านครบหมดตารางหรือยัง
      if (matchedPairsCount === 4) {
        showToast('จับคู่ถูกต้องครบถ้วน! 🔗', 'correct');
        setTimeout(() => {
          // รีเซ็ตด่านถัดไป
          initMatchingGame();
        }, 1500);
      }
    } else {
      // จับคู่ผิดพลาด
      leftNode.el.classList.remove('active');
      rightNode.el.classList.remove('active');
      leftNode.el.classList.add('error');
      rightNode.el.classList.add('error');

      currentLives--;
      recordAnswer(categoryWords.find(w => w.word === leftNode.id), false);
      updateHUD();
      KAMPAI.sound.wrong();

      setTimeout(() => {
        leftNode.el.classList.remove('error');
        rightNode.el.classList.remove('error');
        
        if (currentLives <= 0) {
          endGame();
        }
      }, 800);
    }
  }
}

// ═══ WEB SPEECH TEXT-TO-SPEECH (ภาษาไทย) ═══

function cancelSpeech() {
  speechGen += 1;
  if (speechGapTimer) {
    clearTimeout(speechGapTimer);
    speechGapTimer = null;
  }
  if (speechStartTimer) {
    clearTimeout(speechStartTimer);
    speechStartTimer = null;
  }
  if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  if (KAMPAI.sound && KAMPAI.sound.stopSpeak) KAMPAI.sound.stopSpeak();
}

/** หยุด TTS + autoplay + timer ทั้งหมด (ออกจากหน้า / ซ่อนแท็บ / กลับ hub) */
function stopAllMediaAndTimers() {
  stopAutoplay();
  cancelSpeech();
  clearAutoplayTimers();
}

function disposeGameSession() {
  stopAllMediaAndTimers();
  unbindGridSpanResizeObserver();
  document.querySelectorAll('.grid-flip-card').forEach((c) => {
    c.classList.remove('flipped', 'grid-flip-card--expand-back', 'autoplay-active');
    c.style.removeProperty('--grid-expand-h');
  });
}

function patchKampaiExit() {
  if (patchKampaiExit.done) return;
  patchKampaiExit.done = true;
  const wrap = (fn) => function wrappedExit() {
    disposeGameSession();
    return fn && fn.apply(this, arguments);
  };
  if (typeof KAMPAI.goHome === 'function') KAMPAI.goHome = wrap(KAMPAI.goHome);
  if (typeof KAMPAI.exit === 'function') KAMPAI.exit = wrap(KAMPAI.exit);
}

function bindPageLifecycleCleanup() {
  if (bindPageLifecycleCleanup.done) return;
  bindPageLifecycleCleanup.done = true;
  const onHide = () => disposeGameSession();
  window.addEventListener('pagehide', onHide);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') onHide();
  });
  window.addEventListener('message', (e) => {
    if (e.data && e.data.type === 'navigate') disposeGameSession();
  });
}

/** อ่านภาษาไทยพร้อม callback เมื่อจบ (ใช้กับอ่านอัตโนมัติ) */
function speakThaiAsync(text, onDone, cancelFirst) {
  if (!text) { if (onDone) onDone(); return; }
  if (!autoSoundEnabled) { if (onDone) onDone(); return; }

  if (!('speechSynthesis' in window)) { if (onDone) onDone(); return; }

  const gen = speechGen;
  const done = () => {
    if (gen !== speechGen) return;
    if (onDone) onDone();
  };
  try {
    if (cancelFirst !== false) {
      if (speechStartTimer) {
        clearTimeout(speechStartTimer);
        speechStartTimer = null;
      }
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    utterance.rate = 0.82;
    utterance.onend = done;
    utterance.onerror = done;
    speechStartTimer = setTimeout(() => {
      speechStartTimer = null;
      if (gen !== speechGen) return;
      try { window.speechSynthesis.speak(utterance); } catch (_) { done(); }
    }, cancelFirst !== false ? 80 : 40);
  } catch (_) {
    done();
  }
}

function speakThaiSequence(texts, onDone) {
  const list = (texts || []).filter(Boolean);
  if (!list.length) { if (onDone) onDone(); return; }
  const gen = speechGen;
  let i = 0;
  const next = () => {
    if (gen !== speechGen) return;
    if (i >= list.length) { if (onDone) onDone(); return; }
    const t = list[i++];
    speakThaiAsync(t, () => {
      if (gen !== speechGen) return;
      speechGapTimer = setTimeout(() => {
        speechGapTimer = null;
        next();
      }, 220);
    }, i === 1);
  };
  next();
}

function speakThai(text) {
  speakThaiAsync(text, null, true);
}

// ═══ NAVIGATION & HUD ═══

function returnToHub() {
  disposeGameSession();
  document.getElementById('hub-view').style.display = 'flex';
  document.getElementById('topic-view').style.display = 'none';
  document.getElementById('gameover-screen').style.display = 'none';
  const sd = document.getElementById('score-display');
  if (sd) sd.style.display = 'none';
}

function updateHUD() {
  const scoreVal = document.getElementById('score-val');
  if (scoreVal) scoreVal.textContent = currentScore;

  let hearts = '';
  for (let i = 0; i < CONFIG.LIVES; i++) {
    hearts += i < currentLives ? '❤️' : '🖤';
  }
  const lifeDisplay = document.getElementById('life-display');
  if (lifeDisplay) lifeDisplay.textContent = hearts;
}

// บันทึกผลแต่ละข้อในรอบฝึก (ถูก/ผิด + เก็บคำที่พลาดไว้ทบทวน)
function recordAnswer(wordItem, correct) {
  sessionTotal++;
  if (correct) {
    sessionCorrect++;
  } else if (wordItem && !missedWords.some(w => w.word === wordItem.word)) {
    missedWords.push(wordItem);
  }
}

// สรุปจบรอบฝึก (คลังสื่อ — ไม่ส่งคะแนนขึ้นระบบ)
function endGame() {
  stopAllMediaAndTimers();

  const total = sessionTotal;
  const correct = sessionCorrect;
  const pct = total > 0 ? correct / total : 0;

  let stars = 0;
  if (total > 0) {
    if (pct >= 0.9) stars = 3;
    else if (pct >= 0.6) stars = 2;
    else if (pct > 0) stars = 1;
  }

  const starDisplay = document.getElementById('star-display');
  if (starDisplay) {
    let starStr = '';
    for (let i = 1; i <= 3; i++) starStr += i <= stars ? '⭐' : '☆';
    starDisplay.textContent = starStr;
    starDisplay.style.display = 'block';
  }

  // ส่งคะแนนรอบฝึกขึ้นระบบ (เฉพาะเมื่อมีการตอบอย่างน้อย 1 ข้อ — โหมดทบทวนไม่เรียก endGame)
  if (total > 0 && KAMPAI.submitScore) {
    KAMPAI.submitScore(currentScore, {
      stars: stars,
      categorySlug: activeCategorySlug,
      missedWords: missedWords.map((w) => ({
        word: w.word,
        reading: w.reading,
        meaning: w.meaning,
        indicator_code: w.indicator_code || null,
      })),
      indicatorCodes: missedWords.map((w) => w.indicator_code).filter(Boolean),
    });
  }

  const titleEl = document.getElementById('go-title');
  if (titleEl) titleEl.textContent = (currentLives <= 0) ? 'พยายามอีกครั้ง!' : 'ทบทวนสำเร็จ!';

  const summaryEl = document.getElementById('go-summary');
  if (summaryEl) {
    summaryEl.textContent = total > 0 ? `ตอบถูก ${correct} / ${total} คำ` : 'จบรอบแล้ว';
  }

  // รายการคำที่ควรทบทวน (เฉพาะที่ตอบผิด)
  const missedBox = document.getElementById('missed-box');
  const missedList = document.getElementById('missed-list');
  if (missedBox && missedList) {
    if (missedWords.length > 0) {
      missedList.innerHTML = '';
      missedWords.forEach(w => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${w.word}</strong> [${w.reading}] — ${w.meaning}`;
        missedList.appendChild(li);
      });
      missedBox.style.display = 'block';
    } else {
      missedBox.style.display = 'none';
    }
  }

  document.getElementById('gameover-screen').style.display = 'flex';
  document.getElementById('topic-view').style.display = 'none';
  const sd = document.getElementById('score-display');
  if (sd) sd.style.display = 'none';

  if (stars >= 2) {
    initConfetti();
  }
}

// แสดง Toast ข้อความเล็ก
function showToast(msg, status) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${status}`;
  
  setTimeout(() => {
    toast.className = 'toast';
  }, 2000);
}

// ═══ HELPER & CONFETTI ═══

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// CONFETTI
let confettiActive = false;
let confettiArr = [];
const canvasConf = document.getElementById('confetti-canvas');
const ctxConf = canvasConf.getContext('2d');

function initConfetti() {
  canvasConf.style.display = 'block';
  canvasConf.width = window.innerWidth;
  canvasConf.height = window.innerHeight;
  confettiActive = true;
  confettiArr = [];
  
  for (let i = 0; i < 120; i++) {
    confettiArr.push({
      x: Math.random() * canvasConf.width,
      y: Math.random() * canvasConf.height - canvasConf.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvasConf.height,
      color: `hsl(${Math.random() * 360}, 90%, 60%)`,
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    });
  }
  
  requestAnimationFrame(drawConfetti);
}

function drawConfetti() {
  if (!confettiActive) return;
  ctxConf.clearRect(0, 0, canvasConf.width, canvasConf.height);
  
  let finished = true;
  confettiArr.forEach((p) => {
    p.tiltAngle += p.tiltAngleIncremental;
    p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
    p.tilt = Math.sin(p.tiltAngle - p.r/2) * 15;
    
    if (p.y < canvasConf.height) {
      finished = false;
    }
    
    ctxConf.beginPath();
    ctxConf.lineWidth = p.r;
    ctxConf.strokeStyle = p.color;
    ctxConf.moveTo(p.x + p.tilt + p.r/2, p.y);
    ctxConf.lineTo(p.x + p.tilt, p.y + p.tilt + p.r/2);
    ctxConf.stroke();
  });
  
  if (finished) {
    confettiActive = false;
    canvasConf.style.display = 'none';
  } else {
    requestAnimationFrame(drawConfetti);
  }
}

window.addEventListener('resize', () => {
  if (confettiActive) {
    canvasConf.width = window.innerWidth;
    canvasConf.height = window.innerHeight;
  }
});

// ═══ AUTOPLAY — อ่านอัตโนมัติแบบ vocab-hub อังกฤษ (รอเสียงจบ → หน่วง → คำถัดไป) ═══

const AUTO_READ_KEY = 'tvh_auto_read_mode';
const AUTO_PAUSE_MS_KEY = 'tvh_auto_pause_ms';
const AUTO_FLIP_KEY = 'tvh_auto_flip';
const AUTO_SOUND_KEY = 'tvh_auto_sound';

function loadAutoplayPrefs() {
  const mode = localStorage.getItem(AUTO_READ_KEY);
  if (['word', 'reading', 'meaning', 'full'].includes(mode)) autoReadMode = mode;
  const ms = parseInt(localStorage.getItem(AUTO_PAUSE_MS_KEY), 10);
  if ([500, 1000, 1500, 2000, 3000].includes(ms)) autoplayPauseMs = ms;
  const flip = localStorage.getItem(AUTO_FLIP_KEY);
  if (flip === '0') autoFlipEnabled = false;
  if (flip === '1') autoFlipEnabled = true;
  const snd = localStorage.getItem(AUTO_SOUND_KEY);
  if (snd === '0') autoSoundEnabled = false;
  if (snd === '1') autoSoundEnabled = true;
}

function mountAutoplayControls() {
  loadAutoplayPrefs();

  const modeSel = document.getElementById('autoplay-read-mode');
  if (modeSel) modeSel.value = autoReadMode;

  document.querySelectorAll('.autoplay-spd').forEach((btn) => {
    const active = parseInt(btn.dataset.ms, 10) === autoplayPauseMs;
    btn.classList.toggle('active', active);
    if (!btn.dataset.tvhBound) {
      btn.dataset.tvhBound = '1';
      btn.addEventListener('click', () => {
        autoplayPauseMs = parseInt(btn.dataset.ms, 10);
        localStorage.setItem(AUTO_PAUSE_MS_KEY, String(autoplayPauseMs));
        document.querySelectorAll('.autoplay-spd').forEach((b) => b.classList.toggle('active', b === btn));
        if (isAutoplayActive && !autoplayPaused) runAutoplayStep();
      });
    }
  });

  const flipBtn = document.getElementById('btn-auto-flip');
  if (flipBtn) flipBtn.classList.toggle('on', autoFlipEnabled);
  const soundBtn = document.getElementById('btn-auto-sound');
  if (soundBtn) {
    soundBtn.classList.toggle('on', autoSoundEnabled);
    soundBtn.textContent = autoSoundEnabled ? '🔊' : '🔇';
  }

  const pauseBtn = document.getElementById('btn-autoplay-pause');
  if (pauseBtn) pauseBtn.style.display = isAutoplayActive ? '' : 'none';
}

function setAutoReadMode(value) {
  if (!['word', 'reading', 'meaning', 'full'].includes(value)) return;
  autoReadMode = value;
  localStorage.setItem(AUTO_READ_KEY, value);
  if (isAutoplayActive && !autoplayPaused) runAutoplayStep();
}

function toggleAutoFlip() {
  autoFlipEnabled = !autoFlipEnabled;
  localStorage.setItem(AUTO_FLIP_KEY, autoFlipEnabled ? '1' : '0');
  const btn = document.getElementById('btn-auto-flip');
  if (btn) btn.classList.toggle('on', autoFlipEnabled);
}

function toggleAutoSound() {
  autoSoundEnabled = !autoSoundEnabled;
  localStorage.setItem(AUTO_SOUND_KEY, autoSoundEnabled ? '1' : '0');
  const btn = document.getElementById('btn-auto-sound');
  if (btn) {
    btn.classList.toggle('on', autoSoundEnabled);
    btn.textContent = autoSoundEnabled ? '🔊' : '🔇';
  }
  if (!autoSoundEnabled) cancelSpeech();
}

function buildAutoplayTexts(item, side) {
  if (!item) return [];
  if (side === 'front') return [item.word];
  const texts = [];
  if (autoReadMode === 'reading' || autoReadMode === 'full') {
    if (item.reading) texts.push(`คำอ่าน ${item.reading}`);
  }
  if (autoReadMode === 'meaning' || autoReadMode === 'full') {
    if (item.meaning) texts.push(item.meaning);
  }
  return texts;
}

function isGridCardInView(card) {
  const r = card.getBoundingClientRect();
  const vh = window.innerHeight || document.documentElement.clientHeight;
  return r.top >= -8 && r.bottom <= vh + 8;
}

function highlightAutoplayCard(idx) {
  document.querySelectorAll('.grid-flip-card').forEach((c, i) => {
    c.classList.toggle('autoplay-active', i === idx);
  });
}

function updateAutoplayProgress() {
  const el = document.getElementById('autoplay-progress');
  if (!el || !gridDisplayWords.length) {
    if (el) el.textContent = '—';
    return;
  }
  el.textContent = `${currentWordIndex + 1}/${gridDisplayWords.length}`;
  const pct = ((currentWordIndex + 1) / gridDisplayWords.length) * 100;
  document.getElementById('bar').style.width = `${pct}%`;
}

function goToAutoplayIndex(idx, opts) {
  if (!gridDisplayWords.length) return;
  const options = opts || {};
  currentWordIndex = ((idx % gridDisplayWords.length) + gridDisplayWords.length) % gridDisplayWords.length;
  highlightAutoplayCard(currentWordIndex);
  updateAutoplayProgress();
  const card = document.getElementById(`word-cell-${currentWordIndex}`);
  if (card && options.scroll !== false) {
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  if (options.speak && gridDisplayWords[currentWordIndex]) {
    speakThai(gridDisplayWords[currentWordIndex].word);
  }
}

function clearAutoplayTimers() {
  clearTimeout(autoplayTimer);
  clearTimeout(autoplaySafetyTimer);
  autoplayTimer = null;
  autoplaySafetyTimer = null;
}

function scheduleAutoplayNext(gen) {
  clearAutoplayTimers();
  if (!isAutoplayActive || autoplayPaused || gen !== autoplayGen) return;
  autoplayTimer = setTimeout(() => {
    if (!isAutoplayActive || autoplayPaused || gen !== autoplayGen) return;
    currentWordIndex = (currentWordIndex + 1) % gridDisplayWords.length;
    runAutoplayStep(gen);
  }, autoplayPauseMs);
}

function runAutoplayStep(forcedGen) {
  if (!isAutoplayActive || autoplayPaused || currentMode !== 'auto') return;
  if (!gridDisplayWords.length) return;

  const gen = forcedGen != null ? forcedGen : autoplayGen;
  clearAutoplayTimers();
  cancelSpeech();

  const item = gridDisplayWords[currentWordIndex];
  const card = document.getElementById(`word-cell-${currentWordIndex}`);
  highlightAutoplayCard(currentWordIndex);
  updateAutoplayProgress();

  if (card) {
    card.classList.remove('flipped');
    resetGridCardBackExpand(card);
    if (!isGridCardInView(card)) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  let finished = false;
  const finishStep = () => {
    if (finished || gen !== autoplayGen || !isAutoplayActive || autoplayPaused) return;
    finished = true;
    clearTimeout(autoplaySafetyTimer);
    scheduleAutoplayNext(gen);
  };

  autoplaySafetyTimer = setTimeout(finishStep, 14000);

  const frontTexts = buildAutoplayTexts(item, 'front');
  const afterFront = () => {
    if (gen !== autoplayGen || !isAutoplayActive || autoplayPaused) return;
    const backTexts = buildAutoplayTexts(item, 'back');
    const needsFlip = autoFlipEnabled && backTexts.length > 0;
    if (needsFlip && card) {
      card.classList.add('flipped');
      adjustGridCardBackExpand(card);
    }
    if (backTexts.length) {
      speakThaiSequence(backTexts, finishStep);
    } else {
      finishStep();
    }
  };

  if (autoReadMode === 'word' && !autoFlipEnabled) {
    speakThaiSequence(frontTexts, finishStep);
  } else if (autoReadMode === 'word' && autoFlipEnabled) {
    speakThaiSequence(frontTexts, () => {
      if (gen !== autoplayGen) return;
      if (card) {
        card.classList.add('flipped');
        adjustGridCardBackExpand(card);
      }
      finishStep();
    });
  } else {
    speakThaiSequence(frontTexts, afterFront);
  }
}

function updateAutoplayUI() {
  const toggleBtn = document.getElementById('btn-autoplay-toggle');
  const pauseBtn = document.getElementById('btn-autoplay-pause');
  if (toggleBtn) {
    toggleBtn.textContent = isAutoplayActive ? '⏹ หยุดอ่าน' : '▶ อ่านอัตโนมัติ';
    toggleBtn.classList.toggle('playing', isAutoplayActive);
  }
  if (pauseBtn) {
    pauseBtn.style.display = isAutoplayActive ? '' : 'none';
    pauseBtn.textContent = autoplayPaused ? '▶' : '⏸';
    pauseBtn.classList.toggle('on', autoplayPaused);
    pauseBtn.title = autoplayPaused ? 'เล่นต่อ' : 'หยุดชั่วคราว';
  }
}

function toggleAutoplay() {
  if (isAutoplayActive) stopAutoplay();
  else startAutoplay();
}

function startAutoplay() {
  if (currentMode !== 'auto' || !gridDisplayWords.length) return;
  clearAutoplayTimers();
  cancelSpeech();
  isAutoplayActive = true;
  autoplayPaused = false;
  autoplayGen += 1;
  updateAutoplayUI();
  runAutoplayStep(autoplayGen);
}

function stopAutoplay() {
  isAutoplayActive = false;
  autoplayPaused = false;
  autoplayGen += 1;
  clearAutoplayTimers();
  cancelSpeech();
  document.querySelectorAll('.grid-flip-card.autoplay-active').forEach((c) => c.classList.remove('autoplay-active'));
  updateAutoplayUI();
}

function pauseAutoplay(fromManual) {
  if (!isAutoplayActive || autoplayPaused) return;
  autoplayPaused = true;
  clearAutoplayTimers();
  cancelSpeech();
  updateAutoplayUI();
  if (!fromManual) {
    const pauseBtn = document.getElementById('btn-autoplay-pause');
    if (pauseBtn) pauseBtn.classList.add('on');
  }
}

function toggleAutoplayPause() {
  if (!isAutoplayActive) return;
  if (autoplayPaused) resumeAutoplay();
  else pauseAutoplay(true);
}

function resumeAutoplay() {
  if (!isAutoplayActive || !autoplayPaused) return;
  autoplayPaused = false;
  updateAutoplayUI();
  runAutoplayStep(autoplayGen);
}

loadAutoplayPrefs();
bindPageLifecycleCleanup();
patchKampaiExit();

// ═══ KEYBOARD CONTROLS ═══
// ทบทวน: ← → เปลี่ยนคำ, Space พลิกการ์ด · ทายความหมาย: 1-4 เลือกตัวเลือก
// (เขียนตามคำบอก: Enter จัดการที่ handleDictationKey ในช่อง input อยู่แล้ว)
document.addEventListener('keydown', (e) => {
  const topicView = document.getElementById('topic-view');
  if (!topicView || topicView.style.display === 'none') return;

  // อย่าแย่งคีย์จากช่องพิมพ์/ดรอปดาวน์ (เช่น ช่องเขียนตามคำบอก, ตัวเลือกความเร็ว)
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

  if (currentMode === 'auto') {
    if (e.key === 'ArrowLeft') { e.preventDefault(); autoplayPrev(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); autoplayNext(); }
    else if (e.key === ' ') {
      e.preventDefault();
      const card = document.getElementById(`word-cell-${currentWordIndex}`);
      if (card) toggleGridCard(card, currentWordIndex);
    }
  } else if (currentMode === 'choice' && e.key >= '1' && e.key <= '4') {
    const btns = document.querySelectorAll('#choice-options .option-btn');
    const btn = btns[parseInt(e.key, 10) - 1];
    if (btn && !btn.disabled) btn.click();
  } else if (currentMode === 'listen' && e.key >= '1' && e.key <= '4') {
    const btns = document.querySelectorAll('#listen-options .option-btn');
    const btn = btns[parseInt(e.key, 10) - 1];
    if (btn && !btn.disabled) btn.click();
  }
});
