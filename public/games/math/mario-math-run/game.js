/**
 * Mario Math Run — Game Logic Module
 * Single-player and 2-player same-screen Mario platformer math runner
 */
(function () {
  'use strict';

  var GAME_SLUG = window.GAME_CONFIG ? window.GAME_CONFIG.SLUG : 'mario-math-run';
  if (window.KAMPAI && window.KAMPAI.setSlug) {
    window.KAMPAI.setSlug(GAME_SLUG);
  }

  // DOM Elements
  var canvas = document.getElementById('game-canvas');
  var ctx = canvas ? canvas.getContext('2d') : null;
  var blocker = document.getElementById('blocker');
  var gameoverScreen = document.getElementById('gameover-screen');
  var hudOverlay = document.getElementById('hud-overlay');
  var questionBanner = document.getElementById('question-banner');
  var qTextDisplay = document.getElementById('q-text-display');
  var scoreVal = document.getElementById('score-val');
  var timerVal = document.getElementById('timer-val');
  var livesVal = document.getElementById('lives-val');
  var finalScoreEl = document.getElementById('final-score');
  var goSummaryEl = document.getElementById('go-summary');

  var msBestEl = document.getElementById('ms-best');
  var msPlaysEl = document.getElementById('ms-plays');
  var scoreListEl = document.getElementById('score-list');
  var scoreListGoEl = document.getElementById('score-list-gameover');

  var touchControls = document.getElementById('touch-controls');
  var p2TouchControls = document.getElementById('p2-touch-controls');

  // Selected Math Operation
  var currentOp = 'add';

  // Game state
  var gameState = 'menu'; // 'menu' | 'playing' | 'gameover'
  var gameMode = 'solo';  // 'solo' | 'same-screen' | 'versus'
  var isSingleMode = true;

  var timer = 60;
  var timerInterval = null;
  var currentScore = 0;
  var currentCorrect = 0;
  var lives = 3;
  var qRand = Math.random;

  var currentQuestion = null;
  var choiceBlocks = []; // { x, y, width, height, value, isCorrect, hit }
  var particles = [];

  // Key tracking
  var keys = {};

  // Players
  var player1 = null;
  var player2 = null;

  // Player Constructor
  function Player(id, name, color, startX, controls) {
    this.id = id;
    this.name = name;
    this.color = color; // '#ef4444' (Red Mario) or '#3b82f6' (Blue Luigi)
    this.x = startX;
    this.y = 300;
    this.vx = 0;
    this.vy = 0;
    this.width = 36;
    this.height = 48;
    this.isGrounded = false;
    this.facing = 'right';
    this.score = 0;
    this.correct = 0;
    this.controls = controls; // { left, right, jump }
    this.animTimer = 0;
    this.hitTimer = 0;
  }

  Player.prototype.update = function (platforms) {
    var speed = window.GAME_CONFIG.MOVE_SPEED || 4.5;
    var gravity = window.GAME_CONFIG.GRAVITY || 0.55;
    var jumpForce = window.GAME_CONFIG.JUMP_FORCE || -11.5;

    // Movement
    if (keys[this.controls.left] || (this.id === 1 && touchInput.p1Left) || (this.id === 2 && touchInput.p2Left)) {
      this.vx = -speed;
      this.facing = 'left';
    } else if (keys[this.controls.right] || (this.id === 1 && touchInput.p1Right) || (this.id === 2 && touchInput.p2Right)) {
      this.vx = speed;
      this.facing = 'right';
    } else {
      this.vx *= 0.7;
    }

    // Jump
    var jumpPressed = keys[this.controls.jump] || (this.id === 1 && touchInput.p1Jump) || (this.id === 2 && touchInput.p2Jump);
    if (jumpPressed && this.isGrounded) {
      this.vy = jumpForce;
      this.isGrounded = false;
      if (window.KAMPAI && window.KAMPAI.sound) {
        window.KAMPAI.sound.unlock();
      }
    }

    // Gravity
    this.vy += gravity;

    // Apply movement
    this.x += this.vx;
    this.y += this.vy;

    // Screen Bounds
    if (this.x < 10) this.x = 10;
    if (this.x > 790 - this.width) this.x = 790 - this.width;

    // Platform collision
    this.isGrounded = false;
    for (var i = 0; i < platforms.length; i++) {
      var plat = platforms[i];
      if (
        this.x + this.width > plat.x &&
        this.x < plat.x + plat.width &&
        this.y + this.height >= plat.y &&
        this.y + this.height <= plat.y + 16 &&
        this.vy >= 0
      ) {
        this.y = plat.y - this.height;
        this.vy = 0;
        this.isGrounded = true;
      }
    }

    // Bottom Ground fall safe
    if (this.y > 330) {
      this.y = 330;
      this.vy = 0;
      this.isGrounded = true;
    }

    if (this.hitTimer > 0) this.hitTimer--;
    this.animTimer += Math.abs(this.vx) > 0.5 ? 1 : 0;
  };

  Player.prototype.draw = function (c) {
    c.save();
    if (this.hitTimer > 0 && Math.floor(this.hitTimer / 4) % 2 === 0) {
      c.globalAlpha = 0.4;
    }

    var px = this.x;
    var py = this.y;
    var w = this.width;
    var h = this.height;

    // Draw Character (Pixel Mario style)
    // Hat
    c.fillStyle = this.color;
    c.fillRect(px + 4, py, w - 8, 12);
    c.fillRect(px + (this.facing === 'right' ? 8 : 0), py + 4, w - 4, 8);

    // Face / Skin
    c.fillStyle = '#ffdbac';
    c.fillRect(px + 6, py + 12, w - 12, 12);

    // Eyes & Mustache
    c.fillStyle = '#0f172a';
    var eyeX = this.facing === 'right' ? px + w - 14 : px + 8;
    c.fillRect(eyeX, py + 14, 4, 4);

    c.fillStyle = '#451a03';
    c.fillRect(px + 4, py + 20, w - 8, 4);

    // Shirt / Body
    c.fillStyle = this.color;
    c.fillRect(px + 4, py + 24, w - 8, 14);

    // Overalls (Blue straps)
    c.fillStyle = '#1e3a8a';
    c.fillRect(px + 8, py + 26, 4, 12);
    c.fillRect(px + w - 12, py + 26, 4, 12);
    c.fillRect(px + 6, py + 34, w - 12, 6);

    // Legs / Feet
    c.fillStyle = '#451a03';
    var legOffset = Math.sin(this.animTimer * 0.3) * 4;
    if (!this.isGrounded) legOffset = 0;

    c.fillRect(px + 4, py + 40 + legOffset, 12, 8);
    c.fillRect(px + w - 16, py + 40 - legOffset, 12, 8);

    // Player Label Tag
    c.fillStyle = '#ffffff';
    c.font = 'bold 12px Kanit, sans-serif';
    c.textAlign = 'center';
    c.fillText(this.name, px + w / 2, py - 6);

    c.restore();
  };

  // Platforms
  var mainPlatforms = [
    { x: 0, y: 378, width: 800, height: 72 }, // Main Ground
    { x: 100, y: 260, width: 160, height: 20 },
    { x: 320, y: 220, width: 160, height: 20 },
    { x: 540, y: 260, width: 160, height: 20 }
  ];

  // Touch Input State
  var touchInput = {
    p1Left: false, p1Right: false, p1Jump: false,
    p2Left: false, p2Right: false, p2Jump: false
  };

  // Setup Event Listeners
  window.addEventListener('keydown', function (e) {
    keys[e.code] = true;
  });
  window.addEventListener('keyup', function (e) {
    keys[e.code] = false;
  });

  // Touch button wiring helper
  function wireTouchBtn(id, targetKey) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('touchstart', function (e) {
      e.preventDefault();
      touchInput[targetKey] = true;
      el.classList.add('active');
    });
    el.addEventListener('touchend', function (e) {
      e.preventDefault();
      touchInput[targetKey] = false;
      el.classList.remove('active');
    });
    el.addEventListener('mousedown', function () {
      touchInput[targetKey] = true;
      el.classList.add('active');
    });
    el.addEventListener('mouseup', function () {
      touchInput[targetKey] = false;
      el.classList.remove('active');
    });
  }

  wireTouchBtn('btn-left', 'p1Left');
  wireTouchBtn('btn-right', 'p1Right');
  wireTouchBtn('btn-jump', 'p1Jump');

  wireTouchBtn('p1-t-left', 'p1Left');
  wireTouchBtn('p1-t-right', 'p1Right');
  wireTouchBtn('p1-t-jump', 'p1Jump');

  wireTouchBtn('p2-t-left', 'p2Left');
  wireTouchBtn('p2-t-right', 'p2Right');
  wireTouchBtn('p2-t-jump', 'p2Jump');

  // Operation selection
  window.selectOp = function (op, btn) {
    currentOp = op;
    var btns = document.querySelectorAll('.op-btn');
    btns.forEach(function (b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
  };

  // Initialize KampaiVersus
  var vs = window.KampaiVersus.create({
    duration: window.GAME_CONFIG.DURATION || 60,
    title: 'Mario Math Run',
    rankBy: 'score',
    onPlay: function (info) {
      startRound(info.rng, 'versus');
    },
    onEnd: function () {
      endGame(true);
    }
  });

  // Start Game
  window.startGame = function (mode) {
    gameMode = mode;
    startRound(Math.random, mode);
  };

  function startRound(rng, mode) {
    qRand = rng || Math.random;
    currentScore = 0;
    currentCorrect = 0;
    lives = window.GAME_CONFIG.INITIAL_LIVES || 3;
    timer = window.GAME_CONFIG.DURATION || 60;
    gameState = 'playing';

    if (window.KAMPAI && window.KAMPAI.beginRound) {
      window.KAMPAI.beginRound();
    }

    // Hide menus, show HUD
    if (blocker) blocker.style.display = 'none';
    if (gameoverScreen) gameoverScreen.style.display = 'none';
    if (hudOverlay) hudOverlay.style.display = 'flex';
    if (questionBanner) questionBanner.style.display = 'block';

    updateHUD();

    // Create Players based on mode
    player1 = new Player(1, 'P1 มาริโอ้', '#ef4444', 180, {
      left: 'KeyA', right: 'KeyD', jump: 'KeyW'
    });

    if (mode === 'same-screen') {
      player2 = new Player(2, 'P2 ลุยจิ', '#3b82f6', 580, {
        left: 'ArrowLeft', right: 'ArrowRight', jump: 'ArrowUp'
      });
      if (touchControls) touchControls.style.display = 'none';
      if (p2TouchControls) p2TouchControls.style.display = 'flex';
    } else {
      player2 = null;
      if (touchControls) touchControls.style.display = 'flex';
      if (p2TouchControls) p2TouchControls.style.display = 'none';
    }

    // Timer loop
    clearInterval(timerInterval);
    timerInterval = setInterval(function () {
      if (gameState === 'playing') {
        timer--;
        if (timerVal) timerVal.textContent = timer;
        if (timer <= 0) {
          endGame(false);
        }
      }
    }, 1000);

    // Audio BGM
    if (window.KAMPAI && window.KAMPAI.sound) {
      window.KAMPAI.sound.bgmStart();
    }

    spawnQuestion();
  }

  function spawnQuestion() {
    currentQuestion = window.GAME_DATA.generateQuestion(currentOp, qRand);
    if (qTextDisplay) {
      qTextDisplay.textContent = currentQuestion.text;
    }

    // Create 3 Choice Blocks
    choiceBlocks = [];
    var blockPositions = [
      { x: 150, y: 190 },
      { x: 370, y: 150 },
      { x: 590, y: 190 }
    ];

    for (var i = 0; i < 3; i++) {
      var val = currentQuestion.choices[i];
      choiceBlocks.push({
        x: blockPositions[i].x,
        y: blockPositions[i].y,
        width: 60,
        height: 60,
        value: val,
        isCorrect: val === currentQuestion.answer,
        hit: false
      });
    }
  }

  function spawnParticles(x, y, color) {
    for (var i = 0; i < 16; i++) {
      particles.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        color: color,
        life: 30,
        size: Math.random() * 6 + 4
      });
    }
  }

  function handleBlockHit(player, block) {
    if (block.hit) return;
    block.hit = true;

    if (block.isCorrect) {
      // Correct answer!
      player.score += 10;
      player.correct += 1;
      currentScore += 10;
      currentCorrect += 1;

      spawnParticles(block.x + 30, block.y + 30, '#FFD700');
      if (window.KAMPAI && window.KAMPAI.sound) {
        window.KAMPAI.sound.correct();
      }

      vs.report(currentScore, { correct: currentCorrect });

      setTimeout(function () {
        if (gameState === 'playing') spawnQuestion();
      }, 400);
    } else {
      // Wrong answer!
      player.hitTimer = 30;
      spawnParticles(block.x + 30, block.y + 30, '#ef4444');

      if (window.KAMPAI && window.KAMPAI.sound) {
        window.KAMPAI.sound.wrong();
      }

      if (gameMode === 'solo') {
        lives--;
        if (lives <= 0) {
          endGame(false);
          return;
        }
      }
      updateHUD();
    }
  }

  function updateHUD() {
    if (scoreVal) scoreVal.textContent = currentScore;
    if (timerVal) timerVal.textContent = timer;
    if (livesVal) {
      var hearts = '';
      for (var i = 0; i < lives; i++) hearts += '❤️';
      livesVal.textContent = hearts || '💀';
    }
  }

  function endGame(isVsFinished) {
    if (gameState === 'gameover') return;
    gameState = 'gameover';
    clearInterval(timerInterval);

    if (window.KAMPAI && window.KAMPAI.sound) {
      window.KAMPAI.sound.bgmStop();
      window.KAMPAI.sound.gameOver();
    }

    // Check Versus finish guard
    if (!isVsFinished && vs.finish(currentScore, { correct: currentCorrect })) {
      return;
    }

    // Submit score in Solo / Non-versus mode
    if (window.KAMPAI && window.KAMPAI.submitScore) {
      window.KAMPAI.submitScore(currentScore, { mode: currentOp, correct: currentCorrect });
    }

    if (hudOverlay) hudOverlay.style.display = 'none';
    if (questionBanner) questionBanner.style.display = 'none';
    if (touchControls) touchControls.style.display = 'none';
    if (p2TouchControls) p2TouchControls.style.display = 'none';
    if (gameoverScreen) gameoverScreen.style.display = 'flex';

    if (finalScoreEl) finalScoreEl.textContent = currentScore;
    if (goSummaryEl) {
      if (gameMode === 'same-screen' && player1 && player2) {
        var winnerStr = player1.score > player2.score
          ? '🏆 P1 มาริโอ้ ชนะ!'
          : player2.score > player1.score
          ? '🏆 P2 ลุยจิ ชนะ!'
          : '🤝 เสมอกัน!';
        goSummaryEl.textContent = winnerStr + ' (P1: ' + player1.score + ' | P2: ' + player2.score + ')';
      } else {
        goSummaryEl.textContent = 'ตอบถูกต้องทั้งหมด ' + currentCorrect + ' ข้อ!';
      }
    }
  }

  window.resetToMenu = function () {
    gameState = 'menu';
    if (gameoverScreen) gameoverScreen.style.display = 'none';
    if (blocker) blocker.style.display = 'flex';
  };

  // Main Render Loop
  function gameLoop() {
    requestAnimationFrame(gameLoop);
    if (!ctx || !canvas) return;

    // Clear Screen (Sky Blue)
    ctx.fillStyle = '#5c94fc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Parallax Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    var cloudTime = Date.now() * 0.02;
    ctx.beginPath();
    ctx.arc((100 + cloudTime) % 900 - 50, 80, 30, 0, Math.PI * 2);
    ctx.arc((140 + cloudTime) % 900 - 50, 75, 40, 0, Math.PI * 2);
    ctx.arc((180 + cloudTime) % 900 - 50, 80, 30, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc((500 + cloudTime * 0.7) % 900 - 50, 110, 24, 0, Math.PI * 2);
    ctx.arc((530 + cloudTime * 0.7) % 900 - 50, 105, 32, 0, Math.PI * 2);
    ctx.arc((560 + cloudTime * 0.7) % 900 - 50, 110, 24, 0, Math.PI * 2);
    ctx.fill();

    // Draw Hills
    ctx.fillStyle = '#22c55e';
    ctx.beginPath();
    ctx.ellipse(200, 378, 140, 70, 0, Math.PI, 0);
    ctx.ellipse(650, 378, 160, 80, 0, Math.PI, 0);
    ctx.fill();

    // Draw Platforms
    for (var i = 0; i < mainPlatforms.length; i++) {
      var plat = mainPlatforms[i];
      // Brick texture top
      ctx.fillStyle = '#15803d';
      ctx.fillRect(plat.x, plat.y, plat.width, 8);
      ctx.fillStyle = '#854d0e';
      ctx.fillRect(plat.x, plat.y + 8, plat.width, plat.height - 8);

      // Brick grid lines
      ctx.strokeStyle = 'rgba(0,0,0,0.2)';
      ctx.lineWidth = 2;
      ctx.strokeRect(plat.x, plat.y + 8, plat.width, plat.height - 8);
    }

    if (gameState === 'playing') {
      // Update and Draw Choice Blocks
      for (var b = 0; b < choiceBlocks.length; b++) {
        var block = choiceBlocks[b];

        // Draw ? Block / Answer Box
        ctx.save();
        ctx.fillStyle = block.hit ? '#94a3b8' : '#f59e0b';
        ctx.fillRect(block.x, block.y, block.width, block.height);

        ctx.strokeStyle = '#fbbf24';
        ctx.lineWidth = 4;
        ctx.strokeRect(block.x + 2, block.y + 2, block.width - 4, block.height - 4);

        // Draw Corner Dots
        ctx.fillStyle = '#78350f';
        ctx.fillRect(block.x + 4, block.y + 4, 4, 4);
        ctx.fillRect(block.x + block.width - 8, block.y + 4, 4, 4);
        ctx.fillRect(block.x + 4, block.y + block.height - 8, 4, 4);
        ctx.fillRect(block.x + block.width - 8, block.y + block.height - 8, 4, 4);

        // Choice Value Text
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 24px Kanit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(block.value, block.x + block.width / 2, block.y + block.height / 2);
        ctx.restore();

        // Check collision with P1
        if (player1 && !block.hit) {
          if (
            player1.x + player1.width > block.x &&
            player1.x < block.x + block.width &&
            player1.y + player1.height > block.y &&
            player1.y < block.y + block.height
          ) {
            handleBlockHit(player1, block);
          }
        }

        // Check collision with P2
        if (player2 && !block.hit) {
          if (
            player2.x + player2.width > block.x &&
            player2.x < block.x + block.width &&
            player2.y + player2.height > block.y &&
            player2.y < block.y + block.height
          ) {
            handleBlockHit(player2, block);
          }
        }
      }

      // Update & Draw Players
      if (player1) {
        player1.update(mainPlatforms);
        player1.draw(ctx);
      }
      if (player2) {
        player2.update(mainPlatforms);
        player2.draw(ctx);
      }

      // Update & Draw Particles
      for (var p = particles.length - 1; p >= 0; p--) {
        var pt = particles[p];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life--;

        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();

        if (pt.life <= 0) {
          particles.splice(p, 1);
        }
      }

      updateHUD();
    }
  }

  // Start Loop
  gameLoop();

  // KAMPAI SDK Integration & Leaderboard setup
  if (window.KAMPAI && window.KAMPAI.onReady) {
    window.KAMPAI.onReady(function (k) {
      if (window.KAMPAI.sound) {
        window.KAMPAI.sound.defaultBgm('cheerful');
        window.KAMPAI.sound.mountToggles();
      }

      // Update Student Profile & Stats if available
      if (k && k.stats) {
        if (msBestEl) msBestEl.textContent = k.stats.personalBest || 0;
        if (msPlaysEl) msPlaysEl.textContent = k.stats.playsCount || 0;
      }

      // Update Leaderboards
      if (k && k.leaderboard && k.leaderboard.length > 0) {
        var lbHtml = k.leaderboard.slice(0, 5).map(function (item, idx) {
          var meClass = item.isMe ? 'me' : '';
          var name = item.displayName || 'นักเรียน';
          return '<li class="' + meClass + '"><span>#' + (idx + 1) + ' ' + name + '</span><b>' + item.personalBest + '</b></li>';
        }).join('');

        if (scoreListEl) scoreListEl.innerHTML = lbHtml;
        if (scoreListGoEl) scoreListGoEl.innerHTML = lbHtml;
      } else {
        if (scoreListEl) scoreListEl.innerHTML = '<li class="lb-loading">ยังไม่มีสถิติ</li>';
        if (scoreListGoEl) scoreListGoEl.innerHTML = '<li class="lb-loading">—</li>';
      }
    });
  }

})();
