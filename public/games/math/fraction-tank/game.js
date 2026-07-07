/**
 * Fraction Tank Battle - Game Logic & SDK Integration
 */

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Polyfill for drawRoundedRect to support the rendering checks
CanvasRenderingContext2D.prototype.drawRoundedRect = function(x, y, width, height, radius) {
    this.beginPath();
    if (typeof this.roundRect === 'function') {
        this.roundRect(x, y, width, height, radius);
    } else {
        this.moveTo(x + radius, y);
        this.lineTo(x + width - radius, y);
        this.quadraticCurveTo(x + width, y, x + width, y + radius);
        this.lineTo(x + width, y + height - radius);
        this.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        this.lineTo(x + radius, y + height);
        this.quadraticCurveTo(x, y + height, x, y + height - radius);
        this.lineTo(x, y + radius);
        this.quadraticCurveTo(x, y, x + radius, y);
    }
    this.fill();
};

// --- SOUND SYSTEM ---
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
const audioCtx = AudioContextClass ? new AudioContextClass() : null;

const sfx = {
    moveOsc: null, moveGain: null, bgmInterval: null, isMusicPlaying: false,
    init: function() { 
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    },
    toggleBGM: function() { 
        if (this.isMusicPlaying) {
            this.stopBGM(); 
        } else {
            this.playBGM();
        }
        return this.isMusicPlaying; 
    },
    playBGM: function() {
        if (!audioCtx || this.isMusicPlaying) return;
        this.init(); this.isMusicPlaying = true;
        let step = 0; const tempo = 150; 
        const playBeat = () => {
            if (!this.isMusicPlaying) return;
            const t = audioCtx.currentTime;
            
            if (step % 4 === 0) {
                const osc = audioCtx.createOscillator(); const g = audioCtx.createGain();
                osc.frequency.setValueAtTime(120, t); osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.2);
                g.gain.setValueAtTime(0.3, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
                osc.connect(g); g.connect(audioCtx.destination); osc.start(t); osc.stop(t + 0.2);
            }
            if (step % 8 === 4) {
                const noise = audioCtx.createBufferSource();
                const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.1, audioCtx.sampleRate);
                const data = buffer.getChannelData(0);
                for(let i=0; i<data.length; i++) data[i] = Math.random() * 2 - 1;
                noise.buffer = buffer;
                const g = audioCtx.createGain();
                const filter = audioCtx.createBiquadFilter();
                filter.type = 'highpass'; filter.frequency.value = 1000;
                g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
                noise.connect(filter); filter.connect(g); g.connect(audioCtx.destination);
                noise.start(t);
            }

            const notes = [55.00, 55.00, 65.41, 55.00, 73.42, 55.00, 82.41, 65.41];
            const oscB = audioCtx.createOscillator();
            const gB = audioCtx.createGain();
            oscB.type = 'sawtooth';
            oscB.frequency.setValueAtTime(notes[step % 8], t);
            gB.gain.setValueAtTime(0.12, t);
            gB.gain.exponentialRampToValueAtTime(0.01, t + 0.15);
            const filterB = audioCtx.createBiquadFilter();
            filterB.type = 'lowpass'; filterB.frequency.value = 500;
            oscB.connect(filterB); filterB.connect(gB); gB.connect(audioCtx.destination);
            oscB.start(t); oscB.stop(t + 0.15);

            step++;
        };
        try {
            playBeat(); 
            this.bgmInterval = setInterval(playBeat, tempo);
        } catch (e) {
            console.warn("Audio BGM error:", e);
        }
    },
    stopBGM: function() { 
        this.isMusicPlaying = false; 
        if (this.bgmInterval) { 
            clearInterval(this.bgmInterval); 
            this.bgmInterval = null; 
        } 
    },
    startMove: function() {
        if (!audioCtx) return;
        this.init(); if (this.moveOsc) return; 
        try {
            this.moveOsc = audioCtx.createOscillator(); this.moveGain = audioCtx.createGain();
            this.moveOsc.type = 'sawtooth'; this.moveOsc.frequency.setValueAtTime(40, audioCtx.currentTime); 
            const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 100;
            this.moveGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
            this.moveOsc.connect(filter); filter.connect(this.moveGain); this.moveGain.connect(audioCtx.destination);
            this.moveOsc.start();
        } catch (e) {
            this.moveOsc = null;
        }
    },
    stopMove: function() {
        if (this.moveOsc && audioCtx) {
            try {
                const t = audioCtx.currentTime; this.moveGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
                this.moveOsc.stop(t + 0.1); 
            } catch (e) {}
            this.moveOsc = null; this.moveGain = null;
        }
    },
    startCharge: function() { this.init(); },
    updateCharge: function(percent) { },
    stopCharge: function(immediate = false) { },
    maxCharge: function() {
        if (!audioCtx) return;
        this.init(); const t = audioCtx.currentTime; const osc = audioCtx.createOscillator(); const g = audioCtx.createGain();
        osc.type = 'sine'; osc.frequency.setValueAtTime(880, t); g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc.connect(g); g.connect(audioCtx.destination); osc.start(t); osc.stop(t + 0.1);
    },
    shoot: function(isEnemy = false) {
        if (!audioCtx) return;
        this.init(); const t = audioCtx.currentTime; const duration = 0.2;
        try {
            const bufferSize = audioCtx.sampleRate * duration; const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
            const noiseGain = audioCtx.createGain(); const vol = isEnemy ? 0.2 : 0.3;
            noiseGain.gain.setValueAtTime(vol, t); noiseGain.gain.exponentialRampToValueAtTime(0.01, t + duration);
            
            const osc = audioCtx.createOscillator();
            osc.type = 'square';
            osc.frequency.setValueAtTime(isEnemy ? 80 : 120, t);
            osc.frequency.exponentialRampToValueAtTime(0.01, t + duration);
            const oscGain = audioCtx.createGain();
            oscGain.gain.setValueAtTime(vol + 0.1, t);
            oscGain.gain.exponentialRampToValueAtTime(0.01, t + duration);

            noise.connect(noiseGain); noiseGain.connect(audioCtx.destination);
            osc.connect(oscGain); oscGain.connect(audioCtx.destination);
            
            noise.start(t); noise.stop(t + duration);
            osc.start(t); osc.stop(t + duration);
        } catch (e) {}
    },
    hit: function(isCorrect) {
        if (!audioCtx) return;
        this.init(); const t = audioCtx.currentTime; const duration = 0.5;
        try {
            if (isCorrect) {
                const osc = audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, t);
                osc.frequency.linearRampToValueAtTime(1200, t + 0.1);
                const gain = audioCtx.createGain();
                gain.gain.setValueAtTime(0.2, t);
                gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
                osc.connect(gain); gain.connect(audioCtx.destination);
                osc.start(t); osc.stop(t + duration);
            } else {
                this.explode();
            }
        } catch (e) {}
    },
    explode: function() {
        if (!audioCtx) return;
        this.init(); const t = audioCtx.currentTime; const duration = 0.6;
        try {
            const bufferSize = audioCtx.sampleRate * duration; const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0); for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
            const gain = audioCtx.createGain(); gain.gain.setValueAtTime(0.6, t); gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
            const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 150;
            noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
            noise.start(t); noise.stop(t + duration);
        } catch (e) {}
    },
    reload: function() {
        if (!audioCtx) return;
        this.init(); const t = audioCtx.currentTime; const duration = 0.3;
        try {
            const osc = audioCtx.createOscillator(); const g = audioCtx.createGain();
            osc.type = 'triangle'; osc.frequency.setValueAtTime(440, t); g.gain.setValueAtTime(0.1, t); g.gain.exponentialRampToValueAtTime(0.01, t + duration);
            osc.connect(g); g.connect(audioCtx.destination); osc.start(t); osc.stop(t + duration);
        } catch (e) {}
    },
    healthUp: function() { 
        if (!audioCtx) return;
        this.init(); const t = audioCtx.currentTime; const osc = audioCtx.createOscillator(); const g = audioCtx.createGain();
        try {
            osc.type = 'sine'; osc.frequency.setValueAtTime(600, t); osc.frequency.linearRampToValueAtTime(800, t + 0.1); osc.frequency.linearRampToValueAtTime(1000, t + 0.2);
            g.gain.setValueAtTime(0.2, t); g.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
            osc.connect(g); g.connect(audioCtx.destination); osc.start(t); osc.stop(t + 0.4);
        } catch (e) {}
    }
};

let gameState = {
    isPlaying: false, 
    score: 0, level: 1, ammo: 5, lives: 5, mistakes: 0, isCharging: false, currentPower: 0, tankX: 100, 
    baseMoveSpeed: 5, 
    keys: { left: false, right: false, space: false }, mousePos: { x: 0, y: 0 }, 
    bullet: null, enemyBullets: [], enemyMissiles: [], playerMissiles: [], targets: [],
    balloons: [], crates: [], enemyTanks: [], supplyPlanes: [],
    mission: { n: 1, d: 2, op: '>' }, wind: 0, targetWind: 0, particles: [], floatingTexts: [], groundY: 0,
    isGameOver: false, gameOverPending: false, maxChargeSoundPlayed: false, hasStartedMusic: false, frame: 0,
    isHitFlash: 0, levelComplete: false,
    shotsFired: 0, shotsHit: 0, enemiesDestroyed: 0,
    // Player Missile Properties
    pMissiles: 2,
    pMissileCooldown: 0,
    pMissileCharge: 0
};

const GRAVITY = 0.2; const MAX_POWER = 22; const POWER_CHARGE_SPEED = 0.3;

const CONFIG = window.GAME_CONFIG;
KAMPAI.setSlug(CONFIG.SLUG);

// Load SDK details
KAMPAI.onReady((sdk) => {
    const bestScore = sdk.stats?.personalBest || 0;
    const playCount = sdk.stats?.playsCount || 0;
    
    const bestEl = document.getElementById('ms-best');
    const playsEl = document.getElementById('ms-plays');
    if (bestEl) bestEl.textContent = bestScore;
    if (playsEl) playsEl.textContent = playCount;

    renderLeaderboard(sdk.leaderboard, 'score-list');

    if (sdk.student) {
        const chip = document.getElementById('player-chip');
        if (chip) {
            const studentName = sdk.student.displayName || sdk.student.name || '';
            chip.style.display = 'flex';
            chip.innerHTML = `
                <div class="pc-init">${studentName.charAt(0) || ''}</div>
                <span>${studentName}</span>
            `;
        }
    }
});

function renderLeaderboard(leaderboardData, containerId) {
    const listEl = document.getElementById(containerId);
    if (!listEl) return;
    
    listEl.innerHTML = '';
    
    if (!leaderboardData || leaderboardData.length === 0) {
        listEl.innerHTML = '<li class="lb-loading">ยังไม่มีประวัติคะแนน</li>';
        return;
    }

    leaderboardData.slice(0, 5).forEach((row, i) => {
        const isMe = KAMPAI.student && (row.studentId === KAMPAI.student.id || row.student_id === KAMPAI.student.id);
        const li = document.createElement('li');
        if (isMe) li.className = 'me';
        
        const displayName = row.displayName || row.student_name || 'เพื่อนทหารกล้า';
        const score = row.personalBest !== undefined ? row.personalBest : (row.score !== undefined ? row.score : 0);
        
        li.innerHTML = `
            <span><strong>#${i + 1}</strong> ${displayName}</span>
            <span>⭐ ${score}</span>
        `;
        listEl.appendChild(li);
    });
}

function checkFraction(tn, td) {
    const baseVal = gameState.mission.n / gameState.mission.d;
    const targetVal = tn / td;
    return gameState.mission.op === '>' ? targetVal > baseVal : targetVal < baseVal;
}

function startGame(rngFn) {
    if (typeof versusTimer !== 'undefined' && versusTimer) clearTimeout(versusTimer);
    document.getElementById('blocker').style.display = 'none';
    document.getElementById('msg-box').style.display = 'none';
    gameState.score = 0;
    gameState.level = 1;
    gameState.ammo = 5;
    gameState.lives = CONFIG.LIVES;
    gameState.mistakes = 0;
    gameState.isGameOver = false;
    gameState.gameOverPending = false;
    gameState.isPlaying = true;
    gameState.tankX = 150;
    
    // Seeded Random Generator
    gameState.rng = rngFn || Math.random;
    
    // Reset stats
    gameState.shotsFired = 0;
    gameState.shotsHit = 0;
    gameState.enemiesDestroyed = 0;
    
    // Player Missiles
    gameState.pMissiles = 2;
    gameState.pMissileCooldown = 0;
    gameState.pMissileCharge = 0;
    updatePMissileUI();
    
    // Reset entities
    gameState.crates = [];
    gameState.enemyTanks = [];
    gameState.enemyBullets = [];
    gameState.enemyMissiles = [];
    gameState.playerMissiles = [];
    gameState.floatingTexts = [];
    gameState.balloons = [];
    gameState.supplyPlanes = [];
    gameState.particles = [];
    gameState.targets = [];
    gameState.bullet = null;
    
    document.getElementById('score-val').innerText = 0;
    
    tryStartMusic();
    newLevel();
}

function showTitleScreen() {
    document.getElementById('msg-box').style.display = 'none';
    document.getElementById('blocker').style.display = 'flex';
    gameState.isPlaying = false;
    sfx.stopBGM();
    sfx.stopMove();
    gameState.hasStartedMusic = false;
}

function newLevel() {
    gameState.targets = [];
    gameState.mistakes = 0;
    gameState.levelComplete = false;
    gameState.wind = 0;
    
    // Use custom RNG if available
    const random = gameState.rng || Math.random;
    gameState.targetWind = (random() - 0.5) * 0.5;

    const commonD = window.GAME_DATA.commonDenominators;

    // Pick a mission fraction
    gameState.mission.d = commonD[Math.floor(random() * commonD.length)];
    gameState.mission.n = Math.floor(random() * (gameState.mission.d - 1)) + 1;
    gameState.mission.op = random() > 0.5 ? '>' : '<';

    document.getElementById('target-n').innerText = gameState.mission.n;
    document.getElementById('target-d').innerText = gameState.mission.d;
    document.getElementById('op-text').innerText = gameState.mission.op === '>' ? 'มากกว่า' : 'น้อยกว่า';

    // Calculate plane count based on level
    const count = 3 + Math.min(Math.floor(gameState.level/2), 2);
    const correctIndex = Math.floor(random() * count);
    
    for (let i = 0; i < count; i++) {
        let td, tn;
        let isCorrect = (i === correctIndex);
        let valid = false;
        let subAttempts = 0;
        
        while(!valid && subAttempts < 120) {
            subAttempts++;
            td = commonD[Math.floor(random() * commonD.length)];
            tn = Math.floor(random() * (td * 2)) + 1;
            
            const targetVal = tn / td;
            const baseVal = gameState.mission.n / gameState.mission.d;
            if (!isCorrect && Math.abs(targetVal - baseVal) < 0.0001) continue; 
            
            if (isCorrect) {
                if (checkFraction(tn, td)) valid = true;
            } else {
                if (!checkFraction(tn, td)) valid = true;
            }
        }
        
        if (!valid) {
             if (isCorrect) {
                 if (gameState.mission.op === '>') { tn = 100; td = 1; } 
                 else { tn = 0; td = 1; }
             } else {
                 if (gameState.mission.op === '>') { tn = 0; td = 1; }
                 else { tn = 100; td = 1; }
             }
        }

        const planeType = Math.floor(random() * 3);
        const speed = (0.5 + random() * 0.8) * (random() > 0.5 ? 1 : -1);

        gameState.targets.push({
            x: canvas.width * 0.3 + (random() * (canvas.width * 0.6)),
            y: 80 + random() * (gameState.groundY - 350),
            n: tn, d: td, radius: 45,
            color: `hsl(${random() * 360}, 75%, 60%)`,
            isCorrect: isCorrect,
            vx: speed,
            type: planeType,
            propAngle: 0,
            state: 'idle',
            cooldown: random() * 400 + 400, 
            chargeTime: 120, 
            currentCharge: 0
        });
    }
    updateAmmoUI();
    updateLivesUI();
    updateWindUI();
}

function init() {
    resize(); window.addEventListener('resize', resize);
    window.addEventListener('keydown', (e) => { 
        if(!gameState.isPlaying) return; 
        if(e.code==='ArrowLeft') gameState.keys.left=true; 
        if(e.code==='ArrowRight') gameState.keys.right=true; 
        if(e.code==='Space') { gameState.keys.space=true; e.preventDefault(); }
        tryStartMusic(); 
    });
    window.addEventListener('keyup', (e) => { 
        if(e.code==='ArrowLeft') gameState.keys.left=false; 
        if(e.code==='ArrowRight') gameState.keys.right=false; 
        if(e.code==='Space') {
            if (gameState.isPlaying && gameState.keys.space) {
                releaseSpacebarMissile();
            }
            gameState.keys.space=false;
        }
    });
    canvas.addEventListener('mousedown', (e) => { if(!gameState.isPlaying) return; tryStartMusic(); startCharge(); });
    window.addEventListener('mousemove', updateMouse);
    window.addEventListener('mouseup', releaseCharge);
    
    // Mobile Touch Controls fallback
    canvas.addEventListener('touchstart', (e) => {
        if(!gameState.isPlaying) return;
        tryStartMusic();
        const touch = e.touches[0];
        updateMouse({ clientX: touch.clientX, clientY: touch.clientY });
        startCharge();
        e.preventDefault();
    });
    canvas.addEventListener('touchmove', (e) => {
        if(!gameState.isPlaying) return;
        const touch = e.touches[0];
        updateMouse({ clientX: touch.clientX, clientY: touch.clientY });
        e.preventDefault();
    });
    canvas.addEventListener('touchend', (e) => {
        if(!gameState.isPlaying) return;
        releaseCharge();
        e.preventDefault();
    });
    
    requestAnimationFrame(gameLoop);
}

function tryStartMusic() { 
    if (!gameState.hasStartedMusic && gameState.isPlaying) { 
        sfx.playBGM(); 
        gameState.hasStartedMusic = true; 
        document.getElementById('music-btn').innerText = "🔊"; 
    } 
}

function toggleMusic() { 
    const isPlaying = sfx.toggleBGM(); 
    document.getElementById('music-btn').innerText = isPlaying ? "🔊" : "🔇"; 
    gameState.hasStartedMusic = true; 
}

function resize() { 
    canvas.width = window.innerWidth; 
    canvas.height = window.innerHeight; 
    gameState.groundY = canvas.height - 95; 
}

function spawnBoss() {
    gameState.enemyTanks.push({
        x: canvas.width + 100,
        y: gameState.groundY,
        w: 120, h: 60, 
        hp: 3, 
        isBoss: true,
        cooldown: 300, 
        aiming: false,
        aimVx: 0, aimVy: 0,
        scale: 2.0,
        color: "#800000" 
    });
    createFloatingText(canvas.width - 200, gameState.groundY - 100, "BOSS APPROACHING!", "#ef4444");
}

function spawnSupplyDrop() {
    gameState.supplyPlanes.push({
        x: -100,
        y: 60 + Math.random() * 80,
        vx: 3,
        dropped: false
    });
}

function drawVectorPlayerTank(x, y, angle, flash = 0) {
    ctx.save();
    ctx.translate(x, y);

    let mainColor = "#3e5c46"; 
    let darkColor = "#1f3124";
    const highlight = "rgba(255,255,255,0.15)";
    const shadow = "rgba(0,0,0,0.3)";

    if (gameState.lives <= 2) { 
        mainColor = "#665840"; 
        darkColor = "#362e21"; 
    }
    if (gameState.lives <= 1) { 
        mainColor = "#2c3e50"; 
        darkColor = "#0f172a"; 
    }
    if (flash > 0) { 
        ctx.shadowBlur = 20; 
        ctx.shadowColor = "red"; 
    }

    const trackW = 100, trackH = 26;
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath(); ctx.roundRect(-trackW/2, -trackH/2 - 13, trackW, trackH, 8); ctx.fill();
    
    const wheelCount = 6;
    const wheelSpacing = (trackW - 16) / (wheelCount - 1);
    for(let i = 0; i < wheelCount; i++) {
        const wx = -trackW/2 + 8 + i * wheelSpacing;
        const wy = -13;
        ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(wx, wy, 10, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#444"; ctx.beginPath(); ctx.arc(wx, wy, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(wx, wy, 2, 0, Math.PI*2); ctx.fill();
    }
    
    ctx.fillStyle = mainColor;
    ctx.beginPath(); ctx.moveTo(-50, -25); ctx.lineTo(45, -25); ctx.lineTo(45, -15); ctx.lineTo(-48, -15); ctx.fill();
    ctx.strokeStyle = darkColor; ctx.lineWidth = 1;
    for(let i=-45; i<40; i+=15) { ctx.beginPath(); ctx.moveTo(i, -25); ctx.lineTo(i, -15); ctx.stroke(); }

    // --- HULL ---
    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.moveTo(-55, -25); ctx.lineTo(50, -25); ctx.lineTo(60, -35); ctx.lineTo(40, -45); ctx.lineTo(-50, -45); ctx.lineTo(-60, -35);
    ctx.closePath(); ctx.fill();
    
    ctx.fillStyle = highlight;
    ctx.beginPath(); ctx.moveTo(-48, -43); ctx.lineTo(38, -43); ctx.lineTo(42, -40); ctx.lineTo(-45, -40); ctx.fill();

    ctx.fillStyle = darkColor;
    ctx.beginPath(); ctx.ellipse(5, -45, 25, 6, 0, 0, Math.PI*2); ctx.fill();

    // --- TURRET ---
    ctx.save();
    ctx.translate(5, -48);
    ctx.rotate(angle);

    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.moveTo(-35, 12); ctx.lineTo(15, 12); ctx.lineTo(30, 0); ctx.lineTo(30, -8); ctx.lineTo(15, -15); ctx.lineTo(-35, -15); ctx.lineTo(-40, -2);
    ctx.closePath(); ctx.fill();
    
    ctx.fillStyle = shadow;
    ctx.beginPath(); ctx.moveTo(15, 12); ctx.lineTo(30, 0); ctx.lineTo(15, 0); ctx.fill(); 
    
    ctx.fillStyle = darkColor;
    ctx.beginPath(); ctx.arc(-10, -5, 6, 0, Math.PI*2); ctx.fill();
    ctx.strokeStyle = "#555"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-15, -5); ctx.lineTo(-30, -5); ctx.stroke(); 

    // --- BARREL ---
    ctx.fillStyle = darkColor; ctx.fillRect(25, -6, 10, 12);
    ctx.fillStyle = mainColor; ctx.fillRect(35, -3, 60, 6);
    ctx.fillStyle = darkColor; ctx.fillRect(55, -4.5, 15, 9);
    ctx.fillStyle = "#111"; ctx.fillRect(92, -4, 3, 8);

    ctx.restore();
    ctx.restore();
}

function drawVectorEnemyTank(tank, flash = 0) {
    ctx.save();
    ctx.translate(tank.x, tank.y);
    ctx.scale(-tank.scale, tank.scale); 

    const mainColor = tank.color || "#8d6e63"; 
    const darkColor = "#4e342e";

    if (flash > 0) { ctx.shadowBlur = 20; ctx.shadowColor = "red"; }

    const trackW = 90, trackH = 26;
    ctx.fillStyle = "#111";
    ctx.beginPath(); ctx.roundRect(-trackW/2, -trackH/2 - 13, trackW, trackH, 13); ctx.fill();
    
    const wheelCount = 5;
    const wheelSpacing = (trackW - 20) / (wheelCount - 1);
    for(let i = 0; i < wheelCount; i++) {
        const wx = -trackW/2 + 10 + i * wheelSpacing;
        const wy = -13;
        ctx.fillStyle = "#222"; ctx.beginPath(); ctx.arc(wx, wy, 11, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "#5d4037"; ctx.beginPath(); ctx.arc(wx, wy, 5, 0, Math.PI*2); ctx.fill(); 
    }

    ctx.fillStyle = mainColor;
    ctx.beginPath();
    ctx.moveTo(-45, -25); ctx.lineTo(45, -25); ctx.lineTo(50, -35); ctx.lineTo(-45, -35); ctx.fill();
    
    ctx.save();
    ctx.translate(5, -35);
    
    ctx.fillStyle = mainColor;
    ctx.beginPath(); ctx.arc(0, 0, 20, Math.PI, 0); ctx.fill();
    
    ctx.fillStyle = "#a1887f";
    for(let a = 0.2; a < Math.PI - 0.2; a += 0.4) {
        let bx = Math.cos(a) * 20; let by = -Math.sin(a) * 20;
        ctx.save(); ctx.translate(bx, by); ctx.rotate(a + Math.PI/2); ctx.fillRect(-4, -2, 8, 4); ctx.restore();
    }

    ctx.fillStyle = darkColor;
    ctx.fillRect(15, -5, 55, 5);
    ctx.fillRect(45, -6, 10, 7); 
    
    ctx.restore();
    ctx.restore();
}

function drawEnemyPlane(t) {
    ctx.save();
    ctx.translate(t.x, t.y);
    if (t.vx < 0) ctx.scale(-1, 1);

    // Animation factor (spinning rotors/propellers)
    t.propAngle += 0.25;

    if (t.type === 0) { 
        // 1. PROPELLER PLANE
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, 30, 10, 0, 0, Math.PI*2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(-25, -5);
        ctx.lineTo(-35, -20);
        ctx.lineTo(-20, -5);
        ctx.fill();
        
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.fillRect(-10, -22, 10, 15);
        
        ctx.fillStyle = t.color;
        ctx.fillRect(-5, 0, 12, 25);
        
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(8, -5, 6, Math.PI, 0);
        ctx.fill();
        
        ctx.fillStyle = "#475569";
        ctx.fillRect(30, -3, 3, 6);
        
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2;
        ctx.beginPath();
        const pY = Math.sin(t.propAngle) * 18;
        ctx.moveTo(31, -pY);
        ctx.lineTo(31, pY);
        ctx.stroke();

    } else if (t.type === 1) { 
        // 2. FIGHTER JET
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(-30, -18);
        ctx.lineTo(5, 0);
        ctx.fill();
        
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.moveTo(-15, 0);
        ctx.lineTo(-25, 22);
        ctx.lineTo(10, 0);
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(-35, 0);
        ctx.lineTo(32, 0);
        ctx.lineTo(35, -3);
        ctx.lineTo(25, -6);
        ctx.lineTo(-35, -4);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(-25, -3);
        ctx.lineTo(-38, -18);
        ctx.lineTo(-28, -18);
        ctx.lineTo(-15, -3);
        ctx.fill();
        
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.moveTo(8, -4);
        ctx.quadraticCurveTo(18, -4, 20, -1);
        ctx.lineTo(5, -1);
        ctx.closePath();
        ctx.fill();
        
        if (gameState.frame % 3 === 0) {
            gameState.particles.push({
                x: t.x - (t.vx < 0 ? -38 : 38),
                y: t.y,
                vx: (t.vx < 0 ? 2 : -2) + (Math.random()-0.5),
                vy: (Math.random()-0.5),
                life: 0.5,
                color: 'rgba(239, 68, 68, 0.7)',
                size: 3 + Math.random()*3
            });
        }

    } else { 
        // 3. HELICOPTER
        ctx.fillStyle = t.color;
        ctx.beginPath();
        ctx.arc(0, 2, 16, 0, Math.PI*2);
        ctx.fill();
        
        ctx.fillRect(-30, -2, 20, 6);
        
        ctx.fillStyle = "#475569";
        ctx.fillRect(-30, -8, 3, 14);
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        const trVal = Math.sin(t.propAngle * 2) * 8;
        ctx.moveTo(-28, -2 - trVal);
        ctx.lineTo(-28, -2 + trVal);
        ctx.stroke();
        
        ctx.strokeStyle = "#475569";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, 18); ctx.lineTo(-10, 23); ctx.lineTo(12, 23);
        ctx.moveTo(8, 18); ctx.lineTo(8, 23);
        ctx.stroke();
        
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath();
        ctx.arc(6, 0, 8, -Math.PI/2, Math.PI/2);
        ctx.fill();
        
        ctx.fillStyle = "#475569";
        ctx.fillRect(-2, -18, 4, 6);
        
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const rX = Math.cos(t.propAngle) * 32;
        ctx.moveTo(-rX, -18);
        ctx.lineTo(rX, -18);
        ctx.stroke();
    }
    
    ctx.restore();

    // Text Bubble (Fraction)
    ctx.fillStyle = "rgba(255,255,255,0.95)"; 
    ctx.drawRoundedRect(t.x-30, t.y-60, 60, 36, 6);
    ctx.strokeStyle = "#1e293b"; ctx.lineWidth = 2; ctx.stroke();
    
    // Draw Fraction Line
    ctx.beginPath();
    ctx.moveTo(t.x - 18, t.y - 42);
    ctx.lineTo(t.x + 18, t.y - 42);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Numbers
    ctx.fillStyle = "#0f172a"; ctx.font = "bold 13px Courier New"; ctx.textAlign = "center";
    ctx.fillText(`${t.n}`, t.x, t.y-46);
    ctx.fillText(`${t.d}`, t.x, t.y-30);

    // Charge Bar
    if (t.state === 'charging') {
        const barW = 40; const barH = 6; const ratio = t.currentCharge / t.chargeTime;
        ctx.fillStyle = "rgba(0,0,0,0.7)"; ctx.fillRect(t.x - barW/2, t.y - 80, barW, barH);
        ctx.fillStyle = "#ef4444"; ctx.fillRect(t.x - barW/2, t.y - 80, barW * ratio, barH);
        ctx.strokeStyle = "white"; ctx.strokeRect(t.x - barW/2, t.y - 80, barW, barH);
    }
}

function drawTrajectory() {
    if (!gameState.isCharging) return;
    const x = gameState.tankX + 5, y = gameState.groundY - 48;
    const dx = gameState.mousePos.x - x, dy = gameState.mousePos.y - y;
    const angle = Math.atan2(dy, dx);
    let tx = x, ty = y;
    let tvx = Math.cos(angle) * gameState.currentPower, tvy = Math.sin(angle) * gameState.currentPower;
    ctx.beginPath(); ctx.setLineDash([4, 6]); ctx.strokeStyle = "rgba(255, 255, 255, 0.7)"; ctx.lineWidth = 2.5;
    ctx.moveTo(tx, ty);
    for (let i = 0; i < 40; i++) {
        tx += tvx; ty += tvy; tvy += GRAVITY; tvx += gameState.wind; 
        ctx.lineTo(tx, ty); if (ty > gameState.groundY) break;
    }
    ctx.stroke(); ctx.setLineDash([]);
}

function checkCollision(obj1, obj2, radius) {
    const dx = obj1.x - obj2.x, dy = obj1.y - obj2.y;
    return Math.sqrt(dx*dx + dy*dy) < radius;
}

function createFloatingText(x, y, text, color) {
    gameState.floatingTexts.push({x, y, text, color, life: 1.0});
}

function firePlayerMissile(count) {
    if (count <= 0) return;
    
    let potentialTargets = [];
    gameState.targets.forEach(t => potentialTargets.push({type: 'target', ref: t}));
    gameState.enemyTanks.forEach(t => potentialTargets.push({type: 'tank', ref: t}));
    gameState.balloons.forEach(b => potentialTargets.push({type: 'balloon', ref: b}));
    
    for (let i = 0; i < count; i++) {
        let selectedTarget = null;
        let willHit = true;
        
        if (potentialTargets.length > 0) {
            const idx = Math.floor(Math.random() * potentialTargets.length);
            selectedTarget = potentialTargets[idx];
            potentialTargets.splice(idx, 1);
            
            if (selectedTarget.type === 'tank') {
                willHit = Math.random() < 0.8;
            }
        }
        
        const offsetX = (count === 1) ? 0 : (-20 + (i / (count - 1)) * 40);
        const vx = (count === 1) ? 0 : (-3 + (i / (count - 1)) * 6);
        
        gameState.playerMissiles.push({
            x: gameState.tankX + offsetX,
            y: gameState.groundY - 50,
            vx: vx,
            vy: -8,
            target: selectedTarget,
            willHit: willHit,
            life: 300,
            trailCount: 0
        });
    }
    sfx.shoot();
    gameState.shotsFired += count;
}

function releaseSpacebarMissile() {
    if (gameState.pMissiles <= 0 || gameState.pMissileCooldown > 0) {
        gameState.pMissileCharge = 0;
        return;
    }
    
    let count = 0;
    if (gameState.pMissileCharge >= 80) count = 3;
    else if (gameState.pMissileCharge >= 45) count = 2;
    else if (gameState.pMissileCharge >= 15) count = 1;
    
    count = Math.min(count, gameState.pMissiles);
    
    if (count > 0) {
        firePlayerMissile(count);
        gameState.pMissiles -= count;
        gameState.pMissileCooldown = 60; // 1 second cooldown
        updatePMissileUI();
    }
    gameState.pMissileCharge = 0;
}


function updateMouse(e) {
    const rect = canvas.getBoundingClientRect();
    gameState.mousePos.x = e.clientX - rect.left;
    gameState.mousePos.y = e.clientY - rect.top;
}

function startCharge() {
    if (gameState.ammo <= 0) {
        sfx.reload();
        createFloatingText(gameState.tankX, gameState.groundY - 60, "กระสุนหมด!", "#fb923c");
        return;
    }
    gameState.isCharging = true;
    gameState.currentPower = 3;
    gameState.maxChargeSoundPlayed = false;
}

function releaseCharge() {
    if (!gameState.isCharging) return;
    gameState.isCharging = false;
    document.getElementById('power-container').style.display = 'none';

    const barrelX = gameState.tankX + 5;
    const barrelY = gameState.groundY - 48;
    const dx = gameState.mousePos.x - barrelX;
    const dy = gameState.mousePos.y - barrelY;
    const angle = Math.atan2(dy, dx);

    gameState.bullet = {
        x: barrelX,
        y: barrelY,
        vx: Math.cos(angle) * gameState.currentPower,
        vy: Math.sin(angle) * gameState.currentPower
    };

    sfx.shoot();
    gameState.ammo--;
    gameState.shotsFired++;
    updateAmmoUI();
}

function update() {
    if (!gameState.isPlaying) return;
    gameState.frame++;

    // --- WIND FLUCTUATION ---
    if (gameState.frame % 120 === 0) {
        gameState.targetWind = (Math.random() - 0.5) * 0.5; 
    }
    gameState.wind += (gameState.targetWind - gameState.wind) * 0.02;
    updateWindUI();

    // --- ALLIED SUPPLY PLANE (Every 15s = 900 frames) ---
    if (gameState.frame % 900 === 0) {
        spawnSupplyDrop();
    }

    // --- SPEED PENALTY BASED ON HEALTH ---
    const healthPercent = Math.max(0, gameState.lives) / CONFIG.LIVES;
    const currentSpeed = Math.max(1, gameState.baseMoveSpeed * healthPercent);
    const speedEl = document.getElementById('speed-status');
    if (speedEl) {
        speedEl.innerText = `เครื่องยนต์: ${Math.round(healthPercent * 100)}%`;
        if (healthPercent <= 0.4) {
            speedEl.style.color = "var(--danger)";
        } else {
            speedEl.style.color = "#38bdf8";
        }
    }

    // Add Engine Smoke if health is low
    if (gameState.lives <= 2 && gameState.frame % 10 === 0) {
        gameState.particles.push({
            x: gameState.tankX - 20 + Math.random()*40,
            y: gameState.groundY - 20,
            vx: (Math.random() - 0.5) * 2 + gameState.wind * 5,
            vy: -Math.random() * 3 - 1,
            life: 1,
            color: 'rgba(100,100,100,0.5)',
            size: 6 + Math.random()*6
        });
    }

    // --- BALLOONS (Every 10s = 600 frames) ---
    if (gameState.frame % 600 === 0) {
        const isWindRight = gameState.wind > 0;
        gameState.balloons.push({
            x: isWindRight ? -50 : canvas.width + 50,
            y: canvas.height - 150 - Math.random() * 200,
            vx: isWindRight ? (Math.random() * 1 + 1) : -(Math.random() * 1 + 1),
            vy: -(Math.random() * 0.5 + 0.5),
            color: `hsl(${Math.random() * 360}, 100%, 60%)`,
            sway: Math.random() * Math.PI * 2
        });
    }

    gameState.balloons.forEach((b, i) => {
        b.x += b.vx + (gameState.wind * 10);
        b.y += b.vy;
        b.sway += 0.05;
        if (b.y < -100 || b.x < -200 || b.x > canvas.width + 200) {
            gameState.balloons.splice(i, 1);
        }
    });

    // --- TANK MOVEMENT ---
    if (gameState.keys.left) gameState.tankX -= currentSpeed;
    if (gameState.keys.right) gameState.tankX += currentSpeed;
    gameState.tankX = Math.max(60, Math.min(canvas.width - 60, gameState.tankX));
    if (gameState.keys.left || gameState.keys.right) sfx.startMove(); else sfx.stopMove();
    
    // Standard Gun Charging (Mouse/Touch)
    if (gameState.isCharging) {
        gameState.currentPower = Math.min(gameState.currentPower + POWER_CHARGE_SPEED, MAX_POWER);
        if (gameState.currentPower === MAX_POWER && !gameState.maxChargeSoundPlayed) { sfx.maxCharge(); gameState.maxChargeSoundPlayed = true; }
        const bar = document.getElementById('power-container'); 
        if (bar) {
            bar.style.display = 'block';
            bar.style.left = (gameState.tankX - 40) + 'px'; 
            bar.style.top = (gameState.groundY - 110) + 'px'; 
            document.getElementById('power-fill').style.width = (gameState.currentPower / MAX_POWER * 100) + "%";
        }
    }

    // --- PLAYER MISSILE CHARGING (Spacebar) ---
    if (gameState.keys.space && gameState.pMissiles > 0 && gameState.pMissileCooldown <= 0) {
        gameState.pMissileCharge = Math.min(gameState.pMissileCharge + 1, 90);
    } else {
        if (!gameState.keys.space) {
            gameState.pMissileCharge = 0;
        }
    }

    if (gameState.pMissileCooldown > 0) {
        gameState.pMissileCooldown--;
        if (gameState.pMissileCooldown % 60 === 0 || gameState.pMissileCooldown === 0) {
            updatePMissileUI();
        }
    }

    // --- ENEMY SPAWN LOGIC (Tank & Boss) ---
    if (gameState.frame % 1800 === 0) {
        const bossExists = gameState.enemyTanks.some(t => t.isBoss);
        if (!bossExists) spawnBoss();
    }

    if (gameState.frame % 400 === 0 && gameState.enemyTanks.length < 3) {
        const normalCount = gameState.enemyTanks.filter(t => !t.isBoss).length;
        if (normalCount < 2) {
             gameState.enemyTanks.push({ 
                x: canvas.width + 100, y: gameState.groundY, hp: 1, 
                cooldown: 300, aiming: false, aimVx: 0, aimVy: 0,
                isBoss: false, scale: 1.0, color: null
            }); 
        }
    }

    // --- ENEMY UPDATE LOOP ---
    gameState.enemyTanks.forEach((tank, i) => {
        const stopDist = tank.isBoss ? canvas.width * 0.8 : canvas.width * 0.7; 
        if (tank.x > stopDist) {
            tank.x -= (tank.isBoss ? 0.5 : 1.5);
        } else {
            tank.cooldown--;
            // Aiming logic
            if (tank.cooldown <= 120 && !tank.isBoss) {
                tank.aiming = true;
                tank.targetX = gameState.tankX; 
                const dx = tank.targetX - tank.x;
                const time = 80;
                tank.aimVx = dx / time;
                tank.aimVy = (-0.5 * GRAVITY * time * time) / time;
            } else if (tank.isBoss && tank.cooldown <= 60) {
                 tank.aiming = true;
                 tank.targetX = gameState.tankX;
                 const dx = tank.targetX - tank.x;
                 const time = 90;
                 tank.aimVx = dx / time;
                 tank.aimVy = (-0.5 * GRAVITY * time * time) / time;
            } else {
                tank.aiming = false;
            }

            if (tank.cooldown <= 0) {
                // Fire logic
                if (tank.isBoss) {
                    if (Math.random() < 0.5) {
                        gameState.enemyBullets.push({ x: tank.x - 40, y: tank.y - 60, vx: tank.aimVx, vy: tank.aimVy });
                    } else {
                        const time = 120;
                        const dx = gameState.tankX - tank.x;
                        const vy = -4; 
                        gameState.enemyMissiles.push({
                           x: tank.x - 20, y: tank.y - 70, vx: dx / time, vy: vy, 
                           targetX: gameState.tankX, timeTotal: time, timeLeft: time
                        });
                    }
                    tank.cooldown = 400; 
                } else {
                    gameState.enemyBullets.push({ x: tank.x - 20, y: tank.y - 35, vx: tank.aimVx, vy: tank.aimVy });
                    tank.cooldown = 600; 
                }
                sfx.shoot(true); 
                tank.aiming = false;
            }
        }
        
        // Collision with Player Tank
        if (Math.abs(gameState.tankX - tank.x) < 85) {
            sfx.explode();
            createExplosion(tank.x, tank.y, "orange", 30);
            createExplosion(gameState.tankX, gameState.groundY, "red", 20);
            createFloatingText(gameState.tankX, gameState.groundY - 60, "รถถังชนกัน! -1 ❤️", "#ef4444");
            
            gameState.enemyTanks.splice(i, 1);
            
            gameState.lives = Math.max(0, gameState.lives - 1);
            gameState.isHitFlash = 10;
            updateLivesUI();
            
            if(gameState.lives <= 0 && !gameState.isGameOver) {
                triggerGameOver("รถถังพังจากการชน!");
            }
        }
    });

    // --- PLAYER BULLET UPDATES ---
    if (gameState.bullet) {
        gameState.bullet.x += gameState.bullet.vx; gameState.bullet.y += gameState.bullet.vy; gameState.bullet.vy += GRAVITY;
        gameState.bullet.vx += gameState.wind;
        
        let hitSomething = false;

        if (gameState.bullet.y > gameState.groundY) { 
            sfx.explode(); 
            createExplosion(gameState.bullet.x, gameState.bullet.y, "#8a6e45", 30);
            gameState.bullet = null; 
            hitSomething = true;
        } else {
            // Hit Enemy Tank
            gameState.enemyTanks.forEach((et, ei) => {
                if (hitSomething || !gameState.bullet) return;
                const hitRadius = et.isBoss ? 80 : 40;
                const offsetY = et.isBoss ? 40 : 20;

                if (checkCollision(gameState.bullet, {x: et.x, y: et.y - offsetY}, hitRadius)) {
                    sfx.explode();
                    createExplosion(et.x, et.y, "orange", 30); 
                    
                    et.hp--;
                    if (et.hp <= 0) {
                         const dropAmount = et.isBoss ? 20 : 10;
                         gameState.crates.push({ x: et.x - 15, y: gameState.groundY - 15, vy: 0, vx: 0, radius: 20, hasParachute: false, amount: dropAmount, text: `+${dropAmount}`, type: 'ammo', despawnTimer: 600 });
                         gameState.crates.push({ x: et.x + 20, y: gameState.groundY - 15, vy: 0, vx: 0, radius: 20, hasParachute: false, amount: et.isBoss ? 3 : 1, text: `+${et.isBoss?3:1} 🚀`, type: 'pmissile', despawnTimer: 600 });
                         
                         createFloatingText(et.x, et.y - 60, "ศัตรูถูกทำลาย!", "#ef4444");
                         
                         gameState.enemyTanks.splice(ei, 1);
                         gameState.score += (et.isBoss ? 100 : 20);
                         gameState.enemiesDestroyed++;
                    } else {
                         createFloatingText(et.x, et.y - 60, "Hit!", "#fff");
                    }
                    
                    gameState.bullet = null; 
                    hitSomething = true;
                    gameState.shotsHit++;
                    document.getElementById('score-val').innerText = gameState.score;
                }
            });

            // Hit Balloons
            gameState.balloons.forEach((b, bi) => {
                if (hitSomething || !gameState.bullet) return;
                if (checkCollision(gameState.bullet, b, 25)) {
                    sfx.explode();
                    createExplosion(b.x, b.y, b.color, 20);
                    
                    gameState.crates.push({ 
                        x: b.x, y: b.y, vy: 0.8, vx: gameState.wind * 4, radius: 20, 
                        hasParachute: true, amount: 1, text: "+1 ❤️", type: 'health', despawnTimer: 600 
                    });
                    createFloatingText(b.x, b.y - 20, "พลังชีวิต!", "#ef4444");

                    gameState.balloons.splice(bi, 1);
                    gameState.bullet = null;
                    hitSomething = true;
                    gameState.score += 5;
                    gameState.shotsHit++;
                    document.getElementById('score-val').innerText = gameState.score;
                }
            });

            // Hit Airplanes
            gameState.targets.forEach((t, ti) => {
                if (hitSomething || !gameState.bullet) return;
                const dist = Math.sqrt((gameState.bullet.x - t.x)**2 + (gameState.bullet.y - t.y)**2);
                if (dist < t.radius) {
                    sfx.hit(t.isCorrect); createExplosion(t.x, t.y, t.color, 20);
                    gameState.targets.splice(ti, 1);
                    gameState.shotsHit++;
                    
                    if (t.isCorrect) { 
                        gameState.score += CONFIG.BASE_SCORE;
                        document.getElementById('score-val').innerText = gameState.score;
                        
                        // Drop +5 Parachute crate from the plane
                        gameState.crates.push({
                            x: t.x, y: t.y, vy: 0.8, vx: gameState.wind * 3, radius: 20,
                            hasParachute: true, amount: 5, text: "+5 💣", type: 'ammo', despawnTimer: 600
                        });
                        
                        createFloatingText(t.x, t.y - 20, "ถูกต้อง! 🎉", "#10b981");
                        gameState.levelComplete = true;
                    } else {
                        gameState.lives = Math.max(0, gameState.lives - 1);
                        gameState.mistakes++;
                        gameState.isHitFlash = 10;
                        updateLivesUI();
                        createFloatingText(t.x, t.y - 20, "ผิดพลาด! ❌", "#ef4444");
                        
                        if (gameState.lives <= 0) {
                            triggerGameOver("พลังชีวิตหมดจากการโจมตีเป้าหมายผิด!");
                        }
                    }
                    
                    gameState.bullet = null; 
                    hitSomething = true;
                }
            });
        }
    }

    // --- ENEMY BULLET UPDATES ---
    gameState.enemyBullets.forEach((eb, idx) => {
        eb.x += eb.vx; eb.y += eb.vy; eb.vy += GRAVITY;
        
        // Collide with Player Tank
        if (checkCollision(eb, { x: gameState.tankX, y: gameState.groundY - 30 }, 40)) {
            sfx.explode();
            createExplosion(gameState.tankX, gameState.groundY - 30, "red", 25);
            gameState.lives = Math.max(0, gameState.lives - 1);
            gameState.isHitFlash = 10;
            updateLivesUI();
            gameState.enemyBullets.splice(idx, 1);
            createFloatingText(gameState.tankX, gameState.groundY - 60, "โดนยิง! -1 ❤️", "#ef4444");
            
            if (gameState.lives <= 0 && !gameState.isGameOver) {
                triggerGameOver("รถถังเสียหายรุนแรงจากการยิงของศัตรู!");
            }
            return;
        }

        if (eb.y > gameState.groundY) {
            sfx.explode();
            createExplosion(eb.x, eb.y, "#8a6e45", 20);
            gameState.enemyBullets.splice(idx, 1);
        }
    });

    // --- ENEMY MISSILE UPDATES ---
    gameState.enemyMissiles.forEach((em, idx) => {
        em.timeLeft--;
        const ratio = em.timeLeft / em.timeTotal;
        
        // Homing calculation
        const dx = gameState.tankX - em.x;
        const dy = (gameState.groundY - 30) - em.y;
        
        em.vx += dx * 0.0008;
        em.vy += dy * 0.0008;
        
        // Limit speed
        const speed = Math.sqrt(em.vx*em.vx + em.vy*em.vy);
        if (speed > 5) {
            em.vx = (em.vx / speed) * 5;
            em.vy = (em.vy / speed) * 5;
        }
        
        em.x += em.vx;
        em.y += em.vy;

        // Trail particles
        if (gameState.frame % 3 === 0) {
            gameState.particles.push({
                x: em.x, y: em.y,
                vx: -em.vx * 0.2 + (Math.random()-0.5)*0.5,
                vy: -em.vy * 0.2 + (Math.random()-0.5)*0.5,
                life: 0.8,
                color: 'rgba(255, 120, 0, 0.6)',
                size: 3 + Math.random()*3
            });
        }

        // Collision with Player Tank
        if (checkCollision(em, { x: gameState.tankX, y: gameState.groundY - 30 }, 40)) {
            sfx.explode();
            createExplosion(gameState.tankX, gameState.groundY - 30, "orange", 30);
            gameState.lives = Math.max(0, gameState.lives - 1);
            gameState.isHitFlash = 10;
            updateLivesUI();
            gameState.enemyMissiles.splice(idx, 1);
            createFloatingText(gameState.tankX, gameState.groundY - 60, "โดนมิสไซล์! -1 ❤️", "#ef4444");
            
            if (gameState.lives <= 0 && !gameState.isGameOver) {
                triggerGameOver("รถถังเสียหายรุนแรงจากมิสไซล์ของศัตรู!");
            }
            return;
        }

        if (em.y > gameState.groundY || em.timeLeft <= 0) {
            sfx.explode();
            createExplosion(em.x, em.y, "red", 25);
            gameState.enemyMissiles.splice(idx, 1);
        }
    });

    // --- PLAYER MISSILE UPDATES ---
    gameState.playerMissiles.forEach((pm, idx) => {
        pm.life--;
        
        if (pm.target && pm.target.ref) {
            // Check if target still exists in the game
            let stillExists = false;
            if (pm.target.type === 'target') {
                stillExists = gameState.targets.includes(pm.target.ref);
            } else if (pm.target.type === 'tank') {
                stillExists = gameState.enemyTanks.includes(pm.target.ref);
            } else if (pm.target.type === 'balloon') {
                stillExists = gameState.balloons.includes(pm.target.ref);
            }
            
            if (!stillExists) {
                pm.target = null;
            }
        }
        
        if (pm.target && pm.target.ref) {
            const dx = pm.target.ref.x - pm.x;
            const dy = pm.target.ref.y - pm.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 40) {
                sfx.explode();
                createExplosion(pm.x, pm.y, "orange", 20);
                
                if (pm.target.type === 'tank') {
                    pm.target.ref.hp--;
                    if (pm.target.ref.hp <= 0) {
                        const dropAmount = pm.target.ref.isBoss ? 20 : 10;
                        gameState.crates.push({ x: pm.target.ref.x, y: gameState.groundY - 15, vy: 0, vx: 0, radius: 20, hasParachute: false, amount: dropAmount, text: `+${dropAmount}`, type: 'ammo', despawnTimer: 600 });
                        
                        const ti = gameState.enemyTanks.indexOf(pm.target.ref);
                        if (ti !== -1) {
                            gameState.enemyTanks.splice(ti, 1);
                            gameState.score += (pm.target.ref.isBoss ? 100 : 20);
                            gameState.enemiesDestroyed++;
                        }
                    }
                } else if (pm.target.type === 'balloon') {
                    gameState.crates.push({ 
                        x: pm.target.ref.x, y: pm.target.ref.y, vy: 0.8, vx: gameState.wind * 4, radius: 20, 
                        hasParachute: true, amount: 1, text: "+1 ❤️", type: 'health', despawnTimer: 600 
                    });
                    const bi = gameState.balloons.indexOf(pm.target.ref);
                    if (bi !== -1) gameState.balloons.splice(bi, 1);
                    gameState.score += 5;
                } else if (pm.target.type === 'target') {
                    sfx.hit(pm.target.ref.isCorrect);
                    createExplosion(pm.target.ref.x, pm.target.ref.y, pm.target.ref.color, 20);
                    
                    const ti = gameState.targets.indexOf(pm.target.ref);
                    if (ti !== -1) {
                        if (pm.target.ref.isCorrect) {
                            gameState.score += CONFIG.BASE_SCORE;
                            document.getElementById('score-val').innerText = gameState.score;
                            
                            gameState.crates.push({
                                x: pm.target.ref.x, y: pm.target.ref.y, vy: 0.8, vx: gameState.wind * 3, radius: 20,
                                hasParachute: true, amount: 5, text: "+5 💣", type: 'ammo', despawnTimer: 600
                            });
                            
                            createFloatingText(pm.target.ref.x, pm.target.ref.y - 20, "ถูกต้อง! 🎉", "#10b981");
                            gameState.levelComplete = true;
                        } else {
                            gameState.lives = Math.max(0, gameState.lives - 1);
                            gameState.mistakes++;
                            gameState.isHitFlash = 10;
                            updateLivesUI();
                            createFloatingText(pm.target.ref.x, pm.target.ref.y - 20, "ผิดพลาด! ❌", "#ef4444");
                            
                            if (gameState.lives <= 0) {
                                triggerGameOver("พลังชีวิตหมดจากการโจมตีเป้าหมายผิด!");
                            }
                        }
                        gameState.targets.splice(ti, 1);
                    }
                }
                
                gameState.playerMissiles.splice(idx, 1);
                gameState.shotsHit++;
                document.getElementById('score-val').innerText = gameState.score;
                return;
            }
            
            pm.vx += dx * 0.005;
            pm.vy += dy * 0.005;
        } else {
            pm.vy -= 0.1;
        }
        
        const sp = Math.sqrt(pm.vx*pm.vx + pm.vy*pm.vy);
        if (sp > 8) {
            pm.vx = (pm.vx / sp) * 8;
            pm.vy = (pm.vy / sp) * 8;
        }
        
        pm.x += pm.vx;
        pm.y += pm.vy;

        if (gameState.frame % 2 === 0) {
            gameState.particles.push({
                x: pm.x, y: pm.y,
                vx: -pm.vx * 0.2 + (Math.random()-0.5)*0.5,
                vy: -pm.vy * 0.2 + (Math.random()-0.5)*0.5,
                life: 0.8,
                color: 'rgba(200, 200, 200, 0.5)',
                size: 3 + Math.random()*3
            });
        }

        if (pm.y < -100 || pm.life <= 0) {
            gameState.playerMissiles.splice(idx, 1);
        }

    });

    // --- CRATES & LOOT DROPS UPDATES ---
    gameState.crates.forEach((cr, idx) => {
        cr.x += cr.vx;
        cr.y += cr.vy;
        cr.despawnTimer--;
        
        if (cr.hasParachute) {
            cr.vy = 1.0; 
            cr.vx = gameState.wind * 2.5;
            if (cr.y >= gameState.groundY - 15) {
                cr.hasParachute = false;
                cr.vy = 0;
                cr.vx = 0;
                cr.y = gameState.groundY - 15;
            }
        } else {
            // Gravity on crate if dropped in the air without parachute
            if (cr.y < gameState.groundY - 15) {
                cr.vy += 0.2;
            } else {
                cr.vy = 0;
                cr.y = gameState.groundY - 15;
            }
        }
        
        // Collsion with player tank
        if (Math.abs(gameState.tankX - cr.x) < 40 && Math.abs(gameState.groundY - 20 - cr.y) < 30) {
            // Collect crate
            if (cr.type === 'ammo') {
                gameState.ammo = Math.min(15, gameState.ammo + cr.amount);
                sfx.reload();
                updateAmmoUI();
            } else if (cr.type === 'pmissile') {
                gameState.pMissiles = Math.min(5, gameState.pMissiles + cr.amount);
                sfx.reload();
                updatePMissileUI();
            } else if (cr.type === 'health') {
                gameState.lives = Math.min(CONFIG.LIVES, gameState.lives + cr.amount);
                sfx.healthUp();
                updateLivesUI();
            }
            createFloatingText(cr.x, cr.y - 40, cr.text, "#10b981");
            gameState.crates.splice(idx, 1);
            return;
        }

        if (cr.despawnTimer <= 0) {
            gameState.crates.splice(idx, 1);
        }
    });

    // --- WINGED BEASTS/TARGETS UPDATE ---
    gameState.targets.forEach((t) => {
        t.x += t.vx + (gameState.wind * 2);
        t.propAngle += 0.2;
        
        // Bounce off edges
        if (t.x < 50) { t.vx = Math.abs(t.vx); t.x = 50; }
        if (t.x > canvas.width - 50) { t.vx = -Math.abs(t.vx); t.x = canvas.width - 50; }

        // Beast shooting logic
        t.cooldown--;
        if (t.cooldown <= 0 && t.state === 'idle') {
            t.state = 'charging';
            t.currentCharge = 0;
        }

        if (t.state === 'charging') {
            t.currentCharge++;
            if (t.currentCharge >= t.chargeTime) {
                // Fire projectile at player
                const dx = gameState.tankX - t.x;
                const dy = gameState.groundY - t.y;
                const time = 100;
                const vx = dx / time;
                const vy = (dy - 0.5 * GRAVITY * time * time) / time;
                
                gameState.enemyBullets.push({ x: t.x, y: t.y, vx: vx, vy: vy });
                sfx.shoot(true);
                
                t.state = 'idle';
                t.cooldown = Math.random() * 400 + 400;
            }
        }
    });

    // --- SUPPLY PLANES ---
    gameState.supplyPlanes.forEach((sp, idx) => {
        sp.x += sp.vx;
        
        // Drop crate when close to center
        if (!sp.dropped && sp.x > canvas.width * 0.4 + Math.random()*200) {
            sp.dropped = true;
            const rType = Math.random();
            let type = 'ammo', amt = 5, text = "+5 💣";
            if (rType < 0.3) {
                type = 'health'; amt = 1; text = "+1 ❤️";
            } else if (rType < 0.6) {
                type = 'pmissile'; amt = 2; text = "+2 🚀";
            }
            gameState.crates.push({
                x: sp.x, y: sp.y + 10, vy: 0.5, vx: gameState.wind * 2, radius: 20,
                hasParachute: true, amount: amt, text: text, type: type, despawnTimer: 600
            });
            createFloatingText(sp.x, sp.y + 40, "เสบียงมาส่ง! 📦", "#38bdf8");
        }

        if (sp.x > canvas.width + 100) {
            gameState.supplyPlanes.splice(idx, 1);
        }
    });

    // --- PARTICLES ---
    gameState.particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) gameState.particles.splice(idx, 1);
    });

    // --- FLOATING TEXTS ---
    gameState.floatingTexts.forEach((ft, idx) => {
        ft.y -= 1;
        ft.life -= 0.015;
        if (ft.life <= 0) gameState.floatingTexts.splice(idx, 1);
    });

    // --- HIT FLASH DECREMENT ---
    if (gameState.isHitFlash > 0) gameState.isHitFlash--;

    // --- LEVEL COMPLETE TRANSITION ---
    if (gameState.levelComplete && gameState.targets.length === 0) {
        gameState.level++;
        createFloatingText(canvas.width/2, canvas.height/2, `ขึ้นสู่ระดับ ${gameState.level} 🎖️`, "#10b981");
        newLevel();
    }
}

function createExplosion(x, y, color, count) {
    const defaultColors = ["#ff5722", "#ffeb3b", "#ff9800", "#e91e63", "#795548"];
    const pCount = count || 15;
    for (let i = 0; i < pCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 4;
        gameState.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1.0,
            color: color === "orange" ? defaultColors[Math.floor(Math.random()*defaultColors.length)] : color,
            size: 3 + Math.random()*5
        });
    }
}

function updateAmmoUI() {
    const ammoEl = document.getElementById('ammo-val');
    if (ammoEl) ammoEl.innerText = gameState.ammo;
}

function updateLivesUI() {
    const livesEl = document.getElementById('lives-display');
    if (livesEl) {
        let hearts = '';
        for (let i = 0; i < CONFIG.LIVES; i++) {
            hearts += i < gameState.lives ? '❤️' : '🖤';
        }
        livesEl.innerText = hearts;
    }
}

function updateWindUI() {
    const valEl = document.getElementById('wind-val');
    const arrEl = document.getElementById('wind-arrow');
    if (valEl) valEl.innerText = Math.abs(Math.round(gameState.wind * 100));
    if (arrEl) {
        arrEl.style.transform = `rotate(${gameState.wind >= 0 ? 0 : 180}deg)`;
        arrEl.style.color = Math.abs(gameState.wind) > 0.25 ? "var(--warning)" : "var(--sky)";
    }
}

function updatePMissileUI() {
    const mEl = document.getElementById('p-missile-val');
    if (mEl) {
        mEl.innerText = `${gameState.pMissiles}/5 ${gameState.pMissileCooldown > 0 ? `(รอ ${Math.ceil(gameState.pMissileCooldown/60)}s)` : ''}`;
    }
}

function triggerGameOver(reason) {
    if (typeof versusTimer !== 'undefined' && versusTimer) clearTimeout(versusTimer);
    gameState.isGameOver = true;
    gameState.isPlaying = false;
    sfx.stopBGM();
    sfx.stopMove();
    
    // Calculate star rating
    let stars = 0;
    if (gameState.score >= 150) stars = 3;
    else if (gameState.score >= 80) stars = 2;
    else if (gameState.score >= 30) stars = 1;
    
    // Submit score to SDK
    KAMPAI.submitScore(gameState.score, { stars: stars });
    
    // UI update
    const titleEl = document.getElementById('msg-title');
    const descEl = document.getElementById('msg-desc');
    const boxEl = document.getElementById('msg-box');
    
    if (titleEl) titleEl.innerText = "จบภารกิจ!";
    if (descEl) {
        descEl.innerHTML = `
            <p style="color:#f87171; font-weight:bold;">${reason}</p>
            <p>คะแนนความถูกต้อง: <strong>${gameState.score}</strong> คะแนน</p>
            <p>ความสำเร็จระดับ: <span style="color:#fbbf24; font-size:24px;">${'⭐'.repeat(stars) + '☆'.repeat(3 - stars)}</span></p>
            <div style="font-size:14px; color:#94a3b8; margin-top:10px;">
                ยิงศัตรูพัง: ${gameState.enemiesDestroyed} ลำ | ความแม่นยำ: ${gameState.shotsFired > 0 ? Math.round((gameState.shotsHit/gameState.shotsFired)*100) : 0}%
            </div>
        `;
    }
    
    renderLeaderboard(KAMPAI.leaderboard, 'score-list-gameover');
    
    if (boxEl) boxEl.style.display = 'block';
}

// --- MAIN GRAPHICS DRAW LOOP ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Sky Background
    const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
    skyGrad.addColorStop(0, '#0f172a'); 
    skyGrad.addColorStop(0.5, '#1e1b4b');
    skyGrad.addColorStop(1, '#311042');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Hit Flash Overlay
    if (gameState.isHitFlash > 0) {
        ctx.fillStyle = `rgba(239, 68, 68, ${gameState.isHitFlash * 0.04})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw Wind vectors in background
    ctx.strokeStyle = "rgba(56, 189, 248, 0.1)";
    ctx.lineWidth = 1.5;
    for (let y = 100; y < gameState.groundY; y += 120) {
        const startX = (gameState.frame * gameState.wind * 2) % 200 - 200;
        for (let x = startX; x < canvas.width + 200; x += 200) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 50, y);
            ctx.stroke();
        }
    }

    // Draw Balloons
    gameState.balloons.forEach((b) => {
        ctx.save();
        ctx.translate(b.x + Math.sin(b.sway)*10, b.y);
        
        // Basket string
        ctx.beginPath(); ctx.moveTo(0, 15); ctx.lineTo(0, 30); ctx.strokeStyle = "#8a6e45"; ctx.lineWidth = 1.5; ctx.stroke();
        // Basket
        ctx.fillStyle = "#8a6e45"; ctx.fillRect(-6, 30, 12, 10);
        // Balloon Envelope
        ctx.fillStyle = b.color;
        ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI*2); ctx.fill();
        // Draw +1 Info
        ctx.fillStyle = "white"; ctx.font = "bold 13px Arial"; ctx.textAlign = "center";
        ctx.fillText("❤️", 0, 4);

        ctx.restore();
    });

    // Draw Targets (Airplanes)
    gameState.targets.forEach((t) => {
        drawEnemyPlane(t);
    });

    // Draw Crates
    gameState.crates.forEach((cr) => {
        ctx.save();
        ctx.translate(cr.x, cr.y);

        if (cr.hasParachute) {
            // Parachute ropes
            ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-20, -35); ctx.moveTo(0, 0); ctx.lineTo(20, -35); ctx.stroke();
            // Parachute dome
            ctx.fillStyle = "#38bdf8"; ctx.beginPath(); ctx.arc(0, -35, 20, Math.PI, 0); ctx.fill();
        }

        // Crate Box
        ctx.fillStyle = cr.type === 'health' ? '#ef4444' : (cr.type === 'pmissile' ? '#3b82f6' : '#d97706');
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
        ctx.fillRect(-14, -14, 28, 28);
        ctx.strokeRect(-14, -14, 28, 28);

        // Icon inside crate
        ctx.fillStyle = '#fff'; ctx.font = "12px Arial"; ctx.textAlign = "center";
        ctx.fillText(cr.type === 'health' ? '♥' : (cr.type === 'pmissile' ? '🚀' : '💣'), 0, 4);

        ctx.restore();
    });

    // Draw Enemy Tanks
    gameState.enemyTanks.forEach((et) => {
        drawVectorEnemyTank(et, et.aiming ? 5 : 0);
    });

    // Draw Player Bullet
    if (gameState.bullet) {
        ctx.fillStyle = "#fbbf24";
        ctx.shadowBlur = 10;
        ctx.shadowColor = "#fbbf24";
        ctx.beginPath();
        ctx.arc(gameState.bullet.x, gameState.bullet.y, 6, 0, Math.PI*2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Draw Player Homing Missiles
    gameState.playerMissiles.forEach((pm) => {
        ctx.save();
        ctx.translate(pm.x, pm.y);
        ctx.rotate(Math.atan2(pm.vy, pm.vx) + Math.PI/2);
        ctx.fillStyle = "#3b82f6";
        ctx.fillRect(-4, -15, 8, 30);
        ctx.fillStyle = "#ef4444";
        ctx.beginPath(); ctx.moveTo(-4, -15); ctx.lineTo(0, -25); ctx.lineTo(4, -15); ctx.fill();
        ctx.restore();
    });

    // Draw Enemy Projectiles
    gameState.enemyBullets.forEach((eb) => {
        ctx.fillStyle = "#ef4444";
        ctx.shadowBlur = 8;
        ctx.shadowColor = "#ef4444";
        ctx.beginPath(); ctx.arc(eb.x, eb.y, 5, 0, Math.PI*2); ctx.fill();
        ctx.shadowBlur = 0;
    });

    gameState.enemyMissiles.forEach((em) => {
        ctx.save();
        ctx.translate(em.x, em.y);
        ctx.rotate(Math.atan2(em.vy, em.vx) + Math.PI/2);
        ctx.fillStyle = "#fb923c";
        ctx.fillRect(-3, -12, 6, 24);
        ctx.fillStyle = "#ef4444";
        ctx.beginPath(); ctx.moveTo(-3, -12); ctx.lineTo(0, -18); ctx.lineTo(3, -12); ctx.fill();
        ctx.restore();
    });

    // Draw Supply Planes
    gameState.supplyPlanes.forEach((sp) => {
        ctx.save();
        ctx.translate(sp.x, sp.y);
        ctx.fillStyle = "#64748b";
        // Wings
        ctx.fillRect(-40, -4, 80, 8);
        // Body
        ctx.fillRect(-8, -15, 16, 30);
        ctx.fillStyle = "#475569";
        ctx.fillRect(-15, -2, 30, 4);
        ctx.restore();
    });

    // Draw Particles
    gameState.particles.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI*2);
        ctx.fill();
    });

    // Draw Trajectory
    drawTrajectory();

    // Draw Spacebar Homing Missile Charge UI
    if (gameState.keys.space && gameState.pMissiles > 0 && gameState.pMissileCooldown <= 0) {
        const chargeX = gameState.tankX;
        const chargeY = gameState.groundY - 120;
        
        ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
        ctx.lineWidth = 1.5;
        ctx.drawRoundedRect(chargeX - 60, chargeY - 25, 120, 32, 6);
        ctx.stroke();
        
        const activeCount = gameState.pMissileCharge >= 80 ? 3 : (gameState.pMissileCharge >= 45 ? 2 : (gameState.pMissileCharge >= 15 ? 1 : 0));
        const slots = 3;
        for (let i = 0; i < slots; i++) {
            const slotX = chargeX - 35 + i * 35;
            ctx.font = "16px Arial";
            ctx.textAlign = "center";
            
            if (i < activeCount) {
                ctx.fillStyle = "#38bdf8";
                ctx.fillText("🚀", slotX, chargeY - 3);
            } else {
                ctx.fillStyle = "rgba(100, 116, 139, 0.4)";
                ctx.fillText("🚀", slotX, chargeY - 3);
            }
        }
        
        let nextLimit = 15;
        let prevLimit = 0;
        if (activeCount === 1) { prevLimit = 15; nextLimit = 45; }
        else if (activeCount === 2) { prevLimit = 45; nextLimit = 80; }
        
        if (activeCount < 3) {
            const ratio = (gameState.pMissileCharge - prevLimit) / (nextLimit - prevLimit);
            ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
            ctx.fillRect(chargeX - 50, chargeY + 12, 100, 4);
            ctx.fillStyle = "#38bdf8";
            ctx.fillRect(chargeX - 50, chargeY + 12, 100 * Math.max(0, Math.min(1, ratio)), 4);
        } else {
            ctx.fillStyle = "#fbbf24";
            ctx.fillRect(chargeX - 50, chargeY + 12, 100, 4);
        }
    }

    // Draw Player Tank
    const mouseBarrelAngle = Math.atan2(
        gameState.mousePos.y - (gameState.groundY - 48),
        gameState.mousePos.x - (gameState.tankX + 5)
    );
    drawVectorPlayerTank(gameState.tankX, gameState.groundY, mouseBarrelAngle, gameState.isHitFlash);

    // Draw Ground
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, gameState.groundY, canvas.width, canvas.height - gameState.groundY);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, gameState.groundY, canvas.width, 6);

    // Draw Floating Texts
    gameState.floatingTexts.forEach((ft) => {
        ctx.fillStyle = ft.color;
        ctx.font = "bold 20px Kanit";
        ctx.textAlign = "center";
        ctx.globalAlpha = ft.life;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1.0;
    });
}

function gameLoop(time) {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

// Start everything
init();
window.startGame = startGame;
window.toggleMusic = toggleMusic;
window.showTitleScreen = showTitleScreen;

// Versus / Multiplayer Mode Integration
let versusTimer = null;
const vs = KampaiVersus.create({
    duration: 90,
    title: 'Fraction Tank Battle',
    rankBy: 'score',
    onPlay: ({ rng }) => {
        startGame(rng);
        if (versusTimer) clearTimeout(versusTimer);
        versusTimer = setTimeout(() => {
            triggerGameOver("หมดเวลารอบประลอง!");
        }, 90 * 1000);
    },
    onEnd: () => {
        if (versusTimer) clearTimeout(versusTimer);
        triggerGameOver("หมดเวลารอบประลอง!");
    }
});
window.vs = vs;
