/* game.js — เชื่อม Godot 4.4.1 WebAssembly Engine เข้ากับ KAMPAI SDK, KampaiVersus และ KampaiOrient */
(function () {
  'use strict';

  const CFG = window.GAME_CONFIG;
  const DATA = window.GAME_DATA;

  KAMPAI.setSlug(CFG.SLUG);
  KAMPAI.sound.defaultBgm('none');
  KAMPAI.sound.mountToggles();

  function readSfxFlag() {
    try { return localStorage.getItem('mr_sfx') !== '0'; } catch (_) { return true; }
  }
  function readBgmFlag() {
    try { return localStorage.getItem('mr_bgm') !== '0'; } catch (_) { return true; }
  }

  // ── สื่อสารกับ Godot ผ่าน JavaScriptBridge ──
  window.KAMPAI_GODOT_READY = false;
  window.KAMPAI_BRIDGE_IN = {
    startSeq: 0,
    seed: 1337,
    paused: false,
    sfxOn: readSfxFlag(),
    bgmOn: readBgmFlag(),
    tLeft: false,
    tRight: false,
    tJump: false,
    tJumpJust: false
  };

  let lastScore = 0;
  let lastCorrect = 0;
  let lastWrong = 0;
  let lastLives = CFG.LIVES;
  let gameActive = false;
  let toastTimer = null;
  let godotBootPromise = null;

  document.addEventListener('click', function (e) {
    if (e.target && (e.target.id === 'kbtn-sfx' || e.target.id === 'kbtn-bgm')) {
      setTimeout(function () {
        window.KAMPAI_BRIDGE_IN.sfxOn = readSfxFlag();
        window.KAMPAI_BRIDGE_IN.bgmOn = readBgmFlag();
      }, 20);
    }
  });

  function updateHudDisplay(d) {
    lastScore = Number(d.score) || 0;
    lastCorrect = Number(d.correct) || 0;
    lastWrong = Number(d.wrong) || 0;
    lastLives = typeof d.lives === 'number' ? d.lives : CFG.LIVES;

    const scoreEl = document.getElementById('score-value');
    const wordEl = document.getElementById('word-count');
    const centerEl = document.getElementById('hud-center');
    const lifeEl = document.getElementById('life-container');
    if (scoreEl) scoreEl.textContent = String(lastScore);
    if (wordEl) wordEl.textContent = String(lastCorrect);
    if (centerEl && d.stageName) centerEl.textContent = String(d.stageName);
    if (lifeEl) {
      const maxL = Number(d.maxLives) || CFG.MAX_LIVES;
      let hearts = '';
      for (let i = 0; i < maxL; i++) hearts += i < lastLives ? '❤️' : '🖤';
      lifeEl.textContent = hearts;
    }
  }

  function showToast(text, good) {
    const el = document.getElementById('lesson-toast');
    if (!el) return;
    el.textContent = text;
    el.className = good ? 'good' : 'bad';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      el.className = 'hidden';
    }, good ? 2200 : 3400);
  }

  window.KAMPAI_BRIDGE_OUT = {
    onHud: function (d) {
      const prevScore = lastScore;
      updateHudDisplay(d);
      if (lastScore > prevScore) {
        const sc = document.getElementById('score-container');
        if (sc) {
          sc.classList.add('pop');
          setTimeout(function () { sc.classList.remove('pop'); }, 140);
        }
      }
      if (vs && gameActive) vs.report(lastScore, { correct: lastCorrect });
    },
    onToast: function (d) {
      showToast(d.message || '', !!d.good);
      KAMPAI.sound.fxFlash(!!d.good);
      if (d.speakWord) KAMPAI.sound.speak(d.speakWord, 'th-TH', true);
    },
    onRoundEnd: function (d) {
      lastScore = Number(d.score) || 0;
      lastCorrect = Number(d.correct) || 0;
      lastWrong = Number(d.wrong) || 0;
      lastLives = typeof d.lives === 'number' ? d.lives : 0;
      endGame(!!d.wonAll, false);
    }
  };

  // ── KampaiOrient ──
  KampaiOrient.init({
    prefer: CFG.ORIENTATION || 'landscape',
    lockOnStart: !!CFG.LOCK_ORIENTATION_ON_START,
    overlayLandscape: 'กรุณาหมุนเครื่องเป็น<b>แนวนอน</b><br>มาริโอตะลุยคำไทยเล่นถนัดที่สุดในแนวนอน',
    overlayPortrait: 'กรุณาหมุนเครื่องเป็น<b>แนวตั้ง</b>',
    onPauseChange: function (paused) {
      window.KAMPAI_BRIDGE_IN.paused = !!paused;
    }
  });

  document.addEventListener('visibilitychange', function () {
    window.KAMPAI_BRIDGE_IN.paused = document.hidden || KampaiOrient.isPaused();
  });

  // ── Touch Controls ──
  function updateTouchVisibility() {
    const isTouchDevice = ('ontouchstart' in window) || navigator.maxTouchPoints > 0 || window.innerWidth < 900;
    document.body.classList.toggle('show-touch', isTouchDevice);
  }
  updateTouchVisibility();
  window.addEventListener('resize', updateTouchVisibility);

  function bindTouchBtn(id, onDown, onUp) {
    const el = document.getElementById(id);
    if (!el) return;
    const down = function (e) { e.preventDefault(); el.classList.add('active'); onDown(); };
    const up = function (e) { if (e) e.preventDefault(); el.classList.remove('active'); onUp(); };
    el.addEventListener('pointerdown', down, { passive: false });
    el.addEventListener('pointerup', up, { passive: false });
    el.addEventListener('pointercancel', up, { passive: false });
    el.addEventListener('pointerleave', up, { passive: false });
  }
  bindTouchBtn('tbtn-left', function () { window.KAMPAI_BRIDGE_IN.tLeft = true; }, function () { window.KAMPAI_BRIDGE_IN.tLeft = false; });
  bindTouchBtn('tbtn-right', function () { window.KAMPAI_BRIDGE_IN.tRight = true; }, function () { window.KAMPAI_BRIDGE_IN.tRight = false; });
  bindTouchBtn('tbtn-jump', function () {
    if (!window.KAMPAI_BRIDGE_IN.tJump) window.KAMPAI_BRIDGE_IN.tJumpJust = true;
    window.KAMPAI_BRIDGE_IN.tJump = true;
  }, function () {
    window.KAMPAI_BRIDGE_IN.tJump = false;
  });

  // ── Menus & Leaderboard ──
  function renderPlayer() {
    const s = KAMPAI.student;
    const st = KAMPAI.stats;
    if (!s) return;
    const chip = document.getElementById('player-chip');
    if (!chip) return;
    const av = s.photoUrl
      ? '<img src="' + s.photoUrl + '" alt="" style="object-fit:cover">'
      : '<div class="pc-init">' + (s.displayName || '?')[0] + '</div>';
    const best = st ? ' · <span class="pc-best">สถิติ ' + (st.personalBest || 0).toLocaleString() + '</span>' : '';
    chip.innerHTML = av + '<span>' + s.displayName + best + '</span>';
    chip.style.display = 'flex';
  }

  function renderMyStats() {
    const st = KAMPAI.stats;
    if (!st) return;
    const bestEl = document.getElementById('ms-best');
    const playsEl = document.getElementById('ms-plays');
    const boxEl = document.getElementById('my-stats');
    if (bestEl) bestEl.innerText = (st.personalBest || 0).toLocaleString();
    if (playsEl) playsEl.innerText = (st.playsCount || 0).toLocaleString();
    if (boxEl) boxEl.style.display = 'flex';
  }

  function renderLeaderboard(listId) {
    const el = document.getElementById(listId);
    if (!el) return;
    const rows = KAMPAI.leaderboard || [];
    if (!rows.length) {
      el.innerHTML = '<li class="lb-loading">ยังไม่มีผู้เล่น — เป็นคนแรกสิ!</li>';
      return;
    }
    const medals = ['🥇', '🥈', '🥉'];
    el.innerHTML = rows.slice(0, 5).map(function (r) {
      const av = r.photoUrl
        ? '<img class="lb-avatar" src="' + r.photoUrl + '" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover">'
        : '';
      return '<li class="' + (r.isMe ? 'is-me' : '') + '">' +
        '<span>' + (medals[r.rank - 1] || r.rank) + '</span>' + av +
        '<span>' + r.displayName + (r.isMe ? ' (คุณ)' : '') + ' · ' + (r.personalBest || 0).toLocaleString() + '</span>' +
      '</li>';
    }).join('');
  }

  function bootMenu() {
    const tips = document.getElementById('tips-list');
    if (tips && !tips.children.length) {
      (DATA.tips || []).forEach(function (t) {
        const li = document.createElement('li');
        li.textContent = t;
        tips.appendChild(li);
      });
    }
  }

  KAMPAI.onReady(function () {
    renderPlayer();
    renderMyStats();
    renderLeaderboard('score-list');
  });
  bootMenu();
  updateHudDisplay({ score: 0, correct: 0, wrong: 0, lives: CFG.LIVES, maxLives: CFG.MAX_LIVES, stageName: 'ด่าน 1-1: ทุ่งคำวิสรรชนีย์' });

  // ── Boot Godot 4.4.1 Engine ──
  function ensureGodotScript() {
    if (typeof Engine !== 'undefined') return Promise.resolve();
    return new Promise(function (resolve, reject) {
      const s = document.createElement('script');
      s.src = 'godot/thai_mario.js';
      s.onload = function () {
        if (typeof Engine !== 'undefined') resolve();
        else reject(new Error('Godot Engine script missing Engine global'));
      };
      s.onerror = function () {
        reject(new Error('Failed to load godot/thai_mario.js'));
      };
      document.body.appendChild(s);
    });
  }

  function bootGodotEngine() {
    if (godotBootPromise) return godotBootPromise;
    const loadingEl = document.getElementById('godot-loading');
    const progEl = document.getElementById('godot-progress');
    const canvas = document.getElementById('godot-canvas');
    if (loadingEl) loadingEl.classList.remove('hidden');

    godotBootPromise = ensureGodotScript().then(function () {
      const godotConfig = {
        args: [],
        canvas: canvas,
        canvasResizePolicy: 2,
        ensureCrossOriginIsolationHeaders: false,
        executable: 'godot/thai_mario',
        mainPack: 'godot/thai_mario.pck',
        experimentalVK: false,
        focusCanvas: true,
        gdextensionLibs: []
      };

      const engine = new Engine(godotConfig);
      window.godotEngine = engine;

      return engine.startGame({
        canvas: canvas,
        onProgress: function (current, total) {
          if (progEl && total > 0) {
            progEl.max = total;
            progEl.value = current;
          }
        }
      });
    }).then(function () {
      if (loadingEl) loadingEl.classList.add('hidden');
      if (canvas) canvas.focus();
      return true;
    }).catch(function (err) {
      if (loadingEl) loadingEl.classList.add('hidden');
      showToast('⚠️ โหลด Godot Web ไม่สำเร็จ: ' + (err && err.message ? err.message : err), false);
      godotBootPromise = null;
      throw err;
    });

    return godotBootPromise;
  }

  function triggerGodotRound(seedVal) {
    window.KAMPAI_BRIDGE_IN.seed = seedVal;
    window.KAMPAI_BRIDGE_IN.paused = false;
    window.KAMPAI_BRIDGE_IN.sfxOn = readSfxFlag();
    window.KAMPAI_BRIDGE_IN.bgmOn = readBgmFlag();
    window.KAMPAI_BRIDGE_IN.startSeq += 1;
    const canvas = document.getElementById('godot-canvas');
    if (canvas) canvas.focus();
  }

  // ── KampaiVersus ──
  const vs = window.KampaiVersus ? KampaiVersus.create({
    duration: CFG.TIME_SECONDS,
    title: 'มาริโอตะลุยคำไทย',
    rankBy: 'score',
    onPlay: function (opts) {
      startGame(opts && opts.rng ? opts.rng : Math.random);
    },
    onEnd: function () {
      endGame(false, true);
    }
  }) : null;

  window.openVersus = function () {
    if (vs) vs.openMenu();
  };

  function calcStars(s) {
    const t = CFG.STAR_THRESHOLDS || [600, 1500, 2600];
    if (s >= t[2]) return 3;
    if (s >= t[1]) return 2;
    if (s >= t[0]) return 1;
    return 0;
  }

  window.startGame = function (rngOpt) {
    if (!KampaiOrient.canStart()) return;
    const rand = typeof rngOpt === 'function' ? rngOpt : Math.random;
    const seedVal = Math.max(1, Math.floor(rand() * 2147483647));

    gameActive = true;
    KAMPAI.beginRound();
    KampaiOrient.notifyGameStart();
    KampaiOrient.setPlaying(true);

    document.body.classList.add('is-playing');
    document.getElementById('blocker').style.display = 'none';
    document.getElementById('gameover-screen').style.display = 'none';
    updateHudDisplay({ score: 0, correct: 0, wrong: 0, lives: CFG.LIVES, maxLives: CFG.MAX_LIVES, stageName: 'ด่าน 1-1: ทุ่งคำวิสรรชนีย์' });

    const isTestHarness = new URLSearchParams(location.search).get('kampai_test') === '1';
    if (isTestHarness && typeof Engine === 'undefined') return;

    bootGodotEngine().then(function () {
      triggerGodotRound(seedVal);
    }).catch(function () {});
  };

  window.endGame = function (wonAll, fromVersus) {
    if (!gameActive && !fromVersus) return;
    gameActive = false;
    window.KAMPAI_BRIDGE_IN.paused = true;
    document.body.classList.remove('is-playing');
    KampaiOrient.setPlaying(false);

    if (!fromVersus && vs && vs.finish(lastScore, { correct: lastCorrect })) {
      return;
    }

    const stars = calcStars(lastScore);
    KAMPAI.submitScore(lastScore, {
      mode: 'normal',
      stars: stars,
      correct: lastCorrect,
      wrong: lastWrong
    });

    const goTitle = document.getElementById('go-title');
    if (goTitle) goTitle.textContent = wonAll ? '🏆 พิชิตครบ 3 ด่าน!' : 'จบการผจญภัย!';
    const goSummary = document.getElementById('go-summary');
    if (goSummary) {
      goSummary.textContent = 'เก็บคำถูก ' + lastCorrect + ' คำ · พลาด ' + lastWrong + ' ครั้ง · หัวใจเหลือ ' + lastLives + '/' + CFG.MAX_LIVES;
    }
    document.getElementById('final-score').innerText = lastScore.toLocaleString();
    document.getElementById('go-stars').innerText = '☆☆☆'.split('').map(function (_s, i) {
      return i < stars ? '★' : '☆';
    }).join('');
    document.getElementById('gameover-screen').style.display = 'flex';
    renderLeaderboard('score-list-gameover');
  };

  window.finishForTest = function () {
    if (!gameActive) window.startGame();
    endGame(false, false);
  };

  window.restartGame = function () {
    document.getElementById('gameover-screen').style.display = 'none';
    window.startGame();
  };
})();
