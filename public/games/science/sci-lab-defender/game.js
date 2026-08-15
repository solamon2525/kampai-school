/* game.js — ลอจิกเกม Sci-Lab Defender AR (KAMPAI SDK + KampaiHands) */
(function () {
    'use strict';
    var CFG = window.GAME_CONFIG, DATA = window.GAME_DATA;
    var $ = function (id) { return document.getElementById(id); };

    // ── กำหนดค่า SDK ──
    KAMPAI.setSlug(CFG.SLUG);
    KAMPAI.sound.mountToggles();
    KAMPAI.sound.defaultBgm(CFG.BGM || 'cheerful');

    // ── ตัวแปร Canvas และลูปเกม ──
    var canvas, ctx;
    var rafId = null;
    var gameState = 'start'; // 'start' | 'playing' | 'transition' | 'gameover'
    var currentStage = 1;    // 1: เคมี | 2: แสงเลเซอร์ | 3: อวกาศ
    var stageTimeLeft = CFG.STAGE_DURATION;
    var score = 0;
    var combo = 0;
    var correctHits = 0;
    var wrongHits = 0;
    var mainTimer = null;
    var playerName = 'นักวิทย์น้อย';
    var hands = null;
    var fallbackPointer = { x: 0.5, y: 0.5, active: false, down: false };

    // ── อ็อบเจกต์ในแต่ละสเตจ ──
    var stage1State = { goalIndex: 0, collected: 0, items: [], spawnTimer: null };
    var stage2State = { levelIndex: 0, chargedTime: 0, maxCharge: 3.0, beamSegments: [], laserActive: true };
    var stage3State = { targets: [], spawnTimer: null };
    var particles = [];
    var scorePopups = [];

    // ── Versus Mode ──
    var vs = window.KampaiVersus ? KampaiVersus.create({
        duration: CFG.GAME_DURATION,
        title: 'Sci-Lab Defender AR',
        rankBy: 'score',
        onPlay: function () {
            startGame();
        },
        onEnd: function () {
            endGame();
        }
    }) : null;

    // ── ผู้เล่นและลีดเดอร์บอร์ด ──
    function renderPlayer() {
        var s = KAMPAI.student, stt = KAMPAI.stats, chip = $('player-chip');
        if (!s || !chip) return;
        var av = s.photoUrl ? '<img src="' + s.photoUrl + '" alt="">' : '<div class="ini">' + ((s.displayName || '?')[0]) + '</div>';
        var best = stt ? ' · <b style="color:#facc15">สถิติสูงสุด ' + (stt.personalBest || 0) + '</b>' : '';
        chip.innerHTML = av + '<span>' + s.displayName + best + '</span>';
        chip.style.display = 'flex';
        playerName = s.displayName || 'นักวิทย์น้อย';
    }

    function renderLeaderboard() {
        var rows = KAMPAI.leaderboard || [];
        var box = $('lbBox'), list = $('lbList');
        var boxEnd = $('lbBoxEnd'), listEnd = $('lbListEnd');
        if (!rows.length) {
            if (box) box.style.display = 'none';
            if (boxEnd) boxEnd.style.display = 'none';
            return;
        }
        var medals = ['🥇', '🥈', '🥉'];
        var html = rows.slice(0, 5).map(function (r, idx) {
            return '<li class="' + (r.isMe ? 'me' : '') + '">' +
                '<span class="lb-rank">' + (medals[idx] || '#' + (idx + 1)) + '</span>' +
                '<span class="lb-name">' + escapeHtml(r.displayName) + (r.isMe ? ' (คุณ)' : '') + '</span>' +
                '<span class="lb-score">' + (r.personalBest || 0) + '</span></li>';
        }).join('');
        if (list) list.innerHTML = html;
        if (box) box.style.display = 'block';
        if (listEnd) listEnd.innerHTML = html;
        if (boxEnd) boxEnd.style.display = 'block';
    }

    function escapeHtml(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, function (m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
        });
    }

    KAMPAI.onReady(function () {
        renderPlayer();
        renderLeaderboard();
    });

    // ── จัดการหน้าจอ (Screen Controller) ──
    function showScreen(screenId) {
        ['startScreen', 'gameScreen', 'resultScreen'].forEach(function (id) {
            var el = $(id);
            if (!el) return;
            el.classList.toggle('active', id === screenId);
        });
    }

    // ── KampaiHands Engine Controller ──
    function buildHands() {
        return KampaiHands.create({
            video: '#arVideo',
            hands: CFG.HANDS,
            getCanvasSize: function () {
                return canvas ? { w: canvas.width, h: canvas.height } : null;
            },
            onStatus: function (status) {
                var tag = $('status-tag');
                if (!tag) return;
                if (status === 'camera-on') {
                    tag.innerHTML = '📷 ตรวจจับมือพร้อมใช้งาน';
                    tag.style.color = '#4ade80';
                } else if (status === 'no-camera') {
                    tag.innerHTML = '📱 โหมดสัมผัส/คลิก (ไม่มีกล้อง)';
                    tag.style.color = '#fbbf24';
                }
            }
        });
    }

    function startHandTracking() {
        stopHandTracking();
        hands = buildHands();
        return hands.start().catch(function () {
            var tag = $('status-tag');
            if (tag) {
                tag.innerHTML = '📱 โหมดสัมผัส/คลิก (แตะบนจอเพื่อเล่น)';
                tag.style.color = '#fbbf24';
            }
        });
    }

    function stopHandTracking() {
        if (hands) {
            hands.stop();
            hands = null;
        }
    }

    // ── เริ่มต้นและล้างข้อมูลสเตจ ──
    function initStage1() {
        stage1State.goalIndex = 0;
        stage1State.collected = 0;
        stage1State.items = [];
        updateHUD();
        if (stage1State.spawnTimer) clearInterval(stage1State.spawnTimer);
        stage1State.spawnTimer = setInterval(spawnStage1Item, 900);
    }

    function spawnStage1Item() {
        if (gameState !== 'playing' || currentStage !== 1) return;
        var itemList = DATA.stage1.items;
        var itemData = itemList[Math.floor(Math.random() * itemList.length)];
        stage1State.items.push({
            data: itemData,
            x: 0.15 + Math.random() * 0.7,
            y: -0.08,
            speed: 0.0035 + Math.random() * 0.0025,
            radius: 0.055,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 0.04
        });
    }

    function initStage2() {
        stage2State.levelIndex = 0;
        stage2State.chargedTime = 0;
        stage2State.beamSegments = [];
        if (stage1State.spawnTimer) clearInterval(stage1State.spawnTimer);
        updateHUD();
    }

    function initStage3() {
        stage3State.targets = [];
        if (stage3State.spawnTimer) clearInterval(stage3State.spawnTimer);
        stage3State.spawnTimer = setInterval(spawnStage3Target, 750);
        updateHUD();
    }

    function spawnStage3Target() {
        if (gameState !== 'playing' || currentStage !== 3) return;
        var targetList = DATA.stage3.targets;
        var targetDef = targetList[Math.floor(Math.random() * targetList.length)];
        var fromSide = Math.random() > 0.5;
        stage3State.targets.push({
            def: targetDef,
            x: fromSide ? (Math.random() > 0.5 ? -0.05 : 1.05) : (0.1 + Math.random() * 0.8),
            y: fromSide ? (0.15 + Math.random() * 0.6) : -0.08,
            vx: fromSide ? ((Math.random() * 0.004 + 0.002) * (Math.random() > 0.5 ? 1 : -1)) : ((Math.random() - 0.5) * 0.003),
            vy: fromSide ? ((Math.random() - 0.5) * 0.002) : (0.004 + Math.random() * 0.003),
            radius: targetDef.radius || 0.06,
            rotation: 0,
            rotSpeed: (Math.random() - 0.5) * 0.05,
            scale: 0.8 + Math.random() * 0.4
        });
    }

    // ── เริ่มและจบเกม ──
    function startGame() {
        score = 0;
        combo = 0;
        correctHits = 0;
        wrongHits = 0;
        currentStage = 1;
        stageTimeLeft = CFG.STAGE_DURATION;
        gameState = 'playing';

        showScreen('gameScreen');
        initStage1();

        KAMPAI.sound.unlock();
        KAMPAI.sound.bgmStart();

        if (mainTimer) clearInterval(mainTimer);
        mainTimer = setInterval(tickTimer, 1000);

        startHandTracking();
        if (!rafId) requestAnimationFrame(gameLoop);
    }

    function tickTimer() {
        if (gameState !== 'playing') return;
        stageTimeLeft--;
        $('timerPill').innerText = '⏱ ' + stageTimeLeft;

        if (stageTimeLeft <= 0) {
            advanceStage();
        }
    }

    function advanceStage() {
        if (currentStage === 1) {
            showTransition(
                '🧪 ฐานที่ 1 ผ่านแล้ว!',
                'ยินดีด้วย! คุณคัดแยกสสารได้ถูกต้อง',
                DATA.stage2.facts[Math.floor(Math.random() * DATA.stage2.facts.length)],
                function () {
                    currentStage = 2;
                    stageTimeLeft = CFG.STAGE_DURATION;
                    initStage2();
                }
            );
        } else if (currentStage === 2) {
            showTransition(
                '⚡ ฐานที่ 2 สำเร็จ!',
                'ระบบพลังงานแสงชาร์จเต็ม 100%!',
                DATA.stage3.knowledge[Math.floor(Math.random() * DATA.stage3.knowledge.length)],
                function () {
                    currentStage = 3;
                    stageTimeLeft = CFG.STAGE_DURATION;
                    initStage3();
                }
            );
        } else {
            endGame();
        }
    }

    function showTransition(title, desc, fact, callback) {
        gameState = 'transition';
        var overlay = $('transitionOverlay');
        $('transTitle').innerText = title;
        $('transDesc').innerText = desc;
        $('transFact').innerText = '💡 ' + fact;
        overlay.classList.add('active');
        KAMPAI.sound.correct();
        addScore(CFG.POINTS_STAGE_CLEAR, canvas.width / 2, canvas.height / 2, 'STAGE CLEAR! +' + CFG.POINTS_STAGE_CLEAR);

        setTimeout(function () {
            overlay.classList.remove('active');
            if (callback) callback();
            gameState = 'playing';
        }, 2400);
    }

    function endGame() {
        gameState = 'gameover';
        if (mainTimer) clearInterval(mainTimer);
        if (stage1State.spawnTimer) clearInterval(stage1State.spawnTimer);
        if (stage3State.spawnTimer) clearInterval(stage3State.spawnTimer);
        stopHandTracking();

        KAMPAI.sound.bgmStop();
        KAMPAI.sound.gameOver();

        $('final-score').innerText = score;
        var stars = '⭐⭐⭐';
        if (score < 100) stars = '⭐☆☆';
        else if (score < 200) stars = '⭐⭐☆';
        $('go-stars').innerText = stars;

        $('final-detail').innerText = 'ถูกต้อง: ' + correctHits + ' ครั้ง · โดนสิ่งกีดขวาง: ' + wrongHits + ' ครั้ง';

        showScreen('resultScreen');

        // ส่งคะแนนเข้าระบบพอร์ทัล
        KAMPAI.submitScore(score, {
            correct: correctHits,
            wrong: wrongHits,
            stagesCompleted: currentStage
        });

        if (vs && vs.report) {
            vs.report(score, { correct: correctHits });
            vs.finish();
        }
    }

    // ── คะแนนและคอมโบ ──
    function addScore(pts, x, y, customText) {
        score = Math.max(0, score + pts);
        $('scorePill').innerText = '⭐ ' + score;

        var popText = customText || (pts > 0 ? '+' + pts : '' + pts);
        var color = pts > 0 ? '#facc15' : '#f87171';
        spawnScorePopup(popText, x, y, color);

        if (pts > 0) {
            combo++;
            correctHits++;
            if (combo >= 3) {
                var cp = $('comboPill');
                cp.innerText = '🔥 COMBO x' + combo;
                cp.style.display = 'block';
            }
        } else {
            combo = 0;
            wrongHits++;
            $('comboPill').style.display = 'none';
        }
    }

    function spawnScorePopup(text, x, y, color) {
        scorePopups.push({
            text: text,
            x: x,
            y: y,
            color: color,
            alpha: 1.0,
            vy: -1.8
        });
    }

    function addParticles(x, y, color, count) {
        count = count || 12;
        for (var i = 0; i < count; i++) {
            var angle = Math.random() * Math.PI * 2;
            var spd = 2 + Math.random() * 4;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * spd,
                vy: Math.sin(angle) * spd,
                color: color || '#38bdf8',
                radius: 3 + Math.random() * 4,
                alpha: 1.0,
                decay: 0.02 + Math.random() * 0.03
            });
        }
    }

    function updateHUD() {
        if (currentStage === 1) {
            $('stageBadge').innerText = DATA.stage1.title;
            var goal = DATA.stage1.goals[stage1State.goalIndex];
            $('goalBanner').innerText = '🎯 ' + goal.name + ' ' + stage1State.collected + '/' + goal.targetCount;
        } else if (currentStage === 2) {
            $('stageBadge').innerText = DATA.stage2.title;
            var lvl = DATA.stage2.levels[stage2State.levelIndex];
            var pct = Math.floor((stage2State.chargedTime / stage2State.maxCharge) * 100);
            $('goalBanner').innerText = '⚡ สะท้อนเลเซอร์ชาร์จ: ' + lvl.targetName + ' (' + pct + '%)';
        } else if (currentStage === 3) {
            $('stageBadge').innerText = DATA.stage3.title;
            $('goalBanner').innerText = '☄️ Fever Time! ใช้นิ้วชี้จิ้มทำลายอุกกาบาตและไวรัส!';
        }
        $('timerPill').innerText = '⏱ ' + stageTimeLeft;
        $('scorePill').innerText = '⭐ ' + score;
    }

    // ── ลูปประมวลผลและวาด Canvas (Game Loop) ──
    function gameLoop() {
        if (!canvas || !ctx) {
            rafId = requestAnimationFrame(gameLoop);
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // ดึงพิกัดมือจาก KampaiHands
        var pointers = [];
        if (hands && hands.mode === 'camera') {
            if (hands.leftHand && hands.leftHand.active) {
                pointers.push({ x: hands.leftPointer.x, y: hands.leftPointer.y, hand: 'left', normX: hands.leftHand.x, normY: hands.leftHand.y });
            }
            if (hands.rightHand && hands.rightHand.active) {
                pointers.push({ x: hands.rightPointer.x, y: hands.rightPointer.y, hand: 'right', normX: hands.rightHand.x, normY: hands.rightHand.y });
            }
            // วาด Skeleton โครงกระดูกมือ
            if (hands.leftLandmarks) hands.drawSkeleton(ctx, hands.leftLandmarks, '#38bdf8', 'ซ้าย');
            if (hands.rightLandmarks) hands.drawSkeleton(ctx, hands.rightLandmarks, '#a855f7', 'ขวา');
        }

        // หากไม่มีกล้องหรือไม่มีมือในเฟรม ให้ใช้ Mouse/Touch Fallback
        if (pointers.length === 0 && fallbackPointer.active) {
            pointers.push({
                x: fallbackPointer.x * canvas.width,
                y: fallbackPointer.y * canvas.height,
                hand: 'touch',
                normX: fallbackPointer.x,
                normY: fallbackPointer.y
            });
        }

        // อัปเดตตามสเตจ
        if (gameState === 'playing') {
            if (currentStage === 1) {
                renderStage1(pointers);
            } else if (currentStage === 2) {
                renderStage2(pointers);
            } else if (currentStage === 3) {
                renderStage3(pointers);
            }
        }

        // วาด Particles & Score Popups
        renderFX();

        rafId = requestAnimationFrame(gameLoop);
    }

    // ── STAGE 1 RENDER (เคมี & สสาร) ──
    function renderStage1(pointers) {
        var W = canvas.width, H = canvas.height;
        var currentGoal = DATA.stage1.goals[stage1State.goalIndex];

        // วาดบีกเกอร์ที่มือของผู้เล่น
        pointers.forEach(function (ptr) {
            ctx.save();
            ctx.translate(ptr.x, ptr.y);
            // วาดบีกเกอร์เรืองแสง
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 15;
            ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
            ctx.strokeStyle = '#38bdf8';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(-28, -20);
            ctx.lineTo(-24, 30);
            ctx.arcTo(0, 36, 24, 30, 8);
            ctx.lineTo(24, 30);
            ctx.lineTo(28, -20);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            // ของเหลวในบีกเกอร์
            ctx.fillStyle = '#38bdf8';
            ctx.beginPath();
            ctx.moveTo(-20, 10);
            ctx.lineTo(-24, 30);
            ctx.lineTo(24, 30);
            ctx.lineTo(20, 10);
            ctx.closePath();
            ctx.fill();

            // ไอคอนขวดบีกเกอร์
            ctx.font = '20px Kanit';
            ctx.textAlign = 'center';
            ctx.fillText('🧪', 0, 8);
            ctx.restore();
        });

        // เลื่อนและวาดไอเทมสสาร
        for (var i = stage1State.items.length - 1; i >= 0; i--) {
            var item = stage1State.items[i];
            item.y += item.speed;
            item.rotation += item.rotSpeed;

            var ix = item.x * W;
            var iy = item.y * H;
            var r = item.radius * W;

            ctx.save();
            ctx.translate(ix, iy);
            ctx.rotate(item.rotation);

            // ฟองอากาศ/วงแหวนรอบสสาร
            ctx.shadowColor = item.data.color || '#fff';
            ctx.shadowBlur = 10;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.strokeStyle = item.data.color || '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, r, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // ไอคอนและชื่อสสาร
            ctx.font = (r * 0.9) + 'px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(item.data.icon, 0, -4);

            ctx.font = 'bold 12px Kanit';
            ctx.fillStyle = '#ffffff';
            ctx.fillText(item.data.name, 0, r + 14);
            ctx.restore();

            // ตรวจสอบการชนกับบีกเกอร์ที่มือผู้เล่น
            var hit = false;
            pointers.forEach(function (ptr) {
                var dx = ptr.x - ix;
                var dy = ptr.y - iy;
                var dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < r + 35) {
                    hit = true;
                }
            });

            if (hit) {
                if (item.data.state === currentGoal.type) {
                    // ตอบถูก!
                    KAMPAI.sound.correct();
                    addScore(CFG.POINTS_CORRECT, ix, iy, '+10 ' + item.data.name);
                    addParticles(ix, iy, item.data.color, 16);
                    stage1State.collected++;
                    if (stage1State.collected >= currentGoal.targetCount) {
                        stage1State.goalIndex = (stage1State.goalIndex + 1) % DATA.stage1.goals.length;
                        stage1State.collected = 0;
                        KAMPAI.sound.fxFlash();
                    }
                    updateHUD();
                } else {
                    // ตอบผิด/โดนสารพิษ
                    KAMPAI.sound.wrong();
                    addScore(CFG.POINTS_WRONG, ix, iy, item.data.penalty ? '☠️ สารพิษ! -5' : '❌ ผิดสถานะ! -5');
                    addParticles(ix, iy, '#ef4444', 12);
                }
                stage1State.items.splice(i, 1);
                continue;
            }

            // ตกพ้นจอ
            if (item.y > 1.1) {
                stage1State.items.splice(i, 1);
            }
        }
    }

    // ── STAGE 2 RENDER (สะท้อนแสงเลเซอร์ & พลังงาน) ──
    function renderStage2(pointers) {
        var W = canvas.width, H = canvas.height;
        var lvl = DATA.stage2.levels[stage2State.levelIndex];

        var srcX = lvl.sourcePos.x * W;
        var srcY = lvl.sourcePos.y * H;
        var tgtX = lvl.targetPos.x * W;
        var tgtY = lvl.targetPos.y * H;

        // 1. วาดแหล่งกำเนิดแสงเลเซอร์ (Source)
        ctx.save();
        ctx.shadowColor = lvl.targetColor;
        ctx.shadowBlur = 15;
        ctx.fillStyle = '#1e293b';
        ctx.strokeStyle = lvl.targetColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(srcX, srcY, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('🔦', srcX, srcY);
        ctx.restore();

        // 2. วาดแท่นรับพลังงาน / โซลาร์เซลล์ (Target)
        ctx.save();
        ctx.shadowColor = lvl.targetColor;
        ctx.shadowBlur = 20;
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.strokeStyle = lvl.targetColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(tgtX, tgtY, 32, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // วาดเกจวงแหวนชาร์จ
        var chargeRatio = Math.min(1, stage2State.chargedTime / stage2State.maxCharge);
        ctx.strokeStyle = '#facc15';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(tgtX, tgtY, 38, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * chargeRatio));
        ctx.stroke();

        ctx.font = '24px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('☀️', tgtX, tgtY);
        ctx.restore();

        // 3. วาดกระจกเงาสะท้อนแสงที่มือทั้ง 2 ข้าง
        var mirrors = [];
        pointers.forEach(function (ptr, idx) {
            ctx.save();
            ctx.translate(ptr.x, ptr.y);
            ctx.shadowColor = '#ffffff';
            ctx.shadowBlur = 12;
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            // แผ่นกระจกเงาสะท้อนแสง
            ctx.beginPath();
            ctx.roundRect(-40, -8, 80, 16, 8);
            ctx.fill();
            ctx.stroke();

            ctx.font = 'bold 12px Kanit';
            ctx.fillStyle = '#38bdf8';
            ctx.textAlign = 'center';
            ctx.fillText('🪞 กระจกมือ ' + (ptr.hand === 'left' ? 'ซ้าย' : ptr.hand === 'right' ? 'ขวา' : ''), 0, -14);
            ctx.restore();

            mirrors.push({ x: ptr.x, y: ptr.y, width: 80, height: 20 });
        });

        // 4. คำนวณเส้นทางลำแสงเลเซอร์ (Raycasting)
        var rayPoints = [{ x: srcX, y: srcY }];
        var curX = srcX, curY = srcY;
        var angle = Math.atan2(H * 0.5 - srcY, W * 0.5 - srcX);
        if (lvl.sourcePos.x > 0.5) angle = Math.PI - 0.2;

        var maxBounces = 2;
        var hitTarget = false;

        for (var b = 0; b < maxBounces; b++) {
            // ยิงลำแสงไปข้างหน้า
            var nextX = curX + Math.cos(angle) * 1200;
            var nextY = curY + Math.sin(angle) * 1200;

            // ตรวจสอบการชนกระจก
            var nearestHit = null;
            var hitDist = 999999;
            var hitMirror = null;

            for (var m = 0; m < mirrors.length; m++) {
                var mir = mirrors[m];
                var dx = mir.x - curX, dy = mir.y - curY;
                var dot = (dx * Math.cos(angle) + dy * Math.sin(angle));
                if (dot > 20) {
                    var projX = curX + Math.cos(angle) * dot;
                    var projY = curY + Math.sin(angle) * dot;
                    var dToMir = Math.hypot(projX - mir.x, projY - mir.y);
                    if (dToMir < mir.width / 2 + 15 && dot < hitDist) {
                        hitDist = dot;
                        nearestHit = { x: projX, y: projY };
                        hitMirror = mir;
                    }
                }
            }

            if (nearestHit) {
                rayPoints.push(nearestHit);
                curX = nearestHit.x;
                curY = nearestHit.y;
                // สะท้อนแสงตามมุมตกกระทบ = มุมสะท้อน
                angle = -angle + (Math.PI * 0.1);
                addParticles(curX, curY, '#ffffff', 2);
            } else {
                rayPoints.push({ x: nextX, y: nextY });
                break;
            }
        }

        // ตรวจสอบว่าแสงไปถึงเป้าหมายหรือไม่
        for (var p = 0; p < rayPoints.length - 1; p++) {
            var p1 = rayPoints[p], p2 = rayPoints[p + 1];
            var dTarget = distToSegment({ x: tgtX, y: tgtY }, p1, p2);
            if (dTarget < 45) {
                hitTarget = true;
                break;
            }
        }

        // วาดลำแสงเลเซอร์เรืองแสง
        ctx.save();
        ctx.shadowColor = hitTarget ? '#facc15' : lvl.targetColor;
        ctx.shadowBlur = hitTarget ? 25 : 12;
        ctx.strokeStyle = hitTarget ? '#fef08a' : lvl.targetColor;
        ctx.lineWidth = hitTarget ? 8 : 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(rayPoints[0].x, rayPoints[0].y);
        for (var rIdx = 1; rIdx < rayPoints.length; rIdx++) {
            ctx.lineTo(rayPoints[rIdx].x, rayPoints[rIdx].y);
        }
        ctx.stroke();
        ctx.restore();

        // สะสมพลังงานเมื่อแสงเชื่อมต่อ
        if (hitTarget) {
            stage2State.chargedTime += 0.033;
            addParticles(tgtX, tgtY, '#facc15', 3);
            if (stage2State.chargedTime >= stage2State.maxCharge) {
                KAMPAI.sound.correct();
                addScore(30, tgtX, tgtY, '⚡ CHARGED! +30');
                stage2State.levelIndex = (stage2State.levelIndex + 1) % DATA.stage2.levels.length;
                stage2State.chargedTime = 0;
                updateHUD();
            }
        }
    }

    function distToSegment(p, v, w) {
        var l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
        if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
        var t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y)));
    }

    // ── STAGE 3 RENDER (อวกาศ & ระเบิดอุกกาบาต FEVER) ──
    function renderStage3(pointers) {
        var W = canvas.width, H = canvas.height;

        // วาดตัวชี้ปลายนิ้วเล็งเป้า
        pointers.forEach(function (ptr) {
            ctx.save();
            ctx.translate(ptr.x, ptr.y);
            ctx.shadowColor = '#ec4899';
            ctx.shadowBlur = 15;
            ctx.strokeStyle = '#ec4899';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, 26, 0, Math.PI * 2);
            ctx.stroke();
            // เส้น Crosshair เล็ง
            ctx.beginPath();
            ctx.moveTo(-34, 0); ctx.lineTo(34, 0);
            ctx.moveTo(0, -34); ctx.lineTo(0, 34);
            ctx.stroke();
            ctx.restore();
        });

        // เลื่อนและวาดอุกกาบาต/ดาวเคราะห์
        for (var i = stage3State.targets.length - 1; i >= 0; i--) {
            var tgt = stage3State.targets[i];
            tgt.x += tgt.vx;
            tgt.y += tgt.vy;
            tgt.rotation += tgt.rotSpeed;

            var tx = tgt.x * W;
            var ty = tgt.y * H;
            var tr = tgt.radius * W;

            ctx.save();
            ctx.translate(tx, ty);
            ctx.rotate(tgt.rotation);
            ctx.shadowColor = tgt.def.isBonus ? '#facc15' : '#f97316';
            ctx.shadowBlur = 15;

            // วาดไอคอนอวกาศ
            ctx.font = (tr * 1.3) + 'px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(tgt.def.icon, 0, 0);

            ctx.font = 'bold 12px Kanit';
            ctx.fillStyle = tgt.def.isBonus ? '#facc15' : '#e2e8f0';
            ctx.fillText(tgt.def.name, 0, tr + 12);
            ctx.restore();

            // ตรวจสอบการจิ้มทำลายด้วยปลายนิ้ว
            var hit = false;
            pointers.forEach(function (ptr) {
                var dx = ptr.x - tx;
                var dy = ptr.y - ty;
                if (Math.hypot(dx, dy) < tr + 28) {
                    hit = true;
                }
            });

            if (hit) {
                KAMPAI.sound.correct();
                var pts = tgt.def.points || 10;
                addScore(pts, tx, ty, '+' + pts + ' ' + tgt.def.name);
                addParticles(tx, ty, tgt.def.isBonus ? '#facc15' : '#f97316', 20);
                stage3State.targets.splice(i, 1);
                continue;
            }

            // หลุดนอกจอ
            if (tgt.x < -0.15 || tgt.x > 1.15 || tgt.y < -0.15 || tgt.y > 1.15) {
                stage3State.targets.splice(i, 1);
            }
        }
    }

    // ── วาดเอฟเฟกต์ (Particles & Text Popups) ──
    function renderFX() {
        // วาด Particles
        for (var i = particles.length - 1; i >= 0; i--) {
            var p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                particles.splice(i, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        // วาด Popups คะแนน
        for (var j = scorePopups.length - 1; j >= 0; j--) {
            var pop = scorePopups[j];
            pop.y += pop.vy;
            pop.alpha -= 0.025;

            if (pop.alpha <= 0) {
                scorePopups.splice(j, 1);
                continue;
            }

            ctx.save();
            ctx.globalAlpha = pop.alpha;
            ctx.font = 'bold 22px "Fredoka One", Kanit';
            ctx.fillStyle = pop.color;
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 6;
            ctx.textAlign = 'center';
            ctx.fillText(pop.text, pop.x, pop.y);
            ctx.restore();
        }
    }

    // ── Mouse / Touch Fallback ──
    function handlePointerMove(e) {
        if (!canvas) return;
        var rect = canvas.getBoundingClientRect();
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        fallbackPointer.x = (clientX - rect.left) / rect.width;
        fallbackPointer.y = (clientY - rect.top) / rect.height;
        fallbackPointer.active = true;
    }

    function handlePointerDown(e) {
        handlePointerMove(e);
        fallbackPointer.down = true;
    }

    function handlePointerUp() {
        fallbackPointer.down = false;
    }

    // ── ผูก Event Listeners ──
    function init() {
        canvas = $('arCanvas');
        if (canvas) {
            ctx = canvas.getContext('2d');
            var resize = function () {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            };
            window.addEventListener('resize', resize);
            resize();

            window.addEventListener('mousemove', handlePointerMove);
            window.addEventListener('touchmove', handlePointerMove, { passive: true });
            window.addEventListener('mousedown', handlePointerDown);
            window.addEventListener('touchstart', handlePointerDown, { passive: true });
            window.addEventListener('mouseup', handlePointerUp);
            window.addEventListener('touchend', handlePointerUp);
        }

        $('startBtn').addEventListener('click', startGame);
        $('restartBtn').addEventListener('click', startGame);
        $('quitBtn').addEventListener('click', function () {
            gameState = 'start';
            if (mainTimer) clearInterval(mainTimer);
            stopHandTracking();
            KAMPAI.sound.bgmStop();
            showScreen('startScreen');
        });
        $('homeBtn').addEventListener('click', function () {
            KAMPAI.goHome();
        });

        if ($('versusBtn')) {
            $('versusBtn').addEventListener('click', function () {
                if (vs) vs.openMenu();
            });
        }

        window.addEventListener('beforeunload', function () {
            stopHandTracking();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
