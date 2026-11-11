/* reading-trainer.js — นวัตกรรมสื่อการสอนฝึกอ่านคำยากและคำราชาศัพท์ (Thai Reading Studio Theater)
   สไตล์ PowerPoint Morph / Syllable Breakdown 60 FPS แยกพยางค์สีลูกกวาด และเสียงสังเคราะห์ประกอบ */

(function () {
  'use strict';

  // ─── 1. Web Audio API Magic Sounds ──────────────────────────────
  class ReadingAudio {
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

    // เสียงบล็อกพยางค์ดีดตัว (Pop-in Chime)
    playPop() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        const now = this.ctx.currentTime;
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(780, now + 0.12);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.14);
      } catch (_) {}
    }

    // เสียงเฉลยความหมายและบริบท (Harmonic Sparkle)
    playChime() {
      if (!this.enabled) return;
      try {
        this.init();
        if (!this.ctx) return;
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        freqs.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'triangle';
          const startTime = this.ctx.currentTime + idx * 0.05;
          osc.frequency.setValueAtTime(freq, startTime);
          gain.gain.setValueAtTime(0.18, startTime);
          gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.32);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(startTime);
          osc.stop(startTime + 0.32);
        });
      } catch (_) {}
    }
  }

  const audio = new ReadingAudio();

  // ─── 2. Speech Synthesis สำหรับอ่านออกเสียงภาษาไทย ─────────────────
  function speakThai(text, rate = 0.85) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'th-TH';
      utterance.rate = rate; // จังหวะชัดถ้อยชัดคำสำหรับเด็กประถม
      window.speechSynthesis.speak(utterance);
    }
  }

  // ─── 3. State Management ─────────────────────────────────────────
  let allWords = [];
  let playlist = [];
  let currentIndex = 0;
  let currentStep = 1; // 1: คำเต็ม, 2: ก้อนพยางค์คำอ่าน, 3: ความหมายและบริบท
  let currentFilter = 'all'; // 'all' | 'difficult' | 'royal'
  let isInitialized = false;

  const CANDY_COLORS = [
    { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' }, // ฟ้าคราม
    { bg: '#fce7f3', text: '#be185d', border: '#fbcfe8' }, // ชมพูหวาน
    { bg: '#fef3c7', text: '#b45309', border: '#fde68a' }, // ส้มทอง
    { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' }, // เขียวมิ้นต์
    { bg: '#ede9fe', text: '#6d28d9', border: '#ddd6fe' }, // ม่วงพาสเทล
    { bg: '#ffedd5', text: '#c2410c', border: '#fed7aa' }, // ส้มโอรส
  ];

  function loadDataset() {
    if (allWords.length > 0) return;
    if (window.GAME_DATA && window.GAME_DATA.words) {
      if (window.GAME_DATA.words['reading-studio']) {
        allWords = window.GAME_DATA.words['reading-studio'];
      } else {
        const diff = (window.GAME_DATA.words['difficult'] || []).slice(0, 100).map(w => ({ ...w, sub_category: 'difficult' }));
        const royal = (window.GAME_DATA.words['royal'] || []).slice(0, 100).map(w => ({ ...w, sub_category: 'royal' }));
        allWords = [...diff, ...royal];
      }
    }
  }

  function applyFilter(filterName) {
    currentFilter = filterName;
    if (filterName === 'difficult') {
      playlist = allWords.filter(w => w.sub_category === 'difficult');
    } else if (filterName === 'royal') {
      playlist = allWords.filter(w => w.sub_category === 'royal');
    } else {
      playlist = [...allWords];
    }
    if (currentIndex >= playlist.length) currentIndex = 0;
  }

  function parseSyllables(readingStr) {
    if (!readingStr) return [];
    const clean = readingStr.replace(/[\[\]]/g, '').trim();
    if (clean.includes('-')) {
      return clean.split('-').map(s => s.trim()).filter(Boolean);
    }
    return [clean];
  }

  // ─── 4. UI Builder: สร้างหน้าต่างโรงละคร (Reading Theater Modal) ─
  function ensureModal() {
    let modal = document.getElementById('tvh-reading-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'tvh-reading-modal';
      modal.className = 'tvh-modal-backdrop reading-theater-backdrop';
      modal.innerHTML = `
        <div class="tvh-modal-card reading-theater-card" role="dialog" aria-modal="true" aria-labelledby="reading-theater-title">
          {/* Header */}
          <div class="reading-theater-header">
            <div class="reading-header-left">
              <span class="reading-pill-badge">นวัตกรรมสื่อการสอน</span>
              <h2 id="reading-theater-title" class="reading-title">📖 โรงละครฝึกอ่านคำยากและคำราชาศัพท์</h2>
            </div>
            <div class="reading-header-right">
              <button type="button" class="btn-reading-tool" id="btn-reading-audio-toggle" title="เปิด/ปิดเสียง">🔊 เสียง</button>
              <button type="button" class="tvh-modal-close" onclick="window.ThaiReadingTrainer.close()">×</button>
            </div>
          </div>

          {/* Filter Bar Tabs */}
          <div class="reading-filter-bar" role="tablist" aria-label="กรองประเภทคำศัพท์">
            <button type="button" class="reading-filter-tab active" data-filter="all" onclick="window.ThaiReadingTrainer.setFilter('all')">
              📚 ทั้งหมด (๒๐๐)
            </button>
            <button type="button" class="reading-filter-tab" data-filter="difficult" onclick="window.ThaiReadingTrainer.setFilter('difficult')">
              ✍️ คำยากชวนฝึก (๑๐๐)
            </button>
            <button type="button" class="reading-filter-tab" data-filter="royal" onclick="window.ThaiReadingTrainer.setFilter('royal')">
              👑 คำราชาศัพท์ (๑๐๐)
            </button>
          </div>

          {/* Category Banner */}
          <div class="reading-rule-banner">
            <div class="reading-rule-badge" id="reading-rule-badge">คำยาก ป.๕</div>
            <div class="reading-rule-desc" id="reading-rule-desc">
              กด Spacebar หรือคลิกเพื่อแจกพยางค์สะกดอ่านทีละคำ
            </div>
          </div>

          {/* ═══ THEATER STAGE (จอใหญ่ 120px+) ═══ */}
          <div class="reading-stage-wrapper">
            <div class="reading-stage-screen" id="reading-stage-screen">
              {/* Animated Content Injected Here */}
            </div>

            {/* Syllable Reading Equation Subtitle */}
            <div class="reading-equation-box" id="reading-equation-box">
              <span id="reading-eq-text" class="reading-eq-text">คำอ่าน: อะ - ทิด - ถาน</span>
              <button type="button" class="btn-reading-voice-pill" onclick="window.ThaiReadingTrainer.speakCurrent()">
                🔊 ฟังเสียงอ่าน
              </button>
            </div>
          </div>

          {/* Quick Word Jumper Chips */}
          <div class="reading-examples-row">
            <span class="reading-ex-label">เลือกคำฝึก:</span>
            <div id="reading-words-chips" class="reading-examples-chips"></div>
          </div>

          {/* Controls Footer */}
          <div class="reading-theater-footer">
            <div class="reading-step-indicator" id="reading-step-indicator">
              <span class="step-dot active">1. คำเต็ม</span>
              <span class="step-arrow">➔</span>
              <span class="step-dot">2. แจกพยางค์</span>
              <span class="step-arrow">➔</span>
              <span class="step-dot">3. ความหมายและบริบท ✨</span>
            </div>

            <div class="reading-footer-actions">
              <button type="button" class="cbtn" onclick="window.ThaiReadingTrainer.prevStep()">◀ ย้อนกลับ</button>
              <button type="button" class="btn btn-primary btn-reading-next" id="btn-reading-next" onclick="window.ThaiReadingTrainer.nextStep()">
                แจกพยางค์คำอ่าน ➔ (Spacebar)
              </button>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Sound toggle listener
      const audioBtn = document.getElementById('btn-reading-audio-toggle');
      if (audioBtn) {
        audioBtn.addEventListener('click', () => {
          audio.enabled = !audio.enabled;
          audioBtn.textContent = audio.enabled ? '🔊 เสียง' : '🔇 ปิดเสียง';
        });
      }

      // Keyboard navigation
      window.addEventListener('keydown', (e) => {
        if (modal.style.display !== 'flex') return;
        if (e.code === 'Space' || e.key === ' ' || e.key === 'ArrowRight') {
          e.preventDefault();
          window.ThaiReadingTrainer.nextStep();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          window.ThaiReadingTrainer.prevStep();
        } else if (e.key === 'Escape') {
          window.ThaiReadingTrainer.close();
        }
      });
    }
  }

  // ─── 5. Stage Renderer (เรนเดอร์เนื้อหาตาม Step 1, 2, 3) ─────────
  function renderStage() {
    const stage = document.getElementById('reading-stage-screen');
    const eqBox = document.getElementById('reading-eq-text');
    const stepInd = document.getElementById('reading-step-indicator');
    const badgeEl = document.getElementById('reading-rule-badge');
    const descEl = document.getElementById('reading-rule-desc');
    const nextBtn = document.getElementById('btn-reading-next');
    if (!stage || playlist.length === 0) return;

    const item = playlist[currentIndex] || playlist[0];
    const syllables = parseSyllables(item.reading);
    const isRoyal = item.sub_category === 'royal';

    // Update banner info
    if (badgeEl) {
      badgeEl.textContent = isRoyal ? '👑 คำราชาศัพท์' : `✍️ ${item.grade || 'คำยาก'}`;
      badgeEl.className = 'reading-rule-badge ' + (isRoyal ? 'badge-royal' : 'badge-diff');
    }
    if (descEl) {
      descEl.textContent = isRoyal ? 'คำราชาศัพท์น่ารู้พร้อมความหมายและคำแปลสามัญ' : 'ฝึกอ่านออกเสียงคำยากและทำความเข้าใจความหมาย';
    }

    // Update Step Indicators
    if (stepInd) {
      const dots = stepInd.querySelectorAll('.step-dot');
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentStep - 1);
      });
    }

    // Update Next Button label
    if (nextBtn) {
      if (currentStep === 1) nextBtn.innerHTML = 'แจกพยางค์คำอ่าน ➔ (Spacebar)';
      else if (currentStep === 2) nextBtn.innerHTML = 'ดูความหมายและบริบท ✨ (Spacebar)';
      else nextBtn.innerHTML = 'คำถัดไป ▶ (Spacebar)';
    }

    // Subtitle equation
    if (eqBox) {
      eqBox.innerHTML = `<strong>${item.word}</strong> อ่านว่า <span>[ ${syllables.join(' - ')} ]</span>`;
    }

    // ═══ STEP 1: คำเต็ม (Full Word in Huge Font) ═══
    if (currentStep === 1) {
      stage.innerHTML = `
        <div class="reading-fullword-wrap animate-pop-in">
          <span class="reading-word-emoji">${item.emoji || (isRoyal ? '👑' : '📝')}</span>
          <h1 class="reading-word-full">${item.word}</h1>
          <div class="reading-hint-step">แตะ Spacebar เพื่อแยกพยางค์คำอ่าน</div>
        </div>
      `;
    }

    // ═══ STEP 2: แจกพยางค์ลูกกวาด (Syllable Candy Chips) ═══
    else if (currentStep === 2) {
      audio.playPop();
      stage.innerHTML = `
        <div class="reading-syllables-wrap">
          <div class="reading-word-header-sub">${item.word}</div>
          <div class="syllable-chips-group">
            ${syllables.map((syl, i) => {
              const pal = CANDY_COLORS[i % CANDY_COLORS.length];
              return `
                <button type="button" class="syllable-chip animate-syllable-pop"
                        style="background:${pal.bg}; color:${pal.text}; border-color:${pal.border}; animation-delay:${i * 0.08}s;"
                        onclick="window.ThaiReadingTrainer.speakSyllable('${syl}')"
                        title="คลิกเพื่อฟังเสียงพยางค์ [${syl}]"
                        aria-label="พยางค์ที่ ${i + 1}: ${syl}">
                  <span class="chip-syllable-num">${i + 1}</span>
                  <span class="chip-syllable-text">${syl}</span>
                  <span class="chip-voice-icon">🔊</span>
                </button>
              `;
            }).join('')}
          </div>
          <div class="reading-hint-step">แตะแต่ละก้อนพยางค์เพื่อฟังเสียงอ่านซ้ำได้</div>
        </div>
      `;
      // Speak the whole word upon entering step 2
      speakThai(item.word);
    }

    // ═══ STEP 3: ความหมาย บริบทประโยค และภาพประกอบ ═══
    else if (currentStep === 3) {
      audio.playChime();
      const imgHtml = item.image_url ? `
        <div class="reading-media-col">
          <img src="${item.image_url}" alt="${item.image_alt || item.word}" class="reading-img-thumb" onerror="this.style.display='none'">
        </div>
      ` : `
        <div class="reading-media-col emoji-only">
          <span class="reading-big-emoji">${item.emoji || (isRoyal ? '👑' : '📖')}</span>
        </div>
      `;

      stage.innerHTML = `
        <div class="reading-resolution-card animate-slide-up">
          ${imgHtml}
          <div class="reading-info-col">
            <div class="reading-res-header">
              <span class="res-word">${item.word}</span>
              <span class="res-reading">[ ${syllables.join(' - ')} ]</span>
              <span class="res-pos">(${item.pos || 'คำศัพท์'})</span>
            </div>
            <div class="res-meaning-box">
              <div class="res-meaning-label">ความหมาย:</div>
              <div class="res-meaning-text">${item.meaning}</div>
            </div>
            ${item.example ? `
              <div class="res-example-box">
                <span class="res-example-label">ตัวอย่างประโยค:</span>
                <span class="res-example-text">“${item.example}”</span>
              </div>
            ` : ''}
          </div>
        </div>
      `;
      // Speak the whole word with meaning
      speakThai(`${item.word} อ่านว่า ${syllables.join(' ')} หมายถึง ${item.meaning}`);
    }
  }

  // ─── 6. Render Quick Word Jumper Chips ───────────────────────────
  function renderWordChips() {
    const wrap = document.getElementById('reading-words-chips');
    if (!wrap) return;
    wrap.innerHTML = playlist.map((w, idx) => `
      <button type="button" class="reading-chip ${idx === currentIndex ? 'active' : ''}"
              onclick="window.ThaiReadingTrainer.selectWord(${idx})">
        ${w.word}
      </button>
    `).join('');

    // Auto scroll active chip into view
    const activeChip = wrap.querySelector('.reading-chip.active');
    if (activeChip) {
      activeChip.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }

  // ─── 7. Public API ──────────────────────────────────────────────
  window.ThaiReadingTrainer = {
    open(targetWord, targetFilter) {
      loadDataset();
      ensureModal();
      const modal = document.getElementById('tvh-reading-modal');
      if (modal) modal.style.display = 'flex';

      if (targetFilter) {
        applyFilter(targetFilter);
      } else {
        applyFilter(currentFilter);
      }

      if (targetWord) {
        // Find if in current playlist, else check all
        let idx = playlist.findIndex(w => w.word === targetWord);
        if (idx === -1) {
          const found = allWords.find(w => w.word === targetWord);
          if (found && found.sub_category) {
            applyFilter(found.sub_category);
            idx = playlist.findIndex(w => w.word === targetWord);
          }
        }
        if (idx >= 0) currentIndex = idx;
      }

      this.updateTabs();
      this.resetStep();
    },

    close() {
      const modal = document.getElementById('tvh-reading-modal');
      if (modal) modal.style.display = 'none';
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    },

    setFilter(filterName) {
      applyFilter(filterName);
      currentIndex = 0;
      this.updateTabs();
      this.resetStep();
    },

    selectWord(idx) {
      if (idx >= 0 && idx < playlist.length) {
        currentIndex = idx;
        renderWordChips();
        this.resetStep();
      }
    },

    updateTabs() {
      const tabs = document.querySelectorAll('.reading-filter-tab');
      tabs.forEach(t => {
        t.classList.toggle('active', t.getAttribute('data-filter') === currentFilter);
      });
      renderWordChips();
    },

    nextStep() {
      if (currentStep < 3) {
        currentStep++;
        renderStage();
      } else {
        // Advance to next word
        if (playlist.length > 0) {
          currentIndex = (currentIndex + 1) % playlist.length;
          renderWordChips();
          this.resetStep();
        }
      }
    },

    prevStep() {
      if (currentStep > 1) {
        currentStep--;
        renderStage();
      } else if (currentIndex > 0) {
        currentIndex--;
        renderWordChips();
        this.resetStep();
      }
    },

    resetStep() {
      currentStep = 1;
      renderStage();
    },

    speakCurrent() {
      if (playlist.length === 0) return;
      const item = playlist[currentIndex];
      const syllables = parseSyllables(item.reading);
      speakThai(`${item.word} อ่านว่า ${syllables.join(' ')}`);
    },

    speakSyllable(syl) {
      speakThai(syl, 0.8);
    },

    isReadingWord(wordStr) {
      if (!wordStr) return false;
      loadDataset();
      const clean = wordStr.trim();
      return allWords.some(w => w.word === clean);
    },
  };
})();
