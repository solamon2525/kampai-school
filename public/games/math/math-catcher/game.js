/* game.js — โลจิกหลักเกม คณิตคิดเร็วตกใส่ตะกร้า (Math Catcher) */

const CFG = window.GAME_CONFIG;
const DATA = window.GAME_DATA;

KAMPAI.setSlug(CFG.SLUG);
KAMPAI.sound.defaultBgm(CFG.BGM);

// ── ข้อมูลผู้เล่นและ Leaderboard ──
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

// ติดตั้งระบบควบคุมบนมือถือและปุ่มแผงเสียง
KAMPAI.controls.mount({ dpad: true, buttons: [] });
KAMPAI.sound.mountToggles();

// ── เชื่อมต่อโหมดออนไลน์ (KampaiMatch) ──
let match = null;
if (CFG.ENABLE_ONLINE && window.KampaiMatch) {
    match = KampaiMatch.create({
        duration: CFG.ONLINE_DURATION,
        title: 'แข่งคณิตคิดเร็วตกใส่ตะกร้า',
        onPlay: function ({ rng }) { startGame('online', rng); },
        onEnd:  function () { isGameOver = true; },
    });
    document.getElementById('online-btn').style.display = '';
}

function openOnline() { 
    if (match) match.openMenu(); 
}

// ── ระบบฟิสิกส์ การควบคุม และสเตตภายในเกม ──
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let cw = 0, ch = 0;

function resize() { 
    cw = canvas.width = window.innerWidth; 
    ch = canvas.height = window.innerHeight; 
}
resize();
window.addEventListener('resize', resize);

const $ = (id) => document.getElementById(id);

// ตัวแปรระบบเกม
let mode = 'adventure';
let score = 0;
let lives = CFG.LIVES;
let level = 1;
let combo = 0;
let caught = 0;
let isGameOver = false;
let started = false;
let items = [];
let basketX = 0;
let dragX = null;
let lastSpawnTime = 0;
let lastLevelUpTime = 0;
let timeLeft = CFG.TIME_SECONDS;
let timerIntervalId = null;
let localRand = Math.random; // ใช้สุ่มภายในห้องออนไลน์หรือสุ่มอิสระ

// ระบบโจทย์คณิตศาสตร์
let activeQuestion = {
    displayStr: 'โจทย์คณิตศาสตร์',
    correctAnswer: 0,
    speakText: ''
};
let lastCorrectSpawnTime = 0;

// พลังพิเศษ (Power-ups) สถานะ
let freezeTimer = 0;   // หน่วย ms
let magnetTimer = 0;   // หน่วย ms
let feverTimer = 0;    // หน่วย ms
let shieldActive = false;

// เอฟเฟกต์ตกแต่ง
let fireParticles = [];
let starParticles = [];
let basketPopScale = 1;

// ── ฟังก์ชันออกเสียงโจทย์ ──
function speakActiveQuestion() {
    if (!activeQuestion || !activeQuestion.speakText) return;
    try {
        KAMPAI.sound.stopSpeak();
        // ดีเลย์เล็กน้อยเพื่อให้จังหวะการเปลี่ยนข้อลื่นไหล
        setTimeout(() => {
            if (!isGameOver && started) {
                KAMPAI.sound.speak(activeQuestion.speakText, 'th-TH');
            }
        }, 150);
    } catch (e) {
        console.error("Speech error:", e);
    }
}

// ── ฟังก์ชันคำนวณคอมโบ ──
function getComboMultiplier() {
    let mult = 1 + Math.floor(combo / CFG.COMBO_STEP);
    return Math.min(CFG.COMBO_MAX, feverTimer > 0 ? mult * 2 : mult);
}

function updateScoreUI(amount) {
    score = Math.max(0, amount);
    $('score-value').innerText = score;
    const sc = $('score-container');
    sc.classList.add('pop');
    setTimeout(() => sc.classList.remove('pop'), 150);
}

function updateLivesUI(amount) {
    lives = Math.max(0, amount);
    let hearts = '';
    for (let i = 0; i < CFG.LIVES; i++) {
        hearts += (i < lives) ? '❤️' : '🖤';
    }
    $('life-container').innerText = hearts;
    if (lives <= 0 && mode === 'adventure') {
        endGame();
    }
}

function updateComboUI() {
    const badge = $('combo-badge');
    let mult = getComboMultiplier();
    let feverBonus = feverTimer > 0 ? ' ✨FEVER x2✨' : '';
    badge.innerText = combo > 0 ? `🔥 คอมโบ x${mult}${feverBonus} (${combo})` : (feverTimer > 0 ? `✨ FEVER x2 ✨` : '');
    badge.classList.add('bump');
    setTimeout(() => badge.classList.remove('bump'), 120);
}

function updatePowerupsUI(dt) {
    // อัปเดตตัวเลขวิเศษของพลังงาน
    if (freezeTimer > 0) {
        freezeTimer = Math.max(0, freezeTimer - dt);
        $('pw-freeze').classList.remove('hidden');
        $('pw-freeze').querySelector('span').innerText = (freezeTimer / 1000).toFixed(1);
    } else {
        $('pw-freeze').classList.add('hidden');
    }

    if (shieldActive) {
        $('pw-shield').classList.remove('hidden');
    } else {
        $('pw-shield').classList.add('hidden');
    }

    if (magnetTimer > 0) {
        magnetTimer = Math.max(0, magnetTimer - dt);
        $('pw-magnet').classList.remove('hidden');
        $('pw-magnet').querySelector('span').innerText = (magnetTimer / 1000).toFixed(1);
    } else {
        $('pw-magnet').classList.add('hidden');
    }

    if (feverTimer > 0) {
        feverTimer = Math.max(0, feverTimer - dt);
        $('pw-fever').classList.remove('hidden');
        $('pw-fever').querySelector('span').innerText = (feverTimer / 1000).toFixed(1);
    } else {
        $('pw-fever').classList.add('hidden');
    }
}

// ── เอฟเฟกต์ [JUICE] ──
function spawnBurstParticles(x, y, color) {
    for (let i = 0; i < 12; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const angle = (Math.PI * 2 / 12) * i;
        const dist = 35 + localRand() * 45;
        const size = 5 + localRand() * 6;
        p.style.cssText = `
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            background: ${color};
            --dx: ${Math.round(Math.cos(angle) * dist)}px;
            --dy: ${Math.round(Math.sin(angle) * dist)}px;
        `;
        document.body.appendChild(p);
        p.addEventListener('animationend', () => p.remove());
    }
}

function spawnScorePopup(x, y, text, color) {
    const popup = document.createElement('div');
    popup.className = 'score-pop';
    popup.textContent = text;
    popup.style.cssText = `
        left: ${x}px;
        top: ${y}px;
        color: ${color};
        font-size: ${22 + getComboMultiplier() * 2}px;
    `;
    document.body.appendChild(popup);
    popup.addEventListener('animationend', () => popup.remove());
}

function shakeScreen() {
    document.body.classList.remove('shake');
    void document.body.offsetWidth; // Trigger reflow
    document.body.classList.add('shake');
}

function showToast(text) {
    const t = $('toast');
    t.textContent = text;
    t.classList.remove('show');
    void t.offsetWidth;
    t.classList.add('show');
}

// ── การสร้างโจทย์คณิตศาสตร์ (Math Question Generator) ──
function generateQuestion() {
    // เลือก Specification ของเลเวลปัจจุบัน (สูงสุดเลเวล 6)
    const specKey = Math.min(6, level);
    const spec = DATA.LEVEL_SPECS[specKey];
    
    // สุ่มรูปแบบตัวคูณตัวดำเนินงานและเทมเพลต
    const op = spec.ops[Math.floor(localRand() * spec.ops.length)];
    const template = spec.templates[Math.floor(localRand() * spec.templates.length)];
    
    let a = 0, b = 0, c = 0;
    let speakOp = '';

    if (op === '+') {
        speakOp = 'บวก';
        // A + B = C
        a = 1 + Math.floor(localRand() * (spec.maxVal / 2));
        b = 1 + Math.floor(localRand() * (spec.maxVal / 2));
        c = a + b;
    } else if (op === '-') {
        speakOp = 'ลบ';
        // A - B = C
        c = 1 + Math.floor(localRand() * (spec.maxVal / 2));
        b = 1 + Math.floor(localRand() * (spec.maxVal / 2));
        a = c + b; // ประกันให้คำตอบไม่ติดลบ
    } else if (op === 'x') {
        speakOp = 'คูณ';
        // A x B = C
        a = 2 + Math.floor(localRand() * 8); // แม่ 2-9
        b = 1 + Math.floor(localRand() * 9); // 1-9
        c = a * b;
    } else if (op === '/') {
        speakOp = 'หารด้วย';
        // A / B = C (หรือ C x B = A)
        c = 1 + Math.floor(localRand() * 9);
        b = 2 + Math.floor(localRand() * 8); // หารด้วย 2-9
        a = c * b; // ประกันให้หารลงตัวเสมอ
    }

    let formula = '';
    let correctAnswer = 0;
    let speakText = '';

    // สร้างตามเทมเพลตที่เลือก
    if (template === 'A + B = ?' || template === 'A - B = ?' || template === 'A x B = ?' || template === 'A / B = ?') {
        formula = `${a} ${op} ${b} = ?`;
        correctAnswer = c;
        speakText = `${a} ${speakOp} ${b} เท่ากับเท่าไร`;
    } else if (template === 'A + ? = C' || template === 'A - ? = C' || template === 'A x ? = C' || template === 'A / ? = C') {
        formula = `${a} ${op} ? = ${c}`;
        correctAnswer = b;
        speakText = `${a} ${speakOp} อะไร เท่ากับ ${c}`;
    } else if (template === '? + B = C' || template === '? - B = C' || template === '? x B = C') {
        formula = `? ${op} ${b} = ${c}`;
        correctAnswer = a;
        speakText = `อะไร ${speakOp} ${b} เท่ากับ ${c}`;
    } else {
        // Fallback
        formula = `${a} ${op} ${b} = ?`;
        correctAnswer = c;
        speakText = `${a} ${speakOp} ${b} เท่ากับเท่าไร`;
    }

    activeQuestion = {
        displayStr: formula,
        correctAnswer: correctAnswer,
        speakText: speakText
    };

    $('question-text').innerText = formula;
    speakActiveQuestion();
    
    // เคลียร์ประวัติสปอว์นเลขถูก
    lastCorrectSpawnTime = Date.now();
}

// ── ระบบการสร้างวัตถุตกลงมา (Spawning) ──
function spawnItem() {
    const roll = localRand();
    let kind = 'wrong_number';
    let value = '';
    let color = '#38bdf8'; // สีฟ้าปกติสำหรับคำตอบที่ผิด

    // เช็คกรณีบังคับเกิดค่าคำตอบที่ถูกต้อง (ป้องกันรอนานเกินไป)
    const activeCorrectCount = items.filter(it => it.kind === 'good').length;
    const timeSinceLastCorrect = Date.now() - lastCorrectSpawnTime;
    let forceCorrect = (activeCorrectCount === 0 && timeSinceLastCorrect > 4000);

    if (forceCorrect) {
        kind = 'good';
        value = activeQuestion.correctAnswer;
        color = '#fbbf24'; // สีทองสำหรับเลขที่ถูกต้อง
    } else if (roll < CFG.BAD_CHANCE) {
        kind = 'bad';
        value = DATA.BOMB;
    } else if (roll < CFG.BAD_CHANCE + CFG.ITEM_CHANCE) {
        // สุ่มไอเทมช่วยเหลือพิเศษ
        const itemsList = ['freeze', 'shield', 'magnet', 'fever'];
        kind = itemsList[Math.floor(localRand() * itemsList.length)];
        if (kind === 'freeze') value = DATA.FREEZE;
        else if (kind === 'shield') value = DATA.SHIELD;
        else if (kind === 'magnet') value = DATA.MAGNET;
        else if (kind === 'fever') value = DATA.FEVER;
    } else {
        // อัตราส่วนสุ่มเป็นตัวเลข (ถูก 35%, ผิด 65%)
        const numberRoll = localRand();
        if (numberRoll < 0.35 && activeCorrectCount < 2) {
            kind = 'good';
            value = activeQuestion.correctAnswer;
            color = '#fbbf24';
            lastCorrectSpawnTime = Date.now();
        } else {
            kind = 'wrong_number';
            // สุ่มเลขผิดที่มีค่าใกล้เคียงกับคำตอบที่ถูก (+- 1 ถึง 6)
            let offset = Math.floor(localRand() * 6) + 1;
            if (localRand() < 0.5) offset = -offset;
            value = activeQuestion.correctAnswer + offset;
            
            // ป้องกันเกิดค่าชนคำตอบที่ถูก หรือต่ำกว่าศูนย์
            if (value === activeQuestion.correctAnswer) value += 1;
            if (value < 0) value = Math.abs(value) + 1;
            color = '#38bdf8';
        }
    }

    // ความเร็วการร่วงตามเลเวลและสถานะสโลว์โมชั่น
    let fallSpeed = CFG.FALL_START + (level - 1) * CFG.SPEED_RAMP;
    
    items.push({
        x: 40 + localRand() * (cw - 80),
        y: -30,
        vy: fallSpeed + localRand() * 0.8,
        kind: kind,
        val: value,
        color: color,
        rot: 0,
        vr: (localRand() - 0.5) * 0.15,
        popScale: 1
    });
}

// ── ระบบการชนและการรับวัตถุ ──
function handleItemCatch(it) {
    const x = it.x;
    const y = ch - 65;

    // 1. กรณีเก็บระเบิด
    if (it.kind === 'bad') {
        if (shieldActive) {
            shieldActive = false; // เกราะแตก
            spawnBurstParticles(x, y, '#34d399');
            spawnScorePopup(x, y - 10, '🛡️ ปลอดภัย!', '#34d399');
            KAMPAI.sound.correct();
        } else {
            combo = 0;
            updateComboUI();
            shakeScreen();
            KAMPAI.sound.wrong();
            KAMPAI.sound.fxFlash(false);
            spawnScorePopup(x, y, '💥 ระเบิด!', '#f87171');
            
            if (mode === 'adventure') {
                updateLivesUI(lives - 1);
            } else {
                updateScoreUI(score - CFG.GOOD_POINTS); // โหมดเวลา: หักคะแนน
            }
        }
        return;
    }

    // 2. ไอเทมแช่แข็ง (Freeze)
    if (it.kind === 'freeze') {
        freezeTimer = CFG.FREEZE_DURATION_MS;
        spawnBurstParticles(x, y, '#38bdf8');
        spawnScorePopup(x, y, '❄️ สโลว์โมชั่น!', '#38bdf8');
        KAMPAI.sound.correct();
        updateScoreUI(score + CFG.BONUS_POINTS * getComboMultiplier());
        return;
    }

    // 3. ไอเทมโล่ป้องกัน (Shield)
    if (it.kind === 'shield') {
        shieldActive = true;
        spawnBurstParticles(x, y, '#34d399');
        spawnScorePopup(x, y, '🛡️ เกราะป้องกัน!', '#34d399');
        KAMPAI.sound.correct();
        updateScoreUI(score + CFG.BONUS_POINTS * getComboMultiplier());
        return;
    }

    // 4. ไอเทมแม่เหล็กดูดเลขถูก (Magnet)
    if (it.kind === 'magnet') {
        magnetTimer = CFG.MAGNET_DURATION_MS;
        spawnBurstParticles(x, y, '#a78bfa');
        spawnScorePopup(x, y, '🧲 แม่เหล็กดูดเลขถูก!', '#a78bfa');
        KAMPAI.sound.correct();
        updateScoreUI(score + CFG.BONUS_POINTS * getComboMultiplier());
        return;
    }

    // 5. ไอเทมฟีเวอร์ (Fever Gem)
    if (it.kind === 'fever') {
        feverTimer = CFG.FEVER_DURATION_MS;
        spawnBurstParticles(x, y, '#fb7185');
        spawnScorePopup(x, y, '✨ โหมดฟีเวอร์คูณสอง!', '#fb7185');
        KAMPAI.sound.correct();
        updateScoreUI(score + CFG.BONUS_POINTS * getComboMultiplier());
        return;
    }

    // 6. กรณีตัวเลขคำตอบ
    if (it.kind === 'good') {
        const mult = getComboMultiplier();
        const base = feverTimer > 0 ? CFG.GOOD_POINTS * 2 : CFG.GOOD_POINTS;
        const gain = base * mult;
        
        combo++;
        caught++;
        updateScoreUI(score + gain);
        
        // เช็คการเข้าฟีเวอร์ผ่านแต้มคอมโบ
        if (combo > 0 && combo % CFG.FEVER_COMBO_TRIGGER === 0) {
            feverTimer = CFG.FEVER_DURATION_MS;
            showToast('✨ ฟีเวอร์โหมด! ✨');
        }

        updateComboUI();
        spawnBurstParticles(x, y, '#fbbf24');
        spawnScorePopup(x, y, `+${gain}`, '#fbbf24');
        KAMPAI.sound.correct();
        KAMPAI.sound.fxFlash(true);
        basketPopScale = 1.3;

        // สปอว์นดาวสวยๆ ลอยตกสะสม
        for (let i = 0; i < 4; i++) {
            starParticles.push({
                x: x + (localRand() - 0.5) * 30,
                y: y - localRand() * 20,
                vx: (localRand() - 0.5) * 4,
                vy: -3 - localRand() * 5,
                color: '#fbbf24',
                size: 8 + localRand() * 8,
                rot: localRand() * Math.PI,
                vr: (localRand() - 0.5) * 0.1
            });
        }

        // ออนไลน์: รายงานผล
        if (mode === 'online' && match) {
            match.report(score, { correct: caught });
        }

        // เคลียร์ตัวเลขตกค้างบนจอ เพื่อเข้าสู่โจทย์ข้อถัดไปแบบเคลียร์ๆ
        items = items.filter(item => item.kind !== 'good' && item.kind !== 'wrong_number');

        // สุ่มโจทย์ใหม่ทันที
        generateQuestion();

    } else if (it.kind === 'wrong_number') {
        if (shieldActive) {
            shieldActive = false; // โล่แตกช่วยไว้
            spawnBurstParticles(x, y, '#34d399');
            spawnScorePopup(x, y - 10, '🛡️ เกราะกันพลาด!', '#34d399');
            KAMPAI.sound.correct();
        } else {
            combo = 0;
            updateComboUI();
            shakeScreen();
            KAMPAI.sound.wrong();
            KAMPAI.sound.fxFlash(false);
            spawnScorePopup(x, y, '❌ ผิด!', '#ef4444');

            if (mode === 'adventure') {
                updateLivesUI(lives - 1);
            } else {
                updateScoreUI(score - Math.floor(CFG.GOOD_POINTS / 2)); // แข่งเวลา/ออนไลน์: หักคะแนน
            }

            // สุ่มโจทย์ใหม่เช่นกันเพื่อไม่ให้เด็กติดอยู่กับข้อที่สับสน
            items = items.filter(item => item.kind !== 'good' && item.kind !== 'wrong_number');
            generateQuestion();
        }
    }
}

// ── ฟังก์ชันเริ่มเกม (Start Game) ──
function startGame(m, rng) {
    if (started && m !== 'online' && mode !== 'online') return;
    
    mode = m || 'adventure';
    started = true;
    isGameOver = false;
    
    // ตั้งตัวสุ่ม RNG สำหรับห้องออนไลน์
    localRand = rng || Math.random;
    
    score = 0;
    lives = CFG.LIVES;
    level = 1;
    combo = 0;
    caught = 0;
    items = [];
    fireParticles = [];
    starParticles = [];
    basketX = cw / 2;
    dragX = null;
    
    // เคลียร์พลังพิเศษ
    freezeTimer = 0;
    magnetTimer = 0;
    feverTimer = 0;
    shieldActive = false;

    lastSpawnTime = 0;
    lastLevelUpTime = performance.now();
    timeLeft = CFG.TIME_SECONDS;

    updateScoreUI(0);
    updateComboUI();

    $('level-badge').innerText = 'เลเวล 1';
    $('player-chip').style.display = KAMPAI.student ? 'flex' : 'none';
    $('blocker').style.display = 'none';

    // จัดวางโหมดแสดงผลของ HUD
    if (mode === 'adventure') {
        $('life-container').style.display = 'block';
        updateLivesUI(CFG.LIVES);
        $('timer-container').style.display = 'none';
    } else if (mode === 'time') {
        $('life-container').style.display = 'none';
        $('timer-container').style.display = 'block';
        $('timer-value').innerText = CFG.TIME_SECONDS;
        if (timerIntervalId) clearInterval(timerIntervalId);
        timerIntervalId = setInterval(tickTimer, 1000);
    } else { // โหมดออนไลน์ (เฟรมเวิร์กจัดการระบบคุมเวลาเอง)
        $('life-container').style.display = 'none';
        $('timer-container').style.display = 'none';
    }

    // สร้างคำถามแรก
    generateQuestion();

    // เริ่มเล่นเพลง
    KAMPAI.sound.unlock();
    KAMPAI.sound.bgmStart();

    requestAnimationFrame(loop);
}

function tickTimer() {
    if (document.hidden) return; // ไม่หักเวลาเมื่อพักหน้าจอ
    timeLeft--;
    $('timer-value').innerText = timeLeft;
    $('timer-container').classList.toggle('low', timeLeft <= 10);
    
    if (timeLeft <= 10) {
        KAMPAI.sound.timeUp();
    }
    
    if (timeLeft <= 0) {
        endGame();
    }
}

// ── ฟังก์ชันวาดเอฟเฟกต์ไฟ (Combo Fire Particles) ──
function updateAndDrawFire(ctx, bx, by) {
    if (combo < 5) return;
    
    // สร้างอนุภาคไฟใหม่ลอยชี้ขึ้นจากใต้ตะกร้า
    const count = Math.min(4, Math.floor(combo / 2));
    for (let i = 0; i < count; i++) {
        fireParticles.push({
            x: bx + (localRand() - 0.5) * 70,
            y: by + 12,
            vx: (localRand() - 0.5) * 1.5,
            vy: -1.5 - localRand() * 3,
            size: 6 + localRand() * 12,
            life: 1.0,
            decay: 0.03 + localRand() * 0.04,
            color: localRand() < 0.4 ? '#ef4444' : (localRand() < 0.7 ? '#f97316' : '#eab308') // แดง ส้ม เหลือง
        });
    }

    // วาดอนุภาค
    for (let i = fireParticles.length - 1; i >= 0; i--) {
        const fp = fireParticles[i];
        fp.x += fp.vx;
        fp.y += fp.vy;
        fp.life -= fp.decay;
        
        if (fp.life <= 0) {
            fireParticles.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = fp.life;
        ctx.beginPath();
        ctx.arc(fp.x, fp.y, fp.size * fp.life, 0, Math.PI * 2);
        ctx.fillStyle = fp.color;
        // ทำ Glow ด้วย Shadow
        ctx.shadowColor = fp.color;
        ctx.shadowBlur = fp.size * fp.life;
        ctx.fill();
        ctx.restore();
    }
}

// ── ฟังก์ชันวาดดาวสะสมสวยงาม (Star Particles) ──
function updateAndDrawStars(ctx) {
    for (let i = starParticles.length - 1; i >= 0; i--) {
        const sp = starParticles[i];
        sp.x += sp.vx;
        sp.y += sp.vy;
        sp.vy += 0.25; // gravity
        sp.rot += sp.vr;
        sp.size *= 0.96; // หดลงเรื่อยๆ

        if (sp.size < 2) {
            starParticles.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.rotate(sp.rot);
        ctx.font = `${sp.size}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('⭐', 0, 0);
        ctx.restore();
    }
}

// ── ฟังก์ชันวาดลูกบอลตัวเลขสไตล์กระจกเงา (Glass Bubble Drawing) ──
function drawBubble(ctx, x, y, text, color, scale = 1) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // 1. เงาสะท้อนข้างใต้ลูกบอล
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 6;

    // 2. เติมวงกลมสีสันไล่เฉด (Radial Gradient)
    const radGrad = ctx.createRadialGradient(-6, -6, 2, 0, 0, 26);
    radGrad.addColorStop(0, '#ffffff');
    radGrad.addColorStop(0.2, color);
    radGrad.addColorStop(1, '#020617');

    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fillStyle = radGrad;
    ctx.fill();

    // 3. ขอบสว่างแก้วใส
    ctx.shadowColor = 'transparent'; // เคลียร์เงาเพื่อไม่ให้ฟุ้ง
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 4. จุดแสงวิบวับสะท้อน (Gloss Highlight)
    ctx.beginPath();
    ctx.arc(-8, -8, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.fill();

    // 5. ตัวหนังสือตัวเลขด้านใน
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Kanit, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // เงาดำรอบฟอนต์ให้อ่านง่าย
    ctx.shadowColor = 'rgba(0,0,0,0.8)';
    ctx.shadowBlur = 3;
    ctx.fillText(text, 0, 1.5);

    ctx.restore();
}

// ── เกมลูปหลัก (Main Loop) ──
let lastTime = 0;

function loop(timestamp) {
    if (isGameOver) return;

    if (!lastTime) lastTime = timestamp;
    const dt = timestamp - lastTime;
    lastTime = timestamp;

    // 1. อัปเดตบาร์พลังและดีบัฟสะสม
    updatePowerupsUI(dt);

    // 2. ควบคุมและเลื่อนตำแหน่งตะกร้า
    let currentSpeed = CFG.SPEED;
    if (freezeTimer > 0) currentSpeed *= 0.5; // แช่แข็ง สโลว์ตะกร้าเล็กน้อยกันลื่น

    if (KAMPAI.input.left)  basketX -= currentSpeed;
    if (KAMPAI.input.right) basketX += currentSpeed;
    if (dragX !== null) {
        basketX += (dragX - basketX) * 0.35; // สัมผัสลากลื่นแบบ LERP
    }
    basketX = Math.max(45, Math.min(cw - 45, basketX));

    // 3. ปรับระดับเลเวลความยากตามเวลา
    if (mode !== 'online') {
        if (timestamp - lastLevelUpTime > CFG.LEVEL_EVERY_MS) {
            level++;
            lastLevelUpTime = timestamp;
            $('level-badge').innerText = 'เลเวล ' + level;
            showToast(`⚡ เลเวล ${level}! ⚡`);
            
            // อ่านออกเสียงทักทายเมื่อขึ้นเลเวลใหม่
            try {
                KAMPAI.sound.speak(`เลเวล ${level}`, 'th-TH');
            } catch (_) {}
        }
    }

    // 4. สปอว์นวัตถุตามจังหวะเวลา
    let spawnInterval = Math.max(CFG.SPAWN_MIN_MS, CFG.SPAWN_START_MS - (level - 1) * CFG.SPAWN_RAMP_MS);
    if (freezeTimer > 0) spawnInterval *= 2.0; // แช่แข็งลดความถี่การปล่อย

    if (timestamp - lastSpawnTime > spawnInterval) {
        lastSpawnTime = timestamp;
        spawnItem();
    }

    // 5. เคลียร์จอ Canvas และลงสีพื้นหลังแบบไล่เฉดไดนามิก (Theme Gradient)
    ctx.clearRect(0, 0, cw, ch);
    const bgGrad = ctx.createLinearGradient(0, 0, 0, ch);
    
    // ตั้งค่าตามระดับความยากเลเวล
    if (level <= 2) {
        // Emerald Forest (เขียวอ่อนธรรมชาติ)
        bgGrad.addColorStop(0, '#022c22');
        bgGrad.addColorStop(0.6, '#064e3b');
        bgGrad.addColorStop(1, '#020617');
    } else if (level <= 4) {
        // Ocean Depth (น้ำเงินแปซิฟิก)
        bgGrad.addColorStop(0, '#172554');
        bgGrad.addColorStop(0.6, '#1e3a8a');
        bgGrad.addColorStop(1, '#020617');
    } else {
        // Cosmic Nebula (ม่วงเทห์ดาราศาสตร์)
        bgGrad.addColorStop(0, '#2e1065');
        bgGrad.addColorStop(0.6, '#4c1d95');
        bgGrad.addColorStop(1, '#020617');
    }
    
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, cw, ch);

    // วาดอนุภาคดวงดาวฉากหลังแผ่วเบา
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for (let i = 0; i < 20; i++) {
        let starX = (Math.sin(timestamp * 0.0002 + i * 500) * 0.5 + 0.5) * cw;
        let starY = ((timestamp * 0.03 + i * 100) % ch);
        ctx.fillRect(starX, starY, 3, 3);
    }

    const basketY = ch - 65;

    // 6. อัปเดตและวาดวัตถุตกแต่ง
    updateAndDrawFire(ctx, basketX, basketY);
    updateAndDrawStars(ctx);

    // 7. อัปเดตและวาดวัตถุร่วงหล่นบนบอร์ด
    for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i];
        
        // ฟิสิกส์การตก: สโลว์โมชั่นแช่แข็งลดความเร็วร่วงลง 50%
        let currentVy = it.vy;
        if (freezeTimer > 0) currentVy *= 0.5;
        it.y += currentVy;
        it.rot += it.vr;

        // ฟีเจอร์: 🧲 แม่เหล็กดึงดูดเลขที่ถูกต้อง
        if (magnetTimer > 0 && it.kind === 'good') {
            const dx = basketX - it.x;
            const dy = basketY - it.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < CFG.MAGNET_RADIUS) {
                // เพิ่มความเร็วหักเหพุ่งเข้าหาตะกร้า
                it.x += (dx / dist) * 6;
                // ถ้าแม่เหล็กดึงดูดแรงพอ บังคับให้พุ่งลงหาความสูงตะกร้าด้วย
                if (dy > 0) it.y += (dy / dist) * 2;
            }
        }

        // วาดวัตถุ
        if (it.kind === 'good' || it.kind === 'wrong_number') {
            drawBubble(ctx, it.x, it.y, it.val, it.color, it.popScale);
        } else {
            // Emojis (ระเบิด, Freeze, Shield, Magnet, Fever)
            ctx.save();
            ctx.translate(it.x, it.y);
            ctx.rotate(it.rot);
            
            // เอฟเฟกต์เงา
            ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetY = 4;

            ctx.font = '36px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(it.val, 0, 0);
            ctx.restore();
        }

        // เช็คการรับด้วยตะกร้า
        const collWidth = 60;
        const collHeight = 25;
        
        if (it.y > basketY - 25 && it.y < basketY + 20 && Math.abs(it.x - basketX) < collWidth) {
            handleItemCatch(it);
            items.splice(i, 1);
        } 
        // ร่วงหลุดจอ
        else if (it.y > ch + 40) {
            items.splice(i, 1);
            // พลาดเลขถูก = รีเซ็ตคอมโบ (ยกเว้นในช่วงฟีเวอร์คุมพิเศษ หรือมีเกราะอยู่)
            if (it.kind === 'good' && feverTimer <= 0) {
                combo = 0;
                updateComboUI();
            }
        }
    }

    // 8. วาดตะกร้าผู้เล่นพร้อม squash-pop และเกราะป้องกันสะท้อนแสง
    basketPopScale += (1 - basketPopScale) * 0.2; // ลื่นไหลคืนตัว
    const scaleX = 1 + (basketPopScale - 1);
    const scaleY = 1 - (basketPopScale - 1) * 0.6;

    ctx.save();
    ctx.translate(basketX, basketY + 8);
    ctx.scale(scaleX, scaleY);
    
    // วาดไอคอนตะกร้า
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 3;
    ctx.font = '54px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(DATA.BASKET, 0, 10);
    ctx.restore();

    // วาดรัศมีเกราะกำบัง 🛡️
    if (shieldActive) {
        ctx.save();
        ctx.translate(basketX, basketY + 12);
        // สร้างเกราะเปล่งประกายสีเขียวใส
        const shieldGrad = ctx.createRadialGradient(0, 0, 20, 0, 0, 52);
        shieldGrad.addColorStop(0, 'rgba(52, 211, 153, 0.05)');
        shieldGrad.addColorStop(0.8, 'rgba(52, 211, 153, 0.25)');
        shieldGrad.addColorStop(1, 'rgba(52, 211, 153, 0.65)');

        ctx.beginPath();
        ctx.arc(0, 0, 50, 0, Math.PI * 2);
        ctx.fillStyle = shieldGrad;
        ctx.fill();

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2.5;
        // ทำเส้นประวงนอกให้ดูหมุนๆ ไดนามิก
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = timestamp * 0.05;
        ctx.stroke();
        ctx.restore();
    }

    // วาดกระแสดึงดูดแม่เหล็ก 🧲 (ถ้ามีไอเทมใช้งาน)
    if (magnetTimer > 0) {
        ctx.save();
        ctx.translate(basketX, basketY + 12);
        ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        // วาดคลื่นดูด 2 ชั้นขยายออก
        let r1 = (timestamp * 0.05) % CFG.MAGNET_RADIUS;
        let r2 = ((timestamp * 0.05) + CFG.MAGNET_RADIUS/2) % CFG.MAGNET_RADIUS;
        
        ctx.arc(0, 0, r1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(0, 0, r2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    requestAnimationFrame(loop);
}

// ── จบเกม (Game Over) ──
function endGame() {
    if (isGameOver) return;
    isGameOver = true;

    if (timerIntervalId) { 
        clearInterval(timerIntervalId); 
        timerIntervalId = null; 
    }
    
    KAMPAI.sound.bgmStop(); 
    KAMPAI.sound.gameOver();
    KAMPAI.sound.stopSpeak();

    const stars = CFG.STAR_THRESHOLDS.filter((t) => score >= t).length;
    
    // ส่งข้อมูลคะแนนคืนระบบ (แบบออฟไลน์)
    KAMPAI.submitScore(score, { 
        mode: 'normal', 
        stars: stars, 
        caught: caught, 
        level: level 
    });

    $('go-stars').innerText = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    $('final-score').innerText = score;
    $('go-summary').innerText = `ตอบถูก ${caught} ข้อ · ถึงเลเวล ${level} · โหมด${mode === 'time' ? 'แข่งเวลา' : 'ผจญภัย'}`;
    $('gameover-screen').style.display = 'flex';
    
    renderLeaderboard('score-list-gameover');
}

// ── ลงทะเบียนควบคุมด้วยการลากและสัมผัส ──
canvas.addEventListener('pointerdown', (e) => { 
    dragX = e.clientX; 
});
canvas.addEventListener('pointermove', (e) => { 
    if (dragX !== null) dragX = e.clientX; 
});
window.addEventListener('pointerup', () => { 
    dragX = null; 
});
