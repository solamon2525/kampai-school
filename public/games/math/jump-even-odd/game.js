/* game.js — เกม AR "กระโดดเลขคู่-คี่" (gesture jump/squat + KAMPAI SDK + KampaiAR engine)
   ❗ ไม่มี camera code ที่นี่ — กล้อง/ตรวจจับ gesture อยู่ใน kampai-ar.js
   กระโดด → ตอบ 'jump' (เลขคู่) · ย่อตัว → ตอบ 'squat' (เลขคี่) · ไม่มีกล้อง = แตะปุ่ม */
(function () {
    'use strict';
    var CFG = window.GAME_CONFIG, DATA = window.GAME_DATA;
    var $ = function (id) { return document.getElementById(id); };
    var ACT = ['jump', 'squat'];
    var ACT_EL = { jump: 'panelJump', squat: 'panelSquat' };

    KAMPAI.setSlug(CFG.SLUG);
    KAMPAI.sound.mountToggles();
    KAMPAI.sound.defaultBgm(CFG.BGM || 'cheerful');

    var ST = { score: 0, round: 0, questions: [], timer: null, sec: 0, roundLocked: true, started: false };
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
        var icon = ar && ar.mode === 'camera' ? '🎥 กระโดด/ย่อ' : '✋ แตะ';
        $('status-tag').textContent = icon + (ST.sec > 0 ? ' · ⏱ ' + ST.sec + 's' : '');
    }
    // เอฟเฟกต์ตอบรับ gesture (เด้ง panel ที่เลือก)
    function flashPanel(action) {
        var el = $(ACT_EL[action]); if (!el) return;
        el.classList.add('pulse'); setTimeout(function () { el.classList.remove('pulse'); }, 250);
    }

    // ── AR engine (gesture mode — ไม่ใช้ zone/hold) ──
    function buildAR() {
        return KampaiAR.create({
            video: '#arVideo', canvas: '#arCanvas',
            detector: CFG.DETECTOR, holdMs: CFG.HOLD_MS, tuning: CFG.TUNING,
            onGesture: function (g) { if (!ST.roundLocked && (g === 'jump' || g === 'squat')) { flashPanel(g); commitAnswer(g); } },
            onStatus: function () { setStatus(); }
        });
    }

    async function startGame() {
        showScreen('gameScreen');
        $('loading').classList.add('on');
        KAMPAI.sound.unlock();
        if (!ar) ar = buildAR();
        await ar.start();
        $('loading').classList.remove('on');
        KAMPAI.sound.bgmStart();
        ST.score = 0; ST.round = 0; ST.started = true;
        ST.questions = DATA.questions.slice(0, CFG.ROUNDS);
        $('scorePill').textContent = '⭐ 0';
        // ป้าย panel จาก config
        $('panelJump').querySelector('.p-label').textContent = CFG.ACTIONS.jump.label;
        $('panelSquat').querySelector('.p-label').textContent = CFG.ACTIONS.squat.label;
        loadRound();
    }
    function loadRound() {
        var q = ST.questions[ST.round];
        ST.roundLocked = false;
        $('question').textContent = q.q;
        $('roundPill').textContent = 'ข้อ ' + (ST.round + 1) + '/' + ST.questions.length;
        ACT.forEach(function (a) { $(ACT_EL[a]).classList.remove('correct', 'wrong'); });
        startTimer();
    }
    function startTimer() {
        if (ST.timer) clearInterval(ST.timer);
        ST.sec = CFG.ROUND_SEC; setStatus();
        ST.timer = setInterval(function () {
            ST.sec--; setStatus();
            if (ST.sec <= 0) { clearInterval(ST.timer); ST.timer = null; commitAnswer(null); }
        }, 1000);
    }

    function commitAnswer(action) {
        if (ST.roundLocked) return;
        ST.roundLocked = true;
        if (ST.timer) { clearInterval(ST.timer); ST.timer = null; }
        ST.sec = 0; setStatus();
        var q = ST.questions[ST.round];
        var correct = action === q.answer;
        $(ACT_EL[q.answer]).classList.add('correct');           // เฉลย
        if (action && action !== q.answer) $(ACT_EL[action]).classList.add('wrong');
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
        }, 1700);
    }

    function finishGame() {
        if (ST.timer) { clearInterval(ST.timer); ST.timer = null; }
        ST.started = false;
        if (ar) ar.stop();
        KAMPAI.sound.bgmStop(); KAMPAI.sound.gameOver();
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

    // ── ปุ่ม / fallback แตะ panel / exit ──
    $('startBtn').addEventListener('click', startGame);
    $('restartBtn').addEventListener('click', startGame);
    ACT.forEach(function (a) {
        $(ACT_EL[a]).addEventListener('click', function () { if (!ST.roundLocked) { flashPanel(a); commitAnswer(a); } });
    });
    $('quitBtn').addEventListener('click', function () { cleanup(); KAMPAI.goHome(); });
    $('homeBtn').addEventListener('click', function () { cleanup(); KAMPAI.goHome(); });
    window.addEventListener('beforeunload', cleanup);
})();
