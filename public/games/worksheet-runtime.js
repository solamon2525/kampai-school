(function createWorksheetRuntime() {
  const SUPABASE_URL = 'https://lkpqssbqxxpasidfqhpb.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcHFzc2JxeHhwYXNpZGZxaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjUyMjgsImV4cCI6MjA5MTI0MTIyOH0.X7YsSlrgYl9ifLWvgyZI04PtebK572pacadfNlmNO-A';
  let teacherPromise = null;

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
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

  window.KampaiWorksheet = Object.freeze({ getTeachers, loadTeachers });
})();
