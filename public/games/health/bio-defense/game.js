/* game.js — โลจิกควบคุมหลักเกม Bio-Defense (แนววางแผนสร้างป้อม) */

const CFG = window.GAME_CONFIG;
const DATA = window.GAME_DATA;

KAMPAI.setSlug(CFG.SLUG);
KAMPAI.sound.defaultBgm(CFG.BGM);

// ── ระบบนักเรียนและ Leaderboard ──
function renderPlayer() {
    const s = KAMPAI.student, st = KAMPAI.stats;
    if (!s) return;
    const chip = document.getElementById('player-chip');
    const av = s.photoUrl ? `<img src="${s.photoUrl}" alt="">` : `<div class="pc-init">${(s.displayName||'?')[0]}</div>`;
    const best = st ? ` · <span class="pc-best">สถิติ ${st.personalBest.toLocaleString()}</span>` : '';
    chip.innerHTML = av + `<span>${s.displayName}${best}</span>`;
    chip.style.display = 'flex';
}

function renderMyStats() {
    const st = KAMPAI.stats;
    if (!st) return;
    document.getElementById('ms-best').innerText = (st.personalBest || 0).toLocaleString();
    document.getElementById('ms-plays').innerText = (st.playsCount || 0).toLocaleString();
    document.getElementById('my-stats').style.display = 'flex';
}

function renderLeaderboard(listId) {
    const el = document.getElementById(listId);
    if (!el) return;
    const rows = KAMPAI.leaderboard || [];
    if (!rows.length) { el.innerHTML = '<li class="lb-loading">ยังไม่มีผู้เล่น — เป็นคนแรกสิ!</li>'; return; }
    const medals = ['🥇','🥈','🥉'];
    el.innerHTML = rows.slice(0, 5).map((r) => {
        const av = r.photoUrl ? `<img class="lb-avatar" src="${r.photoUrl}" alt="">` : `<div class="lb-avatar-init">${(r.displayName||'?')[0]}</div>`;
        return `<li class="${r.isMe ? 'is-me' : ''}">
            <span class="lb-rank">${medals[r.rank-1] || r.rank}</span>${av}
            <div class="lb-info"><div class="lb-name">${r.displayName}${r.isMe ? ' (คุณ)' : ''}</div>
            <div class="lb-sub">${(r.personalBest||0).toLocaleString()} คะแนน · ${r.classLabel||''}</div></div>
        </li>`;
    }).join('');
}

KAMPAI.onReady(function () { 
    renderPlayer(); 
    renderMyStats(); 
    renderLeaderboard('score-list'); 
});

// ติดตั้งแผงเสียง (ไม่มีปุ่ม D-pad บังคับเพราะใช้คลิก/แท็บวางป้อม)
KAMPAI.sound.mountToggles();

// ── ระบบออนไลน์ (KampaiMatch) ──
let match = null;
if (CFG.ENABLE_ONLINE && window.KampaiMatch) {
    match = KampaiMatch.create({
        duration: CFG.ONLINE_DURATION,
        title: 'ศึกภูมิคุ้มกันร่างกายออนไลน์',
        onPlay: function ({ rng }) { startGame('online', rng); },
        onEnd:  function () { isGameOver = true; },
    });
    document.getElementById('online-btn').style.display = '';
}

function openOnline() { 
    if (match) match.openMenu(); 
}

// ── ระบบจัดการเกม สเตต และ Canvas ──
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let cw = 0, ch = 0;

function resize() {
    const rect = canvas.getBoundingClientRect();
    cw = canvas.width = rect.width;
    ch = canvas.height = rect.height;
    recalculatePath();
}
window.addEventListener('resize', () => {
    setTimeout(resize, 100);
});

const $ = (id) => document.getElementById(id);

// สเตตหลักของเกม
let mode = 'adventure';
let score = 0;
let energy = CFG.START_ENERGY;
let lives = CFG.BASE_LIVES;
let currentWave = 1;
let activeWaveIndex = 0; // ในโหมดผจญภัย
let waveRunning = false;
let isGameOver = false;
let started = false;
let gamePaused = false;
let localRand = Math.random;

// ระบบแผนที่/เส้นทาง (Normalized Coordinates 0.0 - 1.0)
const baseMapPoints = [
    { x: 0.0,  y: 0.3 },
    { x: 0.22, y: 0.3 },
    { x: 0.22, y: 0.72 },
    { x: 0.52, y: 0.72 },
    { x: 0.52, y: 0.22 },
    { x: 0.76, y: 0.22 },
    { x: 0.76, y: 0.55 },
    { x: 1.0,  y: 0.55 }
];
let pathPoints = []; // พิกเซลจริงหลังคำนวณตามความกว้างจอ

function recalculatePath() {
    pathPoints = baseMapPoints.map(pt => ({
        x: pt.x * cw,
        y: pt.y * ch
    }));
}

// คอนเทนเนอร์วัตถุและเอฟเฟกต์ในบอร์ด
let towers = [];
let pathogens = [];
let projectiles = [];
let particles = [];
let damagePops = [];
let buffZones = []; // โซนวิตามิน
let screenShakeTimer = 0;

// ท่าไม้ตาย (Antibiotic Ultimate)
let ultimateCooldown = 0; // หน่วย ms
let antibioticBombEffect = 0; // แอนิเมชันแฟลชเขียวกวาดลอยจอ

// วัตถุในการเลือกและคลิก
let selectedTowerType = 'neutrophil'; // ชนิดที่เตรียมสร้าง
let activeSelectedTower = null; // ป้อมที่ถูกจิ้มเพื่ออัปเกรด/ขาย
let mouseX = 0, mouseY = 0;
let isPlacingTower = false;

// ระบบควิซสุขศึกษา
let triviaCooldown = 0; // หน่วย ms
let activeQuestionIndex = 0;
let triviaActive = false;

// ── ฟังก์ชันคำนวณระยะทางและพิกัดชน ──
function getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx*dx + dy*dy);
}

// คำนวณระยะห่างของจุดใดๆ จากเส้นเวกเตอร์เส้นทาง (ป้องกันไม่ให้วางทับทางเดินเชื้อโรค)
function distToSegment(x, y, x1, y1, x2, y2) {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;
    let xx, yy;
    if (param < 0) {
        xx = x1; yy = y1;
    } else if (param > 1) {
        xx = x2; yy = y2;
    } else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }
    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

function isPositionValidForTower(tx, ty) {
    // 1. ตรวจสอบระยะห่างจากเส้นทางเดิน (ต้องห่างมากกว่า 35 พิกเซล)
    for (let i = 0; i < pathPoints.length - 1; i++) {
        const p1 = pathPoints[i];
        const p2 = pathPoints[i+1];
        if (distToSegment(tx, ty, p1.x, p1.y, p2.x, p2.y) < 35) {
            return false;
        }
    }

    // 2. ตรวจสอบการทับซ้อนป้อมเดิม (ต้องห่างมากกว่า 30 พิกเซล)
    for (const tw of towers) {
        if (getDistance(tx, ty, tw.x, tw.y) < 32) {
            return false;
        }
    }

    // 3. ตรวจสอบว่าไม่หลุดนอกขอบจอฝั่งขวา (ชนหน้าเมนู)
    if (tx > cw - 20) return false;

    return true;
}

// ── ฟังก์ชันอัปเดตสเตตพลังงานชีวภาพและเลือด ──
function addBioEnergy(amount) {
    energy = Math.max(0, energy + amount);
    $('energy-value').innerText = energy;
    const ec = $('energy-container');
    ec.classList.add('pop');
    setTimeout(() => ec.classList.remove('pop'), 150);
}

function updateLives(amount) {
    lives = Math.max(0, amount);
    $('life-value').innerText = lives;
    const lc = $('life-container');
    lc.classList.add('pop');
    setTimeout(() => lc.classList.remove('pop'), 150);

    if (lives <= 0) {
        endGame();
    }
}

// ── ระบบไอคอนป้อมควิซ และปุ่มตัวเลือก ──
function selectTowerType(type) {
    selectedTowerType = type;
    document.querySelectorAll('.tower-card').forEach(el => el.classList.remove('selected'));
    $(`sel-${type}`).classList.add('selected');
    isPlacingTower = true;
    closeTowerActionMenu();
}

// ── ระบบควิซสุขศึกษา (Trivia) ──
function openTriviaModal() {
    if (triviaCooldown > 0 || triviaActive) return;
    
    // หยุดเกมชั่วคราว
    gamePaused = true;
    triviaActive = true;
    KAMPAI.sound.bgmStop();
    
    // เลือกคำถาม
    activeQuestionIndex = Math.floor(localRand() * DATA.QUESTIONS.length);
    const qObj = DATA.QUESTIONS[activeQuestionIndex];
    
    $('trivia-question').innerText = qObj.q;
    
    // ล้างและสร้างปุ่มตัวเลือก
    const box = $('trivia-options-box');
    box.innerHTML = '';
    
    qObj.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'opt-btn';
        btn.innerText = opt;
        btn.onclick = () => submitTriviaAnswer(idx, btn);
        box.appendChild(btn);
    });

    $('trivia-feedback').innerHTML = 'ตอบคำถามสุขศึกษาเพื่อกระตุ้นเซลล์เม็ดเลือดขาว (+🔋 50 พลังงานชีวภาพ)';
    $('trivia-overlay').classList.add('open');

    // ออกเสียงคำถามเป็นภาษาไทยผ่าน TTS
    try {
        KAMPAI.sound.speak(qObj.speak, 'th-TH');
    } catch (_) {}
}

function submitTriviaAnswer(selectedIdx, btnElement) {
    const qObj = DATA.QUESTIONS[activeQuestionIndex];
    const optionButtons = document.querySelectorAll('.opt-btn');
    
    // ล็อกปุ่ม
    optionButtons.forEach(btn => btn.disabled = true);
    
    if (selectedIdx === qObj.answer) {
        // ตอบถูก
        btnElement.classList.add('correct');
        KAMPAI.sound.correct();
        $('trivia-feedback').innerHTML = '<span style="color:#10b981; font-weight:700;">✓ ถูกต้อง! ได้รับ 🔋 50 พลังงานชีวภาพ</span>';
        
        setTimeout(() => {
            addBioEnergy(CFG.TRIVIA_ENERGY_REWARD);
            closeTriviaModal();
        }, 1200);
    } else {
        // ตอบผิด
        btnElement.classList.add('wrong');
        optionButtons[qObj.answer].classList.add('correct'); // เผยคำตอบที่ถูก
        KAMPAI.sound.wrong();
        $('trivia-feedback').innerHTML = '<span style="color:#ef4444; font-weight:700;">✗ ผิดพลาด! ยารักษาโรคถูกบล็อกชั่วคราว</span>';
        
        // ปิดปุ่มตอบไปชั่วคราวติดคูลดาวน์
        triviaCooldown = CFG.TRIVIA_COOLDOWN_MS;
        updateTriviaButtonUI();

        setTimeout(() => {
            closeTriviaModal();
        }, 2000);
    }
}

function closeTriviaModal() {
    $('trivia-overlay').classList.remove('open');
    KAMPAI.sound.stopSpeak();
    
    // คืนสเตตเล่นเกมต่อ
    gamePaused = false;
    triviaActive = false;
    KAMPAI.sound.bgmStart();
}

function updateTriviaButtonUI() {
    const btn = $('trivia-btn');
    if (triviaCooldown > 0) {
        btn.disabled = true;
        btn.classList.remove('btn-pulse');
        btn.querySelector('.act-reward').innerText = `⏳ ${(triviaCooldown/1000).toFixed(0)}s`;
    } else {
        btn.disabled = false;
        btn.classList.add('btn-pulse');
        btn.querySelector('.act-reward').innerText = `+🔋 50`;
    }
}

// ── ระบบปุ่มท่าไม้ตาย (Antibiotic Ultimate) ──
function triggerUltimateSkill() {
    if (ultimateCooldown > 0 || pathogens.length === 0 || gamePaused) return;

    // เริ่มคูลดาวน์และกระตุ้นเอฟเฟกต์กวาดล้าง
    ultimateCooldown = CFG.ULTIMATE_COOLDOWN_MS;
    antibioticBombEffect = 1.0;
    
    screenShakeTimer = 20;
    KAMPAI.sound.fxFlash(true);
    
    // ทำลายเชื้อโรคทุกตัวบนจอ
    pathogens.forEach(p => {
        p.hp -= CFG.ULTIMATE_DAMAGE;
        // ป๊อปความเสียหาย
        damagePops.push({
            x: p.x,
            y: p.y - 10,
            text: `💊 -${CFG.ULTIMATE_DAMAGE}`,
            color: '#34d399',
            vy: -2,
            life: 1.0
        });

        // ระเบิดอนุภาคเขียวกระจายตัวเชื้อโรค
        for (let i = 0; i < 5; i++) {
            particles.push({
                x: p.x,
                y: p.y,
                vx: (localRand() - 0.5) * 5,
                vy: (localRand() - 0.5) * 5,
                color: '#34d399',
                size: 4 + localRand() * 4,
                life: 1.0,
                decay: 0.05
            });
        }
    });

    // ตรวจสอบเช็คตัวตายหลังล้างจอ
    checkPathogensDeath();
}

function updateUltimateButtonUI(dt) {
    const btn = $('ultimate-btn');
    if (ultimateCooldown > 0) {
        ultimateCooldown = Math.max(0, ultimateCooldown - dt);
        btn.disabled = true;
        btn.classList.add('cooling');
        $('ult-cooldown-text').innerText = `${(ultimateCooldown/1000).toFixed(1)}s`;
    } else {
        btn.disabled = false;
        btn.classList.remove('cooling');
        $('ult-cooldown-text').innerText = `พร้อมใช้งาน`;
    }
}

// ── โหมดการทำงานของป้อมวงกลมตัวเลือก (Circular Actions) ──
function openTowerActionMenu(tw) {
    activeSelectedTower = tw;
    const menu = $('tower-action-menu');
    
    // คำนวณขยับพิกัดลอยเหนือกราฟิกป้อม
    menu.style.left = `${tw.x - 60}px`;
    menu.style.top = `${tw.y - 60}px`;
    
    // คำนวณราคาอัพเกรดและขายคืน
    $('tam-upgrade-cost').innerText = `🔋 ${CFG.UPGRADE_COST}`;
    $('tam-sell-refund').innerText = `🔋 ${Math.floor(CFG.TOWERS[tw.type].cost * tw.level * CFG.SELL_REFUND_FACTOR)}`;
    
    menu.classList.remove('hidden');
    isPlacingTower = false; // สลับโหมดวาง
}

function closeTowerActionMenu() {
    activeSelectedTower = null;
    $('tower-action-menu').classList.add('hidden');
}

function upgradeSelectedTower() {
    if (!activeSelectedTower) return;
    const tw = activeSelectedTower;
    if (energy >= CFG.UPGRADE_COST) {
        addBioEnergy(-CFG.UPGRADE_COST);
        tw.level++;
        tw.range *= CFG.UPGRADE_MULT_RANGE;
        tw.damage = Math.round(tw.damage * CFG.UPGRADE_MULT_DAMAGE);
        
        // ป๊อปประกายสปีดเลเวล
        spawnChemicalBurst(tw.x, tw.y, '#10b981');
        KAMPAI.sound.correct();
        
        damagePops.push({
            x: tw.x,
            y: tw.y - 35,
            text: `LV ${tw.level} ↑`,
            color: '#10b981',
            vy: -1.5,
            life: 1.0
        });
    } else {
        showToast('พลังงานชีวภาพไม่เพียงพอ!');
        KAMPAI.sound.wrong();
    }
    closeTowerActionMenu();
}

function sellSelectedTower() {
    if (!activeSelectedTower) return;
    const tw = activeSelectedTower;
    const refund = Math.floor(CFG.TOWERS[tw.type].cost * tw.level * CFG.SELL_REFUND_FACTOR);
    
    addBioEnergy(refund);
    
    // เคลียร์ป้อมออกจากสำรับ
    towers = towers.filter(t => t !== tw);
    
    spawnChemicalBurst(tw.x, tw.y, '#fbbf24');
    KAMPAI.sound.correct();
    
    closeTowerActionMenu();
}

// ── ระบบการสร้างฝูงเชื้อโรค (Pathogens Waves) ──
let waveSpawnQueue = [];
let spawnTimerMs = 0;

function startNextWave() {
    if (waveRunning || isGameOver || gamePaused) return;

    waveRunning = true;
    $('wave-btn').disabled = true;
    $('wave-notice').classList.add('hidden');

    let waveData;
    
    if (mode === 'adventure') {
        waveData = CFG.WAVES[activeWaveIndex];
        $('wave-badge').innerText = `เวฟ ${currentWave}/${CFG.WAVES.length}`;
        showToast(`💥 เวฟที่ ${currentWave} บุก! 💥`);
    } else { // โหมดแข่งขันเวลา / ออนไลน์ (สปอว์นไม่มีที่สิ้นสุดตามลำดับสุ่ม Seed)
        $('wave-badge').innerText = `เวฟ ${currentWave}`;
        showToast(`💥 เวฟที่ ${currentWave} บุก! 💥`);
        
        // สุ่มชุดเชื้อโรคตามรอบตาม Seed
        const count = 5 + currentWave * 3;
        const typeRoll = localRand();
        let type = 'rhinovirus';
        if (currentWave >= 3 && typeRoll < 0.45) type = 'streptococcus';
        else if (currentWave >= 5 && typeRoll < 0.8) type = 'parasite';
        
        waveData = {
            spawn: [
                { type: type, count: count, delay: Math.max(400, 1200 - currentWave * 80) }
            ]
        };
    }

    // สร้างคิวสปอว์น
    waveSpawnQueue = [];
    waveData.spawn.forEach(group => {
        for (let i = 0; i < group.count; i++) {
            waveSpawnQueue.push({
                type: group.type,
                delay: group.delay
            });
        }
    });

    spawnTimerMs = 0;
    
    // กระตุ้นดนตรีคลื่นบุก
    KAMPAI.sound.unlock();
}

function processSpawning(dt) {
    if (waveSpawnQueue.length === 0) return;

    spawnTimerMs += dt;
    const nextSpawn = waveSpawnQueue[0];

    if (spawnTimerMs >= nextSpawn.delay) {
        spawnTimerMs = 0;
        waveSpawnQueue.shift();

        // นำเข้าเชื้อโรค
        const pSpec = CFG.PATHOGENS[nextSpawn.type];
        pathogens.push({
            type: nextSpawn.type,
            name: pSpec.name,
            x: pathPoints[0].x,
            y: pathPoints[0].y,
            targetIndex: 1,
            hp: Math.round(pSpec.hp * (1 + (currentWave - 1) * 0.15)), // เพิ่มเลือดตามเลเวลเวฟ
            maxHp: Math.round(pSpec.hp * (1 + (currentWave - 1) * 0.15)),
            speed: pSpec.speed,
            reward: pSpec.reward,
            score: pSpec.score,
            emoji: pSpec.emoji,
            color: pSpec.color,
            size: pSpec.size,
            slowTimer: 0,
            slowFactor: 1.0,
            poisonTicks: 0,
            hitResolveTimer: 0
        });
    }
}

// ── ระบบการชนและการทำลายล้าง ──
function checkPathogensDeath() {
    for (let i = pathogens.length - 1; i >= 0; i--) {
        const p = pathogens[i];
        if (p.hp <= 0) {
            // ตาย!
            addBioEnergy(p.reward);
            score += p.score;
            $('score-value').innerText = score;
            
            // เอฟเฟกต์พลังงานชีวภาพร่วงขยาย
            damagePops.push({
                x: p.x,
                y: p.y - 12,
                text: `+🔋 ${p.reward}`,
                color: '#10b981',
                vy: -1.5,
                life: 0.8
            });

            spawnChemicalBurst(p.x, p.y, p.color);
            KAMPAI.sound.correct();
            pathogens.splice(i, 1);
            
            // ส่งคะแนนสำหรับแข่งขันออนไลน์
            if (mode === 'online' && match) {
                match.report(score, { correct: currentWave });
            }
        }
    }
}

function spawnChemicalBurst(x, y, color) {
    for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 / 8) * i;
        const speed = 1.5 + localRand() * 2.5;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: color,
            size: 3 + localRand() * 4,
            life: 1.0,
            decay: 0.04 + localRand() * 0.04
        });
    }
}

// ── ฟังก์ชันเริ่มเกม (Start Game) ──
function startGame(m, rng) {
    if (started && m !== 'online' && mode !== 'online') return;

    mode = m || 'adventure';
    started = true;
    isGameOver = false;
    gamePaused = false;
    waveRunning = false;
    
    localRand = rng || Math.random;

    score = 0;
    energy = CFG.START_ENERGY;
    lives = CFG.BASE_LIVES;
    currentWave = 1;
    activeWaveIndex = 0;
    
    towers = [];
    pathogens = [];
    projectiles = [];
    particles = [];
    damagePops = [];
    buffZones = [];
    waveSpawnQueue = [];

    ultimateCooldown = 0;
    antibioticBombEffect = 0;
    triviaCooldown = 0;

    $('score-value').innerText = score;
    $('energy-value').innerText = energy;
    $('life-value').innerText = lives;
    $('wave-badge').innerText = `เวฟ 1/${mode === 'adventure' ? CFG.WAVES.length : '∞'}`;
    
    $('player-chip').style.display = KAMPAI.student ? 'flex' : 'none';
    $('blocker').style.display = 'none';
    $('wave-btn').disabled = false;
    $('wave-notice').classList.add('hidden');

    // คำนวณพิกเซลแผนที่
    resize();

    // สร้าง Vitamin Buff Zones สุ่มจุด
    for (let i = 0; i < 3; i++) {
        // หาพิกัดที่อยู่นอกแนวทางเดิน
        let bx = 0, by = 0;
        let valid = false;
        let attempts = 0;
        while (!valid && attempts < 100) {
            attempts++;
            bx = 50 + localRand() * (cw - 350); // กันพิกัด sidebar ขวา
            by = 80 + localRand() * (ch - 150);
            if (isPositionValidForTower(bx, by)) {
                // ต้องห่างจากพื้นที่วางบัฟโซนอื่นด้วย
                let tooCloseToOthers = false;
                for (const zone of buffZones) {
                    if (getDistance(bx, by, zone.x, zone.y) < 80) {
                        tooCloseToOthers = true;
                    }
                }
                if (!tooCloseToOthers) {
                    valid = true;
                }
            }
        }
        if (valid) {
            const types = ['🍋 Vit-C', '🥦 Vit-B', '☀️ Vit-D'];
            buffZones.push({
                x: bx,
                y: by,
                type: types[i % types.length],
                pulse: 0
            });
        }
    }

    // เริ่มคูลดาวน์ ultimate
    updateUltimateButtonUI(0);
    updateTriviaButtonUI();

    KAMPAI.sound.unlock();
    KAMPAI.sound.bgmStart();

    requestAnimationFrame(loop);
}

// ── กระบวนการจบควิซ/หมดคลื่น/จบเกม ──
function checkWaveCompletion() {
    if (waveRunning && waveSpawnQueue.length === 0 && pathogens.length === 0) {
        waveRunning = false;
        $('wave-btn').disabled = false;
        
        showToast(`🎉 เวฟที่ ${currentWave} สำเร็จ! 🎉`);
        KAMPAI.sound.correct();
        
        currentWave++;

        if (mode === 'adventure' && currentWave > CFG.WAVES.length) {
            endGame(true); // ชนะ
        } else {
            activeWaveIndex++;
            $('wave-notice').classList.remove('hidden');
        }
    }
}

function endGame(won = false) {
    if (isGameOver) return;
    isGameOver = true;

    KAMPAI.sound.bgmStop();
    KAMPAI.sound.stopSpeak();
    
    if (won) {
        KAMPAI.sound.correct();
    } else {
        KAMPAI.sound.gameOver();
    }

    const stars = won ? 3 : CFG.STAR_THRESHOLDS.filter((t) => score >= t).length;
    
    // ส่งข้อมูลแต้มเข้าระบบ
    KAMPAI.submitScore(score, {
        mode: won ? 'test' : 'normal',
        stars: stars,
        level_reached: currentWave,
        is_success: won
    });

    $('go-stars').innerText = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    $('final-score').innerText = score;
    $('go-summary').innerText = won 
        ? `ยินดีด้วย! คุณสามารถปกป้องร่างกายจากเชื้อโรคได้สำเร็จทุกระลอกการโจมตี!` 
        : `ร่างกายติดเชื้อรุนแรง! พ่ายแพ้ในเวฟที่ ${currentWave} (กำจัดเชื้อโรคไปได้ ${score/10} ตัว)`;
        
    $('gameover-screen').style.display = 'flex';
    renderLeaderboard('score-list-gameover');
}

// ── วาดฉากหลัง และแผนที่ ──
function drawEnvironment() {
    // 1. ดับเบิลเฉดชีวภาพ (Biological Dark Teal Gradient)
    const gr = ctx.createLinearGradient(0, 0, cw, ch);
    gr.addColorStop(0, '#06101e');
    gr.addColorStop(0.5, '#02182c');
    gr.addColorStop(1, '#050a14');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, cw, ch);

    // วาดเม็ดเลือดแดงลอยฉากหลังเบลอๆ จางๆ
    ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
    for (let i = 0; i < 15; i++) {
        let rx = (Math.sin(performance.now() * 0.00015 + i * 200) * 0.5 + 0.5) * cw;
        let ry = ((performance.now() * 0.025 + i * 80) % ch);
        ctx.beginPath();
        ctx.arc(rx, ry, 12, 0, Math.PI * 2);
        ctx.fill();
    }

    // 2. วาดโซนวิตามินบัฟ (Vitamin Buff Zones)
    buffZones.forEach(zone => {
        zone.pulse += 0.04;
        const radius = 25 + Math.sin(zone.pulse) * 4;
        
        ctx.save();
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 10;
        
        // วงกลมสว่างในตัว
        ctx.beginPath();
        ctx.arc(zone.x, zone.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
        ctx.fill();
        
        ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        
        // วาดชื่อไอคอนตัวย่อตรงกลาง
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#67e8f9';
        ctx.font = 'bold 11px Kanit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(zone.type, zone.x, zone.y);
        ctx.restore();
    });

    // 3. วาดเส้นทางเดินเลือด/ลำไส้ (The Blood Vessel Path)
    ctx.save();
    
    // วงหนาล่างสุดทำขอบผิวหลอดเลือด (Outer border)
    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
        ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
    ctx.strokeStyle = '#b91c1c'; // แดงก่ำ
    ctx.lineWidth = 36;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // เส้นแกนเลือดชั้นใน
    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
        ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
    ctx.strokeStyle = '#dc2626'; // แดงสว่างขึ้น
    ctx.lineWidth = 30;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // ลายกระแสทางเดินในท่อ (สร้างเส้นริ้วขยับตามเวลา)
    ctx.beginPath();
    ctx.moveTo(pathPoints[0].x, pathPoints[0].y);
    for (let i = 1; i < pathPoints.length; i++) {
        ctx.lineTo(pathPoints[i].x, pathPoints[i].y);
    }
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([12, 24]);
    ctx.lineDashOffset = -performance.now() * 0.02; // เลื่อนตามแนวทางไหล
    ctx.stroke();
    
    ctx.restore();
}

// ── ตัวแปลเกมลูปหลัก (Loop) ──
let lastFrameTime = 0;

function loop(timestamp) {
    if (isGameOver) return;

    if (!lastFrameTime) lastFrameTime = timestamp;
    const dt = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    if (!gamePaused) {
        // 1. ระบบคูลดาวน์พลังงาน
        if (triviaCooldown > 0) {
            triviaCooldown = Math.max(0, triviaCooldown - dt);
            updateTriviaButtonUI();
        }

        // 2. สปอว์นเชื้อโรค
        processSpawning(dt);

        // 3. ท่าไม้ตายคูลดาวน์
        updateUltimateButtonUI(dt);

        // ── ฟังก์ชันอัปเดตตำแหน่ง เชื้อโรค (Pathogens) ──
        for (let i = pathogens.length - 1; i >= 0; i--) {
            const p = pathogens[i];
            
            // อัปเดต debuff สโลว์
            if (p.slowTimer > 0) {
                p.slowTimer = Math.max(0, p.slowTimer - dt);
                if (p.slowTimer <= 0) p.slowFactor = 1.0;
            }

            // คำนวณเดินไปยังจุดปลายเป้าหมาย
            const target = pathPoints[p.targetIndex];
            const dx = target.x - p.x;
            const dy = target.y - p.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            // ความเร็วเฟรมนี้
            const frameSpeed = p.speed * p.slowFactor;

            if (dist <= frameSpeed) {
                p.x = target.x;
                p.y = target.y;
                p.targetIndex++;
                
                // เช็คกรณีหลุดถึงเส้นชัย (หลุดเข้าร่างกาย)
                if (p.targetIndex >= pathPoints.length) {
                    const dmg = p.type === 'parasite' ? 3 : 1;
                    updateLives(lives - dmg);
                    
                    KAMPAI.sound.wrong();
                    KAMPAI.sound.fxFlash(false);
                    screenShakeTimer = 8;
                    
                    // ป๊อปเสียหายชีวิต
                    damagePops.push({
                        x: p.x - 30,
                        y: p.y - 10,
                        text: `💥 -${dmg}❤️`,
                        color: '#ef4444',
                        vy: -1,
                        life: 1.0
                    });

                    pathogens.splice(i, 1);
                    continue;
                }
            } else {
                p.x += (dx / dist) * frameSpeed;
                p.y += (dy / dist) * frameSpeed;
            }
        }

        // ── ฟังก์ชันอัปเดตยิงของป้อมปืน (Towers) ──
        towers.forEach(t => {
            // เช็คว่าวางในโซนวิตามินบัฟหรือไม่
            let isBuffed = false;
            buffZones.forEach(zone => {
                if (getDistance(t.x, t.y, zone.x, zone.y) < 32) {
                    isBuffed = true;
                }
            });

            // ค่าสเตตหลังหักบัฟ
            const range = isBuffed ? t.range * 1.25 : t.range;
            const fireRate = isBuffed ? t.fireRateMs * 0.8 : t.fireRateMs;

            // หาเป้าหมายที่อยู่ในระยะยิง (เลือกตัวแรกสุดในแถวที่เข้าถึงรัศมี)
            let target = null;
            for (const p of pathogens) {
                if (getDistance(t.x, t.y, p.x, p.y) < range) {
                    target = p;
                    break;
                }
            }

            if (target) {
                // หมุนหา
                t.angle = Math.atan2(target.y - t.y, target.x - t.x);
                
                // ยิงตามอัตราเร็วคูลดาวน์
                if (timestamp - t.lastShotTime > fireRate) {
                    t.lastShotTime = timestamp;
                    
                    if (t.type === 'macrophage') {
                        // แมคโครฟาจ: คลื่นทำลาย AOE
                        t.pulseRadius = 10; // สตาร์ทวงขยายตัว
                        
                        // สร้างอนุภาครอบทิศป้อม
                        for (let i = 0; i < 4; i++) {
                            particles.push({
                                x: t.x,
                                y: t.y,
                                vx: (localRand() - 0.5) * 2,
                                vy: (localRand() - 0.5) * 2,
                                color: '#3b82f6',
                                size: 2 + localRand() * 3,
                                life: 1.0,
                                decay: 0.05
                            });
                        }

                        // ทำความเสียหายเชื้อโรคทั้งหมดในระยะ
                        pathogens.forEach(p => {
                            if (getDistance(t.x, t.y, p.x, p.y) < range) {
                                p.hp -= t.damage;
                                // ป๊อปค่าดาเมจ
                                damagePops.push({
                                    x: p.x,
                                    y: p.y - 12,
                                    text: `-${t.damage}`,
                                    color: '#60a5fa',
                                    vy: -2,
                                    life: 0.6
                                });
                            }
                        });
                        KAMPAI.sound.correct();
                        checkPathogensDeath();
                        
                    } else {
                        // นิวโทรฟิล & บีเซลล์: ปล่อยกระสุนพุ่งหาเป้าหมาย
                        projectiles.push({
                            x: t.x,
                            y: t.y,
                            target: target,
                            type: t.type,
                            damage: t.damage,
                            speed: t.type === 'bcell' ? 4.5 : 6.0,
                            color: t.bulletColor
                        });
                    }
                }
            }
        });

        // ── อัปเดตกระสุนยิง (Projectiles) ──
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const proj = projectiles[i];
            const p = proj.target;

            // หากเป้าหมายตายไปก่อนหน้า ให้พุ่งไปจุดสุดท้ายของพิกัดเชื้อโรค หรือลบทิ้ง
            const targetX = p ? p.x : proj.x;
            const targetY = p ? p.y : proj.y;
            
            const dx = targetX - proj.x;
            const dy = targetY - proj.y;
            const dist = Math.sqrt(dx*dx + dy*dy);

            if (dist < proj.speed) {
                // ชนชนเป้าหมาย!
                if (p && pathogens.includes(p)) {
                    p.hp -= proj.damage;
                    
                    // ป๊อปดาเมจ
                    damagePops.push({
                        x: p.x,
                        y: p.y - 12,
                        text: `-${proj.damage}`,
                        color: proj.type === 'bcell' ? '#c084fc' : '#ffffff',
                        vy: -1.8,
                        life: 0.6
                    });

                    // บีเซลล์: สโลว์เป้าหมาย
                    if (proj.type === 'bcell') {
                        p.slowTimer = CFG.TOWERS.bcell.slowDurationMs;
                        p.slowFactor = CFG.TOWERS.bcell.slowFactor;
                    }

                    // เพิ่มพาร์ทิเคิลชนกระจาย
                    for (let k = 0; k < 3; k++) {
                        particles.push({
                            x: p.x,
                            y: p.y,
                            vx: (localRand() - 0.5) * 3,
                            vy: (localRand() - 0.5) * 3,
                            color: proj.color,
                            size: 2.5 + localRand() * 2,
                            life: 1.0,
                            decay: 0.08
                        });
                    }

                    checkPathogensDeath();
                }
                projectiles.splice(i, 1);
            } else {
                // ขยับกระสุนพุ่งหาเป้า
                proj.x += (dx / dist) * proj.speed;
                proj.y += (dy / dist) * proj.speed;
            }
        }

        // ── อัปเดตพาร์ทิเคิล (Particles) ──
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            if (p.life <= 0) {
                particles.splice(i, 1);
            }
        }

        // ── อัปเดตแอนิเมชันดาเมจลอยหัว (Damage Pops) ──
        for (let i = damagePops.length - 1; i >= 0; i--) {
            const pop = damagePops[i];
            pop.y += pop.vy;
            pop.life -= 0.03;
            if (pop.life <= 0) {
                damagePops.splice(i, 1);
            }
        }

        // เช็คการผ่านด่านเวฟ
        checkWaveCompletion();
    }

    // ── ขั้นตอนวาดเรนเดอร์กราฟิก Canvas ──
    ctx.save();
    
    // เอฟเฟกต์หน้าจอสั่น (ถูกศัตรูเจาะ)
    if (screenShakeTimer > 0) {
        screenShakeTimer--;
        const sx = (localRand() - 0.5) * 8;
        const sy = (localRand() - 0.5) * 8;
        ctx.translate(sx, sy);
    }

    drawEnvironment();

    // 1. วาดมอนสเตอร์เชื้อโรค
    pathogens.forEach(p => {
        ctx.save();
        ctx.translate(p.x, p.y);
        
        // วงรัศมีสีใต้ตัวเชื้อโรค (ส่องแสง Glow)
        const glowRad = p.size;
        let cGlow = p.slowTimer > 0 ? '#38bdf8' : p.color; // แช่แข็งเปลี่ยนสีเรืองแสงฟ้า
        ctx.shadowColor = cGlow;
        ctx.shadowBlur = p.slowTimer > 0 ? 14 : 8;
        ctx.fillStyle = 'rgba(255,255,255,0.06)';
        ctx.beginPath();
        ctx.arc(0, 0, glowRad, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // วาดอิโมจิมอนสเตอร์ (Rhinovirus/Streptococcus/Parasite)
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.font = `${p.size * 2}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(p.emoji, 0, 0);
        ctx.restore();

        // หลอดเลือดสุขภาพเหนือหัว (Health Bar)
        const barW = p.size * 1.5;
        const barH = 4;
        const barX = p.x - barW / 2;
        const barY = p.y - p.size - 8;
        
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(barX, barY, barW, barH);
        
        const pct = Math.max(0, p.hp / p.maxHp);
        ctx.fillStyle = pct > 0.5 ? '#10b981' : (pct > 0.25 ? '#eab308' : '#ef4444');
        ctx.fillRect(barX, barY, barW * pct, barH);
    });

    // 2. วาดป้อมเม็ดเลือดขาว (Towers)
    towers.forEach(t => {
        ctx.save();
        ctx.translate(t.x, t.y);

        // เช็คสถานะวิตามินบัฟ
        let isBuffed = false;
        buffZones.forEach(zone => {
            if (getDistance(t.x, t.y, zone.x, zone.y) < 32) {
                isBuffed = true;
            }
        });

        // หากเป็นป้อมที่ผู้เล่นกดจิ้มค้างไว้ ให้วาดระยะการยิง (Range Circle)
        if (t === activeSelectedTower) {
            ctx.save();
            ctx.beginPath();
            const actualRange = isBuffed ? t.range * 1.25 : t.range;
            ctx.arc(0, 0, actualRange, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(16, 185, 129, 0.06)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(16, 185, 129, 0.25)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }

        // วงกลมส่องสว่างฐานป้อม
        ctx.shadowColor = t.color;
        ctx.shadowBlur = isBuffed ? 12 : 6;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.strokeStyle = t.color;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // วาดแกนปืนหมุนตามทิศทางหันหัว (Angle)
        ctx.rotate(t.angle);
        ctx.beginPath();
        ctx.moveTo(0, -4);
        ctx.lineTo(24, -4);
        ctx.lineTo(24, 4);
        ctx.lineTo(0, 4);
        ctx.fillStyle = '#64748b';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();
        
        ctx.restore();

        // สลักระดับอัพเกรด (Level Label)
        if (t.level > 1) {
            ctx.fillStyle = '#fbbf24';
            ctx.font = 'bold 10px Kanit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`★${t.level}`, t.x, t.y + 26);
        }

        // อัปเดตแอนิเมชันคลื่นแมคโครฟาจ (Devour Pulse)
        if (t.type === 'macrophage' && t.pulseRadius > 0) {
            t.pulseRadius += 3.5;
            const actualRange = isBuffed ? t.range * 1.25 : t.range;
            if (t.pulseRadius > actualRange) {
                t.pulseRadius = 0; // เคลียร์คลื่น
            } else {
                ctx.save();
                ctx.beginPath();
                ctx.arc(t.x, t.y, t.pulseRadius, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(96, 165, 250, ${1 - t.pulseRadius/actualRange})`;
                ctx.lineWidth = 3.5;
                ctx.stroke();
                ctx.restore();
            }
        }
    });

    // 3. วาดกระสุนยิง (Projectiles)
    projectiles.forEach(proj => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, proj.type === 'bcell' ? 3.5 : 3, 0, Math.PI * 2);
        ctx.fillStyle = proj.color;
        ctx.shadowColor = proj.color;
        ctx.shadowBlur = 6;
        ctx.fill();
        ctx.restore();
    });

    // 4. วาดพาร์ทิเคิล (Particles)
    particles.forEach(p => {
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();
    });

    // 5. วาดดาเมจป๊อปอัป (Damage Pops)
    damagePops.forEach(pop => {
        ctx.save();
        ctx.globalAlpha = pop.life;
        ctx.fillStyle = pop.color;
        ctx.font = 'bold 12px Kanit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pop.text, pop.x, pop.y);
        ctx.restore();
    });

    // 6. วาดการแสดงผลวางป้อมสร้างเงาขนาดยืนยัน (Placing Preview)
    if (isPlacingTower) {
        ctx.save();
        const spec = CFG.TOWERS[selectedTowerType];
        const valid = isPositionValidForTower(mouseX, mouseY) && (energy >= spec.cost);
        
        // วาดระยะ
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, spec.range, 0, Math.PI * 2);
        ctx.fillStyle = valid ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)';
        ctx.fill();
        ctx.strokeStyle = valid ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // วาดตัวฐานจำลอง
        ctx.beginPath();
        ctx.arc(mouseX, mouseY, 16, 0, Math.PI * 2);
        ctx.fillStyle = valid ? 'rgba(16, 185, 129, 0.25)' : 'rgba(239, 68, 68, 0.25)';
        ctx.fill();
        ctx.strokeStyle = valid ? '#10b981' : '#ef4444';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.restore();
    }

    // 7. วาดแอนิเมชันแฟลชกวาดล้างท่าไม้ตาย (Antibiotic Blast overlay)
    if (antibioticBombEffect > 0) {
        antibioticBombEffect -= 0.025;
        ctx.save();
        ctx.globalAlpha = antibioticBombEffect * 0.4;
        ctx.fillStyle = '#34d399';
        ctx.fillRect(0, 0, cw, ch);
        
        ctx.globalAlpha = antibioticBombEffect;
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px Kanit, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💊 ปฏิชีวนะล้างเชื้อโรค!', cw/2, ch/2);
        ctx.restore();
    }

    ctx.restore();

    requestAnimationFrame(loop);
}

// ── การตรวจจับพิกัดเมาส์ / จิ้มวางป้อม ──
canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    if (gamePaused || isGameOver) return;

    if (isPlacingTower) {
        // วางป้อมปืนลงช่องบอร์ด
        const spec = CFG.TOWERS[selectedTowerType];
        if (isPositionValidForTower(clickX, clickY)) {
            if (energy >= spec.cost) {
                addBioEnergy(-spec.cost);
                
                towers.push({
                    x: clickX,
                    y: clickY,
                    type: selectedTowerType,
                    level: 1,
                    damage: spec.damage,
                    range: spec.range,
                    fireRateMs: spec.fireRateMs,
                    color: spec.color,
                    bulletColor: spec.bulletColor,
                    angle: 0,
                    lastShotTime: 0,
                    pulseRadius: 0 // พิเศษเฉพาะแมคโครฟาจ
                });

                spawnChemicalBurst(clickX, clickY, spec.color);
                KAMPAI.sound.correct();
                
                // ออกสร้างเสร็จ เคลียร์ตัววางเว้นแต่กดชิฟต์ค้าง หรือปล่อยวางต่อเนื่อง
                isPlacingTower = false;
            } else {
                showToast('พลังงานชีวภาพไม่เพียงพอ!');
                KAMPAI.sound.wrong();
                isPlacingTower = false;
            }
        } else {
            // จุดวางทับตำแหน่งทางเดินหรือป้อมเดิม
            isPlacingTower = false;
        }
    } else {
        // โหมดคลิกสำรวจป้อมที่มีอยู่เพื่อเปิดเมนู Upgrade/Sell
        let clickedTower = null;
        for (const tw of towers) {
            if (getDistance(clickX, clickY, tw.x, tw.y) < 20) {
                clickedTower = tw;
                break;
            }
        }

        if (clickedTower) {
            openTowerActionMenu(clickedTower);
        } else {
            closeTowerActionMenu();
        }
    }
});
