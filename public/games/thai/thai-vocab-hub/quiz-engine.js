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

  global.ThaiVocabQuiz = {
    createQuizDeck: createQuizDeck,
    buildChoiceQuestion: buildChoiceQuestion,
    buildListenQuestion: buildListenQuestion,
    computeQuizCombo: computeQuizCombo,
  };
})(typeof window !== 'undefined' ? window : globalThis);
