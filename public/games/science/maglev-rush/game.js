/* game.js — ลอจิกเกม Maglev Rush (KAMPAI SDK + Physics Runner) */
(function () {
    'use strict';
    var CFG = window.GAME_CONFIG, DATA = window.GAME_DATA;
    var $ = function (id) { return document.getElementById(id); };

    // ── กำหนดค่า SDK ──
    KAMPAI.setSlug(CFG.SLUG);
    KAMPAI.sound.mountToggles();
    KAMPAI.sound.defaultBgm(CFG.BGM || 'racer');

    // ── Canvas & Loop ──
    var canvas, ctx;
    var rafId = null;
    var gameState = 'start'; // 'start' | 'playing' | 'station' | 'gameover'
    var timeLeft = CFG.GAME_DURATION;
    var score = 0;
    var combo = 0;
    var speedKmh = CFG.BASE_SPEED_KMH;
    var targetSpeedKmh = CFG.BASE_SPEED_KMH;
    var distanceTraveledM = 0;
    var currentStationIndex = 0;
    var mainTimer = null;
    var playerName = 'กัปตันรถไฟแม่เหล็ก';

    // ── ข้อมูลผู้เล่น (Player Train State) ──
    var player = {
        lane: 1,           // 0: ซ้าย, 1: กลาง, 2: ขวา
        targetLane: 1,
        laneX: 0.5,        // ตำแหน่ง X นุ่มนวล (0..1)
        pole: 'N',         // 'N' (ขั้วเหนือ 🔴) | 'S' (ขั้วใต้ 🔵)
        hoverOffset: 0,
        hoverDir: 1,
        turboTimer: 0,     // เวลาเทอร์โบที่เหลือ
        magnetGlow: 0
    };

    // ── วัตถุบนราง (Track Spawns) ──
    var trackItems = [];
    var spawnTimer = null;
    var particles = [];
    var scorePopups = [];
    var speedLines = [];

    // ── Versus Mode ──
    var vs = window.KampaiVersus ? KampaiVersus.create({
        duration: CFG.GAME_DURATION,
        title: 'Maglev Rush',
        rankBy: 'score',
        onPlay: function () { startGame(); },
        onEnd: function () { endGame(); }
    }) : null;

    // ── ผู้เล่นและลีดเดอร์บอร์ด ──
    function renderPlayer() {
        var s = KAMPAI.student, stt = KAMPAI.stats, chip = $('player-chip');
        if (!s || !chip) return;
        var av = s.photoUrl ? '<img src="' + s.photoUrl + '" alt="">' : '<div class="ini">' + ((s.displayName || '?')[0]) + '</div>';
        var best = stt ? ' · <b style="color:#facc15">สถิติสูงสุด ' + (stt.personalBest || 0) + '</b>' : '';
        chip.innerHTML = av + '<span>' + s.displayName + best + '</span>';
        chip.style.display = 'flex';
        playerName = s.displayName || 'กัปตันรถไฟแม่เหล็ก';
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

    function showScreen(screenId) {
        ['startScreen', 'gameScreen', 'resultScreen'].forEach(function (id) {
            var el = $(id);
            if (el) el.classList.toggle('active', id === screenId);
        });
    }

    // ── การควบคุมรถไฟ ──
    function moveLeft() {
        if (player.targetLane > 0) {
            player.targetLane--;
            KAMPAI.sound.unlock();
        }
    }

    function moveRight() {
        if (player.targetLane < CFG.TRACK_LANES - 1) {
            player.targetLane++;
            KAMPAI.sound.unlock();
        }
    }

    function togglePole() {
        player.pole = player.pole === 'N' ? 'S' : 'N';
        updatePoleUI();
        KAMPAI.sound.fxFlash();
        addParticles(canvas.width * player.laneX, canvas.height * 0.78, player.pole === 'N' ? '#ef4444' : '#3b82f6', 15);
    }

    function updatePoleUI() {
        var btn = $('poleSwitchBtn');
        var letter = $('poleLetter');
        if (!btn || !letter) return;
        if (player.pole === 'N') {
            btn.className = 'pole-switch-btn pole-N';
            letter.innerText = 'N';
            btn.querySelector('.pole-subtext').innerText = 'ขั้วเหนือ';
        } else {
            btn.className = 'pole-switch-btn pole-S';
            letter.innerText = 'S';
            btn.querySelector('.pole-subtext').innerText = 'ขั้วใต้';
        }
    }

    // ── การสปอว์นวัตถุและเกตแม่เหล็ก ──
    function spawnTrackEntity() {
        if (gameState !== 'playing') return;
        var lane = Math.floor(Math.random() * CFG.TRACK_LANES);
        var roll = Math.random();

        if (roll < 0.45) {
            // สารแม่เหล็ก (Magnetic Item)
            var magList = DATA.items.magnetic;
            var item = magList[Math.floor(Math.random() * magList.length)];
            trackItems.push({
                kind: 'item',
                data: item,
                lane: lane,
                z: 1.0, // 1.0 = เส้นขอบฟ้าไกล, 0.0 = ถึงตัวผู้เล่น
                attracting: false
            });
        } else if (roll < 0.75) {
            // เสาแม่เหล็กเร่งความเร็ว (Magnetic Gate)
            var gate = DATA.magneticGates[Math.floor(Math.random() * DATA.magneticGates.length)];
            trackItems.push({
                kind: 'gate',
                data: gate,
                lane: lane,
                z: 1.0
            });
        } else {
            // สิ่งกีดขวางที่ไม่ใช่แม่เหล็ก (Obstacle)
            var nonMagList = DATA.items.nonMagnetic;
            var obs = nonMagList[Math.floor(Math.random() * nonMagList.length)];
            trackItems.push({
                kind: 'obstacle',
                data: obs,
                lane: lane,
                z: 1.0
            });
        }
    }

    // ── เริ่มและจบเกม ──
    function startGame() {
        score = 0;
        combo = 0;
        timeLeft = CFG.GAME_DURATION;
        speedKmh = CFG.BASE_SPEED_KMH;
        targetSpeedKmh = CFG.BASE_SPEED_KMH;
        distanceTraveledM = 0;
        currentStationIndex = 0;
        trackItems = [];
        particles = [];
        scorePopups = [];
        speedLines = [];

        player.lane = 1;
        player.targetLane = 1;
        player.laneX = 0.5;
        player.pole = 'N';
        player.turboTimer = 0;

        gameState = 'playing';
        showScreen('gameScreen');
        updatePoleUI();
        updateHUD();

        KAMPAI.sound.unlock();
        KAMPAI.sound.bgmStart();

        if (mainTimer) clearInterval(mainTimer);
        mainTimer = setInterval(tickTimer, 1000);

        if (spawnTimer) clearInterval(spawnTimer);
        spawnTimer = setInterval(spawnTrackEntity, 750);

        if (!rafId) requestAnimationFrame(gameLoop);
    }

    function tickTimer() {
        if (gameState !== 'playing') return;
        timeLeft--;
        $('timerPill').innerText = '⏱ ' + timeLeft;

        if (timeLeft <= 0) {
            endGame();
        }
    }

    function reachStation() {
        gameState = 'station';
        var st = DATA.stations[currentStationIndex];
        var overlay = $('stationOverlay');
        $('stTitle').innerText = '🚉 ' + st.name;
        $('stDesc').innerText = 'ระบบเบรก ' + st.frictionName + ' ทำงานสมบูรณ์แบบ! +50 แต้ม';
        $('stFact').innerText = '💡 ' + st.tip;
        overlay.classList.add('active');

        KAMPAI.sound.correct();
        addScore(CFG.POINTS_STATION_STOP, canvas.width / 2, canvas.height * 0.45, 'PERFECT STOP! +' + CFG.POINTS_STATION_STOP);

        setTimeout(function () {
            overlay.classList.remove('active');
            currentStationIndex = (currentStationIndex + 1) % DATA.stations.length;
            distanceTraveledM = 0;
            gameState = 'playing';
            updateHUD();
        }, 2500);
    }

    function endGame() {
        gameState = 'gameover';
        if (mainTimer) clearInterval(mainTimer);
        if (spawnTimer) clearInterval(spawnTimer);

        KAMPAI.sound.bgmStop();
        KAMPAI.sound.gameOver();

        $('final-score').innerText = score;
        var stars = '⭐⭐⭐';
        if (score < 120) stars = '⭐☆☆';
        else if (score < 240) stars = '⭐⭐☆';
        $('go-stars').innerText = stars;

        $('final-detail').innerText = 'ความเร็วสูงสุด: ' + Math.round(speedKmh) + ' KM/H · สถานีที่ผ่าน: ' + (currentStationIndex + 1) + ' สถานี';

        showScreen('resultScreen');

        // ส่งคะแนนเข้าระบบพอร์ทัล
        KAMPAI.submitScore(score, {
            topSpeed: Math.round(speedKmh),
            stationsReached: currentStationIndex + 1
        });

        if (vs && vs.report) {
            vs.report(score, { speed: Math.round(speedKmh) });
            vs.finish();
        }
    }

    // ── คะแนนและเอฟเฟกต์ ──
    function addScore(pts, x, y, customText) {
        score = Math.max(0, score + pts);
        $('scorePill').innerText = '⭐ ' + score;

        var popText = customText || (pts > 0 ? '+' + pts : '' + pts);
        var color = pts > 0 ? '#facc15' : '#f87171';
        spawnScorePopup(popText, x, y, color);

        if (pts > 0) {
            combo++;
            if (combo >= 3) {
                var cb = $('comboBadge');
                cb.innerText = '🔥 COMBO x' + combo;
                cb.style.display = 'block';
            }
        } else {
            combo = 0;
            $('comboBadge').style.display = 'none';
        }
    }

    function spawnScorePopup(text, x, y, color) {
        scorePopups.push({ text: text, x: x, y: y, color: color, alpha: 1.0, vy: -2.0 });
    }

    function addParticles(x, y, color, count) {
        count = count || 14;
        for (var i = 0; i < count; i++) {
            var angle = Math.random() * Math.PI * 2;
            var spd = 2 + Math.random() * 5;
            particles.push({
                x: x, y: y,
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
        $('speedVal').innerText = Math.round(speedKmh);
        $('scorePill').innerText = '⭐ ' + score;
        $('timerPill').innerText = '⏱ ' + timeLeft;

        var st = DATA.stations[currentStationIndex];
        $('stationName').innerText = '🚉 ' + st.name.split(' ')[0];
        var remainDist = Math.max(0, CFG.STATION_INTERVAL_M - distanceTraveledM);
        $('distVal').innerText = Math.round(remainDist) + 'm';
        var pct = Math.min(100, (distanceTraveledM / CFG.STATION_INTERVAL_M) * 100);
        $('distBarFill').style.width = pct + '%';
    }

    // ── ลูปประมวลผลและวาด Canvas ──
    function gameLoop() {
        if (!canvas || !ctx) {
            rafId = requestAnimationFrame(gameLoop);
            return;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // อัปเดตฟิสิกส์
        if (gameState === 'playing') {
            updatePhysics();
        }

        // วาดฉาก ราง และวัตถุ
        renderWorld();
        renderFX();

        rafId = requestAnimationFrame(gameLoop);
    }

    function updatePhysics() {
        // จัดการความเร็วและการเร่ง
        if (player.turboTimer > 0) {
            player.turboTimer--;
            targetSpeedKmh = CFG.BOOST_SPEED_KMH;
        } else {
            targetSpeedKmh = CFG.BASE_SPEED_KMH;
        }
        speedKmh += (targetSpeedKmh - speedKmh) * 0.08;

        // ระยะทางสะสม
        var speedMps = (speedKmh * 1000) / 3600;
        distanceTraveledM += (speedMps / 60);

        if (distanceTraveledM >= CFG.STATION_INTERVAL_M) {
            reachStation();
        }

        // อัปเดตตำแหน่งเลนของรถไฟให้นุ่มนวล
        var targetX = 0.22 + player.targetLane * 0.28;
        player.laneX += (targetX - player.laneX) * 0.2;

        // การลอยตัวของ Maglev (Hover Bobbing)
        player.hoverOffset += 0.06 * player.hoverDir;
        if (Math.abs(player.hoverOffset) > 4) player.hoverDir *= -1;

        // อัปเดตการเคลื่อนที่ของวัตถุบนราง
        var speedRatio = speedKmh / CFG.BASE_SPEED_KMH;
        for (var i = trackItems.length - 1; i >= 0; i--) {
            var ent = trackItems[i];
            ent.z -= 0.012 * speedRatio;

            // ตรวจจับแรงดูดสารแม่เหล็ก (Magnetic Attraction)
            if (ent.kind === 'item' && ent.z < 0.35 && ent.lane === player.targetLane) {
                ent.attracting = true;
            }

            // ตรวจสอบการชนที่ระยะใกล้ (z <= 0.08)
            if (ent.z <= 0.08) {
                handleCollision(ent);
                trackItems.splice(i, 1);
                continue;
            }

            // หลุดด้านหลังจอ
            if (ent.z < -0.05) {
                trackItems.splice(i, 1);
            }
        }

        updateHUD();
    }

    function handleCollision(ent) {
        var W = canvas.width, H = canvas.height;
        var px = player.laneX * W, py = H * 0.78;

        if (ent.lane !== player.targetLane && !ent.attracting) return;

        if (ent.kind === 'item') {
            // ดูดเก็บสารแม่เหล็กสำเร็จ!
            KAMPAI.sound.correct();
            addScore(ent.data.pts || CFG.POINTS_MAGNETIC, px, py, '+' + ent.data.pts + ' ' + ent.data.name);
            addParticles(px, py, ent.data.color, 16);
        } else if (ent.kind === 'gate') {
            // เกตแม่เหล็ก
            if (ent.data.repelCondition === player.pole) {
                // ขั้วเหมือนกัน = แรงผลักเทอร์โบ! (REPULSION BOOST)
                KAMPAI.sound.fxFlash();
                player.turboTimer = 75; // เร่งความเร็ว 1.25 วินาที
                addScore(CFG.POINTS_REPEL_BOOST, px, py, '🚀 REPULSION TURBO! +' + CFG.POINTS_REPEL_BOOST);
                addParticles(px, py, '#facc15', 24);
                // สร้าง Speed lines
                for (var s = 0; s < 12; s++) {
                    speedLines.push({ x: Math.random() * W, y: Math.random() * H, len: 60 + Math.random() * 80, speed: 20 + Math.random() * 15 });
                }
            } else {
                // ขั้วต่างกัน = แรงดูดหน่วงความเร็ว (ATTRACTION DRAG)
                KAMPAI.sound.wrong();
                speedKmh = Math.max(80, speedKmh - 40);
                addScore(CFG.PENALTY_OPPOSITE_GATE, px, py, '⚠️ ดูดหน่วงความเร็ว! ' + CFG.PENALTY_OPPOSITE_GATE);
                addParticles(px, py, '#3b82f6', 12);
            }
        } else if (ent.kind === 'obstacle') {
            // ชนสิ่งที่ไม่ใช่แม่เหล็ก
            KAMPAI.sound.wrong();
            speedKmh = Math.max(60, speedKmh - 60);
            addScore(CFG.PENALTY_NON_MAGNETIC, px, py, '💥 ชน ' + ent.data.name + '! ' + CFG.PENALTY_NON_MAGNETIC);
            addParticles(px, py, '#ef4444', 20);
        }
    }

    // ── เรนเดอร์โลก ราง และรถไฟ (World Rendering) ──
    function renderWorld() {
        var W = canvas.width, H = canvas.height;
        var horizonY = H * 0.28;

        // 1. ท้องฟ้า Cyber-Space Gradient
        var skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
        skyGrad.addColorStop(0, '#050814');
        skyGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, W, horizonY);

        // 2. พื้นราง Maglev Grid Perspective
        var groundGrad = ctx.createLinearGradient(0, horizonY, 0, H);
        groundGrad.addColorStop(0, '#0a0f24');
        groundGrad.addColorStop(1, '#020617');
        ctx.fillStyle = groundGrad;
        ctx.fillRect(0, horizonY, W, H - horizonY);

        // เส้นขอบรางและแสงนีออน 3 เลน
        var lanes = [0.22, 0.5, 0.78];
        var horizonX = W * 0.5;

        // วาดแสงสนามแม่เหล็กบนราง
        for (var l = 0; l < 3; l++) {
            var botX = lanes[l] * W;
            ctx.save();
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 12;
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(horizonX, horizonY);
            ctx.lineTo(botX, H);
            ctx.stroke();

            // รางคู่ขนาน
            ctx.strokeStyle = 'rgba(56, 189, 248, 0.15)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(horizonX - 10, horizonY);
            ctx.lineTo(botX - 45, H);
            ctx.moveTo(horizonX + 10, horizonY);
            ctx.lineTo(botX + 45, H);
            ctx.stroke();
            ctx.restore();
        }

        // 3. วาดวัตถุบนรางตามระยะ z (จากไกลไปใกล้)
        trackItems.slice().sort(function (a, b) { return b.z - a.z; }).forEach(function (ent) {
            var z = ent.z;
            var scale = 1.0 - z * 0.75;
            var laneTargetX = lanes[ent.lane] * W;
            var curX = horizonX + (laneTargetX - horizonX) * (1.0 - z);
            var curY = horizonY + (H * 0.8 - horizonY) * (1.0 - z);

            ctx.save();
            ctx.translate(curX, curY);
            ctx.scale(scale, scale);

            if (ent.kind === 'item') {
                // สารแม่เหล็ก
                ctx.shadowColor = ent.data.color || '#38bdf8';
                ctx.shadowBlur = 16;
                ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
                ctx.strokeStyle = ent.data.color || '#38bdf8';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(0, 0, 32, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();

                ctx.font = '30px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(ent.data.icon, 0, -4);

                ctx.font = 'bold 13px Kanit';
                ctx.fillStyle = '#ffffff';
                ctx.fillText(ent.data.name, 0, 42);
            } else if (ent.kind === 'gate') {
                // เกตแม่เหล็ก N/S
                var isN = ent.data.pole === 'N';
                ctx.shadowColor = isN ? '#ef4444' : '#3b82f6';
                ctx.shadowBlur = 24;
                ctx.strokeStyle = isN ? '#ef4444' : '#3b82f6';
                ctx.lineWidth = 6;

                // ซุ้มประตูแม่เหล็ก
                ctx.beginPath();
                ctx.moveTo(-50, 40);
                ctx.lineTo(-50, -45);
                ctx.arcTo(0, -75, 50, -45, 40);
                ctx.lineTo(50, 40);
                ctx.stroke();

                ctx.fillStyle = isN ? 'rgba(239, 68, 68, 0.3)' : 'rgba(59, 130, 246, 0.3)';
                ctx.fill();

                ctx.font = 'bold 28px Orbitron, sans-serif';
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.fillText(ent.data.pole, 0, -35);
            } else if (ent.kind === 'obstacle') {
                // สิ่งกีดขวาง
                ctx.shadowColor = '#ef4444';
                ctx.shadowBlur = 10;
                ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
                ctx.strokeStyle = '#ef4444';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.roundRect(-30, -30, 60, 60, 12);
                ctx.fill();
                ctx.stroke();

                ctx.font = '28px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(ent.data.icon, 0, 0);

                ctx.font = 'bold 12px Kanit';
                ctx.fillStyle = '#f87171';
                ctx.fillText('🚫 ' + ent.data.name, 0, 44);
            }
            ctx.restore();
        });

        // 4. วาดรถไฟ Maglev ของผู้เล่น
        renderMaglevTrain();
    }

    function renderMaglevTrain() {
        var W = canvas.width, H = canvas.height;
        var trainX = player.laneX * W;
        var trainY = H * 0.78 + player.hoverOffset;

        ctx.save();
        ctx.translate(trainX, trainY);

        // แสงเงาลอยตัว (Hover Shadow ด้านล่าง)
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.beginPath();
        ctx.ellipse(0, 50, 45, 12, 0, 0, Math.PI * 2);
        ctx.fill();

        // แสงสนามแม่เหล็กรอบรถ (Magnetic Field Rings)
        var poleColor = player.pole === 'N' ? '#ef4444' : '#3b82f6';
        ctx.shadowColor = poleColor;
        ctx.shadowBlur = player.turboTimer > 0 ? 35 : 20;

        // ตัวถังรถไฟ Maglev ดีไซน์ลู่ลม (Futuristic Streamlined Body)
        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = poleColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -65);           // หัวจรวดหน้ารถ
        ctx.lineTo(34, -20);
        ctx.lineTo(38, 38);
        ctx.lineTo(-38, 38);
        ctx.lineTo(-34, -20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // กระจกหน้าห้องคนขับ (Cockpit Glass)
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.moveTo(0, -48);
        ctx.lineTo(20, -18);
        ctx.lineTo(-20, -18);
        ctx.closePath();
        ctx.fill();

        // แกนพลังงานขั้วแม่เหล็ก N/S กลางตัวรถ
        ctx.fillStyle = poleColor;
        ctx.beginPath();
        ctx.arc(0, 10, 18, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = 'bold 20px Orbitron, sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(player.pole, 0, 10);

        // ไอพ่นท้ายรถ (Thrusters)
        if (player.turboTimer > 0) {
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.moveTo(-18, 38);
            ctx.lineTo(0, 68 + Math.random() * 15);
            ctx.lineTo(18, 38);
            ctx.fill();
        }

        ctx.restore();
    }

    // ── วาดเอฟเฟกต์ (Particles & Speed Lines) ──
    function renderFX() {
        var W = canvas.width, H = canvas.height;

        // วาด Speed Lines
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        for (var s = speedLines.length - 1; s >= 0; s--) {
            var line = speedLines[s];
            line.y += line.speed;
            ctx.beginPath();
            ctx.moveTo(line.x, line.y);
            ctx.lineTo(line.x, line.y + line.len);
            ctx.stroke();
            if (line.y > H) speedLines.splice(s, 1);
        }
        ctx.restore();

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
            ctx.font = 'bold 22px "Fredoka One", Orbitron, Kanit';
            ctx.fillStyle = pop.color;
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 6;
            ctx.textAlign = 'center';
            ctx.fillText(pop.text, pop.x, pop.y);
            ctx.restore();
        }
    }

    // ── ผูก Event Listeners ──
    function init() {
        canvas = $('gameCanvas');
        if (canvas) {
            ctx = canvas.getContext('2d');
            var resize = function () {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            };
            window.addEventListener('resize', resize);
            resize();
        }

        // คีย์บอร์ด
        window.addEventListener('keydown', function (e) {
            if (gameState !== 'playing') return;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                moveLeft();
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                moveRight();
            } else if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
                togglePole();
            }
        });

        // ปุ่มบนหน้าจอ
        $('startBtn').addEventListener('click', startGame);
        $('restartBtn').addEventListener('click', startGame);
        $('quitBtn').addEventListener('click', function () {
            gameState = 'start';
            if (mainTimer) clearInterval(mainTimer);
            if (spawnTimer) clearInterval(spawnTimer);
            KAMPAI.sound.bgmStop();
            showScreen('startScreen');
        });
        $('homeBtn').addEventListener('click', function () {
            KAMPAI.goHome();
        });

        $('leftLaneBtn').addEventListener('click', moveLeft);
        $('rightLaneBtn').addEventListener('click', moveRight);
        $('poleSwitchBtn').addEventListener('click', togglePole);

        if ($('versusBtn')) {
            $('versusBtn').addEventListener('click', function () {
                if (vs) vs.openMenu();
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
