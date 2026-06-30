/* game.js — AR Catcher "Catch Numbers" ลอจิกหลัก
   ตะกร้าเลื่อนตาม ar.x (จากกล้อง) หรือลาก/แตะ (fallback)
   ตัวเลขตกจากด้านบน — รับถูกตามกติการอบ = +คะแนน, รับผิด/ตก = -ชีวิต
   ❗ Camera/AR อยู่ใน kampai-ar.js ทั้งหมด อย่าแก้ที่นี่ */
(function () {
    'use strict';
    var CFG = window.GAME_CONFIG;
    var DATA = window.GAME_DATA;
    var $ = function (id) { return document.getElementById(id); };

    KAMPAI.setSlug(CFG.SLUG);
    KAMPAI.sound.mountToggles();
    KAMPAI.sound.defaultBgm(CFG.BGM || 'cheerful');

    var qrand = Math.random;

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
        qrand = rng || Math.random;
        if (ar) ar.mode = 'tap';
        startGame();
    }

    // ── State ──
    var ST = {
        score: 0, round: 0, lives: CFG.LIVES, sec: 0, correctCount: 0,
        started: false, roundActive: false,
        basketX: 0.5,         // 0..1 ตำแหน่งตะกร้า
        items: [],            // ตัวเลขที่กำลังตก
        spawnTimer: null, roundTimer: null, nextRoundTimeout: null,
        rafId: 0,
        dragStart: null,
        rule: null            // DATA.rounds[roundIndex]
    };
    var ar = null;

    // ── Canvas ──
    var cvs = $('gameCanvas');
    var ctx = cvs.getContext('2d');
    var W, H;
    function resize() {
        W = cvs.width  = cvs.offsetWidth;
        H = cvs.height = cvs.offsetHeight;
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

    // ── AR engine ──
    function buildAR() {
        return KampaiAR.create({
            video: '#arVideo', canvas: '#arOverlay',
            detector: CFG.DETECTOR,
            zones: [],        // ไม่ใช้ zone — ใช้ onSignals แทน
            holdMs: 99999,    // ปิด hold/commit
            tuning: CFG.TUNING,
            onSignals: function (sig) {
                // sig.x = 0 (ซ้าย) .. 1 (ขวา) — mirror จากกล้องด้านหน้า
                // กล้องหน้า = mirror → ซ้ายจอ = x ต่ำ (ถูกแล้ว)
                if (ST.roundActive) ST.basketX = sig.x;
            },
            onStatus: function () {}
        });
    }

    // ── Round setup ──
    function startGame() {
        KAMPAI.sound.unlock();
        showScreen('gameScreen');
        $('loading').textContent = 'กำลังเปิดกล้อง…';
        $('loading').classList.add('on');
        if (!ar) ar = buildAR();

        // Enforce tap mode if in versus/online match
        if (vs && vs.mode !== null) {
            ar.mode = 'tap';
        }

        ar.start().then(function (ok) {
            $('loading').classList.remove('on');
            KAMPAI.sound.bgmStart();
            ST.score = 0; ST.round = 0; ST.correctCount = 0;
            startRound();
        });
    }

    function startRound() {
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
        setTimeout(function () { card.classList.remove('show'); }, 2200);

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
        ST.items.push({
            n: n,
            x: 0.08 + qrand() * 0.84, // สุ่ม x ไม่ชนขอบ
            y: -0.05,
            speed: speed,
            correct: ST.rule.check(n),
            caught: false,
            missed: false,
            flash: 0           // frames ของ flash effect
        });
    }

    function updateHUD() {
        $('hud-score').textContent = '⭐ ' + ST.score;
        $('hud-lives').textContent = '❤️'.repeat(ST.lives) + '🖤'.repeat(Math.max(0, CFG.LIVES - ST.lives));
        $('hud-time').textContent = '⏱ ' + ST.sec + 's';
        $('hud-round').textContent = 'รอบ ' + (ST.round + 1) + '/' + DATA.rounds.length;
    }

    // ── Game loop (canvas) ──
    function loop() {
        ST.rafId = requestAnimationFrame(loop);
        if (!ST.roundActive) return;
        ctx.clearRect(0, 0, W, H);

        // fall items
        var bx = ST.basketX * W;
        var by = H * 0.88;
        var bw = CFG.BASKET_W * W;
        var cr = CFG.CATCH_RADIUS * W;

        ST.items.forEach(function (it) {
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
                    KAMPAI.sound.wrong();
                    KAMPAI.sound.fxFlash(false);
                    if (ST.lives <= 0) { endRound(false); return; }
                }
                updateHUD();
                if (vs) vs.report(ST.score, { correct: ST.correctCount });
                return;
            }

            // missed (fell off bottom)
            if (iy > 1.05) {
                it.missed = true;
                if (it.correct) {
                    // ปล่อยตัวเลขที่ควรรับตก = เสียชีวิต
                    ST.lives = Math.max(0, ST.lives - 1);
                    KAMPAI.sound.wrong();
                    if (ST.lives <= 0) { endRound(false); return; }
                    updateHUD();
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
        clearInterval(ST.spawnTimer); ST.spawnTimer = null;
        clearInterval(ST.roundTimer); ST.roundTimer = null;

        // bonus time
        if (timeUp && ST.lives > 0) {
            ST.score += ST.sec * CFG.SCORE_BONUS_TIME;
        }
        updateHUD();
        if (vs) vs.report(ST.score, { correct: ST.correctCount });

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
        if (ar) ar.stop();
        KAMPAI.sound.bgmStop();
        KAMPAI.sound.gameOver();

        // Versus handle finish
        if (vs && vs.finish(ST.score, { correct: ST.correctCount })) return;

        showScreen('resultScreen');
        $('final-score').textContent = ST.score;
        $('final-detail').textContent = 'ผ่านครบ ' + DATA.rounds.length + ' รอบ';
        KAMPAI.submitScore(ST.score, {
            mode: 'ar',
            rounds: DATA.rounds.length
        });
    }

    // ── Cleanup ──
    function cleanup() {
        cancelAnimationFrame(ST.rafId); ST.rafId = 0;
        clearInterval(ST.spawnTimer); clearInterval(ST.roundTimer);
        clearTimeout(ST.nextRoundTimeout);
        if (ar) ar.stop();
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
        if (ST.roundActive && ar && ar.mode === 'tap') ST.basketX = pointerX(e);
    });
    gameEl.addEventListener('touchmove', function (e) {
        e.preventDefault();
        if (ST.roundActive && ar && ar.mode === 'tap') ST.basketX = pointerX(e);
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
