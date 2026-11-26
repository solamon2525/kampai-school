/**
 * shared-worksheet-tools.js
 * Reusable A4 Worksheet Generator and Print Runtime for Kampai Educational Games
 * 
 * Features:
 * 1. Standard A4 Printable Single-Page Layout (with optional Answer Key page 2)
 * 2. 10 / 20 Question Drills with 2-Column Responsive Print Typography
 * 3. Formal Student Header (Name, Grade, No., Date) + Standard OBEC Score Box
 * 4. Teacher Feedback & Signature Block
 * 5. Interactive In-Game Print Preview Modal (`openPrintModal`)
 */

(function initKampaiWorksheetTools() {
  'use strict';

  function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Generate complete A4 HTML string
  function generateA4(options = {}) {
    const title = options.title || 'แบบฝึกหัดพัฒนาทักษะการเรียนรู้';
    const subtitle = options.subtitle || 'กลุ่มสาระการเรียนรู้ • แบบฝึกเสริมทักษะ';
    const schoolName = options.schoolName || 'โรงเรียนคำไฮวิทยา สำนักงานเขตพื้นที่การศึกษาประถมศึกษา';
    const instructions = options.instructions || 'คำชี้แจง: ให้นักเรียนหาคำตอบหรือเติมคำในช่องว่างให้ถูกต้องสมบูรณ์';
    const rawItems = Array.isArray(options.items) ? options.items : [];
    const count = options.itemCount || rawItems.length || 10;
    const items = rawItems.slice(0, count);
    const includeAnswerKey = options.includeAnswerKey !== false;
    const columns = options.columns || (items.length > 6 ? 2 : 1);
    const teacherName = options.teacherName || '';

    // Build question elements
    const questionsHtml = items.map((item, index) => {
      const qNum = index + 1;
      const qText = typeof item === 'object' ? (item.question || item.q || item.title || `ข้อที่ ${qNum}`) : String(item);
      const choices = typeof item === 'object' && Array.isArray(item.choices) ? item.choices : null;
      const hint = typeof item === 'object' && item.hint ? item.hint : null;

      let inner = '';
      if (choices) {
        inner = `
          <div class="ws-choices">
            ${choices.map((c, ci) => `
              <span class="ws-choice">
                <span class="ws-bubble"></span>
                <span class="ws-choice-label">${['ก', 'ข', 'ค', 'ง'][ci] || ci + 1}.</span>
                <span>${escapeHtml(c)}</span>
              </span>
            `).join('')}
          </div>
        `;
      } else {
        inner = `
          <div class="ws-answer-line">
            <span class="ws-answer-label">ตอบ</span>
            <span class="ws-dots"></span>
          </div>
        `;
      }

      return `
        <div class="ws-question-item">
          <div class="ws-question-header">
            <span class="ws-qnum">${qNum}.</span>
            <span class="ws-qtext">${escapeHtml(qText)}</span>
          </div>
          ${hint ? `<div class="ws-hint">คำแนะนำ: ${escapeHtml(hint)}</div>` : ''}
          ${inner}
        </div>
      `;
    }).join('');

    // Build answer key elements
    const answerKeyHtml = includeAnswerKey ? `
      <div class="ws-page ws-page-break">
        <header class="ws-header">
          <div class="ws-school">${escapeHtml(schoolName)}</div>
          <h1 class="ws-title">เฉลยคำตอบ (Answer Key) — ${escapeHtml(title)}</h1>
          <div class="ws-subtitle">${escapeHtml(subtitle)} • สำหรับครูผู้สอน</div>
        </header>

        <div class="ws-key-notice">
          ℹ️ สำหรับครูผู้สอนใช้ตรวจประเมินผล หรือใช้เฉลยและอภิปรายร่วมกันในชั้นเรียน
        </div>

        <div class="ws-key-grid">
          ${items.map((item, index) => {
            const qNum = index + 1;
            const ans = typeof item === 'object' ? (item.answer || item.correct || item.a || '-') : '-';
            const exp = typeof item === 'object' && item.explanation ? item.explanation : null;
            return `
              <div class="ws-key-item">
                <span class="ws-key-num">ข้อ ${qNum}:</span>
                <span class="ws-key-ans">${escapeHtml(ans)}</span>
                ${exp ? `<div class="ws-key-exp">${escapeHtml(exp)}</div>` : ''}
              </div>
            `;
          }).join('')}
        </div>

        <div class="ws-footer-key">
          เอกสารประกอบการจัดการเรียนรู้ Kampai School Education Platform
        </div>
      </div>
    ` : '';

    return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)} - A4 Worksheet</title>
  <style>
    :root {
      --ws-text: #0f172a;
      --ws-muted: #475569;
      --ws-border: #94a3b8;
      --ws-border-light: #cbd5e1;
      --ws-primary: #0284c7;
      --ws-bg-card: #f8fafc;
    }

    @page {
      size: A4 portrait;
      margin: 10mm 14mm 10mm 14mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: Sarabun, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: var(--ws-text);
      background: #ffffff;
      line-height: 1.45;
      font-size: 15px;
    }

    .ws-page {
      max-width: 210mm;
      margin: 0 auto;
      padding: 12px 16px;
      position: relative;
    }

    .ws-page-break {
      page-break-before: always;
      break-before: page;
    }

    /* Header Section */
    .ws-header {
      text-align: center;
      margin-bottom: 12px;
      border-bottom: 2px solid var(--ws-primary);
      padding-bottom: 8px;
    }
    .ws-school {
      font-size: 13px;
      color: var(--ws-muted);
      font-weight: 500;
    }
    .ws-title {
      font-size: 22px;
      font-weight: 700;
      margin: 4px 0 2px 0;
      color: var(--ws-text);
    }
    .ws-subtitle {
      font-size: 14px;
      color: var(--ws-muted);
    }

    /* Student Meta & Score Bar */
    .ws-meta-bar {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 16px;
      align-items: center;
      background: var(--ws-bg-card);
      border: 1px solid var(--ws-border);
      border-radius: 8px;
      padding: 8px 12px;
      margin-bottom: 12px;
    }
    .ws-meta-fields {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 16px;
      font-size: 14px;
    }
    .ws-field {
      display: inline-flex;
      align-items: baseline;
      gap: 4px;
    }
    .ws-line {
      display: inline-block;
      border-bottom: 1px dotted var(--ws-border);
      min-width: 90px;
      height: 1em;
    }
    .ws-line.name { min-width: 170px; }
    .ws-line.short { min-width: 45px; }

    /* Score Box */
    .ws-score-box {
      border: 2px solid var(--ws-primary);
      border-radius: 6px;
      text-align: center;
      overflow: hidden;
      min-width: 110px;
    }
    .ws-score-title {
      background: var(--ws-primary);
      color: #ffffff;
      font-size: 12px;
      font-weight: bold;
      padding: 2px 6px;
    }
    .ws-score-body {
      font-size: 18px;
      font-weight: bold;
      padding: 4px 6px;
      background: #ffffff;
    }
    .ws-score-max {
      font-size: 12px;
      color: var(--ws-muted);
      font-weight: normal;
    }

    /* Instructions Bar */
    .ws-instructions {
      font-size: 13.5px;
      font-weight: 600;
      margin-bottom: 12px;
      padding: 4px 8px;
      background: #f1f5f9;
      border-left: 4px solid var(--ws-primary);
      border-radius: 2px;
    }

    /* Questions Grid */
    .ws-grid {
      display: grid;
      gap: 12px 18px;
    }
    .ws-grid.cols-1 { grid-template-columns: 1fr; }
    .ws-grid.cols-2 { grid-template-columns: 1fr 1fr; }

    .ws-question-item {
      border: 1px solid var(--ws-border-light);
      border-radius: 6px;
      padding: 8px 10px;
      background: #ffffff;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .ws-question-header {
      display: flex;
      align-items: baseline;
      gap: 6px;
      font-size: 15px;
      font-weight: 600;
    }
    .ws-qnum {
      color: var(--ws-primary);
      font-weight: 700;
    }
    .ws-qtext {
      flex: 1;
    }
    .ws-hint {
      font-size: 12px;
      color: var(--ws-muted);
      margin-top: 2px;
      font-style: italic;
    }

    .ws-choices {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 4px 8px;
      margin-top: 6px;
      font-size: 13.5px;
    }
    .ws-choice {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .ws-bubble {
      width: 14px;
      height: 14px;
      border: 1px solid var(--ws-border);
      border-radius: 50%;
      display: inline-block;
      flex-shrink: 0;
    }
    .ws-choice-label {
      font-weight: bold;
    }

    .ws-answer-line {
      display: flex;
      align-items: baseline;
      gap: 8px;
      margin-top: 8px;
      font-size: 14px;
    }
    .ws-answer-label {
      font-weight: 600;
      color: var(--ws-muted);
    }
    .ws-dots {
      flex: 1;
      border-bottom: 1px dotted var(--ws-border);
      height: 1em;
    }

    /* Teacher Signature Footer */
    .ws-footer {
      margin-top: 16px;
      padding-top: 8px;
      border-top: 1px solid var(--ws-border-light);
      display: grid;
      grid-template-columns: 1.2fr 1fr;
      gap: 16px;
      font-size: 13px;
      page-break-inside: avoid;
    }
    .ws-feedback-box {
      border: 1px solid var(--ws-border-light);
      border-radius: 6px;
      padding: 6px 10px;
    }
    .ws-feedback-title {
      font-weight: 600;
      margin-bottom: 4px;
    }
    .ws-feedback-lines {
      border-bottom: 1px dotted var(--ws-border-light);
      height: 1.6em;
    }

    .ws-sign-box {
      text-align: center;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      align-items: center;
    }
    .ws-sign-line {
      width: 160px;
      border-bottom: 1px dotted var(--ws-border);
      margin: 8px 0 4px 0;
    }

    /* Answer Key Styles */
    .ws-key-notice {
      background: #eff6ff;
      border-left: 4px solid var(--ws-primary);
      padding: 6px 10px;
      font-size: 13px;
      margin-bottom: 16px;
      border-radius: 2px;
    }
    .ws-key-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 8px;
    }
    @media (max-width: 600px) {
      .ws-key-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    .ws-key-item {
      border: 1px solid var(--ws-border-light);
      border-radius: 4px;
      padding: 6px 8px;
      background: #ffffff;
      font-size: 13.5px;
      min-width: 0;
      white-space: normal;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .ws-key-num {
      font-weight: bold;
      color: var(--ws-muted);
      margin-right: 4px;
    }
    .ws-key-ans {
      font-weight: 700;
      color: var(--ws-primary);
    }
    .ws-key-exp {
      font-size: 11.5px;
      color: var(--ws-muted);
      margin-top: 2px;
    }
    .ws-footer-key {
      margin-top: 24px;
      text-align: center;
      font-size: 12px;
      color: var(--ws-muted);
      border-top: 1px solid var(--ws-border-light);
      padding-top: 8px;
    }

    @media print {
      body {
        background: #ffffff !important;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="ws-page">
    <header class="ws-header">
      <div class="ws-school">${escapeHtml(schoolName)}</div>
      <h1 class="ws-title">${escapeHtml(title)}</h1>
      <div class="ws-subtitle">${escapeHtml(subtitle)}</div>
    </header>

    <div class="ws-meta-bar">
      <div class="ws-meta-fields">
        <div class="ws-field">
          <span>ชื่อ-นามสกุล:</span>
          <span class="ws-line name"></span>
        </div>
        <div class="ws-field">
          <span>ชั้น:</span>
          <span class="ws-line short"></span>
        </div>
        <div class="ws-field">
          <span>เลขที่:</span>
          <span class="ws-line short"></span>
        </div>
        <div class="ws-field">
          <span>วันที่:</span>
          <span class="ws-line"></span>
        </div>
      </div>
      <div class="ws-score-box">
        <div class="ws-score-title">คะแนนที่ได้</div>
        <div class="ws-score-body">
          &nbsp;&nbsp;&nbsp;&nbsp; <span class="ws-score-max">/ ${items.length}</span>
        </div>
      </div>
    </div>

    <div class="ws-instructions">${escapeHtml(instructions)}</div>

    <div class="ws-grid cols-${columns}">
      ${questionsHtml}
    </div>

    <footer class="ws-footer">
      <div class="ws-feedback-box">
        <div class="ws-feedback-title">ข้อเสนอแนะ / ความเห็นของครู:</div>
        <div class="ws-feedback-lines"></div>
        <div class="ws-feedback-lines"></div>
      </div>
      <div class="ws-sign-box">
        <div>ลงชื่อครูผู้สอน:</div>
        <div class="ws-sign-line"></div>
        <div>(${escapeHtml(teacherName || '....................................................')})</div>
        <div style="font-size: 11px; color: var(--ws-muted); margin-top: 2px;">ครูผู้สอน / ผู้ตรวจ</div>
      </div>
    </footer>
  </div>

  ${answerKeyHtml}
</body>
</html>`;
  }

  // Interactive In-Game Print Modal
  let printModalEl = null;

  function openPrintModal(config = {}) {
    closePrintModal();

    const title = config.title || 'ใบงานแบบฝึกหัด A4';
    const rawItems = Array.isArray(config.items) ? config.items : [];
    let currentItemCount = config.itemCount || (rawItems.length >= 20 ? 20 : 10);
    let includeAnswerKey = config.includeAnswerKey !== false;

    const modal = document.createElement('div');
    modal.id = 'kampai-worksheet-modal';
    modal.className = 'kampai-modal-overlay';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    modal.innerHTML = `
      <div class="kampai-modal-card" style="max-width: 580px; text-align: left; align-items: stretch;">
        <button type="button" class="kampai-close-btn" data-action="close" aria-label="ปิดหน้าต่าง">✕</button>
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 4px;">
          <span style="font-size: 24px;">🖨️</span>
          <h2 style="font-size: 20px; font-weight: bold; margin: 0;">พิมพ์ใบงาน A4 (Print Worksheet)</h2>
        </div>
        <p style="color: var(--kp-muted, #64748b); margin: 0 0 16px 0; font-size: 14px;">
          สร้างใบงานขนาด A4 มาตรฐาน พร้อมช่องกรอกชื่อ ช่องคะแนน และใบเฉลยคำตอบสำหรับครู
        </p>

        <div style="background: var(--kp-bg, #f8fafc); border: 1px solid var(--kp-border, #cbd5e1); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
          <div style="font-weight: 600; font-size: 15px; margin-bottom: 8px;">หัวข้อ: ${escapeHtml(title)}</div>
          
          <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center; margin-bottom: 10px;">
            <label style="font-size: 14px; font-weight: 500;">จำนวนข้อ:</label>
            <label style="display: inline-flex; align-items: center; gap: 4px; font-size: 14px; cursor: pointer;">
              <input type="radio" name="kp-ws-count" value="10" ${currentItemCount === 10 ? 'checked' : ''}> 10 ข้อ (1 แผ่นเต็ม)
            </label>
            <label style="display: inline-flex; align-items: center; gap: 4px; font-size: 14px; cursor: pointer;">
              <input type="radio" name="kp-ws-count" value="20" ${currentItemCount === 20 ? 'checked' : ''}> 20 ข้อ (2 คอลัมน์)
            </label>
          </div>

          <div>
            <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 14px; cursor: pointer;">
              <input type="checkbox" id="kp-ws-key-toggle" ${includeAnswerKey ? 'checked' : ''}> รวมหน้าเฉลยคำตอบ (Answer Key Page)
            </label>
          </div>
        </div>

        <div style="display: flex; justify-content: flex-end; gap: 10px;">
          <button type="button" class="kampai-projector-btn" data-action="close" style="background: transparent;">
            ยกเลิก
          </button>
          <button type="button" class="kampai-projector-btn" data-action="print" style="background: var(--kp-primary, #0284c7); color: #ffffff; border-color: var(--kp-primary, #0284c7);">
            🖨️ พิมพ์ใบงานเดี๋ยวนี้
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    printModalEl = modal;

    function handlePrint() {
      const selectedCountEl = modal.querySelector('input[name="kp-ws-count"]:checked');
      const count = selectedCountEl ? parseInt(selectedCountEl.value, 10) : currentItemCount;
      const keyToggle = modal.querySelector('#kp-ws-key-toggle');
      const withKey = keyToggle ? keyToggle.checked : true;

      const fullHtml = generateA4({
        ...config,
        itemCount: count,
        includeAnswerKey: withKey
      });

      // Open print frame
      let iframe = document.getElementById('kampai-print-frame');
      if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'kampai-print-frame';
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);
      }

      const doc = iframe.contentWindow ? iframe.contentWindow.document : iframe.contentDocument;
      if (doc) {
        doc.open();
        doc.write(fullHtml);
        doc.close();

        setTimeout(() => {
          try {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
          } catch (e) {
            console.error('Print trigger error:', e);
          }
        }, 300);
      }

      window.dispatchEvent(new CustomEvent('kampai:worksheet:print', {
        detail: { title, itemCount: count, includeAnswerKey: withKey }
      }));
    }

    modal.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const action = btn.getAttribute('data-action');

      if (action === 'close') {
        closePrintModal();
      } else if (action === 'print') {
        handlePrint();
      }
    });
  }

  function closePrintModal() {
    if (printModalEl) {
      printModalEl.style.display = 'none';
      printModalEl.remove();
      printModalEl = null;
    }
  }

  const CONCEPT_GRID_PRESETS = {
    '5x20-portrait': {
      id: '5x20-portrait',
      label: 'A4 แนวตั้ง 5×20 ช่อง (ตัวใหญ่สุด)',
      orientation: 'portrait',
      cols: 5,
      rows: 20,
      tableHeightMm: 252,
      fontSizes: { xl: '17pt', lg: '15pt', md: '13pt', sm: '11pt', xs: '9.5pt' },
    },
    '4x25-portrait': {
      id: '4x25-portrait',
      label: 'A4 แนวตั้ง 4×25 ช่อง (เหมาะกับคำ/นิยามยาว)',
      orientation: 'portrait',
      cols: 4,
      rows: 25,
      tableHeightMm: 252,
      fontSizes: { xl: '15pt', lg: '13.5pt', md: '12pt', sm: '10.5pt', xs: '9pt' },
    },
    '5x20-landscape': {
      id: '5x20-landscape',
      label: 'A4 แนวนอน 5×20 ช่อง (ช่องกว้างพิเศษ)',
      orientation: 'landscape',
      cols: 5,
      rows: 20,
      tableHeightMm: 166,
      fontSizes: { xl: '14pt', lg: '12.5pt', md: '11.5pt', sm: '10pt', xs: '8.5pt' },
    },
    '10x10-landscape': {
      id: '10x10-landscape',
      label: 'A4 แนวนอน 10×10 ช่อง (ตารางจัตุรัส)',
      orientation: 'landscape',
      cols: 10,
      rows: 10,
      tableHeightMm: 166,
      fontSizes: { xl: '13.5pt', lg: '12pt', md: '10.5pt', sm: '9pt', xs: '8pt' },
    },
  };

  function mulberry32(seed) {
    let a = (Number(seed) || 1) >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function shuffleWithSeed(items, seed) {
    const arr = items.slice();
    const rng = mulberry32(seed);
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function countConceptGraphemes(str) {
    const text = String(str || '').trim();
    if (!text) return 0;
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const seg = new Intl.Segmenter('th', { granularity: 'grapheme' });
      let count = 0;
      for (const _ of seg.segment(text)) count++;
      return count;
    }
    let count = 0;
    for (let i = 0; i < text.length; i++) {
      count++;
      while (i + 1 < text.length && /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/.test(text[i + 1])) {
        i++;
      }
    }
    return count;
  }

  function computeConceptCellTypography(word, options = {}) {
    const len = countConceptGraphemes(word);
    const penalty = options.showReading ? 2 : 0;
    const effective = len + penalty;
    let fontClass = 'fs-xl';
    if (effective >= 23) fontClass = 'fs-xs';
    else if (effective >= 15) fontClass = 'fs-sm';
    else if (effective >= 10) fontClass = 'fs-md';
    else if (effective >= 6) fontClass = 'fs-lg';
    return { fontClass, graphemeCount: len };
  }

  function normalizeConceptItems(items, options = {}) {
    const list = Array.isArray(items) ? items : [];
    const targetGrade = options.grade && options.grade !== 'all' ? String(options.grade) : null;
    const seen = new Set();
    const normalized = [];

    for (let i = 0; i < list.length; i++) {
      const raw = list[i];
      if (!raw) continue;
      if (typeof raw === 'object') {
        if (raw.content_status === 'quarantined' || raw.status === 'quarantined' || raw.quarantined === true) {
          continue;
        }
        if (targetGrade && raw.grade && String(raw.grade) !== targetGrade) {
          continue;
        }
      }
      const primary = typeof raw === 'object'
        ? (raw.word ?? raw.term ?? raw.label ?? raw.prompt ?? raw.question ?? raw.title ?? '')
        : String(raw);
      const cleanWord = String(primary || '').trim();
      if (!cleanWord || seen.has(cleanWord)) continue;
      seen.add(cleanWord);

      const reading = typeof raw === 'object'
        ? String(raw.reading ?? raw.phonetic ?? raw.formula ?? raw.sublabel ?? '').trim()
        : '';
      const meaning = typeof raw === 'object'
        ? String(raw.meaning ?? raw.answer ?? raw.definition ?? raw.translation ?? '').trim()
        : '';

      normalized.push({
        word: cleanWord,
        term: cleanWord,
        reading,
        meaning,
        grade: typeof raw === 'object' ? (raw.grade || '') : '',
      });
    }
    return normalized;
  }

  function renderConceptStudentSheet(items, setIndex, totalSets, preset, opts) {
    const cols = preset.cols;
    const rows = preset.rows;
    const showNumbers = opts.showNumbers !== false;
    const showCheckbox = opts.showCheckbox !== false;
    const showReading = Boolean(opts.showReading);
    const gradeLabel = opts.gradeLabel || (opts.grade && opts.grade !== 'all' ? opts.grade : 'ป.1–ป.6');
    const subjectLabel = opts.subject ? `${opts.subject} · ` : '';
    const schoolName = opts.schoolName || 'โรงเรียนบ้านคำไผ่';
    const title = opts.title || 'ตารางสรุปแนวคิดและคำศัพท์ 100 ช่อง';
    const setBadge = totalSets > 1 ? ` · ชุดที่ ${setIndex + 1}/${totalSets}` : '';
    const countLabel = `${items.length} รายการ`;
    const scoreLabel = opts.scoreLabel || 'ทำได้';

    let tbodyHtml = '';
    for (let r = 0; r < rows; r++) {
      tbodyHtml += '<tr>';
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const item = items[idx];
        if (!item) {
          tbodyHtml += `<td class="concept-cell concept-cell-empty"><span class="cell-num">${showNumbers ? idx + 1 : ''}</span></td>`;
          continue;
        }
        const typo = computeConceptCellTypography(item.word, { showReading });
        tbodyHtml += `<td class="concept-cell ${typo.fontClass}">`;
        if (showNumbers) {
          tbodyHtml += `<span class="cell-num">${idx + 1}</span>`;
        }
        if (showCheckbox) {
          tbodyHtml += '<span class="cell-check" aria-hidden="true">☐</span>';
        }
        tbodyHtml += '<div class="cell-inner">';
        tbodyHtml += `<div class="cell-word">${escapeHtml(item.word)}</div>`;
        if (showReading && item.reading) {
          tbodyHtml += `<div class="cell-reading">[${escapeHtml(item.reading)}]</div>`;
        }
        tbodyHtml += '</div></td>';
      }
      tbodyHtml += '</tr>';
    }

    return `
  <section class="sheet student-sheet">
    <header class="sheet-head">
      <div class="head-top">
        <div class="head-title">${escapeHtml(title)}${escapeHtml(setBadge)}</div>
        <div class="head-meta">${escapeHtml(subjectLabel)}${escapeHtml(gradeLabel)} · ${escapeHtml(countLabel)}</div>
      </div>
      <div class="student-bar">
        <span>ชื่อ–นามสกุล .................................................................</span>
        <span>ชั้น ...............</span>
        <span>เลขที่ .........</span>
        <span class="score-pill">${escapeHtml(scoreLabel)} ........ / ${items.length}</span>
      </div>
    </header>
    <table class="concept-100-table" style="height:${preset.tableHeightMm}mm">
      <tbody>${tbodyHtml}</tbody>
    </table>
    <footer class="sheet-foot">
      <span>${escapeHtml(schoolName)} · แบบฝึกสรุปแนวคิด/คำศัพท์ 100 ช่อง</span>
      <span>วันที่ ....... / .............. / 25..... · ลงชื่อผู้ตรวจ ........................................</span>
    </footer>
  </section>`;
  }

  function renderConceptTeacherKeySheet(items, setIndex, totalSets, opts, isLandscape) {
    const title = opts.title || 'ตารางสรุปแนวคิดและคำศัพท์ 100 ช่อง';
    const setBadge = totalSets > 1 ? ` (ชุดที่ ${setIndex + 1}/${totalSets})` : '';
    const colCount = isLandscape ? 3 : 2;
    const perCol = Math.max(1, Math.ceil(items.length / colCount));
    const colsHtml = [];

    const renderList = (list, offset) => list.map((item, i) => `
      <div class="key-row">
        <span class="key-num">${offset + i + 1}.</span>
        <span class="key-word">${escapeHtml(item.word)}</span>
        ${item.reading ? `<span class="key-reading">[${escapeHtml(item.reading)}]</span>` : ''}
        ${item.meaning ? `<span class="key-meaning">— ${escapeHtml(item.meaning)}</span>` : ''}
      </div>`).join('');

    for (let c = 0; c < colCount; c++) {
      const start = c * perCol;
      const slice = items.slice(start, start + perCol);
      colsHtml.push(`<div class="key-col">${renderList(slice, start)}</div>`);
    }

    return `
  <section class="sheet teacher-key-sheet">
    <header class="sheet-head">
      <div class="head-top">
        <div class="head-title">เฉลยและคำอธิบายสำหรับครู${escapeHtml(setBadge)} — ${escapeHtml(title)}</div>
        <div class="head-meta">${escapeHtml(opts.subject || 'ทุกกลุ่มสาระ')} · ${escapeHtml(opts.gradeLabel || 'ป.1–ป.6')}</div>
      </div>
    </header>
    <div class="key-columns ${isLandscape ? 'cols-3' : 'cols-2'}">
      ${colsHtml.join('')}
    </div>
    <footer class="sheet-foot">
      <span>เอกสารสำหรับครูผู้สอน · Kampai School Education Platform</span>
      <span>ทั้งหมด ${items.length} รายการ</span>
    </footer>
  </section>`;
  }

  function renderConceptGrid100(items, options = {}) {
    const opts = options || {};
    const preset = CONCEPT_GRID_PRESETS[opts.preset] || CONCEPT_GRID_PRESETS['5x20-portrait'];
    const isLandscape = preset.orientation === 'landscape';
    const fs = preset.fontSizes;
    const capacity = preset.cols * preset.rows;

    let pool = normalizeConceptItems(items, opts);
    if (opts.shuffle) {
      const seed = opts.seed != null ? Number(opts.seed) : (Date.now() & 0x7fffffff);
      pool = shuffleWithSeed(pool, seed);
    }

    const sets = [];
    if (opts.multiPage && pool.length > capacity) {
      for (let i = 0; i < pool.length; i += capacity) {
        sets.push(pool.slice(i, i + capacity));
      }
    } else {
      sets.push(pool.slice(0, capacity));
    }

    let pagesHtml = '';
    for (let i = 0; i < sets.length; i++) {
      pagesHtml += renderConceptStudentSheet(sets[i], i, sets.length, preset, opts);
      if (opts.includeTeacherKey) {
        pagesHtml += renderConceptTeacherKeySheet(sets[i], i, sets.length, opts, isLandscape);
      }
    }

    const docTitle = escapeHtml(opts.title || 'ตารางสรุปแนวคิด-100-ช่อง');

    return `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>${docTitle}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
  @page {
    size: A4 ${preset.orientation};
    margin: 7mm 8mm;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    font-family: 'Sarabun', sans-serif;
    color: #0f172a;
    background: #e2e8f0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .preview-toolbar {
    position: sticky;
    top: 0;
    z-index: 50;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 10px 18px;
    background: #0f172a;
    color: #f8fafc;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }
  .preview-toolbar-left {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .preview-toolbar-title {
    font-size: 14px;
    font-weight: 700;
    color: #fbbf24;
  }
  .preview-toolbar-hint {
    font-size: 12px;
    color: #cbd5e1;
  }
  .preview-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .pbtn {
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: #1e293b;
    color: #f8fafc;
    padding: 7px 14px;
    border-radius: 8px;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }
  .pbtn:hover { background: #334155; }
  .pbtn-primary { background: #0284c7; border-color: #0284c7; }
  .pbtn-primary:hover { background: #0369a1; }
  .pbtn-pdf { background: #059669; border-color: #059669; }
  .pbtn-pdf:hover { background: #047857; }
  .pages-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 16px 8px 32px;
  }
  .sheet {
    width: ${isLandscape ? '281mm' : '194mm'};
    height: ${isLandscape ? '194mm' : '281mm'};
    background: #ffffff;
    padding: 3mm 4mm;
    box-shadow: 0 6px 20px rgba(15, 23, 42, 0.18);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
  }
  .sheet:last-child {
    page-break-after: auto;
    break-after: auto;
  }
  .sheet-head {
    border-bottom: 1.5px solid #1e293b;
    padding-bottom: 1.5mm;
    margin-bottom: 1.5mm;
    flex-shrink: 0;
  }
  .head-top {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 8px;
  }
  .head-title {
    font-size: 13pt;
    font-weight: 800;
    color: #0f172a;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .head-meta {
    font-size: 9.5pt;
    font-weight: 600;
    color: #475569;
    white-space: nowrap;
  }
  .student-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 6px;
    margin-top: 1mm;
    font-size: 10pt;
    font-weight: 500;
  }
  .score-pill {
    border: 1px solid #334155;
    border-radius: 4px;
    padding: 0.4mm 2mm;
    font-weight: 700;
    font-size: 9.5pt;
  }
  .concept-100-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    flex: 1 1 auto;
  }
  .concept-cell {
    position: relative;
    border: 1px solid #475569;
    padding: 0.8mm 1.5mm;
    text-align: center;
    vertical-align: middle;
    overflow: hidden;
    background: #ffffff;
  }
  .concept-cell-empty {
    background: #f8fafc;
    border-style: dashed;
  }
  .cell-num {
    position: absolute;
    top: 0.4mm;
    left: 1mm;
    font-size: 7pt;
    font-weight: 600;
    color: #64748b;
    line-height: 1;
  }
  .cell-check {
    position: absolute;
    top: 0.3mm;
    right: 1mm;
    font-size: 8.5pt;
    color: #475569;
    line-height: 1;
  }
  .cell-inner {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    padding-top: 0.6mm;
  }
  .cell-word {
    font-weight: 700;
    line-height: 1.12;
    color: #0f172a;
    word-break: keep-all;
    overflow-wrap: anywhere;
  }
  .cell-reading {
    font-size: 7.5pt;
    font-weight: 500;
    color: #475569;
    line-height: 1.05;
    margin-top: 0.3mm;
  }
  .concept-cell.fs-xl .cell-word { font-size: ${fs.xl}; }
  .concept-cell.fs-lg .cell-word { font-size: ${fs.lg}; }
  .concept-cell.fs-md .cell-word { font-size: ${fs.md}; }
  .concept-cell.fs-sm .cell-word { font-size: ${fs.sm}; }
  .concept-cell.fs-xs .cell-word { font-size: ${fs.xs}; }
  .sheet-foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-top: 1px solid #cbd5e1;
    padding-top: 1mm;
    margin-top: 1.2mm;
    font-size: 8.5pt;
    color: #475569;
    flex-shrink: 0;
  }
  .teacher-key-sheet {
    height: auto;
    min-height: ${isLandscape ? '194mm' : '281mm'};
    overflow: visible;
  }
  .teacher-key-sheet .key-columns {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 3mm;
    flex: 1 1 auto;
    align-content: start;
  }
  .teacher-key-sheet .key-columns.cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 2.5mm;
  }
  .key-col {
    min-width: 0;
  }
  .key-row {
    font-size: ${isLandscape ? '6.7pt' : '7.5pt'};
    line-height: ${isLandscape ? '1.14' : '1.18'};
    border-bottom: 0.5px dotted #cbd5e1;
    padding: ${isLandscape ? '0.18mm 0' : '0.28mm 0'};
    white-space: normal;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  .key-num { font-weight: 700; color: #0369a1; margin-right: 2px; }
  .key-word { font-weight: 700; color: #0f172a; }
  .key-reading { color: #475569; margin-left: 3px; font-size: ${isLandscape ? '6.3pt' : '7pt'}; }
  .key-meaning { color: #334155; margin-left: 3px; }
  @media print {
    html, body { background: #ffffff !important; }
    .no-print { display: none !important; }
    .pages-wrap { padding: 0; gap: 0; display: block; }
    .sheet {
      width: 100% !important;
      height: ${isLandscape ? '194mm' : '281mm'} !important;
      padding: 0 !important;
      box-shadow: none !important;
      margin: 0 !important;
    }
    .teacher-key-sheet {
      height: auto !important;
      min-height: ${isLandscape ? '194mm' : '281mm'} !important;
      overflow: visible !important;
    }
  }
</style>
</head>
<body>
  <div class="preview-toolbar no-print">
    <div class="preview-toolbar-left">
      <div class="preview-toolbar-title">📄 พรีวิวใบงาน 100 ช่อง (${escapeHtml(preset.label)})</div>
      <div class="preview-toolbar-hint">กด "📄 บันทึกเป็น PDF" แล้วเลือกปลายทาง <strong>Save as PDF / บันทึกเป็น PDF</strong> เพื่อส่งออกไฟล์ PDF คมชัด</div>
    </div>
    <div class="preview-actions">
      <button type="button" class="pbtn" id="btn-reroll-100" onclick="window.__rerollConceptGrid && window.__rerollConceptGrid()">🎲 สุ่มชุดใหม่</button>
      <button type="button" class="pbtn pbtn-pdf" onclick="window.print()">📄 บันทึกเป็น PDF</button>
      <button type="button" class="pbtn pbtn-primary" onclick="window.print()">🖨️ สั่งพิมพ์</button>
      <button type="button" class="pbtn" onclick="window.close()">✖️ ปิด</button>
    </div>
  </div>
  <main class="pages-wrap">
    ${pagesHtml}
  </main>
</body>
</html>`;
  }

  function openConceptGrid100Preview(items, options = {}) {
    const win = window.open('', '_blank');
    if (!win) return null;

    const writeDoc = (opts) => {
      const html = renderConceptGrid100(items, opts);
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.__rerollConceptGrid = function () {
        const nextOpts = Object.assign({}, opts, {
          shuffle: true,
          seed: (Date.now() ^ Math.floor(Math.random() * 1e6)) & 0x7fffffff,
        });
        writeDoc(nextOpts);
      };
    };

    writeDoc(options);
    return win;
  }

  const toolsApi = {
    generateA4: generateA4,
    openPrintModal: openPrintModal,
    closePrintModal: closePrintModal,
    CONCEPT_GRID_PRESETS: CONCEPT_GRID_PRESETS,
    normalizeConceptItems: normalizeConceptItems,
    computeConceptCellTypography: computeConceptCellTypography,
    renderConceptGrid100: renderConceptGrid100,
    openConceptGrid100Preview: openConceptGrid100Preview,
  };

  window.KampaiWorksheetTools = toolsApi;

  // Expose/merge global window.KampaiWorksheet API without overwriting runtime methods
  if (window.KampaiWorksheet && typeof window.KampaiWorksheet === 'object') {
    if (Object.isFrozen(window.KampaiWorksheet)) {
      window.KampaiWorksheet = Object.assign({}, window.KampaiWorksheet, {
        generateA4: generateA4,
        openPrintModal: openPrintModal,
        closePrintModal: closePrintModal,
        renderConceptGrid100: renderConceptGrid100,
        openConceptGrid100Preview: openConceptGrid100Preview,
      });
    } else {
      Object.assign(window.KampaiWorksheet, {
        generateA4: generateA4,
        openPrintModal: openPrintModal,
        closePrintModal: closePrintModal,
        renderConceptGrid100: renderConceptGrid100,
        openConceptGrid100Preview: openConceptGrid100Preview,
      });
    }
  } else {
    window.KampaiWorksheet = {
      generateA4: generateA4,
      openPrintModal: openPrintModal,
      closePrintModal: closePrintModal,
      renderConceptGrid100: renderConceptGrid100,
      openConceptGrid100Preview: openConceptGrid100Preview,
    };
  }
})();
