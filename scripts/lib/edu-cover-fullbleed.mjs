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

/** ขนาดหัวข้ออัตโนมัติ — ใหญ่ชัด ไม่บังเนื้อหา */
function titleFontSize(title) {
  const len = String(title).length;
  if (len > 18) return 68;
  if (len > 14) return 76;
  return 84;
}

function bannerTitleSize(title, hasLine2) {
  const len = String(title).length;
  if (hasLine2) return len > 10 ? 68 : 76;
  if (len > 16) return 72;
  if (len > 12) return 80;
  return 88;
}

/** แถบข้อความบนปก — อย่างน้อย 30% ของความสูง (216px @ 720p) */
export const TEXT_BAND_MIN_RATIO = 0.3;
/** แถบ banner — ตัวหนังสือใหญ่ แต่ fade ก่อนถึงเนื้อหาหลัก (~22% สูง) */
export const TEXT_BANNER_MAX_RATIO = 0.22;

/**
 * overlay แบบ clean — ตัวใหญ่ ฟอนต์เรียบ ไม่เล่นขอบสี (แนว narration cover)
 */
export function titleOverlayCleanSvg({
  title,
  titleLine2,
  subtitle,
  footer,
  accent = '#15803d',
  grade,
  titleColor = '#ffffff',
  subtitleColor = '#fef9c3',
}) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const hasLine2 = Boolean(titleLine2);
  const line1Size = hasLine2 ? 108 : 118;
  const line2Size = 100;
  const subSize = 46;
  const bandH = Math.round(H * 0.3);
  const line1Y = hasLine2 ? 102 : 112;
  const line2Y = line1Y + Math.round(line2Size * 0.95);
  const subY = hasLine2 ? line2Y + Math.round(subSize * 1.08) : line1Y + Math.round(line1Size * 0.72);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>${FONT}</style>
    <linearGradient id="cleanFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(15,23,42,0.72)"/>
      <stop offset="75%" stop-color="rgba(15,23,42,0.28)"/>
      <stop offset="100%" stop-color="rgba(15,23,42,0)"/>
    </linearGradient>
    <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="3" stdDeviation="4" flood-color="rgba(0,0,0,0.45)"/>
    </filter>
  </defs>
  <rect x="0" y="0" width="${W}" height="${bandH}" fill="url(#cleanFade)"/>
  <text x="640" y="${line1Y}" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="${line1Size}" font-weight="800"
    fill="${titleColor}" filter="url(#softShadow)">${esc(title)}</text>
  ${hasLine2 ? `<text x="640" y="${line2Y}" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="${line2Size}" font-weight="800"
    fill="${titleColor}" filter="url(#softShadow)">${esc(titleLine2)}</text>` : ''}
  <text x="640" y="${subY}" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="${subSize}" font-weight="700"
    fill="${subtitleColor}" filter="url(#softShadow)">${esc(subtitle)}</text>
  ${grade ? `<g transform="translate(0,6)">${mediaBadge(grade, '#fde047')}</g>` : ''}
  <rect x="0" y="${H - 52}" width="${W}" height="52" fill="${accent}" opacity=".94"/>
  <text x="640" y="${H - 16}" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="26" font-weight="700" fill="#ffffff">${esc(footer)}</text>
</svg>`;
}

function singleLineTitleSize(title, xl = false) {
  const len = String(title).length;
  if (xl) {
    if (len > 18) return 76;
    if (len > 15) return 88;
    if (len > 12) return 96;
    return 108;
  }
  return bannerTitleSize(title, false);
}

/**
 * overlay แบบ banner — ตัวหนังสือใหญ่สีสดใส แถบบน fade ลง ไม่บังภาพเนื้อหา
 */
export function titleOverlayBannerSvg({
  title,
  titleLine2,
  subtitle,
  footer,
  accent = '#1e3a5f',
  grade,
  large = false,
  xl = false,
  subtitlePlain = false,
  darkText = false,
}) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const hasLine2 = Boolean(titleLine2) && !darkText;
  const baseSize = bannerTitleSize(title, hasLine2) + (large || xl ? 10 : 0);
  const bandH = Math.round(H * (xl ? 0.3 : large ? 0.26 : TEXT_BANNER_MAX_RATIO));
  const line1Size = darkText
    ? singleLineTitleSize(title, xl)
    : xl
      ? Math.min(Math.round(baseSize * 2), hasLine2 ? 108 : 136)
      : large
        ? baseSize
        : bannerTitleSize(title, hasLine2);
  const line2Size = xl ? Math.round(line1Size * 0.92) : large ? 82 : 72;
  const subSize = darkText ? 44 : xl ? 52 : large ? 40 : 32;
  const strokeW = darkText ? 0 : xl ? 8 : large ? 6 : 5;
  const subStroke = darkText ? 0 : xl ? 4 : large ? 3.5 : 2.5;
  const line1Y = darkText ? 108 : xl ? (hasLine2 ? 108 : 118) : hasLine2 ? (large ? 86 : 78) : large ? 96 : 88;
  const line2Y = line1Y + Math.round(line2Size * 0.92);
  const subY = hasLine2 ? line2Y + Math.round(subSize * 1.05) : line1Y + Math.round(line1Size * 0.68);
  const banTop = darkText ? 'rgba(255,255,255,0.94)' : xl || large ? 'rgba(15,23,42,0.96)' : 'rgba(15,23,42,0.88)';
  const banMid = darkText ? 'rgba(255,255,255,0.55)' : 'rgba(15,23,42,0.5)';
  const titleFill = darkText ? '#0f172a' : 'url(#banTitle)';
  const subFill = darkText ? '#14532d' : subtitlePlain ? '#ffffff' : 'url(#banSub)';
  const titleStroke = darkText ? 'none' : '#7c2d12';
  const subStrokeColor = darkText ? 'none' : subtitlePlain ? '#14532d' : '#1e3a8a';
  const titleFilter = darkText ? '' : 'filter="url(#banShadow)"';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>${FONT}</style>
    <linearGradient id="banFade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${banTop}"/>
      <stop offset="65%" stop-color="${banMid}"/>
      <stop offset="100%" stop-color="rgba(255,255,255,0)"/>
    </linearGradient>
    <linearGradient id="banTitle" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="45%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#fb923c"/>
    </linearGradient>
    <linearGradient id="banSub" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#a5f3fc"/>
      <stop offset="50%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fbcfe8"/>
    </linearGradient>
    <filter id="banShadow" x="-12%" y="-12%" width="124%" height="124%">
      <feDropShadow dx="0" dy="4" stdDeviation="5" flood-color="rgba(0,0,0,0.55)"/>
    </filter>
  </defs>
  <rect x="0" y="0" width="${W}" height="${bandH}" fill="url(#banFade)"/>
  <rect x="0" y="0" width="${W}" height="8" fill="${accent}"/>
  <text x="640" y="${line1Y}" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="${line1Size}" font-weight="800"
    fill="${titleFill}" ${titleStroke !== 'none' ? `stroke="${titleStroke}" stroke-width="${strokeW}" paint-order="stroke"` : ''} ${titleFilter}>${esc(title)}</text>
  ${hasLine2 ? `<text x="640" y="${line2Y}" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="${line2Size}" font-weight="800"
    fill="${titleFill}" stroke="${titleStroke}" stroke-width="${strokeW - 1}" paint-order="stroke" filter="url(#banShadow)">${esc(titleLine2)}</text>` : ''}
  <text x="640" y="${subY}" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="${subSize}" font-weight="800"
    fill="${subFill}" ${subStrokeColor !== 'none' ? `stroke="${subStrokeColor}" stroke-width="${subStroke}" paint-order="stroke"` : ''} ${subtitlePlain && !darkText ? 'filter="url(#banShadow)"' : ''}>${esc(subtitle)}</text>
  ${grade ? `<g transform="translate(0,8)">${mediaBadge(grade, '#fde047')}</g>` : ''}
  <rect x="0" y="${H - 54}" width="${W}" height="54" fill="${accent}" opacity=".95"/>
  <rect x="0" y="${H - 54}" width="${W}" height="5" fill="#fde047" opacity=".9"/>
  <text x="640" y="${H - 17}" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="26" font-weight="800" fill="#fff" stroke="#0f172a" stroke-width="1.5" paint-order="stroke">${esc(footer)}</text>
</svg>`;
}

/**
 * overlay แบบ hero — ตัวหนังสือกินพื้นที่ ≥30% ของปก จัดกลางสวยงาม
 */
export function titleOverlayHeroSvg({
  title,
  titleLine2,
  subtitle,
  footer,
  accent = '#047857',
  grade,
}) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const bandH = Math.round(H * TEXT_BAND_MIN_RATIO);
  const line1Size = titleLine2 ? 92 : 108;
  const line2Size = 84;
  const subSize = 38;
  const line1Y = titleLine2 ? 98 : 120;
  const line2Y = line1Y + Math.round(line2Size * 0.95);
  const subY = titleLine2 ? line2Y + Math.round(subSize * 1.05) : line1Y + Math.round(line1Size * 0.72);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>${FONT}</style>
    <linearGradient id="heroBand" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(4,120,87,0.92)"/>
      <stop offset="100%" stop-color="rgba(15,23,42,0.78)"/>
    </linearGradient>
    <linearGradient id="heroTitle" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#6ee7b7"/>
    </linearGradient>
    <linearGradient id="heroSub" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#93c5fd"/>
      <stop offset="50%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fdba74"/>
    </linearGradient>
    <filter id="heroShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="5" stdDeviation="7" flood-color="rgba(0,0,0,0.6)"/>
    </filter>
  </defs>
  <rect x="0" y="0" width="${W}" height="${bandH}" fill="url(#heroBand)"/>
  <rect x="0" y="0" width="${W}" height="10" fill="${accent}"/>
  <rect x="0" y="${bandH - 6}" width="${W}" height="6" fill="#fde047" opacity=".85"/>
  <text x="640" y="${line1Y}" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="${line1Size}" font-weight="800"
    fill="url(#heroTitle)" stroke="#064e3b" stroke-width="6" paint-order="stroke" filter="url(#heroShadow)">${esc(title)}</text>
  ${titleLine2 ? `<text x="640" y="${line2Y}" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="${line2Size}" font-weight="800"
    fill="url(#heroTitle)" stroke="#064e3b" stroke-width="5" paint-order="stroke" filter="url(#heroShadow)">${esc(titleLine2)}</text>` : ''}
  <text x="640" y="${subY}" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="${subSize}" font-weight="800"
    fill="url(#heroSub)" stroke="#1e3a8a" stroke-width="3" paint-order="stroke">${esc(subtitle)}</text>
  ${grade ? `<g transform="translate(0,12)">${mediaBadge(grade, '#fde047')}</g>` : ''}
  <rect x="0" y="${H - 58}" width="${W}" height="58" fill="${accent}" opacity=".96"/>
  <rect x="0" y="${H - 58}" width="${W}" height="6" fill="#6ee7b7" opacity=".95"/>
  <text x="640" y="${H - 18}" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="800" fill="#fff" stroke="#022c22" stroke-width="1.5" paint-order="stroke">${esc(footer)}</text>
</svg>`;
}

/**
 * overlay ชื่อไทย + แถบล่าง ทับภาพ AI
 * กฎตัวหนังสือ: ใหญ่ · สีสดใส · ขอบหนา · อ่านง่ายบนพื้นหลังสีเข้ม
 */
export function titleOverlaySvg({ title, subtitle, footer, accent = '#1e3a5f', grade }) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const titleSize = titleFontSize(title);
  const subSize = 34;
  const titleY = 62;
  const subY = titleY + Math.round(titleSize * 0.62);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <style>${FONT}</style>
    <linearGradient id="titlePop" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff7cc"/>
      <stop offset="45%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#fb923c"/>
    </linearGradient>
    <linearGradient id="subPop" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#fda4af"/>
    </linearGradient>
    <filter id="titleShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-color="rgba(0,0,0,0.55)"/>
    </filter>
  </defs>
  <rect x="0" y="0" width="${W}" height="148" fill="rgba(15,23,42,0.42)"/>
  <rect x="0" y="0" width="${W}" height="8" fill="${accent}" opacity=".95"/>
  <text x="640" y="${titleY}" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="${titleSize}" font-weight="800"
    fill="url(#titlePop)" stroke="#7c2d12" stroke-width="5" paint-order="stroke" filter="url(#titleShadow)">${esc(title)}</text>
  <text x="640" y="${subY}" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="${subSize}" font-weight="800"
    fill="url(#subPop)" stroke="#9a3412" stroke-width="3" paint-order="stroke">${esc(subtitle)}</text>
  ${grade ? mediaBadge(grade) : ''}
  <rect x="0" y="${H - 58}" width="${W}" height="58" fill="${accent}" opacity=".96"/>
  <rect x="0" y="${H - 58}" width="${W}" height="6" fill="#fde047" opacity=".9"/>
  <text x="640" y="${H - 18}" text-anchor="middle" font-family="Sarabun,sans-serif" font-size="28" font-weight="800" fill="#fff" stroke="#0f172a" stroke-width="1.5" paint-order="stroke">${esc(footer)}</text>
</svg>`;
}

const EDU_BASE =
  'High-quality illustration for a Thai elementary-school educational media cover poster, 16:9 wide aspect, full-bleed edge-to-edge illustration filling entire frame, no empty side margins.';
const EDU_STYLE =
  'clean educational classroom poster illustration, polished teaching-media style, NOT arcade game art, bright but calm, professional textbook-cover quality, friendly for elementary school.';
const EDU_STYLE_SERIOUS =
  'polished semi-realistic educational poster illustration, natural proportions, professional Thai school textbook cover quality, calm focused learning atmosphere, soft natural lighting, NOT kawaii NOT chibi NOT big-head cartoon NOT arcade game';
const MALE_TEACHER =
  'main character: a friendly male Thai elementary school teacher, short neat hair, light blue polo shirt with dark trousers, warm smile, pointing at whiteboard with marker — clearly male, NOT female';
const STUDENTS_ONLY =
  'main characters: cute chibi Thai elementary students in Thai school uniforms only — absolutely NO teacher, NO adult, NO grown-up person anywhere in the scene';
const STUDENTS_ONLY_SERIOUS =
  'main characters: exactly four Thai elementary students maximum four children only, in realistic Thai school uniforms (white shirt, navy skirt or trousers), natural body proportions normal head size, attentive focused expressions, semi-realistic polished illustration — absolutely NO teacher, NO adult, NOT chibi, NOT kawaii, NOT exaggerated cartoon';
const TEXT_OVERLAY_RULE =
  'Thai title and subtitle will be added later as large bright colorful Sarabun text overlay — do not bake any letters into the artwork.';

export function buildAiPrompt(scene, colors, opts = {}) {
  const topPct = opts.topClearPct ?? 20;
  const style = opts.serious ? EDU_STYLE_SERIOUS : EDU_STYLE;
  const character = opts.noTeacher
    ? opts.serious
      ? STUDENTS_ONLY_SERIOUS
      : STUDENTS_ONLY
    : MALE_TEACHER;
  const contentRule = opts.overlay === 'banner'
    ? `Keep the main lesson illustration large and centered in the bottom ${100 - topPct - 8}% of the frame — do not place important content under the top title band. `
    : '';
  const safeZoneRule = 'All main characters, focal elements, and lesson items must be centered within 60% safe zone of the image, leaving the top 20% and bottom 20% margins relatively clear and empty. ';
  const topRule =
    `STRICT: absolutely no text, no letters, no words, no numbers, no logos in the image. ` +
    `Leave the TOP ${topPct}% relatively clear/soft for large bright Thai title overlay. ` +
    contentRule +
    safeZoneRule +
    'Full frame illustration edge to edge.';
  return [EDU_BASE, style, character, `Subject scene: ${scene}.`, colors, topRule, TEXT_OVERLAY_RULE].join(' ');
}

