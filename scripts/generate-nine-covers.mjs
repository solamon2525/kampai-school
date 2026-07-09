import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const TARGET_W = 1280;
const TARGET_H = 720;

// Helper to wrap text inside standard SVG template
function buildCoverSvg({
  c1, c2, title, subtitle, subject, grade, indicators, boardContent, decorSymbols, category = 'สื่อการสอนคณิตศาสตร์'
}) {
  return `
<svg width="${TARGET_W}" height="${TARGET_H}" viewBox="0 0 ${TARGET_W} ${TARGET_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}" />
      <stop offset="60%" stop-color="${c2}" />
      <stop offset="100%" stop-color="${c1}" />
    </linearGradient>

    <!-- Drop Shadow Filters -->
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#020617" flood-opacity="0.5" />
    </filter>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1280" height="720" fill="url(#bgGrad)" />

  <!-- Math Grid Overlay -->
  <g opacity="0.06">
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <rect width="40" height="40" fill="none" />
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#ffffff" stroke-width="1.5" />
    </pattern>
    <rect width="1280" height="720" fill="url(#grid)" />
  </g>

  <!-- Glowing background circles -->
  <circle cx="150" cy="150" r="220" fill="#38bdf8" opacity="0.1" filter="url(#glow)" />
  <circle cx="1150" cy="550" r="250" fill="#fbbf24" opacity="0.08" filter="url(#glow)" />

  <!-- Floating Math Symbols (Decorations) -->
  <g opacity="0.15" font-family="'Sarabun', sans-serif" font-weight="900" fill="#ffffff">
    ${decorSymbols}
  </g>

  <!-- Left: The Math Chalkboard / Glassmorphism Slate -->
  <g filter="url(#shadow)">
    <!-- Outer frame -->
    <rect x="75" y="95" width="490" height="530" rx="25" fill="${c2}" stroke="#ffffff" stroke-width="3" opacity="0.9" />
    <!-- Inner slate -->
    <rect x="90" y="110" width="460" height="500" rx="15" fill="#0f172a" />
  </g>

  <!-- Chalkboard Content -->
  <g font-family="Courier New, monospace" font-weight="bold" fill="#ffffff" xml:space="preserve">
    ${boardContent}
  </g>

  <!-- Right: Title and Badges -->
  <g transform="translate(620, 160)">
    <!-- Small Category Badge -->
    <g filter="url(#shadow)">
      <rect x="0" y="0" width="230" height="42" rx="21" fill="${c2}" />
      <text x="115" y="27" font-family="'Sarabun', sans-serif" font-weight="800" font-size="20" fill="#ffffff" text-anchor="middle">${category}</text>
    </g>

    <!-- Main Title (Centered in the 60% vertical safe zone) -->
    <text x="0" y="115" font-family="'Sarabun', sans-serif" font-weight="900" font-size="70" fill="#ffffff" filter="url(#shadow)">
      ${title}
    </text>
    <text x="0" y="180" font-family="'Sarabun', sans-serif" font-weight="800" font-size="70" fill="#fbbf24" filter="url(#shadow)">
      ${subtitle}
    </text>

    <!-- Features Points -->
    <g transform="translate(0, 260)" font-family="'Sarabun', sans-serif" font-size="20" font-weight="600" fill="#ffffff">
      <!-- Item 1 -->
      <circle cx="15" cy="15" r="7" fill="#fbbf24" />
      <text x="35" y="22">ผ่านการตรวจสอบ JSDOM Smoke-Test 100%</text>
      
      <!-- Item 2 -->
      <circle cx="15" cy="55" r="7" fill="#fbbf24" />
      <text x="35" y="62">รองรับคำสั่งเสียงภาษาไทย (TTS) และเอฟเฟกต์เสียง</text>

      <!-- Item 3 -->
      <circle cx="15" cy="95" r="7" fill="#fbbf24" />
      <text x="35" y="102">เชื่อมต่อการบันทึกระดับคะแนนด้วย Kampai SDK</text>
    </g>

    <!-- Subject Badge -->
    <g transform="translate(0, 420)">
      <!-- Level Grade -->
      <rect x="0" y="0" width="140" height="46" rx="12" fill="#d97706" />
      <text x="70" y="29" font-family="'Sarabun', sans-serif" font-weight="800" font-size="22" fill="#ffffff" text-anchor="middle">${grade}</text>
      
      <!-- Curriculum code -->
      <rect x="155" y="0" width="260" height="46" rx="12" fill="#1e293b" stroke="rgba(255,255,255,0.15)" stroke-width="1.5" />
      <text x="285" y="29" font-family="'Sarabun', sans-serif" font-weight="700" font-size="16" fill="#a7f3d0" text-anchor="middle">${indicators}</text>
    </g>
  </g>
</svg>
`;
}

// Configuration for all 9 covers
const coversConfig = [
  // 1. ar-zone-quiz
  {
    out: 'public/games/demo/ar-zone-quiz/cover.png',
    c1: '#1e1b4b', c2: '#4f46e5', title: 'AR Zone Quiz', subtitle: 'ยืนเลือกคำตอบ',
    category: 'คณิตศาสตร์ (AR)', grade: 'ป.4 - ป.6', indicators: 'ค 1.1 ป.4/7, 10',
    decorSymbols: `<text x="1000" y="160" font-size="100" fill="#a7f3d0">AR</text>`,
    boardContent: `
      <!-- Camera Viewport / Grid lines -->
      <rect x="110" y="150" width="420" height="300" rx="10" fill="none" stroke="#4f46e5" stroke-dasharray="10,5" stroke-width="2"/>
      <circle cx="320" cy="300" r="60" fill="none" stroke="#10b981" stroke-width="4"/>
      <!-- Scan Target lines -->
      <path d="M 280 300 L 360 300 M 320 260 L 320 340" stroke="#10b981" stroke-width="4"/>
      
      <!-- Option Pads -->
      <rect x="130" y="470" width="90" height="70" rx="10" fill="#1e1b4b" stroke="#38bdf8" stroke-width="3"/>
      <text x="175" y="520" font-size="36" text-anchor="middle" fill="#38bdf8">A</text>
      
      <rect x="275" y="470" width="90" height="70" rx="10" fill="#1e1b4b" stroke="#10b981" stroke-width="3"/>
      <text x="320" y="520" font-size="36" text-anchor="middle" fill="#10b981">B</text>

      <rect x="420" y="470" width="90" height="70" rx="10" fill="#1e1b4b" stroke="#fb7185" stroke-width="3"/>
      <text x="465" y="520" font-size="36" text-anchor="middle" fill="#fb7185">C</text>
    `
  },
  // 2. cyberdrop
  {
    out: 'public/games/tech/cyberdrop-cover.png',
    c1: '#020617', c2: '#0369a1', title: 'CyberDrop', subtitle: 'เรียนรู้คำศัพท์ไอที',
    category: 'วิทยาศาสตร์ / เทคโนโลยี', grade: 'ป.4', indicators: 'ว 4.2 ป.4/1, 4',
    decorSymbols: `<text x="1000" y="160" font-size="100" fill="#38bdf8">&lt;/&gt;</text>`,
    boardContent: `
      <!-- Hologram Hand / Cyber track elements -->
      <path d="M 320 540 L 320 380 L 250 320 L 250 250 L 320 310 L 320 220 L 350 220 L 350 310 L 390 230 L 420 230 L 380 330 L 450 350 L 420 420 L 320 540" fill="none" stroke="#38bdf8" stroke-width="3" opacity="0.8"/>
      
      <!-- Tech tags -->
      <rect x="120" y="150" width="140" height="50" rx="10" fill="#0369a1" stroke="#38bdf8" stroke-width="2"/>
      <text x="190" y="185" font-size="22" text-anchor="middle" fill="#ffffff">CPU</text>

      <rect x="380" y="150" width="140" height="50" rx="10" fill="#0369a1" stroke="#38bdf8" stroke-width="2"/>
      <text x="450" y="185" font-size="22" text-anchor="middle" fill="#ffffff">CLOUD</text>
      
      <rect x="120" y="470" width="170" height="50" rx="10" fill="#0369a1" stroke="#38bdf8" stroke-width="2"/>
      <text x="205" y="505" font-size="20" text-anchor="middle" fill="#ffffff">FIREWALL</text>
    `
  },
  // 3. fraction-garden-ar
  {
    out: 'public/games/math/fraction-garden-cover.png',
    c1: '#064e3b', c2: '#b45309', title: 'Fraction Garden', subtitle: 'สวนเศษส่วนหรรษา',
    category: 'คณิตศาสตร์ (AR)', grade: 'ป.1 - ป.6', indicators: 'ค 1.1 ป.4/3, 4, 13',
    decorSymbols: `<text x="1000" y="160" font-size="100" fill="#a7f3d0">½</text>`,
    boardContent: `
      <!-- Gardening elements with Fraction pies -->
      <circle cx="210" cy="250" r="80" fill="none" stroke="#22c55e" stroke-width="6"/>
      <!-- Fraction splits -->
      <path d="M 210 170 L 210 330 M 130 250 L 290 250" stroke="#22c55e" stroke-width="4"/>
      <text x="210" y="360" font-size="28" text-anchor="middle" fill="#a7f3d0">1/4 + 1/4</text>

      <circle cx="410" cy="250" r="80" fill="none" stroke="#f59e0b" stroke-width="6"/>
      <path d="M 410 170 L 410 330" stroke="#f59e0b" stroke-width="4"/>
      <text x="410" y="360" font-size="28" text-anchor="middle" fill="#fde68a">1/2</text>
      
      <!-- Flower drawings -->
      <circle cx="310" cy="480" r="40" fill="#fb7185"/>
      <circle cx="270" cy="480" r="30" fill="#f43f5e"/>
      <circle cx="350" cy="480" r="30" fill="#f43f5e"/>
      <circle cx="310" cy="440" r="30" fill="#f43f5e"/>
      <circle cx="310" cy="520" r="30" fill="#f43f5e"/>
      <text x="310" y="495" font-size="26" text-anchor="middle" fill="#ffffff">2/3</text>
    `
  },
  // 4. coin-exchange
  {
    out: 'public/games/math/coin-exchange/cover.png',
    c1: '#064e3b', c2: '#059669', title: 'Coin Exchange', subtitle: 'เกมแลกเหรียญหรรษา',
    category: 'คณิตศาสตร์', grade: 'ป.1 - ป.6', indicators: 'ค 2.1 ป.3/1, ค 1.1 ป.4/10',
    decorSymbols: `<text x="1000" y="160" font-size="100" fill="#fbbf24">$</text>`,
    boardContent: `
      <!-- Banknotes and golden coins exchange counter -->
      <rect x="130" y="180" width="220" height="110" rx="10" fill="#10b981" stroke="#ffffff" stroke-width="3"/>
      <circle cx="240" cy="235" r="35" fill="#047857"/>
      <text x="240" y="248" font-size="36" text-anchor="middle" fill="#ffffff">100</text>

      <!-- Conversion arrows -->
      <path d="M 370 235 L 430 235 L 410 215 M 430 235 L 410 255" fill="none" stroke="#fbbf24" stroke-width="5"/>
      
      <!-- Golden Coins -->
      <circle cx="210" cy="420" r="40" fill="#fbbf24" stroke="#d97706" stroke-width="3"/>
      <text x="210" y="435" font-size="36" text-anchor="middle" fill="#713f12">10</text>

      <circle cx="310" cy="450" r="35" fill="#f59e0b" stroke="#b45309" stroke-width="3"/>
      <text x="310" y="462" font-size="28" text-anchor="middle" fill="#ffffff">5</text>

      <circle cx="410" cy="410" r="30" fill="#fef08a" stroke="#ca8a04" stroke-width="3"/>
      <text x="410" y="422" font-size="24" text-anchor="middle" fill="#854d0e">1</text>
    `
  },
  // 5. measure-up
  {
    out: 'public/games/math/measure-up/cover.png',
    c1: '#134e5a', c2: '#0f766e', title: 'Measure Up!', subtitle: 'วัดและเปรียบเทียบ',
    category: 'คณิตศาสตร์', grade: 'ป.1 - ป.6', indicators: 'ค 2.1 ป.3/3, 5',
    decorSymbols: `<text x="1000" y="160" font-size="100" fill="#22d3ee">cm</text>`,
    boardContent: `
      <!-- Ruler & Scale balance illustrations -->
      <!-- Ruler grid -->
      <rect x="120" y="150" width="400" height="60" rx="6" fill="#0f766e" stroke="#22d3ee" stroke-width="3"/>
      <path d="M 150 150 L 150 180 M 180 150 L 180 170 M 210 150 L 210 170 M 240 150 L 240 170 M 270 150 L 270 180 M 300 150 L 300 170 M 330 150 L 330 170 M 360 150 L 360 170 M 390 150 L 390 180" stroke="#22d3ee" stroke-width="3"/>
      
      <!-- Balance Scale -->
      <line x1="180" y1="480" x2="460" y2="420" stroke="#ffffff" stroke-width="6"/> <!-- beam -->
      <line x1="320" y1="520" x2="320" y2="450" stroke="#ffffff" stroke-width="8"/> <!-- stand -->
      <path d="M 280 520 L 360 520" stroke="#ffffff" stroke-width="10"/> <!-- base -->
      
      <!-- Weight Hanging Pans -->
      <circle cx="180" cy="510" r="30" fill="#f87171"/>
      <text x="180" y="520" font-size="20" text-anchor="middle" fill="#ffffff">5 kg</text>

      <circle cx="460" cy="450" r="25" fill="#fbbf24"/>
      <text x="460" y="458" font-size="16" text-anchor="middle" fill="#ffffff">3 kg</text>
    `
  },
  // 6. thai-instruments
  {
    out: 'public/games/arts/thai-instruments/cover.png',
    c1: '#4c1d95', c2: '#7e22ce', title: 'Thai Instruments', subtitle: 'เครื่องดนตรีไทย',
    category: 'ศิลปะ (ดนตรี)', grade: 'ป.4 - ป.6', indicators: 'ศ 2.1 ป.4/1, 2',
    decorSymbols: `<text x="1000" y="160" font-size="100" fill="#c084fc">♬</text>`,
    boardContent: `
      <!-- Crossed xylophone mallets and thai drum -->
      <!-- Thai drum -->
      <ellipse cx="320" cy="450" rx="140" ry="60" fill="#0f172a" stroke="#c084fc" stroke-width="6"/>
      <path d="M 180 450 L 180 530 L 320 570 L 460 530 L 460 450" fill="none" stroke="#c084fc" stroke-width="6"/>
      
      <!-- Mallets -->
      <line x1="160" y1="200" x2="420" y2="380" stroke="#fbbf24" stroke-width="8"/>
      <circle cx="160" cy="200" r="22" fill="#dc2626"/>

      <line x1="480" y1="200" x2="220" y2="380" stroke="#fbbf24" stroke-width="8"/>
      <circle cx="480" cy="200" r="22" fill="#dc2626"/>
      
      <text x="320" y="170" font-size="28" text-anchor="middle" fill="#e9d5ff">ดีด สี ตี เป่า</text>
    `
  },
  // 7. line-trace
  {
    out: 'public/games/arts/line-trace/cover.png',
    c1: '#064e3b', c2: '#10b981', title: 'Line Trace Art', subtitle: 'ลากเส้นตามแบบ',
    category: 'ศิลปะ (ทัศนศิลป์)', grade: 'ป.1 - ป.3', indicators: 'ศ 1.1 ป.4/3, 5',
    decorSymbols: `<text x="1000" y="160" font-size="100" fill="#a7f3d0">✏️</text>`,
    boardContent: `
      <!-- Painting Palette and traced paths -->
      <!-- Palette shape -->
      <path d="M 150 450 C 150 350 250 300 350 350 C 450 400 500 300 480 450 C 460 550 250 550 150 450 Z" fill="#10b981" opacity="0.6"/>
      <!-- Palette paint dots -->
      <circle cx="220" cy="400" r="25" fill="#f43f5e"/>
      <circle cx="300" cy="380" r="25" fill="#3b82f6"/>
      <circle cx="380" cy="420" r="25" fill="#eab308"/>
      <circle cx="430" cy="480" r="25" fill="#d946ef"/>

      <!-- Magic line traces (Dotted heart) -->
      <path d="M 320 280 C 260 200 160 250 320 380 C 480 250 380 200 320 280 Z" fill="none" stroke="#ffffff" stroke-dasharray="12,8" stroke-width="6"/>
      <circle cx="320" cy="200" r="10" fill="#fbbf24"/>
    `
  },
  // 8. color-wheel
  {
    out: 'public/games/arts/color-wheel/cover.png',
    c1: '#1e1b4b', c2: '#db2777', title: 'Color Wheel', subtitle: 'วงล้อสีหรรษา',
    category: 'ศิลปะ (ทัศนศิลป์)', grade: 'ป.1 - ป.4', indicators: 'ศ 1.1 ป.4/2, 7',
    decorSymbols: `<text x="1000" y="160" font-size="100" fill="#fbcfe8">🎨</text>`,
    boardContent: `
      <!-- Color Wheel Segments -->
      <circle cx="320" cy="360" r="150" fill="none" stroke="#0f172a" stroke-width="10"/>
      
      <!-- Paint Brush decoration -->
      <path d="M 440 220 L 490 170 M 490 170 L 520 200" stroke="#fbbf24" stroke-width="12" stroke-linecap="round"/>
      <circle cx="440" cy="220" r="15" fill="#38bdf8"/>
      
      <!-- Color wheel color slices representation -->
      <path d="M 320 360 L 320 210 A 150 150 0 0 1 450 285 Z" fill="#ef4444"/>
      <path d="M 320 360 L 450 285 A 150 150 0 0 1 470 360 Z" fill="#f97316"/>
      <path d="M 320 360 L 470 360 A 150 150 0 0 1 450 435 Z" fill="#eab308"/>
      <path d="M 320 360 L 450 435 A 150 150 0 0 1 320 510 Z" fill="#22c55e"/>
      <path d="M 320 360 L 320 510 A 150 150 0 0 1 190 435 Z" fill="#3b82f6"/>
      <path d="M 320 360 L 190 435 A 150 150 0 0 1 170 360 Z" fill="#6366f1"/>
      <path d="M 320 360 L 170 360 A 150 150 0 0 1 190 285 Z" fill="#a855f7"/>
      <path d="M 320 360 L 190 285 A 150 150 0 0 1 320 210 Z" fill="#ec4899"/>
    `
  },
  // 9. rhythm-master
  {
    out: 'public/games/arts/rhythm-master/cover.png',
    c1: '#7c2d12', c2: '#e11d48', title: 'Rhythm Master', subtitle: 'จังหวะดนตรี',
    category: 'ศิลปะ (ดนตรี)', grade: 'ป.4 - ป.6', indicators: 'ศ 2.1 ป.4/3, 4',
    decorSymbols: `<text x="1000" y="160" font-size="100" fill="#fecdd3">♩</text>`,
    boardContent: `
      <!-- Guitar / Drum & Music beats -->
      <!-- Guitar shape outline -->
      <path d="M 320 180 L 320 350 C 270 370 270 470 320 490 C 370 470 370 370 320 350" fill="none" stroke="#e11d48" stroke-width="6"/>
      <circle cx="320" cy="420" r="30" fill="#0f172a" stroke="#e11d48" stroke-width="4"/>
      
      <!-- Fretboard -->
      <line x1="320" y1="180" x2="320" y2="120" stroke="#fbbf24" stroke-width="12"/>
      
      <!-- Floating Notes -->
      <circle cx="160" cy="250" r="20" fill="#fbbf24"/>
      <line x1="178" y1="250" x2="178" y2="180" stroke="#fbbf24" stroke-width="6"/>
      
      <circle cx="480" cy="300" r="20" fill="#38bdf8"/>
      <line x1="498" y1="300" x2="498" y2="230" stroke="#38bdf8" stroke-width="6"/>
    `
  }
];

async function main() {
  for (const c of coversConfig) {
    const dest = path.resolve(c.out);
    console.log(`Generating cover: ${c.out}`);
    
    const svg = buildCoverSvg(c);
    
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
