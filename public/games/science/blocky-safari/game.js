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
const ANIMAL_BASE_SCALES = {
    // เล็กสุดตั้งต้นเท่ากับผู้เล่น (สเกล 1.0) เพื่อการมองเห็นที่ง่ายสำหรับเด็ก
    toadlet: 1.0,
    frog: 1.0,
    bullfrog: 1.0,
    toad: 1.0,
    guppy: 1.0,
    goldfish: 1.0,
    clownfish: 1.0,
    fightingfish: 1.0,
    newt: 1.0,
    gecko: 1.0,
    lizard: 1.0,
    desertlizard: 1.0,
    salamander: 1.0,
    bat: 1.0,
    cat: 1.0,
    dog: 1.0,
    chicken: 1.0,
    duck: 1.0,
    pigeon: 1.0,
    seagull: 1.0,
    owl: 1.0,
    turtle: 1.0,
    rattlesnake: 1.0,
    python: 1.0,
    monkey: 1.0,
    penguin: 1.0,
    eagle: 1.0,
    parrot: 1.0,
    carp: 1.0,

    // ขนาดกลาง-ใหญ่ (ขยายเพิ่มขึ้นจากคน)
    leatherback: 1.4,
    lion: 1.6,
    horse: 1.8,
    cow: 1.8,
    polarbear: 1.8,
    camel: 1.8,
    ostrich: 1.8,
    crocodile: 1.8,
    shark: 2.0,
    stingray: 1.8,
    dolphin: 1.8,

    // ขนาดมโหฬาร
    elephant: 3.5,
    whale: 4.0
};

let k3d, scene, camera, renderer, dirLight;
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
let targetChangeTimer = 30;      // นับถอยหลังการสลับเป้าหมายปัจจุบัน (หน่วย: วินาที)
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
    
    k3d = Kampai3D.create({
        container: '#game-container',
        canvas: canvas,
        fov: 60,
        near: 0.1,
        far: 1000,
        cameraPos: { x: 0, y: 15, z: 20 },
        cameraLookAt: { x: 0, y: 0, z: 0 },
        shadows: true,
        backgroundColor: 0x87CEEB,
        fogColor: 0x87CEEB,
        fogDensity: 0.005,
        hemisphereLight: true,
        hemiSkyColor: 0xffffff,
        hemiGroundColor: 0x444444,
        hemiIntensity: 0.6,
        dirLightIntensity: 0.8,
        dirLightPos: { x: 20, y: 30, z: 10 }
    });

    scene = k3d.scene;
    camera = k3d.camera;
    renderer = k3d.renderer;

    // ดึง Directional Light ที่สร้างขึ้นมาโดยเฟรมเวิร์ก เพื่อตั้งค่า Shadow Camera ต่อ
    dirLight = scene.children.find(c => c.isDirectionalLight);
    if (dirLight && dirLight.shadow && dirLight.shadow.camera) {
        dirLight.shadow.camera.near = 10;
        dirLight.shadow.camera.far = 100;
        dirLight.shadow.camera.left = -30;
        dirLight.shadow.camera.right = 30;
        dirLight.shadow.camera.top = 30;
        dirLight.shadow.camera.bottom = -30;
        if (dirLight.shadow.camera.updateProjectionMatrix) {
            dirLight.shadow.camera.updateProjectionMatrix();
        }
    }

    buildWorld();
}

function safeRemove(object) {
    if (!object) return;
    object.traverse(child => {
        if (child.geometry) {
            try { child.geometry.dispose(); } catch (e) {}
        }
        if (child.material) {
            try {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            } catch (e) {}
        }
    });
    scene.remove(object);
}

function buildWorld() {
    // ล้าง Entity เก่าในซีน พร้อมปล่อยคืนหน่วยความจำ WebGL ป้องกัน Memory Leak
    if (player) safeRemove(player);
    animals.forEach(a => safeRemove(a.group));
    trees.forEach(t => safeRemove(t));
    gameState.traps.forEach(t => safeRemove(t.mesh));
    
    // ล้างสระน้ำ หญ้า และไอเทมพาวเวอร์อัปเก่า
    ponds.forEach(p => safeRemove(p.mesh));
    grassPatches.forEach(g => safeRemove(g.mesh));
    powerupBoxes.forEach(p => safeRemove(p.mesh));
    
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
    targetChangeTimer = 30; // เวลาเปลี่ยนเป้าหมายเริ่มต้น

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

function buildProceduralAnimal(data, bodyMat) {
    const group = new THREE.Group();
    let legs = [];
    let tailFin = null;
    let segments = [];
    let height = 1.0;
    let isSnake = false;
    let isFish = false;

    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const beakMat = new THREE.MeshLambertMaterial({ color: 0xfabf2c }); // Orange-yellow
    const whiteMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const bellyMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const skinColor = new THREE.Color(data.color);
    const skinMat = bodyMat || new THREE.MeshLambertMaterial({ color: skinColor });

    const type = data.type;
    const id = data.id;

    if (type === window.ANIMAL_TYPES.BIRD) {
        // Birds: 2 legs, wings, beak
        if (id === 'ostrich') {
            height = 2.2;
            const bodyGeo = new THREE.BoxGeometry(0.7, 0.7, 0.9);
            const bodyMesh = new THREE.Mesh(bodyGeo, skinMat);
            bodyMesh.position.y = 1.25;
            bodyMesh.castShadow = true;
            group.add(bodyMesh);

            const neckGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.9, 8);
            const neck = new THREE.Mesh(neckGeo, skinMat);
            neck.position.set(0, 1.8, 0.35);
            neck.rotation.x = -Math.PI / 12;
            neck.castShadow = true;
            group.add(neck);

            const headGeo = new THREE.SphereGeometry(0.24, 12, 12);
            const head = new THREE.Mesh(headGeo, skinMat);
            head.position.set(0, 2.2, 0.45);
            head.castShadow = true;
            group.add(head);

            const beakGeo = new THREE.ConeGeometry(0.08, 0.25, 4);
            const beak = new THREE.Mesh(beakGeo, beakMat);
            beak.position.set(0, 2.2, 0.65);
            beak.rotation.x = Math.PI / 2;
            group.add(beak);

            const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.15, 2.25, 0.52);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.15, 2.25, 0.52);
            group.add(eyeL, eyeR);

            const legFL = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 8), new THREE.MeshLambertMaterial({ color: 0xdd9966 }));
            legFL.position.set(0.2, 0.5, 0);
            legFL.castShadow = true;
            const legFR = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.0, 8), new THREE.MeshLambertMaterial({ color: 0xdd9966 }));
            legFR.position.set(-0.2, 0.5, 0);
            legFR.castShadow = true;
            group.add(legFL, legFR);
            legs.push(legFL, legFR);
        } else if (id === 'penguin') {
            height = 1.1;
            const bodyGeo = new THREE.BoxGeometry(0.65, 0.9, 0.65);
            const darkMat = new THREE.MeshLambertMaterial({ color: 0x1f2937 }); // slate-800
            const bodyMesh = new THREE.Mesh(bodyGeo, darkMat);
            bodyMesh.position.y = 0.55;
            bodyMesh.castShadow = true;
            group.add(bodyMesh);

            const bellyGeo = new THREE.BoxGeometry(0.45, 0.7, 0.08);
            const belly = new THREE.Mesh(bellyGeo, bellyMat);
            belly.position.set(0, 0.5, 0.3);
            group.add(belly);

            const headGeo = new THREE.BoxGeometry(0.55, 0.4, 0.55);
            const head = new THREE.Mesh(headGeo, darkMat);
            head.position.set(0, 1.05, 0);
            head.castShadow = true;
            group.add(head);

            const beakGeo = new THREE.ConeGeometry(0.08, 0.22, 4);
            const beak = new THREE.Mesh(beakGeo, beakMat);
            beak.position.set(0, 1.0, 0.35);
            beak.rotation.x = Math.PI / 2;
            group.add(beak);

            const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.18, 1.1, 0.25);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.18, 1.1, 0.25);
            group.add(eyeL, eyeR);

            const flipperGeo = new THREE.BoxGeometry(0.1, 0.6, 0.35);
            const flipL = new THREE.Mesh(flipperGeo, darkMat); flipL.position.set(0.36, 0.65, 0); flipL.rotation.z = -Math.PI / 8;
            const flipR = new THREE.Mesh(flipperGeo, darkMat); flipR.position.set(-0.36, 0.65, 0); flipR.rotation.z = Math.PI / 8;
            group.add(flipL, flipR);

            const footMat = new THREE.MeshLambertMaterial({ color: 0xea580c });
            const footGeo = new THREE.BoxGeometry(0.2, 0.1, 0.35);
            const footL = new THREE.Mesh(footGeo, footMat); footL.position.set(0.18, 0.05, 0.1);
            const footR = new THREE.Mesh(footGeo, footMat); footR.position.set(-0.18, 0.05, 0.1);
            group.add(footL, footR);
            legs.push(footL, footR);
        } else {
            height = 1.0;
            const bodyGeo = new THREE.BoxGeometry(0.55, 0.55, 0.75);
            const bodyMesh = new THREE.Mesh(bodyGeo, skinMat);
            bodyMesh.position.y = 0.55;
            bodyMesh.castShadow = true;
            group.add(bodyMesh);

            const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
            const head = new THREE.Mesh(headGeo, skinMat);
            head.position.set(0, 0.95, 0.2);
            head.castShadow = true;
            group.add(head);

            const beakGeo = new THREE.ConeGeometry(0.08, 0.22, 4);
            const beak = new THREE.Mesh(beakGeo, beakMat);
            beak.position.set(0, 0.92, 0.42);
            beak.rotation.x = Math.PI / 2;
            group.add(beak);

            const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.15, 1.0, 0.32);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.15, 1.0, 0.32);
            group.add(eyeL, eyeR);

            const wingGeo = new THREE.BoxGeometry(0.08, 0.4, 0.55);
            const wingL = new THREE.Mesh(wingGeo, skinMat); wingL.position.set(0.3, 0.6, 0); wingL.rotation.z = -Math.PI / 16;
            const wingR = new THREE.Mesh(wingGeo, skinMat); wingR.position.set(-0.3, 0.6, 0); wingR.rotation.z = Math.PI / 16;
            group.add(wingL, wingR);

            const legH = 0.3;
            const legGeo = new THREE.CylinderGeometry(0.04, 0.04, legH, 8);
            const orangeMat = new THREE.MeshLambertMaterial({ color: 0xf59e0b });
            const legL = new THREE.Mesh(legGeo, orangeMat); legL.position.set(0.15, legH / 2, 0); legL.castShadow = true;
            const legR = new THREE.Mesh(legGeo, orangeMat); legR.position.set(-0.15, legH / 2, 0); legR.castShadow = true;
            group.add(legL, legR);
            legs.push(legL, legR);
        }
    } else if (type === window.ANIMAL_TYPES.FISH) {
        isFish = true;
        height = 0.8;

        if (id === 'shark') {
            const bodyGeo = new THREE.BoxGeometry(0.55, 0.55, 1.5);
            const greyMat = new THREE.MeshLambertMaterial({ color: 0x64748b });
            const bodyMesh = new THREE.Mesh(bodyGeo, greyMat);
            bodyMesh.position.y = 0.4;
            bodyMesh.castShadow = true;
            group.add(bodyMesh);

            const headGeo = new THREE.BoxGeometry(0.45, 0.4, 0.55);
            const head = new THREE.Mesh(headGeo, greyMat);
            head.position.set(0, 0.38, 0.85);
            group.add(head);

            const dorsalGeo = new THREE.BoxGeometry(0.1, 0.45, 0.35);
            const dorsal = new THREE.Mesh(dorsalGeo, greyMat);
            dorsal.position.set(0, 0.8, -0.1);
            dorsal.rotation.x = -Math.PI / 8;
            group.add(dorsal);

            const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.24, 0.45, 0.95);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.24, 0.45, 0.95);
            group.add(eyeL, eyeR);

            const tailGeo = new THREE.BoxGeometry(0.08, 0.65, 0.35);
            tailFin = new THREE.Mesh(tailGeo, greyMat);
            tailFin.position.set(0, 0.4, -0.85);
            group.add(tailFin);
        } else if (id === 'stingray') {
            const bodyGeo = new THREE.BoxGeometry(1.6, 0.08, 1.2);
            const greyBlueMat = new THREE.MeshLambertMaterial({ color: 0x475569 });
            const bodyMesh = new THREE.Mesh(bodyGeo, greyBlueMat);
            bodyMesh.position.y = 0.25;
            bodyMesh.castShadow = true;
            group.add(bodyMesh);

            const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.15, 0.31, 0.3);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.15, 0.31, 0.3);
            group.add(eyeL, eyeR);

            const tailGeo = new THREE.BoxGeometry(0.06, 0.06, 1.0);
            tailFin = new THREE.Mesh(tailGeo, greyBlueMat);
            tailFin.position.set(0, 0.25, -1.05);
            group.add(tailFin);
        } else if (id === 'whale' || id === 'dolphin') {
            const bodyGeo = new THREE.BoxGeometry(0.75, 0.75, 1.8);
            const blueMat = new THREE.MeshLambertMaterial({ color: id === 'whale' ? 0x0284c7 : 0x38bdf8 });
            const bodyMesh = new THREE.Mesh(bodyGeo, blueMat);
            bodyMesh.position.y = 0.55;
            bodyMesh.castShadow = true;
            group.add(bodyMesh);

            const headGeo = new THREE.BoxGeometry(0.6, 0.55, 0.5);
            const head = new THREE.Mesh(headGeo, blueMat);
            head.position.set(0, 0.5, 1.05);
            group.add(head);

            const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.31, 0.55, 1.0);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.31, 0.55, 1.0);
            group.add(eyeL, eyeR);

            const tailGeo = new THREE.BoxGeometry(0.6, 0.08, 0.35);
            tailFin = new THREE.Mesh(tailGeo, blueMat);
            tailFin.position.set(0, 0.55, -1.05);
            group.add(tailFin);
        } else {
            const bodyGeo = new THREE.BoxGeometry(0.35, 0.55, 0.95);
            const bodyMesh = new THREE.Mesh(bodyGeo, skinMat);
            bodyMesh.position.y = 0.4;
            bodyMesh.castShadow = true;
            group.add(bodyMesh);

            const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.185, 0.45, 0.3);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.185, 0.45, 0.3);
            group.add(eyeL, eyeR);

            const finGeo = new THREE.BoxGeometry(0.25, 0.08, 0.25);
            const finL = new THREE.Mesh(finGeo, skinMat); finL.position.set(0.22, 0.35, 0.15); finL.rotation.z = -Math.PI/6;
            const finR = new THREE.Mesh(finGeo, skinMat); finR.position.set(-0.22, 0.35, 0.15); finR.rotation.z = Math.PI/6;
            group.add(finL, finR);

            const tailGeo = new THREE.BoxGeometry(0.06, 0.45, 0.3);
            tailFin = new THREE.Mesh(tailGeo, skinMat);
            tailFin.position.set(0, 0.4, -0.6);
            group.add(tailFin);
        }
    } else if (type === window.ANIMAL_TYPES.REPTILE) {
        if (id === 'python' || id === 'python_sab' || id === 'rattlesnake') {
            isSnake = true;
            height = 0.5;

            const segCount = 5;
            for (let i = 0; i < segCount; i++) {
                const segGeo = new THREE.BoxGeometry(0.32, 0.32, 0.4);
                const col = i % 2 === 0 ? skinColor : new THREE.Color(skinColor).multiplyScalar(0.75);
                const segMat = new THREE.MeshLambertMaterial({ color: col });
                const seg = new THREE.Mesh(segGeo, segMat);
                seg.position.set(0, 0.16, 0.8 - i * 0.4);
                seg.castShadow = true;
                group.add(seg);
                segments.push(seg);
            }

            const head = segments[0];
            const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.16, 0.12, 0.12);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.16, 0.12, 0.12);
            head.add(eyeL, eyeR);

            const tongueGeo = new THREE.BoxGeometry(0.06, 0.03, 0.25);
            const tongueMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const tongue = new THREE.Mesh(tongueGeo, tongueMat);
            tongue.position.set(0, -0.05, 0.3);
            head.add(tongue);
        } else if (id === 'turtle' || id === 'leatherback') {
            height = 0.6;
            const bodyGeo = new THREE.BoxGeometry(0.55, 0.25, 0.95);
            const bodyMesh = new THREE.Mesh(bodyGeo, skinMat);
            bodyMesh.position.y = 0.2;
            bodyMesh.castShadow = true;
            group.add(bodyMesh);

            const shellGeo = new THREE.BoxGeometry(0.85, 0.45, 1.05);
            const shellMat = new THREE.MeshLambertMaterial({ color: 0x78350f }); // brown shell
            const shell = new THREE.Mesh(shellGeo, shellMat);
            shell.position.set(0, 0.4, 0);
            shell.castShadow = true;
            group.add(shell);

            const headGeo = new THREE.BoxGeometry(0.3, 0.25, 0.35);
            const head = new THREE.Mesh(headGeo, skinMat);
            head.position.set(0, 0.25, 0.6);
            head.castShadow = true;
            group.add(head);

            const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.12, 0.1, 0.12);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.12, 0.1, 0.12);
            head.add(eyeL, eyeR);

            const legH = 0.2;
            const legGeo = new THREE.CylinderGeometry(0.08, 0.08, legH, 8);
            const legFL = new THREE.Mesh(legGeo, skinMat); legFL.position.set(0.35, legH / 2, 0.35);
            const legFR = new THREE.Mesh(legGeo, skinMat); legFR.position.set(-0.35, legH / 2, 0.35);
            const legBL = new THREE.Mesh(legGeo, skinMat); legBL.position.set(0.35, legH / 2, -0.35);
            const legBR = new THREE.Mesh(legGeo, skinMat); legBR.position.set(-0.35, legH / 2, -0.35);
            group.add(legFL, legFR, legBL, legBR);
            legs.push(legFL, legFR, legBL, legBR);
        } else {
            height = 0.65;
            const bodyGeo = new THREE.BoxGeometry(0.45, 0.28, 1.3);
            const bodyMesh = new THREE.Mesh(bodyGeo, skinMat);
            bodyMesh.position.y = 0.22;
            bodyMesh.castShadow = true;
            group.add(bodyMesh);

            const headGeo = new THREE.BoxGeometry(0.35, 0.25, 0.45);
            const head = new THREE.Mesh(headGeo, skinMat);
            head.position.set(0, 0.25, 0.75);
            head.castShadow = true;
            group.add(head);

            const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.15, 0.3, 0.8);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.15, 0.3, 0.8);
            group.add(eyeL, eyeR);

            const tailGeo = new THREE.BoxGeometry(0.22, 0.12, 0.75);
            const tail = new THREE.Mesh(tailGeo, skinMat);
            tail.position.set(0, 0.16, -0.9);
            group.add(tail);

            if (id === 'crocodile') {
                const spikeMat = new THREE.MeshLambertMaterial({ color: 0x14532d });
                for (let i = 0; i < 3; i++) {
                    const spikeGeo = new THREE.ConeGeometry(0.08, 0.2, 4);
                    const spike = new THREE.Mesh(spikeGeo, spikeMat);
                    spike.position.set(0, 0.4, 0.3 - i * 0.35);
                    group.add(spike);
                }
            }

            const legH = 0.22;
            const legGeo = new THREE.CylinderGeometry(0.08, 0.08, legH, 8);
            const legFL = new THREE.Mesh(legGeo, skinMat); legFL.position.set(0.28, legH / 2, 0.4);
            const legFR = new THREE.Mesh(legGeo, skinMat); legFR.position.set(-0.28, legH / 2, 0.4);
            const legBL = new THREE.Mesh(legGeo, skinMat); legBL.position.set(0.28, legH / 2, -0.4);
            const legBR = new THREE.Mesh(legGeo, skinMat); legBR.position.set(-0.28, legH / 2, -0.4);
            group.add(legFL, legFR, legBL, legBR);
            legs.push(legFL, legFR, legBL, legBR);
        }
    } else if (type === window.ANIMAL_TYPES.AMPHIBIAN) {
        height = 0.7;
        const bodyGeo = new THREE.BoxGeometry(0.55, 0.45, 0.75);
        const bodyMesh = new THREE.Mesh(bodyGeo, skinMat);
        bodyMesh.position.y = 0.25;
        bodyMesh.castShadow = true;
        group.add(bodyMesh);

        const eyeBulgeGeo = new THREE.SphereGeometry(0.12, 8, 8);
        const bulgeL = new THREE.Mesh(eyeBulgeGeo, skinMat); bulgeL.position.set(0.18, 0.5, 0.25);
        const bulgeR = new THREE.Mesh(eyeBulgeGeo, skinMat); bulgeR.position.set(-0.18, 0.5, 0.25);
        group.add(bulgeL, bulgeR);

        const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.18, 0.52, 0.33);
        const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.18, 0.52, 0.33);
        group.add(eyeL, eyeR);

        if (id === 'salamander' || id === 'newt') {
            const tailGeo = new THREE.BoxGeometry(0.18, 0.18, 0.65);
            const tail = new THREE.Mesh(tailGeo, skinMat);
            tail.position.set(0, 0.25, -0.6);
            group.add(tail);
        }

        const legH = 0.25;
        const legGeo = new THREE.CylinderGeometry(0.07, 0.07, legH, 8);
        const legFL = new THREE.Mesh(legGeo, skinMat); legFL.position.set(0.3, legH / 2, 0.25);
        const legFR = new THREE.Mesh(legGeo, skinMat); legFR.position.set(-0.3, legH / 2, 0.25);
        const legBL = new THREE.Mesh(legGeo, skinMat); legBL.position.set(0.3, legH / 2, -0.25);
        const legBR = new THREE.Mesh(legGeo, skinMat); legBR.position.set(-0.3, legH / 2, -0.25);
        group.add(legFL, legFR, legBL, legBR);
        legs.push(legFL, legFR, legBL, legBR);
    } else {
        // Mammals: 4 legs
        if (id === 'elephant') {
            height = 1.6;
            const bodyGeo = new THREE.BoxGeometry(1.0, 0.9, 1.6);
            const greyMat = new THREE.MeshLambertMaterial({ color: 0x6b7280 });
            const bodyMesh = new THREE.Mesh(bodyGeo, greyMat);
            bodyMesh.position.y = 0.85;
            bodyMesh.castShadow = true;
            group.add(bodyMesh);

            const headGeo = new THREE.BoxGeometry(0.8, 0.75, 0.75);
            const head = new THREE.Mesh(headGeo, greyMat);
            head.position.set(0, 1.15, 0.85);
            head.castShadow = true;
            group.add(head);

            const eyeGeo = new THREE.SphereGeometry(0.06, 8, 8);
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.41, 1.25, 0.95);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.41, 1.25, 0.95);
            group.add(eyeL, eyeR);

            const earGeo = new THREE.BoxGeometry(0.12, 0.85, 0.6);
            const earL = new THREE.Mesh(earGeo, greyMat); earL.position.set(0.48, 1.2, 0.7); earL.rotation.y = -Math.PI / 6;
            const earR = new THREE.Mesh(earGeo, greyMat); earR.position.set(-0.48, 1.2, 0.7); earR.rotation.y = Math.PI / 6;
            group.add(earL, earR);

            const trunkGeo = new THREE.BoxGeometry(0.2, 0.75, 0.2);
            const trunk = new THREE.Mesh(trunkGeo, greyMat);
            trunk.position.set(0, 0.8, 1.25);
            trunk.rotation.x = -Math.PI / 12;
            group.add(trunk);

            const tuskGeo = new THREE.BoxGeometry(0.08, 0.08, 0.45);
            const tuskMat = new THREE.MeshLambertMaterial({ color: 0xffffff });
            const tuskL = new THREE.Mesh(tuskGeo, tuskMat); tuskL.position.set(0.25, 0.9, 1.15); tuskL.rotation.x = Math.PI / 12;
            const tuskR = new THREE.Mesh(tuskGeo, tuskMat); tuskR.position.set(-0.25, 0.9, 1.15); tuskR.rotation.x = Math.PI / 12;
            group.add(tuskL, tuskR);

            const legH = 0.5;
            const legGeo = new THREE.CylinderGeometry(0.16, 0.16, legH, 8);
            const legFL = new THREE.Mesh(legGeo, greyMat); legFL.position.set(0.35, legH / 2, 0.5); legFL.castShadow = true;
            const legFR = new THREE.Mesh(legGeo, greyMat); legFR.position.set(-0.35, legH / 2, 0.5); legFR.castShadow = true;
            const legBL = new THREE.Mesh(legGeo, greyMat); legBL.position.set(0.35, legH / 2, -0.5); legBL.castShadow = true;
            const legBR = new THREE.Mesh(legGeo, greyMat); legBR.position.set(-0.35, legH / 2, -0.5); legBR.castShadow = true;
            group.add(legFL, legFR, legBL, legBR);
            legs.push(legFL, legFR, legBL, legBR);
        } else if (id === 'lion') {
            height = 1.2;
            const bodyGeo = new THREE.BoxGeometry(0.55, 0.55, 1.15);
            const bodyMesh = new THREE.Mesh(bodyGeo, skinMat);
            bodyMesh.position.y = 0.65;
            bodyMesh.castShadow = true;
            group.add(bodyMesh);

            const headGeo = new THREE.BoxGeometry(0.48, 0.48, 0.48);
            const head = new THREE.Mesh(headGeo, skinMat);
            head.position.set(0, 0.95, 0.55);
            head.castShadow = true;
            group.add(head);

            const maneGeo = new THREE.BoxGeometry(0.75, 0.75, 0.28);
            const maneMat = new THREE.MeshLambertMaterial({ color: 0x9a3412 });
            const mane = new THREE.Mesh(maneGeo, maneMat);
            mane.position.set(0, 0.95, 0.4);
            group.add(mane);

            const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.16, 1.0, 0.76);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.16, 1.0, 0.76);
            group.add(eyeL, eyeR);

            const tailGeo = new THREE.BoxGeometry(0.08, 0.08, 0.45);
            const tail = new THREE.Mesh(tailGeo, skinMat);
            tail.position.set(0, 0.7, -0.75);
            tail.rotation.x = -Math.PI / 4;
            group.add(tail);

            const legH = 0.42;
            const legGeo = new THREE.CylinderGeometry(0.1, 0.1, legH, 8);
            const legFL = new THREE.Mesh(legGeo, skinMat); legFL.position.set(0.2, legH / 2, 0.35); legFL.castShadow = true;
            const legFR = new THREE.Mesh(legGeo, skinMat); legFR.position.set(-0.2, legH / 2, 0.35); legFR.castShadow = true;
            const legBL = new THREE.Mesh(legGeo, skinMat); legBL.position.set(0.2, legH / 2, -0.35); legBL.castShadow = true;
            const legBR = new THREE.Mesh(legGeo, skinMat); legBR.position.set(-0.2, legH / 2, -0.35); legBR.castShadow = true;
            group.add(legFL, legFR, legBL, legBR);
            legs.push(legFL, legFR, legBL, legBR);
        } else if (id === 'camel') {
            height = 1.5;
            const bodyGeo = new THREE.BoxGeometry(0.55, 0.65, 1.15);
            const bodyMesh = new THREE.Mesh(bodyGeo, skinMat);
            bodyMesh.position.y = 0.85;
            bodyMesh.castShadow = true;
            group.add(bodyMesh);

            const humpGeo = new THREE.BoxGeometry(0.45, 0.3, 0.35);
            const hump1 = new THREE.Mesh(humpGeo, skinMat); hump1.position.set(0, 1.25, 0.15);
            const hump2 = new THREE.Mesh(humpGeo, skinMat); hump2.position.set(0, 1.25, -0.25);
            group.add(hump1, hump2);

            const neckGeo = new THREE.CylinderGeometry(0.08, 0.12, 0.6, 8);
            const neck = new THREE.Mesh(neckGeo, skinMat);
            neck.position.set(0, 1.2, 0.65);
            neck.rotation.x = -Math.PI / 6;
            group.add(neck);

            const headGeo = new THREE.BoxGeometry(0.35, 0.35, 0.45);
            const head = new THREE.Mesh(headGeo, skinMat);
            head.position.set(0, 1.5, 0.8);
            head.castShadow = true;
            group.add(head);

            const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.15, 1.55, 0.95);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.15, 1.55, 0.95);
            group.add(eyeL, eyeR);

            const legH = 0.6;
            const legGeo = new THREE.CylinderGeometry(0.07, 0.07, legH, 8);
            const legFL = new THREE.Mesh(legGeo, skinMat); legFL.position.set(0.2, legH / 2, 0.35); legFL.castShadow = true;
            const legFR = new THREE.Mesh(legGeo, skinMat); legFR.position.set(-0.2, legH / 2, 0.35); legFR.castShadow = true;
            const legBL = new THREE.Mesh(legGeo, skinMat); legBL.position.set(0.2, legH / 2, -0.35); legBL.castShadow = true;
            const legBR = new THREE.Mesh(legGeo, skinMat); legBR.position.set(-0.2, legH / 2, -0.35); legBR.castShadow = true;
            group.add(legFL, legFR, legBL, legBR);
            legs.push(legFL, legFR, legBL, legBR);
        } else if (id === 'bat') {
            height = 0.9;
            const bodyGeo = new THREE.BoxGeometry(0.38, 0.55, 0.38);
            const bodyMesh = new THREE.Mesh(bodyGeo, skinMat);
            bodyMesh.position.y = 0.45;
            bodyMesh.castShadow = true;
            group.add(bodyMesh);

            const earGeo = new THREE.ConeGeometry(0.1, 0.25, 4);
            const earL = new THREE.Mesh(earGeo, skinMat); earL.position.set(0.12, 0.8, 0);
            const earR = new THREE.Mesh(earGeo, skinMat); earR.position.set(-0.12, 0.8, 0);
            group.add(earL, earR);

            const eyeGeo = new THREE.SphereGeometry(0.04, 8, 8);
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.1, 0.55, 0.18);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.1, 0.55, 0.18);
            group.add(eyeL, eyeR);

            const wingGeo = new THREE.BoxGeometry(0.85, 0.35, 0.04);
            const wingMat = new THREE.MeshLambertMaterial({ color: 0x111827 });
            const wingL = new THREE.Mesh(wingGeo, wingMat); wingL.position.set(0.55, 0.5, 0); wingL.rotation.y = -Math.PI / 12;
            const wingR = new THREE.Mesh(wingGeo, wingMat); wingR.position.set(-0.55, 0.5, 0); wingR.rotation.y = Math.PI / 12;
            group.add(wingL, wingR);

            const hookGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8);
            const hookL = new THREE.Mesh(hookGeo, wingMat); hookL.position.set(0.08, 0.1, 0);
            const hookR = new THREE.Mesh(hookGeo, wingMat); hookR.position.set(-0.08, 0.1, 0);
            group.add(hookL, hookR);
            legs.push(hookL, hookR);
        } else {
            height = 1.1;
            const bodyGeo = new THREE.BoxGeometry(0.55, 0.55, 1.05);
            const bodyMesh = new THREE.Mesh(bodyGeo, skinMat);
            bodyMesh.position.y = 0.55;
            bodyMesh.castShadow = true;
            group.add(bodyMesh);

            const headGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
            const head = new THREE.Mesh(headGeo, skinMat);
            head.position.set(0, 0.85, 0.48);
            head.castShadow = true;
            group.add(head);

            const eyeGeo = new THREE.SphereGeometry(0.05, 8, 8);
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(0.14, 0.9, 0.66);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(-0.14, 0.9, 0.66);
            group.add(eyeL, eyeR);

            const snoutGeo = new THREE.BoxGeometry(0.24, 0.18, 0.2);
            const snoutMat = new THREE.MeshLambertMaterial({ color: skinColor.clone().multiplyScalar(0.85) });
            const snout = new THREE.Mesh(snoutGeo, snoutMat);
            snout.position.set(0, 0.78, 0.68);
            group.add(snout);

            const tailGeo = new THREE.BoxGeometry(0.07, 0.07, 0.35);
            const tail = new THREE.Mesh(tailGeo, skinMat);
            tail.position.set(0, 0.65, -0.65);
            tail.rotation.x = -Math.PI / 4;
            group.add(tail);

            if (id === 'cow') {
                const spotMat = new THREE.MeshLambertMaterial({ color: 0x111827 });
                for (let i = 0; i < 3; i++) {
                    const spotGeo = new THREE.SphereGeometry(0.16, 8, 8);
                    const spot = new THREE.Mesh(spotGeo, spotMat);
                    spot.position.set((i % 2 === 0 ? 0.28 : -0.28), 0.6 + (Math.random() - 0.5) * 0.1, 0.2 - i * 0.3);
                    group.add(spot);
                }
                const hornGeo = new THREE.ConeGeometry(0.06, 0.18, 4);
                const hornL = new THREE.Mesh(hornGeo, whiteMat); hornL.position.set(0.18, 1.1, 0.45); hornL.rotation.z = -Math.PI / 12;
                const hornR = new THREE.Mesh(hornGeo, whiteMat); hornR.position.set(-0.18, 1.1, 0.45); hornR.rotation.z = Math.PI / 12;
                group.add(hornL, hornR);
            }

            if (id === 'cat' || id === 'dog') {
                const earGeo = new THREE.ConeGeometry(0.08, 0.18, 4);
                const earL = new THREE.Mesh(earGeo, skinMat); earL.position.set(0.16, 1.08, 0.45);
                const earR = new THREE.Mesh(earGeo, skinMat); earR.position.set(-0.16, 1.08, 0.45);
                group.add(earL, earR);
            }

            const legH = 0.38;
            const legGeo = new THREE.CylinderGeometry(0.08, 0.08, legH, 8);
            const legFL = new THREE.Mesh(legGeo, skinMat); legFL.position.set(0.2, legH / 2, 0.3); legFL.castShadow = true;
            const legFR = new THREE.Mesh(legGeo, skinMat); legFR.position.set(-0.2, legH / 2, 0.3); legFR.castShadow = true;
            const legBL = new THREE.Mesh(legGeo, skinMat); legBL.position.set(0.2, legH / 2, -0.3); legBL.castShadow = true;
            const legBR = new THREE.Mesh(legGeo, skinMat); legBR.position.set(-0.2, legH / 2, -0.3); legBR.castShadow = true;
            group.add(legFL, legFR, legBL, legBR);
            legs.push(legFL, legFR, legBL, legBR);
        }
    }

    return {
        mesh: group,
        legs: legs,
        tailFin: tailFin,
        segments: segments,
        height: height,
        isSnake: isSnake,
        isFish: isFish
    };
}

function spawnAnimal(data, opts) {
    opts = opts || {};
    const group = new THREE.Group();

    // สร้างโมเดลสัตว์ด้วยระบบ Procedural Builder (สเกลเล็กลง น่ารักขึ้น)
    const baseColor = new THREE.Color(data.color);
    baseColor.offsetHSL((Math.random() - 0.5) * 0.08, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.08);
    const bodyMat = new THREE.MeshLambertMaterial({ color: baseColor });

    const pAnim = buildProceduralAnimal(data, bodyMat);
    const body = pAnim.mesh;

    // โหลดสเกลมาตรฐานตามสายพันธุ์ และสุ่มขนาดสเกลเล็กน้อย +/- 10%
    const baseScale = ANIMAL_BASE_SCALES[data.id] || 1.0;
    const varScale = (0.9 + Math.random() * 0.2) * baseScale;
    body.scale.set(varScale, varScale, varScale);
    const animalHeight = pAnim.height * varScale;

    // สุ่มสวมหมวกนักสำรวจจิ๋ว (Easter Egg น่ารัก)
    if (Math.random() < 0.15 && (data.type === window.ANIMAL_TYPES.MAMMAL || data.type === window.ANIMAL_TYPES.AMPHIBIAN)) {
        const hatColor = [0xef4444, 0x3b82f6, 0xa855f7, 0xf59e0b][Math.floor(Math.random() * 4)];
        const hatMat = new THREE.MeshLambertMaterial({ color: hatColor });
        const hatBase = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 10), hatMat);
        const hatTop = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 10), hatMat);
        hatTop.position.y = 0.06;
        const hat = new THREE.Group();
        hat.add(hatBase, hatTop);
        // วางบนหัว
        hat.position.set(0, pAnim.height, 0.25);
        body.add(hat);
    }

    group.add(body);

    // ป้ายชื่อสัตว์ลอยได้ (ความสูงเหมาะสม ลอยเหนือหัว)
    const sprite = createTextSprite(data.emoji + " " + data.name);
    sprite.position.y = animalHeight + 0.65;
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
    group.userData.py = py; // บันทึกระดับความสูงเริ่มต้น (เพื่อคำนวณการกระโดดของกบ)
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
        revealAlpha: assignedGrass ? 0.25 : 1.0,

        // Custom animation hooks
        legs: pAnim.legs,
        tailFin: pAnim.tailFin,
        segments: pAnim.segments,
        isSnake: pAnim.isSnake,
        isFish: pAnim.isFish,
        bodyMesh: body, // Reference for color flash
        textSprite: sprite
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
        sprite.scale.set(3, 1.5, 1);
        return sprite;
    }
    
    context.font = "Bold 24px 'Kanit'";
    const textWidth = context.measureText(text).width;
    const pillWidth = Math.min(240, textWidth + 30);
    const pillHeight = 44;
    const pillX = (256 - pillWidth) / 2;
    const pillY = (128 - pillHeight) / 2;
    const radius = 22;

    context.beginPath();
    context.moveTo(pillX + radius, pillY);
    context.lineTo(pillX + pillWidth - radius, pillY);
    context.quadraticCurveTo(pillX + pillWidth, pillY, pillX + pillWidth, pillY + radius);
    context.lineTo(pillX + pillWidth, pillY + pillHeight - radius);
    context.quadraticCurveTo(pillX + pillWidth, pillY + pillHeight, pillX + pillWidth - radius, pillY + pillHeight);
    context.lineTo(pillX + radius, pillY + pillHeight);
    context.quadraticCurveTo(pillX, pillY + pillHeight, pillX, pillY + pillHeight - radius);
    context.lineTo(pillX, pillY + radius, pillX, pillY);
    context.quadraticCurveTo(pillX, pillY, pillX + radius, pillY);
    context.closePath();

    context.fillStyle = "rgba(15, 23, 42, 0.85)"; // Slate-900 with opacity
    context.fill();

    context.strokeStyle = "rgba(255, 255, 255, 0.4)";
    context.lineWidth = 2;
    context.stroke();
    
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillStyle = "#ffffff";
    context.fillText(text, 128, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(3.2, 1.6, 1);
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

function attemptPlaceTrap() {
    if (!gameState.isPlaying || !player) return;
    
    const now = clock.getElapsedTime();
    if (now - lastTrapTime >= TRAP_COOLDOWN) {
        lastTrapTime = now;
        placeTrap();
    }
}

function playTrapSound() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.15);
        
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);
        
        osc.start();
        osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
        console.warn("Web Audio trap sound failed:", e);
    }
}

function placeTrap() {
    // 1. เล่นเสียงวางกับดักเหล็กสับ/กรงไม้
    playTrapSound();
    
    try {
        KAMPAI.sound.speak("วางกับดัก", "th-TH");
    } catch(e){}

    // จำกัดจำนวนกับดักสูงสุดไม่เกิน 5 ชิ้น
    if (gameState.traps.length >= 5) {
        const oldest = gameState.traps.shift();
        scene.remove(oldest.mesh);
    }
    
    const tx = player.position.x;
    const tz = player.position.z;
    
    const trapGroup = new THREE.Group();
    
    // ฐานเหลี่ยมกลมสีส้มลายไม้ของกรง/กับดัก
    const baseGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.12, 16);
    const baseMat = new THREE.MeshLambertMaterial({ color: 0xc87d32 }); // ลายไม้ส้ม
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.receiveShadow = true;
    trapGroup.add(baseMesh);
    
    // ห่วงเชือกทับด้านบน (Torus)
    const ringGeo = new THREE.TorusGeometry(1.3, 0.12, 8, 24);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshLambertMaterial({ color: 0x475569 }); // สีเทาเหล็ก
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.08;
    trapGroup.add(ringMesh);
    
    // เหยื่อล่อตรงกลาง (ลูกบาศก์แดงเรืองแสง)
    const baitGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const baitMat = new THREE.MeshLambertMaterial({ 
        color: 0xef4444, 
        emissive: 0xef4444, 
        emissiveIntensity: 0.8 
    });
    const baitMesh = new THREE.Mesh(baitGeo, baitMat);
    baitMesh.position.y = 0.25;
    trapGroup.add(baitMesh);
    
    trapGroup.position.set(tx, 0.06, tz);
    scene.add(trapGroup);
    
    gameState.traps.push({
        mesh: trapGroup,
        x: tx,
        z: tz,
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
    targetChangeTimer = 30; // รีเซ็ตเวลาเป็น 30 วินาที
    
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
                
                const animalBaseScale = ANIMAL_BASE_SCALES[animal.group.userData.data.id] || 1.0;
                const dynamicTrapDist = 2.5 * Math.max(0.8, animalBaseScale * 0.5);
                if (dist < dynamicTrapDist) { // รัศมีเหยียบกับดัก ปรับแบบไดนามิกตามสเกลสัตว์
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
            
            const animalBaseScale = ANIMAL_BASE_SCALES[animal.data.id] || 1.0;
            const speedFactor = 1.0 / Math.sqrt(animalBaseScale); // ยิ่งตัวใหญ่ ยิ่งเดินช้าลงแบบลื่นไหล
            const currentWanderSpeed = wanderSpeed * speedFactor;
            const currentChaseSpeed = (stampedeTimer > 0 ? chaseSpeed * 1.8 : chaseSpeed) * speedFactor;

            // คำนวณเวกเตอร์พุ่งเข้าหาผู้เล่น
            const dx = player.position.x - animal.group.position.x;
            const dz = player.position.z - animal.group.position.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            // ระบบกบกระโดด (Frog hopping mechanic)
            const py = animal.group.userData.py || 0;
            const isFrog = ['frog', 'toadlet', 'bullfrog', 'toad'].includes(animal.data.id);
            if (isFrog) {
                const freq = animal.group.userData.isAggro ? 12 : 6;
                const jumpHeight = (animal.group.userData.isAggro ? 1.5 : 0.8) * animalBaseScale;
                animal.group.position.y = py + Math.abs(Math.sin(time * freq)) * jumpHeight;
            }

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
                
                const wx = Math.sin(animal.group.userData.wanderAngle) * currentWanderSpeed * dt;
                const wz = Math.cos(animal.group.userData.wanderAngle) * currentWanderSpeed * dt;
                
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
            
            // ตรวจการชนกับผู้เล่นโดยตรง ปรับระยะชนและแรงดีดสะท้อนตามขนาดสัตว์
            const dynamicCollisionDist = COLLISION_DIST * Math.max(0.5, animalBaseScale);

            if (dist < dynamicCollisionDist) {
                takeDamage();
                
                // เด้งกระดอนผู้เล่น/สัตว์หลบมุม
                const angle = Math.atan2(animal.group.position.x - player.position.x, animal.group.position.z - player.position.z);
                animal.group.position.x += Math.sin(angle) * (2.0 + animalBaseScale * 1.5);
                animal.group.position.z += Math.cos(angle) * (2.0 + animalBaseScale * 1.5);
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
            // ปรับระดับความสูงและการลอยตัวให้สอดคล้องกับประเภทสัตว์
            if (ud.isFish) {
                a.group.position.y = ud.startY + Math.sin(time * 3 + ud.floatOffset) * 0.08;
            } else if (ud.isSnake) {
                a.group.position.y = ud.startY + Math.sin(time * 3 + ud.floatOffset) * 0.03;
            } else {
                a.group.position.y = ud.startY + Math.sin(time * 2.5 + ud.floatOffset) * 0.15;
            }

            // --- อนิเมชันการขยับ/การเดินแบบจำลอง (Procedural Animations) ---
            // 1. แกว่งขาเดิน (Legs swinging)
            if (ud.legs && ud.legs.length > 0) {
                const speed = ud.isAggro ? 12 : 6;
                const amplitude = ud.isAggro ? 0.6 : 0.35;
                const swing = Math.sin(time * speed + ud.floatOffset) * amplitude;
                ud.legs.forEach((leg, idx) => {
                    if (idx === 0 || idx === 3) {
                        leg.rotation.x = swing;
                    } else {
                        leg.rotation.x = -swing;
                    }
                });
            }

            // 2. ดุกดิกหางปลา (Fish tail fin wiggling)
            if (ud.isFish && ud.tailFin) {
                const wiggleSpeed = ud.isAggro ? 18 : 10;
                const wiggleAmp = ud.isAggro ? 0.6 : 0.3;
                ud.tailFin.rotation.y = Math.sin(time * wiggleSpeed + ud.floatOffset) * wiggleAmp;
            }

            // 3. เลื้อยแบบคลื่นสำหรับงู (Snake segments slithering wave)
            if (ud.isSnake && ud.segments && ud.segments.length > 0) {
                const slitherSpeed = ud.isAggro ? 14 : 7;
                const slitherAmp = ud.isAggro ? 0.35 : 0.2;
                ud.segments.forEach((seg, idx) => {
                    seg.position.x = Math.sin(time * slitherSpeed - idx * 0.8 + ud.floatOffset) * slitherAmp;
                });
            }
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
                bodyMesh.traverse(function (node) {
                    if (node.isMesh && node.material) {
                        if (!node.userData.originalColor) node.userData.originalColor = node.material.color.clone();
                        node.material.color.copy(redColor);
                    }
                });
            } else {
                bodyMesh.traverse(function (node) {
                    if (node.isMesh && node.material) {
                        if (node.userData.originalColor) {
                            node.material.color.copy(node.userData.originalColor);
                        } else if (node.material.color) {
                            node.material.color.setHex(a.data.color);
                        }
                    }
                });
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
    // จัดการอัตโนมัติผ่านเฟรมเวิร์ก Kampai3D
}
