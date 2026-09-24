import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputPath = path.join(rootDir, 'public', 'games', 'science', 'solar-system-3d-media-cover.png');

const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700;800;900&display=swap');
  
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 1280px;
    height: 720px;
    overflow: hidden;
    font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, sans-serif;
    background: radial-gradient(circle at 18% 45%, #1a224a 0%, #080c1d 55%, #030611 100%);
    position: relative;
    color: #fff;
  }

  /* Starfield */
  .stars {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }
  
  /* Nebulae */
  .nebula-1 {
    position: absolute;
    top: -80px;
    right: 120px;
    width: 500px;
    height: 380px;
    background: radial-gradient(ellipse, rgba(168, 85, 247, 0.22) 0%, rgba(59, 130, 246, 0.12) 50%, transparent 70%);
    filter: blur(40px);
  }
  .nebula-2 {
    position: absolute;
    bottom: -60px;
    left: 280px;
    width: 600px;
    height: 360px;
    background: radial-gradient(ellipse, rgba(14, 165, 233, 0.2) 0%, rgba(139, 92, 246, 0.1) 50%, transparent 75%);
    filter: blur(50px);
  }

  /* Orbits */
  svg.cosmic-canvas {
    position: absolute;
    inset: 0;
    width: 1280px;
    height: 720px;
  }

  /* Main Container in Safe Zone */
  .content-wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 1100px;
    height: 430px; /* Centered in vertical safe zone (approx 60% of 720px) */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    z-index: 20;
  }

  .top-pill {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 6px 18px;
    border-radius: 999px;
    background: rgba(14, 165, 233, 0.2);
    border: 1.5px solid rgba(56, 189, 248, 0.5);
    box-shadow: 0 0 16px rgba(56, 189, 248, 0.3);
    font-size: 15px;
    font-weight: 700;
    color: #7dd3fc;
    letter-spacing: 0.5px;
    margin-bottom: 12px;
  }
  .top-pill span.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #38bdf8;
    box-shadow: 0 0 8px #38bdf8;
  }

  .title-en {
    font-size: 64px;
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -0.5px;
    background: linear-gradient(180deg, #ffffff 20%, #bae6fd 60%, #38bdf8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 6px 18px rgba(2, 132, 199, 0.6)) drop-shadow(0 2px 4px rgba(0,0,0,0.8));
    margin-bottom: 4px;
  }

  .title-th {
    font-size: 46px;
    font-weight: 900;
    color: #fbbf24;
    text-shadow: 0 0 20px rgba(245, 158, 11, 0.6), 0 4px 10px rgba(0,0,0,0.9);
    margin-bottom: 14px;
    letter-spacing: 0.5px;
  }

  .badges-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-bottom: 16px;
  }

  .badge-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(15, 23, 42, 0.85);
    border: 1.5px solid rgba(255, 255, 255, 0.22);
    padding: 7px 18px;
    border-radius: 999px;
    font-size: 16px;
    font-weight: 700;
    color: #f1f5f9;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
  }
  .badge-chip.gold {
    border-color: rgba(251, 191, 36, 0.6);
    background: rgba(245, 158, 11, 0.18);
    color: #fde68a;
  }
  .badge-chip.cyan {
    border-color: rgba(56, 189, 248, 0.6);
    background: rgba(14, 165, 233, 0.18);
    color: #bae6fd;
  }

  .subtitle {
    font-size: 18px;
    font-weight: 600;
    color: #cbd5e1;
    background: rgba(15, 23, 42, 0.6);
    padding: 4px 18px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Chibi Astronaut */
  .astronaut {
    position: absolute;
    right: 70px;
    top: 140px;
    width: 220px;
    height: 250px;
    z-index: 25;
    filter: drop-shadow(0 12px 24px rgba(0,0,0,0.7));
  }

  /* Corner Floating Highlights */
  .corner-badge {
    position: absolute;
    top: 28px;
    left: 36px;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 30;
  }
  .corner-logo {
    width: 38px;
    height: 38px;
    background: linear-gradient(135deg, #f59e0b, #ef4444);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
  }
  .corner-text {
    font-size: 16px;
    font-weight: 800;
    color: #e2e8f0;
    letter-spacing: 0.5px;
    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
  }

  .corner-curriculum {
    position: absolute;
    top: 28px;
    right: 36px;
    font-size: 15px;
    font-weight: 700;
    color: #93c5fd;
    background: rgba(30, 58, 138, 0.5);
    border: 1px solid rgba(147, 197, 253, 0.4);
    padding: 6px 16px;
    border-radius: 999px;
    z-index: 30;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
  }
</style>
</head>
<body>

<div class="nebula-1"></div>
<div class="nebula-2"></div>

<!-- Background SVG for Sun, Orbits, Stars, Planets -->
<svg class="cosmic-canvas" viewBox="0 0 1280 720">
  <defs>
    <!-- Sun Gradient -->
    <radialGradient id="sunGlow" cx="20%" cy="50%" r="65%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="25%" stop-color="#fef08a"/>
      <stop offset="60%" stop-color="#f59e0b"/>
      <stop offset="85%" stop-color="#ea580c"/>
      <stop offset="100%" stop-color="rgba(234, 88, 12, 0)"/>
    </radialGradient>
    <radialGradient id="sunCore" cx="30%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="40%" stop-color="#fde047"/>
      <stop offset="80%" stop-color="#f97316"/>
      <stop offset="100%" stop-color="#c2410c"/>
    </radialGradient>

    <!-- Planet Gradients -->
    <!-- Mercury -->
    <radialGradient id="mercuryGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#e2e8f0"/>
      <stop offset="60%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#475569"/>
    </radialGradient>
    <!-- Venus -->
    <radialGradient id="venusGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#fef3c7"/>
      <stop offset="50%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </radialGradient>
    <!-- Earth -->
    <radialGradient id="earthGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#67e8f9"/>
      <stop offset="40%" stop-color="#0284c7"/>
      <stop offset="85%" stop-color="#1e3a8a"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </radialGradient>
    <!-- Mars -->
    <radialGradient id="marsGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#fca5a5"/>
      <stop offset="50%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#991b1b"/>
    </radialGradient>
    <!-- Jupiter -->
    <radialGradient id="jupiterGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#fed7aa"/>
      <stop offset="45%" stop-color="#f97316"/>
      <stop offset="80%" stop-color="#c2410c"/>
      <stop offset="100%" stop-color="#7c2d12"/>
    </radialGradient>
    <!-- Saturn -->
    <radialGradient id="saturnGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#fef08a"/>
      <stop offset="50%" stop-color="#eab308"/>
      <stop offset="100%" stop-color="#854d0e"/>
    </radialGradient>
    <!-- Uranus -->
    <radialGradient id="uranusGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#a5f3fc"/>
      <stop offset="55%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#0e7490"/>
    </radialGradient>
    <!-- Neptune -->
    <radialGradient id="neptuneGrad" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#93c5fd"/>
      <stop offset="55%" stop-color="#2563eb"/>
      <stop offset="100%" stop-color="#1e3a8a"/>
    </radialGradient>
    <!-- Ring Gradient -->
    <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(253, 224, 71, 0.9)"/>
      <stop offset="45%" stop-color="rgba(234, 179, 8, 0.75)"/>
      <stop offset="70%" stop-color="rgba(161, 98, 7, 0.4)"/>
      <stop offset="100%" stop-color="rgba(253, 224, 71, 0.85)"/>
    </linearGradient>
  </defs>

  <!-- Twinkle Stars -->
  <g opacity="0.8">
    <circle cx="95" cy="80" r="1.5" fill="#fff" />
    <circle cx="210" cy="140" r="2" fill="#fff" />
    <circle cx="340" cy="65" r="1.2" fill="#bae6fd" />
    <circle cx="480" cy="110" r="2.2" fill="#fff" />
    <circle cx="620" cy="70" r="1.8" fill="#fde047" />
    <circle cx="780" cy="95" r="2" fill="#fff" />
    <circle cx="910" cy="60" r="1.5" fill="#a5f3fc" />
    <circle cx="1060" cy="120" r="2.5" fill="#fff" />
    <circle cx="1200" cy="80" r="1.5" fill="#fff" />
    
    <circle cx="140" cy="620" r="2" fill="#fff" />
    <circle cx="290" cy="650" r="1.5" fill="#bae6fd" />
    <circle cx="450" cy="610" r="2.2" fill="#fff" />
    <circle cx="610" cy="660" r="1.8" fill="#fff" />
    <circle cx="770" cy="630" r="2" fill="#fde047" />
    <circle cx="930" cy="670" r="1.5" fill="#fff" />
    <circle cx="1090" cy="620" r="2" fill="#a5f3fc" />
    <circle cx="1210" cy="640" r="1.6" fill="#fff" />

    <!-- Sparkle Crosses -->
    <path d="M490 85 L490 99 M483 92 L497 92" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M850 110 L850 124 M843 117 L857 117" stroke="#fde047" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M1120 280 L1120 294 M1113 287 L1127 287" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M220 560 L220 574 M213 567 L227 567" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
    <path d="M1020 540 L1020 554 M1013 547 L1027 547" stroke="#fde047" stroke-width="1.5" stroke-linecap="round"/>
  </g>

  <!-- Orbits Lines (Concentric Swooping Arcs) -->
  <g fill="none" stroke="rgba(56, 189, 248, 0.22)" stroke-dasharray="4 6" stroke-width="1.5">
    <ellipse cx="60" cy="360" rx="200" ry="140"/>
    <ellipse cx="60" cy="360" rx="300" ry="200"/>
    <ellipse cx="60" cy="360" rx="420" ry="270"/>
    <ellipse cx="60" cy="360" rx="550" ry="340"/>
    <ellipse cx="60" cy="360" rx="720" ry="430"/>
    <ellipse cx="60" cy="360" rx="900" ry="520"/>
    <ellipse cx="60" cy="360" rx="1060" ry="600"/>
    <ellipse cx="60" cy="360" rx="1200" ry="670"/>
  </g>

  <!-- Glowing Sun on the Left Side -->
  <circle cx="50" cy="360" r="220" fill="url(#sunGlow)" opacity="0.45"/>
  <circle cx="50" cy="360" r="160" fill="url(#sunGlow)" opacity="0.7"/>
  <circle cx="50" cy="360" r="115" fill="url(#sunCore)"/>
  <!-- Sun Surface Detail -->
  <circle cx="75" cy="325" r="14" fill="#ea580c" opacity="0.6"/>
  <circle cx="95" cy="385" r="18" fill="#ea580c" opacity="0.5"/>
  <circle cx="45" cy="410" r="12" fill="#ea580c" opacity="0.5"/>

  <!-- 1. Mercury (พุธ) -->
  <g transform="translate(240, 270)">
    <circle cx="0" cy="0" r="12" fill="url(#mercuryGrad)" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.8))"/>
    <circle cx="-3" cy="-3" r="2.5" fill="#475569" opacity="0.7"/>
    <circle cx="4" cy="2" r="2" fill="#475569" opacity="0.6"/>
    <text x="0" y="24" text-anchor="middle" font-size="12" font-weight="700" fill="#cbd5e1">ดาวพุธ</text>
  </g>

  <!-- 2. Venus (ศุกร์) -->
  <g transform="translate(240, 500)">
    <circle cx="0" cy="0" r="19" fill="url(#venusGrad)" filter="drop-shadow(0 4px 10px rgba(245, 158, 11, 0.4))"/>
    <path d="M-14 -6 Q0 -10 14 -4" stroke="#fde68a" stroke-width="2" fill="none" opacity="0.5"/>
    <path d="M-15 4 Q0 8 15 2" stroke="#d97706" stroke-width="2" fill="none" opacity="0.6"/>
    <text x="0" y="32" text-anchor="middle" font-size="13" font-weight="700" fill="#fde68a">ดาวศุกร์</text>
  </g>

  <!-- 3. Earth & Moon (โลกและดวงจันทร์) -->
  <g transform="translate(380, 190)">
    <circle cx="0" cy="0" r="22" fill="url(#earthGrad)" filter="drop-shadow(0 4px 12px rgba(2, 132, 199, 0.5))"/>
    <path d="M-10 -8 Q-4 -14 2 -8 Q8 -4 4 4 Q-2 6 -6 2 Z" fill="#22c55e" opacity="0.85"/>
    <path d="M-2 8 Q4 12 8 6 Q12 14 6 16 Z" fill="#16a34a" opacity="0.85"/>
    <path d="M-16 -2 Q-4 -8 8 -2 Q16 4 10 10" stroke="#ffffff" stroke-width="2.5" fill="none" opacity="0.65" stroke-linecap="round"/>
    <circle cx="0" cy="0" r="36" fill="none" stroke="rgba(255,255,255,0.25)" stroke-dasharray="2 3"/>
    <circle cx="28" cy="-22" r="6" fill="#e2e8f0" filter="drop-shadow(0 0 4px #fff)"/>
    <text x="0" y="36" text-anchor="middle" font-size="14" font-weight="800" fill="#7dd3fc">โลก 🌍</text>
  </g>

  <!-- 4. Mars (อังคาร) -->
  <g transform="translate(450, 550)">
    <circle cx="0" cy="0" r="16" fill="url(#marsGrad)" filter="drop-shadow(0 4px 10px rgba(239, 68, 68, 0.4))"/>
    <ellipse cx="0" cy="-13" rx="6" ry="2.5" fill="#ffffff" opacity="0.9"/>
    <path d="M-10 2 Q-2 -2 6 4" stroke="#7f1d1d" stroke-width="2.5" fill="none" opacity="0.7"/>
    <text x="0" y="28" text-anchor="middle" font-size="13" font-weight="700" fill="#fca5a5">ดาวอังคาร</text>
  </g>

  <!-- 5. Jupiter (พฤหัสบดี) -->
  <g transform="translate(680, 110)">
    <circle cx="0" cy="0" r="44" fill="url(#jupiterGrad)" filter="drop-shadow(0 6px 18px rgba(249, 115, 22, 0.4))"/>
    <path d="M-41 -18 Q0 -14 41 -18" stroke="#9a3412" stroke-width="4" fill="none" opacity="0.6"/>
    <path d="M-43 -7 Q0 -4 43 -7" stroke="#fed7aa" stroke-width="3" fill="none" opacity="0.7"/>
    <path d="M-43 6 Q0 9 43 6" stroke="#9a3412" stroke-width="5" fill="none" opacity="0.75"/>
    <path d="M-41 19 Q0 22 41 19" stroke="#ea580c" stroke-width="4" fill="none" opacity="0.6"/>
    <ellipse cx="16" cy="9" rx="8" ry="5" fill="#b91c1c" filter="drop-shadow(0 0 4px #ef4444)"/>
    <ellipse cx="16" cy="9" rx="5" ry="3" fill="#ef4444"/>
    <text x="0" y="60" text-anchor="middle" font-size="15" font-weight="800" fill="#fdba74">ดาวพฤหัสบดี</text>
  </g>

  <!-- 6. Saturn (เสาร์) with Double Rings -->
  <g transform="translate(900, 520)">
    <path d="M-82 0 C-82 -28 82 -28 82 0" fill="none" stroke="url(#ringGrad)" stroke-width="16" opacity="0.85" transform="rotate(-22)"/>
    <path d="M-68 0 C-68 -22 68 -22 68 0" fill="none" stroke="#fef08a" stroke-width="4" opacity="0.9" transform="rotate(-22)"/>
    <circle cx="0" cy="0" r="36" fill="url(#saturnGrad)" filter="drop-shadow(0 6px 16px rgba(234, 179, 8, 0.4))"/>
    <path d="M-34 -6 Q0 -3 34 -6" stroke="#ca8a04" stroke-width="3" fill="none" opacity="0.6"/>
    <path d="M-34 8 Q0 11 34 8" stroke="#a16207" stroke-width="3.5" fill="none" opacity="0.6"/>
    <path d="M-82 0 C-82 28 82 28 82 0" fill="none" stroke="url(#ringGrad)" stroke-width="16" opacity="0.95" transform="rotate(-22)"/>
    <path d="M-68 0 C-68 22 68 22 68 0" fill="none" stroke="#fef08a" stroke-width="4" opacity="0.9" transform="rotate(-22)"/>
    <text x="0" y="54" text-anchor="middle" font-size="15" font-weight="800" fill="#fde047">ดาวเสาร์</text>
  </g>

  <!-- 7. Uranus (ยูเรนัส) -->
  <g transform="translate(1015, 230)">
    <!-- Tilted Ring -->
    <ellipse cx="0" cy="0" rx="36" ry="10" fill="none" stroke="rgba(165, 243, 252, 0.5)" stroke-width="3" transform="rotate(82)"/>
    <circle cx="0" cy="0" r="26" fill="url(#uranusGrad)" filter="drop-shadow(0 4px 14px rgba(6, 182, 212, 0.5))"/>
    <circle cx="-6" cy="-6" r="10" fill="#cffafe" opacity="0.25"/>
    <text x="0" y="42" text-anchor="middle" font-size="14" font-weight="700" fill="#67e8f9">ดาวยูเรนัส</text>
  </g>

  <!-- 8. Neptune (เนปจูน) -->
  <g transform="translate(1140, 430)">
    <circle cx="0" cy="0" r="24" fill="url(#neptuneGrad)" filter="drop-shadow(0 4px 14px rgba(37, 99, 235, 0.5))"/>
    <!-- Storm Streaks -->
    <path d="M-18 -4 Q0 -8 18 -4" stroke="#bfdbfe" stroke-width="2.5" fill="none" opacity="0.75"/>
    <path d="M-16 6 Q0 3 16 6" stroke="#60a5fa" stroke-width="2.5" fill="none" opacity="0.7"/>
    <text x="0" y="40" text-anchor="middle" font-size="14" font-weight="700" fill="#93c5fd">ดาวเนปจูน</text>
  </g>

  <!-- Chibi Astronaut SVG (Friendly, Non-violent) -->
  <g class="astronaut" transform="translate(1070, 95)">
    <!-- Backpack -->
    <rect x="5" y="45" width="48" height="60" rx="14" fill="#94a3b8" stroke="#475569" stroke-width="3"/>
    <rect x="12" y="52" width="14" height="22" rx="4" fill="#38bdf8"/>
    <rect x="29" y="52" width="14" height="22" rx="4" fill="#22c55e"/>

    <!-- Body / Spacesuit -->
    <ellipse cx="65" cy="85" rx="32" ry="36" fill="#f8fafc" stroke="#cbd5e1" stroke-width="3.5"/>
    <!-- Chest Control Panel -->
    <rect x="52" y="70" width="26" height="22" rx="6" fill="#0f172a"/>
    <circle cx="59" cy="77" r="3" fill="#38bdf8"/>
    <circle cx="71" cy="77" r="3" fill="#ef4444"/>
    <rect x="56" y="84" width="18" height="4" rx="2" fill="#22c55e"/>

    <!-- Limbs -->
    <!-- Left Arm waving -->
    <path d="M40 70 Q15 50 20 30" stroke="#f8fafc" stroke-width="16" stroke-linecap="round" fill="none"/>
    <path d="M40 70 Q15 50 20 30" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round" fill="none"/>
    <circle cx="20" cy="28" r="10" fill="#38bdf8" stroke="#0284c7" stroke-width="2.5"/>

    <!-- Right Arm holding star wand -->
    <path d="M90 75 Q115 85 125 70" stroke="#f8fafc" stroke-width="16" stroke-linecap="round" fill="none"/>
    <circle cx="125" cy="70" r="9" fill="#38bdf8"/>
    <!-- Golden Star in Hand -->
    <polygon points="128,45 132,56 144,57 135,65 138,76 128,70 118,76 121,65 112,57 124,56" fill="#fbbf24" stroke="#f59e0b" stroke-width="1.5"/>

    <!-- Legs with Boots -->
    <path d="M50 110 L45 145" stroke="#f8fafc" stroke-width="16" stroke-linecap="round"/>
    <ellipse cx="42" cy="150" rx="12" ry="7" fill="#64748b"/>
    <path d="M78 110 L84 142" stroke="#f8fafc" stroke-width="16" stroke-linecap="round"/>
    <ellipse cx="88" cy="148" rx="12" ry="7" fill="#64748b"/>

    <!-- Big Helmet (Chibi Proportions) -->
    <circle cx="65" cy="38" r="36" fill="#ffffff" stroke="#cbd5e1" stroke-width="3.5" filter="drop-shadow(0 4px 10px rgba(0,0,0,0.5))"/>
    <!-- Visor -->
    <ellipse cx="65" cy="38" rx="26" ry="22" fill="#0f172a" stroke="#38bdf8" stroke-width="3"/>
    <!-- Visor reflection glow -->
    <path d="M48 26 Q65 18 78 24 Q68 32 48 26 Z" fill="rgba(56, 189, 248, 0.6)"/>
    <!-- Cute Eyes inside Visor -->
    <ellipse cx="56" cy="40" rx="4" ry="5.5" fill="#ffffff"/>
    <circle cx="58" cy="38" r="1.5" fill="#38bdf8"/>
    <ellipse cx="74" cy="40" rx="4" ry="5.5" fill="#ffffff"/>
    <circle cx="76" cy="38" r="1.5" fill="#38bdf8"/>
    <path d="M62 46 Q65 49 68 46" stroke="#ffffff" stroke-width="1.5" fill="none" stroke-linecap="round"/>

    <!-- Antenna -->
    <line x1="65" y1="2" x2="65" y2="-12" stroke="#cbd5e1" stroke-width="3"/>
    <circle cx="65" cy="-14" r="5" fill="#fbbf24" filter="drop-shadow(0 0 6px #fbbf24)"/>
  </g>
</svg>

<!-- Top Corner Badges -->
<div class="corner-badge">
  <div class="corner-logo">🪐</div>
  <div class="corner-text">KAMPAI SCIENCE · โรงเรียนบ้านคำไผ่</div>
</div>

<div class="corner-curriculum">
  ⭐ ว 3.1 ป.4–ป.6 · มาตรฐาน วฐ.
</div>

<!-- Center Safe Zone Title & Badges -->
<div class="content-wrapper">
  <div class="top-pill">
    <span class="dot"></span>
    INTERACTIVE 3D CELESTIAL LAB
  </div>
  <h1 class="title-en">Solar System 3D</h1>
  <h2 class="title-th">ระบบสุริยะ 3 มิติ</h2>
  
  <div class="badges-row">
    <div class="badge-chip gold">
      <span>☀️</span> ดวงอาทิตย์ & ดาวเคราะห์ 8 ดวง
    </div>
    <div class="badge-chip cyan">
      <span>🌕</span> ข้างขึ้น-ข้างแรม & โครงสร้างดาว
    </div>
    <div class="badge-chip">
      <span>⚡</span> จำลองความเร็วแสง 3D
    </div>
  </div>

  <div class="subtitle">
    สื่อการสอนวิทยาศาสตร์และดาราศาสตร์ · ผ่าดูโครงสร้างภายในดาว · สารานุกรมอวกาศพร้อมเสียงอ่าน
  </div>
</div>

</body>
</html>
`;

async function renderCover() {
  console.log('Rendering 1280x720 Solar System 3D Cover...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });

  await page.setContent(htmlContent, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000); // Allow Google fonts to render

  // Ensure output directory exists
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });

  await page.screenshot({
    path: outputPath,
    type: 'png',
    clip: { x: 0, y: 0, width: 1280, height: 720 }
  });

  await browser.close();
  console.log(`✅ Cover successfully rendered to: ${outputPath}`);
}

renderCover().catch(err => {
  console.error('Failed to render cover:', err);
  process.exit(1);
});
