(() => {
  'use strict';

  const FONT_SCALE_KEY = 'kampai_media_font_scale';
  const FONT_SCALE_MIN = 0.85;
  const FONT_SCALE_MAX = 1.3;
  const FONT_SCALE_STEP = 0.1;

  const config = window.MEDIA_CONFIG || null;
  const root = document.getElementById('media-root');
  const $ = (id) => document.getElementById(id);

  const motionQuery = typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)')
    : null;

  function clampFontScale(value) {
    const num = Number(value);
    if (!Number.isFinite(num)) return 1;
    const clamped = Math.min(FONT_SCALE_MAX, Math.max(FONT_SCALE_MIN, num));
    return Math.round(clamped * 100) / 100;
  }

  function readSavedFontScale() {
    try {
      const saved = window.localStorage?.getItem(FONT_SCALE_KEY);
      return saved != null ? clampFontScale(saved) : 1;
    } catch (_) {
      return 1;
    }
  }

  const state = {
    mode: 'learn',
    scene: 0,
    answered: false,
    predictionIndex: 0,
    predictionAnswered: false,
    values: Object.fromEntries((config?.lab?.controls || []).map((control) => [control.id, control.value])),
    fontScale: readSavedFontScale(),
    projectorMode: false,
    reducedMotion: Boolean(motionQuery?.matches),
    speaking: false,
  };

  function applyReducedMotionClass() {
    if (document.body) {
      document.body.classList.toggle('reduced-motion', state.reducedMotion);
    }
    const shell = document.querySelector('.ml-shell');
    if (shell) {
      shell.classList.toggle('ml-reduced', state.reducedMotion);
    }
    const motionBtn = $('mlMotionToggle');
    if (motionBtn) {
      motionBtn.setAttribute('aria-pressed', String(state.reducedMotion));
      motionBtn.classList.toggle('on', state.reducedMotion);
    }
  }

  function setReducedMotion(enabled) {
    state.reducedMotion = Boolean(enabled);
    applyReducedMotionClass();
    return state.reducedMotion;
  }

  function applyFontScale() {
    const scale = clampFontScale(state.fontScale);
    state.fontScale = scale;
    if (document.documentElement?.style) {
      document.documentElement.style.setProperty('--ml-font-scale', String(scale));
    }
    const shell = document.querySelector('.ml-shell');
    if (shell) {
      shell.style.setProperty('--ml-font-scale', String(scale));
      shell.style.fontSize = `${Math.round(scale * 100)}%`;
    }
    const label = $('mlFontLabel');
    if (label) {
      label.textContent = `Aa ${Math.round(scale * 100)}%`;
    }
  }

  function setFontScale(scale) {
    state.fontScale = clampFontScale(scale);
    try {
      window.localStorage?.setItem(FONT_SCALE_KEY, String(state.fontScale));
    } catch (_) {}
    applyFontScale();
    return state.fontScale;
  }

  function toggleProjector(forced) {
    state.projectorMode = typeof forced === 'boolean' ? forced : !state.projectorMode;
    if (document.body) {
      document.body.classList.toggle('kampai-projector-mode', state.projectorMode);
    }
    const shell = document.querySelector('.ml-shell');
    if (shell) {
      shell.classList.toggle('ml-projector', state.projectorMode);
    }
    const btn = $('mlProjectorToggle');
    if (btn) {
      btn.setAttribute('aria-pressed', String(state.projectorMode));
      btn.classList.toggle('on', state.projectorMode);
      btn.textContent = state.projectorMode ? '📺 ออกจากจอใหญ่' : '📽️ ฉายจอห้องเรียน';
    }
    return state.projectorMode;
  }

  function updateSpeechStatus(message, isError = false) {
    const statusEl = $('mlSpeechStatus');
    if (statusEl) {
      if (message) {
        statusEl.textContent = message;
        statusEl.hidden = false;
        statusEl.className = `ml-speech-status${isError ? ' is-error' : ''}`;
      } else {
        statusEl.textContent = '';
        statusEl.hidden = true;
      }
    }
    const listenBtn = $('mlListen');
    if (listenBtn) {
      listenBtn.setAttribute('aria-pressed', String(state.speaking));
    }
  }

  function stopAllSpeech() {
    state.speaking = false;
    try {
      window.KAMPAI?.sound?.stopSpeak?.();
    } catch (_) {}
    try {
      window.speechSynthesis?.cancel?.();
    } catch (_) {}
    updateSpeechStatus('', false);
  }

  function speakSafe(text, opts = {}) {
    const cleanText = String(text ?? '').trim();
    if (!cleanText) {
      return { ok: false, reason: 'empty-text' };
    }

    const lang = opts.lang || 'th-TH';
    const rate = typeof opts.rate === 'number' && Number.isFinite(opts.rate) ? opts.rate : 1;
    const interrupt = opts.interrupt !== false;

    if (interrupt) {
      stopAllSpeech();
    }

    const hasSpeechSynth = typeof window !== 'undefined'
      && 'speechSynthesis' in window
      && window.speechSynthesis
      && typeof window.speechSynthesis.speak === 'function';

    const kampaiSpeak = window.KAMPAI?.sound?.speak;
    const kampaiAvailable = window.KAMPAI?.sound?.available !== false;
    const canUseKampai = typeof kampaiSpeak === 'function'
      && kampaiAvailable
      && (window.KAMPAI?.__real !== true || hasSpeechSynth);

    if (canUseKampai) {
      try {
        kampaiSpeak.call(window.KAMPAI.sound, cleanText, lang, interrupt);
        state.speaking = true;
        updateSpeechStatus('', false);
        return { ok: true };
      } catch (_) {}
    }

    if (hasSpeechSynth && typeof window.SpeechSynthesisUtterance === 'function') {
      try {
        const utterance = new window.SpeechSynthesisUtterance(cleanText);
        utterance.lang = lang;
        utterance.rate = rate;
        utterance.onend = () => {
          state.speaking = false;
          updateSpeechStatus('', false);
        };
        utterance.onerror = () => {
          state.speaking = false;
        };
        state.speaking = true;
        window.speechSynthesis.speak(utterance);
        updateSpeechStatus('', false);
        return { ok: true };
      } catch (_) {
        state.speaking = false;
      }
    }

    state.speaking = false;
    updateSpeechStatus('อุปกรณ์นี้ยังไม่รองรับเสียงอ่านอัตโนมัติ สามารถอ่านข้อความบนหน้าจอต่อได้', true);
    return { ok: false, reason: 'tts-unavailable' };
  }

  function getState() {
    return Object.freeze({
      mode: state.mode,
      scene: state.scene,
      answered: state.answered,
      predictionIndex: state.predictionIndex,
      predictionAnswered: state.predictionAnswered,
      values: Object.freeze({ ...state.values }),
      fontScale: state.fontScale,
      projectorMode: state.projectorMode,
      reducedMotion: state.reducedMotion,
      speaking: state.speaking,
    });
  }

  function ensureBaseStyles() {
    if (document.getElementById('ml-base-runtime-styles')) return;
    const baseStyle = document.createElement('style');
    baseStyle.id = 'ml-base-runtime-styles';
    baseStyle.textContent = `
      body.reduced-motion *,
      body.reduced-motion *::before,
      body.reduced-motion *::after {
        animation-duration: 0.001ms !important;
        animation-iteration-count: 1 !important;
        transition: none !important;
        scroll-behavior: auto !important;
      }
      body.kampai-projector-mode .ml-shell {
        max-width: 100%;
      }
    `;
    (document.head || document.documentElement).appendChild(baseStyle);
  }

  ensureBaseStyles();
  if (document.body) {
    applyReducedMotionClass();
    applyFontScale();
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      applyReducedMotionClass();
      applyFontScale();
    }, { once: true });
  }

  if (motionQuery && typeof motionQuery.addEventListener === 'function') {
    motionQuery.addEventListener('change', (event) => {
      setReducedMotion(event.matches);
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) stopAllSpeech();
  });
  window.addEventListener('pagehide', stopAllSpeech);
  document.addEventListener('fullscreenchange', () => {
    if (!document.fullscreenElement) stopAllSpeech();
  });

  // Expose core runtime API even when MEDIA_CONFIG / #media-root are absent
  let setModeImpl = (mode) => {
    stopAllSpeech();
    state.mode = mode;
  };
  let nextImpl = () => {};
  let resetImpl = () => {};

  if (config && root) {
    root.innerHTML = `
      <div class="ml-shell ${state.reducedMotion ? 'ml-reduced' : ''}">
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
          <div class="ml-a11y-group" role="group" aria-label="ปรับขนาดตัวอักษรและการแสดงผล">
            <button class="ml-btn ml-font-btn" id="mlFontDown" type="button" aria-label="ลดขนาดตัวอักษร">Aa−</button>
            <span class="ml-font-label" id="mlFontLabel">Aa ${Math.round(state.fontScale * 100)}%</span>
            <button class="ml-btn ml-font-btn" id="mlFontUp" type="button" aria-label="เพิ่มขนาดตัวอักษร">Aa+</button>
            <button class="ml-btn ml-motion-btn" id="mlMotionToggle" type="button" aria-pressed="${state.reducedMotion}" title="สลับโหมดลดการเคลื่อนไหว">🧊 นิ่ง</button>
            <button class="ml-btn ml-projector-btn" id="mlProjectorToggle" type="button" aria-pressed="false">📽️ ฉายจอห้องเรียน</button>
          </div>
          <button class="ml-btn ml-listen" id="mlListen" type="button" aria-pressed="false">🔊 ฟังคำอธิบาย</button>
          <button class="ml-btn ml-next" id="mlNext" type="button">ขั้นถัดไป →</button>
        </nav>
        <div class="ml-speech-status" id="mlSpeechStatus" role="status" aria-live="polite" hidden></div>
        <main class="ml-main">
          <section class="ml-heading"><span class="ml-icon">${config.icon || '📚'}</span><div><p>${config.kicker}</p><h2>${config.objective}</h2></div></section>
          <section class="ml-content" id="mlContent"></section>
        </main>
        <footer class="ml-footer"><span>${config.slug}</span><span>สื่อการเรียนรู้ · กดปุ่มเพื่อเริ่มเสียง</span></footer>
      </div>`;

    const styles = document.createElement('style');
    styles.textContent = `
      *,*::before,*::after{box-sizing:border-box}body{margin:0;background:linear-gradient(145deg,#fff7df,#d8f3ed);font-family:Sarabun,Arial,sans-serif;color:#132238;padding:10px}.ml-shell{max-width:1500px;min-height:calc(100vh - 20px);margin:auto;background:#fffdf7;border:2px solid #12355b;border-radius:22px;overflow:hidden;box-shadow:0 16px 40px rgba(18,53,91,.15)}.ml-topbar{display:flex;align-items:center;gap:12px;padding:12px 16px;background:#12355b;color:#fff}.ml-topbar h1{font-size:clamp(22px,2.5vw,36px);margin:0;flex:1}.ml-badge{background:#f5b700;color:#12355b;padding:6px 11px;border-radius:999px;font-weight:800;white-space:nowrap}.ml-btn,.ml-tab{min-height:44px;min-width:44px;border:2px solid #12355b;border-radius:12px;padding:8px 13px;font:800 16px Sarabun,Arial,sans-serif;cursor:pointer;background:#fff;color:#12355b}.ml-back{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.5);color:#fff}.ml-toolbar{display:flex;flex-wrap:wrap;align-items:center;gap:7px;padding:9px 12px;border-bottom:2px solid #b8d8d8;background:#fff}.ml-tab{background:#fff;color:#12355b;border-radius:0}.ml-tab:first-child{border-radius:12px 0 0 12px}.ml-tab:last-of-type{border-radius:0 12px 12px 0}.ml-tab.on{background:#12355b;color:#fff}.ml-spacer{flex:1}.ml-a11y-group{display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap}.ml-font-label{font-weight:800;font-size:14px;color:#12355b;padding:0 4px;white-space:nowrap}.ml-btn.on{background:#12355b;color:#fff}.ml-listen{background:#d8f3ed}.ml-next{background:#f5b700}.ml-speech-status{padding:8px 16px;background:#fff7df;border-bottom:2px solid #f5b700;color:#7c4a03;font-weight:700;font-size:15px}.ml-main{background:linear-gradient(180deg,#dff6ff,#fff7df);min-height:calc(100vh - 190px)}.ml-heading{display:flex;align-items:center;gap:13px;padding:14px 20px;border-bottom:2px dashed #b8d8d8}.ml-icon{width:58px;height:58px;display:grid;place-items:center;border-radius:17px;background:#f5b700;font-size:34px;box-shadow:4px 4px 0 #12355b}.ml-heading p{margin:0;color:#1f6f8b;font-weight:800}.ml-heading h2{margin:2px 0 0;color:#12355b;font-size:clamp(24px,3vw,42px)}.ml-content{padding:16px;min-height:480px}.ml-learn{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(290px,.85fr);gap:16px}.ml-card{background:rgba(255,253,247,.96);border:3px solid #12355b;border-radius:20px;padding:17px;box-shadow:7px 7px 0 rgba(18,53,91,.12)}.ml-scene-image{position:relative;aspect-ratio:16/9;overflow:hidden;border:4px solid #12355b;border-radius:20px;background:#d8f3ed}.ml-scene-image img{width:100%;height:100%;object-fit:cover}.ml-scene-image.is-error img{display:none}.ml-scene-fallback{position:absolute;inset:0;display:none;place-items:center;text-align:center;padding:20px;font-size:clamp(24px,4vw,50px);font-weight:800;color:#12355b;background:linear-gradient(145deg,#d8f3ed,#fff7df)}.ml-scene-image.is-error .ml-scene-fallback{display:grid}.ml-scene-label{position:absolute;left:3%;right:3%;top:3%;padding:10px;border:2px solid #12355b;border-radius:14px;background:rgba(255,253,247,.94);font-weight:800;color:#12355b}.ml-card h3{margin:0;color:#12355b;font-size:clamp(24px,3vw,38px)}.ml-card p{line-height:1.55;font-size:calc(clamp(17px,1.8vw,22px) * var(--ml-font-scale, 1));font-weight:600}.ml-tip{padding:10px;border:2px dashed #1f6f8b;border-radius:12px;background:#d8f3ed;color:#334e68}.ml-steps{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.ml-step{min-height:44px;border:2px solid #b8d8d8;border-radius:999px;background:#fff;padding:6px 11px;font-weight:800;cursor:pointer}.ml-step.on{background:#f5b700;border-color:#12355b}.ml-visual{max-width:1120px;margin:auto}.ml-visual .ml-scene-image{width:100%;min-height:320px}.ml-visual .ml-scene-label{font-size:clamp(20px,2.7vw,34px)}.ml-practice,.ml-lab{max-width:850px;margin:auto;display:grid;gap:12px}.ml-choice{display:grid;gap:8px}.ml-option{min-height:48px;padding:10px 13px;border:2px solid #12355b;border-radius:12px;background:#fff;text-align:left;font-weight:800;font-size:calc(17px * var(--ml-font-scale, 1));cursor:pointer}.ml-option:disabled{opacity:.75;cursor:default}.ml-feedback{min-height:30px;padding:9px;border-radius:12px;font-weight:800;line-height:1.45}.ml-feedback.good{background:#e4f7ed;color:#14804a}.ml-feedback.learn{background:#fff7df;color:#8a5600}.ml-control{display:grid;gap:6px;padding:10px 0;font-weight:800}.ml-control input{width:100%;accent-color:#1f6f8b}.ml-control output{color:#1f6f8b}.ml-lab-status{padding:12px;border:2px dashed #1f6f8b;border-radius:14px;background:#d8f3ed;font-size:20px;font-weight:800;line-height:1.45}.ml-reduced .ml-scene-image *{animation:none!important;transition:none!important}.ml-reduced::after{content:'เปิดโหมดลดการเคลื่อนไหว: แสดงผลเป็นสถานะนิ่ง';display:block;padding:8px 12px;background:#fff7df;color:#536579;text-align:center;font-weight:700}.ml-footer{display:flex;justify-content:space-between;padding:9px 14px;border-top:2px solid #b8d8d8;color:#536579;font-weight:700;font-size:13px}@media(max-width:900px){body{padding:0}.ml-shell{min-height:100vh;border:0;border-radius:0;padding-bottom:68px}.ml-learn{grid-template-columns:1fr}.ml-toolbar{overflow:auto;flex-wrap:nowrap}.ml-toolbar .ml-tab,.ml-a11y-group{flex-shrink:0}.ml-toolbar .ml-tab{white-space:nowrap}.ml-spacer{display:none}.ml-content{padding:10px}.ml-scene-image{min-height:240px}.ml-footer{display:none}}@media(max-width:520px){.ml-topbar{padding:10px}.ml-topbar h1{font-size:21px}.ml-badge{font-size:12px;padding:5px 8px}.ml-heading{padding:10px 12px}.ml-heading h2{font-size:25px}.ml-icon{width:48px;height:48px;font-size:27px}.ml-content{padding:8px}.ml-card{padding:13px}.ml-card p{font-size:calc(17px * var(--ml-font-scale, 1))}.ml-btn{font-size:14px;padding-inline:10px}}
      @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important}.ml-btn,.ml-tab,.ml-step,.ml-option{transition:none!important}}`;
    document.head.appendChild(styles);

    const labStyles = document.createElement('style');
    labStyles.textContent = `.ml-lab-visual{display:flex;align-items:center;gap:14px;padding:14px;border:3px solid #12355b;border-radius:18px;background:linear-gradient(145deg,#fff,#dff6ff)}.ml-state-orb{width:88px;height:88px;flex:0 0 88px;display:grid;place-items:center;border-radius:50%;font-size:48px;background:#bfdbfe;border:4px solid #12355b;box-shadow:0 7px 0 rgba(18,53,91,.16)}.ml-state-orb.matter-solid{background:#bfdbfe}.ml-state-orb.matter-liquid{background:#99f6e4}.ml-state-orb.matter-gas{background:#fde68a}.ml-state-orb.circuit-on{background:#bbf7d0}.ml-state-orb.circuit-off{background:#fecaca}.ml-lab-visual strong{display:block;color:#12355b;font-size:24px}.ml-lab-visual p{margin:4px 0 0;font-size:17px;line-height:1.45}.ml-prediction{display:grid;gap:8px;padding:12px;border:2px dashed #f5b700;border-radius:14px;background:#fff7df}.ml-prediction h4{margin:0;color:#12355b;font-size:21px}.ml-prediction-option{min-height:44px;padding:9px 12px;border:2px solid #12355b;border-radius:12px;background:#fff;text-align:left;font:800 16px Sarabun,Arial,sans-serif;cursor:pointer}.ml-prediction-option:disabled{opacity:.75;cursor:default}.ml-prediction-feedback{min-height:28px;line-height:1.45;font-weight:800}.ml-prediction-feedback.good{color:#14804a}.ml-prediction-feedback.learn{color:#8a5600}@media(prefers-reduced-motion:reduce){.ml-state-orb,.ml-prediction-option{transition:none!important;animation:none!important}}@media(max-width:520px){.ml-lab-visual{align-items:flex-start}.ml-state-orb{width:66px;height:66px;flex-basis:66px;font-size:36px}.ml-lab-visual strong{font-size:20px}}`;
    document.head.appendChild(labStyles);

    function currentScene() {
      return config.scenes[state.scene] || config.scenes[0];
    }

    function imageMarkup(scene) {
      return `<div class="ml-scene-image"><img src="${config.image}" alt="${scene.alt || scene.title}" decoding="async"><div class="ml-scene-fallback">${scene.icon || config.icon || '📚'}<br>ภาพประกอบยังโหลดไม่ได้ แต่ยังอ่านต่อได้</div><div class="ml-scene-label">${scene.icon || config.icon || '📚'} ${scene.title}</div></div>`;
    }

    function bindImageFallback() {
      document.querySelectorAll('.ml-scene-image img').forEach((image) => {
        image.addEventListener('error', () => image.parentElement.classList.add('is-error'), { once: true });
      });
    }

    function renderLearn() {
      const scene = currentScene();
      $('mlContent').innerHTML = `<div class="ml-learn">${imageMarkup(scene)}<article class="ml-card"><span class="ml-tip">${scene.kicker || `ขั้นที่ ${state.scene + 1} จาก ${config.scenes.length}`}</span><h3>${scene.title}</h3><p>${scene.body}</p><p class="ml-tip">${scene.tip}</p><div class="ml-steps">${config.scenes.map((item, index) => `<button class="ml-step ${index === state.scene ? 'on' : ''}" data-scene="${index}" type="button">${item.icon || '•'} ${item.label}</button>`).join('')}</div></article></div>`;
      bindImageFallback();
    }

    function renderVisual() {
      const scene = currentScene();
      $('mlContent').innerHTML = `<div class="ml-visual">${imageMarkup(scene)}<article class="ml-card"><h3>${scene.title}</h3><p>${scene.body}</p><p class="ml-tip">🔊 กด “ฟังคำอธิบาย” เพื่อฟังฉากนี้</p></article></div>`;
      bindImageFallback();
    }

    function renderPractice() {
      const practice = config.practice || {
        title: 'ลองตอบคำถาม',
        question: 'ปรับค่าหรือสังเกตฉาก แล้วบอกเหตุผลที่คิด',
        options: [{ label: 'ฉันสังเกตและอธิบายเหตุผล', correct: true, explain: 'ดีมาก การสังเกตพร้อมเหตุผลช่วยให้เรียนรู้จากกิจกรรมได้ชัดเจนขึ้น' }],
      };
      $('mlContent').innerHTML = `<div class="ml-practice ml-card"><h3>✏️ ${practice.title || 'ลองตอบคำถาม'}</h3><p>${practice.question}</p><div class="ml-choice">${practice.options.map((item, index) => `<button class="ml-option" data-answer="${index}" type="button">${item.label}</button>`).join('')}</div><div class="ml-feedback" id="mlFeedback">เลือกคำตอบ แล้วอ่านคำอธิบายเหตุผล</div></div>`;
    }

    function labStage() {
      const lab = config.lab;
      const values = state.values;
      if (lab.type === 'matter') {
        const heat = Number(values.heat);
        if (heat < 35) return { icon: '🧊', className: 'matter-solid', title: 'ของแข็ง', detail: 'อนุภาคอยู่ใกล้กันและสั่นอยู่กับที่มากขึ้น' };
        if (heat < 70) return { icon: '💧', className: 'matter-liquid', title: 'ของเหลว', detail: 'อนุภาคเลื่อนผ่านกันได้ จึงไหลตามภาชนะ' };
        return { icon: '♨️', className: 'matter-gas', title: 'ไอน้ำ / แก๊ส', detail: 'อนุภาคเคลื่อนที่เร็วและกระจายออกจากกัน' };
      }
      if (lab.type === 'circuit') {
        const closed = Number(values.switch) > 50 && Number(values.wire) > 50 && Number(values.battery) > 20;
        return closed
          ? { icon: '💡', className: 'circuit-on', title: 'หลอดไฟติด', detail: 'วงจรปิดและมีแหล่งพลังงาน กระแสไฟฟ้าไหลครบทาง' }
          : { icon: '💡', className: 'circuit-off', title: 'หลอดไฟยังไม่ติด', detail: 'ตรวจว่าวงจรปิด สายไฟต่อครบ และมีแบตเตอรี่เพียงพอ' };
      }
      return { icon: '🔬', className: '', title: lab.title, detail: labResult() };
    }

    function labResult() {
      const lab = config.lab;
      const values = state.values;
      if (lab.type === 'budget') {
        const balance = Number(values.income) - Number(values.need) - Number(values.want);
        return balance >= 0
          ? `เหลือเงิน ${balance} บาท · แบ่งเงินได้พอดี`
          : `เงินขาด ${Math.abs(balance)} บาท · ควรลดรายจ่ายที่ไม่จำเป็น`;
      }
      if (lab.type === 'matter' || lab.type === 'circuit') return labStage().detail;
      return Number(values.level) > 60 ? lab.high : lab.low;
    }

    function labVisualMarkup() {
      const stage = labStage();
      return `<div class="ml-lab-visual" id="mlLabVisual" aria-live="polite"><div class="ml-state-orb ${stage.className}">${stage.icon}</div><div><strong>${stage.title}</strong><p>${stage.detail}</p></div></div>`;
    }

    function predictionMarkup() {
      const predictions = config.lab?.predictions || [];
      if (!predictions.length) return '';
      const item = predictions[state.predictionIndex % predictions.length];
      return `<div class="ml-prediction"><h4>🔮 คำถามทำนาย ${state.predictionIndex % predictions.length + 1}/${predictions.length}</h4><p>${item.question}</p><div class="ml-choice">${item.options.map((option, index) => `<button class="ml-prediction-option" data-prediction-answer="${index}" type="button">${option.label}</button>`).join('')}</div><div class="ml-prediction-feedback" id="mlPredictionFeedback">เลือกคำตอบก่อนปรับตัวแปร แล้วอ่านเหตุผล</div><button class="ml-btn" data-prediction-next="true" type="button">คำถามถัดไป →</button></div>`;
    }

    function renderLab() {
      const lab = config.lab;
      $('mlContent').innerHTML = `<div class="ml-lab ml-card"><h3>🧪 ${lab.title}</h3><p>${lab.intro}</p>${labVisualMarkup()}${lab.controls.map((control) => `<label class="ml-control">${control.label}<output id="ml-${control.id}-value">${state.values[control.id]}${control.unit || '%'}</output><input type="range" min="${control.min}" max="${control.max}" value="${state.values[control.id]}" data-control="${control.id}"></label>`).join('')}<div class="ml-lab-status" id="mlLabStatus">${labResult()}</div>${predictionMarkup()}</div>`;
    }

    function render() {
      if (state.mode === 'visual') renderVisual();
      else if (state.mode === 'practice') renderPractice();
      else if (state.mode === 'lab') renderLab();
      else renderLearn();
    }

    setModeImpl = function setMode(mode) {
      stopAllSpeech();
      state.mode = mode;
      document.querySelectorAll('[data-mode]').forEach((button) => {
        const active = button.dataset.mode === mode;
        button.classList.toggle('on', active);
        button.setAttribute('aria-pressed', String(active));
      });
      const nextBtn = $('mlNext');
      if (nextBtn) nextBtn.hidden = mode === 'practice' || mode === 'lab';
      render();
    };

    nextImpl = function next() {
      stopAllSpeech();
      state.scene = (state.scene + 1) % config.scenes.length;
      render();
    };

    resetImpl = function reset() {
      stopAllSpeech();
      state.scene = 0;
      state.answered = false;
      state.predictionIndex = 0;
      state.predictionAnswered = false;
      state.values = Object.fromEntries((config.lab?.controls || []).map((control) => [control.id, control.value]));
      render();
    };

    document.querySelectorAll('[data-mode]').forEach((button) => {
      button.addEventListener('click', () => setModeImpl(button.dataset.mode));
    });

    $('mlContent').addEventListener('click', (event) => {
      const scene = event.target.closest('[data-scene]');
      if (scene) {
        stopAllSpeech();
        state.scene = Number(scene.dataset.scene);
        render();
        return;
      }
      const option = event.target.closest('[data-answer]');
      if (option && config.practice) {
        const answer = config.practice.options[Number(option.dataset.answer)];
        state.answered = true;
        document.querySelectorAll('.ml-option').forEach((button) => { button.disabled = true; });
        const feedback = $('mlFeedback');
        feedback.textContent = answer.explain;
        feedback.className = `ml-feedback ${answer.correct ? 'good' : 'learn'}`;
        speakSafe(answer.explain, { lang: 'th-TH', rate: 0.92 });
        return;
      }
      const prediction = event.target.closest('[data-prediction-answer]');
      if (prediction && config.lab?.predictions) {
        const item = config.lab.predictions[state.predictionIndex % config.lab.predictions.length];
        const answer = item.options[Number(prediction.dataset.predictionAnswer)];
        state.predictionAnswered = true;
        document.querySelectorAll('.ml-prediction-option').forEach((button) => { button.disabled = true; });
        const feedback = $('mlPredictionFeedback');
        feedback.textContent = answer.explain;
        feedback.className = `ml-prediction-feedback ${answer.correct ? 'good' : 'learn'}`;
        speakSafe(answer.explain, { lang: 'th-TH', rate: 0.92 });
        return;
      }
      const nextPrediction = event.target.closest('[data-prediction-next]');
      if (nextPrediction && config.lab?.predictions?.length) {
        stopAllSpeech();
        state.predictionIndex = (state.predictionIndex + 1) % config.lab.predictions.length;
        state.predictionAnswered = false;
        renderLab();
      }
    });

    $('mlContent').addEventListener('input', (event) => {
      const control = event.target.closest('[data-control]');
      if (!control) return;
      state.values[control.dataset.control] = Number(control.value);
      const output = $(`ml-${control.dataset.control}-value`);
      if (output) output.textContent = `${control.value}${config.lab.controls.find((item) => item.id === control.dataset.control)?.unit || '%'}`;
      const status = $('mlLabStatus');
      if (status) status.textContent = labResult();
      const visual = $('mlLabVisual');
      if (visual) visual.outerHTML = labVisualMarkup();
    });

    $('mlListen').addEventListener('click', () => {
      const text = state.mode === 'lab'
        ? $('mlLabStatus')?.textContent
        : (currentScene().speak || currentScene().body);
      speakSafe(text, { lang: 'th-TH', rate: 0.9 });
    });

    $('mlNext').addEventListener('click', nextImpl);
    $('mlBack').addEventListener('click', () => {
      stopAllSpeech();
      if (window.KAMPAI?.goHome) window.KAMPAI.goHome();
      else history.back();
    });

    $('mlFontDown').addEventListener('click', () => setFontScale(state.fontScale - FONT_SCALE_STEP));
    $('mlFontUp').addEventListener('click', () => setFontScale(state.fontScale + FONT_SCALE_STEP));
    $('mlMotionToggle').addEventListener('click', () => setReducedMotion(!state.reducedMotion));
    $('mlProjectorToggle').addEventListener('click', () => toggleProjector());

    if (window.KAMPAI) {
      try {
        window.KAMPAI.setSlug(config.slug);
        window.KAMPAI.sound?.mountToggles?.();
      } catch (_) {}
    }

    applyReducedMotionClass();
    applyFontScale();
    render();
  }

  const runtimeApi = Object.freeze({
    speakSafe,
    stopAllSpeech,
    getState,
    setFontScale,
    setReducedMotion,
    toggleProjector,
    setMode: (mode) => setModeImpl(mode),
    next: () => nextImpl(),
    reset: () => resetImpl(),
  });

  window.KampaiMediaLab = runtimeApi;

  if (config) {
    window[config.stateKey || 'KampaiMedia'] = Object.freeze({
      getState,
    });
  }
})();
