import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const TARGET_W = 1280;
const TARGET_H = 720;

function buildGameCover({
  c1, c2, title, subtitle, category, grade, indicators, graphicsContent, decorSymbols
}) {
  return `
<svg width="${TARGET_W}" height="${TARGET_H}" viewBox="0 0 ${TARGET_W} ${TARGET_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="50%" stop-color="${c2}" />
      <stop offset="100%" stop-color="${c1}" />
    </linearGradient>

    <!-- Glassmorphism Container Gradient -->
    <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.25)" />
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.08)" />
    </linearGradient>

    <!-- Drop Shadows -->
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="10" stdDeviation="15" flood-color="#020617" flood-opacity="0.6" />
    </filter>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1280" height="720" fill="url(#bgGrad)" />

  <!-- Math Grid Overlay (Light/Subtle) -->
  <g opacity="0.05">
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="none" />
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-width="1.5" />
    </pattern>
    <rect width="1280" height="720" fill="url(#grid)" />
  </g>

  <!-- Floating particles -->
  <circle cx="100" cy="150" r="200" fill="#ffffff" opacity="0.08" filter="url(#glow)" />
  <circle cx="1150" cy="550" r="220" fill="#ffffff" opacity="0.06" filter="url(#glow)" />
  
  <g opacity="0.2">
    ${decorSymbols}
  </g>

  <!-- Left Side: Game Visual Board (Slate style, centered safe zone) -->
  <g filter="url(#shadow)">
    <!-- Glass Panel -->
    <rect x="75" y="95" width="490" height="530" rx="30" fill="url(#glassGrad)" stroke="rgba(255, 255, 255, 0.4)" stroke-width="3" />
    <!-- Slate Area -->
    <rect x="90" y="110" width="460" height="500" rx="20" fill="#0f172a" />
  </g>

  <!-- Graphics inside slate -->
  <g xml:space="preserve">
    ${graphicsContent}
  </g>

  <!-- Right Side: Game Title (Perfect safe zone, no clipping) -->
  <g transform="translate(620, 160)">
    <!-- Small Category Badge -->
    <g filter="url(#shadow)">
      <rect x="0" y="0" width="220" height="44" rx="22" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.1)" stroke-width="1.5" />
      <text x="110" y="29" font-family="'Sarabun', sans-serif" font-weight="800" font-size="20" fill="#ffffff" text-anchor="middle">${category}</text>
    </g>

    <!-- Main Title (Guaranteed within vertical 60% safe zone, size-controlled) -->
    <!-- English Game Title -->
    <text x="0" y="115" font-family="'Sarabun', sans-serif" font-weight="900" font-size="64" fill="#ffffff" filter="url(#shadow)">
      ${title}
    </text>
    <!-- Thai Game Title -->
    <text x="0" y="180" font-family="'Sarabun', sans-serif" font-weight="800" font-size="52" fill="#fbbf24" filter="url(#shadow)">
      ${subtitle}
    </text>

    <!-- Features Points -->
    <g transform="translate(0, 260)" font-family="'Sarabun', sans-serif" font-size="20" font-weight="600" fill="#ffffff">
      <!-- Item 1 -->
      <circle cx="15" cy="15" r="7" fill="#fbbf24" />
      <text x="35" y="22">เกมการศึกษา 3D และบอร์ดเกมหรรษา</text>
      
      <!-- Item 2 -->
      <circle cx="15" cy="55" r="7" fill="#fbbf24" />
      <text x="35" y="62">ระบบตรวจจับความก้าวหน้าและการเก็บแต้ม</text>

      <!-- Item 3 -->
      <circle cx="15" cy="95" r="7" fill="#fbbf24" />
      <text x="35" y="102">เล่นง่าย สนุกสนาน พร้อมซาวด์เอฟเฟกต์สุดเร้าใจ</text>
    </g>

    <!-- Subject Badge -->
    <g transform="translate(0, 420)">
      <!-- Level Grade -->
      <rect x="0" y="0" width="140" height="46" rx="12" fill="#059669" />
      <text x="70" y="29" font-family="'Sarabun', sans-serif" font-weight="800" font-size="22" fill="#ffffff" text-anchor="middle">${grade}</text>
      
      <!-- Curriculum code -->
      <rect x="155" y="0" width="260" height="46" rx="12" fill="#1e293b" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
      <text x="285" y="29" font-family="'Sarabun', sans-serif" font-weight="700" font-size="16" fill="#a7f3d0" text-anchor="middle">${indicators}</text>
    </g>
  </g>
</svg>
`;
}

// Config for the 3 target game covers
const gameCovers = [
  // 1. snake-3d
  {
    out: 'public/games/english/snake-3d/cover.png',
    c1: '#0e7490', c2: '#06b6d4', title: 'Spelling Snake 3D', subtitle: 'งูกินคำศัพท์ 3 มิติ',
    category: 'ภาษาอังกฤษ', grade: 'ป.4 - ป.6', indicators: 'ต 1.1 ป.4/2, 3',
    decorSymbols: `<text x="1000" y="180" font-size="120" fill="#a5f3fc">🐍</text>`,
    graphicsContent: `
      <!-- A cute 3D cartoon snake eating letters -->
      <!-- Ground grass -->
      <rect x="90" y="480" width="460" height="130" fill="#15803d" rx="10"/>
      <!-- Three.js Voxel Grid Block Trees -->
      <rect x="130" y="380" width="50" height="100" fill="#14532d" rx="4"/>
      <rect x="145" y="480" width="20" height="40" fill="#78350f"/>

      <rect x="460" y="360" width="60" height="120" fill="#14532d" rx="4"/>
      <rect x="480" y="480" width="20" height="40" fill="#78350f"/>

      <!-- Snake Body blocks (voxel style) -->
      <rect x="200" y="460" width="45" height="45" rx="8" fill="#eab308" stroke="#ca8a04" stroke-width="2"/>
      <rect x="250" y="450" width="45" height="45" rx="8" fill="#eab308" stroke="#ca8a04" stroke-width="2"/>
      <rect x="300" y="440" width="50" height="50" rx="10" fill="#fbbf24" stroke="#d97706" stroke-width="3"/>
      
      <!-- Snake Eyes -->
      <circle cx="335" cy="460" r="6" fill="#000000"/>
      <circle cx="320" cy="460" r="6" fill="#000000"/>
      
      <!-- Target Letters to Eat -->
      <rect x="390" y="380" width="45" height="45" rx="6" fill="#f43f5e"/>
      <text x="412" y="412" font-family="'Sarabun', sans-serif" font-weight="900" font-size="26" fill="#ffffff" text-anchor="middle">A</text>
      
      <rect x="280" y="320" width="45" height="45" rx="6" fill="#3b82f6"/>
      <text x="302" y="352" font-family="'Sarabun', sans-serif" font-weight="900" font-size="26" fill="#ffffff" text-anchor="middle">S</text>
    `
  },
  // 2. multiplication-kingdom
  {
    out: 'public/games/math/multiplication-kingdom/cover.png',
    c1: '#7c2d12', c2: '#ea580c', title: 'Multiplication Kingdom', subtitle: 'อาณาจักรคูณมหัศจรรย์',
    category: 'คณิตศาสตร์', grade: 'ป.4 - ป.6', indicators: 'ค 1.1 ป.4/9, 10',
    decorSymbols: `<text x="1000" y="180" font-size="120" fill="#ffedd5">🏰</text>`,
    graphicsContent: `
      <!-- A cartoon castle with flags and math symbols -->
      <!-- Hills -->
      <path d="M 90 560 Q 250 480 350 540 T 550 560 L 550 610 L 90 610 Z" fill="#15803d"/>
      
      <!-- Castle Walls -->
      <rect x="180" y="320" width="280" height="220" fill="#475569" rx="10"/>
      <!-- Battlements -->
      <rect x="180" y="290" width="40" height="40" fill="#334155" rx="4"/>
      <rect x="240" y="290" width="40" height="40" fill="#334155" rx="4"/>
      <rect x="300" y="290" width="40" height="40" fill="#334155" rx="4"/>
      <rect x="360" y="290" width="40" height="40" fill="#334155" rx="4"/>
      <rect x="420" y="290" width="40" height="40" fill="#334155" rx="4"/>
      
      <!-- Main Gate -->
      <path d="M 280 540 A 40 40 0 0 1 360 540 Z" fill="#0f172a"/>
      
      <!-- Floating Shields with Multiplication -->
      <circle cx="230" cy="220" r="30" fill="#fbbf24" stroke="#ffffff" stroke-width="2"/>
      <text x="230" y="230" font-family="'Sarabun', sans-serif" font-weight="900" font-size="36" fill="#7c2d12" text-anchor="middle">×</text>

      <circle cx="410" cy="220" r="30" fill="#fbbf24" stroke="#ffffff" stroke-width="2"/>
      <text x="410" y="230" font-family="'Sarabun', sans-serif" font-weight="900" font-size="36" fill="#7c2d12" text-anchor="middle">×</text>
      
      <!-- Castle Flag -->
      <line x1="320" y1="290" x2="320" y2="180" stroke="#ffffff" stroke-width="4"/>
      <path d="M 320 180 L 390 210 L 320 240 Z" fill="#dc2626"/>
    `
  },
  // 3. probability-zoo-board
  {
    out: 'public/games/math/probability-zoo-board/cover.png',
    c1: '#1e1b4b', c2: '#312e81', title: 'Probability Zoo', subtitle: 'บอร์ดเกมความน่าจะเป็น',
    category: 'คณิตศาสตร์', grade: 'ป.4 - ป.6', indicators: 'ค 1.1 ป.4/7, 10',
    decorSymbols: `<text x="1000" y="180" font-size="120" fill="#c7d2fe">🎲</text>`,
    graphicsContent: `
      <!-- A board game board with spinner, dice and pathway -->
      <!-- Board path cells -->
      <rect x="120" y="470" width="90" height="80" rx="12" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
      <circle cx="165" cy="510" r="16" fill="#ffffff" opacity="0.3"/>
      
      <rect x="230" y="470" width="90" height="80" rx="12" fill="#f59e0b" stroke="#ffffff" stroke-width="2"/>
      <circle cx="275" cy="510" r="16" fill="#ffffff" opacity="0.3"/>

      <rect x="340" y="470" width="90" height="80" rx="12" fill="#10b981" stroke="#ffffff" stroke-width="2"/>
      <circle cx="385" cy="510" r="16" fill="#ffffff" opacity="0.3"/>

      <rect x="450" y="470" width="80" height="80" rx="12" fill="#3b82f6" stroke="#ffffff" stroke-width="2"/>
      
      <!-- Rolling Dice -->
      <rect x="180" y="240" width="100" height="100" rx="20" fill="#ffffff" stroke="#cbd5e1" stroke-width="4"/>
      <!-- Dice dots (rolling 5 or 6) -->
      <circle cx="210" cy="270" r="10" fill="#000000"/>
      <circle cx="250" cy="270" r="10" fill="#000000"/>
      <circle cx="210" cy="310" r="10" fill="#000000"/>
      <circle cx="250" cy="310" r="10" fill="#000000"/>
      <circle cx="230" cy="290" r="10" fill="#000000"/>

      <!-- Spinner Wheel -->
      <circle cx="390" cy="290" r="80" fill="#0f172a" stroke="#ffffff" stroke-width="4"/>
      <path d="M 390 290 L 390 210 A 80 80 0 0 1 470 290 Z" fill="#ef4444"/>
      <path d="M 390 290 L 470 290 A 80 80 0 0 1 390 370 Z" fill="#f59e0b"/>
      <path d="M 390 290 L 390 370 A 80 80 0 0 1 310 290 Z" fill="#10b981"/>
      <path d="M 390 290 L 310 290 A 80 80 0 0 1 390 210 Z" fill="#3b82f6"/>
      <!-- Spinner pointer -->
      <line x1="390" y1="290" x2="440" y2="240" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
      <circle cx="390" cy="290" r="10" fill="#ffffff"/>
    `
  }
];

async function main() {
  for (const c of gameCovers) {
    const dest = path.resolve(c.out);
    console.log(`Generating game cover: ${c.out}`);
    
    const svg = buildGameCover(c);
    
    try {
      await sharp(Buffer.from(svg))
        .png()
        .toFile(dest);
      console.log(`✅ Cover generated: ${c.out}`);
    } catch (err) {
      console.error(`❌ Error generating cover ${c.out}:`, err);
    }
  }
}

main();
