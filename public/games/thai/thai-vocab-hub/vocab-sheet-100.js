/* vocab-sheet-100.js — ระบบรวมคำศัพท์จากหลายหมวดและจัดตาราง 100 คำต่อแผ่น A4 */
(function () {
  'use strict';

  const GRID_PRESETS = {
    '5x20-portrait': {
      id: '5x20-portrait',
      label: 'A4 แนวตั้ง 5×20 ช่อง (ตัวใหญ่สุด)',
      orientation: 'portrait',
      cols: 5,
      rows: 20,
      tableHeightMm: 252,
      fontSizes: { xl: '17pt', lg: '15pt', md: '13pt', sm: '11pt', xs: '9.5pt' },
    },
    '4x25-portrait': {
      id: '4x25-portrait',
      label: 'A4 แนวตั้ง 4×25 ช่อง (เหมาะกับคำ/สำนวนยาว)',
      orientation: 'portrait',
      cols: 4,
      rows: 25,
      tableHeightMm: 252,
      fontSizes: { xl: '15pt', lg: '13.5pt', md: '12pt', sm: '10.5pt', xs: '9pt' },
    },
    '5x20-landscape': {
      id: '5x20-landscape',
      label: 'A4 แนวนอน 5×20 ช่อง (ช่องกว้างพิเศษ)',
      orientation: 'landscape',
      cols: 5,
      rows: 20,
      tableHeightMm: 166,
      fontSizes: { xl: '14pt', lg: '12.5pt', md: '11.5pt', sm: '10pt', xs: '8.5pt' },
    },
    '10x10-landscape': {
      id: '10x10-landscape',
      label: 'A4 แนวนอน 10×10 ช่อง (ตารางจัตุรัส)',
      orientation: 'landscape',
      cols: 10,
      rows: 10,
      tableHeightMm: 166,
      fontSizes: { xl: '13.5pt', lg: '12pt', md: '10.5pt', sm: '9pt', xs: '8pt' },
    },
  };

  function sanitize(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function mulberry32(seed) {
    let a = (Number(seed) || 1) >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffleWithRng(items, rng) {
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function countThaiGraphemes(str) {
    const text = String(str || '').trim();
    if (!text) return 0;
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const seg = new Intl.Segmenter('th', { granularity: 'grapheme' });
      let count = 0;
      for (const _ of seg.segment(text)) count++;
      return count;
    }
    let count = 0;
    for (let i = 0; i < text.length; i++) {
      count++;
      while (i + 1 < text.length && /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/.test(text[i + 1])) {
        i++;
      }
    }
    return count;
  }

  function computeCellTypography(word, options) {
    const opts = options || {};
    const len = countThaiGraphemes(word);
    const penalty = opts.showReading ? 2 : 0;
    const effective = len + penalty;
    let fontClass = 'fs-xl';
    if (effective >= 23) fontClass = 'fs-xs';
    else if (effective >= 15) fontClass = 'fs-sm';
    else if (effective >= 10) fontClass = 'fs-md';
    else if (effective >= 6) fontClass = 'fs-lg';
    return { fontClass, graphemeCount: len };
  }

  function collectPoolWords(allWords, categories, selectedSlugs, grade) {
    const wordsMap = allWords || {};
    const catList = Array.isArray(categories) ? categories : [];
    const catTitleBySlug = {};
    catList.forEach((c) => {
      if (c && c.slug) catTitleBySlug[c.slug] = c.title || c.slug;
    });

    const slugs = Array.isArray(selectedSlugs) && selectedSlugs.length
      ? selectedSlugs
      : Object.keys(wordsMap);

    const targetGrade = grade && grade !== 'all' ? grade : null;
    const seen = new Set();
    const pool = [];

    for (let s = 0; s < slugs.length; s++) {
      const slug = slugs[s];
      const list = Array.isArray(wordsMap[slug]) ? wordsMap[slug] : [];
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (!item || item.content_status === 'quarantined') continue;
        if (targetGrade && item.grade !== targetGrade) continue;
        const cleanWord = String(item.word || '').trim();
        if (!cleanWord || seen.has(cleanWord)) continue;
        seen.add(cleanWord);
        pool.push({
          word: cleanWord,
          reading: item.reading || '',
          meaning: item.meaning || '',
          grade: item.grade || '',
          pos: item.pos || '',
          example: item.example || '',
          _categorySlug: slug,
          _categoryTitle: catTitleBySlug[slug] || slug,
        });
      }
    }
    return pool;
  }

  function buildBalancedSetFromBuckets(buckets, bucketKeys, setSize, rng) {
    const picked = [];
    const pickedWords = new Set();
    if (!bucketKeys.length) return picked;

    const perBucket = Math.max(1, Math.floor(setSize / bucketKeys.length));
    for (let k = 0; k < bucketKeys.length && picked.length < setSize; k++) {
      const list = buckets[bucketKeys[k]];
      let taken = 0;
      while (list.length > 0 && taken < perBucket && picked.length < setSize) {
        const item = list.shift();
        if (!pickedWords.has(item.word)) {
          picked.push(item);
          pickedWords.add(item.word);
          taken++;
        }
      }
    }

    if (picked.length < setSize) {
      let leftovers = [];
      for (let k = 0; k < bucketKeys.length; k++) {
        leftovers = leftovers.concat(buckets[bucketKeys[k]]);
      }
      leftovers = shuffleWithRng(leftovers, rng);
      for (let i = 0; i < leftovers.length && picked.length < setSize; i++) {
        const item = leftovers[i];
        if (!pickedWords.has(item.word)) {
          picked.push(item);
          pickedWords.add(item.word);
        }
      }
      // Remove consumed leftovers from buckets so subsequent sets don't repeat them
      const consumed = new Set(picked.map((x) => x.word));
      for (let k = 0; k < bucketKeys.length; k++) {
        buckets[bucketKeys[k]] = buckets[bucketKeys[k]].filter((x) => !consumed.has(x.word));
      }
    }

    return shuffleWithRng(picked, rng);
  }

  function build100WordSets(options) {
    const opts = options || {};
    const pool = Array.isArray(opts.pool) ? opts.pool : [];
    const setSize = Math.max(1, Number(opts.setSize) || 100);
    const setCount = Math.max(1, Number(opts.setCount) || 1);
    const mixMode = opts.mixMode || 'balanced';
    const seed = opts.seed != null ? Number(opts.seed) : (Date.now() & 0x7fffffff);
    const rng = mulberry32(seed);

    if (!pool.length) {
      return { sets: [], totalAvailable: 0, seed };
    }

    const sets = [];
    if (mixMode === 'sequential') {
      for (let s = 0; s < setCount; s++) {
        const start = (s * setSize) % pool.length;
        const slice = pool.slice(start, start + setSize);
        if (slice.length) sets.push(slice);
      }
      return { sets, totalAvailable: pool.length, seed };
    }

    if (mixMode === 'random') {
      let remaining = shuffleWithRng(pool, rng);
      for (let s = 0; s < setCount; s++) {
        if (!remaining.length) remaining = shuffleWithRng(pool, rng);
        const chunk = remaining.slice(0, Math.min(setSize, remaining.length));
        remaining = remaining.slice(chunk.length);
        sets.push(chunk);
      }
      return { sets, totalAvailable: pool.length, seed };
    }

    // Default: 'balanced' — fair round-robin per selected category without repeats across sets while pool lasts
    const makeBuckets = () => {
      const buckets = {};
      const keys = [];
      for (let i = 0; i < pool.length; i++) {
        const item = pool[i];
        const key = item._categorySlug || 'default';
        if (!buckets[key]) {
          buckets[key] = [];
          keys.push(key);
        }
        buckets[key].push(item);
      }
      keys.forEach((k) => {
        buckets[k] = shuffleWithRng(buckets[k], rng);
      });
      return { buckets, keys };
    };

    let state = makeBuckets();
    for (let s = 0; s < setCount; s++) {
      let totalLeft = 0;
      state.keys.forEach((k) => { totalLeft += state.buckets[k].length; });
      if (totalLeft === 0) state = makeBuckets();
      const setItems = buildBalancedSetFromBuckets(state.buckets, state.keys, setSize, rng);
      if (setItems.length) sets.push(setItems);
    }

    return { sets, totalAvailable: pool.length, seed };
  }

  window.ThaiVocabSheet100 = {
    GRID_PRESETS,
    sanitize,
    collectPoolWords,
    build100WordSets,
    computeCellTypography,
  };
})();
