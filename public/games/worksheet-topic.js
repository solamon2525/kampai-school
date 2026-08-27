(function createTopicWorksheetEngine() {
  const config = window.WORKSHEET_CONFIG;
  if (!config) throw new Error('WORKSHEET_CONFIG is required');

  const SCHOOL_LOGO_URL = 'https://lkpqssbqxxpasidfqhpb.supabase.co/storage/v1/object/public/school-images/logo/1778157862905_c2swwm.webp';
  const worksheetKey = config.worksheetKey
    || (config.sourceMediaUrl || '').replace(/^\/games\//, '').replace(/-media\.html$/, '')
    || 'topic-worksheet';

  let renderSeed = Date.now();
  let rng = null;
  let setsUi = null;
  let revealCount = 0;

  function escapeHtml(value) {
    return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function questions() {
    return Array.from(document.querySelectorAll('#pages .q'));
  }

  function syncReveal() {
    const items = questions();
    const total = items.length;
    revealCount = Math.max(0, Math.min(revealCount, total));

    const isAll = revealCount >= total && total > 0;
    document.body.classList.toggle('show-answers', isAll);

    items.forEach((item, index) => {
      const isRevealed = isAll || index < revealCount;
      item.classList.toggle('reveal-answer', isRevealed);
      item.classList.toggle('reveal-current', !isAll && revealCount > 0 && index === revealCount - 1);
    });

    const label = document.getElementById('answerStepLabel');
    const prevBtn = document.getElementById('btnAnswerPrev');
    const nextBtn = document.getElementById('btnAnswerNext');
    const allBtn = document.getElementById('btnAnswers');

    if (!total) {
      if (label) label.textContent = 'เฉลย: ปิด';
      if (allBtn) allBtn.textContent = '👁 ทั้งหมด';
      return;
    }

    if (revealCount <= 0) {
      if (label) label.textContent = 'เฉลย: ปิด';
      if (allBtn) allBtn.textContent = '👁 ทั้งหมด';
    } else if (revealCount >= total) {
      if (label) label.textContent = 'เฉลย: ครบ ' + total + ' ข้อ';
      if (allBtn) allBtn.textContent = '🙈 ซ่อนทั้งหมด';
    } else {
      if (label) label.textContent = 'เฉลยข้อ ' + revealCount + ' / ' + total;
      if (allBtn) allBtn.textContent = '👁 ทั้งหมด';
    }

    if (prevBtn) prevBtn.disabled = revealCount <= 0;
    if (nextBtn) nextBtn.disabled = revealCount >= total;
  }

  function revealNext() {
    const total = questions().length;
    if (revealCount < total) revealCount += 1;
    syncReveal();
  }

  function revealPrev() {
    if (revealCount > 0) revealCount -= 1;
    syncReveal();
  }

  function toggleAllAnswers() {
    const total = questions().length;
    revealCount = revealCount >= total ? 0 : total;
    syncReveal();
  }

  function mountRevealControls() {
    const allBtn = document.getElementById('btnAnswers');
    if (!allBtn) return;

    if (!document.getElementById('btnAnswerNext')) {
      allBtn.insertAdjacentHTML(
        'beforebegin',
        '<button class="btn" id="btnAnswerPrev" type="button" title="ซ่อนข้อล่าสุด">◀ ข้อก่อน</button>' +
        '<button class="btn" id="btnAnswerNext" type="button" title="เปิดเฉลยข้อถัดไป">▶ เฉลยข้อถัดไป</button>' +
        '<span class="answer-step-label" id="answerStepLabel" aria-live="polite">เฉลย: ปิด</span>'
      );
    }

    const prevBtn = document.getElementById('btnAnswerPrev');
    const nextBtn = document.getElementById('btnAnswerNext');

    if (prevBtn) prevBtn.onclick = revealPrev;
    if (nextBtn) nextBtn.onclick = revealNext;
    allBtn.onclick = toggleAllAnswers;

    window.addEventListener('keydown', (event) => {
      if (event.target?.matches?.('input,select,textarea')) return;
      if (event.key === 'ArrowRight' || event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        revealNext();
      }
      if (event.key === 'ArrowLeft' || event.key === 'b' || event.key === 'B') {
        event.preventDefault();
        revealPrev();
      }
    });
  }

  function ensureRng() {
    if (window.KampaiWorksheetSets) {
      rng = window.KampaiWorksheetSets.createRng(renderSeed);
    } else {
      rng = null;
    }
  }

  function nextRandom() {
    if (rng) return rng.random();
    return Math.random();
  }

  function shuffle(items) {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const pick = Math.floor(nextRandom() * (index + 1));
      [result[index], result[pick]] = [result[pick], result[index]];
    }
    return result;
  }

  function selectAllPageItems(fullPool, selectedPool, count, pageCount) {
    const primary = shuffle([...selectedPool]);
    const backup = shuffle(fullPool.filter(item => !primary.includes(item)));
    const combined = [...primary, ...backup];

    const pages = [];
    let currentIndex = 0;
    for (let page = 0; page < pageCount; page += 1) {
      const pageItems = [];
      for (let i = 0; i < count; i += 1) {
        if (currentIndex < combined.length) {
          pageItems.push(combined[currentIndex]);
          currentIndex += 1;
        } else {
          const fallbackIndex = i % Math.max(combined.length, 1);
          pageItems.push(combined[fallbackIndex]);
        }
      }
      pages.push(pageItems);
    }
    return pages;
  }

  function qrUrl() {
    const mediaUrl = new URL(config.sourceMediaUrl, window.location.origin).href;
    return 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(mediaUrl);
  }

  function readControls() {
    const controls = {
      style: document.getElementById('selStyle')?.value || 'standard',
      pageCount: Number(document.getElementById('selPageCount')?.value || 1),
      count: Number(document.getElementById('selCount')?.value || 5),
      topic: document.getElementById('selTopic')?.value || 'mixed',
      grade: document.getElementById('selGrade')?.value || '',
      schoolName: (document.getElementById('inpSchool')?.value || '').trim() || 'โรงเรียนบ้านคำไผ่',
      teacherName: document.getElementById('selTeacher')?.value || '',
    };
    const extra = typeof config.readExtraControls === 'function' ? config.readExtraControls() : null;
    return extra && typeof extra === 'object' ? { ...controls, ...extra } : controls;
  }

  function applyControls(cfg) {
    if (!cfg || typeof cfg !== 'object') return;
    const map = {
      style: 'selStyle',
      pageCount: 'selPageCount',
      count: 'selCount',
      topic: 'selTopic',
      grade: 'selGrade',
      schoolName: 'inpSchool',
      teacherName: 'selTeacher',
    };
    Object.entries(map).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (!el || cfg[key] == null || cfg[key] === '') return;
      el.value = String(cfg[key]);
    });
    if (typeof config.applyExtraControls === 'function') config.applyExtraControls(cfg);
  }

  function currentConfig() {
    return readControls();
  }

  function renderCover(schoolName, teacherName) {
    return '<section class="sheet cover-sheet">'
      + '<h1 class="cover-title">' + escapeHtml(config.icon + ' ' + config.title) + '</h1>'
      + '<div class="cover-sub">' + escapeHtml(config.gradeLabel + ' · ' + config.subject) + '</div>'
      + '<div class="cover-box"><strong>ชื่อ–นามสกุล</strong> ______________________________________________<br><br>'
      + '<strong>ชั้น</strong> __________ <strong>เลขที่</strong> __________<br><br>'
      + '<strong>โรงเรียน</strong> ' + escapeHtml(schoolName) + '<br><br><strong>ครูผู้สอน</strong> ' + escapeHtml(teacherName || '________________________') + '</div>'
      + '<div class="cover-media">สแกนสื่อก่อนทำใบงาน<br><img class="qr-img" src="' + qrUrl() + '" alt="QR Code สื่อหลัก"></div>'
      + '</section>';
  }

  function renderSheet(pageIndex, totalPages, count, style, schoolName, teacherName, topic, items) {
    const questionsHtml = items.map((item, index) => '<article class="q"><span class="q-num">' + (index + 1) + '</span>'
      + (style === 'progressive' ? '<span class="q-rating">[ ] 3 [ ] 2 [ ] 1</span>' : '')
      + config.renderQuestion(item, index, { count, topic, pageIndex }) + '</article>').join('');
    const teacher = teacherName ? '<span class="sheet-foot-teacher">ครูผู้สอน: ' + escapeHtml(teacherName) + '</span>' : '<span></span>';
    return '<section class="sheet"><header class="sheet-head"><div class="qr-box"><img class="qr-img" src="' + qrUrl() + '" alt="QR Code สื่อหลัก"><span class="qr-label">สแกนเรียนจากสื่อก่อนทำ</span></div>'
      + '<div class="sheet-title"><h2>' + escapeHtml(config.icon + ' ' + config.title) + '</h2><span class="level">' + escapeHtml(config.gradeLabel) + '</span></div>'
      + '<div class="school-name">🏫 ' + escapeHtml(schoolName) + '</div><div class="student"><div class="field field-name"><span class="lbl">ชื่อ–นามสกุล</span><span class="blank"></span></div><div class="field field-no"><span class="lbl">เลขที่</span><span class="blank"></span></div></div>'
      + '<div class="directions"><span>' + escapeHtml(config.directions) + '</span><span class="indicator">' + escapeHtml(config.indicators.join(' · ')) + '</span></div></header>'
      + '<div class="questions count-' + count + '">' + questionsHtml + '</div>'
      + '<div class="parent-slip"><span>✂ ผล: [ ] ผ่าน [ ] ควรทบทวน</span><span>ผู้ปกครองลงชื่อ ____________________</span></div>'
      + '<footer class="sheet-foot">' + teacher + '<span>หน้า ' + (pageIndex + 1) + '/' + totalPages + ' · สื่อคู่: ' + escapeHtml(config.mediaLabel) + '</span></footer></section>';
  }

  function render() {
    ensureRng();
    const controls = readControls();
    const fullPool = config.getItems('mixed');
    const selectedPool = config.getItems(controls.topic);
    const pagesItems = typeof config.selectAllPageItems === 'function'
      ? config.selectAllPageItems({
          fullPool: [...fullPool],
          selectedPool: [...selectedPool],
          count: controls.count,
          pageCount: controls.pageCount,
          shuffle,
          nextRandom,
        })
      : selectAllPageItems(fullPool, selectedPool, controls.count, controls.pageCount);

    let html = controls.style === 'booklet' ? renderCover(controls.schoolName, controls.teacherName) : '';
    for (let page = 0; page < controls.pageCount; page += 1) {
      html += renderSheet(page, controls.pageCount, controls.count, controls.style, controls.schoolName, controls.teacherName, controls.topic, pagesItems[page]);
    }
    document.getElementById('pages').innerHTML = html;
    revealCount = 0;
    syncReveal();
    if (window.KampaiWorksheetSets) {
      window.KampaiWorksheetSets.writeUrl({ seed: renderSeed, setId: setsUi?.getCurrentSetId?.() || undefined });
    }
  }

  function randomize() {
    if (window.KampaiWorksheetSets) {
      renderSeed = window.KampaiWorksheetSets.newSeed();
    } else {
      renderSeed = Date.now() + Math.floor(Math.random() * 100000);
    }
    if (setsUi?.setCurrentSetId) setsUi.setCurrentSetId('');
    if (window.KampaiWorksheetSets) {
      window.KampaiWorksheetSets.writeUrl({ seed: renderSeed, clearSet: true });
    }
    render();
    if (setsUi?.refreshSuggestedTitle) setsUi.refreshSuggestedTitle(true);
  }

  function applySetState(state) {
    if (state?.config) applyControls(state.config);
    if (state?.seed != null) renderSeed = Number(state.seed);
    if (state?.setId && setsUi?.setCurrentSetId) setsUi.setCurrentSetId(state.setId);
    render();
  }

  async function bootSets() {
    const loader = window.KampaiWorksheet?.loadSetsModule;
    if (!loader) return;
    try {
      const Sets = await loader();
      if (!Sets) return;
      const fromUrl = Sets.getConfigFromUrl();
      if (fromUrl.seed != null) renderSeed = Number(fromUrl.seed);

      setsUi = Sets.mountToolbar({
        worksheetKey,
        titlePrefix: config.title || config.mediaLabel || '',
        topicLabels: config.topicLabels || undefined,
        initialSetId: fromUrl.setId || '',
        getState: () => ({
          seed: renderSeed,
          config: currentConfig(),
          title: document.getElementById('kampaiSetTitle')?.value || '',
        }),
        applyState: applySetState,
      });

      if (fromUrl.setId) {
        const row = await Sets.load(fromUrl.setId);
        if (row) {
          applyControls(row.config || {});
          renderSeed = Number(row.seed);
          if (setsUi?.markTitleLoaded) setsUi.markTitleLoaded(row.title || '');
          else {
            const titleInput = document.getElementById('kampaiSetTitle');
            if (titleInput && row.title) titleInput.value = row.title;
          }
          if (setsUi?.setCurrentSetId) setsUi.setCurrentSetId(row.id);
          render();
          if (setsUi?.setMessage) setsUi.setMessage('โหลดชุด: ' + (row.title || row.id.slice(0, 8)));
          return;
        }
      }
      render();
      if (setsUi?.refreshSuggestedTitle) setsUi.refreshSuggestedTitle(false);
    } catch (error) {
      console.warn('worksheet sets unavailable', error);
      render();
    }
  }

  window.KampaiTopicWorksheet = Object.freeze({
    escapeHtml,
    randomize,
    render,
    getSeed: () => renderSeed,
    worksheetKey,
    revealNext,
    revealPrev,
    toggleAllAnswers,
    syncReveal,
  });

  function boot() {
    mountRevealControls();
    bootSets();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
