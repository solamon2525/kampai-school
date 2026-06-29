/**
 * GAME LOGIC — Genetic Treasure Quest
 * เกมสำรวจและตามล่าหีบสมบัติพันธุศาสตร์ ป.6/ม.ต้น
 */
(function () {
    'use strict';

    var CFG  = window.GAME_CONFIG;
    var DATA = window.GAME_DATA;

    // ─── SDK init ───
    KAMPAI.setSlug(CFG.SLUG);
    KAMPAI.sound.defaultBgm(CFG.BGM_PRESET);
    KAMPAI.sound.mountToggles();

    // ปุ่มเสียง SDK — มุมล่างขวา (default)

    // Local state
    var playerData = {
        level: 1,
        exp: 0,
        hp: 100,
        maxHp: 100,
        inventory: [],
        completedChests: [],
        achievements: [],
        playerPos: { x: 2000, y: 2000 }
    };

    var score = 0;
    var activeChest = null;
    var quizTimerInterval = null;
    var quizTimeLeft = 15;
    var isSaving = false;

    // Load progress from localStorage
    function loadLocalProgress() {
        try {
            var saved = localStorage.getItem('genetic-quest-progress');
            if (saved) {
                var parsed = JSON.parse(saved);
                if (parsed) {
                    playerData = Object.assign({}, playerData, parsed);
                }
            }
        } catch (e) { console.error("Save corrupted:", e); }
    }

    window.saveGameData = function (manual) {
        if (isSaving) return;
        isSaving = true;

        if (window.game && window.game.scene.scenes[1]) {
            var mainScene = window.game.scene.scenes[1];
            if (mainScene && mainScene.player) {
                playerData.playerPos.x = mainScene.player.x;
                playerData.playerPos.y = mainScene.player.y;
            }
        }

        try {
            localStorage.setItem('genetic-quest-progress', JSON.stringify(playerData));
            if (manual) showMessage("💾 บันทึกความคืบหน้าสำเร็จ!", "success");
        } catch (e) { console.error("Failed to save progress:", e); }
        
        isSaving = false;
    };

    // ─── Player + Leaderboard (Boilerplate) ───
    function renderPlayer() {
        var s = KAMPAI.student, st = KAMPAI.stats;
        if (!s) return;
        var chip = document.getElementById('player-chip');
        if (chip) {
            var av = s.photoUrl ? '<img src="' + s.photoUrl + '" alt="">' : '<div class="pc-init">' + (s.displayName || '?')[0] + '</div>';
            var best = st ? ' · <span class="pc-best">สถิติสูงสุด ' + st.personalBest.toLocaleString() + '</span>' : '';
            chip.innerHTML = av + '<span>' + s.displayName + best + '</span>';
            chip.style.display = 'flex';
        }
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

    KAMPAI.onReady(function () {
        renderPlayer();
        renderMyStats();
        renderLeaderboard('score-list');
    });

    // ─── HUD Alerts ───
    function showMessage(msg, type) {
        var alertBox = document.getElementById('custom-alert');
        var alertIcon = document.getElementById('alert-icon');
        var alertText = document.getElementById('alert-text');
        if (!alertBox || !alertText || !alertIcon) return;

        alertText.innerText = msg;
        alertIcon.innerText = type === "error" ? "❌" : type === "success" ? "✨" : "ℹ️";
        alertBox.style.opacity = "1";
        setTimeout(function () { alertBox.style.opacity = "0"; }, 3000);
    }

    function updateHUD() {
        document.getElementById('hud-level').innerText = playerData.level;
        document.getElementById('hud-chests').innerText = 'หีบ: ' + playerData.completedChests.length + '/' + CFG.CHESTS_TOTAL;

        // Calc HP percentage
        var hpPercent = Math.max(0, Math.min(100, (playerData.hp / playerData.maxHp) * 100));
        document.getElementById('hud-hp-bar').style.width = hpPercent + '%';

        // Calc EXP percentage
        var expReq = playerData.level * CFG.EXP_BASE;
        var expPercent = Math.min(100, (playerData.exp / expReq) * 100);
        document.getElementById('hud-exp-bar').style.width = expPercent + '%';
    }

    function checkLevelUp() {
        var expReq = playerData.level * CFG.EXP_BASE;
        if (playerData.exp >= expReq) {
            playerData.exp -= expReq;
            playerData.level++;
            playerData.maxHp += 20;
            playerData.hp = playerData.maxHp; // Heal to full on level up
            KAMPAI.sound.correct();
            showMessage("🎉 เลเวลอัพเป็น " + playerData.level + "! ขยายขีดจำกัด HP แล้ว", "success");
            updateHUD();
            checkLevelUp(); // check recursively
        }
    }

    function checkAchievements() {
        if (playerData.completedChests.length >= 1 && !playerData.achievements.includes("นักสะสมมือใหม่")) {
            playerData.achievements.push("นักสะสมมือใหม่");
            showMessage("🏆 ปลดล็อคความสำเร็จ: นักสะสมมือใหม่", "success");
        }
        if (playerData.completedChests.length >= 15 && !playerData.achievements.includes("ผู้เชี่ยวชาญระดับกลาง")) {
            playerData.achievements.push("ผู้เชี่ยวชาญระดับกลาง");
            showMessage("🏆 ปลดล็อคความสำเร็จ: ผู้เชี่ยวชาญระดับกลาง", "success");
        }
        if (playerData.completedChests.length >= 35 && !playerData.achievements.includes("ถอดรหัสจีโนมครึ่งทาง")) {
            playerData.achievements.push("ถอดรหัสจีโนมครึ่งทาง");
            showMessage("🏆 ปลดล็อคความสำเร็จ: ถอดรหัสจีโนมครึ่งทาง", "success");
        }
        if (playerData.completedChests.length >= CFG.CHESTS_TOTAL && !playerData.achievements.includes("ปรมาจารย์ดีเอ็นเอ")) {
            playerData.achievements.push("ปรมาจารย์ดีเอ็นเอ");
            showMessage("🏆 ปลดล็อคความสำเร็จ: ปรมาจารย์ดีเอ็นเอ!", "success");
        }
        if (playerData.level >= 5 && !playerData.achievements.includes("ผู้มีวิวัฒนาการ")) {
            playerData.achievements.push("ผู้มีวิวัฒนาการ");
            showMessage("🏆 ปลดล็อคความสำเร็จ: ผู้มีวิวัฒนาการ", "success");
        }
    }

    // ─── Inventory Modal Toggle ───
    window.toggleInventory = function () {
        var invModal = document.getElementById('inventory-modal');
        if (!invModal) return;

        if (invModal.style.display === 'flex') {
            invModal.style.display = 'none';
            if (window.game) window.game.scene.resume('GameScene');
        } else {
            if (window.game) window.game.scene.pause('GameScene');
            invModal.style.display = 'flex';
            invModal.children[0].classList.add('animate-pop');

            // Set stats values
            document.getElementById('inv-level').innerText = playerData.level;
            document.getElementById('inv-exp').innerText = playerData.exp + ' / ' + (playerData.level * CFG.EXP_BASE);
            document.getElementById('inv-hp').innerText = playerData.hp + ' / ' + playerData.maxHp;
            document.getElementById('inv-chests').innerText = playerData.completedChests.length + ' / ' + CFG.CHESTS_TOTAL;
            document.getElementById('inv-item-count').innerText = playerData.inventory.length;

            // Populate Inventory DNA items
            var grid = document.getElementById('inv-items-grid');
            grid.innerHTML = '';
            playerData.inventory.forEach(function (item, i) {
                grid.innerHTML += '<div class="bg-indigo-900/60 border border-indigo-500 rounded-xl p-2.5 text-center flex flex-col justify-center items-center shadow-inner h-20 text-xs text-indigo-100">' +
                    '<span class="text-xl mb-1">🧬</span>' +
                    '<span class="font-bold">' + item.symbol + '</span>' +
                    '<span class="text-[9px] opacity-75">' + item.name + '</span>' +
                '</div>';
            });
            if (playerData.inventory.length === 0) {
                grid.innerHTML = '<div class="col-span-full text-center text-gray-500 py-4 text-sm">ยังไม่มีชิ้นส่วน DNA ในกระเป๋า</div>';
            }

            // Populate Achievements
            var achBox = document.getElementById('inv-achievements');
            achBox.innerHTML = '';
            playerData.achievements.forEach(function (ach) {
                achBox.innerHTML += '<div class="bg-gray-800/80 border-l-4 border-yellow-400 p-2.5 rounded shadow text-yellow-100 font-semibold text-xs">' +
                    '🏆 ' + ach +
                '</div>';
            });
            if (playerData.achievements.length === 0) {
                achBox.innerHTML = '<div class="text-gray-500 py-2 text-xs">ยังไม่ได้รับรางวัลความสำเร็จ</div>';
            }
        }
    };

    /** ==========================================
     * QUIZ MODAL SYSTEM
     * ========================================== */
    function openQuiz(chest) {
        if (!window.game) return;
        window.game.scene.pause('GameScene');

        activeChest = chest;
        var modal = document.getElementById('quiz-modal');
        var questionText = document.getElementById('quiz-question');
        var optionsBox = document.getElementById('quiz-options');
        var timerDisplay = document.getElementById('quiz-timer');

        // Pick random question from data.js
        var qObj = DATA.qDB[Math.floor(Math.random() * DATA.qDB.length)];

        questionText.innerText = qObj.q;
        optionsBox.innerHTML = '';
        
        qObj.a.forEach(function (opt, i) {
            var btn = document.createElement('button');
            btn.className = 'w-full text-left bg-gray-100 hover:bg-blue-50 border border-gray-300 hover:border-blue-300 rounded-xl p-3 text-sm md:text-base font-semibold text-gray-700 hover:text-blue-600 transition-all active:scale-[0.99]';
            btn.innerText = (i + 1) + '. ' + opt;
            btn.onclick = function () { handleQuizAnswer(i, qObj.c); };
            optionsBox.appendChild(btn);
        });

        quizTimeLeft = 15;
        timerDisplay.innerText = quizTimeLeft;
        modal.style.display = 'flex';
        modal.children[0].classList.add('animate-pop');

        // Start countdown timer
        if (quizTimerInterval) clearInterval(quizTimerInterval);
        quizTimerInterval = setInterval(function () {
            quizTimeLeft--;
            timerDisplay.innerText = quizTimeLeft;
            if (quizTimeLeft <= 0) {
                handleQuizAnswer(-1, qObj.c); // Time out counts as wrong
            }
        }, 1000);
    }

    function handleQuizAnswer(choiceIdx, correctIdx) {
        if (quizTimerInterval) {
            clearInterval(quizTimerInterval);
            quizTimerInterval = null;
        }

        var modal = document.getElementById('quiz-modal');
        modal.style.display = 'none';

        var mainScene = window.game.scene.getScene('GameScene');

        if (choiceIdx === correctIdx) {
            // Correct Answer
            KAMPAI.sound.correct();
            showMessage("✅ ถูกต้อง! ได้รับ EXP +35 และชิ้นส่วน DNA", "success");
            
            // Collect chest
            if (activeChest && activeChest.chestId) {
                playerData.completedChests.push(activeChest.chestId);
                // change chest visual in game to opened
                if (mainScene) {
                    mainScene.openChestSprite(activeChest);
                }
            }

            // Gain EXP
            playerData.exp += 35;
            checkLevelUp();

            // Gain random DNA item
            var randomItem = DATA.dnaItems[Math.floor(Math.random() * DATA.dnaItems.length)];
            playerData.inventory.push(randomItem);

            // Heal player slightly
            playerData.hp = Math.min(playerData.maxHp, playerData.hp + 20);

            // Update achievements
            checkAchievements();
            saveGameData(false);
            updateHUD();

            // Check absolute victory condition
            if (playerData.completedChests.length >= CFG.CHESTS_TOTAL) {
                endGame(true);
                return;
            }
        } else {
            // Wrong / Time out
            KAMPAI.sound.wrong();
            playerData.hp = Math.max(0, playerData.hp - CFG.MONSTER_ATTACK_DAMAGE);
            showMessage("❌ ผิดพลาด! ได้รับความเสียหาย -15 HP", "error");
            updateHUD();

            if (playerData.hp <= 0) {
                endGame(false);
                return;
            }
        }

        activeChest = null;
        if (window.game) window.game.scene.resume('GameScene');
    }

    /** ==========================================
     * END GAME (VICTORY / DEATH)
     * ========================================== */
    function endGame(isVictory) {
        if (window.game) {
            window.game.scene.pause('GameScene');
        }

        KAMPAI.sound.bgmStop();
        KAMPAI.sound.gameOver();

        // Calculate score
        // Score = level * 100 + chestsOpened * 20
        score = (playerData.level * 100) + (playerData.completedChests.length * 20);

        // Submit Score via SDK
        KAMPAI.submitScore(score, {
            mode: 'normal',
            level: playerData.level,
            chestsOpened: playerData.completedChests.length
        });

        // Set Screen Text
        var vicScreen = document.getElementById('victory-screen');
        var vicTitle = vicScreen.querySelector('h2');
        var vicDesc = vicScreen.querySelector('p');
        var vicTime = document.getElementById('victory-time');

        if (isVictory) {
            vicTitle.innerText = "🏆 ALL CLEAR!";
            vicTitle.className = "text-5xl font-bold text-green-500 mb-2 drop-shadow-lg text-center";
            vicDesc.innerText = "คุณเปิดหีบพันธุศาสตร์ได้สำเร็จครบถ้วน สุดยอดอัจฉริยะ!";
        } else {
            vicTitle.innerText = "💀 GAME OVER!";
            vicTitle.className = "text-5xl font-bold text-red-500 mb-2 drop-shadow-lg text-center";
            vicDesc.innerText = "พลังชีวิตหมดลงแล้วจากการล่าสมบัติพันธุศาสตร์";
        }

        vicTime.innerText = "ระดับเลเวล: " + playerData.level + " | หีบสมบัติที่เปิดได้: " + playerData.completedChests.length + " (" + score + " คะแนน)";

        vicScreen.classList.remove('hidden');
        void vicScreen.offsetWidth;
        vicScreen.classList.remove('opacity-0');
        spawnConfetti();

        renderLeaderboard('score-list-gameover');

        // Clear local progress on game over so they can restart fresh next time
        try {
            localStorage.removeItem('genetic-quest-progress');
        } catch(e) {}
    }

    /** ==========================================
     * PHASER 3 GAME SCENE DEFINITIONS
     * ========================================== */
    var virtualInput = { up: false, down: false, left: false, right: false };
    
    function bindDpad(btnId, dir) {
        var btn = document.getElementById(btnId);
        if (!btn) return;
        btn.addEventListener('touchstart', function (e) {
            e.preventDefault();
            virtualInput[dir] = true;
            btn.style.backgroundColor = '#cbd5e1';
        });
        btn.addEventListener('touchend', function (e) {
            e.preventDefault();
            virtualInput[dir] = false;
            btn.style.backgroundColor = '#ffffff';
        });
    }

    // Set mobile check
    var isMobile = /Mobi|Android/i.test(navigator.userAgent);
    if (isMobile) {
        document.getElementById('mobile-dpad').classList.remove('hidden');
        bindDpad('btn-up', 'up');
        bindDpad('btn-down', 'down');
        bindDpad('btn-left', 'left');
        bindDpad('btn-right', 'right');
    }

    class BootScene extends Phaser.Scene {
        constructor() { super('BootScene'); }
        create() {
            // Generate procedural pixel assets dynamically
            this.generateTextures();
            this.scene.start('GameScene');
        }

        generateTextures() {
            // Player Texture (Chibi circle/shield)
            var gPlayer = this.make.graphics({ x: 0, y: 0, add: false });
            gPlayer.fillStyle(0x3b82f6, 1);
            gPlayer.fillCircle(16, 16, 14);
            gPlayer.lineStyle(2, 0xffffff, 1);
            gPlayer.strokeCircle(16, 16, 14);
            gPlayer.generateTexture('player', 32, 32);

            // Closed Chest Texture
            var gChest = this.make.graphics({ x: 0, y: 0, add: false });
            gChest.fillStyle(0xb45309, 1);
            gChest.fillRect(2, 6, 28, 20);
            gChest.fillStyle(0xf59e0b, 1); // Gold trim
            gChest.fillRect(12, 12, 8, 8);
            gChest.generateTexture('chest', 32, 32);

            // Opened Chest Texture
            var gChestOpen = this.make.graphics({ x: 0, y: 0, add: false });
            gChestOpen.fillStyle(0x78350f, 1);
            gChestOpen.fillRect(2, 10, 28, 16);
            gChestOpen.fillStyle(0x10b981, 1); // Glowing unlocked core
            gChestOpen.fillRect(12, 14, 8, 4);
            gChestOpen.generateTexture('chest_open', 32, 32);

            // Monster Texture
            var gMonster = this.make.graphics({ x: 0, y: 0, add: false });
            gMonster.fillStyle(0xef4444, 1);
            gMonster.fillCircle(16, 16, 12);
            gMonster.fillStyle(0xffffff, 1);
            gMonster.fillCircle(10, 12, 3);
            gMonster.fillCircle(22, 12, 3);
            gMonster.fillStyle(0x000000, 1);
            gMonster.fillCircle(10, 12, 1);
            gMonster.fillCircle(22, 12, 1);
            gMonster.generateTexture('monster', 32, 32);
        }
    }

    class GameScene extends Phaser.Scene {
        constructor() { super('GameScene'); }

        create() {
            var worldSize = 4000;
            this.physics.world.setBounds(0, 0, worldSize, worldSize);

            // Biome drawing
            this.generateBiomes(worldSize);

            // Add player
            this.player = this.physics.add.sprite(playerData.playerPos.x, playerData.playerPos.y, 'player');
            this.player.setCollideWorldBounds(true);
            this.player.setDepth(10);
            this.player.setCircle(14, 2, 2);

            // Camera bounds & follow
            this.cameras.main.setBounds(0, 0, worldSize, worldSize);
            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

            // Mini Map Setup
            if (window.innerWidth > 600) {
                this.minimap = this.cameras.add(window.innerWidth - 170, 80, 150, 150)
                    .setZoom(0.035)
                    .setName('minimap')
                    .setBackgroundColor(0x0a0f1d)
                    .setScroll(this.player.x, this.player.y);
            }

            // Keyboard input
            this.cursors = this.input.keyboard.createCursorKeys();

            // Setup physics groups
            this.chests = this.physics.add.staticGroup();
            this.monsters = this.physics.add.group();

            // Populate entities
            this.spawnChests(worldSize);
            this.spawnMonsters(worldSize, 40);

            // Define overlap & collisions
            this.physics.add.overlap(this.player, this.chests, this.hitChest, null, this);
            this.physics.add.collider(this.player, this.monsters, this.hitMonster, null, this);
            this.physics.add.collider(this.monsters, this.monsters);

            updateHUD();
        }

        update() {
            // Player movement
            var speed = 250;
            this.player.setVelocity(0);

            var dx = 0;
            var dy = 0;

            if (this.cursors.left.isDown || virtualInput.left) {
                dx = -1;
            } else if (this.cursors.right.isDown || virtualInput.right) {
                dx = 1;
            }

            if (this.cursors.up.isDown || virtualInput.up) {
                dy = -1;
            } else if (this.cursors.down.isDown || virtualInput.down) {
                dy = 1;
            }

            // Normalize vector
            if (dx !== 0 && dy !== 0) {
                dx *= 0.7071;
                dy *= 0.7071;
            }

            this.player.setVelocity(dx * speed, dy * speed);

            // Keep minimap aligned
            if (this.minimap) {
                this.minimap.scrollX = this.player.x;
                this.minimap.scrollY = this.player.y;
            }

            // Monsters chase player slowly
            this.monsters.getChildren().forEach(function (monster) {
                var distance = Phaser.Math.Distance.Between(monster.x, monster.y, this.player.x, this.player.y);
                if (distance < 450) {
                    this.physics.moveToObject(monster, this.player, 90);
                } else {
                    monster.setVelocity(0);
                }
            }, this);
        }

        generateBiomes(size) {
            var graphics = this.add.graphics();
            var cols = 3, rows = 3;
            var cellW = size / cols, cellH = size / rows;
            var colors = [
                0x155e75, // Deep Blue ( meadow base )
                0xd97706, // Desert Orange
                0x0369a1, // Sky Ice
                0x991b1b, // Volcanic Dark Red
                0x6b21a8, // Magic Purple
                0x065f46, // Swamp Green
                0x1e293b  // Core Rock
            ];
            var colorIdx = 0;

            for (var y = 0; y < rows; y++) {
                for (var x = 0; x < cols; x++) {
                    if ((x === 0 && y === 0) || (x === 2 && y === 2)) {
                        // Safe zones
                        graphics.fillStyle(0x0f172a, 1);
                    } else {
                        graphics.fillStyle(colors[colorIdx % colors.length], 1);
                        colorIdx++;
                    }
                    graphics.fillRect(x * cellW, y * cellH, cellW, cellH);
                    
                    // Add decorative circular patterns
                    if ((x !== 0 || y !== 0) && (x !== 2 || y !== 2)) {
                        graphics.fillStyle(0xffffff, 0.05);
                        for (var i = 0; i < 15; i++) {
                            graphics.fillCircle(
                                x * cellW + Phaser.Math.Between(50, cellW - 50),
                                y * cellH + Phaser.Math.Between(50, cellH - 50),
                                Phaser.Math.Between(20, 60)
                            );
                        }
                    }
                }
            }
            graphics.setDepth(0);
        }

        spawnChests(size) {
            // Generate 50 chests across map coordinates, skipping player start area (2000, 2000)
            for (var i = 1; i <= CFG.CHESTS_TOTAL; i++) {
                var cx, cy;
                do {
                    cx = Phaser.Math.Between(150, size - 150);
                    cy = Phaser.Math.Between(150, size - 150);
                } while (Math.hypot(cx - 2000, cy - 2000) < 400);

                var isOpened = playerData.completedChests.includes(i);
                var key = isOpened ? 'chest_open' : 'chest';
                
                var chest = this.chests.create(cx, cy, key);
                chest.chestId = i;
                chest.setCircle(14, 2, 2);
            }
        }

        spawnMonsters(size, count) {
            for (var i = 0; i < count; i++) {
                var mx, my;
                do {
                    mx = Phaser.Math.Between(150, size - 150);
                    my = Phaser.Math.Between(150, size - 150);
                } while (Math.hypot(mx - 2000, my - 2000) < 600); // spawn far from player start

                var monster = this.monsters.create(mx, my, 'monster');
                monster.setCollideWorldBounds(true);
                monster.setCircle(12, 4, 4);
                monster.body.setBounce(1, 1);
            }
        }

        hitChest(player, chest) {
            // Only trigger if not already opened
            var isOpened = playerData.completedChests.includes(chest.chestId);
            if (!isOpened) {
                // Move player away slightly so overlap doesn't loop trigger
                player.x += (player.x - chest.x) > 0 ? 10 : -10;
                player.y += (player.y - chest.y) > 0 ? 10 : -10;
                player.setVelocity(0);

                openQuiz(chest);
            }
        }

        openChestSprite(chest) {
            // Change sprite to open
            chest.setTexture('chest_open');
        }

        hitMonster(player, monster) {
            // Knocks player back
            player.x += (player.x - monster.x) > 0 ? 30 : -30;
            player.y += (player.y - monster.y) > 0 ? 30 : -30;
            player.setVelocity(0);

            // Deduct HP
            playerData.hp = Math.max(0, playerData.hp - 10);
            KAMPAI.sound.wrong();
            showMessage("💥 ได้รับการโจมตีจากยีนกลายพันธุ์ -10 HP", "error");
            updateHUD();

            if (playerData.hp <= 0) {
                endGame(false);
            }
        }
    }

    /** ==========================================
     * INITIALIZATION & ACTION
     * ========================================== */
    loadLocalProgress();

    // Start Phaser game instance
    var phaserConfig = {
        type: Phaser.AUTO,
        width: window.innerWidth,
        height: window.innerHeight,
        parent: 'game-container',
        physics: {
            default: 'arcade',
            arcade: {
                gravity: { y: 0 },
                debug: false
            }
        },
        scene: [BootScene, GameScene]
    };

    window.game = new Phaser.Game(phaserConfig);
    
    // Hide blocker and start game BGM
    var startBtn = document.getElementById('btn-start');
    if (startBtn) {
        startBtn.addEventListener('click', function () {
            KAMPAI.sound.unlock();
            isGameStarted = true;
            startTime = Date.now();
            document.getElementById('blocker').style.display = 'none';

            KAMPAI.sound.bgmStart();
            updateHUD();
        });
    }

})();
