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
let autoplayInterval = null;
let isAutoplayActive = false;
let autoplaySpeed = 3000;

// สรุปผลรายรอบ (โหมดฝึก) — เก็บถูก/ทั้งหมด + คำที่พลาด
let sessionCorrect = 0;
let sessionTotal = 0;
let missedWords = [];

function resetSession() {
  sessionCorrect = 0;
  sessionTotal = 0;
  missedWords = [];
}

const CONFIG = window.GAME_CONFIG || {};
const CATEGORIES = (window.GAME_DATA && window.GAME_DATA.categories) || [];
const ALL_WORDS = (window.GAME_DATA && window.GAME_DATA.words) || {};

// แสดงหน้าเลือกหัวข้อทันที — ไม่ผูกกับ SDK callback
// ใช้ requestAnimationFrame เพื่อมั่นใจว่า DOM render พร้อมจริงก่อนจัด layout
function safeInitHubGrid() {
  // ถ้ายังไม่มี categories (data.js ยังโหลดไม่เสร็จ) → ลองอีกครั้ง
  if (CATEGORIES.length === 0 && window.GAME_DATA && window.GAME_DATA.categories) {
    CATEGORIES.push(...window.GAME_DATA.categories);
    Object.assign(ALL_WORDS, window.GAME_DATA.words || {});
  }
  requestAnimationFrame(initHubGrid);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', safeInitHubGrid);
} else {
  safeInitHubGrid();
}

// โหลดข้อมูล SDK เมื่อหน้าพร้อมใช้งาน — ครอบ try/catch กันเสียง/ชิป/SDK ทำให้ทั้งเกมพัง
KAMPAI.onReady((sdk) => {
  try {
    // แสดงชิปนักเรียนเมื่อเล่นผ่านระบบ (embedded)
    const name = sdk.student && sdk.student.displayName;
    if (name) {
      const chip = document.getElementById('player-chip');
      if (chip) {
        chip.style.display = 'flex';
        chip.innerHTML = `<div class="pc-init">${name.charAt(0)}</div><span>${name}</span>`;
      }
    }

    // เพลงพื้นหลัง + ปุ่มควบคุมเสียง 🔊 🗣️ 🎵 (คลังสื่อ ไม่นับคะแนน/ไม่มี leaderboard)
    if (sdk.sound) {
      if (sdk.sound.defaultBgm) sdk.sound.defaultBgm(CONFIG.BGM);
      if (sdk.sound.bgmStart) sdk.sound.bgmStart();
      if (sdk.sound.mountToggles) sdk.sound.mountToggles();
    }
  } catch (e) {
    /* เสียง/ชิป/SDK ล้ม ต้องไม่ทำให้เกมเล่นไม่ได้ */
  }
});

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

  // เปลี่ยนหน้าการแสดงผล (ชื่อหมวดแสดงบนการ์ดอยู่แล้ว — ไม่มีแถบ HUD บนสุด)
  document.getElementById('hub-view').style.display = 'none';
  document.getElementById('topic-view').style.display = 'flex';

  // รีเซ็ตค่าด่าน
  currentScore = 0;
  currentLives = CONFIG.LIVES;
  currentWordIndex = 0;
  resetSession();
  updateHUD();

  // สลับเข้าสู่โหมดรีวิว (ทบทวน) เป็นอันดับแรก
  switchMode('auto');
}

// สลับโหมดการเล่น
function switchMode(mode) {
  currentMode = mode;
  isAnswered = false;

  // หยุดการเล่นอัตโนมัติทุกครั้งที่เปลี่ยนโหมด
  stopAutoplay();

  // โหมดทบทวน (auto) = เปิดดูเฉย ๆ ไม่นับคะแนน/ชีวิต → ซ่อนแถบคะแนน
  // โหมดฝึก (dictation/choice/match) = เริ่มรอบใหม่: รีเซ็ตชีวิต/คะแนน/สรุปผล
  const sd = document.getElementById('score-display');
  if (sd) sd.style.display = (mode === 'auto') ? 'none' : 'flex';
  if (mode !== 'auto') {
    currentScore = 0;
    currentLives = CONFIG.LIVES;
    resetSession();
    updateHUD();
  }

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

  // จัดการแผงควบคุมการเล่นอัตโนมัติ
  const autoplayControls = document.getElementById('autoplay-controls');

  // เลือกแผงตามโหมด
  if (mode === 'auto') {
    if (autoplayControls) autoplayControls.style.display = 'flex';
    document.getElementById('words-grid').style.display = 'grid';
    renderWordsGrid();
    loadWord(0);
  } else {
    if (autoplayControls) autoplayControls.style.display = 'none';
    if (mode === 'dictation') {
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

  // รีเซ็ตเวลาเล่นอัตโนมัติใหม่หากเปิดใช้งานอยู่เพื่อไม่ให้เลื่อนข้ามเร็วกว่ากำหนด
  if (isAutoplayActive) {
    startAutoplay();
  }
}

function flipCard() {
  document.getElementById('tcard').classList.toggle('flipped');
}

// เลื่อนคำถัดไป/ก่อนหน้าในโหมดทบทวน (ปุ่ม ◀ ▶ และลูกศรคีย์บอร์ด) วนรอบ
function nextWord() {
  if (currentMode !== 'auto' || categoryWords.length === 0) return;
  loadWord((currentWordIndex + 1) % categoryWords.length);
}

function prevWord() {
  if (currentMode !== 'auto' || categoryWords.length === 0) return;
  loadWord((currentWordIndex - 1 + categoryWords.length) % categoryWords.length);
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
    recordAnswer(wordItem, true);
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
    recordAnswer(wordItem, false);
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
    recordAnswer(wordItem, true);
    showToast('คำตอบถูกต้อง! 🎉', 'correct');
    KAMPAI.sound.correct();
  } else {
    clickedBtn.classList.add('wrong');
    // ไฮไลต์ข้อที่ถูกต้อง
    btns.forEach(btn => {
      if (btn.textContent === wordItem.meaning) btn.classList.add('correct');
    });
    currentLives--;
    recordAnswer(wordItem, false);
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
      recordAnswer(categoryWords.find(w => w.word === leftNode.id), true);
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
      recordAnswer(categoryWords.find(w => w.word === leftNode.id), false);
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
  // เล่นผ่าน SDK เมื่ออยู่ในระบบ → ปุ่ม 🗣️ (mountToggles) คุมเปิด/ปิดได้ + เลือกเสียงดีกว่า
  if (KAMPAI.isEmbed && KAMPAI.sound && KAMPAI.sound.speak) {
    KAMPAI.sound.speak(text, 'th-TH', true);
    return;
  }
  // เปิดไฟล์ตรง ๆ (standalone) → ใช้ Web Speech ของเบราว์เซอร์
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // ยกเลิกการพูดข้อความค้างเก่า
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'th-TH';
    utterance.rate = 0.82; // สปีดเสียงช้าพอดีกับการเรียนภาษาเด็ก ป.4
    window.speechSynthesis.speak(utterance);
  }
}

// ═══ NAVIGATION & HUD ═══

function returnToHub() {
  // หยุดเสียงพูดและการเล่นอัตโนมัติ
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  if (KAMPAI.sound && KAMPAI.sound.stopSpeak) KAMPAI.sound.stopSpeak();
  stopAutoplay();
  document.getElementById('hub-view').style.display = 'flex';
  document.getElementById('topic-view').style.display = 'none';
  document.getElementById('gameover-screen').style.display = 'none';
  const sd = document.getElementById('score-display');
  if (sd) sd.style.display = 'none';
}

function updateHUD() {
  const scoreVal = document.getElementById('score-val');
  if (scoreVal) scoreVal.textContent = currentScore;

  let hearts = '';
  for (let i = 0; i < CONFIG.LIVES; i++) {
    hearts += i < currentLives ? '❤️' : '🖤';
  }
  const lifeDisplay = document.getElementById('life-display');
  if (lifeDisplay) lifeDisplay.textContent = hearts;
}

// บันทึกผลแต่ละข้อในรอบฝึก (ถูก/ผิด + เก็บคำที่พลาดไว้ทบทวน)
function recordAnswer(wordItem, correct) {
  sessionTotal++;
  if (correct) {
    sessionCorrect++;
  } else if (wordItem && !missedWords.some(w => w.word === wordItem.word)) {
    missedWords.push(wordItem);
  }
}

// สรุปจบรอบฝึก (คลังสื่อ — ไม่ส่งคะแนนขึ้นระบบ)
function endGame() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  stopAutoplay();

  const total = sessionTotal;
  const correct = sessionCorrect;
  const pct = total > 0 ? correct / total : 0;

  let stars = 0;
  if (total > 0) {
    if (pct >= 0.9) stars = 3;
    else if (pct >= 0.6) stars = 2;
    else if (pct > 0) stars = 1;
  }

  const starDisplay = document.getElementById('star-display');
  if (starDisplay) {
    let starStr = '';
    for (let i = 1; i <= 3; i++) starStr += i <= stars ? '⭐' : '☆';
    starDisplay.textContent = starStr;
    starDisplay.style.display = 'block';
  }

  // ส่งคะแนนรอบฝึกขึ้นระบบ (เฉพาะเมื่อมีการตอบอย่างน้อย 1 ข้อ — โหมดทบทวนไม่เรียก endGame)
  if (total > 0 && KAMPAI.submitScore) {
    KAMPAI.submitScore(currentScore, { stars: stars });
  }

  const titleEl = document.getElementById('go-title');
  if (titleEl) titleEl.textContent = (currentLives <= 0) ? 'พยายามอีกครั้ง!' : 'ทบทวนสำเร็จ!';

  const summaryEl = document.getElementById('go-summary');
  if (summaryEl) {
    summaryEl.textContent = total > 0 ? `ตอบถูก ${correct} / ${total} คำ` : 'จบรอบแล้ว';
  }

  // รายการคำที่ควรทบทวน (เฉพาะที่ตอบผิด)
  const missedBox = document.getElementById('missed-box');
  const missedList = document.getElementById('missed-list');
  if (missedBox && missedList) {
    if (missedWords.length > 0) {
      missedList.innerHTML = '';
      missedWords.forEach(w => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${w.word}</strong> [${w.reading}] — ${w.meaning}`;
        missedList.appendChild(li);
      });
      missedBox.style.display = 'block';
    } else {
      missedBox.style.display = 'none';
    }
  }

  document.getElementById('gameover-screen').style.display = 'flex';
  document.getElementById('topic-view').style.display = 'none';
  const sd = document.getElementById('score-display');
  if (sd) sd.style.display = 'none';

  if (stars >= 2) {
    initConfetti();
  }
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

// ═══ AUTOPLAY CONTROL FUNCTIONS ═══

function toggleAutoplay() {
  if (isAutoplayActive) {
    stopAutoplay();
  } else {
    startAutoplay();
  }
}

function startAutoplay() {
  isAutoplayActive = true;
  const toggleBtn = document.getElementById('btn-autoplay-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = '⏸ หยุดเล่น';
    toggleBtn.classList.add('playing');
  }

  // Clear any existing interval
  if (autoplayInterval) clearInterval(autoplayInterval);

  // Set interval to advance word
  autoplayInterval = setInterval(() => {
    let nextIndex = currentWordIndex + 1;
    if (nextIndex >= categoryWords.length) {
      nextIndex = 0; // wrap around
    }
    loadWord(nextIndex);
  }, autoplaySpeed);
}

function stopAutoplay() {
  isAutoplayActive = false;
  const toggleBtn = document.getElementById('btn-autoplay-toggle');
  if (toggleBtn) {
    toggleBtn.textContent = '▶ เล่นอัตโนมัติ';
    toggleBtn.classList.remove('playing');
  }

  if (autoplayInterval) {
    clearInterval(autoplayInterval);
    autoplayInterval = null;
  }
}

function changeAutoplaySpeed(speed) {
  autoplaySpeed = parseInt(speed, 10);
  if (isAutoplayActive) {
    // Restart interval with new speed
    startAutoplay();
  }
}

// ═══ KEYBOARD CONTROLS ═══
// ทบทวน: ← → เปลี่ยนคำ, Space พลิกการ์ด · ทายความหมาย: 1-4 เลือกตัวเลือก
// (เขียนตามคำบอก: Enter จัดการที่ handleDictationKey ในช่อง input อยู่แล้ว)
document.addEventListener('keydown', (e) => {
  const topicView = document.getElementById('topic-view');
  if (!topicView || topicView.style.display === 'none') return;

  // อย่าแย่งคีย์จากช่องพิมพ์/ดรอปดาวน์ (เช่น ช่องเขียนตามคำบอก, ตัวเลือกความเร็ว)
  const tag = (document.activeElement && document.activeElement.tagName) || '';
  if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return;

  if (currentMode === 'auto') {
    if (e.key === 'ArrowLeft') { e.preventDefault(); prevWord(); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); nextWord(); }
    else if (e.key === ' ') { e.preventDefault(); flipCard(); }
  } else if (currentMode === 'choice' && e.key >= '1' && e.key <= '4') {
    const btns = document.querySelectorAll('#choice-options .option-btn');
    const btn = btns[parseInt(e.key, 10) - 1];
    if (btn && !btn.disabled) btn.click();
  }
});
