/*!
 * kampai-match.js — เฟรมเวิร์ก "เกมออนไลน์หลายคน" สำหรับเกม HTML ในระบบ kampai-school
 *
 * drop-in เดียว สร้างบน KAMPAI.online (wrapper รีเลย์ Supabase Realtime broadcast+presence).
 * จัดการให้ครบ: สร้าง/เข้าห้อง · lobby + presence สด · นับถอยหลังซิงค์ · นาฬิกา ·
 * แถบคะแนนคู่แข่งสด · จัดอันดับผู้ชนะ · seeded RNG (โจทย์ตรงกันทุกเครื่อง) · submit คะแนน.
 * เกมเขียนแค่: ปุ่มเปิด → KampaiMatch.create({duration,onPlay,onEnd}) + match.report() ตอนได้คะแนน.
 *
 * ใช้:
 *   <script src="/games/kampai-sdk.js"></script>
 *   <script src="/games/kampai-match.js"></script>
 *   const match = KampaiMatch.create({
 *     duration: 60, title: 'แข่งสูตรคูณ',
 *     onPlay: ({ rng, seed, room }) => startMyGame(rng),   // เริ่มเล่นจริง (ใช้ rng ให้โจทย์ตรงกัน)
 *     onEnd:  () => stopMyGame(),                           // หมดเวลา → หยุดรับ input
 *   });
 *   // ปุ่ม "ออนไลน์": onclick = () => match.openMenu();
 *   // ตอนได้คะแนน:   match.report(score, { correct });
 *
 * เอกสาร: GAME.md (Online Multiplayer Framework)
 */
(function () {
  'use strict';
  var STYLE_ID = 'kampai-match-style';

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // mulberry32 — PRNG เล็ก ๆ ที่ผลเหมือนกันทุกเครื่องเมื่อ seed เท่ากัน (= รหัสห้อง)
  function mulberry32(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.km-root{position:fixed;inset:0;z-index:100000;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(15,23,42,.92);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font-family:Sarabun,Kanit,system-ui,sans-serif;color:#fff;box-sizing:border-box}',
      '.km-card{position:relative;width:100%;max-width:440px;max-height:92vh;overflow-y:auto;background:rgba(30,41,59,.96);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:24px 22px;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.5)}',
      '.km-close{position:absolute;top:10px;right:12px;background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer;line-height:1}',
      '.km-screen{display:none}.km-screen.on{display:block}',
      '.km-h{font-size:26px;font-weight:800;margin:0 0 6px;background:linear-gradient(135deg,#FFD700,#FFA500);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}',
      '.km-p{font-size:14px;color:#cbd5e1;margin:0 0 16px;line-height:1.5}',
      '.km-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:13px 26px;font-family:inherit;font-size:17px;font-weight:700;border:none;border-radius:999px;cursor:pointer;color:#fff;margin:6px 4px;transition:transform .1s}',
      '.km-btn:active{transform:scale(.95)}',
      '.km-btn-primary{background:linear-gradient(45deg,#f59e0b,#f97316);box-shadow:0 4px 10px rgba(245,158,11,.4)}',
      '.km-btn-blue{background:linear-gradient(45deg,#3b82f6,#2563eb)}',
      '.km-btn-ghost{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.25)}',
      '.km-join{display:flex;gap:8px;justify-content:center;align-items:center;margin:10px 0}',
      '.km-input{width:150px;height:54px;text-align:center;font-size:28px;font-weight:800;letter-spacing:8px;border-radius:14px;border:2px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#fff}',
      '.km-msg{font-size:13px;color:#f87171;min-height:18px;margin-top:6px}',
      '.km-code{font-size:64px;font-weight:800;letter-spacing:12px;color:#FFD700;text-shadow:2px 2px 0 rgba(0,0,0,.3);margin:6px 0}',
      '.km-members-title{font-size:14px;color:#cbd5e1;text-align:left;margin:10px 0 6px;font-weight:600}',
      '.km-list{display:flex;flex-direction:column;gap:3px;max-height:240px;overflow-y:auto;margin-bottom:12px}',
      '.km-row{display:flex;align-items:center;gap:10px;padding:6px 4px;border-radius:10px}',
      '.km-row.me{background:rgba(251,191,36,.14)}',
      '.km-rank{min-width:24px;text-align:center;font-weight:800;color:#f39c12;font-size:16px;flex:0 0 auto}',
      '.km-av,.km-init{width:34px;height:34px;border-radius:50%;object-fit:cover;flex:0 0 auto}',
      '.km-init{background:linear-gradient(135deg,#6c5ce7,#a29bfe);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:15px}',
      '.km-main{flex:1 1 auto;min-width:0;text-align:left}',
      '.km-name{font-size:14px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.km-sub{font-size:11px;color:#94a3b8}',
      '.km-track{height:7px;background:rgba(255,255,255,.12);border-radius:999px;overflow:hidden;margin-top:3px}',
      '.km-fill{height:100%;background:linear-gradient(90deg,#4ade80,#22c55e);border-radius:999px;transition:width .25s}',
      '.km-score{font-weight:800;color:#FFD700;font-size:18px;min-width:42px;text-align:right;flex:0 0 auto}',
      '.km-wait{font-size:13px;color:#94a3b8;margin:8px 0}',
      '.km-place{font-size:19px;font-weight:700;color:#FFD700;margin-bottom:10px}',
      // live scoreboard panel (ระหว่างแข่ง)
      '.km-board{position:fixed;top:54px;right:10px;width:210px;max-width:46vw;z-index:99990;font-family:Sarabun,Kanit,system-ui,sans-serif}',
      '.km-board-box{background:rgba(15,23,42,.8);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.12);border-radius:14px;padding:9px 11px;color:#fff}',
      '.km-board-title{font-size:13px;color:#cbd5e1;font-weight:700;margin-bottom:6px}',
      '.km-clock{color:#FFD700;font-weight:800}',
      // countdown
      '.km-cd{position:fixed;inset:0;z-index:100001;display:flex;align-items:center;justify-content:center;background:rgba(15,23,42,.85);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}',
      '.km-cd span{font-size:150px;font-weight:800;color:#FFD700;text-shadow:4px 4px 0 rgba(0,0,0,.3);font-family:Kanit,Sarabun,system-ui,sans-serif;animation:kmcd 1s ease-in-out}',
      '@keyframes kmcd{0%{transform:scale(.3);opacity:0}40%{transform:scale(1.1);opacity:1}100%{transform:scale(1);opacity:1}}'
    ].join('');
    (document.head || document.documentElement).appendChild(s);
  }

  function avatarHtml(m) {
    return m.photoUrl
      ? '<img class="km-av" src="' + esc(m.photoUrl) + '" alt="">'
      : '<span class="km-init">' + esc((m.name || '?').charAt(0)) + '</span>';
  }

  function create(opts) {
    opts = opts || {};
    var duration = opts.duration || 60;
    var title = opts.title || 'แข่งออนไลน์';
    var autoSubmit = opts.autoSubmit !== false;
    var online = function () { return (window.KAMPAI && window.KAMPAI.online) || null; };
    var available = !!(online() && online().available);

    injectStyles();

    // ─── build DOM ─────────────────────────────────────────────────────────
    var root = document.createElement('div');
    root.className = 'km-root'; root.style.display = 'none';
    root.innerHTML =
      '<div class="km-card"><button class="km-close" type="button">✕</button>' +
      '<div class="km-screen km-menu"><div class="km-h">🌐 ' + esc(title) + '</div>' +
        '<div class="km-p">แข่งกับเพื่อนต่างเครื่อง ' + duration + ' วินาที — ตอบถูกมากสุดชนะ 🏆</div>' +
        '<button class="km-btn km-btn-primary km-create" type="button">➕ สร้างห้อง</button>' +
        '<div class="km-join"><input class="km-input" inputmode="numeric" pattern="[0-9]*" maxlength="4" placeholder="รหัส">' +
        '<button class="km-btn km-btn-blue km-joinbtn" type="button">เข้าร่วม</button></div>' +
        '<div class="km-p" style="margin:2px 0">มีรหัสห้องแล้ว? กรอกรหัส 4 หลักเพื่อเข้าร่วม</div>' +
        '<div class="km-msg"></div></div>' +
      '<div class="km-screen km-lobby"><div class="km-h">ห้องแข่ง</div>' +
        '<div class="km-p" style="margin:0">บอกรหัสนี้ให้เพื่อนเข้าร่วม</div>' +
        '<div class="km-code">----</div>' +
        '<div class="km-members-title">👥 ผู้เล่น (<span class="km-count">0</span>)</div>' +
        '<div class="km-list km-lobby-list"></div>' +
        '<button class="km-btn km-btn-primary km-start" type="button" style="display:none">🚀 เริ่มแข่ง</button>' +
        '<div class="km-wait" style="display:none">รอเจ้าของห้องเริ่มเกม...</div>' +
        '<button class="km-btn km-btn-ghost km-leave" type="button">← ออกจากห้อง</button></div>' +
      '<div class="km-screen km-result"><div class="km-h km-result-title">จบการแข่ง!</div>' +
        '<div class="km-place"></div><div class="km-list km-result-list"></div>' +
        '<button class="km-btn km-btn-primary km-bank" type="button">รับ XP →</button></div>' +
      '</div>';
    document.body.appendChild(root);

    var board = document.createElement('div');
    board.className = 'km-board'; board.style.display = 'none';
    board.innerHTML = '<div class="km-board-box"><div class="km-board-title">🏁 คู่แข่งสด · <span class="km-clock">0:00</span></div><div class="km-list km-board-list" style="max-height:50vh;margin:0"></div></div>';
    document.body.appendChild(board);

    var cd = document.createElement('div');
    cd.className = 'km-cd'; cd.style.display = 'none';
    cd.innerHTML = '<span></span>';
    document.body.appendChild(cd);

    var $ = function (sel) { return root.querySelector(sel); };

    // ─── state ─────────────────────────────────────────────────────────────
    var room = null, isHost = false, myId = null, members = {};
    var started = false, ended = false, resultShown = false, submitted = false;
    var endsAt = 0, rafId = 0, sendTs = 0, finishTimer = 0, bankTimer = 0, lastScore = 0, lastCorrect = 0;

    // ─── wire UI ───────────────────────────────────────────────────────────
    $('.km-close').onclick = function () { root.style.display = 'none'; };
    $('.km-create').onclick = function () { isHost = true; joinRoom(online().makeCode()); };
    $('.km-joinbtn').onclick = function () {
      var v = ($('.km-input').value || '').trim();
      if (!/^\d{4}$/.test(v)) { $('.km-msg').textContent = 'กรอกรหัส 4 หลัก'; return; }
      isHost = false; joinRoom(v);
    };
    $('.km-start').onclick = function () {
      online().send('start', { countdown: 3500 });
      beginRace(3500);
    };
    $('.km-leave').onclick = leave;
    $('.km-bank').onclick = bankXp;

    function showScreen(name) {
      ['menu', 'lobby', 'result'].forEach(function (n) { $('.km-' + n).classList.toggle('on', n === name); });
      root.style.display = name ? 'flex' : 'none';
    }

    function openMenu() {
      $('.km-msg').textContent = available ? '' : 'โหมดออนไลน์เล่นผ่านระบบ /play เท่านั้น';
      showScreen('menu');
    }

    function joinRoom(code) {
      if (!available) { $('.km-msg').textContent = 'โหมดออนไลน์เล่นผ่านระบบ /play เท่านั้น'; return; }
      room = String(code);
      var st = (window.KAMPAI && window.KAMPAI.student) || {};
      myId = st.id || ('me-' + Math.random().toString(36).slice(2, 7));
      members = {};
      members[myId] = { name: st.displayName || 'ฉัน', photoUrl: st.photoUrl || null, classLabel: st.classLabel || null, score: 0, correct: 0, done: false, me: true };
      $('.km-code').textContent = room;
      $('.km-start').style.display = isHost ? '' : 'none';
      $('.km-wait').style.display = isHost ? 'none' : '';
      showScreen('lobby');
      renderList('.km-lobby-list', false);
      online().join(room, { onPresence: onPresence, onEvent: onEvent });
    }

    function leave() {
      try { online() && online().leave(); } catch (e) { /* */ }
      room = null; isHost = false; started = false;
      board.style.display = 'none';
      root.style.display = 'none';
    }

    function onPresence(list) {
      var ids = {}; ids[myId] = 1;
      (list || []).forEach(function (m) {
        if (!m || !m.id) return;
        ids[m.id] = 1;
        var ex = members[m.id] || { score: 0, correct: 0, done: false };
        ex.name = m.name || ex.name || '?';
        ex.photoUrl = (m.photoUrl != null) ? m.photoUrl : (ex.photoUrl || null);
        ex.classLabel = (m.classLabel != null) ? m.classLabel : (ex.classLabel || null);
        ex.me = m.id === myId;
        members[m.id] = ex;
      });
      if (!started) {
        Object.keys(members).forEach(function (id) { if (!ids[id]) delete members[id]; });
      }
      $('.km-count').textContent = Object.keys(members).length;
      renderList('.km-lobby-list', false);
      if (started) renderBoard();
    }

    function onEvent(ev, data, fromKey) {
      if (ev === 'start') { beginRace(data && (data.countdown || 3500)); return; }
      if (!fromKey) return;
      var m = members[fromKey] || (members[fromKey] = { name: '?', photoUrl: null, classLabel: null, done: false });
      if (ev === 'score') { m.score = data.score | 0; m.correct = data.correct | 0; }
      else if (ev === 'done') { m.score = data.score | 0; m.correct = data.correct | 0; m.done = true; }
      if (started) renderBoard();
      if (ev === 'done') maybeFinish();
    }

    function beginRace(countdown) {
      if (started) return;
      started = true; ended = false; resultShown = false; lastScore = 0; lastCorrect = 0;
      if (members[myId]) { members[myId].score = 0; members[myId].correct = 0; members[myId].done = false; }
      var delay = Math.max(400, countdown || 3500);
      var seed = parseInt(room, 10) || 1;
      var rng = mulberry32(seed);
      root.style.display = 'none';            // ปิด lobby — เปิดทางให้เกมเล่น
      board.style.display = '';
      renderBoard();
      runCountdown(delay, function () {
        endsAt = Date.now() + duration * 1000;   // local clock at GO — ไม่มี clock skew ข้ามเครื่อง
        if (opts.onPlay) try { opts.onPlay({ rng: rng, seed: seed, room: room, endsAt: endsAt }); } catch (e) { /* */ }
        tick();
      });
    }

    function runCountdown(delay, done) {
      var span = cd.querySelector('span');
      var endAt = Date.now() + Math.max(400, delay);
      cd.style.display = 'flex';
      (function step() {
        var rem = endAt - Date.now();
        if (rem <= 0) { cd.style.display = 'none'; done(); return; }
        var n = Math.ceil(rem / 1000);
        var label = n <= 0 ? 'GO' : String(n);
        if (span.textContent !== label) { span.textContent = label; span.style.animation = 'none'; void span.offsetWidth; span.style.animation = 'kmcd 1s ease-in-out'; }
        requestAnimationFrame(step);
      })();
    }

    function fmt(sec) { var m = Math.floor(sec / 60), s = sec % 60; return m + ':' + (s < 10 ? '0' : '') + s; }

    function tick() {
      var rem = endsAt - Date.now();
      var sec = Math.max(0, Math.ceil(rem / 1000));
      var clk = board.querySelector('.km-clock');
      if (clk) { clk.textContent = fmt(sec); clk.style.color = sec <= 10 ? '#f87171' : '#FFD700'; }
      if (rem <= 0) { endRace(); return; }
      rafId = requestAnimationFrame(tick);
    }

    function report(score, info) {
      info = info || {};
      lastScore = score | 0; lastCorrect = info.correct | 0;
      if (members[myId]) { members[myId].score = lastScore; members[myId].correct = lastCorrect; }
      var now = (window.performance && performance.now()) || Date.now();
      if (now - sendTs > 120) { sendTs = now; if (online()) online().send('score', { score: lastScore, correct: lastCorrect }); }
      renderBoard();
    }

    function endRace() {
      if (ended) return;
      ended = true;
      cancelAnimationFrame(rafId);
      if (members[myId]) { members[myId].score = lastScore; members[myId].correct = lastCorrect; members[myId].done = true; }
      if (online()) online().send('done', { score: lastScore, correct: lastCorrect });
      if (opts.onEnd) try { opts.onEnd(); } catch (e) { /* */ }
      finishTimer = setTimeout(showResult, 2000);   // โชว์อันดับ/ผู้ชนะก่อน — XP รับทีหลัง
      maybeFinish();
    }

    // บันทึก XP — ยิง gameEnd → wrapper ขึ้นจอ "+XP" (ทับ overlay นี้). เรียกตอนกด "รับ XP" หรือ auto กันลืม
    function bankXp() {
      if (submitted) return; submitted = true;
      clearTimeout(bankTimer);
      var ok = false;
      try { ok = !!(window.KAMPAI && window.KAMPAI.submitScore && window.KAMPAI.submitScore(lastScore, { mode: 'online', correct: lastCorrect, room: room })); } catch (e) { /* */ }
      if (!ok) location.reload();   // standalone/ไม่มีนักเรียน → ไม่มีจอ wrapper → เริ่มใหม่
    }

    // จบก่อนเวลา (สำหรับเกมที่อยากจบเอง) — race ปกติไม่ต้องเรียก
    function finishNow(score, info) { if (started && !ended) { report(score, info); endRace(); } }

    function maybeFinish() {
      if (!ended) return;
      var all = Object.keys(members).map(function (id) { return members[id]; });
      if (all.length && all.every(function (m) { return m.done; })) { clearTimeout(finishTimer); showResult(); }
    }

    function rankMembers() {
      return Object.keys(members).map(function (id) {
        var m = members[id]; return { id: id, name: m.name, photoUrl: m.photoUrl, classLabel: m.classLabel, score: m.score || 0, correct: m.correct || 0, done: m.done, me: m.me };
      }).sort(function (a, b) { return (b.correct - a.correct) || (b.score - a.score); });
    }

    function showResult() {
      if (resultShown) return; resultShown = true;
      cancelAnimationFrame(rafId);
      board.style.display = 'none';
      var ranked = rankMembers();
      var myRank = 0;
      for (var i = 0; i < ranked.length; i++) { if (ranked[i].id === myId) { myRank = i + 1; break; } }
      $('.km-result-title').textContent = (myRank === 1 && ranked.length > 1) ? '🏆 คุณชนะ!' : 'จบการแข่ง!';
      $('.km-place').textContent = myRank > 0 ? ('คุณได้อันดับ ' + myRank + ' จาก ' + ranked.length) : '';
      renderResult('.km-result-list', ranked);
      showScreen('result');
      // กันลืมรับ: ถ้าไม่กดปุ่มภายใน 20 วิ → บันทึก XP อัตโนมัติ (autoSubmit เปิดอยู่)
      if (autoSubmit) { clearTimeout(bankTimer); bankTimer = setTimeout(bankXp, 20000); }
    }

    function renderList(sel, withScore) {
      var el = $(sel); if (!el) return;
      var list = withScore ? rankMembers()
        : Object.keys(members).map(function (id) { var m = members[id]; return { id: id, name: m.name, photoUrl: m.photoUrl, classLabel: m.classLabel, score: m.score || 0, correct: m.correct || 0, done: m.done, me: m.me }; });
      var maxC = 1; list.forEach(function (m) { if ((m.correct || 0) > maxC) maxC = m.correct; });
      el.innerHTML = list.map(function (m, i) {
        var rank = withScore ? '<span class="km-rank">' + (i + 1) + '</span>' : '';
        var bar = withScore ? '<div class="km-track"><div class="km-fill" style="width:' + Math.round((m.correct || 0) / maxC * 100) + '%"></div></div>' : '';
        var sc = withScore ? '<span class="km-score">' + (m.score || 0) + (m.done ? ' ✓' : '') + '</span>' : '';
        return '<div class="km-row' + (m.me ? ' me' : '') + '">' + rank + avatarHtml(m) +
          '<div class="km-main"><div class="km-name">' + esc(m.name || '?') + (m.me ? ' (คุณ)' : '') + '</div>' + bar + '</div>' + sc + '</div>';
      }).join('') || '<div class="km-wait">ยังไม่มีผู้เล่น...</div>';
    }
    function renderBoard() { renderList('.km-board-list', true); }

    function renderResult(sel, ranked) {
      var el = $(sel); if (!el) return;
      var medals = ['🥇', '🥈', '🥉'];
      el.innerHTML = ranked.map(function (m, i) {
        return '<div class="km-row' + (m.me ? ' me' : '') + '"><span class="km-rank">' + (medals[i] || (i + 1)) + '</span>' +
          avatarHtml(m) + '<div class="km-main"><div class="km-name">' + esc(m.name || '?') + (m.me ? ' (คุณ)' : '') +
          '</div><div class="km-sub">ตอบถูก ' + (m.correct || 0) + ' ข้อ</div></div><span class="km-score">' + (m.score || 0) + '</span></div>';
      }).join('');
    }

    return { available: available, openMenu: openMenu, report: report, finish: finishNow, leave: leave };
  }

  window.KampaiMatch = { version: '1.0.0', create: create };
})();
