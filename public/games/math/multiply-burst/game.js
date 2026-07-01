/* game.js — สูตรคูณตาไว Multiply Burst (KAMPAI SDK + KampaiHands) */
(function () {
    'use strict';
    var CFG = window.GAME_CONFIG, DATA = window.GAME_DATA;
    var $ = function (id) { return document.getElementById(id); };

    KAMPAI.setSlug(CFG.SLUG);
    KAMPAI.sound.mountToggles();
    KAMPAI.sound.defaultBgm(CFG.BGM || 'playful');

    var canvas, ctx;
    var balloons = [];
    var particles = [];
    var popups = [];
    var score = 0;
    var timeLeft = CFG.GAME_DURATION;
    var correctHits = 0;
    var wrongHits = 0;
    var spawnTimer = null;
    var countdownTimer = null;
    var mainTimer = null;
    var gameState = 'start';
    var rafId = null;
    var playerName = 'ผู้เล่น';
    var localLeaderboard = [];
    var seededRng = null;
    var hands = null;
    var currentQuestion = null;
    var wrongPool = [];

    var vs = window.KampaiVersus ? KampaiVersus.create({
        duration: CFG.GAME_DURATION,
        title: 'สูตรคูณตาไว',
        rankBy: 'score',
        onPlay: function (opts) {
            var rng = opts && opts.rng;
            if (rng) {
                var seed = Math.floor(rng() * 4294967296);
                seededRng = createMulberry32(seed);
            }
            stopHandTracking();
            startGame();
        },
        onEnd: function () {
            cleanup();
            KAMPAI.sound.bgmStop();
            KAMPAI.sound.gameOver();
        }
    }) : null;

    function createMulberry32(seed) {
        return function () {
            var t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function activeRng() {
        return seededRng || Math.random;
    }

    function randInt(min, max) {
        var r = activeRng();
        return min + Math.floor(r() * (max - min + 1));
    }

    function pickPhrase(list) {
        return list[Math.floor(activeRng() * list.length)];
    }

    function buildWrongAnswers(q) {
        var ans = q.answer;
        var a = q.a;
        var b = q.b;
        var set = {};
        var wrong = [];

        function add(v) {
            if (v === ans || v <= 0 || v > 100 || set[v]) return;
            set[v] = true;
            wrong.push(v);
        }

        add(a * (b + 1));
        add(a * (b - 1));
        add((a + 1) * b);
        add((a - 1) * b);
        add(ans + randInt(1, 5));
        add(ans - randInt(1, 5));
        add(a + b);
        add(Math.abs(a - b) * Math.max(a, b));

        while (wrong.length < 6) {
            var ta = randInt(CFG.TABLE_MIN, CFG.TABLE_MAX);
            var tb = randInt(CFG.TABLE_MIN, CFG.TABLE_MAX);
            add(ta * tb);
        }

        return wrong;
    }

    function newQuestion() {
        var a = randInt(CFG.TABLE_MIN, CFG.TABLE_MAX);
        var b = randInt(CFG.TABLE_MIN, CFG.TABLE_MAX);
        currentQuestion = { a: a, b: b, answer: a * b };
        wrongPool = buildWrongAnswers(currentQuestion);
        updateQuestionHud();
    }

    function updateQuestionHud() {
        var el = $('question-text');
        if (el && currentQuestion) {
            el.textContent = currentQuestion.a + ' × ' + currentQuestion.b + ' = ?';
        }
    }

    function renderPlayer() {
        var s = KAMPAI.student, stt = KAMPAI.stats, chip = $('player-chip');
        if (!s || !chip) return;
        var av = s.photoUrl ? '<img src="' + s.photoUrl + '" alt="">' : '<div class="ini">' + ((s.displayName || '?')[0]) + '</div>';
        var best = stt ? ' · <b style="color:#ffce54">สถิติสูงสุด ' + (stt.personalBest || 0) + '</b>' : '';
        chip.innerHTML = av + '<span>' + s.displayName + best + '</span>';
        chip.style.display = 'flex';
        playerName = s.displayName || 'ผู้เล่น';
    }

    function renderLeaderboard() {
        var rows = KAMPAI.leaderboard || [];
        var box = $('leaderboard'), list = $('lb-rows');
        if (!rows.length) {
            box.style.display = 'none';
            return;
        }
        var medals = ['🥇', '🥈', '🥉'];
        list.innerHTML = rows.slice(0, 5).map(function (r, idx) {
            return '<div class="lb-row' + (r.isMe ? ' me' : '') + '">' +
                '<span><span class="lb-rank">' + (medals[idx] || '#' + (idx + 1)) + '</span>' +
                '<span class="lb-name">' + escapeHtml(r.displayName) + (r.isMe ? ' (คุณ)' : '') + '</span></span>' +
                '<span class="lb-score">' + (r.personalBest || 0) + '</span></div>';
        }).join('');
        box.style.display = 'block';
    }

    KAMPAI.onReady(function () {
        renderPlayer();
        renderLeaderboard();
    });

    function showScreen(id) {
        ['ui-start', 'ui-countdown', 'ui-end'].forEach(function (x) {
            $(x).classList.toggle('hidden', x !== id);
            $(x).classList.toggle('active', x === id);
        });
    }

    function buildHands() {
        return KampaiHands.create({
            video: '#arVideo',
            hands: CFG.HANDS,
            getCanvasSize: function () {
                return canvas ? { w: canvas.width, h: canvas.height } : null;
            }
        });
    }

    function startHandTracking() {
        if (!hands) hands = buildHands();
        return hands.start();
    }

    function stopHandTracking() {
        if (hands) hands.stop();
    }

    var audioCtx = null;
    function ensureAudio() {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    function playTone(freq, duration, type, gainVal, delay) {
        if (!audioCtx) return;
        type = type || 'sine';
        gainVal = gainVal != null ? gainVal : 0.18;
        delay = delay || 0;
        var t0 = audioCtx.currentTime + delay;
        var osc = audioCtx.createOscillator();
        var gain = osc.context.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, t0);
        gain.gain.setValueAtTime(gainVal, t0);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t0);
        osc.stop(t0 + duration + 0.02);
    }
    function playSfxCountBeep() { playTone(660, 0.12, 'sine', 0.2); }
    function playSfxGo() { playTone(990, 0.25, 'triangle', 0.22); }
    function playSfxTick() { playTone(500, 0.08, 'square', 0.08); }

    function resizeCanvas() {
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    }

    function pickBalloonValue() {
        if (!currentQuestion) return 0;
        var isCorrect = activeRng() < (CFG.CORRECT_SPAWN_WEIGHT || 0.32);
        if (isCorrect) return currentQuestion.answer;
        return wrongPool[Math.floor(activeRng() * wrongPool.length)];
    }

    function spawnBalloon() {
        if (gameState !== 'playing' || !currentQuestion) return;
        var r = activeRng();
        var value = pickBalloonValue();
        var radius = CFG.BALLOON_RADIUS_MIN + r() * (CFG.BALLOON_RADIUS_MAX - CFG.BALLOON_RADIUS_MIN);
        var colorPair = DATA.BALLOON_COLORS[Math.floor(r() * DATA.BALLOON_COLORS.length)];
        balloons.push({
            x: radius + r() * (canvas.width - radius * 2),
            y: canvas.height + radius,
            vy: -(CFG.BALLOON_SPEED_MIN + r() * (CFG.BALLOON_SPEED_MAX - CFG.BALLOON_SPEED_MIN)),
            sway: r() * Math.PI * 2,
            swaySpeed: 0.02 + r() * 0.02,
            radius: radius,
            value: value,
            isCorrect: value === currentQuestion.answer,
            colorLight: colorPair[0],
            colorDark: colorPair[1],
            popped: false
        });
    }

    function spawnBurst(x, y, colorLight) {
        for (var i = 0; i < 16; i++) {
            var angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.3;
            var speed = 2 + Math.random() * 3.5;
            particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.5,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02,
                size: 3 + Math.random() * 4,
                color: colorLight
            });
        }
    }

    function spawnPopup(x, y, text, good) {
        popups.push({ x: x, y: y, text: text, life: 1.0, good: good });
    }

    function popBalloon(b, index, drawX) {
        b.popped = true;
        if (b.isCorrect) {
            score += CFG.POINTS_CORRECT;
            correctHits++;
            spawnBurst(drawX, b.y, b.colorLight);
            spawnPopup(drawX, b.y, '+' + CFG.POINTS_CORRECT, true);
            KAMPAI.sound.correct();
            KAMPAI.sound.speak(pickPhrase(DATA.CORRECT_PHRASES), 'th-TH');
            KAMPAI.sound.fxFlash(true);
            newQuestion();
        } else {
            score += CFG.POINTS_WRONG;
            wrongHits++;
            spawnBurst(drawX, b.y, b.colorLight);
            spawnPopup(drawX, b.y, String(CFG.POINTS_WRONG), false);
            KAMPAI.sound.wrong();
            KAMPAI.sound.fxFlash(false);
        }
        updateScoreHud();
        if (vs) vs.report(score, { correct: correctHits, wrong: wrongHits });
        balloons.splice(index, 1);
    }

    function updateScoreHud() {
        var el = $('score-value');
        if (el) {
            el.textContent = score;
            el.style.color = score < 0 ? 'var(--danger)' : 'var(--accent)';
        }
    }

    function updateTimerHud() {
        var el = $('timer-value');
        if (el) el.textContent = timeLeft;
        var pill = $('timer-pill');
        if (pill) {
            if (timeLeft <= 10) pill.classList.add('warning');
            else pill.classList.remove('warning');
        }
    }

    function clientToCanvas(clientX, clientY) {
        return hands ? hands.clientToCanvas(canvas, clientX, clientY) : { x: clientX, y: clientY };
    }

    function collectHitProbes() {
        return hands ? hands.collectHitProbes() : [];
    }

    function hitsBalloon(b, drawX, probes, pad) {
        var hitR = b.radius + (pad || 0);
        for (var pi = 0; pi < probes.length; pi++) {
            var p = probes[pi];
            var dx = p.x - drawX;
            var dy = p.y - b.y;
            if (dx * dx + dy * dy < hitR * hitR) return true;
        }
        return false;
    }

    function handleCanvasTap(e) {
        if (gameState !== 'playing') return;
        var clientX = e.clientX != null ? e.clientX : (e.touches && e.touches[0] && e.touches[0].clientX);
        var clientY = e.clientY != null ? e.clientY : (e.touches && e.touches[0] && e.touches[0].clientY);
        if (clientX == null || clientY == null) return;
        if (e.cancelable) e.preventDefault();
        var pt = clientToCanvas(clientX, clientY);
        var probes = [{ x: pt.x, y: pt.y }];

        for (var i = balloons.length - 1; i >= 0; i--) {
            var b = balloons[i];
            if (b.popped) continue;
            var drawX = b.x + Math.sin(b.sway) * 10;
            if (hitsBalloon(b, drawX, probes, CFG.FINGER_HIT_PADDING || 0)) {
                popBalloon(b, i, drawX);
                break;
            }
        }
    }

    function updateAndDrawBalloons() {
        var hitPad = CFG.FINGER_HIT_PADDING || 0;
        var probes = collectHitProbes();

        for (var i = balloons.length - 1; i >= 0; i--) {
            var b = balloons[i];
            if (b.popped) continue;
            b.y += b.vy;
            b.sway += b.swaySpeed;
            var drawX = b.x + Math.sin(b.sway) * 10;

            if (probes.length && hitsBalloon(b, drawX, probes, hitPad)) {
                popBalloon(b, i, drawX);
                continue;
            }

            if (b.y < -b.radius * 2) {
                balloons.splice(i, 1);
                continue;
            }
            drawBalloon(b, drawX);
        }
    }

    function drawBalloon(b, drawX) {
        var label = String(b.value);
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(drawX, b.y + b.radius * 0.95);
        ctx.lineTo(drawX, b.y + b.radius * 1.35);
        ctx.stroke();

        var grad = ctx.createRadialGradient(drawX - b.radius * 0.3, b.y - b.radius * 0.35, b.radius * 0.15, drawX, b.y, b.radius);
        grad.addColorStop(0, b.colorLight);
        grad.addColorStop(1, b.colorDark);
        ctx.beginPath();
        ctx.ellipse(drawX, b.y, b.radius * 0.88, b.radius, 0, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(0,0,0,0.35)';
        ctx.shadowBlur = 14;
        ctx.shadowOffsetY = 6;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;

        ctx.beginPath();
        ctx.ellipse(drawX - b.radius * 0.32, b.y - b.radius * 0.4, b.radius * 0.22, b.radius * 0.32, -0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(drawX - 6, b.y + b.radius * 0.9);
        ctx.lineTo(drawX + 6, b.y + b.radius * 0.9);
        ctx.lineTo(drawX, b.y + b.radius * 1.05);
        ctx.closePath();
        ctx.fillStyle = b.colorDark;
        ctx.fill();

        var fontSize = Math.max(22, b.radius * 0.55);
        ctx.font = "800 " + fontSize + "px 'Mitr', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 5;
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.strokeText(label, drawX, b.y);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, drawX, b.y);
        ctx.restore();
    }

    function updateAndDrawParticles() {
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.12;
            p.life -= p.decay;
            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }
            ctx.beginPath();
            ctx.globalAlpha = Math.max(p.life, 0);
            ctx.fillStyle = p.color;
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    function updateAndDrawPopups() {
        for (var i = popups.length - 1; i >= 0; i--) {
            var p = popups[i];
            p.y -= 1.3;
            p.life -= 0.018;
            if (p.life <= 0) {
                popups.splice(i, 1);
                continue;
            }
            ctx.save();
            ctx.globalAlpha = Math.max(p.life, 0);
            ctx.font = "800 28px 'Mitr', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillStyle = p.good ? '#4be07a' : '#ff5c72';
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 4;
            ctx.strokeText(p.text, p.x, p.y);
            ctx.fillText(p.text, p.x, p.y);
            ctx.restore();
        }
    }

    function drawHandTracking() {
        if (!hands || hands.mode !== 'camera') return;
        if (hands.leftLandmarks) {
            hands.drawSkeleton(ctx, hands.leftLandmarks, 'rgba(75, 224, 122, 1)', 'มือซ้าย');
        }
        if (hands.rightLandmarks) {
            hands.drawSkeleton(ctx, hands.rightLandmarks, 'rgba(255, 206, 84, 1)', 'มือขวา');
        }
    }

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (gameState === 'playing') {
            updateAndDrawBalloons();
        }

        updateAndDrawParticles();
        updateAndDrawPopups();
        drawHandTracking();

        rafId = requestAnimationFrame(gameLoop);
    }

    function handleStartClick() {
        ensureAudio();
        seededRng = null;
        $('cam-error').textContent = '';
        $('loading').classList.add('on');

        startHandTracking().then(function () {
            $('loading').classList.remove('on');
            beginCountdown();
        }).catch(function (err) {
            console.warn('Camera/Hands failed, tap fallback:', err);
            $('cam-error').textContent = 'เปิดกล้องไม่ได้ ระบบสลับไปยังโหมดแตะสัมผัส';
            $('loading').classList.remove('on');
            beginCountdown();
        });
    }

    function beginCountdown() {
        gameState = 'countdown';
        showScreen('ui-countdown');
        var n = 3;
        var numEl = $('count-num');
        numEl.textContent = n;
        playSfxCountBeep();

        countdownTimer = setInterval(function () {
            n--;
            if (n > 0) {
                numEl.textContent = n;
                playSfxCountBeep();
            } else {
                numEl.textContent = 'ไป!';
                playSfxGo();
                clearInterval(countdownTimer);
                setTimeout(startGame, 500);
            }
        }, 800);
    }

    function startGame() {
        gameState = 'playing';
        score = 0;
        timeLeft = CFG.GAME_DURATION;
        correctHits = 0;
        wrongHits = 0;
        balloons = [];
        particles = [];
        popups = [];

        document.getElementById('ui-countdown').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('question-bar').classList.remove('hidden');
        document.getElementById('hint-bar').classList.remove('hidden');
        newQuestion();
        updateScoreHud();
        updateTimerHud();

        KAMPAI.sound.bgmStart();

        spawnTimer = setInterval(spawnBalloon, CFG.SPAWN_INTERVAL_MS);
        spawnBalloon();
        spawnBalloon();

        mainTimer = setInterval(function () {
            timeLeft--;
            updateTimerHud();
            if (timeLeft <= 5 && timeLeft > 0) playSfxTick();
            if (timeLeft <= 0) endGame();
        }, 1000);
    }

    function endGame() {
        gameState = 'end';
        clearInterval(spawnTimer);
        clearInterval(mainTimer);
        balloons = [];
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('question-bar').classList.add('hidden');
        document.getElementById('hint-bar').classList.add('hidden');

        stopHandTracking();
        KAMPAI.sound.bgmStop();
        KAMPAI.sound.gameOver();

        if (vs && vs.finish(score, { correct: correctHits, wrong: wrongHits })) return;

        var totalHits = correctHits + wrongHits;
        var accuracy = totalHits > 0 ? Math.round((correctHits / totalHits) * 100) : 0;

        var medalEmoji = '🥉', medalLabel = 'ทองแดง (Bronze)';
        if (score >= CFG.MEDAL_GOLD_SCORE) {
            medalEmoji = '🥇';
            medalLabel = 'ทองคำ (Gold)';
        } else if (score >= CFG.MEDAL_SILVER_SCORE) {
            medalEmoji = '🥈';
            medalLabel = 'เงิน (Silver)';
        }

        $('medal-emoji').textContent = medalEmoji;
        $('medal-label').textContent = medalLabel;
        $('final-score').textContent = score + ' คะแนน';
        $('stat-correct').textContent = correctHits;
        $('stat-wrong').textContent = wrongHits;
        $('stat-accuracy').textContent = accuracy + '%';

        var justPushed = { name: playerName, score: score };
        localLeaderboard.push(justPushed);
        localLeaderboard.sort(function (a, b) { return b.score - a.score; });
        var rankIndex = localLeaderboard.indexOf(justPushed) + 1;

        $('rank-value').textContent = '#' + rankIndex;
        $('rank-total').textContent = localLeaderboard.length;
        $('rank-chip').style.display = 'block';

        var lbRows = $('lb-rows');
        lbRows.innerHTML = '';
        var sdkRows = KAMPAI.leaderboard || [];
        var rowsToRender = sdkRows.length > 0 ? sdkRows.slice(0, 5) : localLeaderboard.slice(0, 5);

        $('leaderboard').style.display = 'block';

        rowsToRender.forEach(function (entry, idx) {
            var isMe = sdkRows.length > 0 ? entry.isMe : (entry === justPushed);
            var name = sdkRows.length > 0 ? entry.displayName : entry.name;
            var best = sdkRows.length > 0 ? (entry.personalBest || 0) : entry.score;
            var medals = ['🥇', '🥈', '🥉'];
            var row = document.createElement('div');
            row.className = 'lb-row' + (isMe ? ' me' : '');
            row.innerHTML = '<span><span class="lb-rank">' + (medals[idx] || '#' + (idx + 1)) + '</span>' +
                '<span class="lb-name">' + escapeHtml(name) + (isMe ? ' (คุณ)' : '') + '</span></span>' +
                '<span class="lb-score">' + best + '</span>';
            lbRows.appendChild(row);
        });

        showScreen('ui-end');
        KAMPAI.submitScore(score, { mode: 'normal' });
    }

    function cleanup() {
        if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
        if (mainTimer) { clearInterval(mainTimer); mainTimer = null; }
        if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
        stopHandTracking();
        if (vs) vs.leave();
        KAMPAI.sound.bgmStop();
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    window.addEventListener('load', function () {
        canvas = $('arCanvas');
        ctx = canvas.getContext('2d');
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        $('btn-start').addEventListener('click', handleStartClick);
        $('btn-restart').addEventListener('click', function () {
            seededRng = null;
            showScreen('ui-start');
            gameState = 'start';
        });

        $('btn-vs').addEventListener('click', function () {
            if (vs) vs.openMenu();
        });

        $('btn-quit').addEventListener('click', function () {
            cleanup();
            KAMPAI.goHome();
        });

        $('btn-home').addEventListener('click', function () {
            cleanup();
            KAMPAI.goHome();
        });

        canvas.addEventListener('click', handleCanvasTap);
        canvas.addEventListener('touchstart', function (e) {
            handleCanvasTap(e);
        }, { passive: false });

        window.addEventListener('beforeunload', cleanup);

        gameLoop();
    });
})();
