/* game.js — ลอจิกการเล่น ทบทวนคำศัพท์ เขียนตามคำบอก ทายความหมาย และจับคู่คำอ่าน */

let currentScore = 0;
let currentLives = 5;
let currentMode = 'auto'; // auto, dictation, choice, match
let activeCategory = null;
let categoryWords = [];
let currentWordIndex = 0;
let isAnswered = false;

// ตัวแปรเก็บประวัติการทำสำหรับคำถาม
let quizList = [];
let matchedPairsCount = 0;
let selectedMatchLeft = null;
let selectedMatchRight = null;

const CONFIG = window.GAME_CONFIG;
const CATEGORIES = window.GAME_DATA.categories;
const ALL_WORDS = window.GAME_DATA.words;

// โหลดข้อมูล SDK เมื่อหน้าพร้อมใช้งาน
KAMPAI.onReady((sdk) => {
  const bestScore = sdk.stats?.high_score || 0;
  const playCount = sdk.stats?.play_count || 0;
  
  const bestEl = document.getElementById('ms-best');
  const playsEl = document.getElementById('ms-plays');
  if (bestEl) bestEl.textContent = bestScore;
  if (playsEl) playsEl.textContent = playCount;

  renderLeaderboard(sdk.leaderboard, 'score-list');

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

  sdk.sound.bgmStart(CONFIG.BGM);
  
  // แสดงรายการหัวใจเริ่มต้นสำหรับ HUD (แสดงเป็น DOM เผื่อไว้)
  const hud = document.getElementById('hud');
  if (hud) {
    hud.innerHTML = `
      <div id="score-container">⭐ <span id="score-val-hud">0</span></div>
      <div id="life-container">❤️❤️❤️❤️❤️</div>
      <div id="level-container">หมวด: <span id="cat-val-hud">—</span></div>
      <div id="player-chip"></div>
    `;
  }
});

// เริ่มเล่นแสดงหน้าเลือกหัวข้อ
window.onload = () => {
  initHubGrid();
};

// สร้างการ์ดหมวดหมู่ใน Hub
function initHubGrid() {
  const grid = document.getElementById('hub-grid');
  grid.innerHTML = '';

  CATEGORIES.forEach(cat => {
    const card = document.createElement('div');
    card.className = 'hub-card';
    card.onclick = () => selectCategory(cat.slug);

    card.innerHTML = `
      <div class="hc-icon">${cat.icon}</div>
      <div class="hc-th">${cat.title}</div>
      <div class="hc-desc">${cat.desc}</div>
    `;
    grid.appendChild(card);
  });
}

// เลือกหมวดหมู่คำศัพท์
function selectCategory(slug) {
  activeCategory = CATEGORIES.find(c => c.slug === slug);
  categoryWords = ALL_WORDS[slug] || [];

  if (categoryWords.length === 0) return;

  // เปลี่ยนหน้าการแสดงผล
  document.getElementById('hub-view').style.display = 'none';
  document.getElementById('topic-view').style.display = 'flex';
  
  // แสดง HUD
  document.getElementById('hud').style.display = 'flex';
  document.getElementById('cat-val-hud').textContent = activeCategory.title;
  
  // รีเซ็ตค่าด่าน
  currentScore = 0;
  currentLives = CONFIG.LIVES;
  currentWordIndex = 0;
  updateHUD();

  // สลับเข้าสู่โหมดรีวิว (ทบทวน) เป็นอันดับแรก
  switchMode('auto');
}

// สลับโหมดการเล่น
function switchMode(mode) {
  currentMode = mode;
  isAnswered = false;

  // จัดการแท็บปุ่ม
  const btns = document.querySelectorAll('.mbtn');
  btns.forEach(btn => btn.classList.remove('active'));
  
  const activeBtn = document.getElementById(`m-${mode}`);
  if (activeBtn) activeBtn.classList.add('active');

  // ซ่อนแผงโหมดทั้งหมด
  document.getElementById('words-grid').style.display = 'none';
  document.getElementById('dictation-mode').style.display = 'none';
  document.getElementById('choice-mode').style.display = 'none';
  document.getElementById('match-mode').style.display = 'none';

  // พลิกการ์ดกลับมาหน้าหลัก
  const card = document.getElementById('tcard');
  card.classList.remove('flipped');

  // รีเซ็ตตัวกรองการทอยคำอ่าน
  if (mode === 'auto') {
    document.getElementById('words-grid').style.display = 'grid';
    renderWordsGrid();
    loadWord(0);
  } else if (mode === 'dictation') {
    document.getElementById('dictation-mode').style.display = 'block';
    // สุ่มเรียงคำศัพท์เพื่อฝึกฝน
    quizList = shuffle([...categoryWords]);
    currentWordIndex = 0;
    loadDictationWord();
  } else if (mode === 'choice') {
    document.getElementById('choice-mode').style.display = 'block';
    quizList = shuffle([...categoryWords]);
    currentWordIndex = 0;
    loadChoiceWord();
  } else if (mode === 'match') {
    document.getElementById('match-mode').style.display = 'flex';
    initMatchingGame();
  }
}

// ═══ MODE 1: AUTO REVIEW (ทบทวนคำศัพท์) ═══

function renderWordsGrid() {
  const grid = document.getElementById('words-grid');
  grid.innerHTML = '';

  categoryWords.forEach((item, idx) => {
    const cell = document.createElement('div');
    cell.className = `word-cell ${idx === currentWordIndex ? 'active' : ''}`;
    cell.id = `word-cell-${idx}`;
    cell.textContent = item.word;
    cell.onclick = () => loadWord(idx);
    grid.appendChild(cell);
  });
}

function loadWord(index) {
  currentWordIndex = index;
  const wordItem = categoryWords[index];

  // ไฮไลต์เซลล์
  const cells = document.querySelectorAll('.word-cell');
  cells.forEach(c => c.classList.remove('active'));
  const activeCell = document.getElementById(`word-cell-${index}`);
  if (activeCell) activeCell.classList.add('active');

  // เปลี่ยนเนื้อหาบนการ์ด
  document.getElementById('wfront-emoji').textContent = wordItem.emoji || activeCategory.icon;
  document.getElementById('wfront-word').textContent = wordItem.word;
  document.getElementById('wfront-cat').textContent = activeCategory.title;

  document.getElementById('wback-reading').textContent = `คำอ่าน: [ ${wordItem.reading} ]`;
  document.getElementById('wback-meaning').textContent = wordItem.meaning;

  // พลิกกลับหน้าหลักทุกครั้งที่เปลี่ยนคำ
  document.getElementById('tcard').classList.remove('flipped');

  // เชื่อมโยงปุ่มเสียงอ่าน
  document.getElementById('btn-say').onclick = (e) => {
    e.stopPropagation();
    speakThai(wordItem.word);
  };

  // พูดคำศัพท์โดยอัตโนมัติรอบแรก
  speakThai(wordItem.word);

  // อัปเดตหลอดความค้าวหน้า
  const pct = ((index + 1) / categoryWords.length) * 100;
  document.getElementById('bar').style.width = `${pct}%`;
}

function flipCard() {
  document.getElementById('tcard').classList.toggle('flipped');
  KAMPAI.sound.fxFlash();
}

// ═══ MODE 2: DICTATION (เขียนตามคำบอก) ═══

function loadDictationWord() {
  isAnswered = false;
  if (currentWordIndex >= quizList.length || currentLives <= 0) {
    endGame();
    return;
  }

  const wordItem = quizList[currentWordIndex];

  // ปิดกั้นเนื้อหาคำศัพท์บนหน้าการ์ดหลักเพื่อป้องกันการโกง
  document.getElementById('wfront-emoji').textContent = '❓';
  document.getElementById('wfront-word').textContent = 'ฟังเสียงและสะกดคำ';
  document.getElementById('wfront-cat').textContent = 'โหมดเขียนตามคำบอก';

  document.getElementById('wback-reading').textContent = '— ซ่อนคำอ่าน —';
  document.getElementById('wback-meaning').textContent = `คำใบ้ความหมาย: ${wordItem.meaning}`;

  document.getElementById('tcard').classList.remove('flipped');

  // ล้างอินพุตและตั้งค่าโฟกัส
  const input = document.getElementById('dictation-input');
  input.value = '';
  input.disabled = false;
  input.focus();

  // พูดออกเสียงคำศัพท์
  speakThai(wordItem.word);

  // อัปเดตความก้าวหน้า
  const pct = (currentWordIndex / quizList.length) * 100;
  document.getElementById('bar').style.width = `${pct}%`;
}

function playVoiceOnly() {
  if (currentWordIndex < quizList.length) {
    speakThai(quizList[currentWordIndex].word);
  }
}

function checkDictation() {
  if (isAnswered) return;

  const inputEl = document.getElementById('dictation-input');
  const answer = inputEl.value.trim();
  const wordItem = quizList[currentWordIndex];

  if (!answer) {
    showToast('กรุณาพิมพ์สะกดคำศัพท์ก่อนส่งคำตอบ', 'wrong');
    return;
  }

  isAnswered = true;
  inputEl.disabled = true;

  if (answer === wordItem.word) {
    currentScore += CONFIG.BASE_SCORE;
    showToast('ถูกต้องเก่งมาก! 🎉', 'correct');
    
    // พลิกการ์ดเฉลยความหมายโดยอัตโนมัติ
    document.getElementById('wfront-word').textContent = wordItem.word;
    document.getElementById('wback-reading').textContent = `คำอ่าน: [ ${wordItem.reading} ]`;
    document.getElementById('tcard').classList.add('flipped');

    setTimeout(() => {
      currentWordIndex++;
      loadDictationWord();
    }, 2800);
    
    KAMPAI.sound.correct();
  } else {
    currentLives--;
    showToast('สะกดไม่ถูกต้องนะ 😢', 'wrong');

    // เฉลยคำศัพท์ที่ถูกต้องบนหน้าการ์ด
    document.getElementById('wfront-word').textContent = `${wordItem.word}`;
    document.getElementById('wback-reading').textContent = `เขียนที่ถูก: ${wordItem.word} [ ${wordItem.reading} ]`;
    document.getElementById('tcard').classList.add('flipped');

    setTimeout(() => {
      if (currentLives <= 0) {
        endGame();
      } else {
        currentWordIndex++;
        loadDictationWord();
      }
    }, 3500);

    KAMPAI.sound.wrong();
  }

  updateHUD();
}

function handleDictationKey(e) {
  if (e.key === 'Enter') {
    checkDictation();
  }
}

// ═══ MODE 3: CHOICE QUIZ (ทายความหมาย) ═══

function loadChoiceWord() {
  isAnswered = false;
  if (currentWordIndex >= quizList.length || currentLives <= 0) {
    endGame();
    return;
  }

  const wordItem = quizList[currentWordIndex];

  // นำคำใบ้มาใส่คำถาม
  document.getElementById('choice-question-text').textContent = `คำว่า "${wordItem.word}" มีความหมายตรงกับข้อใด?`;
  
  // ซ่อนเนื้อหาการ์ดหลัก
  document.getElementById('wfront-emoji').textContent = '🎯';
  document.getElementById('wfront-word').textContent = 'เลือกความหมาย';
  document.getElementById('wfront-cat').textContent = 'โหมดตอบคำถาม';

  // พลิกการ์ดเฉลยด้านหลังชั่วคราว
  document.getElementById('wback-reading').textContent = 'คำศัพท์สะกด: ' + wordItem.word;
  document.getElementById('wback-meaning').textContent = 'ความหมายจะเฉลยหลังตอบ';
  document.getElementById('tcard').classList.remove('flipped');

  // สุ่มคำตอบลวง 3 ข้อจากคลังคำแปลอื่นในหมวดเดียวกัน
  const decoyList = categoryWords
    .filter(w => w.word !== wordItem.word)
    .map(w => w.meaning);

  const shuffledDecoys = shuffle(decoyList).slice(0, 3);
  const options = shuffle([wordItem.meaning, ...shuffledDecoys]);

  const container = document.getElementById('choice-options');
  container.innerHTML = '';

  options.forEach((opt) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.textContent = opt;
    btn.onclick = () => selectChoiceAnswer(opt, btn);
    container.appendChild(btn);
  });

  const pct = (currentWordIndex / quizList.length) * 100;
  document.getElementById('bar').style.width = `${pct}%`;
}

function selectChoiceAnswer(selectedOpt, clickedBtn) {
  if (isAnswered) return;
  isAnswered = true;

  const wordItem = quizList[currentWordIndex];
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(btn => btn.disabled = true);

  if (selectedOpt === wordItem.meaning) {
    clickedBtn.classList.add('correct');
    currentScore += CONFIG.BASE_SCORE;
    showToast('คำตอบถูกต้อง! 🎉', 'correct');
    KAMPAI.sound.correct();
  } else {
    clickedBtn.classList.add('wrong');
    // ไฮไลต์ข้อที่ถูกต้อง
    btns.forEach(btn => {
      if (btn.textContent === wordItem.meaning) btn.classList.add('correct');
    });
    currentLives--;
    showToast('ยังไม่ถูกต้องนะ 😢', 'wrong');
    KAMPAI.sound.wrong();
  }

  // เฉลยความหมายบนการ์ดด้านหลัง
  document.getElementById('wback-meaning').textContent = wordItem.meaning;
  document.getElementById('tcard').classList.add('flipped');

  setTimeout(() => {
    if (currentLives <= 0) {
      endGame();
    } else {
      currentWordIndex++;
      loadChoiceWord();
    }
  }, 2800);

  updateHUD();
}

// ═══ MODE 4: MATCHING GAME (จับคู่คำอ่าน) ═══

function initMatchingGame() {
  matchedPairsCount = 0;
  selectedMatchLeft = null;
  selectedMatchRight = null;

  // เอาคำศัพท์มา 4 คำสุ่มเพื่อสลับสร้างตารางจับคู่
  const matchWords = shuffle([...categoryWords]).slice(0, 4);

  const leftCol = document.getElementById('match-left');
  const rightCol = document.getElementById('match-right');

  leftCol.innerHTML = '';
  rightCol.innerHTML = '';

  // สุ่มลำดับสำหรับข้างซ้าย (คำเขียน) และข้างขวา (คำอ่าน)
  const leftItems = shuffle(matchWords.map(w => ({ id: w.word, text: w.word })));
  const rightItems = shuffle(matchWords.map(w => ({ id: w.word, text: w.reading })));

  leftItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.textContent = item.text;
    card.onclick = () => selectMatch(item.id, card, 'left');
    leftCol.appendChild(card);
  });

  rightItems.forEach(item => {
    const card = document.createElement('div');
    card.className = 'match-card';
    card.textContent = `[ ${item.text} ]`;
    card.onclick = () => selectMatch(item.id, card, 'right');
    rightCol.appendChild(card);
  });
}

function selectMatch(id, cardElement, side) {
  if (cardElement.classList.contains('matched') || cardElement.classList.contains('error')) {
    return;
  }

  if (side === 'left') {
    const activeLeft = document.querySelector('#match-left .match-card.active');
    if (activeLeft) activeLeft.classList.remove('active');
    
    selectedMatchLeft = { id, el: cardElement };
    cardElement.classList.add('active');
    
    // พูดออกเสียงคำศัพท์
    speakThai(id);
  } else {
    const activeRight = document.querySelector('#match-right .match-card.active');
    if (activeRight) activeRight.classList.remove('active');
    
    selectedMatchRight = { id, el: cardElement };
    cardElement.classList.add('active');
  }

  // หากเลือกจับคู่ทั้งสองข้าง
  if (selectedMatchLeft && selectedMatchRight) {
    const leftNode = selectedMatchLeft;
    const rightNode = selectedMatchRight;

    selectedMatchLeft = null;
    selectedMatchRight = null;

    if (leftNode.id === rightNode.id) {
      // จับคู่ถูกต้อง
      leftNode.el.classList.remove('active');
      rightNode.el.classList.remove('active');
      leftNode.el.classList.add('matched');
      rightNode.el.classList.add('matched');

      currentScore += CONFIG.BASE_SCORE;
      matchedPairsCount++;
      updateHUD();
      KAMPAI.sound.correct();

      // ตรวจสอบว่าผ่านครบหมดตารางหรือยัง
      if (matchedPairsCount === 4) {
        showToast('จับคู่ถูกต้องครบถ้วน! 🔗', 'correct');
        setTimeout(() => {
          // รีเซ็ตด่านถัดไป
          initMatchingGame();
        }, 1500);
      }
    } else {
      // จับคู่ผิดพลาด
      leftNode.el.classList.remove('active');
      rightNode.el.classList.remove('active');
      leftNode.el.classList.add('error');
      rightNode.el.classList.add('error');

      currentLives--;
      updateHUD();
      KAMPAI.sound.wrong();

      setTimeout(() => {
        leftNode.el.classList.remove('error');
        rightNode.el.classList.remove('error');
        
        if (currentLives <= 0) {
          endGame();
        }
      }, 800);
    }
  }
}

// ═══ WEB SPEECH TEXT-TO-SPEECH (ภาษาไทย) ═══

function speakThai(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // ยกเลิกการพูดข้อความค้างเก่า
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    utterance.rate = 0.82; // สปีดเสียงช้าพอดีกับการเรียนภาษาเด็ก ป.4
    window.speechSynthesis.speak(utterance);
  }
}

// ═══ LEADERBOARD & STATS ═══

function returnToHub() {
  // ยกเลิก BGM หรือ Synthesizer
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  document.getElementById('hub-view').style.display = 'flex';
  document.getElementById('topic-view').style.display = 'none';
  document.getElementById('hud').style.display = 'none';
  document.getElementById('gameover-screen').style.display = 'none';
}

function updateHUD() {
  const scoreVal = document.getElementById('score-val');
  if (scoreVal) scoreVal.textContent = currentScore;
  
  const scoreHud = document.getElementById('score-val-hud');
  if (scoreHud) scoreHud.textContent = currentScore;

  let hearts = '';
  for (let i = 0; i < CONFIG.LIVES; i++) {
    hearts += i < currentLives ? '❤️' : '🖤';
  }
  const lifeHud = document.getElementById('life-container');
  if (lifeHud) lifeHud.textContent = hearts;
}

// สรุปจบเกมส่งผลขึ้นบอร์ดคะแนนสะสม
function endGame() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }

  let stars = 0;
  if (currentScore >= CONFIG.STAR_THRESHOLDS[2]) stars = 3;
  else if (currentScore >= CONFIG.STAR_THRESHOLDS[1]) stars = 2;
  else if (currentScore >= CONFIG.STAR_THRESHOLDS[0]) stars = 1;

  // KAMPAI.submitScore(currentScore, { stars: stars });

  const starDisplay = document.getElementById('star-display');
  let starStr = '';
  for (let i = 1; i <= 3; i++) {
    starStr += i <= stars ? '⭐' : '☆';
  }
  starDisplay.textContent = starStr;

  const summaryEl = document.getElementById('go-summary');
  if (currentLives <= 0) {
    summaryEl.textContent = `สะกดผิดเกินกำหนดจนหัวใจหมด! พยายามฝึกฝนเพิ่มเติมนะครับ`;
    document.getElementById('go-title').textContent = 'พยายามอีกครั้ง!';
  } else {
    summaryEl.textContent = `ยอดเยี่ยม! คุณได้ทบทวนและทำกิจกรรมคำศัพท์หมวดหมู่นี้สำเร็จแล้ว`;
    document.getElementById('go-title').textContent = 'ทบทวนสำเร็จ!';
  }

  document.getElementById('final-score').textContent = currentScore;
  document.getElementById('gameover-screen').style.display = 'flex';
  document.getElementById('topic-view').style.display = 'none';
  document.getElementById('hud').style.display = 'none';

  if (stars >= 2) {
    initConfetti();
  }

  // renderLeaderboard(KAMPAI.leaderboard, 'score-list-gameover');
}

// แสดง Toast ข้อความเล็ก
function showToast(msg, status) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast show ${status}`;
  
  setTimeout(() => {
    toast.className = 'toast';
  }, 2000);
}

// ═══ HELPER & CONFETTI ═══

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

// CONFETTI
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
