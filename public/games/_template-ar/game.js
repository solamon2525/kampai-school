/* game.js — ลอจิกเกม AR zone-quiz (อ่าน config/data + KAMPAI SDK + KampaiAR engine)
   ❗ ไม่มี camera code ที่นี่ — กล้อง/ตรวจจับอยู่ใน kampai-ar.js ทั้งหมด */
(function () {
    'use strict';
    var CFG = window.GAME_CONFIG, DATA = window.GAME_DATA;
    var $ = function (id) { return document.getElementById(id); };
    var ZONE_IDX = { left: 0, center: 1, right: 2 };
    var ZONE_EL = { left: 'zoneLeft', center: 'zoneCenter', right: 'zoneRight' };

    KAMPAI.setSlug(CFG.SLUG);
    KAMPAI.sound.mountToggles();
    KAMPAI.sound.defaultBgm(CFG.BGM || 'cheerful');

    var ST = { score: 0, round: 0, questions: [], timer: null, sec: 0, roundLocked: true, started: false };
    var ar = null;
    var vs = window.KampaiVersus ? KampaiVersus.create({
        duration: CFG.ROUNDS * CFG.ROUND_SEC,
        title: 'AR Zone Quiz',
        rankBy: 'score',
        onPlay: function () { startGame(); },
        onEnd: function () { cleanup(); }
    }) : null;

    // ── จอเริ่ม: player chip + leaderboard ──
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
        var icon = ar && ar.mode === 'camera' ? '🎥' : '✋ แตะ';
        $('status-tag').textContent = icon + (ST.sec > 0 ? ' · ⏱ ' + ST.sec + 's' : '');
    }

    // ── AR engine ──
    function buildAR() {
        return KampaiAR.create({
            video: '#arVideo', canvas: '#arCanvas',
            detector: CFG.DETECTOR, zones: CFG.ZONES, holdMs: CFG.HOLD_MS, tuning: CFG.TUNING,
            onZone: function (zone) {
                ['left', 'center', 'right'].forEach(function (z) { $(ZONE_EL[z]).classList.toggle('active-zone', z === zone); });
            },
            onHoldProgress: function (zone, pct) {
                var fill = $(ZONE_EL[zone]).querySelector('.zone-fill');
                if (fill) fill.style.width = (pct * 100) + '%';
            },
            onCommit: function (zone) { commitAnswer(zone); },
            onStatus: function () { setStatus(); }
        });
    }

    // ── เริ่มเกม / รอบ ──
    async function startGame() {
        cleanup();
        ar = null;
        KAMPAI.beginRound();
        showScreen('gameScreen');
        $('loading').classList.add('on');
        KAMPAI.sound.unlock();
        if (!ar) ar = buildAR();
        await ar.start();                  // ขอกล้องตอน gesture (ถ้าไม่ได้ → โหมดแตะอัตโนมัติ)
        $('loading').classList.remove('on');
        KAMPAI.sound.bgmStart();
        ST.score = 0; ST.round = 0; ST.started = true;
        ST.questions = DATA.questions.slice(0, CFG.ROUNDS);
        $('scorePill').textContent = '⭐ 0';
        loadRound();
    }
    function loadRound() {
        var q = ST.questions[ST.round];
        ST.roundLocked = false;
        $('question').textContent = q.q;
        $('roundPill').textContent = 'ข้อ ' + (ST.round + 1) + '/' + ST.questions.length;
        ['left', 'center', 'right'].forEach(function (z, i) {
            var el = $(ZONE_EL[z]);
            el.classList.remove('active-zone', 'correct', 'wrong');
            el.querySelector('.choice').textContent = q.choices[i];
            el.querySelector('.zone-fill').style.width = '0%';
        });
        ar.setActive(true);
        startTimer();
    }
    function startTimer() {
        if (ST.timer) clearInterval(ST.timer);
        ST.sec = CFG.ROUND_SEC; setStatus();
        ST.timer = setInterval(function () {
            ST.sec--; setStatus();
            if (ST.sec <= 0) { clearInterval(ST.timer); ST.timer = null; commitAnswer(ar ? ar.zone : null); }
        }, 1000);
    }

    function commitAnswer(zone) {
        if (ST.roundLocked) return;
        ST.roundLocked = true;
        ar.setActive(false);
        if (ST.timer) { clearInterval(ST.timer); ST.timer = null; }
        ST.sec = 0; setStatus();
        var q = ST.questions[ST.round];
        var idx = zone != null && ZONE_IDX[zone] != null ? ZONE_IDX[zone] : -1;
        var correct = idx === q.answer;
        // เฉลย: ไฮไลต์โซน
        var correctZone = ['left', 'center', 'right'][q.answer];
        $(ZONE_EL[correctZone]).classList.add('correct');
        if (zone && !correct) $(ZONE_EL[zone]).classList.add('wrong');
        if (correct) {
            ST.score += 100 + Math.max(0, ST.sec) * 5;
            $('scorePill').textContent = '⭐ ' + ST.score;
            KAMPAI.sound.correct(); KAMPAI.sound.fxFlash(true);
        } else {
            KAMPAI.sound.wrong(); KAMPAI.sound.fxFlash(false);
        }
        setTimeout(function () {
            ST.round++;
            if (ST.round < ST.questions.length) loadRound(); else finishGame();
        }, 1800);
    }

    function finishGame() {
        if (ST.timer) { clearInterval(ST.timer); ST.timer = null; }
        ST.started = false;
        if (ar) { ar.stop(); ar = null; }
        if (vs && vs.finish(ST.score, { correct: ST.round })) return;
        KAMPAI.sound.bgmStop(); KAMPAI.sound.gameOver();
        var correctCount = 0; // นับจากคะแนน (อย่างคร่าว) — เก็บแยกถ้าต้องการ
        showScreen('resultScreen');
        $('final-score').textContent = ST.score;
        $('final-detail').textContent = 'จาก ' + ST.questions.length + ' ข้อ';
        KAMPAI.submitScore(ST.score, { mode: 'normal' });
    }

    function cleanup() {
        if (ST.timer) { clearInterval(ST.timer); ST.timer = null; }
        if (ar) ar.stop();
        KAMPAI.sound.bgmStop();
    }

    // ── ปุ่ม / fallback แตะ / exit ──
    $('startBtn').addEventListener('click', startGame);
    $('restartBtn').addEventListener('click', startGame);
    document.querySelector('[data-kampai-action="finish-test"]').addEventListener('click', finishGame);
    ['left', 'center', 'right'].forEach(function (z) {
        $(ZONE_EL[z]).addEventListener('click', function () { if (ar && !ST.roundLocked) ar.tap(z); });
    });
    $('quitBtn').addEventListener('click', function () { cleanup(); KAMPAI.goHome(); });
    $('homeBtn').addEventListener('click', function () { cleanup(); KAMPAI.goHome(); });
    window.addEventListener('beforeunload', cleanup);
})();
