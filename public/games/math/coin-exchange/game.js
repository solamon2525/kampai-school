/* game.js — ลอจิกการคำนวณและทอนเงินในถาดสำหรับเกม "Coin Exchange" */

let currentScore = 0;
let currentLives = 3;
let currentLevelIndex = 0;
let activeTransactions = [];
let placedMoney = [];
let isAnswered = false;

const CONFIG = window.GAME_CONFIG;
KAMPAI.setSlug(CONFIG.SLUG);
const ALL_TRANSACTIONS = window.GAME_DATA.transactions;

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

// เริ่มต้นเล่นเกม
function startGame() {
  document.getElementById('blocker').style.display = 'none';
  document.getElementById('hud').style.display = 'flex';
  document.getElementById('play').style.display = 'flex';

  // สุ่มคำถาม 10 ข้อ
  activeTransactions = shuffle([...ALL_TRANSACTIONS]).slice(0, 10);
  currentScore = 0;
  currentLives = CONFIG.LIVES;
  currentLevelIndex = 0;

  loadTransaction(0);
}

// โหลดธุรกรรมซื้อขายปัจจุบัน
function loadTransaction(index) {
  isAnswered = false;
  currentLevelIndex = index;
  placedMoney = [];

  document.getElementById('feedback-overlay').style.display = 'none';
  updateHUD();
  renderTray();

  const txn = activeTransactions[index];

  // อัปเดตข้อมูลลูกค้า
  document.getElementById('cust-items').textContent = txn.items;
  document.getElementById('cust-price').textContent = txn.price;
  document.getElementById('cust-paid').textContent = txn.paid;
  document.getElementById('target-change').textContent = txn.change;
  
  // สุ่มตัวละครผู้ซื้อเพื่อความเพลิดเพลิน
  const avatars = ['🧑‍🎓', '👧', '👦', '👩‍🏫', '👨‍🏫', '🎒', '🦖'];
  const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
  document.querySelector('.customer-avatar').textContent = randomAvatar;
}

// อัปเดต HUD คะแนนและชีวิต
function updateHUD() {
  document.getElementById('score-value').textContent = currentScore;
  document.getElementById('level-value').textContent = currentLevelIndex + 1;

  let hearts = '';
  for (let i = 0; i < CONFIG.LIVES; i++) {
    hearts += i < currentLives ? '❤️' : '🖤';
  }
  document.getElementById('life-container').textContent = hearts;
}

// เพิ่มเงินในลิ้นชักเข้าถาดเงินทอน
function addMoney(value) {
  if (isAnswered) return;

  const currentSum = placedMoney.reduce((a, b) => a + b, 0);
  if (currentSum + value > 1000) {
    // จำกัดเพื่อป้องกันการสแปมปุ่ม
    return;
  }

  placedMoney.push(value);
  KAMPAI.sound.fxFlash();
  renderTray();
}

// เอาเหรียญหรือธนบัตรออกจากถาด
function removeMoney(index) {
  if (isAnswered) return;

  placedMoney.splice(index, 1);
  KAMPAI.sound.fxFlash();
  renderTray();
}

// ล้างถาดเงินทอน
function clearTray() {
  if (isAnswered) return;

  placedMoney = [];
  KAMPAI.sound.fxFlash();
  renderTray();
}

// เรนเดอร์เหรียญและธนบัตรในถาด
function renderTray() {
  const container = document.getElementById('tray-money');
  container.innerHTML = '';

  const totalSum = placedMoney.reduce((a, b) => a + b, 0);
  document.getElementById('tray-total-val').textContent = totalSum;

  placedMoney.forEach((val, idx) => {
    const el = document.createElement('div');
    el.onclick = () => removeMoney(idx);
    
    // ตั้งสไตล์ธนบัตรและเหรียญตามคลาสใน style.css
    if (val >= 20) {
      el.className = `tray-item tray-note note-${val}`;
      el.textContent = `฿${val}`;
    } else {
      el.className = `tray-item tray-coin coin-${val}`;
      el.textContent = `฿${val}`;
    }
    
    // ใส่ tooltip
    el.title = `แตะเพื่อเอาออก`;
    container.appendChild(el);
  });
}

// ยืนยันส่งเงินทอน
function submitChange() {
  if (isAnswered) return;
  isAnswered = true;

  const txn = activeTransactions[currentLevelIndex];
  const targetChange = txn.change;
  const currentSum = placedMoney.reduce((a, b) => a + b, 0);

  const fbTitle = document.getElementById('feedback-title');
  const fbDesc = document.getElementById('feedback-desc');
  const fbOverlay = document.getElementById('feedback-overlay');

  // แจงข้อมูลการทอนเงินที่ผู้เล่นใช้
  const counts = {};
  placedMoney.forEach(val => counts[val] = (counts[val] || 0) + 1);
  
  const detailTh = Object.keys(counts)
    .sort((a, b) => b - a)
    .map(key => {
      const type = key >= 20 ? 'ธนบัตร' : 'เหรียญ';
      return `${type} ${key} บาทจำนวน ${counts[key]} ชิ้น`;
    })
    .join(', ');

  if (currentSum === targetChange) {
    currentScore += CONFIG.BASE_SCORE;
    fbTitle.textContent = 'ทอนเงินถูกต้องแม่นยำ! 🎉';
    fbTitle.className = 'correct';
    fbDesc.textContent = `ยอดเยี่ยม! ทอนเงินจำนวน ${targetChange} บาทครบถ้วนโดยใช้: ${detailTh || 'ไม่ต้องการเงินทอน'}`;
    KAMPAI.sound.correct();
  } else {
    currentLives--;
    fbTitle.textContent = 'ทอนเงินผิดพลาด! 😢';
    fbTitle.className = 'wrong';
    fbDesc.textContent = `ทอนเงินไม่ถูกต้อง! ยอดทอนเป้าหมายคือ ${targetChange} บาท แต่คุณทอนไป ${currentSum} บาท`;
    KAMPAI.sound.wrong();
  }

  fbOverlay.style.display = 'flex';
  updateHUD();
}

// ด่านถัดไป
function nextQuestion() {
  if (currentLives <= 0) {
    endGame();
    return;
  }

  if (currentLevelIndex + 1 < activeTransactions.length) {
    loadTransaction(currentLevelIndex + 1);
  } else {
    endGame();
  }
}

// จบการทอนเงินทั้งหมดสรุปดาว
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
    summaryEl.textContent = `พลังชีวิตหมดลงแล้ว! คุณทำคะแนนร้านค้าสหกรณ์ได้ ${currentScore} คะแนน`;
    document.getElementById('go-title').textContent = 'เกมโอเวอร์!';
  } else {
    summaryEl.textContent = `ยอดเยี่ยม! คุณให้บริการลูกค้าจนครบถ้วน ทำคะแนนได้ ${currentScore} คะแนน`;
    document.getElementById('go-title').textContent = 'ยินดีด้วย!';
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
const canvasConf = document.getElementById('confetti-canvas');
const ctxConf = canvasConf.getContext('2d');

function initConfetti() {
  canvasConf.style.display = 'block';
  canvasConf.width = window.innerWidth;
  canvasConf.height = window.innerHeight;
  confettiActive = true;
  confettiArr = [];
  
  for (let i = 0; i < 120; i++) {
    confettiArr.push({
      x: Math.random() * canvasConf.width,
      y: Math.random() * canvasConf.height - canvasConf.height,
      r: Math.random() * 6 + 4,
      d: Math.random() * canvasConf.height,
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
  ctxConf.clearRect(0, 0, canvasConf.width, canvasConf.height);
  
  let finished = true;
  confettiArr.forEach((p) => {
    p.tiltAngle += p.tiltAngleIncremental;
    p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
    p.tilt = Math.sin(p.tiltAngle - p.r/2) * 15;
    
    if (p.y < canvasConf.height) {
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
    canvasConf.style.display = 'none';
  } else {
    requestAnimationFrame(drawConfetti);
  }
}

window.addEventListener('resize', () => {
  if (confettiActive) {
    canvasConf.width = window.innerWidth;
    canvasConf.height = window.innerHeight;
  }
});
