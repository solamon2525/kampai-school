/* game.js — Math Survivors: เกม Roguelite แนว Vampire Survivors วิชาคณิตศาสตร์ ป.4-ป.6 */
(function () {
  'use strict';

  const CFG = window.GAME_CONFIG;
  const DATA = window.GAME_DATA;
  const GEN = window.MathGen;
  const SFX = window.SurvivorsAudio;

  KAMPAI.setSlug(CFG.SLUG);
  KAMPAI.sound.defaultBgm(CFG.BGM);
  KAMPAI.sound.mountToggles();

  const $ = function (id) { return document.getElementById(id); };
  const canvas = $('game-canvas');
  const ctx = canvas.getContext('2d');

  // ── Persistent Profile State (แยกจาก Run State ตามหลัก Roguelike) ──
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

  // ── UI Helpers (KAMPAI SDK) ──
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
    const msBest = $('ms-best');
    const msPlays = $('ms-plays');
    const msUnlocks = $('ms-unlocks');
    if (msBest) msBest.innerText = best.toLocaleString();
    if (msPlays) msPlays.innerText = plays.toLocaleString();
    if (msUnlocks) msUnlocks.innerText = profile.unlocks.length + '/' + DATA.ACHIEVEMENTS.length;
    const box = $('my-stats');
    if (box) box.style.display = 'flex';
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

  // ── Seed Mode (Random vs Daily UTC) ──
  let seedMode = 'random';
  function getDailyUtcSeed() {
    const d = new Date();
    const key = d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
    return GEN.hashSeed(key, CFG.SLUG);
  }
  window.setSeedMode = function (mode) {
    seedMode = mode === 'daily' ? 'daily' : 'random';
    const b1 = $('btn-seed-random');
    const b2 = $('btn-seed-daily');
    if (b1) b1.classList.toggle('active', seedMode === 'random');
    if (b2) b2.classList.toggle('active', seedMode === 'daily');
  };

  // ── KampaiVersus (3 โหมดมาตรฐาน) ──
  const vs = window.KampaiVersus ? KampaiVersus.create({
    duration: CFG.ONLINE_DURATION,
    title: CFG.TITLE_TH,
    rankBy: 'score',
    onPlay: function (opts) {
      window.startGame('online', opts && opts.rng ? opts.rng : null);
    },
    onEnd: function () {
      if (run && run.phase === 'playing') finishGame(false, true, 'หมดเวลาแข่งขัน!');
    }
  }) : null;
  window.openVersus = function () { if (vs) vs.openMenu(); };

  // ── Viewport Resize ──
  let vw = 0, vh = 0, dpr = 1;
  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    vw = window.innerWidth;
    vh = window.innerHeight;
    canvas.width = Math.max(1, Math.floor(vw * dpr));
    canvas.height = Math.max(1, Math.floor(vh * dpr));
  }
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // ── Input (Keyboard + Canvas Virtual Joystick) ──
  const keys = Object.create(null);
  const joy = { active: false, pointerId: null, originX: 0, originY: 0, curX: 0, curY: 0, dx: 0, dy: 0 };

  window.addEventListener('keydown', function (e) {
    const k = e.key.toLowerCase();
    keys[k] = true;
    if (run && run.phase === 'levelup') {
      if (k === '1' || k === '2' || k === '3') {
        e.preventDefault();
        pickDraftIndex(Number(k) - 1);
      }
    }
  });
  window.addEventListener('keyup', function (e) {
    keys[e.key.toLowerCase()] = false;
  });

  canvas.addEventListener('pointerdown', function (e) {
    if (!run || run.phase !== 'playing') return;
    SFX.unlock();
    joy.active = true;
    joy.pointerId = e.pointerId;
    joy.originX = e.clientX;
    joy.originY = e.clientY;
    joy.curX = e.clientX;
    joy.curY = e.clientY;
    joy.dx = 0;
    joy.dy = 0;
  });
  window.addEventListener('pointermove', function (e) {
    if (!joy.active || e.pointerId !== joy.pointerId) return;
    joy.curX = e.clientX;
    joy.curY = e.clientY;
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
  });
  function releaseJoy(e) {
    if (joy.active && (e.pointerId === joy.pointerId || e.type === 'blur')) {
      joy.active = false;
      joy.pointerId = null;
      joy.dx = 0;
      joy.dy = 0;
    }
  }
  window.addEventListener('pointerup', releaseJoy);
  window.addEventListener('pointercancel', releaseJoy);
  window.addEventListener('blur', releaseJoy);

  document.addEventListener('visibilitychange', function () {
    if (!run) return;
    if (document.hidden && run.phase === 'playing') {
      run.hiddenPaused = true;
    } else if (!document.hidden && run.hiddenPaused) {
      run.hiddenPaused = false;
      run.lastFrameMs = performance.now();
    }
  });

  // ── Toast & Reduced Motion ──
  let toastTimer = null;
  function showToast(msg, tone) {
    const el = $('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = tone || 'info';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.className = 'hidden'; }, 2800);
  }
  function prefersReducedMotion() {
    try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (_) { return false; }
  }

  // ── Run State (แยกอิสระจาก Profile, ล้างทุกครั้งเมื่อเริ่มใหม่) ──
  let run = null;
  let rafId = 0;

  function createRunState(mode, seedVal) {
    const waveRng = GEN.mulberry32(GEN.hashSeed(seedVal, 'wave'));
    const mathRng = GEN.mulberry32(GEN.hashSeed(seedVal, 'math'));
    const draftRng = GEN.mulberry32(GEN.hashSeed(seedVal, 'draft'));
    const half = CFG.ARENA_SIZE * 0.5;
    return {
      mode: mode,
      seed: seedVal,
      phase: 'playing', // playing | levelup | ended
      hiddenPaused: false,
      submitted: false,
      elapsed: 0,
      lastFrameMs: performance.now(),
      score: 0,
      kills: 0,
      correctMath: 0,
      wrongMath: 0,
      mathStreak: 0,
      bestStreak: 0,
      bossKills: 0,
      cause: '',
      level: 1,
      xp: 0,
      xpNeed: 60,
      actIndex: 0,
      bossesSpawned: {},
      waveRng: waveRng,
      mathRng: mathRng,
      draftRng: draftRng,
      hero: {
        x: half, y: half,
        vx: 0, vy: 0,
        facing: 1,
        hp: CFG.MAX_HP,
        maxHp: CFG.MAX_HP,
        invuln: 0,
        bob: 0,
        flash: 0
      },
      weapons: { wand: 1 },
      passives: {},
      cooldowns: { wand: 0.25, lightning: 0.8, boomerang: 1.0, nova: 1.6 },
      orbAngle: 0,
      spawnAcc: 0,
      mathCooldown: 1.1,
      activeQuestion: null,
      answerOrbs: [],
      enemies: [],
      projectiles: [],
      gems: [],
      particles: [],
      popups: [],
      bolts: [],
      rings: [],
      draftOptions: [],
      trauma: 0,
      hitStop: 0,
      newUnlocks: []
    };
  }

  function getCooldownMult() {
    const h = run.passives.haste || 0;
    return Math.pow(0.88, h);
  }
  function getMoveSpeed() {
    const b = run.passives.boots || 0;
    return CFG.BASE_SPEED * (1 + b * 0.14);
  }
  function getPickupRadius() {
    const m = run.passives.magnet || 0;
    return CFG.BASE_PICKUP_RADIUS * (1 + m * 0.45);
  }

  function addScore(pts) {
    if (!run) return;
    run.score = Math.max(0, Math.round(run.score + pts));
    const sv = $('score-value');
    if (sv) sv.textContent = run.score.toLocaleString();
    if (vs && run.mode !== 'practice') vs.report(run.score, { correct: run.correctMath });
  }

  function updateHudDom() {
    if (!run) return;
    const rem = Math.max(0, Math.ceil(CFG.RUN_DURATION_SEC - run.elapsed));
    const mm = String(Math.floor(rem / 60)).padStart(2, '0');
    const ss = String(rem % 60).padStart(2, '0');
    const tv = $('timer-value');
    if (tv) tv.textContent = mm + ':' + ss;

    const sv = $('score-value');
    if (sv) sv.textContent = run.score.toLocaleString();

    const hpText = $('hp-text');
    if (hpText) hpText.textContent = Math.max(0, Math.ceil(run.hero.hp)) + '/' + run.hero.maxHp;

    const act = CFG.ACTS[Math.min(CFG.ACTS.length - 1, run.actIndex)];
    const actLbl = $('act-label');
    if (actLbl && act) actLbl.textContent = act.name;

    const xpFill = $('xp-fill');
    const xpText = $('xp-text');
    if (xpFill) xpFill.style.width = Math.min(100, Math.round((run.xp / run.xpNeed) * 100)) + '%';
    if (xpText) xpText.textContent = 'Lv.' + run.level;
  }

  function renderWeaponDock() {
    const dock = $('weapon-dock');
    if (!dock || !run) return;
    const badges = [];
    Object.keys(run.weapons).forEach(function (id) {
      const w = DATA.WEAPONS[id];
      if (w) badges.push('<div class="w-badge">' + w.icon + ' <span>' + w.name + '</span> <b>Lv.' + run.weapons[id] + '</b></div>');
    });
    Object.keys(run.passives).forEach(function (id) {
      const p = DATA.PASSIVES[id];
      if (p) badges.push('<div class="w-badge">' + p.icon + ' <span>' + p.name + '</span> <b>Lv.' + run.passives[id] + '</b></div>');
    });
    dock.innerHTML = badges.join('');
  }

  // ── Math Equation & Floating Answer Orbs ──
  function spawnNextMathChallenge() {
    if (!run) return;
    const act = run.actIndex + 1;
    const q = GEN.generateQuestion(act, run.mathRng);
    run.activeQuestion = q;
    run.answerOrbs = [];

    const baseAng = run.mathRng() * Math.PI * 2;
    const dist = Math.min(vw, vh) < 480 ? 150 : 195;
    const arenaMin = 70;
    const arenaMax = CFG.ARENA_SIZE - 70;

    q.choices.forEach(function (val, idx) {
      const ang = baseAng + (idx * Math.PI * 2) / 3;
      const ox = Math.max(arenaMin, Math.min(arenaMax, run.hero.x + Math.cos(ang) * dist));
      const oy = Math.max(arenaMin, Math.min(arenaMax, run.hero.y + Math.sin(ang) * dist));
      run.answerOrbs.push({
        value: val,
        correct: val === q.answer,
        x: ox,
        y: oy,
        radius: 25,
        pulse: idx * 1.4
      });
    });

    const banner = $('math-banner');
    if (banner) {
      $('mb-grade').textContent = q.grade;
      $('mb-q').textContent = q.prompt;
      banner.classList.remove('hidden');
    }
  }

  function triggerMathOrb(orb) {
    if (!run || !run.activeQuestion) return;
    const q = run.activeQuestion;
    run.activeQuestion = null;
    run.answerOrbs = [];
    const banner = $('math-banner');
    if (banner) banner.classList.add('hidden');

    if (orb.correct) {
      run.correctMath += 1;
      run.mathStreak += 1;
      if (run.mathStreak > run.bestStreak) run.bestStreak = run.mathStreak;
      const bonus = CFG.MATH_CORRECT_SCORE + Math.min(4, run.mathStreak - 1) * CFG.MATH_STREAK_BONUS;
      addScore(bonus);
      run.hero.hp = Math.min(run.hero.maxHp, run.hero.hp + 15);
      run.trauma = Math.min(1, run.trauma + 0.35);
      run.hitStop = 0.05;
      SFX.mathCorrect();
      KAMPAI.sound.fxFlash(true);
      KAMPAI.sound.speak(String(q.answer), 'th-TH', true);
      showToast('✅ ถูกต้อง! ' + q.explain + ' (+' + bonus + ' & ฮีล +15 HP)', 'good');

      // Arcane Supernova shockwave around hero wiping close enemies
      run.rings.push({ x: run.hero.x, y: run.hero.y, r: 20, maxR: 320, color: '#38bdf8', life: 0.45 });
      for (let i = run.enemies.length - 1; i >= 0; i--) {
        const e = run.enemies[i];
        const d = Math.hypot(e.x - run.hero.x, e.y - run.hero.y);
        if (d < 340) {
          damageEnemy(e, e.isBoss ? 140 : 9999, '#38bdf8');
        }
      }
      spawnPopup(run.hero.x, run.hero.y - 36, 'SUPER MATH +' + bonus + '!', '#4ade80');
      run.mathCooldown = CFG.MATH_ORB_INTERVAL_SEC;
    } else {
      run.wrongMath += 1;
      run.mathStreak = 0;
      SFX.mathWrong();
      KAMPAI.sound.fxFlash(false);
      damageHero(CFG.MATH_WRONG_DAMAGE, 'ลูกแก้วคำตอบผิด (' + orb.value + ')');
      showToast('❌ ' + orb.value + ' ยังไม่ถูก → คำตอบคือ ' + q.answer + ' (' + q.explain + ')', 'bad');
      spawnPopup(orb.x, orb.y - 16, '❌ -' + CFG.MATH_WRONG_DAMAGE + ' HP', '#f87171');
      run.mathCooldown = 2.4;
    }
    updateHudDom();
  }

  // ── Enemy Spawning & Wave Scaling ──
  function spawnEnemy(kind) {
    if (!run) return;
    if (!kind.isBoss && run.enemies.length >= CFG.MAX_ENEMIES) return;
    const def = DATA.ENEMY_TYPES[kind.type];
    const act = CFG.ACTS[run.actIndex];
    const ang = run.waveRng() * Math.PI * 2;
    const dist = CFG.SAFE_SPAWN_MIN_DIST + run.waveRng() * (CFG.SAFE_SPAWN_MAX_DIST - CFG.SAFE_SPAWN_MIN_DIST);
    const x = Math.max(40, Math.min(CFG.ARENA_SIZE - 40, run.hero.x + Math.cos(ang) * dist));
    const y = Math.max(40, Math.min(CFG.ARENA_SIZE - 40, run.hero.y + Math.sin(ang) * dist));

    const scaleHp = def.hp * act.hpMult * (kind.isBoss ? (1 + run.actIndex * 0.45) : 1);
    run.enemies.push({
      type: kind.type,
      name: kind.customName || def.name,
      x: x, y: y,
      hp: scaleHp,
      maxHp: scaleHp,
      speed: def.speed * act.speedMult,
      radius: def.radius,
      dmg: def.dmg,
      xp: def.xp,
      score: def.score,
      color: def.color,
      sym: def.sym,
      isBoss: !!kind.isBoss,
      flash: 0,
      slow: 0,
      wobble: run.waveRng() * 6.28
    });
  }

  function damageEnemy(e, amt, color) {
    if (!run || e.hp <= 0) return;
    e.hp -= amt;
    e.flash = 0.1;
    spawnPopup(e.x, e.y - e.radius, String(Math.round(amt)), color || '#fde047');
    if (e.hp <= 0) {
      run.kills += 1;
      addScore(e.score);
      SFX.hit();
      spawnBurst(e.x, e.y, e.color, e.isBoss ? 22 : 7);
      const gemCount = e.isBoss ? 8 : 1;
      for (let g = 0; g < gemCount; g++) {
        run.gems.push({
          x: e.x + (g ? (run.waveRng() - 0.5) * 44 : 0),
          y: e.y + (g ? (run.waveRng() - 0.5) * 44 : 0),
          xp: e.isBoss ? Math.ceil(e.xp / 8) : e.xp,
          big: e.isBoss || e.xp >= 25
        });
      }
      if (e.isBoss) {
        run.bossKills += 1;
        run.trauma = Math.min(1, run.trauma + 0.55);
        showToast('👑 โค่น ' + e.name + ' สำเร็จ! ได้โบนัส EXP มหาศาล', 'good');
      }
    }
  }

  function damageHero(dmg, causeLabel) {
    if (!run || run.hero.invuln > 0 || run.phase !== 'playing') return;
    run.hero.hp = Math.max(0, run.hero.hp - dmg);
    run.hero.invuln = 0.65;
    run.hero.flash = 0.25;
    run.trauma = Math.min(1, run.trauma + 0.42);
    SFX.hurt();
    if (run.hero.hp <= 0) {
      finishGame(false, false, causeLabel || 'พ่ายแพ้ต่อฝูงมอนสเตอร์');
    }
    updateHudDom();
  }

  // ── Weapons Simulation ──
  function findNearestEnemy(maxRange) {
    let best = null, bestD = maxRange || 99999;
    for (let i = 0; i < run.enemies.length; i++) {
      const e = run.enemies[i];
      if (e.hp <= 0) continue;
      const d = Math.hypot(e.x - run.hero.x, e.y - run.hero.y);
      if (d < bestD) { bestD = d; best = e; }
    }
    return best;
  }

  function fireWeapons(dt) {
    const cdMult = getCooldownMult();

    // 1. คทาประกายดาว (Wand)
    if (run.weapons.wand) {
      const lv = run.weapons.wand;
      run.cooldowns.wand -= dt;
      if (run.cooldowns.wand <= 0) {
        const target = findNearestEnemy(480);
        if (target) {
          const baseAng = Math.atan2(target.y - run.hero.y, target.x - run.hero.x);
          const shots = lv >= 5 ? 4 : lv >= 4 ? 3 : lv >= 2 ? 2 : 1;
          const dmg = 16 + lv * 7;
          for (let s = 0; s < shots; s++) {
            const spread = shots === 1 ? 0 : (s - (shots - 1) * 0.5) * 0.17;
            const ang = baseAng + spread;
            run.projectiles.push({
              kind: 'bolt',
              x: run.hero.x, y: run.hero.y,
              vx: Math.cos(ang) * 440,
              vy: Math.sin(ang) * 440,
              dmg: dmg,
              pierce: lv >= 4 ? 2 : 1,
              hitSet: new Set(),
              life: 1.25,
              radius: 6,
              color: lv >= 5 ? '#f472b6' : '#38bdf8'
            });
          }
          SFX.shoot();
          run.cooldowns.wand = (lv >= 3 ? 0.52 : 0.65) * cdMult;
        } else {
          run.cooldowns.wand = 0.15;
        }
      }
    }

    // 2. วงแหวนพาย (Orbiting Pi Orbs)
    if (run.weapons.orbs) {
      const lv = run.weapons.orbs;
      const count = lv >= 5 ? 5 : lv >= 4 ? 4 : lv >= 2 ? 3 : 2;
      const orbitR = 54 + (lv >= 3 ? 12 : 0);
      const spinSpeed = 3.1 + lv * 0.38;
      run.orbAngle = (run.orbAngle + spinSpeed * dt) % (Math.PI * 2);
      const orbDmg = 13 + lv * 5;
      for (let o = 0; o < count; o++) {
        const ang = run.orbAngle + (o * Math.PI * 2) / count;
        const ox = run.hero.x + Math.cos(ang) * orbitR;
        const oy = run.hero.y + Math.sin(ang) * orbitR;
        for (let i = 0; i < run.enemies.length; i++) {
          const e = run.enemies[i];
          if (e.hp <= 0 || e._orbCd > 0) continue;
          if (Math.hypot(e.x - ox, e.y - oy) < e.radius + 11) {
            e._orbCd = 0.38;
            damageEnemy(e, orbDmg, '#facc15');
          }
        }
      }
    }

    // 3. สายฟ้าสมการ (Chain Lightning)
    if (run.weapons.lightning) {
      const lv = run.weapons.lightning;
      run.cooldowns.lightning -= dt;
      if (run.cooldowns.lightning <= 0) {
        const first = findNearestEnemy(380);
        if (first) {
          const chains = lv >= 5 ? 6 : lv >= 4 ? 4 : lv >= 2 ? 3 : 2;
          const dmg = 22 + lv * 9;
          const pts = [{ x: run.hero.x, y: run.hero.y }];
          const hitIds = new Set();
          let cur = first;
          for (let c = 0; c < chains && cur; c++) {
            hitIds.add(cur);
            pts.push({ x: cur.x, y: cur.y });
            damageEnemy(cur, dmg, '#fde047');
            let nextE = null, nextD = 185;
            for (let i = 0; i < run.enemies.length; i++) {
              const cand = run.enemies[i];
              if (cand.hp <= 0 || hitIds.has(cand)) continue;
              const d = Math.hypot(cand.x - cur.x, cand.y - cur.y);
              if (d < nextD) { nextD = d; nextE = cand; }
            }
            cur = nextE;
          }
          run.bolts.push({ pts: pts, life: 0.2 });
          SFX.lightning();
          run.cooldowns.lightning = (lv >= 2 ? 1.55 : 1.95) * cdMult;
        } else {
          run.cooldowns.lightning = 0.25;
        }
      }
    }

    // 4. จักรเศษส่วน (Boomerang Disc)
    if (run.weapons.boomerang) {
      const lv = run.weapons.boomerang;
      run.cooldowns.boomerang -= dt;
      if (run.cooldowns.boomerang <= 0) {
        const blades = lv >= 5 ? 4 : lv >= 4 ? 3 : lv >= 2 ? 2 : 1;
        const base = findNearestEnemy(450);
        const startAng = base ? Math.atan2(base.y - run.hero.y, base.x - run.hero.x) : 0;
        const dmg = 20 + lv * 8;
        for (let b = 0; b < blades; b++) {
          const ang = startAng + (b * Math.PI * 2) / blades;
          run.projectiles.push({
            kind: 'boomerang',
            x: run.hero.x, y: run.hero.y,
            dirX: Math.cos(ang), dirY: Math.sin(ang),
            speed: 310 + lv * 22,
            age: 0,
            maxAge: 1.55,
            dmg: dmg,
            radius: lv >= 2 ? 14 : 11,
            hitCd: new Map(),
            color: '#a855f7'
          });
        }
        SFX.shoot();
        run.cooldowns.boomerang = 2.05 * cdMult;
      }
    }

    // 5. คลื่นระเบิดคูณสิบ (Nova Burst)
    if (run.weapons.nova) {
      const lv = run.weapons.nova;
      run.cooldowns.nova -= dt;
      if (run.cooldowns.nova <= 0) {
        const rad = 115 + lv * 26;
        const dmg = 24 + lv * 12;
        run.rings.push({ x: run.hero.x, y: run.hero.y, r: 16, maxR: rad, color: '#fb923c', life: 0.35 });
        for (let i = run.enemies.length - 1; i >= 0; i--) {
          const e = run.enemies[i];
          if (e.hp <= 0) continue;
          const dx = e.x - run.hero.x, dy = e.y - run.hero.y;
          const d = Math.hypot(dx, dy) || 1;
          if (d <= rad + e.radius) {
            e.x += (dx / d) * 24;
            e.y += (dy / d) * 24;
            damageEnemy(e, dmg, '#fb923c');
          }
        }
        run.cooldowns.nova = (lv >= 3 ? 2.4 : 3.0) * cdMult;
      }
    }
  }

  // ── Level-Up Draft Cards ──
  function buildDraftOptions() {
    const pool = [];
    Object.keys(DATA.WEAPONS).forEach(function (id) {
      const w = DATA.WEAPONS[id];
      const cur = run.weapons[id] || 0;
      if (cur < w.maxLv) {
        pool.push({
          kind: 'weapon', id: id, icon: w.icon, name: w.name,
          nextLv: cur + 1, isNew: cur === 0,
          desc: w.desc[cur] || w.desc[w.desc.length - 1]
        });
      }
    });
    Object.keys(DATA.PASSIVES).forEach(function (id) {
      const p = DATA.PASSIVES[id];
      const cur = run.passives[id] || 0;
      if (cur < p.maxLv) {
        pool.push({
          kind: 'passive', id: id, icon: p.icon, name: p.name,
          nextLv: cur + 1, isNew: cur === 0,
          desc: p.desc
        });
      }
    });
    const shuffled = GEN.shuffle(run.draftRng, pool);
    if (!shuffled.length) {
      return [
        { kind: 'heal', id: 'heal', icon: '💖', name: 'ฟื้นฟูพลัง & โบนัส', nextLv: 1, isNew: false, desc: 'ฟื้นฟู +35 HP และรับคะแนนโบนัส +120' }
      ];
    }
    return shuffled.slice(0, 3);
  }

  function openLevelUpModal() {
    run.phase = 'levelup';
    joy.active = false; joy.dx = 0; joy.dy = 0;
    SFX.levelUp();
    run.draftOptions = buildDraftOptions();
    const wrap = $('lu-cards');
    wrap.innerHTML = run.draftOptions.map(function (opt, i) {
      const tag = opt.isNew ? 'ใหม่!' : 'Lv.' + opt.nextLv;
      return '<button type="button" class="lu-card" data-kampai-action="pick-' + i + '" onclick="window.__pickDraft(' + i + ')">' +
        '<div class="lu-card-icon">' + opt.icon + '</div>' +
        '<div class="lu-card-tag">' + tag + '</div>' +
        '<div class="lu-card-title">' + opt.name + '</div>' +
        '<div class="lu-card-desc">' + opt.desc + '</div>' +
      '</button>';
    }).join('');
    $('levelup-modal').classList.remove('hidden');
  }

  function pickDraftIndex(idx) {
    if (!run || run.phase !== 'levelup') return;
    const opt = run.draftOptions[idx] || run.draftOptions[0];
    if (!opt) return;
    if (opt.kind === 'weapon') {
      run.weapons[opt.id] = (run.weapons[opt.id] || 0) + 1;
    } else if (opt.kind === 'passive') {
      run.passives[opt.id] = (run.passives[opt.id] || 0) + 1;
      if (opt.id === 'vitality') {
        run.hero.maxHp += 25;
        run.hero.hp = Math.min(run.hero.maxHp, run.hero.hp + 30);
      }
    } else if (opt.kind === 'heal') {
      run.hero.hp = Math.min(run.hero.maxHp, run.hero.hp + 35);
      addScore(120);
    }
    $('levelup-modal').classList.add('hidden');
    run.phase = 'playing';
    run.lastFrameMs = performance.now();
    renderWeaponDock();
    updateHudDom();
  }
  window.__pickDraft = pickDraftIndex;

  // ── Particles & Popups ──
  function spawnBurst(x, y, color, count) {
    const cap = prefersReducedMotion() ? Math.min(3, count) : count;
    for (let i = 0; i < cap; i++) {
      if (run.particles.length > 180) run.particles.shift();
      const ang = (i / Math.max(1, cap)) * Math.PI * 2 + Math.random() * 0.5;
      const spd = 45 + Math.random() * 110;
      run.particles.push({
        x: x, y: y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        color: color,
        life: 0.35 + Math.random() * 0.25,
        maxLife: 0.6,
        size: 3 + Math.random() * 2.5
      });
    }
  }

  function spawnPopup(x, y, text, color) {
    if (run.popups.length > 48) run.popups.shift();
    run.popups.push({ x: x, y: y, text: text, color: color, life: 0.65 });
  }

  // ── Main Fixed-Clamped Simulation Tick ──
  function updateSimulation(rawDt) {
    if (!run || run.phase !== 'playing' || run.hiddenPaused) return;
    if (run.hitStop > 0) {
      run.hitStop = Math.max(0, run.hitStop - rawDt);
      run.trauma = Math.max(0, run.trauma - rawDt * 2.0);
      return;
    }

    const dt = Math.min(0.05, rawDt);
    run.elapsed += dt;
    run.trauma = Math.max(0, run.trauma - dt * 1.9);

    // Check Act & Win
    if (run.elapsed >= CFG.RUN_DURATION_SEC) {
      finishGame(true, false, 'เอาชีวิตรอดครบ 3 องก์!');
      return;
    }
    for (let a = CFG.ACTS.length - 1; a >= 0; a--) {
      if (run.elapsed >= CFG.ACTS[a].startSec) {
        if (run.actIndex !== a) {
          run.actIndex = a;
          showToast('🔥 เข้าสู่ ' + CFG.ACTS[a].name, 'info');
        }
        break;
      }
    }

    const curAct = CFG.ACTS[run.actIndex];
    if (!run.bossesSpawned[curAct.id] && run.elapsed >= curAct.bossAt) {
      run.bossesSpawned[curAct.id] = true;
      SFX.bossWarn();
      showToast('⚠️ ' + curAct.bossName + ' ปรากฏตัว!', 'bad');
      spawnEnemy({ type: 'boss', isBoss: true, customName: curAct.bossName });
    }

    // Hero Movement
    let ix = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
    let iy = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);
    if (ix !== 0 || iy !== 0) {
      const len = Math.hypot(ix, iy);
      ix /= len; iy /= len;
    } else if (joy.active) {
      ix = joy.dx; iy = joy.dy;
    }

    const spd = getMoveSpeed();
    run.hero.vx = ix * spd;
    run.hero.vy = iy * spd;
    run.hero.x = Math.max(36, Math.min(CFG.ARENA_SIZE - 36, run.hero.x + run.hero.vx * dt));
    run.hero.y = Math.max(36, Math.min(CFG.ARENA_SIZE - 36, run.hero.y + run.hero.vy * dt));
    if (Math.abs(ix) > 0.05) run.hero.facing = ix >= 0 ? 1 : -1;
    if (Math.hypot(ix, iy) > 0.08) run.hero.bob += dt * 11;
    if (run.hero.invuln > 0) run.hero.invuln = Math.max(0, run.hero.invuln - dt);
    if (run.hero.flash > 0) run.hero.flash = Math.max(0, run.hero.flash - dt);

    // Math Orbs Challenge
    if (!run.activeQuestion) {
      run.mathCooldown -= dt;
      if (run.mathCooldown <= 0) spawnNextMathChallenge();
    } else {
      for (let i = 0; i < run.answerOrbs.length; i++) {
        const orb = run.answerOrbs[i];
        orb.pulse += dt * 3.5;
        if (Math.hypot(orb.x - run.hero.x, orb.y - run.hero.y) < orb.radius + 17) {
          triggerMathOrb(orb);
          break;
        }
      }
    }

    // Spawn Enemies (Vampire Survivors swarm bursts)
    run.spawnAcc += dt;
    if (run.spawnAcc >= curAct.spawnRate) {
      run.spawnAcc = 0;
      const burstCount = run.actIndex === 0 ? 2 : 3;
      for (let k = 0; k < burstCount; k++) {
        const r = run.waveRng();
        let type = 'slime';
        if (run.actIndex === 0) type = r < 0.72 ? 'slime' : 'bat';
        else if (run.actIndex === 1) type = r < 0.38 ? 'slime' : r < 0.75 ? 'bat' : 'golem';
        else type = r < 0.25 ? 'bat' : r < 0.65 ? 'golem' : 'knight';
        spawnEnemy({ type: type, isBoss: false });
      }
    }

    // Fire Weapons
    fireWeapons(dt);

    // Move Projectiles
    for (let i = run.projectiles.length - 1; i >= 0; i--) {
      const p = run.projectiles[i];
      if (p.kind === 'bolt') {
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.life -= dt;
        for (let j = 0; j < run.enemies.length; j++) {
          const e = run.enemies[j];
          if (e.hp <= 0 || p.hitSet.has(e)) continue;
          if (Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.radius) {
            p.hitSet.add(e);
            damageEnemy(e, p.dmg, p.color);
            p.pierce -= 1;
            if (p.pierce <= 0) { p.life = 0; break; }
          }
        }
        if (p.life <= 0) run.projectiles.splice(i, 1);
      } else if (p.kind === 'boomerang') {
        p.age += dt;
        const tNorm = p.age / p.maxAge;
        const dirFactor = tNorm < 0.48 ? 1 : -1.15;
        p.x += p.dirX * p.speed * dirFactor * dt;
        p.y += p.dirY * p.speed * dirFactor * dt;
        for (let j = 0; j < run.enemies.length; j++) {
          const e = run.enemies[j];
          if (e.hp <= 0) continue;
          const prevHit = p.hitCd.get(e) || -1;
          if (p.age - prevHit > 0.35 && Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.radius) {
            p.hitCd.set(e, p.age);
            damageEnemy(e, p.dmg, '#c084fc');
          }
        }
        if (p.age >= p.maxAge) run.projectiles.splice(i, 1);
      }
    }

    // Move Enemies & Separation + Hero Collision
    for (let i = run.enemies.length - 1; i >= 0; i--) {
      const e = run.enemies[i];
      if (e.hp <= 0) {
        run.enemies.splice(i, 1);
        continue;
      }
      if (e.flash > 0) e.flash = Math.max(0, e.flash - dt);
      if (e._orbCd > 0) e._orbCd = Math.max(0, e._orbCd - dt);
      e.wobble += dt * 7;

      const dx = run.hero.x - e.x;
      const dy = run.hero.y - e.y;
      const dist = Math.hypot(dx, dy) || 1;
      e.x += (dx / dist) * e.speed * dt;
      e.y += (dy / dist) * e.speed * dt;

      if (dist < e.radius + 14) {
        damageHero(e.dmg, 'ถูก ' + e.name + ' โจมตี');
        e.x -= (dx / dist) * 18;
        e.y -= (dy / dist) * 18;
      }
    }

    // XP Gems Magnet & Collection
    const pickR = getPickupRadius();
    for (let i = run.gems.length - 1; i >= 0; i--) {
      const g = run.gems[i];
      const dx = run.hero.x - g.x;
      const dy = run.hero.y - g.y;
      const d = Math.hypot(dx, dy) || 1;
      if (d < pickR) {
        const pull = 360 * dt;
        g.x += (dx / d) * pull;
        g.y += (dy / d) * pull;
      }
      if (d < 20) {
        run.xp += g.xp;
        addScore(3);
        SFX.gem(run.mathStreak);
        run.gems.splice(i, 1);
        if (run.xp >= run.xpNeed) {
          run.xp -= run.xpNeed;
          run.level += 1;
          run.xpNeed = Math.round(run.xpNeed * 1.32 + 25);
          openLevelUpModal();
          break;
        }
      }
    }

    // Visual FX decay
    for (let i = run.particles.length - 1; i >= 0; i--) {
      const pt = run.particles[i];
      pt.x += pt.vx * dt; pt.y += pt.vy * dt; pt.life -= dt;
      if (pt.life <= 0) run.particles.splice(i, 1);
    }
    for (let i = run.popups.length - 1; i >= 0; i--) {
      const pp = run.popups[i];
      pp.y -= 28 * dt; pp.life -= dt;
      if (pp.life <= 0) run.popups.splice(i, 1);
    }
    for (let i = run.bolts.length - 1; i >= 0; i--) {
      run.bolts[i].life -= dt;
      if (run.bolts[i].life <= 0) run.bolts.splice(i, 1);
    }
    for (let i = run.rings.length - 1; i >= 0; i--) {
      const rg = run.rings[i];
      rg.life -= dt;
      rg.r += (rg.maxR - rg.r) * Math.min(1, dt * 9);
      if (rg.life <= 0) run.rings.splice(i, 1);
    }

    updateHudDom();
  }

  // ── Canvas Rendering ──
  function renderFrame() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#090d1f';
    ctx.fillRect(0, 0, vw, vh);

    if (!run) {
      drawAmbientBackdrop();
      return;
    }

    const shakeMag = prefersReducedMotion() ? 0 : run.trauma * run.trauma * 10;
    const sx = shakeMag * Math.sin(run.elapsed * 43);
    const sy = shakeMag * Math.cos(run.elapsed * 37);
    const camX = run.hero.x - vw * 0.5 + sx;
    const camY = run.hero.y - vh * 0.5 + sy;

    ctx.save();
    ctx.translate(-camX, -camY);

    // Tiled Stone Arena Floor (visible viewport slice only)
    const tile = 64;
    const startX = Math.max(0, Math.floor(camX / tile) * tile);
    const endX = Math.min(CFG.ARENA_SIZE, camX + vw + tile);
    const startY = Math.max(0, Math.floor(camY / tile) * tile);
    const endY = Math.min(CFG.ARENA_SIZE, camY + vh + tile);

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.16)';
    ctx.lineWidth = 1;
    for (let x = startX; x <= endX; x += tile) {
      for (let y = startY; y <= endY; y += tile) {
        const checker = ((x / tile) + (y / tile)) % 2 === 0;
        ctx.fillStyle = checker ? '#111936' : '#0d142c';
        ctx.fillRect(x, y, tile, tile);
        ctx.strokeRect(x, y, tile, tile);
      }
    }

    // Arena Boundary Glow
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 6;
    ctx.strokeRect(18, 18, CFG.ARENA_SIZE - 36, CFG.ARENA_SIZE - 36);

    // Rings / Shockwaves
    run.rings.forEach(function (rg) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, rg.life * 2);
      ctx.strokeStyle = rg.color;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });

    // XP Gems
    run.gems.forEach(function (g) {
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.fillStyle = g.big ? '#facc15' : '#38bdf8';
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, g.big ? -7 : -5);
      ctx.lineTo(g.big ? 6 : 4, 0);
      ctx.lineTo(0, g.big ? 7 : 5);
      ctx.lineTo(g.big ? -6 : -4, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    });

    // Math Answer Orbs
    run.answerOrbs.forEach(function (orb) {
      const pulse = 1 + Math.sin(orb.pulse) * 0.08;
      ctx.save();
      ctx.translate(orb.x, orb.y);
      ctx.scale(pulse, pulse);

      ctx.fillStyle = 'rgba(250, 204, 21, 0.22)';
      ctx.beginPath();
      ctx.arc(0, 0, orb.radius + 9, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1e1b4b';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, orb.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fef08a';
      ctx.font = '800 16px Sarabun, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(orb.value), 0, 1);
      ctx.restore();
    });

    // Enemies
    run.enemies.forEach(function (e) {
      ctx.save();
      ctx.translate(e.x, e.y);
      const bobY = Math.sin(e.wobble) * 2.5;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.beginPath();
      ctx.ellipse(0, e.radius * 0.78, e.radius * 0.85, e.radius * 0.35, 0, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = e.flash > 0 ? '#ffffff' : e.color;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, bobY, e.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Cute eyes + operator symbol
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(-e.radius * 0.32, bobY - e.radius * 0.2, 2.5, 0, Math.PI * 2);
      ctx.arc(e.radius * 0.32, bobY - e.radius * 0.2, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '800 ' + (e.isBoss ? 18 : 13) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(e.sym, 0, bobY + e.radius * 0.26);

      if (e.isBoss) {
        const bw = 66;
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-bw * 0.5, -e.radius - 14, bw, 7);
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(-bw * 0.5 + 1, -e.radius - 13, (bw - 2) * Math.max(0, e.hp / e.maxHp), 5);
      }
      ctx.restore();
    });

    // Orbiting Pi Orbs
    if (run.weapons.orbs) {
      const lv = run.weapons.orbs;
      const count = lv >= 5 ? 5 : lv >= 4 ? 4 : lv >= 2 ? 3 : 2;
      const orbitR = 54 + (lv >= 3 ? 12 : 0);
      for (let o = 0; o < count; o++) {
        const ang = run.orbAngle + (o * Math.PI * 2) / count;
        const ox = run.hero.x + Math.cos(ang) * orbitR;
        const oy = run.hero.y + Math.sin(ang) * orbitR;
        ctx.fillStyle = '#fde047';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(ox, oy, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#1e1b4b';
        ctx.font = '800 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('π', ox, oy + 0.5);
      }
    }

    // Hero (Chibi Math Wizard)
    ctx.save();
    ctx.translate(run.hero.x, run.hero.y);
    if (run.hero.invuln > 0 && Math.floor(run.hero.invuln * 18) % 2 === 0) ctx.globalAlpha = 0.45;
    const hBob = Math.sin(run.hero.bob) * 2.5;
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 16, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Cape / Body
    ctx.fillStyle = run.hero.flash > 0 ? '#fca5a5' : '#2563eb';
    ctx.strokeStyle = '#fde047';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 4 + hBob, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Head
    ctx.fillStyle = '#fed7aa';
    ctx.beginPath();
    ctx.arc(0, -8 + hBob, 10, 0, Math.PI * 2);
    ctx.fill();

    // Wizard Hat
    ctx.fillStyle = '#4338ca';
    ctx.beginPath();
    ctx.moveTo(-14, -12 + hBob);
    ctx.lineTo(14, -12 + hBob);
    ctx.lineTo(2 * run.hero.facing, -28 + hBob);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Wand
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(8 * run.hero.facing, 2 + hBob);
    ctx.lineTo(18 * run.hero.facing, -8 + hBob);
    ctx.stroke();
    ctx.restore();

    // Projectiles
    run.projectiles.forEach(function (p) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      if (p.kind === 'boomerang') {
        ctx.rotate(p.age * 16);
        ctx.fillRect(-p.radius, -4, p.radius * 2, 8);
        ctx.fillRect(-4, -p.radius, 8, p.radius * 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    });

    // Lightning Bolts
    run.bolts.forEach(function (b) {
      ctx.save();
      ctx.globalAlpha = Math.min(1, b.life * 6);
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3;
      ctx.beginPath();
      b.pts.forEach(function (pt, idx) {
        if (idx === 0) ctx.moveTo(pt.x, pt.y);
        else ctx.lineTo(pt.x, pt.y);
      });
      ctx.stroke();
      ctx.restore();
    });

    // Particles & Damage Popups
    run.particles.forEach(function (pt) {
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.fillRect(pt.x - pt.size * 0.5, pt.y - pt.size * 0.5, pt.size, pt.size);
    });
    ctx.globalAlpha = 1;

    run.popups.forEach(function (pp) {
      ctx.globalAlpha = Math.max(0, Math.min(1, pp.life * 2));
      ctx.font = '800 13px Sarabun, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#0f172a';
      ctx.fillText(pp.text, pp.x + 1, pp.y + 1);
      ctx.fillStyle = pp.color;
      ctx.fillText(pp.text, pp.x, pp.y);
    });
    ctx.globalAlpha = 1;

    ctx.restore();

    // Offscreen Arrow Indicators for Answer Orbs
    run.answerOrbs.forEach(function (orb) {
      const sxPos = orb.x - camX;
      const syPos = orb.y - camY;
      const margin = 38;
      if (sxPos < margin || sxPos > vw - margin || syPos < 95 || syPos > vh - margin) {
        const ang = Math.atan2(syPos - vh * 0.5, sxPos - vw * 0.5);
        const ix = Math.max(margin, Math.min(vw - margin, vw * 0.5 + Math.cos(ang) * (vw * 0.42)));
        const iy = Math.max(105, Math.min(vh - margin, vh * 0.5 + Math.sin(ang) * (vh * 0.36)));
        ctx.save();
        ctx.translate(ix, iy);
        ctx.fillStyle = '#facc15';
        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(0, 0, 17, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#0f172a';
        ctx.font = '800 11px Sarabun, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(String(orb.value), 0, 1);
        ctx.restore();
      }
    });

    // Virtual Analog Thumbstick Overlay
    if (joy.active && run.phase === 'playing') {
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(joy.originX, joy.originY, 44, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(250, 204, 21, 0.72)';
      ctx.beginPath();
      ctx.arc(joy.originX + joy.dx * 34, joy.originY + joy.dy * 34, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawAmbientBackdrop() {
    ctx.fillStyle = '#0d142c';
    ctx.fillRect(0, 0, vw, vh);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.16)';
    for (let x = 0; x < vw; x += 64) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, vh); ctx.stroke();
    }
    for (let y = 0; y < vh; y += 64) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(vw, y); ctx.stroke();
    }
  }

  function loop(now) {
    if (!run) return;
    const rawDt = Math.max(0, (now - run.lastFrameMs) / 1000);
    run.lastFrameMs = now;
    updateSimulation(rawDt);
    renderFrame();
    if (run && run.phase !== 'ended') {
      rafId = requestAnimationFrame(loop);
    }
  }

  // ── Lifecycle: Cleanup / Start / Finish / Restart ──
  function cleanupRound() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0; }
    SFX.stopBgm();
    clearTimeout(toastTimer);
    joy.active = false; joy.dx = 0; joy.dy = 0;
    const banner = $('math-banner');
    if (banner) banner.classList.add('hidden');
    const lu = $('levelup-modal');
    if (lu) lu.classList.add('hidden');
    const toast = $('toast');
    if (toast) toast.className = 'hidden';
  }

  window.startGame = function (modeOpt, rngOpt) {
    cleanupRound();
    SFX.unlock();
    const mode = modeOpt === 'practice' ? 'practice' : modeOpt === 'online' ? 'online' : 'normal';

    let seedVal = 1337;
    if (typeof rngOpt === 'function') {
      seedVal = Math.max(1, Math.floor(rngOpt() * 2147483647));
    } else if (seedMode === 'daily') {
      seedVal = getDailyUtcSeed();
    } else {
      seedVal = Math.max(1, Math.floor(Math.random() * 2147483647));
    }

    run = createRunState(mode, seedVal);
    KAMPAI.beginRound();

    $('blocker').classList.add('hidden');
    $('gameover-screen').classList.add('hidden');
    renderWeaponDock();
    updateHudDom();
    if (mode !== 'practice' || new URLSearchParams(location.search).get('kampai_test') !== '1') {
      SFX.startBgm();
    }
    rafId = requestAnimationFrame(loop);
  };

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
    grant('first_math', run.correctMath >= 3);
    grant('streak_5', run.bestStreak >= 5);
    grant('boss_slayer', run.bossKills >= 1);
    grant('survivor_win', won);
    return newly;
  }

  function finishGame(won, fromVersus, causeText) {
    if (!run || run.phase === 'ended') return;
    run.phase = 'ended';
    run.cause = causeText || (won ? 'รอดชีวิตครบ 3 องก์' : 'หมด HP');
    cleanupRound();

    if (!fromVersus && vs && run.mode === 'online' && vs.finish(run.score, { correct: run.correctMath })) {
      return;
    }

    // Profile Meta-Progression Update (เก็บถาวรแยกจาก Run)
    profile.runs += 1;
    if (run.score > profile.bestScore) profile.bestScore = run.score;
    if (run.actIndex + 1 > profile.bestWave) profile.bestWave = run.actIndex + 1;
    const newUnlocks = evaluateAchievements(won);
    saveProfile(profile);
    renderMyStats();

    // Score submission ownership: Solo = 1 ครั้ง, Practice = 0 ครั้ง
    if (run.mode !== 'practice' && !run.submitted) {
      run.submitted = true;
      KAMPAI.submitScore(run.score, {
        mode: run.mode,
        stars: calcStars(run.score),
        correct: run.correctMath,
        wrong: run.wrongMath
      });
    }

    const stars = calcStars(run.score);
    $('go-badge').textContent = run.mode === 'practice' ? '🛡️ โหมดฝึกซ้อม (ไม่บันทึกคะแนน)' : '⚔️ สรุปผลอารีนา';
    $('go-title').textContent = won ? '🏆 พิชิตอารีนาคณิตศาสตร์ครบ 3 องก์!' : '⚔️ จบการผจญภัย!';
    $('go-stars').textContent = '☆☆☆'.split('').map(function (_s, i) { return i < stars ? '★' : '☆'; }).join('');
    $('final-score').textContent = run.score.toLocaleString();
    $('go-summary').textContent = 'กำจัด ' + run.kills + ' ตัว · ตอบลูกแก้วถูก ' + run.correctMath + ' ข้อ · พลาด ' + run.wrongMath + ' ครั้ง · เลเวล ' + run.level;
    $('go-meta').innerHTML =
      '<div>🌱 <b>Seed:</b> #' + run.seed + ' · <b>องก์ที่ถึง:</b> ' + (run.actIndex + 1) + '/3 · <b>สาเหตุ:</b> ' + run.cause + '</div>' +
      (newUnlocks.length ? '<div>🏅 <b>ปลดล็อกตราใหม่:</b> ' + newUnlocks.join(', ') + '</div>' : '');

    $('gameover-screen').classList.remove('hidden');
    renderLeaderboard('score-list-gameover');
  }

  window.finishForTest = function () {
    if (!run) window.startGame('normal');
    finishGame(false, false, 'ทดสอบจบเกม');
  };

  window.restartGame = function () {
    const prevMode = run ? run.mode : 'normal';
    window.startGame(prevMode);
  };

  drawAmbientBackdrop();
})();
