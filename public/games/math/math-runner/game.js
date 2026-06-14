/* game.js — ลอจิกเกม Math Runner */
const CFG = window.GAME_CONFIG;
const DATA = window.GAME_DATA;
KAMPAI.setSlug(CFG.SLUG);
KAMPAI.sound.defaultBgm(CFG.BGM);

/* ── ข้อมูลผู้เล่น + กระดานคะแนน (SDK) ── */
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
    el.innerHTML = '<li class="lb-loading">ยังไม่มีอันดับ — เล่นก่อนใครได้เลย!</li>';
    return;
  }
  const medals = ['🥇','🥈','🥉'];
  el.innerHTML = rows.slice(0, 5).map((r) => {
    const av = r.photoUrl ? `<img class="lb-avatar" src="${r.photoUrl}" alt="">` : `<div class="lb-avatar-init">${(r.displayName||'?')[0]}</div>`;
    return `<li class="${r.isMe ? 'me' : ''}">
      <div class="lb-entry me">
        <span class="lb-rank">${medals[r.rank-1] || r.rank}</span>${av}
        <div class="lb-info">
          <div class="lb-name">${r.displayName}${r.isMe ? ' (คุณ)' : ''}</div>
        </div>
      </div>
      <span class="lb-score">${(r.personalBest||0).toLocaleString()}</span>
    </li>`;
  }).join('');
}

KAMPAI.onReady(function () {
  renderPlayer();
  renderMyStats();
  renderLeaderboard('score-list');
});

// ติดตั้งระบบควบคุมปุ่มลัด
KAMPAI.controls.mount({ dpad: false, buttons: [] });
KAMPAI.sound.mountToggles();

/* ── ตั้งค่าเครื่องหมายคณิตศาสตร์ & ความยาก ── */
let currentMathMode = 'mul';
let currentDifficulty = 'easy';
let isEquationMode = false;

function selectMathMode(mode) {
  currentMathMode = mode;
  document.querySelectorAll('#math-mode-group .mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === mode);
  });
  KAMPAI.sound.correct();
}

function selectDifficulty(diff) {
  currentDifficulty = diff;
  document.querySelectorAll('#diff-group .diff-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.val === diff);
  });
  KAMPAI.sound.correct();
}

/* ── โหมดออนไลน์ (KampaiMatch) ── */
let match = null;
if (CFG.ENABLE_ONLINE && window.KampaiMatch) {
  match = KampaiMatch.create({
    duration: CFG.ONLINE_DURATION,
    title: 'แข่งวิ่งสูตรคูณ',
    onPlay: function (opts) {
      startGame('online', opts);
    },
    onEnd: function () {
      isGameOver = true;
      endGame();
    }
  });
  document.getElementById('online-btn').style.display = 'block';
}

function openOnlineMultiplayer() {
  if (match) match.openMenu();
}

/* ── โครงสร้างและฟิสิกส์เกม ── */
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let cw = 0, ch = 0;

function resize() {
  cw = canvas.width = window.innerWidth;
  ch = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const $ = (id) => document.getElementById(id);

let mode = 'adventure'; // adventure | time | local_2p | online
let score = 0, lives = CFG.LIVES, level = 1, combo = 0;
let correctAnswersCount = 0;
let isGameOver = false, started = false;
let gameTimeLeft = CFG.TIME_SECONDS;
let timerIntervalId = null;

let keysPressed = {};
let speedStep = 0; // ขั้นบันไดสปีดเกม
let p1SpeedStep = 0;
let p1BlockSpeed = CFG.BLOCK_START_SPEED;
let p1CorrectAnswersCount = 0;
let p2SpeedStep = 0;
let p2BlockSpeed = CFG.BLOCK_START_SPEED;
let p2CorrectAnswersCount = 0;
let touchMoveDirX = 0, p1TouchMoveDirX = 0, p2TouchMoveDirX = 0;

// ข้อมูลสำหรับ 1 Player และ Online
let playerLane = 1; // 0, 1, 2
let targetPlayerLane = 1;
let playerY = 0;
let playerX = 0;
let activeQuestion = null;
let floatBlocks = []; // { x, y, lane, value, isCorrect }
let blockSpeed = CFG.BLOCK_START_SPEED;

// ข้อมูลสำหรับ Local 2 Players
let p1Lane = 1, targetP1Lane = 1, p1Y = 0, p1Score = 0, p1Lives = 3;
let p1X = 0;
let p2Lane = 1, targetP2Lane = 1, p2Y = 0, p2Score = 0, p2Lives = 3;
let p2X = 0;
let p1Question = null, p2Question = null;
let p1Blocks = [], p2Blocks = [];
let p1Combo = 0, p2Combo = 0;

// อิลลัสเตเตอร์/ฉากหลังเคลื่อนไหว
let bgOffset = 0;
let coinParticles = [];
let floatingTexts = [];
let redFlashAlpha = 0;
let p1RedFlash = 0, p2RedFlash = 0;

// Seeded RNG สำหรับออนไลน์
let onlineRng = null;
let animationFrameId = null;

// มอนสเตอร์ และ ไอเทม
let activeMonsters = []; // สำหรับ 1P / Online
let activeItems = [];    // สำหรับ 1P / Online
let p1Monsters = [], p2Monsters = []; // สำหรับ 2P
let p1Items = [], p2Items = [];       // สำหรับ 2P

// บัฟ / ดีบัฟ (เฟรมคงเหลือ)
let p1InvincibleTime = 0, p1SlowTime = 0, p1ConfusedTime = 0, p1IsGiant = false;
let p2InvincibleTime = 0, p2SlowTime = 0, p2ConfusedTime = 0, p2IsGiant = false;

// ฉากหลังเคลื่อนแยกกันสำหรับ 2P เพื่อรองรับการสโลว์ต่างกัน
let p1BgOffset = 0;
let p2BgOffset = 0;

function getTierByScore(val) {
  if (val > 350) return 5;
  if (val > 220) return 4;
  if (val > 120) return 3;
  if (val > 50) return 2;
  return 1;
}

function generateNewQuestion(playerIndex = 1) {
  const tier = getTierByScore(playerIndex === 2 ? p2Score : score);
  const q = window.GAME_DATA.generateProblem(currentMathMode, tier, isEquationMode, onlineRng);
  
  if (mode === 'local_2p') {
    if (playerIndex === 1) {
      p1Question = q;
      p1Blocks = spawnBlocksForQuestion(q);
      spawnMonstersAndItemsForQuestion(1, q);
    } else {
      p2Question = q;
      p2Blocks = spawnBlocksForQuestion(q);
      spawnMonstersAndItemsForQuestion(2, q);
    }
  } else {
    activeQuestion = q;
    floatBlocks = spawnBlocksForQuestion(q);
    spawnMonstersAndItemsForQuestion(1, q);
    $('math-problem-bar').innerText = q.displayStr;
  }
}

function spawnBlocksForQuestion(q) {
  const blocks = [];
  // วางตัวเลือกใน 3 เลน (0, 1, 2)
  for (let l = 0; l < 3; l++) {
    blocks.push({
      x: cw + 50 + l * 220, // วางห่างกันเพื่อให้ผู้เล่นมีเวลาหลบและเปลี่ยนเลน
      lane: l,
      value: q.choices[l],
      isCorrect: q.choices[l] === q.Target,
      hitResolved: false
    });
  }
  return blocks;
}

/* ── อินพุตการควบคุม ── */
window.addEventListener('keydown', e => {
  keysPressed[e.key.toLowerCase()] = true;
  keysPressed[e.key] = true;

  if (!started || isGameOver) return;
  
  if (mode === 'local_2p') {
    // P1: W (ขึ้น), S (ลง)
    if (e.key === 'w' || e.key === 'W') {
      const dir = (p1ConfusedTime > 0) ? 1 : -1;
      targetP1Lane = Math.max(0, Math.min(2, targetP1Lane + dir));
    }
    if (e.key === 's' || e.key === 'S') {
      const dir = (p1ConfusedTime > 0) ? -1 : 1;
      targetP1Lane = Math.max(0, Math.min(2, targetP1Lane + dir));
    }
    // P2: ArrowUp, ArrowDown
    if (e.key === 'ArrowUp') {
      const dir = (p2ConfusedTime > 0) ? 1 : -1;
      targetP2Lane = Math.max(0, Math.min(2, targetP2Lane + dir));
    }
    if (e.key === 'ArrowDown') {
      const dir = (p2ConfusedTime > 0) ? -1 : 1;
      targetP2Lane = Math.max(0, Math.min(2, targetP2Lane + dir));
    }
  } else {
    // Single / Online: W, S หรือ ArrowUp, ArrowDown
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      const dir = (p1ConfusedTime > 0) ? 1 : -1;
      targetPlayerLane = Math.max(0, Math.min(2, targetPlayerLane + dir));
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      const dir = (p1ConfusedTime > 0) ? -1 : 1;
      targetPlayerLane = Math.max(0, Math.min(2, targetPlayerLane + dir));
    }
  }
});

window.addEventListener('keyup', e => {
  keysPressed[e.key.toLowerCase()] = false;
  keysPressed[e.key] = false;
});

// สัมผัสหน้าจอมือถือ (การควบคุมแบบสัมผัสสัมพัทธ์ Tap-to-Move)
function handleTouchInput(e) {
  if (!started || isGameOver) return;
  
  // รีเซ็ตค่าทิศทางการเคลื่อนสัมผัสก่อน เพื่อคำนวณใหม่จากทุกนิ้วที่สัมผัสอยู่
  touchMoveDirX = 0;
  p1TouchMoveDirX = 0;
  p2TouchMoveDirX = 0;

  for (let i = 0; i < e.touches.length; i++) {
    const touch = e.touches[i];
    const tx = touch.clientX;
    const ty = touch.clientY;

    if (mode === 'local_2p') {
      const sh = ch / 2;
      if (tx < cw / 2) {
        // ฝั่ง P1 (ซ้าย)
        if (tx > p1X + 25) p1TouchMoveDirX = 1;
        else if (tx < p1X - 25) p1TouchMoveDirX = -1;
        
        // แบ่ง Y เป็น 3 เลน (เลน 0, 1, 2) ในครึ่งจอบน
        if (ty < sh * 0.40) {
          const dir = (p1ConfusedTime > 0) ? 2 : 0;
          targetP1Lane = dir === 2 ? 2 : 0;
        } else if (ty < sh * 0.70) {
          targetP1Lane = 1;
        } else {
          const dir = (p1ConfusedTime > 0) ? 0 : 2;
          targetP1Lane = dir;
        }
      } else {
        // ฝั่ง P2 (ขวา)
        if (tx > p2X + 25) p2TouchMoveDirX = 1;
        else if (tx < p2X - 25) p2TouchMoveDirX = -1;
        
        // แบ่ง Y เป็น 3 เลนในครึ่งจอล่าง
        const relativeTy = ty - sh;
        if (relativeTy < sh * 0.40) {
          const dir = (p2ConfusedTime > 0) ? 2 : 0;
          targetP2Lane = dir === 2 ? 2 : 0;
        } else if (relativeTy < sh * 0.70) {
          targetP2Lane = 1;
        } else {
          const dir = (p2ConfusedTime > 0) ? 0 : 2;
          targetP2Lane = dir;
        }
      }
    } else {
      // โหมดผู้เล่นคนเดียว (เต็มจอ)
      if (tx > playerX + 35) touchMoveDirX = 1;
      else if (tx < playerX - 35) touchMoveDirX = -1;
      
      // แบ่งจอตามแนวตั้งเป็น 3 ส่วนเพื่อเปลี่ยนเลน
      if (ty < ch * 0.40) {
        const dir = (p1ConfusedTime > 0) ? 2 : 0;
        targetPlayerLane = dir === 2 ? 2 : 0;
      } else if (ty < ch * 0.70) {
        targetPlayerLane = 1;
      } else {
        const dir = (p1ConfusedTime > 0) ? 0 : 2;
        targetPlayerLane = dir;
      }
    }
  }
}

window.addEventListener('touchstart', e => {
  // ป้องกันเฉพาะเมื่อเกมกำลังรันอยู่เพื่อไม่ให้รบกวนหน้าเว็บหลัก
  if (started && !isGameOver) {
    e.preventDefault();
    handleTouchInput(e);
  }
}, { passive: false });

window.addEventListener('touchmove', e => {
  if (started && !isGameOver) {
    e.preventDefault();
    handleTouchInput(e);
  }
}, { passive: false });

window.addEventListener('touchend', e => {
  if (started && !isGameOver) {
    e.preventDefault();
    handleTouchInput(e);
  }
}, { passive: false });

/* ── แอนิเมชันวาดรูป ── */

// วาดท้องฟ้าและสนามหญ้าอิฐดิน (สไตล์มาริโอ้)
function drawRetroHills(ctx, cw, ch, offset, screenYOffset, screenHeight, currentLvl = 1) {
  ctx.save();
  ctx.translate(0, screenYOffset);

  const lvl = Math.max(1, Math.min(5, currentLvl));

  // 1. Sky Color
  let skyColor = '#5c94fc';
  if (lvl === 2) skyColor = '#d68910';
  else if (lvl === 3) skyColor = '#121214';
  else if (lvl === 4) skyColor = '#d5b8ff';
  else if (lvl === 5) skyColor = '#210404';
  
  ctx.fillStyle = skyColor;
  ctx.fillRect(0, 0, cw, screenHeight);

  // 2. Clouds / Sun / Stalactites / Ash
  if (lvl === 1) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    const numClouds = Math.ceil(cw / 350) + 1;
    for (let i = 0; i < numClouds; i++) {
      const cx = i * 350 - (offset * 0.15) % 350 + 50;
      const cy = screenHeight * 0.18;
      ctx.beginPath();
      ctx.arc(cx, cy, 25, 0, Math.PI * 2);
      ctx.arc(cx + 20, cy - 10, 30, 0, Math.PI * 2);
      ctx.arc(cx + 45, cy, 22, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (lvl === 2) {
    ctx.fillStyle = '#f5b041';
    ctx.beginPath();
    ctx.arc(cw * 0.8, screenHeight * 0.2, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(245, 176, 65, 0.2)';
    ctx.beginPath();
    ctx.arc(cw * 0.8, screenHeight * 0.2, 60, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(186, 74, 0, 0.3)';
    const numClouds = Math.ceil(cw / 400) + 1;
    for (let i = 0; i < numClouds; i++) {
      const cx = i * 400 - (offset * 0.1) % 400 + 100;
      const cy = screenHeight * 0.15;
      ctx.beginPath();
      ctx.arc(cx, cy, 20, 0, Math.PI * 2);
      ctx.arc(cx + 30, cy, 25, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (lvl === 3) {
    ctx.fillStyle = '#1b2631';
    const numStalactites = Math.ceil(cw / 80) + 1;
    for (let i = 0; i < numStalactites; i++) {
      const sx = i * 80 - (offset * 0.05) % 80;
      const shHeight = 15 + ((i % 3) * 12);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx + 20, shHeight);
      ctx.lineTo(sx + 40, 0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#16a085';
    for (let i = 0; i < numStalactites; i++) {
      if (i % 2 === 0) {
        const sx = i * 80 - (offset * 0.05) % 80 + 20;
        const shHeight = 15 + ((i % 3) * 12);
        ctx.beginPath();
        ctx.arc(sx, shHeight, 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (lvl === 4) {
    ctx.fillStyle = 'rgba(255, 235, 235, 0.8)';
    const numClouds = Math.ceil(cw / 250) + 1;
    for (let i = 0; i < numClouds; i++) {
      const cx = i * 250 - (offset * 0.25) % 250;
      const cy = screenHeight * 0.25;
      ctx.beginPath();
      ctx.arc(cx, cy, 30, 0, Math.PI * 2);
      ctx.arc(cx + 25, cy - 15, 35, 0, Math.PI * 2);
      ctx.arc(cx + 50, cy, 25, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (lvl === 5) {
    ctx.fillStyle = 'rgba(60, 60, 60, 0.7)';
    const numClouds = Math.ceil(cw / 300) + 1;
    for (let i = 0; i < numClouds; i++) {
      const cx = i * 300 - (offset * 0.2) % 300;
      const cy = screenHeight * 0.18;
      ctx.beginPath();
      ctx.arc(cx, cy, 25, 0, Math.PI * 2);
      ctx.arc(cx + 20, cy - 10, 30, 0, Math.PI * 2);
      ctx.arc(cx + 40, cy, 22, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // 3 & 4. Hills / Pyramids / Rocks / Volcanoes
  if (lvl === 1) {
    ctx.fillStyle = '#008a00';
    const numHills = Math.ceil(cw / 260) + 2;
    for (let i = 0; i < numHills; i++) {
      const hx = i * 260 - (offset * 0.3) % 260;
      ctx.beginPath();
      ctx.arc(hx, screenHeight - 20, 140, Math.PI, 0);
      ctx.fill();
    }
    ctx.fillStyle = '#00a800';
    for (let i = 0; i < numHills; i++) {
      const hx = i * 260 - (offset * 0.5) % 260 + 130;
      ctx.beginPath();
      ctx.arc(hx, screenHeight - 10, 110, Math.PI, 0);
      ctx.fill();
    }
  } else if (lvl === 2) {
    ctx.fillStyle = '#ba4a00';
    const numPyramids = Math.ceil(cw / 300) + 2;
    for (let i = 0; i < numPyramids; i++) {
      const px = i * 300 - (offset * 0.3) % 300;
      ctx.beginPath();
      ctx.moveTo(px - 50, screenHeight - 20);
      ctx.lineTo(px + 70, screenHeight - 160);
      ctx.lineTo(px + 190, screenHeight - 20);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#f5b041';
    for (let i = 0; i < numPyramids; i++) {
      const px = i * 300 - (offset * 0.5) % 300 + 150;
      ctx.beginPath();
      ctx.moveTo(px - 40, screenHeight - 15);
      ctx.lineTo(px + 50, screenHeight - 110);
      ctx.lineTo(px + 140, screenHeight - 15);
      ctx.closePath();
      ctx.fill();
    }
  } else if (lvl === 3) {
    ctx.fillStyle = '#2c3e50';
    const numRocks = Math.ceil(cw / 200) + 2;
    for (let i = 0; i < numRocks; i++) {
      const rx = i * 200 - (offset * 0.3) % 200;
      ctx.beginPath();
      ctx.moveTo(rx - 30, screenHeight - 20);
      ctx.lineTo(rx + 40, screenHeight - 130);
      ctx.lineTo(rx + 60, screenHeight - 110);
      ctx.lineTo(rx + 110, screenHeight - 20);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#16a085';
    for (let i = 0; i < numRocks; i++) {
      const rx = i * 200 - (offset * 0.5) % 200 + 100;
      ctx.beginPath();
      ctx.moveTo(rx - 20, screenHeight - 10);
      ctx.lineTo(rx + 30, screenHeight - 80);
      ctx.lineTo(rx + 80, screenHeight - 10);
      ctx.closePath();
      ctx.fill();
    }
  } else if (lvl === 4) {
    ctx.fillStyle = '#ebdef0';
    const numHills = Math.ceil(cw / 240) + 2;
    for (let i = 0; i < numHills; i++) {
      const hx = i * 240 - (offset * 0.3) % 240;
      ctx.beginPath();
      ctx.arc(hx, screenHeight - 10, 110, Math.PI, 0);
      ctx.fill();
    }
    ctx.fillStyle = '#f1948a';
    for (let i = 0; i < numHills; i++) {
      const hx = i * 240 - (offset * 0.5) % 240 + 120;
      ctx.beginPath();
      ctx.arc(hx, screenHeight - 5, 80, Math.PI, 0);
      ctx.fill();
    }
  } else if (lvl === 5) {
    ctx.fillStyle = '#5c0e0e';
    const numVolcanoes = Math.ceil(cw / 280) + 2;
    for (let i = 0; i < numVolcanoes; i++) {
      const vx = i * 280 - (offset * 0.3) % 280;
      ctx.beginPath();
      ctx.moveTo(vx - 50, screenHeight - 20);
      ctx.lineTo(vx + 40, screenHeight - 150);
      ctx.lineTo(vx + 60, screenHeight - 150);
      ctx.lineTo(vx + 150, screenHeight - 20);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#e74c3c';
      ctx.beginPath();
      ctx.ellipse(vx + 50, screenHeight - 150, 10, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#1f1f1f';
    for (let i = 0; i < numVolcanoes; i++) {
      const fx = i * 280 - (offset * 0.5) % 280 + 140;
      ctx.fillRect(fx - 30, screenHeight - 90, 60, 90);
      ctx.clearRect(fx - 20, screenHeight - 90, 10, 10);
      ctx.clearRect(fx, screenHeight - 90, 10, 10);
      ctx.clearRect(fx + 20, screenHeight - 90, 10, 10);
      
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(fx - 30, screenHeight - 90, 60, 90);
    }
  }

  // 5. Lanes
  const laneHeight = screenHeight / 6.5;
  for (let l = 0; l < 3; l++) {
    const ly = screenHeight * 0.40 + l * laneHeight;
    
    let brickColor = '#e45c10';
    let brickTopColor = '#00a800';
    
    if (lvl === 2) {
      brickColor = '#873600';
      brickTopColor = '#ba4a00';
    } else if (lvl === 3) {
      brickColor = '#1b2631';
      brickTopColor = '#16a085';
    } else if (lvl === 4) {
      brickColor = '#85c1e9';
      brickTopColor = '#ffffff';
    } else if (lvl === 5) {
      brickColor = '#78281f';
      brickTopColor = '#e74c3c';
    }

    ctx.fillStyle = brickColor;
    ctx.fillRect(0, ly, cw, 22);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeRect(-5, ly, cw + 10, 22);
    
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    for (let bx = 0; bx < cw + 50; bx += 40) {
      ctx.beginPath();
      ctx.moveTo(bx - (offset % 40), ly);
      ctx.lineTo(bx - (offset % 40), ly + 22);
      ctx.stroke();
    }

    ctx.fillStyle = brickTopColor;
    ctx.fillRect(0, ly - 6, cw, 6);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(-5, ly - 6, cw + 10, 6);
  }

  ctx.restore();
}

// วาดตัวละคร P1/P2 Chibi Retro Runner พร้อมบัฟ/ดีบัฟ
function drawChibiPlayer(ctx, x, y, frame, colorHead, colorBody, isGiant = false, invincibleTime = 0, slowTime = 0, confusedTime = 0) {
  ctx.save();
  const yOffset = isGiant ? -45 : -33;
  ctx.translate(x, y + yOffset);

  // 1. ขนาดตัวขยายใหญ่ (Mega Size)
  if (isGiant) {
    ctx.scale(1.45, 1.45);
  }

  // 2. การสลับสีอมตะสไตล์มาริโอ้
  let drawHeadColor = colorHead;
  let drawBodyColor = colorBody;
  if (invincibleTime > 0) {
    const rainbowHues = ['#ff4757', '#ffa502', '#eccc68', '#2ed573', '#1e90ff', '#ff6b81'];
    drawHeadColor = rainbowHues[Math.floor(frame / 5) % rainbowHues.length];
    drawBodyColor = rainbowHues[Math.floor((frame + 3) / 5) % rainbowHues.length];
    
    // วาดแสงออร่าวิบวับรอบตัวอมตะ
    ctx.strokeStyle = 'rgba(255,215,0,0.4)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(0, -10, 26, 0, Math.PI * 2);
    ctx.stroke();
  }

  // ปรับความกว้างขาแกว่งตามสถานะเชื่องช้า
  const swingSpeed = (slowTime > 0) ? 0.11 : 0.22;
  const legSwing = Math.sin(frame * swingSpeed) * 14;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  
  // ขาซ้าย
  ctx.beginPath();
  ctx.moveTo(-6, 8);
  ctx.lineTo(-6 + legSwing, 22);
  ctx.stroke();

  // ขาขวา
  ctx.beginPath();
  ctx.moveTo(6, 8);
  ctx.lineTo(6 - legSwing, 22);
  ctx.stroke();

  // รองเท้าบู๊ทเรโทร
  ctx.fillStyle = '#8b5a2b';
  ctx.beginPath();
  ctx.arc(-6 + legSwing, 22, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(6 - legSwing, 22, 5, 0, Math.PI * 2);
  ctx.fill();

  // ตัว (ชุดเอี๊ยม)
  ctx.fillStyle = drawBodyColor;
  ctx.fillRect(-12, -12, 24, 22);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 3;
  ctx.strokeRect(-12, -12, 24, 22);

  // ปุ่มกลมสีทองของเอี๊ยม
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(-6, -6, 2.5, 0, Math.PI * 2);
  ctx.arc(6, -6, 2.5, 0, Math.PI * 2);
  ctx.fill();

  // เสื้อด้านใน
  ctx.fillStyle = drawHeadColor;
  ctx.fillRect(-16, -10, 4, 12);
  ctx.fillRect(12, -10, 4, 12);
  ctx.strokeRect(-16, -10, 4, 12);
  ctx.strokeRect(12, -10, 4, 12);

  // หัวกลม
  ctx.fillStyle = '#ffdbac';
  ctx.beginPath();
  ctx.arc(0, -23, 11, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // หมวกแก็ปเรโทร
  ctx.fillStyle = drawHeadColor;
  ctx.beginPath();
  ctx.arc(0, -29, 11, Math.PI, 0);
  ctx.fill();
  ctx.fillRect(0, -31, 16, 4); // ปีกหมวก
  ctx.stroke();

  // ตา
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(5, -24, 2, 0, Math.PI * 2);
  ctx.fill();

  // หนวดดำมาริโอ้
  ctx.fillStyle = '#3a200a';
  ctx.fillRect(4, -20, 8, 3.5);

  // 3. ปรับตัวให้โปร่งแสงม่วงเมื่อติดดีบัฟ Slow
  if (slowTime > 0) {
    ctx.fillStyle = 'rgba(155, 93, 229, 0.35)';
    ctx.beginPath();
    ctx.arc(0, -10, 24, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. แสดงสัญลักษณ์หัวหมุน 🌀 เมื่อติดดีบัฟ Confused
  if (confusedTime > 0) {
    ctx.fillStyle = '#000';
    ctx.font = '24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const bounceY = Math.sin(frame * 0.15) * 4;
    ctx.fillText('🌀', 0, -36 + bounceY);
  }

  ctx.restore();
}

// วาดบล็อกคำถามสีทอง (? Box) สำหรับเลือกคำตอบ
function drawQuestionBlock(ctx, x, y, value, isCorrect, isChosen, hitResolved) {
  ctx.save();
  ctx.translate(x, y - 38);

  if (hitResolved) {
    if (isChosen) {
      if (isCorrect) {
        // ตอบถูก: แสดงบล็อกสีเขียว และมีเครื่องหมายถูก
        ctx.fillStyle = '#2ecc71';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(-24, -24, 48, 48, 8);
        ctx.fill();
        ctx.stroke();

        // เครื่องหมายถูกสีขาว (Checkmark)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(-2, 8);
        ctx.lineTo(10, -6);
        ctx.stroke();
      } else {
        // ตอบผิด: แสดงบล็อกสีแดง และมีเครื่องหมายกากบาท
        ctx.fillStyle = '#ff4757';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.roundRect(-24, -24, 48, 48, 8);
        ctx.fill();
        ctx.stroke();

        // เครื่องหมายกากบาทสีขาว (X)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-8, -8);
        ctx.lineTo(8, 8);
        ctx.moveTo(8, -8);
        ctx.lineTo(-8, 8);
        ctx.stroke();
      }
    } else {
      // ตัวเลือกรองอื่นๆ ที่ไม่ได้เลือก: แสดงผลโปร่งใสจางๆ
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = '#cccccc';
      ctx.strokeStyle = '#666666';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(-24, -24, 48, 48, 8);
      ctx.fill();
      ctx.stroke();
    }
  } else {
    // บล็อกปกติที่รอให้วิ่งชน (สีทอง ? Block สไตล์มาริโอ้)
    ctx.fillStyle = '#fcb42c';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.roundRect(-24, -24, 48, 48, 8);
    ctx.fill();
    ctx.stroke();

    // รายละเอียดจุดสี่สีมุมบล็อก
    ctx.fillStyle = '#b87c04';
    ctx.fillRect(-19, -19, 4, 4);
    ctx.fillRect(15, -19, 4, 4);
    ctx.fillRect(-19, 15, 4, 4);
    ctx.fillRect(15, 15, 4, 4);
  }

  // วาดค่าของตัวเลือกตัวเลข (แสดงแบบขาวเมื่อชนแล้ว และดำปกติเมื่อรอชน)
  ctx.fillStyle = (hitResolved && isChosen) ? '#ffffff' : '#000000';
  ctx.font = 'bold 23px Fredoka One, Sarabun, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, 0, 0);

  ctx.restore();
}

// วาดมอนสเตอร์ กุมบ้า กระดองเต่า เต่าหนาม
function drawMonster(ctx, x, y, type, frame) {
  ctx.save();
  let yOffset = 0;
  if (type === 'goomba') yOffset = -24;
  else if (type === 'koopa') yOffset = -22;
  else if (type === 'spiny') yOffset = -20;
  ctx.translate(x, y + yOffset);

  if (type === 'goomba') {
    // ขาเดินสลับ
    const legSwing = Math.sin(frame * 0.2) * 5;
    ctx.fillStyle = '#000000';
    ctx.fillRect(-12 + legSwing, 10, 8, 8);
    ctx.fillRect(4 - legSwing, 10, 8, 8);

    // หัวเห็ดสีน้ำตาลส้มขอบดำ
    ctx.fillStyle = '#a0522d';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-20, 10);
    ctx.quadraticCurveTo(-24, -18, 0, -18);
    ctx.quadraticCurveTo(24, -18, 20, 10);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // ลำตัวด้านล่าง
    ctx.fillStyle = '#f5deb3';
    ctx.fillRect(-10, 4, 20, 8);
    ctx.strokeRect(-10, 4, 20, 8);

    // คิ้วโกรธตาเอียง
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(-12, -8);
    ctx.lineTo(0, -3);
    ctx.lineTo(12, -8);
    ctx.stroke();

    // ตา
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-6, -1, 3.5, 0, Math.PI * 2);
    ctx.arc(6, -1, 3.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(-6, -1, 1.5, 0, Math.PI * 2);
    ctx.arc(6, -1, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } 
  else if (type === 'koopa') {
    // กระดองเต่าสีเขียวขอบดำหมุนๆ
    ctx.rotate(frame * 0.15);
    ctx.fillStyle = '#2ecc71';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // ลายกระดองด้านใน
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 9, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(Math.cos(angle) * 16, Math.sin(angle) * 16);
      ctx.stroke();
    }
  } 
  else if (type === 'spiny') {
    // ตัวเต่าหนามสีแดง
    ctx.fillStyle = '#f1c40f';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.fillRect(-15, 6, 30, 8);
    ctx.strokeRect(-15, 6, 30, 8);

    // กระดองแดง
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(0, 6, 16, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // หนามแหลมชี้ขึ้น
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 2;
    const spikeAngles = [-Math.PI * 0.8, -Math.PI * 0.6, -Math.PI * 0.5, -Math.PI * 0.4, -Math.PI * 0.2];
    spikeAngles.forEach(ang => {
      ctx.beginPath();
      const sx = Math.cos(ang) * 16;
      const sy = Math.sin(ang) * 16 + 6;
      ctx.moveTo(sx, sy);
      ctx.lineTo(Math.cos(ang) * 26, Math.sin(ang) * 26 + 6);
      ctx.lineTo(Math.cos(ang + 0.1) * 16, Math.sin(ang + 0.1) * 16 + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });
  }

  ctx.restore();
}

// วาดไอเทมประเภทต่างๆ
function drawItem(ctx, x, y, type, frame) {
  ctx.save();
  let yOffset = 0;
  if (type === 'mushroom') yOffset = -22;
  else if (type === 'star') yOffset = -38;
  else if (type === 'poison') yOffset = -22;
  else if (type === 'lightning') yOffset = -30;
  else if (type === 'egg') yOffset = -22;
  else if (type === 'heart') yOffset = -30;
  ctx.translate(x, y + yOffset);

  if (type === 'mushroom') {
    // ก้านเห็ดขาวครีม
    ctx.fillStyle = '#f5deb3';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.fillRect(-8, 2, 16, 14);
    ctx.strokeRect(-8, 2, 16, 14);
    ctx.fillStyle = '#000000';
    ctx.fillRect(-3, 6, 2, 4);
    ctx.fillRect(1, 6, 2, 4);

    // หมวกแดงขอบดำ
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(0, 2, 17, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // จุดสีขาวลายเห็ด
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-8, -4, 4.5, 0, Math.PI * 2);
    ctx.arc(8, -4, 4.5, 0, Math.PI * 2);
    ctx.arc(0, -10, 5, 0, Math.PI * 2);
    ctx.fill();
  } 
  else if (type === 'star') {
    const pulse = Math.sin(frame * 0.15) * 5;
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 10 + pulse;
    
    ctx.fillStyle = '#f1c40f';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
      ctx.lineTo(Math.cos(angle) * 16, Math.sin(angle) * 16);
      const innerAngle = angle + Math.PI / 5;
      ctx.lineTo(Math.cos(innerAngle) * 7, Math.sin(innerAngle) * 7);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.fillRect(-3, -3, 2, 6);
    ctx.fillRect(1, -3, 2, 6);
  } 
  else if (type === 'poison') {
    ctx.fillStyle = '#4b0082';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.fillRect(-8, 2, 16, 14);
    ctx.strokeRect(-8, 2, 16, 14);
    
    ctx.fillStyle = '#e74c3c';
    ctx.fillRect(-4, 6, 2, 3);
    ctx.fillRect(2, 6, 2, 3);

    ctx.fillStyle = '#9400d3';
    ctx.beginPath();
    ctx.arc(0, 2, 17, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#2c003e';
    ctx.beginPath();
    ctx.arc(-8, -4, 4.5, 0, Math.PI * 2);
    ctx.arc(8, -4, 4.5, 0, Math.PI * 2);
    ctx.arc(0, -10, 5, 0, Math.PI * 2);
    ctx.fill();
  } 
  else if (type === 'lightning') {
    ctx.fillStyle = '#f1c40f';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -18);
    ctx.lineTo(8, -4);
    ctx.lineTo(2, -4);
    ctx.lineTo(10, 18);
    ctx.lineTo(-4, 2);
    ctx.lineTo(2, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  } 
  else if (type === 'egg') {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 16, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#2ecc71';
    ctx.beginPath();
    ctx.arc(-5, -4, 3, 0, Math.PI * 2);
    ctx.arc(5, 5, 3.5, 0, Math.PI * 2);
    ctx.arc(2, -8, 2.5, 0, Math.PI * 2);
    ctx.fill();
  } 
  else if (type === 'heart') {
    ctx.fillStyle = '#e74c3c';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.bezierCurveTo(-6, -14, -16, -8, -16, 0);
    ctx.bezierCurveTo(-16, 8, -6, 12, 0, 18);
    ctx.bezierCurveTo(6, 12, 16, 8, 16, 0);
    ctx.bezierCurveTo(16, -8, 6, -14, 0, -6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  ctx.restore();
}

// ฟังก์ชันเก็บไอเทมและประมวลผลบัฟ/ดีบัฟ
function collectItem(playerIndex, type, x, y) {
  if (playerIndex === 1) {
    if (type === 'mushroom') {
      p1IsGiant = true;
      addFloatingText(x, y, '🍄 ขยายร่าง!', '#2ecc71');
      KAMPAI.sound.correct();
    } else if (type === 'star') {
      p1InvincibleTime = CFG.BUFF_INVINCIBLE_DURATION * 60;
      addFloatingText(x, y, '⭐ ร่างอมตะ!', '#FFD700');
      KAMPAI.sound.correct();
    } else if (type === 'poison') {
      p1ConfusedTime = CFG.DEBUFF_CONFUSED_DURATION * 60;
      p1Combo = 0;
      addFloatingText(x, y, '🌀 ปุ่มสลับข้าง!', '#ff4757');
      KAMPAI.sound.wrong();
      p1RedFlash = 0.35;
    } else if (type === 'lightning') {
      p1SlowTime = CFG.DEBUFF_SLOW_DURATION * 60;
      p1Combo = 0;
      addFloatingText(x, y, '⚡ เชื่องช้า!', '#9b5de5');
      KAMPAI.sound.wrong();
      p1RedFlash = 0.35;
    } else if (type === 'egg') {
      if (mode === 'local_2p') p1Score += 15; else {
        score += 15;
        $('score-value').innerText = score;
      }
      addFloatingText(x, y, '+15 แต้ม!', '#FFD700');
      spawnCoins(x, y);
      KAMPAI.sound.correct();
    } else if (type === 'heart') {
      if (mode === 'adventure') {
        lives = Math.min(CFG.LIVES, lives + 1);
        let s = '';
        for (let i = 0; i < CFG.LIVES; i++) s += (i < lives) ? '❤️' : '🖤';
        $('life-container').innerText = s;
        addFloatingText(x, y, '❤️ +1 ชีวิต!', '#ff4757');
      } else {
        if (mode === 'local_2p') p1Score += 10; else {
          score += 10;
          $('score-value').innerText = score;
        }
        addFloatingText(x, y, '+10 แต้ม!', '#FFD700');
      }
      KAMPAI.sound.correct();
    }
  } else {
    if (type === 'mushroom') {
      p2IsGiant = true;
      addFloatingText(x, y, '🍄 P2 ขยายร่าง!', '#2ecc71');
      KAMPAI.sound.correct();
    } else if (type === 'star') {
      p2InvincibleTime = CFG.BUFF_INVINCIBLE_DURATION * 60;
      addFloatingText(x, y, '⭐ P2 อมตะ!', '#FFD700');
      KAMPAI.sound.correct();
    } else if (type === 'poison') {
      p2ConfusedTime = CFG.DEBUFF_CONFUSED_DURATION * 60;
      p2Combo = 0;
      addFloatingText(x, y, '🌀 P2 ปุ่มสลับข้าง!', '#ff4757');
      KAMPAI.sound.wrong();
      p2RedFlash = 0.35;
    } else if (type === 'lightning') {
      p2SlowTime = CFG.DEBUFF_SLOW_DURATION * 60;
      p2Combo = 0;
      addFloatingText(x, y, '⚡ P2 เชื่องช้า!', '#9b5de5');
      KAMPAI.sound.wrong();
      p2RedFlash = 0.35;
    } else if (type === 'egg') {
      p2Score += 15;
      addFloatingText(x, y, '+15 P2!', '#FFD700');
      spawnCoins(x, y);
      KAMPAI.sound.correct();
    } else if (type === 'heart') {
      p2Score += 10;
      addFloatingText(x, y, '+10 P2!', '#FFD700');
      KAMPAI.sound.correct();
    }
  }
}

// ฟังก์ชันชนมอนสเตอร์
function hitMonster(playerIndex, type, x, y) {
  const isInvincible = playerIndex === 2 ? (p2InvincibleTime > 0) : (p1InvincibleTime > 0);
  const isGiant = playerIndex === 2 ? p2IsGiant : p1IsGiant;

  if (isInvincible) {
    // อมตะ: วิ่งชนมอนสเตอร์ปลิว
    KAMPAI.sound.correct();
    spawnCoins(x, y);
    if (mode === 'local_2p') {
      if (playerIndex === 1) p1Score += 20; else p2Score += 20;
    } else {
      score += 20;
      $('score-value').innerText = score;
    }
    addFloatingText(x, y, '💥 +20 ชนปลิว!', '#FFD700');
  } else if (isGiant) {
    // ตัวโต: บังตัวเสียหายแทนเกราะ
    if (playerIndex === 1) p1IsGiant = false; else p2IsGiant = false;
    addFloatingText(x, y, '💥 หดตัว!', '#ff4757');
    KAMPAI.sound.wrong();
    if (playerIndex === 1) p1RedFlash = 0.45; else p2RedFlash = 0.45;
  } else {
    // โดนชนจังๆ
    KAMPAI.sound.wrong();
    if (playerIndex === 1) p1RedFlash = 0.55; else p2RedFlash = 0.55;
    
    if (mode === 'local_2p') {
      if (playerIndex === 1) {
        p1Combo = 0;
        p1Score = Math.max(0, p1Score - CFG.WRONG_PENALTY);
        addFloatingText(x, y, `💥 P1 -${CFG.WRONG_PENALTY}!`, '#ff4757');
      } else {
        p2Combo = 0;
        p2Score = Math.max(0, p2Score - CFG.WRONG_PENALTY);
        addFloatingText(x, y, `💥 P2 -${CFG.WRONG_PENALTY}!`, '#ff4757');
      }
    } else {
      combo = 0;
      $('combo-badge').classList.add('hidden');
      redFlashAlpha = 0.55;

      if (mode === 'adventure') {
        if (lives > 0) lives--;
        let s = '';
        for (let i = 0; i < CFG.LIVES; i++) s += (i < lives) ? '❤️' : '🖤';
        $('life-container').innerText = s;
        addFloatingText(x, y, '💥 เจ็บ!', '#ff4757');
        if (lives <= 0) {
          endGame();
        }
      } else {
        score = Math.max(0, score - CFG.WRONG_PENALTY);
        $('score-value').innerText = score;
        addFloatingText(x, y, `💥 -${CFG.WRONG_PENALTY}!`, '#ff4757');
      }
    }

    // สปีดลดลง (ขั้นบันได)
    if (mode === 'local_2p') {
      if (playerIndex === 1) {
        p1SpeedStep = Math.max(0, p1SpeedStep - 1);
        p1CorrectAnswersCount = p1SpeedStep * 5;
        p1BlockSpeed = Math.min(CFG.BLOCK_MAX_SPEED, CFG.BLOCK_START_SPEED + p1SpeedStep * 1.2);
        addFloatingText(x, y, '⚠️ P1 สปีดลดลง!', '#ff4757');
      } else {
        p2SpeedStep = Math.max(0, p2SpeedStep - 1);
        p2CorrectAnswersCount = p2SpeedStep * 5;
        p2BlockSpeed = Math.min(CFG.BLOCK_MAX_SPEED, CFG.BLOCK_START_SPEED + p2SpeedStep * 1.2);
        addFloatingText(x, y, '⚠️ P2 สปีดลดลง!', '#ff4757');
      }
    } else {
      p1SpeedStep = Math.max(0, p1SpeedStep - 1);
      p1CorrectAnswersCount = p1SpeedStep * 5;
      p1BlockSpeed = Math.min(CFG.BLOCK_MAX_SPEED, CFG.BLOCK_START_SPEED + p1SpeedStep * 1.2);
      addFloatingText(x, y, '⚠️ สปีดลดลง!', '#ff4757');
    }
  }
}

// ฟังก์ชันสุ่มเกิดมอนสเตอร์และไอเทม
function spawnMonstersAndItemsForQuestion(playerIndex, q) {
  const random = () => {
    if (onlineRng && typeof onlineRng.next === 'function') {
      return onlineRng.next();
    }
    return Math.random();
  };

  // 1. สุ่มเกิดมอนสเตอร์ (ต้องเกิดในเลนที่คำตอบผิดเพื่อไม่ให้ดักขวางคำตอบที่ถูก)
  if (random() < CFG.MONSTER_SPAWN_CHANCE) {
    const wrongLanes = [];
    for (let l = 0; l < 3; l++) {
      if (q.choices[l] !== q.Target) {
        wrongLanes.push(l);
      }
    }
    if (wrongLanes.length > 0) {
      const chosenLane = wrongLanes[Math.floor(random() * wrongLanes.length)];
      const mType = window.GAME_DATA.generateMonsterType(onlineRng);
      const monsterObj = {
        x: cw + 150 + Math.floor(random() * 150),
        lane: chosenLane,
        type: mType,
        hitResolved: false
      };
      
      if (mode === 'local_2p') {
        if (playerIndex === 1) p1Monsters.push(monsterObj);
        else p2Monsters.push(monsterObj);
      } else {
        activeMonsters.push(monsterObj);
      }
    }
  }

  if (random() < CFG.ITEM_SPAWN_CHANCE) {
    const itemLane = Math.floor(random() * 3);
    const iType = window.GAME_DATA.generateItemType(onlineRng);
    const itemObj = {
      x: cw + 250 + Math.floor(random() * 200),
      lane: itemLane,
      type: iType,
      hitResolved: false,
      isPopped: false
    };

    if (mode === 'local_2p') {
      if (playerIndex === 1) p1Items.push(itemObj);
      else p2Items.push(itemObj);
    } else {
      activeItems.push(itemObj);
    }
  }
}

// เอฟเฟกต์ยิงเหรียญกระจาย (Coins Burst)
function spawnCoins(x, y, playerIndex) {
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.4;
    const speed = 3 + Math.random() * 4;
    coinParticles.push({
      x: x, y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 1.0, decay: 0.03 + Math.random() * 0.02,
      playerIndex: playerIndex,
      update: function() { this.x += this.vx; this.y += this.vy; this.vy += 0.2; this.life -= this.decay; },
      draw: function(ctx) { ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI * 2); ctx.fill(); }
    });
  }
}

// เอฟเฟกต์ตัวอักษรลอยขึ้น
function addFloatingText(x, y, text, color, playerIndex) {
  floatingTexts.push({
    x: x, y: y, text: text, color: color, vy: -2, alpha: 1.0, playerIndex: playerIndex,
    update: function() { this.y += this.vy; this.alpha -= 0.02; },
    draw: function(ctx) { ctx.globalAlpha = this.alpha; ctx.fillStyle = this.color; ctx.font = 'bold 24px Fredoka One'; ctx.fillText(this.text, this.x, this.y); ctx.globalAlpha = 1.0; }
  });
}

/* ── ลูปการประมวลผลฟิสิกส์ & เรนเดอร์ ── */

function loop() {
  if (isGameOver) return;

  if (p1InvincibleTime > 0) p1InvincibleTime--;
  if (p1SlowTime > 0) p1SlowTime--;
  if (p1ConfusedTime > 0) p1ConfusedTime--;
  if (p2InvincibleTime > 0) p2InvincibleTime--;
  if (p2SlowTime > 0) p2SlowTime--;
  if (p2ConfusedTime > 0) p2ConfusedTime--;

  const p1Speed = (p1SlowTime > 0) ? p1BlockSpeed * 0.65 : p1BlockSpeed;
  const p2Speed = (p2SlowTime > 0) ? p2BlockSpeed * 0.65 : p2BlockSpeed;

  const forwardBaseSpeed = 6.5;
  const backwardBaseSpeed = 3.5;
  
  const p1ForwardSpeed = (p1SlowTime > 0) ? forwardBaseSpeed * 0.65 : forwardBaseSpeed;
  const p1BackwardSpeed = (p1SlowTime > 0) ? backwardBaseSpeed * 0.65 : backwardBaseSpeed;
  
  const p2ForwardSpeed = (p2SlowTime > 0) ? forwardBaseSpeed * 0.65 : forwardBaseSpeed;
  const p2BackwardSpeed = (p2SlowTime > 0) ? backwardBaseSpeed * 0.65 : backwardBaseSpeed;
  
  const singleForwardSpeed = (p1SlowTime > 0) ? forwardBaseSpeed * 0.65 : forwardBaseSpeed;
  const singleBackwardSpeed = (p1SlowTime > 0) ? backwardBaseSpeed * 0.65 : backwardBaseSpeed;

  if (mode === 'local_2p') {
    if (keysPressed['d'] || keysPressed['D'] || p1TouchMoveDirX === 1) p1X += p1ForwardSpeed;
    if (keysPressed['a'] || keysPressed['A'] || p1TouchMoveDirX === -1) p1X -= p1BackwardSpeed;
    p1X = Math.max(20, Math.min(cw - 20, p1X));

    if (keysPressed['arrowright'] || keysPressed['ArrowRight'] || p2TouchMoveDirX === 1) p2X += p2ForwardSpeed;
    if (keysPressed['arrowleft'] || keysPressed['ArrowLeft'] || p2TouchMoveDirX === -1) p2X -= p2BackwardSpeed;
    p2X = Math.max(20, Math.min(cw - 20, p2X));
  } else {
    if (keysPressed['d'] || keysPressed['D'] || keysPressed['arrowright'] || keysPressed['ArrowRight'] || touchMoveDirX === 1) playerX += singleForwardSpeed;
    if (keysPressed['a'] || keysPressed['A'] || keysPressed['arrowleft'] || keysPressed['ArrowLeft'] || touchMoveDirX === -1) playerX -= singleBackwardSpeed;
    playerX = Math.max(20, Math.min(cw - 20, playerX));
  }

  if (mode === 'local_2p') {
    p1BgOffset += p1Speed;
    p2BgOffset += p2Speed;
  } else {
    bgOffset += p1Speed;
  }

  ctx.clearRect(0, 0, cw, ch);

  if (mode === 'local_2p') {
    const sh = ch / 2;

    // ── จอผู้เล่น 1 (ครึ่งบน) ──
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, cw, sh);
    ctx.clip();

    drawRetroHills(ctx, cw, sh, p1BgOffset, 0, sh, getTierByScore(p1Score));
    
    const p1LHeight = sh / 6.5;
    const getP1Y = (lane) => sh * 0.40 + lane * p1LHeight;
    p1Y += (getP1Y(targetP1Lane) - p1Y) * 0.25;

    drawChibiPlayer(ctx, p1X, p1Y, p1BgOffset, '#FF4136', '#2b5c8f', p1IsGiant, p1InvincibleTime, p1SlowTime, p1ConfusedTime);

    for (let i = 0; i < p1Blocks.length; i++) {
      const b = p1Blocks[i];
      b.x -= p1Speed;
      const by = getP1Y(b.lane);
      drawQuestionBlock(ctx, b.x, by, b.value, b.isCorrect, b.isChosen, b.hitResolved);

      if (!b.hitResolved && b.x <= p1X + 25 && b.x >= p1X - 25) {
        b.hitResolved = true;
        if (p1Lane === b.lane) {
          b.isChosen = true;
          resolveHit(1, b.isCorrect, b.x, by);
        }
      }
    }

    for (let i = p1Monsters.length - 1; i >= 0; i--) {
      const m = p1Monsters[i];
      m.x -= p1Speed;
      const my = getP1Y(m.lane);
      drawMonster(ctx, m.x, my, m.type, p1BgOffset);

      if (!m.hitResolved && m.x <= p1X + 28 && m.x >= p1X - 28) {
        if (p1Lane === m.lane) {
          m.hitResolved = true;
          hitMonster(1, m.type, m.x, my);
        }
      }
      if (m.x < -50) p1Monsters.splice(i, 1);
    }

    for (let i = p1Items.length - 1; i >= 0; i--) {
      const it = p1Items[i];
      const itSpeed = it.isPopped ? p1Speed * 1.35 : p1Speed;
      it.x -= itSpeed;
      const ity = getP1Y(it.lane);
      drawItem(ctx, it.x, ity, it.type, p1BgOffset);

      if (!it.hitResolved && it.x <= p1X + 28 && it.x >= p1X - 28) {
        if (p1Lane === it.lane) {
          it.hitResolved = true;
          collectItem(1, it.type, it.x, ity);
        }
      }
      if (it.x < -50) p1Items.splice(i, 1);
    }

    if (p1Blocks.length > 0 && p1Blocks[p1Blocks.length - 1].x < p1X - 80) {
      generateNewQuestion(1);
    }

    // วาดโจทย์ P1 ตรงมุมจอด้านซ้ายบน
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(15, 15, 300, 50, 15);
    ctx.fill();
    ctx.stroke();
    
    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px Fredoka One, Sarabun';
    ctx.fillText(`P1 (W/S): ${p1Question ? p1Question.displayStr : ''}`, 30, 47);
    ctx.fillStyle = '#FF5722';
    ctx.fillText(`⭐ ${p1Score}`, 240, 47);
    ctx.restore();

    // วาดกล่องเวลา P1 ด้านบนขวา
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cw - 165, 15, 150, 50, 15);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px Fredoka One, Sarabun';
    ctx.textAlign = 'center';
    ctx.fillText(`⏱️ ${gameTimeLeft} วิ`, cw - 90, 47);
    ctx.restore(); // restore P1 timer box context

    // วาดเหรียญ P1
    for (let i = 0; i < coinParticles.length; i++) {
      const c = coinParticles[i];
      if (c.y < sh) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, c.life);
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFB300';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // วาดอักษรคะแนนลอย P1
    for (let i = 0; i < floatingTexts.length; i++) {
      const f = floatingTexts[i];
      if (f.y < sh) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, f.alpha);
        ctx.fillStyle = f.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.font = 'bold 26px Fredoka One, Sarabun';
        ctx.textAlign = 'center';
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      }
    }

    ctx.restore(); // restore P1 screen clip context

    // ── จอผู้เล่น 2 (ครึ่งล่าง) ──
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, sh, cw, sh);
    ctx.clip();

    drawRetroHills(ctx, cw, sh, p2BgOffset, sh, sh, getTierByScore(p2Score));
    
    // คำนวณความสูงเลน P2
    const p2LHeight = sh / 6.5;
    const getP2Y = (lane) => sh * 0.40 + lane * p2LHeight;
    p2Y += (getP2Y(targetP2Lane) - p2Y) * 0.25;

    // วาด P2 (หมวกเขียว เสื้อเขียว เอี๊ยมเขียวแก่) พร้อมบัฟ
    drawChibiPlayer(ctx, p2X, sh + p2Y, p2BgOffset, '#2ecc70', '#006400', p2IsGiant, p2InvincibleTime, p2SlowTime, p2ConfusedTime);

    // วาดและประมวลผลบล็อก P2
    for (let i = 0; i < p2Blocks.length; i++) {
      const b = p2Blocks[i];
      b.x -= p2Speed;
      const by = getP2Y(b.lane);
      drawQuestionBlock(ctx, b.x, sh + by, b.value, b.isCorrect, b.isChosen, b.hitResolved);

      if (!b.hitResolved && b.x <= p2X + 25 && b.x >= p2X - 25) {
        b.hitResolved = true;
        if (p2Lane === b.lane) {
          b.isChosen = true;
          resolveHit(2, b.isCorrect, b.x, sh + by);
        }
      }
    }

    // วาดและประมวลผลมอนสเตอร์ P2
    for (let i = p2Monsters.length - 1; i >= 0; i--) {
      const m = p2Monsters[i];
      m.x -= p2Speed;
      const my = getP2Y(m.lane);
      drawMonster(ctx, m.x, sh + my, m.type, p2BgOffset);

      if (!m.hitResolved && m.x <= p2X + 28 && m.x >= p2X - 28) {
        if (p2Lane === m.lane) {
          m.hitResolved = true;
          hitMonster(2, m.type, m.x, sh + my);
        }
      }
      if (m.x < -50) p2Monsters.splice(i, 1);
    }

    // วาดและประมวลผลไอเทม P2
    for (let i = p2Items.length - 1; i >= 0; i--) {
      const it = p2Items[i];
      const itSpeed = it.isPopped ? p2Speed * 1.35 : p2Speed;
      it.x -= itSpeed;
      const ity = getP2Y(it.lane);
      drawItem(ctx, it.x, sh + ity, it.type, p2BgOffset);

      if (!it.hitResolved && it.x <= p2X + 28 && it.x >= p2X - 28) {
        if (p2Lane === it.lane) {
          it.hitResolved = true;
          collectItem(2, it.type, it.x, sh + ity);
        }
      }
      if (it.x < -50) p2Items.splice(i, 1);
    }

    if (p2Blocks.length > 0 && p2Blocks[p2Blocks.length - 1].x < p2X - 80) {
      generateNewQuestion(2);
    }

    // วาดโจทย์ P2 ตรงมุมจอข้างซ้ายล่าง
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(15, sh + 15, 300, 50, 15);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px Fredoka One, Sarabun';
    ctx.fillText(`P2 (↑/↓): ${p2Question ? p2Question.displayStr : ''}`, 30, sh + 47);
    ctx.fillStyle = '#FF9800';
    ctx.fillText(`⭐ ${p2Score}`, 240, sh + 47);
    ctx.restore();

    // วาดกล่องเวลา P2 ด้านล่างขวา
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(cw - 165, sh + 15, 150, 50, 15);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#000';
    ctx.font = 'bold 20px Fredoka One, Sarabun';
    ctx.textAlign = 'center';
    ctx.fillText(`⏱️ ${gameTimeLeft} วิ`, cw - 90, sh + 47);
    ctx.restore(); // restore P2 timer box context

    // วาดเหรียญ P2
    for (let i = 0; i < coinParticles.length; i++) {
      const c = coinParticles[i];
      if (c.y >= sh) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, c.life);
        ctx.fillStyle = '#FFD700';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#FFB300';
        ctx.beginPath();
        ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }

    // วาดอักษรคะแนนลอย P2
    for (let i = 0; i < floatingTexts.length; i++) {
      const f = floatingTexts[i];
      if (f.y >= sh) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, f.alpha);
        ctx.fillStyle = f.color;
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 3;
        ctx.font = 'bold 26px Fredoka One, Sarabun';
        ctx.textAlign = 'center';
        ctx.strokeText(f.text, f.x, f.y);
        ctx.fillText(f.text, f.x, f.y);
        ctx.restore();
      }
    }

    ctx.restore(); // restore P2 screen clip context

    // เส้นแบ่งขีดกลางจอ
    ctx.fillStyle = '#000';
    ctx.fillRect(0, sh - 4, cw, 8);

    // ซิงค์เลนปัจจุบันของ P1 และ P2
    p1Lane = targetP1Lane;
    p2Lane = targetP2Lane;

    // แฟลชจอแดงเมื่อชนผิด
    if (p1RedFlash > 0) {
      ctx.fillStyle = `rgba(255, 0, 0, ${p1RedFlash})`;
      ctx.fillRect(0, 0, cw, sh);
      p1RedFlash -= 0.04;
    }
    if (p2RedFlash > 0) {
      ctx.fillStyle = `rgba(255, 0, 0, ${p2RedFlash})`;
      ctx.fillRect(0, sh, cw, sh);
      p2RedFlash -= 0.04;
    }

  } else {
    // ══════════════════════════════════════════════════════════
    //  โหมด 1 คน หรือ โหมดออนไลน์ (เต็มจอเดี่ยว)
    // ══════════════════════════════════════════════════════════
    
    drawRetroHills(ctx, cw, ch, bgOffset, 0, ch, getTierByScore(score));
    
    // คำนวณตำแหน่ง Y
    const laneHeight = ch / 6.5;
    const getLanesY = (lane) => ch * 0.40 + lane * laneHeight;
    playerY += (getLanesY(targetPlayerLane) - playerY) * 0.25;

    // วาดผู้เล่น (Red Cap) พร้อมบัฟ
    drawChibiPlayer(ctx, playerX, playerY, bgOffset, '#FF4136', '#2b5c8f', p1IsGiant, p1InvincibleTime, p1SlowTime, p1ConfusedTime);

    // วาดบล็อกชอยส์คำตอบ
    for (let i = 0; i < floatBlocks.length; i++) {
      const b = floatBlocks[i];
      b.x -= p1Speed;
      const by = getLanesY(b.lane);
      drawQuestionBlock(ctx, b.x, by, b.value, b.isCorrect, b.isChosen, b.hitResolved);

      // ชน
      if (!b.hitResolved && b.x <= playerX + 25 && b.x >= playerX - 25) {
        b.hitResolved = true;
        if (playerLane === b.lane) {
          b.isChosen = true;
          resolveHit(1, b.isCorrect, b.x, by);
        }
      }
    }

    // วาดและประมวลผลมอนสเตอร์ 1P
    for (let i = activeMonsters.length - 1; i >= 0; i--) {
      const m = activeMonsters[i];
      m.x -= p1Speed;
      const my = getLanesY(m.lane);
      drawMonster(ctx, m.x, my, m.type, bgOffset);

      if (!m.hitResolved && m.x <= playerX + 28 && m.x >= playerX - 28) {
        if (playerLane === m.lane) {
          m.hitResolved = true;
          hitMonster(1, m.type, m.x, my);
        }
      }
      if (m.x < -50) activeMonsters.splice(i, 1);
    }

    // วาดและประมวลผลไอเทม 1P
    for (let i = activeItems.length - 1; i >= 0; i--) {
      const it = activeItems[i];
      const itSpeed = it.isPopped ? p1Speed * 1.35 : p1Speed;
      it.x -= itSpeed;
      const ity = getLanesY(it.lane);
      drawItem(ctx, it.x, ity, it.type, bgOffset);

      if (!it.hitResolved && it.x <= playerX + 28 && it.x >= playerX - 28) {
        if (playerLane === it.lane) {
          it.hitResolved = true;
          collectItem(1, it.type, it.x, ity);
        }
      }
      if (it.x < -50) activeItems.splice(i, 1);
    }

    if (floatBlocks.length > 0 && floatBlocks[floatBlocks.length - 1].x < playerX - 80) {
      generateNewQuestion(1);
    }

    playerLane = targetPlayerLane;

    // แฟลชจอแดงเต็มจอ
    if (redFlashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 0, 0, ${redFlashAlpha})`;
      ctx.fillRect(0, 0, cw, ch);
      redFlashAlpha -= 0.04;
    }

    // วาดเหรียญ 1P
    for (let i = 0; i < coinParticles.length; i++) {
      const c = coinParticles[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, c.life);
      ctx.fillStyle = '#FFD700'; // เหรียญสีทอง
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFB300';
      ctx.beginPath();
      ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // วาดอักษรคะแนนลอย 1P
    for (let i = 0; i < floatingTexts.length; i++) {
      const f = floatingTexts[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, f.alpha);
      ctx.fillStyle = f.color;
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 3;
      ctx.font = 'bold 26px Fredoka One, Sarabun';
      ctx.textAlign = 'center';
      ctx.strokeText(f.text, f.x, f.y);
      ctx.fillText(f.text, f.x, f.y);
      ctx.restore();
    }
  }

  // ── เอฟเฟกต์ร่วม (เหรียญกระจาย + อักษรลอย) ──
  
  // เหรียญกระจาย
  for (let i = coinParticles.length - 1; i >= 0; i--) {
    const c = coinParticles[i];
    c.x += c.vx;
    c.y += c.vy;
    c.vy += 0.2; // แรงโน้มถ่วง
    c.life -= c.decay;
    if (c.life <= 0) coinParticles.splice(i, 1);
  }

  // อักษรคะแนนลอย
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const f = floatingTexts[i];
    f.y += f.vy;
    f.alpha -= 0.02;
    if (f.alpha <= 0) floatingTexts.splice(i, 1);
  }

  animationFrameId = requestAnimationFrame(loop);
}

// ตรวจสอบผลการชนเลือกคำตอบ
function resolveHit(playerIndex, isCorrect, x, y) {
  const isInvincible = playerIndex === 2 ? (p2InvincibleTime > 0) : (p1InvincibleTime > 0);

  if (isCorrect) {
    // ตอบถูก
    KAMPAI.sound.correct();
    KAMPAI.sound.fxFlash(true);
    spawnCoins(x, y);

    let base = CFG.CORRECT_POINTS;
    if (isInvincible) {
      base *= 2;
    }
    
    if (mode === 'local_2p') {
      correctAnswersCount++; // สะสมการตอบถูกร่วมกัน
      if (playerIndex === 1) {
        p1Combo++;
        const multiplier = Math.min(5, 1 + Math.floor(p1Combo / 3));
        const gain = base * multiplier;
        p1Score += gain;
        addFloatingText(x, y, `+${gain} P1! ${isInvincible ? '⭐x2' : ''}`, '#FFD700');
      } else {
        p2Combo++;
        const multiplier = Math.min(5, 1 + Math.floor(p2Combo / 3));
        const gain = base * multiplier;
        p2Score += gain;
        addFloatingText(x, y, `+${gain} P2! ${isInvincible ? '⭐x2' : ''}`, '#FFD700');
      }
    } else {
      combo++;
      correctAnswersCount++;
      const multiplier = Math.min(5, 1 + Math.floor(combo / 3));
      const gain = base * multiplier;
      score += gain;
      $('score-value').innerText = score;
      
      const b = $('combo-badge');
      if (multiplier > 1) {
        b.innerText = `🔥 COMBO x${multiplier}`;
        b.classList.remove('hidden');
      } else {
        b.classList.add('hidden');
      }
      
      addFloatingText(x, y, `+${gain} ${isInvincible ? '⭐x2' : ''}`, '#FFD700');
      
      // อัปเดตคะแนนสดโหมดออนไลน์
      if (mode === 'online' && match) {
        match.report(score, { correct: correctAnswersCount });
      }
    }

    // ไต่ระดับความเร็วขั้นบันได
    if (mode === 'local_2p') {
      if (playerIndex === 1) {
        const newSpeedStep = Math.floor(p1CorrectAnswersCount / 5);
        if (newSpeedStep > p1SpeedStep) {
          p1SpeedStep = newSpeedStep;
          addFloatingText(cw * 0.5, ch * 0.2, '⚡ P1 สปีดอัป!', '#FFD700');
        }
        p1BlockSpeed = Math.min(CFG.BLOCK_MAX_SPEED, CFG.BLOCK_START_SPEED + p1SpeedStep * 1.2);
      } else {
        const newSpeedStep = Math.floor(p2CorrectAnswersCount / 5);
        if (newSpeedStep > p2SpeedStep) {
          p2SpeedStep = newSpeedStep;
          addFloatingText(cw * 0.5, ch * 0.7, '⚡ P2 สปีดอัป!', '#FFD700');
        }
        p2BlockSpeed = Math.min(CFG.BLOCK_MAX_SPEED, CFG.BLOCK_START_SPEED + p2SpeedStep * 1.2);
      }
    } else {
      const newSpeedStep = Math.floor(p1CorrectAnswersCount / 5);
      if (newSpeedStep > p1SpeedStep) {
        p1SpeedStep = newSpeedStep;
        addFloatingText(cw * 0.5, ch * 0.2, '⚡ สปีดอัป!', '#FFD700');
      }
      p1BlockSpeed = Math.min(CFG.BLOCK_MAX_SPEED, CFG.BLOCK_START_SPEED + p1SpeedStep * 1.2);
    }
  } else {
    // ตอบผิด
    if (isInvincible) {
      // อมตะ: ไม่มีผลเสียเมื่อตอบผิด
      KAMPAI.sound.correct();
      addFloatingText(x, y, '⭐ อมตะป้องกัน!', '#FFD700');
      return;
    }

    KAMPAI.sound.wrong();
    KAMPAI.sound.fxFlash(false);
    
    if (mode === 'local_2p') {
      if (playerIndex === 1) {
        p1Combo = 0;
        p1Score = Math.max(0, p1Score - CFG.WRONG_PENALTY);
        p1RedFlash = 0.55;
        addFloatingText(x, y, `-${CFG.WRONG_PENALTY} P1`, '#f87171');
      } else {
        p2Combo = 0;
        p2Score = Math.max(0, p2Score - CFG.WRONG_PENALTY);
        p2RedFlash = 0.55;
        addFloatingText(x, y, `-${CFG.WRONG_PENALTY} P2`, '#f87171');
      }
    } else {
      combo = 0;
      $('combo-badge').classList.add('hidden');
      redFlashAlpha = 0.55;

      if (mode === 'adventure') {
        if (lives > 0) lives--;
        let s = '';
        for (let i = 0; i < CFG.LIVES; i++) s += (i < lives) ? '❤️' : '🖤';
        $('life-container').innerText = s;
        addFloatingText(x, y, `💥 เสียใจ!`, '#f87171');
        
        if (lives <= 0) {
          endGame();
        }
      } else {
        // time / online: โดนหักคะแนน
        score = Math.max(0, score - CFG.WRONG_PENALTY);
        $('score-value').innerText = score;
        addFloatingText(x, y, `-${CFG.WRONG_PENALTY}`, '#f87171');
      }
    }

    // สปีดลดลง (ขั้นบันได)
    if (mode === 'local_2p') {
      if (playerIndex === 1) {
        p1SpeedStep = Math.max(0, p1SpeedStep - 1);
        p1CorrectAnswersCount = p1SpeedStep * 5;
        p1BlockSpeed = Math.min(CFG.BLOCK_MAX_SPEED, CFG.BLOCK_START_SPEED + p1SpeedStep * 1.2);
        addFloatingText(x, y, '⚠️ P1 สปีดลดลง!', '#ff4757');
      } else {
        p2SpeedStep = Math.max(0, p2SpeedStep - 1);
        p2CorrectAnswersCount = p2SpeedStep * 5;
        p2BlockSpeed = Math.min(CFG.BLOCK_MAX_SPEED, CFG.BLOCK_START_SPEED + p2SpeedStep * 1.2);
        addFloatingText(x, y, '⚠️ P2 สปีดลดลง!', '#ff4757');
      }
    } else {
      p1SpeedStep = Math.max(0, p1SpeedStep - 1);
      p1CorrectAnswersCount = p1SpeedStep * 5;
      p1BlockSpeed = Math.min(CFG.BLOCK_MAX_SPEED, CFG.BLOCK_START_SPEED + p1SpeedStep * 1.2);
      addFloatingText(x, y, '⚠️ สปีดลดลง!', '#ff4757');
    }
  }

  // อัปเกรดเลเวลตามระดับคะแนน/ด่าน
  const currentMaxScore = mode === 'local_2p' ? Math.max(p1Score, p2Score) : score;
  const nextLvl = getTierByScore(currentMaxScore);
  if (nextLvl > level) {
    level = nextLvl;
    $('level-badge').innerText = `ด่าน ${level}`;
    addFloatingText(cw * 0.5, ch * 0.35, `⚡ ด่าน ${level}!`, '#FFD700');
  }
}

/* ── ฟังก์ชันเริ่ม/จบ เกม ── */

function startSinglePlayer(m) {
  if (window.KAMPAI) {
    window.KAMPAI._submitted = false;
  }
  if (window.parent && typeof window.parent.postMessage === 'function') {
    window.parent.postMessage({ type: 'gameStart' }, '*');
  }

  mode = m;
  started = true;
  isGameOver = false;
  score = 0;
  lives = CFG.LIVES;
  level = 1;
  combo = 0;
  correctAnswersCount = 0;
  floatBlocks = [];
  activeMonsters = [];
  activeItems = [];
  playerLane = 1;
  targetPlayerLane = 1;
  playerX = cw * 0.2;
  p1SpeedStep = 0;
  p1BlockSpeed = CFG.BLOCK_START_SPEED;
  p1CorrectAnswersCount = 0;
  bgOffset = 0;
  
  $('score-value').innerText = 0;
  $('level-badge').innerText = 'ด่าน 1';
  $('blocker').style.display = 'none';
  $('hud-container').style.display = 'flex';
  
  if (m === 'adventure') {
    $('life-container').style.display = 'block';
    let s = '';
    for (let i = 0; i < CFG.LIVES; i++) s += '❤️';
    $('life-container').innerText = s;
    $('timer-container').style.display = 'none';
  } else {
    $('life-container').style.display = 'none';
    $('timer-container').style.display = 'block';
    gameTimeLeft = CFG.TIME_SECONDS;
    $('timer-value').innerText = gameTimeLeft;
    if (timerIntervalId) clearInterval(timerIntervalId);
    timerIntervalId = setInterval(tickTimer, 1000);
  }

  KAMPAI.sound.unlock();
  KAMPAI.sound.bgmStop();
  KAMPAI.sound.bgmStart();
  
  onlineRng = null;
  generateNewQuestion(1);
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  animationFrameId = requestAnimationFrame(loop);
}

function startLocalTwoPlayer() {
  if (window.KAMPAI) {
    window.KAMPAI._submitted = false;
  }
  if (window.parent && typeof window.parent.postMessage === 'function') {
    window.parent.postMessage({ type: 'gameStart' }, '*');
  }

  mode = 'local_2p';
  started = true;
  isGameOver = false;
  p1Score = 0;
  p2Score = 0;
  p1Combo = 0;
  p2Combo = 0;
  p1Lane = 1;
  targetP1Lane = 1;
  p1X = cw * 0.2;
  p2Lane = 1;
  targetP2Lane = 1;
  p2X = cw * 0.2;
  level = 1;
  p1SpeedStep = 0;
  p1BlockSpeed = CFG.BLOCK_START_SPEED;
  p1CorrectAnswersCount = 0;
  p2SpeedStep = 0;
  p2BlockSpeed = CFG.BLOCK_START_SPEED;
  p2CorrectAnswersCount = 0;
  p1Monsters = [];
  p2Monsters = [];
  p1Items = [];
  p2Items = [];
  p1InvincibleTime = 0; p1SlowTime = 0; p1ConfusedTime = 0; p1IsGiant = false;
  p2InvincibleTime = 0; p2SlowTime = 0; p2ConfusedTime = 0; p2IsGiant = false;
  p1BgOffset = 0;
  p2BgOffset = 0;

  $('blocker').style.display = 'none';
  $('hud-container').style.display = 'none'; // ซ่อน HUD บน เพราะแบ่งเขียนจอในแคนวาสตรงๆ

  KAMPAI.sound.unlock();
  KAMPAI.sound.bgmStop();
  KAMPAI.sound.bgmStart();

  onlineRng = null;
  generateNewQuestion(1);
  generateNewQuestion(2);
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  animationFrameId = requestAnimationFrame(loop);
  
  // โหมด 2 คนในจอเดียวจะแข่งเวลากัน 60 วินาที
  gameTimeLeft = CFG.TIME_SECONDS;
  if (timerIntervalId) clearInterval(timerIntervalId);
  timerIntervalId = setInterval(() => {
    gameTimeLeft--;
    if (gameTimeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function startGame(onlineMode, opts) {
  if (window.KAMPAI) {
    window.KAMPAI._submitted = false;
  }
  if (window.parent && typeof window.parent.postMessage === 'function') {
    window.parent.postMessage({ type: 'gameStart' }, '*');
  }

  mode = onlineMode;
  started = true;
  isGameOver = false;
  score = 0;
  level = 1;
  combo = 0;
  correctAnswersCount = 0;
  floatBlocks = [];
  activeMonsters = [];
  activeItems = [];
  p1InvincibleTime = 0; p1SlowTime = 0; p1ConfusedTime = 0; p1IsGiant = false;
  playerLane = 1;
  targetPlayerLane = 1;
  playerX = cw * 0.2;
  p1SpeedStep = 0;
  p1BlockSpeed = CFG.BLOCK_START_SPEED;
  p1CorrectAnswersCount = 0;
  p2SpeedStep = 0;
  p2BlockSpeed = CFG.BLOCK_START_SPEED;
  p2CorrectAnswersCount = 0;
  bgOffset = 0;

  $('score-value').innerText = 0;
  $('level-badge').innerText = 'ด่าน 1';
  $('blocker').style.display = 'none';
  $('hud-container').style.display = 'flex';
  $('life-container').style.display = 'none';
  $('timer-container').style.display = 'none';

  KAMPAI.sound.unlock();
  KAMPAI.sound.bgmStop();
  KAMPAI.sound.bgmStart();

  // จัดการ Seeded RNG โหมดออนไลน์
  if (opts && opts.seed) {
    // ฟังก์ชันสร้างตัวเลขสุ่มจากรหัสเมลเบอร์รี่ seed
    const mulberry32 = (a) => {
      return () => {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };
    onlineRng = { next: mulberry32(opts.seed) };
  }

  generateNewQuestion(1);
  
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  animationFrameId = requestAnimationFrame(loop);
}

function tickTimer() {
  gameTimeLeft--;
  $('timer-value').innerText = gameTimeLeft;
  if (gameTimeLeft <= 0) {
    endGame();
  }
}

function endGame() {
  isGameOver = true;
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
  KAMPAI.sound.bgmStop();
  KAMPAI.sound.gameOver();

  let finalScore = score;
  let summary = '';
  
  if (mode === 'local_2p') {
    finalScore = Math.max(p1Score, p2Score);
    if (p1Score > p2Score) {
      summary = `🏆 ผู้เล่น 1 (สีแดง) ชนะ! ด้วยคะแนน ${p1Score} ต่อ ${p2Score}`;
    } else if (p2Score > p1Score) {
      summary = `🏆 ผู้เล่น 2 (สีเขียว) ชนะ! ด้วยคะแนน ${p2Score} ต่อ ${p1Score}`;
    } else {
      summary = `🤝 เสมอกัน! ด้วยคะแนน ${p1Score} เท่ากัน`;
    }
  } else {
    summary = `คุณตอบถูกไปทั้งหมด ${correctAnswersCount} ข้อ เลเวลสูงสุดคือด่าน ${level}`;
  }

  $('final-score').innerText = finalScore;
  $('go-summary').innerText = summary;

  // คำนวณดาว
  let stars = '☆☆☆';
  if (finalScore >= CFG.STAR_THRESHOLDS[2]) stars = '⭐⭐⭐';
  else if (finalScore >= CFG.STAR_THRESHOLDS[1]) stars = '⭐⭐';
  else if (finalScore >= CFG.STAR_THRESHOLDS[0]) stars = '⭐';
  $('go-stars').innerText = stars;

  // ส่งแต้มคะแนนขึ้นระบบพอร์ทัล
  if (mode !== 'online') {
    const starCount = stars.split('⭐').length - 1;
    KAMPAI.submitScore(finalScore, {
      mode: mode,
      correct: correctAnswersCount,
      stars: starCount,
      level: level,
      allowResubmit: true
    });
  } else if (match) {
    // ออนไลน์ให้ KampaiMatch ทำหน้าที่อัปโหลดคะแนน (หลังแสดงผล XP สำเร็จ)
    match.finish();
  }

  $('gameover-screen').classList.remove('hidden');
  renderLeaderboard('score-list-gameover');
}

function restartGame() {
  $('gameover-screen').classList.add('hidden');
  if (mode === 'local_2p') {
    startLocalTwoPlayer();
  } else if (mode === 'time' || mode === 'adventure') {
    startSinglePlayer(mode);
  } else {
    location.reload();
  }
}

function resetGame() {
  if (window.KAMPAI) {
    window.KAMPAI._submitted = false;
  }
  if (window.parent && typeof window.parent.postMessage === 'function') {
    window.parent.postMessage({ type: 'gameStart' }, '*');
  }

  $('gameover-screen').classList.add('hidden');
  $('hud-container').style.display = 'none';
  $('blocker').style.display = 'flex';
  $('combo-badge').classList.add('hidden');
  
  started = false;
  isGameOver = false;
  ctx.clearRect(0, 0, cw, ch);
  renderLeaderboard('score-list');
  
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  
  score = 0;
  p1Score = 0;
  p2Score = 0;
  combo = 0;
  p1Combo = 0;
  p2Combo = 0;
  correctAnswersCount = 0;
  lives = CFG.LIVES;
  level = 1;
  p1SpeedStep = 0;
  p1BlockSpeed = CFG.BLOCK_START_SPEED;
  p1CorrectAnswersCount = 0;
  p2SpeedStep = 0;
  p2BlockSpeed = CFG.BLOCK_START_SPEED;
  p2CorrectAnswersCount = 0;
  playerX = cw * 0.2;
  p1X = cw * 0.2;
  p2X = cw * 0.2;
  
  activeMonsters = [];
  activeItems = [];
  p1Monsters = [];
  p2Monsters = [];
  p1Items = [];
  p2Items = [];
  floatBlocks = [];
  p1Blocks = [];
  p2Blocks = [];
  coinParticles = [];
  floatingTexts = [];
  
  p1InvincibleTime = 0; p1SlowTime = 0; p1ConfusedTime = 0; p1IsGiant = false;
  p2InvincibleTime = 0; p2SlowTime = 0; p2ConfusedTime = 0; p2IsGiant = false;
  
  playerLane = 1;
  targetPlayerLane = 1;
  p1Lane = 1;
  targetP1Lane = 1;
  p2Lane = 1;
  targetP2Lane = 1;
  
  bgOffset = 0;
  p1BgOffset = 0;
  p2BgOffset = 0;
  
  redFlashAlpha = 0;
  p1RedFlash = 0;
  p2RedFlash = 0;
}

// ตรวจสอบสมการ
const eqBox = $('equation-mode');
if (eqBox) {
  eqBox.addEventListener('change', () => {
    isEquationMode = eqBox.checked;
    KAMPAI.sound.correct();
  });
}

// ฟังก์ชันออกจากเกมและทำความสะอาดสเตทและ PvP
function exitGame() {
  if (timerIntervalId) {
    clearInterval(timerIntervalId);
    timerIntervalId = null;
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  KAMPAI.sound.bgmStop();
  if (match) {
    try {
      match.leave();
    } catch (e) {
      console.error(e);
    }
  }
  KAMPAI.goHome();
}

window.exitGame = exitGame;

// ล้าง Match เมื่อผู้เล่นปิดหน้าต่างหรือนำทางออกไป
window.addEventListener('beforeunload', () => {
  if (match) {
    try {
      match.leave();
    } catch (e) {
      console.error(e);
    }
  }
});
