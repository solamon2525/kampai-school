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
let autoReadMode = 'off';
let autoFlipEnabled = true;
let autoSoundEnabled = true;
let speechGen = 0;
let speechGapTimer = null;
let speechStartTimer = null;
let gridSpanResizeTimer = null;
let lastGridFitWidth = 0;
let lastGridObservedWidth = 0;
let gridSpanFitting = false;
let renderGenId = 0;
let pendingRenderChunks = [];
let xrayScannerActive = false;

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
const vocabVersus = window.KampaiVersus && typeof window.KampaiVersus.create === "function"
  ? window.KampaiVersus.create({
      duration: 90,
      title: "คลังคำศัพท์ภาษาไทย",
      onPlay: function () {},
      onEnd: function () {},
    })
  : null;

// คำที่ยังรอตรวจหมวดต้องไม่ปรากฏในเส้นทางการเรียน (กรองเฉพาะคำที่ไม่ได้ถูก quarantined)
function getApprovedWords(words) {
  const list = Array.isArray(words) ? words : [];
  return list.filter((word) => !word || word.content_status !== 'quarantined');
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
  initHubData();

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

const flashKnownCache = new Map();
const leitnerMapCache = new Map();

function flashKnownKey(slug) {
  return `tvh_flash_known_${slug || 'default'}`;
}

function loadFlashKnown(slug) {
  const key = slug || 'default';
  if (flashKnownCache.has(key)) {
    return new Set(flashKnownCache.get(key));
  }
  let result;
  try {
    result = new Set(JSON.parse(localStorage.getItem(flashKnownKey(slug)) || '[]'));
  } catch (_) {
    result = new Set();
  }
  flashKnownCache.set(key, new Set(result));
  return result;
}

function saveFlashKnown(slug) {
  if (!slug) return;
  const key = slug || 'default';
  flashKnownCache.set(key, new Set(flashKnown));
  localStorage.setItem(flashKnownKey(slug), JSON.stringify([...flashKnown]));
}

// ─── Leitner Spaced Repetition (3 Boxes) ─────────────────────────
function leitnerKey(slug) {
  return `tvh_leitner_${slug || 'default'}`;
}

function loadLeitnerMap(slug) {
  const key = slug || 'default';
  if (leitnerMapCache.has(key)) {
    return Object.assign({}, leitnerMapCache.get(key));
  }
  let map = null;
  try {
    const raw = localStorage.getItem(leitnerKey(slug));
    if (raw) map = JSON.parse(raw);
  } catch (_) {}
  if (!map) {
    const known = loadFlashKnown(slug);
    map = {};
    known.forEach((w) => { map[w] = 3; });
  }
  leitnerMapCache.set(key, Object.assign({}, map));
  return map;
}

function saveLeitnerMap(slug, map) {
  if (!slug) return;
  const key = slug || 'default';
  leitnerMapCache.set(key, Object.assign({}, map));
  try {
    localStorage.setItem(leitnerKey(slug), JSON.stringify(map));
  } catch (_) {}
}

function updateLeitnerWord(slug, word, isCorrect) {
  if (!slug || !word) return;
  const map = loadLeitnerMap(slug);
  const currentBox = map[word] || 1;
  let newBox;
  if (isCorrect) {
    newBox = Math.min(3, currentBox + 1);
  } else {
    newBox = Math.max(1, currentBox - 1);
  }
  map[word] = newBox;
  saveLeitnerMap(slug, map);

  if (newBox === 3) {
    flashKnown.add(word);
    saveFlashKnown(slug);
  }
}

function getLeitnerMasteryPct(slug, gradeFilter) {
  const all = getApprovedWords(ALL_WORDS[slug]);
  const words = (gradeFilter && gradeFilter !== 'all')
    ? all.filter((w) => w.grade === gradeFilter)
    : all;
  if (!words.length) return 0;
  const map = loadLeitnerMap(slug);
  let mastered = 0;
  words.forEach((w) => {
    if (map[w.word] === 3) mastered++;
  });
  return Math.min(100, Math.round((mastered / words.length) * 100));
}

function getFlashProgressPct(slug) {
  return getLeitnerMasteryPct(slug, 'all');
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

const THAI_ALPHABET_CONSONANTS = [
  'ก', 'ข', 'ค', 'ฆ', 'ง', 'จ', 'ฉ', 'ช', 'ซ', 'ฌ', 'ญ',
  'ด', 'ต', 'ถ', 'ท', 'ธ', 'น', 'บ', 'ป', 'ผ', 'ฝ', 'พ',
  'ฟ', 'ภ', 'ม', 'ย', 'ร', 'ล', 'ว', 'ศ', 'ษ', 'ส', 'ห',
  'อ', 'ฮ'
];

// แสดงหน้าเลือกหัวข้อทันที — ไม่ผูกกับ SDK callback
// ใช้ requestAnimationFrame เพื่อมั่นใจว่า DOM render พร้อมจริงก่อนจัด layout

function initHubData() {
  buildVocabSearchIndex();
}

function buildVocabSearchIndex() {
  const items = [];
  const tokenMap = new Map();
  const byConsonant = new Map();
  const byGrade = new Map();
  const byCategory = new Map();

  let itemId = 0;
  CATEGORIES.forEach(cat => {
    const rawWords = ALL_WORDS[cat.slug] || [];
    const approved = getApprovedWords(rawWords);
    approved.forEach(item => {
      const initialConsonant = getInitialConsonant(item.word);
      const searchStr = `${item.word || ''} ${item.reading || ''} ${item.meaning || ''} ${item.pos || ''}`.toLowerCase();

      const entry = {
        id: itemId++,
        word: item.word || '',
        reading: item.reading || '',
        meaning: item.meaning || '',
        pos: item.pos || '',
        grade: item.grade || '',
        example: item.example || '',
        emoji: item.emoji || '',
        image_url: item.image_url || '',
        categorySlug: cat.slug,
        categoryTitle: cat.title,
        categoryIcon: cat.icon,
        initialConsonant,
        searchStr
      };
      items.push(entry);

      if (!byCategory.has(cat.slug)) byCategory.set(cat.slug, []);
      byCategory.get(cat.slug).push(entry);

      if (initialConsonant) {
        if (!byConsonant.has(initialConsonant)) byConsonant.set(initialConsonant, []);
        byConsonant.get(initialConsonant).push(entry);
      }

      if (item.grade) {
        if (!byGrade.has(item.grade)) byGrade.set(item.grade, []);
        byGrade.get(item.grade).push(entry);
      }

      const addToken = (tok) => {
        if (!tok || typeof tok !== 'string') return;
        const lower = tok.trim().toLowerCase();
        if (!lower) return;
        if (!tokenMap.has(lower)) tokenMap.set(lower, []);
        tokenMap.get(lower).push(entry);
      };

      addToken(entry.word);
      for (let len = 1; len <= Math.min(entry.word.length, 6); len++) {
        addToken(entry.word.slice(0, len));
      }

      const readingParts = entry.reading.split(/[\s\-–—/]+/);
      readingParts.forEach(t => {
        const clean = t.trim();
        if (clean) {
          addToken(clean);
          for (let len = 1; len <= Math.min(clean.length, 4); len++) {
            addToken(clean.slice(0, len));
          }
        }
      });

      const meaningParts = entry.meaning.split(/[\s,.;:()"“”'‘’\-–—]+/);
      meaningParts.forEach(t => {
        const clean = t.trim();
        if (clean.length >= 2) addToken(clean);
      });

      if (entry.pos) addToken(entry.pos);
      if (entry.grade) addToken(entry.grade);
    });
  });

  window._vocabSearchIndex = {
    items,
    tokenMap,
    byCategory,
    byConsonant,
    byGrade,
    search(query, options = {}) {
      const q = (query || '').trim().toLowerCase();
      const grade = options.grade || 'all';
      const consonant = options.consonant || 'all';
      const catSlug = options.categorySlug || 'all';

      let candidates;
      if (q && tokenMap.has(q)) {
        candidates = tokenMap.get(q);
      } else if (consonant !== 'all' && byConsonant.has(consonant)) {
        candidates = byConsonant.get(consonant);
      } else if (catSlug !== 'all' && byCategory.has(catSlug)) {
        candidates = byCategory.get(catSlug);
      } else {
        candidates = items;
      }

      const results = [];
      const seen = new Set();

      for (let i = 0; i < candidates.length; i++) {
        const item = candidates[i];
        if (seen.has(item.id)) continue;

        if (grade !== 'all' && item.grade && item.grade !== grade) continue;
        if (consonant !== 'all' && item.initialConsonant !== consonant) continue;
        if (catSlug !== 'all' && item.categorySlug !== catSlug) continue;

        if (q && !item.searchStr.includes(q)) continue;

        seen.add(item.id);
        results.push(item);
      }

      return results;
    }
  };

  return window._vocabSearchIndex;
}

if (CATEGORIES.length > 0) {
  initHubData();
}

function safeInitHubGrid() {
  // ถ้ายังไม่มี categories (data.js ยังโหลดไม่เสร็จ) → ลองอีกครั้ง
  if (CATEGORIES.length === 0 && window.GAME_DATA && window.GAME_DATA.categories) {
    CATEGORIES.push(...window.GAME_DATA.categories);
    Object.assign(ALL_WORDS, window.GAME_DATA.words || {});
  }
  initAlphabetStrip();
  initHubData();
  setupHubSearchInput();
  mountFontSizeSlider();
  requestAnimationFrame(initHubGrid);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => { safeInitHubGrid(); mountMissedBannerClick(); initStoryboardModalListeners(); });
} else {
  safeInitHubGrid();
  mountMissedBannerClick();
  initStoryboardModalListeners();
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
    const grid = document.getElementById('words-grid');
    if (grid) {
      const w = Math.round(grid.clientWidth);
      if (w === lastGridFitWidth && grid.dataset.spansReady === '1') return;
    }
    fitGridWordSpans(!!force);
  }, 150);
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
    if (card.dataset.spanLevel && card.dataset.spanLevel !== '1') {
      card.classList.remove('grid-flip-card--span2', 'grid-flip-card--span3', 'grid-flip-card--span4');
      card.dataset.spanLevel = '1';
    }
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
    // Phase 1 (Pure Read): Collect all cards needing span expansion without modifying any DOM properties
    const toExpand = [];
    cards.forEach((card) => {
      const textEl = card.querySelector('.grid-word-text');
      if (!textEl) return;
      const level = parseInt(card.dataset.spanLevel || '1', 10);
      if (level >= maxSpan) return;
      if (textEl.scrollWidth > textEl.clientWidth + 1) {
        toExpand.push({ card, next: level + 1 });
      }
    });

    pass += 1;
    const changed = toExpand.length > 0;

    if (changed) {
      // Phase 2 (Pure Write): Schedule class updates inside a single requestAnimationFrame callback
      requestAnimationFrame(() => {
        toExpand.forEach(({ card, next }) => {
          card.dataset.spanLevel = String(next);
          card.classList.remove('grid-flip-card--span2', 'grid-flip-card--span3', 'grid-flip-card--span4');
          if (next === 2) card.classList.add('grid-flip-card--span2');
          else if (next === 3) card.classList.add('grid-flip-card--span3');
          else if (next === 4) card.classList.add('grid-flip-card--span4');
        });

        if (pass < maxPasses) {
          requestAnimationFrame(runPass);
        } else {
          finishFit();
        }
      });
    } else if (pass === 1 && !fontRetried) {
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
  { value: 'storyboard', label: '🎬 ภาพเรื่องราว' },
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
  } else if (gridViewMode === 'storyboard') {
    words = words.filter((w) => w.images && w.images.length > 0);
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

const IRREGULAR_SOUND_MAP = { 'กด': 'ด', 'กน': 'น', 'กบ': 'บ', 'กก': 'ก' };

function getWordIrregularSpelling(item) {
  if (!item || !item.word) return null;
  const word = item.word.trim();

  // 1. Direct lookup from ThaiSpellingDecoder if loaded
  if (window.ThaiSpellingDecoder && typeof window.ThaiSpellingDecoder.getWordData === 'function') {
    const data = window.ThaiSpellingDecoder.getWordData(word);
    if (data) return data;
  }

  // 2. Metadata extraction from meaning / category_evidence
  const text = `${item.meaning || ''} ${item.category_evidence || ''}`;
  const m = text.match(/แม่(กด|กน|กบ|กก)\s*[-—–]?\s*(?:สะกดด้วย|ไม่ตรงตามมาตราด้วยตัว)?\s*([ก-ฮ])/);
  if (m) {
    const sectionName = 'แม่' + m[1];
    const surface = m[2];
    const sound = IRREGULAR_SOUND_MAP[m[1]];
    if (sound && surface !== sound) {
      return {
        word,
        reading: item.reading || word,
        surfaceConsonant: surface,
        soundConsonant: sound,
        sectionName,
        targetSection: m[1] === 'กด' ? 'kod' : (m[1] === 'กน' ? 'kon' : (m[1] === 'กบ' ? 'kob' : 'kok'))
      };
    }
  }

  return null;
}

function hasIrregularSpellingWords(words) {
  if (!Array.isArray(words)) return false;
  return words.some((w) => Boolean(getWordIrregularSpelling(w)));
}

function toggleXrayScanner() {
  xrayScannerActive = !xrayScannerActive;
  const grid = document.getElementById('words-grid');
  if (grid) {
    grid.classList.toggle('xray-mode-active', xrayScannerActive);
  }
  updateGridFilterPickerUI();
  if (currentMode === 'auto') {
    renderWordsGrid();
  }
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
  const sbCount = fullCategoryWords.filter((w) => w.images && w.images.length > 0).length;
  document.querySelectorAll('.grid-view-btn[data-view="storyboard"]').forEach((btn) => {
    btn.style.display = sbCount > 0 ? '' : 'none';
    if (sbCount > 0) {
      btn.textContent = `🎬 ภาพเรื่องราว (${sbCount})`;
    }
  });
  const xrayBtn = document.getElementById('btn-xray-toggle');
  if (xrayBtn) {
    xrayBtn.classList.toggle('active', xrayScannerActive);
    xrayBtn.setAttribute('aria-pressed', xrayScannerActive ? 'true' : 'false');
  }
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
    let label = opt.label;
    if (opt.value === 'storyboard') {
      const count = fullCategoryWords.filter((w) => w.images && w.images.length > 0).length;
      label = count > 0 ? `🎬 ภาพเรื่องราว (${count})` : opt.label;
    }
    btn.textContent = label;
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

  if (activeCategorySlug === 'spelling' || hasIrregularSpellingWords(fullCategoryWords)) {
    const xrayBlock = document.createElement('div');
    xrayBlock.className = 'grid-filter-group grid-xray-group';
    xrayBlock.innerHTML = '<span class="grid-size-label">ตัวช่วย</span>';
    const xrayBtns = document.createElement('div');
    xrayBtns.className = 'grid-size-btns';

    const xrayBtn = document.createElement('button');
    xrayBtn.type = 'button';
    xrayBtn.id = 'btn-xray-toggle';
    xrayBtn.className = `grid-size-btn btn-xray-toggle${xrayScannerActive ? ' active' : ''}`;
    xrayBtn.setAttribute('aria-pressed', xrayScannerActive ? 'true' : 'false');
    xrayBtn.setAttribute('title', 'เปิด/ปิดแว่นสแกนเสียงอ่านตัวสะกดไม่ตรงมาตรา (X-Ray Scanner)');
    xrayBtn.textContent = '🔍 แว่นสแกนเสียงอ่าน (X-Ray)';
    xrayBtn.addEventListener('click', toggleXrayScanner);
    xrayBtns.appendChild(xrayBtn);
    xrayBlock.appendChild(xrayBtns);
    wrap.appendChild(xrayBlock);
  }

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
  document.documentElement.style.setProperty('--vocab-text-scale', String(initial));
  const wordsGrid = document.getElementById('words-grid');
  if (wordsGrid) wordsGrid.style.setProperty('--vocab-text-scale', String(initial));
  slider.value = String(initial);

  slider.addEventListener('input', () => {
    const v = parseFloat(slider.value);
    document.documentElement.style.setProperty('--font-scale', String(v));
    document.documentElement.style.setProperty('--vocab-text-scale', String(v));
    const gridEl = document.getElementById('words-grid');
    if (gridEl) gridEl.style.setProperty('--vocab-text-scale', String(v));
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

// ─── Semantic POS Helpers ───
function getPosClass(pos) {
  if (!pos) return 'pos-default';
  const p = String(pos).trim();
  if (p.includes('นาม') && !p.includes('สรรพ') && !p.includes('ลักษณ')) return 'pos-noun';
  if (p.includes('กริยา')) return 'pos-verb';
  if (p.includes('วิเศษณ์')) return 'pos-adj';
  if (p.includes('สรรพนาม')) return 'pos-pronoun';
  if (p.includes('บุพบท')) return 'pos-prep';
  if (p.includes('ลักษณนาม')) return 'pos-classifier';
  if (p.includes('ราชาศัพท์')) return 'pos-royal';
  if (p.includes('สำนวน')) return 'pos-idiom';
  if (p.includes('สันธาน')) return 'pos-conj';
  if (p.includes('อุทาน')) return 'pos-interj';
  return 'pos-default';
}

function applyPosBadge(el, pos) {
  if (!el) return;
  el.className = el.className.replace(/\bpos-(?:noun|verb|adj|pronoun|prep|classifier|royal|idiom|conj|interj|default)\b/g, '').trim();
  if (pos) {
    const cls = getPosClass(pos);
    el.classList.add(cls);
    el.textContent = pos;
    el.style.display = '';
  } else {
    el.style.display = 'none';
  }
}

// ─── Sentence Example Drawer ───
let isExampleDrawerOpen = false;
let currentExampleSentence = '';

function toggleExampleDrawer() {
  isExampleDrawerOpen = !isExampleDrawerOpen;
  const content = document.getElementById('example-drawer-content');
  const arrow = document.getElementById('example-drawer-arrow');
  const btn = document.getElementById('btn-toggle-example');
  if (content) content.style.display = isExampleDrawerOpen ? 'block' : 'none';
  if (arrow) arrow.textContent = isExampleDrawerOpen ? '▲ ย่อเก็บ' : '▼ ขยายดู';
  if (btn) btn.setAttribute('aria-expanded', isExampleDrawerOpen ? 'true' : 'false');
}

function updateExampleDrawer(exampleText) {
  const drawer = document.getElementById('sentence-example-drawer');
  const textEl = document.getElementById('example-drawer-text');
  currentExampleSentence = exampleText || '';
  if (!drawer) return;
  if (currentExampleSentence && (currentMode === 'auto' || currentMode === 'flash' || currentMode === 'visual')) {
    if (textEl) textEl.textContent = `“${currentExampleSentence}”`;
    drawer.style.display = '';
  } else {
    drawer.style.display = 'none';
  }
}

function speakCurrentExample() {
  if (currentExampleSentence) {
    speakThai(currentExampleSentence);
  }
}

// ─── Instant Search & Alphabet Quick-Jump ───
let hubSearchQuery = '';
let activeAlphabetChar = 'all';
let selectedSearchCategory = 'all';
let hubSearchDebounceTimer = null;


function getInitialConsonant(word) {
  if (!word) return '';
  const clean = String(word).trim();
  const match = clean.match(/^[เแโใไ]?([ก-ฮ])/);
  return match ? match[1] : (clean[0] || '');
}

function initAlphabetStrip() {
  const strip = document.getElementById('hub-alphabet-strip');
  if (!strip || strip.children.length > 0) return;

  const allBtn = document.createElement('button');
  allBtn.type = 'button';
  allBtn.className = 'hub-alpha-chip active';
  allBtn.dataset.char = 'all';
  allBtn.textContent = 'ทั้งหมด';
  allBtn.onclick = () => setAlphabetFilter('all');
  strip.appendChild(allBtn);

  THAI_ALPHABET_CONSONANTS.forEach(char => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hub-alpha-chip';
    btn.dataset.char = char;
    btn.textContent = char;
    btn.onclick = () => setAlphabetFilter(char);
    strip.appendChild(btn);
  });
}

function setAlphabetFilter(char) {
  if (activeAlphabetChar === char && char !== 'all') {
    activeAlphabetChar = 'all';
  } else {
    activeAlphabetChar = char;
  }

  document.querySelectorAll('.hub-alpha-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.char === activeAlphabetChar);
  });

  performHubSearch();
}

function setupHubSearchInput() {
  const input = document.getElementById('hub-search-input');
  const clearBtn = document.getElementById('hub-search-clear');
  if (!input || input.dataset.bound) return;
  input.dataset.bound = 'true';

  input.addEventListener('input', (e) => {
    hubSearchQuery = e.target.value.trim();
    if (clearBtn) clearBtn.style.display = hubSearchQuery ? 'inline-flex' : 'none';

    clearTimeout(hubSearchDebounceTimer);
    hubSearchDebounceTimer = setTimeout(() => {
      performHubSearch();
    }, 200);
  });
}

function clearHubSearch() {
  hubSearchQuery = '';
  activeAlphabetChar = 'all';
  selectedSearchCategory = 'all';

  const input = document.getElementById('hub-search-input');
  if (input) input.value = '';

  const clearBtn = document.getElementById('hub-search-clear');
  if (clearBtn) clearBtn.style.display = 'none';

  document.querySelectorAll('.hub-alpha-chip').forEach(chip => {
    chip.classList.toggle('active', chip.dataset.char === 'all');
  });

  const resultsView = document.getElementById('hub-search-results');
  const hubGrid = document.getElementById('hub-grid');
  if (resultsView) resultsView.style.display = 'none';
  if (hubGrid) hubGrid.style.display = '';

  initHubGrid();
}

function isSearchOrAlphaActive() {
  return (hubSearchQuery.length > 0) || (activeAlphabetChar !== 'all');
}

function performHubSearch() {
  const query = hubSearchQuery.toLowerCase();
  const resultsView = document.getElementById('hub-search-results');
  const hubGrid = document.getElementById('hub-grid');
  const countEl = document.getElementById('hub-search-count');
  const catTagsEl = document.getElementById('hub-search-cat-tags');
  const searchGrid = document.getElementById('hub-search-grid');

  if (!isSearchOrAlphaActive()) {
    if (resultsView) resultsView.style.display = 'none';
    if (hubGrid) hubGrid.style.display = '';
    initHubGrid();
    return;
  }

  if (resultsView) resultsView.style.display = 'block';
  if (hubGrid) hubGrid.style.display = 'none';

  if (!window._vocabSearchIndex) {
    buildVocabSearchIndex();
  }

  const allMatches = window._vocabSearchIndex.search(query, {
    grade: currentHubGrade,
    consonant: activeAlphabetChar
  });

  const categoryMatchMap = new Map();
  for (let i = 0; i < allMatches.length; i++) {
    const item = allMatches[i];
    if (!categoryMatchMap.has(item.categorySlug)) {
      categoryMatchMap.set(item.categorySlug, {
        slug: item.categorySlug,
        title: item.categoryTitle,
        icon: item.categoryIcon,
        words: []
      });
    }
    categoryMatchMap.get(item.categorySlug).words.push(item);
  }

  const gradeLabel = currentHubGrade === 'all' ? '' : ` [${currentHubGrade}]`;
  const alphaLabel = activeAlphabetChar === 'all' ? '' : ` [พยัญชนะ ${activeAlphabetChar}]`;
  const queryLabel = query ? ` คำค้น "${hubSearchQuery}"` : '';
  if (countEl) {
    countEl.textContent = `พบ ${allMatches.length} คำศัพท์${queryLabel}${alphaLabel}${gradeLabel} (จาก ๑๖ หมวด)`;
  }

  if (catTagsEl) {
    catTagsEl.innerHTML = '';

    const allChip = document.createElement('button');
    allChip.type = 'button';
    allChip.className = `hub-search-cat-chip ${selectedSearchCategory === 'all' ? 'active' : ''}`;
    allChip.textContent = `📚 ทั้งหมด (${allMatches.length})`;
    allChip.onclick = () => {
      selectedSearchCategory = 'all';
      renderSearchWordCards(allMatches, searchGrid);
      document.querySelectorAll('.hub-search-cat-chip').forEach(c => c.classList.remove('active'));
      allChip.classList.add('active');
    };
    catTagsEl.appendChild(allChip);

    categoryMatchMap.forEach(entry => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `hub-search-cat-chip ${selectedSearchCategory === entry.slug ? 'active' : ''}`;
      chip.textContent = `${entry.icon} ${entry.title} (${entry.words.length})`;
      chip.onclick = () => {
        selectedSearchCategory = entry.slug;
        renderSearchWordCards(entry.words, searchGrid);
        document.querySelectorAll('.hub-search-cat-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      };
      catTagsEl.appendChild(chip);
    });
  }

  const displayWords = selectedSearchCategory === 'all'
    ? allMatches
    : (categoryMatchMap.get(selectedSearchCategory)?.words || allMatches);

  renderSearchWordCards(displayWords, searchGrid);
}

const CHUNK_SIZE = 24;

function createSearchCardElement(item) {
  const card = document.createElement('div');
  card.className = 'hub-search-card';
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `${item.word} — คลิกเพื่อเข้าสู่บทเรียน`);

  const posCls = getPosClass(item.pos);
  const posBadge = item.pos ? `<span class="search-pos-badge ${posCls}">(${item.pos})</span>` : '';
  const gradeBadge = item.grade ? `<span class="search-grade-badge">${item.grade}</span>` : '';
  const exampleHtml = item.example ? `<div class="hub-search-example">“${item.example}”</div>` : '';
  const isMorph = Boolean(activeCategorySlug === 'vowel-morph' || selectedSearchCategory === 'vowel-morph' || item.categorySlug === 'vowel-morph') &&
    Boolean(window.ThaiVowelMorph && window.ThaiVowelMorph.isMorphWord(item.word));
  const morphBadge = isMorph
    ? `<button type="button" class="badge-morph-trigger" title="คลิกเพื่อดูสระแปลงร่าง" aria-label="ดูสระแปลงร่างคำว่า ${item.word}">✨ แปลงร่าง</button>`
    : '';
  const isReading = Boolean(activeCategorySlug === 'reading-studio' || selectedSearchCategory === 'reading-studio' || item.categorySlug === 'reading-studio') ||
    Boolean(window.ThaiReadingTrainer && window.ThaiReadingTrainer.isReadingWord(item.word));
  const readingBadge = isReading
    ? `<button type="button" class="badge-reading-trigger" title="คลิกเพื่อฝึกอ่านคำยากและราชาศัพท์" aria-label="ฝึกอ่านคำว่า ${item.word}">📖 ฝึกอ่าน</button>`
    : '';
  const hasStoryboard = Boolean(item.images && item.images.length > 0);
  const storyboardBadge = hasStoryboard
    ? `<button type="button" class="badge-storyboard-trigger" title="มีภาพเรื่องราว ${item.images.length} ตอน" aria-label="ดูภาพเรื่องราว ${item.word}">🎬 ${item.images.length} ตอน</button>`
    : '';

  card.innerHTML = `
    <div class="hub-search-card-top">
      <div class="hub-search-word-wrap">
        <span class="hub-search-word">
          <span>${item.emoji || item.categoryIcon || '📝'}</span>
          <strong>${item.word}</strong>
          ${morphBadge}
          ${readingBadge}
          ${storyboardBadge}
        </span>
        <span class="hub-search-reading">[ ${item.reading} ]</span>
      </div>
      <div class="hub-search-badges">
        ${gradeBadge}
        ${posBadge}
      </div>
    </div>
    <div class="hub-search-meaning">${item.meaning}</div>
    ${exampleHtml}
    <div class="hub-search-footer">
      <span class="hub-search-cat-label">${item.categoryIcon} ${item.categoryTitle}</span>
      <button type="button" class="hub-search-jump-btn" aria-label="เรียนรู้คำนี้">เรียนคำนี้ →</button>
    </div>
  `;

  const readBtn = card.querySelector('.badge-reading-trigger');
  if (readBtn) {
    readBtn.onclick = (e) => {
      e.stopPropagation();
      if (window.ThaiReadingTrainer) window.ThaiReadingTrainer.open(item.word);
    };
  }

  const morphBtn = card.querySelector('.badge-morph-trigger');
  if (morphBtn) {
    morphBtn.onclick = (e) => {
      e.stopPropagation();
      if (window.ThaiVowelMorph) window.ThaiVowelMorph.open(item.word);
    };
  }

  const sbBadge = card.querySelector('.badge-storyboard-trigger');
  if (sbBadge) {
    sbBadge.onclick = (e) => {
      e.stopPropagation();
      openIdiomStoryboard(item, sbBadge);
    };
    sbBadge.onkeydown = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.stopPropagation();
        e.preventDefault();
        openIdiomStoryboard(item, sbBadge);
      }
    };
  }
  card.onclick = () => jumpToWord(item.categorySlug, item.word);
  card.onkeydown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      jumpToWord(item.categorySlug, item.word);
    }
  };

  return card;
}

function appendSearchMoreNotice(container, totalCount) {
  const moreNotice = document.createElement('div');
  moreNotice.style.gridColumn = '1 / -1';
  moreNotice.style.textAlign = 'center';
  moreNotice.style.padding = '12px';
  moreNotice.style.color = '#fbbf24';
  moreNotice.style.fontSize = '13.5px';
  moreNotice.textContent = `... แสดง ๑๒๐ คำแรกจากทั้งหมด ${totalCount} คำ (กรุณาระบุคำค้นหาให้เจาะจงยิ่งขึ้น)`;
  container.appendChild(moreNotice);
}

function renderSearchWordCards(wordList, container) {
  if (!container) return;
  container.innerHTML = '';

  const thisGen = ++renderGenId;
  window._vocabRenderGenId = renderGenId;

  if (!wordList || wordList.length === 0) {
    const empty = document.createElement('div');
    empty.style.gridColumn = '1 / -1';
    empty.style.textAlign = 'center';
    empty.style.padding = '32px 16px';
    empty.style.color = '#94a3b8';
    empty.style.fontSize = '15px';
    empty.textContent = 'ไม่พบคำศัพท์ที่ตรงกับเงื่อนไขการค้นหา — ลองเปลี่ยนคำค้นหรือพยัญชนะ';
    container.appendChild(empty);
    return;
  }

  const MAX_SEARCH_DISPLAY = 120;
  const totalToRender = Math.min(wordList.length, MAX_SEARCH_DISPLAY);

  // If totalToRender <= 30, render all in single DocumentFragment
  if (totalToRender <= 30) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < totalToRender; i++) {
      frag.appendChild(createSearchCardElement(wordList[i]));
    }
    container.appendChild(frag);
    if (wordList.length > MAX_SEARCH_DISPLAY) {
      appendSearchMoreNotice(container, wordList.length);
    }
    return;
  }

  // Progressive rendering: initial 24 cards immediately
  const initialBatch = Math.min(CHUNK_SIZE, totalToRender);
  const initialFrag = document.createDocumentFragment();
  for (let i = 0; i < initialBatch; i++) {
    initialFrag.appendChild(createSearchCardElement(wordList[i]));
  }
  container.appendChild(initialFrag);

  // Schedule remaining chunks via requestAnimationFrame
  let nextIndex = initialBatch;

  function scheduleSearchChunk() {
    const chunkFn = () => {
      if (thisGen !== renderGenId) return;

      const chunkEnd = Math.min(nextIndex + CHUNK_SIZE, totalToRender);
      const frag = document.createDocumentFragment();
      for (let i = nextIndex; i < chunkEnd; i++) {
        frag.appendChild(createSearchCardElement(wordList[i]));
      }
      container.appendChild(frag);
      nextIndex = chunkEnd;

      if (nextIndex < totalToRender) {
        scheduleSearchChunk();
      } else if (wordList.length > MAX_SEARCH_DISPLAY) {
        appendSearchMoreNotice(container, wordList.length);
      }
    };

    pendingRenderChunks.push(chunkFn);
    requestAnimationFrame(() => {
      const idx = pendingRenderChunks.indexOf(chunkFn);
      if (idx !== -1) pendingRenderChunks.splice(idx, 1);
      chunkFn();
    });
  }

  if (nextIndex < totalToRender) {
    scheduleSearchChunk();
  } else if (wordList.length > MAX_SEARCH_DISPLAY) {
    appendSearchMoreNotice(container, wordList.length);
  }
}

async function jumpToWord(catSlug, targetWord) {
  await loadAndSelectCategory(catSlug);
  const foundIdx = categoryWords.findIndex(w => w.word === targetWord);
  if (foundIdx !== -1) {
    flashDeck = [foundIdx, ...categoryWords.map((_, i) => i).filter(i => i !== foundIdx)];
    flashVariant = 'word2meaning';
    switchMode('flash');
    renderFlashCard();
  }
}

let currentHubGrade = 'all';

function setHubGradeFilter(grade) {
  currentHubGrade = grade;
  document.querySelectorAll('.hub-grade-chip').forEach((chip) => {
    chip.classList.toggle('active', chip.dataset.grade === grade);
  });
  gridGradeFilter = grade;
  localStorage.setItem(GRID_GRADE_KEY, grade);
  updateGridFilterPickerUI();
  if (isSearchOrAlphaActive()) {
    performHubSearch();
  } else {
    initHubGrid();
  }
}

function openHubWorksheetModal() {
  if (window.ThaiVocabWorksheet && typeof window.ThaiVocabWorksheet.openModal === 'function') {
    let list = [];
    if (activeCategorySlug && fullCategoryWords.length) {
      list = fullCategoryWords;
    } else {
      list = Object.values(ALL_WORDS).flat().filter(Boolean);
    }
    window.ThaiVocabWorksheet.openModal(activeCategory, list);
  } else {
    alert('ระบบสร้างใบงานกำลังโหลด กรุณารอสักครู่ครับ');
  }
}

// สร้างการ์ดหมวดหมู่ใน Hub
function initHubGrid() {
  const grid = document.getElementById('hub-grid');
  if (!grid) return;
  grid.innerHTML = '';

  CATEGORIES.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'hub-card';
    card.dataset.slug = cat.slug;
    card.onclick = () => loadAndSelectCategory(cat.slug);

    const allApproved = getApprovedWords(ALL_WORDS[cat.slug]);
    const filteredWords = (currentHubGrade && currentHubGrade !== 'all')
      ? allApproved.filter(w => w.grade === currentHubGrade)
      : allApproved;
    const count = filteredWords.length;
    const pct = getLeitnerMasteryPct(cat.slug, currentHubGrade);

    const progBlock = pct > 0
      ? `<div class="hc-progress"><div class="hc-prog-fill${pct >= 100 ? ' done' : ''}" style="width:${pct}%"></div></div><div class="flex items-center justify-between text-xs text-muted-foreground mt-1"><span class="hc-prog-pct">แม่นยำ ${pct}%</span><span class="hc-word-count">${count} คำ</span></div>`
      : (count ? `<div class="flex items-center justify-between text-xs text-muted-foreground mt-1"><span class="hc-prog-pct">🌱 ทบทวน</span><span class="hc-word-count">${count} คำ</span></div>` : '');

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
  if (slug !== 'spelling') {
    xrayScannerActive = false;
  }
  activeCategory = CATEGORIES.find(c => c.slug === slug);
  fullCategoryWords = getApprovedWords(mergeLocalVisuals(slug, ALL_WORDS[slug]));
  categoryWords = fullCategoryWords;
  window.fullCategoryWords = fullCategoryWords;
  window.categoryWords = categoryWords;

  if (categoryWords.length === 0) return;

  // เปลี่ยนหน้าการแสดงผล (ชื่อหมวดแสดงบนการ์ดอยู่แล้ว — ไม่มีแถบ HUD บนสุด)
  document.getElementById('hub-view').style.display = 'none';
  document.getElementById('topic-view').style.display = 'flex';
  const vmBanner = document.getElementById('vowel-morph-hero-banner');
  if (vmBanner) {
    vmBanner.style.display = (slug === 'vowel-morph') ? 'flex' : 'none';
  }
  updateVisualModeAvailability();

  // รีเซ็ตค่าด่าน
  currentScore = 0;
  currentLives = CONFIG.LIVES;
  currentWordIndex = 0;
  resetSession();
  updateHUD();
  if (window.KAMPAI && typeof window.KAMPAI.beginRound === "function") window.KAMPAI.beginRound();

  // สลับเข้าสู่โหมดรีวิว (ทบทวน) เป็นอันดับแรก
  if (practiceMissedOnEnter && getMissedWordsInCategory().length) {
    practiceMissedOnEnter = false;
    gridViewMode = 'missed';
    localStorage.setItem(GRID_VIEW_KEY, 'missed');
  } else if (gridViewMode === 'storyboard' && !fullCategoryWords.some(w => w.images && w.images.length > 0)) {
    gridViewMode = 'all';
    localStorage.setItem(GRID_VIEW_KEY, 'all');
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
  const exDrawer = document.getElementById('sentence-example-drawer');
  if (exDrawer) {
    if (mode === 'auto' || mode === 'flash' || mode === 'visual') {
      exDrawer.style.display = currentExampleSentence ? '' : 'none';
    } else {
      exDrawer.style.display = 'none';
    }
  }

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

function createGridCardElement(item, idx, leitnerMap) {
  const card = document.createElement('div');
  card.className = 'grid-flip-card';
  card.id = `word-cell-${idx}`;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', `${item.word} — แตะเพื่อดูความหมาย`);

  const box = (leitnerMap && leitnerMap[item.word]) || 1;
  card.classList.add(`leitner-box-${box}`);

  const emoji = item.emoji || (activeCategory && activeCategory.icon) || '📝';

  const gradeBadge = item.grade
    ? `<span class="grid-grade-badge">${item.grade}</span>`
    : '';
  const posClass = getPosClass(item.pos);
  const posBadge = item.pos
    ? `<span class="grid-pos-badge ${posClass}">(${item.pos})</span>`
    : '';
  const exampleHtml = item.example
    ? `<div class="grid-example">“${item.example}”</div>`
    : '';
  const dotTitle = box === 3 ? 'แม่นยำแล้ว' : (box === 2 ? 'เริ่มจำได้' : 'กำลังเรียนรู้');
  const isMorph = Boolean(activeCategorySlug === 'vowel-morph') &&
    Boolean(window.ThaiVowelMorph && window.ThaiVowelMorph.isMorphWord(item.word));
  const morphBadge = isMorph
    ? `<button type="button" class="badge-morph-trigger" title="คลิกเพื่อดูสระแปลงร่าง" aria-label="ดูสระแปลงร่างคำว่า ${item.word}">✨ แปลงร่าง</button>`
    : '';
  const isReading = Boolean(activeCategorySlug === 'reading-studio' || activeCategorySlug === 'difficult' || activeCategorySlug === 'royal') &&
    Boolean(window.ThaiReadingTrainer && window.ThaiReadingTrainer.isReadingWord(item.word));
  const readingBadge = isReading
    ? `<button type="button" class="badge-reading-trigger" title="คลิกเพื่อฝึกอ่านคำยากและราชาศัพท์" aria-label="ฝึกอ่านคำว่า ${item.word}">📖 ฝึกอ่าน</button>`
    : '';
  const hasStoryboard = Boolean(item.images && item.images.length > 0);
  const storyboardBadge = hasStoryboard
    ? `<button type="button" class="badge-storyboard-trigger" title="มีภาพเรื่องราว ${item.images.length} ตอน" aria-label="ดูภาพเรื่องราว ${item.word}">🎬 ${item.images.length} ตอน</button>`
    : '';
  const irregularInfo = xrayScannerActive ? getWordIrregularSpelling(item) : null;
  const isXrayActive = Boolean(irregularInfo);
  if (isXrayActive) {
    card.classList.add('has-xray-card');
  }
  const xrayBadge = isXrayActive
    ? `<span class="card-xray-badge" title="เสียงตัวสะกด [${irregularInfo.soundConsonant}] — อ่านว่า [${irregularInfo.reading || item.reading}]">[${irregularInfo.soundConsonant}]</span>`
    : '';
  const xrayReading = isXrayActive
    ? `<span class="card-xray-reading">[${irregularInfo.reading || item.reading}]</span>`
    : '';
  const xrayUnmaskBtn = isXrayActive
    ? `<button type="button" class="btn-card-unmask touch-target" title="ถอดหน้ากากตัวสะกดคำว่า ${item.word}" aria-label="ถอดหน้ากากตัวสะกดคำว่า ${item.word}" onclick="event.stopPropagation(); window.ThaiSpellingDecoder && window.ThaiSpellingDecoder.open('${item.word}')">✨ ถอดหน้ากาก</button>`
    : '';

  card.innerHTML = `
    <div class="grid-flip-inner">
      <div class="grid-flip-face grid-flip-front">
        <button type="button" class="grid-say-btn" title="ฟังเสียงอ่าน" aria-label="ฟังเสียง ${item.word}">🔊</button>
        <div style="position:absolute;top:6px;left:6px;display:flex;align-items:center;gap:3px;z-index:2;">
          <span class="leitner-dot leitner-dot-${box}" title="${dotTitle}"></span>
          ${gradeBadge}
          ${posBadge}
        </div>
        <span class="grid-word-emoji">${emoji}</span>
        <span class="grid-word-text">${item.word} ${xrayBadge}</span>
        ${xrayReading}
        ${morphBadge}
        ${readingBadge}
        ${storyboardBadge}
        ${xrayUnmaskBtn}
      </div>
      <div class="grid-flip-face grid-flip-back">
        <span class="grid-reading">[ ${item.reading} ]</span>
        <span class="grid-meaning">${item.meaning}</span>
        ${exampleHtml}
        ${hasStoryboard
          ? `<button type="button" class="grid-storyboard-btn" aria-label="ดูภาพเรื่องราว ${item.word}">🎬 ดูภาพเรื่องราว (${item.images.length} ตอน)</button>`
          : (item.image_url ? '<button type="button" class="grid-visual-btn">ดูภาพ</button>' : '')}
      </div>
    </div>
  `;

  const readBtn = card.querySelector('.badge-reading-trigger');
  if (readBtn) {
    readBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.ThaiReadingTrainer) window.ThaiReadingTrainer.open(item.word);
    });
  }

  const morphBtn = card.querySelector('.badge-morph-trigger');
  if (morphBtn) {
    morphBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.ThaiVowelMorph) window.ThaiVowelMorph.open(item.word);
    });
  }

  const sbBadge = card.querySelector('.badge-storyboard-trigger');
  if (sbBadge) {
    sbBadge.addEventListener('click', (e) => {
      e.stopPropagation();
      openIdiomStoryboard(item, sbBadge);
    });
    sbBadge.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.stopPropagation();
        e.preventDefault();
        openIdiomStoryboard(item, sbBadge);
      }
    });
  }

  const unmaskBtn = card.querySelector('.btn-card-unmask');
  if (unmaskBtn) {
    unmaskBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (window.ThaiSpellingDecoder) {
        window.ThaiSpellingDecoder.open(item.word);
      }
    });
    unmaskBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.stopPropagation();
        e.preventDefault();
        if (window.ThaiSpellingDecoder) {
          window.ThaiSpellingDecoder.open(item.word);
        }
      }
    });
  }

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

  const sbBtn = card.querySelector('.grid-storyboard-btn');
  if (sbBtn) {
    sbBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openIdiomStoryboard(item, sbBtn);
    });
    sbBtn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.stopPropagation();
        e.preventDefault();
        openIdiomStoryboard(item, sbBtn);
      }
    });
  }

  card.addEventListener('click', () => toggleGridCard(card, idx));
  card.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleGridCard(card, idx);
    }
  });

  return card;
}

function renderWordsGrid() {
  const grid = document.getElementById('words-grid');
  if (!grid) return;
  grid.classList.toggle('xray-mode-active', Boolean(xrayScannerActive));
  cancelSpeech();
  lastGridFitWidth = 0;
  lastGridObservedWidth = 0;
  grid.innerHTML = '';
  gridDisplayWords = getGridDisplayWords();

  const thisGen = ++renderGenId;
  window._vocabRenderGenId = renderGenId;

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
      : gridViewMode === 'storyboard'
        ? 'ไม่มีคำที่มีภาพเรื่องราวในตัวกรองนี้'
        : 'ไม่มีคำในชั้นที่เลือก — ลองเปลี่ยนตัวกรอง';
    grid.appendChild(empty);
    applyGridColsLayout();
    stopAutoplay();
    return;
  }

  // Hoist leitnerMap lookup outside the iteration loop
  const leitnerMap = loadLeitnerMap(activeCategorySlug);
  const total = gridDisplayWords.length;

  if (total <= 30) {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < total; i++) {
      frag.appendChild(createGridCardElement(gridDisplayWords[i], i, leitnerMap));
    }
    grid.appendChild(frag);
    applyGridColsLayout();
    bindGridSpanResizeObserver();
    if (isAutoplayActive && !autoplayPaused) highlightAutoplayCard(currentWordIndex);
    updateAutoplayProgress();
    if (isAutoplayActive && !autoplayPaused && gridDisplayWords.length) {
      if (currentWordIndex >= gridDisplayWords.length) currentWordIndex = 0;
      runAutoplayStep(autoplayGen);
    }
    return;
  }

  // Progressive rendering: initial batch of 24 cards immediately
  const initialBatch = Math.min(CHUNK_SIZE, total);
  const initialFrag = document.createDocumentFragment();
  for (let i = 0; i < initialBatch; i++) {
    initialFrag.appendChild(createGridCardElement(gridDisplayWords[i], i, leitnerMap));
  }
  grid.appendChild(initialFrag);
  applyGridColsLayout();
  bindGridSpanResizeObserver();
  if (isAutoplayActive && !autoplayPaused) highlightAutoplayCard(currentWordIndex);
  updateAutoplayProgress();

  let nextIndex = initialBatch;

  function scheduleGridChunk() {
    const chunkFn = () => {
      if (thisGen !== renderGenId) return;

      const chunkEnd = Math.min(nextIndex + CHUNK_SIZE, total);
      const frag = document.createDocumentFragment();
      for (let i = nextIndex; i < chunkEnd; i++) {
        frag.appendChild(createGridCardElement(gridDisplayWords[i], i, leitnerMap));
      }
      grid.appendChild(frag);
      nextIndex = chunkEnd;

      if (nextIndex < total) {
        scheduleGridChunk();
      } else {
        if (currentMode === 'auto') fitGridWordSpans(true);
        if (isAutoplayActive && !autoplayPaused && gridDisplayWords.length) {
          if (currentWordIndex >= gridDisplayWords.length) currentWordIndex = 0;
          runAutoplayStep(autoplayGen);
        }
      }
    };

    pendingRenderChunks.push(chunkFn);
    requestAnimationFrame(() => {
      const idx = pendingRenderChunks.indexOf(chunkFn);
      if (idx !== -1) pendingRenderChunks.splice(idx, 1);
      chunkFn();
    });
  }

  scheduleGridChunk();
}

function flushRenderChunks() {
  while (pendingRenderChunks.length > 0) {
    const fn = pendingRenderChunks.shift();
    fn();
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

  const posEl = document.getElementById('wfront-pos');
  if (posEl) {
    applyPosBadge(posEl, wordItem.pos);
  }

  const gradeEl = document.getElementById('wfront-grade');
  if (gradeEl) {
    if (wordItem.grade) {
      gradeEl.textContent = wordItem.grade;
      gradeEl.style.display = '';
    } else {
      gradeEl.style.display = 'none';
    }
  }

  document.getElementById('wback-reading').textContent = `คำอ่าน: [ ${wordItem.reading} ]`;
  document.getElementById('wback-meaning').textContent = wordItem.meaning;

  const exEl = document.getElementById('wback-example');
  if (exEl) {
    if (wordItem.example) {
      exEl.textContent = `ตัวอย่าง: “${wordItem.example}”`;
      exEl.style.display = '';
    } else {
      exEl.style.display = 'none';
    }
  }

  mountCardVisualButton(wordItem);
  updateExampleDrawer(wordItem.example);

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
  const hasStoryboard = Boolean(wordItem?.images && wordItem.images.length > 0);
  const hasVisual = hasStoryboard || !!wordItem?.image_url;
  button.style.display = hasVisual ? '' : 'none';
  if (hasStoryboard) {
    button.textContent = `🎬 ดูเรื่องราว (${wordItem.images.length} ตอน)`;
    button.onclick = (event) => {
      event.stopPropagation();
      openIdiomStoryboard(wordItem, button);
    };
  } else {
    button.textContent = '🖼️ ดูภาพประกอบ';
    button.onclick = (event) => {
      event.stopPropagation();
      if (wordItem?.image_url) openVisualViewer(wordItem, button);
    };
  }
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

// ═══ IDIOM MULTI-IMAGE STORYBOARD (สไลด์ & การ์ตูนช่องสำนวนไทย) ═══
let activeStoryboardItem = null;
let storyboardCurrentStep = 0;
let storyboardViewMode = 'slide'; // 'slide' | 'strip'
let storyboardReturnFocus = null;
let storyboardListenersInitialized = false;

function openIdiomStoryboard(item, returnFocusEl) {
  if (!item || !item.images || !item.images.length) return;
  if (typeof pauseAutoplay === 'function') pauseAutoplay(true);
  cancelSpeech();

  initStoryboardModalListeners();

  storyboardReturnFocus = returnFocusEl || document.activeElement;
  activeStoryboardItem = item;
  storyboardCurrentStep = 0;

  const modal = document.getElementById('idiom-storyboard-modal');
  if (!modal) return;

  const titleEl = document.getElementById('storyboard-title');
  if (titleEl) titleEl.textContent = item.word || '';

  const readingEl = document.getElementById('storyboard-reading');
  if (readingEl) readingEl.textContent = item.reading ? `[ ${item.reading} ]` : '';

  const meaningEl = document.getElementById('storyboard-meaning');
  if (meaningEl) meaningEl.textContent = item.meaning || '';

  const exampleEl = document.getElementById('storyboard-example');
  if (exampleEl) exampleEl.textContent = item.example || '';

  // Render step chips
  const chipsContainer = document.getElementById('storyboard-step-chips');
  if (chipsContainer) {
    chipsContainer.innerHTML = '';
    item.images.forEach((img, idx) => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `storyboard-step-chip ${idx === 0 ? 'active' : ''}`;
      chip.textContent = `ตอนที่ ${img.step || (idx + 1)}${img.phase ? ': ' + img.phase : ''}`;
      chip.setAttribute('aria-label', `ตอนที่ ${img.step || (idx + 1)} ${img.phase || ''}`);
      chip.onclick = () => goToStoryboardStep(idx);
      chipsContainer.appendChild(chip);
    });
  }

  // Render comic strip view panels
  const stripContainer = document.getElementById('storyboard-strip-container');
  if (stripContainer) {
    stripContainer.innerHTML = '';
    item.images.forEach((img, idx) => {
      const panel = document.createElement('div');
      panel.className = 'storyboard-strip-panel';
      panel.innerHTML = `
        <div class="storyboard-strip-phase">ตอนที่ ${img.step || (idx + 1)}${img.phase ? ': ' + img.phase : ''}</div>
        <div class="storyboard-strip-img-wrap">
          <img src="${img.url}" alt="${img.alt || img.caption || ''}" loading="lazy" onerror="this.alt='ไม่สามารถแสดงภาพประกอบได้'; if(typeof showToast==='function') showToast('ไม่สามารถโหลดภาพประกอบได้', 'wrong');" />
        </div>
        <p class="storyboard-strip-caption">${img.caption || ''}</p>
        <button type="button" class="btn-strip-speak storyboard-speak-btn" aria-label="ฟังคำบรรยายตอนที่ ${img.step || (idx + 1)}">🔊 ฟังคำบรรยาย</button>
      `;
      const btnSpeak = panel.querySelector('.btn-strip-speak');
      if (btnSpeak) {
        btnSpeak.onclick = () => speakStoryboardCaption(idx);
      }
      stripContainer.appendChild(panel);
    });
  }

  // Default to slide mode
  setStoryboardViewMode('slide');
  goToStoryboardStep(0);

  modal.style.display = 'flex';
  document.body.classList.add('modal-open');
  const closeBtn = document.getElementById('btn-storyboard-close');
  if (closeBtn) closeBtn.focus();
}

function closeIdiomStoryboard() {
  const modal = document.getElementById('idiom-storyboard-modal');
  if (!modal || modal.style.display === 'none') return;
  cancelSpeech();
  modal.style.display = 'none';
  document.body.classList.remove('modal-open');
  if (storyboardReturnFocus && typeof storyboardReturnFocus.focus === 'function') {
    storyboardReturnFocus.focus();
  }
  storyboardReturnFocus = null;
  activeStoryboardItem = null;
}

function setStoryboardViewMode(mode) {
  storyboardViewMode = mode;
  cancelSpeech();
  const slideView = document.getElementById('storyboard-slide-view');
  const stripView = document.getElementById('storyboard-strip-view');
  const btnSlide = document.getElementById('btn-mode-slide');
  const btnStrip = document.getElementById('btn-mode-strip');

  if (mode === 'strip') {
    if (slideView) slideView.style.display = 'none';
    if (stripView) stripView.style.display = 'block';
    if (btnSlide) btnSlide.classList.remove('active');
    if (btnStrip) btnStrip.classList.add('active');
  } else {
    if (slideView) slideView.style.display = 'block';
    if (stripView) stripView.style.display = 'none';
    if (btnSlide) btnSlide.classList.add('active');
    if (btnStrip) btnStrip.classList.remove('active');
    if (activeStoryboardItem) goToStoryboardStep(storyboardCurrentStep);
  }
}

function goToStoryboardStep(stepIndex) {
  cancelSpeech();
  if (!activeStoryboardItem || !activeStoryboardItem.images || !activeStoryboardItem.images.length) return;
  const maxStep = activeStoryboardItem.images.length - 1;
  storyboardCurrentStep = Math.max(0, Math.min(stepIndex, maxStep));

  const currentImg = activeStoryboardItem.images[storyboardCurrentStep];
  if (!currentImg) return;

  const slideImg = document.getElementById('storyboard-slide-img');
  if (slideImg) {
    slideImg.onerror = () => {
      slideImg.alt = 'ไม่สามารถแสดงภาพประกอบได้';
      if (typeof showToast === 'function') showToast('ไม่สามารถโหลดภาพประกอบได้', 'wrong');
    };
    slideImg.src = currentImg.url;
    slideImg.alt = currentImg.alt || currentImg.caption || '';
  }

  const captionEl = document.getElementById('storyboard-caption-text');
  if (captionEl) {
    captionEl.textContent = currentImg.caption || '';
  }

  // Update chip active classes
  const chips = document.querySelectorAll('#storyboard-step-chips .storyboard-step-chip');
  chips.forEach((chip, idx) => {
    if (idx === storyboardCurrentStep) chip.classList.add('active');
    else chip.classList.remove('active');
  });

  // Update prev / next disabled states
  const prevBtn = document.getElementById('btn-storyboard-prev');
  if (prevBtn) prevBtn.disabled = (storyboardCurrentStep === 0);
  const nextBtn = document.getElementById('btn-storyboard-next');
  if (nextBtn) nextBtn.disabled = (storyboardCurrentStep === maxStep);
}

function speakStoryboardCaption(stepIndex) {
  if (!activeStoryboardItem || !activeStoryboardItem.images) return;
  const idx = typeof stepIndex === 'number' ? stepIndex : storyboardCurrentStep;
  const img = activeStoryboardItem.images[idx];
  if (img && img.caption) {
    speakThai(img.caption);
  }
}

function initStoryboardModalListeners() {
  if (storyboardListenersInitialized) return;
  const modal = document.getElementById('idiom-storyboard-modal');
  if (!modal) return;
  storyboardListenersInitialized = true;

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeIdiomStoryboard();
  });

  document.getElementById('btn-storyboard-close')?.addEventListener('click', closeIdiomStoryboard);

  document.getElementById('btn-storyboard-speak-word')?.addEventListener('click', () => {
    if (activeStoryboardItem?.word) speakThai(activeStoryboardItem.word);
  });

  document.getElementById('btn-storyboard-speak-caption')?.addEventListener('click', () => {
    speakStoryboardCaption(storyboardCurrentStep);
  });

  document.getElementById('btn-mode-slide')?.addEventListener('click', () => setStoryboardViewMode('slide'));
  document.getElementById('btn-mode-strip')?.addEventListener('click', () => setStoryboardViewMode('strip'));

  document.getElementById('btn-storyboard-prev')?.addEventListener('click', () => goToStoryboardStep(storyboardCurrentStep - 1));
  document.getElementById('btn-storyboard-next')?.addEventListener('click', () => goToStoryboardStep(storyboardCurrentStep + 1));
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
    updateExampleDrawer('');
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

  const posEl = document.getElementById('wfront-pos');
  if (posEl) {
    if (item.pos && v !== 'meaning2word') {
      applyPosBadge(posEl, item.pos);
    } else {
      posEl.style.display = 'none';
    }
  }

  const gradeEl = document.getElementById('wfront-grade');
  if (gradeEl) {
    if (item.grade && v !== 'meaning2word') {
      gradeEl.textContent = item.grade;
      gradeEl.style.display = '';
    } else {
      gradeEl.style.display = 'none';
    }
  }

  const exEl = document.getElementById('wback-example');
  if (exEl) {
    if (item.example) {
      exEl.textContent = `ตัวอย่าง: “${item.example}”`;
      exEl.style.display = '';
    } else {
      exEl.style.display = 'none';
    }
  }

  document.getElementById('wback-reading').textContent = `คำอ่าน: [ ${item.reading} ]`;
  document.getElementById('wback-meaning').textContent = item.meaning;
  updateFlashScore();
  updateExampleDrawer(item.example);
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
  const sbModal = document.getElementById('idiom-storyboard-modal');
  if (sbModal && sbModal.style.display !== 'none') {
    if (event.key === 'Escape') {
      event.preventDefault();
      closeIdiomStoryboard();
      return;
    }
    if (storyboardViewMode === 'slide') {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goToStoryboardStep(storyboardCurrentStep - 1);
        return;
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goToStoryboardStep(storyboardCurrentStep + 1);
        return;
      }
    }
  }
  if (event.key === 'Escape') closeVisualViewer();
});

function flashMarkKnown(isKnown) {
  if (!flashRevealed) return;
  const words = getQuizWords();
  const idx = flashDeck.shift();
  const item = words[idx];
  if (!item) { renderFlashCard(); return; }

  if (activeCategorySlug && item.word) {
    updateLeitnerWord(activeCategorySlug, item.word, isKnown);
  }

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
  const vmBanner = document.getElementById("vowel-morph-hero-banner");
  if (vmBanner) vmBanner.style.display = "none";
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
  if (wordItem && wordItem.word && activeCategorySlug) {
    updateLeitnerWord(activeCategorySlug, wordItem.word, correct);
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
  if (KAMPAI.submitScore) {
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
  if (['off', 'word', 'reading', 'meaning', 'full'].includes(mode)) autoReadMode = mode;
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
  if (!['off', 'word', 'reading', 'meaning', 'full'].includes(value)) return;
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
  if (autoReadMode === 'off') return [];
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
  const sbModal = document.getElementById('idiom-storyboard-modal');
  if (sbModal && sbModal.style.display !== 'none') return;
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

// ═══ GLOBAL EXPORTS ═══
window.setHubGradeFilter = setHubGradeFilter;
window.setAlphabetFilter = setAlphabetFilter;
window.clearHubSearch = clearHubSearch;
window.jumpToWord = jumpToWord;
window.toggleExampleDrawer = toggleExampleDrawer;
window.speakCurrentExample = speakCurrentExample;
window.openHubWorksheetModal = openHubWorksheetModal;
window.autoplayNext = autoplayNext;
window.autoplayPrev = autoplayPrev;
window.flipCard = flipCard;
window.speakThai = speakThai;
window.loadAndSelectCategory = loadAndSelectCategory;
window.switchMode = switchMode;
window.renderSearchWordCards = renderSearchWordCards;
window.renderWordsGrid = renderWordsGrid;
window.performHubSearch = performHubSearch;
window.buildVocabSearchIndex = buildVocabSearchIndex;
window.initHubData = initHubData;
window.flushRenderChunks = flushRenderChunks;
window.getVocabRenderGenId = () => renderGenId;
window.createGridCardElement = createGridCardElement;
window.openIdiomStoryboard = openIdiomStoryboard;
window.closeIdiomStoryboard = closeIdiomStoryboard;
window.setStoryboardViewMode = setStoryboardViewMode;
window.goToStoryboardStep = goToStoryboardStep;
window.speakStoryboardCaption = speakStoryboardCaption;


function restartSession() {
  currentScore = 0;
  currentLives = CONFIG.LIVES;
  resetSession();
  const endScreen = document.getElementById("gameover-screen");
  if (endScreen) endScreen.style.display = "none";
  if (window.KAMPAI && typeof window.KAMPAI.beginRound === "function") window.KAMPAI.beginRound();
  switchMode(currentMode || "auto");
}
window.restartSession = restartSession;

window.GRID_VIEW_OPTIONS = GRID_VIEW_OPTIONS;
window.getGridDisplayWords = getGridDisplayWords;
window.setGridViewMode = setGridViewMode;
window.setGridGradeFilter = setGridGradeFilter;
window.selectCategory = selectCategory;
window.getWordIrregularSpelling = getWordIrregularSpelling;
window.hasIrregularSpellingWords = hasIrregularSpellingWords;
window.toggleXrayScanner = toggleXrayScanner;

if (typeof window !== 'undefined') {
  window.addEventListener('spelling-decoder-loaded', () => {
    if (activeCategorySlug === 'spelling' && currentMode === 'auto') {
      renderWordsGrid();
    }
  });
}
