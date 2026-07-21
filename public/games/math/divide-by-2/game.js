/* game.js — หารเร็วในใจ (Divide by 2 Quick Quiz) */
(function () {
  'use strict';

  var CFG = window.GAME_CONFIG;
  var DATA = window.GAME_DATA;
  var $ = function (id) { return document.getElementById(id); };

  KAMPAI.setSlug(CFG.SLUG);
  KAMPAI.sound.defaultBgm(CFG.BGM);
  KAMPAI.sound.mountToggles();
  KAMPAI.controls.mount({ dpad: false, buttons: [] });

  var qrand = Math.random;
  var score = 0;
  var combo = 0;
  var correct = 0;
  var wrong = 0;
  var totalAnswered = 0;
  var locked = false;
  var gameMode = 'race';
  var selectedLevel = CFG.DEFAULT_LEVEL || 'easy';
  var currentQ = null;
  var questionStart = 0;
  var qTimeLeft = 0;
  var qTimeMax = CFG.QUESTION_TIME;
  var gameTimeLeft = CFG.GAME_DURATION;
  var gameTimerId = null;
  var qTimerId = null;
  var versusActive = false;

  var vs = window.KampaiVersus ? KampaiVersus.create({
    duration: CFG.VERSUS_DURATION || 60,
    title: DATA.TITLE || 'หารเร็วในใจ',
    rankBy: 'score',
    onPlay: function (opts) {
      qrand = (opts && opts.rng) || Math.random;
      versusActive = true;
      startRound('versus');
    },
    onEnd: function () {
      locked = true;
      stopTimers();
      KAMPAI.sound.bgmStop();
      KAMPAI.sound.gameOver();
    }
  }) : null;

  function pickPhrase(list) {
    if (!list || !list.length) return '';
    return list[Math.floor(Math.random() * list.length)];
  }

  function levelCfg(key) {
    return CFG.LEVELS[key] || CFG.LEVELS.easy;
  }

  function randEven(min, max) {
    var lo = Math.ceil(min / 2) * 2;
    var hi = Math.floor(max / 2) * 2;
    if (lo > hi) lo = hi;
    var count = Math.floor((hi - lo) / 2) + 1;
    return lo + Math.floor(qrand() * count) * 2;
  }

  function createQuestion() {
    var lv = levelCfg(selectedLevel);
    var dividend = randEven(lv.min, lv.max);
    var answer = dividend / 2;
    return { dividend: dividend, answer: answer, text: dividend + ' ÷ 2 = ?' };
  }

  function buildWrongAnswers(q) {
    var ans = q.answer;
    var d = q.dividend;
    var set = {};
    var wrong = [];

    function add(v) {
      if (v === ans || v < 0 || v > 200 || set[v]) return;
      set[v] = true;
      wrong.push(v);
    }

    add(ans + 1);
    add(Math.max(0, ans - 1));
    add(ans + 2);
    add(Math.max(0, ans - 2));
    add(d);
    add(d - ans);
    add(ans * 2);
    if (ans > 2) add(ans + Math.floor(qrand() * 4) + 1);

    while (wrong.length < 6) {
      add(ans + Math.floor(qrand() * 9) - 4);
    }
    return wrong;
  }

  function comboMult() {
    if (combo < CFG.COMBO_STEP) return 1;
    return 1 + Math.floor(combo / CFG.COMBO_STEP);
  }

  function renderCombo() {
    var el = $('combo-badge');
    if (!el) return;
    if (comboMult() > 1) {
      el.textContent = '🔥 x' + comboMult();
      el.classList.add('on');
    } else {
      el.classList.remove('on');
    }
  }

  function setScore(n) {
    score = Math.max(0, n);
    $('score-value').textContent = score;
    var w = $('score-container');
    w.classList.add('pop');
    setTimeout(function () { w.classList.remove('pop'); }, 150);
  }

  function renderPlayer(K) {
    var chip = $('player-chip');
    if (!chip || !K || !K.student) return;
    var s = K.student;
    var st = K.stats;
    var av = s.photoUrl
      ? '<img src="' + s.photoUrl + '" alt="">'
      : '<div class="pc-init">' + ((s.displayName || '?')[0]) + '</div>';
    var best = st ? ' · <span class="pc-best">สถิติ ' + (st.personalBest || 0) + '</span>' : '';
    chip.innerHTML = av + '<span>' + (s.displayName || '') + best + '</span>';
    chip.style.display = 'flex';
  }

  function renderMyStats(K) {
    var box = $('my-stats');
    if (!box) return;
    var st = K && K.stats;
    if (st && (st.personalBest || st.playsCount)) {
      $('ms-best').textContent = st.personalBest || 0;
      $('ms-plays').textContent = st.playsCount || 0;
      box.style.display = 'flex';
    }
  }

  function renderLeaderboard(listId) {
    var el = $(listId);
    if (!el) return;
    var rows = KAMPAI.leaderboard || [];
    if (!rows.length) {
      el.innerHTML = '<li class="lb-loading">ยังไม่มีผู้เล่น — เป็นคนแรกสิ!</li>';
      return;
    }
    var medals = ['🥇', '🥈', '🥉'];
    el.innerHTML = rows.slice(0, 5).map(function (r, idx) {
      var av = r.photoUrl
        ? '<img class="lb-avatar" src="' + r.photoUrl + '" alt="">'
        : '<div class="lb-avatar-init">' + ((r.displayName || '?')[0]) + '</div>';
      return '<li class="' + (r.isMe ? 'is-me' : '') + '">' +
        '<span class="lb-rank">' + (medals[idx] || (idx + 1)) + '</span>' + av +
        '<div class="lb-info"><div class="lb-name">' + (r.displayName || '') + (r.isMe ? ' (คุณ)' : '') + '</div>' +
        '<div class="lb-sub">' + (r.personalBest || 0) + ' คะแนน</div></div></li>';
    }).join('');
  }

  function initLevelPicker() {
    var row = $('level-row');
    if (!row) return;
    row.innerHTML = '';
    Object.keys(CFG.LEVELS).forEach(function (key) {
      var lv = CFG.LEVELS[key];
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'lvl' + (key === selectedLevel ? ' sel' : '');
      btn.setAttribute('data-level', key);
      btn.innerHTML = lv.label + '<small>' + lv.grade + ' · ' + lv.min + '–' + lv.max + '</small>';
      btn.addEventListener('click', function () {
        selectedLevel = key;
        row.querySelectorAll('.lvl').forEach(function (b) { b.classList.remove('sel'); });
        btn.classList.add('sel');
      });
      row.appendChild(btn);
    });
  }

  function initTip() {
    var tips = DATA.TIPS || [];
    var tip = $('tip-box');
    if (tip && tips.length) tip.textContent = tips[Math.floor(Math.random() * tips.length)];
  }

  KAMPAI.onReady(function (K) {
    if (DATA.TITLE) $('game-title').textContent = DATA.TITLE;
    if (DATA.SUBTITLE) $('game-subtitle').textContent = DATA.SUBTITLE;
    renderPlayer(K);
    renderMyStats(K);
    renderLeaderboard('score-list');
    initLevelPicker();
    initTip();
  });

  function showScreen(id) {
    ['start', 'over'].forEach(function (s) {
      var el = $(s);
      if (el) el.classList.toggle('on', s === id);
    });
  }

  function stopTimers() {
    if (gameTimerId) { clearInterval(gameTimerId); gameTimerId = null; }
    if (qTimerId) { clearInterval(qTimerId); qTimerId = null; }
  }

  function updateQTimerBar() {
    var bar = $('timer-bar');
    var wrap = $('timer-wrap');
    if (!bar || !wrap) return;
    var pct = qTimeMax > 0 ? (qTimeLeft / qTimeMax) * 100 : 0;
    bar.style.width = Math.max(0, pct) + '%';
    bar.classList.toggle('warn', pct <= 30);
  }

  function tickQuestionTimer() {
    qTimeLeft -= 0.1;
    if (qTimeLeft <= 0) {
      qTimeLeft = 0;
      updateQTimerBar();
      onTimeUp();
      return;
    }
    updateQTimerBar();
  }

  function onTimeUp() {
    if (locked) return;
    locked = true;
    wrong++;
    totalAnswered++;
    combo = 0;
    renderCombo();
    KAMPAI.sound.timeUp();
    KAMPAI.sound.wrong();
    $('feedback').textContent = '⏱ หมดเวลา! คำตอบคือ ' + currentQ.answer;
    $('feedback').className = 'bad';
    disableAnswers();
    setTimeout(nextQuestion, 900);
  }

  function disableAnswers() {
    var btns = $('answers').querySelectorAll('.ans');
    btns.forEach(function (b) { b.classList.add('dim'); });
  }

  function nextQuestion() {
    if (gameMode === 'race' && gameTimeLeft <= 0) {
      endGame();
      return;
    }
    if (gameMode === 'practice' && totalAnswered >= (CFG.PRACTICE_QUESTIONS || 20)) {
      endGame();
      return;
    }
    locked = false;
    currentQ = createQuestion();
    questionStart = performance.now();
    qTimeMax = Math.max(
      CFG.QUESTION_TIME_MIN,
      CFG.QUESTION_TIME - totalAnswered * (CFG.QUESTION_TIME_RAMP || 0)
    );
    qTimeLeft = qTimeMax;

    $('question').innerHTML = currentQ.dividend + ' <span class="divisor">÷ 2</span> = ?';
    $('question').classList.remove('bump');
    void $('question').offsetWidth;
    $('question').classList.add('bump');
    $('feedback').textContent = '';
    $('feedback').className = '';
    $('round-badge').textContent = 'ข้อ ' + (totalAnswered + 1);

    var wrongPool = buildWrongAnswers(currentQ);
    var opts = [currentQ.answer];
    while (opts.length < 4 && wrongPool.length) {
      var pick = wrongPool.splice(Math.floor(qrand() * wrongPool.length), 1)[0];
      if (opts.indexOf(pick) === -1) opts.push(pick);
    }
    while (opts.length < 4) {
      var r = currentQ.answer + Math.floor(qrand() * 7) - 3;
      if (r >= 0 && opts.indexOf(r) === -1) opts.push(r);
    }
    opts.sort(function () { return qrand() - 0.5; });

    $('answers').innerHTML = opts.map(function (v) {
      return '<button type="button" class="ans" data-v="' + v + '">' + v + '</button>';
    }).join('');

    $('answers').querySelectorAll('.ans').forEach(function (btn) {
      btn.addEventListener('click', function () { answer(parseInt(btn.getAttribute('data-v'), 10), btn); });
    });

    updateQTimerBar();
    if (qTimerId) clearInterval(qTimerId);
    qTimerId = setInterval(tickQuestionTimer, 100);
  }

  function answer(v, btn) {
    if (locked || !currentQ) return;
    locked = true;
    if (qTimerId) { clearInterval(qTimerId); qTimerId = null; }

    var elapsed = (performance.now() - questionStart) / 1000;
    var isCorrect = v === currentQ.answer;
    totalAnswered++;

    if (isCorrect) {
      correct++;
      combo++;
      var gain = CFG.POINTS_CORRECT * comboMult();
      if (elapsed <= (CFG.QUESTION_TIME * (CFG.FAST_THRESHOLD || 0.45))) {
        gain += CFG.FAST_BONUS || 5;
        $('feedback').textContent = '⚡ เร็วมาก! +' + gain;
      } else {
        $('feedback').textContent = pickPhrase(DATA.CORRECT_PHRASES) + ' +' + gain;
      }
      $('feedback').className = 'good';
      btn.classList.add('correct');
      setScore(score + gain);
      renderCombo();
      KAMPAI.sound.correct();
      KAMPAI.sound.fxFlash(true);
      KAMPAI.sound.speak(currentQ.dividend + ' หาร สอง เท่ากับ ' + currentQ.answer, 'th-TH');
      if (vs) vs.report(score, { correct: correct });
      disableAnswers();
      setTimeout(nextQuestion, 450);
    } else {
      wrong++;
      combo = 0;
      renderCombo();
      var loss = CFG.POINTS_WRONG || 0;
      setScore(score + loss);
      $('feedback').textContent = pickPhrase(DATA.WRONG_PHRASES) + ' (คำตอบ ' + currentQ.answer + ')';
      $('feedback').className = 'bad';
      btn.classList.add('wrong');
      $('play').classList.remove('shake');
      void $('play').offsetWidth;
      $('play').classList.add('shake');
      KAMPAI.sound.wrong();
      KAMPAI.sound.fxFlash(false);
      if (vs) vs.report(score, { correct: correct });
      disableAnswers();
      highlightCorrect();
      setTimeout(nextQuestion, 750);
    }
  }

  function highlightCorrect() {
    $('answers').querySelectorAll('.ans').forEach(function (b) {
      if (parseInt(b.getAttribute('data-v'), 10) === currentQ.answer) b.classList.add('correct');
    });
  }

  function startRound(mode) {
    gameMode = mode || 'race';
    score = 0;
    combo = 0;
    correct = 0;
    wrong = 0;
    totalAnswered = 0;
    locked = false;
    gameTimeLeft = CFG.GAME_DURATION;

    showScreen('');
    $('hud').classList.add('on');
    $('play').classList.add('on');
    $('timer-wrap').classList.toggle('on', gameMode === 'race' || gameMode === 'versus');
    setScore(0);
    renderCombo();

    KAMPAI.beginRound();
    KAMPAI.sound.unlock();
    KAMPAI.sound.bgmStart();

    stopTimers();
    if (gameMode === 'race' || gameMode === 'versus') {
      gameTimerId = setInterval(function () {
        gameTimeLeft--;
        if (gameTimeLeft <= 0) {
          gameTimeLeft = 0;
          endGame();
        }
      }, 1000);
    }

    nextQuestion();
  }

  function starCount(s) {
    var th = CFG.STAR_THRESHOLDS || [80, 180, 300];
    if (s >= th[2]) return 3;
    if (s >= th[1]) return 2;
    if (s >= th[0]) return 1;
    return 0;
  }

  function endGame() {
    locked = true;
    stopTimers();
    $('hud').classList.remove('on');
    $('play').classList.remove('on');
    KAMPAI.sound.bgmStop();
    KAMPAI.sound.gameOver();

    if (versusActive && vs && vs.finish(score, { correct: correct })) {
      versusActive = false;
      return;
    }

    var accuracy = totalAnswered > 0 ? Math.round((correct / totalAnswered) * 100) : 0;
    var stars = starCount(score);
    var starStr = '☆☆☆'.split('').map(function (c, i) { return i < stars ? '★' : '☆'; }).join('');

    $('go-stars').textContent = starStr;
    $('final-score').textContent = score + ' คะแนน';
    $('final-detail').textContent =
      'ระดับ ' + levelCfg(selectedLevel).label + ' · ตอบ ' + totalAnswered + ' ข้อ · ถูก ' + correct + ' ผิด ' + wrong;
    $('stat-correct').textContent = correct;
    $('stat-wrong').textContent = wrong;
    $('stat-accuracy').textContent = accuracy + '%';

    renderLeaderboard('score-list-go');
    showScreen('over');

    if (gameMode === 'race') {
      KAMPAI.submitScore(score, {
        mode: 'race',
        level: selectedLevel,
        correct: correct,
        wrong: wrong,
        accuracy: accuracy
      });
    }
  }

  $('btn-start').addEventListener('click', function () {
    qrand = Math.random;
    versusActive = false;
    startRound('race');
  });

  $('btn-practice').addEventListener('click', function () {
    qrand = Math.random;
    versusActive = false;
    startRound('practice');
  });

  $('btn-versus').addEventListener('click', function () {
    if (vs) vs.openMenu();
  });

  $('btn-replay').addEventListener('click', function () {
    versusActive = false;
    if (vs) vs.leave();
    showScreen('start');
  });

  $('btn-home').addEventListener('click', function () {
    stopTimers();
    if (vs) vs.leave();
    KAMPAI.goHome();
  });

  $('btn-quit').addEventListener('click', function () {
    endGame();
  });

  window.addEventListener('beforeunload', stopTimers);
})();
