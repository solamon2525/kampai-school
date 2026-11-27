/* audio.js — ซินธิไซเซอร์เสียง 8-bit NES Chiptune แนวมาริโอ + เชื่อมปุ่มเสียง KAMPAI */
(function (root) {
  'use strict';

  let actx = null;
  let noiseBuf = null;
  let bgmTimer = null;
  let bgmStep = 0;
  let bgmActive = false;
  let currentTheme = 'overworld';

  function isSfxOn() {
    try { return localStorage.getItem('mr_sfx') !== '0'; } catch (_) { return true; }
  }
  function isBgmOn() {
    try { return localStorage.getItem('mr_bgm') !== '0'; } catch (_) { return true; }
  }

  function ensureCtx() {
    if (actx) {
      if (actx.state === 'suspended') {
        try { actx.resume(); } catch (_) {}
      }
      return actx;
    }
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return null;
    try {
      actx = new AC();
      if (actx.state === 'suspended') actx.resume();
    } catch (_) {
      return null;
    }
    return actx;
  }

  function getNoiseBuffer() {
    const c = ensureCtx();
    if (!c) return null;
    if (noiseBuf) return noiseBuf;
    try {
      const len = Math.floor(c.sampleRate * 0.25);
      noiseBuf = c.createBuffer(1, len, c.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    } catch (_) {
      return null;
    }
    return noiseBuf;
  }

  function tone(freq, startOffset, dur, vol, wave, endFreq) {
    const c = ensureCtx();
    if (!c || !freq) return;
    try {
      const t0 = c.currentTime + (startOffset || 0);
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = wave || 'square';
      osc.frequency.setValueAtTime(freq, t0);
      if (endFreq && endFreq !== freq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(20, endFreq), t0 + dur);
      }
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.linearRampToValueAtTime(vol, t0 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + dur + 0.02);
    } catch (_) {}
  }

  function drum(type, offset) {
    const c = ensureCtx();
    const buf = getNoiseBuffer();
    if (!c || !buf) return;
    try {
      const t0 = c.currentTime + (offset || 0);
      const src = c.createBufferSource();
      src.buffer = buf;
      const filter = c.createBiquadFilter();
      const gain = c.createGain();
      if (type === 'snare') {
        filter.type = 'bandpass';
        filter.frequency.value = 1800;
        gain.gain.setValueAtTime(0.045, t0);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
        src.connect(filter); filter.connect(gain); gain.connect(c.destination);
        src.start(t0); src.stop(t0 + 0.1);
      } else {
        filter.type = 'highpass';
        filter.frequency.value = 6000;
        gain.gain.setValueAtTime(0.022, t0);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.04);
        src.connect(filter); filter.connect(gain); gain.connect(c.destination);
        src.start(t0); src.stop(t0 + 0.05);
      }
    } catch (_) {}
  }

  // ความถี่โน้ต MIDI -> Hz
  function midi(n) {
    if (!n) return 0;
    return 440 * Math.pow(2, (n - 69) / 12);
  }

  // ทำนอง Chiptune 8-bit 3 ธีม (Overworld / Underground / Castle)
  // 16 step per bar @ 150ms (100 BPM 16th-ish upbeat bounce)
  const TRACKS = {
    overworld: {
      stepMs: 145,
      // 32 steps
      lead: [
        76, 76, 0, 76, 0, 72, 76, 0,
        79, 0, 0, 0, 67, 0, 0, 0,
        72, 0, 0, 67, 0, 0, 64, 0,
        69, 0, 71, 0, 70, 69, 0, 0,
        67, 76, 79, 81, 0, 77, 79, 0,
        76, 0, 72, 74, 71, 0, 0, 0
      ],
      bass: [
        50, 50, 0, 50, 0, 50, 50, 0,
        55, 0, 0, 0, 43, 0, 0, 0,
        48, 0, 0, 43, 0, 0, 40, 0,
        45, 0, 47, 0, 46, 45, 0, 0,
        43, 52, 55, 57, 0, 53, 55, 0,
        52, 0, 48, 50, 47, 0, 43, 0
      ]
    },
    underground: {
      stepMs: 155,
      lead: [
        60, 72, 57, 69, 58, 70, 0, 0,
        60, 72, 57, 69, 58, 70, 0, 0,
        53, 65, 50, 62, 51, 63, 0, 0,
        53, 65, 50, 62, 51, 63, 0, 0
      ],
      bass: [
        48, 0, 45, 0, 46, 0, 0, 0,
        48, 0, 45, 0, 46, 0, 0, 0,
        41, 0, 38, 0, 39, 0, 0, 0,
        41, 0, 38, 0, 39, 0, 43, 0
      ]
    },
    castle: {
      stepMs: 135,
      lead: [
        64, 67, 71, 76, 71, 67, 64, 0,
        62, 65, 69, 74, 69, 65, 62, 0,
        60, 64, 67, 72, 71, 69, 67, 65,
        64, 67, 71, 74, 76, 0, 79, 0
      ],
      bass: [
        40, 40, 52, 40, 40, 52, 40, 47,
        38, 38, 50, 38, 38, 50, 38, 45,
        36, 36, 48, 36, 43, 43, 55, 43,
        40, 43, 47, 50, 52, 0, 47, 0
      ]
    }
  };

  function tickBgm() {
    if (!bgmActive || !isBgmOn()) return;
    const track = TRACKS[currentTheme] || TRACKS.overworld;
    const idx = bgmStep % track.lead.length;
    const leadNote = track.lead[idx];
    const bassNote = track.bass[idx];

    if (leadNote) {
      tone(midi(leadNote), 0, 0.12, 0.045, 'square');
    }
    if (bassNote) {
      tone(midi(bassNote), 0, 0.13, 0.065, 'triangle');
    }
    if (idx % 4 === 0) drum('hat', 0);
    if (idx % 8 === 4) drum('snare', 0);

    bgmStep += 1;
  }

  function startBgm(theme) {
    if (theme) currentTheme = theme;
    bgmActive = true;
    stopBgmTimerOnly();
    if (!isBgmOn()) return;
    if (!ensureCtx()) return;
    const track = TRACKS[currentTheme] || TRACKS.overworld;
    bgmStep = 0;
    tickBgm();
    bgmTimer = setInterval(tickBgm, track.stepMs);
  }

  function stopBgmTimerOnly() {
    if (bgmTimer) {
      clearInterval(bgmTimer);
      bgmTimer = null;
    }
  }

  function stopBgm() {
    bgmActive = false;
    stopBgmTimerOnly();
  }

  function syncWithToggle() {
    if (bgmActive && isBgmOn() && !bgmTimer) {
      startBgm(currentTheme);
    } else if (!isBgmOn() && bgmTimer) {
      stopBgmTimerOnly();
    }
  }

  // ผูกฟังการกดปุ่ม 🎵 ของ KAMPAI.sound.mountToggles() เพื่อซิงค์เพลง 8-bit ทันที
  if (typeof document !== 'undefined') {
    document.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'kbtn-bgm') {
        setTimeout(syncWithToggle, 20);
      }
    });
  }

  const SFX = {
    unlock: function () { ensureCtx(); },
    startBgm: startBgm,
    stopBgm: stopBgm,
    syncWithToggle: syncWithToggle,
    setTheme: function (theme) {
      currentTheme = theme || 'overworld';
      if (bgmActive && isBgmOn()) startBgm(currentTheme);
    },
    jump: function () {
      if (!isSfxOn()) return;
      tone(210, 0, 0.14, 0.07, 'square', 540);
    },
    coinWord: function () {
      if (!isSfxOn()) return;
      tone(987.77, 0, 0.08, 0.08, 'square');     // B5
      tone(1318.51, 0.075, 0.24, 0.08, 'square'); // E6
    },
    bump: function () {
      if (!isSfxOn()) return;
      tone(150, 0, 0.08, 0.08, 'triangle', 95);
    },
    powerupHeart: function () {
      if (!isSfxOn()) return;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51, 1567.98];
      notes.forEach(function (f, i) {
        tone(f, i * 0.06, 0.12, 0.07, 'square');
      });
    },
    stomp: function () {
      if (!isSfxOn()) return;
      tone(380, 0, 0.09, 0.08, 'square', 110);
    },
    loseHeart: function () {
      if (!isSfxOn()) return;
      // ทำนองพลาดแบบมาริโอ
      const seq = [
        [493.88, 0, 0.10],
        [349.23, 0.10, 0.10],
        [349.23, 0.23, 0.09],
        [349.23, 0.34, 0.09],
        [329.63, 0.45, 0.10],
        [293.66, 0.56, 0.11],
        [261.63, 0.68, 0.25]
      ];
      seq.forEach(function (n) {
        tone(n[0], n[1], n[2], 0.08, 'square');
      });
    },
    flagpole: function () {
      if (!isSfxOn()) return;
      tone(784, 0, 0.38, 0.07, 'square', 392);
    },
    stageClear: function () {
      if (!isSfxOn()) return;
      const notes = [
        [523.25, 0, 0.10], [659.25, 0.10, 0.10], [783.99, 0.20, 0.10],
        [1046.5, 0.32, 0.14], [783.99, 0.48, 0.10], [1046.5, 0.60, 0.36]
      ];
      notes.forEach(function (n) {
        tone(n[0], n[1], n[2], 0.08, 'square');
      });
    },
    gameOver: function () {
      if (!isSfxOn()) return;
      const notes = [
        [523.25, 0, 0.15], [392.00, 0.18, 0.15], [329.63, 0.36, 0.20],
        [440.00, 0.58, 0.14], [493.88, 0.72, 0.14], [440.00, 0.86, 0.14],
        [415.30, 1.02, 0.18], [466.16, 1.22, 0.18], [415.30, 1.42, 0.38]
      ];
      notes.forEach(function (n) {
        tone(n[0], n[1], n[2], 0.075, 'triangle');
      });
    }
  };

  root.ThaiMarioAudio = SFX;
})(typeof window !== 'undefined' ? window : globalThis);
