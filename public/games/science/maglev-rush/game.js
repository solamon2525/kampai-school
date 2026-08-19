/* game.js — Maglev Rush (รถไฟแม่เหล็กหรรษา)
   ออกแบบพิเศษสำหรับระดับประถมศึกษา (ป.1 - ป.6)
   - เล่นง่าย สนุก เพลิดเพลิน ไม่มี Game Over ให้หัวร้อน
   - ชนสิ่งกีดขวางแล้วเด้งดึ๋งอย่างอ่อนโยน พร้อมเกร็ดความรู้ ไม่หักเลือด
   - ซูเปอร์แม่เหล็กดูดสารแม่เหล็กอัตโนมัติทั้ง 3 เลน
   - แตะเลนบนหน้าจอเพื่อเปลี่ยนเลนได้ทันที (ซ้าย / กลาง / ขวา)
   - รถไฟโปร่งแสงลางๆ มองเห็นทางข้างหน้า 100% ตัวหนังสือคมชัดระดับ Retina */

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
let dpr = 1;

function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (('ontouchstart' in window || navigator.maxTouchPoints > 0 || W < 1024) && $('touch-controls')) {
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
let gameMode = 'adventure'; // 'adventure' | 'versus'

// ข้อมูลผู้เล่นและสถิติ
let score = 0;
let combo = 0;
let comboTimer = 0;
let speedKmh = 70;
let targetSpeedKmh = 70;
let topSpeedRecord = 70;
let itemsCollectedCount = 0;
let turbosCount = 0;
let distanceTravelled = 0; // เมตร
let distanceToStation = 1200;
let currentStationIdx = 0;
const totalStationsGoal = CFG.TOTAL_STATIONS_ADVENTURE || 3;

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
    cameraShake: 0,
    tilt: 0
};

// อ็อบเจกต์บนราง (Track Entities)
let trackEntities = [];
let particles = [];
let speedLines = [];
let nextSpawnZ = 450;

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

/* ═══ SECTION 5: การควบคุมที่ง่ายที่สุด (แตะเลนไหน รถไฟไปเลนนั้นทันที) ═══ */
function setLane(laneIdx) {
    if (!isRunning || isPaused) return;
    if (laneIdx >= 0 && laneIdx <= 2) {
        const diff = laneIdx - train.laneIndex;
        train.laneIndex = laneIdx;
        train.tilt = diff * 0.14;
        spawnSparks(train.currentX, 15, train.pole === 'N' ? '#ef4444' : '#3b82f6', 6);
    }
}

function moveLeft() {
    if (train.laneIndex > 0) setLane(train.laneIndex - 1);
}

function moveRight() {
    if (train.laneIndex < 2) setLane(train.laneIndex + 1);
}

function togglePole() {
    if (!isRunning || isPaused) return;
    train.pole = (train.pole === 'N') ? 'S' : 'N';
    updatePoleUI();
    showToast(`⚡ สลับเป็นขั้ว ${train.pole === 'N' ? 'เหนือ (N 🔴)' : 'ใต้ (S 🔵)'}`);
    spawnSparks(train.currentX, 10, train.pole === 'N' ? '#ef4444' : '#3b82f6', 12);
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

// Keyboard Listeners
window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
    }
    if (e.code === 'ArrowLeft' || e.code === 'KeyA') moveLeft();
    else if (e.code === 'ArrowRight' || e.code === 'KeyD') moveRight();
    else if (e.code === 'ArrowUp' || e.code === 'Space' || e.code === 'KeyW' || e.code === 'KeyN' || e.code === 'KeyS') togglePole();
});

// แตะบนหน้าจอแบ่ง 3 โซน (ซ้าย / กลาง / ขวา) สะดวกมากสำหรับเด็กบน iPad / มือถือ
canvas.addEventListener('click', (e) => {
    if (!isRunning || isPaused) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const third = rect.width / 3;

    if (clickX < third) {
        setLane(0); // เลนซ้าย
    } else if (clickX < third * 2) {
        setLane(1); // เลนกลาง
    } else {
        setLane(2); // เลนขวา
    }
});

// ปุ่มควบคุมสัมผัสที่แถบล่าง
$('btn-left')?.addEventListener('click', (e) => { e.stopPropagation(); moveLeft(); });
$('btn-right')?.addEventListener('click', (e) => { e.stopPropagation(); moveRight(); });
$('btn-switch')?.addEventListener('click', (e) => { e.stopPropagation(); togglePole(); });

/* ═══ SECTION 6: ระบบสร้างและสุ่มวัตถุบนราง (TRACK GENERATION) ═══ */
function spawnTrackEntity(zPos) {
    const laneWidth = CFG.LANE_WIDTH_WORLD || 280;
    const lane = [-1, 0, 1][Math.floor(currentRng() * 3)];
    const roll = currentRng();

    // 60% สารแม่เหล็ก (ตะปู, คลิป, นิกเกิล, ลูกปืน ฯลฯ) — ดูดเก็บง่าย ได้คะแนน
    if (roll < 0.60) {
        const itemData = DATA.MAGNETIC_ITEMS[Math.floor(currentRng() * DATA.MAGNETIC_ITEMS.length)];
        trackEntities.push({
            type: 'magnetic_item',
            data: itemData,
            lane: lane,
            z: zPos,
            worldX: lane * laneWidth,
            worldY: 20,
            active: true
        });
    }
    // 25% ขดลวดแม่เหล็ก N/S บนราง — ช่วยเร่งความเร็วเทอร์โบ
    else if (roll < 0.85) {
        const pole = currentRng() > 0.5 ? 'N' : 'S';
        trackEntities.push({
            type: 'coil',
            pole: pole,
            lane: lane,
            z: zPos,
            width: 160,
            active: true
        });
    }
    // 8% สิ่งที่ไม่ใช่สารแม่เหล็ก (ให้ความรู้เรื่องวัสดุ ชนแล้วไม่ตาย)
    else if (roll < 0.93) {
        const obsData = DATA.OBSTACLES[Math.floor(currentRng() * DATA.OBSTACLES.length)];
        trackEntities.push({
            type: 'obstacle',
            data: obsData,
            lane: lane,
            z: zPos,
            worldX: lane * laneWidth,
            worldY: 0,
            active: true
        });
    }
    // 7% พาวเวอร์อัปพิเศษ ซูเปอร์แม่เหล็กสายรุ้ง
    else {
        const pwrData = DATA.POWERUPS[Math.floor(currentRng() * DATA.POWERUPS.length)];
        trackEntities.push({
            type: 'powerup',
            data: pwrData,
            lane: lane,
            z: zPos,
            worldX: lane * laneWidth,
            worldY: 30,
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
    speedKmh = CFG.SPEED_CRUISE_KMH || 70;
    targetSpeedKmh = speedKmh;
    topSpeedRecord = speedKmh;
    itemsCollectedCount = 0;
    turbosCount = 0;
    distanceTravelled = 0;
    distanceToStation = CFG.STATION_INTERVAL_METERS || 1200;
    currentStationIdx = 0;

    train.laneIndex = 1;
    train.laneX = 0;
    train.currentX = 0;
    train.currentY = 0;
    train.pole = 'N';
    train.energy = 100;
    train.shield = false;
    train.superconductorSec = 0;
    train.cameraShake = 0;
    train.tilt = 0;

    trackEntities = [];
    particles = [];
    speedLines = [];
    nextSpawnZ = 450;

    // สปอว์นวัตถุเริ่มต้น เว้นระยะห่างสบายตา
    const minGap = CFG.SPAWN_GAP_MIN || 650;
    const maxGap = CFG.SPAWN_GAP_MAX || 950;
    for (let z = 600; z < (CFG.TRACK_DEPTH || 2600); z += minGap + currentRng() * (maxGap - minGap)) {
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
            window.KAMPAI.sound.defaultBgm(CFG.BGM || 'cheerful');
            window.KAMPAI.sound.bgmStart();
        }
    }

    showToast('🧲 ยินดีต้อนรับสู่ Maglev Rush! ลุยเลย');
}
window.startRound = startRound;

function restartGame() {
    startRound(Math.random, gameMode);
}
window.restartGame = restartGame;

function endGame() {
    if (!isRunning && $('gameover-screen').classList.contains('hidden') === false) return;
    isRunning = false;

    // ส่งผลลัพธ์ผ่าน Versus Framework
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

/* ═══ SECTION 8: ระบบสถานีและควิซหรรษา (EDDY CURRENT STATION) ═══ */
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
                feedBox.innerHTML = `🌟 <strong>ยอดเยี่ยม!</strong> ${opt.explain}<br>+150 คะแนน & ได้รับเทอร์โบสายรุ้ง ⚡`;
                score += CFG.POINTS_STATION_PERFECT || 150;
                speedKmh = Math.min(CFG.SPEED_MAX_KMH || 150, speedKmh + 30);
                if (window.KAMPAI && window.KAMPAI.sound) window.KAMPAI.sound.correct();
                vs.report(score, { correct: itemsCollectedCount });
            } else {
                btn.classList.add('wrong');
                feedBox.className = 'quiz-feedback show bad';
                feedBox.innerHTML = `💡 <strong>เกร็ดความรู้:</strong> ${opt.explain}`;
                if (window.KAMPAI && window.KAMPAI.sound) window.KAMPAI.sound.correct();
            }

            setTimeout(() => {
                stModal.classList.add('hidden');
                isPaused = false;
                distanceToStation = CFG.STATION_INTERVAL_METERS || 1200;

                // เมื่อจบ 3 สถานีในโหมดผจญภัย ถือว่าพิชิตการเดินทางสำเร็จ!
                if (gameMode === 'adventure' && currentStationIdx >= totalStationsGoal) {
                    endGame();
                } else {
                    showToast('⚡ มุ่งหน้าสู่สถานีถัดไป!');
                }
            }, 2400);
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

    // 1. ความเร็วและระยะทาง (นุ่มนวลมาก)
    const cruise = CFG.SPEED_CRUISE_KMH || 70;
    if (speedKmh > cruise) {
        speedKmh -= (CFG.CRUISE_RECOVERY_RATE || 0.2) * dt * 60;
    } else if (speedKmh < cruise) {
        speedKmh += (CFG.CRUISE_RECOVERY_RATE || 0.2) * dt * 60;
    }
    speedKmh = Math.max(CFG.SPEED_MIN_KMH || 50, Math.min(CFG.SPEED_MAX_KMH || 150, speedKmh));

    if (speedKmh > topSpeedRecord) topSpeedRecord = speedKmh;

    const metersThisFrame = (speedKmh * 1000 / 3600) * dt;
    distanceTravelled += metersThisFrame;
    distanceToStation -= metersThisFrame;

    if (distanceToStation <= 0) {
        triggerStationArrival();
    }

    // 2. ตำแหน่งการเลื่อนเลนของรถไฟ (การตอบสนองไว คมชัด 0.30)
    const laneWidth = CFG.LANE_WIDTH_WORLD || 280;
    const targetX = (train.laneIndex - 1) * laneWidth;
    train.currentX += (targetX - train.currentX) * 0.30;
    train.currentY = Math.sin(performance.now() * 0.003) * 3; // ลอยตัวนุ่มนวล

    if (Math.abs(train.tilt) > 0.01) train.tilt *= 0.84;

    // 3. จัดการเวลาสถานะพิเศษ
    if (train.superconductorSec > 0) {
        train.superconductorSec -= dt;
        spawnSparks(train.currentX, 15, '#06b6d4', 2);
    }
    if (train.cameraShake > 0) train.cameraShake *= 0.84;

    // 4. คอมโบ
    if (combo > 0) {
        comboTimer -= dt;
        if (comboTimer <= 0) {
            combo = 0;
            updateHUD();
        }
    }

    // 5. เลื่อนวัตถุบนรางเข้าหากล้อง (สปีดช้าพิเศษ มองเห็นชัดเจน 12-15 วินาที)
    const zStep = (speedKmh * (CFG.SPEED_STEP_MULTIPLIER || 0.35)) * dt;

    for (let i = trackEntities.length - 1; i >= 0; i--) {
        const ent = trackEntities[i];
        ent.z -= zStep;

        // ฟิสิกส์ซูเปอร์แม่เหล็ก: ดูดสารแม่เหล็กทั้ง 3 เลนเข้าหารถไฟอย่างนุ่มนวล
        if (ent.active && (ent.type === 'magnetic_item' || (ent.type === 'powerup' && train.superconductorSec > 0))) {
            const entWorldX = ent.worldX || (ent.lane * laneWidth);
            const dx = train.currentX - entWorldX;
            const dz = ent.z;
            const dist = Math.sqrt(dx * dx + dz * dz);

            const attractRange = train.superconductorSec > 0 ? 1000 : (CFG.ATTRACT_RADIUS || 800);

            if (dist < attractRange && ent.z < 900) {
                const pullSpeed = (CFG.ATTRACT_FORCE_SPEED || 42) * (1 - dist / attractRange) * 1.8;
                ent.worldX = (ent.worldX || entWorldX) + (dx > 0 ? pullSpeed : -pullSpeed);
                ent.worldY = (ent.worldY || 20) + (train.currentY + 15 - ent.worldY) * 0.25;
            }
        }

        // ตรวจสอบการชนกับหน้ารถไฟ (Z ~= 0 ถึง 95)
        if (ent.active && ent.z >= -25 && ent.z <= 95) {
            const entX = ent.worldX !== undefined ? ent.worldX : (ent.lane * laneWidth);
            const laneDiff = Math.abs(train.currentX - entX);

            // ดูดสารแม่เหล็กได้กว้าง 150px
            const hitThreshold = (ent.type === 'magnetic_item' || ent.type === 'powerup') ? 150 : 80;
            if (laneDiff < hitThreshold) {
                ent.active = false;
                handleEntityCollision(ent);
            }
        }

        // ลบวัตถุที่ผ่านเลยด้านหลังกล้อง
        if (ent.z < -100) {
            trackEntities.splice(i, 1);
        }
    }

    // สปอว์นวัตถุใหม่ข้างหน้าแบบเว้นระยะห่างกว้าง โล่ง
    const minGap = CFG.SPAWN_GAP_MIN || 650;
    const maxGap = CFG.SPAWN_GAP_MAX || 950;
    while (nextSpawnZ < (CFG.TRACK_DEPTH || 2600)) {
        spawnTrackEntity(nextSpawnZ);
        nextSpawnZ += minGap + currentRng() * (maxGap - minGap);
    }
    nextSpawnZ -= zStep;

    // อัปเดตเอฟเฟกต์อนุภาค & เส้นความเร็ว
    updateParticles(dt);

    updateHUD();
}

function handleEntityCollision(ent) {
    // 1. ผ่านขดลวดแม่เหล็กบนราง
    if (ent.type === 'coil') {
        if (train.pole === ent.pole) {
            // 🚀 ขั้วตรงกัน = เทอร์โบสายรุ้ง!
            speedKmh = Math.min(CFG.SPEED_MAX_KMH || 150, speedKmh + (CFG.TURBO_BOOST_KMH || 25));
            turbosCount++;
            addScore(CFG.POINTS_TURBO_BOOST || 50);
            addCombo();
            showToast(`🌈 เทอร์โบสายรุ้ง! ขั้ว ${train.pole}-${ent.pole} แล่นฉิว!`);
            spawnSparks(train.currentX, 15, ent.pole === 'N' ? '#ef4444' : '#3b82f6', 22);
            if (window.KAMPAI && window.KAMPAI.sound) window.KAMPAI.sound.correct();
        } else {
            // ขั้วต่างกัน = แล่นผ่านสบายๆ ไม่ลดสปีด
            showToast(`✨ แล่นผ่านขดลวดขั้ว ${ent.pole}`);
            spawnSparks(train.currentX, 10, '#38bdf8', 6);
        }
    }
    // 2. ดูดเก็บสารแม่เหล็ก (ได้คะแนน + ดาว + ดนตรีสุขสันต์)
    else if (ent.type === 'magnetic_item') {
        itemsCollectedCount++;
        addScore(ent.data.points || (CFG.POINTS_MAGNETIC_ITEM || 25));
        addCombo();
        showToast(`✨ ดูดเก็บ: ${ent.data.name} [${ent.data.element}] +${ent.data.points} คะแนน`);
        spawnSparks(train.currentX, 15, '#facc15', 16);
        if (window.KAMPAI && window.KAMPAI.sound) window.KAMPAI.sound.correct();
    }
    // 3. สัมผัสสิ่งที่ไม่ใช่สารแม่เหล็ก (เด้งดึ๋งอย่างอ่อนโยน ไม่หักเลือด ไม่ตาย)
    else if (ent.type === 'obstacle') {
        train.cameraShake = 3;
        showToast(`💡 ${ent.data.name} ไม่ใช่สารแม่เหล็กจ้า แม่เหล็กจึงไม่ดูด`);
        spawnSparks(train.currentX, 15, '#94a3b8', 10);
        if (window.KAMPAI && window.KAMPAI.sound) window.KAMPAI.sound.correct();
    }
    // 4. พาวเวอร์อัปพิเศษ ซูเปอร์แม่เหล็กสายรุ้ง
    else if (ent.type === 'powerup') {
        if (ent.data.id === 'superconductor') {
            train.superconductorSec = 10;
            showToast('🌈 ซูเปอร์แม่เหล็กสายรุ้ง! ดูดสารแม่เหล็กทั้งจอ 10 วิ');
        } else if (ent.data.id === 'shield') {
            train.shield = true;
            showToast('🛡️ ได้รับเกราะสนามแม่เหล็กสะท้อน!');
        }
        addScore(CFG.POINTS_SUPERCONDUCTOR || 100);
        spawnSparks(train.currentX, 20, '#06b6d4', 20);
        if (window.KAMPAI && window.KAMPAI.sound) window.KAMPAI.sound.correct();
    }

    vs.report(score, { correct: itemsCollectedCount });
}

function addScore(basePts) {
    const mult = 1.0 + Math.min(2.0, Math.floor(combo / (CFG.COMBO_BONUS_STEP || 3)) * 0.5);
    score += Math.round(basePts * mult);
}

function addCombo() {
    combo++;
    comboTimer = (CFG.COMBO_TIMEOUT_MS || 6000) / 1000;
}

/* ═══ SECTION 10: ระบบอนุภาค & กราฟิกเสริม (PARTICLES & FX) ═══ */
function spawnSparks(worldX, worldY, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: worldX + (Math.random() - 0.5) * 35,
            y: worldY + (Math.random() - 0.5) * 20,
            z: 15 + Math.random() * 25,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            vz: -Math.random() * 4,
            color: color,
            life: 1.0,
            decay: 0.03 + Math.random() * 0.03,
            size: 3 + Math.random() * 3
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
}

/* ═══ SECTION 11: 2.5D PERSPECTIVE RENDERER (FULL-WIDTH PANORAMIC) ═══ */
function project3D(x, y, z) {
    const fov = CFG.FOV || 420;
    const camHeight = CFG.CAMERA_HEIGHT || 150;
    const tilt = CFG.CAMERA_TILT || 0.06;

    const scale = fov / (fov + z);
    const projX = W / 2 + x * scale;
    const projY = H / 2 + camHeight * (1 - scale) - (y * scale) + (H * tilt);
    return { x: projX, y: projY, scale: scale };
}

function render() {
    ctx.clearRect(0, 0, W, H);

    // Camera Shake Offset
    let shakeX = 0, shakeY = 0;
    if (train.cameraShake > 0.4) {
        shakeX = (Math.random() - 0.5) * train.cameraShake;
        shakeY = (Math.random() - 0.5) * train.cameraShake;
    }

    ctx.save();
    ctx.translate(shakeX, shakeY);

    // 1. วาดท้องฟ้าและแสงขอบฟ้าไซเบอร์สดใสเต็มจอ
    const skyGrad = ctx.createLinearGradient(0, 0, 0, H * 0.75);
    skyGrad.addColorStop(0, '#030712');
    skyGrad.addColorStop(0.35, '#0a192f');
    skyGrad.addColorStop(0.7, '#0f172a');
    skyGrad.addColorStop(1, '#050914');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, H);

    const horizonY = H / 2 + (H * (CFG.CAMERA_TILT || 0.06));

    // แสงอาทิตย์โฮโลแกรมกว้างพิเศษ
    const sunGrad = ctx.createRadialGradient(W / 2, horizonY - 30, 20, W / 2, horizonY - 30, Math.max(450, W * 0.55));
    sunGrad.addColorStop(0, train.pole === 'N' ? 'rgba(239, 68, 68, 0.45)' : 'rgba(59, 130, 246, 0.45)');
    sunGrad.addColorStop(0.5, 'rgba(6, 182, 212, 0.15)');
    sunGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(0, horizonY - 350, W, 350);

    // 2. วาดรางแม่เหล็ก 3 เลนแบบเปิดกว้างเต็มจอ
    renderMaglevTrack(horizonY);

    // 3. วาดวัตถุบนราง
    trackEntities.sort((a, b) => b.z - a.z);
    for (const ent of trackEntities) {
        renderTrackEntity(ent);
    }

    // 4. วาดตัวรถไฟ Maglev โปร่งแสงลางๆ ไม่บังจอ
    renderTrainPlayer();

    // 5. วาดอนุภาค
    renderParticles();

    ctx.restore();
}

function renderMaglevTrack(horizonY) {
    const laneWidth = CFG.LANE_WIDTH_WORLD || 280;
    const maxZ = CFG.TRACK_DEPTH || 2600;

    // พื้นรางหลัก กว้างใหญ่เต็มหน้าจอ
    ctx.beginPath();
    const pFarL = project3D(-laneWidth * 2.5, 0, maxZ);
    const pFarR = project3D(laneWidth * 2.5, 0, maxZ);
    const pNearR = project3D(laneWidth * 2.6, 0, 0);
    const pNearL = project3D(-laneWidth * 2.6, 0, 0);

    ctx.moveTo(pFarL.x, pFarL.y);
    ctx.lineTo(pFarR.x, pFarR.y);
    ctx.lineTo(pNearR.x, pNearR.y);
    ctx.lineTo(pNearL.x, pNearL.y);
    ctx.closePath();

    const trackGrad = ctx.createLinearGradient(0, horizonY, 0, H);
    trackGrad.addColorStop(0, '#0d1d36');
    trackGrad.addColorStop(0.5, '#071324');
    trackGrad.addColorStop(1, '#020617');
    ctx.fillStyle = trackGrad;
    ctx.fill();

    // ขอบรางแม่เหล็กเรืองแสงซ้าย-ขวา
    const pFarGuideL = project3D(-laneWidth * 1.6, 0, maxZ);
    const pNearGuideL = project3D(-laneWidth * 1.6, 0, 0);
    const pFarGuideR = project3D(laneWidth * 1.6, 0, maxZ);
    const pNearGuideR = project3D(laneWidth * 1.6, 0, 0);

    ctx.strokeStyle = train.pole === 'N' ? 'rgba(239, 68, 68, 0.85)' : 'rgba(59, 130, 246, 0.85)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(pFarGuideL.x, pFarGuideL.y);
    ctx.lineTo(pNearGuideL.x, pNearGuideL.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(pFarGuideR.x, pFarGuideR.y);
    ctx.lineTo(pNearGuideR.x, pNearGuideR.y);
    ctx.stroke();

    // เส้นแบ่ง 3 เลน (Lane Lines)
    [-0.5, 0.5].forEach((pos) => {
        const p1 = project3D(pos * laneWidth, 0, maxZ);
        const p2 = project3D(pos * laneWidth, 0, 0);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
        ctx.lineWidth = 3;
        ctx.setLineDash([25, 20]);
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.setLineDash([]);
    });

    // เสาแม่เหล็กรางลอยตัวข้างทาง
    const pillarSpacing = 240;
    const offsetZ = (distanceTravelled * 3.5) % pillarSpacing;

    for (let z = pillarSpacing - offsetZ; z < maxZ; z += pillarSpacing) {
        [-2.0, 2.0].forEach((side) => {
            const base = project3D(side * laneWidth, 0, z);
            const top = project3D(side * laneWidth, 75, z);
            if (base.scale > 0) {
                ctx.strokeStyle = train.pole === 'N' ? 'rgba(239, 68, 68, 0.6)' : 'rgba(59, 130, 246, 0.6)';
                ctx.lineWidth = 6 * base.scale;
                ctx.beginPath();
                ctx.moveTo(base.x, base.y);
                ctx.lineTo(top.x, top.y);
                ctx.stroke();

                // ไฟ LED นีออนหัวเสา
                ctx.fillStyle = train.pole === 'N' ? '#f87171' : '#60a5fa';
                ctx.beginPath();
                ctx.arc(top.x, top.y, 7 * top.scale, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
}

function renderTrackEntity(ent) {
    if (!ent.active || ent.z < 0) return;
    const laneWidth = CFG.LANE_WIDTH_WORLD || 280;
    const worldX = ent.worldX !== undefined ? ent.worldX : (ent.lane * laneWidth);
    const worldY = ent.worldY || 0;
    const p = project3D(worldX, worldY, ent.z);

    if (p.scale <= 0) return;

    // รักษาระดับสเกลขั้นต่ำ เพื่อให้ตัวหนังสือคมชัด มองเห็นชัดเจนจากระยะไกล
    const visualScale = Math.max(0.70, Math.min(1.3, p.scale * 1.6));

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.scale(visualScale, visualScale);

    // 1. ขดลวดเหนี่ยวนำแม่เหล็กบนราง (Coil Pad)
    if (ent.type === 'coil') {
        const isN = ent.pole === 'N';
        const color = isN ? '#ef4444' : '#3b82f6';
        const glow = isN ? 'rgba(239, 68, 68, 0.95)' : 'rgba(59, 130, 246, 0.95)';

        ctx.fillStyle = 'rgba(15, 23, 42, 0.95)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.roundRect(-90, -35, 180, 70, 16);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 48px Kanit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = glow;
        ctx.shadowBlur = 20;
        ctx.fillText(ent.pole, 0, -5);

        ctx.font = '800 16px Kanit, sans-serif';
        ctx.fillStyle = color;
        ctx.fillText(isN ? 'ขั้วเหนือ (N ⚡)' : 'ขั้วใต้ (S 🌀)', 0, 22);

        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(0, 0, 110, 48, 0, 0, Math.PI * 2);
        ctx.stroke();
    }
    // 2. สารแม่เหล็ก (Magnetic Items) — ตัวหนังสือและไอคอนใหญ่ชัดเจน คมกริบ
    else if (ent.type === 'magnetic_item') {
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.9)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, -20, 48, 0, Math.PI * 2);
        ctx.stroke();

        ctx.font = '56px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ent.data.icon || '🔩', 0, -20);

        // กล่องป้ายชื่อภาษาไทยขนาดใหญ่ ชัดเจน อ่านง่ายมาก
        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.roundRect(-95, 30, 190, 32, 10);
        ctx.fill();
        ctx.strokeStyle = '#fde047';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '800 16px Kanit, sans-serif';
        ctx.fillText(ent.data.name, 0, 44);

        ctx.fillStyle = '#fde047';
        ctx.font = '700 12px Kanit, sans-serif';
        ctx.fillText(ent.data.element, 0, 58);
    }
    // 3. สิ่งที่ไม่ใช่สารแม่เหล็ก (Obstacles)
    else if (ent.type === 'obstacle') {
        ctx.fillStyle = 'rgba(148, 163, 184, 0.25)';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(-50, -55, 100, 100, 16);
        ctx.fill();
        ctx.stroke();

        ctx.font = '54px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ent.data.icon || '🪵', 0, -10);

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.roundRect(-80, 40, 160, 28, 8);
        ctx.fill();
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = '700 14px Kanit, sans-serif';
        ctx.fillText(`${ent.data.name} (ไม่ดูด)`, 0, 54);
    }
    // 4. พาวเวอร์อัปพิเศษ ซูเปอร์แม่เหล็กสายรุ้ง
    else if (ent.type === 'powerup') {
        ctx.fillStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 4.5;
        ctx.beginPath();
        ctx.arc(0, -20, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.font = '56px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ent.data.icon || '🌈', 0, -20);

        ctx.fillStyle = '#020617';
        ctx.beginPath();
        ctx.roundRect(-90, 30, 180, 28, 8);
        ctx.fill();
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#38bdf8';
        ctx.font = '800 14px Kanit, sans-serif';
        ctx.fillText(ent.data.name, 0, 46);
    }

    ctx.restore();
}

/* ═══ SECTION 12: หัวรถไฟ Maglev โปร่งแสงลางๆ (HOLOGRAPHIC GHOST COCKPIT) ═══
   ไม่บังวิสัยทัศน์รางด้านหน้า */
function renderTrainPlayer() {
    const p = project3D(train.currentX, train.currentY, 15);
    if (p.scale <= 0) return;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(train.tilt);

    const isN = train.pole === 'N';
    const mainColor = isN ? '#ef4444' : '#3b82f6';
    const glowColor = isN ? 'rgba(239, 68, 68, 0.8)' : 'rgba(59, 130, 246, 0.8)';

    // 1. แสงเรืองสนามแม่เหล็กลอยตัวใต้ท้องรถ
    const levGrad = ctx.createRadialGradient(0, 15, 5, 0, 15, 110);
    levGrad.addColorStop(0, glowColor);
    levGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = levGrad;
    ctx.beginPath();
    ctx.ellipse(0, 18, 120, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // 2. ตัวถังรถไฟโปร่งแสงลางๆ
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.moveTo(0, -35);
    ctx.bezierCurveTo(40, -25, 58, 0, 55, 20);
    ctx.lineTo(-55, 20);
    ctx.bezierCurveTo(-58, 0, -40, -25, 0, -35);
    ctx.closePath();
    ctx.fill();

    // ขอบเส้นนีออนเลเซอร์
    ctx.globalAlpha = 0.75;
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 15;
    ctx.stroke();

    // 3. ป้ายโฮโลแกรมแสดงขั้วแม่เหล็ก N/S
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = 'rgba(2, 6, 23, 0.85)';
    ctx.beginPath();
    ctx.roundRect(-42, 0, 84, 26, 12);
    ctx.fill();
    ctx.strokeStyle = mainColor;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 16px Kanit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isN ? 'ขั้ว N 🔴' : 'ขั้ว S 🔵', 0, 13);

    // 4. เอฟเฟกต์ซูเปอร์แม่เหล็กสายรุ้ง
    if (train.superconductorSec > 0) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.9)';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(0, 0, 88 + Math.sin(performance.now() * 0.02) * 8, 0, Math.PI * 2);
        ctx.stroke();
    }

    ctx.restore();
}

function renderParticles() {
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
}

/* ═══ SECTION 13: การอัปเดต UI & HUD ═══ */
function updateHUD() {
    $('score-val').textContent = score.toLocaleString();
    $('speed-val').textContent = Math.round(speedKmh);

    // Combo Badge
    const cb = $('combo-badge');
    if (combo > 1) {
        cb.style.display = 'inline-block';
        cb.textContent = `COMBO x${combo}`;
    } else {
        cb.style.display = 'none';
    }

    // ดาวสะสม & การผ่านสถานี
    $('station-progress-label').textContent = `🚉 สถานีที่ ${Math.min(totalStationsGoal, currentStationIdx + 1)} / ${totalStationsGoal}`;
    $('station-dist-val').textContent = `${Math.max(0, Math.round(distanceToStation)).toLocaleString()} m`;
}

function showToast(msg) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => {
        t.classList.remove('show');
    }, 2400);
}

/* ═══ SECTION 14: เชื่อมต่อ LEADERBOARD & สถิติผู้เล่น ═══ */
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

/* ═══ SECTION 15: MAIN GAME LOOP ═══ */
function gameLoop(now) {
    const dt = Math.min(0.1, (now - lastTimestamp) / 1000);
    lastTimestamp = now;

    updateGame(dt);
    render();

    requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);

})();
