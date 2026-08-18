/* game.js — Maglev Rush (รถไฟแม่เหล็ก)
   ลอจิกฟิสิกส์ 2.5D Pseudo-3D Runner, แรงแม่เหล็ก N/S, สารแม่เหล็ก, และระบบ 2 ผู้เล่น (KampaiVersus) */

(function() {
'use strict';

/* ═══ SECTION 1: ตัวแปรและการตั้งค่าหลัก ═══ */
const GAME_SLUG = 'maglev-rush';
window.GAME_SLUG = GAME_SLUG;
const CFG = window.GAME_CONFIG || {};
const DATA = window.GAME_DATA || {};

if (window.KAMPAI && window.KAMPAI.setSlug) {
    window.KAMPAI.setSlug(GAME_SLUG);
}

const $ = (id) => document.getElementById(id);

// Canvas & Rendering Context
const canvas = $('game-canvas');
const ctx = canvas.getContext('2d');

let W = window.innerWidth;
let H = window.innerHeight;

function resizeCanvas() {
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = W;
    canvas.height = H;
    if (W < 768 && $('touch-controls')) {
        $('touch-controls').style.display = 'flex';
    }
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

/* ═══ SECTION 2: ระบบสุ่มโจทย์แบบกำหนด SEED (PRNG) สำหรับ VERSUS MODE ═══ */
let currentRng = Math.random;
function makeSeededRng(seed) {
    let s = (typeof seed === 'number' ? seed : 123456789) % 2147483647;
    if (s <= 0) s += 2147483646;
    return function() {
        s = (s * 16807) % 2147483647;
        return (s - 1) / 2147483646;
    };
}

/* ═══ SECTION 3: สเตทของเกม (GAME STATE) ═══ */
let isRunning = false;
let isPaused = false;
let gameMode = 'adventure'; // 'adventure' | 'versus' | 'time'
let versusTimer = null;

// ข้อมูลผู้เล่นและสถิติ
let score = 0;
let combo = 0;
let comboTimer = 0;
let lives = 3;
let speedKmh = 220;
let targetSpeedKmh = 220;
let topSpeedRecord = 220;
let itemsCollectedCount = 0;
let turbosCount = 0;
let distanceTravelled = 0; // เมตร
let distanceToStation = 2500;
let currentStationIdx = 0;

// พารามิเตอร์ของรถไฟ Maglev
const train = {
    laneIndex: 1, // 0 = ซ้าย (-1), 1 = กลาง (0), 2 = ขวา (1)
    laneX: 0,     // พิกัด X ของเลนเป้าหมาย
    currentX: 0,  // พิกัด X ปัจจุบัน (Interpolated)
    currentY: 0,  // ลอยตัวขึ้นลง (Levitation Float)
    pole: 'N',    // 'N' (แดง) หรือ 'S' (น้ำเงิน)
    energy: 100,
    shield: false,
    superconductorSec: 0,
    invincibleSec: 0,
    cameraShake: 0,
    tilt: 0
};

// อ็อบเจกต์บนราง (Track Entities)
let trackEntities = [];
let particles = [];
let speedLines = [];
let nextSpawnZ = 400;

/* ═══ SECTION 4: เชื่อมต่อ KAMPAI VERSUS FRAMEWORK ═══ */
const vs = window.KampaiVersus.create({
    duration: CFG.VERSUS_DURATION || 60,
    title: 'แข่งซิ่ง Maglev',
    rankBy: 'score',
    onPlay: ({ rng, player }) => {
        startRound(rng, player ? 'versus' : 'adventure');
    },
    onEnd: () => {
        isRunning = false;
        endGame();
    }
});

/* ═══ SECTION 5: การควบคุม (INPUT HANDLER) ═══ */
function moveLeft() {
    if (!isRunning || isPaused) return;
    if (train.laneIndex > 0) {
        train.laneIndex--;
        triggerLaneShift(-1);
    }
}

function moveRight() {
    if (!isRunning || isPaused) return;
    if (train.laneIndex < 2) {
        train.laneIndex++;
        triggerLaneShift(1);
    }
}

function triggerLaneShift(dir) {
    train.tilt = dir * 0.18;
    spawnSparks(train.currentX, 20, train.pole === 'N' ? '#ef4444' : '#3b82f6', 8);
}

function togglePole() {
    if (!isRunning || isPaused) return;
    train.pole = (train.pole === 'N') ? 'S' : 'N';
    updatePoleUI();
    showToast(`สลับเป็นขั้ว ${train.pole === 'N' ? 'เหนือ (N 🔴)' : 'ใต้ (S 🔵)'}`);
    spawnSparks(train.currentX, 10, train.pole === 'N' ? '#ef4444' : '#3b82f6', 15);
}

function emergencyBrake() {
    if (!isRunning || isPaused) return;
    if (speedKmh > 120) {
        speedKmh = Math.max(100, speedKmh - 60);
        train.cameraShake = 8;
        showToast('🛑 เบรกฉุกเฉิน Eddy Current!');
        spawnSparks(train.currentX, 0, '#38bdf8', 20);
    }
}

function updatePoleUI() {
    const el = $('pole-indicator');
    const txt = $('pole-text');
    const icon = $('pole-icon');
    const tBtnLabel = $('t-pole-label');

    if (train.pole === 'N') {
        el.className = 'hud-pill pole-N';
        txt.textContent = 'ขั้ว N (เหนือ)';
        icon.textContent = '⚡';
        if (tBtnLabel) tBtnLabel.textContent = 'ขั้ว N 🔴';
    } else {
        el.className = 'hud-pill pole-S';
        txt.textContent = 'ขั้ว S (ใต้)';
        icon.textContent = '🌀';
        if (tBtnLabel) tBtnLabel.textContent = 'ขั้ว S 🔵';
    }
}

// Keyboard Event Listeners
window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') moveLeft();
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') moveRight();
    else if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW') togglePole();
    else if (e.code === 'ArrowDown' || e.code === 'KeyS') emergencyBrake();
});

// Touch & Mobile Buttons
$('btn-left')?.addEventListener('touchstart', (e) => { e.preventDefault(); moveLeft(); });
$('btn-left')?.addEventListener('click', moveLeft);
$('btn-right')?.addEventListener('touchstart', (e) => { e.preventDefault(); moveRight(); });
$('btn-right')?.addEventListener('click', moveRight);
$('btn-brake')?.addEventListener('touchstart', (e) => { e.preventDefault(); emergencyBrake(); });
$('btn-brake')?.addEventListener('click', emergencyBrake);

// Touch Swipe on Canvas
let touchStartX = 0;
let touchStartY = 0;
canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
    if (!isRunning || isPaused || e.changedTouches.length === 0) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    const dy = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
        if (dx > 0) moveRight();
        else moveLeft();
    } else if (Math.abs(dy) > 35 && Math.abs(dy) > Math.abs(dx)) {
        if (dy < 0) togglePole();
        else emergencyBrake();
    }
}, { passive: true });

/* ═══ SECTION 6: ระบบสร้างและสุ่มวัตถุบนราง (TRACK GENERATION) ═══ */
function spawnTrackEntity(zPos) {
    const lane = [-1, 0, 1][Math.floor(currentRng() * 3)];
    const roll = currentRng();

    // 35% ขดลวดแม่เหล็ก N/S บนราง
    if (roll < 0.35) {
        const pole = currentRng() > 0.5 ? 'N' : 'S';
        trackEntities.push({
            type: 'coil',
            pole: pole,
            lane: lane,
            z: zPos,
            width: 110,
            active: true
        });
    }
    // 35% สารแม่เหล็ก (ตะปู, คลิป, นิกเกิล, ลูกปืน ฯลฯ)
    else if (roll < 0.70) {
        const itemData = DATA.MAGNETIC_ITEMS[Math.floor(currentRng() * DATA.MAGNETIC_ITEMS.length)];
        trackEntities.push({
            type: 'magnetic_item',
            data: itemData,
            lane: lane,
            z: zPos,
            worldX: lane * (CFG.LANE_WIDTH_WORLD || 140),
            worldY: 15,
            active: true
        });
    }
    // 25% สิ่งกีดขวางที่ไม่ใช่สารแม่เหล็ก (ไม้, พลาสติก, แก้ว ฯลฯ)
    else if (roll < 0.95) {
        const obsData = DATA.OBSTACLES[Math.floor(currentRng() * DATA.OBSTACLES.length)];
        trackEntities.push({
            type: 'obstacle',
            data: obsData,
            lane: lane,
            z: zPos,
            worldX: lane * (CFG.LANE_WIDTH_WORLD || 140),
            worldY: 0,
            active: true
        });
    }
    // 5% พาวเวอร์อัปพิเศษ (Superconductor หรือ Shield)
    else {
        const pwrData = DATA.POWERUPS[Math.floor(currentRng() * DATA.POWERUPS.length)];
        trackEntities.push({
            type: 'powerup',
            data: pwrData,
            lane: lane,
            z: zPos,
            worldX: lane * (CFG.LANE_WIDTH_WORLD || 140),
            worldY: 25,
            active: true
        });
    }
}

/* ═══ SECTION 7: การเริ่มและจบเกม (GAME LIFECYCLE) ═══ */
function startSolo(mode) {
    gameMode = mode || 'adventure';
    startRound(Math.random, gameMode);
}
window.startSolo = startSolo;

function startRound(rng, mode) {
    currentRng = rng || Math.random;
    gameMode = mode || 'adventure';
    isRunning = true;
    isPaused = false;

    score = 0;
    combo = 0;
    comboTimer = 0;
    lives = CFG.SOLO_LIVES || 3;
    speedKmh = CFG.SPEED_CRUISE_KMH || 220;
    targetSpeedKmh = speedKmh;
    topSpeedRecord = speedKmh;
    itemsCollectedCount = 0;
    turbosCount = 0;
    distanceTravelled = 0;
    distanceToStation = CFG.STATION_INTERVAL_METERS || 2500;
    currentStationIdx = 0;

    train.laneIndex = 1;
    train.laneX = 0;
    train.currentX = 0;
    train.currentY = 0;
    train.pole = 'N';
    train.energy = 100;
    train.shield = false;
    train.superconductorSec = 0;
    train.invincibleSec = 0;
    train.cameraShake = 0;
    train.tilt = 0;

    trackEntities = [];
    particles = [];
    speedLines = [];
    nextSpawnZ = 300;

    // เตรียมเสาและวัตถุเริ่มต้น
    for (let z = 300; z < (CFG.TRACK_DEPTH || 1800); z += 120) {
        spawnTrackEntity(z);
    }

    $('start-screen').classList.add('hidden');
    $('gameover-screen').classList.add('hidden');
    $('station-modal').classList.add('hidden');
    $('hud').classList.remove('hidden');

    updatePoleUI();
    updateHUD();

    if (window.KAMPAI) {
        window.KAMPAI.beginRound();
        if (window.KAMPAI.sound) {
            window.KAMPAI.sound.mountToggles();
            window.KAMPAI.sound.defaultBgm(CFG.BGM || 'racer');
            window.KAMPAI.sound.bgmStart();
        }
    }

    showToast('🚀 ซิ่ง Maglev! สลับขั้วให้ตรงกับรางเพื่อเทอร์โบ');
}
window.startRound = startRound;

function restartGame() {
    startRound(Math.random, gameMode);
}
window.restartGame = restartGame;

function endGame() {
    if (!isRunning && $('gameover-screen').classList.contains('hidden') === false) return;
    isRunning = false;

    // ส่งผลลัพธ์ผ่าน Versus Framework ก่อน
    if (vs.finish(score, { correct: itemsCollectedCount, topSpeed: topSpeedRecord })) {
        if (window.KAMPAI && window.KAMPAI.sound) window.KAMPAI.sound.bgmStop();
        return;
    }

    if (window.KAMPAI) {
        window.KAMPAI.submitScore(score, {
            mode: gameMode,
            topSpeed: topSpeedRecord,
            itemsCollected: itemsCollectedCount,
            turbos: turbosCount
        });
        if (window.KAMPAI.sound) {
            window.KAMPAI.sound.bgmStop();
            window.KAMPAI.sound.gameOver();
        }
    }

    $('hud').classList.add('hidden');
    $('gameover-screen').classList.remove('hidden');
    $('final-score').textContent = score.toLocaleString();
    $('res-top-speed').textContent = Math.round(topSpeedRecord);
    $('res-items-count').textContent = itemsCollectedCount;
    $('res-turbos-count').textContent = turbosCount;

    renderLeaderboard('score-list-gameover');
}

/* ═══ SECTION 8: ระบบสถานีและควิซ EDDY CURRENT BRAKE ═══ */
function triggerStationArrival() {
    isPaused = true;
    const stModal = $('station-modal');
    stModal.classList.remove('hidden');

    const quizList = DATA.STATIONS_QUIZ || [];
    const quiz = quizList[currentStationIdx % quizList.length];
    currentStationIdx++;

    $('st-name').textContent = quiz.stationName;
    $('st-question').textContent = quiz.question;

    const optBox = $('st-options');
    const feedBox = $('st-feedback');
    feedBox.className = 'quiz-feedback';
    feedBox.textContent = '';
    optBox.innerHTML = '';

    quiz.options.forEach((opt) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-opt-btn';
        btn.textContent = opt.text;
        btn.onclick = () => {
            if (feedBox.classList.contains('show')) return;
            if (opt.correct) {
                btn.classList.add('correct');
                feedBox.className = 'quiz-feedback show good';
                feedBox.innerHTML = `✅ <strong>ถูกต้อง!</strong> ${opt.explain}<br>+150 คะแนน & ได้รับ HYPER BOOST ⚡`;
                score += CFG.POINTS_STATION_PERFECT || 150;
                speedKmh = Math.min(CFG.SPEED_MAX_KMH || 480, speedKmh + 90);
                if (window.KAMPAI && window.KAMPAI.sound) window.KAMPAI.sound.correct();
                vs.report(score, { correct: itemsCollectedCount });
            } else {
                btn.classList.add('wrong');
                feedBox.className = 'quiz-feedback show bad';
                feedBox.innerHTML = `❌ <strong>ยังไม่ถูกต้อง:</strong> ${opt.explain}`;
                if (window.KAMPAI && window.KAMPAI.sound) window.KAMPAI.sound.wrong();
            }

            setTimeout(() => {
                stModal.classList.add('hidden');
                isPaused = false;
                distanceToStation = CFG.STATION_INTERVAL_METERS || 2500;
                showToast('⚡ ออกจากสถานีด้วยพลังแม่เหล็กเต็มพิกัด!');
            }, 2200);
        };
        optBox.appendChild(btn);
    });

    if (window.KAMPAI && window.KAMPAI.sound) {
        window.KAMPAI.sound.fxFlash(true);
    }
}

/* ═══ SECTION 9: ฟิสิกส์ & การอัปเดตสถานะ (PHYSICS UPDATE LOOP) ═══ */
let lastTimestamp = performance.now();

function updateGame(dt) {
    if (!isRunning || isPaused) return;

    // 1. ความเร็วและระยะทาง
    if (speedKmh > (CFG.SPEED_CRUISE_KMH || 220)) {
        speedKmh -= (CFG.CRUISE_RECOVERY_RATE || 0.8) * dt * 60;
    } else if (speedKmh < (CFG.SPEED_CRUISE_KMH || 220)) {
        speedKmh += (CFG.CRUISE_RECOVERY_RATE || 0.8) * dt * 60;
    }
    speedKmh = Math.max(CFG.SPEED_MIN_KMH || 100, Math.min(CFG.SPEED_MAX_KMH || 480, speedKmh));

    if (speedKmh > topSpeedRecord) topSpeedRecord = speedKmh;

    const metersThisFrame = (speedKmh * 1000 / 3600) * dt;
    distanceTravelled += metersThisFrame;
    distanceToStation -= metersThisFrame;

    if (distanceToStation <= 0) {
        triggerStationArrival();
    }

    // 2. ตำแหน่งการเลื่อนเลนของรถไฟ
    const laneWidth = CFG.LANE_WIDTH_WORLD || 140;
    const targetX = (train.laneIndex - 1) * laneWidth;
    train.currentX += (targetX - train.currentX) * 0.18;
    train.currentY = Math.sin(performance.now() * 0.006) * 6; // การลอยตัว

    if (Math.abs(train.tilt) > 0.01) train.tilt *= 0.88;

    // 3. จัดการเวลาสถานะพิเศษ
    if (train.superconductorSec > 0) {
        train.superconductorSec -= dt;
        spawnSparks(train.currentX, 20, '#06b6d4', 2);
    }
    if (train.invincibleSec > 0) train.invincibleSec -= dt;
    if (train.cameraShake > 0) train.cameraShake *= 0.88;

    // 4. พลังงานแม่เหล็ก
    train.energy = Math.max(0, train.energy - (CFG.MAGNET_DRAIN_PER_SEC || 1.5) * dt);

    // 5. คอมโบหมดเวลา
    if (combo > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) {
            combo = 0;
            updateHUD();
        }
    }

    // 6. เลื่อนวัตถุบนรางเข้าหากล้อง (Z-axis movement)
    const zStep = (speedKmh * 2.8) * dt;

    for (let i = trackEntities.length - 1; i >= 0; i--) {
        const ent = trackEntities[i];
        ent.z -= zStep;

        // ฟิสิกส์แรงดูดสารแม่เหล็ก (Magnetic Attraction)
        if (ent.active && (ent.type === 'magnetic_item' || (ent.type === 'powerup' && train.superconductorSec > 0))) {
            const entWorldX = ent.worldX || (ent.lane * laneWidth);
            const dx = train.currentX - entWorldX;
            const dz = ent.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            const attractRange = train.superconductorSec > 0 ? 550 : (CFG.ATTRACT_RADIUS || 240);

            if (dist < attractRange && ent.z < 450) {
                const pullSpeed = (CFG.ATTRACT_FORCE_SPEED || 18) * (1 - dist / attractRange) * 1.5;
                ent.worldX = (ent.worldX || entWorldX) + (dx > 0 ? pullSpeed : -pullSpeed);
                ent.worldY = (ent.worldY || 15) + (train.currentY + 15 - ent.worldY) * 0.15;
            }
        }

        // ตรวจสอบการชนกับหน้ารถไฟ (Z ~= 20 ถึง 60)
        if (ent.active && ent.z >= -10 && ent.z <= 65) {
            const entX = ent.worldX !== undefined ? ent.worldX : (ent.lane * laneWidth);
            const laneDiff = Math.abs(train.currentX - entX);

            // วัตถุอยู่ในระยะชนเลน
            if (laneDiff < 75) {
                ent.active = false;
                handleEntityCollision(ent);
            }
        }

        // ลบวัตถุที่ผ่านเลยด้านหลังกล้อง
        if (ent.z < -80) {
            trackEntities.splice(i, 1);
        }
    }

    // สปอว์นวัตถุใหม่ข้างหน้า
    while (nextSpawnZ < (CFG.TRACK_DEPTH || 1800)) {
        spawnTrackEntity(nextSpawnZ);
        nextSpawnZ += 110 + currentRng() * 90;
    }
    nextSpawnZ -= zStep;

    // อัปเดตเอฟเฟกต์อนุภาค & เส้นความเร็ว
    updateParticles(dt);

    updateHUD();
}

function handleEntityCollision(ent) {
    // 1. ชนขดลวดแม่เหล็กเหนี่ยวนำ (Coil Pad)
    if (ent.type === 'coil') {
        if (train.pole === ent.pole) {
            // 🚀 ขั้วตรงกัน (N-N หรือ S-S) = แรงผลักเทอร์โบ!
            speedKmh = Math.min(CFG.SPEED_MAX_KMH || 480, speedKmh + (CFG.TURBO_BOOST_KMH || 55));
            turbosCount++;
            addScore(CFG.POINTS_TURBO_BOOST || 35);
            addCombo();
            train.energy = Math.min(100, train.energy + (CFG.MAGNET_REFILL_BOOST || 20));
            showToast(`🚀 แรงผลักเทอร์โบ! ขั้ว ${train.pole}-${ent.pole} เร่งความเร็ว!`);
            spawnSparks(train.currentX, 20, ent.pole === 'N' ? '#ef4444' : '#3b82f6', 25);
            if (window.KAMPAI && window.KAMPAI.sound) window.KAMPAI.sound.correct();
        } else {
            // ⚠️ ขั้วต่างกัน (N-S) = แรงดูดฉุดความเร็ว
            speedKmh = Math.max(CFG.SPEED_MIN_KMH || 100, speedKmh - (CFG.ATTRACT_DRAG_KMH || 25));
            train.cameraShake = 5;
            showToast(`⚠️ ขั้วต่างกัน (${train.pole} เจอ ${ent.pole}) ดูดฉุดความเร็ว!`);
            spawnSparks(train.currentX, 10, '#f97316', 15);
            if (window.KAMPAI && window.KAMPAI.sound) window.KAMPAI.sound.wrong();
        }
    }
    // 2. ดูดเก็บสารแม่เหล็ก (Magnetic Material)
    else if (ent.type === 'magnetic_item') {
        itemsCollectedCount++;
        addScore(ent.data.points || (CFG.POINTS_MAGNETIC_ITEM || 20));
        addCombo();
        train.energy = Math.min(100, train.energy + (CFG.MAGNET_REFILL_ITEM || 12));
        showToast(`🧲 ดูดเก็บ: ${ent.data.name} [${ent.data.element}]`);
        spawnSparks(train.currentX, 20, '#facc15', 18);
        if (window.KAMPAI && window.KAMPAI.sound) window.KAMPAI.sound.correct();
    }
    // 3. ชนสิ่งกีดขวางที่ไม่ใช่สารแม่เหล็ก (Obstacle)
    else if (ent.type === 'obstacle') {
        if (train.shield) {
            train.shield = false;
            showToast('🛡️ เกราะสนามแม่เหล็กป้องกันแรงกระแทก!');
            spawnSparks(train.currentX, 20, '#38bdf8', 25);
            if (window.KAMPAI && window.KAMPAI.sound) window.KAMPAI.sound.correct();
        } else if (train.invincibleSec <= 0) {
            lives--;
            speedKmh = CFG.SPEED_MIN_KMH || 100;
            train.invincibleSec = 1.5;
            train.cameraShake = 14;
            combo = 0;
            showToast(`💥 ชน${ent.data.name}! ไม่ใช่สารแม่เหล็ก`);
            spawnSparks(train.currentX, 20, '#ef4444', 30);
            if (window.KAMPAI && window.KAMPAI.sound) {
                window.KAMPAI.sound.wrong();
                window.KAMPAI.sound.fxFlash(false);
            }
            if (lives <= 0) {
                endGame();
            }
        }
    }
    // 4. พาวเวอร์อัปพิเศษ (Powerup)
    else if (ent.type === 'powerup') {
        if (ent.data.id === 'superconductor') {
            train.superconductorSec = 8;
            showToast('⚡ ซูเปอร์คอนดักเตอร์! ดูดสารแม่เหล็กทุกเลน 8 วิ');
        } else if (ent.data.id === 'shield') {
            train.shield = true;
            showToast('🛡️ ได้รับเกราะสนามแม่เหล็กสะท้อน!');
        }
        addScore(CFG.POINTS_SUPERCONDUCTOR || 80);
        spawnSparks(train.currentX, 30, '#06b6d4', 25);
        if (window.KAMPAI && window.KAMPAI.sound) window.KAMPAI.sound.correct();
    }

    vs.report(score, { correct: itemsCollectedCount });
}

function addScore(basePts) {
    const mult = 1.0 + Math.min(2.0, Math.floor(combo / (CFG.COMBO_BONUS_STEP || 5)) * 0.5);
    score += Math.round(basePts * mult);
}

function addCombo() {
    combo++;
    comboTimer = (CFG.COMBO_TIMEOUT_MS || 3000) / 1000;
}

/* ═══ SECTION 10: ระบบอนุภาค & กราฟิกเสริม (PARTICLES & FX) ═══ */
function spawnSparks(worldX, worldY, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: worldX + (Math.random() - 0.5) * 30,
            y: worldY + (Math.random() - 0.5) * 20,
            z: 20 + Math.random() * 30,
            vx: (Math.random() - 0.5) * 16,
            vy: (Math.random() - 0.5) * 16,
            vz: -Math.random() * 10,
            color: color,
            life: 1.0,
            decay: 0.03 + Math.random() * 0.04,
            size: 3 + Math.random() * 4
        });
    }
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;
        p.life -= p.decay;
        if (p.life <= 0) particles.splice(i, 1);
    }

    // เส้นความเร็ว Speedlines เมื่อขับเร็วเกิน 300 km/h
    if (speedKmh > 280 && Math.random() < 0.4) {
        speedLines.push({
            x: (Math.random() - 0.5) * W * 1.2,
            y: (Math.random() - 0.5) * H * 1.2,
            len: 40 + Math.random() * 100,
            life: 1.0,
            decay: 0.08
        });
    }
    for (let i = speedLines.length - 1; i >= 0; i--) {
        const sl = speedLines[i];
        sl.life -= sl.decay;
        if (sl.life <= 0) speedLines.splice(i, 1);
    }
}

/* ═══ SECTION 11: 2.5D PERSPECTIVE RENDERER (CANVAS 60FPS) ═══ */
function project3D(x, y, z) {
    const fov = CFG.FOV || 280;
    const camHeight = CFG.CAMERA_HEIGHT || 170;
    const tilt = CFG.CAMERA_TILT || 0.12;

    const scale = fov / (fov + z);
    const projX = W / 2 + x * scale;
    const projY = H / 2 + camHeight * (1 - scale) - (y * scale) + (H * tilt);
    return { x: projX, y: projY, scale: scale };
}

function render() {
    ctx.clearRect(0, 0, W, H);

    // Camera Shake Offset
    let shakeX = 0, shakeY = 0;
    if (train.cameraShake > 0.5) {
        shakeX = (Math.random() - 0.5) * train.cameraShake;
        shakeY = (Math.random() - 0.5) * train.cameraShake;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // 1. วาดท้องฟ้าและแสงขอบฟ้าไซเบอร์ (Cyber Horizon)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.65);
    skyGrad.addColorStop(0, '#040711');
    skyGrad.addColorStop(0.5, '#0c1b33');
    skyGrad.addColorStop(1, '#050914');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    // แสงอาทิตย์นีออน / โฮโลแกรมขอบฟ้า
    const horizonY = H / 2 + (H * (CFG.CAMERA_TILT || 0.12));
    const sunGrad = ctx.createRadialGradient(W / 2, horizonY - 30, 10, W / 2, horizonY - 30, 260);
    sunGrad.addColorStop(0, train.pole === 'N' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(59, 130, 246, 0.4)');
    sunGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, horizonY - 260, W, 260);

    // 2. วาดรางแม่เหล็ก 3 เลน (Maglev Guide Rails)
    renderMaglevTrack(horizonY);

    // 3. วาดวัตถุบนราง (เรียงจาก Z ไกลมาใกล้)
    trackEntities.sort((a, b) => b.z - a.z);
    for (const ent of trackEntities) {
        renderTrackEntity(ent);
    }

    // 4. วาดตัวรถไฟ Maglev ของผู้เล่น
    renderTrainPlayer();

    // 5. วาดอนุภาคและแสงแฟลช
    renderParticlesAndLines();

    ctx.restore();
}

function renderMaglevTrack(horizonY) {
    const laneWidth = CFG.LANE_WIDTH_WORLD || 140;
    const maxZ = CFG.TRACK_DEPTH || 1800;

    // พื้นรางหลัก
    ctx.beginPath();
    const pFarL = project3D(-laneWidth * 1.8, 0, maxZ);
    const pFarR = project3D(laneWidth * 1.8, 0, maxZ);
    const pNearR = project3D(laneWidth * 1.8, 0, 0);
    const pNearL = project3D(-laneWidth * 1.8, 0, 0);

    ctx.moveTo(pFarL.x, pFarL.y);
    ctx.lineTo(pFarR.x, pFarR.y);
    ctx.lineTo(pNearR.x, pNearR.y);
    ctx.lineTo(pNearL.x, pNearL.y);
    ctx.closePath();

    const trackGrad = ctx.createLinearGradient(0, horizonY, 0, H);
    trackGrad.addColorStop(0, '#0a1128');
    trackGrad.addColorStop(1, '#020617');
    ctx.fillStyle = trackGrad;
    ctx.fill();

    // เส้นแบ่ง 3 เลนเรืองแสง (Lane Dividers)
    [-1.5, -0.5, 0.5, 1.5].forEach((pos) => {
        const p1 = project3D(pos * laneWidth, 0, maxZ);
        const p2 = project3D(pos * laneWidth, 0, 0);
        ctx.strokeStyle = Math.abs(pos) > 1.0 ? 'rgba(56, 189, 248, 0.8)' : 'rgba(148, 163, 184, 0.3)';
        ctx.lineWidth = Math.abs(pos) > 1.0 ? 3 : 1.5;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
    });

    // เสาแม่เหล็กรางลอยตัวข้างทาง (Magnetic Guide Pillars)
    const pillarSpacing = 160;
    const offsetZ = (distanceTravelled * 4) % pillarSpacing;

    for (let z = pillarSpacing - offsetZ; z < maxZ; z += pillarSpacing) {
        [-1.85, 1.85].forEach((side) => {
            const base = project3D(side * laneWidth, 0, z);
            const top = project3D(side * laneWidth, 50, z);
            if (base.scale > 0) {
                ctx.strokeStyle = train.pole === 'N' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)';
                ctx.lineWidth = 4 * base.scale;
                ctx.beginPath();
                ctx.moveTo(base.x, base.y);
                ctx.lineTo(top.x, top.y);
                ctx.stroke();

                // หลอดไฟ LED หัวเสา
                ctx.fillStyle = train.pole === 'N' ? '#f87171' : '#60a5fa';
                ctx.beginPath();
                ctx.arc(top.x, top.y, 4 * top.scale, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
}

function renderTrackEntity(ent) {
    if (!ent.active || ent.z < 0) return;
    const laneWidth = CFG.LANE_WIDTH_WORLD || 140;
    const worldX = ent.worldX !== undefined ? ent.worldX : (ent.lane * laneWidth);
    const worldY = ent.worldY || 0;
    const p = project3D(worldX, worldY, ent.z);

    if (p.scale <= 0) return;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(p.scale, p.scale);

    // 1. ขดลวดเหนี่ยวนำแม่เหล็กบนราง (Coil Pad)
    if (ent.type === 'coil') {
        const isN = ent.pole === 'N';
        const color = isN ? '#ef4444' : '#3b82f6';
        const glow = isN ? 'rgba(239, 68, 68, 0.8)' : 'rgba(59, 130, 246, 0.8)';

        // ฐานขดลวด
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(-55, -25, 110, 50, 12);
        ctx.fill();
        ctx.stroke();

        // ตัวอักษรขั้ว N / S ขนาดใหญ่
        ctx.fillStyle = '#ffffff';
        ctx.font = '800 36px Kanit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = glow;
        ctx.shadowBlur = 15;
        ctx.fillText(ent.pole, 0, 0);

        // วงแหวนสนามแม่เหล็กรอบขดลวด
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(0, 0, 70, 32, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    // 2. สารแม่เหล็ก (Magnetic Items)
    else if (ent.type === 'magnetic_item') {
        // วงแหวนสนามแม่เหล็กหมุนรอบ
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -10, 32, 0, Math.PI * 2);
        ctx.stroke();

        // ไอคอนวัตถุ
        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ent.data.icon || '🔩', 0, -10);

        // ป้ายชื่อสารและธาตุ
        ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
        ctx.beginPath();
        ctx.roundRect(-60, 24, 120, 22, 6);
        ctx.fill();
        ctx.fillStyle = '#fde047';
        ctx.font = '600 12px Kanit, sans-serif';
        ctx.fillText(ent.data.element || ent.data.name, 0, 35);
    }
    // 3. สิ่งกีดขวางที่ไม่ใช่สารแม่เหล็ก (Obstacles)
    else if (ent.type === 'obstacle') {
        // กรอบเตือนภัยอันตราย
        ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(-36, -46, 72, 72, 14);
        ctx.fill();
        ctx.stroke();

        ctx.font = '42px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ent.data.icon || '🪵', 0, -10);

        // ป้ายเตือนว่าไม่ใช่สารแม่เหล็ก
        ctx.fillStyle = 'rgba(239, 68, 68, 0.9)';
        ctx.beginPath();
        ctx.roundRect(-55, 30, 110, 20, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '700 11px Kanit, sans-serif';
        ctx.fillText('ไม่ใช่แม่เหล็ก!', 0, 40);
    }
    // 4. พาวเวอร์อัปพิเศษ (Powerups)
    else if (ent.type === 'powerup') {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, -10, 36, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = '40px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ent.data.icon || '⚡', 0, -10);
    }

    ctx.restore();
}

function renderTrainPlayer() {
    const p = project3D(train.currentX, train.currentY, 30);
    if (p.scale <= 0) return;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(train.tilt);

    const isN = train.pole === 'N';
    const mainColor = isN ? '#ef4444' : '#3b82f6';
    const glowColor = isN ? 'rgba(239, 68, 68, 0.6)' : 'rgba(59, 130, 246, 0.6)';

    // 1. แสงเรืองลอยตัวแม่เหล็กใต้ท้องรถ (Levitation Glow)
    const levGrad = ctx.createRadialGradient(0, 20, 5, 0, 20, 90);
    levGrad.addColorStop(0, glowColor);
    levGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = levGrad;
    ctx.beginPath();
    ctx.ellipse(0, 25, 80, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. ตัวถังรถไฟ Maglev ทรงหัวกระสุนแอโรไดนามิก
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 20;

    // หลังคารถไฟ
    const bodyGrad = ctx.createLinearGradient(-45, -60, 45, 20);
    bodyGrad.addColorStop(0, '#f8fafc');
    bodyGrad.addColorStop(0.5, '#cbd5e1');
    bodyGrad.addColorStop(1, '#64748b');

    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.moveTo(0, -65);           // หัวรถกระสุนแหลม
    ctx.bezierCurveTo(35, -50, 48, -10, 46, 18);
    ctx.lineTo(-46, 18);
    ctx.bezierCurveTo(-48, -10, -35, -50, 0, -65);
    ctx.closePath();
    ctx.fill();

    // ขอบข้าง & ลายสนามแม่เหล็กขั้ว N/S
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.moveTo(0, -60);
    ctx.lineTo(24, 18);
    ctx.lineTo(-24, 18);
    ctx.closePath();
    ctx.fill();

    // กระจกหน้าห้องควบคุม (Cockpit Windshield)
    const glassGrad = ctx.createLinearGradient(0, -45, 0, -10);
    glassGrad.addColorStop(0, '#0284c7');
    glassGrad.addColorStop(1, '#0f172a');
    ctx.fillStyle = glassGrad;
    ctx.beginPath();
    ctx.moveTo(0, -48);
    ctx.lineTo(20, -15);
    ctx.lineTo(-20, -15);
    ctx.closePath();
    ctx.fill();

    // สัญลักษณ์ขั้วแม่เหล็ก N / S เรืองแสงบนหัวรถ
    ctx.fillStyle = '#ffffff';
    ctx.font = '800 20px Kanit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(train.pole, 0, -2);

    // 3. เอฟเฟกต์เกราะป้องกัน (ถ้ามี)
    if (train.shield) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, -15, 65, 0, Math.PI * 2);
        ctx.stroke();
    }

    // 4. เอฟเฟกต์ซูเปอร์คอนดักเตอร์
    if (train.superconductorSec > 0) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.8)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, -15, 75 + Math.sin(performance.now() * 0.02) * 8, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

function renderParticlesAndLines() {
    // 1. วาดอนุภาคประกายไฟ
    for (const p of particles) {
        const proj = project3D(p.x, p.y, p.z);
        if (proj.scale > 0) {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.beginPath();
            ctx.arc(proj.x, proj.y, p.size * proj.scale, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1.0;

    // 2. วาดเส้นความเร็ว Speedlines
    for (const sl of speedLines) {
        const cx = W / 2 + sl.x;
        const cy = H / 2 + sl.y;
        ctx.strokeStyle = `rgba(255, 255, 255, ${sl.life * 0.4})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + (sl.x > 0 ? sl.len : -sl.len), cy + (sl.y > 0 ? sl.len * 0.5 : -sl.len * 0.5));
        ctx.stroke();
    }
}

/* ═══ SECTION 12: การอัปเดต UI & HUD ═══ */
function updateHUD() {
    $('score-val').textContent = score.toLocaleString();
    $('speed-val').textContent = Math.round(speedKmh);

    // Speedometer Color
    const speedEl = $('speed-val');
    if (speedKmh > 350) speedEl.style.color = '#ef4444';
    else if (speedKmh > 260) speedEl.style.color = '#f59e0b';
    else speedEl.style.color = '#38bdf8';

    // Combo Badge
    const cb = $('combo-badge');
    if (combo > 1) {
        cb.style.display = 'inline-block';
        cb.textContent = `COMBO x${combo}`;
    } else {
        cb.style.display = 'none';
    }

    // Lives Hearts
    const hearts = '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(Math.max(0, 3 - lives));
    $('lives-box').textContent = hearts;

    // Energy Bar
    $('energy-fill').style.width = `${Math.max(0, Math.min(100, train.energy))}%`;

    // Station Distance
    $('station-dist-val').textContent = `${Math.max(0, Math.round(distanceToStation)).toLocaleString()} m`;
}

function showToast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => {
        t.classList.remove('show');
    }, 2200);
}

/* ═══ SECTION 13: เชื่อมต่อ LEADERBOARD & สถิติผู้เล่น ═══ */
if (window.KAMPAI && window.KAMPAI.onReady) {
    window.KAMPAI.onReady((k) => {
        if (k.stats) {
            $('ms-best').textContent = (k.stats.personalBest || 0).toLocaleString();
            $('ms-plays').textContent = (k.stats.playsCount || 0).toLocaleString();
        }
        if (k.leaderboard) {
            renderLeaderboard('score-list');
        }
    });
}

function renderLeaderboard(listId) {
    const el = $(listId);
    if (!el || !window.KAMPAI || !window.KAMPAI.leaderboard) return;
    const lb = window.KAMPAI.leaderboard;
    if (lb.length === 0) {
        el.innerHTML = '<li style="color:#94a3b8; justify-content:center;">ยังไม่มีคะแนนบันทึก</li>';
        return;
    }
    el.innerHTML = lb.slice(0, 5).map((row, idx) => {
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
        const meClass = row.isMe ? 'class="is-me"' : '';
        return `<li ${meClass}>
            <span>${medal} ${row.displayName || 'นักเรียน'}</span>
            <span style="font-weight:700; color:#fde047;">${(row.personalBest || 0).toLocaleString()}</span>
        </li>`;
    }).join('');
}

/* ═══ SECTION 14: MAIN GAME LOOP ═══ */
function gameLoop(now) {
    const dt = Math.min(0.1, (now - lastTimestamp) / 1000);
    lastTimestamp = now;

    updateGame(dt);
    render();

    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

})();
