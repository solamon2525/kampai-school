/* game.js — เกม AR "จรวดพลังงาน" (energy meter + KAMPAI SDK + KampaiAR engine)
   ❗ ไม่มี camera code ที่นี่ — กล้อง/ตรวจจับพลังอยู่ใน kampai-ar.js (onEnergy)
   ขยับตัว/วิ่งอยู่กับที่ → เติมพลังจนเต็ม → ปล่อยจรวด · ไม่มีกล้อง = แตะปุ่ม "ออกแรง" รัว ๆ */
(function () {
    'use strict';
    var CFG = window.GAME_CONFIG, DATA = window.GAME_DATA;
    var $ = function (id) { return document.getElementById(id); };

    KAMPAI.setSlug(CFG.SLUG);
    KAMPAI.sound.mountToggles();
    KAMPAI.sound.defaultBgm(CFG.BGM || 'cheerful');

    var ST = { score: 0, round: 0, rounds: [], timer: null, sec: 0, charge: 0, charging: false, started: false };
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
        var icon = ar && ar.mode === 'camera' ? '🎥 ขยับเติมพลัง' : '✋ แตะ "ออกแรง"';
        $('status-tag').textContent = icon + (ST.sec > 0 ? ' · ⏱ ' + ST.sec + 's' : '');
    }
    function updateMeter() {
        var pct = Math.round(ST.charge * 100);
        $('meterFill').style.height = pct + '%';
        $('meterPct').textContent = pct + '%';
        // จรวดลอยตามพลัง (0→ล่าง, 1→บนสุด)
        $('rocket').style.bottom = (8 + ST.charge * 70) + '%';
    }

    // ── พลัง: จากการเคลื่อนไหว (onEnergy) หรือแตะปุ่ม ──
    function addCharge(amount) {
        if (!ST.charging) return;
        ST.charge = Math.max(0, Math.min(1, ST.charge + amount));
        updateMeter();
        if (ST.charge >= 1) launch();
    }
    function onEnergyTick(level) {
        if (!ST.charging) return;
        // ขยับ → เติม · นิ่ง → ไหลลง (บังคับขยับต่อเนื่อง)
        addCharge(level > 0.08 ? level * CFG.CHARGE_K : -CFG.DRAIN);
    }

    function buildAR() {
        return KampaiAR.create({
            video: '#arVideo', canvas: '#arCanvas',
            detector: CFG.DETECTOR, tuning: CFG.TUNING,
            onEnergy: function (level) { onEnergyTick(level); },
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
        ST.rounds = DATA.rounds.slice(0, CFG.ROUNDS);
        $('scorePill').textContent = '⭐ 0';
        loadRound();
    }
    function loadRound() {
        var r = ST.rounds[ST.round];
        ST.charge = 0; ST.charging = true;
        $('rocketName').textContent = '🚀 ' + r.name;
        $('factCard').textContent = r.fact;
        $('roundPill').textContent = 'จรวด ' + (ST.round + 1) + '/' + ST.rounds.length;
        $('rocket').classList.remove('launch');
        updateMeter();
        startTimer();
    }
    function startTimer() {
        if (ST.timer) clearInterval(ST.timer);
        ST.sec = CFG.ROUND_SEC; setStatus();
        ST.timer = setInterval(function () {
            ST.sec--; setStatus();
            if (ST.sec <= 0) { clearInterval(ST.timer); ST.timer = null; launch(); }  // หมดเวลา = ปล่อยตามพลังที่มี
        }, 1000);
    }

    function launch() {
        if (!ST.charging) return;
        ST.charging = false;
        if (ST.timer) { clearInterval(ST.timer); ST.timer = null; }
        var full = ST.charge >= 1;
        if (full) {
            ST.charge = 1; updateMeter();
            $('rocket').classList.add('launch');
            ST.score += 100 + Math.max(0, ST.sec) * 8;   // โบนัสเวลาที่เหลือ
            KAMPAI.sound.correct(); KAMPAI.sound.fxFlash(true);
        } else {
            ST.score += Math.round(ST.charge * 60);       // เครดิตบางส่วนตามพลัง
            KAMPAI.sound.timeUp ? KAMPAI.sound.timeUp() : KAMPAI.sound.wrong();
        }
        $('scorePill').textContent = '⭐ ' + ST.score;
        ST.sec = 0; setStatus();
        setTimeout(function () {
            ST.round++;
            if (ST.round < ST.rounds.length) loadRound(); else finishGame();
        }, full ? 1700 : 1200);
    }

    function finishGame() {
        if (ST.timer) { clearInterval(ST.timer); ST.timer = null; }
        ST.started = false;
        if (ar) ar.stop();
        KAMPAI.sound.bgmStop(); KAMPAI.sound.gameOver();
        showScreen('resultScreen');
        $('final-score').textContent = ST.score;
        $('final-detail').textContent = 'ปล่อยจรวด ' + ST.rounds.length + ' ลูก';
        KAMPAI.submitScore(ST.score, { mode: 'normal' });
    }

    function cleanup() {
        if (ST.timer) { clearInterval(ST.timer); ST.timer = null; }
        if (ar) ar.stop();
        KAMPAI.sound.bgmStop();
    }

    // ── ปุ่ม / fallback แตะออกแรง / exit ──
    $('startBtn').addEventListener('click', startGame);
    $('restartBtn').addEventListener('click', startGame);
    $('pushBtn').addEventListener('click', function () { addCharge(CFG.TAP_K); });
    $('quitBtn').addEventListener('click', function () { cleanup(); KAMPAI.goHome(); });
    $('homeBtn').addEventListener('click', function () { cleanup(); KAMPAI.goHome(); });
    window.addEventListener('beforeunload', cleanup);
})();
