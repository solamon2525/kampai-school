/**
 * GAME LOGIC — Farm Adventure: ภารกิจวัดความยาวในฟาร์มมหาสนุก
 * คณิตศาสตร์ ป.4 — 5 ด่าน, ระบบหัวใจ, streak, เหรียญ, ปลดล็อกสัตว์เลี้ยง
 */
(function () {
    'use strict';

    var CFG  = window.GAME_CONFIG;
    var DATA = window.GAME_DATA;

    // ─── SDK init ───
    KAMPAI.setSlug(CFG.SLUG);
    KAMPAI.sound.defaultBgm(CFG.BGM_PRESET);
    KAMPAI.controls.mount(CFG.CONTROLS);
    KAMPAI.sound.mountToggles();

    // ─── Title / Description ───
    document.getElementById('game-title').textContent = 'Farm Adventure';
    document.getElementById('game-desc').textContent  = CFG.DESCRIPTION;

    // ─── Player + Leaderboard (boilerplate) ───
    function renderPlayer() {
        var s = KAMPAI.student, st = KAMPAI.stats;
        if (!s) return;
        var chip = document.getElementById('player-chip');
        var av = s.photoUrl ? '<img src="' + s.photoUrl + '" alt="">' : '<div class="pc-init">' + (s.displayName || '?')[0] + '</div>';
        var best = st ? ' · <span class="pc-best">สถิติ ' + st.personalBest.toLocaleString() + '</span>' : '';
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
    KAMPAI.onReady(function () { renderPlayer(); renderMyStats(); renderLeaderboard('score-list'); });

    // ─── Helpers ───
    var $ = function (id) { return document.getElementById(id); };

    // ─── State ───
    var score = 0, lives = CFG.LIVES, isGameOver = false, started = false;
    var currentLevel = 0, currentQuestion = 0, levelScore = 0, levelCorrect = 0;
    var answering = false, streak = 0, coins = 0;
    var totalCorrect = 0, totalWrong = 0;
    var selectedFarmer = 'boy';
    var unlockedLevels = [true, false, false, false, false]; // first level unlocked
    var highestLevelCleared = -1;

    // Load progress from localStorage
    function loadProgress() {
        try {
            var saved = localStorage.getItem('farm-adventure-progress');
            if (saved) {
                var data = JSON.parse(saved);
                if (data.unlockedLevels) unlockedLevels = data.unlockedLevels;
                if (typeof data.highestLevelCleared === 'number') highestLevelCleared = data.highestLevelCleared;
                if (data.farmer) selectedFarmer = data.farmer;
            }
        } catch (e) { /* ignore */ }
    }
    function saveProgress() {
        try {
            localStorage.setItem('farm-adventure-progress', JSON.stringify({
                unlockedLevels: unlockedLevels,
                highestLevelCleared: highestLevelCleared,
                farmer: selectedFarmer
            }));
        } catch (e) { /* ignore */ }
    }
    loadProgress();

    // Save high scores locally
    function saveHighScore(s) {
        try {
            var scores = JSON.parse(localStorage.getItem('farm-adventure-highscores') || '[]');
            scores.push({ score: s, date: new Date().toLocaleDateString('th-TH') });
            scores.sort(function (a, b) { return b.score - a.score; });
            scores = scores.slice(0, 10);
            localStorage.setItem('farm-adventure-highscores', JSON.stringify(scores));
        } catch (e) { /* ignore */ }
    }

    // ─── Farmer select ───
    window.selectFarmer = function (type) {
        selectedFarmer = type;
        var btns = document.querySelectorAll('.farmer-btn');
        btns.forEach(function (b) { b.classList.remove('selected'); });
        document.querySelector('.farmer-btn[data-farmer="' + type + '"]').classList.add('selected');
    };

    function getFarmerEmoji() {
        return selectedFarmer === 'boy' ? '👦🏻' : '👧🏻';
    }

    // ─── Score / Lives / Streak ───
    function setScore(n) {
        score = Math.max(0, n);
        $('score-value').innerText = score;
        var w = $('score-container');
        w.classList.add('pop'); setTimeout(function () { w.classList.remove('pop'); }, 150);
    }

    function setLives(n) {
        lives = Math.max(0, n);
        var container = $('life-container');
        var html = '';
        for (var i = 0; i < CFG.LIVES; i++) {
            if (i < lives) {
                html += '<span class="heart">❤️</span>';
            } else {
                html += '<span class="heart lost">🖤</span>';
            }
        }
        container.innerHTML = html;
        if (lives <= 0) onHeartsDepleted();
    }

    function updateStreak() {
        var el = $('streak-container');
        if (streak >= 2) {
            $('streak-value').innerText = streak;
            el.classList.add('show');
        } else {
            el.classList.remove('show');
        }
    }

    function updateCoins() {
        var el = $('coins-container');
        $('coins-value').innerText = coins;
        el.style.display = 'block';
    }

    function showScorePopup(x, y, text, color) {
        var el = document.createElement('div');
        el.className = 'score-popup';
        el.textContent = text;
        el.style.cssText = 'left:' + x + 'px;top:' + y + 'px;color:' + color + ';';
        document.body.appendChild(el);
        el.addEventListener('animationend', function () { el.remove(); });
    }

    // ─── Hearts depleted ───
    function onHeartsDepleted() {
        KAMPAI.sound.bgmStop();
        KAMPAI.sound.gameOver();
        $('hearts-depleted').classList.add('show');
    }

    window.retryLevel = function () {
        $('hearts-depleted').classList.remove('show');
        lives = CFG.LIVES;
        setLives(lives);
        currentQuestion = 0;
        levelScore = 0;
        levelCorrect = 0;
        streak = 0;
        updateStreak();
        KAMPAI.sound.bgmStart();
        showQuestion();
    };

    window.goToLevelSelect = function () {
        $('hearts-depleted').classList.remove('show');
        $('game-area').style.display = 'none';
        showLevelSelectScreen();
    };

    // ─── Visual renderers ───
    function renderRuler(container, length, unit) {
        var obj = DATA.farmObjects[Math.floor(Math.random() * DATA.farmObjects.length)];
        var maxVal, rulerWidthPx, objectWidthPx;

        if (unit === 'cm') {
            maxVal = length + 2;
            rulerWidthPx = Math.min(420, Math.max(180, maxVal * 24));
            objectWidthPx = (length / maxVal) * rulerWidthPx;
        } else {
            maxVal = Math.ceil(length / 10) + 2;
            rulerWidthPx = Math.min(420, Math.max(180, maxVal * 28));
            objectWidthPx = (length / (maxVal * 10)) * rulerWidthPx;
        }

        var html = '<div style="display:flex;flex-direction:column;align-items:center;gap:8px;">';
        html += '<span class="measure-object">' + obj + '</span>';
        html += '<div class="measure-bar" style="width:' + objectWidthPx + 'px;"></div>';
        html += '<div class="ruler-visual" style="width:' + rulerWidthPx + 'px;"><div class="ruler-marks">';

        if (unit === 'cm') {
            for (var i = 0; i <= maxVal; i++) {
                var pct = (i / maxVal) * 100;
                html += '<div class="ruler-mark cm" style="left:' + pct + '%"></div>';
                html += '<div class="ruler-label" style="left:' + pct + '%">' + i + '</div>';
                if (i < maxVal) {
                    var halfPct = ((i + 0.5) / maxVal) * 100;
                    html += '<div class="ruler-mark half" style="left:' + halfPct + '%"></div>';
                }
            }
        } else {
            var totalMm = maxVal * 10;
            for (var j = 0; j <= totalMm; j++) {
                var pctMm = (j / totalMm) * 100;
                if (j % 10 === 0) {
                    html += '<div class="ruler-mark cm" style="left:' + pctMm + '%"></div>';
                    html += '<div class="ruler-label" style="left:' + pctMm + '%">' + j + '</div>';
                } else if (j % 5 === 0) {
                    html += '<div class="ruler-mark half" style="left:' + pctMm + '%"></div>';
                }
            }
        }
        html += '</div></div></div>';
        container.innerHTML = html;
    }

    function renderCompare(container, a, b, unit, labelA, labelB) {
        var max = Math.max(a, b, 1);
        var hA = Math.max(35, (a / max) * 130);
        var hB = Math.max(35, (b / max) * 130);
        var colors = ['#4ade80','#60a5fa','#f59e0b','#a78bfa','#fb7185','#34d399'];
        var cA = colors[Math.floor(Math.random() * colors.length)];
        var cB = colors[(colors.indexOf(cA) + 2) % colors.length];

        container.innerHTML = '<div class="compare-visual">' +
            '<div class="compare-bar" style="height:' + hA + 'px;background:' + cA + ';width:65px;">' +
                '<span class="bar-label">A</span>' +
                '<span class="bar-value">' + (labelA || a + ' ' + unit) + '</span>' +
            '</div>' +
            '<div class="compare-icon">❓</div>' +
            '<div class="compare-bar" style="height:' + hB + 'px;background:' + cB + ';width:65px;">' +
                '<span class="bar-label">B</span>' +
                '<span class="bar-value">' + (labelB || b + ' ' + unit) + '</span>' +
            '</div>' +
        '</div>';
    }

    function renderConvert(container, from, to, val) {
        container.innerHTML = '<div class="convert-visual">' +
            '<span class="convert-from">' + val + ' ' + from + '</span>' +
            '<span class="convert-arrow">➜</span>' +
            '<span class="convert-to">? ' + to + '</span>' +
        '</div>';
    }

    function renderArithmetic(container) {
        container.innerHTML = '<div class="arithmetic-visual">' +
            '<span class="arith-badge">🧮 คำนวณความยาว</span>' +
        '</div>';
    }

    function renderWordProblem(container) {
        container.innerHTML = '<div class="word-problem-icon">🤔🌾</div>';
    }

    // ─── Question flow ───
    function shuffleChoices(data) {
        var indices = data.choices.map(function (_, i) { return i; });
        for (var i = indices.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var temp = indices[i]; indices[i] = indices[j]; indices[j] = temp;
        }
        var shuffled = indices.map(function (idx) { return data.choices[idx]; });
        var newAnswer = indices.indexOf(data.answer);
        return { choices: shuffled, answer: newAnswer };
    }

    function showQuestion() {
        if (isGameOver || lives <= 0) return;
        var level = DATA.levels[currentLevel];
        if (currentQuestion >= CFG.QUESTIONS_PER_ROUND) {
            showLevelComplete();
            return;
        }

        answering = true;
        var raw = level.generate();
        var shuffled = shuffleChoices(raw);

        // Update HUD
        $('level-banner').textContent = level.emoji + ' ' + level.name;
        $('progress-fill').style.width = (currentQuestion / CFG.QUESTIONS_PER_ROUND * 100) + '%';
        $('question-num').textContent = 'ข้อ ' + (currentQuestion + 1) + '/' + CFG.QUESTIONS_PER_ROUND;
        $('farmer-avatar').textContent = getFarmerEmoji();

        // Set background for game area
        $('game-area').style.background = level.bg;

        // Visual
        var va = $('visual-area');
        if (raw.visual) {
            switch (raw.visual.type) {
                case 'ruler': renderRuler(va, raw.visual.length, raw.visual.unit); break;
                case 'compare': renderCompare(va, raw.visual.a, raw.visual.b, raw.visual.unit, raw.visual.labelA, raw.visual.labelB); break;
                case 'compare-cross': renderCompare(va, raw.visual.a, raw.visual.b, '', raw.visual.a + ' ' + raw.visual.aUnit, raw.visual.b + ' ' + raw.visual.bUnit); break;
                case 'convert': renderConvert(va, raw.visual.from, raw.visual.to, raw.visual.val); break;
                case 'arithmetic': renderArithmetic(va); break;
                case 'word-problem': renderWordProblem(va); break;
                default: va.innerHTML = '';
            }
        } else {
            va.innerHTML = '';
        }

        // Question text
        $('question-text').textContent = raw.q;

        // Choices
        var choicesEl = $('choices');
        choicesEl.innerHTML = shuffled.choices.map(function (c, i) {
            return '<button class="choice-btn" data-idx="' + i + '" onclick="handleAnswer(' + i + ', ' + shuffled.answer + ')">' + c + '</button>';
        }).join('');
    }

    window.handleAnswer = function (idx, correct) {
        if (!answering || isGameOver) return;
        answering = false;

        var btns = document.querySelectorAll('.choice-btn');
        btns.forEach(function (b) { b.classList.add('disabled'); });

        var btnRect = btns[idx].getBoundingClientRect();
        var popX = btnRect.left + btnRect.width / 2;
        var popY = btnRect.top;

        if (idx === correct) {
            btns[idx].classList.add('correct');
            var gained = CFG.SCORE_CORRECT;
            setScore(score + gained);
            levelScore += gained;
            levelCorrect++;
            totalCorrect++;
            streak++;
            coins++;
            updateStreak();
            updateCoins();
            KAMPAI.sound.correct();
            KAMPAI.sound.fxFlash(true);
            showFeedback('✅ ถูกต้อง!', '#4ade80');
            showScorePopup(popX, popY, '+' + gained, '#4ade80');

            // Streak bonus
            if (streak > 0 && streak % CFG.STREAK_TARGET === 0) {
                setScore(score + CFG.BONUS_STREAK);
                setTimeout(function () {
                    showScorePopup(popX, popY - 30, '🔥 Streak +' + CFG.BONUS_STREAK, '#f59e0b');
                }, 300);
            }
        } else {
            btns[idx].classList.add('wrong');
            btns[correct].classList.add('correct');
            setScore(score - CFG.SCORE_WRONG);
            setLives(lives - 1);
            totalWrong++;
            streak = 0;
            updateStreak();
            KAMPAI.sound.wrong();
            KAMPAI.sound.fxFlash(false);
            showFeedback('❌ ผิด!', '#ef4444');
            showScorePopup(popX, popY, '-' + CFG.SCORE_WRONG, '#ef4444');
        }

        currentQuestion++;
        setTimeout(function () {
            if (!isGameOver && lives > 0) showQuestion();
        }, 1300);
    };

    function showFeedback(text, color) {
        var overlay = $('feedback-overlay');
        overlay.innerHTML = '<div class="feedback-text" style="color:' + color + '">' + text + '</div>';
        overlay.classList.add('show');
        setTimeout(function () { overlay.classList.remove('show'); }, 900);
    }

    function showLevelComplete() {
        var stars = levelCorrect >= 9 ? '⭐⭐⭐' : levelCorrect >= 7 ? '⭐⭐' : '⭐';
        setScore(score + CFG.BONUS_CLEAR);

        // Mark level as cleared
        if (currentLevel > highestLevelCleared) {
            highestLevelCleared = currentLevel;
        }
        // Unlock next level
        if (currentLevel + 1 < DATA.levels.length) {
            unlockedLevels[currentLevel + 1] = true;
        }
        saveProgress();

        $('lc-title').textContent = '🎉 ผ่าน ' + DATA.levels[currentLevel].name + '!';
        $('lc-stars').textContent = stars;
        $('lc-score').textContent = 'คะแนนด่านนี้: ' + (levelScore + CFG.BONUS_CLEAR) + ' (ถูก ' + levelCorrect + '/' + CFG.QUESTIONS_PER_ROUND + ')';

        // Pet unlock reward
        var pet = DATA.pets[currentLevel + 1]; // unlock pet for completing this level
        var rewardHTML = '<div>🪙 +' + CFG.BONUS_CLEAR + ' โบนัสผ่านด่าน!</div>';
        if (pet && currentLevel + 1 < DATA.pets.length) {
            rewardHTML += '<div>ปลดล็อกสัตว์เลี้ยงใหม่!</div>';
            rewardHTML += '<span class="reward-pet">' + pet.emoji + '</span>';
            rewardHTML += '<div>' + pet.name + '</div>';
        }
        $('lc-reward').innerHTML = rewardHTML;

        var isLast = currentLevel >= DATA.levels.length - 1;
        $('lc-next-btn').textContent = isLast ? '🏆 ดูสรุปคะแนน' : '▶ ด่านถัดไป';
        $('level-complete').classList.add('show');
    }

    window.nextLevel = function () {
        $('level-complete').classList.remove('show');
        currentLevel++;
        if (currentLevel >= DATA.levels.length) {
            endGame();
            return;
        }
        currentQuestion = 0;
        levelScore = 0;
        levelCorrect = 0;
        lives = CFG.LIVES;
        setLives(lives);
        showQuestion();
    };

    // ─── End Game ───
    function endGame() {
        if (isGameOver) return;
        isGameOver = true;
        KAMPAI.sound.bgmStop();
        KAMPAI.sound.gameOver();
        KAMPAI.submitScore(score, { mode: 'normal', levelsCleared: highestLevelCleared + 1, totalCorrect: totalCorrect, totalWrong: totalWrong, coins: coins });

        $('final-score').innerText = score;
        saveHighScore(score);

        // Reward summary
        var rs = $('reward-summary');
        var badges = [];
        if (highestLevelCleared >= DATA.levels.length - 1) badges.push({ icon: '🏆', label: 'ผ่านทุกด่าน!' });
        if (totalCorrect >= 40) badges.push({ icon: '💎', label: 'ตอบถูก 40+' });
        else if (totalCorrect >= 30) badges.push({ icon: '🌟', label: 'ตอบถูก 30+' });
        if (score >= 500) badges.push({ icon: '👑', label: '500+ คะแนน' });
        else if (score >= 300) badges.push({ icon: '🥇', label: '300+ คะแนน' });
        badges.push({ icon: '🎯', label: 'ถูก ' + totalCorrect + ' ข้อ' });
        badges.push({ icon: '🪙', label: coins + ' เหรียญ' });

        rs.innerHTML = badges.map(function (b) {
            return '<div class="reward-badge"><div class="rb-icon">' + b.icon + '</div><div class="rb-label">' + b.label + '</div></div>';
        }).join('');

        // Unlocked pets
        var petHTML = '<div>สัตว์เลี้ยงที่ปลดล็อก:</div>';
        petHTML += '<div class="pet-list">';
        for (var i = 0; i <= highestLevelCleared + 1 && i < DATA.pets.length; i++) {
            petHTML += DATA.pets[i].emoji;
        }
        petHTML += '</div>';
        $('unlocked-pets').innerHTML = petHTML;

        // Confetti!
        spawnConfetti();

        $('game-area').style.display = 'none';
        $('gameover-screen').style.display = 'flex';
        renderLeaderboard('score-list-gameover');
    }

    function spawnConfetti() {
        var container = $('confetti-container');
        var colors = ['#ef4444','#f59e0b','#22c55e','#3b82f6','#a855f7','#ec4899','#14b8a6','#fbbf24'];
        for (var i = 0; i < 60; i++) {
            var piece = document.createElement('div');
            piece.className = 'confetti-piece';
            piece.style.left = Math.random() * 100 + '%';
            piece.style.top = '-10px';
            piece.style.background = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDuration = (1.5 + Math.random() * 2) + 's';
            piece.style.animationDelay = Math.random() * 1.5 + 's';
            piece.style.width = (6 + Math.random() * 8) + 'px';
            piece.style.height = (6 + Math.random() * 8) + 'px';
            if (Math.random() > 0.5) piece.style.borderRadius = '50%';
            container.appendChild(piece);
        }
    }

    // ─── Level Select Screen ───
    function showLevelSelectScreen() {
        var list = $('level-list');
        list.innerHTML = DATA.levels.map(function (lvl, i) {
            var unlocked = unlockedLevels[i];
            var completed = i <= highestLevelCleared;
            var current = unlocked && !completed;
            var cls = 'level-card';
            if (!unlocked) cls += ' locked';
            if (completed) cls += ' completed';
            if (current) cls += ' current';

            var status = '';
            if (completed) status = '✅';
            else if (!unlocked) status = '🔒';
            else status = '▶';

            return '<div class="' + cls + '" onclick="' + (unlocked ? 'selectLevel(' + i + ')' : '') + '">' +
                '<span class="lc-emoji">' + lvl.emoji + '</span>' +
                '<div class="lc-info">' +
                    '<div class="lc-name">' + lvl.name + '</div>' +
                    '<div class="lc-sub">' + lvl.subtitle + '</div>' +
                '</div>' +
                '<span class="lc-status">' + status + '</span>' +
            '</div>';
        }).join('');

        $('level-select').classList.add('show');
    }

    window.selectLevel = function (idx) {
        if (!unlockedLevels[idx]) return;
        $('level-select').classList.remove('show');
        currentLevel = idx;
        currentQuestion = 0;
        levelScore = 0;
        levelCorrect = 0;
        lives = CFG.LIVES;
        setLives(lives);
        streak = 0;
        updateStreak();
        $('game-area').style.display = 'flex';
        KAMPAI.sound.bgmStart();
        showQuestion();
    };

    window.showLevelSelect = function () {
        $('howto-screen').classList.remove('show');
        showLevelSelectScreen();
    };

    window.goBackToStart = function () {
        $('level-select').classList.remove('show');
    };

    // ─── Start Game ───
    window.startGame = function () {
        if (started) return;
        started = true;
        KAMPAI.sound.unlock();

        // Show how-to-play first
        $('blocker').style.display = 'none';
        $('howto-screen').classList.add('show');

        // Init HUD
        score = 0;
        lives = CFG.LIVES;
        isGameOver = false;
        currentLevel = 0;
        currentQuestion = 0;
        levelScore = 0;
        levelCorrect = 0;
        totalCorrect = 0;
        totalWrong = 0;
        streak = 0;
        coins = 0;
        setScore(0);
        setLives(lives);
        updateStreak();
        updateCoins();

        $('coins-container').style.display = 'block';
    };

    // ─── High scores ───
    window.closeHighscores = function () {
        $('highscore-screen').classList.remove('show');
    };

})();
