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

  function escapeHtml(value) {
    return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
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

  function selectItems(pool, count, pageIndex) {
    const shifted = [...pool.slice(pageIndex % Math.max(pool.length, 1)), ...pool.slice(0, pageIndex % Math.max(pool.length, 1))];
    const mixed = shuffle(shifted);
    return Array.from({ length: count }, (_, index) => mixed[index % mixed.length]);
  }

  function qrUrl() {
    const mediaUrl = new URL(config.sourceMediaUrl, window.location.origin).href;
    return 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(mediaUrl);
  }

  function readControls() {
    return {
      style: document.getElementById('selStyle')?.value || 'standard',
      pageCount: Number(document.getElementById('selPageCount')?.value || 1),
      count: Number(document.getElementById('selCount')?.value || 10),
      topic: document.getElementById('selTopic')?.value || 'mixed',
      grade: document.getElementById('selGrade')?.value || '',
      schoolName: (document.getElementById('inpSchool')?.value || '').trim() || 'โรงเรียนบ้านคำไผ่',
      teacherName: document.getElementById('selTeacher')?.value || '',
    };
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

  function renderSheet(pageIndex, totalPages, count, style, schoolName, teacherName, topic) {
    const pool = config.getItems(topic);
    const items = selectItems(pool, count, pageIndex);
    const questions = items.map((item, index) => '<article class="q"><span class="q-num">' + (index + 1) + '</span>'
      + (style === 'progressive' ? '<span class="q-rating">[ ] 3 [ ] 2 [ ] 1</span>' : '')
      + config.renderQuestion(item, index, { count, topic, pageIndex }) + '</article>').join('');
    const teacher = teacherName ? '<span class="sheet-foot-teacher">ครูผู้สอน: ' + escapeHtml(teacherName) + '</span>' : '<span></span>';
    return '<section class="sheet"><header class="sheet-head"><div class="qr-box"><img class="qr-img" src="' + qrUrl() + '" alt="QR Code สื่อหลัก"><span class="qr-label">สแกนเรียนจากสื่อก่อนทำ</span></div>'
      + '<div class="sheet-title"><h2>' + escapeHtml(config.icon + ' ' + config.title) + '</h2><span class="level">' + escapeHtml(config.gradeLabel) + '</span></div>'
      + '<div class="school-name">🏫 ' + escapeHtml(schoolName) + '</div><div class="student"><div>ชื่อ–นามสกุล <span class="blank long"></span></div><div>เลขที่ <span class="blank short"></span></div></div>'
      + '<div class="directions"><span>' + escapeHtml(config.directions) + '</span><span class="indicator">' + escapeHtml(config.indicators.join(' · ')) + '</span></div></header>'
      + '<div class="questions count-' + count + '">' + questions + '</div>'
      + '<div class="parent-slip"><span>✂ ผล: [ ] ผ่าน [ ] ควรทบทวน</span><span>ผู้ปกครองลงชื่อ ____________________</span></div>'
      + '<footer class="sheet-foot">' + teacher + '<span>หน้า ' + (pageIndex + 1) + '/' + totalPages + ' · สื่อคู่: ' + escapeHtml(config.mediaLabel) + '</span></footer></section>';
  }

  function render() {
    ensureRng();
    const controls = readControls();
    let html = controls.style === 'booklet' ? renderCover(controls.schoolName, controls.teacherName) : '';
    for (let page = 0; page < controls.pageCount; page += 1) {
      html += renderSheet(page, controls.pageCount, controls.count, controls.style, controls.schoolName, controls.teacherName, controls.topic);
    }
    document.getElementById('pages').innerHTML = html;
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
      // else keep renderSeed from initial Date.now() so first paint matches boot

      setsUi = Sets.mountToolbar({
        worksheetKey,
        initialSetId: fromUrl.setId || '',
        getState: () => ({
          seed: renderSeed,
          config: currentConfig(),
          title: document.getElementById('kampaiSetTitle')?.value || config.title,
        }),
        applyState: applySetState,
      });

      if (fromUrl.setId) {
        const row = await Sets.load(fromUrl.setId);
        if (row) {
          applyControls(row.config || {});
          renderSeed = Number(row.seed);
          const titleInput = document.getElementById('kampaiSetTitle');
          if (titleInput && row.title) titleInput.value = row.title;
          if (setsUi?.setCurrentSetId) setsUi.setCurrentSetId(row.id);
          render();
          if (setsUi?.setMessage) setsUi.setMessage('โหลดชุด: ' + (row.title || row.id.slice(0, 8)));
          return;
        }
      }
      render();
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
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootSets);
  } else {
    bootSets();
  }
})();
