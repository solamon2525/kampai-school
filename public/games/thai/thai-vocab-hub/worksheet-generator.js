/* worksheet-generator.js — ระบบสร้างและพิมพ์ใบงานภาษาไทย A4 สำหรับครูผู้สอน (Thai Vocab Hub) */
(function () {
  'use strict';

  function sanitize(str) {
    return (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pickRandom(arr, n) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
  }

  function segmentThaiGraphemes(str) {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter('th', { granularity: 'grapheme' });
      return [...segmenter.segment(str)].map(x => x.segment);
    }
    const parts = [];
    for (let i = 0; i < str.length; i++) {
      let ch = str[i];
      while (i + 1 < str.length && /[\u0E31\u0E34-\u0E3A\u0E47-\u0E4E]/.test(str[i + 1])) {
        ch += str[++i];
      }
      parts.push(ch);
    }
    return parts;
  }

  function generateCrosswordGrid(wordPool, maxWords = 8, gridSize = 10) {
    const grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(''));
    const placed = [];
    const candidates = pickRandom(wordPool, Math.min(maxWords * 4, wordPool.length))
      .map(w => ({ item: w, letters: segmentThaiGraphemes(w.word) }))
      .filter(w => w.letters.length >= 3 && w.letters.length <= gridSize)
      .sort((a, b) => b.letters.length - a.letters.length);

    for (const cand of candidates) {
      if (placed.length >= maxWords) break;
      const { item, letters } = cand;
      let placedSuccess = false;
      for (let attempt = 0; attempt < 120 && !placedSuccess; attempt++) {
        const isHoriz = Math.random() < 0.5;
        const maxR = isHoriz ? gridSize : gridSize - letters.length;
        const maxC = isHoriz ? gridSize - letters.length : gridSize;
        if (maxR <= 0 || maxC <= 0) continue;
        const r = Math.floor(Math.random() * maxR);
        const c = Math.floor(Math.random() * maxC);

        let fits = true;
        for (let i = 0; i < letters.length; i++) {
          const cr = isHoriz ? r : r + i;
          const cc = isHoriz ? c + i : c;
          if (grid[cr][cc] !== '' && grid[cr][cc] !== letters[i]) {
            fits = false;
            break;
          }
        }
        if (fits) {
          const coords = [];
          for (let i = 0; i < letters.length; i++) {
            const cr = isHoriz ? r : r + i;
            const cc = isHoriz ? c + i : c;
            grid[cr][cc] = letters[i];
            coords.push({ r: cr, c: cc });
          }
          placed.push({
            word: item.word,
            reading: item.reading,
            meaning: item.meaning,
            example: item.example,
            pos: item.pos,
            r,
            c,
            isHoriz,
            coords,
            len: letters.length
          });
          placedSuccess = true;
        }
      }
    }

    const FILLER = ['ก', 'ข', 'ค', 'ง', 'จ', 'ช', 'ด', 'ต', 'ถ', 'ท', 'น', 'บ', 'ป', 'ผ', 'พ', 'ฟ', 'ม', 'ย', 'ร', 'ล', 'ว', 'ส', 'ห', 'อ'];
    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        if (!grid[r][c]) {
          grid[r][c] = FILLER[Math.floor(Math.random() * FILLER.length)];
        }
      }
    }

    return { grid, placed, gridSize };
  }

  function openWorksheetModal(activeCat, words) {
    let modal = document.getElementById('tvh-worksheet-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'tvh-worksheet-modal';
      modal.className = 'tvh-modal-backdrop';
      modal.innerHTML = `
        <div class="tvh-modal-card" role="dialog" aria-modal="true" aria-labelledby="tvh-ws-title">
          <div class="tvh-modal-header">
            <h2 id="tvh-ws-title">🖨️ สร้างใบงานแบบฝึกหัด A4 (พร้อมพิมพ์)</h2>
            <button type="button" class="tvh-modal-close" onclick="window.ThaiVocabWorksheet.closeModal()">×</button>
          </div>
          <div class="tvh-modal-body">
            <p class="tvh-modal-desc">จัดหน้า A4 พอดี 1 หน้ากระดาษ พร้อมช่องคะแนนและใบเฉลยสำหรับครู</p>
            
            <div class="tvh-form-group">
              <label for="ws-type">รูปแบบใบงาน:</label>
              <select id="ws-type" class="tvh-select">
                <option value="dictation-10">✍️ ใบงานเขียนตามคำบอก (10 ข้อ)</option>
                <option value="dictation-20" selected>✍️ ใบงานเขียนตามคำบอก (20 ข้อ)</option>
                <option value="matching-10">🔗 ใบงานโยงเส้นจับคู่ความหมาย (10 ข้อ)</option>
                <option value="crossword-grid">🧩 ใบงานตารางค้นหาคำศัพท์ / ปริศนาอักษร (Word Search & Crossword)</option>
              </select>
            </div>

            <div class="tvh-form-group">
              <label for="ws-grade">ระดับชั้นเป้าหมาย:</label>
              <select id="ws-grade" class="tvh-select">
                <option value="all" selected>ทุกระดับชั้นในหมวด (ป.4 - ป.6)</option>
                <option value="ป.4">เฉพาะคำศัพท์ ป.4</option>
                <option value="ป.5">เฉพาะคำศัพท์ ป.5</option>
                <option value="ป.6">เฉพาะคำศัพท์ ป.6</option>
              </select>
            </div>

            <div class="tvh-form-group tvh-checkbox-group">
              <label>
                <input type="checkbox" id="ws-answer-key" checked>
                แนบแผ่นเฉลยสำหรับครู (Answer Key)
              </label>
            </div>
          </div>
          <div class="tvh-modal-footer">
            <button type="button" class="cbtn" onclick="window.ThaiVocabWorksheet.closeModal()">ยกเลิก</button>
            <button type="button" class="btn btn-primary" onclick="window.ThaiVocabWorksheet.confirmPrint()">🖨️ เปิดหน้าต่างพิมพ์ A4</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    modal.dataset.slug = activeCat ? activeCat.slug : '';
    modal.dataset.catTitle = activeCat ? activeCat.title : 'คลังคำศัพท์ภาษาไทย';
    modal.style.display = 'flex';
  }

  function closeModal() {
    const modal = document.getElementById('tvh-worksheet-modal');
    if (modal) modal.style.display = 'none';
  }

  function confirmPrint() {
    const modal = document.getElementById('tvh-worksheet-modal');
    if (!modal) return;
    const slug = modal.dataset.slug;
    const catTitle = modal.dataset.catTitle;
    const type = document.getElementById('ws-type').value;
    const grade = document.getElementById('ws-grade').value;
    const includeAnswerKey = document.getElementById('ws-answer-key').checked;

    const allCatWords = (window.GAME_DATA && window.GAME_DATA.words && window.GAME_DATA.words[slug]) || [];
    let pool = allCatWords.filter(w => w && w.content_status !== 'quarantined');
    if (grade !== 'all') {
      const minRequired = (type === 'crossword-grid') ? 6 : 10;
      const filtered = pool.filter(w => w.grade === grade);
      if (filtered.length >= minRequired) pool = filtered;
    }

    if (!pool.length) {
      alert('ไม่พบคำศัพท์ในระดับชั้นที่เลือก กรุณาเลือกตัวเลือกอื่น');
      return;
    }

    closeModal();
    generateAndPrint({
      type,
      grade,
      catTitle,
      words: pool,
      includeAnswerKey,
    });
  }

  function generateAndPrint(options) {
    const { type, grade, catTitle, words, includeAnswerKey } = options;
    const isDictation20 = type === 'dictation-20';
    const isMatching = type === 'matching-10';
    const isCrossword = type === 'crossword-grid';
    const count = isDictation20 ? 20 : (isCrossword ? 8 : 10);

    const crossword = isCrossword ? generateCrosswordGrid(words, 8, 10) : null;
    const selectedWords = (isCrossword && crossword) ? crossword.placed : pickRandom(words, Math.min(count, words.length));
    const gradeLabel = grade === 'all' ? 'ประถมศึกษาปีที่ ๔ - ๖' : `ประถมศึกษาปีที่ ${grade.replace('ป.', '')}`;

    let printHtml = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>ใบงานภาษาไทย — ${sanitize(catTitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4 portrait; margin: 15mm 15mm 12mm 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Sarabun', sans-serif;
    color: #000;
    background: #fff;
    line-height: 1.5;
    font-size: 14pt;
  }
  .sheet {
    width: 100%;
    min-height: 260mm;
    page-break-after: always;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .sheet:last-child {
    page-break-after: avoid;
  }
  .header {
    text-align: center;
    border-bottom: 2px solid #000;
    padding-bottom: 8px;
    margin-bottom: 12px;
  }
  .header h1 {
    font-size: 18pt;
    font-weight: 700;
  }
  .header h2 {
    font-size: 15pt;
    font-weight: 600;
    margin-top: 2px;
  }
  .info-bar {
    display: flex;
    justify-content: space-between;
    font-size: 13pt;
    margin-bottom: 12px;
    padding: 4px 0;
  }
  .score-box {
    border: 2px solid #000;
    padding: 6px 14px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 13pt;
    text-align: center;
  }
  .instructions {
    background: #f1f5f9;
    border-left: 4px solid #0284c7;
    padding: 6px 12px;
    font-size: 12pt;
    margin-bottom: 14px;
    font-weight: 500;
  }
  
  /* Dictation Grid */
  .dictation-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px 24px;
    margin-bottom: 16px;
  }
  .dictation-item {
    display: flex;
    align-items: flex-end;
    font-size: 13.5pt;
    padding: 4px 0;
  }
  .item-num {
    width: 32px;
    font-weight: 600;
    flex-shrink: 0;
  }
  .item-line {
    flex: 1;
    border-bottom: 1px dotted #000;
    height: 24px;
  }

  /* Matching Grid */
  .match-table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
  }
  .match-table th, .match-table td {
    padding: 8px 10px;
    font-size: 12.5pt;
    vertical-align: middle;
  }
  .match-table th {
    background: #f8fafc;
    border-bottom: 2px solid #000;
    font-weight: 700;
  }
  .match-bracket {
    width: 45px;
    text-align: center;
    font-weight: 700;
  }
  .match-left-word {
    width: 30%;
    font-weight: 600;
  }
  .match-right-choice {
    width: 50%;
  }

  /* Word Search & Crossword Grid */
  .crossword-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 8px;
  }
  .crossword-table {
    border-collapse: collapse;
    margin: 4px auto 10px auto;
  }
  .crossword-table th {
    font-size: 9.5pt;
    color: #64748b;
    padding: 2px 4px;
    text-align: center;
    font-weight: 600;
  }
  .crossword-table td {
    width: 32px;
    height: 32px;
    border: 1.5px solid #334155;
    text-align: center;
    vertical-align: middle;
    font-size: 15pt;
    font-weight: 600;
    line-height: 1;
    padding: 0;
  }
  .crossword-table td.cell-highlight {
    background: #fef08a !important;
    color: #854d0e !important;
    font-weight: 800 !important;
    border: 2px solid #ca8a04 !important;
  }
  .crossword-clues-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 6px 14px;
    width: 100%;
    margin-top: 6px;
  }
  .crossword-clue-item {
    font-size: 10.5pt;
    line-height: 1.35;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    padding: 4px 8px;
  }
  .crossword-clue-item .clue-num {
    font-weight: 700;
    color: #0369a1;
  }
  .crossword-clue-item .clue-line {
    display: inline-block;
    border-bottom: 1px dotted #000;
    min-width: 110px;
    margin-left: 4px;
  }

  .footer-sig {
    margin-top: auto;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-top: 10px;
    font-size: 11.5pt;
    border-top: 1px solid #ccc;
  }
  .teacher-sign {
    text-align: center;
  }
  @media print {
    body { background: #fff; }
    .no-print { display: none !important; }
  }
</style>
</head>
<body>
`;

    // ─── 1. Student Worksheet Page ─────────────────────────────────
    printHtml += `
  <div class="sheet">
    <div>
      <div class="header">
        <h1>โรงเรียนบ้านคำไผ่ สพป.ขอนแก่น เขต ๕</h1>
        <h2>แบบฝึกหัดกลุ่มสาระการเรียนรู้ภาษาไทย (${sanitize(gradeLabel)})</h2>
        <div style="font-size: 13pt; margin-top: 2px;">หน่วยการเรียนรู้: <strong>${sanitize(catTitle)}</strong></div>
      </div>

      <div class="info-bar">
        <div>
          ชื่อ - สกุล: .................................................................... ชั้น: .......... เลขที่: ..........
        </div>
        <div class="score-box">
          คะแนนเต็ม ${selectedWords.length}<br>
          ได้ ......... คะแนน
        </div>
      </div>

      <div class="instructions">
        <strong>คำชี้แจง:</strong> ${
          isCrossword
            ? `ให้นักเรียนค้นหาคำศัพท์ภาษาไทยที่ซ่อนอยู่ในตาราง (แนวนอน หรือแนวตั้ง) จำนวน ${selectedWords.length} คำ แล้ววงกลมล้อมรอบคำศัพท์ให้ถูกต้อง พร้อมเขียนคำศัพท์ลงในช่องว่างตามความหมายที่กำหนด`
            : (isMatching
                ? 'ให้นักเรียนนำพยัญชนะหน้าความหมายทางขวามือ มาใส่ลงในช่อง ( ) หน้าคำศัพท์ที่มีความหมายสัมพันธ์กันให้ถูกต้อง'
                : 'ให้นักเรียนฟังครูอ่านคำศัพท์ แล้วเขียนสะกดคำภาษาไทยลงในช่องว่างให้ถูกต้องตามหลักภาษาไทย')
        }
      </div>
`;

    if (isCrossword && crossword) {
      const thaiNumbers = ['๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙', '๑๐', '๑๑', '๑๒'];
      printHtml += `
      <div class="crossword-container">
        <table class="crossword-table">
          <thead>
            <tr>
              <th></th>
              ${Array.from({ length: crossword.gridSize }, (_, i) => `<th>${i + 1}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${crossword.grid.map((row, r) => `
              <tr>
                <th>${r + 1}</th>
                ${row.map(cell => `<td>${sanitize(cell)}</td>`).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="crossword-clues-grid">
          ${crossword.placed.map((item, idx) => `
            <div class="crossword-clue-item">
              <span class="clue-num">${thaiNumbers[idx]}.</span>
              <strong>${sanitize(item.meaning)}</strong>
              <br>
              <span>คำที่พบ: </span><span class="clue-line"></span>
              <span style="font-size:9pt; color:#64748b;">(${item.len} ตัวอักษร${item.pos ? ' / ' + item.pos : ''})</span>
            </div>
          `).join('')}
        </div>
      </div>
      `;
    } else if (isMatching) {
      // Shuffle meanings on the right
      const thaiNumbers = ['๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙', '๑๐'];
      const thaiLetters = ['ก', 'ข', 'ค', 'ง', 'จ', 'ฉ', 'ช', 'ซ', 'ฌ', 'ญ'];
      const meaningsShuffled = pickRandom(selectedWords, selectedWords.length);

      printHtml += `
      <table class="match-table">
        <thead>
          <tr>
            <th class="match-bracket">เลือก</th>
            <th>ข้อที่ / คำศัพท์</th>
            <th>ความหมาย</th>
          </tr>
        </thead>
        <tbody>
      `;

      selectedWords.forEach((wordItem, idx) => {
        const rightItem = meaningsShuffled[idx];
        printHtml += `
          <tr>
            <td class="match-bracket">( &nbsp;&nbsp;&nbsp; )</td>
            <td class="match-left-word">${thaiNumbers[idx]}. <strong>${sanitize(wordItem.word)}</strong></td>
            <td class="match-right-choice"><strong>${thaiLetters[idx]}.</strong> ${sanitize(rightItem.meaning)}</td>
          </tr>
        `;
      });

      printHtml += `
        </tbody>
      </table>
      `;
    } else {
      // Dictation Grid (2 columns)
      const thaiNumbers = ['๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙', '๑๐', '๑๑', '๑๒', '๑๓', '๑๔', '๑๕', '๑๖', '๑๗', '๑๘', '๑๙', '๒๐'];
      printHtml += `<div class="dictation-grid">`;
      selectedWords.forEach((_, idx) => {
        printHtml += `
          <div class="dictation-item">
            <span class="item-num">${thaiNumbers[idx]}.</span>
            <span class="item-line"></span>
          </div>
        `;
      });
      printHtml += `</div>`;
    }

    printHtml += `
    </div>

    <div class="footer-sig">
      <div>วันที่ประเมิน: ...... / ................ / ๒๕......</div>
      <div class="teacher-sign">
        ลงชื่อ ........................................................... ครูผู้สอน<br>
        ( นายณัฐพงศ์ สิงห์ชมภู )
      </div>
    </div>
  </div>
`;

    // ─── 2. Teacher Answer Key Page (Optional) ────────────────────
    if (includeAnswerKey) {
      const thaiNumbers = ['๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙', '๑๐', '๑๑', '๑๒', '๑๓', '๑๔', '๑๕', '๑๖', '๑๗', '๑๘', '๑๙', '๒๐'];
      if (isCrossword && crossword) {
        const answerCoordsSet = new Set();
        crossword.placed.forEach(p => p.coords.forEach(pt => answerCoordsSet.add(`${pt.r},${pt.c}`)));

        printHtml += `
  <div class="sheet">
    <div>
      <div class="header">
        <h1>[ แผ่นเฉลยสำหรับครูผู้สอน ]</h1>
        <h2>เฉลยตารางค้นหาคำศัพท์ / ปริศนาอักษร: ${sanitize(catTitle)} (${sanitize(gradeLabel)})</h2>
      </div>

      <div class="instructions" style="background:#fef3c7; border-left-color:#d97706;">
        <strong>แนวการตรวจให้คะแนน:</strong> แผ่นเฉลยระบุตำแหน่งคำศัพท์ในตาราง (เน้นพื้นหลังสีเหลือง) พร้อมพิกัดแถว-หลัก เพื่อความสะดวกในการตรวจอย่างรวดเร็ว
      </div>

      <div class="crossword-container">
        <table class="crossword-table">
          <thead>
            <tr>
              <th></th>
              ${Array.from({ length: crossword.gridSize }, (_, i) => `<th>${i + 1}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${crossword.grid.map((row, r) => `
              <tr>
                <th>${r + 1}</th>
                ${row.map((cell, c) => {
                  const isAns = answerCoordsSet.has(`${r},${c}`);
                  return `<td class="${isAns ? 'cell-highlight' : ''}">${sanitize(cell)}</td>`;
                }).join('')}
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <table style="width:100%; border-collapse:collapse; margin-top:6px;" border="1" cellpadding="5">
        <thead>
          <tr style="background:#f1f5f9; font-size:10.5pt;">
            <th style="width:36px; text-align:center;">ข้อ</th>
            <th style="width:150px;">คำศัพท์ [ คำอ่าน ]</th>
            <th style="width:160px;">ตำแหน่งในตาราง</th>
            <th>ความหมาย / ตัวอย่าง</th>
          </tr>
        </thead>
        <tbody>
          ${crossword.placed.map((item, idx) => `
            <tr style="font-size:10.5pt;">
              <td style="text-align:center; font-weight:700;">${thaiNumbers[idx]}</td>
              <td style="font-weight:700;">${sanitize(item.word)} <span style="font-size:9pt; font-weight:normal; color:#475569;">[ ${sanitize(item.reading)} ]</span></td>
              <td><strong style="color:#0369a1;">${item.isHoriz ? `แนวนอน แถว ${item.r + 1} (หลัก ${item.c + 1}-${item.c + item.len})` : `แนวตั้ง หลัก ${item.c + 1} (แถว ${item.r + 1}-${item.r + item.len})`}</strong></td>
              <td>
                ${sanitize(item.meaning)}
                ${item.example ? `<br><em style="color:#475569; font-size:9.5pt;">ตัวอย่าง: “${sanitize(item.example)}”</em>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer-sig">
      <div>โรงเรียนบ้านคำไผ่ สพป.ขอนแก่น เขต ๕</div>
      <div class="teacher-sign">ครูผู้ตรวจ: นายณัฐพงศ์ สิงห์ชมภู</div>
    </div>
  </div>
        `;
      } else {
        printHtml += `
  <div class="sheet">
    <div>
      <div class="header">
        <h1>[ แผ่นเฉลยสำหรับครูผู้สอน ]</h1>
        <h2>เฉลยแบบฝึกหัดภาษาไทย: ${sanitize(catTitle)} (${sanitize(gradeLabel)})</h2>
      </div>

      <div class="instructions" style="background:#fef3c7; border-left-color:#d97706;">
        <strong>แนวการตรวจและอ่านคำศัพท์:</strong> ให้อ่านคำศัพท์ทีละคำ ชัดถ้อยชัดคำ เว้นระยะคำละ ๑๕ - ๒๐ วินาที เพื่อให้นักเรียนสะกดเขียน
      </div>

      <table style="width:100%; border-collapse:collapse; margin-top:12px;" border="1" cellpadding="6">
        <thead>
          <tr style="background:#f1f5f9;">
            <th style="width:40px; text-align:center;">ข้อ</th>
            <th style="width:160px;">คำศัพท์</th>
            <th style="width:160px;">คำอ่าน</th>
            <th>ความหมาย / ตัวอย่างประโยค</th>
          </tr>
        </thead>
        <tbody>
      `;

        selectedWords.forEach((wordItem, idx) => {
          printHtml += `
          <tr>
            <td style="text-align:center; font-weight:600;">${thaiNumbers[idx]}</td>
            <td style="font-weight:700;">${sanitize(wordItem.word)}</td>
            <td>[ ${sanitize(wordItem.reading)} ]</td>
            <td style="font-size:11.5pt;">
              ${sanitize(wordItem.meaning)}
              ${wordItem.example ? `<br><em style="color:#475569;">ตัวอย่าง: “${sanitize(wordItem.example)}”</em>` : ''}
            </td>
          </tr>
          `;
        });

        printHtml += `
        </tbody>
      </table>
    </div>

    <div class="footer-sig">
      <div>โรงเรียนบ้านคำไผ่ สพป.ขอนแก่น เขต ๕</div>
      <div class="teacher-sign">ครูผู้ตรวจ: นายณัฐพงศ์ สิงห์ชมภู</div>
    </div>
  </div>
        `;
      }
    }

    printHtml += `
<script>
  window.onload = function() {
    window.print();
  };
</script>
</body>
</html>`;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(printHtml);
      printWin.document.close();
    } else {
      alert('เบราว์เซอร์บล็อกหน้าต่างป็อปอัป กรุณาอนุญาตป็อปอัปเพื่อให้ระบบเปิดหน้าพิมพ์ใบงานได้ครับ');
    }
  }

  window.ThaiVocabWorksheet = {
    openModal: openWorksheetModal,
    closeModal,
    confirmPrint,
    generateAndPrint,
  };
})();
