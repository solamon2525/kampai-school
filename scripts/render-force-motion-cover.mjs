import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outputPath = path.join(rootDir, 'public', 'games', 'science', 'force-motion-media-cover.png');

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
    background: radial-gradient(circle at 50% 40%, #1e3a8a 0%, #0f172a 60%, #020617 100%);
    position: relative;
    color: #fff;
  }

  /* Grid & Energy Rays */
  .grid-bg {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(56, 189, 248, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(56, 189, 248, 0.08) 1px, transparent 1px);
    background-size: 40px 40px;
  }

  .glow-cyan {
    position: absolute;
    top: -100px;
    left: 200px;
    width: 600px;
    height: 450px;
    background: radial-gradient(circle, rgba(14, 165, 233, 0.25) 0%, transparent 70%);
    filter: blur(50px);
  }
  .glow-amber {
    position: absolute;
    bottom: -80px;
    right: 200px;
    width: 550px;
    height: 400px;
    background: radial-gradient(circle, rgba(245, 158, 11, 0.22) 0%, transparent 70%);
    filter: blur(50px);
  }

  /* Main Container Centered in 60% Safe Zone */
  .content-wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 1050px;
    height: 420px;
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
    padding: 6px 20px;
    border-radius: 999px;
    background: rgba(14, 165, 233, 0.25);
    border: 1.5px solid rgba(56, 189, 248, 0.55);
    box-shadow: 0 0 18px rgba(56, 189, 248, 0.35);
    font-size: 15px;
    font-weight: 800;
    color: #7dd3fc;
    letter-spacing: 0.8px;
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
    font-size: 68px;
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -0.5px;
    background: linear-gradient(180deg, #ffffff 20%, #bae6fd 60%, #38bdf8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 6px 18px rgba(2, 132, 199, 0.65)) drop-shadow(0 2px 4px rgba(0,0,0,0.8));
    margin-bottom: 4px;
  }

  .title-th {
    font-size: 48px;
    font-weight: 900;
    color: #fde047;
    text-shadow: 0 0 20px rgba(245, 158, 11, 0.65), 0 4px 10px rgba(0,0,0,0.9);
    margin-bottom: 16px;
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
    gap: 7px;
    background: rgba(15, 23, 42, 0.88);
    border: 1.5px solid rgba(255, 255, 255, 0.22);
    padding: 8px 18px;
    border-radius: 999px;
    font-size: 16px;
    font-weight: 700;
    color: #f1f5f9;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.45);
    backdrop-filter: blur(8px);
  }
  .badge-chip.gold {
    border-color: rgba(251, 191, 36, 0.6);
    background: rgba(245, 158, 11, 0.2);
    color: #fef08a;
  }
  .badge-chip.cyan {
    border-color: rgba(56, 189, 248, 0.6);
    background: rgba(14, 165, 233, 0.2);
    color: #bae6fd;
  }
  .badge-chip.green {
    border-color: rgba(34, 197, 94, 0.6);
    background: rgba(34, 197, 94, 0.2);
    color: #bbf7d0;
  }

  .subtitle {
    font-size: 18px;
    font-weight: 600;
    color: #cbd5e1;
    background: rgba(15, 23, 42, 0.65);
    padding: 5px 22px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  /* Corner Badges */
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
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #0284c7, #38bdf8);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    box-shadow: 0 4px 12px rgba(2, 132, 199, 0.4);
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
    color: #fde047;
    background: rgba(245, 158, 11, 0.2);
    border: 1px solid rgba(251, 191, 36, 0.45);
    padding: 6px 16px;
    border-radius: 999px;
    z-index: 30;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
  }

  /* Left Illustration: Chibi Kid Pulling with Spring Scale */
  .kid-pull {
    position: absolute;
    left: 45px;
    bottom: 90px;
    width: 250px;
    height: 280px;
    z-index: 15;
  }

  /* Right Illustration: Chibi Kid Pushing Block with Force Vectors */
  .kid-push {
    position: absolute;
    right: 45px;
    bottom: 85px;
    width: 250px;
    height: 280px;
    z-index: 15;
  }
</style>
</head>
<body>

<div class="grid-bg"></div>
<div class="glow-cyan"></div>
<div class="glow-amber"></div>

<!-- Top Corner Badges -->
<div class="corner-badge">
  <div class="corner-logo">🧲</div>
  <div class="corner-text">KAMPAI SCIENCE · โรงเรียนบ้านคำไผ่</div>
</div>

<div class="corner-curriculum">
  ⭐ ว 2.2 ป.5/1–5 · วิทยาศาสตร์กายภาพ
</div>

<!-- Center Safe Zone Title & Badges -->
<div class="content-wrapper">
  <div class="top-pill">
    <span class="dot"></span>
    INTERACTIVE PHYSICS & FORCE LAB
  </div>
  <h1 class="title-en">Force & Motion</h1>
  <h2 class="title-th">แรงและการเคลื่อนที่ ป.5</h2>
  
  <div class="badges-row">
    <div class="badge-chip cyan">
      <span>🏹</span> แรงผลัก & แรงดึง
    </div>
    <div class="badge-chip gold">
      <span>⚖️</span> แรงลัพธ์ (Net Force)
    </div>
    <div class="badge-chip green">
      <span>🛹</span> แรงเสียดทาน (Friction)
    </div>
  </div>

  <div class="subtitle">
    สังเกตผลของแรง · การรวมแรงในแนวระนาบ · เครื่องชั่งสปริงนิวตัน · แผ่นแรงเสียดทานจำลอง
  </div>
</div>

<!-- Left SVG: Chibi Kid Pulling Tug Cart + Spring Scale -->
<svg class="kid-pull" viewBox="0 0 250 280">
  <defs>
    <linearGradient id="cartGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
  </defs>

  <!-- Ground Line -->
  <line x1="10" y1="260" x2="240" y2="260" stroke="#64748b" stroke-width="4" stroke-linecap="round"/>

  <!-- Science Cart with Weights -->
  <rect x="25" y="180" width="75" height="55" rx="8" fill="url(#cartGrad)" stroke="#bae6fd" stroke-width="3"/>
  <circle cx="45" cy="245" r="14" fill="#334155" stroke="#94a3b8" stroke-width="3"/>
  <circle cx="80" cy="245" r="14" fill="#334155" stroke="#94a3b8" stroke-width="3"/>
  <!-- Weight block on cart -->
  <rect x="42" y="145" width="40" height="35" rx="4" fill="#f59e0b" stroke="#fde68a" stroke-width="2"/>
  <text x="62" y="168" font-size="14" font-weight="800" fill="#fff" text-anchor="middle">5 kg</text>

  <!-- Spring Scale (เครื่องชั่งสปริง) -->
  <g transform="translate(100, 195)">
    <!-- Scale body -->
    <rect x="0" y="-8" width="45" height="18" rx="4" fill="#f8fafc" stroke="#64748b" stroke-width="2"/>
    <line x1="10" y1="0" x2="35" y2="0" stroke="#ef4444" stroke-width="3"/>
    <text x="22" y="5" font-size="10" font-weight="800" fill="#0f172a" text-anchor="middle">20 N</text>
    <!-- Hook -->
    <path d="M-5 1 Q0 1 0 0" stroke="#cbd5e1" stroke-width="3" fill="none"/>
    <line x1="45" y1="0" x2="65" y2="0" stroke="#fde047" stroke-width="3.5" stroke-dasharray="3 2"/>
  </g>

  <!-- Force Vector Arrow Left -->
  <g transform="translate(105, 140)">
    <path d="M40 0 L0 0 M10 -6 L0 0 L10 6" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <text x="20" y="-8" font-size="13" font-weight="800" fill="#38bdf8" text-anchor="middle">แรงดึง ➔</text>
  </g>

  <!-- Chibi Kid Pulling (Girl) -->
  <g transform="translate(165, 120)">
    <!-- Ponytail -->
    <circle cx="28" cy="20" r="14" fill="#92400e"/>
    <path d="M35 15 Q55 20 45 40 Q35 30 35 15" fill="#92400e"/>

    <!-- Head -->
    <circle cx="20" cy="30" r="24" fill="#fde047" stroke="#ca8a04" stroke-width="2"/>
    <!-- Face -->
    <ellipse cx="14" cy="28" rx="3.5" ry="5" fill="#1e293b"/>
    <circle cx="15" cy="26" r="1.2" fill="#fff"/>
    <ellipse cx="26" cy="28" rx="3.5" ry="5" fill="#1e293b"/>
    <circle cx="27" cy="26" r="1.2" fill="#fff"/>
    <!-- Smile -->
    <path d="M16 38 Q20 43 24 38" stroke="#b45309" stroke-width="2" fill="none" stroke-linecap="round"/>
    <!-- Blush -->
    <circle cx="9" cy="34" r="4" fill="#f43f5e" opacity="0.5"/>
    <circle cx="31" cy="34" r="4" fill="#f43f5e" opacity="0.5"/>

    <!-- Body (Shirt) -->
    <path d="M8 55 L32 55 L38 95 L2 95 Z" fill="#ec4899" rx="6"/>
    <!-- Arms holding rope -->
    <path d="M12 60 L-10 75" stroke="#fde047" stroke-width="9" stroke-linecap="round"/>

    <!-- Legs leaning back in effort -->
    <path d="M10 95 L-5 138" stroke="#3b82f6" stroke-width="12" stroke-linecap="round"/>
    <ellipse cx="-8" cy="140" rx="9" ry="6" fill="#ef4444"/>
    <path d="M28 95 L22 138" stroke="#3b82f6" stroke-width="12" stroke-linecap="round"/>
    <ellipse cx="22" cy="140" rx="9" ry="6" fill="#ef4444"/>
  </g>
</svg>

<!-- Right SVG: Chibi Kid Pushing Block + Friction Arrow -->
<svg class="kid-push" viewBox="0 0 250 280">
  <defs>
    <linearGradient id="boxGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f59e0b"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
  </defs>

  <!-- Ground with Rough Texture -->
  <line x1="10" y1="260" x2="240" y2="260" stroke="#64748b" stroke-width="4" stroke-linecap="round"/>
  <!-- Friction spikes under box -->
  <path d="M120 260 L125 264 L130 260 L135 264 L140 260 L145 264 L150 260 L155 264 L160 260 L165 264 L170 260 L175 264 L180 260 L185 264 L190 260" stroke="#f43f5e" stroke-width="2" fill="none"/>

  <!-- Wooden Physics Box -->
  <rect x="120" y="160" width="85" height="85" rx="8" fill="url(#boxGrad)" stroke="#fde68a" stroke-width="3"/>
  <line x1="120" y1="160" x2="205" y2="245" stroke="#78350f" stroke-width="2.5"/>
  <line x1="120" y1="245" x2="205" y2="160" stroke="#78350f" stroke-width="2.5"/>
  <rect x="145" y="190" width="35" height="25" rx="4" fill="#0f172a" opacity="0.8"/>
  <text x="162" y="208" font-size="13" font-weight="800" fill="#fbbf24" text-anchor="middle">F = ma</text>

  <!-- Vector Push Arrow Above Box -->
  <g transform="translate(130, 125)">
    <path d="M0 0 L60 0 M50 -6 L60 0 L50 6" stroke="#22c55e" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <text x="30" y="-8" font-size="13" font-weight="800" fill="#4ade80" text-anchor="middle">➔ แรงผลัก (30 N)</text>
  </g>

  <!-- Friction Arrow in Opposite Direction -->
  <g transform="translate(130, 275)">
    <path d="M50 0 L0 0 M10 -5 L0 0 L10 5" stroke="#f43f5e" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    <text x="30" y="14" font-size="11" font-weight="800" fill="#fb7185" text-anchor="middle">⬅ แรงเสียดทาน (10 N)</text>
  </g>

  <!-- Chibi Kid Pushing (Boy) -->
  <g transform="translate(45, 125)">
    <!-- Hair -->
    <path d="M12 25 C12 8 40 8 40 25 C45 22 48 30 42 38 C35 32 30 35 25 32 C18 35 15 30 12 25 Z" fill="#1e293b"/>

    <!-- Head -->
    <circle cx="28" cy="32" r="22" fill="#fde047" stroke="#ca8a04" stroke-width="2"/>
    <!-- Face looking forward right -->
    <ellipse cx="32" cy="30" rx="3.5" ry="5" fill="#1e293b"/>
    <circle cx="33" cy="28" r="1.2" fill="#fff"/>
    <ellipse cx="42" cy="30" rx="3.5" ry="5" fill="#1e293b"/>
    <circle cx="43" cy="28" r="1.2" fill="#fff"/>
    <!-- Concentrated Smile -->
    <path d="M34 40 Q38 43 42 39" stroke="#b45309" stroke-width="2" fill="none" stroke-linecap="round"/>
    <!-- Sweat drop -->
    <path d="M48 18 Q52 24 50 26 Q48 28 46 26 Z" fill="#38bdf8"/>

    <!-- Body (Shirt) -->
    <path d="M15 54 L40 54 L46 95 L10 95 Z" fill="#3b82f6" rx="6"/>
    <!-- Arms pushing box firmly -->
    <path d="M28 62 L75 68" stroke="#fde047" stroke-width="10" stroke-linecap="round"/>

    <!-- Legs pushing forward -->
    <path d="M15 95 L-2 135" stroke="#1e293b" stroke-width="12" stroke-linecap="round"/>
    <ellipse cx="-4" cy="138" rx="9" ry="6" fill="#10b981"/>
    <path d="M36 95 L46 135" stroke="#1e293b" stroke-width="12" stroke-linecap="round"/>
    <ellipse cx="50" cy="138" rx="9" ry="6" fill="#10b981"/>
  </g>
</svg>

</body>
</html>
`;

async function renderCover() {
  console.log('Rendering 1280x720 Force & Motion Cover...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });

  await page.setContent(htmlContent, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

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
