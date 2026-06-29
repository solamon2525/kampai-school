/* game.js — ตัวอย่างเกม + wiring KampaiOrient / KAMPAI SDK */

const CFG = window.GAME_CONFIG;
const DATA = window.GAME_DATA;

KAMPAI.setSlug(CFG.SLUG);
KAMPAI.sound.defaultBgm(CFG.BGM);

const ORIENT_LABELS = { any: '📐 any', portrait: '📱 portrait', landscape: '🖥️ landscape' };

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let cw = 0, ch = 0;
let score = 0, lives = CFG.LIVES, isGameOver = false, started = false;
let basketX = 0, stars = [], spawnTs = 0;

function resizeCanvas() {
  const v = KampaiOrient.getViewportSize();
  cw = canvas.width = Math.floor(v.w);
  ch = canvas.height = Math.floor(v.h);
  if (!started) basketX = cw / 2;
}

KampaiOrient.init({
  prefer: CFG.ORIENTATION || 'any',
  lockOnStart: !!CFG.LOCK_ORIENTATION_ON_START,
  overlayLandscape: 'กรุณาหมุนเครื่องเป็น<b>แนวนอน</b><br>เกมนี้เล่นได้เฉพาะแนวนอน',
  overlayPortrait: 'กรุณาหมุนเครื่องเป็น<b>แนวตั้ง</b><br>เกมนี้เล่นได้เฉพาะแนวตั้ง',
  onChange: function () { resizeCanvas(); },
  onPauseChange: function (paused) {
    if (paused) document.getElementById('hud-center').textContent = '⏸ หมุนจอเพื่อเล่นต่อ';
    else if (started && !isGameOver) document.getElementById('hud-center').textContent = 'เล่นอยู่…';
  },
});
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function renderPlayer() {
  const s = KAMPAI.student, st = KAMPAI.stats;
  if (!s) return;
  const chip = document.getElementById('player-chip');
  const av = s.photoUrl ? `<img src="${s.photoUrl}" alt="">` : `<div class="pc-init">${(s.displayName || '?')[0]}</div>`;
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
  if (!rows.length) { el.innerHTML = '<li class="lb-loading">ยังไม่มีผู้เล่น — เป็นคนแรกสิ!</li>'; return; }
  const medals = ['🥇', '🥈', '🥉'];
  el.innerHTML = rows.slice(0, 5).map((r) => {
    const av = r.photoUrl ? `<img class="lb-avatar" src="${r.photoUrl}" alt="" style="width:32px;height:32px;border-radius:50%;object-fit:cover">` : '';
    return `<li class="${r.isMe ? 'is-me' : ''}">
      <span>${medals[r.rank - 1] || r.rank}</span>${av}
      <span>${r.displayName}${r.isMe ? ' (คุณ)' : ''} · ${(r.personalBest || 0).toLocaleString()}</span>
    </li>`;
  }).join('');
}

function bootMenu() {
  document.getElementById('game-title').textContent = DATA.title || '🧭 เกม';
  document.getElementById('game-subtitle').textContent = DATA.subtitle || '';
  document.getElementById('orient-badge').textContent = ORIENT_LABELS[CFG.ORIENTATION] || ORIENT_LABELS.any;
  const tips = document.getElementById('tips-list');
  (DATA.tips || []).forEach((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    tips.appendChild(li);
  });
}

KAMPAI.onReady(function () {
  renderPlayer();
  renderMyStats();
  renderLeaderboard('score-list');
});
KAMPAI.controls.mount({ dpad: true, buttons: [] });
KAMPAI.sound.mountToggles();
bootMenu();

const vs = window.KampaiVersus ? KampaiVersus.create({
  duration: CFG.TIME_SECONDS,
  title: DATA.title || 'เกมตัวอย่าง',
  rankBy: 'score',
  onPlay: function () { startGame(); },
  onEnd: function () { isGameOver = true; },
}) : null;

function openVersus() { if (vs) vs.openMenu(); }

function setScore(n) {
  score = Math.max(0, n);
  document.getElementById('score-value').innerText = score;
  const w = document.getElementById('score-container');
  w.classList.add('pop');
  setTimeout(() => w.classList.remove('pop'), 150);
}

function setLives(n) {
  lives = Math.max(0, n);
  let str = '';
  for (let i = 0; i < CFG.LIVES; i++) str += i < lives ? '❤️' : '🖤';
  document.getElementById('life-container').innerText = str;
  if (lives <= 0) endGame();
}

function starCount() {
  const t = CFG.STAR_THRESHOLDS || [60, 180, 360];
  if (score >= t[2]) return 3;
  if (score >= t[1]) return 2;
  if (score >= t[0]) return 1;
  return 0;
}

function endGame() {
  if (isGameOver) return;
  isGameOver = true;
  KampaiOrient.setPlaying(false);
  KAMPAI.sound.bgmStop();
  KAMPAI.sound.gameOver();
  if (vs && vs.finish(score, { correct: score > 0 })) return;
  KAMPAI.submitScore(score, { mode: 'normal', stars: starCount() });
  document.getElementById('final-score').innerText = score;
  document.getElementById('go-stars').innerText = '☆☆☆'.split('').map((s, i) => (i < starCount() ? '★' : '☆')).join('');
  document.getElementById('gameover-screen').style.display = 'flex';
  renderLeaderboard('score-list-gameover');
}

function startGame() {
  if (started || !KampaiOrient.canStart()) return;
  started = true;
  KampaiOrient.notifyGameStart();
  KampaiOrient.setPlaying(true);
  KAMPAI.sound.unlock();
  KAMPAI.sound.bgmStart();
  document.getElementById('blocker').style.display = 'none';
  document.getElementById('hud-center').textContent = KampaiOrient.isLandscape() ? 'แนวนอน' : 'แนวตั้ง';
  basketX = cw / 2;
  requestAnimationFrame(loop);
}

function loop(ts) {
  if (isGameOver || KampaiOrient.isPaused()) {
    if (!isGameOver) requestAnimationFrame(loop);
    return;
  }
  if (KAMPAI.input.left) basketX -= CFG.SPEED;
  if (KAMPAI.input.right) basketX += CFG.SPEED;
  basketX = Math.max(40, Math.min(cw - 40, basketX));

  if (ts - spawnTs > CFG.SPAWN_START_MS) {
    spawnTs = ts;
    stars.push({ x: 40 + Math.random() * (cw - 80), y: -20, v: 2 + Math.random() * 2 });
  }

  ctx.clearRect(0, 0, cw, ch);
  const basketY = ch - 60;
  for (let i = stars.length - 1; i >= 0; i--) {
    const s = stars[i];
    s.y += s.v;
    ctx.font = '32px serif';
    ctx.fillText('⭐', s.x - 16, s.y);
    if (s.y > basketY - 20 && Math.abs(s.x - basketX) < 50) {
      setScore(score + CFG.GOOD_POINTS);
      KAMPAI.sound.correct();
      stars.splice(i, 1);
    } else if (s.y > ch) {
      stars.splice(i, 1);
      setLives(lives - 1);
      KAMPAI.sound.wrong();
    }
  }
  ctx.font = '48px serif';
  ctx.fillText('🧺', basketX - 24, basketY + 16);
  requestAnimationFrame(loop);
}

canvas.addEventListener('pointerdown', (e) => {
  if (!started || isGameOver) return;
  if (e.clientX < cw / 2) basketX -= 40;
  else basketX += 40;
});
