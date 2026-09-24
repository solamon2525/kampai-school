import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const TARGET_W = 1280;
const TARGET_H = 720;

const coverSvg = `
<svg width="${TARGET_W}" height="${TARGET_H}" viewBox="0 0 ${TARGET_W} ${TARGET_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Gradient -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#020617" />
      <stop offset="40%" stop-color="#0f172a" />
      <stop offset="80%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>

    <!-- Glassmorphism Container Gradient -->
    <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.25)" />
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.06)" />
    </linearGradient>

    <!-- Maglev Body Gradient -->
    <linearGradient id="trainGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="30%" stop-color="#e2e8f0" />
      <stop offset="70%" stop-color="#94a3b8" />
      <stop offset="100%" stop-color="#475569" />
    </linearGradient>

    <linearGradient id="neonN" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ef4444" />
      <stop offset="100%" stop-color="#f97316" />
    </linearGradient>

    <linearGradient id="neonS" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#3b82f6" />
      <stop offset="100%" stop-color="#06b6d4" />
    </linearGradient>

    <!-- Drop Shadows & Glow -->
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="10" stdDeviation="15" flood-color="#020617" flood-opacity="0.7" />
    </filter>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    <filter id="highGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="16" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background -->
  <rect width="${TARGET_W}" height="${TARGET_H}" fill="url(#bgGrad)" />

  <!-- Subtle Perspective Grid -->
  <g opacity="0.12">
    <line x1="0" y1="520" x2="1280" y2="520" stroke="#38bdf8" stroke-width="1.5" />
    <line x1="0" y1="580" x2="1280" y2="580" stroke="#38bdf8" stroke-width="2" />
    <line x1="0" y1="650" x2="1280" y2="650" stroke="#38bdf8" stroke-width="3" />
    <line x1="100" y1="720" x2="500" y2="480" stroke="#38bdf8" stroke-width="1.5" />
    <line x1="300" y1="720" x2="550" y2="480" stroke="#38bdf8" stroke-width="1.5" />
    <line x1="600" y1="720" x2="620" y2="480" stroke="#38bdf8" stroke-width="2" />
    <line x1="900" y1="720" x2="700" y2="480" stroke="#38bdf8" stroke-width="1.5" />
    <line x1="1180" y1="720" x2="750" y2="480" stroke="#38bdf8" stroke-width="1.5" />
  </g>

  <!-- Floating Magnetic Field Particles -->
  <circle cx="120" cy="180" r="180" fill="#ef4444" opacity="0.1" filter="url(#highGlow)" />
  <circle cx="500" cy="400" r="220" fill="#3b82f6" opacity="0.12" filter="url(#highGlow)" />
  <circle cx="1150" cy="560" r="240" fill="#06b6d4" opacity="0.08" filter="url(#highGlow)" />

  <!-- Left Side: Game Visual Board (Slate style, centered safe zone) -->
  <g filter="url(#shadow)">
    <!-- Glass Panel -->
    <rect x="75" y="95" width="500" height="530" rx="30" fill="url(#glassGrad)" stroke="rgba(255, 255, 255, 0.35)" stroke-width="2.5" />
    <!-- Slate Area -->
    <rect x="90" y="110" width="470" height="500" rx="22" fill="#090d16" />
  </g>

  <!-- Visual Graphics inside Slate -->
  <g>
    <!-- Levitation Rail Base -->
    <polygon points="120,570 530,570 420,380 230,380" fill="#0f172a" stroke="#1e293b" stroke-width="2" />
    <line x1="160" y1="570" x2="260" y2="380" stroke="#38bdf8" stroke-width="3" opacity="0.8" />
    <line x1="490" y1="570" x2="390" y2="380" stroke="#38bdf8" stroke-width="3" opacity="0.8" />
    
    <!-- Induction Coil Pads on Track -->
    <rect x="270" y="460" width="110" height="34" rx="8" fill="#1e293b" stroke="#ef4444" stroke-width="3" />
    <text x="325" y="485" font-family="'Sarabun', 'Kanit', sans-serif" font-weight="900" font-size="22" fill="#ef4444" text-anchor="middle" filter="url(#glow)">N ⚡</text>

    <!-- Speed Lightning Arcs -->
    <path d="M 170 420 L 220 440 L 200 460 L 250 490" stroke="#06b6d4" stroke-width="3" fill="none" opacity="0.7" filter="url(#glow)"/>
    <path d="M 480 430 L 440 450 L 460 470 L 410 500" stroke="#f97316" stroke-width="3" fill="none" opacity="0.7" filter="url(#glow)"/>

    <!-- Maglev Train (Front Perspective) -->
    <!-- Levitation Glow -->
    <ellipse cx="325" cy="365" rx="130" ry="30" fill="#38bdf8" opacity="0.3" filter="url(#highGlow)" />

    <!-- Train Body -->
    <path d="M 325 180 C 260 210 210 260 215 340 L 435 340 C 440 260 390 210 325 180 Z" fill="url(#trainGrad)" stroke="#ffffff" stroke-width="2.5" filter="url(#shadow)" />
    
    <!-- Windshield -->
    <path d="M 325 210 C 275 230 245 265 245 295 L 405 295 C 405 265 375 230 325 210 Z" fill="#0284c7" stroke="#38bdf8" stroke-width="2" />
    
    <!-- Maglev Front Stripe & Dual Magnet Badges -->
    <rect x="250" y="305" width="70" height="28" rx="8" fill="url(#neonN)" stroke="#fee2e2" stroke-width="2" />
    <text x="285" y="325" font-family="'Sarabun', 'Kanit', sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">N (เหนือ)</text>

    <rect x="330" y="305" width="70" height="28" rx="8" fill="url(#neonS)" stroke="#e0f2fe" stroke-width="2" />
    <text x="365" y="325" font-family="'Sarabun', 'Kanit', sans-serif" font-weight="900" font-size="16" fill="#ffffff" text-anchor="middle">S (ใต้)</text>

    <!-- Speedometer HUD on slate -->
    <rect x="245" y="130" width="160" height="42" rx="14" fill="rgba(15,23,42,0.85)" stroke="#38bdf8" stroke-width="1.5" />
    <text x="325" y="158" font-family="'Sarabun', 'Kanit', sans-serif" font-weight="900" font-size="20" fill="#38bdf8" text-anchor="middle">⚡ 450 KM/H</text>

    <!-- Floating Magnetic Collectibles with Orbits -->
    <!-- Iron Nail -->
    <circle cx="160" cy="270" r="32" fill="rgba(250,204,21,0.2)" stroke="#facc15" stroke-width="2" />
    <text x="160" y="282" font-size="26" text-anchor="middle">🔩</text>
    <rect x="125" y="306" width="70" height="18" rx="6" fill="#020617" />
    <text x="160" y="319" font-family="'Sarabun', sans-serif" font-weight="700" font-size="11" fill="#fde047" text-anchor="middle">ตะปูเหล็ก (Fe)</text>

    <!-- Nickel Coin -->
    <circle cx="490" cy="270" r="32" fill="rgba(250,204,21,0.2)" stroke="#facc15" stroke-width="2" />
    <text x="490" y="282" font-size="26" text-anchor="middle">🪙</text>
    <rect x="455" y="306" width="70" height="18" rx="6" fill="#020617" />
    <text x="490" y="319" font-family="'Sarabun', sans-serif" font-weight="700" font-size="11" fill="#fde047" text-anchor="middle">นิกเกิล (Ni)</text>

    <!-- Steel Bearing -->
    <circle cx="190" cy="510" r="28" fill="rgba(6,182,212,0.2)" stroke="#06b6d4" stroke-width="2" />
    <text x="190" y="520" font-size="22" text-anchor="middle">⚪</text>
  </g>

  <!-- Right Side: Game Title (Perfect safe zone, no clipping) -->
  <g transform="translate(630, 140)">
    <!-- Small Category Badge -->
    <g filter="url(#shadow)">
      <rect x="0" y="0" width="260" height="42" rx="21" fill="rgba(56, 189, 248, 0.25)" stroke="rgba(56, 189, 248, 0.5)" stroke-width="1.5" />
      <text x="130" y="27" font-family="'Sarabun', sans-serif" font-weight="800" font-size="18" fill="#38bdf8" text-anchor="middle">🧲 วิทยาศาสตร์กายภาพ</text>
    </g>

    <!-- Main Title (Guaranteed within vertical 60% safe zone, size-controlled) -->
    <!-- English Game Title -->
    <text x="0" y="105" font-family="'Sarabun', sans-serif" font-weight="900" font-size="62" fill="#ffffff" filter="url(#shadow)">
      Maglev Rush
    </text>
    <!-- Thai Game Title -->
    <text x="0" y="170" font-family="'Sarabun', sans-serif" font-weight="800" font-size="46" fill="#fbbf24" filter="url(#shadow)">
      รถไฟแม่เหล็กความเร็วสูง
    </text>

    <!-- Features Points -->
    <g transform="translate(0, 240)" font-family="'Sarabun', sans-serif" font-size="19" font-weight="600" fill="#ffffff">
      <!-- Item 1 -->
      <circle cx="15" cy="15" r="7" fill="#ef4444" />
      <text x="35" y="22">สลับขั้ว N-S สร้างแรงผลักเทอร์โบความเร็วสูง</text>
      
      <!-- Item 2 -->
      <circle cx="15" cy="55" r="7" fill="#facc15" />
      <text x="35" y="62">ดูดเก็บสารแม่เหล็ก (เหล็ก, นิกเกิล, โคบอลต์)</text>

      <!-- Item 3 -->
      <circle cx="15" cy="95" r="7" fill="#38bdf8" />
      <text x="35" y="102">ระบบเบรก Eddy Current &amp; ประลองแข่ง 2 คน</text>
    </g>

    <!-- Subject & Grade Badges -->
    <g transform="translate(0, 400)">
      <!-- Level Grade -->
      <rect x="0" y="0" width="130" height="46" rx="12" fill="#0284c7" />
      <text x="65" y="29" font-family="'Sarabun', sans-serif" font-weight="800" font-size="20" fill="#ffffff" text-anchor="middle">ป.1 - ป.6</text>
      
      <!-- Curriculum code -->
      <rect x="145" y="0" width="280" height="46" rx="12" fill="#1e293b" stroke="rgba(255,255,255,0.2)" stroke-width="1.5" />
      <text x="285" y="29" font-family="'Sarabun', sans-serif" font-weight="700" font-size="16" fill="#fde047" text-anchor="middle">ว 2.2 (แรงและแม่เหล็ก)</text>
    </g>
  </g>
</svg>
`;

const dir = 'public/games/science/maglev-rush';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const svgPath = path.join(dir, 'cover.svg');
const pngPath = path.join(dir, 'cover.png');

fs.writeFileSync(svgPath, coverSvg.trim(), 'utf8');
console.log('Saved SVG:', svgPath);

await sharp(Buffer.from(coverSvg))
  .resize(TARGET_W, TARGET_H)
  .png({ quality: 95 })
  .toFile(pngPath);

console.log('Generated PNG (1280x720 16:9):', pngPath);
