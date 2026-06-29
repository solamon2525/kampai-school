/* game.js — ลอจิกการเล่นตาชั่งสปริง ไม้บรรทัดลากทาบ และบีกเกอร์หน่วยวัด */

let currentScore = 0;
let currentLives = 3;
let currentLevelIndex = 0;
let activeLevels = [];
let isAnswered = false;

// พารามิเตอร์การลากไม้บรรทัด
let rulerX = 20; // x offset ของไม้บรรทัดเริ่มต้น
let isDraggingRuler = false;
let startDragX = 0;

const CONFIG = window.GAME_CONFIG;
KAMPAI.setSlug(CONFIG.SLUG);
const ALL_LEVELS = window.GAME_DATA.levels;

let canvas, ctx;

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

// เริ่มเล่นเกม
function startGame() {
  document.getElementById('blocker').style.display = 'none';
  document.getElementById('hud').style.display = 'flex';
  document.getElementById('play').style.display = 'flex';

  canvas = document.getElementById('interactive-canvas');
  ctx = canvas.getContext('2d');

  // สุ่มคำถาม 10 ข้อ
  activeLevels = shuffle([...ALL_LEVELS]).slice(0, 10);
  currentScore = 0;
  currentLives = CONFIG.LIVES;
  currentLevelIndex = 0;

  setupDragEvents();
  loadQuestion(0);
}

// โหลดข้อมูลด่าน
function loadQuestion(index) {
  isAnswered = false;
  currentLevelIndex = index;
  rulerX = 40; // รีเซ็ตตำแหน่งไม้บรรทัด

  document.getElementById('feedback-overlay').style.display = 'none';
  updateHUD();

  const level = activeLevels[index];

  // ตั้งค่าป้ายชื่อหมวดหมู่
  const titleEl = document.getElementById('q-title');
  const textEl = document.getElementById('q-text');
  const hintEl = document.getElementById('drag-hint');

  if (level.type.startsWith('length')) {
    titleEl.textContent = 'วัดความยาว 📏';
    hintEl.style.display = level.type === 'length' ? 'block' : 'none';
    hintEl.textContent = 'ลากทาบไม้บรรทัดวัดความยาวสิ่งของ 📏';
  } else if (level.type.startsWith('weight')) {
    titleEl.textContent = 'ชั่งน้ำหนัก ⚖️';
    hintEl.style.display = 'none';
  } else {
    titleEl.textContent = 'ตวงปริมาตร 🧪';
    hintEl.style.display = 'none';
  }

  textEl.textContent = level.question;

  // เรนเดอร์ตัวเลือก 4 ปุ่ม
  const grid = document.getElementById('options-grid');
  grid.innerHTML = '';

  level.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.onclick = () => selectAnswer(idx, btn);
    grid.appendChild(btn);
  });

  drawCanvas();
}

// อัปเดต HUD ทั่วไป
function updateHUD() {
  document.getElementById('score-value').textContent = currentScore;
  document.getElementById('level-value').textContent = currentLevelIndex + 1;

  let hearts = '';
  for (let i = 0; i < CONFIG.LIVES; i++) {
    hearts += i < currentLives ? '❤️' : '🖤';
  }
  document.getElementById('life-container').textContent = hearts;
}

// ตรวจคำตอบที่เลือก
function selectAnswer(selectedIdx, clickedBtn) {
  if (isAnswered) return;
  isAnswered = true;

  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(btn => btn.disabled = true);

  const level = activeLevels[currentLevelIndex];
  const correctIdx = level.answer;

  const fbTitle = document.getElementById('feedback-title');
  const fbDesc = document.getElementById('feedback-desc');
  const fbOverlay = document.getElementById('feedback-overlay');

  if (selectedIdx === correctIdx) {
    clickedBtn.classList.add('correct');
    currentScore += CONFIG.BASE_SCORE;
    fbTitle.textContent = 'ถูกต้องเก่งมาก! 🎉';
    fbTitle.className = 'correct';
    KAMPAI.sound.correct();
  } else {
    clickedBtn.classList.add('wrong');
    btns[correctIdx].classList.add('correct');
    currentLives--;
    fbTitle.textContent = 'ยังไม่ถูกนะ 😢';
    fbTitle.className = 'wrong';
    KAMPAI.sound.wrong();
  }

  fbDesc.textContent = level.explanation;
  fbOverlay.style.display = 'flex';
  updateHUD();
}

// ด่านถัดไป
function nextQuestion() {
  if (currentLives <= 0) {
    endGame();
    return;
  }

  if (currentLevelIndex + 1 < activeLevels.length) {
    loadQuestion(currentLevelIndex + 1);
  } else {
    endGame();
  }
}

// จบการแข่งขันเกม
function endGame() {
  let stars = 0;
  if (currentScore >= CONFIG.STAR_THRESHOLDS[2]) stars = 3;
  else if (currentScore >= CONFIG.STAR_THRESHOLDS[1]) stars = 2;
  else if (currentScore >= CONFIG.STAR_THRESHOLDS[0]) stars = 1;

  KAMPAI.submitScore(currentScore, { stars: stars });

  const starDisplay = document.getElementById('star-display');
  let starStr = '';
  for (let i = 1; i <= 3; i++) {
    starStr += i <= stars ? '⭐' : '☆';
  }
  starDisplay.textContent = starStr;

  const summaryEl = document.getElementById('go-summary');
  if (currentLives <= 0) {
    summaryEl.textContent = `หมดหัวใจเสียก่อน! คุณได้คะแนน ${currentScore} คะแนน`;
    document.getElementById('go-title').textContent = 'เกมโอเวอร์!';
  } else {
    summaryEl.textContent = `ตอบครบเรียบร้อยแล้ว! คะแนนรวมของคุณคือ ${currentScore} คะแนน`;
    document.getElementById('go-title').textContent = 'สำเร็จ!';
  }

  document.getElementById('final-score').textContent = currentScore;
  document.getElementById('gameover-screen').style.display = 'flex';
  document.getElementById('play').style.display = 'none';
  document.getElementById('hud').style.display = 'none';

  if (stars >= 2) {
    initConfetti();
  }

  renderLeaderboard(KAMPAI.leaderboard, 'score-list-gameover');
}

// ═══ CANVAS RENDERING ═══

function drawCanvas() {
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const level = activeLevels[currentLevelIndex];

  if (level.type === 'length') {
    // 1. วาดดินสอหรือวัตถุเป้าหมาย
    const drawY = 130;
    const itemHeight = 45;
    const startX = 60;

    // ร่างกล่องและปลายแหลมดินสอ
    ctx.beginPath();
    ctx.fillStyle = '#f59e0b'; // ตัวดินสอเหลือง
    ctx.rect(startX, drawY, level.itemWidth - 30, itemHeight);
    ctx.fill();

    // หัวดินสอเหลาไม้
    ctx.beginPath();
    ctx.fillStyle = '#fed7aa'; // สีเนื้อไม้
    ctx.moveTo(startX + level.itemWidth - 30, drawY);
    ctx.lineTo(startX + level.itemWidth, drawY + itemHeight/2);
    ctx.lineTo(startX + level.itemWidth - 30, drawY + itemHeight);
    ctx.fill();

    // ไส้ดินสอแหลม
    ctx.beginPath();
    ctx.fillStyle = '#374151'; // ไส้ดินสอเทาเข้ม
    ctx.moveTo(startX + level.itemWidth - 12, drawY + itemHeight/2 - 6);
    ctx.lineTo(startX + level.itemWidth, drawY + itemHeight/2);
    ctx.lineTo(startX + level.itemWidth - 12, drawY + itemHeight/2 + 6);
    ctx.fill();

    // ขอบตกแต่งดินสอให้สมจริง
    ctx.beginPath();
    ctx.fillStyle = '#e2e8f0'; // ขอบเหล็ก
    ctx.rect(startX, drawY, 12, itemHeight);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = '#f43f5e'; // ยางลบดินสอ
    ctx.rect(startX - 15, drawY, 15, itemHeight);
    ctx.fill();

    // เส้นไกด์ไลน์ขีดแนวตั้งตรงปลายดินสอสีเหลือง
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(234, 179, 8, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.moveTo(startX, drawY - 20);
    ctx.lineTo(startX, drawY + itemHeight + 20);
    ctx.moveTo(startX + level.itemWidth, drawY - 20);
    ctx.lineTo(startX + level.itemWidth, drawY + itemHeight + 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. วาดไม้บรรทัดเคลื่อนที่
    drawRuler(rulerX, 200);

  } else if (level.type === 'length-compare') {
    // วาดสิ่งของสองชิ้นเปรียบเทียบกันแบบอยู่กับที่
    // ดินสอยาว 8 ซม.
    drawStaticItem(60, 80, 240, '#f59e0b', 'ดินสอ (8 ซม.)');
    // แปรงทาสียาว 15 ซม.
    drawStaticItem(60, 160, 450, '#0ea5e9', 'แปรงทาสี (15 ซม.)');

  } else if (level.type === 'weight-read') {
    // วาดตาชั่งสปริง
    const scaleCX = 200;
    const scaleCY = 170;
    const scaleRadius = 70;

    // จานรองตาชั่งและโครงขาตั้ง
    ctx.beginPath();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 6;
    ctx.moveTo(scaleCX, scaleCY);
    ctx.lineTo(scaleCX, scaleCY - 90);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = '#94a3b8';
    ctx.ellipse(scaleCX, scaleCY - 90, 80, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // โครงร่างตาชั่งวงกลมสีขาว
    ctx.beginPath();
    ctx.arc(scaleCX, scaleCY, scaleRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#f8fafc';
    ctx.strokeStyle = '#0ea5e9';
    ctx.lineWidth = 8;
    ctx.fill();
    ctx.stroke();

    // วาดขีดตาชั่ง 0-5 กิโลกรัม
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 12px Kanit';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < 5; i++) {
      const angle = (i * 72 - 90) * Math.PI / 180; // แบ่ง 5 ช่องเท่าๆ กัน
      const tx = scaleCX + (scaleRadius - 20) * Math.cos(angle);
      const ty = scaleCY + (scaleRadius - 20) * Math.sin(angle);
      ctx.fillText(i.toString(), tx, ty);
      
      // ขีดสั้นๆ
      const x1 = scaleCX + (scaleRadius - 8) * Math.cos(angle);
      const y1 = scaleCY + (scaleRadius - 8) * Math.sin(angle);
      const x2 = scaleCX + scaleRadius * Math.cos(angle);
      const y2 = scaleCY + scaleRadius * Math.sin(angle);
      ctx.beginPath();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // เข็มตาชั่ง (ชี้ไปที่ค่าน้ำหนัก)
    // สำหรับ 3.5 กิโลกรัม
    const targetVal = level.weightVal || 3.5;
    const targetAngle = (targetVal * 72 - 90) * Math.PI / 180;
    
    ctx.beginPath();
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.moveTo(scaleCX, scaleCY);
    ctx.lineTo(scaleCX + (scaleRadius - 15) * Math.cos(targetAngle), scaleCY + (scaleRadius - 15) * Math.sin(targetAngle));
    ctx.stroke();

    // หมุดตรงกลางเข็ม
    ctx.beginPath();
    ctx.arc(scaleCX, scaleCY, 8, 0, Math.PI*2);
    ctx.fillStyle = '#1e293b';
    ctx.fill();

    // วาดผลไม้สับปะรดบนถาดรอง
    ctx.font = '54px serif';
    ctx.fillText('🍍', scaleCX, scaleCY - 110);

  } else if (level.type === 'weight-balance') {
    // ตาชั่งสองแขนสมดุล
    const scaleY = 220;
    // คาน
    ctx.beginPath();
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 8;
    ctx.moveTo(100, scaleY - 40);
    ctx.lineTo(300, scaleY - 40);
    ctx.stroke();

    // เสากลาง
    ctx.beginPath();
    ctx.moveTo(200, scaleY - 40);
    ctx.lineTo(200, scaleY + 40);
    ctx.stroke();

    // แท่นวางข้างซ้าย (แตงโม 6 กก.)
    ctx.beginPath();
    ctx.fillStyle = '#94a3b8';
    ctx.ellipse(100, scaleY - 40, 45, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '36px serif';
    ctx.fillText('🍉', 100, scaleY - 55);
    ctx.font = 'bold 13px Kanit';
    ctx.fillStyle = '#f8fafc';
    ctx.fillText('แตงโม 6 กก.', 100, scaleY - 15);

    // แท่นวางข้างขวา (ลูกตุ้มเป้าหมาย)
    ctx.beginPath();
    ctx.fillStyle = '#94a3b8';
    ctx.ellipse(300, scaleY - 40, 45, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = '28px serif';
    ctx.fillText('⚙️⚙️⚙️', 300, scaleY - 55);
    ctx.font = 'bold 13px Kanit';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('ลูกตุ้มปริศนา', 300, scaleY - 15);

  } else if (level.type === 'volume-read') {
    // วาดกระบอกตวงน้ำสีชมพู
    const glassX = 160;
    const glassY = 60;
    const glassW = 80;
    const glassH = 180;

    // ระดับน้ำตามโจทย์ (350 มล.) จากเต็มขีด 500 มล.
    const fillPercent = level.volumeVal / 500;
    const fillH = glassH * fillPercent;

    // วาดของเหลวสีชมพูพาสเทล
    ctx.beginPath();
    ctx.fillStyle = 'rgba(236, 72, 153, 0.75)'; // ชมพูโปร่งแสงเล็กน้อย
    ctx.rect(glassX, glassY + glassH - fillH, glassW, fillH);
    ctx.fill();

    // วาดขอบกระบอกแก้วตวง
    ctx.beginPath();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 4;
    ctx.moveTo(glassX, glassY);
    ctx.lineTo(glassX, glassY + glassH);
    ctx.lineTo(glassX + glassW, glassY + glassH);
    ctx.lineTo(glassX + glassW, glassY);
    ctx.stroke();

    // วาดขีดระดับ ml ด้านซ้าย
    ctx.fillStyle = '#f8fafc';
    ctx.font = '10px Kanit';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let ml = 100; ml <= 500; ml += 100) {
      const lineY = glassY + glassH - (glassH * (ml / 500));
      ctx.beginPath();
      ctx.strokeStyle = '#f8fafc';
      ctx.lineWidth = 2;
      ctx.moveTo(glassX, lineY);
      ctx.lineTo(glassX + 15, lineY);
      ctx.stroke();
      ctx.fillText(`${ml} ml`, glassX - 8, lineY);
    }
  } else {
    // โหมดเปรียบเทียบทั่วไปที่ไม่ต้องการแอนิเมชันซับซ้อน
    ctx.font = '54px serif';
    ctx.textAlign = 'center';
    ctx.fillText('🥛 🧪 📦', 200, 130);
    ctx.font = 'bold 15px Kanit';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('วิเคราะห์โจทย์คำถามและเลือกตัวเลือกที่ถูกต้อง', 200, 190);
  }
}

// วาดไม้บรรทัดเซนติเมตร
function drawRuler(rx, ry) {
  const rulerW = 420;
  const rulerH = 50;

  // ร่างตัวไม้บรรทัดโปร่งแสง
  ctx.beginPath();
  ctx.fillStyle = 'rgba(253, 224, 71, 0.4)'; // สีเหลืองโปร่งแสง
  ctx.strokeStyle = '#eab308';
  ctx.lineWidth = 3;
  ctx.rect(rx, ry, rulerW, rulerH);
  ctx.fill();
  ctx.stroke();

  // ขีดเซนติเมตร (30px = 1cm)
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#0f172a';
  ctx.font = 'bold 11px Kanit';
  ctx.textAlign = 'center';

  for (let cm = 0; cm <= 13; cm++) {
    const cx = rx + (cm * 30);
    if (cx > rx + rulerW) break;

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.moveTo(cx, ry);
    ctx.lineTo(cx, ry + 15);
    ctx.stroke();

    ctx.fillText(cm.toString(), cx, ry + 32);

    // ขีดมิลลิเมตรย่อยๆ
    for (let mm = 1; mm < 10; mm++) {
      const mx = cx + (mm * 3);
      if (mx > rx + rulerW) break;

      ctx.beginPath();
      ctx.lineWidth = 1;
      ctx.moveTo(mx, ry);
      ctx.lineTo(mx, ry + (mm === 5 ? 10 : 6));
      ctx.stroke();
    }
  }
}

// วาดกล่องวัตถุเปรียบเทียบ
function drawStaticItem(x, y, width, color, label) {
  ctx.beginPath();
  ctx.fillStyle = color;
  ctx.rect(x, y, width, 30);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 12px Kanit';
  ctx.textAlign = 'left';
  ctx.fillText(label, x + 12, y + 18);

  // ขีดบอกระยะ cm ด้านท้าย
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.moveTo(x + width, y - 10);
  ctx.lineTo(x + width, y + 40);
  ctx.stroke();
}

// ═══ DRAG EVENT HANDLERS ═══

function setupDragEvents() {
  const getPointerX = (e) => {
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    return ((clientX - rect.left) / rect.width) * canvas.width;
  };

  const onStart = (e) => {
    const x = getPointerX(e);
    const y = e.touches ? (((e.touches[0].clientY - canvas.getBoundingClientRect().top) / canvas.getBoundingClientRect().height) * canvas.height) : (((e.clientY - canvas.getBoundingClientRect().top) / canvas.getBoundingClientRect().height) * canvas.height);
    
    const level = activeLevels[currentLevelIndex];
    if (level.type !== 'length') return;

    // ตรวจสอบว่าจิ้มในพื้นที่ไม้บรรทัดหรือไม่ (y = 200 ถึง 250)
    if (y >= 190 && y <= 260 && x >= rulerX && x <= rulerX + 420) {
      isDraggingRuler = true;
      startDragX = x - rulerX;
    }
  };

  const onMove = (e) => {
    if (!isDraggingRuler) return;
    const x = getPointerX(e);
    
    rulerX = x - startDragX;
    // ล็อกขอบไม่ให้หลุด Canvas
    rulerX = Math.max(-50, Math.min(canvas.width - 150, rulerX));
    
    drawCanvas();
  };

  const onEnd = () => {
    isDraggingRuler = false;
  };

  canvas.addEventListener('mousedown', onStart);
  canvas.addEventListener('mousemove', onMove);
  canvas.addEventListener('mouseup', onEnd);
  canvas.addEventListener('mouseleave', onEnd);

  canvas.addEventListener('touchstart', onStart);
  canvas.addEventListener('touchmove', onMove);
  canvas.addEventListener('touchend', onEnd);
}

// ═══ HELPER FUNCTIONS ═══
function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

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
