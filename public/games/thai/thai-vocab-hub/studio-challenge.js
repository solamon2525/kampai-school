/* studio-challenge.js — ระบบแบบฝึกหัดท้ายบท 10 ข้อสำหรับห้องเรียนพิเศษทั้ง 4 ห้อง */
(function (global) {
  'use strict';

  const MAE_LABELS = {
    kod: 'แม่กด (เสียง ด สะกด)',
    kon: 'แม่กน (เสียง น สะกด)',
    kob: 'แม่กบ (เสียง บ สะกด)',
    kok: 'แม่กก (เสียง ก สะกด)',
  };

  function shuffle(arr) {
    const out = arr.slice();
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = out[i];
      out[i] = out[j];
      out[j] = tmp;
    }
    return out;
  }

  function sanitize(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function buildVowelMorphQuestions(presets, count) {
    const list = Array.isArray(presets) ? presets : [];
    const targetCount = Math.max(1, Number(count) || 10);
    const allExamples = [];
    const allRuleNames = list.map(p => p && p.vowelName).filter(Boolean);

    list.forEach((p) => {
      if (!p || !Array.isArray(p.examples)) return;
      p.examples.forEach((ex) => {
        if (ex && ex.word) {
          allExamples.push({ preset: p, ex });
        }
      });
    });

    if (!allExamples.length) return [];
    const picked = shuffle(allExamples).slice(0, Math.min(targetCount, allExamples.length));
    const allWords = allExamples.map(x => x.ex.word);

    return picked.map((entry, idx) => {
      const { preset, ex } = entry;
      const useRuleQuestion = idx % 2 === 1 && allRuleNames.length >= 4;

      if (useRuleQuestion) {
        const decoys = shuffle(allRuleNames.filter(n => n !== preset.vowelName)).slice(0, 3);
        return {
          kind: 'rule',
          badge: preset.ruleType || 'กฎสระแปลงร่าง',
          prompt: `คำว่า "${ex.word}" ใช้กฎสระข้อใด?`,
          speakText: ex.word,
          answer: preset.vowelName,
          options: shuffle([preset.vowelName, ...decoys]),
          explain: `${ex.equation || ex.word} — ${preset.ruleDesc || ''}`,
        };
      }

      // Combine question: init + vowel + final -> ex.word
      const decoys = [];
      const fallbackPool = shuffle(allWords.filter(w => w !== ex.word));
      for (let i = 0; i < fallbackPool.length && decoys.length < 3; i++) {
        if (!decoys.includes(fallbackPool[i])) decoys.push(fallbackPool[i]);
      }
      const synthetic = [
        `${ex.init || 'ก'}${ex.final || 'ด'}`,
        `${ex.init || 'ก'}า${ex.final || 'ด'}`,
        `${ex.init || 'ก'}ิ${ex.final || 'ด'}`,
      ];
      for (let i = 0; i < synthetic.length && decoys.length < 3; i++) {
        if (synthetic[i] !== ex.word && !decoys.includes(synthetic[i])) decoys.push(synthetic[i]);
      }

      return {
        kind: 'combine',
        badge: preset.ruleType || 'ประสมสระแปลงร่าง',
        prompt: `ประสมคำ: ${ex.init || ''} + ${ex.vowel || ''} + ${ex.final || ''} = ?`,
        speakText: ex.word,
        answer: ex.word,
        options: shuffle([ex.word, ...decoys.slice(0, 3)]),
        explain: `${ex.equation || ex.word} (${preset.vowelName})`,
      };
    });
  }

  function buildDecoderQuestions(words, count) {
    const list = (Array.isArray(words) ? words : [])
      .filter(w => w && w.word && w.targetSection && MAE_LABELS[w.targetSection]);
    const targetCount = Math.max(1, Number(count) || 10);
    const picked = shuffle(list).slice(0, Math.min(targetCount, list.length));
    const allMaeOptions = Object.values(MAE_LABELS);

    return picked.map((item) => {
      const answer = MAE_LABELS[item.targetSection];
      const maskInfo = item.surfaceConsonant && item.soundConsonant
        ? `หน้ากาก "${item.surfaceConsonant}" ออกเสียง "${item.soundConsonant}"`
        : '';
      return {
        kind: 'decoder',
        badge: 'ถอดหน้ากากตัวสะกด',
        prompt: `คำว่า "${item.word}" มีตัวสะกดออกเสียงตรงกับแม่ใด?`,
        speakText: item.word,
        answer,
        options: shuffle(allMaeOptions),
        explain: `อ่านว่า [${item.reading || item.word}] · ${maskInfo}${item.meaning ? ' — ' + item.meaning : ''}`,
      };
    });
  }

  function buildReadingQuestions(words, count) {
    const list = (Array.isArray(words) ? words : [])
      .filter(w => w && w.word && w.reading && w.content_status !== 'quarantined');
    const targetCount = Math.max(1, Number(count) || 10);
    const picked = shuffle(list).slice(0, Math.min(targetCount, list.length));
    const allReadings = list.map(w => String(w.reading).trim());

    return picked.map((item) => {
      const answer = String(item.reading).trim();
      const decoys = [];
      const candidates = shuffle(allReadings.filter(r => r && r !== answer));
      for (let i = 0; i < candidates.length && decoys.length < 3; i++) {
        if (!decoys.includes(candidates[i])) decoys.push(candidates[i]);
      }
      return {
        kind: 'reading',
        badge: 'ฝึกอ่านคำยาก-ราชาศัพท์',
        prompt: `คำว่า "${item.word}" อ่านออกเสียงอย่างไร?`,
        speakText: item.tts_reading || item.word,
        answer,
        options: shuffle([answer, ...decoys]),
        explain: `${item.word} [${answer}]${item.meaning ? ' — ' + item.meaning : ''}`,
      };
    });
  }

  function createChallengeRunner(containerEl, config) {
    if (!containerEl) return null;
    const cfg = config || {};
    const questions = Array.isArray(cfg.questions) ? cfg.questions : [];
    const speakFn = typeof cfg.speak === 'function' ? cfg.speak : function () {};

    let idx = 0;
    let score = 0;
    let correctCount = 0;
    let streak = 0;
    let isAnswered = false;

    function render() {
      if (!questions.length) {
        containerEl.innerHTML = '<div class="studio-challenge-card"><p>กำลังโหลดคลังคำศัพท์สำหรับแบบฝึกหัด...</p></div>';
        return;
      }

      if (idx >= questions.length) {
        const pct = correctCount / questions.length;
        const stars = pct >= 0.9 ? 3 : pct >= 0.6 ? 2 : pct > 0 ? 1 : 0;
        const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);
        containerEl.innerHTML = `
          <div class="studio-summary-card">
            <div class="studio-summary-stars">${starStr}</div>
            <h3 class="studio-summary-title">จบแบบฝึกหัดท้ายบท!</h3>
            <p class="studio-summary-stats">ตอบถูก <strong>${correctCount} / ${questions.length}</strong> ข้อ · คะแนนรวม <strong>${score}</strong></p>
            <button type="button" class="btn btn-primary studio-restart-btn" id="studio-btn-restart">↺ เล่นรอบใหม่</button>
          </div>
        `;
        const restartBtn = containerEl.querySelector('#studio-btn-restart');
        if (restartBtn) {
          restartBtn.onclick = () => {
            if (typeof cfg.onRestart === 'function') {
              cfg.onRestart();
            } else {
              idx = 0;
              score = 0;
              correctCount = 0;
              streak = 0;
              isAnswered = false;
              render();
            }
          };
        }
        return;
      }

      isAnswered = false;
      const q = questions[idx];
      containerEl.innerHTML = `
        <div class="studio-challenge-card">
          <div class="studio-challenge-hud">
            <span class="quiz-pill studio-progress-pill">ข้อ ${idx + 1}/${questions.length}</span>
            <span class="quiz-pill studio-score-pill">คะแนน ${score}</span>
            <span class="quiz-pill quiz-combo-pill ${streak >= 3 ? 'is-hot' : ''}">${streak >= 2 ? '🔥 คอมโบ ' + streak : '✨ คอมโบ ' + streak}</span>
          </div>
          <div class="studio-challenge-badge-row">
            <span class="choice-kind-badge">${sanitize(q.badge || 'แบบฝึกหัด')}</span>
            <button type="button" class="quiz-tool-btn studio-speak-btn">🔊 ฟังเสียง</button>
          </div>
          <div class="studio-challenge-prompt">${sanitize(q.prompt)}</div>
          <div class="studio-challenge-options">
            ${q.options.map((opt, oIdx) => `
              <button type="button" class="option-btn studio-opt-btn" data-opt-idx="${oIdx}">${sanitize(opt)}</button>
            `).join('')}
          </div>
          <div class="quiz-feedback-box studio-feedback-box" style="display:none">
            <div class="quiz-feedback-text studio-feedback-text"></div>
            <button type="button" class="quiz-next-btn studio-next-btn">${idx + 1 >= questions.length ? 'ดูสรุปผล ▶' : 'ข้อถัดไป ▶'}</button>
          </div>
        </div>
      `;

      const speakBtn = containerEl.querySelector('.studio-speak-btn');
      if (speakBtn) speakBtn.onclick = () => speakFn(q.speakText || '');

      const fbBox = containerEl.querySelector('.studio-feedback-box');
      const fbText = containerEl.querySelector('.studio-feedback-text');
      const nextBtn = containerEl.querySelector('.studio-next-btn');
      const optBtns = Array.from(containerEl.querySelectorAll('.studio-opt-btn'));

      optBtns.forEach((btn) => {
        btn.onclick = () => {
          if (isAnswered) return;
          isAnswered = true;
          const chosen = q.options[Number(btn.dataset.optIdx)];
          optBtns.forEach((b) => { b.disabled = true; });

          if (chosen === q.answer) {
            btn.classList.add('correct');
            streak += 1;
            correctCount += 1;
            const mult = streak >= 5 ? 2 : streak >= 3 ? 1.5 : 1;
            score += Math.round(10 * mult);
          } else {
            btn.classList.add('wrong');
            streak = 0;
            optBtns.forEach((b) => {
              if (q.options[Number(b.dataset.optIdx)] === q.answer) b.classList.add('correct');
            });
          }

          if (fbText) fbText.textContent = q.explain || '';
          if (fbBox) fbBox.style.display = 'flex';
        };
      });

      if (nextBtn) {
        nextBtn.onclick = () => {
          idx += 1;
          render();
        };
      }
    }

    render();
    return { rerender: render };
  }

  global.ThaiStudioChallenge = {
    MAE_LABELS,
    buildVowelMorphQuestions,
    buildDecoderQuestions,
    buildReadingQuestions,
    createChallengeRunner,
  };
})(typeof window !== 'undefined' ? window : globalThis);
