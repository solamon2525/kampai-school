/* split-presence.js — ตรวจจับหัว P1/P2 ด้วย MediaPipe Face Detection (แบ่งจอซ้าย–ขวา) */
(function (global) {
    'use strict';

    var FACE_URL = 'https://cdn.jsdelivr.net/npm/@mediapipe/face_detection/';

    function resolveEl(elOrSel) {
        if (!elOrSel) return null;
        return typeof elOrSel === 'string' ? document.querySelector(elOrSel) : elOrSel;
    }

    function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

    function blankPlayer() {
        return { x: 0, y: 0, active: false, lastSeen: 0, hasPos: false };
    }

    function create(opts) {
        opts = opts || {};
        var videoEl = resolveEl(opts.video);
        var getCanvasSize = opts.getCanvasSize || function () {
            return { w: window.innerWidth, h: window.innerHeight };
        };
        var holdMs = opts.lostHoldMs != null ? opts.lostHoldMs : 600;
        var smooth = opts.smoothing != null ? opts.smoothing : 0.35;
        var faceModel = opts.model === 'short' ? 'short' : 'full';

        var st = {
            running: false,
            mpFace: null,
            pending: false,
            smooth: smooth,
            players: { 1: blankPlayer(), 2: blankPlayer() }
        };

        function smoothPoint(id, x, y) {
            var p = st.players[id];
            if (!p.hasPos) {
                p.x = x;
                p.y = y;
                p.hasPos = true;
                return;
            }
            var s = st.smooth;
            p.x += (x - p.x) * s;
            p.y += (y - p.y) * s;
        }

        function canvasSize() {
            try {
                var o = getCanvasSize();
                if (o && o.w > 0 && o.h > 0) return o;
            } catch (e) { /* */ }
            return { w: window.innerWidth, h: window.innerHeight };
        }

        function videoNormToCanvas(nx, ny) {
            var ds = canvasSize();
            var cw = ds.w;
            var ch = ds.h;
            if (!videoEl || !videoEl.videoWidth || !cw || !ch) {
                return { x: clamp(nx, 0, 1) * cw, y: clamp(ny, 0, 1) * ch };
            }
            var vw = videoEl.videoWidth;
            var vh = videoEl.videoHeight;
            var scale = Math.max(cw / vw, ch / vh);
            var offX = (cw - vw * scale) / 2;
            var offY = (ch - vh * scale) / 2;
            var px = clamp(nx, 0, 1) * vw * scale + offX;
            var py = clamp(ny, 0, 1) * vh * scale + offY;
            return { x: px, y: py };
        }

        function assignFace(id, best, now) {
            var p = st.players[id];
            if (best) {
                smoothPoint(id, best.x, best.y);
                p.active = true;
                p.lastSeen = now;
            } else if (now - p.lastSeen > holdMs) {
                p.active = false;
            }
        }

        function onResults(results) {
            st.pending = false;
            if (!st.running) return;
            var now = performance.now();
            var mid = 0.5;
            var p1Best = null;
            var p2Best = null;
            var dets = (results && results.detections) ? results.detections : [];

            for (var i = 0; i < dets.length; i++) {
                var det = dets[i];
                var bb = det.boundingBox;
                if (!bb) continue;
                var cx = 1 - bb.xCenter;
                var headY = bb.yCenter - bb.height * 0.55;
                var pt = videoNormToCanvas(cx, headY);
                var area = (bb.width || 0) * (bb.height || 0);
                if (cx < mid) {
                    if (!p1Best || area > p1Best.area) p1Best = { x: pt.x, y: pt.y, area: area };
                } else if (!p2Best || area > p2Best.area) {
                    p2Best = { x: pt.x, y: pt.y, area: area };
                }
            }

            assignFace(1, p1Best, now);
            assignFace(2, p2Best, now);
        }

        function loadScript(url) {
            return new Promise(function (resolve, reject) {
                var s = document.createElement('script');
                s.src = url;
                s.crossOrigin = 'anonymous';
                s.onload = resolve;
                s.onerror = reject;
                document.head.appendChild(s);
            });
        }

        function ensureFaceModel() {
            if (st.mpFace) return Promise.resolve(st.mpFace);
            if (!global.FaceDetection) {
                return loadScript(FACE_URL + 'face_detection.js').then(function () {
                    if (!global.FaceDetection) throw new Error('FaceDetection unavailable');
                    st.mpFace = new global.FaceDetection({
                        locateFile: function (f) { return FACE_URL + f; }
                    });
                    st.mpFace.setOptions({
                        model: faceModel,
                        minDetectionConfidence: opts.minConfidence != null ? opts.minConfidence : 0.5
                    });
                    st.mpFace.onResults(onResults);
                    return st.mpFace;
                });
            }
            st.mpFace = new global.FaceDetection({
                locateFile: function (f) { return FACE_URL + f; }
            });
            st.mpFace.setOptions({
                model: faceModel,
                minDetectionConfidence: opts.minConfidence != null ? opts.minConfidence : 0.5
            });
            st.mpFace.onResults(onResults);
            return Promise.resolve(st.mpFace);
        }

        return {
            start: function () {
                st.running = true;
                st.players[1] = blankPlayer();
                st.players[2] = blankPlayer();
                return ensureFaceModel();
            },
            stop: function () {
                st.running = false;
                st.pending = false;
                st.players[1] = blankPlayer();
                st.players[2] = blankPlayer();
            },
            tick: function () {
                if (!st.running || st.pending || !st.mpFace || !videoEl) return;
                if (videoEl.readyState < 2) return;
                st.pending = true;
                st.mpFace.send({ image: videoEl }).catch(function () { st.pending = false; });
            },
            getPlayers: function () { return st.players; },
            bothPresent: function () {
                return st.players[1].active && st.players[2].active;
            },
            playerPresent: function (id) {
                return !!(st.players[id] && st.players[id].active);
            }
        };
    }

    global.MultiplySplitPresence = { create: create };
}(window));
