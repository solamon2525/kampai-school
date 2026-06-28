// game.js — ลอจิกการทำงานและส่วนเชื่อมต่อ Three.js + KAMPAI SDK (เวอร์ชันเกมยิง Arcade)

// ดึงพารามิเตอร์จาก GAME_CONFIG
const { SLUG, BGM, PLAYER_SPEED, COLLISION_DIST, MAP_SIZE, TREES_COUNT, CHASE_DIST } = window.GAME_CONFIG;
const CFG = window.GAME_CONFIG;

// seeded PRNG (mulberry32) — โลกออนไลน์ต้องตรงกันทุกเครื่อง (seed = รหัสห้อง + เลขด่าน)
function makeRng(seed) {
    let a = (seed >>> 0) || 1;
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
let worldRng = Math.random;   // rng สร้างโลกของด่านปัจจุบัน (buildWorld ตั้งค่า: seeded เมื่อ online)
let match = null;             // KampaiMatch controller (โหมดแข่งออนไลน์)

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
    keys: { w: false, a: false, s: false, d: false, arrowup: false, arrowleft: false, arrowdown: false, arrowright: false },
    // ── โหมดออนไลน์แข่ง ──
    online: false,        // true = กำลังแข่งออนไลน์
    onlineCorrect: 0,     // ตอบถูกสะสม (ใช้รายงานคะแนน + จัดอันดับ)
    seed: 0,              // seed โลก (จากรหัสห้อง) — โหมดเดี่ยว = 0 → Math.random
    sab: { chaseMult: 1, oppCorrect: {} }  // sabotage: ตัวคูณความเร็วไล่ล่า + correct คู่แข่งล่าสุด
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
let scene, camera, renderer, dirLight;
let player;
let animals = []; // เก็บ mesh และข้อมูลสัตว์
let trees = [];
let clock = new THREE.Clock();

// --- GLTF Model & Animation Variables ---
let playerMixer = null;          // AnimationMixer สำหรับผู้เล่น
let playerAnimations = null;     // รายการแอนิเมชันทั้งหมดของผู้เล่น
let currentPlayerAction = null;  // Action แอนิเมชันที่กำลังเล่น
let hasGLTFPlayer = false;       // มีโมเดล GLTF ของผู้เล่นที่โหลดสำเร็จหรือไม่

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
    scene.fog = new THREE.Fog(0x87CEEB, 40, 180);

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

    dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
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

    // รีเซ็ตตัวแปร GLTF ของผู้เล่น
    playerMixer = null;
    playerAnimations = null;
    currentPlayerAction = null;
    hasGLTFPlayer = false;

    // พื้นดิน
    const groundGeo = new THREE.BoxGeometry(MAP_SIZE, 2, MAP_SIZE);
    const groundMat = new THREE.MeshLambertMaterial({ color: 0x55aa55 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -1;
    ground.receiveShadow = true;
    scene.add(ground);

    // สร้างตัวละครผู้เล่น (Blue Explorer Block) - ขนาดขยาย 200% (2.4x2.4x2.4)
    const playerGroup = new THREE.Group();
    
    const playerBodyGeo = new THREE.BoxGeometry(2.4, 2.4, 2.4);
    const playerBodyMat = new THREE.MeshLambertMaterial({ color: 0x3b82f6 });
    const playerBody = new THREE.Mesh(playerBodyGeo, playerBodyMat);
    playerBody.position.y = 1.2;
    playerBody.castShadow = true;
    
    // ตาของผู้เล่น
    const eyeGeo = new THREE.BoxGeometry(0.4, 0.4, 0.2);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(-0.6, 1.6, 1.22);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat);
    eyeR.position.set(0.6, 1.6, 1.22);

    playerGroup.add(playerBody, eyeL, eyeR);
    scene.add(playerGroup);
    player = playerGroup;
    player.position.set(0, 0, 0); // รีเซ็ตตำแหน่งกลางแมป

    // พยายามโหลดโมเดล GLTF ของผู้เล่นเข้ามาแทนที่กล่องเริ่มต้น
    if (typeof THREE.GLTFLoader !== 'undefined') {
        const loader = new THREE.GLTFLoader();
        loader.load(
            './assets/player.glb',
            function (gltf) {
                // ล้างโมเดลกล่องเริ่มต้นออก
                playerGroup.remove(playerBody);
                playerGroup.remove(eyeL);
                playerGroup.remove(eyeR);

                const model = gltf.scene;
                // ปรับสเกลและองศาให้พอดี (ขยาย 200% จากเดิม 0.3 -> 0.6)
                model.scale.set(0.6, 0.6, 0.6);
                model.position.set(0, 0, 0);
                
                model.traverse(function (node) {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                    }
                });

                playerGroup.add(model);
                hasGLTFPlayer = true;

                // ผูกแอนิเมชันหากมี
                if (gltf.animations && gltf.animations.length > 0) {
                    playerMixer = new THREE.AnimationMixer(model);
                    playerAnimations = gltf.animations;
                    setPlayerAnimation('idle');
                }
                console.log('โหลดโมเดลผู้เล่น GLTF สำเร็จ!');
            },
            undefined,
            function (error) {
                console.warn('ไม่พบไฟล์ player.glb หรือโหลดไม่สำเร็จ (ระบบใช้งานโมเดลกล่องเริ่มต้นสำรอง):', error);
            }
        );
    }

    // ต้นไม้ตกแต่งป่าซาฟารี
    for (let i = 0; i < TREES_COUNT; i++) {
        const tx = (Math.random() - 0.5) * (MAP_SIZE - 4);
        const tz = (Math.random() - 0.5) * (MAP_SIZE - 4);
        // เลี่ยงการวางต้นไม้บริเวณจุดเกิดของผู้เล่น
        if (Math.abs(tx) < 5 && Math.abs(tz) < 5) continue; 
        createTree(tx, tz);
    }

    // เกิดสัตว์ป่าทั้งหมดของด่านปัจจุบัน (สปอว์น 4 ตัวต่อสายพันธุ์ เพื่อให้แมปขนาดใหญ่สุดไม่โล่งและไม่แออัดเกินไป)
    const currentAnimals = window.ANIMAL_DB_LEVELS[gameState.currentLevel] || window.ANIMAL_DB_LEVELS[1];
    const SPAWNS_PER_ANIMAL = 4;

    // โหมดออนไลน์: seed โลกจาก (รหัสห้อง + เลขด่าน) → ทุกเครื่องได้เป้า/สัตว์/ตำแหน่งเหมือนกัน (ยุติธรรม)
    worldRng = gameState.online ? makeRng((gameState.seed >>> 0) + gameState.currentLevel * 7919) : Math.random;

    currentAnimals.forEach(data => {
        for (let i = 0; i < SPAWNS_PER_ANIMAL; i++) {
            spawnAnimal(data);
        }
    });

    gameState.totalAnimals = currentAnimals.length * SPAWNS_PER_ANIMAL;

    // สุ่มเลือก Target Category จากข้อมูลสัตว์ที่มีในด่านนี้
    const uniqueTypes = [...new Set(currentAnimals.map(a => a.type))];
    gameState.targetCategory = uniqueTypes[Math.floor(worldRng() * uniqueTypes.length)];
    // เป้าหมายคือเก็บให้ครบทุกตัวในสายพันธุ์ของด่านนั้น
    const targetSpeciesCount = currentAnimals.filter(a => a.type === gameState.targetCategory).length;
    gameState.totalTargetAnimals = targetSpeciesCount * SPAWNS_PER_ANIMAL;
    
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

function spawnAnimal(data, opts) {
    opts = opts || {};
    const group = new THREE.Group();

    // ตัวสัตว์กลมน่ารัก (ไม่ใช้บล็อกสี่เหลี่ยมเดี่ยวๆ) - ขยายขนาด 200%
    const body = new THREE.Group();

    const bodyMat = new THREE.MeshLambertMaterial({ color: data.color });

    // 1. ลำตัว (ทรงกระบอกแนวนอน)
    const bodyGeo = new THREE.CylinderGeometry(1.6, 1.6, 3.6, 16);
    bodyGeo.rotateX(Math.PI / 2);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 2.0;
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    body.add(bodyMesh);

    // 2. หัว (ทรงกลม)
    const headGeo = new THREE.SphereGeometry(1.4, 16, 16);
    const headMesh = new THREE.Mesh(headGeo, bodyMat);
    headMesh.position.set(0, 3.0, 1.8);
    headMesh.castShadow = true;
    body.add(headMesh);

    // 3. ขา 4 ข้าง
    const legGeo = new THREE.CylinderGeometry(0.36, 0.36, 1.4, 8);
    const legMat = new THREE.MeshLambertMaterial({ color: data.color });
    const legFL = new THREE.Mesh(legGeo, legMat); legFL.position.set(1.0, 0.7, 1.2); legFL.castShadow = true;
    const legFR = new THREE.Mesh(legGeo, legMat); legFR.position.set(-1.0, 0.7, 1.2); legFR.castShadow = true;
    const legBL = new THREE.Mesh(legGeo, legMat); legBL.position.set(1.0, 0.7, -1.2); legBL.castShadow = true;
    const legBR = new THREE.Mesh(legGeo, legMat); legBR.position.set(-1.0, 0.7, -1.2); legBR.castShadow = true;
    body.add(legFL, legFR, legBL, legBR);

    // 4. ตา 2 ข้าง (จุดดำ)
    const eyeGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.5, 3.3, 3.0);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.5, 3.3, 3.0);
    body.add(eyeL, eyeR);

    group.add(body);

    // ป้ายชื่อสัตว์ลอยได้
    const sprite = createTextSprite(data.emoji + " " + data.name);
    sprite.position.y = 2.5;
    group.add(sprite);

    // ตำแหน่ง: ปกติ = กระจายทั่วแมป (worldRng = seeded เมื่อ online) · sabotage = วงแหวนรอบผู้เล่น (สุ่มอิสระ ไม่กระทบ seed)
    let px, pz;
    if (opts.nearPlayer && player) {
        const ang = Math.random() * Math.PI * 2, r = 16 + Math.random() * 10;
        px = player.position.x + Math.sin(ang) * r;
        pz = player.position.z + Math.cos(ang) * r;
    } else {
        do {
            px = (worldRng() - 0.5) * (MAP_SIZE - 8);
            pz = (worldRng() - 0.5) * (MAP_SIZE - 8);
        } while (Math.abs(px) < 6 && Math.abs(pz) < 6); // สปอว์นห่างจากตัวเล่นตอนเริ่มพอควร
    }

    group.position.set(px, 0, pz);
    scene.add(group);

    // offset ลอยตัว + สถานะ aggro
    group.userData = {
        data: data,
        startY: 0,
        floatOffset: Math.random() * Math.PI * 2,
        damageFlash: 0, // คูลดาวน์การกะพริบแดงเมื่อยิงผิด
        isAggro: !!opts.aggro,  // sabotage spawn = ดุทันที · ปกติ = false (aggro เมื่อผู้เล่นเข้าใกล้)
        hasGLTF: false,
        mixer: null,
        animations: null,
        currentAction: null
    };

    // พยายามโหลดโมเดล GLTF ของสัตว์ตัวนี้ (เช่น lion.glb)
    if (typeof THREE.GLTFLoader !== 'undefined') {
        const loader = new THREE.GLTFLoader();
        loader.load(
            './assets/animals/' + data.id + '.glb',
            function (gltf) {
                // ลบตัวสัตว์บล็อกดั้งเดิมออก
                group.remove(body);

                const model = gltf.scene;
                // ปรับขนาดและตำแหน่งโมเดลสัตว์
                model.scale.set(0.12, 0.12, 0.12);
                model.position.set(0, 0, 0);

                model.traverse(function (node) {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                    }
                });

                group.add(model);
                group.userData.hasGLTF = true;

                // ผูกแอนิเมชันถ้ามี
                if (gltf.animations && gltf.animations.length > 0) {
                    group.userData.mixer = new THREE.AnimationMixer(model);
                    group.userData.animations = gltf.animations;
                    setAnimalAnimation(group, 'idle');
                }
                console.log('โหลดโมเดลสัตว์ ' + data.name + ' สำเร็จ!');
            },
            undefined,
            function (error) {
                // หากไม่พบโมเดลสัตว์รายตัว ก็จะใช้บล็อกสี่เหลี่ยมเดิมโดยไม่ต้องทำอะไรเพิ่ม
            }
        );
    }

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
            const radar = document.getElementById('radar-container');
            if (radar) radar.classList.remove('hidden');
            KAMPAI.sound.bgmStart(BGM);
        });
    }

    // ── โหมดออนไลน์แข่ง (KampaiMatch: lobby/รหัสห้อง/นับถอยหลัง/แถบคะแนนสด/จัดอันดับ ให้ครบ) ──
    match = KampaiMatch.create({
        duration: CFG.ONLINE_DURATION,
        title: 'ซาฟารีแข่งเดือด',
        rankBy: 'score',
        onPlay: function (m) { startOnlineGame(m && m.seed); },
        onEnd: function () { endOnlineGame(); },
        onOpponent: function (list) { onOpponentUpdate(list); }
    });
    const onlineBtn = document.getElementById('online-btn');
    if (onlineBtn) onlineBtn.addEventListener('click', function () {
        try { KAMPAI.sound.unlock(); } catch (e) {}
        match.openMenu();
    });
}

// ─── โหมดออนไลน์: เริ่ม/จบ + รับ sabotage ─────────────────────────────────
function startOnlineGame(seed) {
    gameState.online = true;
    gameState.seed = (seed >>> 0) || 1;
    gameState.onlineCorrect = 0;
    gameState.sab = { chaseMult: 1, oppCorrect: {} };
    blocker.classList.add('hidden');
    winScreen.classList.add('hidden');
    gameoverScreen.classList.add('hidden');
    const lcm = document.getElementById('level-clear-modal'); if (lcm) lcm.classList.add('hidden');
    hud.classList.remove('hidden');
    const radar = document.getElementById('radar-container'); if (radar) radar.classList.remove('hidden');
    gameState.currentLevel = 1;
    gameState.score = 0; gameState.totalScore = 0;
    gameState.hearts = 5; gameState.invincible = 0;
    gameState.isPlaying = true;
    try { KAMPAI.sound.unlock(); KAMPAI.sound.bgmStart(BGM); } catch (e) {}
    buildWorld();
}

function endOnlineGame() {
    gameState.isPlaying = false;
    try { KAMPAI.sound.bgmStop(); } catch (e) {}
    gameState.bullets.forEach(function (b) { scene.remove(b.mesh); });
    gameState.bullets = [];
    // match จัดการจออันดับ + submit XP เอง (rankBy:'score' = onlineCorrect ที่ report)
}

// คู่แข่งตอบถูก (correct เพิ่ม) → ป่วนตัวเอง: เร่งความเร็วไล่ล่า + เกิดสัตว์ดุพิเศษ
function onOpponentUpdate(list) {
    if (!gameState.online) return;
    let delta = 0;
    (list || []).forEach(function (m) {
        if (m.me) return;
        const prev = gameState.sab.oppCorrect[m.id] || 0;
        const cur = m.correct || 0;
        if (cur > prev) delta += (cur - prev);
        gameState.sab.oppCorrect[m.id] = cur;
    });
    if (delta > 0) applySabotage(delta);
}

function applySabotage(delta) {
    if (!gameState.isPlaying) return;
    gameState.sab.chaseMult = Math.min(CFG.SAB_CHASE_MAX, gameState.sab.chaseMult + delta * CFG.SAB_CHASE_PER_HIT);
    // เกิดสัตว์ดุพิเศษ (ชนิดที่ไม่ใช่เป้า = ยิงโดน = เสียหัวใจ) ใกล้ผู้เล่น = "มอนสเตอร์" ไล่ล่า
    const lvl = window.ANIMAL_DB_LEVELS[gameState.currentLevel] || window.ANIMAL_DB_LEVELS[1];
    const foes = lvl.filter(function (a) { return a.type !== gameState.targetCategory; });
    const pool = foes.length ? foes : lvl;
    const n = Math.round(delta * CFG.SAB_SPAWN_PER_HIT);
    for (let i = 0; i < n; i++) {
        const d = pool[Math.floor(Math.random() * pool.length)];
        if (d) spawnAnimal(d, { nearPlayer: true, aggro: true });
    }
    showSabotageToast();
    try { KAMPAI.sound.wrong(); } catch (e) {}
}

let sabToastTimer = 0;
function showSabotageToast() {
    let el = document.getElementById('sab-toast');
    if (!el) {
        el = document.createElement('div');
        el.id = 'sab-toast';
        el.style.cssText = 'position:fixed;top:18%;left:50%;transform:translateX(-50%);z-index:99980;background:rgba(239,68,68,.92);color:#fff;font-weight:800;font-family:Kanit,Sarabun,system-ui,sans-serif;padding:10px 20px;border-radius:14px;box-shadow:0 6px 20px rgba(0,0,0,.4);font-size:18px;pointer-events:none;transition:opacity .25s';
        document.body.appendChild(el);
    }
    el.textContent = '😱 คู่แข่งตอบถูก! สัตว์ดุขึ้น';
    el.style.opacity = '1';
    clearTimeout(sabToastTimer);
    sabToastTimer = setTimeout(function () { el.style.opacity = '0'; }, 1400);
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
    const radar = document.getElementById('radar-container');
    if (radar) radar.classList.remove('hidden');
    
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
        // โหมดออนไลน์: ไม่จบเกม (แข่งตามเวลา) — เติมหัวใจ + อมตะสั้น ๆ เป็นบทลงโทษเสียเวลาแทน
        if (gameState.online) {
            gameState.hearts = 5;
            gameState.invincible = 2;
            updateHUD();
            return;
        }
        // เกมโอเวอร์!
        gameState.isPlaying = false;
        hud.classList.add('hidden');
        const radar = document.getElementById('radar-container');
        if (radar) radar.classList.add('hidden');
        
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
    const radar = document.getElementById('radar-container');
    if (radar) radar.classList.add('hidden');
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

        // โหมดออนไลน์: เคลียร์ด่าน → ไปด่านถัดไปทันที (ไม่มี modal/จอชนะ — แข่งตามเวลา) วนด่านไม่ให้ตัน
        if (gameState.online) {
            gameState.bullets.forEach(b => scene.remove(b.mesh));
            gameState.bullets = [];
            gameState.currentLevel = (gameState.currentLevel % gameState.maxLevels) + 1;
            buildWorld();   // score รีเซ็ตเป็น 0 ใน buildWorld
            return;
        }

        if (gameState.currentLevel < gameState.maxLevels) {
            // สำเร็จด่าน ไปสเตจถัดไป
            showLevelClearModal();
        } else {
            // ชนะเกมทั้งหมดครบ 3 ด่าน!
            gameState.isPlaying = false;
            hud.classList.add('hidden');
            const radar = document.getElementById('radar-container');
            if (radar) radar.classList.add('hidden');
            
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

// --- ฟังก์ชันจัดการแอนิเมชันสำหรับโมเดล GLTF ---
function setPlayerAnimation(clipName) {
    if (!playerMixer || !playerAnimations) return;
    
    // ค้นหาแอนิเมชันที่สอดคล้อง (มองข้ามตัวพิมพ์เล็ก/ใหญ่)
    let clip = playerAnimations.find(c => c.name.toLowerCase().includes(clipName.toLowerCase()));
    
    // หากไม่พบชื่อนั้นๆ แต่มีแอนิเมชันอื่น ให้ใช้ตัวแรกแทน
    if (!clip && playerAnimations.length > 0) {
        clip = playerAnimations[0];
    }
    if (!clip) return;

    const action = playerMixer.clipAction(clip);
    if (currentPlayerAction !== action) {
        if (currentPlayerAction) {
            currentPlayerAction.fadeOut(0.2); // ผสมจางแอนิเมชันเดิมออก
        }
        action.reset().fadeIn(0.2).play(); // ค่อยๆ โชว์แอนิเมชันใหม่
        currentPlayerAction = action;
    }
}

function setAnimalAnimation(group, clipName) {
    const ud = group.userData;
    if (!ud.mixer || !ud.animations) return;

    let clip = ud.animations.find(c => c.name.toLowerCase().includes(clipName.toLowerCase()));
    
    // สำรอง: หากมองหาแอนิเมชันวิ่ง (run) ไม่พบ ให้ใช้ท่าเดิน (walk) หรือยืนนิ่ง (idle) สำรอง
    if (!clip && clipName === 'run') {
        clip = ud.animations.find(c => c.name.toLowerCase().includes('walk'));
    }
    if (!clip && ud.animations.length > 0) {
        clip = ud.animations[0];
    }
    if (!clip) return;

    const action = ud.mixer.clipAction(clip);
    if (ud.currentAction !== action) {
        if (ud.currentAction) {
            ud.currentAction.fadeOut(0.2);
        }
        action.reset().fadeIn(0.2).play();
        ud.currentAction = action;
    }
}

function animate() {
    requestAnimationFrame(animate);

    const dt = clock.getDelta();
    const time = clock.getElapsedTime();

    // อัปเดตแอนิเมชันผู้เล่น GLTF
    if (playerMixer) {
        playerMixer.update(dt);
    }

    // อัปเดตแอนิเมชันสัตว์ GLTF
    animals.forEach(a => {
        if (a.group.userData.mixer) {
            a.group.userData.mixer.update(dt);
        }
    });

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

        // อนิเมชันกระโดดดึ๋งๆ ขณะเดิน (หรือใช้ท่าวิ่ง/เดินของ GLTF)
        if (moveX !== 0 || moveZ !== 0) {
            if (hasGLTFPlayer) {
                setPlayerAnimation('walk');
            } else {
                player.position.y = Math.abs(Math.sin(time * 15)) * 0.5;
            }
            
            // หมุนตัวบล็อกผู้เล่นหันหน้าไปทิศทางการเดิน
            const targetAngle = Math.atan2(moveX, moveZ);
            player.rotation.y = targetAngle; 
        } else {
            if (hasGLTFPlayer) {
                setPlayerAnimation('idle');
            } else {
                player.position.y = 0;
            }
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
            
            // ลบกระสุนหากลอยเลยเวลา 3 วินาที หรือหลุดขอบแผนที่
            const isOutOfMap = Math.abs(bullet.mesh.position.x) > MAP_SIZE/2 || Math.abs(bullet.mesh.position.z) > MAP_SIZE/2;
            if (clock.getElapsedTime() - bullet.spawnTime > 3.0 || isOutOfMap) {
                scene.remove(bullet.mesh);
                gameState.bullets.splice(bIdx, 1);
                continue;
            }
            
            // ตรวจการชนกับสัตว์ป่า
            let bulletRemoved = false;
            for (let aIdx = animals.length - 1; aIdx >= 0; aIdx--) {
                const animal = animals[aIdx];
                const bDist = bullet.mesh.position.distanceTo(animal.group.position);
                
                if (bDist < 3.2) { // ชนโดนสัตว์!
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
                        gameState.onlineCorrect++;
                        if (gameState.online && match) match.report(gameState.onlineCorrect, { correct: gameState.onlineCorrect });
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

        // --- เคลื่อนไหวสัตว์ป่า (พฤติกรรมเดินช้าไล่ตามล่าเมื่อเข้าใกล้ หรือเดินเล่นเมื่ออยู่ไกล) ---
        // sabotage (online): ตัวคูณความเร็วไล่ล่าค่อย ๆ ลดกลับสู่ 1
        if (gameState.sab.chaseMult > 1) gameState.sab.chaseMult += (1 - gameState.sab.chaseMult) * Math.min(1, dt / CFG.SAB_DECAY_SEC);
        const chaseSpeed = 2.0 * gameState.sab.chaseMult; // สปีดไล่ล่า × ตัวคูณ sabotage
        const wanderSpeed = 1.0;
        for (let i = 0; i < animals.length; i++) {
            const animal = animals[i];
            
            // คำนวณเวกเตอร์พุ่งเข้าหาผู้เล่น
            const dx = player.position.x - animal.group.position.x;
            const dz = player.position.z - animal.group.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);
            
            // เช็คว่าผู้เล่นอยู่ในระยะติดตาม (CHASE_DIST) หรือไม่ (ติดตามเมื่อเข้าใกล้ และเลิกติดตามเมื่อออกห่าง)
            animal.group.userData.isAggro = (dist < CHASE_DIST);

            if (animal.group.userData.isAggro) {
                // ติดสถานะ Aggro -> วิ่งไล่ล่าติดตามผู้เล่นตลอดการเล่นในด่านนั้น
                if (dist > 0.1) {
                    animal.group.position.x += (dx / dist) * chaseSpeed * dt;
                    animal.group.position.z += (dz / dist) * chaseSpeed * dt;
                    const angle = Math.atan2(dx, dz);
                    animal.group.rotation.y = angle;
                }
                if (animal.group.userData.hasGLTF) {
                    setAnimalAnimation(animal.group, 'run');
                }
            } else {
                // หากยังไม่ถูกเปิดเผย/กระตุ้น -> เดินเล่นสำรวจทิศทางสุ่ม (Wandering)
                if (animal.group.userData.wanderAngle === undefined) {
                    animal.group.userData.wanderAngle = Math.random() * Math.PI * 2;
                    animal.group.userData.wanderTimer = 0;
                }
                animal.group.userData.wanderTimer += dt;
                // สุ่มเปลี่ยนทิศทางทุกๆ 3-6 วินาที
                if (animal.group.userData.wanderTimer > 3 + Math.random() * 3) {
                    animal.group.userData.wanderAngle = Math.random() * Math.PI * 2;
                    animal.group.userData.wanderTimer = 0;
                }
                
                const nextX = animal.group.position.x + Math.sin(animal.group.userData.wanderAngle) * wanderSpeed * dt;
                const nextZ = animal.group.position.z + Math.cos(animal.group.userData.wanderAngle) * wanderSpeed * dt;
                const limit = MAP_SIZE / 2 - 2;
                if (nextX > -limit && nextX < limit) animal.group.position.x = nextX;
                if (nextZ > -limit && nextZ < limit) animal.group.position.z = nextZ;
                
                animal.group.rotation.y = animal.group.userData.wanderAngle;

                if (animal.group.userData.hasGLTF) {
                    setAnimalAnimation(animal.group, 'walk');
                }
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
        camera.lookAt(player.position.x, 0.6, player.position.z);

        // --- ระบบแสงเงาวิ่งตามผู้เล่น (เพื่อรักษาขอบเขตเงาไม่ตกขอบแมปใหญ่) ---
        if (dirLight) {
            dirLight.position.set(player.position.x + 20, 30, player.position.z + 10);
            dirLight.target = player;
        }

        // อัปเดตเรดาร์แผนที่นำทาง (Radar)
        updateRadar();
    }

    // อนิเมชันสัตว์แบบลอยขึ้นลงเบาๆ + จัดการการกะพริบแดง
    animals.forEach(a => {
        const ud = a.group.userData;

        // หากเป็นโมเดล GLTF ให้ยืนนิ่งบนพื้น (ไม่ลอยขึ้นลง)
        if (!ud.hasGLTF) {
            a.group.position.y = Math.sin(time * 2 + ud.floatOffset) * 0.2;
        } else {
            a.group.position.y = 0;
        }
        
        // หมุนป้ายชื่อสัตว์ลอยได้ให้หันเข้าหากล้องเสมอ
        const sprite = ud.textSprite;
        if (sprite) {
            sprite.lookAt(camera.position);
        }
        
        // ควบคุมเอฟเฟกต์สีแดงเมื่อยิงผิด (Damage Flash)
        const bodyMesh = ud.bodyMesh;
        if (bodyMesh) {
            if (ud.damageFlash > 0) {
                ud.damageFlash -= dt;
                const redColor = new THREE.Color(0xff0000);
                if (ud.hasGLTF) {
                    bodyMesh.traverse(function (node) {
                        if (node.isMesh && node.material) {
                            if (!node.userData.originalColor) node.userData.originalColor = node.material.color.clone();
                            node.material.color.copy(redColor);
                        }
                    });
                } else {
                    if (bodyMesh.material) bodyMesh.material.color.setHex(0xff0000);
                }
            } else {
                if (ud.hasGLTF) {
                    bodyMesh.traverse(function (node) {
                        if (node.isMesh && node.material && node.userData.originalColor) {
                            node.material.color.copy(node.userData.originalColor);
                        }
                    });
                } else {
                    if (bodyMesh.material) bodyMesh.material.color.setHex(a.data.color);
                }
            }
        }
    });

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// ฟังก์ชันวาดแผนที่เรดาร์นำทางสีกรมท่าโปร่งแสงพร้อมแสดง Emojis สัตว์เป้าหมาย
function updateRadar() {
    const canvas = document.getElementById('radarCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // ทำงานในสภาพแวดล้อมจำลอง (JSDOM) ปลอดภัยไร้ข้อผิดพลาด
    
    // เคลียร์ Canvas เรดาร์เดิม
    ctx.clearRect(0, 0, 120, 120);
    
    // 1. วาดวงกลมขอบเรดาร์นำทาง
    ctx.beginPath();
    ctx.arc(60, 60, 58, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.65)'; // สีกรมท่าหรูหราสไตล์โปร่งแสง
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)'; // เส้นขอบสีฟ้านีออนอ่อนโยน
    ctx.stroke();
    
    // 2. วาดตารางกริต/วงแหวนระยะทาง
    ctx.beginPath();
    ctx.arc(60, 60, 30, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.stroke();
    
    ctx.beginPath();
    ctx.arc(60, 60, 50, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.stroke();
    
    // 3. วาดผู้เล่นอยู่ตรงกลางเสมอ (จุดสีน้ำเงินขอบขาว)
    ctx.beginPath();
    ctx.arc(60, 60, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#3b82f6';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    
    // วาดทิศทางการหันของผู้เล่น (ลูกศรเส้นนำสายตา)
    if (player) {
        const pAngle = player.rotation.y;
        ctx.beginPath();
        ctx.moveTo(60, 60);
        ctx.lineTo(60 + Math.sin(pAngle) * 9, 60 + Math.cos(pAngle) * 9);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
    
    // 4. วาดตำแหน่งของสัตว์และศัตรูในระยะแผนที่
    const RADAR_RANGE = 200; // ระยะการมองเห็นบนแผนที่เรดาร์
    
    animals.forEach(animal => {
        if (!player) return;
        const dx = animal.group.position.x - player.position.x;
        const dz = animal.group.position.z - player.position.z;
        const dist = Math.sqrt(dx * dx + dz * dz);
        
        if (dist <= RADAR_RANGE) {
            // คำนวณพิกัดสเกลจุดบน Canvas
            const rx = 60 + (dx / RADAR_RANGE) * 50;
            const ry = 60 + (dz / RADAR_RANGE) * 50;
            
            if (animal.data.type === gameState.targetCategory) {
                // สัตว์เป้าหมาย: วาดด้วย Emoji จริงตรงๆ สวยงามสะดุดตา
                ctx.font = '14px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(animal.data.emoji, rx, ry);
            } else {
                // สัตว์ประเภทอื่น/ศัตรู: วาดเป็นจุดสีแดงเพลิง เตือนภัยนักล่าไล่ล่า
                ctx.beginPath();
                ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
                ctx.fillStyle = '#ef4444';
                ctx.fill();
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#ffffff';
                ctx.stroke();
            }
        } else {
            // ถ้านอกระยะ RADAR แต่เป็นตัวเป้าหมายหลัก -> วาดขอบนำทาง
            if (animal.data.type === gameState.targetCategory) {
                const angle = Math.atan2(dz, dx);
                const bx = 60 + Math.cos(angle) * 52;
                const by = 60 + Math.sin(angle) * 52;
                
                ctx.beginPath();
                ctx.arc(bx, by, 3, 0, Math.PI * 2);
                ctx.fillStyle = '#22c55e'; // สีเขียวสัญลักณ์เป้าหมายสะท้อนทิศทาง
                ctx.fill();
            }
        }
    });
}

function onWindowResize() {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
