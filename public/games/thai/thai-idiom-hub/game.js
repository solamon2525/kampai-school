/**
 * game.js — คลังสำนวนไทย ป.4–6 (Thai Idiom Interactive Lab)
 * สื่อการสอนภาษาไทยระดับประถมศึกษา โรงเรียนบ้านคำไผ่
 * ควบคุม 5 โหมดการเรียนรู้, ระบบ TTS, แผ่นป้ายปริศนา, และโหมดฉายหน้าห้องเรียน
 */

(function () {
  'use strict';

  const MEDIA_SLUG = 'thai-idiom-hub';

  // ─── DATA SOURCES ───────────────────────────────────────────────────────────
  const DATA = window.GAME_DATA || { categories: [], idioms: [] };
  const ALL_IDIOMS = DATA.idioms || [];
  const CATEGORIES = DATA.categories || [];

  // ─── STATE MANAGEMENT ───────────────────────────────────────────────────────
  const state = {
    mode: 'learn',
    category: 'all',
    decoderList: [...ALL_IDIOMS],
    decoderIndex: 0,
    scenarioIndex: 0,
    mysteryIndex: 0,
    mysteryOpenedTiles: new Set(),
    mysteryAnswered: false,
    chainIndex: 0,
    chainSlots: [],
    chainTokens: [],
    prepIndex: 0,
    prepReveals: { 1: false, 2: false, 3: false },
    isPresentation: false,
    fontScale: 1
  };

  // Helper DOM lookup
  const $ = (id) => document.getElementById(id);

  // ─── KAMPAI SDK INITIALIZATION ──────────────────────────────────────────────
  if (window.KAMPAI) {
    try {
      KAMPAI.setSlug(MEDIA_SLUG);
      if (KAMPAI.onReady) {
        KAMPAI.onReady(function () {
          // SDK ready
        });
      }
    } catch (e) {
      console.warn('SDK init error', e);
    }
  }

  // ─── AUDIO & TTS CONTROLS ───────────────────────────────────────────────────
  function speakText(text) {
    if (!text) return;
    try {
      if (window.KAMPAI && KAMPAI.sound && typeof KAMPAI.sound.speak === 'function') {
        KAMPAI.sound.speak(text, 'th-TH');
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'th-TH';
        u.rate = 0.95;
        window.speechSynthesis.speak(u);
      }
    } catch (e) {
      console.warn('Speech error', e);
    }
  }

  function stopAllSpeech() {
    try {
      if (window.KAMPAI && KAMPAI.sound && typeof KAMPAI.sound.stopSpeak === 'function') {
        KAMPAI.sound.stopSpeak();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } catch (_e) {}
  }

  function playSound(type) {
    try {
      if (window.KAMPAI && KAMPAI.sound) {
        if (type === 'correct' && KAMPAI.sound.correct) KAMPAI.sound.correct();
        else if (type === 'wrong' && KAMPAI.sound.wrong) KAMPAI.sound.wrong();
      }
    } catch (_e) {}
  }

  function showToast(msg) {
    const el = $('toast-msg');
    if (!el) return;
    el.innerText = msg;
    el.classList.add('show');
    clearTimeout(el._timer);
    el._timer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  // ─── MODE 1: VISUAL DECODER ─────────────────────────────────────────────────
  function updateDecoderFilter(cat) {
    state.category = cat;
    if (cat === 'all') {
      state.decoderList = [...ALL_IDIOMS];
    } else {
      state.decoderList = ALL_IDIOMS.filter((item) => item.category === cat);
    }
    state.decoderIndex = 0;
    renderDecoder();
  }

  function renderDecoder() {
    stopAllSpeech();
    const list = state.decoderList;
    if (!list || list.length === 0) return;

    if (state.decoderIndex < 0) state.decoderIndex = list.length - 1;
    if (state.decoderIndex >= list.length) state.decoderIndex = 0;

    const item = list[state.decoderIndex];
    if (!item) return;

    $('decoder-title').innerText = item.idiom;
    $('decoder-reading').innerText = item.reading;
    $('decoder-img').src = item.image;
    $('decoder-img').alt = 'ภาพประกอบสำนวน ' + item.idiom;
    $('decoder-literal').innerText = item.literalMeaning;
    $('decoder-figurative').innerText = item.figurativeMeaning;
    $('decoder-moral').innerText = item.moralLesson;
    $('decoder-example').innerText = `"${item.exampleSentence}"`;
    $('decoder-counter').innerText = `${state.decoderIndex + 1} / ${list.length}`;
  }

  // ─── MODE 2: SCENARIOS ──────────────────────────────────────────────────────
  function renderScenario() {
    stopAllSpeech();
    if (state.scenarioIndex < 0) state.scenarioIndex = ALL_IDIOMS.length - 1;
    if (state.scenarioIndex >= ALL_IDIOMS.length) state.scenarioIndex = 0;

    const item = ALL_IDIOMS[state.scenarioIndex];
    if (!item || !item.scenarioQuiz) return;

    const q = item.scenarioQuiz;
    $('scenario-cat').innerText = `หมวด: ${item.categoryLabel} (${item.grade})`;
    $('scenario-story-text').innerText = q.situation;
    $('scenario-counter').innerText = `${state.scenarioIndex + 1} / ${ALL_IDIOMS.length}`;

    const fb = $('scenario-feedback');
    fb.className = 'feedback-banner';
    fb.innerHTML = '';

    const container = $('scenario-choices');
    container.innerHTML = '';

    q.choices.forEach((choice, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';
      btn.innerHTML = `<span>${idx + 1}. ${choice}</span><span style="opacity:0.6;">➔</span>`;
      btn.onclick = () => checkScenarioAnswer(idx, q.correctIndex, q.explanation, btn);
      container.appendChild(btn);
    });
  }

  function checkScenarioAnswer(selectedIdx, correctIdx, explanation, btn) {
    const fb = $('scenario-feedback');
    const buttons = document.querySelectorAll('#scenario-choices .choice-btn');

    if (selectedIdx === correctIdx) {
      playSound('correct');
      btn.classList.add('correct');
      buttons.forEach((b) => (b.disabled = true));
      fb.className = 'feedback-banner show correct';
      fb.innerHTML = `<strong>✅ ถูกต้องยอดเยี่ยม!</strong><br>${explanation}`;
      speakText('ถูกต้องยอดเยี่ยม ' + explanation);
    } else {
      playSound('wrong');
      btn.classList.add('wrong');
      fb.className = 'feedback-banner show wrong';
      fb.innerHTML = `<strong>❌ ยังไม่ถูกต้อง</strong> ลองสังเกตบริบทในเนื้อเรื่องอีกครั้ง แล้วเลือกตอบใหม่อีกครั้งนะ`;
    }
  }

  // ─── MODE 3: PUZZLE & WORD CHAIN ───────────────────────────────────────────
  // 3.1 Mystery Grid Reveal
  function renderMystery() {
    stopAllSpeech();
    if (state.mysteryIndex < 0) state.mysteryIndex = ALL_IDIOMS.length - 1;
    if (state.mysteryIndex >= ALL_IDIOMS.length) state.mysteryIndex = 0;

    const item = ALL_IDIOMS[state.mysteryIndex];
    if (!item) return;

    state.mysteryOpenedTiles.clear();
    state.mysteryAnswered = false;

    $('mystery-img').src = item.image;
    $('mystery-counter').innerText = `${state.mysteryIndex + 1} / ${ALL_IDIOMS.length}`;

    // Reset tiles
    const tiles = document.querySelectorAll('#tiles-overlay .tile');
    tiles.forEach((t, i) => {
      t.classList.remove('opened');
      const clueEl = $('clue-' + i);
      if (clueEl && item.clues && item.clues[i]) {
        clueEl.innerText = item.clues[i];
      }
    });

    // Mystery choices (Target idiom + 3 random distractors)
    const choices = [item.idiom];
    const otherIdioms = ALL_IDIOMS.filter((it) => it.id !== item.id);
    const shuffled = [...otherIdioms].sort(() => 0.5 - Math.random());
    for (let i = 0; i < 3 && i < shuffled.length; i++) {
      choices.push(shuffled[i].idiom);
    }
    choices.sort(() => 0.5 - Math.random());

    const container = $('mystery-choices');
    container.innerHTML = '';
    const fb = $('mystery-feedback');
    fb.className = 'feedback-banner';
    fb.innerHTML = '';

    choices.forEach((choice) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'choice-btn';
      btn.innerText = choice;
      btn.onclick = () => checkMysteryAnswer(choice, item.idiom, item.figurativeMeaning, btn);
      container.appendChild(btn);
    });
  }

  function openMysteryTile(index) {
    state.mysteryOpenedTiles.add(index);
    const tile = document.querySelector(`#tiles-overlay .tile[data-index="${index}"]`);
    if (tile) tile.classList.add('opened');

    const item = ALL_IDIOMS[state.mysteryIndex];
    if (item && item.clues && item.clues[index]) {
      speakText('คำใบ้: ' + item.clues[index]);
    }
  }

  function revealAllMysteryTiles() {
    const tiles = document.querySelectorAll('#tiles-overlay .tile');
    tiles.forEach((t) => t.classList.add('opened'));
  }

  function checkMysteryAnswer(selected, correct, meaning, btn) {
    if (state.mysteryAnswered) return;
    const fb = $('mystery-feedback');

    if (selected === correct) {
      playSound('correct');
      state.mysteryAnswered = true;
      revealAllMysteryTiles();
      btn.classList.add('correct');
      fb.className = 'feedback-banner show correct';
      fb.innerHTML = `<strong>🎉 เก่งมาก! ตอบถูกต้อง</strong><br>สำนวนนี้คือ "<strong>${correct}</strong>"<br>ความหมาย: ${meaning}`;
      speakText('เก่งมาก ตอบถูกต้อง สำนวนนี้คือ ' + correct);
    } else {
      playSound('wrong');
      btn.classList.add('wrong');
      fb.className = 'feedback-banner show wrong';
      fb.innerHTML = `<strong>❌ ยังไม่ใช่สำนวนนี้</strong> ลองเปิดแผ่นป้ายเพิ่มเติมเพื่อดูภาพและคำใบ้เพิ่มขึ้นนะ`;
    }
  }

  // 3.2 Word Chain Builder
  function renderChain() {
    stopAllSpeech();
    if (state.chainIndex < 0) state.chainIndex = ALL_IDIOMS.length - 1;
    if (state.chainIndex >= ALL_IDIOMS.length) state.chainIndex = 0;

    const item = ALL_IDIOMS[state.chainIndex];
    if (!item) return;

    $('chain-counter').innerText = `${state.chainIndex + 1} / ${ALL_IDIOMS.length}`;
    $('chain-prompt-meaning').innerText = `ความหมาย: "${item.figurativeMeaning}"`;

    const fb = $('chain-feedback');
    fb.className = 'feedback-banner';
    fb.innerHTML = '';

    const tokens = [...item.chainTokens];
    const distractors = item.chainDistractors || [];
    const pool = [...tokens, ...distractors].sort(() => 0.5 - Math.random());

    state.chainSlots = new Array(tokens.length).fill(null);
    state.chainTokens = tokens;

    renderChainSlots();
    renderChainPool(pool);
  }

  function renderChainSlots() {
    const container = $('chain-slots');
    container.innerHTML = '';

    state.chainSlots.forEach((val, idx) => {
      const slot = document.createElement('div');
      slot.className = 'slot' + (val ? ' filled' : '');
      slot.innerText = val || `คำที่ ${idx + 1}`;
      slot.onclick = () => {
        if (val) {
          returnTokenToPool(val, idx);
        }
      };
      container.appendChild(slot);
    });
  }

  function renderChainPool(tokens) {
    const container = $('chain-pool');
    container.innerHTML = '';

    tokens.forEach((word) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'token-btn';
      btn.innerText = word;
      btn.onclick = () => placeTokenInSlot(word, btn);
      container.appendChild(btn);
    });
  }

  function placeTokenInSlot(word, btn) {
    const emptyIndex = state.chainSlots.findIndex((s) => s === null);
    if (emptyIndex === -1) {
      showToast('ช่องเต็มแล้ว แตะที่คำในช่องเพื่อนำออก');
      return;
    }
    state.chainSlots[emptyIndex] = word;
    btn.classList.add('used');
    renderChainSlots();
  }

  function returnTokenToPool(word, slotIndex) {
    state.chainSlots[slotIndex] = null;
    const poolBtns = document.querySelectorAll('#chain-pool .token-btn');
    for (const b of poolBtns) {
      if (b.innerText === word && b.classList.contains('used')) {
        b.classList.remove('used');
        break;
      }
    }
    renderChainSlots();
  }

  function checkChainAnswer() {
    const fb = $('chain-feedback');
    const isFull = state.chainSlots.every((s) => s !== null);
    if (!isFull) {
      showToast('กรุณาต่อคำให้ครบทุกช่องก่อนตรวจคำตอบ');
      return;
    }

    const currentAnswer = state.chainSlots.join(' ');
    const correctAnswer = state.chainTokens.join(' ');
    const item = ALL_IDIOMS[state.chainIndex];

    if (currentAnswer === correctAnswer) {
      playSound('correct');
      fb.className = 'feedback-banner show correct';
      fb.innerHTML = `<strong>✨ ถูกต้องสมบูรณ์แบบ!</strong><br>สำนวน: "<strong>${item.idiom}</strong>"<br>ตัวอย่าง: ${item.exampleSentence}`;
      speakText('ถูกต้องสมบูรณ์แบบ ' + item.idiom);
    } else {
      playSound('wrong');
      fb.className = 'feedback-banner show wrong';
      fb.innerHTML = `<strong>❌ ลำดับคำยังไม่ถูกต้อง</strong> แตะคำเพื่อนำออกแล้วสลับเรียงใหม่อีกครั้งนะ`;
    }
  }

  // ─── MODE 4: CATALOG ────────────────────────────────────────────────────────
  function renderCatalog(filterCat = 'all', searchQuery = '') {
    const grid = $('catalog-grid');
    grid.innerHTML = '';

    let items = ALL_IDIOMS;
    if (filterCat !== 'all') {
      items = items.filter((it) => it.category === filterCat);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter(
        (it) =>
          it.idiom.toLowerCase().includes(q) ||
          it.figurativeMeaning.toLowerCase().includes(q) ||
          it.literalMeaning.toLowerCase().includes(q)
      );
    }

    if (items.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:40px;color:var(--text-muted);font-weight:700;">ไม่พบสำนวนที่ตรงกับการค้นหา</div>`;
      return;
    }

    items.forEach((item) => {
      const card = document.createElement('article');
      card.className = 'idiom-card';
      card.innerHTML = `
        <div class="card-thumb">
          <img src="${item.image}" alt="${item.idiom}" loading="lazy">
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h3 class="card-idiom-title">${item.idiom}</h3>
          <span style="font-size:0.75rem;font-weight:700;color:var(--amber);background:var(--gold-light);padding:2px 8px;border-radius:999px;">${item.categoryLabel}</span>
        </div>
        <p class="card-figurative">💡 ${item.figurativeMeaning}</p>
        <button type="button" class="btn btn-outline" style="min-height:36px;font-size:0.85rem;margin-top:auto;">
          🔍 ถอดรหัสสำนวนนี้
        </button>
      `;
      card.onclick = () => {
        // Jump to Mode 1 with this item selected
        state.category = 'all';
        state.decoderList = [...ALL_IDIOMS];
        state.decoderIndex = ALL_IDIOMS.findIndex((it) => it.id === item.id);
        switchMode('learn');
      };
      grid.appendChild(card);
    });
  }

  // ─── MODE 5: WORKSHEET PREP LAB ────────────────────────────────────────────
  function renderPrep() {
    stopAllSpeech();
    if (state.prepIndex < 0) state.prepIndex = ALL_IDIOMS.length - 1;
    if (state.prepIndex >= ALL_IDIOMS.length) state.prepIndex = 0;

    const item = ALL_IDIOMS[state.prepIndex];
    if (!item) return;

    $('prep-counter').innerText = `${state.prepIndex + 1} / ${ALL_IDIOMS.length}`;
    $('prep-idiom-title').innerText = `สำนวน: “${item.idiom}” (${item.categoryLabel} · ${item.grade})`;

    $('prep-reveal-1').innerText = `แนวคิด: ${item.literalMeaning}`;
    $('prep-reveal-2').innerText = `แนวคิด: ${item.figurativeMeaning} (คติ: ${item.moralLesson})`;
    $('prep-reveal-3').innerText = `ตัวอย่างการใช้: "${item.exampleSentence}"\n(สถานการณ์: ${item.contextStory})`;

    // Reset reveals to hidden
    for (let step = 1; step <= 3; step++) {
      state.prepReveals[step] = false;
      const el = $('prep-reveal-' + step);
      if (el) el.classList.add('hidden-answer');
    }
  }

  window.togglePrepReveal = function (step) {
    state.prepReveals[step] = !state.prepReveals[step];
    const el = $('prep-reveal-' + step);
    if (!el) return;
    if (state.prepReveals[step]) {
      el.classList.remove('hidden-answer');
      const item = ALL_IDIOMS[state.prepIndex];
      if (step === 1) speakText('ความหมายตรง: ' + item.literalMeaning);
      else if (step === 2) speakText('ความหมายโดยนัย: ' + item.figurativeMeaning);
      else if (step === 3) speakText('ตัวอย่างการใช้: ' + item.exampleSentence);
    } else {
      el.classList.add('hidden-answer');
    }
  };

  // ─── MODE SWITCHING CONTROLLER ──────────────────────────────────────────────
  function switchMode(newMode) {
    stopAllSpeech();
    state.mode = newMode;
    if (window.KAMPAI && typeof KAMPAI.beginRound === 'function') {
      KAMPAI.beginRound();
    }

    // Update tab bar buttons
    document.querySelectorAll('.mode-tab').forEach((tab) => {
      const isCur = tab.getAttribute('data-mode') === newMode;
      tab.classList.toggle('active', isCur);
      tab.setAttribute('aria-selected', isCur ? 'true' : 'false');
    });

    // Update mode panels
    document.querySelectorAll('.mode-panel').forEach((panel) => {
      const isCur = panel.getAttribute('data-mode') === newMode;
      panel.classList.toggle('active', isCur);
    });

    // Render appropriate mode
    if (newMode === 'learn') renderDecoder();
    else if (newMode === 'scenario') renderScenario();
    else if (newMode === 'puzzle') {
      renderMystery();
      renderChain();
    } else if (newMode === 'catalog') renderCatalog(state.category, $('catalog-search')?.value || '');
    else if (newMode === 'practice') renderPrep();
  }

  // ─── SETUP EVENT LISTENERS ──────────────────────────────────────────────────
  function setupEvents() {
    // Mode tabs
    document.querySelectorAll('.mode-tab').forEach((btn) => {
      btn.addEventListener('click', () => switchMode(btn.getAttribute('data-mode')));
    });

    // Mode 1: Decoder controls
    $('btn-decoder-prev').addEventListener('click', () => {
      state.decoderIndex--;
      renderDecoder();
    });
    $('btn-decoder-next').addEventListener('click', () => {
      state.decoderIndex++;
      renderDecoder();
    });
    $('btn-speak-decoder').addEventListener('click', () => {
      const item = state.decoderList[state.decoderIndex];
      if (item) {
        speakText(
          `${item.idiom} อ่านว่า ${item.reading}. ความหมายตรง: ${item.literalMeaning}. ความหมายโดยนัย: ${item.figurativeMeaning}. คติสอนใจ: ${item.moralLesson}.`
        );
      }
    });

    // Decoder category filter pills
    document.querySelectorAll('#decoder-cat-filter .cat-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#decoder-cat-filter .cat-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        updateDecoderFilter(pill.getAttribute('data-cat'));
      });
    });

    // Mode 2: Scenario controls
    $('btn-scenario-prev').addEventListener('click', () => {
      state.scenarioIndex--;
      renderScenario();
    });
    $('btn-scenario-next').addEventListener('click', () => {
      state.scenarioIndex++;
      renderScenario();
    });
    $('btn-speak-scenario').addEventListener('click', () => {
      const item = ALL_IDIOMS[state.scenarioIndex];
      if (item && item.scenarioQuiz) {
        speakText(item.scenarioQuiz.situation);
      }
    });

    // Mode 3: Puzzle Sub-tabs
    $('subtab-mystery').addEventListener('click', () => {
      $('subtab-mystery').classList.add('active');
      $('subtab-chain').classList.remove('active');
      $('puzzle-mystery-view').classList.add('active');
      $('puzzle-chain-view').classList.remove('active');
    });
    $('subtab-chain').addEventListener('click', () => {
      $('subtab-chain').classList.add('active');
      $('subtab-mystery').classList.remove('active');
      $('puzzle-chain-view').classList.add('active');
      $('puzzle-mystery-view').classList.remove('active');
    });

    // Mystery tiles click
    document.querySelectorAll('#tiles-overlay .tile').forEach((t) => {
      t.addEventListener('click', () => {
        const idx = parseInt(t.getAttribute('data-index'), 10);
        openMysteryTile(idx);
      });
    });
    $('btn-reveal-all-tiles').addEventListener('click', revealAllMysteryTiles);
    $('btn-mystery-prev').addEventListener('click', () => {
      state.mysteryIndex--;
      renderMystery();
    });
    $('btn-mystery-next').addEventListener('click', () => {
      state.mysteryIndex++;
      renderMystery();
    });

    // Chain controls
    $('btn-chain-prev').addEventListener('click', () => {
      state.chainIndex--;
      renderChain();
    });
    $('btn-chain-next').addEventListener('click', () => {
      state.chainIndex++;
      renderChain();
    });
    $('btn-reset-chain').addEventListener('click', renderChain);
    $('btn-check-chain').addEventListener('click', checkChainAnswer);

    // Mode 4: Catalog search & filter
    $('catalog-search').addEventListener('input', (e) => {
      renderCatalog(state.category, e.target.value);
    });
    document.querySelectorAll('#catalog-cat-filter .cat-pill').forEach((pill) => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('#catalog-cat-filter .cat-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        const cat = pill.getAttribute('data-cat');
        state.category = cat;
        renderCatalog(cat, $('catalog-search')?.value || '');
      });
    });

    // Mode 5: Prep controls
    $('btn-prep-prev').addEventListener('click', () => {
      state.prepIndex--;
      renderPrep();
    });
    $('btn-prep-next').addEventListener('click', () => {
      state.prepIndex++;
      renderPrep();
    });

    // Presentation mode toggle
    $('btn-presentation').addEventListener('click', togglePresentationMode);

    // Font scale slider
    $('font-scale-slider').addEventListener('input', (e) => {
      state.fontScale = parseFloat(e.target.value);
      document.documentElement.style.setProperty('--font-scale', state.fontScale);
    });

    // Fullscreen toggle
    $('btn-fs').addEventListener('click', toggleFullscreen);

    // Test runner hooks & win modal
    const winModal = $('win');
    const btnFinishTest = $('btn-finish-test');
    const btnWinRestart = $('btn-win-restart');
    const btnWinClose = $('btn-win-close');

    if (btnFinishTest) {
      btnFinishTest.addEventListener('click', () => {
        if (winModal) winModal.style.display = 'flex';
        if (window.KAMPAI?.sound?.correct) KAMPAI.sound.correct();
      });
    }

    if (btnWinRestart) {
      btnWinRestart.addEventListener('click', () => {
        if (winModal) winModal.style.display = 'none';
        switchMode('learn');
        state.decoderIndex = 0;
        renderDecoder();
        if (window.KAMPAI?.beginRound) KAMPAI.beginRound();
      });
    }

    if (btnWinClose) {
      btnWinClose.addEventListener('click', () => {
        if (winModal) winModal.style.display = 'none';
      });
    }

    // Keyboard shortcuts
    window.addEventListener('keydown', handleKeyNav);
  }

  function togglePresentationMode() {
    state.isPresentation = !state.isPresentation;
    document.body.classList.toggle('presentation-mode', state.isPresentation);
    $('btn-presentation').classList.toggle('active', state.isPresentation);
    showToast(state.isPresentation ? '🖥️ เปิดโหมดฉายหน้าห้องเรียน' : 'ปิดโหมดฉายหน้าห้อง');
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }

  function handleKeyNav(e) {
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;

    if (e.key === 'ArrowLeft') {
      if (state.mode === 'learn') $('btn-decoder-prev').click();
      else if (state.mode === 'scenario') $('btn-scenario-prev').click();
      else if (state.mode === 'puzzle') $('btn-mystery-prev').click();
      else if (state.mode === 'practice') $('btn-prep-prev').click();
    } else if (e.key === 'ArrowRight') {
      if (state.mode === 'learn') $('btn-decoder-next').click();
      else if (state.mode === 'scenario') $('btn-scenario-next').click();
      else if (state.mode === 'puzzle') $('btn-mystery-next').click();
      else if (state.mode === 'practice') $('btn-prep-next').click();
    } else if (e.key === ' ' || e.code === 'Space') {
      e.preventDefault();
      if (state.mode === 'learn') $('btn-speak-decoder').click();
      else if (state.mode === 'scenario') $('btn-speak-scenario').click();
    } else if (e.key.toLowerCase() === 'f') {
      toggleFullscreen();
    } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
      const modeKeys = ['learn', 'scenario', 'puzzle', 'catalog', 'practice'];
      const targetMode = modeKeys[parseInt(e.key, 10) - 1];
      if (targetMode) switchMode(targetMode);
    }
  }

  // ─── QA INSPECTION HOOK ─────────────────────────────────────────────────────
  window.getState = function () {
    return {
      slug: MEDIA_SLUG,
      mode: state.mode,
      category: state.category,
      decoderIndex: state.decoderIndex,
      scenarioIndex: state.scenarioIndex,
      mysteryIndex: state.mysteryIndex,
      chainIndex: state.chainIndex,
      prepIndex: state.prepIndex,
      isPresentation: state.isPresentation,
      fontScale: state.fontScale,
      totalIdioms: ALL_IDIOMS.length
    };
  };

  // ─── INITIALIZE APP ─────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', () => {
    setupEvents();
    renderDecoder();
  });
})();
