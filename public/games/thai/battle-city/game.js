/**
 * Battle City: Ultimate Pro Engine
 */

// XSS Sanitizer for Leaderboard rendering
function escapeHTML(str) {
    if (!str) return '';
    return str.toString()
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

const Sound = {
    ctx: null,
    init() { 
        if (!this.ctx) {
            try {
                const AudioContextClass = window.AudioContext || window.webkitAudioContext;
                if (AudioContextClass) {
                    this.ctx = new AudioContextClass();
                }
            } catch (e) {
                console.warn('Web Audio API not supported in this environment:', e);
            }
        } 
    },
    play(freq, type, duration, vol = 0.1, slide = true) {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            if (slide) osc.frequency.exponentialRampToValueAtTime(10, this.ctx.currentTime + duration);
            gain.gain.setValueAtTime(vol, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
            osc.connect(gain); 
            gain.connect(this.ctx.destination);
            osc.start(); 
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    },
    shoot() { this.play(800, 'square', 0.1, 0.05); },
    explode() { 
        this.play(150, 'sawtooth', 0.5, 0.2); 
        this.play(60, 'square', 0.6, 0.1); 
    },
    pickup() { 
        this.play(523, 'sine', 0.1, 0.15, false); 
        setTimeout(() => this.play(1046, 'sine', 0.2, 0.15, false), 50); 
    },
    hit() { this.play(200, 'triangle', 0.05, 0.1); },
    downgrade() { 
        this.play(600, 'sine', 0.1, 0.1, true); 
        setTimeout(() => this.play(300, 'sine', 0.2, 0.1, true), 100); 
    },
    freeze() { this.play(150, 'sine', 0.5, 0.2, false); },
    thunder() { 
        this.play(100, 'sawtooth', 0.8, 0.3); 
        this.play(2000, 'square', 0.1, 0.08, false); 
    },
    duelCancel() { this.play(1500, 'sine', 0.05, 0.05); },
    siren() { this.play(400, 'sine', 1.0, 0.05, true); }, 
    start() { 
        this.play(523, 'square', 0.1, 0.08, false); 
        setTimeout(() => this.play(659, 'square', 0.1, 0.08, false), 100); 
        setTimeout(() => this.play(783, 'square', 0.2, 0.08, false), 200); 
    }
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas ? canvas.getContext('2d') : null;

const TILE_SIZE = (window.GAME_CONFIG && window.GAME_CONFIG.TILE_SIZE) ? window.GAME_CONFIG.TILE_SIZE : 60; 
const GRID_SIZE = (window.GAME_CONFIG && window.GAME_CONFIG.GRID_SIZE) ? window.GAME_CONFIG.GRID_SIZE : 13;
const BASE_SPEED = (window.GAME_CONFIG && window.GAME_CONFIG.BASE_SPEED) ? window.GAME_CONFIG.BASE_SPEED : 3.5;

// Game State
let p1 = null, p2 = null;
let playerCount = 1;
let enemies = [];
let bullets = [];
let walls = [];
let items = [];
let explosions = []; 
let grass = [];
let base = null;
let currentStage = 1;
let targetWord = "WIN";
let targetWordTranslation = "ชนะ";
let collectedLetters = [];
let enemiesToKill = 20;
let difficultyLevel = 1;
let gameState = 'START_SCREEN';
let spawnTimer = 0;
let itemSpawnTimer = 0;
let shovelTimer = 0; 
let hiScore = 0;
let shakeTime = 0; 

const keys = {};
if (typeof window !== 'undefined') {
    window.addEventListener('keydown', e => {
        keys[e.code] = true;
        if (e.code === 'KeyR') resetGame();
        if (e.code === 'Space' && gameState === 'PLAYING') p1?.shoot();
        if (['Enter', 'NumpadEnter', 'Slash', 'Period', 'Numpad0', 'Digit0'].includes(e.code) && gameState === 'PLAYING') {
            p2?.shoot();
        }
    });
    window.addEventListener('keyup', e => keys[e.code] = false);
}

function rectIntersect(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x2 < x1 + w1 && x2 + w2 > x1 && y2 < y1 + h1 && y2 + h2 > y1;
}

// --- Visual Effect Classes ---

class Explosion {
    constructor(x, y, isBase = false, isSuper = false) {
        this.x = x; 
        this.y = y; 
        this.particles = []; 
        this.life = isSuper ? 80 : 40;
        const count = isBase ? 60 : (isSuper ? 100 : 25);
        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: 0, 
                y: 0,
                vx: (Math.random() - 0.5) * (isSuper ? 25 : 12),
                vy: (Math.random() - 0.5) * (isSuper ? 25 : 12),
                size: Math.random() * 8 + 4,
                color: ["#ef4444", "#f59e0b", "#ffffff", "#334155"][Math.floor(Math.random() * 4)]
            });
        }
        Sound.explode();
        if (isSuper) shakeTime = 20; 
    }
    update() {
        this.life--;
        this.particles.forEach(p => { 
            p.x += p.vx; 
            p.y += p.vy; 
            p.size *= 0.96; 
        });
    }
    draw() {
        if (!ctx) return;
        ctx.save(); 
        ctx.translate(this.x, this.y);
        this.particles.forEach(p => {
            ctx.fillStyle = p.color; 
            ctx.globalAlpha = Math.max(0, this.life / 40);
            ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        });
        ctx.restore();
    }
}

class Item {
    constructor(x, y, type, letterInfo = null) {
        this.x = x; 
        this.y = y; 
        this.size = 45;
        this.type = type; // 'letter', 'shield', 'star', 'bomb', 'lightning', 'shovel'
        this.letterInfo = letterInfo; // { char: 'A', index: 0 }
        this.active = true; 
        this.life = 600; 
    }
    draw() {
        if (!this.active || !ctx) return;
        this.life--;
        if (this.life <= 0) this.active = false;
        if (this.life < 120 && Math.floor(this.life / 10) % 2 === 0) return;
        
        ctx.save(); 
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        
        ctx.shadowBlur = 10;
        ctx.shadowColor = "white";

        if (this.type === 'letter' && this.letterInfo) {
            ctx.fillStyle = '#f59e0b'; 
            ctx.fillRect(-18, -18, 36, 36);
            ctx.fillStyle = '#000'; 
            ctx.font = 'bold 22px "Press Start 2P", monospace';
            ctx.textAlign = 'center'; 
            ctx.textBaseline = 'middle'; 
            ctx.fillText(this.letterInfo.char, 0, 3);
        } else if (this.type === 'shield') {
            ctx.fillStyle = '#22d3ee'; 
            ctx.beginPath(); 
            ctx.arc(0, 0, 18, 0, Math.PI * 2); 
            ctx.fill();
            ctx.strokeStyle = '#fff'; 
            ctx.lineWidth = 3; 
            ctx.stroke();
        } else if (this.type === 'star') {
            ctx.fillStyle = '#fbbf24'; 
            ctx.beginPath();
            for (let i = 0; i < 5; i++) {
                ctx.lineTo(Math.cos((18 + i * 72) / 180 * Math.PI) * 22, -Math.sin((18 + i * 72) / 180 * Math.PI) * 22);
                ctx.lineTo(Math.cos((54 + i * 72) / 180 * Math.PI) * 10, -Math.sin((54 + i * 72) / 180 * Math.PI) * 10);
            }
            ctx.closePath(); 
            ctx.fill();
        } else if (this.type === 'bomb') {
            ctx.fillStyle = '#f43f5e'; 
            ctx.beginPath(); 
            ctx.arc(0, 0, 20, 0, Math.PI * 2); 
            ctx.fill();
            ctx.fillStyle = '#fff'; 
            ctx.fillRect(-2, -22, 4, 10); 
            ctx.stroke();
        } else if (this.type === 'lightning') {
            ctx.fillStyle = '#facc15'; 
            ctx.beginPath();
            ctx.moveTo(0, -22); 
            ctx.lineTo(-12, 0); 
            ctx.lineTo(4, 0); 
            ctx.lineTo(-8, 22); 
            ctx.lineTo(12, -2); 
            ctx.lineTo(-4, -2); 
            ctx.closePath(); 
            ctx.fill();
        } else if (this.type === 'shovel') {
            ctx.fillStyle = '#94a3b8'; 
            ctx.fillRect(-15, -10, 30, 20);
            ctx.fillStyle = '#475569'; 
            ctx.fillRect(-4, 10, 8, 15);
            ctx.stroke();
        }
        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, dir, owner) {
        this.x = x; 
        this.y = y; 
        this.dir = dir;
        this.owner = owner;
        const scale = (owner.starLevel > 0) ? 2 : 1;
        this.radius = 4.5 * scale;
        this.size = 9 * scale; 
        this.active = true;
    }
    update() {
        const speed = 9;
        if (this.dir === 0) this.y -= speed; 
        else if (this.dir === 1) this.x += speed;
        else if (this.dir === 2) this.y += speed; 
        else if (this.dir === 3) this.x -= speed;

        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) {
            this.active = false;
        }

        for (let other of bullets) {
            if (other === this || !other.active) continue;
            if (rectIntersect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size, other.x - other.size / 2, other.y - other.size / 2, other.size, other.size)) {
                this.active = false; 
                other.active = false; 
                Sound.duelCancel(); 
                return;
            }
        }

        for (let w of walls) {
            if (w.active && rectIntersect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size, w.x, w.y, w.w, w.h)) {
                if (w.type === 2 && this.owner.starLevel < 2) { 
                    this.active = false; 
                    Sound.hit(); 
                    return; 
                }
                this.active = false; 
                w.active = false; 
                Sound.hit(); 
                
                // If this brick wall holds a letter, spawn it!
                if (w.letterInfo) { 
                    items.push(new Item(w.x + 8, w.y + 8, 'letter', w.letterInfo)); 
                } 
                return;
            }
        }

        if (base && base.active && rectIntersect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size, base.x, base.y, base.w, base.h)) {
            this.active = false; 
            base.active = false; 
            explosions.push(new Explosion(base.x + TILE_SIZE / 2, base.y + TILE_SIZE / 2, true)); 
            endGame(false);
        }

        if (this.owner.isPlayer) {
            const otherP = (this.owner === p1) ? p2 : p1;
            if (otherP && otherP.active && rectIntersect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size, otherP.x, otherP.y, otherP.size, otherP.size)) {
                this.active = false; 
                if (otherP.shieldTime > 0) {
                    Sound.hit(); 
                } else { 
                    otherP.freezeTimer = 240; 
                    Sound.freeze(); 
                }
                return;
            }
            
            enemies.forEach(en => {
                if (en.active && rectIntersect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size, en.x, en.y, en.size, en.size)) {
                    this.active = false; 
                    if (en.shieldTime > 0) { 
                        Sound.hit(); 
                        return; 
                    }
                    if (en.starLevel > 0) { 
                        en.starLevel--; 
                        en.flash = 5; 
                        Sound.downgrade(); 
                    } else {
                        en.hp--; 
                        en.flash = 5;
                        if (en.hp <= 0) {
                            en.active = false; 
                            this.owner.score += en.level * 100;
                            explosions.push(new Explosion(en.x + en.size / 2, en.y + en.size / 2, false, en.isBoss));
                            if (Math.random() < 0.25) {
                                items.push(new Item(en.x, en.y, getRandomItemType()));
                            }
                            updateUI();
                        } else {
                            Sound.hit();
                        }
                    }
                }
            });
        } else {
            [p1, p2].forEach(p => {
                if (p && p.active && rectIntersect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size, p.x, p.y, p.size, p.size)) {
                    this.active = false; 
                    if (p.shieldTime > 0) {
                        Sound.hit(); 
                    } else {
                        if (p.starLevel > 0) { 
                            p.starLevel--; 
                            p.flash = 5; 
                            Sound.downgrade(); 
                            updateUI(); 
                        } else {
                            p.destroy();
                        }
                    }
                }
            });
        }
    }
    draw() {
        if (!ctx) return;
        const glow = this.owner.starLevel >= 2;
        ctx.fillStyle = glow ? "#22d3ee" : "#fff"; 
        ctx.shadowBlur = glow ? 15 : 5; 
        ctx.shadowColor = glow ? "cyan" : "white";
        ctx.beginPath(); 
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); 
        ctx.fill(); 
        ctx.shadowBlur = 0;
    }
}

class Tank {
    constructor(x, y, color, playerID, level = 1, isBoss = false, isFast = false) {
        this.x = x; 
        this.y = y; 
        this.size = isBoss ? 90 : 51;
        this.color = color; 
        this.playerID = playerID; 
        this.isPlayer = playerID > 0;
        this.isBoss = isBoss; 
        this.isFast = isFast;
        this.dir = this.isPlayer ? 0 : 2; 
        this.active = true; 
        this.cooldown = 0;
        this.level = level; 
        this.hp = isBoss ? 10 : level; 
        this.maxHp = this.hp;
        this.flash = 0; 
        this.moveSpeed = this.isPlayer ? BASE_SPEED : BASE_SPEED * (isFast ? 1.2 : (0.5 + (level * 0.1)));
        this.shieldTime = 0; 
        this.starLevel = 0; 
        this.score = 0;
        this.respawnTimer = 0; 
        this.freezeTimer = 0; 
        this.stunTimer = 0;
    }
    destroy() { 
        this.active = false; 
        explosions.push(new Explosion(this.x + this.size / 2, this.y + this.size / 2, false, this.isBoss)); 
        this.respawnTimer = 180; 
    }
    update() {
        if (!this.active) {
            if (this.isPlayer && this.respawnTimer > 0) {
                this.respawnTimer--;
                if (this.respawnTimer === 0) {
                    this.active = true; 
                    this.x = (this.playerID === 1 ? 4 : 8) * TILE_SIZE;
                    this.y = 12 * TILE_SIZE; 
                    this.shieldTime = 180; 
                    this.dir = 0; 
                    this.freezeTimer = 0; 
                    this.stunTimer = 0;
                }
            }
            return;
        }
        if (this.freezeTimer > 0) { this.freezeTimer--; return; }
        if (this.stunTimer > 0) { this.stunTimer--; return; }
        if (this.cooldown > 0) this.cooldown--;
        if (this.flash > 0) this.flash--;
        
        if (this.shieldTime > 0) {
            this.shieldTime--;
            if (this.isPlayer) {
                const sBar = document.getElementById(`shieldBar${this.playerID}`); 
                const sUI = document.getElementById(`shieldUI${this.playerID}`);
                if (sBar) sBar.style.width = (this.shieldTime / 600 * 100) + '%';
                if (this.shieldTime <= 0 && sUI) sUI.classList.add('hidden');
            }
        }
        let nX = this.x, nY = this.y, moved = false;
        
        // P1 controls & SDK virtual inputs
        if (this.playerID === 1) {
            let leftInput = keys['KeyA'];
            let rightInput = keys['KeyD'];
            let upInput = keys['KeyW'];
            let downInput = keys['KeyS'];

            if (window.KAMPAI && window.KAMPAI.input) {
                if (window.KAMPAI.input.left) leftInput = true;
                if (window.KAMPAI.input.right) rightInput = true;
                if (window.KAMPAI.input.up) upInput = true;
                if (window.KAMPAI.input.down) downInput = true;
            }

            if (upInput) { this.dir = 0; nY -= this.moveSpeed; moved = true; } 
            else if (rightInput) { this.dir = 1; nX += this.moveSpeed; moved = true; } 
            else if (downInput) { this.dir = 2; nY += this.moveSpeed; moved = true; } 
            else if (leftInput) { this.dir = 3; nX -= this.moveSpeed; moved = true; }
        } else if (this.playerID === 2) {
            if (keys['ArrowUp']) { this.dir = 0; nY -= this.moveSpeed; moved = true; } 
            else if (keys['ArrowRight']) { this.dir = 1; nX += this.moveSpeed; moved = true; } 
            else if (keys['ArrowDown']) { this.dir = 2; nY += this.moveSpeed; moved = true; } 
            else if (keys['ArrowLeft']) { this.dir = 3; nX -= this.moveSpeed; moved = true; }
        } else {
            if (Math.random() < 0.02) this.dir = Math.floor(Math.random() * 4);
            if (this.dir === 0) nY -= this.moveSpeed; 
            else if (this.dir === 1) nX += this.moveSpeed; 
            else if (this.dir === 2) nY += this.moveSpeed; 
            else if (this.dir === 3) nX -= this.moveSpeed;
            moved = true; 
            
            const aiFireChance = this.isBoss ? 0.06 : (0.015 + this.starLevel * 0.01 + difficultyLevel * 0.005);
            if (this.cooldown === 0 && Math.random() < aiFireChance) this.shoot();
        }
        
        if (moved) {
            nX = Math.max(0, Math.min(canvas.width - this.size, nX)); 
            nY = Math.max(0, Math.min(canvas.height - this.size, nY));
            let hit = false;
            for (let w of walls) {
                if (w.active && rectIntersect(nX, nY, this.size, this.size, w.x, w.y, w.w, w.h)) { 
                    hit = true; 
                    break; 
                }
            }
            if (base && base.active && rectIntersect(nX, nY, this.size, this.size, base.x, base.y, base.w, base.h)) {
                hit = true;
            }
            let others = [p1, p2, ...enemies].filter(t => t && t.active && t !== this);
            for (let t of others) {
                if (rectIntersect(nX + 4, nY + 4, this.size - 8, this.size - 8, t.x + 4, t.y + 4, t.size - 8, t.size - 8)) {
                    hit = true;
                }
            }
            if (!hit) { 
                this.x = nX; 
                this.y = nY; 
            } else if (!this.isPlayer) {
                this.dir = Math.floor(Math.random() * 4);
            }
        }
        
        items.forEach(it => {
            if (it.active && rectIntersect(this.x, this.y, this.size, this.size, it.x, it.y, it.size, it.size)) {
                if (it.type === 'letter') { 
                    if (this.isPlayer && it.letterInfo) { 
                        collectedLetters[it.letterInfo.index] = true; 
                        it.active = false; 
                        
                        // play correct sound from SDK or synth
                        if (window.KAMPAI && window.KAMPAI.sound && typeof window.KAMPAI.sound.correct === 'function') {
                            window.KAMPAI.sound.correct();
                        } else {
                            Sound.pickup();
                        }
                        updateUI(); 
                        advanceStageCheck(); 
                    } 
                } else if (it.type === 'bomb') {
                    it.active = false; 
                    if (this.isPlayer) { 
                        enemies.forEach(en => { if (en.active) en.destroy(); }); 
                        shakeTime = 30; 
                    } else { 
                        Sound.siren(); 
                        [p1, p2].forEach(p => { if (p && p.active && p.shieldTime <= 0) p.destroy(); }); 
                    }
                } else if (it.type === 'lightning') {
                    it.active = false; 
                    Sound.thunder();
                    if (this.isPlayer) { 
                        enemies.forEach(en => { if (en.active) en.stunTimer = 300; }); 
                    } else { 
                        [p1, p2].forEach(p => { if (p && p.active) p.stunTimer = 300; }); 
                    }
                } else if (it.type === 'shovel') {
                    it.active = false; 
                    Sound.pickup();
                    if (this.isPlayer) shovelTimer = 600; 
                } else {
                    it.active = false; 
                    Sound.pickup();
                    if (it.type === 'shield') { 
                        this.shieldTime = 600; 
                        if (this.isPlayer) { 
                            const ui = document.getElementById(`shieldUI${this.playerID}`); 
                            if (ui) ui.classList.remove('hidden'); 
                        } 
                    } else if (this.starLevel < 2) { 
                        this.starLevel++; 
                        if (this.isPlayer) updateUI(); 
                    }
                }
            }
        });
    }
    shoot() {
        if (!this.active || this.cooldown > 0 || this.freezeTimer > 0 || this.stunTimer > 0) return;
        let bx = this.x + this.size / 2, by = this.y + this.size / 2;
        if (this.dir === 0) by -= this.size / 2; 
        else if (this.dir === 1) bx += this.size / 2; 
        else if (this.dir === 2) by += this.size / 2; 
        else if (this.dir === 3) bx -= this.size / 2;
        bullets.push(new Bullet(bx, by, this.dir, this));
        this.cooldown = this.isBoss ? 8 : (this.starLevel === 0 ? 30 : (this.starLevel === 1 ? 15 : 10));
        if (this.isPlayer) Sound.shoot();
    }
    draw() {
        if (!this.active || !ctx) return;
        let baseCol;
        if (this.playerID === 1) baseCol = ["#edc21a", "#fbbf24", "#fff"][this.starLevel];
        else if (this.playerID === 2) baseCol = ["#16a34a", "#4ade80", "#fff"][this.starLevel];
        else if (this.isBoss) baseCol = "#ef4444"; 
        else if (this.isFast) baseCol = "#a855f7";
        else baseCol = (this.starLevel > 0) ? ["#9ca3af", "#6366f1", "#ec4899"][this.starLevel] : this.color;
        
        const visualScale = this.isBoss ? 1.0 : (1 + (this.starLevel * 0.15));
        ctx.save(); 
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        
        // Effects
        if (this.shieldTime > 0) { 
            ctx.strokeStyle = this.isPlayer ? (this.playerID === 1 ? '#fbbf24' : '#22d3ee') : '#ef4444'; 
            ctx.lineWidth = 4; 
            ctx.setLineDash([8, 6]); 
            ctx.beginPath(); 
            ctx.arc(0, 0, (this.size / 2 + 10) * visualScale, 0, Math.PI * 2); 
            ctx.stroke(); 
            ctx.setLineDash([]); 
        }
        if (this.freezeTimer > 0) { 
            ctx.fillStyle = "rgba(103, 232, 249, 0.6)"; 
            const fSize = (this.size + 10) * visualScale; 
            ctx.fillRect(-fSize / 2, -fSize / 2, fSize, fSize); 
            ctx.strokeStyle = "#06b6d4"; 
            ctx.lineWidth = 3; 
            ctx.strokeRect(-fSize / 2, -fSize / 2, fSize, fSize); 
        }
        if (this.stunTimer > 0) { 
            ctx.strokeStyle = "#facc15"; 
            ctx.lineWidth = 5; 
            ctx.beginPath(); 
            ctx.arc(0, 0, (this.size / 2 + 15) * visualScale, 0, Math.PI * 2); 
            ctx.stroke(); 
        }
        
        // Boss HP Bar
        if (this.isBoss) {
            const barW = 80;
            ctx.fillStyle = "rgba(0,0,0,0.5)"; 
            ctx.fillRect(-barW / 2, -this.size / 2 - 20, barW, 6);
            ctx.fillStyle = "#ef4444"; 
            ctx.fillRect(-barW / 2, -this.size / 2 - 20, barW * (this.hp / this.maxHp), 6);
        }

        ctx.rotate(this.dir * 90 * Math.PI / 180); 
        ctx.scale(visualScale, visualScale);
        const s = this.size / visualScale; 
        const mainColor = this.flash > 0 ? "#fff" : baseCol;
        
        ctx.fillStyle = "#555"; 
        ctx.fillRect(-s / 2, -s / 2, 10, s); 
        ctx.fillRect(s / 2 - 10, -s / 2, 10, s); 
        ctx.fillStyle = "#222";
        for (let i = -s / 2 + 4; i < s / 2; i += 10) { 
            ctx.fillRect(-s / 2, i, 10, 2); 
            ctx.fillRect(s / 2 - 10, i, 10, 2); 
        }
        ctx.fillStyle = mainColor; 
        ctx.fillRect(-s / 2 + 10, -s / 2 + 6, s - 20, s - 12);
        
        // Cannon
        ctx.fillStyle = this.starLevel >= 2 || this.isBoss ? "#22d3ee" : "#888"; 
        ctx.fillRect(-5, -s / 2 - 8, 10, 25);
        
        // Hatch
        ctx.fillStyle = mainColor; 
        ctx.shadowBlur = 4; 
        ctx.shadowColor = "black"; 
        ctx.beginPath(); 
        ctx.rect(-s / 4, -s / 4, s / 2, s / 2); 
        ctx.fill(); 
        ctx.shadowBlur = 0;
        
        ctx.restore();
    }
}

// --- Logic ---

function getRandomItemType() {
    const r = Math.random();
    if (r < 0.12) return 'bomb';
    if (r < 0.24) return 'lightning';
    if (r < 0.36) return 'shovel';
    if (r < 0.65) return 'shield';
    return 'star';
}

function initLevel() {
    if (!window.GAME_DATA) return;
    
    // Resolve dynamic word for spelling
    const wordIndex = (currentStage - 1) % window.GAME_DATA.words.length;
    const wordObj = window.GAME_DATA.words[wordIndex];
    targetWord = wordObj.word;
    targetWordTranslation = wordObj.translation;
    
    collectedLetters = Array(targetWord.length).fill(false);
    
    let layoutsList = window.GAME_DATA.layouts || [];
    let layout = layoutsList[(currentStage - 1) % layoutsList.length];
    
    walls = []; 
    enemies = []; 
    bullets = []; 
    items = []; 
    explosions = []; 
    grass = [];
    enemiesToKill = (window.GAME_CONFIG && window.GAME_CONFIG.ENEMIES_PER_STAGE) ? window.GAME_CONFIG.ENEMIES_PER_STAGE : 20; 
    spawnTimer = 0; 
    shovelTimer = 0;
    
    let brickWalls = [];
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            let v = layout[r][c]; 
            let x = c * TILE_SIZE; 
            let y = r * TILE_SIZE;
            if (v === 1 || v === 2) { 
                let w = { x, y, w: TILE_SIZE, h: TILE_SIZE, type: v, active: true, letterInfo: null }; 
                walls.push(w); 
                if (v === 1) brickWalls.push(w); 
            } 
            else if (v === 9) {
                base = { x, y, w: TILE_SIZE, h: TILE_SIZE, active: true };
            }
            
            if (v === 0) { 
                const isS = (r > 10 && (c < 2 || c > 10)) || (r < 2); 
                if (!isS && Math.random() < 0.15) {
                    grass.push({ x, y, w: TILE_SIZE, h: TILE_SIZE }); 
                }
            }
        }
    }
    
    // Distribute characters of targetWord into random brick walls
    const chars = targetWord.split('');
    chars.forEach((char, index) => {
        if (brickWalls.length > 0) {
            let idx = Math.floor(Math.random() * brickWalls.length);
            brickWalls[idx].letterInfo = { char, index };
            brickWalls.splice(idx, 1);
        }
    });

    p1 = new Tank(4 * TILE_SIZE, 12 * TILE_SIZE, "#edc21a", 1);
    p2 = (playerCount === 2) ? new Tank(8 * TILE_SIZE, 12 * TILE_SIZE, "#16a34a", 2) : null;
    
    updateSpellingUI();
    updateUI();
}

function updateSpellingUI() {
    const container = document.getElementById('slotsContainer');
    if (container) {
        container.innerHTML = '';
        for (let i = 0; i < targetWord.length; i++) {
            const char = targetWord[i];
            const slot = document.createElement('div');
            slot.id = `slot-${i}`;
            slot.className = 'letter-slot';
            slot.innerText = char;
            if (collectedLetters[i]) {
                slot.classList.add('letter-active');
            }
            container.appendChild(slot);
        }
    }
    const hint = document.getElementById('wordHint');
    if (hint) {
        hint.innerText = `${targetWord} (${targetWordTranslation})`;
    }
}

function updateUI() {
    if (p1) { 
        const s1 = document.getElementById('score1');
        if (s1) s1.innerText = p1.score.toString().padStart(4, '0'); 
        const st1 = document.getElementById('star1');
        if (st1) st1.innerText = p1.starLevel; 
        hiScore = Math.max(hiScore, p1.score); 
    }
    if (p2) { 
        const s2 = document.getElementById('score2');
        if (s2) s2.innerText = p2.score.toString().padStart(4, '0'); 
        const st2 = document.getElementById('star2');
        if (st2) st2.innerText = p2.starLevel; 
        hiScore = Math.max(hiScore, p2.score); 
    }
    const hs = document.getElementById('hiScore');
    if (hs) hs.innerText = hiScore.toString().padStart(4, '0');
    
    const p2Stats = document.getElementById('p2Stats');
    if (playerCount === 2 && p2) { 
        if (p2Stats) p2Stats.style.opacity = "1"; 
    } else {
        if (p2Stats) p2Stats.style.opacity = "0";
    }
    
    const sd = document.getElementById('stageDisplay');
    if (sd) sd.innerText = currentStage; 
    const ec = document.getElementById('enemyCount');
    if (ec) ec.innerText = Math.max(0, enemiesToKill);
    
    updateSpellingUI();
}

function spawnEnemy() {
    if (enemiesToKill <= 0 || enemies.filter(e => e.active).length >= 4) return;
    const pts = [{ x: 0, y: 0 }, { x: 6 * TILE_SIZE, y: 0 }, { x: 12 * TILE_SIZE, y: 0 }];
    let pt = pts[Math.floor(Math.random() * 3)];
    if ([p1, p2, ...enemies].some(t => t && t.active && rectIntersect(pt.x, pt.y, TILE_SIZE, TILE_SIZE, t.x, t.y, t.size, t.size))) return;
    let isBoss = (enemiesToKill === 1); 
    let isF = !isBoss && Math.random() < 0.35; 
    let lv = isBoss ? 5 : (Math.random() > 0.7 ? 3 : 1);
    enemies.push(new Tank(pt.x, pt.y, isF ? "#a855f7" : "#9ca3af", 0, lv, isBoss, isF));
    enemiesToKill--; 
    updateUI();
}

function advanceStage() { 
    currentStage++; 
    difficultyLevel += 0.5; 
    
    // play stage clear sound
    if (window.KAMPAI && window.KAMPAI.sound && typeof window.KAMPAI.sound.correct === 'function') {
        window.KAMPAI.sound.correct();
    } else {
        Sound.pickup();
    }
    initLevel(); 
}

function advanceStageCheck() { 
    // Check if all letters are collected
    const allCollected = collectedLetters.every(val => val === true);
    if (allCollected) {
        advanceStage(); 
    }
}

function handleStart(count) { 
    playerCount = count; 
    Sound.init(); 
    Sound.start(); 
    resetGame(); 
}

function resetGame() { 
    currentStage = 1; 
    difficultyLevel = 1; 
    gameState = 'PLAYING'; 
    
    const overlay = document.getElementById('start-screen');
    if (overlay) overlay.classList.add('hidden');
    const goScreen = document.getElementById('game-over-screen');
    if (goScreen) goScreen.classList.add('hidden');
    const lbScreen = document.getElementById('leaderboard-screen');
    if (lbScreen) lbScreen.classList.add('hidden');

    if (window.KAMPAI && window.KAMPAI.controls) {
        window.KAMPAI.controls.mount({
            dpad: true,
            buttons: [
                { label: 'FIRE', key: 'Space', color: '#ff4444' }
            ]
        });
    }

    initLevel(); 
}

function endGame(win) { 
    gameState = win ? 'VICTORY' : 'GAME_OVER'; 
    const goScreen = document.getElementById('game-over-screen');
    if (goScreen) goScreen.classList.remove('hidden');
    
    const oTitle = document.getElementById('overlayTitle');
    if (oTitle) oTitle.innerText = win ? 'VICTORY!' : 'GAME OVER!';
    
    const f1 = document.getElementById('final-score-p1');
    if (f1 && p1) f1.innerText = p1.score;
    
    const f2Line = document.getElementById('final-p2-line');
    const f2 = document.getElementById('final-score-p2');
    if (playerCount === 2 && p2) {
        if (f2Line) f2Line.style.display = 'block';
        if (f2) f2.innerText = p2.score;
    } else {
        if (f2Line) f2Line.style.display = 'none';
    }

    let finalScore = p1 ? p1.score : 0;
    let winnerText = "";
    if (playerCount === 2 && p2) {
        if (p1.score > p2.score) {
            winnerText = "P1 WINS!";
            finalScore = p1.score;
        } else if (p2.score > p1.score) {
            winnerText = "P2 WINS!";
            finalScore = p2.score;
        } else {
            winnerText = "DRAW!";
        }
    }
    const winText = document.getElementById('winner-text');
    if (winText) winText.innerText = winnerText;

    // Submit to SDK
    if (window.KAMPAI) {
        window.KAMPAI.submitScore(finalScore, {
            mode: 'normal'
        });
    }

    // LocalStorage fallback
    try {
        let localData = [];
        const local = localStorage.getItem('battle_city_leaderboard');
        if (local) localData = JSON.parse(local);
        const name = (window.KAMPAI && window.KAMPAI.student) ? window.KAMPAI.student.name : (playerCount === 2 ? 'Co-op Teams' : 'Commander');
        localData.push({ name: name, score: finalScore });
        localData.sort((a, b) => b.score - a.score);
        localStorage.setItem('battle_city_leaderboard', JSON.stringify(localData.slice(0, 10)));
    } catch (e) {
        console.error(e);
    }
}

function showLeaderboard() {
    gameState = 'LEADERBOARD';
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    document.getElementById('leaderboard-screen').classList.remove('hidden');

    const tbody = document.getElementById('lb-table-body');
    if (tbody) {
        tbody.innerHTML = '';
        
        let list = [];
        if (window.KAMPAI && window.KAMPAI.leaderboard && window.KAMPAI.leaderboard.length > 0) {
            list = window.KAMPAI.leaderboard.slice(0, 5);
        } else {
            try {
                const local = localStorage.getItem('battle_city_leaderboard');
                if (local) list = JSON.parse(local).slice(0, 5);
            } catch (e) {
                console.error(e);
            }
        }
        
        if (list.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#888;">ไม่มีข้อมูลอันดับ</td></tr>';
        } else {
            list.forEach((row, idx) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td style="color: gold; font-weight:bold;">#${idx + 1}</td>
                    <td>${escapeHTML(row.name || row.student?.name || 'Racer')}</td>
                    <td style="color: #f59e0b; font-weight:bold;">${Math.floor(row.score)}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    }
}

function update() {
    if (gameState !== 'PLAYING') return;
    if (p1) p1.update(); 
    if (p2) p2.update();
    
    bullets.forEach(b => b.update()); 
    bullets = bullets.filter(b => b.active);
    
    enemies.forEach(en => en.update());
    
    // Shovel protection timer
    if (shovelTimer > 0) {
        shovelTimer--;
        const baseArea = [{ r: 11, c: 5 }, { r: 11, c: 6 }, { r: 11, c: 7 }, { r: 12, c: 5 }, { r: 12, c: 7 }];
        walls.forEach(w => {
            baseArea.forEach(pos => {
                if (w.x === pos.c * TILE_SIZE && w.y === pos.r * TILE_SIZE) {
                    w.type = (shovelTimer > 0) ? 2 : 1;
                }
            });
        });
    }

    if (shakeTime > 0) shakeTime--;
    
    if (enemiesToKill === 0 && enemies.filter(en => en.active).length === 0) {
        advanceStage();
    }
    
    spawnTimer++; 
    if (spawnTimer >= Math.max(30, 120 - difficultyLevel * 10)) { 
        spawnEnemy(); 
        spawnTimer = 0; 
    }
    
    itemSpawnTimer++; 
    if (itemSpawnTimer >= 250) { 
        let x = Math.floor(Math.random() * (GRID_SIZE - 2) + 1) * TILE_SIZE; 
        let y = Math.floor(Math.random() * (GRID_SIZE - 2) + 1) * TILE_SIZE; 
        items.push(new Item(x + 8, y + 8, getRandomItemType())); 
        itemSpawnTimer = 0; 
    }
}

function draw() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    if (shakeTime > 0) {
        ctx.translate((Math.random() - 0.5) * 10, (Math.random() - 0.5) * 10); 
    }

    walls.forEach(w => { 
        if (!w.active) return; 
        ctx.fillStyle = w.type === 1 ? "#8b4513" : "#64748b"; 
        ctx.fillRect(w.x + 2, w.y + 2, w.w - 4, w.h - 4); 
    });
    
    if (base && base.active) { 
        ctx.fillStyle = "#fff"; 
        ctx.beginPath(); 
        ctx.moveTo(base.x + 30, base.y + 7.5); 
        ctx.lineTo(base.x + 52.5, base.y + 52.5); 
        ctx.lineTo(base.x + 7.5, base.y + 52.5); 
        ctx.closePath(); 
        ctx.fill(); 
        ctx.fillStyle = "#f00"; 
        ctx.fillRect(base.x + 22.5, base.y + 30, 15, 15); 
    } else if (base) { 
        ctx.fillStyle = "#333"; 
        ctx.fillRect(base.x, base.y, base.w, base.h); 
        ctx.fillStyle = "#f00"; 
        ctx.font = "30px Arial"; 
        ctx.fillText("X", base.x + 15, base.y + 45); 
    }
    
    items.forEach(i => i.draw()); 
    if (p1) p1.draw(); 
    if (p2) p2.draw();
    
    enemies.forEach(en => en.draw()); 
    bullets.forEach(b => b.draw()); 
    explosions.forEach(exp => exp.draw());
    
    grass.forEach(g => { 
        ctx.fillStyle = "rgba(34, 197, 94, 0.75)"; 
        const p = 5; 
        ctx.fillRect(g.x + p, g.y + p, g.w - p * 2, g.h - p * 2); 
    });
    
    ctx.restore();
}

function loop() { 
    update(); 
    draw(); 
    requestAnimationFrame(loop); 
}

// Connect HUD elements on setup
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        const btn1p = document.getElementById('btn-1p');
        if (btn1p) btn1p.onclick = () => handleStart(1);
        const btn2p = document.getElementById('btn-2p');
        if (btn2p) btn2p.onclick = () => handleStart(2);
        
        const btnLeaderboard = document.getElementById('btn-leaderboard');
        if (btnLeaderboard) btnLeaderboard.onclick = () => showLeaderboard();
        
        const closeLbBtn = document.getElementById('close-lb-btn');
        if (closeLbBtn) {
            closeLbBtn.onclick = () => {
                document.getElementById('leaderboard-screen').classList.add('hidden');
                document.getElementById('start-screen').classList.remove('hidden');
            };
        }
        
        const btnExit = document.getElementById('btn-exit');
        if (btnExit) {
            btnExit.onclick = () => {
                if (window.KAMPAI) window.KAMPAI.goHome();
            };
        }
        
        const restartBtn = document.getElementById('restart-btn');
        if (restartBtn) {
            restartBtn.onclick = () => {
                document.getElementById('game-over-screen').classList.add('hidden');
                document.getElementById('start-screen').classList.remove('hidden');
            };
        }
    });
}

// Bind SDK Ready
if (window.KAMPAI) {
    window.KAMPAI.onReady((k) => {
        if (k.student) {
            const pc = document.getElementById('player-chip');
            if (pc) pc.innerText = `👤 ${k.student.name}`;
        }
        if (k.stats) {
            const best = document.getElementById('ms-best');
            if (best) best.innerText = k.stats.bestScore || 0;
            const plays = document.getElementById('ms-plays');
            if (plays) plays.innerText = k.stats.plays || 0;
        }
    });
}

// Kickstart animation loop
if (canvas) {
    loop();
}
