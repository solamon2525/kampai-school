import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const outDir = path.join(rootDir, 'public', 'games', 'english');

const COVERS = [
  {
    filename: 'sight-words-media-cover.png',
    titleEn: 'Sight Words P.4',
    titleTh: 'คำอ่านจำ ป.4',
    subTitle: 'Fry & Dolch Grade 4 Words · คำศัพท์ความถี่สูง · สำเนียง US/UK · แบบทดสอบและประโยคบริบท',
    curriculum: '⭐ ต 1.1 ป.4/2 · ภาษาต่างประเทศ (ภาษาอังกฤษ)',
    pill: 'INTERACTIVE ENGLISH SIGHT WORDS STUDIO',
    bgGradient: 'radial-gradient(circle at 50% 40%, #0f766e 0%, #115e59 50%, #042f2e 100%)',
    primaryColor: '#2dd4bf',
    accentColor: '#fde047',
    glowColor: 'rgba(45, 212, 191, 0.25)',
    badges: [
      { text: '👁️ 40+ คำศัพท์ ป.4', color: 'cyan' },
      { text: '🔊 เสียงอ่าน US & UK', color: 'gold' },
      { text: '📚 ประโยคในชีวิตประจำวัน', color: 'green' }
    ],
    svgArt: `
      <!-- Left: Chibi Girl with Floating Word Book -->
      <g transform="translate(70, 110)">
        <!-- Book Glow -->
        <ellipse cx="60" cy="90" rx="45" ry="15" fill="#2dd4bf" opacity="0.3" filter="blur(8px)"/>
        <!-- Book Base -->
        <path d="M20 80 Q60 65 100 80 L95 105 Q60 90 25 105 Z" fill="#0d9488" stroke="#5eead4" stroke-width="2"/>
        <path d="M20 78 Q60 63 100 78" stroke="#f0fdfa" stroke-width="4" fill="none"/>
        <!-- Floating words -->
        <rect x="15" y="15" width="80" height="28" rx="14" fill="#134e4a" stroke="#2dd4bf" stroke-width="1.5"/>
        <text x="55" y="34" font-size="14" font-weight="900" fill="#fde047" text-anchor="middle">because</text>
        <rect x="70" y="-15" width="85" height="28" rx="14" fill="#134e4a" stroke="#5eead4" stroke-width="1.5"/>
        <text x="112" y="4" font-size="13" font-weight="900" fill="#a7f3d0" text-anchor="middle">important</text>
        <!-- Chibi Girl -->
        <circle cx="160" cy="50" r="28" fill="#fde047" stroke="#ca8a04" stroke-width="2"/>
        <!-- Eyes -->
        <ellipse cx="152" cy="48" rx="4" ry="6" fill="#0f172a"/>
        <circle cx="153" cy="46" r="1.5" fill="#fff"/>
        <ellipse cx="168" cy="48" rx="4" ry="6" fill="#0f172a"/>
        <circle cx="169" cy="46" r="1.5" fill="#fff"/>
        <path d="M155 60 Q160 64 165 60" stroke="#b45309" stroke-width="2" fill="none"/>
        <!-- Hair ponytail -->
        <path d="M136 40 C136 20 184 20 184 40 C190 40 192 55 186 60 C175 45 145 45 136 40 Z" fill="#78350f"/>
        <path d="M184 35 Q205 30 200 55 Q188 50 184 35 Z" fill="#78350f"/>
        <!-- Dress -->
        <path d="M145 78 L175 78 L185 125 L135 125 Z" fill="#ec4899" rx="6"/>
      </g>
      <!-- Right: Sparkling Word Cloud -->
      <g transform="translate(1000, 120)">
        <rect x="20" y="20" width="80" height="30" rx="15" fill="#134e4a" stroke="#38bdf8" stroke-width="2"/>
        <text x="60" y="40" font-size="14" font-weight="800" fill="#bae6fd" text-anchor="middle">through</text>
        <rect x="-10" y="75" width="85" height="30" rx="15" fill="#134e4a" stroke="#fbbf24" stroke-width="2"/>
        <text x="32" y="95" font-size="14" font-weight="800" fill="#fef08a" text-anchor="middle">between</text>
        <rect x="60" y="130" width="90" height="30" rx="15" fill="#134e4a" stroke="#34d399" stroke-width="2"/>
        <text x="105" y="150" font-size="14" font-weight="800" fill="#bbf7d0" text-anchor="middle">suddenly</text>
      </g>
    `
  },
  {
    filename: 'sight-words-p123-media-cover.png',
    titleEn: 'Sight Words P.1–P.3',
    titleTh: 'คำอ่านจำ ป.1–ป.3',
    subTitle: 'คำศัพท์พื้นฐานเด็กเล็ก · เชื่อมโยง Phonics · ออกเสียงคำและประโยค · สีสันสดใสน่ารัก',
    curriculum: '⭐ ต 1.1 ป.1/2, ป.2/2, ป.3/2 · ภาษาต่างประเทศ',
    pill: 'EARLY PRIMARY SIGHT WORDS & PHONICS',
    bgGradient: 'radial-gradient(circle at 50% 40%, #1e3a8a 0%, #1e1b4b 60%, #030712 100%)',
    primaryColor: '#38bdf8',
    accentColor: '#f472b6',
    glowColor: 'rgba(56, 189, 248, 0.25)',
    badges: [
      { text: '🌱 ระดับ ป.1, ป.2, ป.3', color: 'green' },
      { text: '🎨 บัตรคำ ABC สีสดใส', color: 'gold' },
      { text: '🎤 ออกเสียงคำ & สะกด', color: 'cyan' }
    ],
    svgArt: `
      <!-- Left: Giant Alphabet Toy Blocks -->
      <g transform="translate(60, 110)">
        <!-- Block 1 -->
        <rect x="30" y="80" width="65" height="65" rx="12" fill="#ec4899" stroke="#fbcfe8" stroke-width="3"/>
        <text x="62" y="126" font-size="36" font-weight="900" fill="#fff" text-anchor="middle">THE</text>
        <!-- Block 2 -->
        <rect x="90" y="40" width="65" height="65" rx="12" fill="#3b82f6" stroke="#bfdbfe" stroke-width="3"/>
        <text x="122" y="86" font-size="34" font-weight="900" fill="#fff" text-anchor="middle">SEE</text>
        <!-- Block 3 -->
        <rect x="40" y="10" width="55" height="55" rx="10" fill="#f59e0b" stroke="#fef3c7" stroke-width="3"/>
        <text x="67" y="49" font-size="28" font-weight="900" fill="#fff" text-anchor="middle">A</text>
      </g>
      <!-- Right: Chibi Boy holding Star Pencil -->
      <g transform="translate(1040, 120)">
        <circle cx="50" cy="45" r="26" fill="#fde047" stroke="#ca8a04" stroke-width="2"/>
        <!-- Eyes -->
        <circle cx="42" cy="43" r="3.5" fill="#0f172a"/>
        <circle cx="58" cy="43" r="3.5" fill="#0f172a"/>
        <path d="M46 55 Q50 58 54 55" stroke="#b45309" stroke-width="2" fill="none"/>
        <!-- Spiky Boy Hair -->
        <path d="M28 35 C28 15 72 15 72 35 C78 30 75 42 70 45 C60 25 35 25 28 35 Z" fill="#1e293b"/>
        <!-- Shirt -->
        <path d="M35 71 L65 71 L72 120 L28 120 Z" fill="#10b981" rx="6"/>
        <!-- Star Pencil -->
        <line x1="20" y1="50" x2="-25" y2="10" stroke="#f59e0b" stroke-width="8" stroke-linecap="round"/>
        <polygon points="-25,0 -20,10 -30,10" fill="#ef4444"/>
      </g>
    `
  },
  {
    filename: 'grammar-vocab-media-cover.png',
    titleEn: 'Grammar & Vocab',
    titleTh: 'ไวยากรณ์และคำศัพท์ ป.4–ป.5',
    subTitle: 'Verb to Be · Articles (a/an/the) · Do/Does · Pronouns · กฎเข้าใจง่ายพร้อมตัวอย่างประโยค',
    curriculum: '⭐ ต 1.1 ป.4–5, ต 2.2 ป.4/1 · ภาษาอังกฤษ',
    pill: 'INTERACTIVE ENGLISH GRAMMAR & SYNTAX STUDIO',
    bgGradient: 'radial-gradient(circle at 50% 40%, #312e81 0%, #1e1b4b 60%, #030712 100%)',
    primaryColor: '#818cf8',
    accentColor: '#fde047',
    glowColor: 'rgba(129, 140, 248, 0.25)',
    badges: [
      { text: '🧩 6 หมวดไวยากรณ์หลัก', color: 'cyan' },
      { text: '✏️ สูตรและกฎเข้าใจง่าย', color: 'gold' },
      { text: '🎯 ฝึก MCQ เฉลยละเอียด', color: 'green' }
    ],
    svgArt: `
      <!-- Left: Sentence Structure Formula Cards -->
      <g transform="translate(60, 110)">
        <rect x="20" y="30" width="130" height="40" rx="8" fill="#1e1b4b" stroke="#818cf8" stroke-width="2"/>
        <text x="85" y="55" font-size="14" font-weight="900" fill="#a5b4fc" text-anchor="middle">Subject + Verb to Be</text>
        <rect x="35" y="80" width="120" height="40" rx="8" fill="#1e1b4b" stroke="#34d399" stroke-width="2"/>
        <text x="95" y="105" font-size="14" font-weight="900" fill="#6ee7b7" text-anchor="middle">He / She / It ➔ is</text>
        <rect x="10" y="130" width="125" height="40" rx="8" fill="#1e1b4b" stroke="#fbbf24" stroke-width="2"/>
        <text x="72" y="155" font-size="14" font-weight="900" fill="#fde047" text-anchor="middle">a cat · an apple</text>
      </g>
      <!-- Right: Chibi Teacher with Pointer -->
      <g transform="translate(1040, 110)">
        <circle cx="50" cy="45" r="26" fill="#fde047" stroke="#ca8a04" stroke-width="2"/>
        <!-- Glasses -->
        <circle cx="42" cy="43" r="8" fill="none" stroke="#1e293b" stroke-width="2.5"/>
        <circle cx="58" cy="43" r="8" fill="none" stroke="#1e293b" stroke-width="2.5"/>
        <line x1="50" y1="43" x2="50" y2="43" stroke="#1e293b" stroke-width="2"/>
        <circle cx="42" cy="43" r="2.5" fill="#0f172a"/>
        <circle cx="58" cy="43" r="2.5" fill="#0f172a"/>
        <path d="M46 56 Q50 59 54 56" stroke="#b45309" stroke-width="2" fill="none"/>
        <!-- Suit -->
        <path d="M35 71 L65 71 L72 125 L28 125 Z" fill="#4338ca" rx="6"/>
        <polygon points="50,71 46,95 54,95" fill="#ef4444"/>
        <!-- Pointer Stick -->
        <line x1="30" y1="85" x2="-30" y2="40" stroke="#fde047" stroke-width="5" stroke-linecap="round"/>
        <circle cx="-32" cy="38" r="5" fill="#fbbf24"/>
      </g>
    `
  },
  {
    filename: 'past-tense-mini-media-cover.png',
    titleEn: 'Past Tense Mini',
    titleTh: 'อดีตกาลกริยา ป.4–ป.6',
    subTitle: 'Past Simple Tense · กริยาปกติ -ed vs กริยาอปกติ · was/were · คำบอกเวลา yesterday, last night',
    curriculum: '⭐ ต 1.1 ป.5–6, ต 1.2 ป.6/1 · ภาษาอังกฤษ',
    pill: 'INTERACTIVE PAST TENSE & TIME MACHINE',
    bgGradient: 'radial-gradient(circle at 50% 40%, #1e3a8a 0%, #0f172a 60%, #020617 100%)',
    primaryColor: '#60a5fa',
    accentColor: '#f59e0b',
    glowColor: 'rgba(96, 165, 250, 0.25)',
    badges: [
      { text: '⏳ ไทม์ไลน์อดีตกาล', color: 'gold' },
      { text: '📖 กริยา 3 ช่อง & -ed', color: 'cyan' },
      { text: '🕵️ คำบอกเวลา (yesterday)', color: 'green' }
    ],
    svgArt: `
      <!-- Left: Golden Time Machine Clock & Timeline -->
      <g transform="translate(60, 110)">
        <circle cx="80" cy="80" r="55" fill="#0f172a" stroke="#f59e0b" stroke-width="4"/>
        <circle cx="80" cy="80" r="48" fill="none" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="4 3"/>
        <!-- Clock hands pointing back -->
        <line x1="80" y1="80" x2="60" y2="55" stroke="#fde047" stroke-width="4" stroke-linecap="round"/>
        <line x1="80" y1="80" x2="105" y2="80" stroke="#fde047" stroke-width="3" stroke-linecap="round"/>
        <circle cx="80" cy="80" r="5" fill="#f59e0b"/>
        <!-- Past arrow badge -->
        <rect x="25" y="145" width="110" height="28" rx="6" fill="#1e3a8a" stroke="#60a5fa" stroke-width="2"/>
        <text x="80" y="164" font-size="12" font-weight="900" fill="#93c5fd" text-anchor="middle">PAST ➔ NOW</text>
      </g>
      <!-- Right: Conjugation Cards (go -> went, eat -> ate) -->
      <g transform="translate(1000, 110)">
        <rect x="20" y="20" width="115" height="40" rx="8" fill="#0f172a" stroke="#60a5fa" stroke-width="2"/>
        <text x="77" y="45" font-size="14" font-weight="900" fill="#fff" text-anchor="middle">go ➔ <tspan fill="#fde047">went</tspan></text>
        <rect x="35" y="75" width="115" height="40" rx="8" fill="#0f172a" stroke="#34d399" stroke-width="2"/>
        <text x="92" y="100" font-size="14" font-weight="900" fill="#fff" text-anchor="middle">eat ➔ <tspan fill="#86efac">ate</tspan></text>
        <rect x="15" y="130" width="125" height="40" rx="8" fill="#0f172a" stroke="#f472b6" stroke-width="2"/>
        <text x="77" y="155" font-size="14" font-weight="900" fill="#fff" text-anchor="middle">play ➔ <tspan fill="#fbcfe8">played</tspan></text>
      </g>
    `
  }
];

function buildHtml(cover) {
  return `
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
    font-family: 'Sarabun', sans-serif;
    background: ${cover.bgGradient};
    position: relative;
    color: #fff;
  }
  .grid-bg {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .glow {
    position: absolute;
    top: -80px;
    left: 50%;
    transform: translateX(-50%);
    width: 800px;
    height: 450px;
    background: radial-gradient(circle, ${cover.glowColor} 0%, transparent 70%);
    filter: blur(50px);
  }

  /* Safe zone container (60% vertical) */
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
    background: rgba(255, 255, 255, 0.12);
    border: 1.5px solid ${cover.primaryColor};
    font-size: 15px;
    font-weight: 800;
    color: ${cover.primaryColor};
    letter-spacing: 0.8px;
    margin-bottom: 12px;
  }
  .top-pill span.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${cover.primaryColor};
    box-shadow: 0 0 8px ${cover.primaryColor};
  }

  .title-en {
    font-size: 68px;
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -0.5px;
    background: linear-gradient(180deg, #ffffff 20%, #e2e8f0 60%, ${cover.primaryColor} 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 6px 18px rgba(0,0,0,0.7));
    margin-bottom: 4px;
  }

  .title-th {
    font-size: 46px;
    font-weight: 900;
    color: ${cover.accentColor};
    text-shadow: 0 0 20px rgba(0,0,0,0.6), 0 4px 10px rgba(0,0,0,0.9);
    margin-bottom: 16px;
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
  }
  .badge-chip.gold { border-color: rgba(251, 191, 36, 0.6); color: #fef08a; }
  .badge-chip.cyan { border-color: rgba(56, 189, 248, 0.6); color: #bae6fd; }
  .badge-chip.green { border-color: rgba(34, 197, 94, 0.6); color: #bbf7d0; }

  .subtitle {
    font-size: 18px;
    font-weight: 600;
    color: #e2e8f0;
    background: rgba(15, 23, 42, 0.65);
    padding: 6px 24px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.12);
  }

  /* Top corner badges */
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
  }
  .corner-text {
    font-size: 16px;
    font-weight: 800;
    color: #e2e8f0;
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
  }
</style>
</head>
<body>
  <div class="grid-bg"></div>
  <div class="glow"></div>

  <div class="corner-badge">
    <div class="corner-logo">🇬🇧</div>
    <div class="corner-text">KAMPAI ENGLISH · โรงเรียนบ้านคำไผ่</div>
  </div>
  <div class="corner-curriculum">${cover.curriculum}</div>

  <div class="content-wrapper">
    <div class="top-pill"><span class="dot"></span> ${cover.pill}</div>
    <h1 class="title-en">${cover.titleEn}</h1>
    <h2 class="title-th">${cover.titleTh}</h2>
    <div class="badges-row">
      ${cover.badges.map(b => `<div class="badge-chip ${b.color}">${b.text}</div>`).join('')}
    </div>
    <div class="subtitle">${cover.subTitle}</div>
  </div>

  <svg style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none; z-index:15;">
    ${cover.svgArt}
  </svg>
</body>
</html>
  `;
}

async function renderAll() {
  console.log('Rendering 4 English 16:9 Cover PNGs (1280x720)...');
  const browser = await chromium.launch({ headless: true });
  fs.mkdirSync(outDir, { recursive: true });

  for (const c of COVERS) {
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1
    });

    const html = buildHtml(c);
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const targetPath = path.join(outDir, c.filename);
    await page.screenshot({
      path: targetPath,
      type: 'png',
      clip: { x: 0, y: 0, width: 1280, height: 720 }
    });
    console.log(`✅ Rendered: ${c.filename} (1280x720)`);
    await page.close();
  }

  await browser.close();
  console.log('🎉 All 4 covers successfully rendered!');
}

renderAll().catch(err => {
  console.error('Render error:', err);
  process.exit(1);
});
