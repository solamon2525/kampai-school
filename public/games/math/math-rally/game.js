/* game.js — "รถซิ่งคณิตศาสตร์" (math-rally)
   Racing duel 2 เลน: ตอบคำถามคณิตศาสตร์ถูก → รถพุ่ง · ผิด → รถช้า · ถึงเส้นชัยก่อนชนะ
   โหมด vs คอม (AI 3 ระดับ) + ออนไลน์ (kampai-match: rankBy 'score' + onOpponent ขยับรถคู่แข่งสด) */

/* ═══ ตั้งค่า KAMPAI จาก config (วัฒนธรรมมาตรฐาน) ═══ */
const CFG = window.GAME_CONFIG;
const DATA = window.GAME_DATA;
KAMPAI.setSlug(CFG.SLUG);
KAMPAI.sound.defaultBgm(CFG.BGM);
KAMPAI.sound.mountToggles();

const $ = (id) => document.getElementById(id);

/* ═══ ข้อมูลนักเรียน + leaderboard (จาก KAMPAI — ไม่ยิง DB เอง) ═══ */
function renderPlayer() {
    const s = KAMPAI.student, st = KAMPAI.stats;
    if (!s) return;
    const chip = $('player-chip');
    const av = s.photoUrl ? `<img src="${s.photoUrl}" alt="">` : `<div class="pc-init">${(s.displayName||'?')[0]}</div>`;
    const best = st ? ` · <span class="pc-best">สถิติ ${st.personalBest.toLocaleString()}</span>` : '';
    chip.innerHTML = av + `<span>${s.displayName}${best}</span>`;
    chip.style.display = 'flex';
    $('lane-player-name').textContent = `${DATA.PLAYER_CAR} ${s.displayName}`;
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

/* ═══ โหมดออนไลน์ (kampai-match) — rankBy score: ใครถึงเส้นชัย/ไกลสุดชนะ ═══ */
let match = null;
if (CFG.ENABLE_ONLINE && window.KampaiMatch) {
    match = KampaiVersus.create({ rankBy: 'correct',
        duration: CFG.ONLINE_DURATION,
        title: 'รถซิ่งคณิตศาสตร์',
        tournament: true,
        rankBy: 'score',                                   // อันดับตามระยะ/score ไม่ใช่จำนวนข้อถูก
        onPlay: (o) => startRace('online', o),             // GO! — rng โจทย์+ไอเทมตรงกันทุกเครื่อง
        onOpponent: onOpponentUpdate,                      // ระยะคู่แข่งสด → ขยับรถเลนบน
        onEnd: () => { 
            onlineEnded = true; 
            locked = true; 
            isGameOver = true;
            cancelAnimationFrame(rafId);
            KAMPAI.sound.stopSpeak();
            KAMPAI.sound.bgmStop();
        },
    });
    $('online-btn').style.display = '';

    // Monkey-patch close button to reset state when leaving online lobby
    const closeBtn = document.querySelector('.km-close');
    if (closeBtn) {
        const originalClick = closeBtn.onclick;
        closeBtn.onclick = function (e) {
            if (originalClick) originalClick.call(this, e);
            if (raceDone || isGameOver || started) {
                started = false;
                isGameOver = false;
                raceDone = false;
                $('blocker').style.display = 'flex';
                KAMPAI.sound.bgmStop();
                cancelAnimationFrame(rafId);
            }
        };
    }
}
function openOnline() { KAMPAI.sound.unlock(); if (match) match.openMenu(); }

/* ═══════════════════════════════════════════════════════════════════════════
   GAME LOGIC — race loop
   ═══════════════════════════════════════════════════════════════════════════ */
let mode = 'cpu', difficulty = 'easy', selectedMode = 'mix';
let started = false, isGameOver = false, isSpectator = false, onlineEnded = false, raceDone = false;
let score = 0, correct = 0, wrongCount = 0, streak = 0, maxStreak = 0, lightning = 0;
let player, rival, items = [];
let curA = 0, curB = 0, curAns = 0, curOpts = [], qShownAt = 0, locked = false;
let qrand = Math.random;
let cpuNextAt = 0, raceEndAt = 0, rafId = 0, lastTs = 0;
let starTimeoutId = null;
let turtleTimeoutId = null;
let wrongTimeoutId = null;

function comboMult() { return Math.min(CFG.COMBO_MAX_MULT, 1 + Math.floor(streak / CFG.COMBO_STEP) * 0.5); }

function setScore(n) {
    score = Math.max(0, Math.round(n));
    $('score-value').innerText = score.toLocaleString();
    const w = $('score-container'); w.classList.add('pop'); setTimeout(() => w.classList.remove('pop'), 150);
}
function renderCombo() {
    const b = $('combo-badge');
    b.innerText = streak >= CFG.COMBO_STEP ? `🔥 x${comboMult()} · ${streak} ต่อ` : '';
    b.classList.add('bump'); setTimeout(() => b.classList.remove('bump'), 120);
}
function toast(text) { const t = $('toast'); t.textContent = text; t.classList.remove('show'); void t.offsetWidth; t.classList.add('show'); }
function flash(msg, good) { const f = $('feedback'); f.textContent = msg; f.className = good ? 'good' : 'bad'; }

/* ── เลือกโหมดคณิตศาสตร์ (chip: ผสม, บวก, ลบ, คูณ, หาร) ── */
(function buildModePicker() {
    const picker = $('table-picker');
    const modes = [
        { label: 'ผสม', val: 'mix' },
        { label: 'บวก ➕', val: 'add' },
        { label: 'ลบ ➖', val: 'sub' },
        { label: 'คูณ ✖️', val: 'mul' },
        { label: 'หาร ➗', val: 'div' }
    ];
    picker.innerHTML = modes.map((m, i) =>
        `<button class="tchip${i === 0 ? ' sel' : ''}" data-m="${m.val}">${m.label}</button>`).join('');
    picker.addEventListener('click', (e) => {
        const btn = e.target.closest('.tchip'); if (!btn) return;
        picker.querySelectorAll('.tchip').forEach((c) => c.classList.remove('sel'));
        btn.classList.add('sel');
        selectedMode = btn.dataset.m;
    });
})();

/* ── โจทย์ + ตัวลวง ── */
function nextQuestion() {
    locked = false;
    let op = selectedMode;
    if (op === 'mix') {
        const ops = ['add', 'sub', 'mul', 'div'];
        op = ops[(qrand() * ops.length) | 0];
    }

    let qText = '';
    let cands = [];

    if (op === 'add') {
        // Addition: 2-digit + 1-digit/2-digit
        const a = Math.floor(qrand() * 70) + 15; // 15 to 84
        const b = Math.floor(qrand() * 25) + 5;  // 5 to 29
        curAns = a + b;
        qText = `${a} + ${b}`;
        cands = [curAns + 10, curAns - 10, curAns + 1, curAns - 1, curAns + 2, curAns - 2, curAns + 11, curAns - 9];
    } else if (op === 'sub') {
        // Subtraction: 2-digit - 1-digit/2-digit (always positive)
        const a = Math.floor(qrand() * 70) + 25; // 25 to 94
        const b = Math.floor(qrand() * (a - 10)) + 5; // 5 to a-6
        curAns = a - b;
        qText = `${a} − ${b}`;
        cands = [curAns + 10, curAns - 10, curAns + 1, curAns - 1, curAns + 2, curAns - 2, curAns + 9, curAns - 11];
    } else if (op === 'mul') {
        // Multiplication: 2-12 tables
        const a = Math.floor(qrand() * 11) + 2; // 2 to 12
        const b = Math.floor(qrand() * 11) + 2; // 2 to 12
        curAns = a * b;
        qText = `${a} × ${b}`;
        cands = [curAns + a, curAns - a, curAns + b, curAns - b, curAns + 1, curAns - 1, a * (b + 1), a * (b - 1)];
    } else {
        // Division: quotients 2-12, divisors 2-12
        const ans = Math.floor(qrand() * 11) + 2; // 2 to 12
        const b = Math.floor(qrand() * 11) + 2;   // 2 to 12
        const a = ans * b;
        curAns = ans;
        qText = `${a} ÷ ${b}`;
        cands = [curAns + 1, curAns - 1, curAns + 2, curAns - 2, curAns + 3, curAns - 3, curAns + 4, curAns - 4];
    }

    const set = new Set([curAns]);
    for (const c of cands) {
        if (c > 0 && c !== curAns) set.add(c);
        if (set.size >= 4) break;
    }
    while (set.size < 4) {
        const r = curAns + ((qrand() * 9 | 0) - 4);
        if (r > 0) set.add(r);
    }
    const arr = [...set].slice(0, 4);
    for (let i = arr.length - 1; i > 0; i--) {
        const j = (qrand() * (i + 1)) | 0;
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    curOpts = arr;

    const q = $('question');
    q.textContent = qText;
    q.classList.add('bump'); setTimeout(() => q.classList.remove('bump'), 250);
    $('feedback').textContent = ''; $('feedback').className = '';
    document.querySelectorAll('.ans').forEach((b, i) => {
        b.querySelector('.v').textContent = arr[i];
        b.classList.remove('correct', 'wrong', 'dim');
        b.disabled = false;
    });
    $('q-timer-bar').classList.remove('warn');
    qShownAt = performance.now();
    
    if (mode !== 'online') {
        let speakText = '';
        if (op === 'add') speakText = qText.replace('+', 'บวก');
        else if (op === 'sub') speakText = qText.replace('−', 'ลบ');
        else if (op === 'mul') speakText = qText.replace('×', 'คูณ');
        else if (op === 'div') speakText = qText.replace('÷', 'หารด้วย');
        KAMPAI.sound.speak(speakText, 'th-TH');
    }
}

function revealAnswer() {
    document.querySelectorAll('.ans').forEach((b, i) => {
        if (curOpts[i] === curAns) b.classList.add('correct');
        else b.classList.add('dim');
        b.disabled = true;
    });
}

/* ── ตอบ ── */
function answer(i) {
    if (!started || isGameOver || raceDone || locked || isSpectator) return;
    const now = performance.now();
    if (now < (player.lockUntil || 0)) return;   // โดนล็อกหลังตอบผิด
    locked = true;
    const v = curOpts[i];
    const btn = document.querySelectorAll('.ans')[i];
    const elapsed = now - qShownAt;

    if (v === curAns) {
        btn.classList.add('correct');
        KAMPAI.sound.correct(); KAMPAI.sound.fxFlash(true);
        correct++; streak++; maxStreak = Math.max(maxStreak, streak);
        const mult = comboMult();
        // รถพุ่ง: ระยะทันที + ความเร็วเพิ่ม
        let gainDist = CFG.BOOST_DIST * mult;
        if (elapsed < CFG.FAST_ANSWER_MS) { gainDist += CFG.FAST_BONUS_DIST; lightning++; flash(`⚡ สายฟ้า! +${Math.round(gainDist)}`, true); }
        else flash(`+${Math.round(gainDist)} 🏁`, true);
        player.dist += gainDist;
        player.speed = Math.min(CFG.MAX_SPEED, player.speed + CFG.SPEED_GAIN);
        const starMult = (now < (player.starUntil || 0)) ? 2 : 1;
        setScore(score + CFG.CORRECT_POINTS * mult * starMult);
        renderCombo();
        const car = $('player-car'); car.classList.add('boost'); setTimeout(() => car.classList.remove('boost'), 400);
        reportOnline();
        setTimeout(nextQuestion, 350);
    } else {
        btn.classList.add('wrong');
        revealAnswer();
        if (player.shield) {
            player.shield = false;
            $('player-car').classList.remove('has-shield');
            toast('🛡️ โล่กันไว้!');
            flash(`คำตอบคือ ${curAns} — โล่ช่วยไว้`, false);
            KAMPAI.sound.fxFlash(false);
            setTimeout(nextQuestion, 700);
        } else {
            wrongCount++; streak = 0; renderCombo();
            KAMPAI.sound.wrong(); KAMPAI.sound.fxFlash(false);
            flash(`ผิด! คำตอบคือ ${curAns}`, false);
            player.speed *= CFG.WRONG_SPEED_MULT;
            player.lockUntil = now + CFG.WRONG_LOCK_MS;
            const car = $('player-car');
            car.classList.add('smoke', 'slowed');
            clearTimeout(wrongTimeoutId);
            wrongTimeoutId = setTimeout(() => car.classList.remove('smoke', 'slowed'), CFG.WRONG_LOCK_MS);
            setTimeout(nextQuestion, CFG.WRONG_LOCK_MS);
        }
    }
}

function questionTimeUp() {
    if (locked || raceDone) return;
    locked = true;
    revealAnswer();
    KAMPAI.sound.timeUp();
    flash(`หมดเวลา! คำตอบคือ ${curAns} ⏱️`, false);
    streak = 0; renderCombo();
    player.speed *= CFG.TIMEOUT_SPEED_MULT;   // ผิดอ่อน — ช้าลงนิดเดียว
    setTimeout(nextQuestion, 800);
}

/* ── ไอเทม: กล่อง ? วางตามระยะ (online ใช้ rng ให้ตรงกันทุกเครื่อง) ── */
function buildItems() {
    $('item-layer').innerHTML = '';
    items = [];
    const keys = Object.keys(DATA.ITEMS);
    for (let pos = CFG.ITEM_EVERY; pos < CFG.TRACK_LEN - 60; pos += CFG.ITEM_EVERY) {
        // weighted random ตามโหมด
        const r = qrand();
        let acc = 0, type = 'nitro';
        for (const k of keys) {
            acc += mode === 'online' ? DATA.ITEMS[k].onlineW : DATA.ITEMS[k].cpuW;
            if (r < acc) { type = k; break; }
        }
        const el = document.createElement('div');
        el.className = 'item-box item-' + type;
        el.textContent = DATA.ITEMS[type].e;
        el.style.left = (pos / CFG.TRACK_LEN * 86) + '%';
        $('item-layer').appendChild(el);
        items.push({ pos, type, el });
    }
}
function collectItem(it) {
    it.el.remove();
    const def = DATA.ITEMS[it.type];
    toast(`${def.e} ${def.label}`);
    KAMPAI.sound.correct();
    const now = performance.now();
    if (it.type === 'nitro') {
        player.dist += CFG.NITRO_DIST;
        const car = $('player-car'); car.classList.add('boost'); setTimeout(() => car.classList.remove('boost'), 400);
    } else if (it.type === 'shield') {
        player.shield = true; $('player-car').classList.add('has-shield');
    } else if (it.type === 'star') {
        player.starUntil = now + CFG.STAR_MS; $('player-car').classList.add('has-star');
        clearTimeout(starTimeoutId);
        starTimeoutId = setTimeout(() => $('player-car').classList.remove('has-star'), CFG.STAR_MS);
    } else if (it.type === 'turtle') {
        rival.slowUntil = now + CFG.TURTLE_MS;
        $('rival-car').classList.add('slowed');
        clearTimeout(turtleTimeoutId);
        turtleTimeoutId = setTimeout(() => $('rival-car').classList.remove('slowed'), CFG.TURTLE_MS);
    }
}

/* ── คู่แข่งออนไลน์ (จาก kampai-match onOpponent) ── */
function onOpponentUpdate(members) {
    if (mode !== 'online' || !started) return;
    const others = members.filter((m) => !m.me).sort((a, b) => b.score - a.score);
    if (!others.length) return;
    const leader = others[0];
    rival.dist = Math.min(CFG.TRACK_LEN, leader.score);
    $('rival-name').textContent = `${DATA.RIVALS.online.car} ${leader.name}`;
    // มีคนถึงเส้นชัย → จบรอบของเราด้วย (อันดับคิดตาม score ที่รายงานล่าสุด)
    if (!raceDone && !isSpectator && others.some((m) => m.done && m.score >= CFG.TRACK_LEN)) {
        finishRace(false);
    }
}
let lastReport = 0;
function reportOnline() {
    if (mode !== 'online' || !match || isSpectator) return;
    const now = performance.now();
    if (now - lastReport < 150) return;
    lastReport = now;
    match.report(Math.round(Math.min(player.dist, CFG.TRACK_LEN)), { correct });
}

/* ── เริ่มแข่ง ── */
function startCpu(diff) {
    if (started) return;
    difficulty = diff;
    startRace('cpu', {});
}
function startRace(m, opts) {
    if (started && m !== 'online') return;
    clearTimeout(starTimeoutId);
    clearTimeout(turtleTimeoutId);
    clearTimeout(wrongTimeoutId);
    mode = m;
    isSpectator = !!(opts && opts.role === 'spectator');
    qrand = (opts && opts.rng) ? opts.rng : Math.random;
    started = true; isGameOver = false; raceDone = false; onlineEnded = false;
    score = 0; correct = 0; wrongCount = 0; streak = 0; maxStreak = 0; lightning = 0;
    player = { dist: 0, speed: CFG.BASE_SPEED, slowUntil: 0, lockUntil: 0, shield: false, starUntil: 0 };
    const rv = mode === 'online' ? DATA.RIVALS.online : DATA.RIVALS[difficulty];
    rival = { dist: 0, speed: CFG.BASE_SPEED, slowUntil: 0 };
    $('rival-name').textContent = `${rv.car} ${rv.name}`;
    $('rival-car').innerHTML = rv.carSvg || rv.car;
    $('player-car').classList.remove('has-shield', 'has-star', 'smoke', 'slowed');
    $('rival-car').classList.remove('slowed');
    document.querySelectorAll('.lane').forEach((l) => l.classList.add('racing'));
    $('blocker').style.display = 'none';
    setScore(0); renderCombo();
    buildItems();

    const ai = CFG.AI[difficulty];
    cpuNextAt = performance.now() + (ai ? ai.min : 0);
    raceEndAt = performance.now() + CFG.RACE_CAP_S * 1000;

    if (isSpectator) {
        $('question').textContent = '👀 ผู้ชม';
        $('feedback').textContent = 'ดูการแข่งสด — คะแนนเต็มดูมุมล่างขวา';
        $('feedback').className = 'good';
        document.querySelectorAll('.ans').forEach((b) => { b.disabled = true; b.classList.add('dim'); });
        locked = true;
    } else {
        nextQuestion();
    }
    KAMPAI.sound.unlock(); KAMPAI.sound.bgmStart();
    lastTs = 0;
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
}

/* ── main loop ── */
function loop(ts) {
    if (isGameOver) return;
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;
    const now = performance.now();

    const finishLine = document.querySelector('.finish-line');
    const trackWidth = $('track').clientWidth;
    const finishLeft = finishLine ? finishLine.offsetLeft : trackWidth - 32;
    const playerCar = $('player-car');
    const rivalCar = $('rival-car');
    const pCarWidth = playerCar.offsetWidth || 64;
    const rCarWidth = rivalCar.offsetWidth || 64;
    const pMaxLeft = finishLeft - pCarWidth;
    const rMaxLeft = finishLeft - rCarWidth;

    if (!raceDone) {
        // ผู้เล่น: วิ่ง + decay
        const pSlow = now < player.slowUntil ? 0.5 : 1;
        player.dist += player.speed * pSlow * dt;
        player.speed = Math.max(CFG.BASE_SPEED * 0.6, player.speed - CFG.SPEED_DECAY * dt);

        // เก็บไอเทม
        for (let i = items.length - 1; i >= 0; i--) {
            if (player.dist >= items[i].pos) { collectItem(items[i]); items.splice(i, 1); }
        }

        // คู่แข่ง CPU
        if (mode === 'cpu') {
            const rSlow = now < rival.slowUntil ? 0.4 : 1;
            rival.dist += rival.speed * rSlow * dt;
            rival.speed = Math.max(CFG.BASE_SPEED * 0.6, rival.speed - CFG.SPEED_DECAY * dt);
            const ai = CFG.AI[difficulty];
            if (now >= cpuNextAt) {
                if (Math.random() < ai.acc) {
                    rival.dist += CFG.BOOST_DIST;
                    rival.speed = Math.min(CFG.MAX_SPEED, rival.speed + CFG.SPEED_GAIN);
                    const car = $('rival-car'); car.classList.add('boost'); setTimeout(() => car.classList.remove('boost'), 400);
                } else {
                    rival.speed *= CFG.WRONG_SPEED_MULT;
                }
                cpuNextAt = now + ai.min + Math.random() * (ai.max - ai.min);
            }
        }

        // โจทย์หมดเวลา
        if (!locked && !isSpectator && now - qShownAt > CFG.Q_TIME_MS) questionTimeUp();

        reportOnline();

        // Lock at max distance once reached logically
        if (player.dist >= CFG.TRACK_LEN) {
            player.dist = CFG.TRACK_LEN;
            locked = true; // Stop accepting further answers once crossing logically
        }
        if (rival.dist >= CFG.TRACK_LEN) {
            rival.dist = CFG.TRACK_LEN;
        }

        // Only trigger finish when the car physically touches the finish line visually
        const playerTouched = (player.dist >= CFG.TRACK_LEN) && (playerCar.offsetLeft + pCarWidth >= finishLeft);
        const rivalTouched = (rival.dist >= CFG.TRACK_LEN) && (rivalCar.offsetLeft + rCarWidth >= finishLeft);

        if (playerTouched) {
            finishRace(true);
        } else if (mode === 'cpu' && rivalTouched) {
            finishRace(false);
        } else if (mode === 'cpu' && now >= raceEndAt) {
            // Time up: compare distance
            finishRace(player.dist > rival.dist);
        }
    }

    // วาด
    const pPct = Math.min(100, player.dist / CFG.TRACK_LEN * 100);
    const rPct = Math.min(100, rival.dist / CFG.TRACK_LEN * 100);
    
    // Position cars dynamically in pixels so they align perfectly with the finish line at 100%
    playerCar.style.left = (pPct / 100 * pMaxLeft) + 'px';
    rivalCar.style.left = (rPct / 100 * rMaxLeft) + 'px';
    
    $('player-pct').textContent = Math.floor(pPct) + '%';
    $('rival-pct').textContent = Math.floor(rPct) + '%';
    const qFrac = isSpectator ? 1 : Math.max(0, 1 - (now - qShownAt) / CFG.Q_TIME_MS);
    const bar = $('q-timer-bar');
    bar.style.width = (qFrac * 100) + '%';
    bar.classList.toggle('warn', qFrac < 0.33);
    const remain = Math.max(0, Math.ceil((raceEndAt - now) / 1000));
    $('timer-value').textContent = remain;
    $('timer-container').classList.toggle('low', remain <= 15);

    rafId = requestAnimationFrame(loop);
}

/* ── จบการแข่ง ── */
function finishRace(won) {
    if (raceDone) return;
    raceDone = true; locked = true;
    const now = performance.now();
    const timeBonus = won ? Math.round(Math.max(0, (raceEndAt - now) / 1000) * 2) : 0;
    const finalScore = Math.round(Math.min(player.dist, CFG.TRACK_LEN))
        + (won ? CFG.WIN_BONUS + timeBonus : 0)
        + correct * CFG.CORRECT_POINTS
        + lightning * CFG.LIGHTNING_POINTS;

    if (mode === 'online') {
        // เฟรมเวิร์กคิดอันดับ (rankBy score) + จอผล + รับ XP เอง
        if (match && !isSpectator) match.finish(finalScore, { correct });
        return;
    }
    endGame(won, finalScore);
}

function spawnConfetti() {
    const layer = $('confetti-layer'); if (!layer) return;
    const colors = ['#fbbf24','#22c55e','#3b82f6','#ef4444','#a855f7','#06b6d4','#f97316'];
    for (let i = 0; i < 55; i++) {
        const el = document.createElement('div');
        el.className = 'cfetti';
        el.style.background = colors[(Math.random() * colors.length) | 0];
        el.style.left = (25 + Math.random() * 50) + '%';
        el.style.setProperty('--dx', ((Math.random() - 0.5) * 560) + 'px');
        el.style.animationDelay = (Math.random() * 0.5) + 's';
        layer.appendChild(el);
        setTimeout(() => el.remove(), 2200);
    }
}

/* ⚠️ ต้องเรียก KAMPAI.submitScore() ตอนจบ (vs คอม) — ออนไลน์ kampai-match submit ให้เอง */
function endGame(won, finalScore) {
    if (isGameOver) return;
    isGameOver = true;
    cancelAnimationFrame(rafId);
    KAMPAI.sound.stopSpeak(); KAMPAI.sound.bgmStop(); KAMPAI.sound.gameOver();
    setScore(finalScore);
    KAMPAI.submitScore(finalScore, {
        mode: 'normal', correct, maxStreak, won,
        difficulty, table: selectedMode, lightning, wrong: wrongCount,
    });
    if (won) spawnConfetti();
    $('go-title').textContent = won ? '🏆 ชนะแล้ว!' : 'จบเกม!';
    $('go-result').textContent = won ? '🥇🏁' : '🏁';
    $('final-score').textContent = finalScore.toLocaleString();
    $('go-summary').textContent = `ตอบถูก ${correct} ข้อ · สูงสุด ${maxStreak} ต่อเนื่อง · สายฟ้า ⚡${lightning}` +
        ` · โหมด ${difficulty === 'easy' ? 'ง่าย' : difficulty === 'mid' ? 'กลาง' : 'โหด'}`;
    $('gameover-screen').style.display = 'flex';
    renderLeaderboard('score-list-gameover');
}

/* ── input: แตะ/คลิก + ลูกศร ↑←→↓ ตาม layout เพชร + เลข 1-4 ── */
document.querySelectorAll('.ans').forEach((b) => {
    b.addEventListener('click', () => answer(Number(b.dataset.i)));
});
window.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
    const map = { ArrowUp: 0, ArrowLeft: 1, ArrowRight: 2, ArrowDown: 3, '1': 0, '2': 1, '3': 2, '4': 3 };
    if (!(e.key in map)) return;
    e.preventDefault();
    answer(map[e.key]);
});
