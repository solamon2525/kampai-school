// game.js — Core logic for Math Multiplication Kingdom

let currentTab = 'grouping';
let soundEnabled = true;
let audioCtx = null;

// Dynamic parameters for different modules
const state = {
    // Tab 1: Grouping
    grouping: {
        groups: 3,
        items: 4
    },
    // Tab 2: Sandbox
    sandbox: {
        rows: 0,
        cols: 0,
        isDrawing: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0
    },
    // Tab 3: Area Model (Box Method)
    area: {
        num1: 14, // Vertical height (Splits: 10 + 4)
        num2: 12  // Horizontal width (Splits: 10 + 2)
    },
    // Tab 4: Game Mission Quest
    game: {
        level: 1,
        stars: 0,
        highscore: 0,
        targetValue: 12,
        currentRows: 0,
        currentCols: 0,
        isDrawing: false,
        startX: 0,
        startY: 0,
        currentX: 0,
        currentY: 0
    }
};

const CONFIG = window.GAME_CONFIG || {
    SLUG: 'multiplication-kingdom',
    BGM: 'playful',
    GRID_CELL_SIZE: 35,
    GRID_PADDING: 40,
    MAX_LEVEL: 10
};

const DATA = window.GAME_DATA || {
    chatbotAnswers: {},
    gameTargets: [12, 16, 20, 24]
};

// Initialize App on Window Load
window.onload = function() {
    // Load highscore from localStorage if it exists
    const savedHighscore = localStorage.getItem('multiplication_highscore');
    if (savedHighscore) {
        state.game.highscore = parseInt(savedHighscore);
        const hsEl = document.getElementById('game-highscore');
        if (hsEl) hsEl.textContent = state.game.highscore;
    }
    
    // Set up views
    updateGrouping();
    initSandboxCanvas();
    updateAreaModel();
    initGameCanvas();
    generateNewGameTarget();
    showToast("ยินดีต้อนรับสู่อาณาจักรการคูณ!", "พร้อมแล้วลุยฝึกด้วยกันเลยจ้า!", "🎡");
};

// KAMPAI SDK binding
if (window.KAMPAI && window.KAMPAI.onReady) {
    window.KAMPAI.onReady((sdk) => {
        // Set stats
        const bestScore = sdk.stats?.high_score || sdk.stats?.personalBest || 0;
        const playCount = sdk.stats?.play_count || sdk.stats?.playsCount || 0;
        
        const bestEl = document.getElementById('ms-best');
        const playsEl = document.getElementById('ms-plays');
        if (bestEl) bestEl.textContent = bestScore;
        if (playsEl) playsEl.textContent = playCount;

        if (sdk.student) {
            const chip = document.getElementById('player-chip');
            if (chip) {
                const studentName = sdk.student.displayName || sdk.student.name || 'นักเรียน';
                chip.textContent = studentName.charAt(0);
            }
            const nameEl = document.getElementById('player-display-name');
            if (nameEl) {
                nameEl.textContent = sdk.student.displayName || sdk.student.name || 'นักเรียน';
            }
        }

        // Start BGM
        if (sdk.sound && typeof sdk.sound.bgmStart === 'function') {
            sdk.sound.bgmStart(CONFIG.BGM);
        }
    });
}

// Synthesizes simple retro sounds so that external files are not needed
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function playSound(type) {
    // If KAMPAI SDK sound functions are available, try using them
    if (window.KAMPAI && window.KAMPAI.sound) {
        const sound = window.KAMPAI.sound;
        if (type === 'success' && typeof sound.correct === 'function') {
            sound.correct();
            return;
        } else if (type === 'fail' && typeof sound.wrong === 'function') {
            sound.wrong();
            return;
        }
    }

    if (!soundEnabled) return;
    try {
        initAudio();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        if (type === 'success') {
            // Two-tone happy ascending notes
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        } else if (type === 'fail') {
            // Sad buzzing noise descending
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(80, audioCtx.currentTime + 0.25);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.25);
        } else if (type === 'click') {
            // Small visual pop
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.05);
            gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.05);
        } else if (type === 'levelup') {
            // Grand fanfare
            const now = audioCtx.currentTime;
            const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // Major chords ascending
            notes.forEach((freq, idx) => {
                const subOsc = audioCtx.createOscillator();
                const subGain = audioCtx.createGain();
                subOsc.type = 'square';
                subOsc.frequency.setValueAtTime(freq, now + idx * 0.08);
                subOsc.connect(subGain);
                subGain.connect(audioCtx.destination);
                subGain.gain.setValueAtTime(0.08, now + idx * 0.08);
                subGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4);
                subOsc.start(now + idx * 0.08);
                subOsc.stop(now + idx * 0.08 + 0.4);
            });
        }
    } catch (err) {
        console.warn("Sound context error:", err);
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const btn = document.getElementById('soundBtn');
    const icon = document.getElementById('soundIcon');
    const text = document.getElementById('soundText');
    if (soundEnabled) {
        icon.textContent = "🔊";
        text.textContent = "เปิดเสียงเอฟเฟกต์";
        btn.className = "bouncy-btn px-4 py-2 bg-emerald-700 hover:bg-emerald-800 rounded-full text-xs md:text-sm font-medium flex items-center gap-2 shadow-md";
        playSound('click');
    } else {
        icon.textContent = "🔇";
        text.textContent = "ปิดเสียงอยู่";
        btn.className = "bouncy-btn px-4 py-2 bg-slate-600 hover:bg-slate-700 rounded-full text-xs md:text-sm font-medium flex items-center gap-2 shadow-md";
    }
}

function switchTab(tabId) {
    currentTab = tabId;
    playSound('click');
    
    // Toggle view panels
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.getElementById(`content-${tabId}`).classList.remove('hidden');

    // Reset navigation tab button designs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.className = "tab-btn flex-1 min-w-[120px] py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 text-slate-600 hover:bg-slate-50";
    });
    
    const activeBtn = document.getElementById(`tab-${tabId}`);
    if (activeBtn) {
        activeBtn.className = "tab-btn flex-1 min-w-[120px] py-3 px-4 rounded-xl text-sm font-medium transition-all duration-300 flex items-center justify-center gap-2 bg-emerald-500 text-white shadow-md";
    }

    // Perform individual view refresh trigger actions
    if (tabId === 'sandbox') {
        setTimeout(resizeSandboxCanvas, 50);
    } else if (tabId === 'game') {
        setTimeout(resizeGameCanvas, 50);
    }
}

// Custom notification banner function instead of raw alerts
function showToast(title, description, icon = "📢", duration = 4000) {
    const toast = document.getElementById('toast-banner');
    if (!toast) return;
    document.getElementById('toast-title').textContent = title;
    document.getElementById('toast-desc').textContent = description;
    document.getElementById('toast-icon').textContent = icon;
    
    toast.className = "opacity-100 translate-y-0 transition-all duration-300 bg-emerald-950 text-emerald-100 p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-800 text-xs md:text-sm";
    
    setTimeout(() => {
        toast.className = "opacity-0 translate-y-4 pointer-events-none transition-all duration-300 bg-emerald-950 text-emerald-100 p-4 rounded-2xl shadow-xl flex items-center gap-3 border border-emerald-800 text-xs md:text-sm";
    }, duration);
}

function updateGrouping() {
    const groups = parseInt(document.getElementById('slider-groups').value);
    const items = parseInt(document.getElementById('slider-items').value);
    
    state.grouping.groups = groups;
    state.grouping.items = items;

    // Update numeric values on user screen
    document.getElementById('group-val').textContent = `${groups} จาน`;
    document.getElementById('item-val').textContent = `${items} ผล`;
    document.getElementById('eq-groups').textContent = groups;
    document.getElementById('eq-items').textContent = items;
    
    const result = groups * items;
    document.getElementById('eq-result').textContent = result;

    // Generate addition text representation
    let addChain = "";
    for (let i = 0; i < groups; i++) {
        addChain += items;
        if (i < groups - 1) addChain += " + ";
    }
    document.getElementById('addition-chain').textContent = `ก็คือมีส้มจานละ ${items} ผล มารวมกัน ${groups} ครั้ง: ${addChain} = ${result} ผลนั่นเอง! 🎉`;

    // Draw orange plates in container dynamically
    const container = document.getElementById('grouping-visualization');
    container.innerHTML = "";

    for (let g = 0; g < groups; g++) {
        // Generate outer plate representation
        const plate = document.createElement('div');
        plate.className = "relative w-28 h-28 md:w-32 md:h-32 rounded-full bg-orange-100/60 border-4 border-orange-200/80 shadow-md flex justify-center items-center p-3 transition-all transform hover:scale-105 duration-300";
        
        // Add inner circle grid plate layout for fruits
        const gridDiv = document.createElement('div');
        gridDiv.className = "grid grid-cols-3 gap-1.5 justify-center items-center w-full h-full";
        
        for (let i = 0; i < items; i++) {
            const fruit = document.createElement('div');
            fruit.className = "text-xl md:text-2xl animate-bounce flex items-center justify-center";
            fruit.style.animationDelay = `${i * 100}ms`;
            fruit.textContent = "🍊";
            gridDiv.appendChild(fruit);
        }
        
        // Plate labels representing index counts
        const label = document.createElement('span');
        label.className = "absolute -top-2 -right-2 bg-orange-500 text-white font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-md";
        label.textContent = g + 1;
        
        plate.appendChild(gridDiv);
        plate.appendChild(label);
        container.appendChild(plate);
    }
}

// ─── TAB 2: SANDBOX CANVAS ──────────────────────────────────────────────────
const sbCanvas = document.getElementById('sandboxCanvas');
const sbCtx = sbCanvas ? sbCanvas.getContext('2d') : null;
const gridCellSize = CONFIG.GRID_CELL_SIZE;
const gridPadding = CONFIG.GRID_PADDING;

function initSandboxCanvas() {
    if (!sbCanvas) return;
    // Set up mouse and touch listeners for interactive drawing
    sbCanvas.addEventListener('mousedown', handleSBMouseDown);
    sbCanvas.addEventListener('mousemove', handleSBMouseMove);
    window.addEventListener('mouseup', handleSBMouseUp);

    sbCanvas.addEventListener('touchstart', handleSBTouchStart, { passive: false });
    sbCanvas.addEventListener('touchmove', handleSBTouchMove, { passive: false });
    window.addEventListener('touchend', handleSBTouchEnd);

    window.addEventListener('resize', resizeSandboxCanvas);
}

function resizeSandboxCanvas() {
    if (currentTab !== 'sandbox' || !sbCanvas) return;
    // Adaptive width sizing
    const containerWidth = sbCanvas.parentElement.clientWidth;
    sbCanvas.width = Math.min(containerWidth - 24, 520);
    sbCanvas.height = 360;
    drawSandboxGrid();
}

function drawSandboxGrid() {
    if (!sbCtx) return; // JSDOM null guard
    sbCtx.clearRect(0, 0, sbCanvas.width, sbCanvas.height);
    
    // Draw baseline coordinate guidelines
    sbCtx.strokeStyle = "#e2e8f0";
    sbCtx.lineWidth = 1;

    const maxCols = Math.floor((sbCanvas.width - gridPadding * 2) / gridCellSize);
    const maxRows = Math.floor((sbCanvas.height - gridPadding * 2) / gridCellSize);

    // Draw underlying coordinate grid dots and numbers
    for (let c = 0; c <= maxCols; c++) {
        const x = gridPadding + c * gridCellSize;
        sbCtx.beginPath();
        sbCtx.moveTo(x, gridPadding);
        sbCtx.lineTo(x, gridPadding + maxRows * gridCellSize);
        sbCtx.stroke();

        // Draw header numbers on X coordinate
        if (c > 0 && c <= maxCols) {
            sbCtx.fillStyle = "#64748b";
            sbCtx.font = "bold 11px Mitra, Sarabun, sans-serif";
            sbCtx.textAlign = "center";
            sbCtx.fillText(c, x - gridCellSize/2, gridPadding - 8);
        }
    }

    for (let r = 0; r <= maxRows; r++) {
        const y = gridPadding + r * gridCellSize;
        sbCtx.beginPath();
        sbCtx.moveTo(gridPadding, y);
        sbCtx.lineTo(gridPadding + maxCols * gridCellSize, y);
        sbCtx.stroke();

        // Draw header numbers on Y coordinate
        if (r > 0 && r <= maxRows) {
            sbCtx.fillStyle = "#64748b";
            sbCtx.font = "bold 11px Mitra, Sarabun, sans-serif";
            sbCtx.textAlign = "right";
            sbCtx.fillText(r, gridPadding - 10, y - gridCellSize/2 + 4);
        }
    }

    // Draw selected rectangle bounds
    if (state.sandbox.rows > 0 && state.sandbox.cols > 0) {
        const startC = Math.min(state.sandbox.startX, state.sandbox.currentX);
        const startR = Math.min(state.sandbox.startY, state.sandbox.currentY);
        const selWidth = state.sandbox.cols * gridCellSize;
        const selHeight = state.sandbox.rows * gridCellSize;

        // Fill glowing background of selected vegetable garden
        sbCtx.fillStyle = "rgba(245, 158, 11, 0.15)"; // Soft golden orange background
        sbCtx.fillRect(gridPadding + startC * gridCellSize, gridPadding + startR * gridCellSize, selWidth, selHeight);

        // Draw thick highlight stroke borders
        sbCtx.strokeStyle = "#f59e0b";
        sbCtx.lineWidth = 3;
        sbCtx.strokeRect(gridPadding + startC * gridCellSize, gridPadding + startR * gridCellSize, selWidth, selHeight);

        // Draw carrot emojis 🥕 inside vegetable patches dynamically
        for (let r = 0; r < state.sandbox.rows; r++) {
            for (let c = 0; c < state.sandbox.cols; c++) {
                const iconX = gridPadding + (startC + c) * gridCellSize + gridCellSize / 2;
                const iconY = gridPadding + (startR + r) * gridCellSize + gridCellSize / 2 + 5;
                sbCtx.font = "18px Apple Color Emoji, Segoe UI Emoji";
                sbCtx.textAlign = "center";
                sbCtx.fillText("🥕", iconX, iconY);
            }
        }
    }
}

// Translates screen events (pixels) to Grid Coordinates (Rows, Cols)
function getGridCoordinates(clientX, clientY, canvasElement) {
    const rect = canvasElement.getBoundingClientRect();
    const x = clientX - rect.left - gridPadding;
    const y = clientY - rect.top - gridPadding;

    const col = Math.floor(x / gridCellSize);
    const row = Math.floor(y / gridCellSize);
    
    const maxCols = Math.floor((canvasElement.width - gridPadding * 2) / gridCellSize);
    const maxRows = Math.floor((canvasElement.height - gridPadding * 2) / gridCellSize);

    return {
        col: Math.max(0, Math.min(col, maxCols - 1)),
        row: Math.max(0, Math.min(row, maxRows - 1))
    };
}

function handleSBMouseDown(e) {
    initAudio();
    const coords = getGridCoordinates(e.clientX, e.clientY, sbCanvas);
    state.sandbox.isDrawing = true;
    state.sandbox.startX = coords.col;
    state.sandbox.startY = coords.row;
    state.sandbox.currentX = coords.col;
    state.sandbox.currentY = coords.row;
    updateSandboxSelection();
}

function handleSBMouseMove(e) {
    if (!state.sandbox.isDrawing) return;
    const coords = getGridCoordinates(e.clientX, e.clientY, sbCanvas);
    state.sandbox.currentX = coords.col;
    state.sandbox.currentY = coords.row;
    updateSandboxSelection();
}

function handleSBMouseUp() {
    if (!state.sandbox.isDrawing) return;
    state.sandbox.isDrawing = false;
    playSound('success');
    
    const equation = `${state.sandbox.rows} × ${state.sandbox.cols} = ${state.sandbox.rows * state.sandbox.cols}`;
    showToast("วาดแปลงผักสำเร็จ!", `แปลงขนาด ${equation} สวยงามมากจ้า!`, "🥕");
}

function handleSBTouchStart(e) {
    e.preventDefault();
    initAudio();
    const touch = e.touches[0];
    const coords = getGridCoordinates(touch.clientX, touch.clientY, sbCanvas);
    state.sandbox.isDrawing = true;
    state.sandbox.startX = coords.col;
    state.sandbox.startY = coords.row;
    state.sandbox.currentX = coords.col;
    state.sandbox.currentY = coords.row;
    updateSandboxSelection();
}

function handleSBTouchMove(e) {
    if (!state.sandbox.isDrawing) return;
    e.preventDefault();
    const touch = e.touches[0];
    const coords = getGridCoordinates(touch.clientX, touch.clientY, sbCanvas);
    state.sandbox.currentX = coords.col;
    state.sandbox.currentY = coords.row;
    updateSandboxSelection();
}

function handleSBTouchEnd() {
    handleSBMouseUp();
}

function updateSandboxSelection() {
    const minC = Math.min(state.sandbox.startX, state.sandbox.currentX);
    const maxC = Math.max(state.sandbox.startX, state.sandbox.currentX);
    const minR = Math.min(state.sandbox.startY, state.sandbox.currentY);
    const maxR = Math.max(state.sandbox.startY, state.sandbox.currentY);

    state.sandbox.cols = maxC - minC + 1;
    state.sandbox.rows = maxR - minR + 1;

    // Render stats inside display panels
    document.getElementById('sb-rows').textContent = state.sandbox.rows;
    document.getElementById('sb-cols').textContent = state.sandbox.cols;
    
    const total = state.sandbox.rows * state.sandbox.cols;
    document.getElementById('sb-total').textContent = `${total} ช่อง`;
    document.getElementById('sb-equation').textContent = `${state.sandbox.rows} × ${state.sandbox.cols} = ${total}`;

    drawSandboxGrid();
}

function clearSandbox() {
    playSound('click');
    state.sandbox.rows = 0;
    state.sandbox.cols = 0;
    state.sandbox.isDrawing = false;
    document.getElementById('sb-rows').textContent = 0;
    document.getElementById('sb-cols').textContent = 0;
    document.getElementById('sb-total').textContent = "0 ช่อง";
    document.getElementById('sb-equation').textContent = "0 × 0 = 0";
    drawSandboxGrid();
}

// ─── TAB 3: AREA MODEL (BOX METHOD) ─────────────────────────────────────────
function updateAreaModel() {
    const num1 = parseInt(document.getElementById('slider-area-num1').value);
    const num2 = parseInt(document.getElementById('slider-area-num2').value);

    state.area.num1 = num1;
    state.area.num2 = num2;

    const u1 = num1 - 10;
    const u2 = num2 - 10;

    // Update textual indicators
    document.getElementById('area-num1-val').textContent = `${num1} (แยกเป็น 10 + ${u1})`;
    document.getElementById('area-num2-val').textContent = `${num2} (แยกเป็น 10 + ${u2})`;

    // Core sub calculations
    const areaA = 100;         // 10 * 10
    const areaB = 10 * u2;      // 10 * u2
    const areaC = u1 * 10;      // u1 * 10
    const areaD = u1 * u2;      // u1 * u2
    const totalResult = num1 * num2;

    // Build the SVG representational grid
    // Width parts: Tens (160px), Units (u2 * 10px). Margins: 40px
    const w1 = 160;
    const w2 = u2 * 10;
    // Height parts: Tens (160px), Units (u1 * 10px)
    const h1 = 160;
    const h2 = u1 * 10;

    const svgWidth = 40 + w1 + w2 + 40;
    const svgHeight = 40 + h1 + h2 + 40;

    const container = document.getElementById('area-model-container');
    if (container) {
        container.innerHTML = `
            <svg viewBox="0 0 ${svgWidth} ${svgHeight}" class="w-full max-w-[340px] md:max-w-[380px] h-auto shadow-inner bg-white rounded-2xl border border-slate-100 p-2">
                <!-- Grid Lines and Blocks -->
                <!-- A: Top-Left (Tens * Tens) -->
                <rect x="40" y="40" width="${w1}" height="${h1}" fill="#fee2e2" stroke="#f87171" stroke-width="2" rx="4" />
                <text x="${40 + w1/2}" y="${40 + h1/2}" font-family="Mitra, Sarabun, sans-serif" font-size="12" font-weight="bold" fill="#991b1b" text-anchor="middle">10 × 10</text>
                <text x="${40 + w1/2}" y="${40 + h1/2 + 18}" font-family="Mitra, Sarabun, sans-serif" font-size="14" font-weight="extrabold" fill="#b91c1c" text-anchor="middle">= ${areaA}</text>

                <!-- B: Top-Right (Tens * Units) -->
                <rect x="${40 + w1}" y="40" width="${w2}" height="${h1}" fill="#e0e7ff" stroke="#818cf8" stroke-width="2" rx="4" />
                <text x="${40 + w1 + w2/2}" y="${40 + h1/2}" font-family="Mitra, Sarabun, sans-serif" font-size="12" font-weight="bold" fill="#3730a3" text-anchor="middle">10 × ${u2}</text>
                <text x="${40 + w1 + w2/2}" y="${40 + h1/2 + 18}" font-family="Mitra, Sarabun, sans-serif" font-size="14" font-weight="extrabold" fill="#4f46e5" text-anchor="middle">= ${areaB}</text>

                <!-- C: Bottom-Left (Units * Tens) -->
                <rect x="40" y="${40 + h1}" width="${w1}" height="${h2}" fill="#dcfce7" stroke="#4ade80" stroke-width="2" rx="4" />
                <text x="${40 + w1/2}" y="${40 + h1 + h2/2}" font-family="Mitra, Sarabun, sans-serif" font-size="12" font-weight="bold" fill="#166534" text-anchor="middle">${u1} × 10</text>
                <text x="${40 + w1/2}" y="${40 + h1 + h2/2 + 16}" font-family="Mitra, Sarabun, sans-serif" font-size="14" font-weight="extrabold" fill="#15803d" text-anchor="middle">= ${areaC}</text>

                <!-- D: Bottom-Right (Units * Units) -->
                <rect x="${40 + w1}" y="${40 + h1}" width="${w2}" height="${h2}" fill="#fef9c3" stroke="#facc15" stroke-width="2" rx="4" />
                <text x="${40 + w1 + w2/2}" y="${40 + h1 + h2/2}" font-family="Mitra, Sarabun, sans-serif" font-size="11" font-weight="bold" fill="#854d0e" text-anchor="middle">${u1} × ${u2}</text>
                <text x="${40 + w1 + w2/2}" y="${40 + h1 + h2/2 + 16}" font-family="Mitra, Sarabun, sans-serif" font-size="13" font-weight="extrabold" fill="#ca8a04" text-anchor="middle">= ${areaD}</text>

                <!-- Side Labels (Outside Dimensions) -->
                <!-- Top -->
                <text x="${40 + w1/2}" y="25" font-family="Mitra, Sarabun, sans-serif" font-size="12" font-weight="bold" fill="#4f46e5" text-anchor="middle">10</text>
                <text x="${40 + w1 + w2/2}" y="25" font-family="Mitra, Sarabun, sans-serif" font-size="12" font-weight="bold" fill="#4f46e5" text-anchor="middle">${u2}</text>
                <!-- Left -->
                <text x="25" y="${40 + h1/2 + 4}" font-family="Mitra, Sarabun, sans-serif" font-size="12" font-weight="bold" fill="#b91c1c" text-anchor="middle">10</text>
                <text x="25" y="${40 + h1 + h2/2 + 4}" font-family="Mitra, Sarabun, sans-serif" font-size="12" font-weight="bold" fill="#b91c1c" text-anchor="middle">${u1}</text>
            </svg>
        `;
    }

    // Process sum mathematical representation
    const sumEl = document.getElementById('area-calculation-sum');
    if (sumEl) {
        sumEl.innerHTML = `
            <div class="flex flex-wrap items-center justify-center gap-1.5 md:gap-2">
                <span class="px-2.5 py-1 bg-red-100 text-red-700 rounded-lg shadow-sm text-xs md:text-sm font-bold">${areaA}</span>
                <span class="text-slate-400 font-bold">+</span>
                <span class="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-lg shadow-sm text-xs md:text-sm font-bold">${areaB}</span>
                <span class="text-slate-400 font-bold">+</span>
                <span class="px-2.5 py-1 bg-green-100 text-green-700 rounded-lg shadow-sm text-xs md:text-sm font-bold">${areaC}</span>
                <span class="text-slate-400 font-bold">+</span>
                <span class="px-2.5 py-1 bg-yellow-100 text-yellow-700 rounded-lg shadow-sm text-xs md:text-sm font-bold">${areaD}</span>
                <span class="text-slate-500 font-extrabold text-sm mx-1">=</span>
                <span class="px-3.5 py-1.5 bg-emerald-600 text-white rounded-xl shadow-md text-sm md:text-base font-extrabold">${totalResult}</span>
            </div>
        `;
    }
}

// ─── TAB 4: SECRET AGENT GAME QUEST ──────────────────────────────────────────
const gameCanvas = document.getElementById('gameCanvas');
const gameCtx = gameCanvas ? gameCanvas.getContext('2d') : null;

function initGameCanvas() {
    if (!gameCanvas) return;
    // Set up mouse and touch listeners for interactive drawing
    gameCanvas.addEventListener('mousedown', handleGameMouseDown);
    gameCanvas.addEventListener('mousemove', handleGameMouseMove);
    window.addEventListener('mouseup', handleGameMouseUp);

    gameCanvas.addEventListener('touchstart', handleGameTouchStart, { passive: false });
    gameCanvas.addEventListener('touchmove', handleGameTouchMove, { passive: false });
    window.addEventListener('touchend', handleGameTouchEnd);

    window.addEventListener('resize', resizeGameCanvas);
}

function resizeGameCanvas() {
    if (currentTab !== 'game' || !gameCanvas) return;
    const containerWidth = gameCanvas.parentElement.clientWidth;
    gameCanvas.width = Math.min(containerWidth - 24, 520);
    gameCanvas.height = 360;
    drawGameGrid();
}

function drawGameGrid() {
    if (!gameCtx) return; // JSDOM null guard
    gameCtx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Draw baseline coordinate guidelines
    gameCtx.strokeStyle = "#cbd5e1";
    gameCtx.lineWidth = 1;

    const maxCols = Math.floor((gameCanvas.width - gridPadding * 2) / gridCellSize);
    const maxRows = Math.floor((gameCanvas.height - gridPadding * 2) / gridCellSize);

    // Draw grid intersections and indices
    for (let c = 0; c <= maxCols; c++) {
        const x = gridPadding + c * gridCellSize;
        gameCtx.beginPath();
        gameCtx.moveTo(x, gridPadding);
        gameCtx.lineTo(x, gridPadding + maxRows * gridCellSize);
        gameCtx.stroke();

        if (c > 0 && c <= maxCols) {
            gameCtx.fillStyle = "#475569";
            gameCtx.font = "bold 11px Mitra, Sarabun, sans-serif";
            gameCtx.textAlign = "center";
            gameCtx.fillText(c, x - gridCellSize/2, gridPadding - 8);
        }
    }

    for (let r = 0; r <= maxRows; r++) {
        const y = gridPadding + r * gridCellSize;
        gameCtx.beginPath();
        gameCtx.moveTo(gridPadding, y);
        gameCtx.lineTo(gridPadding + maxCols * gridCellSize, y);
        gameCtx.stroke();

        if (r > 0 && r <= maxRows) {
            gameCtx.fillStyle = "#475569";
            gameCtx.font = "bold 11px Mitra, Sarabun, sans-serif";
            gameCtx.textAlign = "right";
            gameCtx.fillText(r, gridPadding - 10, y - gridCellSize/2 + 4);
        }
    }

    // Draw active drawing boundaries
    if (state.game.currentRows > 0 && state.game.currentCols > 0) {
        const startC = Math.min(state.game.startX, state.game.currentX);
        const startR = Math.min(state.game.startY, state.game.currentY);
        const selWidth = state.game.currentCols * gridCellSize;
        const selHeight = state.game.currentRows * gridCellSize;

        // Glowing selection rectangle
        gameCtx.fillStyle = "rgba(79, 70, 229, 0.15)"; // Indigo tint
        gameCtx.fillRect(gridPadding + startC * gridCellSize, gridPadding + startR * gridCellSize, selWidth, selHeight);

        gameCtx.strokeStyle = "#4f46e5";
        gameCtx.lineWidth = 3;
        gameCtx.strokeRect(gridPadding + startC * gridCellSize, gridPadding + startR * gridCellSize, selWidth, selHeight);

        // Draw diamonds 💎 inside grid cells
        for (let r = 0; r < state.game.currentRows; r++) {
            for (let c = 0; c < state.game.currentCols; c++) {
                const iconX = gridPadding + (startC + c) * gridCellSize + gridCellSize / 2;
                const iconY = gridPadding + (startR + r) * gridCellSize + gridCellSize / 2 + 5;
                gameCtx.font = "18px Apple Color Emoji, Segoe UI Emoji";
                gameCtx.textAlign = "center";
                gameCtx.fillText("💎", iconX, iconY);
            }
        }
    }
}

function handleGameMouseDown(e) {
    initAudio();
    const coords = getGridCoordinates(e.clientX, e.clientY, gameCanvas);
    state.game.isDrawing = true;
    state.game.startX = coords.col;
    state.game.startY = coords.row;
    state.game.currentX = coords.col;
    state.game.currentY = coords.row;
    updateGameSelection();
}

function handleGameMouseMove(e) {
    if (!state.game.isDrawing) return;
    const coords = getGridCoordinates(e.clientX, e.clientY, gameCanvas);
    state.game.currentX = coords.col;
    state.game.currentY = coords.row;
    updateGameSelection();
}

function handleGameMouseUp() {
    if (!state.game.isDrawing) return;
    state.game.isDrawing = false;
    playSound('click');
}

function handleGameTouchStart(e) {
    e.preventDefault();
    initAudio();
    const touch = e.touches[0];
    const coords = getGridCoordinates(touch.clientX, touch.clientY, gameCanvas);
    state.game.isDrawing = true;
    state.game.startX = coords.col;
    state.game.startY = coords.row;
    state.game.currentX = coords.col;
    state.game.currentY = coords.row;
    updateGameSelection();
}

function handleGameTouchMove(e) {
    if (!state.game.isDrawing) return;
    e.preventDefault();
    const touch = e.touches[0];
    const coords = getGridCoordinates(touch.clientX, touch.clientY, gameCanvas);
    state.game.currentX = coords.col;
    state.game.currentY = coords.row;
    updateGameSelection();
}

function handleGameTouchEnd() {
    handleGameMouseUp();
}

function updateGameSelection() {
    const minC = Math.min(state.game.startX, state.game.currentX);
    const maxC = Math.max(state.game.startX, state.game.currentX);
    const minR = Math.min(state.game.startY, state.game.currentY);
    const maxR = Math.max(state.game.startY, state.game.currentY);

    state.game.currentCols = maxC - minC + 1;
    state.game.currentRows = maxR - minR + 1;

    const total = state.game.currentRows * state.game.currentCols;
    const equationText = `${state.game.currentRows} × ${state.game.currentCols} = ${total} ช่อง`;
    document.getElementById('game-current-match').textContent = equationText;

    drawGameGrid();
}

function generateNewGameTarget() {
    const targetIdx = Math.floor(Math.random() * DATA.gameTargets.length);
    state.game.targetValue = DATA.gameTargets[targetIdx];
    
    document.getElementById('game-instruction').textContent = `สร้างพื้นที่ขนาด ${state.game.targetValue} ช่อง!`;
    
    // Clear old drawings
    state.game.currentCols = 0;
    state.game.currentRows = 0;
    state.game.isDrawing = false;
    document.getElementById('game-current-match').textContent = "0 × 0 = 0 ช่อง";
    
    drawGameGrid();
}

function submitGameGuess() {
    const drawnArea = state.game.currentRows * state.game.currentCols;
    if (drawnArea === 0) {
        showToast("คำเตือน!", "เด็กๆ ต้องคลิกแล้วลากสร้างรูปกล่องแปลงผักก่อนนะจ๊ะ!", "⚠️");
        return;
    }

    if (drawnArea === state.game.targetValue) {
        // Correct answer!
        playSound('success');
        state.game.stars++;
        
        // Update highscore
        if (state.game.stars > state.game.highscore) {
            state.game.highscore = state.game.stars;
            localStorage.setItem('multiplication_highscore', state.game.highscore);
            const hsEl = document.getElementById('game-highscore');
            if (hsEl) hsEl.textContent = state.game.highscore;
        }

        // Increment Level
        state.game.level = Math.floor(state.game.stars / 2) + 1;
        document.getElementById('game-level').textContent = `เลเวล ${state.game.level}`;
        document.getElementById('game-stars').textContent = state.game.stars;

        // Submit Score to SDK
        if (window.KAMPAI && typeof window.KAMPAI.submitScore === 'function') {
            window.KAMPAI.submitScore(state.game.stars, { mode: 'stars' });
        }

        showToast("ถูกต้องจ้า! 🎉", `ยอดเยี่ยมมาก! ได้รับพลังงาน ${state.game.currentRows} × ${state.game.currentCols} = ${drawnArea} ช่องพอดีเลย!`, "✨");
        
        // Next stage
        setTimeout(generateNewGameTarget, 2000);
    } else {
        // Incorrect answer
        playSound('fail');
        showToast("ยังไม่ตรงจ้า! ❌", `พื้นที่ที่วาดได้คือ ${drawnArea} ช่อง แต่โจทย์ต้องการ ${state.game.targetValue} ช่องจ้า ลองวางแผนหาตัวเลขคูณตัวอื่นๆ ดูใหม่นะ!`, "💡");
    }
}

// ─── CHATBOT logic "ครูพี่คูณ" ──────────────────────────────────────────────
function quickAsk(text) {
    const input = document.getElementById('ai-chat-input');
    if (input) {
        input.value = text;
        const form = document.getElementById('ai-chat-form');
        if (form) {
            const ev = { preventDefault() {} };
            handleChatSubmit(ev);
        }
    }
}

function askAIAssistant(moduleType) {
    let text = "";
    if (moduleType === 'grouping') {
        text = "ช่วยอธิบายสวนส้มในหน้านี้หน่อยครับ";
    } else if (moduleType === 'sandbox') {
        text = "ช่วยอธิบายแปลงผักนักลากหน่อยครับ";
    } else if (moduleType === 'area') {
        text = "ช่วยอธิบายกล่องแผนที่พลังสิบให้เข้าใจง่ายขึ้นหน่อยค่ะ";
    } else if (moduleType === 'game') {
        text = "ด่านสายลับนี้มีวิธีเล่นอย่างไรบ้างครับ";
    }
    quickAsk(text);
}

function addChatMessage(sender, text) {
    const chatHistory = document.getElementById('ai-chat-history');
    if (!chatHistory) return;

    const bubble = document.createElement('div');
    if (sender === 'user') {
        bubble.className = "flex gap-2.5 items-start justify-end";
        bubble.innerHTML = `
            <div class="bg-emerald-500 text-white p-3 rounded-2xl rounded-tr-none shadow-sm text-xs md:text-sm max-w-[85%] leading-relaxed">
                ${text}
            </div>
            <div class="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center text-sm shadow-inner flex-shrink-0">
                👤
            </div>
        `;
    } else {
        bubble.className = "flex gap-2.5 items-start";
        bubble.innerHTML = `
            <div class="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center text-sm shadow-inner flex-shrink-0">
                🤖
            </div>
            <div class="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-emerald-100 text-xs md:text-sm max-w-[85%] text-slate-700 leading-relaxed">
                ${text}
            </div>
        `;
    }
    chatHistory.appendChild(bubble);
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

function handleChatSubmit(e) {
    if (e && typeof e.preventDefault === 'function') {
        e.preventDefault();
    }
    
    const input = document.getElementById('ai-chat-input');
    if (!input) return;

    const text = input.value.trim();
    if (!text) return;

    // Add user message
    addChatMessage('user', text);
    input.value = "";

    // Math calculation regex matching
    let responseText = "";
    const mathRegex = /(\d+)\s*(?:x|×|\*|คูณ)\s*(\d+)/i;
    const match = text.match(mathRegex);

    if (match) {
        const n1 = parseInt(match[1]);
        const n2 = parseInt(match[2]);
        if (n1 > 100 || n2 > 100) {
            responseText = `โอ้โห เลขเยอะจังเลยครับ! ${n1} คูณ ${n2} ได้คำตอบเป็น ${n1 * n2} จ้า (พี่แนะนำให้ทดลองลากเล่นกับเลขตัวน้อยลงในแปลงผักก่อนจะจำได้ดีขึ้นนะจ๊ะ!)`;
        } else {
            const product = n1 * n2;
            let addition = "";
            const minTerms = Math.min(n1, 10); // cap display chain length to avoid text spill
            for (let i = 0; i < minTerms; i++) {
                addition += n2;
                if (i < minTerms - 1) addition += " + ";
            }
            if (n1 > 10) addition += ` ... (บวกกันทั้งหมด ${n1} ตัว)`;
            
            responseText = `**${n1} × ${n2}** ได้ผลคูณเป็น **${product}** ครับเด็กๆ! ✨ \n\nอธิบายคือเราเอา **${n2}** มาบวกซ้ำกัน **${n1}** ครั้ง: \n${addition} = ${product} ผลลัพธ์พอดีเป๊ะครับ!`;
        }
    } else {
        // Search pre-coded answers
        let found = false;
        const answers = DATA.chatbotAnswers;
        for (const key in answers) {
            const dataObj = answers[key];
            const hasKeyword = dataObj.keywords.some(kw => text.includes(kw));
            if (hasKeyword) {
                responseText = dataObj.reply;
                found = true;
                break;
            }
        }

        if (!found) {
            // General topics fuzzy matching
            if (text.includes('อธิบายสวนส้ม') || text.includes('สวนส้ม')) {
                responseText = "ใน **สวนส้มของหนู** สไลเดอร์จานจะเปลี่ยนจำนวนกลุ่ม ส่วนส้มในแต่ละจานคือสมาชิกในกลุ่มจ้า! ตัวเลขจะโชว์ว่าการคูณคือการนำส้มแต่ละจานมารวมบวกซ้ำกันครับ 🍊";
            } else if (text.includes('แปลงผัก') || text.includes('ผักนักลาก')) {
                responseText = "**แปลงผักนักลาก** เป็นการแสดงผลการคูณในแบบ 'พื้นที่กว้าง × ยาว' ครับ เมื่อเด็กๆ ลากนิ้วตารางจะขุดและปลูกแครอทให้เห็นจำนวนช่องผลผลิตการคูณทั้งหมดครับ! 🥕";
            } else if (text.includes('แผนที่') || text.includes('พลังสิบ') || text.includes('area model')) {
                responseText = "**แผนที่พลังสิบ (Area Model)** ใช้คูณเลขเกินสิบจ้า! พี่จะแบ่งช่องเป็น 10 กับหน่วย เช่น 14 × 12 จะแบ่งคิดเป็น 4 ช่องย่อย ได้แก่ 100, 20, 40, 8 แล้วนำมารวมกันเพื่อให้คิดเลขยากๆ ได้อย่างแม่นยำครับ 🗺️";
            } else if (text.includes('สายลับ') || text.includes('ภารกิจ') || text.includes('เกม')) {
                responseText = "ด่าน **ภารกิจสายลับ** ให้ดูตัวเลขเป้าหมาย แล้วลากตารางขนาดกว้างคูณยาวที่ให้ผลคูณตรงตามโจทย์จ้า! เช่น โจทย์บอก 12 ช่อง เด็กๆ อาจลากขนาด 3×4 หรือ 2×6 ช่อง ก็จะผ่านด่านและสะสมดาวไปแชร์กันได้ครับ 💎";
            } else {
                responseText = "ครูพี่คูณยินดีต้อนรับจ้า! น้องๆ สามารถสอบถามเคล็ดลับการคูณเลข เช่น **เทคนิคแม่ 9**, **การสลับที่การคูณ**, หรือพิมพ์โจทย์ให้พี่คิดเลขให้เลยก็ได้นะครับ เช่น **7 × 8** หรือ **6 คูณ 9** ครับ! 🤖🎠";
            }
        }
    }

    // Set slight delay for bot typing simulation
    setTimeout(() => {
        addChatMessage('bot', responseText);
    }, 400);
}
