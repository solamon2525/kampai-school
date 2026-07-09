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
      <stop offset="0%" stop-color="#7c2d12" />
      <stop offset="60%" stop-color="#d97706" />
      <stop offset="100%" stop-color="#b45309" />
    </linearGradient>

    <!-- Board Glassmorphism Gradient -->
    <linearGradient id="boardGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.15)" />
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.05)" />
    </linearGradient>

    <!-- Drop Shadow Filters -->
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#451a03" flood-opacity="0.5" />
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
  <circle cx="100" cy="100" r="250" fill="#d97706" opacity="0.2" filter="url(#glow)" />
  <circle cx="1100" cy="600" r="300" fill="#f59e0b" opacity="0.1" filter="url(#glow)" />

  <!-- Floating Math Symbols (Decorations) -->
  <g opacity="0.15">
    <text x="1000" y="160" font-family="'Sarabun', sans-serif" font-weight="900" font-size="120" fill="#fde68a" transform="rotate(15 1000 160)">÷</text>
    <text x="180" y="650" font-family="'Sarabun', sans-serif" font-weight="900" font-size="100" fill="#60a5fa" transform="rotate(-25 180 650)">-</text>
    <text x="1120" y="450" font-family="'Sarabun', sans-serif" font-weight="900" font-size="130" fill="#f472b6" transform="rotate(-15 1120 450)">+</text>
    <text x="50" y="250" font-family="'Sarabun', sans-serif" font-weight="900" font-size="110" fill="#f59e0b" transform="rotate(35 50 250)">=</text>
    <text x="750" y="620" font-family="'Sarabun', sans-serif" font-weight="900" font-size="90" fill="#fef3c7" transform="rotate(10 750 620)">%</text>
  </g>

  <!-- Left: The Math Chalkboard -->
  <g filter="url(#shadow)">
    <!-- Outer frame -->
    <rect x="75" y="145" width="490" height="430" rx="25" fill="#d97706" stroke="#f59e0b" stroke-width="4" />
    <!-- Inner slate -->
    <rect x="90" y="160" width="460" height="400" rx="15" fill="#451a03" />
  </g>

  <!-- Math Chalkboard Grid & Content -->
  <g font-family="Courier New, monospace" font-weight="bold" font-size="54" fill="#ffffff" xml:space="preserve">
    <!-- Divisor -->
    <text x="130" y="270" fill="#f59e0b">3</text>
    <!-- Bracket ) -->
    <text x="170" y="270" font-family="'Sarabun', sans-serif" font-weight="300" fill="#f59e0b" font-size="62">)</text>

    <!-- Dividend row with carries -->
    <!-- Carries (small red superscript digits) -->
    <text x="285" y="230" fill="#f87171" font-size="34">1</text>
    <text x="355" y="230" fill="#f87171" font-size="34">2</text>

    <!-- Dividend digits -->
    <text x="230" y="270">4</text>
    <text x="305" y="270">7</text>
    <text x="375" y="270">5</text>

    <!-- Divider Line under dividend -->
    <line x1="210" y1="305" x2="520" y2="305" stroke="#ffffff" stroke-width="4" />

    <!-- Quotient Row -->
    <text x="230" y="380" fill="#a7f3d0">1</text>
    <text x="305" y="380" fill="#a7f3d0">5</text>
    <text x="375" y="380" fill="#a7f3d0">8</text>
    <text x="440" y="380" font-family="'Sarabun', sans-serif" font-size="34" fill="#a7f3d0">เศษ 1</text>

    <!-- Double Line Divider under quotient -->
    <line x1="210" y1="415" x2="520" y2="415" stroke="#a7f3d0" stroke-width="3" />
    <line x1="210" y1="423" x2="520" y2="423" stroke="#a7f3d0" stroke-width="3" />
  </g>

  <!-- Right: Title and Badges -->
  <g transform="translate(620, 160)">
    <!-- Small Category Badge -->
    <g filter="url(#shadow)">
      <rect x="0" y="0" width="220" height="42" rx="21" fill="#d97706" />
      <text x="110" y="27" font-family="'Sarabun', sans-serif" font-weight="800" font-size="20" fill="#ffffff" text-anchor="middle">สื่อการสอนคณิตศาสตร์</text>
    </g>

    <!-- Main Title -->
    <text x="0" y="115" font-family="'Sarabun', sans-serif" font-weight="900" font-size="76" fill="#ffffff" filter="url(#shadow)">
      สอนหารสั้น
    </text>
    <text x="0" y="180" font-family="'Sarabun', sans-serif" font-weight="800" font-size="76" fill="#fde68a" filter="url(#shadow)">
      ทีละขั้นตอน
    </text>

    <!-- Subtitle -->
    <text x="0" y="235" font-family="'Sarabun', sans-serif" font-weight="700" font-size="26" fill="#fef3c7" opacity="0.9">
      Step-by-Step Short Division
    </text>

    <!-- Features Points -->
    <g transform="translate(0, 275)" font-family="'Sarabun', sans-serif" font-size="20" font-weight="600" fill="#ffffff">
      <!-- Item 1 -->
      <circle cx="15" cy="15" r="7" fill="#fde68a" />
      <text x="35" y="22">คำนวณและเขียนตัวทดสลักเดี่ยวแบบกระชับ</text>
      
      <!-- Item 2 -->
      <circle cx="15" cy="55" r="7" fill="#fde68a" />
      <text x="35" y="62">แสดงสเตปการคิดหักลบเศษในใจละเอียดยิบ</text>

      <!-- Item 3 -->
      <circle cx="15" cy="95" r="7" fill="#fde68a" />
      <text x="35" y="102">เล่นโหมด Auto พร้อมคำพูดอธิบายภาษาไทย</text>
    </g>

    <!-- Subject Badge -->
    <g transform="translate(0, 420)">
      <!-- Level Grade -->
      <rect x="0" y="0" width="140" height="46" rx="12" fill="#059669" />
      <text x="70" y="29" font-family="'Sarabun', sans-serif" font-weight="800" font-size="22" fill="#ffffff" text-anchor="middle">ป.4 - ป.6</text>
      
      <!-- Curriculum code -->
      <rect x="155" y="0" width="230" height="46" rx="12" fill="#451a03" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
      <text x="270" y="29" font-family="'Sarabun', sans-serif" font-weight="700" font-size="18" fill="#fde68a" text-anchor="middle">ค 1.1 ป.4/9, 10, 11</text>
    </g>
  </g>
</svg>
`;

async function main() {
    const outputPath = path.resolve('public/games/math/short-division-thinking-media-cover.png');
    console.log(`Generating cover image at: ${outputPath}`);
    
    try {
        await sharp(Buffer.from(svgString))
            .png()
            .toFile(outputPath);
        console.log('✅ Short Division cover image generated successfully!');
    } catch (err) {
        console.error('❌ Error generating cover:', err);
    }
}

main();
