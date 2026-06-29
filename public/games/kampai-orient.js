/**
 * kampai-orient.js — มาตรฐานแนวจอ (portrait / landscape / any)
 * โหลดครั้งเดียว · ปรับปรุงที่นี่มีผลทุกเกมที่ใช้ KampaiOrient
 *
 *   KampaiOrient.init({ prefer:'any'|'portrait'|'landscape', lockOnStart, onChange, onPauseChange })
 *   KampaiOrient.getViewportSize()  → { w, h }
 *   KampaiOrient.isPortrait() / isLandscape() / isBlocked() / canStart()
 *   KampaiOrient.setPlaying(bool)   — เปิด/ปิด pause เมื่อแนวจอผิด (touch เท่านั้น)
 *   KampaiOrient.lock()             — screen.orientation.lock (optional)
 *   KampaiOrient.notifyGameStart()  — แจ้ง parent iframe (PlayGame overlay)
 */
(function (global) {
  'use strict';

  var PREF = { ANY: 'any', PORTRAIT: 'portrait', LANDSCAPE: 'landscape' };

  var state = {
    prefer: PREF.ANY,
    lockOnStart: false,
    pauseWhenBlocked: true,
    playing: false,
    paused: false,
    locked: false,
    inIframe: false,
    parentViewport: null,
    onChange: null,
    onPauseChange: null,
    overlayLandscape: 'กรุณาหมุนเครื่องเป็น<b>แนวนอน</b>',
    overlayPortrait: 'กรุณาหมุนเครื่องเป็น<b>แนวตั้ง</b>',
    overlayHint: '↻ หมุนมือถือแล้วเกมจะเล่นได้ทันที',
    _booted: false,
  };

  function isTouch() {
    return global.matchMedia && global.matchMedia('(pointer: coarse)').matches;
  }

  function readOrientationType() {
    try {
      var t = global.screen && global.screen.orientation && global.screen.orientation.type;
      if (typeof t === 'string') return t;
    } catch (e) { /* */ }
    return '';
  }

  function isDevicePortrait() {
    if (state.inIframe && state.parentViewport && typeof state.parentViewport.landscape === 'boolean') {
      return !state.parentViewport.landscape;
    }
    if (state.inIframe && !state.parentViewport) {
      var t0 = readOrientationType();
      if (t0.indexOf('landscape') === 0) return false;
      if (t0.indexOf('portrait') === 0) return true;
      if (typeof global.orientation === 'number') return Math.abs(global.orientation) !== 90;
      if (global.matchMedia) {
        if (global.matchMedia('(orientation: landscape)').matches) return false;
        if (global.matchMedia('(orientation: portrait)').matches) return true;
      }
      return true;
    }
    var t = readOrientationType();
    if (t.indexOf('landscape') === 0) return false;
    if (t.indexOf('portrait') === 0) return true;
    if (typeof global.orientation === 'number') return Math.abs(global.orientation) !== 90;
    if (global.matchMedia) {
      if (global.matchMedia('(orientation: landscape)').matches) return false;
      if (global.matchMedia('(orientation: portrait)').matches) return true;
    }
    var vv = global.visualViewport;
    if (vv && vv.width && vv.height && vv.width !== vv.height) return vv.height > vv.width;
    return global.innerHeight > global.innerWidth;
  }

  function isDeviceLandscape() { return !isDevicePortrait(); }

  function getViewportSize() {
    var vv = global.visualViewport;
    return {
      w: vv ? vv.width : global.innerWidth,
      h: vv ? vv.height : global.innerHeight,
    };
  }

  function isBlocked() {
    if (state.prefer === PREF.ANY) return false;
    if (!isTouch()) return false;
    if (state.inIframe) {
      if (state.parentViewport && typeof state.parentViewport.landscape === 'boolean') {
        if (state.prefer === PREF.LANDSCAPE) return !state.parentViewport.landscape;
        if (state.prefer === PREF.PORTRAIT) return state.parentViewport.landscape;
      }
      return false;
    }
    if (state.prefer === PREF.LANDSCAPE) return isDevicePortrait();
    if (state.prefer === PREF.PORTRAIT) return isDeviceLandscape();
    return false;
  }

  function syncOverlayText() {
    var el = global.document.getElementById('rotate-overlay');
    if (!el) return;
    var textEl = el.querySelector('.ro-text');
    var hintEl = el.querySelector('.ro-hint');
    if (textEl) {
      textEl.innerHTML = state.prefer === PREF.PORTRAIT
        ? state.overlayPortrait
        : state.overlayLandscape;
    }
    if (hintEl && state.overlayHint) hintEl.textContent = state.overlayHint;
  }

  function applyBodyClasses() {
    var doc = global.document;
    if (!doc.body) return;
    var blocked = isBlocked();
    var portrait = isDevicePortrait();
    doc.body.classList.toggle('is-touch', isTouch());
    doc.body.classList.toggle('ui-portrait', portrait);
    doc.body.classList.toggle('ui-landscape', !portrait);
    doc.body.classList.toggle('ko-blocked', blocked);
    if (state.inIframe) {
      doc.body.classList.remove('show-rotate');
    } else {
      doc.body.classList.toggle('show-rotate', blocked && state.prefer !== PREF.ANY);
    }
    var nextPaused = state.pauseWhenBlocked && state.playing && blocked;
    if (nextPaused !== state.paused) {
      state.paused = nextPaused;
      if (typeof state.onPauseChange === 'function') state.onPauseChange(state.paused);
    }
    if (typeof state.onChange === 'function') {
      state.onChange({
        portrait: portrait,
        landscape: !portrait,
        blocked: blocked,
        viewport: getViewportSize(),
      });
    }
  }

  function onViewportEvent() {
    applyBodyClasses();
  }

  function bindEvents() {
    if (state._booted) return;
    state._booted = true;
    global.addEventListener('resize', onViewportEvent);
    global.addEventListener('orientationchange', onViewportEvent);
    if (global.visualViewport) {
      global.visualViewport.addEventListener('resize', onViewportEvent);
      global.visualViewport.addEventListener('scroll', onViewportEvent);
    }
    if (global.matchMedia) {
      try {
        global.matchMedia('(orientation: portrait)').addEventListener('change', onViewportEvent);
      } catch (e) { /* Safari เก่า */ }
    }
    if (state.inIframe) {
      global.addEventListener('message', function (e) {
        var d = e.data;
        if (!d || d.type !== 'kampai:parentViewport') return;
        state.parentViewport = d;
        applyBodyClasses();
      });
      try { global.parent.postMessage({ type: 'kampai:requestParentViewport' }, '*'); } catch (err) { /* */ }
      var poll = 0;
      var pollId = global.setInterval(function () {
        poll++;
        try { global.parent.postMessage({ type: 'kampai:requestParentViewport' }, '*'); } catch (err) { /* */ }
        if (poll >= 12) global.clearInterval(pollId);
      }, 400);
    }
  }

  function injectBaseCss() {
    if (global.document.getElementById('kampai-orient-css')) return;
    var s = global.document.createElement('style');
    s.id = 'kampai-orient-css';
    s.textContent =
      '#rotate-overlay{position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;' +
      'background:linear-gradient(180deg,#0f172a,#1e293b);color:#fff;text-align:center;font-family:Kanit,Sarabun,sans-serif}' +
      '#rotate-overlay .ro-inner{padding:24px;max-width:92vw}' +
      '#rotate-overlay .ro-phone{font-size:72px;animation:ko-ro-spin 1.6s ease-in-out infinite}' +
      '#rotate-overlay .ro-text{font-size:20px;font-weight:700;line-height:1.55;margin-top:14px}' +
      '#rotate-overlay .ro-text b{color:#FFD700}' +
      '#rotate-overlay .ro-hint{margin-top:18px;font-size:15px;font-weight:600;color:#94a3b8;padding:10px 18px;border-radius:12px;background:rgba(255,255,255,.08)}' +
      '@keyframes ko-ro-spin{0%,40%{transform:rotate(0deg)}60%,100%{transform:rotate(-90deg)}}' +
      'body.show-rotate #rotate-overlay{display:flex}' +
      'body.show-rotate{overflow:hidden;touch-action:none}' +
      'body.ui-landscape.is-touch .ko-compact-hud{padding:4px 10px;font-size:.85rem}' +
      'body.ui-landscape.is-touch .menu-panel{max-height:90vh;overflow-y:auto}' +
      'body.ui-landscape.is-touch .menu-body{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:start;text-align:left}' +
      'body.ui-landscape.is-touch .menu-header{text-align:center;grid-column:1/-1}' +
      'body.ui-portrait .menu-body{display:flex;flex-direction:column;gap:12px}';
    global.document.head.appendChild(s);
  }

  async function lockOrientation() {
    if (state.locked || state.prefer === PREF.ANY) return;
    try {
      if (global.screen && global.screen.orientation && typeof global.screen.orientation.lock === 'function') {
        await global.screen.orientation.lock(state.prefer === PREF.PORTRAIT ? 'portrait' : 'landscape');
        state.locked = true;
      }
    } catch (e) { /* บางเบราว์เซอร์/iframe ไม่ให้ lock */ }
  }

  function init(opts) {
    opts = opts || {};
    state.prefer = opts.prefer || PREF.ANY;
    if (state.prefer !== PREF.PORTRAIT && state.prefer !== PREF.LANDSCAPE) state.prefer = PREF.ANY;
    state.lockOnStart = !!opts.lockOnStart;
    state.pauseWhenBlocked = opts.pauseWhenBlocked !== false;
    state.onChange = opts.onChange || null;
    state.onPauseChange = opts.onPauseChange || null;
    if (opts.overlayLandscape) state.overlayLandscape = opts.overlayLandscape;
    if (opts.overlayPortrait) state.overlayPortrait = opts.overlayPortrait;
    if (opts.overlayHint) state.overlayHint = opts.overlayHint;
    state.inIframe = global.self !== global.top;

    injectBaseCss();
    syncOverlayText();
    bindEvents();
    applyBodyClasses();
    return api;
  }

  function canStart() {
    if (state.prefer === PREF.ANY) return true;
    if (state.inIframe) return true;
    return !isBlocked();
  }

  function notifyGameStart() {
    if (!state.inIframe) return;
    try {
      global.parent.postMessage({ type: 'kampai:gameStart', slug: global.KAMPAI && global.KAMPAI.slug }, '*');
    } catch (e) { /* */ }
    if (state.lockOnStart) lockOrientation();
  }

  var api = {
    PREF: PREF,
    init: init,
    getViewportSize: getViewportSize,
    isPortrait: isDevicePortrait,
    isLandscape: isDeviceLandscape,
    isBlocked: isBlocked,
    isPaused: function () { return state.paused; },
    canStart: canStart,
    setPlaying: function (v) { state.playing = !!v; applyBodyClasses(); },
    lock: lockOrientation,
    notifyGameStart: notifyGameStart,
    refresh: applyBodyClasses,
  };

  global.KampaiOrient = api;
})(typeof window !== 'undefined' ? window : globalThis);
