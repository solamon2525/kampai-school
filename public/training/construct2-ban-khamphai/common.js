(function () {
  if (document.body.classList.contains('guide-index')) return;
  document.body.classList.add('guide-screen');

  var bar = document.createElement('div');
  bar.className = 'guide-bar';
  bar.innerHTML =
    '<a href="index.html">← สารบัญ</a>' +
    '<button type="button" class="print" id="guidePrint">พิมพ์หน้านี้</button>' +
    '<span class="spacer"></span>' +
    '<span class="hint">เลื่อนเมาส์ดูทั้งหน้า • Ctrl+P ก็พิมพ์ได้</span>';
  document.body.insertBefore(bar, document.body.firstChild);

  document.getElementById('guidePrint').addEventListener('click', function () {
    window.print();
  });
})();
