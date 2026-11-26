/* classify-bucket-engine.js — Subject-agnostic Multi-Bucket Classification Engine (IIFE) */
(function (global) {
  'use strict';

  const root = global || (typeof window !== 'undefined' ? window : globalThis);
  root.KampaiEngines = root.KampaiEngines || {};

  function shuffle(arr) {
    const out = Array.isArray(arr) ? arr.slice() : [];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function normalizeBuckets(buckets) {
    if (!Array.isArray(buckets)) return [];
    const seen = new Set();
    const out = [];
    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i];
      if (!b || typeof b !== 'object') continue;
      const id = String(b.id || b.key || '').trim();
      const label = String(b.label || b.title || id).trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      out.push({
        id: id,
        label: label,
        description: b.description ? String(b.description).trim() : '',
        icon: b.icon ? String(b.icon) : '',
        color: b.color ? String(b.color) : '',
      });
    }
    return out;
  }

  function getItemBucketId(item) {
    if (!item || typeof item !== 'object') return '';
    return String(item.bucketId || item.bucket || item.category || '').trim();
  }

  function getItemLabel(item) {
    if (!item || typeof item !== 'object') return '';
    return String(item.label || item.term || item.word || item.title || '').trim();
  }

  function filterItems(items, buckets) {
    if (!Array.isArray(items)) return [];
    const bucketIds = new Set(normalizeBuckets(buckets).map(function (b) { return b.id; }));
    const hasBucketList = bucketIds.size > 0;
    const out = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item || item.content_status === 'quarantined') continue;
      const label = getItemLabel(item);
      const bucketId = getItemBucketId(item);
      if (!label || !bucketId) continue;
      if (hasBucketList && !bucketIds.has(bucketId)) continue;
      out.push(Object.assign({}, item, {
        id: item.id ? String(item.id) : ('item-' + i),
        label: label,
        bucketId: bucketId,
        reason: String(item.reason || item.explain || item.explanation || '').trim(),
      }));
    }
    return out;
  }

  function findBucket(buckets, bucketId) {
    const cleanId = String(bucketId || '').trim();
    const list = normalizeBuckets(buckets);
    for (let i = 0; i < list.length; i++) {
      if (list[i].id === cleanId) return list[i];
    }
    return cleanId ? { id: cleanId, label: cleanId, description: '', icon: '', color: '' } : null;
  }

  function checkAnswer(item, bucketId, buckets) {
    const expectedId = getItemBucketId(item);
    const selectedId = String(bucketId || '').trim();
    const isCorrect = Boolean(expectedId && selectedId && expectedId === selectedId);
    const correctBucket = findBucket(buckets, expectedId);
    const selectedBucket = findBucket(buckets, selectedId);
    const reason = item && (item.reason || item.explain || item.explanation)
      ? String(item.reason || item.explain || item.explanation).trim()
      : (correctBucket ? 'จัดอยู่ในหมวด "' + correctBucket.label + '"' : '');

    return {
      isCorrect: isCorrect,
      reason: reason,
      correctBucket: correctBucket,
      correctBucketId: expectedId,
      selectedBucket: selectedBucket,
      selectedBucketId: selectedId,
    };
  }

  function createSession(items, buckets, options) {
    const opts = options || {};
    const mode = opts.mode === 'game' ? 'game' : 'media';
    const isMedia = mode === 'media';
    const cleanBuckets = normalizeBuckets(buckets);
    const cleanItems = filterItems(items, cleanBuckets);
    const shouldShuffle = opts.shuffle !== false;
    const roundSize = Number.isFinite(opts.roundSize) && opts.roundSize > 0
      ? Math.min(Math.floor(opts.roundSize), cleanItems.length)
      : cleanItems.length;
    const baseScore = Number.isFinite(opts.baseScore) && opts.baseScore > 0 ? opts.baseScore : 10;
    const initialLives = isMedia
      ? null
      : (Number.isFinite(opts.lives) && opts.lives > 0 ? Math.floor(opts.lives) : 6);
    const timerEnabled = isMedia
      ? false
      : (opts.timerEnabled !== undefined
        ? Boolean(opts.timerEnabled)
        : (Number.isFinite(opts.timerSeconds) && opts.timerSeconds > 0));
    const scoreEnabled = !isMedia;

    let queue = (shouldShuffle ? shuffle(cleanItems) : cleanItems.slice()).slice(0, roundSize);
    let index = 0;
    let streak = 0;
    let bestStreak = 0;
    let correctCount = 0;
    let attemptedCount = 0;
    let score = 0;
    let lives = initialLives;
    let isGameOver = false;
    let isComplete = queue.length === 0;
    const history = [];

    function currentItem() {
      if (isComplete || isGameOver || index >= queue.length) return null;
      return queue[index];
    }

    function sessionCheckAnswer(itemOrBucketId, maybeBucketId) {
      let targetItem = null;
      let chosenBucketId = '';

      if (typeof itemOrBucketId === 'string' && maybeBucketId === undefined) {
        targetItem = currentItem();
        chosenBucketId = itemOrBucketId;
      } else {
        targetItem = itemOrBucketId || currentItem();
        chosenBucketId = maybeBucketId;
      }

      if (!targetItem) {
        return {
          isCorrect: false,
          reason: '',
          correctBucket: null,
          correctBucketId: '',
          selectedBucket: null,
          selectedBucketId: '',
          streak: streak,
          livesRemaining: lives,
          isComplete: isComplete,
          isGameOver: isGameOver,
        };
      }

      const baseResult = checkAnswer(targetItem, chosenBucketId, cleanBuckets);
      attemptedCount += 1;

      if (baseResult.isCorrect) {
        correctCount += 1;
        streak += 1;
        if (streak > bestStreak) bestStreak = streak;
        if (scoreEnabled) score += baseScore;
      } else {
        streak = 0;
        if (!isMedia && lives !== null) {
          lives = Math.max(0, lives - 1);
          if (lives <= 0) isGameOver = true;
        }
      }

      const fullResult = Object.assign({}, baseResult, {
        item: targetItem,
        streak: streak,
        livesRemaining: lives,
        canRetry: isMedia && !baseResult.isCorrect,
        isComplete: isComplete,
        isGameOver: isGameOver,
        progress: {
          current: Math.min(index + 1, queue.length),
          total: queue.length,
        },
      });

      history.push({
        itemId: targetItem.id,
        selectedBucketId: baseResult.selectedBucketId,
        correctBucketId: baseResult.correctBucketId,
        isCorrect: baseResult.isCorrect,
      });

      if (typeof opts.onAnswer === 'function') opts.onAnswer(fullResult);
      return fullResult;
    }

    function next() {
      if (isGameOver || index + 1 >= queue.length) {
        isComplete = true;
        if (typeof opts.onComplete === 'function') opts.onComplete(getState());
        return null;
      }
      index += 1;
      return currentItem();
    }

    function reset() {
      queue = (shouldShuffle ? shuffle(cleanItems) : cleanItems.slice()).slice(0, roundSize);
      index = 0;
      streak = 0;
      bestStreak = 0;
      correctCount = 0;
      attemptedCount = 0;
      score = 0;
      lives = initialLives;
      isGameOver = false;
      isComplete = queue.length === 0;
      history.length = 0;
    }

    function getState() {
      return Object.freeze({
        mode: mode,
        index: index,
        total: queue.length,
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
        buckets: cleanBuckets.slice(),
        history: history.slice(),
      });
    }

    return {
      mode: mode,
      buckets: cleanBuckets,
      items: queue,
      currentItem: currentItem,
      getCurrentItem: currentItem,
      checkAnswer: sessionCheckAnswer,
      next: next,
      reset: reset,
      getState: getState,
    };
  }

  // ═══ ACCESSIBLE DOM CONTROLLER ═══
  let activeKeyHandler = null;

  function cleanup() {
    if (activeKeyHandler && root.document) {
      root.document.removeEventListener('keydown', activeKeyHandler);
      activeKeyHandler = null;
    }
  }

  function mount(containerOrSelector, config) {
    cleanup();
    const doc = root.document;
    if (!doc) return null;

    const cfg = config || {};
    const container = typeof containerOrSelector === 'string'
      ? doc.querySelector(containerOrSelector)
      : containerOrSelector;
    if (!container) return null;

    const session = createSession(cfg.items || [], cfg.buckets || [], cfg);
    let itemSolved = false;

    function render() {
      const st = session.getState();
      const item = session.currentItem();

      if (!item || st.isComplete || st.isGameOver) {
        container.innerHTML =
          '<div class="ke-classify-summary">' +
            '<h3>' + (st.isGameOver ? 'จบการจำแนกรอบนี้แล้ว' : 'จำแนกครบทุกข้อแล้ว!') + '</h3>' +
            '<p>ตอบถูก ' + st.correctCount + ' จาก ' + st.total + ' รายการ</p>' +
            '<button type="button" class="ke-btn ke-classify-retry" style="min-height:44px">ฝึกใหม่อีกครั้ง</button>' +
          '</div>';
        const retryBtn = container.querySelector('.ke-classify-retry');
        if (retryBtn) {
          retryBtn.onclick = function () {
            session.reset();
            itemSolved = false;
            render();
          };
        }
        return;
      }

      itemSolved = false;
      const metaText = st.mode === 'game' && st.lives !== null
        ? 'ข้อ ' + (st.index + 1) + '/' + st.total + ' · ❤️ ' + st.lives
        : 'ข้อ ' + (st.index + 1) + '/' + st.total;

      container.innerHTML =
        '<div class="ke-classify-card" data-mode="' + st.mode + '">' +
          '<div class="ke-classify-head">' +
            '<span class="ke-progress">' + metaText + '</span>' +
          '</div>' +
          '<div class="ke-classify-item">' +
            (item.icon ? '<span class="ke-item-icon" aria-hidden="true">' + item.icon + '</span>' : '') +
            '<strong class="ke-item-label"></strong>' +
            (item.sub ? '<span class="ke-item-sub"></span>' : '') +
          '</div>' +
          '<div class="ke-buckets" role="group" aria-label="เลือกหมวดหมู่ที่ถูกต้อง"></div>' +
          '<div class="ke-classify-feedback" aria-live="polite">เลือกหมวดหมู่ที่สัมพันธ์กับรายการนี้</div>' +
          '<button type="button" class="ke-btn ke-classify-next" style="min-height:44px;display:none">ข้อถัดไป →</button>' +
        '</div>';

      const labelEl = container.querySelector('.ke-item-label');
      if (labelEl) labelEl.textContent = item.label;
      const subEl = container.querySelector('.ke-item-sub');
      if (subEl && item.sub) subEl.textContent = item.sub;

      const bucketsEl = container.querySelector('.ke-buckets');
      const feedbackEl = container.querySelector('.ke-classify-feedback');
      const nextBtn = container.querySelector('.ke-classify-next');

      function chooseBucket(bucketId, btnEl) {
        if (itemSolved) return;
        const res = session.checkAnswer(item, bucketId);

        if (res.isCorrect) {
          itemSolved = true;
          Array.from(bucketsEl.querySelectorAll('.ke-bucket-btn')).forEach(function (b) { b.disabled = true; });
          btnEl.classList.add('is-correct');
          if (feedbackEl) {
            feedbackEl.className = 'ke-classify-feedback is-good';
            feedbackEl.textContent = 'ถูกต้อง! (' + res.correctBucket.label + ') · ' + res.reason;
          }
          if (nextBtn) {
            nextBtn.style.display = 'inline-flex';
            nextBtn.onclick = function () {
              session.next();
              render();
            };
          }
        } else if (st.mode === 'media') {
          btnEl.classList.add('is-wrong');
          btnEl.disabled = true;
          if (feedbackEl) {
            feedbackEl.className = 'ke-classify-feedback is-learn';
            feedbackEl.textContent = 'ยังไม่ใช่หมวดนี้ — ' + (res.reason || 'ลองสังเกตลักษณะอีกครั้ง');
          }
        } else {
          itemSolved = true;
          Array.from(bucketsEl.querySelectorAll('.ke-bucket-btn')).forEach(function (b) {
            b.disabled = true;
            if (b.dataset.bucketId === res.correctBucketId) b.classList.add('is-correct');
          });
          btnEl.classList.add('is-wrong');
          if (feedbackEl) {
            feedbackEl.className = 'ke-classify-feedback is-learn';
            feedbackEl.textContent = 'คำตอบที่ถูกคือ "' + res.correctBucket.label + '" · ' + res.reason;
          }
          if (nextBtn) {
            nextBtn.style.display = 'inline-flex';
            nextBtn.onclick = function () {
              session.next();
              render();
            };
          }
        }
      }

      session.buckets.forEach(function (bucket, idx) {
        const btn = doc.createElement('button');
        btn.type = 'button';
        btn.className = 'ke-bucket-btn';
        btn.style.minHeight = '44px';
        btn.dataset.bucketId = bucket.id;
        btn.setAttribute('aria-label', (idx + 1) + '. ' + bucket.label);
        btn.textContent = (bucket.icon ? bucket.icon + ' ' : '') + bucket.label;
        btn.onclick = function () { chooseBucket(bucket.id, btn); };
        bucketsEl.appendChild(btn);
      });
    }

    activeKeyHandler = function (e) {
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      const num = Number(e.key);
      if (num >= 1 && num <= session.buckets.length) {
        const btns = container.querySelectorAll('.ke-bucket-btn');
        if (btns[num - 1] && !btns[num - 1].disabled) {
          btns[num - 1].click();
        }
      }
    };
    doc.addEventListener('keydown', activeKeyHandler);

    render();
    return session;
  }

  root.KampaiEngines.ClassifyBucket = {
    normalizeBuckets: normalizeBuckets,
    checkAnswer: checkAnswer,
    createSession: createSession,
    mount: mount,
    cleanup: cleanup,
  };
})(typeof window !== 'undefined' ? window : globalThis);
