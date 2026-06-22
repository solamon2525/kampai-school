// Math Racer Game Engine
let customCarImage = null;

// Safe wrapper for DOM content loading for custom car upload
try {
    if (typeof window !== 'undefined') {
        window.addEventListener('DOMContentLoaded', () => {
            const uploadInput = document.getElementById('car-upload');
            const uploadText = document.getElementById('upload-text');
            const uploadLabel = document.getElementById('upload-label');
            
            if (uploadInput && typeof FileReader !== 'undefined') {
                uploadInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            const img = new Image();
                            img.onload = () => {
                                customCarImage = img;
                                if (uploadText) uploadText.innerText = '✅ โหลดภาพรถสำเร็จแล้ว!';
                                if (uploadLabel) uploadLabel.style.background = '#2ecc71';
                            };
                            img.src = event.target.result;
                        };
                        reader.readAsDataURL(file);
                    }
                });
            }
        });
    }
} catch (e) {
    console.warn('FileReader not supported or custom car upload error:', e);
}

// Global drawing helper to avoid roundRect crash in older browsers or JSDOM environments
function drawRoundRect(ctx, x, y, w, h, r) {
    if (!ctx) return;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(x, y, w, h, r);
    } else {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }
}

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

// Thai Number Translator Helper
function numberToThaiWords(num) {
    if (num === 0) return 'ศูนย์';
    const units = ['', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
    let words = '';
    
    if (num >= 100) {
        const hundreds = Math.floor(num / 100);
        words += units[hundreds] + 'ร้อย';
        num %= 100;
    }
    if (num >= 10) {
        const tens = Math.floor(num / 10);
        if (tens === 1) {
            words += 'สิบ';
        } else if (tens === 2) {
            words += 'ยี่สิบ';
        } else {
            words += units[tens] + 'สิบ';
        }
        num %= 10;
    }
    if (num > 0) {
        if (num === 1 && words.length > 0) {
            words += 'เอ็ด';
        } else {
            words += units[num];
        }
    }
    return words;
}

class SoundManager {
    constructor() {
        this.ctx = null;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                this.ctx = new AudioContextClass();
                this.masterGain = this.ctx.createGain();
                this.masterGain.connect(this.ctx.destination);
                this.bgmGain = this.ctx.createGain();
                this.bgmGain.gain.value = 0.3;
                this.bgmGain.connect(this.masterGain);
            }
        } catch (e) {
            console.warn('Web Audio API not supported in this environment:', e);
        }
        
        this.muted = false;
        this.isPlayingMusic = false;
        this.tempo = (window.GAME_DATA && window.GAME_DATA.audioPresets) ? window.GAME_DATA.audioPresets.tempo : 130;
    }

    toggleMute() {
        this.muted = !this.muted;
        if (!this.masterGain) return this.muted ? "🔇" : "🔊";
        if (this.muted) {
            this.masterGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.1);
            return "🔇";
        } else {
            this.masterGain.gain.setTargetAtTime(1, this.ctx.currentTime, 0.1);
            return "🔊";
        }
    }

    resume() { 
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    startBGM() {
        if (window.KAMPAI && window.KAMPAI.sound && typeof window.KAMPAI.sound.bgmStart === 'function') {
            window.KAMPAI.sound.bgmStart();
            return;
        }
        if (!this.ctx || this.isPlayingMusic) return;
        this.isPlayingMusic = true;
        this.nextNoteTime = this.ctx.currentTime + 0.1;
        this.beatCount = 0;
        this.scheduler();
    }

    stopBGM() {
        if (window.KAMPAI && window.KAMPAI.sound && typeof window.KAMPAI.sound.bgmStop === 'function') {
            window.KAMPAI.sound.bgmStop();
            return;
        }
        this.isPlayingMusic = false;
        if (this.timerID) clearTimeout(this.timerID);
    }

    scheduler() {
        if (!this.isPlayingMusic) return;
        while (this.nextNoteTime < this.ctx.currentTime + 0.1) {
            this.playBeat(this.nextNoteTime, this.beatCount);
            this.nextNoteTime += 0.25 * (60.0 / this.tempo); 
            this.beatCount++;
        }
        this.timerID = setTimeout(() => this.scheduler(), 25);
    }

    playBeat(time, beat) {
        if (this.muted) return;
        const step = beat % 16;
        if (step % 4 === 0) this.synthKick(time);
        if (step % 2 !== 0) this.synthHiHat(time, step % 4 === 2 ? 0.2 : 0.05);
        let freq = 110; 
        if (step < 4) freq = 65.41; 
        else if (step < 8) freq = 98.00; 
        else if (step < 12) freq = 58.27; 
        else freq = 87.31; 
        if (step % 2 === 0) this.synthBass(time, freq);
    }

    synthKick(time) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator(); 
        const gain = this.ctx.createGain();
        osc.connect(gain); 
        gain.connect(this.bgmGain);
        osc.frequency.setValueAtTime(150, time); 
        osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
        gain.gain.setValueAtTime(0.6, time); 
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);
        osc.start(time); 
        osc.stop(time + 0.5);
    }

    synthHiHat(time, vol) {
        if (!this.ctx) return;
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.1, this.ctx.sampleRate);
        const data = buffer.getChannelData(0); 
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource(); 
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter(); 
        filter.type = 'highpass'; 
        filter.frequency.value = 5000;
        const gain = this.ctx.createGain(); 
        gain.gain.setValueAtTime(vol, time); 
        gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);
        noise.connect(filter); 
        filter.connect(gain); 
        gain.connect(this.bgmGain); 
        noise.start(time);
    }

    synthBass(time, freq) {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator(); 
        const gain = this.ctx.createGain(); 
        const filter = this.ctx.createBiquadFilter();
        osc.type = 'sawtooth'; 
        osc.frequency.value = freq;
        filter.type = 'lowpass'; 
        filter.frequency.setValueAtTime(freq * 2, time); 
        filter.frequency.linearRampToValueAtTime(freq * 0.5, time + 0.2);
        gain.gain.setValueAtTime(0.3, time); 
        gain.gain.linearRampToValueAtTime(0, time + 0.2);
        osc.connect(filter); 
        filter.connect(gain); 
        gain.connect(this.bgmGain); 
        osc.start(time); 
        osc.stop(time + 0.2);
    }

    playCoin() { 
        if (window.KAMPAI && window.KAMPAI.sound && typeof window.KAMPAI.sound.correct === 'function') {
            window.KAMPAI.sound.correct();
            return;
        }
        this.playTone('sine', 1200, 2000, 0.1); 
    }

    playWrong() {
        if (window.KAMPAI && window.KAMPAI.sound && typeof window.KAMPAI.sound.wrong === 'function') {
            window.KAMPAI.sound.wrong();
            return;
        }
        this.playTone('square', 150, 50, 0.2);
    }

    playCrash() { 
        if (window.KAMPAI && window.KAMPAI.sound && typeof window.KAMPAI.sound.gameOver === 'function') {
            window.KAMPAI.sound.gameOver();
            return;
        }
        this.playNoise(1000, 100, 0.5); 
    }

    playShield() { this.playTone('triangle', 200, 600, 0.3, 'linear'); }
    playBoost() { this.playTone('sawtooth', 100, 300, 0.5, 'linear'); }
    playShieldBreak() { this.playTone('square', 250, 80, 0.25); }
    playHorn() { this.playTone('sawtooth', 150, 150, 0.6, 'linear'); } 

    playTone(type, fStart, fEnd, duration, rampType = 'exponential') {
        if (this.muted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const osc = this.ctx.createOscillator(); 
        const gain = this.ctx.createGain();
        osc.connect(gain); 
        gain.connect(this.masterGain);
        osc.type = type; 
        osc.frequency.setValueAtTime(fStart, t);
        if (rampType === 'linear') osc.frequency.linearRampToValueAtTime(fEnd, t + duration);
        else osc.frequency.exponentialRampToValueAtTime(fEnd, t + duration);
        gain.gain.setValueAtTime(0.15, t);
        if (rampType === 'linear') gain.gain.linearRampToValueAtTime(0.01, t + duration);
        else gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
        osc.start(t); 
        osc.stop(t + duration);
    }

    playNoise(fStart, fEnd, duration) {
        if (this.muted || !this.ctx) return;
        const t = this.ctx.currentTime;
        const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
        const data = buffer.getChannelData(0); 
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        const noise = this.ctx.createBufferSource(); 
        noise.buffer = buffer;
        const filter = this.ctx.createBiquadFilter(); 
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(fStart, t); 
        filter.frequency.exponentialRampToValueAtTime(fEnd, t + duration);
        const gain = this.ctx.createGain(); 
        gain.gain.setValueAtTime(0.5, t); 
        gain.gain.exponentialRampToValueAtTime(0.01, t + duration);
        noise.connect(filter); 
        filter.connect(gain); 
        gain.connect(this.masterGain); 
        noise.start(t);
    }
}

class InputHandler {
    constructor() {
        this.keys = { 
            ArrowLeft: false, ArrowRight: false, ArrowUp: false, ArrowDown: false, 
            KeyA: false, KeyD: false, KeyW: false, KeyS: false             
        };
        if (typeof window !== 'undefined') {
            window.addEventListener('keydown', (e) => { 
                if (this.keys.hasOwnProperty(e.code)) this.keys[e.code] = true; 
            });
            window.addEventListener('keyup', (e) => { 
                if (this.keys.hasOwnProperty(e.code)) this.keys[e.code] = false; 
            });
            
            this.touchX = null;
            window.addEventListener('touchstart', (e) => { 
                this.touchX = e.touches[0].clientX; 
            });
            window.addEventListener('touchmove', (e) => { 
                this.touchX = e.touches[0].clientX; 
            });
            window.addEventListener('touchend', () => { 
                this.touchX = null; 
            });
        }
    }

    getP1Input() {
        let x = 0;
        if (this.keys.ArrowLeft) x = -1;
        if (this.keys.ArrowRight) x = 1;
        
        // Merge SDK Input support
        if (window.KAMPAI && window.KAMPAI.input) {
            if (window.KAMPAI.input.left) x = -1;
            if (window.KAMPAI.input.right) x = 1;
        }
        
        if (this.touchX !== null) {
            x = this.touchX < window.innerWidth / 2 ? -1 : 1;
        }
        
        let y = 0;
        if (this.keys.ArrowUp) y = -1;
        if (this.keys.ArrowDown) y = 1;
        
        if (window.KAMPAI && window.KAMPAI.input) {
            if (window.KAMPAI.input.up) y = -1;
            if (window.KAMPAI.input.down) y = 1;
        }
        
        return { x, y };
    }

    getP2Input() {
        let x = 0;
        if (this.keys.KeyA) x = -1;
        if (this.keys.KeyD) x = 1;
        
        let y = 0;
        if (this.keys.KeyW) y = -1;
        if (this.keys.KeyS) y = 1;
        
        return { x, y };
    }
}

class Road {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        this.lineOffset = 0;
        this.roadWidth = 320; 
        this.speed = 10;
    }

    update(speedMultiplier) {
        this.lineOffset += this.speed * speedMultiplier;
        if (this.lineOffset >= 40) this.lineOffset = 0;
    }

    draw(ctx) {
        if (!ctx) return;
        ctx.fillStyle = "#1e3d22";
        ctx.fillRect(0, 0, this.width, this.height);

        const roadX = (this.width - this.roadWidth) / 2;

        ctx.fillStyle = "#333333";
        ctx.fillRect(roadX - 10, 0, this.roadWidth + 20, this.height);

        ctx.fillStyle = "#262626";
        ctx.fillRect(roadX, 0, this.roadWidth, this.height);

        ctx.fillStyle = "#66fcf1";
        ctx.fillRect(roadX, 0, 4, this.height);
        ctx.fillRect(roadX + this.roadWidth - 4, 0, 4, this.height);

        ctx.strokeStyle = "rgba(102, 252, 241, 0.4)";
        ctx.lineWidth = 2;
        ctx.setLineDash([20, 30]);
        ctx.lineDashOffset = -this.lineOffset;
        ctx.beginPath();
        ctx.moveTo(this.width / 2, -50);
        ctx.lineTo(this.width / 2, this.height + 50);
        ctx.stroke();
    }
}

class PlayerCar {
    constructor(id, roadCenter, yPosition, colorType) {
        this.id = id; 
        this.width = 30; 
        this.height = 50;
        this.x = roadCenter - this.width / 2;
        
        if (id === 'p1') this.x += 30;
        if (id === 'p2') this.x -= 30;

        this.y = yPosition;
        this.baseSpeed = 6;
        this.roadWidth = 320;
        
        this.colorType = colorType; 
        
        this.isDead = false;
        this.score = 0;
        this.lives = (window.GAME_CONFIG && window.GAME_CONFIG.LIVES) ? window.GAME_CONFIG.LIVES : 3;
        this.hasShield = false;
        this.isBoosting = false;
        this.boostTimer = 0;
        this.invulnTimer = 0;
    }

    update(input, canvasWidth, canvasHeight, deltaTime) {
        if (this.isDead) return;

        let speed = this.baseSpeed;
        if (this.isBoosting) speed *= 1.5;

        this.x += input.x * speed;
        const roadLeft = (canvasWidth - this.roadWidth) / 2;
        const roadRight = (canvasWidth + this.roadWidth) / 2;
        if (this.x < roadLeft + 5) this.x = roadLeft + 5;
        if (this.x + this.width > roadRight - 5) this.x = roadRight - this.width - 5;

        this.y += input.y * speed;
        if (this.y < 80) this.y = 80;
        if (this.y > canvasHeight - this.height - 10) this.y = canvasHeight - this.height - 10;

        if (this.isBoosting) {
            this.boostTimer -= deltaTime;
            if (this.boostTimer <= 0) {
                this.isBoosting = false;
                this.updateStatusIcon('boost', false);
            }
        }

        if (this.invulnTimer > 0) {
            this.invulnTimer -= deltaTime;
        }
    }

    activateBoost() {
        this.isBoosting = true;
        this.boostTimer = 3000;
        this.updateStatusIcon('boost', true);
    }

    activateShield() {
        this.hasShield = true;
        this.updateStatusIcon('shield', true);
    }

    breakShield() {
        this.hasShield = false;
        this.updateStatusIcon('shield', false);
    }

    updateStatusIcon(type, active) {
        const el = document.getElementById(`status-${type}-${this.id}`);
        if (el) {
            if (active) el.classList.add('active');
            else el.classList.remove('active');
        }
    }

    die() {
        this.isDead = true;
        this.updateStatusIcon('shield', false);
        this.updateStatusIcon('boost', false);
    }

    draw(ctx) {
        if (this.isDead || !ctx) return;

        ctx.save();
        
        // Flashing animation during invulnerability
        if (this.invulnTimer > 0 && Math.floor(this.invulnTimer / 100) % 2 === 0) {
            ctx.globalAlpha = 0.4;
        }

        ctx.translate(this.x, this.y);

        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.beginPath();
        ctx.ellipse(this.width / 2, this.height / 2 + 4, this.width / 2 + 4, this.height / 2 + 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Shield capsule glow
        if (this.hasShield) {
            ctx.strokeStyle = this.colorType === 'red' ? "#ffaaaa" : "#aaffff";
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.arc(this.width / 2, this.height / 2, 38, 0, Math.PI * 2);
            ctx.stroke();
            ctx.fillStyle = this.colorType === 'red' ? "rgba(255, 68, 102, 0.15)" : "rgba(0, 242, 254, 0.15)";
            ctx.fill();
        }

        // Booster flame trails
        if (this.isBoosting) {
            ctx.fillStyle = "#FF4500";
            ctx.fillRect(6, this.height, 4, 15 + Math.random() * 15);
            ctx.fillRect(this.width - 10, this.height, 4, 15 + Math.random() * 15);
            ctx.fillStyle = "#FFD700";
            ctx.fillRect(7, this.height, 2, 8 + Math.random() * 10);
            ctx.fillRect(this.width - 9, this.height, 2, 8 + Math.random() * 10);
        }

        if (customCarImage && this.id === 'p1') {
            ctx.drawImage(customCarImage, 0, 0, this.width, this.height);
        } else {
            // Draw custom retro sports car
            ctx.fillStyle = "#1a1a1a";
            const tW = 5, tH = 12;
            
            drawRoundRect(ctx, -3, 10, tW, tH, 2);
            ctx.fill();
            drawRoundRect(ctx, this.width - 2, 10, tW, tH, 2);
            ctx.fill();
            drawRoundRect(ctx, -3, this.height - 18, tW, tH, 2);
            ctx.fill();
            drawRoundRect(ctx, this.width - 2, this.height - 18, tW, tH, 2);
            ctx.fill();

            const bodyColor = this.colorType === 'red' ? "#ef4444" : "#00f2fe";
            const darkBodyColor = this.colorType === 'red' ? "#c62828" : "#00a8cc";
            
            ctx.fillStyle = bodyColor;
            ctx.strokeStyle = darkBodyColor;
            ctx.lineWidth = 1.5;
            
            ctx.beginPath();
            ctx.moveTo(4, 0);
            ctx.lineTo(this.width - 4, 0);
            ctx.quadraticCurveTo(this.width, 0, this.width, 6);
            ctx.lineTo(this.width, this.height - 6);
            ctx.quadraticCurveTo(this.width, this.height, this.width - 4, this.height);
            ctx.lineTo(4, this.height);
            ctx.quadraticCurveTo(0, this.height, 0, this.height - 6);
            ctx.lineTo(0, 6);
            ctx.quadraticCurveTo(0, 0, 4, 0);
            ctx.fill();
            ctx.stroke();

            // Racing stripes
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(this.width * 0.25, 0, this.width * 0.18, this.height);
            ctx.fillRect(this.width * 0.57, 0, this.width * 0.18, this.height);

            // Windshield
            ctx.fillStyle = "#1f2833";
            ctx.beginPath();
            ctx.moveTo(2, 14);
            ctx.quadraticCurveTo(this.width / 2, 9, this.width - 2, 14);
            ctx.lineTo(this.width - 4, 22);
            ctx.quadraticCurveTo(this.width / 2, 24, 4, 22);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = "rgba(255,255,255,0.2)";
            ctx.beginPath();
            ctx.moveTo(4, 14);
            ctx.lineTo(this.width / 2, 12);
            ctx.lineTo(this.width / 2 - 2, 20);
            ctx.lineTo(6, 20);
            ctx.closePath();
            ctx.fill();

            // Rear window
            ctx.fillStyle = "#1f2833";
            ctx.beginPath();
            ctx.moveTo(4, this.height - 14);
            ctx.quadraticCurveTo(this.width / 2, this.height - 17, this.width - 4, this.height - 14);
            ctx.lineTo(this.width - 5, this.height - 7);
            ctx.quadraticCurveTo(this.width / 2, this.height - 5, 5, this.height - 7);
            ctx.closePath();
            ctx.fill();

            // Headlights
            ctx.fillStyle = "#e0f7fa";
            ctx.beginPath();
            ctx.ellipse(6, 4, 3, 2, Math.PI / 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(this.width - 6, 4, 3, 2, -Math.PI / 8, 0, Math.PI * 2);
            ctx.fill();

            // Rear brake lights
            ctx.fillStyle = "#ff0844";
            ctx.beginPath();
            ctx.ellipse(7, this.height - 3, 4, 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(this.width - 7, this.height - 3, 4, 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

class Obstacle {
    constructor(canvasWidth, speed) {
        this.width = 24; 
        this.height = 42;
        this.roadWidth = 320;
        this.roadLeft = (canvasWidth - this.roadWidth) / 2;
        
        this.laneCount = 5;
        this.laneWidth = this.roadWidth / this.laneCount;
        this.currentLane = Math.floor(Math.random() * this.laneCount);
        
        this.x = this.roadLeft + (this.currentLane * this.laneWidth) + (this.laneWidth - this.width) / 2;
        this.targetX = this.x;
        
        this.y = -100;
        this.speed = speed;
        this.markedForDeletion = false;
        
        const colors = (window.GAME_DATA && window.GAME_DATA.obstacleColors) ? 
            window.GAME_DATA.obstacleColors : ["#3498db", "#2ecc71", "#9b59b6", "#95a5a6", "#e67e22"];
        this.color = colors[Math.floor(Math.random() * colors.length)];
        
        this.isChangingLane = false;
        this.blinkTimer = 0; 
    }

    update(speedMultiplier) {
        this.y += this.speed * speedMultiplier;
        if (this.y > window.innerHeight + 50) this.markedForDeletion = true;

        if (!this.isChangingLane && Math.abs(this.x - this.targetX) < 1) {
            if (Math.random() < 0.003) { 
                const direction = Math.random() < 0.5 ? -1 : 1; 
                const nextLane = this.currentLane + direction;
                
                if (nextLane >= 0 && nextLane < this.laneCount) {
                    this.currentLane = nextLane;
                    this.targetX = this.roadLeft + (this.currentLane * this.laneWidth) + (this.laneWidth - this.width) / 2;
                    this.isChangingLane = true;
                    this.blinkDirection = direction; 
                }
            }
        }

        if (this.isChangingLane) {
            const dx = this.targetX - this.x;
            this.x += dx * 0.05; 
            if (Math.abs(dx) < 0.5) {
                this.x = this.targetX;
                this.isChangingLane = false;
            }
            this.blinkTimer++;
        }
    }

    draw(ctx) {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.fillStyle = "rgba(0,0,0,0.3)"; 
        ctx.fillRect(2, 4, this.width, this.height); 

        // Wheels
        ctx.fillStyle = "#111"; 
        ctx.fillRect(-1, 8, 3, 7); 
        ctx.fillRect(this.width - 2, 8, 3, 7);
        ctx.fillRect(-1, this.height - 12, 3, 7); 
        ctx.fillRect(this.width - 2, this.height - 12, 3, 7);

        // Body
        ctx.fillStyle = this.color; 
        drawRoundRect(ctx, 0, 0, this.width, this.height, 4); 
        ctx.fill();

        ctx.fillStyle = "rgba(0,0,0,0.2)"; 
        ctx.fillRect(3, 10, this.width - 6, 20); 

        // Windshields
        ctx.fillStyle = "#c5c6c7"; 
        ctx.fillRect(4, 26, this.width - 8, 4); 
        ctx.fillRect(4, 10, this.width - 8, 5); 

        // Brake lights
        ctx.fillStyle = "#ff3366"; 
        ctx.fillRect(2, this.height - 3, 6, 3); 
        ctx.fillRect(this.width - 8, this.height - 3, 6, 3); 

        // Lane blinker indicator
        if (this.isChangingLane) {
            if (Math.floor(this.blinkTimer / 10) % 2 === 0) {
                ctx.fillStyle = "#ffcc00"; 
                if (this.blinkDirection === -1) {
                    ctx.fillRect(-2, 10, 3, 3);
                    ctx.fillRect(-2, this.height - 10, 3, 3);
                } else {
                    ctx.fillRect(this.width - 1, 10, 3, 3);
                    ctx.fillRect(this.width - 1, this.height - 10, 3, 3);
                }
            }
        }

        ctx.restore();
    }
}

class Truck {
    constructor(canvasWidth, speed) {
        this.width = 70; 
        this.height = 160; 
        this.roadWidth = 320;
        this.roadLeft = (canvasWidth - this.roadWidth) / 2;
        
        this.x = (canvasWidth / 2) - (this.width / 2);
        this.y = -250;
        
        this.speed = speed * 0.75; 
        this.markedForDeletion = false;
        this.color = "#5c258d"; 
        this.type = "TRUCK";
    }

    update(speedMultiplier) {
        this.y += this.speed * speedMultiplier;
        if (this.y > window.innerHeight + 50) this.markedForDeletion = true;
    }

    draw(ctx) {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x, this.y);
        
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(4, 4, this.width, this.height);

        ctx.fillStyle = "#555"; 
        ctx.fillRect(0, 0, this.width, this.height - 30);
        
        // Metal ribs
        ctx.fillStyle = "#444";
        for (let i = 10; i < this.height - 30; i += 20) {
            ctx.fillRect(2, i, this.width - 4, 2);
        }

        // Cabin
        ctx.fillStyle = this.color;
        ctx.fillRect(2, 0, this.width - 4, 30); 

        // Cabin windows
        ctx.fillStyle = "#c5c6c7";
        ctx.fillRect(8, 6, this.width - 16, 10);

        // Rear hazard warnings
        ctx.fillStyle = "#c0392b";
        ctx.fillRect(2, this.height - 35, 10, 5);
        ctx.fillRect(this.width - 12, this.height - 35, 10, 5);

        ctx.fillStyle = "#f1c40f";
        ctx.fillRect(this.width / 2 - 10, this.height - 35, 20, 5);
        
        // Massive wheels
        ctx.fillStyle = "#111";
        const w = 6; 
        const h = 16;
        ctx.fillRect(-2, this.height - 24, w, h); 
        ctx.fillRect(this.width - 4, this.height - 24, w, h);
        ctx.fillRect(-2, this.height - 50, w, h); 
        ctx.fillRect(this.width - 4, this.height - 50, w, h);
        ctx.fillRect(-2, 10, w, h); 
        ctx.fillRect(this.width - 4, 10, w, h);

        ctx.restore();
    }
}

class PowerupItem {
    constructor(canvasWidth, speed, type, laneIndex, startY) {
        this.width = 30;
        this.height = 30;
        this.type = type; // 'shield', 'boost', 'heal'
        
        const roadWidth = 320;
        const laneCount = 5;
        const laneWidth = roadWidth / laneCount;
        const roadLeft = (canvasWidth - roadWidth) / 2;
        
        this.x = roadLeft + (laneIndex * laneWidth) + (laneWidth - this.width) / 2;
        this.y = startY || -100;
        this.speed = speed;
        this.markedForDeletion = false;
    }
    
    update(speedMultiplier) {
        this.y += this.speed * speedMultiplier;
        if (this.y > window.innerHeight + 50) this.markedForDeletion = true;
    }
    
    draw(ctx) {
        if (!ctx) return;
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        
        let glowColor = '#00f2fe';
        let icon = '🛡️';
        if (this.type === 'boost') {
            glowColor = '#ff4466';
            icon = '⚡';
        } else if (this.type === 'heal') {
            glowColor = '#2ecc71';
            icon = '❤️';
        }
        
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 10;
        ctx.fillStyle = 'rgba(15, 22, 38, 0.9)';
        ctx.strokeStyle = glowColor;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        ctx.arc(0, 0, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        ctx.shadowBlur = 0;
        
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(icon, 0, 0);
        
        ctx.restore();
    }
}

class AnswerItem {
    constructor(canvasWidth, speed, value, isCorrect, laneIndex, startY) {
        this.width = 38; 
        this.height = 38;
        this.value = value;
        this.isCorrect = isCorrect;
        
        const roadWidth = 320;
        const laneCount = 5;
        const laneWidth = roadWidth / laneCount;
        const roadLeft = (canvasWidth - roadWidth) / 2;
        
        this.x = roadLeft + (laneIndex * laneWidth) + (laneWidth - this.width) / 2;
        this.y = startY || -100; 
        this.speed = speed;
        this.markedForDeletion = false;
        this.color = '#ffcc00'; 
    }

    update(speedMultiplier) {
        this.y += this.speed * speedMultiplier;
        if (this.y > window.innerHeight + 50) this.markedForDeletion = true;
    }

    draw(ctx) {
        if (!ctx) return;
        ctx.save();
        ctx.fillStyle = this.color; 
        ctx.shadowColor = this.color; 
        ctx.shadowBlur = 12;
        
        drawRoundRect(ctx, this.x, this.y, this.width, this.height, 6);
        ctx.fill(); 
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#000000"; 
        ctx.font = "bold 18px Arial"; 
        ctx.textAlign = "center"; 
        ctx.textBaseline = "middle";
        ctx.fillText(this.value, this.x + this.width / 2, this.y + this.height / 2);
        ctx.restore();
    }
}

class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        this.sound = new SoundManager();
        this.input = new InputHandler();
        this.road = new Road(this.canvas.width, this.canvas.height);
        
        this.players = [];
        this.obstacles = [];
        this.items = []; 
        this.powerups = [];
        this.gameSpeed = (window.GAME_CONFIG && window.GAME_CONFIG.GAME_SPEED_START) ? window.GAME_CONFIG.GAME_SPEED_START : 5;
        this.isRunning = false;
        this.playerMode = 1; 
        this.currentMathProblem = null;
        
        this.truckTimer = 0;
        this.truckInterval = 30000; 
        this.spawnTimer = 0;

        this.resize();
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', () => this.resize());
            
            // Connect HUD controllers
            const muteBtn = document.getElementById('mute-btn');
            if (muteBtn) {
                muteBtn.addEventListener('click', (e) => {
                    const icon = this.sound.toggleMute(); 
                    e.target.innerText = icon; 
                    e.target.blur(); 
                });
            }

            const btn1p = document.getElementById('btn-1p');
            if (btn1p) btn1p.addEventListener('click', () => this.start(1));

            const btn2p = document.getElementById('btn-2p');
            if (btn2p) btn2p.addEventListener('click', () => this.start(2));

            const restartBtn = document.getElementById('restart-btn');
            if (restartBtn) {
                restartBtn.addEventListener('click', () => {
                     document.getElementById('game-over-screen').classList.add('hidden');
                     document.getElementById('start-screen').classList.remove('hidden');
                });
            }

            const btnLeaderboard = document.getElementById('btn-leaderboard');
            if (btnLeaderboard) {
                btnLeaderboard.addEventListener('click', () => this.showLeaderboard());
            }

            const closeLbBtn = document.getElementById('close-lb-btn');
            if (closeLbBtn) {
                closeLbBtn.addEventListener('click', () => {
                    document.getElementById('leaderboard-screen').classList.add('hidden');
                    document.getElementById('start-screen').classList.remove('hidden');
                });
            }

            const btnExit = document.getElementById('btn-exit');
            if (btnExit) {
                btnExit.addEventListener('click', () => {
                    if (window.KAMPAI) window.KAMPAI.goHome();
                });
            }
        }

        // Mount SDK listener
        if (window.KAMPAI) {
            window.KAMPAI.setSlug((window.GAME_CONFIG && window.GAME_CONFIG.SLUG) ? window.GAME_CONFIG.SLUG : 'math-racer');
            window.KAMPAI.onReady((k) => {
                // Populate profile & stats if logged in
                if (k.student) {
                    const playerChip = document.getElementById('player-chip');
                    if (playerChip) playerChip.innerText = `👤 ${k.student.name}`;
                }
                if (k.stats) {
                    const msBest = document.getElementById('ms-best');
                    if (msBest) msBest.innerText = k.stats.bestScore || 0;
                    const msPlays = document.getElementById('ms-plays');
                    if (msPlays) msPlays.innerText = k.stats.plays || 0;
                }
            });
        }
    }

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth > 600 ? 500 : window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.road) {
            this.road.width = this.canvas.width;
            this.road.height = this.canvas.height;
        }
        this.resetPositions();
    }

    resetPositions() {
        if (!this.canvas) return;
        this.players.forEach(p => {
             p.x = (this.canvas.width / 2) - (p.width / 2);
             if (p.id === 'p1') p.x += 30;
             if (p.id === 'p2') p.x -= 30;
             p.y = this.canvas.height - 80;
        });
    }

    start(mode) {
        this.playerMode = mode;
        this.sound.resume();
        this.sound.startBGM();

        // Trigger KAMPAI sound unlock on click
        if (window.KAMPAI && window.KAMPAI.sound && typeof window.KAMPAI.sound.unlock === 'function') {
            window.KAMPAI.sound.unlock();
        }

        document.getElementById('start-screen').classList.add('hidden');
        document.getElementById('game-over-screen').classList.add('hidden');
        document.getElementById('p2-score-box').style.display = (mode === 2) ? 'flex' : 'none';
        document.getElementById('question-box').classList.remove('hidden');

        // Mount SDK Mobile D-pad controls
        if (window.KAMPAI && window.KAMPAI.controls) {
            window.KAMPAI.controls.mount({
                dpad: true,
                buttons: []
            });
        }

        this.players = [];
        
        const p1 = new PlayerCar('p1', this.canvas.width / 2, this.canvas.height - 80, 'red');
        this.players.push(p1);
        this.updateHeartsUI(p1);

        if (mode === 2) {
            const p2 = new PlayerCar('p2', this.canvas.width / 2, this.canvas.height - 80, 'blue');
            this.players.push(p2);
            this.updateHeartsUI(p2);
        }

        this.resetGameData();
        this.generateMathProblem();

        this.isRunning = true;
        this.lastTime = performance.now();
        requestAnimationFrame((ts) => this.animate(ts));
    }

    updateHeartsUI(player) {
        const el = document.getElementById(`health-${player.id}`);
        if (el) {
            let hearts = '';
            const maxLives = (window.GAME_CONFIG && window.GAME_CONFIG.LIVES) ? window.GAME_CONFIG.LIVES : 3;
            for (let i = 0; i < maxLives; i++) {
                if (i < player.lives) {
                    hearts += '❤️';
                } else {
                    hearts += '🖤';
                }
            }
            el.innerText = hearts;
        }
    }

    generateMathProblem() {
        const isMultiplication = Math.random() > 0.5;
        let num1, num2, answer, questionStr, ttsPhrase;
        
        if (isMultiplication) {
            num1 = Math.floor(Math.random() * 11) + 2; 
            num2 = Math.floor(Math.random() * 11) + 2; 
            answer = num1 * num2;
            questionStr = `${num1} × ${num2}`;
            ttsPhrase = `${numberToThaiWords(num1)} คูณ ${numberToThaiWords(num2)}`;
        } else {
            num2 = Math.floor(Math.random() * 11) + 2; 
            answer = Math.floor(Math.random() * 11) + 2; 
            num1 = answer * num2;
            questionStr = `${num1} ÷ ${num2}`;
            ttsPhrase = `${numberToThaiWords(num1)} หารด้วย ${numberToThaiWords(num2)}`;
        }
        
        this.currentMathProblem = { question: questionStr, answer: answer };
        
        const qBox = document.getElementById('question-box');
        if (qBox) qBox.innerText = `${questionStr} = ?`;

        // TTS Read Aloud
        if (window.GAME_CONFIG && window.GAME_CONFIG.TTS_ENABLED) {
            this.speakText(ttsPhrase);
        }
    }

    speakText(text) {
        if (window.KAMPAI && window.KAMPAI.sound && typeof window.KAMPAI.sound.speak === 'function') {
            window.KAMPAI.sound.speak(text, 'th-TH');
        } else if (typeof SpeechSynthesisUtterance !== 'undefined' && window.speechSynthesis) {
            try {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'th-TH';
                window.speechSynthesis.speak(utterance);
            } catch (e) {
                console.warn('SpeechSynthesis error:', e);
            }
        }
    }

    spawnAnswerWave() {
        if (!this.currentMathProblem) return;

        const lanes = [0, 1, 2, 3, 4];
        for (let i = lanes.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [lanes[i], lanes[j]] = [lanes[j], lanes[i]];
        }
        const selectedLanes = lanes.slice(0, 3);
        const remainingLanes = lanes.slice(3);
        
        const startYOffsets = [-100, -250, -400];
        for (let i = startYOffsets.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [startYOffsets[i], startYOffsets[j]] = [startYOffsets[j], startYOffsets[i]];
        }
        
        const correctLaneIndex = Math.floor(Math.random() * 3);
        
        for (let i = 0; i < 3; i++) {
            let val;
            const isCorrect = (i === correctLaneIndex);
            
            if (isCorrect) {
                val = this.currentMathProblem.answer;
            } else {
                let offset = Math.floor(Math.random() * 10) + 1;
                offset *= Math.random() > 0.5 ? 1 : -1;
                val = this.currentMathProblem.answer + offset;
                if (val <= 0) val = Math.floor(Math.random() * 10) + 1; 
            }
            
            this.items.push(new AnswerItem(this.canvas.width, this.gameSpeed, val, isCorrect, selectedLanes[i], startYOffsets[i]));
        }

        // Spawn a powerup in remaining lanes with a chance
        const spawnChance = (window.GAME_CONFIG && window.GAME_CONFIG.SPAWN_POWERUP_CHANCE) ? 
            window.GAME_CONFIG.SPAWN_POWERUP_CHANCE : 0.15;
            
        if (Math.random() < spawnChance) {
            const powerupTypes = ['shield', 'boost', 'heal'];
            const type = powerupTypes[Math.floor(Math.random() * powerupTypes.length)];
            const laneIndex = remainingLanes[Math.floor(Math.random() * remainingLanes.length)];
            this.powerups.push(new PowerupItem(this.canvas.width, this.gameSpeed, type, laneIndex, -250));
        }
    }

    resetGameData() {
        this.gameSpeed = (window.GAME_CONFIG && window.GAME_CONFIG.GAME_SPEED_START) ? window.GAME_CONFIG.GAME_SPEED_START : 5;
        this.obstacles = [];
        this.items = [];
        this.powerups = [];
        this.truckTimer = 0; 
        this.spawnTimer = 0;
        this.resetPositions();
        
        const s1 = document.getElementById('score-board-p1');
        if (s1) s1.innerText = "0";
        const s2 = document.getElementById('score-board-p2');
        if (s2) s2.innerText = "0";
    }

    gameOver() {
        this.isRunning = false;
        this.sound.stopBGM();
        this.sound.playCrash();
        
        document.getElementById('game-over-screen').classList.remove('hidden');
        document.getElementById('question-box').classList.add('hidden');
        
        const s1 = this.players[0].score;
        document.getElementById('final-score-p1').innerText = Math.floor(s1);

        let winnerText = "";
        let finalScore = s1;
        
        if (this.playerMode === 2 && this.players[1]) {
            const s2 = this.players[1].score;
            document.getElementById('final-p2-line').style.display = 'block';
            document.getElementById('final-score-p2').innerText = Math.floor(s2);

            if (Math.floor(s1) > Math.floor(s2)) {
                winnerText = "P1 WINS!";
                finalScore = s1;
            } else if (Math.floor(s2) > Math.floor(s1)) {
                winnerText = "P2 WINS!";
                finalScore = s2;
            } else {
                winnerText = "DRAW!";
                finalScore = s1;
            }
        } else {
            document.getElementById('final-p2-line').style.display = 'none';
        }
        
        const wText = document.getElementById('winner-text');
        if (wText) wText.innerText = winnerText;

        // Submit Score to KAMPAI SDK
        if (window.KAMPAI) {
            window.KAMPAI.submitScore(Math.floor(finalScore), {
                mode: 'normal'
            });
        }

        // Save local leaderboard fallback
        try {
            let localData = [];
            const local = localStorage.getItem('math_racer_leaderboard');
            if (local) {
                localData = JSON.parse(local);
            }
            const name = (window.KAMPAI && window.KAMPAI.student) ? window.KAMPAI.student.name : (this.playerMode === 2 ? 'Co-op Players' : 'Player 1');
            localData.push({ name: name, score: finalScore });
            localData.sort((a, b) => b.score - a.score);
            localStorage.setItem('math_racer_leaderboard', JSON.stringify(localData.slice(0, 10)));
        } catch (e) {
            console.error('Failed to update local leaderboard:', e);
        }
    }

    showLeaderboard() {
        this.isRunning = false;
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
                    const local = localStorage.getItem('math_racer_leaderboard');
                    if (local) {
                        list = JSON.parse(local).slice(0, 5);
                    }
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
                        <td style="color: #66fcf1; font-weight:bold;">${Math.floor(row.score)}</td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }
    }

    checkCollision(rect1, rect2) {
        const padding = 4;
        return (
            rect1.x + padding < rect2.x + rect2.width - padding &&
            rect1.x + rect1.width - padding > rect2.x + padding &&
            rect1.y + padding < rect2.y + rect2.height - padding &&
            rect1.height + rect1.y - padding > rect2.y + padding
        );
    }

    animate(timeStamp) {
        if (!this.isRunning) return;

        const deltaTime = timeStamp - this.lastTime;
        this.lastTime = timeStamp;

        if (this.ctx) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }

        let maxBoost = 1.0; 
        this.players.forEach(p => {
            if (!p.isDead && p.isBoosting) {
                maxBoost = 1.5;
            }
        });

        this.road.update(maxBoost);
        this.road.draw(this.ctx);

        // Spawn giant warning trucks
        this.truckTimer += deltaTime;
        if (this.truckTimer >= this.truckInterval) {
            this.obstacles.push(new Truck(this.canvas.width, this.gameSpeed));
            this.truckTimer = 0; 
            
            const warnEl = document.getElementById('warning-msg');
            if (warnEl) {
                warnEl.style.display = 'block';
                this.sound.playHorn();
                setTimeout(() => { warnEl.style.display = 'none'; }, 2000); 
            }
        }

        let activePlayers = 0;
        this.players.forEach(p => {
            if (!p.isDead) {
                activePlayers++;
                const input = (p.id === 'p1') ? this.input.getP1Input() : this.input.getP2Input();
                p.update(input, this.canvas.width, this.canvas.height, deltaTime);
                p.draw(this.ctx);
                
                p.score += 0.1 * maxBoost;
                const scoreBox = document.getElementById(`score-board-${p.id}`);
                if (scoreBox) scoreBox.innerText = Math.floor(p.score);
            }
        });

        if (activePlayers === 0) {
            this.gameOver();
            return;
        }

        // Game Spawning Loop
        this.spawnTimer = (this.spawnTimer || 0) + deltaTime * maxBoost;
        if (this.spawnTimer > 1500) { 
            const hasAnswers = this.items.length > 0;
            
            if (!hasAnswers || Math.random() < 0.4) {
                this.spawnAnswerWave();
                this.spawnTimer = -500; 
            } else {
                this.obstacles.push(new Obstacle(this.canvas.width, this.gameSpeed));
                this.spawnTimer = 0;
            }
            
            const maxSpeedLimit = (window.GAME_CONFIG && window.GAME_CONFIG.GAME_SPEED_MAX) ? window.GAME_CONFIG.GAME_SPEED_MAX : 12;
            if (this.gameSpeed < maxSpeedLimit) this.gameSpeed += 0.05;
        }

        // Process Answers Collisions
        this.items.forEach(item => {
            item.update(maxBoost);
            item.draw(this.ctx);
            
            this.players.forEach(p => {
                if (!p.isDead && !item.markedForDeletion && this.checkCollision(p, item)) {
                    if (item.isCorrect) {
                        p.score += 50;
                        this.sound.playCoin();
                        this.generateMathProblem(); 
                        // Clear current answer wave so players don't hit leftovers
                        this.items.forEach(i => i.markedForDeletion = true); 
                    } else {
                        // Wrong answer acts as obstacle collision
                        item.markedForDeletion = true;
                        this.handlePlayerDamage(p);
                    }
                }
            });
        });
        this.items = this.items.filter(i => !i.markedForDeletion);

        // Process Power-ups Collisions
        this.powerups.forEach(pUp => {
            pUp.update(maxBoost);
            pUp.draw(this.ctx);
            
            this.players.forEach(p => {
                if (!p.isDead && !pUp.markedForDeletion && this.checkCollision(p, pUp)) {
                    pUp.markedForDeletion = true;
                    if (pUp.type === 'shield') {
                        p.activateShield();
                        this.sound.playShield();
                    } else if (pUp.type === 'boost') {
                        p.activateBoost();
                        this.sound.playBoost();
                    } else if (pUp.type === 'heal') {
                        const maxLives = (window.GAME_CONFIG && window.GAME_CONFIG.LIVES) ? window.GAME_CONFIG.LIVES : 3;
                        p.lives = Math.min(maxLives, p.lives + 1);
                        this.sound.playShield(); // Collect powerup sound
                        this.updateHeartsUI(p);
                    }
                }
            });
        });
        this.powerups = this.powerups.filter(p => !p.markedForDeletion);

        // Process Obstacles/Trucks Collisions
        this.obstacles.forEach(obs => {
            obs.update(maxBoost);
            obs.draw(this.ctx);

            this.players.forEach(p => {
                if (!p.isDead && !obs.markedForDeletion && this.checkCollision(p, obs)) {
                    this.handlePlayerDamage(p);
                }
            });
        });
        this.obstacles = this.obstacles.filter(o => !o.markedForDeletion);

        requestAnimationFrame((ts) => this.animate(ts));
    }

    handlePlayerDamage(player) {
        if (player.invulnTimer > 0 || player.isBoosting) return;

        if (player.hasShield) {
            player.breakShield();
            player.invulnTimer = 1500;
            this.sound.playShieldBreak();
        } else {
            player.lives--;
            this.updateHeartsUI(player);
            this.sound.playWrong();
            if (player.lives <= 0) {
                player.die();
            } else {
                player.invulnTimer = 2000;
            }
        }
    }
}

// Instantiate the game
let gameInstance = null;
if (typeof window !== 'undefined') {
    gameInstance = new Game('gameCanvas');
}
