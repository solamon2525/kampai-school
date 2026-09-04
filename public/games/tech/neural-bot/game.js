/* game.js — Neural Bot: AI Space Trainer (ระบบสื่อการสอน Machine Learning สมบูรณ์แบบ) */

const CFG = window.GAME_CONFIG;
const DATA = window.GAME_DATA;

/* ═══ ตั้งค่า KAMPAI SDK ═══ */
KAMPAI.setSlug(CFG.SLUG);
KAMPAI.sound.defaultBgm(CFG.BGM);
KAMPAI.sound.mountToggles();

/* ═══ ข้อมูลนักเรียน & Leaderboard ═══ */
function renderPlayer() {
    const s = KAMPAI.student, st = KAMPAI.stats;
    if (!s) return;
    const chip = document.getElementById('player-chip');
    if (!chip) return;
    const av = s.photoUrl ? `<img src="${s.photoUrl}" alt="">` : `<div class="pc-init">${(s.displayName||'?')[0]}</div>`;
    const best = st ? ` · <span class="pc-best">สถิติ ${st.personalBest.toLocaleString()}</span>` : '';
    chip.innerHTML = av + `<span>${s.displayName}${best}</span>`;
    chip.style.display = 'flex';
}
function renderMyStats() {
    const st = KAMPAI.stats;
    if (!st) return;
    const b = document.getElementById('ms-best');
    const p = document.getElementById('ms-plays');
    if (b) b.innerText = (st.personalBest || 0).toLocaleString();
    if (p) p.innerText = (st.playsCount || 0).toLocaleString();
    const ms = document.getElementById('my-stats');
    if (ms) ms.style.display = 'flex';
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

/* ═══ สภาพแวดล้อม Canvas ═══ */
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let cw = 0, ch = 0;
function resize() {
    cw = canvas.width = window.innerWidth;
    ch = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

/* ═══ สถานะเกม (Game State) ═══ */
let mode = 'adventure';
let score = 0;
let lives = CFG.LIVES;
let missionIdx = 0;
let combo = 0;
let totalCorrect = 0;
let totalActions = 0;
let isGameOver = false;
let isPlaying = false;
let missionTimer = null;
let timeLeft = CFG.MISSION_TIME;
let animFrameId = null;

/* ═══ โมเดล AI และน้ำหนัก (Machine Learning Parameters) ═══ */
let currentWeights = { w1: 1.0, w2: -1.0, bias: 0.0 };
let trainEpochs = 0;
let customRng = Math.random;

/* ═══ วัตถุในอวกาศ (Space Simulation) ═══ */
let stars = [];
let spaceObjects = [];
let currentTarget = null;
let targetScanTimer = 0;
let playerShipY = 0;

/* สร้างพื้นหลังดวงดาว */
function initStars() {
    stars = [];
    for (let i = 0; i < 70; i++) {
        stars.push({
            x: Math.random() * (cw || 800),
            y: Math.random() * (ch || 600),
            size: Math.random() * 2 + 0.8,
            speed: Math.random() * 2 + 0.5,
            opacity: Math.random() * 0.7 + 0.3
        });
    }
}
initStars();

/* ═══ AI Inference & Classification Engine ═══ */
function predict(energy, density) {
    const z = currentWeights.w1 * energy + currentWeights.w2 * density + currentWeights.bias;
    const p = 1 / (1 + Math.exp(-Math.max(-8, Math.min(8, z))));
    const predClass = p >= 0.5 ? 'crystal' : 'debris';
    const conf = Math.round(Math.abs(p - 0.5) * 200);
    return {
        probCrystal: p,
        predictedClass: predClass,
        confidence: Math.min(100, Math.max(0, conf))
    };
}

/* คำนวณ Accuracy และ Loss บน Dataset */
function evaluateModel(mission) {
    if (!mission || !mission.trainSet) return { accuracy: 100, loss: 0 };
    let correct = 0;
    let totalLoss = 0;
    const set = mission.trainSet;
    for (const d of set) {
        const p = predict(d.x, d.y);
        if (p.predictedClass === d.label) correct++;
        const target = d.label === 'crystal' ? 1 : 0;
        const eps = 1e-6;
        const prob = Math.max(eps, Math.min(1 - eps, p.probCrystal));
        totalLoss += -(target * Math.log(prob) + (1 - target) * Math.log(1 - prob));
    }
    const acc = Math.round((correct / set.length) * 100);
    const loss = (totalLoss / set.length).toFixed(2);
    return { accuracy: acc, loss };
}

/* วาดแผนผังข้อมูล 2D ลงใน Graph Canvas */
function renderGraphCanvas(mission) {
    const gCanvas = document.getElementById('graph-canvas');
    if (!gCanvas) return;
    const gCtx = gCanvas.getContext('2d');
    const gw = gCanvas.width;
    const gh = gCanvas.height;

    gCtx.fillStyle = '#090d16';
    gCtx.fillRect(0, 0, gw, gh);

    // วาด Decision Boundary Area แรเงา
    const imgData = gCtx.createImageData(gw, gh);
    const data = imgData.data;
    for (let py = 0; py < gh; py += 4) {
        const y = 1 - (py / gh);
        for (let px = 0; px < gw; px += 4) {
            const x = px / gw;
            const pred = predict(x, y);
            const isC = pred.predictedClass === 'crystal';
            const r = isC ? 2 : 249;
            const g = isC ? 132 : 115;
            const b = isC ? 199 : 22;
            for (let dy = 0; dy < 4 && py + dy < gh; dy++) {
                for (let dx = 0; dx < 4 && px + dx < gw; dx++) {
                    const idx = ((py + dy) * gw + (px + dx)) * 4;
                    data[idx] = r;
                    data[idx + 1] = g;
                    data[idx + 2] = b;
                    data[idx + 3] = 40; // opacity
                }
            }
        }
    }
    gCtx.putImageData(imgData, 0, 0);

    // เส้นแกน
    gCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    gCtx.lineWidth = 1;
    gCtx.beginPath();
    gCtx.moveTo(0, gh); gCtx.lineTo(gw, gh);
    gCtx.moveTo(0, 0); gCtx.lineTo(0, gh);
    gCtx.stroke();

    // เส้น Decision Boundary w1*x + w2*y + b = 0 => y = (-w1*x - b) / w2
    if (Math.abs(currentWeights.w2) > 0.05) {
        gCtx.strokeStyle = '#facc15';
        gCtx.lineWidth = 2.5;
        gCtx.beginPath();
        const yAt0 = (-currentWeights.bias) / currentWeights.w2;
        const yAt1 = (-currentWeights.w1 - currentWeights.bias) / currentWeights.w2;
        const py0 = (1 - yAt0) * gh;
        const py1 = (1 - yAt1) * gh;
        gCtx.moveTo(0, py0);
        gCtx.lineTo(gw, py1);
        gCtx.stroke();
    }

    // วาดจุดข้อมูล Training Set
    if (mission && mission.trainSet) {
        for (const pt of mission.trainSet) {
            const px = pt.x * gw;
            const py = (1 - pt.y) * gh;
            gCtx.beginPath();
            gCtx.arc(px, py, pt.noise ? 7 : 5.5, 0, Math.PI * 2);
            gCtx.fillStyle = pt.label === 'crystal' ? '#38bdf8' : '#f97316';
            gCtx.fill();
            gCtx.strokeStyle = pt.noise ? '#ef4444' : '#ffffff';
            gCtx.lineWidth = pt.noise ? 2 : 1.2;
            gCtx.stroke();
        }
    }
}

/* ปรับ Weights จาก Sliders */
function updateLabWeights() {
    const s1 = document.getElementById('slider-w1');
    const s2 = document.getElementById('slider-w2');
    const sb = document.getElementById('slider-bias');
    if (!s1 || !s2 || !sb) return;

    currentWeights.w1 = parseFloat(s1.value);
    currentWeights.w2 = parseFloat(s2.value);
    currentWeights.bias = parseFloat(sb.value);

    document.getElementById('val-w1').innerText = currentWeights.w1.toFixed(1);
    document.getElementById('val-w2').innerText = currentWeights.w2.toFixed(1);
    document.getElementById('val-bias').innerText = currentWeights.bias.toFixed(1);

    refreshLabUI();
}

/* รีเฟรชข้อมูลในห้อง Lab */
function refreshLabUI() {
    const mission = DATA.MISSIONS[missionIdx] || DATA.MISSIONS[0];
    const metrics = evaluateModel(mission);

    const accEl = document.getElementById('lab-acc');
    const lossEl = document.getElementById('lab-loss');
    const epEl = document.getElementById('lab-epochs');
    if (accEl) accEl.innerText = `${metrics.accuracy}%`;
    if (lossEl) lossEl.innerText = metrics.loss;
    if (epEl) epEl.innerText = trainEpochs;

    renderGraphCanvas(mission);
}

/* ปุ่ม Auto-Train ปรับน้ำหนักอัตโนมัติด้วย Gradient Descent Step */
function autoTrainStep() {
    const mission = DATA.MISSIONS[missionIdx] || DATA.MISSIONS[0];
    if (!mission) return;
    trainEpochs += 10;
    const ideal = mission.idealWeights;

    // เคลื่อนตัวแปรเข้าหา ideal 45%
    currentWeights.w1 = currentWeights.w1 + (ideal.w1 - currentWeights.w1) * 0.45;
    currentWeights.w2 = currentWeights.w2 + (ideal.w2 - currentWeights.w2) * 0.45;
    currentWeights.bias = currentWeights.bias + (ideal.bias - currentWeights.bias) * 0.45;

    document.getElementById('slider-w1').value = currentWeights.w1.toFixed(1);
    document.getElementById('slider-w2').value = currentWeights.w2.toFixed(1);
    document.getElementById('slider-bias').value = currentWeights.bias.toFixed(1);

    document.getElementById('val-w1').innerText = currentWeights.w1.toFixed(1);
    document.getElementById('val-w2').innerText = currentWeights.w2.toFixed(1);
    document.getElementById('val-bias').innerText = currentWeights.bias.toFixed(1);

    KAMPAI.sound.fxFlash(true);
    KAMPAI.sound.correct();
    refreshLabUI();
}

/* ═══ เปิดห้อง Lab สำหรับมิชชัน ═══ */
function openTrainingLab(idx) {
    missionIdx = idx;
    const mission = DATA.MISSIONS[missionIdx];
    if (!mission) {
        endGame();
        return;
    }

    // หยุดชั่วคราวขณะอยู่ในแล็บ
    isPlaying = false;
    document.getElementById('ai-telemetry').style.display = 'none';

    document.getElementById('lab-mission-title').innerText = mission.title;
    document.getElementById('lab-concept').innerHTML = `💡 <strong>หลักการ AI:</strong> ${mission.concept}`;
    document.getElementById('mission-badge').innerText = `ภารกิจ ${idx + 1}/3`;

    // รีเซ็ต Weights เริ่มต้นสำหรับด่านนี้
    currentWeights = { w1: 0.5, w2: -0.5, bias: 0.2 };
    trainEpochs = 0;

    document.getElementById('slider-w1').value = currentWeights.w1;
    document.getElementById('slider-w2').value = currentWeights.w2;
    document.getElementById('slider-bias').value = currentWeights.bias;
    document.getElementById('val-w1').innerText = currentWeights.w1.toFixed(1);
    document.getElementById('val-w2').innerText = currentWeights.w2.toFixed(1);
    document.getElementById('val-bias').innerText = currentWeights.bias.toFixed(1);

    refreshLabUI();
    document.getElementById('training-lab').style.display = 'flex';
}

/* ผู้เล่นกดยืนยันโมเดล & เริ่มลุยอวกาศ */
function deployTrainedAI() {
    const mission = DATA.MISSIONS[missionIdx];
    const metrics = evaluateModel(mission);
    if (metrics.accuracy === 100) {
        setScore(score + CFG.PERFECT_EPOCH_BONUS);
        showToast('🌟 โบนัสเทรนแม่นยำ 100%!');
    }

    document.getElementById('training-lab').style.display = 'none';
    startInferenceRun();
}

/* ═══ ปฏิบัติการในอวกาศ (Inference Run Phase) ═══ */
function startInferenceRun() {
    isPlaying = true;
    spaceObjects = [];
    currentTarget = null;
    targetScanTimer = 0;
    timeLeft = CFG.MISSION_TIME;
    document.getElementById('timer-value').innerText = timeLeft;
    document.getElementById('timer-container').style.display = 'block';
    document.getElementById('ai-telemetry').style.display = 'block';

    if (missionTimer) clearInterval(missionTimer);
    missionTimer = setInterval(() => {
        if (!isPlaying || isGameOver) return;
        timeLeft--;
        document.getElementById('timer-value').innerText = timeLeft;
        if (timeLeft <= 5) {
            document.getElementById('timer-container').classList.add('low');
            KAMPAI.sound.timeUp();
        }
        if (timeLeft <= 0) {
            clearInterval(missionTimer);
            completeCurrentMission();
        }
    }, 1000);
}

/* ผ่านด่านปัจจุบัน */
function completeCurrentMission() {
    isPlaying = false;
    document.getElementById('timer-container').classList.remove('low');
    if (missionIdx < DATA.MISSIONS.length - 1) {
        showToast(`🎉 ผ่านภารกิจที่ ${missionIdx + 1}!`);
        KAMPAI.sound.correct();
        setTimeout(() => {
            openTrainingLab(missionIdx + 1);
        }, 1200);
    } else {
        endGame();
    }
}

/* สร้างวัตถุอวกาศใหม่ */
function spawnSpaceObject() {
    const mission = DATA.MISSIONS[missionIdx] || DATA.MISSIONS[0];
    const pool = mission.trainSet || [];
    const seedPt = pool[Math.floor(customRng() * pool.length)] || { x: 0.8, y: 0.2, label: 'crystal' };

    // เพิ่มสัญญาณรบกวนเล็กน้อย
    const e = Math.max(0.05, Math.min(0.95, seedPt.x + (customRng() - 0.5) * 0.1));
    const d = Math.max(0.05, Math.min(0.95, seedPt.y + (customRng() - 0.5) * 0.1));

    const obj = {
        x: cw + 40,
        y: ch * 0.45 + (customRng() - 0.5) * (ch * 0.3),
        energy: e,
        density: d,
        realClass: seedPt.label,
        size: 28 + e * 18,
        speed: CFG.RUN_SPEED + (missionIdx * 0.8),
        processed: false
    };
    spaceObjects.push(obj);
}

/* ประมวลผลและตัดสินใจของ AI อัตโนมัติเมื่อวัตถุเข้าสู่ระยะสแกน */
function updateTelemetry(obj) {
    if (!obj) {
        document.getElementById('target-name').innerText = 'กำลังตรวจจับ...';
        document.getElementById('sensor-energy').innerText = '0.00';
        document.getElementById('sensor-density').innerText = '0.00';
        document.getElementById('ai-prediction').innerText = 'รอข้อมูล...';
        document.getElementById('ai-confidence-bar').style.width = '0%';
        document.getElementById('ai-confidence-text').innerText = 'ความมั่นใจ: 0%';
        return;
    }

    document.getElementById('target-name').innerText = 'ตรวจพบวัตถุ!';
    document.getElementById('sensor-energy').innerText = obj.energy.toFixed(2);
    document.getElementById('sensor-density').innerText = obj.density.toFixed(2);

    const pred = predict(obj.energy, obj.density);
    const actionName = pred.predictedClass === 'crystal' ? '📥 ดูดเก็บแร่' : '⚡ ยิงทำลาย';
    document.getElementById('ai-prediction').innerText = `${actionName}`;
    document.getElementById('ai-confidence-bar').style.width = `${pred.confidence}%`;
    document.getElementById('ai-confidence-text').innerText = `ความมั่นใจ AI: ${pred.confidence}%`;
}

/* ผู้เล่นกดปุ่ม Override ด้วยตนเอง */
function handlePlayerAction(chosenAction) {
    if (!isPlaying || isGameOver || !currentTarget || currentTarget.processed) return;
    executeResolution(chosenAction, true);
}

/* ประมวลผลการกระทำ (ทั้งจาก AI อัตโนมัติ หรือ มนุษย์ Override) */
function executeResolution(actionClass, isOverride) {
    if (!currentTarget || currentTarget.processed) return;
    currentTarget.processed = true;
    totalActions++;

    const isCorrect = (actionClass === currentTarget.realClass);

    if (isCorrect) {
        totalCorrect++;
        combo++;
        const pts = CFG.CORRECT_POINTS + (isOverride ? CFG.OVERRIDE_BONUS : 0);
        setScore(score + pts);
        renderCombo();
        KAMPAI.sound.correct();
        showPopScore(currentTarget.x, currentTarget.y, `+${pts}`);
        if (vs) vs.report(score, { correct: totalCorrect });
    } else {
        combo = 0;
        renderCombo();
        setLives(lives - 1);
        KAMPAI.sound.wrong();
        document.body.classList.add('shake');
        setTimeout(() => document.body.classList.remove('shake'), 320);
        showToast(isOverride ? '❌ สั่งการผิดพลาด!' : '⚠️ AI จำแนกผิดพลาด (ลำเอียง)!');
    }
}

/* ═══ Keyboard Listeners ═══ */
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        handlePlayerAction('crystal');
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        handlePlayerAction('debris');
    }
});

/* ═══ Main Game Animation Loop ═══ */
function gameLoop() {
    ctx.clearRect(0, 0, cw, ch);

    // วาดดวงดาวพื้นหลัง
    ctx.fillStyle = '#ffffff';
    for (const s of stars) {
        s.x -= s.speed * (isPlaying ? 1.5 : 0.6);
        if (s.x < 0) s.x = cw;
        ctx.globalAlpha = s.opacity;
        ctx.fillRect(s.x, s.y, s.size, s.size);
    }
    ctx.globalAlpha = 1.0;

    // วาดยาน Neural Bot
    playerShipY = ch * 0.5;
    const shipX = 90;
    drawNeuralShip(ctx, shipX, playerShipY);

    if (isPlaying && !isGameOver) {
        targetScanTimer++;
        if (targetScanTimer > 90) {
            targetScanTimer = 0;
            if (spaceObjects.length < 2) spawnSpaceObject();
        }

        let nearestTarget = null;
        let minDistance = 99999;

        for (let i = spaceObjects.length - 1; i >= 0; i--) {
            const obj = spaceObjects[i];
            obj.x -= obj.speed;

            // วาดวัตถุอวกาศ
            drawSpaceObject(ctx, obj);

            // คำนวณระยะห่างเพื่อตรวจจับ
            const dist = obj.x - shipX;
            if (dist > 0 && dist < minDistance) {
                minDistance = dist;
                nearestTarget = obj;
            }

            // ถ้าวัตถุเข้ามาถึงระยะการตัดสินใจอัตโนมัติของ AI
            if (!obj.processed && dist < 160 && dist > 70) {
                const pred = predict(obj.energy, obj.density);
                if (pred.confidence >= (CFG.CONFIDENCE_THRESHOLD * 100)) {
                    currentTarget = obj;
                    executeResolution(pred.predictedClass, false);
                }
            }

            // ถ้าวัตถุหลุดเลยยานไปโดยยังไม่ได้ประมวลผล
            if (dist <= 0) {
                if (!obj.processed) {
                    combo = 0;
                    renderCombo();
                    if (obj.realClass === 'debris') {
                        setLives(lives - 1);
                        KAMPAI.sound.wrong();
                        showToast('💥 ขยะอวกาศพุ่งชนยาน!');
                    }
                }
                spaceObjects.splice(i, 1);
            }
        }

        currentTarget = nearestTarget;
        updateTelemetry(currentTarget);
    }

    animFrameId = requestAnimationFrame(gameLoop);
}

/* วาดยานอวกาศ Neural Bot */
function drawNeuralShip(c, x, y) {
    c.save();
    c.translate(x, y);

    // ลำแสงเครื่องยนต์ด้านหลัง
    c.fillStyle = '#38bdf8';
    c.beginPath();
    c.moveTo(-30, -8);
    c.lineTo(-45 - Math.random() * 12, 0);
    c.lineTo(-30, 8);
    c.fill();

    // ตัวยานหลักทรงโมเดิร์น
    c.fillStyle = '#0f172a';
    c.strokeStyle = '#38bdf8';
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(35, 0);
    c.lineTo(-25, -22);
    c.lineTo(-15, 0);
    c.lineTo(-25, 22);
    c.closePath();
    c.fill();
    c.stroke();

    // โดมสมองกล AI เรืองแสง
    c.fillStyle = '#facc15';
    c.beginPath();
    c.arc(2, 0, 7, 0, Math.PI * 2);
    c.fill();

    // วงแหวนเซ็นเซอร์
    c.strokeStyle = 'rgba(250, 204, 21, 0.6)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(2, 0, 13 + Math.sin(Date.now() / 200) * 2, 0, Math.PI * 2);
    c.stroke();

    c.restore();
}

/* วาดวัตถุอวกาศ */
function drawSpaceObject(c, obj) {
    c.save();
    c.translate(obj.x, obj.y);

    if (obj.realClass === 'crystal') {
        c.fillStyle = '#38bdf8';
        c.strokeStyle = '#e0f2fe';
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(0, -obj.size);
        c.lineTo(obj.size * 0.8, 0);
        c.lineTo(0, obj.size);
        c.lineTo(-obj.size * 0.8, 0);
        c.closePath();
        c.fill();
        c.stroke();
    } else {
        c.fillStyle = '#ea580c';
        c.strokeStyle = '#fed7aa';
        c.lineWidth = 2;
        c.beginPath();
        c.arc(0, 0, obj.size * 0.75, 0, Math.PI * 2);
        c.fill();
        c.stroke();
    }

    // ป้ายข้อความบอกค่า Sensor ด้านล่าง
    c.fillStyle = '#ffffff';
    c.font = '11px Kanit';
    c.textAlign = 'center';
    c.fillText(`⚡${obj.energy.toFixed(1)} 🪐${obj.density.toFixed(1)}`, 0, obj.size + 14);

    c.restore();
}

/* ═══ UI Helpers: Score, Lives, Toasts ═══ */
const $ = (id) => document.getElementById(id);
function setScore(n) {
    score = Math.max(0, n);
    $('score-value').innerText = score;
    const w = $('score-container');
    w.classList.add('pop');
    setTimeout(() => w.classList.remove('pop'), 150);
}
function setLives(n) {
    lives = Math.max(0, n);
    let s = '';
    for (let i = 0; i < CFG.LIVES; i++) s += (i < lives) ? '❤️' : '🖤';
    $('life-container').innerText = s;
    if (lives <= 0 && mode === 'adventure') endGame();
}
function renderCombo() {
    const b = $('combo-badge');
    b.innerText = combo > 1 ? (`🔥 คอมโบ x${Math.min(CFG.COMBO_MAX, combo)}`) : '';
}
function showToast(msg) {
    const t = $('toast');
    if (!t) return;
    t.innerText = msg;
    t.classList.remove('show');
    void t.offsetWidth;
    t.classList.add('show');
}
function showPopScore(x, y, txt) {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;left:${x}px;top:${y}px;color:#facc15;font-size:20px;font-weight:700;pointer-events:none;z-index:40;text-shadow:0 2px 4px #000;animation:popAnim 0.7s ease-out forwards;`;
    el.innerText = txt;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
}

/* ═══ โหมดแข่งขัน KampaiVersus ═══ */
let vs = null;
if (CFG.ENABLE_ONLINE && window.KampaiVersus) {
    vs = KampaiVersus.create({
        duration: CFG.ONLINE_DURATION,
        title: 'แข่งเทรนบอท AI',
        rankBy: 'score',
        onPlay: function (opts) {
            const rng = (opts && opts.rng) ? opts.rng : Math.random;
            startRound(rng, (opts && opts.player) || null);
        },
        onEnd: function () {
            isGameOver = true;
            isPlaying = false;
        }
    });
    const onlBtn = document.getElementById('online-btn');
    if (onlBtn) onlBtn.style.display = '';
}

/* ═══ รอบการเล่น (Round Lifecycle) ═══ */
function startGame(chosenMode) {
    mode = chosenMode || 'adventure';
    startRound(Math.random, null);
}

function startRound(rng, player) {
    customRng = rng || Math.random;
    score = 0;
    lives = CFG.LIVES;
    combo = 0;
    totalCorrect = 0;
    totalActions = 0;
    missionIdx = 0;
    isGameOver = false;

    setScore(0);
    setLives(CFG.LIVES);
    renderCombo();

    // บังคับเรียก KAMPAI.beginRound() ตอนเริ่มรอบ
    KAMPAI.beginRound();
    KAMPAI.sound.bgmStart();

    document.getElementById('blocker').style.display = 'none';
    document.getElementById('gameover-screen').style.display = 'none';

    openTrainingLab(0);
}

function restartGame() {
    if (missionTimer) clearInterval(missionTimer);
    spaceObjects = [];
    currentTarget = null;
    startRound(Math.random, null);
}

function endGame() {
    isGameOver = true;
    isPlaying = false;
    if (missionTimer) clearInterval(missionTimer);
    KAMPAI.sound.bgmStop();
    KAMPAI.sound.gameOver();

    // ส่งผลลัพธ์ผ่าน Versus หากอยู่ในโหมดแข่งขัน
    if (vs && vs.finish(score, { correct: totalCorrect })) return;

    // คำนวณดาว
    let stars = '☆☆☆';
    if (score >= CFG.STAR_THRESHOLDS[2]) stars = '⭐⭐⭐';
    else if (score >= CFG.STAR_THRESHOLDS[1]) stars = '⭐⭐';
    else if (score >= CFG.STAR_THRESHOLDS[0]) stars = '⭐';

    document.getElementById('go-stars').innerText = stars;
    document.getElementById('final-score').innerText = score.toLocaleString();
    const accRate = totalActions > 0 ? Math.round((totalCorrect / totalActions) * 100) : 0;
    document.getElementById('go-summary').innerText = `ความแม่นยำรวม ${accRate}% · จำแนกสำเร็จ ${totalCorrect} ครั้ง`;

    // บันทึกคะแนนไปยัง Supabase ผ่าน KAMPAI SDK
    KAMPAI.submitScore(score, {
        mode,
        correct: totalCorrect,
        total: totalActions,
        accuracy: accRate
    });

    renderLeaderboard('score-list-gameover');
    document.getElementById('gameover-screen').style.display = 'flex';
    document.getElementById('ai-telemetry').style.display = 'none';
    document.getElementById('training-lab').style.display = 'none';
}

// เริ่ม Game Loop
animFrameId = requestAnimationFrame(gameLoop);
