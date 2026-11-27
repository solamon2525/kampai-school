/* game.js — Math Survivors v3.0 (Godot 4.4.1 WASM + 7 Balanced Classes + 2P Co-op Team & Rival + Dual Draft/Joystick) */
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

  // ── Persistent Profile State ──
  const PROFILE_KEY = 'math_survivors_profile_v1';
  function loadProfile() {
    const def = { bestScore: 0, bestWave: 1, runs: 0, wins: 0, totalSolved: 0, totalBossKills: 0, alchemistUnlocked: false, unlocks: [], reduceShake: false, bgmVol: 80, sfxVol: 100 };
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (!raw) return def;
      const p = JSON.parse(raw);
      return {
        bestScore: Number(p.bestScore) || 0,
        bestWave: Number(p.bestWave) || 1,
        runs: Number(p.runs) || 0,
        wins: Number(p.wins) || 0,
        totalSolved: Number(p.totalSolved) || 0,
        totalBossKills: Number(p.totalBossKills) || 0,
        alchemistUnlocked: !!p.alchemistUnlocked,
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

  let selectedPlayMode = 'normal'; // normal | coop_team | coop_rival
  let selectedMap = 'arcane_temple';
  let p1Hero = 'mage';
  let p2Hero = 'knight';
  let activeSlot = 0; // 0 = P1, 1 = P2
  let seedMode = 'random';

  let gameActive = false;
  let roundMode = 'normal';
  let submittedThisRound = false;
  let levelUpOpen = false;
  let levelUpTwoP = false;
  let draftPicked = [false, false];
  let chestOpen = false;
  let pauseOpen = false;
  let chestChoices = [];
  let toastTimer = null;
  let godotBootPromise = null;
  let lastSnapshot = { score: 0, p1Score: 0, p2Score: 0, twoPlayer: false, correct: 0, wrong: 0, level: 1, kills: 0, actIndex: 0, bestStreak: 0, bossKills: 0, evolutions: 0, alchemistUnlockEligible: false, seed: 1337, weapons: [], players: [] };

  // ── KAMPAI Bridge Input State ──
  window.KAMPAI_GODOT_READY = false;
  window.KAMPAI_BRIDGE_IN = {
    startSeq: 0,
    draftSeq: 0, draftPlayerIdx: 0, draftIdx: 0,
    p1DraftSeq: 0, p1DraftIdx: 0,
    p2DraftSeq: 0, p2DraftIdx: 0,
    chestSeq: 0, chestAnswer: 0,
    dashSeq: 0, dash2Seq: 0,
    seed: 1337,
    mode: 'normal',
    mapId: 'arcane_temple',
    heroId: 'mage',
    p1Hero: 'mage',
    p2Hero: 'knight',
    paused: false,
    sfxOn: readSfxFlag(),
    bgmOn: readBgmFlag(),
    sfxVol: profile.sfxVol / 100,
    bgmVol: profile.bgmVol / 100,
    reduceShake: profile.reduceShake,
    joyDx: 0, joyDy: 0,
    joy2Dx: 0, joy2Dy: 0
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

  // ── 7 Balanced Classes Logic ──
  function getHeroDef(id) {
    return DATA.HEROES.find(function (h) { return h.id === id; }) || DATA.HEROES[0];
  }

  function isHeroUnlocked(heroId) {
    if (heroId === 'mage' || heroId === 'knight' || heroId === 'ranger') return true;
    if (heroId === 'inventor') return (profile.totalSolved || 0) >= 15;
    if (heroId === 'alchemist') return !!profile.alchemistUnlocked;
    if (heroId === 'berserker') return (profile.totalBossKills || 0) >= 2;
    if (heroId === 'chronomancer') return (profile.wins || 0) >= 1;
    return false;
  }

  function getUnlockProgressText(h) {
    if (isHeroUnlocked(h.id)) return '✅ ปลดล็อกแล้ว';
    if (h.id === 'inventor') return '🔒 ตอบถูกสะสม ' + (profile.totalSolved || 0) + '/15 ข้อ (ลองฟรีได้ในฝึกซ้อม)';
    if (h.id === 'alchemist') return '🔒 ผ่านองก์ 1 โดย HP ≥ 50% (ลองฟรีได้ในฝึกซ้อม)';
    if (h.id === 'berserker') return '🔒 โค่นบอส ' + (profile.totalBossKills || 0) + '/2 ตัว (ลองฟรีได้ในฝึกซ้อม)';
    if (h.id === 'chronomancer') return '🔒 ชนะครบ 3 องก์ ' + (profile.wins || 0) + '/1 ครั้ง (ลองฟรีได้ในฝึกซ้อม)';
    return '🔒 ล็อก';
  }

  function countUnlockedHeroes() {
    return DATA.HEROES.filter(function (h) { return isHeroUnlocked(h.id); }).length;
  }

  function renderHeroDetail(heroId) {
    const box = $('hero-detail-bar');
    if (!box) return;
    const h = getHeroDef(heroId);
    const unlocked = isHeroUnlocked(h.id);
    const stats = [
      { k: 'อึด', v: h.vit, c: '#22c55e' },
      { k: 'เร็ว', v: h.spd, c: '#38bdf8' },
      { k: 'แกร่ง', v: h.atk, c: '#f97316' },
      { k: 'เวท', v: h.mag, c: '#c084fc' },
      { k: 'รัว', v: h.agi, c: '#facc15' }
    ];
    box.innerHTML =
      '<div class="hd-info">' +
        '<div class="hd-title">' + h.icon + ' ' + h.name + ' · ' + h.weapon + '</div>' +
        '<div class="hd-trait">' + h.trait + '</div>' +
        '<div class="' + (unlocked ? '' : 'hd-lock') + '">' + getUnlockProgressText(h) + '</div>' +
      '</div>' +
      '<div class="hd-stats">' +
        stats.map(function (st) {
          return '<div class="st-col"><span>' + st.k + ' ' + st.v + '</span><div class="st-track"><div class="st-fill" style="width:' + Math.min(100, st.v * 10) + '%;background:' + st.c + '"></div></div></div>';
        }).join('') +
      '</div>';
  }

  function renderHeroPicker() {
    const wrap = $('hero-picker');
    if (!wrap) return;
    const is2P = selectedPlayMode === 'coop_team' || selectedPlayMode === 'coop_rival';
    wrap.innerHTML = DATA.HEROES.map(function (h) {
      const ok = isHeroUnlocked(h.id);
      const isP1 = p1Hero === h.id;
      const isP2 = is2P && p2Hero === h.id;
      const cls = ['hero-card'];
      if (!ok) cls.push('locked');
      if (isP1 && isP2) cls.push('sel-both');
      else if (isP1) cls.push('sel-p1');
      else if (isP2) cls.push('sel-p2');
      let badges = '';
      if (isP1) badges += '<span class="hc-b-p1">P1</span>';
      if (isP2) badges += '<span class="hc-b-p2">P2</span>';
      if (!ok) badges += '<span class="hc-b-lock">🔒</span>';
      return '<button type="button" class="' + cls.join(' ') + '" data-hero="' + h.id + '" onclick="selectHero(\'' + h.id + '\')">' +
        '<div class="hc-ico">' + h.icon + '</div>' +
        '<div class="hc-name">' + h.name + '</div>' +
        '<div class="hc-badges">' + badges + '</div>' +
      '</button>';
    }).join('');

    if ($('slot-p1-name')) $('slot-p1-name').textContent = getHeroDef(p1Hero).name;
    if ($('slot-p2-name')) $('slot-p2-name').textContent = getHeroDef(p2Hero).name;
    renderHeroDetail(activeSlot === 1 && is2P ? p2Hero : p1Hero);
  }

  window.selectPlayMode = function (m) {
    selectedPlayMode = (m === 'coop_team' || m === 'coop_rival') ? m : 'normal';
    const is2P = selectedPlayMode !== 'normal';
    if (!is2P) activeSlot = 0;
    document.querySelectorAll('.mode-tab').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-mode') === selectedPlayMode);
    });
    if ($('slot-switcher')) $('slot-switcher').classList.toggle('hidden', !is2P);
    const startBtn = $('btn-start-main');
    if (startBtn) {
      if (selectedPlayMode === 'coop_team') startBtn.textContent = '🤝 เริ่ม 2P ช่วยกัน';
      else if (selectedPlayMode === 'coop_rival') startBtn.textContent = '⚔️ เริ่ม 2P แข่งกัน';
      else startBtn.textContent = '▶ เริ่มอารีนา 1P';
    }
    window.setActiveSlot(activeSlot);
    renderHeroPicker();
  };

  window.setActiveSlot = function (slotIdx) {
    activeSlot = slotIdx === 1 ? 1 : 0;
    if ($('btn-slot-p1')) $('btn-slot-p1').classList.toggle('active', activeSlot === 0);
    if ($('btn-slot-p2')) $('btn-slot-p2').classList.toggle('active', activeSlot === 1);
    renderHeroDetail(activeSlot === 1 ? p2Hero : p1Hero);
  };

  window.selectMap = function (mapId) {
    selectedMap = mapId;
    document.querySelectorAll('#map-picker .sel-card').forEach(function (el) {
      el.classList.toggle('active', el.getAttribute('data-map') === mapId);
    });
  };

  window.selectHero = function (heroId) {
    const is2P = selectedPlayMode !== 'normal';
    if (is2P && activeSlot === 1) p2Hero = heroId;
    else p1Hero = heroId;
    renderHeroPicker();
    if (!isHeroUnlocked(heroId)) {
      showToast('💡 อาชีพนี้ยังไม่ปลดล็อก — กด "ฝึกซ้อม" เพื่อทดลองเล่นฟรีได้ทันที!', 'info');
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
    profile.bgmVol = bv; profile.sfxVol = sv;
    window.KAMPAI_BRIDGE_IN.bgmVol = bv / 100; window.KAMPAI_BRIDGE_IN.sfxVol = sv / 100;
    saveProfile(profile);
  };

  window.onSettingsChange = function () {
    const rs = $('chk-reduce-shake') ? !!$('chk-reduce-shake').checked : false;
    profile.reduceShake = rs; window.KAMPAI_BRIDGE_IN.reduceShake = rs;
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

  window.triggerDash = function (playerIdx) {
    if (!gameActive || pauseOpen || levelUpOpen || chestOpen) return;
    if (playerIdx === 1) window.KAMPAI_BRIDGE_IN.dash2Seq += 1;
    else window.KAMPAI_BRIDGE_IN.dashSeq += 1;
  };

  window.backToMenu = function () {
    gameActive = false; pauseOpen = false; levelUpOpen = false; chestOpen = false;
    window.KAMPAI_BRIDGE_IN.paused = true;
    ['gameover-screen', 'pause-modal', 'levelup-modal', 'chest-modal', 'boss-bar', 'math-banner', 'fever-badge', 'minimap-box', 'dash-btn', 'dash-btn-p2', 'coop-hud'].forEach(function (id) {
      if ($(id)) $(id).classList.add('hidden');
    });
    $('blocker').classList.remove('hidden');
    renderMyStats();
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
    if ($('ms-unlocks')) $('ms-unlocks').innerText = countUnlockedHeroes() + '/' + DATA.HEROES.length;
    if ($('my-stats')) $('my-stats').style.display = 'flex';
    renderHeroPicker();
  }

  function renderLeaderboard(listId) {
    const el = $(listId);
    if (!el) return;
    const rows = KAMPAI.leaderboard || [];
    if (!rows.length) { el.innerHTML = '<li class="lb-loading">ยังไม่มีผู้เล่น — เป็นคนแรกสิ!</li>'; return; }
    const medals = ['🥇', '🥈', '🥉'];
    el.innerHTML = rows.slice(0, 5).map(function (r) {
      const av = r.photoUrl ? '<img src="' + r.photoUrl + '" alt="" style="width:26px;height:26px;border-radius:50%;object-fit:cover">' : '';
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

  KAMPAI.onReady(function () { renderPlayer(); renderMyStats(); renderLeaderboard('score-list'); });
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
    mmCtx.fillStyle = 'rgba(15, 23, 42, 0.72)';
    mmCtx.fillRect(0, 0, w, h);

    if (Array.isArray(mm.orbs)) {
      mmCtx.fillStyle = '#facc15';
      mm.orbs.forEach(function (o) { mmCtx.beginPath(); mmCtx.arc(o.x * scaleX, o.y * scaleY, 3.0, 0, Math.PI * 2); mmCtx.fill(); });
    }
    if (mm.chest) { mmCtx.fillStyle = '#4ade80'; mmCtx.fillRect(mm.chest.x * scaleX - 3, mm.chest.y * scaleY - 3, 6, 6); }
    if (mm.boss) { mmCtx.fillStyle = '#ef4444'; mmCtx.beginPath(); mmCtx.arc(mm.boss.x * scaleX, mm.boss.y * scaleY, 4.0, 0, Math.PI * 2); mmCtx.fill(); }
    mmCtx.fillStyle = '#38bdf8';
    mmCtx.beginPath(); mmCtx.arc(mm.hx * scaleX, mm.hy * scaleY, 3.2, 0, Math.PI * 2); mmCtx.fill();
    if (mm.p2) {
      mmCtx.fillStyle = '#fb923c';
      mmCtx.beginPath(); mmCtx.arc(mm.p2.x * scaleX, mm.p2.y * scaleY, 3.2, 0, Math.PI * 2); mmCtx.fill();
    }
  }

  function updateHudDom(d) {
    lastSnapshot = {
      score: Number(d.score) || 0,
      p1Score: Number(d.p1Score) || 0,
      p2Score: Number(d.p2Score) || 0,
      twoPlayer: !!d.twoPlayer,
      correct: Number(d.correct) || 0,
      wrong: Number(d.wrong) || 0,
      level: Number(d.level) || 1,
      kills: Number(d.kills) || 0,
      actIndex: Number(d.actIndex) || 0,
      bestStreak: Number(d.bestStreak) || 0,
      bossKills: Number(d.bossKills) || 0,
      evolutions: Number(d.evolutions) || 0,
      alchemistUnlockEligible: !!d.alchemistUnlockEligible,
      seed: Number(d.seed) || 1337,
      weapons: Array.isArray(d.weapons) ? d.weapons : [],
      players: Array.isArray(d.players) ? d.players : []
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

    // 2P HUD strip
    const coopHud = $('coop-hud');
    if (coopHud) {
      const show2P = gameActive && lastSnapshot.twoPlayer && lastSnapshot.players.length >= 2;
      coopHud.classList.toggle('hidden', !show2P);
      if ($('hp-pill')) $('hp-pill').classList.toggle('hidden', show2P);
      if (show2P) {
        const p1 = lastSnapshot.players[0], p2 = lastSnapshot.players[1];
        const p1Pill = $('p1-hud-pill'), p2Pill = $('p2-hud-pill');
        if ($('p1-hud-hp')) $('p1-hud-hp').textContent = p1.downed ? '🆘 ล้ม! เดินมาชุบ' : (p1.respawnSec > 0 ? '⏳ ' + p1.respawnSec.toFixed(1) + 'วิ' : p1.icon + ' ❤️ ' + p1.hp + '/' + p1.maxHp);
        if ($('p2-hud-hp')) $('p2-hud-hp').textContent = p2.downed ? '🆘 ล้ม! เดินมาชุบ' : (p2.respawnSec > 0 ? '⏳ ' + p2.respawnSec.toFixed(1) + 'วิ' : p2.icon + ' ❤️ ' + p2.hp + '/' + p2.maxHp);
        if (p1Pill) p1Pill.classList.toggle('downed', !!p1.downed);
        if (p2Pill) p2Pill.classList.toggle('downed', !!p2.downed);

        const rBar = $('rival-bar');
        const isRival = roundMode === 'coop_rival';
        if (rBar) {
          rBar.classList.toggle('hidden', !isRival);
          if (isRival) {
            const s1 = lastSnapshot.p1Score, s2 = lastSnapshot.p2Score;
            if ($('rival-s1')) $('rival-s1').textContent = '🔵 ' + s1.toLocaleString();
            if ($('rival-s2')) $('rival-s2').textContent = s2.toLocaleString() + ' 🟠';
            const tot = Math.max(1, s1 + s2);
            const pct1 = s1 === s2 ? 50 : Math.max(10, Math.min(90, Math.round((s1 / tot) * 100)));
            if ($('rival-fill-p1')) $('rival-fill-p1').style.width = pct1 + '%';
          }
        }
        // P2 Dash meter
        const d2 = typeof p2.dashRatio === 'number' ? p2.dashRatio : 1;
        if ($('dash-fill-p2')) $('dash-fill-p2').style.width = Math.round(d2 * 100) + '%';
        if ($('dash-btn-p2')) $('dash-btn-p2').classList.toggle('ready', d2 >= 0.99);
      }
    }

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

    if ($('fever-badge')) $('fever-badge').classList.toggle('hidden', !(Number(d.feverSec) > 0.1));

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

  function renderDraftCardsHtml(opts, playerIdx) {
    return opts.map(function (opt, i) {
      const tag = opt.isEvo ? '🌟 EVOLUTION' : (opt.isNew ? 'ใหม่!' : 'Lv.' + opt.nextLv);
      const syn = opt.synergy ? '<div class="lu-card-syn">' + opt.synergy + '</div>' : '';
      const keyLbl = playerIdx === 1 ? ['J', 'K', 'L'][i] : String(i + 1);
      return '<button type="button" class="lu-card' + (opt.isEvo ? ' evo-card' : '') + '" data-kampai-action="pick-' + playerIdx + '-' + i + '" onclick="window.__pickDraft(' + playerIdx + ',' + i + ')">' +
        '<div class="lu-card-icon">' + opt.icon + '</div>' +
        '<div>' +
          '<div class="lu-card-tag">[' + keyLbl + '] ' + tag + '</div>' +
          '<div class="lu-card-title">' + opt.name + '</div>' +
          '<div class="lu-card-desc">' + opt.desc + '</div>' + syn +
        '</div>' +
      '</button>';
    }).join('');
  }

  window.KAMPAI_BRIDGE_OUT = {
    onHud: function (d) {
      updateHudDom(d);
      if (vs && gameActive && roundMode === 'online') vs.report(lastSnapshot.score, { correct: lastSnapshot.correct });
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
      const pOpts = Array.isArray(d.playerOptions) ? d.playerOptions : [Array.isArray(d.options) ? d.options : []];
      if (!pOpts.length || !pOpts[0].length) return;
      levelUpOpen = true;
      levelUpTwoP = !!d.twoPlayer && pOpts.length >= 2;
      draftPicked = [false, !levelUpTwoP];
      resetJoysticks();

      if (levelUpTwoP) {
        $('lu-cards').classList.add('hidden');
        $('lu-dual-wrap').classList.remove('hidden');
        $('lu-cards-p1').innerHTML = renderDraftCardsHtml(pOpts[0], 0);
        $('lu-cards-p2').innerHTML = renderDraftCardsHtml(pOpts[1], 1);
        if ($('lu-sub')) $('lu-sub').textContent = 'P1 กด 1/2/3 · P2 กด J/K/L หรือแตะการ์ดของตัวเอง';
      } else {
        $('lu-dual-wrap').classList.add('hidden');
        $('lu-cards').classList.remove('hidden');
        $('lu-cards').innerHTML = renderDraftCardsHtml(pOpts[0], 0);
        if ($('lu-sub')) $('lu-sub').textContent = 'กดปุ่มตัวเลข 1 / 2 / 3 หรือแตะการ์ดเพื่อเลือก';
      }
      $('levelup-modal').classList.remove('hidden');
    },
    onChest: function (q) {
      if (!q || !q.prompt) return;
      chestOpen = true;
      chestChoices = Array.isArray(q.choices) ? q.choices : [];
      resetJoysticks();
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

  window.__pickDraft = function (playerIdx, cardIdx) {
    if (!levelUpOpen) return;
    if (typeof cardIdx === 'undefined') { cardIdx = playerIdx; playerIdx = 0; }
    if (draftPicked[playerIdx]) return;
    draftPicked[playerIdx] = true;
    if (playerIdx === 0) {
      window.KAMPAI_BRIDGE_IN.p1DraftIdx = cardIdx;
      window.KAMPAI_BRIDGE_IN.p1DraftSeq += 1;
      if (levelUpTwoP && $('lu-cards-p1')) $('lu-cards-p1').innerHTML = '<div class="lu-ready-box">✅ P1 พร้อมแล้ว!</div>';
    } else {
      window.KAMPAI_BRIDGE_IN.p2DraftIdx = cardIdx;
      window.KAMPAI_BRIDGE_IN.p2DraftSeq += 1;
      if (levelUpTwoP && $('lu-cards-p2')) $('lu-cards-p2').innerHTML = '<div class="lu-ready-box">✅ P2 พร้อมแล้ว!</div>';
    }
    if (draftPicked[0] && draftPicked[1]) {
      levelUpOpen = false;
      $('levelup-modal').classList.add('hidden');
      if (godotCanvas) godotCanvas.focus();
    }
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
    if (levelUpOpen) {
      if (e.key === '1' || e.key === '2' || e.key === '3') {
        e.preventDefault();
        window.__pickDraft(0, Number(e.key) - 1);
      } else if (levelUpTwoP) {
        const k = e.key.toLowerCase();
        if (k === 'j' || e.key === '่') { e.preventDefault(); window.__pickDraft(1, 0); }
        else if (k === 'k' || e.key === 'า') { e.preventDefault(); window.__pickDraft(1, 1); }
        else if (k === 'l' || e.key === 'ส') { e.preventDefault(); window.__pickDraft(1, 2); }
      }
    } else if (chestOpen && (e.key === '1' || e.key === '2' || e.key === '3')) {
      e.preventDefault();
      window.__answerChest(Number(e.key) - 1);
    }
  });

  // ── Multi-Touch Dual Analog Joystick (1P full screen / 2P left=P1, right=P2) ──
  const joys = [
    { active: false, pointerId: null, originX: 0, originY: 0, dx: 0, dy: 0, color: 'rgba(56, 189, 248, 0.78)' },
    { active: false, pointerId: null, originX: 0, originY: 0, dx: 0, dy: 0, color: 'rgba(251, 146, 60, 0.78)' }
  ];
  function resizeJoyCanvas() { if (joyCanvas) { joyCanvas.width = window.innerWidth; joyCanvas.height = window.innerHeight; } }
  resizeJoyCanvas();
  window.addEventListener('resize', resizeJoyCanvas);

  function drawJoyOverlay() {
    if (!joyCtx || !joyCanvas) return;
    joyCtx.clearRect(0, 0, joyCanvas.width, joyCanvas.height);
    if (!gameActive || levelUpOpen || chestOpen || pauseOpen) return;
    joys.forEach(function (j) {
      if (!j.active) return;
      joyCtx.strokeStyle = 'rgba(255,255,255,0.45)';
      joyCtx.lineWidth = 2;
      joyCtx.beginPath();
      joyCtx.arc(j.originX, j.originY, 42, 0, Math.PI * 2);
      joyCtx.stroke();
      joyCtx.fillStyle = j.color;
      joyCtx.beginPath();
      joyCtx.arc(j.originX + j.dx * 32, j.originY + j.dy * 32, 16, 0, Math.PI * 2);
      joyCtx.fill();
    });
  }
  function resetJoysticks() {
    joys.forEach(function (j) { j.active = false; j.pointerId = null; j.dx = 0; j.dy = 0; });
    window.KAMPAI_BRIDGE_IN.joyDx = 0; window.KAMPAI_BRIDGE_IN.joyDy = 0;
    window.KAMPAI_BRIDGE_IN.joy2Dx = 0; window.KAMPAI_BRIDGE_IN.joy2Dy = 0;
    drawJoyOverlay();
  }

  const godotCanvas = $('godot-canvas');
  if (godotCanvas) {
    godotCanvas.addEventListener('pointerdown', function (e) {
      if (!gameActive || levelUpOpen || chestOpen || pauseOpen) return;
      const is2P = roundMode === 'coop_team' || roundMode === 'coop_rival';
      const idx = (is2P && e.clientX >= window.innerWidth * 0.5) ? 1 : 0;
      const j = joys[idx];
      j.active = true; j.pointerId = e.pointerId; j.originX = e.clientX; j.originY = e.clientY; j.dx = 0; j.dy = 0;
      drawJoyOverlay();
    });
  }
  window.addEventListener('pointermove', function (e) {
    joys.forEach(function (j, idx) {
      if (!j.active || e.pointerId !== j.pointerId) return;
      const vx = e.clientX - j.originX, vy = e.clientY - j.originY;
      const len = Math.hypot(vx, vy);
      if (len > 8) { const mag = Math.min(1, len / 46); j.dx = (vx / len) * mag; j.dy = (vy / len) * mag; }
      else { j.dx = 0; j.dy = 0; }
      if (idx === 0) { window.KAMPAI_BRIDGE_IN.joyDx = j.dx; window.KAMPAI_BRIDGE_IN.joyDy = j.dy; }
      else { window.KAMPAI_BRIDGE_IN.joy2Dx = j.dx; window.KAMPAI_BRIDGE_IN.joy2Dy = j.dy; }
      drawJoyOverlay();
    });
  });
  function releaseJoy(e) {
    if (e.type === 'blur') { resetJoysticks(); return; }
    joys.forEach(function (j, idx) {
      if (j.active && e.pointerId === j.pointerId) {
        j.active = false; j.pointerId = null; j.dx = 0; j.dy = 0;
        if (idx === 0) { window.KAMPAI_BRIDGE_IN.joyDx = 0; window.KAMPAI_BRIDGE_IN.joyDy = 0; }
        else { window.KAMPAI_BRIDGE_IN.joy2Dx = 0; window.KAMPAI_BRIDGE_IN.joy2Dy = 0; }
        drawJoyOverlay();
      }
    });
  }
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

  window.startSelectedMode = function () { window.startGame(selectedPlayMode); };

  window.startGame = function (modeOpt, rngOpt) {
    roundMode = (modeOpt === 'practice' || modeOpt === 'online' || modeOpt === 'coop_team' || modeOpt === 'coop_rival') ? modeOpt : 'normal';
    const is2P = roundMode === 'coop_team' || roundMode === 'coop_rival';
    const effP1 = (roundMode === 'practice' || isHeroUnlocked(p1Hero)) ? p1Hero : 'mage';
    const effP2 = (roundMode === 'practice' || isHeroUnlocked(p2Hero)) ? p2Hero : 'knight';

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
    ['blocker', 'gameover-screen', 'pause-modal', 'levelup-modal', 'chest-modal', 'boss-bar', 'math-banner', 'fever-badge'].forEach(function (id) {
      if ($(id)) $(id).classList.add('hidden');
    });
    $('minimap-box').classList.remove('hidden');
    $('dash-btn').classList.remove('hidden');
    $('dash-btn').classList.toggle('two-p', is2P);
    if ($('dash-label-p1')) $('dash-label-p1').textContent = is2P ? '⚡ P1 พุ่ง' : '⚡ พุ่ง';
    if ($('dash-btn-p2')) $('dash-btn-p2').classList.toggle('hidden', !is2P);

    const h1 = getHeroDef(effP1), h2 = getHeroDef(effP2);
    const hp1 = Math.round(85 + h1.vit * 11), hp2 = Math.round(85 + h2.vit * 11);
    const initPlayers = [{ idx: 0, heroId: effP1, icon: h1.icon, hp: hp1, maxHp: hp1, score: 0, downed: false, respawnSec: 0, dashRatio: 1 }];
    if (is2P) initPlayers.push({ idx: 1, heroId: effP2, icon: h2.icon, hp: hp2, maxHp: hp2, score: 0, downed: false, respawnSec: 0, dashRatio: 1 });

    updateHudDom({
      score: 0, p1Score: 0, p2Score: 0, twoPlayer: is2P,
      remaining: roundMode === 'coop_rival' ? 120 : CFG.RUN_DURATION_SEC,
      actName: CFG.ACTS[0].name, hp: hp1, maxHp: hp1, level: 1, xp: 0, xpNeed: is2P ? 75 : 60,
      weapons: [{ icon: h1.icon, name: h1.weapon, lv: 1 }], seed: seedVal, dashRatio: 1, players: initPlayers
    });

    const isTestHarness = new URLSearchParams(location.search).get('kampai_test') === '1';
    if (isTestHarness && typeof Engine === 'undefined') return;

    bootGodotEngine().then(function () {
      window.KAMPAI_BRIDGE_IN.seed = seedVal;
      window.KAMPAI_BRIDGE_IN.mode = roundMode;
      window.KAMPAI_BRIDGE_IN.mapId = selectedMap;
      window.KAMPAI_BRIDGE_IN.heroId = effP1;
      window.KAMPAI_BRIDGE_IN.p1Hero = effP1;
      window.KAMPAI_BRIDGE_IN.p2Hero = effP2;
      window.KAMPAI_BRIDGE_IN.paused = false;
      window.KAMPAI_BRIDGE_IN.sfxOn = readSfxFlag();
      window.KAMPAI_BRIDGE_IN.bgmOn = readBgmFlag();
      window.KAMPAI_BRIDGE_IN.startSeq += 1;
      if (godotCanvas) godotCanvas.focus();
    }).catch(function () {});
  };

  function finishGame(won, fromVersus, causeText) {
    if (!gameActive && !fromVersus) return;
    gameActive = false; levelUpOpen = false; chestOpen = false; pauseOpen = false;
    window.KAMPAI_BRIDGE_IN.paused = true;
    ['levelup-modal', 'chest-modal', 'pause-modal', 'boss-bar', 'math-banner', 'fever-badge', 'minimap-box', 'dash-btn', 'dash-btn-p2', 'coop-hud'].forEach(function (id) {
      if ($(id)) $(id).classList.add('hidden');
    });
    resetJoysticks();

    if (!fromVersus && vs && roundMode === 'online' && vs.finish(lastSnapshot.score, { correct: lastSnapshot.correct })) return;

    const prevUnlocked = countUnlockedHeroes();
    profile.runs += 1;
    profile.totalSolved = (profile.totalSolved || 0) + lastSnapshot.correct;
    profile.totalBossKills = (profile.totalBossKills || 0) + lastSnapshot.bossKills;
    if (won && roundMode !== 'practice') profile.wins = (profile.wins || 0) + 1;
    if (lastSnapshot.alchemistUnlockEligible) profile.alchemistUnlocked = true;
    if (roundMode === 'normal' && lastSnapshot.score > profile.bestScore) profile.bestScore = lastSnapshot.score;
    if (lastSnapshot.actIndex + 1 > profile.bestWave) profile.bestWave = lastSnapshot.actIndex + 1;
    const newUnlocks = evaluateAchievements(won);
    const newlyUnlockedClasses = countUnlockedHeroes() - prevUnlocked;
    saveProfile(profile);
    renderMyStats();

    if (roundMode === 'normal' && !submittedThisRound) {
      submittedThisRound = true;
      KAMPAI.submitScore(lastSnapshot.score, { mode: roundMode, stars: calcStars(lastSnapshot.score), correct: lastSnapshot.correct, wrong: lastSnapshot.wrong });
    }

    const displayScore = roundMode === 'coop_rival' ? Math.max(lastSnapshot.p1Score, lastSnapshot.p2Score) : lastSnapshot.score;
    const stars = calcStars(displayScore);
    const badgeMap = {
      practice: '🛡️ โหมดฝึกซ้อม (ไม่บันทึกคะแนน)',
      coop_team: '🤝 โหมดโคออฟ 2P ช่วยกัน',
      coop_rival: '⚔️ โหมดแข่งกัน 2P (120 วินาที)',
      normal: '⚔️ สรุปผลอารีนา 1P'
    };
    $('go-badge').textContent = badgeMap[roundMode] || '⚔️ สรุปผลอารีนา';
    if (roundMode === 'coop_rival') {
      $('go-title').textContent = causeText || '⚔️ จบการแข่งขัน 2P!';
      $('final-score').textContent = '🔵 ' + lastSnapshot.p1Score.toLocaleString() + '  vs  ' + lastSnapshot.p2Score.toLocaleString() + ' 🟠';
    } else {
      $('go-title').textContent = won ? '🏆 พิชิตอารีนาคณิตศาสตร์ครบ 3 องก์!' : '⚔️ จบการผจญภัย!';
      $('final-score').textContent = displayScore.toLocaleString();
    }
    $('go-stars').textContent = '☆☆☆'.split('').map(function (_s, i) { return i < stars ? '★' : '☆'; }).join('');
    $('go-summary').textContent = 'กำจัด ' + lastSnapshot.kills + ' ตัว · ตอบลูกแก้วถูก ' + lastSnapshot.correct + ' ข้อ · พลาด ' + lastSnapshot.wrong + ' ครั้ง · เลเวล ' + lastSnapshot.level + (lastSnapshot.evolutions ? ' · Evolution ' + lastSnapshot.evolutions : '');
    $('go-meta').innerHTML =
      '<div>🌱 <b>Seed:</b> #' + lastSnapshot.seed + ' · <b>แมพ:</b> ' + selectedMap + ' · <b>องก์ที่ถึง:</b> ' + (lastSnapshot.actIndex + 1) + '/3 · <b>ผลลัพธ์:</b> ' + (causeText || 'สิ้นสุดรอบ') + '</div>' +
      (newlyUnlockedClasses > 0 ? '<div>🎉 <b>ปลดล็อกอาชีพใหม่ +' + newlyUnlockedClasses + ' อาชีพ!</b></div>' : '') +
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
