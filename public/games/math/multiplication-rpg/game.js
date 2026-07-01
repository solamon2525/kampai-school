/* game.js — ลอจิกเกม RPG การคูณวิชาคณิตศาสตร์ ป.4 (Client-side Architecture)
   ควบคุมระบบเสียง Web Audio API, ตัวเลือกตัวละคร, ลูปแผนที่ด่าน, และการต่อสู้ RPG */
(function () {
    'use strict';
    var CFG = window.GAME_CONFIG, DATA = window.GAME_DATA;
    var $ = function (id) { return document.getElementById(id); };

    // ── ระบบเสียงและดนตรีสังเคราะห์ 8-bit (Web Audio API Sequencer) ──
    var ChiptuneAudio = (function () {
        var audioCtx = null;
        var bgmInterval = null;
        var bgmNode = null;
        var masterGain = null;
        var isMuted = false;

        function initContext() {
            if (!audioCtx) {
                audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                masterGain = audioCtx.createGain();
                masterGain.gain.setValueAtTime(0.3, audioCtx.currentTime); // รักษาระดับเสียงรวม
                masterGain.connect(audioCtx.destination);
            }
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
        }

        // โน้ตเพลง 8-bit Chiptune สำหรับ 3 ธีมหลัก
        var themes = {
            // ธีมผจญภัยแผนที่โลก (Adventure Map Theme - 120 BPM)
            adventure: {
                bpm: 120,
                notes: [
                    261.63, 293.66, 329.63, 349.23, 392.00, 349.23, 329.63, 293.66,
                    329.63, 349.23, 392.00, 440.00, 493.88, 440.00, 392.00, 349.23,
                    392.00, 440.00, 493.88, 523.25, 587.33, 523.25, 493.88, 440.00,
                    493.88, 392.00, 523.25, 440.00, 392.00, 293.66, 329.63, 261.63
                ]
            },
            // ธีมต่อสู้ปกติ (Battle Theme - 140 BPM)
            battle: {
                bpm: 140,
                notes: [
                    220.00, 220.00, 261.63, 220.00, 293.66, 220.00, 329.63, 293.66,
                    220.00, 220.00, 261.63, 220.00, 392.00, 349.23, 329.63, 293.66,
                    329.63, 329.63, 392.00, 329.63, 440.00, 329.63, 493.88, 440.00,
                    329.63, 329.63, 392.00, 329.63, 523.25, 493.88, 440.00, 392.00
                ]
            },
            // ธีมศึกตัดสินบอส (Boss Anthem Theme - 165 BPM)
            boss: {
                bpm: 165,
                notes: [
                    146.83, 146.83, 164.81, 174.61, 146.83, 196.00, 146.83, 220.00,
                    146.83, 146.83, 164.81, 174.61, 293.66, 261.63, 220.00, 196.00,
                    220.00, 220.00, 261.63, 220.00, 329.63, 293.66, 349.23, 392.00,
                    440.00, 440.00, 392.00, 349.23, 329.63, 293.66, 261.63, 220.00
                ]
            }
        };

        return {
            init: function () {
                initContext();
            },
            // เล่นเสียงประกอบ SFX
            playSfx: function (type) {
                if (isMuted) return;
                initContext();
                var osc = audioCtx.createOscillator();
                var gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(masterGain);

                var now = audioCtx.currentTime;

                if (type === 'click') {
                    // เสียงคลิกเบาๆ
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(600, now);
                    osc.frequency.exponentialRampToValueAtTime(100, now + 0.08);
                    gain.gain.setValueAtTime(0.2, now);
                    gain.gain.linearRampToValueAtTime(0.01, now + 0.08);
                    osc.start(now);
                    osc.stop(now + 0.08);
                }
                else if (type === 'correct') {
                    // เสียงตอบถูกแนว retro (ต๊ด-ตื๊น!)
                    osc.type = 'square';
                    osc.frequency.setValueAtTime(523.25, now); // C5
                    osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
                    gain.gain.setValueAtTime(0.15, now);
                    gain.gain.setValueAtTime(0.15, now + 0.1);
                    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
                    osc.start(now);
                    osc.stop(now + 0.25);
                }
                else if (type === 'wrong') {
                    // เสียงตอบผิด (แตร่ววว)
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(220.00, now); // A3
                    osc.frequency.linearRampToValueAtTime(110.00, now + 0.3); // A2
                    gain.gain.setValueAtTime(0.2, now);
                    gain.gain.linearRampToValueAtTime(0.01, now + 0.3);
                    osc.start(now);
                    osc.stop(now + 0.3);
                }
                else if (type === 'critical') {
                    // เสียงโจมตีรุนแรงคริติคอล
                    osc.type = 'sawtooth';
                    osc.frequency.setValueAtTime(300, now);
                    osc.frequency.exponentialRampToValueAtTime(1200, now + 0.2);
                    gain.gain.setValueAtTime(0.25, now);
                    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
                    osc.start(now);
                    osc.stop(now + 0.25);
                }
                else if (type === 'victory') {
                    // เพลงฉลองชัยชนะดั้นสั้น
                    osc.type = 'square';
                    var notes = [523.25, 587.33, 659.25, 698.46, 783.99, 880.00, 987.77, 1046.50];
                    notes.forEach(function (freq, i) {
                        var t = now + (i * 0.08);
                        osc.frequency.setValueAtTime(freq, t);
                    });
                    gain.gain.setValueAtTime(0.15, now);
                    gain.gain.linearRampToValueAtTime(0.15, now + 0.5);
                    gain.gain.linearRampToValueAtTime(0.01, now + 0.7);
                    osc.start(now);
                    osc.stop(now + 0.7);
                }
                else if (type === 'gameover') {
                    // เสียงแพ้สไตล์ retro หดหู่
                    osc.type = 'triangle';
                    var badNotes = [392.00, 349.23, 311.13, 293.66, 261.63];
                    badNotes.forEach(function (freq, i) {
                        var t = now + (i * 0.15);
                        osc.frequency.setValueAtTime(freq, t);
                    });
                    gain.gain.setValueAtTime(0.2, now);
                    gain.gain.linearRampToValueAtTime(0.01, now + 0.85);
                    osc.start(now);
                    osc.stop(now + 0.85);
                }
            },
            // เริ่มเสียงดนตรีประกอบวนซ้ำ
            startBgm: function (themeName) {
                this.stopBgm();
                initContext();
                var theme = themes[themeName];
                if (!theme) return;
                var noteIdx = 0;
                var stepDuration = 60 / theme.bpm / 2; // ครึ่งหนึ่งของจังหวะ (Eighth note)

                bgmInterval = setInterval(function () {
                    if (isMuted) return;
                    var osc = audioCtx.createOscillator();
                    var gain = audioCtx.createGain();
                    osc.connect(gain);
                    gain.connect(masterGain);

                    // จูนเสียงดนตรีประกอบให้เบากว่า SFX เล็กน้อย
                    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                    gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + stepDuration - 0.02);

                    osc.type = themeName === 'boss' ? 'sawtooth' : 'triangle';
                    osc.frequency.setValueAtTime(theme.notes[noteIdx], audioCtx.currentTime);
                    
                    osc.start();
                    osc.stop(audioCtx.currentTime + stepDuration);

                    noteIdx = (noteIdx + 1) % theme.notes.length;
                }, stepDuration * 1000);
            },
            // หยุดเสียงดนตรีประกอบ
            stopBgm: function () {
                if (bgmInterval) {
                    clearInterval(bgmInterval);
                    bgmInterval = null;
                }
            }
        };
    })();

    // ── ตัวแปรเก็บสถานะการเล่นเกม (Game States) ──
    var ST = {
        selectedJob: null,      // บังคับ: เริ่มต้นว่างเปล่า (No auto-select)
        currentChapter: 1,      // บทเรียนปัจจุบัน
        unlockedStages: [1],    // รายการด่านที่ปลดล็อกแล้ว (สูงสุด 30)
        stageStars: {},         // จำนวนดาวที่ได้ในแต่ละด่าน {'stage_id': 3}
        currentStage: 1,        // ด่านที่กำลังเล่น
        score: 0,               // คะแนนสะสมทั้งหมดในเซสชันนี้
        lives: 3,               // หัวใจคงเหลือในด่านปัจจุบัน
        combo: 0,               // คอมโบปัจจุบัน
        maxCombo: 0,            // คอมโบสูงสุดในด่านนั้น
        correctCount: 0,        // จำนวนตอบถูกในด่าน
        wrongCount: 0,          // จำนวนตอบผิดในด่าน
        speedBonusCount: 0,     // จำนวนที่ตอบเร็วในด่าน
        questionsPool: [],      // รายการคำถามในด่าน
        questionIndex: 0,       // คำถามข้อปัจจุบัน
        currentQuestion: null,  // โจทย์ข้อปัจจุบัน
        enemyMaxHp: 100,
        enemyHp: 100,
        timerInterval: null,
        timerRemaining: 20,
        isTransitioning: false,
        personalBest: 0,
        playsCount: 0,
        dragMatchSelected: null
    };

    // ── KampaiVersus (ออนไลน์ 2 ผู้เล่นซิงค์สด และ Local 2P) ──
    var seededRng = null;
    function createMulberry32(seed) {
        return function () {
            var t = seed += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    var vs = window.KampaiVersus ? KampaiVersus.create({
        duration: CFG.TIME_LIMIT_SEC * 5,
        title: 'Multiplication RPG',
        rankBy: 'score',
        onPlay: function (opts) {
            var rngVal = opts && opts.rng;
            if (rngVal) {
                var seed = Math.floor(rngVal() * 4294967296);
                seededRng = createMulberry32(seed);
            }
            if (!ST.selectedJob) {
                ST.selectedJob = DATA.CHARACTERS[0];
            }
            initiateBattle(1);
        },
        onEnd: function () {
            if (ST.timerInterval) clearInterval(ST.timerInterval);
            ChiptuneAudio.stopBgm();
            ChiptuneAudio.playSfx('gameover');
            renderAdventureMap();
            changeScreen('map-screen');
        }
    }) : null;

    // ── การตั้งค่าเบื้องต้นจาก KAMPAI SDK ──
    KAMPAI.setSlug(CFG.SLUG);

    function syncScoreFromSDK() {
        var stt = KAMPAI.stats;
        if (stt) {
            ST.personalBest = stt.personalBest || 0;
            ST.playsCount = stt.playsCount || 0;
            $('my-best-score').innerText = ST.personalBest.toLocaleString();
            $('my-play-count').innerText = ST.playsCount.toLocaleString();
        }
        renderLeaderboard();
    }

    function renderLeaderboard() {
        var list = $('main-leaderboard');
        if (!list) return;
        var rows = KAMPAI.leaderboard || [];
        if (rows.length === 0) {
            list.innerHTML = '<li class="empty-lb">ยังไม่มีผู้ท้าชิงขึ้นบอร์ด — เล่นเพื่อชิงสถิติได้เลย!</li>';
            return;
        }
        var medals = ['🥇', '🥈', '🥉'];
        list.innerHTML = rows.slice(0, 5).map(function (r) {
            var rankLabel = medals[r.rank - 1] || (r.rank + '.');
            var isMeClass = r.isMe ? 'class="me"' : '';
            return '<li ' + isMeClass + '>' +
                '<span>' + rankLabel + ' ' + r.displayName + (r.isMe ? ' (คุณ)' : '') + '</span>' +
                '<strong>⭐ ' + (r.personalBest || 0).toLocaleString() + '</strong>' +
                '</li>';
        }).join('');
    }

    KAMPAI.onReady(function () {
        syncScoreFromSDK();
        ChiptuneAudio.init();
        ChiptuneAudio.startBgm('adventure');
    });

    // ── ระบบจัดการเปลี่ยนหน้าจอ (Screen Engine) ──
    function changeScreen(screenId) {
        var screens = document.querySelectorAll('.screen');
        for (var i = 0; i < screens.length; i++) {
            screens[i].classList.remove('active');
        }
        $(screenId).classList.add('active');

        // จัดการดนตรีตามประเภทหน้าจอ
        if (screenId === 'start-screen' || screenId === 'select-char-screen' || screenId === 'map-screen') {
            ChiptuneAudio.startBgm('adventure');
        }
    }

    // ── เริ่มต้นระบบเลือกตัวละคร (Character Select Module) ──
    function setupCharacterSelect() {
        var grid = $('char-grid');
        grid.innerHTML = DATA.CHARACTERS.map(function (c) {
            return '<div class="char-card" id="card-' + c.id + '" data-id="' + c.id + '">' +
                '<div class="char-svg-box">' + c.svg + '</div>' +
                '<div class="char-name" style="color: ' + c.color + '">' + c.name + '</div>' +
                '<div class="char-hp">❤️ HP: ' + c.maxHp + '</div>' +
                '<div class="char-desc">' + c.desc + '<br><b>อาวุธ: </b>' + c.weapon + '</div>' +
                '</div>';
        }).join('');

        // ผูก Event การคลิกเลือกการ์ด (ห้ามเลือกตัวใดไว้ล่วงหน้า!)
        var cards = document.querySelectorAll('.char-card');
        for (var i = 0; i < cards.length; i++) {
            cards[i].addEventListener('click', function () {
                ChiptuneAudio.playSfx('click');
                var jobID = this.getAttribute('data-id');
                
                // ล้างคลาสที่เลือกบนการ์ดใบอื่นทั้งหมด
                for (var j = 0; j < cards.length; j++) {
                    cards[j].classList.remove('selected');
                }
                
                // ตั้งค่าใน State และเปิดสไตล์
                ST.selectedJob = DATA.CHARACTERS.find(function (x) { return x.id === jobID; });
                this.classList.add('selected');

                // ปลดล็อกปุ่มยืนยันเดินทาง
                $('btn-confirm-char').removeAttribute('disabled');
            });
        }
    }

    // ── สร้างหน้าจอแผนที่การเดินทาง (Adventure Map Module) ──
    function renderAdventureMap() {
        var container = $('stages-map');
        var chapter = DATA.CHAPTERS.find(function (c) { return c.id === ST.currentChapter; });
        
        $('current-chapter-title').innerText = chapter.title;
        $('current-chapter-desc').innerText = chapter.desc;

        // คำนวณช่วงด่านในบทนั้น เช่น บทที่ 1: ด่าน 1-10, บทที่ 2: ด่าน 11-20
        var startStage = (ST.currentChapter - 1) * CFG.STAGES_PER_CHAPTER + 1;
        var endStage = startStage + CFG.STAGES_PER_CHAPTER - 1;

        var html = '';
        for (var s = startStage; s <= endStage; s++) {
            var isBoss = CFG.BOSS_STAGES.indexOf(s) !== -1;
            var isUnlocked = ST.unlockedStages.indexOf(s) !== -1;
            var isCleared = ST.stageStars[s] !== undefined;

            var classes = 'stage-node';
            if (isBoss) classes += ' boss-node';
            if (isCleared) classes += ' cleared';
            else if (isUnlocked) classes += ' unlocked';

            var starsHtml = '';
            if (isCleared) {
                var starsCount = ST.stageStars[s] || 0;
                starsHtml = '<div style="position: absolute; top: -14px; font-size: 10px;">' + '⭐'.repeat(starsCount) + '</div>';
            }

            var nodeIcon = isBoss ? '👑' : s;

            html += '<div class="' + classes + '" data-stage="' + s + '" id="node-' + s + '">' +
                starsHtml +
                nodeIcon +
                '<span class="node-label">' + (isBoss ? 'บอสประจำบท' : 'ด่านที่ ' + s) + '</span>' +
                '</div>';
        }
        container.innerHTML = html;

        // ผูก Event การคลิกด่านที่ปลดล็อกแล้ว
        var nodes = document.querySelectorAll('.stage-node');
        for (var k = 0; k < nodes.length; k++) {
            nodes[k].addEventListener('click', function () {
                var stageId = parseInt(this.getAttribute('data-stage'), 10);
                if (ST.unlockedStages.indexOf(stageId) !== -1) {
                    ChiptuneAudio.playSfx('click');
                    initiateBattle(stageId);
                }
            });
        }

        // อัปเดต HUD ท้ายหน้าแผนที่
        $('player-avatar-hud').innerHTML = ST.selectedJob.svg;
        $('player-name-hud').innerText = ST.selectedJob.name;
        $('player-score-hud').innerText = '⭐ ' + ST.score.toLocaleString();
    }

    // ── เริ่มต้นระบบการด่านต่อสู้ RPG (Battle Initiation Module) ──
    function initiateBattle(stageId) {
        ST.currentStage = stageId;
        ST.scoreThisStage = 0;
        ST.lives = CFG.LIVES;
        ST.combo = 0;
        ST.maxCombo = 0;
        ST.correctCount = 0;
        ST.wrongCount = 0;
        ST.speedBonusCount = 0;
        ST.questionIndex = 0;

        // ดึงรายการคำถามสำหรับบทเรียนนั้น
        var cKey = 'chapter' + ST.currentChapter;
        var fullPool = DATA.QUESTIONS[cKey];
        // สุ่มสลับคำถาม
        ST.questionsPool = fullPool.slice().sort(function () { return 0.5 - rng(); }).slice(0, 5); // จำกัด 5 ข้อต่อด่าน

        // สุ่มมอนสเตอร์หรือเรียกบอส
        var isBoss = CFG.BOSS_STAGES.indexOf(stageId) !== -1;
        var monsterType;
        if (isBoss) {
            monsterType = 'boss' + ST.currentChapter;
        } else {
            var monstersList = ST.currentChapter === 1 ? ['slime', 'bat'] : ['gear', 'golem', 'griffin', 'dragon'];
            monsterType = monstersList[Math.floor(rng() * monstersList.length)];
        }

        var mData = DATA.MONSTERS[monsterType];
        ST.enemyMaxHp = mData.hp;
        ST.enemyHp = mData.hp;

        // ตั้งหน้าจอต่อสู้
        $('battle-stage-title').innerText = isBoss ? 'ศึกด่านบอส!' : 'ด่านที่ ' + stageId;
        
        // สุ่มประเภทมินิเกมตามลำดับ
        var gameTypes = ['quiz', 'match', 'fill'];
        // บอสใหญ่ต้องเป็น Quiz บอสที่หินกว่าเดิม
        var stageType = isBoss ? 'boss-quiz' : gameTypes[(stageId - 1) % gameTypes.length];
        
        var typeLabels = {
            'quiz': 'โหมด 4 ตัวเลือก',
            'match': 'โหมดจับคู่ด่วน',
            'fill': 'โหมดเติมเลขในช่องว่าง',
            'boss-quiz': 'ศึกตัดสินบอสคณิตวิเคราะห์'
        };
        $('battle-stage-type').innerText = typeLabels[stageType];
        ST.stageType = stageType;

        // โหลดกราฟิก SVG ศัตรูและผู้เล่น
        $('player-job-name').innerText = ST.selectedJob.name;
        $('player-svg-holder').innerHTML = ST.selectedJob.svg;
        $('enemy-name').innerText = mData.name;
        $('enemy-svg-holder').innerHTML = mData.svg;

        var eSprite = $('enemy-sprite-container');
        if (isBoss) {
            eSprite.classList.add('boss-aura');
        } else {
            eSprite.classList.remove('boss-aura');
        }

        updateBattleHUD();
        changeScreen('battle-screen');

        // เริ่มเพลงต่อสู้
        if (isBoss) {
            ChiptuneAudio.startBgm('boss');
        } else {
            ChiptuneAudio.startBgm('battle');
        }

        loadQuestion();
    }

    function updateBattleHUD() {
        $('battle-score').innerText = '⭐ ' + (ST.score + ST.scoreThisStage).toLocaleString();
        
        // วาดหัวใจ
        var heartsStr = '';
        for (var i = 0; i < CFG.LIVES; i++) {
            heartsStr += i < ST.lives ? '❤️' : '🖤';
        }
        $('player-hearts').innerText = heartsStr;

        // วาดพลังชีวิตศัตรู
        var percent = Math.max(0, (ST.enemyHp / ST.enemyMaxHp) * 100);
        $('enemy-hp-bar').style.width = percent + '%';
        $('enemy-hp-text').innerText = Math.max(0, ST.enemyHp) + ' / ' + ST.enemyMaxHp;

        // คอมโบป๊อปอัพ
        var cBadge = $('battle-combo');
        if (ST.combo > 0) {
            cBadge.innerText = 'Combo ' + ST.combo;
            cBadge.style.display = 'inline-block';
        } else {
            cBadge.style.display = 'none';
        }
    }

    // ── โหลดข้อคำถามของมินิเกม (Mini-Game Launcher) ──
    function loadQuestion() {
        if (ST.enemyHp <= 0) {
            triggerVictory();
            return;
        }

        if (ST.questionIndex >= ST.questionsPool.length) {
            // เล่นคำถามครบแล้วแต่บอสยังไม่ตาย
            if (ST.enemyHp > 0) {
                triggerDefeat();
            } else {
                triggerVictory();
            }
            return;
        }

        ST.currentQuestion = ST.questionsPool[ST.questionIndex];
        $('battle-question').innerText = ST.currentQuestion.q;

        // ซ่อนพาเนลคำตอบทั้งหมดก่อน
        $('panel-quiz').classList.remove('active');
        $('panel-match').classList.remove('active');
        $('panel-fill').classList.remove('active');

        // เปิดรับอินพุตการแตะจับคู่เริ่มต้นใหม่
        ST.dragMatchSelected = null;

        if (ST.stageType === 'quiz' || ST.stageType === 'boss-quiz') {
            $('panel-quiz').classList.add('active');
            var btns = document.querySelectorAll('#panel-quiz .choice-btn');
            for (var i = 0; i < btns.length; i++) {
                var textSpan = btns[i].querySelector('.choice-text');
                textSpan.innerText = ST.currentQuestion.choices[i] || '';
            }
        } 
        else if (ST.stageType === 'match') {
            $('panel-match').classList.add('active');
            setupDragMatchMode();
        } 
        else if (ST.stageType === 'fill') {
            $('panel-fill').classList.add('active');
            setupFillInBlankMode();
        }

        // จัดเวลาจับเวลาด่าน
        var limit = ST.stageType === 'speed' ? CFG.SPEED_CHALLENGE_TIME : CFG.TIME_LIMIT_SEC;
        ST.timerRemaining = limit;
        updateTimerBar(limit);

        if (ST.timerInterval) clearInterval(ST.timerInterval);
        ST.timerInterval = setInterval(function () {
            ST.timerRemaining -= 0.1;
            updateTimerBar(limit);

            if (ST.timerRemaining <= 0) {
                clearInterval(ST.timerInterval);
                processAnswer(false, 'หมดเวลา!');
            }
        }, 100);
    }

    function updateTimerBar(limit) {
        var pct = Math.max(0, (ST.timerRemaining / limit) * 100);
        var fill = $('timer-bar');
        var text = $('timer-counter');
        
        fill.style.width = pct + '%';
        text.innerText = Math.max(0, Math.ceil(ST.timerRemaining)) + 's';

        // ปรับเปลี่ยนสีตามเวลาที่เหลืออย่างสมูท
        if (pct > 50) {
            fill.style.backgroundColor = 'var(--color-success)';
        } else if (pct > 25) {
            fill.style.backgroundColor = 'var(--color-warning)';
        } else {
            fill.style.backgroundColor = 'var(--color-danger)';
            // กระพริบแดงเตือนภัย
            if (Math.floor(ST.timerRemaining * 5) % 2 === 0) {
                fill.style.opacity = 0.5;
            } else {
                fill.style.opacity = 1;
            }
        }
    }

    // ── การตั้งค่ามินิเกมโหมด 2: Drag & Match (Pair Selection) ──
    function setupDragMatchMode() {
        var q = ST.currentQuestion;
        
        // โจทย์กับตัวเลือกผสมกันในแนว RPG
        var pairs = [
            { id: 0, text: q.q.split('ผลคูณของ ')[1] ? q.q.split(' มีค่า')[0] : q.q, match: q.choices[q.answer] },
            { id: 1, text: '20 × 5', match: '100' },
            { id: 2, text: '12 × 12', match: '144' }
        ];

        var leftCol = $('match-left-col');
        var rightCol = $('match-right-col');

        // สุ่มโจทย์คอลัมน์ซ้าย
        var lefts = pairs.slice().sort(function() { return 0.5 - rng(); });
        leftCol.innerHTML = lefts.map(function(item) {
            return '<div class="match-item left-item" data-id="' + item.id + '" id="match-l-' + item.id + '">' + item.text + '</div>';
        }).join('');

        // สุ่มคำตอบคอลัมน์ขวา
        var rights = pairs.slice().sort(function() { return 0.5 - rng(); });
        rightCol.innerHTML = rights.map(function(item) {
            return '<div class="match-item right-item" data-id="' + item.id + '" id="match-r-' + item.id + '">' + item.match + '</div>';
        }).join('');

        // ผูกอีเวนต์คลิกสำหรับคอลัมน์ซ้ายและขวา
        var matchItems = document.querySelectorAll('.match-item');
        for (var i = 0; i < matchItems.length; i++) {
            matchItems[i].addEventListener('click', function() {
                if (this.classList.contains('matched')) return;
                ChiptuneAudio.playSfx('click');

                var isLeft = this.classList.contains('left-item');
                
                // เคลียร์รายการที่เคยเลือกประเภทเดียวกัน
                var siblings = isLeft ? document.querySelectorAll('.left-item') : document.querySelectorAll('.right-item');
                for (var j = 0; j < siblings.length; j++) {
                    siblings[j].classList.remove('selected');
                }
                
                this.classList.add('selected');

                if (ST.dragMatchSelected === null) {
                    ST.dragMatchSelected = this;
                } else {
                    var prev = ST.dragMatchSelected;
                    var prevIsLeft = prev.classList.contains('left-item');

                    // ตรวจทานว่าเลือกคนละฝั่ง
                    if (prevIsLeft !== isLeft) {
                        var id1 = prev.getAttribute('data-id');
                        var id2 = this.getAttribute('data-id');

                        if (id1 === id2) {
                            // จับคู่ถูกต้อง
                            prev.classList.add('matched');
                            this.classList.add('matched');
                            prev.classList.remove('selected');
                            this.classList.remove('selected');
                            ST.dragMatchSelected = null;

                            // เช็กว่าจับคู่ครบทุกตัวหรือยัง
                            var allMatched = document.querySelectorAll('.match-item.matched').length;
                            if (allMatched === 6) {
                                processAnswer(true, 'จับคู่สมบูรณ์!');
                            }
                        } else {
                            // จับคู่ผิดพลาด
                            prev.classList.remove('selected');
                            this.classList.remove('selected');
                            ST.dragMatchSelected = null;
                            processAnswer(false, 'การจับคู่คลาดเคลื่อน!');
                        }
                    } else {
                        // เลือกฝั่งเดียวกันซ้ำ
                        ST.dragMatchSelected = this;
                    }
                }
            });
        }
    }

    // ── การตั้งค่ามินิเกมโหมด 3: Fill in the Blank (เติมตัวเลขที่หายไป) ──
    function setupFillInBlankMode() {
        var q = ST.currentQuestion;
        
        // นำเสนอโจทย์ เช่น 12 x A = 540 หรือ ผลคูณของ A x B = ?
        var text = q.q;
        var displayStr = '';
        if (text.indexOf('×') !== -1) {
            displayStr = text.split('มีค่า')[0] || text;
        } else {
            displayStr = text;
        }

        // ค้นหาตัวเลขที่ถูกต้อง
        var correctVal = q.choices[q.answer];
        $('fill-eq-display').innerText = displayStr.replace(correctVal, '[ ? ]');

        // สุ่มตัวเลือกในโหมดเติมคำ
        var optionsRow = $('fill-options');
        optionsRow.innerHTML = q.choices.map(function(val) {
            return '<button class="fill-choice-btn" data-val="' + val + '">' + val + '</button>';
        }).join('');

        var optBtns = document.querySelectorAll('.fill-choice-btn');
        for (var i = 0; i < optBtns.length; i++) {
            optBtns[i].addEventListener('click', function() {
                var clickedVal = this.getAttribute('data-val');
                var isCorrect = clickedVal === correctVal;
                processAnswer(isCorrect, isCorrect ? 'เติมคำตอบสมบูรณ์!' : 'คำตอบยังไม่ลงตัว!');
            });
        }
    }

    // ── ตรวจคำตอบและประมวลผลการคำนวณ RPG (Answer Processing & Damage Calc) ──
    function processAnswer(isCorrect, statusText) {
        if (ST.isTransitioning) return;
        ST.isTransitioning = true;
        
        if (ST.timerInterval) {
            clearInterval(ST.timerInterval);
            ST.timerInterval = null;
        }

        var playerNode = $('player-sprite-container');
        var enemyNode = $('enemy-sprite-container');

        if (isCorrect) {
            ST.combo++;
            ST.correctCount++;
            
            // ตรวจสอบโบนัสความเร็ว (Speed Bonus)
            var limit = ST.stageType === 'speed' ? CFG.SPEED_CHALLENGE_TIME : CFG.TIME_LIMIT_SEC;
            var isSpeedy = ST.timerRemaining > (limit / 2);
            if (isSpeedy) {
                ST.speedBonusCount++;
            }

            // คำนวณ Critical Hit
            var isCrit = rng() < CFG.CRITICAL_CHANCE;
            var baseDmg = isCrit ? 150 : 80;
            var comboMult = 1 + (Math.floor(ST.combo / CFG.COMBO_STEP) * 0.1);
            var finalDmg = Math.round(baseDmg * comboMult);
            ST.enemyHp -= finalDmg;

            var scoreGain = CFG.POINTS_CORRECT;
            if (isSpeedy) scoreGain += CFG.POINTS_SPEED_BONUS;
            ST.scoreThisStage += scoreGain;

            // เล่นเสียงประกอบการตอบถูกและโจมตี
            if (isCrit) {
                ChiptuneAudio.playSfx('critical');
                showFloatingText('CRITICAL! ' + finalDmg + ' DMG', 'enemy-sprite-container', 'combo-popup');
            } else {
                ChiptuneAudio.playSfx('correct');
                showFloatingText('-' + finalDmg + ' DMG', 'enemy-sprite-container', 'combo-popup');
            }

            // แอนิเมชันโจมตี RPG
            playerNode.classList.add('attack-player');
            setTimeout(function () {
                playerNode.classList.remove('attack-player');
                enemyNode.classList.add('damaged');
                setTimeout(function () {
                    enemyNode.classList.remove('damaged');
                }, 400);
            }, 200);

        } else {
            // ตอบผิด: มอนสเตอร์ตีผู้เล่น
            ST.combo = 0;
            ST.wrongCount++;
            ST.lives--;
            ST.scoreThisStage = Math.max(0, ST.scoreThisStage + CFG.POINTS_WRONG);

            ChiptuneAudio.playSfx('wrong');
            showFloatingText('💔 HP -1', 'player-sprite-container', 'combo-popup');

            // ศัตรูพุ่งชน
            enemyNode.classList.add('attack-enemy');
            setTimeout(function () {
                enemyNode.classList.remove('attack-enemy');
                playerNode.classList.add('damaged');
                $('app').classList.add('shake-screen');
                setTimeout(function () {
                    playerNode.classList.remove('damaged');
                    $('app').classList.remove('shake-screen');
                }, 400);
            }, 200);
        }

        // เก็บระดับสูงสุดของคอมโบ
        if (ST.combo > ST.maxCombo) {
            ST.maxCombo = ST.combo;
        }

        updateBattleHUD();

        if (vs) {
            vs.report(ST.score + ST.scoreThisStage, {
                correct: ST.correctCount,
                wrong: ST.wrongCount
            });
        }

        // ตรวจสอบเงื่อนไขแพ้ชนะหลังหน่วงการแอนิเมชันเสร็จสิ้น
        setTimeout(function () {
            ST.isTransitioning = false;
            
            if (ST.lives <= 0) {
                triggerDefeat();
            } else if (ST.enemyHp <= 0) {
                triggerVictory();
            } else {
                ST.questionIndex++;
                loadQuestion();
            }
        }, 1500);
    }

    // ── แสดงผลแอนิเมชันตัวหนังสือลอยบนหน้าจอ ──
    function showFloatingText(text, containerId, className) {
        var parent = $(containerId);
        if (!parent) return;
        var pop = document.createElement('div');
        pop.className = className || 'combo-popup';
        pop.innerText = text;
        
        // กำหนดตำแหน่งให้อยู่บริเวณกลาง sprite
        pop.style.top = '40%';
        pop.style.left = '35%';

        parent.appendChild(pop);
        setTimeout(function () {
            pop.remove();
        }, 800);
    }

    // ── โหมดจบการต่อสู้: ชนะด่าน (Victory Handler) ──
    function triggerVictory() {
        if (ST.timerInterval) clearInterval(ST.timerInterval);
        
        ChiptuneAudio.stopBgm();
        ChiptuneAudio.playSfx('victory');

        // คำนวณดาว
        var stars = 1;
        if (ST.lives === CFG.LIVES) stars = 3;
        else if (ST.lives >= 2) stars = 2;

        // บันทึกสถิติลงด่าน
        ST.stageStars[ST.currentStage] = stars;
        ST.score += ST.scoreThisStage;

        // ปลดล็อกด่านถัดไป
        var nextStg = ST.currentStage + 1;
        if (ST.unlockedStages.indexOf(nextStg) === -1 && nextStg <= 30) {
            ST.unlockedStages.push(nextStg);
        }

        // จัดป้ายรายละเอียดชัยชนะ
        $('victory-stage-name').innerText = 'ด่านที่ ' + ST.currentStage + ' สำเร็จแล้ว!';
        $('victory-stars').innerText = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        $('victory-gained-score').innerText = '+' + ST.scoreThisStage.toLocaleString();
        
        var speedBonusPoints = ST.speedBonusCount * CFG.POINTS_SPEED_BONUS;
        $('victory-speed-bonus').innerText = '+' + speedBonusPoints.toLocaleString();
        
        var totalStageScore = ST.scoreThisStage + speedBonusPoints;
        $('victory-total-score').innerText = totalStageScore.toLocaleString();

        // ส่งคะแนนสะสมสูงสุดและสถิติผ่าน KAMPAI SDK
        KAMPAI.submitScore(ST.score, {
            mode: 'normal',
            stars: stars,
            correct: ST.correctCount,
            wrong: ST.wrongCount,
            speedBonus: ST.speedBonusCount
        });

        // ซิงค์สถิติอันดับคะแนนใหม่
        syncScoreFromSDK();

        if (vs && vs.finish(ST.score, { correct: ST.correctCount, wrong: ST.wrongCount })) return;

        changeScreen('victory-screen');
    }

    // ── โหมดจบการต่อสู้: พ่ายแพ้ด่าน (Defeat Handler) ──
    function triggerDefeat() {
        if (ST.timerInterval) clearInterval(ST.timerInterval);
        
        ChiptuneAudio.stopBgm();
        ChiptuneAudio.playSfx('gameover');

        if (vs && vs.finish(ST.score, { correct: ST.correctCount, wrong: ST.wrongCount })) return;

        changeScreen('gameover-screen');
    }

    // ── สุ่มเลขแบบรวดเร็ว ──
    function rng() {
        return seededRng ? seededRng() : Math.random();
    }

    // ── ผูกตัวเชื่อมโยงปุ่มเหตุการณ์ UI (Event Bindings) ──
    
    // หน้าหลักไปยังเลือกอาชีพ
    $('btn-to-select-char').addEventListener('click', function () {
        ChiptuneAudio.playSfx('click');
        // รีเซ็ตการเลือกเริ่มต้นทุกครั้งเพื่อให้เป็นไปตามกฎ No auto-select
        ST.selectedJob = null;
        var cards = document.querySelectorAll('.char-card');
        for (var i = 0; i < cards.length; i++) {
            cards[i].classList.remove('selected');
        }
        $('btn-confirm-char').setAttribute('disabled', 'true');
        
        setupCharacterSelect();
        changeScreen('select-char-screen');
    });

    // ปุ่มกลับหลัง
    $('btn-back-to-start').addEventListener('click', function () {
        ChiptuneAudio.playSfx('click');
        changeScreen('start-screen');
    });

    // ยืนยันตัวละครเดินทางเข้าหน้าแผนที่
    $('btn-confirm-char').addEventListener('click', function () {
        ChiptuneAudio.playSfx('click');
        renderAdventureMap();
        changeScreen('map-screen');
    });

    // ปุ่มสลับบทเรียนในแผนที่
    $('btn-prev-chapter').addEventListener('click', function () {
        if (ST.currentChapter > 1) {
            ChiptuneAudio.playSfx('click');
            ST.currentChapter--;
            renderAdventureMap();
        }
    });

    $('btn-next-chapter').addEventListener('click', function () {
        if (ST.currentChapter < CFG.TOTAL_CHAPTERS) {
            ChiptuneAudio.playSfx('click');
            ST.currentChapter++;
            renderAdventureMap();
        }
    });

    $('btn-map-to-select').addEventListener('click', function () {
        ChiptuneAudio.playSfx('click');
        // รีเซ็ตตัวเลือกเพื่อให้คุณครูเช็กกฎ No auto-select
        ST.selectedJob = null;
        setupCharacterSelect();
        $('btn-confirm-char').setAttribute('disabled', 'true');
        changeScreen('select-char-screen');
    });

    // ยอมแพ้ในสนามรบกลับไปหน้าแผนที่
    $('btn-battle-quit').addEventListener('click', function () {
        ChiptuneAudio.playSfx('click');
        if (ST.timerInterval) clearInterval(ST.timerInterval);
        if (vs) vs.leave();
        renderAdventureMap();
        changeScreen('map-screen');
    });

    // ท้าทายด่านเดิมใหม่
    $('btn-retry-stage').addEventListener('click', function () {
        ChiptuneAudio.playSfx('click');
        initiateBattle(ST.currentStage);
    });

    $('btn-gameover-to-map').addEventListener('click', function () {
        ChiptuneAudio.playSfx('click');
        renderAdventureMap();
        changeScreen('map-screen');
    });

    // ไปต่อด่านถัดไปหลังจากชนะ
    $('btn-next-stage').addEventListener('click', function () {
        ChiptuneAudio.playSfx('click');
        var nextStg = ST.currentStage + 1;
        if (nextStg <= 30) {
            initiateBattle(nextStg);
        } else {
            // จบการเดินทางทั้งหมด
            renderAdventureMap();
            changeScreen('map-screen');
        }
    });

    $('btn-victory-to-map').addEventListener('click', function () {
        ChiptuneAudio.playSfx('click');
        renderAdventureMap();
        changeScreen('map-screen');
    });

    // ตัวคำตอบโหมด Quiz
    var quizBtns = document.querySelectorAll('#panel-quiz .choice-btn');
    for (var m = 0; m < quizBtns.length; m++) {
        quizBtns[m].addEventListener('click', function () {
            var clickedIdx = parseInt(this.getAttribute('data-idx'), 10);
            var isCorrect = clickedIdx === ST.currentQuestion.answer;
            processAnswer(isCorrect, isCorrect ? 'โจมตีสำเร็จ!' : 'ตั้งรับล้มเหลว!');
        });
    }

    // คู่มือคำใบ้และโมดัล
    $('btn-show-hint').addEventListener('click', function () {
        ChiptuneAudio.playSfx('click');
        $('hint-content').innerText = ST.currentQuestion.hint || 'คำคูณทีละหลักจากหลักขวาไปยังหลักซ้าย';
        $('hint-modal').classList.add('active');
    });

    $('btn-close-hint').addEventListener('click', function () {
        ChiptuneAudio.playSfx('click');
        $('hint-modal').classList.remove('active');
    });

    // เคลียร์ Timer และ Audio เมื่ออกจากหน้าต่าง
    window.addEventListener('beforeunload', function () {
        if (ST.timerInterval) clearInterval(ST.timerInterval);
        ChiptuneAudio.stopBgm();
        if (vs) vs.leave();
    });

    // แสดงปุ่มออนไลน์หาระบบรองรับ
    if (window.KampaiVersus && vs) {
        var onlineBtn = $('online-btn');
        if (onlineBtn) {
            onlineBtn.style.display = 'inline-flex';
            onlineBtn.addEventListener('click', function () {
                ChiptuneAudio.playSfx('click');
                vs.openMenu();
            });
        }
    }

})();
