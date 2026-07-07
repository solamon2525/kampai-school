(function () {
    const CFG = window.GAME_CONFIG;
    const DATA = window.GAME_DATA;
    let qrand = Math.random;

    if (window.KAMPAI) {
        window.KAMPAI.setSlug(CFG.SLUG);
    }

    const GAME_SLUG = CFG.SLUG;
    const STAGES = DATA.STAGES;
    const modeNames = DATA.modeNames;

    /**
     * AUDIO SYSTEM
     */
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const SoundFX = {
        playShoot: (freq) => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime); 
            osc.frequency.exponentialRampToValueAtTime(freq/2, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        },
        playCorrect: (combo) => {
            if (window.KAMPAI && window.KAMPAI.sound) {
                window.KAMPAI.sound.correct();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'triangle';
            const baseFreq = 440; 
            const calcFreq = baseFreq + (combo * 50);
            osc.frequency.setValueAtTime(calcFreq, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(calcFreq + 200, audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        },
        playWrong: () => {
            if (window.KAMPAI && window.KAMPAI.sound) {
                window.KAMPAI.sound.wrong();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(100, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.3);
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        },
        playExplosion: () => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(100, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.2);
        },
        playPowerup: () => {
            if (audioCtx.state === 'suspended') audioCtx.resume();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.linearRampToValueAtTime(800, audioCtx.currentTime + 0.1);
            osc.frequency.linearRampToValueAtTime(1200, audioCtx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        },
        playBossShoot: () => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.1);
        }
    };

    const BGM = {
        isPlaying: false,
        interval: null,
        step: 0,
        notes: [130.81, 130.81, 155.56, 155.56, 174.61, 174.61, 196.00, 196.00], 
        play: function(isBoss = false) {
            if (window.KAMPAI && window.KAMPAI.sound) {
                window.KAMPAI.sound.bgmStart();
            }
            if (this.isPlaying) this.stop();
            this.isPlaying = true;
            this.step = 0;
            let speed = isBoss ? 120 : 200; 
            this.interval = setInterval(() => {
                const freq = this.notes[this.step % this.notes.length] * (isBoss ? 1.5 : 1);
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = isBoss ? 'square' : 'sawtooth'; 
                osc.frequency.value = freq;
                gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + (isBoss ? 0.1 : 0.15));
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.start();
                osc.stop(audioCtx.currentTime + (isBoss ? 0.1 : 0.15));
                this.step++;
            }, speed);
        },
        stop: function() {
            if (window.KAMPAI && window.KAMPAI.sound) {
                window.KAMPAI.sound.bgmStop();
            }
            this.isPlaying = false;
            clearInterval(this.interval);
        }
    };

    /**
     * TEXT-TO-SPEECH (TTS) SYSTEM
     */
    function speakQuestion(text) {
        if (!CFG.TTS_ENABLED || !window.KAMPAI || !window.KAMPAI.sound) return;
        
        let speakText = text
            .replace(/\+/g, ' บวก ')
            .replace(/-/g, ' ลบ ')
            .replace(/x/g, ' คูณ ')
            .replace(/÷/g, ' หาร ');
            
        // สำหรับเศษส่วน
        if (speakText.includes('/')) {
            let parts = speakText.split('/');
            speakText = `เศษ ${parts[0]} ส่วน ${parts[1]}`;
        }
        
        window.KAMPAI.sound.speak(speakText, 'th-TH');
    }

    /**
     * MATH ENGINE
     */
    let selectedCategory = CFG.DEFAULT_CATEGORY;
    let currentDifficulty = CFG.DEFAULT_DIFFICULTY;

    const vs = window.KampaiVersus ? KampaiVersus.create({
        duration: CFG.TIME_LIMIT,
        title: 'Super Math-Blaster: Galactic Duel',
        rankBy: 'score',
        onPlay: ({ rng, player }) => {
            playerCount = 1;
            qrand = rng || Math.random;
            
            // Randomize stage ID using qrand
            let stageId = Math.floor(qrand() * 3) + 1; // 1, 2, 3
            
            // Set name based on player P1 or P2
            let pName = 'PLAYER 1';
            if (window.KAMPAI && window.KAMPAI.student && window.KAMPAI.student.displayName) {
                pName = window.KAMPAI.student.displayName.toUpperCase();
            }
            if (player === 'P2') {
                pName = 'PLAYER 2';
            }
            const p1NameInput = document.getElementById('p1-name');
            if (p1NameInput) p1NameInput.value = pName;
            
            startGame(stageId);
        },
        onEnd: () => {
            isLooping = false;
            gameState = 'ENDED';
            BGM.stop();
            document.getElementById('report-screen').style.display = 'flex';
        }
    }) : null;
    window.vs = vs;

    window.setDifficulty = function(level) {
        currentDifficulty = level;
        for (let i = 1; i <= 5; i++) {
            document.getElementById('btn-d' + i).classList.remove('active');
        }
        document.getElementById('btn-d' + level).classList.add('active');
    };

    window.setMode = function(mode) {
        selectedCategory = mode;
        let btnIds = ['addition', 'subtraction', 'multiplication', 'division', 'mixed'];
        btnIds.forEach(id => {
            document.getElementById('btn-m-' + id).classList.remove('active');
        });
        document.getElementById('btn-m-' + mode).classList.add('active');
    };

    const MathEngine = {
        generateQuestion: () => {
            let type = selectedCategory;
            if (type === 'mixed') {
                const types = ['addition', 'subtraction', 'multiplication', 'division', 'fraction', 'decimal'];
                type = types[Math.floor(qrand() * types.length)];
            }
            
            let q = "", a = "", distractors = new Set();
            const r = (min, max) => Math.floor(qrand() * (max - min + 1)) + min;
            let d = currentDifficulty;

            if (type === 'addition') {
                let n1, n2;
                if (d===1) { n1 = r(1,9); n2 = r(1,9); }
                else if (d===2) { n1 = r(10,50); n2 = r(1,9); }
                else if (d===3) { n1 = r(10,50); n2 = r(10,50); }
                else if (d===4) { n1 = r(10,99); n2 = r(10,99); }
                else { n1 = r(100,500); n2 = r(10,99); }
                q = `${n1} + ${n2}`;
                a = (n1 + n2).toString();
                distractors.add((n1 + n2 + 10).toString());
                distractors.add((n1 + n2 - 10).toString());
                distractors.add((n1 + n2 + 1).toString());
            }
            else if (type === 'subtraction') {
                let n1, n2;
                if (d===1) { n1 = r(2,10); n2 = r(1, n1-1); }
                else if (d===2) { n1 = r(10,30); n2 = r(1, 9); }
                else if (d===3) { n1 = r(20,99); n2 = r(10, 19); }
                else if (d===4) { n1 = r(20,99); n2 = r(10, n1-1); }
                else { n1 = r(100,500); n2 = r(10, 99); }
                q = `${n1} - ${n2}`;
                a = (n1 - n2).toString();
                distractors.add((n1 - n2 + 10).toString());
                distractors.add((n1 - n2 - 10).toString());
                distractors.add((n1 - n2 + 1).toString());
            }
            else if (type === 'fraction') {
                let dLists = [ [2,3,4], [4,5], [6,8], [8,10], [10,12,15] ];
                let denom = dLists[d-1][Math.floor(qrand() * dLists[d-1].length)];
                let n1, n2;
                if (d===1) { n1 = 1; n2 = 1; }
                else if (d===2) { n1 = r(1,2); n2 = r(1,2); }
                else if (d===3) { n1 = r(1,4); n2 = r(1,4); }
                else if (d===4) { n1 = r(1, denom-1); n2 = r(1, denom-1); }
                else { n1 = r(1, denom+5); n2 = r(1, denom+5); }
                
                q = `${n1}/${denom} + ${n2}/${denom}`;
                a = `${n1+n2}/${denom}`;
                distractors.add(`${n1+n2}/${denom+denom}`);
                distractors.add(`${Math.abs(n1-n2)}/${denom}`);
                distractors.add(`${n1+n2}/${denom+1}`);
            } 
            else if (type === 'decimal') {
                let n1, n2;
                if (d===1) { n1 = (r(1,5)/10).toFixed(1); n2 = (r(1,5)/10).toFixed(1); }
                else if (d===2) { n1 = (r(1,9)/10).toFixed(1); n2 = (r(1,9)/10).toFixed(1); }
                else if (d===3) { n1 = (r(10,50)/10).toFixed(1); n2 = (r(1,9)/10).toFixed(1); }
                else if (d===4) { n1 = (r(11,99)/10).toFixed(1); n2 = (r(11,99)/10).toFixed(1); }
                else { n1 = (r(101,509)/10).toFixed(1); n2 = (r(11,99)/10).toFixed(1); }
                q = `${n1} + ${n2}`;
                a = (parseFloat(n1) + parseFloat(n2)).toFixed(1);
                distractors.add((parseFloat(n1) + parseFloat(n2)).toFixed(2));
                distractors.add((parseFloat(a) + 1).toFixed(1));
                distractors.add((parseFloat(n1) * parseFloat(n2)).toFixed(1));
            } 
            else if (type === 'multiplication') {
                let n1, n2;
                if (d===1) { n1 = r(1,5); n2 = r(1,5); }
                else if (d===2) { n1 = r(2,9); n2 = r(2,5); }
                else if (d===3) { n1 = r(2,9); n2 = r(2,9); }
                else if (d===4) { n1 = r(2,12); n2 = r(2,12); }
                else { n1 = r(10,20); n2 = r(2,9); }
                q = `${n1} x ${n2}`;
                a = (n1 * n2).toString();
                distractors.add((n1 * n2 + 10).toString());
                distractors.add((n1 * n2 - 2).toString());
                distractors.add((n1 + n2).toString());
            } 
            else if (type === 'division') {
                let ans, n2;
                if (d===1) { ans = r(1,5); n2 = r(2,5); }
                else if (d===2) { ans = r(2,9); n2 = r(2,5); }
                else if (d===3) { ans = r(2,9); n2 = r(2,9); }
                else if (d===4) { ans = r(2,12); n2 = r(2,9); }
                else { ans = r(10,20); n2 = r(2,9); }
                let n1 = n2 * ans;
                q = `${n1} ÷ ${n2}`;
                a = ans.toString();
                distractors.add((ans + 1).toString());
                distractors.add((ans - 1).toString());
                distractors.add((n1 * n2).toString());
            }

            let safeCounter = 0;
            while (distractors.size < 3 && safeCounter < 20) {
                let numAns = parseFloat(a);
                if (!isNaN(numAns)) {
                    let offset = Math.floor(qrand() * 5) + 1;
                    if (a.includes('.')) {
                        distractors.add((numAns + offset/10).toFixed(1));
                    } else {
                        distractors.add((numAns + offset).toString());
                    }
                } else { distractors.add("?"); }
                safeCounter++;
            }

            let options = Array.from(distractors).slice(0, 3);
            options.push(a);
            for (let i = options.length - 1; i > 0; i--) {
                const j = Math.floor(qrand() * (i + 1));
                [options[i], options[j]] = [options[j], options[i]];
            }
            return { question: q, answer: a, options: options };
        }
    };

    /**
     * GAME ENGINE & ENTITIES
     */
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    let isLooping = false;
    let gameState = 'START'; 
    let timer = CFG.TIME_LIMIT; 
    let lastTime = 0;
    let isBossEnding = false;
    let globalTimeFreeze = 0; 

    let playerCount = 1;
    let unplayedStages = [];
    let currentStageIndex = 0;
    let currentStageTheme = null;

    let player1 = null;
    let player2 = null;
    let bullets = [];
    let bossBullets = [];
    let particles = [];
    let floatingTexts = [];
    let items = [];
    let asteroids = [];
    let boss = null;
    let screenShake = 0;
    let stars = [];
    let currentMathData = null;

    const keys = {};
    window.addEventListener('keydown', e => keys[e.code] = true);
    window.addEventListener('keyup', e => keys[e.code] = false);

    /**
     * DYNAMIC STARFIELD BACKGROUND FOR UI SCREENS
     */
    const uiCanvas = document.getElementById('starsCanvas');
    const uiCtx = uiCanvas ? uiCanvas.getContext('2d') : null;
    let uiStars = [];
    let uiLoopActive = false;

    function resizeUiCanvas() {
        if (!uiCanvas || !uiCanvas.parentElement) return;
        uiCanvas.width = uiCanvas.parentElement.clientWidth;
        uiCanvas.height = uiCanvas.parentElement.clientHeight;
    }
    window.addEventListener('resize', () => {
        if (gameState !== 'PLAYING') resizeUiCanvas();
    });

    function initUiStars() {
        if (!uiCanvas) return;
        resizeUiCanvas();
        uiStars = Array.from({length: 80}, () => ({
            x: Math.random() * uiCanvas.width,
            y: Math.random() * uiCanvas.height,
            speed: Math.random() * 1.5 + 0.5,
            color: ['#00FFFF', '#FF3366', '#FFFFFF', '#FFD700'][Math.floor(Math.random() * 4)]
        }));
    }

    function runUiStarsLoop() {
        if (!uiLoopActive || !uiCtx || !uiCanvas) return;
        uiCtx.clearRect(0, 0, uiCanvas.width, uiCanvas.height);
        uiCtx.fillStyle = '#03030c';
        uiCtx.fillRect(0, 0, uiCanvas.width, uiCanvas.height);

        uiStars.forEach(s => {
            s.y += s.speed;
            if (s.y > uiCanvas.height) {
                s.y = 0;
                s.x = Math.random() * uiCanvas.width;
            }
            uiCtx.fillStyle = s.color;
            uiCtx.globalAlpha = 0.5;
            uiCtx.fillRect(s.x, s.y, 2, 2);
            uiCtx.globalAlpha = 1.0;
        });
        requestAnimationFrame(runUiStarsLoop);
    }


    class Player {
        constructor(id, name, color, controls, x, y) {
            this.id = id;
            this.name = name;
            this.x = x;
            this.y = y;
            this.width = 30;
            this.height = 40;
            this.color = color;
            this.baseSpeed = 5.5;
            this.speed = 5.5;
            this.controls = controls;
            this.score = 0;
            this.combo = 0;
            this.maxCombo = 0;
            this.shotsFired = 0;
            this.hits = 0;
            this.cooldown = 0;
            
            this.lives = CFG.LIVES;
            this.isDead = false;
            this.invulnerableTimer = 0; 
            this.stunTimer = 0; 
            
            // Power-ups
            this.speedBoostTimer = 0;
            this.rapidFireTimer = 0;
            this.hasShield = false;
            this.spreadTimer = 0;
            this.homingTimer = 0;
            this.doubleTimer = 0;
            
            // Sabotage
            this.confusedTimer = 0;
            this.blindTimer = 0;
            this.freezeTimer = 0;
            
            this.soundFreq = id === 1 ? 880 : 660; 
        }

        update() {
            if (this.isDead) return;

            if (this.invulnerableTimer > 0) this.invulnerableTimer--;

            if (this.stunTimer > 0) {
                this.stunTimer--;
                return;
            }

            // ลดเวลาบัฟ/ดีบัฟต่างๆ
            if (this.confusedTimer > 0) this.confusedTimer--;
            if (this.blindTimer > 0) this.blindTimer--;
            if (this.freezeTimer > 0) this.freezeTimer--;
            if (this.spreadTimer > 0) this.spreadTimer--;
            if (this.homingTimer > 0) this.homingTimer--;
            if (this.doubleTimer > 0) this.doubleTimer--;

            if (this.speedBoostTimer > 0) {
                this.speed = 9; 
                this.speedBoostTimer--;
            } else if (this.freezeTimer > 0) {
                this.speed = 2; 
            } else {
                this.speed = this.baseSpeed;
            }

            if (this.rapidFireTimer > 0) {
                this.rapidFireTimer--;
            }

            // ปุ่มกดยิง/เดิน จาก Keyboard และ SDK Input
            const checkKey = (keyArr) => {
                let pressed = keyArr.some(k => keys[k]);
                // เช็ค SDK controls (เฉพาะเมื่อเล่นคนเดียว เพื่อป้องกันปุ่มชนกันในโหมด 2 คน)
                if (playerCount === 1 && window.KAMPAI && window.KAMPAI.input) {
                    keyArr.forEach(k => {
                        if (k === 'ArrowUp' || k === 'KeyW') pressed = pressed || window.KAMPAI.input.up;
                        if (k === 'ArrowDown' || k === 'KeyS') pressed = pressed || window.KAMPAI.input.down;
                        if (k === 'ArrowLeft' || k === 'KeyA') pressed = pressed || window.KAMPAI.input.left;
                        if (k === 'ArrowRight' || k === 'KeyD') pressed = pressed || window.KAMPAI.input.right;
                        if (k === 'Space' || k === 'Enter') pressed = pressed || window.KAMPAI.input.a || window.KAMPAI.input.b;
                    });
                }
                return pressed;
            };

            let isUp = checkKey(this.controls.up);
            let isDown = checkKey(this.controls.down);
            let isLeft = checkKey(this.controls.left);
            let isRight = checkKey(this.controls.right);

            if (this.confusedTimer > 0) {
                let tempUp = isUp; isUp = isDown; isDown = tempUp;
                let tempLeft = isLeft; isLeft = isRight; isRight = tempLeft;
            }

            if (isUp && this.y > 100) this.y -= this.speed;
            if (isDown && this.y < canvas.height - this.height) this.y += this.speed;
            if (isLeft && this.x > 0) this.x -= this.speed;
            if (isRight && this.x < canvas.width - this.width) this.x += this.speed;

            // ฝุ่นไอพ่นปล่อยจากยาน (particles trail)
            if (Math.random() < 0.4) {
                particles.push(new Particle(this.x + this.width/2 + (Math.random()*6 - 3), this.y + this.height, '#FF4500'));
            }

            if (this.cooldown > 0) this.cooldown--;

            let shootCooldown = (this.rapidFireTimer > 0) ? 5 : 15; 

            if (checkKey(this.controls.shoot) && this.cooldown === 0) {
                let isHoming = this.homingTimer > 0;
                if (this.spreadTimer > 0) {
                    bullets.push(new Bullet(this.x + this.width/2 - 2, this.y, this.color, this, 0, -10, isHoming));
                    bullets.push(new Bullet(this.x + this.width/2 - 2, this.y, this.color, this, -3, -9, isHoming));
                    bullets.push(new Bullet(this.x + this.width/2 - 2, this.y, this.color, this, 3, -9, isHoming));
                } else {
                    bullets.push(new Bullet(this.x + this.width/2 - 2, this.y, this.color, this, 0, -10, isHoming));
                }
                this.cooldown = shootCooldown;
                this.shotsFired++;
                SoundFX.playShoot(this.soundFreq);
            }
        }

        draw(ctx) {
            if (this.isDead) return;
            
            if ((this.stunTimer > 0 || this.invulnerableTimer > 0) && Math.floor(Date.now() / 100) % 2 === 0) {
                return; 
            }
            
            if (this.hasShield) {
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/2, 25 + Math.sin(Date.now() / 150) * 3, 0, Math.PI*2);
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)'; 
                ctx.lineWidth = 3;
                ctx.stroke();
            }
            
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.moveTo(this.x + this.width/2, this.y);
            ctx.lineTo(this.x + this.width, this.y + this.height);
            ctx.lineTo(this.x + this.width/2, this.y + this.height - 10);
            ctx.lineTo(this.x, this.y + this.height);
            ctx.closePath();
            ctx.fill();

            // เปลวไฟไอพ่นแบบระยิบระยับ
            ctx.fillStyle = (this.speedBoostTimer > 0) ? '#00FFFF' : '#FF4500'; 
            let fireLength = (this.speedBoostTimer > 0) ? 24 : 14;
            ctx.fillRect(this.x + 8, this.y + this.height, 4, Math.random() * fireLength + 5);
            ctx.fillRect(this.x + 18, this.y + this.height, 4, Math.random() * fireLength + 5);

            if (this.blindTimer > 0) {
                ctx.fillStyle = 'rgba(10, 2, 25, 0.96)';
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y - 20, 85, 0, Math.PI*2);
                ctx.fill();
            }
        }
    }

    class Bullet {
        constructor(x, y, color, owner, vx = 0, vy = -10, isHoming = false) {
            this.x = x; this.y = y;
            this.width = 4; this.height = 15;
            this.color = color; 
            this.vx = vx; this.vy = vy;
            this.speed = Math.sqrt(vx*vx + vy*vy) || 10;
            this.owner = owner; this.active = true;
            this.isHoming = isHoming;
        }
        update() { 
            if (this.isHoming) {
                let target = null;
                if (typeof boss !== 'undefined' && boss && boss.active) {
                    target = {x: boss.x + boss.width/2, y: boss.y + boss.height/2};
                } else if (typeof asteroids !== 'undefined') {
                    let correctAst = asteroids.find(a => a.isCorrect && a.active && a.y > 0);
                    if (correctAst) target = {x: correctAst.x, y: correctAst.y};
                }
                
                if (target) {
                    let dx = target.x - this.x;
                    let dy = target.y - this.y;
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    if (dist > 0) {
                        this.vx += (dx / dist) * 0.8; 
                        this.vy += (dy / dist) * 0.8;
                        let currentSpeed = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
                        this.vx = (this.vx / currentSpeed) * this.speed;
                        this.vy = (this.vy / currentSpeed) * this.speed;
                    }
                }
            }
            this.x += this.vx; 
            this.y += this.vy; 
            if (this.y < -50 || this.y > canvas.height + 50 || this.x < -50 || this.x > canvas.width + 50) this.active = false; 
        }
        draw(ctx) { ctx.fillStyle = this.color; ctx.fillRect(this.x, this.y, this.width, this.height); }
    }

    class BossBullet {
        constructor(x, y, vx, vy) {
            this.x = x; this.y = y; this.vx = vx; this.vy = vy;
            this.radius = 6; this.active = true;
        }
        update(timeScale = 1) { 
            this.x += this.vx * timeScale; this.y += this.vy * timeScale; 
            if (this.y > canvas.height + 20 || this.x < -20 || this.x > canvas.width + 20) this.active = false; 
        }
        draw(ctx) { 
            ctx.fillStyle = '#FF00FF'; 
            ctx.beginPath(); 
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2); 
            ctx.fill(); 
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    class Asteroid {
        constructor(x, y, value, isCorrect) {
            this.x = x; this.y = y;
            this.radius = 35; this.value = value;
            this.isCorrect = isCorrect;
            this.speed = (1.5 + Math.random()) * 0.5; 
            this.active = true;
            this.offsets = Array.from({length: 8}, () => Math.random() * 10 - 5);
            this.angle = 0;
            this.rotSpeed = (Math.random() - 0.5) * 0.02;
        }
        update(timeScale = 1) { 
            this.y += this.speed * timeScale; 
            this.angle += this.rotSpeed * timeScale;
            if (this.y > canvas.height + 50) this.active = false; 
        }
        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.angle);

            ctx.fillStyle = '#3c3c44'; 
            ctx.strokeStyle = '#7c7c88'; 
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            for (let i=0; i<8; i++) {
                let angle = (i / 8) * Math.PI * 2;
                let r = this.radius + this.offsets[i];
                let px = Math.cos(angle) * r;
                let py = Math.sin(angle) * r;
                if (i===0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath(); ctx.fill(); ctx.stroke();
            
            ctx.restore();

            // วาดตัวเลขคำตอบทับด่านตรง
            ctx.fillStyle = 'rgba(4, 4, 15, 0.75)'; 
            ctx.fillRect(this.x - 28, this.y - 12, 56, 24);
            ctx.fillStyle = '#00FFFF'; 
            ctx.font = '11px "Press Start 2P"';
            ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
            ctx.fillText(this.value, this.x, this.y);
        }
    }

    class Item {
        constructor(x, y, type) {
            this.x = x; this.y = y;
            this.type = type; 
            this.radius = 16;
            this.active = true;
            this.speed = 1.8;
            this.offsetY = 0;
            this.time = Math.random() * 100;
        }
        update() {
            this.y += this.speed;
            this.time += 0.1;
            this.offsetY = Math.sin(this.time) * 5;
            if (this.y > canvas.height + 50) this.active = false;
        }
        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y + this.offsetY);
            
            // ขอบไฟกะพริบ
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 3, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.globalAlpha = 0.3 + Math.sin(Date.now() / 80) * 0.2;
            ctx.fill();

            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            
            let color, icon;
            switch(this.type) {
                case 'SPEED': color = '#00BFFF'; icon = '⚡'; break;
                case 'RAPID': color = '#FF4500'; icon = '🔫'; break;
                case 'HEAL': color = '#32CD32'; icon = '❤️'; break;
                case 'SHIELD': color = '#9370DB'; icon = '🛡️'; break;
                case 'SABOTAGE': color = '#FF00FF'; icon = '💀'; break;
                case 'SPREAD': color = '#FFD700'; icon = '🎇'; break;
                case 'HOMING': color = '#00FA9A'; icon = '🎯'; break;
                case 'BOMB': color = '#A9A9A9'; icon = '💣'; break;
                case 'FREEZE': color = '#E0FFFF'; icon = '⏱️'; break;
                case 'DOUBLE': color = '#FFD700'; icon = '🪙'; break;
            }

            ctx.fillStyle = color;
            ctx.globalAlpha = 0.85;
            ctx.fill();
            ctx.globalAlpha = 1.0;
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#FFF';
            ctx.stroke();

            ctx.fillStyle = '#FFF';
            ctx.font = '16px Arial'; 
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icon, 0, 2);
            ctx.restore();
        }
    }

    class Particle {
        constructor(x, y, color) {
            this.x = x; this.y = y;
            this.vx = (Math.random() - 0.5) * 8; this.vy = (Math.random() - 0.5) * 8;
            this.life = 25 + Math.random() * 10; this.color = color; this.size = Math.random() * 4 + 1.5;
        }
        update() { this.x += this.vx; this.y += this.vy; this.life--; }
        draw(ctx) { 
            ctx.save();
            ctx.fillStyle = this.color; 
            ctx.globalAlpha = this.life / 35;
            ctx.fillRect(this.x, this.y, this.size, this.size); 
            ctx.restore();
        }
    }

    class FloatingText {
        constructor(x, y, text, color) {
            this.x = x; this.y = y; this.text = text;
            this.color = color; this.life = 70; this.vy = -0.8;
        }
        update() { this.y += this.vy; this.life--; }
        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = this.life / 70;
            ctx.fillStyle = this.color; ctx.font = '11px "Press Start 2P"';
            ctx.textAlign = 'center'; ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
        }
    }

    class Boss {
        constructor(stageId) {
            this.width = 170;
            this.height = 100;
            this.x = canvas.width / 2 - this.width / 2;
            this.y = -150; 
            this.targetY = 70;
            this.hp = 100;
            this.maxHp = 100;
            this.speed = 2.2 + (stageId * 0.4); 
            this.direction = 1;
            this.shootTimer = 0;
            this.active = true;
            this.state = 'ENTERING'; 
            this.flashTimer = 0;
            this.hasShield = true;
            this.shieldHp = CFG.BOSS_SHIELD_ANSWERS;
            this.maxShieldHp = CFG.BOSS_SHIELD_ANSWERS;
            this.orbitAngle = 0;
            
            let colors = ['#8B0000', '#0a0a7c', '#4B0082']; 
            this.color = colors[(stageId-1) % 3];
        }
        
        update(timeScale = 1) {
            if (this.state === 'ENTERING') {
                this.y += 2 * timeScale;
                if (this.y >= this.targetY) {
                    this.state = 'FIGHTING';
                    spawnWave(); // ปล่อยอุปสรรคป้องกันของบอส
                }
            } else if (this.state === 'FIGHTING') {
                this.x += this.speed * this.direction * timeScale;
                if (this.x < 30 || this.x > canvas.width - this.width - 30) this.direction *= -1;

                this.orbitAngle += 0.02 * timeScale;

                // บอสปล่อยกระสุนแบบสุ่ม
                this.shootTimer += timeScale;
                if (this.shootTimer > 70) { 
                    this.shootNormal();
                    this.shootTimer = 0;
                }
            }
            if (this.flashTimer > 0) this.flashTimer--;
        }

        shootNormal() {
            SoundFX.playBossShoot();
            let speed = 3.5;
            bossBullets.push(new BossBullet(this.x + 30, this.y + this.height - 10, 0, speed));
            bossBullets.push(new BossBullet(this.x + this.width - 30, this.y + this.height - 10, 0, speed));
        }

        shootSpiralCounterAttack() {
            SoundFX.playBossShoot();
            floatingTexts.push(new FloatingText(this.x + this.width/2, this.y + this.height, "COUNTER ATTACK!", "#FF00FF"));
            for (let i=0; i<12; i++) {
                let angle = (i / 12) * Math.PI * 2; 
                let speed = 4.5;
                bossBullets.push(new BossBullet(this.x + this.width/2, this.y + this.height/2, Math.cos(angle)*speed, Math.sin(angle)*speed));
            }
        }

        draw(ctx) {
            ctx.save();
            if (this.flashTimer > 0 && Math.floor(Date.now() / 50) % 2 === 0) {
                ctx.fillStyle = '#FFFFFF';
            } else {
                ctx.fillStyle = this.color; 
            }

            // วาดตัวบอสสไตล์อวกาศพรีเมียม
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + 15);
            ctx.lineTo(this.x + this.width, this.y + 15);
            ctx.lineTo(this.x + this.width - 25, this.y + this.height);
            ctx.lineTo(this.x + 25, this.y + this.height);
            ctx.closePath();
            ctx.fill();
            
            // วาดจุดแกนกลางเรืองแสง
            ctx.fillStyle = (this.hasShield) ? '#00FFFF' : '#FF0000';
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 22 + Math.sin(Date.now()/90)*4, 0, Math.PI*2);
            ctx.fill();

            // วาดเกราะเรืองแสงรอบบอสหากยังมีโล่ห์
            if (this.hasShield) {
                ctx.beginPath();
                ctx.arc(this.x + this.width/2, this.y + this.height/2, 100 + Math.sin(Date.now()/120)*6, 0, Math.PI*2);
                ctx.strokeStyle = 'rgba(0, 255, 255, 0.45)';
                ctx.lineWidth = 3;
                ctx.stroke();

                // วาดตัวเลขความอึดเกราะ
                ctx.fillStyle = '#00FFFF';
                ctx.font = '10px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.fillText(`SHIELD: ${this.shieldHp}/${this.maxShieldHp}`, this.x + this.width/2, this.y - 25);
            }

            // แถบ HP
            ctx.fillStyle = '#222';
            ctx.fillRect(this.x, this.y - 12, this.width, 7);
            
            // ใช้ไล่สี Gradient ให้บอส HP
            let grad = ctx.createLinearGradient(this.x, 0, this.x + this.width, 0);
            grad.addColorStop(0, '#FF0000');
            grad.addColorStop(0.5, '#FFA500');
            grad.addColorStop(1, '#00FF00');
            ctx.fillStyle = grad;
            ctx.fillRect(this.x, this.y - 12, this.width * (this.hp / this.maxHp), 7);
            
            ctx.restore();
        }
    }

    function setupStage(stageId) {
        currentStageTheme = STAGES[stageId];
        let sc = currentStageTheme.stars;
        stars = Array.from({length: 100}, () => ({
            x: Math.random() * canvas.width, y: Math.random() * canvas.height,
            speed: Math.random() * 3 + 1, color: sc[Math.floor(Math.random() * sc.length)]
        }));

        if (currentStageIndex > 1) {
            currentDifficulty = Math.floor(qrand() * 5) + 1;
            const modes = ['addition', 'subtraction', 'multiplication', 'division', 'fraction', 'decimal', 'mixed'];
            selectedCategory = modes[Math.floor(qrand() * modes.length)];
        }
    }

    function spawnWave() {
        currentMathData = MathEngine.generateQuestion();
        speakQuestion(currentMathData.question); // สังเคราะห์เสียงโจทย์เลขภาษาไทย
        
        asteroids = []; 
        let speedMultiplier = 1 + ((CFG.TIME_LIMIT - timer) / 90); 
        
        if (boss && boss.active && boss.hasShield) {
            // ปล่อยแนวป้อนคำตอบหมุนรอบบอส หรือลอยจากด้านข้าง
            const spacing = canvas.width / 4;
            for (let i=0; i<4; i++) {
                let isCorr = (currentMathData.options[i] === currentMathData.answer);
                let ast = new Asteroid((i * spacing) + (spacing/2), boss.y + boss.height + 40 + qrand()*20, currentMathData.options[i], isCorr);
                ast.speed = 0.3; // อุกกาบาตของบอสลอยช้า ๆ ให้ผู้เล่นเล็ง
                asteroids.push(ast);
            }
        } else {
            // ด่านอุกกาบาตธรรมดาตกจากด้านบน
            const spacing = canvas.width / 4;
            for (let i=0; i<4; i++) {
                let isCorr = (currentMathData.options[i] === currentMathData.answer);
                let ast = new Asteroid((i * spacing) + (spacing/2), -50 - qrand() * 50, currentMathData.options[i], isCorr);
                ast.speed *= speedMultiplier; 
                asteroids.push(ast);
            }
        }
    }

    function createExplosion(x, y, color) {
        SoundFX.playExplosion();
        for (let i=0; i<15; i++) particles.push(new Particle(x, y, color));
    }

    window.setPlayers = function(num) {
        playerCount = num;
        document.getElementById('btn-1p').classList.toggle('active', num === 1);
        document.getElementById('btn-2p').classList.toggle('active', num === 2);
        
        if (num === 1) {
            document.querySelector('.p1-color').innerText = "การควบคุม: WASD หรือ ลูกศร เคลื่อนที่ | SPACE หรือ ENTER ยิง";
            document.getElementById('p2-desc').style.display = 'none';
            document.getElementById('p2-name').style.display = 'none';
        } else {
            document.querySelector('.p1-color').innerText = "P1 (ซ้าย): WASD เคลื่อนที่ | SPACE ยิง";
            document.getElementById('p2-desc').innerText = "P2 (ขวา): ลูกศร เคลื่อนที่ | SHIFT ยิง";
            document.getElementById('p2-desc').style.display = 'inline';
            document.getElementById('p2-name').style.display = 'inline-block';
        }
    };

    window.goToStageSelect = function() {
        uiLoopActive = false; // ปิด UI stars loop
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('stage-screen').style.display = 'flex';
    };
    
    window.goBackToMain = function() {
        document.getElementById('stage-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'flex';
        uiLoopActive = true;
        runUiStarsLoop();
    };

    function initPlayers() {
        let p1Name = document.getElementById('p1-name').value.trim().toUpperCase() || "PLAYER 1";
        let p2Name = document.getElementById('p2-name').value.trim().toUpperCase() || "PLAYER 2";

        if (playerCount === 1) {
            player1 = new Player(1, p1Name, '#00FFCC', {
                up: ['KeyW', 'ArrowUp'], down: ['KeyS', 'ArrowDown'], left: ['KeyA', 'ArrowLeft'], right: ['KeyD', 'ArrowRight'], shoot: ['Space', 'Enter']
            }, canvas.width / 2 - 15, 500); 
            player2 = null;
        } else {
            player1 = new Player(1, p1Name, '#00FFCC', {
                up: ['KeyW'], down: ['KeyS'], left: ['KeyA'], right: ['KeyD'], shoot: ['Space']
            }, 200, 500);
            player2 = new Player(2, p2Name, '#FF3366', {
                up: ['ArrowUp'], down: ['ArrowDown'], left: ['ArrowLeft'], right: ['ArrowRight'], shoot: ['ShiftRight', 'ShiftLeft']
            }, 600, 500);
        }
    }

    window.startGame = function(stageId) {
        uiLoopActive = false; // สต็อปเมนูแอนิเมชันดาวตก
        audioCtx.resume();
        unplayedStages = [1, 2, 3].filter(id => id !== stageId);
        currentStageIndex = 1;
        initPlayers();
        setupStage(stageId);
        
        // ผูก Mobile Control SDK
        if (window.KAMPAI && window.KAMPAI.controls) {
            window.KAMPAI.sound.unlock();
            window.KAMPAI.sound.mountToggles();
            window.KAMPAI.controls.mount({
                dpad: true,
                buttons: [
                    { label: 'SHOOT', key: 'Space', color: '#00ffff' }
                ]
            });
        }
        
        startStageLoop();
    };

    function startStageLoop() {
        bullets = []; bossBullets = []; particles = []; floatingTexts = []; items = [];
        asteroids = []; boss = null;
        screenShake = 0; timer = CFG.TIME_LIMIT; globalTimeFreeze = 0;
        isBossEnding = false;
        
        // เคลียร์ HUD คอมโบเกลวไฟ
        document.getElementById('combo-fire-HUD').style.display = 'none';

        spawnWave();
        
        if (player1) { 
            if (player1.isDead) { player1.lives = 2; player1.isDead = false; }
            player1.x = (playerCount === 1) ? canvas.width/2 - 15 : 200; player1.y = 500; 
            player1.combo = 0;
        }
        if (player2) {
            if (player2.isDead) { player2.lives = 2; player2.isDead = false; }
            player2.x = 600; player2.y = 500; 
            player2.combo = 0;
        }

        gameState = 'PLAYING';
        BGM.play(false);

        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('stage-screen').style.display = 'none';
        document.getElementById('transition-screen').style.display = 'none';
        
        lastTime = performance.now();
        if (!isLooping) {
            isLooping = true;
            requestAnimationFrame(update);
        }
    }

    function handleStageClear() {
        gameState = 'TRANSITION';
        BGM.stop(); 
        SoundFX.playPowerup();

        if (unplayedStages.length > 0) {
            document.getElementById('transition-screen').style.display = 'flex';
            document.getElementById('transition-title').innerText = "STAGE CLEAR!";
            document.getElementById('transition-desc').innerText = `กำลังเตรียมเข้าสู่ด่านที่ ${currentStageIndex + 1}/3...`;
            document.getElementById('transition-random-info').innerText = "(ระบบกำลังสุ่มความยาก และ หมวดคณิตศาสตร์!)";

            setTimeout(() => {
                let nextId = unplayedStages.splice(Math.floor(qrand() * unplayedStages.length), 1)[0];
                currentStageIndex++;
                setupStage(nextId);
                startStageLoop();
            }, 4000);
        } else {
            endGame(true);
        }
    }

    function playerTakeDamage(p, x, y) {
        if (p.hasShield) {
            p.hasShield = false;
            p.invulnerableTimer = 30; 
            createExplosion(p.x + p.width/2, p.y + p.height/2, '#00FFFF');
            floatingTexts.push(new FloatingText(p.x, p.y, "SHIELD BLOCKED!", '#00FFFF'));
            SoundFX.playExplosion();
        } else {
            p.lives--;
            if (p.lives < 0) p.lives = 0;
            p.combo = 0;
            p.invulnerableTimer = 90;
            screenShake = 22;
            createExplosion(p.x + p.width/2, p.y + p.height/2, '#FF0000');
            SoundFX.playWrong();
            floatingTexts.push(new FloatingText(p.x, p.y, "-1 HP", "#FF0000"));

            if (p.lives <= 0) {
                p.isDead = true;
                createExplosion(p.x, p.y, '#FF3366'); 
            }
        }
        
        // แฟลชความเสียหาย HUD สตรีค
        updateComboFireHUD();
    }

    function updateComboFireHUD() {
        let maxCombo = 0;
        if (player1 && !player1.isDead) maxCombo = Math.max(maxCombo, player1.combo);
        if (player2 && !player2.isDead) maxCombo = Math.max(maxCombo, player2.combo);

        const hudEl = document.getElementById('combo-fire-HUD');
        const valEl = document.getElementById('combo-fire-val');
        if (maxCombo >= CFG.COMBO_FIRE_THRESHOLD) {
            hudEl.style.display = 'block';
            valEl.innerText = maxCombo;
        } else {
            hudEl.style.display = 'none';
        }
    }

    function update(time) {
        if (!isLooping) return;

        if (gameState === 'TRANSITION') {
            draw();
            requestAnimationFrame(update);
            return;
        }

        if (gameState !== 'PLAYING') return;

        let deltaTime = time - lastTime;
        if (deltaTime > 1000 && !isBossEnding) {
            if (timer > 0) timer--; 
            lastTime = time;
        }

        if (globalTimeFreeze > 0) globalTimeFreeze--;
        let timeScale = (globalTimeFreeze > 0) ? 0.3 : 1; 

        let p1Dead = !player1 || player1.isDead;
        let p2Dead = !player2 || player2.isDead;
        
        if (p1Dead && p2Dead) {
            endGame(false);
            return;
        }

        // เรียกบอสเมื่อเวลาหมด
        if (timer <= 0 && !boss && !isBossEnding) {
            let currentStageId = Object.keys(STAGES).find(key => STAGES[key].name === currentStageTheme.name);
            boss = new Boss(parseInt(currentStageId));
            floatingTexts.push(new FloatingText(canvas.width/2, canvas.height/2, "WARNING: BOSS APPROACHING!", "#FF0000"));
            SoundFX.playExplosion();
            screenShake = 30;
            BGM.play(true); 
        }

        stars.forEach(s => {
            s.y += s.speed * timeScale;
            if (s.y > canvas.height) { s.y = 0; s.x = Math.random() * canvas.width; }
        });

        if (player1) player1.update();
        if (player2) player2.update();

        bullets.forEach(b => b.update());
        bullets = bullets.filter(b => b.active);

        items.forEach(i => i.update());
        items = items.filter(i => i.active);

        particles.forEach(p => p.update());
        particles = particles.filter(p => p.life > 0);

        floatingTexts.forEach(ft => ft.update());
        floatingTexts = floatingTexts.filter(ft => ft.life > 0);

        if (screenShake > 0) screenShake--;

        if (boss && boss.active) {
            boss.update(timeScale); 
            bossBullets.forEach(bb => bb.update(timeScale));
            bossBullets = bossBullets.filter(bb => bb.active);

            // ผู้เล่นยิงปะทะบอสตรงๆ
            bullets.forEach(b => {
                if (b.active && boss.active && b.x > boss.x && b.x < boss.x + boss.width && b.y > boss.y && b.y < boss.y + boss.height) {
                    b.active = false;
                    
                    if (boss.hasShield) {
                        // บอสมีเกราะอัญมณี ยิงตรงไม่ได้ ดาเมจดูดกลืน
                        boss.flashTimer = 3;
                        floatingTexts.push(new FloatingText(b.x, b.y - 15, "SHIELD BLOCKED!", '#00FFFF'));
                        SoundFX.playWrong();
                    } else {
                        // เกราะบอสพังแล้ว ยิงตรงดาเมจเต็ม
                        boss.hp -= 1.5; 
                        boss.flashTimer = 5;
                        let bossPoints = 40;
                        if (b.owner.doubleTimer > 0) bossPoints *= 2; 
                        b.owner.score += bossPoints; 
                        b.owner.hits++;
                        if (vs && b.owner === player1) {
                            vs.report(player1.score, { correct: player1.hits });
                        }
                    }
                    
                    if (boss.hp <= 0 && !isBossEnding) {
                        boss.active = false;
                        isBossEnding = true;
                        
                        let killPoints = 5000;
                        if (b.owner.doubleTimer > 0) killPoints *= 2;
                        b.owner.score += killPoints; 
                        if (vs && b.owner === player1) {
                            vs.report(player1.score, { correct: player1.hits });
                        }
                        
                        screenShake = 60;
                        createExplosion(boss.x + boss.width/2, boss.y + boss.height/2, '#FFFFFF');
                        createExplosion(boss.x, boss.y, '#FFA500');
                        createExplosion(boss.x + boss.width, boss.y + boss.height, '#FF0000');
                        floatingTexts.push(new FloatingText(boss.x + boss.width/2, boss.y, "BOSS DEFEATED!", '#FFD700'));
                        
                        setTimeout(() => {
                            boss = null;
                            bossBullets = [];
                            isBossEnding = false;
                            handleStageClear();
                        }, 3000);
                    }
                }
            });
        }

        // --- ส่วนกะเทาะเกราะโจทย์เลขของบอสและด่านปกติ ---
        asteroids.forEach(a => a.update(timeScale));
        
        let correctAsteroidPassed = false;
        if (!boss || !boss.active) {
            // ด่านอุกกาบาตธรรมดา: เช็คตกพ้นจอ
            correctAsteroidPassed = asteroids.some(a => !a.active && a.isCorrect && a.y > canvas.height);
        }
        
        asteroids = asteroids.filter(a => a.active);
        
        if (correctAsteroidPassed || asteroids.length === 0) {
            spawnWave();
        }

        // Bullet vs Asteroid collision
        bullets.forEach(b => {
            asteroids.forEach(a => {
                if (b.active && a.active && Math.hypot(b.x - a.x, b.y - a.y) < a.radius) {
                    b.active = false;
                    a.active = false;
                    createExplosion(a.x, a.y, a.isCorrect ? '#00FF00' : '#FF0000');
                    
                    if (a.isCorrect) {
                        b.owner.combo++;
                        b.owner.maxCombo = Math.max(b.owner.maxCombo, b.owner.combo);
                        b.owner.hits++;
                        
                        let pts = 100 * b.owner.combo;
                        if (b.owner.doubleTimer > 0) pts *= 2;
                        b.owner.score += pts;
                        
                        updateComboFireHUD();

                        if (vs && b.owner === player1) {
                            vs.report(player1.score, { correct: player1.hits });
                        }

                        if (boss && boss.active && boss.hasShield) {
                            // การสู้บอส: ตอบถูกลดพลังเกราะ
                            boss.shieldHp--;
                            boss.flashTimer = 8;
                            screenShake = 15;
                            floatingTexts.push(new FloatingText(a.x, a.y, `SHIELD HIT! -1`, '#00FFFF'));
                            SoundFX.playCorrect(b.owner.combo);
                            
                            if (boss.shieldHp <= 0) {
                                boss.hasShield = false;
                                floatingTexts.push(new FloatingText(boss.x + boss.width/2, boss.y, "SHIELD DESTROYED!", '#FF00FF'));
                                createExplosion(boss.x + boss.width/2, boss.y + boss.height/2, '#00FFFF');
                            }
                        } else {
                            // ด่านปกติ
                            floatingTexts.push(new FloatingText(a.x, a.y, `CORRECT! +${pts}`, '#00FF00'));
                            SoundFX.playCorrect(b.owner.combo);
                        }
                        
                        // สุ่มปล่อยไอเทม
                        if (qrand() < 0.35) {
                            const types = ['SPEED', 'RAPID', 'HEAL', 'SHIELD', 'SPREAD', 'HOMING', 'DOUBLE', 'FREEZE', 'BOMB', 'SABOTAGE'];
                            items.push(new Item(a.x, a.y, types[Math.floor(qrand() * types.length)]));
                        }
                        spawnWave();
                    } else {
                        // ตอบผิด
                        b.owner.combo = 0;
                        playerTakeDamage(b.owner, a.x, a.y);
                        floatingTexts.push(new FloatingText(a.x, a.y, "WRONG!", '#FF0000'));
                        
                        if (boss && boss.active && boss.hasShield) {
                            // สู้บอส: ตอบผิดโดนสาดกระสุนโจมตีกลับ
                            boss.shootSpiralCounterAttack();
                        }
                        
                        spawnWave();
                    }
                }
            });
        });

        // Player vs Asteroid collision
        asteroids.forEach(a => {
            if (a.active) {
                [player1, player2].forEach(p => {
                    if (p && !p.isDead && Math.hypot(p.x + p.width/2 - a.x, p.y + p.height/2 - a.y) < a.radius + 15) {
                        a.active = false;
                        createExplosion(a.x, a.y, '#FF0000');
                        playerTakeDamage(p, a.x, a.y);
                        
                        if (boss && boss.active && boss.hasShield) {
                            boss.shootSpiralCounterAttack();
                        }
                        
                        spawnWave();
                    }
                });
            }
        });

        // --- ส่วนกระสุนของบอสยิงผู้เล่น ---
        if (boss && boss.active) {
            bossBullets.forEach(bb => {
                if (bb.active) {
                    [player1, player2].forEach(p => {
                        if (p && !p.isDead && Math.hypot(p.x + p.width/2 - bb.x, p.y + p.height/2 - bb.y) < bb.radius + 15) {
                            bb.active = false;
                            playerTakeDamage(p, bb.x, bb.y);
                        }
                    });
                }
            });
        }

        // --- ส่วนการเก็บไอเทมไอคอน ---
        items.forEach(i => {
            if (i.active) {
                [player1, player2].forEach(p => {
                    if (p && !p.isDead && Math.hypot(p.x + p.width/2 - i.x, p.y + i.offsetY + i.radius - i.y) < i.radius + 15) {
                        i.active = false;
                        SoundFX.playPowerup();
                        floatingTexts.push(new FloatingText(p.x, p.y, i.type + "!", '#00FFFF'));
                        
                        switch(i.type) {
                            case 'SPEED': p.speedBoostTimer = 300; break;
                            case 'RAPID': p.rapidFireTimer = 300; break;
                            case 'HEAL': p.lives = Math.min(p.lives + 1, 5); break;
                            case 'SHIELD': p.hasShield = true; break;
                            case 'SPREAD': p.spreadTimer = 300; break;
                            case 'HOMING': p.homingTimer = 300; break;
                            case 'DOUBLE': p.doubleTimer = 300; break;
                            case 'FREEZE': globalTimeFreeze = 300; break;
                            case 'BOMB':
                                createExplosion(i.x, i.y, '#FFFFFF');
                                asteroids.forEach(ast => {
                                    if (ast.active) {
                                        ast.active = false;
                                        if (ast.isCorrect) {
                                            let pts = 50;
                                            if (p.doubleTimer > 0) pts *= 2;
                                            p.score += pts;
                                            floatingTexts.push(new FloatingText(ast.x, ast.y, `CORRECT! +${pts}`, '#00FF00'));
                                        }
                                    }
                                });
                                spawnWave();
                                break;
                            case 'SABOTAGE':
                                if (playerCount === 2) {
                                    let other = (p.id === 1) ? player2 : player1;
                                    if (other && !other.isDead) {
                                        other.confusedTimer = 300;
                                        other.blindTimer = 300;
                                        floatingTexts.push(new FloatingText(other.x, other.y, "SABOTAGED!", '#FF00FF'));
                                    }
                                } else {
                                    p.confusedTimer = 300;
                                    p.blindTimer = 300;
                                }
                                break;
                        }
                    }
                });
            }
        });

        draw();
        requestAnimationFrame(update);
    }

    /**
     * DRAW FUNCTION
     */
    function draw() {
        ctx.save();
        if (screenShake > 0) {
            let dx = (Math.random() - 0.5) * screenShake;
            let dy = (Math.random() - 0.5) * screenShake;
            ctx.translate(dx, dy);
        }
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. วาดดาวพื้นหลัง
        stars.forEach(s => {
            ctx.fillStyle = s.color;
            ctx.fillRect(s.x, s.y, 2, 2);
        });

        // 2. วาดบอส หรืออุกกาบาต
        if (boss && boss.active) {
            boss.draw(ctx);
            bossBullets.forEach(bb => bb.draw(ctx));
        }
        
        // วาดอุกกาบาตโจทย์ (ด่านปกติ หรือ เกราะบอส)
        asteroids.forEach(a => a.draw(ctx));

        // 3. วาดไอเทมเก็บ
        items.forEach(i => i.draw(ctx));

        // 4. วาดกระสุน
        bullets.forEach(b => b.draw(ctx));

        // 5. วาดเอฟเฟกต์ระเบิดและข้อความลอย
        particles.forEach(p => p.draw(ctx));
        floatingTexts.forEach(ft => ft.draw(ctx));

        // 6. วาดผู้เล่น
        if (player1) player1.draw(ctx);
        if (player2) player2.draw(ctx);

        // 7. วาด HUD
        if (gameState === 'PLAYING') {
            // วาดโจทย์คณิตศาสตร์
            ctx.save();
            if (boss && boss.active) {
                ctx.fillStyle = '#FF3333';
                ctx.font = '14px "Press Start 2P"';
                ctx.textAlign = 'center';
                
                if (boss.hasShield) {
                    ctx.fillText("BOSS SHIELD QUESTION:", canvas.width / 2, 40);
                } else {
                    ctx.fillStyle = '#00FF00';
                    ctx.fillText("BOSS SHIELD DOWN! ATTACK!", canvas.width / 2, 40);
                }
                
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '24px "Press Start 2P"';
                ctx.fillText(currentMathData.question, canvas.width / 2, 80);
            } else {
                ctx.fillStyle = '#00FFFF';
                ctx.font = '11px "Press Start 2P"';
                ctx.textAlign = 'center';
                ctx.fillText(`STAGE ${currentStageIndex}/3: ${currentStageTheme.name}`, canvas.width / 2, 35);
                
                ctx.fillStyle = '#FFFFFF';
                ctx.font = '22px "Press Start 2P"';
                ctx.fillText(currentMathData.question, canvas.width / 2, 75);
            }
            ctx.restore();

            // ข้อมูลสถิติ Player 1
            if (player1) {
                ctx.save();
                ctx.textAlign = 'left';
                ctx.font = '10px "Press Start 2P"';
                ctx.fillStyle = player1.color;
                ctx.fillText(player1.name, 20, 30);
                
                let hearts = '❤️'.repeat(Math.max(0, player1.lives));
                ctx.font = '12px Arial';
                ctx.fillText(hearts || '💀 DEAD', 20, 50);
                
                ctx.font = '10px "Press Start 2P"';
                ctx.fillStyle = '#FFF';
                ctx.fillText(`SCORE: ${player1.score}`, 20, 70);
                if (player1.combo > 1) {
                    ctx.fillStyle = '#FFD700';
                    ctx.fillText(`COMBO: x${player1.combo}`, 20, 90);
                }
                
                let pLines = [];
                if (player1.speedBoostTimer > 0) pLines.push("⚡ SPEED");
                if (player1.rapidFireTimer > 0) pLines.push("🔫 RAPID");
                if (player1.spreadTimer > 0) pLines.push("🎇 SPREAD");
                if (player1.homingTimer > 0) pLines.push("🎯 HOMING");
                if (player1.doubleTimer > 0) pLines.push("🪙 DOUBLE");
                if (player1.confusedTimer > 0) pLines.push("💀 CONFUSE");
                
                ctx.fillStyle = '#00FFCC';
                ctx.font = '8px "Press Start 2P"';
                pLines.forEach((line, idx) => {
                    ctx.fillText(line, 20, 110 + idx * 12);
                });
                ctx.restore();
            }

            // ข้อมูลสถิติ Player 2
            if (player2) {
                ctx.save();
                ctx.textAlign = 'right';
                ctx.font = '10px "Press Start 2P"';
                ctx.fillStyle = player2.color;
                ctx.fillText(player2.name, canvas.width - 20, 30);
                
                let hearts = '❤️'.repeat(Math.max(0, player2.lives));
                ctx.font = '12px Arial';
                ctx.fillText(hearts || '💀 DEAD', canvas.width - 20, 50);
                
                ctx.font = '10px "Press Start 2P"';
                ctx.fillStyle = '#FFF';
                ctx.fillText(`SCORE: ${player2.score}`, canvas.width - 20, 70);
                if (player2.combo > 1) {
                    ctx.fillStyle = '#FFD700';
                    ctx.fillText(`COMBO: x${player2.combo}`, canvas.width - 20, 90);
                }
                
                let pLines = [];
                if (player2.speedBoostTimer > 0) pLines.push("⚡ SPEED");
                if (player2.rapidFireTimer > 0) pLines.push("🔫 RAPID");
                if (player2.spreadTimer > 0) pLines.push("🎇 SPREAD");
                if (player2.homingTimer > 0) pLines.push("🎯 HOMING");
                if (player2.doubleTimer > 0) pLines.push("🪙 DOUBLE");
                if (player2.confusedTimer > 0) pLines.push("💀 CONFUSE");
                
                ctx.fillStyle = '#FF3366';
                ctx.font = '8px "Press Start 2P"';
                pLines.forEach((line, idx) => {
                    ctx.fillText(line, canvas.width - 20, 110 + idx * 12);
                });
                ctx.restore();
            }

            // ตัวจับเวลาด้านล่าง
            ctx.save();
            ctx.textAlign = 'center';
            ctx.font = '12px "Press Start 2P"';
            ctx.fillStyle = (timer < 20) ? '#FF3333' : '#FFFFFF';
            ctx.fillText(`TIME LEFT: ${timer}s`, canvas.width / 2, canvas.height - 25);
            ctx.restore();
        }
        
        ctx.restore();
    }

    /**
     * GAME OVER & RESULTS SYSTEM
     */
    function endGame(win) {
        isLooping = false;
        gameState = 'ENDED';
        BGM.stop();

        if (vs) {
            let finalScore = player1 ? player1.score : 0;
            let finalCorrect = player1 ? player1.hits : 0;
            if (vs.finish(finalScore, { correct: finalCorrect })) {
                return;
            }
        }

        if (win) {
            SoundFX.playPowerup();
            document.getElementById('report-title').innerText = "MISSION COMPLETE";
            document.getElementById('report-title').style.color = "#00FF00";
        } else {
            SoundFX.playWrong();
            document.getElementById('report-title').innerText = "MISSION FAILED";
            document.getElementById('report-title').style.color = "#FF3333";
        }

        // คำนวณความแม่นยำและแสดงสถิติในตารางสรุป
        if (player1) {
            document.getElementById('th-p1').innerText = player1.name;
            document.getElementById('th-p1').style.display = 'table-cell';
            document.getElementById('res-score-p1').innerText = player1.score;
            document.getElementById('res-score-p1').style.display = 'table-cell';
            document.getElementById('res-combo-p1').innerText = player1.maxCombo;
            document.getElementById('res-combo-p1').style.display = 'table-cell';
            
            let acc1 = player1.shotsFired > 0 ? Math.round((player1.hits / player1.shotsFired) * 100) : 0;
            document.getElementById('res-acc-p1').innerText = acc1 + '%';
            document.getElementById('res-acc-p1').style.display = 'table-cell';
        }

        if (player2) {
            document.getElementById('th-p2').innerText = player2.name;
            document.getElementById('th-p2').style.display = 'table-cell';
            document.getElementById('res-score-p2').innerText = player2.score;
            document.getElementById('res-score-p2').style.display = 'table-cell';
            document.getElementById('res-combo-p2').innerText = player2.maxCombo;
            document.getElementById('res-combo-p2').style.display = 'table-cell';
            
            let acc2 = player2.shotsFired > 0 ? Math.round((player2.hits / player2.shotsFired) * 100) : 0;
            document.getElementById('res-acc-p2').innerText = acc2 + '%';
            document.getElementById('res-acc-p2').style.display = 'table-cell';
        } else {
            document.getElementById('th-p2').style.display = 'none';
            document.getElementById('res-score-p2').style.display = 'none';
            document.getElementById('res-combo-p2').style.display = 'none';
            document.getElementById('res-acc-p2').style.display = 'none';
        }

        document.getElementById('report-screen').style.display = 'flex';

        // บันทึกคะแนนลง LocalStorage หากเล่นเดี่ยว/นอกระบบ
        let p1Name = player1 ? player1.name : "PLAYER 1";
        let p1Score = player1 ? player1.score : 0;
        let finalScore = p1Score;
        let finalName = p1Name;
        if (player2 && player2.score > p1Score) {
            finalScore = player2.score;
            finalName = player2.name;
        }
        
        let localData = [];
        try {
            localData = JSON.parse(localStorage.getItem('math_blaster_leaderboard') || '[]');
        } catch (_) {}
        localData.push({ name: finalName, score: finalScore, mode: selectedCategory });
        localData.sort((a, b) => b.score - a.score);
        localStorage.setItem('math_blaster_leaderboard', JSON.stringify(localData.slice(0, 10)));

        // ส่งข้อมูลคะแนนไปยัง KAMPAI SDK
        if (window.KAMPAI) {
            let finalMaxCombo = player1 ? player1.maxCombo : 0;
            let finalAcc = (player1 && player1.shotsFired > 0) ? (player1.hits / player1.shotsFired) : 0;
            
            if (player2 && player2.score > p1Score) {
                finalMaxCombo = player2.maxCombo;
                finalAcc = player2.shotsFired > 0 ? (player2.hits / player2.shotsFired) : 0;
            }

            window.KAMPAI.submitScore(finalScore, {
                mode: 'normal',
                maxCombo: finalMaxCombo,
                accuracy: finalAcc
            });
        }
    }

    /**
     * LEADERBOARD IMPLEMENTATION
     */
    window.showLeaderboard = function() {
        uiLoopActive = false; // ปิดดาวเคลื่อนไหว
        document.getElementById('start-screen').style.display = 'none';
        const lbScreen = document.getElementById('leaderboard-screen');
        lbScreen.style.display = 'flex';
        
        const tbody = document.getElementById('lb-table-body');
        tbody.innerHTML = '';
        
        if (window.KAMPAI && window.KAMPAI.leaderboard && window.KAMPAI.leaderboard.length > 0) {
            window.KAMPAI.leaderboard.slice(0, 5).forEach((row, idx) => {
                const tr = document.createElement('tr');
                if (row.isMe) tr.style.backgroundColor = 'rgba(0, 255, 204, 0.15)';
                tr.innerHTML = `
                    <td>#${idx + 1}</td>
                    <td>${row.displayName}</td>
                    <td>${row.personalBest}</td>
                    <td>${row.classLabel || '-'}</td>
                `;
                tbody.appendChild(tr);
            });
        } else {
            let localData = [];
            try {
                localData = JSON.parse(localStorage.getItem('math_blaster_leaderboard') || '[]');
            } catch (_) {}
            
            localData.sort((a, b) => b.score - a.score);
            localData = localData.slice(0, 5);
            
            if (localData.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" style="padding:20px; font-size:10px;">ไม่มีข้อมูลคะแนน</td></tr>`;
            } else {
                localData.forEach((row, idx) => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>#${idx + 1}</td>
                        <td>${row.name || 'UNKNOWN'}</td>
                        <td>${row.score}</td>
                        <td>${modeNames[row.mode] || row.mode || '-'}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }
    };

    window.closeLeaderboard = function() {
        document.getElementById('leaderboard-screen').style.display = 'none';
        document.getElementById('start-screen').style.display = 'flex';
        uiLoopActive = true;
        runUiStarsLoop();
    };

    // ── เริ่มต้นระบบดาวเคลื่อนไหวหน้าเมนูแรกสุด ──
    initUiStars();
    uiLoopActive = true;
    runUiStarsLoop();

})();
