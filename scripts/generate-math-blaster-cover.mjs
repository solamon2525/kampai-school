import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const TARGET_W = 1280;
const TARGET_H = 720;

const svgString = `
<svg width="${TARGET_W}" height="${TARGET_H}" viewBox="0 0 ${TARGET_W} ${TARGET_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Deep Space Radial Gradient -->
    <radialGradient id="spaceGrad" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="60%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </radialGradient>

    <!-- Glowing Lasers & Accents -->
    <linearGradient id="laserGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#fb7185" stop-opacity="0" />
      <stop offset="50%" stop-color="#f43f5e" stop-opacity="1" />
      <stop offset="100%" stop-color="#fda4af" stop-opacity="1" />
    </linearGradient>

    <!-- Drop Shadows -->
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="18" flood-color="#090d16" flood-opacity="0.8" />
    </filter>
    <filter id="glow" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Space -->
  <rect width="1280" height="720" fill="url(#spaceGrad)" />

  <!-- Stars & Constellations overlay -->
  <g opacity="0.3">
    <!-- Random stars -->
    <circle cx="100" cy="120" r="2" fill="#ffffff" />
    <circle cx="250" cy="80" r="3" fill="#ffffff" />
    <circle cx="400" cy="220" r="1.5" fill="#ffffff" />
    <circle cx="150" cy="500" r="2.5" fill="#ffffff" />
    <circle cx="300" cy="620" r="3" fill="#ffffff" />
    <circle cx="850" cy="100" r="2" fill="#ffffff" />
    <circle cx="1100" cy="180" r="3" fill="#ffffff" filter="url(#glow)" />
    <circle cx="950" cy="650" r="2" fill="#ffffff" />
    <circle cx="1150" cy="500" r="1.5" fill="#ffffff" />
    
    <!-- Constellation lines -->
    <path d="M 100 120 L 250 80 L 400 220" fill="none" stroke="#38bdf8" stroke-width="1" />
    <path d="M 850 100 L 1100 180 L 1150 300" fill="none" stroke="#f472b6" stroke-width="1" />
  </g>

  <!-- Glowing Space Nebula Circles -->
  <circle cx="200" cy="360" r="300" fill="#4f46e5" opacity="0.15" filter="url(#glow)" />
  <circle cx="1080" cy="360" r="250" fill="#0891b2" opacity="0.15" filter="url(#glow)" />

  <!-- Background Planets -->
  <!-- Left Purple Planet -->
  <g filter="url(#shadow)" opacity="0.8">
    <circle cx="180" cy="200" r="60" fill="#6d28d9" />
    <path d="M 120 200 A 60 25 0 0 0 240 200" fill="none" stroke="#a78bfa" stroke-width="6" transform="rotate(-15 180 200)" />
  </g>
  <!-- Right Orange Planet -->
  <g filter="url(#shadow)" opacity="0.8">
    <circle cx="1080" cy="520" r="80" fill="#ea580c" />
    <circle cx="1060" cy="490" r="20" fill="#be123c" opacity="0.4" />
  </g>

  <!-- Laser Blaster Beams shooting from bottom left to top right -->
  <path d="M -50 680 L 600 355" stroke="url(#laserGrad)" stroke-width="14" stroke-linecap="round" filter="url(#glow)" />
  <path d="M 1330 40 L 680 365" stroke="url(#laserGrad)" stroke-width="10" stroke-linecap="round" filter="url(#glow)" />

  <!-- Math Asteroids/Meteors with numbers -->
  <g filter="url(#shadow)">
    <!-- Asteroid 1: '15' -->
    <polygon points="500,240 550,220 580,260 540,300 480,280" fill="#334155" stroke="#475569" stroke-width="3" />
    <text x="530" y="270" font-family="'Sarabun', sans-serif" font-weight="900" font-size="28" fill="#a7f3d0" text-anchor="middle">15</text>

    <!-- Asteroid 2: '×' -->
    <polygon points="720,440 780,410 800,470 750,500 700,470" fill="#334155" stroke="#475569" stroke-width="3" />
    <text x="750" y="470" font-family="'Sarabun', sans-serif" font-weight="900" font-size="34" fill="#fb7185" text-anchor="middle">×</text>

    <!-- Asteroid 3: '7' -->
    <polygon points="850,280 890,250 920,290 880,320 840,310" fill="#334155" stroke="#475569" stroke-width="3" />
    <text x="880" y="295" font-family="'Sarabun', sans-serif" font-weight="900" font-size="24" fill="#60a5fa" text-anchor="middle">7</text>
  </g>

  <!-- Centered Galactic HUD overlay & Title (Safe zone vertical 30% - 70%) -->
  <g filter="url(#shadow)" transform="translate(640, 240)">
    <!-- Tech boundary line -->
    <rect x="-420" y="-120" width="840" height="260" rx="35" fill="rgba(15, 23, 42, 0.75)" stroke="#38bdf8" stroke-width="4" stroke-dasharray="20,10" />

    <!-- Glow badge -->
    <rect x="-160" y="-150" width="320" height="42" rx="21" fill="#0369a1" stroke="#38bdf8" stroke-width="2" />
    <text x="0" y="-122" font-family="'Sarabun', sans-serif" font-weight="800" font-size="20" fill="#ffffff" text-anchor="middle">ดวลเลขอวกาศ ป.4 - ป.6</text>

    <!-- English Game Title -->
    <text x="0" y="-20" font-family="'Sarabun', sans-serif" font-weight="900" font-size="76" fill="#ffffff" text-anchor="middle">
      MATH-BLASTER
    </text>
    <!-- Thai Game Title -->
    <text x="0" y="55" font-family="'Sarabun', sans-serif" font-weight="800" font-size="60" fill="#fbbf24" text-anchor="middle">
      ดวลเลขกู้กาแล็กซี
    </text>
    
    <!-- Code Indicator Badge -->
    <text x="0" y="105" font-family="'Sarabun', sans-serif" font-weight="700" font-size="22" fill="#a7f3d0" text-anchor="middle">
      ค 1.1 ป.4/10 · ค 1.1 ป.4/11
    </text>
  </g>

  <!-- Bottom corner controller decorations -->
  <g transform="translate(640, 560)" filter="url(#shadow)" font-family="'Sarabun', sans-serif" font-size="22" font-weight="800" fill="#ffffff">
    <!-- Star Points -->
    <text x="0" y="0" text-anchor="middle" fill="#38bdf8">🚀 ทำลายอุกกาบาตเพื่อผ่านด่าน!</text>
    
    <!-- Play badges -->
    <g transform="translate(-180, 20)">
      <rect x="0" y="0" width="160" height="44" rx="12" fill="#dc2626" />
      <text x="80" y="29" font-size="18" text-anchor="middle">SCORE SUBMIT</text>
    </g>
    <g transform="translate(20, 20)">
      <rect x="0" y="0" width="160" height="44" rx="12" fill="#059669" />
      <text x="80" y="29" font-size="18" text-anchor="middle">MULTIPLAYER</text>
    </g>
  </g>
</svg>
`;

async function main() {
    const outputPath = path.resolve('public/games/math/math-blaster/cover.png');
    console.log(`Generating Math-Blaster cover at: ${outputPath}`);
    
    try {
        await sharp(Buffer.from(svgString))
            .png()
            .toFile(outputPath);
        console.log('✅ Math-Blaster cover generated successfully!');
    } catch (err) {
        console.error('❌ Error generating cover:', err);
    }
}

main();
