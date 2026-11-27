/* rules.js — กติกาและสถานะบริสุทธิ์ (ไม่มี Phaser dependency — ทดสอบด้วย node --test ได้) */
(function (root) {
  'use strict';

  function createRng(seedOrFn) {
    if (typeof seedOrFn === 'function') return seedOrFn;
    let s = (Number(seedOrFn) || 123456789) >>> 0;
    return function () {
      s += 0x6D2B79F5;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffleWithRng(list, rng) {
    const arr = list.slice();
    const rand = createRng(rng || Math.random);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function createRoundState(cfg) {
    const maxLives = (cfg && cfg.MAX_LIVES) || 5;
    const lives = (cfg && cfg.LIVES) || 5;
    return {
      score: 0,
      lives: Math.min(lives, maxLives),
      maxLives: maxLives,
      correct: 0,
      wrong: 0,
      coins: 0,
      streak: 0,
      bestStreak: 0,
      stageIndex: 0,
      isGameOver: false,
      wonAll: false
    };
  }

  function applyCorrectWord(state, pair, cfg) {
    if (state.isGameOver) return { pointsAdded: 0, streak: state.streak };
    state.correct += 1;
    state.streak += 1;
    if (state.streak > state.bestStreak) state.bestStreak = state.streak;
    const base = (cfg && cfg.CORRECT_WORD_POINTS) || 100;
    const bonus = Math.min(state.streak - 1, 4) * ((cfg && cfg.STREAK_BONUS) || 25);
    const pointsAdded = base + bonus;
    state.score += pointsAdded;
    return {
      pointsAdded: pointsAdded,
      streak: state.streak,
      word: pair ? pair.correct : '',
      hint: pair ? pair.hint : ''
    };
  }

  function applyWrongWord(state, pair) {
    if (state.isGameOver) return { lives: state.lives, isGameOver: true };
    state.wrong += 1;
    state.streak = 0;
    state.lives = Math.max(0, state.lives - 1);
    if (state.lives <= 0) state.isGameOver = true;
    return {
      lives: state.lives,
      isGameOver: state.isGameOver,
      wrongWord: pair ? pair.wrong : '',
      correctWord: pair ? pair.correct : '',
      hint: pair ? pair.hint : ''
    };
  }

  function applyHazardHit(state) {
    if (state.isGameOver) return { lives: state.lives, isGameOver: true };
    state.streak = 0;
    state.lives = Math.max(0, state.lives - 1);
    if (state.lives <= 0) state.isGameOver = true;
    return { lives: state.lives, isGameOver: state.isGameOver };
  }

  function applyExtraHeart(state, cfg) {
    const maxLives = (cfg && cfg.MAX_LIVES) || state.maxLives || 5;
    if (state.lives < maxLives) {
      state.lives += 1;
      return { gained: true, lives: state.lives, bonusPoints: 0 };
    }
    const pts = (cfg && cfg.HEART_BONUS_POINTS) || 80;
    state.score += pts;
    return { gained: false, lives: state.lives, bonusPoints: pts };
  }

  function applyCoin(state, cfg) {
    const pts = (cfg && cfg.COIN_POINTS) || 20;
    state.coins += 1;
    state.score += pts;
    return pts;
  }

  function applyStomp(state, cfg) {
    const pts = (cfg && cfg.STOMP_POINTS) || 50;
    state.score += pts;
    return pts;
  }

  function applyStageClear(state, cfg, totalWorlds) {
    const bonus = ((cfg && cfg.STAGE_CLEAR_BONUS) || 250) + state.lives * 30;
    state.score += bonus;
    const nextIdx = state.stageIndex + 1;
    if (nextIdx >= (totalWorlds || 3)) {
      state.wonAll = true;
      state.isGameOver = true;
    } else {
      state.stageIndex = nextIdx;
    }
    return { bonus: bonus, wonAll: state.wonAll, nextStageIndex: state.stageIndex };
  }

  function calcStars(score, cfg) {
    const t = (cfg && cfg.STAR_THRESHOLDS) || [600, 1500, 2600];
    if (score >= t[2]) return 3;
    if (score >= t[1]) return 2;
    if (score >= t[0]) return 1;
    return 0;
  }

  function buildStageWordSlots(world, rng) {
    const rand = createRng(rng || Math.random);
    const shuffledPairs = shuffleWithRng(world.pairs, rand);
    return world.wordZones.map(function (zone, idx) {
      const pair = shuffledPairs[idx % shuffledPairs.length];
      const correctOnHigh = rand() >= 0.5;
      return {
        zoneId: idx,
        tileX: zone.tileX,
        highY: zone.highY,
        lowY: zone.lowY,
        correctOnHigh: correctOnHigh,
        pair: pair
      };
    });
  }

  const api = {
    createRng: createRng,
    shuffleWithRng: shuffleWithRng,
    createRoundState: createRoundState,
    applyCorrectWord: applyCorrectWord,
    applyWrongWord: applyWrongWord,
    applyHazardHit: applyHazardHit,
    applyExtraHeart: applyExtraHeart,
    applyCoin: applyCoin,
    applyStomp: applyStomp,
    applyStageClear: applyStageClear,
    calcStars: calcStars,
    buildStageWordSlots: buildStageWordSlots
  };

  root.ThaiMarioRules = api;
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }
})(typeof window !== 'undefined' ? window : globalThis);
