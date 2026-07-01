import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outDir = join(root, 'public/games/math/multiply-burst');
const svgPath = join(outDir, 'cover.svg');
const pngPath = join(outDir, 'cover.png');

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720" font-family="Mitr, Sarabun, sans-serif">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a1630"/>
      <stop offset="45%" stop-color="#142654"/>
      <stop offset="100%" stop-color="#1a3a6b"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff4cc"/>
      <stop offset="40%" stop-color="#ffce54"/>
      <stop offset="100%" stop-color="#e8a820"/>
    </linearGradient>
    <linearGradient id="balloonRed" x1="0.3" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="#ff8a9a"/>
      <stop offset="100%" stop-color="#c0392b"/>
    </linearGradient>
    <linearGradient id="balloonBlue" x1="0.3" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="#7ee0ff"/>
      <stop offset="100%" stop-color="#1a73b8"/>
    </linearGradient>
    <linearGradient id="balloonYellow" x1="0.3" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="#ffe082"/>
      <stop offset="100%" stop-color="#e0a800"/>
    </linearGradient>
    <linearGradient id="balloonGreen" x1="0.3" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="#9ef0aa"/>
      <stop offset="100%" stop-color="#2e9e4a"/>
    </linearGradient>
    <linearGradient id="balloonPurple" x1="0.3" y1="0" x2="0.8" y2="1">
      <stop offset="0%" stop-color="#d9b4ff"/>
      <stop offset="100%" stop-color="#7c3fbf"/>
    </linearGradient>
    <filter id="shadow" x="-25%" y="-25%" width="150%" height="150%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.45"/>
    </filter>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="6" result="b"/>
      <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="#ffffff" stroke-opacity="0.04" stroke-width="1"/>
    </pattern>
  </defs>

  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect width="1280" height="720" fill="url(#grid)"/>

  <g fill="#ffffff" opacity="0.06" font-size="72" font-weight="800">
    <text x="120" y="140">×</text>
    <text x="980" y="180">+</text>
    <text x="180" y="580">+</text>
    <text x="1050" y="520">−</text>
    <text x="640" y="120">=</text>
  </g>

  <g fill="#ffce54" opacity="0.85" filter="url(#shadow)">
    <polygon points="90,90 94,102 106,102 96,110 100,122 90,114 80,122 84,110 74,102 86,102"/>
    <polygon points="1180,130 1183,139 1192,139 1185,145 1188,154 1180,148 1172,154 1175,145 1168,139 1177,139"/>
  </g>

  <g transform="translate(140,180)" filter="url(#shadow)">
    <line x1="0" y1="78" x2="0" y2="118" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
    <ellipse cx="0" cy="0" rx="58" ry="66" fill="url(#balloonRed)"/>
    <ellipse cx="-18" cy="-22" rx="14" ry="20" fill="rgba(255,255,255,0.28)" transform="rotate(-20)"/>
    <path d="M-8 58 L8 58 L0 72 Z" fill="#a93226"/>
    <text x="0" y="12" text-anchor="middle" font-size="44" font-weight="800" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke">16</text>
  </g>

  <g transform="translate(320,120)" filter="url(#shadow)">
    <line x1="0" y1="68" x2="0" y2="100" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
    <ellipse cx="0" cy="0" rx="50" ry="58" fill="url(#balloonBlue)"/>
    <ellipse cx="-15" cy="-18" rx="12" ry="17" fill="rgba(255,255,255,0.28)" transform="rotate(-20)"/>
    <path d="M-7 50 L7 50 L0 62 Z" fill="#1565a8"/>
    <text x="0" y="10" text-anchor="middle" font-size="38" font-weight="800" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke">20</text>
  </g>

  <g transform="translate(1080,200)" filter="url(#shadow)">
    <line x1="0" y1="72" x2="0" y2="108" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
    <ellipse cx="0" cy="0" rx="54" ry="62" fill="url(#balloonYellow)"/>
    <ellipse cx="-17" cy="-20" rx="13" ry="19" fill="rgba(255,255,255,0.32)" transform="rotate(-20)"/>
    <path d="M-8 54 L8 54 L0 68 Z" fill="#c99200"/>
    <text x="0" y="11" text-anchor="middle" font-size="42" font-weight="800" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke">18</text>
    <circle cx="38" cy="-38" r="6" fill="#fff" opacity="0.9"/>
    <circle cx="48" cy="-28" r="3" fill="#fff" opacity="0.7"/>
  </g>

  <g transform="translate(960,380)" filter="url(#shadow)">
    <line x1="0" y1="65" x2="0" y2="98" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
    <ellipse cx="0" cy="0" rx="48" ry="56" fill="url(#balloonPurple)"/>
    <ellipse cx="-14" cy="-17" rx="11" ry="16" fill="rgba(255,255,255,0.28)" transform="rotate(-20)"/>
    <path d="M-7 48 L7 48 L0 60 Z" fill="#6a2fa8"/>
    <text x="0" y="9" text-anchor="middle" font-size="36" font-weight="800" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke">27</text>
  </g>

  <g transform="translate(180,420)" filter="url(#shadow)">
    <line x1="0" y1="70" x2="0" y2="105" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
    <ellipse cx="0" cy="0" rx="52" ry="60" fill="url(#balloonGreen)"/>
    <ellipse cx="-16" cy="-19" rx="12" ry="18" fill="rgba(255,255,255,0.28)" transform="rotate(-20)"/>
    <path d="M-7 52 L7 52 L0 66 Z" fill="#248a3d"/>
    <text x="0" y="10" text-anchor="middle" font-size="40" font-weight="800" fill="#fff" stroke="#000" stroke-width="3" paint-order="stroke">14</text>
  </g>

  <g transform="translate(1020,310)" filter="url(#glow)">
    <circle cx="0" cy="0" r="36" fill="rgba(255,206,84,0.25)" stroke="#ffce54" stroke-width="3"/>
    <path d="M-4 18 L-4 -6 Q-4 -18 6 -18 Q16 -18 16 -6 L16 8 Q16 18 6 18 L-4 18 Z" fill="#ffce54" stroke="#c99200" stroke-width="2"/>
    <ellipse cx="6" cy="-22" rx="10" ry="8" fill="#ffce54" stroke="#c99200" stroke-width="2"/>
  </g>

  <g filter="url(#shadow)">
    <rect x="340" y="220" width="600" height="200" rx="28" fill="rgba(10,20,50,0.72)" stroke="rgba(255,206,84,0.55)" stroke-width="4"/>
    <text x="640" y="310" text-anchor="middle" font-size="96" font-weight="800" fill="url(#gold)">2 × 9 = ?</text>
    <text x="640" y="375" text-anchor="middle" font-size="28" font-weight="600" fill="#e8ecf8" opacity="0.92">${'\u0E08\u0E34\u0E49\u0E21\u0E25\u0E39\u0E01\u0E42\u0E1B\u0E48\u0E07\u0E17\u0E35\u0E48\u0E21\u0E35\u0E04\u0E33\u0E15\u0E2D\u0E1A\u0E16\u0E39\u0E01!'}</text>
  </g>

  <rect x="56" y="48" width="280" height="52" rx="26" fill="rgba(10,20,50,0.65)" stroke="rgba(255,206,84,0.35)" stroke-width="2"/>
  <text x="84" y="84" font-size="26" font-weight="700" fill="#ffce54">${'\u0E04\u0E13\u0E34\u0E15\u0E28\u0E32\u0E2A\u0E15\u0E23\u0E4C \u00B7 \u0E2A\u0E39\u0E15\u0E23\u0E04\u0E39\u0E13'}</text>

  <rect x="944" y="48" width="300" height="52" rx="26" fill="rgba(10,20,50,0.65)" stroke="rgba(255,255,255,0.2)" stroke-width="2"/>
  <text x="972" y="84" font-size="24" font-weight="600" fill="#e8ecf8">AR ${'\u0E08\u0E34\u0E49\u0E21\u0E19\u0E34\u0E49\u0E27'} / ${'\u0E41\u0E15\u0E30\u0E08\u0E2D'}</text>

  <text x="640" y="560" text-anchor="middle" font-size="72" font-weight="800" fill="url(#gold)" filter="url(#shadow)">${'\u0E2A\u0E39\u0E15\u0E23\u0E04\u0E39\u0E13\u0E15\u0E32\u0E44\u0E27'}</text>
  <text x="640" y="620" text-anchor="middle" font-size="32" font-weight="600" fill="#e8ecf8" opacity="0.92">Multiply Burst — ${'\u0E1D\u0E36\u0E01\u0E04\u0E39\u0E13\u0E40\u0E25\u0E02\u0E40\u0E23\u0E47\u0E27\u0E14\u0E49\u0E27\u0E22\u0E25\u0E39\u0E01\u0E42\u0E1B\u0E48\u0E07\u0E15\u0E31\u0E27\u0E40\u0E25\u0E02'}</text>

  <rect x="0" y="680" width="1280" height="40" fill="rgba(255,206,84,0.15)"/>
  <rect x="0" y="680" width="1280" height="4" fill="#ffce54" opacity="0.6"/>
</svg>`;

writeFileSync(svgPath, svg, 'utf8');

await sharp(Buffer.from(svg, 'utf8'))
  .resize(1280, 720)
  .png()
  .toFile(pngPath);

console.log('Wrote', svgPath);
console.log('Wrote', pngPath);
