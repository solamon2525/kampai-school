/** เทมเพลตปกสื่อ full-bleed 1280×720 — พื้นหลังเต็มขอบ (แบบ thai-script-hub) */

export const W = 1280;
export const H = 720;

const FONT = `@import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800&amp;display=swap');`;

/** ครูผู้ชายไทย chibi — ยืนขวา ชี้กระดาน */
export function maleTeacher(x = 900, y = 260) {
  return `
  <g transform="translate(${x},${y})">
    <ellipse cx="95" cy="310" rx="120" ry="28" fill="rgba(0,0,0,.12)"/>
    <path d="M55 175 L55 290 Q55 320 95 320 Q135 320 135 290 L135 175 Z" fill="#2563eb"/>
    <path d="M55 175 L95 200 L135 175 L135 155 Q95 145 55 155 Z" fill="#1d4ed8"/>
    <circle cx="95" cy="115" r="52" fill="#fde8d4"/>
    <path d="M48 108 Q95 58 142 108 Q138 82 95 68 Q52 82 48 108 Z" fill="#3d2914"/>
    <path d="M52 95 Q70 88 88 95" stroke="#3d2914" stroke-width="6" fill="none" stroke-linecap="round"/>
    <circle cx="78" cy="118" r="5" fill="#1e293b"/><circle cx="112" cy="118" r="5" fill="#1e293b"/>
    <path d="M82 138 Q95 148 108 138" stroke="#c2410c" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M135 195 Q200 170 240 140" stroke="#fde8d4" stroke-width="22" fill="none" stroke-linecap="round"/>
    <circle cx="242" cy="138" r="14" fill="#fde8d4"/>
    <rect x="228" y="128" width="28" height="8" rx="2" fill="#1e293b"/>
    <path d="M55 195 Q20 220 8 260" stroke="#fde8d4" stroke-width="18" fill="none" stroke-linecap="round"/>
  </g>`;
}

/** ป้ายมุมซ้ายบน */
export function mediaBadge(grade, subjectColor = '#f59e0b') {
  return `
  <g>
    <circle cx="88" cy="88" r="62" fill="${subjectColor}" opacity=".95"/>
    <circle cx="88" cy="88" r="62" fill="none" stroke="#fff" stroke-width="4" stroke-dasharray="8 6"/>
    <text x="88" y="78" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="18" font-weight="800" fill="#1e3a5f">สื่อ</text>
    <text x="88" y="100" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="18" font-weight="800" fill="#1e3a5f">การสอน</text>
    <rect x="38" y="118" width="100" height="32" rx="16" fill="#1e3a5f"/>
    <text x="88" y="140" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="20" font-weight="700" fill="#fff">${grade}</text>
  </g>`;
}

/** ลายไทยจางๆ มุม (เติมเต็มขอบ) */
export function thaiPattern(c1, c2) {
  return `
  <g opacity=".08" fill="${c2}">
    <circle cx="1180" cy="80" r="140"/><circle cx="60" cy="640" r="100"/>
    <path d="M0 0 L200 0 L0 200 Z"/><path d="M1280 720 L1080 720 L1280 520 Z"/>
  </g>
  <g opacity=".06" stroke="${c1}" stroke-width="3" fill="none">
    <path d="M1100 600 Q1150 550 1200 600 T1300 600"/>
    <path d="M40 120 Q90 70 140 120 T240 120"/>
  </g>`;
}

/** กระดานขาว */
export function whiteboard(x, y, w, h, inner) {
  return `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="20" fill="#f8fafc" stroke="#cbd5e1" stroke-width="6"/>
  <rect x="${x + 12}" y="${y + 12}" width="${w - 24}" height="36" rx="8" fill="#e2e8f0"/>
  <circle cx="${x + 32}" cy="${y + 30}" r="8" fill="#ef4444"/>
  <circle cx="${x + 56}" cy="${y + 30}" r="8" fill="#f59e0b"/>
  <circle cx="${x + 80}" cy="${y + 30}" r="8" fill="#22c55e"/>
  ${inner}`;
}

export function wrapCover({ bgStops, accent, title, subtitle, footer, decor, board, extra = '' }) {
  const [c1, c2, c3 = c2] = bgStops;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>${FONT}</style>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/><stop offset="55%" stop-color="${c2}"/><stop offset="100%" stop-color="${c3}"/>
    </linearGradient>
    <linearGradient id="titleG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/><stop offset="100%" stop-color="#fef3c7"/>
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${thaiPattern(accent, '#fff')}
  ${decor || ''}
  <text x="640" y="72" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="58" font-weight="800" fill="url(#titleG)" stroke="${accent}" stroke-width="2">${title}</text>
  <text x="640" y="118" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="30" font-weight="700" fill="#fef9c3">${subtitle}</text>
  ${board}
  ${maleTeacher()}
  ${extra}
  <rect x="0" y="${H - 52}" width="${W}" height="52" fill="${accent}" opacity=".92"/>
  <text x="640" y="${H - 16}" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="24" font-weight="700" fill="#fff">${footer}</text>
</svg>`;
}
