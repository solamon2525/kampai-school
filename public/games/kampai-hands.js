/* kampai-hands.js — KAMPAI Finger Tracking (single source) · window.KampaiHands
   สำหรับเกมที่ใช้นิ้วชี้จิ้ม/ทับ/ชนวัตถุบนจอ (ไม่ใช่ zone quiz / ท่าทางทั้งตัว)
   Pattern: MediaPipe Hands + @mediapipe/camera_utils (พิสูจน์แล้วใน balloon-burst / cyberdrop)
   ─────────────────────────────────────────────────────────────────────────────
   โหลดก่อน game.js:
     <script src="https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js"></script>
     <script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js"></script>
     <script src="/games/kampai-hands.js"></script>
   ─────────────────────────────────────────────────────────────────────────────
   อ้างอิง: public/games/thai/balloon-burst/ · AR-GAME.md § Finger Tracking */
(function (global) {
    'use strict';

    var VERSION = '1.2.0';

    var DEFAULT_HANDS = {
        maxNumHands: 2,
        modelComplexity: 1,
        minConfidence: 0.6,
        smoothing: 0.4,
        lostHoldMs: 140,
        sweepSteps: 2,
        minExtendedFingers: 0,
        cameraWidth: 640,
        cameraHeight: 480,
        handsUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands/'
    };

    var HAND_CONNECTIONS = [
        [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
        [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17]
    ];

    function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

    function resolveEl(elOrSel) {
        if (!elOrSel) return null;
        return typeof elOrSel === 'string' ? document.querySelector(elOrSel) : elOrSel;
    }

    function create(opts) {
        opts = opts || {};
        var videoEl = resolveEl(opts.video);
        var handsOpt = {};
        var k;
        for (k in DEFAULT_HANDS) handsOpt[k] = DEFAULT_HANDS[k];
        var src = opts.hands || opts.tuning || {};
        for (k in src) if (Object.prototype.hasOwnProperty.call(src, k)) handsOpt[k] = src[k];

        var getCanvasSize = opts.getCanvasSize || opts.displaySize;
        var onStatus = typeof opts.onStatus === 'function' ? opts.onStatus : function () {};

        var st = {
            mode: 'tap',
            running: false,
            cameraObj: null,
            mpHands: null,
            leftSeenAt: 0,
            rightSeenAt: 0,
            leftHand: { x: 0, y: 0, active: false },
            rightHand: { x: 0, y: 0, active: false },
            leftLandmarks: null,
            rightLandmarks: null,
            leftPointer: { x: -9999, y: -9999, prevX: -9999, prevY: -9999, active: false },
            rightPointer: { x: -9999, y: -9999, prevX: -9999, prevY: -9999, active: false },
            leftExtendedCount: 0,
            rightExtendedCount: 0
        };

        function countExtendedFingers(landmarks) {
            if (!landmarks || landmarks.length < 21) return 0;
            var n = 0;
            if (landmarks[8].y < landmarks[6].y) n++;
            if (landmarks[12].y < landmarks[10].y) n++;
            if (landmarks[16].y < landmarks[14].y) n++;
            if (landmarks[20].y < landmarks[18].y) n++;
            if (Math.abs(landmarks[4].x - landmarks[3].x) > Math.abs(landmarks[2].x - landmarks[3].x) * 0.85) n++;
            return n;
        }

        function gestureReady(side) {
            var minF = handsOpt.minExtendedFingers != null ? handsOpt.minExtendedFingers : 0;
            if (minF <= 0) return true;
            var count = side === 'left' ? st.leftExtendedCount : st.rightExtendedCount;
            return count >= minF;
        }

        function canvasSize() {
            if (getCanvasSize) {
                try {
                    var o = getCanvasSize();
                    if (o && o.w > 0 && o.h > 0) return o;
                } catch (e) {}
            }
            if (videoEl) {
                return {
                    w: videoEl.clientWidth || window.innerWidth,
                    h: videoEl.clientHeight || window.innerHeight
                };
            }
            return { w: window.innerWidth, h: window.innerHeight };
        }

        function videoNormToCanvasNorm(nx, ny) {
            var ds = canvasSize();
            var cw = ds.w, ch = ds.h;
            if (!videoEl || !videoEl.videoWidth || !cw || !ch) {
                return { x: clamp(1 - nx, 0, 1), y: clamp(ny, 0, 1) };
            }
            var vw = videoEl.videoWidth;
            var vh = videoEl.videoHeight;
            var scale = Math.max(cw / vw, ch / vh);
            var offX = (cw - vw * scale) / 2;
            var offY = (ch - vh * scale) / 2;

            var px = (1 - nx) * vw * scale + offX;
            var py = ny * vh * scale + offY;
            return { x: clamp(px / cw, 0, 1), y: clamp(py / ch, 0, 1) };
        }

        function mapLandmark(lm) {
            return videoNormToCanvasNorm(lm.x, lm.y);
        }

        function mapAllLandmarks(lm) {
            var out = new Array(lm.length);
            for (var i = 0; i < lm.length; i++) out[i] = mapLandmark(lm[i]);
            return out;
        }

        function lerpPointer(ptr, targetX, targetY) {
            var s = handsOpt.smoothing != null ? handsOpt.smoothing : 0.4;
            ptr.prevX = ptr.x;
            ptr.prevY = ptr.y;
            if (!ptr.active || ptr.x < 0) {
                ptr.x = targetX;
                ptr.y = targetY;
                ptr.prevX = targetX;
                ptr.prevY = targetY;
            } else {
                ptr.x += (targetX - ptr.x) * s;
                ptr.y += (targetY - ptr.y) * s;
            }
            ptr.active = true;
        }

        function resetPointers() {
            st.leftHand.active = false;
            st.rightHand.active = false;
            st.leftLandmarks = null;
            st.rightLandmarks = null;
            st.leftPointer.active = false;
            st.rightPointer.active = false;
        }

        function expireStaleGestureCounts(now) {
            var holdMs = handsOpt.lostHoldMs != null ? handsOpt.lostHoldMs : 140;
            if ((now - st.leftSeenAt) > holdMs) st.leftExtendedCount = 0;
            if ((now - st.rightSeenAt) > holdMs) st.rightExtendedCount = 0;
        }

        function preserveRecentHands(now) {
            var holdMs = handsOpt.lostHoldMs != null ? handsOpt.lostHoldMs : 140;
            var minF = handsOpt.minExtendedFingers != null ? handsOpt.minExtendedFingers : 0;
            if ((now - st.leftSeenAt) <= holdMs && st.leftPointer.x >= 0) {
                st.leftHand.active = true;
                if (minF <= 0 || st.leftExtendedCount >= minF) st.leftPointer.active = true;
            }
            if ((now - st.rightSeenAt) <= holdMs && st.rightPointer.x >= 0) {
                st.rightHand.active = true;
                if (minF <= 0 || st.rightExtendedCount >= minF) st.rightPointer.active = true;
            }
        }

        function onHandsResults(results) {
            if (!st.running || st.mode !== 'camera') return;
            var now = performance.now();

            resetPointers();

            if (!results.multiHandLandmarks || !results.multiHandLandmarks.length) {
                expireStaleGestureCounts(now);
                preserveRecentHands(now);
                return;
            }

            var ds = canvasSize();
            var w = ds.w, h = ds.h;
            var entries = [];

            for (var hi = 0; hi < results.multiHandLandmarks.length; hi++) {
                var lm = results.multiHandLandmarks[hi];
                var tip = mapLandmark(lm[8]);
                entries.push({ nx: tip.x, ny: tip.y, mapped: mapAllLandmarks(lm) });
            }
            entries.sort(function (a, b) { return a.nx - b.nx; });

            function applySide(side, e) {
                var px = e.nx * w, py = e.ny * h;
                var hand = side === 'left' ? st.leftHand : st.rightHand;
                var ptr = side === 'left' ? st.leftPointer : st.rightPointer;
                hand.x = e.nx;
                hand.y = e.ny;
                hand.active = true;
                lerpPointer(ptr, px, py);
                if (side === 'left') st.leftSeenAt = now;
                else st.rightSeenAt = now;
                if (side === 'left') st.leftLandmarks = e.mapped;
                else st.rightLandmarks = e.mapped;
                var ext = countExtendedFingers(e.mapped);
                if (side === 'left') st.leftExtendedCount = ext;
                else st.rightExtendedCount = ext;
                if (!gestureReady(side)) {
                    ptr.active = false;
                    hand.active = true;
                }
            }

            if (entries.length === 1) {
                applySide(entries[0].nx < 0.5 ? 'left' : 'right', entries[0]);
            } else {
                applySide('left', entries[0]);
                applySide('right', entries[1]);
            }
        }

        function start() {
            if (typeof global.Hands === 'undefined' || typeof global.Camera === 'undefined') {
                st.mode = 'tap';
                onStatus('no-hands-lib');
                return Promise.reject(new Error('MediaPipe Hands/Camera not loaded'));
            }
            if (!videoEl) {
                st.mode = 'tap';
                onStatus('no-video');
                return Promise.reject(new Error('Video element not found'));
            }
            if (st.running) return Promise.resolve(true);

            st.mpHands = new global.Hands({
                locateFile: function (file) { return handsOpt.handsUrl + file; }
            });
            st.mpHands.setOptions({
                maxNumHands: clamp(handsOpt.maxNumHands != null ? handsOpt.maxNumHands : 2, 1, 2),
                modelComplexity: handsOpt.modelComplexity != null ? handsOpt.modelComplexity : 1,
                minDetectionConfidence: handsOpt.minConfidence || 0.6,
                minTrackingConfidence: handsOpt.minConfidence || 0.6
            });
            st.mpHands.onResults(onHandsResults);

            st.cameraObj = new global.Camera(videoEl, {
                onFrame: function () {
                    if (st.mpHands && videoEl.readyState >= 2) {
                        return st.mpHands.send({ image: videoEl });
                    }
                    return Promise.resolve();
                },
                width: handsOpt.cameraWidth || 640,
                height: handsOpt.cameraHeight || 480
            });

            return st.cameraObj.start().then(function () {
                st.mode = 'camera';
                st.running = true;
                onStatus('camera-on');
                return true;
            }).catch(function (err) {
                st.mode = 'tap';
                onStatus('no-camera');
                return Promise.reject(err);
            });
        }

        function stop() {
            st.running = false;
            st.mode = 'tap';
            if (st.cameraObj) {
                st.cameraObj.stop();
                st.cameraObj = null;
            }
            if (st.mpHands) {
                st.mpHands.close();
                st.mpHands = null;
            }
            resetPointers();
            onStatus('stopped');
        }

        function collectHitProbes() {
            var probes = [];
            var steps = clamp(handsOpt.sweepSteps != null ? handsOpt.sweepSteps : 2, 0, 5);

            function pushSwept(ptr, side) {
                if (!ptr.active || !gestureReady(side)) return;
                probes.push({ x: ptr.x, y: ptr.y });
                if (steps <= 0) return;
                var fromX = isFinite(ptr.prevX) ? ptr.prevX : ptr.x;
                var fromY = isFinite(ptr.prevY) ? ptr.prevY : ptr.y;
                for (var i = 1; i <= steps; i++) {
                    var t = i / (steps + 1);
                    probes.push({
                        x: fromX + (ptr.x - fromX) * t,
                        y: fromY + (ptr.y - fromY) * t
                    });
                }
            }

            pushSwept(st.leftPointer, 'left');
            pushSwept(st.rightPointer, 'right');
            return probes;
        }

        function isGestureReady(side) {
            return gestureReady(side);
        }

        function getExtendedFingerCount(side) {
            return side === 'left' ? st.leftExtendedCount : st.rightExtendedCount;
        }

        function clientToCanvas(canvas, clientX, clientY) {
            if (!canvas) return { x: clientX, y: clientY };
            var rect = canvas.getBoundingClientRect();
            var scaleX = canvas.width / (rect.width || canvas.width);
            var scaleY = canvas.height / (rect.height || canvas.height);
            return {
                x: (clientX - rect.left) * scaleX,
                y: (clientY - rect.top) * scaleY
            };
        }

        function drawSkeleton(ctx, landmarks, strokeColor, label) {
            if (!ctx || !landmarks || !landmarks.length) return;
            var ds = canvasSize();
            var w = ds.w, h = ds.h;
            ctx.save();
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowColor = strokeColor;
            ctx.shadowBlur = 12;
            ctx.beginPath();
            for (var c = 0; c < HAND_CONNECTIONS.length; c++) {
                var p1 = landmarks[HAND_CONNECTIONS[c][0]];
                var p2 = landmarks[HAND_CONNECTIONS[c][1]];
                if (!p1 || !p2) continue;
                ctx.moveTo(p1.x * w, p1.y * h);
                ctx.lineTo(p2.x * w, p2.y * h);
            }
            ctx.stroke();
            ctx.shadowBlur = 0;

            var tips = [4, 8, 12, 16, 20];
            for (var t = 0; t < tips.length; t++) {
                var pt = landmarks[tips[t]];
                if (!pt) continue;
                ctx.beginPath();
                ctx.arc(pt.x * w, pt.y * h, tips[t] === 8 ? 12 : 5, 0, Math.PI * 2);
                ctx.fillStyle = tips[t] === 8 ? strokeColor : 'rgba(255,255,255,0.9)';
                ctx.fill();
            }

            var wrist = landmarks[0];
            if (wrist && label) {
                ctx.font = "bold 13px 'Sarabun', sans-serif";
                ctx.fillStyle = '#ffffff';
                ctx.textAlign = 'center';
                ctx.shadowColor = 'rgba(0,0,0,0.85)';
                ctx.shadowBlur = 4;
                ctx.fillText(label, wrist.x * w, wrist.y * h - 22);
            }
            ctx.restore();
        }

        return {
            start: start,
            stop: stop,
            collectHitProbes: collectHitProbes,
            isGestureReady: isGestureReady,
            getExtendedFingerCount: getExtendedFingerCount,
            clientToCanvas: clientToCanvas,
            drawSkeleton: drawSkeleton,
            get mode() { return st.mode; },
            get leftHand() { return st.leftHand; },
            get rightHand() { return st.rightHand; },
            get leftLandmarks() { return st.leftLandmarks; },
            get rightLandmarks() { return st.rightLandmarks; },
            get leftPointer() { return st.leftPointer; },
            get rightPointer() { return st.rightPointer; }
        };
    }

    global.KampaiHands = {
        VERSION: VERSION,
        DEFAULT_HANDS: DEFAULT_HANDS,
        HAND_CONNECTIONS: HAND_CONNECTIONS,
        create: create
    };
})(typeof window !== 'undefined' ? window : this);
