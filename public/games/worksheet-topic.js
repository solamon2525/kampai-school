(function createTopicWorksheetEngine() {
  const config = window.WORKSHEET_CONFIG;
  if (!config) throw new Error('WORKSHEET_CONFIG is required');

  const SCHOOL_LOGO_URL = 'https://lkpqssbqxxpasidfqhpb.supabase.co/storage/v1/object/public/school-images/logo/1778157862905_c2swwm.webp';
  let renderSeed = Date.now();

  function escapeHtml(value) {
    return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
  }

  function shuffle(items) {
    const result = [...items];
    let seed = renderSeed;
    for (let index = result.length - 1; index > 0; index -= 1) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      const pick = seed % (index + 1);
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
    renderSeed += 1;
    const style = document.getElementById('selStyle').value;
    const pageCount = Number(document.getElementById('selPageCount').value);
    const count = Number(document.getElementById('selCount').value);
    const topic = document.getElementById('selTopic').value;
    const schoolName = document.getElementById('inpSchool').value.trim() || 'โรงเรียนบ้านคำไผ่';
    const teacherName = document.getElementById('selTeacher').value;
    let html = style === 'booklet' ? renderCover(schoolName, teacherName) : '';
    for (let page = 0; page < pageCount; page += 1) html += renderSheet(page, pageCount, count, style, schoolName, teacherName, topic);
    document.getElementById('pages').innerHTML = html;
  }

  function randomize() {
    renderSeed = Date.now() + Math.floor(Math.random() * 100000);
    render();
  }

  window.KampaiTopicWorksheet = Object.freeze({ escapeHtml, randomize, render });
})();
