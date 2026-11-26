/* vocab-sheet-100.js — ระบบรวมคำศัพท์จากหลายหมวดและจัดตาราง 100 คำต่อแผ่น A4 */
(function () {
  'use strict';

  const GRID_PRESETS = {
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
      label: 'A4 แนวตั้ง 4×25 ช่อง (เหมาะกับคำ/สำนวนยาว)',
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

  function sanitize(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

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

  function shuffleWithRng(items, rng) {
    const arr = items.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    return arr;
  }

  function countThaiGraphemes(str) {
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

  function computeCellTypography(word, options) {
    const opts = options || {};
    const len = countThaiGraphemes(word);
    const penalty = opts.showReading ? 2 : 0;
    const effective = len + penalty;
    let fontClass = 'fs-xl';
    if (effective >= 23) fontClass = 'fs-xs';
    else if (effective >= 15) fontClass = 'fs-sm';
    else if (effective >= 10) fontClass = 'fs-md';
    else if (effective >= 6) fontClass = 'fs-lg';
    return { fontClass, graphemeCount: len };
  }

  function collectPoolWords(allWords, categories, selectedSlugs, grade) {
    const wordsMap = allWords || {};
    const catList = Array.isArray(categories) ? categories : [];
    const catTitleBySlug = {};
    catList.forEach((c) => {
      if (c && c.slug) catTitleBySlug[c.slug] = c.title || c.slug;
    });

    const slugs = Array.isArray(selectedSlugs) && selectedSlugs.length
      ? selectedSlugs
      : Object.keys(wordsMap);

    const targetGrade = grade && grade !== 'all' ? grade : null;
    const seen = new Set();
    const pool = [];

    for (let s = 0; s < slugs.length; s++) {
      const slug = slugs[s];
      const list = Array.isArray(wordsMap[slug]) ? wordsMap[slug] : [];
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (!item || item.content_status === 'quarantined') continue;
        if (targetGrade && item.grade !== targetGrade) continue;
        const cleanWord = String(item.word || '').trim();
        if (!cleanWord || seen.has(cleanWord)) continue;
        seen.add(cleanWord);
        pool.push({
          word: cleanWord,
          reading: item.reading || '',
          meaning: item.meaning || '',
          grade: item.grade || '',
          pos: item.pos || '',
          example: item.example || '',
          _categorySlug: slug,
          _categoryTitle: catTitleBySlug[slug] || slug,
        });
      }
    }
    return pool;
  }

  function buildBalancedSetFromBuckets(buckets, bucketKeys, setSize, rng) {
    const picked = [];
    const pickedWords = new Set();
    if (!bucketKeys.length) return picked;

    const perBucket = Math.max(1, Math.floor(setSize / bucketKeys.length));
    for (let k = 0; k < bucketKeys.length && picked.length < setSize; k++) {
      const list = buckets[bucketKeys[k]];
      let taken = 0;
      while (list.length > 0 && taken < perBucket && picked.length < setSize) {
        const item = list.shift();
        if (!pickedWords.has(item.word)) {
          picked.push(item);
          pickedWords.add(item.word);
          taken++;
        }
      }
    }

    if (picked.length < setSize) {
      let leftovers = [];
      for (let k = 0; k < bucketKeys.length; k++) {
        leftovers = leftovers.concat(buckets[bucketKeys[k]]);
      }
      leftovers = shuffleWithRng(leftovers, rng);
      for (let i = 0; i < leftovers.length && picked.length < setSize; i++) {
        const item = leftovers[i];
        if (!pickedWords.has(item.word)) {
          picked.push(item);
          pickedWords.add(item.word);
        }
      }
      // Remove consumed leftovers from buckets so subsequent sets don't repeat them
      const consumed = new Set(picked.map((x) => x.word));
      for (let k = 0; k < bucketKeys.length; k++) {
        buckets[bucketKeys[k]] = buckets[bucketKeys[k]].filter((x) => !consumed.has(x.word));
      }
    }

    return shuffleWithRng(picked, rng);
  }

  function build100WordSets(options) {
    const opts = options || {};
    const pool = Array.isArray(opts.pool) ? opts.pool : [];
    const setSize = Math.max(1, Number(opts.setSize) || 100);
    const setCount = Math.max(1, Number(opts.setCount) || 1);
    const mixMode = opts.mixMode || 'balanced';
    const seed = opts.seed != null ? Number(opts.seed) : (Date.now() & 0x7fffffff);
    const rng = mulberry32(seed);

    if (!pool.length) {
      return { sets: [], totalAvailable: 0, seed };
    }

    const sets = [];
    if (mixMode === 'sequential') {
      for (let s = 0; s < setCount; s++) {
        const start = (s * setSize) % pool.length;
        const slice = pool.slice(start, start + setSize);
        if (slice.length) sets.push(slice);
      }
      return { sets, totalAvailable: pool.length, seed };
    }

    if (mixMode === 'random') {
      let remaining = shuffleWithRng(pool, rng);
      for (let s = 0; s < setCount; s++) {
        if (!remaining.length) remaining = shuffleWithRng(pool, rng);
        const chunk = remaining.slice(0, Math.min(setSize, remaining.length));
        remaining = remaining.slice(chunk.length);
        sets.push(chunk);
      }
      return { sets, totalAvailable: pool.length, seed };
    }

    // Default: 'balanced' — fair round-robin per selected category without repeats across sets while pool lasts
    const makeBuckets = () => {
      const buckets = {};
      const keys = [];
      for (let i = 0; i < pool.length; i++) {
        const item = pool[i];
        const key = item._categorySlug || 'default';
        if (!buckets[key]) {
          buckets[key] = [];
          keys.push(key);
        }
        buckets[key].push(item);
      }
      keys.forEach((k) => {
        buckets[k] = shuffleWithRng(buckets[k], rng);
      });
      return { buckets, keys };
    };

    let state = makeBuckets();
    for (let s = 0; s < setCount; s++) {
      let totalLeft = 0;
      state.keys.forEach((k) => { totalLeft += state.buckets[k].length; });
      if (totalLeft === 0) state = makeBuckets();
      const setItems = buildBalancedSetFromBuckets(state.buckets, state.keys, setSize, rng);
      if (setItems.length) sets.push(setItems);
    }

    return { sets, totalAvailable: pool.length, seed };
  }

  function renderStudentSetSheet(words, setIndex, totalSets, preset, opts) {
    const cols = preset.cols;
    const rows = preset.rows;
    const totalSlots = cols * rows;
    const gradeLabel = opts.grade === 'all' || !opts.grade
      ? 'ป.4–ป.6'
      : opts.grade;

    let tbodyHtml = '';
    for (let r = 0; r < rows; r++) {
      tbodyHtml += '<tr>';
      for (let c = 0; c < cols; c++) {
        const idx = r * cols + c;
        const item = words[idx];
        if (!item) {
          tbodyHtml += `<td class="vocab-cell vocab-cell-empty"><span class="cell-num">${opts.showNumbers ? idx + 1 : ''}</span></td>`;
          continue;
        }
        const typo = computeCellTypography(item.word, { showReading: opts.showReading });
        tbodyHtml += `<td class="vocab-cell ${typo.fontClass}">`;
        if (opts.showNumbers) {
          tbodyHtml += `<span class="cell-num">${idx + 1}</span>`;
        }
        if (opts.showCheckbox) {
          tbodyHtml += '<span class="cell-check" aria-hidden="true">☐</span>';
        }
        tbodyHtml += `<div class="cell-inner">`;
        tbodyHtml += `<div class="cell-word">${sanitize(item.word)}</div>`;
        if (opts.showReading && item.reading) {
          tbodyHtml += `<div class="cell-reading">[${sanitize(item.reading)}]</div>`;
        }
        tbodyHtml += '</div></td>';
      }
      tbodyHtml += '</tr>';
    }

    const setBadge = totalSets > 1 ? ` · ชุดที่ ${setIndex + 1}/${totalSets}` : '';
    const countLabel = `${words.length} คำ`;
    return `
  <section class="sheet student-sheet">
    <header class="sheet-head">
      <div class="head-top">
        <div class="head-title">${sanitize(opts.title || 'ชุดคำศัพท์ภาษาไทย 100 คำ')}${sanitize(setBadge)}</div>
        <div class="head-meta">${sanitize(gradeLabel)} · ${sanitize(opts.categoriesSummary || 'คลังคำศัพท์')} · ${sanitize(countLabel)}</div>
      </div>
      <div class="student-bar">
        <span>ชื่อ–นามสกุล .................................................................</span>
        <span>ชั้น ...............</span>
        <span>เลขที่ .........</span>
        <span class="score-pill">อ่านได้ ........ / ${words.length}</span>
      </div>
    </header>
    <table class="vocab-100-table" style="height:${preset.tableHeightMm}mm">
      <tbody>${tbodyHtml}</tbody>
    </table>
    <footer class="sheet-foot">
      <span>โรงเรียนบ้านคำไผ่ · แบบฝึกอ่าน/เขียนตามคำบอกชุด 100 คำ</span>
      <span>วันที่ ....... / .............. / 25..... · ลงชื่อผู้ตรวจ ........................................</span>
    </footer>
  </section>`;
  }

  function renderTeacherKeySheet(words, setIndex, totalSets, opts, isLandscape) {
    const setBadge = totalSets > 1 ? ` (ชุดที่ ${setIndex + 1}/${totalSets})` : '';
    const colCount = isLandscape ? 3 : 2;
    const perCol = Math.ceil(words.length / colCount);
    const colsHtml = [];

    const renderList = (list, offset) => list.map((item, i) => `
      <div class="key-row">
        <span class="key-num">${offset + i + 1}.</span>
        <span class="key-word">${sanitize(item.word)}</span>
        ${item.reading ? `<span class="key-reading">[${sanitize(item.reading)}]</span>` : ''}
        ${item.meaning ? `<span class="key-meaning">— ${sanitize(item.meaning)}</span>` : ''}
      </div>`).join('');

    for (let c = 0; c < colCount; c++) {
      const start = c * perCol;
      const slice = words.slice(start, start + perCol);
      colsHtml.push(`<div class="key-col">${renderList(slice, start)}</div>`);
    }

    const catCounts = {};
    for (let i = 0; i < words.length; i++) {
      const title = words[i]._categoryTitle || words[i]._categorySlug || 'ทั่วไป';
      catCounts[title] = (catCounts[title] || 0) + 1;
    }
    const catStatsHtml = Object.entries(catCounts)
      .map(([title, count]) => `<span class="key-stat-pill">${sanitize(title)}: ${count} คำ</span>`)
      .join('');

    return `
  <section class="sheet teacher-key-sheet">
    <header class="sheet-head">
      <div class="head-top">
        <div class="head-title">เฉลยและคำอ่านสำหรับครู${sanitize(setBadge)} — ${sanitize(opts.title || 'ชุดคำศัพท์ 100 คำ')}</div>
        <div class="head-meta">${sanitize(opts.categoriesSummary || '')}</div>
      </div>
    </header>
    <div class="key-columns ${isLandscape ? 'cols-3' : 'cols-2'}">
      ${colsHtml.join('')}
    </div>
    <div class="teacher-notes-box">
      <div class="notes-stats-row">
        <strong>สัดส่วนคำศัพท์ในชุดนี้:</strong>
        <div class="notes-stats-pills">${catStatsHtml}</div>
      </div>
      <div class="notes-eval-row">
        <span>📊 <strong>สรุปผลการประเมิน:</strong> ผ่านเกณฑ์ (≥ 80 คำ) ............ คน · ควรฝึกซ้ำ ............ คน</span>
        <span>✍️ ลงชื่อครูผู้สอน ............................................</span>
      </div>
      <div class="notes-lines">
        <div class="notes-line"><strong>📝 คำที่นักเรียนมักอ่าน/เขียนผิดบ่อย &amp; แนวทางซ่อมเสริม:</strong> ....................................................................................................................................</div>
        <div class="notes-line">................................................................................................................................................................................................................................</div>
      </div>
    </div>
    <footer class="sheet-foot">
      <span>เอกสารสำหรับครูผู้สอน · คลังคำศัพท์ภาษาไทย ป.4–ป.6</span>
      <span>ทั้งหมด ${words.length} คำ</span>
    </footer>
  </section>`;
  }

  function render100SheetDocument(config) {
    const opts = config || {};
    const preset = GRID_PRESETS[opts.preset] || GRID_PRESETS['5x20-portrait'];
    const sets = Array.isArray(opts.sets) ? opts.sets : [];
    const docTitle = sanitize(opts.title || 'ชุดคำศัพท์ภาษาไทย-100-คำ');
    const fs = preset.fontSizes;
    const isLandscape = preset.orientation === 'landscape';

    let pagesHtml = '';
    for (let i = 0; i < sets.length; i++) {
      pagesHtml += renderStudentSetSheet(sets[i], i, sets.length, preset, opts);
      if (opts.includeTeacherKey) {
        pagesHtml += renderTeacherKeySheet(sets[i], i, sets.length, opts, isLandscape);
      }
    }

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
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
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
    border: 1px solid rgba(255,255,255,0.2);
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
  .vocab-100-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    flex: 1 1 auto;
  }
  .vocab-cell {
    position: relative;
    border: 1px solid #475569;
    padding: 0.8mm 1.5mm;
    text-align: center;
    vertical-align: middle;
    overflow: hidden;
    background: #ffffff;
  }
  .vocab-cell-empty {
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
  .vocab-cell.fs-xl .cell-word { font-size: ${fs.xl}; }
  .vocab-cell.fs-lg .cell-word { font-size: ${fs.lg}; }
  .vocab-cell.fs-md .cell-word { font-size: ${fs.md}; }
  .vocab-cell.fs-sm .cell-word { font-size: ${fs.sm}; }
  .vocab-cell.fs-xs .cell-word { font-size: ${fs.xs}; }
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
  .teacher-key-sheet .key-columns {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 3mm;
    flex: 1 1 auto;
    min-height: 0;
    align-content: start;
    overflow: hidden;
  }
  .teacher-key-sheet .key-columns.cols-3 {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 2.5mm;
  }
  .key-col {
    min-width: 0;
    overflow: hidden;
  }
  .key-row {
    font-size: ${isLandscape ? '6.9pt' : '7.7pt'};
    line-height: ${isLandscape ? '1.16' : '1.22'};
    border-bottom: 0.5px dotted #cbd5e1;
    padding: ${isLandscape ? '0.2mm 0' : '0.35mm 0'};
    white-space: normal;
    word-break: break-word;
    overflow-wrap: anywhere;
  }
  .key-num { font-weight: 700; color: #0369a1; margin-right: 2px; }
  .key-word { font-weight: 700; color: #0f172a; }
  .key-reading { color: #475569; margin-left: 3px; font-size: ${isLandscape ? '6.5pt' : '7.1pt'}; }
  .key-meaning { color: #334155; margin-left: 3px; }
  .teacher-notes-box {
    margin-top: 1.5mm;
    border: 1px solid #94a3b8;
    border-radius: 4px;
    padding: ${isLandscape ? '1.2mm 2mm' : '1.8mm 2.5mm'};
    background: #f8fafc;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: ${isLandscape ? '0.8mm' : '1.2mm'};
    font-size: ${isLandscape ? '7pt' : '7.8pt'};
    color: #1e293b;
  }
  .notes-stats-row {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
  }
  .notes-stats-pills {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
  }
  .key-stat-pill {
    background: #e2e8f0;
    border-radius: 3px;
    padding: 0.3mm 1.5mm;
    font-size: ${isLandscape ? '6.6pt' : '7.2pt'};
    font-weight: 600;
  }
  .notes-eval-row {
    display: flex;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 6px;
  }
  .notes-lines {
    display: flex;
    flex-direction: column;
    gap: 1.2mm;
  }
  .notes-line {
    white-space: nowrap;
    overflow: hidden;
  }
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
  }
</style>
</head>
<body>
  <div class="preview-toolbar no-print">
    <div class="preview-toolbar-left">
      <div class="preview-toolbar-title">📄 พรีวิวใบงานคำศัพท์ 100 คำ (${sanitize(preset.label)})</div>
      <div class="preview-toolbar-hint">กด "บันทึกเป็น PDF" แล้วเลือกปลายทาง <strong>Save as PDF / บันทึกเป็น PDF</strong> เพื่อส่งออกไฟล์ PDF คมชัด</div>
    </div>
    <div class="preview-actions">
      <button type="button" class="pbtn" id="btn-reroll-100" onclick="window.__reroll100 && window.__reroll100()">🎲 สุ่มชุดใหม่</button>
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

  function openPreviewWindow(config) {
    const win = window.open('', '_blank');
    if (!win) return null;

    const writeDoc = (cfg) => {
      const built = build100WordSets(cfg);
      const html = render100SheetDocument(Object.assign({}, cfg, { sets: built.sets }));
      win.document.open();
      win.document.write(html);
      win.document.close();
      win.__reroll100 = function () {
        const nextCfg = Object.assign({}, cfg, { seed: (Date.now() ^ Math.floor(Math.random() * 1e6)) & 0x7fffffff });
        writeDoc(nextCfg);
      };
    };

    writeDoc(config);
    return win;
  }

  window.ThaiVocabSheet100 = {
    GRID_PRESETS,
    sanitize,
    collectPoolWords,
    build100WordSets,
    computeCellTypography,
    render100SheetDocument,
    openPreviewWindow,
  };
})();
