/* game.js — ลอจิกเกม "จม หรือ ลอย?" (อ่าน window.GAME_CONFIG + window.GAME_DATA)
   โครงรอบ ๆ (SDK/leaderboard/สถิติ/เสียง/ออนไลน์) = วัฒนธรรมมาตรฐาน คงไว้ทุกเกม */

/* ═══ ตั้งค่า KAMPAI จาก config ═══ */
const CFG = window.GAME_CONFIG;
const DATA = window.GAME_DATA;
KAMPAI.setSlug(CFG.SLUG);
KAMPAI.sound.defaultBgm(CFG.BGM);

const $ = (id) => document.getElementById(id);

/* ═══ ข้อมูลนักเรียน + leaderboard (จาก KAMPAI — ไม่ยิง DB เอง) ═══ */
function renderPlayer() {
    const s = KAMPAI.student, st = KAMPAI.stats;
    if (!s) return;
    const chip = $('player-chip');
    const av = s.photoUrl ? `<img src="${s.photoUrl}" alt="">` : `<div class="pc-init">${(s.displayName||'?')[0]}</div>`;
    const best = st ? ` · <span class="pc-best">สถิติ ${st.personalBest.toLocaleString()}</span>` : '';
    chip.innerHTML = av + `<span>${s.displayName}${best}</span>`;
}
function renderMyStats() {
    const st = KAMPAI.stats;
    if (!st) return;
    $('ms-best').innerText = (st.personalBest || 0).toLocaleString();
    $('ms-plays').innerText = (st.playsCount || 0).toLocaleString();
    $('my-stats').style.display = 'flex';
}
function renderLeaderboard(listId) {
    const el = $(listId);
    if (!el) return;
    const rows = KAMPAI.leaderboard || [];
    if (!rows.length) { el.innerHTML = '<li class="lb-loading">ยังไม่มีผู้เล่น — เป็นคนแรกสิ!</li>'; return; }
    const medals = ['🥇','🥈','🥉'];
    el.innerHTML = rows.slice(0, 5).map((r) => {
        const av = r.photoUrl ? `<img class="lb-avatar" src="${r.photoUrl}" alt="">` : `<div class="lb-avatar-init">${(r.displayName||'?')[0]}</div>`;
        return `<li class="${r.isMe ? 'is-me' : ''}">
            <span class="lb-rank">${medals[r.rank-1] || r.rank}</span>${av}
            <div class="lb-info"><div class="lb-name">${r.displayName}${r.isMe ? ' (คุณ)' : ''}</div>
            <div class="lb-sub">${(r.personalBest||0).toLocaleString()} คะแนน · ${r.classLabel||''}</div></div>
        </li>`;
    }).join('');
}
KAMPAI.onReady(function () { renderPlayer(); renderMyStats(); renderLeaderboard('score-list'); });
KAMPAI.sound.mountToggles();   // ปุ่ม 🔊/🗣️/🎵 (มุมบนซ้าย)

/* ═══ โหมดออนไลน์ (kampai-match) — เปิด/ปิดที่ config.ENABLE_ONLINE ═══ */
let match = null;
if (CFG.ENABLE_ONLINE && window.KampaiMatch) {
    match = KampaiMatch.create({
        duration: CFG.ONLINE_DURATION,
        title: 'จม หรือ ลอย?',
        onPlay: function (ctx) { startGame('online', ctx && ctx.rng); },  // ใช้ rng → โจทย์ตรงกันทุกเครื่อง
        onEnd:  function () { endOnline(); },                             // หมดเวลา → หยุดรับ input (เฟรมเวิร์กคิดอันดับ+submit)
    });
    $('online-btn').style.display = '';
}
function openOnline() { if (match) match.openMenu(); }

/* ═══════════════════════════════════════════════════════════════════════════
   GAME LOGIC — จม หรือ ลอย?
   ═══════════════════════════════════════════════════════════════════════════ */
let mode = 'race', score = 0, lives = CFG.LIVES, streak = 0, maxStreak = 0, correct = 0, total = 0;
let started = false, isGameOver = false, locked = false, cur = null, lastIdx = -1;
let onlineRng = null, askTs = 0, revealId = 0, timeLeft = CFG.TIME_SECONDS, timerId = null;

function comboMult() { return Math.min(CFG.COMBO_MAX, 1 + Math.floor(streak / CFG.COMBO_STEP)); }
function rngFloat() { return onlineRng ? onlineRng() : Math.random(); }

function setScore(n) {
    score = Math.max(0, Math.round(n));
    $('score-value').innerText = score;
    const w = $('score-container'); w.classList.add('pop'); setTimeout(() => w.classList.remove('pop'), 150);
}
function setLives(n) {
    lives = Math.max(0, n);
    let s = ''; for (let i = 0; i < CFG.LIVES; i++) s += (i < lives) ? '❤️' : '🖤';
    $('life-container').innerText = s;
    if (lives <= 0 && mode === 'race') endGame();
}
function renderCombo() {
    const b = $('combo-badge');
    b.innerText = comboMult() > 1 ? ('🔥 คอมโบ x' + comboMult() + ' · ' + streak + ' ติด') : '';
    b.classList.add('bump'); setTimeout(() => b.classList.remove('bump'), 120);
}

function pickObject() {
    const list = DATA.OBJECTS;
    let i = (rngFloat() * list.length) | 0;
    if (i === lastIdx) i = (i + 1) % list.length;   // เลี่ยงซ้ำชิ้นเดิมติดกัน
    lastIdx = i;
    return list[i];
}

function nextRound() {
    cur = pickObject();
    const item = $('item');
    item.className = 'idle';
    item.style.top = '';                  // คืนตำแหน่งเริ่ม (เหนือผิวน้ำ) จาก CSS
    item.textContent = cur.e;
    $('question').innerHTML = 'ของชิ้นนี้จะ... <b>จม</b> หรือ <b>ลอย</b>?';
    $('feedback').textContent = ''; $('feedback').className = '';
    $('answer-row').classList.remove('locked');
    locked = false;
    askTs = performance.now();
}

function answer(guess) {
    if (!started || isGameOver || locked || !cur) return;
    locked = true;
    $('answer-row').classList.add('locked');
    const right = (guess === cur.floats);
    total++;

    // เฉลย: ของ animate ตามความจริง (ลอย/จม) ไม่ใช่ตามที่ทาย
    const item = $('item');
    item.className = cur.floats ? 'float' : 'sink';

    const verdict = cur.floats ? 'ลอย ⬆️' : 'จม ⬇️';
    const fb = $('feedback');
    if (right) {
        streak++; correct++; maxStreak = Math.max(maxStreak, streak);
        let pts = CFG.GOOD_POINTS * comboMult();
        if (mode === 'race' && performance.now() - askTs < 2000) pts += CFG.TIME_BONUS;   // ตอบเร็ว = โบนัส
        setScore(score + pts);
        renderCombo();
        KAMPAI.sound.correct(); KAMPAI.sound.fxFlash(true);
        fb.className = 'good';
        fb.innerHTML = `<span class="fb-head">✓ ถูกต้อง! +${pts}</span><br>${cur.e} ${cur.name} <b>${verdict}</b> — ${cur.why}`;
        if (mode === 'online' && match) match.report(score, { correct });
    } else {
        streak = 0; renderCombo();
        KAMPAI.sound.wrong(); KAMPAI.sound.fxFlash(false);
        document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake');
        fb.className = 'bad';
        fb.innerHTML = `<span class="fb-head">✗ ยังไม่ใช่</span><br>${cur.e} ${cur.name} <b>${verdict}</b> — ${cur.why}`;
        if (mode === 'race') { setLives(lives - 1); }
    }

    clearTimeout(revealId);
    revealId = setTimeout(() => { if (!isGameOver) nextRound(); }, CFG.REVEAL_MS);
}

function startGame(m, rng) {
    if (started && m !== 'online' && mode !== 'online') return;
    mode = m || 'race';
    onlineRng = (mode === 'online' && typeof rng === 'function') ? rng : null;
    started = true; isGameOver = false;
    score = 0; lives = CFG.LIVES; streak = 0; maxStreak = 0; correct = 0; total = 0; lastIdx = -1;
    timeLeft = CFG.TIME_SECONDS;
    setScore(0); renderCombo();
    $('blocker').style.display = 'none';
    $('gameover-screen').style.display = 'none';
    $('player-chip').style.display = KAMPAI.student ? 'flex' : 'none';

    if (mode === 'race') {
        $('life-container').style.display = 'block'; setLives(CFG.LIVES);
        $('timer-container').style.display = 'block'; $('timer-value').innerText = CFG.TIME_SECONDS;
        $('timer-container').classList.remove('low');
        if (timerId) clearInterval(timerId);
        timerId = setInterval(tickTimer, 1000);
    } else if (mode === 'practice') {
        $('life-container').style.display = 'none';
        $('timer-container').style.display = 'none';
    } else { // online: เฟรมเวิร์กคุมนาฬิกา+จบเอง
        $('life-container').style.display = 'none';
        $('timer-container').style.display = 'none';
    }
    KAMPAI.sound.unlock(); KAMPAI.sound.bgmStart();
    nextRound();
}

function tickTimer() {
    timeLeft--;
    $('timer-value').innerText = timeLeft;
    $('timer-container').classList.toggle('low', timeLeft <= 10);
    if (timeLeft <= 0) endGame();
}

// ออฟไลน์ (race/practice): จบเกม + ส่งคะแนน. ⚠️ ต้องเรียก KAMPAI.submitScore()
function endGame() {
    if (isGameOver) return;
    isGameOver = true; locked = true;
    clearTimeout(revealId);
    if (timerId) { clearInterval(timerId); timerId = null; }
    KAMPAI.sound.bgmStop(); KAMPAI.sound.gameOver();
    if (mode === 'race') KAMPAI.submitScore(score, { mode: 'normal', correct, total, maxStreak });
    $('final-score').innerText = score;
    const acc = total ? Math.round((correct / total) * 100) : 0;
    $('go-summary').innerText = `ตอบถูก ${correct}/${total} (${acc}%) · ติดต่อกันดีสุด ${maxStreak}`
        + (mode === 'practice' ? ' · (โหมดฝึก ไม่นับอันดับ)' : '');
    $('gameover-screen').style.display = 'flex';
    renderLeaderboard('score-list-gameover');
}

// ออนไลน์: หมดเวลา → หยุดรับ input (เฟรมเวิร์ก kampai-match โชว์อันดับ + submit ให้เอง)
function endOnline() {
    isGameOver = true; locked = true;
    clearTimeout(revealId);
    KAMPAI.sound.bgmStop();
}

/* ═══ คีย์บอร์ด: ← จม · → ลอย ═══ */
window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft')  { e.preventDefault(); answer(false); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); answer(true); }
});
