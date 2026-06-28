/* Platformer 2D Blueprint Engine — โหลดด่านจาก KAMPAI.blueprint */
(function () {
  'use strict';

  var K = window.KAMPAI;
  const GAME_SLUG = 'platformer-blueprint';
  var vs = null;
  var W = 1280, H = 720;
  var GRAV = 0.42, FRICTION = 0.82, RUN = 4.5, JUMP = -9.5;

  var canvas = document.getElementById('gameCanvas');
  var ctx = canvas.getContext('2d');
  var hud = document.getElementById('hud');
  var startModal = document.getElementById('startModal');
  var endModal = document.getElementById('endModal');
  var scoreEl = document.getElementById('scoreVal');
  var timeEl = document.getElementById('timeVal');
  var lifeEl = document.getElementById('lifeVal');
  var finalScoreEl = document.getElementById('finalScore');

  var DEFAULT_BP = {
    version: 1, engine: 'platformer-2d',
    world: { width: W, height: H, groundY: 620 },
    rules: { lives: 5, timeLimitSec: 90, starPoints: 10 },
    spawn: { x: 120, y: 524 },
    platforms: [
      { id: 'ground', x: 0, y: 620, w: 1280, h: 24 },
      { id: 'p1', x: 280, y: 480, w: 180, h: 24 },
      { id: 'p2', x: 520, y: 400, w: 160, h: 24 },
      { id: 'p3', x: 760, y: 320, w: 200, h: 24 }
    ],
    collectibles: [
      { id: 's1', x: 340, y: 440, kind: 'star' },
      { id: 's2', x: 580, y: 360, kind: 'star' },
      { id: 's3', x: 820, y: 280, kind: 'star' }
    ],
    questions: []
  };

  var bp, playing, score, lives, timeLeft, camX, player, stars, animT, ended;
  var qByPlat = {}, answeredQs = {}, bubbles = [], activePlatId = null;

  function rebuildQuestionMap() {
    qByPlat = {};
    (bp.questions || []).forEach(function (q) { qByPlat[q.platformId] = q; });
    answeredQs = {};
    bubbles = [];
    activePlatId = null;
  }

  function getBlueprint() {
    if (K && K.blueprint) return K.blueprint;
    if (K && K.gameData && K.gameData.blueprint) return K.gameData.blueprint;
    return DEFAULT_BP;
  }

  function resetRun() {
    bp = getBlueprint();
    score = 0;
    lives = (bp.rules && bp.rules.lives) || 5;
    timeLeft = (bp.rules && bp.rules.timeLimitSec) || 90;
    camX = 0;
    animT = 0;
    ended = false;
    stars = (bp.collectibles || []).map(function (c) {
      return { id: c.id, x: c.x, y: c.y, kind: c.kind || 'star', got: false };
    });
    player = {
      x: bp.spawn.x, y: bp.spawn.y, w: 48, h: 64,
      vx: 0, vy: 0, onGround: false, facing: 1, inv: 0
    };
    rebuildQuestionMap();
    updateHud();
  }

  function updateHud() {
    scoreEl.textContent = String(score);
    timeEl.textContent = String(Math.max(0, Math.ceil(timeLeft)));
    lifeEl.textContent = String(lives);
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function platformAt(x, y, w, h, vy) {
    var plats = bp.platforms || [];
    var best = null, bestD = Infinity;
    for (var i = 0; i < plats.length; i++) {
      var p = plats[i];
      var box = { x: x, y: y, w: w, h: h };
      var plat = { x: p.x, y: p.y, w: p.w, h: p.h };
      if (!rectsOverlap(box, plat)) continue;
      if (vy >= 0 && y + h - vy <= p.y + 4) {
        var d = p.y - (y + h);
        if (d >= 0 && d < bestD) { bestD = d; best = p; }
      }
    }
    return best;
  }

  function spawnQuestionBubbles(plat, q) {
    activePlatId = plat.id;
    player.vx = 0;
    var opts = (q.options || []).slice(0, 3);
    bubbles = opts.map(function (opt, i) {
      return {
        x: plat.x + plat.w / 2 + (i - 1) * 72,
        y: plat.y - 48,
        text: opt,
        correct: opt === q.answer,
        r: 26
      };
    });
    var el = document.getElementById('qPrompt');
    if (el) { el.textContent = q.prompt || '?'; el.style.display = 'block'; }
  }

  function clearQuestionUI() {
    bubbles = [];
    activePlatId = null;
    var el = document.getElementById('qPrompt');
    if (el) el.style.display = 'none';
  }

  function answerBubble(b) {
    if (b.correct) {
      score += (bp.rules && bp.rules.starPoints) || 10;
      if (K && K.sound) K.sound.correct();
      if (vs && vs.report) vs.report(score, { correct: score });
    } else {
      lives -= 1;
      if (K && K.sound) K.sound.wrong();
      if (lives <= 0) { clearQuestionUI(); finishGame(); return; }
    }
    if (activePlatId) answeredQs[activePlatId] = true;
    clearQuestionUI();
    updateHud();
  }

  function checkPlatformQuestion(plat) {
    if (!plat || bubbles.length || !qByPlat[plat.id] || answeredQs[plat.id]) return;
    if (player.onGround && Math.abs(player.vx) < 0.5) {
      spawnQuestionBubbles(plat, qByPlat[plat.id]);
    }
  }

  function updatePlayer(dt) {
    if (bubbles.length) return;
    var left = !!(K && K.input && K.input.left);
    var right = !!(K && K.input && K.input.right);
    var jump = !!(K && K.input && K.input.jump);

    if (left) { player.vx = -RUN; player.facing = -1; }
    else if (right) { player.vx = RUN; player.facing = 1; }
    else { player.vx *= FRICTION; if (Math.abs(player.vx) < 0.05) player.vx = 0; }

    if (jump && player.onGround) player.vy = JUMP;

    player.vy += GRAV;
    player.x += player.vx;
    player.y += player.vy;
    player.onGround = false;

    var plat = platformAt(player.x, player.y, player.w, player.h, player.vy);
    if (plat) {
      player.y = plat.y - player.h;
      player.vy = 0;
      player.onGround = true;
      checkPlatformQuestion(plat);
    }

    if (player.x < 0) player.x = 0;
    var maxW = (bp.world && bp.world.width) || W;
    if (player.x + player.w > maxW) player.x = maxW - player.w;

    if (player.y > H + 80 && player.inv <= 0) {
      lives -= 1;
      player.x = bp.spawn.x;
      player.y = bp.spawn.y;
      player.vx = 0;
      player.vy = 0;
      player.inv = 90;
      if (K && K.sound) K.sound.wrong();
      if (lives <= 0) finishGame();
    }
    if (player.inv > 0) player.inv -= 1;

    for (var si = 0; si < stars.length; si++) {
      var s = stars[si];
      if (s.got) continue;
      if (Math.hypot(player.x + player.w / 2 - s.x, player.y + player.h / 2 - s.y) < 36) {
        s.got = true;
        score += (bp.rules && bp.rules.starPoints) || 10;
        if (K && K.sound) K.sound.correct();
        if (vs && vs.report) vs.report(score, { correct: score });
      }
    }
  }

  function finishGame() {
    if (ended) return;
    ended = true;
    playing = false;
    hud.classList.remove('on');
    finalScoreEl.textContent = String(score);
    if (vs && vs.finish && vs.finish(score, { correct: score })) return;
    endModal.classList.remove('off');
    if (K) {
      K.setSlug(GAME_SLUG);
      KAMPAI.submitScore(score, { mode: 'normal', correct: score });
    }
  }

  function tick(dt) {
    if (!playing || ended) return;
    timeLeft -= dt;
    if (timeLeft <= 0) { timeLeft = 0; finishGame(); return; }
    updatePlayer(dt);
    var targetCam = player.x - W * 0.35;
    var maxCam = ((bp.world && bp.world.width) || W) - W;
    camX += (Math.max(0, Math.min(maxCam, targetCam)) - camX) * 0.12;
    animT += dt * 60;
    updateHud();
    if (stars.every(function (s) { return s.got; })) finishGame();
  }

  function drawPlatform(p) {
    ctx.fillStyle = p.id === 'ground' ? '#78716c' : '#b45309';
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(p.x, p.y, p.w, 4);
  }

  function drawPlayer() {
    if (player.inv > 0 && Math.floor(player.inv / 6) % 2) return;
    if (K && K.character && K.character.sheetUrl) {
      var frame = K.pickCharacterFrame ? K.pickCharacterFrame({
        vx: player.vx, vy: player.vy, onGround: player.onGround, facing: player.facing
      }) : 0;
      var img = K._charImg;
      if (!img) {
        img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = K.character.sheetUrl;
        K._charImg = img;
      }
      if (img.complete && img.naturalWidth) {
        var fw = K.character.fw || 128;
        var fh = K.character.fh || 128;
        ctx.save();
        if (player.facing < 0) {
          ctx.translate(player.x + player.w, player.y);
          ctx.scale(-1, 1);
          ctx.drawImage(img, frame * fw, 0, fw, fh, 0, 0, player.w, player.h);
        } else {
          ctx.drawImage(img, frame * fw, 0, fw, fh, player.x, player.y, player.w, player.h);
        }
        ctx.restore();
        return;
      }
    }
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x + (player.facing > 0 ? 28 : 8), player.y + 12, 8, 8);
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.save();
    ctx.translate(-camX, 0);
    var plats = bp.platforms || [];
    for (var i = 0; i < plats.length; i++) drawPlatform(plats[i]);
    for (var j = 0; j < stars.length; j++) {
      var s = stars[j];
      if (s.got) continue;
      ctx.font = '32px serif';
      ctx.fillText('⭐', s.x - 16, s.y + 10 + Math.sin(animT * 0.08 + j) * 4);
    }
    bubbles.forEach(function (b) {
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fillStyle = '#bae6fd';
      ctx.fill();
      ctx.strokeStyle = '#0369a1';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#0f172a';
      ctx.font = 'bold 20px Kanit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.text, b.x, b.y);
    });
    drawPlayer();
    ctx.restore();
  }

  var last = performance.now();
  function loop(now) {
    var dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    tick(dt);
    if (playing) render();
    requestAnimationFrame(loop);
  }

  function startGame() {
    resetRun();
    startModal.classList.add('off');
    endModal.classList.add('off');
    hud.classList.add('on');
    playing = true;
    if (K && K.sound) {
      K.sound.mountToggles();
      if (K.sound.defaultBgm) K.sound.defaultBgm('adventure');
      else if (K.sound.bgmStart) K.sound.bgmStart();
    }
    if (K && K.controls && K.controls.mount) {
      K.controls.mount({ dpad: true, jump: true });
    }
    if (K && K.loadCharacterSheets) K.loadCharacterSheets();
  }

  document.getElementById('btnStart').addEventListener('click', startGame);
  document.getElementById('btnVersus').addEventListener('click', function () {
    if (vs && vs.openMenu) vs.openMenu();
  });
  document.getElementById('btnRetry').addEventListener('click', function () {
    endModal.classList.add('off');
    startModal.classList.remove('off');
  });

  document.addEventListener('keydown', function (e) {
    if (!K || !K.input) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') K.input.left = true;
    if (e.key === 'ArrowRight' || e.key === 'd') K.input.right = true;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') K.input.jump = true;
  });
  document.addEventListener('keyup', function (e) {
    if (!K || !K.input) return;
    if (e.key === 'ArrowLeft' || e.key === 'a') K.input.left = false;
    if (e.key === 'ArrowRight' || e.key === 'd') K.input.right = false;
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w') K.input.jump = false;
  });

  K.setSlug(GAME_SLUG);
  if (window.KampaiVersus) {
    vs = KampaiVersus.create({
      duration: 90,
      title: 'Platformer Blueprint',
      rankBy: 'score',
      onPlay: function () { startGame(); },
      onEnd: function () { finishGame(); },
    });
  }
  canvas.addEventListener('click', function (e) {
    if (!bubbles.length || !playing) return;
    var rect = canvas.getBoundingClientRect();
    var sx = W / rect.width;
    var sy = H / rect.height;
    var wx = (e.clientX - rect.left) * sx + camX;
    var wy = (e.clientY - rect.top) * sy;
    for (var i = 0; i < bubbles.length; i++) {
      var b = bubbles[i];
      if (Math.hypot(wx - b.x, wy - b.y) < b.r + 8) { answerBubble(b); break; }
    }
  });

  window.addEventListener('message', function (e) {
    var d = e && e.data;
    if (!d || d.type !== 'blueprintPreview' || !d.blueprint) return;
    if (K) K.blueprint = d.blueprint;
    if (playing) { playing = false; hud.classList.remove('on'); }
    resetRun();
  });

  K.onReady(function () {
    resetRun();
    requestAnimationFrame(loop);
  });
})();
