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
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }
    @media (max-width: 600px) {
      .ws-key-grid { grid-template-columns: 1fr 1fr; }
    }
    .ws-key-item {
      border: 1px solid var(--ws-border-light);
      border-radius: 4px;
      padding: 6px 8px;
      background: #ffffff;
      font-size: 13.5px;
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

  // Expose global window.KampaiWorksheet API
  window.KampaiWorksheet = {
    generateA4: generateA4,
    openPrintModal: openPrintModal,
    closePrintModal: closePrintModal
  };
})();
