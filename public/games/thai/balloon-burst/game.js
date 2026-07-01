/* game.js — ลอจิกเกม Balloon Burst (อ่าน config/data + KAMPAI SDK + KampaiAR engine) */
(function () {
    'use strict';
    var CFG = window.GAME_CONFIG, DATA = window.GAME_DATA;
    var $ = function (id) { return document.getElementById(id); };

    // SDK setup
    KAMPAI.setSlug(CFG.SLUG);
    KAMPAI.sound.mountToggles();
    KAMPAI.sound.defaultBgm(CFG.BGM || 'cheerful');

    // State variables
    var canvas, ctx;
    var balloons = [];
    var particles = [];
    var popups = [];
    var leftPointer = { x: -9999, y: -9999, active: false };
    var rightPointer = { x: -9999, y: -9999, active: false };
    var score = 0;
    var timeLeft = CFG.GAME_DURATION;
    var correctHits = 0;
    var wrongHits = 0;
    var spawnTimer = null;
    var countdownTimer = null;
    var mainTimer = null;
    var gameState = 'start'; // start | countdown | playing | end
    var rafId = null;
    var ar = null;
    var playerName = 'ผู้เล่น';
    var localLeaderboard = []; // fallback in-memory ranking
    var seededRng = null;

    // ── KampaiVersus Setup ──
    var vs = window.KampaiVersus ? KampaiVersus.create({
        duration: CFG.GAME_DURATION,
        title: 'Balloon Burst',
        rankBy: 'score',
        onPlay: function (opts) {
            var rng = opts && opts.rng;
            var player = opts && opts.player;
            startVersusRound(rng, player);
        },
        onEnd: function () {
            cleanup();
            KAMPAI.sound.bgmStop();
            KAMPAI.sound.gameOver();
        }
    }) : null;

    function startVersusRound(rng, player) {
        if (rng) {
            var seed = Math.floor(rng() * 4294967296);
            seededRng = createMulberry32(seed);
        }
        if (ar) ar.mode = 'tap'; // versus mode defaults to tap mode
        startGame();
    }

    function createMulberry32(seed) {
        return function () {
            var t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // ── Render Student Info from SDK ──
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

    // ── AR engine ──
    // ⚠️ ไม่ส่ง canvas ให้ engine — kampai-ar จะ clearRect ทุกเฟรม; เกมวาดลูกโป่งบน #arCanvas เอง
    function buildAR() {
        return KampaiAR.create({
            video: '#arVideo',
            displaySize: function () {
                return canvas ? { w: canvas.width, h: canvas.height } : null;
            },
            detector: CFG.DETECTOR,
            holdMs: CFG.HOLD_MS,
            tuning: CFG.TUNING,
            onStatus: function (status) {
                if (status === 'camera-on') {
                    $('loading').classList.remove('on');
                } else if (status === 'no-camera') {
                    $('loading').classList.remove('on');
                }
            }
        });
    }

    // ── Audio Procedural Fallback ──
    var audioCtx = null;
    function ensureAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
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

    // ── Resize Canvas ──
    function resizeCanvas() {
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    }

    // ── Spawning Balloons ──
    function spawnBalloon() {
        if (gameState !== 'playing') return;
        var activeRng = seededRng || Math.random;
        var isCorrect = activeRng() < 0.5;
        var word = isCorrect
            ? DATA.CORRECT_WORDS[Math.floor(activeRng() * DATA.CORRECT_WORDS.length)]
            : DATA.WRONG_WORDS[Math.floor(activeRng() * DATA.WRONG_WORDS.length)];
        var radius = CFG.BALLOON_RADIUS_MIN + activeRng() * (CFG.BALLOON_RADIUS_MAX - CFG.BALLOON_RADIUS_MIN);
        var colorPair = DATA.BALLOON_COLORS[Math.floor(activeRng() * DATA.BALLOON_COLORS.length)];
        balloons.push({
            x: radius + activeRng() * (canvas.width - radius * 2),
            y: canvas.height + radius,
            vy: -(CFG.BALLOON_SPEED_MIN + activeRng() * (CFG.BALLOON_SPEED_MAX - CFG.BALLOON_SPEED_MIN)),
            sway: activeRng() * Math.PI * 2,
            swaySpeed: 0.02 + activeRng() * 0.02,
            radius: radius,
            word: word,
            isCorrect: isCorrect,
            colorLight: colorPair[0],
            colorDark: colorPair[1],
            popped: false
        });
    }

    function spawnBurst(x, y, colorLight, good) {
        var n = 16;
        for (var i = 0; i < n; i++) {
            var angle = (Math.PI * 2 * i) / n + Math.random() * 0.3;
            var speed = 2 + Math.random() * 3.5;
            particles.push({
                x: x,
                y: y,
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

    // ── Collision and Balloon Popping ──
    function popBalloon(b, index, drawX) {
        b.popped = true;
        if (b.isCorrect) {
            score += CFG.POINTS_CORRECT;
            correctHits++;
            spawnBurst(drawX, b.y, b.colorLight, true);
            spawnPopup(drawX, b.y, "+" + CFG.POINTS_CORRECT, true);
            KAMPAI.sound.correct();
            KAMPAI.sound.fxFlash(true);
        } else {
            score += CFG.POINTS_WRONG;
            wrongHits++;
            spawnBurst(drawX, b.y, b.colorLight, false);
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

    // ── Handle Fallback Click / Touch Taps ──
    function clientToCanvas(clientX, clientY) {
        var rect = canvas.getBoundingClientRect();
        var scaleX = canvas.width / (rect.width || canvas.width);
        var scaleY = canvas.height / (rect.height || canvas.height);
        return {
            x: (clientX - rect.left) * scaleX,
            y: (clientY - rect.top) * scaleY
        };
    }

    function collectHitProbes() {
        var probes = [];
        var w = canvas.width, h = canvas.height;
        var fingerTips = [8, 12, 16, 20];

        function addProbe(px, py) {
            probes.push({ x: px, y: py });
        }

        if (leftPointer.active) addProbe(leftPointer.x, leftPointer.y);
        if (rightPointer.active) addProbe(rightPointer.x, rightPointer.y);

        if (ar && ar.detector === 'hands') {
            if (ar.leftHandLandmarks) {
                for (var li = 0; li < fingerTips.length; li++) {
                    var lpt = ar.leftHandLandmarks[fingerTips[li]];
                    if (lpt) addProbe(lpt.x * w, lpt.y * h);
                }
            }
            if (ar.rightHandLandmarks) {
                for (var ri = 0; ri < fingerTips.length; ri++) {
                    var rpt = ar.rightHandLandmarks[fingerTips[ri]];
                    if (rpt) addProbe(rpt.x * w, rpt.y * h);
                }
            }
        }
        return probes;
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

    // ── Main Game Loop ──
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

            // check missed / out of bounds
            if (b.y < -b.radius * 2) {
                balloons.splice(i, 1);
                continue;
            }
            drawBalloon(b, drawX);
        }
    }

    function drawBalloon(b, drawX) {
        ctx.save();
        // String line
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(drawX, b.y + b.radius * 0.95);
        ctx.lineTo(drawX, b.y + b.radius * 1.35);
        ctx.stroke();

        // Balloon body
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

        // Visual Highlight
        ctx.beginPath();
        ctx.ellipse(drawX - b.radius * 0.32, b.y - b.radius * 0.4, b.radius * 0.22, b.radius * 0.32, -0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.fill();

        // Knot
        ctx.beginPath();
        ctx.moveTo(drawX - 6, b.y + b.radius * 0.9);
        ctx.lineTo(drawX + 6, b.y + b.radius * 0.9);
        ctx.lineTo(drawX, b.y + b.radius * 1.05);
        ctx.closePath();
        ctx.fillStyle = b.colorDark;
        ctx.fill();

        // Word text
        var fontSize = Math.max(15, b.radius * 0.42);
        ctx.font = "700 " + fontSize + "px 'Sarabun', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.strokeText(b.word, drawX, b.y);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(b.word, drawX, b.y);
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

    var HAND_CONNECTIONS = [
        [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
        [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]
    ];

    function drawHandSkeleton(landmarks, strokeColor, locked, label) {
        if (!landmarks || !landmarks.length) return;
        var w = canvas.width, h = canvas.height;
        ctx.save();
        ctx.strokeStyle = locked ? strokeColor : strokeColor.replace('1)', '0.75)');
        ctx.lineWidth = locked ? 4 : 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowColor = strokeColor;
        ctx.shadowBlur = locked ? 16 : 10;
        ctx.beginPath();
        for (var c = 0; c < HAND_CONNECTIONS.length; c++) {
            var p1 = landmarks[HAND_CONNECTIONS[c][0]];
            var p2 = landmarks[HAND_CONNECTIONS[c][1]];
            if (!p1 || !p2) continue;
            ctx.moveTo(p1.x * w, p1.y * h);
            ctx.lineTo(p2.x * w, p2.y * h);
        }
        ctx.stroke();
        ctx.shadowBlur = 0;

        var tips = [4, 8, 12, 16, 20];
        for (var t = 0; t < tips.length; t++) {
            var pt = landmarks[tips[t]];
            if (!pt) continue;
            ctx.beginPath();
            ctx.arc(pt.x * w, pt.y * h, tips[t] === 8 ? 10 : 5, 0, Math.PI * 2);
            ctx.fillStyle = tips[t] === 8 ? strokeColor : 'rgba(255,255,255,0.9)';
            ctx.fill();
        }

        var wrist = landmarks[0];
        if (wrist) {
            ctx.font = "bold 13px 'Sarabun', sans-serif";
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.85)';
            ctx.shadowBlur = 4;
            ctx.fillText(label + (locked ? ' 🔒' : ''), wrist.x * w, wrist.y * h - 22);
        }
        ctx.restore();
    }

    function drawHandTracking() {
        if (!ar || ar.detector !== 'hands') {
            drawPointerCursor();
            return;
        }
        if (leftPointer.active && ar.leftHandLandmarks) {
            drawHandSkeleton(ar.leftHandLandmarks, 'rgba(75, 224, 122, 1)', ar.leftHandLocked, 'มือซ้าย');
        }
        if (rightPointer.active && ar.rightHandLandmarks) {
            drawHandSkeleton(ar.rightHandLandmarks, 'rgba(255, 206, 84, 1)', ar.rightHandLocked, 'มือขวา');
        }
    }

    function drawPointerCursor() {
        var t = performance.now() / 300;
        var pulse = 4 * Math.sin(t);
        
        function drawCursor(px, py, color, label) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(px, py, 22 + pulse, 0, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 4;
            ctx.shadowColor = color;
            ctx.shadowBlur = 18;
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(px, py, 6, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.shadowBlur = 10;
            ctx.fill();
            
            ctx.font = "bold 14px 'Sarabun', sans-serif";
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.shadowColor = 'rgba(0,0,0,0.85)';
            ctx.shadowBlur = 4;
            ctx.fillText(label, px, py - 32);
            ctx.restore();
        }

        if (leftPointer.active) {
            drawCursor(leftPointer.x, leftPointer.y, '#4be07a', 'มือซ้าย');
        }
        if (rightPointer.active) {
            drawCursor(rightPointer.x, rightPointer.y, '#ffce54', 'มือขวา');
        }
    }

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update pointer locations from AR engine for both hands
        if (ar && ar.mode === 'camera') {
            var lh = ar.leftHand;
            var rh = ar.rightHand;
            
            if (lh && lh.active) {
                leftPointer.x = lh.x * canvas.width;
                leftPointer.y = lh.y * canvas.height;
                leftPointer.active = true;
            } else {
                leftPointer.active = false;
            }
            
            if (rh && rh.active) {
                rightPointer.x = rh.x * canvas.width;
                rightPointer.y = rh.y * canvas.height;
                rightPointer.active = true;
            } else {
                rightPointer.active = false;
            }
            
            // framediff/pose: ใช้จุดเคลื่อนไหวกลางเมื่อไม่มีมือ
            if (!leftPointer.active && !rightPointer.active && ar.detector !== 'hands') {
                rightPointer.x = ar.x * canvas.width;
                rightPointer.y = ar.y * canvas.height;
                rightPointer.active = true;
            }
        } else {
            leftPointer.active = false;
            rightPointer.active = false;
        }

        if (gameState === 'playing') {
            updateAndDrawBalloons();
        }
        
        updateAndDrawParticles();
        updateAndDrawPopups();
        drawHandTracking();
        
        rafId = requestAnimationFrame(gameLoop);
    }

    // ── Game Flow Controls ──
    function handleStartClick() {
        ensureAudio();
        seededRng = null; // Reset versus RNG for normal solo play
        $('cam-error').textContent = '';
        $('loading').classList.add('on');

        if (!ar) ar = buildAR();
        
        try {
            ar.start().then(function () {
                $('loading').classList.remove('on');
                beginCountdown();
            }).catch(function (err) {
                console.warn("Camera access denied or failed, switching to Touch fallback mode:", err);
                $('cam-error').textContent = 'เปิดกล้องไม่ได้ ระบบสลับไปยังโหมดแตะสัมผัส';
                $('loading').classList.remove('on');
                beginCountdown();
            });
        } catch (err) {
            console.warn("Camera access denied or failed, switching to Touch fallback mode:", err);
            $('cam-error').textContent = 'เปิดกล้องไม่ได้ ระบบสลับไปยังโหมดแตะสัมผัส';
            $('loading').classList.remove('on');
            beginCountdown();
        }
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
        document.getElementById('hint-bar').classList.remove('hidden');
        updateScoreHud();
        updateTimerHud();

        if (ar) ar.setActive(true);
        KAMPAI.sound.bgmStart();

        spawnTimer = setInterval(spawnBalloon, CFG.SPAWN_INTERVAL_MS);
        spawnBalloon();

        mainTimer = setInterval(function () {
            timeLeft--;
            updateTimerHud();
            if (timeLeft <= 5 && timeLeft > 0) playSfxTick();
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    function endGame() {
        gameState = 'end';
        clearInterval(spawnTimer);
        clearInterval(mainTimer);
        balloons = [];
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('hint-bar').classList.add('hidden');

        if (ar) ar.stop();
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

        // --- Local Leaderboard fallback & render ---
        var justPushed = { name: playerName, score: score };
        localLeaderboard.push(justPushed);
        localLeaderboard.sort(function (a, b) { return b.score - a.score; });
        var rankIndex = localLeaderboard.indexOf(justPushed) + 1;

        $('rank-value').textContent = '#' + rankIndex;
        $('rank-total').textContent = localLeaderboard.length;
        $('rank-chip').style.display = 'block';

        // Render SDK leaderboard or local
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
        if (ar) ar.stop();
        if (vs) vs.leave();
        KAMPAI.sound.bgmStop();
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ── Setup listeners ──
    window.addEventListener('load', function () {
        canvas = $('arCanvas');
        ctx = canvas.getContext('2d');
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        $('btn-start').addEventListener('click', handleStartClick);
        $('btn-restart').addEventListener('click', function () {
            seededRng = null; // Reset versus RNG
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

        // Touch fallback listeners
        canvas.addEventListener('click', handleCanvasTap);
        canvas.addEventListener('touchstart', function (e) {
            handleCanvasTap(e);
        }, { passive: false });

        window.addEventListener('beforeunload', cleanup);

        gameLoop();
    });
})();
