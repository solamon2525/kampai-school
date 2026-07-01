/* game.js — ลอจิกเกม AR Hand Tracking (ตัวอย่าง: แตะวัตถุลอยด้วยมือ 2 ข้าง)
   ───────────────────────────────────────────────────────────────────────────
   ❗ ไม่มี camera code ที่นี่ — กล้อง/ตรวจจับ/smoothing อยู่ใน kampai-ar.js ทั้งหมด
   ❗ ใช้ ar.leftHand / ar.rightHand (smoothed) สำหรับการชนวัตถุ
   ❗ ใช้ ar.rawLeftHand / ar.rawRightHand สำหรับดีบัก/แสดงผลดิบ (ถ้าต้องการ)
   ───────────────────────────────────────────────────────────────────────────
   ลบส่วน "GAME LOGIC" แล้วเขียนเกมของคุณ — โครงรอบ ๆ (SDK/leaderboard/AR/cleanup)
   คือ "วัฒนธรรมมาตรฐาน" คงไว้ทุกเกม */
(function () {
    'use strict';
    var CFG = window.GAME_CONFIG, DATA = window.GAME_DATA;
    var $ = function (id) { return document.getElementById(id); };

    // ═══ SDK setup ═══
    KAMPAI.setSlug(CFG.SLUG);
    KAMPAI.sound.mountToggles();
    KAMPAI.sound.defaultBgm(CFG.BGM || 'cheerful');

    // ═══ Game State ═══
    var canvas, ctx;
    var items = [];           // วัตถุลอยบนจอ [{x,y,vx,vy,kind,emoji,radius,color}]
    var score = 0;
    var timeLeft = CFG.GAME_DURATION;
    var correctHits = 0;
    var wrongHits = 0;
    var gameState = 'start';  // start | playing | end
    var rafId = null;
    var spawnTimer = null;
    var countdownTimer = null;
    var ar = null;
    var seededRng = null;     // สำหรับ Versus mode (Seeded RNG)

    // ═══ Seeded RNG (Mulberry32) สำหรับโหมด Versus ═══
    function createMulberry32(seed) {
        return function () {
            var t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function rng() { return seededRng ? seededRng() : Math.random(); }

    // ═══ KampaiVersus (ออนไลน์ 2 ผู้เล่นซิงค์สด) ═══
    var vs = window.KampaiVersus ? KampaiVersus.create({
        duration: CFG.ONLINE_DURATION || CFG.GAME_DURATION,
        title: 'AR Hand Game',
        rankBy: 'score',
        onPlay: function (opts) {
            if (opts && opts.rng) {
                var seed = Math.floor(opts.rng() * 4294967296);
                seededRng = createMulberry32(seed);
            }
            startGame();
        },
        onEnd: function () {
            cleanup();
            KAMPAI.sound.bgmStop();
            KAMPAI.sound.gameOver();
        }
    }) : null;

    // ═══ Player + Leaderboard (จาก KAMPAI SDK) ═══
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

    // ═══ Screen management ═══
    function showScreen(id) {
        var els = document.querySelectorAll('.screen');
        for (var i = 0; i < els.length; i++) els[i].classList.remove('active');
        $(id).classList.add('active');
    }
    function setStatus() {
        var icon = ar && ar.mode === 'camera' ? '🎥 กล้อง' : '✋ แตะ';
        var tag = $('status-tag');
        if (tag) tag.textContent = icon;
    }

    // ═══ AR Engine (kampai-ar.js) ═══
    function buildAR() {
        return KampaiAR.create({
            video: '#arVideo', canvas: '#arCanvas',
            detector: CFG.DETECTOR,
            holdMs: CFG.HOLD_MS,
            tuning: CFG.TUNING,
            onStatus: function () { setStatus(); }
            // ❗ ไม่ใช้ onZone/onHoldProgress/onCommit — เกม hand tracking ใช้ ar.leftHand/rightHand
            //    ตรวจจับการชนวัตถุเองในลูปเกม (game loop)
        });
    }

    // ═══ Canvas setup ═══
    function setupCanvas() {
        canvas = $('arCanvas');
        if (!canvas) return;
        // ⚠️ JSDOM Canvas Guard: ป้องกันแครชบน headless/JSDOM ที่ไม่มี GPU
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

    // ═══════════════════════════════════════════════════════════════════════════
    //   GAME LOGIC (เขียนเกมของคุณตรงนี้ — ตัวอย่าง: วัตถุลอยขึ้น แตะด้วยมือ)
    // ═══════════════════════════════════════════════════════════════════════════

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
            x: 0.1 + rng() * 0.8,      // สัดส่วน 0..1 (⚠️ Proportional — ห้ามใช้พิกเซลตรงๆ)
            y: 1.1,                       // เริ่มจากนอกจอด้านล่าง
            vy: -(0.004 + rng() * 0.004), // ลอยขึ้น (สัดส่วน/เฟรม)
            vx: (rng() - 0.5) * 0.002,   // เบี่ยงซ้ายขวาเล็กน้อย
            kind: kind, emoji: emoji, color: color,
            radius: CFG.HIT_RADIUS || 0.06,
            alive: true
        });
    }

    // ⚠️ ตรวจจับการชนมือกับวัตถุ — เปรียบเทียบเป็น **สัดส่วน** (0..1) เสมอ
    //    ห้ามเปรียบเทียบพิกเซลจริงกับค่าทศนิยมตรงๆ (ดู AR-GAME.md Pitfall §8)
    function checkHandCollision(hand, item) {
        if (!hand || !hand.active || !item.alive) return false;
        var dx = hand.x - item.x;
        var dy = hand.y - item.y;
        var dist = Math.sqrt(dx * dx + dy * dy);
        return dist < item.radius;
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
        // รายงาน Versus (ถ้าแข่งออนไลน์)
        if (vs) vs.report(score, { correct: correctHits });
    }

    function updateScoreDisplay() {
        var el = $('scorePill');
        if (el) el.textContent = '⭐ ' + score;
    }

    // [JUICE] คะแนนเด้งลอยขึ้น
    function scorePop(x, y, text, color) {
        var el = document.createElement('div'); el.className = 'score-pop';
        el.textContent = text; el.style.cssText = 'left:' + x + 'px;top:' + y + 'px;color:' + color + ';font-size:24px;';
        document.body.appendChild(el); el.addEventListener('animationend', function () { el.remove(); });
    }

    // [JUICE] particle ตอนแตะ
    function burstParticles(x, y, color) {
        for (var i = 0; i < 8; i++) {
            var p = document.createElement('div'); p.className = 'pop-particle';
            var a = (Math.PI * 2 / 8) * i, d = 25 + Math.random() * 35, sz = 5 + Math.random() * 5;
            p.style.cssText = 'left:' + x + 'px;top:' + y + 'px;width:' + sz + 'px;height:' + sz + 'px;background:' + color + ';--dx:' + ((Math.cos(a) * d) | 0) + 'px;--dy:' + ((Math.sin(a) * d) | 0) + 'px;';
            document.body.appendChild(p); p.addEventListener('animationend', function () { p.remove(); });
        }
    }

    // ── Game Loop ──
    function loop() {
        if (gameState !== 'playing') return;
        if (!canvas || !ctx) { rafId = requestAnimationFrame(loop); return; }
        var cw = canvas.width, ch = canvas.height;
        ctx.clearRect(0, 0, cw, ch);

        // ดึงพิกัดมือจาก AR engine (smoothed — ผ่าน One Euro Filter/EMA แล้ว)
        var lh = ar ? ar.leftHand : { x: -1, y: -1, active: false };
        var rh = ar ? ar.rightHand : { x: -1, y: -1, active: false };

        // วาดมือ (pointer) — วงกลมเรืองแสงตามพิกัดมือ
        if (lh.active) drawHandPointer(ctx, lh.x * cw, lh.y * ch, '#4be07a', 'L');
        if (rh.active) drawHandPointer(ctx, rh.x * cw, rh.y * ch, '#22d3ee', 'R');

        // อัพเดทวัตถุ + ตรวจชน
        for (var i = items.length - 1; i >= 0; i--) {
            var it = items[i];
            if (!it.alive) { items.splice(i, 1); continue; }

            it.x += it.vx;
            it.y += it.vy;

            // ตรวจจับการชนมือ (ทั้ง 2 มือ)
            if (checkHandCollision(lh, it) || checkHandCollision(rh, it)) {
                onHit(it, it.x * cw, it.y * ch);
                continue;
            }

            // วัตถุลอยออกนอกจอด้านบน → ลบทิ้ง
            // ⚠️ เปรียบเทียบสัดส่วน (it.y < -0.1) ไม่ใช่พิกเซล! (Pitfall §8)
            if (it.y < -0.1) { items.splice(i, 1); continue; }

            // วาดวัตถุ
            var px = it.x * cw, py = it.y * ch;
            ctx.save();
            ctx.globalAlpha = 0.9;
            ctx.font = '40px serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(it.emoji, px, py);
            ctx.restore();
        }

        rafId = requestAnimationFrame(loop);
    }

    function drawHandPointer(ctx, x, y, color, label) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.35;
        ctx.fill();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.font = 'bold 12px Kanit';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, x, y);
        ctx.restore();
    }

    // ═══ เริ่มเกม / จบเกม ═══
    async function startGame() {
        showScreen('gameScreen');
        setupCanvas();
        KAMPAI.sound.unlock();

        if (!ar) ar = buildAR();
        await ar.start();    // ขอกล้องตอน gesture (ถ้าไม่ได้ → โหมดแตะอัตโนมัติ)
        ar.setActive(true);
        setStatus();

        KAMPAI.sound.bgmStart();
        gameState = 'playing';
        score = 0; correctHits = 0; wrongHits = 0;
        timeLeft = CFG.GAME_DURATION;
        items = [];
        updateScoreDisplay();
        var el = $('timerPill'); if (el) el.textContent = '⏱ ' + timeLeft;

        // เริ่มสปอนวัตถุ
        if (spawnTimer) clearInterval(spawnTimer);
        spawnTimer = setInterval(spawnItem, CFG.SPAWN_INTERVAL_MS);

        // นับถอยหลัง
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

        // คะแนน + ดาว
        var stars = score >= 300 ? 3 : score >= 150 ? 2 : score >= 50 ? 1 : 0;
        KAMPAI.submitScore(score, { mode: 'normal', stars: stars, correct: correctHits, wrong: wrongHits });

        showScreen('resultScreen');
        var elStars = $('go-stars'); if (elStars) elStars.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        var elScore = $('final-score'); if (elScore) elScore.textContent = score;
        var elDetail = $('final-detail'); if (elDetail) elDetail.textContent = 'ตอบถูก ' + correctHits + ' · ตอบผิด ' + wrongHits + ' · เวลา ' + CFG.GAME_DURATION + ' วินาที';
        renderLeaderboard('lbListEnd', 'lbBoxEnd');
    }

    // ═══ Cleanup (⚠️ ต้องล้างทุก exit — interval/timeout/rAF/AR) ═══
    function cleanup() {
        if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
        if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        if (ar) { ar.stop(); }
        seededRng = null;    // Reset กลับ Math.random สำหรับ solo play ถัดไป
    }

    // ═══ Touch/Click Fallback (📱 สำหรับเครื่องที่ไม่มีกล้อง) ═══
    // ⚠️ ต้อง bind ทั้ง touchstart + touchmove เพื่อให้ตอบสนองทันทีที่แตะครั้งแรก (Pitfall §9)
    function handleTouchAt(clientX, clientY) {
        if (gameState !== 'playing' || !canvas) return;
        var px = clientX / canvas.width;
        var py = clientY / canvas.height;
        // จำลองมือที่ตำแหน่งแตะ แล้วเช็คการชนวัตถุทุกตัว
        var fakeHand = { x: px, y: py, active: true };
        for (var i = items.length - 1; i >= 0; i--) {
            if (checkHandCollision(fakeHand, items[i])) {
                onHit(items[i], clientX, clientY);
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

    // ═══ ปุ่ม / exit ═══
    $('startBtn').addEventListener('click', startGame);
    $('restartBtn').addEventListener('click', function () { cleanup(); startGame(); });
    $('quitBtn').addEventListener('click', function () { cleanup(); KAMPAI.goHome(); });
    $('homeBtn').addEventListener('click', function () { cleanup(); KAMPAI.goHome(); });
    window.addEventListener('beforeunload', cleanup);

    // ออนไลน์ (ถ้าเปิดใช้)
    if (CFG.ENABLE_ONLINE && vs) {
        var btn = $('onlineBtn');
        if (btn) { btn.style.display = ''; btn.addEventListener('click', function () { vs.openMenu(); }); }
    }
})();
