/* game.js — โลจิกควบคุมหลักเกม Grammar Space Ranger (Space Shooter) */

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

// ติดตั้งระบบควบคุม D-pad และแผงเสียง
KAMPAI.controls.mount({ dpad: true, buttons: [] });
KAMPAI.sound.mountToggles();

// ── เชื่อมต่อโหมดออนไลน์ (KampaiMatch) ──
let match = null;
if (CFG.ENABLE_ONLINE && window.KampaiMatch) {
    match = KampaiMatch.create({
        duration: CFG.ONLINE_DURATION,
        title: 'แข่งยานยิงไวยากรณ์อวกาศ',
        onPlay: function ({ rng }) { startGame('online', rng); },
        onEnd:  function () { isGameOver = true; },
    });
    document.getElementById('online-btn').style.display = '';
}

function openOnline() { 
    if (match) match.openMenu(); 
}

// ── โลจิก Canvas และระบบเกมเพลย์ ──
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

// สเตตหลักของเกม
let mode = 'adventure';
let score = 0;
let shields = CFG.MAX_SHIELDS;
let level = 1;
let combo = 0;
let caught = 0; // ยิงคำศัพท์ถูกต้องสะสม
let correctInCurrentTarget = 0; // จำนวนคำถูกในหมวดปัจจุบัน
let isGameOver = false;
let started = false;
let localRand = Math.random;

// ทิศทางอวกาศและพิกัดผู้เล่น
let shipX = 0;
let shipY = 0;
let dragX = null;
let lastFireTime = 0;

// อิลลัสเตเตอร์ฉากอวกาศ (Background Stars Parallax)
let starsFar = [];
let starsClose = [];

// คอนเทนเนอร์บนจอ
let enemies = [];      // ศัตรูคำศัพท์และอุกกาบาต
let lasers = [];       // กระสุนผู้เล่น
let particles = [];    // เอฟเฟกต์ระเบิด
let floatTexts = [];   // ข้อความคะแนนลอยตัว

// สถานะบัฟพลังงานไอเทม
let spreadTimer = 0;   // ปืนกระจาย
let slowTimer = 0;     // แช่แข็งลดความเร็ว
let feverTimer = 0;    // คะแนน x2

// ระบบไวยากรณ์เป้าหมาย
const grammarCategories = ['nouns', 'verbs', 'adjectives', 'adverbs'];
let activeCategory = 'nouns'; // หมวดเป้าหมายหลัก

// ── ตั้งพารามิเตอร์ดนตรีอวกาศ ──
function initStars() {
    starsFar = [];
    starsClose = [];
    for (let i = 0; i < 30; i++) {
        starsFar.push({ x: localRand() * cw, y: localRand() * ch, size: 1 + localRand() * 1.5, vy: 0.6 + localRand() * 0.4 });
    }
    for (let i = 0; i < 15; i++) {
        starsClose.push({ x: localRand() * cw, y: localRand() * ch, size: 2.5 + localRand() * 2, vy: 1.8 + localRand() * 0.8 });
    }
}

// ── ฟังก์ชันคำนวณตัวคูณคอมโบ ──
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

function updateShieldsUI(amount) {
    shields = Math.max(0, amount);
    $('shield-value').innerText = shields;
    const sc = $('shield-container');
    sc.classList.add('pop');
    setTimeout(() => sc.classList.remove('pop'), 150);
    
    if (shields <= 0 && mode === 'adventure') {
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
    if (spreadTimer > 0) {
        spreadTimer = Math.max(0, spreadTimer - dt);
        $('pw-spread').classList.remove('hidden');
        $('pw-spread').querySelector('span').innerText = (spreadTimer / 1000).toFixed(1);
    } else {
        $('pw-spread').classList.add('hidden');
    }

    if (slowTimer > 0) {
        slowTimer = Math.max(0, slowTimer - dt);
        $('pw-slow').classList.remove('hidden');
        $('pw-slow').querySelector('span').innerText = (slowTimer / 1000).toFixed(1);
    } else {
        $('pw-slow').classList.add('hidden');
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
function spawnExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        const angle = localRand() * Math.PI * 2;
        const dist = 20 + localRand() * 30;
        const size = 4 + localRand() * 5;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * (dist / 8),
            vy: Math.sin(angle) * (dist / 8),
            color: color,
            size: size,
            life: 1.0,
            decay: 0.04 + localRand() * 0.04
        });
    }
}

function spawnFloatText(x, y, text, color) {
    floatTexts.push({
        x: x,
        y: y,
        text: text,
        color: color,
        vy: -1.5,
        life: 1.0
    });
}

function shakeScreen() {
    document.body.classList.remove('shake');
    void document.body.offsetWidth;
    document.body.classList.add('shake');
}

function showToast(text) {
    const t = $('toast');
    t.textContent = text;
    t.classList.remove('show');
    void t.offsetWidth;
    t.classList.add('show');
}

// ── เปลี่ยนเป้าหมายไวยากรณ์หลัก ──
function changeTargetCategory() {
    let nextCat = activeCategory;
    while (nextCat === activeCategory) {
        nextCat = grammarCategories[Math.floor(localRand() * grammarCategories.length)];
    }
    activeCategory = nextCat;
    correctInCurrentTarget = 0;

    const catThai = DATA.VOCABULARY[activeCategory].thai;
    $('target-text').innerText = catThai.toUpperCase();
    
    // เอฟเฟกต์เรืองแสงขยายบ็อกซ์
    const container = $('target-container');
    container.classList.add('pop');
    setTimeout(() => container.classList.remove('pop'), 300);

    showToast(`🎯 เปลี่ยนเป้าหมาย: ${catThai}!`);
    KAMPAI.sound.correct();

    // ท่องพูดประเภทไวยากรณ์อังกฤษผ่าน TTS
    try {
        KAMPAI.sound.speak(activeCategory, 'en-US');
    } catch (_) {}
}

// ── ระบบการสปอว์นยานศัตรูและคริสตัลไอเทม ──
function spawnEnemy() {
    const roll = localRand();
    let kind = 'word';
    let value = '';
    let category = '';

    if (roll < CFG.BOMB_CHANCE) {
        kind = 'asteroid';
        value = DATA.ASTEROID;
    } else if (roll < CFG.BOMB_CHANCE + CFG.CRYSTAL_CHANCE) {
        // เกิดคริสตัลผลึกไอเทมพิเศษ
        const crystals = ['spread', 'shield', 'slow', 'fever'];
        kind = crystals[Math.floor(localRand() * crystals.length)];
        if (kind === 'spread') value = DATA.SPREAD_ITEM;
        else if (kind === 'shield') value = DATA.SHIELD_ITEM;
        else if (kind === 'slow') value = DATA.SLOW_ITEM;
        else if (kind === 'fever') value = DATA.FEVER_ITEM;
    } else {
        // เกิดเอเลี่ยนถือคำศัพท์ภาษาอังกฤษ
        kind = 'word';
        // อัตราสุ่ม: 40% ดึงคำตรงหมวดเป้าหมาย, 60% ดึงคำนอกหมวดมาท้าทาย
        const matchTarget = localRand() < 0.40;
        if (matchTarget) {
            category = activeCategory;
        } else {
            const wrongCats = grammarCategories.filter(c => c !== activeCategory);
            category = wrongCats[Math.floor(localRand() * wrongCats.length)];
        }
        
        // สุ่มหยิบคำศัพท์
        const wordsList = DATA.VOCABULARY[category].list;
        value = wordsList[Math.floor(localRand() * wordsList.length)];
    }

    let speed = CFG.ENEMY_START_SPEED + (level - 1) * CFG.SPEED_RAMP;
    
    enemies.push({
        x: 40 + localRand() * (cw - 80),
        y: -40,
        vy: speed + localRand() * 0.6,
        kind: kind,
        val: value,
        cat: category, // คำประเภทอะไร
        rot: 0,
        vr: (localRand() - 0.5) * 0.08,
        width: kind === 'word' ? Math.max(80, value.length * 12 + 10) : 48
    });
}

// ── การตรวจจับกระสุนและการปะทะ ──
function handleEnemyDestroyed(enemy, hitByLaser) {
    const x = enemy.x;
    const y = enemy.y;

    if (enemy.kind === 'asteroid') {
        // อุกกาบาตยิงแล้วมีแค่สะเก็ดไฟเฉยๆ (หลบคือวิธีดีที่สุด)
        spawnExplosion(x, y, '#94a3b8');
        return;
    }

    // เก็บผลึกไอเทมพิเศษ
    if (['spread', 'shield', 'slow', 'fever'].includes(enemy.kind)) {
        spawnExplosion(x, y, '#38bdf8');
        KAMPAI.sound.correct();
        
        if (enemy.kind === 'spread') {
            spreadTimer = CFG.SPREAD_DURATION_MS;
            spawnFloatText(x, y, '⚡ SPREAD LASER!', '#f59e0b');
        } else if (enemy.kind === 'shield') {
            updateShieldsUI(Math.min(CFG.MAX_SHIELDS, shields + 1));
            spawnFloatText(x, y, '🛡️ SHIELD UP!', '#38bdf8');
        } else if (enemy.kind === 'slow') {
            slowTimer = CFG.SLOW_DURATION_MS;
            spawnFloatText(x, y, '⏱️ TIME DILATION!', '#0ea5e9');
        } else if (enemy.kind === 'fever') {
            feverTimer = CFG.FEVER_DURATION_MS;
            spawnFloatText(x, y, '✨ FEVER TIME!', '#f43f5e');
        }

        // ชนผลึกได้แต้มโบนัส
        updateScoreUI(score + CFG.BONUS_POINTS * getComboMultiplier());
        return;
    }

    // กรณีลูกเรือศัพท์ภาษาอังกฤษ
    if (enemy.kind === 'word') {
        const isCorrect = (enemy.cat === activeCategory) || (feverTimer > 0);
        
        if (isCorrect) {
            // ยิงถูกหมวด!
            const base = feverTimer > 0 ? CFG.GOOD_POINTS * 2 : CFG.GOOD_POINTS;
            const gain = base * getComboMultiplier();
            
            combo++;
            caught++;
            updateScoreUI(score + gain);
            
            // เช็คอัตราคอมโบทริกเกอร์ฟีเวอร์อัตโนมัติ
            if (combo > 0 && combo % CFG.FEVER_COMBO_TRIGGER === 0) {
                feverTimer = CFG.FEVER_DURATION_MS;
                showToast('✨ FEVER MODE! ✨');
            }

            updateComboUI();
            spawnExplosion(x, y, '#22c55e');
            spawnFloatText(x, y, `+${gain}`, '#fde047');
            KAMPAI.sound.correct();
            KAMPAI.sound.fxFlash(true);

            // ท่องสะกดคำศัพท์อังกฤษ
            try {
                KAMPAI.sound.speak(enemy.val, 'en-US');
            } catch (_) {}

            // เล็งข้ามหมวดเป้าหมายสะสมเมื่อผ่าน 3 คำถูกหลัก
            correctInCurrentTarget++;
            if (correctInCurrentTarget >= 3) {
                changeTargetCategory();
            }

            // แข่งออนไลน์เรียลไทม์
            if (mode === 'online' && match) {
                match.report(score, { correct: caught });
            }

        } else {
            // ยิงผิดหมวด!
            combo = 0;
            updateComboUI();
            shakeScreen();
            KAMPAI.sound.wrong();
            KAMPAI.sound.fxFlash(false);
            spawnExplosion(x, y, '#ef4444');
            spawnFloatText(x, y, 'WRONG TYPE! 💥', '#ef4444');

            if (mode === 'adventure') {
                updateShieldsUI(shields - 1);
            } else {
                updateScoreUI(score - Math.floor(CFG.GOOD_POINTS / 2)); // แข่งเวลา/ออนไลน์: หักคะแนน
            }
        }
    }
}

// ── ยานผู้เล่นปะทะสิ่งกีดขวางตรงๆ ──
function handleShipCollision(enemy) {
    combo = 0;
    updateComboUI();
    shakeScreen();
    KAMPAI.sound.wrong();
    KAMPAI.sound.fxFlash(false);
    
    spawnExplosion(enemy.x, enemy.y, '#f43f5e');

    if (enemy.kind === 'asteroid') {
        spawnFloatText(shipX, shipY - 30, 'METEOR IMPACT! 💥', '#f43f5e');
    } else if (enemy.kind === 'word') {
        spawnFloatText(shipX, shipY - 30, 'COLLISION! 💥', '#f43f5e');
    }

    if (mode === 'adventure') {
        updateShieldsUI(shields - 1);
    } else {
        updateScoreUI(score - CFG.GOOD_POINTS); // หักคะแนนโหมดอื่นๆ
    }
}

// ── ฟังก์ชันเริ่มเกม (Start Game) ──
function startGame(m, rng) {
    if (started && m !== 'online' && mode !== 'online') return;

    mode = m || 'adventure';
    started = true;
    isGameOver = false;

    localRand = rng || Math.random;

    score = 0;
    shields = CFG.MAX_SHIELDS;
    level = 1;
    combo = 0;
    caught = 0;
    correctInCurrentTarget = 0;
    
    enemies = [];
    lasers = [];
    particles = [];
    floatTexts = [];
    
    spreadTimer = 0;
    slowTimer = 0;
    feverTimer = 0;

    shipX = cw / 2;
    shipY = ch - 120;
    dragX = null;
    lastFireTime = 0;

    updateScoreUI(0);
    updateComboUI();
    initStars();

    $('level-badge').innerText = 'เลเวล 1';
    $('player-chip').style.display = KAMPAI.student ? 'flex' : 'none';
    $('blocker').style.display = 'none';

    // วางโหมดแสดงผล HUD
    if (mode === 'adventure') {
        $('shield-container').style.display = 'block';
        updateShieldsUI(CFG.MAX_SHIELDS);
    } else { // โหมดเวลา & ออนไลน์: หักพลังงาน
        $('shield-container').style.display = 'none';
    }

    // กำหนดประเภทเป้าหมายแรกสุด
    changeTargetCategory();

    KAMPAI.sound.unlock();
    KAMPAI.sound.bgmStart();

    requestAnimationFrame(loop);
}

// ── เกมลูปเรนเดอร์ (Main Loop) ──
let lastFrameTime = 0;
let lastSpawnTime = 0;
let lastLevelUpTime = 0;

function loop(timestamp) {
    if (isGameOver) return;

    if (!lastFrameTime) lastFrameTime = timestamp;
    const dt = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    // 1. อัปเดตพลังไอเทมบัฟคูลดาวน์
    updatePowerupsUI(dt);

    // 2. ขยับกระแสตีน ยานผู้เล่น
    if (KAMPAI.input.left)  shipX -= CFG.SHIP_SPEED;
    if (KAMPAI.input.right) shipX += CFG.SHIP_SPEED;
    if (dragX !== null) {
        shipX += (dragX - shipX) * 0.35; // LERP ลากลื่น
    }
    shipX = Math.max(30, Math.min(cw - 30, shipX));

    // 3. ไต่ระดับเลเวลความยากตามเวลา
    if (mode !== 'online') {
        if (timestamp - lastLevelUpTime > CFG.LEVEL_EVERY_MS) {
            level++;
            lastLevelUpTime = timestamp;
            $('level-badge').innerText = 'เลเวล ' + level;
            showToast(`🚀 เซกเตอร์ ${level}! 🚀`);
            
            try {
                KAMPAI.sound.speak(`Level ${level}`, 'en-US');
            } catch (_) {}
        }
    }

    // 4. ยิงเลเซอร์อัตโนมัติคูลดาวน์
    if (timestamp - lastFireTime > CFG.LASER_FIRE_RATE_MS) {
        lastFireTime = timestamp;
        if (spreadTimer > 0) {
            // ยิงปืนกระจาย 3 ทิศ
            lasers.push({ x: shipX, y: shipY - 20, vx: 0, vy: -CFG.LASER_SPEED });
            lasers.push({ x: shipX, y: shipY - 20, vx: -2.5, vy: -CFG.LASER_SPEED * 0.95 });
            lasers.push({ x: shipX, y: shipY - 20, vx: 2.5, vy: -CFG.LASER_SPEED * 0.95 });
        } else {
            // ยิงตรงเดี่ยว
            lasers.push({ x: shipX, y: shipY - 20, vx: 0, vy: -CFG.LASER_SPEED });
        }
    }

    // 5. ปล่อยศัตรูอวกาศเป็นจังหวะ
    let spawnInterval = Math.max(CFG.SPAWN_MIN_MS, CFG.SPAWN_START_MS - (level - 1) * CFG.SPAWN_RAMP_MS);
    if (slowTimer > 0) spawnInterval *= 2.0;

    if (timestamp - lastSpawnTime > spawnInterval) {
        lastSpawnTime = timestamp;
        spawnEnemy();
    }

    // ── วาดฉากอวกาศ Space Parallax ──
    ctx.clearRect(0, 0, cw, ch);
    const spaceGrad = ctx.createLinearGradient(0, 0, 0, ch);
    spaceGrad.addColorStop(0, '#02020a');
    spaceGrad.addColorStop(0.5, '#0a0a24');
    spaceGrad.addColorStop(1, '#050514');
    ctx.fillStyle = spaceGrad;
    ctx.fillRect(0, 0, cw, ch);

    // ดาราจักรหลัง
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    starsFar.forEach(s => {
        s.y += s.vy;
        if (s.y > ch) { s.y = 0; s.x = localRand() * cw; }
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // ดาราจักรหน้า
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    starsClose.forEach(s => {
        s.y += s.vy;
        if (s.y > ch) { s.y = 0; s.x = localRand() * cw; }
        ctx.fillRect(s.x, s.y, s.size, s.size);
    });

    // ── อัปเดตกระสุนเลเซอร์ (Lasers) ──
    for (let i = lasers.length - 1; i >= 0; i--) {
        const l = lasers[i];
        l.x += l.vx;
        l.y += l.vy;

        // วาดกระสุน
        ctx.save();
        ctx.beginPath();
        ctx.arc(l.x, l.y, 3.5, 0, Math.PI * 2);
        ctx.fillStyle = spreadTimer > 0 ? '#fbbf24' : '#ef4444';
        ctx.shadowColor = spreadTimer > 0 ? '#fbbf24' : '#ef4444';
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.restore();

        if (l.y < -10 || l.x < -10 || l.x > cw + 10) {
            lasers.splice(i, 1);
        }
    }

    // ── อัปเดตศัตรูยานอวกาศ (Enemies) ──
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        
        let currentVy = e.vy;
        if (slowTimer > 0) currentVy *= 0.5; // สโลว์เวลา 50%
        e.y += currentVy;
        e.rot += e.vr;

        // เช็คการชนกระสุนเลเซอร์ของผู้เล่น
        let hitResolved = false;
        for (let k = lasers.length - 1; k >= 0; k--) {
            const l = lasers[k];
            // ระยะชนตามความกว้างป้ายศัพท์
            if (l.y > e.y - 20 && l.y < e.y + 20 && Math.abs(l.x - e.x) < e.width / 2) {
                handleEnemyDestroyed(e, true);
                lasers.splice(k, 1);
                enemies.splice(i, 1);
                hitResolved = true;
                break;
            }
        }
        if (hitResolved) continue;

        // เช็คชนยานผู้เล่นตรงๆ (Collision)
        if (e.y > shipY - 30 && e.y < shipY + 30 && Math.abs(e.x - shipX) < e.width / 2 + 20) {
            handleShipCollision(e);
            enemies.splice(i, 1);
            continue;
        }

        // หลุดออกขอบขอบจอข้างล่าง
        if (e.y > ch + 45) {
            enemies.splice(i, 1);
            // ปล่อยคำตอบถูกหลุดจอ = รีเซ็ตคอมโบ (ยกเว้นโหมดฟีเวอร์)
            if (e.cat === activeCategory && feverTimer <= 0) {
                combo = 0;
                updateComboUI();
            }
            continue;
        }

        // วาดศัตรูอวกาศ
        ctx.save();
        ctx.translate(e.x, e.y);
        
        if (e.kind === 'asteroid') {
            ctx.rotate(e.rot);
            ctx.font = '40px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = '#64748b';
            ctx.shadowBlur = 8;
            ctx.fillText(e.val, 0, 0);
        } else if (['spread', 'shield', 'slow', 'fever'].includes(e.kind)) {
            // วาดผลึกผลึกไอเทมพิเศษ
            ctx.rotate(e.rot);
            ctx.font = '38px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            let cGlow = '#f59e0b';
            if (e.kind === 'shield') cGlow = '#06b6d4';
            else if (e.kind === 'slow') cGlow = '#0ea5e9';
            else if (e.kind === 'fever') cGlow = '#fb7185';
            
            ctx.shadowColor = cGlow;
            ctx.shadowBlur = 12;
            ctx.fillText(e.val, 0, 0);
        } else {
            // วาดเอเลี่ยนถือป้ายคำศัพท์
            // วาดตัวยานเอเลี่ยนจานบิน
            ctx.fillStyle = e.cat === activeCategory ? 'rgba(167, 139, 250, 0.2)' : 'rgba(255,255,255,0.06)';
            ctx.strokeStyle = e.cat === activeCategory ? '#a78bfa' : 'rgba(255,255,255,0.3)';
            ctx.lineWidth = 1.5;
            
            ctx.beginPath();
            ctx.ellipse(0, 0, e.width / 2, 18, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // เรืองแสงห้องควบคุม
            ctx.fillStyle = '#60a5fa';
            ctx.beginPath();
            ctx.arc(0, -8, 10, Math.PI, 0);
            ctx.fill();

            // เขียนคำศัพท์ภาษาอังกฤษในห้องโดยสาร
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 15px Kanit, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 3;
            ctx.fillText(e.val, 0, 0);
        }
        ctx.restore();
    }

    // ── วาดระเบิดเอฟเฟกต์ (Particles) ──
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= p.decay;

        if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size;
        ctx.fill();
        ctx.restore();
    }

    // ── วาดคะแนน/ดาเมจเด้งลอย (Float Texts) ──
    for (let i = floatTexts.length - 1; i >= 0; i--) {
        const pop = floatTexts[i];
        pop.y += pop.vy;
        pop.life -= 0.025;

        if (pop.life <= 0) {
            floatTexts.splice(i, 1);
            continue;
        }

        ctx.save();
        ctx.globalAlpha = pop.life;
        ctx.fillStyle = pop.color;
        ctx.font = 'bold 14px Kanit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pop.text, pop.x, pop.y);
        ctx.restore();
    }

    // ── วาดตัวยานอวกาศผู้เล่น (Player Spaceship) ──
    ctx.save();
    ctx.translate(shipX, shipY);
    
    // วาดไอคอนเกราะอวกาศเรืองแสงรอบยาน (ถ้ามี)
    if (mode === 'adventure') {
        const shieldGrad = ctx.createRadialGradient(0, 0, 15, 0, 0, 48);
        shieldGrad.addColorStop(0, 'rgba(56, 189, 248, 0.02)');
        shieldGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.15)');
        shieldGrad.addColorStop(1, 'rgba(56, 189, 248, 0.6)');
        
        ctx.beginPath();
        ctx.arc(0, 0, 46, 0, Math.PI * 2);
        ctx.fillStyle = shieldGrad;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.7)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
    }

    // วาดไอคอนยานรบด้วยเวกเตอร์หลายเหลี่ยม (Neon Polygon Spacecraft)
    ctx.shadowColor = '#4f46e5';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#1e1b4b';
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2.5;
    
    ctx.beginPath();
    ctx.moveTo(0, -28); // หัว
    ctx.lineTo(22, 16);  // ปีกขวา
    ctx.lineTo(8, 8);    // ครีบขวา
    ctx.lineTo(-8, 8);   // ครีบซ้าย
    ctx.lineTo(-22, 16); // ปีกซ้าย
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // วาดไอพ่นท้ายยานสลับสี (Thruster Flame)
    const flameH = 10 + Math.sin(timestamp * 0.05) * 8;
    const flameGrad = ctx.createLinearGradient(0, 8, 0, 8 + flameH);
    flameGrad.addColorStop(0, '#f43f5e');
    flameGrad.addColorStop(1, 'rgba(244,63,94,0)');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(-6, 8);
    ctx.lineTo(6, 8);
    ctx.lineTo(0, 8 + flameH);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    requestAnimationFrame(loop);
}

// ── จบเกม (Game Over) ──
function endGame() {
    if (isGameOver) return;
    isGameOver = true;

    KAMPAI.sound.bgmStop();
    KAMPAI.sound.gameOver();
    KAMPAI.sound.stopSpeak();

    const stars = CFG.STAR_THRESHOLDS.filter((t) => score >= t).length;
    
    KAMPAI.submitScore(score, {
        mode: 'normal',
        stars: stars,
        level_reached: level,
        caught: caught
    });

    $('go-stars').innerText = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    $('final-score').innerText = score;
    $('go-summary').innerText = `พิชิตเซกเตอร์ได้ ${level} · กำจัดยานศัพท์ตรงหมวด ${caught} ลำ · ตัวคูณสะสม x${getComboMultiplier()}`;
    $('gameover-screen').style.display = 'flex';

    renderLeaderboard('score-list-gameover');
}

// ── การสัมผัสหน้าจอ/ลากยาน ──
canvas.addEventListener('pointerdown', (e) => { 
    dragX = e.clientX; 
});
canvas.addEventListener('pointermove', (e) => { 
    if (dragX !== null) dragX = e.clientX; 
});
window.addEventListener('pointerup', () => { 
    dragX = null; 
});
