// Rebuild career media cover SVGs with UTF-8 Thai text taken from the media HTML files,
// then rasterize to 1280x720 PNG. Script is pure ASCII to avoid encoding issues.
import { readFileSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const COVERS = [
  {
    slug: 'housework-craft',
    stops: ['#92400e', '#f59e0b', '#fde68a'],
    icon: `<g transform="translate(560,200)">
    <line x1="20" y1="0" x2="52" y2="72" stroke="#78350f" stroke-width="12" stroke-linecap="round"/>
    <path d="M40 66 L84 58 L94 100 L28 100 Z" fill="#fde68a" stroke="#78350f" stroke-width="6"/>
    <line x1="46" y1="74" x2="42" y2="98" stroke="#78350f" stroke-width="4"/>
    <line x1="62" y1="72" x2="62" y2="98" stroke="#78350f" stroke-width="4"/>
    <line x1="78" y1="70" x2="82" y2="98" stroke="#78350f" stroke-width="4"/>
    <circle cx="140" cy="34" r="16" fill="none" stroke="#7f1d1d" stroke-width="9"/>
    <circle cx="140" cy="76" r="16" fill="none" stroke="#7f1d1d" stroke-width="9"/>
    <line x1="153" y1="42" x2="216" y2="66" stroke="#f8fafc" stroke-width="10" stroke-linecap="round"/>
    <line x1="153" y1="68" x2="216" y2="44" stroke="#e2e8f0" stroke-width="10" stroke-linecap="round"/>
  </g>`,
    titleSize: 64,
  },
  {
    slug: 'agriculture-basics',
    stops: ['#14532d', '#22c55e', '#bbf7d0'],
    icon: `<g transform="translate(540,190)">
    <rect x="0" y="106" width="200" height="16" rx="6" fill="#92400e"/>
    <path d="M46 106 v-30" stroke="#166534" stroke-width="7" stroke-linecap="round"/>
    <path d="M46 82 q-20 -8 -23 -28 q20 2 23 28 q3 -26 23 -28 q-3 20 -23 28" fill="#4ade80" stroke="#166534" stroke-width="3"/>
    <path d="M110 106 v-56" stroke="#14532d" stroke-width="8" stroke-linecap="round"/>
    <circle cx="110" cy="34" r="18" fill="#86efac" stroke="#14532d" stroke-width="4"/>
    <path d="M110 84 q-16 -4 -19 -22 q16 2 19 22" fill="#22c55e"/>
    <path d="M110 84 q16 -4 19 -22 q-16 2 -19 22" fill="#22c55e"/>
    <rect x="158" y="52" width="42" height="30" rx="7" fill="#e0f2fe" stroke="#0369a1" stroke-width="4"/>
    <path d="M200 62 L226 52" stroke="#0369a1" stroke-width="5" stroke-linecap="round"/>
    <circle cx="230" cy="50" r="6" fill="#0369a1"/>
    <line x1="236" y1="58" x2="242" y2="70" stroke="#e0f2fe" stroke-width="3" stroke-linecap="round"/>
    <line x1="228" y1="60" x2="232" y2="72" stroke="#e0f2fe" stroke-width="3" stroke-linecap="round"/>
  </g>`,
    titleSize: 60,
  },
  {
    slug: 'cooking-basics',
    stops: ['#7c2d12', '#f97316', '#fed7aa'],
    icon: `<g transform="translate(535,190)">
    <ellipse cx="105" cy="92" rx="86" ry="30" fill="#1f2937"/>
    <ellipse cx="105" cy="86" rx="86" ry="30" fill="#374151"/>
    <ellipse cx="105" cy="86" rx="66" ry="20" fill="#fbbf24"/>
    <ellipse cx="105" cy="82" rx="42" ry="12" fill="#fde68a"/>
    <line x1="188" y1="82" x2="266" y2="66" stroke="#1f2937" stroke-width="13" stroke-linecap="round"/>
    <path d="M46 18 q6 10 0 20 M78 10 q6 10 0 20 M112 16 q6 10 0 20" fill="none" stroke="#f8fafc" stroke-width="5" stroke-linecap="round"/>
  </g>`,
    titleSize: 58,
  },
];

const esc = (s) => s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');

for (const c of COVERS) {
  const html = readFileSync(`public/games/career/${c.slug}-media.html`, 'utf8');
  const titleParts = html.match(/<title>([^<]+)<\/title>/)[1].split(/\s+\u2014\s+/);
  const badge = html.match(/class="badge">([^<]+)</)[1];
  const title = titleParts[0]; // e.g. Thai media name
  const subtitle = `${badge} \u00b7 ${titleParts[1]} \u00b7 ${titleParts[2]}`;
  const gid = `g${c.slug.replace(/-/g, '')}`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="${gid}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c.stops[0]}"/>
      <stop offset="50%" stop-color="${c.stops[1]}"/>
      <stop offset="100%" stop-color="${c.stops[2]}"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#${gid})"/>
  <circle cx="180" cy="140" r="90" fill="#ffffff" fill-opacity="0.12"/>
  <circle cx="1120" cy="580" r="140" fill="#ffffff" fill-opacity="0.10"/>
  <rect x="80" y="150" width="1120" height="420" rx="32" fill="#ffffff" fill-opacity="0.18"/>
  ${c.icon}
  <text x="640" y="430" text-anchor="middle" font-family="Kanit, Sarabun, sans-serif" font-size="${c.titleSize}" font-weight="800" fill="#ffffff">${esc(title)}</text>
  <text x="640" y="500" text-anchor="middle" font-family="Kanit, Sarabun, sans-serif" font-size="30" font-weight="600" fill="#ffffff" fill-opacity="0.92">${esc(subtitle)}</text>
</svg>
`;
  const svgPath = `public/games/career/${c.slug}-media-cover.svg`;
  const pngPath = `public/games/career/${c.slug}-media-cover.png`;
  writeFileSync(svgPath, svg, 'utf8');
  await sharp(Buffer.from(svg, 'utf8')).resize(1280, 720, { fit: 'fill' }).png().toFile(pngPath);
  const meta = await sharp(pngPath).metadata();
  const ok = meta.width === 1280 && meta.height === 720;
  console.log(`${ok ? 'OK' : 'FAIL'} ${pngPath} ${meta.width}x${meta.height} title="${title}"`);
  if (!ok) process.exit(1);
}
console.log('Done');
