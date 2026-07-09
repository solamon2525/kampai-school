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
      <stop offset="0%" stop-color="#0c4a6e" />
      <stop offset="60%" stop-color="#0284c7" />
      <stop offset="100%" stop-color="#0369a1" />
    </linearGradient>

    <!-- Board Glassmorphism Gradient -->
    <linearGradient id="boardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.15)" />
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.05)" />
    </linearGradient>

    <!-- Drop Shadow Filters -->
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#082f49" flood-opacity="0.5" />
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
  <circle cx="100" cy="100" r="250" fill="#0284c7" opacity="0.2" filter="url(#glow)" />
  <circle cx="1100" cy="600" r="300" fill="#38bdf8" opacity="0.1" filter="url(#glow)" />

  <!-- Floating Math Symbols (Decorations) -->
  <g opacity="0.15">
    <text x="1000" y="160" font-family="'Sarabun', sans-serif" font-weight="900" font-size="120" fill="#fbbf24" transform="rotate(15 1000 160)">÷</text>
    <text x="180" y="650" font-family="'Sarabun', sans-serif" font-weight="900" font-size="100" fill="#fb7185" transform="rotate(-25 180 650)">-</text>
    <text x="1120" y="450" font-family="'Sarabun', sans-serif" font-weight="900" font-size="130" fill="#60a5fa" transform="rotate(-15 1120 450)">+</text>
    <text x="50" y="250" font-family="'Sarabun', sans-serif" font-weight="900" font-size="110" fill="#38bdf8" transform="rotate(35 50 250)">=</text>
    <text x="750" y="620" font-family="'Sarabun', sans-serif" font-weight="900" font-size="90" fill="#bae6fd" transform="rotate(10 750 620)">%</text>
  </g>

  <!-- Left: The Math Chalkboard -->
  <g filter="url(#shadow)">
    <!-- Outer wood frame -->
    <rect x="75" y="95" width="490" height="530" rx="25" fill="#0284c7" stroke="#38bdf8" stroke-width="4" />
    <!-- Inner slate -->
    <rect x="90" y="110" width="460" height="500" rx="15" fill="#082f49" />
  </g>

  <!-- Math Chalkboard Grid & Content -->
  <g font-family="Courier New, monospace" font-weight="bold" font-size="44" fill="#ffffff" xml:space="preserve">
    <!-- Long Division Equations -->
    <text x="290" y="170" fill="#38bdf8">1 5 8</text>
    <line x1="280" y1="190" x2="480" y2="190" stroke="#38bdf8" stroke-width="4" />

    <text x="200" y="240" fill="#fbbf24">3</text>
    <text x="235" y="240" font-family="'Sarabun', sans-serif" font-weight="300" fill="#38bdf8" font-size="52">)</text>
    <text x="290" y="240">4 7 5</text>

    <!-- Step 1 -->
    <text x="290" y="300" fill="#cbd5e1">3</text>
    <line x1="280" y1="315" x2="330" y2="315" stroke="#ffffff" stroke-width="3" />

    <text x="290" y="360" fill="#f472b6">1 7</text>
    <text x="290" y="420" fill="#cbd5e1">1 5</text>
    <line x1="280" y1="435" x2="370" y2="435" stroke="#ffffff" stroke-width="3" />

    <text x="335" y="480" fill="#f472b6">2 5</text>
    <text x="335" y="540" fill="#cbd5e1">2 4</text>
    <line x1="325" y1="555" x2="415" y2="555" stroke="#ffffff" stroke-width="3" />

    <!-- Remainder -->
    <text x="380" y="595" fill="#f43f5e">1</text>
    <line x1="370" y1="603" x2="415" y2="603" stroke="#f43f5e" stroke-width="2" />
    <line x1="370" y1="609" x2="415" y2="609" stroke="#f43f5e" stroke-width="2" />
  </g>

  <!-- Right: Title and Badges -->
  <g transform="translate(620, 160)">
    <!-- Small Category Badge -->
    <g filter="url(#shadow)">
      <rect x="0" y="0" width="220" height="42" rx="21" fill="#0284c7" />
      <text x="110" y="27" font-family="'Sarabun', sans-serif" font-weight="800" font-size="20" fill="#ffffff" text-anchor="middle">สื่อการสอนคณิตศาสตร์</text>
    </g>

    <!-- Main Title -->
    <text x="0" y="115" font-family="'Sarabun', sans-serif" font-weight="900" font-size="76" fill="#ffffff" filter="url(#shadow)">
      สอนหารยาว
    </text>
    <text x="0" y="180" font-family="'Sarabun', sans-serif" font-weight="800" font-size="76" fill="#fbbf24" filter="url(#shadow)">
      ทีละขั้นตอน
    </text>

    <!-- Subtitle -->
    <text x="0" y="235" font-family="'Sarabun', sans-serif" font-weight="700" font-size="26" fill="#bae6fd" opacity="0.9">
      Step-by-Step Long Division
    </text>

    <!-- Features Points -->
    <g transform="translate(0, 275)" font-family="'Sarabun', sans-serif" font-size="20" font-weight="600" fill="#ffffff">
      <!-- Item 1 -->
      <circle cx="15" cy="15" r="7" fill="#fbbf24" />
      <text x="35" y="22">คำนวณและแสดงวิธีหารยาวทีละสเตป</text>
      
      <!-- Item 2 -->
      <circle cx="15" cy="55" r="7" fill="#fbbf24" />
      <text x="35" y="62">มีเสียงพูดบรรยาย และระบบเล่นอัตโนมัติ</text>

      <!-- Item 3 -->
      <circle cx="15" cy="95" r="7" fill="#fbbf24" />
      <text x="35" y="102">ตั้งตัวเลขเองหรือสุ่มโจทย์แบบรวดเร็ว</text>
    </g>

    <!-- Subject Badge -->
    <g transform="translate(0, 420)">
      <!-- Level Grade -->
      <rect x="0" y="0" width="140" height="46" rx="12" fill="#d97706" />
      <text x="70" y="29" font-family="'Sarabun', sans-serif" font-weight="800" font-size="22" fill="#ffffff" text-anchor="middle">ป.4 - ป.6</text>
      
      <!-- Curriculum code -->
      <rect x="155" y="0" width="230" height="46" rx="12" fill="#082f49" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
      <text x="270" y="29" font-family="'Sarabun', sans-serif" font-weight="700" font-size="18" fill="#bae6fd" text-anchor="middle">ค 1.1 ป.4/9, 10, 11</text>
    </g>
  </g>
</svg>
`;

async function main() {
    const outputPath = path.resolve('public/games/math/long-division-thinking-media-cover.png');
    console.log(`Generating cover image at: ${outputPath}`);
    
    try {
        await sharp(Buffer.from(svgString))
            .png()
            .toFile(outputPath);
        console.log('✅ Long Division cover image generated successfully!');
    } catch (err) {
        console.error('❌ Error generating cover:', err);
    }
}

main();
