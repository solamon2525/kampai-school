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
    traps: [],            // เก็บข้อมูลกับดักที่วางบนแผนที่
    keys: { w: false, a: false, s: false, d: false, arrowup: false, arrowleft: false, arrowdown: false, arrowright: false, q: false, e: false },
    // ── โหมดออนไลน์แข่ง ──
    online: false,        // true = กำลังแข่งออนไลน์
    onlineCorrect: 0,     // ตอบถูกสะสม (ใช้รายงานคะแนน + จัดอันดับ)
    seed: 0,              // seed โลก (จากรหัสห้อง) — โหมดเดี่ยว = 0 → Math.random
    sab: { chaseMult: 1, oppCorrect: {} }  // sabotage: ตัวคูณความเร็วไล่ล่า + correct คู่แข่งล่าสุด
};

// คูลดาวน์การวางกับดัก (วินาที)
const TRAP_COOLDOWN = 0.45;
let lastTrapTime = 0;

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

// --- Game Mechanics Variables ---
let targetChangeTimer = 12;      // นับถอยหลังการสลับเป้าหมายปัจจุบัน (หน่วย: วินาที)
let cameraAngle = 0;             // องศามุมกล้องแนวระนาบ (เรเดียน)
let cameraZoom = 1.0;            // ค่าซูมกล้องเข้าออก (0.5 - 2.0)
let activePowerups = {
    boots: 0,                    // วิ่งเร็ว (วินาที)
    glasses: 0,                  // แว่นตามองเป้าหมาย (วินาที)
    camo: 0                      // ล่องหนพรางตัว (วินาที)
};
let ponds = [];                  // พิกัด/ข้อมูลสระน้ำสำหรับปลา
let grassPatches = [];           // พิกัด/ข้อมูลดงหญ้าสำหรับสัตว์เลื้อยคลาน
let powerupBoxes = [];           // ข้อมูลวัตถุไอเทมเก็บในสนาม
let dustStormTimer = 0;          // พายุฝุ่นจากคู่แข่ง (วินาที)
let stampedeTimer = 0;           // ฝูงสัตว์คลั่งวิ่งสุ่มเร็วขึ้น (วินาที)
let capturedHistory = [];        // ประวัติสัตว์ที่จับสำเร็จในด่านปัจจุบันเพื่อโชว์ใน Encyclopedia
let bioCardIndex = 0;            // หน้าการ์ด Encyclopedia ปัจจุบัน

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
    gameState.traps.forEach(t => scene.remove(t.mesh));
    
    // ล้างสระน้ำ หญ้า และไอเทมพาวเวอร์อัปเก่า
    ponds.forEach(p => scene.remove(p.mesh));
    grassPatches.forEach(g => scene.remove(g.mesh));
    powerupBoxes.forEach(p => scene.remove(p.mesh));
    
    animals = [];
    trees = [];
    gameState.traps = [];
    ponds = [];
    grassPatches = [];
    powerupBoxes = [];
    capturedHistory = []; // ล้างประวัติของด่านเก่า

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

    // สร้างสระน้ำสำหรับปลา 3 จุด
    const pondCoords = [
        { x: -MAP_SIZE * 0.25, z: -MAP_SIZE * 0.25 },
        { x: MAP_SIZE * 0.2, z: -MAP_SIZE * 0.15 },
        { x: -MAP_SIZE * 0.15, z: MAP_SIZE * 0.25 }
    ];
    pondCoords.forEach(c => {
        const pondGeo = new THREE.CylinderGeometry(14, 14, 0.15, 32);
        const pondMat = new THREE.MeshLambertMaterial({ color: 0x2563eb }); // สีน้ำเงินเข้ม
        const pondMesh = new THREE.Mesh(pondGeo, pondMat);
        pondMesh.position.set(c.x, 0.08, c.z); // เติมเหนือพื้นขึ้นมานิดนึง
        scene.add(pondMesh);
        ponds.push({ x: c.x, z: c.z, radius: 14, mesh: pondMesh });
    });

    // สร้างดงหญ้าสำหรับกิ้งก่า/จระเข้ 4 จุด
    const grassCoords = [
        { x: -MAP_SIZE * 0.2, z: MAP_SIZE * 0.1 },
        { x: MAP_SIZE * 0.25, z: MAP_SIZE * 0.2 },
        { x: MAP_SIZE * 0.1, z: -MAP_SIZE * 0.3 },
        { x: -MAP_SIZE * 0.3, z: -MAP_SIZE * 0.1 }
    ];
    grassCoords.forEach(c => {
        const grassGeo = new THREE.BoxGeometry(16, 2.5, 16);
        const grassMat = new THREE.MeshLambertMaterial({ 
            color: 0x15803d, // เขียวแก่ใบไม้
            transparent: true, 
            opacity: 0.45 
        });
        const grassMesh = new THREE.Mesh(grassGeo, grassMat);
        grassMesh.position.set(c.x, 1.25, c.z);
        scene.add(grassMesh);
        grassPatches.push({ x: c.x, z: c.z, size: 16, mesh: grassMesh });
    });

    // สปอว์นกล่อง Power-up 5 กล่องสุ่มตามแผนที่
    const powerupTypes = ['boots', 'glasses', 'camo'];
    const colors = { boots: 0x22c55e, glasses: 0xeab308, camo: 0xa855f7 }; // เขียว เหลือง ม่วง
    for (let i = 0; i < 5; i++) {
        const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
        const boxGeo = new THREE.BoxGeometry(1.6, 1.6, 1.6);
        const boxMat = new THREE.MeshLambertMaterial({ 
            color: colors[type],
            emissive: colors[type],
            emissiveIntensity: 0.25
        });
        const boxMesh = new THREE.Mesh(boxGeo, boxMat);
        
        // เกิดสุ่มแบบห่างจุดเกิดผู้เล่น
        let px, pz;
        do {
            px = (Math.random() - 0.5) * (MAP_SIZE - 20);
            pz = (Math.random() - 0.5) * (MAP_SIZE - 20);
        } while (Math.abs(px) < 15 && Math.abs(pz) < 15);

        boxMesh.position.set(px, 1.0, pz);
        scene.add(boxMesh);
        powerupBoxes.push({
            type: type,
            mesh: boxMesh,
            color: colors[type],
            floatOffset: Math.random() * Math.PI * 2
        });
    }

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

    // คำนวณจำนวนสัตว์เป้าหมายทั้งหมดแยกแต่ละสายพันธุ์/หมวดหมู่
    gameState.capturedProgress = {};
    gameState.totalRequired = {};
    
    currentAnimals.forEach(data => {
        if (!gameState.totalRequired[data.type]) {
            gameState.totalRequired[data.type] = 0;
            gameState.capturedProgress[data.type] = 0;
        }
        gameState.totalRequired[data.type] += SPAWNS_PER_ANIMAL;
    });

    // คำนวณคะแนนรวมที่ต้องเก็บทั้งหมดในด่านนี้
    let totalTarget = 0;
    for (const key in gameState.totalRequired) {
        totalTarget += gameState.totalRequired[key];
    }
    gameState.totalTargetAnimals = totalTarget;

    // ตั้งเป้าคะแนนด่านปัจจุบันเป็น 0
    gameState.score = 0;
    targetChangeTimer = 12; // เวลาเปลี่ยนเป้าหมายเริ่มต้น

    // เลือกและสุ่มตั้งเป้าหมายแรก
    switchTargetCategory();
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

    // สุ่มโทนสี (HSL Variation) เล็กน้อยเพื่อให้สีตัวสัตว์แต่ละตัวไม่ซ้ำซากจำเจ
    const baseColor = new THREE.Color(data.color);
    baseColor.offsetHSL((Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.08);
    const bodyMat = new THREE.MeshLambertMaterial({ color: baseColor });

    // สุ่มขนาดสเกลส่วนตัวสัตว์เล็กน้อย +/- 15%
    const bodyScaleX = 0.85 + Math.random() * 0.3;
    const bodyScaleY = 0.85 + Math.random() * 0.3;
    const bodyScaleZ = 0.85 + Math.random() * 0.3;

    // 1. ลำตัว (ทรงกระบอกแนวนอน)
    const bodyGeo = new THREE.CylinderGeometry(1.6, 1.6, 3.6, 16);
    bodyGeo.rotateX(Math.PI / 2);
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.y = 2.0;
    bodyMesh.scale.set(bodyScaleX, bodyScaleY, bodyScaleZ);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    body.add(bodyMesh);

    // 2. หัว (ทรงกลม)
    const headScale = 0.85 + Math.random() * 0.3;
    const headGeo = new THREE.SphereGeometry(1.4 * headScale, 16, 16);
    const headMesh = new THREE.Mesh(headGeo, bodyMat);
    headMesh.position.set(0, 3.0, 1.8);
    headMesh.castShadow = true;
    body.add(headMesh);

    // 3. ขา 4 ข้าง (สุ่มความสูง/หนาของขา)
    const legH = 1.0 + Math.random() * 0.8;
    const legThick = 0.3 + Math.random() * 0.15;
    const legGeo = new THREE.CylinderGeometry(legThick, legThick, legH, 8);
    const legMat = new THREE.MeshLambertMaterial({ color: baseColor });
    
    const legFL = new THREE.Mesh(legGeo, legMat); legFL.position.set(1.0, legH / 2, 1.2); legFL.castShadow = true;
    const legFR = new THREE.Mesh(legGeo, legMat); legFR.position.set(-1.0, legH / 2, 1.2); legFR.castShadow = true;
    const legBL = new THREE.Mesh(legGeo, legMat); legBL.position.set(1.0, legH / 2, -1.2); legBL.castShadow = true;
    const legBR = new THREE.Mesh(legGeo, legMat); legBR.position.set(-1.0, legH / 2, -1.2); legBR.castShadow = true;
    body.add(legFL, legFR, legBL, legBR);

    // 4. ตา 2 ข้าง (จุดดำ)
    const eyeGeo = new THREE.SphereGeometry(0.2, 8, 8);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.5, 3.0 + 0.3 * headScale, 1.8 + 1.2 * headScale);
    const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.5, 3.0 + 0.3 * headScale, 1.8 + 1.2 * headScale);
    body.add(eyeL, eyeR);

    // 5. สุ่มเครื่องประดับ/ลักษณะเฉพาะตัวอื่นๆ เพื่อความหลากหลาย (Accessories)
    const randFeature = Math.random();
    if (randFeature < 0.25) {
        // แฟลตลายจุดบนตัว (Spots) 4 จุด
        const spotMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
        for (let i = 0; i < 4; i++) {
            const spotGeo = new THREE.SphereGeometry(0.35, 8, 8);
            const spot = new THREE.Mesh(spotGeo, spotMat);
            const side = i % 2 === 0 ? 1.65 : -1.65;
            spot.position.set(side * bodyScaleX, 2.0 + (Math.random() - 0.5) * 0.8, (Math.random() - 0.5) * 1.5);
            body.add(spot);
        }
    } else if (randFeature < 0.50) {
        // แผงหนามบนหลัง (Spikes)
        const spikeMat = new THREE.MeshLambertMaterial({ color: 0xdd6b20 });
        for (let i = 0; i < 3; i++) {
            const spikeGeo = new THREE.ConeGeometry(0.3, 0.7, 4);
            const spike = new THREE.Mesh(spikeGeo, spikeMat);
            spike.position.set(0, 2.0 + 1.6 * bodyScaleY, -1.0 + i * 0.8);
            spike.rotation.x = Math.PI / 6;
            body.add(spike);
        }
    } else if (randFeature < 0.75) {
        // หู/เขา สองข้างบนหัว
        const hornGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.9, 6);
        const hornMat = new THREE.MeshLambertMaterial({ color: 0xe2e8f0 });
        const hornL = new THREE.Mesh(hornGeo, hornMat);
        hornL.position.set(0.6 * headScale, 3.0 + 1.2 * headScale, 1.8);
        hornL.rotation.z = -Math.PI / 6;
        const hornR = new THREE.Mesh(hornGeo, hornMat);
        hornR.position.set(-0.6 * headScale, 3.0 + 1.2 * headScale, 1.8);
        hornR.rotation.z = Math.PI / 6;
        body.add(hornL, hornR);
    } else if (randFeature < 0.90) {
        // สวมหมวกจิ๋วสีสันสดใส (Cute tiny explorer hat!)
        const hatGroup = new THREE.Group();
        const hatColor = [0xef4444, 0x3b82f6, 0xa855f7, 0xf59e0b][Math.floor(Math.random() * 4)];
        const hatMat = new THREE.MeshLambertMaterial({ color: hatColor });
        const hatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.08, 12), hatMat);
        const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.6, 12), hatMat);
        hatTop.position.y = 0.3;
        hatGroup.add(hatBase, hatTop);
        hatGroup.position.set(0, 3.0 + 1.35 * headScale, 1.8);
        body.add(hatGroup);
    }

    group.add(body);

    // ป้ายชื่อสัตว์ลอยได้
    const sprite = createTextSprite(data.emoji + " " + data.name);
    sprite.position.y = 2.5;
    group.add(sprite);

    // ตำแหน่ง: ปกติ = กระจายทั่วแมป ตามประเภทสิ่งแวดล้อม
    let px, pz, py = 0;
    let assignedPond = null;
    let assignedGrass = null;

    if (opts.nearPlayer && player) {
        const ang = Math.random() * Math.PI * 2, r = 16 + Math.random() * 10;
        px = player.position.x + Math.sin(ang) * r;
        pz = player.position.z + Math.cos(ang) * r;
        if (data.type === window.ANIMAL_TYPES.BIRD) {
            py = 5.5;
        }
    } else {
        if (data.type === window.ANIMAL_TYPES.FISH && ponds.length > 0) {
            // เกิดในสระน้ำสุ่ม
            assignedPond = ponds[Math.floor(worldRng() * ponds.length)];
            const r = worldRng() * (assignedPond.radius - 3.5);
            const ang = worldRng() * Math.PI * 2;
            px = assignedPond.x + Math.sin(ang) * r;
            pz = assignedPond.z + Math.cos(ang) * r;
            py = 0.2; // ระดับสระน้ำ
        } else if (data.type === window.ANIMAL_TYPES.REPTILE && grassPatches.length > 0) {
            // เกิดในดงหญ้าสุ่ม
            assignedGrass = grassPatches[Math.floor(worldRng() * grassPatches.length)];
            const rxOffset = (worldRng() - 0.5) * (assignedGrass.size - 4);
            const rzOffset = (worldRng() - 0.5) * (assignedGrass.size - 4);
            px = assignedGrass.x + rxOffset;
            pz = assignedGrass.z + rzOffset;
            py = 0.0;
        } else {
            // เกิดสุ่มตามแผนที่ทั่วไป
            do {
                px = (worldRng() - 0.5) * (MAP_SIZE - 8);
                pz = (worldRng() - 0.5) * (MAP_SIZE - 8);
            } while (Math.abs(px) < 8 && Math.abs(pz) < 8);
            
            if (data.type === window.ANIMAL_TYPES.BIRD) {
                py = 5.5; // นกบินบนอากาศ
            }
        }
    }

    group.position.set(px, py, pz);
    scene.add(group);

    // ทำตัวโปร่งแสงพรางตัวในดงหญ้าสำหรับสัตว์เลื้อยคลาน
    if (assignedGrass) {
        body.traverse(child => {
            if (child.isMesh) {
                child.material = child.material.clone(); // โคลนแยกชิ้น
                child.material.transparent = true;
                child.material.opacity = 0.25;
            }
        });
    }

    // offset ลอยตัว + สถานะ aggro + ข้อมูลสิ่งแวดล้อม
    group.userData = {
        data: data,
        startY: py,
        floatOffset: Math.random() * Math.PI * 2,
        damageFlash: 0, // คูลดาวน์การกะพริบแดงเมื่อยิงผิด
        isAggro: !!opts.aggro,  // sabotage spawn = ดุทันที · ปกติ = false (aggro เมื่อผู้เล่นเข้าใกล้)
        hasGLTF: false,
        mixer: null,
        animations: null,
        currentAction: null,
        
        pond: assignedPond,
        grass: assignedGrass,
        isHiddenReptile: assignedGrass ? true : false,
        revealAlpha: assignedGrass ? 0.25 : 1.0
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
                // ปรับขนาดและตำแหน่งโมเดลสัตว์ (สุ่มขนาดเพิ่ม/ลด +/- 20% เพื่อความหลากหลายทางสายพันธุ์)
                const randomScale = 0.12 * (0.8 + Math.random() * 0.4);
                model.scale.set(randomScale, randomScale, randomScale);
                model.position.set(0, 0, 0);

                model.traverse(function (node) {
                    if (node.isMesh) {
                        node.castShadow = true;
                        node.receiveShadow = true;
                        node.material = node.material.clone();
                        
                        // ปรับแต่งเฉดสีวัสดุเล็กน้อยเพื่อให้สัตว์แต่ละตัวสีเหลือบไม่เท่ากัน
                        if (node.material.color) {
                            node.material.color.offsetHSL((Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05);
                        }
                        
                        if (group.userData.isHiddenReptile) {
                            node.material.transparent = true;
                            node.material.opacity = 0.25;
                        }
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
        
        // วางกับดักด้วยปุ่ม Spacebar
        if (key === ' ' || key === 'spacebar') {
            e.preventDefault();
            attemptPlaceTrap();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        const key = e.key.toLowerCase();
        if (gameState.keys.hasOwnProperty(key)) {
            gameState.keys[key] = false;
        }
    });

    // ลากเมาส์/ปัดเพื่อหมุนมุมกล้องรอบตัวผู้เล่น
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    
    window.addEventListener('pointerdown', (e) => {
        // ถ้าวางกับดักขณะเล่นเกมและไม่ได้กด UI
        if (gameState.isPlaying && e.target.tagName !== 'BUTTON' && !e.target.closest('#ui-layer')) {
            attemptPlaceTrap();
            isDragging = true;
            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    window.addEventListener('pointermove', (e) => {
        if (isDragging && gameState.isPlaying) {
            const deltaX = e.clientX - previousMousePosition.x;
            cameraAngle += deltaX * 0.005; // ปรับความละเอียดการหมุน
            previousMousePosition = { x: e.clientX, y: e.clientY };
        }
    });

    window.addEventListener('pointerup', () => {
        isDragging = false;
    });

    // ซูมมุมกล้องเข้าออกด้วย Wheel เมาส์
    window.addEventListener('wheel', (e) => {
        if (gameState.isPlaying) {
            cameraZoom += e.deltaY * 0.0008;
            cameraZoom = Math.max(0.4, Math.min(2.2, cameraZoom));
        }
    }, { passive: true });

    // ปุ่มควบคุมกล้องบน HUD
    const rotLBtn = document.getElementById('cam-rot-l');
    const rotRBtn = document.getElementById('cam-rot-r');
    const zoomInBtn = document.getElementById('cam-zoom-in');
    const zoomOutBtn = document.getElementById('cam-zoom-out');
    
    if (rotLBtn) {
        rotLBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            cameraAngle -= 0.35;
        });
    }
    if (rotRBtn) {
        rotRBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            cameraAngle += 0.35;
        });
    }
    if (zoomInBtn) {
        zoomInBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            cameraZoom = Math.max(0.4, cameraZoom - 0.2);
        });
    }
    if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            cameraZoom = Math.min(2.2, cameraZoom + 0.2);
        });
    }

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

    // ปุ่มควบคุมสมุดคลังการ์ด Encyclopedia (Bio-Cards)
    const prevCardBtn = document.getElementById('bio-card-prev');
    const nextCardBtn = document.getElementById('bio-card-next');
    const closeBioBtn = document.getElementById('close-bio-btn');
    
    if (prevCardBtn) {
        prevCardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (capturedHistory.length > 0) {
                bioCardIndex = (bioCardIndex - 1 + capturedHistory.length) % capturedHistory.length;
                renderBioCard();
            }
        });
    }
    if (nextCardBtn) {
        nextCardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (capturedHistory.length > 0) {
                bioCardIndex = (bioCardIndex + 1) % capturedHistory.length;
                renderBioCard();
            }
        });
    }
    if (closeBioBtn) {
        closeBioBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const modal = document.getElementById('bio-cards-modal');
            if (modal) modal.classList.add('hidden');
            
            // ลุยด่านถัดไป
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
    
    // ซ่อนโมเดลสมุดคลังความรู้การ์ด
    const bioModal = document.getElementById('bio-cards-modal');
    if (bioModal) bioModal.classList.add('hidden');

    // รีเซ็ตสถานะป่วนและบัฟออนไลน์
    activePowerups = { boots: 0, glasses: 0, camo: 0 };
    dustStormTimer = 0;
    stampedeTimer = 0;
    const dsOverlay = document.getElementById('dust-storm-overlay');
    if (dsOverlay) dsOverlay.classList.remove('active');

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
    
    // ตั้งค่าเวลาสำหรับพายุทราย (ฝุ่นตลบ) และสัตว์ป่าคลั่ง (Stampede)
    dustStormTimer = 6.0;
    stampedeTimer = 6.0;

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
    el.textContent = '🌪️ ฝุ่นตลบและแตรสัตว์คลั่งจากคู่แข่ง! 😱';
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

function playShutterSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.08);
        
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.08);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.08);
    } catch (e) {
        console.warn("Web Audio shutter sound failed:", e);
    }
}

function fireBullet() {
    // 1. เล่นเสียงชัตเตอร์ของกล้องถ่ายรูป
    playShutterSound();
    
    // 2. แสดงเอฟเฟกต์แสงแฟลชบนหน้าจอ (Shutter Flash)
    const flashEl = document.getElementById('flash-overlay');
    if (flashEl) {
        flashEl.classList.add('active');
        setTimeout(() => {
            flashEl.classList.remove('active');
        }, 60);
    }
    
    // ทิศทางที่ผู้เล่นหันหน้าไป
    const angle = player.rotation.y;
    const vx = Math.sin(angle) * BULLET_SPEED;
    const vz = Math.cos(angle) * BULLET_SPEED;
    
    // สร้างกระสุน 3D เป็นคลื่นแสงแฟลชสีขาว (Expanding White Sphere)
    const bulletGeo = new THREE.SphereGeometry(0.5, 16, 16);
    const bulletMat = new THREE.MeshBasicMaterial({ 
        color: 0xffffff, 
        transparent: true, 
        opacity: 0.85 
    });
    const bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);
    
    // เริ่มต้นจากตัวผู้เล่น ลอยอยู่ระดับอก
    bulletMesh.position.set(player.position.x, 0.8, player.position.z);
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
    
    const bioModal = document.getElementById('bio-cards-modal');
    if (bioModal) bioModal.classList.add('hidden');
    
    // รีเซ็ตพาวเวอร์อัปและเอฟเฟกต์หน้าจอป่วน
    activePowerups = { boots: 0, glasses: 0, camo: 0 };
    dustStormTimer = 0;
    stampedeTimer = 0;
    const dsOverlay = document.getElementById('dust-storm-overlay');
    if (dsOverlay) dsOverlay.classList.remove('active');
    
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

function switchTargetCategory() {
    // หาหมวดหมู่ที่ยังเก็บไม่ครบ
    const incompleteCategories = [];
    const currentAnimals = window.ANIMAL_DB_LEVELS[gameState.currentLevel] || window.ANIMAL_DB_LEVELS[1];
    const uniqueTypes = [...new Set(currentAnimals.map(a => a.type))];
    
    uniqueTypes.forEach(type => {
        const required = gameState.totalRequired[type] || 0;
        const captured = gameState.capturedProgress[type] || 0;
        if (captured < required) {
            incompleteCategories.push(type);
        }
    });

    if (incompleteCategories.length === 0) {
        // ครบหมดทุกตัวแล้ว!
        checkWin();
        return;
    }

    // สุ่มเลือกเป้าหมายที่ยังเก็บไม่ครบ (หลีกเลี่ยงเป้าหมายเดิมถ้าเป็นไปได้)
    let newTarget = incompleteCategories[Math.floor(Math.random() * incompleteCategories.length)];
    if (incompleteCategories.length > 1 && newTarget === gameState.targetCategory) {
        const others = incompleteCategories.filter(t => t !== gameState.targetCategory);
        newTarget = others[Math.floor(Math.random() * others.length)];
    }

    gameState.targetCategory = newTarget;
    targetChangeTimer = 12; // รีเซ็ตเวลาเป็น 12 วินาที
    
    updateHUD();
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

    // อัปเดตตัวเลขเวลาสลับเป้าหมาย
    const timerDisplay = document.getElementById('target-timer');
    if (timerDisplay) {
        timerDisplay.innerText = `เปลี่ยนใน: ${Math.ceil(targetChangeTimer)} วินาที`;
    }
    
    // เติมบาร์เกจความคืบหน้า (Progress Bars) แต่ละประเภท
    const progressList = document.getElementById('progress-list');
    if (progressList && gameState.totalRequired) {
        let html = '';
        const sortedCategories = Object.keys(gameState.totalRequired).sort();
        
        sortedCategories.forEach(type => {
            const required = gameState.totalRequired[type];
            const captured = gameState.capturedProgress[type] || 0;
            const percent = Math.min(100, Math.round((captured / required) * 100));
            const isComplete = captured >= required;
            
            // หา Emojis ประจำประเภทสัตว์
            const currentAnimals = window.ANIMAL_DB_LEVELS[gameState.currentLevel] || window.ANIMAL_DB_LEVELS[1];
            const match = currentAnimals.find(a => a.type === type);
            const emoji = match ? match.emoji : '🐾';

            // สีของบาร์เกจ
            const barColor = isComplete ? 'bg-green-500' : 'bg-blue-500';
            const statusIcon = isComplete ? '✅' : '⏳';
            const statusText = isComplete ? 'ครบแล้ว' : `${captured}/${required}`;

            html += `
                <div class="flex flex-col gap-0.5 text-xs text-gray-700">
                    <div class="flex justify-between font-bold text-[10px] sm:text-[11px]">
                        <span>${emoji} ${type}</span>
                        <span class="${isComplete ? 'text-green-600' : 'text-blue-600'}">${statusIcon} ${statusText}</span>
                    </div>
                    <div class="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div class="${barColor} h-full transition-all duration-300" style="width: ${percent}%"></div>
                    </div>
                </div>
            `;
        });
        progressList.innerHTML = html;
    }
}

function showBioCardsModal() {
    gameState.isPlaying = false;
    hud.classList.add('hidden');
    const radar = document.getElementById('radar-container');
    if (radar) radar.classList.add('hidden');
    KAMPAI.sound.bgmStop();
    KAMPAI.sound.fxFlash(); // เสียงเฉลิมฉลอง
    
    // เคลียร์กระสุนค้างในจอ
    gameState.bullets.forEach(b => scene.remove(b.mesh));
    gameState.bullets = [];
    
    const modal = document.getElementById('bio-cards-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
    
    bioCardIndex = 0;
    renderBioCard();
}

function renderBioCard() {
    const carousel = document.getElementById('bio-cards-carousel');
    const indicator = document.getElementById('bio-card-indicator');
    if (!carousel || !indicator) return;
    
    if (capturedHistory.length === 0) {
        carousel.innerHTML = `
            <div class="text-gray-400 text-sm text-center">
                ไม่มีประวัติการคัดแยกสัตว์ในรอบนี้
            </div>
        `;
        indicator.innerText = "0 / 0";
        return;
    }
    
    const animal = capturedHistory[bioCardIndex];
    indicator.innerText = `${bioCardIndex + 1} / ${capturedHistory.length}`;
    
    carousel.innerHTML = `
        <div class="flex flex-col items-center gap-3 w-full animate-fade-in">
            <div class="text-7xl p-3 bg-white rounded-3xl shadow-inner border border-blue-100 flex items-center justify-center w-24 h-24 select-none">${animal.emoji}</div>
            <div class="text-center">
                <h3 class="text-lg font-extrabold text-blue-700">${animal.name}</h3>
                <span class="inline-block bg-blue-100 text-blue-800 text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-0.5">${animal.type}</span>
            </div>
            <div class="bg-white border border-blue-50 p-3 rounded-xl text-xs text-gray-600 text-left w-full shadow-sm leading-relaxed">
                <b>💡 เกร็ดความรู้:</b> ${animal.hint || "สัตว์จำพวกมีกระดูกสันหลังที่สำคัญต่อระบบนิเวศ"}
            </div>
        </div>
    `;
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
            // สำเร็จด่าน โชว์สมุดคลังความรู้การ์ด
            showBioCardsModal();
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
        // จัดการนับถอยหลังการสลับเป้าหมาย
        targetChangeTimer -= dt;
        if (targetChangeTimer <= 0) {
            switchTargetCategory();
            // ออกเสียงแจ้งเตือนสั้นๆ เพื่อสะกิดความสนใจนักเรียน
            KAMPAI.sound.speak("เปลี่ยนเป้าหมาย", "th-TH");
        } else {
            // อัปเดตเฉพาะตัวเลขเวลาถอยหลังใน HUD เพื่อประหยัด CPU
            const timerDisplay = document.getElementById('target-timer');
            if (timerDisplay) {
                timerDisplay.innerText = `เปลี่ยนใน: ${Math.ceil(targetChangeTimer)} วินาที`;
            }
        }

        // --- การควบคุมและเคลื่อนที่ผู้เล่น ---
        let forwardAmount = 0;
        let rightAmount = 0;

        if (gameState.keys.w || gameState.keys.arrowup) forwardAmount = 1;
        if (gameState.keys.s || gameState.keys.arrowdown) forwardAmount = -1;
        if (gameState.keys.a || gameState.keys.arrowleft) rightAmount = -1;
        if (gameState.keys.d || gameState.keys.arrowright) rightAmount = 1;

        // รักษาความเร็วการเดินแยงมุมให้เท่ากับแนวปกติ
        if (forwardAmount !== 0 && rightAmount !== 0) {
            const length = Math.sqrt(forwardAmount * forwardAmount + rightAmount * rightAmount);
            forwardAmount /= length;
            rightAmount /= length;
        }

        // หมุนเวกเตอร์การเคลื่อนที่ตามมุมกล้องปัจจุบัน (ให้ปุ่มทิศทาง WASD สัมพันธ์กับมุมมองหน้าจอ)
        const cos = Math.cos(cameraAngle);
        const sin = Math.sin(cameraAngle);
        const rotMoveX = rightAmount * cos - forwardAmount * sin;
        const rotMoveZ = -rightAmount * sin - forwardAmount * cos;

        // ใช้ความเร็วแบบรองเท้าสปีด (Safari Boots)
        const speedMultiplier = activePowerups.boots > 0 ? 1.7 : 1.0;
        const newX = player.position.x + rotMoveX * PLAYER_SPEED * speedMultiplier * dt;
        const newZ = player.position.z + rotMoveZ * PLAYER_SPEED * speedMultiplier * dt;

        // ตรวจขอบแมปซาฟารี
        const limit = MAP_SIZE / 2 - 1;
        if (newX > -limit && newX < limit) player.position.x = newX;
        if (newZ > -limit && newZ < limit) player.position.z = newZ;

        // อนิเมชันกระโดดดึ๋งๆ ขณะเดิน (หรือใช้ท่าวิ่ง/เดินของ GLTF)
        if (forwardAmount !== 0 || rightAmount !== 0) {
            if (hasGLTFPlayer) {
                setPlayerAnimation('walk');
            } else {
                player.position.y = Math.abs(Math.sin(time * 15)) * 0.5;
            }
            
            // หมุนตัวบล็อกผู้เล่นหันหน้าไปทิศทางการเดินจริง
            const targetAngle = Math.atan2(rotMoveX, rotMoveZ);
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

        // จัดการและนับถอยหลังระยะเวลาของพาวเวอร์อัปต่างๆ
        if (activePowerups.boots > 0) activePowerups.boots = Math.max(0, activePowerups.boots - dt);
        if (activePowerups.glasses > 0) activePowerups.glasses = Math.max(0, activePowerups.glasses - dt);
        if (activePowerups.camo > 0) activePowerups.camo = Math.max(0, activePowerups.camo - dt);

        // จัดการนับถอยหลังพายุทราย (ฝุ่นตลบ) และสัตว์ป่าคลั่ง (Sabotage)
        if (dustStormTimer > 0) {
            dustStormTimer = Math.max(0, dustStormTimer - dt);
            const dsOverlay = document.getElementById('dust-storm-overlay');
            if (dsOverlay) {
                if (dustStormTimer > 0) {
                    dsOverlay.classList.add('active');
                } else {
                    dsOverlay.classList.remove('active');
                }
            }
        }
        if (stampedeTimer > 0) {
            stampedeTimer = Math.max(0, stampedeTimer - dt);
        }

        // อัปเดตการแสดงผลไอคอนพาวเวอร์อัปที่กำลังทำงานบนหน้าจอ HUD
        const pContainer = document.getElementById('powerups-hud');
        if (pContainer) {
            let html = '';
            if (activePowerups.boots > 0) {
                html += `<div class="bg-green-500/90 text-white font-bold text-[10px] px-2.5 py-1 rounded-xl shadow border border-green-300 animate-pulse flex items-center gap-1">🥾 สปีด: ${Math.ceil(activePowerups.boots)} วิ</div>`;
            }
            if (activePowerups.glasses > 0) {
                html += `<div class="bg-yellow-500/90 text-white font-bold text-[10px] px-2.5 py-1 rounded-xl shadow border border-yellow-300 animate-pulse flex items-center gap-1">🔍 แว่นมอง: ${Math.ceil(activePowerups.glasses)} วิ</div>`;
            }
            if (activePowerups.camo > 0) {
                html += `<div class="bg-purple-500/90 text-white font-bold text-[10px] px-2.5 py-1 rounded-xl shadow border border-purple-300 animate-pulse flex items-center gap-1">🍃 พรางตัว: ${Math.ceil(activePowerups.camo)} วิ</div>`;
            }
            pContainer.innerHTML = html;
        }

        // จัดการไอเทมพาวเวอร์อัปที่สปอว์นในสนาม (กล่องลอยหมุนสปิน)
        for (let pIdx = powerupBoxes.length - 1; pIdx >= 0; pIdx--) {
            const pBox = powerupBoxes[pIdx];
            pBox.mesh.rotation.y += dt * 1.5;
            pBox.mesh.rotation.x += dt * 0.8;
            pBox.mesh.position.y = 1.0 + Math.sin(time * 2.5 + pBox.floatOffset) * 0.15;
            
            // ตรวจการชนระหว่างผู้เล่นกับกล่องไอเทม
            const pDist = player.position.distanceTo(pBox.mesh.position);
            if (pDist < 2.5) {
                scene.remove(pBox.mesh);
                powerupBoxes.splice(pIdx, 1);
                
                // รับไอเทม 10 วินาที
                activePowerups[pBox.type] = 10.0;
                
                try {
                    KAMPAI.sound.correct();
                    if (pBox.type === 'boots') {
                        KAMPAI.sound.speak("รองเท้าวิ่งเร็ว", "th-TH");
                    } else if (pBox.type === 'glasses') {
                        KAMPAI.sound.speak("แว่นตามองเป้าหมาย", "th-TH");
                    } else if (pBox.type === 'camo') {
                        KAMPAI.sound.speak("สเปรย์พรางตัว", "th-TH");
                    }
                } catch(e){}
            }
        }

        // --- อัปเดตและเช็คการเหยียบกับดัก (Trap Trigger System) ---
        for (let tIdx = gameState.traps.length - 1; tIdx >= 0; tIdx--) {
            const trap = gameState.traps[tIdx];
            
            // คอนโทรลเหยื่อล่อลอยหมุนสปิน
            const baitMesh = trap.mesh.children.find(c => c.geometry && c.geometry.type === "BoxGeometry");
            if (baitMesh) {
                baitMesh.rotation.y += dt * 2.5;
                baitMesh.position.y = 0.25 + Math.sin(time * 5.0) * 0.04;
            }
            
            let trapTriggered = false;
            // เช็คว่ามีสัตว์ตัวใดเดินมาใกล้พิกัดกับดักหรือไม่
            for (let aIdx = animals.length - 1; aIdx >= 0; aIdx--) {
                const animal = animals[aIdx];
                
                // สัตว์ที่ยังซ่อนตัวอยู่ในดงหญ้า หรือสัตว์ปีก (บินอยู่บนฟ้า) จะไม่โดนกับดักบนดิน
                if (animal.group.userData.isHiddenReptile) continue;
                if (animal.group.userData.data.type === window.ANIMAL_TYPES.BIRD) continue;
                
                const dx = trap.x - animal.group.position.x;
                const dz = trap.z - animal.group.position.z;
                const dist = Math.sqrt(dx * dx + dz * dz);
                
                if (dist < 2.5) { // รัศมีเหยียบกับดัก (อิงตามสัตว์ 200% size)
                    trapTriggered = true;
                    
                    // นำกับดักออกจากซีนและอาร์เรย์
                    scene.remove(trap.mesh);
                    gameState.traps.splice(tIdx, 1);
                    
                    // ตรวจเช็คความถูกต้องของเป้าหมายประเภทสัตว์
                    if (animal.group.userData.data.type === gameState.targetCategory) {
                        // จับถูกประเภท! -> เล่นเสียงความสำเร็จ
                        KAMPAI.sound.correct();
                        scene.remove(animal.group);
                        animals.splice(aIdx, 1);
                        
                        // บันทึกความคืบหน้าของประเภทสัตว์ที่จับได้
                        const animalType = animal.group.userData.data.type;
                        if (!gameState.capturedProgress[animalType]) {
                            gameState.capturedProgress[animalType] = 0;
                        }
                        gameState.capturedProgress[animalType]++;
                        
                        // บันทึกประวัติ Encyclopedia
                        if (!capturedHistory.some(a => a.id === animal.group.userData.data.id)) {
                            capturedHistory.push(animal.group.userData.data);
                        }
                        
                        gameState.score++;
                        gameState.onlineCorrect++;
                        if (gameState.online && match) match.report(gameState.onlineCorrect, { correct: gameState.onlineCorrect });
                        
                        // สลับเป้าหมายถัดไปทันที
                        switchTargetCategory();
                    } else {
                        // จับผิดประเภท! -> หักหัวใจ/พลังชีวิต
                        takeDamage();
                        animal.group.userData.damageFlash = 0.5; // กะพริบตัวสีแดง
                        
                        // สัตว์ป่าตัวนี้โกรธและไล่ล่าติดตามผู้เล่นทันที
                        animal.group.userData.isAggro = true;
                        
                        // เด้งสัตว์ป่ากระเด็นออกจากผู้เล่นเล็กน้อยเพื่อรีเซ็ตขอบเขตชน
                        const angleToPlayer = Math.atan2(animal.group.position.x - player.position.x, animal.group.position.z - player.position.z);
                        animal.group.position.x += Math.sin(angleToPlayer) * 4;
                        animal.group.position.z += Math.cos(angleToPlayer) * 4;
                    }
                    break;
                }
            }
            if (trapTriggered) continue;
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

            // ระบบแว่นตานักชีววิทยา (Biologist Glasses) ไฮไลท์เป้าหมาย
            const isTarget = animal.data.type === gameState.targetCategory;
            const hasGlasses = activePowerups.glasses > 0;
            
            // ขยายป้ายชื่อลอยตัวและทำให้ชีพจรโมเดลขยายเมื่อมองผ่านแว่นตา
            const nameSprite = animal.group.children.find(c => c.isSprite);
            if (nameSprite) {
                if (hasGlasses && isTarget) {
                    nameSprite.scale.set(8, 4, 1);
                    nameSprite.position.y = 5.0; // ลอยสูงขึ้น
                } else {
                    nameSprite.scale.set(4, 2, 1);
                    nameSprite.position.y = 3.0; // ระดับปกติ
                }
            }
            if (hasGlasses && isTarget) {
                const pulse = 1.0 + Math.sin(time * 8) * 0.15;
                animal.group.scale.set(pulse, pulse, pulse);
            } else {
                animal.group.scale.set(1.0, 1.0, 1.0);
            }
            
            // ตรวจสอบการแสดงตัวของกิ้งก่า/จระเข้ที่พรางตัวในดงหญ้าเมื่อผู้เล่นเข้าใกล้
            if (animal.group.userData.isHiddenReptile) {
                if (dist < 18) { // ค้นพบตัวเมื่ออยู่ใกล้ในระยะ 18 หน่วย
                    animal.group.userData.isHiddenReptile = false;
                    animal.group.traverse(child => {
                        if (child.isMesh) {
                            child.material.opacity = 1.0;
                            child.material.transparent = false;
                        }
                    });
                    try { KAMPAI.sound.wrong(); } catch (e) {} // ส่งเสียงแจ้งเตือนสัตว์กระโดดเข้าใส่
                }
            }

            // เช็คว่าผู้เล่นอยู่ในระยะติดตาม (CHASE_DIST) หรือไม่
            // หากมีสถานะล่องหน Camo Spray อยู่ สัตว์จะไม่เห็นผู้เล่นเลย
            const isPlayerInvisible = activePowerups.camo > 0;
            // สลักเกลียว: สัตว์จะคลั่งวิ่งไล่ล่าทันทีถ้ารวมเหตุการณ์คู่แข่งป่วน (stampede) หรือผู้เล่นอยู่ในระยะ
            const isAggroActive = !isPlayerInvisible && (dist < CHASE_DIST || stampedeTimer > 0);
            animal.group.userData.isAggro = isAggroActive && !animal.group.userData.isHiddenReptile;

            if (animal.group.userData.isAggro) {
                // ติดสถานะ Aggro -> วิ่งไล่ล่าติดตามผู้เล่น
                const currentChaseSpeed = stampedeTimer > 0 ? chaseSpeed * 1.8 : chaseSpeed;
                if (dist > 0.1) {
                    animal.group.position.x += (dx / dist) * currentChaseSpeed * dt;
                    animal.group.position.z += (dz / dist) * currentChaseSpeed * dt;
                    const angle = Math.atan2(dx, dz);
                    animal.group.rotation.y = angle;
                }
                if (animal.group.userData.hasGLTF) {
                    setAnimalAnimation(animal.group, 'run');
                }
            } else {
                // หากยังไม่ถูกกระตุ้น -> เดินเล่นสำรวจทิศทางสุ่ม (Wandering)
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
                
                const wx = Math.sin(animal.group.userData.wanderAngle) * wanderSpeed * dt;
                const wz = Math.cos(animal.group.userData.wanderAngle) * wanderSpeed * dt;
                
                const nextX = animal.group.position.x + wx;
                const nextZ = animal.group.position.z + wz;
                
                // ถ้าน้ำสระปลา ถูกขังในสระน้ำ
                const pond = animal.group.userData.pond;
                if (pond) {
                    const pdx = nextX - pond.x;
                    const pdz = nextZ - pond.z;
                    const pdist = Math.sqrt(pdx * pdx + pdz * pdz);
                    if (pdist < pond.radius - 2.5) {
                        animal.group.position.x = nextX;
                        animal.group.position.z = nextZ;
                    } else {
                        // ชนขอบสระ -> หันหลังกลับทันที
                        animal.group.userData.wanderAngle = Math.random() * Math.PI * 2;
                        animal.group.userData.wanderTimer = 0;
                    }
                } else {
                    const limit = MAP_SIZE / 2 - 2;
                    if (nextX > -limit && nextX < limit) animal.group.position.x = nextX;
                    if (nextZ > -limit && nextZ < limit) animal.group.position.z = nextZ;
                }
                
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

        // ตรวจสอบอินพุตหมุนกล้องแนวระนาบด้วยปุ่ม Q และ E
        if (gameState.keys.q) {
            cameraAngle -= 2.0 * dt;
        }
        if (gameState.keys.e) {
            cameraAngle += 2.0 * dt;
        }

        // --- มุมมองกล้องตามตัวละครแบบ Orbit (หมุนและซูมได้) ---
        const baseDistance = 18;
        const baseHeight = 15;
        const targetDistance = baseDistance * cameraZoom;
        const targetHeight = baseHeight * cameraZoom;

        // คำนวณพิกัดมุมกล้องเป้าหมายรอบผู้เล่น
        const cameraTargetX = player.position.x + Math.sin(cameraAngle) * targetDistance;
        const cameraTargetZ = player.position.z + Math.cos(cameraAngle) * targetDistance;
        const cameraTargetY = player.position.y + targetHeight;

        // ค่อยๆ Lerp เลื่อนกล้องไปพิกัดเป้าหมายอย่างลื่นไหล
        camera.position.x += (cameraTargetX - camera.position.x) * 0.1;
        camera.position.y += (cameraTargetY - camera.position.y) * 0.1;
        camera.position.z += (cameraTargetZ - camera.position.z) * 0.1;
        camera.lookAt(player.position.x, 0.8, player.position.z);

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
