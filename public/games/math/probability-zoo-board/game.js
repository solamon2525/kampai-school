// Probability Zoo Board Game Engine

let soundManager = null;

// Safe helper for Speech Synthesis
function speakThai(text) {
    if (window.KAMPAI && window.KAMPAI.sound && typeof window.KAMPAI.sound.speak === 'function') {
        window.KAMPAI.sound.speak(text, 'th-TH');
    } else if (typeof SpeechSynthesisUtterance !== 'undefined' && window.speechSynthesis) {
        try {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'th-TH';
            window.speechSynthesis.speak(utterance);
        } catch (e) {
            console.warn('SpeechSynthesis error:', e);
        }
    }
}

class SoundEffects {
    constructor() {
        this.ctx = null;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
                this.masterGain = this.ctx.createGain();
                this.masterGain.connect(this.ctx.destination);
            }
        } catch (e) {
            console.warn('Web Audio not supported:', e);
        }
        this.muted = false;
    }

    toggleMute() {
        this.muted = !this.muted;
        if (!this.masterGain) return this.muted ? "🔇" : "🔊";
        this.masterGain.gain.setValueAtTime(this.muted ? 0 : 1, this.ctx.currentTime);
        return this.muted ? "🔇" : "🔊";
    }

    playPawnStep() {
        this.playTone(300, 450, 0.08, 'sine');
    }

    playDiceRoll() {
        this.playTone(150, 600, 0.4, 'triangle');
    }

    playCorrect() {
        if (window.KAMPAI && window.KAMPAI.sound && typeof window.KAMPAI.sound.correct === 'function') {
            window.KAMPAI.sound.correct();
            return;
        }
        this.playTone(523, 1046, 0.25, 'sine');
    }

    playWrong() {
        if (window.KAMPAI && window.KAMPAI.sound && typeof window.KAMPAI.sound.wrong === 'function') {
            window.KAMPAI.sound.wrong();
            return;
        }
        this.playTone(200, 80, 0.3, 'sawtooth');
    }

    playBonus() {
        this.playTone(600, 1200, 0.3, 'sine');
    }

    playHazard() {
        this.playTone(180, 90, 0.4, 'sawtooth');
    }

    playTone(fStart, fEnd, duration, type = 'sine') {
        if (this.muted || !this.ctx) return;
        try {
            if (this.ctx.state === 'suspended') this.ctx.resume();
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(fStart, this.ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(fEnd, this.ctx.currentTime + duration);
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.warn(e);
        }
    }
}

// Delay helper for step movement
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let players = [
    { id: 1, name: 'Player 1', position: 1, previousPosition: 1, score: 10, stars: 0, shield: false, frozen: 0 },
    { id: 2, name: 'Player 2', position: 1, previousPosition: 1, score: 10, stars: 0, shield: false, frozen: 0 }
];

let currentPlayerIndex = 0; // 0 for Player 1, 1 for Player 2
let gameState = 'START_SCREEN';
let isDiceRolling = false;
let questionsUsed = [];

function generateBoardTiles() {
    const boardArea = document.getElementById('board-area');
    if (!boardArea) return;
    
    // Remove existing board tiles if any (avoid duplicate generation)
    const existingTiles = boardArea.querySelectorAll('.board-tile');
    existingTiles.forEach(el => el.remove());
    
    // Create 32 perimeter tiles dynamically
    for (let i = 0; i < 32; i++) {
        const spec = window.GAME_DATA.tiles[i];
        const coord = window.GAME_DATA.pathCoordinates[i];
        
        const tile = document.createElement('div');
        tile.id = `tile-${i + 1}`;
        tile.className = `board-tile tile-${spec.type}`;
        tile.style.gridColumn = coord.c + 1;
        tile.style.gridRow = coord.r + 1;
        
        tile.innerHTML = `
            <div class="tile-number">${i + 1}</div>
            <div class="tile-icon">${spec.icon}</div>
            <div class="tile-label">${spec.label}</div>
        `;
        
        boardArea.appendChild(tile);
    }
}

function updatePawnPosition(playerIndex) {
    const p = players[playerIndex];
    const pawnEl = document.getElementById(`pawn-${p.id}`);
    const tileEl = document.getElementById(`tile-${p.position}`);
    if (tileEl && pawnEl) {
        tileEl.appendChild(pawnEl);
    }
}

function updateHUD() {
    players.forEach(p => {
        const pScoreEl = document.getElementById(`p${p.id}-score`);
        if (pScoreEl) pScoreEl.innerText = p.score;
        
        const pPosEl = document.getElementById(`p${p.id}-position`);
        if (pPosEl) pPosEl.innerText = p.position;

        const pStarsEl = document.getElementById(`p${p.id}-stars`);
        if (pStarsEl) {
            pStarsEl.innerText = `⭐ ${p.stars} | 🛡️ ${p.shield ? 'มีโล่' : 'ไม่มีโล่'}${p.frozen > 0 ? ' (ถูกแช่แข็ง)' : ''}`;
        }

        // Highlight active turn card
        const cardEl = document.getElementById(`p${p.id}-card`);
        if (cardEl) {
            if (currentPlayerIndex === p.id - 1 && gameState === 'PLAYING') {
                cardEl.classList.add('active-turn');
            } else {
                cardEl.classList.remove('active-turn');
            }
        }
    });
}

function showModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('active');
}

function hideModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('active');
}

async function movePlayer(playerIndex, steps) {
    const p = players[playerIndex];
    p.previousPosition = p.position;

    let targetPos = p.position + steps;
    targetPos = Math.max(1, Math.min(window.GAME_CONFIG.TILE_COUNT, targetPos));

    const movingForward = steps > 0;

    while (p.position !== targetPos) {
        if (movingForward) p.position++;
        else p.position--;
        
        updatePawnPosition(playerIndex);
        updateHUD();
        if (soundManager) soundManager.playPawnStep();
        
        await delay(window.GAME_CONFIG.STEP_DELAY);
    }

    handleTileLanding(playerIndex);
}

function handleTileLanding(playerIndex) {
    const p = players[playerIndex];
    const tileSpec = window.GAME_DATA.tiles[p.position - 1];

    if (tileSpec.type === 'start') {
        shiftTurn();
    } else if (tileSpec.type === 'finish') {
        endGame(true);
    } else if (tileSpec.type === 'quiz') {
        triggerQuizModal();
    } else if (tileSpec.type === 'power') {
        triggerPowerupTile(p.position - 1);
    } else if (tileSpec.type === 'obstacle') {
        triggerObstacleTile(p.position - 1);
    } else if (tileSpec.type === 'activity') {
        triggerActivityTile(p.position - 1);
    }
}

// 🟦 1. Quiz Question Handler
function triggerQuizModal() {
    // Select an unused question
    let availableQuestions = window.GAME_DATA.questions.filter((_, idx) => !questionsUsed.includes(idx));
    if (availableQuestions.length === 0) {
        questionsUsed = []; // Reset pool if exhausted
        availableQuestions = window.GAME_DATA.questions;
    }
    
    const randomIdx = Math.floor(Math.random() * availableQuestions.length);
    const qObj = availableQuestions[randomIdx];
    
    // Track used question index
    const originalIdx = window.GAME_DATA.questions.indexOf(qObj);
    questionsUsed.push(originalIdx);

    const qTextEl = document.getElementById('question-text');
    if (qTextEl) qTextEl.innerText = qObj.q;

    // Speak math question aloud in Thai
    speakThai(qObj.q);

    const optionsGrid = document.getElementById('options-grid');
    if (optionsGrid) {
        optionsGrid.innerHTML = '';
        qObj.options.forEach((opt, idx) => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = opt;
            btn.onclick = () => evaluateQuizAnswer(idx, qObj.ans);
            optionsGrid.appendChild(btn);
        });
    }

    const feedbackEl = document.getElementById('quiz-feedback');
    if (feedbackEl) feedbackEl.classList.add('hidden');
    
    const closeBtn = document.getElementById('quiz-close-btn');
    if (closeBtn) closeBtn.classList.add('hidden');

    showModal('quiz-modal');
}

function evaluateQuizAnswer(selectedIdx, correctIdx) {
    const isCorrect = (selectedIdx === correctIdx);
    const p = players[currentPlayerIndex];

    const feedbackEl = document.getElementById('quiz-feedback');
    if (feedbackEl) {
        feedbackEl.classList.remove('hidden');
        if (isCorrect) {
            feedbackEl.innerText = "✅ ตอบถูกต้อง! ได้รับ +3 คะแนน";
            feedbackEl.style.color = "#10b981";
            p.score += 3;
            if (soundManager) soundManager.playCorrect();
        } else {
            feedbackEl.innerText = "❌ ตอบผิด! โดนหัก -1 คะแนน";
            feedbackEl.style.color = "#ef4444";
            p.score = Math.max(0, p.score - 1);
            if (soundManager) soundManager.playWrong();
        }
    }

    // Disable all options buttons to prevent multiple clicks
    const btns = document.querySelectorAll('.option-btn');
    btns.forEach(btn => btn.disabled = true);

    const closeBtn = document.getElementById('quiz-close-btn');
    if (closeBtn) {
        closeBtn.classList.remove('hidden');
        closeBtn.onclick = () => {
            hideModal('quiz-modal');
            updateHUD();
            shiftTurn();
        };
    }
}

// 🟩 2. Power-up Tiles Handler
function triggerPowerupTile(tileIndex) {
    const p = players[currentPlayerIndex];
    const spec = window.GAME_DATA.tiles[tileIndex];

    const cardTitle = document.getElementById('card-title');
    if (cardTitle) cardTitle.innerText = "🟩 พลังวิเศษสัตว์ป่า";
    
    const cardIcon = document.getElementById('card-icon');
    if (cardIcon) cardIcon.innerText = "🦖";

    const cardDesc = document.getElementById('card-description');
    
    if (soundManager) soundManager.playBonus();

    if (tileIndex === 2) { // เดินหน้า 2 ช่อง
        if (cardDesc) cardDesc.innerText = `${p.name} ได้รับพลังไดโนเสาร์ เดินหน้าต่ออีก 2 ช่อง!`;
        setupCardClose(() => movePlayer(currentPlayerIndex, 2));
    } else if (tileIndex === 8) { // โบนัส 3 คะแนน
        p.score += 3;
        if (cardDesc) cardDesc.innerText = `${p.name} ได้พบสิงโตใจดี ได้รับแต้มโบนัส +3 คะแนน!`;
        setupCardClose(() => shiftTurn());
    } else if (tileIndex === 14) { // ทอยอีกครั้ง
        if (cardDesc) cardDesc.innerText = `${p.name} ได้รับความเร็วจากเสือชีตาห์ ทอยลูกเต๋าเพิ่มได้อีกรอบ!`;
        // Setup state to repeat turn
        setupCardClose(() => {
            hideModal('card-modal');
            isDiceRolling = false; // Allow rolling again immediately
            updateHUD();
        });
        return; // Skip normal close transition
    } else if (tileIndex === 20) { // รับดาวพิเศษ (Shield)
        p.stars++;
        p.shield = true;
        if (cardDesc) cardDesc.innerText = `${p.name} ได้กระดองเต่าวิเศษ ป้องกันภัยคุกคามในตาหน้า! (ได้ดาว +1)`;
        setupCardClose(() => shiftTurn());
    } else if (tileIndex === 26) { // รับเหรียญโบนัส
        p.score += 2;
        if (cardDesc) cardDesc.innerText = `${p.name} ได้เก็บเหรียญนกยูงทองคำ ได้แต้มสะสม +2 คะแนน!`;
        setupCardClose(() => shiftTurn());
    } else if (tileIndex === 29) { // เพิ่มพลังการทอย
        p.stars++;
        if (cardDesc) cardDesc.innerText = `${p.name} ได้ปีกนกฟีนิกซ์ รอบหน้าคะแนนลูกเต๋าจะบวกเพิ่ม 1 แต้ม!`;
        setupCardClose(() => shiftTurn());
    }

    showModal('card-modal');
}

// 🟥 3. Obstacle Tiles Handler
function triggerObstacleTile(tileIndex) {
    const p = players[currentPlayerIndex];
    const spec = window.GAME_DATA.tiles[tileIndex];

    const cardTitle = document.getElementById('card-title');
    if (cardTitle) cardTitle.innerText = "🟥 อุปสรรคสัตว์ดุร้าย";
    
    const cardIcon = document.getElementById('card-icon');
    if (cardIcon) cardIcon.innerText = "🦂";

    const cardDesc = document.getElementById('card-description');
    
    if (soundManager) soundManager.playHazard();

    // Check if player has active shield
    if (p.shield) {
        p.shield = false; // Break shield
        if (cardDesc) cardDesc.innerText = `🛡️ ${p.name} ใช้โล่กระดองเต่าสะท้อนสิ่งกีดขวาง! รอดพ้นอันตรายแบบหวุดหวิด`;
        setupCardClose(() => shiftTurn());
        showModal('card-modal');
        return;
    }

    if (tileIndex === 4) { // ถอยหลัง 2 ช่อง
        if (cardDesc) cardDesc.innerText = `${p.name} ถูกหมีควายไล่ล่า ตกใจวิ่งถอยหลังไป 2 ช่อง!`;
        setupCardClose(() => movePlayer(currentPlayerIndex, -2));
    } else if (tileIndex === 10) { // เสีย 2 คะแนน
        p.score = Math.max(0, p.score - 2);
        if (cardDesc) cardDesc.innerText = `${p.name} ถูกลิงจอมซนขโมยเหรียญ แต้มลดลง -2 คะแนน!`;
        setupCardClose(() => shiftTurn());
    } else if (tileIndex === 16) { // หยุดเดิน 1 ตา
        p.frozen = 1;
        if (cardDesc) cardDesc.innerText = `${p.name} หลงทางเข้าไปในดงงูเงี้ยวเขี้ยวขอ ต้องหยุดพักรักษาแผล 1 ตา!`;
        setupCardClose(() => shiftTurn());
    } else if (tileIndex === 22) { // แช่แข็ง 1 ตา
        p.frozen = 1;
        if (cardDesc) cardDesc.innerText = `${p.name} ถูกหนาวเหน็บด้วยพายุน้ำแข็งหมีขั้วโลก ขยับตัวไม่ได้ 1 รอบ!`;
        setupCardClose(() => shiftTurn());
    } else if (tileIndex === 28) { // กลับจุดก่อนหน้า
        if (cardDesc) cardDesc.innerText = `${p.name} ถูกกับดักของกรงหมาป่า ต้องเดินย้ายกลับไปจุดยืนก่อนหน้านี้!`;
        setupCardClose(() => {
            const stepsBack = p.previousPosition - p.position;
            movePlayer(currentPlayerIndex, stepsBack);
        });
    } else if (tileIndex === 30) { // พลาดโอกาส
        p.score = Math.max(0, p.score - 1);
        if (cardDesc) cardDesc.innerText = `${p.name} พลาดท่าสะดุดโขดหินล้ม แต้มลบ -1 คะแนน!`;
        setupCardClose(() => shiftTurn());
    }

    showModal('card-modal');
}

// 🟨 4. Activity Tiles Handler (Lucky Wheel spinner / Card Draw)
function triggerActivityTile(tileIndex) {
    if (tileIndex === 11 || tileIndex === 23) { // Lucky Wheel spinner
        triggerLuckySpinner();
    } else { // Card Draw or swap positions
        triggerCardDraw(tileIndex);
    }
}

function triggerCardDraw(tileIndex) {
    const p = players[currentPlayerIndex];
    const otherP = players[1 - currentPlayerIndex];
    
    const cardTitle = document.getElementById('card-title');
    if (cardTitle) cardTitle.innerText = "🟨 การ์ดกิจกรรมสุ่ม";
    
    const cardIcon = document.getElementById('card-icon');
    if (cardIcon) cardIcon.innerText = "🃏";

    const cardDesc = document.getElementById('card-description');

    if (tileIndex === 17) { // สลับตำแหน่ง
        if (cardDesc) cardDesc.innerText = `🔄 คาถาจระเข้หมุน! สลับตำแหน่งบอร์ดของ ${p.name} และ ${otherP.name} สลับกรงสัตว์กัน!`;
        setupCardClose(() => {
            const temp = p.position;
            p.position = otherP.position;
            otherP.position = temp;
            updatePawnPosition(0);
            updatePawnPosition(1);
            updateHUD();
            shiftTurn();
        });
    } else { // สุ่มภารกิจทั่วไป
        const r = Math.random();
        if (r < 0.3) {
            p.score += 4;
            if (cardDesc) cardDesc.innerText = `🎁 ภารกิจสำเร็จ: ป้อนอาหารสัตว์ตามหลักโภชนาการ ได้แต้ม +4 คะแนน!`;
        } else if (r < 0.6) {
            p.score = Math.max(0, p.score - 2);
            if (cardDesc) cardDesc.innerText = `🕸️ ภารกิจล้มเหลว: กวาดใยแมงมุมหน้ากรงแล้วโดนกัด แต้มลดลง -2 คะแนน`;
        } else {
            p.shield = true;
            if (cardDesc) cardDesc.innerText = `🛡️ ได้รับอุปกรณ์ป้องกัน: พบชุดเกราะสัตวแพทย์ ได้รับโล่ป้องกันความน่าจะเป็น!`;
        }
        setupCardClose(() => shiftTurn());
    }

    showModal('card-modal');
}

function triggerLuckySpinner() {
    const resultEl = document.getElementById('spinner-result');
    if (resultEl) resultEl.innerText = "";
    
    const wheel = document.getElementById('spinner-wheel');
    if (wheel) wheel.style.transform = `rotate(0deg)`;

    const spinBtn = document.getElementById('spinner-spin-btn');
    if (spinBtn) {
        spinBtn.classList.remove('hidden');
        spinBtn.onclick = () => spinTheWheel();
    }
    
    const closeBtn = document.getElementById('spinner-close-btn');
    if (closeBtn) closeBtn.classList.add('hidden');

    showModal('spinner-modal');
}

function spinTheWheel() {
    const spinBtn = document.getElementById('spinner-spin-btn');
    if (spinBtn) spinBtn.classList.add('hidden');

    const randomDeg = Math.floor(Math.random() * 360) + 1800; // spin at least 5 times
    const wheel = document.getElementById('spinner-wheel');
    if (wheel) {
        wheel.style.transform = `rotate(${randomDeg}deg)`;
    }

    setTimeout(() => {
        const finalAngle = randomDeg % 360;
        // conic-gradient segments:
        // blue: 0-90 (conic draws clockwise: pointer is at top, which is angle 0. 
        // Wheel rotates clockwise by randomDeg, so the pointer lands on angle: (360 - finalAngle)
        const pointerAngle = (360 - (finalAngle % 360)) % 360;
        const p = players[currentPlayerIndex];
        let resultMsg = "";
        
        if (soundManager) soundManager.playBonus();

        if (pointerAngle >= 0 && pointerAngle < 90) { // Blue segment: Bonus
            p.score += 4;
            resultMsg = "🔵 โบนัสสีน้ำเงิน: ได้รับ +4 แต้มสะสม!";
        } else if (pointerAngle >= 90 && pointerAngle < 180) { // Green segment: Walk forward
            resultMsg = "🟢 ช่องสีเขียว: เดินทอดกล้วยต่อไปอีก 3 ก้าว!";
            setupSpinnerClose(() => movePlayer(currentPlayerIndex, 3));
            showSpinnerResult(resultMsg);
            return;
        } else if (pointerAngle >= 180 && pointerAngle < 270) { // Red segment: Penalty
            p.score = Math.max(0, p.score - 3);
            resultMsg = "🔴 ช่องสีแดง: ทำความสะอาดบ่อเต่า แต้มหักลดลง -3 คะแนน";
        } else { // Yellow segment: Freeze
            p.frozen = 1;
            resultMsg = "🟡 ช่องสีเหลือง: เสียหลักขาลื่นล้มในอุโมงค์ หยุดเล่นตาหน้า 1 รอบ";
        }

        showSpinnerResult(resultMsg);
        setupSpinnerClose(() => shiftTurn());
    }, 3000);
}

function showSpinnerResult(text) {
    const resultEl = document.getElementById('spinner-result');
    if (resultEl) resultEl.innerText = text;
    
    const closeBtn = document.getElementById('spinner-close-btn');
    if (closeBtn) closeBtn.classList.remove('hidden');
}

function setupSpinnerClose(callback) {
    const closeBtn = document.getElementById('spinner-close-btn');
    if (closeBtn) {
        closeBtn.onclick = () => {
            hideModal('spinner-modal');
            updateHUD();
            callback();
        };
    }
}

function setupCardClose(callback) {
    const closeBtn = document.getElementById('card-close-btn');
    if (closeBtn) {
        closeBtn.onclick = () => {
            hideModal('card-modal');
            updateHUD();
            callback();
        };
    }
}

// 🎲 3D Dice Roll Action
function handleDiceRoll() {
    if (isDiceRolling || gameState !== 'PLAYING') return;
    
    // Check if player is frozen
    const p = players[currentPlayerIndex];
    if (p.frozen > 0) {
        p.frozen--;
        const cardTitle = document.getElementById('card-title');
        if (cardTitle) cardTitle.innerText = "❄️ แช่แข็งขยับไม่ได้";
        const cardIcon = document.getElementById('card-icon');
        if (cardIcon) cardIcon.innerText = "⛄";
        const cardDesc = document.getElementById('card-description');
        if (cardDesc) cardDesc.innerText = `${p.name} ถูกแช่แข็ง ข้ามตานี้ไปโดยอัติโนมัติ!`;
        
        setupCardClose(() => shiftTurn());
        showModal('card-modal');
        return;
    }

    isDiceRolling = true;
    if (soundManager) soundManager.playDiceRoll();

    const rollVal = Math.floor(Math.random() * 6) + 1;
    
    // Animating 3D cube rotations
    rollDiceAnimation(rollVal);

    setTimeout(() => {
        // Apply wing/phoenix Phoenix spin booster
        let finalSteps = rollVal;
        if (p.stars > 0) {
            p.stars--; // Consume booster star
            finalSteps += 1;
            speakThai(`ทอยเต๋าได้ ${rollVal} ได้แต้มปีกเสริมบวกหนึ่ง เดินหน้า ${finalSteps} ก้าว`);
        } else {
            speakThai(`ทอยได้ ${rollVal} แต้ม`);
        }
        
        movePlayer(currentPlayerIndex, finalSteps);
    }, 1000);
}

function rollDiceAnimation(num) {
    const cube = document.getElementById('dice-cube');
    if (!cube) return;
    
    // Random spins
    const xRotations = [0, 90, 180, 270, 360, 450];
    const yRotations = [0, 90, 180, 270, 360, 450];
    
    const rx = xRotations[Math.floor(Math.random() * xRotations.length)] + 1440;
    const ry = yRotations[Math.floor(Math.random() * yRotations.length)] + 1440;
    
    let targetX = rx;
    let targetY = ry;
    
    if (num === 1) { targetX = 360; targetY = 360; }
    else if (num === 2) { targetX = 360; targetY = 270; }
    else if (num === 3) { targetX = 360; targetY = 180; }
    else if (num === 4) { targetX = 360; targetY = 90; }
    else if (num === 5) { targetX = 270; targetY = 360; }
    else if (num === 6) { targetX = 90; targetY = 360; }
    
    cube.style.transform = `rotateX(${targetX}deg) rotateY(${targetY}deg)`;
}

function shiftTurn() {
    currentPlayerIndex = 1 - currentPlayerIndex;
    isDiceRolling = false;
    updateHUD();
}

function startGame() {
    soundManager = new SoundEffects();
    
    const startScreen = document.getElementById('start-screen');
    if (startScreen) startScreen.classList.add('hidden');
    
    // Mount SDK mobile controller
    if (window.KAMPAI && window.KAMPAI.controls) {
        window.KAMPAI.controls.mount({
            dpad: false,
            buttons: [
                { label: 'ROLL', key: 'Space', color: '#f59e0b' }
            ]
        });
    }

    // Reset parameters
    players = [
        { id: 1, name: 'Player 1', position: 1, previousPosition: 1, score: window.GAME_CONFIG.START_SCORE, stars: 0, shield: false, frozen: 0 },
        { id: 2, name: 'Player 2', position: 1, previousPosition: 1, score: window.GAME_CONFIG.START_SCORE, stars: 0, shield: false, frozen: 0 }
    ];
    currentPlayerIndex = 0;
    isDiceRolling = false;
    gameState = 'PLAYING';
    questionsUsed = [];

    generateBoardTiles();
    
    // Setup pawns in start tile
    updatePawnPosition(0);
    updatePawnPosition(1);

    updateHUD();
}

function endGame(completed = true) {
    gameState = 'GAME_OVER';
    
    const goScreen = document.getElementById('game-over-screen');
    if (goScreen) goScreen.classList.remove('hidden');

    const s1 = players[0].score;
    const s2 = players[1].score;

    const f1 = document.getElementById('final-score-p1');
    if (f1) f1.innerText = s1;
    const f2 = document.getElementById('final-score-p2');
    if (f2) f2.innerText = s2;

    let winnerText = "";
    let finalMaxScore = s1;
    if (s1 > s2) {
        winnerText = "Player 1 (🔴) ชนะการผจญภัย!";
        finalMaxScore = s1;
    } else if (s2 > s1) {
        winnerText = "Player 2 (🔵) ชนะการผจญภัย!";
        finalMaxScore = s2;
    } else {
        winnerText = "เสมอกัน! แบ่งรางวัลสวนสัตว์ร่วมกัน";
        finalMaxScore = s1;
    }

    const wText = document.getElementById('winner-text');
    if (wText) wText.innerText = winnerText;

    // Submit max score to KAMPAI SDK
    if (window.KAMPAI) {
        window.KAMPAI.submitScore(finalMaxScore, {
            mode: 'normal'
        });
    }

    // Update Local Leaderboard fallback
    try {
        let localData = [];
        const local = localStorage.getItem('probability_zoo_leaderboard');
        if (local) localData = JSON.parse(local);
        
        const name = (window.KAMPAI && window.KAMPAI.student) ? window.KAMPAI.student.name : 'Racer Co-op';
        localData.push({ name: name, score: finalMaxScore });
        localData.sort((a, b) => b.score - a.score);
        localStorage.setItem('probability_zoo_leaderboard', JSON.stringify(localData.slice(0, 10)));
    } catch (e) {
        console.error(e);
    }
}

function showLeaderboard() {
    gameState = 'LEADERBOARD';
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('leaderboard-screen').classList.remove('hidden');

    const tbody = document.getElementById('lb-table-body');
    if (tbody) {
        tbody.innerHTML = '';
        
        let list = [];
        if (window.KAMPAI && window.KAMPAI.leaderboard && window.KAMPAI.leaderboard.length > 0) {
            list = window.KAMPAI.leaderboard.slice(0, 5);
        } else {
            try {
                const local = localStorage.getItem('probability_zoo_leaderboard');
                if (local) list = JSON.parse(local).slice(0, 5);
            } catch (e) {
                console.error(e);
            }
        }
        
        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#888;">ไม่มีข้อมูลสถิติสูงสุด</td></tr>';
        } else {
            list.forEach((row, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="color: gold; font-weight:bold;">#${idx + 1}</td>
                    <td>${escapeHTML(row.name || row.student?.name || 'Racer')}</td>
                    <td style="color: #fbbf24; font-weight:bold;">${Math.floor(row.score)}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    }
}

function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Bind HUD controls & DOM listeners
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        generateBoardTiles();
        
        // Start Click
        const btnStart = document.getElementById('btn-start');
        if (btnStart) btnStart.onclick = () => startGame();

        // Roll Click
        const rollBtn = document.getElementById('roll-btn');
        if (rollBtn) rollBtn.onclick = () => handleDiceRoll();

        // Leaderboard Click
        const btnLeaderboard = document.getElementById('btn-leaderboard');
        if (btnLeaderboard) btnLeaderboard.onclick = () => showLeaderboard();

        const closeLbBtn = document.getElementById('close-lb-btn');
        if (closeLbBtn) {
            closeLbBtn.onclick = () => {
                document.getElementById('leaderboard-screen').classList.add('hidden');
                document.getElementById('start-screen').classList.remove('hidden');
            };
        }

        const btnExit = document.getElementById('btn-exit');
        if (btnExit) {
            btnExit.onclick = () => {
                if (window.KAMPAI) window.KAMPAI.goHome();
            };
        }

        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.onclick = () => {
                document.getElementById('game-over-screen').classList.add('hidden');
                document.getElementById('start-screen').classList.remove('hidden');
            };
        }

        // Mute button hook
        const muteBtn = document.getElementById('mute-btn');
        if (muteBtn) {
            muteBtn.onclick = (e) => {
                if (soundManager) {
                    const icon = soundManager.toggleMute();
                    e.target.innerText = icon + " เสียง";
                    e.target.blur();
                }
            };
        }

        // Bind Space Key as roll shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && gameState === 'PLAYING') {
                e.preventDefault();
                handleDiceRoll();
            }
        });
    });
}

// Connect SDK Ready hooks
if (window.KAMPAI) {
    window.KAMPAI.setSlug((window.GAME_CONFIG && window.GAME_CONFIG.SLUG) ? window.GAME_CONFIG.SLUG : 'probability-zoo-board');
    window.KAMPAI.onReady((k) => {
        if (k.student) {
            const pc = document.getElementById('player-chip');
            if (pc) pc.innerText = `👤 ${k.student.name}`;
        }
        if (k.stats) {
            const best = document.getElementById('ms-best');
            if (best) best.innerText = k.stats.bestScore || 0;
            const plays = document.getElementById('ms-plays');
            if (plays) plays.innerText = k.stats.plays || 0;
        }
    });
}
