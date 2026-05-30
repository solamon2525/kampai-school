/*!
 * kampai-leaderboard.js — drop-in ตารางอันดับนักเรียนสำหรับเกม HTML (vanilla)
 *
 * ใช้คู่กับ wrapper (PlayGame) ที่ส่ง init postMessage มาให้:
 *   { type:'init', leaderboard:[{rank,displayName,photoUrl,classLabel,personalBest,isMe}], ... }
 *
 * วิธีใช้ (1 บรรทัด + 1 container):
 *   <script src="/games/kampai-leaderboard.js"></script>
 *   <div data-kampai-lb></div>            ← วางในจอ title / game-over ที่ไหนก็ได้ (มีได้หลายจุด)
 *
 * - อ่านข้อมูลจาก init เท่านั้น (ไม่ฝัง anon key, ไม่ยิง Supabase เอง)
 * - ไม่มีข้อมูล (เล่นนอกระบบ) → ซ่อน container อัตโนมัติ
 * - inject style เองครั้งเดียว (white card + gold accent อ่านได้ทุกธีม)
 */
(function () {
  'use strict';
  var STYLE_ID = 'kampai-lb-style';
  var data = null; // leaderboard array ล่าสุดจาก init

  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.kampai-lb-box{background:#fffdf7;color:#1e293b;border:1px solid rgba(0,0,0,.08);border-radius:14px;padding:10px 12px;margin:12px auto 0;max-width:420px;width:100%;box-shadow:0 4px 14px rgba(0,0,0,.12);font-family:Sarabun,system-ui,sans-serif;text-align:left;box-sizing:border-box}',
      '.kampai-lb-title{font-weight:800;font-size:15px;color:#b8860b;margin:0 0 8px;text-align:center}',
      '.kampai-lb-list{display:flex;flex-direction:column;gap:2px;max-height:240px;overflow-y:auto}',
      '.kampai-lb-row{display:flex;align-items:center;gap:8px;padding:5px 6px;border-radius:9px}',
      '.kampai-lb-row.is-me{background:#fff3cd}',
      '.kampai-lb-rank{width:26px;text-align:center;font-weight:800;color:#d4af37;flex:0 0 auto;font-size:15px}',
      '.kampai-lb-av{width:30px;height:30px;border-radius:50%;object-fit:cover;flex:0 0 auto;border:1px solid rgba(0,0,0,.1)}',
      '.kampai-lb-av-init{width:30px;height:30px;border-radius:50%;background:#264e36;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;flex:0 0 auto}',
      '.kampai-lb-info{flex:1 1 auto;min-width:0}',
      '.kampai-lb-name{font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.kampai-lb-sub{font-size:10px;color:#64748b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.kampai-lb-score{font-weight:800;color:#264e36;flex:0 0 auto;font-size:15px}'
    ].join('');
    (document.head || document.documentElement).appendChild(s);
  }

  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function rowHtml(r) {
    var medal = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank;
    var name = esc(r.displayName || 'ไม่ทราบชื่อ') + (r.isMe ? ' (คุณ)' : '');
    var initial = esc((r.displayName || '?').charAt(0));
    var av = r.photoUrl
      ? '<img class="kampai-lb-av" src="' + esc(r.photoUrl) + '" alt="">'
      : '<span class="kampai-lb-av-init">' + initial + '</span>';
    var sub = r.classLabel ? '<div class="kampai-lb-sub">' + esc(r.classLabel) + '</div>' : '';
    return '<div class="kampai-lb-row' + (r.isMe ? ' is-me' : '') + '">' +
      '<span class="kampai-lb-rank">' + medal + '</span>' + av +
      '<div class="kampai-lb-info"><div class="kampai-lb-name">' + name + '</div>' + sub + '</div>' +
      '<span class="kampai-lb-score">' + (Number(r.personalBest) || 0).toLocaleString() + '</span></div>';
  }

  function render() {
    var nodes = document.querySelectorAll('[data-kampai-lb]');
    if (!nodes.length) return;
    if (!data || !data.length) {
      nodes.forEach(function (el) { el.innerHTML = ''; el.style.display = 'none'; });
      return;
    }
    injectStyles();
    var title = '🏆 อันดับนักเรียน';
    var rows = data.slice(0, 10).map(rowHtml).join('');
    nodes.forEach(function (el) {
      el.style.display = '';
      el.innerHTML = '<div class="kampai-lb-box"><div class="kampai-lb-title">' + title +
        '</div><div class="kampai-lb-list">' + rows + '</div></div>';
    });
  }

  window.addEventListener('message', function (e) {
    if (e && e.data && e.data.type === 'init' && Array.isArray(e.data.leaderboard)) {
      data = e.data.leaderboard;
      render();
    }
  });

  if (document.readyState !== 'loading') render();
  else document.addEventListener('DOMContentLoaded', render);

  // expose สำหรับเกมที่ render title screen ทีหลัง (เรียก KampaiLB.render() เองได้)
  window.KampaiLB = { render: render, get data() { return data; } };
})();
