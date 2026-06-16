/* game.js — Interactive Thai Story Game Logic */

const CFG = window.GAME_CONFIG;
const DATA = window.GAME_DATA;

KAMPAI.setSlug(CFG.SLUG);
if (CFG.BGM) {
  KAMPAI.sound.defaultBgm(CFG.BGM);
}

// ═══ State Variables ═══
let currentStory = null;
let chapterIndex = 0;
let questionIndex = 0;
let score = 0;
let lives = CFG.LIVES;
let isOver = false;
let isFirstMistake = false;
let chapterStartTime = 0;
let questionsAnswered = false;

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

// Render story catalog on start screen
function renderStoryCatalog() {
  const grid = document.getElementById('story-grid');
  if (!grid) return;

  grid.innerHTML = DATA.STORIES.map(s => {
    const isCompleted = localStorage.getItem(`ts_completed_${s.id}`) === 'true';
    const checkBadge = isCompleted ? ' ✅' : '';
    return `<div class="story-card" onclick="selectStory('${s.id}')">
      <span class="story-emoji">${s.emoji}</span>
      <span class="story-title">${s.title}${checkBadge}</span>
      <span class="story-diff" style="background:${s.diffColor}">${s.difficulty}</span>
    </div>`;
  }).join('');
}

KAMPAI.onReady(function () {
  renderPlayer();
  renderMyStats();
  renderLeaderboard('score-list');
  renderStoryCatalog();
});
KAMPAI.sound.mountToggles();

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

// ═══ Scene Illustration Drawer ═══
function renderSceneElements(sceneType) {
  const container = document.getElementById('scene-elements');
  container.className = `scene-${sceneType}`;
  
  let html = '';
  if (sceneType === 'forest') {
    html += '<div style="position:absolute; top:15px; right:25px; font-size:36px">☀️</div>';
    html += '<div style="position:absolute; bottom:10px; left:15px; font-size:42px">🌳</div>';
    html += '<div style="position:absolute; bottom:10px; left:75px; font-size:32px">🌲</div>';
    html += '<div style="position:absolute; bottom:12px; right:35px; font-size:24px">🌿</div>';
    html += '<div style="position:absolute; bottom:5px; left:150px; font-size:32px">🐰</div>';
  } else if (sceneType === 'river') {
    html += '<div style="position:absolute; top:20px; left:25px; font-size:28px">☁️</div>';
    html += '<div style="position:absolute; bottom:15px; left:40px; font-size:32px">🐢</div>';
    html += '<div style="position:absolute; bottom:25px; right:60px; font-size:28px">🐟</div>';
    html += '<div style="position:absolute; bottom:5px; left:0; right:0; font-size:20px; text-align:center">🌊🌊🌊🌊🌊</div>';
  } else if (sceneType === 'village') {
    html += '<div style="position:absolute; top:15px; left:20px; font-size:36px">☀️</div>';
    html += '<div style="position:absolute; bottom:10px; left:20px; font-size:42px">🏠</div>';
    html += '<div style="position:absolute; bottom:10px; left:90px; font-size:36px">🌾</div>';
    html += '<div style="position:absolute; bottom:10px; right:30px; font-size:38px">🐘</div>';
    html += '<div style="position:absolute; bottom:10px; right:100px; font-size:34px">🐃</div>';
  } else if (sceneType === 'sky') {
    html += '<div style="position:absolute; top:10px; left:30px; font-size:36px">☁️</div>';
    html += '<div style="position:absolute; top:20px; right:60px; font-size:36px">☀️</div>';
    html += '<div style="position:absolute; bottom:15px; left:10%; font-size:32px">🌳</div>';
    html += '<div style="position:absolute; bottom:30px; left:50%; transform:translateX(-50%); font-size:30px">🐦</div>';
  }
  container.innerHTML = html;
}

// ═══ Story Loop ═══
function selectStory(storyId) {
  currentStory = DATA.STORIES.find(s => s.id === storyId);
  if (!currentStory) return;

  score = 0;
  lives = CFG.LIVES;
  isOver = false;
  isFirstMistake = false;

  document.getElementById('blocker').style.display = 'none';
  document.getElementById('hud').style.display = 'flex';
  document.getElementById('play').style.display = 'flex';
  document.getElementById('score-value').innerText = score;
  updateLivesDisplay();

  KAMPAI.sound.bgmStart();
  loadChapter(0);
  drawLoop();
}

function updateLivesDisplay() {
  const el = document.getElementById('life-container');
  let hearts = '';
  for (let i = 0; i < CFG.LIVES; i++) {
    hearts += i < lives ? '❤️' : '🤍';
  }
  el.innerHTML = hearts;
}

function loadChapter(idx) {
  chapterIndex = idx;
  chapterStartTime = Date.now();
  questionsAnswered = false;
  
  const ch = currentStory.chapters[idx];

  // Render Dots
  const dots = document.getElementById('chapter-dots');
  // For branching story 4, there are 5 chapters in array, but path only goes 4 chapters
  // Simple representation: show 4 dots for story 4, 3 dots for others
  const dotsCount = currentStory.id === 'bird-tree' ? 4 : currentStory.chapters.length;
  let activeDotIdx = idx;
  if (idx === 4) activeDotIdx = 3; // Chapter 4b shows as 4th dot

  let dotsHtml = '';
  for (let i = 0; i < dotsCount; i++) {
    let cls = 'dot';
    if (i === activeDotIdx) cls += ' active';
    else if (i < activeDotIdx) cls += ' passed';
    dotsHtml += `<div class="${cls}"></div>`;
  }
  dots.innerHTML = dotsHtml;

  // Scene illustration
  renderSceneElements(ch.scene);

  // Set Chapter Title
  document.getElementById('story-title-chapter').innerText = ch.title;
  document.getElementById('story-text').innerHTML = ch.text;

  // Show normal "Read / Answer" actions
  document.getElementById('action-area').style.display = 'flex';
  document.getElementById('quiz-card').style.display = 'none';
  document.getElementById('choice-card').style.display = 'none';
  document.getElementById('next-btn').innerText = ch.questions ? '📖 ตอบคำถาม' : '➡️ ดำเนินเรื่องต่อ';

  // Animate book page turn
  const book = document.getElementById('book-container');
  book.classList.add('turn-page');
  setTimeout(() => book.classList.remove('turn-page'), 400);

  // Speak story
  sayStory();
}

function sayStory() {
  if (isOver || !currentStory) return;
  const ch = currentStory.chapters[chapterIndex];
  KAMPAI.sound.speak(ch.text, 'th-TH');
}

function handleNextClick() {
  // Stop speaking
  try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch(e){}

  const ch = currentStory.chapters[chapterIndex];

  if (ch.questions && !questionsAnswered) {
    // Show questions first
    document.getElementById('action-area').style.display = 'none';
    document.getElementById('quiz-card').style.display = 'flex';
    loadQuestion(0);
  } else {
    // Proceed to choice or next chapter
    proceedAfterQuestions();
  }
}

function loadQuestion(qIdx) {
  questionIndex = qIdx;
  const ch = currentStory.chapters[chapterIndex];
  const q = ch.questions[qIdx];

  document.getElementById('quiz-question').innerText = q.q;

  const optionsContainer = document.getElementById('quiz-options');
  optionsContainer.innerHTML = q.options.map((opt, i) => 
    `<button class="option-btn" id="opt-${i}" onclick="selectOption(${i})">${opt}</button>`
  ).join('');
}

function selectOption(optIdx) {
  const ch = currentStory.chapters[chapterIndex];
  const q = ch.questions[questionIndex];

  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.disabled = true);

  const clickedBtn = document.getElementById(`opt-${optIdx}`);

  if (optIdx === q.answer) {
    // CORRECT!
    clickedBtn.classList.add('correct');
    KAMPAI.sound.correct();

    const duration = (Date.now() - chapterStartTime) / 1000;
    const speedBonus = duration <= CFG.CHAPTER_TIME_LIMIT ? CFG.SPEED_BONUS : 0;
    
    score += CFG.BASE_SCORE + speedBonus;
    document.getElementById('score-value').innerText = score;

    setTimeout(() => {
      if (questionIndex + 1 < ch.questions.length) {
        loadQuestion(questionIndex + 1);
      } else {
        // Completed questions for this chapter
        questionsAnswered = true;
        document.getElementById('quiz-card').style.display = 'none';
        proceedAfterQuestions();
      }
    }, 1500);
  } else {
    // WRONG!
    clickedBtn.classList.add('wrong');
    document.getElementById(`opt-${q.answer}`).classList.add('correct');
    KAMPAI.sound.wrong();
    
    isFirstMistake = true;
    lives--;
    updateLivesDisplay();

    setTimeout(() => {
      if (lives <= 0) {
        endGame();
      } else {
        btns.forEach(b => {
          b.disabled = false;
          b.classList.remove('wrong');
          if (parseInt(b.id.split('-').pop()) !== q.answer) {
            b.classList.remove('correct');
          }
        });
      }
    }, 1500);
  }
}

function proceedAfterQuestions() {
  const ch = currentStory.chapters[chapterIndex];

  if (ch.choice) {
    // Show branching choice card
    document.getElementById('action-area').style.display = 'none';
    document.getElementById('choice-card').style.display = 'flex';
    
    document.getElementById('choice-prompt').innerText = ch.choice.prompt;
    const choiceContainer = document.getElementById('choice-options');
    choiceContainer.innerHTML = ch.choice.options.map((opt, i) => 
      `<button class="choice-btn" onclick="makeChoice(${i})">${opt}</button>`
    ).join('');
  } else {
    // Normal linear flow or final chapter
    if (currentStory.id === 'bird-tree') {
      // Branching story completion triggers
      if (chapterIndex === 3 || chapterIndex === 4) {
        completeStory();
      } else {
        loadChapter(chapterIndex + 1);
      }
    } else {
      // Linear story
      if (chapterIndex + 1 < currentStory.chapters.length) {
        loadChapter(chapterIndex + 1);
      } else {
        completeStory();
      }
    }
  }
}

function makeChoice(choiceIdx) {
  const ch = currentStory.chapters[chapterIndex];
  const nextIdx = ch.choice.nextChapter[choiceIdx];
  
  document.getElementById('choice-card').style.display = 'none';
  loadChapter(nextIdx);
}

function completeStory() {
  isOver = true;

  if (!isFirstMistake) {
    score += CFG.PERFECT_BONUS;
    document.getElementById('score-value').innerText = score;
  }

  // Save completion status
  localStorage.setItem(`ts_completed_${currentStory.id}`, 'true');

  KAMPAI.sound.gameOver();
  KAMPAI.sound.bgmStop();

  // Submit to SDK
  KAMPAI.submitScore(score, { mode: 'story', storyId: currentStory.id });

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

  // Show Moral Gold Frame
  document.getElementById('moral-text').innerText = currentStory.moral;

  document.getElementById('final-score').innerText = score;
  document.getElementById('go-summary').innerText = `นิทาน: ${currentStory.title} · ความถูกต้อง: ${isFirstMistake ? 'ผ่านการทดสอบ' : 'ยอดเยี่ยม (ตอบถูกหมด!)'}`;

  document.getElementById('hud').style.display = 'none';
  document.getElementById('play').style.display = 'none';
  document.getElementById('gameover-screen').style.display = 'flex';

  // Confetti burst
  const rect = document.getElementById('moral-box').getBoundingClientRect();
  spawnConfetti(rect.left + rect.width/2, rect.top + rect.height/2);

  renderLeaderboard('score-list-gameover');
}

function endGame() {
  if (isOver) return;
  isOver = true;

  try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch(e){}

  KAMPAI.sound.gameOver();
  KAMPAI.sound.bgmStop();

  KAMPAI.submitScore(score, { mode: 'failed', storyId: currentStory.id });

  document.getElementById('star-display').innerText = '☆☆☆';
  document.getElementById('moral-box').style.display = 'none';
  document.getElementById('final-score').innerText = score;
  document.getElementById('go-summary').innerText = `พลังชีวิตหมดระหว่างเรื่อง: ${currentStory.title}`;

  document.getElementById('hud').style.display = 'none';
  document.getElementById('play').style.display = 'none';
  document.getElementById('gameover-screen').style.display = 'flex';

  renderLeaderboard('score-list-gameover');
}
