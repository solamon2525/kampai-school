/* game.js — ลอจิกเกม "สวนผักพอเพียง" (อ่าน window.GAME_CONFIG + window.GAME_DATA)
   โครงรอบ ๆ (SDK/leaderboard/สถิติ/เสียง/ออนไลน์) = วัฒนธรรมมาตรฐาน คงไว้ทุกเกม
   กลไก: เรียงการ์ดขั้นการปลูก 1→N (reuse จาก food-chain/handwash-order) */

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
    const av = s.photoUrl ? `<img src="${s.photoUrl}" alt="">` : `<div class="pc-init">${(s.displayName||'?')[0]}</div>`;
    const best = st ? ` · <span class="pc-best">สถิติ ${st.personalBest.toLocaleString()}</span>` : '';
    $('player-chip').innerHTML = av + `<span>${s.displayName}${best}</span>`;
    const cs = $('player-chip-start');
    cs.innerHTML = av + `<span>${s.displayName}${best}</span>`;
    cs.style.display = 'flex';
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
KAMPAI.sound.mountToggles();

/* ═══ โหมดออนไลน์ (kampai-match) — เปิด/ปิดที่ config.ENABLE_ONLINE ═══ */
let match = null;
if (CFG.ENABLE_ONLINE && window.KampaiMatch) {
    match = KampaiVersus.create({ rankBy: 'correct',
        duration: CFG.ONLINE_DURATION,
        title: 'สวนผักพอเพียง',
        onPlay: function (ctx) { startGame('online', ctx && ctx.rng); },   // ใช้ rng → ผัก+การ์ดตรงกันทุกเครื่อง
        onEnd:  function () { endOnline(); },
    });
    $('online-btn').style.display = '';
}
function openOnline() { if (match) match.openMenu(); }

/* ═══════════════════════════════════════════════════════════════════════════
   GAME LOGIC — สวนผักพอเพียง (เรียงลำดับขั้นการปลูก)
   ═══════════════════════════════════════════════════════════════════════════ */
let mode = 'race', score = 0, lives = CFG.LIVES, roundStreak = 0, maxStreak = 0, roundsDone = 0, correctCount = 0;
let crop = null, N = 0, nextExpected = 1, mistakesThisRound = 0, lastCropIdx = -1;
let started = false, isGameOver = false, locked = false;
let roundStart = 0, rafId = 0, ROUND_BONUS_MS = 16000;
let qrand = Math.random;   // online → rng (seeded) ให้โจทย์ตรงกันทุกเครื่อง

function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = (qrand() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; }
    return a;
}
function comboMult() { return Math.min(CFG.COMBO_MAX, 1 + Math.floor(roundStreak / CFG.COMBO_STEP)); }
function updateCombo() {
    const b = $('combo-badge');
    const m = comboMult();
    if (roundStreak >= 1 && m > 1) { b.textContent = `🔥 x${m} · ${roundStreak} ต้น`; b.classList.add('on', 'bump'); setTimeout(() => b.classList.remove('bump'), 120); }
    else b.classList.remove('on');
}
function setScore(n) {
    score = Math.max(0, Math.round(n));
    $('score-value').textContent = score;
    const w = $('score-container'); w.classList.add('pop'); setTimeout(() => w.classList.remove('pop'), 150);
}
function setLives(n) {
    lives = Math.max(0, n);
    let s = ''; for (let i = 0; i < CFG.LIVES; i++) s += (i < lives) ? '❤️' : '🖤';
    $('life-container').textContent = s;
    if (lives <= 0 && mode === 'race') endGame();
}
function flash(msg, good) { const f = $('feedback'); f.textContent = msg; f.className = good ? 'good' : 'bad'; }
function setNextHint() { $('next-n').textContent = nextExpected; }
function growTo(done) {
    const g = $('growth');
    g.textContent = (done >= N) ? crop.icon : DATA.GROWTH[Math.min(done, DATA.GROWTH.length - 1)];
    g.classList.add('pop'); setTimeout(() => g.classList.remove('pop'), 200);
}

function pickCrop() {
    let i = (qrand() * DATA.CROPS.length) | 0;
    if (i === lastCropIdx) i = (i + 1) % DATA.CROPS.length;
    lastCropIdx = i;
    return DATA.CROPS[i];
}

function chooseMode(m) { KAMPAI.sound.unlock(); startGame(m); }

function startGame(m, rng) {
    if (started && m !== 'online' && mode !== 'online') return;
    mode = m || 'race';
    qrand = (mode === 'online' && typeof rng === 'function') ? rng : Math.random;
    started = true; isGameOver = false;
    score = 0; lives = CFG.LIVES; roundStreak = 0; maxStreak = 0; roundsDone = 0; correctCount = 0; lastCropIdx = -1;
    $('start').classList.remove('on');
    $('gameover').classList.remove('on');
    $('play').classList.add('on');
    $('player-chip').style.display = KAMPAI.student ? 'flex' : 'none';
    if (mode === 'race') { $('life-container').style.display = 'block'; $('timer-wrap').classList.add('on'); }
    else { $('life-container').style.display = 'none'; $('timer-wrap').classList.remove('on'); }
    setScore(0); setLives(CFG.LIVES); updateCombo();
    KAMPAI.sound.bgmStart();
    newRound();
}

function newRound() {
    locked = false;
    crop = pickCrop();
    N = crop.steps.length;
    nextExpected = 1; mistakesThisRound = 0;
    ROUND_BONUS_MS = 4000 + N * 2800;
    $('crop-tag').textContent = '🌱 กำลังปลูก: ' + crop.icon + ' ' + crop.crop;
    growTo(0);
    setNextHint();
    $('feedback').textContent = ''; $('feedback').className = '';

    const track = $('track');
    track.innerHTML = '';
    for (let i = 1; i <= N; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot'; slot.id = 'slot-' + i;
        slot.innerHTML = `<span class="sn">${i}</span>`;
        track.appendChild(slot);
    }

    const pool = $('pool');
    pool.innerHTML = '';
    const order = shuffled(crop.steps.map((s, i) => ({ e: s.e, name: s.name, ord: i + 1 })));
    order.forEach((s) => {
        const b = document.createElement('button');
        b.className = 'card';
        b.dataset.step = s.ord;
        b.onclick = () => tapCard(s.ord, b);
        b.innerHTML = `<span class="emo">${s.e}</span><span class="lab">${s.name}</span>`;
        pool.appendChild(b);
    });

    if (mode === 'race') { roundStart = performance.now(); cancelAnimationFrame(rafId); tickTimer(); }
}

function tickTimer() {
    if (mode !== 'race' || locked) return;
    const frac = Math.max(0, 1 - (performance.now() - roundStart) / ROUND_BONUS_MS);
    $('timer-bar').style.width = (frac * 100) + '%';
    rafId = requestAnimationFrame(tickTimer);
}

function tapCard(stepN, btn) {
    if (locked || isGameOver) return;
    if (btn.classList.contains('done')) return;

    if (stepN === nextExpected) {
        btn.classList.add('done');
        const o = document.createElement('span'); o.className = 'order'; o.textContent = nextExpected; btn.appendChild(o);
        const slot = $('slot-' + nextExpected);
        const step = crop.steps[stepN - 1];
        if (slot) { slot.classList.add('filled'); slot.innerHTML = `<span class="sn">${nextExpected}</span><span class="se">${step.e}</span><span class="sr">${step.name}</span>`; }
        KAMPAI.sound.correct(); KAMPAI.sound.fxFlash(true);
        correctCount++;
        setScore(score + CFG.STEP_POINTS);
        nextExpected++;
        growTo(nextExpected - 1);
        setNextHint();
        flash('ถูกต้อง! ปลูกต่อ ✓', true);
        if (nextExpected > N) roundComplete();
    } else {
        btn.classList.add('bad'); setTimeout(() => btn.classList.remove('bad'), 420);
        KAMPAI.sound.wrong(); KAMPAI.sound.fxFlash(false);
        flash('ยังไม่ใช่ — ขั้นที่ ' + nextExpected + ' ต้องทำก่อน', false);
        if (mode === 'race') { mistakesThisRound++; setLives(lives - 1); }
    }
}

function roundComplete() {
    locked = true;
    cancelAnimationFrame(rafId);
    roundsDone++;
    let bonus = CFG.ROUND_BONUS;
    if (mode === 'race') {
        const frac = Math.max(0, 1 - (performance.now() - roundStart) / ROUND_BONUS_MS);
        bonus += Math.round(frac * CFG.TIME_BONUS_MAX);
    }
    if (mistakesThisRound === 0) { roundStreak++; maxStreak = Math.max(maxStreak, roundStreak); }
    else roundStreak = 0;
    const mult = comboMult();
    bonus *= mult;
    setScore(score + bonus);
    updateCombo();
    growTo(N);
    flash(`เยี่ยม! เก็บเกี่ยว ${crop.icon} +${bonus}` + (mult > 1 ? ` (x${mult})` : ''), true);
    if (mode === 'online' && match) match.report(score, { correct: roundsDone });
    setTimeout(() => { if (!isGameOver) newRound(); }, 1050);
}

// ออฟไลน์ (race/practice): จบเกม + ส่งคะแนน. ⚠️ ต้องเรียก KAMPAI.submitScore()
function endGame() {
    if (isGameOver) return;
    isGameOver = true; locked = true;
    cancelAnimationFrame(rafId);
    KAMPAI.sound.bgmStop(); KAMPAI.sound.gameOver();
    if (mode === 'race') KAMPAI.submitScore(score, { mode: 'normal', rounds: roundsDone, maxStreak });
    $('play').classList.remove('on');
    $('timer-wrap').classList.remove('on');
    $('final-score').textContent = score;
    $('final-detail').textContent = `ปลูกครบ ${roundsDone} ต้น · ดีที่สุด ${maxStreak} ต้นติด`
        + (mode === 'practice' ? ' · (โหมดฝึก ไม่นับอันดับ)' : '');
    $('gameover').classList.add('on');
    renderLeaderboard('score-list-gameover');
}

// ออนไลน์: หมดเวลา → หยุดรับ input (เฟรมเวิร์ก kampai-match โชว์อันดับ + submit ให้เอง)
function endOnline() {
    isGameOver = true; locked = true;
    cancelAnimationFrame(rafId);
    KAMPAI.sound.bgmStop();
}
