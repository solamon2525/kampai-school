(function createWorksheetRuntime() {
  const SUPABASE_URL = 'https://lkpqssbqxxpasidfqhpb.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcHFzc2JxeHhwYXNpZGZxaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjUyMjgsImV4cCI6MjA5MTI0MTIyOH0.X7YsSlrgYl9ifLWvgyZI04PtebK572pacadfNlmNO-A';
  const SETS_SCRIPT = '/games/worksheet-sets.js?v=1.175.2';
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

  window.KampaiWorksheet = Object.freeze({
    getTeachers,
    loadTeachers,
    loadSetsModule,
    get supabaseUrl() { return SUPABASE_URL; },
    get publishableKey() { return SUPABASE_PUBLISHABLE_KEY; },
  });
})();
