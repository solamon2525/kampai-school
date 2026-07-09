import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const TARGET_W = 1280;
const TARGET_H = 720;

const svgString = `
<svg width="${TARGET_W}" height="${TARGET_H}" viewBox="0 0 ${TARGET_W} ${TARGET_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#064e3b" />
      <stop offset="60%" stop-color="#047857" />
      <stop offset="100%" stop-color="#065f46" />
    </linearGradient>

    <!-- Board Glassmorphism Gradient -->
    <linearGradient id="boardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.15)" />
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.05)" />
    </linearGradient>

    <!-- Math Card Gradient -->
    <linearGradient id="cardGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#f0fdf4" />
    </linearGradient>

    <!-- Drop Shadow Filters -->
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#022c22" flood-opacity="0.5" />
    </filter>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1280" height="720" fill="url(#bgGrad)" />

  <!-- Math Grid Overlay -->
  <g opacity="0.08">
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="none" />
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-width="1.5" />
    </pattern>
    <rect width="1280" height="720" fill="url(#grid)" />
  </g>

  <!-- Glowing background circles -->
  <circle cx="100" cy="100" r="250" fill="#10b981" opacity="0.15" filter="url(#glow)" />
  <circle cx="1100" cy="600" r="300" fill="#34d399" opacity="0.1" filter="url(#glow)" />

  <!-- Floating Math Symbols (Decorations) -->
  <g opacity="0.15">
    <text x="1000" y="160" font-family="'Sarabun', sans-serif" font-weight="900" font-size="120" fill="#fbbf24" transform="rotate(15 1000 160)">×</text>
    <text x="180" y="650" font-family="'Sarabun', sans-serif" font-weight="900" font-size="100" fill="#60a5fa" transform="rotate(-25 180 650)">+</text>
    <text x="1120" y="450" font-family="'Sarabun', sans-serif" font-weight="900" font-size="130" fill="#f472b6" transform="rotate(-15 1120 450)">÷</text>
    <text x="50" y="250" font-family="'Sarabun', sans-serif" font-weight="900" font-size="110" fill="#34d399" transform="rotate(35 50 250)">=</text>
    <text x="750" y="620" font-family="'Sarabun', sans-serif" font-weight="900" font-size="90" fill="#a7f3d0" transform="rotate(10 750 620)">%</text>
  </g>

  <!-- Left: The Math Chalkboard -->
  <g filter="url(#shadow)">
    <!-- Outer wooden-like frame -->
    <rect x="75" y="95" width="490" height="530" rx="25" fill="#047857" stroke="#10b981" stroke-width="4" />
    <!-- Inner chalkboard slate -->
    <rect x="90" y="110" width="460" height="500" rx="15" fill="#022c22" />
  </g>

  <!-- Math Chalkboard Grid & Content -->
  <g font-family="Courier New, monospace" font-weight="bold" font-size="56" fill="#ffffff" xml:space="preserve">
    <!-- Grid Line effect inside chalkboard -->
    <line x1="120" y1="130" x2="520" y2="130" stroke="#047857" stroke-dasharray="5,5" stroke-width="1" />
    <line x1="120" y1="210" x2="520" y2="210" stroke="#047857" stroke-dasharray="5,5" stroke-width="1" />
    <line x1="120" y1="290" x2="520" y2="290" stroke="#047857" stroke-dasharray="5,5" stroke-width="1" />
    <line x1="120" y1="370" x2="520" y2="370" stroke="#047857" stroke-dasharray="5,5" stroke-width="1" />
    <line x1="120" y1="450" x2="520" y2="450" stroke="#047857" stroke-dasharray="5,5" stroke-width="1" />
    
    <!-- Multiplication Equation with carry and details -->
    <!-- Carries (pink-ish color) -->
    <text x="348" y="170" fill="#f472b6" font-size="36">1</text>
    <text x="296" y="170" fill="#f472b6" font-size="36">1</text>

    <!-- Equation digits -->
    <text x="348" y="250">4 5</text> 
    <text x="244" y="330" fill="#fbbf24">×</text>
    <text x="348" y="330">2 3</text>
    
    <!-- Divider -->
    <line x1="220" y1="365" x2="480" y2="365" stroke="#ffffff" stroke-width="4" />

    <!-- Partial Product 1 (45 * 3) -->
    <text x="296" y="430" fill="#a7f3d0">1 3 5</text>
    
    <!-- Partial Product 2 (45 * 20) -->
    <text x="296" y="500" fill="#a7f3d0">9 0 0</text>
    
    <!-- Divider 2 -->
    <line x1="220" y1="520" x2="480" y2="520" stroke="#ffffff" stroke-width="4" />

    <!-- Final Sum -->
    <text x="244" y="585" fill="#34d399">1 0 3 5</text>
    <!-- Double Line Divider -->
    <line x1="220" y1="600" x2="480" y2="600" stroke="#34d399" stroke-width="3" />
    <line x1="220" y1="608" x2="480" y2="608" stroke="#34d399" stroke-width="3" />
  </g>

  <!-- Right: Title and Badges -->
  <g transform="translate(620, 160)">
    <!-- Small Category Badge -->
    <g filter="url(#shadow)">
      <rect x="0" y="0" width="220" height="42" rx="21" fill="#10b981" />
      <text x="110" y="27" font-family="'Sarabun', sans-serif" font-weight="800" font-size="20" fill="#ffffff" text-anchor="middle">สื่อการสอนคณิตศาสตร์</text>
    </g>

    <!-- Main Title (Neon glow effect) -->
    <text x="0" y="115" font-family="'Sarabun', sans-serif" font-weight="900" font-size="76" fill="#ffffff" filter="url(#shadow)">
      สอนคูณแนวตั้ง
    </text>
    <text x="0" y="180" font-family="'Sarabun', sans-serif" font-weight="800" font-size="76" fill="#fbbf24" filter="url(#shadow)">
      ทีละขั้นตอน
    </text>

    <!-- English subtitle -->
    <text x="0" y="235" font-family="'Sarabun', sans-serif" font-weight="700" font-size="26" fill="#d1fae5" opacity="0.9">
      Vertical Multiplication Guide
    </text>

    <!-- Features Points -->
    <g transform="translate(0, 275)" font-family="'Sarabun', sans-serif" font-size="20" font-weight="600" fill="#ffffff">
      <!-- Item 1 -->
      <circle cx="15" cy="15" r="7" fill="#fbbf24" />
      <text x="35" y="22">กรอกตัวเลข / สุ่มตัวตั้งตัวคูณได้ 2-4 หลัก</text>
      
      <!-- Item 2 -->
      <circle cx="15" cy="55" r="7" fill="#fbbf24" />
      <text x="35" y="62">จำลองวิธีคูณ เลขทด และคำนวณทีละสเตป</text>

      <!-- Item 3 -->
      <circle cx="15" cy="95" r="7" fill="#fbbf24" />
      <text x="35" y="102">มีเสียงอธิบาย (TTS) และเล่นอัตโนมัติ</text>
    </g>

    <!-- Subject Badge -->
    <g transform="translate(0, 420)">
      <!-- Level Grade -->
      <rect x="0" y="0" width="140" height="46" rx="12" fill="#d97706" />
      <text x="70" y="29" font-family="'Sarabun', sans-serif" font-weight="800" font-size="22" fill="#ffffff" text-anchor="middle">ป.4 - ป.5</text>
      
      <!-- Curriculum code -->
      <rect x="155" y="0" width="230" height="46" rx="12" fill="#1e293b" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
      <text x="270" y="29" font-family="'Sarabun', sans-serif" font-weight="700" font-size="18" fill="#a7f3d0" text-anchor="middle">ค 1.1 ป.4/9, 10, 11</text>
    </g>
  </g>
</svg>
`;

async function main() {
    const outputPath = path.resolve('public/games/math/multiplication-thinking-media-cover.png');
    console.log(`Generating cover image at: ${outputPath}`);
    
    try {
        await sharp(Buffer.from(svgString))
            .png()
            .toFile(outputPath);
        console.log('✅ Cover image generated successfully!');
    } catch (err) {
        console.error('❌ Error generating cover:', err);
    }
}

main();
