/* game.js — ลอจิกหลักของเกม Laser Reflect (พร้อมรองรับโหมดผู้เล่นสองคน/ออนไลน์) */

// ── ตัวแปรสถานะของเกม (Game State) ──
let gameState = 'menu'; // 'menu', 'playing', 'firing', 'gameover'
let gameMode = 'adventure'; // 'adventure', 'time'
let currentStageIndex = 0;
let score = 0;
let lives = 0;
let timeLeft = 0;
let timerInterval = null;
let bgmPlaying = false;
let currentRng = Math.random; // ตัวเก็บฟังก์ชันสุ่มสำหรับด่านสุ่มเดี่ยว/แข่ง

// พิกัดกระจกที่กำลังวางในด่าน
let placedMirrors = [];
let selectedMirrorId = null;

// ข้อมูลเกี่ยวกับลำแสงเลเซอร์
let laserPath = []; // รายการจุดพิกัดบน Grid เช่น [{x, y}, {x, y}]
let laserHitsTarget = false;
let laserHitObstacle = false;
let isLaserFired = false;
let laserAnimProgress = 0; // 0 ถึง 1 สำหรับ Animation การยิง

// ข้อมูลนักเรียนและสถิติจาก SDK
let studentProfile = null;
let bestScore = 0;
let playCount = 0;

// อ้างอิงอิลิเมนต์ DOM
let canvas, ctx;
let scoreValEl, timerValEl, lifeContainerEl, levelBadgeEl, comboBadgeEl, toastEl;
let mirrorsListContainerEl, levelInstructionTextEl;
let fireBtnEl, resetBtnEl;

// ── การเชื่อมต่อกับเฟรมเวิร์ก 2 ผู้เล่น (KampaiVersus) ──
const vs = KampaiVersus.create({
  duration: 60, // วินาทีต่อเกม
  title: 'ลำแสงสะท้อนเรขาคณิต',
  rankBy: 'score',
  onPlay: ({ rng, player }) => startVersusRound(rng, player),
  onEnd: () => {
    gameState = 'gameover';
    endGame(false);
  }
});

// ── การเริ่มต้นระบบและ SDK Integration ──
window.onload = function() {
  // เริ่มต้น DOM elements
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  
  scoreValEl = document.getElementById('score-value');
  timerValEl = document.getElementById('timer-value');
  lifeContainerEl = document.getElementById('life-container');
  levelBadgeEl = document.getElementById('level-badge');
  comboBadgeEl = document.getElementById('combo-badge');
  toastEl = document.getElementById('toast');
  
  mirrorsListContainerEl = document.getElementById('mirrors-list-container');
  levelInstructionTextEl = document.getElementById('level-instruction-text');
  fireBtnEl = document.getElementById('fire-btn');
  resetBtnEl = document.getElementById('reset-btn');
  
  // ปรับขนาด Canvas ให้สัมพันธ์กับหน้าจอพิกเซล
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // ตั้งเหตุการณ์คลิกและลากบน Canvas
  setupCanvasEvents();

  // เชื่อมต่อ KAMPAI SDK
  KAMPAI.onReady(function(k) {
    studentProfile = k.student;
    
    // ตั้งค่า slug ของเกม
    KAMPAI.setSlug(window.GAME_CONFIG.SLUG);

    // ดึงคะแนนสูงสุดและจำนวนครั้งที่เล่นจากสถิติของนักเรียน
    if (k.stats) {
      bestScore = k.stats.bestScore || 0;
      playCount = k.stats.plays || 0;
    }
    
    // อัปเดตข้อมูลบนหน้า Blocker
    document.getElementById('ms-best').innerText = bestScore;
    document.getElementById('ms-plays').innerText = playCount;
    
    // โหลดตารางคะแนนสูงสุด (Leaderboard)
    renderLeaderboard(k.leaderboard, 'score-list');
  });

  // รันลูปการอัปเดตและวาดกราฟิกหลัก (Game Loop)
  requestAnimationFrame(gameLoop);
};

// ปรับขนาด Canvas ให้รักษาสัดส่วน 1:1
function resizeCanvas() {
  const container = canvas.parentElement;
  const size = Math.min(container.clientWidth, container.clientHeight, 500);
  canvas.width = size;
  canvas.height = size;
}

// ── แสดงตารางอันดับนักเรียน (พร้อม Person Avatar ตามกฎ DESIGN.md Rule 14.13) ──
function renderLeaderboard(leaderboardData, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!leaderboardData || leaderboardData.length === 0) {
    container.innerHTML = '<li class="lb-loading">ไม่มีข้อมูลอันดับ</li>';
    return;
  }

  container.innerHTML = '';
  leaderboardData.slice(0, 5).forEach((item, index) => {
    const rank = index + 1;
    const studentName = item.student_name || 'นักเรียน';
    const scoreVal = item.score || 0;
    const photoUrl = item.photo_url || '/placeholder.svg';

    const li = document.createElement('li');
    li.className = 'leaderboard-item';
    li.innerHTML = `
      <div class="lb-left">
        <span class="lb-rank lb-rank-${rank}">${rank}</span>
        <div class="person-avatar-wrapper">
          <img class="person-avatar-img" src="${photoUrl}" alt="${studentName}" onerror="this.src='/placeholder.svg';">
          <span class="lb-name">${studentName}</span>
        </div>
      </div>
      <span class="lb-score">${scoreVal} แต้ม</span>
    `;
    container.appendChild(li);
  });
}

// ── เริ่มต้นโหมดการเล่นเดี่ยว (Adventure หรือ Time Attack) ──
function startGame(mode) {
  // สั่งปลดล็อกเสียงบนเบราว์เซอร์
  KAMPAI.sound.unlock();
  
  gameMode = mode;
  gameState = 'playing';
  score = 0;
  currentStageIndex = 0;
  isLaserFired = false;
  laserPath = [];
  selectedMirrorId = null;
  currentRng = Math.random; // ใช้ตัวสุ่มปกติ

  // ตั้งค่าตามโหมดการเล่น
  if (gameMode === 'adventure') {
    lives = window.GAME_CONFIG.LIVES;
    timeLeft = 0;
    timerValEl.parentElement.style.display = 'none';
    lifeContainerEl.style.display = 'block';
  } else {
    // โหมดแข่งเวลาเดี่ยว
    lives = 0;
    timeLeft = window.GAME_CONFIG.TIME_SECONDS;
    timerValEl.parentElement.style.display = 'block';
    lifeContainerEl.style.display = 'none';
    
    // เริ่มจับเวลานับถอยหลัง
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTime, 1000);
  }

  // ซ่อนหน้าจอ Blocker
  document.getElementById('blocker').style.display = 'none';
  document.getElementById('gameover-screen').style.display = 'none';

  // เล่นเพลงพื้นหลังตามตั้งค่า BGM
  KAMPAI.sound.defaultBgm(window.GAME_CONFIG.BGM);
  KAMPAI.sound.bgmStart();
  bgmPlaying = true;

  // โหลดด่านแรก
  loadStage(currentStageIndex);
}

// ── เริ่มต้นด่านแข่ง 2 ผู้เล่น (Versus Mode) ──
function startVersusRound(rng, player) {
  // สลัดปลดล็อกเสียง
  KAMPAI.sound.unlock();

  currentRng = rng || Math.random; // ใช้ rng ที่ส่งมาเพื่อให้โจทย์ตรงกันทุกตา/ทุกเครื่อง
  gameMode = 'time'; // ใช้โหมดการนับเวลาเหมือนกับ Time Attack
  gameState = 'playing';
  score = 0;
  currentStageIndex = 0;
  isLaserFired = false;
  laserPath = [];
  selectedMirrorId = null;
  lives = 0;
  timeLeft = window.GAME_CONFIG.TIME_SECONDS;
  
  // ซ่อน/แสดง HUD ปริมาณชีวิต/เวลา
  timerValEl.parentElement.style.display = 'block';
  lifeContainerEl.style.display = 'none';

  document.getElementById('blocker').style.display = 'none';
  document.getElementById('gameover-screen').style.display = 'none';

  KAMPAI.sound.defaultBgm(window.GAME_CONFIG.BGM);
  KAMPAI.sound.bgmStart();
  bgmPlaying = true;

  // โหลดด่านแรก
  currentStage = generateRandomStage(currentStageIndex + 1, currentRng);
  loadStage(currentStageIndex);
}

// โหลดข้อมูลด่าน
function loadStage(stageIndex) {
  isLaserFired = false;
  laserPath = [];
  selectedMirrorId = null;
  laserAnimProgress = 0;
  
  // อัปเดตข้อมูล UI
  levelBadgeEl.innerText = `เลเวล ${stageIndex + 1}`;
  scoreValEl.innerText = score;
  updateLivesUI();

  // ดึงข้อมูลด่าน
  let stage;
  if (gameMode === 'adventure') {
    if (stageIndex >= window.GAME_DATA.stages.length) {
      endGame(true);
      return;
    }
    stage = window.GAME_DATA.stages[stageIndex];
  } else {
    // โหมดแข่งเวลา หรือ โหมดประลองออนไลน์
    stage = generateRandomStage(stageIndex + 1, currentRng);
  }

  levelInstructionTextEl.innerHTML = `<strong>${stage.title}</strong><br>${stage.hint}`;

  // โคลนหรือจัดเตรียมกระจกสะท้อนสำหรับผู้เล่น
  placedMirrors = stage.mirrors.map(m => ({
    id: m.id,
    x: m.x,
    y: m.y,
    angle: m.angle || 0,
    requiredX: m.requiredX,
    requiredY: m.requiredY,
    requiredAngle: m.requiredAngle
  }));

  // เลือกกระจกชิ้นแรกเป็นค่าเริ่มต้น
  if (placedMirrors.length > 0) {
    selectedMirrorId = placedMirrors[0].id;
  }

  // สร้าง Sidebar สำหรับควบคุมกระจก
  renderMirrorControlPanel();
}

// อัปเดตการแสดงผลชีวิตหัวใจ
function updateLivesUI() {
  if (gameMode === 'adventure') {
    let hearts = '';
    for (let i = 0; i < window.GAME_CONFIG.LIVES; i++) {
      hearts += i < lives ? '❤️' : '🖤';
    }
    lifeContainerEl.innerText = hearts;
  }
}

// นับถอยหลังเวลา (โหมดแข่งเวลาเดี่ยว)
function updateTime() {
  if (gameState !== 'playing' && gameState !== 'firing') return;
  
  timeLeft--;
  timerValEl.innerText = timeLeft;

  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    KAMPAI.sound.timeUp();
    endGame(false);
  }
}

// ── ฟังก์ชันวาดกราฟิกหลัก (Game Loop) ──
function gameLoop() {
  // เคลียร์จอภาพ Canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // หาข้อมูลด่านปัจจุบันเพื่อนำไปใช้วาด
  let stage = null;
  if (gameState === 'playing' || gameState === 'firing') {
    if (gameMode === 'adventure') {
      stage = window.GAME_DATA.stages[currentStageIndex];
    } else {
      stage = currentStage; // ด่านที่สุ่ม
    }
  }

  if (stage) {
    // วาดองค์ประกอบของตารางพิกัด
    drawCoordinateGrid(stage.gridSize || window.GAME_CONFIG.GRID_SIZE);

    // วาดสิ่งกีดขวาง (Obstacles)
    drawObstacles(stage.obstacles, stage.gridSize || window.GAME_CONFIG.GRID_SIZE);

    // วาดเป้าหมาย (Target)
    drawTarget(stage.target, stage.gridSize || window.GAME_CONFIG.GRID_SIZE);

    // วาดกระจกสะท้อน (Mirrors)
    drawMirrors(stage.gridSize || window.GAME_CONFIG.GRID_SIZE);

    // วาดแหล่งกำเนิดเลเซอร์ (Laser Emitter)
    drawEmitter(stage.emitter, stage.gridSize || window.GAME_CONFIG.GRID_SIZE);

    // ถ้ายิงเลเซอร์แล้ว -> วาดเส้นทางลำแสงสะท้อนเลเซอร์
    if (isLaserFired) {
      drawLaserBeam(stage.gridSize || window.GAME_CONFIG.GRID_SIZE);
      
      // อัปเดต Animation ความยาวการวิ่งของเลเซอร์
      if (gameState === 'firing') {
        laserAnimProgress += 0.025; // ความเร็วของเลเซอร์วิ่ง
        if (laserAnimProgress >= 1) {
          laserAnimProgress = 1;
          gameState = 'playing';
          handleLaserResult();
        }
      }
    }
  }

  requestAnimationFrame(gameLoop);
}

// ── ฟังก์ชันวาดกราฟิกเรขาคณิตและวิถีเลเซอร์ ──

// วาดตารางพิกัด 2 มิติ (Coordinate Grid)
function drawCoordinateGrid(gridSize) {
  const margin = 40;
  const w = canvas.width - margin * 2;
  const h = canvas.height - margin * 2;

  // วาดเส้นตารางจางๆ
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.font = '10px Sarabun';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (let i = 0; i <= gridSize; i++) {
    // เส้นแนวตั้ง (แกน X)
    const x = margin + (i / gridSize) * w;
    ctx.beginPath();
    ctx.moveTo(x, margin);
    ctx.lineTo(x, canvas.height - margin);
    ctx.stroke();

    // ตัวเลขบอกพิกัดแกน X ด้านล่าง
    ctx.fillText(i, x, canvas.height - margin + 15);

    // เส้นแนวนอน (แกน Y)
    const y = canvas.height - margin - (i / gridSize) * h;
    ctx.beginPath();
    ctx.moveTo(margin, y);
    ctx.lineTo(canvas.width - margin, y);
    ctx.stroke();

    // ตัวเลขบอกพิกัดแกน Y ด้านซ้าย
    ctx.textAlign = 'right';
    ctx.fillText(i, margin - 10, y);
    ctx.textAlign = 'center';
  }

  // วาดแกนหลัก X และ Y เข้ม
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 2;

  // แกน X (ล่างสุดที่ Y=0)
  ctx.beginPath();
  ctx.moveTo(margin, canvas.height - margin);
  ctx.lineTo(canvas.width - margin, canvas.height - margin);
  ctx.stroke();

  // แกน Y (ซ้ายสุดที่ X=0)
  ctx.beginPath();
  ctx.moveTo(margin, margin);
  ctx.lineTo(margin, canvas.height - margin);
  ctx.stroke();

  // ป้ายบอกชื่อแกน
  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 12px Sarabun';
  ctx.fillText('X', canvas.width - margin + 15, canvas.height - margin);
  ctx.fillText('Y', margin, margin - 15);
}

// แปลงพิกัด Grid (0 ถึง 10) เป็นพิกัดหน้าจอ Pixel
function gridToScreen(gx, gy, gridSize) {
  const margin = 40;
  const w = canvas.width - margin * 2;
  const h = canvas.height - margin * 2;

  const sx = margin + (gx / gridSize) * w;
  const sy = canvas.height - margin - (gy / gridSize) * h;
  return { x: sx, y: sy };
}

// แปลงพิกัด Pixel เป็น Grid
function screenToGrid(sx, sy, gridSize) {
  const margin = 40;
  const w = canvas.width - margin * 2;
  const h = canvas.height - margin * 2;

  const gx = ((sx - margin) / w) * gridSize;
  const gy = ((canvas.height - margin - sy) / h) * gridSize;
  return { x: gx, y: gy };
}

// วาดสิ่งกีดขวาง
function drawObstacles(obstacles, gridSize) {
  if (!obstacles) return;

  obstacles.forEach(obs => {
    const pMin = gridToScreen(obs.x, obs.y + obs.h, gridSize);
    const pMax = gridToScreen(obs.x + obs.w, obs.y, gridSize);

    const rectWidth = pMax.x - pMin.x;
    const rectHeight = pMax.y - pMin.y;

    if (obs.type === 'danger') {
      ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.fillRect(pMin.x, pMin.y, rectWidth, rectHeight);
      ctx.strokeRect(pMin.x, pMin.y, rectWidth, rectHeight);

      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pMin.x + 4, pMin.y + 4);
      ctx.lineTo(pMax.x - 4, pMax.y - 4);
      ctx.moveTo(pMax.x - 4, pMin.y + 4);
      ctx.lineTo(pMin.x + 4, pMax.y - 4);
      ctx.stroke();
    } else {
      ctx.fillStyle = 'rgba(71, 85, 105, 0.15)';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.fillRect(pMin.x, pMin.y, rectWidth, rectHeight);
      ctx.strokeRect(pMin.x, pMin.y, rectWidth, rectHeight);

      ctx.strokeStyle = 'rgba(71, 85, 105, 0.3)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let offset = 0; offset < rectWidth + rectHeight; offset += 10) {
        ctx.moveTo(pMin.x + Math.max(0, offset - rectHeight), pMin.y + Math.min(rectHeight, offset));
        ctx.lineTo(pMin.x + Math.min(rectWidth, offset), pMin.y + Math.max(0, offset - rectWidth));
      }
      ctx.stroke();
    }
  });
}

// วาดเป้าหมาย (Target)
function drawTarget(target, gridSize) {
  const p = gridToScreen(target.x, target.y, gridSize);
  const radiusPx = (target.radius / gridSize) * (canvas.width - 80);

  const time = Date.now() * 0.003;
  const pulse = Math.sin(time) * 4;

  ctx.shadowColor = '#d97706';
  ctx.shadowBlur = 10 + pulse;

  ctx.strokeStyle = '#d97706';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radiusPx + pulse, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(p.x, p.y, radiusPx * 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.fillStyle = '#b45309';
  ctx.font = 'bold 11px Sarabun';
  ctx.fillText(`(${target.x}, ${target.y})`, p.x, p.y - radiusPx - 10);
}

// วาดแหล่งกำเนิดแสงเลเซอร์ (Emitter)
function drawEmitter(emitter, gridSize) {
  const p = gridToScreen(emitter.x, emitter.y, gridSize);
  const angleRad = (emitter.angle * Math.PI) / 180;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(-angleRad);

  ctx.fillStyle = '#475569';
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(-10, -8);
  ctx.lineTo(5, -8);
  ctx.lineTo(12, 0);
  ctx.lineTo(5, 8);
  ctx.lineTo(-10, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(10, 0, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 11px Sarabun';
  ctx.fillText(`ปล่อย: (${emitter.x}, ${emitter.y})`, p.x, p.y + 20);
}

// วาดกระจกสะท้อน (Mirrors)
function drawMirrors(gridSize) {
  placedMirrors.forEach(mirror => {
    const p = gridToScreen(mirror.x, mirror.y, gridSize);
    const lengthPx = (0.8 / gridSize) * (canvas.width - 80);
    const angleRad = (mirror.angle * Math.PI) / 180;

    const isSelected = mirror.id === selectedMirrorId;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(-angleRad);

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-lengthPx / 2, 2);
    ctx.lineTo(lengthPx / 2, 2);
    ctx.stroke();

    ctx.strokeStyle = isSelected ? '#d97706' : '#38bdf8';
    ctx.lineWidth = isSelected ? 4 : 3;
    ctx.beginPath();
    ctx.moveTo(-lengthPx / 2, -1);
    ctx.lineTo(lengthPx / 2, -1);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-lengthPx / 4, -1);
    ctx.lineTo(-lengthPx / 4 + 3, -3);
    ctx.moveTo(lengthPx / 8, -1);
    ctx.lineTo(lengthPx / 8 + 3, -3);
    ctx.stroke();

    if (isSelected) {
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -30);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();

    ctx.fillStyle = isSelected ? '#b45309' : '#475569';
    ctx.font = isSelected ? 'bold 11px Sarabun' : '10px Sarabun';
    ctx.fillText(`(${mirror.x}, ${mirror.y})`, p.x, p.y - 12);
    ctx.fillText(`${mirror.angle}°`, p.x, p.y + 16);
  });
}

// วาดเส้นแสงเลเซอร์และเอฟเฟกต์สะท้อน
function drawLaserBeam(gridSize) {
  if (laserPath.length < 2) return;

  const points = laserPath.map(pt => gridToScreen(pt.x, pt.y, gridSize));
  
  let totalLength = 0;
  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    const dx = points[i+1].x - points[i].x;
    const dy = points[i+1].y - points[i].y;
    const len = Math.sqrt(dx*dx + dy*dy);
    segments.push({ from: points[i], to: points[i+1], len: len });
    totalLength += len;
  }

  ctx.save();
  ctx.strokeStyle = '#ef4444';
  ctx.shadowColor = '#f87171';
  ctx.shadowBlur = 8;
  ctx.lineWidth = 3.5;

  let currentAnimLen = totalLength * laserAnimProgress;
  let accumulatedLen = 0;

  ctx.beginPath();
  if (points.length > 0) {
    ctx.moveTo(points[0].x, points[0].y);
  }

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (accumulatedLen + seg.len <= currentAnimLen) {
      ctx.lineTo(seg.to.x, seg.to.y);
      accumulatedLen += seg.len;
      
      if (i < segments.length - 1 && accumulatedLen <= currentAnimLen) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(seg.to.x, seg.to.y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      const remaining = currentAnimLen - accumulatedLen;
      const ratio = remaining / seg.len;
      const targetX = seg.from.x + (seg.to.x - seg.from.x) * ratio;
      const targetY = seg.from.y + (seg.to.y - seg.from.y) * ratio;
      ctx.lineTo(targetX, targetY);
      break;
    }
  }
  ctx.stroke();
  ctx.restore();
}

// ── อัลกอริทึมวิเคราะห์ลำแสงเลเซอร์ (Ray Casting) ──
function calculateLaserPath(gridSize) {
  let stage = gameMode === 'adventure' ? window.GAME_DATA.stages[currentStageIndex] : currentStage;
  
  let currentPos = { x: stage.emitter.x, y: stage.emitter.y };
  let currentAngle = stage.emitter.angle;

  laserPath = [{ x: currentPos.x, y: currentPos.y }];
  laserHitsTarget = false;
  laserHitObstacle = false;

  const maxSteps = 12;
  let step = 0;

  while (step < maxSteps) {
    const angleRad = (currentAngle * Math.PI) / 180;
    const dx = Math.cos(angleRad);
    const dy = Math.sin(angleRad);

    let closestT = Infinity;
    let collisionType = 'none';
    let collisionObject = null;
    let collisionNormal = 0;

    // 1. ตรวจสอบขอบตาราง
    if (dx > 0.0001) {
      const t = (gridSize - currentPos.x) / dx;
      if (t > 0.0001 && t < closestT) { closestT = t; collisionType = 'boundary'; }
    } else if (dx < -0.0001) {
      const t = (0 - currentPos.x) / dx;
      if (t > 0.0001 && t < closestT) { closestT = t; collisionType = 'boundary'; }
    }
    if (dy > 0.0001) {
      const t = (gridSize - currentPos.y) / dy;
      if (t > 0.0001 && t < closestT) { closestT = t; collisionType = 'boundary'; }
    } else if (dy < -0.0001) {
      const t = (0 - currentPos.y) / dy;
      if (t > 0.0001 && t < closestT) { closestT = t; collisionType = 'boundary'; }
    }

    // 2. ตรวจสอบสิ่งกีดขวาง
    if (stage.obstacles) {
      stage.obstacles.forEach(obs => {
        if (dx > 0.0001) {
          const t = (obs.x - currentPos.x) / dx;
          if (t > 0.0001 && t < closestT) {
            const hitY = currentPos.y + t * dy;
            if (hitY >= obs.y && hitY <= obs.y + obs.h) { closestT = t; collisionType = 'obstacle'; collisionObject = obs; }
          }
        }
        if (dx < -0.0001) {
          const t = (obs.x + obs.w - currentPos.x) / dx;
          if (t > 0.0001 && t < closestT) {
            const hitY = currentPos.y + t * dy;
            if (hitY >= obs.y && hitY <= obs.y + obs.h) { closestT = t; collisionType = 'obstacle'; collisionObject = obs; }
          }
        }
        if (dy > 0.0001) {
          const t = (obs.y - currentPos.y) / dy;
          if (t > 0.0001 && t < closestT) {
            const hitX = currentPos.x + t * dx;
            if (hitX >= obs.x && hitX <= obs.x + obs.w) { closestT = t; collisionType = 'obstacle'; collisionObject = obs; }
          }
        }
        if (dy < -0.0001) {
          const t = (obs.y + obs.h - currentPos.y) / dy;
          if (t > 0.0001 && t < closestT) {
            const hitX = currentPos.x + t * dx;
            if (hitX >= obs.x && hitX <= obs.x + obs.w) { closestT = t; collisionType = 'obstacle'; collisionObject = obs; }
          }
        }
      });
    }

    // 3. ตรวจสอบเป้าหมาย
    const target = stage.target;
    const toTargetX = target.x - currentPos.x;
    const toTargetY = target.y - currentPos.y;
    const projection = toTargetX * dx + toTargetY * dy;
    if (projection > 0) {
      const distSq = (toTargetX * toTargetX + toTargetY * toTargetY) - (projection * projection);
      const radSq = target.radius * target.radius;
      if (distSq <= radSq) {
        const tOffset = Math.sqrt(radSq - distSq);
        const t = projection - tOffset;
        if (t > 0.0001 && t < closestT) { closestT = t; collisionType = 'target'; }
      }
    }

    // 4. ตรวจสอบกระจกสะท้อน
    placedMirrors.forEach(mirror => {
      const mAngleRad = (mirror.angle * Math.PI) / 180;
      const mLength = 0.8;
      
      const ax = mirror.x - (mLength / 2) * Math.cos(mAngleRad);
      const ay = mirror.y - (mLength / 2) * Math.sin(mAngleRad);
      const bx = mirror.x + (mLength / 2) * Math.cos(mAngleRad);
      const by = mirror.y + (mLength / 2) * Math.sin(mAngleRad);

      const denominator = (by - ay) * dx - (bx - ax) * dy;
      if (Math.abs(denominator) > 0.0001) {
        const u = ((bx - ax) * (currentPos.y - ay) - (by - ay) * (currentPos.x - ax)) / denominator;
        const t = ((dx * (currentPos.y - ay)) - (dy * (currentPos.x - ax))) / denominator;

        if (u > 0.0001 && u < closestT && t >= 0 && t <= 1) {
          closestT = u;
          collisionType = 'mirror';
          collisionObject = mirror;
          collisionNormal = mirror.angle + 90;
        }
      }
    });

    if (closestT === Infinity) break;

    const nextPos = {
      x: currentPos.x + closestT * dx,
      y: currentPos.y + closestT * dy
    };

    laserPath.push(nextPos);

    if (collisionType === 'target') {
      laserHitsTarget = true;
      break;
    } else if (collisionType === 'obstacle') {
      laserHitObstacle = true;
      break;
    } else if (collisionType === 'boundary') {
      break;
    } else if (collisionType === 'mirror') {
      const v = { x: dx, y: dy };
      const nAngleRad = (collisionNormal * Math.PI) / 180;
      const n = { x: Math.cos(nAngleRad), y: Math.sin(nAngleRad) };

      const dot = v.x * n.x + v.y * n.y;
      const vr = {
        x: v.x - 2 * dot * n.x,
        y: v.y - 2 * dot * n.y
      };

      currentAngle = (Math.atan2(vr.y, vr.x) * 180) / Math.PI;
      if (currentAngle < 0) currentAngle += 360;

      currentPos = nextPos;
    }

    step++;
  }
}

// ── การยิงเลเซอร์และการตรวจสอบผลลัพธ์ ──
function fireLaser() {
  if (gameState !== 'playing' || isLaserFired) return;

  calculateLaserPath(window.GAME_CONFIG.GRID_SIZE);

  isLaserFired = true;
  gameState = 'firing';
  laserAnimProgress = 0;
  
  playFX('fire');

  fireBtnEl.disabled = true;
  resetBtnEl.disabled = true;
}

function playFX(type) {
  if (type === 'fire') {
    KAMPAI.sound.fxFlash();
  }
}

// จัดการผลลัพธ์หลังจากเลเซอร์วิ่งจนสุด Animation
function handleLaserResult() {
  fireBtnEl.disabled = false;
  resetBtnEl.disabled = false;

  if (laserHitsTarget) {
    KAMPAI.sound.correct();
    showToast("🎉 ยิงโดนเป้าหมายสำเร็จ! ยอดเยี่ยมมาก");
    
    score += window.GAME_CONFIG.POINTS_PER_LEVEL;
    
    // แจ้งเตือนคะแนนไปที่ Versus เพื่อซิงก์แข่งออนไลน์/สองเครื่อง
    vs.report(score, { correct: currentStageIndex + 1 });
    
    setTimeout(() => {
      currentStageIndex++;
      loadStage(currentStageIndex);
    }, 1500);

  } else {
    KAMPAI.sound.wrong();
    
    if (laserHitObstacle) {
      showToast("❌ เลเซอร์ชนสิ่งกีดขวาง!");
    } else {
      showToast("❌ เลเซอร์หลุดออกนอกตารางพิกัด!");
    }

    if (gameMode === 'adventure') {
      lives--;
      updateLivesUI();
      if (lives <= 0) {
        endGame(false);
      } else {
        isLaserFired = false;
        laserPath = [];
      }
    } else {
      isLaserFired = false;
      laserPath = [];
    }
  }
}

// ── ระบบการลากวางและเลือกกระจกสะท้อน ──
function setupCanvasEvents() {
  let isDragging = false;
  let dragMirror = null;
  let touchOffset = { x: 0, y: 0 };

  const getEventPos = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  };

  const handleStart = (e) => {
    if (gameState !== 'playing') return;
    isLaserFired = false;

    const pos = getEventPos(e);
    let stage = gameMode === 'adventure' ? window.GAME_DATA.stages[currentStageIndex] : currentStage;
    const g = screenToGrid(pos.x, pos.y, stage.gridSize || window.GAME_CONFIG.GRID_SIZE);

    let found = null;
    placedMirrors.forEach(m => {
      const dx = m.x - g.x;
      const dy = m.y - g.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 0.5) {
        found = m;
      }
    });

    if (found) {
      selectedMirrorId = found.id;
      isDragging = true;
      dragMirror = found;
      touchOffset = { x: found.x - g.x, y: found.y - g.y };
      
      renderMirrorControlPanel();
      if (e.cancelable) e.preventDefault();
    }
  };

  const handleMove = (e) => {
    if (!isDragging || !dragMirror) return;

    const pos = getEventPos(e);
    let stage = gameMode === 'adventure' ? window.GAME_DATA.stages[currentStageIndex] : currentStage;
    const g = screenToGrid(pos.x, pos.y, stage.gridSize || window.GAME_CONFIG.GRID_SIZE);

    const gridSize = stage.gridSize || window.GAME_CONFIG.GRID_SIZE;
    dragMirror.x = Math.max(0.5, Math.min(gridSize - 0.5, g.x + touchOffset.x));
    dragMirror.y = Math.max(0.5, Math.min(gridSize - 0.5, g.y + touchOffset.y));

    if (e.cancelable) e.preventDefault();
  };

  const handleEnd = () => {
    if (isDragging && dragMirror) {
      dragMirror.x = Math.round(dragMirror.x);
      dragMirror.y = Math.round(dragMirror.y);
      
      isDragging = false;
      dragMirror = null;

      renderMirrorControlPanel();
    }
  };

  canvas.addEventListener('mousedown', handleStart);
  window.addEventListener('mousemove', handleMove);
  window.addEventListener('mouseup', handleEnd);

  canvas.addEventListener('touchstart', handleStart, { passive: false });
  window.addEventListener('touchmove', handleMove, { passive: false });
  window.addEventListener('touchend', handleEnd);
}

// ── การแสดงผล Sidebar Control Panel ──
function renderMirrorControlPanel() {
  mirrorsListContainerEl.innerHTML = '';

  if (placedMirrors.length === 0) {
    mirrorsListContainerEl.innerHTML = '<p class="lb-loading">ไม่มีกระจกสะท้อนสำหรับด่านนี้</p>';
    return;
  }

  placedMirrors.forEach(mirror => {
    const isSelected = mirror.id === selectedMirrorId;
    const div = document.createElement('div');
    div.className = `mirror-card ${isSelected ? 'selected' : ''}`;
    div.onclick = () => {
      selectedMirrorId = mirror.id;
      isLaserFired = false;
      laserPath = [];
      renderMirrorControlPanel();
    };

    div.innerHTML = `
      <div class="mirror-header">
        <span>กระจกบานที่ #${mirror.id}</span>
        <span class="mirror-badge">พิกัด (${mirror.x}, ${mirror.y})</span>
      </div>
      ${isSelected ? `
        <div class="mirror-controls" onclick="event.stopPropagation()">
          <div class="control-row">
            <span>แกน X:</span>
            <div class="control-btn-group">
              <button class="control-btn" onclick="adjustMirror('x', -1)">-</button>
              <span style="font-weight:bold; min-width:24px; text-align:center;">${mirror.x}</span>
              <button class="control-btn" onclick="adjustMirror('x', 1)">+</button>
            </div>
          </div>
          <div class="control-row">
            <span>แกน Y:</span>
            <div class="control-btn-group">
              <button class="control-btn" onclick="adjustMirror('y', -1)">-</button>
              <span style="font-weight:bold; min-width:24px; text-align:center;">${mirror.y}</span>
              <button class="control-btn" onclick="adjustMirror('y', 1)">+</button>
            </div>
          </div>
          <div class="angle-slider-container">
            <div class="control-row">
              <span>มุมเอียงกระจก:</span>
              <span style="font-weight:bold; color:var(--color-gold);">${mirror.angle}°</span>
            </div>
            <input type="range" class="angle-slider" min="0" max="180" step="15" 
                   value="${mirror.angle}" oninput="adjustMirrorAngle(this.value)">
            <div class="angle-labels">
              <span>0°</span>
              <span>45°</span>
              <span>90°</span>
              <span>135°</span>
              <span>180°</span>
            </div>
          </div>
        </div>
      ` : `
        <p style="font-size:0.85rem; color:var(--muted-foreground); margin:0;">คลิกเพื่อปรับพิกัดและมุมกระจก</p>
      `}
    `;
    mirrorsListContainerEl.appendChild(div);
  });
}

// ปรับค่าพิกัดกระจกจากปุ่มคอนโทรล
function adjustMirror(axis, amount) {
  if (selectedMirrorId === null) return;
  isLaserFired = false;
  laserPath = [];

  const mirror = placedMirrors.find(m => m.id === selectedMirrorId);
  if (mirror) {
    let stage = gameMode === 'adventure' ? window.GAME_DATA.stages[currentStageIndex] : currentStage;
    const gridSize = stage.gridSize || window.GAME_CONFIG.GRID_SIZE;

    if (axis === 'x') {
      mirror.x = Math.max(0, Math.min(gridSize, mirror.x + amount));
    } else if (axis === 'y') {
      mirror.y = Math.max(0, Math.min(gridSize, mirror.y + amount));
    }
    renderMirrorControlPanel();
  }
}

// ปรับมุมเอียงกระจกจาก Slider
function adjustMirrorAngle(val) {
  if (selectedMirrorId === null) return;
  isLaserFired = false;
  laserPath = [];

  const mirror = placedMirrors.find(m => m.id === selectedMirrorId);
  if (mirror) {
    mirror.angle = parseInt(val, 10);
    renderMirrorControlPanel();
  }
}

// รีเซ็ตกระจกกลับตำแหน่งพิกัดตั้งต้นของด่าน
function resetMirrors() {
  isLaserFired = false;
  laserPath = [];
  selectedMirrorId = null;

  let stage = gameMode === 'adventure' ? window.GAME_DATA.stages[currentStageIndex] : currentStage;
  placedMirrors = stage.mirrors.map(m => ({
    id: m.id,
    x: m.x,
    y: m.y,
    angle: m.angle || 0,
    requiredX: m.requiredX,
    requiredY: m.requiredY,
    requiredAngle: m.requiredAngle
  }));

  if (placedMirrors.length > 0) {
    selectedMirrorId = placedMirrors[0].id;
  }
  renderMirrorControlPanel();
  showToast("🔄 รีเซ็ตตำแหน่งกระจกทั้งหมดเรียบร้อย");
}

// ── เครื่องมืออำนวยความสะดวก ──

// สุ่มด่านสำหรับโหมดแข่งเวลา (สุ่มพิกัดและสร้างสิ่งกีดขวางอัตโนมัติ)
let currentStage = null;
function generateRandomStage(levelNumber, rng) {
  const rand = rng || Math.random; // ใช้ deterministic RNG จาก Versus เพื่อความยุติธรรม
  const gridSize = 10;
  
  const emitterX = Math.floor(rand() * 4) + 1;
  const emitterY = Math.floor(rand() * 8) + 1;
  const directions = [0, 90, 270];
  const emitterAngle = directions[Math.floor(rand() * directions.length)];

  const targetX = Math.floor(rand() * 4) + 6;
  const targetY = Math.floor(rand() * 8) + 1;

  const obsX = Math.floor((emitterX + targetX) / 2);
  const obsY = Math.min(emitterY, targetY);
  const obsH = Math.max(2, Math.abs(emitterY - targetY));
  
  const obstacles = [];
  if (levelNumber > 1) {
    obstacles.push({
      x: obsX,
      y: Math.max(1, obsY - 1),
      w: 1,
      h: obsH,
      type: levelNumber % 3 === 0 ? 'danger' : 'wall'
    });
  }

  const numMirrors = levelNumber <= 2 ? 1 : (levelNumber <= 5 ? 2 : 3);
  const mirrors = [];
  for (let i = 1; i <= numMirrors; i++) {
    mirrors.push({
      id: i,
      x: Math.floor(rand() * 5) + 3,
      y: Math.floor(rand() * 5) + 3,
      angle: 0
    });
  }

  currentStage = {
    title: `สุ่มด่านพิเศษ #${levelNumber}`,
    hint: `เป้าหมายเรขาคณิตอยู่ที่ (${targetX}, ${targetY}) ใช้กระจก ${numMirrors} บานเพื่อนำวิถีเลเซอร์`,
    gridSize: gridSize,
    emitter: { x: emitterX, y: emitterY, angle: emitterAngle },
    target: { x: targetX, y: targetY, radius: 0.35 },
    mirrors: mirrors,
    obstacles: obstacles
  };

  return currentStage;
}

// แสดงข้อความประกาศแจ้งเตือนระยะเวลาสั้นๆ (Toast)
function showToast(msg) {
  toastEl.innerText = msg;
  toastEl.style.opacity = 1;
  setTimeout(() => {
    toastEl.style.opacity = 0;
  }, 2200);
}

// ── การควบคุมการจบเกมและการส่งคะแนน ──
function endGame(isWinComplete) {
  gameState = 'gameover';
  
  if (timerInterval) clearInterval(timerInterval);
  
  // ปิดเพลงพื้นหลัง
  KAMPAI.sound.bgmStop();
  bgmPlaying = false;
  
  // เล่นเสียงจบเกม
  KAMPAI.sound.gameOver();

  // ตรวจเช็ค guard versus finish ก่อนเพื่อส่งผลให้เฟรมเวิร์ก 2 ผู้เล่นจัดการต่อ
  if (vs.finish(score, { correct: currentStageIndex })) return;

  // คำนวณสรุปคะแนนโหมดเดี่ยว
  let bonusPoints = 0;
  if (gameMode === 'time' && timeLeft > 0) {
    bonusPoints = timeLeft * window.GAME_CONFIG.BONUS_TIME_MULTIPLIER;
  }
  const finalScore = score + bonusPoints;

  // ส่งผลคะแนนให้ระบบ SDK
  KAMPAI.submitScore(finalScore, { mode: gameMode });

  // แสดงคะแนนสูงสุดหน้าจอจบเกม
  document.getElementById('final-score').innerText = finalScore;
  
  // คำนวณเกณฑ์ดาว
  let stars = '☆☆☆';
  if (finalScore >= window.GAME_CONFIG.STAR_THRESHOLDS[2]) {
    stars = '⭐⭐⭐';
  } else if (finalScore >= window.GAME_CONFIG.STAR_THRESHOLDS[1]) {
    stars = '⭐⭐☆';
  } else if (finalScore >= window.GAME_CONFIG.STAR_THRESHOLDS[0]) {
    stars = '⭐☆☆';
  }
  document.getElementById('go-stars').innerText = stars;

  // สรุปสถิติทั่วไป
  const stagesCount = gameMode === 'adventure' ? currentStageIndex : currentStageIndex;
  document.getElementById('go-summary').innerHTML = `
    โหมดการเล่น: ${gameMode === 'adventure' ? '🗺️ ผจญภัย' : '⏱️ แข่งเวลา'}<br>
    ผ่านด่านได้ทั้งหมด: <strong>${stagesCount} ด่าน</strong><br>
    คะแนนดิบ: ${score} แต้ม<br>
    ${gameMode === 'time' ? `โบนัสเวลาคงเหลือ (${timeLeft} วินาที): +${bonusPoints} แต้ม` : ''}
  `;

  if (KAMPAI.leaderboard) {
    renderLeaderboard(KAMPAI.leaderboard, 'score-list-gameover');
  }

  // แสดงหน้าสรุปผล
  document.getElementById('gameover-screen').style.display = 'flex';
}

KAMPAI.onReady(function () {
  KAMPAI.sound.mountToggles();
});
