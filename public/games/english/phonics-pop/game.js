/* game.js — Phonics Pop Game Logic */

const CFG = window.GAME_CONFIG;
const DATA = window.GAME_DATA;

KAMPAI.setSlug(CFG.SLUG);
if (CFG.BGM) {
  KAMPAI.sound.defaultBgm(CFG.BGM);
}

// ═══ State Variables ═══
let currentMode = null; // 'letters', 'blends', 'words'
let currentLevel = 1;
let score = 0;
let lives = CFG.LIVES;
let combo = 1;
let comboStreak = 0;
let isOver = false;
let isPlaying = false;

let activeBalloons = [];
let targetItem = null;
let animationFrameId = null;
let correctCount = 0;
let soundTimeout = null;

// Confetti Setup
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
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

KAMPAI.onReady(function () {
  renderPlayer();
  renderMyStats();
  renderLeaderboard('score-list');
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
  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#ff7849', '#ffc82c'];
  for (let i = 0; i < 60; i++) {
    confettiParticles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15 - 5,
      radius: Math.random() * 5 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10
    });
  }
}

function updateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = confettiParticles.length - 1; i >= 0; i--) {
    const p = confettiParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.4; // gravity
    p.alpha -= 0.015;
    p.rotation += p.rotationSpeed;

    if (p.alpha <= 0) {
      confettiParticles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation * Math.PI / 180);
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
    ctx.restore();
  }
}

// ═══ Balloon Burst Effect ═══
function createBurst(x, y, color) {
  const container = document.getElementById('game-area');
  for (let i = 0; i < 15; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.background = color;
    particle.style.left = x + 'px';
    particle.style.top = y + 'px';
    particle.style.width = Math.random() * 8 + 6 + 'px';
    particle.style.height = particle.style.width;

    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 8 + 4;
    const destX = Math.cos(angle) * speed * 15;
    const destY = Math.sin(angle) * speed * 15;

    particle.style.setProperty('--x', destX + 'px');
    particle.style.setProperty('--y', destY + 'px');

    container.appendChild(particle);
    setTimeout(() => particle.remove(), 500);
  }
}

// ═══ Audio playback ═══
function sayTarget() {
  if (!targetItem) return;
  
  // Show sound wave animation
  const wave = document.getElementById('sound-wave');
  wave.classList.add('active');
  if (soundTimeout) clearTimeout(soundTimeout);
  
  soundTimeout = setTimeout(() => {
    wave.classList.remove('active');
  }, 1200);

  // Play target sound
  KAMPAI.sound.speak(targetItem.speak, 'en');
}

function replaySound() {
  sayTarget();
}

// ═══ Gameplay Functions ═══
function startGame(mode) {
  currentMode = mode;
  currentLevel = 1;
  score = 0;
  lives = CFG.LIVES;
  combo = 1;
  comboStreak = 0;
  correctCount = 0;
  isOver = false;
  isPlaying = true;
  activeBalloons = [];

  document.getElementById('blocker').style.display = 'none';
  document.getElementById('hud').style.display = 'flex';
  document.getElementById('level-value').innerText = currentLevel;
  document.getElementById('score-value').innerText = score;
  updateLivesDisplay();

  KAMPAI.sound.bgmStart();
  
  // Clear previous balloons
  document.getElementById('balloon-container').innerHTML = '';

  setTimeout(() => {
    pickRound();
    tick();
  }, 500);
}

function updateLivesDisplay() {
  const container = document.getElementById('life-container');
  let hearts = '';
  for (let i = 0; i < CFG.LIVES; i++) {
    if (i < lives) {
      hearts += '❤️';
    } else {
      hearts += '🤍';
    }
  }
  container.innerHTML = hearts;
}

function getItemsForMode() {
  if (currentMode === 'letters') return DATA.LETTERS;
  if (currentMode === 'blends') return DATA.BLENDS;
  return DATA.CVC_WORDS;
}

function pickRound() {
  if (isOver) return;

  const dataset = getItemsForMode();
  if (!dataset || dataset.length === 0) return;

  // Pick target
  targetItem = dataset[Math.floor(Math.random() * dataset.length)];

  // Set emoji hint for Words mode
  const hintEl = document.getElementById('emoji-hint');
  if (currentMode === 'words' && targetItem.emoji) {
    hintEl.innerText = targetItem.emoji;
    hintEl.style.display = 'block';
  } else {
    hintEl.style.display = 'none';
  }

  // Pick distractors
  const distractors = [];
  while (distractors.length < CFG.BALLOONS_PER_ROUND - 1) {
    const candidate = dataset[Math.floor(Math.random() * dataset.length)];
    if (candidate.id !== targetItem.id && !distractors.some(d => d.id === candidate.id)) {
      distractors.push(candidate);
    }
  }

  // Combine and shuffle
  const roundItems = [targetItem, ...distractors];
  roundItems.sort(() => Math.random() - 0.5);

  // Clear balloon container DOM
  const container = document.getElementById('balloon-container');
  container.innerHTML = '';
  activeBalloons = [];

  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#ff7849', '#ff6b6b'];
  const gameWidth = container.clientWidth || window.innerWidth;
  const spacing = gameWidth / CFG.BALLOONS_PER_ROUND;

  // Level speed factor
  const speed = CFG.BALLOON_SPEED_START + (currentLevel - 1) * 0.18;
  const clampedSpeed = Math.min(speed, CFG.BALLOON_SPEED_MAX);

  roundItems.forEach((item, index) => {
    const balloon = document.createElement('div');
    balloon.className = 'balloon';
    
    // Label text
    const displayVal = item.display || item.word || item.id;
    if (displayVal.length > 5) {
      balloon.classList.add('long-text');
    }
    
    balloon.innerHTML = `<span class="balloon-text">${displayVal}</span>`;
    
    // Position
    const randomOffset = (Math.random() - 0.5) * 15; // slight variance
    const posX = spacing * index + spacing / 2 - 45 + randomOffset;
    const posY = -120 - (Math.random() * 80); // staggered starting heights below screen

    balloon.style.left = Math.max(10, Math.min(gameWidth - 100, posX)) + 'px';
    balloon.style.bottom = posY + 'px';
    
    // Color
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    balloon.style.background = randomColor;
    
    // Click / Touch event
    balloon.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      onPop(item, balloon, posX + 45, window.innerHeight - (posY + 55), randomColor);
    });

    container.appendChild(balloon);

    activeBalloons.push({
      el: balloon,
      x: posX,
      y: posY,
      speed: clampedSpeed + (Math.random() * 0.25), // slight individual speed variance
      item: item,
      isTarget: item.id === targetItem.id,
      color: randomColor
    });
  });

  sayTarget();
}

function onPop(item, element, clientX, clientY, color) {
  if (isOver || element.classList.contains('wrong') || element.classList.contains('correct')) return;

  if (item.id === targetItem.id) {
    // Correct balloon popped!
    element.classList.add('correct');
    
    // Animation & Confetti
    createBurst(clientX, clientY, color);
    spawnConfetti(clientX, clientY);
    
    // Scoring & Combo
    score += CFG.BASE_SCORE * combo;
    document.getElementById('score-value').innerText = score;
    const scoreContainer = document.getElementById('score-container');
    scoreContainer.classList.add('pop');
    setTimeout(() => scoreContainer.classList.remove('pop'), 150);

    // Increase combo
    comboStreak++;
    if (comboStreak >= CFG.COMBO_STEP) {
      combo = Math.min(combo + 1, CFG.COMBO_MAX);
      showComboBadge();
    }

    // Level progression
    correctCount++;
    if (correctCount % CFG.LEVEL_EVERY === 0) {
      currentLevel++;
      document.getElementById('level-value').innerText = currentLevel;
    }

    KAMPAI.sound.correct();
    
    // Clear balloons
    activeBalloons = [];
    document.getElementById('balloon-container').innerHTML = '';

    // Next round
    setTimeout(pickRound, 1000);
  } else {
    // Wrong balloon popped!
    element.classList.add('wrong');
    KAMPAI.sound.wrong();
    
    // Reset combo
    combo = 1;
    comboStreak = 0;
    hideComboBadge();

    // Damage / lives
    lives--;
    updateLivesDisplay();
    flashScreenRed();

    if (lives <= 0) {
      endGame();
    }
  }
}

function flashScreenRed() {
  document.body.style.transition = 'none';
  document.body.style.background = '#fca5a5';
  setTimeout(() => {
    document.body.style.transition = 'background 0.5s ease';
    document.body.style.background = 'linear-gradient(180deg, #a1c4fd 0%, #c2e9fb 100%)';
  }, 100);
}

function showComboBadge() {
  const badge = document.getElementById('combo-badge');
  badge.innerText = `Combo x${combo}! 🔥`;
  badge.classList.add('show');
}

function hideComboBadge() {
  document.getElementById('combo-badge').classList.remove('show');
}

// ═══ Main Game Loop ═══
function tick() {
  if (isOver) return;

  const containerHeight = window.innerHeight;
  let targetEscaped = false;

  for (let i = activeBalloons.length - 1; i >= 0; i--) {
    const b = activeBalloons[i];
    b.y += b.speed;
    b.el.style.bottom = b.y + 'px';

    // If balloon escapes the top of the screen
    if (b.y > containerHeight + 120) {
      b.el.remove();
      
      if (b.isTarget) {
        targetEscaped = true;
      }
      
      activeBalloons.splice(i, 1);
    }
  }

  // If correct balloon escaped without being popped
  if (targetEscaped) {
    KAMPAI.sound.wrong();
    lives--;
    updateLivesDisplay();
    flashScreenRed();
    
    combo = 1;
    comboStreak = 0;
    hideComboBadge();

    if (lives <= 0) {
      endGame();
    } else {
      activeBalloons.forEach(b => b.el.remove());
      activeBalloons = [];
      setTimeout(pickRound, 1000);
    }
  }

  // Update canvas confetti particles
  updateConfetti();

  animationFrameId = requestAnimationFrame(tick);
}

function endGame() {
  if (isOver) return;
  isOver = true;
  isPlaying = false;

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (soundTimeout) {
    clearTimeout(soundTimeout);
  }

  try {
    window.speechSynthesis && window.speechSynthesis.cancel();
  } catch (e) {}

  KAMPAI.sound.gameOver();
  KAMPAI.sound.bgmStop();

  // Save score to SDK
  KAMPAI.submitScore(score, { mode: currentMode, level: currentLevel });

  // Calculate Stars
  let stars = 0;
  if (score >= CFG.STAR_THRESHOLDS[2]) stars = 3;
  else if (score >= CFG.STAR_THRESHOLDS[1]) stars = 2;
  else if (score >= CFG.STAR_THRESHOLDS[0]) stars = 1;

  const starRow = document.getElementById('star-row');
  let starStr = '';
  for (let i = 1; i <= 3; i++) {
    if (i <= stars) starStr += '⭐';
    else starStr += '☆';
  }
  starRow.innerText = starStr;

  document.getElementById('final-score').innerText = score;
  
  let modeName = currentMode === 'letters' ? 'Letters' : (currentMode === 'blends' ? 'Blends' : 'Words');
  document.getElementById('go-summary').innerText = `โหมด: ${modeName} · เลเวลสูงสุด: ${currentLevel}`;

  // Hide HUD & show GameOver
  document.getElementById('hud').style.display = 'none';
  document.getElementById('gameover-screen').style.display = 'flex';
  
  renderLeaderboard('score-list-gameover');
}
