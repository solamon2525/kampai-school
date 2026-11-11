/* spelling-decoder.js — โรงละครถอดหน้ากากตัวสะกด (Consonant Mask-Off Studio)
   สื่อการสอนนวัตกรรมถอดรหัสตัวสะกดไม่ตรงมาตรา (แม่กด, แม่กน, แม่กบ, แม่กก)
   3 ขั้นตอน: 1. รูปเขียนสวมหน้ากาก ➔ 2. แว่นสแกน X-Ray ➔ 3. ถอดหน้ากากเสียงแม่ตรงสีทอง พร้อมอ่านแจกลูกคำ */

(function () {
  'use strict';

  // ─── 1. Web Audio API Sound Effects ─────────────────────────────
  class DecoderAudio {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }

    init() {
      if (!this.ctx && typeof window !== 'undefined') {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
    }

    // เสียงตัวสะกดวิ่ง / สลับคำ (Whoosh)
    playWhoosh() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(420, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(90, this.ctx.currentTime + 0.18);
        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.18);
      } catch (_) {}
    }

    // เสียงแว่นสแกนเสียง X-Ray (High-tech Scanner Chirp)
    playScan() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(880, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1760, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.14);
      } catch (_) {}
    }

    // เสียงถอดหน้ากากสำเร็จ (Magic Sparkle Chime)
    playMagicSparkle() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const freqs = [659.25, 783.99, 987.77, 1318.51, 1567.98]; // E5, G5, B5, E6, G6
        freqs.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          const startTime = this.ctx.currentTime + idx * 0.06;
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.24, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.38);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.38);
        });
      } catch (_) {}
    }
  }

  const decoderAudio = new DecoderAudio();

  // ─── 2. Web Speech API Phonics Readout ──────────────────────────
  function speakPhonics(text) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      utterance.rate = 0.85; // จังหวะชัดถ้อยชัดคำสำหรับเด็กประถม
      window.speechSynthesis.speak(utterance);
    }
  }

  // ─── 3. ข้อมูลมาตราตัวสะกด (Sections Metadata) ─────────────────
  const SECTIONS = [
    {
      id: 'kod',
      title: 'แม่กด (เสียง ด)',
      name: 'แม่กด',
      sound: 'ด',
      badge: 'แม่กด (เสียง ด)',
      desc: 'ตัวสะกดไม่ตรงมาตรา เช่น จ, ช, ซ, ฎ, ฏ, ฐ, ฑ, ฒ, ด, ต, ถ, ท, ธ, ศ, ษ, ส ออกเสียงเหมือน ด สะกด'
    },
    {
      id: 'kon',
      title: 'แม่กน (เสียง น)',
      name: 'แม่กน',
      sound: 'น',
      badge: 'แม่กน (เสียง น)',
      desc: 'ตัวสะกดไม่ตรงมาตรา เช่น ญ, ณ, น, ร, ล, ฬ ออกเสียงเหมือน น สะกด'
    },
    {
      id: 'kob',
      title: 'แม่กบ (เสียง บ)',
      name: 'แม่กบ',
      sound: 'บ',
      badge: 'แม่กบ (เสียง บ)',
      desc: 'ตัวสะกดไม่ตรงมาตรา เช่น บ, ป, พ, ฟ, ภ ออกเสียงเหมือน บ สะกด'
    },
    {
      id: 'kok',
      title: 'แม่กก (เสียง ก)',
      name: 'แม่กก',
      sound: 'ก',
      badge: 'แม่กก (เสียง ก)',
      desc: 'ตัวสะกดไม่ตรงมาตรา เช่น ก, ข, ค, ฆ ออกเสียงเหมือน ก สะกด'
    }
  ];

  // ─── 4. State Management ───────────────────────────────────────
  let wordsData = [];
  let sectionMap = { kod: [], kon: [], kob: [], kok: [] };
  let currentSectionId = 'kod';
  let currentWordIndex = 0;
  let currentStep = 1; // 1: Masked, 2: X-Ray Scanner, 3: Unmasked Gold
  let dataReadyPromise = null;
  let eventsBound = false;

  let wordsMap = new Map();

  function setDataset(words) {
    wordsData = Array.isArray(words) ? words : [];
    wordsMap = new Map();
    sectionMap = { kod: [], kon: [], kob: [], kok: [] };
    wordsData.forEach(w => {
      if (w && w.word) {
        wordsMap.set(w.word.trim(), w);
      }
      if (sectionMap[w.targetSection]) {
        sectionMap[w.targetSection].push(w);
      }
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('spelling-decoder-loaded', { detail: { count: wordsData.length } }));
    }
  }

  function loadData() {
    if (wordsData.length > 0) return Promise.resolve(wordsData);
    if (dataReadyPromise) return dataReadyPromise;

    dataReadyPromise = (async () => {
      if (typeof window !== 'undefined' && window.THAI_SPELLING_DECODER_DATA && Array.isArray(window.THAI_SPELLING_DECODER_DATA.words)) {
        setDataset(window.THAI_SPELLING_DECODER_DATA.words);
        return wordsData;
      }

      const candidateUrls = [
        'data/words/spelling-decoder.json',
        '/games/thai/thai-vocab-hub/data/words/spelling-decoder.json',
        'public/games/thai/thai-vocab-hub/data/words/spelling-decoder.json'
      ];

      for (const url of candidateUrls) {
        try {
          const resp = await fetch(url);
          if (resp.ok) {
            const json = await resp.json();
            if (json && Array.isArray(json.words)) {
              setDataset(json.words);
              return wordsData;
            }
          }
        } catch (_) {}
      }
      return wordsData;
    })();

    return dataReadyPromise;
  }

  // ─── 5. UI Builder / Modal DOM ─────────────────────────────────
  function ensureModal() {
    let modal = document.getElementById('modal-spelling-decoder');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-spelling-decoder';
      modal.className = 'tvh-modal-backdrop decoder-theater-backdrop';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-labelledby', 'decoder-theater-title');
      modal.style.display = 'none';
      modal.innerHTML = `
        <div class="tvh-modal-card decoder-theater-card" role="document">
          <!-- Header -->
          <div class="decoder-theater-header">
            <div class="decoder-header-left">
              <span class="decoder-pill-badge">นวัตกรรมสื่อการสอน</span>
              <h2 id="decoder-theater-title" class="decoder-title">🎭 โรงละครถอดหน้ากากตัวสะกด</h2>
            </div>
            <div class="decoder-header-right">
              <button type="button" class="btn-decoder-tool touch-target" id="btn-decoder-audio-toggle" title="เปิด/ปิดเสียง">🔊 เสียง</button>
              <button type="button" class="tvh-modal-close touch-target" aria-label="ปิดโรงละคร" onclick="window.ThaiSpellingDecoder.close()">×</button>
            </div>
          </div>

          <!-- Section Tabs -->
          <div class="decoder-preset-bar" role="tablist" aria-label="เลือกมาตราตัวสะกด">
            <button type="button" class="decoder-preset-tab touch-target active" data-section="kod" onclick="window.ThaiSpellingDecoder.selectSection('kod')">แม่กด (เสียง ด)</button>
            <button type="button" class="decoder-preset-tab touch-target" data-section="kon" onclick="window.ThaiSpellingDecoder.selectSection('kon')">แม่กน (เสียง น)</button>
            <button type="button" class="decoder-preset-tab touch-target" data-section="kob" onclick="window.ThaiSpellingDecoder.selectSection('kob')">แม่กบ (เสียง บ)</button>
            <button type="button" class="decoder-preset-tab touch-target" data-section="kok" onclick="window.ThaiSpellingDecoder.selectSection('kok')">แม่กก (เสียง ก)</button>
          </div>

          <!-- Section Rule Banner -->
          <div class="decoder-rule-banner">
            <div class="decoder-rule-badge" id="decoder-rule-badge">แม่กด (เสียง ด)</div>
            <div class="decoder-rule-desc" id="decoder-rule-desc">
              ตัวสะกดไม่ตรงมาตรา เช่น จ, ช, ซ, ฎ, ฏ, ฐ, ฑ, ฒ, ด, ต, ถ, ท, ธ, ศ, ษ, ส ออกเสียงเหมือน ด สะกด
            </div>
          </div>

          <!-- Theater Stage Screen -->
          <div class="decoder-stage-wrapper">
            <div class="decoder-stage-screen" id="decoder-stage-screen">
              <!-- Animated characters injected dynamically -->
            </div>

            <!-- Phonics Equation Subtitle -->
            <div class="decoder-equation-box" id="decoder-equation-box">
              <span id="decoder-eq-spelling" class="eq-spelling">ตอ - อำ = ตำ, รอ - อัว - ดอ = รวด ➔ ตำ-รวด</span>
              <button type="button" class="btn-voice-pill touch-target" id="btn-decoder-speak" onclick="window.ThaiSpellingDecoder.speakPhonics()">
                🔊 ฟังเสียงแจกลูก
              </button>
            </div>
          </div>

          <!-- Quick Example Chips -->
          <div class="decoder-examples-row">
            <span class="decoder-ex-label" id="decoder-ex-label">คำตัวอย่าง:</span>
            <div id="decoder-examples-chips" class="decoder-examples-chips"></div>
          </div>

          <!-- Controls Footer -->
          <div class="decoder-theater-footer">
            <div class="decoder-step-indicator" id="decoder-step-indicator">
              <span class="step-dot active" data-step="1">1. คำรูปจริง (สวมหน้ากาก)</span>
              <span class="step-arrow">➔</span>
              <span class="step-dot" data-step="2">2. สแกนเสียง (แว่น X-Ray)</span>
              <span class="step-arrow">➔</span>
              <span class="step-dot" data-step="3">3. ถอดหน้ากาก! ✨</span>
            </div>

            <div class="decoder-footer-actions">
              <button type="button" class="cbtn touch-target btn-decoder-reset" onclick="window.ThaiSpellingDecoder.reset()">↺ ตั้งต้นใหม่</button>
              <button type="button" class="btn btn-primary btn-decoder-next touch-target" id="btn-decoder-next" onclick="window.ThaiSpellingDecoder.nextStep()">
                ก้าวต่อไป ▶ (Spacebar)
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    if (!eventsBound) {
      eventsBound = true;
      const audioBtn = document.getElementById('btn-decoder-audio-toggle');
      if (audioBtn) {
        audioBtn.addEventListener('click', () => {
          decoderAudio.enabled = !decoderAudio.enabled;
          audioBtn.textContent = decoderAudio.enabled ? '🔊 เสียง' : '🔇 ปิดเสียง';
        });
      }

      window.addEventListener('keydown', (e) => {
        const m = document.getElementById('modal-spelling-decoder');
        if (!m || m.style.display !== 'flex') return;
        if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowRight') {
          e.preventDefault();
          window.ThaiSpellingDecoder.nextStep();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          window.ThaiSpellingDecoder.prevStep();
        } else if (e.key === 'Escape') {
          window.ThaiSpellingDecoder.close();
        }
      });
    }
  }

  // ─── 6. Stage & Step Renderer ──────────────────────────────────
  function renderStage() {
    const stage = document.getElementById('decoder-stage-screen');
    const eqSpelling = document.getElementById('decoder-eq-spelling');
    const nextBtn = document.getElementById('btn-decoder-next');
    if (!stage) return;

    const secWords = sectionMap[currentSectionId] || [];
    const curWord = secWords[currentWordIndex];
    if (!curWord) {
      stage.innerHTML = '<div class="decoder-loading">กำลังโหลดคำศัพท์...</div>';
      return;
    }

    const word = curWord.word;
    const surface = curWord.surfaceConsonant;
    const sound = curWord.soundConsonant;
    const reading = curWord.reading;

    // Segment word into prefix, surface consonant with attached combining marks, and suffix
    let sIdx = word.indexOf(surface);
    if (sIdx === -1) sIdx = word.lastIndexOf(surface);

    let prefix = '';
    let renderedSurface = surface;
    let suffix = '';

    if (sIdx !== -1) {
      let sLen = surface.length;
      while (sIdx + sLen < word.length) {
        const code = word.charCodeAt(sIdx + sLen);
        if ((code >= 0x0e31 && code <= 0x0e3a) || (code >= 0x0e47 && code <= 0x0e4e)) {
          sLen++;
        } else {
          break;
        }
      }
      prefix = word.slice(0, sIdx);
      renderedSurface = word.slice(sIdx, sIdx + sLen);
      suffix = word.slice(sIdx + sLen);
    } else {
      prefix = word;
      renderedSurface = '';
    }

    // Step 1: คำรูปจริง ตัวสะกดสวมหน้ากากปริศนา
    if (currentStep === 1) {
      stage.innerHTML = `
        <div class="decoder-char-group step-1 animate-pop-in">
          <span class="char-normal">${prefix}</span>
          <span class="mask-surface-char" data-surface="${surface}" title="ตัวสะกดสวมหน้ากาก: ${surface}">
            ${renderedSurface}
            <span class="mask-badge-mystery" aria-hidden="true">🎭</span>
          </span>
          <span class="char-normal">${suffix}</span>
        </div>
      `;
      if (nextBtn) nextBtn.innerHTML = 'สแกนเสียง (แว่น X-Ray) ▶ (Spacebar)';
    }
    // Step 2: แว่นสแกนเสียง X-Ray ค้นหาเสียงแม่ตรง
    else if (currentStep === 2) {
      stage.innerHTML = `
        <div class="decoder-char-group step-2 scanning">
          <span class="char-normal">${prefix}</span>
          <span class="mask-surface-char mask-scan-xray" data-surface="${surface}">
            ${renderedSurface}
            <span class="xray-laser" aria-hidden="true"></span>
            <span class="xray-target-sound" aria-hidden="true">[เสียง ${sound}]</span>
          </span>
          <span class="char-normal">${suffix}</span>
        </div>
      `;
      if (nextBtn) nextBtn.innerHTML = 'ถอดหน้ากาก! ✨ ▶ (Spacebar)';
    }
    // Step 3: ถอดหน้ากากแปลงร่างเป็นเสียงแม่ตรงสีทอง พร้อมคำอ่านและอ่านแจกลูก
    else if (currentStep === 3) {
      stage.innerHTML = `
        <div class="decoder-char-group step-3 unmasked word-elastic-settle">
          <span class="char-normal">${prefix}</span>
          <span class="mask-surface-char unmasked-gold">
            ${renderedSurface}
            <span class="mask-unmasked-sound" title="เสียงแม่ตรง">[${sound}]</span>
          </span>
          <span class="char-normal">${suffix}</span>
          <span class="decoder-bracketed-reading">(${reading})</span>
        </div>
      `;
      if (nextBtn) nextBtn.innerHTML = 'คำถัดไป ➔ (Spacebar)';
    }

    if (eqSpelling) {
      const pd = curWord.phonicsDecomposition;
      eqSpelling.textContent = pd ? pd.phonicsSpelling : `${word} = ${reading}`;
    }

    updateStepIndicator();
  }

  function updateStepIndicator() {
    const dots = document.querySelectorAll('#decoder-step-indicator .step-dot');
    dots.forEach(d => {
      const stepNum = parseInt(d.getAttribute('data-step'), 10);
      d.classList.toggle('active', stepNum === currentStep);
    });
  }

  function updateSectionTabs() {
    const tabs = document.querySelectorAll('.decoder-preset-tab');
    tabs.forEach(t => {
      const sec = t.getAttribute('data-section');
      t.classList.toggle('active', sec === currentSectionId);
    });

    const secInfo = SECTIONS.find(s => s.id === currentSectionId);
    if (secInfo) {
      const badge = document.getElementById('decoder-rule-badge');
      const desc = document.getElementById('decoder-rule-desc');
      if (badge) badge.textContent = secInfo.badge;
      if (desc) desc.textContent = secInfo.desc;
    }
  }

  function renderExampleChips() {
    const chipsWrap = document.getElementById('decoder-examples-chips');
    const labelEl = document.getElementById('decoder-ex-label');
    if (!chipsWrap) return;

    const secWords = sectionMap[currentSectionId] || [];
    if (labelEl) labelEl.textContent = `คำตัวอย่าง (${secWords.length} คำ):`;

    chipsWrap.innerHTML = secWords.map((item, idx) => `
      <button type="button" class="decoder-chip touch-target ${idx === currentWordIndex ? 'active' : ''}"
              onclick="window.ThaiSpellingDecoder.selectWord(${idx})">
        ${item.word}
      </button>
    `).join('');

    const activeChip = chipsWrap.querySelector('.decoder-chip.active');
    if (activeChip && typeof activeChip.scrollIntoView === 'function') {
      try {
        activeChip.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
      } catch (_) {}
    }
  }

  // ─── 7. Public API ─────────────────────────────────────────────
  window.ThaiSpellingDecoder = {
    setData(data) {
      const words = Array.isArray(data) ? data : (data && data.words ? data.words : []);
      setDataset(words);
    },

    getCurrentWord() {
      const secWords = sectionMap[currentSectionId] || [];
      return secWords[currentWordIndex] || null;
    },

    getCurrentStep() {
      return currentStep;
    },

    getCurrentSection() {
      return currentSectionId;
    },

    getSections() {
      return SECTIONS;
    },

    getWords(sectionId) {
      return sectionId ? (sectionMap[sectionId] || []) : wordsData;
    },

    getWordData(word) {
      if (!word) return null;
      const clean = typeof word === 'string' ? word.trim() : word;
      return wordsMap.get(clean) || wordsData.find(w => w.word === clean) || null;
    },

    isDecoderWord(word) {
      if (!word) return false;
      const clean = typeof word === 'string' ? word.trim() : word;
      return wordsMap.has(clean) || wordsData.some(w => w.word === clean);
    },

    loadData() {
      return loadData();
    },

    async open(wordOrIndex) {
      ensureModal();
      const modal = document.getElementById('modal-spelling-decoder');
      if (modal) modal.style.display = 'flex';

      if (wordsData.length === 0) {
        await loadData();
      }

      if (typeof wordOrIndex === 'string') {
        const clean = wordOrIndex.trim();
        let found = wordsMap.get(clean) || wordsData.find(w => w.word === clean);
        if (!found && typeof window !== 'undefined') {
          let fullItem = null;
          if (Array.isArray(window.fullCategoryWords)) {
            fullItem = window.fullCategoryWords.find(w => w && w.word === clean);
          }
          if (!fullItem && Array.isArray(window.categoryWords)) {
            fullItem = window.categoryWords.find(w => w && w.word === clean);
          }
          if (!fullItem && window.ALL_WORDS) {
            for (const slug in window.ALL_WORDS) {
              const match = (window.ALL_WORDS[slug] || []).find(w => w && w.word === clean);
              if (match) { fullItem = match; break; }
            }
          }

          if (fullItem && typeof window.getWordIrregularSpelling === 'function') {
            const info = window.getWordIrregularSpelling(fullItem);
            if (info) {
              found = {
                word: clean,
                reading: fullItem.reading || info.reading || clean,
                targetSection: info.targetSection || 'kod',
                sectionName: info.sectionName || 'แม่กด',
                surfaceConsonant: info.surfaceConsonant || '',
                soundConsonant: info.soundConsonant || 'ด',
                phonicsDecomposition: {
                  initial: '',
                  initialName: '',
                  vowel: '',
                  vowelName: '',
                  finalSurface: info.surfaceConsonant || '',
                  finalSound: info.soundConsonant || 'ด',
                  phonicsSpelling: `${clean} อ่านว่า ${fullItem.reading || info.reading || clean}`
                },
                meaning: fullItem.meaning || '',
                emoji: fullItem.emoji || '📝'
              };
              wordsData.push(found);
              wordsMap.set(clean, found);
              if (sectionMap[found.targetSection]) {
                sectionMap[found.targetSection].push(found);
              }
            }
          }
        }
        if (found) {
          currentSectionId = found.targetSection;
          const secWords = sectionMap[currentSectionId] || [];
          const idx = secWords.findIndex(w => w.word === clean);
          currentWordIndex = idx >= 0 ? idx : 0;
        }
      } else if (typeof wordOrIndex === 'number') {
        currentWordIndex = wordOrIndex;
      }

      currentStep = 1;
      updateSectionTabs();
      renderExampleChips();
      renderStage();
    },

    close() {
      const modal = document.getElementById('modal-spelling-decoder');
      if (modal) modal.style.display = 'none';
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    },

    nextStep() {
      const secWords = sectionMap[currentSectionId] || [];
      if (secWords.length === 0) return;

      if (currentStep === 1) {
        currentStep = 2;
        decoderAudio.playScan();
        renderStage();
      } else if (currentStep === 2) {
        currentStep = 3;
        decoderAudio.playMagicSparkle();
        renderStage();
        const curWord = this.getCurrentWord();
        if (curWord && curWord.phonicsDecomposition) {
          speakPhonics(curWord.phonicsDecomposition.phonicsSpelling);
        }
      } else {
        currentWordIndex = (currentWordIndex + 1) % secWords.length;
        currentStep = 1;
        decoderAudio.playWhoosh();
        renderExampleChips();
        renderStage();
      }
      updateStepIndicator();
    },

    prevStep() {
      if (currentStep > 1) {
        currentStep--;
        decoderAudio.playWhoosh();
        renderStage();
        updateStepIndicator();
      }
    },

    reset() {
      currentStep = 1;
      decoderAudio.playWhoosh();
      renderStage();
      updateStepIndicator();
    },

    selectSection(sectionId) {
      if (sectionMap[sectionId]) {
        currentSectionId = sectionId;
        currentWordIndex = 0;
        currentStep = 1;
        decoderAudio.playWhoosh();
        updateSectionTabs();
        renderExampleChips();
        renderStage();
        updateStepIndicator();
      }
    },

    selectWord(index) {
      const secWords = sectionMap[currentSectionId] || [];
      if (index >= 0 && index < secWords.length) {
        currentWordIndex = index;
        currentStep = 1;
        decoderAudio.playWhoosh();
        renderExampleChips();
        renderStage();
        updateStepIndicator();
      }
    },

    speakPhonics() {
      const curWord = this.getCurrentWord();
      if (curWord && curWord.phonicsDecomposition) {
        speakPhonics(curWord.phonicsDecomposition.phonicsSpelling);
      }
    }
  };

  // Kick off data loading immediately on script execution
  loadData();
})();
