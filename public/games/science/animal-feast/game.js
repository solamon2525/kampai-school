/* game.js — ลอจิกเกม Animal Feast (KAMPAI SDK + Diet Matching) */
(function () {
    'use strict';
    var CFG = window.GAME_CONFIG, DATA = window.GAME_DATA;
    var $ = function (id) { return document.getElementById(id); };

    // ── กำหนดค่า SDK ──
    KAMPAI.setSlug(CFG.SLUG);
    KAMPAI.sound.mountToggles();
    KAMPAI.sound.defaultBgm(CFG.BGM || 'cheerful');

    // ── ตัวแปรสถานะเกม ──
    var gameState = 'start';
    var timeLeft = CFG.GAME_DURATION;
    var score = 0;
    var combo = 0;
    var maxCombo = 0;
    var correctCount = 0;
    var totalFed = 0;
    var currentAnimal = null;
    var previousAnimalId = null;
    var isFeedingLocked = false;
    var mainTimer = null;
    var feedPopupTimer = null;
    var playerName = 'ผู้ดูแลสวนสัตว์';

    // ── Versus Mode ──
    var vs = window.KampaiVersus ? KampaiVersus.create({
        duration: CFG.GAME_DURATION,
        title: 'Animal Feast',
        rankBy: 'score',
        onPlay: function () { startGame(); },
        onEnd: function () { endGame(); }
    }) : null;

    // ── ผู้เล่นและลีดเดอร์บอร์ด ──
    function renderPlayer() {
        var s = KAMPAI.student, stt = KAMPAI.stats, chip = $('player-chip');
        if (!s || !chip) return;
        var av = s.photoUrl ? '<img src="' + s.photoUrl + '" alt="">' : '<div class="ini">' + ((s.displayName || '?')[0]) + '</div>';
        var best = stt ? ' · <b style="color:#16a34a">สถิติสูงสุด ' + (stt.personalBest || 0) + '</b>' : '';
        chip.innerHTML = av + '<span>' + s.displayName + best + '</span>';
        chip.style.display = 'flex';
        playerName = s.displayName || 'ผู้ดูแลสวนสัตว์';
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

    // ── สุ่มสัตว์ตัวถัดไป ──
    function nextAnimal() {
        isFeedingLocked = false;
        var list = DATA.animals;
        var candidate;
        // หลีกเลี่ยงสัตว์ซ้ำตัวเดิม
        do {
            candidate = list[Math.floor(Math.random() * list.length)];
        } while (candidate.id === previousAnimalId && list.length > 1);

        previousAnimalId = candidate.id;
        currentAnimal = candidate;

        var avatarEl = $('animalAvatar');
        avatarEl.className = 'animal-avatar-box';
        avatarEl.innerText = candidate.icon;

        $('animalName').innerText = candidate.name;
        $('animalSpeech').innerText = candidate.speech;
        $('animalFact').innerText = '💡 ' + candidate.dietName + ' · ' + candidate.fact;
    }

    // ── เริ่มต้นและจบเกม ──
    function startGame() {
        score = 0;
        combo = 0;
        maxCombo = 0;
        correctCount = 0;
        totalFed = 0;
        timeLeft = CFG.GAME_DURATION;
        previousAnimalId = null;

        gameState = 'playing';
        showScreen('gameScreen');
        updateHUD();

        KAMPAI.sound.unlock();
        KAMPAI.sound.bgmStart();

        nextAnimal();

        if (mainTimer) clearInterval(mainTimer);
        mainTimer = setInterval(function () {
            timeLeft--;
            updateHUD();
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    function endGame() {
        gameState = 'gameover';
        if (mainTimer) clearInterval(mainTimer);

        KAMPAI.sound.bgmStop();
        KAMPAI.sound.gameOver();

        $('final-score').innerText = score;
        var stars = '⭐⭐⭐';
        if (score < 100) stars = '⭐☆☆';
        else if (score < 250) stars = '⭐⭐☆';
        $('go-stars').innerText = stars;

        $('final-detail').innerText = 'ป้อนอาหารถูกต้อง ' + correctCount + ' จาก ' + totalFed + ' ตัว · คอมโบสูงสุด: ' + maxCombo + ' ครั้ง';

        showScreen('resultScreen');

        // ส่งคะแนนเข้าระบบพอร์ทัล
        KAMPAI.submitScore(score, {
            correctCount: correctCount,
            totalFed: totalFed,
            maxCombo: maxCombo
        });

        if (vs && vs.report) {
            vs.report(score, { correct: correctCount });
            vs.finish();
        }
    }

    // ── ป้อนอาหารและตรวจสอบ ──
    function feed(foodChoice) {
        if (gameState !== 'playing' || isFeedingLocked || !currentAnimal) return;
        isFeedingLocked = true;
        totalFed++;

        var isCorrect = false;
        var diet = currentAnimal.diet;

        if (diet === 'herbivore') {
            isCorrect = (foodChoice === 'plant');
        } else if (diet === 'carnivore') {
            isCorrect = (foodChoice === 'meat');
        } else if (diet === 'omnivore') {
            // สัตว์กินทั้งสองอย่าง ป้อนอะไรก็ถูก!
            isCorrect = true;
        }

        var avatarEl = $('animalAvatar');

        if (isCorrect) {
            correctCount++;
            combo++;
            if (combo > maxCombo) maxCombo = combo;

            var earnedPts = CFG.POINTS_CORRECT + (combo > 1 ? (combo - 1) * CFG.COMBO_BONUS : 0);
            score += earnedPts;

            avatarEl.classList.add('munch');
            KAMPAI.sound.correct();

            var omniMsg = diet === 'omnivore' ? ' (กินได้ทั้งพืชและเนื้อ!)' : '';
            showPopup('🎉 อร่อยมาก! +' + earnedPts + omniMsg, 'correct');

            if (combo >= 3) {
                var cb = $('comboBanner');
                cb.innerText = '🔥 COMBO x' + combo;
                cb.style.display = 'block';
            }
        } else {
            combo = 0;
            score = Math.max(0, score + CFG.PENALTY_WRONG);

            avatarEl.classList.add('sad');
            KAMPAI.sound.wrong();

            var expected = diet === 'herbivore' ? 'กินเฉพาะพืช/ผัก/ผลไม้!' : 'กินเฉพาะเนื้อ/ปลา!';
            showPopup('❌ ' + currentAnimal.name + ' ' + expected + ' ' + CFG.PENALTY_WRONG, 'wrong');

            $('comboBanner').style.display = 'none';
        }

        updateHUD();

        setTimeout(function () {
            if (gameState === 'playing') {
                nextAnimal();
            }
        }, isCorrect ? 450 : 650);
    }

    function showPopup(text, type) {
        var el = $('feedPopup');
        if (!el) return;
        el.innerText = text;
        el.className = 'show ' + type;

        if (feedPopupTimer) clearTimeout(feedPopupTimer);
        feedPopupTimer = setTimeout(function () {
            el.className = '';
        }, 800);
    }

    function updateHUD() {
        $('scorePill').innerText = '⭐ ' + score;
        $('timerPill').innerText = '⏱ ' + timeLeft + 's';
    }

    // ── ผูก Event Listeners ──
    function init() {
        $('startBtn').addEventListener('click', startGame);
        $('restartBtn').addEventListener('click', startGame);
        $('quitBtn').addEventListener('click', function () {
            gameState = 'start';
            if (mainTimer) clearInterval(mainTimer);
            KAMPAI.sound.bgmStop();
            showScreen('startScreen');
        });
        $('homeBtn').addEventListener('click', function () {
            KAMPAI.goHome();
        });

        // ปุ่มป้อนอาหาร
        $('plantBtn').addEventListener('click', function () { feed('plant'); });
        $('meatBtn').addEventListener('click', function () { feed('meat'); });

        // คีย์บอร์ด
        window.addEventListener('keydown', function (e) {
            if (gameState !== 'playing') return;
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                feed('plant');
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                feed('meat');
            }
        });

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
