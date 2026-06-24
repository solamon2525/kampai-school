// game.js — ลอจิกการทำงานและส่วนเชื่อมต่อ Three.js + KAMPAI SDK สำหรับ Spelling Snake 3D
(function() {
  // --- Game Config & Constants ---
  const CONFIG = window.GAME_CONFIG || {
    SLUG: 'snake-3d',
    GRID_SIZE: 15,
    INITIAL_SPEED: 350,
    SPEED_UP_RATIO: 0.96,
    MIN_SPEED: 120,
    LIVES_LIMIT: 3,
    DISTRACTORS_COUNT: 4
  };
  
  // --- Game States ---
  let score = 0;
  let lives = CONFIG.LIVES_LIMIT;
  let currentCategory = null;
  let wordList = [];
  let currentWordIndex = 0;
  let targetWord = '';
  let targetMeaning = '';
  let targetEmoji = '';
  let spelledWord = '';  // ตัวอักษรที่สะกดถูกต้องแล้วในคำนี้
  
  let snake = [];        // เก็บวัตถุ 3D ปล้องงู [{ x, z, mesh }]
  let dir = { x: 0, z: -1 }; // ทิศทางปัจจุบัน (เลื้อยขึ้น)
  let nextDir = { x: 0, z: -1 };
  let lettersInMap = []; // วัตถุ 3D บล็อกตัวอักษรในสนาม [{ x, z, char, isCorrect, mesh }]
  
  let gameInterval = null;
  let speed = CONFIG.INITIAL_SPEED;
  let isPlaying = false;
  let isGameOver = false;
  let isTransitioning = false; // ระหว่างเปลี่ยนคำศัพท์
  let gameRng = Math.random;
  let animLoopRunning = false;
  let smoothLookTarget = null;
  
  // --- Three.js variables ---
  let scene, camera, renderer;
  let gridContainer, snakeContainer, lettersContainer;
  const cubesPool = [];
  
  // --- DOM Elements ---
  const scoreValEl = document.getElementById('score-val');
  const targetMeaningEl = document.getElementById('target-meaning');
  const spellingSlotsEl = document.getElementById('spelling-slots');
  const menuScreen = document.getElementById('menu-screen');
  const topicsListEl = document.getElementById('topics-list');
  const gameoverScreen = document.getElementById('gameover-screen');
  const btnRestart = document.getElementById('btn-restart');
  const btnExit = document.getElementById('btn-exit');
  
  // --- Initialize SDK onReady ---
  KAMPAI.onReady(function(K) {
    try {
      const s = K.student;
      if (s) {
        const chip = document.getElementById('player-chip');
        if (chip) {
          const av = s.photoUrl
            ? '<img src="' + s.photoUrl + '" alt="">'
            : '<div class="pc-init">' + (s.displayName || '?')[0] + '</div>';
          chip.innerHTML = av + '<span>' + s.displayName + '</span>';
          chip.style.display = 'flex';
        }
      }
      KAMPAI.sound.defaultBgm('cheerful');
    } catch(e) {
      console.warn('SDK init error', e);
    }
  });

  // --- Initial Setup ---
  initMenu();
  init3D();
  
  // --- Setup KampaiVersus ---
  const vs = KampaiVersus.create({
    duration: 60,
    title: 'งูกินคำศัพท์ 3 มิติ',
    rankBy: 'score',
    onPlay: function({ rng, player }) {
      if (!currentCategory) {
        const topics = window.GAME_TOPICS || [];
        currentCategory = topics[0]?.slug || 'animals';
      }
      menuScreen.style.display = 'none';
      gameoverScreen.style.display = 'none';
      startGame(rng);
    },
    onEnd: function() {
      isGameOver = true;
      isPlaying = false;
      clearInterval(gameInterval);
      try {
        KAMPAI.sound.bgmStop();
      } catch(_) {}
    }
  });

  // ปุ่มกดเล่น 2 คน
  const btnVersus = document.getElementById('btn-versus');
  if (btnVersus) {
    btnVersus.addEventListener('click', () => {
      try { KAMPAI.sound.unlock(); } catch(_) {}
      vs.openMenu();
    });
  }
  
  // UI Actions
  btnRestart.addEventListener('click', () => {
    try { KAMPAI.sound.unlock(); } catch(_) {}
    gameoverScreen.style.display = 'none';
    startGame();
  });
  
  btnExit.addEventListener('click', () => {
    try { KAMPAI.sound.unlock(); } catch(_) {}
    try { KAMPAI.goHome(); } catch(_) { history.back(); }
  });
  
  // --- Setup Topic Selection Menu ---
  function initMenu() {
    topicsListEl.innerHTML = '';
    const topics = window.GAME_TOPICS || [];
    topics.forEach(t => {
      const btn = document.createElement('div');
      btn.className = 'topic-btn';
      btn.innerHTML = `
        <div class="topic-icon">${t.icon}</div>
        <div class="topic-info">
          <div class="topic-name">${t.title}</div>
          <div class="topic-count">${t.count} คำศัพท์</div>
        </div>
      `;
      btn.addEventListener('click', () => {
        try { KAMPAI.sound.unlock(); } catch(_) {}
        currentCategory = t.slug;
        wordList = shuffle([...window.GAME_DATA[t.slug]]);
        menuScreen.style.display = 'none';
        startGame();
      });
      topicsListEl.appendChild(btn);
    });
    
    // Hide D-pad in menu
    document.getElementById('dpad').style.display = 'none';
  }
  
  // --- Start / Reset Game ---
  function startGame(rng) {
    gameRng = rng || Math.random;
    score = 0;
    if (smoothLookTarget) {
      smoothLookTarget.set(0, 0, 0);
    }
    lives = CONFIG.LIVES_LIMIT;
    currentWordIndex = 0;
    speed = CONFIG.INITIAL_SPEED;
    isGameOver = false;
    isPlaying = true;
    
    updateScoreUI();
    updateLivesUI();
    
    // Show touch controls if mobile/touch active
    document.getElementById('dpad').style.display = ('ontouchstart' in window) ? 'grid' : 'none';
    
    try {
      KAMPAI.sound.bgmStart();
    } catch(_) {}
    
    if (!currentCategory) {
      const topics = window.GAME_TOPICS || [];
      currentCategory = topics[0]?.slug || 'animals';
    }
    wordList = shuffle([...window.GAME_DATA[currentCategory]]);
    
    nextWord();
    if (!animLoopRunning) {
      animate();
    }
  }
  
  // --- Load Next Word to Spell ---
  function nextWord() {
    if (currentWordIndex >= wordList.length) {
      // เล่นครบทุกคำในหมวดแล้ว -> วนคำใหม่
      wordList = shuffle([...window.GAME_DATA[currentCategory]]);
      currentWordIndex = 0;
    }
    
    const wordData = wordList[currentWordIndex];
    targetWord = wordData.en.toUpperCase();
    targetMeaning = wordData.th;
    targetEmoji = wordData.emoji;
    spelledWord = '';
    
    targetMeaningEl.innerHTML = `${targetEmoji} ${targetMeaning}`;
    buildSpellingSlots();
    
    // รีเซ็ตงู
    resetSnake();
    
    // สปอว์นบล็อกตัวอักษร
    spawnLetters();
    
    // เริ่มลูป tick
    startTickLoop();
    isTransitioning = false;
  }
  
  // --- Build GUI Letter Slots ---
  function buildSpellingSlots() {
    spellingSlotsEl.innerHTML = '';
    for (let i = 0; i < targetWord.length; i++) {
      const slot = document.createElement('div');
      slot.className = 'letter-slot';
      slot.id = `slot-${i}`;
      slot.textContent = targetWord[i];
      spellingSlotsEl.appendChild(slot);
    }
  }
  
  // --- Update GUI Lives (Hearts) ---
  function updateLivesUI() {
    for (let i = 1; i <= 3; i++) {
      const heart = document.getElementById(`h-${i}`);
      if (heart) {
        if (i <= lives) {
          heart.classList.remove('lost');
        } else {
          heart.classList.add('lost');
        }
      }
    }
  }
  
  // --- Update GUI Score ---
  function updateScoreUI() {
    scoreValEl.textContent = String(score).padStart(4, '0');
  }
  
  // --- Setup Snake Body & Head ---
  function resetSnake() {
    // ลบ meshes งูเก่าออกจาก Container
    while (snakeContainer.children.length > 0) {
      snakeContainer.remove(snakeContainer.children[0]);
    }
    
    snake = [];
    dir = { x: 0, z: -1 };
    nextDir = { x: 0, z: -1 };
    
    // จุดศูนย์กลางสนาม
    const mid = Math.floor(CONFIG.GRID_SIZE / 2);
    
    // สร้างหัวงู (Segment 0)
    createSnakeSegment(mid, mid, true);
    
    // สร้างหางงูเริ่มต้นอีก 2 ปล้อง
    createSnakeSegment(mid, mid + 1, false);
    createSnakeSegment(mid, mid + 2, false);
  }
  
  function createSnakeSegment(x, z, isHead = false) {
    const size = isHead ? 0.95 : 0.85;
    const geo = new THREE.BoxGeometry(size, size, size);
    
    // Minecraft Snake colors
    const mat = new THREE.MeshPhongMaterial({
      color: isHead ? 0x2e7d32 : 0x7cb342, // เขียวเข้ม (หัว) / เขียวสว่าง (หาง)
      flatShading: true,
      shininess: 10
    });
    
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    // แปลงพิกัดกริด (0 ถึง GridSize-1) -> พิกัด 3D World (0,0 ตรงกลางกริด)
    const worldX = x - CONFIG.GRID_SIZE / 2 + 0.5;
    const worldZ = z - CONFIG.GRID_SIZE / 2 + 0.5;
    
    mesh.position.set(worldX, isHead ? 0.48 : 0.43, worldZ);
    
    // หากเป็นหัว ให้วาดบล็อกตา 3D
    if (isHead) {
      const eyeGeo = new THREE.BoxGeometry(0.18, 0.18, 0.18);
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
      const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
      
      const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
      leftEye.position.set(-0.35, 0.2, -0.4);
      mesh.add(leftEye);
      
      const leftPupil = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), pupilMat);
      leftPupil.position.set(0, 0, -0.06);
      leftEye.add(leftPupil);
      
      const rightEye = leftEye.clone();
      rightEye.position.x = 0.35;
      mesh.add(rightEye);
    }
    
    snakeContainer.add(mesh);
    
    // แทรกหัวไว้หน้าสุด หรือ ต่อท้ายหาง
    if (isHead) {
      snake.unshift({ x, z, mesh });
    } else {
      snake.push({ x, z, mesh });
    }
  }
  
  // --- Spawn spelling blocks on Map ---
  function spawnLetters() {
    // ลบตัวอักษรเก่า
    while (lettersContainer.children.length > 0) {
      lettersContainer.remove(lettersContainer.children[0]);
    }
    lettersInMap = [];
    
    // หาตัวสะกดที่ต้องกินถัดไป
    const nextCharIndex = spelledWord.length;
    if (nextCharIndex >= targetWord.length) return;
    const correctChar = targetWord[nextCharIndex];
    
    // รวบรวมตัวอักษรที่จะสปอว์น (อักษรถูก + อักษรหลอกอื่นๆ)
    const lettersToSpawn = [correctChar];
    
    // สุ่มตัวอักษรหลอก A-Z ที่ไม่ใช่ตัวสะกดปัจจุบัน
    while (lettersToSpawn.length < 1 + CONFIG.DISTRACTORS_COUNT) {
      const randomChar = String.fromCharCode(65 + Math.floor(gameRng() * 26));
      if (randomChar !== correctChar) {
        lettersToSpawn.push(randomChar);
      }
    }
    
    // เพิ่มตัวอักษรตัวสะกดลำดับถัดไปอีก (เช่น เผื่อสปอว์นตัวอักษรถูกซ้ำในตารางให้เดินเก็บง่าย)
    if (gameRng() < 0.5 && targetWord.length > 1) {
      lettersToSpawn.push(correctChar);
    }
    
    // ค้นหาตำแหน่งพิกัดว่างบนกริดแผนที่
    const occupiedPositions = new Set();
    snake.forEach(seg => occupiedPositions.add(`${seg.x},${seg.z}`));
    
    lettersToSpawn.forEach(char => {
      let x, z, key;
      let foundEmpty = false;
      let attempts = 0;
      
      while (!foundEmpty && attempts < 100) {
        attempts++;
        x = Math.floor(gameRng() * CONFIG.GRID_SIZE);
        z = Math.floor(gameRng() * CONFIG.GRID_SIZE);
        key = `${x},${z}`;
        
        // ต้องไม่อยู่บนตัวงู และไม่อยู่ชนกับตัวอักษรอื่น
        if (!occupiedPositions.has(key)) {
          occupiedPositions.add(key);
          foundEmpty = true;
        }
      }
      
      if (foundEmpty) {
        createLetterBox(x, z, char, char === correctChar);
      }
    });
  }
  
  // --- Create Hovering 3D Letter Box ---
  function createLetterBox(x, z, char, isCorrect) {
    const geo = new THREE.BoxGeometry(0.85, 0.85, 0.85);
    
    // สร้าง CanvasTexture เพื่อพ่นตัวอักษรลงบนด้านของกล่อง
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    
    // ระบายพื้นหลังกล่อง (สไตล์กล่องไม้ Minecraft บอร์ดเหลืองสลักอักษรดำ)
    ctx.fillStyle = isCorrect ? '#f57c00' : '#455a64'; // ตัวถูกสีส้มแดง / ตัวผิดสีเทาน้ำเงิน
    ctx.fillRect(0, 0, 128, 128);
    
    // วาดขอบเหลี่ยม
    ctx.lineWidth = 10;
    ctx.strokeStyle = isCorrect ? '#ffd54f' : '#90a4ae';
    ctx.strokeRect(5, 5, 118, 118);
    
    // วาดตัวอักษร
    ctx.font = 'bold 72px Courier New, monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'black';
    ctx.shadowBlur = 4;
    ctx.fillText(char, 64, 64);
    
    const texture = new THREE.CanvasTexture(canvas);
    const mat = new THREE.MeshPhongMaterial({
      map: texture,
      flatShading: true,
      shininess: 30
    });
    
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    
    const worldX = x - CONFIG.GRID_SIZE / 2 + 0.5;
    const worldZ = z - CONFIG.GRID_SIZE / 2 + 0.5;
    mesh.position.set(worldX, 0.6, worldZ);
    
    // สร้างดวงไฟอ่อนๆ ลอยใต้บล็อกอักษร
    const hoverGroup = new THREE.Group();
    hoverGroup.add(mesh);
    hoverGroup.position.y = 0;
    lettersContainer.add(hoverGroup);
    
    lettersInMap.push({
      x, z, char, isCorrect,
      mesh: hoverGroup,
      actualMesh: mesh,
      createdTime: Date.now() + gameRng() * 100
    });
  }
  
  // --- Game Tick: เคลื่อนที่งูทีละจังหวะ ---
  function gameTick() {
    if (!isPlaying || isGameOver || isTransitioning) return;
    
    // ทิศทางถัดไปที่จะเคลื่อน
    dir = nextDir;
    
    // คำนวณพิกัดหัวงูใหม่
    const head = snake[0];
    const newX = head.x + dir.x;
    const newZ = head.z + dir.z;
    
    // 1. ตรวจสอบการชนขอบสนาม
    if (newX < 0 || newX >= CONFIG.GRID_SIZE || newZ < 0 || newZ >= CONFIG.GRID_SIZE) {
      handleCrash();
      return;
    }
    
    // 2. ตรวจสอบการชนหางตัวเอง
    // ข้ามหางปล้องสุดท้าย เพราะจะหดหนีทันที
    for (let i = 0; i < snake.length - 1; i++) {
      if (snake[i].x === newX && snake[i].z === newZ) {
        handleCrash();
        return;
      }
    }
    
    // 3. ตรวจสอบการชน / กินตัวอักษร
    let ateLetter = false;
    let hitIndex = -1;
    
    for (let i = 0; i < lettersInMap.length; i++) {
      const l = lettersInMap[i];
      if (l.x === newX && l.z === newZ) {
        hitIndex = i;
        break;
      }
    }
    
    if (hitIndex >= 0) {
      const targetL = lettersInMap[hitIndex];
      if (targetL.isCorrect) {
        // สะกดตัวถัดไปถูกต้อง!
        spelledWord += targetL.char;
        
        // อัปเดตสล็อตตัวอักษรใน HTML
        const slotEl = document.getElementById(`slot-${spelledWord.length - 1}`);
        if (slotEl) slotEl.classList.add('filled');
        
        // เล่นเสียงถูกต้อง
        try { KAMPAI.sound.correct(); } catch(_) {}
        
        // อนิมชันงูกินคำ (หัวงูเติบโต)
        animateEat(snake[0].mesh);
        
        // งูจะโตขึ้น (ตัวยาวขึ้น 1 ปล้อง)
        ateLetter = true;
        
        // ลบอักษรที่กิน
        lettersContainer.remove(targetL.mesh);
        lettersInMap.splice(hitIndex, 1);
        
        // ตรวจสอบว่าสะกดครบคำเรียบร้อย
        if (spelledWord === targetWord) {
          handleWordSpelledComplete();
          return;
        } else {
          // สปอว์นอักษรถัดไป
          spawnLetters();
        }
      } else {
        // กินผิดตัว!
        try { KAMPAI.sound.wrong(); } catch(_) {}
        flashSnakeRed();
        
        // เสียหัวใจ 1 ดวง
        lives--;
        updateLivesUI();
        
        // ลบอักษรที่ผิด
        lettersContainer.remove(targetL.mesh);
        lettersInMap.splice(hitIndex, 1);
        
        if (lives <= 0) {
          endGame();
          return;
        }
      }
    }
    
    // เคลื่อนย้ายหางงูตามลำดับ
    const tailMesh = snake[snake.length - 1].mesh;
    
    if (!ateLetter) {
      // หดหาง: ดึงตำแหน่ง mesh หางมาใช้กับหัวใหม่
      const tail = snake.pop();
      tail.x = newX;
      tail.z = newZ;
      
      const worldX = newX - CONFIG.GRID_SIZE / 2 + 0.5;
      const worldZ = newZ - CONFIG.GRID_SIZE / 2 + 0.5;
      tail.mesh.position.set(worldX, 0.43, worldZ);
      
      // อัปเดตขนาดปล้องอื่นๆ ให้ดูเป็นหางเล็กลงตามปลาย
      snake.unshift(tail);
    } else {
      // โตขึ้น: สร้างปล้องใหม่ขึ้นที่หัว
      createSnakeSegment(newX, newZ, true);
      // เปลี่ยนหัวเก่าให้กลายเป็นปล้องหาง (ขนาดเล็กลง เปลี่ยนวัสดุสี)
      const oldHead = snake[1];
      oldHead.mesh.scale.set(0.9, 0.9, 0.9);
      oldHead.mesh.material.color.setHex(0x7cb342); // เปลี่ยนสี
      
      // เอาดวงตาของหัวเก่าออก
      while(oldHead.mesh.children.length > 0) {
        oldHead.mesh.remove(oldHead.mesh.children[0]);
      }
    }
    
    // เคลื่อนย้าย Mesh หัวงูไปยังพิกัดใหม่
    const worldX = newX - CONFIG.GRID_SIZE / 2 + 0.5;
    const worldZ = newZ - CONFIG.GRID_SIZE / 2 + 0.5;
    snake[0].mesh.position.set(worldX, 0.48, worldZ);
    
    // หมุนหัวงูตามทิศทางเลื้อย
    const headMesh = snake[0].mesh;
    if (dir.x === 1) headMesh.rotation.y = -Math.PI / 2;
    else if (dir.x === -1) headMesh.rotation.y = Math.PI / 2;
    else if (dir.z === 1) headMesh.rotation.y = Math.PI;
    else if (dir.z === -1) headMesh.rotation.y = 0;
    
    // รีเฟรชความกว้าง / ปล้อง
    refreshSnakeBodyScaling();
  }
  
  function refreshSnakeBodyScaling() {
    for (let i = 1; i < snake.length; i++) {
      const mesh = snake[i].mesh;
      const scale = 0.9 - (i / snake.length) * 0.3; // ยิ่งใกล้ปลาย ยิ่งเล็กลง
      mesh.scale.set(scale, scale, scale);
    }
  }
  
  // --- อนิเมชันเมื่อกินตัวอักษร ---
  function animateEat(headMesh) {
    let t = 0;
    function pulse() {
      t += 0.15;
      const scale = 1.0 + Math.sin(t) * 0.25;
      headMesh.scale.set(scale, scale, scale);
      if (t < Math.PI) {
        requestAnimationFrame(pulse);
      } else {
        headMesh.scale.set(1.0, 1.0, 1.0);
      }
    }
    pulse();
  }
  
  // --- งูกระพริบสีแดงเมื่อผิดพลาด ---
  function flashSnakeRed() {
    snake.forEach(seg => {
      seg.mesh.material.color.setHex(0xef5350); // เปลี่ยนเป็นสีแดง
      setTimeout(() => {
        // ดีดสีดั้งเดิมกลับคืน
        const isHead = (seg === snake[0]);
        seg.mesh.material.color.setHex(isHead ? 0x2e7d32 : 0x7cb342);
      }, 500);
    });
  }
  
  // --- ชนขอบหรือชนหางตัวเอง ---
  function handleCrash() {
    try { KAMPAI.sound.wrong(); } catch(_) {}
    flashSnakeRed();
    
    lives--;
    updateLivesUI();
    
    if (lives <= 0) {
      endGame();
      return;
    }
    
    // สั่นหัวและรีเซ็ตตำแหน่งงู
    isTransitioning = true;
    clearInterval(gameInterval);
    
    setTimeout(() => {
      resetSnake();
      spawnLetters();
      startTickLoop();
      isTransitioning = false;
    }, 1000);
  }
  
  // --- ชนะ สะกดครบคำศัพท์ ---
  function handleWordSpelledComplete() {
    isTransitioning = true;
    clearInterval(gameInterval);
    
    score += 10;
    updateScoreUI();
    
    if (vs) {
      vs.report(score, { correct: currentWordIndex + 1 });
    }
    
    // เฉลิมฉลองเรืองแสงงู
    let flashCount = 0;
    const interval = setInterval(() => {
      flashCount++;
      snake.forEach(seg => {
        seg.mesh.material.color.setHex(flashCount % 2 === 0 ? 0xffd54f : 0x2e7d32); // สลับเหลือง-เขียว
      });
      if (flashCount >= 6) {
        clearInterval(interval);
        // ดีดสีกลับ
        snake.forEach((seg, i) => seg.mesh.material.color.setHex(i === 0 ? 0x2e7d32 : 0x7cb342));
        
        // เด้งไปคำถัดไป
        currentWordIndex++;
        
        // เพิ่มความเร็วเล็กน้อย
        speed = Math.max(CONFIG.MIN_SPEED, speed * CONFIG.SPEED_UP_RATIO);
        
        nextWord();
      }
    }, 150);
  }
  
  // --- Game Over ---
  function endGame() {
    isGameOver = true;
    isPlaying = false;
    clearInterval(gameInterval);
    
    try {
      KAMPAI.sound.bgmStop();
      KAMPAI.sound.gameOver();
    } catch(_) {}
    
    // อนิมชันระเบิดหางงูปลิว
    animateCrashExplosion();
    
    // บันทึกคะแนนผ่าน SDK / Versus
    if (vs && vs.finish(score, { correct: currentWordIndex })) {
      return;
    }
    
    try {
      KAMPAI.submitScore(score, {
        mode: 'snake-3d',
        category: currentCategory,
        words: currentWordIndex
      });
    } catch(_) {}
    
    document.getElementById('go-score').innerHTML = `คะแนนที่คุณทำได้: <b>${score}</b> แต้ม`;
    gameoverScreen.style.display = 'flex';
    document.getElementById('dpad').style.display = 'none';
  }
  
  // อนิเมชันงูแตกกระจาย
  function animateCrashExplosion() {
    snake.forEach((seg, i) => {
      setTimeout(() => {
        // ให้แต่ละปล้องร่วงหล่น/หมุนสลาย
        let t = 0;
        const vx = (Math.random() - 0.5) * 0.2;
        const vy = Math.random() * 0.15 + 0.05;
        const vz = (Math.random() - 0.5) * 0.2;
        
        function step() {
          t++;
          seg.mesh.position.x += vx;
          seg.mesh.position.y += vy - t * 0.01;
          seg.mesh.position.z += vz;
          seg.mesh.rotation.x += 0.1;
          seg.mesh.rotation.y += 0.1;
          
          if (seg.mesh.position.y > -2) {
            requestAnimationFrame(step);
          } else {
            snakeContainer.remove(seg.mesh);
          }
        }
        step();
      }, i * 80);
    });
  }
  
  // --- Start Game Ticker ---
  function startTickLoop() {
    clearInterval(gameInterval);
    gameInterval = setInterval(gameTick, speed);
  }
  
  // --- Keyboard & Touch handlers ---
  window.addEventListener('keydown', e => {
    if (!isPlaying || isGameOver || isTransitioning) return;
    
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      if (dir.z !== 1) nextDir = { x: 0, z: -1 };
    } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
      if (dir.z !== -1) nextDir = { x: 0, z: 1 };
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      if (dir.x !== 1) nextDir = { x: -1, z: 0 };
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      if (dir.x !== -1) nextDir = { x: 1, z: 0 };
    }
  });
  
  // Touch controls
  const addDpadListener = (id, targetDir) => {
    const el = document.getElementById(id);
    if (el) {
      const handlePress = e => {
        e.preventDefault();
        if (!isPlaying || isGameOver || isTransitioning) return;
        // ตรวจสอบห้ามสวนทิศ
        if (targetDir.x !== 0 && dir.x === -targetDir.x) return;
        if (targetDir.z !== 0 && dir.z === -targetDir.z) return;
        nextDir = targetDir;
      };
      el.addEventListener('touchstart', handlePress, { passive: false });
      el.addEventListener('mousedown', handlePress);
    }
  };
  
  addDpadListener('dp-up', { x: 0, z: -1 });
  addDpadListener('dp-down', { x: 0, z: 1 });
  addDpadListener('dp-left', { x: -1, z: 0 });
  addDpadListener('dp-right', { x: 1, z: 0 });
  
  // --- Three.js Engine Setup ---
  function init3D() {
    const container = document.getElementById('canvas-container');
    
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x80deea); // สีฟ้าสว่าง (ท้องฟ้า Minecraft)
    scene.fog = new THREE.FogExp2(0x80deea, 0.05); // หมอกเพิ่มมิติ
    
    // Camera
    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
    // วางมุมกล้องเฉียงจากด้านบนส่องลงมา (isometric style) - ปรับตำแหน่งให้กว้างขึ้นสำหรับแผนที่ 19x19
    camera.position.set(0, 17, 13);
    camera.lookAt(0, 0, -1);
    
    // ตั้งค่าเป้าหมายการหันกล้องติดตาม
    smoothLookTarget = new THREE.Vector3(0, 0, 0);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    
    // Containers
    gridContainer = new THREE.Group();
    scene.add(gridContainer);
    
    snakeContainer = new THREE.Group();
    scene.add(snakeContainer);
    
    lettersContainer = new THREE.Group();
    scene.add(lettersContainer);
    
    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 22, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 40;
    const d = 14; // ขยายระยะเงาเพื่อให้ครอบคลุมกริดขนาด 19x19
    dirLight.shadow.camera.left = -d;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = -d;
    scene.add(dirLight);
    
    // วาดพื้นตาราง Grass blocks
    buildVoxelFloor();
    
    // วาดขอบกำแพงรอบสนาม
    buildBoundaryWalls();
    
    // Window resize
    window.addEventListener('resize', onWindowResize, false);
  }
  
  function buildVoxelFloor() {
    const geo = new THREE.BoxGeometry(1, 0.3, 1);
    
    // Grass colors
    const grassDark = new THREE.MeshPhongMaterial({ color: 0x5d4037, flatShading: true }); // ดิน
    const grassLight = new THREE.MeshPhongMaterial({ color: 0x8bc34a, flatShading: true }); // หญ้าสว่าง
    const grassAlt = new THREE.MeshPhongMaterial({ color: 0x9ccc65, flatShading: true });   // หญ้าเข้ม
    
    for (let r = 0; r < CONFIG.GRID_SIZE; r++) {
      for (let c = 0; c < CONFIG.GRID_SIZE; c++) {
        // วาดสลับสีเขียวอ่อน/เข้ม
        const isAlt = (r + c) % 2 === 0;
        const mat = isAlt ? grassLight : grassAlt;
        
        const mesh = new THREE.Mesh(geo, mat);
        mesh.receiveShadow = true;
        
        const worldX = c - CONFIG.GRID_SIZE / 2 + 0.5;
        const worldZ = r - CONFIG.GRID_SIZE / 2 + 0.5;
        mesh.position.set(worldX, -0.15, worldZ);
        
        gridContainer.add(mesh);
      }
    }
  }
  
  function buildBoundaryWalls() {
    const size = CONFIG.GRID_SIZE;
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshPhongMaterial({ color: 0x78909c, flatShading: true }); // กำแพงหิน
    
    const placeWall = (x, z) => {
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      
      const worldX = x - size / 2 + 0.5;
      const worldZ = z - size / 2 + 0.5;
      mesh.position.set(worldX, 0.5, worldZ);
      
      gridContainer.add(mesh);
    };
    
    // วาดแนวนอน (บน/ล่าง) นอกขอบกริดเล็กน้อย
    for (let c = -1; c <= size; c++) {
      placeWall(c, -1);
      placeWall(c, size);
    }
    // วาดแนวตั้ง (ซ้าย/ขวา)
    for (let r = 0; r < size; r++) {
      placeWall(-1, r);
      placeWall(size, r);
    }
  }
  
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  }
  
  // --- Render Loop ---
  function animate() {
    if (!isPlaying && !isGameOver) {
      animLoopRunning = false;
      return;
    }
    animLoopRunning = true;
    requestAnimationFrame(animate);
    
    // โยนตัวอักษรลอยขึ้นลงเบาๆ (ไม่มีการหมุน เพื่อให้อ่านง่ายตลอดเวลา)
    const time = Date.now();
    lettersInMap.forEach(l => {
      if (l.mesh) {
        l.mesh.position.y = Math.sin((time + l.createdTime) * 0.003) * 0.12;
      }
    });
    
    // กล้องไม่ขยับตำแหน่ง แต่อินเตอร์โพลาร์ตเป้าหมายการหันมองตามหัวงูอย่างนุ่มนวล เพื่อแก้ปัญหากล้องกระตุก
    if (snake.length > 0 && smoothLookTarget) {
      const headPos = snake[0].mesh.position;
      smoothLookTarget.x += (headPos.x - smoothLookTarget.x) * 0.05;
      smoothLookTarget.z += (headPos.z - smoothLookTarget.z) * 0.05;
      camera.lookAt(smoothLookTarget.x, 0, smoothLookTarget.z);
    } else {
      camera.lookAt(0, 0, 0);
    }
    
    renderer.render(scene, camera);
  }
  
  // Helper: Shuffle Array
  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(gameRng() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
  
  // Helper: Format Time Milliseconds
  function fmtTime(ms) {
    const sec = Math.floor(ms / 1000) % 60;
    const min = Math.floor(ms / 60000);
    return String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
  }
})();
