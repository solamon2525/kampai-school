/* game.js — ลอจิกหลักสำหรับเกม "Color Wheel Explorer" */

let currentScore = 0;
let currentLives = 3;
let currentTab = 'explore';
let currentTheory = 'none';
let selectedColorIndex = 0;
let currentQuestionIndex = 0;
let quizList = [];
let myPalette = [];

// กำหนดตัวแปรสำหรับเกณฑ์คะแนนและข้อมูลทั่วไป
const CONFIG = window.GAME_CONFIG;
const COLORS = window.GAME_DATA.colors;
const THEORIES = window.GAME_DATA.theories;
const ALL_QUIZZES = window.GAME_DATA.quizzes;

// โหลดข้อมูล SDK เมื่อหน้าพร้อมใช้งาน
KAMPAI.onReady((sdk) => {
  // ดึงคะแนนสูงสุดและจำนวนครั้งที่เล่น
  const bestScore = sdk.stats?.high_score || 0;
  const playCount = sdk.stats?.play_count || 0;
  
  const bestEl = document.getElementById('ms-best');
  const playsEl = document.getElementById('ms-plays');
  if (bestEl) bestEl.textContent = bestScore;
  if (playsEl) playsEl.textContent = playCount;

  // โหลดรายชื่อผู้ทำคะแนนสูงสุด (Leaderboard)
  renderLeaderboard(sdk.leaderboard, 'score-list');

  // แสดง Player Chip ถ้าล็อกอินอยู่
  if (sdk.student) {
    const chip = document.getElementById('player-chip');
    if (chip) {
      chip.style.display = 'flex';
      chip.innerHTML = `
        <div class="pc-init">${sdk.student.name.charAt(0)}</div>
        <span>${sdk.student.name}</span>
      `;
    }
  }

  // เล่นเพลงพื้นหลังเริ่มต้น
  sdk.sound.bgmStart(CONFIG.BGM);
});

// เริ่มเล่นเกม (ซ่อนหน้าต้อนรับ)
function startGame() {
  document.getElementById('blocker').style.display = 'none';
  document.getElementById('hud').style.display = 'flex';
  document.getElementById('main-area').style.display = 'flex';
  
  // สร้างวงล้อสี SVG
  initColorWheel();
  selectColor(0);
  setupTheorySelector();
}

// สลับ Tab
function switchTab(tab) {
  currentTab = tab;
  
  document.getElementById('tab-explore').classList.toggle('active', tab === 'explore');
  document.getElementById('tab-quiz').classList.toggle('active', tab === 'quiz');
  
  document.getElementById('explore-view').style.display = tab === 'explore' ? 'block' : 'none';
  document.getElementById('quiz-view').style.display = tab === 'quiz' ? 'block' : 'none';

  const modeText = document.getElementById('mode-text');
  
  if (tab === 'quiz') {
    modeText.textContent = 'โหมดทดสอบ';
    initQuiz();
  } else {
    modeText.textContent = 'โหมดสำรวจ';
    clearQuizFeedback();
  }
}

// สร้างวงล้อสี SVG (12 ส่วนย่อย)
function initColorWheel() {
  const segmentGroup = document.getElementById('wheel-segments');
  segmentGroup.innerHTML = '';

  const rInner = 65;
  const rOuter = 145;

  COLORS.forEach((color, i) => {
    // หมุนให้สีแดง (Hue 0) อยู่ข้างบนพอดี (-90 องศา)
    const startAngle = i * 30 - 15 - 90;
    const endAngle = (i + 1) * 30 - 15 - 90;
    const pathData = getSectorPath(0, 0, rInner, rOuter, startAngle, endAngle);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', color.hex);
    path.setAttribute('class', 'wheel-sector');
    path.setAttribute('id', `sector-${i}`);
    path.setAttribute('style', `color: ${color.hex}`);
    path.onclick = () => selectColor(i);

    // ใส่ tooltip คำอธิบายสั้นๆ
    const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
    title.textContent = `${color.nameTh} (${color.nameEn})`;
    path.appendChild(title);

    segmentGroup.appendChild(path);
  });
}

// ฟังก์ชันหาเส้นทาง Arc ของวงกลมสำหรับ SVG
function getSectorPath(x, y, rInner, rOuter, startAngleDeg, endAngleDeg) {
  const toRad = Math.PI / 180;
  const startRad = startAngleDeg * toRad;
  const endRad = endAngleDeg * toRad;

  const x1Inner = x + rInner * Math.cos(startRad);
  const y1Inner = y + rInner * Math.sin(startRad);
  const x2Inner = x + rInner * Math.cos(endRad);
  const y2Inner = y + rInner * Math.sin(endRad);

  const x1Outer = x + rOuter * Math.cos(startRad);
  const y1Outer = y + rOuter * Math.sin(startRad);
  const x2Outer = x + rOuter * Math.cos(endRad);
  const y2Outer = y + rOuter * Math.sin(endRad);

  return `M ${x1Inner} ${y1Inner} L ${x1Outer} ${y1Outer} A ${rOuter} ${rOuter} 0 0 1 ${x2Outer} ${y2Outer} L ${x2Inner} ${y2Inner} A ${rInner} ${rInner} 0 0 0 ${x1Inner} ${y1Inner} Z`;
}

// เลือกสีบนวงล้อและคำนวณการไฮไลต์
function selectColor(index) {
  selectedColorIndex = index;
  const color = COLORS[index];
  
  // อัปเดตข้อมูลสีที่รายละเอียด
  document.getElementById('info-title').textContent = `${color.nameTh} (${color.nameEn})`;
  document.getElementById('info-color-preview').style.backgroundColor = color.hex;
  document.getElementById('info-name-th').textContent = color.nameTh;
  document.getElementById('info-name-en').textContent = color.nameEn;
  document.getElementById('info-hex').textContent = color.hex;
  
  let lvlText = '';
  if (color.level === 1) lvlText = 'แม่สีขั้นที่ 1 (Primary)';
  else if (color.level === 2) lvlText = 'แม่สีขั้นที่ 2 (Secondary)';
  else lvlText = 'แม่สีขั้นที่ 3 (Tertiary)';
  document.getElementById('info-level').textContent = lvlText;

  let toneText = '';
  if (color.tone === 'warm') toneText = 'วรรณะร้อน (Warm Tone) 🔥';
  else if (color.tone === 'cool') toneText = 'วรรณะเย็น (Cool Tone) ❄️';
  else toneText = 'เป็นได้ทั้ง 2 วรรณะ (สีกลาง) ⚖️';
  document.getElementById('info-tone').textContent = toneText;

  highlightWheel();
}

// จัดการการเลือกทฤษฎีสี
function setupTheorySelector() {
  const btns = document.querySelectorAll('.theory-btn');
  btns.forEach(btn => {
    btn.onclick = () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentTheory = btn.getAttribute('data-theory');
      
      // อัปเดตรายละเอียดของทฤษฎีสี
      updateTheoryDescription();
      highlightWheel();
    };
  });
}

function updateTheoryDescription() {
  const titleEl = document.getElementById('theory-title');
  const descEl = document.getElementById('theory-desc');

  if (currentTheory === 'none') {
    titleEl.textContent = 'โหมดอิสระ';
    descEl.textContent = 'แตะที่สีใดก็ได้บนวงล้อสีเพื่อสำรวจชื่อ, รหัสสี, และข้อมูลวรรณะสีร้อนเย็นของสีนั้นๆ';
  } else {
    const theory = THEORIES.find(t => t.id === currentTheory);
    if (theory) {
      titleEl.textContent = theory.nameTh;
      descEl.textContent = theory.descTh;
    }
  }
}

// ไฮไลต์ตามทฤษฎีสี
function highlightWheel() {
  const indicesToHighlight = new Set();
  indicesToHighlight.add(selectedColorIndex);

  const overlaysGroup = document.getElementById('wheel-overlays');
  overlaysGroup.innerHTML = '';

  const rCenter = 105; // รัศมีกึ่งกลางของวงล้อเพื่อวาดเส้นเชื่อมโยง

  if (currentTheory === 'complementary') {
    const opp = (selectedColorIndex + 6) % 12;
    indicesToHighlight.add(opp);
    
    // วาดเส้นเชื่อมสีคู่ตรงข้าม
    drawConnectionLine(selectedColorIndex, opp, rCenter, overlaysGroup);
  } else if (currentTheory === 'analogous') {
    indicesToHighlight.add((selectedColorIndex - 1 + 12) % 12);
    indicesToHighlight.add((selectedColorIndex + 1) % 12);
  } else if (currentTheory === 'triadic') {
    const t1 = (selectedColorIndex + 4) % 12;
    const t2 = (selectedColorIndex + 8) % 12;
    indicesToHighlight.add(t1);
    indicesToHighlight.add(t2);

    // วาดรูปสามเหลี่ยม
    drawTriangle(selectedColorIndex, t1, t2, rCenter, overlaysGroup);
  }

  // ปรับ opacity/class ของส่วนต่างๆ บนวงล้อ
  for (let i = 0; i < 12; i++) {
    const el = document.getElementById(`sector-${i}`);
    if (currentTheory === 'none' || indicesToHighlight.has(i)) {
      el.classList.remove('dimmed');
      el.classList.toggle('active', i === selectedColorIndex);
    } else {
      el.classList.add('dimmed');
      el.classList.remove('active');
    }
  }
}

// ฟังก์ชันหาพิกัดกึ่งกลางเซกเมนต์มุม
function getAngleCenterCoords(index, radius) {
  const angleDeg = index * 30 - 90; // หมุนให้สีแดงอยู่บนสุด
  const rad = angleDeg * (Math.PI / 180);
  return {
    x: radius * Math.cos(rad),
    y: radius * Math.sin(rad)
  };
}

// วาดเส้นเชื่อมโยงคู่ตรงข้าม
function drawConnectionLine(idx1, idx2, radius, container) {
  const p1 = getAngleCenterCoords(idx1, radius);
  const p2 = getAngleCenterCoords(idx2, radius);

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', p1.x);
  line.setAttribute('y1', p1.y);
  line.setAttribute('x2', p2.x);
  line.setAttribute('y2', p2.y);
  line.setAttribute('class', 'theory-line');
  container.appendChild(line);
}

// วาดสามเหลี่ยมเชื่อมโยง Triadic
function drawTriangle(idx1, idx2, idx3, radius, container) {
  const p1 = getAngleCenterCoords(idx1, radius);
  const p2 = getAngleCenterCoords(idx2, radius);
  const p3 = getAngleCenterCoords(idx3, radius);

  const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  poly.setAttribute('points', `${p1.x},${p1.y} ${p2.x},${p2.y} ${p3.x},${p3.y}`);
  poly.setAttribute('fill', 'none');
  poly.setAttribute('stroke', '#ffffff');
  poly.setAttribute('stroke-width', '2px');
  poly.setAttribute('stroke-dasharray', '4 4');
  poly.setAttribute('opacity', '0.7');
  container.appendChild(poly);
}

// เพิ่มสีปัจจุบันลงในพาเลท
function addToPalette() {
  const color = COLORS[selectedColorIndex];
  
  // ตรวจสอบไม่ให้สีซ้ำในพาเลท
  if (myPalette.includes(color.hex)) {
    return;
  }
  
  if (myPalette.length >= 8) {
    // จำกัดสูงสุด 8 สีในพาเลทเพื่อไม่ให้เบียดกัน
    myPalette.shift();
  }

  myPalette.push(color.hex);
  renderPalette();
  KAMPAI.sound.fxFlash();
}

// ล้างพาเลทสี
function clearPalette() {
  myPalette = [];
  renderPalette();
}

// เรนเดอร์พาเลทสีที่แสดงผล
function renderPalette() {
  const container = document.getElementById('palette-colors');
  container.innerHTML = '';

  myPalette.forEach(hex => {
    const item = document.createElement('div');
    item.className = 'palette-item';
    item.style.backgroundColor = hex;
    item.title = hex;
    
    // แตะที่สีในพาเลทจะทำการไฮไลต์สีนั้นบนวงล้อ
    item.onclick = () => {
      const idx = COLORS.findIndex(c => c.hex === hex);
      if (idx !== -1) selectColor(idx);
    };

    container.appendChild(item);
  });
}

// ═══ QUIZ MODE LOGIC ═══
function initQuiz() {
  currentScore = 0;
  currentLives = CONFIG.LIVES;
  currentQuestionIndex = 0;
  
  // สุ่มคำถาม
  quizList = shuffle([...ALL_QUIZZES]).slice(0, 10);
  
  updateHUD();
  showQuestion();
}

function updateHUD() {
  document.getElementById('score-value').textContent = currentScore;
  
  let hearts = '';
  for (let i = 0; i < CONFIG.LIVES; i++) {
    hearts += i < currentLives ? '❤️' : '🖤';
  }
  document.getElementById('life-container').textContent = hearts;
}

function showQuestion() {
  clearQuizFeedback();
  
  if (currentQuestionIndex >= quizList.length || currentLives <= 0) {
    endGame();
    return;
  }

  const qData = quizList[currentQuestionIndex];
  document.getElementById('q-index').textContent = currentQuestionIndex + 1;
  document.getElementById('q-total').textContent = quizList.length;
  document.getElementById('question-text').textContent = qData.question;

  // อัปเดตหลอดความก้าวหน้า
  const progressPercent = (currentQuestionIndex / quizList.length) * 100;
  document.getElementById('progress-fill').style.width = `${progressPercent}%`;

  const optionsContainer = document.getElementById('quiz-options');
  optionsContainer.innerHTML = '';

  qData.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.onclick = () => checkAnswer(idx, btn);
    optionsContainer.appendChild(btn);
  });
}

function checkAnswer(selectedIdx, clickedBtn) {
  // ป้องกันการกดคำตอบซ้ำหลังจากมีเฉลยแล้ว
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(btn => btn.disabled = true);

  const qData = quizList[currentQuestionIndex];
  const correctIdx = qData.answer;
  
  const fbTitle = document.getElementById('feedback-title');
  const fbExplain = document.getElementById('feedback-explanation');
  const fbOverlay = document.getElementById('quiz-feedback');

  if (selectedIdx === correctIdx) {
    clickedBtn.classList.add('correct');
    currentScore += CONFIG.BASE_SCORE;
    fbTitle.textContent = 'ถูกต้องแล้ว! 🎉';
    fbTitle.className = 'correct';
    KAMPAI.sound.correct();
  } else {
    clickedBtn.classList.add('wrong');
    // ไฮไลต์ปุ่มที่ถูกต้อง
    btns[correctIdx].classList.add('correct');
    currentLives--;
    fbTitle.textContent = 'ไม่ถูกต้อง 😢';
    fbTitle.className = 'wrong';
    KAMPAI.sound.wrong();
  }

  fbExplain.textContent = qData.explanation;
  fbOverlay.style.display = 'flex';
  updateHUD();
}

function nextQuestion() {
  currentQuestionIndex++;
  showQuestion();
}

function clearQuizFeedback() {
  document.getElementById('quiz-feedback').style.display = 'none';
}

// ═══ GAME OVER & LEADERBOARD ═══
function endGame() {
  // บันทึกสถิติและคะแนนเข้า SDK
  const totalQuestions = quizList.length;
  let stars = 0;
  
  if (currentScore >= CONFIG.STAR_THRESHOLDS[2]) stars = 3;
  else if (currentScore >= CONFIG.STAR_THRESHOLDS[1]) stars = 2;
  else if (currentScore >= CONFIG.STAR_THRESHOLDS[0]) stars = 1;

  KAMPAI.submitScore(currentScore, { stars: stars });

  // แสดงคะแนนดาว
  const starDisplay = document.getElementById('star-display');
  let starStr = '';
  for (let i = 1; i <= 3; i++) {
    starStr += i <= stars ? '⭐' : '☆';
  }
  starDisplay.textContent = starStr;

  // ตั้งข้อความสรุป
  const summaryEl = document.getElementById('go-summary');
  if (currentLives <= 0) {
    summaryEl.textContent = `หมดพลังชีวิต! คะแนนที่คุณทำได้คือ ${currentScore} คะแนน`;
    document.getElementById('go-title').textContent = 'เกมโอเวอร์!';
  } else {
    summaryEl.textContent = `ยินดีด้วย! คุณผ่านครบทุกคำถาม ทำได้สำเร็จ ${currentScore} คะแนน`;
    document.getElementById('go-title').textContent = 'เก่งมาก!';
  }

  // แสดงผลลัพธ์
  document.getElementById('final-score').textContent = currentScore;
  document.getElementById('gameover-screen').style.display = 'flex';
  document.getElementById('main-area').style.display = 'none';
  document.getElementById('hud').style.display = 'none';

  // พลุเฉลิมฉลอง
  if (stars >= 2) {
    initConfetti();
  }

  // โหลดลีดเดอร์บอร์ดหลังเกมจบ
  renderLeaderboard(KAMPAI.leaderboard, 'score-list-gameover');
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
    const isMe = KAMPAI.student && row.student_id === KAMPAI.student.id;
    const li = document.createElement('li');
    if (isMe) li.className = 'me';
    
    li.innerHTML = `
      <span><strong>#${i + 1}</strong> ${row.student_name || 'เพื่อนนักเรียน'}</span>
      <span>⭐ ${row.score}</span>
    `;
    listEl.appendChild(li);
  });
}

// ═══ CONFETTI EFFECT ═══
let confettiActive = false;
let confettiArr = [];
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');

function initConfetti() {
  canvas.style.display = 'block';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  confettiActive = true;
  confettiArr = [];
  
  for (let i = 0; i < 120; i++) {
    confettiArr.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvas.height,
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
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  let finished = true;
  confettiArr.forEach((p) => {
    p.tiltAngle += p.tiltAngleIncremental;
    p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
    p.tilt = Math.sin(p.tiltAngle - p.r/2) * 15;
    
    if (p.y < canvas.height) {
      finished = false;
    }
    
    ctx.beginPath();
    ctx.lineWidth = p.r;
    ctx.strokeStyle = p.color;
    ctx.moveTo(p.x + p.tilt + p.r/2, p.y);
    ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r/2);
    ctx.stroke();
  });
  
  if (finished) {
    confettiActive = false;
    canvas.style.display = 'none';
  } else {
    requestAnimationFrame(drawConfetti);
  }
}

window.addEventListener('resize', () => {
  if (confettiActive) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
});
