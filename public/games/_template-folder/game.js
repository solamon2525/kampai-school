/* game.js — ลอจิกเกม (อ่าน window.GAME_CONFIG จาก config.js + window.GAME_DATA จาก data.js)
   ตัวอย่าง: ขยับตะกร้าซ้าย-ขวารับดาว. ลบ "GAME LOGIC" แล้วเขียนเกมของคุณเอง — โครงรอบ ๆ (SDK,
   leaderboard, สถิติ, เสียง, ออนไลน์) คือ "วัฒนธรรมมาตรฐาน" คงไว้ทุกเกม */

/* ═══ ตั้งค่า KAMPAI จาก config ═══ */
const CFG = window.GAME_CONFIG;
const DATA = window.GAME_DATA;
KAMPAI.setSlug(CFG.SLUG);
KAMPAI.sound.defaultBgm(CFG.BGM);

/* ═══ ข้อมูลนักเรียน + leaderboard (จาก KAMPAI — ไม่ยิง DB เอง) ═══ */
function renderPlayer() {
    const s = KAMPAI.student, st = KAMPAI.stats;
    if (!s) return;
    const chip = document.getElementById('player-chip');
    const av = s.photoUrl ? `<img src="${s.photoUrl}" alt="">` : `<div class="pc-init">${(s.displayName||'?')[0]}</div>`;
    const best = st ? ` · <span class="pc-best">สถิติ ${st.personalBest.toLocaleString()}</span>` : '';
    chip.innerHTML = av + `<span>${s.displayName}${best}</span>`;
    chip.style.display = 'flex';
}
function renderMyStats() {
    const st = KAMPAI.stats;
    if (!st) return;
    document.getElementById('ms-best').innerText = (st.personalBest || 0).toLocaleString();
    document.getElementById('ms-plays').innerText = (st.playsCount || 0).toLocaleString();
    document.getElementById('my-stats').style.display = 'flex';
}
function renderLeaderboard(listId) {
    const el = document.getElementById(listId);
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
KAMPAI.controls.mount({ dpad: true, buttons: [] });   // D-pad มือถือ + ลูกศร/AD เดสก์ท็อป
KAMPAI.sound.mountToggles();                            // ปุ่ม 🔊/🗣️/🎵

/* ═══ โหมดออนไลน์ (kampai-match) — เปิด/ปิดที่ config.ENABLE_ONLINE ═══ */
let onlineMode = false, match = null;
if (CFG.ENABLE_ONLINE && window.KampaiMatch) {
    match = KampaiMatch.create({
        duration: CFG.ONLINE_DURATION,
        title: 'แข่งเก็บดาว',
        onPlay: function () { onlineMode = true; startGame(); },     // GO! (ใช้ rng ถ้าโจทย์ต้องตรงทุกเครื่อง)
        onEnd:  function () { isGameOver = true; },                  // หมดเวลา → หยุดรับ input (เฟรมเวิร์กคิดอันดับ)
    });
    document.getElementById('online-btn').style.display = '';
}
function openOnline() { if (match) match.openMenu(); }

/* ═══════════════════════════════════════════════════════════════════════════
   GAME LOGIC (เขียนเกมของคุณตรงนี้ — ตัวอย่าง: ตะกร้ารับดาว)
   ═══════════════════════════════════════════════════════════════════════════ */
let score = 0, lives = CFG.LIVES, isGameOver = false, started = false;

function setScore(n) {
    score = Math.max(0, n);
    document.getElementById('score-value').innerText = score;
    const w = document.getElementById('score-container');
    w.classList.add('pop'); setTimeout(() => w.classList.remove('pop'), 150);
}
function setLives(n) {
    lives = Math.max(0, n);
    let str = ''; for (let i = 0; i < CFG.LIVES; i++) str += (i < lives) ? '❤️' : '🖤';
    document.getElementById('life-container').innerText = str;
    if (lives <= 0 && !onlineMode) endGame();   // ออนไลน์: หมดเวลาจบเอง ไม่จบด้วยชีวิต
}

// ⚠️ สำคัญ: ต้องเรียก KAMPAI.submitScore() ตอนจบเกม (ออฟไลน์). ออนไลน์ kampai-match จัดการ submit ให้
function endGame() {
    if (isGameOver) return;
    isGameOver = true;
    KAMPAI.sound.bgmStop(); KAMPAI.sound.gameOver();
    KAMPAI.submitScore(score, { mode: 'normal', stars: score / CFG.STAR_POINTS });
    document.getElementById('final-score').innerText = score;
    document.getElementById('gameover-screen').style.display = 'flex';
    renderLeaderboard('score-list-gameover');
}

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let cw = 0, ch = 0;
function resize() { cw = canvas.width = window.innerWidth; ch = canvas.height = window.innerHeight; }
resize(); window.addEventListener('resize', resize);

let basketX = 0, stars = [], spawnTs = 0, caught = 0;
function startGame() {
    if (started) return;
    started = true; isGameOver = false; score = 0; lives = CFG.LIVES; caught = 0;
    basketX = cw / 2;
    setScore(0); setLives(CFG.LIVES);
    document.getElementById('player-chip').style.display = KAMPAI.student ? 'flex' : 'none';
    KAMPAI.sound.unlock(); KAMPAI.sound.bgmStart();
    document.getElementById('blocker').style.display = 'none';
    requestAnimationFrame(loop);
}
function loop(ts) {
    if (isGameOver) return;
    if (KAMPAI.input.left)  basketX -= CFG.SPEED;
    if (KAMPAI.input.right) basketX += CFG.SPEED;
    basketX = Math.max(40, Math.min(cw - 40, basketX));

    if (ts - spawnTs > CFG.SPAWN_MS) { spawnTs = ts; stars.push({ x: 40 + Math.random() * (cw - 80), y: -20, v: 2 + Math.random() * 2, e: DATA.GOOD[(Math.random()*DATA.GOOD.length)|0] }); }

    ctx.clearRect(0, 0, cw, ch);
    const basketY = ch - 60;
    for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i]; s.y += s.v;
        ctx.font = '32px serif'; ctx.fillText(s.e, s.x - 16, s.y);
        if (s.y > basketY - 20 && Math.abs(s.x - basketX) < 50) {
            setScore(score + CFG.STAR_POINTS); caught++; KAMPAI.sound.correct(); stars.splice(i, 1);
            if (onlineMode && match) match.report(score, { correct: caught });
        } else if (s.y > ch) { stars.splice(i, 1); KAMPAI.sound.wrong(); setLives(lives - 1); }
    }
    ctx.font = '48px serif'; ctx.fillText(DATA.BASKET, basketX - 24, basketY + 16);
    requestAnimationFrame(loop);
}
// แตะครึ่งจอซ้าย-ขวาเลื่อนตะกร้า
canvas.addEventListener('pointerdown', (e) => { if (e.clientX < cw / 2) basketX -= 40; else basketX += 40; });
