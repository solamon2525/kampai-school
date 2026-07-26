(function createWorksheetRuntime() {
  const SUPABASE_URL = 'https://lkpqssbqxxpasidfqhpb.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcHFzc2JxeHhwYXNpZGZxaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjUyMjgsImV4cCI6MjA5MTI0MTIyOH0.X7YsSlrgYl9ifLWvgyZI04PtebK572pacadfNlmNO-A';
  const SETS_SCRIPT = '/games/worksheet-sets.js?v=1.175.15';
  let teacherPromise = null;
  let setsPromise = null;

  /** Step-through teacher reveal (port of rect-area pattern). */
  function createAnswerReveal(options = {}) {
    let revealCount = 0;
    const pagesId = options.pagesId || 'pages';
    const questionSelector = options.questionSelector || '.q';
    let wired = false;

    function getQuestions() {
      const root = document.getElementById(pagesId);
      if (!root) return [];
      return Array.from(root.querySelectorAll(questionSelector));
    }

    function sync() {
      document.body.classList.remove('show-answers');
      const qs = getQuestions();
      const total = qs.length;
      qs.forEach((q, index) => {
        q.classList.toggle('reveal-answer', index < revealCount);
        q.classList.toggle('reveal-current', revealCount > 0 && index === revealCount - 1);
      });
      const label = document.getElementById('answerStepLabel');
      const btnAll = document.getElementById('btnAnswers');
      const btnPrev = document.getElementById('btnAnswerPrev');
      const btnNext = document.getElementById('btnAnswerNext');
      if (label) {
        if (!total || revealCount <= 0) label.textContent = 'เฉลย: ปิด';
        else if (revealCount >= total) label.textContent = 'เฉลย: ครบ ' + total + ' ข้อ';
        else label.textContent = 'เฉลยข้อ ' + revealCount + ' / ' + total;
      }
      if (btnAll) {
        if (!total || revealCount <= 0) btnAll.textContent = options.allLabel || '👁 ทั้งหมด';
        else if (revealCount >= total) btnAll.textContent = options.hideLabel || '🙈 ซ่อนทั้งหมด';
        else btnAll.textContent = options.allLabel || '👁 ทั้งหมด';
      }
      if (btnPrev) btnPrev.disabled = revealCount <= 0;
      if (btnNext) btnNext.disabled = !total || revealCount >= total;
    }

    function reset() {
      revealCount = 0;
      sync();
    }

    function revealNext() {
      const total = getQuestions().length;
      if (revealCount < total) revealCount += 1;
      sync();
    }

    function revealPrev() {
      if (revealCount > 0) revealCount -= 1;
      sync();
    }

    function toggleAll() {
      const total = getQuestions().length;
      revealCount = revealCount >= total ? 0 : total;
      sync();
    }

    function ensureControls() {
      const btnAll = document.getElementById('btnAnswers');
      if (!btnAll || !btnAll.parentElement) return;
      if (!document.getElementById('answerStepLabel')) {
        const label = document.createElement('span');
        label.id = 'answerStepLabel';
        label.className = 'answer-step-label';
        label.setAttribute('aria-live', 'polite');
        label.textContent = 'เฉลย: ปิด';
        btnAll.parentElement.insertBefore(label, btnAll);
      }
      if (!document.getElementById('btnAnswerPrev')) {
        const prev = document.createElement('button');
        prev.type = 'button';
        prev.className = 'btn';
        prev.id = 'btnAnswerPrev';
        prev.title = 'ซ่อนข้อล่าสุด';
        prev.textContent = '◀ ข้อก่อน';
        btnAll.parentElement.insertBefore(prev, btnAll);
      }
      if (!document.getElementById('btnAnswerNext')) {
        const next = document.createElement('button');
        next.type = 'button';
        next.className = 'btn';
        next.id = 'btnAnswerNext';
        next.title = 'เปิดเฉลยข้อถัดไป';
        next.textContent = '▶ เฉลยข้อถัดไป';
        btnAll.parentElement.insertBefore(next, btnAll);
      }
    }

    function install() {
      ensureControls();
      if (wired) {
        sync();
        return api;
      }
      wired = true;
      document.addEventListener('click', (event) => {
        const btn = event.target.closest('#btnAnswerNext, #btnAnswerPrev, #btnAnswers');
        if (!btn || !document.getElementById(pagesId)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (btn.id === 'btnAnswerNext') revealNext();
        else if (btn.id === 'btnAnswerPrev') revealPrev();
        else toggleAll();
      }, true);
      document.addEventListener('keydown', (event) => {
        if (event.target.matches('input,textarea,select')) return;
        if (!document.getElementById(pagesId)) return;
        if (event.key === 'ArrowRight' || event.key === 'n' || event.key === 'N') {
          event.preventDefault();
          revealNext();
        }
        if (event.key === 'ArrowLeft' || event.key === 'b' || event.key === 'B') {
          event.preventDefault();
          revealPrev();
        }
      });
      sync();
      return api;
    }

    const api = { sync, reset, revealNext, revealPrev, toggleAll, install, ensureControls };
    return api;
  }

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

  window.KampaiWorksheet = Object.freeze({
    getTeachers,
    loadTeachers,
    loadSetsModule,
    createAnswerReveal,
    get supabaseUrl() { return SUPABASE_URL; },
    get publishableKey() { return SUPABASE_PUBLISHABLE_KEY; },
  });
})();
