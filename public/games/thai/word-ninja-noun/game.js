(function() {
    /* ================= CONFIG & WORD BANKS ================= */
    const CFG = window.GAME_CONFIG;
    const DATA = window.GAME_DATA;

    const NOUNS = DATA.NOUNS;
    const NON_NOUNS = DATA.NON_NOUNS;

    const GAME_DURATION = CFG.GAME_DURATION;
    const LIVES_START = CFG.LIVES_START;
    const LB_KEY = "wordNinjaLeaderboard";

    /* ================= DOM REFS ================= */
    const videoEl = document.getElementById('inputVideo');
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const startScreen = document.getElementById('startScreen');
    const gameOverScreen = document.getElementById('gameOverScreen');
    const leaderboardScreen = document.getElementById('leaderboardScreen');
    const hud = document.getElementById('hud');
    const scoreBox = document.getElementById('scoreBox');
    const comboText = document.getElementById('comboText');
    const livesBox = document.getElementById('lives');
    const timerBox = document.getElementById('timerBox');
    const playerNameTag = document.getElementById('playerNameTag');
    const camBtn = document.getElementById('camBtn');
    const startBtn = document.getElementById('startBtn');
    const vsBtn = document.getElementById('vsBtn');
    const camStatus = document.getElementById('camStatus');

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    /* Decorative bamboo stripes */
    (function bamboo() {
        const app = document.getElementById('app');
        for (let i = 0; i < 14; i++) {
            const el = document.createElement('div');
            el.className = 'bamboo-stripe';
            el.style.left = (i * 7.5) + '%';
            el.style.height = (40 + Math.random() * 40) + '%';
            app.appendChild(el);
        }
    })();

    /* ================= AUDIO (Web Audio API, procedural) ================= */
    let audioCtx = null;
    function ensureAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (ksdk && ksdk.sound && typeof ksdk.sound.unlock === 'function') {
            ksdk.sound.unlock();
        }
    }
    function beep(freqStart, freqEnd, duration, type = 'sine', gainVal = 0.15) {
        if (!audioCtx) return;
        try {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freqStart, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(Math.max(freqEnd, 1), audioCtx.currentTime + duration);
            gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + duration);
        } catch (e) {
            console.warn(e);
        }
    }
    function sfxSlice() {
        beep(700, 220, 0.15, 'sawtooth', 0.12);
        if (ksdk && ksdk.sound && typeof ksdk.sound.correct === 'function') {
            ksdk.sound.correct();
        }
    }
    function sfxWrong() {
        beep(180, 60, 0.35, 'square', 0.18);
        if (ksdk && ksdk.sound) {
            if (typeof ksdk.sound.wrong === 'function') ksdk.sound.wrong();
            if (typeof ksdk.sound.fxFlash === 'function') ksdk.sound.fxFlash();
        }
    }
    function sfxMiss() {
        beep(260, 80, 0.25, 'triangle', 0.12);
        if (ksdk && ksdk.sound && typeof ksdk.sound.wrong === 'function') {
            ksdk.sound.wrong();
        }
    }
    function sfxCombo() {
        beep(500, 1200, 0.2, 'sine', 0.1);
        if (ksdk && ksdk.sound && typeof ksdk.sound.correct === 'function') {
            ksdk.sound.correct();
        }
    }

    /* ================= GAME STATE ================= */
    let state = 'idle'; // idle | playing | over
    let score = 0, lives = LIVES_START, combo = 0, timeLeft = GAME_DURATION;
    let words = []; // {text,isNoun,x,y,vx,vy,r,color,sliced,age}
    let particles = [];
    let spawnTimer = 0, spawnInterval = CFG.SPAWN_INTERVAL;
    let elapsed = 0;
    let playerName = '';
    let lastFrameTime = 0;
    let gravity = CFG.GRAVITY; // px/s^2

    let handTrail = []; // {x,y,t}
    let fingertip = null; // {x,y}
    let flashColor = null, flashTime = 0;

    const COLORS = ["#e8b64c", "#7fbf8a", "#e07a5f", "#81b29a", "#f2cc8f", "#c1442d"];

    /* ================= SDK / VERSUS INTEGRATION ================= */
    let ksdk = null;
    let vs = null;
    let qrand = Math.random;

    function renderPlayer() {
        const s = ksdk ? ksdk.student : null;
        const st = ksdk ? ksdk.stats : null;
        const chip = document.getElementById('player-chip');
        if (!chip) return;
        if (!s) {
            chip.style.display = 'none';
            return;
        }
        const av = s.photoUrl ? `<img src="${s.photoUrl}" alt="">` : `<div class="pc-init">${(s.displayName || s.name || '?')[0]}</div>`;
        const best = st ? ` · <span class="pc-best">สถิติ ${st.personalBest.toLocaleString()}</span>` : '';
        chip.innerHTML = av + `<span>${s.displayName || s.name}${best}</span>`;
        chip.style.display = 'flex';
    }

    if (window.KAMPAI) {
        window.KAMPAI.onReady((k) => {
            ksdk = k;
            renderPlayer();
            
            // Setup Versus mode (Check 11 requirement)
            vs = window.KampaiVersus.create({
                onPlay: ({ rng, player }) => {
                    qrand = rng || Math.random;
                    playerName = (player && player.name) ? player.name : (ksdk.student ? (ksdk.student.displayName || ksdk.student.name) : 'ผู้เล่น');
                    startGame();
                },
                onEnd: () => {
                    endGame();
                }
            });
        });
    }

    function resetGame() {
        score = 0;
        lives = LIVES_START;
        combo = 0;
        timeLeft = GAME_DURATION;
        words = [];
        particles = [];
        spawnTimer = 0;
        spawnInterval = CFG.SPAWN_INTERVAL;
        elapsed = 0;
        handTrail = [];
    }

    function renderLives() {
        livesBox.innerHTML = '';
        for (let i = 0; i < LIVES_START; i++) {
            const span = document.createElement('span');
            span.textContent = i < lives ? '⭐' : '☆';
            span.style.fontSize = '18px';
            span.style.marginRight = '2px';
            livesBox.appendChild(span);
        }
    }

    /* ================= WORD SPAWNING & PHYSICS ================= */
    function spawnWord() {
        const isNoun = qrand() < 0.62;
        const bank = isNoun ? NOUNS : NON_NOUNS;
        const text = bank[Math.floor(qrand() * bank.length)];
        const r = Math.max(46, 20 + text.length * 7);
        const x = r + qrand() * (canvas.width - r * 2);
        const vx = (qrand() - 0.5) * 160;
        const targetHeightFrac = 0.25 + qrand() * 0.25; // how high up the arc peaks
        const vy = -Math.sqrt(2 * gravity * (canvas.height * (1 - targetHeightFrac)));
        words.push({
            text, isNoun, x, y: canvas.height + r,
            vx, vy, r, sliced: false,
            color: COLORS[Math.floor(qrand() * COLORS.length)]
        });
    }

    function updateWords(dt) {
        for (const w of words) {
            w.vy += gravity * dt;
            w.x += w.vx * dt;
            w.y += w.vy * dt;
        }
        // remove offscreen
        words = words.filter(w => {
            const gone = w.y - w.r > canvas.height + 40 || w.x < -w.r - 40 || w.x > canvas.width + w.r + 40;
            if (gone && !w.sliced && w.isNoun && w.vy > 0) {
                // missed a noun that fell past bottom
                loseLife();
                sfxMiss();
            }
            return !gone;
        });
    }

    /* ================= PARTICLES ================= */
    function spawnParticles(x, y, color, count = 16) {
        for (let i = 0; i < count; i++) {
            const ang = qrand() * Math.PI * 2;
            const spd = 120 + qrand() * 220;
            particles.push({
                x, y,
                vx: Math.cos(ang) * spd,
                vy: Math.sin(ang) * spd,
                life: 0.5 + qrand() * 0.3,
                age: 0,
                color
            });
        }
    }
    function updateParticles(dt) {
        for (const p of particles) {
            p.age += dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.vy += gravity * 0.6 * dt;
        }
        particles = particles.filter(p => p.age < p.life);
    }
    function drawParticles() {
        for (const p of particles) {
            const a = 1 - (p.age / p.life);
            ctx.globalAlpha = Math.max(a, 0);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    /* ================= SCORING ================= */
    function addScore(w) {
        combo++;
        const bonus = Math.min(combo, 10) * 2;
        score += 10 + bonus;
        scoreBox.textContent = score;
        comboText.textContent = 'คอมโบ x' + combo;
        spawnParticles(w.x, w.y, w.color, 22);
        sfxSlice();
        if (combo > 0 && combo % 5 === 0) sfxCombo();
        flashColor = 'rgba(127,191,138,0.18)';
        flashTime = 0.15;
        if (vs) {
            vs.report(score, { correct: score });
        }
    }
    function wrongSlice(w) {
        combo = 0;
        score = Math.max(0, score - 5);
        scoreBox.textContent = score;
        comboText.textContent = 'คอมโบ x0';
        spawnParticles(w.x, w.y, '#c1442d', 18);
        sfxWrong();
        loseLife();
        flashColor = 'rgba(193,68,45,0.22)';
        flashTime = 0.2;
        if (vs) {
            vs.report(score, { correct: score });
        }
    }
    function loseLife() {
        lives = Math.max(0, lives - 1);
        renderLives();
        if (lives <= 0) {
            endGame();
        }
    }

    /* ================= HAND TRACKING (MediaPipe) ================= */
    let hands = null;
    let camStream = null;
    let handsReady = false;

    function initHands() {
        hands = new Hands({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
        });
        hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.5
        });
        hands.onResults(onHandResults);
    }

    function onHandResults(results) {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const lm = results.multiHandLandmarks[0][8]; // index fingertip
            const mx = canvas.width - lm.x * canvas.width; // mirror to match flipped video draw
            const my = lm.y * canvas.height;
            fingertip = { x: mx, y: my };
            handTrail.push({ x: mx, y: my, t: performance.now() });
            if (handTrail.length > 8) handTrail.shift();
        } else {
            fingertip = null;
        }
    }

    async function requestCamera() {
        camStatus.textContent = 'กำลังขอสิทธิ์กล้อง...';
        try {
            camStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user', width: 1280, height: 720 },
                audio: false
            });
            videoEl.srcObject = camStream;
            await videoEl.play();
            initHands();
            handsReady = true;
            startBtn.disabled = false;
            camStatus.textContent = '✅ กล้องพร้อมแล้ว! กดเริ่มเกมได้เลย';
            camBtn.disabled = true;
            pumpFrames();
        } catch (err) {
            camStatus.textContent = '❌ ไม่สามารถเข้าถึงกล้องได้: ' + err.message;
        }
    }

    let animFrameId = null;
    async function pumpFrames() {
        if (videoEl.readyState >= 2 && hands) {
            await hands.send({ image: videoEl });
        }
        if (camStream) {
            animFrameId = requestAnimationFrame(pumpFrames);
        }
    }

    function stopCamera() {
        if (camStream) {
            try {
                camStream.getTracks().forEach(track => track.stop());
            } catch (e) { console.warn(e); }
            camStream = null;
        }
        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
        handsReady = false;
        hands = null;
        camBtn.disabled = false;
        camStatus.textContent = '';
    }

    /* ================= SLICE DETECTION ================= */
    function pointSegDist(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1, dy = y2 - y1;
        const len2 = dx * dx + dy * dy;
        if (len2 === 0) return Math.hypot(px - x1, py - y1);
        let t = ((px - x1) * dx + (py - y1) * dy) / len2;
        t = Math.max(0, Math.min(1, t));
        const cx = x1 + t * dx, cy = y1 + t * dy;
        return Math.hypot(px - cx, py - cy);
    }

    function checkSlices() {
        if (handTrail.length < 2) return;
        const p2 = handTrail[handTrail.length - 1];
        const p1 = handTrail[handTrail.length - 2];
        const moveDist = Math.hypot(p2.x - p1.x, p2.y - p1.y);
        if (moveDist < 6) return; // ignore near-static hand
        for (const w of words) {
            if (w.sliced) continue;
            const d = pointSegDist(w.x, w.y, p1.x, p1.y, p2.x, p2.y);
            if (d < w.r) {
                w.sliced = true;
                if (w.isNoun) addScore(w); else wrongSlice(w);
            }
        }
    }

    /* Mouse/Touch Slicing Fallback */
    let isMouseDown = false;
    canvas.addEventListener('mousedown', (e) => {
        if (state !== 'playing') return;
        isMouseDown = true;
        updateTrailPos(e.clientX, e.clientY);
    });
    canvas.addEventListener('mousemove', (e) => {
        if (state !== 'playing' || !isMouseDown) return;
        updateTrailPos(e.clientX, e.clientY);
    });
    canvas.addEventListener('mouseup', () => {
        isMouseDown = false;
        fingertip = null;
        handTrail = [];
    });
    canvas.addEventListener('mouseleave', () => {
        isMouseDown = false;
        fingertip = null;
        handTrail = [];
    });

    canvas.addEventListener('touchstart', (e) => {
        if (state !== 'playing') return;
        const t = e.touches[0];
        updateTrailPos(t.clientX, t.clientY);
    });
    canvas.addEventListener('touchmove', (e) => {
        if (state !== 'playing') return;
        const t = e.touches[0];
        updateTrailPos(t.clientX, t.clientY);
    });
    canvas.addEventListener('touchend', () => {
        fingertip = null;
        handTrail = [];
    });

    function updateTrailPos(mx, my) {
        fingertip = { x: mx, y: my };
        handTrail.push({ x: mx, y: my, t: performance.now() });
        if (handTrail.length > 8) handTrail.shift();
    }

    /* ================= DRAWING ================= */
    function drawVideoMirrored() {
        if (videoEl.readyState < 2) return;
        ctx.save();
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        // cover-fit
        const vw = videoEl.videoWidth, vh = videoEl.videoHeight;
        if (vw && vh) {
            const scale = Math.max(canvas.width / vw, canvas.height / vh);
            const dw = vw * scale, dh = vh * scale;
            const dx = (canvas.width - dw) / 2, dy = (canvas.height - dh) / 2;
            ctx.globalAlpha = 0.55;
            ctx.drawImage(videoEl, dx, dy, dw, dh);
            ctx.globalAlpha = 1;
        }
        ctx.restore();
        // subtle dark overlay for contrast
        ctx.fillStyle = 'rgba(11,22,32,0.35)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    function drawWords() {
        for (const w of words) {
            ctx.beginPath();
            ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
            ctx.fillStyle = w.color;
            ctx.globalAlpha = w.sliced ? 0 : 0.92;
            ctx.fill();
            ctx.lineWidth = 3;
            ctx.strokeStyle = 'rgba(255,255,255,0.4)';
            ctx.stroke();
            ctx.globalAlpha = 1;
            if (!w.sliced) {
                ctx.fillStyle = '#0f1b24';
                ctx.font = "700 " + Math.max(18, w.r * 0.5) + "px 'Mitr', sans-serif";
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(w.text, w.x, w.y + 2);
            }
        }
    }

    function drawTrail() {
        if (handTrail.length < 2) return;
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        for (let i = 1; i < handTrail.length; i++) {
            const a = handTrail[i - 1], b = handTrail[i];
            const alpha = i / handTrail.length;
            ctx.strokeStyle = `rgba(232,182,76,${alpha * 0.9})`;
            ctx.lineWidth = 4 + alpha * 10;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }
        ctx.restore();
        if (fingertip) {
            ctx.beginPath();
            ctx.arc(fingertip.x, fingertip.y, 9, 0, Math.PI * 2);
            ctx.fillStyle = '#f6d98a';
            ctx.shadowColor = '#e8b64c';
            ctx.shadowBlur = 18;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }

    /* ================= MAIN LOOP ================= */
    function loop(ts) {
        if (!lastFrameTime) lastFrameTime = ts;
        const dt = Math.min(0.05, (ts - lastFrameTime) / 1000);
        lastFrameTime = ts;

        // Decaying slice trail points dynamically to keep drawing smooth
        const now = performance.now();
        handTrail = handTrail.filter(pt => now - pt.t < 180);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawVideoMirrored();

        if (state === 'playing') {
            elapsed += dt;
            spawnTimer += dt;
            // difficulty ramp
            spawnInterval = Math.max(550, CFG.SPAWN_INTERVAL - elapsed * 12);
            if (spawnTimer > spawnInterval / 1000) {
                spawnTimer = 0;
                spawnWord();
            }

            updateWords(dt);
            checkSlices();
            updateParticles(dt);

            timeLeft -= dt;
            if (timeLeft <= 0) {
                timeLeft = 0;
                endGame();
            }
            timerBox.textContent = Math.ceil(timeLeft);
        }

        drawWords();
        drawParticles();
        drawTrail();

        if (flashTime > 0) {
            flashTime -= dt;
            ctx.fillStyle = flashColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    /* ================= FLOW / SCREENS ================= */
    function hideAllScreens() {
        [startScreen, gameOverScreen, leaderboardScreen].forEach(s => s.classList.add('hidden'));
    }
    function showScreen(el) {
        hideAllScreens();
        el.classList.remove('hidden');
    }

    function startGame() {
        playerName = (ksdk && ksdk.student) ? (ksdk.student.displayName || ksdk.student.name) : 'ผู้เล่น';
        ensureAudio();
        resetGame();
        renderLives();
        scoreBox.textContent = '0';
        comboText.textContent = 'คอมโบ x0';
        timerBox.textContent = GAME_DURATION;
        playerNameTag.textContent = '🥷 ' + playerName;
        playerNameTag.classList.remove('hidden');
        hud.classList.remove('hidden');
        hideAllScreens();
        
        if (ksdk && ksdk.sound && typeof ksdk.sound.bgmStart === 'function') {
            ksdk.sound.defaultBgm ? ksdk.sound.defaultBgm(CFG.BGM_PRESET) : ksdk.sound.bgmStart();
        }
        
        state = 'playing';
    }

    function endGame() {
        if (state === 'over') return;
        state = 'over';
        hud.classList.add('hidden');
        playerNameTag.classList.add('hidden');
        
        if (ksdk && ksdk.sound && typeof ksdk.sound.bgmStop === 'function') {
            ksdk.sound.bgmStop();
        }
        if (ksdk && ksdk.sound && typeof ksdk.sound.gameOver === 'function') {
            ksdk.sound.gameOver();
        }
        
        saveScore(playerName, score);
        
        if (vs) {
            if (vs.finish(score, { correct: score })) {
                return;
            }
        }
        
        if (window.KAMPAI) {
            KAMPAI.submitScore(score, { mode: vs ? vs.mode : 'solo' });
        }
        
        document.getElementById('finalScore').textContent = score;
        document.getElementById('finalCombo').textContent = 'คอมโบสูงสุด: x' + combo;
        showScreen(gameOverScreen);
    }

    /* ================= LEADERBOARD ================= */
    function loadLB() {
        try {
            return JSON.parse(localStorage.getItem(LB_KEY)) || [];
        } catch (e) {
            return [];
        }
    }
    function saveScore(name, sc) {
        const lb = loadLB();
        lb.push({ name, score: sc, ts: Date.now() });
        lb.sort((a, b) => b.score - a.score);
        localStorage.setItem(LB_KEY, JSON.stringify(lb.slice(0, 20)));
    }
    function renderLB() {
        const list = document.getElementById('lbList');
        list.innerHTML = '';
        
        let lb = [];
        if (ksdk && ksdk.leaderboard && ksdk.leaderboard.length > 0) {
            lb = ksdk.leaderboard.map(item => ({
                name: item.student_name || 'ผู้เล่น',
                score: item.score
            }));
        } else {
            lb = loadLB();
        }
        
        if (lb.length === 0) {
            list.innerHTML = '<li style="justify-content:center;color:rgba(243,236,216,0.5)">ยังไม่มีคะแนน เล่นเกมก่อนนะ!</li>';
            return;
        }
        lb.slice(0, 10).forEach((entry, i) => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="rank">#${i + 1}</span><span class="nm">${escapeHTML(entry.name)}</span><span class="sc">${entry.score}</span>`;
            list.appendChild(li);
        });
    }
    function escapeHTML(s) {
        return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    }

    /* ================= EVENTS ================= */
    camBtn.addEventListener('click', requestCamera);
    startBtn.addEventListener('click', startGame);
    vsBtn.addEventListener('click', () => {
        if (vs) {
            vs.openMenu();
        } else {
            alert('Versus mode is not ready yet.');
        }
    });
    
    document.getElementById('nextPlayerBtn').addEventListener('click', () => {
        stopCamera();
        showScreen(startScreen);
    });
    document.getElementById('showLbFromStart').addEventListener('click', () => {
        renderLB();
        showScreen(leaderboardScreen);
    });
    document.getElementById('showLbFromEnd').addEventListener('click', () => {
        renderLB();
        showScreen(leaderboardScreen);
    });
    document.getElementById('closeLbBtn').addEventListener('click', () => {
        showScreen(state === 'over' ? gameOverScreen : startScreen);
    });
})();
