/* game.js — Rhythm Master Game Logic */

const CFG = window.GAME_CONFIG;
const DATA = window.GAME_DATA;

KAMPAI.setSlug(CFG.SLUG);
if (CFG.BGM) {
  KAMPAI.sound.defaultBgm(CFG.BGM);
}

// ═══ Web Audio API Synth ═══
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playHitSynth(type) {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'normal') { // Red note - low pitch drum
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.6, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else { // Blue note - high pitch woodblock
      osc.frequency.setValueAtTime(480, ctx.currentTime);
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    }
  } catch (e) {
    // fallback if web audio blocked
  }
}

// ═══ State Variables ═══
let currentSong = null;
let score = 0;
let lives = CFG.LIVES;
let combo = 0;
let isOver = false;
let isPlaying = false;

let notesList = []; // copies from song data with state: hit, missed, element
let startTime = 0;
let animFrameId = null;
let hitFeedbackTimeout = null;

const trackWidth = 900; // base max width
const hitZoneX = 100;   // hit target left position
const speedFactor = 280; // px per second

// Confetti Setup
const canvas = document.getElementById('confetti-canvas');
const ctxCanvas = canvas.getContext('2d');
let confettiParticles = [];

// ═══ UI Helpers & Leaderboard ═══
function renderPlayer() {
  const s = KAMPAI.student, st = KAMPAI.stats;
  if (!s) return;
  const chip = document.getElementById('player-chip');
  const av = s.photoUrl ? `<img src="${s.photoUrl}" alt="">` : `<div class="pc-init">${(s.displayName||'?')[0]}</div>`;
  const best = st ? ` · <span class="pc-best">สถิติ ${st.personalBest.toLocaleString()}</span>` : '';
  chip.innerHTML = av + `<span>${s.displayName}${best}</span>`;
  chip.style.display = 'flex';
}

function renderMyStats() {
  const st = KAMPAI.stats;
  if (!st) return;
  document.getElementById('ms-best').innerText = (st.personalBest || 0).toLocaleString();
  document.getElementById('ms-plays').innerText = (st.playsCount || 0).toLocaleString();
  document.getElementById('my-stats').style.display = 'flex';
}

function renderLeaderboard(listId) {
  const el = document.getElementById(listId);
  if (!el) return;
  const rows = KAMPAI.leaderboard || [];
  if (!rows.length) {
    el.innerHTML = '<li class="lb-loading">ยังไม่มีผู้เล่น — เป็นคนแรกสิ!</li>';
    return;
  }
  const medals = ['🥇','🥈','🥉'];
  el.innerHTML = rows.slice(0, 5).map((r) => {
    const av = r.photoUrl ? `<img class="lb-avatar" src="${r.photoUrl}" alt="">` : `<div class="lb-avatar-init">${(r.displayName||'?')[0]}</div>`;
    return `<li class="${r.isMe ? 'is-me' : ''}">
      <span class="lb-rank">${medals[r.rank-1] || r.rank}</span>${av}
      <div class="lb-info"><div class="lb-name">${r.displayName}${r.isMe ? ' (คุณ)' : ''}</div>
      <div class="lb-sub">${(r.personalBest||0).toLocaleString()} คะแนน · ${r.classLabel||''}</div></div>
    </li>`;
  }).join('');
}

function renderSongs() {
  const container = document.getElementById('song-list');
  if (!container) return;

  container.innerHTML = DATA.SONGS.map(s => {
    const isCompleted = localStorage.getItem(`rm_completed_${s.id}`) === 'true';
    const checkBadge = isCompleted ? ' ✅' : '';
    return `<div class="song-card" onclick="selectSong('${s.id}')">
      <span class="sc-emoji">${s.emoji}</span>
      <div class="sc-info">
        <span class="sc-title">${s.name}${checkBadge}</span>
        <span class="sc-desc">${s.description}</span>
        <div class="sc-meta">
          <span class="sc-diff" style="background:${s.diffColor}">${s.difficulty}</span>
          <span class="sc-bpm">${s.bpm} BPM</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

KAMPAI.onReady(function () {
  renderPlayer();
  renderMyStats();
  renderLeaderboard('score-list');
  renderSongs();
});
KAMPAI.sound.mountToggles();

// ═══ Confetti Engine ═══
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function spawnConfetti(x, y) {
  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#a855f7'];
  for (let i = 0; i < 30; i++) {
    confettiParticles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 10 - 3,
      radius: Math.random() * 4 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 6
    });
  }
}

function updateConfetti() {
  ctxCanvas.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = confettiParticles.length - 1; i >= 0; i--) {
    const p = confettiParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.3;
    p.alpha -= 0.02;
    p.rotation += p.rotationSpeed;

    if (p.alpha <= 0) {
      confettiParticles.splice(i, 1);
      continue;
    }

    ctxCanvas.save();
    ctxCanvas.translate(p.x, p.y);
    ctxCanvas.rotate(p.rotation * Math.PI / 180);
    ctxCanvas.globalAlpha = p.alpha;
    ctxCanvas.fillStyle = p.color;
    ctxCanvas.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
    ctxCanvas.restore();
  }
}

function drawLoop() {
  if (isOver) return;
  updateConfetti();
  requestAnimationFrame(drawLoop);
}

// ═══ Keyboard Listeners ═══
window.addEventListener('keydown', (e) => {
  if (!isPlaying || isOver) return;

  if (e.code === 'Space') {
    e.preventDefault();
    triggerHit('normal');
  } else if (e.code === 'Enter') {
    e.preventDefault();
    triggerHit('gold');
  }
});

// ═══ Game Engine ═══
function selectSong(songId) {
  currentSong = DATA.SONGS.find(s => s.id === songId);
  if (!currentSong) return;

  // Initialize Web Audio
  getAudioContext();

  score = 0;
  lives = CFG.LIVES;
  combo = 0;
  isOver = false;
  isPlaying = true;

  document.getElementById('blocker').style.display = 'none';
  document.getElementById('hud').style.display = 'flex';
  document.getElementById('play').style.display = 'flex';
  document.getElementById('score-value').innerText = score;
  document.getElementById('combo-value').innerText = combo;
  updateLivesDisplay();

  // Load Notes
  const track = document.getElementById('notes-track');
  track.innerHTML = '';
  
  notesList = currentSong.notes.map((n, idx) => {
    const el = document.createElement('div');
    el.className = `note note-${n.type}`;
    el.id = `note-element-${idx}`;
    el.innerHTML = n.type === 'normal' ? '🔴' : '🔵';
    track.appendChild(el);

    return {
      time: n.time,
      type: n.type,
      hit: false,
      missed: false,
      el: el
    };
  });

  KAMPAI.sound.bgmStart();
  startTime = Date.now();
  
  setTimeout(() => {
    tick();
    drawLoop();
  }, 500);
}

function updateLivesDisplay() {
  const container = document.getElementById('life-container');
  let hearts = '';
  for (let i = 0; i < CFG.LIVES; i++) {
    hearts += i < lives ? '❤️' : '🤍';
  }
  container.innerHTML = hearts;
}

function triggerHit(type) {
  if (isOver || !isPlaying) return;

  const elapsedTime = (Date.now() - startTime) / 1000;
  
  // Find closest un-hit note matching type
  let closestNote = null;
  let minDiff = Infinity;

  notesList.forEach(n => {
    if (n.hit || n.missed) return;
    const diff = Math.abs(elapsedTime - n.time);
    if (diff < minDiff) {
      minDiff = diff;
      closestNote = n;
    }
  });

  // visual key hit target feedback
  const target = document.getElementById('hit-target');
  const activeClass = type === 'normal' ? 'active-red' : 'active-blue';
  target.className = activeClass;
  if (hitFeedbackTimeout) clearTimeout(hitFeedbackTimeout);
  hitFeedbackTimeout = setTimeout(() => {
    target.className = '';
  }, 80);

  // Play audio feed back synthesiser
  playHitSynth(type);

  if (!closestNote) return;

  // Max hit tolerance is GOOD threshold (0.25s)
  const limit = CFG.ACCURACY_MS.GOOD / 1000;
  if (minDiff > limit) return; // too early or too late, do nothing (wait for note to pass for miss)

  // Verify type match
  if (closestNote.type !== type) {
    // Incorrect color tap counts as miss
    closestNote.missed = true;
    closestNote.el.remove();
    showRating('miss');
    resetCombo();
    lives--;
    updateLivesDisplay();
    flashTargetRed();
    if (lives <= 0) endGame();
    checkSongFinish();
    return;
  }

  // Calculate Rating
  closestNote.hit = true;
  closestNote.el.remove();

  const perfectLimit = CFG.ACCURACY_MS.PERFECT / 1000;
  const greatLimit = CFG.ACCURACY_MS.GREAT / 1000;
  
  let rating = 'good';
  let points = CFG.BASE_SCORE;

  if (minDiff <= perfectLimit) {
    rating = 'perfect';
    points = CFG.BASE_SCORE * 2;
    spawnConfetti(hitZoneX + 45, window.innerHeight / 2);
  } else if (minDiff <= greatLimit) {
    rating = 'great';
    points = Math.round(CFG.BASE_SCORE * 1.5);
  }

  // Combo calculation
  combo++;
  document.getElementById('combo-value').innerText = combo;
  const comboEl = document.getElementById('combo-container');
  comboEl.classList.add('pop');
  setTimeout(() => comboEl.classList.remove('pop'), 80);

  // Combo Score Multiplier
  const comboMultiplier = Math.min(
    CFG.COMBO_MULTIPLIER_MAX, 
    1 + Math.floor(combo / CFG.COMBO_MULTIPLIER_STEP)
  );
  
  score += points * comboMultiplier;
  document.getElementById('score-value').innerText = score;
  const scoreEl = document.getElementById('score-container');
  scoreEl.style.transform = 'scale(1.15)';
  setTimeout(() => scoreEl.style.transform = 'scale(1)', 100);

  showRating(rating);
  checkSongFinish();
}

function showRating(rating) {
  const ratingEl = document.getElementById('rating-text');
  ratingEl.innerText = rating.toUpperCase();
  ratingEl.className = `rate-${rating} animate`;
  
  // Clone element to reset animation
  const newEl = ratingEl.cloneNode(true);
  ratingEl.parentNode.replaceChild(newEl, ratingEl);
}

function resetCombo() {
  combo = 0;
  document.getElementById('combo-value').innerText = combo;
}

function flashTargetRed() {
  const target = document.getElementById('hit-target');
  target.style.borderColor = '#ef4444';
  target.style.boxShadow = '0 0 20px #ef4444';
  setTimeout(() => {
    target.style.borderColor = '';
    target.style.boxShadow = '';
  }, 150);
}

function checkSongFinish() {
  const allProcessed = notesList.every(n => n.hit || n.missed);
  if (allProcessed) {
    setTimeout(completeSong, 1500);
  }
}

// Main frame loop
function tick() {
  if (isOver || !isPlaying) return;

  const elapsedTime = (Date.now() - startTime) / 1000;
  const maxLimit = CFG.ACCURACY_MS.GOOD / 1000; // pass boundary for miss

  let hasMissed = false;

  notesList.forEach(n => {
    if (n.hit || n.missed) return;

    // Time-based horizontal scroll position
    const diffTime = n.time - elapsedTime;
    const x = hitZoneX + diffTime * speedFactor;

    if (x < -60) {
      // Note has scrolled off screen - register Miss
      n.missed = true;
      n.el.remove();
      hasMissed = true;
    } else {
      n.el.style.left = x + 'px';
    }
  });

  if (hasMissed) {
    showRating('miss');
    resetCombo();
    lives--;
    updateLivesDisplay();
    flashTargetRed();
    if (lives <= 0) {
      endGame();
      return;
    }
    checkSongFinish();
  }

  animFrameId = requestAnimationFrame(tick);
}

function completeSong() {
  if (isOver) return;
  isOver = true;
  isPlaying = false;

  if (animFrameId) cancelAnimationFrame(animFrameId);

  KAMPAI.sound.gameOver();
  KAMPAI.sound.bgmStop();

  // Mark completion
  localStorage.setItem(`rm_completed_${currentSong.id}`, 'true');

  // Submit score
  KAMPAI.submitScore(score, { mode: 'song', songId: currentSong.id });

  // Calculate Stars
  let stars = 0;
  if (score >= CFG.STAR_THRESHOLDS[2]) stars = 3;
  else if (score >= CFG.STAR_THRESHOLDS[1]) stars = 2;
  else if (score >= CFG.STAR_THRESHOLDS[0]) stars = 1;

  const starDiv = document.getElementById('star-display');
  let starStr = '';
  for (let i = 1; i <= 3; i++) {
    starStr += i <= stars ? '⭐' : '☆';
  }
  starDiv.innerText = starStr;

  document.getElementById('final-score').innerText = score;
  document.getElementById('go-summary').innerText = `เพลง: ${currentSong.name} · ความถูกต้องยอดเยี่ยม!`;

  document.getElementById('hud').style.display = 'none';
  document.getElementById('play').style.display = 'none';
  document.getElementById('gameover-screen').style.display = 'flex';

  renderLeaderboard('score-list-gameover');
}

function endGame() {
  if (isOver) return;
  isOver = true;
  isPlaying = false;

  if (animFrameId) cancelAnimationFrame(animFrameId);

  KAMPAI.sound.gameOver();
  KAMPAI.sound.bgmStop();

  KAMPAI.submitScore(score, { mode: 'failed', songId: currentSong.id });

  document.getElementById('star-display').innerText = '☆☆☆';
  document.getElementById('go-title').innerText = '😢 พยายามอีกครั้ง!';
  document.getElementById('final-score').innerText = score;
  document.getElementById('go-summary').innerText = `พลังชีวิตหมดในเพลง: ${currentSong.name}`;

  document.getElementById('hud').style.display = 'none';
  document.getElementById('play').style.display = 'none';
  document.getElementById('gameover-screen').style.display = 'flex';

  renderLeaderboard('score-list-gameover');
}
