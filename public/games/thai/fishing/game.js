// --- ลอจิกเกม ตกปลามาตราตัวสะกด (Spelling Fishing Game Logic) ---

const config = window.GAME_CONFIG;
const rounds = window.GAME_DATA.rounds;

let playerProfile = {
    name: "",
    exp: 0,
    level: 1,
    gamesPlayed: 0,
    personalBest: 0
};

// --- ระบบโหลด/บันทึกผู้เล่น ---
function loadPlayerData() {
    const saved = localStorage.getItem('fishingPlayer');
    if (saved) {
        playerProfile = { ...playerProfile, ...JSON.parse(saved) };
    }
    
    if (window.KAMPAI && window.KAMPAI.student && window.KAMPAI.student.displayName) {
        playerProfile.name = window.KAMPAI.student.displayName;
    }

    // ในระบบโรงเรียน (embed) ใช้สถิติจริงจาก KAMPAI.stats — ไม่ใช่ตัวนับ localStorage (กันโชว์คนละชุด/ข้ามเครื่องเป็น 0)
    if (window.KAMPAI && window.KAMPAI.stats) {
        const s = window.KAMPAI.stats;
        playerProfile.personalBest = s.personalBest || 0;
        playerProfile.gamesPlayed = s.playsCount || 0;
        playerProfile.exp = s.totalXp || 0;
    }

    updateProfileUI();
    
    if (!playerProfile.name && (!window.KAMPAI || !window.KAMPAI.isEmbed)) {
        document.getElementById('name-modal').classList.remove('hidden');
    }
}

function savePlayerData() {
    localStorage.setItem('fishingPlayer', JSON.stringify(playerProfile));
    updateProfileUI();
}

function savePlayerName() {
    const nameInput = document.getElementById('player-name-input').value.trim();
    if (nameInput !== "") {
        playerProfile.name = nameInput;
        savePlayerData();
        document.getElementById('name-modal').classList.add('hidden');
    }
}

function openNameModal() {
    document.getElementById('player-name-input').value = playerProfile.name;
    document.getElementById('name-modal').classList.remove('hidden');
}

function updateProfileUI() {
    document.getElementById('display-player-name').innerText = playerProfile.name || "ผู้เล่น";
    playerProfile.level = Math.floor(playerProfile.exp / 150) + 1;
    document.getElementById('display-player-level').innerText = playerProfile.level;
    document.getElementById('display-player-exp').innerText = playerProfile.exp;
    document.getElementById('display-player-pb').innerText = playerProfile.personalBest;
    document.getElementById('display-player-plays').innerText = playerProfile.gamesPlayed;
}

// --- โทสต์แจ้งเตือน ---
function showToast(title, message, icon = "🔔", color = "yellow") {
    const toast = document.getElementById('toast-message');
    if (!toast) return;
    document.getElementById('toast-icon').innerText = icon;
    document.getElementById('toast-subtitle').innerText = title;
    document.getElementById('toast-subtitle').className = `text-xs font-bold uppercase tracking-wider text-${color}-600`;
    document.getElementById('toast-title').innerText = message;
    
    toast.className = `fixed top-4 right-4 sm:top-6 sm:right-20 bg-white border-l-4 border-${color}-400 rounded-xl shadow-2xl p-4 flex items-center z-50 transform translate-x-[150%] opacity-0 transition-all toast-enter`;
    
    setTimeout(() => {
        toast.className = `fixed top-4 right-4 sm:top-6 sm:right-20 bg-white border-l-4 border-${color}-400 rounded-xl shadow-2xl p-4 flex items-center z-50 transform translate-x-[150%] opacity-0 transition-all toast-leave`;
    }, 3000);
}

// --- สถานะเกมและตัวแปรการเล่น ---
let score = 0;
let lives = config.LIVES_LIMIT;
let round = 0;
let fishArr = [];
let spawnTimer = null;
let combo = 0;
let maxCombo = 0;
let isHookCasting = false;
let isGameActive = false;

const screens = {
    start: document.getElementById('start-screen'),
    play: document.getElementById('play-screen'),
    result: document.getElementById('result-screen')
};

const ui = {
    lives: document.getElementById('lives-display'),
    score: document.getElementById('score-display'),
    progressBar: document.getElementById('round-progress-bar'),
    targetBadge: document.getElementById('target-badge'),
    levelHud: document.getElementById('level-hud'),
    fishContainer: document.getElementById('fish-container'),
    hook: document.getElementById('hook'),
    hookLine: document.getElementById('hook-line'),
    resultIcon: document.getElementById('result-icon'),
    resultTitle: document.getElementById('result-title'),
    finalScore: document.getElementById('final-score-text'),
    earnedExp: document.getElementById('earned-exp-text'),
    starDisplay: document.getElementById('star-display'),
    feedback: document.getElementById('feedback-message')
};

function startGamePlay() {
    isGameActive = true;
    screens.start.classList.add('hidden');
    screens.result.classList.add('hidden');
    screens.play.classList.remove('hidden');
    
    if (window.KAMPAI && window.KAMPAI.sound) {
        window.KAMPAI.sound.unlock();
        window.KAMPAI.sound.bgmStart();
    }
    
    score = 0;
    lives = config.LIVES_LIMIT;
    round = 0;
    combo = 0;
    maxCombo = 0;
    fishArr = [];
    isHookCasting = false;
    
    updateHUD();
    startRound();
}

function startRound() {
    ui.fishContainer.innerHTML = "";
    fishArr = [];
    
    const r = rounds[round % rounds.length];
    ui.targetBadge.innerText = r.label;
    ui.levelHud.innerText = round + 1;
    
    const progressPct = (round / config.ROUNDS_LIMIT) * 100;
    ui.progressBar.style.width = `${progressPct}%`;
    
    clearInterval(spawnTimer);
    spawnTimer = setInterval(spawnFish, config.SPAWN_INTERVAL_BASE - (round * 150));
    
    // พูดแนะนำเป้าหมายด่าน
    if (window.KAMPAI && window.KAMPAI.sound) {
        window.KAMPAI.sound.speak(`มาตรา ${r.target}`, 'th-TH', true);
    }
    
    // สปอนปลาชุดแรก
    for (let i = 0; i < 3; i++) {
        spawnFish();
    }
}

function spawnFish() {
    if (!isGameActive || fishArr.length >= config.MAX_FISH_SCREEN) return;
    
    const r = rounds[round % rounds.length];
    const isCorrect = Math.random() < 0.45;
    const pool = isCorrect ? r.correct : r.wrong;
    const word = pool[Math.floor(Math.random() * pool.length)];
    
    const el = document.createElement("div");
    el.className = "fish";
    
    const fishEmojis = isCorrect ? ["🐠", "🐡", "🐟"] : ["🦈"];
    const fishEmoji = fishEmojis[Math.floor(Math.random() * fishEmojis.length)];
    
    el.innerHTML = `${fishEmoji}<span class="fish-label">${word}</span>`;
    
    const area = document.getElementById("game-area");
    const w = area.offsetWidth;
    const h = area.offsetHeight;
    
    // กำหนดพิกัดไม่ให้หลุดขอบเขต
    const x = 30 + Math.random() * (w - 110);
    const y = 80 + Math.random() * (h - 150);
    el.style.left = x + "px";
    el.style.top = y + "px";
    
    const dir = Math.random() < 0.5 ? 1 : -1;
    let dx = dir * (config.DRIFT_SPEED_MIN + Math.random() * (config.DRIFT_SPEED_MAX - config.DRIFT_SPEED_MIN + round * 0.1));
    el.dataset.dx = dx;
    
    el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (isHookCasting || !isGameActive) return;
        
        isHookCasting = true;
        
        // คำนวณพิกัดกึ่งกลางปลาเมื่อเทียบกับพื้นที่ตกปลา
        const fishRect = el.getBoundingClientRect();
        const areaRect = area.getBoundingClientRect();
        const clickX = fishRect.left - areaRect.left + (fishRect.width / 2);
        const clickY = fishRect.top - areaRect.top;
        
        castHook(clickX, clickY, () => {
            clickFish(el, isCorrect, word);
            isHookCasting = false;
        });
    });
    
    ui.fishContainer.appendChild(el);
    fishArr.push(el);
    
    // ขยับปลา
    function move() {
        if (!el.parentNode || !isGameActive) return;
        let cx = parseFloat(el.style.left);
        cx += parseFloat(el.dataset.dx);
        if (cx < 0 || cx > w - 80) {
            el.dataset.dx = -parseFloat(el.dataset.dx);
        }
        el.style.left = cx + "px";
        el.style.transform = parseFloat(el.dataset.dx) > 0 ? "scaleX(1)" : "scaleX(-1)";
        requestAnimationFrame(move);
    }
    move();
    
    // ลบปลาอัตโนมัติถ้าไม่มีคนคลิก
    setTimeout(() => {
        if (el.parentNode) el.remove();
        fishArr = fishArr.filter(f => f !== el);
    }, 9000);
}

function castHook(targetX, targetY, callback) {
    if (!ui.hook || !ui.hookLine) { callback(); return; }
    
    // อัปเดตแนวพิกัด X
    ui.hook.style.left = targetX + "px";
    
    // อัปเดตความตึงสายเบ็ด Y
    ui.hookLine.style.transition = "height 0.15s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    ui.hookLine.style.height = (targetY - 15) + "px";
    
    setTimeout(() => {
        callback();
        
        // ดึงสายเบ็ดกลับ
        ui.hookLine.style.transition = "height 0.15s ease-in";
        ui.hookLine.style.height = "30px";
        
        setTimeout(() => {
            ui.hook.style.left = "50%";
        }, 150);
    }, 150);
}

function clickFish(el, isCorrect, word) {
    if (!el.parentNode) return; // ปลาถูก auto-despawn ระหว่างสายเบ็ดกำลังลง — ไม่นับคะแนน
    el.style.pointerEvents = "none";
    
    if (isCorrect) {
        el.classList.add("correct");
        score += 10 * (combo + 1);
        combo++;
        if (combo > maxCombo) maxCombo = combo;
        
        if (window.KAMPAI && window.KAMPAI.sound) {
            window.KAMPAI.sound.correct();
            window.KAMPAI.sound.speak(word, 'th-TH', true); // อ่านออกเสียงคำสะกดที่ถูกต้อง
        }
        
        if (combo >= 2) {
            showCombo(`คอมโบ x${combo}! +${10 * combo}`);
        }
        
        setTimeout(() => {
            if (el.parentNode) el.remove();
            fishArr = fishArr.filter(f => f !== el);
        }, 500);
        
        const targetGoal = (round + 1) * config.TARGET_SCORE_MULTIPLIER;
        if (score >= targetGoal) {
            nextRound();
        }
    } else {
        el.classList.add("wrong");
        combo = 0;
        lives--;
        
        if (window.KAMPAI && window.KAMPAI.sound) {
            window.KAMPAI.sound.wrong();
        }
        
        // สั่นกระดิกกล่องข้อความเตือนว่าผิด
        const area = document.getElementById("game-area");
        area.classList.add("shake");
        setTimeout(() => area.classList.remove("shake"), 400);
        
        // ลบปลาผิดทิ้งหลังเอฟเฟกต์ — กันกดซ้ำตัวเดิมรัว ๆ แล้วเสียชีวิตหมดจากปลาตัวเดียว
        setTimeout(() => {
            el.classList.remove("wrong");
            if (el.parentNode) el.remove();
            fishArr = fishArr.filter(f => f !== el);
        }, 400);

        if (lives <= 0) {
            endGame(false);
        }
    }
    updateHUD();
}

function showCombo(txt) {
    const d = document.createElement("div");
    d.className = "combo-fx";
    d.textContent = txt;
    document.body.appendChild(d);
    setTimeout(() => d.remove(), 800);
}

function nextRound() {
    round++;
    if (round >= config.ROUNDS_LIMIT) {
        endGame(true);
        return;
    }
    
    clearInterval(spawnTimer);
    ui.fishContainer.innerHTML = "";
    fishArr = [];
    
    if (window.KAMPAI && window.KAMPAI.sound) {
        window.KAMPAI.sound.correct();
    }
    
    setTimeout(startRound, 600);
}

function endGame(isSuccess) {
    isGameActive = false;
    clearInterval(spawnTimer);
    
    if (window.parent && window.KAMPAI && window.KAMPAI.sound) {
        window.KAMPAI.sound.bgmStop();
    }
    
    screens.play.classList.add('hidden');
    screens.result.classList.remove('hidden');
    ui.starDisplay.innerHTML = '';
    
    playerProfile.gamesPlayed += 1;
    
    let gainedExp = (score * 5) + (lives * 15);
    let earnedStars = 0;
    
    ui.finalScore.innerText = score;
    
    if (!isSuccess) {
        if (window.KAMPAI && window.KAMPAI.sound) {
            window.KAMPAI.sound.gameOver();
        }
        ui.resultIcon.innerText = '💔';
        ui.resultTitle.innerText = "พยายามอีกนิดนะ!";
        ui.resultTitle.className = "text-3xl font-bold text-red-600 mb-2";
        ui.feedback.innerText = "ชีวิตปลาหมดเสียก่อน ลองสังเกตมาตราสะกดตัวสะกดให้รอบคอบแล้วลองใหม่นะ สู้ๆ! ✌️";
        ui.feedback.className = "text-base font-medium text-red-500 mb-4 px-4";
    } else {
        if (window.KAMPAI && window.KAMPAI.sound) {
            window.KAMPAI.sound.correct();
        }
        ui.resultIcon.innerText = '🏆';
        ui.resultTitle.innerText = "ภารกิจสำเร็จ!";
        ui.resultTitle.className = "text-3xl font-bold text-indigo-900 mb-2";
        
        const th = config.STAR_THRESHOLDS; // [1★, 2★, 3★] — อ่านจาก config กัน drift
        earnedStars = (score >= th[2]) ? 3 : (score >= th[1]) ? 2 : 1;
        gainedExp += (earnedStars * 15);
        
        if (earnedStars === 3) {
            ui.feedback.innerText = "สุดยอดนักตกปลามาตราสะกด! ตอบถูกและทำสถิติได้สมบูรณ์แบบมาก 🌟";
            ui.feedback.className = "text-base font-medium text-green-600 mb-4 px-4";
        } else if (earnedStars === 2) {
            ui.feedback.innerText = "เก่งมาก! เจ้าแห่งสายน้ำ ตกปลาได้ครบถ้วนเกือบไร้ที่ติ 👍";
            ui.feedback.className = "text-base font-medium text-blue-600 mb-4 px-4";
        } else {
            ui.feedback.innerText = "ผ่านด่านมาได้สำเร็จ! ฝึกฝนทักษะการแยกมาตราสะกดเพิ่มเติมจะเก่งขึ้นแน่นอน 🎣";
            ui.feedback.className = "text-base font-medium text-indigo-600 mb-4 px-4";
        }
        
        if (earnedStars >= 2 && window.confetti) {
            window.confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
        }
        
        for (let i = 1; i <= 3; i++) {
            const starSpan = document.createElement('span');
            starSpan.innerText = '⭐';
            starSpan.className = (i <= earnedStars) ? 'star star-gold' : 'star star-empty';
            ui.starDisplay.appendChild(starSpan);
            setTimeout(() => {
                starSpan.style.animation = 'bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
            }, i * 400);
        }
    }
    
    if (score > playerProfile.personalBest) {
        playerProfile.personalBest = score;
    }
    
    ui.earnedExp.innerText = gainedExp;
    playerProfile.exp += gainedExp;
    savePlayerData();
    
    // ส่งแต้มเข้าระบบโรงเรียน
    if (window.KAMPAI) {
        window.KAMPAI.submitScore(score, {
            mode: 'normal',
            allowResubmit: true,
            lives_remaining: lives,
            is_success: isSuccess,
            max_combo: maxCombo
        });
    }
}

function updateHUD() {
    ui.score.innerText = score;
    ui.lives.innerText = "❤️".repeat(Math.max(0, lives)) + "🖤".repeat(Math.max(0, config.LIVES_LIMIT - lives));
}

function resetToHome() {
    isGameActive = false;
    clearInterval(spawnTimer);
    if (window.KAMPAI && window.KAMPAI.isEmbed) {
        window.parent.postMessage({ type: 'navigate', to: '/h/nattapong' }, '*');
    } else {
        screens.result.classList.add('hidden');
        screens.start.classList.remove('hidden');
        updateProfileUI();
    }
}

function replayGame() {
    isGameActive = false;
    clearInterval(spawnTimer);
    screens.result.classList.add('hidden');
    screens.start.classList.remove('hidden');
    updateProfileUI();
}

// --- เริ่มต้นระบบ ร่วมกับ SDK ---
if (window.KAMPAI) {
    window.KAMPAI.setSlug(config.SLUG);
    window.KAMPAI.onReady(function(k) {
        loadPlayerData();
        
        if (k.sound) {
            k.sound.mountToggles();
            k.sound.defaultBgm('calm'); // ธีมสงบ เหมาะกับสายน้ำ
        }
        
        if (k.isEmbed) {
            const editBtn = document.getElementById('edit-name-btn');
            if (editBtn) editBtn.style.display = 'none';
        }
    });
} else {
    window.onload = loadPlayerData;
}
