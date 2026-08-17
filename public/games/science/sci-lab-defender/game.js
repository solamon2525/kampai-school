/* game.js — Sci-Lab Defender (AR วันวิทย์)
   ลอจิกหลัก: จัดการ 3 ฐานกิจกรรม, KampaiHands AR, Particle Engine, Multi-touch และการคำนวณคะแนน */
(function () {
    'use strict';
    var CFG = window.GAME_CONFIG;
    var DATA = window.GAME_DATA;
    var $ = function (id) { return document.getElementById(id); };

    // ── กำหนดค่าระบบ KAMPAI SDK ──
    KAMPAI.setSlug(CFG.SLUG);
    KAMPAI.sound.mountToggles();
    KAMPAI.sound.defaultBgm(CFG.BGM || 'cheerful');

    var qrand = Math.random;

    function createMulberry32(seed) {
        return function () {
            var t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    // ── KampaiVersus สำหรับโหมดดวลและออนไลน์ ──
    var vs = window.KampaiVersus ? KampaiVersus.create({
        duration: CFG.TOTAL_STAGES * CFG.STAGE_DURATION,
        title: 'Sci-Lab Defender',
        rankBy: 'score',
        onPlay: function (opts) {
            var rng = opts && opts.rng;
            if (rng) {
                var seed = Math.floor(rng() * 4294967296);
                qrand = createMulberry32(seed);
            }
            stopHandTracking();
            startMission(true);
        },
        onEnd: function () {
            cleanupAll();
            KAMPAI.sound.bgmStop();
            KAMPAI.sound.gameOver();
        }
    }) : null;

    // ── Canvas Setup (รองรับ JSDOM Proxy) ──
    var canvas = $('arCanvas');
    var ctx = canvas ? canvas.getContext('2d') : null;
    if (!ctx) {
        ctx = new Proxy({}, { get: function () { return function () {}; }, set: function () { return true; } });
    }

    var W = 800, H = 600;
    function resizeCanvas() {
        if (!canvas) return;
        W = canvas.width = window.innerWidth || 800;
        H = canvas.height = window.innerHeight || 600;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    // ── Safe Canvas Rounded Rect Helper ──
    function drawRoundedRect(c, x, y, w, h, r) {
        if (c.roundRect) {
            c.beginPath();
            c.roundRect(x, y, w, h, r);
        } else {
            c.beginPath();
            c.moveTo(x + r, y);
            c.lineTo(x + w - r, y);
            c.quadraticCurveTo(x + w, y, x + w, y + r);
            c.lineTo(x + w, y + h - r);
            c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
            c.lineTo(x + r, y + h);
            c.quadraticCurveTo(x, y + h, x, y + h - r);
            c.lineTo(x, y + r);
            c.quadraticCurveTo(x, y, x + r, y);
            c.closePath();
        }
    }

    // ── State กลางของเกม ──
    var ST = {
        state: 'start', // 'start' | 'stage_brief' | 'playing' | 'gameover'
        score: 0,
        stage: 1,       // 1, 2, 3
        stageScores: [0, 0, 0],
        lives: CFG.LIVES_MAX,
        stageTimer: CFG.STAGE_DURATION,
        combo: 0,
        maxCombo: 0,
        correctCount: 0,
        wrongCount: 0,
        
        // Stage 1 State
        beakerX: 0.5,
        stage1WaveIdx: 0,
        stage1Items: [],
        
        // Stage 2 State
        leftShield: { x: 0.3, y: 0.7, active: true },
        rightShield: { x: 0.7, y: 0.7, active: true },
        lasers: [],
        solarCores: [
            { id: 'left', x: 0.08, y: 0.5, energy: 0, targetEnergy: 100 },
            { id: 'right', x: 0.92, y: 0.5, energy: 0, targetEnergy: 100 }
        ],

        // Stage 3 State
        stage3Targets: [],

        // Shared Visual FX
        particles: [],
        floatingTexts: [],
        beamEffects: [],

        // Timers & Loops
        spawnTimer: null,
        clockTimer: null,
        briefingTimer: null,
        rafId: null
    };

    var hands = null;

    // ── Helper คำนวณขอบเขตบีกเกอร์ (Stage 1) ──
    function getBeakerRect() {
        var bw = W * CFG.STAGE1.BEAKER_WIDTH_RATIO;
        var bh = bw * 0.75;
        var by = H - bh - 24;
        var bx = ST.beakerX * W - bw / 2;
        return { x: bx, y: by, w: bw, h: bh };
    }

    // ── Hand Tracking Management (KampaiHands) ──
    function buildHands() {
        return KampaiHands.create({
            video: '#arVideo',
            hands: CFG.HANDS,
            getCanvasSize: function () {
                return canvas ? { w: canvas.width, h: canvas.height } : null;
            },
            onStatus: function (s) {
                var tag = $('status-tag');
                if (tag) {
                    if (s === 'camera-on') tag.innerText = '📷 กล้อง AR พร้อมใช้งาน';
                    else if (s === 'no-camera') tag.innerText = '📱 โหมดสัมผัส/แตะหน้าจอ';
                    else tag.innerText = '🤖 ระบบพร้อม';
                }
            }
        });
    }

    function startHandTracking() {
        stopHandTracking();
        hands = buildHands();
        return hands.start().catch(function () {
            if (hands) hands.mode = 'tap';
        });
    }

    function stopHandTracking() {
        if (hands) {
            hands.stop();
            hands = null;
        }
    }

    // ── Helper UI Screens ──
    function showScreen(screenId) {
        var screens = ['startScreen', 'gameScreen', 'resultScreen'];
        screens.forEach(function (id) {
            var el = $(id);
            if (el) {
                el.classList.toggle('active', id === screenId);
            }
        });
    }

    function renderPlayerChip() {
        var s = KAMPAI.student, stt = KAMPAI.stats, chip = $('player-chip');
        if (!s || !chip) return;
        var av = s.photoUrl ? '<img src="' + s.photoUrl + '" alt="">' : '<div class="ini">' + ((s.displayName || '?')[0]) + '</div>';
        var best = stt ? ' · <b style="color:#facc15">สถิติสูงสุด ' + (stt.personalBest || 0) + '</b>' : '';
        chip.innerHTML = av + '<span>' + s.displayName + best + '</span>';
        chip.style.display = 'inline-flex';

        var bestEl = $('ms-best'), playsEl = $('ms-plays'), statsBox = $('my-stats');
        if (bestEl && stt) bestEl.innerText = stt.personalBest || 0;
        if (playsEl && stt) playsEl.innerText = stt.playCount || 0;
        if (statsBox && stt) statsBox.style.display = 'grid';
    }

    function renderLeaderboard() {
        var rows = KAMPAI.leaderboard || [];
        var lbBox = $('lbBox'), lbList = $('lbList');
        var lbBoxEnd = $('lbBoxEnd'), lbListEnd = $('lbListEnd');
        if (!rows.length) return;

        var medals = ['🥇', '🥈', '🥉'];
        var html = rows.slice(0, 5).map(function (r, idx) {
            var rank = medals[idx] || ('#' + (idx + 1));
            var meClass = r.isMe ? ' me' : '';
            return '<li class="lb-row' + meClass + '">' +
                '<span>' + rank + ' ' + (r.displayName || 'ผู้เล่น') + '</span>' +
                '<span>' + (r.personalBest || 0) + ' คะแนน</span>' +
                '</li>';
        }).join('');

        if (lbList) { lbList.innerHTML = html; if (lbBox) lbBox.style.display = 'block'; }
        if (lbListEnd) { lbListEnd.innerHTML = html; if (lbBoxEnd) lbBoxEnd.style.display = 'block'; }
    }

    KAMPAI.onReady(function () {
        renderPlayerChip();
        renderLeaderboard();
    });

    // ── ระบบ Visual Effects & Popups ──
    function spawnFloatingText(text, x, y, color) {
        ST.floatingTexts.push({
            text: text,
            x: x,
            y: y,
            color: color || '#facc15',
            alpha: 1.0,
            vy: -1.8,
            life: 1.0
        });
    }

    function spawnParticles(x, y, color, count, speed) {
        count = count || 12;
        speed = speed || 3.5;
        for (var i = 0; i < count; i++) {
            var angle = qrand() * Math.PI * 2;
            var spd = (0.4 + qrand() * 0.8) * speed;
            ST.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color: color,
                radius: 3 + qrand() * 4,
                alpha: 1.0,
                decay: 0.02 + qrand() * 0.03
            });
        }
    }

    function updateHUD() {
        var scoreEl = $('scorePill');
        var timerEl = $('timerPill');
        var livesEl = $('livesPill');
        var taskBadge = $('taskStageBadge');
        var taskTitle = $('taskTitle');

        if (scoreEl) scoreEl.innerText = '⭐ ' + ST.score;
        if (timerEl) timerEl.innerText = '⏱ ' + ST.stageTimer + 's';
        if (livesEl) {
            var hearts = '';
            for (var i = 0; i < CFG.LIVES_MAX; i++) {
                hearts += (i < ST.lives) ? '❤️' : '🖤';
            }
            livesEl.innerText = '🛡️ ' + hearts;
        }

        if (ST.stage === 1) {
            var wave = DATA.STAGE1_WAVES[ST.stage1WaveIdx] || DATA.STAGE1_WAVES[0];
            if (taskBadge) taskBadge.innerText = '🧪 ฐานที่ 1: สสารและเคมี (Wave ' + (ST.stage1WaveIdx + 1) + '/3)';
            if (taskTitle) taskTitle.innerText = wave.taskPrompt;
        } else if (ST.stage === 2) {
            if (taskBadge) taskBadge.innerText = '⚡ ฐานที่ 2: แสงและพลังงาน';
            if (taskTitle) taskTitle.innerText = '✨ ใช้ 2 มือสะท้อนเลเซอร์เข้าสู่แท่นชาร์จโซลาร์เซลล์!';
        } else if (ST.stage === 3) {
            if (taskBadge) taskBadge.innerText = '🚀 ฐานที่ 3: อวกาศและดาราศาสตร์';
            if (taskTitle) taskTitle.innerText = '☄️ FEVER TIME! ใช้นิ้วชี้จิ้มระเบิดอุกกาบาต';
        }
    }

    // ── Stage 1: สสารและเคมี (Matter Catch) ──
    function spawnStage1Item() {
        if (ST.state !== 'playing' || ST.stage !== 1) return;
        var wave = DATA.STAGE1_WAVES[ST.stage1WaveIdx] || DATA.STAGE1_WAVES[0];
        var itemPool = wave.items;
        var template = itemPool[Math.floor(qrand() * itemPool.length)];

        var speed = (CFG.STAGE1.ITEM_SPEED_MIN + qrand() * (CFG.STAGE1.ITEM_SPEED_MAX - CFG.STAGE1.ITEM_SPEED_MIN)) * (H / 600);
        ST.stage1Items.push({
            name: template.name,
            sub: template.sub,
            state: template.state,
            icon: template.icon,
            color: template.color,
            isHazard: !!template.isHazard,
            x: 0.12 + qrand() * 0.76,
            y: -0.08,
            speed: speed,
            radius: Math.max(22, W * 0.028),
            angle: 0,
            rotSpeed: (qrand() - 0.5) * 0.04
        });
    }

    function updateStage1(dt) {
        var deltaFactor = dt * 60;

        // อัปเดตตำแหน่งบีกเกอร์จากมือ AR
        if (hands && hands.mode === 'camera') {
            var xs = [];
            if (hands.leftHand && hands.leftHand.active) xs.push(hands.leftHand.x);
            if (hands.rightHand && hands.rightHand.active) xs.push(hands.rightHand.x);
            if (xs.length > 0) {
                var avgX = xs.reduce(function (a, b) { return a + b; }, 0) / xs.length;
                ST.beakerX += (avgX - ST.beakerX) * Math.min(1.0, 0.35 * deltaFactor);
            }
        }

        var beaker = getBeakerRect();
        var beakerLeft = beaker.x;
        var beakerRight = beaker.x + beaker.w;
        var beakerY = beaker.y;
        var beakerH = beaker.h;

        var wave = DATA.STAGE1_WAVES[ST.stage1WaveIdx] || DATA.STAGE1_WAVES[0];

        for (var i = ST.stage1Items.length - 1; i >= 0; i--) {
            var it = ST.stage1Items[i];
            it.y += ((it.speed * deltaFactor) / H);
            it.angle += it.rotSpeed * deltaFactor;

            var px = it.x * W;
            var py = it.y * H;

            // ตรวจสอบการชนกับบีกเกอร์
            if (py + it.radius >= beakerY && py - it.radius <= beakerY + beakerH * 0.5) {
                if (px >= beakerLeft - 10 && px <= beakerRight + 10) {
                    if (it.isHazard) {
                        ST.score = Math.max(0, ST.score + CFG.STAGE1.POINTS_HAZARD);
                        ST.stageScores[0] = Math.max(0, ST.stageScores[0] + CFG.STAGE1.POINTS_HAZARD);
                        ST.lives = Math.max(0, ST.lives - 1);
                        ST.combo = 0;
                        ST.wrongCount++;
                        KAMPAI.sound.wrong();
                        spawnFloatingText('☣️ สารพิษ! -20', px, beakerY, '#ef4444');
                        spawnParticles(px, beakerY, '#ef4444', 20, 5);
                    } else if (it.state === wave.targetState) {
                        ST.combo++;
                        if (ST.combo > ST.maxCombo) ST.maxCombo = ST.combo;
                        var pts = CFG.STAGE1.POINTS_CORRECT + (ST.combo > 2 ? 5 : 0);
                        ST.score += pts;
                        ST.stageScores[0] += pts;
                        ST.correctCount++;
                        KAMPAI.sound.correct();
                        spawnFloatingText('+' + pts + ' ' + (ST.combo > 2 ? '🔥x' + ST.combo : ''), px, beakerY, '#38bdf8');
                        spawnParticles(px, beakerY, it.color, 18, 4);
                    } else {
                        ST.score = Math.max(0, ST.score + CFG.STAGE1.POINTS_WRONG);
                        ST.stageScores[0] = Math.max(0, ST.stageScores[0] + CFG.STAGE1.POINTS_WRONG);
                        ST.lives = Math.max(0, ST.lives - 1);
                        ST.combo = 0;
                        ST.wrongCount++;
                        KAMPAI.sound.wrong();
                        spawnFloatingText('❌ ผิดสถานะ! -10', px, beakerY, '#f43f5e');
                        spawnParticles(px, beakerY, '#f43f5e', 14, 3);
                    }

                    ST.stage1Items.splice(i, 1);
                    checkLives();
                    updateHUD();
                    continue;
                }
            }

            // ตกพ้นจอ
            if (it.y > 1.1) {
                ST.stage1Items.splice(i, 1);
            }
        }
    }

    // ── Stage 2: แสงและพลังงาน (Optics & Solar Deflector) ──
    function spawnStage2Laser() {
        if (ST.state !== 'playing' || ST.stage !== 2) return;
        var beam = DATA.STAGE2_BEAMS[Math.floor(qrand() * DATA.STAGE2_BEAMS.length)];
        var speed = (CFG.STAGE2.LASER_SPEED_MIN + qrand() * (CFG.STAGE2.LASER_SPEED_MAX - CFG.STAGE2.LASER_SPEED_MIN)) * (H / 600);

        ST.lasers.push({
            name: beam.name,
            color: beam.color,
            glow: beam.glow,
            icon: beam.icon,
            power: beam.power,
            x: 0.2 + qrand() * 0.6,
            y: -0.05,
            vx: (qrand() - 0.5) * 0.003,
            vy: speed / H,
            deflected: false,
            targetCore: null,
            radius: Math.max(16, W * 0.02)
        });
    }

    function updateStage2(dt) {
        var deltaFactor = dt * 60;

        // อัปเดตตำแหน่งโล่กระจกจากมือ 2 ข้าง
        if (hands && hands.mode === 'camera') {
            if (hands.leftHand && hands.leftHand.active) {
                ST.leftShield.x += (hands.leftHand.x - ST.leftShield.x) * Math.min(1.0, 0.4 * deltaFactor);
                ST.leftShield.y += (hands.leftHand.y - ST.leftShield.y) * Math.min(1.0, 0.4 * deltaFactor);
                ST.leftShield.active = true;
            }
            if (hands.rightHand && hands.rightHand.active) {
                ST.rightShield.x += (hands.rightHand.x - ST.rightShield.x) * Math.min(1.0, 0.4 * deltaFactor);
                ST.rightShield.y += (hands.rightHand.y - ST.rightShield.y) * Math.min(1.0, 0.4 * deltaFactor);
                ST.rightShield.active = true;
            }
        }

        var shields = [ST.leftShield, ST.rightShield];
        var shieldRadius = CFG.STAGE2.SHIELD_RADIUS;

        for (var i = ST.lasers.length - 1; i >= 0; i--) {
            var l = ST.lasers[i];

            if (!l.deflected) {
                l.x += l.vx * deltaFactor;
                l.y += l.vy * deltaFactor;

                var lx = l.x * W;
                var ly = l.y * H;

                // ตรวจสอบการสะท้อนกับโล่มือทั้ง 2 ข้าง
                for (var s = 0; s < shields.length; s++) {
                    var sh = shields[s];
                    if (!sh.active) continue;
                    var sx = sh.x * W;
                    var sy = sh.y * H;

                    var dx = lx - sx;
                    var dy = ly - sy;
                    var dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < shieldRadius + l.radius) {
                        l.deflected = true;
                        l.targetCore = (lx < W / 2) ? ST.solarCores[0] : ST.solarCores[1];

                        var tx = l.targetCore.x * W;
                        var ty = l.targetCore.y * H;
                        var tdx = tx - lx;
                        var tdy = ty - ly;
                        var tlen = Math.sqrt(tdx * tdx + tdy * tdy) || 1;

                        var deflectSpeed = 8.5;
                        l.vx = (tdx / tlen) * (deflectSpeed / W);
                        l.vy = (tdy / tlen) * (deflectSpeed / H);

                        ST.score += CFG.STAGE2.POINTS_DEFLECT;
                        ST.stageScores[1] += CFG.STAGE2.POINTS_DEFLECT;
                        ST.combo++;
                        if (ST.combo > ST.maxCombo) ST.maxCombo = ST.combo;
                        KAMPAI.sound.correct();
                        spawnFloatingText('⚡ สะท้อนเลเซอร์! +' + CFG.STAGE2.POINTS_DEFLECT, lx, ly, l.color);
                        spawnParticles(lx, ly, l.color, 16, 5);
                        break;
                    }
                }

                // เลเซอร์หลุดลงล่าง
                if (l.y > 1.05) {
                    ST.score = Math.max(0, ST.score + CFG.STAGE2.POINTS_MISS);
                    ST.stageScores[1] = Math.max(0, ST.stageScores[1] + CFG.STAGE2.POINTS_MISS);
                    ST.lives = Math.max(0, ST.lives - 1);
                    ST.combo = 0;
                    ST.wrongCount++;
                    KAMPAI.sound.wrong();
                    spawnFloatingText('💥 เลเซอร์หลุด! -10', lx, H - 30, '#f43f5e');
                    spawnParticles(lx, H - 20, '#f43f5e', 12, 3);
                    ST.lasers.splice(i, 1);
                    checkLives();
                    updateHUD();
                    continue;
                }
            } else {
                // เลเซอร์ที่สะท้อนแล้ว พุ่งเข้าแท่นชาร์จโซลาร์เซลล์
                l.x += l.vx * deltaFactor;
                l.y += l.vy * deltaFactor;

                var clx = l.x * W;
                var cly = l.y * H;
                var coreX = l.targetCore.x * W;
                var coreY = l.targetCore.y * H;

                var cdx = clx - coreX;
                var cdy = cly - coreY;
                if (Math.sqrt(cdx * cdx + cdy * cdy) < 45) {
                    l.targetCore.energy = Math.min(100, l.targetCore.energy + l.power);
                    ST.score += CFG.STAGE2.POINTS_CORE_HIT;
                    ST.stageScores[1] += CFG.STAGE2.POINTS_CORE_HIT;
                    ST.correctCount++;
                    KAMPAI.sound.correct();
                    spawnFloatingText('🔋 ชาร์จโซลาร์! +' + CFG.STAGE2.POINTS_CORE_HIT, coreX, coreY, '#facc15');
                    spawnParticles(coreX, coreY, '#facc15', 24, 6);
                    ST.lasers.splice(i, 1);
                    updateHUD();
                    continue;
                }

                if (l.x < -0.1 || l.x > 1.1 || l.y < -0.1 || l.y > 1.1) {
                    ST.lasers.splice(i, 1);
                }
            }
        }
    }

    // ── Stage 3: อวกาศและดาราศาสตร์ (Space Defense Fever Time) ──
    function spawnStage3Target() {
        if (ST.state !== 'playing' || ST.stage !== 3) return;
        var pool = DATA.STAGE3_TARGETS;
        var tpl = pool[Math.floor(qrand() * pool.length)];

        var fromSide = qrand() > 0.4;
        var startX = fromSide ? (qrand() > 0.5 ? -0.05 : 1.05) : (0.1 + qrand() * 0.8);
        var startY = fromSide ? (0.1 + qrand() * 0.6) : -0.05;
        var targetX = 0.2 + qrand() * 0.6;
        var targetY = 0.5 + qrand() * 0.4;

        var dx = targetX - startX;
        var dy = targetY - startY;
        var len = Math.sqrt(dx * dx + dy * dy) || 1;
        var spd = (CFG.STAGE3.TARGET_SPEED_MIN + qrand() * (CFG.STAGE3.TARGET_SPEED_MAX - CFG.STAGE3.TARGET_SPEED_MIN)) / 600;

        ST.stage3Targets.push({
            name: tpl.name,
            sub: tpl.sub,
            type: tpl.type,
            icon: tpl.icon,
            points: tpl.points,
            color: tpl.color,
            isBonus: !!tpl.isBonus,
            radius: Math.max(22, W * 0.028),
            x: startX,
            y: startY,
            vx: (dx / len) * spd,
            vy: (dy / len) * spd,
            angle: 0,
            rotSpeed: (qrand() - 0.5) * 0.06
        });
    }

    function checkFingerHit(tx, ty, tr) {
        if (hands && hands.collectHitProbes) {
            var probes = hands.collectHitProbes();
            var pad = CFG.STAGE3.FINGER_HIT_PADDING;
            for (var p = 0; p < probes.length; p++) {
                var pr = probes[p];
                var dx = tx - pr.x;
                var dy = ty - pr.y;
                if (Math.sqrt(dx * dx + dy * dy) < tr + pad) {
                    return true;
                }
            }
        }
        return false;
    }

    function destroyTarget(idx, hitX, hitY) {
        var t = ST.stage3Targets[idx];
        if (!t) return;

        ST.combo++;
        if (ST.combo > ST.maxCombo) ST.maxCombo = ST.combo;
        var pts = t.points + (ST.combo > 3 ? 15 : 0);
        ST.score += pts;
        ST.stageScores[2] += pts;
        ST.correctCount++;
        KAMPAI.sound.correct();

        spawnFloatingText('💥 ' + t.name + ' +' + pts + (ST.combo > 3 ? ' 🔥x' + ST.combo : ''), hitX, hitY, t.color);
        spawnParticles(hitX, hitY, t.color, t.isBonus ? 30 : 20, 6);

        ST.stage3Targets.splice(idx, 1);
        updateHUD();
    }

    function updateStage3(dt) {
        var deltaFactor = dt * 60;

        for (var i = ST.stage3Targets.length - 1; i >= 0; i--) {
            var t = ST.stage3Targets[i];
            t.x += t.vx * deltaFactor;
            t.y += t.vy * deltaFactor;
            t.angle += t.rotSpeed * deltaFactor;

            var px = t.x * W;
            var py = t.y * H;

            // ตรวจจับชนปลายนิ้วชี้
            if (checkFingerHit(px, py, t.radius)) {
                destroyTarget(i, px, py);
                continue;
            }

            // ชนขอบล่างของสถานีทดลอง
            if (t.y > 1.05) {
                if (!t.isBonus) {
                    ST.score = Math.max(0, ST.score - 10);
                    ST.stageScores[2] = Math.max(0, ST.stageScores[2] - 10);
                    ST.lives = Math.max(0, ST.lives - 1);
                    ST.combo = 0;
                    ST.wrongCount++;
                    KAMPAI.sound.wrong();
                    spawnFloatingText('💥 อุกกาบาตชนแล็บ! -10', px, H - 40, '#f43f5e');
                    spawnParticles(px, H - 30, '#f43f5e', 15, 4);
                    checkLives();
                    updateHUD();
                }
                ST.stage3Targets.splice(i, 1);
            }
        }
    }

    function checkLives() {
        if (ST.lives <= 0 && ST.state === 'playing') {
            finishMission();
        }
    }

    // ── Touch & Mouse Fallback (รองรับ Multi-touch 2 มือ) ──
    function handlePointerInput(clientX, clientY) {
        if (ST.state !== 'playing' || !canvas) return;

        var rect = canvas.getBoundingClientRect();
        var px = clientX - rect.left;
        var py = clientY - rect.top;
        var normX = px / W;
        var normY = py / H;

        if (ST.stage === 1) {
            ST.beakerX = Math.max(0.1, Math.min(0.9, normX));
        } else if (ST.stage === 2) {
            if (normX < 0.5) {
                ST.leftShield.x = normX;
                ST.leftShield.y = normY;
                ST.leftShield.active = true;
            } else {
                ST.rightShield.x = normX;
                ST.rightShield.y = normY;
                ST.rightShield.active = true;
            }
        } else if (ST.stage === 3) {
            for (var i = ST.stage3Targets.length - 1; i >= 0; i--) {
                var t = ST.stage3Targets[i];
                var tx = t.x * W;
                var ty = t.y * H;
                var dist = Math.sqrt((px - tx) * (px - tx) + (py - ty) * (py - ty));
                if (dist < t.radius + 32) {
                    destroyTarget(i, tx, ty);
                    break;
                }
            }
        }
    }

    function handleAllTouches(e) {
        if (ST.state !== 'playing' || !canvas) return;
        var touches = e.touches;
        if (touches && touches.length > 0) {
            for (var i = 0; i < touches.length; i++) {
                handlePointerInput(touches[i].clientX, touches[i].clientY);
            }
        }
    }

    if (canvas) {
        canvas.addEventListener('touchstart', function (e) {
            e.preventDefault();
            handleAllTouches(e);
        }, { passive: false });

        canvas.addEventListener('touchmove', function (e) {
            e.preventDefault();
            handleAllTouches(e);
        }, { passive: false });

        canvas.addEventListener('pointerdown', function (e) {
            if (e.pointerType !== 'touch') {
                handlePointerInput(e.clientX, e.clientY);
            }
        });

        canvas.addEventListener('pointermove', function (e) {
            if (e.pointerType !== 'touch' && e.buttons > 0) {
                handlePointerInput(e.clientX, e.clientY);
            }
        });
    }

    // ── Main Render Loop (ไม่เรียก requestAnimationFrame ในตัว) ──
    function render(dt) {
        if (!ctx || !canvas) return;
        var deltaFactor = (dt || 0.016) * 60;
        ctx.clearRect(0, 0, W, H);

        // 1. วาด HUD Overlay ตารางไซเบอร์แล็บ
        drawSciLabBackgroundGrid();

        // 2. วาดตามแต่ละ Stage
        if (ST.state === 'playing') {
            if (ST.stage === 1) {
                renderStage1();
            } else if (ST.stage === 2) {
                renderStage2();
            } else if (ST.stage === 3) {
                renderStage3();
            }
        }

        // 3. วาด Hand Skeletons & Pointers
        if (hands && hands.mode === 'camera') {
            if (hands.leftLandmarks) hands.drawSkeleton(ctx, hands.leftLandmarks, '#38bdf8', 'L');
            if (hands.rightLandmarks) hands.drawSkeleton(ctx, hands.rightLandmarks, '#facc15', 'R');
        }

        // 4. วาด Particles
        for (var p = ST.particles.length - 1; p >= 0; p--) {
            var pt = ST.particles[p];
            pt.x += pt.vx * deltaFactor;
            pt.y += pt.vy * deltaFactor;
            pt.alpha -= pt.decay * deltaFactor;
            if (pt.alpha <= 0) {
                ST.particles.splice(p, 1);
                continue;
            }
            ctx.save();
            ctx.globalAlpha = Math.max(0, pt.alpha);
            ctx.fillStyle = pt.color;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // 5. วาด Floating Texts
        for (var f = ST.floatingTexts.length - 1; f >= 0; f--) {
            var ft = ST.floatingTexts[f];
            ft.y += ft.vy * deltaFactor;
            ft.life -= 0.025 * deltaFactor;
            if (ft.life <= 0) {
                ST.floatingTexts.splice(f, 1);
                continue;
            }
            ctx.save();
            ctx.globalAlpha = Math.min(1.0, Math.max(0, ft.life * 1.5));
            ctx.font = 'bold 20px Sarabun, sans-serif';
            ctx.fillStyle = ft.color;
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 6;
            ctx.textAlign = 'center';
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.restore();
        }
    }

    function drawSciLabBackgroundGrid() {
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.08)';
        ctx.lineWidth = 1;
        var step = 60;
        for (var x = 0; x < W; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, H);
            ctx.stroke();
        }
        for (var y = 0; y < H; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }
        ctx.restore();
    }

    function renderStage1() {
        for (var i = 0; i < ST.stage1Items.length; i++) {
            var it = ST.stage1Items[i];
            var px = it.x * W;
            var py = it.y * H;

            ctx.save();
            ctx.translate(px, py);
            ctx.rotate(it.angle);

            // ฟองสสารเรืองแสง
            var grad = ctx.createRadialGradient(0, 0, 4, 0, 0, it.radius);
            grad.addColorStop(0, it.color);
            grad.addColorStop(0.8, it.color);
            grad.addColorStop(1, 'rgba(255,255,255,0.2)');
            ctx.fillStyle = grad;
            ctx.shadowColor = it.color;
            ctx.shadowBlur = 14;
            ctx.beginPath();
            ctx.arc(0, 0, it.radius, 0, Math.PI * 2);
            ctx.fill();

            // ไอคอนและชื่อสสาร
            ctx.font = (it.radius * 0.9) + 'px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(it.icon, 0, -4);

            ctx.font = 'bold 12px Sarabun, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            ctx.fillText(it.name, 0, it.radius + 14);

            ctx.restore();
        }

        // วาดบีกเกอร์แก้วทดลอง
        var b = getBeakerRect();
        ctx.save();
        ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;

        ctx.beginPath();
        ctx.moveTo(b.x, b.y);
        ctx.lineTo(b.x + 10, b.y + b.h);
        ctx.lineTo(b.x + b.w - 10, b.y + b.h);
        ctx.lineTo(b.x + b.w, b.y);
        ctx.stroke();
        ctx.fill();

        // ของเหลวเรืองแสงในบีกเกอร์
        ctx.fillStyle = 'rgba(6, 182, 212, 0.6)';
        ctx.beginPath();
        ctx.moveTo(b.x + 5, b.y + b.h * 0.4);
        ctx.lineTo(b.x + 10, b.y + b.h);
        ctx.lineTo(b.x + b.w - 10, b.y + b.h);
        ctx.lineTo(b.x + b.w - 5, b.y + b.h * 0.4);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Sarabun, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🧪 BEAKER LAB', b.x + b.w / 2, b.y + b.h / 2 + 6);
        ctx.restore();
    }

    function renderStage2() {
        // วาด Solar Cores ด้านข้าง
        for (var c = 0; c < ST.solarCores.length; c++) {
            var core = ST.solarCores[c];
            var cx = core.x * W;
            var cy = core.y * H;

            ctx.save();
            ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
            ctx.strokeStyle = core.energy >= 100 ? '#22c55e' : '#facc15';
            ctx.lineWidth = 3;
            ctx.shadowColor = ctx.strokeStyle;
            ctx.shadowBlur = 16;

            drawRoundedRect(ctx, cx - 36, cy - 70, 72, 140, 16);
            ctx.fill();
            ctx.stroke();

            // หลอดพลังงาน
            var fillH = (core.energy / 100) * 110;
            ctx.fillStyle = core.energy >= 100 ? '#22c55e' : '#facc15';
            ctx.fillRect(cx - 28, cy + 55 - fillH, 56, fillH);

            ctx.font = '24px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🔋', cx, cy - 25);
            ctx.font = 'bold 12px Sarabun, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(core.energy + '%', cx, cy + 40);
            ctx.restore();
        }

        // วาดลำแสงเลเซอร์ (Laser Vector Rendering with Beam Tail)
        for (var i = 0; i < ST.lasers.length; i++) {
            var l = ST.lasers[i];
            var lx = l.x * W;
            var ly = l.y * H;

            var vlen = Math.sqrt(l.vx * l.vx + l.vy * l.vy) || 0.001;
            var dirX = l.vx / vlen;
            var dirY = l.vy / vlen;
            var tailLength = Math.max(20, W * 0.025);

            ctx.save();
            // หางลำแสงพุ่ง
            ctx.strokeStyle = l.color;
            ctx.lineWidth = 4;
            ctx.shadowColor = l.glow;
            ctx.shadowBlur = 16;
            ctx.beginPath();
            ctx.moveTo(lx, ly);
            ctx.lineTo(lx - dirX * tailLength, ly - dirY * tailLength);
            ctx.stroke();

            // หัวกระสุนเลเซอร์
            ctx.fillStyle = l.color;
            ctx.beginPath();
            ctx.arc(lx, ly, l.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = (l.radius * 0.9) + 'px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(l.icon, lx, ly);
            ctx.restore();
        }

        // วาดโล่สะท้อนแสง 2 ข้าง (Left & Right Shields)
        var shields = [
            { s: ST.leftShield, label: 'L SHIELD', color: '#38bdf8' },
            { s: ST.rightShield, label: 'R SHIELD', color: '#facc15' }
        ];

        for (var sh = 0; sh < shields.length; sh++) {
            var item = shields[sh];
            var sx = item.s.x * W;
            var sy = item.s.y * H;

            ctx.save();
            ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
            ctx.strokeStyle = item.color;
            ctx.lineWidth = 3;
            ctx.shadowColor = item.color;
            ctx.shadowBlur = 18;

            ctx.beginPath();
            ctx.arc(sx, sy, CFG.STAGE2.SHIELD_RADIUS, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(sx, sy, CFG.STAGE2.SHIELD_RADIUS * 0.65, 0, Math.PI * 2);
            ctx.stroke();

            ctx.font = 'bold 11px Sarabun, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, sx, sy + 4);
            ctx.restore();
        }
    }

    function renderStage3() {
        for (var i = 0; i < ST.stage3Targets.length; i++) {
            var t = ST.stage3Targets[i];
            var px = t.x * W;
            var py = t.y * H;

            var vlen = Math.sqrt(t.vx * t.vx + t.vy * t.vy) || 0.001;
            var dirX = t.vx / vlen;
            var dirY = t.vy / vlen;

            ctx.save();
            ctx.translate(px, py);

            // เปลวหางอวกาศ (วาดก่อน rotate เพื่อให้ทิศทางตรงกับเวกเตอร์การเคลื่อนที่จริง)
            ctx.strokeStyle = t.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-dirX * 36, -dirY * 36);
            ctx.stroke();

            ctx.rotate(t.angle);

            // ออร่าเรืองแสง
            ctx.fillStyle = t.color;
            ctx.shadowColor = t.color;
            ctx.shadowBlur = 16;
            ctx.beginPath();
            ctx.arc(0, 0, t.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.font = (t.radius * 0.95) + 'px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(t.icon, 0, 0);

            ctx.font = 'bold 12px Sarabun, sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 4;
            ctx.fillText(t.name, 0, t.radius + 14);

            if (t.sub) {
                ctx.font = 'bold 10px Sarabun, sans-serif';
                ctx.fillStyle = t.isBonus ? '#fde047' : '#cbd5e1';
                ctx.fillText(t.sub, 0, t.radius + 26);
            }

            ctx.restore();
        }
    }

    // ── Flow การเริ่มเล่น & เปลี่ยน Stage ──
    function startMission(isVersus) {
        KAMPAI.sound.unlock();
        KAMPAI.sound.bgmStart();
        if (KAMPAI.beginRound) KAMPAI.beginRound();

        ST.score = 0;
        ST.stage = 1;
        ST.stageScores = [0, 0, 0];
        ST.lives = CFG.LIVES_MAX;
        ST.combo = 0;
        ST.maxCombo = 0;
        ST.correctCount = 0;
        ST.wrongCount = 0;
        ST.stage1WaveIdx = 0;
        ST.stage1Items = [];
        ST.lasers = [];
        ST.stage3Targets = [];
        ST.solarCores.forEach(function (c) { c.energy = 0; });

        showScreen('gameScreen');
        briefStage(1);
    }

    function briefStage(stageNum) {
        ST.stage = stageNum;
        ST.state = 'stage_brief';
        ST.stage1Items = [];
        ST.lasers = [];
        ST.stage3Targets = [];

        var info = DATA.STAGES[stageNum - 1];

        var modal = $('stageModal');
        var iconEl = $('stageModalIcon');
        var titleEl = $('stageModalTitle');
        var subEl = $('stageModalSub');
        var descEl = $('stageModalDesc');
        var countEl = $('stageCountdownNum');

        if (iconEl) iconEl.innerText = info.icon;
        if (titleEl) titleEl.innerText = info.title;
        if (subEl) subEl.innerText = info.subtitle;
        if (descEl) descEl.innerText = info.desc;
        if (modal) modal.classList.add('active');

        if (KAMPAI.sound.stopSpeak) KAMPAI.sound.stopSpeak();
        KAMPAI.sound.speak(info.speech, 'th-TH');

        var count = 3;
        if (countEl) countEl.innerText = count;

        clearInterval(ST.briefingTimer);
        ST.briefingTimer = setInterval(function () {
            count--;
            if (countEl) countEl.innerText = count > 0 ? count : 'GO!';
            if (count <= 0) {
                clearInterval(ST.briefingTimer);
                launchStage();
            }
        }, 1000);
    }

    function launchStage() {
        var modal = $('stageModal');
        if (modal) modal.classList.remove('active');

        ST.state = 'playing';
        ST.stageTimer = CFG.STAGE_DURATION;
        updateHUD();

        clearInterval(ST.spawnTimer);
        clearInterval(ST.clockTimer);

        if (ST.stage === 1) {
            spawnStage1Item();
            ST.spawnTimer = setInterval(spawnStage1Item, CFG.STAGE1.SPAWN_INTERVAL_MS);
        } else if (ST.stage === 2) {
            spawnStage2Laser();
            ST.spawnTimer = setInterval(spawnStage2Laser, CFG.STAGE2.SPAWN_INTERVAL_MS);
        } else if (ST.stage === 3) {
            spawnStage3Target();
            ST.spawnTimer = setInterval(spawnStage3Target, CFG.STAGE3.SPAWN_INTERVAL_MS);
        }

        ST.clockTimer = setInterval(function () {
            if (ST.state !== 'playing') return;

            if (ST.stage === 1) {
                var waveInterval = Math.floor(CFG.STAGE_DURATION / 3);
                var newWave = Math.min(2, Math.floor((CFG.STAGE_DURATION - ST.stageTimer) / waveInterval));
                if (newWave !== ST.stage1WaveIdx) {
                    ST.stage1WaveIdx = newWave;
                    var waveObj = DATA.STAGE1_WAVES[newWave];
                    if (waveObj) {
                        if (KAMPAI.sound.stopSpeak) KAMPAI.sound.stopSpeak();
                        KAMPAI.sound.speak(waveObj.speechPrompt, 'th-TH');
                        spawnFloatingText('🎯 ' + waveObj.taskPrompt, W / 2, H / 2 - 40, '#38bdf8');
                    }
                }
            }

            ST.stageTimer--;
            updateHUD();

            if (ST.stageTimer <= 0) {
                clearInterval(ST.spawnTimer);
                clearInterval(ST.clockTimer);
                if (ST.stage < CFG.TOTAL_STAGES) {
                    briefStage(ST.stage + 1);
                } else {
                    finishMission();
                }
            }
        }, 1000);
    }

    function finishMission() {
        cleanupAll();
        ST.state = 'gameover';

        KAMPAI.sound.bgmStop();
        KAMPAI.sound.gameOver();

        var stars = '⭐⭐⭐';
        var medal = '🥇 เหรียญทอง — ปรมาจารย์แล็บวิทยาศาสตร์ (Master Scientist)';
        if (ST.score < CFG.MEDAL_BRONZE_SCORE) {
            stars = '⭐☆☆';
            medal = '🥉 เหรียญทองแดง — นักวิจัยรุ่นเยาว์ (Junior Explorer)';
        } else if (ST.score < CFG.MEDAL_GOLD_SCORE) {
            stars = '⭐⭐☆';
            medal = '🥈 เหรียญเงิน — นักวิทยาศาสตร์ดีเด่น (Senior Researcher)';
        }

        var starsEl = $('go-stars');
        var finalScoreEl = $('final-score');
        var finalDetailEl = $('final-detail');
        var s1El = $('stage1Score');
        var s2El = $('stage2Score');
        var s3El = $('stage3Score');

        if (starsEl) starsEl.innerText = stars;
        if (finalScoreEl) finalScoreEl.innerText = ST.score;
        if (finalDetailEl) {
            finalDetailEl.innerHTML = medal + '<br>ถูกต้อง ' + ST.correctCount + ' ครั้ง · คอมโบสูงสุด x' + ST.maxCombo;
        }

        if (s1El) s1El.innerText = ST.stageScores[0];
        if (s2El) s2El.innerText = ST.stageScores[1];
        if (s3El) s3El.innerText = ST.stageScores[2];

        showScreen('resultScreen');

        KAMPAI.submitScore(ST.score, {
            mode: (hands && hands.mode === 'camera') ? 'ar_camera' : 'touch_fallback',
            stageScores: ST.stageScores,
            correctCount: ST.correctCount,
            wrongCount: ST.wrongCount,
            maxCombo: ST.maxCombo
        });

        if (vs && vs.report) {
            vs.report(ST.score, { correct: ST.correctCount });
            vs.finish();
        }
    }

    function cleanupAll() {
        clearInterval(ST.spawnTimer);
        clearInterval(ST.clockTimer);
        clearInterval(ST.briefingTimer);
        if (KAMPAI.sound.stopSpeak) KAMPAI.sound.stopSpeak();
        var modal = $('stageModal');
        if (modal) modal.classList.remove('active');
    }

    // ── Button Event Listeners ──
    var startBtn = $('startBtn');
    if (startBtn) {
        startBtn.onclick = function () {
            startHandTracking().then(function () {
                startMission(false);
            });
        };
    }

    var onlineBtn = $('onlineBtn');
    if (onlineBtn) {
        if (vs && vs.available) {
            onlineBtn.style.display = 'inline-flex';
            onlineBtn.onclick = function () {
                vs.openMenu();
            };
        }
    }

    var stageReadyBtn = $('stageReadyBtn');
    if (stageReadyBtn) {
        stageReadyBtn.onclick = function () {
            clearInterval(ST.briefingTimer);
            launchStage();
        };
    }

    var quitBtn = $('quitBtn');
    if (quitBtn) {
        quitBtn.onclick = function () {
            cleanupAll();
            stopHandTracking();
            KAMPAI.sound.bgmStop();
            KAMPAI.goHome();
        };
    }

    var restartBtn = $('restartBtn');
    if (restartBtn) {
        restartBtn.onclick = function () {
            startHandTracking().then(function () {
                startMission(false);
            });
        };
    }

    var homeBtn = $('homeBtn');
    if (homeBtn) {
        homeBtn.onclick = function () {
            cleanupAll();
            stopHandTracking();
            KAMPAI.sound.bgmStop();
            KAMPAI.goHome();
        };
    }

    // ── Unified Smooth Game Loop ──
    var lastTime = performance.now();
    function gameLoop(now) {
        var dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;

        if (ST.state === 'playing') {
            if (ST.stage === 1) updateStage1(dt);
            else if (ST.stage === 2) updateStage2(dt);
            else if (ST.stage === 3) updateStage3(dt);
        }

        render(dt);
        ST.rafId = requestAnimationFrame(gameLoop);
    }
    ST.rafId = requestAnimationFrame(gameLoop);

    window.addEventListener('beforeunload', function () {
        cleanupAll();
        stopHandTracking();
        if (ST.rafId) cancelAnimationFrame(ST.rafId);
    });
})();
