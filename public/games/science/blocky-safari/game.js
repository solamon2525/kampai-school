// game.js — ลอจิกการทำงานและส่วนเชื่อมต่อ Three.js + KAMPAI SDK (เวอร์ชันเกมยิง Arcade)

// ดึงพารามิเตอร์จาก GAME_CONFIG
const { SLUG, BGM, PLAYER_SPEED, COLLISION_DIST, MAP_SIZE, TREES_COUNT } = window.GAME_CONFIG;

// --- Game State ---
let gameState = {
    isPlaying: false,
    currentLevel: 1,
    maxLevels: 3,
    score: 0,             // จำนวนสัตว์เป้าหมายที่เก็บได้ในด่านปัจจุบัน
    totalScore: 0,        // คะแนนสะสมทั้งหมดรวมทุกด่าน
    totalAnimals: 0,      // สัตว์ป่าทั้งหมดในซีนปัจจุบัน
    totalTargetAnimals: 0,// จำนวนสัตว์ประเภทเป้าหมายในด่านปัจจุบัน
    targetCategory: '',   // ชนิดสัตว์เป้าหมายของด่านนี้ (เช่น window.ANIMAL_TYPES.MAMMAL)
    hearts: 5,            // หัวใจผู้เล่นสูงสุด 5 ดวง
    invincible: 0,        // เวลาเป็นอมตะที่เหลือหลังได้รับบาดเจ็บ (วินาที)
    bullets: [],          // เก็บ mesh และเวกเตอร์ความเร็วของกระสุนที่ยิงออกไป
    keys: { w: false, a: false, s: false, d: false, arrowup: false, arrowleft: false, arrowdown: false, arrowright: false }
};

// คูลดาวน์การยิงกระสุน (วินาที)
const BULLET_COOLDOWN = 0.35;
let lastShotTime = 0;
const BULLET_SPEED = 25;

// --- DOM Elements ---
const blocker = document.getElementById('blocker');
const startBtn = document.getElementById('start-btn');
const hud = document.getElementById('hud');
const scoreDisplay = document.getElementById('score-display');
const targetDisplay = document.getElementById('target-display');
const remainingDisplay = document.getElementById('remaining-display');
const heartsDisplay = document.getElementById('hearts-display');
const winScreen = document.getElementById('win-screen');
const restartBtn = document.getElementById('restart-btn');
const gameoverScreen = document.getElementById('gameover-screen');
const restartBtnGameOver = document.getElementById('restart-btn-gameover');

// --- Three.js Variables ---
let scene, camera, renderer;
let player;
let animals = []; // เก็บ mesh และข้อมูลสัตว์
let trees = [];
let clock = new THREE.Clock();

// --- Initialization ---
window.onload = () => {
    initThreeJS();
    setupEventListeners();
    
    // ตั้งค่า KAMPAI SDK
    KAMPAI.setSlug(SLUG);
    KAMPAI.onReady((sdk) => {
        // อัปเดตข้อมูลผู้เล่นบน Start Screen
        const bestScore = sdk.stats ? sdk.stats.personalBest : 0;
        const playsCount = sdk.stats ? sdk.stats.playsCount : 0;
        
        const msBest = document.getElementById('ms-best');
        const msPlays = document.getElementById('ms-plays');
        const myStats = document.getElementById('my-stats');
        
        if (msBest) msBest.innerText = bestScore;
        if (msPlays) msPlays.innerText = playsCount;
        if (myStats && sdk.stats) myStats.style.display = 'flex';
        
        // อัปเดต player chip avatar
        const chip = document.getElementById('player-chip');
        if (chip && sdk.student) {
            chip.style.display = 'flex';
            chip.innerHTML = sdk.student.photoUrl
                ? `<img src="${sdk.student.photoUrl}" alt=""> <span class="font-bold">${sdk.student.displayName}</span>`
                : `<div class="pc-init">${sdk.student.displayName.charAt(0)}</div> <span class="font-bold">${sdk.student.displayName}</span>`;
        }
        
        // อัปเดตบอร์ดคะแนน (Leaderboard)
        renderLeaderboard(sdk.leaderboard);
    });
    
    animate();
};

function renderLeaderboard(leaderboardData) {
    const list = document.getElementById('score-list');
    if (!list) return;
    
    if (!leaderboardData || leaderboardData.length === 0) {
        list.innerHTML = '<li class="lb-loading">ไม่มีข้อมูลอันดับ</li>';
        return;
    }
    
    list.innerHTML = leaderboardData.map(item => {
        const isMeClass = item.isMe ? 'is-me' : '';
        const avatarHtml = item.photoUrl
            ? `<img src="${item.photoUrl}" class="lb-avatar">`
            : `<div class="lb-avatar-init">${item.displayName.charAt(0)}</div>`;
        return `
            <li class="${isMeClass}">
                <span class="lb-rank">${item.rank}</span>
                ${avatarHtml}
                <div class="lb-info">
                    <span class="lb-name">${item.displayName}</span>
                    <span class="lb-sub">${item.classLabel || ''}</span>
                </div>
                <span class="lb-score">${item.personalBest} ตัว</span>
            </li>
        `;
    }).join('');
}

function initThreeJS() {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // ท้องฟ้าสีคราม
    scene.fog = new THREE.Fog(0x87CEEB, 20, 60);

    // Camera setup (Isometric follow camera)
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 15, 20);
    camera.lookAt(0, 0, 0);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lighting
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(20, 30, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.camera.near = 10;
    dirLight.shadow.camera.far = 100;
    dirLight.shadow.camera.left = -30;
    dirLight.shadow.camera.right = 30;
    dirLight.shadow.camera.top = 30;
    dirLight.shadow.camera.bottom = -30;
    scene.add(dirLight);

    buildWorld();
    
    // Handle resize
    window.addEventListener('resize', onWindowResize, false);
}

function buildWorld() {
    // ล้าง Entity เก่าในซีน
    if (player) scene.remove(player);
    animals.forEach(a => scene.remove(a.group));
    trees.forEach(t => scene.remove(t));
    gameState.bullets.forEach(b => scene.remove(b.mesh));
    
    animals = [];
    trees = [];
    gameState.bullets = [];

    // พื้นดิน
    const groundGeo = new THREE.BoxGeometry(MAP_SIZE, 2, MAP_SIZE);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x55aa55 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -1;
    ground.receiveShadow = true;
    scene.add(ground);

    // สร้างตัวละครผู้เล่น (Blue Explorer Block)
    const playerGroup = new THREE.Group();
    
    const playerBodyGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
    const playerBodyMat = new THREE.MeshLambertMaterial({ color: 0x3b82f6 });
    const playerBody = new THREE.Mesh(playerBodyGeo, playerBodyMat);
    playerBody.position.y = 0.6;
    playerBody.castShadow = true;
    
    // ตาของผู้เล่น
    const eyeGeo = new THREE.BoxGeometry(0.2, 0.2, 0.1);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.3, 0.8, 0.61);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.3, 0.8, 0.61);

    playerGroup.add(playerBody, eyeL, eyeR);
    scene.add(playerGroup);
    player = playerGroup;
    player.position.set(0, 0, 0); // รีเซ็ตตำแหน่งกลางแมป

    // ต้นไม้ตกแต่งป่าซาฟารี
    for (let i = 0; i < TREES_COUNT; i++) {
        const tx = (Math.random() - 0.5) * (MAP_SIZE - 4);
        const tz = (Math.random() - 0.5) * (MAP_SIZE - 4);
        // เลี่ยงการวางต้นไม้บริเวณจุดเกิดของผู้เล่น
        if (Math.abs(tx) < 5 && Math.abs(tz) < 5) continue; 
        createTree(tx, tz);
    }

    // เกิดสัตว์ป่าทั้งหมดของด่านปัจจุบัน
    const currentAnimals = window.ANIMAL_DB_LEVELS[gameState.currentLevel] || window.ANIMAL_DB_LEVELS[1];
    gameState.totalAnimals = currentAnimals.length;
    currentAnimals.forEach(data => {
        spawnAnimal(data);
    });

    // สุ่มเลือก Target Category จากข้อมูลสัตว์ที่มีในด่านนี้
    const uniqueTypes = [...new Set(currentAnimals.map(a => a.type))];
    gameState.targetCategory = uniqueTypes[Math.floor(Math.random() * uniqueTypes.length)];
    gameState.totalTargetAnimals = currentAnimals.filter(a => a.type === gameState.targetCategory).length;
    
    // ตั้งเป้าคะแนนด่านปัจจุบันเป็น 0
    gameState.score = 0;
    
    // รีเซ็ตการแสดงผล HUD
    updateHUD();
}

function createTree(x, z) {
    const treeGroup = new THREE.Group();
    
    // ลำต้น
    const trunkGeo = new THREE.BoxGeometry(0.8, 2, 0.8);
    const trunkMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
    const trunk = new THREE.Mesh(trunkGeo, trunkMat);
    trunk.position.y = 1;
    trunk.castShadow = true;

    // ใบไม้ทรงลูกบาศก์บิต
    const leavesGeo = new THREE.BoxGeometry(2.5, 2.5, 2.5);
    const leavesMat = new THREE.MeshLambertMaterial({ color: 0x228B22 });
    const leaves = new THREE.Mesh(leavesGeo, leavesMat);
    leaves.position.y = 3;
    leaves.castShadow = true;

    treeGroup.add(trunk, leaves);
    treeGroup.position.set(x, 0, z);
    scene.add(treeGroup);
    trees.push(treeGroup);
}

function spawnAnimal(data) {
    const group = new THREE.Group();

    // ตัวสัตว์บล็อก
    const bodyGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const bodyMat = new THREE.MeshLambertMaterial({ color: data.color });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.position.y = 0.75;
    body.castShadow = true;
    group.add(body);

    // ป้ายชื่อสัตว์ลอยได้
    const sprite = createTextSprite(data.emoji + " " + data.name);
    sprite.position.y = 2.5;
    group.add(sprite);

    // สุ่มตำแหน่งกระจายตัว
    let px, pz;
    do {
        px = (Math.random() - 0.5) * (MAP_SIZE - 8);
        pz = (Math.random() - 0.5) * (MAP_SIZE - 8);
    } while (Math.abs(px) < 6 && Math.abs(pz) < 6); // สปอว์นห่างจากตัวเล่นตอนเริ่มพอควร

    group.position.set(px, 0, pz);
    scene.add(group);

    // กำหนดเวกเตอร์ความเร็วสุ่มและ offset ลอยตัว
    group.userData = {
        data: data,
        startY: 0,
        floatOffset: Math.random() * Math.PI * 2,
        damageFlash: 0 // คูลดาวน์การกะพริบแดงเมื่อยิงผิด
    };

    animals.push({ group: group, data: data });
}

// สร้างสไปรต์ตัวอักษร 2D บนวิว 3D
function createTextSprite(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const context = canvas.getContext('2d');
    if (!context) {
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(4, 2, 1);
        return sprite;
    }
    
    context.font = "Bold 40px 'Kanit'";
    context.fillStyle = "rgba(0, 0, 0, 0.5)"; // เงาป้ายชื่อ
    context.fillText(text, 22, 72);
    context.fillStyle = "white";
    context.fillText(text, 20, 70);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(4, 2, 1);
    return sprite;
}

function setupEventListeners() {
    // การรับค่าจากคีย์บอร์ด
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if (gameState.keys.hasOwnProperty(key)) {
            gameState.keys[key] = true;
        }
        
        // ยิงกระสุนด้วยปุ่ม Spacebar
        if (key === ' ' || key === 'spacebar') {
            e.preventDefault();
            attemptShoot();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (gameState.keys.hasOwnProperty(key)) {
            gameState.keys[key] = false;
        }
    });

    // ยิงกระสุนด้วยการคลิกเมาส์/สัมผัสหน้าจอ
    window.addEventListener('pointerdown', (e) => {
        // ถ้ายิงขณะเล่นเกมและไม่ได้กด UI
        if (gameState.isPlaying && e.target.tagName !== 'BUTTON' && !e.target.closest('#ui-layer')) {
            attemptShoot();
        }
    });

    // ปุ่มสำหรับ UI
    startBtn.addEventListener('click', () => {
        KAMPAI.sound.unlock();
        KAMPAI.sound.bgmStart(BGM);
        startGame();
    });
    
    restartBtn.addEventListener('click', () => {
        winScreen.classList.add('hidden');
        KAMPAI.sound.bgmStart(BGM);
        startGame();
    });
    
    restartBtnGameOver.addEventListener('click', () => {
        gameoverScreen.classList.add('hidden');
        KAMPAI.sound.bgmStart(BGM);
        startGame();
    });

    // ปุ่มเปลี่ยนด่าน
    const nextLevelBtn = document.getElementById('next-level-btn');
    if (nextLevelBtn) {
        nextLevelBtn.addEventListener('click', () => {
            document.getElementById('level-clear-modal').classList.add('hidden');
            gameState.currentLevel++;
            gameState.score = 0;
            gameState.isPlaying = true;
            buildWorld();
            KAMPAI.sound.bgmStart(BGM);
        });
    }
}

function attemptShoot() {
    if (!gameState.isPlaying || !player) return;
    
    const now = clock.getElapsedTime();
    if (now - lastShotTime >= BULLET_COOLDOWN) {
        lastShotTime = now;
        fireBullet();
    }
}

function fireBullet() {
    // เสียงยิงปืน/เวทมนตร์ (ใช้ fxFlash ของ SDK เป็นเสียงเอฟเฟกต์เบื้องต้น)
    KAMPAI.sound.fxFlash();
    
    // ทิศทางที่ผู้เล่นหันหน้าไป
    const angle = player.rotation.y;
    const vx = Math.sin(angle) * BULLET_SPEED;
    const vz = Math.cos(angle) * BULLET_SPEED;
    
    // สร้างกระสุน 3D (Glowing Sphere)
    const bulletGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const bulletMat = new THREE.MeshBasicMaterial({ color: 0xffff00 }); // สีเหลืองส่องสว่าง
    const bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);
    
    // เริ่มต้นจากตัวผู้เล่น ลอยอยู่ระดับเอว
    bulletMesh.position.set(player.position.x, 0.6, player.position.z);
    scene.add(bulletMesh);
    
    gameState.bullets.push({
        mesh: bulletMesh,
        vx: vx,
        vz: vz,
        spawnTime: clock.getElapsedTime()
    });
}

function startGame() {
    blocker.classList.add('hidden');
    hud.classList.remove('hidden');
    
    gameState.currentLevel = 1;
    gameState.score = 0;
    gameState.totalScore = 0;
    gameState.hearts = 5;
    gameState.invincible = 0;
    gameState.isPlaying = true;
    gameState.currentQuizAnimal = null;
    
    buildWorld(); // สร้างโลกซาฟารีใหม่
}

function takeDamage() {
    if (gameState.invincible > 0) return;
    
    gameState.hearts--;
    KAMPAI.sound.wrong(); // เล่นเสียงเจ็บ
    
    updateHUD();
    
    if (gameState.hearts <= 0) {
        // เกมโอเวอร์!
        gameState.isPlaying = false;
        hud.classList.add('hidden');
        
        KAMPAI.sound.gameOver();
        KAMPAI.sound.bgmStop();
        
        // เคลียร์กระสุนทั้งหมด
        gameState.bullets.forEach(b => scene.remove(b.mesh));
        gameState.bullets = [];
        
        setTimeout(() => {
            gameoverScreen.classList.remove('hidden');
        }, 500);
    } else {
        // เป็นอมตะชั่วคราว 1.5 วินาที
        gameState.invincible = 1.5;
    }
}

function updateHUD() {
    const levelDisplay = document.getElementById('level-display');
    if (levelDisplay) {
        levelDisplay.innerText = `${gameState.currentLevel} / ${gameState.maxLevels}`;
    }
    
    if (heartsDisplay) {
        heartsDisplay.innerText = '❤️'.repeat(gameState.hearts) + '🖤'.repeat(5 - gameState.hearts);
    }
    
    if (targetDisplay) {
        // ค้นหาอีโมจิของเป้าหมายเพื่อนำมาโชว์ใน HUD
        const currentAnimals = window.ANIMAL_DB_LEVELS[gameState.currentLevel] || window.ANIMAL_DB_LEVELS[1];
        const match = currentAnimals.find(a => a.type === gameState.targetCategory);
        const emoji = match ? match.emoji : '';
        targetDisplay.innerText = `${gameState.targetCategory} ${emoji}`;
    }
    
    if (remainingDisplay) {
        const remaining = gameState.totalTargetAnimals - gameState.score;
        remainingDisplay.innerText = `เหลือเก็บอีก: ${remaining} ตัว`;
    }
}

function showLevelClearModal() {
    gameState.isPlaying = false;
    hud.classList.add('hidden');
    KAMPAI.sound.bgmStop();
    KAMPAI.sound.fxFlash(); // เสียงเฉลิมฉลองชั่วคราว
    
    const levelClearModal = document.getElementById('level-clear-modal');
    const levelClearTitle = document.getElementById('level-clear-title');
    const levelClearDesc = document.getElementById('level-clear-desc');
    
    if (gameState.currentLevel === 1) {
        levelClearTitle.innerText = "🌳 ด่านที่ 1 สำเร็จแล้ว!";
        levelClearDesc.innerText = "คุณคัดกรองสัตว์ป่าทุ่งหญ้าสะวันนาได้ถูกต้องทั้งหมด!";
    } else if (gameState.currentLevel === 2) {
        levelClearTitle.innerText = "🌴 ด่านที่ 2 สำเร็จแล้ว!";
        levelClearDesc.innerText = "คุณคัดกรองสัตว์ป่าดิบชื้นได้ถูกต้องทั้งหมด!";
    }
    
    // เคลียร์กระสุนค้างในจอ
    gameState.bullets.forEach(b => scene.remove(b.mesh));
    gameState.bullets = [];
    
    levelClearModal.classList.remove('hidden');
}

function checkWin() {
    if (gameState.score >= gameState.totalTargetAnimals) {
        gameState.totalScore += gameState.score;
        
        if (gameState.currentLevel < gameState.maxLevels) {
            // สำเร็จด่าน ไปสเตจถัดไป
            showLevelClearModal();
        } else {
            // ชนะเกมทั้งหมดครบ 3 ด่าน!
            gameState.isPlaying = false;
            hud.classList.add('hidden');
            
            // ส่งคะแนนสะสมทวีคูณเข้าสู่ KAMPAI SDK
            KAMPAI.submitScore(gameState.totalScore);
            KAMPAI.sound.gameOver(); // เสียงชนะ/จบเกม
            KAMPAI.sound.bgmStop();
            
            // เคลียร์กระสุน
            gameState.bullets.forEach(b => scene.remove(b.mesh));
            gameState.bullets = [];
            
            setTimeout(() => {
                winScreen.classList.remove('hidden');
            }, 500);
        }
    }
}

function animate() {
    requestAnimationFrame(animate);

    const dt = clock.getDelta();
    const time = clock.getElapsedTime();

    if (gameState.isPlaying && player) {
        // --- การควบคุมและเคลื่อนที่ผู้เล่น ---
        let moveX = 0;
        let moveZ = 0;

        if (gameState.keys.w || gameState.keys.arrowup) moveZ = -1;
        if (gameState.keys.s || gameState.keys.arrowdown) moveZ = 1;
        if (gameState.keys.a || gameState.keys.arrowleft) moveX = -1;
        if (gameState.keys.d || gameState.keys.arrowright) moveX = 1;

        // รักษาความเร็วการเดินแยงมุมให้เท่ากับแนวปกติ
        if (moveX !== 0 && moveZ !== 0) {
            const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
            moveX /= length;
            moveZ /= length;
        }

        const newX = player.position.x + moveX * PLAYER_SPEED * dt;
        const newZ = player.position.z + moveZ * PLAYER_SPEED * dt;

        // ตรวจขอบแมปซาฟารี
        const limit = MAP_SIZE / 2 - 1;
        if (newX > -limit && newX < limit) player.position.x = newX;
        if (newZ > -limit && newZ < limit) player.position.z = newZ;

        // อนิเมชันกระโดดดึ๋งๆ ขณะเดิน
        if (moveX !== 0 || moveZ !== 0) {
            player.position.y = Math.abs(Math.sin(time * 15)) * 0.5;
            
            // หมุนตัวบล็อกผู้เล่นหันหน้าไปทิศทางการเดิน
            const targetAngle = Math.atan2(moveX, moveZ);
            player.rotation.y = targetAngle; 
        } else {
            player.position.y = 0;
        }

        // จัดการสถานะเป็นอมตะ (กะพริบตัวผู้เล่น)
        if (gameState.invincible > 0) {
            gameState.invincible -= dt;
            player.visible = Math.floor(time * 15) % 2 === 0;
            if (gameState.invincible <= 0) {
                player.visible = true; // คืนสู่สภาวะปกติ
            }
        }

        // --- เคลื่อนที่กระสุน + ตรวจชนมอนสเตอร์สัตว์ ---
        for (let bIdx = gameState.bullets.length - 1; bIdx >= 0; bIdx--) {
            const bullet = gameState.bullets[bIdx];
            bullet.mesh.position.x += bullet.vx * dt;
            bullet.mesh.position.z += bullet.vz * dt;
            
            // ลบกระสุนหากลอยเลยเวลา 2 วินาที หรือหลุดขอบแผนที่
            const isOutOfMap = Math.abs(bullet.mesh.position.x) > MAP_SIZE/2 || Math.abs(bullet.mesh.position.z) > MAP_SIZE/2;
            if (clock.getElapsedTime() - bullet.spawnTime > 2.0 || isOutOfMap) {
                scene.remove(bullet.mesh);
                gameState.bullets.splice(bIdx, 1);
                continue;
            }
            
            // ตรวจการชนกับสัตว์ป่า
            let bulletRemoved = false;
            for (let aIdx = animals.length - 1; aIdx >= 0; aIdx--) {
                const animal = animals[aIdx];
                const bDist = bullet.mesh.position.distanceTo(animal.group.position);
                
                if (bDist < 1.6) { // ชนโดนสัตว์!
                    scene.remove(bullet.mesh);
                    gameState.bullets.splice(bIdx, 1);
                    bulletRemoved = true;
                    
                    // เช็คประเภท
                    if (animal.data.type === gameState.targetCategory) {
                        // ยิงถูกเป้า! -> เซฟสัตว์เข้าระบบ
                        KAMPAI.sound.correct();
                        scene.remove(animal.group);
                        animals.splice(aIdx, 1);
                        gameState.score++;
                        updateHUD();
                        checkWin();
                    } else {
                        // ยิงผิดตัว! -> ลบหัวใจ + มอนสเตอร์สะท้อนกลับ
                        takeDamage();
                        animal.group.userData.damageFlash = 0.5; // กะพริบแดง 0.5 วินาที
                        
                        // เด้งสัตว์กระเด็นหนีออกจากตัวผู้เล่น
                        const angleToPlayer = Math.atan2(animal.group.position.x - player.position.x, animal.group.position.z - player.position.z);
                        animal.group.position.x += Math.sin(angleToPlayer) * 4;
                        animal.group.position.z += Math.cos(angleToPlayer) * 4;
                    }
                    break;
                }
            }
            if (bulletRemoved) continue;
        }

        // --- เคลื่อนไหวสัตว์ป่า (พฤติกรรมเดินช้าไล่ตามล่าผู้เล่น) ---
        const chaseSpeed = 2.0; // สปีดการไล่ช้าๆ
        for (let i = 0; i < animals.length; i++) {
            const animal = animals[i];
            
            // คำนวณเวกเตอร์พุ่งเข้าหาผู้เล่น
            const dx = player.position.x - animal.group.position.x;
            const dz = player.position.z - animal.group.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            if (dist > 0.1) {
                // ค่อยๆ เดินพุ่งเข้ามาหาตัวเอก
                animal.group.position.x += (dx / dist) * chaseSpeed * dt;
                animal.group.position.z += (dz / dist) * chaseSpeed * dt;
                
                // หมุนโมเดลบล็อกสัตว์หันมองผู้เล่น
                const angle = Math.atan2(dx, dz);
                animal.group.rotation.y = angle;
            }
            
            // ตรวจการชนกับผู้เล่นโดยตรง
            if (dist < COLLISION_DIST) {
                takeDamage();
                
                // เด้งกระดอนผู้เล่น/สัตว์หลบมุม
                const angle = Math.atan2(animal.group.position.x - player.position.x, animal.group.position.z - player.position.z);
                animal.group.position.x += Math.sin(angle) * 3;
                animal.group.position.z += Math.cos(angle) * 3;
            }
        }

        // --- มุมมองกล้องตามตัวละคร ---
        camera.position.x += (player.position.x - camera.position.x) * 0.1;
        camera.position.z += (player.position.z + 15 - camera.position.z) * 0.1;
        camera.lookAt(player.position.x, player.position.y, player.position.z);
    }

    // อนิเมชันสัตว์แบบลอยขึ้นลงเบาๆ + จัดการการกะพริบแดง
    animals.forEach(a => {
        a.group.position.y = Math.sin(time * 2 + a.group.userData.floatOffset) * 0.2;
        
        // หมุนป้ายชื่อสัตว์ลอยได้ให้หันเข้าหากล้องเสมอ
        const sprite = a.group.children[1];
        if (sprite) {
            sprite.lookAt(camera.position);
        }
        
        // ควบคุมเอฟเฟกต์สีแดงเมื่อยิงผิด
        const bodyMesh = a.group.children[0];
        if (bodyMesh && bodyMesh.material) {
            if (a.group.userData.damageFlash > 0) {
                a.group.userData.damageFlash -= dt;
                bodyMesh.material.color.setHex(0xff0000); // สีแดงกะพริบโดนตี
            } else {
                bodyMesh.material.color.setHex(a.data.color); // คืนสีปกติ
            }
        }
    });

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
