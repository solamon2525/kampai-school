/* Matching Blueprint Engine — โหลดด่านจาก KAMPAI.blueprint / postMessage */
(function () {
  'use strict';

  var K = window.KAMPAI;
  var GAME_SLUG = 'matching-builder';

  var app = document.getElementById('app');
  var hud = document.getElementById('hud');
  var scoreEl = document.getElementById('scoreVal');
  var doneEl = document.getElementById('doneVal');
  var timeEl = document.getElementById('timeVal');
  var timePill = document.getElementById('timePill');

  var startScreen = document.getElementById('startScreen');
  var startTitle = document.getElementById('startTitle');
  var startSubtitle = document.getElementById('startSubtitle');
  var playScreen = document.getElementById('playScreen');
  var board = document.getElementById('board');
  var endScreen = document.getElementById('endScreen');
  var finalScoreEl = document.getElementById('finalScore');
  var endVerdict = document.getElementById('endVerdict');
  var endStats = document.getElementById('endStats');

  var DEFAULT_BP = {
    version: 1, engine: 'matching',
    meta: { title: 'จับคู่คำ', subject: 'thai' },
    rules: { timeLimitSec: 0, pointsPerCorrect: 10, mistakesAllowed: 3, shuffleRight: true },
    theme: { bgPreset: 'ocean', accentColor: '#0ea5e9' },
    pairs: [
      { id: 'd1', left: 'ดำ', right: 'ขาว' },
      { id: 'd2', left: 'สูง', right: 'ต่ำ' },
      { id: 'd3', left: 'ร้อน', right: 'เย็น' }
    ]
  };

  // state
  var bp, lefts, rights, selectedLeft, matched, score, mistakes, total, timeLeft, playing, ended;
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
    var preset = (bp.theme && bp.theme.bgPreset) || 'ocean';
    app.className = 'bg-' + preset;
  }

  function resetRun() {
    bp = getBlueprint();
    applyTheme();
    lefts = (bp.pairs || []).slice();
    rights = (bp.rules && bp.rules.shuffleRight === false)
      ? lefts.slice()
      : shuffle(lefts.slice());
    selectedLeft = null;
    matched = new Set();
    score = 0;
    mistakes = 0;
    total = lefts.length;
    timeLeft = (bp.rules && bp.rules.timeLimitSec) || 0;
    playing = false;
    ended = false;

    startTitle.textContent = '🔗 ' + ((bp.meta && bp.meta.title) || 'จับคู่คำ');
    var parts = [];
    if (bp.meta && bp.meta.grade) parts.push(bp.meta.grade);
    parts.push('ทั้งหมด ' + total + ' คู่');
    if (timeLeft > 0) parts.push('เวลา ' + timeLeft + ' วินาที');
    startSubtitle.textContent = parts.join(' · ');
  }

  function show(el) { el.classList.remove('hidden'); }
  function hide(el) { el.classList.add('hidden'); }

  function startGame() {
    resetRun();
    hide(startScreen);
    hide(endScreen);
    show(playScreen);
    hud.classList.add('on');
    if (timeLeft > 0) timePill.style.display = '';
    else timePill.style.display = 'none';
    playing = true;
    renderBoard();
    updateHud();
    if (K && K.sound) {
      K.sound.mountToggles();
      if (K.sound.defaultBgm) K.sound.defaultBgm('focus');
      else if (K.sound.bgmStart) K.sound.bgmStart();
    }
    if (timeLeft > 0) {
      clearInterval(timerHandle);
      timerHandle = setInterval(function () {
        if (!playing || ended) return;
        timeLeft -= 1;
        timeEl.textContent = String(Math.max(0, timeLeft));
        if (timeLeft <= 0) finishGame();
      }, 1000);
    }
  }

  function renderBoard() {
    board.innerHTML = '';
    // left column (ตามลำดับ pairs)
    lefts.forEach(function (pair) {
      var tile = makeTile(pair.left, 'left', pair.id);
      board.appendChild(tile);
    });
    // right column (สุ่ม)
    rights.forEach(function (pair) {
      var tile = makeTile(pair.right, 'right', pair.id);
      board.appendChild(tile);
    });
  }

  function makeTile(text, side, pairId) {
    var tile = document.createElement('button');
    tile.className = 'tile';
    tile.textContent = text;
    tile.dataset.side = side;
    tile.dataset.pairId = pairId;
    if (matched.has(pairId)) tile.classList.add('dead');
    tile.addEventListener('click', function () { onTile(tile); });
    return tile;
  }

  function onTile(tile) {
    if (!playing || ended || tile.classList.contains('dead')) return;
    var side = tile.dataset.side;

    if (side === 'left') {
      // เลือกฝั่งซ้ายใหม่ → สละเดิม
      if (selectedLeft) selectedLeft.classList.remove('selected');
      selectedLeft = tile;
      tile.classList.add('selected');
      return;
    }

    // side === right
    if (!selectedLeft) {
      // ยังไม่ได้เลือกซ้าย → แฟลชเตือน
      flash(tile, 'wrong');
      return;
    }

    var leftPair = selectedLeft.dataset.pairId;
    var rightPair = tile.dataset.pairId;
    if (leftPair === rightPair) {
      // ถูก
      matched.add(leftPair);
      score += (bp.rules && bp.rules.pointsPerCorrect) || 10;
      selectedLeft.classList.remove('selected');
      selectedLeft.classList.add('correct');
      tile.classList.add('correct');
      if (K && K.sound) K.sound.correct();
      selectedLeft = null;
      updateHud();
      if (matched.size === total) finishGame();
    } else {
      // ผิด
      mistakes += 1;
      flash(selectedLeft, 'wrong');
      flash(tile, 'wrong');
      if (K && K.sound) K.sound.wrong();
      var allowed = (bp.rules && bp.rules.mistakesAllowed) || Infinity;
      if (mistakes > allowed) {
        // เกินจำนวนผิดที่ยอม → จบเกม
        finishGame();
        return;
      }
      selectedLeft.classList.remove('selected');
      selectedLeft = null;
      updateHud();
    }
  }

  function flash(el, cls) {
    el.classList.add(cls);
    setTimeout(function () { el.classList.remove(cls); }, 320);
  }

  function updateHud() {
    scoreEl.textContent = String(score);
    doneEl.textContent = matched.size + '/' + total;
    if (timeLeft > 0) timeEl.textContent = String(timeLeft);
  }

  function finishGame() {
    if (ended) return;
    ended = true;
    playing = false;
    clearInterval(timerHandle);
    hud.classList.remove('on');
    hide(playScreen);

    var correct = matched.size;
    var pct = total > 0 ? Math.round((correct / total) * 100) : 0;
    endVerdict.textContent = correct === total ? '🎉 ครบทุกคู่!' : '💪 ลองใหม่อีกครั้ง';
    finalScoreEl.textContent = String(score);
    endStats.innerHTML = 'จับคู่ถูก <b>' + correct + '/' + total + '</b> · ผิด <b>' + mistakes + '</b> ครั้ง'
      + '<br>คิดเป็น <b>' + pct + '%</b>';
    show(endScreen);

    if (K) {
      K.setSlug(GAME_SLUG);
      // eslint-disable-next-line no-undef
      KAMPAI.submitScore(score, { mode: 'normal', correct: correct, total: total, mistakes: mistakes });
    }
  }

  // events
  document.getElementById('btnStart').addEventListener('click', startGame);
  document.getElementById('btnRetry').addEventListener('click', function () {
    hide(endScreen);
    show(startScreen);
    hud.classList.remove('on');
  });

  window.addEventListener('message', function (e) {
    var d = e && e.data;
    if (!d || d.type !== 'blueprintPreview' || !d.blueprint) return;
    if (K) K.blueprint = d.blueprint;
    if (playing) {
      playing = false;
      clearInterval(timerHandle);
      hud.classList.remove('on');
    }
    hide(playScreen);
    hide(endScreen);
    show(startScreen);
    resetRun();
  });

  K.setSlug(GAME_SLUG);
  K.onReady(function () { resetRun(); });
})();
