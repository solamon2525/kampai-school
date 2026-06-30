// game.js – Core game logic for Math Quest 3D (placeholder implementation)

(function () {
  // Ensure KAMPAI SDK presence (fallback stub already loaded if missing)
  const KAMPAI = window.KAMPAI || {
    onReady: (cb) => cb({ student: { name: "Guest" }, stats: {}, leaderboard: [] }),
    submitScore: (score, meta) => console.log("Score submitted", score, meta),
    sound: {
      unlock: () => console.log("Sound unlocked"),
      correct: () => console.log("Correct sound"),
      wrong: () => console.log("Wrong sound"),
      gameOver: () => console.log("Game over sound"),
      bgmStart: () => console.log("BGM start"),
      bgmStop: () => console.log("BGM stop")
    }
  };

  // Game state
  const state = {
    started: false,
    score: 0,
    stars: 0,
    playerName: "",
    questionActive: false,
    currentQuestion: null
  };

  // UI references
  const blocker = document.getElementById("blocker");
  const startBtn = document.getElementById("start-button");
  const nameInput = document.getElementById("player-name");
  const hudScore = document.getElementById("score");
  const hudStars = document.getElementById("stars");
  const homeBtn = document.getElementById("home-button");
  const playerChip = document.getElementById("player-chip");
  const playerNameDisplay = document.getElementById("player-name-display");
  const canvas = document.getElementById("game-canvas");
  const ctx = canvas.getContext("2d");

  // Resize canvas to fill viewport
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener("resize", resizeCanvas);
  resizeCanvas();

  // Simple placeholder objects
  const player = { x: canvas.width / 2, y: canvas.height / 2, radius: 20, color: "#4facfe" };
  const numberPoints = [];
  const mathBugs = [];

  // Helper to draw a circle (placeholder for voxel objects)
  function drawCircle(obj) {
    ctx.beginPath();
    ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2);
    ctx.fillStyle = obj.color;
    ctx.fill();
  }

  // Spawn a Number Point at random location
  function spawnNumberPoint() {
    const np = {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 12,
      color: "#ffb703",
      points: window.GAME_CONFIG.pointsPerNumber
    };
    numberPoints.push(np);
  }

  // Spawn a Math Bug (enemy) – moves slowly toward player
  function spawnMathBug() {
    const mb = {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 18,
      color: "#8b0000",
      speed: 0.5
    };
    mathBugs.push(mb);
  }

  // Simple distance check
  function dist(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Game loop (placeholder – 60 FPS)
  let animationFrameId;
  function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // Draw player
    drawCircle(player);
    // Draw and update Number Points
    numberPoints.forEach((np, idx) => {
      drawCircle(np);
      // Collision with player?
      if (dist(player, np) < player.radius + np.radius) {
        state.score += np.points;
        state.stars += 1;
        hudScore.textContent = state.score;
        hudStars.textContent = `${state.stars}/` + window.GAME_CONFIG.starGoal;
        KAMPAI.sound.correct();
        // Remove collected point
        numberPoints.splice(idx, 1);
        // Spawn a new one
        spawnNumberPoint();
        // Check win condition
        if (state.stars >= window.GAME_CONFIG.starGoal) {
          winGame();
        }
      }
    });
    // Draw and update Math Bugs
    mathBugs.forEach((mb, idx) => {
      // Move toward player
      const dx = player.x - mb.x;
      const dy = player.y - mb.y;
      const len = Math.sqrt(dx * dx + dy * dy) || 1;
      mb.x += (dx / len) * mb.speed;
      mb.y += (dy / len) * mb.speed;
      drawCircle(mb);
      // Collision with player → Game Over
      if (dist(player, mb) < player.radius + mb.radius) {
        gameOver();
      }
    });
    // Continue loop if game is still running
    if (state.started) {
      animationFrameId = requestAnimationFrame(gameLoop);
    }
  }

  // Start the game
  function startGame() {
    state.started = true;
    blocker.style.display = "none";
    playerChip.classList.remove("hidden");
    playerNameDisplay.textContent = state.playerName || "Player";
    // Initial spawns
    for (let i = 0; i < 5; i++) spawnNumberPoint();
    for (let i = 0; i < 2; i++) spawnMathBug();
    KAMPAI.sound.unlock();
    KAMPAI.sound.bgmStart();
    gameLoop();
  }

  // Pause / Home button handling
  function pauseGame() {
    state.started = false;
    cancelAnimationFrame(animationFrameId);
    homeBtn.style.display = "none";
    blocker.style.display = "flex";
    // Show a simple pause UI (reuse blocker content)
    const pauseDiv = blocker.querySelector("div");
    pauseDiv.innerHTML = `
      <h2 class="text-2xl font-bold mb-4 text-center">Paused</h2>
      <button id="resume-button" class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition mb-2">Resume</button>
      <button id="exit-button" class="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition">Exit to Main</button>
    `;
    document.getElementById("resume-button").onclick = () => {
      // restore original start UI
      blocker.style.display = "none";
      state.started = true;
      homeBtn.style.display = "block";
      gameLoop();
    };
    document.getElementById("exit-button").onclick = () => {
      location.reload(); // simple reset
    };
  }

  // Game Over handling
  function gameOver() {
    state.started = false;
    cancelAnimationFrame(animationFrameId);
    KAMPAI.sound.gameOver();
    // Show Game Over UI
    blocker.style.display = "flex";
    const goDiv = blocker.querySelector("div");
    goDiv.innerHTML = `
      <h2 class="text-2xl font-bold mb-4 text-center text-red-500">Game Over</h2>
      <p class="mb-2 text-center">Score: ${state.score}</p>
      <button id="retry-button" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">Play Again</button>
    `;
    document.getElementById("retry-button").onclick = () => {
      location.reload();
    };
    // Submit score via SDK
    KAMPAI.submitScore(state.score, { mode: "standard", stars: state.stars });
  }

  // Win condition handling
  function winGame() {
    state.started = false;
    cancelAnimationFrame(animationFrameId);
    KAMPAI.sound.bgmStop();
    blocker.style.display = "flex";
    const winDiv = blocker.querySelector("div");
    winDiv.innerHTML = `
      <h2 class="text-2xl font-bold mb-4 text-center text-green-400">ยินดีด้วย! คุณคือผู้พิทักษ์คณิตศาสตร์รุ่นเยาว์</h2>
      <p class="mb-2 text-center">คะแนนรวม: ${state.score}</p>
      <button id="win-retry" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition">เล่นใหม่</button>
    `;
    document.getElementById("win-retry").onclick = () => {
      location.reload();
    };
    KAMPAI.submitScore(state.score, { mode: "win", stars: state.stars });
  }

  // Player movement – simple WASD / Arrow keys
  const keys = {};
  window.addEventListener("keydown", (e) => {
    keys[e.key] = true;
    // Home button (Esc) – pause
    if (e.key === "Escape") {
      if (state.started) pauseGame();
    }
  });
  window.addEventListener("keyup", (e) => {
    delete keys[e.key];
  });

  function updatePlayerPosition() {
    const speed = 2.5;
    if (keys["w"] || keys["ArrowUp"]) player.y -= speed;
    if (keys["s"] || keys["ArrowDown"]) player.y += speed;
    if (keys["a"] || keys["ArrowLeft"]) player.x -= speed;
    if (keys["d"] || keys["ArrowRight"]) player.x += speed;
    // Keep inside canvas bounds
    player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));
  }

  // Hook update into the loop (before drawing)
  function wrappedLoop() {
    if (state.started) updatePlayerPosition();
    gameLoop();
  }

  // Start button click handler
  startBtn.addEventListener("click", () => {
    const name = nameInput.value.trim();
    state.playerName = name || "นักคิดเลข";
    // Initialize via KAMPAI SDK
    KAMPAI.onReady((k) => {
      // Example: display student name if available
      if (k.student && k.student.name) state.playerName = k.student.name;
    });
    startGame();
    homeBtn.style.display = "block";
  });

  // Home button click – pause
  homeBtn.addEventListener("click", () => {
    if (state.started) pauseGame();
  });

  // Click-to-move (desktop) – simple teleport for demo
  canvas.addEventListener("click", (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    player.x = x;
    player.y = y;
  });

  // Touch support – tap to move
  canvas.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;
    player.x = x;
    player.y = y;
  });
})();
