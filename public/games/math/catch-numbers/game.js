/* game.js — AR Catcher "Catch Numbers" ลอจิกหลัก
   ตะกร้าเลื่อนตามตำแหน่งมือ (KampaiHands) หรือลาก/แตะ (fallback)
   ตัวเลขตกจากด้านบน — รับถูกตามกติการอบ = +คะแนน, รับผิด/ตก = -ชีวิต
   ❗ Camera/Hands อยู่ใน kampai-hands.js ทั้งหมด อย่าแก้ที่นี่ */
(function () {
    'use strict';
    var CFG = window.GAME_CONFIG;
    var DATA = window.GAME_DATA;
    var $ = function (id) { return document.getElementById(id); };

    KAMPAI.setSlug(CFG.SLUG);
    KAMPAI.sound.mountToggles();
    KAMPAI.sound.defaultBgm(CFG.BGM || 'cheerful');

    var qrand = Math.random;
    var roundSeeds = [];

    function createMulberry32(seed) {
        return function() {
            var t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // ── KampaiVersus (online + local 2p mode) ──
    var vs = window.KampaiVersus ? KampaiVersus.create({
        duration: CFG.ROUNDS * CFG.ROUND_SEC,
        title: 'Catch Numbers',
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
        var matchRng = rng || Math.random;
        roundSeeds = [];
        for (var i = 0; i < 20; i++) {
            roundSeeds.push(Math.floor(matchRng() * 4294967296));
        }
        startGame(true);
    }

    // ── State ──
    var ST = {
        score: 0, round: 0, lives: CFG.LIVES, sec: 0, correctCount: 0,
        wrongCount: 0, timeUpCount: 0,
        started: false, roundActive: false,
        basketX: 0.5,         // 0..1 ตำแหน่งตะกร้า
        items: [],            // ตัวเลขที่กำลังตก
        spawnTimer: null, roundTimer: null, nextRoundTimeout: null,
        ruleCardTimeout: null,
        rafId: 0,
        dragStart: null,
        rule: null            // DATA.rounds[roundIndex]
    };
    window.__ST = ST;
    var hands = null;

    // ── Canvas ──
    var cvs = $('gameCanvas');
    var ctx = cvs ? cvs.getContext('2d') : null;
    if (!ctx) {
        ctx = new Proxy({}, { get: function () { return function () {}; }, set: function () { return true; } });
    }
    var W, H;
    function resize() {
        if (!cvs) return;
        W = cvs.width  = cvs.offsetWidth || 800;
        H = cvs.height = cvs.offsetHeight || 600;
    }
    window.addEventListener('resize', resize);
    resize();

    // ── Player chip + leaderboard ──
    KAMPAI.onReady(function () {
        var s = KAMPAI.student, stt = KAMPAI.stats, chip = $('player-chip');
        if (s && chip) {
            var av = s.photoUrl
                ? '<img src="' + s.photoUrl + '" alt="">'
                : '<div class="ini">' + (s.displayName || '?')[0] + '</div>';
            var best = stt ? ' · <b style="color:#fbbf24">สถิติ ' + (stt.personalBest || 0) + '</b>' : '';
            chip.innerHTML = av + '<span>' + s.displayName + best + '</span>';
            chip.style.display = 'flex';
        }
        var rows = KAMPAI.leaderboard || [], box = $('lbBox'), list = $('lbList');
        if (rows.length && box && list) {
            var medals = ['🥇', '🥈', '🥉'];
            list.innerHTML = rows.slice(0, 5).map(function (r) {
                return '<li class="' + (r.isMe ? 'me' : '') + '">' +
                    '<span class="lb-rank">' + (medals[r.rank - 1] || '#' + r.rank) + '</span>' +
                    '<span class="lb-name">' + r.displayName + (r.isMe ? ' (คุณ)' : '') + '</span>' +
                    '<span class="lb-score">' + (r.personalBest || 0) + '</span></li>';
            }).join('');
            box.style.display = 'block';
        }
    });

    // ── Screen helper ──
    function showScreen(id) {
        document.querySelectorAll('.screen').forEach(function (el) { el.classList.remove('active'); });
        $(id).classList.add('active');
    }

    function stopHands() {
        if (hands) {
            hands.stop();
            hands = null;
        }
    }

    function buildHands() {
        return KampaiHands.create({
            video: '#arVideo',
            hands: CFG.HANDS,
            getCanvasSize: function () {
                return cvs ? { w: cvs.width, h: cvs.height } : null;
            }
        });
    }

    function handNormX(side) {
        if (!hands) return null;
        var ptr = side === 'left' ? hands.leftPointer : hands.rightPointer;
        var hand = side === 'left' ? hands.leftHand : hands.rightHand;
        if (!hand || !hand.active) return null;
        if (ptr && ptr.x >= 0 && W > 0) return ptr.x / W;
        if (hand.x >= 0) return hand.x;
        return null;
    }

    function updateBasketFromHands() {
        if (!hands || hands.mode !== 'camera' || !ST.roundActive || W <= 0) return;
        var xs = [];
        var lx = handNormX('left');
        var rx = handNormX('right');
        if (lx != null) xs.push(lx);
        if (rx != null) xs.push(rx);
        if (!xs.length) return;
        var x = xs.reduce(function (a, b) { return a + b; }, 0) / xs.length;
        var edge = CFG.BASKET_EDGE != null ? CFG.BASKET_EDGE : 0.05;
        ST.basketX = Math.max(edge, Math.min(1 - edge, x));
    }

    function beginSession() {
        $('loading').classList.remove('on');
        KAMPAI.sound.bgmStart();
        ST.score = 0; ST.round = 0; ST.correctCount = 0; ST.wrongCount = 0; ST.timeUpCount = 0;
        startRound();
    }

    // ── Round setup ──
    function startGame(tapOnly) {
        KAMPAI.sound.unlock();
        showScreen('gameScreen');
        $('loading').textContent = tapOnly ? 'กำลังเริ่มเกม…' : 'กำลังเปิดกล้อง…';
        $('loading').classList.add('on');
        stopHands();
        hands = buildHands();

        if (tapOnly || (vs && vs.mode !== null)) {
            hands.mode = 'tap';
            beginSession();
            return;
        }

        hands.start().catch(function () {}).then(function () {
            beginSession();
        });
    }

    function startRound() {
        // Defensive check: clear any existing timers before starting a new round
        clearInterval(ST.spawnTimer); ST.spawnTimer = null;
        clearInterval(ST.roundTimer); ST.roundTimer = null;
        clearTimeout(ST.ruleCardTimeout);

        if (vs && vs.mode !== null && roundSeeds && roundSeeds.length > ST.round) {
            qrand = createMulberry32(roundSeeds[ST.round]);
        } else {
            qrand = Math.random;
        }

        var roundCFG = DATA.rounds[ST.round];
        ST.rule = roundCFG;
        ST.lives = CFG.LIVES;
        ST.items = [];
        ST.roundActive = true;
        ST.basketX = 0.5;

        // HUD
        $('hud-rule').textContent = roundCFG.emoji + ' ' + roundCFG.label;
        $('hud-hint').textContent = roundCFG.hint;
        updateHUD();

        // Rule card flash
        var card = $('rule-card');
        card.querySelector('.rc-emoji').textContent = roundCFG.emoji;
        card.querySelector('.rc-label').textContent = roundCFG.label;
        card.querySelector('.rc-hint').textContent = roundCFG.hint;
        card.classList.add('show');
        ST.ruleCardTimeout = setTimeout(function () { card.classList.remove('show'); }, 2200);

        // Timers
        var spawnMs = Math.max(600, CFG.SPAWN_MS - ST.round * CFG.SPAWN_MS_DECAY);
        ST.spawnTimer = setInterval(spawnItem, spawnMs);
        ST.sec = CFG.ROUND_SEC;
        ST.roundTimer = setInterval(tickRoundTimer, 1000);

        if (!ST.rafId) loop();
    }

    function tickRoundTimer() {
        ST.sec--;
        updateHUD();
        if (ST.sec <= 0) endRound(true);
    }

    function spawnItem() {
        if (!ST.roundActive) return;
        var pool = DATA.numbers;
        var n = pool[Math.floor(qrand() * pool.length)];
        var speed = CFG.FALL_SPEED + ST.round * CFG.FALL_SPEED_INC;
        var it = {
            n: n,
            x: 0.08 + qrand() * 0.84, // สุ่ม x ไม่ชนขอบ
            y: -0.05,
            speed: speed,
            correct: ST.rule.check(n),
            caught: false,
            missed: false,
            flash: 0           // frames ของ flash effect
        };
        ST.items.push(it);
    }

    function updateHUD() {
        $('hud-score').textContent = '⭐ ' + ST.score;
        $('hud-lives').textContent = '❤️'.repeat(ST.lives) + '🖤'.repeat(Math.max(0, CFG.LIVES - ST.lives));
        $('hud-time').textContent = '⏱ ' + ST.sec + 's';
        $('hud-round').textContent = 'รอบ ' + (ST.round + 1) + '/' + DATA.rounds.length;
    }

    // ── Game loop (canvas) ──
    function loop() {
        if (!ST.roundActive) { ST.rafId = 0; return; }
        ST.rafId = requestAnimationFrame(loop);
        ctx.clearRect(0, 0, W, H);
        updateBasketFromHands();

        // fall items
        var bx = ST.basketX * W;
        var by = H * 0.88;
        var bw = CFG.BASKET_W * W;
        var cr = CFG.CATCH_RADIUS * W;

        ST.items.forEach(function (it) {
            if (!ST.roundActive) return;
            if (it.caught || it.missed) return;
            it.y += it.speed;

            var ix = it.x * W;
            var iy = it.y * H;

            // catch check
            if (iy >= by - 30 && Math.abs(ix - bx) < cr) {
                it.caught = true;
                if (it.correct) {
                    ST.score += CFG.SCORE_CATCH;
                    ST.correctCount++;
                    KAMPAI.sound.correct();
                    KAMPAI.sound.fxFlash(true);
                    it.flash = 12;
                } else {
                    ST.lives = Math.max(0, ST.lives - 1);
                    ST.wrongCount++;
                    KAMPAI.sound.wrong();
                    KAMPAI.sound.fxFlash(false);
                    if (ST.lives <= 0) { endRound(false); return; }
                }
                updateHUD();
                if (vs) vs.report(ST.score, { correct: ST.correctCount, wrong: ST.wrongCount, timeUp: ST.timeUpCount });
                return;
            }

            // missed (fell off bottom)
            if (it.y > 1.05) {
                it.missed = true;
                if (it.correct) {
                    // ปล่อยตัวเลขที่ควรรับตก = เสียชีวิต
                    ST.lives = Math.max(0, ST.lives - 1);
                    ST.wrongCount++;
                    KAMPAI.sound.wrong();
                    if (ST.lives <= 0) { endRound(false); return; }
                    updateHUD();
                    if (vs) vs.report(ST.score, { correct: ST.correctCount, wrong: ST.wrongCount, timeUp: ST.timeUpCount });
                }
                return;
            }

            // draw number bubble
            var r = 30;
            ctx.save();
            var correct = it.correct;
            ctx.shadowBlur = 14;
            ctx.shadowColor = correct ? '#34d399' : '#f87171';
            ctx.fillStyle = correct ? 'rgba(52,211,153,0.18)' : 'rgba(248,113,113,0.14)';
            ctx.strokeStyle = correct ? '#34d399' : '#f87171';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(ix, iy, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.restore();

            ctx.save();
            ctx.fillStyle = '#fff';
            ctx.font = 'bold ' + (r * 0.95) + 'px Sarabun, Arial, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(it.n, ix, iy);
            ctx.restore();
        });

        // clean up caught/missed
        ST.items = ST.items.filter(function (it) { return !it.caught && !it.missed; });

        // draw basket
        drawBasket(bx, by, bw);
    }

    function drawBasket(bx, by, bw) {
        ctx.save();
        // shadow
        ctx.shadowBlur = 18;
        ctx.shadowColor = 'rgba(99,102,241,0.5)';
        // basket body
        ctx.fillStyle = 'rgba(99,102,241,0.25)';
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bx - bw / 2, by - 16);
        ctx.lineTo(bx - bw / 2 + 8, by + 22);
        ctx.lineTo(bx + bw / 2 - 8, by + 22);
        ctx.lineTo(bx + bw / 2, by - 16);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        // rim
        ctx.beginPath();
        ctx.moveTo(bx - bw / 2, by - 16);
        ctx.lineTo(bx + bw / 2, by - 16);
        ctx.strokeStyle = '#c7d2fe';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.restore();
    }

    // ── End Round ──
    function endRound(timeUp) {
        if (!ST.roundActive) return;
        ST.roundActive = false;
        if (timeUp) ST.timeUpCount++;
        clearInterval(ST.spawnTimer); ST.spawnTimer = null;
        clearInterval(ST.roundTimer); ST.roundTimer = null;

        // bonus time
        if (timeUp && ST.lives > 0) {
            ST.score += ST.sec * CFG.SCORE_BONUS_TIME;
        }
        updateHUD();
        if (vs) vs.report(ST.score, { correct: ST.correctCount, wrong: ST.wrongCount, timeUp: ST.timeUpCount });

        ST.round++;
        if (ST.round < DATA.rounds.length) {
            // next round after brief pause
            ST.nextRoundTimeout = setTimeout(startRound, 1800);
        } else {
            finishGame();
        }
    }

    // ── Finish game ──
    function finishGame() {
        cancelAnimationFrame(ST.rafId); ST.rafId = 0;
        stopHands();
        KAMPAI.sound.bgmStop();
        KAMPAI.sound.gameOver();

        // Versus handle finish
        if (vs && vs.finish(ST.score, { correct: ST.correctCount, wrong: ST.wrongCount, timeUp: ST.timeUpCount })) return;

        showScreen('resultScreen');
        $('final-score').textContent = ST.score;
        $('final-detail').textContent = 'ผ่านครบ ' + DATA.rounds.length + ' รอบ';
        $('stat-correct').textContent = ST.correctCount;
        $('stat-wrong').textContent = ST.wrongCount;
        $('stat-timeup').textContent = ST.timeUpCount;
        KAMPAI.submitScore(ST.score, {
            mode: 'hands',
            rounds: DATA.rounds.length,
            correct: ST.correctCount,
            wrong: ST.wrongCount,
            timeUp: ST.timeUpCount
        });
    }

    // ── Cleanup ──
    function cleanup() {
        cancelAnimationFrame(ST.rafId); ST.rafId = 0;
        clearInterval(ST.spawnTimer); clearInterval(ST.roundTimer);
        clearTimeout(ST.nextRoundTimeout);
        clearTimeout(ST.ruleCardTimeout);
        stopHands();
        if (vs) vs.leave();
        KAMPAI.sound.bgmStop();
        ST.roundActive = false; ST.started = false;
    }

    // ── Fallback: drag / touch basket ──
    var gameEl = $('gameScreen');

    function pointerX(e) {
        var rect = cvs.getBoundingClientRect();
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    }

    gameEl.addEventListener('mousemove', function (e) {
        if (ST.roundActive && hands && hands.mode === 'tap') ST.basketX = pointerX(e);
    });
    gameEl.addEventListener('touchstart', function (e) {
        if (ST.roundActive && hands && hands.mode === 'tap') ST.basketX = pointerX(e);
    }, { passive: true });
    gameEl.addEventListener('touchmove', function (e) {
        e.preventDefault();
        if (ST.roundActive && hands && hands.mode === 'tap') ST.basketX = pointerX(e);
    }, { passive: false });

    // ── Buttons ──
    $('startBtn').addEventListener('click', function () {
        qrand = Math.random;
        startGame();
    });
    var onlineBtn = $('onlineBtn');
    if (onlineBtn) onlineBtn.addEventListener('click', function () { if (vs) vs.openMenu(); });
    $('restartBtn').addEventListener('click', function () {
        cleanup();
        setTimeout(startGame, 100);
    });
    $('quitBtn').addEventListener('click', function () { cleanup(); KAMPAI.goHome(); });
    $('homeBtn').addEventListener('click', function () { cleanup(); KAMPAI.goHome(); });
    window.addEventListener('beforeunload', cleanup);
    window.addEventListener('resize', resize);

})();
