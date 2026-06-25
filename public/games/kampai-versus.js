/*!
 * kampai-versus.js — เฟรมเวิร์ก "แข่ง 2 คน" สำหรับเกม HTML ในระบบ kampai-school
 *
 * drop-in เดียว ครอบทั้ง 3 โหมดจาก wiring ชุดเดียว:
 *   • เดี่ยว    — เกมเล่นปกติ (ปุ่ม "เริ่มเกม" เดิม ไม่ต้องผ่านเฟรมเวิร์ก)
 *   • 2 คนเครื่องนี้ (local hot-seat) — จอเดียว ผลัดกันเล่น P1 → ส่งเครื่อง → P2 → เทียบผล
 *   • ออนไลน์ (ต่างเครื่อง) — delegate ให้ kampai-match.js (lobby/นับถอยหลัง/คะแนนสด/อันดับ)
 *
 * ความยุติธรรม: ทั้งสองตา (และทุกเครื่องออนไลน์) ใช้ seed เดียวกัน → โจทย์/โลกตรงกัน.
 * สถิติแชมป์ห้อง: เลือกคู่แข่ง P2 จากรายชื่อห้อง (KAMPAI.classmates) → จบแมตช์ส่ง versusEnd
 *   ให้ wrapper บันทึก 2 session (mode='versus', room ร่วม) → migration 208 จับคู่ + W/L.
 *   เล่นเร็ว (ไม่เลือกชื่อ) = ไม่เก็บสถิติ.
 *
 * ── การ wire ในเกม (สูตรเดียว ทุกเกม) ──────────────────────────────────────
 *   <script src="/games/kampai-sdk.js"></script>
 *   <script src="/games/kampai-match.js"></script>   // online (optional แต่แนะนำ)
 *   <script src="/games/kampai-versus.js"></script>
 *   const vs = KampaiVersus.create({
 *     duration: 60, title: 'แข่งบวกเลข', rankBy: 'score',
 *     onPlay: ({ rng, player }) => startRound(rng, player),  // เริ่ม 1 ตา (ใช้ rng ทำโจทย์)
 *     onEnd:  () => freezeInput(),                            // หมดเวลา/จบตา → หยุดรับ input
 *     onOpponent: (list) => {},   // online live + local sabotage (optional)
 *     sabotage: false,            // เปิดกลไก "ตอบถูก = ป่วนคู่แข่ง" รายเกม
 *   });
 *   // ปุ่ม "แข่ง 2 คน": onclick = () => vs.openMenu();
 *   // ระหว่างเล่น (ได้คะแนน): vs.report(score, { correct });
 *   // จบตา/จบเกม:
 *   //   function endGame(){ if (vs.finish(score, { correct })) return;  // versus จัดการต่อ
 *   //     KAMPAI.submitScore(score, { mode:'normal' }); showGameOver(); } // เดี่ยว
 *
 * เอกสาร: GAME.md (Two-Player Framework)
 */
(function () {
  'use strict';
  var STYLE_ID = 'kampai-versus-style';

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // mulberry32 — PRNG เล็ก ผลเหมือนกันทุกครั้งเมื่อ seed เท่ากัน (ใช้ให้โจทย์ P1=P2 ตรงกัน)
  function mulberry32(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function makeCode() { return String(1000 + Math.floor(Math.random() * 9000)); }

  function parentMsg(o) {
    try { if (window.parent && window.parent !== window) window.parent.postMessage(o, '*'); } catch (e) { /* */ }
  }

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.kv-root{position:fixed;inset:0;z-index:100000;display:none;align-items:center;justify-content:center;padding:20px;background:rgba(15,23,42,.92);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font-family:Sarabun,Kanit,system-ui,sans-serif;color:#fff;box-sizing:border-box}',
      '.kv-card{position:relative;width:100%;max-width:460px;max-height:92vh;overflow-y:auto;background:rgba(30,41,59,.96);border:1px solid rgba(255,255,255,.12);border-radius:18px;padding:24px 22px;text-align:center;box-shadow:0 12px 40px rgba(0,0,0,.5)}',
      '.kv-close{position:absolute;top:10px;right:12px;background:none;border:none;color:#94a3b8;font-size:22px;cursor:pointer;line-height:1}',
      '.kv-screen{display:none}.kv-screen.on{display:block}',
      '.kv-h{font-size:25px;font-weight:800;margin:0 0 6px;background:linear-gradient(135deg,#FFD700,#FFA500);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}',
      '.kv-p{font-size:14px;color:#cbd5e1;margin:0 0 16px;line-height:1.5}',
      '.kv-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;min-height:48px;padding:13px 26px;font-family:inherit;font-size:17px;font-weight:700;border:none;border-radius:999px;cursor:pointer;color:#fff;margin:6px 4px;transition:transform .1s}',
      '.kv-btn:active{transform:scale(.96)}',
      '.kv-btn-wide{display:flex;width:100%;max-width:340px;margin:8px auto}',
      '.kv-btn-primary{background:linear-gradient(45deg,#f59e0b,#f97316);box-shadow:0 4px 10px rgba(245,158,11,.4)}',
      '.kv-btn-blue{background:linear-gradient(45deg,#3b82f6,#2563eb)}',
      '.kv-btn-green{background:linear-gradient(45deg,#22c55e,#16a34a)}',
      '.kv-btn-ghost{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.25)}',
      '.kv-roster{display:grid;grid-template-columns:repeat(auto-fill,minmax(92px,1fr));gap:8px;max-height:228px;overflow-y:auto;margin:6px 0 12px;padding:2px}',
      '.kv-opp{display:flex;flex-direction:column;align-items:center;gap:5px;padding:9px 5px;border-radius:14px;border:2px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);cursor:pointer;min-height:44px}',
      '.kv-opp.sel{border-color:#f59e0b;background:rgba(245,158,11,.18)}',
      '.kv-oname{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:84px}',
      '.kv-empty{grid-column:1/-1;color:#94a3b8;font-size:13px;padding:14px}',
      '.kv-av,.kv-init{width:40px;height:40px;border-radius:50%;object-fit:cover;flex:0 0 auto}',
      '.kv-init{background:linear-gradient(135deg,#6c5ce7,#a29bfe);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:17px}',
      '.kv-p2label{font-size:14px;color:#fbbf24;font-weight:700;margin:4px 0 8px}',
      '.kv-h2h{font-size:12px;color:#94a3b8;min-height:16px;margin-bottom:6px}',
      // result panels
      '.kv-vs{display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:stretch;margin:6px 0 14px}',
      '.kv-panel{background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.12);border-radius:16px;padding:14px 8px;display:flex;flex-direction:column;align-items:center;gap:6px}',
      '.kv-panel.win{border-color:#FFD700;background:rgba(255,215,0,.12)}',
      '.kv-panel .kv-pscore{font-size:30px;font-weight:800;color:#FFD700;line-height:1}',
      '.kv-panel .kv-pname{font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:120px}',
      '.kv-panel .kv-psub{font-size:11px;color:#94a3b8}',
      '.kv-vsmid{display:flex;align-items:center;font-size:18px;font-weight:800;color:#94a3b8}',
      '.kv-crown{font-size:22px;height:24px}',
      // hand-off
      '.kv-ho-title{font-size:24px;font-weight:800;margin:6px 0}',
      '.kv-ho-sub{font-size:16px;color:#cbd5e1;margin-bottom:18px}',
      // turn HUD (ระหว่างเล่น)
      '.kv-hud{position:fixed;top:8px;left:50%;transform:translateX(-50%);z-index:99990;display:none;align-items:center;gap:8px;background:rgba(15,23,42,.82);-webkit-backdrop-filter:blur(4px);backdrop-filter:blur(4px);border:1px solid rgba(255,255,255,.16);border-radius:999px;padding:6px 14px;font-family:Sarabun,Kanit,system-ui,sans-serif;color:#fff;font-size:14px;font-weight:700;white-space:nowrap}',
      '.kv-hud.on{display:flex}',
      '.kv-hud-clock{color:#FFD700}.kv-hud-clock.low{color:#f87171}',
      '.kv-hud-score{color:#4ade80}',
      // countdown
      '.kv-cd{position:fixed;inset:0;z-index:100001;display:none;flex-direction:column;align-items:center;justify-content:center;background:rgba(15,23,42,.88);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px)}',
      '.kv-cd-label{font-size:26px;font-weight:800;color:#fff;font-family:Kanit,Sarabun,system-ui,sans-serif;margin-bottom:8px}',
      '.kv-cd-num{font-size:140px;font-weight:800;color:#FFD700;text-shadow:4px 4px 0 rgba(0,0,0,.3);font-family:Kanit,Sarabun,system-ui,sans-serif;animation:kvcd 1s ease-in-out;line-height:1}',
      '@keyframes kvcd{0%{transform:scale(.3);opacity:0}40%{transform:scale(1.1);opacity:1}100%{transform:scale(1);opacity:1}}'
    ].join('');
    (document.head || document.documentElement).appendChild(s);
  }

  function avatarHtml(m, cls) {
    cls = cls || 'kv-av';
    return m && m.photoUrl
      ? '<img class="' + cls + '" src="' + esc(m.photoUrl) + '" alt="">'
      : '<span class="' + cls.replace('kv-av', 'kv-init') + '">' + esc(((m && m.name) || '?').charAt(0)) + '</span>';
  }

  function create(opts) {
    opts = opts || {};
    var duration = opts.duration || 60;
    var title = opts.title || 'แข่ง 2 คน';
    var rankBy = opts.rankBy === 'correct' ? 'correct' : 'score';
    var rounds = Math.max(1, opts.rounds || 1);       // best-of-N (local)
    var sabotageOn = !!opts.sabotage;

    injectStyles();

    // ─── online: delegate ให้ KampaiMatch (lazy) ───────────────────────────
    var onlineMatch = null;
    function ensureOnline() {
      if (onlineMatch) return onlineMatch;
      if (!(window.KampaiMatch && window.KampaiMatch.create)) return null;
      onlineMatch = window.KampaiMatch.create({
        duration: duration, title: title, rankBy: rankBy, tournament: opts.tournament,
        onPlay: function (info) {
          activeMode = 'online'; inRound = true;
          callPlay({ rng: info.rng, seed: info.seed, room: info.room, role: info.role, player: null, round: 1, mode: 'online' });
        },
        onEnd: function () { callEnd(); },
        onOpponent: function (list) { if (opts.onOpponent) try { opts.onOpponent(list); } catch (e) { /* */ } }
      });
      return onlineMatch;
    }
    function onlineAvailable() { return !!(window.KAMPAI && window.KAMPAI.online && window.KAMPAI.online.available); }

    // ─── build DOM ─────────────────────────────────────────────────────────
    var root = document.createElement('div');
    root.className = 'kv-root';
    root.innerHTML =
      '<div class="kv-card"><button class="kv-close" type="button">✕</button>' +
      // menu
      '<div class="kv-screen kv-menu"><div class="kv-h">🏁 ' + esc(title) + '</div>' +
        '<div class="kv-p">เลือกวิธีแข่ง — ใครคะแนนมากกว่าชนะ 🏆</div>' +
        '<button class="kv-btn kv-btn-primary kv-btn-wide kv-go-local" type="button">👫 2 คนเครื่องนี้</button>' +
        '<button class="kv-btn kv-btn-blue kv-btn-wide kv-go-online" type="button">🌐 ออนไลน์ (ต่างเครื่อง)</button>' +
        '<div class="kv-p kv-menu-msg" style="margin:8px 0 0;min-height:16px"></div></div>' +
      // setup (local — เลือก P2)
      '<div class="kv-screen kv-setup"><div class="kv-h">👫 เลือกคู่แข่ง</div>' +
        '<div class="kv-p" style="margin-bottom:6px">เลือกเพื่อนร่วมห้องเป็นผู้เล่น 2 (เก็บสถิติแชมป์) หรือเล่นเร็วแบบไม่ระบุชื่อ</div>' +
        '<div class="kv-roster"></div>' +
        '<div class="kv-h2h"></div>' +
        '<div class="kv-p2label">ยังไม่เลือกคู่แข่ง</div>' +
        '<button class="kv-btn kv-btn-green kv-btn-wide kv-start2" type="button" style="display:none">🚀 เริ่มแข่ง</button>' +
        '<button class="kv-btn kv-btn-ghost kv-quick" type="button" style="font-size:14px">⚡ เล่นเร็ว (ผู้เล่น 2 · ไม่เก็บสถิติ)</button>' +
        '<button class="kv-btn kv-btn-ghost kv-back" type="button" style="font-size:14px">← กลับ</button></div>' +
      // hand-off (สลับตา)
      '<div class="kv-screen kv-handoff"><div class="kv-ho-title"></div><div class="kv-ho-sub"></div>' +
        '<button class="kv-btn kv-btn-primary kv-btn-wide kv-ho-go" type="button">เริ่มตาของฉัน →</button></div>' +
      // result (เทียบผล)
      '<div class="kv-screen kv-result"><div class="kv-h kv-result-title">จบการแข่ง!</div>' +
        '<div class="kv-vs"><div class="kv-panel kv-panel1"></div><div class="kv-vsmid">VS</div><div class="kv-panel kv-panel2"></div></div>' +
        '<button class="kv-btn kv-btn-primary kv-again" type="button">🔄 เล่นอีกครั้ง</button>' +
        '<button class="kv-btn kv-btn-ghost kv-done" type="button">✓ เสร็จสิ้น</button></div>' +
      '</div>';
    document.body.appendChild(root);

    var hud = document.createElement('div');
    hud.className = 'kv-hud';
    hud.innerHTML = '<span class="kv-hud-turn"></span><span>· ⏱ <span class="kv-hud-clock">0:00</span></span><span>· ⭐ <span class="kv-hud-score">0</span></span>';
    document.body.appendChild(hud);

    var cd = document.createElement('div');
    cd.className = 'kv-cd';
    cd.innerHTML = '<div class="kv-cd-label"></div><div class="kv-cd-num"></div>';
    document.body.appendChild(cd);

    var $ = function (sel) { return root.querySelector(sel); };

    // ─── state ─────────────────────────────────────────────────────────────
    var activeMode = null;     // null | 'local' | 'online'
    var inRound = false;       // อยู่ระหว่างตาเล่นจริง (ใช้ให้ finish() แยกเดี่ยว vs versus)
    var P = { 1: null, 2: null };
    var cur = 0, round = 0, localRoom = null;
    var endsAt = 0, rafId = 0, turnEnded = false, lastScore = 0, lastCorrect = 0;
    var p2Mode = null;         // 'roster' | 'quick'

    function callPlay(info) { if (opts.onPlay) try { opts.onPlay(info); } catch (e) { /* */ } }
    function callEnd() { if (opts.onEnd) try { opts.onEnd(); } catch (e) { /* */ } }

    // ─── wire UI ───────────────────────────────────────────────────────────
    $('.kv-close').onclick = function () { root.style.display = 'none'; };
    $('.kv-go-local').onclick = showSetup;
    $('.kv-go-online').onclick = function () {
      var m = ensureOnline();
      root.style.display = 'none';
      if (m) m.openMenu();
      else { root.style.display = 'flex'; $('.kv-menu-msg').textContent = 'โหมดออนไลน์ไม่พร้อม (ต้องเล่นผ่านระบบ /play)'; }
    };
    $('.kv-quick').onclick = quickP2;
    $('.kv-back').onclick = function () { showScreen('menu'); };
    $('.kv-start2').onclick = startLocal;
    $('.kv-ho-go').onclick = function () { startTurn(2); };
    $('.kv-again').onclick = function () { if (P[2]) { resetMatch(); startTurn(1); } };
    $('.kv-done').onclick = function () { leaveAll(true); };

    function showScreen(name) {
      ['menu', 'setup', 'handoff', 'result'].forEach(function (n) { $('.kv-' + n).classList.toggle('on', n === name); });
      root.style.display = 'flex';
    }

    function openMenu() {
      $('.kv-menu-msg').textContent = '';
      showScreen('menu');
    }

    // ─── local: เลือกคู่แข่ง P2 ─────────────────────────────────────────────
    function mePlayer() {
      var s = (window.KAMPAI && window.KAMPAI.student) || null;
      return s
        ? { id: s.id || null, name: s.displayName || 'ผู้เล่น 1', photoUrl: s.photoUrl || null, code: s.code || null, score: 0, correct: 0, roundsWon: 0 }
        : { id: null, name: 'ผู้เล่น 1', photoUrl: null, code: null, score: 0, correct: 0, roundsWon: 0 };
    }

    function showSetup() {
      P[1] = mePlayer(); P[2] = null; p2Mode = null;
      $('.kv-h2h').textContent = '';
      renderRoster(); renderSelectedP2();
      showScreen('setup');
    }

    function renderRoster() {
      var el = $('.kv-roster'); if (!el) return;
      var meId = P[1] && P[1].id;
      var list = ((window.KAMPAI && window.KAMPAI.classmates) || []).filter(function (c) { return c && c.id && c.id !== meId; });
      if (!list.length) { el.innerHTML = '<div class="kv-empty">— ยังไม่มีรายชื่อเพื่อนร่วมห้อง · กด “เล่นเร็ว” ได้เลย —</div>'; return; }
      el.innerHTML = list.map(function (c) {
        var sel = (P[2] && P[2].id === c.id) ? ' sel' : '';
        return '<div class="kv-opp' + sel + '" data-id="' + esc(c.id) + '">' + avatarHtml({ photoUrl: c.photoUrl, name: c.displayName }) +
          '<div class="kv-oname">' + esc(c.displayName || '') + '</div></div>';
      }).join('');
      Array.prototype.forEach.call(el.querySelectorAll('.kv-opp'), function (node) {
        node.onclick = function () { pickOpp(node.getAttribute('data-id')); };
      });
    }

    function pickOpp(id) {
      var c = ((window.KAMPAI && window.KAMPAI.classmates) || []).filter(function (x) { return x.id === id; })[0];
      if (!c) return;
      P[2] = { id: c.id, name: c.displayName || 'ผู้เล่น 2', photoUrl: c.photoUrl || null, code: c.studentCode || null, score: 0, correct: 0, roundsWon: 0 };
      p2Mode = 'roster';
      parentMsg({ type: 'versusRequest', opponentId: c.id });   // ขอ versusData (head-to-head)
      renderRoster(); renderSelectedP2();
    }

    function quickP2() {
      P[1] = P[1] || mePlayer();
      P[2] = { id: null, name: 'ผู้เล่น 2', photoUrl: null, code: null, score: 0, correct: 0, roundsWon: 0 };
      p2Mode = 'quick';
      $('.kv-h2h').textContent = '';
      renderRoster(); renderSelectedP2();
    }

    function renderSelectedP2() {
      $('.kv-start2').style.display = P[2] ? '' : 'none';
      $('.kv-p2label').textContent = P[2] ? ('🟠 คู่แข่ง: ' + P[2].name + (p2Mode === 'quick' ? ' (ไม่เก็บสถิติ)' : '')) : 'ยังไม่เลือกคู่แข่ง';
    }

    // wrapper ตอบ versusData (head-to-head) → โชว์สถิติเจอกัน
    window.addEventListener('message', function (e) {
      var d = e && e.data; if (!d || d.type !== 'versusData') return;
      var h2h = d.headToHead; if (!h2h || !P[2] || p2Mode !== 'roster') return;
      var el = $('.kv-h2h');
      if (el) el.textContent = '⚔️ เจอกันมา: ชนะ ' + (h2h.wins || 0) + ' · แพ้ ' + (h2h.losses || 0) + ' (' + (h2h.matches || 0) + ' แมตช์)';
    });

    // ─── local: รอบเล่น ────────────────────────────────────────────────────
    function roundSeed(r) { return (((parseInt(localRoom, 10) || 1) + r * 101) >>> 0) || 1; }

    function resetMatch() {
      round = 1; localRoom = makeCode();
      [1, 2].forEach(function (i) { P[i].score = 0; P[i].correct = 0; P[i].roundsWon = 0; });
    }

    function startLocal() {
      if (!P[2]) return;
      activeMode = 'local';
      resetMatch();
      startTurn(1);
    }

    function startTurn(player) {
      cur = player; turnEnded = false; lastScore = 0; lastCorrect = 0;
      // เริ่มรอบใหม่ (ตา P1) → reset คะแนนรอบนี้ของทั้งคู่
      if (player === 1) { P[1].score = 0; P[1].correct = 0; P[2].score = 0; P[2].correct = 0; }
      root.style.display = 'none';
      var tag = player === 1 ? '🔵 ' + P[1].name : '🟠 ' + P[2].name;
      runCountdown('ตาของ ' + tag + (rounds > 1 ? ' · รอบ ' + round + '/' + rounds : ''), function () {
        inRound = true;
        endsAt = Date.now() + duration * 1000;
        showHud(player);
        // sabotage local: ตา P2 รับผล P1 ไปเพิ่มความยาก (async)
        if (sabotageOn && player === 2 && opts.onOpponent) {
          try { opts.onOpponent([{ id: P[1].id, name: P[1].name, score: P[1].score, correct: P[1].correct, done: true, me: false }]); } catch (e) { /* */ }
        }
        callPlay({ rng: mulberry32(roundSeed(round)), seed: roundSeed(round), room: localRoom, player: player === 1 ? 'P1' : 'P2', round: round, mode: 'local' });
        tick();
      });
    }

    function runCountdown(label, done) {
      var lab = cd.querySelector('.kv-cd-label'), num = cd.querySelector('.kv-cd-num');
      lab.textContent = label;
      var endAt = Date.now() + 3200;
      cd.style.display = 'flex';
      (function step() {
        var rem = endAt - Date.now();
        if (rem <= 0) { cd.style.display = 'none'; done(); return; }
        var n = Math.ceil(rem / 1000);
        var t = n <= 0 ? 'GO' : String(n);
        if (num.textContent !== t) { num.textContent = t; num.style.animation = 'none'; void num.offsetWidth; num.style.animation = 'kvcd 1s ease-in-out'; }
        requestAnimationFrame(step);
      })();
    }

    function fmt(sec) { var m = Math.floor(sec / 60), s = sec % 60; return m + ':' + (s < 10 ? '0' : '') + s; }

    function showHud(player) {
      hud.querySelector('.kv-hud-turn').textContent = player === 1 ? '🔵 ' + P[1].name : '🟠 ' + P[2].name;
      hud.querySelector('.kv-hud-score').textContent = '0';
      hud.classList.add('on');
    }
    function hideHud() { hud.classList.remove('on'); }

    function tick() {
      var rem = endsAt - Date.now();
      var sec = Math.max(0, Math.ceil(rem / 1000));
      var clk = hud.querySelector('.kv-hud-clock');
      clk.textContent = fmt(sec); clk.classList.toggle('low', sec <= 10);
      if (rem <= 0) { endTurn(); return; }
      rafId = requestAnimationFrame(tick);
    }

    // ─── facade: report / finish (ส่งต่อให้โหมดที่ active) ──────────────────
    function report(score, info) {
      info = info || {};
      if (activeMode === 'online') { if (onlineMatch) onlineMatch.report(score, info); return; }
      if (activeMode === 'local' && !turnEnded) {
        lastScore = score | 0; lastCorrect = info.correct | 0;
        hud.querySelector('.kv-hud-score').textContent = lastScore;
      }
    }

    // คืน true = versus จัดการต่อแล้ว (เกมไม่ต้อง submitScore/gameover เอง) · false = โหมดเดี่ยว
    function finish(score, info) {
      info = info || {};
      if (!inRound) return false;
      if (activeMode === 'online') { inRound = false; if (onlineMatch) onlineMatch.finish(score, info); return true; }
      if (activeMode === 'local') {
        if (turnEnded) return true;
        if (score != null) lastScore = score | 0;
        if (info.correct != null) lastCorrect = info.correct | 0;
        endTurn();
        return true;
      }
      return false;
    }

    function endTurn() {
      if (turnEnded) return; turnEnded = true; inRound = false;
      cancelAnimationFrame(rafId);
      hideHud();
      callEnd();
      P[cur].score = lastScore; P[cur].correct = lastCorrect;
      if (cur === 1) showHandoff();
      else endRound();
    }

    function showHandoff() {
      $('.kv-ho-title').textContent = '🔵 ' + P[1].name + ' ได้ ' + P[1].score + ' คะแนน';
      $('.kv-ho-sub').textContent = 'ส่งเครื่องให้ 🟠 ' + P[2].name + ' แล้วกดเริ่ม';
      showScreen('handoff');
    }

    function cmp(a, b) {
      var pa = rankBy === 'correct' ? a.correct : a.score, pb = rankBy === 'correct' ? b.correct : b.score;
      if (pa !== pb) return pa > pb ? 1 : 2;
      var sa = rankBy === 'correct' ? a.score : a.correct, sb = rankBy === 'correct' ? b.score : b.correct;
      if (sa !== sb) return sa > sb ? 1 : 2;
      return 0;
    }

    function endRound() {
      var w = cmp(P[1], P[2]);
      if (w === 1) P[1].roundsWon++; else if (w === 2) P[2].roundsWon++;
      var need = Math.floor(rounds / 2) + 1;
      if (round < rounds && P[1].roundsWon < need && P[2].roundsWon < need) { round++; startTurn(1); return; }
      showResult();
    }

    function showResult() {
      activeMode = null; inRound = false;
      var winner = rounds > 1
        ? (P[1].roundsWon > P[2].roundsWon ? 1 : (P[2].roundsWon > P[1].roundsWon ? 2 : 0))
        : cmp(P[1], P[2]);
      $('.kv-result-title').textContent = winner ? ('🏆 ' + P[winner].name + ' ชนะ!') : '🤝 เสมอ!';
      renderPanel('.kv-panel1', P[1], winner === 1, '🔵');
      renderPanel('.kv-panel2', P[2], winner === 2, '🟠');
      // เก็บสถิติเฉพาะโหมด roster + P1 เป็นนักเรียนจริง + P2 มีรหัส
      if (p2Mode === 'roster' && P[1].id && P[2].code) {
        parentMsg({
          type: 'versusEnd', room: localRoom, format: 'bo' + rounds,
          winner: winner === 1 ? P[1].id : (winner === 2 ? P[2].id : null),
          opponentId: P[2].id, opponentCode: P[2].code,
          p1: { score: P[1].score, correct: P[1].correct, roundsWon: P[1].roundsWon },
          p2: { score: P[2].score, correct: P[2].correct, roundsWon: P[2].roundsWon }
        });
      }
      showScreen('result');
    }

    function renderPanel(sel, p, isWin, tag) {
      var el = $(sel); if (!el) return;
      el.classList.toggle('win', !!isWin);
      var crown = isWin ? '👑' : '';
      var sub = rankBy === 'correct'
        ? ('คะแนน ' + p.score + (rounds > 1 ? ' · ชนะ ' + p.roundsWon + ' รอบ' : ''))
        : ('ตอบถูก ' + p.correct + (rounds > 1 ? ' · ชนะ ' + p.roundsWon + ' รอบ' : ''));
      var bigVal = rankBy === 'correct' ? p.correct : p.score;
      el.innerHTML = '<div class="kv-crown">' + crown + '</div>' + avatarHtml(p) +
        '<div class="kv-pname">' + tag + ' ' + esc(p.name) + '</div>' +
        '<div class="kv-pscore">' + bigVal + '</div><div class="kv-psub">' + sub + '</div>';
    }

    function leaveAll(reload) {
      cancelAnimationFrame(rafId);
      hideHud(); cd.style.display = 'none'; root.style.display = 'none';
      activeMode = null; inRound = false; turnEnded = true;
      try { if (onlineMatch) onlineMatch.leave(); } catch (e) { /* */ }
      if (reload) { try { location.reload(); } catch (e) { /* */ } }
    }

    return {
      available: onlineAvailable(),
      openMenu: openMenu,
      report: report,
      finish: finish,
      leave: leaveAll,
      online: ensureOnline,
      // เฟส 4: ส่งต่อ opponents() แบบ interpolated จาก KampaiMatch (online) — โหมด local/cpu คืน [] (ไม่มี onlineMatch)
      opponents: function () { return (onlineMatch && onlineMatch.opponents) ? onlineMatch.opponents() : []; },
      get mode() { return activeMode; }
    };
  }

  window.KampaiVersus = { version: '1.0.0', create: create };
})();
