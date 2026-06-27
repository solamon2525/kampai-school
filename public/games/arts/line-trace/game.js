/* game.js — ลอจิกหลักสำหรับเกม "Line Trace Art" */

let currentScore = 0;
let currentLevelIndex = 0;
let currentPointIndex = 0; // จุดที่ผู้เล่นลากผ่านแล้ว
let drawingStarted = false;
let userDrawnPoints = []; // จุดสะสมที่ผู้เล่นลากจริง
let levelAccuracySum = 0;
let levelAccuracyCount = 0;
let isLevelCompleted = false;

const CONFIG = window.GAME_CONFIG;
KAMPAI.setSlug(CONFIG.SLUG);
const TEMPLATES = window.GAME_DATA.templates;

// ส่วนเชื่อมโยง Canvas
let canvas, ctx;
let isDrawing = false;
let pulseTimer = 0;

// โหลดข้อมูล SDK เมื่อหน้าพร้อมใช้งาน
KAMPAI.onReady((sdk) => {
  const bestScore = sdk.stats?.personalBest || 0;
  const playCount = sdk.stats?.playsCount || 0;
  
  const bestEl = document.getElementById('ms-best');
  const playsEl = document.getElementById('ms-plays');
  if (bestEl) bestEl.textContent = bestScore;
  if (playsEl) playsEl.textContent = playCount;

  renderLeaderboard(sdk.leaderboard, 'score-list');

  if (sdk.student) {
    const chip = document.getElementById('player-chip');
    if (chip) {
      const studentName = sdk.student.displayName || sdk.student.name || '';
      chip.style.display = 'flex';
      chip.innerHTML = `
        <div class="pc-init">${studentName.charAt(0) || ''}</div>
        <span>${studentName}</span>
      `;
    }
  }

  sdk.sound.bgmStart(CONFIG.BGM);
});

// เริ่มต้นเกม
function startGame() {
  document.getElementById('blocker').style.display = 'none';
  document.getElementById('hud').style.display = 'flex';
  document.getElementById('play').style.display = 'flex';

  canvas = document.getElementById('paint-canvas');
  ctx = canvas.getContext('2d');

  // ตั้งค่า Event Listeners สำหรับการวาดรูป
  setupCanvasEvents();

  // โหลดด่านแรก
  currentScore = 0;
  currentLevelIndex = 0;
  loadLevel(0);

  // เริ่มต้น Loop อนิเมชันกระพริบของจุดเป้าหมาย
  requestAnimationFrame(gameLoop);
}

// ติดตั้ง Event ลากเส้น
function setupCanvasEvents() {
  const startDrawing = (e) => {
    if (isLevelCompleted) return;
    e.preventDefault();
    
    const coords = getCanvasCoords(e);
    const template = TEMPLATES[currentLevelIndex];
    const startPoint = template.points[0];
    
    // ตรวจสอบว่าเริ่มกดใกล้จุดแรกจริงหรือไม่ (ความห่างไม่เกิน 35 พิกเซล)
    const dist = Math.hypot(coords.x - startPoint.x, coords.y - startPoint.y);
    
    if (dist < 35) {
      isDrawing = true;
      drawingStarted = true;
      currentPointIndex = 0;
      userDrawnPoints = [coords];
      levelAccuracySum = 100;
      levelAccuracyCount = 1;
      
      document.getElementById('feedback-text').textContent = 'กำลังลากเส้น... ระวังอย่าให้ออกนอกเส้นประ';
      KAMPAI.sound.fxFlash();
    } else {
      document.getElementById('feedback-text').textContent = '⚠️ ต้องกดเริ่มลากที่จุดวงกลมสีเหลืองกระพริบ';
    }
  };

  const drawMove = (e) => {
    if (!isDrawing || isLevelCompleted) return;
    e.preventDefault();
    
    const coords = getCanvasCoords(e);
    userDrawnPoints.push(coords);

    const template = TEMPLATES[currentLevelIndex];
    const segmentStart = template.points[currentPointIndex];
    const segmentEnd = template.points[currentPointIndex + 1];

    if (!segmentEnd) return; // ผ่านครบทุกจุดแล้ว

    // 1. คำนวณความแม่นยำในการลาก (ระยะห่างจากส่วนของเส้นตรงปัจจุบัน)
    const dist = getDistanceToSegment(coords, segmentStart, segmentEnd);
    
    // หากห่างน้อยกว่า 12px = แม่นยำ 100% ห่างเกิน 45px = 0%
    let accuracy = 100 - ((dist - 12) / 33) * 100;
    accuracy = Math.max(0, Math.min(100, accuracy));
    
    levelAccuracySum += accuracy;
    levelAccuracyCount++;

    const currentAvgAccuracy = Math.round(levelAccuracySum / levelAccuracyCount);
    document.getElementById('accuracy-value').textContent = currentAvgAccuracy;
    document.getElementById('acc-fill').style.width = `${currentAvgAccuracy}%`;

    // 2. ตรวจสอบว่าผู้เล่นลากมาใกล้จุดสิ้นสุดเซกเมนต์หรือยัง (ความห่างไม่เกิน 20 พิกเซล)
    const distToEnd = Math.hypot(coords.x - segmentEnd.x, coords.y - segmentEnd.y);
    if (distToEnd < 20) {
      currentPointIndex++;
      
      // ดนตรีแจ้งเตือนการผ่านจุด
      if (currentPointIndex === template.points.length - 1) {
        completeLevel();
      } else {
        KAMPAI.sound.fxFlash();
      }
    }
  };

  const stopDrawing = () => {
    isDrawing = false;
    if (!isLevelCompleted && drawingStarted) {
      document.getElementById('feedback-text').textContent = 'ลากเส้นหลุดมือ! ลองกดที่จุดวงกลมกระพริบเพื่อลากใหม่อีกครั้ง';
    }
  };

  // รองรับทั้ง Mouse และ Touch
  canvas.addEventListener('mousedown', startDrawing);
  canvas.addEventListener('mousemove', drawMove);
  canvas.addEventListener('mouseup', stopDrawing);
  canvas.addEventListener('mouseleave', stopDrawing);

  canvas.addEventListener('touchstart', startDrawing);
  canvas.addEventListener('touchmove', drawMove);
  canvas.addEventListener('touchend', stopDrawing);
  canvas.addEventListener('touchcancel', stopDrawing);
}

// หาพิกัดใน Canvas กริด 400x400
function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  
  return {
    x: ((clientX - rect.left) / rect.width) * canvas.width,
    y: ((clientY - rect.top) / rect.height) * canvas.height
  };
}

// คำนวณระยะห่างระหว่างจุด P และเส้นตรง AB
function getDistanceToSegment(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const l2 = dx * dx + dy * dy;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / l2;
  t = Math.max(0, Math.min(1, t)); // ปัดให้อยู่ในเซกเมนต์เส้น
  
  const px = a.x + t * dx;
  const py = a.y + t * dy;
  return Math.hypot(p.x - px, p.y - py);
}

// โหลดและรีเซ็ตค่าของแต่ละด่าน
function loadLevel(index) {
  currentLevelIndex = index;
  currentPointIndex = 0;
  isDrawing = false;
  drawingStarted = false;
  userDrawnPoints = [];
  levelAccuracySum = 100;
  levelAccuracyCount = 1;
  isLevelCompleted = false;

  const template = TEMPLATES[index];

  // อัปเดต UI หน้าแสดง
  document.getElementById('level-value').textContent = index + 1;
  document.getElementById('shape-emoji').textContent = template.emoji;
  document.getElementById('shape-emoji').style.color = template.color;
  document.getElementById('shape-title-th').textContent = `รูป${template.nameTh}`;
  document.getElementById('shape-title-en').textContent = template.nameEn;
  document.getElementById('accuracy-value').textContent = '100';
  document.getElementById('acc-fill').style.width = '100%';
  document.getElementById('feedback-text').textContent = 'แตะจุดวงกลมกระพริบเพื่อเริ่มต้นวาด!';
  document.getElementById('level-complete-overlay').style.display = 'none';
  document.getElementById('score-value').textContent = currentScore;
}

// เริ่มด่านปัจจุบันใหม่
function restartLevel() {
  loadLevel(currentLevelIndex);
}

// เสร็จสิ้นด่านนั้นๆ
function completeLevel() {
  isLevelCompleted = true;
  isDrawing = false;
  
  const template = TEMPLATES[currentLevelIndex];
  const finalAccuracy = Math.round(levelAccuracySum / levelAccuracyCount);
  
  // คำนวณคะแนนตามความแม่นยำ
  const pointsEarned = Math.round(CONFIG.BASE_SCORE * (finalAccuracy / 100));
  currentScore += pointsEarned;
  
  // แสดงผลลัพธ์
  document.getElementById('complete-title').textContent = finalAccuracy >= CONFIG.MIN_ACCURACY ? '✨ วาดสำเร็จ!' : '❌ เกือบผ่านแล้ว!';
  document.getElementById('complete-emoji').textContent = template.emoji;
  document.getElementById('complete-emoji').style.color = template.color;
  document.getElementById('complete-accuracy').textContent = `${finalAccuracy}%`;
  document.getElementById('complete-points').textContent = pointsEarned;
  
  document.getElementById('level-complete-overlay').style.display = 'flex';
  
  if (finalAccuracy >= CONFIG.MIN_ACCURACY) {
    KAMPAI.sound.correct();
  } else {
    KAMPAI.sound.wrong();
  }
}

// ด่านถัดไป
function nextLevel() {
  if (currentLevelIndex + 1 < TEMPLATES.length) {
    loadLevel(currentLevelIndex + 1);
  } else {
    endGame();
  }
}

// อัปเดตวาดเส้นบน Canvas สม่ำเสมอ
function gameLoop() {
  pulseTimer += 0.08;
  
  if (canvas && ctx) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const template = TEMPLATES[currentLevelIndex];

    // 1. วาดเส้นร่างแบบดั้งเดิม (เส้นประจางๆ)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 4;
    ctx.setLineDash([6, 6]);
    template.points.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
    ctx.setLineDash([]); // รีเซ็ตเส้นทึบ

    // 2. ระบายสีพื้นหลังสำเร็จเมื่อผ่านด่าน
    if (isLevelCompleted) {
      ctx.beginPath();
      ctx.fillStyle = template.color + '40'; // เพิ่ม opacity
      template.points.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.fill();

      ctx.beginPath();
      ctx.strokeStyle = template.color;
      ctx.lineWidth = 8;
      template.points.forEach((p, idx) => {
        if (idx === 0) ctx.moveTo(p.x, p.y);
        else ctx.lineTo(p.x, p.y);
      });
      ctx.stroke();
    } else {
      // 3. วาดเส้นที่ลากผ่านเสร็จแล้ว (ทึบสีน้ำเงิน/เขียวตามสีตัวเทมเพลต)
      if (currentPointIndex > 0) {
        ctx.beginPath();
        ctx.strokeStyle = template.color;
        ctx.lineWidth = 7;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 0; i <= currentPointIndex; i++) {
          const p = template.points[i];
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.stroke();
      }

      // 4. วาดเส้นประเป้าหมายกระพริบส้มเหลืองที่ต้องลากต่อไป
      const nextEnd = template.points[currentPointIndex + 1];
      if (nextEnd) {
        const nextStart = template.points[currentPointIndex];
        ctx.beginPath();
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 6;
        ctx.setLineDash([4, 4]);
        ctx.moveTo(nextStart.x, nextStart.y);
        ctx.lineTo(nextEnd.x, nextEnd.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // 5. วาดเส้นลากจริงของผู้เล่นปัจจุบัน
      if (isDrawing && userDrawnPoints.length > 1) {
        ctx.beginPath();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        userDrawnPoints.forEach((p, idx) => {
          if (idx === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        });
        ctx.stroke();
      }

      // 6. วาดจุดวงกลมกระพริบ (จุดเริ่มต้น/เป้าหมาย)
      const targetPoint = template.points[currentPointIndex + 1] || template.points[0];
      const pulseRadius = 10 + Math.sin(pulseTimer) * 4;
      
      ctx.beginPath();
      ctx.arc(targetPoint.x, targetPoint.y, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#facc15';
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#eab308';
      ctx.fill();
      ctx.shadowBlur = 0; // ล้างเงา
    }
  }

  requestAnimationFrame(gameLoop);
}

// จบเกมแสดงผลรวมสถิติ
function endGame() {
  const maxScore = CONFIG.BASE_SCORE * TEMPLATES.length;
  let stars = 0;
  
  if (currentScore >= CONFIG.STAR_THRESHOLDS[2]) stars = 3;
  else if (currentScore >= CONFIG.STAR_THRESHOLDS[1]) stars = 2;
  else if (currentScore >= CONFIG.STAR_THRESHOLDS[0]) stars = 1;

  KAMPAI.submitScore(currentScore, { stars: stars });

  // แสดงผลลีดเดอร์บอร์ดท้ายเกม
  renderLeaderboard(KAMPAI.leaderboard, 'score-list-gameover');

  // ดาวเกียรติยศ
  const starDisplay = document.getElementById('star-display');
  let starStr = '';
  for (let i = 1; i <= 3; i++) {
    starStr += i <= stars ? '⭐' : '☆';
  }
  starDisplay.textContent = starStr;

  document.getElementById('go-summary').textContent = `คุณวาดภาพเสร็จสิ้นทั้งหมด 5 แบบ ทำคะแนนรวมได้ ${currentScore} / ${maxScore} คะแนน!`;
  document.getElementById('final-score').textContent = currentScore;
  
  document.getElementById('gameover-screen').style.display = 'flex';
  document.getElementById('play').style.display = 'none';
  document.getElementById('level-complete-overlay').style.display = 'none';
  document.getElementById('hud').style.display = 'none';

  if (stars >= 2) {
    initConfetti();
  }
}

// ═══ LEADERBOARD RENDER ═══
function renderLeaderboard(leaderboardData, containerId) {
  const listEl = document.getElementById(containerId);
  if (!listEl) return;
  
  listEl.innerHTML = '';
  
  if (!leaderboardData || leaderboardData.length === 0) {
    listEl.innerHTML = '<li class="lb-loading">ยังไม่มีประวัติคะแนน</li>';
    return;
  }

  leaderboardData.forEach((row, i) => {
    const isMe = KAMPAI.student && (row.studentId === KAMPAI.student.id || row.student_id === KAMPAI.student.id);
    const li = document.createElement('li');
    if (isMe) li.className = 'me';
    
    const displayName = row.displayName || row.student_name || 'เพื่อนนักเรียน';
    const score = row.personalBest !== undefined ? row.personalBest : (row.score !== undefined ? row.score : 0);
    
    li.innerHTML = `
      <span><strong>#${i + 1}</strong> ${displayName}</span>
      <span>⭐ ${score}</span>
    `;
    listEl.appendChild(li);
  });
}

// ═══ CONFETTI EFFECT ═══
let confettiActive = false;
let confettiArr = [];
const canvasConfetti = document.getElementById('confetti-canvas');
const ctxConf = canvasConfetti.getContext('2d');

function initConfetti() {
  canvasConfetti.style.display = 'block';
  canvasConfetti.width = window.innerWidth;
  canvasConfetti.height = window.innerHeight;
  confettiActive = true;
  confettiArr = [];
  
  for (let i = 0; i < 120; i++) {
    confettiArr.push({
      x: Math.random() * canvasConfetti.width,
      y: Math.random() * canvasConfetti.height - canvasConfetti.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvasConfetti.height,
      color: `hsl(${Math.random() * 360}, 90%, 60%)`,
      tilt: Math.random() * 10 - 5,
      tiltAngleIncremental: Math.random() * 0.07 + 0.02,
      tiltAngle: 0
    });
  }
  
  requestAnimationFrame(drawConfetti);
}

function drawConfetti() {
  if (!confettiActive) return;
  ctxConf.clearRect(0, 0, canvasConfetti.width, canvasConfetti.height);
  
  let finished = true;
  confettiArr.forEach((p) => {
    p.tiltAngle += p.tiltAngleIncremental;
    p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
    p.tilt = Math.sin(p.tiltAngle - p.r/2) * 15;
    
    if (p.y < canvasConfetti.height) {
      finished = false;
    }
    
    ctxConf.beginPath();
    ctxConf.lineWidth = p.r;
    ctxConf.strokeStyle = p.color;
    ctxConf.moveTo(p.x + p.tilt + p.r/2, p.y);
    ctxConf.lineTo(p.x + p.tilt, p.y + p.tilt + p.r/2);
    ctxConf.stroke();
  });
  
  if (finished) {
    confettiActive = false;
    canvasConfetti.style.display = 'none';
  } else {
    requestAnimationFrame(drawConfetti);
  }
}

window.addEventListener('resize', () => {
  if (confettiActive) {
    canvasConfetti.width = window.innerWidth;
    canvasConfetti.height = window.innerHeight;
  }
});
