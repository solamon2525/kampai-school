/* game.js — โลจิกควบคุมหลักเกม Angle Castle: ศึกปราสาทมุมองศา */

const CFG = window.GAME_CONFIG;
const DATA = window.GAME_DATA;

KAMPAI.setSlug(CFG.SLUG);
KAMPAI.sound.defaultBgm(CFG.BGM);

// ── การแสดงผลข้อมูลผู้เล่นในระบบ ──
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
    if (!rows.length) { el.innerHTML = '<li class="lb-loading">ยังไม่มีผู้กล้าสะสมคะแนน</li>'; return; }
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

// ติดตั้งปุ่มควบคุมมือถือและสวิตช์ปิดเสียง
KAMPAI.controls.mount({ dpad: true, buttons: ['a', 'b'] }); // a = ยิง/ชาร์จ, b = สลับคทา
KAMPAI.sound.mountToggles();

// ── การเชื่อมต่อโหมดออนไลน์ (KampaiMatch) ──
let match = null;
if (CFG.ENABLE_ONLINE && window.KampaiMatch) {
    match = KampaiMatch.create({
        duration: CFG.ONLINE_DURATION,
        title: 'ศึกประลองยิงสะท้อนวัดมุมองศา',
        onPlay: function ({ rng }) { startGame('online', rng); },
        onEnd: function () { isGameOver = true; endGame(false); }
    });
    document.getElementById('online-btn').style.display = '';
}

function openOnline() { if (match) match.openMenu(); }

// ── ตัวแปรและการตั้งค่าระบบการยิง / ด่าน ──
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let cw = 0, ch = 0;
let cellSize = 60; // ขนาดแต่ละกริดกว้างคูณสูง
const gridCols = 16;
const gridRows = 8;
const offsetX = 0;
let offsetY = 80; // เผื่อพื้นที่ด้านบนให้ HUD แฟลตไม่ซ้อนทับกัน

function resize() {
    cw = canvas.width = window.innerWidth;
    ch = canvas.height = window.innerHeight;
    
    // คำนวณขนาดยืดหยุ่นของ Grid ให้แสดงผลพอดีกลางจอ
    const scaleX = cw / (gridCols * 64);
    const scaleY = (ch - 100) / (gridRows * 64);
    cellSize = Math.floor(Math.min(scaleX, scaleY, 1) * 64);
    if (cellSize < 35) cellSize = 35; // ขนาดยอดต่ำสุด
    
    offsetY = Math.max(80, Math.floor((ch - (gridRows * cellSize)) / 2));
}
resize();
window.addEventListener('resize', resize);

const $ = (id) => document.getElementById(id);

// สถานะการเล่น
let mode = 'adventure'; // 'adventure' หรือ 'endless' หรือ 'online'
let started = false;
let isGameOver = false;
let score = 0;
let combo = 0;
let currentSectorIdx = 0;
let shields = CFG.MAX_SHIELDS;
let localRand = Math.random;

// สถานะการเล็งและคทา
let selectedWand = 'reflector'; // 'reflector', 'splitter', 'beam'
let player = { x: 150, y: 300, vx: 0, vy: 0, size: 20 };
let aimAngle = 0; // เรเดียน (0 ถึง 2PI)
let isAiming = false;
let lastFireTime = 0;

// อารีย์ของคันถ์ที่ปรากฏในด่านปัจจุบัน
let grid = [];
let enemies = [];
let projectiles = [];
let particles = [];
let activeTarget = null;
let rotatableMirrors = [];
let switches = [];
let gate = null;
let targetBoxAngle = 0;

// ── รายการปุ่มกดระบบควบคุม ──
const keys = { w: false, a: false, s: false, d: false, Space: false };
const mouse = { x: 0, y: 0, isDown: false };

window.addEventListener('keydown', (e) => {
    if (['w','a','s','d','ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) {
        e.preventDefault();
    }
    if (e.key === 'w' || e.key === 'ArrowUp') keys.w = true;
    if (e.key === 's' || e.key === 'ArrowDown') keys.s = true;
    if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = true;
    if (e.key === 'd' || e.key === 'ArrowRight') keys.d = true;
    if (e.key === ' ' || e.key === 'Spacebar') keys.Space = true;
    if (e.key.toLowerCase() === 'r') rotateNearestMirror();
    if (e.key.toLowerCase() === 'e') openWandModal();
});

window.addEventListener('keyup', (e) => {
    if (e.key === 'w' || e.key === 'ArrowUp') keys.w = false;
    if (e.key === 's' || e.key === 'ArrowDown') keys.s = false;
    if (e.key === 'a' || e.key === 'ArrowLeft') keys.a = false;
    if (e.key === 'd' || e.key === 'ArrowRight') keys.d = false;
    if (e.key === ' ' || e.key === 'Spacebar') keys.Space = false;
});

// ดึงพิกัดเมาส์
window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});
window.addEventListener('mousedown', (e) => {
    if (gameState() === 'PLAYING' && e.clientY > 80) {
        mouse.isDown = true;
        initAudio();
    }
});
window.addEventListener('mouseup', () => {
    if (mouse.isDown && gameState() === 'PLAYING') {
        mouse.isDown = false;
        fireActiveWand();
    }
});

function initAudio() {
    // ปลดล็อกเสียงเว็บบราวเซอร์เบื้องต้น
    KAMPAI.sound.unlock();
}

function gameState() {
    if ($('start-screen').style.display !== 'none') return 'START';
    if ($('game-over-screen').style.display !== 'none') return 'GAMEOVER';
    return 'PLAYING';
}

// ── เริ่มเกม ──
function selectMode(m) {
    mode = m;
    startGame(m, Math.random);
}

function startGame(m, rngFunc) {
    mode = m;
    localRand = rngFunc;
    score = 0;
    combo = 0;
    shields = CFG.MAX_SHIELDS;
    currentSectorIdx = 0;
    isGameOver = false;
    
    // ซ่อนเมนูเริ่มเกม
    $('start-screen').style.display = 'none';
    $('game-over-screen').style.display = 'none';
    $('angle-aim-box').style.display = 'flex';
    
    updateHUD();
    loadSector(currentSectorIdx);
    
    KAMPAI.sound.bgmStart();
    requestAnimationFrame(gameLoop);
}

// โหลดข้อมูลด่าน
function loadSector(idx) {
    let secData;
    if (mode === 'endless') {
        secData = generateRandomSector(idx + 1);
    } else {
        if (idx >= DATA.SECTORS.length) {
            endGame(true);
            return;
        }
        secData = DATA.SECTORS[idx];
    }
    
    showToast(`${secData.name}\n${secData.desc}`);
    
    // ถอดแบบกริด
    grid = secData.grid.map(row => [...row]);
    player.x = secData.playerStart.x;
    player.y = secData.playerStart.y + offsetY;
    
    // โหลดศัตรู
    enemies = secData.enemies.map(e => ({
        ...e,
        hp: e.maxHp,
        active: true,
        glowTimer: 0
    }));
    
    // โหลดกระจกหมุนได้ (ถ้ามี)
    rotatableMirrors = [];
    if (secData.mirrors) {
        rotatableMirrors = secData.mirrors.map(m => ({ ...m }));
    }
    
    // โหลดสวิตช์ปุ่ม (ถ้ามี)
    switches = [];
    if (secData.switches) {
        switches = secData.switches.map(s => ({ ...s }));
    }
    
    // โหลดประตู
    gate = secData.gate ? { ...secData.gate } : null;
    
    projectiles = [];
    particles = [];
    
    pickNewTarget();
    updateHUD();
}

// สุ่มสร้างแผนที่สำหรับโหมด Endless
function generateRandomSector(levelNum) {
    // กำหนดรูปแบบง่าย ๆ เสมือนสร้างด่านสุ่มขึ้นมาใหม่
    const angles = ['ACUTE', 'RIGHT', 'OBTUSE', 'STRAIGHT', 'REFLEX'];
    const selectedAngleType = angles[Math.floor(localRand() * angles.length)];
    let targetDeg = 45;
    if (selectedAngleType === 'ACUTE') targetDeg = Math.floor(15 + localRand() * 60);
    else if (selectedAngleType === 'RIGHT') targetDeg = 90;
    else if (selectedAngleType === 'OBTUSE') targetDeg = Math.floor(100 + localRand() * 70);
    else if (selectedAngleType === 'STRAIGHT') targetDeg = 180;
    else targetDeg = Math.floor(190 + localRand() * 150);
    
    return {
        name: `ห้องใต้ดินที่ ${levelNum}`,
        desc: `ปราบวิญญาณปริศนาที่แพ้ทางพลังงานมุมชนิดต่าง ๆ`,
        grid: [
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,1,1,0,0,0,0,0,0,1,1,0,0,1],
            [1,0,0,1,1,0,0,0,0,0,0,1,1,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
            [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
        ],
        playerStart: { x: 120, y: 240 },
        enemies: [
            { id: `endless_e1`, type: 'ghost', name: 'วิญญาณสุ่มสติ', x: 850, y: 240, angleType: selectedAngleType, targetAngle: targetDeg, maxHp: 1 }
        ]
    };
}

// หยิบเป้าหมายใหม่จากกองศัตรูที่ยังมีชีวิตอยู่
function pickNewTarget() {
    const alive = enemies.filter(e => e.active);
    if (alive.length === 0) {
        // ด่านนี้เคลียร์
        if (mode === 'adventure') {
            currentSectorIdx++;
            loadSector(currentSectorIdx);
        } else {
            currentSectorIdx++;
            loadSector(currentSectorIdx);
        }
        return;
    }
    
    // บอสเซคเตอร์ 5 ให้ความสำคัญเป็นพิเศษ
    const boss = alive.find(e => e.type === 'boss');
    if (boss) {
        activeTarget = boss;
    } else {
        // สุ่มหยิบศัตรู
        activeTarget = alive[Math.floor(localRand() * alive.length)];
    }
    
    // ตั้งพารามิเตอร์มุมเป้าหมาย
    const typeLabel = CFG.ANGLE_TYPES[activeTarget.angleType].name;
    $('target-val').innerText = `${activeTarget.targetAngle}° (${typeLabel})`;
    
    // อ่านออกเสียงโจทย์ภาษาไทย (Thai TTS)
    KAMPAI.sound.speak(`จงโจมตีด้วย มุม ${typeLabel} ขนาด ${activeTarget.targetAngle} องศา`, 'th-TH');
}

// ── ลูปประมวลผล (Game Loop) ──
function gameLoop(timestamp) {
    if (gameState() !== 'PLAYING') return;
    
    updatePlayer();
    updateAimAngle();
    updateProjectiles();
    updateParticles();
    
    render();
    
    requestAnimationFrame(gameLoop);
}

// ควบคุมการเดินอัศวิน
function updatePlayer() {
    let dx = 0;
    let dy = 0;
    
    if (keys.w || KAMPAI.input.up) dy = -1;
    if (keys.s || KAMPAI.input.down) dy = 1;
    if (keys.a || KAMPAI.input.left) dx = -1;
    if (keys.d || KAMPAI.input.right) dx = 1;
    
    // ลดความเร็วแนวทแยงมุม
    if (dx !== 0 && dy !== 0) {
        dx *= 0.707;
        dy *= 0.707;
    }
    
    const speed = CFG.PLAYER_SPEED;
    const nextX = player.x + dx * speed;
    const nextY = player.y + dy * speed;
    
    // ชนขอบแผนที่ / กำแพง (Cell Collision)
    if (!checkWallCollision(nextX, player.y)) player.x = nextX;
    if (!checkWallCollision(player.x, nextY)) player.y = nextY;
}

// เช็กชนกำแพงหิน
function checkWallCollision(px, py) {
    const col = Math.floor((px - offsetX) / cellSize);
    const row = Math.floor((py - offsetY) / cellSize);
    
    if (col < 0 || col >= gridCols || row < 0 || row >= gridRows) return true;
    
    // ชนบล็อกหิน
    if (grid[row][col] === 1) return true;
    
    // ด่าน 4: ประตูทางผ่านปิดอยู่
    if (gate && !gate.open && col === gate.gridX && row === gate.gridY) return true;
    
    return false;
}

// คำนวณองศาและทิศทางเล็งปืน
function updateAimAngle() {
    isAiming = keys.Space || mouse.isDown || KAMPAI.input.a;
    
    if (isAiming) {
        if (mouse.isDown) {
            // คำนวณจากพิกัดเมาส์
            aimAngle = Math.atan2(mouse.y - player.y, mouse.x - player.x);
        } else {
            // แป้นคีย์บอร์ด Space / ลูกศร: ค่อย ๆ หมุนตามเวลา
            aimAngle += 0.03;
        }
        
        // แปลงเป็นองศาทิศทางทวนเข็ม (0 - 360) โดยเริ่มจากแกนบวก X
        let deg = Math.round(aimAngle * (180 / Math.PI));
        if (deg < 0) deg += 360;
        
        // ค้นหาประเภทมุม
        let typeName = 'มุมแหลม';
        for (const key in CFG.ANGLE_TYPES) {
            const at = CFG.ANGLE_TYPES[key];
            if (deg >= at.min && deg <= at.max) {
                typeName = at.name;
                break;
            }
        }
        
        $('angle-aim-val').innerText = `${deg}° (${typeName})`;
    }
}

// ยิงคทา
function fireActiveWand() {
    const now = Date.now();
    if (now - lastFireTime < CFG.COOLDOWN_MS) return;
    lastFireTime = now;
    
    let deg = Math.round(aimAngle * (180 / Math.PI));
    if (deg < 0) deg += 360;
    
    if (selectedWand === 'splitter') {
        // ยิงกระจายสามแฉก (-45°, 0°, +45°)
        const angles = [aimAngle - Math.PI/4, aimAngle, aimAngle + Math.PI/4];
        angles.forEach(ang => {
            projectiles.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(ang) * CFG.PROJECTILE_SPEED,
                vy: Math.sin(ang) * CFG.PROJECTILE_SPEED,
                bounces: 0,
                maxBounces: CFG.WANDS.splitter.maxBounces,
                color: CFG.WANDS.splitter.color,
                firedAngle: deg // บันทึกองศาต้นขั้ว
            });
        });
    } else {
        const wandCfg = CFG.WANDS[selectedWand];
        projectiles.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(aimAngle) * CFG.PROJECTILE_SPEED,
            vy: Math.sin(aimAngle) * CFG.PROJECTILE_SPEED,
            bounces: 0,
            maxBounces: wandCfg.maxBounces,
            color: wandCfg.color,
            firedAngle: deg
        });
    }
    
    playSound('shoot');
}

// สลับคทาระหว่างเดินเกม
function rotateWand() {
    const wandKeys = Object.keys(CFG.WANDS);
    let nextIdx = wandKeys.indexOf(selectedWand) + 1;
    if (nextIdx >= wandKeys.length) nextIdx = 0;
    selectedWand = wandKeys[nextIdx];
    updateHUD();
}

// ตรวจจับปุ่ม B ผูกสลับคทาของ D-pad
setInterval(() => {
    if (KAMPAI.input.b) {
        KAMPAI.input.b = false;
        rotateWand();
    }
}, 200);

// หมุนกระจกหมุนได้ที่อยู่ใกล้อัศวินที่สุด
function rotateNearestMirror() {
    let nearest = null;
    let minDist = 80; // ระยะประชิดตัว
    
    rotatableMirrors.forEach(m => {
        const mx = m.gridX * cellSize + cellSize/2 + offsetX;
        const my = m.gridY * cellSize + cellSize/2 + offsetY;
        const dist = Math.hypot(mx - player.x, my - player.y);
        if (dist < minDist) {
            minDist = dist;
            nearest = m;
        }
    });
    
    if (nearest) {
        // หมุนเพิ่มทีละ 45 องศา
        nearest.angle = (nearest.angle + 45) % 180;
        playSound('click');
        showToast(`หมุนกระจกสะท้อนไปที่ ${nearest.angle} องศา`);
    }
}

// ประมวลผลลูกพลังกระสุนเวทมนตร์
function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];
        
        // ขยับพิกัดกระสุน
        p.x += p.vx;
        p.y += p.vy;
        
        // เช็กชนขอบจอหลุดกรอบ
        if (p.x < 0 || p.x > cw || p.y < 0 || p.y > ch) {
            projectiles.splice(i, 1);
            continue;
        }
        
        // คำนวณ Grid พิกัดกระสุน
        const col = Math.floor((p.x - offsetX) / cellSize);
        const row = Math.floor((p.y - offsetY) / cellSize);
        
        if (col >= 0 && col < gridCols && row >= 0 && row < gridRows) {
            const cellType = grid[row][col];
            
            // ── 1. ชนกำแพงธรรมดา (ไม่ชิ่ง) ──
            if (cellType === 1 || (gate && !gate.open && col === gate.gridX && row === gate.gridY)) {
                createSplatter(p.x, p.y, p.color);
                projectiles.splice(i, 1);
                continue;
            }
            
            // ── 2. ชนกระจกสะท้อนแนวนอน (บน/ล่าง) ➔ เด้งแกน Y ──
            if (cellType === 2) {
                p.vy = -p.vy;
                p.bounces++;
                p.y += p.vy; // ขยับพ้นกระจกกันซ้ำซ้อน
                playSound('bounce');
                if (p.bounces > p.maxBounces) {
                    createSplatter(p.x, p.y, p.color);
                    projectiles.splice(i, 1);
                }
                continue;
            }
            
            // ── 3. ชนกระจกสะท้อนแนวตั้ง (ซ้าย/ขวา) ➔ เด้งแกน X ──
            if (cellType === 3) {
                p.vx = -p.vx;
                p.bounces++;
                p.x += p.vx;
                playSound('bounce');
                if (p.bounces > p.maxBounces) {
                    createSplatter(p.x, p.y, p.color);
                    projectiles.splice(i, 1);
                }
                continue;
            }
            
            // ── 4. ชนสวิตช์เปิดประตู ──
            if (cellType === 5) {
                const sw = switches.find(s => s.gridX === col && s.gridY === row);
                if (sw && !sw.active) {
                    sw.active = true;
                    grid[row][col] = 0; // เปลี่ยนเป็นห้องโล่ง
                    playSound('correct');
                    showToast('สวิตช์ประจุกระแสไฟเวทมนตร์เรียบร้อย!');
                    
                    // ปลดล็อกประตูทางผ่าน
                    if (gate) {
                        gate.open = true;
                        grid[gate.gridY][gate.gridX] = 0; // เปิดประตู
                    }
                }
                createSplatter(p.x, p.y, p.color);
                projectiles.splice(i, 1);
                continue;
            }
        }
        
        // ── 5. ชนกระจกหมุนได้ (Rotatable Mirrors) ──
        let hitMirror = null;
        rotatableMirrors.forEach(m => {
            const mx = m.gridX * cellSize + cellSize/2 + offsetX;
            const my = m.gridY * cellSize + cellSize/2 + offsetY;
            if (Math.hypot(mx - p.x, my - p.y) < cellSize * 0.4) {
                hitMirror = m;
            }
        });
        
        if (hitMirror) {
            // ชิ่งตามมุมของกระจกหมุนได้
            // สูตรคำนวณเวกเตอร์สะท้อน: R = I - 2*(I.N)*N
            const mAngleRad = hitMirror.angle * (Math.PI / 180);
            const nx = Math.cos(mAngleRad + Math.PI/2); // เวกเตอร์ปกติแนวตั้งฉากกระจก
            const ny = Math.sin(mAngleRad + Math.PI/2);
            const dot = p.vx * nx + p.vy * ny;
            
            p.vx = p.vx - 2 * dot * nx;
            p.vy = p.vy - 2 * dot * ny;
            p.bounces++;
            p.x += p.vx * 1.5; // ดันออก
            p.y += p.vy * 1.5;
            
            playSound('bounce');
            if (p.bounces > p.maxBounces) {
                createSplatter(p.x, p.y, p.color);
                projectiles.splice(i, 1);
            }
            continue;
        }
        
        // ── 6. ชนศัตรู ──
        let hitEnemy = null;
        for (let j = 0; j < enemies.length; j++) {
            const e = enemies[j];
            if (e.active && Math.hypot(e.x - p.x, e.y - p.y) < 25) {
                hitEnemy = e;
                break;
            }
        }
        
        if (hitEnemy) {
            handleEnemyCollision(p, hitEnemy);
            projectiles.splice(i, 1);
        }
    }
}

// จัดการเหตุการณ์เมื่อชนเป้าหมายศัตรู
function handleEnemyCollision(proj, enemy) {
    // ── ตรวจสอบทิศทางและองศาจุดโจมตี ──
    const targetDeg = enemy.targetAngle;
    const attackDeg = proj.firedAngle; // ใช้องศาที่เราเริ่มปล่อย
    const difference = Math.abs(attackDeg - targetDeg);
    const minDiff = Math.min(difference, 360 - difference);
    
    // ตรวจเกราะป้องกัน (เซคเตอร์ 3)
    if (enemy.shieldDir === 'left' && proj.vx > 0) {
        // โดนป้องกันเกราะหิน
        showToast('เกราะมนตราสะท้อนป้องกันการโจมตีตรง ๆ!');
        playSound('wrong');
        createSplatter(proj.x, proj.y, '#e0e0e0');
        damagePlayer();
        return;
    }
    
    if (minDiff <= CFG.ANGLE_TOLERANCE) {
        // โจมตีถูกต้อง!
        enemy.hp--;
        enemy.glowTimer = 20;
        createExplosion(enemy.x, enemy.y, enemy.type === 'boss' ? '#ffd54f' : CFG.WANDS[selectedWand].color);
        
        // คะแนนที่ได้รับ
        const isPerfect = minDiff === 0;
        let points = CFG.POINTS.CORRECT_HIT;
        if (isPerfect) points += CFG.POINTS.PERFECT_ANGLE;
        if (proj.bounces > 0) points += CFG.POINTS.BOUNCE_BONUS * proj.bounces;
        
        score += points;
        combo = Math.min(combo + 1, CFG.POINTS.COMBO_MAX);
        
        playSound('correct');
        updateHUD();
        
        // เสียงพูดอ่านความหมายของมุมทางวิชาการ (Thai TTS)
        const descLabel = CFG.ANGLE_TYPES[enemy.angleType].name;
        KAMPAI.sound.speak(`ถูกต้อง! มุม ${descLabel} ขนาด ${targetDeg} องศา`, 'th-TH');
        
        if (enemy.hp <= 0) {
            enemy.active = false;
            createExplosion(enemy.x, enemy.y, '#ff1744', 30);
            
            // ปลดปล่อยเป้าหมายถัดไป
            setTimeout(pickNewTarget, 600);
        }
    } else {
        // โจมตีผิดเป้าหมาย/องศาเบี่ยงเบนเกิน
        showToast(`องศาไม่ถูกต้อง! เป้าหมาย: ${targetDeg}° คุณยิง: ${attackDeg}°`);
        playSound('wrong');
        damagePlayer();
        createSplatter(proj.x, proj.y, '#f50057');
    }
}

// ผู้เล่นโดนโจมตีพลังเกราะลดลง
function damagePlayer() {
    shields--;
    combo = 0;
    updateHUD();
    KAMPAI.sound.fxFlash(); // แฟลชหน้าจอแดง
    
    if (shields <= 0) {
        isGameOver = true;
        endGame(false);
    }
}

// ── จบเกมและส่งผลคะแนน ──
function endGame(isSuccess) {
    KAMPAI.sound.bgmStop();
    
    const isOnline = mode === 'online';
    
    if (isOnline) {
        if (match) match.report(score, { cleared: isSuccess });
        $('go-title').innerText = isSuccess ? '⚔️ ผู้ชนะกาลเวลา' : '🛡️ ยุติสงครามดวลองศา';
        $('go-desc').innerText = `สิ้นสุดโหมดออนไลน์เรียลไทม์`;
    } else {
        $('go-title').innerText = isSuccess ? '🏆 อัศวินวัดมุมองศาสำเร็จ!' : '🛡️ สิ้นสุดการผจญภัย';
        $('go-desc').innerText = isSuccess ? 'พิชิตประตูบอสจอมเวทใหญ่แห่งเวลา' : 'เกราะเวทมนตร์แตกกระจายกลางปราสาท';
    }
    
    $('go-score').innerText = score;
    
    // บันทึกคะแนนเข้าสู่ Kampai SDK
    KAMPAI.submitScore(score, {
        mode: mode,
        shields_left: shields,
        sector_reached: currentSectorIdx + 1
    });
    
    // โหลดบอร์ดคะแนน Top 5 ล่าสุด
    renderLeaderboard('go-score-list');
    
    $('game-over-screen').style.display = 'flex';
}

function restartGame() {
    $('game-over-screen').style.display = 'none';
    $('start-screen').style.display = 'flex';
}

// ── อัปเดตข้อมูลเอฟเฟกต์อนุภาค ──
function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const pt = particles[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.alpha -= 0.02;
        if (pt.alpha <= 0) {
            particles.splice(i, 1);
        }
    }
}

function createExplosion(x, y, color, count = 15) {
    for (let i = 0; i < count; i++) {
        const ang = localRand() * Math.PI * 2;
        const speed = 1 + localRand() * 4;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(ang) * speed,
            vy: Math.sin(ang) * speed,
            color: color,
            alpha: 1,
            size: 2 + localRand() * 4
        });
    }
}

function createSplatter(x, y, color) {
    // จุดกระเด็นชิ้นส่วนเล็ก ๆ บนสิ่งกีดขวาง
    createExplosion(x, y, color, 6);
}

// ── การวาดฉากเรนเดอร์ (Canvas Rendering) ──
function render() {
    ctx.clearRect(0, 0, cw, ch);
    
    // 1. วาดกริดพื้นหลังปราสาท
    ctx.fillStyle = '#0f111a';
    ctx.fillRect(offsetX, offsetY, gridCols * cellSize, gridRows * cellSize);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.lineWidth = 1;
    for (let c = 0; c <= gridCols; c++) {
        ctx.beginPath();
        ctx.moveTo(offsetX + c * cellSize, offsetY);
        ctx.lineTo(offsetX + c * cellSize, offsetY + gridRows * cellSize);
        ctx.stroke();
    }
    for (let r = 0; r <= gridRows; r++) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + r * cellSize);
        ctx.lineTo(offsetX + gridCols * cellSize, offsetY + r * cellSize);
        ctx.stroke();
    }
    
    // 2. วาดกำแพง กระจก สวิตช์ ประตู
    for (let r = 0; r < gridRows; r++) {
        for (let c = 0; c < gridCols; c++) {
            const val = grid[r][c];
            const bx = offsetX + c * cellSize;
            const by = offsetY + r * cellSize;
            
            if (val === 1) {
                // บล็อกหิน
                ctx.fillStyle = '#263238';
                ctx.fillRect(bx + 1, by + 1, cellSize - 2, cellSize - 2);
                ctx.strokeStyle = '#37474f';
                ctx.lineWidth = 2;
                ctx.strokeRect(bx + 1, by + 1, cellSize - 2, cellSize - 2);
            } else if (val === 2) {
                // กระจกแนวนอน (Horizontal Neon)
                ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
                ctx.fillRect(bx, by + cellSize/3, cellSize, cellSize/3);
                ctx.strokeStyle = varColor('ACUTE');
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(bx, by + cellSize/2);
                ctx.lineTo(bx + cellSize, by + cellSize/2);
                ctx.stroke();
            } else if (val === 3) {
                // กระจกแนวตั้ง (Vertical Neon)
                ctx.fillStyle = 'rgba(0, 229, 255, 0.2)';
                ctx.fillRect(bx + cellSize/3, by, cellSize/3, cellSize);
                ctx.strokeStyle = varColor('ACUTE');
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(bx + cellSize/2, by);
                ctx.lineTo(bx + cellSize/2, by + cellSize);
                ctx.stroke();
            }
        }
    }
    
    // วาดสวิตช์และประตู (ถ้ามี)
    switches.forEach(s => {
        const sx = s.gridX * cellSize + cellSize/2 + offsetX;
        const sy = s.gridY * cellSize + cellSize/2 + offsetY;
        ctx.fillStyle = s.active ? '#00e676' : '#ff1744';
        ctx.beginPath();
        ctx.arc(sx, sy, cellSize/3, 0, Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
    });
    
    if (gate && !gate.open) {
        const gx = gate.gridX * cellSize + offsetX;
        const gy = gate.gridY * cellSize + offsetY;
        ctx.fillStyle = '#ff9100';
        ctx.fillRect(gx + 4, gy + 4, cellSize - 8, cellSize - 8);
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(gx + 4, gy + 4, cellSize - 8, cellSize - 8);
    }
    
    // วาดกระจกหมุนได้ (Rotatable Mirrors)
    rotatableMirrors.forEach(m => {
        const mx = m.gridX * cellSize + cellSize/2 + offsetX;
        const my = m.gridY * cellSize + cellSize/2 + offsetY;
        
        ctx.save();
        ctx.translate(mx, my);
        ctx.rotate(m.angle * (Math.PI / 180));
        
        // วาดกระจกแฮนด์เลอร์หมุน
        ctx.fillStyle = 'rgba(255, 235, 59, 0.25)';
        ctx.fillRect(-cellSize/2 + 6, -6, cellSize - 12, 12);
        ctx.strokeStyle = '#ffeb3b';
        ctx.lineWidth = 4;
        ctx.strokeRect(-cellSize/2 + 6, -6, cellSize - 12, 12);
        
        ctx.restore();
    });
    
    // 3. วาดเส้นไกด์ชาร์จ/เส้นองศาเป้าหมายสะท้อน (Reflection Path Solver)
    if (isAiming) {
        drawReflectionPath();
        drawProtractorOverlay();
    }
    
    // 4. วาดศัตรู
    enemies.forEach(e => {
        if (!e.active) return;
        
        ctx.save();
        
        // ทำเอฟเฟกต์สั่นเวลากระสุนชนโดนดาเมจ
        if (e.glowTimer > 0) {
            ctx.translate((localRand() - 0.5) * 8, (localRand() - 0.5) * 8);
            e.glowTimer--;
        }
        
        // วาดรูปทรงเรขาคณิตศัตรู
        ctx.shadowBlur = 15;
        ctx.shadowColor = varColor(e.angleType);
        
        ctx.fillStyle = '#1e1f29';
        ctx.strokeStyle = varColor(e.angleType);
        ctx.lineWidth = 3;
        
        ctx.beginPath();
        if (e.type === 'golem') {
            ctx.rect(e.x - 20, e.y - 20, 40, 40);
        } else if (e.type === 'ghost') {
            ctx.arc(e.x, e.y, 20, 0, Math.PI * 2);
        } else if (e.type === 'shielded') {
            // ศัตรูเกราะกลับด้าน
            ctx.arc(e.x, e.y, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // วาดครึ่งเสี้ยวเกราะด้านหน้า
            ctx.strokeStyle = '#78909c';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(e.x, e.y, 28, Math.PI/2, Math.PI * 1.5);
            ctx.stroke();
        } else if (e.type === 'boss') {
            ctx.arc(e.x, e.y, 35, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowBlur = 0; // เคลียร์เรืองแสง
        
        // วาดวงกลมเป้าหมายของระบบแองเกิลยึด
        if (activeTarget && activeTarget.id === e.id) {
            ctx.strokeStyle = '#ffd54f';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(e.x, e.y, 30, 0, Math.PI*2);
            ctx.stroke();
        }
        
        // พิมพ์ข้อมูลองศาของศัตรู
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Kanit';
        ctx.textAlign = 'center';
        ctx.fillText(`${e.targetAngle}°`, e.x, e.y - 32);
        
        ctx.font = '10px Sarabun';
        ctx.fillStyle = '#b0bec5';
        ctx.fillText(e.name, e.x, e.y + 35);
        
        ctx.restore();
    });
    
    // 5. วาดตัวอัศวิน
    ctx.save();
    ctx.shadowBlur = 10;
    ctx.shadowColor = CFG.WANDS[selectedWand].color;
    
    ctx.fillStyle = '#eceff1';
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = CFG.WANDS[selectedWand].color;
    ctx.lineWidth = 3;
    ctx.stroke();
    
    ctx.shadowBlur = 0;
    
    // วาดไอคอนคทามนตราในมือ
    ctx.font = '15px Arial';
    ctx.fillText(CFG.WANDS[selectedWand].icon, player.x - 7, player.y + 5);
    
    ctx.restore();
    
    // 6. วาดกระสุน
    projectiles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    });
    
    // 7. วาดอนุภาคเอฟเฟกต์สะเก็ดไฟ
    particles.forEach(pt => {
        ctx.save();
        ctx.globalAlpha = pt.alpha;
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    });
}

// วาดกลไกโพรแทรกเตอร์เรืองแสงนีออน (Protractor Overlay)
function drawProtractorOverlay() {
    const radius = 90;
    
    // แปลงองศาเล็ง
    let currentDeg = Math.round(aimAngle * (180 / Math.PI));
    if (currentDeg < 0) currentDeg += 360;
    
    ctx.save();
    
    // พื้นหลังวงกลมแก้วจาง ๆ
    ctx.fillStyle = 'rgba(13, 16, 27, 0.45)';
    ctx.beginPath();
    ctx.arc(player.x, player.y, radius, 0, Math.PI*2);
    ctx.fill();
    
    // เส้นรอบวงโพรแทรกเตอร์
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x, player.y, radius, 0, Math.PI*2);
    ctx.stroke();
    
    // วาดขีดบอกองศาทุก ๆ 10 และ 30 องศา
    for (let a = 0; a < 360; a += 10) {
        const rad = a * (Math.PI / 180);
        const isMajor = a % 30 === 0;
        const tickLength = isMajor ? 12 : 6;
        
        const sx = player.x + Math.cos(rad) * (radius - tickLength);
        const sy = player.y + Math.sin(rad) * (radius - tickLength);
        const ex = player.x + Math.cos(rad) * radius;
        const ey = player.y + Math.sin(rad) * radius;
        
        ctx.strokeStyle = isMajor ? 'rgba(0, 229, 255, 0.4)' : 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = isMajor ? 2 : 1;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
        
        // พิมพ์เลของศาทุก ๆ 90 องศา
        if (a % 90 === 0) {
            const tx = player.x + Math.cos(rad) * (radius - 22);
            const ty = player.y + Math.sin(rad) * (radius - 22);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
            ctx.font = 'bold 9px Kanit';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${a}°`, tx, ty);
        }
    }
    
    // เข็มองศาการเล็งปัจจุบัน
    const lineX = player.x + Math.cos(aimAngle) * radius;
    const lineY = player.y + Math.sin(aimAngle) * radius;
    ctx.strokeStyle = CFG.WANDS[selectedWand].color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(lineX, lineY);
    ctx.stroke();
    
    ctx.restore();
}

// คณนาทิศสะท้อนของเลเซอร์และวาด (Reflection Raycast Solver)
function drawReflectionPath() {
    let rx = player.x;
    let ry = player.y;
    let rang = aimAngle;
    let bounces = 0;
    const maxBounces = selectedWand === 'beam' ? CFG.WANDS.beam.maxBounces : CFG.WANDS.reflector.maxBounces;
    
    ctx.save();
    ctx.strokeStyle = CFG.WANDS[selectedWand].color;
    ctx.lineWidth = selectedWand === 'beam' ? 3.5 : 1.5;
    ctx.setLineDash(selectedWand === 'beam' ? [] : [5, 4]); // คทาเลเซอร์ยิงเป็นเส้นตรงทึบ คทาสะท้อนเป็นเส้นประ
    
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    
    // ลิมิตวนลูปสะท้อนแสง
    while (bounces < maxBounces) {
        let step = 4;
        let limit = 0;
        let hit = false;
        
        const vx = Math.cos(rang) * step;
        const vy = Math.sin(rang) * step;
        
        // เดินเล็งไปทีละเสี้ยว (Raycasting step)
        while (limit < 300) {
            rx += vx;
            ry += vy;
            limit++;
            
            const col = Math.floor((rx - offsetX) / cellSize);
            const row = Math.floor((ry - offsetY) / cellSize);
            
            // ชนกำแพงธรรมดา
            if (col < 0 || col >= gridCols || row < 0 || row >= gridRows) {
                hit = true;
                break;
            }
            
            const cellType = grid[row][col];
            if (cellType === 1 || (gate && !gate.open && col === gate.gridX && row === gate.gridY)) {
                hit = true;
                break;
            }
            
            // ชนกระจกสะท้อน (เด้ง)
            if (cellType === 2) {
                rang = -rang;
                bounces++;
                hit = true;
                break;
            }
            if (cellType === 3) {
                rang = Math.PI - rang;
                bounces++;
                hit = true;
                break;
            }
            
            // ชนกระจกหมุนได้
            let rotMirror = null;
            rotatableMirrors.forEach(m => {
                const mx = m.gridX * cellSize + cellSize/2 + offsetX;
                const my = m.gridY * cellSize + cellSize/2 + offsetY;
                if (Math.hypot(mx - rx, my - ry) < cellSize * 0.35) {
                    rotMirror = m;
                }
            });
            
            if (rotMirror) {
                const mRad = rotMirror.angle * (Math.PI / 180);
                const nx = Math.cos(mRad + Math.PI/2);
                const ny = Math.sin(mRad + Math.PI/2);
                const rx_v = Math.cos(rang);
                const ry_v = Math.sin(rang);
                const dot = rx_v * nx + ry_v * ny;
                
                const vx_out = rx_v - 2 * dot * nx;
                const vy_out = ry_v - 2 * dot * ny;
                
                rang = Math.atan2(vy_out, vx_out);
                bounces++;
                hit = true;
                // ผลักรังสีออก
                rx += vx_out * 10;
                ry += vy_out * 10;
                break;
            }
        }
        
        ctx.lineTo(rx, ry);
        
        if (!hit || bounces >= maxBounces) break;
    }
    
    ctx.stroke();
    ctx.restore();
}

// ── Helpers ──
function varColor(type) {
    return CFG.ANGLE_TYPES[type]?.color || '#ffffff';
}

function showToast(txt) {
    const t = $('hud-toast');
    t.innerText = txt;
    t.style.display = 'block';
    
    // ดีเลย์ซ่อน
    if (window._toastTimeout) clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => {
        t.style.display = 'none';
    }, 3000);
}

// อัปเดตข้อมูลแถบสถิติและคะแนนด้านบน
function updateHUD() {
    $('score-val').innerText = score.toLocaleString();
    
    // วาดหลอดเกราะชีวิต
    const shieldContainer = $('shield-bar');
    shieldContainer.innerHTML = '';
    for (let s = 0; s < CFG.MAX_SHIELDS; s++) {
        const cell = document.createElement('div');
        cell.className = `shield-cell ${s < shields ? 'filled' : ''}`;
        shieldContainer.appendChild(cell);
    }
    
    // ข้อมูลชื่อคทา
    $('current-wand-val').innerText = CFG.WANDS[selectedWand].name;
    $('current-wand-val').style.color = CFG.WANDS[selectedWand].color;
    
    // คอมโบแท็ก
    if (combo > 1) {
        $('combo-tag').innerText = `COMBO x${combo}`;
        $('combo-tag').style.display = 'block';
    } else {
        $('combo-tag').style.display = 'none';
    }
}

// เปิด-ปิดหน้าต่างข้อมูลเกร็ดมุม
function openTrivia() {
    const modal = $('trivia-modal');
    const content = $('trivia-content');
    content.innerHTML = DATA.ANGLE_TRIVIA.map(t => `
        <div class="trivia-item">
            <div class="ti-title">${t.title}</div>
            <div class="ti-desc">${t.desc}</div>
        </div>
    `).join('');
    modal.style.display = 'flex';
}

function closeTrivia() {
    $('trivia-modal').style.display = 'none';
}

// เมนูเลือกคทาวิเศษ
function openWandModal() {
    const modal = $('wand-modal');
    const gridEl = $('wand-selector-grid');
    
    gridEl.innerHTML = Object.keys(CFG.WANDS).map(key => {
        const w = CFG.WANDS[key];
        return `
            <div class="wand-item-row ${selectedWand === key ? 'active' : ''}" onclick="selectWand('${key}')">
                <div class="wi-icon">${w.icon}</div>
                <div class="wi-info">
                    <div class="wi-name" style="color: ${w.color}">${w.name}</div>
                    <div class="wi-desc">${w.desc}</div>
                </div>
            </div>
        `;
    }).join('');
    
    modal.style.display = 'flex';
}

function selectWand(key) {
    selectedWand = key;
    closeWandModal();
    updateHUD();
    playSound('click');
}

function closeWandModal() {
    $('wand-modal').style.display = 'none';
}

// คลังเสียงสำเร็จรูปของ KAMPAI SDK
function playSound(type) {
    if (type === 'shoot') {
        // ใช้เอฟเฟกต์สะท้อนของเสียง
        KAMPAI.sound.speak('', 'en-US'); // เคลียร์คิวเสียงพูดก่อน
    } else if (type === 'correct') {
        KAMPAI.sound.correct();
    } else if (type === 'wrong') {
        KAMPAI.sound.wrong();
    } else if (type === 'click' || type === 'bounce') {
        // บี๊บสั้น ๆ ชิ่งกระจกเงา
    } else if (type === 'gameover') {
        KAMPAI.sound.gameOver();
    }
}

// ผูกเมนูย่อยเลือกสวมใส่คทากดคลิกที่กล่อง
$('wand-status').addEventListener('click', openWandModal);
