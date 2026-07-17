/*!
 * KAMPAI Game SDK — เชื่อมเกม HTML เข้ากับระบบ kampai-school (หน้า /play wrapper)
 * โหลด: <script src="/games/kampai-sdk.js"></script>  (ก่อน game logic)
 * เอกสาร: /GAME-PROMPT.md + GAME.md
 *
 * ✅ ไฟล์เดียว = single source — อัปเดต SDK ที่นี่ที่เดียว ทุกเกมที่อ้างถึงได้ตามทันที
 * wire format (init / gameEnd / navigate) เหมือนเดิม → เกมเก่าไม่กระทบ
 */
(function () {
  // เกมไม่ควรถูก Service Worker ของ SPA คุมเลย — ถ้ามี SW เก่าค้างคุมหน้านี้อยู่ (เคยเล่นก่อน
  // games/** ถูกกันออกจาก precache) ให้ปลดทันที + รีโหลด 1 ครั้งเพื่อโหลดสดจาก network
  // (กัน "ต้องฮาร์ดรีเฟรชถึงเห็นของใหม่" แบบถาวร ไม่ต้องพึ่ง ?reset_sw=1)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function (regs) {
      if (!regs.length) return;
      var wasControlled = !!navigator.serviceWorker.controller;
      regs.forEach(function (r) { r.unregister(); });
      if (wasControlled && !sessionStorage.getItem('kampai_sw_unregistered')) {
        sessionStorage.setItem('kampai_sw_unregistered', '1');
        location.reload();
      }
    }).catch(function () {});
  }

  if (window.KAMPAI && window.KAMPAI.__real) return; // กันโหลด/ประกาศซ้ำ

  var IS_EMBED = window.self !== window.top ||
    new URLSearchParams(location.search).get('embed') === '1';
  var IS_TOUCH = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;

  var K = {
    __real: true,
    version: '1.0.0',
    isEmbed: IS_EMBED,
    isTouch: IS_TOUCH,
    ready: false,
    student: null,    // {id, code, displayName, photoUrl, classLabel}
    stats: null,      // {playsCount, personalBest, totalXp, level}
    leaderboard: [],  // [{rank, studentId, displayName, photoUrl, classLabel, personalBest, isMe}]
    classmates: [],   // [{id, studentCode, displayName, photoUrl, classNumber}]
    gameData: null,   // per-game data จาก wrapper (เช่น multiply-race.mastery)
    rpg: { state: null, _saveCbs: [] }, // persistent game state bridge (wrapper owns Supabase)
    character: null,  // sprite sheet จากคลังหลังบ้าน {sheetUrl, sheetUrlP2, fw, fh, frames}
    input: { up: false, down: false, left: false, right: false, a: false, b: false },
    _slug: null,
    _startTs: Date.now(),
    _readyCbs: [],
    _submitted: false,
    _online: { room: null, onJoined: null, onPresence: null, onEvent: null },
    hubUrl: '/h/nattapong',
  };

  // ─── lifecycle ──────────────────────────────────────────────────────────────
  function fireReady() {
    if (K.ready) return;
    K.ready = true;
    var cbs = K._readyCbs.slice(); K._readyCbs.length = 0;
    cbs.forEach(function (cb) { try { cb(K); } catch (e) { /* game cb error */ } });
  }

  /** ลงทะเบียน callback ที่จะรันเมื่อข้อมูลนักเรียน/leaderboard พร้อม (หรือทันทีถ้า standalone) */
  K.onReady = function (cb) {
    if (typeof cb !== 'function') return;
    if (K.ready) { try { cb(K); } catch (e) { /* */ } }
    else K._readyCbs.push(cb);
  };

  /** ตั้ง game slug (ต้องตรงกับ educational_hub_items.game_slug) */
  K.setSlug = function (slug) {
    K._slug = slug;
    if (!IS_EMBED) {
      try {
        var localRpg = localStorage.getItem('kampai_rpg_' + K._slug);
        if (localRpg) K.rpg.state = JSON.parse(localRpg);
      } catch (_) { /* */ }
    }
    return K;
  };

  /** Persistent RPG bridge: iframe sends state to wrapper; standalone uses local save only. */
  K.rpg.onSaved = function (cb) {
    if (typeof cb === 'function') K.rpg._saveCbs.push(cb);
    return K.rpg;
  };
  K.rpg.save = function (saveState, expectedVersion, idempotencyKey, events) {
    var payload = {
      state_version: Math.max(1, expectedVersion | 0) + (IS_EMBED ? 0 : 1),
      save_state: saveState,
      saved_at: new Date().toISOString(),
    };
    if (!IS_EMBED) {
      try { localStorage.setItem('kampai_rpg_' + (K._slug || 'game'), JSON.stringify(payload)); } catch (_) { /* */ }
      K.rpg.state = payload;
      K.rpg._saveCbs.forEach(function (cb) { try { cb(true, payload); } catch (_) { /* */ } });
      return true;
    }
    try {
      window.parent.postMessage({
        type: 'rpgSave',
        expectedVersion: Math.max(1, expectedVersion | 0),
        idempotencyKey: String(idempotencyKey || ''),
        state: saveState,
        events: Array.isArray(events) ? events.slice(0, 30) : [],
      }, '*');
      return true;
    } catch (_) { return false; }
  };

  /** ส่ง gameEnd postMessage จริง (internal — เรียกจาก submitScore เมื่อ K.student พร้อมแล้ว) */
  K._doSubmit = function (score, opts) {
    var metadata = {};
    for (var k in opts) {
      if (k === 'mode' || k === 'allowResubmit') continue;
      if (Object.prototype.hasOwnProperty.call(opts, k)) metadata[k] = opts[k];
    }
    if (metadata.duration == null)
      metadata.duration = Math.max(1, Math.floor((Date.now() - K._startTs) / 1000));
    try {
      window.parent.postMessage({
        type: 'gameEnd',
        gameSlug: K._slug,
        studentCode: K.student.code,
        score: Math.round(Number(score) || 0),
        mode: opts.mode || 'normal',
        metadata: metadata,
      }, '*');
      return true;
    } catch (e) { console.warn('[KAMPAI] submitScore postMessage failed', e); return false; }
  };

  /** ส่งคะแนนตอนจบเกม — เรียกครั้งเดียวต่อรอบ. opts: { mode, ...metadata } */
  K.submitScore = function (score, opts) {
    opts = opts || {};
    if (!IS_EMBED) return false;        // standalone → no-op (ทดสอบได้)
    if (K._submitted && opts.allowResubmit !== true) return false;
    K._submitted = true;
    if (!K.student) {
      // เกมจบเร็วมาก (race) ก่อน init message มาถึง → คิวไว้ ส่งจริงตอน onReady (bound by setTimeout(fireReady,1200) ด้านล่าง)
      console.warn('[KAMPAI] submitScore called before student ready — queued until onReady');
      K.onReady(function () {
        if (!K.student) { console.warn('[KAMPAI] submitScore dropped — no student after ready'); return; }
        K._doSubmit(score, opts);
      });
      return true;
    }
    return K._doSubmit(score, opts);
  };

  /** เริ่มรอบใหม่ (ปุ่ม "เล่นอีกครั้ง") — รีเซ็ต gate ส่งคะแนน + แจ้ง wrapper (PlayGame รีเซ็ต sessionSubmittedRef) */
  K.beginRound = function () {
    K._submitted = false;
    K._startTs = Date.now();
    if (IS_EMBED) {
      try { window.parent.postMessage({ type: 'gameStart' }, '*'); } catch (e) { /* */ }
    }
    return K;
  };

  /** กลับหน้าหลัก (iframe-safe) */
  K.goHome = function () {
    var home = K.hubUrl || '/h/nattapong';
    if (IS_EMBED) { try { window.parent.postMessage({ type: 'navigate', to: home }, '*'); } catch (e) { /* */ } }
    else { window.location.href = home; }
  };
  K.exit = K.goHome;

  /** โหลด sprite sheet จาก K.character (คลังหลังบ้าน) — คืน { primary, secondary } */
  var DEFAULT_CHAR_ANIM = {
    preset: 'grid-3x6-18',
    layout: 'grid',
    cols: 6,
    rows: 3,
    idle: [12, 13, 14, 15, 16, 17],
    walk: [12, 13, 14, 15, 16, 17],
    run: [0, 1, 2, 3, 4, 5],
    jump: [6, 7, 8, 9, 10, 11],
    hurt: 12,
    happy: 12,
    runFaces: 'left',
    anchorFoot: 0.94,
    feetPad: 14,
  };

  /** ตำแหน่ง crop เฟรมบน sheet (รองรับ grid + horizontal) */
  K.characterFrameRect = function (frameIndex, cfg) {
    cfg = cfg || K.character || {};
    var anim = cfg.anim || DEFAULT_CHAR_ANIM;
    var fw = cfg.fw || 128;
    var fh = cfg.fh || 128;
    if (anim.layout === 'grid' && anim.cols) {
      var col = frameIndex % anim.cols;
      var row = Math.floor(frameIndex / anim.cols);
      return { sx: col * fw, sy: row * fh, fw: fw, fh: fh };
    }
    return { sx: frameIndex * fw, sy: 0, fw: fw, fh: fh };
  };

  /** เลือก index เฟรมจากสถานะผู้เล่น + animation config (K.character.anim) */
  K.pickCharacterFrame = function (p, opt) {
    opt = opt || {};
    var anim = opt.anim || (K.character && K.character.anim) || DEFAULT_CHAR_ANIM;
    var runSpeed = opt.runSpeed != null ? opt.runSpeed : 4.5;
    var animTime = p.animTime || 0;
    var state = p.state || 'idle';

    function fps(pose) {
      if (anim.poseFps && anim.poseFps[pose] != null) return anim.poseFps[pose];
      if (pose === 'walk') return anim.walkFps != null ? anim.walkFps : 5;
      if (pose === 'run') return anim.runFps != null ? anim.runFps : 10;
      if (pose === 'jump') return anim.jumpFps != null ? anim.jumpFps : 8;
      return 4;
    }
    function getPose(pose) {
      if (pose === 'idle') return anim.idle;
      if (pose === 'walk') return anim.walk;
      if (pose === 'run') return anim.run;
      if (pose === 'jump') return anim.jump;
      if (pose === 'hurt') return anim.hurt;
      if (pose === 'happy') return anim.happy;
      return anim.extras && anim.extras[pose] != null ? anim.extras[pose] : null;
    }
    function pick(frames, f, jumpOpt) {
      if (frames == null) return null;
      if (Array.isArray(frames)) {
        if (!frames.length) return null;
        if (frames.length === 1) return frames[0];
        return frames[Math.floor(animTime * (f / 10)) % frames.length];
      }
      if (typeof frames === 'number') return frames;
      var vy = jumpOpt && jumpOpt.vy != null ? jumpOpt.vy : 0;
      if (vy < (jumpOpt && jumpOpt.vyJumpUp != null ? jumpOpt.vyJumpUp : -3.5)) return frames.up;
      if (vy > (jumpOpt && jumpOpt.vyJumpFall != null ? jumpOpt.vyJumpFall : 2.5)) return frames.fall;
      return frames.peak;
    }

    var PRIORITY = [
      'death', 'hurt', 'happy', 'emote', 'special', 'spawn',
      'attackHeavy', 'attack', 'block', 'dodge',
      'slide', 'wallSlide', 'climb', 'crouch', 'crawl', 'sit', 'sleep',
      'land', 'fall', 'jump',
    ];
    for (var i = 0; i < PRIORITY.length; i++) {
      if (state !== PRIORITY[i]) continue;
      var pf = pick(getPose(PRIORITY[i]), fps(PRIORITY[i]), { vy: p.vy, vyJumpUp: opt.vyJumpUp, vyJumpFall: opt.vyJumpFall });
      if (pf != null) return pf;
    }

    if (!p.onGround || state === 'jump') {
      var landF = pick(getPose('land'), fps('land'));
      if (state === 'land' && landF != null) return landF;
      var fallF = pick(getPose('fall'), fps('fall'));
      if (p.onGround === false && p.vy > (opt.vyJumpFall != null ? opt.vyJumpFall : 2.5) && fallF != null) return fallF;
      var jf = pick(getPose('jump'), fps('jump'), { vy: p.vy, vyJumpUp: opt.vyJumpUp, vyJumpFall: opt.vyJumpFall });
      if (jf != null) return jf;
    }
    if (state === 'run' || Math.abs(p.vx || 0) > runSpeed * 0.55) {
      var rf = pick(getPose('run'), fps('run'));
      if (rf != null) return rf;
    }
    var facing = p.facing;
    if (!facing && (Math.abs(p.vx || 0) > 0.15 || Math.abs(p.vy || 0) > 0.15)) {
      var ax = Math.abs(p.vx || 0), ay = Math.abs(p.vy || 0);
      if (ax >= ay) facing = (p.vx || 0) >= 0 ? 'right' : 'left';
      else facing = (p.vy || 0) >= 0 ? 'down' : 'up';
    }
    if (facing && anim.directions && anim.directions[facing] && anim.directions[facing].length) {
      var df = pick(anim.directions[facing], fps('walk'));
      if (df != null && (Math.abs(p.vx || 0) > 0.15 || Math.abs(p.vy || 0) > 0.15 || state === 'walk' || state === 'run')) return df;
    }
    if (Math.abs(p.vx || 0) > 0.15) {
      var wf = pick(getPose('walk'), fps('walk'));
      if (wf != null) return wf;
    }
    var idf = pick(getPose('idle'), fps('idle'));
    if (idf != null) return idf;
    return 0;
  };

  /** แปลง state ผู้เล่น → ท่า สำหรับจุดเท้า */
  K.poseKeyFromPlayerState = function (p, opt) {
    opt = opt || {};
    var runSpeed = opt.runSpeed != null ? opt.runSpeed : 4.5;
    var state = p.state || 'idle';
    var map = [
      'death', 'hurt', 'happy', 'emote', 'special', 'spawn',
      'attackHeavy', 'attack', 'block', 'dodge',
      'slide', 'wallSlide', 'climb', 'crouch', 'crawl', 'sit', 'sleep',
      'land', 'fall', 'jump',
    ];
    for (var i = 0; i < map.length; i++) {
      if (state === map[i]) return map[i];
    }
    if (!p.onGround || state === 'jump') {
      if (state === 'land') return 'land';
      if (p.vy != null && p.vy > 2.5) return 'fall';
      return 'jump';
    }
    if (state === 'run' || Math.abs(p.vx || 0) > runSpeed * 0.55) return 'run';
    if (Math.abs(p.vx || 0) > 0.15) return 'walk';
    return 'idle';
  };

  /** จุดเท้าแยกตามท่า — poseAnchors[pose] ก่อน แล้ว fallback global */
  K.resolveFootAnchor = function (anim, pose) {
    anim = anim || DEFAULT_CHAR_ANIM;
    var globalFoot = anim.anchorFoot != null ? anim.anchorFoot : 0.94;
    var globalPad = anim.feetPad != null ? anim.feetPad : 0;
    var o = anim.poseAnchors && anim.poseAnchors[pose];
    return {
      anchorFoot: (o && o.anchorFoot != null) ? o.anchorFoot : globalFoot,
      feetPad: (o && o.feetPad != null) ? o.feetPad : globalPad,
    };
  };

  /** Recolor sprite — palette slots + luminance shading */
  function _hexToRgb(hex) {
    var h = String(hex || '').replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16) || 0;
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
  }
  function _pxLum(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }
  function _colorDist(r, g, b, tr, tg, tb) {
    return Math.max(Math.abs(r - tr), Math.abs(g - tg), Math.abs(b - tb));
  }
  function _effectiveColorSlots(cfg, player) {
    if (!cfg || !cfg.slots) return [];
    if (player === 2 && cfg.slotsP2 && cfg.slotsP2.length) {
      return cfg.slotsP2.filter(function (s) { return s.enabled !== false; });
    }
    return (cfg.slots || []).filter(function (s) { return s.enabled !== false; });
  }
  function _recolorRgb(r, g, b, slots) {
    if (!slots.length) return [r, g, b];
    var best = null, bestD = Infinity;
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i];
      if (s.enabled === false) continue;
      var tol = s.tolerance != null ? s.tolerance : 18;
      var d = _colorDist(r, g, b, s.source.r, s.source.g, s.source.b);
      if (d <= tol && d < bestD) { bestD = d; best = s; }
    }
    if (!best) return [r, g, b];
    var srcL = _pxLum(best.source.r, best.source.g, best.source.b) || 1;
    var pxL = _pxLum(r, g, b);
    var ratio = Math.max(0.35, Math.min(1.65, pxL / srcL));
    var t = _hexToRgb(best.target);
    return [
      Math.max(0, Math.min(255, Math.round(t.r * ratio))),
      Math.max(0, Math.min(255, Math.round(t.g * ratio))),
      Math.max(0, Math.min(255, Math.round(t.b * ratio))),
    ];
  }
  function _applyColorToCanvas(ctx, colorCfg, player) {
    var slots = _effectiveColorSlots(colorCfg, player);
    if (!slots.length) return;
    var w = ctx.canvas.width, h = ctx.canvas.height;
    var img = ctx.getImageData(0, 0, w, h), d = img.data;
    for (var i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 8) continue;
      var nr = _recolorRgb(d[i], d[i + 1], d[i + 2], slots);
      d[i] = nr[0]; d[i + 1] = nr[1]; d[i + 2] = nr[2];
    }
    ctx.putImageData(img, 0, 0);
  }
  function _loadRecoloredImg(src, colorCfg, player) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () {
        var slots = _effectiveColorSlots(colorCfg, player);
        if (!slots.length) { resolve(img); return; }
        var canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        var ctx = canvas.getContext('2d');
        if (!ctx) { resolve(img); return; }
        ctx.drawImage(img, 0, 0);
        _applyColorToCanvas(ctx, colorCfg, player);
        var out = new Image();
        out.onload = function () { resolve(out); };
        out.onerror = reject;
        out.src = canvas.toDataURL('image/png');
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  K.loadCharacterSheets = function () {
    var c = K.character;
    if (!c || !c.sheetUrl) return Promise.resolve({ primary: null, secondary: null });
    var colorCfg = c.color || null;
    var p1Slots = _effectiveColorSlots(colorCfg, 1);
    var p2HasOwn = colorCfg && colorCfg.slotsP2 && colorCfg.slotsP2.length;
    var p1 = p1Slots.length
      ? _loadRecoloredImg(c.sheetUrl, colorCfg, 1)
      : _loadRecoloredImg(c.sheetUrl, null, 1);
    var p2 = c.sheetUrlP2
      ? (p2HasOwn || c.sheetUrlP2 === c.sheetUrl || !p1Slots.length
          ? _loadRecoloredImg(c.sheetUrlP2, colorCfg, p2HasOwn ? 2 : 1)
          : _loadRecoloredImg(c.sheetUrlP2, null, 2))
      : Promise.resolve(null);
    return Promise.all([p1, p2]).then(function (r) { return { primary: r[0], secondary: r[1] }; })
      .catch(function () { return { primary: null, secondary: null }; });
  };

  // ─── ผลรอบเล่น (XP/เลเวล/เหรียญ) จาก wrapper → ฝังลงจอจบของเกม (จอเดียว ไม่มีการ์ดลอยซ้ำ) ──
  K.lastResult = null;
  K._onResult = null;
  /** เกมที่อยากเรนเดอร์ XP เอง: KAMPAI.onResult(function(result, info){...}) → SDK จะไม่ฉีดให้ */
  K.onResult = function (cb) { K._onResult = (typeof cb === 'function') ? cb : null; return K; };
  /** ฉีดแถบ XP/เลเวล/เหรียญ ลง #kampai-result (หรือจอจบที่ตรวจพบ) แล้ว ack กลับ wrapper เพื่อไม่ให้เด้งการ์ดลอย */
  K.showResult = function (info) {
    info = info || {}; var res = info.result || {};
    var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    var slot = document.getElementById('kampai-result');
    if (!slot) {
      // ไม่มี slot มาตรฐาน → ลองหาจอจบที่กำลังแสดง (best-effort) แล้วแทรกแถบบนสุด
      var ids = ['kampai-result', 'gameover-screen', 'gameover', 'over', 'gameover-modal', 'game-over', 'gameOver'];
      var host = null;
      for (var i = 0; i < ids.length; i++) {
        var el = document.getElementById(ids[i]);
        if (el) { try { if (getComputedStyle(el).display !== 'none') { host = el; break; } } catch (e) { host = el; break; } }
      }
      if (!host) return false;   // หาจอจบไม่เจอ → ไม่ ack (ปล่อย wrapper เด้งการ์ด XP ลอยตามเดิม = backward-safe)
      slot = document.createElement('div'); slot.id = 'kampai-result';
      if (host.firstChild) host.insertBefore(slot, host.firstChild); else host.appendChild(slot);
    }
    var xp = res.xp_earned || 0, total = res.total_xp || 0, lvl = (info.level != null ? info.level : (res.level || 0));
    var medals = '';
    if (res.unlocked && res.unlocked.length) {
      medals = '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:8px">' +
        res.unlocked.map(function (u) {
          var ic = (u.icon && !/^[A-Za-z]/.test(u.icon)) ? u.icon : '🏅';
          return '<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,215,0,.15);border:1px solid rgba(255,215,0,.4);border-radius:999px;padding:3px 10px;font-size:12px;color:#fde68a;font-weight:600">' + ic + ' ' + esc(u.title || '') + '</span>';
        }).join('') + '</div>';
    }
    var levelUp = info.leveledUp ? '<div style="margin-top:6px;font-size:13px;font-weight:700;color:#fde68a">🎉 เลเวลอัพ! → Lv.' + lvl + '</div>' : '';
    slot.style.display = '';
    slot.innerHTML =
      '<div style="margin:10px auto;max-width:360px;background:linear-gradient(135deg,rgba(255,215,0,.13),rgba(245,158,11,.05));border:2px solid rgba(255,215,0,.45);border-radius:16px;padding:11px 16px;text-align:center;font-family:Sarabun,Kanit,system-ui,sans-serif">' +
        '<div style="font-size:26px;font-weight:800;color:#FFD700;line-height:1.05">+' + xp.toLocaleString('th-TH') + ' XP</div>' +
        '<div style="font-size:12px;color:#cbd5e1;margin-top:2px">รวม ' + total.toLocaleString('th-TH') + ' XP · Lv.' + lvl + '</div>' +
        levelUp + medals +
      '</div>';
    try { window.parent.postMessage({ type: 'resultShown' }, '*'); } catch (e) { /* */ }
    return true;
  };

  // ─── init listener (รับข้อมูลจาก /play wrapper) ──────────────────────────────
  if (IS_EMBED) {
    window.addEventListener('message', function (e) {
      var d = e && e.data;
      if (!d || d.type !== 'init') return;
      if (typeof d.studentCode === 'string') {
        var s = d.student || {};
        var name = s.displayName || d.displayName || '';
        K.student = {
          id: s.id || null,
          code: d.studentCode,
          displayName: name,
          name: name,
          photoUrl: s.photoUrl || null,
          classLabel: s.classLabel || null,
        };
      }
      if (d.stats) K.stats = {
        playsCount: d.stats.playsCount | 0,
        personalBest: d.stats.personalBest | 0,
        totalXp: d.stats.totalXp | 0,
        level: d.stats.level | 0,
      };
      if (Array.isArray(d.leaderboard)) K.leaderboard = d.leaderboard;
      if (Array.isArray(d.classmates)) K.classmates = d.classmates;
      if (d.pet === null || (d.pet && typeof d.pet === 'object')) K.pet = d.pet;
      if (d.wallet && typeof d.wallet === 'object') {
        K.wallet = { starCoins: Math.max(0, d.wallet.starCoins | 0) };
      }
      if (d.gameData && typeof d.gameData === 'object') {
        K.gameData = d.gameData;
        if (d.gameData.rpg && typeof d.gameData.rpg === 'object') K.rpg.state = d.gameData.rpg;
      }
      if (d.blueprint && typeof d.blueprint === 'object') K.blueprint = d.blueprint;
      else if (d.gameData && d.gameData.blueprint) K.blueprint = d.gameData.blueprint;
      if (d.character && typeof d.character === 'object' && d.character.sheetUrl) {
        K.character = d.character;
        if (!K.character.anim) K.character.anim = DEFAULT_CHAR_ANIM;
      }
      if (d.audio && K.sound) {   // เพลงรายเกมจากหลังบ้าน: mp3 อัปโหลด (ก่อน) > synth preset
        if (d.audio.bgmUrl) { _bgmFromInit = true; K.sound.setBgmUrl(d.audio.bgmUrl); }
        else if (d.audio.bgm) { _bgmFromInit = true; K.sound.setBgm(d.audio.bgm); }
      }
      if (typeof d.hubUrl === 'string' && d.hubUrl.startsWith('/')) K.hubUrl = d.hubUrl;
      K._submitted = false;
      K._startTs = Date.now();
      fireReady();
    });
    // ─── online relay: รับ event ห้องจาก wrapper (broadcast/presence) ─────────
    window.addEventListener('message', function (e) {
      var d = e && e.data; if (!d || !d.type) return;
      var o = K._online;
      if (d.type === 'rtJoined') { o.room = d.room; if (o.onJoined) try { o.onJoined(d.room); } catch (x) { /* */ } }
      else if (d.type === 'rtPresence') { if (o.onPresence) try { o.onPresence(d.members || []); } catch (x) { /* */ } }
      else if (d.type === 'rtEvent') { if (o.onEvent) try { o.onEvent(d.event, d.payload, d.fromKey); } catch (x) { /* */ } }
      else if (d.type === 'gameResult') {   // ผล XP กลับจาก wrapper → ฝังลงจอจบของเกม
        K.lastResult = d.result || null;
        K._submitted = false;   // บันทึกรอบนี้เสร็จแล้ว → พร้อม submitScore รอบถัดไป (เกมที่ไม่ยิง gameStart)
        if (K._onResult) { try { K._onResult(d.result, d); } catch (x) { /* */ } }
        else { try { K.showResult(d); } catch (x) { /* */ } }
      }
      else if (d.type === 'rpgSaveResult') {
        if (d.rpg && typeof d.rpg === 'object') K.rpg.state = d.rpg;
        K.rpg._saveCbs.forEach(function (cb) { try { cb(!!d.ok, d.rpg || null); } catch (x) { /* */ } });
      }
    });
    // anchor target="_top" → navigate ผ่าน wrapper (iframe sandbox ห้าม top-nav)
    document.addEventListener('click', function (e) {
      var a = e.target && e.target.closest && e.target.closest('a[target="_top"]');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href) return;
      e.preventDefault();
      try { window.parent.postMessage({ type: 'navigate', to: href }, '*'); } catch (_) { /* */ }
    });
    // กันค้าง: ถ้า init ไม่มาภายใน 1.2s (เช่นเปิดใน iframe โดยไม่มี wrapper) → ready ด้วยข้อมูลว่าง
    setTimeout(fireReady, 1200);
  } else {
    // เปิดไฟล์ตรง ๆ (dev/standalone) → ready ทันที (student/leaderboard ว่าง)
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fireReady);
    else fireReady();
  }

  // ─── mobile on-screen controls (D-pad + action buttons) ──────────────────────
  // touch + keyboard เขียน K.input state เดียวกัน (pattern จาก math-jumper.html)
  function press(name, val, onTap) {
    K.input[name] = val;
    if (val && onTap) { try { onTap(name); } catch (e) { /* */ } }
  }
  function bindHold(el, name, onTap) {
    var down = function (e) { e.preventDefault(); press(name, true, onTap); el.classList.add('active'); };
    var up = function (e) { if (e) e.preventDefault(); press(name, false); el.classList.remove('active'); };
    el.addEventListener('touchstart', down, { passive: false });
    el.addEventListener('touchend', up); el.addEventListener('touchcancel', up);
    el.addEventListener('mousedown', down); el.addEventListener('mouseup', up); el.addEventListener('mouseleave', up);
  }
  function buildDpad() {
    var d = document.createElement('div'); d.className = 'kampai-dpad';
    ['up', 'left', 'right', 'down'].forEach(function (dir) {
      var b = document.createElement('button'); b.type = 'button';
      b.className = 'kpad kpad-' + dir;
      b.innerHTML = { up: '▲', down: '▼', left: '◀', right: '▶' }[dir];
      bindHold(b, dir); d.appendChild(b);
    });
    return d;
  }
  function buildButtons(names, onTap) {
    var g = document.createElement('div'); g.className = 'kampai-actions';
    names.forEach(function (n) {
      var b = document.createElement('button'); b.type = 'button';
      b.className = 'kbtn kbtn-' + n; b.textContent = String(n).toUpperCase();
      bindHold(b, n, onTap); g.appendChild(b);
    });
    return g;
  }
  function injectStyle() {
    if (document.getElementById('kampai-controls-css')) return;
    var s = document.createElement('style'); s.id = 'kampai-controls-css';
    s.textContent =
      '.kampai-controls{position:fixed;left:0;right:0;bottom:max(12px,env(safe-area-inset-bottom));display:flex;justify-content:space-between;align-items:flex-end;padding:0 16px;pointer-events:none;z-index:99999}' +
      '.kampai-dpad{display:grid;grid-template-columns:repeat(3,52px);grid-template-rows:repeat(3,52px);grid-template-areas:". up ." "left . right" ". down .";gap:6px;pointer-events:auto}' +
      '.kpad-up{grid-area:up}.kpad-down{grid-area:down}.kpad-left{grid-area:left}.kpad-right{grid-area:right}' +
      '.kampai-actions{display:flex;gap:14px;pointer-events:auto}' +
      '.kpad,.kbtn{border:none;color:#fff;background:rgba(15,23,42,.55);box-shadow:0 2px 10px rgba(0,0,0,.35);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);touch-action:none;-webkit-user-select:none;user-select:none;font-size:22px;line-height:1}' +
      '.kpad{border-radius:12px}.kbtn{width:66px;height:66px;border-radius:50%;font-weight:800;font-size:20px}' +
      '.kpad.active,.kbtn.active{background:rgba(251,191,36,.85);color:#0f172a}';
    document.head.appendChild(s);
  }

  K.controls = {
    /**
     * mount({ dpad=true, buttons=['a'], onTap, keyboard=true, force })
     * - desktop: ผูกคีย์บอร์ด (Arrow/WASD/Space/Enter) → K.input
     * - touch: render overlay D-pad + ปุ่ม action (เว้นแต่ force:false)
     */
    mount: function (opts) {
      opts = opts || {};
      if (opts.keyboard !== false) {
        var KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right', ' ': 'a', Enter: 'b' };
        window.addEventListener('keydown', function (e) { var m = KEYMAP[e.key]; if (m) { K.input[m] = true; if (m === 'a' || m === 'b') { if (opts.onTap) try { opts.onTap(m); } catch (x) { /* */ } } } });
        window.addEventListener('keyup', function (e) { var m = KEYMAP[e.key]; if (m) K.input[m] = false; });
      }
      var showOverlay = opts.force === true || (IS_TOUCH && opts.force !== false);
      if (!showOverlay) return K;
      var go = function () {
        injectStyle();
        var wrap = document.createElement('div'); wrap.className = 'kampai-controls';
        if (opts.dpad !== false) wrap.appendChild(buildDpad());
        wrap.appendChild(buildButtons(opts.buttons || ['a'], opts.onTap));
        document.body.appendChild(wrap);
      };
      if (document.body) go(); else document.addEventListener('DOMContentLoaded', go);
      return K;
    },
  };

  // ─── online multiplayer (wrapper รีเลย์ Supabase Realtime ผ่าน postMessage) ───
  // เกมเรียก: KAMPAI.online.join(code,{onJoined,onPresence,onEvent}); .send(ev,data); .leave()
  // wrapper เปิด channel 'live:<slug>:<code>' (broadcast+presence) — เกมไม่ต้องมี anon key
  function parentMsg(obj) { if (IS_EMBED) { try { window.parent.postMessage(obj, '*'); } catch (e) { /* */ } } }
  K.online = {
    available: IS_EMBED,
    /** สุ่มรหัสห้อง 4 หลัก (1000–9999) */
    makeCode: function () { return String(1000 + Math.floor(Math.random() * 9000)); },
    /** เข้าห้อง room (string) + ลงทะเบียน handler. meta presence ดึงจาก KAMPAI.student อัตโนมัติ */
    join: function (room, handlers) {
      handlers = handlers || {};
      K._online = {
        room: String(room),
        onJoined: handlers.onJoined || null,
        onPresence: handlers.onPresence || null,
        onEvent: handlers.onEvent || null,
      };
      var s = K.student || {};
      var meta = { id: s.id || null, name: s.displayName || '', photoUrl: s.photoUrl || null, classLabel: s.classLabel || null };
      parentMsg({ type: 'rtJoin', room: String(room), meta: meta });
      return K.online;
    },
    /** ส่ง event ให้ทุกคนในห้อง (broadcast) */
    send: function (event, payload) { parentMsg({ type: 'rtSend', event: event, payload: payload }); return K.online; },
    /** ออกจากห้อง */
    leave: function () { parentMsg({ type: 'rtLeave' }); K._online = { room: null, onJoined: null, onPresence: null, onEvent: null }; return K.online; },
  };

  // ═══ AUDIO — SFX(synth) + TTS + BGM + ปุ่มเปิด/ปิด (single source ทุกเกมใช้ร่วม) ═══
  // เกมเรียก: KAMPAI.sound.mountToggles(); .defaultBgm('calm'); + correct()/wrong()/timeUp()/
  // gameOver()/speak(text,lang)/stopSpeak()/fxFlash(good)/bgmStart()/bgmStop()/unlock()
  // เพลงรายเกมตั้งจากหลังบ้านได้: wrapper ส่ง init.audio.bgm → override default ของเกม
  var _sfxOn = localStorage.getItem('mr_sfx') !== '0';
  var _ttsOn = localStorage.getItem('mr_tts') !== '0';
  var _bgmOn = localStorage.getItem('mr_bgm') !== '0';
  var _voiceMode = (function(){ var v = localStorage.getItem('mr_voice_mode'); return (v==='th'||v==='both') ? v : 'en'; })();
  var _actx = null, _thaiVoice = null, _enVoice = null;
  var _bgmTimer = null, _bgmGain = null, _bgmStep = 0, _bgmFromInit = false, _fxEl = null;
  var _bgmUrl = null, _bgmAudio = null;   // เพลงอัปโหลด (mp3) — ถ้ามี = เล่นแทน synth
  var BGM_PRESETS = {
    none:     null,
    cheerful: { root: 261.63, bpm: 104, wave: 'triangle' },   // C สดใส
    calm:     { root: 293.66, bpm: 88,  wave: 'sine' },        // D นุ่ม สงบ
    warm:     { root: 220.00, bpm: 96,  wave: 'triangle' },    // A อุ่น
    playful:  { root: 329.63, bpm: 110, wave: 'triangle' },    // E สดใส
    bright:   { root: 349.23, bpm: 100, wave: 'triangle' },    // F
    mellow:   { root: 196.00, bpm: 82,  wave: 'sine' },        // G ช้า ผ่อนคลาย
  };
  var _bgmCfg = BGM_PRESETS.cheerful;
  var BGM_PROG = [[0,4,7,12],[7,11,14,19],[9,12,16,21],[5,9,12,17]];

  function _ac() { try { if (!_actx) { var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null; _actx = new AC(); } if (_actx.state === 'suspended') _actx.resume(); } catch (e) { return null; } return _actx; }
  function _blip(freq, t0, dur, vol, type) { var c = _actx; if (!c) return; var o = c.createOscillator(), g = c.createGain(); o.type = type || 'sine'; o.frequency.value = freq; g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + dur + 0.02); }
  function _note(freq, off, dur, vol) { var t0 = _actx.currentTime + off; _blip(freq, t0, dur, vol, 'sine'); _blip(freq * 2, t0, dur * 0.7, vol * 0.35, 'sine'); }
  function _vscore(v) { return (/(google|natural|enhanced|premium|neural|siri)/i.test(v.name) ? 2 : 0) + (v.localService === false ? 1 : 0); }
  function _bestVoice(prefix) { try { var vs = window.speechSynthesis.getVoices().filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf(prefix) === 0; }); if (!vs.length) return null; vs.sort(function (a, b) { return _vscore(b) - _vscore(a); }); return vs[0]; } catch (e) { return null; } }
  function _pickVoices() { _thaiVoice = _bestVoice('th'); _enVoice = _bestVoice('en'); }
  if ('speechSynthesis' in window) { _pickVoices(); try { window.speechSynthesis.onvoiceschanged = _pickVoices; } catch (e) { /* */ } }
  function _bgmEnsure() { if (!_ac()) return null; if (!_bgmGain) { _bgmGain = _actx.createGain(); _bgmGain.gain.value = 0.0001; var lp = _actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2000; _bgmGain.connect(lp); lp.connect(_actx.destination); } return _bgmGain; }
  function _bgmNote(freq, t, dur, vol, wave) { var o = _actx.createOscillator(), g = _actx.createGain(); o.type = wave; o.frequency.value = freq; g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); o.connect(g); g.connect(_bgmGain); o.start(t); o.stop(t + dur + 0.02); }
  function _bgmTick() { if (!_bgmCfg || !_bgmEnsure()) return; var SPC = 8, chord = BGM_PROG[Math.floor(_bgmStep / SPC) % BGM_PROG.length], w = _bgmStep % SPC, t = _actx.currentTime; if (w === 0) _bgmNote(_bgmCfg.root * Math.pow(2, (chord[0] - 12) / 12), t, 0.55, 0.6, 'sine'); _bgmNote(_bgmCfg.root * Math.pow(2, chord[w % chord.length] / 12), t, 0.28, 0.4, _bgmCfg.wave); _bgmStep++; }
  function _ensureFx() { if (_fxEl && _fxEl.isConnected) return _fxEl; _fxEl = document.getElementById('kampai-fx'); if (!_fxEl && document.body) { _fxEl = document.createElement('div'); _fxEl.id = 'kampai-fx'; document.body.appendChild(_fxEl); } return _fxEl; }
  function _injectCss() { if (document.getElementById('kampai-sound-css')) return; var s = document.createElement('style'); s.id = 'kampai-sound-css'; s.textContent =
    '#kampai-snd{position:fixed;top:auto;bottom:max(10px,env(safe-area-inset-bottom));right:max(10px,env(safe-area-inset-right));left:auto;z-index:40;display:flex;gap:6px;flex-wrap:nowrap;pointer-events:auto}' +
    '.ksnd{width:40px;height:40px;border:none;border-radius:50%;cursor:pointer;font-size:17px;line-height:1;background:rgba(15,23,42,.55);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);box-shadow:0 2px 8px rgba(0,0,0,.35);transition:opacity .15s,transform .1s;color:#fff;padding:0;font-family:inherit}' +
    '#kbtn-voice{width:auto;min-width:56px;padding:0 10px;border-radius:20px;font-size:12px;font-weight:700;letter-spacing:.02em}' +
    '@media (pointer:coarse){.ksnd{width:36px;height:36px;font-size:15px}#kbtn-voice{min-width:48px;font-size:11px;padding:0 7px}}' +
    '@media (pointer:coarse) and (orientation:landscape){#kampai-snd{bottom:max(8px,env(safe-area-inset-bottom));right:max(8px,env(safe-area-inset-right));gap:4px}.ksnd{width:32px;height:32px;font-size:13px}#kbtn-voice{min-width:40px;font-size:10px;padding:0 5px}}' +
    '.ksnd:active{transform:scale(.9)}.ksnd.off{opacity:.4}' +
    '#kampai-fx{position:fixed;inset:0;pointer-events:none;opacity:0;z-index:25;transition:opacity .12s ease}' +
    '#kampai-fx.good{opacity:1;background:radial-gradient(circle at 50% 60%,rgba(34,197,94,.28),transparent 65%)}' +
    '#kampai-fx.bad{opacity:1;background:radial-gradient(circle at 50% 60%,rgba(239,68,68,.30),transparent 65%)}';
    (document.head || document.documentElement).appendChild(s); }
  function _updateBtns() {
    [['kbtn-sfx', _sfxOn, '🔊'], ['kbtn-tts', _ttsOn, '🗣️'], ['kbtn-bgm', _bgmOn, '🎵']].forEach(function (d) { var el = document.getElementById(d[0]); if (el) { el.textContent = d[1] ? d[2] : '🔇'; el.classList.toggle('off', !d[1]); } });
    var vEl = document.getElementById('kbtn-voice');
    if (vEl) { vEl.textContent = _voiceMode === 'th' ? '🌐 TH' : _voiceMode === 'both' ? '🌐 EN+TH' : '🌐 EN'; vEl.classList.toggle('off', !_ttsOn); }
  }

  var Sound = {
    available: true,
    unlock: function () { _ac(); return Sound; },
    correct: function () { if (!_sfxOn || !_ac()) return; [[784, 0], [988, 0.07], [1319, 0.14]].forEach(function (a) { _note(a[0], a[1], 0.22, 0.16); }); },
    wrong: function () { if (!_sfxOn || !_ac()) return; var t = _actx.currentTime; _blip(311, t, 0.18, 0.17, 'triangle'); _blip(233, t + 0.12, 0.26, 0.17, 'triangle'); },
    timeUp: function () { if (!_sfxOn || !_ac()) return; var t = _actx.currentTime; _blip(196, t, 0.34, 0.16, 'triangle'); _blip(146, t + 0.18, 0.40, 0.16, 'triangle'); },
    gameOver: function () { if (!_sfxOn || !_ac()) return; [[523, 0], [659, 0.14], [784, 0.28], [1047, 0.42]].forEach(function (a) { _note(a[0], a[1], 0.34, 0.15); }); },
    speak: function (text, lang, interrupt) { if (!_ttsOn || !('speechSynthesis' in window)) return; try { if (interrupt) { window.speechSynthesis.cancel(); } else if (window.speechSynthesis.speaking || window.speechSynthesis.pending) { return; } var isEn = !!(lang && lang.toLowerCase().indexOf('en') === 0); var u = new SpeechSynthesisUtterance(text); u.lang = lang || 'th-TH'; u.rate = isEn ? 0.85 : 0.92; u.pitch = 1.06; var v = isEn ? _enVoice : _thaiVoice; if (v) u.voice = v; if (interrupt) { setTimeout(function () { try { window.speechSynthesis.speak(u); } catch (e) { /* */ } }, 90); } else { window.speechSynthesis.speak(u); } } catch (e) { /* */ } },
    getVoiceMode: function () { return _voiceMode; },
    setVoiceMode: function (m) { if (m === 'en' || m === 'th' || m === 'both') { _voiceMode = m; try { localStorage.setItem('mr_voice_mode', m); } catch (e) { /* */ } _updateBtns(); } },
    speakBilingual: function (enText, thText, opts) {
      opts = opts || {};
      var done = typeof opts.onDone === 'function' ? opts.onDone : function () {};
      if (!_ttsOn || !('speechSynthesis' in window)) { done(); return; }
      var mode = (opts.force === 'en' || opts.force === 'th' || opts.force === 'both') ? opts.force : _voiceMode;
      if (opts.interrupt !== false) { try { window.speechSynthesis.cancel(); } catch (e) { /* */ } }
      var sayOne = function (text, lang, voice, rate, cb) {
        try {
          var u = new SpeechSynthesisUtterance(text);
          u.lang = lang; u.rate = rate; u.pitch = 1.06;
          if (voice) u.voice = voice;
          u.onend = cb; u.onerror = cb;
          setTimeout(function () { try { window.speechSynthesis.speak(u); } catch (e) { cb(); } }, 60);
        } catch (e) { cb(); }
      };
      if (mode === 'th') { sayOne(thText || enText, 'th-TH', _thaiVoice, 0.92, done); return; }
      if (mode === 'en') { sayOne(enText, 'en-US', _enVoice, 0.85, done); return; }
      sayOne(enText, 'en-US', _enVoice, 0.85, function () {
        setTimeout(function () { sayOne(thText || enText, 'th-TH', _thaiVoice, 0.92, done); }, 180);
      });
    },
    stopSpeak: function () { try { window.speechSynthesis.cancel(); } catch (e) { /* */ } },
    fxFlash: function (good) { var el = _ensureFx(); if (!el) return; el.classList.remove('good', 'bad'); void el.offsetWidth; el.classList.add(good ? 'good' : 'bad'); setTimeout(function () { el.classList.remove('good', 'bad'); }, 160); },
    setBgm: function (preset) { if (typeof preset === 'string') { if (Object.prototype.hasOwnProperty.call(BGM_PRESETS, preset)) _bgmCfg = BGM_PRESETS[preset]; } else if (preset && typeof preset === 'object') { _bgmCfg = preset; } return Sound; },
    setBgmUrl: function (url) { _bgmUrl = url || null; return Sound; },   // เพลงอัปโหลด (mp3) — มีค่า = เล่นแทน synth
    defaultBgm: function (preset) { if (!_bgmFromInit) Sound.setBgm(preset); return Sound; },   // ใช้ก็ต่อเมื่อหลังบ้านไม่ได้กำหนด
    bgmStart: function () {
      if (!_bgmOn) return;
      if (_bgmUrl) {   // โหมด mp3 (เพลงอัปโหลด)
        try { _ac(); if (!_bgmAudio) { _bgmAudio = new Audio(_bgmUrl); _bgmAudio.loop = true; _bgmAudio.volume = 0.45; } var p = _bgmAudio.play(); if (p && p.catch) p.catch(function () { /* autoplay ถูกบล็อก */ }); } catch (e) { /* */ }
        return;
      }
      if (!_bgmCfg || _bgmTimer || !_bgmEnsure()) return;   // โหมด synth
      var t = _actx.currentTime; _bgmGain.gain.cancelScheduledValues(t); _bgmGain.gain.setValueAtTime(0.0001, t); _bgmGain.gain.linearRampToValueAtTime(0.07, t + 0.8); _bgmStep = 0; _bgmTick(); _bgmTimer = setInterval(_bgmTick, (60 / _bgmCfg.bpm / 2) * 1000);
    },
    bgmStop: function () {
      if (_bgmAudio) { try { _bgmAudio.pause(); } catch (e) { /* */ } }
      if (_bgmTimer) { clearInterval(_bgmTimer); _bgmTimer = null; }
      if (_bgmGain && _actx) { try { var t = _actx.currentTime; _bgmGain.gain.cancelScheduledValues(t); _bgmGain.gain.setValueAtTime(_bgmGain.gain.value, t); _bgmGain.gain.linearRampToValueAtTime(0.0001, t + 0.4); } catch (e) { /* */ } }
    },
    mountToggles: function () {
      _injectCss();
      var build = function () {
        _ensureFx();
        if (document.getElementById('kampai-snd')) { _updateBtns(); return; }
        var wrap = document.createElement('div'); wrap.id = 'kampai-snd';
        var mk = function (id, title, icon, fn) { var b = document.createElement('button'); b.type = 'button'; b.id = id; b.className = 'ksnd'; b.title = title; b.textContent = icon; b.onclick = fn; return b; };
        wrap.appendChild(mk('kbtn-sfx', 'เสียงเอฟเฟกต์', '🔊', function () { _sfxOn = !_sfxOn; localStorage.setItem('mr_sfx', _sfxOn ? '1' : '0'); _updateBtns(); if (_sfxOn) Sound.correct(); }));
        wrap.appendChild(mk('kbtn-tts', 'เสียงพูด', '🗣️', function () { _ttsOn = !_ttsOn; localStorage.setItem('mr_tts', _ttsOn ? '1' : '0'); _updateBtns(); if (!_ttsOn) Sound.stopSpeak(); }));
        wrap.appendChild(mk('kbtn-bgm', 'เพลงประกอบ', '🎵', function () { _bgmOn = !_bgmOn; localStorage.setItem('mr_bgm', _bgmOn ? '1' : '0'); _updateBtns(); if (_bgmOn) { _ac(); Sound.bgmStart(); } else Sound.bgmStop(); }));
        wrap.appendChild(mk('kbtn-voice', 'ภาษาเสียงอ่าน (EN / ไทย / EN+ไทย)', '🌐 EN', function () { Sound.setVoiceMode(_voiceMode === 'en' ? 'th' : _voiceMode === 'th' ? 'both' : 'en'); }));
        document.body.appendChild(wrap); _updateBtns();
      };
      if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
      return Sound;
    },
  };
  K.sound = Sound;

  window.KAMPAI = K;
})();
