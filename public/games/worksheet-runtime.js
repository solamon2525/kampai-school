(function createWorksheetRuntime() {
  const SUPABASE_URL = 'https://lkpqssbqxxpasidfqhpb.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcHFzc2JxeHhwYXNpZGZxaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjUyMjgsImV4cCI6MjA5MTI0MTIyOH0.X7YsSlrgYl9ifLWvgyZI04PtebK572pacadfNlmNO-A';
  const SETS_SCRIPT = '/games/worksheet-sets.js?v=1.175.5';
  let teacherPromise = null;
  let setsPromise = null;

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function loadSetsModule() {
    if (window.KampaiWorksheetSets) return Promise.resolve(window.KampaiWorksheetSets);
    if (setsPromise) return setsPromise;
    setsPromise = new Promise((resolve, reject) => {
      const existing = document.querySelector('script[data-kampai-worksheet-sets]');
      if (existing) {
        existing.addEventListener('load', () => resolve(window.KampaiWorksheetSets));
        existing.addEventListener('error', () => reject(new Error('failed to load worksheet-sets.js')));
        return;
      }
      const script = document.createElement('script');
      script.src = SETS_SCRIPT;
      script.async = false;
      script.dataset.kampaiWorksheetSets = '1';
      script.onload = () => resolve(window.KampaiWorksheetSets);
      script.onerror = () => reject(new Error('failed to load worksheet-sets.js'));
      document.head.appendChild(script);
    });
    return setsPromise;
  }

  async function getTeachers() {
    if (!teacherPromise) {
      teacherPromise = fetch(
        `${SUPABASE_URL}/rest/v1/staff?select=name,position,staff_type,photo_url&order=order_position.asc`,
        {
          headers: {
            apikey: SUPABASE_PUBLISHABLE_KEY,
            Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`
          }
        }
      )
        .then((response) => response.ok ? response.json() : [])
        .then((rows) => Array.isArray(rows) ? rows : [])
        .catch(() => []);
    }
    return teacherPromise;
  }

  async function loadTeachers(selectId = 'selTeacher') {
    const select = document.getElementById(selectId);
    if (!select) return [];

    const teachers = await getTeachers();
    const options = teachers.map((teacher) => {
      const name = escapeHtml(teacher.name);
      const position = teacher.position ? ` (${escapeHtml(teacher.position)})` : '';
      return `<option value="${name}">${name}${position}</option>`;
    });
    select.innerHTML = '<option value="">-- เลือกครูผู้สอน --</option>' + options.join('');
    return teachers;
  }

  async function printA4() {
    try {
      if (document.fonts?.ready) await document.fonts.ready;
    } catch (_) {
      /* ignore font readiness errors — still print */
    }
    window.print();
  }

  function bindPrintButton(buttonId = 'btnPrint') {
    const btn = document.getElementById(buttonId);
    if (!btn) return null;
    btn.onclick = (event) => {
      if (event?.preventDefault) event.preventDefault();
      printA4();
    };
    btn.dataset.kampaiPrintBound = '1';
    return btn;
  }

  function createSeededRandom(seed) {
    let state = (Number(seed) || Date.now()) >>> 0;
    return function seededRandom() {
      state += 0x6D2B79F5;
      let value = state;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function upgradeLegacyWorksheet(options) {
    const questionSelector = options.questionSelector || '#pages .q';
    const fieldIds = options.fieldIds || ['selStyle', 'selPageCount', 'selTopic', 'selGrade', 'selCount', 'inpSchool', 'selTeacher', 'selUseMode'];
    const fieldKeyById = {
      selStyle: 'style', selPageCount: 'pageCount', selTopic: 'topic', selGrade: 'grade',
      selCount: 'count', selMode: 'format', selMultiStrategy: 'multiStrategy',
      inpSchool: 'schoolName', selTeacher: 'teacherName', selUseMode: 'useMode',
    };
    let renderSeed = Date.now();
    let revealCount = 0;
    let setsUi = null;

    const answerStyle = document.createElement('style');
    answerStyle.dataset.kampaiAnswerReveal = '1';
    answerStyle.textContent = `${options.answerRevealCss || '.q.reveal-answer .work-fill{color:#b91c1c}'}\n.q.reveal-current{outline:2px solid var(--worksheet-accent,#0284c7);outline-offset:1px}`;
    document.head.appendChild(answerStyle);

    function questions() { return Array.from(document.querySelectorAll(questionSelector)); }
    function syncReveal() {
      document.body.classList.remove('show-answers');
      const items = questions();
      revealCount = Math.max(0, Math.min(revealCount, items.length));
      items.forEach((item, index) => {
        item.classList.toggle('reveal-answer', index < revealCount);
        item.classList.toggle('reveal-current', revealCount > 0 && index === revealCount - 1);
      });
      const label = document.getElementById('answerStepLabel');
      const previous = document.getElementById('btnAnswerPrev');
      const next = document.getElementById('btnAnswerNext');
      const all = document.getElementById('btnAnswers');
      if (label) label.textContent = revealCount === 0 ? 'เฉลย: ปิด' : revealCount >= items.length ? `เฉลย: ครบ ${items.length} ข้อ` : `เฉลยข้อ ${revealCount} / ${items.length}`;
      if (previous) previous.disabled = revealCount <= 0;
      if (next) next.disabled = revealCount >= items.length;
      if (all) all.textContent = revealCount >= items.length && items.length ? '🙈 ซ่อนทั้งหมด' : '👁 ทั้งหมด';
    }
    function mountRevealControls() {
      const all = document.getElementById('btnAnswers');
      if (!all || document.getElementById('btnAnswerNext')) return;
      all.insertAdjacentHTML('beforebegin', '<button class="btn" id="btnAnswerPrev" type="button">◀ ข้อก่อน</button><button class="btn" id="btnAnswerNext" type="button">▶ เฉลยข้อถัดไป</button><span class="answer-step-label" id="answerStepLabel" aria-live="polite">เฉลย: ปิด</span>');
      document.getElementById('btnAnswerPrev').onclick = () => { revealCount -= 1; syncReveal(); };
      document.getElementById('btnAnswerNext').onclick = () => { revealCount += 1; syncReveal(); };
      all.onclick = () => { revealCount = revealCount >= questions().length ? 0 : questions().length; syncReveal(); };
      window.addEventListener('keydown', (event) => {
        if (event.target?.matches?.('input,select,textarea')) return;
        if (event.key === 'ArrowLeft') { revealCount -= 1; syncReveal(); }
        if (event.key === 'ArrowRight') { revealCount += 1; syncReveal(); }
      });
    }
    function currentConfig() {
      const config = {};
      fieldIds.forEach((id) => {
        const field = document.getElementById(id);
        if (field) config[fieldKeyById[id] || id] = field.value;
      });
      return config;
    }
    function applyConfig(config) {
      if (!config) return;
      fieldIds.forEach((id) => {
        const field = document.getElementById(id);
        const value = config[fieldKeyById[id] || id] ?? config[id];
        if (field && value != null) field.value = String(value);
      });
    }
    function seededRender() {
      const originalRandom = Math.random;
      Math.random = createSeededRandom(renderSeed);
      try { options.render(); } finally { Math.random = originalRandom; }
      revealCount = 0;
      syncReveal();
      if (window.KampaiWorksheetSets) window.KampaiWorksheetSets.writeUrl({ seed: renderSeed, setId: setsUi?.getCurrentSetId?.() || undefined });
    }
    function randomize() {
      renderSeed = window.KampaiWorksheetSets ? window.KampaiWorksheetSets.newSeed() : Date.now() + Math.floor(Math.random() * 100000);
      setsUi?.setCurrentSetId?.('');
      window.KampaiWorksheetSets?.writeUrl({ seed: renderSeed, clearSet: true });
      seededRender();
      setsUi?.refreshSuggestedTitle?.(true);
    }
    async function bootSets() {
      try {
        const Sets = await loadSetsModule();
        const fromUrl = Sets.getConfigFromUrl();
        if (fromUrl.seed != null) renderSeed = Number(fromUrl.seed);
        else renderSeed = Sets.newSeed();
        setsUi = Sets.mountToolbar({
          worksheetKey: options.worksheetKey,
          titlePrefix: options.titlePrefix,
          initialSetId: fromUrl.setId || '',
          getState: () => ({ seed: renderSeed, config: currentConfig(), title: document.getElementById('kampaiSetTitle')?.value || '' }),
          applyState: (state) => {
            applyConfig(state?.config);
            if (state?.seed != null) renderSeed = Number(state.seed);
            if (state?.setId) setsUi?.setCurrentSetId?.(state.setId);
            seededRender();
          },
        });
        if (fromUrl.setId) {
          const row = await Sets.load(fromUrl.setId);
          if (row) {
            applyConfig(row.config || {});
            renderSeed = Number(row.seed);
            setsUi?.markTitleLoaded?.(row.title || '');
            setsUi?.setCurrentSetId?.(row.id);
            seededRender();
            setsUi?.setMessage?.('โหลดชุด: ' + (row.title || row.id.slice(0, 8)));
            return;
          }
        }
        seededRender();
        setsUi?.refreshSuggestedTitle?.(false);
      } catch (error) {
        console.warn('worksheet sets unavailable', error);
        seededRender();
      }
    }

    mountRevealControls();
    const randomButton = document.getElementById(options.randomButtonId || 'btnRandom');
    if (randomButton) randomButton.onclick = randomize;
    fieldIds.forEach((id) => {
      const field = document.getElementById(id);
      if (!field || id === 'selUseMode') return;
      field.onchange = seededRender;
      if (field.matches('input')) field.oninput = seededRender;
    });
    // worksheet-modes.js reads these public hooks after this inline script.
    window.render = seededRender;
    window.randomize = randomize;
    bootSets();
    return Object.freeze({ render: seededRender, randomize, syncReveal, getSeed: () => renderSeed });
  }

  window.KampaiWorksheet = Object.freeze({
    getTeachers,
    loadTeachers,
    loadSetsModule,
    upgradeLegacyWorksheet,
    printA4,
    bindPrintButton,
    get supabaseUrl() { return SUPABASE_URL; },
    get publishableKey() { return SUPABASE_PUBLISHABLE_KEY; },
  });
})();
