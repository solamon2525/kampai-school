/* ═══════════════════════════════════════════════════════════════════════════
   kampai-ar.js — KAMPAI AR Engine (single source) · window.KampaiAR
   ───────────────────────────────────────────────────────────────────────────
   เครื่องมือกลางสำหรับเกม AR/กล้อง: เปิดกล้อง + ตรวจจับการเคลื่อนไหว + zone/hold
   + fallback แตะ + cleanup ครบ. รองรับ 3 detector:
     - 'framediff' (default) = frame-differencing ไม่พึ่ง lib/CDN (ทนเครื่องโรงเรียน/ออฟไลน์)
     - 'pose'                = MediaPipe Pose (jsdelivr) ท่าทางทั้งตัว · นิ้วประมาณ
     - 'hands'               = MediaPipe Hands (jsdelivr) ติดตามปลายนิ้วชี้ 2 มือ · แม่นสำหรับเกมชน/เจาะ
   ⚠️ อย่าแก้ในไฟล์เกม — แก้ที่นี่ที่เดียว มีผลทุกเกม AR. จูน knob ที่ config.js ของเกม
   ดูวิธีใช้ + ตารางจูน + Tuning Log ที่ AR-GAME.md
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
    'use strict';
    var VERSION = '1.3.1';

    // ค่าจูนเริ่มต้น (override ได้ผ่าน opts.tuning ใน config.js) — ดูคำอธิบายช่วงที่แนะนำใน AR-GAME.md
    var DEFAULT_TUNING = {
        downsample: { w: 120, h: 90 }, // framediff: ความละเอียดที่ย่อก่อน diff (เล็ก = เบา CPU)
        diffThreshold: 35,             // framediff: ความต่างพิกเซลขั้นต่ำที่นับเป็น "ขยับ" (สูง = ไวน้อย)
        minMotionRatio: 0.015,         // framediff: สัดส่วนพิกเซลขยับขั้นต่ำ/เฟรม (กัน noise)
        smoothing: 0.78,              // exponential smoothing: เก่า*s + ใหม่*(1-s) (สูง = นิ่ง/หน่วง)
        intervalMs: 55,               // framediff: คาบ loop (~18fps) (ต่ำ = ลื่น/กิน CPU)
        minConfidence: 0.5,           // pose/hands: ความมั่นใจขั้นต่ำ
        poseUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/', // jsdelivr เท่านั้น
        handsUrl: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1675469240/', // jsdelivr เท่านั้น
        maxNumHands: 2,               // hands: จำนวนมือสูงสุด (1–2)
        handsModelComplexity: 0,      // hands: 0=lite (เร็ว) · 1=full
        handLockMs: 650,              // hands: คงตำแหน่ง/โครงมือหลังหลุดจับชั่วคราว (ms)
        particles: true,              // visualizer: ฝุ่นเวทมนตร์ตามการขยับ (framediff)
        marker: true,                 // visualizer: จุดเรืองตำแหน่งผู้เล่น
        // ── Tier 2 (ดู AR-GAME.md): ยกมือ / กระโดด-ย่อ / พลัง ──
        handRaiseMargin: 0.04,        // hands: wrist ต้องสูงกว่าไหล่ (y น้อยกว่า) เกินค่านี้ ถึงนับว่ายก
        jumpVel: 0.045,               // gesture: สะโพกขึ้นเร็วเกินค่านี้ (สัดส่วนจอ/เฟรม) = กระโดด
        squatVel: 0.045,              // gesture: สะโพกลงเร็วเกินค่านี้ = ย่อ
        gestureCooldownMs: 700,       // gesture: เว้นช่วงขั้นต่ำระหว่าง jump/squat กัน double-fire
        filterType: 'ema',            // options: 'ema' | 'oneeuro'
        oneEuroMinCutoff: 1.0,
        oneEuroBeta: 0.007,
        oneEuroDCutoff: 1.0
    };

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function resolveEl(ref) { return ref ? (typeof ref === 'string' ? document.querySelector(ref) : ref) : null; }
    function evenCuts(n) { var c = []; for (var i = 1; i < n; i++) c.push(i / n); return c; }
    function zoneFromX(x, zones, cuts) {
        for (var i = 0; i < cuts.length; i++) { if (x < cuts[i]) return zones[i]; }
        return zones[zones.length - 1];
    }

    function OneEuroFilter(minCutoff, beta, dCutoff) {
        this.minCutoff = minCutoff || 1.0;
        this.beta = beta || 0.007;
        this.dCutoff = dCutoff || 1.0;
        this.xPrev = null;
        this.dxPrev = 0;
        this.tPrev = null;
    }
    OneEuroFilter.prototype.filter = function (val, timestamp, minCutoff, beta, dCutoff) {
        var mc = minCutoff !== undefined ? minCutoff : this.minCutoff;
        var b = beta !== undefined ? beta : this.beta;
        var dc = dCutoff !== undefined ? dCutoff : this.dCutoff;
        
        if (this.xPrev === null || this.tPrev === null) {
            this.xPrev = val;
            this.tPrev = timestamp;
            return val;
        }
        var dt = (timestamp - this.tPrev) / 1000.0;
        if (dt <= 0) dt = 0.016; // Fallback step (60 FPS)
        this.tPrev = timestamp;
        
        var freq = 1.0 / dt;
        var dx = (val - this.xPrev) * freq;
        
        var alphaD = 1.0 / (1.0 + (1.0 / (2.0 * Math.PI * dc)) / dt);
        var dxFilt = alphaD * dx + (1.0 - alphaD) * this.dxPrev;
        this.dxPrev = dxFilt;
        
        var cutoff = mc + b * Math.abs(dxFilt);
        var alphaP = 1.0 / (1.0 + (1.0 / (2.0 * Math.PI * cutoff)) / dt);
        
        var xFilt = alphaP * val + (1.0 - alphaP) * this.xPrev;
        this.xPrev = xFilt;
        return xFilt;
    };
    OneEuroFilter.prototype.reset = function () {
        this.xPrev = null;
        this.dxPrev = 0;
        this.tPrev = null;
    };

    function create(opts) {
        opts = opts || {};
        var tuning = Object.assign({}, DEFAULT_TUNING, opts.tuning || {});
        var zones = opts.zones || ['left', 'center', 'right'];
        var cuts = opts.cuts || (zones.length === 3 ? [1 / 3, 2 / 3] : zones.length === 2 ? [0.5] : evenCuts(zones.length));
        var holdMs = opts.holdMs != null ? opts.holdMs : 2500; // default: เผื่อเวลาตัดสินใจ (เกมส่วนใหญ่ override ใน config)
        var detector = opts.detector === 'hands' ? 'hands' : (opts.detector === 'pose' ? 'pose' : 'framediff');
        // input mode: 'horizontal' (default — x→zones, เดิม) | 'hands' (ยกมือ ซ้าย/ขวา/สองมือ → zones)
        var inputMode = opts.mode === 'hands' ? 'hands' : 'horizontal';
        var video = resolveEl(opts.video);
        var canvas = resolveEl(opts.canvas);
        var cb = {
            onZone: opts.onZone || function () {},
            onHoldProgress: opts.onHoldProgress || function () {},
            onCommit: opts.onCommit || function () {},
            onStatus: opts.onStatus || function () {},
            onSignals: opts.onSignals || function () {}, // ต่อเนื่อง: {x,y,energy,leftUp,rightUp,bothUp}
            onGesture: opts.onGesture || function () {}, // discrete: 'jump' | 'squat'
            onEnergy: opts.onEnergy || function () {}     // 0..1 ระดับการเคลื่อนไหว
        };

        var st = {
            stream: null, active: false, running: false, mode: 'tap', // 'camera' | 'tap'
            x: 0.5, y: 0.5, energy: 0, lastZone: null, holdStart: 0, holdProgress: 0, committedZone: null,
            rafId: 0, intervalId: 0, prevFrame: null, off: null, offCtx: null, particles: [],
            pose: null, mpHands: null,
            hands: { left: false, right: false, both: false }, handZone: null,
            hipBaseline: null, prevHipY: null, lastGestureAt: 0,
            leftHand: { x: 0.5, y: 0.5, active: false },
            rightHand: { x: 0.5, y: 0.5, active: false },
            leftHandLock: { locked: false, until: 0 },
            rightHandLock: { locked: false, until: 0 },
            leftHandLandmarks: null,
            rightHandLandmarks: null,
            rawX: 0.5, rawY: 0.5,
            rawLeftHand: { x: 0.5, y: 0.5, active: false },
            rawRightHand: { x: 0.5, y: 0.5, active: false }
        };
        st.filters = {
            centroidX: new OneEuroFilter(tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff),
            centroidY: new OneEuroFilter(tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff),
            leftX: new OneEuroFilter(tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff),
            leftY: new OneEuroFilter(tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff),
            rightX: new OneEuroFilter(tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff),
            rightY: new OneEuroFilter(tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff)
        };
        function resetHandLocks() {
            st.leftHandLock.locked = false;
            st.leftHandLock.until = 0;
            st.rightHandLock.locked = false;
            st.rightHandLock.until = 0;
            st.leftHandLandmarks = null;
            st.rightHandLandmarks = null;
        }
        function resetFilters() {
            if (st.filters) {
                st.filters.centroidX.reset();
                st.filters.centroidY.reset();
                st.filters.leftX.reset();
                st.filters.leftY.reset();
                st.filters.rightX.reset();
                st.filters.rightY.reset();
            }
            resetHandLocks();
        }
        function status(s) { try { cb.onStatus(s); } catch (e) {} }

        // ── camera lifecycle ──
        async function start() {
            stopLoop();
            resetFilters();
            if (!video) { status('error'); return false; }
            try {
                if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('no getUserMedia');
                st.stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false
                });
                video.srcObject = st.stream; video.muted = true; video.playsInline = true;
                await video.play();
                st.mode = 'camera'; status('camera-on');
                if (detector === 'hands') await startHands();
                else if (detector === 'pose') await startPose();
                else startFrameDiff();
                return true;
            } catch (err) {
                st.mode = 'tap'; status('no-camera'); // เกมต้องเปิดโหมดแตะ (บังคับมี fallback)
                return false;
            }
        }
        function stop() {
            stopLoop();
            if (st.mpHands) { try { st.mpHands.close(); } catch (e) {} st.mpHands = null; }
            if (st.stream) { try { st.stream.getTracks().forEach(function (t) { t.stop(); }); } catch (e) {} st.stream = null; }
            if (video) { try { video.srcObject = null; } catch (e) {} }
            st.prevFrame = null; st.particles = []; st.active = false; st.committedZone = null;
        }
        function stopLoop() {
            if (st.intervalId) { clearInterval(st.intervalId); st.intervalId = 0; }
            if (st.rafId) { cancelAnimationFrame(st.rafId); st.rafId = 0; }
            st.running = false;
        }
        function setActive(b) {
            st.active = !!b;
            if (b) {
                st.lastZone = null;
                st.committedZone = null;
                st.holdProgress = 0;
                st.handZone = null;
                resetFilters();
            }
        }

        // ── detector: framediff ──
        function startFrameDiff() {
            var offW = tuning.downsample.w, offH = tuning.downsample.h;
            st.off = document.createElement('canvas'); st.off.width = offW; st.off.height = offH;
            st.offCtx = st.off.getContext('2d', { willReadFrequently: true });
            var ctx = canvas ? canvas.getContext('2d') : null;
            st.running = true;
            st.intervalId = setInterval(function () {
                if (!st.running || !video || video.paused || video.ended) return;
                if (video.readyState < 2 || !video.videoWidth) return;
                if (ctx) syncCanvasSize(canvas);
                tickParticles();
                st.offCtx.drawImage(video, 0, 0, offW, offH);
                var frame = st.offCtx.getImageData(0, 0, offW, offH).data;
                if (st.prevFrame) {
                    var sumX = 0, sumY = 0, motion = [], th = tuning.diffThreshold;
                    var topLeft = 0, topRight = 0; // ยกมือ (best-effort): มวลการขยับครึ่งบน แยกซ้าย/ขวา
                    for (var i = 0; i < frame.length; i += 4) {
                        var d = Math.abs(frame[i] - st.prevFrame[i]) + Math.abs(frame[i + 1] - st.prevFrame[i + 1]) + Math.abs(frame[i + 2] - st.prevFrame[i + 2]);
                        if (d > th) {
                            var idx = i / 4, px = idx % offW, py = Math.floor(idx / offW);
                            motion.push({ x: px, y: py }); sumX += px; sumY += py;
                            if (py < offH * 0.5) { if ((1.0 - px / offW) < 0.5) topLeft++; else topRight++; }
                        }
                    }
                    var ratio = motion.length / (offW * offH);
                    st.energy = st.energy * 0.6 + Math.min(1, ratio / 0.06) * 0.4; // normalize ~ พลัง 0..1
                    if (motion.length > Math.floor(offW * offH * tuning.minMotionRatio)) {
                        var target = 1.0 - (sumX / motion.length) / offW; // mirror
                        var ty = (sumY / motion.length) / offH;
                        var now = Date.now();
                        
                        st.rawX = target;
                        st.rawY = ty;
                        st.rawLeftHand.x = target;
                        st.rawLeftHand.y = ty;
                        st.rawLeftHand.active = true;
                        st.rawRightHand.x = target;
                        st.rawRightHand.y = ty;
                        st.rawRightHand.active = true;

                        if (tuning.filterType === 'oneeuro') {
                            st.x = st.filters.centroidX.filter(target, now, tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff);
                            st.y = st.filters.centroidY.filter(ty, now, tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff);
                            st.leftHand.x = st.filters.leftX.filter(target, now, tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff);
                            st.leftHand.y = st.filters.leftY.filter(ty, now, tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff);
                            st.rightHand.x = st.filters.rightX.filter(target, now, tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff);
                            st.rightHand.y = st.filters.rightY.filter(ty, now, tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff);
                        } else {
                            st.x = st.x * tuning.smoothing + target * (1 - tuning.smoothing);
                            st.y = st.y * tuning.smoothing + ty * (1 - tuning.smoothing);
                            st.leftHand.x = st.x;
                            st.leftHand.y = st.y;
                            st.rightHand.x = st.x;
                            st.rightHand.y = st.y;
                        }
                        
                        if (tuning.particles && ctx) spawnParticles(motion, offW, offH, canvas);
                        st.leftHand.active = true;
                        st.rightHand.active = true;

                        // ยกมือ framediff (หยาบ — pose แม่นกว่า; tap fallback คุมเสมอ)
                        var topMin = Math.floor(offW * offH * 0.01);
                        var lUp = topLeft > topMin, rUp = topRight > topMin;
                        setHands(lUp && rUp ? false : lUp, lUp && rUp ? false : rUp, lUp && rUp);
                    } else {
                        st.energy *= 0.85;
                        setHands(false, false, false);
                        st.leftHand.active = false;
                        st.rightHand.active = false;
                        st.rawLeftHand.active = false;
                        st.rawRightHand.active = false;
                    }
                    emitSignals();
                }
                st.prevFrame = frame;
                if (ctx) drawVisuals(ctx, canvas);
                evalZone();
            }, tuning.intervalMs);
        }

        // ── detector: pose (MediaPipe) ──
        async function startPose() {
            status('pose-loading');
            try { await loadPoseLib(); }
            catch (e) { startFrameDiff(); return; } // โหลด lib ไม่ได้ → ใช้ framediff แทน
            st.pose = new window.Pose({ locateFile: function (f) { return tuning.poseUrl + f; } });
            st.pose.setOptions({ modelComplexity: 0, smoothLandmarks: true, minDetectionConfidence: tuning.minConfidence, minTrackingConfidence: tuning.minConfidence });
            st.pose.onResults(onPoseResults);
            status('camera-on');
            var ctx = canvas ? canvas.getContext('2d') : null;
            st.running = true;
            (function loop() {
                if (!st.running) return;
                if (video.readyState >= 2 && st.pose) { st.pose.send({ image: video }).catch(function () {}); }
                if (ctx) drawVisuals(ctx, canvas);
                st.rafId = requestAnimationFrame(loop);
            })();
        }
        function loadPoseLib() {
            return new Promise(function (resolve, reject) {
                if (window.Pose) return resolve();
                var s = document.createElement('script');
                s.src = tuning.poseUrl + 'pose.js'; s.crossOrigin = 'anonymous';
                s.onload = resolve; s.onerror = reject;
                document.head.appendChild(s);
            });
        }
        // ── detector: hands (MediaPipe Hands — ปลายนิ้วชี้ landmark 8) ──
        async function startHands() {
            status('hands-loading');
            try { await loadHandsLib(); }
            catch (e) { startFrameDiff(); return; } // โหลด lib ไม่ได้ → ใช้ framediff แทน
            st.mpHands = new window.Hands({ locateFile: function (f) { return tuning.handsUrl + f; } });
            st.mpHands.setOptions({
                maxNumHands: clamp(tuning.maxNumHands != null ? tuning.maxNumHands : 2, 1, 2),
                modelComplexity: tuning.handsModelComplexity != null ? tuning.handsModelComplexity : 0,
                minDetectionConfidence: tuning.minConfidence,
                minTrackingConfidence: tuning.minConfidence
            });
            st.mpHands.onResults(onHandsResults);
            status('camera-on');
            var ctx = canvas ? canvas.getContext('2d') : null;
            st.running = true;
            (function loop() {
                if (!st.running) return;
                if (video.readyState >= 2 && st.mpHands) { st.mpHands.send({ image: video }).catch(function () {}); }
                if (ctx) drawVisuals(ctx, canvas);
                st.rafId = requestAnimationFrame(loop);
            })();
        }
        function loadHandsLib() {
            return new Promise(function (resolve, reject) {
                if (window.Hands) return resolve();
                var s = document.createElement('script');
                s.src = tuning.handsUrl + 'hands.js'; s.crossOrigin = 'anonymous';
                s.onload = resolve; s.onerror = reject;
                document.head.appendChild(s);
            });
        }
        function handednessLabel(entry) {
            if (!entry) return 'Right';
            if (entry.label) return entry.label;
            if (entry[0] && entry[0].label) return entry[0].label;
            return 'Right';
        }
        function updateTrackedHand(side, rawX, rawY, active, now) {
            var hand = side === 'left' ? st.leftHand : st.rightHand;
            var raw = side === 'left' ? st.rawLeftHand : st.rawRightHand;
            var fx = side === 'left' ? st.filters.leftX : st.filters.rightX;
            var fy = side === 'left' ? st.filters.leftY : st.filters.rightY;
            raw.x = rawX; raw.y = rawY; raw.active = active;
            if (!active) { hand.active = false; return; }
            if (tuning.filterType === 'oneeuro') {
                hand.x = fx.filter(rawX, now, tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff);
                hand.y = fy.filter(rawY, now, tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff);
            } else {
                hand.x = hand.x * tuning.smoothing + rawX * (1 - tuning.smoothing);
                hand.y = hand.y * tuning.smoothing + rawY * (1 - tuning.smoothing);
            }
            hand.active = true;
        }
        function copyLandmarksMirrored(lm) {
            var out = new Array(lm.length);
            for (var j = 0; j < lm.length; j++) {
                out[j] = { x: 1 - lm[j].x, y: lm[j].y };
            }
            return out;
        }
        function applyHandLock(side, detected, landmarksCopy, now) {
            var hand = side === 'left' ? st.leftHand : st.rightHand;
            var raw = side === 'left' ? st.rawLeftHand : st.rawRightHand;
            var lock = side === 'left' ? st.leftHandLock : st.rightHandLock;
            var lmKey = side === 'left' ? 'leftHandLandmarks' : 'rightHandLandmarks';
            var lockMs = tuning.handLockMs != null ? tuning.handLockMs : 650;

            if (detected) {
                lock.locked = true;
                lock.until = now + lockMs;
                st[lmKey] = landmarksCopy;
                raw.active = true;
                return;
            }
            if (lock.locked && now < lock.until) {
                hand.active = true;
                raw.active = true;
                return;
            }
            lock.locked = false;
            hand.active = false;
            raw.active = false;
            st[lmKey] = null;
        }
        function onHandsResults(res) {
            var now = Date.now();
            var detected = { left: false, right: false };
            var freshLandmarks = { left: null, right: null };

            var landmarks = res && res.multiHandLandmarks;
            if (!landmarks || !landmarks.length) {
                applyHandLock('left', false, null, now);
                applyHandLock('right', false, null, now);
                st.energy *= 0.85;
                if (st.leftHand.active && st.rightHand.active) setHands(false, false, true);
                else if (st.leftHand.active) setHands(true, false, false);
                else if (st.rightHand.active) setHands(false, true, false);
                else setHands(false, false, false);
                emitSignals();
                evalZone();
                return;
            }

            var handedness = res.multiHandedness || [];
            var sumX = 0, sumY = 0, count = 0, prevCx = st.x, prevCy = st.y;

            for (var i = 0; i < landmarks.length; i++) {
                var lm = landmarks[i];
                var tip = lm[8]; // INDEX_FINGER_TIP
                if (!tip) continue;
                var hx = 1 - tip.x; // mirror (selfie)
                var hy = tip.y;
                var side = handednessLabel(handedness[i]) === 'Left' ? 'left' : 'right';
                updateTrackedHand(side, hx, hy, true, now);
                detected[side] = true;
                freshLandmarks[side] = copyLandmarksMirrored(lm);
                sumX += hx; sumY += hy; count++;
            }

            applyHandLock('left', detected.left, freshLandmarks.left, now);
            applyHandLock('right', detected.right, freshLandmarks.right, now);

            if (count > 0) {
                var cx = sumX / count, cy = sumY / count;
                st.rawX = cx; st.rawY = cy;
                if (tuning.filterType === 'oneeuro') {
                    st.x = st.filters.centroidX.filter(cx, now, tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff);
                    st.y = st.filters.centroidY.filter(cy, now, tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff);
                } else {
                    st.x = st.x * tuning.smoothing + cx * (1 - tuning.smoothing);
                    st.y = st.y * tuning.smoothing + cy * (1 - tuning.smoothing);
                }
                st.energy = st.energy * 0.7 + Math.min(1, Math.sqrt((cx - prevCx) * (cx - prevCx) + (cy - prevCy) * (cy - prevCy)) * 12) * 0.3;
            } else {
                st.energy *= 0.85;
            }

            if (st.leftHand.active && st.rightHand.active) setHands(false, false, true);
            else if (st.leftHand.active) setHands(true, false, false);
            else if (st.rightHand.active) setHands(false, true, false);
            else setHands(false, false, false);

            emitSignals();
            evalZone();
        }

        function onPoseResults(res) {
            if (!res || !res.poseLandmarks || !res.poseLandmarks[0]) return;
            var lm = res.poseLandmarks;
            var nose = lm[0];
            var target = 1 - nose.x; // flip x (mirror)
            var now = Date.now();

            st.rawX = target;
            st.rawY = nose.y;

            if (tuning.filterType === 'oneeuro') {
                st.x = st.filters.centroidX.filter(target, now, tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff);
                st.y = st.filters.centroidY.filter(nose.y, now, tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff);
            } else {
                st.x = st.x * tuning.smoothing + target * (1 - tuning.smoothing);
                st.y = st.y * tuning.smoothing + nose.y * (1 - tuning.smoothing);
            }

            // Left index finger = 19, Right index finger = 20
            var li = lm[19], ri = lm[20];
            if (li) {
                var lTarget = 1 - li.x; // mirror
                st.rawLeftHand.x = lTarget;
                st.rawLeftHand.y = li.y;
                st.rawLeftHand.active = (li.visibility > 0.5);
                if (tuning.filterType === 'oneeuro') {
                    st.leftHand.x = st.filters.leftX.filter(lTarget, now, tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff);
                    st.leftHand.y = st.filters.leftY.filter(li.y, now, tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff);
                } else {
                    st.leftHand.x = st.leftHand.x * tuning.smoothing + lTarget * (1 - tuning.smoothing);
                    st.leftHand.y = st.leftHand.y * tuning.smoothing + li.y * (1 - tuning.smoothing);
                }
                st.leftHand.active = (li.visibility > 0.5);
            } else {
                st.leftHand.active = false;
                st.rawLeftHand.active = false;
            }

            if (ri) {
                var rTarget = 1 - ri.x; // mirror
                st.rawRightHand.x = rTarget;
                st.rawRightHand.y = ri.y;
                st.rawRightHand.active = (ri.visibility > 0.5);
                if (tuning.filterType === 'oneeuro') {
                    st.rightHand.x = st.filters.rightX.filter(rTarget, now, tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff);
                    st.rightHand.y = st.filters.rightY.filter(ri.y, now, tuning.oneEuroMinCutoff, tuning.oneEuroBeta, tuning.oneEuroDCutoff);
                } else {
                    st.rightHand.x = st.rightHand.x * tuning.smoothing + rTarget * (1 - tuning.smoothing);
                    st.rightHand.y = st.rightHand.y * tuning.smoothing + ri.y * (1 - tuning.smoothing);
                }
                st.rightHand.active = (ri.visibility > 0.5);
            } else {
                st.rightHand.active = false;
                st.rawRightHand.active = false;
            }

            // ── ยกมือ: ข้อมือ (15 ซ้าย, 16 ขวา) เหนือไหล่ (11,12) เกิน margin ── (screen-side ใช้ x mirror)
            var ls = lm[11], rs = lm[12], lw = lm[15], rw = lm[16], m = tuning.handRaiseMargin;
            var ups = [];
            if (lw && ls && lw.y < ls.y - m) ups.push(1 - lw.x);
            if (rw && rs && rw.y < rs.y - m) ups.push(1 - rw.x);
            if (ups.length >= 2) setHands(false, false, true);
            else if (ups.length === 1) setHands(ups[0] < 0.5, ups[0] >= 0.5, false);
            else setHands(false, false, false);

            // ── กระโดด/ย่อ: ความเร็วแกน Y ของสะโพก (23,24) ──
            var lh = lm[23], rh = lm[24];
            if (lh && rh) {
                var hipY = (lh.y + rh.y) / 2;
                if (st.prevHipY != null) detectGesture(hipY - st.prevHipY);
                st.prevHipY = hipY;
            }

            // พลัง ≈ ระยะขยับของจมูกเทียบเฟรมก่อน (มี smoothing แล้วใน st.x/y → ใช้ res ดิบประมาณ)
            st.energy = st.energy * 0.7 + Math.min(1, Math.abs(target - st.x) * 8) * 0.3;

            emitSignals();
            evalZone();
        }

        // ── Tier 2 helpers: hands / signals / gesture ──
        function setHands(l, r, b) { st.hands.left = !!l; st.hands.right = !!r; st.hands.both = !!b; st.handZone = b ? 'both' : l ? 'left' : r ? 'right' : null; }
        function emitSignals() {
            try { cb.onSignals({ x: st.x, y: st.y, energy: st.energy, leftUp: st.hands.left, rightUp: st.hands.right, bothUp: st.hands.both }); } catch (e) {}
            try { cb.onEnergy(clamp(st.energy, 0, 1)); } catch (e) {}
        }
        function detectGesture(dy) {
            // dy < 0 = สะโพกขึ้น (y น้อยลง) = กระโดด · dy > 0 = ลง = ย่อ
            var now = Date.now();
            if (now - st.lastGestureAt < tuning.gestureCooldownMs) return;
            if (dy < -tuning.jumpVel) { st.lastGestureAt = now; try { cb.onGesture('jump'); } catch (e) {} }
            else if (dy > tuning.squatVel) { st.lastGestureAt = now; try { cb.onGesture('squat'); } catch (e) {} }
        }

        // เลือกโซนปัจจุบันตามโหมด — horizontal: จาก x · hands: จากการยกมือ (null = ไม่เลือก)
        function currentZone() {
            if (inputMode === 'hands') return st.handZone;
            return zoneFromX(clamp(st.x, 0, 1), zones, cuts);
        }

        // ── zone + hold ──
        function evalZone() {
            if (!st.active) return;
            var z = currentZone();
            try { cb.onZone(z); } catch (e) {}
            if (z == null) { // hands mode: ไม่มีมือยก → รีเซ็ต hold (ไม่ commit)
                if (st.lastZone) { try { cb.onHoldProgress(st.lastZone, 0); } catch (e) {} }
                st.lastZone = null; st.holdProgress = 0;
                return;
            }
            if (z === st.lastZone) {
                st.holdProgress = clamp((Date.now() - st.holdStart) / holdMs, 0, 1);
                try { cb.onHoldProgress(z, st.holdProgress); } catch (e) {}
                if (st.holdProgress >= 1 && !st.committedZone) commit(z);
            } else {
                if (st.lastZone) { try { cb.onHoldProgress(st.lastZone, 0); } catch (e) {} }
                st.lastZone = z; st.holdStart = Date.now(); st.holdProgress = 0;
            }
        }
        function commit(z) { if (st.committedZone) return; st.committedZone = z; try { cb.onCommit(z); } catch (e) {} }
        function tap(z) { if (!st.active || st.committedZone) return; commit(z); } // fallback แตะ — path เดียวกับ hold ครบ

        // ── visualizer ──
        function syncCanvasSize(c) {
            if (c.offsetWidth > 0 && c.offsetHeight > 0 && (c.width !== c.offsetWidth || c.height !== c.offsetHeight)) {
                c.width = c.offsetWidth; c.height = c.offsetHeight;
            }
        }
        function tickParticles() {
            for (var i = 0; i < st.particles.length; i++) { var p = st.particles[i]; p.x += p.vx; p.y += p.vy; p.life -= 0.05; }
            st.particles = st.particles.filter(function (p) { return p.life > 0; });
        }
        function spawnParticles(motion, offW, offH, c) {
            var add = motion.filter(function () { return Math.random() < 0.08; }).map(function (p) {
                return { x: (1.0 - p.x / offW) * c.width, y: (p.y / offH) * c.height, life: 1.0, size: Math.random() * 3 + 2, vx: (Math.random() - 0.5) * 1.5, vy: (Math.random() - 0.5) * 1.5 };
            });
            st.particles = st.particles.concat(add);
            if (st.particles.length > 200) st.particles = st.particles.slice(-200);
        }
        function drawVisuals(ctx, c) {
            ctx.clearRect(0, 0, c.width, c.height);
            ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2; ctx.setLineDash([8, 8]); ctx.beginPath();
            for (var i = 0; i < cuts.length; i++) { ctx.moveTo(c.width * cuts[i], 0); ctx.lineTo(c.width * cuts[i], c.height); }
            ctx.stroke(); ctx.setLineDash([]);
            if (tuning.particles) for (var j = 0; j < st.particles.length; j++) { var p = st.particles[j]; ctx.fillStyle = 'rgba(251,191,36,' + (p.life * 0.45) + ')'; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
            if (tuning.marker && st.mode === 'camera') {
                var mx = st.x * c.width, my = c.height - Math.min(240, c.height * 0.3);
                var g = ctx.createRadialGradient(mx, my, 5, mx, my, 50);
                g.addColorStop(0, 'rgba(16,185,129,0.35)'); g.addColorStop(1, 'rgba(16,185,129,0)');
                ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, 50, 0, Math.PI * 2); ctx.fill();
            }
        }

        return {
            start: start, stop: stop, setActive: setActive, tap: tap,
            detector: detector, inputMode: inputMode, zones: zones, cuts: cuts, holdMs: holdMs, tuning: tuning,
            get mode() { return st.mode; }, get x() { return st.x; }, get y() { return st.y; },
            get energy() { return st.energy; }, get hands() { return st.hands; }, get zone() { return st.lastZone; },
            get leftHand() { return st.leftHand; }, get rightHand() { return st.rightHand; },
            get leftHandLandmarks() { return st.leftHandLandmarks; },
            get rightHandLandmarks() { return st.rightHandLandmarks; },
            get leftHandLocked() { return st.leftHandLock.locked && Date.now() < st.leftHandLock.until; },
            get rightHandLocked() { return st.rightHandLock.locked && Date.now() < st.rightHandLock.until; },
            get rawX() { return st.rawX; }, get rawY() { return st.rawY; },
            get rawLeftHand() { return st.rawLeftHand; }, get rawRightHand() { return st.rawRightHand; }
        };
    }

    window.KampaiAR = { VERSION: VERSION, create: create, DEFAULT_TUNING: DEFAULT_TUNING };
})();
