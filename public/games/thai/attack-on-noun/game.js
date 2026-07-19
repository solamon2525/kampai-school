(function() {
    'use strict';
    
    // ═══════ CONSTANTS & CONFIG ═══════
    const CFG = window.GAME_CONFIG || {};
    const RAW_DATA = window.GAME_DATA || { categories: {}, items: [] };

    const IS_TOUCH = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    const LB_KEY = 'attack_on_noun_leaderboard';
    const COLLECTION_KEY = 'attack_on_noun_collection';

    // ═══════ DOM REFERENCES ═══════
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

    const timerDisplay = document.getElementById('timer-display');
    const comboDisplay = document.getElementById('combo-display');
    const killFeed = document.getElementById('kill-feed');
    const waveDisplay = document.getElementById('wave-display');
    const feverOverlay = document.getElementById('fever-overlay');

    const diffBtns = document.querySelectorAll('#difficulty-select button');
    const categorySelect = document.getElementById('category-select');
    const practiceBtn = document.getElementById('practice-btn');
    const minimapCanvas = document.getElementById('minimap-canvas');

    const statsKills = document.getElementById('stats-kills');
    const statsAccuracy = document.getElementById('stats-accuracy');
    const statsComboMax = document.getElementById('stats-combo-max');
    const statsWave = document.getElementById('stats-wave');
    const statsWrongWords = document.getElementById('stats-wrong-words');

    const landscapeWarning = document.getElementById('landscape-warning');

    const collectionBtn = document.getElementById('collection-btn');
    const collectionScreen = document.getElementById('collection-screen');
    const collectionGrid = document.getElementById('collection-grid');
    const collectionClose = document.getElementById('collection-close');
    const collectionProgress = document.getElementById('collection-progress');

    const explanationPopup = document.getElementById('explanation-popup');
    const explanationText = document.getElementById('explanation-text');
    const explanationClose = document.getElementById('explanation-close');

    // ═══════ TEXTURE CACHE ═══════
    const textureCache = new Map();

    // ═══════ GAME STATE ═══════
    let state = 'idle'; // idle | playing | over | practice
    let score = 0, hearts = 5, ammo = 20;
    let isGameOver = false, isLocked = false;
    let pitch = 0, yaw = 0;
    let lastWarningTime = 0;
    let isZoomed = false;
    let animFrameId = null;

    let difficulty = 'medium';
    let practiceMode = false;
    let activeCategories = [];
    let currentWave = 1;
    let waveTitansToSpawn = 0;
    let waveTitansKilled = 0;
    let gameStartTime = 0;
    let gameDuration = 120;
    let frameCount = 0;

    let combo = 0;
    let maxCombo = 0;
    let feverEndTime = 0;
    let isFever = false;

    let kills = 0;
    let shotsFired = 0;
    let shotsHit = 0;
    let wrongWords = [];

    // Power-up active states
    let hasShield = false;
    let freezeEndTime = 0;
    let fireAmmoCount = 0;

    // Movement Physics
    let velocityY = 0;
    let isGrounded = true;
    let jumpCount = 0;
    const GRAVITY = -0.015;
    const JUMP_FORCE = 0.45;
    const MAX_JUMPS = 2;

    const keys = {};

    // ═══════ THREE.JS SETUP ═══════
    let scene, camera, renderer, player, cameraBoom, playerMesh;
    let titans = [];
    let powerups = [];
    let ammoBoxes = [];
    let enemyBullets = [];
    let trees = [];
    let heartItems = [];
    let particles = [];

    let bulletPool = [];
    let activeBullets = [];

    // ═══════ SDK / VERSUS INTEGRATION ═══════
    let ksdk = null;
    let vs = null;
    let qrand = Math.random;

    if (window.KAMPAI) {
        window.KAMPAI.onReady((k) => {
            ksdk = k;
            renderPlayer();
            if (ksdk.sound && ksdk.sound.mountToggles) {
                ksdk.sound.mountToggles();
            }
            if (ksdk.sound && ksdk.sound.unlock) {
                // unlock on first click done manually below
            }
            vs = window.KampaiVersus ? window.KampaiVersus.create({
                duration: CFG.GAME_DURATION || 120,
                title: CFG.TITLE || 'Attack on Noun',
                onPlay: (room) => {
                    if (room && room.rng) {
                        qrand = room.rng;
                    }
                    startGame(false); // start multiplayer, not practice
                },
                onEnd: () => {
                    stopCameraAndReset();
                }
            }) : null;
            if (vs && vs.available && vsBtn) {
                vsBtn.style.display = 'inline-block';
            } else if (vsBtn) {
                vsBtn.style.display = 'none';
            }
        });
    }

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
        const best = st ? ` · <span class="pc-best">สถิติ ${st.personalBest ? st.personalBest.toLocaleString() : 0}</span>` : '';
        chip.innerHTML = av + `<span>${s.displayName || s.name}${best}</span>`;
        chip.style.display = 'flex';
    }

    // ═══════ UTILITY FUNCTIONS ═══════
    let audioCtx = null;
    function initAudio() {
        if (ksdk && ksdk.sound && ksdk.sound.unlock) {
            ksdk.sound.unlock();
        }
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }
    
    function playTone(type) {
        if (!audioCtx || audioCtx.state === 'suspended') return;
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
            } else if (type === 'jump') {
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, now);
                osc.frequency.linearRampToValueAtTime(500, now + 0.1);
                gainNode.gain.setValueAtTime(0.08, now);
                gainNode.gain.linearRampToValueAtTime(0, now + 0.2);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'warning') {
                osc.type = 'sine';
                osc.frequency.setValueAtTime(800, now);
                gainNode.gain.setValueAtTime(0.0, now);
                gainNode.gain.linearRampToValueAtTime(0.03, now + 0.05);
                gainNode.gain.linearRampToValueAtTime(0.0, now + 0.15);
                osc.start(now);
                osc.stop(now + 0.15);
            }
        } catch (e) {}
    }

    function disposeObject(obj) {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
            if (Array.isArray(obj.material)) {
                obj.material.forEach(m => {
                    if (m.map) m.map.dispose();
                    m.dispose();
                });
            } else {
                if (obj.material.map) obj.material.map.dispose();
                obj.material.dispose();
            }
        }
        if (obj.children) {
            for (let i = obj.children.length - 1; i >= 0; i--) {
                disposeObject(obj.children[i]);
                obj.remove(obj.children[i]);
            }
        }
    }

    function createTextTexture(text, bgColor, textColor = "white") {
        const key = `${text}|${bgColor}|${textColor}`;
        if (textureCache.has(key)) return textureCache.get(key);

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
        
        const tex = new THREE.CanvasTexture(canvas);
        textureCache.set(key, tex);
        return tex;
    }

    function flashMessage(txt, color) {
        if(messageArea) {
            messageArea.innerText = txt;
            messageArea.style.color = color;
            messageArea.classList.add('show');
            setTimeout(() => messageArea.classList.remove('show'), 1500);
        }
    }

    function updateUI() {
        if(heartContainer) {
            let hStr = "";
            for(let i=0; i<CFG.LIVES_START; i++) hStr += (i < hearts) ? "❤️" : "🖤";
            if (hasShield) hStr += " 🛡️";
            heartContainer.innerText = hStr;
        }
        if(ammoCount) {
            ammoCount.innerText = isFever ? "∞" : ammo;
            if(ammo === 0 && !isFever) ammoCount.parentElement.classList.add('warn');
            else ammoCount.parentElement.classList.remove('warn');
        }
        if(scoreValue) {
            scoreValue.innerText = score;
        }
        if(comboDisplay && combo > 0) {
            comboDisplay.innerText = `Combo x${combo}`;
            comboDisplay.style.display = 'block';
            comboDisplay.style.transform = 'scale(1.5)';
            setTimeout(() => { comboDisplay.style.transform = 'scale(1)'; }, 100);
        } else if(comboDisplay) {
            comboDisplay.style.display = 'none';
        }
        if (feverOverlay) feverOverlay.style.display = isFever ? 'block' : 'none';
        if (waveDisplay && currentWave > 0) {
            const maxW = (CFG.DIFFICULTY && CFG.DIFFICULTY[difficulty]) ? CFG.DIFFICULTY[difficulty].waveCount : 5;
            waveDisplay.innerText = `Wave ${currentWave} / ${maxW}`;
        }
    }

    function addKillFeed(text) {
        if(!killFeed) return;
        const div = document.createElement('div');
        div.innerText = text;
        killFeed.appendChild(div);
        if (killFeed.children.length > 5) {
            killFeed.removeChild(killFeed.firstChild);
        }
        setTimeout(() => {
            if (div.parentNode) div.parentNode.removeChild(div);
        }, 3000);
    }

    function triggerShake() {
        if(!cameraBoom) return;
        const originalY = cameraBoom.position.y;
        let shakeFrames = 20;
        const shake = () => {
            if (shakeFrames <= 0) {
                cameraBoom.position.y = originalY;
                return;
            }
            cameraBoom.position.y = originalY + (Math.random() - 0.5) * (shakeFrames / 20) * 0.5;
            shakeFrames--;
            requestAnimationFrame(shake);
        };
        shake();
    }

    // ═══════ THREE.JS SCENE ═══════
    function initThree() {
        scene = new THREE.Scene();

        // Gradient Sky
        const canvas = document.createElement('canvas');
        canvas.width = 2;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        const grad = ctx.createLinearGradient(0,0,0,512);
        grad.addColorStop(0, "#87CEEB");
        grad.addColorStop(1, "#f0f8ff");
        ctx.fillStyle = grad;
        ctx.fillRect(0,0,2,512);
        const bgTex = new THREE.CanvasTexture(canvas);
        scene.background = bgTex;
        scene.fog = new THREE.Fog(0xf0f8ff, 20, 150); 

        camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 1000);
        
        renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(renderer.domElement);

        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambient);
        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(50, 100, 50);
        sun.castShadow = true;
        
        // Shadow optimization
        sun.shadow.mapSize.width = 512;
        sun.shadow.mapSize.height = 512;
        sun.shadow.camera.near = 0.5;
        sun.shadow.camera.far = 200;
        const d = 100;
        sun.shadow.camera.left = -d;
        sun.shadow.camera.right = d;
        sun.shadow.camera.top = d;
        sun.shadow.camera.bottom = -d;
        scene.add(sun);

        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(500, 500),
            new THREE.MeshStandardMaterial({ color: 0x4d8a31 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        scene.add(ground);

        window.addEventListener('resize', resizeCanvas);
        
        // Bullet pool
        for(let i=0; i<20; i++){
            const b = new THREE.Mesh(new THREE.SphereGeometry(0.2), new THREE.MeshBasicMaterial({color: 0xffff00}));
            b.visible = false;
            scene.add(b);
            bulletPool.push(b);
        }
    }

    function resizeCanvas() {
        if (!camera || !renderer) return;
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

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

    function spawnParticles(pos, color) {
        for(let i=0; i<8; i++){
            const p = new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.5), new THREE.MeshBasicMaterial({color: color}));
            p.position.copy(pos);
            const a = qrand() * Math.PI * 2;
            const b = qrand() * Math.PI;
            const v = new THREE.Vector3(Math.sin(b)*Math.cos(a), Math.cos(b), Math.sin(b)*Math.sin(a));
            v.multiplyScalar(qrand() * 0.5 + 0.2);
            scene.add(p);
            particles.push({mesh: p, v: v, life: 1.0});
        }
    }

    // ═══════ ENEMIES ═══════
    class Titan {
        constructor() {
            this.id = THREE.MathUtils.generateUUID();
            this.data = this.getRandomItem();
            this.mesh = new THREE.Group();
            this.walkOffset = qrand() * 100;
            const baseSpeed = (CFG.DIFFICULTY && CFG.DIFFICULTY[difficulty]) ? CFG.DIFFICULTY[difficulty].titanSpeed : 1.0;
            this.speed = 0.06 * baseSpeed;
            this.damageDist = 5.0; 
            this.isCharging = false;
            this.chargeStartTime = 0;
            this.type = 'normal';
            this.hp = 1;
            
            this.skinMat = new THREE.MeshStandardMaterial({ color: 0xe0ac69 });
            this.buildBody();
            this.addQA();
            this.spawn();
        }
        
        getRandomItem() {
            let list = RAW_DATA.items;
            if (activeCategories.length > 0) {
                list = list.filter(it => activeCategories.includes(it.cat));
            }
            if (!list || list.length === 0) list = RAW_DATA.items;
            return list[Math.floor(qrand() * list.length)];
        }

        buildBody() {
            const torso = new THREE.Mesh(new THREE.BoxGeometry(2.5, 3.5, 1.5), this.skinMat);
            torso.position.y = 4.5; torso.castShadow = true; this.mesh.add(torso);
            const head = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.8, 1.5), this.skinMat);
            head.position.y = 7.15; this.mesh.add(head);
            
            this.hipL = new THREE.Group(); this.hipL.position.set(-0.8, 3, 0); this.mesh.add(this.hipL);
            this.hipR = new THREE.Group(); this.hipR.position.set(0.8, 3, 0); this.mesh.add(this.hipR);
            const thighGeo = new THREE.BoxGeometry(0.8, 1.6, 0.8);
            const thighL = new THREE.Mesh(thighGeo, this.skinMat); thighL.position.y = -0.75; this.hipL.add(thighL);
            const thighR = new THREE.Mesh(thighGeo, this.skinMat); thighR.position.y = -0.75; this.hipR.add(thighR);
            this.kneeL = new THREE.Group(); this.kneeL.position.y = -1.5; this.hipL.add(this.kneeL);
            this.kneeR = new THREE.Group(); this.kneeR.position.y = -1.5; this.hipR.add(this.kneeR);
            const shinGeo = new THREE.BoxGeometry(0.7, 1.6, 0.7);
            const shinL = new THREE.Mesh(shinGeo, this.skinMat); shinL.position.y = -0.75; this.kneeL.add(shinL);
            const shinR = new THREE.Mesh(shinGeo, this.skinMat); shinR.position.y = -0.75; this.kneeR.add(shinR);

            this.shoulderL = new THREE.Group(); this.shoulderL.position.set(-1.8, 5.8, 0); this.mesh.add(this.shoulderL);
            this.shoulderR = new THREE.Group(); this.shoulderR.position.set(1.8, 5.8, 0); this.mesh.add(this.shoulderR);
            const armGeo = new THREE.BoxGeometry(0.7, 1.8, 0.7);
            const uArmL = new THREE.Mesh(armGeo, this.skinMat); uArmL.position.y = -0.8; this.shoulderL.add(uArmL);
            const uArmR = new THREE.Mesh(armGeo, this.skinMat); uArmR.position.y = -0.8; this.shoulderR.add(uArmR);
            this.elbowL = new THREE.Group(); this.elbowL.position.y = -1.6; this.shoulderL.add(this.elbowL);
            this.elbowR = new THREE.Group(); this.elbowR.position.y = -1.6; this.shoulderR.add(this.elbowR);
            const fArmGeo = new THREE.BoxGeometry(0.6, 1.8, 0.6);
            const fArmL = new THREE.Mesh(fArmGeo, this.skinMat); fArmL.position.y = -0.8; this.elbowL.add(fArmL);
            const fArmR = new THREE.Mesh(fArmGeo, this.skinMat); fArmR.position.y = -0.8; this.elbowR.add(fArmR);
        }

        addQA() {
            if(this.qSprite) { this.mesh.remove(this.qSprite); disposeObject(this.qSprite); }
            this.qSprite = new THREE.Sprite(new THREE.SpriteMaterial({ 
                map: createTextTexture(this.data.n, "#333"),
                depthTest: false, depthWrite: false
            }));
            this.qSprite.renderOrder = 999;
            this.qSprite.position.y = 9.5; this.qSprite.scale.set(5, 2.5, 1);
            this.mesh.add(this.qSprite);
            
            if(this.ansBoxes) {
                this.ansBoxes.forEach(b => { this.mesh.remove(b); disposeObject(b); });
            }
            this.ansBoxes = [];
            const numDistractors = (CFG.DIFFICULTY && CFG.DIFFICULTY[difficulty]) ? CFG.DIFFICULTY[difficulty].distractors : 2;
            const ww = [...this.data.w].sort(()=>qrand()-0.5).slice(0, numDistractors);
            const options = [this.data.c, ...ww].sort(() => qrand() - 0.5);
            const positions = [ new THREE.Vector3(-3.5, 6, 0), new THREE.Vector3(3.5, 6, 0), new THREE.Vector3(0, 5, 2), new THREE.Vector3(0, 7, 0) ];
            
            options.forEach((txt, i) => {
                const box = new THREE.Mesh(new THREE.BoxGeometry(2.0, 1.0, 0.2), new THREE.MeshBasicMaterial({ map: createTextTexture(txt, "#d32f2f") }));
                const pos = positions[i] || new THREE.Vector3(0, 8, 0);
                box.position.copy(pos);
                box.userData = { isCorrect: txt === this.data.c, parent: this, type: this.type, txt: txt };
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
            if (freezeEndTime > performance.now()) return; 
            const dist = this.mesh.position.distanceTo(playerPos);
            if (dist > 150) return; // Distance skip

            if (dist < this.damageDist) {
                if (!this.isCharging) {
                    this.isCharging = true;
                    this.chargeStartTime = time;
                }
                const elapsed = time - this.chargeStartTime;
                this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);
                if (elapsed >= 3.0) {
                    takeDamage();
                    this.isCharging = false;
                    const dir = new THREE.Vector3().subVectors(this.mesh.position, playerPos).normalize();
                    this.mesh.position.add(dir.multiplyScalar(10));
                }
                return; 
            } else {
                this.isCharging = false;
            }

            const dir = new THREE.Vector3().subVectors(playerPos, this.mesh.position).normalize();
            this.mesh.position.add(dir.multiplyScalar(this.speed));
            this.mesh.lookAt(playerPos.x, this.mesh.position.y, playerPos.z);
            
            const walkSpeed = 3;
            const cycle = (time * walkSpeed) + this.walkOffset;
            this.hipL.rotation.x = Math.sin(cycle) * 0.6;
            this.hipR.rotation.x = Math.sin(cycle + Math.PI) * 0.6;
            this.kneeL.rotation.x = Math.sin(cycle) > 0 ? Math.abs(Math.cos(cycle)) * 1.0 : 0.1;
            this.kneeR.rotation.x = Math.sin(cycle + Math.PI) > 0 ? Math.abs(Math.cos(cycle + Math.PI)) * 1.0 : 0.1;
            this.shoulderL.rotation.x = Math.sin(cycle + Math.PI) * 0.5;
            this.shoulderR.rotation.x = Math.sin(cycle) * 0.5;
            this.mesh.position.y = Math.abs(Math.sin(cycle * 2)) * 0.15;
        }

        takeHit() {
            this.hp--;
            if (this.hp > 0) {
                if(ksdk && ksdk.sound && ksdk.sound.wrong) ksdk.sound.wrong();
                this.data = this.getRandomItem();
                this.addQA();
            } else {
                this.die();
            }
        }

        die() {
            spawnParticles(this.mesh.position, 0xff0000);
            scene.remove(this.mesh);
            disposeObject(this.mesh);
            const idx = titans.indexOf(this);
            if (idx > -1) titans.splice(idx, 1);
            waveTitansKilled++;
            kills++;
            
            // Try spawn powerup
            if (qrand() < CFG.POWERUP_CHANCE) spawnPowerUp(this.mesh.position);
            
            checkWaveComplete();
        }
    }

    class ArmoredTitan extends Titan {
        constructor() {
            super();
            this.type = 'armored';
            this.hp = 3; // 2 shield + 1 body
            this.mesh.scale.set(1.5, 1.5, 1.5);
            const armMat = new THREE.MeshStandardMaterial({color: 0x888888, metalness: 0.8});
            this.mesh.traverse(c => {
                if (c.isMesh && !this.ansBoxes.includes(c)) c.material = armMat;
            });
            this.ansBoxes.forEach(b => b.userData.type = 'armored');
        }
    }

    // Power Ups
    function spawnPowerUp(pos) {
        const types = ['shield', 'freeze', 'fire'];
        const emojis = ['🛡️', '⏱️', '🔥'];
        const colors = [0x00aaff, 0x00ffff, 0xffaa00];
        const idx = Math.floor(qrand()*3);
        
        const box = new THREE.Group();
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial({ color: colors[idx], emissive: colors[idx] }));
        mesh.position.y = 1; box.add(mesh);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: createTextTexture(emojis[idx], "transparent") }));
        sprite.position.y = 2.2; sprite.scale.set(2, 2, 1); box.add(sprite);
        box.position.copy(pos);
        box.position.y = 0;
        box.userData = { type: types[idx], rotSpeed: 0.05 };
        scene.add(box);
        powerups.push(box);
    }

    // ═══════ COMBAT & FLOW ═══════
    function fireBullet() {
        if(bulletPool.length > 0) {
            const b = bulletPool.pop();
            b.position.copy(camera.getWorldPosition(new THREE.Vector3()));
            const dir = new THREE.Vector3();
            camera.getWorldDirection(dir);
            b.userData.velocity = dir.multiplyScalar(2.0);
            b.visible = true;
            activeBullets.push(b);
        }
    }

    function shoot() {
        if (!isLocked || isGameOver || state !== 'playing') return;
        if (ammo <= 0 && !isFever) { playTone('warning'); return; }
        
        if(!isFever) ammo--;
        shotsFired++;
        playTone('shoot');
        updateUI();
        
        const recoilAmt = isZoomed ? 0.05 : 0.2;
        cameraBoom.position.z += recoilAmt; 
        setTimeout(() => { if (cameraBoom) cameraBoom.position.z -= recoilAmt; }, 100);

        fireBullet();

        const raycaster = new THREE.Raycaster();
        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);

        // Mobile aim assist
        if (IS_TOUCH) {
            let bestTarget = null;
            let bestDot = -1;
            titans.forEach(t => t.ansBoxes.forEach(b => {
                const bDir = b.getWorldPosition(new THREE.Vector3()).sub(camera.getWorldPosition(new THREE.Vector3())).normalize();
                const dot = direction.dot(bDir);
                if (dot > Math.cos(15 * Math.PI/180) && dot > bestDot) {
                    bestDot = dot;
                    bestTarget = b;
                }
            }));
            if (bestTarget) {
                direction.copy(bestTarget.getWorldPosition(new THREE.Vector3()).sub(camera.getWorldPosition(new THREE.Vector3())).normalize());
            }
        }

        raycaster.set(camera.getWorldPosition(new THREE.Vector3()), direction);

        let targets = [];
        titans.forEach(t => targets.push(...t.ansBoxes));
        
        const hits = raycaster.intersectObjects(targets);

        if (hits.length > 0) {
            const hit = hits[0].object;
            const enemy = hit.userData.parent;
            
            if (hit.userData.isCorrect || fireAmmoCount > 0) {
                if (fireAmmoCount > 0) fireAmmoCount--;
                
                shotsHit++;
                combo++;
                if (combo > maxCombo) maxCombo = combo;
                
                if (combo >= CFG.COMBO_FEVER_THRESHOLD && !isFever) {
                    activateFever();
                }

                markCollected(enemy.data.n);
                addKillFeed(`✅ ${enemy.data.n} → ${enemy.data.c}`);
                
                let pts = CFG.SCORE[hit.userData.type] || 100;
                if(isFever) pts *= CFG.FEVER_MULTIPLIER;
                score += pts;
                
                if(ksdk && ksdk.sound && ksdk.sound.correct) ksdk.sound.correct();
                flashMessage("ถูกต้อง!", "#2ecc71");
                enemy.takeHit();

            } else {
                combo = 0;
                wrongWords.push(`${enemy.data.n} (ตอบ ${hit.userData.txt})`);
                if(ksdk && ksdk.sound && ksdk.sound.wrong) ksdk.sound.wrong();
                
                if (practiceMode) {
                    showPracticeExplanation(enemy.data);
                } else {
                    flashMessage(`${enemy.data.n} → ต้องใช้ "${enemy.data.c}"`, "#ff7675");
                    takeDamage();
                    score = Math.max(0, score + (CFG.SCORE.wrong || -20));
                }
            }
            updateUI();
            if (vs) vs.report(score, { correct: score });
        }
    }

    function activateFever() {
        isFever = true;
        feverEndTime = performance.now() + (CFG.FEVER_DURATION * 1000);
        flashMessage("FEVER MODE!", "#ff00ff");
        if(ksdk && ksdk.sound && ksdk.sound.correct) ksdk.sound.correct(); // could be fxFlash
        updateUI();
    }

    function takeDamage() {
        if (hasShield) {
            hasShield = false;
            flashMessage("โล่ป้องกันทำงาน!", "#00aaff");
            if(ksdk && ksdk.sound && ksdk.sound.correct) ksdk.sound.correct();
            updateUI();
            return;
        }
        if (practiceMode) return;

        hearts--; 
        if(ksdk && ksdk.sound && ksdk.sound.wrong) ksdk.sound.wrong();
        triggerShake();
        uiLayer.classList.add('damage-effect');
        setTimeout(() => uiLayer.classList.remove('damage-effect'), 200);
        updateUI();
        if (hearts <= 0) endGame();
    }

    // ═══════ WAVES ═══════
    function checkWaveComplete() {
        if (waveTitansKilled >= waveTitansToSpawn) {
            currentWave++;
            const maxW = (CFG.DIFFICULTY && CFG.DIFFICULTY[difficulty]) ? CFG.DIFFICULTY[difficulty].waveCount : 5;
            if (currentWave > maxW) {
                // Game beat!
                endGame(true);
            } else {
                flashMessage(`Wave ${currentWave-1} Complete!`, "#ffff00");
                startWave();
            }
        }
    }

    function startWave() {
        waveTitansKilled = 0;
        waveTitansToSpawn = CFG.WAVE_TITANS[Math.min(currentWave-1, CFG.WAVE_TITANS.length-1)] || 5;
        updateUI();
        
        if (currentWave === 5 || currentWave === 10) {
            new ArmoredTitan();
            waveTitansToSpawn++;
        }
    }

    // ═══════ COLLECTION & PRACTICE ═══════
    function getCollection() {
        try { return JSON.parse(localStorage.getItem(COLLECTION_KEY)) || {}; } 
        catch(e){ return {}; }
    }
    function markCollected(n) {
        let c = getCollection();
        c[n] = true;
        localStorage.setItem(COLLECTION_KEY, JSON.stringify(c));
    }
    
    function renderCollection() {
        if(!collectionGrid) return;
        collectionGrid.innerHTML = '';
        let c = getCollection();
        let total = RAW_DATA.items.length;
        let unlocked = 0;
        RAW_DATA.items.forEach(it => {
            const div = document.createElement('div');
            div.style.padding = "10px";
            div.style.border = "1px solid #ccc";
            div.style.borderRadius = "8px";
            div.style.textAlign = "center";
            if (c[it.n]) {
                div.style.background = "#fff";
                div.innerHTML = `<strong>${it.n}</strong><br><small>${it.c}</small>`;
                unlocked++;
            } else {
                div.style.background = "#eee";
                div.style.color = "#999";
                div.innerHTML = `<strong>???</strong>`;
            }
            collectionGrid.appendChild(div);
        });
        if(collectionProgress) collectionProgress.innerText = `สะสมแล้ว ${unlocked} / ${total}`;
    }

    function showPracticeExplanation(data) {
        if (!explanationPopup) return;
        state = 'practice';
        document.exitPointerLock();
        isLocked = false;
        explanationText.innerHTML = `คำศัพท์: <strong>${data.n}</strong><br>ลักษณะนาม: <strong>${data.c}</strong><br><small>${data.tip || ''}</small>`;
        explanationPopup.style.display = 'block';
        if(ksdk && ksdk.sound && ksdk.sound.speak) {
            ksdk.sound.speak(data.n + " " + data.c, 'th');
        }
    }

    if(explanationClose) {
        explanationClose.addEventListener('click', () => {
            explanationPopup.style.display = 'none';
            state = 'playing';
            document.body.requestPointerLock();
        });
    }

    // ═══════ CONTROLS ═══════
    function handleJump() {
        if (jumpCount < MAX_JUMPS) {
            velocityY = JUMP_FORCE;
            jumpCount++;
            isGrounded = false;
            playTone('jump');
        }
    }

    function onMouseMove(e) {
        if (!isLocked || isGameOver || state !== 'playing') return;
        const sensitivity = isZoomed ? 0.0005 : 0.002;
        yaw -= e.movementX * sensitivity;
        pitch -= e.movementY * sensitivity;
        pitch = Math.max(-Math.PI / 4, Math.min(Math.PI / 6, pitch));
        player.rotation.y = yaw;
        cameraBoom.rotation.x = pitch;
    }

    function bindControls() {
        window.addEventListener('keydown', (e) => {
            keys[e.code] = true;
            if (e.code === 'Space' && isLocked && state === 'playing') handleJump();
        });
        window.addEventListener('keyup', e => keys[e.code] = false);
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) shoot();
            if (e.button === 2 && isLocked && state === 'playing') {
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

        // Mobile touch bindings
        const btnFire = document.getElementById('btn-fire');
        const btnJump = document.getElementById('btn-jump');
        if(btnFire) btnFire.addEventListener('touchstart', (e) => { e.preventDefault(); shoot(); }, {passive:false});
        if(btnJump) btnJump.addEventListener('touchstart', (e) => { e.preventDefault(); if(isLocked) handleJump(); }, {passive:false});
    }

    // ═══════ GAME LOOP ═══════
    function animate() {
        animFrameId = requestAnimationFrame(animate);
        const time = performance.now() / 1000;
        frameCount++;

        if (landscapeWarning && IS_TOUCH) {
            if (window.innerHeight > window.innerWidth) {
                landscapeWarning.style.display = 'flex';
            } else {
                landscapeWarning.style.display = 'none';
            }
        }

        if (state === 'playing' && !practiceMode) {
            const rTime = Math.max(0, gameDuration - Math.floor(time - gameStartTime));
            if(timerDisplay) {
                const m = Math.floor(rTime/60).toString().padStart(2,'0');
                const s = (rTime%60).toString().padStart(2,'0');
                timerDisplay.innerText = `${m}:${s}`;
                if (rTime < 30) timerDisplay.style.color = "red";
                else timerDisplay.style.color = "white";
            }
            if (rTime <= 0) {
                endGame(false);
            }
        } else if (timerDisplay && practiceMode) {
            timerDisplay.innerText = "PRACTICE";
            timerDisplay.style.color = "lightgreen";
        }

        if (isFever && performance.now() > feverEndTime) {
            isFever = false;
            updateUI();
        }

        if (isLocked && state === 'playing') {
            const targetFOV = isZoomed ? 30 : 70;
            camera.fov = THREE.MathUtils.lerp(camera.fov, targetFOV, 0.1);
            camera.updateProjectionMatrix();

            const moveSpeed = 0.25;
            if (keys['KeyW']) player.translateZ(-moveSpeed);
            if (keys['KeyS']) player.translateZ(moveSpeed);
            if (keys['KeyA']) player.translateX(-moveSpeed);
            if (keys['KeyD']) player.translateX(moveSpeed);
            const isMoving = (keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD']);

            velocityY += GRAVITY;
            player.position.y += velocityY;

            if (player.position.y <= 0) { 
                player.position.y = 0; 
                velocityY = 0; 
                isGrounded = true; 
                jumpCount = 0; 
            }
            
            if (isMoving && isGrounded) {
                playerMesh.legL.rotation.x = Math.sin(time * 6) * 0.8;
                playerMesh.legR.rotation.x = Math.sin(time * 6 + Math.PI) * 0.8;
                playerMesh.armL.rotation.x = Math.sin(time * 6 + Math.PI) * 0.8;
                playerMesh.armR.rotation.x = Math.sin(time * 6) * 0.8;
            } else {
                playerMesh.legL.rotation.x = THREE.MathUtils.lerp(playerMesh.legL.rotation.x, 0, 0.1);
                playerMesh.legR.rotation.x = THREE.MathUtils.lerp(playerMesh.legR.rotation.x, 0, 0.1);
                playerMesh.armL.rotation.x = THREE.MathUtils.lerp(playerMesh.armL.rotation.x, 0, 0.1);
                playerMesh.armR.rotation.x = THREE.MathUtils.lerp(playerMesh.armR.rotation.x, 0, 0.1);
            }

            // Spawn enemies based on difficulty
            if (qrand() < 0.01 && titans.length < ((CFG.DIFFICULTY && CFG.DIFFICULTY[difficulty]) ? CFG.DIFFICULTY[difficulty].maxEnemies : 5)) { 
                if (waveTitansKilled + titans.length < waveTitansToSpawn) {
                    new Titan();
                }
            }

            titans.forEach(t => t.update(player.position, time));

            // Bullets
            for(let i=activeBullets.length-1; i>=0; i--) {
                const b = activeBullets[i];
                b.position.add(b.userData.velocity);
                if (b.position.lengthSq() > 10000) {
                    b.visible = false;
                    activeBullets.splice(i, 1);
                    bulletPool.push(b);
                }
            }

            // Powerups
            for(let i=powerups.length-1; i>=0; i--) {
                const p = powerups[i];
                p.rotation.y += p.userData.rotSpeed;
                p.children[0].position.y = 1 + Math.sin(time*4)*0.2;
                if(player.position.distanceTo(p.position) < 2.5) {
                    if(ksdk && ksdk.sound && ksdk.sound.correct) ksdk.sound.correct(); // pickup
                    if(p.userData.type === 'shield') hasShield = true;
                    if(p.userData.type === 'freeze') freezeEndTime = performance.now() + 5000;
                    if(p.userData.type === 'fire') fireAmmoCount = 3;
                    flashMessage("ได้ไอเทมพิเศษ!", "#00ffff");
                    updateUI();
                    scene.remove(p);
                    disposeObject(p);
                    powerups.splice(i, 1);
                }
            }

            // Particles
            for(let i=particles.length-1; i>=0; i--) {
                const p = particles[i];
                p.mesh.position.add(p.v);
                p.v.y -= 0.01;
                p.life -= 0.05;
                if(p.life <= 0) {
                    scene.remove(p.mesh);
                    disposeObject(p.mesh);
                    particles.splice(i, 1);
                }
            }

            // Minimap
            if (frameCount % 5 === 0 && minimapCanvas) {
                const ctx = minimapCanvas.getContext('2d');
                ctx.clearRect(0,0,150,150);
                const cx = 75, cy = 75;
                const scale = 0.5;
                ctx.fillStyle = 'green';
                ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI*2); ctx.fill();
                ctx.fillStyle = 'red';
                titans.forEach(t => {
                    const dx = (t.mesh.position.x - player.position.x)*scale;
                    const dz = (t.mesh.position.z - player.position.z)*scale;
                    if(Math.abs(dx)<75 && Math.abs(dz)<75) {
                        ctx.beginPath(); ctx.arc(cx+dx, cy+dz, 2, 0, Math.PI*2); ctx.fill();
                    }
                });
            }
        }
        
        if (renderer && scene && camera) {
            renderer.render(scene, camera);
        }
    }

    // ═══════ FLOW SCREENS ═══════
    function resetGame() {
        score = 0;
        hearts = practiceMode ? 99 : ((CFG.DIFFICULTY && CFG.DIFFICULTY[difficulty]) ? CFG.DIFFICULTY[difficulty].lives : CFG.LIVES_START);
        ammo = (CFG.DIFFICULTY && CFG.DIFFICULTY[difficulty]) ? CFG.DIFFICULTY[difficulty].ammo : CFG.INITIAL_AMMO;
        isGameOver = false;
        pitch = 0; yaw = 0;
        isZoomed = false;
        velocityY = 0; isGrounded = true; jumpCount = 0;
        combo = 0; maxCombo = 0;
        isFever = false; hasShield = false; freezeEndTime = 0; fireAmmoCount = 0;
        kills = 0; shotsFired = 0; shotsHit = 0; wrongWords = [];
        currentWave = 1;

        titans.forEach(t => { scene.remove(t.mesh); disposeObject(t.mesh); });
        titans = [];
        powerups.forEach(p => { scene.remove(p); disposeObject(p); });
        powerups = [];
        activeBullets.forEach(b => { b.visible = false; bulletPool.push(b); });
        activeBullets = [];

        if (player) {
            player.position.set(0, 0, 0);
            player.rotation.set(0, 0, 0);
        }
        if (cameraBoom) cameraBoom.rotation.set(0, 0, 0);
    }

    function showScreen(el) {
        [blocker, gameOverScreen, leaderboardScreen].forEach(s => { if(s) s.style.display = 'none'; });
        if(el) el.style.display = 'block';
    }

    function startGame(isPractice) {
        practiceMode = isPractice;
        
        // Read categories
        activeCategories = [];
        if(categorySelect) {
            categorySelect.querySelectorAll('input:checked').forEach(cb => {
                activeCategories.push(cb.value);
            });
        }
        
        // Read diff
        if(diffBtns) {
            diffBtns.forEach(btn => {
                if (btn.classList.contains('active')) difficulty = btn.dataset.diff;
            });
        }

        initAudio();
        resetGame();
        updateUI();
        
        gameDuration = (CFG.DIFFICULTY && CFG.DIFFICULTY[difficulty]) ? CFG.DIFFICULTY[difficulty].duration : CFG.GAME_DURATION;
        gameStartTime = performance.now() / 1000;
        
        startWave();

        if (IS_TOUCH) {
            isLocked = true;
            if(blocker) blocker.style.display = 'none';
        } else {
            try { document.body.requestPointerLock(); } catch (e) {}
        }

        if(uiLayer) uiLayer.classList.remove('hidden');
        if(blocker) blocker.style.display = 'none';

        if (ksdk && ksdk.sound && ksdk.sound.bgmStart) {
            ksdk.sound.bgmStart();
        }

        state = 'playing';
    }

    function endGame(win = false) {
        if (state === 'over') return;
        state = 'over';
        isGameOver = true;
        isLocked = false;
        
        try { document.exitPointerLock(); } catch (e) {}

        if (ksdk && ksdk.sound) {
            if(ksdk.sound.bgmStop) ksdk.sound.bgmStop();
            if(ksdk.sound.gameOver) ksdk.sound.gameOver();
        }

        if (statsKills) statsKills.innerText = kills;
        if (statsAccuracy) statsAccuracy.innerText = shotsFired > 0 ? Math.round((shotsHit/shotsFired)*100) + '%' : '0%';
        if (statsComboMax) statsComboMax.innerText = maxCombo;
        if (statsWave) statsWave.innerText = currentWave;
        if (statsWrongWords) {
            const uniqueWrong = [...new Set(wrongWords)];
            statsWrongWords.innerText = uniqueWrong.length > 0 ? uniqueWrong.join(", ") : "-";
        }

        if (!practiceMode) {
            saveScore(score);
            if (vs) vs.finish(score, { correct: score });
            else if (window.KAMPAI) window.KAMPAI.submitScore(score, { mode: 'solo' });
        }

        if(document.getElementById('final-score')) document.getElementById('final-score').innerText = score;
        showScreen(gameOverScreen);
    }

    function stopCameraAndReset() {
        state = 'idle';
        isGameOver = false;
        isLocked = false;
        try { document.exitPointerLock(); } catch (e) {}
    }

    function loadLB() {
        try { return JSON.parse(localStorage.getItem(LB_KEY)) || []; } catch (e) { return []; }
    }
    function saveScore(sc) {
        const name = (ksdk && ksdk.student) ? (ksdk.student.displayName || ksdk.student.name) : 'ผู้เล่น';
        const list = loadLB();
        list.push({ name, score: sc, date: new Date().toISOString() });
        list.sort((a,b) => b.score - a.score);
        localStorage.setItem(LB_KEY, JSON.stringify(list.slice(0, 10)));
    }
    function renderLB() {
        if(!lbList) return;
        lbList.innerHTML = '';
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

    // ═══════ INITIAL LOAD ═══════
    initThree();
    player = new THREE.Group();
    scene.add(player);
    cameraBoom = new THREE.Group();
    player.add(cameraBoom);
    cameraBoom.add(camera);
    camera.position.set(0, 3, 6);

    createPlayerMesh();
    bindControls();
    resetGame();
    animate();

    // ═══════ UI LISTENERS ═══════
    if(startBtn) startBtn.addEventListener('click', () => startGame(false));
    if(practiceBtn) practiceBtn.addEventListener('click', () => startGame(true));
    
    if(diffBtns) {
        diffBtns.forEach(btn => btn.addEventListener('click', () => {
            diffBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        }));
    }

    if(collectionBtn) collectionBtn.addEventListener('click', () => {
        renderCollection();
        showScreen(collectionScreen);
    });
    if(collectionClose) collectionClose.addEventListener('click', () => showScreen(blocker));

    if(nextPlayerBtn) nextPlayerBtn.addEventListener('click', () => {
        stopCameraAndReset();
        showScreen(blocker);
        renderPlayer();
    });

    if(showLbFromStart) showLbFromStart.addEventListener('click', () => { renderLB(); showScreen(leaderboardScreen); });
    if(showLbFromEnd) showLbFromEnd.addEventListener('click', () => { renderLB(); showScreen(leaderboardScreen); });
    if(closeLbBtn) closeLbBtn.addEventListener('click', () => showScreen(state === 'over' ? gameOverScreen : blocker));

})();
