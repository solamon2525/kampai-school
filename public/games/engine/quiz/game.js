/* Quiz Blueprint Engine — โหลดด่านจาก KAMPAI.blueprint / postMessage */
(function () {
  'use strict';

  var K = window.KAMPAI;
  var GAME_SLUG = 'quiz-builder';

  // ─── DOM refs ───────────────────────────────────────────────────────
  var app = document.getElementById('app');
  var hud = document.getElementById('hud');
  var progress = document.getElementById('progress');
  var progressBar = document.getElementById('progressBar');
  var scoreEl = document.getElementById('scoreVal');
  var timeEl = document.getElementById('timeVal');
  var timePill = document.getElementById('timePill');
  var qIdxPill = document.getElementById('qIdxPill');
  var qIdxVal = document.getElementById('qIdxVal');

  var startScreen = document.getElementById('startScreen');
  var startTitle = document.getElementById('startTitle');
  var startSubtitle = document.getElementById('startSubtitle');
  var qScreen = document.getElementById('qScreen');
  var qPrompt = document.getElementById('qPrompt');
  var qHint = document.getElementById('qHint');
  var optionsEl = document.getElementById('options');
  var endScreen = document.getElementById('endScreen');
  var finalScoreEl = document.getElementById('finalScore');
  var endVerdict = document.getElementById('endVerdict');
  var endStats = document.getElementById('endStats');

  // ─── default blueprint (ใช้ตอนทดสอบเดี่ยว ไม่มี wrapper) ──────────────
  var DEFAULT_BP = {
    version: 1, engine: 'quiz',
    meta: { title: 'แบบทดสอบ', subject: 'thai' },
    rules: { timeLimitSec: 15, pointsPerCorrect: 10, passingScore: 50, shuffleOptions: true },
    theme: { bgPreset: 'aurora', accentColor: '#6366f1' },
    questions: [
      { id: 'd1', prompt: '2 + 3 = ?', options: ['4', '5', '6'], answer: '5' },
      { id: 'd2', prompt: 'สระในคำว่า ปู คือ?', options: ['ู', 'า', 'ิ'], answer: 'ู', hint: 'ป + ู' }
    ]
  };

  // ─── state ──────────────────────────────────────────────────────────
  var bp, order, qIndex, score, correctCount, total, timeLeft, playing, ended, locked;
  var timerHandle = null;

  function getBlueprint() {
    if (K && K.blueprint) return K.blueprint;
    if (K && K.gameData && K.gameData.blueprint) return K.gameData.blueprint;
    return DEFAULT_BP;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function applyTheme() {
    var preset = (bp.theme && bp.theme.bgPreset) || 'aurora';
    app.className = 'bg-' + preset;
  }

  function resetRun() {
    bp = getBlueprint();
    applyTheme();
    var qs = (bp.questions || []).filter(function (q) { return q && q.prompt; });
    order = shuffleOptionsPerQuestion(qs);
    qIndex = 0;
    score = 0;
    correctCount = 0;
    total = order.length;
    timeLeft = (bp.rules && bp.rules.timeLimitSec) || 0;
    playing = false;
    ended = false;
    locked = false;

    startTitle.textContent = '📝 ' + ((bp.meta && bp.meta.title) || 'แบบทดสอบ');
    var subtitleParts = [];
    if (bp.meta && bp.meta.grade) subtitleParts.push(bp.meta.grade);
    subtitleParts.push('ทั้งหมด ' + total + ' ข้อ');
    if (timeLeft > 0) subtitleParts.push('เวลาข้อละ ' + timeLeft + ' วินาที');
    startSubtitle.textContent = subtitleParts.join(' · ');
  }

  // pre-shuffle options for each question once per run (if enabled)
  function shuffleOptionsPerQuestion(qs) {
    var enabled = !(bp.rules && bp.rules.shuffleOptions === false);
    return qs.map(function (q) {
      var opts = enabled ? shuffle((q.options || []).slice()) : (q.options || []).slice();
      return { id: q.id, prompt: q.prompt, options: opts, answer: q.answer, hint: q.hint };
    });
  }

  function show(el) { el.classList.remove('hidden'); }
  function hide(el) { el.classList.add('hidden'); }

  function startGame() {
    resetRun();
    hide(startScreen);
    hide(endScreen);
    show(qScreen);
    hud.classList.add('on');
    progress.classList.add('on');
    if (timeLeft > 0) timePill.style.display = '';
    else timePill.style.display = 'none';
    qIdxPill.style.display = '';
    playing = true;
    renderQuestion();
    if (K && K.sound) {
      K.sound.mountToggles();
      if (K.sound.defaultBgm) K.sound.defaultBgm('focus');
      else if (K.sound.bgmStart) K.sound.bgmStart();
    }
    if (K && K.controls && K.controls.mount) K.controls.mount({});
  }

  function renderQuestion() {
    var q = order[qIndex];
    if (!q) { finishGame(); return; }
    locked = false;
    qIdxVal.textContent = (qIndex + 1) + '/' + total;
    qPrompt.textContent = q.prompt || '?';
    qHint.textContent = '';
    updateProgress();
    updateHud();

    optionsEl.innerHTML = '';
    var letters = ['ก', 'ข', 'ค', 'ง', 'จ'];
    q.options.forEach(function (opt, i) {
      var btn = document.createElement('button');
      btn.className = 'opt-btn';
      btn.innerHTML = '<span class="opt-letter">' + (letters[i] || (i + 1)) + '</span><span>' + escapeHtml(opt) + '</span>';
      btn.addEventListener('click', function () { answerOption(opt, btn); });
      optionsEl.appendChild(btn);
    });

    // start per-question timer
    if (timeLeft > 0) {
      timeEl.textContent = String(timeLeft);
      clearInterval(timerHandle);
      timerHandle = setInterval(function () {
        if (!playing || ended || locked) return;
        timeLeft -= 1;
        timeEl.textContent = String(Math.max(0, timeLeft));
        if (timeLeft <= 0) {
          // timeout → ถือว่าผิด เดินข้อถัดไป
          lockOptions();
          markTimeout();
          if (K && K.sound) K.sound.wrong();
          setTimeout(nextQuestion, 900);
        }
      }, 1000);
    }
  }

  function lockOptions() {
    locked = true;
    clearInterval(timerHandle);
    var btns = optionsEl.querySelectorAll('.opt-btn');
    for (var i = 0; i < btns.length; i++) btns[i].classList.add('disabled');
  }

  function answerOption(selected, btn) {
    if (locked || ended || !playing) return;
    lockOptions();
    var q = order[qIndex];
    var correct = selected === q.answer;

    // mark correct/wrong on all buttons (show เฉลย)
    var btns = optionsEl.querySelectorAll('.opt-btn');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var span = b.querySelector('span:last-child');
      var val = span ? span.textContent : '';
      if (val === q.answer) b.classList.add('correct');
      else if (b === btn && !correct) b.classList.add('wrong');
    }

    if (correct) {
      var pts = (bp.rules && bp.rules.pointsPerCorrect) || 10;
      score += pts;
      correctCount += 1;
      if (K && K.sound) K.sound.correct();
    } else {
      if (K && K.sound) K.sound.wrong();
      if (q.hint) qHint.textContent = '💡 ' + q.hint;
    }
    updateHud();
    setTimeout(nextQuestion, 950);
  }

  function markTimeout() {
    var q = order[qIndex];
    var btns = optionsEl.querySelectorAll('.opt-btn');
    for (var i = 0; i < btns.length; i++) {
      var b = btns[i];
      var span = b.querySelector('span:last-child');
      var val = span ? span.textContent : '';
      if (val === q.answer) b.classList.add('correct');
    }
    if (q.hint) qHint.textContent = '⏰ หมดเวลา · 💡 ' + q.hint;
  }

  function nextQuestion() {
    if (ended) return;
    timeLeft = (bp.rules && bp.rules.timeLimitSec) || 0;
    qIndex += 1;
    if (qIndex >= total) { finishGame(); return; }
    renderQuestion();
  }

  function updateHud() {
    scoreEl.textContent = String(score);
  }

  function updateProgress() {
    var pct = total > 0 ? (qIndex / total) * 100 : 0;
    progressBar.style.width = pct + '%';
  }

  function finishGame() {
    if (ended) return;
    ended = true;
    playing = false;
    clearInterval(timerHandle);
    hud.classList.remove('on');
    progress.classList.remove('on');
    hide(qScreen);

    var passScore = (bp.rules && bp.rules.passingScore) || 0;
    var passed = score >= passScore;
    var pct = total > 0 ? Math.round((correctCount / total) * 100) : 0;

    endVerdict.textContent = passed ? '🎉 ผ่านเกณฑ์!' : '💪 ลองใหม่อีกครั้ง';
    finalScoreEl.textContent = String(score);
    endStats.innerHTML = 'ถูก <b>' + correctCount + '/' + total + '</b> · คิดเป็น <b>' + pct + '%</b>'
      + (passScore > 0 ? '<br>เกณฑ์ผ่าน ' + passScore + ' คะแนน' : '');

    show(endScreen);

    if (K) {
      K.setSlug(GAME_SLUG);
      // eslint-disable-next-line no-undef
      KAMPAI.submitScore(score, { mode: 'normal', correct: correctCount, total: total });
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ─── events ─────────────────────────────────────────────────────────
  document.getElementById('btnStart').addEventListener('click', startGame);
  document.getElementById('btnRetry').addEventListener('click', function () {
    hide(endScreen);
    show(startScreen);
    hud.classList.remove('on');
    progress.classList.remove('on');
  });

  // รับ blueprint จาก editor preview (เหมือน platformer)
  window.addEventListener('message', function (e) {
    var d = e && e.data;
    if (!d || d.type !== 'blueprintPreview' || !d.blueprint) return;
    if (K) K.blueprint = d.blueprint;
    if (playing) {
      playing = false;
      clearInterval(timerHandle);
      hud.classList.remove('on');
      progress.classList.remove('on');
    }
    hide(qScreen);
    hide(endScreen);
    show(startScreen);
    resetRun();
  });

  // ─── boot ───────────────────────────────────────────────────────────
  K.setSlug(GAME_SLUG);
  K.onReady(function () {
    resetRun();
  });
})();
