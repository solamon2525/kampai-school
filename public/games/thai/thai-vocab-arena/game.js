// --- ระบบของเกม ลานประลองคำศัพท์ภาษาไทย ---

// ดึงข้อมูลคำถามและตั้งค่าจาก Global
const allQuestionsWithIds = window.GAME_DATA.questions.map((q, id) => ({ ...q, id }));
const config = window.GAME_CONFIG;

// --- ระบบผู้เล่น และ ความสำเร็จ (Player Data & Achievements) ---
let playerProfile = {
    name: "",
    exp: 0,
    level: 1,
    gamesPlayed: 0,
    achievements: [], 
    mistakes: [],    // เก็บ ID ข้อที่เคยตอบผิด (ด่านซ่อมเสริม)
    unlockedVocab: [] // เก็บ ID ข้อที่เคยตอบถูก (ห้องสมุดคำศัพท์)
};

const ACHIEVEMENTS_LIST = [
    { id: 'first_blood', name: 'ก้าวแรกสู่สังเวียน', desc: 'เล่นเกมจนจบเป็นครั้งแรก', icon: '🐣', color: 'yellow' },
    { id: 'perfect_run', name: 'ราชบัณฑิต', desc: 'ตอบถูกทุกข้อในรอบนั้น โดยไม่เสียหัวใจ', icon: '👑', color: 'purple' },
    { id: 'combo_master', name: 'คอมโบไฟลุก', desc: 'ทำคอมโบสะสม x3 ขึ้นไป', icon: '🔥', color: 'orange' },
    { id: 'survivor', name: 'ผู้รอดชีวิต', desc: 'ผ่านด่านโดยเหลือหัวใจแค่ 1 ดวง', icon: '❤️‍🩹', color: 'red' },
    { id: 'scholar', name: 'หนอนหนังสือ', desc: 'ปลดล็อกคำศัพท์ในห้องสมุดครบ 10 คำ', icon: '📖', color: 'blue' }
];

// โหลดข้อมูลจาก LocalStorage
function loadPlayerData() {
    const savedData = localStorage.getItem('thaiVocabPlayer');
    if (savedData) {
        // ผสานข้อมูลเก่ากับโครงสร้างใหม่ (ป้องกันพังกรณีคนเคยเล่นแล้ว)
        playerProfile = { ...playerProfile, ...JSON.parse(savedData) };
        playerProfile.mistakes = playerProfile.mistakes || [];
        playerProfile.unlockedVocab = playerProfile.unlockedVocab || [];
    }
    
    // ใช้ชื่อนักเรียนจากระบบ KAMPAI ถ้ามี
    if (window.KAMPAI && window.KAMPAI.student && window.KAMPAI.student.displayName) {
        playerProfile.name = window.KAMPAI.student.displayName;
    }
    
    updateProfileUI();
    
    // ถ้าไม่มีชื่อ และไม่ใช่โหมด embed ค่อยให้พิมพ์ชื่อ
    if (!playerProfile.name && (!window.KAMPAI || !window.KAMPAI.isEmbed)) {
        document.getElementById('name-modal').classList.remove('hidden');
    }
}

function savePlayerData() {
    localStorage.setItem('thaiVocabPlayer', JSON.stringify(playerProfile));
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
    playerProfile.level = Math.floor(playerProfile.exp / 100) + 1;
    document.getElementById('display-player-level').innerText = playerProfile.level;
    document.getElementById('display-player-exp').innerText = playerProfile.exp;

    // อัปเดตปุ่มซ่อมเสริม
    const reviewBtn = document.getElementById('review-mode-btn');
    const mistakesCountText = document.getElementById('mistakes-count-text');
    if (playerProfile.mistakes.length > 0) {
        reviewBtn.classList.remove('disabled-card');
        mistakesCountText.innerText = `มีข้อที่ต้องแก้มือ: ${playerProfile.mistakes.length} ข้อ`;
        mistakesCountText.classList.replace('text-gray-500', 'text-red-600');
    } else {
        reviewBtn.classList.add('disabled-card');
        mistakesCountText.innerText = `ไม่มีข้อผิดค้างไว้ เก่งมาก!`;
        mistakesCountText.classList.replace('text-red-600', 'text-gray-500');
    }
}

// ระบบ Toast กลางสำหรับแจ้งเตือนทุกอย่าง
function showToast(title, message, icon="🔔", color="yellow") {
    const toast = document.getElementById('toast-message');
    document.getElementById('toast-icon').innerText = icon;
    document.getElementById('toast-subtitle').innerText = title;
    document.getElementById('toast-subtitle').className = `text-xs font-bold uppercase tracking-wider text-${color}-600`;
    document.getElementById('toast-title').innerText = message;
    toast.className = `fixed top-4 right-4 sm:top-6 sm:right-20 bg-white border-l-4 border-${color}-400 rounded-xl shadow-2xl p-4 flex items-center z-50 transform translate-x-[150%] opacity-0 transition-all toast-enter`;
    
    setTimeout(() => {
        toast.classList.replace('toast-enter', 'toast-leave');
    }, 3000);
}

function checkAchievements(type, data = {}) {
    let unlockedAny = false;
    const unlock = (id) => {
        if (!playerProfile.achievements.includes(id)) {
            playerProfile.achievements.push(id);
            const ach = ACHIEVEMENTS_LIST.find(a => a.id === id);
            playSound('achievement');
            showToast("ปลดล็อกความสำเร็จ!", ach.name, ach.icon, "yellow");
            unlockedAny = true;
        }
    };

    if (type === 'endgame') {
        if (playerProfile.gamesPlayed >= 1) unlock('first_blood');
        if (data.score === data.total && data.lives === config.LIVES_LIMIT) unlock('perfect_run');
        if (data.score >= Math.ceil(data.total/2) && data.lives === 1) unlock('survivor');
    } else if (type === 'ingame') {
        if (data.combo >= 3) unlock('combo_master');
    } else if (type === 'library') {
        if (playerProfile.unlockedVocab.length >= 10) unlock('scholar');
    }
    if (unlockedAny) savePlayerData();
}

// --- ระบบห้องสมุดคำศัพท์ (Vocabulary Library) ---
function openLibraryModal() {
    const container = document.getElementById('library-list-container');
    container.innerHTML = '';
    
    document.getElementById('library-progress').innerText = `${playerProfile.unlockedVocab.length}/${allQuestionsWithIds.length}`;

    allQuestionsWithIds.forEach(q => {
        const isUnlocked = playerProfile.unlockedVocab.includes(q.id);
        const word = q.choices[q.answer]; 
        
        if (isUnlocked) {
            container.innerHTML += `
                <div class="border border-blue-200 bg-blue-50 p-3 rounded-xl shadow-sm flex flex-col justify-center">
                    <h4 class="font-bold text-blue-900 text-lg">✅ ${word}</h4>
                    <p class="text-xs text-gray-600 mt-1">${q.explanation}</p>
                </div>
            `;
        } else {
            container.innerHTML += `
                <div class="border border-gray-200 bg-gray-50 p-3 rounded-xl flex items-center justify-center h-full opacity-60">
                    <h4 class="font-bold text-gray-400 text-xl tracking-widest">???</h4>
                </div>
            `;
        }
    });
    document.getElementById('library-modal').classList.remove('hidden');
}
function closeLibraryModal() { document.getElementById('library-modal').classList.add('hidden'); }

// --- ระบบความสำเร็จ ---
function openAchievementsModal() {
    const container = document.getElementById('achievements-list-container');
    container.innerHTML = '';
    ACHIEVEMENTS_LIST.forEach(ach => {
        const isUnlocked = playerProfile.achievements.includes(ach.id);
        const bgClass = isUnlocked ? `bg-gradient-to-r from-${ach.color}-50 to-white border-${ach.color}-200` : 'bg-gray-50 border-gray-200 opacity-60 grayscale';
        const iconClass = isUnlocked ? 'text-3xl' : 'text-3xl opacity-50';
        const lockIcon = isUnlocked ? '' : '🔒 ';
        container.innerHTML += `
            <div class="border p-3 rounded-xl flex items-center ${bgClass}">
                <div class="${iconClass} mr-4">${ach.icon}</div>
                <div>
                    <h4 class="font-bold text-gray-800">${lockIcon}${ach.name}</h4>
                    <p class="text-xs text-gray-500">${ach.desc}</p>
                </div>
            </div>
        `;
    });
    document.getElementById('achievements-modal').classList.remove('hidden');
}
function closeAchievementsModal() { document.getElementById('achievements-modal').classList.add('hidden'); }

// --- การตั้งค่าเกมเพลย์ ---
let currentQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let lives = config.LIVES_LIMIT;
let timeLeft = config.TIMER_LIMIT;
let timerInterval;
let isAnswered = false;
let comboStreak = 0;
let isReviewMode = false;

const screens = { start: document.getElementById('start-screen'), quiz: document.getElementById('quiz-screen'), result: document.getElementById('result-screen') };
const ui = {
    lives: document.getElementById('lives-display'), score: document.getElementById('score-display'), combo: document.getElementById('combo-display'),
    progressBar: document.getElementById('quiz-progress-bar'), timerBar: document.getElementById('timer-bar'), categoryBadge: document.getElementById('category-badge'),
    question: document.getElementById('question-text'), choices: document.getElementById('choices-container'), explanationBox: document.getElementById('explanation-box'),
    explanationTitle: document.getElementById('explanation-title'), explanationText: document.getElementById('explanation-text'), explanationIcon: document.getElementById('explanation-icon'),
    resultIcon: document.getElementById('result-icon'), resultTitle: document.getElementById('result-title'), finalScoreText: document.getElementById('final-score-text'),
    totalScoreText: document.getElementById('total-score-text'), earnedExpText: document.getElementById('earned-exp-text'), starDisplay: document.getElementById('star-display')
};

// --- ระบบเสียง ---
let audioCtx;
function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

let isBgmPlaying = false;
const bgmAudio = document.getElementById('bgm-audio');
if (bgmAudio) bgmAudio.volume = config.BGM_VOLUME; 

function toggleBGM() {
    const btn = document.getElementById('bgm-toggle');
    if (!bgmAudio) return;
    if (isBgmPlaying) { bgmAudio.pause(); btn.innerText = '🔇'; } 
    else { bgmAudio.play().catch(e => console.log("รอผู้เล่นคลิก")); btn.innerText = '🔊'; }
    isBgmPlaying = !isBgmPlaying;
}

function playSound(type) {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);

    if (type === 'correct') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(880, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1); 
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3); osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'combo') {
        osc.type = 'square'; osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime); osc.frequency.setValueAtTime(1318.51, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3); osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, audioCtx.currentTime); osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.2, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3); osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'star') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5); osc.start(); osc.stop(audioCtx.currentTime + 0.5);
    } else if (type === 'tick') {
        osc.type = 'triangle'; osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1); osc.start(); osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'achievement') {
        osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); osc.frequency.setValueAtTime(1046.50, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime); gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.6); osc.start(); osc.stop(audioCtx.currentTime + 0.6);
    }
}

// --- Game Logic ---
function startGame(category) {
    initAudio();
    const bgmToggleBtn = document.getElementById('bgm-toggle');
    if (bgmToggleBtn && !isBgmPlaying && bgmToggleBtn.innerText === '🔇') toggleBGM();

    isReviewMode = false;
    let filteredQuestions = [];
    let badgeText = "";
    let badgeColor = "";

    if (category === 'review') {
        if (playerProfile.mistakes.length === 0) {
            showToast("เก่งมาก!", "คุณไม่มีข้อผิดค้างไว้เลย ลองเล่นหมวดอื่นดูนะ", "🎉", "green");
            return;
        }
        isReviewMode = true;
        filteredQuestions = playerProfile.mistakes.map(id => allQuestionsWithIds[id]);
        badgeText = "ด่านซ่อมเสริม"; badgeColor = "bg-red-100 text-red-700";
    }
    else if (category === 'spelling') { filteredQuestions = allQuestionsWithIds.slice(0, 30); badgeText = "หมวดสะกดคำ"; badgeColor = "bg-blue-100 text-blue-700"; }
    else if (category === 'royal') { filteredQuestions = allQuestionsWithIds.slice(30, 40); badgeText = "หมวดราชาศัพท์"; badgeColor = "bg-purple-100 text-purple-700"; }
    else if (category === 'idiom') { filteredQuestions = allQuestionsWithIds.slice(40, 50); badgeText = "หมวดสุภาษิต"; badgeColor = "bg-green-100 text-green-700"; }
    else { filteredQuestions = [...allQuestionsWithIds]; badgeText = "สุ่มทั้งหมด"; badgeColor = "bg-orange-100 text-orange-700"; }

    let limit = isReviewMode ? Math.min(filteredQuestions.length, config.REVIEW_LIMIT) : config.QUESTION_LIMIT;
    currentQuestions = filteredQuestions.sort(() => 0.5 - Math.random()).slice(0, limit);
    
    ui.categoryBadge.innerText = badgeText;
    ui.categoryBadge.className = `absolute -top-4 text-xs px-3 py-1 rounded-full uppercase tracking-wider font-semibold shadow-sm ${badgeColor}`;

    currentQuestionIndex = 0; score = 0; lives = config.LIVES_LIMIT; comboStreak = 0;
    ui.combo.classList.add('hidden');
    screens.start.classList.add('hidden'); screens.result.classList.add('hidden'); screens.quiz.classList.remove('hidden');
    
    updateHeader(); loadQuestion();
}

function updateHeader() {
    ui.score.innerText = score;
    let hearts = '';
    for(let i=0; i<config.LIVES_LIMIT; i++) hearts += (i < lives) ? '❤️' : '🖤';
    ui.lives.innerText = hearts;
    const progressPct = (currentQuestionIndex / currentQuestions.length) * 100;
    ui.progressBar.style.width = `${progressPct}%`;
}

function loadQuestion() {
    isAnswered = false; ui.explanationBox.classList.add('hidden');
    const q = currentQuestions[currentQuestionIndex];
    ui.question.innerText = q.question;
    ui.choices.innerHTML = '';
    q.choices.forEach((choice, index) => {
        const btn = document.createElement('button');
        btn.className = 'choice-btn w-full bg-white border-2 border-gray-200 text-gray-700 font-medium py-4 px-6 rounded-xl text-lg text-left outline-none';
        btn.innerText = choice;
        btn.onclick = () => handleAnswer(index, btn);
        ui.choices.appendChild(btn);
    });
    startTimer();
}

function startTimer() {
    timeLeft = config.TIMER_LIMIT; ui.timerBar.style.width = '100%'; ui.timerBar.className = 'bg-green-500 h-1.5 rounded-full transition-all duration-100'; 
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        if(isAnswered) { clearInterval(timerInterval); return; }
        timeLeft--; const pct = (timeLeft / config.TIMER_LIMIT) * 100; ui.timerBar.style.width = `${pct}%`;
        if(pct < 30) {
            ui.timerBar.classList.replace('bg-green-500', 'bg-red-500'); ui.timerBar.classList.replace('bg-yellow-400', 'bg-red-500');
            if(timeLeft % 10 === 0 && timeLeft > 0) playSound('tick');
        } else if(pct < 60) { ui.timerBar.classList.replace('bg-green-500', 'bg-yellow-400'); }
        if (timeLeft <= 0) { clearInterval(timerInterval); handleAnswer(-1, null); }
    }, 100); 
}

function handleAnswer(selectedIndex, buttonElement) {
    if (isAnswered) return;
    isAnswered = true; clearInterval(timerInterval);
    const q = currentQuestions[currentQuestionIndex];
    const allButtons = ui.choices.querySelectorAll('button');
    allButtons.forEach(btn => { btn.disabled = true; btn.classList.add('opacity-80', 'cursor-not-allowed'); });

    let isCorrect = (selectedIndex === q.answer);

    if (isCorrect) {
        comboStreak++; score += 1;
        
        if (!playerProfile.unlockedVocab.includes(q.id)) {
            playerProfile.unlockedVocab.push(q.id);
            checkAchievements('library');
        }
        playerProfile.mistakes = playerProfile.mistakes.filter(id => id !== q.id);

        if (comboStreak >= 2) {
            playSound('combo'); ui.combo.innerText = `🔥 Combo x${comboStreak}`;
            ui.combo.classList.remove('hidden', 'pop-up'); void ui.combo.offsetWidth; ui.combo.classList.add('pop-up');
        } else { playSound('correct'); }
        checkAchievements('ingame', { combo: comboStreak });

        buttonElement.classList.remove('border-gray-200'); buttonElement.classList.add('bg-green-500', 'text-white', 'border-green-600', 'opacity-100');
        showExplanation("ถูกต้อง! เก่งมาก", q.explanation, "correct");
    } else {
        comboStreak = 0; ui.combo.classList.add('hidden'); playSound('wrong'); lives--;
        ui.question.parentElement.classList.add('shake'); setTimeout(() => ui.question.parentElement.classList.remove('shake'), 400);

        if (!playerProfile.mistakes.includes(q.id)) {
            playerProfile.mistakes.push(q.id);
        }

        if (selectedIndex >= 0) { buttonElement.classList.remove('border-gray-200'); buttonElement.classList.add('bg-red-500', 'text-white', 'border-red-600', 'opacity-100'); }
        allButtons[q.answer].classList.remove('border-gray-200', 'opacity-80'); allButtons[q.answer].classList.add('bg-green-500', 'text-white', 'border-green-600', 'ring-4', 'ring-green-200');
        showExplanation(selectedIndex === -1 ? "หมดเวลา!" : "อ๊ะ! ยังไม่ถูกนะ", q.explanation, "wrong");
    }
    savePlayerData(); updateHeader();
}

function showExplanation(title, text, type) {
    ui.explanationBox.classList.remove('hidden'); ui.explanationTitle.innerText = title; ui.explanationText.innerText = text;
    if (type === 'correct') {
        ui.explanationBox.className = 'bg-green-50 border-2 border-green-200 rounded-2xl p-5 text-left slide-up mt-4 block';
        ui.explanationTitle.className = 'font-bold text-lg text-green-800'; ui.explanationIcon.innerText = '✅';
    } else {
        ui.explanationBox.className = 'bg-red-50 border-2 border-red-200 rounded-2xl p-5 text-left slide-up mt-4 block';
        ui.explanationTitle.className = 'font-bold text-lg text-red-800'; ui.explanationIcon.innerText = '❌';
    }
}

function nextQuestion() {
    if (lives <= 0) { endGame(false); return; }
    currentQuestionIndex++;
    if (currentQuestionIndex < currentQuestions.length) { loadQuestion(); updateHeader(); } 
    else { endGame(true); }
}

function endGame(isSuccess) {
    screens.quiz.classList.add('hidden'); screens.result.classList.remove('hidden');
    ui.starDisplay.innerHTML = ''; ui.progressBar.style.width = `100%`;
    playerProfile.gamesPlayed += 1;
    
    let gainedExp = (score * 10) + (lives * 5);
    let earnedStars = 0;
    let totalQ = currentQuestions.length;

    ui.totalScoreText.innerText = totalQ;

    if (!isSuccess) {
        ui.resultIcon.innerText = '💔'; ui.resultTitle.innerText = "เกมโอเวอร์!"; ui.resultTitle.className = "text-3xl font-bold text-red-600 mb-2";
        ui.finalScoreText.innerText = score;
        document.getElementById('feedback-message').innerText = "ไม่เป็นไรนะ ลองตั้งสติแล้วลุยใหม่! สู้ๆ ✌️";
        document.getElementById('feedback-message').className = "text-base font-medium text-red-500 mb-4 px-4";
    } else {
        ui.resultIcon.innerText = '🏆'; ui.resultTitle.innerText = "ภารกิจสำเร็จ!"; ui.resultTitle.className = "text-3xl font-bold text-indigo-900 mb-2";
        ui.finalScoreText.innerText = score;
        
        earnedStars = (score >= totalQ) ? 3 : (score >= Math.ceil(totalQ/2)) ? 2 : 1;
        gainedExp += (earnedStars * 10); 
        
        if (earnedStars === 3) {
            document.getElementById('feedback-message').innerText = "ยอดเยี่ยม! ไร้ที่ติเลย ✨"; document.getElementById('feedback-message').className = "text-base font-medium text-green-600 mb-4 px-4";
        } else if (earnedStars === 2) {
            document.getElementById('feedback-message').innerText = "เก่งมาก! อีกนิดเดียวก็เพอร์เฟกต์แล้ว 👍"; document.getElementById('feedback-message').className = "text-base font-medium text-blue-600 mb-4 px-4";
        } else {
            document.getElementById('feedback-message').innerText = "รอดมาได้! ฝึกบ่อยๆ จะเก่งขึ้นแน่นอน 📚"; document.getElementById('feedback-message').className = "text-base font-medium text-indigo-600 mb-4 px-4";
        }

        for (let i = 1; i <= 3; i++) {
            const starSpan = document.createElement('span'); starSpan.innerText = '⭐';
            starSpan.className = (i <= earnedStars) ? 'star star-gold' : 'star star-empty';
            ui.starDisplay.appendChild(starSpan);
            setTimeout(() => {
                starSpan.style.animation = 'bounce-in 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards';
                if (i <= earnedStars) playSound('star');
            }, i * 400);
        }
    }

    ui.earnedExpText.innerText = gainedExp; playerProfile.exp += gainedExp;
    checkAchievements('endgame', { score: score, total: totalQ, lives: lives, isSuccess: isSuccess });
    savePlayerData();

    // ส่งคะแนนไประบบ KAMPAI SDK
    if (window.KAMPAI) {
        window.KAMPAI.submitScore(score, {
            mode: isReviewMode ? 'review' : 'normal',
            allowResubmit: true,
            duration: Math.max(1, Math.floor((Date.now() - window.KAMPAI._startTs) / 1000)),
            lives_remaining: lives,
            is_success: isSuccess
        });
    }
}

function resetToHome() {
    if (window.KAMPAI && window.KAMPAI.isEmbed) {
        window.KAMPAI.goHome();
    } else {
        screens.result.classList.add('hidden'); screens.start.classList.remove('hidden');
        updateProfileUI(); 
    }
}

function replayGame() {
    screens.result.classList.add('hidden'); screens.start.classList.remove('hidden');
    updateProfileUI();
}

// --- การเริ่มต้นระบบร่วมกับ KAMPAI SDK ---
if (window.KAMPAI) {
    window.KAMPAI.setSlug(config.SLUG);
    window.KAMPAI.onReady(function(k) {
        loadPlayerData();
        
        if (k.isEmbed) {
            const editNameBtn = document.querySelector('button[onclick="openNameModal()"]');
            if (editNameBtn) editNameBtn.style.display = 'none';
        }
    });
} else {
    window.onload = loadPlayerData;
}
