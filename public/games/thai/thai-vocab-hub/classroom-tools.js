/* classroom-tools.js — เครื่องมือการสอนในห้องเรียน (Classroom Projector Mode, Spinner Wheel, Team Battle) */
(function () {
  'use strict';

  let isProjectorMode = false;
  let spinnerCanvas = null;
  let spinnerCtx = null;
  let spinnerWords = [];
  let spinnerAngle = 0;
  let isSpinning = false;
  let spinVelocity = 0;
  let spinAnimFrame = null;

  // ─── 1. Projector Mode ──────────────────────────────────────────
  function toggleProjectorMode(forced) {
    isProjectorMode = typeof forced === 'boolean' ? forced : !isProjectorMode;
    document.body.classList.toggle('projector-mode', isProjectorMode);

    const btn = document.getElementById('btn-projector-toggle');
    if (btn) {
      btn.classList.toggle('active', isProjectorMode);
      btn.innerHTML = isProjectorMode ? '📺 ออกจากจอใหญ่' : '📽️ ฉายจอห้องเรียน';
    }

    let floatingBar = document.getElementById('projector-floating-bar');
    if (isProjectorMode) {
      if (!floatingBar) {
        floatingBar = document.createElement('div');
        floatingBar.id = 'projector-floating-bar';
        floatingBar.className = 'projector-floating-bar';
        floatingBar.innerHTML = `
          <button type="button" class="pj-btn" onclick="if(window.autoplayPrev)window.autoplayPrev()" title="คำก่อนหน้า (←)">◀ ก่อนหน้า</button>
          <button type="button" class="pj-btn pj-btn-main" onclick="if(window.flipCard)window.flipCard()" title="พลิกการ์ด (Spacebar)">🔄 พลิกดูความหมาย</button>
          <button type="button" class="pj-btn pj-btn-speak" onclick="window.ThaiVocabClassroom.speakCurrentWord()" title="อ่านออกเสียง (S)">🔊 ฟังเสียง</button>
          <button type="button" class="pj-btn" onclick="if(window.autoplayNext)window.autoplayNext()" title="คำถัดไป (→)">ถัดไป ▶</button>
          <button type="button" class="pj-btn pj-btn-exit" onclick="window.ThaiVocabClassroom.toggleProjectorMode(false)" title="ออกจากจอใหญ่ (Esc)">✖ ออก</button>
        `;
        document.body.appendChild(floatingBar);
      }
      floatingBar.style.display = 'flex';
    } else if (floatingBar) {
      floatingBar.style.display = 'none';
    }
  }

  function speakCurrentWord() {
    const wordEl = document.getElementById('wfront-word') || document.querySelector('.visual-study-word');
    if (wordEl && wordEl.textContent && typeof window.speakThai === 'function') {
      window.speakThai(wordEl.textContent.trim());
    }
  }

  // ─── 2. Classroom Spinner Wheel ─────────────────────────────────
  function openSpinnerModal(category, words) {
    let modal = document.getElementById('tvh-spinner-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'tvh-spinner-modal';
      modal.className = 'tvh-modal-backdrop';
      modal.innerHTML = `
        <div class="tvh-modal-card spinner-card-layout" role="dialog" aria-modal="true" aria-labelledby="tvh-spinner-title">
          <div class="tvh-modal-header">
            <h2 id="tvh-spinner-title">🎡 วงล้อสุ่มคำศัพท์หน้าชั้นเรียน</h2>
            <button type="button" class="tvh-modal-close" onclick="window.ThaiVocabClassroom.closeSpinner()">×</button>
          </div>
          <div class="spinner-center-box">
            <div class="spinner-canvas-wrap">
              <div class="spinner-pointer">▼</div>
              <canvas id="spinner-canvas" width="440" height="440"></canvas>
            </div>
            <div id="spinner-result" class="spinner-result-box" style="display:none">
              <div class="sr-emoji" id="sr-emoji">🎉</div>
              <div class="sr-word" id="sr-word">คำศัพท์</div>
              <div class="sr-reading" id="sr-reading">[ คำอ่าน ]</div>
              <div class="sr-meaning" id="sr-meaning">ความหมาย...</div>
              <div class="sr-example" id="sr-example"></div>
              <button type="button" class="btn btn-primary" onclick="window.ThaiVocabClassroom.speakSpinnerResult()">🔊 ฟังเสียงอ่าน</button>
            </div>
          </div>
          <div class="tvh-modal-footer">
            <button type="button" class="cbtn" onclick="window.ThaiVocabClassroom.closeSpinner()">ปิด</button>
            <button type="button" class="cbtn" id="btn-reroll-wheel" onclick="window.ThaiVocabClassroom.rerollWheel()">🎲 สุ่มคำใหม่บนวงล้อ</button>
            <button type="button" id="btn-spin-wheel" class="btn btn-primary" onclick="window.ThaiVocabClassroom.spinWheel()">🎯 กดหมุนวงล้อ (Spacebar)</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    spinnerPoolWords = (words || []).filter(w => w && w.content_status !== 'quarantined');
    const shuffled = [...spinnerPoolWords].sort(() => 0.5 - Math.random());
    spinnerWords = shuffled.slice(0, Math.min(10, shuffled.length));

    modal.style.display = 'flex';
    document.getElementById('spinner-result').style.display = 'none';
    initSpinnerCanvas();
  }

  let spinnerPoolWords = [];

  function rerollWheel() {
    if (isSpinning || !spinnerPoolWords.length) return;
    const shuffled = [...spinnerPoolWords].sort(() => 0.5 - Math.random());
    spinnerWords = shuffled.slice(0, Math.min(10, shuffled.length));
    const resBox = document.getElementById('spinner-result');
    if (resBox) resBox.style.display = 'none';
    initSpinnerCanvas();
  }

  function initSpinnerCanvas() {
    spinnerCanvas = document.getElementById('spinner-canvas');
    if (!spinnerCanvas) return;
    spinnerCtx = spinnerCanvas.getContext('2d');
    spinnerAngle = 0;
    drawWheel();
  }

  function drawWheel() {
    if (!spinnerCtx || !spinnerWords.length) return;
    const ctx = spinnerCtx;
    const count = spinnerWords.length;
    const arc = (2 * Math.PI) / count;
    const cx = spinnerCanvas.width / 2;
    const cy = spinnerCanvas.height / 2;
    const radius = cx - 12;

    ctx.clearRect(0, 0, spinnerCanvas.width, spinnerCanvas.height);

    const colors = ['#f59e0b', '#3b82f6', '#10b981', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#6366f1', '#14b8a6', '#e11d48'];

    for (let i = 0; i < count; i++) {
      const angle = spinnerAngle + i * arc;
      ctx.beginPath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, angle, angle + arc);
      ctx.lineTo(cx, cy);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle + arc / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 19px Sarabun, sans-serif';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 4;
      const text = spinnerWords[i].word;
      ctx.fillText(text.length > 8 ? text.slice(0, 7) + '…' : text, radius - 20, 7);
      ctx.restore();
    }

    // Center pin
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, 2 * Math.PI);
    ctx.fillStyle = '#1e293b';
    ctx.fill();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 16px Sarabun, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎯', cx, cy + 6);
  }

  function spinWheel() {
    if (isSpinning || !spinnerWords.length) return;
    isSpinning = true;
    document.getElementById('spinner-result').style.display = 'none';
    const btn = document.getElementById('btn-spin-wheel');
    if (btn) btn.disabled = true;

    // Random speed and rotations (at least 4 full turns)
    spinVelocity = 0.25 + Math.random() * 0.25;
    const friction = 0.988;

    function animate() {
      spinnerAngle += spinVelocity;
      spinVelocity *= friction;
      drawWheel();

      if (spinVelocity > 0.002) {
        spinAnimFrame = requestAnimationFrame(animate);
      } else {
        cancelAnimationFrame(spinAnimFrame);
        isSpinning = false;
        if (btn) btn.disabled = false;
        resolveSpinResult();
      }
    }
    animate();
  }

  function resolveSpinResult() {
    const count = spinnerWords.length;
    const arc = (2 * Math.PI) / count;
    // Pointer is at the top (3*PI / 2 or 1.5*PI)
    const normalizedAngle = (3 * Math.PI / 2 - (spinnerAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    const winIndex = Math.floor(normalizedAngle / arc) % count;
    const winWord = spinnerWords[winIndex];

    const resultBox = document.getElementById('spinner-result');
    if (!resultBox || !winWord) return;

    document.getElementById('sr-emoji').textContent = winWord.emoji || '🎉';
    document.getElementById('sr-word').textContent = winWord.word;
    document.getElementById('sr-reading').textContent = `[ ${winWord.reading} ]`;
    document.getElementById('sr-meaning').textContent = winWord.meaning;
    const exEl = document.getElementById('sr-example');
    if (exEl) {
      exEl.textContent = winWord.example ? `ตัวอย่าง: “${winWord.example}”` : '';
      exEl.style.display = winWord.example ? 'block' : 'none';
    }
    resultBox.style.display = 'block';

    if (typeof window.speakThai === 'function') {
      window.speakThai(winWord.word);
    }
  }

  function speakSpinnerResult() {
    const word = document.getElementById('sr-word')?.textContent;
    if (word && typeof window.speakThai === 'function') {
      window.speakThai(word.trim());
    }
  }

  function closeSpinner() {
    if (spinAnimFrame) cancelAnimationFrame(spinAnimFrame);
    isSpinning = false;
    const modal = document.getElementById('tvh-spinner-modal');
    if (modal) modal.style.display = 'none';
  }

  // ─── 3. Classroom Team Battle (Buzzer Hot-Seat) ─────────────────
  let battleWords = [];
  let battleQuestionIndex = 0;
  let redScore = 0;
  let blueScore = 0;
  let activeBuzzerTeam = null; // 'red' | 'blue' | null
  let battleLocked = false;
  const WIN_SCORE = 50;

  function openTeamBattleModal(category, words) {
    let modal = document.getElementById('tvh-battle-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'tvh-battle-modal';
      modal.className = 'tvh-modal-backdrop';
      modal.innerHTML = `
        <div class="tvh-modal-card battle-card-layout" role="dialog" aria-modal="true" aria-labelledby="tvh-battle-title">
          <div class="tvh-modal-header">
            <h2 id="tvh-battle-title">⚔️ การแข่งขันตอบคำศัพท์ ๒ ทีมหน้าชั้นเรียน</h2>
            <button type="button" class="tvh-modal-close" onclick="window.ThaiVocabClassroom.closeTeamBattle()">×</button>
          </div>
          
          <div class="battle-scoreboard">
            <button type="button" class="team-panel team-red team-buzzer-btn" id="buzzer-red-btn" onclick="window.ThaiVocabClassroom.buzzTeam('red')">
              <div class="team-badge">🔴 ทีมเสือไฟ (กด A / แตะ)</div>
              <div class="team-score" id="battle-red-score">0</div>
            </button>
            <div class="battle-vs">VS</div>
            <button type="button" class="team-panel team-blue team-buzzer-btn" id="buzzer-blue-btn" onclick="window.ThaiVocabClassroom.buzzTeam('blue')">
              <div class="team-badge">🔵 ทีมมังกรฟ้า (กด L / แตะ)</div>
              <div class="team-score" id="battle-blue-score">0</div>
            </button>
          </div>

          <div class="battle-buzzer-status" id="battle-buzzer-status">
            ⚡ กดปุ่มทีม (A / L) เพื่อแย่งสิทธิ์ตอบ หรือคลิกคำตอบด้านล่าง!
          </div>

          <div class="battle-question-area" id="battle-qa">
            <div class="battle-q-badge" id="battle-q-num">ข้อที่ 1 (เป้าหมาย ๕๐ แต้ม)</div>
            <div class="battle-q-prompt" id="battle-q-text">ความหมายของคำศัพท์...</div>
            <div class="battle-options-grid" id="battle-choices"></div>
          </div>

          <div class="battle-winner-card" id="battle-winner-card" style="display:none">
            <h3 id="battle-winner-title" style="font-size:26px; font-weight:800; color:#fbbf24; margin-bottom:8px;">🏆 ผู้ชนะ</h3>
            <p id="battle-winner-summary" style="font-size:17px; margin-bottom:16px;"></p>
            <button type="button" class="btn btn-primary" onclick="window.ThaiVocabClassroom.resetTeamBattle()">🔄 แข่งขันรอบใหม่</button>
          </div>

          <div class="tvh-modal-footer">
            <button type="button" class="cbtn" onclick="window.ThaiVocabClassroom.closeTeamBattle()">จบการแข่งขัน</button>
            <button type="button" class="cbtn" onclick="window.ThaiVocabClassroom.resetTeamBattle()">↺ เริ่มเกมใหม่</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const approved = (words || []).filter(w => w && w.content_status !== 'quarantined' && w.meaning);
    battleWords = [...approved].sort(() => 0.5 - Math.random());
    redScore = 0;
    blueScore = 0;
    battleQuestionIndex = 0;
    activeBuzzerTeam = null;
    battleLocked = false;

    modal.style.display = 'flex';
    updateBattleScore();
    loadBattleQuestion();
  }

  function updateBattleScore() {
    const redEl = document.getElementById('battle-red-score');
    const blueEl = document.getElementById('battle-blue-score');
    if (redEl) redEl.textContent = redScore;
    if (blueEl) blueEl.textContent = blueScore;
  }

  function buzzTeam(team) {
    if (battleLocked) return;
    if (team !== 'red' && team !== 'blue') return;
    activeBuzzerTeam = team;
    const redBtn = document.getElementById('buzzer-red-btn');
    const blueBtn = document.getElementById('buzzer-blue-btn');
    const statusEl = document.getElementById('battle-buzzer-status');
    if (redBtn) redBtn.classList.toggle('is-buzzed', team === 'red');
    if (blueBtn) blueBtn.classList.toggle('is-buzzed', team === 'blue');
    if (statusEl) {
      statusEl.textContent = team === 'red'
        ? '🔴 ทีมเสือไฟได้สิทธิ์ตอบ! เลือกคำตอบด้านล่าง (+10 แต้ม)'
        : '🔵 ทีมมังกรฟ้าได้สิทธิ์ตอบ! เลือกคำตอบด้านล่าง (+10 แต้ม)';
      statusEl.className = 'battle-buzzer-status is-' + team;
    }
  }

  function loadBattleQuestion() {
    const qa = document.getElementById('battle-qa');
    const winCard = document.getElementById('battle-winner-card');
    if (battleQuestionIndex >= battleWords.length || redScore >= WIN_SCORE || blueScore >= WIN_SCORE) {
      finishBattle();
      return;
    }
    if (qa) qa.style.display = 'flex';
    if (winCard) winCard.style.display = 'none';

    activeBuzzerTeam = null;
    battleLocked = false;
    const redBtn = document.getElementById('buzzer-red-btn');
    const blueBtn = document.getElementById('buzzer-blue-btn');
    const statusEl = document.getElementById('battle-buzzer-status');
    if (redBtn) redBtn.classList.remove('is-buzzed');
    if (blueBtn) blueBtn.classList.remove('is-buzzed');
    if (statusEl) {
      statusEl.className = 'battle-buzzer-status';
      statusEl.textContent = '⚡ กดปุ่มทีม (A / L) เพื่อแย่งสิทธิ์ตอบ หรือคลิกคำตอบด้านล่าง!';
    }

    const current = battleWords[battleQuestionIndex];
    document.getElementById('battle-q-num').textContent = `ข้อที่ ${battleQuestionIndex + 1} (เป้าหมาย ๕๐ แต้ม)`;
    document.getElementById('battle-q-text').textContent = current.meaning;

    const decoys = [...battleWords.filter(w => w.word !== current.word)]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    const choices = [current, ...decoys].sort(() => 0.5 - Math.random());

    const grid = document.getElementById('battle-choices');
    grid.innerHTML = '';
    choices.forEach(ch => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'battle-choice-btn';
      btn.innerHTML = `<strong>${ch.word}</strong> <span class="bc-reading">[ ${ch.reading} ]</span>`;
      btn.onclick = () => answerBattle(ch.word === current.word, btn, current);
      grid.appendChild(btn);
    });
  }

  function speakBattleWord() {
    const current = battleWords[battleQuestionIndex];
    if (current && typeof window.speakThai === 'function') {
      window.speakThai(current.word);
    }
  }

  function answerBattle(isCorrect, btn, currentItem) {
    if (battleLocked) return;
    const statusEl = document.getElementById('battle-buzzer-status');
    if (isCorrect) {
      battleLocked = true;
      btn.classList.add('correct');
      if (currentItem && typeof window.speakThai === 'function') {
        window.speakThai(currentItem.word);
      }
      const winnerTeam = activeBuzzerTeam || 'red';
      if (winnerTeam === 'red') redScore += 10;
      else blueScore += 10;
      updateBattleScore();
      if (statusEl) {
        statusEl.textContent = winnerTeam === 'red'
          ? '🎉 ทีมเสือไฟตอบถูก! +10 แต้ม'
          : '🎉 ทีมมังกรฟ้าตอบถูก! +10 แต้ม';
      }
      if (typeof window.triggerConfetti === 'function') window.triggerConfetti();
      setTimeout(() => {
        battleQuestionIndex++;
        loadBattleQuestion();
      }, 1100);
    } else {
      btn.classList.add('wrong');
      btn.disabled = true;
      if (activeBuzzerTeam) {
        const other = activeBuzzerTeam === 'red' ? 'blue' : 'red';
        buzzTeam(other);
        if (statusEl) {
          statusEl.textContent = other === 'blue'
            ? '❌ ทีมแดงตอบผิด! โยนสิทธิ์ให้ 🔵 ทีมมังกรฟ้าตอบแทน'
            : '❌ ทีมน้ำเงินตอบผิด! โยนสิทธิ์ให้ 🔴 ทีมเสือไฟตอบแทน';
        }
      }
    }
  }

  function finishBattle() {
    const qa = document.getElementById('battle-qa');
    const winCard = document.getElementById('battle-winner-card');
    const titleEl = document.getElementById('battle-winner-title');
    const sumEl = document.getElementById('battle-winner-summary');
    if (qa) qa.style.display = 'none';
    if (winCard) winCard.style.display = 'block';
    const winner = redScore > blueScore ? '🔴 ทีมเสือไฟ ชนะเลิศ!' : (blueScore > redScore ? '🔵 ทีมมังกรฟ้า ชนะเลิศ!' : '🤝 เสมอกันอย่างสมศักดิ์ศรี!');
    if (titleEl) titleEl.textContent = `🏆 ${winner}`;
    if (sumEl) sumEl.textContent = `คะแนนสุดท้าย: ทีมแดง ${redScore} - ทีมน้ำเงิน ${blueScore}`;
    if (typeof window.triggerConfetti === 'function') window.triggerConfetti();
  }

  function resetTeamBattle() {
    battleWords = [...battleWords].sort(() => 0.5 - Math.random());
    redScore = 0;
    blueScore = 0;
    battleQuestionIndex = 0;
    activeBuzzerTeam = null;
    battleLocked = false;
    updateBattleScore();
    loadBattleQuestion();
  }

  function closeTeamBattle() {
    const modal = document.getElementById('tvh-battle-modal');
    if (modal) modal.style.display = 'none';
  }

  // ─── 4. Global Keyboard Shortcuts Listener ──────────────────────
  window.addEventListener('keydown', function (e) {
    // Only capture when not typing in input
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

    const battleModal = document.getElementById('tvh-battle-modal');
    if (battleModal && battleModal.style.display === 'flex') {
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        buzzTeam('red');
        return;
      }
      if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        buzzTeam('blue');
        return;
      }
    }

    if (e.key === 'p' || e.key === 'P') {
      // Toggle projector
      toggleProjectorMode();
    } else if (e.key === 'f' || e.key === 'F') {
      // Toggle fullscreen
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      } else {
        document.exitFullscreen().catch(() => {});
      }
    } else if (e.key === 's' || e.key === 'S') {
      // Speak current word
      speakCurrentWord();
    } else if (e.key === ' ' && isProjectorMode) {
      // Space flips card in projector mode
      e.preventDefault();
      if (typeof window.flipCard === 'function') window.flipCard();
    } else if (e.key === 'ArrowRight' && isProjectorMode) {
      e.preventDefault();
      if (typeof window.autoplayNext === 'function') window.autoplayNext();
    } else if (e.key === 'ArrowLeft' && isProjectorMode) {
      e.preventDefault();
      if (typeof window.autoplayPrev === 'function') window.autoplayPrev();
    } else if (e.key === 'Escape') {
      if (isProjectorMode) toggleProjectorMode(false);
      closeSpinner();
      closeTeamBattle();
    }
  });

  window.ThaiVocabClassroom = {
    toggleProjectorMode,
    openSpinnerModal,
    rerollWheel,
    spinWheel,
    speakSpinnerResult,
    closeSpinner,
    openTeamBattleModal,
    buzzTeam,
    speakBattleWord,
    resetTeamBattle,
    closeTeamBattle,
    speakCurrentWord,
  };
})();
