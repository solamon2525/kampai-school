/* game.js — ลอจิกหลักของเกม "Thai Instruments" ร่วมกับ Web Audio API Synthesizer */

let currentScore = 0;
let currentLives = 3;
let currentTab = 'explore';
let selectedInstrumentIndex = 0;
let currentCategoryFilter = 'ทั้งหมด';
let currentQuestionIndex = 0;
let quizList = [];
let audioCtx = null;

const CONFIG = window.GAME_CONFIG;
KAMPAI.setSlug(CONFIG.SLUG);
const INSTRUMENTS = window.GAME_DATA.instruments;
const ALL_QUIZZES = window.GAME_DATA.quizzes;

// โน้ตดนตรีและความถี่ (Hz)
const NOTE_FREQS = {
  'C4': 261.63, // โด
  'D4': 293.66, // เร
  'E4': 329.63, // มี
  'F4': 349.23, // ฟา
  'G4': 392.00, // ซอล
  'A4': 440.00, // ลา
  'B4': 493.88, // ที
  'C5': 523.25  // โด๊
};

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
  document.getElementById('main-area').style.display = 'flex';

  renderInstruments();
  selectInstrument(0);
}

// สลับแท็บ
function switchTab(tab) {
  currentTab = tab;
  
  document.getElementById('tab-explore').classList.toggle('active', tab === 'explore');
  document.getElementById('tab-quiz').classList.toggle('active', tab === 'quiz');
  
  document.getElementById('explore-view').style.display = tab === 'explore' ? 'block' : 'none';
  document.getElementById('quiz-view').style.display = tab === 'quiz' ? 'block' : 'none';

  const modeText = document.getElementById('mode-text');
  
  if (tab === 'quiz') {
    modeText.textContent = 'โหมดทายเสียง';
    initQuiz();
  } else {
    modeText.textContent = 'ทำความรู้จัก';
    clearQuizFeedback();
  }
}

// ═══ EXPLORE TAB LOGIC ═══

// ตัวเลือกฟิลเตอร์หมวดหมู่
function filterCategory(category, clickedBtn) {
  currentCategoryFilter = category;
  
  const btns = document.querySelectorAll('.filter-btn');
  btns.forEach(btn => btn.classList.remove('active'));
  clickedBtn.classList.add('active');

  renderInstruments();
}

// แสดงรายการเครื่องดนตรีตามหมวดหมู่
function renderInstruments() {
  const grid = document.getElementById('instruments-grid');
  grid.innerHTML = '';

  INSTRUMENTS.forEach((inst, idx) => {
    if (currentCategoryFilter !== 'ทั้งหมด' && inst.category !== currentCategoryFilter) {
      return;
    }

    const card = document.createElement('div');
    card.className = `inst-card ${idx === selectedInstrumentIndex ? 'active' : ''}`;
    card.id = `inst-card-${idx}`;
    card.onclick = () => selectInstrument(idx);

    card.innerHTML = `
      <div class="card-emoji">${inst.emoji}</div>
      <div class="card-title">${inst.nameTh}</div>
      <div class="card-tag">${inst.category}</div>
    `;

    grid.appendChild(card);
  });
}

// เลือกเครื่องดนตรี
function selectInstrument(index) {
  selectedInstrumentIndex = index;
  
  // ไฮไลต์การ์ดที่เลือก
  const cards = document.querySelectorAll('.inst-card');
  cards.forEach(card => card.classList.remove('active'));
  
  const activeCard = document.getElementById(`inst-card-${index}`);
  if (activeCard) {
    activeCard.classList.add('active');
  }

  const inst = INSTRUMENTS[index];
  document.getElementById('inst-emoji').textContent = inst.emoji;
  document.getElementById('inst-title').textContent = `${inst.nameTh} (${inst.nameEn})`;
  document.getElementById('inst-cat').textContent = inst.category;
  document.getElementById('inst-desc').textContent = inst.descTh;
}

// ═══ WEB AUDIO SYNTHESIZER ═══

// สร้างหรือดึง AudioContext
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// เล่นเสียงโน้ตดนตรีไทยสังเคราะห์
function playNote(noteName, overrideSettings = null) {
  const freq = NOTE_FREQS[noteName];
  if (!freq) return;

  const inst = overrideSettings || INSTRUMENTS[selectedInstrumentIndex];
  const settings = inst.synth;

  const actx = getAudioContext();
  const osc = actx.createOscillator();
  const gainNode = actx.createGain();
  const filter = actx.createBiquadFilter();

  osc.type = settings.type;
  
  // คำนวณความถี่เสียงตามคีย์โน้ต
  let finalFreq = freq * (settings.frequencyMultiplier || 1.0);
  osc.frequency.setValueAtTime(finalFreq, actx.currentTime);

  // พิชตก (Pitch Decay) เช่น เสียงกลองยาว
  if (settings.pitchDecay) {
    osc.frequency.exponentialRampToValueAtTime(finalFreq / 3, actx.currentTime + (settings.decay || 0.2));
  }

  // เสียงลูกคอ (Vibrato) เช่น ซออู้ ซอด้วง ขลุ่ย
  if (settings.vibrato) {
    const lfo = actx.createOscillator();
    const lfoGain = actx.createGain();
    lfo.frequency.value = 6.0; // 6Hz
    lfoGain.gain.value = finalFreq * 0.02; // depth
    
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);
    lfo.start();
    lfo.stop(actx.currentTime + 1.5);
  }

  // ฟิลเตอร์ตัดเสียงแหลม
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(settings.filterCutoff || 2000, actx.currentTime);

  // ADSR Envelope
  const now = actx.currentTime;
  const a = settings.attack || 0.01;
  const d = settings.decay || 0.15;
  const s = settings.sustain !== undefined ? settings.sustain : 0.5;
  const r = settings.release || 0.15;

  gainNode.gain.setValueAtTime(0, now);
  gainNode.gain.linearRampToValueAtTime(0.7, now + a);
  gainNode.gain.exponentialRampToValueAtTime(Math.max(0.001, s * 0.7), now + a + d);

  // จำลองลมเป่าของขลุ่ย (White Noise)
  if (settings.noiseAmount) {
    const bufferSize = actx.sampleRate * 1.5;
    const noiseBuffer = actx.createBuffer(1, bufferSize, actx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const whiteNoise = actx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = actx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = finalFreq;
    noiseFilter.Q.value = 8;

    const noiseGain = actx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(settings.noiseAmount * 0.1, now + a);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + a + d + 0.3);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(filter);

    whiteNoise.start(now);
    whiteNoise.stop(now + a + d + 0.3);
  }

  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(actx.destination);

  osc.start(now);

  // ระยะเวลาบรรเลงเสียงอ้างอิงจาก sustain
  const playDuration = s === 0 ? (a + d) : 0.7;
  const stopTime = now + playDuration;

  gainNode.gain.setValueAtTime(gainNode.gain.value, stopTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, stopTime + r);
  osc.stop(stopTime + r);

  // แสดงแอนิเมชันปุ่มคีย์ดนตรีกดค้างช่วงสั้น
  highlightKeyElement(noteName);
}

// อนิเมชันปุ่มกดเสียงจำลอง
function highlightKeyElement(noteName) {
  const keys = document.querySelectorAll('.music-key');
  keys.forEach(key => {
    const label = key.querySelector('.note-name').textContent;
    if (label === noteName) {
      key.classList.add('active');
      setTimeout(() => key.classList.remove('active'), 120);
    }
  });
}

// ═══ QUIZ TAB LOGIC ═══

function initQuiz() {
  currentScore = 0;
  currentLives = CONFIG.LIVES;
  currentQuestionIndex = 0;

  // สุ่มคำถาม 10 ข้อ
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

  // ตรวจสอบชนิดคำถามว่ามีให้ฟังเสียงหรือไม่
  const soundArea = document.getElementById('sound-player-area');
  if (qData.type === 'sound') {
    soundArea.style.display = 'flex';
    // เล่นอัตโนมัติรอบแรกแบบดีเลย์สั้น
    setTimeout(() => playQuizSound(), 500);
  } else {
    soundArea.style.display = 'none';
  }

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

// เล่นโน้ตดนตรีไทย 3 ตัวต่อเนื่อง (Melody) สำหรับเป็นโจทย์ทายเสียง
function playQuizSound() {
  const qData = quizList[currentQuestionIndex];
  if (qData.type !== 'sound') return;

  const inst = INSTRUMENTS.find(i => i.id === qData.instrumentId);
  if (!inst) return;

  // โน้ตเพลงสามเกลอ โด -> ซอล -> โด๊
  const melody = ['C4', 'G4', 'C5'];
  melody.forEach((note, idx) => {
    setTimeout(() => {
      // ตรวจสอบว่าผู้เล่นยังอยู่ข้อเดิมและแท็บเดิมอยู่หรือไม่ก่อนส่งเสียง
      if (currentTab === 'quiz' && quizList[currentQuestionIndex] === qData) {
        playNote(note, inst);
      }
    }, idx * 320); // เว้นช่วง 320ms ต่อโน้ต
  });
}

function checkAnswer(selectedIdx, clickedBtn) {
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
    btns[correctIdx].classList.add('correct');
    currentLives--;
    fbTitle.textContent = 'ตอบผิด 😢';
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
    summaryEl.textContent = `หมดโควตาพลังชีวิตเสียก่อน! คุณทำคะแนนตอบคำถามได้ ${currentScore} คะแนน`;
    document.getElementById('go-title').textContent = 'เกมโอเวอร์!';
  } else {
    summaryEl.textContent = `เยี่ยมมาก! คุณฝ่าฟันแบบทดสอบครบทุกข้อ ทำได้สำเร็จ ${currentScore} คะแนน`;
    document.getElementById('go-title').textContent = 'สำเร็จลุล่วง!';
  }

  document.getElementById('final-score').textContent = currentScore;
  document.getElementById('gameover-screen').style.display = 'flex';
  document.getElementById('main-area').style.display = 'none';
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
