/**
 * KampaiQR — offline QR for worksheets (wraps vendored qrcode-generator).
 * Load after /games/qrcode-generator.min.js
 */
(function (global) {
  'use strict';

  function fallbackSvg(text, size) {
    size = size || 150;
    const short = String(text).length > 52 ? String(text).slice(0, 49) + '…' : String(text);
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 150 150">' +
      '<rect width="150" height="150" fill="#fff" stroke="#0f172a" stroke-width="3"/>' +
      '<text x="75" y="40" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="13" font-weight="800" fill="#0f172a">ลิงก์สื่อ</text>' +
      '<foreignObject x="8" y="52" width="134" height="88">' +
      '<div xmlns="http://www.w3.org/1999/xhtml" style="font:700 8px Sarabun,sans-serif;color:#1e3a8a;word-break:break-all;text-align:center;line-height:1.3">' +
      short.replace(/&/g, '&amp;').replace(/</g, '&lt;') +
      '</div></foreignObject></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function toDataUrl(text, size) {
    size = size || 150;
    try {
      if (typeof global.qrcode !== 'function') return fallbackSvg(text, size);
      const qr = global.qrcode(0, 'M');
      qr.addData(String(text));
      qr.make();
      const cell = Math.max(2, Math.floor(size / (qr.getModuleCount() + 2)));
      const svg = qr.createSvgTag(cell, 2);
      return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    } catch (err) {
      return fallbackSvg(text, size);
    }
  }

  global.KampaiQR = { toDataUrl, fallbackSvg };
})(typeof window !== 'undefined' ? window : globalThis);
