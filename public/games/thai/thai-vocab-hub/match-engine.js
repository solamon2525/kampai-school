/* match-engine.js — ระบบจับคู่คำศัพท์ ↔ ความหมาย (โยงเส้น SVG + การ์ดคว่ำจำคู่ + คอมโบ + Deck ไม่ซ้ำ) */
(function () {
  'use strict';

  const PAIR_COLORS = [
    '#34d399', '#fbbf24', '#38bdf8', '#f472b6', '#a78bfa',
    '#fb923c', '#2dd4bf', '#facc15', '#60a5fa', '#e879f9',
  ];

  function shuffleArr(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function computeComboPoints(baseScore, streak) {
    const base = Number(baseScore) || 10;
    const s = Number(streak) || 0;
    let multiplier = 1;
    if (s >= 5) multiplier = 2;
    else if (s >= 3) multiplier = 1.5;
    return { points: Math.round(base * multiplier), multiplier };
  }

  function buildWavePairs(words, categorySlug, fullPool) {
    const list = Array.isArray(words) ? words : [];
    const pool = Array.isArray(fullPool) ? fullPool : list;
    const seenRight = new Set();
    const pairs = [];

    if (categorySlug === 'antonyms') {
      const seenPairIds = new Set();
      for (let i = 0; i < list.length; i++) {
        const w = list[i];
        if (!w || !w.word) continue;
        const pid = w.pair_id || w.word;
        if (seenPairIds.has(pid)) continue;
        const partner = pool.find(p => p && p.pair_id === w.pair_id && p.word !== w.word);
        if (!partner) continue;
        seenPairIds.add(pid);
        pairs.push({
          id: pid,
          leftText: w.word.trim(),
          leftSub: w.reading ? `[${w.reading}]` : '',
          rightText: partner.word.trim(),
          rightSub: partner.meaning ? partner.meaning.trim() : '',
          wordItem: w,
        });
      }
      return pairs;
    }

    for (let i = 0; i < list.length; i++) {
      const w = list[i];
      if (!w || !w.word) continue;
      const meaning = String(w.meaning || '').trim();
      const fallback = String(w.reading || '').trim();
      const rightText = meaning || fallback;
      if (!rightText || seenRight.has(rightText)) continue;
      seenRight.add(rightText);
      pairs.push({
        id: w.word.trim(),
        leftText: w.word.trim(),
        leftSub: w.reading ? `[${w.reading}]` : '',
        rightText,
        rightSub: '',
        wordItem: w,
      });
    }
    return pairs;
  }

  function createMatchDeck(pool, categorySlug) {
    const raw = (Array.isArray(pool) ? pool : [])
      .filter(w => w && w.content_status !== 'quarantined' && w.word);

    const hasMeanings = raw.some(w => String(w.meaning || '').trim().length > 0);
    const eligible = (categorySlug !== 'antonyms' && hasMeanings)
      ? raw.filter(w => String(w.meaning || '').trim().length > 0)
      : raw;

    let queue = shuffleArr(eligible);

    function drawWave(pairCount) {
      const target = Math.max(1, Number(pairCount) || 6);
      if (!eligible.length) return [];

      const picked = [];
      const usedWords = new Set();
      const usedRights = new Set();
      const usedPairIds = new Set();

      const tryTakeFrom = (source) => {
        const leftover = [];
        for (let i = 0; i < source.length; i++) {
          const item = source[i];
          if (picked.length >= target) {
            leftover.push(item);
            continue;
          }
          const built = buildWavePairs([item], categorySlug, eligible);
          if (!built.length) continue;
          const pair = built[0];
          const pid = categorySlug === 'antonyms' ? (item.pair_id || pair.id) : pair.id;
          if (usedWords.has(pair.leftText) || usedRights.has(pair.rightText) || usedPairIds.has(pid)) {
            leftover.push(item);
            continue;
          }
          usedWords.add(pair.leftText);
          usedRights.add(pair.rightText);
          usedPairIds.add(pid);
          picked.push(pair);
        }
        return leftover;
      };

      queue = tryTakeFrom(queue);
      if (picked.length < target && eligible.length > picked.length) {
        queue = shuffleArr(eligible);
        queue = tryTakeFrom(queue);
      }
      return picked;
    }

    return {
      drawWave,
      remaining: () => queue.length,
      total: () => eligible.length,
    };
  }

  // ═══ INTERACTIVE ARENA CONTROLLER ═══
  let host = null;
  let deck = null;
  let subMode = 'connect'; // 'connect' | 'memory'
  let pairCount = 6;
  let waveIndex = 0;
  const TOTAL_WAVES = 3;
  let streak = 0;
  let hintsLeft = 2;
  let currentPairs = [];
  let matchedConnections = []; // { id, leftEl, rightEl, color }
  let selectedLeft = null;
  let selectedRight = null;
  let memoryFlipped = [];
  let memoryLocked = false;
  let memoryMatchedCount = 0;
  let timers = [];
  let resizeBound = false;

  function clearTimers() {
    timers.forEach(id => clearTimeout(id));
    timers = [];
  }

  function schedule(fn, ms) {
    const id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function updateArenaHud() {
    const waveEl = document.getElementById('match-wave-badge');
    const comboEl = document.getElementById('match-combo-badge');
    const hintBtn = document.getElementById('match-hint-btn');
    const pairSelect = document.getElementById('match-pair-count');

    const totalForWave = currentPairs.length;
    const cleared = subMode === 'connect' ? matchedConnections.length : memoryMatchedCount;
    if (waveEl) {
      waveEl.textContent = `ด่าน ${waveIndex + 1}/${TOTAL_WAVES} · คู่ ${cleared}/${totalForWave}`;
    }
    if (comboEl) {
      const { multiplier } = computeComboPoints(10, streak);
      comboEl.textContent = streak >= 2 ? `🔥 คอมโบ ${streak} (×${multiplier})` : `✨ คอมโบ ${streak}`;
      comboEl.classList.toggle('is-hot', streak >= 3);
    }
    if (hintBtn) {
      hintBtn.textContent = `💡 ตัวช่วย (${hintsLeft})`;
      hintBtn.disabled = hintsLeft <= 0 || subMode !== 'connect';
      hintBtn.style.display = subMode === 'connect' ? '' : 'none';
    }
    if (pairSelect) {
      pairSelect.style.display = subMode === 'connect' ? '' : 'none';
    }
  }

  function redrawSvgLines() {
    const svg = document.getElementById('match-svg-layer');
    const wrap = document.getElementById('match-board-wrap');
    if (!svg || !wrap) return;

    const wrapRect = wrap.getBoundingClientRect();
    svg.setAttribute('viewBox', `0 0 ${Math.max(1, wrapRect.width)} ${Math.max(1, wrapRect.height)}`);
    svg.innerHTML = '';

    matchedConnections.forEach((conn) => {
      if (!conn.leftEl || !conn.rightEl) return;
      const lr = conn.leftEl.getBoundingClientRect();
      const rr = conn.rightEl.getBoundingClientRect();
      const x1 = lr.right - wrapRect.left;
      const y1 = lr.top + lr.height / 2 - wrapRect.top;
      const x2 = rr.left - wrapRect.left;
      const y2 = rr.top + rr.height / 2 - wrapRect.top;
      const dx = Math.max(24, Math.abs(x2 - x1) * 0.45);

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
      path.setAttribute('stroke', conn.color);
      path.setAttribute('stroke-width', '3.5');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap', 'round');
      path.classList.add('match-svg-line');
      svg.appendChild(path);
    });
  }

  function showArenaFeedback(text, kind) {
    if (host && typeof host.toast === 'function') {
      host.toast(text, kind);
    }
  }

  function handleWaveCleared() {
    if (waveIndex + 1 >= TOTAL_WAVES) {
      showArenaFeedback('🎉 จับคู่ครบทุกด่านยอดเยี่ยม!', 'correct');
      schedule(() => {
        if (host && typeof host.onRoundEnd === 'function') {
          host.onRoundEnd();
        }
      }, 950);
    } else {
      waveIndex++;
      showArenaFeedback(`✨ ผ่านด่าน! เตรียมตัวด่านที่ ${waveIndex + 1}/${TOTAL_WAVES}`, 'correct');
      schedule(() => {
        loadNextWave();
      }, 950);
    }
  }

  function renderConnectWave() {
    const connectWrap = document.getElementById('match-connect-wrap');
    const memoryGrid = document.getElementById('match-memory-grid');
    const leftCol = document.getElementById('match-left');
    const rightCol = document.getElementById('match-right');
    const svg = document.getElementById('match-svg-layer');
    if (!leftCol || !rightCol) return;

    if (connectWrap) connectWrap.style.display = 'grid';
    if (memoryGrid) memoryGrid.style.display = 'none';
    if (svg) {
      svg.style.display = 'block';
      svg.innerHTML = '';
    }

    matchedConnections = [];
    selectedLeft = null;
    selectedRight = null;
    leftCol.innerHTML = '';
    rightCol.innerHTML = '';

    const leftItems = shuffleArr(currentPairs);
    const rightItems = shuffleArr(currentPairs);

    leftItems.forEach((pair) => {
      const card = document.createElement('div');
      card.className = 'match-card match-card-word';
      card.dataset.pairId = pair.id;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');

      const label = document.createElement('span');
      label.className = 'mc-text';
      label.textContent = pair.leftText;
      card.appendChild(label);

      const speakBtn = document.createElement('button');
      speakBtn.type = 'button';
      speakBtn.className = 'mc-speak-btn';
      speakBtn.title = 'ฟังเสียงอ่าน';
      speakBtn.setAttribute('aria-label', `ฟังเสียง ${pair.leftText}`);
      speakBtn.textContent = '🔊';
      speakBtn.onclick = (e) => {
        e.stopPropagation();
        if (host && typeof host.speak === 'function') host.speak(pair.wordItem.word);
      };
      card.appendChild(speakBtn);

      card.onclick = () => selectConnectCard(pair, card, 'left');
      card.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectConnectCard(pair, card, 'left');
        }
      };
      leftCol.appendChild(card);
    });

    rightItems.forEach((pair) => {
      const card = document.createElement('div');
      card.className = 'match-card match-card-meaning';
      card.dataset.pairId = pair.id;
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');

      const label = document.createElement('span');
      label.className = 'mc-text';
      label.textContent = pair.rightText;
      card.appendChild(label);

      card.onclick = () => selectConnectCard(pair, card, 'right');
      card.onkeydown = (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          selectConnectCard(pair, card, 'right');
        }
      };
      rightCol.appendChild(card);
    });

    updateArenaHud();
  }

  function selectConnectCard(pair, cardEl, side) {
    if (cardEl.classList.contains('matched') || cardEl.classList.contains('error')) return;

    if (side === 'left') {
      const prev = document.querySelector('#match-left .match-card.active');
      if (prev) prev.classList.remove('active');
      selectedLeft = { pair, el: cardEl };
      cardEl.classList.add('active');
      if (host && typeof host.speak === 'function') host.speak(pair.wordItem.word);
    } else {
      const prev = document.querySelector('#match-right .match-card.active');
      if (prev) prev.classList.remove('active');
      selectedRight = { pair, el: cardEl };
      cardEl.classList.add('active');
    }

    if (!selectedLeft || !selectedRight) return;

    const leftNode = selectedLeft;
    const rightNode = selectedRight;
    selectedLeft = null;
    selectedRight = null;

    if (leftNode.pair.id === rightNode.pair.id) {
      streak++;
      const color = PAIR_COLORS[matchedConnections.length % PAIR_COLORS.length];
      leftNode.el.classList.remove('active', 'hint-pulse');
      rightNode.el.classList.remove('active', 'hint-pulse');
      leftNode.el.classList.add('matched');
      rightNode.el.classList.add('matched');
      leftNode.el.style.borderColor = color;
      rightNode.el.style.borderColor = color;

      matchedConnections.push({
        id: leftNode.pair.id,
        leftEl: leftNode.el,
        rightEl: rightNode.el,
        color,
      });
      redrawSvgLines();

      const base = host && typeof host.getBaseScore === 'function' ? host.getBaseScore() : 10;
      const { points, multiplier } = computeComboPoints(base, streak);
      if (host && typeof host.onCorrect === 'function') {
        host.onCorrect(leftNode.pair.wordItem, points);
      }
      if (streak >= 3) {
        showArenaFeedback(`🔥 คอมโบ ×${multiplier} (+${points})`, 'correct');
      }
      updateArenaHud();

      if (matchedConnections.length === currentPairs.length) {
        handleWaveCleared();
      }
    } else {
      streak = 0;
      leftNode.el.classList.remove('active');
      rightNode.el.classList.remove('active');
      leftNode.el.classList.add('error');
      rightNode.el.classList.add('error');
      updateArenaHud();

      const alive = host && typeof host.onWrong === 'function'
        ? host.onWrong(leftNode.pair.wordItem)
        : true;

      schedule(() => {
        leftNode.el.classList.remove('error');
        rightNode.el.classList.remove('error');
        if (!alive && host && typeof host.onRoundEnd === 'function') {
          host.onRoundEnd();
        }
      }, 650);
    }
  }

  function renderMemoryWave() {
    const connectWrap = document.getElementById('match-connect-wrap');
    const memoryGrid = document.getElementById('match-memory-grid');
    const svg = document.getElementById('match-svg-layer');
    if (!memoryGrid) return;

    if (connectWrap) connectWrap.style.display = 'none';
    if (svg) svg.style.display = 'none';
    memoryGrid.style.display = 'grid';
    memoryGrid.innerHTML = '';

    memoryFlipped = [];
    memoryLocked = false;
    memoryMatchedCount = 0;

    const cardsData = [];
    currentPairs.forEach((p) => {
      cardsData.push({ id: p.id, side: 'word', text: p.leftText, wordItem: p.wordItem });
      cardsData.push({ id: p.id, side: 'meaning', text: p.rightText, wordItem: p.wordItem });
    });

    shuffleArr(cardsData).forEach((item, idx) => {
      const card = document.createElement('button');
      card.type = 'button';
      card.className = 'memory-card';
      card.dataset.pairId = item.id;
      card.dataset.side = item.side;
      card.innerHTML = `
        <span class="memory-card-inner">
          <span class="memory-face memory-front">
            <span class="memory-q-num">${idx + 1}</span>
            <span class="memory-q-icon">${item.side === 'word' ? '🔤' : '💡'}</span>
          </span>
          <span class="memory-face memory-back">
            <span class="memory-badge">${item.side === 'word' ? 'คำศัพท์' : 'ความหมาย'}</span>
            <span class="memory-text">${item.text}</span>
          </span>
        </span>`;
      card.onclick = () => selectMemoryCard(item, card);
      memoryGrid.appendChild(card);
    });

    updateArenaHud();
  }

  function selectMemoryCard(item, cardEl) {
    if (memoryLocked || cardEl.classList.contains('flipped') || cardEl.classList.contains('matched')) {
      return;
    }

    cardEl.classList.add('flipped');
    if (item.side === 'word' && host && typeof host.speak === 'function') {
      host.speak(item.wordItem.word);
    }
    memoryFlipped.push({ item, el: cardEl });

    if (memoryFlipped.length < 2) return;
    memoryLocked = true;

    const [first, second] = memoryFlipped;
    memoryFlipped = [];

    if (first.item.id === second.item.id && first.item.side !== second.item.side) {
      streak++;
      memoryMatchedCount++;
      first.el.classList.add('matched');
      second.el.classList.add('matched');
      const base = host && typeof host.getBaseScore === 'function' ? host.getBaseScore() : 10;
      const { points, multiplier } = computeComboPoints(base, streak);
      if (host && typeof host.onCorrect === 'function') {
        host.onCorrect(first.item.wordItem, points);
      }
      if (streak >= 3) showArenaFeedback(`🔥 คอมโบ ×${multiplier} (+${points})`, 'correct');
      updateArenaHud();
      memoryLocked = false;
      if (memoryMatchedCount === currentPairs.length) {
        handleWaveCleared();
      }
    } else {
      streak = 0;
      updateArenaHud();
      first.el.classList.add('error');
      second.el.classList.add('error');
      const alive = host && typeof host.onWrong === 'function'
        ? host.onWrong(first.item.wordItem)
        : true;
      schedule(() => {
        first.el.classList.remove('flipped', 'error');
        second.el.classList.remove('flipped', 'error');
        memoryLocked = false;
        if (!alive && host && typeof host.onRoundEnd === 'function') {
          host.onRoundEnd();
        }
      }, 800);
    }
  }

  function triggerHint() {
    if (hintsLeft <= 0 || subMode !== 'connect') return;
    const matchedIds = new Set(matchedConnections.map(c => c.id));
    const candidate = currentPairs.find(p => !matchedIds.has(p.id));
    if (!candidate) return;

    hintsLeft--;
    updateArenaHud();

    const leftCard = Array.from(document.querySelectorAll('#match-left .match-card'))
      .find(el => el.dataset.pairId === candidate.id);
    const rightCard = Array.from(document.querySelectorAll('#match-right .match-card'))
      .find(el => el.dataset.pairId === candidate.id);

    if (leftCard) leftCard.classList.add('hint-pulse');
    if (rightCard) rightCard.classList.add('hint-pulse');
    if (host && typeof host.speak === 'function') host.speak(candidate.wordItem.word);

    schedule(() => {
      if (leftCard) leftCard.classList.remove('hint-pulse');
      if (rightCard) rightCard.classList.remove('hint-pulse');
    }, 1800);
  }

  function loadNextWave() {
    clearTimers();
    if (!deck) return;
    const targetCount = subMode === 'memory' ? 6 : pairCount;
    currentPairs = deck.drawWave(targetCount);
    if (subMode === 'memory') renderMemoryWave();
    else renderConnectWave();
  }

  function bindUiControls() {
    const btnConnect = document.getElementById('match-sub-connect');
    const btnMemory = document.getElementById('match-sub-memory');
    const pairSelect = document.getElementById('match-pair-count');
    const hintBtn = document.getElementById('match-hint-btn');
    const rerollBtn = document.getElementById('match-reroll-btn');

    if (btnConnect && !btnConnect.dataset.bound) {
      btnConnect.dataset.bound = '1';
      btnConnect.onclick = () => {
        if (subMode === 'connect') return;
        subMode = 'connect';
        btnConnect.classList.add('active');
        if (btnMemory) btnMemory.classList.remove('active');
        loadNextWave();
      };
    }
    if (btnMemory && !btnMemory.dataset.bound) {
      btnMemory.dataset.bound = '1';
      btnMemory.onclick = () => {
        if (subMode === 'memory') return;
        subMode = 'memory';
        btnMemory.classList.add('active');
        if (btnConnect) btnConnect.classList.remove('active');
        loadNextWave();
      };
    }
    if (pairSelect && !pairSelect.dataset.bound) {
      pairSelect.dataset.bound = '1';
      pairSelect.onchange = () => {
        pairCount = Number(pairSelect.value) || 6;
        loadNextWave();
      };
    }
    if (hintBtn && !hintBtn.dataset.bound) {
      hintBtn.dataset.bound = '1';
      hintBtn.onclick = triggerHint;
    }
    if (rerollBtn && !rerollBtn.dataset.bound) {
      rerollBtn.dataset.bound = '1';
      rerollBtn.onclick = () => {
        if (host && typeof host.getPool === 'function') {
          deck = createMatchDeck(host.getPool(), host.getCategorySlug ? host.getCategorySlug() : '');
        }
        waveIndex = 0;
        streak = 0;
        hintsLeft = 2;
        loadNextWave();
      };
    }
    if (!resizeBound && typeof window !== 'undefined' && window.addEventListener) {
      resizeBound = true;
      window.addEventListener('resize', redrawSvgLines);
    }
  }

  function mount(callbacks) {
    host = callbacks;
  }

  function start() {
    clearTimers();
    bindUiControls();
    const pool = host && typeof host.getPool === 'function' ? host.getPool() : [];
    const slug = host && typeof host.getCategorySlug === 'function' ? host.getCategorySlug() : '';
    deck = createMatchDeck(pool, slug);
    waveIndex = 0;
    streak = 0;
    hintsLeft = 2;
    loadNextWave();
  }

  function cleanup() {
    clearTimers();
    selectedLeft = null;
    selectedRight = null;
    memoryFlipped = [];
    memoryLocked = false;
  }

  window.ThaiVocabMatch = {
    PAIR_COLORS,
    computeComboPoints,
    buildWavePairs,
    createMatchDeck,
    mount,
    start,
    cleanup,
  };
})();
