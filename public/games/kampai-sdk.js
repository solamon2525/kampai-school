/*!
 * KAMPAI Game SDK — เชื่อมเกม HTML เข้ากับระบบ kampai-school (หน้า /play wrapper)
 * โหลด: <script src="/games/kampai-sdk.js"></script>  (ก่อน game logic)
 * เอกสาร: /GAME-PROMPT.md + GAME.md
 *
 * ✅ ไฟล์เดียว = single source — อัปเดต SDK ที่นี่ที่เดียว ทุกเกมที่อ้างถึงได้ตามทันที
 * wire format (init / gameEnd / navigate) เหมือนเดิม → เกมเก่าไม่กระทบ
 */
(function () {
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
    input: { up: false, down: false, left: false, right: false, a: false, b: false },
    _slug: null,
    _startTs: Date.now(),
    _readyCbs: [],
    _submitted: false,
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
  K.setSlug = function (slug) { K._slug = slug; return K; };

  /** ส่งคะแนนตอนจบเกม — เรียกครั้งเดียวต่อรอบ. opts: { mode, ...metadata } */
  K.submitScore = function (score, opts) {
    opts = opts || {};
    if (!IS_EMBED || !K.student) return false;        // standalone / ไม่มีนักเรียน → no-op (ทดสอบได้)
    if (K._submitted && opts.allowResubmit !== true) return false;
    K._submitted = true;
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
    } catch (e) { return false; }
  };

  /** กลับหน้าหลัก (iframe-safe) */
  K.goHome = function () {
    if (IS_EMBED) { try { window.parent.postMessage({ type: 'navigate', to: '/h/nattapong' }, '*'); } catch (e) { /* */ } }
    else { window.location.href = '/h/nattapong'; }
  };
  K.exit = K.goHome;

  // ─── init listener (รับข้อมูลจาก /play wrapper) ──────────────────────────────
  if (IS_EMBED) {
    window.addEventListener('message', function (e) {
      var d = e && e.data;
      if (!d || d.type !== 'init') return;
      if (typeof d.studentCode === 'string') {
        var s = d.student || {};
        K.student = {
          id: s.id || null,
          code: d.studentCode,
          displayName: s.displayName || d.displayName || '',
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
      K._startTs = Date.now();
      fireReady();
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

  window.KAMPAI = K;
})();
