/**
 * KampaiWorksheetSets — shared engine for saving/loading printable worksheet sets.
 * Uses the same publishable key + portal localStorage session as worksheet-runtime.js.
 * Do not duplicate SUPABASE_URL/key inside individual worksheet HTML files.
 */
(function createWorksheetSets() {
  const VERSION = '1.175.2';
  const SUPABASE_URL = 'https://lkpqssbqxxpasidfqhpb.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrcHFzc2JxeHhwYXNpZGZxaHBiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU2NjUyMjgsImV4cCI6MjA5MTI0MTIyOH0.X7YsSlrgYl9ifLWvgyZI04PtebK572pacadfNlmNO-A';
  const AUTH_STORAGE_KEY = 'sb-lkpqssbqxxpasidfqhpb-auth-token';

  function mulberry32(seed) {
    let t = (Number(seed) >>> 0) || 1;
    return function next() {
      t += 0x6D2B79F5;
      let r = Math.imul(t ^ (t >>> 15), 1 | t);
      r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
      return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createRng(seed) {
    const next = mulberry32(seed);
    return {
      random: next,
      randomInt(a, b) {
        const lo = Math.min(a, b);
        const hi = Math.max(a, b);
        return lo + Math.floor(next() * (hi - lo + 1));
      },
    };
  }

  function newSeed() {
    return (Date.now() ^ (Math.floor(Math.random() * 0x7fffffff))) >>> 0;
  }

  function getConfigFromUrl(search) {
    const params = new URLSearchParams(search || window.location.search);
    const setId = params.get('set') || '';
    const seedRaw = params.get('seed');
    const seed = seedRaw != null && seedRaw !== '' && Number.isFinite(Number(seedRaw))
      ? Number(seedRaw)
      : null;
    const out = { setId, seed };
    params.forEach((value, key) => {
      if (key === 'set' || key === 'seed') return;
      out[key] = value;
    });
    return out;
  }

  function writeUrl(options) {
    const opts = options || {};
    const url = new URL(window.location.href);
    if (opts.setId) url.searchParams.set('set', opts.setId);
    else if (opts.clearSet) url.searchParams.delete('set');
    if (opts.seed != null && opts.seed !== '') url.searchParams.set('seed', String(opts.seed));
    else if (opts.clearSeed) url.searchParams.delete('seed');
    const next = url.pathname + url.search + url.hash;
    if (opts.replace !== false) window.history.replaceState({}, '', next);
    else window.history.pushState({}, '', next);
    return next;
  }

  function readStoredSession() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const session = parsed?.currentSession || parsed;
      const accessToken = session?.access_token;
      const user = session?.user;
      if (!accessToken || !user?.id) return null;
      return { accessToken, userId: user.id, user };
    } catch {
      return null;
    }
  }

  function headers(accessToken) {
    const token = accessToken || SUPABASE_PUBLISHABLE_KEY;
    return {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };
  }

  async function rest(path, options) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, options);
    const text = await response.text();
    let data = null;
    if (text) {
      try { data = JSON.parse(text); } catch { data = text; }
    }
    if (!response.ok) {
      const message = (data && data.message) || (data && data.error_description) || response.statusText || 'request failed';
      const err = new Error(message);
      err.status = response.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  async function getSessionStaff() {
    const session = readStoredSession();
    if (!session) return null;
    const rows = await rest(
      `user_roles?select=staff_id,role&user_id=eq.${encodeURIComponent(session.userId)}&staff_id=not.is.null&limit=1`,
      { headers: headers(session.accessToken) },
    );
    const staffId = Array.isArray(rows) && rows[0]?.staff_id ? rows[0].staff_id : null;
    if (!staffId) return { userId: session.userId, staffId: null, accessToken: session.accessToken };
    return { userId: session.userId, staffId, accessToken: session.accessToken };
  }

  async function listMine(worksheetKey) {
    const session = await getSessionStaff();
    if (!session?.staffId) return [];
    let path = `worksheet_sets?select=id,title,worksheet_key,seed,config,access,created_at,updated_at&owner_staff_id=eq.${encodeURIComponent(session.staffId)}&order=created_at.desc`;
    if (worksheetKey) path += `&worksheet_key=eq.${encodeURIComponent(worksheetKey)}`;
    const rows = await rest(path, { headers: headers(session.accessToken) });
    return Array.isArray(rows) ? rows : [];
  }

  async function load(setId) {
    if (!setId) return null;
    const session = readStoredSession();
    const rows = await rest(
      `worksheet_sets?select=id,owner_staff_id,worksheet_key,title,seed,config,access,created_at,updated_at&id=eq.${encodeURIComponent(setId)}&limit=1`,
      { headers: headers(session?.accessToken) },
    );
    return Array.isArray(rows) && rows[0] ? rows[0] : null;
  }

  async function save(payload) {
    const session = await getSessionStaff();
    if (!session?.staffId) {
      const err = new Error('login_required');
      err.code = 'login_required';
      throw err;
    }
    const body = {
      owner_staff_id: session.staffId,
      worksheet_key: payload.worksheetKey,
      title: payload.title || 'ชุดใบงาน',
      seed: Number(payload.seed),
      config: payload.config || {},
      access: payload.access === 'private' ? 'private' : 'link',
      updated_at: new Date().toISOString(),
    };
    if (payload.id) {
      const rows = await rest(
        `worksheet_sets?id=eq.${encodeURIComponent(payload.id)}`,
        {
          method: 'PATCH',
          headers: headers(session.accessToken),
          body: JSON.stringify(body),
        },
      );
      return Array.isArray(rows) ? rows[0] : rows;
    }
    const rows = await rest('worksheet_sets', {
      method: 'POST',
      headers: headers(session.accessToken),
      body: JSON.stringify(body),
    });
    return Array.isArray(rows) ? rows[0] : rows;
  }

  async function remove(id) {
    const session = await getSessionStaff();
    if (!session?.staffId) {
      const err = new Error('login_required');
      err.code = 'login_required';
      throw err;
    }
    await rest(`worksheet_sets?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: headers(session.accessToken),
    });
    return true;
  }

  function ensureSetToolbarStyles() {
    if (document.getElementById('kampai-worksheet-sets-style')) return;
    const style = document.createElement('style');
    style.id = 'kampai-worksheet-sets-style';
    style.textContent = [
      '.kampai-set-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center}',
      '.kampai-set-bar .t-select,.kampai-set-bar .t-input{font:700 .82rem Sarabun,sans-serif;padding:6px 8px;border-radius:8px;border:1px solid currentColor;background:transparent;color:inherit;max-width:11rem}',
      '.kampai-set-bar .t-input{min-width:10rem;max-width:22rem}',
      '.kampai-set-bar .t-input[readonly]{opacity:.95;cursor:default;background:rgba(255,255,255,.12)}',
      '.kampai-set-bar .kampai-set-id{font:700 .75rem Sarabun,sans-serif;opacity:.9;max-width:9rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.kampai-set-bar .kampai-set-msg{font:600 .75rem Sarabun,sans-serif;opacity:.95}',
    ].join('');
    document.head.appendChild(style);
  }

  function mountToolbar(options) {
    const opts = options || {};
    const worksheetKey = opts.worksheetKey;
    if (!worksheetKey) throw new Error('worksheetKey is required');
    const getState = opts.getState;
    const applyState = opts.applyState;
    if (typeof getState !== 'function' || typeof applyState !== 'function') {
      throw new Error('getState and applyState are required');
    }

    ensureSetToolbarStyles();
    const host = opts.container
      || document.querySelector('.toolbar-ctrls')
      || document.querySelector('.toolbar');
    if (!host) return null;

    let bar = host.querySelector('.kampai-set-bar');
    if (!bar) {
      bar = document.createElement('div');
      bar.className = 'kampai-set-bar';
      bar.setAttribute('data-worksheet-sets', worksheetKey);
      host.appendChild(bar);
    }

    const autoTitle = typeof opts.suggestTitle === 'function';
    bar.innerHTML = [
      '<input class="t-input" id="kampaiSetTitle" type="text" '
        + (autoTitle
          ? 'readonly placeholder="ชื่อชุดตั้งอัตโนมัติตามประเภท/จำนวนหน้า" title="ตั้งชื่ออัตโนมัติจากประเภทใบงานและจำนวนหน้า — ไม่ต้องพิมพ์"'
          : 'placeholder="ชื่อชุด เช่น สัปดาห์ที่ 3"')
        + ' aria-label="ชื่อชุดใบงาน" />',
      '<button type="button" class="btn primary" id="kampaiBtnSaveSet">💾 บันทึกชุด</button>',
      '<select class="t-select" id="kampaiSelMine" aria-label="ชุดของฉัน"><option value="">— ชุดของฉัน —</option></select>',
      '<button type="button" class="btn" id="kampaiBtnCopyLink">🔗 คัดลอกลิงก์</button>',
      '<span class="kampai-set-id" id="kampaiSetIdLabel" title=""></span>',
      '<span class="kampai-set-msg" id="kampaiSetMsg" aria-live="polite"></span>',
    ].join('');

    const titleInput = bar.querySelector('#kampaiSetTitle');
    const selMine = bar.querySelector('#kampaiSelMine');
    const idLabel = bar.querySelector('#kampaiSetIdLabel');
    const msg = bar.querySelector('#kampaiSetMsg');
    let currentSetId = opts.initialSetId || getConfigFromUrl().setId || '';
    let lastRows = [];
    let lastSuggested = '';
    let titleTouched = false;

    function setMessage(text, isError) {
      msg.textContent = text || '';
      msg.style.color = isError ? '#fecaca' : '';
    }

    function syncIdLabel() {
      if (!currentSetId) {
        idLabel.textContent = '';
        idLabel.title = '';
        return;
      }
      idLabel.textContent = 'รหัส: ' + currentSetId.slice(0, 8) + '…';
      idLabel.title = currentSetId;
    }

    function buildSuggestedTitle() {
      if (typeof opts.suggestTitle !== 'function') return '';
      try {
        return String(opts.suggestTitle({
          rows: lastRows,
          state: (typeof getState === 'function' ? getState() : null) || {},
          currentSetId,
        }) || '').trim();
      } catch {
        return '';
      }
    }

    function applySuggestedTitle(force) {
      if (!titleInput || typeof opts.suggestTitle !== 'function') return '';
      const current = (titleInput.value || '').trim();
      if (!force) {
        if (titleTouched && current) return current;
        if (currentSetId && current) return current;
      }
      const suggested = buildSuggestedTitle();
      if (!suggested) return current;
      lastSuggested = suggested;
      titleInput.value = suggested;
      titleTouched = false;
      return suggested;
    }

    if (titleInput) {
      titleInput.addEventListener('input', () => {
        const current = (titleInput.value || '').trim();
        titleTouched = current !== lastSuggested;
      });
    }

    async function refreshMine() {
      const session = await getSessionStaff();
      if (!session?.staffId) {
        selMine.innerHTML = '<option value="">— เข้าพอร์ทัลครูก่อน —</option>';
        lastRows = [];
        applySuggestedTitle(false);
        return;
      }
      try {
        const rows = await listMine(worksheetKey);
        lastRows = rows;
        selMine.innerHTML = '<option value="">— ชุดของฉัน (' + rows.length + ') —</option>'
          + rows.map((row) => {
            const label = (row.title || 'ไม่มีชื่อ') + ' · ' + String(row.id).slice(0, 8);
            return '<option value="' + row.id + '">' + label.replace(/</g, '&lt;') + '</option>';
          }).join('');
        if (currentSetId) selMine.value = currentSetId;
        applySuggestedTitle(false);
      } catch (error) {
        selMine.innerHTML = '<option value="">— โหลดชุดไม่สำเร็จ —</option>';
        setMessage(error.message || 'โหลดชุดไม่สำเร็จ', true);
      }
    }

    async function handleSave() {
      setMessage('กำลังบันทึก…');
      try {
        const state = getState() || {};
        // มี suggestTitle = ชื่อชุดตั้งอัตโนมัติเสมอ (ตามประเภท/จำนวนหน้า) ไม่ต้องพิมพ์เอง
        let title = autoTitle
          ? (applySuggestedTitle(true) || (state.title || '').trim())
          : ((titleInput.value || '').trim() || applySuggestedTitle(true) || (state.title || '').trim());
        const saved = await save({
          id: currentSetId || undefined,
          worksheetKey,
          title: title || 'ชุดใบงาน',
          seed: state.seed,
          config: state.config || {},
          access: 'link',
        });
        currentSetId = saved.id;
        if (titleInput && saved.title) {
          titleInput.value = saved.title;
          lastSuggested = saved.title;
          titleTouched = false;
        }
        writeUrl({ setId: currentSetId, seed: saved.seed });
        syncIdLabel();
        await refreshMine();
        setMessage('บันทึกแล้ว — เปิดลิงก์นี้วันหลังได้ชุดเดิม');
      } catch (error) {
        if (error.code === 'login_required' || error.message === 'login_required') {
          setMessage('เข้าพอร์ทัลครูบนโดเมนนี้ก่อน แล้วค่อยบันทึก', true);
        } else {
          setMessage(error.message || 'บันทึกไม่สำเร็จ', true);
        }
      }
    }

    async function handleLoadSelected() {
      const id = selMine.value;
      if (!id) return;
      setMessage('กำลังโหลดชุด…');
      try {
        const row = await load(id);
        if (!row) {
          setMessage('ไม่พบชุดนี้', true);
          return;
        }
        currentSetId = row.id;
        if (titleInput) {
          titleInput.value = row.title || '';
          lastSuggested = '';
          titleTouched = true;
        }
        writeUrl({ setId: row.id, seed: row.seed });
        applyState({ seed: Number(row.seed), config: row.config || {}, title: row.title, setId: row.id });
        syncIdLabel();
        setMessage('โหลดชุด: ' + (row.title || row.id.slice(0, 8)));
      } catch (error) {
        setMessage(error.message || 'โหลดไม่สำเร็จ', true);
      }
    }

    async function handleCopyLink() {
      const state = getState() || {};
      const url = new URL(window.location.href);
      if (currentSetId) url.searchParams.set('set', currentSetId);
      else url.searchParams.delete('set');
      if (state.seed != null) url.searchParams.set('seed', String(state.seed));
      try {
        await navigator.clipboard.writeText(url.toString());
        setMessage(currentSetId ? 'คัดลอกลิงก์ชุดแล้ว' : 'คัดลอกลิงก์ (ยังไม่บันทึก — ใช้ seed ชั่วคราว)');
      } catch {
        setMessage(url.toString());
      }
    }

    bar.querySelector('#kampaiBtnSaveSet').onclick = handleSave;
    bar.querySelector('#kampaiBtnCopyLink').onclick = handleCopyLink;
    selMine.onchange = handleLoadSelected;
    syncIdLabel();
    applySuggestedTitle(false);
    refreshMine();

    return {
      getCurrentSetId: () => currentSetId,
      setCurrentSetId(id) {
        const prev = currentSetId;
        currentSetId = id || '';
        syncIdLabel();
        if (prev && !currentSetId) applySuggestedTitle(false);
      },
      refreshMine,
      refreshSuggestedTitle(force) {
        return applySuggestedTitle(!!force);
      },
      markTitleLoaded(title) {
        if (!titleInput) return;
        if (title != null) titleInput.value = String(title);
        lastSuggested = '';
        titleTouched = true;
      },
      setMessage,
    };
  }

  window.KampaiWorksheetSets = Object.freeze({
    VERSION,
    mulberry32,
    createRng,
    newSeed,
    getConfigFromUrl,
    writeUrl,
    getSessionStaff,
    listMine,
    save,
    load,
    remove,
    mountToolbar,
  });
})();
