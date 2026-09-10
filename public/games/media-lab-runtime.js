(() => {
  'use strict';

  const config = window.MEDIA_CONFIG;
  if (!config) return;
  const root = document.getElementById('media-root');
  if (!root) return;
  const $ = (id) => document.getElementById(id);
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const state = {
    mode: 'learn',
    scene: 0,
    answered: false,
    values: Object.fromEntries((config.lab?.controls || []).map((control) => [control.id, control.value])),
  };

  root.innerHTML = `
    <div class="ml-shell ${reducedMotion ? 'ml-reduced' : ''}">
      <header class="ml-topbar">
        <button class="ml-btn ml-back" id="mlBack" type="button">← กลับคลังสื่อ</button>
        <h1>${config.icon || '📚'} ${config.title}</h1>
        <span class="ml-badge">${config.grade} · ${config.subject}</span>
      </header>
      <nav class="ml-toolbar" aria-label="โหมดการเรียนรู้">
        <button class="ml-tab on" data-mode="learn" aria-pressed="true" type="button">📖 อ่านทีละขั้น</button>
        <button class="ml-tab" data-mode="visual" aria-pressed="false" type="button">🖼️ ภาพประกอบ</button>
        <button class="ml-tab" data-mode="practice" aria-pressed="false" type="button">✏️ ฝึกปฏิบัติ</button>
        ${config.lab ? '<button class="ml-tab" data-mode="lab" aria-pressed="false" type="button">🧪 ทดลอง</button>' : ''}
        <span class="ml-spacer"></span>
        <button class="ml-btn ml-listen" id="mlListen" type="button">🔊 ฟังคำอธิบาย</button>
        <button class="ml-btn ml-next" id="mlNext" type="button">ขั้นถัดไป →</button>
      </nav>
      <main class="ml-main">
        <section class="ml-heading"><span class="ml-icon">${config.icon || '📚'}</span><div><p>${config.kicker}</p><h2>${config.objective}</h2></div></section>
        <section class="ml-content" id="mlContent"></section>
      </main>
      <footer class="ml-footer"><span>${config.slug}</span><span>สื่อการเรียนรู้ · กดปุ่มเพื่อเริ่มเสียง</span></footer>
    </div>`;

  const styles = document.createElement('style');
  styles.textContent = `
    *,*::before,*::after{box-sizing:border-box}body{margin:0;background:linear-gradient(145deg,#fff7df,#d8f3ed);font-family:Sarabun,Arial,sans-serif;color:#132238;padding:10px}.ml-shell{max-width:1500px;min-height:calc(100vh - 20px);margin:auto;background:#fffdf7;border:2px solid #12355b;border-radius:22px;overflow:hidden;box-shadow:0 16px 40px rgba(18,53,91,.15)}.ml-topbar{display:flex;align-items:center;gap:12px;padding:12px 16px;background:#12355b;color:#fff}.ml-topbar h1{font-size:clamp(22px,2.5vw,36px);margin:0;flex:1}.ml-badge{background:#f5b700;color:#12355b;padding:6px 11px;border-radius:999px;font-weight:800;white-space:nowrap}.ml-btn,.ml-tab{min-height:44px;border:2px solid #12355b;border-radius:12px;padding:8px 13px;font:800 16px Sarabun,Arial,sans-serif;cursor:pointer}.ml-back{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.5);color:#fff}.ml-toolbar{display:flex;flex-wrap:wrap;gap:7px;padding:9px 12px;border-bottom:2px solid #b8d8d8;background:#fff}.ml-tab{background:#fff;color:#12355b;border-radius:0}.ml-tab:first-child{border-radius:12px 0 0 12px}.ml-tab:last-of-type{border-radius:0 12px 12px 0}.ml-tab.on{background:#12355b;color:#fff}.ml-spacer{flex:1}.ml-listen{background:#d8f3ed}.ml-next{background:#f5b700}.ml-main{background:linear-gradient(180deg,#dff6ff,#fff7df);min-height:calc(100vh - 190px)}.ml-heading{display:flex;align-items:center;gap:13px;padding:14px 20px;border-bottom:2px dashed #b8d8d8}.ml-icon{width:58px;height:58px;display:grid;place-items:center;border-radius:17px;background:#f5b700;font-size:34px;box-shadow:4px 4px 0 #12355b}.ml-heading p{margin:0;color:#1f6f8b;font-weight:800}.ml-heading h2{margin:2px 0 0;color:#12355b;font-size:clamp(24px,3vw,42px)}.ml-content{padding:16px;min-height:480px}.ml-learn{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(290px,.85fr);gap:16px}.ml-card{background:rgba(255,253,247,.96);border:3px solid #12355b;border-radius:20px;padding:17px;box-shadow:7px 7px 0 rgba(18,53,91,.12)}.ml-scene-image{position:relative;aspect-ratio:16/9;overflow:hidden;border:4px solid #12355b;border-radius:20px;background:#d8f3ed}.ml-scene-image img{width:100%;height:100%;object-fit:cover}.ml-scene-image.is-error img{display:none}.ml-scene-fallback{position:absolute;inset:0;display:none;place-items:center;text-align:center;padding:20px;font-size:clamp(24px,4vw,50px);font-weight:800;color:#12355b;background:linear-gradient(145deg,#d8f3ed,#fff7df)}.ml-scene-image.is-error .ml-scene-fallback{display:grid}.ml-scene-label{position:absolute;left:3%;right:3%;top:3%;padding:10px;border:2px solid #12355b;border-radius:14px;background:rgba(255,253,247,.94);font-weight:800;color:#12355b}.ml-card h3{margin:0;color:#12355b;font-size:clamp(24px,3vw,38px)}.ml-card p{line-height:1.55;font-size:clamp(17px,1.8vw,22px);font-weight:600}.ml-tip{padding:10px;border:2px dashed #1f6f8b;border-radius:12px;background:#d8f3ed;color:#536579}.ml-steps{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.ml-step{min-height:42px;border:2px solid #b8d8d8;border-radius:999px;background:#fff;padding:6px 11px;font-weight:800;cursor:pointer}.ml-step.on{background:#f5b700;border-color:#12355b}.ml-visual{max-width:1120px;margin:auto}.ml-visual .ml-scene-image{width:100%;min-height:320px}.ml-visual .ml-scene-label{font-size:clamp(20px,2.7vw,34px)}.ml-practice,.ml-lab{max-width:850px;margin:auto;display:grid;gap:12px}.ml-choice{display:grid;gap:8px}.ml-option{min-height:48px;padding:10px 13px;border:2px solid #12355b;border-radius:12px;background:#fff;text-align:left;font-weight:800;font-size:17px;cursor:pointer}.ml-option:disabled{opacity:.75;cursor:default}.ml-feedback{min-height:30px;padding:9px;border-radius:12px;font-weight:800;line-height:1.45}.ml-feedback.good{background:#e4f7ed;color:#14804a}.ml-feedback.learn{background:#fff7df;color:#8a5600}.ml-control{display:grid;gap:6px;padding:10px 0;font-weight:800}.ml-control input{width:100%;accent-color:#1f6f8b}.ml-control output{color:#1f6f8b}.ml-lab-status{padding:12px;border:2px dashed #1f6f8b;border-radius:14px;background:#d8f3ed;font-size:20px;font-weight:800;line-height:1.45}.ml-reduced .ml-scene-image *{animation:none!important;transition:none!important}.ml-reduced::after{content:'เปิดโหมดลดการเคลื่อนไหว: แสดงผลเป็นสถานะนิ่ง';display:block;padding:8px 12px;background:#fff7df;color:#536579;text-align:center;font-weight:700}.ml-footer{display:flex;justify-content:space-between;padding:9px 14px;border-top:2px solid #b8d8d8;color:#536579;font-weight:700;font-size:13px}@media(max-width:900px){body{padding:0}.ml-shell{min-height:100vh;border:0;border-radius:0}.ml-learn{grid-template-columns:1fr}.ml-toolbar{overflow:auto;flex-wrap:nowrap}.ml-toolbar .ml-tab{white-space:nowrap}.ml-spacer{display:none}.ml-content{padding:10px}.ml-scene-image{min-height:240px}.ml-footer{display:none}}@media(max-width:520px){.ml-topbar{padding:10px}.ml-topbar h1{font-size:21px}.ml-badge{font-size:12px;padding:5px 8px}.ml-heading{padding:10px 12px}.ml-heading h2{font-size:25px}.ml-icon{width:48px;height:48px;font-size:27px}.ml-content{padding:8px}.ml-card{padding:13px}.ml-card p{font-size:17px}.ml-btn{font-size:14px;padding-inline:10px}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important}.ml-btn,.ml-tab,.ml-step,.ml-option{transition:none!important}}`;
  document.head.appendChild(styles);

  function stopSpeak() { try { window.KAMPAI?.sound?.stopSpeak?.(); } catch (_) {} try { window.speechSynthesis?.cancel(); } catch (_) {} }
  function speak(text) {
    stopSpeak();
    try { if (window.KAMPAI?.sound?.speak) { window.KAMPAI.sound.speak(text, 'th-TH', true); return; } } catch (_) {}
    try { if ('speechSynthesis' in window) { const utterance = new SpeechSynthesisUtterance(text); utterance.lang = 'th-TH'; utterance.rate = .88; window.speechSynthesis.speak(utterance); } } catch (_) {}
  }
  function currentScene() { return config.scenes[state.scene] || config.scenes[0]; }
  function imageMarkup(scene) { return `<div class="ml-scene-image"><img src="${config.image}" alt="${scene.alt || scene.title}" decoding="async"><div class="ml-scene-fallback">${scene.icon || config.icon || '📚'}<br>ภาพประกอบยังโหลดไม่ได้ แต่ยังอ่านต่อได้</div><div class="ml-scene-label">${scene.icon || config.icon || '📚'} ${scene.title}</div></div>`; }
  function renderLearn() { const scene = currentScene(); $('mlContent').innerHTML = `<div class="ml-learn">${imageMarkup(scene)}<article class="ml-card"><span class="ml-tip">${scene.kicker || `ขั้นที่ ${state.scene + 1} จาก ${config.scenes.length}`}</span><h3>${scene.title}</h3><p>${scene.body}</p><p class="ml-tip">${scene.tip}</p><div class="ml-steps">${config.scenes.map((item, index) => `<button class="ml-step ${index === state.scene ? 'on' : ''}" data-scene="${index}" type="button">${item.icon || '•'} ${item.label}</button>`).join('')}</div></article></div>`; bindImageFallback(); }
  function renderVisual() { const scene = currentScene(); $('mlContent').innerHTML = `<div class="ml-visual">${imageMarkup(scene)}<article class="ml-card"><h3>${scene.title}</h3><p>${scene.body}</p><p class="ml-tip">🔊 กด “ฟังคำอธิบาย” เพื่อฟังฉากนี้</p></article></div>`; bindImageFallback(); }
  function renderPractice() { const practice = config.practice || { title: 'ลองตอบคำถาม', question: 'ปรับค่าหรือสังเกตฉาก แล้วบอกเหตุผลที่คิด', options: [{ label: 'ฉันสังเกตและอธิบายเหตุผล', correct: true, explain: 'ดีมาก การสังเกตพร้อมเหตุผลช่วยให้เรียนรู้จากกิจกรรมได้ชัดเจนขึ้น' }] }; $('mlContent').innerHTML = `<div class="ml-practice ml-card"><h3>✏️ ${practice.title || 'ลองตอบคำถาม'}</h3><p>${practice.question}</p><div class="ml-choice">${practice.options.map((item, index) => `<button class="ml-option" data-answer="${index}" type="button">${item.label}</button>`).join('')}</div><div class="ml-feedback" id="mlFeedback">เลือกคำตอบ แล้วอ่านคำอธิบายเหตุผล</div></div>`; }
  function labResult() { const lab = config.lab; const values = state.values; if (lab.type === 'budget') { const balance = Number(values.income) - Number(values.need) - Number(values.want); return balance >= 0 ? `เหลือเงิน ${balance} บาท · แบ่งเงินได้พอดี` : `เงินขาด ${Math.abs(balance)} บาท · ควรลดรายจ่ายที่ไม่จำเป็น`; } if (lab.type === 'circuit') return Number(values.switch) > 50 ? 'วงจรปิด → กระแสไฟฟ้าไหล → หลอดไฟติด' : 'วงจรเปิด → กระแสไฟฟ้าไหลไม่ครบ → หลอดไฟไม่ติด'; return Number(values.level) > 60 ? lab.high : lab.low; }
  function renderLab() { const lab = config.lab; $('mlContent').innerHTML = `<div class="ml-lab ml-card"><h3>🧪 ${lab.title}</h3><p>${lab.intro}</p>${lab.controls.map((control) => `<label class="ml-control">${control.label}<output id="ml-${control.id}-value">${state.values[control.id]}${control.unit || '%'}</output><input type="range" min="${control.min}" max="${control.max}" value="${state.values[control.id]}" data-control="${control.id}"></label>`).join('')}<div class="ml-lab-status" id="mlLabStatus">${labResult()}</div>${lab.question ? `<p class="ml-tip">🔮 ลองทำนาย: ${lab.question}</p>` : ''}</div>`; }
  function bindImageFallback() { document.querySelectorAll('.ml-scene-image img').forEach((image) => image.addEventListener('error', () => image.parentElement.classList.add('is-error'), { once: true })); }
  function render() { if (state.mode === 'visual') renderVisual(); else if (state.mode === 'practice') renderPractice(); else if (state.mode === 'lab') renderLab(); else renderLearn(); }
  function setMode(mode) { stopSpeak(); state.mode = mode; document.querySelectorAll('[data-mode]').forEach((button) => { const active = button.dataset.mode === mode; button.classList.toggle('on', active); button.setAttribute('aria-pressed', String(active)); }); $('mlNext').hidden = mode === 'practice' || mode === 'lab'; render(); }
  function next() { state.scene = (state.scene + 1) % config.scenes.length; render(); }
  function reset() { state.scene = 0; state.answered = false; state.values = Object.fromEntries((config.lab?.controls || []).map((control) => [control.id, control.value])); render(); }

  document.querySelectorAll('[data-mode]').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
  $('mlContent').addEventListener('click', (event) => { const scene = event.target.closest('[data-scene]'); if (scene) { state.scene = Number(scene.dataset.scene); render(); return; } const option = event.target.closest('[data-answer]'); if (option && config.practice) { const answer = config.practice.options[Number(option.dataset.answer)]; state.answered = true; document.querySelectorAll('.ml-option').forEach((button) => { button.disabled = true; }); const feedback = $('mlFeedback'); feedback.textContent = answer.explain; feedback.className = `ml-feedback ${answer.correct ? 'good' : 'learn'}`; speak(answer.explain); } });
  $('mlContent').addEventListener('input', (event) => { const control = event.target.closest('[data-control]'); if (!control) return; state.values[control.dataset.control] = Number(control.value); const output = $(`ml-${control.dataset.control}-value`); if (output) output.textContent = `${control.value}${config.lab.controls.find((item) => item.id === control.dataset.control)?.unit || '%'}`; $('mlLabStatus').textContent = labResult(); });
  $('mlListen').addEventListener('click', () => speak(state.mode === 'lab' ? $('mlLabStatus').textContent : currentScene().speak || currentScene().body));
  $('mlNext').addEventListener('click', next);
  $('mlBack').addEventListener('click', () => { stopSpeak(); if (window.KAMPAI?.goHome) KAMPAI.goHome(); else history.back(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopSpeak(); });
  window.addEventListener('pagehide', stopSpeak);
  document.addEventListener('fullscreenchange', () => { if (!document.fullscreenElement) stopSpeak(); });
  if (window.KAMPAI) { try { KAMPAI.setSlug(config.slug); KAMPAI.sound?.mountToggles?.(); } catch (_) {} }
  window[config.stateKey || 'KampaiMedia'] = Object.freeze({ getState: () => Object.freeze({ mode: state.mode, scene: state.scene, answered: state.answered, values: { ...state.values } }) });
  render();
})();
