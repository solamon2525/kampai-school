(function (global) {
  'use strict';

  function isValidItem(item) {
    return Boolean(
      item &&
      item.content_status !== 'quarantined' &&
      typeof item.word === 'string' &&
      item.word.trim().length > 0 &&
      typeof item.meaning === 'string' &&
      item.meaning.trim().length > 0
    );
  }

  function filterCleanPool(pool) {
    if (!Array.isArray(pool)) return [];
    const seen = new Set();
    const result = [];
    for (let i = 0; i < pool.length; i++) {
      const item = pool[i];
      if (!isValidItem(item)) continue;
      const key = item.word.trim();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(item);
    }
    return result;
  }

  let currentDictationItem = null;

  function segmentThaiGraphemes(str) {
    const text = String(str || '').trim();
    if (!text) return [];
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const seg = new Intl.Segmenter('th', { granularity: 'grapheme' });
      const out = [];
      for (const s of seg.segment(text)) out.push(s.segment);
      return out;
    }
    const parts = [];
    for (let i = 0; i < text.length; i++) {
      let ch = text[i];
      while (i + 1 < text.length && /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/.test(text[i + 1])) {
        ch += text[++i];
      }
      parts.push(ch);
    }
    return parts;
  }

  function computeSpellingDiff(attempt, target) {
    const cleanAttempt = String(attempt || '').trim();
    const cleanTarget = String(target || '').trim();
    const targetG = segmentThaiGraphemes(cleanTarget);
    const attemptG = segmentThaiGraphemes(cleanAttempt);
    const isExact = cleanAttempt === cleanTarget;

    const targetSlots = targetG.map((ch, i) => {
      if (i >= attemptG.length) return { char: ch, status: 'missing' };
      return { char: ch, status: attemptG[i] === ch ? 'ok' : 'wrong' };
    });

    const maskHint = targetG.length
      ? targetG[0] + ' ' + targetG.slice(1).map(() => '_').join(' ') + ' (' + targetG.length + ' ตัวอักษร)'
      : '';

    return { isExact, targetSlots, maskHint, graphemeCount: targetG.length };
  }

  function shuffle(arr) {
    const copy = arr.slice();
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  function createQuizDeck(pool, categorySlug, roundSize) {
    const cleanPool = filterCleanPool(pool);
    const targetSize = Number.isFinite(roundSize) && roundSize > 0 ? Math.floor(roundSize) : 12;
    let queue = shuffle(cleanPool);

    function nextRound() {
      if (cleanPool.length === 0) return [];
      const count = Math.min(targetSize, cleanPool.length);
      const picked = [];
      const pickedWords = new Set();

      while (picked.length < count && queue.length > 0) {
        const item = queue.shift();
        if (!pickedWords.has(item.word)) {
          picked.push(item);
          pickedWords.add(item.word);
        }
      }

      if (picked.length < count) {
        const refill = shuffle(cleanPool.filter((item) => !pickedWords.has(item.word)));
        while (picked.length < count && refill.length > 0) {
          const item = refill.shift();
          picked.push(item);
          pickedWords.add(item.word);
        }
        queue = refill;
      }

      return picked;
    }

    function remaining() {
      return queue.length;
    }

    return {
      categorySlug: categorySlug || '',
      nextRound: nextRound,
      remaining: remaining,
    };
  }

  function pickUniqueStrings(candidates, excludeSet, limit) {
    const picked = [];
    const shuffled = shuffle(candidates);
    for (let i = 0; i < shuffled.length && picked.length < limit; i++) {
      const val = shuffled[i];
      if (typeof val !== 'string' || !val.trim()) continue;
      if (excludeSet.has(val)) continue;
      excludeSet.add(val);
      picked.push(val);
    }
    return picked;
  }

  function buildChoiceQuestion(wordItem, pool, categorySlug) {
    const cleanPool = filterCleanPool(pool);
    const targetWord = wordItem && wordItem.word ? wordItem.word : '';
    const answer = wordItem && wordItem.meaning ? wordItem.meaning : '';

    let kind = 'meaning';
    let badge = 'ทายความหมาย';
    let prompt = 'คำว่า "' + targetWord + '" มีความหมายตรงกับข้อใด?';

    if (wordItem && typeof wordItem.example === 'string' && targetWord && wordItem.example.includes(targetWord)) {
      kind = 'cloze';
      badge = 'เติมคำในประโยค';
      prompt = wordItem.example.split(targetWord).join('_____');
    } else if (categorySlug === 'classifiers' && wordItem && wordItem.classifier_for) {
      kind = 'classifier';
      badge = 'ลักษณนาม';
      prompt = '"' + wordItem.classifier_for + ' 1 ___" — เลือกลักษณนามที่ถูก';
    }

    const excludeMeanings = new Set([answer]);
    const decoys = [];

    if (categorySlug === 'synonyms' && wordItem && wordItem.synonym_group) {
      const sameGroup = cleanPool
        .filter((w) => w.word !== targetWord && w.synonym_group === wordItem.synonym_group)
        .map((w) => w.meaning);
      decoys.push.apply(decoys, pickUniqueStrings(sameGroup, excludeMeanings, 3));
    }

    if (decoys.length < 3) {
      const wider = cleanPool
        .filter((w) => w.word !== targetWord)
        .map((w) => w.meaning);
      decoys.push.apply(decoys, pickUniqueStrings(wider, excludeMeanings, 3 - decoys.length));
    }

    return {
      kind: kind,
      prompt: prompt,
      badge: badge,
      answer: answer,
      options: shuffle([answer].concat(decoys)),
    };
  }

  function buildListenQuestion(wordItem, pool, categorySlug) {
    const cleanPool = filterCleanPool(pool);
    const targetWord = wordItem && wordItem.word ? wordItem.word : '';
    const targetReading = wordItem && wordItem.reading ? wordItem.reading : '';
    const initialChar = targetWord.trim().charAt(0);

    const prompt = categorySlug === 'homophones'
      ? 'ได้ยินคำอ่านเดียวกัน — เลือกคำที่ถูกต้อง'
      : 'ได้ยินคำว่าอะไร? เลือกคำที่ถูกต้อง';
    const clue = wordItem && wordItem.meaning ? wordItem.meaning : '';

    const excludeWords = new Set([targetWord]);
    const decoys = [];

    if (categorySlug === 'homophones' && targetReading) {
      const sameReading = cleanPool
        .filter((w) => w.word !== targetWord && w.reading === targetReading)
        .map((w) => w.word);
      decoys.push.apply(decoys, pickUniqueStrings(sameReading, excludeWords, 3));
    }

    if (decoys.length < 3 && initialChar) {
      const sameInitial = cleanPool
        .filter((w) => w.word !== targetWord && w.word.trim().charAt(0) === initialChar)
        .map((w) => w.word);
      decoys.push.apply(decoys, pickUniqueStrings(sameInitial, excludeWords, 3 - decoys.length));
    }

    if (decoys.length < 3) {
      const wider = cleanPool
        .filter((w) => w.word !== targetWord)
        .map((w) => w.word);
      decoys.push.apply(decoys, pickUniqueStrings(wider, excludeWords, 3 - decoys.length));
    }

    return {
      prompt: prompt,
      clue: clue,
      answer: targetWord,
      options: shuffle([targetWord].concat(decoys)),
    };
  }

  function computeQuizCombo(baseScore, streak) {
    const base = Number.isFinite(baseScore) && baseScore > 0 ? baseScore : 10;
    const s = Number.isFinite(streak) ? streak : 0;
    let multiplier = 1;
    if (s >= 5) {
      multiplier = 2;
    } else if (s >= 3) {
      multiplier = 1.5;
    }
    return {
      points: Math.round(base * multiplier),
      multiplier: multiplier,
    };
  }

  let advanceTimer = null;
  let activeSessionId = 0;
  let currentListenItem = null;
  const deckCache = new Map();

  function getOrCreateDeck(mode, pool, slug) {
    const key = mode + ':' + (slug || '') + ':' + (Array.isArray(pool) ? pool.length : 0);
    let deck = deckCache.get(key);
    if (!deck) {
      deck = createQuizDeck(pool, slug, 12);
      deckCache.set(key, deck);
    }
    return deck;
  }

  function cleanup() {
    activeSessionId += 1;
    if (advanceTimer) {
      clearTimeout(advanceTimer);
      advanceTimer = null;
    }
    currentListenItem = null;
  }

  function speakSlow(text, fallbackSpeak) {
    if (!text) return;
    if (typeof global.speechSynthesis !== 'undefined' && typeof global.SpeechSynthesisUtterance === 'function') {
      try {
        global.speechSynthesis.cancel();
        const u = new global.SpeechSynthesisUtterance(text);
        u.lang = 'th-TH';
        u.rate = 0.72;
        global.speechSynthesis.speak(u);
        return;
      } catch (_) {
        // fallback below
      }
    }
    if (typeof fallbackSpeak === 'function') {
      fallbackSpeak(text);
    }
  }

  function updateComboBadge(el, streak, multiplier) {
    if (!el) return;
    if (streak > 0 && multiplier > 1) {
      el.textContent = '🔥 คอมโบ ' + streak + ' (×' + multiplier + ')';
    } else if (streak > 0) {
      el.textContent = '🔥 คอมโบ ' + streak;
    } else {
      el.textContent = '✨ คอมโบ 0';
    }
  }

  function mountChoice(callbacks) {
    cleanup();
    const sessionId = activeSessionId;
    const cb = callbacks || {};
    const pool = (typeof cb.getPool === 'function' ? cb.getPool() : []) || [];
    const slug = (typeof cb.getCategorySlug === 'function' ? cb.getCategorySlug() : '') || '';
    const baseScore = typeof cb.getBaseScore === 'function' ? cb.getBaseScore() : 10;

    const deck = getOrCreateDeck('choice', pool, slug);
    const roundItems = deck.nextRound();
    if (!roundItems.length) {
      if (typeof cb.onRoundEnd === 'function') cb.onRoundEnd();
      return;
    }

    const doc = global.document;
    if (!doc) return;

    const progressBadge = doc.getElementById('choice-progress-badge');
    const comboBadge = doc.getElementById('choice-combo-badge');
    const hintBtn = doc.getElementById('choice-hint-btn');
    const speakBtn = doc.getElementById('choice-speak-btn');
    const kindBadge = doc.getElementById('choice-kind-badge');
    const questionText = doc.getElementById('choice-question-text');
    const optionsEl = doc.getElementById('choice-options');
    const feedbackBox = doc.getElementById('choice-feedback-box');
    const feedbackText = doc.getElementById('choice-feedback-text');
    const nextBtn = doc.getElementById('choice-next-btn');
    const barEl = doc.getElementById('bar');

    let idx = 0;
    let streak = 0;
    let hintsLeft = 2;
    let isAnswered = false;
    let hintUsedThisQ = false;
    let shouldEnd = false;
    let currentQ = null;
    let currentWord = null;

    function advance() {
      if (sessionId !== activeSessionId) return;
      if (advanceTimer) {
        clearTimeout(advanceTimer);
        advanceTimer = null;
      }
      if (shouldEnd || idx + 1 >= roundItems.length) {
        if (barEl) barEl.style.width = '100%';
        if (typeof cb.onRoundEnd === 'function') cb.onRoundEnd();
        return;
      }
      idx += 1;
      renderQuestion();
    }

    function renderQuestion() {
      if (sessionId !== activeSessionId) return;
      if (idx >= roundItems.length) {
        if (typeof cb.onRoundEnd === 'function') cb.onRoundEnd();
        return;
      }

      isAnswered = false;
      hintUsedThisQ = false;
      shouldEnd = false;
      currentWord = roundItems[idx];
      currentQ = buildChoiceQuestion(currentWord, pool, slug);

      if (progressBadge) progressBadge.textContent = 'ข้อ ' + (idx + 1) + '/' + roundItems.length;
      updateComboBadge(comboBadge, streak, computeQuizCombo(baseScore, streak).multiplier);
      if (kindBadge) kindBadge.textContent = currentQ.badge;
      if (questionText) questionText.textContent = currentQ.prompt;
      if (feedbackBox) feedbackBox.style.display = 'none';
      if (feedbackText) feedbackText.textContent = '';
      if (barEl) barEl.style.width = ((idx / roundItems.length) * 100) + '%';

      if (hintBtn) {
        hintBtn.textContent = '💡 ตัดตัวเลือก 50/50 (' + hintsLeft + ')';
        hintBtn.disabled = hintsLeft <= 0;
      }

      if (optionsEl) {
        optionsEl.innerHTML = '';
        currentQ.options.forEach(function (opt) {
          const btn = doc.createElement('button');
          btn.type = 'button';
          btn.className = 'option-btn';
          btn.textContent = opt;
          btn.onclick = function () {
            if (isAnswered || sessionId !== activeSessionId) return;
            isAnswered = true;

            const allBtns = optionsEl.querySelectorAll('.option-btn');
            allBtns.forEach(function (b) { b.disabled = true; });
            if (hintBtn) hintBtn.disabled = true;

            if (opt === currentQ.answer) {
              btn.classList.add('correct');
              streak += 1;
              const combo = computeQuizCombo(baseScore, streak);
              updateComboBadge(comboBadge, streak, combo.multiplier);
              if (typeof cb.onCorrect === 'function') cb.onCorrect(currentWord, combo.points);
            } else {
              btn.classList.add('wrong');
              allBtns.forEach(function (b) {
                if (b.textContent === currentQ.answer) b.classList.add('correct');
              });
              streak = 0;
              updateComboBadge(comboBadge, 0, 1);
              if (typeof cb.onWrong === 'function') {
                const alive = cb.onWrong(currentWord);
                if (alive === false) shouldEnd = true;
              }
            }

            if (feedbackText) {
              const parts = [currentWord.word];
              if (currentWord.reading) parts.push('[' + currentWord.reading + ']');
              let msg = parts.join(' ') + ' — ' + currentWord.meaning;
              if (currentWord.example) msg += ' · ตัวอย่าง: “' + currentWord.example + '”';
              feedbackText.textContent = msg;
            }
            if (feedbackBox) feedbackBox.style.display = 'flex';

            advanceTimer = setTimeout(advance, 1400);
          };
          optionsEl.appendChild(btn);
        });
      }
    }

    if (hintBtn) {
      hintBtn.onclick = function () {
        if (sessionId !== activeSessionId || isAnswered || hintUsedThisQ || hintsLeft <= 0 || !optionsEl || !currentQ) return;
        const wrongBtns = Array.from(optionsEl.querySelectorAll('.option-btn')).filter(function (b) {
          return !b.disabled && b.textContent !== currentQ.answer;
        });
        const toEliminate = shuffle(wrongBtns).slice(0, 2);
        toEliminate.forEach(function (b) {
          b.disabled = true;
          b.classList.add('hint-eliminated');
        });
        hintUsedThisQ = true;
        hintsLeft -= 1;
        hintBtn.textContent = '💡 ตัดตัวเลือก 50/50 (' + hintsLeft + ')';
        hintBtn.disabled = true;
      };
    }

    if (speakBtn) {
      speakBtn.onclick = function () {
        if (sessionId !== activeSessionId || !currentWord) return;
        if (typeof cb.speak === 'function') cb.speak(currentWord.word);
      };
    }

    if (nextBtn) {
      nextBtn.onclick = function () {
        advance();
      };
    }

    renderQuestion();
  }

  function mountListen(callbacks) {
    cleanup();
    const sessionId = activeSessionId;
    const cb = callbacks || {};
    const pool = (typeof cb.getPool === 'function' ? cb.getPool() : []) || [];
    const slug = (typeof cb.getCategorySlug === 'function' ? cb.getCategorySlug() : '') || '';
    const baseScore = typeof cb.getBaseScore === 'function' ? cb.getBaseScore() : 10;

    const deck = getOrCreateDeck('listen', pool, slug);
    const roundItems = deck.nextRound();
    if (!roundItems.length) {
      if (typeof cb.onRoundEnd === 'function') cb.onRoundEnd();
      return;
    }

    const doc = global.document;
    if (!doc) return;

    const progressBadge = doc.getElementById('listen-progress-badge');
    const comboBadge = doc.getElementById('listen-combo-badge');
    const hintBtn = doc.getElementById('listen-hint-btn');
    const playBtn = doc.getElementById('listen-play-btn');
    const slowBtn = doc.getElementById('listen-slow-btn');
    const hintText = doc.getElementById('listen-hint');
    const clueBox = doc.getElementById('listen-clue-box');
    const optionsEl = doc.getElementById('listen-options');
    const feedbackBox = doc.getElementById('listen-feedback-box');
    const feedbackText = doc.getElementById('listen-feedback-text');
    const nextBtn = doc.getElementById('listen-next-btn');
    const barEl = doc.getElementById('bar');

    let idx = 0;
    let streak = 0;
    let hintsLeft = 2;
    let isAnswered = false;
    let hintUsedThisQ = false;
    let shouldEnd = false;
    let currentQ = null;
    let currentWord = null;

    function advance() {
      if (sessionId !== activeSessionId) return;
      if (advanceTimer) {
        clearTimeout(advanceTimer);
        advanceTimer = null;
      }
      if (shouldEnd || idx + 1 >= roundItems.length) {
        if (barEl) barEl.style.width = '100%';
        if (typeof cb.onRoundEnd === 'function') cb.onRoundEnd();
        return;
      }
      idx += 1;
      renderQuestion();
    }

    function renderQuestion() {
      if (sessionId !== activeSessionId) return;
      if (idx >= roundItems.length) {
        if (typeof cb.onRoundEnd === 'function') cb.onRoundEnd();
        return;
      }

      isAnswered = false;
      hintUsedThisQ = false;
      shouldEnd = false;
      currentWord = roundItems[idx];
      currentListenItem = currentWord;
      currentQ = buildListenQuestion(currentWord, pool, slug);

      if (progressBadge) progressBadge.textContent = 'ข้อ ' + (idx + 1) + '/' + roundItems.length;
      updateComboBadge(comboBadge, streak, computeQuizCombo(baseScore, streak).multiplier);
      if (hintText) hintText.textContent = currentQ.prompt;
      if (clueBox) {
        clueBox.style.display = 'none';
        clueBox.textContent = '';
      }
      if (feedbackBox) feedbackBox.style.display = 'none';
      if (feedbackText) feedbackText.textContent = '';
      if (barEl) barEl.style.width = ((idx / roundItems.length) * 100) + '%';

      if (hintBtn) {
        hintBtn.textContent = '💡 ใบ้ความหมาย (' + hintsLeft + ')';
        hintBtn.disabled = hintsLeft <= 0;
      }

      if (optionsEl) {
        optionsEl.innerHTML = '';
        currentQ.options.forEach(function (opt) {
          const btn = doc.createElement('button');
          btn.type = 'button';
          btn.className = 'option-btn';
          btn.textContent = opt;
          btn.onclick = function () {
            if (isAnswered || sessionId !== activeSessionId) return;
            isAnswered = true;

            const allBtns = optionsEl.querySelectorAll('.option-btn');
            allBtns.forEach(function (b) { b.disabled = true; });
            if (hintBtn) hintBtn.disabled = true;

            if (opt === currentQ.answer) {
              btn.classList.add('correct');
              streak += 1;
              const combo = computeQuizCombo(baseScore, streak);
              updateComboBadge(comboBadge, streak, combo.multiplier);
              if (typeof cb.onCorrect === 'function') cb.onCorrect(currentWord, combo.points);
            } else {
              btn.classList.add('wrong');
              allBtns.forEach(function (b) {
                if (b.textContent === currentQ.answer) b.classList.add('correct');
              });
              streak = 0;
              updateComboBadge(comboBadge, 0, 1);
              if (typeof cb.onWrong === 'function') {
                const alive = cb.onWrong(currentWord);
                if (alive === false) shouldEnd = true;
              }
            }

            if (feedbackText) {
              const parts = [currentWord.word];
              if (currentWord.reading) parts.push('[' + currentWord.reading + ']');
              feedbackText.textContent = parts.join(' ') + ' — ' + currentWord.meaning;
            }
            if (feedbackBox) feedbackBox.style.display = 'flex';

            advanceTimer = setTimeout(advance, 1400);
          };
          optionsEl.appendChild(btn);
        });
      }

      if (typeof cb.speak === 'function') {
        cb.speak(currentWord.word);
      }
    }

    if (playBtn) {
      playBtn.onclick = function () {
        if (sessionId !== activeSessionId || !currentWord) return;
        if (typeof cb.speak === 'function') cb.speak(currentWord.word);
      };
    }

    if (slowBtn) {
      slowBtn.onclick = function () {
        if (sessionId !== activeSessionId || !currentWord) return;
        speakSlow(currentWord.word, cb.speak);
      };
    }

    if (hintBtn) {
      hintBtn.onclick = function () {
        if (sessionId !== activeSessionId || isAnswered || hintUsedThisQ || hintsLeft <= 0 || !currentWord) return;
        if (clueBox) {
          clueBox.textContent = 'ความหมาย: ' + currentWord.meaning;
          clueBox.style.display = 'block';
        }
        hintUsedThisQ = true;
        hintsLeft -= 1;
        hintBtn.textContent = '💡 ใบ้ความหมาย (' + hintsLeft + ')';
        hintBtn.disabled = true;
      };
    }

    if (nextBtn) {
      nextBtn.onclick = function () {
        advance();
      };
    }

    renderQuestion();
  }

  function bindTeacherToolsToggle() {
    const doc = global.document;
    if (!doc) return;
    const btn = doc.getElementById('btn-teacher-tools-toggle');
    const drawer = doc.getElementById('teacher-tools-drawer');
    if (!btn || !drawer || btn.dataset.quizTeacherBound) return;
    btn.dataset.quizTeacherBound = '1';
    btn.addEventListener('click', function () {
      const group = btn.closest('.toolbar-group-teacher');
      if (group && btn.hasAttribute('onclick')) {
        const isOpen = group.classList.contains('is-open');
        drawer.classList.toggle('open', isOpen);
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      } else {
        const isOpen = drawer.classList.toggle('open');
        if (group) group.classList.toggle('is-open', isOpen);
        btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      }
    });
  }

  function getCurrentListenWord() {
    return currentListenItem;
  }

  function getCurrentDictationWord() {
    return currentDictationItem;
  }

  function mountDictation(callbacks) {
    cleanup();
    const sessionId = activeSessionId;
    const cb = callbacks || {};
    const pool = (typeof cb.getPool === 'function' ? cb.getPool() : []) || [];
    const slug = (typeof cb.getCategorySlug === 'function' ? cb.getCategorySlug() : '') || '';
    const baseScore = typeof cb.getBaseScore === 'function' ? cb.getBaseScore() : 10;

    const deck = getOrCreateDeck('dictation', pool, slug);
    const roundItems = deck.nextRound();
    if (!roundItems.length) {
      if (typeof cb.onRoundEnd === 'function') cb.onRoundEnd();
      return;
    }

    const doc = global.document;
    if (!doc) return;

    const progressBadge = doc.getElementById('dictation-progress-badge');
    const comboBadge = doc.getElementById('dictation-combo-badge');
    const hintBtn = doc.getElementById('dictation-hint-btn');
    const playBtn = doc.getElementById('dictation-play-btn');
    const slowBtn = doc.getElementById('dictation-slow-btn');
    const clueBox = doc.getElementById('dictation-clue-box');
    const inputEl = doc.getElementById('dictation-input');
    const submitBtn = doc.getElementById('dictation-submit-btn');
    const feedbackBox = doc.getElementById('dictation-feedback-box');
    const diffRow = doc.getElementById('dictation-diff-row');
    const feedbackText = doc.getElementById('dictation-feedback-text');
    const nextBtn = doc.getElementById('dictation-next-btn');
    const barEl = doc.getElementById('bar');

    let idx = 0;
    let streak = 0;
    let hintsLeft = 2;
    let isAnswered = false;
    let hintUsedThisQ = false;
    let shouldEnd = false;
    let currentWord = null;

    function advance() {
      if (sessionId !== activeSessionId) return;
      if (advanceTimer) {
        clearTimeout(advanceTimer);
        advanceTimer = null;
      }
      if (shouldEnd || idx + 1 >= roundItems.length) {
        if (barEl) barEl.style.width = '100%';
        if (typeof cb.onRoundEnd === 'function') cb.onRoundEnd();
        return;
      }
      idx += 1;
      renderQuestion();
    }

    function renderQuestion() {
      if (sessionId !== activeSessionId) return;
      if (idx >= roundItems.length) {
        if (typeof cb.onRoundEnd === 'function') cb.onRoundEnd();
        return;
      }

      isAnswered = false;
      hintUsedThisQ = false;
      shouldEnd = false;
      currentWord = roundItems[idx];
      currentDictationItem = currentWord;

      if (progressBadge) progressBadge.textContent = 'ข้อ ' + (idx + 1) + '/' + roundItems.length;
      updateComboBadge(comboBadge, streak, computeQuizCombo(baseScore, streak).multiplier);
      if (clueBox) {
        clueBox.style.display = 'none';
        clueBox.textContent = '';
      }
      if (feedbackBox) feedbackBox.style.display = 'none';
      if (diffRow) diffRow.innerHTML = '';
      if (hintBtn) {
        hintBtn.textContent = '💡 ใบ้ตัวอักษร (' + hintsLeft + ')';
        hintBtn.disabled = hintsLeft <= 0;
      }
      if (inputEl) {
        inputEl.value = '';
        inputEl.disabled = false;
        inputEl.focus();
      }
      if (submitBtn) submitBtn.disabled = false;

      if (typeof cb.speak === 'function') cb.speak(currentWord.word);
      if (barEl) barEl.style.width = ((idx / roundItems.length) * 100) + '%';
    }

    function handleSubmit() {
      if (sessionId !== activeSessionId || isAnswered || !currentWord || !inputEl) return;
      const attempt = inputEl.value.trim();
      if (!attempt) {
        if (typeof cb.toast === 'function') cb.toast('กรุณาพิมพ์สะกดคำศัพท์ก่อนส่งคำตอบ', 'wrong');
        return;
      }

      isAnswered = true;
      inputEl.disabled = true;
      if (submitBtn) submitBtn.disabled = true;
      if (hintBtn) hintBtn.disabled = true;

      const diff = computeSpellingDiff(attempt, currentWord.word);
      if (diff.isExact) {
        streak += 1;
        const res = computeQuizCombo(baseScore, streak);
        updateComboBadge(comboBadge, streak, res.multiplier);
        if (typeof cb.onCorrect === 'function') cb.onCorrect(currentWord, res.points);
      } else {
        streak = 0;
        updateComboBadge(comboBadge, streak, 1);
        const alive = typeof cb.onWrong === 'function' ? cb.onWrong(currentWord) : true;
        if (!alive) shouldEnd = true;
      }

      if (diffRow) {
        diffRow.innerHTML = '';
        diff.targetSlots.forEach((slot) => {
          const span = doc.createElement('span');
          span.className = 'diff-char ' + slot.status;
          span.textContent = slot.char;
          diffRow.appendChild(span);
        });
      }

      if (feedbackText) {
        const parts = [];
        if (!diff.isExact) parts.push('คำที่ถูกต้อง: ' + currentWord.word);
        if (currentWord.reading) parts.push('[' + currentWord.reading + ']');
        if (currentWord.meaning) parts.push(currentWord.meaning);
        if (currentWord.example) parts.push('ตัวอย่าง: "' + currentWord.example + '"');
        feedbackText.textContent = parts.join(' · ');
      }
      if (feedbackBox) feedbackBox.style.display = 'flex';

      advanceTimer = setTimeout(advance, diff.isExact ? 1400 : 2000);
    }

    if (playBtn) {
      playBtn.onclick = function () {
        if (sessionId !== activeSessionId || !currentWord) return;
        if (typeof cb.speak === 'function') cb.speak(currentWord.word);
      };
    }
    if (slowBtn) {
      slowBtn.onclick = function () {
        if (sessionId !== activeSessionId || !currentWord) return;
        speakSlow(currentWord.word, cb.speak);
      };
    }
    if (hintBtn) {
      hintBtn.onclick = function () {
        if (sessionId !== activeSessionId || isAnswered || hintUsedThisQ || hintsLeft <= 0 || !currentWord) return;
        const diff = computeSpellingDiff('', currentWord.word);
        if (clueBox) {
          clueBox.textContent = 'คำใบ้: ' + diff.maskHint + (currentWord.meaning ? ' · ' + currentWord.meaning : '');
          clueBox.style.display = 'block';
        }
        hintUsedThisQ = true;
        hintsLeft -= 1;
        hintBtn.textContent = '💡 ใบ้ตัวอักษร (' + hintsLeft + ')';
        hintBtn.disabled = true;
      };
    }
    if (submitBtn) submitBtn.onclick = handleSubmit;
    if (inputEl) {
      inputEl.onkeydown = function (e) {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleSubmit();
        }
      };
    }
    if (nextBtn) {
      nextBtn.onclick = function () {
        advance();
      };
    }

    renderQuestion();
  }

  global.ThaiVocabQuiz = {
    createQuizDeck: createQuizDeck,
    buildChoiceQuestion: buildChoiceQuestion,
    buildListenQuestion: buildListenQuestion,
    computeQuizCombo: computeQuizCombo,
    segmentThaiGraphemes: segmentThaiGraphemes,
    computeSpellingDiff: computeSpellingDiff,
    mountChoice: mountChoice,
    mountListen: mountListen,
    mountDictation: mountDictation,
    cleanup: cleanup,
    bindTeacherToolsToggle: bindTeacherToolsToggle,
    getCurrentListenWord: getCurrentListenWord,
    getCurrentDictationWord: getCurrentDictationWord,
  };
})(typeof window !== 'undefined' ? window : globalThis);
