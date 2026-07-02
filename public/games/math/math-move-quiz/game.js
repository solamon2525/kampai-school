/* game.js — ลอจิกเกม "ขยับตอบเลข" (อ่าน config/data + KAMPAI SDK + KampaiAR engine)
   กล้องจริงเต็มจอ + แผนคำตอบซ้าย/ขวา · เอียงตัวค้างจนแถบเต็ม · ไม่มีกล้อง → แตะแผง */
(function () {
    'use strict';
    var CFG = window.GAME_CONFIG, DATA = window.GAME_DATA;
    var $ = function (id) { return document.getElementById(id); };
    var SIDES = ['left', 'right'];
    var ZONE_EL = { left: 'panelLeft', right: 'panelRight' };

    KAMPAI.setSlug(CFG.SLUG);
    KAMPAI.sound.mountToggles();
    KAMPAI.sound.defaultBgm(CFG.BGM || 'cheerful');

    var ST = { score: 0, round: 0, questions: [], timer: null, sec: 0, roundLocked: true, started: false, correctCount: 0, wrongCount: 0, timeUpCount: 0 };
    var ar = null;

    function renderPlayer() {
        var s = KAMPAI.student, stt = KAMPAI.stats, chip = $('player-chip');
        if (!s || !chip) return;
        var av = s.photoUrl ? '<img src="' + s.photoUrl + '" alt="">' : '<div class="ini">' + ((s.displayName || '?')[0]) + '</div>';
        var best = stt ? ' · <b style="color:#fbbf24">สถิติ ' + (stt.personalBest || 0) + '</b>' : '';
        chip.innerHTML = av + '<span>' + s.displayName + best + '</span>';
        chip.style.display = 'flex';
    }
    function renderLeaderboard() {
        var rows = KAMPAI.leaderboard || [], box = $('lbBox'), list = $('lbList');
        if (!rows.length) { box.style.display = 'none'; return; }
        var medals = ['🥇', '🥈', '🥉'];
        list.innerHTML = rows.slice(0, 5).map(function (r) {
            return '<li class="' + (r.isMe ? 'me' : '') + '"><span class="lb-rank">' + (medals[r.rank - 1] || r.rank) + '</span>' +
                '<span class="lb-name">' + r.displayName + (r.isMe ? ' (คุณ)' : '') + '</span>' +
                '<span class="lb-score">' + (r.personalBest || 0) + '</span></li>';
        }).join('');
        box.style.display = 'block';
    }
    KAMPAI.onReady(function () { renderPlayer(); renderLeaderboard(); });

    function showScreen(id) {
        var els = document.querySelectorAll('.screen');
        for (var i = 0; i < els.length; i++) els[i].classList.remove('active');
        $(id).classList.add('active');
    }
    function setStatus() {
        var holdSec = Math.round((CFG.HOLD_MS || 4000) / 1000);
        var mode = ar && ar.mode === 'camera' ? '🎥 เอียงตัวค้าง ~' + holdSec + 'วิ' : '✋ แตะแผง';
        $('status-tag').textContent = mode + (ST.sec > 0 ? ' · ⏱ ' + ST.sec + 's' : '');
    }

    function stopAR() {
        if (ar) {
            ar.stop();
            ar = null;
        }
    }

    function buildAR() {
        return KampaiAR.create({
            video: '#arVideo', canvas: '#arCanvas',
            detector: CFG.DETECTOR, zones: CFG.ZONES, holdMs: CFG.HOLD_MS, tuning: CFG.TUNING,
            onZone: function (zone) {
                SIDES.forEach(function (z) { $(ZONE_EL[z]).classList.toggle('active-zone', z === zone); });
            },
            onHoldProgress: function (zone, pct) {
                SIDES.forEach(function (z) {
                    var el = $(ZONE_EL[z]);
                    var fill = el && el.querySelector('.hold-fill');
                    if (fill) fill.style.width = (z === zone ? pct * 100 : 0) + '%';
                });
            },
            onCommit: function (zone) { commitAnswer(zone); },
            onStatus: function () { setStatus(); }
        });
    }

    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
        return a;
    }

    function resetPanels() {
        SIDES.forEach(function (z) {
            var el = $(ZONE_EL[z]);
            if (!el) return;
            el.classList.remove('active-zone', 'correct', 'wrong');
            var fill = el.querySelector('.hold-fill');
            if (fill) fill.style.width = '0%';
        });
    }

    async function startGame() {
        showScreen('gameScreen');
        $('loading').classList.add('on');
        KAMPAI.sound.unlock();
        stopAR();
        ar = buildAR();
        try {
            await ar.start();
        } catch (e) {
            console.warn('Camera failed, tap fallback:', e);
        }
        $('loading').classList.remove('on');
        KAMPAI.sound.bgmStart();
        ST.score = 0;
        ST.round = 0;
        ST.correctCount = 0;
        ST.wrongCount = 0;
        ST.timeUpCount = 0;
        ST.started = true;
        ST.questions = shuffle(DATA.questions).slice(0, CFG.ROUNDS);
        $('scorePill').textContent = '⭐ 0';
        loadRound();
    }

    function loadRound() {
        var q = ST.questions[ST.round];
        ST.roundLocked = false;
        $('question').textContent = q.q;
        $('roundPill').textContent = 'ข้อ ' + (ST.round + 1) + '/' + ST.questions.length;
        resetPanels();
        SIDES.forEach(function (z, i) {
            $(ZONE_EL[z]).querySelector('.choice').textContent = q.choices[i];
        });
        if (ar) ar.setActive(true);
        startTimer();
    }

    function startTimer() {
        if (ST.timer) clearInterval(ST.timer);
        ST.sec = CFG.ROUND_SEC;
        setStatus();
        ST.timer = setInterval(function () {
            ST.sec--;
            setStatus();
            if (ST.sec <= 0) {
                clearInterval(ST.timer);
                ST.timer = null;
                ST.timeUpCount++;
                KAMPAI.sound.timeUp();
                commitAnswer(null);
            }
        }, 1000);
    }

    function commitAnswer(zone) {
        if (ST.roundLocked) return;
        ST.roundLocked = true;
        if (ar) ar.setActive(false);
        if (ST.timer) { clearInterval(ST.timer); ST.timer = null; }

        var bonusPerSec = CFG.BONUS_PER_SEC != null ? CFG.BONUS_PER_SEC : 2;
        var baseScore = CFG.SCORE_BASE != null ? CFG.SCORE_BASE : 100;
        var bonus = Math.max(0, ST.sec) * bonusPerSec;
        ST.sec = 0;
        setStatus();

        var q = ST.questions[ST.round];
        var correctSide = SIDES[q.answer];
        var correct = zone === correctSide;

        resetPanels();
        $(ZONE_EL[correctSide]).classList.add('correct');
        if (zone && !correct) $(ZONE_EL[zone]).classList.add('wrong');

        if (correct) {
            ST.score += baseScore + bonus;
            ST.correctCount++;
            $('scorePill').textContent = '⭐ ' + ST.score;
            KAMPAI.sound.correct();
            KAMPAI.sound.fxFlash(true);
        } else {
            ST.wrongCount++;
            KAMPAI.sound.wrong();
            KAMPAI.sound.fxFlash(false);
        }

        var pause = CFG.FEEDBACK_MS != null ? CFG.FEEDBACK_MS : 2200;
        setTimeout(function () {
            ST.round++;
            if (ST.round < ST.questions.length) loadRound();
            else finishGame();
        }, pause);
    }

    function finishGame() {
        if (ST.timer) { clearInterval(ST.timer); ST.timer = null; }
        ST.started = false;
        stopAR();
        KAMPAI.sound.bgmStop();
        KAMPAI.sound.gameOver();
        showScreen('resultScreen');
        $('final-score').textContent = ST.score;
        $('final-detail').textContent = 'จาก ' + ST.questions.length + ' ข้อ · ถูก ' + ST.correctCount + ' · ผิด/หมดเวลา ' + ST.wrongCount;
        KAMPAI.submitScore(ST.score, {
            mode: 'normal',
            correct: ST.correctCount,
            wrong: ST.wrongCount,
            timeUp: ST.timeUpCount
        });
    }

    function cleanup() {
        if (ST.timer) { clearInterval(ST.timer); ST.timer = null; }
        stopAR();
        KAMPAI.sound.bgmStop();
        ST.started = false;
        ST.roundLocked = true;
    }

    $('startBtn').addEventListener('click', startGame);
    $('restartBtn').addEventListener('click', function () {
        cleanup();
        setTimeout(startGame, 120);
    });
    SIDES.forEach(function (z) {
        $(ZONE_EL[z]).addEventListener('click', function () {
            if (ar && !ST.roundLocked) ar.tap(z);
        });
    });
    $('quitBtn').addEventListener('click', function () { cleanup(); KAMPAI.goHome(); });
    $('homeBtn').addEventListener('click', function () { cleanup(); KAMPAI.goHome(); });
    window.addEventListener('beforeunload', cleanup);
})();
