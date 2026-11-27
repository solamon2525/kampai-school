/* game.js — เชื่อม Godot 4.4.1 WebAssembly Engine เข้ากับ KAMPAI SDK, KampaiVersus และ UI อารีนาคณิตศาสตร์ */
(function () {
  'use strict';

  const CFG = window.GAME_CONFIG;
  const DATA = window.GAME_DATA;
  const GEN = window.MathGen;

  KAMPAI.setSlug(CFG.SLUG);
  KAMPAI.sound.defaultBgm(CFG.BGM);
  KAMPAI.sound.mountToggles();

  const $ = function (id) { return document.getElementById(id); };
  const joyCanvas = $('joy-overlay');
  const joyCtx = joyCanvas ? joyCanvas.getContext('2d') : null;

  function readSfxFlag() {
    try { return localStorage.getItem('mr_sfx') !== '0'; } catch (_) { return true; }
  }
  function readBgmFlag() {
    try { return localStorage.getItem('mr_bgm') !== '0'; } catch (_) { return true; }
  }

  // ── Persistent Profile State (แยกจาก Run) ──
  const PROFILE_KEY = 'math_survivors_profile_v1';
  function loadProfile() {
    const def = { bestScore: 0, bestWave: 1, runs: 0, unlocks: [] };
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) return def;
      const p = JSON.parse(raw);
      return {
        bestScore: Number(p.bestScore) || 0,
        bestWave: Number(p.bestWave) || 1,
        runs: Number(p.runs) || 0,
        unlocks: Array.isArray(p.unlocks) ? p.unlocks : []
      };
    } catch (_) {
      return def;
    }
  }
  function saveProfile(p) {
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch (_) {}
  }
  let profile = loadProfile();

  // ── KAMPAI Bridge State ──
  window.KAMPAI_GODOT_READY = false;
  window.KAMPAI_BRIDGE_IN = {
    startSeq: 0,
    draftSeq: 0,
    draftIdx: 0,
    seed: 1337,
    mode: 'normal',
    paused: false,
    sfxOn: readSfxFlag(),
    bgmOn: readBgmFlag(),
    joyDx: 0,
    joyDy: 0
  };

  let gameActive = false;
  let roundMode = 'normal';
  let submittedThisRound = false;
  let lastSnapshot = { score: 0, correct: 0, wrong: 0, level: 1, kills: 0, actIndex: 0, bestStreak: 0, bossKills: 0, seed: 1337 };
  let toastTimer = null;
  let godotBootPromise = null;
  let levelUpOpen = false;

  document.addEventListener('click', function (e) {
    if (e.target && (e.target.id === 'kbtn-sfx' || e.target.id === 'kbtn-bgm')) {
      setTimeout(function () {
        window.KAMPAI_BRIDGE_IN.sfxOn = readSfxFlag();
        window.KAMPAI_BRIDGE_IN.bgmOn = readBgmFlag();
      }, 20);
    }
  });

  // ── UI Helpers ──
  function renderPlayer() {
    const s = KAMPAI.student, st = KAMPAI.stats;
    const chip = $('player-chip');
    if (!s || !chip) return;
    const av = s.photoUrl
      ? '<img src="' + s.photoUrl + '" alt="">'
      : '<div class="pc-init">' + (s.displayName || '?')[0] + '</div>';
    const best = st ? ' · <span class="pc-best">สถิติ ' + (st.personalBest || 0).toLocaleString() + '</span>' : '';
    chip.innerHTML = av + '<span>' + s.displayName + best + '</span>';
    chip.style.display = 'flex';
  }

  function renderMyStats() {
    const st = KAMPAI.stats;
    const best = Math.max(st ? (st.personalBest || 0) : 0, profile.bestScore || 0);
    const plays = Math.max(st ? (st.playsCount || 0) : 0, profile.runs || 0);
    if ($('ms-best')) $('ms-best').innerText = best.toLocaleString();
    if ($('ms-plays')) $('ms-plays').innerText = plays.toLocaleString();
    if ($('ms-unlocks')) $('ms-unlocks').innerText = profile.unlocks.length + '/' + DATA.ACHIEVEMENTS.length;
    if ($('my-stats')) $('my-stats').style.display = 'flex';
  }

  function renderLeaderboard(listId) {
    const el = $(listId);
    if (!el) return;
    const rows = KAMPAI.leaderboard || [];
    if (!rows.length) {
      el.innerHTML = '<li class="lb-loading">ยังไม่มีผู้เล่น — เป็นคนแรกสิ!</li>';
      return;
    }
    const medals = ['🥇', '🥈', '🥉'];
    el.innerHTML = rows.slice(0, 5).map(function (r) {
      const av = r.photoUrl
        ? '<img src="' + r.photoUrl + '" alt="" style="width:28px;height:28px;border-radius:50%;object-fit:cover">'
        : '';
      return '<li class="' + (r.isMe ? 'is-me' : '') + '">' +
        '<span>' + (medals[r.rank - 1] || r.rank) + '</span>' + av +
        '<span>' + r.displayName + (r.isMe ? ' (คุณ)' : '') + ' · ' + (r.personalBest || 0).toLocaleString() + '</span>' +
      '</li>';
    }).join('');
  }

  function bootTips() {
    const list = $('tips-list');
    if (!list || list.children.length) return;
    DATA.TIPS.forEach(function (t) {
      const li = document.createElement('li');
      li.textContent = t;
      list.appendChild(li);
    });
  }

  KAMPAI.onReady(function () {
    renderPlayer();
    renderMyStats();
    renderLeaderboard('score-list');
  });
  bootTips();
  renderMyStats();

  // ── Seed Mode ──
  let seedMode = 'random';
  function getDailyUtcSeed() {
    const d = new Date();
    const key = d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
    return GEN.hashSeed(key, CFG.SLUG);
  }
  window.setSeedMode = function (mode) {
    seedMode = mode === 'daily' ? 'daily' : 'random';
    if ($('btn-seed-random')) $('btn-seed-random').classList.toggle('active', seedMode === 'random');
    if ($('btn-seed-daily')) $('btn-seed-daily').classList.toggle('active', seedMode === 'daily');
  };

  function showToast(msg, tone) {
    const el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = tone || 'info';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = 'hidden'; }, 2800);
  }

  function updateHudDom(d) {
    lastSnapshot = {
      score: Number(d.score) || 0,
      correct: Number(d.correct) || 0,
      wrong: Number(d.wrong) || 0,
      level: Number(d.level) || 1,
      kills: Number(d.kills) || 0,
      actIndex: Number(d.actIndex) || 0,
      bestStreak: Number(d.bestStreak) || 0,
      bossKills: Number(d.bossKills) || 0,
      seed: Number(d.seed) || 1337
    };

    const rem = Math.max(0, Math.ceil(typeof d.remaining === 'number' ? d.remaining : CFG.RUN_DURATION_SEC));
    const mm = String(Math.floor(rem / 60)).padStart(2, '0');
    const ss = String(rem % 60).padStart(2, '0');
    if ($('timer-value')) $('timer-value').textContent = mm + ':' + ss;
    if ($('score-value')) $('score-value').textContent = lastSnapshot.score.toLocaleString();
    if ($('hp-text')) $('hp-text').textContent = (Number(d.hp) || 0) + '/' + (Number(d.maxHp) || CFG.MAX_HP);
    if ($('act-label') && d.actName) $('act-label').textContent = String(d.actName);

    const xpNeed = Math.max(1, Number(d.xpNeed) || 60);
    const xpPct = Math.min(100, Math.round(((Number(d.xp) || 0) / xpNeed) * 100));
    if ($('xp-fill')) $('xp-fill').style.width = xpPct + '%';
    if ($('xp-text')) $('xp-text').textContent = 'Lv.' + lastSnapshot.level;

    const dock = $('weapon-dock');
    if (dock && Array.isArray(d.weapons)) {
      dock.innerHTML = d.weapons.map(function (w) {
        return '<div class="w-badge">' + w.icon + ' <span>' + w.name + '</span> <b>Lv.' + w.lv + '</b></div>';
      }).join('');
    }
  }

  window.KAMPAI_BRIDGE_OUT = {
    onHud: function (d) {
      updateHudDom(d);
      if (vs && gameActive && roundMode !== 'practice') {
        vs.report(lastSnapshot.score, { correct: lastSnapshot.correct });
      }
    },
    onQuestion: function (q) {
      const banner = $('math-banner');
      if (!banner) return;
      if (!q || !q.prompt) {
        banner.classList.add('hidden');
        return;
      }
      if ($('mb-grade')) $('mb-grade').textContent = q.grade || 'ป.4';
      if ($('mb-q')) $('mb-q').textContent = q.prompt;
      banner.classList.remove('hidden');
    },
    onLevelUp: function (d) {
      const opts = Array.isArray(d.options) ? d.options : [];
      if (!opts.length) return;
      levelUpOpen = true;
      joy.active = false;
      window.KAMPAI_BRIDGE_IN.joyDx = 0;
      window.KAMPAI_BRIDGE_IN.joyDy = 0;
      drawJoyOverlay();

      $('lu-cards').innerHTML = opts.map(function (opt, i) {
        const tag = opt.isNew ? 'ใหม่!' : 'Lv.' + opt.nextLv;
        return '<button type="button" class="lu-card" data-kampai-action="pick-' + i + '" onclick="window.__pickDraft(' + i + ')">' +
          '<div class="lu-card-icon">' + opt.icon + '</div>' +
          '<div class="lu-card-tag">' + tag + '</div>' +
          '<div class="lu-card-title">' + opt.name + '</div>' +
          '<div class="lu-card-desc">' + opt.desc + '</div>' +
        '</button>';
      }).join('');
      $('levelup-modal').classList.remove('hidden');
    },
    onToast: function (d) {
      showToast(d.message || '', d.tone || 'info');
      KAMPAI.sound.fxFlash(d.tone === 'good');
      if (d.speakWord) KAMPAI.sound.speak(String(d.speakWord), 'th-TH', true);
    },
    onRoundEnd: function (d) {
      updateHudDom(d);
      finishGame(!!d.won, false, d.cause || '');
    }
  };

  window.__pickDraft = function (idx) {
    if (!levelUpOpen) return;
    levelUpOpen = false;
    $('levelup-modal').classList.add('hidden');
    window.KAMPAI_BRIDGE_IN.draftIdx = idx;
    window.KAMPAI_BRIDGE_IN.draftSeq += 1;
    const c = $('godot-canvas');
    if (c) c.focus();
  };

  window.addEventListener('keydown', function (e) {
    if (!levelUpOpen) return;
    if (e.key === '1' || e.key === '2' || e.key === '3') {
      e.preventDefault();
      window.__pickDraft(Number(e.key) - 1);
    }
  });

  // ── Touch/Pointer Analog Joystick forwarding to Godot ──
  const joy = { active: false, pointerId: null, originX: 0, originY: 0, dx: 0, dy: 0 };
  function resizeJoyCanvas() {
    if (!joyCanvas) return;
    joyCanvas.width = window.innerWidth;
    joyCanvas.height = window.innerHeight;
  }
  resizeJoyCanvas();
  window.addEventListener('resize', resizeJoyCanvas);

  function drawJoyOverlay() {
    if (!joyCtx || !joyCanvas) return;
    joyCtx.clearRect(0, 0, joyCanvas.width, joyCanvas.height);
    if (!joy.active || !gameActive || levelUpOpen) return;
    joyCtx.strokeStyle = 'rgba(255,255,255,0.45)';
    joyCtx.lineWidth = 2;
    joyCtx.beginPath();
    joyCtx.arc(joy.originX, joy.originY, 42, 0, Math.PI * 2);
    joyCtx.stroke();
    joyCtx.fillStyle = 'rgba(250, 204, 21, 0.72)';
    joyCtx.beginPath();
    joyCtx.arc(joy.originX + joy.dx * 32, joy.originY + joy.dy * 32, 16, 0, Math.PI * 2);
    joyCtx.fill();
  }

  const godotCanvas = $('godot-canvas');
  if (godotCanvas) {
    godotCanvas.addEventListener('pointerdown', function (e) {
      if (!gameActive || levelUpOpen) return;
      joy.active = true;
      joy.pointerId = e.pointerId;
      joy.originX = e.clientX;
      joy.originY = e.clientY;
      joy.dx = 0;
      joy.dy = 0;
      drawJoyOverlay();
    });
  }
  window.addEventListener('pointermove', function (e) {
    if (!joy.active || e.pointerId !== joy.pointerId) return;
    const vx = e.clientX - joy.originX;
    const vy = e.clientY - joy.originY;
    const len = Math.hypot(vx, vy);
    if (len > 8) {
      const mag = Math.min(1, len / 46);
      joy.dx = (vx / len) * mag;
      joy.dy = (vy / len) * mag;
    } else {
      joy.dx = 0;
      joy.dy = 0;
    }
    window.KAMPAI_BRIDGE_IN.joyDx = joy.dx;
    window.KAMPAI_BRIDGE_IN.joyDy = joy.dy;
    drawJoyOverlay();
  });
  function releaseJoy(e) {
    if (joy.active && (e.pointerId === joy.pointerId || e.type === 'blur')) {
      joy.active = false;
      joy.pointerId = null;
      joy.dx = 0;
      joy.dy = 0;
      window.KAMPAI_BRIDGE_IN.joyDx = 0;
      window.KAMPAI_BRIDGE_IN.joyDy = 0;
      drawJoyOverlay();
    }
  }
  window.addEventListener('pointerup', releaseJoy);
  window.addEventListener('pointercancel', releaseJoy);
  window.addEventListener('blur', releaseJoy);

  document.addEventListener('visibilitychange', function () {
    if (gameActive) window.KAMPAI_BRIDGE_IN.paused = document.hidden;
  });

  // ── Lazy Boot Godot 4.4.1 Engine ──
  function ensureGodotScript() {
    if (typeof Engine !== 'undefined') return Promise.resolve();
    return new Promise(function (resolve, reject) {
      const s = document.createElement('script');
      s.src = 'godot/math_survivors.js';
      s.onload = function () {
        if (typeof Engine !== 'undefined') resolve();
        else reject(new Error('Godot Engine global missing'));
      };
      s.onerror = function () { reject(new Error('Failed to load godot/math_survivors.js')); };
      document.body.appendChild(s);
    });
  }

  function bootGodotEngine() {
    if (godotBootPromise) return godotBootPromise;
    const loadingEl = $('godot-loading');
    const progEl = $('godot-progress');
    if (loadingEl) loadingEl.classList.remove('hidden');

    godotBootPromise = ensureGodotScript().then(function () {
      const engine = new Engine({
        args: [],
        canvas: godotCanvas,
        canvasResizePolicy: 2,
        ensureCrossOriginIsolationHeaders: false,
        executable: 'godot/math_survivors',
        mainPack: 'godot/math_survivors.pck',
        experimentalVK: false,
        focusCanvas: true,
        gdextensionLibs: []
      });
      window.godotEngine = engine;
      return engine.startGame({
        canvas: godotCanvas,
        onProgress: function (cur, tot) {
          if (progEl && tot > 0) { progEl.max = tot; progEl.value = cur; }
        }
      });
    }).then(function () {
      if (loadingEl) loadingEl.classList.add('hidden');
      if (godotCanvas) godotCanvas.focus();
      return true;
    }).catch(function (err) {
      if (loadingEl) loadingEl.classList.add('hidden');
      showToast('⚠️ โหลด Godot Web ไม่สำเร็จ: ' + (err && err.message ? err.message : err), 'bad');
      godotBootPromise = null;
      throw err;
    });
    return godotBootPromise;
  }

  // ── KampaiVersus ──
  const vs = window.KampaiVersus ? KampaiVersus.create({
    duration: CFG.ONLINE_DURATION,
    title: CFG.TITLE_TH,
    rankBy: 'score',
    onPlay: function (opts) {
      window.startGame('online', opts && opts.rng ? opts.rng : null);
    },
    onEnd: function () {
      finishGame(false, true, 'หมดเวลาแข่งขัน!');
    }
  }) : null;
  window.openVersus = function () { if (vs) vs.openMenu(); };

  function calcStars(s) {
    const t = CFG.STAR_THRESHOLDS || [900, 2400, 4500];
    if (s >= t[2]) return 3;
    if (s >= t[1]) return 2;
    if (s >= t[0]) return 1;
    return 0;
  }

  function evaluateAchievements(won) {
    const newly = [];
    function grant(id, cond) {
      if (cond && profile.unlocks.indexOf(id) === -1) {
        profile.unlocks.push(id);
        const found = DATA.ACHIEVEMENTS.find(function (a) { return a.id === id; });
        if (found) newly.push(found.title);
      }
    }
    grant('first_math', lastSnapshot.correct >= 3);
    grant('streak_5', lastSnapshot.bestStreak >= 5);
    grant('boss_slayer', lastSnapshot.bossKills >= 1);
    grant('survivor_win', won);
    return newly;
  }

  window.startGame = function (modeOpt, rngOpt) {
    roundMode = modeOpt === 'practice' ? 'practice' : modeOpt === 'online' ? 'online' : 'normal';
    submittedThisRound = false;
    levelUpOpen = false;
    gameActive = true;

    let seedVal = 1337;
    if (typeof rngOpt === 'function') {
      seedVal = Math.max(1, Math.floor(rngOpt() * 2147483647));
    } else if (seedMode === 'daily') {
      seedVal = getDailyUtcSeed();
    } else {
      seedVal = Math.max(1, Math.floor(Math.random() * 2147483647));
    }

    KAMPAI.beginRound();
    $('blocker').classList.add('hidden');
    $('gameover-screen').classList.add('hidden');
    $('levelup-modal').classList.add('hidden');
    $('math-banner').classList.add('hidden');
    updateHudDom({ score: 0, remaining: CFG.RUN_DURATION_SEC, actName: CFG.ACTS[0].name, hp: CFG.MAX_HP, maxHp: CFG.MAX_HP, level: 1, xp: 0, xpNeed: 60, weapons: [{ icon: '✨', name: 'คทาประกายดาว', lv: 1 }], seed: seedVal });

    const isTestHarness = new URLSearchParams(location.search).get('kampai_test') === '1';
    if (isTestHarness && typeof Engine === 'undefined') return;

    bootGodotEngine().then(function () {
      window.KAMPAI_BRIDGE_IN.seed = seedVal;
      window.KAMPAI_BRIDGE_IN.mode = roundMode;
      window.KAMPAI_BRIDGE_IN.paused = false;
      window.KAMPAI_BRIDGE_IN.sfxOn = readSfxFlag();
      window.KAMPAI_BRIDGE_IN.bgmOn = readBgmFlag();
      window.KAMPAI_BRIDGE_IN.startSeq += 1;
      if (godotCanvas) godotCanvas.focus();
    }).catch(function () {});
  };

  function finishGame(won, fromVersus, causeText) {
    if (!gameActive && !fromVersus) return;
    gameActive = false;
    levelUpOpen = false;
    window.KAMPAI_BRIDGE_IN.paused = true;
    $('levelup-modal').classList.add('hidden');
    $('math-banner').classList.add('hidden');
    drawJoyOverlay();

    if (!fromVersus && vs && roundMode === 'online' && vs.finish(lastSnapshot.score, { correct: lastSnapshot.correct })) {
      return;
    }

    profile.runs += 1;
    if (lastSnapshot.score > profile.bestScore) profile.bestScore = lastSnapshot.score;
    if (lastSnapshot.actIndex + 1 > profile.bestWave) profile.bestWave = lastSnapshot.actIndex + 1;
    const newUnlocks = evaluateAchievements(won);
    saveProfile(profile);
    renderMyStats();

    if (roundMode !== 'practice' && !submittedThisRound) {
      submittedThisRound = true;
      KAMPAI.submitScore(lastSnapshot.score, {
        mode: roundMode,
        stars: calcStars(lastSnapshot.score),
        correct: lastSnapshot.correct,
        wrong: lastSnapshot.wrong
      });
    }

    const stars = calcStars(lastSnapshot.score);
    $('go-badge').textContent = roundMode === 'practice' ? '🛡️ โหมดฝึกซ้อม (ไม่บันทึกคะแนน)' : '⚔️ สรุปผลอารีนา';
    $('go-title').textContent = won ? '🏆 พิชิตอารีนาคณิตศาสตร์ครบ 3 องก์!' : '⚔️ จบการผจญภัย!';
    $('go-stars').textContent = '☆☆☆'.split('').map(function (_s, i) { return i < stars ? '★' : '☆'; }).join('');
    $('final-score').textContent = lastSnapshot.score.toLocaleString();
    $('go-summary').textContent = 'กำจัด ' + lastSnapshot.kills + ' ตัว · ตอบลูกแก้วถูก ' + lastSnapshot.correct + ' ข้อ · พลาด ' + lastSnapshot.wrong + ' ครั้ง · เลเวล ' + lastSnapshot.level;
    $('go-meta').innerHTML =
      '<div>🌱 <b>Seed:</b> #' + lastSnapshot.seed + ' · <b>องก์ที่ถึง:</b> ' + (lastSnapshot.actIndex + 1) + '/3 · <b>สาเหตุ:</b> ' + (causeText || 'สิ้นสุดรอบ') + '</div>' +
      (newUnlocks.length ? '<div>🏅 <b>ปลดล็อกตราใหม่:</b> ' + newUnlocks.join(', ') + '</div>' : '');

    $('gameover-screen').classList.remove('hidden');
    renderLeaderboard('score-list-gameover');
  }

  window.finishForTest = function () {
    if (!gameActive) window.startGame('normal');
    finishGame(false, false, 'ทดสอบจบเกม');
  };

  window.restartGame = function () {
    window.startGame(roundMode);
  };
})();
