import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const out = join(__dirname, '../public/games/math/divide-by-2-thinking-media-cover.png');
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
  <circle cx="1050" cy="130" r="80" fill="rgba(59,130,246,0.18)"/>
  <circle cx="200" cy="600" r="100" fill="rgba(251,191,36,0.12)"/>
  <text x="640" y="260" text-anchor="middle" font-family="Arial,sans-serif" font-size="58" font-weight="bold" fill="url(#gold)">🧠 สอนหาร 2 ในใจ</text>
  <text x="640" y="340" text-anchor="middle" font-family="Arial,sans-serif" font-size="36" fill="#ffffff">แบ่งครึ่ง · คิด ? + ? · ตรวจ ×2</text>
  <text x="640" y="420" text-anchor="middle" font-family="Arial,sans-serif" font-size="28" fill="#93c5fd">24 ÷ 2 → 12 + 12 = 24</text>
  <rect x="460" y="490" width="360" height="52" rx="26" fill="rgba(59,130,246,0.25)" stroke="#60a5fa" stroke-width="2"/>
  <text x="640" y="524" text-anchor="middle" font-family="Arial,sans-serif" font-size="22" fill="#bfdbfe">สื่อการสอน · ป.2–4</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile(out);
const meta = await sharp(out).metadata();
console.log(`cover written: ${out} (${meta.width}x${meta.height})`);
