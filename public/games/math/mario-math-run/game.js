/**
 * Mario Math Run — Auto-Scrolling Platformer Game Logic Module
 * Single-player & 2-Player Same-Screen auto-runner with 5 lives, offscreen question respawn, and walkable hit stone blocks
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

  var timer = 60;
  var timerInterval = null;
  var currentScore = 0;
  var currentCorrect = 0;
  var lives = 5;
  var qRand = Math.random;

  // Auto-scroll World State
  var scrollX = 0;
  var nextPlatWorldX = 0;
  var platforms = []; // { worldX, y, width, height, isHigh }
  var enemies = [];   // { worldX, y, width, height, vx, alive, animTimer, platLeft, platRight }
  var choiceBlocks = []; // { worldX, y, width, height, value, isCorrect, hit, bounceY }
  var particles = [];

  var currentQuestion = null;

  // Key tracking
  var keys = {};

  // Players
  var player1 = null;
  var player2 = null;

  // Player Constructor
  function Player(id, name, color, startScreenX, controls) {
    this.id = id;
    this.name = name;
    this.color = color; // '#ef4444' (Red Mario) or '#3b82f6' (Blue Luigi)
    this.x = startScreenX; // Screen-relative X position
    this.y = 280;
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

  Player.prototype.update = function (plats, blocks, scrollSpeed) {
    var speed = window.GAME_CONFIG.MOVE_SPEED || 4.5;
    var gravity = window.GAME_CONFIG.GRAVITY || 0.55;
    var jumpForce = window.GAME_CONFIG.JUMP_FORCE || -11.5;

    // Relative movement control
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

    // Apply relative velocity + auto-scroll push back
    this.x += this.vx - scrollSpeed * 0.15;
    this.y += this.vy;

    // Screen Bounds Safety
    if (this.x < 10) this.x = 10;
    if (this.x > 750) this.x = 750;

    // Platform & Hit Block Standing Collision
    this.isGrounded = false;

    // 1. Ground and Elevated Platforms
    for (var i = 0; i < plats.length; i++) {
      var plat = plats[i];
      var screenPlatX = plat.worldX - scrollX;

      if (
        this.x + this.width > screenPlatX &&
        this.x < screenPlatX + plat.width &&
        this.y + this.height >= plat.y &&
        this.y + this.height <= plat.y + 18 &&
        this.vy >= 0
      ) {
        this.y = plat.y - this.height;
        this.vy = 0;
        this.isGrounded = true;
      }
    }

    // 2. Hit Choice Blocks (Become Walkable Solid Stone Bricks)
    for (var b = 0; b < blocks.length; b++) {
      var blk = blocks[b];
      if (blk.hit) {
        var screenBlkX = blk.worldX - scrollX;
        if (
          this.x + this.width > screenBlkX &&
          this.x < screenBlkX + blk.width &&
          this.y + this.height >= blk.y &&
          this.y + this.height <= blk.y + 18 &&
          this.vy >= 0
        ) {
          this.y = blk.y - this.height;
          this.vy = 0;
          this.isGrounded = true;
        }
      }
    }

    // Pit fall check (fell off bottom of screen)
    if (this.y > 450) {
      this.handlePitFall();
    }

    if (this.hitTimer > 0) this.hitTimer--;
    this.animTimer += Math.abs(this.vx) > 0.5 || !this.isGrounded ? 1 : 0;
  };

  Player.prototype.handlePitFall = function () {
    if (this.hitTimer > 0) return;
    this.hitTimer = 40;
    if (window.KAMPAI && window.KAMPAI.sound) {
      window.KAMPAI.sound.wrong();
    }

    // Respawn at safe height on screen
    this.y = 180;
    this.vy = -4;
    this.x = Math.max(100, this.x - 40);

    if (gameMode === 'solo') {
      lives--;
      updateHUD();
      if (lives <= 0) {
        endGame(false);
      }
    }
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

    // Eye & Mustache
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

    // Player Tag
    c.fillStyle = '#ffffff';
    c.font = 'bold 12px Kanit, sans-serif';
    c.textAlign = 'center';
    c.fillText(this.name, px + w / 2, py - 6);

    c.restore();
  };

  // Touch Input State
  var touchInput = {
    p1Left: false, p1Right: false, p1Jump: false,
    p2Left: false, p2Right: false, p2Jump: false
  };

  // Event Listeners
  window.addEventListener('keydown', function (e) {
    keys[e.code] = true;
  });
  window.addEventListener('keyup', function (e) {
    keys[e.code] = false;
  });

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

  window.selectOp = function (op, btn) {
    currentOp = op;
    var btns = document.querySelectorAll('.op-btn');
    btns.forEach(function (b) { b.classList.remove('active'); });
    if (btn) btn.classList.add('active');
  };

  // KampaiVersus Integration
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

  window.startGame = function (mode) {
    gameMode = mode;
    startRound(Math.random, mode);
  };

  function startRound(rng, mode) {
    qRand = rng || Math.random;
    currentScore = 0;
    currentCorrect = 0;
    lives = window.GAME_CONFIG.INITIAL_LIVES || 5;
    timer = window.GAME_CONFIG.DURATION || 60;
    gameState = 'playing';

    scrollX = 0;
    nextPlatWorldX = 0;
    platforms = [];
    enemies = [];
    choiceBlocks = [];
    particles = [];

    if (window.KAMPAI && window.KAMPAI.beginRound) {
      window.KAMPAI.beginRound();
    }

    if (blocker) blocker.style.display = 'none';
    if (gameoverScreen) gameoverScreen.style.display = 'none';
    if (hudOverlay) hudOverlay.style.display = 'flex';
    if (questionBanner) questionBanner.style.display = 'block';

    updateHUD();

    // Initial platforms setup
    generateInitialStage();

    // Create Players
    player1 = new Player(1, 'P1 มาริโอ้', '#ef4444', 120, {
      left: 'KeyA', right: 'KeyD', jump: 'KeyW'
    });

    if (mode === 'same-screen') {
      player2 = new Player(2, 'P2 ลุยจิ', '#3b82f6', 200, {
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

    if (window.KAMPAI && window.KAMPAI.sound) {
      window.KAMPAI.sound.bgmStart();
    }

    spawnQuestion();
  }

  function generateInitialStage() {
    // Starting main ground
    platforms.push({ worldX: 0, y: 360, width: 950, height: 90, isHigh: false });
    nextPlatWorldX = 950;

    for (var i = 0; i < 6; i++) {
      spawnNextPlatformSegment();
    }
  }

  function spawnNextPlatformSegment() {
    // Random pit gap
    var pitGap = Math.floor(qRand() * 60) + 80;
    var platWidth = Math.floor(qRand() * 250) + 350;

    var platWorldX = nextPlatWorldX + pitGap;
    var platY = 360;

    // Ground platform
    platforms.push({ worldX: platWorldX, y: platY, width: platWidth, height: 90, isHigh: false });

    // Elevated Platform (ที่เหยียบขึ้นที่สูง)
    if (qRand() < 0.7) {
      var highPlatWidth = Math.floor(qRand() * 100) + 140;
      var highPlatWorldX = platWorldX + 80 + qRand() * (platWidth - highPlatWidth - 100);
      platforms.push({
        worldX: highPlatWorldX,
        y: 240,
        width: highPlatWidth,
        height: 20,
        isHigh: true
      });
    }

    // Random enemy spawn with Smart Patrol Bounds
    if (qRand() < 0.65) {
      var enemyW = 32;
      var enemyX = platWorldX + 100 + qRand() * (platWidth - 200);
      enemies.push({
        worldX: enemyX,
        y: platY - 32,
        width: enemyW,
        height: 32,
        vx: -1.2,
        alive: true,
        animTimer: 0,
        platLeft: platWorldX,
        platRight: platWorldX + platWidth
      });
    }

    nextPlatWorldX = platWorldX + platWidth;
  }

  function spawnQuestion() {
    currentQuestion = window.GAME_DATA.generateQuestion(currentOp, qRand);
    if (qTextDisplay) {
      qTextDisplay.textContent = currentQuestion.text;
    }

    // Spawn 3 Question Blocks ahead of current scrollX position
    choiceBlocks = [];
    var baseWorldX = scrollX + 700;
    var spacing = 190;

    for (var i = 0; i < 3; i++) {
      var val = currentQuestion.choices[i];
      var blockY = (i % 2 === 0) ? 200 : 150;

      choiceBlocks.push({
        worldX: baseWorldX + i * spacing,
        y: blockY,
        width: 54,
        height: 54,
        value: val,
        isCorrect: val === currentQuestion.answer,
        hit: false,
        bounceY: 0
      });
    }
  }

  function spawnParticles(screenX, screenY, color) {
    for (var i = 0; i < 16; i++) {
      particles.push({
        x: screenX,
        y: screenY,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8 - 2,
        color: color,
        life: 30,
        size: Math.random() * 6 + 4
      });
    }
  }

  function handleHeadbuttBlock(player, block) {
    if (block.hit) return;
    block.hit = true; // Converts into solid walkable stone brick!
    block.bounceY = -12; // Bounce animation

    var screenBlockX = block.worldX - scrollX;

    if (block.isCorrect) {
      // Correct Headbutt!
      player.score += 10;
      player.correct += 1;
      currentScore += 10;
      currentCorrect += 1;

      spawnParticles(screenBlockX + 27, block.y + 27, '#FFD700');
      if (window.KAMPAI && window.KAMPAI.sound) {
        window.KAMPAI.sound.correct();
      }

      vs.report(currentScore, { correct: currentCorrect });

      setTimeout(function () {
        if (gameState === 'playing') spawnQuestion();
      }, 500);
    } else {
      // Wrong Headbutt!
      player.hitTimer = 30;
      spawnParticles(screenBlockX + 27, block.y + 27, '#ef4444');

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

    if (!isVsFinished && vs.finish(currentScore, { correct: currentCorrect })) {
      return;
    }

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

  // Main Render & Update Loop
  function gameLoop() {
    requestAnimationFrame(gameLoop);
    if (!ctx || !canvas) return;

    // Clear Screen (Sky Blue)
    ctx.fillStyle = '#5c94fc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Parallax Clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    var cloudScroll1 = (scrollX * 0.2) % 900;
    ctx.beginPath();
    ctx.arc(200 - cloudScroll1, 70, 30, 0, Math.PI * 2);
    ctx.arc(240 - cloudScroll1, 65, 40, 0, Math.PI * 2);
    ctx.arc(280 - cloudScroll1, 70, 30, 0, Math.PI * 2);

    ctx.arc(800 - cloudScroll1, 70, 30, 0, Math.PI * 2);
    ctx.arc(840 - cloudScroll1, 65, 40, 0, Math.PI * 2);
    ctx.arc(880 - cloudScroll1, 70, 30, 0, Math.PI * 2);
    ctx.fill();

    // Update Auto-scroll
    if (gameState === 'playing') {
      var autoScrollSpeed = window.GAME_CONFIG.AUTO_SCROLL_SPEED || 2.0;
      scrollX += autoScrollSpeed;

      // Spawn next platform segments as player advances
      if (nextPlatWorldX - scrollX < 1200) {
        spawnNextPlatformSegment();
      }

      // Prune old offscreen platforms
      for (var pIdx = platforms.length - 1; pIdx >= 0; pIdx--) {
        if (platforms[pIdx].worldX + platforms[pIdx].width < scrollX - 200) {
          platforms.splice(pIdx, 1);
        }
      }

      // Check if all choice blocks scrolled offscreen without being answered -> Auto-spawn new question!
      if (choiceBlocks.length > 0) {
        var allOffscreen = choiceBlocks.every(function (b) {
          return b.worldX + b.width < scrollX;
        });
        if (allOffscreen) {
          spawnQuestion();
        }
      }
    }

    // Draw Platforms (Grounds & Elevated Ledges)
    for (var i = 0; i < platforms.length; i++) {
      var plat = platforms[i];
      var screenX = plat.worldX - scrollX;

      if (screenX + plat.width > -50 && screenX < 850) {
        if (plat.isHigh) {
          // Elevated Floating Ledge
          ctx.fillStyle = '#fbbf24';
          ctx.fillRect(screenX, plat.y, plat.width, 4);
          ctx.fillStyle = '#b45309';
          ctx.fillRect(screenX, plat.y + 4, plat.width, plat.height - 4);
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 2;
          ctx.strokeRect(screenX, plat.y, plat.width, plat.height);
        } else {
          // Main Ground Platform
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(screenX, plat.y, plat.width, 10);
          ctx.fillStyle = '#854d0e';
          ctx.fillRect(screenX, plat.y + 10, plat.width, plat.height - 10);
          ctx.strokeStyle = 'rgba(0,0,0,0.15)';
          ctx.lineWidth = 2;
          ctx.strokeRect(screenX, plat.y + 10, plat.width, plat.height - 10);
        }
      }
    }

    if (gameState === 'playing') {
      // Update & Draw Enemies (Goombas with Smart Patrol)
      for (var e = enemies.length - 1; e >= 0; e--) {
        var enemy = enemies[e];
        if (!enemy.alive) continue;

        // Move enemy
        enemy.worldX += enemy.vx;
        enemy.animTimer++;

        // Edge Patrol Logic: Turn around when reaching platform edge
        if (enemy.worldX <= enemy.platLeft && enemy.vx < 0) {
          enemy.vx = Math.abs(enemy.vx);
        } else if (enemy.worldX + enemy.width >= enemy.platRight && enemy.vx > 0) {
          enemy.vx = -Math.abs(enemy.vx);
        }

        var screenEnaX = enemy.worldX - scrollX;
        if (screenEnaX + enemy.width < -100) continue;

        // Draw Goomba Monster
        ctx.save();
        ctx.fillStyle = '#78350f';
        ctx.beginPath();
        ctx.arc(screenEnaX + 16, enemy.y + 16, 16, Math.PI, 0, false);
        ctx.fillRect(screenEnaX + 4, enemy.y + 16, 24, 12);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(screenEnaX + 8, enemy.y + 12, 5, 8);
        ctx.fillRect(screenEnaX + 19, enemy.y + 12, 5, 8);
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(screenEnaX + 10, enemy.y + 14, 3, 4);
        ctx.fillRect(screenEnaX + 19, enemy.y + 14, 3, 4);

        // Feet (animated)
        ctx.fillStyle = '#451a03';
        var footShift = Math.sin(enemy.animTimer * 0.2) * 3;
        ctx.fillRect(screenEnaX + 2 + footShift, enemy.y + 26, 10, 6);
        ctx.fillRect(screenEnaX + 20 - footShift, enemy.y + 26, 10, 6);
        ctx.restore();

        // Check Stomp / Collision
        checkEnemyPlayerCollision(player1, enemy);
        if (player2) checkEnemyPlayerCollision(player2, enemy);
      }

      // Update & Draw Question / Stone Blocks
      for (var b = 0; b < choiceBlocks.length; b++) {
        var block = choiceBlocks[b];
        var screenBlockX = block.worldX - scrollX;

        if (block.bounceY < 0) block.bounceY += 1;

        if (screenBlockX + block.width > -50 && screenBlockX < 850) {
          ctx.save();
          var blockDrawY = block.y + block.bounceY;

          if (block.hit) {
            // Render as Solid Walkable Empty Stone Brick Block (ก้อนหินเหยียบได้)
            ctx.fillStyle = '#78350f';
            ctx.fillRect(screenBlockX, blockDrawY, block.width, block.height);

            ctx.strokeStyle = '#451a03';
            ctx.lineWidth = 3;
            ctx.strokeRect(screenBlockX + 1, blockDrawY + 1, block.width - 2, block.height - 2);

            // Brick texture lines
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.beginPath();
            ctx.moveTo(screenBlockX, blockDrawY + block.height / 2);
            ctx.lineTo(screenBlockX + block.width, blockDrawY + block.height / 2);
            ctx.stroke();
          } else {
            // Render as Interactive Question ? Block
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(screenBlockX, blockDrawY, block.width, block.height);

            ctx.strokeStyle = '#fbbf24';
            ctx.lineWidth = 4;
            ctx.strokeRect(screenBlockX + 2, blockDrawY + 2, block.width - 4, block.height - 4);

            // Corner Dots
            ctx.fillStyle = '#78350f';
            ctx.fillRect(screenBlockX + 4, blockDrawY + 4, 4, 4);
            ctx.fillRect(screenBlockX + block.width - 8, blockDrawY + 4, 4, 4);

            // Value Label
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 24px Kanit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(block.value, screenBlockX + block.width / 2, blockDrawY + block.height / 2);
          }
          ctx.restore();

          // Check Headbutt Collision for active unhit blocks
          if (!block.hit) {
            checkBlockHeadbutt(player1, block);
            if (player2) checkBlockHeadbutt(player2, block);
          }
        }
      }

      // Update & Draw Players
      if (player1) {
        player1.update(platforms, choiceBlocks, window.GAME_CONFIG.AUTO_SCROLL_SPEED);
        player1.draw(ctx);
      }
      if (player2) {
        player2.update(platforms, choiceBlocks, window.GAME_CONFIG.AUTO_SCROLL_SPEED);
        player2.draw(ctx);
      }

      // Particles
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

  function checkEnemyPlayerCollision(player, enemy) {
    if (!player || !enemy.alive) return;
    var screenEnaX = enemy.worldX - scrollX;

    if (
      player.x + player.width > screenEnaX &&
      player.x < screenEnaX + enemy.width &&
      player.y + player.height > enemy.y &&
      player.y < enemy.y + enemy.height
    ) {
      // Stomp check
      if (player.vy > 0 && player.y + player.height - player.vy <= enemy.y + 12) {
        enemy.alive = false;
        player.vy = -8.5; // Bounce off monster
        spawnParticles(screenEnaX + 16, enemy.y + 16, '#78350f');
        if (window.KAMPAI && window.KAMPAI.sound) {
          window.KAMPAI.sound.correct();
        }
      } else if (player.hitTimer <= 0) {
        // Player hit from side
        player.hitTimer = 35;
        spawnParticles(player.x + 18, player.y + 24, '#ef4444');
        if (window.KAMPAI && window.KAMPAI.sound) {
          window.KAMPAI.sound.wrong();
        }
        if (gameMode === 'solo') {
          lives--;
          updateHUD();
          if (lives <= 0) endGame(false);
        }
      }
    }
  }

  function checkBlockHeadbutt(player, block) {
    if (!player || block.hit) return;
    var screenBlockX = block.worldX - scrollX;

    // Headbutt condition: Player moving UPWARD (vy < 0) and top of player hits bottom of block
    if (
      player.x + player.width > screenBlockX + 4 &&
      player.x < screenBlockX + block.width - 4 &&
      player.y <= block.y + block.height &&
      player.y + player.height >= block.y &&
      player.vy < 0
    ) {
      handleHeadbuttBlock(player, block);
    }
  }

  // Start Loop
  gameLoop();

  // KAMPAI SDK Setup
  if (window.KAMPAI && window.KAMPAI.onReady) {
    window.KAMPAI.onReady(function (k) {
      if (window.KAMPAI.sound) {
        window.KAMPAI.sound.defaultBgm('cheerful');
        window.KAMPAI.sound.mountToggles();
      }

      if (k && k.stats) {
        if (msBestEl) msBestEl.textContent = k.stats.personalBest || 0;
        if (msPlaysEl) msPlaysEl.textContent = k.stats.playsCount || 0;
      }

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
