// --- บอลลูนไฟเตอร์ (Balloon Fighter - Ultimate Edition Game Logic) ---

const config = window.GAME_CONFIG;
const VOCAB = window.GAME_DATA.vocab;
const CAT_NAMES = window.GAME_DATA.catNames;

const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const DS = config.SCALE;

function resize() {
  cv.width = window.innerWidth;
  cv.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

// ============================================================ SAVE SYSTEM
let saved = JSON.parse(localStorage.getItem('bf_save_v2')) || { coins: 0, hs: 0, skins: ['bear'], p1Skin: 'bear', p2Skin: 'bear' };
function saveData() {
  localStorage.setItem('bf_save_v2', JSON.stringify(saved));
}

// ============================================================ AUDIO (Minified & Integrated with SDK)
let AC = null, masterGain = null, bgmGain = null, sfxGain = null, muted = false, bgmPlaying = false, bgmLoop = null, bgmBar = 0, bgmNodes = [];

function isSfxEnabled() {
  return localStorage.getItem('mr_sfx') !== '0';
}

function initAudio() {
  if (AC) return;
  AC = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = AC.createGain();
  masterGain.gain.value = 0.8;
  masterGain.connect(AC.destination);
  bgmGain = AC.createGain();
  bgmGain.gain.value = 0.35;
  bgmGain.connect(masterGain);
  sfxGain = AC.createGain();
  sfxGain.gain.value = 0.65;
  sfxGain.connect(masterGain);
}

function pt(freq, dur, type = 'sine', vol = 0.3, at = 0) {
  if (!AC || !isSfxEnabled()) return;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0, AC.currentTime + at);
  g.gain.linearRampToValueAtTime(vol, AC.currentTime + at + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + at + dur);
  o.connect(g);
  g.connect(sfxGain);
  o.start(AC.currentTime + at);
  o.stop(AC.currentTime + at + dur + 0.05);
}

function pn(dur, vol = 0.2, freq = 400) {
  if (!AC || !isSfxEnabled()) return;
  const buf = AC.createBuffer(1, AC.sampleRate * dur, AC.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
  src.buffer = buf;
  f.type = 'bandpass';
  f.frequency.value = freq;
  f.Q.value = 2;
  g.gain.setValueAtTime(vol, AC.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + dur);
  src.connect(f);
  f.connect(g);
  g.connect(sfxGain);
  src.start();
  src.stop(AC.currentTime + dur);
}

function sfxFlap() {
  if (!AC || !isSfxEnabled()) return;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(280, AC.currentTime);
  o.frequency.linearRampToValueAtTime(160, AC.currentTime + 0.12);
  g.gain.setValueAtTime(0.18, AC.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, AC.currentTime + 0.12);
  o.connect(g);
  g.connect(sfxGain);
  o.start();
  o.stop(AC.currentTime + 0.14);
}

function sfxLand() { pn(0.08, 0.15, 200); pt(80, 0.1, 'sine', 0.2); }
function sfxStomp() { pn(0.06, 0.25, 600); pt(420, 0.18, 'sine', 0.28); }
function sfxCorrect() { [523, 659, 784, 1047].forEach((f, i) => pt(f, 0.2, 'triangle', 0.24, i * 0.08)); }
function sfxWrong() { [220, 196, 174].forEach(f => pt(f, 0.15, 'sawtooth', 0.18)); pn(0.1, 0.18, 150); }
function sfxLevelUp() { [523, 659, 784, 880, 1047, 1318].forEach((f, i) => pt(f, 0.25, 'square', 0.14, i * 0.06)); }
function sfxGameover() { [392, 349, 330, 294, 262].forEach((f, i) => pt(f, 0.35, 'sawtooth', 0.18, i * 0.12)); }
function sfxZap() { pn(0.12, 0.3, 3000); pt(880, 0.08, 'sawtooth', 0.22); }
function sfxSpike() { pn(0.08, 0.22, 200); pt(120, 0.12, 'sine', 0.25); }
function sfxItem() { [1047, 1318, 1568].forEach((f, i) => pt(f, 0.18, 'triangle', 0.2, i * 0.07)); }
function sfxBossHit() { pn(0.2, 0.4, 100); pt(150, 0.3, 'square', 0.3); }
function sfxBossDie() { pn(0.5, 0.5, 100); [150, 130, 110, 90, 70].forEach((f, i) => pt(f, 0.5, 'sawtooth', 0.3, i * 0.1)); }

// ============================================================ BGM SYSTEM
let currentBgmMode = '';
function stopBGM() {
  bgmPlaying = false;
  currentBgmMode = '';
  if (bgmLoop) clearTimeout(bgmLoop);
  bgmNodes.forEach(n => { try { n.stop(); } catch (e) { } });
  bgmNodes = [];
}

function playBGM(mode = 'play') {
  if (!AC) return;
  // ตรวจสอบว่าเปิด BGM ในระบบ KAMPAI หรือไม่
  const bgmOn = localStorage.getItem('mr_bgm') !== '0';
  if (!bgmOn) {
    stopBGM();
    return;
  }
  
  if (currentBgmMode === mode) return;
  stopBGM();
  bgmPlaying = true;
  currentBgmMode = mode;
  bgmBar = 0;
  
  const BPM = mode === 'play' ? 165 : 120, beat = 60 / BPM, bar = beat * 4;
  
  function k(t) {
    if (!bgmPlaying) return;
    const o = AC.createOscillator(), g = AC.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.1);
    g.gain.setValueAtTime(0.8, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    o.connect(g);
    g.connect(bgmGain);
    o.start(t);
    o.stop(t + 0.15);
    bgmNodes.push(o);
  }
  
  function s(t) {
    if (!bgmPlaying) return;
    const o = AC.createOscillator(), g = AC.createGain();
    o.frequency.setValueAtTime(250, t);
    o.frequency.exponentialRampToValueAtTime(100, t + 0.1);
    g.gain.setValueAtTime(0.5, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    o.connect(g);
    g.connect(bgmGain);
    o.start(t);
    o.stop(t + 0.15);
    bgmNodes.push(o);
    
    const buf = AC.createBuffer(1, AC.sampleRate * 0.15, AC.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = AC.createBufferSource(), f = AC.createBiquadFilter(), ng = AC.createGain();
    src.buffer = buf;
    f.type = 'highpass';
    f.frequency.value = 1200;
    ng.gain.setValueAtTime(0.5, t);
    ng.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
    src.connect(f);
    f.connect(ng);
    ng.connect(bgmGain);
    src.start(t);
    src.stop(t + 0.2);
    bgmNodes.push(src);
  }
  
  function h(t, op = false) {
    if (!bgmPlaying) return;
    const dur = op ? 0.15 : 0.04;
    const buf = AC.createBuffer(1, AC.sampleRate * dur, AC.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain();
    src.buffer = buf;
    f.type = 'highpass';
    f.frequency.value = 7000;
    g.gain.setValueAtTime(0.2, t);
    g.gain.exponentialRampToValueAtTime(0.01, t + dur);
    src.connect(f);
    f.connect(g);
    g.connect(bgmGain);
    src.start(t);
    src.stop(t + dur + 0.05);
    bgmNodes.push(src);
  }
  
  function b(fq, t, dur) {
    if (!bgmPlaying) return;
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'sawtooth';
    o.frequency.value = fq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.35, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.01, t + dur);
    const f = AC.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.setValueAtTime(1500, t);
    f.frequency.exponentialRampToValueAtTime(100, t + dur);
    o.connect(f);
    f.connect(g);
    g.connect(bgmGain);
    o.start(t);
    o.stop(t + dur + 0.05);
    bgmNodes.push(o);
  }
  
  function m(fq, t, dur) {
    if (!bgmPlaying) return;
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = 'square';
    o.frequency.value = fq;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.15, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.01, t + dur);
    o.connect(g);
    g.connect(bgmGain);
    o.start(t);
    o.stop(t + dur + 0.05);
    bgmNodes.push(o);
  }

  function scheduleBar(bs) {
    if (!bgmPlaying) return;
    if (mode === 'play') {
      k(bs); h(bs); h(bs + beat * 0.5);
      s(bs + beat); h(bs + beat); h(bs + beat * 1.5);
      k(bs + beat * 2.5); h(bs + beat * 2); h(bs + beat * 2.5);
      s(bs + beat * 3); h(bs + beat * 3); h(bs + beat * 3.5, true);
      if (bgmBar % 4 === 3) { s(bs + beat * 3.5); k(bs + beat * 3.75); }

      const r = 55;
      const n = bgmBar % 4 < 2 ? r : (bgmBar % 4 === 2 ? r * 1.2 : r * 1.05);
      for (let i = 0; i < 8; i++) b(n, bs + i * beat * 0.5, beat * 0.3);

      const arp = [220, 261.63, 329.63, 392];
      m(arp[bgmBar % 4] * 2, bs, beat * 0.5);
      m(arp[(bgmBar + 1) % 4] * 2, bs + beat * 1.5, beat * 0.5);
      m(arp[(bgmBar + 2) % 4] * 2, bs + beat * 2.5, beat * 0.5);
    } else if (mode === 'menu') {
      k(bs); h(bs); h(bs + beat * 0.5);
      s(bs + beat); h(bs + beat); h(bs + beat * 1.5);
      k(bs + beat * 2); k(bs + beat * 2.5); h(bs + beat * 2); h(bs + beat * 2.5);
      s(bs + beat * 3); h(bs + beat * 3); h(bs + beat * 3.5);

      b(65.41, bs, beat * 1.5); b(65.41, bs + beat * 2.5, beat * 1.5);
      if (bgmBar % 2 === 0) { m(261.63, bs, beat * 2); m(392, bs + beat * 2, beat * 2); }
    }
    bgmBar++;
    const delay = (bs + bar - AC.currentTime) * 1000 - 50;
    if (bgmPlaying) bgmLoop = setTimeout(() => scheduleBar(bs + bar), Math.max(0, delay));
  }
  scheduleBar(AC.currentTime);
}

// ============================================================ BCOLS & P_COLS FROM CONFIG
const BCOLS = config.BCOLS;
const P_COLS = config.P_COLS;
let curVocab = VOCAB.raja;

function lighten(hex, a) { return `rgb(${Math.min(255, parseInt(hex.slice(1, 3), 16) + a)},${Math.min(255, parseInt(hex.slice(3, 5), 16) + a)},${Math.min(255, parseInt(hex.slice(5, 7), 16) + a)})`; }
function darken(hex, a) { return `rgb(${Math.max(0, parseInt(hex.slice(1, 3), 16) - a)},${Math.max(0, parseInt(hex.slice(3, 5), 16) - a)},${Math.max(0, parseInt(hex.slice(5, 7), 16) - a)})`; }

// ============================================================ GAME STATE
const keys = {};
let gs = 'menu', pCount = 1, gMode = 'coop', cat = 'raja', monsters = [], players = [], score = [0, 0], lives = [3, 3], level = 1, prevLevel = 1;
let parts = [], ftexts = [], used = [], curQ = null, spikes = [], clouds = [], lightnings = [], items = [], itemTimer = 360;
let screenFlashA = 0, screenFlashCol = '#fff', weather = 'normal', windSpeed = 0, boss = null, onlineRng = null, match = null;

// Key Listeners
document.addEventListener('keydown', e => {
  keys[e.code] = true;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (!AC) {
    initAudio();
    if (['menu', 'modeSelect', 'catSelect', 'shop'].includes(gs)) playBGM('menu');
  }
});
document.addEventListener('keyup', e => keys[e.code] = false);

// Click Listeners for Menu buttons
cv.addEventListener('click', e => {
  if (!AC) {
    initAudio();
    if (['menu', 'modeSelect', 'catSelect', 'shop'].includes(gs)) playBGM('menu');
  }
  const r = cv.getBoundingClientRect(), mx = (e.clientX - r.left) * (cv.width / r.width), my = (e.clientY - r.top) * (cv.height / r.height);
  
  if (gs === 'menu') {
    if (my > cv.height * .4 && my < cv.height * .4 + 50 && mx > cv.width / 2 - 100 && mx < cv.width / 2 + 100) setGs('modeSelect'); // Play
    if (my > cv.height * .52 && my < cv.height * .52 + 50 && mx > cv.width / 2 - 100 && mx < cv.width / 2 + 100) setGs('shop'); // Shop
    if (my > cv.height * .64 && my < cv.height * .64 + 50 && mx > cv.width / 2 - 100 && mx < cv.width / 2 + 100) { // Exit
      if (window.KAMPAI) window.KAMPAI.goHome();
      else window.location.href = '/h/nattapong';
    }
  }
  else if (gs === 'modeSelect') {
    if (mx > cv.width / 2 - 120 && mx < cv.width / 2 + 120) {
      if (my > cv.height * .3 && my < cv.height * .3 + 50) { pCount = 1; gMode = 'coop'; setGs('catSelect'); }
      if (my > cv.height * .41 && my < cv.height * .41 + 50) { pCount = 2; gMode = 'coop'; setGs('catSelect'); }
      if (my > cv.height * .52 && my < cv.height * .52 + 50) { pCount = 2; gMode = 'versus'; setGs('catSelect'); }
      if (my > cv.height * .63 && my < cv.height * .63 + 50) { openOnline(); }
      if (my > cv.height * .75 && my < cv.height * .75 + 40) setGs('menu'); // Back
    }
  }
  else if (gs === 'catSelect') {
    if (mx > cv.width / 2 - 120 && mx < cv.width / 2 + 120) {
      if (my > cv.height * .3 && my < cv.height * .3 + 50) { cat = 'raja'; start(); }
      if (my > cv.height * .42 && my < cv.height * .42 + 50) { cat = 'idiom'; start(); }
      if (my > cv.height * .54 && my < cv.height * .54 + 50) { cat = 'eng'; start(); }
      if (my > cv.height * .7 && my < cv.height * .7 + 40) setGs('modeSelect');
    }
  }
  else if (gs === 'shop') {
    const cx = cv.width / 2;
    if (my > cv.height * .8 && mx > cx - 60 && mx < cx + 60) setGs('menu'); // Back
    // Items
    ['bear', 'cat', 'bunny'].forEach((s, i) => {
      const bx = cx - 150 + i * 150;
      // Click P1 equip
      if (mx > bx - 40 && mx < bx + 40 && my > cv.height * .6 && my < cv.height * .6 + 30) {
        if (saved.skins.includes(s)) { saved.p1Skin = s; saveData(); }
        else if (saved.coins >= config.SKIN_PRICES[s]) {
          saved.coins -= config.SKIN_PRICES[s];
          saved.skins.push(s);
          saved.p1Skin = s;
          saveData();
          sfxCorrect();
        }
      }
      // Click P2 equip
      if (mx > bx - 40 && mx < bx + 40 && my > cv.height * .68 && my < cv.height * .68 + 30) {
        if (saved.skins.includes(s)) { saved.p2Skin = s; saveData(); }
      }
    });
  }
  else if (gs === 'gameover') setGs('menu');
});

function setGs(s) {
  gs = s;
  if (['menu', 'modeSelect', 'catSelect', 'shop'].includes(s)) playBGM('menu');
  else if (s === 'playing') playBGM('play');
  else if (s === 'gameover') stopBGM();
}

function shuf(a) {
  const rnd = onlineRng || Math.random;
  return [...a].sort(() => rnd() - 0.5);
}

function newQ() {
  const rnd = onlineRng || Math.random;
  if (used.length >= curVocab.length) used = [];
  let avail = curVocab.filter(v => !used.includes(v));
  let ok = avail[Math.floor(rnd() * avail.length)];
  used.push(ok);
  const filtered = curVocab.filter(v => v !== ok);
  const distractors = shuf(filtered).slice(0, 3);
  const options = shuf([ok, ...distractors]);
  return { correct: ok, options: options };
}

// ============================================================ ENTITIES
class Monster {
  constructor(opt, col, isCorrect, sx, sy, isAggressive = false) {
    this.opt = opt; this.col = col; this.isCorrect = isCorrect; this.isAggressive = isAggressive;
    this.x = sx; this.y = sy; this.vx = (Math.random() - 0.5) * 2; this.vy = 0;
    this.t = Math.random() * 10; this.facing = 1; this.wingAng = 0; this.wingDir = 1;
    this.wanderAng = Math.random() * Math.PI * 2; this.wanderTimer = 0;
    this.popped = false; this.frozen = 0;
    this.bodyR = 13; this.strLen = 18;
    ctx.font = 'bold 13px sans-serif';
    this.br = Math.max(17, ctx.measureText(opt.r).width / 2 + 8);
  }
  get bx() { return this.x + Math.sin(this.t) * 5; }
  get by() { return this.y - this.bodyR * DS - this.strLen - this.br; }

  update() {
    this.t += 0.038;
    if (this.frozen > 0) {
      this.frozen--; this.wingAng += this.wingDir * 0.04;
      if (this.wingAng > 0.68) this.wingDir = -1;
      if (this.wingAng < -0.05) this.wingDir = 1;
      return;
    }
    this.wingAng += this.wingDir * 0.13;
    if (this.wingAng > 0.68) this.wingDir = -1;
    if (this.wingAng < -0.05) this.wingDir = 1;

    if (this.isAggressive) {
      let target = null, td = Infinity;
      players.forEach(p => {
        if (lives[p.id] <= 0) return;
        const bp = p.getBP();
        const d = Math.hypot(this.x - bp.x, this.y - bp.y);
        if (d < td) { td = d; target = bp; }
      });
      if (target) {
        const dx = target.x - this.x, dy = target.y - this.y, d = Math.hypot(dx, dy) || 1, spd = 1.8 + level * 0.14;
        this.vx += (dx / d * spd - this.vx) * 0.055;
        this.vy += (dy / d * spd - this.vy) * 0.055;
      }
    } else {
      this.wanderTimer--;
      if (this.wanderTimer <= 0) {
        this.wanderAng += (Math.random() - 0.5) * 1.8;
        this.wanderTimer = 55 + Math.random() * 85;
      }
      const spd = 1.0 + level * 0.09, tx = Math.cos(this.wanderAng) * spd, ty = Math.sin(this.wanderAng) * spd * 0.3 + Math.sin(this.t) * 0.65;
      this.vx += (tx - this.vx) * 0.04;
      this.vy += (ty - this.vy) * 0.04;
    }
    this.vx += windSpeed * 0.05;
    this.x += this.vx; this.y += this.vy;
    
    if (this.vx > 0.1) this.facing = 1;
    if (this.vx < -0.1) this.facing = -1;
    
    const pad = 36;
    if (this.x < pad) { this.vx += 0.5; this.wanderAng = (Math.random() - 0.5) * 0.6; }
    if (this.x > cv.width - pad) { this.vx -= 0.5; this.wanderAng = Math.PI + (Math.random() - 0.5) * 0.6; }
    
    const minY = this.bodyR * DS + this.strLen + this.br * 2 + 60, maxY = cv.height - this.bodyR * DS * 2 - 80;
    if (this.y < minY) this.vy += 0.4;
    if (this.y > maxY) this.vy -= 0.4;
  }
  
  checkStomp(p) {
    if (this.popped) return false;
    const dx = Math.abs((p.x + p.w / 2) - this.bx), pb = p.y + p.h;
    return p.vy > 0.5 && dx < this.br * 1.2 && pb >= this.by - this.br * 0.85 && pb <= this.by + this.br * 0.35;
  }
  
  checkHitP(p) {
    if (!this.isAggressive || this.popped || this.frozen > 0 || p.eff.sh > 0) return false;
    const bp = p.getBP();
    return Math.hypot(this.x - bp.x, this.y - bp.y) < this.bodyR * DS + bp.r + 2;
  }
  
  draw() {
    if (this.popped) return;
    ctx.save();
    const bx = this.bx, by = this.by, br = this.br, mx = this.x, my = this.y;
    if (this.frozen > 0) ctx.globalAlpha = 0.55 + Math.sin(this.t * 10) * 0.1;
    
    // Balloon
    const grad = ctx.createRadialGradient(bx - br * .3, by - br * .35, br * .08, bx, by, br);
    grad.addColorStop(0, lighten(this.col, 75));
    grad.addColorStop(0.6, this.col);
    grad.addColorStop(1, darken(this.col, 18));
    ctx.fillStyle = grad; ctx.beginPath(); ctx.ellipse(bx, by, br, br * 1.1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(bx, by, br, br * 1.1, 0, 0, Math.PI * 2); ctx.stroke();
    
    ctx.fillStyle = '#000'; ctx.font = `bold 13px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(this.opt.r, bx, by);
    // String
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.moveTo(bx, by + br); ctx.lineTo(mx, my - this.bodyR * DS - 6); ctx.stroke();
    
    // Aura
    if (this.isAggressive && this.frozen <= 0) {
      ctx.fillStyle = 'rgba(255,50,0,0.3)'; ctx.beginPath(); ctx.arc(mx, my, this.bodyR * DS + 10, 0, Math.PI * 2); ctx.fill();
    }
    // Body
    ctx.translate(mx, my); ctx.scale(DS, DS);
    for (const s of [-1, 1]) {
      const wa = this.wingAng * s; ctx.save(); ctx.translate(s * 20, -6); ctx.fillStyle = darken(this.col, 28); ctx.beginPath(); ctx.moveTo(0, 0); ctx.bezierCurveTo(s * 14, -22 - wa * 22, s * 36, -10 - wa * 14, s * 32, 8); ctx.bezierCurveTo(s * 22, 12, s * 7, 6, 0, 0); ctx.fill(); ctx.restore();
    }
    ctx.fillStyle = this.col; ctx.beginPath(); ctx.ellipse(0, 0, 22, 20, 0, 0, Math.PI * 2); ctx.fill();
    for (const s of [-1, 1]) {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s * 6.5, -4, 5.8, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = this.isAggressive && this.frozen <= 0 ? '#c00' : '#111'; ctx.beginPath(); ctx.arc(s * 6.5 + this.facing * 1.2, -4, 3.3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }
}

// ============================================================ BOSS
class Boss {
  constructor() {
    this.x = cv.width / 2; this.y = -100; this.vx = 2; this.vy = 1; this.hp = 3; this.maxHp = 3; this.t = 0;
    this.w = 120; this.h = 100;
    this.state = 'enter';
    this.options = [];
  }
  
  spawnOptions(q) {
    curQ = q; this.options = [];
    const w = 240, sp = w / 4;
    q.options.forEach((opt, i) => {
      ctx.font = 'bold 14px sans-serif';
      const br = Math.max(22, ctx.measureText(opt.r).width / 2 + 8);
      this.options.push({ opt: opt, col: BCOLS[i % BCOLS.length], isCorrect: opt === q.correct, bx: this.x - w / 2 + sp * (i + 0.5), by: this.y - 60, popped: false, br: br });
    });
  }
  
  update() {
    this.t += 0.05;
    if (this.state === 'enter') {
      this.y += 2; if (this.y > 180) { this.state = 'move'; this.spawnOptions(newQ()); }
    } else {
      this.x += this.vx; this.y += Math.sin(this.t) * 0.5;
      if (this.x < 150) this.vx = 1.5; if (this.x > cv.width - 150) this.vx = -1.5;
      
      const w = 300, sp = w / 4;
      this.options.forEach((o, i) => { if (!o.popped) { o.bx = this.x - w / 2 + sp * (i + 0.5); o.by = this.y - 70 + Math.sin(this.t + i) * 10; } });
    }
  }
  
  checkStomp(p) {
    if (this.state !== 'move') return;
    this.options.forEach(o => {
      if (o.popped) return;
      const dx = Math.abs((p.x + p.w / 2) - o.bx), pb = p.y + p.h;
      if (p.vy > 0.5 && dx < o.br + 5 && pb >= o.by - o.br && pb <= o.by + 10) {
        p.vy = -10; p.squish = 1.3; o.popped = true; addParts(o.bx, o.by, o.col, 20);
        if (o.isCorrect) {
          sfxBossHit(); this.hp--;
          addFText(this.x, this.y, `💥 บอสโดนโจมตี! (เหลือ ${this.hp})`, '#ffcc00');
          
          if (window.KAMPAI && window.KAMPAI.sound) {
            window.KAMPAI.sound.speak(o.opt.r, 'th-TH', true);
          }
          
          if (this.hp > 0) {
            setTimeout(() => this.spawnOptions(newQ()), 1000);
          } else {
            sfxBossDie(); score[p.id] += 1000;
            if (gMode === 'online' && match) {
              match.report(score[p.id], { correct: level - 1 });
            }
            addFText(this.x, this.y, '🎉 ปราบบอสสำเร็จ! +1000', '#6bcb77');
            addParts(this.x, this.y, '#ff0', 50);
            boss = null;
            
            if (window.confetti) {
              confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
            }
            
            setTimeout(() => { level++; spawnMonsters(newQ()); spawnHazards(); }, 2000);
          }
        } else {
          sfxWrong(); addFText(o.bx, o.by, '✗ ผิด! -1♥', '#ff6b6b'); playerTakeDamage(p, '', '#ff6b6b');
        }
      }
    });
  }
  
  draw() {
    ctx.save(); ctx.translate(this.x, this.y);
    ctx.fillStyle = '#2c3e50'; ctx.beginPath(); ctx.ellipse(0, 0, 60, 50, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a252f'; ctx.beginPath(); ctx.ellipse(0, 20, 40, 30, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.ellipse(-20, -10, 12, 8, 0.2, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(20, -10, 12, 8, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.arc(-20, -10, 4, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(20, -10, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#bdc3c7'; ctx.beginPath(); ctx.moveTo(-30, -30); ctx.lineTo(-50, -60); ctx.lineTo(-10, -40); ctx.fill(); ctx.beginPath(); ctx.moveTo(30, -30); ctx.lineTo(50, -60); ctx.lineTo(10, -40); ctx.fill();
    ctx.restore();

    this.options.forEach(o => {
      if (o.popped) return;
      ctx.fillStyle = o.col; ctx.beginPath(); ctx.ellipse(o.bx, o.by, o.br, o.br * 1.15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(o.bx, o.by + o.br * 1.15); ctx.lineTo(this.x, this.y - 40); ctx.stroke();
      ctx.fillStyle = '#000'; ctx.font = `bold 14px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.opt.r, o.bx, o.by);
    });
  }
}

// ============================================================ HAZARDS
class Spike {
  constructor() { this.x = 80 + Math.random() * (cv.width - 160); this.y = 80 + Math.random() * (cv.height * 0.5); this.vx = (Math.random() - 0.5) * 1.5; this.vy = (Math.random() - 0.5) * 1; this.rot = 0; this.r = 12; }
  update() { this.x += this.vx; this.y += this.vy; this.rot += 0.05; if (this.x < 30 || this.x > cv.width - 30) this.vx *= -1; if (this.y < 60 || this.y > cv.height - 100) this.vy *= -1; }
  hits(p) { return Math.hypot((p.x + p.w / 2) - this.x, (p.y + p.h / 2) - this.y) < this.r + 12; }
  draw() { ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rot); ctx.fillStyle = '#aaa'; ctx.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? 14 : 6; i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.fill(); ctx.restore(); }
}

class Cloud {
  constructor() { this.x = Math.random() * cv.width; this.y = 52 + Math.random() * 80; this.vx = (Math.random() - 0.5) * 0.8; this.timer = 200 + Math.random() * 300; }
  update() { this.x += this.vx + windSpeed * 0.1; this.timer--; if (this.x < -100) this.x = cv.width + 100; if (this.x > cv.width + 100) this.x = -100; if (this.timer <= 0) { this.timer = 200 + Math.random() * 300; return new Lightning(this.x, this.y + 20); } return null; }
  draw() { ctx.fillStyle = 'rgba(200,220,255,0.8)'; ctx.beginPath(); ctx.ellipse(this.x, this.y, 40, 15, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(this.x - 15, this.y - 10, 25, 15, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.ellipse(this.x + 20, this.y - 5, 20, 12, 0, 0, Math.PI * 2); ctx.fill(); if (this.timer < 40) { ctx.fillStyle = 'rgba(255,255,0,0.5)'; ctx.beginPath(); ctx.ellipse(this.x, this.y, 40, 15, 0, 0, Math.PI * 2); ctx.fill(); } }
}

class Lightning {
  constructor(x, y) { this.x = x; this.y = y; this.vx = (Math.random() - 0.5) * 4; this.vy = 5 + Math.random() * 3; this.life = 200; this.trail = []; this.r = 6; }
  update() { this.trail.push({ x: this.x, y: this.y }); if (this.trail.length > 10) this.trail.shift(); this.x += this.vx + windSpeed * 0.2; this.y += this.vy; if (this.x < 0 || this.x > cv.width) this.vx *= -1; if (this.y < 0 || this.y > cv.height - 60) { this.vy *= -1; screenFlashA = 0.2; screenFlashCol = '#ff0'; } this.life--; return this.life > 0; }
  hits(p) { return Math.hypot((p.x + p.w / 2) - this.x, (p.y + p.h / 2) - this.y) < this.r + 12; }
  draw() { ctx.strokeStyle = 'rgba(255,255,100,' + (this.life / 200) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(this.trail[0].x, this.trail[0].y); for (let i = 1; i < this.trail.length; i++) ctx.lineTo(this.trail[i].x, this.trail[i].y); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2); ctx.fill(); }
}

class Item {
  constructor(type = null) { this.type = type || ['shield', 'speed', 'coin', 'freeze'][Math.floor(Math.random() * 4)]; this.x = 60 + Math.random() * (cv.width - 120); this.y = cv.height * 0.3 + Math.random() * cv.height * 0.35; this.t = Math.random() * 10; this.r = 16; this.collected = false; this.life = 500; }
  update() { this.t += 0.06; this.life--; return this.life > 0 && !this.collected; }
  draw() { const dy = Math.sin(this.t) * 5; ctx.save(); ctx.translate(this.x, this.y + dy); ctx.globalAlpha = this.life / 60; ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(0, 0, this.r + 2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = { 'shield': '#4dcfff', 'speed': '#ff0', 'coin': '#ffd700', 'freeze': '#8df', 'revive': '#ff6b6b' }[this.type]; ctx.beginPath(); ctx.arc(0, 0, this.r, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#000'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText({ 'shield': '🛡️', 'speed': '👟', 'coin': '🪙', 'freeze': '❄️', 'revive': '👼' }[this.type], 0, 0); ctx.restore(); }
}

// ============================================================ PLAYER
class Player {
  constructor(id, sx) {
    this.id = id; this.x = sx; this.y = cv.height - 100; this.vx = 0; this.vy = 0; this.w = 28; this.h = 35;
    this.onGnd = false; this.inv = 0; this.facing = id === 0 ? 1 : -1; this.t = 0; this.flapC = 0; this.flap = false;
    this.bWob = Math.random() * 10; this.sq = 1; this.st = 1; this.eff = { sh: 0, sp: 0 };
    this.skin = id === 0 ? saved.p1Skin : saved.p2Skin;
    this.bc = P_COLS[id]; this.combo = 0;
  }
  
  isFlap() { return keys[this.id === 0 ? 'ArrowUp' : 'KeyW'] || keys[this.id === 0 ? 'Space' : 'KeyF'] }
  getBP() { return { x: this.x + this.w / 2 + Math.sin(this.bWob) * 4, y: this.y + 11 * DS + Math.sin(this.bWob * .7) * 2.5 - 34, r: 13 }; }
  
  update() {
    this.t += 0.1; this.flap = this.isFlap();
    if (this.eff.sh > 0) this.eff.sh--; if (this.eff.sp > 0) this.eff.sp--;
    const spd = this.eff.sp > 0 ? 6.8 : 5.2;
    if (keys[this.id === 0 ? 'ArrowLeft' : 'KeyA']) { this.vx = -spd; this.facing = -1; }
    else if (keys[this.id === 0 ? 'ArrowRight' : 'KeyD']) { this.vx = spd; this.facing = 1; }
    else this.vx *= 0.76;
    
    this.vx += windSpeed * 0.15;

    if (this.flap) {
      this.flapC += 0.19;
      if (Math.sin(this.flapC) > 0.82 && Math.sin(this.flapC - 0.19) <= 0.82) { this.vy = -5.8; this.st = 0.88; sfxFlap(); }
      if (this.vy > 0) this.vy *= 0.8;
    } else this.flapC = 0;
    
    this.vy += this.flap ? 0.2 : 0.54; this.vy = Math.min(this.vy, 14);
    this.x += this.vx; this.y += this.vy;
    
    const gnd = cv.height - 52;
    if (this.y + this.h >= gnd) {
      if (!this.onGnd && this.vy > 2) sfxLand();
      this.y = gnd - this.h; this.vy = 0; this.onGnd = true;
      if (this.combo > 1) addFText(this.x, this.y - 20, `Combo Ended`, '#aaa');
      this.combo = 0;
    } else this.onGnd = false;
    
    if (this.x < 0) this.x = 0; if (this.x + this.w > cv.width) this.x = cv.width - this.w;
    if (this.y < 0) { this.y = 0; this.vy = 0; }
    this.sq += (1 - this.sq) * 0.18; this.st += (1 - this.st) * 0.18; this.bWob += 0.04;
    if (this.inv > 0) this.inv--;
  }
  
  draw() {
    if (lives[this.id] <= 0) return;
    ctx.save();
    if (this.inv > 0 && Math.floor(this.inv / 4) % 2) ctx.globalAlpha = 0.4;
    const cx = this.x + this.w / 2, by2 = this.y + this.h, bob = (this.onGnd && Math.abs(this.vx) > 0.3) ? Math.sin(this.t * 2.8) * 1.5 : this.flap ? Math.sin(this.t * 2) * 1 : 0;
    
    // Balloon
    const bp = this.getBP();
    if (this.eff.sh > 0) { ctx.strokeStyle = '#4dcfff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(bp.x, bp.y, bp.r + 7, 0, Math.PI * 2); ctx.stroke(); }
    ctx.strokeStyle = '#fff'; ctx.beginPath(); ctx.moveTo(cx, this.y + 11 * DS + bob - 8); ctx.lineTo(bp.x, bp.y + bp.r); ctx.stroke();
    ctx.fillStyle = this.bc.balloon; ctx.beginPath(); ctx.ellipse(bp.x, bp.y, bp.r, bp.r * 1.1, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`P${this.id + 1}`, cx, this.y - 38 + bob);

    // Body
    ctx.translate(cx, by2); ctx.scale(DS / this.sq * this.st, DS * this.sq / this.st);
    
    // Draw Legs swinging with floating bobbing
    const swingLeft = this.onGnd
      ? (Math.abs(this.vx) > 0.3 ? Math.sin(this.t * 3.5) * 0.6 : 0)
      : Math.sin(this.t * 2.0) * 0.35 + 0.1;
    const swingRight = this.onGnd
      ? (Math.abs(this.vx) > 0.3 ? -Math.sin(this.t * 3.5) * 0.6 : 0)
      : Math.sin(this.t * 2.0 + Math.PI) * 0.35 - 0.1;

    ctx.strokeStyle = this.bc.body; ctx.lineWidth = 6; ctx.lineCap = 'round';
    
    // Left Leg
    const lx1 = -6, ly1 = -10;
    const lx2 = lx1 + Math.sin(swingLeft) * 12, ly2 = ly1 + Math.cos(swingLeft) * 12;
    ctx.beginPath(); ctx.moveTo(lx1, ly1); ctx.lineTo(lx2, ly2); ctx.stroke();
    // Left Foot
    ctx.fillStyle = this.bc.nose; ctx.beginPath(); ctx.arc(lx2, ly2, 3.5, 0, Math.PI * 2); ctx.fill();

    // Right Leg
    const rx1 = 6, ry1 = -10;
    const rx2 = rx1 + Math.sin(swingRight) * 12, ry2 = ry1 + Math.cos(swingRight) * 12;
    ctx.beginPath(); ctx.moveTo(rx1, ry1); ctx.lineTo(rx2, ry2); ctx.stroke();
    // Right Foot
    ctx.fillStyle = this.bc.nose; ctx.beginPath(); ctx.arc(rx2, ry2, 3.5, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = this.bc.body; ctx.beginPath(); ctx.ellipse(0, -28, 18, 22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.bc.tummy; ctx.beginPath(); ctx.ellipse(0, -26, 11, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.bc.body; ctx.beginPath(); ctx.ellipse(0, -54, 17, 16, 0, 0, Math.PI * 2); ctx.fill();

    // Skin specifics (Ears/Tail)
    ctx.fillStyle = this.bc.body;
    if (this.skin === 'bear') {
      ctx.beginPath(); ctx.arc(-13, -66, 7, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(13, -66, 7, 0, Math.PI * 2); ctx.fill();
    } else if (this.skin === 'cat') {
      ctx.beginPath(); ctx.moveTo(-16, -55); ctx.lineTo(-20, -75); ctx.lineTo(-5, -65); ctx.fill();
      ctx.beginPath(); ctx.moveTo(16, -55); ctx.lineTo(20, -75); ctx.lineTo(5, -65); ctx.fill();
    } else if (this.skin === 'bunny') {
      ctx.beginPath(); ctx.ellipse(-10, -75, 5, 18, -0.2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(10, -75, 5, 18, 0.2, 0, Math.PI * 2); ctx.fill();
    }
    
    // Face
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(-6, -56, 3.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(6, -56, 3.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-5, -57.5, 1.4, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(7, -57.5, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = this.bc.nose; ctx.beginPath(); ctx.ellipse(0, -49, 5, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    
    // Arms
    const aa = this.flap ? Math.sin(this.flapC) * 0.8 + 0.1 : 0.3;
    ctx.strokeStyle = this.bc.body; ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-11, -38); ctx.lineTo(-11 - Math.sin(aa) * 12, -38 + Math.cos(aa) * 12); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(11, -38); ctx.lineTo(11 + Math.sin(aa) * 12, -38 + Math.cos(aa) * 12); ctx.stroke();

    ctx.restore();
    if (this.eff.sp > 0) { ctx.fillStyle = 'rgba(255,238,0,0.3)'; ctx.beginPath(); ctx.ellipse(cx, by2, 20, 4, 0, 0, Math.PI * 2); ctx.fill(); }
  }
}

// ============================================================ CORE LOGIC
function spawnMonsters(q) {
  curQ = q; const n = q.options.length, sp = cv.width / (n + 1), aggIdx = shuf([0, 1, 2, 3]).slice(0, level > 4 ? 3 : 2);
  q.options.forEach((opt, i) => monsters.push(new Monster(opt, BCOLS[i % BCOLS.length], opt === q.correct, sp * (i + 1), 80 + Math.random() * 100, aggIdx.includes(i))));
}

function spawnHazards() {
  spikes = []; clouds = []; lightnings = [];
  for (let i = 0; i < (level < 3 ? 1 : 2); i++) clouds.push(new Cloud());
  spikes.push(new Spike()); if (level >= 2) spikes.push(new Spike());
  
  weather = (level >= 3 && Math.random() < 0.4) ? (Math.random() < 0.5 ? 'wind' : 'dark') : 'normal';
  windSpeed = weather === 'wind' ? (Math.random() < 0.5 ? 1.5 : -1.5) : 0;
}

function applyItem(type, p) {
  sfxItem();
  if (type === 'shield') p.eff.sh = 400;
  else if (type === 'speed') p.eff.sp = 300;
  else if (type === 'coin') { saved.coins += 50; saveData(); }
  else if (type === 'freeze') monsters.forEach(m => m.frozen = 240);
  else if (type === 'revive') { lives[p.id === 0 ? 1 : 0] = 3; players[p.id === 0 ? 1 : 0].x = cv.width / 2; players[p.id === 0 ? 1 : 0].y = 50; players[p.id === 0 ? 1 : 0].inv = 120; }
}

function addParts(x, y, col, n) { for (let i = 0; i < n; i++) parts.push({ x, y, vx: (Math.random() - .5) * 6, vy: (Math.random() - .5) * 6 - 2, col, sz: 2 + Math.random() * 3, life: 40 }); }
function addFText(x, y, txt, col) { ftexts.push({ x, y, txt, col, vy: -2, life: 60 }); }

function start() {
  monsters = []; parts = []; ftexts = []; score = [0, 0]; lives = [3, 3]; level = 1; used = []; items = []; spikes = []; clouds = []; lightnings = []; boss = null;
  curVocab = VOCAB[cat];
  players = [new Player(0, cv.width * .3)]; if (pCount === 2) players.push(new Player(1, cv.width * .7));
  spawnMonsters(newQ()); spawnHazards(); setGs('playing');
}

function playerHit(p, msg) {
  if (p.inv > 0 || p.eff.sh > 0) return;
  sfxZap();
  if (gMode === 'online') {
    score[p.id] = Math.max(0, score[p.id] - 150);
    if (msg) addFText(p.x, p.y, msg, '#f44');
    addFText(p.x, p.y - 20, '-150', '#f44');
    if (match) match.report(score[p.id], { correct: level - 1 });
    lives[p.id] = 3; p.x = cv.width / 2; p.y = 50; p.inv = 120; p.vx = 0; p.vy = 0;
    return;
  }
  lives[p.id]--; p.inv = 100;
  if (msg) addFText(p.x, p.y, msg, '#f44');
  
  if ((pCount === 1 && lives[0] <= 0) || (pCount === 2 && lives[0] <= 0 && lives[1] <= 0)) {
    saved.coins += Math.floor((score[0] + score[1]) / 10);
    const finalScore = Math.max(score[0], score[1]);
    if (finalScore > saved.hs) saved.hs = finalScore;
    saveData();
    
    sfxGameover();
    
    // ส่งแต้มเข้าระบบโรงเรียน
    if (window.KAMPAI) {
      window.KAMPAI.submitScore(finalScore, {
        mode: 'normal',
        allowResubmit: true,
        level_reached: level,
        is_success: false
      });
    }
    
    setTimeout(() => setGs('gameover'), 3000);
  }
}

function playerTakeDamage(p, msg, col) {
  if (p.inv > 0 || p.eff.sh > 0) return;
  if (gMode === 'online') {
    score[p.id] = Math.max(0, score[p.id] - 150);
    if (msg) addFText(p.x, p.y, msg, col || '#f44');
    addFText(p.x, p.y - 20, '-150', '#f44');
    if (match) match.report(score[p.id], { correct: level - 1 });
    lives[p.id] = 3; p.x = cv.width / 2; p.y = 50; p.inv = 120; p.vx = 0; p.vy = 0;
    return;
  }
  lives[p.id]--; p.inv = 100;
  if (msg) addFText(p.x, p.y, msg, col);
  
  if ((pCount === 1 && lives[0] <= 0) || (pCount === 2 && lives[0] <= 0 && lives[1] <= 0)) {
    saved.coins += Math.floor((score[0] + score[1]) / 10);
    const finalScore = Math.max(score[0], score[1]);
    if (finalScore > saved.hs) saved.hs = finalScore;
    saveData();
    
    sfxGameover();
    
    if (window.parent && window.KAMPAI) {
      window.parent.window.KAMPAI.submitScore(finalScore, {
        mode: 'normal',
        allowResubmit: true,
        level_reached: level,
        is_success: false
      });
    }
    setTimeout(() => setGs('gameover'), 3000);
  }
}

// ============================================================ DRAWING & HUD
let bgT = 0;
function drawBG() {
  bgT += 0.005; const g = ctx.createLinearGradient(0, 0, 0, cv.height); g.addColorStop(0, '#04041a'); g.addColorStop(1, '#101030'); ctx.fillStyle = g; ctx.fillRect(0, 0, cv.width, cv.height);
  for (let i = 0; i < 50; i++) { ctx.fillStyle = `rgba(255,255,255,${0.3 + Math.sin(bgT * 10 + i) * 0.2})`; ctx.beginPath(); ctx.arc((i * 97) % cv.width, (i * 73) % (cv.height * .8), 1, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = '#1a472a'; ctx.fillRect(0, cv.height - 52, cv.width, 52); ctx.fillStyle = '#2d6a4f'; ctx.fillRect(0, cv.height - 52, cv.width, 8);
}

function drawHUD() {
  if (curQ && !boss) {
    const pw = Math.min(500, cv.width * .6), px = cv.width / 2 - pw / 2;
    ctx.fillStyle = 'rgba(0,0,20,.7)'; ctx.beginPath(); ctx.roundRect(px, 8, pw, 65, 10); ctx.fill(); ctx.strokeStyle = '#4ecdc4'; ctx.stroke();
    ctx.fillStyle = '#ffd93d'; ctx.font = '13px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(CAT_NAMES[cat] + ' - หาคำแปลของ:', cv.width / 2, 25);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 24px sans-serif'; ctx.fillText(`"${curQ.correct.c}"`, cv.width / 2, 55);
  }
  if (boss) {
    ctx.fillStyle = '#f44'; ctx.font = 'bold 24px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('⚠️ BOSS BATTLE! ⚠️', cv.width / 2, 30);
  }
  
  players.forEach((p, i) => {
    const hx = i === 0 ? 8 : cv.width - 160, hy = 8;
    ctx.fillStyle = 'rgba(0,0,20,.7)'; ctx.beginPath(); ctx.roundRect(hx, hy, 152, 70, 10); ctx.fill();
    let name = `P${i + 1} ${gMode === 'versus' ? '⚔️' : ''}`;
    if (gMode === 'online' && i === 0 && window.KAMPAI && window.KAMPAI.student) {
      name = window.KAMPAI.student.displayName.split(' ')[0];
    }
    ctx.fillStyle = p.bc.balloon; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'left'; ctx.fillText(name, hx + 10, hy + 20);
    ctx.fillStyle = '#ffd93d'; ctx.fillText(`${score[i]} pts`, hx + 10, hy + 40);
    ctx.font = '14px sans-serif'; let h = ''; for (let j = 0; j < 3; j++) h += j < lives[i] ? '❤️' : '🖤'; ctx.fillText(h, hx + 10, hy + 60);
    if (p.combo > 1) { ctx.fillStyle = '#ff922b'; ctx.font = 'bold 16px sans-serif'; ctx.fillText(`${p.combo}x Combo!`, hx + 10, hy + 90); }
  });
  
  ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(`⭐ Level ${level} | 🪙 ${saved.coins}`, cv.width / 2, cv.height - 20);
  if (weather === 'wind') ctx.fillText(`🌪️ ลมแรง!`, cv.width / 2, cv.height - 40);
}

function drawMenuBase(title, subtitle) {
  drawBG(); ctx.fillStyle = 'rgba(0,0,10,.6)'; ctx.fillRect(0, 0, cv.width, cv.height);
  ctx.textAlign = 'center'; ctx.fillStyle = '#ffd93d'; ctx.font = `bold ${Math.min(46, cv.width * .06)}px sans-serif`; ctx.fillText(title, cv.width / 2, cv.height * .2);
  ctx.fillStyle = '#a8e6e0'; ctx.font = '18px sans-serif'; ctx.fillText(subtitle, cv.width / 2, cv.height * .28);
}

function drawBtn(y, txt, col1, col2) {
  const x = cv.width / 2 - 100, w = 200, h = 50, g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, col1); g.addColorStop(1, col2);
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, w, h, 10); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.font = 'bold 20px sans-serif'; ctx.fillText(txt, x + w / 2, y + h / 2 + 7);
}

// ============================================================ MAIN LOOP
function loop() {
  if (!ctx) return;
  ctx.clearRect(0, 0, cv.width, cv.height);
  
  if (gs === 'menu') {
    drawMenuBase('🐻 บอลลูนไฟเตอร์ 👾', 'Ultimate Edition');
    drawBtn(cv.height * .4, '▶ เริ่มเล่น', '#4cd137', '#44bd32');
    drawBtn(cv.height * .52, '🛒 ร้านค้า', '#fbc531', '#e1b12c');
    drawBtn(cv.height * .64, '🏠 กลับคลังสื่อ', '#9b59b6', '#8e44ad');
    ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`🏆 High Score: ${saved.hs} | 🪙 เหรียญ: ${saved.coins}`, cv.width / 2, cv.height * .78);
  }
  else if (gs === 'modeSelect') {
    drawMenuBase('เลือกโหมดการเล่น', '');
    drawBtn(cv.height * .3, '🐻 1 Player', '#3498db', '#2980b9');
    drawBtn(cv.height * .41, '🤝 2P Co-op', '#9b59b6', '#8e44ad');
    drawBtn(cv.height * .52, '⚔️ 2P Versus', '#e74c3c', '#c0392b');
    drawBtn(cv.height * .63, '🌐 เล่นออนไลน์', '#2ecc71', '#27ae60');
    drawBtn(cv.height * .75, 'กลับ', '#7f8c8d', '#95a5a6');
  }
  else if (gs === 'catSelect') {
    drawMenuBase('เลือกหมวดหมู่คำศัพท์', '');
    drawBtn(cv.height * .3, '👑 ราชาศัพท์', '#f1c40f', '#f39c12');
    drawBtn(cv.height * .42, '📜 สำนวนไทย', '#1abc9c', '#16a085');
    drawBtn(cv.height * .54, '🇬🇧 ภาษาอังกฤษ', '#e67e22', '#d35400');
    drawBtn(cv.height * .7, 'กลับ', '#7f8c8d', '#95a5a6');
  }
  else if (gs === 'shop') {
    drawMenuBase('🛒 ร้านค้าสกิน', 'สะสมเหรียญเพื่อปลดล็อก!');
    ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(`🪙 เหรียญของคุณ: ${saved.coins}`, cv.width / 2, cv.height * .35);
    const skins = [{ id: 'bear', n: 'หมี', c: 0, e: '🐻' }, { id: 'cat', n: 'แมว', c: 500, e: '🐱' }, { id: 'bunny', n: 'กระต่าย', c: 1000, e: '🐰' }];
    skins.forEach((s, i) => {
      const bx = cv.width / 2 - 150 + i * 150, unlocked = saved.skins.includes(s.id);
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.beginPath(); ctx.roundRect(bx - 60, cv.height * .45, 120, 150, 10); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '40px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(s.e, bx, cv.height * .53);
      ctx.font = '16px sans-serif'; ctx.fillText(s.n, bx, cv.height * .58);
      
      // Equip P1
      ctx.fillStyle = saved.p1Skin === s.id ? '#2ecc71' : (unlocked ? '#3498db' : '#e74c3c');
      ctx.beginPath(); ctx.roundRect(bx - 40, cv.height * .6, 80, 30, 5); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '14px sans-serif'; ctx.fillText(unlocked ? (saved.p1Skin === s.id ? 'P1 ✔️' : 'P1 ใช้') : `🪙 ${s.c}`, bx, cv.height * .6 + 20);
      
      // Equip P2
      if (unlocked) {
        ctx.fillStyle = saved.p2Skin === s.id ? '#2ecc71' : '#9b59b6';
        ctx.beginPath(); ctx.roundRect(bx - 40, cv.height * .68, 80, 30, 5); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.fillText(saved.p2Skin === s.id ? 'P2 ✔️' : 'P2 ใช้', bx, cv.height * .68 + 20);
      }
    });
    drawBtn(cv.height * .8, 'กลับ', '#7f8c8d', '#95a5a6');
  }
  else if (gs === 'gameover') {
    drawBG(); ctx.fillStyle = 'rgba(0,0,10,.8)'; ctx.fillRect(0, 0, cv.width, cv.height);
    ctx.fillStyle = '#f44'; ctx.font = 'bold 50px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('จบเกม!', cv.width / 2, cv.height * .3);
    players.forEach((p, i) => { ctx.fillStyle = p.bc.balloon; ctx.font = '24px sans-serif'; ctx.fillText(`P${i + 1}: ${score[i]} pts`, cv.width / 2, cv.height * .45 + i * 40); });
    if (gMode === 'versus') { ctx.fillStyle = '#ffd93d'; ctx.font = 'bold 30px sans-serif'; ctx.fillText(score[0] > score[1] ? 'P1 WIN!' : score[1] > score[0] ? 'P2 WIN!' : 'DRAW!', cv.width / 2, cv.height * .65); }
    ctx.fillStyle = '#fff'; ctx.font = '16px sans-serif'; ctx.fillText('คลิกเพื่อกลับเมนูหลัก', cv.width / 2, cv.height * .8);
  }
  else if (gs === 'playing') {
    drawBG();

    if (level % 5 === 0 && !boss && monsters.length === 0) { boss = new Boss(); sfxLevelUp(); }

    clouds.forEach(c => { const b = c.update(); if (b) lightnings.push(b); c.draw(); });
    lightnings = lightnings.filter(l => {
      const a = l.update(); l.draw();
      if (a) { players.forEach(p => { if (lives[p.id] > 0 && l.hits(p)) playerHit(p, '⚡ โดนฟ้าผ่า!'); }); }
      return a;
    });
    spikes.forEach(s => { s.update(); s.draw(); players.forEach(p => { if (lives[p.id] > 0 && s.hits(p)) playerHit(p, '🔴 โดนหนาม!'); }); });

    if (gMode === 'versus' && lives[0] > 0 && lives[1] > 0) {
      const dx = players[0].x - players[1].x, dy = players[0].y - players[1].y, dist = Math.hypot(dx, dy);
      if (dist < 30) { players[0].vx = dx * 0.2; players[1].vx = -dx * 0.2; players[0].vy = dy * 0.2; players[1].vy = -dy * 0.2; pn(0.05, 0.2, 800); }
    }

    if (pCount === 2 && gMode === 'coop' && (lives[0] <= 0 || lives[1] <= 0) && (lives[0] > 0 || lives[1] > 0)) {
      if (Math.random() < 0.002 && !items.find(i => i.type === 'revive')) items.push(new Item('revive'));
    }

    items = items.filter(i => {
      const a = i.update(); i.draw();
      if (a && !i.collected) { players.forEach(p => { if (lives[p.id] <= 0) return; if (Math.hypot(p.x + p.w / 2 - i.x, p.y + p.h / 2 - i.y) < 28) { i.collected = true; applyItem(i.type, p); addFText(i.x, i.y, '+ ไอเทม!', '#ff0'); } }); }
      return a && !i.collected;
    });
    itemTimer--; if (itemTimer <= 0 && items.length < 2) { items.push(new Item()); itemTimer = 400 + Math.random() * 200; }

    if (boss) {
      boss.update(); boss.draw();
      players.forEach(p => { if (lives[p.id] > 0) boss.checkStomp(p); });
    } else {
      monsters.forEach(m => {
        if (!m.popped) m.update(); m.draw();
        if (!m.popped) {
          players.forEach(p => {
            if (lives[p.id] <= 0) return;
            // Stomp
            if (m.checkStomp(p)) {
              p.vy = -9; p.sq = 1.3; m.popped = true; sfxStomp(); addParts(m.bx, m.by, m.col, 20);
              if (m.isCorrect) {
                p.combo++;
                const pts = (100 + level * 50) * p.combo; score[p.id] += pts; sfxCorrect();
                if (gMode === 'online' && match) {
                  match.report(score[p.id], { correct: level - 1 });
                }
                addFText(m.x, m.y, `+${pts} (${p.combo}x)`, `#6bcb77`);
                
                // ออกเสียงสะกดคำผ่าน TTS SDK
                if (window.KAMPAI && window.KAMPAI.sound) {
                  window.KAMPAI.sound.speak(m.opt.r, 'th-TH', true);
                }
                
                // ทำให้มอนสเตอร์ตัวอื่น ๆ หายไปทันทีเพื่อความปลอดภัยของผู้เล่นขณะฟังเสียงอ่านคำศัพท์
                monsters.forEach(otherM => otherM.popped = true);
                
                setTimeout(() => { monsters = []; level++; sfxLevelUp(); if (level % 5 !== 0) { spawnMonsters(newQ()); spawnHazards(); } }, 2200);
              } else { sfxWrong(); addFText(m.x, m.y, '✗ ผิด!', '#f44'); playerHit(p, ''); }
            }
            // Hit by monster
            if (m.checkHitP(p)) { playerHit(p, '💥 บอลลูนแตก!'); }
          });
        }
      });
    }

    players.forEach(p => { if (lives[p.id] > 0) { p.update(); p.draw(); } });

    if (weather === 'dark') {
      ctx.save();
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = 'rgba(0,0,0,0)'; ctx.fillRect(0, 0, cv.width, cv.height);
      players.forEach(p => { if (lives[p.id] > 0) { const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 200); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, 200, 0, Math.PI * 2); ctx.fill(); } });
      if (boss) { const g = ctx.createRadialGradient(boss.x, boss.y, 0, boss.x, boss.y, 150); g.addColorStop(0, '#fff'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(boss.x, boss.y, 150, 0, Math.PI * 2); ctx.fill(); }
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(0,0,10,0.85)'; ctx.fillRect(0, 0, cv.width, cv.height);
      ctx.restore();
    }

    parts = parts.filter(p => p.life > 0); parts.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.15; ctx.globalAlpha = p.life / 40; ctx.fillStyle = p.col; ctx.beginPath(); ctx.arc(p.x, p.y, p.sz, 0, Math.PI * 2); ctx.fill(); p.life--; }); ctx.globalAlpha = 1;
    ftexts = ftexts.filter(t => t.life > 0); ftexts.forEach(t => { t.y += t.vy; ctx.globalAlpha = t.life / 60; ctx.fillStyle = t.col; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center'; ctx.fillText(t.txt, t.x, t.y); t.life--; }); ctx.globalAlpha = 1;

    drawHUD();
    if (screenFlashA > 0) { ctx.fillStyle = screenFlashCol; ctx.globalAlpha = screenFlashA; ctx.fillRect(0, 0, cv.width, cv.height); ctx.globalAlpha = 1; screenFlashA -= 0.05; }
  }
  requestAnimationFrame(loop);
}

// --- เริ่มต้นการรัน loop ---
window.onload = loop;

// ============================================================ KAMPAI SDK BINDINGS
if (window.KAMPAI) {
  window.KAMPAI.setSlug(config.SLUG);
  window.KAMPAI.onReady(function (k) {
    if (k.sound) {
      k.sound.mountToggles();
      
      // Override BGM play actions to sync with KAMPAI 🎵 toggle
      k.sound.bgmStart = function () {
        playBGM(gs === 'playing' ? 'play' : 'menu');
      };
      k.sound.bgmStop = function () {
        stopBGM();
      };
    }
  });
}

// ============================================================ KAMPAI ONLINE MATCHMAKING
if (config.ENABLE_ONLINE && window.KampaiMatch) {
  match = KampaiMatch.create({
    duration: config.ONLINE_DURATION || 60,
    title: 'แข่งสะกดคำบอลลูน',
    onPlay: function ({ rng }) {
      onlineRng = rng;
      pCount = 1;
      gMode = 'online';
      
      // สุ่มเลือกหมวดคำศัพท์ด้วย rng เพื่อให้ตรงกันทุกเครื่อง
      const cats = ['raja', 'idiom', 'eng'];
      cat = cats[Math.floor(rng() * cats.length)];
      
      start();
    },
    onEnd: function () {
      setGs('gameover');
    }
  });
}

function openOnline() {
  if (match) match.openMenu();
}
