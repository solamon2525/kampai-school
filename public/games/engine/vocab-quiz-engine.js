/* vocab-quiz-engine.js — Subject-agnostic Vocabulary & Concept Quiz Engine (IIFE) */
(function (global) {
  'use strict';

  const root = global || (typeof window !== 'undefined' ? window : globalThis);
  root.KampaiEngines = root.KampaiEngines || {};

  function getItemTerm(item) {
    if (!item || typeof item !== 'object') return '';
    return String(item.term || item.word || '').trim();
  }

  function getItemMeaning(item) {
    if (!item || typeof item !== 'object') return '';
    return String(item.meaning || item.definition || '').trim();
  }

  function isValidItem(item) {
    return Boolean(
      item &&
      item.content_status !== 'quarantined' &&
      getItemTerm(item).length > 0 &&
      getItemMeaning(item).length > 0
    );
  }

  function filterCleanPool(pool) {
    if (!Array.isArray(pool)) return [];
    const seen = new Set();
    const result = [];
    for (let i = 0; i < pool.length; i++) {
      const item = pool[i];
      if (!isValidItem(item)) continue;
      const key = getItemTerm(item);
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(item);
    }
    return result;
  }

  function shuffle(arr) {
    const copy = Array.isArray(arr) ? arr.slice() : [];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function escapeRegExp(str) {
    return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function maskTermInExample(example, term) {
    const text = String(example || '');
    const target = String(term || '').trim();
    if (!text || !target) return { matched: false, masked: text };

    if (/^[A-Za-z0-9\s'-]+$/.test(target)) {
      const wordBoundaryRe = new RegExp('\\b' + escapeRegExp(target) + '\\b', 'gi');
      if (wordBoundaryRe.test(text)) {
        return { matched: true, masked: text.replace(wordBoundaryRe, '_____') };
      }
      const ciRe = new RegExp(escapeRegExp(target), 'gi');
      if (ciRe.test(text)) {
        return { matched: true, masked: text.replace(ciRe, '_____') };
      }
      return { matched: false, masked: text };
    }

    if (text.indexOf(target) !== -1) {
      return { matched: true, masked: text.split(target).join('_____') };
    }
    return { matched: false, masked: text };
  }

  function pickUniqueStrings(candidates, excludeSet, limit) {
    const picked = [];
    const shuffled = shuffle(candidates);
    for (let i = 0; i < shuffled.length && picked.length < limit; i++) {
      const val = typeof shuffled[i] === 'string' ? shuffled[i].trim() : '';
      if (!val || excludeSet.has(val)) continue;
      excludeSet.add(val);
      picked.push(val);
    }
    return picked;
  }

  function createDeck(items, roundSize, categorySlug) {
    const cleanPool = filterCleanPool(items);
    const targetSize = Number.isFinite(roundSize) && roundSize > 0 ? Math.floor(roundSize) : 10;
    let queue = shuffle(cleanPool);

    function nextRound() {
      if (cleanPool.length === 0) return [];
      const count = Math.min(targetSize, cleanPool.length);
      const picked = [];
      const pickedTerms = new Set();

      while (picked.length < count && queue.length > 0) {
        const item = queue.shift();
        const key = getItemTerm(item);
        if (!pickedTerms.has(key)) {
          picked.push(item);
          pickedTerms.add(key);
        }
      }

      if (picked.length < count) {
        const refill = shuffle(cleanPool.filter(function (item) {
          return !pickedTerms.has(getItemTerm(item));
        }));
        while (picked.length < count && refill.length > 0) {
          const item = refill.shift();
          picked.push(item);
          pickedTerms.add(getItemTerm(item));
        }
        queue = refill;
      }

      return picked;
    }

    function reset() {
      queue = shuffle(cleanPool);
    }

    return {
      categorySlug: categorySlug || '',
      nextRound: nextRound,
      remaining: function () { return queue.length; },
      total: function () { return cleanPool.length; },
      reset: reset,
    };
  }

  function buildChoiceQuestion(item, pool, optionsOrSlug) {
    const opts = typeof optionsOrSlug === 'string'
      ? { categorySlug: optionsOrSlug }
      : (optionsOrSlug || {});
    const categorySlug = opts.categorySlug || '';
    const cleanPool = filterCleanPool(pool);
    const targetTerm = getItemTerm(item);
    const answer = getItemMeaning(item);
    const reading = item && item.reading ? String(item.reading).trim() : '';
    const example = item && item.example ? String(item.example).trim() : '';

    let kind = 'meaning';
    let badge = opts.meaningBadge || 'ทายความหมาย';
    let prompt = opts.promptFormatter
      ? opts.promptFormatter(item)
      : ('"' + targetTerm + '"' + (reading ? ' [' + reading + ']' : '') + ' หมายถึงข้อใด?');

    const maskedResult = maskTermInExample(example, targetTerm);
    if (maskedResult.matched) {
      kind = 'cloze';
      badge = opts.clozeBadge || 'เติมคำในประโยค';
      prompt = maskedResult.masked;
    } else if (categorySlug === 'classifiers' && item && item.classifier_for) {
      kind = 'classifier';
      badge = 'ลักษณนาม';
      prompt = '"' + item.classifier_for + ' 1 ___" — เลือกลักษณนามที่ถูก';
    }

    const excludeMeanings = new Set(answer ? [answer] : []);
    const decoys = [];

    if (categorySlug === 'synonyms' && item && item.synonym_group) {
      const sameGroup = cleanPool
        .filter(function (w) { return getItemTerm(w) !== targetTerm && w.synonym_group === item.synonym_group; })
        .map(getItemMeaning);
      Array.prototype.push.apply(decoys, pickUniqueStrings(sameGroup, excludeMeanings, 3));
    }

    if (decoys.length < 3) {
      const wider = cleanPool
        .filter(function (w) { return getItemTerm(w) !== targetTerm; })
        .map(getItemMeaning);
      Array.prototype.push.apply(decoys, pickUniqueStrings(wider, excludeMeanings, 3 - decoys.length));
    }

    const explainParts = [targetTerm];
    if (reading) explainParts.push('[' + reading + ']');
    let explain = explainParts.join(' ') + (answer ? ' — ' + answer : '');
    if (item && item.explain) explain = String(item.explain);
    else if (example) explain += ' · ตัวอย่าง: "' + example + '"';

    return {
      kind: kind,
      prompt: prompt,
      badge: badge,
      answer: answer,
      options: shuffle((answer ? [answer] : []).concat(decoys)),
      reading: reading,
      example: example,
      explain: explain,
      item: item,
    };
  }

  function buildListenQuestion(item, pool, optionsOrSlug) {
    const opts = typeof optionsOrSlug === 'string'
      ? { categorySlug: optionsOrSlug }
      : (optionsOrSlug || {});
    const categorySlug = opts.categorySlug || '';
    const cleanPool = filterCleanPool(pool);
    const targetTerm = getItemTerm(item);
    const targetReading = item && item.reading ? String(item.reading).trim() : '';
    const initialChar = targetTerm.charAt(0).toLowerCase();
    const clue = getItemMeaning(item);

    const prompt = opts.listenPrompt || (categorySlug === 'homophones'
      ? 'ได้ยินคำอ่านเดียวกัน — เลือกคำที่ถูกต้อง'
      : 'ฟังเสียงแล้วเลือกคำที่ตรงกับเสียงที่ได้ยิน');

    const excludeTerms = new Set(targetTerm ? [targetTerm] : []);
    const decoys = [];

    if (categorySlug === 'homophones' && targetReading) {
      const sameReading = cleanPool
        .filter(function (w) { return getItemTerm(w) !== targetTerm && String(w.reading || '').trim() === targetReading; })
        .map(getItemTerm);
      Array.prototype.push.apply(decoys, pickUniqueStrings(sameReading, excludeTerms, 3));
    }

    if (decoys.length < 3 && initialChar) {
      const sameInitial = cleanPool
        .filter(function (w) {
          const t = getItemTerm(w);
          return t !== targetTerm && t.charAt(0).toLowerCase() === initialChar;
        })
        .map(getItemTerm);
      Array.prototype.push.apply(decoys, pickUniqueStrings(sameInitial, excludeTerms, 3 - decoys.length));
    }

    if (decoys.length < 3) {
      const wider = cleanPool
        .filter(function (w) { return getItemTerm(w) !== targetTerm; })
        .map(getItemTerm);
      Array.prototype.push.apply(decoys, pickUniqueStrings(wider, excludeTerms, 3 - decoys.length));
    }

    return {
      kind: 'listen',
      prompt: prompt,
      clue: clue,
      answer: targetTerm,
      options: shuffle((targetTerm ? [targetTerm] : []).concat(decoys)),
      reading: targetReading,
      locale: (item && item.locale) || opts.locale || 'th-TH',
      item: item,
    };
  }

  function computeComboPoints(baseScore, streak) {
    const base = Number.isFinite(baseScore) && baseScore > 0 ? baseScore : 10;
    const s = Number.isFinite(streak) ? streak : 0;
    let multiplier = 1;
    if (s >= 5) multiplier = 2;
    else if (s >= 3) multiplier = 1.5;
    return {
      points: Math.round(base * multiplier),
      multiplier: multiplier,
    };
  }

  function stopSpeak() {
    try {
      if (root.KAMPAI && root.KAMPAI.sound && typeof root.KAMPAI.sound.stopSpeak === 'function') {
        root.KAMPAI.sound.stopSpeak();
      }
    } catch (_) {}
    try {
      if (root.speechSynthesis && typeof root.speechSynthesis.cancel === 'function') {
        root.speechSynthesis.cancel();
      }
    } catch (_) {}
  }

  function speak(text, opts) {
    const clean = String(text || '').trim();
    if (!clean) return false;
    const cfg = opts || {};
    const lang = cfg.lang || cfg.locale || 'th-TH';
    const rate = Number.isFinite(cfg.rate) && cfg.rate > 0 ? cfg.rate : 0.9;

    stopSpeak();
    try {
      if (root.KAMPAI && root.KAMPAI.sound && typeof root.KAMPAI.sound.speak === 'function') {
        root.KAMPAI.sound.speak(clean, lang, true);
        return true;
      }
    } catch (_) {}

    try {
      if (root.speechSynthesis && typeof root.SpeechSynthesisUtterance === 'function') {
        const u = new root.SpeechSynthesisUtterance(clean);
        u.lang = lang;
        u.rate = rate;
        root.speechSynthesis.speak(u);
        return true;
      }
    } catch (_) {}
    return false;
  }

  function createSession(config) {
    const cfg = config || {};
    const mode = cfg.mode === 'game' ? 'game' : 'media';
    const isMedia = mode === 'media';
    const cleanPool = filterCleanPool(cfg.items || cfg.pool || []);
    const roundSize = Number.isFinite(cfg.roundSize) && cfg.roundSize > 0
      ? Math.min(Math.floor(cfg.roundSize), cleanPool.length || 1)
      : (cleanPool.length || 10);
    const questionType = cfg.questionType === 'listen' ? 'listen' : 'choice';
    const locale = cfg.locale || 'th-TH';
    const categorySlug = cfg.categorySlug || '';
    const baseScore = Number.isFinite(cfg.baseScore) && cfg.baseScore > 0 ? cfg.baseScore : 10;
    const initialLives = isMedia
      ? null
      : (Number.isFinite(cfg.lives) && cfg.lives > 0 ? Math.floor(cfg.lives) : 6);
    const timerEnabled = isMedia
      ? false
      : (cfg.timerEnabled !== undefined
        ? Boolean(cfg.timerEnabled)
        : (Number.isFinite(cfg.timerSeconds) && cfg.timerSeconds > 0));
    const scoreEnabled = !isMedia;

    const deck = createDeck(cleanPool, roundSize, categorySlug);
    let roundItems = deck.nextRound();
    let index = 0;
    let streak = 0;
    let bestStreak = 0;
    let correctCount = 0;
    let attemptedCount = 0;
    let score = 0;
    let lives = initialLives;
    let isGameOver = false;
    let isComplete = roundItems.length === 0;
    let cachedQuestion = null;

    function buildQ(item) {
      if (!item) return null;
      const qOpts = { categorySlug: categorySlug, locale: item.locale || locale };
      return questionType === 'listen'
        ? buildListenQuestion(item, cleanPool, qOpts)
        : buildChoiceQuestion(item, cleanPool, qOpts);
    }

    function currentQuestion() {
      if (isComplete || isGameOver || index >= roundItems.length) return null;
      if (!cachedQuestion) {
        cachedQuestion = buildQ(roundItems[index]);
      }
      return cachedQuestion;
    }

    function submitAnswer(selectedOption) {
      const q = currentQuestion();
      if (!q) {
        return {
          isCorrect: false,
          answer: '',
          explain: '',
          points: 0,
          multiplier: 1,
          streak: streak,
          livesRemaining: lives,
          isGameOver: isGameOver,
          isComplete: isComplete,
        };
      }

      attemptedCount += 1;
      const isCorrect = String(selectedOption || '') === String(q.answer || '');
      let points = 0;
      let multiplier = 1;

      if (isCorrect) {
        correctCount += 1;
        streak += 1;
        if (streak > bestStreak) bestStreak = streak;
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

      const result = {
        isCorrect: isCorrect,
        answer: q.answer,
        explain: q.explain || (q.clue || ''),
        points: points,
        multiplier: multiplier,
        streak: streak,
        livesRemaining: lives,
        isGameOver: isGameOver,
        isComplete: isComplete,
        item: q.item,
      };

      if (typeof cfg.onAnswer === 'function') cfg.onAnswer(result);
      return result;
    }

    function next() {
      if (isGameOver || index + 1 >= roundItems.length) {
        isComplete = true;
        cachedQuestion = null;
        if (typeof cfg.onComplete === 'function') cfg.onComplete(getState());
        return null;
      }
      index += 1;
      cachedQuestion = null;
      return currentQuestion();
    }

    function reset() {
      deck.reset();
      roundItems = deck.nextRound();
      index = 0;
      streak = 0;
      bestStreak = 0;
      correctCount = 0;
      attemptedCount = 0;
      score = 0;
      lives = initialLives;
      isGameOver = false;
      isComplete = roundItems.length === 0;
      cachedQuestion = null;
    }

    function getState() {
      return Object.freeze({
        mode: mode,
        questionType: questionType,
        locale: locale,
        index: index,
        total: roundItems.length,
        correctCount: correctCount,
        attemptedCount: attemptedCount,
        streak: streak,
        bestStreak: bestStreak,
        score: scoreEnabled ? score : null,
        lives: lives,
        timerEnabled: timerEnabled,
        scoreEnabled: scoreEnabled,
        isComplete: isComplete,
        isGameOver: isGameOver,
      });
    }

    return {
      currentQuestion: currentQuestion,
      submitAnswer: submitAnswer,
      next: next,
      reset: reset,
      getState: getState,
    };
  }

  // ═══ DOM CONTROLLER (MEDIA & GAME SAFE) ═══
  let activeSessionToken = 0;
  let advanceTimer = null;
  let lifecycleBound = false;

  function cleanup() {
    activeSessionToken += 1;
    if (advanceTimer) {
      clearTimeout(advanceTimer);
      advanceTimer = null;
    }
    stopSpeak();
  }

  function bindLifecycleOnce() {
    if (lifecycleBound || !root.document) return;
    lifecycleBound = true;
    root.document.addEventListener('visibilitychange', function () {
      if (root.document.hidden) stopSpeak();
    });
    if (typeof root.addEventListener === 'function') {
      root.addEventListener('pagehide', stopSpeak);
    }
  }

  function mountInteractive(questionType, containerOrOpts, maybeOpts) {
    cleanup();
    bindLifecycleOnce();
    const doc = root.document;
    if (!doc) return null;

    const opts = typeof containerOrOpts === 'string' || (containerOrOpts && containerOrOpts.nodeType)
      ? Object.assign({}, maybeOpts || {}, { container: containerOrOpts })
      : (containerOrOpts || {});

    const container = typeof opts.container === 'string'
      ? doc.querySelector(opts.container)
      : opts.container;
    if (!container) return null;

    const token = activeSessionToken;
    const session = createSession(Object.assign({}, opts, { questionType: questionType }));
    let answeredCurrent = false;

    function render() {
      if (token !== activeSessionToken) return;
      const st = session.getState();
      const q = session.currentQuestion();

      if (!q || st.isComplete || st.isGameOver) {
        container.innerHTML =
          '<div class="ke-quiz-summary">' +
            '<h3>' + (st.isGameOver ? 'จบเกมรอบนี้แล้ว' : 'ฝึกครบทุกข้อแล้ว!') + '</h3>' +
            '<p>ตอบถูก ' + st.correctCount + ' / ' + st.total + ' ข้อ</p>' +
            '<button type="button" class="ke-btn ke-retry-btn" style="min-height:44px">เริ่มรอบใหม่อีกครั้ง</button>' +
          '</div>';
        const retryBtn = container.querySelector('.ke-retry-btn');
        if (retryBtn) {
          retryBtn.onclick = function () {
            session.reset();
            answeredCurrent = false;
            render();
          };
        }
        return;
      }

      answeredCurrent = false;
      const itemLocale = (q.item && q.item.locale) || st.locale;
      const headerMeta = st.mode === 'game' && st.lives !== null
        ? '<span>ข้อ ' + (st.index + 1) + '/' + st.total + '</span> · <span>❤️ ' + st.lives + '</span>'
        : '<span>ข้อ ' + (st.index + 1) + '/' + st.total + '</span>';

      const speakText = getItemTerm(q.item);
      const clueHtml = questionType === 'listen' && q.clue
        ? '<p class="ke-clue" style="display:none"></p>'
        : '';

      container.innerHTML =
        '<div class="ke-quiz-card" data-mode="' + st.mode + '">' +
          '<div class="ke-quiz-head">' +
            '<span class="ke-badge">' + (q.badge || (questionType === 'listen' ? 'ฟังแล้วเลือก' : 'คำถาม')) + '</span>' +
            '<span class="ke-progress">' + headerMeta + '</span>' +
          '</div>' +
          '<p class="ke-prompt"></p>' +
          '<div class="ke-audio-row">' +
            '<button type="button" class="ke-btn ke-speak-btn" style="min-height:44px">🔊 ฟังเสียง</button>' +
            (questionType === 'listen' && q.clue
              ? '<button type="button" class="ke-btn ke-clue-btn" style="min-height:44px">💡 ใบ้ความหมาย</button>'
              : '') +
          '</div>' +
          clueHtml +
          '<div class="ke-options"></div>' +
          '<div class="ke-feedback" aria-live="polite"></div>' +
          '<button type="button" class="ke-btn ke-next-btn" style="min-height:44px;display:none">ข้อถัดไป →</button>' +
        '</div>';

      const promptEl = container.querySelector('.ke-prompt');
      if (promptEl) promptEl.textContent = q.prompt;

      const speakBtn = container.querySelector('.ke-speak-btn');
      if (speakBtn) {
        speakBtn.onclick = function () {
          if (typeof opts.speak === 'function') opts.speak(speakText, itemLocale);
          else speak(speakText, { locale: itemLocale });
        };
      }

      const clueBtn = container.querySelector('.ke-clue-btn');
      const clueEl = container.querySelector('.ke-clue');
      if (clueBtn && clueEl) {
        clueBtn.onclick = function () {
          clueEl.textContent = 'ความหมาย: ' + q.clue;
          clueEl.style.display = 'block';
          clueBtn.disabled = true;
        };
      }

      const optionsEl = container.querySelector('.ke-options');
      const feedbackEl = container.querySelector('.ke-feedback');
      const nextBtn = container.querySelector('.ke-next-btn');

      if (optionsEl) {
        q.options.forEach(function (optText) {
          const btn = doc.createElement('button');
          btn.type = 'button';
          btn.className = 'ke-option';
          btn.style.minHeight = '44px';
          btn.textContent = optText;
          btn.onclick = function () {
            if (answeredCurrent || token !== activeSessionToken) return;
            const res = session.submitAnswer(optText);

            if (st.mode === 'media' && !res.isCorrect) {
              btn.disabled = true;
              btn.classList.add('is-wrong');
              if (feedbackEl) {
                feedbackEl.className = 'ke-feedback is-learn';
                feedbackEl.textContent = 'ยังไม่ตรง — ลองเลือกอีกครั้ง (' + (res.explain || 'สังเกตคำศัพท์และความหมาย') + ')';
              }
              return;
            }

            answeredCurrent = true;
            Array.from(optionsEl.querySelectorAll('.ke-option')).forEach(function (b) {
              b.disabled = true;
              if (b.textContent === res.answer) b.classList.add('is-correct');
            });
            if (!res.isCorrect) btn.classList.add('is-wrong');
            if (feedbackEl) {
              feedbackEl.className = 'ke-feedback ' + (res.isCorrect ? 'is-good' : 'is-learn');
              feedbackEl.textContent = (res.isCorrect ? 'ถูกต้อง! ' : 'คำตอบที่ถูก: ' + res.answer + ' · ') + (res.explain || '');
            }
            if (nextBtn) {
              nextBtn.style.display = 'inline-flex';
              nextBtn.onclick = function () {
                session.next();
                render();
              };
            }
          };
          optionsEl.appendChild(btn);
        });
      }
    }

    render();
    return session;
  }

  function mountChoice(containerOrOpts, maybeOpts) {
    return mountInteractive('choice', containerOrOpts, maybeOpts);
  }

  function mountListen(containerOrOpts, maybeOpts) {
    return mountInteractive('listen', containerOrOpts, maybeOpts);
  }

  root.KampaiEngines.Quiz = {
    getItemTerm: getItemTerm,
    getItemMeaning: getItemMeaning,
    isValidItem: isValidItem,
    filterCleanPool: filterCleanPool,
    createDeck: createDeck,
    buildChoiceQuestion: buildChoiceQuestion,
    buildListenQuestion: buildListenQuestion,
    computeComboPoints: computeComboPoints,
    computeQuizCombo: computeComboPoints,
    speak: speak,
    stopSpeak: stopSpeak,
    createSession: createSession,
    mountChoice: mountChoice,
    mountListen: mountListen,
    cleanup: cleanup,
  };
})(typeof window !== 'undefined' ? window : globalThis);
