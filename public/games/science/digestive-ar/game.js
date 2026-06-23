/**
 * GAME LOGIC — Digestive System AR Explorer
 * กายวิภาคระบบย่อยอาหาร ป.4-6 — ลากวางจำลองด้วย AR/เมาส์/สัมผัส
 */
(function () {
    'use strict';

    var CFG  = window.GAME_CONFIG;
    var DATA = window.GAME_DATA;

    // ─── SDK init ───
    KAMPAI.setSlug(CFG.SLUG);
    KAMPAI.sound.defaultBgm(CFG.BGM_PRESET);
    KAMPAI.sound.mountToggles();

    // Override BGM button placement to bottom left to avoid UI overlaps
    var styleNode = document.createElement('style');
    styleNode.innerHTML = '#kampai-snd { top: auto !important; bottom: 16px !important; left: 16px !important; z-index: 40 !important; }';
    document.head.appendChild(styleNode);

    // ─── Player + Leaderboard (boilerplate) ───
    function renderPlayer() {
        var s = KAMPAI.student, st = KAMPAI.stats;
        if (!s) return;
        var chip = document.getElementById('player-chip');
        var av = s.photoUrl ? '<img src="' + s.photoUrl + '" alt="">' : '<div class="pc-init">' + (s.displayName || '?')[0] + '</div>';
        var best = st ? ' · <span class="pc-best">สถิติสูงสุด ' + st.personalBest.toLocaleString() + '</span>' : '';
        chip.innerHTML = av + '<span>' + s.displayName + best + '</span>';
        chip.style.display = 'flex';
    }

    function renderMyStats() {
        var st = KAMPAI.stats;
        if (!st) return;
        document.getElementById('ms-best').innerText = (st.personalBest || 0).toLocaleString();
        document.getElementById('ms-plays').innerText = (st.playsCount || 0).toLocaleString();
        document.getElementById('my-stats').style.display = 'flex';
    }

    function renderLeaderboard(listId) {
        var el = document.getElementById(listId);
        if (!el) return;
        var rows = KAMPAI.leaderboard || [];
        if (!rows.length) { el.innerHTML = '<li class="lb-loading">ยังไม่มีผู้เล่น — เป็นคนแรกสิ!</li>'; return; }
        var medals = ['🥇','🥈','🥉'];
        el.innerHTML = rows.slice(0, 5).map(function (r) {
            var av = r.photoUrl ? '<img class="lb-avatar" src="' + r.photoUrl + '" alt="">' : '<div class="lb-avatar-init">' + (r.displayName || '?')[0] + '</div>';
            return '<li class="' + (r.isMe ? 'is-me' : '') + '">' +
                '<span class="lb-rank">' + (medals[r.rank - 1] || r.rank) + '</span>' + av +
                '<div class="lb-info"><div class="lb-name">' + r.displayName + (r.isMe ? ' (คุณ)' : '') + '</div>' +
                '<div class="lb-sub">' + (r.personalBest || 0).toLocaleString() + ' คะแนน · ' + (r.classLabel || '') + '</div></div>' +
            '</li>';
        }).join('');
    }

    KAMPAI.onReady(function () {
        renderPlayer();
        renderMyStats();
        renderLeaderboard('score-list');
    });

    /** ==========================================
     * GAME STATE & VARIABLES
     * ========================================== */
    var score = 0;
    var isGameStarted = false;
    var startTime = 0;
    var cameraTracker = null;
    var isARMode = false;
    var chips = [];
    var draggedChip = null;
    var virtualCursor = { x: window.innerWidth / 2, y: window.innerHeight / 2, isGrabbing: false, rawX: 0, rawY: 0 };
    var skeletonPoints = [];

    var canvas = document.getElementById('overlay-canvas');
    var ctx = canvas.getContext('2d');
    var chipsContainer = document.getElementById('chips-container');
    var scoreDisplay = document.getElementById('score-display');
    var cursorEl = document.getElementById('ar-cursor');
    var arStatus = document.getElementById('ar-status');

    // Resize Canvas to fit screen
    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    /** ==========================================
     * OBJECT POOL & PARTICLE SYSTEM
     * ========================================== */
    var MAX_PARTICLES = 60;
    var particlePool = Array.from({ length: MAX_PARTICLES }, function () { return { active: false }; });

    function spawnParticles(x, y, color) {
        var spawned = 0;
        for (var i = 0; i < MAX_PARTICLES; i++) {
            if (!particlePool[i].active && spawned < 20) {
                particlePool[i] = {
                    active: true,
                    x: x, y: y,
                    vx: (Math.random() - 0.5) * 15,
                    vy: (Math.random() - 0.5) * 15 - 5,
                    life: 1.0,
                    decay: Math.random() * 0.02 + 0.02,
                    color: color,
                    size: Math.random() * 6 + 3
                };
                spawned++;
            }
        }
    }

    function spawnConfetti() {
        var colors = ['#ff69b4', '#34d399', '#60a5fa', '#fbbf24', '#a78bfa'];
        for (var i = 0; i < 80; i++) {
            var div = document.createElement('div');
            div.className = 'confetti';
            div.style.left = Math.random() * 100 + 'vw';
            div.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            div.style.width = (Math.random() * 10 + 5) + 'px';
            div.style.height = (Math.random() * 20 + 10) + 'px';
            div.style.animationDuration = (Math.random() * 3 + 2) + 's';
            div.style.animationDelay = (Math.random() * 2) + 's';
            document.getElementById('victory-screen').appendChild(div);
        }
    }

    /** ==========================================
     * CHIPS SYSTEM
     * ========================================== */
    function createChips() {
        // Shuffle organs
        var shuffled = [].concat(DATA.organs).sort(function () { return Math.random() - 0.5; });
        shuffled.forEach(function (organ) {
            var chip = document.createElement('div');
            chip.className = 'btn-3d px-3 py-2 md:px-4 md:py-3 rounded-xl cursor-grab text-white font-semibold text-sm md:text-base flex flex-col items-center justify-center text-center absolute';
            chip.style.backgroundColor = organ.color;
            chip.style.width = '120px';
            chip.style.height = '60px';
            chip.style.transition = 'transform 0.1s ease-out, left 0.3s, top 0.3s';
            chip.innerHTML = '<div>' + organ.name + '</div><div class="text-[10px] md:text-xs font-normal opacity-90">' + organ.desc + '</div>';
            chip.dataset.id = organ.id;
            chip.dataset.color = organ.color;
            
            chipsContainer.appendChild(chip);
            chips.push({
                el: chip,
                id: organ.id,
                color: organ.color,
                isLocked: false,
                targetDZ: document.getElementById('dz-' + organ.id),
                x: 0, y: 0, 
                originX: 0, originY: 0
            });
        });
        arrangeChipsTray();
    }

    function arrangeChipsTray() {
        var yPos = window.innerHeight - 100; // inside footer
        var unlocked = chips.filter(function (c) { return !c.isLocked; });
        var trayWidth = window.innerWidth;
        var startX = trayWidth / 2 - (unlocked.length * 130) / 2;
        if (startX < 20) startX = 20;

        unlocked.forEach(function (chip, i) {
            chip.originX = startX + (i * 130);
            if (chip.originX > trayWidth - 130) {
                 chip.originX = 20 + ((i % 4) * 130);
                 chip.originY = yPos + 60; // Wrap if screen is too small
            } else {
                 chip.originY = yPos;
            }
            
            if (!draggedChip || draggedChip.id !== chip.id) {
                chip.x = chip.originX;
                chip.y = chip.originY;
                chip.el.style.left = chip.x + 'px';
                chip.el.style.top = chip.y + 'px';
            }
        });
    }

    /** ==========================================
     * DRAG & DROP LOGIC
     * ========================================== */
    function handleGrab(x, y) {
        if (!isGameStarted) return;
        virtualCursor.isGrabbing = true;
        cursorEl.classList.add('grabbing');
        
        // Find if user grabbed an unlocked chip
        for (var i = chips.length - 1; i >= 0; i--) {
            var chip = chips[i];
            if (!chip.isLocked) {
                var rect = chip.el.getBoundingClientRect();
                // Hit testing with padding
                if (x > rect.left - 20 && x < rect.right + 20 && y > rect.top - 20 && y < rect.bottom + 20) {
                    draggedChip = chip;
                    chip.el.style.transition = 'none'; // Disable transition for 1-1 smooth dragging
                    chip.el.style.zIndex = 50;
                    break;
                }
            }
        }
    }

    function handleRelease() {
        if (!isGameStarted) return;
        virtualCursor.isGrabbing = false;
        cursorEl.classList.remove('grabbing');

        if (draggedChip) {
            var targetDZ = draggedChip.targetDZ;
            var dzRect = targetDZ.getBoundingClientRect();
            var chipRect = draggedChip.el.getBoundingClientRect();
            
            var chipCx = chipRect.left + chipRect.width / 2;
            var chipCy = chipRect.top + chipRect.height / 2;
            var dzCx = dzRect.left + dzRect.width / 2;
            var dzCy = dzRect.top + dzRect.height / 2;

            var distance = Math.hypot(chipCx - dzCx, chipCy - dzCy);

            if (distance < 90) { // Lock Range
                KAMPAI.sound.correct();
                draggedChip.isLocked = true;
                
                // Snap chip to center of drop zone
                draggedChip.x = dzRect.left + (dzRect.width - chipRect.width) / 2;
                draggedChip.y = dzRect.top + (dzRect.height - chipRect.height) / 2;
                
                draggedChip.el.style.transition = 'left 0.3s, top 0.3s';
                draggedChip.el.style.left = draggedChip.x + 'px';
                draggedChip.el.style.top = draggedChip.y + 'px';
                
                // UI updates on drop zone
                targetDZ.style.backgroundColor = draggedChip.color + '40'; // Soft opacity background
                targetDZ.style.borderColor = draggedChip.color;
                var placeholder = targetDZ.querySelector('.dz-placeholder');
                if (placeholder) placeholder.style.opacity = '0';
                
                // Show real organ path in SVG (change opacity from placeholder state)
                var realOrganSvg = document.getElementById('svg-' + draggedChip.id);
                if (realOrganSvg) {
                    realOrganSvg.style.transition = 'opacity 0.5s';
                    realOrganSvg.style.opacity = '1.0';
                }

                // Gallbladder highlight special trigger if liver is correct
                if (draggedChip.id === 'liver') {
                    var gallbladder = document.getElementById('svg-gallbladder');
                    if (gallbladder) gallbladder.style.opacity = '1.0';
                }

                spawnParticles(dzCx, dzCy, draggedChip.color);
                
                score++;
                scoreDisplay.innerText = score;
                checkWin();
            } else {
                // Return to tray
                KAMPAI.sound.wrong();
                draggedChip.el.style.transition = 'left 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), top 0.3s';
                draggedChip.x = draggedChip.originX;
                draggedChip.y = draggedChip.originY;
                draggedChip.el.style.left = draggedChip.x + 'px';
                draggedChip.el.style.top = draggedChip.y + 'px';
            }

            draggedChip.el.style.zIndex = 10;
            draggedChip = null;
        }
    }

    function checkWin() {
        if (score >= 6) {
            var timeTaken = Math.round((Date.now() - startTime) / 1000);
            var finalScore = Math.max(10, 300 - timeTaken);

            setTimeout(function () {
                KAMPAI.sound.bgmStop();
                KAMPAI.sound.gameOver();
                
                // Submit score to database via SDK
                KAMPAI.submitScore(finalScore, {
                    timeTakenSeconds: timeTaken,
                    mode: 'normal'
                });

                document.getElementById('victory-time').innerText = 'เวลาที่ใช้: ' + timeTaken + ' วินาที (คะแนนสะสม: ' + finalScore + ')';
                
                var vicScreen = document.getElementById('victory-screen');
                vicScreen.classList.remove('hidden');
                void vicScreen.offsetWidth; // Trigger reflow for transition
                vicScreen.classList.remove('opacity-0');
                spawnConfetti();

                renderLeaderboard('score-list-gameover');
            }, 600);
        }
    }

    /** ==========================================
     * MOUSE & TOUCH FALLBACK
     * ========================================== */
    function updateCursorPos(e) {
        var clientX = e.touches ? e.touches[0].clientX : e.clientX;
        var clientY = e.touches ? e.touches[0].clientY : e.clientY;
        virtualCursor.x = clientX;
        virtualCursor.y = clientY;
        
        cursorEl.style.left = virtualCursor.x + 'px';
        cursorEl.style.top = virtualCursor.y + 'px';

        if (draggedChip) {
            draggedChip.x = virtualCursor.x - 60; // Offset by half chip width
            draggedChip.y = virtualCursor.y - 30; // Offset by half chip height
            draggedChip.el.style.left = draggedChip.x + 'px';
            draggedChip.el.style.top = draggedChip.y + 'px';
        }
    }

    window.addEventListener('mousedown', function (e) {
        updateCursorPos(e);
        handleGrab(virtualCursor.x, virtualCursor.y);
    });
    window.addEventListener('mousemove', function (e) {
        updateCursorPos(e);
    });
    window.addEventListener('mouseup', function () {
        handleRelease();
    });

    window.addEventListener('touchstart', function (e) {
        updateCursorPos(e);
        handleGrab(virtualCursor.x, virtualCursor.y);
    });
    window.addEventListener('touchmove', function (e) {
        updateCursorPos(e);
    });
    window.addEventListener('touchend', function () {
        handleRelease();
    });

    /** ==========================================
     * MEDIAPIPE AR HAND CONTROLS
     * ========================================== */
    async function initMediaPipe() {
        var videoEl = document.getElementById('input_video');
        var statusEl = document.getElementById('loading-status');
        statusEl.classList.remove('hidden');
        
        try {
            var hands = new window.Hands({
                locateFile: function (file) {
                    return 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/' + file;
                }
            });

            hands.setOptions({
                maxNumHands: 1,
                modelComplexity: 0,
                minDetectionConfidence: 0.7,
                minTrackingConfidence: 0.7
            });

            hands.onResults(onARResults);

            cameraTracker = new window.Camera(videoEl, {
                onFrame: async function () {
                    if (isGameStarted) {
                        await hands.send({ image: videoEl });
                    }
                },
                width: 480, height: 360
            });

            await cameraTracker.start();
            isARMode = true;
            arStatus.innerText = "AR Mode Active 📸";
            arStatus.className = "px-4 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-700 shadow-sm";
            cursorEl.style.opacity = "1";
        } catch (err) {
            console.warn("Camera not available or blocked. Using Simulator mode.", err);
            isARMode = false;
            arStatus.innerText = "Simulator Mode 🖱️";
            cursorEl.style.opacity = "0"; // Hide AR cursor if mouse is used
        }
        statusEl.classList.add('hidden');
    }

    var lerp = function (start, end, amt) {
        return (1 - amt) * start + amt * end;
    };

    function onARResults(results) {
        if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
            skeletonPoints = [];
            return;
        }

        var landmarks = results.multiHandLandmarks[0];
        skeletonPoints = landmarks;

        var indexTip = landmarks[8];
        var thumbTip = landmarks[4];

        // Mirror coordinates for index tip
        virtualCursor.rawX = (1 - indexTip.x) * window.innerWidth;
        virtualCursor.rawY = indexTip.y * window.innerHeight;

        // Apply LERP smoothing
        virtualCursor.x = lerp(virtualCursor.x, virtualCursor.rawX, 0.22);
        virtualCursor.y = lerp(virtualCursor.y, virtualCursor.rawY, 0.22);

        cursorEl.style.left = virtualCursor.x + 'px';
        cursorEl.style.top = virtualCursor.y + 'px';

        // Pinch calculation
        var dx = indexTip.x - thumbTip.x;
        var dy = indexTip.y - thumbTip.y;
        var pinchDistance = Math.sqrt(dx * dx + dy * dy);

        if (!virtualCursor.isGrabbing && pinchDistance < 0.038) {
            handleGrab(virtualCursor.x, virtualCursor.y);
        } else if (virtualCursor.isGrabbing && pinchDistance > 0.055) {
            handleRelease();
        }

        // Update position if dragged by AR
        if (draggedChip && isARMode) {
            draggedChip.x = virtualCursor.x - 60;
            draggedChip.y = virtualCursor.y - 30;
            draggedChip.el.style.left = draggedChip.x + 'px';
            draggedChip.el.style.top = draggedChip.y + 'px';
        }
    }

    /** ==========================================
     * MAIN ANIMATION RENDER LOOP (CANVAS)
     * ========================================== */
    function getCenter(el) {
        var rect = el.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    }

    var dashOffset = 0;
    function renderLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        dashOffset -= 0.5;

        // 1. Draw connecting holographic paths
        DATA.organs.forEach(function (organ) {
            var dz = document.getElementById('dz-' + organ.id);
            var svgNode = document.getElementById(organ.svgId);
            if (dz && svgNode) {
                var dzCenter = getCenter(dz);
                var svgCenter = getCenter(svgNode);
                
                ctx.beginPath();
                ctx.moveTo(svgCenter.x, svgCenter.y);
                // Create Bezier Curve
                var cpX = (svgCenter.x + dzCenter.x) / 2;
                var cpY = svgCenter.y - 40; 
                ctx.quadraticCurveTo(cpX, cpY, dzCenter.x, dzCenter.y);
                
                ctx.strokeStyle = "rgba(96, 165, 250, 0.4)"; // Hologram blue
                ctx.lineWidth = 3;
                ctx.setLineDash([8, 6]);
                ctx.lineDashOffset = dashOffset;
                ctx.stroke();

                // Small connector dot at organ center
                ctx.beginPath();
                ctx.arc(svgCenter.x, svgCenter.y, 4, 0, Math.PI * 2);
                ctx.fillStyle = organ.color;
                ctx.fill();
            }
        });

        // 2. Draw particle bursts
        for (var i = 0; i < MAX_PARTICLES; i++) {
            var p = particlePool[i];
            if (p.active) {
                p.vy += 0.22; // Gravity
                p.x += p.vx;
                p.y += p.vy;
                p.life -= p.decay;

                if (p.life <= 0) {
                    p.active = false;
                } else {
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                    ctx.fillStyle = p.color;
                    ctx.globalAlpha = p.life;
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                }
            }
        }

        // 3. Draw AR skeletal hand lines (Index & Thumb joints)
        if (isARMode && skeletonPoints.length > 0) {
            ctx.strokeStyle = "rgba(59, 130, 246, 0.5)"; // Blue laser
            ctx.lineWidth = 4;
            ctx.setLineDash([]);
            
            // Draw skeleton bones for index & thumb
            var connections = [[0,1],[1,2],[2,3],[3,4], [0,5],[5,6],[6,7],[7,8]];
            connections.forEach(function (pair) {
                var p1 = skeletonPoints[pair[0]];
                var p2 = skeletonPoints[pair[1]];
                ctx.beginPath();
                ctx.moveTo((1 - p1.x) * canvas.width, p1.y * canvas.height);
                ctx.lineTo((1 - p2.x) * canvas.width, p2.y * canvas.height);
                ctx.stroke();
            });
            
            // Draw joints
            skeletonPoints.forEach(function (p, idx) {
                if (idx <= 8) { // Only draw thumb and index joints for focus
                    ctx.beginPath();
                    ctx.arc((1 - p.x) * canvas.width, p.y * canvas.height, 4, 0, Math.PI * 2);
                    ctx.fillStyle = "rgba(191, 219, 254, 0.9)";
                    ctx.fill();
                }
            });
        }

        if (isGameStarted) {
            requestAnimationFrame(renderLoop);
        }
    }

    /** ==========================================
     * INITIALIZATION & ACTION
     * ========================================== */
    document.getElementById('btn-start').addEventListener('click', async function () {
        KAMPAI.sound.unlock();
        KAMPAI.sound.correct(); // standard start click

        document.getElementById('btn-start').disabled = true;
        document.getElementById('btn-start').innerText = "กำลังเข้าสิทธิ์กล้อง...";

        createChips();

        // Initialize MediaPipe hands tracking (fallback is automatic)
        await initMediaPipe();

        isGameStarted = true;
        startTime = Date.now();
        document.getElementById('blocker').style.display = 'none';

        KAMPAI.sound.bgmStart();

        // Start animation frame
        requestAnimationFrame(renderLoop);
    });

    // ปล่อยกล้องทุก exit (กลับหน้าหลัก/รีโหลด) — มือถือ beforeunload ไม่ค่อย fire จึงเพิ่ม pagehide ด้วย
    function cleanupCam() {
        if (cameraTracker) {
            try { cameraTracker.stop(); } catch (e) {}
        }
    }
    window.addEventListener('beforeunload', cleanupCam);
    window.addEventListener('pagehide', cleanupCam);

})();
