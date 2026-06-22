// game.js — ลอจิกการทำงานและส่วนเชื่อมต่อ Three.js + KAMPAI SDK

// ดึงพารามิเตอร์จาก GAME_CONFIG
const { SLUG, BGM, PLAYER_SPEED, COLLISION_DIST, MAP_SIZE, TREES_COUNT } = window.GAME_CONFIG;

// --- Game State ---
let gameState = {
    isPlaying: false,
    score: 0,
    totalAnimals: window.ANIMAL_DB.length,
    currentQuizAnimal: null,
    keys: { w: false, a: false, s: false, d: false, arrowup: false, arrowleft: false, arrowdown: false, arrowright: false }
};

// --- DOM Elements ---
const blocker = document.getElementById('blocker');
const startBtn = document.getElementById('start-btn');
const hud = document.getElementById('hud');
const scoreDisplay = document.getElementById('score-display');
const quizModal = document.getElementById('quiz-modal');
const quizQuestion = document.getElementById('quiz-question');
const quizOptions = document.getElementById('quiz-options');
const quizFeedback = document.getElementById('quiz-feedback');
const quizIcon = document.getElementById('quiz-animal-icon');
const winScreen = document.getElementById('win-screen');
const restartBtn = document.getElementById('restart-btn');

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
        // อัปเดตข้อมูลผู้เล่น
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
    animals = [];
    trees = [];

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

    // ต้นไม้ตกแต่งป่าซาฟารี
    for (let i = 0; i < TREES_COUNT; i++) {
        const tx = (Math.random() - 0.5) * (MAP_SIZE - 4);
        const tz = (Math.random() - 0.5) * (MAP_SIZE - 4);
        // เลี่ยงการวางต้นไม้บริเวณจุดเกิดของผู้เล่น
        if (Math.abs(tx) < 5 && Math.abs(tz) < 5) continue; 
        createTree(tx, tz);
    }

    // เกิดสัตว์ทั้งหมดตามฐานข้อมูล
    window.ANIMAL_DB.forEach(data => {
        spawnAnimal(data);
    });
    
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
    } while (Math.abs(px) < 4 && Math.abs(pz) < 4); // ป้องกันไม่ให้ทับกับผู้เล่นตอนเริ่ม

    group.position.set(px, 0, pz);
    scene.add(group);

    // สุ่มค่า offset เพื่อให้ลอยขึ้นลงเหลื่อมกัน
    group.userData = {
        data: data,
        startY: 0,
        floatOffset: Math.random() * Math.PI * 2
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
        if (gameState.keys.hasOwnProperty(key)) gameState.keys[key] = true;
    });
    document.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (gameState.keys.hasOwnProperty(key)) gameState.keys[key] = false;
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
}

function startGame() {
    blocker.classList.add('hidden');
    hud.classList.remove('hidden');
    
    gameState.score = 0;
    gameState.isPlaying = true;
    gameState.currentQuizAnimal = null;
    
    buildWorld(); // สร้างโลกซาฟารีใหม่
}

function triggerQuiz(animalObj) {
    gameState.isPlaying = false; // หยุดการเคลื่อนไหวชั่วคราว
    // ล้างอินพุตทั้งหมดเพื่อไม่ให้ผู้เล่นเลื่อนต่อหลังจากชน
    gameState.keys = { w: false, a: false, s: false, d: false, arrowup: false, arrowleft: false, arrowdown: false, arrowright: false };
    gameState.currentQuizAnimal = animalObj;

    const data = animalObj.data;
    quizIcon.innerText = data.emoji;
    quizQuestion.innerText = data.question;
    quizFeedback.innerText = '';
    quizFeedback.classList.remove('text-green-500', 'text-red-500');

    // สร้างปุ่มประเภทสัตว์แบบไดนามิก
    quizOptions.innerHTML = '';
    Object.values(window.ANIMAL_TYPES).forEach(typeStr => {
        const btn = document.createElement('button');
        btn.className = "bg-blue-100 hover:bg-blue-500 hover:text-white text-blue-800 font-semibold py-3 px-4 rounded-xl border-2 border-blue-200 hover:border-blue-500 transition-all shadow-sm";
        btn.innerText = typeStr;
        btn.onclick = () => checkAnswer(typeStr);
        quizOptions.appendChild(btn);
    });

    quizModal.classList.remove('hidden');
}

function checkAnswer(selectedType) {
    const data = gameState.currentQuizAnimal.data;

    if (selectedType === data.type) {
        // ตอบถูก!
        KAMPAI.sound.correct();
        quizFeedback.innerText = "⭐ ถูกต้อง! เก็บเข้ากระเป๋าสำเร็จ";
        quizFeedback.className = "text-green-500 font-bold min-h-[28px] mb-2 text-lg animate-bounce";
        
        // ลบสัตว์ออกจากแผนที่ 3D
        scene.remove(gameState.currentQuizAnimal.group);
        animals = animals.filter(a => a !== gameState.currentQuizAnimal);
        
        gameState.score++;
        updateHUD();

        setTimeout(() => {
            quizModal.classList.add('hidden');
            gameState.isPlaying = true;
            gameState.currentQuizAnimal = null;
            checkWin();
        }, 1500);

    } else {
        // ตอบผิด
        KAMPAI.sound.wrong();
        quizFeedback.innerText = "❌ ยังไม่ใช่นะ... " + data.hint;
        quizFeedback.className = "text-red-500 font-semibold min-h-[28px] mb-2";
        
        // เอฟเฟกต์การสั่นป้ายเมื่อตอบผิด
        quizModal.classList.add('animate-[pulse_0.3s_ease-in-out]');
        setTimeout(() => quizModal.classList.remove('animate-[pulse_0.3s_ease-in-out]'), 300);
    }
}

function updateHUD() {
    scoreDisplay.innerText = `${gameState.score} / ${gameState.totalAnimals}`;
}

function checkWin() {
    if (gameState.score >= gameState.totalAnimals) {
        gameState.isPlaying = false;
        hud.classList.add('hidden');
        
        // ส่งคะแนนเก็บเข้าสู่ KAMPAI SDK
        KAMPAI.submitScore(gameState.score);
        KAMPAI.sound.gameOver();
        KAMPAI.sound.bgmStop();
        
        setTimeout(() => {
            winScreen.classList.remove('hidden');
        }, 500);
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

        // --- ตรวจการชนกับสัตว์ป่า ---
        for (let i = 0; i < animals.length; i++) {
            const animal = animals[i];
            const dist = player.position.distanceTo(animal.group.position);
            
            if (dist < COLLISION_DIST) {
                triggerQuiz(animal);
                break; // ทำงานทีละตัว
            }
        }

        // --- มุมมองกล้องตามตัวละคร ---
        camera.position.x += (player.position.x - camera.position.x) * 0.1;
        camera.position.z += (player.position.z + 15 - camera.position.z) * 0.1;
        camera.lookAt(player.position.x, player.position.y, player.position.z);
    }

    // อนิเมชันสัตว์แบบลอยขึ้นลงขณะรอ
    animals.forEach(a => {
        a.group.position.y = Math.sin(time * 2 + a.group.userData.floatOffset) * 0.2;
        // หมุนป้ายชื่อสัตว์ลอยได้ให้หันเข้าหากล้องเสมอ
        const sprite = a.group.children[1];
        if (sprite) {
            sprite.lookAt(camera.position);
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
