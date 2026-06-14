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

// ข้อมูลสำหรับ 1 Player และ Online
let playerLane = 1; // 0, 1, 2
let targetPlayerLane = 1;
let playerY = 0;
let activeQuestion = null;
let floatBlocks = []; // { x, y, lane, value, isCorrect }
let blockSpeed = CFG.BLOCK_START_SPEED;

// ข้อมูลสำหรับ Local 2 Players
let p1Lane = 1, targetP1Lane = 1, p1Y = 0, p1Score = 0, p1Lives = 3;
let p2Lane = 1, targetP2Lane = 1, p2Y = 0, p2Score = 0, p2Lives = 3;
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

function getTierByScore(val) {
  if (val > 300) return 4;
  if (val > 150) return 3;
  if (val > 60) return 2;
  return 1;
}

function generateNewQuestion(playerIndex = 1) {
  const tier = getTierByScore(playerIndex === 2 ? p2Score : score);
  const q = window.GAME_DATA.generateProblem(currentMathMode, tier, isEquationMode, onlineRng);
  
  if (mode === 'local_2p') {
    if (playerIndex === 1) {
      p1Question = q;
      p1Blocks = spawnBlocksForQuestion(q);
    } else {
      p2Question = q;
      p2Blocks = spawnBlocksForQuestion(q);
    }
  } else {
    activeQuestion = q;
    floatBlocks = spawnBlocksForQuestion(q);
    $('math-problem-bar').innerText = q.displayStr;
  }
}

function spawnBlocksForQuestion(q) {
  const blocks = [];
  // วางตัวเลือกใน 3 เลน (0, 1, 2)
  for (let l = 0; l < 3; l++) {
    blocks.push({
      x: cw + 50 + l * 40, // วางห่างกันเล็กน้อยเพื่อความมิติ
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
  if (!started || isGameOver) return;
  
  if (mode === 'local_2p') {
    // P1: W (ขึ้น), S (ลง)
    if (e.key === 'w' || e.key === 'W') {
      targetP1Lane = Math.max(0, targetP1Lane - 1);
    }
    if (e.key === 's' || e.key === 'S') {
      targetP1Lane = Math.min(2, targetP1Lane + 1);
    }
    // P2: ArrowUp, ArrowDown
    if (e.key === 'ArrowUp') {
      targetP2Lane = Math.max(0, targetP2Lane - 1);
    }
    if (e.key === 'ArrowDown') {
      targetP2Lane = Math.min(2, targetP2Lane + 1);
    }
  } else {
    // Single / Online: W, S หรือ ArrowUp, ArrowDown
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      targetPlayerLane = Math.max(0, targetPlayerLane - 1);
    }
    if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      targetPlayerLane = Math.min(2, targetPlayerLane + 1);
    }
  }
});

// สัมผัสหน้าจอมือถือ (Swipes และ Taps)
let touchStartY = 0;
window.addEventListener('touchstart', e => {
  touchStartY = e.touches[0].clientY;
}, { passive: true });

window.addEventListener('touchend', e => {
  if (!started || isGameOver) return;
  const touchEndY = e.changedTouches[0].clientY;
  const diffY = touchEndY - touchStartY;
  
  if (Math.abs(diffY) > 30) {
    const isUp = diffY < 0;
    if (mode === 'local_2p') {
      const clientX = e.changedTouches[0].clientX;
      if (clientX < cw / 2) {
        targetP1Lane = isUp ? Math.max(0, targetP1Lane - 1) : Math.min(2, targetP1Lane + 1);
      } else {
        targetP2Lane = isUp ? Math.max(0, targetP2Lane - 1) : Math.min(2, targetP2Lane + 1);
      }
    } else {
      targetPlayerLane = isUp ? Math.max(0, targetPlayerLane - 1) : Math.min(2, targetPlayerLane + 1);
    }
  }
}, { passive: true });

// แทปปุ่ม Touch Zone
function setupTouchZones() {
  const setupTap = (id, action) => {
    const el = $(id);
    if (el) {
      el.onclick = (e) => {
        e.preventDefault();
        action();
      };
    }
  };
  
  setupTap('p1-touch-up', () => {
    if (mode === 'local_2p') targetP1Lane = Math.max(0, targetP1Lane - 1);
    else targetPlayerLane = Math.max(0, targetPlayerLane - 1);
  });
  setupTap('p1-touch-down', () => {
    if (mode === 'local_2p') targetP1Lane = Math.min(2, targetP1Lane + 1);
    else targetPlayerLane = Math.min(2, targetPlayerLane + 1);
  });
  setupTap('p2-touch-up', () => {
    if (mode === 'local_2p') targetP2Lane = Math.max(0, targetP2Lane - 1);
  });
  setupTap('p2-touch-down', () => {
    if (mode === 'local_2p') targetP2Lane = Math.min(2, targetP2Lane + 1);
  });
}
setupTouchZones();

/* ── แอนิเมชันวาดรูป ── */

// วาดท้องฟ้าและสนามหญ้าอิฐดิน (สไตล์มาริโอ้)
function drawRetroHills(ctx, cw, ch, offset, screenYOffset, screenHeight) {
  ctx.save();
  ctx.translate(0, screenYOffset);
  
  // 1. Sky blue background
  ctx.fillStyle = '#5c94fc';
  ctx.fillRect(0, 0, cw, screenHeight);

  // 2. Clouds (ขยับช้าๆ)
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

  // 3. Darker Green Hills (Layer หลังสุด)
  ctx.fillStyle = '#008a00';
  const numHills = Math.ceil(cw / 260) + 2;
  for (let i = 0; i < numHills; i++) {
    const hx = i * 260 - (offset * 0.3) % 260;
    ctx.beginPath();
    ctx.arc(hx, screenHeight - 20, 140, Math.PI, 0);
    ctx.fill();
  }

  // 4. Lighter Green Hills (Layer หน้า)
  ctx.fillStyle = '#00a800';
  for (let i = 0; i < numHills; i++) {
    const hx = i * 260 - (offset * 0.5) % 260 + 130;
    ctx.beginPath();
    ctx.arc(hx, screenHeight - 10, 110, Math.PI, 0);
    ctx.fill();
  }

  // 5. Lanes (3 เลน อิฐดินปูสนามหญ้า)
  const laneHeight = screenHeight / 6.5;
  for (let l = 0; l < 3; l++) {
    const ly = screenHeight * 0.40 + l * laneHeight;
    
    // บล็อกอิฐแดงส้ม
    ctx.fillStyle = '#e45c10';
    ctx.fillRect(0, ly, cw, 22);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 3;
    ctx.strokeRect(-5, ly, cw + 10, 22);
    
    // รอยตารางอิฐบล็อก
    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 2;
    for (let bx = 0; bx < cw + 50; bx += 40) {
      ctx.beginPath();
      ctx.moveTo(bx - (offset % 40), ly);
      ctx.lineTo(bx - (offset % 40), ly + 22);
      ctx.stroke();
    }

    // หญ้าสีเขียวสดบนเลน
    ctx.fillStyle = '#00a800';
    ctx.fillRect(0, ly - 6, cw, 6);
    ctx.strokeStyle = '#000';
    ctx.strokeRect(-5, ly - 6, cw + 10, 6);
  }

  ctx.restore();
}

// วาดตัวละคร P1/P2 Chibi Retro Runner
function drawChibiPlayer(ctx, x, y, frame, colorHead, colorBody) {
  ctx.save();
  ctx.translate(x, y);

  // การแกว่งขาตอนวิ่ง
  const legSwing = Math.sin(frame * 0.22) * 14;
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
  ctx.fillStyle = colorBody;
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

  // เสื้อด้านใน (ตามสีหมวก)
  ctx.fillStyle = colorHead;
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
  ctx.fillStyle = colorHead;
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

  ctx.restore();
}

// วาดบล็อกคำถามสีทอง (? Box) สำหรับเลือกคำตอบ
function drawQuestionBlock(ctx, x, y, value, isCorrect) {
  ctx.save();
  ctx.translate(x, y);

  // บล็อกสี่เหลี่ยมสีทองขอบมน
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

  // วาดค่าของตัวเลือกตัวเลข
  ctx.fillStyle = '#000';
  ctx.font = 'bold 23px Fredoka One, Sarabun, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(value, 0, 0);

  ctx.restore();
}

// เอฟเฟกต์ยิงเหรียญกระจาย (Coins Burst)
function spawnCoins(x, y) {
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI * 2 / 8) * i + Math.random() * 0.4;
    const speed = 3 + Math.random() * 4;
    coinParticles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2, // พุ่งขึ้นเล็กน้อย
      life: 1.0,
      decay: 0.03 + Math.random() * 0.02
    });
  }
}

// เอฟเฟกต์ตัวอักษรลอยขึ้น
function addFloatingText(x, y, text, color) {
  floatingTexts.push({
    x: x,
    y: y,
    text: text,
    color: color,
    vy: -2,
    alpha: 1.0
  });
}

/* ── ลูปการประมวลผลฟิสิกส์ & เรนเดอร์ ── */

function loop() {
  if (isGameOver) return;

  bgOffset += blockSpeed; // ความเร็วขยับฉากหลังตามความเร็ววิ่ง

  // ล้างภาพแคนวาส
  ctx.clearRect(0, 0, cw, ch);

  if (mode === 'local_2p') {
    // ══════════════════════════════════════════════════════════
    //  โหมด 2 คน (แบ่งจอแยกบน-ล่าง)
    // ══════════════════════════════════════════════════════════
    
    // แบ่งจอครึ่งหนึ่ง
    const sh = ch / 2;

    // ── จอผู้เล่น 1 (ครึ่งบน) ──
    drawRetroHills(ctx, cw, sh, bgOffset, 0, sh);
    
    // คำนวณความสูงเลน P1
    const p1LHeight = sh / 6.5;
    const getP1Y = (lane) => sh * 0.40 + lane * p1LHeight;
    p1Y += (getP1Y(targetP1Lane) - p1Y) * 0.25; // Smooth Y change

    // วาด P1 (หมวกแดง เสื้อแดง เอี๊ยมน้ำเงิน)
    drawChibiPlayer(ctx, cw * 0.2, p1Y, bgOffset, '#FF4136', '#2b5c8f');

    // วาดและประมวลผลบล็อก P1
    for (let i = 0; i < p1Blocks.length; i++) {
      const b = p1Blocks[i];
      b.x -= blockSpeed;
      const by = getP1Y(b.lane);
      drawQuestionBlock(ctx, b.x, by, b.value, b.isCorrect);

      // ตรวจสอบการชน (Collision)
      if (!b.hitResolved && b.x <= cw * 0.2 + 20 && b.x >= cw * 0.2 - 20) {
        b.hitResolved = true;
        if (p1Lane === b.lane) {
          resolveHit(1, b.isCorrect, b.x, by);
        }
      }
    }

    // เกิดคำใหม่เมื่อผ่านพ้นตัวละครไปทั้งหมด
    if (p1Blocks.length > 0 && p1Blocks[0].x < cw * 0.2 - 80) {
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

    // ── จอผู้เล่น 2 (ครึ่งล่าง) ──
    drawRetroHills(ctx, cw, sh, bgOffset, sh, sh);
    
    // คำนวณความสูงเลน P2
    const p2LHeight = sh / 6.5;
    const getP2Y = (lane) => sh * 0.40 + lane * p2LHeight;
    p2Y += (getP2Y(targetP2Lane) - p2Y) * 0.25;

    // วาด P2 (หมวกเขียว เสื้อเขียว เอี๊ยมเขียวแก่)
    drawChibiPlayer(ctx, cw * 0.2, sh + p2Y, bgOffset, '#2ecc70', '#006400');

    // วาดและประมวลผลบล็อก P2
    for (let i = 0; i < p2Blocks.length; i++) {
      const b = p2Blocks[i];
      b.x -= blockSpeed;
      const by = getP2Y(b.lane);
      drawQuestionBlock(ctx, b.x, sh + by, b.value, b.isCorrect);

      if (!b.hitResolved && b.x <= cw * 0.2 + 20 && b.x >= cw * 0.2 - 20) {
        b.hitResolved = true;
        if (p2Lane === b.lane) {
          resolveHit(2, b.isCorrect, b.x, sh + by);
        }
      }
    }

    if (p2Blocks.length > 0 && p2Blocks[0].x < cw * 0.2 - 80) {
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
    
    drawRetroHills(ctx, cw, ch, bgOffset, 0, ch);
    
    // คำนวณตำแหน่ง Y
    const laneHeight = ch / 6.5;
    const getLanesY = (lane) => ch * 0.40 + lane * laneHeight;
    playerY += (getLanesY(targetPlayerLane) - playerY) * 0.25;

    // วาดผู้เล่น (Red Cap)
    drawChibiPlayer(ctx, cw * 0.2, playerY, bgOffset, '#FF4136', '#2b5c8f');

    // วาดบล็อกชอยส์คำตอบ
    for (let i = 0; i < floatBlocks.length; i++) {
      const b = floatBlocks[i];
      b.x -= blockSpeed;
      const by = getLanesY(b.lane);
      drawQuestionBlock(ctx, b.x, by, b.value, b.isCorrect);

      // ชน
      if (!b.hitResolved && b.x <= cw * 0.2 + 20 && b.x >= cw * 0.2 - 20) {
        b.hitResolved = true;
        if (playerLane === b.lane) {
          resolveHit(1, b.isCorrect, b.x, by);
        }
      }
    }

    if (floatBlocks.length > 0 && floatBlocks[0].x < cw * 0.2 - 80) {
      generateNewQuestion(1);
    }

    playerLane = targetPlayerLane;

    // แฟลชจอแดงเต็มจอ
    if (redFlashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 0, 0, ${redFlashAlpha})`;
      ctx.fillRect(0, 0, cw, ch);
      redFlashAlpha -= 0.04;
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
    
    ctx.save();
    ctx.globalAlpha = Math.max(0, c.life);
    ctx.fillStyle = '#FFD700'; // เหรียญสีทอง
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    
    // รายละเอียดขอบเหรียญด้านใน
    ctx.fillStyle = '#FFB300';
    ctx.beginPath();
    ctx.arc(c.x, c.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (c.life <= 0) coinParticles.splice(i, 1);
  }

  // อักษรคะแนนลอย
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const f = floatingTexts[i];
    f.y += f.vy;
    f.alpha -= 0.02;

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

    if (f.alpha <= 0) floatingTexts.splice(i, 1);
  }

  requestAnimationFrame(loop);
}

// ตรวจสอบผลการชนเลือกคำตอบ
function resolveHit(playerIndex, isCorrect, x, y) {
  if (isCorrect) {
    // ตอบถูก
    KAMPAI.sound.correct();
    KAMPAI.sound.fxFlash(true);
    spawnCoins(x, y);

    let base = CFG.CORRECT_POINTS;
    
    if (mode === 'local_2p') {
      if (playerIndex === 1) {
        p1Combo++;
        const multiplier = Math.min(5, 1 + Math.floor(p1Combo / 3));
        const gain = base * multiplier;
        p1Score += gain;
        addFloatingText(x, y, `+${gain} P1!`, '#FFD700');
      } else {
        p2Combo++;
        const multiplier = Math.min(5, 1 + Math.floor(p2Combo / 3));
        const gain = base * multiplier;
        p2Score += gain;
        addFloatingText(x, y, `+${gain} P2!`, '#FFD700');
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
      
      addFloatingText(x, y, `+${gain}`, '#FFD700');
      
      // อัปเดตคะแนนสดโหมดออนไลน์
      if (mode === 'online' && match) {
        match.report(score, { correct: correctAnswersCount });
      }
    }

    // ไต่ระดับความเร็ว
    if (blockSpeed < CFG.BLOCK_MAX_SPEED) {
      blockSpeed += 0.05;
    }
  } else {
    // ตอบผิด
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
        lives--;
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

    // หน่วงความเร็วลงเล็กน้อย
    blockSpeed = Math.max(CFG.BLOCK_START_SPEED, blockSpeed - 0.5);
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
  mode = m;
  started = true;
  isGameOver = false;
  score = 0;
  lives = CFG.LIVES;
  level = 1;
  combo = 0;
  correctAnswersCount = 0;
  floatBlocks = [];
  playerLane = 1;
  targetPlayerLane = 1;
  blockSpeed = CFG.BLOCK_START_SPEED;
  
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
  KAMPAI.sound.bgmStart();
  
  onlineRng = null;
  generateNewQuestion(1);
  requestAnimationFrame(loop);
}

function startLocalTwoPlayer() {
  mode = 'local_2p';
  started = true;
  isGameOver = false;
  p1Score = 0;
  p2Score = 0;
  p1Combo = 0;
  p2Combo = 0;
  p1Lane = 1;
  targetP1Lane = 1;
  p2Lane = 1;
  targetP2Lane = 1;
  level = 1;
  blockSpeed = CFG.BLOCK_START_SPEED;

  $('blocker').style.display = 'none';
  $('hud-container').style.display = 'none'; // ซ่อน HUD บน เพราะแบ่งเขียนจอในแคนวาสตรงๆ

  KAMPAI.sound.unlock();
  KAMPAI.sound.bgmStart();

  onlineRng = null;
  generateNewQuestion(1);
  generateNewQuestion(2);
  requestAnimationFrame(loop);
  
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
  mode = onlineMode;
  started = true;
  isGameOver = false;
  score = 0;
  level = 1;
  combo = 0;
  correctAnswersCount = 0;
  floatBlocks = [];
  playerLane = 1;
  targetPlayerLane = 1;
  blockSpeed = CFG.BLOCK_START_SPEED;

  $('score-value').innerText = 0;
  $('level-badge').innerText = 'ด่าน 1';
  $('blocker').style.display = 'none';
  $('hud-container').style.display = 'flex';
  $('life-container').style.display = 'none';
  $('timer-container').style.display = 'none';

  KAMPAI.sound.unlock();
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
  requestAnimationFrame(loop);
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
      level: level
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
  $('gameover-screen').classList.add('hidden');
  $('hud-container').style.display = 'none';
  $('blocker').style.display = 'flex';
  started = false;
  isGameOver = false;
  ctx.clearRect(0, 0, cw, ch);
  renderLeaderboard('score-list');
}

// ตรวจสอบสมการ
const eqBox = $('equation-mode');
if (eqBox) {
  eqBox.addEventListener('change', () => {
    isEquationMode = eqBox.checked;
    KAMPAI.sound.correct();
  });
}
