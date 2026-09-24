(function () {
'use strict';
const { CATEGORY_SLUGS, normalizeOrder, isOrderPayload, acceptsMessage } = window.VocabHubOrder;

const hub = document.getElementById('hub-view');
const grid = document.getElementById('hub-grid');
const status = document.getElementById('hub-order-status');
const edit = document.getElementById('hub-edit');
const actions = document.getElementById('hub-edit-actions');
const save = document.getElementById('hub-save');
let savedOrder = [...CATEGORY_SLUGS];
let draft = [...savedOrder];
let canEdit = false;
let editing = false;
let pending = null;
let saveTimeout;
let drag = null;
let scrollFrame;

function post(data) { if (window.parent !== window) window.parent.postMessage(data, location.origin); }
function say(message) { status.textContent = message; }
function setView(view) {
  hub.dataset.view = ['large', 'standard', 'compact'].includes(view) ? view : 'large';
  document.querySelectorAll('[data-hub-view]').forEach(button =>
    button.setAttribute('aria-pressed', String(button.dataset.hubView === hub.dataset.view)));
  try { localStorage.setItem('vocab_hub_grid_view', hub.dataset.view); } catch { /* optional preference */ }
}
try { setView(localStorage.getItem('vocab_hub_grid_view')); } catch { setView('large'); }
document.querySelectorAll('[data-hub-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.hubView)));

function reorder(focusSlug, focusAction) {
  const cards = new Map([...grid.querySelectorAll('[data-category]')].map(card => [card.dataset.category, card]));
  for (const slug of editing ? draft : savedOrder) {
    const card = cards.get(slug);
    if (card) grid.append(card);
  }
  grid.querySelectorAll('[data-category]').forEach((card, index) => {
    card.setAttribute('role', editing ? 'group' : 'button');
    card.tabIndex = editing ? -1 : 0;
    card.querySelector('.hc-reorder').hidden = !editing;
    card.querySelector('[data-move=before]').disabled = !!pending || index === 0;
    card.querySelector('[data-move=after]').disabled = !!pending || index === draft.length - 1;
    card.querySelector('.hc-handle').disabled = !!pending;
  });
  hub.dataset.editing = String(editing);
  edit.hidden = !canEdit || editing;
  actions.hidden = !editing;
  actions.querySelectorAll('button').forEach(button => { button.disabled = !!pending; });
  if (focusSlug) {
    const card = cards.get(focusSlug);
    const control = card?.querySelector(`[data-move="${focusAction}"]`);
    (control && !control.disabled ? control : card?.querySelector('.hc-handle'))?.focus({ preventScroll: true });
  }
}

function move(slug, targetIndex, focusAction) {
  if (!editing || pending) return;
  const from = draft.indexOf(slug);
  if (from < 0 || targetIndex < 0 || targetIndex >= draft.length || from === targetIndex) return;
  draft.splice(from, 1);
  draft.splice(targetIndex, 0, slug);
  reorder(slug, focusAction);
  say(`ย้าย${grid.querySelector(`[data-category="${slug}"] .hc-th`).textContent}ไปลำดับ ${targetIndex + 1} แล้ว · กดบันทึกเพื่อใช้กับทุกคน`);
}

function enhance() {
  grid.querySelectorAll('.hub-card').forEach((card, index) => {
    const slug = card.dataset.category || 'starred';
    const icon = card.querySelector('.hc-icon');
    if (!icon.querySelector('img')) {
      icon.replaceChildren();
      const image = document.createElement('img');
      image.src = `/games/english/vocab-hub-covers/${slug}.webp`;
      image.alt = ''; image.width = 640; image.height = 640;
      image.loading = index < 4 ? 'eager' : 'lazy'; image.decoding = 'async';
      image.addEventListener('error', () => { icon.textContent = '📚'; }, { once: true });
      icon.append(image);
    }
    card.setAttribute('role', 'button'); card.tabIndex = 0;
    if (card.dataset.enhanced) return;
    card.dataset.enhanced = 'true';
    card.setAttribute('aria-label', card.querySelector('.hc-th').textContent);
    card.addEventListener('keydown', event => {
      if (event.target !== card || editing || !['Enter', ' '].includes(event.key)) return;
      event.preventDefault(); card.click();
    });
    if (slug === 'starred') return;
    const controls = document.createElement('div'); controls.className = 'hc-reorder';
    controls.addEventListener('click', event => event.stopPropagation());
    const title = card.querySelector('.hc-th').textContent;
    controls.innerHTML = '<button type="button" class="hub-control hc-handle">⠿</button><button type="button" class="hub-control" data-move="before">←</button><button type="button" class="hub-control" data-move="after">→</button>';
    controls.querySelector('.hc-handle').setAttribute('aria-label', `ลากจัดลำดับ ${title}`);
    controls.querySelector('[data-move=before]').setAttribute('aria-label', `เลื่อน ${title} ก่อนหน้า`);
    controls.querySelector('[data-move=after]').setAttribute('aria-label', `เลื่อน ${title} ถัดไป`);
    controls.querySelectorAll('[data-move]').forEach(button => button.addEventListener('click', () =>
      move(slug, draft.indexOf(slug) + (button.dataset.move === 'before' ? -1 : 1), button.dataset.move)));
    card.append(controls);
  });
  reorder();
}

// Capture prevents category navigation while the administrator is rearranging.
grid.addEventListener('click', event => {
  if (editing && !event.target.closest('.hc-reorder')) { event.preventDefault(); event.stopImmediatePropagation(); }
}, true);
grid.addEventListener('click', event => {
  if (event.target.closest('.hc-reorder')) event.stopPropagation();
});
edit.addEventListener('click', () => {
  if (!canEdit) return;
  draft = [...savedOrder]; editing = true; reorder();
  say('ลากที่ปุ่ม ⠿ หรือใช้ปุ่มก่อนหน้า / ถัดไป แล้วกดบันทึกเพื่อใช้ลำดับนี้กับทุกคน');
});
document.getElementById('hub-cancel').addEventListener('click', () => {
  finishDrag(false); editing = false; draft = [...savedOrder]; reorder(); say('ยกเลิกการจัดลำดับแล้ว'); edit.focus();
});
document.getElementById('hub-reset').addEventListener('click', () => {
  draft = [...CATEGORY_SLUGS]; reorder(); say('คืนลำดับต้นฉบับแล้ว · กดบันทึกเพื่อใช้กับทุกคน');
});
save.addEventListener('click', () => {
  if (!canEdit || pending || !isOrderPayload(draft)) return;
  pending = crypto.randomUUID(); reorder(); say('กำลังบันทึกลำดับกลาง…');
  post({ type: 'vocabHubLayoutSave', requestId: pending, order: draft });
  saveTimeout = setTimeout(() => {
    pending = null; reorder(); say('ยังไม่ได้รับผลบันทึก กรุณาลองอีกครั้ง ฉบับร่างยังอยู่');
  }, 20000);
});

window.addEventListener('message', event => {
  if (window.parent === window || !acceptsMessage(event, window.parent, location.origin)) return;
  const data = event.data;
  if (!data || typeof data !== 'object') return;
  if (data.type === 'vocabHubLayoutState' && Array.isArray(data.order) && typeof data.canEdit === 'boolean') {
    canEdit = data.canEdit;
    savedOrder = normalizeOrder(data.order);
    if (!canEdit && editing) { finishDrag(false); editing = false; }
    if (!editing) draft = [...savedOrder];
    reorder();
    if (!editing) say(data.error ? 'โหลดลำดับกลางไม่ได้ กำลังแสดงลำดับเดิม' : data.loading ? 'กำลังโหลดลำดับหมวดหมู่…' : 'เลือกหมวดหมู่ที่อยากเรียนรู้ แล้วเริ่มกันเลย');
  }
  if (data.type === 'vocabHubLayoutSaved' && pending && data.requestId === pending && typeof data.ok === 'boolean') {
    clearTimeout(saveTimeout); pending = null;
    if (data.ok && isOrderPayload(data.order)) {
      savedOrder = [...data.order]; draft = [...savedOrder]; editing = false;
      say('บันทึกแล้ว ทุกคนจะเห็นลำดับนี้เมื่อเปิดหน้าใหม่');
    } else say('บันทึกไม่สำเร็จ กรุณาลองอีกครั้ง ฉบับร่างยังอยู่');
    reorder();
    (editing ? save : edit).focus();
  }
});

function updateTarget() {
  if (!drag) return;
  grid.querySelectorAll('.drop-target').forEach(card => card.classList.remove('drop-target'));
  const target = document.elementFromPoint(drag.x, drag.y)?.closest('[data-category]');
  drag.target = target?.dataset.category;
  if (target && drag.target !== drag.slug) target.classList.add('drop-target');
}
function autoScroll() {
  if (!drag) return;
  const rect = hub.getBoundingClientRect();
  const speed = drag.y < rect.top + 90 ? -14 : drag.y > rect.bottom - 90 ? 14 : 0;
  if (speed) { hub.scrollTop += speed; updateTarget(); }
  scrollFrame = requestAnimationFrame(autoScroll);
}
function finishDrag(commit) {
  if (!drag) return;
  const current = drag; drag = null; cancelAnimationFrame(scrollFrame);
  if (current.handle.hasPointerCapture(current.id)) current.handle.releasePointerCapture(current.id);
  grid.querySelectorAll('.is-dragging,.drop-target').forEach(card => card.classList.remove('is-dragging', 'drop-target'));
  if (commit && current.target) move(current.slug, draft.indexOf(current.target));
}
grid.addEventListener('pointerdown', event => {
  const handle = event.target.closest('.hc-handle');
  if (!handle || !editing || pending || event.button !== 0) return;
  event.preventDefault();
  const card = handle.closest('[data-category]');
  drag = { slug: card.dataset.category, handle, id: event.pointerId, x: event.clientX, y: event.clientY };
  handle.setPointerCapture(event.pointerId); card.classList.add('is-dragging'); autoScroll();
});
grid.addEventListener('pointermove', event => {
  if (!drag || event.pointerId !== drag.id) return;
  drag.x = event.clientX; drag.y = event.clientY; updateTarget();
});
grid.addEventListener('pointerup', () => finishDrag(true));
grid.addEventListener('pointercancel', () => finishDrag(false));
grid.addEventListener('lostpointercapture', () => finishDrag(false));
window.addEventListener('keydown', event => { if (event.key === 'Escape') finishDrag(false); });
window.addEventListener('pagehide', () => { finishDrag(false); clearTimeout(saveTimeout); });

window.VocabHubMenu = { enhance };
enhance();
post({ type: 'vocabHubLayoutRequest' });
})();
