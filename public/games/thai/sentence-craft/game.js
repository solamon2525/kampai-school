/* game.js — Sentence Craft (Thai) Game Logic */

const CFG = window.GAME_CONFIG;
const DATA = window.GAME_DATA;

KAMPAI.setSlug(CFG.SLUG);
if (CFG.BGM) {
  KAMPAI.sound.defaultBgm(CFG.BGM);
}

// ═══ Heuristic Part of Speech Classifier for Thai ═══
function getPosClass(word) {
  const subjects = ['ฉัน', 'แม่', 'พ่อ', 'น้อง', 'ครู', 'เรา', 'เขา', 'เธอ', 'คุณ', 'สุนัข', 'แมว', 'นักเรียน', 'คุณยาย', 'พี่สาว', 'พี่ชาย', 'นายณัฐพงศ์', 'เพื่อนๆ', 'ทุกคน', 'ฝน', 'ดอกไม้'];
  const verbs = ['ไป', 'ทำ', 'อ่าน', 'ชอบ', 'สอน', 'ช่วย', 'กิน', 'ตก', 'สวยงาม', 'เรียน', 'ทำการบ้าน', 'ส่ง', 'ทำการทดลอง', 'ปลูก', 'ฟัง', 'ร้อง', 'วิ่ง', 'เล่น', 'มี', 'ดู', 'ซื้อ', 'ให้', 'จัด', 'กวาด', 'ล้าง', 'เช็ด', 'รัก', 'ยกกระเป๋า', 'กวาดห้องเรียน', 'เชิญ', 'ขอเชิญ', 'ปิด', 'ถอด', 'ยืม', 'รักษา', 'ร่วม', 'มาร่วม'];
  const objects = ['โรงเรียน', 'อาหาร', 'หนังสือ', 'ผลไม้', 'วิชาคณิตศาสตร์', 'ห้องเรียน', 'ผัก', 'สมุด', 'กระเป๋า', 'การบ้าน', 'ข้าว', 'นม', 'เพลง', 'ของขวัญ', 'จาน', 'ดอกไม้', 'ต้นไม้', 'น้ำ', 'ฟุตบอล', 'การบ้านวิชาภาษาไทย', 'ขยะ', 'ตลาด', 'ซื้อของ', 'รองเท้า', 'ความสะอาด', 'ไฟ', 'ดินสอ', 'กิจกรรม'];
  const modifiers = ['ทุกวัน', 'อร่อยมาก', 'ให้ฉันฟัง', 'หลายชนิด', 'สนุกมาก', 'ตกหนัก', 'ตอนเย็น', 'ตอนเช้า', 'วันนี้', 'พรุ่งนี้', 'ที่บ้าน', 'อย่างดี', 'น่ารัก', 'ในห้องเรียน', 'ทุกเช้า', 'ด้วยกัน', 'เสียงดัง', 'อย่างตั้งใจ', 'เสียงเพราะ', 'อย่างสนุกสนาน', 'ในสวน', 'หลังเลิกเรียน', 'ให้เรียบร้อย', 'คะ', 'ครับ', 'ไหม', 'หรือเปล่า', 'ได้ไหม', 'ด้วย', 'ที', 'หน่อย', 'ไม่ได้', 'ไม่', 'โปรด', 'กรุณา', 'อย่า', 'เมื่อไหร่', 'ทำไม', 'อย่างไร', 'กี่โมง', 'ตัวนั้น', 'ของใคร', 'ทุกคน', 'ช่วยกัน', 'ในสวน'];

  if (subjects.includes(word)) return 'pos-subject';
  if (verbs.includes(word)) return 'pos-verb';
  if (objects.includes(word)) return 'pos-object';
  if (modifiers.includes(word)) return 'pos-modifier';
  return 'pos-other';
}

// ═══ State Variables ═══
let currentMode = null; // 'timed' or 'practice'
let selectedCatId = null;
let currentSentences = [];
let sentenceIndex = 0;
let score = 0;
let combo = 1;
let comboStreak = 0;
let isOver = false;

let placedWords = []; // array of { text, posClass, bankIndex }
let currentSentenceObj = null;
let sentenceStartTime = 0;
let timerVal = CFG.TIME_SECONDS;
let timerInterval = null;

// Confetti Setup
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
let confettiParticles = [];

// ═══ UI Helpers & Leaderboard ═══
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
    el.innerHTML = '<li class="lb-loading">ยังไม่มีผู้เล่น — เป็นคนแรกสิ!</li>';
    return;
  }
  const medals = ['🥇','🥈','🥉'];
  el.innerHTML = rows.slice(0, 5).map((r) => {
    const av = r.photoUrl ? `<img class="lb-avatar" src="${r.photoUrl}" alt="">` : `<div class="lb-avatar-init">${(r.displayName||'?')[0]}</div>`;
    return `<li class="${r.isMe ? 'is-me' : ''}">
      <span class="lb-rank">${medals[r.rank-1] || r.rank}</span>${av}
      <div class="lb-info"><div class="lb-name">${r.displayName}${r.isMe ? ' (คุณ)' : ''}</div>
      <div class="lb-sub">${(r.personalBest||0).toLocaleString()} คะแนน · ${r.classLabel||''}</div></div>
    </li>`;
  }).join('');
}

// Render category chips
function renderCategories() {
  const container = document.getElementById('cat-row');
  if (!container) return;

  container.innerHTML = DATA.CATEGORIES.map((cat, idx) => {
    const isSel = idx === 0 ? 'sel' : '';
    if (idx === 0) selectedCatId = cat.id;
    return `<button class="cat-chip ${isSel}" id="cat-btn-${cat.id}" onclick="selectCategory('${cat.id}')">
      <span>${cat.emoji}</span> ${cat.label}
    </button>`;
  }).join('');
}

function selectCategory(catId) {
  selectedCatId = catId;
  DATA.CATEGORIES.forEach(cat => {
    const el = document.getElementById(`cat-btn-${cat.id}`);
    if (el) {
      if (cat.id === catId) el.classList.add('sel');
      else el.classList.remove('sel');
    }
  });
}

// ═══ Confetti Engine ═══
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function spawnConfetti(x, y) {
  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#eab308', '#a855f7', '#ff7849'];
  for (let i = 0; i < 50; i++) {
    confettiParticles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12 - 4,
      radius: Math.random() * 4 + 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 1,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 8
    });
  }
}

function updateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = confettiParticles.length - 1; i >= 0; i--) {
    const p = confettiParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.35;
    p.alpha -= 0.015;
    p.rotation += p.rotationSpeed;

    if (p.alpha <= 0) {
      confettiParticles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation * Math.PI / 180);
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.radius, -p.radius, p.radius * 2, p.radius * 2);
    ctx.restore();
  }
}

function drawLoop() {
  if (isOver) return;
  updateConfetti();
  requestAnimationFrame(drawLoop);
}

// ═══ Game Lifecycle ═══
function startGame(mode) {
  currentMode = mode;
  score = 0;
  combo = 1;
  comboStreak = 0;
  sentenceIndex = 0;
  isOver = false;

  // Resolve sentences for selected category
  const cat = DATA.CATEGORIES.find(c => c.id === selectedCatId);
  const rawSentences = cat ? cat.sentences : DATA.CATEGORIES[0].sentences;
  
  // Shuffle and pick 8 sentences
  currentSentences = [...rawSentences].sort(() => Math.random() - 0.5).slice(0, CFG.SENTENCES_PER_ROUND);

  document.getElementById('blocker').style.display = 'none';
  document.getElementById('hud').style.display = 'flex';
  document.getElementById('score-value').innerText = score;

  // Timer Setup
  const timerContainer = document.getElementById('timer-container');
  if (mode === 'timed') {
    timerVal = CFG.TIME_SECONDS;
    document.getElementById('timer-value').innerText = timerVal;
    timerContainer.style.display = 'block';
    timerContainer.classList.remove('low');
    
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      timerVal--;
      document.getElementById('timer-value').innerText = timerVal;
      
      if (timerVal <= 15) {
        timerContainer.classList.add('low');
      }
      
      if (timerVal <= 0) {
        endGame();
      }
    }, 1000);
  } else {
    timerContainer.style.display = 'none';
  }

  // Cost for hint display
  document.getElementById('hint-cost').innerText = `(-${CFG.HINT_PENALTY} คะแนน)`;

  KAMPAI.sound.bgmStart();
  loadSentence(0);
  drawLoop();
}

function loadSentence(index) {
  if (index >= currentSentences.length) {
    endGame();
    return;
  }

  sentenceIndex = index;
  currentSentenceObj = currentSentences[index];
  sentenceStartTime = Date.now();

  // Reset slots and placements
  placedWords = Array(currentSentenceObj.words.length).fill(null);

  // HUD progress
  document.getElementById('progress-text').innerText = `${index + 1} / ${currentSentences.length}`;
  document.getElementById('progress-bar').style.width = `${(index / currentSentences.length) * 100}%`;

  const zone = document.getElementById('sentence-zone');
  zone.className = '';

  // Render Slots
  const slotsContainer = document.getElementById('sentence-slots');
  slotsContainer.innerHTML = currentSentenceObj.words.map((_, i) => 
    `<div class="word-slot" id="slot-${i}" data-index="${i}"></div>`
  ).join('');

  // Render Word Bank
  // Shuffle words for bank display
  const bankWords = currentSentenceObj.words.map((w, idx) => ({ text: w, originalIndex: idx }));
  bankWords.sort(() => Math.random() - 0.5);

  const bankContainer = document.getElementById('word-bank');
  bankContainer.innerHTML = bankWords.map((item, idx) => {
    const posClass = getPosClass(item.text);
    return `<div class="word-card ${posClass}" id="bank-card-${idx}" 
                 onclick="clickBankCard('${item.text.replace(/'/g, "\\'")}', ${idx}, '${posClass}')">
      ${item.text}
    </div>`;
  }).join('');
}

function clickBankCard(text, bankIndex, posClass) {
  if (isOver) return;

  const card = document.getElementById(`bank-card-${bankIndex}`);
  if (card.classList.contains('placed')) return; // already placed

  // Find first empty slot
  const emptySlotIdx = placedWords.indexOf(null);
  if (emptySlotIdx === -1) return; // all slots filled

  // Place word in slot
  placedWords[emptySlotIdx] = { text, posClass, bankIndex };
  card.classList.add('placed');
  
  // Render word in slot DOM
  const slot = document.getElementById(`slot-${emptySlotIdx}`);
  slot.innerHTML = `<div class="word-card ${posClass}" onclick="removeSlotCard(${emptySlotIdx})">${text}</div>`;

  checkSentenceComplete();
}

function removeSlotCard(slotIdx) {
  if (isOver) return;

  const placed = placedWords[slotIdx];
  if (!placed) return;

  // Free bank card
  const card = document.getElementById(`bank-card-${placed.bankIndex}`);
  if (card) card.classList.remove('placed');

  // Clear slot DOM and data
  placedWords[slotIdx] = null;
  document.getElementById(`slot-${slotIdx}`).innerHTML = '';

  // Clear wrong border styling if it was shaken
  document.getElementById('sentence-zone').classList.remove('wrong-shake');
}

function checkSentenceComplete() {
  // Check if all slots are filled
  if (placedWords.includes(null)) return;

  // Thai sentences don't have spaces, so we join empty
  const builtSentence = placedWords.map(w => w.text).join('');
  const correct = currentSentenceObj.correct;

  const zone = document.getElementById('sentence-zone');

  if (builtSentence === correct) {
    // CORRECT!
    zone.classList.add('correct-glow');
    
    // Play TTS in Thai
    KAMPAI.sound.speak(correct, 'th-TH');
    
    // Confetti
    const rect = zone.getBoundingClientRect();
    spawnConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
    KAMPAI.sound.correct();

    // Score Calculation
    const duration = (Date.now() - sentenceStartTime) / 1000;
    const speedBonus = Math.max(0, Math.min(CFG.SPEED_BONUS_MAX, Math.round(CFG.SPEED_BONUS_MAX - duration)));
    
    // Combo
    comboStreak++;
    if (comboStreak >= CFG.COMBO_STEP) {
      combo = Math.min(combo + 1, CFG.COMBO_MAX);
      showComboBadge();
    }

    const earned = CFG.BASE_SCORE + speedBonus + (combo * 5);
    score += earned;
    document.getElementById('score-value').innerText = score;
    const scoreContainer = document.getElementById('score-container');
    scoreContainer.classList.add('pop');
    setTimeout(() => scoreContainer.classList.remove('pop'), 150);

    // Lock slots
    const slotDoms = document.querySelectorAll('#sentence-slots .word-card');
    slotDoms.forEach(d => d.removeAttribute('onclick'));

    // Move to next after a delay
    setTimeout(() => {
      loadSentence(sentenceIndex + 1);
    }, 2500);
  } else {
    // WRONG
    zone.classList.add('wrong-shake');
    KAMPAI.sound.wrong();
    
    // Reset combo
    combo = 1;
    comboStreak = 0;
    hideComboBadge();
    
    setTimeout(() => {
      zone.classList.remove('wrong-shake');
    }, 500);
  }
}

function useHint() {
  if (isOver || !currentSentenceObj) return;

  // Hint costs points
  score = Math.max(0, score - CFG.HINT_PENALTY);
  document.getElementById('score-value').innerText = score;

  // Find first incorrect or empty slot
  const correctWords = currentSentenceObj.words;
  let firstWrongIdx = -1;

  for (let i = 0; i < correctWords.length; i++) {
    if (!placedWords[i] || placedWords[i].text !== correctWords[i]) {
      firstWrongIdx = i;
      break;
    }
  }

  if (firstWrongIdx === -1) return; // already correct

  // Clear subsequent slots if they were filled to avoid conflicts
  for (let i = firstWrongIdx; i < correctWords.length; i++) {
    if (placedWords[i]) {
      removeSlotCard(i);
    }
  }

  // Find target card in the bank
  const targetText = correctWords[firstWrongIdx];
  const bankCards = document.querySelectorAll('#word-bank .word-card');
  let targetBankIdx = -1;
  
  for (let i = 0; i < bankCards.length; i++) {
    const cardEl = bankCards[i];
    if (cardEl.innerText.trim() === targetText && !cardEl.classList.contains('placed')) {
      targetBankIdx = parseInt(cardEl.id.split('-').pop());
      break;
    }
  }

  if (targetBankIdx !== -1) {
    clickBankCard(targetText, targetBankIdx, getPosClass(targetText));
  }
}

function showComboBadge() {
  const badge = document.getElementById('combo-badge');
  badge.innerText = `คอมโบ x${combo}! 🔥`;
  badge.classList.add('show');
}

function hideComboBadge() {
  document.getElementById('combo-badge').classList.remove('show');
}

function endGame() {
  if (isOver) return;
  isOver = true;

  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  try {
    window.speechSynthesis && window.speechSynthesis.cancel();
  } catch(e){}

  KAMPAI.sound.gameOver();
  KAMPAI.sound.bgmStop();

  // Submit to SDK
  const subCat = DATA.CATEGORIES.find(c => c.id === selectedCatId);
  const metadata = { mode: currentMode, category: subCat ? subCat.label : 'General' };
  KAMPAI.submitScore(score, metadata);

  // Calculate Stars
  let stars = 0;
  if (score >= CFG.STAR_THRESHOLDS[2]) stars = 3;
  else if (score >= CFG.STAR_THRESHOLDS[1]) stars = 2;
  else if (score >= CFG.STAR_THRESHOLDS[0]) stars = 1;

  const starDiv = document.getElementById('star-display');
  let starStr = '';
  for (let i = 1; i <= 3; i++) {
    if (i <= stars) starStr += '⭐';
    else starStr += '☆';
  }
  starDiv.innerText = starStr;

  document.getElementById('final-score').innerText = score;
  document.getElementById('go-summary').innerText = `โหมด: ${currentMode === 'timed' ? 'แข่งเวลา' : 'ฝึกซ้อม'} · หมวด: ${subCat ? subCat.label : 'General'}`;

  document.getElementById('hud').style.display = 'none';
  document.getElementById('gameover-screen').style.display = 'flex';

  renderLeaderboard('score-list-gameover');
}

// Initial category render
renderCategories();
