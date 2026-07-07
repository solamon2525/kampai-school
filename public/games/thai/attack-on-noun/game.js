(function() {
    'use strict';

    /* ================= CONFIGURATION & CONSTANTS ================= */
    const CFG = window.GAME_CONFIG || {
        SLUG: 'attack-on-noun',
        TITLE: 'ผู้พิทักษ์ลักษณะนาม',
        GAME_DURATION: 120,
        LIVES_START: 5,
        INITIAL_AMMO: 20,
        BGM_PRESET: 'battle'
    };
    const DATA = window.GAME_DATA || [
        { n: "ร่ม", c: "คัน", w: ["อัน", "ด้าม"] }
    ];

    const LB_KEY = 'attack_on_noun_leaderboard';
    const IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    /* ================= DOM ELEMENTS ================= */
    const blocker = document.getElementById('blocker');
    const startBtn = document.getElementById('startBtn');
    const vsBtn = document.getElementById('vsBtn');
    const nextPlayerBtn = document.getElementById('nextPlayerBtn');
    const showLbFromStart = document.getElementById('showLbFromStart');
    const showLbFromEnd = document.getElementById('showLbFromEnd');
    const closeLbBtn = document.getElementById('closeLbBtn');
    const leaderboardScreen = document.getElementById('leaderboardScreen');
    const gameOverScreen = document.getElementById('gameover-screen');
    const lbList = document.getElementById('lbList');

    const scoreValue = document.getElementById('score-value');
    const heartContainer = document.getElementById('heart-container');
    const ammoCount = document.getElementById('ammo-count');
    const messageArea = document.getElementById('message-area');
    const radarEl = document.getElementById('radar-status');
    const uiLayer = document.getElementById('ui-layer');

    /* ================= AUDIO GENERATOR ================= */
    let audioCtx = null;
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    function playSound(type) {
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(e => console.warn(e));
        }
        try {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            const now = audioCtx.currentTime;

            if (type === 'shoot') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, now);
                osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'correct') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
            } else if (type === 'wrong') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.linearRampToValueAtTime(100, now + 0.3);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
                osc.start(now);
                osc.stop(now + 0.3);
            } else if (type === 'pickup') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(400, now);
                osc.frequency.linearRampToValueAtTime(800, now + 0.2);
                gainNode.gain.setValueAtTime(0.1, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'empty') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(800, now);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (type === 'warning') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                gainNode.gain.setValueAtTime(0.0, now);
                gainNode.gain.linearRampToValueAtTime(0.03, now + 0.05);
                gainNode.gain.linearRampToValueAtTime(0.0, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'jump') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.linearRampToValueAtTime(500, now + 0.1);
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'enemy_shoot') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(200, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'countdown') {
                osc.type = 'square';
                osc.frequency.setValueAtTime(400, now);
                gainNode.gain.setValueAtTime(0.05, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
                osc.start(now);
                osc.stop(now + 0.1);
            } else if (type === 'crash') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(20, now + 0.5);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
            } else if (type === 'roar') {
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.linearRampToValueAtTime(50, now + 0.5);
                gainNode.gain.setValueAtTime(0.2, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.5);
                osc.start(now);
                osc.stop(now + 0.5);
            }
        } catch (e) {
            console.warn(e);
        }
    }

    /* ================= GAME STATE ================= */
    let state = 'idle'; // idle | playing | over
    let score = 0, hearts = CFG.LIVES_START, ammo = CFG.INITIAL_AMMO;
    let isGameOver = false, isLocked = false;
    let pitch = 0, yaw = 0;
    let lastWarningTime = 0;
    let isZoomed = false;
    let animFrameId = null;

    // Movement Physics
    let velocityY = 0;
    let isGrounded = true;
    let jumpCount = 0;
    const GRAVITY = -0.015;
    const JUMP_FORCE = 0.45;
    const MAX_JUMPS = 2;

    const keys = {};

    /* ================= THREE.JS OBJECTS ================= */
    let scene, camera, renderer, player, cameraBoom, playerMesh;
    let titans = [], abnormalTitans = [], birdTitans = [], colossalTitans = [], beastTitans = [], ammoBoxes = [], enemyBullets = [], trees = [], heartItems = [];

    /* ================= SDK / VERSUS INTEGRATION ================= */
    let ksdk = null;
    let vs = null;
    let qrand = Math.random;

    function renderPlayer() {
        const s = ksdk ? ksdk.student : null;
        const st = ksdk ? ksdk.stats : null;
        const chip = document.getElementById('player-chip');
        if (!chip) return;
        if (!s) {
            chip.style.display = 'none';
            return;
        }
        const av = s.photoUrl ? `<img src="${s.photoUrl}" alt="">` : `<div class="pc-init">${(s.displayName || s.name || '?')[0]}</div>`;
        const best = st ? ` · <span class="pc-best">สถิติ ${st.personalBest.toLocaleString()}</span>` : '';
        chip.innerHTML = av + `<span>${s.displayName || s.name}${best}</span>`;
        chip.style.display = 'flex';
    }

    if (window.KAMPAI) {
        window.KAMPAI.onReady((k) => {
            ksdk = k;
            renderPlayer();
            
            // Setup Versus mode (Check 11 requirement)
            vs = window.KampaiVersus.create({
                duration: CFG.GAME_DURATION,
                title: CFG.TITLE,
                onPlay: (room) => {
                    if (room && room.rng) {
                        qrand = room.rng;
                    }
                    startGame();
                },
                onEnd: () => {
                    stopCameraAndReset();
                }
            });
            if (vs && vs.available) {
                vsBtn.style.display = 'inline-block';
            } else {
                vsBtn.style.display = 'none';
            }
        });
    }

    /* ================= THREE.JS CREATORS ================= */
    function resizeCanvas() {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', resizeCanvas);

    function createTree() {
        const tree = new THREE.Group();
        const trunk = new THREE.Mesh(new THREE.BoxGeometry(1,4,1), new THREE.MeshStandardMaterial({color:0x8B4513}));
        trunk.position.y = 2; trunk.castShadow = true;
        const leaves = new THREE.Mesh(new THREE.BoxGeometry(4,4,4), new THREE.MeshStandardMaterial({color:0x228B22}));
        leaves.position.y = 5; leaves.castShadow = true;
        tree.add(trunk); tree.add(leaves);
        
        const angle = qrand() * Math.PI * 2;
        const dist = 30 + qrand() * 120;
        tree.position.set(Math.cos(angle)*dist, 0, Math.sin(angle)*dist);
        
        tree.userData = { hits: 0, hitBy: [], bounds: { radius: 2.5, height: 7.0 } };
        scene.add(tree);
        trees.push(tree);
    }

    function createPlayerMesh() {
        playerMesh = new THREE.Group();
        player.add(playerMesh);
        const mat = new THREE.MeshStandardMaterial({ color: 0x2196F3 });
        const skin = new THREE.MeshStandardMaterial({ color: 0xffdbac });
        const pantsMat = new THREE.MeshStandardMaterial({color:0x1a237e});
        
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.5), mat);
        body.position.y = 1.6; body.castShadow = true;
        playerMesh.add(body);
        const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), skin);
        head.position.y = 2.5; playerMesh.add(head);
        const limbGeo = new THREE.BoxGeometry(0.25, 1, 0.25);
        playerMesh.legL = new THREE.Mesh(limbGeo, pantsMat);
        playerMesh.legL.position.set(-0.25, 1.0, 0); playerMesh.legL.geometry.translate(0, -0.5, 0); playerMesh.add(playerMesh.legL);
        playerMesh.legR = new THREE.Mesh(limbGeo, pantsMat);
        playerMesh.legR.position.set(0.25, 1.0, 0); playerMesh.legR.geometry.translate(0, -0.5, 0); playerMesh.add(playerMesh.legR);
        const armGeo = new THREE.BoxGeometry(0.25, 1, 0.25);
        playerMesh.armL = new THREE.Mesh(armGeo, mat);
        playerMesh.armL.position.set(-0.55, 2.1, 0); playerMesh.armL.geometry.translate(0, -0.5, 0); playerMesh.add(playerMesh.armL);
        playerMesh.armR = new THREE.Mesh(armGeo, mat);
        playerMesh.armR.position.set(0.55, 2.1, 0); playerMesh.armR.geometry.translate(0, -0.5, 0); playerMesh.add(playerMesh.armR);
    }

    function createTextTexture(text, bgColor, textColor = "white") {
        const canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        if (bgColor !== 'transparent') {
            ctx.fillStyle = bgColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.strokeStyle = "white"; 
        ctx.lineWidth = 6; 
        ctx.strokeRect(5, 5, 246, 118);
        
        ctx.fillStyle = textColor; 
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        let fontSize = 50; 
        const maxWidth = 230; 
        
        do {
            ctx.font = `bold ${fontSize}px Kanit, sans-serif`;
            if(fontSize <= 10) break;
            if(ctx.measureText(text).width > maxWidth) {
                fontSize -= 2;
            } else {
                break;
            }
        } while (true);

        ctx.fillText(text, 128, 64);
        
        return new THREE.CanvasTexture(canvas);
    }

    /* ================= CLASSES ================= */
    class Titan {
        constructor() {
            this.id = THREE.MathUtils.generateUUID();
            this.data = DATA[Math.floor(qrand() * DATA.length)];
            this.mesh = new THREE.Group();
            this.walkOffset = qrand() * 100;
            this.speed = 0.06;
            this.damageDist = 5.0; 
            this.isCharging = false;
            this.chargeStartTime = 0;
            
            const skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69 });
            this.buildBody(skinMat);
            
            this.attackRing = new THREE.Mesh(
                new THREE.RingGeometry(0.5, 1, 32),
                new THREE.MeshBasicMaterial({ color: 0xff0000, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
            );
            this.attackRing.rotation.x = -Math.PI/2;
            this.attackRing.visible = false;
            this.mesh.add(this.attackRing);

            this.timerSprite = new THREE.Sprite(new THREE.SpriteMaterial({ 
                map: null, 
                transparent:true,
                depthTest: false,
                depthWrite: false
            }));
            this.timerSprite.renderOrder = 999;
            this.timerSprite.position.set(0, 5, 3.5);
            this.timerSprite.scale.set(2, 2, 1);
            this.timerSprite.visible = false;
            this.mesh.add(this.timerSprite);

            this.spawn();
        }

        buildBody(skinMat) {
            const torso = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.5, 1.5), skinMat);
            torso.position.y = 4.5; torso.castShadow = true; this.mesh.add(torso);
            const head = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.8, 1.5), skinMat);
            head.position.y = 7.15; this.mesh.add(head);
            const eyeGeo = new THREE.BoxGeometry(0.3, 0.3, 0.1);
            const eyeMat = new THREE.MeshBasicMaterial({color:0x000000});
            const eyeL = new THREE.Mesh(eyeGeo, eyeMat); eyeL.position.set(-0.4, 7.3, 0.8);
            const eyeR = new THREE.Mesh(eyeGeo, eyeMat); eyeR.position.set(0.4, 7.3, 0.8);
            this.mesh.add(eyeL); this.mesh.add(eyeR);

            this.hipL = new THREE.Group(); this.hipL.position.set(-0.8, 3, 0); this.mesh.add(this.hipL);
            this.hipR = new THREE.Group(); this.hipR.position.set(0.8, 3, 0); this.mesh.add(this.hipR);
            const thighGeo = new THREE.BoxGeometry(0.8, 1.6, 0.8);
            const thighL = new THREE.Mesh(thighGeo, skinMat); thighL.position.y = -0.75; this.hipL.add(thighL);
            const thighR = new THREE.Mesh(thighGeo, skinMat); thighR.position.y = -0.75; this.hipR.add(thighR);
            this.kneeL = new THREE.Group(); this.kneeL.position.y = -1.5; this.hipL.add(this.kneeL);
            this.kneeR = new THREE.Group(); this.kneeR.position.y = -1.5; this.hipR.add(this.kneeR);
            const shinGeo = new THREE.BoxGeometry(0.7, 1.6, 0.7);
            const shinL = new THREE.Mesh(shinGeo, skinMat); shinL.position.y = -0.75; this.kneeL.add(shinL);
            const shinR = new THREE.Mesh(shinGeo, skinMat); shinR.position.y = -0.75; this.kneeR.add(shinR);

            this.shoulderL = new THREE.Group(); this.shoulderL.position.set(-1.8, 5.8, 0); this.mesh.add(this.shoulderL);
            this.shoulderR = new THREE.Group(); this.shoulderR.position.set(1.8, 5.8, 0); this.mesh.add(this.shoulderR);
            const armGeo = new THREE.BoxGeometry(0.7, 1.8, 0.7);
            const uArmL = new THREE.Mesh(armGeo, skinMat); uArmL.position.y = -0.8; this.shoulderL.add(uArmL);
            const uArmR = new THREE.Mesh(armGeo, skinMat); uArmR.position.y = -0.8; this.shoulderR.add(uArmR);
            this.elbowL = new THREE.Group(); this.elbowL.position.y = -1.6; this.shoulderL.add(this.elbowL);
            this.elbowR = new THREE.Group(); this.elbowR.position.y = -1.6; this.shoulderR.add(this.elbowR);
            const fArmGeo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
            const fArmL = new THREE.Mesh(fArmGeo, skinMat); fArmL.position.y = -0.8; this.elbowL.add(fArmL);
            const fArmR = new THREE.Mesh(fArmGeo, skinMat); fArmR.position.y = -0.8; this.elbowR.add(fArmR);

            this.addQA();
        }

        addQA() {
            const qSprite = new THREE.Sprite(new THREE.SpriteMaterial({ 
                map: createTextTexture(this.data.n, "#333"),
                depthTest: false,
                depthWrite: false
            }));
            qSprite.renderOrder = 999;
            qSprite.position.y = 9.5; qSprite.scale.set(5, 2.5, 1);
            this.mesh.add(qSprite);
            
            this.ansBoxes = [];
            const options = [this.data.c, ...this.data.w].sort(() => qrand() - 0.5);
            const positions = [ new THREE.Vector3(-3.5, 6, 0), new THREE.Vector3(3.5, 6, 0), new THREE.Vector3(0, 5, 2) ];
            options.forEach((txt, i) => {
                const box = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 0.2), new THREE.MeshBasicMaterial({ map: createTextTexture(txt, "#d32f2f") }));
                const pos = positions[i] || new THREE.Vector3(0, 8, 0);
                box.position.copy(pos);
                box.userData = { isCorrect: txt === this.data.c, parent: this, type: 'normal' };
                this.mesh.add(box);
                this.ansBoxes.push(box);
            });
        }

        spawn() {
            const angle = qrand() * Math.PI * 2;
            this.mesh.position.set(Math.cos(angle) * 70, 0, Math.sin(angle) * 70);
            scene.add(this.mesh);
            titans.push(this);
        }

        update(playerPos, time) {
            const dist = this.mesh.position.distanceTo(playerPos);
            
            if (dist < this.damageDist) {
                if (!this.isCharging) {
                    this.isCharging = true;
                    this.chargeStartTime = time;
                    this.attackRing.visible = true;
                    this.timerSprite.visible = true;
                }
                const elapsed = time - this.chargeStartTime;
                const timeLeft = Math.ceil(3.0 - elapsed);
                this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);
                this.attackRing.scale.setScalar(1 + elapsed);
                if (this.lastTimeLeft !== timeLeft) {
                    this.lastTimeLeft = timeLeft;
                    this.timerSprite.material.map = createTextTexture(timeLeft.toString(), "transparent", "red");
                    playSound('countdown');
                }
                if (elapsed >= 3.0) {
                    takeDamage();
                    this.resetCharge();
                    const dir = new THREE.Vector3().subVectors(this.mesh.position, playerPos).normalize();
                    this.mesh.position.add(dir.multiplyScalar(10));
                }
                this.hipL.rotation.x = 0; this.hipR.rotation.x = 0;
                this.kneeL.rotation.x = 0; this.kneeR.rotation.x = 0;
                return; 
            } else {
                if (this.isCharging) this.resetCharge();
            }

            const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
            this.mesh.position.add(dir.multiplyScalar(this.speed));
            this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);
            
            const walkSpeed = 3;
            const cycle = (time * walkSpeed) + this.walkOffset;
            
            this.hipL.rotation.x = Math.sin(cycle) * 0.6;
            this.hipR.rotation.x = Math.sin(cycle + Math.PI) * 0.6;

            if (Math.sin(cycle) > 0) this.kneeL.rotation.x = Math.abs(Math.cos(cycle)) * 1.0; 
            else this.kneeL.rotation.x = 0.1;
            
            if (Math.sin(cycle + Math.PI) > 0) this.kneeR.rotation.x = Math.abs(Math.cos(cycle + Math.PI)) * 1.0;
            else this.kneeR.rotation.x = 0.1;

            this.shoulderL.rotation.x = Math.sin(cycle + Math.PI) * 0.5;
            this.shoulderR.rotation.x = Math.sin(cycle) * 0.5;
            this.elbowL.rotation.x = -Math.abs(Math.sin(cycle)) * 0.5;
            this.elbowR.rotation.x = -Math.abs(Math.cos(cycle)) * 0.5;
            this.mesh.position.y = Math.abs(Math.sin(cycle * 2)) * 0.15;
        }
        
        resetCharge() {
            this.isCharging = false;
            this.attackRing.visible = false;
            this.timerSprite.visible = false;
            this.attackRing.scale.setScalar(1);
        }

        remove() { scene.remove(this.mesh); titans = titans.filter(t => t !== this); }
    }

    class AbnormalTitan extends Titan {
        constructor() {
            super();
            titans.pop(); 
            abnormalTitans.push(this);
            this.speed = 0.12; 
            this.damageDist = 6.0; 
            const redMat = new THREE.MeshStandardMaterial({ color: 0xcd5c5c });
            this.mesh.traverse((child) => {
                if (child.isMesh && child.geometry.type === 'BoxGeometry' && !this.ansBoxes.includes(child)) {
                    child.material = redMat;
                }
            });
            this.ansBoxes.forEach(box => box.userData.type = 'abnormal');
        }
        
        update(playerPos, time) {
            const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
            this.mesh.position.add(dir.multiplyScalar(this.speed));
            this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);

            const cycle = (time * 8) + this.walkOffset; 
            this.hipL.rotation.x = Math.sin(cycle) * 1.2;
            this.hipR.rotation.x = Math.sin(cycle + Math.PI) * 1.2;
            this.kneeL.rotation.x = Math.abs(Math.sin(cycle)) * 1.5;
            this.kneeR.rotation.x = Math.abs(Math.sin(cycle + Math.PI)) * 1.5;
            this.shoulderL.rotation.x = 1.5; 
            this.shoulderR.rotation.x = 1.5;
            this.elbowL.rotation.x = 0;
            this.elbowR.rotation.x = 0;
            
            if (this.mesh.position.distanceTo(playerPos) < this.damageDist) {
                takeDamage();
                this.mesh.position.sub(dir.multiplyScalar(15));
            }
        }
        remove() { scene.remove(this.mesh); abnormalTitans = abnormalTitans.filter(t => t !== this); }
    }

    class ColossalTitan extends Titan {
        constructor() {
            super();
            titans.pop();
            colossalTitans.push(this);
            this.hp = 2; 
            this.speed = 0.02; 
            this.damageDist = 12.0; 
            this.mesh.scale.set(3, 3, 3);
            
            const steamMat = new THREE.MeshStandardMaterial({ color: 0x8B0000 }); 
            this.mesh.traverse((child) => {
                if (child.isMesh && child.geometry.type === 'BoxGeometry' && !this.ansBoxes.includes(child)) {
                    child.material = steamMat;
                }
            });
            
            this.ansBoxes.forEach(box => box.userData.type = 'colossal');
        }

        takeHit() {
            this.hp--;
            if (this.hp > 0) {
                playSound('roar');
                this.ansBoxes.forEach(box => this.mesh.remove(box));
                this.ansBoxes = [];
                const label = this.mesh.children.find(c => c.isSprite && c !== this.timerSprite);
                if(label) this.mesh.remove(label);
                
                this.data = DATA[Math.floor(qrand() * DATA.length)];
                this.addQA();
                this.ansBoxes.forEach(box => box.userData.type = 'colossal');
            }
        }

        update(playerPos, time) {
            super.update(playerPos, time);
            const cycle = (time * 1.5) + this.walkOffset;
            this.hipL.rotation.x = Math.sin(cycle) * 0.5;
            this.hipR.rotation.x = Math.sin(cycle + Math.PI) * 0.5;
            if (Math.sin(cycle) > 0) this.kneeL.rotation.x = Math.abs(Math.cos(cycle)) * 0.5; else this.kneeL.rotation.x = 0;
            if (Math.sin(cycle + Math.PI) > 0) this.kneeR.rotation.x = Math.abs(Math.cos(cycle + Math.PI)) * 0.5; else this.kneeR.rotation.x = 0;
            this.shoulderL.rotation.x = Math.sin(cycle + Math.PI) * 0.3;
            this.shoulderR.rotation.x = Math.sin(cycle) * 0.3;
            this.mesh.position.y = (Math.abs(Math.sin(cycle * 2)) * 0.1) * 3;
        }
        remove() { scene.remove(this.mesh); colossalTitans = colossalTitans.filter(t => t !== this); }
    }

    class BirdTitan {
        constructor() {
            this.id = THREE.MathUtils.generateUUID();
            this.data = DATA[Math.floor(qrand() * DATA.length)];
            this.mesh = new THREE.Group();
            this.speed = 0.08;
            this.lastShot = 0;
            this.shootInterval = 8.0; 
            
            const mat = new THREE.MeshStandardMaterial({ color: 0xffffff });
            const body = new THREE.Mesh(new THREE.BoxGeometry(3, 1, 1.5), mat);
            this.mesh.add(body);
            const wingGeo = new THREE.BoxGeometry(1.5, 0.2, 1);
            this.wingL = new THREE.Mesh(wingGeo, mat);
            this.wingL.position.set(-2, 0, 0); this.wingL.geometry.translate(-0.75, 0, 0); this.mesh.add(this.wingL);
            this.wingR = new THREE.Mesh(wingGeo, mat);
            this.wingR.position.set(2, 0, 0); this.wingR.geometry.translate(0.75, 0, 0); this.mesh.add(this.wingR);
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), mat);
            head.position.set(0, 0.5, 1); this.mesh.add(head);
            const beak = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.5, 4), new THREE.MeshStandardMaterial({color:0xffd700}));
            beak.rotation.x = Math.PI/2; beak.position.set(0, 0.5, 1.5); this.mesh.add(beak);

            const qSprite = new THREE.Sprite(new THREE.SpriteMaterial({ 
                map: createTextTexture(this.data.n, "#333"),
                depthTest: false,
                depthWrite: false
            }));
            qSprite.renderOrder = 999;
            qSprite.position.y = 2.5; qSprite.scale.set(4, 2, 1);
            this.mesh.add(qSprite);

            const barGroup = new THREE.Group();
            barGroup.position.set(0, 4.0, 0); 
            const bgBar = new THREE.Mesh(new THREE.BoxGeometry(2, 0.3, 0.1), new THREE.MeshBasicMaterial({color: 0x000000}));
            this.fillBar = new THREE.Mesh(new THREE.BoxGeometry(2, 0.3, 0.11), new THREE.MeshBasicMaterial({color: 0xff0000}));
            this.fillBar.scale.x = 0;
            this.fillBar.geometry.translate(-1, 0, 0); 
            this.fillBar.position.x = 1; 
            barGroup.add(bgBar); barGroup.add(this.fillBar);
            this.mesh.add(barGroup);

            this.ansBoxes = [];
            const options = [this.data.c, ...this.data.w].sort(() => qrand() - 0.5);
            options.forEach((txt, i) => {
                const box = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.8, 0.2), new THREE.MeshBasicMaterial({ map: createTextTexture(txt, "#d32f2f") }));
                box.position.set((i-1)*2, -1.5, 0);
                box.userData = { isCorrect: txt === this.data.c, parent: this, type: 'bird' };
                this.mesh.add(box);
                this.ansBoxes.push(box);
            });

            const angle = qrand() * Math.PI * 2;
            this.mesh.position.set(Math.cos(angle) * 60, 20, Math.sin(angle) * 60); 
            scene.add(this.mesh);
            birdTitans.push(this);
        }

        update(playerPos, time) {
            const targetPos = playerPos.clone();
            targetPos.y = Math.max(targetPos.y + 15, 15); 
            const dir = new THREE.Vector3().subVectors(targetPos, this.mesh.position).normalize();
            const distToPlayerXZ = new THREE.Vector2(playerPos.x, playerPos.z).distanceTo(new THREE.Vector2(this.mesh.position.x, this.mesh.position.z));
            if (distToPlayerXZ > 20) {
                this.mesh.position.add(dir.multiplyScalar(this.speed));
            } else {
                this.mesh.position.x += Math.sin(time) * 0.15;
                this.mesh.position.z += Math.cos(time) * 0.15;
                this.mesh.position.y += (targetPos.y - this.mesh.position.y) * 0.01;
            }
            if (this.mesh.position.y < 12) this.mesh.position.y = 12;
            this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);

            this.wingL.rotation.z = Math.sin(time * 10) * 0.5;
            this.wingR.rotation.z = -Math.sin(time * 10) * 0.5;

            if (this.lastShot === 0) this.lastShot = time; 
            const timePassed = time - this.lastShot;
            const progress = Math.min(timePassed / this.shootInterval, 1.0);
            this.fillBar.scale.x = progress;
            if (timePassed > this.shootInterval) { 
                this.shoot(playerPos);
                this.lastShot = time;
            }
        }

        shoot(targetPos) {
            const bullet = new THREE.Mesh(new THREE.SphereGeometry(0.5), new THREE.MeshBasicMaterial({color:0x555555}));
            bullet.position.copy(this.mesh.position);
            bullet.position.y -= 1;
            const dir = new THREE.Vector3().subVectors(targetPos, bullet.position).normalize();
            bullet.userData = { velocity: dir.multiplyScalar(0.25) }; 
            scene.add(bullet);
            enemyBullets.push(bullet);
            playSound('enemy_shoot');
        }
        remove() { scene.remove(this.mesh); birdTitans = birdTitans.filter(t => t !== this); }
    }

    class BeastTitan extends Titan {
        constructor() {
            super();
            titans.pop(); 
            beastTitans.push(this);
            this.speed = 0.05; 
            this.jumpCooldown = 0;
            this.isJumping = false;
            this.velocity = new THREE.Vector3();
            this.ansBoxes.forEach(box => box.userData.type = 'beast');
            const furMat = new THREE.MeshStandardMaterial({ color: 0x5D4037 }); 
            this.mesh.traverse((child) => {
                if (child.isMesh && child.geometry.type === 'BoxGeometry' && !this.ansBoxes.includes(child)) {
                    child.material = furMat;
                }
            });
            this.shoulderL.scale.set(1.2, 1.5, 1.2);
            this.shoulderR.scale.set(1.2, 1.5, 1.2);
        }

        update(playerPos, time) {
            if (this.isJumping) {
                this.mesh.position.add(this.velocity);
                this.velocity.y += -0.03; 
                if (this.mesh.position.y <= 0) { 
                    this.mesh.position.y = 0;
                    this.isJumping = false;
                    this.jumpCooldown = time + 5.0; 
                    if (this.mesh.position.distanceTo(playerPos) < 8.0) takeDamage();
                    playSound('crash'); 
                }
                this.hipL.rotation.x = -0.5; this.hipR.rotation.x = -0.5;
                this.kneeL.rotation.x = 1.0; this.kneeR.rotation.x = 1.0;
                this.shoulderL.rotation.x = -2.5; this.shoulderR.rotation.x = -2.5;
            } else {
                super.update(playerPos, time); 
                const dist = this.mesh.position.distanceTo(playerPos);
                if (time > this.jumpCooldown && dist > 10 && dist < 25) this.startJump(playerPos);
            }
        }

        startJump(targetPos) {
            this.isJumping = true;
            const dir = new THREE.Vector3().subVectors(targetPos, this.mesh.position).normalize();
            this.velocity = dir.multiplyScalar(0.5); 
            this.velocity.y = 1.0; 
            playSound('roar');
            if(this.isCharging) this.resetCharge();
        }
        remove() { scene.remove(this.mesh); beastTitans = beastTitans.filter(t => t !== this); }
    }

    /* ================= ITEM PICKUPS ================= */
    function spawnHeart(pos) {
        const heartGroup = new THREE.Group();
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: createTextTexture("♥", "transparent", "red") }));
        sprite.scale.set(2, 2, 1);
        heartGroup.add(sprite);
        heartGroup.position.copy(pos);
        heartGroup.position.y = 1.5;
        scene.add(heartGroup);
        heartItems.push(heartGroup);
    }

    function checkHeartPickup() {
        for (let i = heartItems.length - 1; i >= 0; i--) {
            const h = heartItems[i];
            if (player.position.distanceTo(h.position) < 2.5) {
                if (hearts < 5) {
                    hearts++;
                    playSound('pickup');
                    flashMessage("เก็บหัวใจ! +1 พลังชีวิต", "#ff7675");
                    updateUI();
                    scene.remove(h);
                    heartItems.splice(i, 1);
                } else {
                    playSound('pickup');
                    flashMessage("พลังชีวิตเต็มแล้ว!", "#ffeaa7");
                    scene.remove(h);
                    heartItems.splice(i, 1);
                }
            }
        }
    }

    function spawnAmmoBox(pos) {
        const box = new THREE.Group();
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: 0x00ff00, emissive: 0x004400 }));
        mesh.position.y = 1; box.add(mesh);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: createTextTexture("AMMO", "#00ff00", "black") }));
        sprite.position.y = 2.2; sprite.scale.set(2, 1, 1); box.add(sprite);
        if (pos) box.position.copy(pos);
        else {
            const angle = qrand() * Math.PI * 2;
            const dist = 20 + qrand() * 60;
            box.position.set(Math.cos(angle)*dist, 0, Math.sin(angle)*dist);
        }
        box.userData = { rotSpeed: qrand() * 0.05 + 0.02 };
        scene.add(box);
        ammoBoxes.push(box);
    }

    function checkAmmoPickup() {
        for (let i = ammoBoxes.length - 1; i >= 0; i--) {
            const box = ammoBoxes[i];
            if (player.position.distanceTo(box.position) < 2.5) {
                ammo += 5;
                playSound('pickup');
                flashMessage("ได้กระสุน +5", "#ffeaa7");
                updateUI();
                scene.remove(box);
                ammoBoxes.splice(i, 1);
                setTimeout(() => {
                    if (state === 'playing') spawnAmmoBox();
                }, 5000);
            }
        }
    }

    /* ================= CONTROLS ================= */
    function onMouseMove(e) {
        if (!isLocked || isGameOver) return;
        const sensitivity = isZoomed ? 0.0005 : 0.002;
        yaw -= e.movementX * sensitivity;
        pitch -= e.movementY * sensitivity;
        pitch = Math.max(-Math.PI / 4, Math.min(Math.PI / 6, pitch));
        player.rotation.y = yaw;
        cameraBoom.rotation.x = pitch;
    }

    function shoot() {
        if (!isLocked || isGameOver || ammo <= 0 || state !== 'playing') {
            if (ammo <= 0 && state === 'playing') playSound('empty');
            return;
        }
        ammo--; playSound('shoot'); updateUI();
        
        const recoilAmt = isZoomed ? 0.05 : 0.2;
        cameraBoom.position.z += recoilAmt; 
        setTimeout(() => {
            if (cameraBoom) cameraBoom.position.z -= recoilAmt;
        }, 100);

        const raycaster = new THREE.Raycaster();
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        raycaster.set(camera.getWorldPosition(new THREE.Vector3()), direction);

        let targets = [];
        titans.forEach(t => targets.push(...t.ansBoxes));
        abnormalTitans.forEach(t => targets.push(...t.ansBoxes));
        birdTitans.forEach(t => targets.push(...t.ansBoxes));
        colossalTitans.forEach(t => targets.push(...t.ansBoxes));
        beastTitans.forEach(t => targets.push(...t.ansBoxes));

        const hits = raycaster.intersectObjects(targets);

        if (hits.length > 0) {
            const hit = hits[0].object;
            if (hit.userData.isCorrect) {
                const enemy = hit.userData.parent;
                if (hit.userData.type === 'colossal') {
                    enemy.takeHit();
                    if(enemy.hp <= 0) {
                        playSound('correct');
                        flashMessage("ปราบไททันมหึมาสำเร็จ!", "#ffeaa7"); 
                        enemy.remove(); 
                        score += 300;
                        spawnHeart(enemy.mesh.position.clone()); 
                    } else {
                        flashMessage("ยิงโดน! แต่มันยังไม่ตาย", "#ff9f43");
                    }
                } else {
                    playSound('correct');
                    flashMessage("ถูกต้อง!", "#2ecc71");
                    enemy.remove();
                    score += 100;
                    if(qrand() < 0.4) spawnAmmoBox(enemy.mesh.position.clone().setY(0));
                }
            } else {
                playSound('wrong');
                flashMessage("ลักษณะนามผิด! ระวังตัว!", "#ff7675");
                takeDamage();
                score = Math.max(0, score - 20);
            }
            updateUI();
            if (vs) {
                vs.report(score, { correct: score });
            }
        }
    }

    function handleJump() {
        if (jumpCount < MAX_JUMPS) {
            velocityY = JUMP_FORCE;
            jumpCount++;
            isGrounded = false;
            playSound('jump');
        }
    }

    function takeDamage() {
        hearts--; playSound('wrong'); flashMessage("โดนโจมตี!", "#ff7675"); updateUI();
        uiLayer.classList.add('damage-effect');
        setTimeout(() => uiLayer.classList.remove('damage-effect'), 200);
        if (hearts <= 0) endGame();
    }

    function flashMessage(txt, color) {
        messageArea.innerText = txt;
        messageArea.style.color = color;
        messageArea.classList.add('show');
        setTimeout(() => messageArea.classList.remove('show'), 1500);
    }

    function updateUI() {
        let hStr = "";
        for(let i=0; i<CFG.LIVES_START; i++) hStr += (i < hearts) ? "❤️" : "🖤";
        heartContainer.innerText = hStr;
        ammoCount.innerText = ammo;
        if(ammo === 0) ammoCount.parentElement.classList.add('warn');
        else ammoCount.parentElement.classList.remove('warn');
        
        scoreValue.innerText = score;
    }

    /* ================= VIRTUAL MOBILE CONTROLS ================= */
    function setupTouchControls() {
        const joyBase = document.getElementById('joystick-base');
        const joyKnob = document.getElementById('joystick-knob');
        let joyOrigin = null;
        const maxRadius = 50;
        const deadzone = 10;

        const resetJoystick = () => {
            joyOrigin = null;
            joyKnob.style.transform = 'translate(0, 0)';
            keys['KeyW'] = keys['KeyS'] = keys['KeyA'] = keys['KeyD'] = false;
        };

        joyBase.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const t = e.changedTouches[0];
            if (!t) return;
            const r = joyBase.getBoundingClientRect();
            joyOrigin = { x: r.left + r.width / 2, y: r.top + r.height / 2, id: t.identifier };
        }, { passive: false });

        joyBase.addEventListener('touchmove', (e) => {
            if (!joyOrigin) return;
            e.preventDefault();
            const t = Array.from(e.changedTouches).find(x => x.identifier === joyOrigin.id);
            if (!t) return;
            const dx = t.clientX - joyOrigin.x;
            const dy = t.clientY - joyOrigin.y;
            const len = Math.min(Math.hypot(dx, dy), maxRadius);
            const ang = Math.atan2(dy, dx);
            joyKnob.style.transform = `translate(${Math.cos(ang) * len}px, ${Math.sin(ang) * len}px)`;
            keys['KeyW'] = dy < -deadzone;
            keys['KeyS'] = dy > deadzone;
            keys['KeyA'] = dx < -deadzone;
            keys['KeyD'] = dx > deadzone;
        }, { passive: false });

        joyBase.addEventListener('touchend', resetJoystick);
        joyBase.addEventListener('touchcancel', resetJoystick);

        const lookPad = document.getElementById('look-pad');
        let lookTouch = null;

        lookPad.addEventListener('touchstart', (e) => {
            const t = e.changedTouches[0];
            if (!t) return;
            lookTouch = { x: t.clientX, y: t.clientY, id: t.identifier };
        }, { passive: true });

        lookPad.addEventListener('touchmove', (e) => {
            if (!lookTouch || !isLocked || isGameOver) return;
            const t = Array.from(e.changedTouches).find(x => x.identifier === lookTouch.id);
            if (!t) return;
            e.preventDefault();
            const dx = t.clientX - lookTouch.x;
            const dy = t.clientY - lookTouch.y;
            const sensitivity = isZoomed ? 0.003 : 0.008;
            yaw -= dx * sensitivity;
            pitch -= dy * sensitivity;
            pitch = Math.max(-Math.PI / 4, Math.min(Math.PI / 6, pitch));
            if (player) player.rotation.y = yaw;
            if (cameraBoom) cameraBoom.rotation.x = pitch;
            lookTouch.x = t.clientX;
            lookTouch.y = t.clientY;
        }, { passive: false });

        const endLook = (e) => {
            if (!lookTouch) return;
            const stillTouching = Array.from(e.touches).some(x => x.identifier === lookTouch.id);
            if (!stillTouching) lookTouch = null;
        };
        lookPad.addEventListener('touchend', endLook);
        lookPad.addEventListener('touchcancel', endLook);

        const btnFire = document.getElementById('btn-fire');
        const btnJump = document.getElementById('btn-jump');
        const btnZoom = document.getElementById('btn-zoom');

        btnFire.addEventListener('touchstart', (e) => {
            e.preventDefault();
            shoot();
        }, { passive: false });

        btnJump.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (!isGameOver && isLocked) handleJump();
        }, { passive: false });

        btnZoom.addEventListener('touchstart', (e) => {
            e.preventDefault();
            isZoomed = !isZoomed;
            document.getElementById('crosshair').classList.toggle('zoomed', isZoomed);
            btnZoom.classList.toggle('active', isZoomed);
        }, { passive: false });
    }

    /* ================= INITIALIZATION ================= */
    function init() {
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x87CEEB);
        scene.fog = new THREE.Fog(0x87CEEB, 20, 120); 

        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        document.body.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambient);
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(50, 100, 50);
        sun.castShadow = true;
        sun.shadow.mapSize.width = 1024;
        sun.shadow.mapSize.height = 1024;
        scene.add(sun);

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(500, 500),
            new THREE.MeshStandardMaterial({ color: 0x4d8a31 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        // Bind standard keyboard listeners
        window.addEventListener('keydown', (e) => {
            keys[e.code] = true;
            if (e.code === 'Space' && isLocked && !isGameOver) handleJump();
        });
        window.addEventListener('keyup', e => keys[e.code] = false);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) shoot();
            if (e.button === 2 && isLocked && !isGameOver) {
                isZoomed = true;
                document.getElementById('crosshair').classList.add('zoomed');
            }
        });
        window.addEventListener('mouseup', (e) => {
            if (e.button === 2) {
                isZoomed = false;
                document.getElementById('crosshair').classList.remove('zoomed');
            }
        });

        document.addEventListener('pointerlockchange', () => {
            isLocked = document.pointerLockElement !== null;
            if (state === 'playing') {
                blocker.style.display = isLocked ? 'none' : 'flex';
            }
        });

        if (IS_TOUCH) {
            setupTouchControls();
        }
    }

    function resetGame() {
        score = 0;
        hearts = CFG.LIVES_START;
        ammo = CFG.INITIAL_AMMO;
        isGameOver = false;
        pitch = 0;
        yaw = 0;
        isZoomed = false;
        velocityY = 0;
        isGrounded = true;
        jumpCount = 0;

        // Clear Three scene entities
        titans.forEach(t => scene.remove(t.mesh));
        abnormalTitans.forEach(t => scene.remove(t.mesh));
        birdTitans.forEach(t => scene.remove(t.mesh));
        colossalTitans.forEach(t => scene.remove(t.mesh));
        beastTitans.forEach(t => scene.remove(t.mesh));
        ammoBoxes.forEach(box => scene.remove(box));
        enemyBullets.forEach(b => scene.remove(b));
        trees.forEach(tr => scene.remove(tr));
        heartItems.forEach(h => scene.remove(h));

        titans = [];
        abnormalTitans = [];
        birdTitans = [];
        colossalTitans = [];
        beastTitans = [];
        ammoBoxes = [];
        enemyBullets = [];
        trees = [];
        heartItems = [];

        // Rebuild trees and items
        for(let i=0; i<40; i++) createTree();
        for(let i=0; i<5; i++) spawnAmmoBox();

        if (player) {
            player.position.set(0, 0, 0);
            player.rotation.set(0, 0, 0);
        }
        if (cameraBoom) {
            cameraBoom.rotation.set(0, 0, 0);
        }
    }

    /* ================= MAIN ANIMATE LOOP ================= */
    function animate() {
        animFrameId = requestAnimationFrame(animate);
        const time = performance.now() / 1000;
        const dt = 0.016; // approximate delta

        if (isLocked && !isGameOver && state === 'playing') {
            const targetFOV = isZoomed ? 30 : 70;
            camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, 0.1);
            camera.updateProjectionMatrix();

            const moveSpeed = 0.25;
            const oldPos = player.position.clone(); 
            if (keys['KeyW']) player.translateZ(-moveSpeed);
            if (keys['KeyS']) player.translateZ(moveSpeed);
            if (keys['KeyA']) player.translateX(-moveSpeed);
            if (keys['KeyD']) player.translateX(moveSpeed);
            const isMoving = (keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD']);

            velocityY += GRAVITY;
            player.position.y += velocityY;

            let onTree = false;
            if (player.position.y <= 0) { 
                player.position.y = 0; 
                velocityY = 0; 
                isGrounded = true; 
                jumpCount = 0; 
            } 
            
            for (let i = 0; i < trees.length; i++) {
                const tree = trees[i];
                const dx = Math.abs(player.position.x - tree.position.x);
                const dz = Math.abs(player.position.z - tree.position.z);
                const radius = tree.userData.bounds.radius; 
                const height = tree.userData.bounds.height; 
                if (dx < radius && dz < radius) {
                    if (oldPos.y >= height - 0.5 && velocityY <= 0) {
                         if (player.position.y < height) {
                             player.position.y = height; 
                             velocityY = 0; 
                             isGrounded = true; 
                             jumpCount = 0; 
                             onTree = true;
                         }
                    } else {
                        if (player.position.y < height) { 
                            player.position.x = oldPos.x; 
                            player.position.z = oldPos.z; 
                        }
                    }
                }
            }
            if (!onTree && player.position.y > 0) {
                if (isGrounded && player.position.y > 0.1 && !onTree) isGrounded = false;
            }

            if (isMoving && isGrounded) {
                playerMesh.legL.rotation.x = Math.sin(time * 6) * 0.8;
                playerMesh.legR.rotation.x = Math.sin(time * 6 + Math.PI) * 0.8;
                playerMesh.armL.rotation.x = Math.sin(time * 6 + Math.PI) * 0.8;
                playerMesh.armR.rotation.x = Math.sin(time * 6) * 0.8;
            } else if (!isGrounded) {
                playerMesh.legL.rotation.x = -0.5; playerMesh.legR.rotation.x = 0.5;
            } else {
                playerMesh.legL.rotation.x = THREE.MathUtils.lerp(playerMesh.legL.rotation.x, 0, 0.1);
                playerMesh.legR.rotation.x = THREE.MathUtils.lerp(playerMesh.legR.rotation.x, 0, 0.1);
                playerMesh.armL.rotation.x = THREE.MathUtils.lerp(playerMesh.armL.rotation.x, 0, 0.1);
                playerMesh.armR.rotation.x = THREE.MathUtils.lerp(playerMesh.armR.rotation.x, 0, 0.1);
            }

            // Spawn monsters over time
            if (qrand() < 0.007) { 
                const totalEnemies = titans.length + abnormalTitans.length + birdTitans.length + colossalTitans.length + beastTitans.length;
                if (totalEnemies < 8) {
                    const rand = qrand();
                    if (rand < 0.05) { if(colossalTitans.length === 0) new ColossalTitan(); }
                    else if (rand < 0.20) { if (birdTitans.length === 0) new BirdTitan(); }
                    else if (rand < 0.35) { if(beastTitans.length === 0) new BeastTitan(); }
                    else if (rand < 0.55) new AbnormalTitan();
                    else new Titan();
                }
            }
            
            let closestDist = Infinity;
            const checkTitanTreeHit = (titan, scale = 1) => {
                for (let i = trees.length - 1; i >= 0; i--) {
                    const tree = trees[i];
                    const dist = new THREE.Vector2(titan.mesh.position.x, titan.mesh.position.z).distanceTo(new THREE.Vector2(tree.position.x, tree.position.z));
                    const hitRadius = 2.5 + (2.0 * scale);
                    if (dist < hitRadius) {
                        if (!tree.userData.hitBy.includes(titan.id)) {
                            tree.userData.hitBy.push(titan.id); 
                            tree.userData.hits++; 
                            playSound('crash'); 
                            if (tree.userData.hits >= 2) { 
                                scene.remove(tree); 
                                trees.splice(i, 1); 
                                flashMessage("ต้นไม้หักโค่น!", "orange"); 
                            }
                        }
                    }
                }
            };

            titans.forEach(t => { t.update(player.position, time); const d = t.mesh.position.distanceTo(player.position); if(d<closestDist) closestDist=d; checkTitanTreeHit(t); });
            abnormalTitans.forEach(t => { t.update(player.position, time); const d = t.mesh.position.distanceTo(player.position); if(d<closestDist) closestDist=d; checkTitanTreeHit(t); });
            colossalTitans.forEach(t => { t.update(player.position, time); const d = t.mesh.position.distanceTo(player.position); if(d < closestDist) closestDist=d; checkTitanTreeHit(t, 3); });
            birdTitans.forEach(t => { t.update(player.position, time); });
            beastTitans.forEach(t => { t.update(player.position, time); const d = t.mesh.position.distanceTo(player.position); if(d<closestDist) closestDist=d; checkTitanTreeHit(t); });

            // Update enemy projectiles
            for(let i=enemyBullets.length-1; i>=0; i--) {
                const b = enemyBullets[i]; b.position.add(b.userData.velocity);
                if(b.position.distanceTo(player.position) < 1.5) { 
                    takeDamage(); 
                    scene.remove(b); 
                    enemyBullets.splice(i, 1); 
                } 
                else if(b.position.length() > 200 || b.position.y < 0) { 
                    scene.remove(b); 
                    enemyBullets.splice(i, 1); 
                }
            }

            // Radar status beep
            if (closestDist < 25) {
                const interval = Math.max(0.1, (closestDist / 25) * 1.0); 
                if (time - lastWarningTime > interval) { 
                    playSound('warning'); 
                    lastWarningTime = time; 
                    uiLayer.style.boxShadow = "inset 0 0 50px rgba(255, 0, 0, 0.5)"; 
                    setTimeout(() => uiLayer.style.boxShadow = "none", 100); 
                }
                radarEl.classList.add('danger');
            } else {
                radarEl.classList.remove('danger'); 
                uiLayer.style.boxShadow = "none";
            }

            ammoBoxes.forEach(box => { 
                box.rotation.y += box.userData.rotSpeed; 
                box.children[0].position.y = 1 + Math.sin(time * 4) * 0.2; 
            });
            checkAmmoPickup();
            checkHeartPickup();
        }
        
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    /* ================= FLOW SCREENS ================= */
    function showScreen(el) {
        [blocker, gameOverScreen, leaderboardScreen].forEach(s => s.style.display = 'none');
        el.style.display = 'block';
    }

    function startGame() {
        initAudio();
        resetGame();
        updateUI();

        if (IS_TOUCH) {
            isLocked = true;
            blocker.style.display = 'none';
            const mc = document.getElementById('mobile-controls');
            if (mc) mc.style.display = 'block';
        } else {
            try {
                const lockPromise = document.body.requestPointerLock();
                if (lockPromise) {
                    lockPromise.catch((e) => {
                        console.warn("Pointer lock rejected:", e);
                    });
                }
            } catch (e) {
                console.warn(e);
            }
        }

        uiLayer.classList.remove('hidden');
        blocker.style.display = 'none';

        // Spawn first batch of titanic generals
        if (colossalTitans.length === 0) new ColossalTitan();
        if (beastTitans.length === 0) new BeastTitan();
        if (birdTitans.length === 0) new BirdTitan();

        if (ksdk && ksdk.sound && typeof ksdk.sound.bgmStart === 'function') {
            ksdk.sound.bgmStart();
        }

        state = 'playing';
    }

    function endGame() {
        if (state === 'over') return;
        state = 'over';
        isGameOver = true;
        isLocked = false;
        
        try {
            document.exitPointerLock();
        } catch (e) {}

        const mc = document.getElementById('mobile-controls');
        if (mc) mc.style.display = 'none';

        if (ksdk && ksdk.sound && typeof ksdk.sound.bgmStop === 'function') {
            ksdk.sound.bgmStop();
        }
        if (ksdk && ksdk.sound && typeof ksdk.sound.gameOver === 'function') {
            ksdk.sound.gameOver();
        }

        saveScore(score);

        if (vs) {
            if (vs.finish(score, { correct: score })) {
                return;
            }
        }

        if (window.KAMPAI) {
            window.KAMPAI.submitScore(score, { mode: vs ? vs.mode : 'solo' });
        }

        document.getElementById('final-score').innerText = score;
        showScreen(gameOverScreen);
    }

    function stopCameraAndReset() {
        state = 'idle';
        isGameOver = false;
        isLocked = false;
        try { document.exitPointerLock(); } catch (e) {}
        
        const mc = document.getElementById('mobile-controls');
        if (mc) mc.style.display = 'none';

        if (animFrameId) {
            cancelAnimationFrame(animFrameId);
            animFrameId = null;
        }
    }

    /* ================= LEADERBOARD ================= */
    function loadLB() {
        try {
            return JSON.parse(localStorage.getItem(LB_KEY)) || [];
        } catch (e) {
            return [];
        }
    }

    function saveScore(sc) {
        const name = (ksdk && ksdk.student) ? (ksdk.student.displayName || ksdk.student.name) : 'ผู้เล่น';
        const list = loadLB();
        list.push({ name, score: sc, date: new Date().toISOString() });
        list.sort((a,b) => b.score - a.score);
        localStorage.setItem(LB_KEY, JSON.stringify(list.slice(0, 10)));
    }

    function renderLB() {
        lbList.innerHTML = '';
        
        // Merge classmates scores from Kampai if available
        let list = loadLB();
        if (ksdk && ksdk.leaderboard && ksdk.leaderboard.length > 0) {
            const map = {};
            list.forEach(x => { map[x.name] = Math.max(map[x.name] || 0, x.score); });
            ksdk.leaderboard.forEach(x => {
                const name = x.student?.displayName || x.student?.name || 'เพื่อน';
                map[name] = Math.max(map[name] || 0, x.score || 0);
            });
            list = Object.keys(map).map(k => ({ name: k, score: map[k] }));
            list.sort((a,b) => b.score - a.score);
        }

        list.slice(0, 5).forEach((x, i) => {
            const li = document.createElement('li');
            li.innerHTML = `<span class="lb-rank">#${i+1}</span><span class="lb-name">${x.name}</span><span class="lb-score">${x.score.toLocaleString()}</span>`;
            lbList.appendChild(li);
        });
    }

    /* ================= INITIAL LOAD ================= */
    init();
    
    // Create base Three.js scene container and components
    player = new THREE.Group();
    scene.add(player);

    cameraBoom = new THREE.Group();
    player.add(cameraBoom);
    cameraBoom.add(camera);
    camera.position.set(0, 3, 6);

    createPlayerMesh();
    resetGame();
    animate();

    /* ================= BUTTON BINDINGS ================= */
    startBtn.addEventListener('click', () => {
        startGame();
    });
    
    vsBtn.addEventListener('click', () => {
        if (vs) {
            vs.openMenu();
        } else {
            alert('โหมดแข่ง 2 คนยังไม่พร้อมทำงาน');
        }
    });

    nextPlayerBtn.addEventListener('click', () => {
        stopCameraAndReset();
        showScreen(blocker);
        blocker.style.display = 'flex';
        renderPlayer();
    });

    showLbFromStart.addEventListener('click', () => {
        renderLB();
        showScreen(leaderboardScreen);
    });

    showLbFromEnd.addEventListener('click', () => {
        renderLB();
        showScreen(leaderboardScreen);
    });

    closeLbBtn.addEventListener('click', () => {
        showScreen(state === 'over' ? gameOverScreen : blocker);
        if (state !== 'over') {
            blocker.style.display = 'flex';
        }
    });

})();
