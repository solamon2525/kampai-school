/* game.js — ลอจิก Blockly Interpreter และตัวจำลองหุ่นยนต์คัดแยกของ Code Craft */

// ── ตัวแปรสถานะเกม (Game State) ──
let gameState = 'menu'; // 'menu', 'playing', 'running', 'gameover'
let gameMode = 'adventure'; // 'adventure', 'time'
let currentStageIndex = 0;
let score = 0;
let lives = 0;
let timeLeft = 0;
let timerInterval = null;
let bgmPlaying = false;
let currentRng = Math.random;

// ข้อมูลเกี่ยวกับบอร์ดบล็อกคำสั่ง (Workspace)
let workspaceBlocks = []; // รายการบล็อกที่นักเรียนวางไว้
let nextBlockId = 1;

// ข้อมูลสภาพจำลองหุ่นยนต์ ณ เวลาปัจจุบัน (Simulation State)
let robot = { x: 0, y: 0, dir: 0, hasBox: false, boxColor: null };
let placedBoxes = []; // กล่องพัสดุในด่าน
let placedTargets = []; // จุดคลังแยกสี
let placedObstacles = []; // ตู้กีดขวาง

// สำหรับระบบ Interpreter ทีละสเต็ป
let programCounter = 0; // ลำดับบล็อกที่กำลังรันอยู่
let stepInterval = null;
let currentBlockRunSteps = 0; // เก็บสถิติวนลูปภายในบล็อก
let robotPathHistory = []; // ประวัติเดินของหุ่นเพื่อไว้วาดคิวอนิเมชั่น
let simulationError = null; // เก็บข้อความ Error หากหุ่นยนต์ชนหรือคีบผิดที่

// ข้อมูลนักเรียนและลีดเดอร์บอร์ด SDK
let studentProfile = null;
let bestScore = 0;
let playCount = 0;

// อ้างอิง DOM Elements
let canvas, ctx;
let scoreValEl, timerValEl, lifeContainerEl, levelBadgeEl, comboBadgeEl, toastEl;
let levelInstructionTextEl, workspaceBlocksEl, blockLimitTextEl;
let runBtnEl, clearBtnEl;

// ── บูรณาการ KampaiVersus สำหรับ 2 ผู้เล่น ──
const vs = KampaiVersus.create({
  duration: 90, // แข่งโปรแกรมภายใน 90 วินาที
  title: 'วิศวกรโค้ดดิ้งหุ่นยนต์',
  rankBy: 'score',
  onPlay: ({ rng, player }) => startVersusRound(rng, player),
  onEnd: () => {
    gameState = 'gameover';
    endGame(false);
  }
});

// ── การเริ่มต้นระบบ ──
window.onload = function() {
  canvas = document.getElementById('game-canvas');
  ctx = canvas.getContext('2d');
  
  scoreValEl = document.getElementById('score-value');
  timerValEl = document.getElementById('timer-value');
  lifeContainerEl = document.getElementById('life-container');
  levelBadgeEl = document.getElementById('level-badge');
  comboBadgeEl = document.getElementById('combo-badge');
  toastEl = document.getElementById('toast');
  
  levelInstructionTextEl = document.getElementById('level-instruction-text');
  workspaceBlocksEl = document.getElementById('workspace-blocks');
  blockLimitTextEl = document.getElementById('block-limit-text');
  runBtnEl = document.getElementById('run-btn');
  clearBtnEl = document.getElementById('clear-btn');
  
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // เชื่อมต่อ SDK
  KAMPAI.onReady(function(k) {
    studentProfile = k.student;
    KAMPAI.setSlug(window.GAME_CONFIG.SLUG);

    if (k.stats) {
      bestScore = k.stats.bestScore || 0;
      playCount = k.stats.plays || 0;
    }
    
    document.getElementById('ms-best').innerText = bestScore;
    document.getElementById('ms-plays').innerText = playCount;
    
    renderLeaderboard(k.leaderboard, 'score-list');
  });

  requestAnimationFrame(gameLoop);
};

function resizeCanvas() {
  const container = canvas.parentElement;
  const size = Math.min(container.clientWidth, container.clientHeight, 460);
  canvas.width = size;
  canvas.height = size;
}

// แสดงตารางอันดับนักเรียน (พร้อม PersonAvatar ตามกฎ DESIGN.md Rule 14.13)
function renderLeaderboard(leaderboardData, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!leaderboardData || leaderboardData.length === 0) {
    container.innerHTML = '<li class="lb-loading">ไม่มีข้อมูลอันดับ</li>';
    return;
  }

  container.innerHTML = '';
  leaderboardData.slice(0, 5).forEach((item, index) => {
    const rank = index + 1;
    const studentName = item.student_name || 'นักเรียน';
    const scoreVal = item.score || 0;
    const photoUrl = item.photo_url || '/placeholder.svg';

    const li = document.createElement('li');
    li.className = 'leaderboard-item';
    li.innerHTML = `
      <div class="lb-left">
        <span class="lb-rank lb-rank-${rank}">${rank}</span>
        <div class="person-avatar-wrapper">
          <img class="person-avatar-img" src="${photoUrl}" alt="${studentName}" onerror="this.src='/placeholder.svg';">
          <span class="lb-name">${studentName}</span>
        </div>
      </div>
      <span class="lb-score">${scoreVal} แต้ม</span>
    `;
    container.appendChild(li);
  });
}

// ── ควบคุมโหมดการเล่นเดี่ยว ──
function startGame(mode) {
  KAMPAI.sound.unlock();
  
  gameMode = mode;
  gameState = 'playing';
  score = 0;
  currentStageIndex = 0;
  workspaceBlocks = [];
  currentRng = Math.random;

  if (gameMode === 'adventure') {
    lives = window.GAME_CONFIG.LIVES;
    timeLeft = 0;
    timerValEl.parentElement.style.display = 'none';
    lifeContainerEl.style.display = 'block';
  } else {
    lives = 0;
    timeLeft = window.GAME_CONFIG.TIME_SECONDS;
    timerValEl.parentElement.style.display = 'block';
    lifeContainerEl.style.display = 'none';
    
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTime, 1000);
  }

  document.getElementById('blocker').style.display = 'none';
  document.getElementById('gameover-screen').style.display = 'none';

  KAMPAI.sound.defaultBgm(window.GAME_CONFIG.BGM);
  KAMPAI.sound.bgmStart();
  bgmPlaying = true;

  loadStage(currentStageIndex);
}

// ── เริ่มต้นโหมดแข่งขัน 2 คน ──
function startVersusRound(rng, player) {
  KAMPAI.sound.unlock();

  currentRng = rng || Math.random;
  gameMode = 'time';
  gameState = 'playing';
  score = 0;
  currentStageIndex = 0;
  workspaceBlocks = [];
  lives = 0;
  timeLeft = window.GAME_CONFIG.TIME_SECONDS;

  timerValEl.parentElement.style.display = 'block';
  lifeContainerEl.style.display = 'none';

  document.getElementById('blocker').style.display = 'none';
  document.getElementById('gameover-screen').style.display = 'none';

  KAMPAI.sound.defaultBgm(window.GAME_CONFIG.BGM);
  KAMPAI.sound.bgmStart();
  bgmPlaying = true;

  currentStage = generateRandomStage(currentStageIndex + 1, currentRng);
  loadStage(currentStageIndex);
}

// โหลดข้อมูลด่าน
function loadStage(stageIndex) {
  if (stepInterval) clearInterval(stepInterval);
  gameState = 'playing';
  simulationError = null;

  levelBadgeEl.innerText = `เลเวล ${stageIndex + 1}`;
  scoreValEl.innerText = score;
  updateLivesUI();

  let stage;
  if (gameMode === 'adventure') {
    if (stageIndex >= window.GAME_DATA.stages.length) {
      endGame(true);
      return;
    }
    stage = window.GAME_DATA.stages[stageIndex];
  } else {
    stage = generateRandomStage(stageIndex + 1, currentRng);
  }

  levelInstructionTextEl.innerHTML = `<strong>${stage.title}</strong><br>${stage.hint}`;

  // เซ็ตอัพตำแหน่งจำลองเริ่มต้น
  robot = {
    x: stage.robot.x,
    y: stage.robot.y,
    dir: stage.robot.dir,
    hasBox: false,
    boxColor: null
  };

  placedObstacles = stage.obstacles.map(o => ({ x: o.x, y: o.y }));
  placedTargets = stage.targets.map(t => ({ x: t.x, y: t.y, color: t.color }));

  // จัดการสร้างกล่องสุ่ม หรือกล่องสีฟิกซ์
  placedBoxes = stage.boxes.map(b => {
    let boxColor = b.color;
    if (boxColor === 'random') {
      // ใช้ deterministic RNG ในการสุ่มสี
      boxColor = currentRng() < 0.5 ? 'orange' : 'blue';
    }
    return { x: b.x, y: b.y, color: boxColor, active: true };
  });

  // ล้าง Workspace เฉพาะการเริ่มเลเวลใหม่ของผจญภัย
  if (gameMode === 'adventure') {
    workspaceBlocks = [];
  }
  
  updateWorkspaceUI();
  enableButtons(true);
}

function updateLivesUI() {
  if (gameMode === 'adventure') {
    let hearts = '';
    for (let i = 0; i < window.GAME_CONFIG.LIVES; i++) {
      hearts += i < lives ? '❤️' : '🖤';
    }
    lifeContainerEl.innerText = hearts;
  }
}

function updateTime() {
  if (gameState !== 'playing' && gameState !== 'running') return;
  timeLeft--;
  timerValEl.innerText = timeLeft;

  if (timeLeft <= 0) {
    clearInterval(timerInterval);
    KAMPAI.sound.timeUp();
    endGame(false);
  }
}

// ── ระบบการจัดการ UI ของ Blockly จิ๋ว ──

// เพิ่มบล็อกลง Workspace
function addBlock(type) {
  if (gameState !== 'playing') return;

  let stage = gameMode === 'adventure' ? window.GAME_DATA.stages[currentStageIndex] : currentStage;
  if (workspaceBlocks.length >= stage.maxBlocks) {
    showToast("⚠️ จำนวนบล็อกเกินขีดจำกัดของด่านนี้!");
    return;
  }

  let blockValue = null;
  if (type === 'repeat') {
    blockValue = { times: 3, action: 'move' }; // เริ่มต้นทำซ้ำ 3 ครั้ง [เดินหน้า]
  } else if (type === 'ifelse') {
    blockValue = { checkColor: 'orange', ifAction: 'left', elseAction: 'right' };
  }

  workspaceBlocks.push({
    id: nextBlockId++,
    type: type,
    value: blockValue
  });

  updateWorkspaceUI();
}

// เคลียร์ Workspace
function clearWorkspace() {
  if (gameState !== 'playing') return;
  workspaceBlocks = [];
  updateWorkspaceUI();
}

// ปรับแต่งค่าภายในบล็อก (Dropdowns)
function updateBlockValue(blockId, key, val) {
  const block = workspaceBlocks.find(b => b.id === blockId);
  if (block && block.value) {
    block.value[key] = val;
  }
}

// เลื่อนบล็อกขึ้นหรือลง หรือลบออก
function moveBlock(blockId, direction) {
  if (gameState !== 'playing') return;
  const index = workspaceBlocks.findIndex(b => b.id === blockId);
  if (index === -1) return;

  if (direction === 'up' && index > 0) {
    // สลับกับตัวก่อนหน้า
    const temp = workspaceBlocks[index];
    workspaceBlocks[index] = workspaceBlocks[index - 1];
    workspaceBlocks[index - 1] = temp;
  } else if (direction === 'down' && index < workspaceBlocks.length - 1) {
    // สลับกับตัวถัดไป
    const temp = workspaceBlocks[index];
    workspaceBlocks[index] = workspaceBlocks[index + 1];
    workspaceBlocks[index + 1] = temp;
  } else if (direction === 'delete') {
    workspaceBlocks.splice(index, 1);
  }

  updateWorkspaceUI();
}

// รีเฟรช Workspace ในฝั่ง HTML DOM
function updateWorkspaceUI() {
  let stage = gameMode === 'adventure' ? window.GAME_DATA.stages[currentStageIndex] : currentStage;
  
  // อัปเดตตัวเลขแสดงโควตาบล็อก
  const isOver = workspaceBlocks.length > stage.maxBlocks;
  blockLimitTextEl.innerHTML = `ใช้ไป <span style="font-weight:bold; color:${isOver ? 'red' : 'green'};">${workspaceBlocks.length}/${stage.maxBlocks}</span> บล็อก`;

  if (workspaceBlocks.length === 0) {
    workspaceBlocksEl.innerHTML = `
      <div class="workspace-empty">
        <span>กดปุ่มคำสั่ง (Toolbox) เพื่อวางโค้ด</span>
      </div>
    `;
    return;
  }

  workspaceBlocksEl.innerHTML = '';
  workspaceBlocks.forEach((block, index) => {
    const div = document.createElement('div');
    div.className = 'placed-block';
    div.id = `workspace-block-${block.id}`;

    let blockHTML = '';
    if (block.type === 'move') {
      blockHTML = `<div class="code-block block-action">🚶 เดินหน้า (Move)</div>`;
    } else if (block.type === 'left') {
      blockHTML = `<div class="code-block block-action">↩️ เลี้ยวซ้าย (Turn Left)</div>`;
    } else if (block.type === 'right') {
      blockHTML = `<div class="code-block block-action">↪️ เลี้ยวขวา (Turn Right)</div>`;
    } else if (block.type === 'pick') {
      blockHTML = `<div class="code-block block-action">🦾 คีบกล่อง (Pick Up)</div>`;
    } else if (block.type === 'drop') {
      blockHTML = `<div class="code-block block-action">📦 วางกล่อง (Drop)</div>`;
    } else if (block.type === 'repeat') {
      blockHTML = `
        <div class="code-block block-loop" style="display:flex; flex-wrap:wrap; gap:4px; align-items:center;">
          <span>🔁 ทำซ้ำ</span>
          <select class="block-select" onchange="updateBlockValue(${block.id}, 'times', parseInt(this.value, 10))">
            <option value="2" ${block.value.times === 2 ? 'selected' : ''}>2</option>
            <option value="3" ${block.value.times === 3 ? 'selected' : ''}>3</option>
            <option value="4" ${block.value.times === 4 ? 'selected' : ''}>4</option>
            <option value="5" ${block.value.times === 5 ? 'selected' : ''}>5</option>
          </select>
          <span>ครั้ง:</span>
          <select class="block-select" onchange="updateBlockValue(${block.id}, 'action', this.value)">
            <option value="move" ${block.value.action === 'move' ? 'selected' : ''}>เดินหน้า</option>
            <option value="left" ${block.value.action === 'left' ? 'selected' : ''}>เลี้ยวซ้าย</option>
            <option value="right" ${block.value.action === 'right' ? 'selected' : ''}>เลี้ยวขวา</option>
            <option value="pick" ${block.value.action === 'pick' ? 'selected' : ''}>คีบกล่อง</option>
            <option value="drop" ${block.value.action === 'drop' ? 'selected' : ''}>วางกล่อง</option>
          </select>
        </div>
      `;
    } else if (block.type === 'ifelse') {
      blockHTML = `
        <div class="code-block block-cond" style="display:flex; flex-direction:column; gap:4px; align-items:flex-start;">
          <div style="display:flex; gap:4px; align-items:center;">
            <span>❓ ถ้าคีบกล่องสี:</span>
            <select class="block-select" onchange="updateBlockValue(${block.id}, 'checkColor', this.value)">
              <option value="orange" ${block.value.checkColor === 'orange' ? 'selected' : ''}>ส้ม</option>
              <option value="blue" ${block.value.checkColor === 'blue' ? 'selected' : ''}>น้ำเงิน</option>
            </select>
          </div>
          <div style="display:flex; gap:4px; align-items:center; padding-left:12px; border-left:2px solid rgba(255,255,255,0.3);">
            <span>ทำ:</span>
            <select class="block-select" onchange="updateBlockValue(${block.id}, 'ifAction', this.value)">
              <option value="left" ${block.value.ifAction === 'left' ? 'selected' : ''}>เลี้ยวซ้าย</option>
              <option value="right" ${block.value.ifAction === 'right' ? 'selected' : ''}>เลี้ยวขวา</option>
              <option value="move" ${block.value.ifAction === 'move' ? 'selected' : ''}>เดินหน้า</option>
            </select>
          </div>
          <div style="display:flex; gap:4px; align-items:center; padding-left:12px; border-left:2px solid rgba(255,255,255,0.3);">
            <span>มิฉะนั้นทำ:</span>
            <select class="block-select" onchange="updateBlockValue(${block.id}, 'elseAction', this.value)">
              <option value="right" ${block.value.elseAction === 'right' ? 'selected' : ''}>เลี้ยวขวา</option>
              <option value="left" ${block.value.elseAction === 'left' ? 'selected' : ''}>เลี้ยวซ้าย</option>
              <option value="move" ${block.value.elseAction === 'move' ? 'selected' : ''}>เดินหน้า</option>
            </select>
          </div>
        </div>
      `;
    }

    div.innerHTML = `
      <span style="font-weight:bold; color:var(--color-navy); width:15px; text-align:right;">${index + 1}</span>
      ${blockHTML}
      <div class="placed-block-actions">
        <button class="action-minibtn" onclick="moveBlock(${block.id}, 'up')">▲</button>
        <button class="action-minibtn" onclick="moveBlock(${block.id}, 'down')">▼</button>
        <button class="action-minibtn delete-minibtn" onclick="moveBlock(${block.id}, 'delete')">❌</button>
      </div>
    `;
    workspaceBlocksEl.appendChild(div);
  });
}

function enableButtons(enabled) {
  runBtnEl.disabled = !enabled;
  clearBtnEl.disabled = !enabled;
}

// ── ตัวแปลภาษาและประมวลผลคำสั่งทีละขั้นตอน (Interpreter) ──
function runProgram() {
  if (gameState !== 'playing' || workspaceBlocks.length === 0) return;

  let stage = gameMode === 'adventure' ? window.GAME_DATA.stages[currentStageIndex] : currentStage;
  
  // บังคับรีเซ็ตสภาพหุ่นยนต์จำลองมาที่พิกัดตั้งต้นเพื่อรันโค้ดสะอาด
  robot = {
    x: stage.robot.x,
    y: stage.robot.y,
    dir: stage.robot.dir,
    hasBox: false,
    boxColor: null
  };
  
  // โหลดกล่องและสิ่งกีดขวางกลับมาเหมือนเริ่มด่าน
  placedObstacles = stage.obstacles.map(o => ({ x: o.x, y: o.y }));
  placedTargets = stage.targets.map(t => ({ x: t.x, y: t.y, color: t.color }));
  placedBoxes = stage.boxes.map(b => {
    let boxColor = b.color;
    if (boxColor === 'random') {
      boxColor = currentRng() < 0.5 ? 'orange' : 'blue';
    }
    return { x: b.x, y: b.y, color: boxColor, active: true };
  });

  gameState = 'running';
  enableButtons(false);

  programCounter = 0;
  currentBlockRunSteps = 0;
  simulationError = null;

  // รัน Interval ทำงานทีละขั้นตอน (550ms ต่อหนึ่งคำสั่ง)
  if (stepInterval) clearInterval(stepInterval);
  stepInterval = setInterval(executeStep, 550);
}

// รันโปรแกรมทีละขั้น
function executeStep() {
  if (gameState !== 'running') {
    clearInterval(stepInterval);
    return;
  }

  // เคลียร์ไฮไลต์บล็อกเดิมทั้งหมด
  document.querySelectorAll('.placed-block').forEach(el => el.style.border = 'none');

  if (programCounter >= workspaceBlocks.length) {
    // รันครบถ้วนคำสั่งใน Workspace แล้ว
    clearInterval(stepInterval);
    verifyExecutionResult();
    return;
  }

  const block = workspaceBlocks[programCounter];
  
  // ไฮไลต์บล็อกสีที่กำลังรันใน Sidebar เพื่อแสดง Visual Debugging
  const blockEl = document.getElementById(`workspace-block-${block.id}`);
  if (blockEl) {
    blockEl.style.border = '2.5px solid var(--color-gold)';
    blockEl.style.borderRadius = '8px';
  }

  // รันคำสั่งตามประเภทบล็อก
  let blockFinished = true; // บล็อกนี้ทำงานเสร็จในตาเดียวหรือไม่ (เช่น Actions)

  if (block.type === 'move' || block.type === 'left' || block.type === 'right' || block.type === 'pick' || block.type === 'drop') {
    executeAction(block.type);
  } else if (block.type === 'repeat') {
    // จัดการบล็อก Repeat
    if (currentBlockRunSteps < block.value.times) {
      executeAction(block.value.action);
      currentBlockRunSteps++;
      blockFinished = false; // วนลูปยังไม่ครบถ้วนห้ามข้ามบล็อก
    }
    
    if (currentBlockRunSteps >= block.value.times) {
      currentBlockRunSteps = 0;
      blockFinished = true; // ครบถ้วนแล้ว
    }
  } else if (block.type === 'ifelse') {
    // จัดการบล็อก If-Else
    // ตรวจสอบเงื่อนไข: หุ่นยนต์อุ้มกล่องพัสดุและมีสีตรงกับที่ระบุ
    const conditionMet = robot.hasBox && (robot.boxColor === block.value.checkColor);
    const actionToRun = conditionMet ? block.value.ifAction : block.value.elseAction;
    
    executeAction(actionToRun);
    blockFinished = true;
  }

  // หากเกิดข้อผิดพลาดในการจำลอง (เช่น ตกขอบหรือชนสิ่งกีดขวาง)
  if (simulationError) {
    clearInterval(stepInterval);
    KAMPAI.sound.wrong();
    showToast(`❌ ข้อผิดพลาด: ${simulationError}`);
    
    if (gameMode === 'adventure') {
      lives--;
      updateLivesUI();
      if (lives <= 0) {
        endGame(false);
      } else {
        gameState = 'playing';
        enableButtons(true);
      }
    } else {
      gameState = 'playing';
      enableButtons(true);
    }
    return;
  }

  // เลื่อนลำดับ Program Counter
  if (blockFinished) {
    programCounter++;
  }
}

// สั่งทำงานแอคชั่นของหุ่นยนต์
function executeAction(actionType) {
  if (actionType === 'move') {
    // คำนวณทิศทางการก้าวไปข้างหน้า
    let nx = robot.x;
    let ny = robot.y;

    if (robot.dir === 0) nx++;
    else if (robot.dir === 90) ny++;
    else if (robot.dir === 180) nx--;
    else if (robot.dir === 270) ny--;

    // 1. ตรวจสอบชนขอบตาราง (0 ถึง 5)
    if (nx < 0 || nx > 5 || ny < 0 || ny > 5) {
      simulationError = "หุ่นยนต์พุ่งตกตารางโรงงาน!";
      return;
    }

    // 2. ตรวจสอบชนสิ่งกีดขวาง (Obstacles)
    const hitObstacle = placedObstacles.some(o => o.x === nx && o.y === ny);
    if (hitObstacle) {
      simulationError = "หุ่นยนต์พุ่งชนตู้สินค้าสินค้า!";
      return;
    }

    // เลื่อนตำแหน่งหุ่นยนต์
    robot.x = nx;
    robot.y = ny;
    playRobotSound('move');

  } else if (actionType === 'left') {
    robot.dir = (robot.dir + 90) % 360;
    playRobotSound('turn');
  } else if (actionType === 'right') {
    robot.dir = (robot.dir - 90 + 360) % 360;
    playRobotSound('turn');
  } else if (actionType === 'pick') {
    // หุ่นยนต์พยายามคีบกล่องที่พิกัดยืนอยู่
    if (robot.hasBox) {
      simulationError = "หุ่นยนต์ไม่สามารถคีบกล่องเพิ่มได้ (อุ้มของอยู่แล้ว)";
      return;
    }

    const boxIndex = placedBoxes.findIndex(b => b.x === robot.x && b.y === robot.y && b.active);
    if (boxIndex === -1) {
      simulationError = "ไม่มีกล่องพัสดุให้คีบ ณ พิกัดนี้!";
      return;
    }

    // คีบขึ้นมา
    placedBoxes[boxIndex].active = false;
    robot.hasBox = true;
    robot.boxColor = placedBoxes[boxIndex].color;
    playRobotSound('pick');

  } else if (actionType === 'drop') {
    // หุ่นยนต์พยายามวางกล่องลง
    if (!robot.hasBox) {
      simulationError = "หุ่นยนต์ไม่ได้อุ้มกล่องพัสดุใดๆ อยู่!";
      return;
    }

    // สร้างกล่องใบใหม่มาวางลงบนพื้นพิกัดปัจจุบัน
    placedBoxes.push({
      x: robot.x,
      y: robot.y,
      color: robot.boxColor,
      active: true
    });

    robot.hasBox = false;
    robot.boxColor = null;
    playRobotSound('drop');
  }
}

// เสียงสังเคราะห์หุ่นยนต์ขยับตัว
function playRobotSound(type) {
  // บูรณาการเสียง SDK จังหวะสั้นๆ
  if (type === 'pick' || type === 'drop') {
    KAMPAI.sound.fxFlash();
  }
}

// ตรวจสอบความถูกต้องหลังโปรแกรมทำงานจบครบทุกบล็อก
function verifyExecutionResult() {
  // กฎการชนะ: กล่องพัสดุทั้งหมดจะต้องถูกวางอยู่ในพิกัดเป้าหมาย (Targets) ที่มีพิกัด X/Y และสีตรงกันทุกใบ!
  let stage = gameMode === 'adventure' ? window.GAME_DATA.stages[currentStageIndex] : currentStage;
  
  // นับกล่องที่จัดส่งสำเร็จถูกต้องตามกติกา
  let correctDeliveries = 0;
  
  placedTargets.forEach(target => {
    // หาว่ามีกล่องสีเดียวกันอยู่ตรงพิกัดเป้าหมายนั้นหรือไม่
    const hasCorrectBox = placedBoxes.some(box => 
      box.x === target.x && 
      box.y === target.y && 
      box.color === target.color && 
      box.active
    );
    if (hasCorrectBox) {
      correctDeliveries++;
    }
  });

  const allDelivered = correctDeliveries === placedTargets.length;

  if (allDelivered) {
    // ชนะผ่านด่าน!
    KAMPAI.sound.correct();
    showToast("🎉 ภารกิจจัดส่งพัสดุสำเร็จเรียบร้อย! ทำงานได้ดีมาก");
    
    score += window.GAME_CONFIG.POINTS_PER_LEVEL;
    
    // อัปเดต Versus Mode
    vs.report(score, { correct: currentStageIndex + 1 });

    setTimeout(() => {
      currentStageIndex++;
      loadStage(currentStageIndex);
    }, 1500);

  } else {
    // คำสั่งรันครบแต่ไม่มีกล่องที่ส่งถูกต้อง
    KAMPAI.sound.wrong();
    showToast("❌ พัสดุยังส่งไม่ครบ หรือคัดแยกสีไม่ถูกต้อง!");
    
    if (gameMode === 'adventure') {
      lives--;
      updateLivesUI();
      if (lives <= 0) {
        endGame(false);
      } else {
        gameState = 'playing';
        enableButtons(true);
      }
    } else {
      gameState = 'playing';
      enableButtons(true);
    }
  }
}

// ── ฟังก์ชันวาดภาพ Canvas แผนที่สายพานโรงงาน ──
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  let stage = null;
  if (gameState === 'playing' || gameState === 'running') {
    stage = gameMode === 'adventure' ? window.GAME_DATA.stages[currentStageIndex] : currentStage;
  }

  if (stage) {
    const size = window.GAME_CONFIG.GRID_SIZE;
    const cellSize = canvas.width / size;

    // 1. วาดลายพื้นหลังสายพานโรงงาน
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // เส้นตาราง Grid
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    for (let i = 0; i <= size; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, canvas.height);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(canvas.width, i * cellSize);
      ctx.stroke();
    }

    // วาดสิ่งกีดขวาง (Obstacles - กล่องสินค้าสีเทาขวางทาง)
    placedObstacles.forEach(obs => {
      // แปลงพิกัด (X, Y) โดย Y กลับหัวเหมือนกับระบบ Canvas ปกติ
      const cy = (size - 1 - obs.y) * cellSize;
      const cx = obs.x * cellSize;

      ctx.fillStyle = '#475569';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.fillRect(cx + 4, cy + 4, cellSize - 8, cellSize - 8);
      ctx.strokeRect(cx + 4, cy + 4, cellSize - 8, cellSize - 8);

      // วาดกากบาททับด้านในกำแพง
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx + 8, cy + 8);
      ctx.lineTo(cx + cellSize - 8, cy + cellSize - 8);
      ctx.moveTo(cx + cellSize - 8, cy + 8);
      ctx.lineTo(cx + 8, cy + cellSize - 8);
      ctx.stroke();
    });

    // วาดจุดส่งเป้าหมาย (Targets)
    placedTargets.forEach(target => {
      const cy = (size - 1 - target.y) * cellSize;
      const cx = target.x * cellSize;

      const colorHex = target.color === 'orange' ? '#f97316' : '#2563eb';
      const glowColor = target.color === 'orange' ? 'rgba(249, 115, 22, 0.2)' : 'rgba(37, 99, 235, 0.2)';

      // วงแหวนสีเป้าหมาย
      ctx.fillStyle = glowColor;
      ctx.strokeStyle = colorHex;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx + cellSize/2, cy + cellSize/2, cellSize * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // สัญลักษณ์ศูนย์กลางเป้า
      ctx.fillStyle = colorHex;
      ctx.beginPath();
      ctx.arc(cx + cellSize/2, cy + cellSize/2, cellSize * 0.1, 0, Math.PI * 2);
      ctx.fill();

      // ป้ายพิกัดเป้าหมายคัดแยกสี
      ctx.fillStyle = '#475569';
      ctx.font = 'bold 10px Sarabun';
      ctx.fillText(`(${target.x}, ${target.y})`, cx + 6, cy + 14);
    });

    // วาดกล่องพัสดุบนพื้น (Boxes)
    placedBoxes.forEach(box => {
      if (!box.active) return; // ถ้าหุ่นคีบอุ้มอยู่จะไม่วาดบนพื้น
      
      const cy = (size - 1 - box.y) * cellSize;
      const cx = box.x * cellSize;

      const fillHex = box.color === 'orange' ? '#f97316' : '#2563eb';
      const strokeHex = box.color === 'orange' ? '#c2410c' : '#1d4ed8';

      ctx.fillStyle = fillHex;
      ctx.strokeStyle = strokeHex;
      ctx.lineWidth = 2;
      ctx.fillRect(cx + 12, cy + 12, cellSize - 24, cellSize - 24);
      ctx.strokeRect(cx + 12, cy + 12, cellSize - 24, cellSize - 24);

      // วาดลายมัดกล่องพัสดุสีส้มทอง
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(cx + cellSize/2, cy + 12);
      ctx.lineTo(cx + cellSize/2, cy + cellSize - 12);
      ctx.moveTo(cx + 12, cy + cellSize/2);
      ctx.lineTo(cx + cellSize - 12, cy + cellSize/2);
      ctx.stroke();
    });

    // วาดตัวหุ่นยนต์ (Robot)
    const ry = (size - 1 - robot.y) * cellSize;
    const rx = robot.x * cellSize;

    ctx.save();
    ctx.translate(rx + cellSize/2, ry + cellSize/2);
    // หมุนหัวหุ่นตามมุมทิศทาง
    const angleRad = (robot.dir * Math.PI) / 180;
    ctx.rotate(-angleRad); // Canvas ชี้ลงล่างจึงใช้ลบ

    // ตัวหุ่นทรงกลมสีทองหรูหรา
    ctx.fillStyle = '#b58920';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, cellSize * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // วาดดวงตาฟ้าเรืองแสงคอมพิวเตอร์
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(cellSize * 0.12, -cellSize * 0.1, cellSize * 0.07, 0, Math.PI * 2);
    ctx.arc(cellSize * 0.12, cellSize * 0.1, cellSize * 0.07, 0, Math.PI * 2);
    ctx.fill();

    // วาดแผงรับสัญญาณหัวกบาล
    ctx.fillStyle = '#475569';
    ctx.fillRect(-cellSize * 0.18, -cellSize * 0.04, cellSize * 0.1, cellSize * 0.08);

    // วาดแขนคีบถ้าอุ้มกล่องอยู่
    if (robot.hasBox) {
      const boxColorHex = robot.boxColor === 'orange' ? '#f97316' : '#2563eb';
      
      // แขนยื่นออกมาคีบด้านหน้า
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(0, -cellSize * 0.2);
      ctx.lineTo(cellSize * 0.22, -cellSize * 0.15);
      ctx.moveTo(0, cellSize * 0.2);
      ctx.lineTo(cellSize * 0.22, cellSize * 0.15);
      ctx.stroke();

      // วาดกล่องใบจิ๋วที่หุ่นยนต์อุ้มอยู่ด้านหน้า
      ctx.fillStyle = boxColorHex;
      ctx.fillRect(cellSize * 0.18, -cellSize * 0.14, cellSize * 0.2, cellSize * 0.28);
    }

    ctx.restore();

    // แสดงพิกัดระบุตำแหน่งปัจจุบันของหุ่นยนต์
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 11px Sarabun';
    ctx.fillText(`หุ่นยนต์: (${robot.x}, ${robot.y})`, rx + 6, ry + 16);
  }

  requestAnimationFrame(gameLoop);
}

// ── ระบบการสุ่มด่านท้าทายแข่งเวลา ──
let currentStage = null;
function generateRandomStage(levelNumber, rng) {
  const rand = rng || Math.random;
  const size = 6;

  const robotX = Math.floor(rand() * 2); // 0 หรือ 1
  const robotY = Math.floor(rand() * 2); // 0 หรือ 1
  const robotDir = 0; // หันขวา

  // กล่องพัสดุ 1 กล่อง สุ่มสี
  const boxX = Math.floor(rand() * 2) + 2; // X=2 ถึง 3
  const boxY = Math.floor(rand() * 2) + 2; // Y=2 ถึง 3
  const boxColor = rand() < 0.5 ? 'orange' : 'blue';

  // เป้าหมายส่งตามพิกัดทแยง
  const targetX = Math.floor(rand() * 2) + 4; // 4 หรือ 5
  const targetY = Math.floor(rand() * 2) + 4; // 4 หรือ 5

  // วางสิ่งกีดขวางเดี่ยว
  const obstacles = [];
  if (levelNumber > 1) {
    obstacles.push({
      x: Math.floor(rand() * 2) + 2,
      y: Math.floor(rand() * 2) + 1
    });
  }

  currentStage = {
    title: `ด่านสุ่มคัดแยกหุ่นยนต์ #${levelNumber}`,
    hint: `ส่งกล่องพัสดุไปยังจุดแยกสีพิกัด (${targetX}, ${targetY}) ภายใต้จำนวนบล็อกจำกัด`,
    gridSize: size,
    maxBlocks: levelNumber <= 2 ? 6 : (levelNumber <= 5 ? 8 : 10),
    robot: { x: robotX, y: robotY, dir: robotDir },
    boxes: [{ x: boxX, y: boxY, color: boxColor }],
    targets: [{ x: targetX, y: targetY, color: boxColor }],
    obstacles: obstacles
  };

  return currentStage;
}

// แสดงประกาศข้อความ Toast
function showToast(msg) {
  toastEl.innerText = msg;
  toastEl.style.opacity = 1;
  setTimeout(() => {
    toastEl.style.opacity = 0;
  }, 2200);
}

// ── จบเกมและส่งผลคะแนน ──
function endGame(isWinComplete) {
  gameState = 'gameover';
  if (timerInterval) clearInterval(timerInterval);
  if (stepInterval) clearInterval(stepInterval);
  
  KAMPAI.sound.bgmStop();
  bgmPlaying = false;
  
  KAMPAI.sound.gameOver();

  // สรุปคะแนน
  let bonusPoints = 0;
  if (gameMode === 'time' && timeLeft > 0) {
    bonusPoints = timeLeft * window.GAME_CONFIG.BONUS_TIME_MULTIPLIER;
  }
  const finalScore = score + bonusPoints;

  // ส่งผลคะแนนให้ระบบ
  if (vs.finish(score, { correct: currentStageIndex })) return;

  KAMPAI.submitScore(finalScore, { mode: gameMode });

  document.getElementById('final-score').innerText = finalScore;
  
  let stars = '☆☆☆';
  if (finalScore >= window.GAME_CONFIG.STAR_THRESHOLDS[2]) {
    stars = '⭐⭐⭐';
  } else if (finalScore >= window.GAME_CONFIG.STAR_THRESHOLDS[1]) {
    stars = '⭐⭐☆';
  } else if (finalScore >= window.GAME_CONFIG.STAR_THRESHOLDS[0]) {
    stars = '⭐☆☆';
  }
  document.getElementById('go-stars').innerText = stars;

  const stagesCount = currentStageIndex;
  document.getElementById('go-summary').innerHTML = `
    โหมดการเล่น: ${gameMode === 'adventure' ? '🗺️ ผจญภัย' : '⏱️ แข่งเวลา'}<br>
    ผ่านด่านคัดแยกได้: <strong>${stagesCount} ด่าน</strong><br>
    คะแนนสะสม: ${score} แต้ม<br>
    ${gameMode === 'time' ? `โบนัสเวลาคงเหลือ (${timeLeft} วินาที): +${bonusPoints} แต้ม` : ''}
  `;

  if (KAMPAI.leaderboard) {
    renderLeaderboard(KAMPAI.leaderboard, 'score-list-gameover');
  }

  document.getElementById('gameover-screen').style.display = 'flex';
}

KAMPAI.onReady(function () {
  KAMPAI.sound.mountToggles();
});
