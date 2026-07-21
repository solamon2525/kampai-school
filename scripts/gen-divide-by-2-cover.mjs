import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, '../public/games/math/divide-by-2/cover.png');
const w = 1280;
const h = 720;

const svg = `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#FFD700"/>
      <stop offset="100%" stop-color="#f59e0b"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <circle cx="1100" cy="140" r="90" fill="rgba(251,191,36,0.15)"/>
  <circle cx="180" cy="580" r="120" fill="rgba(59,130,246,0.12)"/>
  <text x="640" y="280" text-anchor="middle" font-family="Arial,sans-serif" font-size="72" font-weight="bold" fill="url(#gold)">➗ หารเร็วในใจ</text>
  <text x="640" y="360" text-anchor="middle" font-family="Arial,sans-serif" font-size="42" fill="#ffffff">÷ 2 คิดในใจให้ไว</text>
  <text x="640" y="430" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" fill="#93c5fd">24 ÷ 2 = 12 · 16 ÷ 2 = 8 · 40 ÷ 2 = 20</text>
  <rect x="440" y="500" width="400" height="56" rx="28" fill="rgba(251,191,36,0.25)" stroke="#fbbf24" stroke-width="2"/>
  <text x="640" y="538" text-anchor="middle" font-family="Arial,sans-serif" font-size="24" fill="#fde68a">คณิตศาสตร์ · ป.2–4</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(out);
const meta = await sharp(out).metadata();
console.log(`cover written: ${out} (${meta.width}x${meta.height})`);
