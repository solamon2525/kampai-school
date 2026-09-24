/**
 * c2-lightbox.js
 * Lightweight self-contained lightbox for Construct 2 tutorial step images.
 * - Click any tutorial image → opens fullscreen lightbox
 * - ← / → arrows to navigate between all images in the page
 * - Shows "3 / 8" counter
 * - ESC or click backdrop to close
 * - Touch swipe support (mobile)
 */
(function () {
  'use strict';

  // ---------- CSS (injected once) ----------
  var style = document.createElement('style');
  style.textContent = `
    /* === C2 Lightbox === */
    .c2lb-overlay {
      display: none; position: fixed; inset: 0; z-index: 99999;
      background: rgba(10, 18, 30, 0.93); align-items: center;
      justify-content: center; flex-direction: column;
      animation: c2lb-fade-in 0.18s ease;
    }
    .c2lb-overlay.open { display: flex; }
    @keyframes c2lb-fade-in { from { opacity:0 } to { opacity:1 } }

    .c2lb-inner {
      position: relative; max-width: 96vw; max-height: 88vh;
      display: flex; align-items: center; justify-content: center;
    }
    .c2lb-img {
      max-width: 96vw; max-height: 84vh;
      border-radius: 10px; box-shadow: 0 8px 48px rgba(0,0,0,0.7);
      object-fit: contain;
      animation: c2lb-zoom-in 0.18s ease;
    }
    @keyframes c2lb-zoom-in { from { transform:scale(0.94);opacity:0 } to { transform:scale(1);opacity:1 } }

    .c2lb-btn {
      position: fixed; top: 50%; transform: translateY(-50%);
      background: rgba(255,255,255,0.12); border: 2px solid rgba(255,255,255,0.25);
      color: #fff; font-size: 28px; width: 52px; height: 52px;
      border-radius: 50%; cursor: pointer; display: flex; align-items: center;
      justify-content: center; z-index: 100000; transition: background 0.15s;
      user-select: none;
    }
    .c2lb-btn:hover { background: rgba(255,255,255,0.28); }
    .c2lb-prev { left: 14px; }
    .c2lb-next { right: 14px; }
    .c2lb-btn:disabled { opacity: 0.2; cursor: default; }

    .c2lb-close {
      position: fixed; top: 14px; right: 18px; z-index: 100001;
      background: rgba(255,255,255,0.12); border: 2px solid rgba(255,255,255,0.25);
      color: #fff; font-size: 22px; width: 42px; height: 42px; border-radius: 50%;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: background 0.15s;
    }
    .c2lb-close:hover { background: rgba(239,68,68,0.6); }

    .c2lb-counter {
      position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%);
      color: rgba(255,255,255,0.8); font-size: 15px; font-family: 'Leelawadee UI', Tahoma, sans-serif;
      background: rgba(0,0,0,0.4); padding: 5px 16px; border-radius: 20px;
      letter-spacing: 0.5px;
    }
    .c2lb-caption {
      position: fixed; bottom: 52px; left: 50%; transform: translateX(-50%);
      color: rgba(255,255,255,0.75); font-size: 13px; font-family: 'Leelawadee UI', Tahoma, sans-serif;
      max-width: 70vw; text-align: center; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    }

    /* Thumbnail strip */
    .c2lb-strip {
      position: fixed; bottom: 72px; left: 50%; transform: translateX(-50%);
      display: flex; gap: 6px; align-items: center;
      max-width: 90vw; overflow-x: auto; padding: 4px 8px;
    }
    .c2lb-thumb {
      width: 52px; height: 36px; object-fit: cover; border-radius: 4px;
      cursor: pointer; opacity: 0.5; transition: opacity 0.15s, transform 0.15s;
      border: 2px solid transparent; flex-shrink: 0;
    }
    .c2lb-thumb:hover { opacity: 0.8; }
    .c2lb-thumb.active { opacity: 1; border-color: #38bdf8; transform: scale(1.12); }

    /* Make tutorial images look clickable */
    .c2-step-img, article img, .card img {
      cursor: zoom-in !important;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .c2-step-img:hover, article img:hover, .card img:hover {
      transform: scale(1.015);
      box-shadow: 0 6px 24px rgba(0,0,0,0.25) !important;
    }
  `;
  document.head.appendChild(style);

  // ---------- DOM ----------
  var overlay = document.createElement('div');
  overlay.className = 'c2lb-overlay';
  overlay.innerHTML = `
    <button class="c2lb-close" title="ปิด (ESC)">✕</button>
    <div class="c2lb-inner">
      <img class="c2lb-img" src="" alt="">
    </div>
    <button class="c2lb-btn c2lb-prev" title="ภาพก่อน (←)">‹</button>
    <button class="c2lb-btn c2lb-next" title="ภาพต่อไป (→)">›</button>
    <div class="c2lb-strip"></div>
    <div class="c2lb-caption"></div>
    <div class="c2lb-counter"></div>
  `;
  document.body.appendChild(overlay);

  var lbImg     = overlay.querySelector('.c2lb-img');
  var lbPrev    = overlay.querySelector('.c2lb-prev');
  var lbNext    = overlay.querySelector('.c2lb-next');
  var lbClose   = overlay.querySelector('.c2lb-close');
  var lbCounter = overlay.querySelector('.c2lb-counter');
  var lbCaption = overlay.querySelector('.c2lb-caption');
  var lbStrip   = overlay.querySelector('.c2lb-strip');

  var images = [];
  var current = 0;

  // ---------- Collect all tutorial images ----------
  function collectImages() {
    var selectors = '.c2-step-img, article img, .card img, .grid img, .scene img, section img';
    var all = Array.from(document.querySelectorAll(selectors));
    // Deduplicate by src
    var seen = {};
    images = all.filter(function (el) {
      var src = el.getAttribute('src') || '';
      if (!src || seen[src]) return false;
      seen[src] = true;
      return true;
    });
  }

  // ---------- Build thumbnail strip ----------
  function buildStrip() {
    lbStrip.innerHTML = '';
    images.forEach(function (img, i) {
      var th = document.createElement('img');
      th.className = 'c2lb-thumb';
      th.src = img.src;
      th.alt = img.alt || ('ภาพ ' + (i + 1));
      th.title = img.alt || ('ภาพ ' + (i + 1));
      th.addEventListener('click', function (e) { e.stopPropagation(); openAt(i); });
      lbStrip.appendChild(th);
    });
  }

  // ---------- Open lightbox ----------
  function openAt(idx) {
    if (!images.length) return;
    current = Math.max(0, Math.min(idx, images.length - 1));
    var img = images[current];
    lbImg.src = img.src;
    lbImg.alt = img.alt || '';
    lbCounter.textContent = (current + 1) + ' / ' + images.length;
    lbCaption.textContent = img.alt || '';
    lbPrev.disabled = current === 0;
    lbNext.disabled = current === images.length - 1;

    // Update thumbnail strip active state + scroll into view
    var thumbs = lbStrip.querySelectorAll('.c2lb-thumb');
    thumbs.forEach(function (th, i) {
      th.classList.toggle('active', i === current);
    });
    if (thumbs[current]) {
      thumbs[current].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
    lbImg.src = '';
  }

  function prev() { if (current > 0) openAt(current - 1); }
  function next() { if (current < images.length - 1) openAt(current + 1); }

  // ---------- Events ----------
  lbClose.addEventListener('click', close);
  lbPrev.addEventListener('click', function (e) { e.stopPropagation(); prev(); });
  lbNext.addEventListener('click', function (e) { e.stopPropagation(); next(); });
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });

  document.addEventListener('keydown', function (e) {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape' || e.key === 'Esc') close();
    if (e.key === 'ArrowLeft')  prev();
    if (e.key === 'ArrowRight') next();
  });

  // Touch / swipe support
  var touchStartX = 0;
  overlay.addEventListener('touchstart', function (e) {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  overlay.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 50) { dx < 0 ? next() : prev(); }
  }, { passive: true });

  // ---------- Attach click to all images (deferred so DOM is ready) ----------
  function init() {
    collectImages();
    buildStrip();
    images.forEach(function (img, i) {
      img.addEventListener('click', function () { openAt(i); });
      img.setAttribute('title', 'คลิกเพื่อดูภาพเต็มจอ');
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
