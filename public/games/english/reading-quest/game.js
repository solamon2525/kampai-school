/* game.js — Reading Quest Game Logic */

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
let isFirstMistake = false; // to track perfect story bonus
let chapterStartTime = 0;

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
    const isCompleted = localStorage.getItem(`rq_completed_${s.id}`) === 'true';
    const checkBadge = isCompleted ? ' ✅' : '';
    return `<div class="story-card" onclick="selectStory('${s.id}')">
      <span class="story-emoji">${s.emoji}</span>
      <span class="story-title">${s.titleTh}${checkBadge}</span>
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

// ═══ Scene Illustration Drawer ═══
function renderSceneElements(sceneType) {
  const container = document.getElementById('scene-elements');
  container.className = `scene-${sceneType}`;
  
  let html = '';
  if (sceneType === 'park') {
    html += '<div style="position:absolute; top:15px; right:25px; font-size:36px">☀️</div>';
    html += '<div style="position:absolute; bottom:10px; left:15px; font-size:42px">🌳</div>';
    html += '<div style="position:absolute; bottom:10px; left:75px; font-size:32px">🌲</div>';
    html += '<div style="position:absolute; bottom:12px; right:35px; font-size:24px">🌸</div>';
    html += '<div style="position:absolute; bottom:12px; right:85px; font-size:24px">🌹</div>';
    html += '<div style="position:absolute; bottom:5px; left:150px; font-size:28px">🐶</div>';
  } else if (sceneType === 'garden') {
    html += '<div style="position:absolute; top:20px; left:20px; font-size:28px">🦋</div>';
    html += '<div style="position:absolute; bottom:10px; left:20px; font-size:36px">🌻</div>';
    html += '<div style="position:absolute; bottom:10px; left:70px; font-size:32px">🌷</div>';
    html += '<div style="position:absolute; bottom:10px; left:120px; font-size:34px">🌹</div>';
    html += '<div style="position:absolute; bottom:10px; right:40px; font-size:36px">🏡</div>';
  } else if (sceneType === 'market') {
    html += '<div style="position:absolute; top:10px; left:15px; font-size:32px">🏪</div>';
    html += '<div style="position:absolute; bottom:10px; left:90px; font-size:28px">🍎</div>';
    html += '<div style="position:absolute; bottom:10px; left:130px; font-size:28px">🍌</div>';
    html += '<div style="position:absolute; bottom:10px; left:170px; font-size:28px">🥕</div>';
    html += '<div style="position:absolute; bottom:10px; right:30px; font-size:36px">👩‍🍳</div>';
  } else if (sceneType === 'storm') {
    html += '<div style="position:absolute; top:15px; left:30px; font-size:40px">⛈️</div>';
    html += '<div style="position:absolute; top:15px; right:40px; font-size:36px">💨</div>';
    html += '<div style="position:absolute; bottom:5px; left:0; right:0; font-size:24px; text-align:center">🌊🌊🌊🌊🌊</div>';
    html += '<div style="position:absolute; bottom:25px; left:50%; transform:translateX(-50%); font-size:32px">🐦</div>';
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
  
  const ch = currentStory.chapters[idx];

  // Render Dots
  const dots = document.getElementById('chapter-dots');
  dots.innerHTML = currentStory.chapters.map((_, i) => {
    let cls = 'dot';
    if (i === idx) cls += ' active';
    else if (i < idx) cls += ' passed';
    return `<div class="${cls}"></div>`;
  }).join('');

  // Scene illustration
  renderSceneElements(ch.scene);

  // Set Chapter Title
  document.getElementById('story-title-chapter').innerText = ch.title;

  // Set story text with interactive vocabulary links
  let textHtml = ch.text;
  if (ch.vocab && ch.vocab.length > 0) {
    ch.vocab.forEach(v => {
      // Escape for regex and replace with word boundary
      const regex = new RegExp(`\\b${v.word}\\b`, 'gi');
      textHtml = textHtml.replace(regex, (match) => {
        return `<span class="vocab-hl" onclick="showVocab('${v.word.replace(/'/g, "\\'")}', '${v.thai.replace(/'/g, "\\'")}', '${v.emoji}')">${match}</span>`;
      });
    });
  }
  document.getElementById('story-text').innerHTML = textHtml;

  // Show "Next to Questions" button, hide Quiz card
  document.getElementById('action-area').style.display = 'flex';
  document.getElementById('quiz-card').style.display = 'none';

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
  KAMPAI.sound.speak(ch.text, 'en');
}

function showVocab(word, thai, emoji) {
  document.getElementById('popup-word').innerText = `${emoji} ${word}`;
  document.getElementById('popup-translation').innerText = thai;
  document.getElementById('vocab-popup').style.display = 'flex';
}

function hideVocab() {
  document.getElementById('vocab-popup').style.display = 'none';
}

function showQuestions() {
  // Stop speaking story
  try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch(e){}

  document.getElementById('action-area').style.display = 'none';
  document.getElementById('quiz-card').style.display = 'flex';
  
  loadQuestion(0);
}

function loadQuestion(qIdx) {
  questionIndex = qIdx;
  const ch = currentStory.chapters[chapterIndex];
  const q = ch.questions[qIdx];

  document.getElementById('quiz-question').innerText = q.q;
  document.getElementById('quiz-question-th').innerText = q.thai || '';

  const optionsContainer = document.getElementById('quiz-options');
  optionsContainer.innerHTML = q.options.map((opt, i) => 
    `<button class="option-btn" id="opt-${i}" onclick="selectOption(${i})">${opt}</button>`
  ).join('');
}

function selectOption(optIdx) {
  const ch = currentStory.chapters[chapterIndex];
  const q = ch.questions[questionIndex];

  // Disable options clicking
  const btns = document.querySelectorAll('.option-btn');
  btns.forEach(b => b.disabled = true);

  const clickedBtn = document.getElementById(`opt-${optIdx}`);

  if (optIdx === q.answer) {
    // CORRECT!
    clickedBtn.classList.add('correct');
    KAMPAI.sound.correct();

    // Score calculation
    const duration = (Date.now() - chapterStartTime) / 1000;
    const speedBonus = duration <= CFG.CHAPTER_TIME_LIMIT ? CFG.SPEED_BONUS : 0;
    
    score += CFG.BASE_SCORE + speedBonus;
    document.getElementById('score-value').innerText = score;

    // Load next question or chapter after delay
    setTimeout(() => {
      if (questionIndex + 1 < ch.questions.length) {
        loadQuestion(questionIndex + 1);
      } else {
        // Completed chapter questions!
        document.getElementById('quiz-card').style.display = 'none';
        
        if (chapterIndex + 1 < currentStory.chapters.length) {
          loadChapter(chapterIndex + 1);
        } else {
          // Completed Story!
          completeStory();
        }
      }
    }, 1500);
  } else {
    // WRONG!
    clickedBtn.classList.add('wrong');
    
    // Highlight correct
    document.getElementById(`opt-${q.answer}`).classList.add('correct');
    
    KAMPAI.sound.wrong();
    isFirstMistake = true; // Perfect bonus lost

    lives--;
    updateLivesDisplay();

    setTimeout(() => {
      if (lives <= 0) {
        endGame();
      } else {
        // Re-enable options so they can choose again
        btns.forEach(b => {
          b.disabled = false;
          b.classList.remove('wrong');
          if (parseInt(b.id.split('-').pop()) !== q.answer) {
            b.classList.remove('correct'); // keep correct visual or clear all to retry
          }
        });
      }
    }, 1500);
  }
}

function completeStory() {
  isOver = true;

  // Perfect bonus
  if (!isFirstMistake) {
    score += CFG.PERFECT_BONUS;
    document.getElementById('score-value').innerText = score;
  }

  // Mark completed in local storage
  localStorage.setItem(`rq_completed_${currentStory.id}`, 'true');

  KAMPAI.sound.gameOver(); // Plays standard win/fanfare sound
  KAMPAI.sound.bgmStop();

  // Save to SDK
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

  document.getElementById('go-title').innerText = '🎉 นิทานสมบูรณ์!';
  document.getElementById('final-score').innerText = score;
  document.getElementById('go-summary').innerText = `เรื่อง: ${currentStory.titleTh} · ความถูกต้อง: ${isFirstMistake ? 'ผ่านการทดสอบ' : 'ดีเลิศ (ตอบถูกหมด!)'}`;

  document.getElementById('hud').style.display = 'none';
  document.getElementById('play').style.display = 'none';
  document.getElementById('gameover-screen').style.display = 'flex';

  renderLeaderboard('score-list-gameover');
}

function endGame() {
  if (isOver) return;
  isOver = true;

  try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch(e){}

  KAMPAI.sound.gameOver();
  KAMPAI.sound.bgmStop();

  // Save score
  KAMPAI.submitScore(score, { mode: 'failed', storyId: currentStory.id });

  // 0 stars
  document.getElementById('star-display').innerText = '☆☆☆';
  document.getElementById('go-title').innerText = '😢 พยายามอีกครั้ง!';
  document.getElementById('final-score').innerText = score;
  document.getElementById('go-summary').innerText = `สิ้นสุดพลังพลังชีวิตในเรื่อง: ${currentStory.titleTh}`;

  document.getElementById('hud').style.display = 'none';
  document.getElementById('play').style.display = 'none';
  document.getElementById('gameover-screen').style.display = 'flex';

  renderLeaderboard('score-list-gameover');
}
