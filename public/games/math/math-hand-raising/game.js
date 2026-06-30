/* game.js — เกมคณิตคิดไว ยกมือทายถูกผิด!
 * Architecture: 7 Modules
 *  1. Initialization & SDK
 *  2. ScreenManager
 *  3. QuestionEngine
 *  4. TimerEngine
 *  5. Gameplay Loop
 *  6. HandDetector (MediaPipe)
 *  7. SoundFX & Helpers
 */

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════
  // MODULE 1 — Initialization & SDK
  // ═══════════════════════════════════════════════════
  var CFG  = window.GAME_CONFIG;
  var DATA = window.GAME_DATA;
  var qrand = Math.random;

  // Versus setup
  var vs = window.KampaiVersus ? KampaiVersus.create({
    duration: 60,
    title: 'เกมคณิตคิดไว ยกมือทายถูกผิด!',
    rankBy: 'score',
    onPlay: function(opts) {
      var rng = opts && opts.rng;
      var player = opts && opts.player;
      startVersusRound(rng, player);
    },
    onEnd: function() {
      state.gameState = 'GAMEOVER';
      stopCamera();
      KAMPAI.sound.bgmStop();
      KAMPAI.sound.gameOver();
    }
  }) : null;

  function startVersusRound(rng, player) {
    qrand = rng || Math.random;
    state.selectedCategory = state.selectedCategory || 'mixed';
    state.selectedGrade = state.selectedGrade || 4;
    state.isFallbackMode = true; // Touch controls for versus mode
    canvasElement.style.display = 'none';

    // Bypass blocker / menus and start gameplay
    showScreen('uiContainer');
    startGameplay();
  }

  KAMPAI.setSlug(CFG.SLUG);
  KAMPAI.sound.defaultBgm(CFG.BGM);
  KAMPAI.sound.mountToggles();

  // Reposition sound toggles to bottom-right
  var soundWrap = document.getElementById('kampai-snd');
  if (soundWrap) {
    soundWrap.style.cssText = 'top:auto;bottom:24px;right:24px;left:auto;z-index:100;';
  }

  // Game state
  var state = {
    gameState: 'INIT',
    selectedCategory: null,
    selectedGrade: null,
    isFallbackMode: false,
    score: 0,
    currentQuestionIndex: 0,
    currentQuestion: null,
    holdProgress: 0,
    currentZone: null,
    results: { correct: 0, wrong: 0, timeUp: 0, bonusCount: 0 },
    cooldownTimeoutId: null,
    wasInCooldown: false
  };

  // UI refs
  var $ = function (id) { return document.getElementById(id); };
  var blocker         = $('blocker');
  var categoryScreen  = $('category-screen');
  var gradeScreen     = $('grade-screen');
  var modeScreen      = $('mode-screen');
  var uiContainer     = $('uiContainer');
  var gameoverScreen  = $('gameover-screen');
  var pauseModal      = $('pause-modal');
  var questionDisplay = $('questionDisplay');
  var feedbackDisplay = $('feedbackDisplay');
  var bonusDisplay    = $('bonusDisplay');
  var scoreDisplay    = $('scoreDisplay');
  var roundDisplay    = $('roundDisplay');
  var timerFill       = $('timer-fill');
  var timerText       = $('timer-text');
  var progressTrue    = $('progressTrue');
  var progressFalse   = $('progressFalse');
  var zoneTrueEl      = $('zoneTrue');
  var zoneFalseEl     = $('zoneFalse');
  var videoElement    = $('videoElement');
  var canvasElement   = $('outputCanvas');
  var canvasCtx       = canvasElement.getContext('2d');

  // Shim for JSDOM
  if (!canvasCtx) {
    canvasCtx = new Proxy({}, { get: function () { return function () {}; }, set: function () { return true; } });
  }

  // Camera / animation refs
  var webcamStream = null;
  var predictRafId = null;
  var gameRafId    = null;

  // ── SDK Ready ──
  KAMPAI.onReady(function (K) {
    renderPlayer(K);
    renderMyStats(K);
    renderLeaderboard(K);
    state.gameState = 'MENU_START';
  });

  function renderPlayer(K) {
    var chip = $('player-chip');
    if (!chip || !K.student) return;
    var s = K.student;
    chip.innerHTML =
      '<img src="' + (s.photoUrl || '/avatar-placeholder.png') + '" class="w-6 h-6 rounded-full border border-yellow-400 object-cover" onerror="this.src=\'/avatar-placeholder.png\'">' +
      '<span class="text-white font-bold">' + (s.displayName || '') + '</span>';
    chip.classList.remove('hidden');
    chip.classList.add('flex');
  }

  function renderMyStats(K) {
    var box = $('my-stats');
    if (!box) return;
    var st = K.stats;
    if (st && (st.personalBest || st.playsCount)) {
      var best = $('ms-best');
      var plays = $('ms-plays');
      if (best) best.textContent = st.personalBest || 0;
      if (plays) plays.textContent = st.playsCount || 0;
      box.style.display = 'block';
    }
  }

  function renderLeaderboard(K) {
    var list = $('score-list');
    var box  = $('leaderboard-box');
    if (!list || !box || !K.leaderboard || K.leaderboard.length === 0) return;
    list.innerHTML = K.leaderboard.slice(0, 5).map(function (r) {
      var medals = ['🥇', '🥈', '🥉'];
      var badge  = r.rank <= 3 ? medals[r.rank - 1] : '#' + r.rank;
      var me     = r.isMe ? ' bg-slate-700/40 px-2 rounded' : '';
      return '<li class="flex justify-between items-center py-1 border-b border-slate-700/60 last:border-0' + me + '">' +
        '<div class="flex items-center gap-2"><span class="font-bold text-yellow-400">' + badge + '</span>' +
        '<span class="truncate max-w-[140px]">' + r.displayName + (r.isMe ? ' (คุณ)' : '') + '</span></div>' +
        '<span class="font-bold text-green-400">' + r.personalBest + '</span></li>';
    }).join('');
    box.style.display = 'block';
  }

  // ═══════════════════════════════════════════════════
  // MODULE 2 — ScreenManager
  // ═══════════════════════════════════════════════════
  var allScreenIds = ['blocker', 'category-screen', 'grade-screen', 'mode-screen', 'uiContainer', 'gameover-screen', 'pause-modal'];

  function showScreen(id) {
    allScreenIds.forEach(function (sid) {
      var el = $(sid);
      if (!el) return;
      if (sid === id) {
        el.classList.remove('hidden');
        el.style.display = (sid === 'uiContainer') ? 'flex' : 'flex';
      } else {
        el.classList.add('hidden');
        el.style.display = 'none';
      }
    });
  }

  // ── Build Category Grid ──
  (function buildCategoryGrid() {
    var grid = $('category-grid');
    if (!grid) return;
    var cats = DATA.categories;
    var keys = Object.keys(cats);
    var html = '';
    keys.forEach(function (key) {
      var c = cats[key];
      html += '<button class="cat-card ' + c.tailwind + '" data-category="' + key + '">' +
        '<span class="cat-icon">' + c.icon + '</span>' +
        '<span class="cat-label">' + c.label + '</span></button>';
    });
    grid.innerHTML = html;

    // Bind clicks
    grid.querySelectorAll('.cat-card').forEach(function (card) {
      card.addEventListener('click', function () {
        grid.querySelectorAll('.cat-card').forEach(function (c) { c.classList.remove('active'); });
        card.classList.add('active');
        state.selectedCategory = card.dataset.category;
        $('btn-cat-next').classList.remove('disabled');
      });
    });
  })();

  // ── Build Grade Grid ──
  (function buildGradeGrid() {
    var grid = $('grade-grid');
    if (!grid) return;
    var grades = DATA.grades;
    var html = '';
    [4, 5, 6].forEach(function (g) {
      var gd = grades[g];
      var timer = CFG.TIMER[g];
      html += '<button class="grade-card ' + gd.cardBg + '" data-grade="' + g + '">' +
        '<span class="grade-level bg-gradient-to-r ' + gd.badgeGradient + ' bg-clip-text text-transparent">' + gd.label + '</span>' +
        '<span class="grade-desc">' + gd.desc + '</span>' +
        '<span class="grade-timer">⏱ ' + timer + ' วินาที/ข้อ</span></button>';
    });
    grid.innerHTML = html;

    grid.querySelectorAll('.grade-card').forEach(function (card) {
      card.addEventListener('click', function () {
        grid.querySelectorAll('.grade-card').forEach(function (c) { c.classList.remove('active'); });
        card.classList.add('active');
        state.selectedGrade = parseInt(card.dataset.grade);
        $('btn-grade-next').classList.remove('disabled');
      });
    });
  })();

  // ── Screen Navigation ──

  // Start → Category
  $('btn-play').addEventListener('click', function () {
    SoundFX.init();
    showScreen('category-screen');
    state.gameState = 'MENU_CATEGORY';
  });

  // Start → Versus
  $('btn-versus').addEventListener('click', function () {
    if (vs) vs.openMenu();
  });

  // Category → Grade
  $('btn-cat-next').addEventListener('click', function () {
    if (!state.selectedCategory) return;
    showScreen('grade-screen');
    state.gameState = 'MENU_GRADE';
  });
  $('btn-cat-back').addEventListener('click', function () {
    showScreen('blocker');
    state.gameState = 'MENU_START';
  });

  // Grade → Mode
  $('btn-grade-next').addEventListener('click', function () {
    if (!state.selectedGrade) return;
    renderSelectedSummary();
    showScreen('mode-screen');
    state.gameState = 'MENU_MODE';
  });
  $('btn-grade-back').addEventListener('click', function () {
    showScreen('category-screen');
    state.gameState = 'MENU_CATEGORY';
  });

  // Mode back
  $('btn-mode-back').addEventListener('click', function () {
    showScreen('grade-screen');
    state.gameState = 'MENU_GRADE';
  });

  // Render selected summary tags
  function renderSelectedSummary() {
    var sum = $('selected-summary');
    if (!sum) return;
    var catInfo   = DATA.categories[state.selectedCategory];
    var gradeInfo = DATA.grades[state.selectedGrade];
    var timer     = CFG.TIMER[state.selectedGrade];
    sum.innerHTML =
      '<span class="summary-tag">' + catInfo.icon + ' หมวด: ' + catInfo.label + '</span>' +
      '<span class="summary-tag">🎓 ระดับ: ' + gradeInfo.label + '</span>' +
      '<span class="summary-tag">⏱ ' + timer + ' วินาที/ข้อ</span>';
  }

  // ── Mode Select: Camera ──
  $('btn-start-camera').addEventListener('click', function () {
    qrand = Math.random;
    state.isFallbackMode = false;
    canvasElement.style.display = 'block'; // Restore canvas visibility in case it was hidden by fallback mode
    $('btn-start-camera').classList.add('hidden');
    $('btn-start-touch').classList.add('hidden');
    $('btn-mode-back').classList.add('hidden');
    $('loading-camera').classList.remove('hidden');
    startCamera();
  });

  // ── Mode Select: Touch / Mouse ──
  $('btn-start-touch').addEventListener('click', function () {
    qrand = Math.random;
    state.isFallbackMode = true;
    canvasElement.style.display = 'none';
    startGameplay();
  });

  // ── Pause ──
  $('btn-quit').addEventListener('click', function () {
    if (state.gameState === 'AWAITING_ANSWER' || state.gameState === 'COOLDOWN') {
      if (state.gameState === 'COOLDOWN') {
        clearTimeout(state.cooldownTimeoutId);
        state.wasInCooldown = true;
      } else {
        state.wasInCooldown = false;
        TimerEngine.pause();
      }
      state.gameState = 'PAUSED';
      pauseModal.classList.remove('hidden');
      pauseModal.style.display = 'flex';
    }
  });
  $('btn-resume').addEventListener('click', function () {
    pauseModal.classList.add('hidden');
    pauseModal.style.display = 'none';
    if (state.wasInCooldown) {
      state.wasInCooldown = false;
      state.gameState = 'COOLDOWN';
      state.cooldownTimeoutId = setTimeout(function () {
        state.gameState = 'AWAITING_ANSWER';
        var seconds = CFG.TIMER[state.selectedGrade];
        TimerEngine.start(seconds, updateTimerUI, handleTimeUp);
      }, CFG.COOLDOWN_MS);
    } else {
      state.gameState = 'AWAITING_ANSWER';
      TimerEngine.resume(updateTimerUI, handleTimeUp);
    }
  });
  $('btn-confirm-quit').addEventListener('click', function () {
    TimerEngine.stop();
    stopCamera();
    KAMPAI.sound.bgmStop();
    KAMPAI.goHome();
  });

  // ── Game Over buttons ──
  $('btn-play-again').addEventListener('click', function () {
    resetSelections();
    showScreen('blocker');
    state.gameState = 'MENU_START';
  });
  $('btn-go-home').addEventListener('click', function () {
    KAMPAI.goHome();
  });

  function resetSelections() {
    state.selectedCategory = null;
    state.selectedGrade = null;
    // Reset card selections
    document.querySelectorAll('.cat-card.active').forEach(function (c) { c.classList.remove('active'); });
    document.querySelectorAll('.grade-card.active').forEach(function (c) { c.classList.remove('active'); });
    $('btn-cat-next').classList.add('disabled');
    $('btn-grade-next').classList.add('disabled');
    // Reset mode screen buttons
    $('btn-start-camera').classList.remove('hidden');
    $('btn-start-touch').classList.remove('hidden');
    $('btn-mode-back').classList.remove('hidden');
    $('loading-camera').classList.add('hidden');
  }

  // ═══════════════════════════════════════════════════
  // MODULE 3 — QuestionEngine
  // ═══════════════════════════════════════════════════
  var QuestionEngine = {
    generate: function (category, grade) {
      var ops = ['addition', 'subtraction', 'multiplication', 'division'];
      var cat = (category === 'mixed') ? ops[Math.floor(qrand() * ops.length)] : category;
      var diff = CFG.DIFFICULTY[grade][cat];
      var catData = DATA.categories[cat];

      var num1, num2, realAnswer;

      switch (cat) {
        case 'addition':
          num1 = this._rand(diff.min, diff.max);
          num2 = this._rand(diff.min, diff.max);
          realAnswer = num1 + num2;
          break;
        case 'subtraction':
          num1 = this._rand(diff.min, diff.max);
          num2 = this._rand(diff.min, num1);
          realAnswer = num1 - num2;
          break;
        case 'multiplication':
          num1 = this._rand(diff.minA, diff.maxA);
          num2 = this._rand(diff.minB, diff.maxB);
          realAnswer = num1 * num2;
          break;
        case 'division':
          num2 = this._rand(diff.minDiv, diff.maxDiv);
          realAnswer = this._rand(diff.minAns, diff.maxAns);
          num1 = num2 * realAnswer;
          break;
      }

      // 50/50 ถูก/ผิด
      var isCorrect = qrand() > 0.5;
      var shownAnswer = realAnswer;

      if (!isCorrect) {
        var margin = this._rand(1, Math.max(3, Math.floor(realAnswer * 0.15)));
        shownAnswer = realAnswer + (qrand() > 0.5 ? margin : -margin);
        if (shownAnswer < 0) shownAnswer = realAnswer + margin;
        if (shownAnswer === realAnswer) shownAnswer = realAnswer + 1;
      }

      var opSymbol = catData.opSymbol;
      var opName   = catData.opName;

      return {
        text:       num1.toLocaleString() + ' ' + opSymbol + ' ' + num2.toLocaleString() + ' = ' + shownAnswer.toLocaleString(),
        spokenText: num1 + ' ' + opName + ' ' + num2 + ' เท่ากับ ' + shownAnswer,
        isCorrect:  isCorrect,
      };
    },

    _rand: function (min, max) {
      return Math.floor(qrand() * (max - min + 1)) + min;
    }
  };

  // ═══════════════════════════════════════════════════
  // MODULE 4 — TimerEngine
  // ═══════════════════════════════════════════════════
  var TimerEngine = {
    intervalId: null,
    totalSeconds: 0,
    remaining: 0,
    _onTick: null,
    _onTimeUp: null,

    start: function (seconds, onTick, onTimeUp) {
      this.stop();
      this.totalSeconds = seconds;
      this.remaining = seconds;
      this._onTick = onTick;
      this._onTimeUp = onTimeUp;
      var self = this;
      this.intervalId = setInterval(function () {
        self.remaining -= 0.1;
        if (self.remaining <= 0) {
          self.remaining = 0;
          self.stop();
          if (self._onTick) self._onTick(0, self.totalSeconds);
          if (self._onTimeUp) self._onTimeUp();
          return;
        }
        if (self._onTick) self._onTick(self.remaining, self.totalSeconds);
      }, 100);
    },

    stop: function () {
      if (this.intervalId) {
        clearInterval(this.intervalId);
        this.intervalId = null;
      }
    },

    pause: function () {
      this.stop();
    },

    resume: function (onTick, onTimeUp) {
      if (this.remaining <= 0) return;
      this.stop(); // Safe guard against double-resume intervals
      this._onTick = onTick;
      this._onTimeUp = onTimeUp;
      var self = this;
      this.intervalId = setInterval(function () {
        self.remaining -= 0.1;
        if (self.remaining <= 0) {
          self.remaining = 0;
          self.stop();
          if (self._onTick) self._onTick(0, self.totalSeconds);
          if (self._onTimeUp) self._onTimeUp();
          return;
        }
        if (self._onTick) self._onTick(self.remaining, self.totalSeconds);
      }, 100);
    },

    getElapsedPercent: function () {
      if (this.totalSeconds === 0) return 1;
      return 1 - (this.remaining / this.totalSeconds);
    }
  };

  function updateTimerUI(remaining, total) {
    var pct = (remaining / total) * 100;
    timerFill.style.width = pct + '%';
    timerText.textContent = Math.ceil(remaining);

    timerFill.classList.remove('timer-green', 'timer-yellow', 'timer-red', 'timer-blink');
    if (pct > 50) {
      timerFill.classList.add('timer-green');
    } else if (pct > 25) {
      timerFill.classList.add('timer-yellow');
    } else {
      timerFill.classList.add('timer-red');
      if (pct <= 15) timerFill.classList.add('timer-blink');
    }
  }

  // ═══════════════════════════════════════════════════
  // MODULE 5 — Gameplay Loop
  // ═══════════════════════════════════════════════════
  function startGameplay() {
    state.score = 0;
    state.currentQuestionIndex = 0;
    state.results = { correct: 0, wrong: 0, timeUp: 0, bonusCount: 0 };
    scoreDisplay.textContent = '0';
    if (vs) vs.report(state.score, { correct: state.results.correct });
    KAMPAI.sound.bgmStart();
    showScreen('uiContainer');
    nextQuestion();
  }

  function nextQuestion() {
    state.currentQuestionIndex++;
    if (state.currentQuestionIndex > CFG.TOTAL_QUESTIONS) {
      endGame();
      return;
    }

    // Update round badge
    roundDisplay.textContent = state.currentQuestionIndex + '/' + CFG.TOTAL_QUESTIONS;

    // Generate question
    state.currentQuestion = QuestionEngine.generate(state.selectedCategory, state.selectedGrade);

    // Display question
    questionDisplay.textContent = state.currentQuestion.text;
    questionDisplay.className = 'question-text text-yellow-300';
    feedbackDisplay.style.opacity = '0';
    bonusDisplay.classList.add('hidden');
    bonusDisplay.classList.remove('bonus-pop');

    // Reset hold progress
    state.holdProgress = 0;
    state.currentZone = null;
    updateProgressBar();

    // Cooldown → then accept answers + start timer
    state.gameState = 'COOLDOWN';
    state.cooldownTimeoutId = setTimeout(function () {
      state.gameState = 'AWAITING_ANSWER';
      var seconds = CFG.TIMER[state.selectedGrade];
      TimerEngine.start(seconds, updateTimerUI, handleTimeUp);
    }, CFG.COOLDOWN_MS);

    // TTS read question
    SoundFX.speak(state.currentQuestion.spokenText);
  }

  function submitAnswer(userSelectedTrue) {
    if (state.gameState !== 'AWAITING_ANSWER') return;
    state.gameState = 'FEEDBACK';
    TimerEngine.stop();

    var isCorrect = (userSelectedTrue === state.currentQuestion.isCorrect);

    if (isCorrect) {
      var pts = CFG.SCORE_CORRECT;
      state.results.correct++;

      // Fast-answer bonus
      var elapsed = TimerEngine.getElapsedPercent();
      if (elapsed <= CFG.BONUS_THRESHOLD) {
        pts += CFG.SCORE_BONUS_FAST;
        state.results.bonusCount++;
        showBonusPopup();
      }

      state.score += pts;
      scoreDisplay.textContent = state.score;

      questionDisplay.className = 'question-text text-green-400';
      questionDisplay.style.transform = 'scale(1.1)';
      var phrase = randomPick(DATA.correctPhrases);
      feedbackDisplay.textContent = phrase + '! 🌟';
      feedbackDisplay.className = 'feedback-text text-green-400';
      feedbackDisplay.style.opacity = '1';
      SoundFX.playCorrect(phrase);

      // Confetti
      if (typeof confetti === 'function') {
        confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 }, zIndex: 9999, colors: ['#22c55e', '#facc15', '#3b82f6', '#ec4899'] });
      }
    } else {
      state.results.wrong++;
      questionDisplay.className = 'question-text text-red-500';
      questionDisplay.style.transform = 'scale(1)';
      var phrase2 = randomPick(DATA.wrongPhrases);
      feedbackDisplay.textContent = phrase2 + ' ❌';
      feedbackDisplay.className = 'feedback-text text-red-400';
      feedbackDisplay.style.opacity = '1';
      SoundFX.playWrong(phrase2);
      shakeScreen();
    }

    if (vs) vs.report(state.score, { correct: state.results.correct });

    state.holdProgress = 0;
    updateProgressBar();

    setTimeout(function () {
      questionDisplay.style.transform = 'scale(1)';
      nextQuestion();
    }, CFG.FEEDBACK_MS);
  }

  function handleTimeUp() {
    if (state.gameState !== 'AWAITING_ANSWER') return;
    state.gameState = 'FEEDBACK';
    state.results.timeUp++;

    questionDisplay.className = 'question-text text-orange-400';
    var phrase = randomPick(DATA.timeUpPhrases);
    feedbackDisplay.textContent = phrase;
    feedbackDisplay.className = 'feedback-text text-orange-400';
    feedbackDisplay.style.opacity = '1';

    KAMPAI.sound.timeUp();

    if (vs) vs.report(state.score, { correct: state.results.correct });

    state.holdProgress = 0;
    updateProgressBar();

    setTimeout(nextQuestion, CFG.FEEDBACK_MS);
  }

  function endGame() {
    state.gameState = 'GAMEOVER';
    stopCamera();
    KAMPAI.sound.bgmStop();
    KAMPAI.sound.gameOver();

    // Versus handle finish
    if (vs && vs.finish(state.score, { correct: state.results.correct })) return;

    // Submit score
    KAMPAI.submitScore(state.score, {
      mode: state.selectedCategory,
      grade: state.selectedGrade,
      correct: state.results.correct,
      wrong: state.results.wrong,
      timeUp: state.results.timeUp,
      bonusCount: state.results.bonusCount,
    });

    // Render game-over screen
    renderGameOverScreen();
    showScreen('gameover-screen');
  }

  function renderGameOverScreen() {
    // Stars
    var correct = state.results.correct;
    var starCount = correct >= 8 ? 3 : correct >= 5 ? 2 : correct >= 1 ? 1 : 0;
    var starsEl = $('go-stars');
    starsEl.textContent = '⭐'.repeat(starCount) + '☆'.repeat(3 - starCount);

    // Score
    $('final-score').textContent = state.score;

    // Summary grid
    var summary = $('go-summary');
    summary.innerHTML =
      '<div class="go-summary-item"><span class="go-summary-num text-green-400">' + state.results.correct + '</span><span class="go-summary-label">✅ ตอบถูก</span></div>' +
      '<div class="go-summary-item"><span class="go-summary-num text-red-400">' + state.results.wrong + '</span><span class="go-summary-label">❌ ตอบผิด</span></div>' +
      '<div class="go-summary-item"><span class="go-summary-num text-orange-400">' + state.results.timeUp + '</span><span class="go-summary-label">⏰ หมดเวลา</span></div>' +
      '<div class="go-summary-item"><span class="go-summary-num text-yellow-400">' + state.results.bonusCount + '</span><span class="go-summary-label">⚡ โบนัสเร็ว</span></div>';

    // Mode info
    var catInfo   = DATA.categories[state.selectedCategory];
    var gradeInfo = DATA.grades[state.selectedGrade];
    $('go-mode-info').textContent = '🏅 หมวด: ' + catInfo.label + ' · ระดับ: ' + gradeInfo.label;
  }

  // ── Answer Zone Clicks ──
  zoneTrueEl.addEventListener('click', function () {
    if (state.gameState === 'AWAITING_ANSWER') submitAnswer(true);
  });
  zoneFalseEl.addEventListener('click', function () {
    if (state.gameState === 'AWAITING_ANSWER') submitAnswer(false);
  });

  // ── Keyboard: Escape = pause ──
  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && (state.gameState === 'AWAITING_ANSWER' || state.gameState === 'COOLDOWN')) {
      $('btn-quit').click();
    }
  });

  // ── Progress Bar (hand-hold) ──
  function updateProgressBar() {
    var pct = Math.min((state.holdProgress / CFG.FRAMES_TO_CONFIRM) * 100, 100);
    if (state.currentZone === 'TRUE') {
      progressTrue.style.width = pct + '%';
      progressFalse.style.width = '0%';
      zoneTrueEl.style.backgroundColor = 'rgba(34,197,94,' + (pct * 0.005) + ')';
      zoneFalseEl.style.backgroundColor = 'transparent';
    } else if (state.currentZone === 'FALSE') {
      progressFalse.style.width = pct + '%';
      progressTrue.style.width = '0%';
      zoneFalseEl.style.backgroundColor = 'rgba(239,68,68,' + (pct * 0.005) + ')';
      zoneTrueEl.style.backgroundColor = 'transparent';
    } else {
      progressTrue.style.width = '0%';
      progressFalse.style.width = '0%';
      zoneTrueEl.style.backgroundColor = 'transparent';
      zoneFalseEl.style.backgroundColor = 'transparent';
    }
  }

  // ═══════════════════════════════════════════════════
  // MODULE 6 — HandDetector (MediaPipe)
  // ═══════════════════════════════════════════════════
  var isAILoaded  = false;
  var isPredicting = false;

  // Guard: Shim if CDN failed
  if (typeof Hands === 'undefined') {
    window.Hands = function () {
      return { initialize: function () { return Promise.resolve(); }, setOptions: function () {}, onResults: function () {}, send: function () { return Promise.resolve(); }, close: function () {} };
    };
  }

  var hands = new Hands({ locateFile: function (file) { return 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/' + file; } });
  hands.setOptions({ maxNumHands: 2, modelComplexity: 0, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });

  hands.initialize().then(function () {
    isAILoaded = true;
  });

  hands.onResults(onHandResults);

  function onHandResults(results) {
    isPredicting = false;

    if (canvasElement.width !== (videoElement.videoWidth || 640)) {
      canvasElement.width = videoElement.videoWidth || 640;
      canvasElement.height = videoElement.videoHeight || 480;
    }

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    var detectedZone = null;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0 && state.gameState === 'AWAITING_ANSWER') {
      for (var h = 0; h < results.multiHandLandmarks.length; h++) {
        var l = results.multiHandLandmarks[h];

        // Check open hand (all 5 fingers extended)
        var isIndexOpen  = l[8].y  < l[6].y;
        var isMiddleOpen = l[12].y < l[10].y;
        var isRingOpen   = l[16].y < l[14].y;
        var isPinkyOpen  = l[20].y < l[18].y;
        var distThumbTip = Math.hypot(l[4].x - l[0].x, l[4].y - l[0].y);
        var distThumbIP  = Math.hypot(l[3].x - l[0].x, l[3].y - l[0].y);
        var isThumbOpen  = distThumbTip > distThumbIP;
        var isOpenHand = isIndexOpen && isMiddleOpen && isRingOpen && isPinkyOpen && isThumbOpen;

        // Draw landmarks
        for (var i = 0; i < l.length; i++) {
          var x = l[i].x * canvasElement.width;
          var y = l[i].y * canvasElement.height;
          canvasCtx.beginPath();
          canvasCtx.arc(x, y, 5, 0, 2 * Math.PI);
          canvasCtx.fillStyle = isOpenHand ? '#22c55e' : '#facc15';
          canvasCtx.fill();
        }

        if (isOpenHand) {
          var palmX = l[9].x;
          var mirroredX = 1 - palmX;
          if (mirroredX < 0.25) { detectedZone = 'TRUE'; break; }
          else if (mirroredX > 0.75) { detectedZone = 'FALSE'; break; }
        }
      }
    }

    // Update hold progress
    if (detectedZone && state.gameState === 'AWAITING_ANSWER') {
      state.currentZone = detectedZone;
      state.holdProgress++;
    } else {
      state.currentZone = null;
      state.holdProgress = 0;
    }

    if (state.gameState === 'AWAITING_ANSWER' || state.gameState === 'FEEDBACK') {
      updateProgressBar();
    }

    if (state.holdProgress >= CFG.FRAMES_TO_CONFIRM && state.gameState === 'AWAITING_ANSWER') {
      submitAnswer(state.currentZone === 'TRUE');
    }

    canvasCtx.restore();
  }

  function predictLoop() {
    if (state.isFallbackMode) return;
    if (videoElement.readyState >= 2 && !isPredicting) {
      isPredicting = true;
      hands.send({ image: videoElement }).catch(function () { /* silent */ });
    }
    predictRafId = requestAnimationFrame(predictLoop);
  }

  function startCamera() {
    if (!isAILoaded) {
      // AI not loaded → fallback to touch
      state.isFallbackMode = true;
      canvasElement.style.display = 'none';
      startGameplay();
      return;
    }

    var constraints = { video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } };

    navigator.mediaDevices.getUserMedia(constraints)
      .catch(function () {
        // Try without facingMode
        return navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 640 }, height: { ideal: 480 } } });
      })
      .then(function (stream) {
        webcamStream = stream;
        videoElement.srcObject = stream;
        videoElement.onloadeddata = function () {
          videoElement.play();
          startGameplay();
          predictLoop();
        };
      })
      .catch(function () {
        // Camera failed → fallback
        state.isFallbackMode = true;
        canvasElement.style.display = 'none';
        startGameplay();
      });
  }

  function stopCamera() {
    if (webcamStream) {
      try { webcamStream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) { /* */ }
      webcamStream = null;
    }
    if (predictRafId) { cancelAnimationFrame(predictRafId); predictRafId = null; }
    if (gameRafId) { cancelAnimationFrame(gameRafId); gameRafId = null; }
  }

  // ═══════════════════════════════════════════════════
  // MODULE 7 — SoundFX & Helpers
  // ═══════════════════════════════════════════════════
  var SoundFX = {
    init: function () { KAMPAI.sound.unlock(); },
    speak: function (text) {
      if (KAMPAI.sound && typeof KAMPAI.sound.speak === 'function') {
        KAMPAI.sound.speak(text);
      } else if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        u.lang = 'th-TH'; u.rate = 1.0; u.pitch = 1.2;
        window.speechSynthesis.speak(u);
      }
    },
    playCorrect: function (text) {
      KAMPAI.sound.correct();
      KAMPAI.sound.fxFlash(true);
      var self = this;
      setTimeout(function () { self.speak(text); }, 450);
    },
    playWrong: function (text) {
      KAMPAI.sound.wrong();
      KAMPAI.sound.fxFlash(false);
      var self = this;
      setTimeout(function () { self.speak(text); }, 650);
    }
  };

  function randomPick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function shakeScreen() {
    uiContainer.classList.add('shake-effect', 'flash-red-effect');
    setTimeout(function () { uiContainer.classList.remove('shake-effect', 'flash-red-effect'); }, 500);
  }

  function showBonusPopup() {
    bonusDisplay.classList.remove('hidden', 'bonus-pop');
    // Force reflow to restart animation
    void bonusDisplay.offsetWidth;
    bonusDisplay.classList.add('bonus-pop');
  }

  // Render loop for webcam skeleton display (always running)
  function renderLoop() {
    if (!state.isFallbackMode) {
      // Canvas is handled by onHandResults → MediaPipe callback
    }
    gameRafId = requestAnimationFrame(renderLoop);
  }
  gameRafId = requestAnimationFrame(renderLoop);

})();
