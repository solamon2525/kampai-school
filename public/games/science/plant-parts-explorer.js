(() => {
  'use strict';
  const content = window.PLANT_PARTS_CONTENT;
  const byId = id => document.getElementById(id);
  const state = { part: null, step: -1, answer: false, notes: false, speaking: false };
  let generation = 0;
  let watchdog = null;
  const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function stop() {
    generation++;
    clearTimeout(watchdog);
    watchdog = null;
    state.speaking = false;
    window.speechSynthesis?.cancel();
    document.querySelectorAll('.spoken,.reading-now').forEach(el => el.classList.remove('spoken', 'reading-now'));
    const button = byId('btnSpeakPart');
    if (button) { button.textContent = 'ฟัง'; button.setAttribute('aria-pressed', 'false'); }
  }

  function listen() {
    if (state.speaking) { stop(); return; }
    stop();
    const status = byId('speechStatus');
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      status.textContent = 'เครื่องนี้ไม่รองรับเสียง อ่านคำอธิบายบนจอได้';
      return;
    }
    const blocks = [...byId('partDetail').querySelectorAll('[data-narration]')].filter(el => !el.closest('details') || el.closest('details').open);
    const token = generation;
    state.speaking = true;
    status.textContent = '';
    byId('btnSpeakPart').textContent = 'หยุด';
    byId('btnSpeakPart').setAttribute('aria-pressed', 'true');
    document.querySelectorAll('[data-part].on').forEach(el => el.classList.add('reading-now'));
    if (state.step >= 0) byId('partImage').classList.add('reading-now');
    let index = 0;
    function next() {
      if (token !== generation) return;
      if (index >= blocks.length) { stop(); return; }
      const block = blocks[index++];
      const utterance = new SpeechSynthesisUtterance(block.textContent);
      utterance.lang = 'th-TH';
      utterance.rate = 0.85;
      const voice = speechSynthesis.getVoices().find(v => /^th([-_]|$)/i.test(v.lang));
      if (voice) utterance.voice = voice;
      let settled = false;
      const finish = failed => {
        if (settled || token !== generation) return;
        settled = true;
        clearTimeout(watchdog);
        block.classList.remove('spoken');
        if (failed) { stop(); status.textContent = 'เสียงไม่พร้อมใช้งาน กดฟังเพื่อลองใหม่ได้'; }
        else next();
      };
      utterance.onstart = () => { if (token === generation) block.classList.add('spoken'); };
      utterance.onend = () => finish(false);
      utterance.onerror = () => finish(true);
      watchdog = setTimeout(() => finish(true), Math.max(20000, utterance.text.length * 300));
      try { speechSynthesis.speak(utterance); } catch { finish(true); }
    }
    next();
  }

  function render() {
    const part = content.parts.find(p => p.id === state.part);
    const expanded = state.step >= 0;
    byId('closeup').hidden = !expanded;
    document.querySelector('.plant-view').classList.toggle('expanded', expanded);
    document.querySelectorAll('[data-part]').forEach(el => {
      const active = el.dataset.part === state.part;
      el.classList.toggle('on', active);
      el.setAttribute('aria-pressed', String(active));
    });
    if (!part) return;
    if (expanded && byId('partImage').getAttribute('src') !== part.image) {
      byId('detailFallback').hidden = true;
      byId('partImage').hidden = false;
      byId('partImage').alt = part.imageAlt;
      byId('partImage').src = part.image;
    }
    byId('partDetail').innerHTML = `
      <p class="step-label">${part.core ? 'เนื้อหาหลัก ป.4' : 'เรียนรู้เพิ่มเติม'}${expanded ? ` · ขั้น ${state.step + 1}/${part.steps.length}` : ''}</p>
      <h2 data-narration>${escape(part.nameTh)}</h2>
      <p data-narration>${escape(expanded ? part.steps[state.step] : part.functionTh)}</p>
      ${expanded ? `<div class="actions"><button class="btn btn-ghost" id="previousStep" ${state.step === 0 ? 'disabled' : ''}>ย้อนกลับ</button><button class="btn btn-primary" id="nextStep" ${state.step === part.steps.length - 1 ? 'disabled' : ''}>ถัดไป</button></div>` : '<button class="btn btn-primary" id="showDetail">ดูรายละเอียด</button>'}
      <div class="actions"><button class="btn btn-accent" id="btnSpeakPart" aria-pressed="false">ฟัง</button></div>
      <p class="speech-status" id="speechStatus" role="status"></p>
      <details id="teacherNotes" ${state.notes ? 'open' : ''}><summary>ตัวอย่างและคำถามชวนคิด</summary>
      ${!expanded ? `<p class="examples" data-narration>ตัวอย่าง: ${escape(part.examples.join(' · '))}</p>` : `<p class="tip" data-narration>${escape(part.funFact)}</p>`}
      <p data-narration><strong>ลองคิด:</strong> ${escape(part.question)}</p>
      <button class="btn btn-ghost" id="showAnswer" aria-expanded="${state.answer}">${state.answer ? 'ซ่อนแนวคำตอบ' : 'เปิดแนวคำตอบ'}</button>
      ${state.answer ? `<p data-narration>${escape(part.answer)}</p>` : ''}</details>`;
    byId('teacherNotes').addEventListener('toggle', event => {
      if (event.target.isConnected && state.notes !== event.target.open) { stop(); state.notes = event.target.open; }
    });
    byId('btnSpeakPart').onclick = listen;
    byId('showDetail')?.addEventListener('click', () => { stop(); state.step = 0; render(); });
    byId('previousStep')?.addEventListener('click', () => changeStep(-1));
    byId('nextStep')?.addEventListener('click', () => changeStep(1));
    byId('showAnswer').onclick = () => { stop(); state.answer = !state.answer; render(); byId('showAnswer').focus({ preventScroll: true }); };
  }

  function changeStep(delta) {
    stop();
    state.step += delta;
    render();
    byId(delta > 0 ? 'previousStep' : 'nextStep').focus({ preventScroll: true });
  }
  function select(id) {
    stop();
    state.part = id;
    state.step = -1;
    state.answer = false;
    state.notes = false;
    render();
  }

  byId('plantOverview').onerror = () => { byId('overviewFallback').hidden = false; byId('plantFrame').classList.add('failed'); };
  byId('plantOverview').onload = () => { byId('overviewFallback').hidden = true; byId('plantFrame').classList.remove('failed'); };
  byId('plantOverview').alt = content.overviewAlt;
  byId('plantOverview').src = content.overview;
  byId('partImage').onerror = () => { byId('partImage').hidden = true; byId('detailFallback').hidden = false; };
  byId('partImage').onload = () => { byId('partImage').hidden = false; byId('detailFallback').hidden = true; };
  byId('backOverview').onclick = () => { stop(); state.step = -1; render(); byId('showDetail').focus({ preventScroll: true }); };
  byId('hintText').textContent = 'เลือกส่วนของพืชเพื่อสำรวจ แล้วกดฟังเมื่อต้องการเสียง';
  content.parts.forEach((part, i) => {
    if (i === 4) {
      const heading = document.createElement('p');
      heading.className = 'chip-heading';
      heading.textContent = 'เรียนรู้เพิ่มเติม';
      byId('partChips').append(heading);
    }
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip';
    chip.dataset.part = part.id;
    chip.textContent = `${i + 1}. ${part.nameTh}`;
    chip.onclick = () => select(part.id);
    chip.setAttribute('aria-pressed', 'false');
    byId('partChips').append(chip);
    // Seeds are inside the fruit, not visibly floating beside the plant.
    if (part.hotspot) {
      const pin = chip.cloneNode(true);
      pin.className = 'plant-pin';
      pin.textContent = String(i + 1);
      pin.setAttribute('aria-label', part.nameTh);
      pin.style.left = `${part.hotspot.x}%`;
      pin.style.top = `${part.hotspot.y}%`;
      pin.onclick = () => select(part.id);
      byId('plantHotspots').append(pin);
    }
  });
  const sources = document.createElement('details');
  sources.className = 'source-links';
  sources.innerHTML = '<summary>แหล่งอ้างอิงสำหรับครู</summary>' + content.sources.map(s => `<a href="${escape(s.url)}" target="_blank" rel="noopener">${escape(s.title)}</a>`).join('');
  byId('panel-diagram').append(sources);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
  document.addEventListener('fullscreenchange', stop);
  window.addEventListener('pagehide', stop);
  window.PlantExplorer = Object.freeze({ stop });
  Object.defineProperty(window, 'PlantPartsMedia', { value: Object.freeze({
    getState: () => Object.freeze({ ...state, image: state.step >= 0 ? content.parts.find(p => p.id === state.part)?.image : content.overview })
  }) });
})();
