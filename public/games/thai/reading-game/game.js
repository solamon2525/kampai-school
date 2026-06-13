// --- ลอจิกเกม ผจญภัยอ่านสนุก (Game Logic) ---

const config = window.GAME_CONFIG;
const LEVEL_CONFIG = config.LEVEL_CONFIG;
const VOCAB = window.GAME_DATA.vocab;

const CORRECT_MSG = ['เยี่ยมเลย! 🎉', 'เก่งมาก! 💪', 'ถูกต้อง! ✨', 'สุดยอด! 🌟', 'เจ๋งมาก! 🏆'];
const WRONG_MSG = ['ลองใหม่อีกครั้ง 💪', 'ใกล้แล้วนะ 😊', 'อ่านดูอีกทีนะ 📖', 'ไม่เป็นไร ลองอีกที 🤗'];

// ====== AUDIO SYSTEM ======
const AudioFX = {
  ctx: null,
  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  },
  play(type) {
    if (localStorage.getItem('mr_sfx') === '0') return;
    try {
      this.init();
      const ctx = this.ctx;
      if (!ctx) return;
      
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523, now);
        osc.frequency.setValueAtTime(659, now + 0.1);
        osc.frequency.setValueAtTime(784, now + 0.2);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        osc.start(now); osc.stop(now + 0.5);
      } else if (type === 'wrong') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(200, now);
        osc.frequency.setValueAtTime(150, now + 0.15);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc.start(now); osc.stop(now + 0.35);
      } else if (type === 'star') {
        osc.type = 'sine';
        [523, 659, 784, 1047].forEach((f, i) => {
          osc.frequency.setValueAtTime(f, now + i * 0.12);
        });
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now); osc.stop(now + 0.7);
      } else if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, now);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now); osc.stop(now + 0.1);
      }
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }
};

// ====== GAME STATE ======
let state = {
  levelStars: [0, 0, 0, 0, 0],
  currentLevel: 0,
  currentRound: 0,
  score: 0,
  roundScore: 0,
  totalLevelScore: 0,
  timer: null,
  timeLeft: 0,
  attempts: 0,
  puzzleState: {},
  usedIndices: { sentences: [], pronunciation: [], wordMystery: [], reading: [] },
};

// ====== LOCAL STORAGE ======
function loadData() {
  const saved = localStorage.getItem('reading_game_stars');
  if (saved) {
    try {
      state.levelStars = JSON.parse(saved);
    } catch (e) {
      state.levelStars = [0, 0, 0, 0, 0];
    }
  }
}

function saveData() {
  localStorage.setItem('reading_game_stars', JSON.stringify(state.levelStars));
}

// ====== HELPERS ======
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickUnique(arr, usedKey) {
  const used = state.usedIndices[usedKey] || [];
  const available = arr.map((_, i) => i).filter(i => !used.includes(i));
  if (available.length === 0) {
    state.usedIndices[usedKey] = [];
    return Math.floor(Math.random() * arr.length);
  }
  const idx = pick(available);
  state.usedIndices[usedKey].push(idx);
  return idx;
}

function spawnConfetti() {
  if (window.confetti) {
    window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  } else {
    // Fallback: Custom DOM confetti elements
    const colors = ['#FF6B9D', '#FFC75F', '#845EC2', '#2ECC71', '#4FC3F7', '#FF8A5C'];
    for (let i = 0; i < 30; i++) {
      const el = document.createElement('div');
      el.className = 'confetti-piece';
      el.style.left = Math.random() * 100 + 'vw';
      el.style.top = (60 + Math.random() * 30) + 'vh';
      el.style.background = pick(colors);
      el.style.animationDuration = (0.8 + Math.random() * 0.6) + 's';
      el.style.animationDelay = Math.random() * 0.3 + 's';
      el.style.width = (6 + Math.random() * 8) + 'px';
      el.style.height = (6 + Math.random() * 8) + 'px';
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 2000);
    }
  }
}

// ====== SCREEN MANAGEMENT ======
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

function showMenu() {
  clearTimer();
  renderLevels();
  showScreen('menuScreen');
}

function showInstructions() {
  showScreen('instructionsScreen');
}

function renderLevels() {
  const grid = document.getElementById('levelsGrid');
  const totalStars = state.levelStars.reduce((a, b) => a + b, 0);
  document.getElementById('totalStars').textContent = totalStars;
  
  grid.innerHTML = LEVEL_CONFIG.map((lv, i) => {
    const stars = state.levelStars[i];
    const unlocked = i === 0 || state.levelStars[i - 1] >= 2;
    const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    return `
      <div class="level-card ${unlocked ? '' : 'locked'} ${unlocked && stars === 0 ? 'current' : ''}" 
           onclick="${unlocked ? `startLevel(${i})` : ''}">
        <div class="level-colors" style="background:linear-gradient(90deg, ${lv.color}, ${lv.color}88)"></div>
        <div class="level-num">${lv.emoji}</div>
        <div style="font-size:1.1rem;font-weight:700;">ด่าน ${i + 1}</div>
        <div class="level-name">${lv.name}</div>
        <div class="level-stars">${starStr}</div>
      </div>
    `;
  }).join('');
}

// ====== TIMER ======
function startTimer(seconds) {
  state.timeLeft = seconds;
  document.getElementById('timerInfo').textContent = seconds;
  document.getElementById('timerBadge').style.display = 'flex';
  document.getElementById('timerBadge').style.color = 'var(--text)';
  clearTimer();
  state.timer = setInterval(() => {
    state.timeLeft--;
    document.getElementById('timerInfo').textContent = state.timeLeft;
    if (state.timeLeft <= 10) {
      document.getElementById('timerBadge').style.color = 'var(--red)';
    }
    if (state.timeLeft <= 0) {
      clearTimer();
      onTimeUp();
    }
  }, 1000);
}

function clearTimer() {
  if (state.timer) {
    clearInterval(state.timer);
    state.timer = null;
  }
}

function onTimeUp() {
  state.roundScore = Math.max(0, state.roundScore - 20);
  showRoundResult();
}

// ====== LEVEL & ROUND MANAGEMENT ======
function startLevel(lvl) {
  state.currentLevel = lvl;
  state.currentRound = 0;
  state.totalLevelScore = 0;
  state.score = 0;
  showScreen('gameScreen');
  startRound();
}

function exitLevel() {
  clearTimer();
  showMenu();
}

function startRound() {
  clearTimer();
  state.attempts = 0;
  state.roundScore = 100;
  state.puzzleState = {};
  
  const config = LEVEL_CONFIG[state.currentLevel];
  const roundNum = state.currentRound;
  const totalRounds = config.rounds;
  const puzzleType = config.types[roundNum];
  
  document.getElementById('roundInfo').textContent = `${roundNum + 1}/${totalRounds}`;
  document.getElementById('scoreInfo').textContent = state.totalLevelScore;
  document.getElementById('progressFill').style.width = ((roundNum / totalRounds) * 100) + '%';
  document.getElementById('actionButtons').innerHTML = '';
  
  switch(puzzleType) {
    case 1: renderVowelMatching(); break;
    case 2: renderSentenceBuilding(); break;
    case 3: renderPronunciation(); break;
    case 4: renderWordMystery(); break;
    case 5: renderSpeedReading(); break;
  }
}

function nextRound() {
  hideFeedback();
  state.currentRound++;
  const config = LEVEL_CONFIG[state.currentLevel];
  if (state.currentRound >= config.rounds) {
    showLevelComplete();
  } else {
    startRound();
  }
}

function showRoundResult() {
  clearTimer();
  const score = Math.max(0, state.roundScore);
  state.totalLevelScore += score;
  document.getElementById('scoreInfo').textContent = state.totalLevelScore;
  
  if (score >= 60) {
    AudioFX.play('correct');
    showFeedback('correct', pick(CORRECT_MSG), `+${score} คะแนน`, () => nextRound());
  } else {
    showFeedback('partial', 'ไม่เป็นไร!', `+${score} คะแนน`, () => nextRound());
  }
}

function showLevelComplete() {
  const config = LEVEL_CONFIG[state.currentLevel];
  const maxScore = config.rounds * 100;
  const pct = state.totalLevelScore / maxScore;
  let stars = 0;
  if (pct >= 0.9) stars = 3;
  else if (pct >= 0.6) stars = 2;
  else if (pct >= 0.3) stars = 1;
  
  state.levelStars[state.currentLevel] = Math.max(state.levelStars[state.currentLevel], stars);
  saveData();
  
  AudioFX.play('star');
  spawnConfetti();
  
  const starHTML = [0, 1, 2].map((i) =>
    `<span class="${i < stars ? 'star-earned' : 'star-empty'}" style="animation-delay:${i * 0.2}s">⭐</span>`
  ).join('');
  
  // Submit Score to KAMPAI SDK
  if (window.parent && window.parent.window.KAMPAI) {
    window.parent.window.KAMPAI.submitScore(state.totalLevelScore, {
      mode: 'normal',
      allowResubmit: true,
      level_reached: state.currentLevel + 1,
      is_success: stars >= 2
    });
  } else if (window.KAMPAI) {
    window.KAMPAI.submitScore(state.totalLevelScore, {
      mode: 'normal',
      allowResubmit: true,
      level_reached: state.currentLevel + 1,
      is_success: stars >= 2
    });
  }
  
  const overlay = document.getElementById('feedbackOverlay');
  const card = document.getElementById('feedbackCard');
  card.innerHTML = `
    <div class="feedback-emoji">🏆</div>
    <div class="level-complete-title">จบด่าน ${state.currentLevel + 1}!</div>
    <div class="feedback-sub">${config.name}</div>
    <div class="stars-display">${starHTML}</div>
    <div style="font-size:1.1rem;margin-bottom:20px;">คะแนนรวม: <strong>${state.totalLevelScore}</strong> / ${maxScore}</div>
    <div class="btn-group">
      <button class="btn btn-secondary" onclick="hideFeedback();showMenu();">🏠 กลับหน้าหลัก</button>
      <button class="btn btn-primary" onclick="hideFeedback();startLevel(${state.currentLevel});">🔄 เล่นใหม่</button>
    </div>
  `;
  overlay.classList.add('show');
}

// ====== FEEDBACK ======
function showFeedback(type, msg, sub, callback) {
  const overlay = document.getElementById('feedbackOverlay');
  const card = document.getElementById('feedbackCard');
  const emoji = type === 'correct' ? '🎉' : type === 'wrong' ? '😅' : '💪';
  card.innerHTML = `
    <div class="feedback-emoji">${emoji}</div>
    <div class="feedback-text">${msg}</div>
    <div class="feedback-sub">${sub}</div>
    <button class="btn btn-primary" id="feedbackBtn">ต่อไป →</button>
  `;
  overlay.classList.add('show');
  document.getElementById('feedbackBtn').onclick = () => { hideFeedback(); if(callback) callback(); };
}

function hideFeedback() {
  document.getElementById('feedbackOverlay').classList.remove('show');
}

function showQuickFeedback(element, isCorrect) {
  if (isCorrect) {
    AudioFX.play('correct');
  } else {
    AudioFX.play('wrong');
  }
}

// ====== PUZZLE TYPE 1: VOWEL MATCHING ======
function renderVowelMatching() {
  const area = document.getElementById('puzzleArea');
  const keys = Object.keys(VOCAB.vowelGroups);
  const targetKey = pick(keys);
  const targetWords = VOCAB.vowelGroups[targetKey];
  
  const correctWords = shuffle(targetWords).slice(0, 4);
  const otherKeys = keys.filter(k => k !== targetKey);
  let wrongWords = [];
  otherKeys.forEach(k => { wrongWords = wrongWords.concat(VOCAB.vowelGroups[k]); });
  wrongWords = shuffle(wrongWords).slice(0, 4);
  
  const allWords = shuffle([...correctWords, ...wrongWords]);
  state.puzzleState = { correct: correctWords, selected: [], found: 0, total: 4 };
  
  area.innerHTML = `
    <div class="puzzle-title">🧩 จับคู่คำพ้องสระ</div>
    <div class="puzzle-instruction">เลือกคำที่มีเสียงสระเหมือนกัน: <strong>${targetKey}</strong></div>
    <div class="vowel-target">${targetKey}</div>
    <div class="word-grid" id="wordGrid">
      ${allWords.map((w, i) => `<div class="word-chip" data-word="${w}" onclick="selectVowelWord(this,'${w}')">${w}</div>`).join('')}
    </div>
    <div id="hintArea"></div>
  `;
  
  document.getElementById('actionButtons').innerHTML = `
    <button class="btn btn-hint" onclick="vowelHint()">💡 คำใบ้ (-10 คะแนน)</button>
  `;
  
  startTimer(60);
}

function selectVowelWord(el, word) {
  AudioFX.play('click');
  const ps = state.puzzleState;
  const isCorrect = ps.correct.includes(word);
  
  if (isCorrect) {
    el.classList.add('correct', 'disabled');
    ps.found++;
    
    // Speak word via TTS
    if (window.parent && window.parent.window.KAMPAI && window.parent.window.KAMPAI.sound) {
      window.parent.window.KAMPAI.sound.speak(word, 'th-TH', true);
    } else if (window.KAMPAI && window.KAMPAI.sound) {
      window.KAMPAI.sound.speak(word, 'th-TH', true);
    }

    state.roundScore = Math.max(0, state.roundScore);
    if (ps.found >= ps.total) {
      clearTimer();
      const timeBonus = Math.floor(state.timeLeft * 0.5);
      state.roundScore = Math.min(100, state.roundScore + timeBonus);
      setTimeout(() => showRoundResult(), 500);
    }
  } else {
    el.classList.add('wrong');
    state.attempts++;
    state.roundScore -= 15;
    showQuickFeedback(el, false);
    setTimeout(() => { el.classList.remove('wrong'); }, 500);
    if (state.attempts >= 3) {
      document.getElementById('hintArea').innerHTML = `<div class="answer-reveal">คำตอบ: ${ps.correct.join(', ')}</div>`;
    }
  }
}

function vowelHint() {
  const ps = state.puzzleState;
  state.roundScore -= 10;
  const remaining = ps.correct.filter(w => {
    const chips = document.querySelectorAll('.word-chip');
    for (const c of chips) { if (c.dataset.word === w && !c.classList.contains('correct')) return true; }
    return false;
  });
  if (remaining.length > 0) {
    document.getElementById('hintArea').innerHTML = `<div class="hint-text">💡 ลองดูคำว่า "${remaining[0].charAt(0)}..." </div>`;
  }
}

// ====== PUZZLE TYPE 2: SENTENCE BUILDING ======
function renderSentenceBuilding() {
  const area = document.getElementById('puzzleArea');
  const idx = pickUnique(VOCAB.sentences, 'sentences');
  const data = VOCAB.sentences[idx];
  const scrambled = shuffle(data.words);
  
  state.puzzleState = { words: data.words, correct: data.correct, placed: [], scrambled };
  
  area.innerHTML = `
    <div class="puzzle-title">📝 เรียงประโยค</div>
    <div class="puzzle-instruction">กดคำตามลำดับที่ถูกต้องเพื่อเรียงเป็นประโยค</div>
    <div class="sentence-slots" id="sentenceSlots"><span style="color:var(--text-light);font-size:0.9rem;">กดคำด้านล่างเพื่อเรียง...</span></div>
    <div class="scrambled-words" id="scrambledWords">
      ${scrambled.map((w, i) => `<div class="scramble-chip" data-idx="${i}" onclick="addToSentence(this,'${w}',${i})">${w}</div>`).join('')}
    </div>
    <div id="hintArea"></div>
  `;
  
  document.getElementById('actionButtons').innerHTML = `
    <button class="btn btn-hint" onclick="sentenceHint()">💡 คำใบ้ (-10 คะแนน)</button>
    <button class="btn btn-secondary" onclick="checkSentence()">✅ ตรวจ</button>
    <button class="btn btn-back" onclick="clearSentence()">🔄 ล้าง</button>
  `;
}

function addToSentence(el, word, idx) {
  AudioFX.play('click');
  const ps = state.puzzleState;
  el.classList.add('used');
  ps.placed.push({ word, idx });
  
  const slots = document.getElementById('sentenceSlots');
  slots.innerHTML = ps.placed.map((p, i) =>
    `<div class="sentence-slot" onclick="removeFromSentence(${i})">${p.word}</div>`
  ).join('');
}

function removeFromSentence(slotIdx) {
  AudioFX.play('click');
  const ps = state.puzzleState;
  const removed = ps.placed.splice(slotIdx, 1)[0];
  
  const chips = document.querySelectorAll('.scramble-chip');
  chips.forEach(c => { if (parseInt(c.dataset.idx) === removed.idx) c.classList.remove('used'); });
  
  const slots = document.getElementById('sentenceSlots');
  if (ps.placed.length === 0) {
    slots.innerHTML = '<span style="color:var(--text-light);font-size:0.9rem;">กดคำด้านล่างเพื่อเรียง...</span>';
  } else {
    slots.innerHTML = ps.placed.map((p, i) =>
      `<div class="sentence-slot" onclick="removeFromSentence(${i})">${p.word}</div>`
    ).join('');
  }
}

function clearSentence() {
  const ps = state.puzzleState;
  ps.placed = [];
  document.querySelectorAll('.scramble-chip').forEach(c => c.classList.remove('used'));
  document.getElementById('sentenceSlots').innerHTML = '<span style="color:var(--text-light);font-size:0.9rem;">กดคำด้านล่างเพื่อเรียง...</span>';
}

function checkSentence() {
  const ps = state.puzzleState;
  const built = ps.placed.map(p => p.word).join('');
  if (built === ps.correct) {
    // Speak sentence via TTS
    if (window.parent && window.parent.window.KAMPAI && window.parent.window.KAMPAI.sound) {
      window.parent.window.KAMPAI.sound.speak(ps.correct, 'th-TH', true);
    } else if (window.KAMPAI && window.KAMPAI.sound) {
      window.KAMPAI.sound.speak(ps.correct, 'th-TH', true);
    }

    state.roundScore = Math.max(50, state.roundScore);
    showRoundResult();
  } else {
    state.attempts++;
    state.roundScore -= 20;
    AudioFX.play('wrong');
    const slots = document.getElementById('sentenceSlots');
    slots.style.animation = 'shake 0.4s ease';
    setTimeout(() => slots.style.animation = '', 400);
    
    if (state.attempts >= 3) {
      document.getElementById('hintArea').innerHTML = `<div class="answer-reveal">คำตอบ: ${ps.correct}</div>`;
      setTimeout(() => showRoundResult(), 2000);
    }
  }
}

function sentenceHint() {
  const ps = state.puzzleState;
  state.roundScore -= 10;
  document.getElementById('hintArea').innerHTML = `<div class="hint-text">💡 คำแรกของประโยคคือ "${ps.words[0]}"</div>`;
}

// ====== PUZZLE TYPE 3: PRONUNCIATION ======
function renderPronunciation() {
  const area = document.getElementById('puzzleArea');
  const idx = pickUnique(VOCAB.pronunciation, 'pronunciation');
  const data = VOCAB.pronunciation[idx];
  
  state.puzzleState = { word: data.word, answer: data.answer, answered: false };
  
  area.innerHTML = `
    <div class="puzzle-title">🗣️ เลือกการอ่านที่ถูกต้อง</div>
    <div class="puzzle-instruction">คำนี้อ่านว่าอะไร?</div>
    <div class="display-word">${data.word}</div>
    <div class="choice-list">
      ${data.options.map((opt, i) => `
        <button class="choice-btn" onclick="selectPronunciation(this, ${i}, ${data.answer})">${opt}</button>
      `).join('')}
    </div>
    <div id="hintArea"></div>
  `;
  
  document.getElementById('timerBadge').style.display = 'none';
  document.getElementById('actionButtons').innerHTML = `
    <button class="btn btn-hint" onclick="pronunciationHint()">💡 คำใบ้ (-10 คะแนน)</button>
  `;
  state.roundScore = 100;
}

function selectPronunciation(el, selectedIdx, correctIdx) {
  if (state.puzzleState.answered) return;
  AudioFX.play('click');
  const buttons = document.querySelectorAll('.choice-btn');
  state.puzzleState.answered = true;
  buttons.forEach(btn => btn.disabled = true);
  
  if (selectedIdx === correctIdx) {
    el.classList.add('correct-choice');
    
    // Speak word via TTS
    if (window.parent && window.parent.window.KAMPAI && window.parent.window.KAMPAI.sound) {
      window.parent.window.KAMPAI.sound.speak(state.puzzleState.word, 'th-TH', true);
    } else if (window.KAMPAI && window.KAMPAI.sound) {
      window.KAMPAI.sound.speak(state.puzzleState.word, 'th-TH', true);
    }

    state.roundScore = Math.max(50, state.roundScore);
    setTimeout(() => showRoundResult(), 1000);
  } else {
    el.classList.add('wrong-choice');
    buttons[correctIdx].classList.add('correct-choice');
    state.roundScore = 0;
    setTimeout(() => showRoundResult(), 1500);
  }
}

function pronunciationHint() {
  const ps = state.puzzleState;
  state.roundScore -= 10;
  const correctOptionText = VOCAB.pronunciation.find(p => p.word === ps.word).options[ps.answer];
  document.getElementById('hintArea').innerHTML = `<div class="hint-text">💡 คำตอบขึ้นต้นด้วยตัวสะกด/คำพ้องเสียงคล้าย "${correctOptionText.charAt(0)}..."</div>`;
}

// ====== PUZZLE TYPE 4: WORD MYSTERY ======
function renderWordMystery() {
  const area = document.getElementById('puzzleArea');
  const idx = pickUnique(VOCAB.wordMystery, 'wordMystery');
  const data = VOCAB.wordMystery[idx];
  
  state.puzzleState = { answer: data.answer, selected: null };
  
  area.innerHTML = `
    <div class="puzzle-title">🔍 ปริศนาหาคำ</div>
    <div class="puzzle-instruction">อ่านคำใบ้แล้วเลือกคำตอบที่ถูกต้อง</div>
    <div class="clue-box">
      ${data.clues.map((c, i) => `
        <div class="clue-item">
          <span class="clue-icon">💡</span>
          <span>คำใบ้ที่ ${i + 1}: ${c}</span>
        </div>
      `).join('')}
    </div>
    <div class="word-bank" id="wordBank">
      ${shuffle(data.bank).map(w => `
        <button class="bank-word" onclick="selectMysteryWord(this, '${w}')">${w}</button>
      `).join('')}
    </div>
    <div id="hintArea"></div>
  `;
  
  document.getElementById('actionButtons').innerHTML = `
    <button class="btn btn-hint" onclick="mysteryHint()">💡 คำใบ้ (-10 คะแนน)</button>
  `;
  startTimer(45);
}

function selectMysteryWord(el, word) {
  AudioFX.play('click');
  const ps = state.puzzleState;
  if (word === ps.answer) {
    el.classList.add('selected-word');
    document.querySelectorAll('.bank-word').forEach(btn => btn.disabled = true);
    clearTimer();
    
    // Speak word via TTS
    if (window.parent && window.parent.window.KAMPAI && window.parent.window.KAMPAI.sound) {
      window.parent.window.KAMPAI.sound.speak(ps.answer, 'th-TH', true);
    } else if (window.KAMPAI && window.KAMPAI.sound) {
      window.KAMPAI.sound.speak(ps.answer, 'th-TH', true);
    }

    const timeBonus = Math.floor(state.timeLeft * 0.5);
    state.roundScore = Math.min(100, state.roundScore + timeBonus);
    setTimeout(() => showRoundResult(), 500);
  } else {
    el.classList.add('wrong');
    state.attempts++;
    state.roundScore -= 20;
    showQuickFeedback(el, false);
    setTimeout(() => { el.classList.remove('wrong'); }, 500);
    if (state.attempts >= 3) {
      document.getElementById('hintArea').innerHTML = `<div class="answer-reveal">คำตอบ: ${ps.answer}</div>`;
      setTimeout(() => showRoundResult(), 2000);
    }
  }
}

function mysteryHint() {
  const ps = state.puzzleState;
  state.roundScore -= 10;
  document.getElementById('hintArea').innerHTML = `<div class="hint-text">💡 คำนี้ขึ้นต้นด้วยพยัญชนะ "${ps.answer.charAt(0)}" และยาว ${ps.answer.length} ตัวอักษร</div>`;
}

// ====== PUZZLE TYPE 5: SPEED READING ======
function renderSpeedReading() {
  const area = document.getElementById('puzzleArea');
  const idx = pickUnique(VOCAB.reading, 'reading');
  const data = VOCAB.reading[idx];
  
  state.puzzleState = { passage: data.passage, question: data.question, answer: data.answer, answered: false };
  
  area.innerHTML = `
    <div class="puzzle-title">📚 อ่านจับใจความ</div>
    <div class="puzzle-instruction">อ่านเนื้อเรื่องแล้วตอบคำถามให้ถูกต้อง</div>
    <div class="reading-passage">${data.passage}</div>
    <div style="font-weight:700;margin-bottom:12px;text-align:center;color:var(--purple);">คำถาม: ${data.question}</div>
    <div class="choice-list">
      ${data.options.map((opt, i) => `
        <button class="choice-btn" onclick="selectReadingAnswer(this, ${i}, ${data.answer})">${opt}</button>
      `).join('')}
    </div>
    <div id="hintArea"></div>
  `;
  
  document.getElementById('actionButtons').innerHTML = `
    <button class="btn btn-hint" onclick="readingHint()">💡 คำใบ้ (-10 คะแนน)</button>
  `;
  startTimer(90);
}

function selectReadingAnswer(el, selectedIdx, correctIdx) {
  if (state.puzzleState.answered) return;
  AudioFX.play('click');
  const buttons = document.querySelectorAll('.choice-btn');
  state.puzzleState.answered = true;
  buttons.forEach(btn => btn.disabled = true);
  clearTimer();
  
  if (selectedIdx === correctIdx) {
    el.classList.add('correct-choice');
    
    // Speak correct option via TTS
    const correctText = buttons[correctIdx].innerText;
    if (window.parent && window.parent.window.KAMPAI && window.parent.window.KAMPAI.sound) {
      window.parent.window.KAMPAI.sound.speak(correctText, 'th-TH', true);
    } else if (window.KAMPAI && window.KAMPAI.sound) {
      window.KAMPAI.sound.speak(correctText, 'th-TH', true);
    }

    const timeBonus = Math.floor(state.timeLeft * 0.4);
    state.roundScore = Math.min(100, state.roundScore + timeBonus);
    setTimeout(() => showRoundResult(), 1000);
  } else {
    el.classList.add('wrong-choice');
    buttons[correctIdx].classList.add('correct-choice');
    state.roundScore = 0;
    setTimeout(() => showRoundResult(), 1500);
  }
}

function readingHint() {
  const ps = state.puzzleState;
  state.roundScore -= 10;
  // Standard simple reading helper hint
  document.getElementById('hintArea').innerHTML = `<div class="hint-text">💡 คำตอบซ่อนอยู่ในช่วงท้ายๆ ของเรื่อง ลองทบทวนอ่านดูอีกครั้งนะครับ</div>`;
}

// ====== RESET GAME ======
function resetGame() {
  AudioFX.play('click');
  if (confirm('ต้องการล้างข้อมูลเพื่อเริ่มเกมใหม่ทั้งหมดใช่หรือไม่?')) {
    state.levelStars = [0, 0, 0, 0, 0];
    localStorage.removeItem('reading_game_stars');
    saveData();
    showMenu();
  }
}

// ====== GAME OVERALL INITIALIZATION ======
window.onload = function() {
  loadData();
  
  // Connect to KAMPAI Sound SDK BGM override if exists
  if (window.KAMPAI) {
    window.KAMPAI.setSlug(config.SLUG);
    
    // Update profile interface if user name is available
    if (window.KAMPAI.student) {
      const studentName = window.KAMPAI.student.displayName.split(' ')[0];
      const subtitle = document.querySelector('.game-subtitle');
      if (subtitle) subtitle.textContent = `ยินดีต้อนรับคุณ ${studentName}! มาฝึกทักษะภาษาไทย ป.4 กันเถอะ`;
    }
  }

  showMenu();
};
