/* game.js — ลอจิกเกม AR Finger Tracking (ตัวอย่าง: แตะวัตถุลอยด้วยปลายนิ้วชี้)
   ───────────────────────────────────────────────────────────────────────────
   ❗ ใช้ KampaiHands (kampai-hands.js) — ไม่ใช้ KampaiAR สำหรับเกมจิ้ม/ชนวัตถุ
   ❗ ar.leftHand / ar.rightHand = พิกัด normalized 0..1 (ปลายนิ้วชี้ landmark 8)
   ❗ ชนวัตถุในลูปเกมด้วยระยะห่าง (radius) — ดู AR-GAME.md Pitfall §8
   ─────────────────────────────────────────────────────────────────────────── */
(function () {
    'use strict';
    var CFG = window.GAME_CONFIG, DATA = window.GAME_DATA;
    var $ = function (id) { return document.getElementById(id); };

    KAMPAI.setSlug(CFG.SLUG);
    KAMPAI.sound.mountToggles();
    KAMPAI.sound.defaultBgm(CFG.BGM || 'cheerful');

    var canvas, ctx;
    var items = [];
    var score = 0;
    var timeLeft = CFG.GAME_DURATION;
    var correctHits = 0;
    var wrongHits = 0;
    var gameState = 'start';
    var rafId = null;
    var spawnTimer = null;
    var countdownTimer = null;
    var hands = null;
    var seededRng = null;

    function createMulberry32(seed) {
        return function () {
            var t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function rng() { return seededRng ? seededRng() : Math.random(); }

    var vs = window.KampaiVersus ? KampaiVersus.create({
        duration: CFG.ONLINE_DURATION || CFG.GAME_DURATION,
        title: 'AR Hand Game',
        rankBy: 'score',
        onPlay: function (opts) {
            if (opts && opts.rng) {
                seededRng = createMulberry32(Math.floor(opts.rng() * 4294967296));
            }
            stopHands();
            startGame();
        },
        onEnd: function () {
            cleanup();
            KAMPAI.sound.bgmStop();
            KAMPAI.sound.gameOver();
        }
    }) : null;

    function renderPlayer() {
        var s = KAMPAI.student, stt = KAMPAI.stats, chip = $('player-chip');
        if (!s || !chip) return;
        var av = s.photoUrl ? '<img src="' + s.photoUrl + '" alt="">' : '<div class="ini">' + ((s.displayName || '?')[0]) + '</div>';
        var best = stt ? ' · <b style="color:#fbbf24">สถิติ ' + (stt.personalBest || 0) + '</b>' : '';
        chip.innerHTML = av + '<span>' + s.displayName + best + '</span>';
        chip.style.display = 'flex';
    }
    function renderMyStats() {
        var st = KAMPAI.stats; if (!st) return;
        var elBest = $('ms-best'); if (elBest) elBest.innerText = (st.personalBest || 0).toLocaleString();
        var elPlays = $('ms-plays'); if (elPlays) elPlays.innerText = (st.playsCount || 0).toLocaleString();
        var elStats = $('my-stats'); if (elStats) elStats.style.display = 'flex';
    }
    function renderLeaderboard(listId, boxId) {
        var rows = KAMPAI.leaderboard || [], box = $(boxId), list = $(listId);
        if (!rows.length || !box || !list) { if (box) box.style.display = 'none'; return; }
        var medals = ['🥇', '🥈', '🥉'];
        list.innerHTML = rows.slice(0, 5).map(function (r) {
            return '<li class="' + (r.isMe ? 'me' : '') + '"><span class="lb-rank">' + (medals[r.rank - 1] || r.rank) + '</span>' +
                '<span class="lb-name">' + r.displayName + (r.isMe ? ' (คุณ)' : '') + '</span>' +
                '<span class="lb-score">' + (r.personalBest || 0) + '</span></li>';
        }).join('');
        box.style.display = 'block';
    }
    KAMPAI.onReady(function () {
        renderPlayer(); renderMyStats();
        renderLeaderboard('lbList', 'lbBox');
    });

    function showScreen(id) {
        var els = document.querySelectorAll('.screen');
        for (var i = 0; i < els.length; i++) els[i].classList.remove('active');
        $(id).classList.add('active');
    }
    function setStatus() {
        var icon = hands && hands.mode === 'camera' ? '🎥 กล้อง' : '✋ แตะ';
        var tag = $('status-tag');
        if (tag) tag.textContent = icon;
    }

    function stopHands() {
        if (hands) { hands.stop(); hands = null; }
    }

    function buildHands() {
        return KampaiHands.create({
            video: '#arVideo',
            hands: CFG.HANDS,
            getCanvasSize: function () {
                return canvas ? { w: canvas.width, h: canvas.height } : null;
            },
            onStatus: function () { setStatus(); }
        });
    }

    function setupCanvas() {
        canvas = $('arCanvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        if (!ctx) {
            ctx = new Proxy({}, { get: function () { return function () {}; } });
        }
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    function resizeCanvas() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // ═══ GAME LOGIC (ตัวอย่าง: วัตถุลอย — ชนด้วยปลายนิ้วชี้) ═══

    function spawnItem() {
        var r = rng();
        var kind, emoji;
        if (r < DATA.CHANCE_BAD) {
            kind = 'bad'; emoji = DATA.ITEMS_BAD[Math.floor(rng() * DATA.ITEMS_BAD.length)];
        } else if (r < DATA.CHANCE_BAD + DATA.CHANCE_BONUS) {
            kind = 'bonus'; emoji = DATA.ITEMS_BONUS[Math.floor(rng() * DATA.ITEMS_BONUS.length)];
        } else {
            kind = 'good'; emoji = DATA.ITEMS_GOOD[Math.floor(rng() * DATA.ITEMS_GOOD.length)];
        }
        var color = DATA.COLORS[Math.floor(rng() * DATA.COLORS.length)];
        items.push({
            x: 0.1 + rng() * 0.8,
            y: 1.1,
            vy: -(0.004 + rng() * 0.004),
            vx: (rng() - 0.5) * 0.002,
            kind: kind, emoji: emoji, color: color,
            radius: CFG.HIT_RADIUS || 0.06,
            alive: true
        });
    }

    function checkHandCollision(hand, item) {
        if (!hand || !hand.active || !item.alive) return false;
        var dx = hand.x - item.x, dy = hand.y - item.y;
        return Math.sqrt(dx * dx + dy * dy) < item.radius;
    }

    function onHit(item, px, py) {
        item.alive = false;
        if (item.kind === 'bad') {
            wrongHits++;
            score = Math.max(0, score + CFG.POINTS_WRONG);
            KAMPAI.sound.wrong(); KAMPAI.sound.fxFlash(false);
            scorePop(px, py, CFG.POINTS_WRONG, '#ff6b6b');
        } else {
            var pts = item.kind === 'bonus' ? (CFG.POINTS_CORRECT * 3) : CFG.POINTS_CORRECT;
            correctHits++;
            score += pts;
            KAMPAI.sound.correct(); KAMPAI.sound.fxFlash(true);
            scorePop(px, py, '+' + pts, item.kind === 'bonus' ? '#22d3ee' : '#FFD700');
            burstParticles(px, py, item.color);
        }
        updateScoreDisplay();
        if (vs) vs.report(score, { correct: correctHits });
    }

    function updateScoreDisplay() {
        var el = $('scorePill');
        if (el) el.textContent = '⭐ ' + score;
    }

    function scorePop(x, y, text, color) {
        var el = document.createElement('div'); el.className = 'score-pop';
        el.textContent = text; el.style.cssText = 'left:' + x + 'px;top:' + y + 'px;color:' + color + ';font-size:24px;';
        document.body.appendChild(el); el.addEventListener('animationend', function () { el.remove(); });
    }

    function burstParticles(x, y, color) {
        for (var i = 0; i < 8; i++) {
            var p = document.createElement('div'); p.className = 'pop-particle';
            var a = (Math.PI * 2 / 8) * i, d = 25 + Math.random() * 35, sz = 5 + Math.random() * 5;
            p.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + sz + 'px;height:' + sz + 'px;background:' + color + ';--dx:' + ((Math.cos(a) * d) | 0) + 'px;--dy:' + ((Math.sin(a) * d) | 0) + 'px;';
            document.body.appendChild(p); p.addEventListener('animationend', function () { p.remove(); });
        }
    }

    function loop() {
        if (gameState !== 'playing') return;
        if (!canvas || !ctx) { rafId = requestAnimationFrame(loop); return; }
        var cw = canvas.width, ch = canvas.height;
        ctx.clearRect(0, 0, cw, ch);

        var lh = hands ? hands.leftHand : { x: -1, y: -1, active: false };
        var rh = hands ? hands.rightHand : { x: -1, y: -1, active: false };

        if (hands && hands.mode === 'camera') {
            if (hands.leftLandmarks) hands.drawSkeleton(ctx, hands.leftLandmarks, 'rgba(75, 224, 122, 1)', 'L');
            if (hands.rightLandmarks) hands.drawSkeleton(ctx, hands.rightLandmarks, 'rgba(34, 211, 238, 1)', 'R');
        }

        for (var i = items.length - 1; i >= 0; i--) {
            var it = items[i];
            if (!it.alive) { items.splice(i, 1); continue; }

            it.x += it.vx;
            it.y += it.vy;

            if (checkHandCollision(lh, it) || checkHandCollision(rh, it)) {
                onHit(it, it.x * cw, it.y * ch);
                continue;
            }

            if (it.y < -0.1) { items.splice(i, 1); continue; }

            ctx.save();
            ctx.globalAlpha = 0.9;
            ctx.font = '40px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(it.emoji, it.x * cw, it.y * ch);
            ctx.restore();
        }

        rafId = requestAnimationFrame(loop);
    }

    async function startGame() {
        KAMPAI.beginRound();
        showScreen('gameScreen');
        setupCanvas();
        KAMPAI.sound.unlock();

        stopHands();
        hands = buildHands();
        try {
            await hands.start();
        } catch (e) {
            console.warn('Camera failed, tap fallback:', e);
        }
        setStatus();

        KAMPAI.sound.bgmStart();
        gameState = 'playing';
        score = 0; correctHits = 0; wrongHits = 0;
        timeLeft = CFG.GAME_DURATION;
        items = [];
        updateScoreDisplay();
        var el = $('timerPill'); if (el) el.textContent = '⏱ ' + timeLeft;

        if (spawnTimer) clearInterval(spawnTimer);
        spawnTimer = setInterval(spawnItem, CFG.SPAWN_INTERVAL_MS);

        if (countdownTimer) clearInterval(countdownTimer);
        countdownTimer = setInterval(function () {
            timeLeft--;
            var el = $('timerPill'); if (el) el.textContent = '⏱ ' + timeLeft;
            if (timeLeft <= 0) endGame();
        }, 1000);

        rafId = requestAnimationFrame(loop);
    }

    function endGame() {
        if (gameState === 'end') return;
        gameState = 'end';
        cleanup();
        KAMPAI.sound.bgmStop(); KAMPAI.sound.gameOver();

        var stars = score >= 300 ? 3 : score >= 150 ? 2 : score >= 50 ? 1 : 0;
        KAMPAI.submitScore(score, { mode: 'normal', stars: stars, correct: correctHits, wrong: wrongHits });

        showScreen('resultScreen');
        var elStars = $('go-stars'); if (elStars) elStars.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        var elScore = $('final-score'); if (elScore) elScore.textContent = score;
        var elDetail = $('final-detail'); if (elDetail) elDetail.textContent = 'ตอบถูก ' + correctHits + ' · ตอบผิด ' + wrongHits + ' · เวลา ' + CFG.GAME_DURATION + ' วินาที';
        renderLeaderboard('lbListEnd', 'lbBoxEnd');
    }

    function cleanup() {
        if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
        if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        stopHands();
        seededRng = null;
    }

    function handleTouchAt(clientX, clientY) {
        if (gameState !== 'playing' || !canvas || !hands) return;
        var pt = hands.clientToCanvas(canvas, clientX, clientY);
        var px = pt.x / canvas.width;
        var py = pt.y / canvas.height;
        var fakeHand = { x: px, y: py, active: true };
        for (var i = items.length - 1; i >= 0; i--) {
            if (checkHandCollision(fakeHand, items[i])) {
                onHit(items[i], pt.x, pt.y);
                break;
            }
        }
    }
    document.addEventListener('touchstart', function (e) {
        var t = e.touches[0]; if (t) handleTouchAt(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('click', function (e) {
        handleTouchAt(e.clientX, e.clientY);
    });

    $('startBtn').addEventListener('click', startGame);
    $('restartBtn').addEventListener('click', function () { cleanup(); startGame(); });
    document.querySelector('[data-kampai-action="finish-test"]').addEventListener('click', endGame);
    $('quitBtn').addEventListener('click', function () { cleanup(); KAMPAI.goHome(); });
    $('homeBtn').addEventListener('click', function () { cleanup(); KAMPAI.goHome(); });
    window.addEventListener('beforeunload', cleanup);

    if (CFG.ENABLE_ONLINE && vs) {
        var btn = $('onlineBtn');
        if (btn) { btn.style.display = ''; btn.addEventListener('click', function () { vs.openMenu(); }); }
    }
})();
