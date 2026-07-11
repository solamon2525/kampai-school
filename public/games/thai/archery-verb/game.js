/* game.js — ลอจิกเกม AR ยิงธนูสู้คำกริยา
   ═══════════════════════════════════════════════════════════════════════════
   ❗ ใช้ KampaiHands (kampai-hands.js)
   ❗ Bow-draw mechanic: มือซ้ายถือคันธนู · มือขวาดึงสาย → ปล่อยมือ = ยิง
   ❗ Pitfall §12: restart = hands.stop(); hands=null; buildHands(); start()
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';
    var CFG = window.GAME_CONFIG, DATA = window.GAME_DATA;
    var $ = function (id) { return document.getElementById(id); };

    // ═══ SDK INIT ═══
    KAMPAI.setSlug(CFG.SLUG);
    KAMPAI.sound.mountToggles();
    KAMPAI.sound.defaultBgm(CFG.BGM || 'epic');

    // ═══ STATE ═══
    var canvas, ctx;
    var gameState = 'start';
    var score = 0, currentRound = 0, correctHits = 0, wrongHits = 0, missedVerbs = 0;
    var hands = null, rafId = null, seededRng = null;

    // Bow
    var bow = { x: 0.65, y: 0.5, state: 'idle', power: 0, angle: Math.PI, nockTime: 0 };
    var arrowCooldown = 0;

    // Arrows in flight
    var arrows = [];

    // Targets for current round
    var targets = [];
    var roundVerb = null;
    var roundActive = false;
    var feedbackTimer = null;
    var roundStartTime = 0;

    // Effects
    var particles = [];

    // Timing
    var lastTime = 0;

    // ═══ MULBERRY32 RNG ═══
    function createMulberry32(seed) {
        return function () {
            var t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }
    function rng() { return seededRng ? seededRng() : Math.random(); }

    // ═══ VERSUS ═══
    var vs = window.KampaiVersus ? KampaiVersus.create({
        duration: CFG.ONLINE_DURATION || 120,
        title: '\u{1F3F9} ยิงธนูสู้คำกริยา',
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

    // ═══ SDK CALLBACKS ═══
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
        var medals = ['\u{1F947}', '\u{1F948}', '\u{1F949}'];
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

    // ═══ SCREEN MANAGEMENT ═══
    function showScreen(id) {
        var els = document.querySelectorAll('.screen');
        for (var i = 0; i < els.length; i++) els[i].classList.remove('active');
        $(id).classList.add('active');
    }
    function setStatus() {
        var icon = hands && hands.mode === 'camera' ? '\u{1F3A5} กล้อง' : '\u{270B} แตะ';
        var tag = $('status-tag');
        if (tag) tag.textContent = icon;
    }

    // ═══ KAMPAI HANDS ═══
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

    // ═══ CANVAS ═══
    function setupCanvas() {
        canvas = $('arCanvas');
        if (!canvas) return;
        ctx = canvas.getContext('2d');
        if (!ctx) ctx = new Proxy({}, { get: function () { return function () {}; } });
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
    }
    function resizeCanvas() {
        if (!canvas) return;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    // ═══ SPAWN ROUND ═══
    function spawnRound() {
        currentRound++;
        targets = [];
        roundVerb = null;
        roundActive = true;
        roundStartTime = Date.now();
        arrows = [];
        bow.state = 'idle';
        bow.power = 0;
        arrowCooldown = 0;

        // Pick 1 verb + 2 different nouns
        var verb = DATA.VERBS[Math.floor(rng() * DATA.VERBS.length)];
        var nouns = [];
        while (nouns.length < 2) {
            var n = DATA.NOUNS[Math.floor(rng() * DATA.NOUNS.length)];
            if (nouns.indexOf(n) === -1 && n !== verb) nouns.push(n);
        }
        var words = [
            { word: verb, type: 'verb' },
            { word: nouns[0], type: 'noun' },
            { word: nouns[1], type: 'noun' }
        ];
        // Shuffle
        for (var i = words.length - 1; i > 0; i--) {
            var j = Math.floor(rng() * (i + 1));
            var tmp = words[i]; words[i] = words[j]; words[j] = tmp;
        }

        var ySlots = [0.22, 0.48, 0.74];
        for (var i = 0; i < 3; i++) {
            var fruit = DATA.FRUITS[Math.floor(rng() * DATA.FRUITS.length)];
            var color = DATA.TARGET_COLORS[Math.floor(rng() * DATA.TARGET_COLORS.length)];
            var t = {
                x: 0.06 + rng() * 0.17,
                y: ySlots[i] + (rng() - 0.5) * 0.06,
                word: words[i].word,
                type: words[i].type,
                fruit: fruit,
                color: color,
                bobPhase: rng() * Math.PI * 2,
                bobSpeed: 0.7 + rng() * 0.5,
                fallSpeed: CFG.TARGET_FALL_BASE + currentRound * CFG.TARGET_FALL_INCR,
                alive: true,
                radius: CFG.TARGET_HIT_R || 0.055,
                opacity: 0
            };
            targets.push(t);
            if (t.type === 'verb') roundVerb = t;
        }
        updateHUD();
        showFeedback('ข้อ ' + currentRound + '/' + CFG.TOTAL_ROUNDS + ' — ยิงคำกริยา!', '');
    }

    function nextRound() {
        if (currentRound >= CFG.TOTAL_ROUNDS) {
            endGame();
        } else {
            spawnRound();
        }
    }

    function checkRoundComplete() {
        if (!roundActive) return;
        // Verb hit → already handled in onArrowHit
        // Verb fell off screen?
        if (roundVerb && !roundVerb.alive) return; // already cleared
        if (roundVerb && roundVerb.y > 1.08) {
            // Verb missed
            roundVerb.alive = false;
            missedVerbs++;
            score = Math.max(0, score + CFG.POINTS_VERB_MISS);
            KAMPAI.sound.wrong();
            showFeedback('คำกริยา "' + roundVerb.word + '" ตกพื้น! (-5)', 'bad');
            updateHUD();
            if (vs) vs.report(score, { correct: correctHits });
            roundActive = false;
            if (feedbackTimer) clearTimeout(feedbackTimer);
            feedbackTimer = setTimeout(nextRound, 1500);
        }
    }

    // ═══ BOW LOGIC ═══
    function updateBow() {
        var lh = hands ? hands.leftHand : { x: -1, y: -1, active: false };
        var rh = hands ? hands.rightHand : { x: -1, y: -1, active: false };

        // Bow follows left hand (smooth)
        if (lh.active) {
            bow.x += (lh.x - bow.x) * 0.25;
            bow.y += (lh.y - bow.y) * 0.25;
        }

        // Cooldown after shot
        if (arrowCooldown > 0) {
            arrowCooldown -= 16.67;
            bow.state = 'idle';
            bow.power = 0;
            updatePowerGauge(0);
            return;
        }

        if (!roundActive) {
            bow.state = 'idle';
            bow.power = 0;
            updatePowerGauge(0);
            return;
        }

        if (!rh.active) {
            // Right hand lost → release if was drawing with enough power
            if (bow.state === 'drawing' && bow.power > 0.18) {
                releaseArrow();
            } else {
                bow.state = 'idle';
                bow.power = 0;
                updatePowerGauge(0);
            }
            return;
        }

        // Distance between right hand and bow
        var dx = rh.x - bow.x;
        var dy = rh.y - bow.y;
        var dist = Math.sqrt(dx * dx + dy * dy);

        switch (bow.state) {
            case 'idle':
                if (dist < CFG.NOCK_RADIUS) {
                    bow.state = 'nocking';
                    bow.nockTime = Date.now();
                }
                break;
            case 'nocking':
                if (dist > CFG.NOCK_RADIUS * 2) {
                    bow.state = 'idle';
                } else if (Date.now() - bow.nockTime > 180) {
                    bow.state = 'drawing';
                }
                break;
            case 'drawing':
                bow.power = Math.min(1.0, Math.max(0, (dist - CFG.NOCK_RADIUS * 0.4)) / CFG.MAX_DRAW);
                // Arrow direction: from right hand toward/past bow (opposite of pull)
                bow.angle = Math.atan2(bow.y - rh.y, bow.x - rh.x);
                updatePowerGauge(bow.power);
                // Auto-release at max power
                if (bow.power >= 0.97) {
                    releaseArrow();
                }
                break;
        }
    }

    function releaseArrow() {
        if (bow.power < 0.1) { bow.state = 'idle'; bow.power = 0; return; }

        var speed = CFG.ARROW_MIN_SPEED + bow.power * (CFG.ARROW_MAX_SPEED - CFG.ARROW_MIN_SPEED);
        arrows.push({
            x: bow.x,
            y: bow.y,
            vx: Math.cos(bow.angle) * speed,
            vy: Math.sin(bow.angle) * speed,
            active: true,
            trail: []
        });

        bow.state = 'idle';
        bow.power = 0;
        arrowCooldown = 350;
        updatePowerGauge(0);
        KAMPAI.sound.fxFlash(true);
    }

    // ═══ ARROW LOGIC ═══
    function updateArrows() {
        for (var i = arrows.length - 1; i >= 0; i--) {
            var a = arrows[i];
            if (!a.active) { arrows.splice(i, 1); continue; }

            a.vy += CFG.GRAVITY;
            a.x += a.vx;
            a.y += a.vy;

            // Trail
            a.trail.push({ x: a.x, y: a.y });
            if (a.trail.length > 14) a.trail.shift();

            // Check collision with targets
            for (var j = 0; j < targets.length; j++) {
                var t = targets[j];
                if (!t.alive) continue;
                var ddx = a.x - t.x, ddy = a.y - t.y;
                if (Math.sqrt(ddx * ddx + ddy * ddy) < t.radius + 0.025) {
                    a.active = false;
                    onArrowHit(t);
                    break;
                }
            }

            // Off screen
            if (a.x < -0.15 || a.x > 1.15 || a.y < -0.15 || a.y > 1.15) {
                a.active = false;
            }
        }
    }

    function onArrowHit(target) {
        target.alive = false;
        var W = canvas ? canvas.width : 800, H = canvas ? canvas.height : 600;
        var px = target.x * W, py = target.y * H;
        burstParticles(px, py, target.color);

        if (target.type === 'verb') {
            // Correct!
            correctHits++;
            score += CFG.POINTS_HIT_VERB;
            KAMPAI.sound.correct();
            KAMPAI.sound.fxFlash(true);
            showFeedback('\u2705 ถูกต้อง! "' + target.word + '" เป็นคำกริยา (+10)', 'good');
            addScorePop(px, py, '+10', '#4ade80');

            // Clear remaining targets and advance
            for (var i = 0; i < targets.length; i++) targets[i].alive = false;
            roundActive = false;
            updateHUD();
            if (vs) vs.report(score, { correct: correctHits });
            if (feedbackTimer) clearTimeout(feedbackTimer);
            feedbackTimer = setTimeout(nextRound, 1500);
        } else {
            // Wrong - hit decoy noun
            wrongHits++;
            score = Math.max(0, score + CFG.POINTS_HIT_DECOY);
            KAMPAI.sound.wrong();
            KAMPAI.sound.fxFlash(false);
            showFeedback('\u274C "' + target.word + '" เป็นคำนาม! (-5)', 'bad');
            addScorePop(px, py, '-5', '#fb7185');
            updateHUD();
            if (vs) vs.report(score, { correct: correctHits });
        }
    }

    // ═══ UPDATE TARGETS ═══
    function updateTargets() {
        var now = Date.now();
        for (var i = 0; i < targets.length; i++) {
            var t = targets[i];
            if (!t.alive) continue;
            // Fade in
            if (t.opacity < 1) t.opacity = Math.min(1, t.opacity + 0.04);
            // Fall
            t.y += t.fallSpeed;
        }
    }

    // ═══ RENDERING ═══
    function drawZones() {
        var W = canvas.width, H = canvas.height;
        // Left target zone (0-30%)
        ctx.save();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.06)';
        ctx.fillRect(0, 0, W * 0.30, H);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(W * 0.30, 0);
        ctx.lineTo(W * 0.30, H);
        ctx.stroke();
        ctx.setLineDash([]);
        // Right player zone (50-100%)
        ctx.fillStyle = 'rgba(250, 204, 21, 0.04)';
        ctx.fillRect(W * 0.50, 0, W * 0.50, H);
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.25)';
        ctx.lineWidth = 2;
        ctx.setLineDash([8, 6]);
        ctx.beginPath();
        ctx.moveTo(W * 0.50, 0);
        ctx.lineTo(W * 0.50, H);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    function drawBow() {
        var W = canvas.width, H = canvas.height;
        var bx = bow.x * W, by = bow.y * H;
        var sc = Math.min(W, H) / 720;
        var bowLen = 55 * sc;
        var bendBase = 14 * sc;
        var bendExtra = bow.power * 10 * sc;
        var pullBack = bow.power * 40 * sc;

        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(bow.angle - Math.PI / 2);

        // ── Bow limbs (wooden arc) ──
        ctx.beginPath();
        ctx.moveTo(0, -bowLen);
        ctx.quadraticCurveTo(bendBase + bendExtra, 0, 0, bowLen);
        ctx.strokeStyle = '#a0693c';
        ctx.lineWidth = 9 * sc;
        ctx.lineCap = 'round';
        ctx.stroke();
        // Inner highlight
        ctx.strokeStyle = '#d4a574';
        ctx.lineWidth = 4 * sc;
        ctx.stroke();

        // ── Grip ──
        ctx.beginPath();
        ctx.arc(2 * sc, 0, 5 * sc, 0, Math.PI * 2);
        ctx.fillStyle = '#5c3317';
        ctx.fill();

        // ── String ──
        ctx.beginPath();
        ctx.moveTo(0, -bowLen);
        if (bow.power > 0.01) {
            ctx.lineTo(-pullBack, 0);
        }
        ctx.lineTo(0, bowLen);
        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = 2 * sc;
        ctx.lineCap = 'round';
        ctx.stroke();

        // ── Arrow (when drawing) ──
        if (bow.state === 'drawing' && bow.power > 0.04) {
            var arrowLen = 55 * sc;
            // Shaft
            ctx.beginPath();
            ctx.moveTo(-pullBack, 0);
            ctx.lineTo(-pullBack + arrowLen, 0);
            ctx.strokeStyle = '#d4a574';
            ctx.lineWidth = 3 * sc;
            ctx.stroke();
            // Head
            ctx.beginPath();
            ctx.moveTo(-pullBack + arrowLen + 8 * sc, 0);
            ctx.lineTo(-pullBack + arrowLen - 4 * sc, -5 * sc);
            ctx.lineTo(-pullBack + arrowLen - 4 * sc, 5 * sc);
            ctx.closePath();
            ctx.fillStyle = '#c0c0c0';
            ctx.fill();
            // Feathers
            ctx.beginPath();
            ctx.moveTo(-pullBack + 2 * sc, 0);
            ctx.lineTo(-pullBack - 8 * sc, -5 * sc);
            ctx.lineTo(-pullBack - 8 * sc, 5 * sc);
            ctx.closePath();
            ctx.fillStyle = '#ef4444';
            ctx.fill();
        }

        ctx.restore();

        // ── Nocking hint ──
        if (bow.state === 'idle' && roundActive) {
            ctx.save();
            ctx.globalAlpha = 0.4 + Math.sin(Date.now() * 0.005) * 0.2;
            ctx.beginPath();
            ctx.arc(bx, by, CFG.NOCK_RADIUS * Math.min(W, H) * 0.8, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(250,204,21,0.5)';
            ctx.lineWidth = 2;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.restore();
        }
    }

    function drawAimLine() {
        if (bow.state !== 'drawing' || bow.power < 0.12) return;
        var W = canvas.width, H = canvas.height;
        ctx.save();
        ctx.globalAlpha = 0.25 + bow.power * 0.2;
        ctx.setLineDash([6, 5]);
        ctx.strokeStyle = 'rgba(250, 204, 21, 0.6)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(bow.x * W, bow.y * H);
        var aimDist = 0.35;
        ctx.lineTo((bow.x + Math.cos(bow.angle) * aimDist) * W,
                   (bow.y + Math.sin(bow.angle) * aimDist) * H);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.restore();
    }

    function drawFlyingArrow(a) {
        if (!a.active) return;
        var W = canvas.width, H = canvas.height;
        var ax = a.x * W, ay = a.y * H;
        var angle = Math.atan2(a.vy, a.vx);
        var sc = Math.min(W, H) / 720;
        var aLen = 45 * sc;

        // Trail
        ctx.save();
        for (var i = 0; i < a.trail.length; i++) {
            var tr = a.trail[i];
            var alpha = (i + 1) / a.trail.length * 0.45;
            var sz = 2 + (i / a.trail.length) * 2;
            ctx.beginPath();
            ctx.arc(tr.x * W, tr.y * H, sz, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(250, 204, 21, ' + alpha + ')';
            ctx.fill();
        }

        ctx.translate(ax, ay);
        ctx.rotate(angle);
        // Shaft
        ctx.beginPath();
        ctx.moveTo(-aLen, 0);
        ctx.lineTo(0, 0);
        ctx.strokeStyle = '#d4a574';
        ctx.lineWidth = 3 * sc;
        ctx.lineCap = 'round';
        ctx.stroke();
        // Head
        ctx.beginPath();
        ctx.moveTo(8 * sc, 0);
        ctx.lineTo(-6 * sc, -5 * sc);
        ctx.lineTo(-6 * sc, 5 * sc);
        ctx.closePath();
        ctx.fillStyle = '#e5e7eb';
        ctx.fill();
        // Feathers
        ctx.beginPath();
        ctx.moveTo(-aLen + 2 * sc, 0);
        ctx.lineTo(-aLen - 8 * sc, -4 * sc);
        ctx.lineTo(-aLen - 8 * sc, 4 * sc);
        ctx.closePath();
        ctx.fillStyle = '#ef4444';
        ctx.fill();
        ctx.restore();
    }

    function drawTarget(t) {
        if (!t.alive || t.opacity < 0.01) return;
        var W = canvas.width, H = canvas.height;
        var tx = t.x * W;
        var bob = Math.sin(Date.now() * 0.003 * t.bobSpeed + t.bobPhase) * 8;
        var ty = t.y * H + bob;
        var r = t.radius * Math.min(W, H);

        ctx.save();
        ctx.globalAlpha = t.opacity;

        // Glow
        var grd = ctx.createRadialGradient(tx, ty, r * 0.3, tx, ty, r * 1.4);
        grd.addColorStop(0, t.color + '33');
        grd.addColorStop(1, 'transparent');
        ctx.fillStyle = grd;
        ctx.fillRect(tx - r * 1.5, ty - r * 1.5, r * 3, r * 3);

        // Bubble
        ctx.beginPath();
        ctx.arc(tx, ty, r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
        ctx.fill();
        ctx.strokeStyle = t.type === 'verb' ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.6)';
        ctx.lineWidth = t.type === 'verb' ? 3 : 2;
        ctx.stroke();

        // Fruit
        var fruitSize = Math.max(24, Math.min(36, r * 0.8));
        ctx.font = fruitSize + 'px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(t.fruit, tx, ty - r * 0.22);

        // Word label
        var labelSize = Math.max(14, Math.min(22, r * 0.5));
        ctx.font = 'bold ' + labelSize + 'px "Mitr", "Sarabun", sans-serif';
        ctx.fillStyle = '#fff';
        ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 6;
        ctx.fillText(t.word, tx, ty + r * 0.42);
        ctx.shadowBlur = 0;

        ctx.restore();
    }

    function drawHandSkeleton() {
        if (!hands || hands.mode !== 'camera') return;
        if (hands.leftLandmarks) hands.drawSkeleton(ctx, hands.leftLandmarks, 'rgba(75, 224, 122, 0.8)', 'L');
        if (hands.rightLandmarks) hands.drawSkeleton(ctx, hands.rightLandmarks, 'rgba(34, 211, 238, 0.8)', 'R');
    }

    // ═══ EFFECTS ═══
    function burstParticles(px, py, color) {
        for (var i = 0; i < 10; i++) {
            var p = document.createElement('div');
            p.className = 'pop-particle';
            var a = (Math.PI * 2 / 10) * i;
            var d = 30 + Math.random() * 40;
            var sz = 4 + Math.random() * 6;
            p.style.cssText = 'left:' + px + 'px;top:' + py + 'px;width:' + sz + 'px;height:' + sz + 'px;background:' + color + ';--dx:' + ((Math.cos(a) * d) | 0) + 'px;--dy:' + ((Math.sin(a) * d) | 0) + 'px;';
            document.body.appendChild(p);
            p.addEventListener('animationend', function () { p.remove(); });
        }
    }

    function addScorePop(px, py, text, color) {
        var el = document.createElement('div');
        el.className = 'score-pop';
        el.textContent = text;
        el.style.cssText = 'left:' + px + 'px;top:' + py + 'px;color:' + color + ';font-size:28px;';
        document.body.appendChild(el);
        el.addEventListener('animationend', function () { el.remove(); });
    }

    // ═══ HUD ═══
    function updateHUD() {
        var elScore = $('scorePill');
        if (elScore) elScore.textContent = '\u2B50 ' + score;
        var elRound = $('roundPill');
        if (elRound) elRound.textContent = '\u{1F4CB} ' + currentRound + '/' + CFG.TOTAL_ROUNDS;
    }

    function updatePowerGauge(power) {
        var gauge = $('powerGauge');
        var fill = $('powerFill');
        var pct = $('powerPercent');
        if (!gauge) return;
        if (power > 0.03) {
            gauge.classList.add('show');
            if (fill) fill.style.height = (power * 100) + '%';
            if (pct) pct.textContent = Math.round(power * 100) + '%';
        } else {
            gauge.classList.remove('show');
        }
    }

    function showFeedback(text, type) {
        var el = $('feedbackMsg');
        if (!el) return;
        el.textContent = text;
        el.className = 'show' + (type ? ' ' + type : '');
        if (feedbackTimer) clearTimeout(feedbackTimer);
        // Don't auto-hide — nextRound will update it
    }

    // ═══ GAME LOOP ═══
    function loop(time) {
        if (gameState !== 'playing') return;
        if (!canvas || !ctx) { rafId = requestAnimationFrame(loop); return; }
        lastTime = time || performance.now();

        var W = canvas.width, H = canvas.height;
        ctx.clearRect(0, 0, W, H);

        // Update
        updateBow();
        updateArrows();
        updateTargets();
        checkRoundComplete();

        // Render (back to front)
        drawZones();
        drawHandSkeleton();
        for (var i = 0; i < targets.length; i++) drawTarget(targets[i]);
        for (var i = 0; i < arrows.length; i++) drawFlyingArrow(arrows[i]);
        drawAimLine();
        drawBow();

        rafId = requestAnimationFrame(loop);
    }

    // ═══ GAME LIFECYCLE ═══
    async function startGame() {
        showScreen('gameScreen');
        setupCanvas();
        KAMPAI.sound.unlock();
        KAMPAI.beginRound && KAMPAI.beginRound();

        stopHands();
        hands = buildHands();
        try { await hands.start(); } catch (e) { console.warn('Camera failed, tap fallback:', e); }
        setStatus();

        KAMPAI.sound.bgmStart();
        gameState = 'playing';
        score = 0; currentRound = 0; correctHits = 0; wrongHits = 0; missedVerbs = 0;
        arrows = []; particles = [];
        bow = { x: 0.65, y: 0.5, state: 'idle', power: 0, angle: Math.PI, nockTime: 0 };
        arrowCooldown = 0;
        updateHUD();
        updatePowerGauge(0);

        spawnRound();
        lastTime = performance.now();
        rafId = requestAnimationFrame(loop);
    }

    function endGame() {
        if (gameState === 'end') return;
        gameState = 'end';
        cleanup();
        KAMPAI.sound.bgmStop();
        KAMPAI.sound.gameOver();

        var stars = score >= 120 ? 3 : score >= 80 ? 2 : score >= 40 ? 1 : 0;
        KAMPAI.submitScore(score, { mode: 'normal', stars: stars, correct: correctHits, wrong: wrongHits, missed: missedVerbs });

        showScreen('resultScreen');
        var elStars = $('go-stars');
        if (elStars) elStars.textContent = '\u2B50'.repeat(stars) + '\u2606'.repeat(3 - stars);
        var elScore = $('final-score');
        if (elScore) elScore.textContent = score;
        var elDetail = $('final-detail');
        if (elDetail) elDetail.textContent = 'ยิงถูก ' + correctHits + ' · ยิงผิด ' + wrongHits + ' · กริยาตก ' + missedVerbs;
        renderLeaderboard('lbListEnd', 'lbBoxEnd');
    }

    function cleanup() {
        if (feedbackTimer) { clearTimeout(feedbackTimer); feedbackTimer = null; }
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        stopHands();
        seededRng = null;
        roundActive = false;
    }

    // ═══ TAP FALLBACK ═══
    function handleTapAt(cx, cy) {
        if (gameState !== 'playing' || !roundActive || !canvas) return;
        // Don't process taps on HUD buttons
        var el = document.elementFromPoint(cx, cy);
        if (el && (el.tagName === 'BUTTON' || el.closest('button'))) return;

        var rect = canvas.getBoundingClientRect();
        var nx = (cx - rect.left) / rect.width;
        var ny = (cy - rect.top) / rect.height;

        // Check if tap is near any alive target
        for (var i = 0; i < targets.length; i++) {
            var t = targets[i];
            if (!t.alive) continue;
            var bob = Math.sin(Date.now() * 0.003 * t.bobSpeed + t.bobPhase) * (8 / canvas.height);
            var dx = nx - t.x, dy = ny - (t.y + bob);
            if (Math.sqrt(dx * dx + dy * dy) < t.radius + 0.04) {
                // Create visual arrow trail from bow to target
                arrows.push({
                    x: t.x, y: t.y + bob,
                    vx: 0, vy: 0,
                    active: false,
                    trail: [{ x: bow.x, y: bow.y }, { x: (bow.x + t.x) / 2, y: (bow.y + t.y) / 2 }, { x: t.x, y: t.y + bob }]
                });
                onArrowHit(t);
                break;
            }
        }
    }

    document.addEventListener('touchstart', function (e) {
        var t = e.touches[0];
        if (t) handleTapAt(t.clientX, t.clientY);
    }, { passive: true });
    document.addEventListener('click', function (e) {
        handleTapAt(e.clientX, e.clientY);
    });

    // ═══ EVENT BINDINGS ═══
    $('startBtn').addEventListener('click', function () { startGame(); });
    $('restartBtn').addEventListener('click', function () { cleanup(); startGame(); });
    $('quitBtn').addEventListener('click', function () { cleanup(); KAMPAI.goHome(); });
    $('homeBtn').addEventListener('click', function () { cleanup(); KAMPAI.goHome(); });
    window.addEventListener('beforeunload', cleanup);

    if (CFG.ENABLE_ONLINE && vs) {
        var btn = $('onlineBtn');
        if (btn) { btn.style.display = ''; btn.addEventListener('click', function () { vs.openMenu(); }); }
    }
})();
