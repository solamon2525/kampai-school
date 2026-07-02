/* split-mode.js — แข่ง 2 คนแบ่งจอ (P1 ซ้าย / P2 ขวา) + มือซ้าย/ขวา + มาร์กหัว */
(function (global) {
    'use strict';

    var active = false;
    var canvas, ctx, $, hands, presence, onEndCb;
    var CFG, DATA;
    var seededRng = null;
    var balloons = [];
    var particles = [];
    var popups = [];
    var spawnTimer = null;
    var mainTimer = null;
    var timeLeft = 60;
    var splitHold = { 1: null, 2: null };
    var pausedForPresence = false;
    var players = {
        1: blankPlayer(1),
        2: blankPlayer(2)
    };

    function blankPlayer(id) {
        return {
            id: id,
            score: 0,
            correct: 0,
            wrong: 0,
            question: null,
            wrongPool: [],
            label: id === 1 ? 'P1' : 'P2',
            color: id === 1 ? '#3b82f6' : '#f97316'
        };
    }

    function roll() {
        var r = seededRng || Math.random;
        return r();
    }

    function randInt(min, max) {
        return min + Math.floor(roll() * (max - min + 1));
    }

    function pickPhrase(list) {
        if (!list || !list.length) return '';
        return list[Math.floor(roll() * list.length)];
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
            add(randInt(CFG.TABLE_MIN, CFG.TABLE_MAX) * randInt(CFG.TABLE_MIN, CFG.TABLE_MAX));
        }
        return wrong;
    }

    function splitMid() { return canvas.width * 0.5; }

    function playerSide(id) {
        return id === 1 ? 'left' : 'right';
    }

    function xInPlayerHalf(x, owner) {
        var mid = splitMid();
        return owner === 1 ? x < mid : x >= mid;
    }

    function isCameraMode() {
        return hands && hands.mode === 'camera';
    }

    function balloonRadius(b) {
        var r = b.radius;
        if (isCameraMode()) r *= (CFG.CAMERA_RADIUS_MUL || 1.12);
        return r;
    }

    function balloonVy(b) {
        var vy = b.vy;
        var zoneTop = canvas.height * (CFG.PLAY_ZONE_TOP != null ? CFG.PLAY_ZONE_TOP : 0.4);
        if (b.y > zoneTop) vy *= (CFG.ZONE_SLOW_MUL != null ? CFG.ZONE_SLOW_MUL : 0.58);
        return vy;
    }

    function balloonDrawX(b) {
        return b.x + Math.sin(b.sway) * 10;
    }

    function pickBalloonValue(p) {
        if (!p.question) return 0;
        if (roll() < (CFG.CORRECT_SPAWN_WEIGHT || 0.32)) return p.question.answer;
        if (!p.wrongPool.length) return p.question.answer;
        return p.wrongPool[Math.floor(roll() * p.wrongPool.length)];
    }

    function spawnBalloonX(owner, radius) {
        var mid = splitMid();
        var margin = radius;
        if (owner === 1) {
            var l = margin;
            var r = mid - margin * 1.5;
            return l + roll() * Math.max(r - l, 1);
        }
        var l2 = mid + margin * 0.5;
        var r2 = canvas.width - margin;
        return l2 + roll() * Math.max(r2 - l2, 1);
    }

    function isSpawnClear(x, radius, owner) {
        var gap = CFG.MIN_SPAWN_GAP != null ? CFG.MIN_SPAWN_GAP : 52;
        var band = canvas.height * (CFG.SPAWN_CHECK_BAND != null ? CFG.SPAWN_CHECK_BAND : 0.5);
        var bandTop = canvas.height - band;
        for (var i = 0; i < balloons.length; i++) {
            var b = balloons[i];
            if (b.owner !== owner || b.popped || b.y < bandTop) continue;
            if (Math.abs(x - b.x) < radius + b.radius + gap) return false;
        }
        return true;
    }

    function findSpawnPosition(owner, radius) {
        var attempts = CFG.SPAWN_ATTEMPTS != null ? CFG.SPAWN_ATTEMPTS : 14;
        for (var a = 0; a < attempts; a++) {
            var x = spawnBalloonX(owner, radius);
            if (isSpawnClear(x, radius, owner)) return x;
        }
        return null;
    }

    function spawnYFor(x, radius, owner) {
        var gap = CFG.MIN_SPAWN_GAP != null ? CFG.MIN_SPAWN_GAP : 52;
        var y = canvas.height + radius;
        var bandTop = canvas.height - canvas.height * (CFG.SPAWN_CHECK_BAND != null ? CFG.SPAWN_CHECK_BAND : 0.5);
        for (var i = 0; i < balloons.length; i++) {
            var b = balloons[i];
            if (b.owner !== owner || b.popped || b.y < bandTop) continue;
            if (Math.abs(x - b.x) < radius + b.radius + gap) {
                y = Math.max(y, b.y + radius + b.radius + gap * 0.55);
            }
        }
        return y;
    }

    function makeRoomForBalloon(owner, mustBeCorrect) {
        var maxOnScreen = CFG.SPLIT_MAX_BALLOONS != null ? CFG.SPLIT_MAX_BALLOONS : 4;
        var count = 0;
        for (var i = 0; i < balloons.length; i++) {
            if (balloons[i].owner === owner && !balloons[i].popped) count++;
        }
        if (count < maxOnScreen) return;
        if (!mustBeCorrect) return;
        for (var j = balloons.length - 1; j >= 0; j--) {
            var b = balloons[j];
            var p = players[owner];
            if (b.owner === owner && p.question && b.value !== p.question.answer) {
                balloons.splice(j, 1);
                return;
            }
        }
    }

    function hasCorrectBalloon(owner) {
        var p = players[owner];
        if (!p.question) return false;
        for (var i = 0; i < balloons.length; i++) {
            var b = balloons[i];
            if (b.owner === owner && !b.popped && b.value === p.question.answer) return true;
        }
        return false;
    }

    function spawnBalloon(owner, forcedValue) {
        var p = players[owner];
        if (!p.question) return;
        var maxOnScreen = CFG.SPLIT_MAX_BALLOONS != null ? CFG.SPLIT_MAX_BALLOONS : 4;
        var mustBeCorrect = forcedValue === p.question.answer;
        var count = 0;
        for (var i = 0; i < balloons.length; i++) {
            if (balloons[i].owner === owner && !balloons[i].popped) count++;
        }
        if (count >= maxOnScreen) {
            if (mustBeCorrect) makeRoomForBalloon(owner, true);
            else return;
        }
        var value = forcedValue != null ? forcedValue : pickBalloonValue(p);
        var radius = CFG.BALLOON_RADIUS_MIN + roll() * (CFG.BALLOON_RADIUS_MAX - CFG.BALLOON_RADIUS_MIN);
        var x = findSpawnPosition(owner, radius);
        if (x == null) {
            if (!mustBeCorrect) return;
            x = owner === 1 ? splitMid() * 0.5 : splitMid() + splitMid() * 0.5;
        }
        var colorPair = DATA.BALLOON_COLORS[Math.floor(roll() * DATA.BALLOON_COLORS.length)];
        var baseVy = CFG.BALLOON_SPEED_MIN + roll() * (CFG.BALLOON_SPEED_MAX - CFG.BALLOON_SPEED_MIN);
        balloons.push({
            owner: owner,
            x: x,
            y: spawnYFor(x, radius, owner),
            vy: -baseVy,
            sway: roll() * Math.PI * 2,
            swaySpeed: 0.02 + roll() * 0.02,
            radius: radius,
            value: value,
            questionAnswer: p.question.answer,
            colorLight: colorPair[0],
            colorDark: colorPair[1],
            popped: false
        });
    }

    function ensureCorrectBalloon(owner) {
        if (!hasCorrectBalloon(owner)) spawnBalloon(owner, players[owner].question.answer);
    }

    function newQuestion(owner) {
        var p = players[owner];
        var a = randInt(CFG.TABLE_MIN, CFG.TABLE_MAX);
        var b = randInt(CFG.TABLE_MIN, CFG.TABLE_MAX);
        p.question = { a: a, b: b, answer: a * b };
        p.wrongPool = buildWrongAnswers(p.question);
        for (var i = balloons.length - 1; i >= 0; i--) {
            if (balloons[i].owner === owner) balloons.splice(i, 1);
        }
        splitHold[owner] = null;
        spawnBalloon(owner, p.question.answer);
        updateSplitHud();
    }

    function updateSplitHud() {
        [1, 2].forEach(function (id) {
            var p = players[id];
            var scoreEl = $('split-p' + id + '-score');
            var qEl = $('split-p' + id + '-q');
            if (scoreEl) scoreEl.textContent = p.score;
            if (qEl && p.question) qEl.textContent = p.question.a + ' × ' + p.question.b + ' = ?';
        });
        var timerEl = $('split-timer');
        if (timerEl) timerEl.textContent = timeLeft;
    }

    function spawnBurst(x, y, colorLight) {
        for (var i = 0; i < 12; i++) {
            var angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
            var speed = 2 + Math.random() * 3;
            particles.push({
                x: x, y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1.2,
                life: 1.0,
                decay: 0.022 + Math.random() * 0.02,
                size: 3 + Math.random() * 3,
                color: colorLight
            });
        }
    }

    function spawnPopup(x, y, text, good) {
        popups.push({ x: x, y: y, text: text, life: 1.0, good: good });
    }

    function popBalloon(b, index, drawX) {
        var owner = b.owner;
        var p = players[owner];
        var isCorrect = b.value === b.questionAnswer;
        if (isCorrect) {
            p.score += CFG.POINTS_CORRECT;
            p.correct++;
            spawnBurst(drawX, b.y, b.colorLight);
            spawnPopup(drawX, b.y, '+' + CFG.POINTS_CORRECT, true);
            global.KAMPAI.sound.correct();
            if (owner === 1) global.KAMPAI.sound.speak(pickPhrase(DATA.CORRECT_PHRASES), 'th-TH');
            global.KAMPAI.sound.fxFlash(true);
        } else {
            p.score += CFG.POINTS_WRONG;
            p.wrong++;
            spawnBurst(drawX, b.y, b.colorLight);
            spawnPopup(drawX, b.y, String(CFG.POINTS_WRONG), false);
            global.KAMPAI.sound.wrong();
            global.KAMPAI.sound.fxFlash(false);
        }
        updateSplitHud();
        balloons.splice(index, 1);
        if (splitHold[owner] && splitHold[owner].balloon === b) splitHold[owner] = null;
        newQuestion(owner);
    }

    function collectProbesFor(owner) {
        if (!hands) return [];
        if (isCameraMode()) {
            var ptr = owner === 1 ? hands.leftPointer : hands.rightPointer;
            if (!ptr || !ptr.active || ptr.x < 0) return [];
            if (!xInPlayerHalf(ptr.x, owner)) return [];
            if (hands.isGestureReady && !hands.isGestureReady(owner === 1 ? 'left' : 'right')) return [];
            return [{ x: ptr.x, y: ptr.y }];
        }
        return [];
    }

    function probeDist(b, drawX, p) {
        var dx = p.x - drawX;
        var dy = p.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function findMagnetHit(probes, owner, pad) {
        var magnetMul = CFG.MAGNET_RADIUS_MUL || 1.45;
        var best = null;
        for (var i = balloons.length - 1; i >= 0; i--) {
            var b = balloons[i];
            if (b.owner !== owner || b.popped) continue;
            var drawX = balloonDrawX(b);
            var br = balloonRadius(b);
            var hitR = (br + (pad || 0)) * magnetMul;
            for (var pi = 0; pi < probes.length; pi++) {
                var dist = probeDist(b, drawX, probes[pi]);
                if (dist < hitR && (!best || dist < best.dist)) {
                    best = { b: b, index: i, drawX: drawX, dist: dist };
                }
            }
        }
        return best;
    }

    function processHit(owner, probes, requireHold) {
        if (!probes.length) {
            splitHold[owner] = null;
            return;
        }
        var hit = findMagnetHit(probes, owner, CFG.FINGER_HIT_PADDING || 0);
        if (!hit) {
            splitHold[owner] = null;
            return;
        }
        if (!requireHold) {
            popBalloon(hit.b, hit.index, hit.drawX);
            splitHold[owner] = null;
            return;
        }
        var now = performance.now();
        var ht = splitHold[owner];
        if (ht && ht.balloon === hit.b) {
            if (now - ht.since >= (CFG.HIT_HOLD_MS || 200)) {
                popBalloon(hit.b, hit.index, hit.drawX);
                splitHold[owner] = null;
            }
        } else {
            splitHold[owner] = { balloon: hit.b, since: now, drawX: hit.drawX };
        }
    }

    function drawHoldRing(b, drawX, owner) {
        var ht = splitHold[owner];
        if (!ht || ht.balloon !== b) return;
        var br = balloonRadius(b);
        var elapsed = performance.now() - ht.since;
        var need = CFG.HIT_HOLD_MS || 200;
        var t = Math.min(1, elapsed / need);
        ctx.save();
        ctx.beginPath();
        ctx.arc(drawX, b.y, br + 10, -Math.PI / 2, -Math.PI / 2 + t * Math.PI * 2);
        ctx.strokeStyle = t >= 1 ? '#4be07a' : '#ffce54';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.stroke();
        ctx.restore();
    }

    function drawBalloon(b, drawX) {
        var br = balloonRadius(b);
        var label = String(b.value);
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(drawX, b.y + br * 0.95);
        ctx.lineTo(drawX, b.y + br * 1.35);
        ctx.stroke();
        var grad = ctx.createRadialGradient(drawX - br * 0.3, b.y - br * 0.35, br * 0.15, drawX, b.y, br);
        grad.addColorStop(0, b.colorLight);
        grad.addColorStop(1, b.colorDark);
        ctx.beginPath();
        ctx.ellipse(drawX, b.y, br * 0.88, br, 0, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        var fontSize = Math.max(20, br * 0.52);
        ctx.font = "800 " + fontSize + "px 'Mitr', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.strokeText(label, drawX, b.y);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, drawX, b.y);
        ctx.restore();
    }

    function drawSplitDivider() {
        var mid = splitMid();
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.35)';
        ctx.lineWidth = 3;
        ctx.setLineDash([10, 8]);
        ctx.beginPath();
        ctx.moveTo(mid, 0);
        ctx.lineTo(mid, canvas.height);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(59,130,246,0.08)';
        ctx.fillRect(0, 0, mid, canvas.height);
        ctx.fillStyle = 'rgba(249,115,22,0.08)';
        ctx.fillRect(mid, 0, mid, canvas.height);
        ctx.restore();
    }

    function drawHeadMarkers() {
        if (!presence) return;
        presence.tick();
        var heads = presence.getPlayers();
        var mid = splitMid();
        [1, 2].forEach(function (id) {
            var h = heads[id];
            var anchorX = id === 1 ? mid * 0.5 : mid + mid * 0.5;
            var anchorY = canvas.height * 0.11;
            var x = h.active ? h.x : anchorX;
            var y = h.active ? h.y : anchorY;
            var color = players[id].color;
            ctx.save();
            ctx.beginPath();
            ctx.arc(x, y, h.active ? 30 : 24, 0, Math.PI * 2);
            ctx.strokeStyle = h.active ? color : 'rgba(255,92,114,0.85)';
            ctx.lineWidth = h.active ? 4 : 3;
            if (!h.active) ctx.setLineDash([6, 5]);
            ctx.stroke();
            ctx.setLineDash([]);
            if (h.active) {
                ctx.beginPath();
                ctx.arc(x, y, 34, 0, Math.PI * 2);
                ctx.strokeStyle = color + '55';
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            ctx.font = "800 15px 'Mitr', sans-serif";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = 'rgba(0,0,0,0.6)';
            ctx.lineWidth = 3;
            ctx.strokeText(players[id].label, x, y + 1);
            ctx.fillText(players[id].label, x, y + 1);
            if (!h.active) {
                ctx.font = "600 11px 'Sarabun', sans-serif";
                ctx.fillStyle = '#ff5c72';
                ctx.fillText('ไม่พบผู้เล่น', x, y + 38);
            } else {
                ctx.font = "600 10px 'Sarabun', sans-serif";
                ctx.fillStyle = '#4be07a';
                ctx.fillText('✓ พร้อม', x, y - 42);
            }
            ctx.restore();
        });
    }

    function drawPlayZone(owner) {
        if (!isCameraMode()) return;
        var mid = splitMid();
        var top = canvas.height * (CFG.PLAY_ZONE_TOP != null ? CFG.PLAY_ZONE_TOP : 0.4);
        ctx.save();
        ctx.fillStyle = owner === 1 ? 'rgba(59,130,246,0.07)' : 'rgba(249,115,22,0.07)';
        if (owner === 1) ctx.fillRect(0, top, mid, canvas.height - top);
        else ctx.fillRect(mid, top, mid, canvas.height - top);
        ctx.restore();
    }

    function updateAndDrawBalloons() {
        var useHold = isCameraMode();
        [1, 2].forEach(function (owner) {
            var probes = collectProbesFor(owner);
            for (var i = balloons.length - 1; i >= 0; i--) {
                var b = balloons[i];
                if (b.owner !== owner || b.popped) continue;
                b.y += balloonVy(b);
                b.sway += b.swaySpeed;
                if (b.y < -balloonRadius(b) * 2) {
                    if (splitHold[owner] && splitHold[owner].balloon === b) splitHold[owner] = null;
                    balloons.splice(i, 1);
                }
            }
            processHit(owner, probes, useHold);
        });

        for (var j = 0; j < balloons.length; j++) {
            var bb = balloons[j];
            if (bb.popped) continue;
            var dx = balloonDrawX(bb);
            drawBalloon(bb, dx);
            if (useHold) drawHoldRing(bb, dx, bb.owner);
        }
    }

    function drawParticles() {
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.12;
            p.life -= p.decay;
            if (p.life <= 0) { particles.splice(i, 1); continue; }
            ctx.globalAlpha = Math.max(p.life, 0);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    function drawPopups() {
        for (var i = popups.length - 1; i >= 0; i--) {
            var p = popups[i];
            p.y -= 1.2;
            p.life -= 0.018;
            if (p.life <= 0) { popups.splice(i, 1); continue; }
            ctx.save();
            ctx.globalAlpha = Math.max(p.life, 0);
            ctx.font = "800 24px 'Mitr', sans-serif";
            ctx.textAlign = 'center';
            ctx.fillStyle = p.good ? '#4be07a' : '#ff5c72';
            ctx.fillText(p.text, p.x, p.y);
            ctx.restore();
        }
    }

    function bothPlayersPresent() {
        return !presence || presence.bothPresent();
    }

    function drawBalloonsStatic() {
        var useHold = isCameraMode();
        for (var j = 0; j < balloons.length; j++) {
            var bb = balloons[j];
            if (bb.popped) continue;
            var dx = balloonDrawX(bb);
            drawBalloon(bb, dx);
            if (useHold) drawHoldRing(bb, dx, bb.owner);
        }
    }

    function drawPauseOverlay() {
        ctx.save();
        ctx.fillStyle = 'rgba(5, 6, 20, 0.58)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = "800 24px 'Mitr', sans-serif";
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#ffce54';
        ctx.fillText('รอผู้เล่นทั้งสองฝั่ง…', canvas.width / 2, canvas.height * 0.47);
        ctx.font = "600 15px 'Sarabun', sans-serif";
        ctx.fillStyle = '#fff';
        var missing = [];
        if (presence && !presence.playerPresent(1)) missing.push('P1');
        if (presence && !presence.playerPresent(2)) missing.push('P2');
        if (missing.length) {
            ctx.fillText('ไม่พบ ' + missing.join(' · ') + ' — ให้ยืนในฝั่งของตัวเอง', canvas.width / 2, canvas.height * 0.53);
        }
        ctx.restore();
    }

    function drawFrame() {
        drawHeadMarkers();
        pausedForPresence = !bothPlayersPresent();
        drawSplitDivider();
        drawPlayZone(1);
        drawPlayZone(2);
        if (pausedForPresence) {
            drawBalloonsStatic();
        } else {
            updateAndDrawBalloons();
        }
        drawParticles();
        drawPopups();
        if (pausedForPresence) drawPauseOverlay();
    }

    function handleTap(clientX, clientY) {
        if (!hands || pausedForPresence) return;
        var pt = hands.clientToCanvas(canvas, clientX, clientY);
        var owner = pt.x < splitMid() ? 1 : 2;
        if (!xInPlayerHalf(pt.x, owner)) return;
        processHit(owner, [{ x: pt.x, y: pt.y }], false);
    }

    function endSplitGame() {
        if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
        if (mainTimer) { clearInterval(mainTimer); mainTimer = null; }
        balloons = [];
        splitHold = { 1: null, 2: null };
        global.KAMPAI.sound.bgmStop();
        global.KAMPAI.sound.gameOver();
        var p1 = players[1];
        var p2 = players[2];
        var winner = p1.score > p2.score ? 1 : p2.score > p1.score ? 2 : 0;
        var winnerText = winner === 1 ? 'P1 ชนะ! 🔵' : winner === 2 ? 'P2 ชนะ! 🟠' : 'เสมอ!';
        $('medal-emoji').textContent = winner === 0 ? '🤝' : '🏆';
        $('medal-label').textContent = winnerText;
        $('final-score').textContent = 'P1: ' + p1.score + ' · P2: ' + p2.score;
        $('stat-correct').textContent = p1.correct + ' / ' + p2.correct;
        $('stat-wrong').textContent = p1.wrong + ' / ' + p2.wrong;
        var total = p1.correct + p1.wrong + p2.correct + p2.wrong;
        var acc = total > 0 ? Math.round(((p1.correct + p2.correct) / total) * 100) : 0;
        $('stat-accuracy').textContent = acc + '%';
        $('rank-chip').style.display = 'none';
        $('leaderboard').style.display = 'none';
        if (onEndCb) onEndCb();
    }

    function startSplitGame() {
        players[1] = blankPlayer(1);
        players[2] = blankPlayer(2);
        balloons = [];
        particles = [];
        popups = [];
        splitHold = { 1: null, 2: null };
        timeLeft = CFG.SPLIT_DURATION != null ? CFG.SPLIT_DURATION : (CFG.GAME_DURATION || 60);

        $('hud').classList.add('hidden');
        $('question-bar').classList.add('hidden');
        $('hint-bar').classList.add('hidden');
        $('stage-pill').classList.add('hidden');
        $('timer-pill').classList.add('hidden');
        $('split-hud').classList.remove('hidden');

        newQuestion(1);
        newQuestion(2);
        updateSplitHud();
        global.KAMPAI.sound.bgmStart();

        spawnTimer = setInterval(function () {
            if (!bothPlayersPresent()) return;
            spawnBalloon(1);
            spawnBalloon(2);
            ensureCorrectBalloon(1);
            ensureCorrectBalloon(2);
        }, CFG.SPAWN_INTERVAL_MS);

        mainTimer = setInterval(function () {
            if (!bothPlayersPresent()) return;
            timeLeft--;
            updateSplitHud();
            if (timeLeft <= 0) endSplitGame();
        }, 1000);
    }

    function setSeed(seed) {
        if (seed == null) { seededRng = null; return; }
        var a = (seed >>> 0) || 1;
        seededRng = function () {
            a |= 0; a = (a + 0x6D2B79F5) | 0;
            var t = Math.imul(a ^ (a >>> 15), 1 | a);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    global.MultiplySplitMode = {
        init: function (deps) {
            canvas = deps.canvas;
            ctx = deps.ctx;
            $ = deps.$;
            hands = deps.hands;
            presence = deps.presence;
            onEndCb = deps.onEnd;
            CFG = deps.cfg || global.GAME_CONFIG;
            DATA = deps.data || global.GAME_DATA;
        },
        enter: function () { active = true; },
        leave: function () { active = false; },
        isActive: function () { return active; },
        setHands: function (h) { hands = h; },
        setPresence: function (p) { presence = p; },
        setSeed: setSeed,
        startGame: startSplitGame,
        drawFrame: drawFrame,
        handleTap: handleTap,
        drawHeadMarkersOnly: drawHeadMarkers,
        bothPresent: function () { return presence && presence.bothPresent(); },
        endGame: endSplitGame,
        cleanup: function () {
            if (spawnTimer) { clearInterval(spawnTimer); spawnTimer = null; }
            if (mainTimer) { clearInterval(mainTimer); mainTimer = null; }
            balloons = [];
            splitHold = { 1: null, 2: null };
            active = false;
            $('split-hud').classList.add('hidden');
        }
    };
}(window));
