import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const svg = `
<svg width="1280" height="720" viewBox="0 0 1280 720" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="35%" stop-color="#1e3a8a" />
      <stop offset="75%" stop-color="#1d4ed8" />
      <stop offset="100%" stop-color="#312e81" />
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fef08a" />
      <stop offset="50%" stop-color="#f59e0b" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.14" />
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.06" />
    </linearGradient>
    <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.45" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1280" height="720" fill="url(#bg)" />

  <!-- Background Decorative Stars & Circles -->
  <circle cx="120" cy="140" r="70" fill="#38bdf8" opacity="0.12" />
  <circle cx="1160" cy="580" r="110" fill="#f59e0b" opacity="0.15" />
  <circle cx="1060" cy="130" r="50" fill="#a855f7" opacity="0.15" />
  <circle cx="180" cy="620" r="90" fill="#0284c7" opacity="0.1" />

  <!-- Floating Sparkles -->
  <path d="M240 160 L245 175 L260 180 L245 185 L240 200 L235 185 L220 180 L235 175 Z" fill="#fbbf24" opacity="0.8" />
  <path d="M1080 220 L1084 232 L1096 236 L1084 240 L1080 252 L1076 240 L1064 236 L1076 232 Z" fill="#38bdf8" opacity="0.85" />
  <path d="M980 480 L985 495 L1000 500 L985 505 L980 520 L975 505 L960 500 L975 495 Z" fill="#f472b6" opacity="0.75" />
  <path d="M300 540 L304 552 L316 556 L304 560 L300 572 L296 560 L284 556 L296 552 Z" fill="#fbbf24" opacity="0.8" />

  <!-- Center Safe Zone Area (60% width = 768px, 60% height = 432px) -->
  <g transform="translate(640, 360)" filter="url(#dropShadow)">
    <!-- Glow Backdrop Card -->
    <rect x="-490" y="-220" width="980" height="440" rx="32" fill="url(#cardGrad)" stroke="rgba(255,255,255,0.25)" stroke-width="2" />

    <!-- Badges -->
    <g transform="translate(0, -165)">
      <rect x="-210" y="-18" width="420" height="36" rx="18" fill="#f59e0b" />
      <text x="0" y="6" font-family="Sarabun, sans-serif" font-weight="800" font-size="18" fill="#78350f" text-anchor="middle">
        วิชาภาษาไทย · ระดับชั้นประถมศึกษาปีที่ ๔
      </text>
    </g>

    <!-- Main Title (Thai) -->
    <text x="0" y="-80" font-family="Sarabun, sans-serif" font-weight="800" font-size="46" fill="#ffffff" text-anchor="middle" letter-spacing="1">
      สื่อแปลกลอนสุภาพ
    </text>

    <!-- Subtitle (Thai & Chapters) -->
    <text x="0" y="-22" font-family="Sarabun, sans-serif" font-weight="800" font-size="36" fill="url(#goldGrad)" text-anchor="middle">
      วรรณคดีลำนำ ๗ บทเรียน
    </text>

    <!-- English Title -->
    <text x="0" y="24" font-family="Sarabun, sans-serif" font-weight="700" font-size="20" fill="#93c5fd" text-anchor="middle" letter-spacing="0.5">
      Wannakhadi Lamnam: Thai Poetry &amp; Translation Studio
    </text>

    <!-- 7 Chapters Pills Grid -->
    <g transform="translate(0, 68)">
      <rect x="-440" y="0" width="120" height="38" rx="10" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />
      <text x="-380" y="24" font-family="Sarabun, sans-serif" font-weight="700" font-size="14" fill="#ffffff" text-anchor="middle">๑. สุดสาคร</text>

      <rect x="-312" y="0" width="120" height="38" rx="10" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />
      <text x="-252" y="24" font-family="Sarabun, sans-serif" font-weight="700" font-size="14" fill="#ffffff" text-anchor="middle">๒. น้ำผึ้งหยดเดียว</text>

      <rect x="-184" y="0" width="120" height="38" rx="10" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />
      <text x="-124" y="24" font-family="Sarabun, sans-serif" font-weight="700" font-size="14" fill="#ffffff" text-anchor="middle">๓. ระบำสายฟ้า</text>

      <rect x="-56" y="0" width="112" height="38" rx="10" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />
      <text x="0" y="24" font-family="Sarabun, sans-serif" font-weight="700" font-size="14" fill="#ffffff" text-anchor="middle">๔. เงาะป่า</text>

      <rect x="64" y="0" width="112" height="38" rx="10" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />
      <text x="120" y="24" font-family="Sarabun, sans-serif" font-weight="700" font-size="14" fill="#ffffff" text-anchor="middle">๕. ดวงจันทร์</text>

      <rect x="184" y="0" width="120" height="38" rx="10" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />
      <text x="244" y="24" font-family="Sarabun, sans-serif" font-weight="700" font-size="14" fill="#ffffff" text-anchor="middle">๖. คมความคิด</text>

      <rect x="312" y="0" width="128" height="38" rx="10" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" stroke-width="1.5" />
      <text x="376" y="24" font-family="Sarabun, sans-serif" font-weight="700" font-size="14" fill="#ffffff" text-anchor="middle">๗. เมืองพระร่วง</text>
    </g>

    <!-- Bottom Feature Highlights -->
    <g transform="translate(0, 155)">
      <text x="0" y="0" font-family="Sarabun, sans-serif" font-weight="700" font-size="16" fill="#fde047" text-anchor="middle">
        📜 ถอดคำประพันธ์รายวรรค · 🔍 คลังคำศัพท์ป๊อปอัป · 🔊 เสียงอ่าน TTS · 📝 ใบงาน A4 คู่บทเรียน
      </text>
    </g>
  </g>
</svg>
`;

const outputPath = path.resolve('public/games/thai/wannakhadi-p4-media-cover.png');

await sharp(Buffer.from(svg))
  .png({ compressionLevel: 9 })
  .toFile(outputPath);

console.log('Cover generated at:', outputPath);
