// Road Blitz - Core Arcade Racing Game Engine
const GAME_SLUG = 'road-blitz';

(function () {
  const CONFIG = window.GAME_CONFIG;
  const DATA = window.GAME_DATA;

  // Canvas Setup
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');

  // DOM HUD & Screens
  const hudOverlay = document.getElementById('hud-overlay');
  const hudStage = document.getElementById('hud-stage');
  const hudDistance = document.getElementById('hud-distance');
  const hudScore = document.getElementById('hud-score');
  const hudSpeed = document.getElementById('hud-speed');
  const fuelBarFill = document.getElementById('fuel-bar-fill');

  const startScreen = document.getElementById('start-screen');
  const pauseScreen = document.getElementById('pause-screen');
  const stageClearScreen = document.getElementById('stage-clear-screen');
  const gameOverScreen = document.getElementById('game-over-screen');
  const touchControls = document.getElementById('touch-controls');

  const btnStartGame = document.getElementById('btn-start-game');
  const btnVersus = document.getElementById('btn-versus');
  const btnResumeGame = document.getElementById('btn-resume-game');
  const btnNextStage = document.getElementById('btn-next-stage');
  const btnRetryGame = document.getElementById('btn-retry-game');
  const btnSoundToggle = document.getElementById('btn-sound-toggle');

  // Rule 1 Boilerplate Guardrail check
  const msBest = document.getElementById('ms-best');
  const msPlays = document.getElementById('ms-plays');

  // Game Engine State
  let gameState = 'MENU'; // MENU, PLAYING, PAUSED, STAGE_CLEAR, GAME_OVER
  let currentStageIndex = 0;
  let score = 0;
  let distanceMeters = 0;
  let fuel = CONFIG.initialFuel;
  let speed = CONFIG.baseSpeed;
  let roadScrollOffset = 0;
  let frameCount = 0;

  // Sound State
  let soundMuted = false;

  // Player State
  const player = {
    x: CONFIG.canvasWidth / 2,
    y: CONFIG.canvasHeight - 120,
    width: CONFIG.carWidth,
    height: CONFIG.carHeight,
    vx: 0,
    vy: 0,
    isSpinning: false,
    spinAngle: 0,
    spinTimer: 0,
    invulnerableTimer: 0
  };

  // Input Tracking
  const keys = {
    left: false,
    right: false,
    boost: false,
    brake: false
  };

  // Entities
  let trafficList = [];
  let pickupList = [];
  let hazardList = [];
  let particleList = [];

  // High Score Storage
  let bestScore = parseInt(localStorage.getItem('road_blitz_best_score') || '0', 10);

  // KAMPAI SDK Integration
  let kampaiSDK = null;
  if (window.KAMPAI) {
    window.KAMPAI.setSlug(GAME_SLUG);
    window.KAMPAI.onReady((k) => {
      kampaiSDK = k;
      if (k.stats && k.stats.bestScore) {
        bestScore = Math.max(bestScore, k.stats.bestScore);
      }
      updateStatsDisplay(k.stats);
    });
  }

  // 2-Player Versus Framework Integration
  const vs = (window.KampaiVersus && window.KampaiVersus.create) ? window.KampaiVersus.create({
    duration: 60,
    title: 'Road Blitz — แข่งความเร็ว',
    rankBy: 'score',
    onPlay: ({ rng, player: p }) => {
      startGame();
    },
    onEnd: () => {
      triggerGameOver('หมดเวลาการแข่งขัน!');
    }
  }) : null;

  function updateStatsDisplay(stats) {
    if (msBest && stats) msBest.innerText = stats.bestScore || 0;
    if (msPlays && stats) msPlays.innerText = stats.playCount || 0;
  }

  // Sound Helper
  function playSound(type) {
    if (soundMuted || !window.KAMPAI || !window.KAMPAI.sound) return;
    try {
      if (type === 'correct') window.KAMPAI.sound.correct();
      else if (type === 'wrong') window.KAMPAI.sound.wrong();
      else if (type === 'gameOver') window.KAMPAI.sound.gameOver();
      else if (type === 'timeUp') window.KAMPAI.sound.timeUp();
    } catch (e) {
      console.warn('Audio playback error:', e);
    }
  }

  // --- RENDERING HELPERS (Pixel-Art Canvas Generators) ---
  function drawPixelCar(ctx, x, y, width, height, colors, isPlayer = false, headlightsOn = false) {
    ctx.save();
    ctx.translate(x, y);

    // Body shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(-width / 2 + 4, -height / 2 + 4, width, height);

    // Wheels (4 corner tires)
    ctx.fillStyle = colors.wheels || '#1d2b53';
    ctx.fillRect(-width / 2 - 2, -height / 2 + 8, 4, 14);
    ctx.fillRect(width / 2 - 2, -height / 2 + 8, 4, 14);
    ctx.fillRect(-width / 2 - 2, height / 2 - 22, 4, 14);
    ctx.fillRect(width / 2 - 2, height / 2 - 22, 4, 14);

    // Main Car Body
    ctx.fillStyle = colors.main;
    ctx.fillRect(-width / 2, -height / 2 + 6, width, height - 12);

    // Car Roof / Racing Stripe
    ctx.fillStyle = colors.roof;
    ctx.fillRect(-width / 4, -height / 4, width / 2, height / 2);

    // Windshield (Front & Rear)
    ctx.fillStyle = colors.glass;
    ctx.fillRect(-width / 2 + 4, -height / 2 + 14, width - 8, 10); // Front
    ctx.fillRect(-width / 2 + 6, height / 2 - 20, width - 12, 6);  // Rear

    // Headlights (Front top)
    ctx.fillStyle = colors.headlights || '#fff1e8';
    ctx.fillRect(-width / 2 + 3, -height / 2 + 6, 6, 4);
    ctx.fillRect(width / 2 - 9, -height / 2 + 6, 6, 4);

    // Night Stage Headlight Beam Effect
    if (headlightsOn) {
      const grad = ctx.createLinearGradient(0, -height / 2, 0, -height / 2 - 140);
      grad.addColorStop(0, 'rgba(255, 236, 39, 0.6)');
      grad.addColorStop(1, 'rgba(255, 236, 39, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-width / 2 - 10, -height / 2 - 140);
      ctx.lineTo(width / 2 + 10, -height / 2 - 140);
      ctx.lineTo(width / 2, -height / 2);
      ctx.lineTo(-width / 2, -height / 2);
      ctx.closePath();
      ctx.fill();
    }

    // Taillights (Rear bottom)
    ctx.fillStyle = colors.taillights || '#ff004d';
    ctx.fillRect(-width / 2 + 3, height / 2 - 9, 6, 3);
    ctx.fillRect(width / 2 - 9, height / 2 - 9, 6, 3);

    ctx.restore();
  }

  function drawPixelTruck(ctx, x, y, width, height, colors, headlightsOn = false) {
    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(-width / 2 + 4, -height / 2 + 6, width, height);

    // Wheels (6 wheels for heavy truck)
    ctx.fillStyle = '#1d2b53';
    ctx.fillRect(-width / 2 - 3, -height / 2 + 10, 4, 16);
    ctx.fillRect(width / 2 - 1, -height / 2 + 10, 4, 16);
    ctx.fillRect(-width / 2 - 3, 0, 4, 16);
    ctx.fillRect(width / 2 - 1, 0, 4, 16);
    ctx.fillRect(-width / 2 - 3, height / 2 - 26, 4, 16);
    ctx.fillRect(width / 2 - 1, height / 2 - 26, 4, 16);

    // Cabin Front
    ctx.fillStyle = colors.main;
    ctx.fillRect(-width / 2, -height / 2 + 4, width, 24);

    // Windshield
    ctx.fillStyle = colors.glass;
    ctx.fillRect(-width / 2 + 4, -height / 2 + 10, width - 8, 8);

    // Cargo Trailer (Back)
    ctx.fillStyle = colors.colorRoof || '#83769c';
    ctx.fillRect(-width / 2 + 2, -height / 2 + 28, width - 4, height - 32);

    // Trailer Stripe Detail
    ctx.fillStyle = '#fff1e8';
    ctx.fillRect(-width / 2 + 6, -height / 2 + 34, width - 12, 4);

    if (headlightsOn) {
      const grad = ctx.createLinearGradient(0, -height / 2, 0, -height / 2 - 120);
      grad.addColorStop(0, 'rgba(255, 236, 39, 0.5)');
      grad.addColorStop(1, 'rgba(255, 236, 39, 0.0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(-width / 2 - 12, -height / 2 - 120);
      ctx.lineTo(width / 2 + 12, -height / 2 - 120);
      ctx.lineTo(width / 2, -height / 2);
      ctx.lineTo(-width / 2, -height / 2);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function drawFuelCan(ctx, x, y, size) {
    ctx.save();
    ctx.translate(x, y);

    // Glow
    ctx.fillStyle = 'rgba(255, 236, 39, 0.3)';
    ctx.beginPath();
    ctx.arc(0, 0, size / 2 + 6, 0, Math.PI * 2);
    ctx.fill();

    // Red Can Body
    ctx.fillStyle = DATA.pickups.fuelCan.colorMain;
    ctx.fillRect(-size / 2, -size / 2 + 4, size, size - 4);

    // Cap & Handle
    ctx.fillStyle = DATA.pickups.fuelCan.colorCap;
    ctx.fillRect(-size / 4, -size / 2, size / 2, 4);
    ctx.fillRect(-size / 2 + 4, -size / 2 + 2, 6, 4);

    // 'F' Text
    ctx.fillStyle = '#fff1e8';
    ctx.font = '12px "Press Start 2P"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('F', 0, 4);

    ctx.restore();
  }

  function drawOilSlick(ctx, x, y, width, height) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = DATA.hazards.oilSlick.colorMain;
    ctx.beginPath();
    ctx.ellipse(0, 0, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Oil sheen reflection
    ctx.fillStyle = DATA.hazards.oilSlick.colorShine;
    ctx.beginPath();
    ctx.ellipse(-width / 6, -height / 6, width / 4, height / 4, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  // --- GAME INIT & RESTART ---
  function initGame() {
    currentStageIndex = 0;
    score = 0;
    distanceMeters = 0;
    fuel = CONFIG.initialFuel;
    speed = CONFIG.baseSpeed;
    trafficList = [];
    pickupList = [];
    hazardList = [];
    particleList = [];
    resetPlayerPosition();
  }

  function resetPlayerPosition() {
    player.x = CONFIG.canvasWidth / 2;
    player.y = CONFIG.canvasHeight - 120;
    player.vx = 0;
    player.vy = 0;
    player.isSpinning = false;
    player.spinAngle = 0;
    player.spinTimer = 0;
    player.invulnerableTimer = 0;
  }

  function startGame() {
    if (window.KAMPAI && window.KAMPAI.sound) {
      window.KAMPAI.sound.unlock();
    }
    initGame();
    gameState = 'PLAYING';

    startScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    stageClearScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    hudOverlay.classList.remove('hidden');

    if (isMobileDevice()) {
      touchControls.classList.remove('hidden');
    }
  }

  function isMobileDevice() {
    return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
  }

  // --- SPAWNING LOGIC ---
  function spawnEntities() {
    const stage = DATA.stages[currentStageIndex];
    const roadLeft = (CONFIG.canvasWidth - CONFIG.roadWidth) / 2 + CONFIG.shoulderWidth;
    const laneWidth = (CONFIG.roadWidth - CONFIG.shoulderWidth * 2) / CONFIG.laneCount;

    // 1. Rival Traffic Spawn
    const currentSpawnInterval = Math.max(
      CONFIG.trafficSpawnIntervalMin,
      Math.floor(CONFIG.trafficSpawnIntervalBase / (stage.spawnMultiplier * (speed / CONFIG.baseSpeed)))
    );

    if (frameCount % currentSpawnInterval === 0) {
      const lane = Math.floor(Math.random() * CONFIG.laneCount);
      const laneCenterX = roadLeft + lane * laneWidth + laneWidth / 2;
      const typeIndex = Math.floor(Math.random() * DATA.rivalTypes.length);
      const rivalType = DATA.rivalTypes[typeIndex];

      trafficList.push({
        type: rivalType,
        x: laneCenterX,
        y: -120,
        speed: speed * rivalType.speedRatio
      });
    }

    // 2. Fuel Can Spawn
    if (frameCount % CONFIG.fuelSpawnInterval === 0 || (fuel < 30 && frameCount % 90 === 0)) {
      const lane = Math.floor(Math.random() * CONFIG.laneCount);
      const laneCenterX = roadLeft + lane * laneWidth + laneWidth / 2;
      pickupList.push({
        x: laneCenterX,
        y: -50,
        size: CONFIG.pickupSize
      });
    }

    // 3. Hazard Spawn (Oil Slick)
    if (frameCount % CONFIG.hazardSpawnInterval === 0) {
      const lane = Math.floor(Math.random() * CONFIG.laneCount);
      const laneCenterX = roadLeft + lane * laneWidth + laneWidth / 2;
      hazardList.push({
        x: laneCenterX,
        y: -50,
        width: CONFIG.slickWidth,
        height: CONFIG.slickHeight
      });
    }
  }

  // --- UPDATE ENGINE LOOP ---
  function update() {
    if (gameState !== 'PLAYING') return;

    frameCount++;
    const stage = DATA.stages[currentStageIndex];

    // 1. Speed & Physics Update
    let targetSpeed = CONFIG.baseSpeed;
    let fuelDrain = CONFIG.normalFuelDrainRate;

    if (keys.boost) {
      targetSpeed = CONFIG.maxSpeed;
      fuelDrain = CONFIG.boostFuelDrainRate;
    } else if (keys.brake) {
      targetSpeed = CONFIG.minSpeed;
      fuelDrain = CONFIG.normalFuelDrainRate * 0.5;
    }

    speed += (targetSpeed - speed) * CONFIG.acceleration;

    // Fuel Decay
    fuel -= fuelDrain;
    if (fuel <= 0) {
      fuel = 0;
      triggerGameOver('พลังงานหมดกลางทาง (OUT OF FUEL!)');
      return;
    }

    // Distance & Score Increment
    const distanceDelta = speed * CONFIG.metersPerPixel;
    distanceMeters += distanceDelta;
    score += Math.floor(distanceDelta * CONFIG.distanceScoreRate);

    if (vs && vs.report) {
      vs.report(score, { distanceKm: (distanceMeters / 1000).toFixed(1) });
    }

    // Road Scroll Offset
    roadScrollOffset = (roadScrollOffset + speed) % (CONFIG.stripeLength + CONFIG.stripeGap);

    // 2. Player Movement
    if (player.isSpinning) {
      player.spinAngle += 0.25;
      player.spinTimer--;
      if (player.spinTimer <= 0) {
        player.isSpinning = false;
        player.spinAngle = 0;
      }
    } else {
      if (keys.left) player.x -= CONFIG.steerSpeed;
      if (keys.right) player.x += CONFIG.steerSpeed;

      // Road Shoulder Bounds Check
      const roadLeft = (CONFIG.canvasWidth - CONFIG.roadWidth) / 2 + CONFIG.shoulderWidth + player.width / 2;
      const roadRight = (CONFIG.canvasWidth + CONFIG.roadWidth) / 2 - CONFIG.shoulderWidth - player.width / 2;

      if (player.x < roadLeft) {
        player.x = roadLeft;
        speed = Math.max(CONFIG.minSpeed, speed - 0.4); // Wall drag
      }
      if (player.x > roadRight) {
        player.x = roadRight;
        speed = Math.max(CONFIG.minSpeed, speed - 0.4);
      }
    }

    // 3. Spawning
    spawnEntities();

    // 4. Update Traffic
    for (let i = trafficList.length - 1; i >= 0; i--) {
      const t = trafficList[i];
      // Move down relative to player speed
      t.y += (speed - t.speed);

      // Check Collision with Player
      if (!player.isSpinning && checkAABBCollision(player, t)) {
        createExplosion(player.x, player.y);
        triggerGameOver(`ชนเข้ากับ ${t.type.name}!`);
        return;
      }

      // Remove offscreen
      if (t.y > CONFIG.canvasHeight + 100 || t.y < -300) {
        trafficList.splice(i, 1);
      }
    }

    // 5. Update Pickups (Fuel Cans)
    for (let i = pickupList.length - 1; i >= 0; i--) {
      const p = pickupList[i];
      p.y += speed;

      if (checkCircleCollision(player, p.x, p.y, p.size / 2)) {
        fuel = Math.min(CONFIG.maxFuel, fuel + CONFIG.fuelCanBonus);
        score += CONFIG.fuelPickupScore;
        playSound('correct');
        createSparkles(p.x, p.y, '#00e756');
        pickupList.splice(i, 1);
        continue;
      }

      if (p.y > CONFIG.canvasHeight + 50) {
        pickupList.splice(i, 1);
      }
    }

    // 6. Update Hazards (Oil Slicks)
    for (let i = hazardList.length - 1; i >= 0; i--) {
      const h = hazardList[i];
      h.y += speed;

      if (!player.isSpinning && checkCircleCollision(player, h.x, h.y, h.width / 3)) {
        player.isSpinning = true;
        player.spinTimer = 40;
        playSound('wrong');
        createSparkles(h.x, h.y, '#29adff');
      }

      if (h.y > CONFIG.canvasHeight + 50) {
        hazardList.splice(i, 1);
      }
    }

    // 7. Update Particles
    for (let i = particleList.length - 1; i >= 0; i--) {
      const p = particleList[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) particleList.splice(i, 1);
    }

    // 8. Stage Clear Target Check
    if (distanceMeters >= stage.targetDistance && gameState === 'PLAYING') {
      triggerStageClear();
    }

    updateHUD();
  }

  // --- COLLISION DETECTORS ---
  function checkAABBCollision(a, b) {
    const aHalfW = a.width / 2;
    const aHalfH = a.height / 2;
    const bHalfW = b.type ? b.type.width / 2 : b.width / 2;
    const bHalfH = b.type ? b.type.height / 2 : b.height / 2;

    return Math.abs(a.x - b.x) < (aHalfW + bHalfW - 6) &&
           Math.abs(a.y - b.y) < (aHalfH + bHalfH - 6);
  }

  function checkCircleCollision(player, cx, cy, radius) {
    const dx = player.x - cx;
    const dy = player.y - cy;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (player.width / 2 + radius);
  }

  // --- PARTICLE EFFECTS ---
  function createExplosion(x, y) {
    for (let i = 0; i < 30; i++) {
      particleList.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 25 + Math.random() * 20,
        color: Math.random() > 0.5 ? '#ff004d' : '#ffec27',
        size: 4 + Math.random() * 6
      });
    }
  }

  function createSparkles(x, y, color) {
    for (let i = 0; i < 12; i++) {
      particleList.push({
        x: x,
        y: y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 15 + Math.random() * 10,
        color: color,
        size: 3 + Math.random() * 4
      });
    }
  }

  // --- HUD UPDATE ---
  function updateHUD() {
    const stage = DATA.stages[currentStageIndex];
    hudStage.innerText = stage.name.split('-')[0].trim();
    hudDistance.innerText = `${(distanceMeters / 1000).toFixed(1)} KM`;
    hudScore.innerText = score.toString().padStart(6, '0');
    hudSpeed.innerText = `${Math.floor(speed * 14)} KM/H`;

    const fuelPct = Math.max(0, Math.min(100, fuel));
    fuelBarFill.style.width = `${fuelPct}%`;

    const fuelContainer = fuelBarFill.parentElement;
    if (fuelPct < 25) {
      fuelContainer.classList.add('fuel-low');
    } else {
      fuelContainer.classList.remove('fuel-low');
    }
  }

  // --- STAGE CLEAR & GAME OVER ---
  function triggerStageClear() {
    gameState = 'STAGE_CLEAR';
    playSound('correct');

    document.getElementById('clear-dist').innerText = `${(distanceMeters / 1000).toFixed(1)} KM`;
    document.getElementById('clear-score').innerText = score;
    stageClearScreen.classList.remove('hidden');
  }

  function triggerGameOver(reason) {
    gameState = 'GAME_OVER';
    playSound('gameOver');

    if (vs && vs.finish) {
      if (vs.finish(score, { distanceKm: (distanceMeters / 1000).toFixed(1) })) return;
    }

    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('road_blitz_best_score', bestScore.toString());
    }

    if (window.KAMPAI && window.KAMPAI.submitScore) {
      window.KAMPAI.submitScore(score, {
        distanceKm: (distanceMeters / 1000).toFixed(1),
        stage: currentStageIndex + 1
      });
    }

    document.getElementById('game-over-reason').innerText = reason;
    document.getElementById('final-dist').innerText = `${(distanceMeters / 1000).toFixed(1)} KM`;
    document.getElementById('final-score').innerText = score;
    document.getElementById('best-score').innerText = bestScore;

    gameOverScreen.classList.remove('hidden');
  }

  // --- RENDERING PIPELINE ---
  function render() {
    ctx.clearRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

    const stage = DATA.stages[currentStageIndex];
    const roadLeft = (CONFIG.canvasWidth - CONFIG.roadWidth) / 2;

    // 1. Background / Shoulders
    ctx.fillStyle = stage.bgColor;
    ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);

    // Green Grass Shoulders
    ctx.fillStyle = stage.shoulderColor;
    ctx.fillRect(roadLeft - CONFIG.shoulderWidth, 0, CONFIG.shoulderWidth, CONFIG.canvasHeight);
    ctx.fillRect(roadLeft + CONFIG.roadWidth, 0, CONFIG.shoulderWidth, CONFIG.canvasHeight);

    // Shoulder Stripe Guardrails
    ctx.fillStyle = stage.shoulderPatternColor;
    for (let y = -CONFIG.stripeLength + roadScrollOffset; y < CONFIG.canvasHeight; y += CONFIG.stripeLength * 2) {
      ctx.fillRect(roadLeft - CONFIG.shoulderWidth, y, CONFIG.shoulderWidth, CONFIG.stripeLength);
      ctx.fillRect(roadLeft + CONFIG.roadWidth, y, CONFIG.shoulderWidth, CONFIG.stripeLength);
    }

    // 2. Main Asphalt Road
    ctx.fillStyle = stage.asphaltColor;
    ctx.fillRect(roadLeft, 0, CONFIG.roadWidth, CONFIG.canvasHeight);

    // Road White/Yellow Dashed Lane Lines
    const laneWidth = (CONFIG.roadWidth - CONFIG.shoulderWidth * 2) / CONFIG.laneCount;
    ctx.fillStyle = stage.stripeColor;

    for (let l = 1; l < CONFIG.laneCount; l++) {
      const stripeX = roadLeft + CONFIG.shoulderWidth + l * laneWidth - 2;
      for (let y = -CONFIG.stripeLength + roadScrollOffset; y < CONFIG.canvasHeight; y += (CONFIG.stripeLength + CONFIG.stripeGap)) {
        ctx.fillRect(stripeX, y, 4, CONFIG.stripeLength);
      }
    }

    // 3. Hazards (Oil Slicks)
    for (const h of hazardList) {
      drawOilSlick(ctx, h.x, h.y, h.width, h.height);
    }

    // 4. Pickups (Fuel Cans)
    for (const p of pickupList) {
      drawFuelCan(ctx, p.x, p.y, p.size);
    }

    // 5. Traffic Rival Vehicles
    for (const t of trafficList) {
      if (t.type.id === 'cargo_truck') {
        drawPixelTruck(ctx, t.x, t.y, t.type.width, t.type.height, t.type, stage.headlights);
      } else {
        drawPixelCar(ctx, t.x, t.y, t.type.width, t.type.height, t.type, false, stage.headlights);
      }
    }

    // 6. Player Vehicle
    ctx.save();
    if (player.isSpinning) {
      ctx.translate(player.x, player.y);
      ctx.rotate(player.spinAngle);
      drawPixelCar(ctx, 0, 0, player.width, player.height, DATA.playerColors, true, stage.headlights);
    } else {
      drawPixelCar(ctx, player.x, player.y, player.width, player.height, DATA.playerColors, true, stage.headlights);
    }
    ctx.restore();

    // 7. Particles
    for (const p of particleList) {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // 8. Night Stage Overlay Gradient
    if (stage.darknessOverlay > 0) {
      ctx.fillStyle = `rgba(5, 5, 16, ${stage.darknessOverlay})`;
      ctx.fillRect(0, 0, CONFIG.canvasWidth, CONFIG.canvasHeight);
    }
  }

  // --- GAME LOOP ---
  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }

  // --- INPUT BINDINGS ---
  function setupInputListeners() {
    window.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.boost = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.brake = true;
      if (e.key === 'p' || e.key === 'P') togglePause();
    });

    window.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.boost = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.brake = false;
    });

    // Touch Buttons
    bindTouch('btn-touch-left', (down) => keys.left = down);
    bindTouch('btn-touch-right', (down) => keys.right = down);
    bindTouch('btn-touch-boost', (down) => keys.boost = down);
    bindTouch('btn-touch-brake', (down) => keys.brake = down);

    // UI Buttons
    btnStartGame.addEventListener('click', startGame);
    if (btnVersus) {
      btnVersus.addEventListener('click', () => {
        if (vs) vs.openMenu();
      });
    }
    btnResumeGame.addEventListener('click', togglePause);
    btnRetryGame.addEventListener('click', startGame);

    btnNextStage.addEventListener('click', () => {
      currentStageIndex = (currentStageIndex + 1) % DATA.stages.length;
      resetPlayerPosition();
      gameState = 'PLAYING';
      stageClearScreen.classList.add('hidden');
    });

    btnSoundToggle.addEventListener('click', () => {
      soundMuted = !soundMuted;
      btnSoundToggle.innerText = soundMuted ? '🔇 MUTED' : '🔊 SOUND';
    });
  }

  function bindTouch(id, callback) {
    const el = document.getElementById(id);
    if (!el) return;

    el.addEventListener('touchstart', (e) => {
      e.preventDefault();
      callback(true);
    });
    el.addEventListener('touchend', (e) => {
      e.preventDefault();
      callback(false);
    });
    el.addEventListener('mousedown', (e) => {
      e.preventDefault();
      callback(true);
    });
    el.addEventListener('mouseup', (e) => {
      e.preventDefault();
      callback(false);
    });
  }

  function togglePause() {
    if (gameState === 'PLAYING') {
      gameState = 'PAUSED';
      pauseScreen.classList.remove('hidden');
    } else if (gameState === 'PAUSED') {
      gameState = 'PLAYING';
      pauseScreen.classList.add('hidden');
    }
  }

  // --- BOOTSTRAP ---
  setupInputListeners();
  requestAnimationFrame(loop);
})();
