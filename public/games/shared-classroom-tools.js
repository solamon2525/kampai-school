/**
 * shared-classroom-tools.js
 * Reusable Classroom Tools Runtime for Kampai Educational Games
 *
 * Features:
 * 1. Projector Mode (Big screen presentation, high contrast, floating toolbar: Next, Prev, Flip, Speak, Exit)
 * 2. HTML5 Canvas 10-Item Wheel Randomizer (Physics easing, rerollWheel, celebratory winner pop)
 * 3. Team Battle Hotseat & Buzzer Mode (Red vs Blue buzzers, A/L shortcuts, auto-pass on wrong answer, zero confirm)
 * 4. Self-contained Canvas Confetti Generator
 */

(function initKampaiClassroomTools() {
  'use strict';

  const rAF = (typeof window !== 'undefined' && window.requestAnimationFrame)
    ? window.requestAnimationFrame.bind(window)
    : (fn) => setTimeout(fn, 16);

  const cAF = (typeof window !== 'undefined' && window.cancelAnimationFrame)
    ? window.cancelAnimationFrame.bind(window)
    : (id) => clearTimeout(id);

  // Inject shared styles if not already present
  function ensureStyles() {
    if (document.getElementById('kampai-classroom-styles')) return;
    const style = document.createElement('style');
    style.id = 'kampai-classroom-styles';
    style.textContent = `
      :root {
        --kp-bg: #f8fafc;
        --kp-card: #ffffff;
        --kp-text: #0f172a;
        --kp-muted: #64748b;
        --kp-border: #cbd5e1;
        --kp-primary: #0284c7;
        --kp-primary-hover: #0369a1;
        --kp-red: #ef4444;
        --kp-red-light: #fee2e2;
        --kp-blue: #3b82f6;
        --kp-blue-light: #dbeafe;
        --kp-gold: #f59e0b;
        --kp-radius: 12px;
      }

      /* Projector Mode global overrides */
      body.kampai-projector-mode {
        font-size: 1.25rem !important;
      }
      body.kampai-projector-mode .kp-hide-on-projector {
        display: none !important;
      }

      /* Floating Projector Toolbar */
      #kampai-projector-bar {
        position: fixed;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 99999;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: var(--kp-card);
        color: var(--kp-text);
        border: 2px solid var(--kp-primary);
        border-radius: 9999px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25);
        font-family: Sarabun, ui-sans-serif, system-ui, sans-serif;
        user-select: none;
      }

      .kampai-projector-btn {
        min-width: 44px;
        min-height: 44px;
        padding: 6px 14px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        background: var(--kp-bg);
        color: var(--kp-text);
        border: 1px solid var(--kp-border);
        border-radius: 9999px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: background 0.15s ease, transform 0.1s ease;
      }
      .kampai-projector-btn:hover {
        background: var(--kp-border);
        transform: translateY(-1px);
      }
      .kampai-projector-btn:active {
        transform: translateY(1px);
      }
      .kampai-projector-btn:focus-visible {
        outline: 3px solid var(--kp-primary);
        outline-offset: 2px;
      }
      .kampai-projector-btn.danger {
        color: var(--kp-red);
        border-color: var(--kp-red-light);
      }
      .kampai-projector-btn.danger:hover {
        background: var(--kp-red-light);
      }

      /* Modal Overlay Base */
      .kampai-modal-overlay {
        position: fixed;
        inset: 0;
        z-index: 100000;
        background: rgba(15, 23, 42, 0.65);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
        font-family: Sarabun, ui-sans-serif, system-ui, sans-serif;
      }

      .kampai-modal-card {
        background: var(--kp-card);
        color: var(--kp-text);
        border-radius: var(--kp-radius);
        border: 1px solid var(--kp-border);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.2);
        max-width: 560px;
        width: 100%;
        max-height: 90vh;
        overflow-y: auto;
        position: relative;
        padding: 24px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
      }

      .kampai-close-btn {
        position: absolute;
        top: 12px;
        right: 12px;
        min-width: 44px;
        min-height: 44px;
        border: none;
        background: transparent;
        color: var(--kp-muted);
        font-size: 24px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
      }
      .kampai-close-btn:hover {
        background: var(--kp-bg);
        color: var(--kp-text);
      }
      .kampai-close-btn:focus-visible {
        outline: 3px solid var(--kp-primary);
      }

      /* Wheel Randomizer Modal */
      #kampai-wheel-canvas {
        max-width: 320px;
        max-height: 320px;
        width: 100%;
        height: auto;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        margin: 16px 0;
      }
      .kp-wheel-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        justify-content: center;
        margin-top: 4px;
      }
      #kampai-wheel-spin-btn {
        min-width: 160px;
        min-height: 48px;
        padding: 10px 24px;
        font-size: 18px;
        font-weight: bold;
        background: var(--kp-gold);
        color: #78350f;
        border: 2px solid #b45309;
        border-radius: 9999px;
        cursor: pointer;
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
        transition: transform 0.1s ease, filter 0.15s ease;
      }
      #kampai-wheel-spin-btn:hover {
        filter: brightness(1.05);
        transform: scale(1.02);
      }
      #kampai-wheel-spin-btn:active {
        transform: scale(0.98);
      }
      #kampai-wheel-spin-btn:focus-visible {
        outline: 3px solid #b45309;
        outline-offset: 2px;
      }

      /* Team Battle Hotseat + Buzzer Modal */
      .kp-battle-teams {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
        width: 100%;
        margin: 16px 0 12px 0;
      }
      .kp-team-card {
        padding: 14px;
        border-radius: var(--kp-radius);
        border: 2px solid var(--kp-border);
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .kp-team-card.red {
        background: var(--kp-red-light);
        border-color: var(--kp-red);
      }
      .kp-team-card.blue {
        background: var(--kp-blue-light);
        border-color: var(--kp-blue);
      }
      .team-buzzer-btn {
        width: 100%;
        min-height: 44px;
        padding: 8px 12px;
        border-radius: 10px;
        border: 2px solid transparent;
        background: rgba(255, 255, 255, 0.85);
        color: var(--kp-text);
        font-weight: 800;
        font-size: 15px;
        cursor: pointer;
        margin-bottom: 6px;
        transition: transform 0.1s ease, box-shadow 0.15s ease;
      }
      .team-buzzer-btn.red {
        border-color: var(--kp-red);
        color: #991b1b;
      }
      .team-buzzer-btn.blue {
        border-color: var(--kp-blue);
        color: #1e40af;
      }
      .team-buzzer-btn.is-buzzed.red {
        background: var(--kp-red);
        color: #ffffff;
        box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.35);
      }
      .team-buzzer-btn.is-buzzed.blue {
        background: var(--kp-blue);
        color: #ffffff;
        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.35);
      }
      .kp-team-score {
        font-size: 52px;
        font-weight: 800;
        line-height: 1;
        margin: 6px 0 12px 0;
        font-variant-numeric: tabular-nums;
      }
      .kp-team-card.red .kp-team-score { color: #b91c1c; }
      .kp-team-card.blue .kp-team-score { color: #1d4ed8; }

      .kp-team-btns {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
        width: 100%;
      }
      .kp-score-btn {
        min-width: 44px;
        min-height: 44px;
        padding: 6px 12px;
        border-radius: 8px;
        font-weight: 700;
        font-size: 16px;
        cursor: pointer;
        border: 1px solid transparent;
        transition: transform 0.1s ease;
      }
      .kp-score-btn:active {
        transform: scale(0.95);
      }
      .kp-score-btn:focus-visible {
        outline: 3px solid currentColor;
      }
      .kp-score-btn.red {
        background: #ef4444;
        color: #ffffff;
      }
      .kp-score-btn.red:hover { background: #dc2626; }
      .kp-score-btn.blue {
        background: #3b82f6;
        color: #ffffff;
      }
      .kp-score-btn.blue:hover { background: #2563eb; }
      .kp-score-btn.sub {
        background: var(--kp-card);
        color: var(--kp-text);
        border-color: var(--kp-border);
      }

      .battle-buzzer-status {
        width: 100%;
        padding: 10px 14px;
        border-radius: 10px;
        background: var(--kp-bg);
        border: 1px solid var(--kp-border);
        font-weight: 700;
        font-size: 15px;
        margin-bottom: 10px;
      }
      .battle-buzzer-status.is-red {
        background: var(--kp-red-light);
        border-color: var(--kp-red);
        color: #991b1b;
      }
      .battle-buzzer-status.is-blue {
        background: var(--kp-blue-light);
        border-color: var(--kp-blue);
        color: #1e40af;
      }
      .battle-question-area {
        width: 100%;
        display: flex;
        flex-direction: column;
        gap: 10px;
        padding: 14px;
        border-radius: var(--kp-radius);
        background: var(--kp-bg);
        border: 1px solid var(--kp-border);
        margin-bottom: 12px;
      }
      .battle-q-badge {
        font-size: 13px;
        font-weight: 700;
        color: var(--kp-muted);
      }
      .battle-q-prompt {
        font-size: 20px;
        font-weight: 800;
        color: var(--kp-text);
      }
      .battle-options-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
      .battle-choice-btn {
        min-height: 44px;
        padding: 10px 12px;
        border-radius: 10px;
        border: 2px solid var(--kp-border);
        background: var(--kp-card);
        color: var(--kp-text);
        font-weight: 700;
        font-size: 16px;
        cursor: pointer;
      }
      .battle-choice-btn.correct {
        background: #dcfce7;
        border-color: #16a34a;
        color: #166534;
      }
      .battle-choice-btn.wrong {
        background: #fee2e2;
        border-color: #ef4444;
        color: #991b1b;
        opacity: 0.7;
      }
      .battle-winner-card {
        width: 100%;
        padding: 18px;
        border-radius: var(--kp-radius);
        background: #fefce8;
        border: 2px solid var(--kp-gold);
        margin-bottom: 12px;
      }

      /* Confetti Canvas */
      .kampai-confetti-canvas {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 100001;
        width: 100vw;
        height: 100vh;
      }

      @media (prefers-reduced-motion: reduce) {
        .kampai-projector-btn,
        #kampai-wheel-spin-btn,
        .kp-score-btn,
        .team-buzzer-btn {
          transition: none !important;
          transform: none !important;
        }
        .kampai-confetti-canvas {
          display: none !important;
        }
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  // Confetti Particle System
  function launchConfetti(options = {}) {
    ensureStyles();
    const count = options.count || 80;
    const canvas = document.createElement('canvas');
    canvas.className = 'kampai-confetti-canvas';
    canvas.width = window.innerWidth || 800;
    canvas.height = window.innerHeight || 600;
    document.body.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      canvas.remove();
      return;
    }

    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    const particles = [];
    const originX = options.originX !== undefined ? options.originX : canvas.width / 2;
    const originY = options.originY !== undefined ? options.originY : canvas.height / 3;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 8;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 5 + Math.random() * 6,
        alpha: 1,
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2
      });
    }

    let animId = null;
    const startTime = Date.now();

    function render() {
      const elapsed = Date.now() - startTime;
      if (elapsed > 2500 || particles.length === 0) {
        if (animId) cAF(animId);
        canvas.remove();
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25;
        p.vx *= 0.98;
        p.rotation += p.vRot;
        p.alpha = Math.max(0, 1 - elapsed / 2500);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.4);
        ctx.restore();
      }
      animId = rAF(render);
    }

    animId = rAF(render);
  }

  // ==========================================
  // 1. Projector Mode
  // ==========================================
  let isProjector = false;
  let projectorBarEl = null;

  function handleProjectorKeydown(e) {
    if (!isProjector) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      triggerProjectorAction('next');
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      triggerProjectorAction('prev');
    } else if (e.key === ' ' || e.key === 'f' || e.key === 'Enter') {
      e.preventDefault();
      triggerProjectorAction('flip');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      toggleProjector(false);
    }
  }

  function triggerProjectorAction(action) {
    const eventName = `kampai:projector:${action}`;
    const ev = new CustomEvent(eventName, { bubbles: true, cancelable: true });
    window.dispatchEvent(ev);

    if (action === 'speak') {
      const speakTarget = document.querySelector('[data-kampai-speak]') ||
                          document.querySelector('.question-text, #question, .math-card, .prompt-text');
      const textToSpeak = speakTarget ? (speakTarget.getAttribute('data-kampai-speak') || speakTarget.textContent || '').trim() : '';
      if (textToSpeak) {
        if (window.KampaiMediaLab && typeof window.KampaiMediaLab.speakSafe === 'function') {
          window.KampaiMediaLab.speakSafe(textToSpeak, {
            lang: /[a-zA-Z]/.test(textToSpeak) ? 'en-US' : 'th-TH'
          });
        } else if (window.speechSynthesis && typeof window.SpeechSynthesisUtterance === 'function') {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(textToSpeak);
          utterance.lang = /[a-zA-Z]/.test(textToSpeak) ? 'en-US' : 'th-TH';
          window.speechSynthesis.speak(utterance);
        }
      }
    } else if (action === 'exit') {
      toggleProjector(false);
    }
  }

  function createProjectorToolbar() {
    ensureStyles();
    let bar = document.getElementById('kampai-projector-bar');
    if (bar) return bar;

    bar = document.createElement('div');
    bar.id = 'kampai-projector-bar';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'แถบควบคุมโปรเจกเตอร์ห้องเรียน');

    bar.innerHTML = `
      <button type="button" class="kampai-projector-btn" data-action="prev" title="ข้อก่อนหน้า (←)">
        <span>⏮️</span>
        <span>ย้อนกลับ</span>
      </button>
      <button type="button" class="kampai-projector-btn" data-action="flip" title="พลิก/เฉลย (Space)">
        <span>🔄</span>
        <span>เฉลย/พลิก</span>
      </button>
      <button type="button" class="kampai-projector-btn" data-action="speak" title="อ่านออกเสียง">
        <span>🔊</span>
        <span>เสียง</span>
      </button>
      <button type="button" class="kampai-projector-btn" data-action="next" title="ข้อถัดไป (→)">
        <span>⏭️</span>
        <span>ถัดไป</span>
      </button>
      <button type="button" class="kampai-projector-btn danger" data-action="exit" title="ออกจากโหมดโปรเจกเตอร์ (Esc)">
        <span>❌</span>
        <span>ออก</span>
      </button>
    `;

    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');
      if (action) triggerProjectorAction(action);
    });

    document.body.appendChild(bar);
    return bar;
  }

  function toggleProjector(forced) {
    ensureStyles();
    isProjector = (typeof forced === 'boolean') ? forced : !isProjector;

    if (isProjector) {
      document.body.classList.add('kampai-projector-mode');
      if (!projectorBarEl) {
        projectorBarEl = createProjectorToolbar();
      }
      projectorBarEl.style.display = 'flex';
      window.addEventListener('keydown', handleProjectorKeydown);
    } else {
      document.body.classList.remove('kampai-projector-mode');
      if (projectorBarEl) {
        projectorBarEl.style.display = 'none';
      }
      window.removeEventListener('keydown', handleProjectorKeydown);
    }

    window.dispatchEvent(new CustomEvent('kampai:projector:toggle', {
      detail: { active: isProjector }
    }));

    return isProjector;
  }

  // ==========================================
  // 2. HTML5 Canvas 10-Item Wheel Randomizer
  // ==========================================
  let wheelModalEl = null;
  let isSpinning = false;
  let wheelPoolItems = [];
  let wheelItems = [];
  let wheelCurrentAngle = 0;
  let wheelDrawFn = null;

  function sampleWheelItems(pool) {
    const copy = [...pool].sort(() => 0.5 - Math.random());
    return copy.slice(0, Math.min(10, copy.length));
  }

  function openWheel(items, onPick) {
    ensureStyles();
    closeWheel();

    wheelPoolItems = Array.isArray(items) && items.length > 0
      ? [...items]
      : ['เลขที่ 1', 'เลขที่ 2', 'เลขที่ 3', 'เลขที่ 4', 'เลขที่ 5', 'เลขที่ 6', 'เลขที่ 7', 'เลขที่ 8', 'เลขที่ 9', 'เลขที่ 10'];
    wheelItems = wheelPoolItems.length > 10 ? sampleWheelItems(wheelPoolItems) : [...wheelPoolItems];
    wheelCurrentAngle = 0;

    const modal = document.createElement('div');
    modal.id = 'kampai-wheel-modal';
    modal.className = 'kampai-modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = `
      <div class="kampai-modal-card">
        <button type="button" class="kampai-close-btn" data-action="close" aria-label="ปิดหน้าต่าง">✕</button>
        <h2 style="font-size: 22px; font-weight: bold; margin: 0 0 6px 0;">🎯 วงล้อสุ่มผู้โชคดี / คำถาม</h2>
        <p style="color: var(--kp-muted); margin: 0 0 12px 0; font-size: 14px;">หมุนเพื่อเลือกตัวแทนนักเรียนหรือเลือกโจทย์ข้อถัดไป</p>

        <div style="position: relative; display: inline-block;">
          <div style="position: absolute; top: 6px; left: 50%; transform: translateX(-50%); z-index: 10; font-size: 28px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));">
            🔻
          </div>
          <canvas id="kampai-wheel-canvas" width="360" height="360"></canvas>
        </div>

        <div id="kampai-wheel-result" style="font-size: 20px; font-weight: bold; min-height: 32px; color: var(--kp-primary); margin: 8px 0;"></div>

        <div class="kp-wheel-actions">
          <button type="button" class="kampai-projector-btn" id="kampai-wheel-reroll-btn" data-action="reroll">
            🔄 สุ่มชุดใหม่
          </button>
          <button type="button" id="kampai-wheel-spin-btn" data-action="spin">
            🎲 หมุนวงล้อ!
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    wheelModalEl = modal;

    const canvas = modal.querySelector('#kampai-wheel-canvas');
    const ctx = canvas.getContext('2d');
    const resultEl = modal.querySelector('#kampai-wheel-result');
    const spinBtn = modal.querySelector('#kampai-wheel-spin-btn');
    const rerollBtn = modal.querySelector('#kampai-wheel-reroll-btn');
    const closeBtn = modal.querySelector('[data-action="close"]');

    closeBtn.addEventListener('click', closeWheel);

    const sliceColors = [
      '#f87171', '#fb923c', '#fbbf24', '#a3e635', '#34d399',
      '#22d3ee', '#60a5fa', '#818cf8', '#c084fc', '#f472b6'
    ];

    function drawWheel() {
      if (!ctx || !wheelItems.length) return;
      const sliceCount = wheelItems.length;
      const arc = (Math.PI * 2) / sliceCount;
      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const radius = cx - 10;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < sliceCount; i++) {
        const item = wheelItems[i];
        const label = typeof item === 'object' ? (item.label || item.text || String(i + 1)) : String(item);
        const startAngle = wheelCurrentAngle + i * arc;
        const endAngle = startAngle + arc;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, radius, startAngle, endAngle);
        ctx.fillStyle = sliceColors[i % sliceColors.length];
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.stroke();

        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(startAngle + arc / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 15px Sarabun, sans-serif';
        ctx.fillText(label, radius - 20, 5);
        ctx.restore();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#0f172a';
      ctx.stroke();
    }

    wheelDrawFn = drawWheel;
    drawWheel();

    function spin() {
      if (isSpinning || !wheelItems.length) return;
      isSpinning = true;
      spinBtn.disabled = true;
      resultEl.textContent = 'กำลังสุ่ม...';

      const sliceCount = wheelItems.length;
      const arc = (Math.PI * 2) / sliceCount;
      const winnerIndex = Math.floor(Math.random() * sliceCount);
      const winnerItem = wheelItems[winnerIndex];
      const winnerLabel = typeof winnerItem === 'object' ? (winnerItem.label || winnerItem.text || String(winnerIndex + 1)) : String(winnerItem);

      const targetOffset = (3 * Math.PI / 2) - (winnerIndex * arc + arc / 2);
      const extraRounds = (4 + Math.floor(Math.random() * 3)) * Math.PI * 2;
      const totalRotation = extraRounds + (targetOffset - (wheelCurrentAngle % (Math.PI * 2)));

      const duration = 3500;
      const startRot = wheelCurrentAngle;
      const startTime = Date.now();

      function animate() {
        const now = Date.now();
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const ease = 1 - Math.pow(1 - progress, 3);
        wheelCurrentAngle = startRot + totalRotation * ease;
        drawWheel();

        if (progress < 1) {
          rAF(animate);
        } else {
          isSpinning = false;
          spinBtn.disabled = false;
          resultEl.textContent = `🎉 ผู้โชคดี: ${winnerLabel}`;
          launchConfetti({ count: 60 });
          if (typeof onPick === 'function') {
            onPick(winnerItem, winnerIndex);
          }
        }
      }

      rAF(animate);
    }

    spinBtn.addEventListener('click', spin);
    rerollBtn.addEventListener('click', rerollWheel);
  }

  function rerollWheel() {
    if (isSpinning || !wheelPoolItems.length) return [];
    wheelItems = sampleWheelItems(wheelPoolItems);
    wheelCurrentAngle = 0;
    if (wheelModalEl) {
      const resultEl = wheelModalEl.querySelector('#kampai-wheel-result');
      if (resultEl) resultEl.textContent = '';
    }
    if (typeof wheelDrawFn === 'function') {
      wheelDrawFn();
    }
    return [...wheelItems];
  }

  function closeWheel() {
    if (wheelModalEl) {
      wheelModalEl.style.display = 'none';
      wheelModalEl.remove();
      wheelModalEl = null;
      wheelDrawFn = null;
      isSpinning = false;
    }
  }

  // ==========================================
  // 3. Team Battle Hotseat + Buzzer Mode
  // ==========================================
  let battleModalEl = null;
  let battleScores = { red: 0, blue: 0 };
  let activeBuzzerTeam = null; // 'red' | 'blue' | null
  let battleLocked = false;
  let battleQuestions = [];
  let battleQuestionIndex = 0;
  let battleWinScore = 50;
  let battlePointsPerQuestion = 10;
  let battleOnScore = null;
  let battleTimerId = null;

  function updateBattleScoreDisplay() {
    if (!battleModalEl) return;
    const redEl = battleModalEl.querySelector('#kampai-score-red');
    const blueEl = battleModalEl.querySelector('#kampai-score-blue');
    if (redEl) redEl.textContent = String(battleScores.red);
    if (blueEl) blueEl.textContent = String(battleScores.blue);

    if (typeof battleOnScore === 'function') {
      battleOnScore({ ...battleScores });
    }

    window.dispatchEvent(new CustomEvent('kampai:battle:score', {
      detail: { ...battleScores }
    }));
  }

  function buzzTeam(team) {
    if (battleLocked || !battleModalEl) return null;
    if (team !== 'red' && team !== 'blue') return null;

    activeBuzzerTeam = team;
    const redBtn = battleModalEl.querySelector('#buzzer-red-btn');
    const blueBtn = battleModalEl.querySelector('#buzzer-blue-btn');
    const statusEl = battleModalEl.querySelector('#battle-buzzer-status');

    if (redBtn) redBtn.classList.toggle('is-buzzed', team === 'red');
    if (blueBtn) blueBtn.classList.toggle('is-buzzed', team === 'blue');
    if (statusEl) {
      statusEl.textContent = team === 'red'
        ? '🔴 ทีมสีแดงกดบัซเซอร์ได้สิทธิ์ตอบ!'
        : '🔵 ทีมสีน้ำเงินกดบัซเซอร์ได้สิทธิ์ตอบ!';
      statusEl.className = `battle-buzzer-status is-${team}`;
    }
    return team;
  }

  function finishTeamBattle() {
    if (!battleModalEl) return;
    const qaEl = battleModalEl.querySelector('#battle-qa');
    const winCard = battleModalEl.querySelector('#battle-winner-card');
    const winTitle = battleModalEl.querySelector('#battle-winner-title');
    const winSummary = battleModalEl.querySelector('#battle-winner-summary');

    if (qaEl) qaEl.style.display = 'none';
    if (winCard) winCard.style.display = 'block';

    const winnerText = battleScores.red > battleScores.blue
      ? '🏆 ทีมสีแดงชนะ!'
      : (battleScores.blue > battleScores.red ? '🏆 ทีมสีน้ำเงินชนะ!' : '🤝 เสมอกันอย่างยอดเยี่ยม!');
    if (winTitle) winTitle.textContent = winnerText;
    if (winSummary) winSummary.textContent = `คะแนนสุดท้าย: ทีมแดง ${battleScores.red} - ทีมน้ำเงิน ${battleScores.blue}`;
    launchConfetti({ count: 80 });
  }

  function renderBattleQuestion() {
    if (!battleModalEl) return;
    const qaEl = battleModalEl.querySelector('#battle-qa');
    const winCard = battleModalEl.querySelector('#battle-winner-card');
    const statusEl = battleModalEl.querySelector('#battle-buzzer-status');
    const redBtn = battleModalEl.querySelector('#buzzer-red-btn');
    const blueBtn = battleModalEl.querySelector('#buzzer-blue-btn');

    activeBuzzerTeam = null;
    battleLocked = false;
    if (redBtn) redBtn.classList.remove('is-buzzed');
    if (blueBtn) blueBtn.classList.remove('is-buzzed');

    if (winCard) winCard.style.display = 'none';

    if (!battleQuestions.length) {
      if (qaEl) qaEl.style.display = 'none';
      if (statusEl) {
        statusEl.className = 'battle-buzzer-status';
        statusEl.textContent = '⚡ กดปุ่มทีม (A / L) เพื่อแย่งสิทธิ์ตอบ หรือกด +1 / +5 เพื่อปรับคะแนน';
      }
      return;
    }

    if (
      battleQuestionIndex >= battleQuestions.length
      || battleScores.red >= battleWinScore
      || battleScores.blue >= battleWinScore
    ) {
      finishTeamBattle();
      return;
    }

    if (qaEl) qaEl.style.display = 'flex';
    if (statusEl) {
      statusEl.className = 'battle-buzzer-status';
      statusEl.textContent = '⚡ กดปุ่มทีม (A / L) เพื่อแย่งสิทธิ์ตอบ แล้วเลือกคำตอบด้านล่าง!';
    }

    const q = battleQuestions[battleQuestionIndex];
    const qNumEl = battleModalEl.querySelector('#battle-q-num');
    const qTextEl = battleModalEl.querySelector('#battle-q-text');
    const choicesEl = battleModalEl.querySelector('#battle-choices');

    if (qNumEl) {
      qNumEl.textContent = `ข้อที่ ${battleQuestionIndex + 1}/${battleQuestions.length} (เป้าหมาย ${battleWinScore} แต้ม)`;
    }
    if (qTextEl) {
      qTextEl.textContent = q.prompt || q.question || '';
    }
    if (choicesEl) {
      choicesEl.innerHTML = '';
      const rawChoices = Array.isArray(q.choices) ? q.choices : (Array.isArray(q.options) ? q.options : []);
      rawChoices.forEach((choice, idx) => {
        const isCorrect = typeof choice === 'object'
          ? Boolean(choice.correct)
          : idx === q.correctIndex;
        const label = typeof choice === 'object'
          ? (choice.label || choice.text || String(choice))
          : String(choice);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'battle-choice-btn';
        btn.dataset.correct = String(isCorrect);
        btn.textContent = label;
        btn.addEventListener('click', () => handleBattleChoice(isCorrect, btn));
        choicesEl.appendChild(btn);
      });
    }
  }

  function handleBattleChoice(isCorrect, btn) {
    if (battleLocked || !battleModalEl) return;
    const statusEl = battleModalEl.querySelector('#battle-buzzer-status');

    if (isCorrect) {
      battleLocked = true;
      btn.classList.add('correct');
      const team = activeBuzzerTeam || 'red';
      battleScores[team] += battlePointsPerQuestion;
      updateBattleScoreDisplay();
      if (statusEl) {
        statusEl.textContent = team === 'red'
          ? `🎉 ทีมสีแดงตอบถูก! +${battlePointsPerQuestion} แต้ม`
          : `🎉 ทีมสีน้ำเงินตอบถูก! +${battlePointsPerQuestion} แต้ม`;
      }
      launchConfetti({
        count: 35,
        originX: (window.innerWidth || 800) * (team === 'red' ? 0.35 : 0.65)
      });
      if (battleTimerId) clearTimeout(battleTimerId);
      battleTimerId = setTimeout(() => {
        battleQuestionIndex += 1;
        renderBattleQuestion();
      }, 900);
    } else {
      btn.classList.add('wrong');
      btn.disabled = true;
      if (activeBuzzerTeam) {
        const other = activeBuzzerTeam === 'red' ? 'blue' : 'red';
        buzzTeam(other);
        if (statusEl) {
          statusEl.textContent = other === 'blue'
            ? '❌ ทีมแดงตอบผิด! โยนสิทธิ์ให้ 🔵 ทีมสีน้ำเงินตอบแทน'
            : '❌ ทีมน้ำเงินตอบผิด! โยนสิทธิ์ให้ 🔴 ทีมสีแดงตอบแทน';
        }
      } else if (statusEl) {
        statusEl.textContent = '❌ ยังไม่ถูก ลองเลือกคำตอบอื่น';
      }
    }
  }

  function resetTeamBattle() {
    if (battleTimerId) {
      clearTimeout(battleTimerId);
      battleTimerId = null;
    }
    battleScores = { red: 0, blue: 0 };
    battleQuestionIndex = 0;
    activeBuzzerTeam = null;
    battleLocked = false;
    updateBattleScoreDisplay();
    renderBattleQuestion();
  }

  function handleBattleKeydown(e) {
    if (!battleModalEl || !battleModalEl.isConnected || battleModalEl.style.display === 'none') return;
    const tag = e.target && e.target.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (e.key === 'a' || e.key === 'A') {
      e.preventDefault();
      buzzTeam('red');
    } else if (e.key === 'l' || e.key === 'L') {
      e.preventDefault();
      buzzTeam('blue');
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeTeamBattle();
    }
  }

  function openTeamBattle(title, onScore, options = {}) {
    ensureStyles();
    closeTeamBattle();

    battleScores = { red: 0, blue: 0 };
    activeBuzzerTeam = null;
    battleLocked = false;
    battleQuestions = Array.isArray(options.questions) ? [...options.questions] : [];
    battleQuestionIndex = 0;
    battleWinScore = typeof options.winScore === 'number' ? options.winScore : 50;
    battlePointsPerQuestion = typeof options.pointsPerQuestion === 'number' ? options.pointsPerQuestion : 10;
    battleOnScore = typeof onScore === 'function' ? onScore : null;

    const displayTitle = title || '🏆 การแข่งขันตอบคำถามแบ่งทีม (Team Battle)';

    const modal = document.createElement('div');
    modal.id = 'kampai-battle-modal';
    modal.className = 'kampai-modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = `
      <div class="kampai-modal-card" style="max-width: 640px;">
        <button type="button" class="kampai-close-btn" data-action="close" aria-label="ปิดหน้าต่าง">✕</button>
        <h2 style="font-size: 22px; font-weight: bold; margin: 0 0 4px 0;">${displayTitle}</h2>
        <p style="color: var(--kp-muted); margin: 0 0 8px 0; font-size: 14px;">กดปุ่มบัซเซอร์ (A / L) เพื่อแย่งสิทธิ์ตอบ หรือสะสมคะแนน</p>

        <div class="kp-battle-teams">
          <div class="kp-team-card red">
            <button type="button" class="team-buzzer-btn red" id="buzzer-red-btn" data-action="buzz-red">🔴 ทีมสีแดง (A)</button>
            <div id="kampai-score-red" class="kp-team-score">0</div>
            <div class="kp-team-btns">
              <button type="button" class="kp-score-btn red" data-action="red-add-1">+1</button>
              <button type="button" class="kp-score-btn red" data-action="red-add-5">+5</button>
              <button type="button" class="kp-score-btn sub" data-action="red-sub-1">-1</button>
            </div>
          </div>

          <div class="kp-team-card blue">
            <button type="button" class="team-buzzer-btn blue" id="buzzer-blue-btn" data-action="buzz-blue">🔵 ทีมสีน้ำเงิน (L)</button>
            <div id="kampai-score-blue" class="kp-team-score">0</div>
            <div class="kp-team-btns">
              <button type="button" class="kp-score-btn blue" data-action="blue-add-1">+1</button>
              <button type="button" class="kp-score-btn blue" data-action="blue-add-5">+5</button>
              <button type="button" class="kp-score-btn sub" data-action="blue-sub-1">-1</button>
            </div>
          </div>
        </div>

        <div class="battle-buzzer-status" id="battle-buzzer-status">⚡ กดปุ่มทีม (A / L) เพื่อแย่งสิทธิ์ตอบ</div>

        <div class="battle-question-area" id="battle-qa" style="display:none">
          <div class="battle-q-badge" id="battle-q-num"></div>
          <div class="battle-q-prompt" id="battle-q-text"></div>
          <div class="battle-options-grid" id="battle-choices"></div>
        </div>

        <div class="battle-winner-card" id="battle-winner-card" style="display:none">
          <h3 id="battle-winner-title" style="font-size: 24px; font-weight: 800; margin: 0 0 6px 0;">🏆 ผู้ชนะ</h3>
          <p id="battle-winner-summary" style="font-size: 16px; margin: 0 0 12px 0;"></p>
          <button type="button" class="kampai-projector-btn" data-action="reset-scores">🔄 แข่งขันรอบใหม่</button>
        </div>

        <div style="display: flex; gap: 12px; margin-top: 8px;">
          <button type="button" class="kampai-projector-btn" data-action="reset-scores">
            <span>🔄</span>
            <span>เริ่มนับใหม่</span>
          </button>
          <button type="button" class="kampai-projector-btn" data-action="cheer">
            <span>🎉</span>
            <span>จุดพลุฉลอง</span>
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    battleModalEl = modal;
    window.addEventListener('keydown', handleBattleKeydown);

    modal.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');

      if (action === 'close') {
        closeTeamBattle();
      } else if (action === 'buzz-red') {
        buzzTeam('red');
      } else if (action === 'buzz-blue') {
        buzzTeam('blue');
      } else if (action === 'red-add-1') {
        battleScores.red += 1;
        updateBattleScoreDisplay();
        launchConfetti({ count: 25, originX: (window.innerWidth || 800) * 0.35 });
      } else if (action === 'red-add-5') {
        battleScores.red += 5;
        updateBattleScoreDisplay();
        launchConfetti({ count: 40, originX: (window.innerWidth || 800) * 0.35 });
      } else if (action === 'red-sub-1') {
        battleScores.red = Math.max(0, battleScores.red - 1);
        updateBattleScoreDisplay();
      } else if (action === 'blue-add-1') {
        battleScores.blue += 1;
        updateBattleScoreDisplay();
        launchConfetti({ count: 25, originX: (window.innerWidth || 800) * 0.65 });
      } else if (action === 'blue-add-5') {
        battleScores.blue += 5;
        updateBattleScoreDisplay();
        launchConfetti({ count: 40, originX: (window.innerWidth || 800) * 0.65 });
      } else if (action === 'blue-sub-1') {
        battleScores.blue = Math.max(0, battleScores.blue - 1);
        updateBattleScoreDisplay();
      } else if (action === 'reset-scores') {
        resetTeamBattle();
      } else if (action === 'cheer') {
        launchConfetti({ count: 80 });
      }
    });

    updateBattleScoreDisplay();
    renderBattleQuestion();
  }

  function closeTeamBattle() {
    if (battleTimerId) {
      clearTimeout(battleTimerId);
      battleTimerId = null;
    }
    window.removeEventListener('keydown', handleBattleKeydown);
    if (battleModalEl) {
      battleModalEl.style.display = 'none';
      battleModalEl.remove();
      battleModalEl = null;
    }
  }

  const classroomApi = {
    toggleProjector,
    isProjectorActive: () => isProjector,
    openWheel,
    rerollWheel,
    closeWheel,
    openTeamBattle,
    buzzTeam,
    resetTeamBattle,
    closeTeamBattle,
    confetti: launchConfetti
  };

  // Expose both legacy KampaiClassroom and KampaiClassroomTools
  window.KampaiClassroom = classroomApi;
  window.KampaiClassroomTools = classroomApi;
})();
