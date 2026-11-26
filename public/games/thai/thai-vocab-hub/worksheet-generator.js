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

  function getApprovedCategoryCount(slug, grade) {
    const list = (window.GAME_DATA && window.GAME_DATA.words && window.GAME_DATA.words[slug]) || [];
    const targetGrade = grade && grade !== 'all' ? grade : null;
    let count = 0;
    for (let i = 0; i < list.length; i++) {
      const w = list[i];
      if (!w || w.content_status === 'quarantined') continue;
      if (targetGrade && w.grade !== targetGrade) continue;
      count++;
    }
    return count;
  }

  function render100CategoryList() {
    const grid = document.getElementById('ws100-cat-grid');
    if (!grid) return;
    const cats = (window.GAME_DATA && window.GAME_DATA.categories) || [];
    const grade = (document.getElementById('ws-grade') && document.getElementById('ws-grade').value) || 'all';
    const prevChecked = new Set(
      Array.from(grid.querySelectorAll('input[type="checkbox"]:checked')).map(el => el.value)
    );
    const hasPrev = grid.dataset.initialized === '1';

    grid.innerHTML = cats.map((cat, idx) => {
      const count = getApprovedCategoryCount(cat.slug, grade);
      const checked = hasPrev ? prevChecked.has(cat.slug) : idx < 4;
      return `
        <label class="ws100-cat-chip">
          <input type="checkbox" name="ws100-cat" value="${sanitize(cat.slug)}" ${checked ? 'checked' : ''}>
          <span class="ws100-cat-icon">${sanitize(cat.icon || '📚')}</span>
          <span class="ws100-cat-name">${sanitize(cat.title || cat.slug)}</span>
          <span class="ws100-cat-count">${count}</span>
        </label>`;
    }).join('');
    grid.dataset.initialized = '1';
    update100PoolSummary();
  }

  function getSelected100Slugs() {
    const grid = document.getElementById('ws100-cat-grid');
    if (!grid) return [];
    return Array.from(grid.querySelectorAll('input[type="checkbox"]:checked')).map(el => el.value);
  }

  function setSelected100Slugs(slugs) {
    const grid = document.getElementById('ws100-cat-grid');
    if (!grid) return;
    const set = new Set(slugs);
    grid.querySelectorAll('input[type="checkbox"]').forEach((el) => {
      el.checked = set.has(el.value);
    });
    update100PoolSummary();
  }

  function randomize100Categories(count) {
    const cats = (window.GAME_DATA && window.GAME_DATA.categories) || [];
    const shuffled = [...cats].sort(() => 0.5 - Math.random());
    const chosen = shuffled.slice(0, Math.min(count, shuffled.length)).map(c => c.slug);
    setSelected100Slugs(chosen);
  }

  function update100PoolSummary() {
    const el = document.getElementById('ws100-pool-summary');
    if (!el || !window.ThaiVocabSheet100) return;
    const slugs = getSelected100Slugs();
    const grade = (document.getElementById('ws-grade') && document.getElementById('ws-grade').value) || 'all';
    if (!slugs.length) {
      el.textContent = '⚠️ กรุณาเลือกอย่างน้อย 1 หมวดหมู่';
      el.classList.add('is-warn');
      return;
    }
    const pool = window.ThaiVocabSheet100.collectPoolWords(
      window.GAME_DATA && window.GAME_DATA.words,
      window.GAME_DATA && window.GAME_DATA.categories,
      slugs,
      grade
    );
    const setsPossible = Math.max(1, Math.floor(pool.length / 100));
    el.classList.remove('is-warn');
    el.textContent = pool.length >= 100
      ? `✅ เลือก ${slugs.length} หมวด · คำไม่ซ้ำ ${pool.length.toLocaleString()} คำ (สร้างได้ ${setsPossible} ชุด ชุดละ 100 คำ)`
      : `ℹ️ เลือก ${slugs.length} หมวด · มี ${pool.length} คำ (แนะนำเลือกเพิ่มให้ครบ 100 คำ หรือพิมพ์ตามจำนวนที่มี)`;
  }

  function toggleWorksheetModeUI() {
    const typeEl = document.getElementById('ws-type');
    const panel100 = document.getElementById('ws-100-panel');
    const answerLabel = document.getElementById('ws-answer-key-label');
    if (!typeEl || !panel100) return;
    const is100 = typeEl.value === 'vocab-sheet-100';
    panel100.style.display = is100 ? 'flex' : 'none';
    if (answerLabel) {
      answerLabel.textContent = is100
        ? 'แนบแผ่นคำอ่านและคำศัพท์สำหรับครู (หน้าถัดไป)'
        : 'แนบแผ่นเฉลยสำหรับครู (Answer Key)';
    }
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
            <h2 id="tvh-ws-title">🖨️ สร้างใบงานแบบฝึกหัด A4 (พร้อมพิมพ์ / PDF)</h2>
            <button type="button" class="tvh-modal-close" onclick="window.ThaiVocabWorksheet.closeModal()">×</button>
          </div>
          <div class="tvh-modal-body">
            <p class="tvh-modal-desc">จัดหน้า A4 พอดีกระดาษ รองรับชุดคำศัพท์ 100 คำแบบเลือก/สุ่มหลายหมวด พร้อมส่งออก PDF</p>
            
            <div class="tvh-form-group">
              <label for="ws-type">รูปแบบใบงาน:</label>
              <select id="ws-type" class="tvh-select">
                <option value="vocab-sheet-100">📋 ชุดคำศัพท์ 100 คำ (ตารางเต็มแผ่น A4 เลือก/สุ่มหลายหมวด)</option>
                <option value="dictation-10">✍️ ใบงานเขียนตามคำบอก (10 ข้อ)</option>
                <option value="dictation-20" selected>✍️ ใบงานเขียนตามคำบอก (20 ข้อ)</option>
                <option value="matching-10">🔗 ใบงานโยงเส้นจับคู่ความหมาย (10 ข้อ)</option>
                <option value="crossword-grid">🧩 ใบงานตารางค้นหาคำศัพท์ / ปริศนาอักษร (Word Search & Crossword)</option>
                <option value="storyboard-idioms">🎬 ใบงานเรื่องเล่าสำนวนไทย (จากภาพเรื่องราว)</option>
              </select>
            </div>

            <div class="tvh-form-group">
              <label for="ws-grade">ระดับชั้นเป้าหมาย:</label>
              <select id="ws-grade" class="tvh-select">
                <option value="all" selected>ทุกระดับชั้น (ป.4 - ป.6)</option>
                <option value="ป.4">เฉพาะคำศัพท์ ป.4</option>
                <option value="ป.5">เฉพาะคำศัพท์ ป.5</option>
                <option value="ป.6">เฉพาะคำศัพท์ ป.6</option>
              </select>
            </div>

            <div id="ws-100-panel" class="ws100-panel" style="display:none">
              <div class="ws100-section-head">
                <span>เลือกหมวดคำศัพท์ที่ต้องการรวมในชุด (สุ่มหรือเลือกเองได้):</span>
                <div class="ws100-quick-actions">
                  <button type="button" class="ws100-mini-btn" id="ws100-btn-all">เลือกทั้งหมด</button>
                  <button type="button" class="ws100-mini-btn" id="ws100-btn-clear">ล้าง</button>
                  <button type="button" class="ws100-mini-btn" id="ws100-btn-rand4">🎲 สุ่ม 4 หมวด</button>
                  <button type="button" class="ws100-mini-btn" id="ws100-btn-rand6">🎲 สุ่ม 6 หมวด</button>
                </div>
              </div>
              <div id="ws100-cat-grid" class="ws100-cat-grid"></div>
              <div id="ws100-pool-summary" class="ws100-pool-summary"></div>

              <div class="ws100-options-grid">
                <div class="tvh-form-group">
                  <label for="ws100-mix">วิธีรวมคำศัพท์:</label>
                  <select id="ws100-mix" class="tvh-select">
                    <option value="balanced" selected>⚖️ เฉลี่ยเท่ากันทุกหมวดที่เลือก</option>
                    <option value="random">🎲 สุ่มรวมจากทุกหมวดที่เลือก</option>
                    <option value="sequential">🔢 เรียงตามลำดับในคลัง</option>
                  </select>
                </div>
                <div class="tvh-form-group">
                  <label for="ws100-preset">ขนาดตาราง A4 (100 ช่อง):</label>
                  <select id="ws100-preset" class="tvh-select">
                    <option value="5x20-portrait" selected>📄 แนวตั้ง 5×20 ช่อง (ตัวใหญ่สุด)</option>
                    <option value="4x25-portrait">📄 แนวตั้ง 4×25 ช่อง (คำ/สำนวนยาว)</option>
                    <option value="5x20-landscape">📃 แนวนอน 5×20 ช่อง (ช่องกว้าง)</option>
                    <option value="10x10-landscape">📃 แนวนอน 10×10 ช่อง (จัตุรัส)</option>
                  </select>
                </div>
                <div class="tvh-form-group">
                  <label for="ws100-set-count">จำนวนชุดที่สร้าง:</label>
                  <select id="ws100-set-count" class="tvh-select">
                    <option value="1" selected>1 ชุด (100 คำ)</option>
                    <option value="2">2 ชุด (200 คำ ไม่ซ้ำ)</option>
                    <option value="3">3 ชุด (300 คำ ไม่ซ้ำ)</option>
                    <option value="5">5 ชุด (500 คำ ไม่ซ้ำ)</option>
                  </select>
                </div>
              </div>

              <div class="ws100-toggles">
                <label><input type="checkbox" id="ws100-numbers" checked> แสดงเลขข้อ 1–100</label>
                <label><input type="checkbox" id="ws100-reading"> แสดงคำอ่าน [...]</label>
                <label><input type="checkbox" id="ws100-checkbox"> ช่องติ๊กทดสอบอ่าน ☐</label>
              </div>
            </div>

            <div class="tvh-form-group tvh-checkbox-group">
              <label>
                <input type="checkbox" id="ws-answer-key" checked>
                <span id="ws-answer-key-label">แนบแผ่นเฉลยสำหรับครู (Answer Key)</span>
              </label>
            </div>
          </div>
          <div class="tvh-modal-footer">
            <button type="button" class="cbtn" onclick="window.ThaiVocabWorksheet.closeModal()">ยกเลิก</button>
            <button type="button" class="btn btn-primary" onclick="window.ThaiVocabWorksheet.confirmPrint()">🖨️ เปิดหน้าพิมพ์ / Export PDF</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      document.getElementById('ws-type').addEventListener('change', toggleWorksheetModeUI);
      document.getElementById('ws-grade').addEventListener('change', () => {
        render100CategoryList();
      });
      document.getElementById('ws100-cat-grid').addEventListener('change', update100PoolSummary);
      document.getElementById('ws100-btn-all').addEventListener('click', () => {
        const cats = (window.GAME_DATA && window.GAME_DATA.categories) || [];
        setSelected100Slugs(cats.map(c => c.slug));
      });
      document.getElementById('ws100-btn-clear').addEventListener('click', () => setSelected100Slugs([]));
      document.getElementById('ws100-btn-rand4').addEventListener('click', () => randomize100Categories(4));
      document.getElementById('ws100-btn-rand6').addEventListener('click', () => randomize100Categories(6));
    }

    modal.dataset.slug = activeCat ? activeCat.slug : '';
    modal.dataset.catTitle = activeCat ? activeCat.title : 'คลังคำศัพท์ภาษาไทย';

    render100CategoryList();
    if (!activeCat) {
      document.getElementById('ws-type').value = 'vocab-sheet-100';
    } else if (activeCat.slug) {
      setSelected100Slugs([activeCat.slug]);
    }
    toggleWorksheetModeUI();
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

    if (type === 'vocab-sheet-100') {
      if (!window.ThaiVocabSheet100) {
        alert('ระบบสร้างชุดคำศัพท์ 100 คำกำลังโหลด กรุณาลองอีกครั้งครับ');
        return;
      }
      const selectedSlugs = getSelected100Slugs();
      if (!selectedSlugs.length) {
        alert('กรุณาเลือกอย่างน้อย 1 หมวดหมู่สำหรับรวมคำศัพท์ครับ');
        return;
      }
      const pool = window.ThaiVocabSheet100.collectPoolWords(
        window.GAME_DATA && window.GAME_DATA.words,
        window.GAME_DATA && window.GAME_DATA.categories,
        selectedSlugs,
        grade
      );
      if (!pool.length) {
        alert('ไม่พบคำศัพท์ในหมวดหมู่และระดับชั้นที่เลือก กรุณาเลือกตัวเลือกอื่นครับ');
        return;
      }
      const cats = (window.GAME_DATA && window.GAME_DATA.categories) || [];
      const catNames = selectedSlugs
        .map(s => (cats.find(c => c.slug === s) || {}).title || s);
      const categoriesSummary = catNames.length <= 3
        ? catNames.join(' + ')
        : `${catNames.slice(0, 2).join(' + ')} และอีก ${catNames.length - 2} หมวด`;

      const mixMode = document.getElementById('ws100-mix').value;
      const preset = document.getElementById('ws100-preset').value;
      const setCount = Number(document.getElementById('ws100-set-count').value) || 1;
      const showNumbers = document.getElementById('ws100-numbers').checked;
      const showReading = document.getElementById('ws100-reading').checked;
      const showCheckbox = document.getElementById('ws100-checkbox').checked;

      closeModal();
      const win = window.ThaiVocabSheet100.openPreviewWindow({
        pool,
        setSize: 100,
        setCount,
        mixMode,
        preset,
        grade,
        categoriesSummary,
        showNumbers,
        showReading,
        showCheckbox,
        includeTeacherKey: includeAnswerKey,
        title: 'ชุดคำศัพท์ภาษาไทย 100 คำ',
      });
      if (!win) {
        alert('เบราว์เซอร์บล็อกหน้าต่างป็อปอัป กรุณาอนุญาตป็อปอัปเพื่อให้ระบบเปิดหน้าพรีวิวพิมพ์/PDF ได้ครับ');
      }
      return;
    }

    let allCatWords = slug
      ? ((window.GAME_DATA && window.GAME_DATA.words && window.GAME_DATA.words[slug]) || [])
      : Object.values((window.GAME_DATA && window.GAME_DATA.words) || {}).flat();
    if (type === 'storyboard-idioms' && !allCatWords.some(w => w && w.images && w.images.length > 0)) {
      if (window.GAME_DATA && window.GAME_DATA.words && window.GAME_DATA.words.idioms) {
        allCatWords = window.GAME_DATA.words.idioms;
      }
    }
    let pool = allCatWords.filter(w => w && w.content_status !== 'quarantined');
    if (type === 'storyboard-idioms') {
      pool = pool.filter(w => w && w.images && w.images.length > 0);
    }
    if (grade !== 'all') {
      const minRequired = (type === 'crossword-grid') ? 6 : (type === 'storyboard-idioms' ? 1 : 10);
      const filtered = pool.filter(w => w.grade === grade);
      if (filtered.length >= minRequired) pool = filtered;
    }

    if (!pool.length) {
      alert(type === 'storyboard-idioms'
        ? 'ไม่พบสำนวนไทยที่มีภาพเรื่องราวในระดับชั้นนี้ กรุณาเลือกทุกระดับชั้นหรือหมวดสำนวนไทย'
        : 'ไม่พบคำศัพท์ในระดับชั้นที่เลือก กรุณาเลือกตัวเลือกอื่น');
      return;
    }

    closeModal();
    generateAndPrint({
      type,
      grade,
      catTitle: type === 'storyboard-idioms' ? 'สำนวนไทยมีคติ' : catTitle,
      words: pool,
      includeAnswerKey,
    });
  }

  function generateAndPrint(options) {
    const { type, grade, catTitle, words, includeAnswerKey } = options;
    if (type === 'storyboard-idioms') {
      const printHtml = generateStoryboardWorksheet(words, {
        grade,
        catTitle,
        includeAnswerKey,
        count: 2,
      });
      const printWin = window.open('', '_blank');
      if (printWin) {
        printWin.document.open();
        printWin.document.write(printHtml);
        printWin.document.close();
      } else {
        alert('เบราว์เซอร์บล็อกหน้าต่างป็อปอัป กรุณาอนุญาตป็อปอัปเพื่อให้ระบบเปิดหน้าพิมพ์ใบงานได้ครับ');
      }
      return;
    }
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

  function generateStoryboardWorksheet(words, options = {}) {
    const {
      grade = 'all',
      catTitle = 'สำนวนไทยมีคติ',
      includeAnswerKey = true,
      count = 2,
    } = options;

    const thaiNumbers = ['๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙', '๑๐', '๑๑', '๑๒'];
    const gradeLabel = grade === 'all' ? 'ประถมศึกษาปีที่ ๔ - ๖' : `ประถมศึกษาปีที่ ${String(grade).replace('ป.', '')}`;

    const pool = (words || []).filter((w) => w && Array.isArray(w.images) && w.images.length > 0);
    const selectedWords = (typeof shuffle === 'function' ? shuffle([...pool]) : pool.slice().sort(() => Math.random() - 0.5)).slice(0, Math.min(count, pool.length));

    let printHtml = `<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<title>ใบงานเรื่องเล่าสำนวนไทย — ${sanitize(catTitle)}</title>
<link href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  @page { size: A4 portrait; margin: 12mm 15mm 12mm 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Sarabun', sans-serif;
    color: #0f172a;
    background: #ffffff;
    line-height: 1.45;
    font-size: 13pt;
  }
  .sheet {
    width: 100%;
    min-height: 265mm;
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
    border-bottom: 2px solid #0f172a;
    padding-bottom: 6px;
    margin-bottom: 10px;
  }
  .header h1 {
    font-size: 17pt;
    font-weight: 700;
  }
  .header h2 {
    font-size: 14pt;
    font-weight: 600;
    margin-top: 2px;
  }
  .info-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12.5pt;
    margin-bottom: 10px;
    padding: 2px 0;
  }
  .score-box {
    border: 2px solid #0f172a;
    padding: 4px 14px;
    border-radius: 6px;
    font-weight: 700;
    font-size: 12pt;
    text-align: center;
    line-height: 1.3;
  }
  .instructions {
    background: #f1f5f9;
    border-left: 4px solid #0284c7;
    padding: 6px 12px;
    font-size: 11.5pt;
    margin-bottom: 12px;
    font-weight: 500;
  }
  .storyboard-item {
    border: 1.5px solid #94a3b8;
    border-radius: 8px;
    padding: 10px 12px;
    margin-bottom: 12px;
    background: #ffffff;
  }
  .storyboard-item-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    font-weight: 700;
    font-size: 13pt;
    color: #0369a1;
  }
  .storyboard-panels {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 8px;
  }
  .storyboard-panels.panels-2 {
    grid-template-columns: repeat(2, 1fr);
  }
  .storyboard-panel {
    border: 1px solid #cbd5e1;
    border-radius: 6px;
    overflow: hidden;
    background: #f8fafc;
    display: flex;
    flex-direction: column;
  }
  .storyboard-panel-img-wrap {
    width: 100%;
    aspect-ratio: 16 / 9;
    background: #e2e8f0;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .storyboard-panel-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
  }
  .storyboard-panel-tag {
    padding: 2px 4px;
    font-size: 9.5pt;
    font-weight: 600;
    text-align: center;
    background: #f1f5f9;
    border-top: 1px solid #e2e8f0;
    color: #475569;
  }
  .storyboard-prompts {
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    gap: 6px;
    font-size: 12pt;
  }
  .prompt-row {
    display: flex;
    align-items: flex-end;
    line-height: 1.4;
  }
  .prompt-label {
    font-weight: 600;
    white-space: nowrap;
    margin-right: 6px;
    color: #0f172a;
  }
  .prompt-line {
    flex: 1;
    border-bottom: 1.5px dotted #64748b;
    min-height: 20px;
  }
  .footer-sig {
    margin-top: auto;
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    padding-top: 8px;
    font-size: 11.5pt;
    border-top: 1px solid #cbd5e1;
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
  <div class="sheet">
    <div>
      <div class="header">
        <h1>โรงเรียนบ้านคำไผ่ สพป.ขอนแก่น เขต ๕</h1>
        <h2>แบบฝึกหัดกลุ่มสาระการเรียนรู้ภาษาไทย (${sanitize(gradeLabel)})</h2>
        <div style="font-size: 12.5pt; margin-top: 2px;">หน่วยการเรียนรู้: <strong>${sanitize(catTitle)} (ใบงานเรื่องเล่าภาพเรื่องราว)</strong></div>
      </div>

      <div class="info-bar">
        <div>
          ชื่อ - สกุล: .................................................................... ชั้น: .......... เลขที่: .......... วันที่: ..........
        </div>
        <div class="score-box">
          คะแนนเต็ม ${selectedWords.length * 2}<br>
          ได้ ......... คะแนน
        </div>
      </div>

      <div class="instructions">
        <strong>คำชี้แจง:</strong> ให้นักเรียนสังเกตภาพเรื่องราวลำดับเหตุการณ์ แล้วระบุว่าตรงกับสำนวนไทยใด พร้อมทั้งอธิบายคติสอนใจหรือความหมายเปรียบเทียบของสำนวนนั้นให้ถูกต้อง
      </div>
`;

    selectedWords.forEach((item, idx) => {
      const panelCount = (item.images && item.images.length) || 0;
      const panelsClass = panelCount === 2 ? 'storyboard-panels panels-2' : 'storyboard-panels';
      printHtml += `
      <div class="storyboard-item">
        <div class="storyboard-item-header">
          <span>ข้อที่ ${thaiNumbers[idx] || (idx + 1)}. เหตุการณ์ภาพเรื่องราว (${panelCount} ตอน)</span>
          <span style="font-size: 10.5pt; font-weight: normal; color: #64748b;">( ๒ คะแนน )</span>
        </div>
        <div class="${panelsClass}">
      `;

      (item.images || []).forEach((img, i) => {
        const phaseName = img.phase || `ตอนที่ ${i + 1}`;
        printHtml += `
          <div class="storyboard-panel">
            <div class="storyboard-panel-img-wrap">
              <img src="${sanitize(img.url)}" alt="${sanitize(img.alt || img.caption || '')}" class="storyboard-panel-img" loading="eager" />
            </div>
            <div class="storyboard-panel-tag">ตอนที่ ${thaiNumbers[i] || (i + 1)}: ${sanitize(phaseName)}</div>
          </div>
        `;
      });

      printHtml += `
        </div>
        <div class="storyboard-prompts">
          <div class="prompt-row">
            <span class="prompt-label">สำนวนไทยจากภาพนี้คือ:</span>
            <span class="prompt-line">........................................................................................</span>
          </div>
          <div class="prompt-row">
            <span class="prompt-label">คติสอนใจ / ความหมายเปรียบเทียบ:</span>
            <span class="prompt-line">........................................................................................</span>
          </div>
        </div>
      </div>
      `;
    });

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

    if (includeAnswerKey) {
      printHtml += `
  <div class="sheet">
    <div>
      <div class="header">
        <h1>[ แผ่นเฉลยสำหรับครูผู้สอน ]</h1>
        <h2>เฉลยใบงานเรื่องเล่าสำนวนไทย (จากภาพเรื่องราว): ${sanitize(catTitle)} (${sanitize(gradeLabel)})</h2>
      </div>

      <div class="instructions" style="background:#fef3c7; border-left-color:#d97706;">
        <strong>แนวการตรวจและเกณฑ์การให้คะแนน:</strong> พิจารณาการระบุชื่อสำนวนไทยถูกต้อง (๑ คะแนน) และการอธิบายคติสอนใจหรือความหมายเปรียบเทียบที่สอดคล้องกับภาพเรื่องราว (๑ คะแนน) รวมข้อละ ๒ คะแนน
      </div>
`;

      selectedWords.forEach((item, idx) => {
        printHtml += `
      <div style="border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px 12px; margin-bottom: 10px; background: #ffffff;">
        <div style="font-size: 13pt; font-weight: 700; color: #0369a1; margin-bottom: 4px;">
          ${thaiNumbers[idx] || (idx + 1)}. สำนวน: <strong>${sanitize(item.word)}</strong>
          ${item.reading ? `<span style="font-size: 11pt; font-weight: normal; color: #475569;">[ ${sanitize(item.reading)} ]</span>` : ''}
          ${item.emoji ? `<span>${sanitize(item.emoji)}</span>` : ''}
        </div>
        <div style="font-size: 11.5pt; margin-bottom: 4px;">
          <strong>คติสอนใจ / ความหมาย:</strong> ${sanitize(item.meaning || '-')}
        </div>
        ${item.example ? `<div style="font-size: 10.5pt; color: #475569; margin-bottom: 4px;"><em>ตัวอย่าง: “${sanitize(item.example)}”</em></div>` : ''}
        <div style="font-size: 10.5pt; color: #334155; background: #f8fafc; padding: 6px 8px; border-radius: 4px;">
          <strong>ลำดับเหตุการณ์ในภาพ:</strong>
          ${(item.images || []).map((img, i) => `
            <div style="margin-top: 2px;">
              • <strong>ตอนที่ ${thaiNumbers[i] || (i + 1)} (${sanitize(img.phase || `ตอนที่ ${i+1}`)}):</strong> ${sanitize(img.caption || img.alt || '')}
            </div>
          `).join('')}
        </div>
      </div>
        `;
      });

      printHtml += `
    </div>

    <div class="footer-sig">
      <div>โรงเรียนบ้านคำไผ่ สพป.ขอนแก่น เขต ๕</div>
      <div class="teacher-sign">ครูผู้ตรวจ: นายณัฐพงศ์ สิงห์ชมภู</div>
    </div>
  </div>
`;
    }

    printHtml += `
<script>
  window.onload = function() {
    window.print();
  };
</script>
</body>
</html>`;

    return printHtml;
  }

  window.ThaiVocabWorksheet = {
    openModal: openWorksheetModal,
    closeModal,
    confirmPrint,
    generateAndPrint,
    generateStoryboardWorksheet,
  };
})();
