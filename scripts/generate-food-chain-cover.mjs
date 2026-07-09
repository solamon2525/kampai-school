import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const TARGET_W = 1280;
const TARGET_H = 720;

const svgString = `
<svg width="${TARGET_W}" height="${TARGET_H}" viewBox="0 0 ${TARGET_W} ${TARGET_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Sunny Sky Gradient -->
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#bae6fd" />
      <stop offset="60%" stop-color="#e0f2fe" />
      <stop offset="100%" stop-color="#f0fdf4" />
    </linearGradient>

    <!-- Glassmorphism Panel Gradient -->
    <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.35)" />
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.12)" />
    </linearGradient>

    <!-- Drop Shadows -->
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="10" stdDeviation="15" flood-color="#14532d" flood-opacity="0.3" />
    </filter>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Forest/Sky -->
  <rect width="1280" height="720" fill="url(#skyGrad)" />

  <!-- Sun -->
  <circle cx="1150" cy="120" r="100" fill="#fef08a" filter="url(#glow)" opacity="0.4" />
  
  <!-- Subtle cloud patterns -->
  <g fill="#ffffff" opacity="0.5" filter="url(#glow)">
    <circle cx="200" cy="140" r="50" />
    <circle cx="250" cy="150" r="40" />
    <circle cx="160" cy="160" r="30" />
    
    <circle cx="950" cy="100" r="40" />
    <circle cx="990" cy="110" r="30" />
  </g>

  <!-- Left: The interactive board (Chibi ecosystem card) -->
  <g filter="url(#shadow)">
    <!-- Board backing -->
    <rect x="75" y="95" width="490" height="530" rx="30" fill="url(#glassGrad)" stroke="#86efac" stroke-width="3" />
    <!-- Slate -->
    <rect x="90" y="110" width="460" height="500" rx="20" fill="#14532d" />
  </g>

  <!-- Chibi Forest Food Chain Diagram inside slate -->
  <!-- Ground Grass -->
  <path d="M 90 540 Q 200 480 320 520 T 550 540 L 550 610 L 90 610 Z" fill="#16a34a" />
  <path d="M 90 560 Q 250 510 380 550 T 550 560 L 550 610 L 90 610 Z" fill="#15803d" />

  <!-- 1. Producer: Green Leaf Plant -->
  <g transform="translate(140, 440)">
    <!-- Stem and leaves -->
    <path d="M 30 70 Q 30 20 40 10 Q 50 20 50 70 Z" fill="#4ade80" />
    <path d="M 15 45 Q 35 25 35 65 Z" fill="#22c55e" />
    <path d="M 65 40 Q 45 20 45 60 Z" fill="#22c55e" />
    <rect x="25" y="0" width="30" height="25" rx="8" fill="#ffffff" />
    <text x="40" y="18" font-family="'Sarabun', sans-serif" font-weight="800" font-size="14" fill="#16a34a" text-anchor="middle">ผู้ผลิต</text>
  </g>

  <!-- Arrow 1 to 2 -->
  <path d="M 230 460 Q 280 410 320 440" fill="none" stroke="#fde68a" stroke-width="4" stroke-dasharray="6,4" />
  <polygon points="325,445 320,430 310,442" fill="#fde68a" />

  <!-- 2. Consumer 1: Cute Chibi Caterpillar -->
  <g transform="translate(320, 435)" filter="url(#shadow)">
    <!-- Caterpillar segments -->
    <circle cx="30" cy="40" r="18" fill="#84cc16" />
    <circle cx="50" cy="42" r="16" fill="#84cc16" />
    <circle cx="70" cy="44" r="14" fill="#84cc16" />
    <circle cx="86" cy="46" r="11" fill="#84cc16" />
    <!-- Face -->
    <circle cx="36" cy="35" r="3" fill="#000000" />
    <path d="M 24 35 Q 20 20 18 22" fill="none" stroke="#000000" stroke-width="2" />
    <path d="M 28 32 Q 26 18 26 20" fill="none" stroke="#000000" stroke-width="2" />
    <!-- Label -->
    <rect x="25" y="0" width="50" height="22" rx="6" fill="#ffffff" />
    <text x="50" y="16" font-family="'Sarabun', sans-serif" font-weight="800" font-size="12" fill="#84cc16" text-anchor="middle">ผู้บริโภค 1</text>
  </g>

  <!-- Arrow 2 to 3 -->
  <path d="M 390 410 Q 380 320 320 280" fill="none" stroke="#fde68a" stroke-width="4" stroke-dasharray="6,4" />
  <polygon points="315,275 320,290 330,280" fill="#fde68a" />

  <!-- 3. Consumer 2 / Predator: Cute Chibi Frog -->
  <g transform="translate(200, 180)" filter="url(#shadow)">
    <!-- Frog Body -->
    <ellipse cx="60" cy="70" rx="55" ry="45" fill="#22c55e" />
    <!-- Eyes -->
    <circle cx="35" cy="32" r="18" fill="#22c55e" />
    <circle cx="35" cy="32" r="12" fill="#ffffff" />
    <circle cx="35" cy="32" r="6" fill="#000000" />

    <circle cx="85" cy="32" r="18" fill="#22c55e" />
    <circle cx="85" cy="32" r="12" fill="#ffffff" />
    <circle cx="85" cy="32" r="6" fill="#000000" />
    
    <!-- Blush -->
    <circle cx="22" cy="65" r="8" fill="#f43f5e" opacity="0.6" />
    <circle cx="98" cy="65" r="8" fill="#f43f5e" opacity="0.6" />
    
    <!-- Mouth -->
    <path d="M 40 75 Q 60 90 80 75" fill="none" stroke="#14532d" stroke-width="4" stroke-linecap="round" />
    
    <!-- Label -->
    <rect x="25" y="-10" width="70" height="24" rx="8" fill="#ffffff" />
    <text x="60" y="7" font-family="'Sarabun', sans-serif" font-weight="800" font-size="14" fill="#22c55e" text-anchor="middle">ผู้ล่า / ผู้บริโภค 2</text>
  </g>

  <!-- Arrow 3 to 1 -->
  <path d="M 180 280 Q 120 340 160 420" fill="none" stroke="#fde68a" stroke-width="4" stroke-dasharray="6,4" />
  <polygon points="163,425 150,420 160,410" fill="#fde68a" />

  <!-- Right Side: Game Title (Safe zone vertical 30% - 70%) -->
  <g transform="translate(620, 160)">
    <!-- Small Category Badge -->
    <g filter="url(#shadow)">
      <rect x="0" y="0" width="220" height="42" rx="21" fill="#16a34a" />
      <text x="110" y="27" font-family="'Sarabun', sans-serif" font-weight="800" font-size="20" fill="#ffffff" text-anchor="middle">วิทยาศาสตร์ ป.4 - ป.6</text>
    </g>

    <!-- Main Title (Strict safe-zone placement, no overlap) -->
    <text x="0" y="115" font-family="'Sarabun', sans-serif" font-weight="900" font-size="76" fill="#14532d" filter="url(#shadow)">
      Food Chain
    </text>
    <text x="0" y="180" font-family="'Sarabun', sans-serif" font-weight="800" font-size="64" fill="#ea580c" filter="url(#shadow)">
      ห่วงโซ่อาหาร
    </text>

    <!-- Features Points -->
    <g transform="translate(0, 260)" font-family="'Sarabun', sans-serif" font-size="20" font-weight="600" fill="#14532d">
      <!-- Item 1 -->
      <circle cx="15" cy="15" r="7" fill="#ea580c" />
      <text x="35" y="22">เรียนรู้บทบาทของผู้ผลิตและผู้บริโภค</text>
      
      <!-- Item 2 -->
      <circle cx="15" cy="55" r="7" fill="#ea580c" />
      <text x="35" y="62">ฝึกทักษะการเรียงลำดับการถ่ายทอดพลังงาน</text>

      <!-- Item 3 -->
      <circle cx="15" cy="95" r="7" fill="#ea580c" />
      <text x="35" y="102">โหมดเล่นเดี่ยวและโหมดแข่งขันดวลความไว 2 คน</text>
    </g>

    <!-- Subject Badge -->
    <g transform="translate(0, 420)">
      <!-- Level Grade -->
      <rect x="0" y="0" width="140" height="46" rx="12" fill="#15803d" />
      <text x="70" y="29" font-family="'Sarabun', sans-serif" font-weight="800" font-size="22" fill="#ffffff" text-anchor="middle">ป.4 - ป.6</text>
      
      <!-- Curriculum code -->
      <rect x="155" y="0" width="230" height="46" rx="12" fill="#dcfce7" stroke="#16a34a" stroke-width="1.5" />
      <text x="270" y="29" font-family="'Sarabun', sans-serif" font-weight="700" font-size="18" fill="#15803d" text-anchor="middle">ว 1.1 ป.5/2 · ว 1.1 ป.5/3</text>
    </g>
  </g>
</svg>
`;

async function main() {
    const outputPath = path.resolve('public/games/science/food-chain-cover.png');
    console.log(`Generating Food Chain cover at: ${outputPath}`);
    
    try {
        await sharp(Buffer.from(svgString))
            .png()
            .toFile(outputPath);
        console.log('✅ Food Chain cover generated successfully!');
    } catch (err) {
        console.error('❌ Error generating cover:', err);
    }
}

main();
