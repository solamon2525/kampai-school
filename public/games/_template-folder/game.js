/* game.js — ลอจิกเกม (อ่าน window.GAME_CONFIG จาก config.js + window.GAME_DATA จาก data.js)
   ตัวอย่าง: รับ ⭐ เลี่ยง 💣 คว้า 💎 + คอมโบ + ไต่เลเวล + 2 โหมด + ออนไลน์.
   ลบส่วน "GAME LOGIC" แล้วเขียนเกมของคุณ — โครงรอบ ๆ (SDK/leaderboard/สถิติ/เสียง/ออนไลน์)
   คือ "วัฒนธรรมมาตรฐาน" คงไว้ทุกเกม. เทคนิค juice ทำเครื่องหมาย // [JUICE] ให้ลอกไปใช้ได้ */

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

/* ═══ โหมดแข่งขัน (KampaiVersus: เดี่ยว + local hot-seat + online) ═══ */
let vs = null;
if (CFG.ENABLE_ONLINE && window.KampaiVersus) {
    vs = KampaiVersus.create({
        duration: CFG.ONLINE_DURATION,
        title: 'แข่งเก็บดาว',
        onPlay: function () { startGame('online'); },          // GO! (ใช้ rng ถ้าโจทย์ต้องตรงทุกเครื่อง)
        onEnd:  function () { isGameOver = true; },             // หมดเวลา → หยุดรับ input (เฟรมเวิร์กคิดอันดับ)
    });
    document.getElementById('online-btn').style.display = '';
}
function openOnline() { if (vs) vs.openMenu(); }

/* ═══════════════════════════════════════════════════════════════════════════
   GAME LOGIC (เขียนเกมของคุณตรงนี้ — ตัวอย่าง: ตะกร้ารับดาว)
   ═══════════════════════════════════════════════════════════════════════════ */
let mode = 'adventure', score = 0, lives = CFG.LIVES, level = 1, combo = 0;
let caught = 0, isGameOver = false, started = false;
let items = [], basketX = 0, dragX = null;
let spawnTs = 0, levelTs = 0, timeLeft = CFG.TIME_SECONDS, timerId = null;

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
let cw = 0, ch = 0;
function resize() { cw = canvas.width = window.innerWidth; ch = canvas.height = window.innerHeight; }
resize(); window.addEventListener('resize', resize);

const $ = (id) => document.getElementById(id);
function comboMult() { return Math.min(CFG.COMBO_MAX, 1 + Math.floor(combo / CFG.COMBO_STEP)); }

function setScore(n) {
    score = Math.max(0, n);
    $('score-value').innerText = score;
    const w = $('score-container'); w.classList.add('pop'); setTimeout(() => w.classList.remove('pop'), 150);
}
function setLives(n) {
    lives = Math.max(0, n);
    let s = ''; for (let i = 0; i < CFG.LIVES; i++) s += (i < lives) ? '❤️' : '🖤';
    $('life-container').innerText = s;
    if (lives <= 0 && mode === 'adventure') endGame();
}
function renderCombo() {
    const b = $('combo-badge');
    b.innerText = comboMult() > 1 ? ('🔥 คอมโบ x' + comboMult()) : '';
    b.classList.add('bump'); setTimeout(() => b.classList.remove('bump'), 120);
}

// [JUICE] particle burst + คะแนนเด้งลอยขึ้น ที่ตำแหน่งรับ
function burst(x, y, color) {
    for (let i = 0; i < 10; i++) {
        const p = document.createElement('div'); p.className = 'particle';
        const a = (Math.PI * 2 / 10) * i, d = 30 + Math.random() * 40, sz = 6 + Math.random() * 6;
        p.style.cssText = `left:${x}px;top:${y}px;width:${sz}px;height:${sz}px;background:${color};--dx:${(Math.cos(a)*d)|0}px;--dy:${(Math.sin(a)*d)|0}px;`;
        document.body.appendChild(p); p.addEventListener('animationend', () => p.remove());
    }
}
function scorePop(x, y, text, color) {
    const el = document.createElement('div'); el.className = 'score-pop';
    el.textContent = text; el.style.cssText = `left:${x}px;top:${y}px;color:${color};font-size:${22 + comboMult()*2}px;`;
    document.body.appendChild(el); el.addEventListener('animationend', () => el.remove());
}
function shake() { document.body.classList.remove('shake'); void document.body.offsetWidth; document.body.classList.add('shake'); }
function toast(text) { const t = $('toast'); t.textContent = text; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); }

function spawnItem() {
    const r = Math.random();
    let kind, e;
    if (r < CFG.BAD_CHANCE) { kind = 'bad'; e = DATA.BAD[(Math.random()*DATA.BAD.length)|0]; }
    else if (r < CFG.BAD_CHANCE + CFG.BONUS_CHANCE) { kind = 'bonus'; e = DATA.BONUS; }
    else { kind = 'good'; e = DATA.GOOD[(Math.random()*DATA.GOOD.length)|0]; }
    const fall = CFG.FALL_START + (level - 1) * CFG.SPEED_RAMP;
    items.push({ x: 40 + Math.random() * (cw - 80), y: -24, v: fall + Math.random(), kind, e, rot: 0, vr: (Math.random()-0.5)*0.2 });
}

function onCatch(it) {
    const x = it.x, y = ch - 70;
    if (it.kind === 'bad') {
        combo = 0; renderCombo(); shake();
        KAMPAI.sound.wrong(); KAMPAI.sound.fxFlash(false);
        scorePop(x, y, '💥', '#f87171');
        if (mode === 'adventure') setLives(lives - 1);
        else setScore(score - CFG.GOOD_POINTS);   // time/online: ไม่มีชีวิต → หักคะแนนแทน
        return;
    }
    // good / bonus
    const base = it.kind === 'bonus' ? CFG.BONUS_POINTS : CFG.GOOD_POINTS;
    const gain = base * comboMult();
    combo++; caught++; setScore(score + gain); renderCombo();
    burst(x, y, it.kind === 'bonus' ? '#22d3ee' : '#FFD700');
    scorePop(x, y, '+' + gain, it.kind === 'bonus' ? '#22d3ee' : '#FFD700');
    KAMPAI.sound.correct(); KAMPAI.sound.fxFlash(true);
    basketPop = 1.25;
    if (mode === 'online' && vs) vs.report(score, { correct: caught });
}

let basketPop = 1;
function startGame(m) {
    if (started && m !== 'online' && mode !== 'online') return;
    mode = m || 'adventure';
    KAMPAI.beginRound();
    started = true; isGameOver = false;
    score = 0; lives = CFG.LIVES; level = 1; combo = 0; caught = 0; items = []; basketX = cw / 2; dragX = null;
    spawnTs = 0; levelTs = performance.now(); timeLeft = CFG.TIME_SECONDS;
    setScore(0); renderCombo();
    $('level-badge').innerText = 'เลเวล 1';
    $('player-chip').style.display = KAMPAI.student ? 'flex' : 'none';
    $('blocker').style.display = 'none';
    // [MODE] โหมดต่างกันโชว์ HUD ต่างกัน
    if (mode === 'adventure') {
        $('life-container').style.display = 'block'; setLives(CFG.LIVES);
        $('timer-container').style.display = 'none';
    } else if (mode === 'time') {
        $('life-container').style.display = 'none';
        $('timer-container').style.display = 'block'; $('timer-value').innerText = CFG.TIME_SECONDS;
        if (timerId) clearInterval(timerId);
        timerId = setInterval(tickTimer, 1000);
    } else { // online: เฟรมเวิร์กคุมนาฬิกา+จบเอง
        $('life-container').style.display = 'none';
        $('timer-container').style.display = 'none';
    }
    KAMPAI.sound.unlock(); KAMPAI.sound.bgmStart();
    requestAnimationFrame(loop);
}

function cleanupRound() {
    if (timerId) { clearInterval(timerId); timerId = null; }
    isGameOver = true;
    dragX = null;
    KAMPAI.sound.bgmStop();
}

function restartGame() {
    cleanupRound();
    started = false;
    $('gameover-screen').style.display = 'none';
    startGame(mode === 'time' ? 'time' : 'adventure');
}

function tickTimer() {
    timeLeft--;
    $('timer-value').innerText = timeLeft;
    $('timer-container').classList.toggle('low', timeLeft <= 10);
    if (timeLeft <= 0) endGame();
}

function loop(ts) {
    if (isGameOver) return;

    // เลื่อนตะกร้า: ปุ่ม (KAMPAI.input) หรือลากตามนิ้ว (dragX)
    if (KAMPAI.input.left)  basketX -= CFG.SPEED;
    if (KAMPAI.input.right) basketX += CFG.SPEED;
    if (dragX !== null) basketX += (dragX - basketX) * 0.35;   // [JUICE] ลากลื่น (lerp)
    basketX = Math.max(40, Math.min(cw - 40, basketX));

    // [MODE] ไต่เลเวล: เร็วขึ้นตามเวลา
    if (ts - levelTs > CFG.LEVEL_EVERY_MS) { level++; levelTs = ts; $('level-badge').innerText = 'เลเวล ' + level; toast('⚡ เลเวล ' + level + '!'); }

    const interval = Math.max(CFG.SPAWN_MIN_MS, CFG.SPAWN_START_MS - (level - 1) * CFG.SPAWN_RAMP_MS);
    if (ts - spawnTs > interval) { spawnTs = ts; spawnItem(); }

    ctx.clearRect(0, 0, cw, ch);
    const basketY = ch - 60;
    for (let i = items.length - 1; i >= 0; i--) {
        const it = items[i]; it.y += it.v; it.rot += it.vr;
        ctx.save(); ctx.translate(it.x, it.y); ctx.rotate(it.rot); ctx.font = '34px serif'; ctx.textAlign = 'center'; ctx.fillText(it.e, 0, 0); ctx.restore();
        if (it.y > basketY - 26 && it.y < basketY + 30 && Math.abs(it.x - basketX) < 52) { onCatch(it); items.splice(i, 1); }
        else if (it.y > ch + 20) { items.splice(i, 1); if (it.kind === 'good') { combo = 0; renderCombo(); } }   // พลาดของดี = คอมโบหลุด
    }
    // [JUICE] ตะกร้า squash-pop ตอนรับ
    basketPop += (1 - basketPop) * 0.2;
    ctx.save(); ctx.translate(basketX, basketY + 6); ctx.scale(1 + (basketPop-1), 1 - (basketPop-1)*0.6); ctx.font = '50px serif'; ctx.textAlign = 'center'; ctx.fillText(DATA.BASKET, 0, 14); ctx.restore();

    requestAnimationFrame(loop);
}

// ⚠️ เดี่ยวต้อง submitScore ตอนจบ; KampaiVersus จัดการผลของ local/online ให้เอง
function endGame() {
    if (isGameOver) return;
    isGameOver = true;
    if (timerId) { clearInterval(timerId); timerId = null; }
    if (vs && vs.finish(score, { correct: caught })) return;
    KAMPAI.sound.bgmStop(); KAMPAI.sound.gameOver();
    const stars = CFG.STAR_THRESHOLDS.filter((t) => score >= t).length;
    KAMPAI.submitScore(score, { mode: 'normal', stars, caught, level });
    $('go-stars').innerText = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
    $('final-score').innerText = score;
    $('go-summary').innerText = 'รับได้ ' + caught + ' ชิ้น · ถึงเลเวล ' + level + ' · โหมด ' + (mode === 'time' ? 'แข่งเวลา' : 'ผจญภัย');
    $('gameover-screen').style.display = 'flex';
    renderLeaderboard('score-list-gameover');
}

// ลากตะกร้าตามนิ้ว/เมาส์ + คีย์บอร์ด (D-pad/ลูกศร) ทำงานพร้อมกัน
canvas.addEventListener('pointerdown', (e) => { dragX = e.clientX; });
canvas.addEventListener('pointermove', (e) => { if (dragX !== null) dragX = e.clientX; });
window.addEventListener('pointerup', () => { dragX = null; });
