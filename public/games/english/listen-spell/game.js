/* game.js — ลอจิกเกม "ฟังแล้วสะกด" (listen-spell)
   อ่านพารามิเตอร์จาก window.GAME_CONFIG (config.js) + เนื้อหาจาก window.GAME_DATA (data.js)
   3 โหมด: ⏱️ แข่งเวลา · 🧠 ฝึก · 🌐 ออนไลน์ (kampai-match) */

/* ═══ ตั้งค่า KAMPAI จาก config ═══ */
const CFG = window.GAME_CONFIG;
const CATEGORIES = window.GAME_DATA.CATEGORIES;
const ALPHA = window.GAME_DATA.ALPHA;
KAMPAI.setSlug(CFG.SLUG);
KAMPAI.sound.defaultBgm(CFG.BGM);

/* ═══ ข้อมูลนักเรียน + leaderboard (จาก KAMPAI) ═══ */
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
KAMPAI.sound.mountToggles();

/* ═══ โหมดออนไลน์ (kampai-match) ═══ */
let onlineRng = null;   // ถ้า != null → กำลังเล่นออนไลน์: ใช้ rng เลือกคำให้ตรงทุกเครื่อง
let match = null;
if (CFG.ENABLE_ONLINE && window.KampaiMatch) {
    match = KampaiVersus.create({ rankBy: 'correct',
        duration: CFG.ONLINE_DURATION,
        title: 'แข่งสะกดคำ',
        onPlay: function ({ rng }) { onlineRng = rng; startGame('online'); },
        onEnd:  function () { isOver = true; if (timerId) { clearInterval(timerId); timerId = null; } },
    });
    document.getElementById('online-btn').style.display = '';
}
function openOnline() { if (match) match.openMenu(); }

/* ═══ GAME LOGIC ═══ */
let selectedCat = 'all', wordPool = [];
function allWords(){ return CATEGORIES.reduce((a,c)=>a.concat(c.words), []); }
function currentWords(){
  if (selectedCat === 'all') return allWords();
  const c = CATEGORIES.find(x=>x.id===selectedCat);
  return c ? c.words : allWords();
}
function renderCats(){
  const items = [{id:'all', label:'ทั้งหมด', emoji:'🌈', count:allWords().length}]
    .concat(CATEGORIES.map(c=>({id:c.id, label:c.label, emoji:c.emoji, count:c.words.length})));
  document.getElementById('cat-row').innerHTML = items.map(c=>
    `<button class="cat-chip ${c.id===selectedCat?'sel':''}" data-cat="${c.id}" onclick="selectCat('${c.id}')">${c.emoji} ${c.label} <span class="cc-count">${c.count}</span></button>`
  ).join('');
}
function selectCat(id){ selectedCat = id; renderCats(); }

let mode = 'race', score = 0, lives = 3, combo = 0, solved = 0, isOver = false;
let cur = null, slots = [], tiles = [], wordStartTs = 0, recent = [];
let timeLeft = CFG.RACE_SECONDS, timerId = null;

function shuffle(a){ a = a.slice(); for(let i=a.length-1;i>0;i--){ const j=(Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]]; } return a; }

function setScore(n){ score = Math.max(0,n); const v=document.getElementById('score-value'); v.innerText=score; const w=document.getElementById('score-container'); w.classList.add('pop'); setTimeout(()=>w.classList.remove('pop'),150); }
function setLives(n){ lives=Math.max(0,n); let s=''; for(let i=0;i<CFG.LIVES;i++) s+=(i<lives)?'❤️':'🖤'; document.getElementById('life-container').innerText=s; if(lives<=0) endGame(); }

function sayWord(){ if(!cur) return; try{ window.speechSynthesis && window.speechSynthesis.cancel(); }catch(e){} KAMPAI.sound.speakBilingual(cur.w, cur.t || cur.w, { force:'en', interrupt:true }); }

function pickWord(){
  // เลือกคำที่ไม่เพิ่งออก (cap ปรับตามขนาดหมวด — กันคำซ้ำในหมวดเล็ก)
  // โหมดออนไลน์: ใช้ onlineRng (seed = รหัสห้อง) → ลำดับคำตรงกันทุกเครื่อง
  const rnd = onlineRng || Math.random;
  let pool = wordPool.filter(x => !recent.includes(x.w));
  if (!pool.length) { recent = []; pool = wordPool; }
  cur = pool[(rnd()*pool.length)|0];
  const cap = Math.min(8, Math.floor(wordPool.length/2));
  recent.push(cur.w); while (recent.length > cap) recent.shift();

  const letters = cur.w.split('');
  // distractor: คำยาวเพิ่มตัวหลอก (ค่าจาก config)
  let extra = letters.length >= 7 ? CFG.DISTRACTOR.len7 : letters.length >= 5 ? CFG.DISTRACTOR.len5 : 0;
  const tray = letters.slice();
  while (extra-- > 0) { let c; do { c = ALPHA[(Math.random()*26)|0]; } while (letters.includes(c) && Math.random()<0.5); tray.push(c); }
  tiles = shuffle(tray).map((ch,i)=>({ ch, used:false, id:i }));
  slots = letters.map(()=>null); // null = ว่าง, มิฉะนั้นเก็บ tile id

  document.getElementById('hint-emoji').innerText = cur.e;
  document.getElementById('hint-th').innerText = '('+cur.t+')';
  renderCombo();
  renderSlots(); renderTiles();
  wordStartTs = performance.now();
  sayWord();
}

function renderCombo(){ const b=document.getElementById('combo-badge'); b.innerText = combo>=CFG.COMBO_MIN ? ('🔥 คอมโบ x'+combo) : ''; }

function renderSlots(){
  const el = document.getElementById('slots');
  el.innerHTML = slots.map((tid,i)=>{
    const ch = tid===null ? '' : tiles.find(t=>t.id===tid).ch;
    return `<div class="slot ${tid!==null?'filled':''}" data-i="${i}" onclick="removeFromSlot(${i})">${ch}</div>`;
  }).join('');
}
function renderTiles(){
  const el = document.getElementById('tiles');
  el.innerHTML = tiles.map(t=>`<button class="tile ${t.used?'used':''}" data-id="${t.id}" onclick="placeTile(${t.id})">${t.ch}</button>`).join('');
}

function placeTile(id){
  if (isOver) return;
  const t = tiles.find(x=>x.id===id); if(!t || t.used) return;
  const slot = slots.indexOf(null); if (slot===-1) return;
  slots[slot] = id; t.used = true;
  renderSlots(); renderTiles();
  if (slots.every(s=>s!==null)) checkAnswer();
}
function removeFromSlot(i){
  if (isOver) return;
  const id = slots[i]; if (id===null) return;
  const t = tiles.find(x=>x.id===id); if(t) t.used=false;
  slots[i] = null;
  renderSlots(); renderTiles();
}

function checkAnswer(){
  const guess = slots.map(id=>tiles.find(t=>t.id===id).ch).join('');
  const slotEls = document.querySelectorAll('#slots .slot');
  if (guess === cur.w){
    slotEls.forEach(s=>s.classList.add('correct'));
    KAMPAI.sound.correct(); KAMPAI.sound.fxFlash(true);
    // Reinforcement reveal: สะกดถูกแล้ว → อ่านตาม voiceMode (EN / ไทย / EN+ไทย)
    KAMPAI.sound.speakBilingual(cur.w, cur.t || cur.w, { interrupt:false });
    const secs = (performance.now()-wordStartTs)/1000;
    const speedBonus = Math.max(0, Math.round(CFG.SPEED_BONUS_MAX - secs));
    combo++;
    const gain = CFG.BASE_SCORE + speedBonus + (combo>=CFG.COMBO_MIN ? combo*2 : 0);
    setScore(score + gain); solved++;
    if (mode === 'online' && match) match.report(score, { correct: solved });
    setTimeout(nextWord, 650);
  } else {
    slotEls.forEach(s=>s.classList.add('wrong'));
    KAMPAI.sound.wrong(); KAMPAI.sound.fxFlash(false);
    combo = 0; renderCombo();
    if (mode === 'practice'){
      setTimeout(()=>{ setLives(lives-1); if(lives>0) nextWord(); }, 700);
    } else {
      // race/online: เฉลยแล้วไปต่อ ไม่เสียชีวิต
      setTimeout(nextWord, 800);
    }
  }
}

function nextWord(){ if(isOver) return; pickWord(); }

function tickTimer(){
  timeLeft--;
  const tv = document.getElementById('timer-value'); tv.innerText = timeLeft;
  document.getElementById('timer-container').classList.toggle('low', timeLeft<=10);
  if (timeLeft<=0){ endGame(); }
}

function startGame(m){
  mode = m;
  onlineRng = (m === 'online') ? onlineRng : null;
  KAMPAI.sound.unlock();
  document.getElementById('blocker').style.display='none';
  document.getElementById('play').style.display='flex';
  document.getElementById('player-chip').style.display = KAMPAI.student ? 'flex' : 'none';
  score=0; combo=0; solved=0; lives=CFG.LIVES; isOver=false; recent=[];
  wordPool = (m === 'online') ? allWords() : currentWords();  // ออนไลน์: pool เดียวกันทุกเครื่อง
  setScore(0);
  if (m==='race'){
    timeLeft=CFG.RACE_SECONDS; document.getElementById('timer-value').innerText=CFG.RACE_SECONDS;
    document.getElementById('timer-container').style.display='block';
    document.getElementById('life-container').style.display='none';
    document.getElementById('stop-btn').style.display='block';
    timerId = setInterval(tickTimer, 1000);
  } else if (m==='practice'){
    document.getElementById('timer-container').style.display='none';
    document.getElementById('life-container').style.display='block';
    document.getElementById('stop-btn').style.display='block';
    setLives(CFG.LIVES);
  } else {
    // online: เฟรมเวิร์กคุมนาฬิกา+จบเอง → ซ่อน timer/life/stop ในเกม
    document.getElementById('timer-container').style.display='none';
    document.getElementById('life-container').style.display='none';
    document.getElementById('stop-btn').style.display='none';
  }
  KAMPAI.sound.bgmStart();
  pickWord();
}

function endGame(){
  if (isOver) return;
  isOver = true;
  if (timerId){ clearInterval(timerId); timerId=null; }
  try{ window.speechSynthesis && window.speechSynthesis.cancel(); }catch(e){}
  KAMPAI.sound.gameOver(); KAMPAI.sound.bgmStop();
  KAMPAI.submitScore(score, { mode: mode==='race'?'normal':'tutorial', words: solved });
  document.getElementById('play').style.display='none';
  document.getElementById('stop-btn').style.display='none';
  document.getElementById('timer-container').style.display='none';
  document.getElementById('life-container').style.display='none';
  document.getElementById('final-score').innerText = score;
  const catObj = CATEGORIES.find(c=>c.id===selectedCat);
  const catLabel = catObj ? catObj.emoji+' '+catObj.label : '🌈 ทั้งหมด';
  document.getElementById('go-summary').innerText = 'สะกดถูก '+solved+' คำ · '+catLabel+' · โหมด '+(mode==='race'?'แข่งเวลา':'ฝึก');
  document.getElementById('gameover-screen').style.display='flex';
  renderLeaderboard('score-list-gameover');
}

renderCats();
