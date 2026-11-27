/* game.js — Math Survivors v2.2 (Godot 4.4.1 WebAssembly + 3 Maps + 3 Heroes + Pause + Minimap + Boss Chest + Evolutions) */
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
  const mmCanvas = $('minimap-canvas');
  const mmCtx = mmCanvas ? mmCanvas.getContext('2d') : null;

  function readSfxFlag() { try { return localStorage.getItem('mr_sfx') !== '0'; } catch (_) { return true; } }
  function readBgmFlag() { try { return localStorage.getItem('mr_bgm') !== '0'; } catch (_) { return true; } }

  // ── Persistent Profile State (แยกจาก Run State) ──
  const PROFILE_KEY = 'math_survivors_profile_v1';
  function loadProfile() {
    const def = { bestScore: 0, bestWave: 1, runs: 0, totalSolved: 0, totalBossKills: 0, unlocks: [], reduceShake: false, bgmVol: 80, sfxVol: 100 };
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) return def;
      const p = JSON.parse(raw);
      return {
        bestScore: Number(p.bestScore) || 0,
        bestWave: Number(p.bestWave) || 1,
        runs: Number(p.runs) || 0,
        totalSolved: Number(p.totalSolved) || 0,
        totalBossKills: Number(p.totalBossKills) || 0,
        unlocks: Array.isArray(p.unlocks) ? p.unlocks : [],
        reduceShake: !!p.reduceShake,
        bgmVol: typeof p.bgmVol === 'number' ? p.bgmVol : 80,
        sfxVol: typeof p.sfxVol === 'number' ? p.sfxVol : 100
      };
    } catch (_) {
      return def;
    }
  }
  function saveProfile(p) { try { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); } catch (_) {} }
  let profile = loadProfile();

  let selectedMap = 'arcane_temple';
  let selectedHero = 'mage';
  let seedMode = 'random';
  let gameActive = false;
  let roundMode = 'normal';
  let submittedThisRound = false;
  let levelUpOpen = false;
  let chestOpen = false;
  let pauseOpen = false;
  let chestChoices = [];
  let toastTimer = null;
  let godotBootPromise = null;
  let lastSnapshot = { score: 0, correct: 0, wrong: 0, level: 1, kills: 0, actIndex: 0, bestStreak: 0, bossKills: 0, evolutions: 0, seed: 1337, weapons: [] };

  // ── KAMPAI Bridge Input State ──
  window.KAMPAI_GODOT_READY = false;
  window.KAMPAI_BRIDGE_IN = {
    startSeq: 0,
    draftSeq: 0,
    draftIdx: 0,
    chestSeq: 0,
    chestAnswer: 0,
    dashSeq: 0,
    seed: 1337,
    mode: 'normal',
    mapId: 'arcane_temple',
    heroId: 'mage',
    paused: false,
    sfxOn: readSfxFlag(),
    bgmOn: readBgmFlag(),
    sfxVol: profile.sfxVol / 100,
    bgmVol: profile.bgmVol / 100,
    reduceShake: profile.reduceShake,
    joyDx: 0,
    joyDy: 0
  };

  if ($('vol-bgm')) $('vol-bgm').value = String(profile.bgmVol);
  if ($('vol-sfx')) $('vol-sfx').value = String(profile.sfxVol);
  if ($('chk-reduce-shake')) $('chk-reduce-shake').checked = !!profile.reduceShake;

  document.addEventListener('click', function (e) {
    if (e.target && (e.target.id === 'kbtn-sfx' || e.target.id === 'kbtn-bgm')) {
      setTimeout(function () {
        window.KAMPAI_BRIDGE_IN.sfxOn = readSfxFlag();
        window.KAMPAI_BRIDGE_IN.bgmOn = readBgmFlag();
      }, 20);
    }
  });

  // ── Selectors (Map, Hero, Seed, Settings) ──
  function isHeroUnlocked(heroId) {
    if (heroId === 'mage') return true;
    if (heroId === 'knight') return profile.totalSolved >= 10;
    if (heroId === 'inventor') return profile.totalBossKills >= 1;
    return false;
  }

  function refreshHeroPickerUi() {
    const kCard = $('hero-card-knight');
    const kDesc = $('hero-desc-knight');
    if (kCard && kDesc) {
      const ok = isHeroUnlocked('knight');
      kCard.classList.toggle('locked', !ok);
      kDesc.textContent = ok ? 'เริ่มด้วย วงแหวนพาย · HP +25' : '🔒 ตอบถูกสะสม ' + profile.totalSolved + '/10 ข้อ (ลองได้ในฝึกซ้อม)';
    }
    const iCard = $('hero-card-inventor');
    const iDesc = $('hero-desc-inventor');
    if (iCard && iDesc) {
      const ok = isHeroUnlocked('inventor');
      iCard.classList.toggle('locked', !ok);
      iDesc.textContent = ok ? 'เริ่มด้วย สายฟ้าสมการ · วิ่งไว +12%' : '🔒 โค่นบอส ' + profile.totalBossKills + '/1 ตัว (ลองได้ในฝึกซ้อม)';
    }
  }

  window.selectMap = function (mapId) {
    selectedMap = mapId;
    document.querySelectorAll('#map-picker .sel-card').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-map') === mapId);
    });
  };

  window.selectHero = function (heroId) {
    selectedHero = heroId;
    document.querySelectorAll('#hero-picker .sel-card').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-hero') === heroId);
    });
    if (!isHeroUnlocked(heroId)) {
      showToast('💡 ฮีโร่นี้ยังไม่ปลดล็อกในโหมดปกติ — ลองเล่นฟรีได้ในโหมด "ฝึกซ้อม"!', 'info');
    }
  };

  window.setSeedMode = function (mode) {
    seedMode = mode === 'daily' ? 'daily' : 'random';
    if ($('btn-seed-random')) $('btn-seed-random').classList.toggle('active', seedMode === 'random');
    if ($('btn-seed-daily')) $('btn-seed-daily').classList.toggle('active', seedMode === 'daily');
  };

  window.onVolumeChange = function () {
    const bv = $('vol-bgm') ? Number($('vol-bgm').value) : 80;
    const sv = $('vol-sfx') ? Number($('vol-sfx').value) : 100;
    profile.bgmVol = bv;
    profile.sfxVol = sv;
    window.KAMPAI_BRIDGE_IN.bgmVol = bv / 100;
    window.KAMPAI_BRIDGE_IN.sfxVol = sv / 100;
    saveProfile(profile);
  };

  window.onSettingsChange = function () {
    const rs = $('chk-reduce-shake') ? !!$('chk-reduce-shake').checked : false;
    profile.reduceShake = rs;
    window.KAMPAI_BRIDGE_IN.reduceShake = rs;
    saveProfile(profile);
  };

  window.togglePause = function (forceState) {
    if (!gameActive || levelUpOpen || chestOpen) return;
    pauseOpen = typeof forceState === 'boolean' ? forceState : !pauseOpen;
    window.KAMPAI_BRIDGE_IN.paused = pauseOpen;
    const modal = $('pause-modal');
    if (modal) modal.classList.toggle('hidden', !pauseOpen);
    if (pauseOpen) {
      const pb = $('pause-build');
      if (pb) {
        pb.innerHTML = (lastSnapshot.weapons || []).map(function (w) {
          return '<div class="w-badge' + (w.evo ? ' evo' : '') + '">' + w.icon + ' <span>' + w.name + '</span> <b>' + (w.lv === 'MAX' ? 'MAX' : 'Lv.' + w.lv) + '</b></div>';
        }).join('');
      }
    } else if (godotCanvas) {
      godotCanvas.focus();
    }
  };

  window.triggerDash = function () {
    if (!gameActive || pauseOpen || levelUpOpen || chestOpen) return;
    window.KAMPAI_BRIDGE_IN.dashSeq += 1;
  };

  window.backToMenu = function () {
    gameActive = false;
    pauseOpen = false;
    levelUpOpen = false;
    chestOpen = false;
    window.KAMPAI_BRIDGE_IN.paused = true;
    $('gameover-screen').classList.add('hidden');
    $('pause-modal').classList.add('hidden');
    $('boss-bar').classList.add('hidden');
    $('math-banner').classList.add('hidden');
    $('fever-badge').classList.add('hidden');
    $('minimap-box').classList.add('hidden');
    $('dash-btn').classList.add('hidden');
    $('blocker').classList.remove('hidden');
    refreshHeroPickerUi();
  };

  // ── UI Rendering ──
  function renderPlayer() {
    const s = KAMPAI.student, st = KAMPAI.stats;
    const chip = $('player-chip');
    if (!s || !chip) return;
    const av = s.photoUrl ? '<img src="' + s.photoUrl + '" alt="">' : '<div class="pc-init">' + (s.displayName || '?')[0] + '</div>';
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
    if ($('ms-solved')) $('ms-solved').innerText = (profile.totalSolved || 0).toLocaleString();
    if ($('ms-unlocks')) $('ms-unlocks').innerText = profile.unlocks.length + '/' + DATA.ACHIEVEMENTS.length;
    if ($('my-stats')) $('my-stats').style.display = 'flex';
    refreshHeroPickerUi();
  }

  function renderLeaderboard(listId) {
    const el = $(listId);
    if (!el) return;
    const rows = KAMPAI.leaderboard || [];
    if (!rows.length) { el.innerHTML = '<li class="lb-loading">ยังไม่มีผู้เล่น — เป็นคนแรกสิ!</li>'; return; }
    const medals = ['🥇', '🥈', '🥉'];
    el.innerHTML = rows.slice(0, 5).map(function (r) {
      const av = r.photoUrl ? '<img src="' + r.photoUrl + '" alt="" style="width:28px;height:28px;border-radius:50%;object-fit:cover">' : '';
      return '<li class="' + (r.isMe ? 'is-me' : '') + '"><span>' + (medals[r.rank - 1] || r.rank) + '</span>' + av +
        '<span>' + r.displayName + (r.isMe ? ' (คุณ)' : '') + ' · ' + (r.personalBest || 0).toLocaleString() + '</span></li>';
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

  function showToast(msg, tone) {
    const el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = tone || 'info';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = 'hidden'; }, 2800);
  }

  function drawMinimap(mm) {
    if (!mmCtx || !mmCanvas || !mm || !mm.arena) return;
    const w = mmCanvas.width, h = mmCanvas.height;
    const scaleX = w / mm.arena, scaleY = h / mm.arena;
    mmCtx.clearRect(0, 0, w, h);
    mmCtx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    mmCtx.fillRect(0, 0, w, h);

    // Orbs (Gold)
    if (Array.isArray(mm.orbs)) {
      mmCtx.fillStyle = '#facc15';
      mm.orbs.forEach(function (o) {
        mmCtx.beginPath();
        mmCtx.arc(o.x * scaleX, o.y * scaleY, 3.2, 0, Math.PI * 2);
        mmCtx.fill();
      });
    }
    // Chest (Green)
    if (mm.chest) {
      mmCtx.fillStyle = '#4ade80';
      mmCtx.fillRect(mm.chest.x * scaleX - 3, mm.chest.y * scaleY - 3, 6, 6);
    }
    // Boss (Red)
    if (mm.boss) {
      mmCtx.fillStyle = '#ef4444';
      mmCtx.beginPath();
      mmCtx.arc(mm.boss.x * scaleX, mm.boss.y * scaleY, 4.2, 0, Math.PI * 2);
      mmCtx.fill();
    }
    // Hero (Cyan)
    mmCtx.fillStyle = '#38bdf8';
    mmCtx.beginPath();
    mmCtx.arc(mm.hx * scaleX, mm.hy * scaleY, 3.2, 0, Math.PI * 2);
    mmCtx.fill();
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
      evolutions: Number(d.evolutions) || 0,
      seed: Number(d.seed) || 1337,
      weapons: Array.isArray(d.weapons) ? d.weapons : []
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

    // Boss HP Bar
    const bBar = $('boss-bar');
    if (bBar) {
      if (d.boss && d.boss.name) {
        bBar.classList.remove('hidden');
        if ($('boss-name')) $('boss-name').textContent = d.boss.name + ' (' + d.boss.hp + '/' + d.boss.maxHp + ')';
        if ($('boss-fill')) $('boss-fill').style.width = Math.max(0, Math.min(100, Math.round((d.boss.hp / Math.max(1, d.boss.maxHp)) * 100))) + '%';
      } else {
        bBar.classList.add('hidden');
      }
    }

    // Fever indicator
    const fb = $('fever-badge');
    if (fb) fb.classList.toggle('hidden', !(Number(d.feverSec) > 0.1));

    // Dash button meter
    const dashRatio = typeof d.dashRatio === 'number' ? d.dashRatio : 1;
    if ($('dash-fill')) $('dash-fill').style.width = Math.round(dashRatio * 100) + '%';
    if ($('dash-btn')) $('dash-btn').classList.toggle('ready', dashRatio >= 0.99);

    if (d.minimap) drawMinimap(d.minimap);

    const dock = $('weapon-dock');
    if (dock) {
      dock.innerHTML = lastSnapshot.weapons.map(function (w) {
        return '<div class="w-badge' + (w.evo ? ' evo' : '') + '">' + w.icon + ' <span>' + w.name + '</span> <b>' + (w.lv === 'MAX' ? 'MAX' : 'Lv.' + w.lv) + '</b></div>';
      }).join('');
    }
  }

  window.KAMPAI_BRIDGE_OUT = {
    onHud: function (d) {
      updateHudDom(d);
      if (vs && gameActive && roundMode !== 'practice') vs.report(lastSnapshot.score, { correct: lastSnapshot.correct });
    },
    onQuestion: function (q) {
      const banner = $('math-banner');
      if (!banner) return;
      if (!q || !q.prompt) { banner.classList.add('hidden'); return; }
      if ($('mb-grade')) $('mb-grade').textContent = q.grade || 'ป.4';
      if ($('mb-q')) $('mb-q').textContent = q.prompt;
      banner.classList.remove('hidden');
    },
    onLevelUp: function (d) {
      const opts = Array.isArray(d.options) ? d.options : [];
      if (!opts.length) return;
      levelUpOpen = true;
      resetJoystick();
      $('lu-cards').innerHTML = opts.map(function (opt, i) {
        const tag = opt.isEvo ? '🌟 EVOLUTION' : (opt.isNew ? 'ใหม่!' : 'Lv.' + opt.nextLv);
        const syn = opt.synergy ? '<div class="lu-card-syn">' + opt.synergy + '</div>' : '';
        return '<button type="button" class="lu-card' + (opt.isEvo ? ' evo-card' : '') + '" data-kampai-action="pick-' + i + '" onclick="window.__pickDraft(' + i + ')">' +
          '<div class="lu-card-icon">' + opt.icon + '</div>' +
          '<div class="lu-card-tag">' + tag + '</div>' +
          '<div class="lu-card-title">' + opt.name + '</div>' +
          '<div class="lu-card-desc">' + opt.desc + '</div>' + syn +
        '</button>';
      }).join('');
      $('levelup-modal').classList.remove('hidden');
    },
    onChest: function (q) {
      if (!q || !q.prompt) return;
      chestOpen = true;
      chestChoices = Array.isArray(q.choices) ? q.choices : [];
      resetJoystick();
      if ($('chest-q')) $('chest-q').textContent = (q.grade ? '[' + q.grade + '] ' : '') + q.prompt;
      $('chest-choices').innerHTML = chestChoices.map(function (val, i) {
        return '<button type="button" class="chest-btn" onclick="window.__answerChest(' + i + ')">' + val + '</button>';
      }).join('');
      $('chest-modal').classList.remove('hidden');
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
    if (godotCanvas) godotCanvas.focus();
  };

  window.__answerChest = function (idx) {
    if (!chestOpen) return;
    chestOpen = false;
    $('chest-modal').classList.add('hidden');
    window.KAMPAI_BRIDGE_IN.chestAnswer = Number(chestChoices[idx]) || 0;
    window.KAMPAI_BRIDGE_IN.chestSeq += 1;
    if (godotCanvas) godotCanvas.focus();
  };

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && gameActive && !levelUpOpen && !chestOpen) {
      e.preventDefault();
      window.togglePause();
      return;
    }
    if (levelUpOpen && (e.key === '1' || e.key === '2' || e.key === '3')) {
      e.preventDefault();
      window.__pickDraft(Number(e.key) - 1);
    } else if (chestOpen && (e.key === '1' || e.key === '2' || e.key === '3')) {
      e.preventDefault();
      window.__answerChest(Number(e.key) - 1);
    }
  });

  // ── Touch/Pointer Analog Joystick ──
  const joy = { active: false, pointerId: null, originX: 0, originY: 0, dx: 0, dy: 0 };
  function resizeJoyCanvas() { if (joyCanvas) { joyCanvas.width = window.innerWidth; joyCanvas.height = window.innerHeight; } }
  resizeJoyCanvas();
  window.addEventListener('resize', resizeJoyCanvas);

  function drawJoyOverlay() {
    if (!joyCtx || !joyCanvas) return;
    joyCtx.clearRect(0, 0, joyCanvas.width, joyCanvas.height);
    if (!joy.active || !gameActive || levelUpOpen || chestOpen || pauseOpen) return;
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
  function resetJoystick() {
    joy.active = false; joy.pointerId = null; joy.dx = 0; joy.dy = 0;
    window.KAMPAI_BRIDGE_IN.joyDx = 0; window.KAMPAI_BRIDGE_IN.joyDy = 0;
    drawJoyOverlay();
  }

  const godotCanvas = $('godot-canvas');
  if (godotCanvas) {
    godotCanvas.addEventListener('pointerdown', function (e) {
      if (!gameActive || levelUpOpen || chestOpen || pauseOpen) return;
      joy.active = true; joy.pointerId = e.pointerId; joy.originX = e.clientX; joy.originY = e.clientY; joy.dx = 0; joy.dy = 0;
      drawJoyOverlay();
    });
  }
  window.addEventListener('pointermove', function (e) {
    if (!joy.active || e.pointerId !== joy.pointerId) return;
    const vx = e.clientX - joy.originX, vy = e.clientY - joy.originY;
    const len = Math.hypot(vx, vy);
    if (len > 8) { const mag = Math.min(1, len / 46); joy.dx = (vx / len) * mag; joy.dy = (vy / len) * mag; }
    else { joy.dx = 0; joy.dy = 0; }
    window.KAMPAI_BRIDGE_IN.joyDx = joy.dx;
    window.KAMPAI_BRIDGE_IN.joyDy = joy.dy;
    drawJoyOverlay();
  });
  function releaseJoy(e) { if (joy.active && (e.pointerId === joy.pointerId || e.type === 'blur')) resetJoystick(); }
  window.addEventListener('pointerup', releaseJoy);
  window.addEventListener('pointercancel', releaseJoy);
  window.addEventListener('blur', releaseJoy);

  document.addEventListener('visibilitychange', function () {
    if (gameActive && document.hidden && !pauseOpen && !levelUpOpen && !chestOpen) window.togglePause(true);
  });

  // ── Lazy Boot Godot 4.4.1 Engine ──
  function ensureGodotScript() {
    if (typeof Engine !== 'undefined') return Promise.resolve();
    return new Promise(function (resolve, reject) {
      const s = document.createElement('script');
      s.src = 'godot/math_survivors.js';
      s.onload = function () { typeof Engine !== 'undefined' ? resolve() : reject(new Error('Engine missing')); };
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
        args: [], canvas: godotCanvas, canvasResizePolicy: 2, ensureCrossOriginIsolationHeaders: false,
        executable: 'godot/math_survivors', mainPack: 'godot/math_survivors.pck', experimentalVK: false, focusCanvas: true, gdextensionLibs: []
      });
      window.godotEngine = engine;
      return engine.startGame({
        canvas: godotCanvas,
        onProgress: function (cur, tot) { if (progEl && tot > 0) { progEl.max = tot; progEl.value = cur; } }
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
    onPlay: function (opts) { window.startGame('online', opts && opts.rng ? opts.rng : null); },
    onEnd: function () { finishGame(false, true, 'หมดเวลาแข่งขัน!'); }
  }) : null;
  window.openVersus = function () { if (vs) vs.openMenu(); };

  function getDailyUtcSeed() {
    const d = new Date();
    return GEN.hashSeed(d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate(), CFG.SLUG);
  }
  function calcStars(s) {
    const t = CFG.STAR_THRESHOLDS || [900, 2400, 4500];
    return s >= t[2] ? 3 : s >= t[1] ? 2 : s >= t[0] ? 1 : 0;
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
    const effHero = (roundMode === 'practice' || isHeroUnlocked(selectedHero)) ? selectedHero : 'mage';
    submittedThisRound = false;
    levelUpOpen = false;
    chestOpen = false;
    pauseOpen = false;
    gameActive = true;

    let seedVal = 1337;
    if (typeof rngOpt === 'function') seedVal = Math.max(1, Math.floor(rngOpt() * 2147483647));
    else if (seedMode === 'daily') seedVal = getDailyUtcSeed();
    else seedVal = Math.max(1, Math.floor(Math.random() * 2147483647));

    KAMPAI.beginRound();
    $('blocker').classList.add('hidden');
    $('gameover-screen').classList.add('hidden');
    $('pause-modal').classList.add('hidden');
    $('levelup-modal').classList.add('hidden');
    $('chest-modal').classList.add('hidden');
    $('boss-bar').classList.add('hidden');
    $('math-banner').classList.add('hidden');
    $('fever-badge').classList.add('hidden');
    $('minimap-box').classList.remove('hidden');
    $('dash-btn').classList.remove('hidden');

    updateHudDom({ score: 0, remaining: CFG.RUN_DURATION_SEC, actName: CFG.ACTS[0].name, hp: effHero === 'knight' ? 125 : CFG.MAX_HP, maxHp: effHero === 'knight' ? 125 : CFG.MAX_HP, level: 1, xp: 0, xpNeed: 60, weapons: [{ icon: '✨', name: 'คทาประกายดาว', lv: 1 }], seed: seedVal, dashRatio: 1 });

    const isTestHarness = new URLSearchParams(location.search).get('kampai_test') === '1';
    if (isTestHarness && typeof Engine === 'undefined') return;

    bootGodotEngine().then(function () {
      window.KAMPAI_BRIDGE_IN.seed = seedVal;
      window.KAMPAI_BRIDGE_IN.mode = roundMode;
      window.KAMPAI_BRIDGE_IN.mapId = selectedMap;
      window.KAMPAI_BRIDGE_IN.heroId = effHero;
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
    chestOpen = false;
    pauseOpen = false;
    window.KAMPAI_BRIDGE_IN.paused = true;
    $('levelup-modal').classList.add('hidden');
    $('chest-modal').classList.add('hidden');
    $('pause-modal').classList.add('hidden');
    $('boss-bar').classList.add('hidden');
    $('math-banner').classList.add('hidden');
    $('fever-badge').classList.add('hidden');
    $('minimap-box').classList.add('hidden');
    $('dash-btn').classList.add('hidden');
    resetJoystick();

    if (!fromVersus && vs && roundMode === 'online' && vs.finish(lastSnapshot.score, { correct: lastSnapshot.correct })) return;

    profile.runs += 1;
    profile.totalSolved = (profile.totalSolved || 0) + lastSnapshot.correct;
    profile.totalBossKills = (profile.totalBossKills || 0) + lastSnapshot.bossKills;
    if (lastSnapshot.score > profile.bestScore) profile.bestScore = lastSnapshot.score;
    if (lastSnapshot.actIndex + 1 > profile.bestWave) profile.bestWave = lastSnapshot.actIndex + 1;
    const newUnlocks = evaluateAchievements(won);
    saveProfile(profile);
    renderMyStats();

    if (roundMode !== 'practice' && !submittedThisRound) {
      submittedThisRound = true;
      KAMPAI.submitScore(lastSnapshot.score, { mode: roundMode, stars: calcStars(lastSnapshot.score), correct: lastSnapshot.correct, wrong: lastSnapshot.wrong });
    }

    const stars = calcStars(lastSnapshot.score);
    $('go-badge').textContent = roundMode === 'practice' ? '🛡️ โหมดฝึกซ้อม (ไม่บันทึกคะแนน)' : '⚔️ สรุปผลอารีนา';
    $('go-title').textContent = won ? '🏆 พิชิตอารีนาคณิตศาสตร์ครบ 3 องก์!' : '⚔️ จบการผจญภัย!';
    $('go-stars').textContent = '☆☆☆'.split('').map(function (_s, i) { return i < stars ? '★' : '☆'; }).join('');
    $('final-score').textContent = lastSnapshot.score.toLocaleString();
    $('go-summary').textContent = 'กำจัด ' + lastSnapshot.kills + ' ตัว · ตอบลูกแก้วถูก ' + lastSnapshot.correct + ' ข้อ · พลาด ' + lastSnapshot.wrong + ' ครั้ง · เลเวล ' + lastSnapshot.level + (lastSnapshot.evolutions ? ' · Evolution ' + lastSnapshot.evolutions : '');
    $('go-meta').innerHTML =
      '<div>🌱 <b>Seed:</b> #' + lastSnapshot.seed + ' · <b>แมพ:</b> ' + selectedMap + ' · <b>องก์ที่ถึง:</b> ' + (lastSnapshot.actIndex + 1) + '/3 · <b>สาเหตุ:</b> ' + (causeText || 'สิ้นสุดรอบ') + '</div>' +
      (newUnlocks.length ? '<div>🏅 <b>ปลดล็อกตราใหม่:</b> ' + newUnlocks.join(', ') + '</div>' : '');

    $('gameover-screen').classList.remove('hidden');
    renderLeaderboard('score-list-gameover');
  }

  window.finishForTest = function () {
    if (!gameActive) window.startGame('normal');
    finishGame(false, false, 'ทดสอบจบเกม');
  };
  window.restartGame = function () { window.startGame(roundMode); };
})();
