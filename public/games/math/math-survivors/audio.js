/* audio.js — ซินธิไซเซอร์ Chiptune 8-bit WebAudio สำหรับ Math Survivors */
window.SurvivorsAudio = (function () {
  'use strict';

  let ctx = null;
  let bgmTimer = null;
  let stepIdx = 0;

  function sfxEnabled() {
    try { return localStorage.getItem('mr_sfx') !== '0'; } catch (_) { return true; }
  }
  function bgmEnabled() {
    try { return localStorage.getItem('mr_bgm') !== '0'; } catch (_) { return true; }
  }

  function ensureCtx() {
    if (ctx) {
      if (ctx.state === 'suspended') {
        try { ctx.resume(); } catch (_) {}
      }
      return ctx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { ctx = new AC(); } catch (_) { return null; }
    return ctx;
  }

  function playTone(freq, dur, type, vol, slideTo) {
    if (!sfxEnabled()) return;
    const ac = ensureCtx();
    if (!ac) return;
    try {
      const now = ac.currentTime;
      const osc = ac.createOscillator();
      const g = ac.createGain();
      osc.type = type || 'square';
      osc.frequency.setValueAtTime(Math.max(40, freq), now);
      if (slideTo) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(40, slideTo), now + dur);
      }
      g.gain.setValueAtTime(vol || 0.08, now);
      g.gain.exponentialRampToValueAtTime(0.0008, now + dur);
      osc.connect(g);
      g.connect(ac.destination);
      osc.start(now);
      osc.stop(now + dur + 0.01);
    } catch (_) {}
  }

  // Fantasy Arena BGM bass + lead pattern (D minor / F major heroic)
  const LEAD = [293.66, 349.23, 440.00, 523.25, 440.00, 392.00, 349.23, 392.00, 293.66, 349.23, 440.00, 587.33, 523.25, 440.00, 392.00, 329.63];
  const BASS = [146.83, 146.83, 174.61, 174.61, 130.81, 130.81, 196.00, 196.00];

  function bgmTick() {
    if (!bgmEnabled() || document.hidden) return;
    const ac = ensureCtx();
    if (!ac || ac.state !== 'running') return;
    try {
      const now = ac.currentTime;
      const leadF = LEAD[stepIdx % LEAD.length];
      const bassF = BASS[Math.floor(stepIdx / 2) % BASS.length];

      const o1 = ac.createOscillator();
      const g1 = ac.createGain();
      o1.type = 'triangle';
      o1.frequency.setValueAtTime(leadF, now);
      g1.gain.setValueAtTime(0.032, now);
      g1.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      o1.connect(g1);
      g1.connect(ac.destination);
      o1.start(now);
      o1.stop(now + 0.17);

      if (stepIdx % 2 === 0) {
        const o2 = ac.createOscillator();
        const g2 = ac.createGain();
        o2.type = 'square';
        o2.frequency.setValueAtTime(bassF, now);
        g2.gain.setValueAtTime(0.018, now);
        g2.gain.exponentialRampToValueAtTime(0.001, now + 0.24);
        o2.connect(g2);
        g2.connect(ac.destination);
        o2.start(now);
        o2.stop(now + 0.25);
      }
      stepIdx = (stepIdx + 1) % 32;
    } catch (_) {}
  }

  return {
    unlock: function () { ensureCtx(); },
    startBgm: function () {
      ensureCtx();
      this.stopBgm();
      stepIdx = 0;
      bgmTimer = setInterval(bgmTick, 195);
    },
    stopBgm: function () {
      if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
    },
    shoot: function () { playTone(680, 0.05, 'triangle', 0.04, 340); },
    lightning: function () { playTone(980, 0.09, 'sawtooth', 0.055, 220); },
    hit: function () { playTone(190, 0.045, 'square', 0.035, 110); },
    gem: function (comboCount) {
      const f = 523.25 * Math.pow(1.06, Math.min(10, comboCount || 0));
      playTone(f, 0.06, 'sine', 0.055, f * 1.15);
    },
    mathCorrect: function () {
      playTone(523.25, 0.09, 'triangle', 0.085);
      setTimeout(function () { playTone(659.25, 0.09, 'triangle', 0.085); }, 70);
      setTimeout(function () { playTone(783.99, 0.12, 'triangle', 0.09); }, 140);
      setTimeout(function () { playTone(1046.5, 0.20, 'triangle', 0.095); }, 210);
    },
    mathWrong: function () {
      playTone(220, 0.14, 'sawtooth', 0.08, 130);
      setTimeout(function () { playTone(155, 0.20, 'sawtooth', 0.08, 110); }, 120);
    },
    levelUp: function () {
      [587.33, 739.99, 880.0, 1174.66].forEach(function (f, i) {
        setTimeout(function () { playTone(f, 0.14, 'triangle', 0.085); }, i * 80);
      });
    },
    bossWarn: function () {
      [220, 196, 220, 165].forEach(function (f, i) {
        setTimeout(function () { playTone(f, 0.16, 'sawtooth', 0.085); }, i * 160);
      });
    },
    hurt: function () { playTone(165, 0.12, 'sawtooth', 0.075, 90); }
  };
})();
