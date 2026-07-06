/**
 * Math-Man Co-op - Game Logic & SDK Integration
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('scoreDisplay');
const p1ScoreDisplay = document.getElementById('p1ScoreDisplay');
const p2ScoreDisplay = document.getElementById('p2ScoreDisplay');
const p1LivesDisplay = document.getElementById('p1LivesDisplay');
const p2LivesDisplay = document.getElementById('p2LivesDisplay');
const p1LivesContainer = document.getElementById('p1LivesContainer');
const p2LivesContainer = document.getElementById('p2LivesContainer');
const equationDisplay = document.getElementById('equationDisplay');
const equationBox = document.getElementById('equationBox');
const comboDisplay = document.getElementById('comboDisplay');
const timerBar = document.getElementById('timerBar');
const blocker = document.getElementById('blocker');
const msgBox = document.getElementById('msg-box');

const CONFIG = window.GAME_CONFIG;
const DATA = window.GAME_DATA;

// Set up SDK Slug
KAMPAI.setSlug(CONFIG.SLUG);

let animationId;
let isPlaying = false;
let gameMode = 'single'; // 'single', 'coop', 'versus'
let score = 0;
let scoreP2 = 0;
let correctCount = 0;
let correctCountP2 = 0;
let comboStreak = 0;
let comboStreakP2 = 0;

let problemStartTime = 0;
const problemDuration = DATA.problemDuration || 15000;
let freezeGhostsUntil = 0;

let particles = [];
let floatingTexts = [];
let items = [];
const keys = {};

// Prevent keyboard scrolling
window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
        e.preventDefault();
    }
    keys[e.code] = true;
    tryStartMusic();
});
window.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// Grid & Maze Properties
const tileSize = 24; 
let map = [];
let cols = 0;
let rows = 0;

// Seeded RNG support
let qrand = Math.random;

function createMulberry32(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// BGM Audio Control
let isMusicPlaying = false;
function tryStartMusic() {
    if (!isMusicPlaying && isPlaying) {
        try {
            KAMPAI.sound.unlock();
            KAMPAI.sound.bgmStart();
            isMusicPlaying = true;
            document.getElementById('music-btn').innerText = "🔊";
        } catch (e) {}
    }
}
function toggleMusic() {
    if (isMusicPlaying) {
        try { KAMPAI.sound.bgmStop(); } catch (e) {}
        isMusicPlaying = false;
        document.getElementById('music-btn').innerText = "🔇";
    } else {
        try { KAMPAI.sound.bgmStart(); } catch (e) {}
        isMusicPlaying = true;
        document.getElementById('music-btn').innerText = "🔊";
    }
}

// SDK Initialization & Leaderboard Rendering
KAMPAI.onReady((sdk) => {
    try {
        KAMPAI.sound.mountToggles();
        KAMPAI.controls.mount({ dpad: true, buttons: [] });
        KAMPAI.sound.defaultBgm(CONFIG.BGM || 'cheerful');
    } catch(e) {}
    
    const bestScore = sdk.stats?.personalBest || 0;
    const playCount = sdk.stats?.playsCount || 0;
    
    const bestEl = document.getElementById('ms-best');
    const playsEl = document.getElementById('ms-plays');
    if (bestEl) bestEl.textContent = bestScore;
    if (playsEl) playsEl.textContent = playCount;

    renderLeaderboard(sdk.leaderboard, 'score-list');

    if (sdk.student) {
        const chip = document.getElementById('player-chip');
        if (chip) {
            const studentName = sdk.student.displayName || sdk.student.name || '';
            chip.style.display = 'inline-flex';
            chip.className = "items-center gap-2 bg-slate-800/60 border border-slate-700 px-4 py-1.5 rounded-full text-sm";
            chip.innerHTML = `
                <div class="w-6 h-6 bg-gradient-to-tr from-yellow-500 to-amber-500 rounded-full flex items-center justify-center font-bold text-white text-xs">${studentName.charAt(0)}</div>
                <span>${studentName}</span>
            `;
        }
    }
});

function renderLeaderboard(leaderboardData, containerId) {
    const listEl = document.getElementById(containerId);
    if (!listEl) return;
    
    listEl.innerHTML = '';
    if (!leaderboardData || leaderboardData.length === 0) {
        listEl.innerHTML = '<li class="text-center text-slate-500 italic">ยังไม่มีประวัติคะแนน</li>';
        return;
    }

    leaderboardData.slice(0, 5).forEach((row, i) => {
        const isMe = KAMPAI.student && (row.studentId === KAMPAI.student.id || row.student_id === KAMPAI.student.id);
        const li = document.createElement('li');
        li.className = `flex justify-between items-center bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-800/40 ${isMe ? 'me border-yellow-500/30 text-yellow-400 bg-yellow-500/5' : 'text-slate-300'}`;
        
        const displayName = row.displayName || row.student_name || 'ผู้พิทักษ์';
        const score = row.personalBest !== undefined ? row.personalBest : (row.score !== undefined ? row.score : 0);
        
        li.innerHTML = `
            <span><strong>#${i + 1}</strong> ${displayName}</span>
            <span class="font-semibold text-sky-400">⭐ ${score}</span>
        `;
        listEl.appendChild(li);
    });
}

// Maze Generation
function generateMap() {
    const header = document.getElementById('header-ui');
    const headerHeight = header ? (header.offsetHeight || 60) : 60;
    const availWidth = window.innerWidth - 16;
    const availHeight = window.innerHeight - headerHeight - 24;

    cols = Math.floor(availWidth / tileSize);
    rows = Math.floor(availHeight / tileSize);

    if (cols % 2 === 0) cols--;
    if (rows % 2 === 0) rows--;

    if (cols < 15) cols = 15;
    if (rows < 11) rows = 11;

    canvas.width = cols * tileSize;
    canvas.height = rows * tileSize;

    map = [];
    for (let r = 0; r < rows; r++) {
        map[r] = [];
        for (let c = 0; c < cols; c++) {
            map[r][c] = 0;
        }
    }

    // Outer boundary walls
    for (let r = 0; r < rows; r++) { map[r][0] = 1; map[r][cols-1] = 1; }
    for (let c = 0; c < cols; c++) { map[0][c] = 1; map[rows-1][c] = 1; }

    // Spawn pillars and randomize paths
    for (let r = 2; r < rows - 2; r += 2) {
        for (let c = 2; c < cols - 2; c += 2) {
            map[r][c] = 1;
            let dir = Math.floor(Math.random() * 4);
            if (dir === 0) map[r-1][c] = 1;
            else if (dir === 1) map[r+1][c] = 1;
            else if (dir === 2) map[r][c-1] = 1;
            else if (dir === 3) map[r][c+1] = 1;
        }
    }

    // Clear player starting zones
    map[1][1] = 0; map[1][2] = 0; map[2][1] = 0; 
    map[1][cols-2] = 0; map[1][cols-3] = 0; map[2][cols-2] = 0;

    // Warp portals (Left/Right & Top/Bottom)
    let midR = Math.floor(rows / 2);
    let midC = Math.floor(cols / 2);
    if (midR % 2 === 0) midR++;
    if (midC % 2 === 0) midC++;

    if (midR < rows && midC < cols) {
        for(let i=0; i<3; i++) {
            if (i < cols) {
                map[midR][i] = 0;             
                map[midR][cols-1-i] = 0;      
            }
            if (i < rows) {
                map[i][midC] = 0;             
                map[rows-1-i][midC] = 0;      
            }
        }
    }
}

function drawMaze() {
    ctx.fillStyle = '#1e3b8a';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;

    for (let r = 0; r < map.length; r++) {
        for (let c = 0; c < map[r].length; c++) {
            if (map[r][c] === 1) {
                ctx.fillRect(c * tileSize, r * tileSize, tileSize, tileSize);
                ctx.strokeRect(c * tileSize, r * tileSize, tileSize, tileSize);
            }
        }
    }
}

function isCollidingWithWall(x, y, radius) {
    const margin = 4; 
    const left = Math.floor((x - radius + margin) / tileSize);
    const right = Math.floor((x + radius - margin) / tileSize);
    const top = Math.floor((y - radius + margin) / tileSize);
    const bottom = Math.floor((y + radius - margin) / tileSize);

    for (let r = top; r <= bottom; r++) {
        for (let c = left; c <= right; c++) {
            if (r < 0 || r >= map.length || !map[r] || c < 0 || c >= map[r].length) {
                continue;
            }
            if (map[r][c] === 1) {
                return true;
            }
        }
    }
    return false;
}

// Game Entities
let players = [];
let ghosts = [];
let answers = []; 
let currentCorrectAnswer = 0;

class Player {
    constructor(x, y, color, controls, id) {
        this.x = x;
        this.y = y;
        this.radius = 11; 
        this.color = color;
        this.speed = 3;
        this.controls = controls;
        this.angle = 0; 
        this.invulnerable = 0; 
        this.lives = CONFIG.LIVES;
        this.isDead = false;
        this.id = id; // 1 or 2
    }

    update() {
        if (this.isDead) return;
        if (this.invulnerable > 0) this.invulnerable--;

        // Read mobile/SDK input signals
        const inputUp = window.KAMPAI && window.KAMPAI.input && window.KAMPAI.input.up;
        const inputDown = window.KAMPAI && window.KAMPAI.input && window.KAMPAI.input.down;
        const inputLeft = window.KAMPAI && window.KAMPAI.input && window.KAMPAI.input.left;
        const inputRight = window.KAMPAI && window.KAMPAI.input && window.KAMPAI.input.right;

        let up = keys[this.controls.up] || (this.id === 1 && inputUp);
        let down = keys[this.controls.down] || (this.id === 1 && inputDown);
        let left = keys[this.controls.left] || (this.id === 1 && inputLeft);
        let right = keys[this.controls.right] || (this.id === 1 && inputRight);

        // Extra accessibility check: P1 can also use WASD if in single player mode
        if (this.id === 1 && gameMode === 'single') {
            up = up || keys['KeyW'] || inputUp;
            down = down || keys['KeyS'] || inputDown;
            left = left || keys['KeyA'] || inputLeft;
            right = right || keys['KeyD'] || inputRight;
        }

        let movedY = false;
        
        if (up && !isCollidingWithWall(this.x, this.y - this.speed, this.radius)) {
            this.y -= this.speed; this.angle = -Math.PI / 2; movedY = true;
        } else if (down && !isCollidingWithWall(this.x, this.y + this.speed, this.radius)) {
            this.y += this.speed; this.angle = Math.PI / 2; movedY = true;
        }

        if (!movedY) {
            if (left && !isCollidingWithWall(this.x - this.speed, this.y, this.radius)) {
                this.x -= this.speed; this.angle = Math.PI;
            } else if (right && !isCollidingWithWall(this.x + this.speed, this.y, this.radius)) {
                this.x += this.speed; this.angle = 0;
            }
        }

        // Wrap-around portal boundaries
        if (this.x < 0) this.x += canvas.width;
        if (this.x >= canvas.width) this.x -= canvas.width;
        if (this.y < 0) this.y += canvas.height;
        if (this.y >= canvas.height) this.y -= canvas.height;
    }

    draw() {
        if (this.isDead) return;
        if (this.invulnerable > 0 && Math.floor(Date.now() / 150) % 2 === 0) return;

        let mouthAngle = 0.2 * Math.PI * (Math.sin(Date.now() / 80) + 1);
        
        const inputUp = window.KAMPAI && window.KAMPAI.input && window.KAMPAI.input.up;
        const inputDown = window.KAMPAI && window.KAMPAI.input && window.KAMPAI.input.down;
        const inputLeft = window.KAMPAI && window.KAMPAI.input && window.KAMPAI.input.left;
        const inputRight = window.KAMPAI && window.KAMPAI.input && window.KAMPAI.input.right;

        // Stationary check
        let isMoving = keys[this.controls.up] || keys[this.controls.down] || keys[this.controls.left] || keys[this.controls.right] || (this.id === 1 && (inputUp || inputDown || inputLeft || inputRight));
        if (this.id === 1 && gameMode === 'single') {
            isMoving = isMoving || keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'];
        }
        if (!isMoving) {
            mouthAngle = 0.2 * Math.PI;
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, this.angle + mouthAngle, this.angle + 2 * Math.PI - mouthAngle);
        ctx.lineTo(this.x, this.y);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.closePath();

        // Draw small shield border if invulnerable
        if (this.invulnerable > 0) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 4, 0, Math.PI * 2);
            ctx.strokeStyle = '#fb923c';
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }
    }
}

class Ghost {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 11; 
        this.speed = 1; 
        const dirs = [{x:this.speed, y:0}, {x:-this.speed, y:0}, {x:0, y:this.speed}, {x:0, y:-this.speed}];
        const d = dirs[Math.floor(Math.random() * dirs.length)];
        this.vx = d.x;
        this.vy = d.y;
    }

    update() {
        if (Date.now() < freezeGhostsUntil) return;

        if (this.x % tileSize === tileSize/2 && this.y % tileSize === tileSize/2) {
            let c = Math.floor(this.x / tileSize);
            let r = Math.floor(this.y / tileSize);

            let possibleDirs = [
                {vx: 0, vy: -this.speed}, 
                {vx: 0, vy: this.speed},  
                {vx: -this.speed, vy: 0}, 
                {vx: this.speed, vy: 0}   
            ];
            
            let validDirs = possibleDirs.filter(d => {
                let nextC = c + (d.vx > 0 ? 1 : d.vx < 0 ? -1 : 0);
                let nextR = r + (d.vy > 0 ? 1 : d.vy < 0 ? -1 : 0);
                
                if (nextR < 0 || nextR >= rows || nextC < 0 || nextC >= cols) return true;
                return map[nextR][nextC] === 0;
            });

            if (validDirs.length > 0) {
                let notBackwards = validDirs.filter(d => d.vx !== -this.vx || d.vy !== -this.vy);
                let choices = notBackwards.length > 0 ? notBackwards : validDirs;

                let chosen = choices[Math.floor(Math.random() * choices.length)];
                this.vx = chosen.vx;
                this.vy = chosen.vy;
            }
        }

        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0) this.x += canvas.width;
        if (this.x >= canvas.width) this.x -= canvas.width;
        if (this.y < 0) this.y += canvas.height;
        if (this.y >= canvas.height) this.y -= canvas.height;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, Math.PI, 0); 
        ctx.lineTo(this.x + this.radius, this.y + this.radius);
        ctx.lineTo(this.x + this.radius/2, this.y + this.radius - 4);
        ctx.lineTo(this.x, this.y + this.radius);
        ctx.lineTo(this.x - this.radius/2, this.y + this.radius - 4);
        ctx.lineTo(this.x - this.radius, this.y + this.radius);
        
        ctx.fillStyle = (Date.now() < freezeGhostsUntil) ? '#bae6fd' : '#f97316'; 
        ctx.fill();
        ctx.closePath();
        
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(this.x - 4, this.y - 3, 3, 0, Math.PI * 2);
        ctx.arc(this.x + 4, this.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#1e3a8a';
        ctx.beginPath();
        let px = this.vx > 0 ? 1 : this.vx < 0 ? -1 : 0;
        let py = this.vy > 0 ? 1 : this.vy < 0 ? -1 : 0;
        ctx.arc(this.x - 4 + px*1.5, this.y - 3 + py*1.5, 1.5, 0, Math.PI * 2);
        ctx.arc(this.x + 4 + px*1.5, this.y - 3 + py*1.5, 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

class AnswerOrb {
    constructor(x, y, value, isCorrect) {
        this.x = x;
        this.y = y;
        this.radius = 10; 
        this.value = value;
        this.isCorrect = isCorrect;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b'; 
        ctx.fill();
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = '#38bdf8';
        ctx.stroke();
        ctx.closePath();

        ctx.fillStyle = 'white';
        ctx.font = 'bold 12px Kanit';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.value, this.x, this.y + 1);
    }
}

class ItemOrb {
    constructor(x, y, typeInfo) {
        this.x = x;
        this.y = y;
        this.radius = 9;
        this.type = typeInfo.id;
        this.icon = typeInfo.icon;
        this.color = typeInfo.color;
        this.bob = Math.random() * Math.PI * 2; 
    }

    draw() {
        this.bob += 0.05;
        let offsetY = Math.sin(this.bob) * 3;

        ctx.beginPath();
        ctx.arc(this.x, this.y + offsetY, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = '#1e293b'; 
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = this.color; 
        ctx.stroke();
        ctx.closePath();

        ctx.fillStyle = 'white';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.icon, this.x, this.y + offsetY + 1);
    }
}

const ITEM_TYPES = [
    { id: 'time', icon: '⏱️', color: '#10b981' }, 
    { id: 'freeze', icon: '❄️', color: '#60a5fa' }, 
    { id: 'shield', icon: '🛡️', color: '#f59e0b' }  
];

function getEmptyPathTiles() {
    const paths = [];
    for(let r=0; r<rows; r++) {
        for(let c=0; c<cols; c++) {
            if(map[r][c] === 0) {
                paths.push({x: c * tileSize + tileSize/2, y: r * tileSize + tileSize/2});
            }
        }
    }
    // Shuffle paths based on our active randomizer (seeded or Math.random)
    return paths.sort(() => qrand() - 0.5);
}

// Math Equations Generation
function generateMathProblem() {
    const opType = Math.floor(qrand() * 3);
    let num1, num2, equationStr;

    if (opType === 0) { 
        num1 = Math.floor(qrand() * 20) + 1;
        num2 = Math.floor(qrand() * 20) + 1;
        currentCorrectAnswer = num1 + num2;
        equationStr = `${num1} + ${num2} = ?`;
    } else if (opType === 1) { 
        num1 = Math.floor(qrand() * 20) + 10;
        num2 = Math.floor(qrand() * 10) + 1;
        currentCorrectAnswer = num1 - num2;
        equationStr = `${num1} - ${num2} = ?`;
    } else { 
        num1 = Math.floor(qrand() * 9) + 2;
        num2 = Math.floor(qrand() * 9) + 2;
        currentCorrectAnswer = num1 * num2;
        equationStr = `${num1} × ${num2} = ?`;
    }

    equationDisplay.innerText = equationStr.replace(/([+\-×=])/g, ' $1 ');
    
    problemStartTime = Date.now();
    if (equationBox) {
        equationBox.classList.remove('animate-glow');
        void equationBox.offsetWidth; 
        equationBox.classList.add('animate-glow');
    }

    spawnAnswers();
}

function spawnAnswers() {
    answers = [];
    let choices = [currentCorrectAnswer];

    while (choices.length < 4) {
        let fakeAns = currentCorrectAnswer + (Math.floor(qrand() * 21) - 10);
        if (fakeAns !== currentCorrectAnswer && !choices.includes(fakeAns) && fakeAns >= 0) {
            choices.push(fakeAns);
        }
    }
    choices.sort(() => qrand() - 0.5);

    const paths = getEmptyPathTiles();
    for (let i = 0; i < 4; i++) {
        if (!paths[i]) break;
        let isCorrect = (choices[i] === currentCorrectAnswer);
        answers.push(new AnswerOrb(paths[i].x, paths[i].y, choices[i], isCorrect));
    }
}

function spawnItem() {
    if (items.length >= 3) return; 
    const paths = getEmptyPathTiles();
    if (paths.length > 0) {
        let typeInfo = ITEM_TYPES[Math.floor(qrand() * ITEM_TYPES.length)];
        items.push(new ItemOrb(paths[0].x, paths[0].y, typeInfo));
    }
}

function applyItemEffect(type, player) {
    if (type === 'time') {
        problemStartTime += 5000; 
        if (problemStartTime > Date.now()) problemStartTime = Date.now(); 
        createFloatingText(player.x, player.y - 20, "⏱️ +5 วินาที", "#10b981");
    } else if (type === 'freeze') {
        freezeGhostsUntil = Date.now() + (DATA.itemDuration || 5000); 
        createFloatingText(player.x, player.y - 20, "❄️ แช่แข็งผี!", "#60a5fa");
    } else if (type === 'shield') {
        player.invulnerable = 300; 
        createFloatingText(player.x, player.y - 20, "🛡️ เกราะป้องกัน!", "#f59e0b");
    }
    try { KAMPAI.sound.healthUp(); } catch(e) {}
}

function spawnGhosts(count) {
    ghosts = [];
    const paths = getEmptyPathTiles();
    for (let i = 0; i < count; i++) {
        ghosts.push(new Ghost(paths[i].x, paths[i].y));
    }
}

// Particle & Text FX
function createExplosion(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 2.5;
        particles.push({
            x: x, y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            color: color,
            life: 1.0,
            size: 2 + Math.random() * 3
        });
    }
}

function createFloatingText(x, y, text, color) {
    floatingTexts.push({ x, y, text, color, life: 1.0 });
}

function updateComboUI() {
    if (gameMode === 'coop') {
        let text = '';
        if (comboStreak >= 3) text += `🔥 P1 x${comboStreak} `;
        if (comboStreakP2 >= 3) text += `${text ? '| ' : ''}🔥 P2 x${comboStreakP2}`;
        
        if (text) {
            comboDisplay.innerText = text;
            comboDisplay.classList.remove('hidden');
            comboDisplay.classList.remove('animate-pop');
            void comboDisplay.offsetWidth;
            comboDisplay.classList.add('animate-pop');
        } else {
            comboDisplay.classList.add('hidden');
        }
    } else {
        if (comboStreak >= 3) {
            comboDisplay.innerText = `🔥 Combo x${comboStreak}!`;
            comboDisplay.classList.remove('hidden');
            comboDisplay.classList.remove('animate-pop');
            void comboDisplay.offsetWidth;
            comboDisplay.classList.add('animate-pop');
        } else {
            comboDisplay.classList.add('hidden');
        }
    }
}

// Initialize / Restart Game
function startGameInternal(mode, rngFn) {
    blocker.style.display = 'none';
    msgBox.style.display = 'none';
    isPlaying = true;
    gameMode = mode || 'single';
    score = 0;
    scoreP2 = 0;
    correctCount = 0;
    correctCountP2 = 0;
    comboStreak = 0;
    comboStreakP2 = 0;
    items = [];
    particles = [];
    floatingTexts = [];
    freezeGhostsUntil = 0;

    // Seeded Random Generator setup
    qrand = rngFn || Math.random;

    if (versusTimer) clearTimeout(versusTimer);

    // Dynamic HUD configurations
    const soloLabel = document.getElementById('soloScoreLabel');
    const coopLabel = document.getElementById('coopScoreLabel');

    if (gameMode === 'coop') {
        players = [
            new Player(1 * tileSize + tileSize/2, 1 * tileSize + tileSize/2, '#facc15', { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }, 1),
            new Player((cols - 2) * tileSize + tileSize/2, 1 * tileSize + tileSize/2, '#38bdf8', { up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD' }, 2)
        ];
        p2LivesContainer.style.display = 'inline-block';
        document.getElementById('controls-desc').innerText = "P1 (🟡): ลูกศร | P2 (🔵): WASD";
        if (soloLabel) soloLabel.classList.add('hidden');
        if (coopLabel) coopLabel.classList.remove('hidden');
    } else {
        players = [
            new Player(1 * tileSize + tileSize/2, 1 * tileSize + tileSize/2, '#facc15', { up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight' }, 1)
        ];
        p2LivesContainer.style.display = 'none';
        document.getElementById('controls-desc').innerText = "ผู้เล่น (🟡): ลูกศร หรือ WASD";
        if (soloLabel) soloLabel.classList.remove('hidden');
        if (coopLabel) coopLabel.classList.add('hidden');
    }

    updateUI();
    updateComboUI();
    spawnGhosts(6 + (gameMode === 'coop' ? 2 : 0)); 
    generateMathProblem();

    tryStartMusic();

    if (animationId) cancelAnimationFrame(animationId);
    animationId = requestAnimationFrame(update);
}

function updateUI() {
    if (gameMode === 'coop') {
        if (p1ScoreDisplay) p1ScoreDisplay.innerText = score;
        if (p2ScoreDisplay) p2ScoreDisplay.innerText = scoreP2;
    } else {
        if (scoreDisplay) scoreDisplay.innerText = score;
    }

    if (p1LivesDisplay) {
        p1LivesDisplay.innerText = players[0] && players[0].lives > 0 ? '❤️'.repeat(players[0].lives) : '💀';
    }
    if (gameMode === 'coop' && players[1] && p2LivesDisplay) {
        p2LivesDisplay.innerText = players[1].lives > 0 ? '❤️'.repeat(players[1].lives) : '💀';
    }
}

function checkCollisions() {
    for (let p of players) {
        if (p.isDead) continue;

        // Item collection check
        for (let i = items.length - 1; i >= 0; i--) {
            let item = items[i];
            const dx = p.x - item.x, dy = p.y - item.y;
            if (Math.sqrt(dx*dx + dy*dy) < p.radius + item.radius) {
                applyItemEffect(item.type, p);
                createExplosion(item.x, item.y, item.color, 12);
                items.splice(i, 1);
            }
        }

        // Answer collection check
        for (let i = answers.length - 1; i >= 0; i--) {
            let ans = answers[i];
            const dx = p.x - ans.x, dy = p.y - ans.y;
            if (Math.sqrt(dx*dx + dy*dy) < p.radius + ans.radius) {
                if (ans.isCorrect) {
                    try { KAMPAI.sound.correct(); } catch(e) {}
                    
                    if (p.id === 1) {
                        score += 10;
                        correctCount++;
                        comboStreak++;
                        createExplosion(ans.x, ans.y, '#facc15', 18);
                        createFloatingText(ans.x, ans.y, `P1 +10 ${comboStreak >= 3 ? `🔥` : ''}`, '#facc15');
                        
                        const popEl = (gameMode === 'coop') ? p1ScoreDisplay : scoreDisplay;
                        if (popEl) {
                            popEl.classList.remove('animate-pop-straight');
                            void popEl.offsetWidth; 
                            popEl.classList.add('animate-pop-straight');
                        }
                    } else {
                        scoreP2 += 10;
                        correctCountP2++;
                        comboStreakP2++;
                        createExplosion(ans.x, ans.y, '#38bdf8', 18);
                        createFloatingText(ans.x, ans.y, `P2 +10 ${comboStreakP2 >= 3 ? `🔥` : ''}`, '#38bdf8');
                        
                        if (p2ScoreDisplay) {
                            p2ScoreDisplay.classList.remove('animate-pop-straight');
                            void p2ScoreDisplay.offsetWidth; 
                            p2ScoreDisplay.classList.add('animate-pop-straight');
                        }
                    }

                    // Report score to Versus Mode (only relevant in versus mode, which only has P1 anyway)
                    if (gameMode === 'versus') {
                        vs.report(score, { correct: correctCount });
                    }

                    updateUI();
                    updateComboUI();

                    // Spawn extra ghosts as total score increases
                    const totalScore = score + scoreP2;
                    if (totalScore % 60 === 0 && ghosts.length < 15) {
                        const paths = getEmptyPathTiles();
                        if (paths.length > 0) ghosts.push(new Ghost(paths[0].x, paths[0].y));
                    }
                    
                    if (Math.random() < 0.4) spawnItem();

                    generateMathProblem(); 
                } else {
                    try { KAMPAI.sound.wrong(); } catch(e) {}
                    p.lives -= 1;
                    if (p.id === 1) comboStreak = 0; else comboStreakP2 = 0;
                    
                    createExplosion(ans.x, ans.y, '#ef4444', 15);
                    createFloatingText(ans.x, ans.y, `${p.id === 1 ? 'P1' : 'P2'} -1 Life ❌`, '#ef4444');
                    
                    if (p.lives <= 0) {
                        p.isDead = true;
                        createExplosion(p.x, p.y, p.color, 30);
                    }
                    updateUI();
                    updateComboUI();
                    answers.splice(i, 1); 
                    checkGameOver();
                }
            }
        }

        // Ghost collision check
        for (let g of ghosts) {
            const dx = p.x - g.x, dy = p.y - g.y;
            if (Math.sqrt(dx*dx + dy*dy) < p.radius + g.radius - 3) {
                if (p.invulnerable <= 0) {
                    try { KAMPAI.sound.wrong(); } catch(e) {}
                    p.lives -= 1;
                    if (p.id === 1) comboStreak = 0; else comboStreakP2 = 0;
                    createExplosion(p.x, p.y, '#ef4444', 20);
                    createFloatingText(p.x, p.y, `${p.id === 1 ? 'P1' : 'P2'} -1 Life 👻`, '#ef4444');
                    
                    if (p.lives <= 0) {
                        p.isDead = true;
                        createExplosion(p.x, p.y, p.color, 30);
                    } else {
                        // Respawn at starter tiles
                        p.x = (p.id === 1 ? 1 : cols - 2) * tileSize + tileSize/2;
                        p.y = 1 * tileSize + tileSize/2;
                        p.invulnerable = 120; 
                    }
                    updateUI();
                    updateComboUI();
                    checkGameOver();
                }
            }
        }
    }
}

function checkGameOver() {
    if (players.length > 0 && players.every(p => p.isDead)) {
        triggerGameOver("ผู้เล่นพ่ายแพ้ให้กับฝูงผีในเขาวงกต!");
    }
}

function triggerGameOver(reason) {
    isPlaying = false;
    if (versusTimer) clearTimeout(versusTimer);
    
    try {
        KAMPAI.sound.bgmStop();
        KAMPAI.sound.gameOver();
    } catch(e) {}
    
    // Submit score
    // Submit score (uses highest score for stats submission)
    const finalScore = Math.max(score, scoreP2);
    const finalCorrect = Math.max(correctCount, correctCountP2);

    let stars = 0;
    if (finalScore >= 120) stars = 3;
    else if (finalScore >= 70) stars = 2;
    else if (finalScore >= 30) stars = 1;
    
    // Let Versus framework handle versus screens, otherwise show solo overlays
    if (vs.finish(finalScore, { correct: finalCorrect })) return;

    KAMPAI.submitScore(finalScore, { stars: stars });
    
    const titleEl = document.getElementById('msg-title');
    const descEl = document.getElementById('msg-desc');
    
    if (titleEl) {
        titleEl.innerText = gameMode === 'coop' ? "สิ้นสุดการดวล!" : "สิ้นสุดภารกิจ!";
    }
    if (descEl) {
        if (gameMode === 'coop') {
            let winText = '';
            if (score > scoreP2) {
                winText = `<p class="text-xl font-bold text-yellow-400 mb-2">🎉 P1 (สีเหลือง) ชนะการดวล! 🎉</p>`;
            } else if (scoreP2 > score) {
                winText = `<p class="text-xl font-bold text-sky-400 mb-2">🎉 P2 (สีฟ้า) ชนะการดวล! 🎉</p>`;
            } else {
                winText = `<p class="text-xl font-bold text-slate-300 mb-2">🤝 ผลการดวล: เสมอกัน! 🤝</p>`;
            }
            descEl.innerHTML = `
                ${winText}
                <div class="flex justify-around items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800 my-3 text-sm">
                    <div class="text-center">
                        <span class="text-yellow-400 font-bold block mb-1">P1 Score (🟡)</span>
                        <span class="block text-2xl font-black text-white">${score}</span>
                        <span class="text-[10px] text-slate-500 block">ตอบถูก ${correctCount} ข้อ</span>
                    </div>
                    <div class="h-10 w-px bg-slate-800 mx-2"></div>
                    <div class="text-center">
                        <span class="text-sky-400 font-bold block mb-1">P2 Score (🔵)</span>
                        <span class="block text-2xl font-black text-white">${scoreP2}</span>
                        <span class="text-[10px] text-slate-500 block">ตอบถูก ${correctCountP2} ข้อ</span>
                    </div>
                </div>
            `;
        } else {
            descEl.innerHTML = `
                <p style="color:#f87171; font-weight:bold;">${reason}</p>
                <p>คะแนนสะสม: <strong class="text-xl text-yellow-400">${score}</strong> คะแนน</p>
                <p>ตอบคำถามถูกต้อง: <strong>${correctCount}</strong> ข้อ</p>
                <p class="mt-2 text-shadow-fire text-amber-500 font-bold">${'⭐'.repeat(stars) + '☆'.repeat(3 - stars)}</p>
            `;
        }
    }
    
    renderLeaderboard(KAMPAI.leaderboard, 'score-list-gameover');
    msgBox.classList.remove('hidden');
    equationDisplay.innerText = "จบเกม!";
}

// Game updates
function update() {
    if (!isPlaying) return;

    let elapsedTime = Date.now() - problemStartTime;
    let remaining = Math.max(0, problemDuration - elapsedTime);
    let percent = (remaining / problemDuration) * 100;
    
    if (timerBar) {
        timerBar.style.width = percent + '%';
        if (percent > 50) timerBar.className = 'bg-green-400 h-full w-full';
        else if (percent > 20) timerBar.className = 'bg-yellow-400 h-full w-full';
        else timerBar.className = 'bg-red-500 h-full w-full';
    }

    // Time penalty
    if (remaining === 0) {
        try { KAMPAI.sound.wrong(); } catch(e) {}
        score = Math.max(0, score - 5); 
        comboStreak = 0; 
        updateUI();
        updateComboUI();
        
        // Spawn helper ghost as time penalty
        if (ghosts.length < 18) {
            const paths = getEmptyPathTiles();
            if (paths.length > 0) ghosts.push(new Ghost(paths[0].x, paths[0].y));
        }
        
        generateMathProblem();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawMaze();

    // Items
    items.forEach(i => i.draw());
    
    // Answers
    answers.forEach(a => a.draw());
    
    // Players
    players.forEach(p => { p.update(); p.draw(); });
    
    // Ghosts
    ghosts.forEach(g => { g.update(); g.draw(); });

    // Particles
    particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        if (p.life <= 0) {
            particles.splice(idx, 1);
        } else {
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    });

    // Floating Texts
    floatingTexts.forEach((ft, idx) => {
        ft.y -= 0.7;
        ft.life -= 0.02;
        if (ft.life <= 0) {
            floatingTexts.splice(idx, 1);
        } else {
            ctx.fillStyle = ft.color;
            ctx.font = "bold 14px Kanit";
            ctx.textAlign = "center";
            ctx.globalAlpha = ft.life;
            ctx.fillText(ft.text, ft.x, ft.y);
            ctx.globalAlpha = 1.0;
        }
    });

    checkCollisions();

    if (isPlaying) {
        animationId = requestAnimationFrame(update);
    }
}

// Initial Map render
generateMap();
drawMaze();

// Resize Handler
window.addEventListener('resize', () => {
    if (!isPlaying) {
        generateMap();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawMaze();
    }
});

// Versus / Multiplayer Mode
let versusTimer = null;
const vs = KampaiVersus.create({
    duration: CONFIG.ROUND_SEC,
    title: 'Math-Man Co-op',
    rankBy: 'score',
    onPlay: ({ rng, player }) => {
        startGameInternal('versus', rng);
        if (versusTimer) clearTimeout(versusTimer);
        versusTimer = setTimeout(() => {
            triggerGameOver("หมดเวลาประลองรอบนี้!");
        }, CONFIG.ROUND_SEC * 1000);
    },
    onEnd: () => {
        if (versusTimer) clearTimeout(versusTimer);
        triggerGameOver("หมดเวลาประลอง!");
    }
});

// Global functions
window.startGame = function(mode) {
    startGameInternal(mode, Math.random);
};
window.toggleMusic = toggleMusic;
window.vs = vs;
