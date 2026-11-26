/* connect-match-engine.js — Subject-agnostic Connect & Memory Pair Matching Engine (IIFE) */
(function (global) {
  'use strict';

  const root = global || (typeof window !== 'undefined' ? window : globalThis);
  root.KampaiEngines = root.KampaiEngines || {};

  const PAIR_COLORS = [
    '#34d399', '#fbbf24', '#38bdf8', '#f472b6', '#a78bfa',
    '#fb923c', '#2dd4bf', '#facc15', '#60a5fa', '#e879f9',
  ];

  function shuffleArr(arr) {
    const out = Array.isArray(arr) ? arr.slice() : [];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function computeComboPoints(baseScore, streak) {
    const base = Number.isFinite(baseScore) && baseScore > 0 ? Number(baseScore) : 10;
    const s = Number.isFinite(streak) ? Number(streak) : 0;
    let multiplier = 1;
    if (s >= 5) multiplier = 2;
    else if (s >= 3) multiplier = 1.5;
    return { points: Math.round(base * multiplier), multiplier: multiplier };
  }

  function extractLeft(item) {
    if (!item || typeof item !== 'object') return '';
    return String(item.leftText || item.left || item.term || item.word || '').trim();
  }

  function extractRight(item) {
    if (!item || typeof item !== 'object') return '';
    return String(item.rightText || item.right || item.meaning || item.definition || item.reading || '').trim();
  }

  function buildWavePairs(items, optionsOrSlug, fullPool) {
    const list = Array.isArray(items) ? items : [];
    const opts = typeof optionsOrSlug === 'string'
      ? { categorySlug: optionsOrSlug }
      : (optionsOrSlug || {});
    const categorySlug = opts.categorySlug || '';
    const pool = Array.isArray(fullPool) ? fullPool : (Array.isArray(opts.fullPool) ? opts.fullPool : list);
    const seenLeft = new Set();
    const seenRight = new Set();
    const pairs = [];

    if (categorySlug === 'antonyms') {
      const seenPairIds = new Set();
      for (let i = 0; i < list.length; i++) {
        const w = list[i];
        if (!w || w.content_status === 'quarantined') continue;
        const leftText = extractLeft(w);
        if (!leftText) continue;
        const pid = w.pair_id || leftText;
        if (seenPairIds.has(pid)) continue;
        const partner = pool.find(function (p) {
          return p && p.content_status !== 'quarantined' && p.pair_id === w.pair_id && extractLeft(p) !== leftText;
        });
        if (!partner) continue;
        const rightText = extractLeft(partner);
        if (!rightText || seenLeft.has(leftText) || seenRight.has(rightText)) continue;
        seenPairIds.add(pid);
        seenLeft.add(leftText);
        seenRight.add(rightText);
        pairs.push({
          id: String(pid),
          leftText: leftText,
          leftSub: w.reading ? '[' + w.reading + ']' : (w.leftSub || ''),
          rightText: rightText,
          rightSub: partner.meaning ? String(partner.meaning).trim() : (w.rightSub || ''),
          locale: w.locale || opts.locale || 'th-TH',
          item: w,
        });
      }
      return pairs;
    }

    for (let i = 0; i < list.length; i++) {
      const item = list[i];
      if (!item || item.content_status === 'quarantined') continue;
      const leftText = extractLeft(item);
      const rightText = extractRight(item);
      if (!leftText || !rightText) continue;
      if (seenLeft.has(leftText) || seenRight.has(rightText)) continue;
      seenLeft.add(leftText);
      seenRight.add(rightText);

      const id = item.id ? String(item.id) : leftText;
      pairs.push({
        id: id,
        leftText: leftText,
        leftSub: item.leftSub || (item.reading ? '[' + item.reading + ']' : ''),
        rightText: rightText,
        rightSub: item.rightSub || '',
        locale: item.locale || opts.locale || 'th-TH',
        item: item,
      });
    }

    return pairs;
  }

  function createDeck(items, optionsOrSlug) {
    const opts = typeof optionsOrSlug === 'string'
      ? { categorySlug: optionsOrSlug }
      : (optionsOrSlug || {});
    const raw = (Array.isArray(items) ? items : []).filter(function (item) {
      return item && item.content_status !== 'quarantined' && extractLeft(item).length > 0;
    });

    const eligible = opts.categorySlug === 'antonyms'
      ? raw
      : raw.filter(function (item) { return extractRight(item).length > 0; });

    let queue = shuffleArr(eligible);

    function drawWave(pairCount) {
      const target = Math.max(1, Number(pairCount) || 6);
      if (!eligible.length) return [];

      const picked = [];
      const usedLefts = new Set();
      const usedRights = new Set();
      const usedIds = new Set();

      function tryTakeFrom(source) {
        const leftover = [];
        for (let i = 0; i < source.length; i++) {
          const item = source[i];
          if (picked.length >= target) {
            leftover.push(item);
            continue;
          }
          const built = buildWavePairs([item], Object.assign({}, opts, { fullPool: eligible }));
          if (!built.length) continue;
          const pair = built[0];
          if (usedLefts.has(pair.leftText) || usedRights.has(pair.rightText) || usedIds.has(pair.id)) {
            leftover.push(item);
            continue;
          }
          usedLefts.add(pair.leftText);
          usedRights.add(pair.rightText);
          usedIds.add(pair.id);
          picked.push(pair);
        }
        return leftover;
      }

      queue = tryTakeFrom(queue);
      if (picked.length < target && eligible.length > picked.length) {
        queue = shuffleArr(eligible);
        queue = tryTakeFrom(queue);
      }
      return picked;
    }

    function reset() {
      queue = shuffleArr(eligible);
    }

    return {
      drawWave: drawWave,
      remaining: function () { return queue.length; },
      total: function () { return eligible.length; },
      reset: reset,
    };
  }

  function createSession(config) {
    const cfg = config || {};
    const mode = cfg.mode === 'game' ? 'game' : 'media';
    const isMedia = mode === 'media';
    const pairCount = Math.max(1, Number(cfg.pairCount) || 6);
    const totalWaves = Math.max(1, Number(cfg.totalWaves) || 1);
    const baseScore = Number.isFinite(cfg.baseScore) && cfg.baseScore > 0 ? cfg.baseScore : 10;
    const initialLives = isMedia
      ? null
      : (Number.isFinite(cfg.lives) && cfg.lives > 0 ? Math.floor(cfg.lives) : 6);
    const scoreEnabled = !isMedia;

    const deck = createDeck(cfg.items || cfg.pairs || [], cfg);
    let currentPairs = deck.drawWave(pairCount);
    let matchedIds = new Set();
    let waveIndex = 0;
    let streak = 0;
    let score = 0;
    let lives = initialLives;
    let isGameOver = false;
    let isComplete = currentPairs.length === 0;

    function checkMatch(leftId, rightId) {
      if (isComplete || isGameOver) {
        return { isMatch: false, points: 0, multiplier: 1, livesRemaining: lives, waveCleared: false, isGameOver: isGameOver };
      }

      const isMatch = String(leftId || '') !== '' && String(leftId) === String(rightId) && !matchedIds.has(String(leftId));
      let points = 0;
      let multiplier = 1;

      if (isMatch) {
        matchedIds.add(String(leftId));
        streak += 1;
        if (scoreEnabled) {
          const combo = computeComboPoints(baseScore, streak);
          points = combo.points;
          multiplier = combo.multiplier;
          score += points;
        }
      } else {
        streak = 0;
        if (!isMedia && lives !== null) {
          lives = Math.max(0, lives - 1);
          if (lives <= 0) isGameOver = true;
        }
      }

      const waveCleared = matchedIds.size >= currentPairs.length && currentPairs.length > 0;
      return {
        isMatch: isMatch,
        points: points,
        multiplier: multiplier,
        streak: streak,
        livesRemaining: lives,
        waveCleared: waveCleared,
        isGameOver: isGameOver,
      };
    }

    function nextWave() {
      if (isGameOver || waveIndex + 1 >= totalWaves) {
        isComplete = true;
        return [];
      }
      waveIndex += 1;
      matchedIds = new Set();
      currentPairs = deck.drawWave(pairCount);
      return currentPairs;
    }

    function getState() {
      return Object.freeze({
        mode: mode,
        waveIndex: waveIndex,
        totalWaves: totalWaves,
        matchedCount: matchedIds.size,
        waveTotal: currentPairs.length,
        streak: streak,
        score: scoreEnabled ? score : null,
        lives: lives,
        timerEnabled: !isMedia && Boolean(cfg.timerSeconds),
        scoreEnabled: scoreEnabled,
        isComplete: isComplete,
        isGameOver: isGameOver,
      });
    }

    return {
      getPairs: function () { return currentPairs.slice(); },
      checkMatch: checkMatch,
      nextWave: nextWave,
      getState: getState,
    };
  }

  // ═══ INTERACTIVE DOM CONTROLLER ═══
  let timers = [];
  let resizeHandler = null;

  function clearTimers() {
    timers.forEach(function (id) { clearTimeout(id); });
    timers = [];
  }

  function cleanup() {
    clearTimers();
    if (resizeHandler && typeof root.removeEventListener === 'function') {
      root.removeEventListener('resize', resizeHandler);
      resizeHandler = null;
    }
  }

  function mount(containerOrConfig, maybeConfig) {
    cleanup();
    const doc = root.document;
    if (!doc) return null;

    const cfg = typeof containerOrConfig === 'string' || (containerOrConfig && containerOrConfig.nodeType)
      ? Object.assign({}, maybeConfig || {}, { container: containerOrConfig })
      : (containerOrConfig || {});

    const container = typeof cfg.container === 'string'
      ? doc.querySelector(cfg.container)
      : cfg.container;
    if (!container) return null;

    const session = createSession(cfg);
    const subMode = cfg.subMode === 'memory' ? 'memory' : 'connect';
    let selectedLeft = null;
    let selectedRight = null;
    let memoryFlipped = [];
    let memoryLocked = false;
    const connections = [];

    function renderMemoryWave() {
      const pairs = session.getPairs();
      memoryFlipped = [];
      memoryLocked = false;

      container.innerHTML =
        '<div class="ke-match-wrap" data-submode="memory">' +
          '<div class="ke-memory-grid"></div>' +
          '<div class="ke-match-feedback" aria-live="polite"></div>' +
        '</div>';

      const grid = container.querySelector('.ke-memory-grid');
      const feedbackEl = container.querySelector('.ke-match-feedback');
      const cards = [];
      pairs.forEach(function (p) {
        cards.push({ id: p.id, side: 'left', text: p.leftText, pair: p });
        cards.push({ id: p.id, side: 'right', text: p.rightText, pair: p });
      });

      shuffleArr(cards).forEach(function (cardData, idx) {
        const btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = 'ke-memory-card';
        btn.style.minHeight = '44px';
        btn.dataset.pairId = cardData.id;
        btn.dataset.side = cardData.side;
        btn.setAttribute('aria-label', 'การ์ด ' + (idx + 1));
        btn.textContent = '?';

        btn.onclick = function () {
          if (memoryLocked || btn.classList.contains('flipped') || btn.classList.contains('matched')) return;
          btn.classList.add('flipped');
          btn.textContent = cardData.text;
          memoryFlipped.push({ data: cardData, el: btn });
          if (memoryFlipped.length < 2) return;

          memoryLocked = true;
          const first = memoryFlipped[0];
          const second = memoryFlipped[1];
          memoryFlipped = [];

          const isSamePair = first.data.id === second.data.id && first.data.side !== second.data.side;
          const res = isSamePair
            ? session.checkMatch(first.data.id, second.data.id)
            : session.checkMatch(first.data.id, '__mismatch__' + second.data.id);

          if (res.isMatch) {
            first.el.classList.add('matched');
            second.el.classList.add('matched');
            memoryLocked = false;
            if (feedbackEl) feedbackEl.textContent = 'จับคู่สำเร็จ! ' + first.data.pair.leftText + ' ↔ ' + first.data.pair.rightText;
            if (typeof cfg.onMatch === 'function') cfg.onMatch(first.data.pair, res);
            if (res.waveCleared && typeof cfg.onWaveClear === 'function') cfg.onWaveClear(session.getState());
          } else {
            first.el.classList.add('error');
            second.el.classList.add('error');
            if (feedbackEl) feedbackEl.textContent = 'ยังไม่ตรงคู่ ลองจำตำแหน่งแล้วเปิดใหม่อีกครั้ง';
            timers.push(setTimeout(function () {
              first.el.classList.remove('flipped', 'error');
              second.el.classList.remove('flipped', 'error');
              first.el.textContent = '?';
              second.el.textContent = '?';
              memoryLocked = false;
            }, 750));
          }
        };

        grid.appendChild(btn);
      });
    }

    function redrawSvg() {
      const svg = container.querySelector('.ke-match-svg');
      const wrap = container.querySelector('.ke-match-wrap');
      if (!svg || !wrap) return;
      const wr = wrap.getBoundingClientRect();
      svg.setAttribute('viewBox', '0 0 ' + Math.max(1, wr.width) + ' ' + Math.max(1, wr.height));
      svg.innerHTML = '';
      connections.forEach(function (conn) {
        if (!conn.leftEl || !conn.rightEl) return;
        const lr = conn.leftEl.getBoundingClientRect();
        const rr = conn.rightEl.getBoundingClientRect();
        const x1 = lr.right - wr.left;
        const y1 = lr.top + lr.height / 2 - wr.top;
        const x2 = rr.left - wr.left;
        const y2 = rr.top + rr.height / 2 - wr.top;
        const dx = Math.max(24, Math.abs(x2 - x1) * 0.45);
        const path = doc.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', 'M ' + x1 + ' ' + y1 + ' C ' + (x1 + dx) + ' ' + y1 + ', ' + (x2 - dx) + ' ' + y2 + ', ' + x2 + ' ' + y2);
        path.setAttribute('stroke', conn.color);
        path.setAttribute('stroke-width', '3.5');
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke-linecap', 'round');
        svg.appendChild(path);
      });
    }

    function renderConnectWave() {
      const pairs = session.getPairs();
      connections.length = 0;
      selectedLeft = null;
      selectedRight = null;

      container.innerHTML =
        '<div class="ke-match-wrap" data-submode="' + subMode + '">' +
          '<svg class="ke-match-svg" aria-hidden="true"></svg>' +
          '<div class="ke-match-grid">' +
            '<div class="ke-match-col ke-match-left"></div>' +
            '<div class="ke-match-col ke-match-right"></div>' +
          '</div>' +
          '<div class="ke-match-feedback" aria-live="polite"></div>' +
        '</div>';

      const leftCol = container.querySelector('.ke-match-left');
      const rightCol = container.querySelector('.ke-match-right');
      const feedbackEl = container.querySelector('.ke-match-feedback');

      function handlePairClick(pair, el, side) {
        if (el.classList.contains('matched')) return;
        if (side === 'left') {
          Array.from(leftCol.querySelectorAll('.ke-match-card.active')).forEach(function (c) { c.classList.remove('active'); });
          selectedLeft = { pair: pair, el: el };
          el.classList.add('active');
        } else {
          Array.from(rightCol.querySelectorAll('.ke-match-card.active')).forEach(function (c) { c.classList.remove('active'); });
          selectedRight = { pair: pair, el: el };
          el.classList.add('active');
        }

        if (!selectedLeft || !selectedRight) return;
        const l = selectedLeft;
        const r = selectedRight;
        selectedLeft = null;
        selectedRight = null;

        const res = session.checkMatch(l.pair.id, r.pair.id);
        l.el.classList.remove('active');
        r.el.classList.remove('active');

        if (res.isMatch) {
          const color = PAIR_COLORS[connections.length % PAIR_COLORS.length];
          l.el.classList.add('matched');
          r.el.classList.add('matched');
          l.el.style.borderColor = color;
          r.el.style.borderColor = color;
          connections.push({ leftEl: l.el, rightEl: r.el, color: color });
          redrawSvg();
          if (feedbackEl) feedbackEl.textContent = 'จับคู่ถูกต้อง! ' + l.pair.leftText + ' ↔ ' + l.pair.rightText;
          if (typeof cfg.onMatch === 'function') cfg.onMatch(l.pair, res);
          if (res.waveCleared && typeof cfg.onWaveClear === 'function') cfg.onWaveClear(session.getState());
        } else {
          l.el.classList.add('error');
          r.el.classList.add('error');
          if (feedbackEl) feedbackEl.textContent = 'ยังไม่ตรงกัน ลองสังเกตความหมายใหม่อีกครั้ง';
          timers.push(setTimeout(function () {
            l.el.classList.remove('error');
            r.el.classList.remove('error');
          }, 600));
        }
      }

      shuffleArr(pairs).forEach(function (pair) {
        const btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = 'ke-match-card ke-match-card-left';
        btn.style.minHeight = '44px';
        btn.dataset.pairId = pair.id;
        btn.textContent = pair.leftText;
        btn.onclick = function () { handlePairClick(pair, btn, 'left'); };
        leftCol.appendChild(btn);
      });

      shuffleArr(pairs).forEach(function (pair) {
        const btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = 'ke-match-card ke-match-card-right';
        btn.style.minHeight = '44px';
        btn.dataset.pairId = pair.id;
        btn.textContent = pair.rightText;
        btn.onclick = function () { handlePairClick(pair, btn, 'right'); };
        rightCol.appendChild(btn);
      });
    }

    if (subMode === 'memory') {
      renderMemoryWave();
    } else {
      if (typeof root.addEventListener === 'function') {
        resizeHandler = redrawSvg;
        root.addEventListener('resize', resizeHandler);
      }
      renderConnectWave();
    }
    return session;
  }

  root.KampaiEngines.ConnectMatch = {
    PAIR_COLORS: PAIR_COLORS,
    computeComboPoints: computeComboPoints,
    buildWavePairs: buildWavePairs,
    createDeck: createDeck,
    createSession: createSession,
    mount: mount,
    cleanup: cleanup,
  };
})(typeof window !== 'undefined' ? window : globalThis);
