import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const HUB_DIR = path.resolve(ROOT, 'public/games/thai/thai-vocab-hub');
const OUTPUT_DIR = path.resolve(HUB_DIR, 'assets/idiom-visuals');
const IDIOMS_JSON_PATH = path.resolve(HUB_DIR, 'data/words/idioms.json');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Helper to build an SVG wrapper with consistent 16:9 ratio (800x450),
 * clean line art, soft shadow filters, header step pill, and bottom caption card.
 */
function createStoryboardSvg({
  stepNumber,
  totalSteps,
  phase,
  caption,
  themeColor = '#3b82f6',
  bgColor1 = '#eff6ff',
  bgColor2 = '#dbeafe',
  illustrationContent = ''
}) {
  const stepLabel = `ขั้นตอนที่ ${stepNumber}/${totalSteps} • ${phase}`;
  return `
<svg width="800" height="450" viewBox="0 0 800 450" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${bgColor1}" />
      <stop offset="100%" stop-color="${bgColor2}" />
    </linearGradient>
    <linearGradient id="pillGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${themeColor}" />
      <stop offset="100%" stop-color="#1e3a8a" />
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="130%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.15" />
    </filter>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="800" height="450" fill="url(#bgGrad)" />

  <!-- Scenic Ambient / Frame Border -->
  <rect x="12" y="12" width="776" height="426" rx="20" fill="none" stroke="${themeColor}" stroke-width="2" stroke-opacity="0.25" />

  <!-- Visual Storyboard Illustration Layer -->
  <g id="illustration">
    ${illustrationContent}
  </g>

  <!-- Step & Phase Header Pill (Top-Left) -->
  <g transform="translate(28, 24)" filter="url(#cardShadow)">
    <rect width="260" height="38" rx="19" fill="#ffffff" fill-opacity="0.95" stroke="${themeColor}" stroke-width="2" />
    <circle cx="20" cy="19" r="10" fill="${themeColor}" />
    <text x="20" y="23" font-family="'Sarabun', 'Segoe UI', Tahoma, sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">${stepNumber}</text>
    <text x="40" y="24" font-family="'Sarabun', 'Segoe UI', Tahoma, sans-serif" font-size="14" font-weight="bold" fill="#0f172a">${stepLabel}</text>
  </g>

  <!-- Bottom Narrative Caption Card -->
  <g transform="translate(28, 372)" filter="url(#cardShadow)">
    <rect width="744" height="54" rx="16" fill="#ffffff" fill-opacity="0.95" stroke="${themeColor}" stroke-width="1.5" stroke-opacity="0.6" />
    <circle cx="32" cy="27" r="14" fill="${bgColor2}" />
    <text x="32" y="32" font-family="'Segoe UI Emoji', 'Sarabun', sans-serif" font-size="16" text-anchor="middle">📖</text>
    <text x="58" y="32" font-family="'Sarabun', 'Segoe UI', Tahoma, sans-serif" font-size="15" font-weight="600" fill="#1e293b">${caption}</text>
  </g>
</svg>
`.trim();
}

/**
 * Definitions of the 10 pilot idioms, their panels, and SVG illustrations
 */
const PILOT_IDIOMS = [
  // 1. ดินพอกหางหมู
  {
    word: 'ดินพอกหางหมู',
    panels: [
      {
        filename: 'pig-tail-mud-1.webp',
        step: 1,
        total: 3,
        phase: 'จุดเริ่มต้น',
        alt: 'ลูกหมูนอนเล่นในโคลน มีโคลนติดหางนิดเดียวแต่ผัดวันไม่ยอมล้าง',
        caption: 'ลูกหมูนอนเล่นในโคลน มีโคลนติดหางนิดเดียวแต่ผัดวันไม่ยอมล้าง',
        themeColor: '#f97316',
        bgColor1: '#fff7ed',
        bgColor2: '#fed7aa',
        illustration: `
          <!-- Sky, Sun & Clouds -->
          <circle cx="680" cy="90" r="45" fill="#fde047" opacity="0.8" />
          <ellipse cx="200" cy="80" rx="60" ry="22" fill="#ffffff" opacity="0.85" />
          <ellipse cx="240" cy="75" rx="40" ry="25" fill="#ffffff" opacity="0.85" />

          <!-- Lush Hills -->
          <path d="M 0 320 Q 250 220 500 290 T 800 280 L 800 390 L 0 390 Z" fill="#86efac" />
          <path d="M 0 340 Q 300 280 600 330 T 800 320 L 800 390 L 0 390 Z" fill="#4ade80" />

          <!-- Mud Pool -->
          <ellipse cx="440" cy="310" rx="180" ry="55" fill="#92400e" opacity="0.85" />
          <ellipse cx="440" cy="310" rx="160" ry="45" fill="#78350f" opacity="0.9" />

          <!-- Happy Little Pink Piglet -->
          <g transform="translate(350, 210)">
            <!-- Body -->
            <ellipse cx="80" cy="70" rx="75" ry="55" fill="#f472b6" stroke="#db2777" stroke-width="3" />
            <ellipse cx="75" cy="75" rx="55" ry="38" fill="#fbcfe8" />
            <!-- Head -->
            <circle cx="140" cy="50" r="38" fill="#f472b6" stroke="#db2777" stroke-width="3" />
            <!-- Ears -->
            <polygon points="125,20 140,5 150,22" fill="#db2777" />
            <polygon points="160,22 170,8 178,25" fill="#db2777" />
            <!-- Eyes & Cheeks -->
            <ellipse cx="142" cy="44" rx="4" ry="6" fill="#1e293b" />
            <ellipse cx="162" cy="44" rx="4" ry="6" fill="#1e293b" />
            <circle cx="132" cy="54" r="7" fill="#f43f5e" opacity="0.5" />
            <circle cx="168" cy="54" r="7" fill="#f43f5e" opacity="0.5" />
            <!-- Snout -->
            <ellipse cx="155" cy="56" rx="14" ry="10" fill="#fbcfe8" stroke="#db2777" stroke-width="2" />
            <ellipse cx="151" cy="56" rx="2.5" ry="4" fill="#9d174d" />
            <ellipse cx="159" cy="56" rx="2.5" ry="4" fill="#9d174d" />
            <!-- Little Curly Tail with tiny mud spot -->
            <path d="M 10 65 Q -10 50 0 40 Q 10 30 -5 25" fill="none" stroke="#db2777" stroke-width="4" stroke-linecap="round" />
            <ellipse cx="-8" cy="23" rx="8" ry="6" fill="#78350f" />
            <text x="-25" y="15" font-family="'Sarabun', sans-serif" font-size="12" font-weight="bold" fill="#78350f">โคลนจิ๋ว 🤏</text>
            <!-- Sleeping / Smiling Thought Bubble -->
            <g transform="translate(60, -40)">
              <rect x="0" y="0" width="160" height="32" rx="12" fill="#ffffff" stroke="#f97316" stroke-width="2" />
              <text x="80" y="21" font-family="'Sarabun', sans-serif" font-size="12" font-weight="bold" fill="#c2410c" text-anchor="middle">ค่อยล้างพรุ่งนี้แล้วกัน~</text>
            </g>
          </g>
        `
      },
      {
        filename: 'pig-tail-mud-2.webp',
        step: 2,
        total: 3,
        phase: 'พอกพูน',
        alt: 'โคลนพอกสะสมจนกลายเป็นก้อนหินใหญ่ หนักจนหมูขยับตัวไม่ไหว',
        caption: 'โคลนพอกสะสมจนกลายเป็นก้อนหินใหญ่ หนักจนหมูขยับตัวไม่ไหว',
        themeColor: '#ea580c',
        bgColor1: '#fff1f2',
        bgColor2: '#fecdd3',
        illustration: `
          <!-- Gloomy Sky -->
          <path d="M 0 310 Q 300 240 600 300 T 800 290 L 800 390 L 0 390 Z" fill="#94a3b8" />
          <path d="M 0 335 Q 250 280 500 330 T 800 315 L 800 390 L 0 390 Z" fill="#64748b" />

          <!-- Struggling Piglet -->
          <g transform="translate(360, 200)">
            <!-- Body stretched forward -->
            <ellipse cx="120" cy="80" rx="75" ry="50" fill="#f472b6" stroke="#db2777" stroke-width="3" />
            <!-- Head looking tired and sweating -->
            <circle cx="185" cy="65" r="38" fill="#f472b6" stroke="#db2777" stroke-width="3" />
            <!-- Sweats -->
            <path d="M 215 35 Q 220 20 225 35 Z" fill="#38bdf8" />
            <path d="M 195 25 Q 200 15 205 25 Z" fill="#38bdf8" />
            <!-- Sad/Stressed Eyes -->
            <path d="M 175 60 Q 182 55 190 62" stroke="#1e293b" stroke-width="3" fill="none" />
            <path d="M 198 60 Q 205 55 212 62" stroke="#1e293b" stroke-width="3" fill="none" />
            <!-- Snout -->
            <ellipse cx="205" cy="74" rx="14" ry="10" fill="#fbcfe8" stroke="#db2777" stroke-width="2" />
            <!-- Giant Mud Boulder on Tail -->
            <g transform="translate(-80, 20)">
              <ellipse cx="60" cy="60" rx="75" ry="65" fill="#451a03" stroke="#78350f" stroke-width="5" />
              <ellipse cx="40" cy="40" rx="35" ry="25" fill="#78350f" opacity="0.6" />
              <ellipse cx="80" cy="75" rx="30" ry="20" fill="#292524" opacity="0.6" />
              <!-- Stress / weight lines -->
              <path d="M 30 135 L 90 135" stroke="#dc2626" stroke-width="4" stroke-dasharray="6,4" />
              <text x="60" y="65" font-family="'Sarabun', sans-serif" font-size="16" font-weight="bold" fill="#fef08a" text-anchor="middle">หนักมาก! 🪨</text>
            </g>
            <!-- Tail stretched tight -->
            <path d="M 45 80 L 15 80" stroke="#db2777" stroke-width="6" />
            <!-- Straining Front Legs -->
            <rect x="150" y="115" width="14" height="35" rx="7" fill="#db2777" />
            <rect x="180" y="115" width="14" height="35" rx="7" fill="#db2777" />
          </g>
          <text x="520" y="160" font-family="'Sarabun', sans-serif" font-size="18" font-weight="bold" fill="#b91c1c">"ขยับไม่ไหวแล้ว ช่วยด้วย!" 💦</text>
        `
      },
      {
        filename: 'pig-tail-mud-3.webp',
        step: 3,
        total: 3,
        phase: 'คติสอนใจ',
        alt: 'เด็กนักเรียนดองการบ้านจนกองท่วมโต๊ะ สะท้อนว่างานค้างยิ่งปล่อยยิ่งแก้ยาก',
        caption: 'เด็กนักเรียนดองการบ้านจนกองท่วมโต๊ะ สะท้อนว่างานค้างยิ่งปล่อยยิ่งแก้ยาก',
        themeColor: '#dc2626',
        bgColor1: '#fef2f2',
        bgColor2: '#fee2e2',
        illustration: `
          <!-- Classroom / Study Room Wall -->
          <rect x="50" y="60" width="700" height="290" rx="14" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
          <!-- Calendar on wall with overdue marks -->
          <g transform="translate(100, 85)">
            <rect width="90" height="70" rx="6" fill="#f8fafc" stroke="#ef4444" stroke-width="2" />
            <rect width="90" height="20" rx="6" fill="#ef4444" />
            <text x="45" y="15" font-family="'Sarabun', sans-serif" font-size="11" font-weight="bold" fill="#ffffff" text-anchor="middle">กำหนดส่ง ⚠️</text>
            <text x="45" y="48" font-family="'Sarabun', sans-serif" font-size="22" font-weight="bold" fill="#b91c1c" text-anchor="middle">ด่วน!</text>
          </g>

          <!-- Study Desk -->
          <rect x="120" y="270" width="560" height="80" rx="8" fill="#d97706" stroke="#92400e" stroke-width="3" />
          <rect x="140" y="340" width="25" height="40" fill="#78350f" />
          <rect x="635" y="340" width="25" height="40" fill="#78350f" />

          <!-- Overdue Homework Mountain (Left & Center) -->
          <g transform="translate(180, 100)">
            <rect x="0" y="130" width="140" height="35" rx="5" fill="#38bdf8" stroke="#0284c7" stroke-width="2" />
            <text x="70" y="152" font-family="'Sarabun', sans-serif" font-size="12" fill="#0c4a6e" text-anchor="middle">การบ้านคณิตศาสตร์</text>
            <rect x="10" y="90" width="130" height="35" rx="5" fill="#4ade80" stroke="#16a34a" stroke-width="2" />
            <text x="75" y="112" font-family="'Sarabun', sans-serif" font-size="12" fill="#064e3b" text-anchor="middle">รายงานภาษาไทย</text>
            <rect x="25" y="50" width="115" height="35" rx="5" fill="#f472b6" stroke="#db2777" stroke-width="2" />
            <text x="82" y="72" font-family="'Sarabun', sans-serif" font-size="12" fill="#831843" text-anchor="middle">สมุดวาดภาพ</text>
            <rect x="40" y="10" width="90" height="35" rx="5" fill="#facc15" stroke="#ca8a04" stroke-width="2" />
            <text x="85" y="32" font-family="'Sarabun', sans-serif" font-size="12" fill="#713f12" text-anchor="middle">ใบงานวิทย์</text>
          </g>

          <!-- Stressed Student (Right) -->
          <g transform="translate(480, 130)">
            <!-- Head & Hair -->
            <circle cx="60" cy="50" r="40" fill="#fed7aa" stroke="#ea580c" stroke-width="2" />
            <path d="M 20 45 Q 60 5 100 45 Z" fill="#1e293b" />
            <!-- Panicked Eyes & Sweat -->
            <ellipse cx="48" cy="52" rx="6" ry="8" fill="#1e293b" />
            <ellipse cx="72" cy="52" rx="6" ry="8" fill="#1e293b" />
            <ellipse cx="60" cy="72" rx="12" ry="8" fill="#dc2626" />
            <path d="M 95 30 Q 100 15 105 30 Z" fill="#0284c7" />
            <!-- Hands on Head -->
            <ellipse cx="18" cy="45" rx="10" ry="16" fill="#fed7aa" stroke="#ea580c" stroke-width="2" />
            <ellipse cx="102" cy="45" rx="10" ry="16" fill="#fed7aa" stroke="#ea580c" stroke-width="2" />
            <!-- Thought bubble: Pig tail comparison -->
            <g transform="translate(-20, -60)">
              <rect width="160" height="40" rx="10" fill="#fff7ed" stroke="#ea580c" stroke-width="2" />
              <text x="80" y="25" font-family="'Sarabun', sans-serif" font-size="12" font-weight="bold" fill="#9a3412" text-anchor="middle">กองเท่าดินพอกหางหมู! 🐷</text>
            </g>
          </g>
        `
      }
    ]
  },

  // 2. ขี่ช้างจับตั๊กแตน
  {
    word: 'ขี่ช้างจับตั๊กแตน',
    panels: [
      {
        filename: 'ride-elephant-catch-grasshopper-1.webp',
        step: 1,
        total: 3,
        phase: 'จุดเริ่มต้น',
        alt: 'ปีนขี่ช้างตัวใหญ่ เตรียมอุปกรณ์อลังการเพื่อไปจับตั๊กแตน',
        caption: 'ปีนขี่ช้างตัวใหญ่ เตรียมอุปกรณ์อลังการเพื่อไปจับตั๊กแตน',
        themeColor: '#059669',
        bgColor1: '#ecfdf5',
        bgColor2: '#a7f3d0',
        illustration: `
          <!-- Sunny Savannah Sky -->
          <circle cx="700" cy="80" r="45" fill="#fde047" opacity="0.8" />
          <path d="M 0 310 Q 300 250 600 300 T 800 290 L 800 390 L 0 390 Z" fill="#86efac" />
          <path d="M 0 335 Q 250 280 500 330 T 800 320 L 800 390 L 0 390 Z" fill="#22c55e" />

          <!-- Grand Chibi Elephant -->
          <g transform="translate(180, 110)">
            <!-- Huge Body -->
            <ellipse cx="180" cy="140" rx="120" ry="90" fill="#94a3b8" stroke="#475569" stroke-width="4" />
            <!-- Four Massive Legs -->
            <rect x="90" y="180" width="35" height="80" rx="12" fill="#64748b" />
            <rect x="140" y="190" width="35" height="70" rx="12" fill="#64748b" />
            <rect x="200" y="185" width="35" height="75" rx="12" fill="#64748b" />
            <rect x="250" y="180" width="35" height="80" rx="12" fill="#64748b" />
            <!-- Head & Huge Ear -->
            <circle cx="310" cy="110" r="60" fill="#94a3b8" stroke="#475569" stroke-width="4" />
            <ellipse cx="260" cy="110" rx="35" ry="48" fill="#cbd5e1" stroke="#475569" stroke-width="3" />
            <!-- Trunk -->
            <path d="M 350 120 Q 400 130 380 180 Q 370 200 390 205" fill="none" stroke="#64748b" stroke-width="18" stroke-linecap="round" />
            <!-- Tusk -->
            <path d="M 340 145 Q 380 155 375 130" fill="none" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" />
            <!-- Decorative Palanquin / Howdah on Back -->
            <rect x="130" y="20" width="90" height="45" rx="8" fill="#eab308" stroke="#a16207" stroke-width="3" />
            <!-- Hunter Riding Elephant with Giant Net & Binoculars -->
            <circle cx="175" cy="-5" r="22" fill="#fed7aa" stroke="#ea580c" stroke-width="2" />
            <!-- Hunting Safari Hat -->
            <ellipse cx="175" cy="-22" rx="28" ry="8" fill="#d97706" />
            <rect x="160" y="-35" width="30" height="15" rx="4" fill="#d97706" />
            <!-- Giant Net Pole -->
            <line x1="180" y1="0" x2="260" y2="-60" stroke="#78350f" stroke-width="4" />
            <ellipse cx="275" cy="-70" rx="25" ry="16" fill="none" stroke="#0284c7" stroke-width="3" stroke-dasharray="4,3" />
          </g>

          <!-- Tiny Grasshopper in the Grass -->
          <g transform="translate(680, 310)">
            <ellipse cx="20" cy="15" rx="12" ry="6" fill="#84cc16" stroke="#4d7c0f" stroke-width="2" />
            <line x1="15" y1="12" x2="5" y2="0" stroke="#4d7c0f" stroke-width="1.5" />
            <line x1="22" y1="12" x2="30" y2="0" stroke="#4d7c0f" stroke-width="1.5" />
            <text x="20" y="-10" font-family="'Sarabun', sans-serif" font-size="12" font-weight="bold" fill="#15803d" text-anchor="middle">ตั๊กแตนจิ๋ว 🦗</text>
          </g>
        `
      },
      {
        filename: 'ride-elephant-catch-grasshopper-2.webp',
        step: 2,
        total: 3,
        phase: 'ผลลัพธ์',
        alt: 'ช้างวิ่งเหนื่อยหอบ ต้นไม้หักพัง ได้ตั๊กแตนตัวจิ๋วตัวเดียว',
        caption: 'ช้างวิ่งเหนื่อยหอบ ต้นไม้หักพัง ได้ตั๊กแตนตัวจิ๋วตัวเดียว',
        themeColor: '#ca8a04',
        bgColor1: '#fefce8',
        bgColor2: '#fef08a',
        illustration: `
          <!-- Destroyed Forest & Dust Clouds -->
          <path d="M 0 310 Q 300 270 600 320 T 800 300 L 800 390 L 0 390 Z" fill="#bbf7d0" />
          <!-- Broken Fallen Trees -->
          <line x1="80" y1="330" x2="160" y2="290" stroke="#78350f" stroke-width="10" stroke-linecap="round" />
          <line x1="140" y1="300" x2="220" y2="330" stroke="#78350f" stroke-width="8" stroke-linecap="round" />
          <ellipse cx="120" cy="270" rx="25" ry="18" fill="#15803d" opacity="0.7" />
          <ellipse cx="200" cy="300" rx="30" ry="20" fill="#16a34a" opacity="0.7" />

          <!-- Exhausted Panting Elephant Sitting Down -->
          <g transform="translate(160, 150)">
            <ellipse cx="160" cy="110" rx="110" ry="70" fill="#94a3b8" stroke="#475569" stroke-width="4" />
            <!-- Sweat Drops -->
            <path d="M 270 50 Q 275 35 280 50 Z" fill="#38bdf8" />
            <path d="M 290 60 Q 295 45 300 60 Z" fill="#38bdf8" />
            <!-- Head Resting Low -->
            <circle cx="280" cy="110" r="50" fill="#94a3b8" stroke="#475569" stroke-width="4" />
            <!-- Swirly Dazed Eyes -->
            <circle cx="270" cy="95" r="8" fill="none" stroke="#1e293b" stroke-width="2" />
            <circle cx="295" cy="95" r="8" fill="none" stroke="#1e293b" stroke-width="2" />
            <!-- Tongue sticking out panting -->
            <ellipse cx="320" cy="135" rx="16" ry="10" fill="#f43f5e" />
          </g>

          <!-- Hunter holding tiny jar with one tiny grasshopper -->
          <g transform="translate(540, 110)">
            <circle cx="60" cy="60" r="32" fill="#fed7aa" stroke="#ea580c" stroke-width="2" />
            <!-- Dumbfounded Expression -->
            <line x1="48" y1="52" x2="58" y2="52" stroke="#1e293b" stroke-width="3" />
            <line x1="68" y1="52" x2="78" y2="52" stroke="#1e293b" stroke-width="3" />
            <ellipse cx="63" cy="74" rx="6" ry="4" fill="#1e293b" />
            <!-- Holding Glass Jar with 1 Grasshopper -->
            <rect x="35" y="110" width="50" height="70" rx="8" fill="#e0f2fe" stroke="#0284c7" stroke-width="3" opacity="0.9" />
            <ellipse cx="60" cy="148" rx="8" ry="4" fill="#84cc16" />
            <text x="60" y="210" font-family="'Sarabun', sans-serif" font-size="14" font-weight="bold" fill="#0369a1" text-anchor="middle">ได้ตั๊กแตน 1 ตัว...</text>
          </g>
        `
      },
      {
        filename: 'ride-elephant-catch-grasshopper-3.webp',
        step: 3,
        total: 3,
        phase: 'คติสอนใจ',
        alt: 'เปรียบเทียบกับการลงทุนมหาศาลเพื่อผลตอบแทนเพียงเล็กน้อย ไม่คุ้มค่า',
        caption: 'เปรียบเทียบกับการลงทุนมหาศาลเพื่อผลตอบแทนเพียงเล็กน้อย ไม่คุ้มค่า',
        themeColor: '#d97706',
        bgColor1: '#fffbeb',
        bgColor2: '#fef3c7',
        illustration: `
          <!-- Giant Comparison Scale (Balance Beam) -->
          <g transform="translate(400, 200)">
            <!-- Fulcrum Pillar -->
            <polygon points="-25,140 25,140 0,20" fill="#475569" stroke="#1e293b" stroke-width="3" />
            <circle cx="0" cy="20" r="14" fill="#f59e0b" stroke="#b45309" stroke-width="3" />

            <!-- Beam tilted heavily to left -->
            <line x1="-240" y1="80" x2="240" y2="-40" stroke="#1e293b" stroke-width="8" stroke-linecap="round" />

            <!-- Left Pan (Heavy Investment / Cost) -->
            <line x1="-240" y1="80" x2="-240" y2="130" stroke="#64748b" stroke-width="3" />
            <path d="M -300 130 Q -240 160 -180 130 Z" fill="#b45309" stroke="#78350f" stroke-width="3" />
            <!-- Mountain of Gold Coins & Elephant on Left Pan -->
            <circle cx="-240" cy="115" r="16" fill="#fbbf24" stroke="#d97706" stroke-width="2" />
            <circle cx="-260" cy="118" r="14" fill="#fbbf24" stroke="#d97706" stroke-width="2" />
            <circle cx="-220" cy="118" r="14" fill="#fbbf24" stroke="#d97706" stroke-width="2" />
            <text x="-240" y="85" font-family="'Sarabun', sans-serif" font-size="16" font-weight="bold" fill="#b45309" text-anchor="middle">🐘 ขี่ช้าง + ลงทุน 1,000,000 บาท</text>

            <!-- Right Pan (Tiny Return / Light) -->
            <line x1="240" y1="-40" x2="240" y2="10" stroke="#64748b" stroke-width="3" />
            <path d="M 180 10 Q 240 40 300 10 Z" fill="#0284c7" stroke="#0369a1" stroke-width="3" />
            <!-- One Single Tiny Grasshopper -->
            <ellipse cx="240" cy="0" rx="10" ry="5" fill="#84cc16" />
            <text x="240" y="-20" font-family="'Sarabun', sans-serif" font-size="15" font-weight="bold" fill="#0369a1" text-anchor="middle">🦗 ได้ผลตอบแทน 1 บาท</text>
          </g>

          <!-- Warning Tag "ไม่คุ้มค่า" -->
          <g transform="translate(320, 65)">
            <rect width="160" height="36" rx="18" fill="#ef4444" />
            <text x="80" y="24" font-family="'Sarabun', sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">⚠️ ไม่คุ้มค่า!</text>
          </g>
        `
      }
    ]
  },

  // 3. น้ำขึ้นให้รีบตัก
  {
    word: 'น้ำขึ้นให้รีบตัก',
    panels: [
      {
        filename: 'water-rise-fetch-1.webp',
        step: 1,
        total: 3,
        phase: 'จุดเริ่มต้น',
        alt: 'น้ำในแม่น้ำขึ้นเต็มตลิ่งใสสะอาด คนขยันรีบนำตุ่มและถังมารองตักเก็บ',
        caption: 'น้ำในแม่น้ำขึ้นเต็มตลิ่งใสสะอาด คนขยันรีบนำตุ่มและถังมารองตักเก็บ',
        themeColor: '#0284c7',
        bgColor1: '#f0f9ff',
        bgColor2: '#bae6fd',
        illustration: `
          <!-- Morning Sky & Sparkling Sun -->
          <circle cx="700" cy="80" r="45" fill="#fde047" opacity="0.85" />
          <!-- Flowing Pure Blue River High Water Level -->
          <rect x="0" y="230" width="800" height="150" fill="#0ea5e9" />
          <path d="M 0 230 Q 200 205 400 230 T 800 225 L 800 380 L 0 380 Z" fill="#38bdf8" />
          <path d="M 0 255 Q 250 230 500 255 T 800 250 L 800 380 L 0 380 Z" fill="#0284c7" />

          <!-- Lush Grassy River Bank (Left Side) -->
          <path d="M 0 170 Q 220 180 320 280 L 0 380 Z" fill="#4ade80" />
          <path d="M 0 200 Q 180 200 280 310 L 0 380 Z" fill="#22c55e" />

          <!-- Diligent Villager Fetching Fresh Water -->
          <g transform="translate(190, 130)">
            <!-- Clay Water Jar (ตุ่มน้ำดินเผา) -->
            <ellipse cx="20" cy="140" rx="36" ry="44" fill="#c2410c" stroke="#7c2d12" stroke-width="3" />
            <ellipse cx="20" cy="100" rx="22" ry="10" fill="#38bdf8" stroke="#7c2d12" stroke-width="2" />
            <text x="20" y="145" font-family="'Sarabun', sans-serif" font-size="12" font-weight="bold" fill="#ffedd5" text-anchor="middle">ตุ่มน้ำ</text>

            <!-- Cheerful Person with Wooden Bucket -->
            <circle cx="95" cy="50" r="26" fill="#fed7aa" stroke="#ea580c" stroke-width="2" />
            <!-- Straw Hat (หมวกงอบ) -->
            <polygon points="55,42 95,15 135,42" fill="#d97706" stroke="#92400e" stroke-width="2" />
            <!-- Smiling Eyes -->
            <path d="M 86 50 Q 92 56 98 50" stroke="#1e293b" stroke-width="2" fill="none" />
            <path d="M 104 50 Q 110 56 116 50" stroke="#1e293b" stroke-width="2" fill="none" />
            <!-- Body -->
            <rect x="75" y="76" width="40" height="50" rx="8" fill="#0284c7" />
            <!-- Wooden Bucket Dipping into High Water -->
            <line x1="110" y1="95" x2="160" y2="135" stroke="#78350f" stroke-width="4" />
            <polygon points="145,130 180,130 175,165 150,165" fill="#b45309" stroke="#78350f" stroke-width="2" />
            <ellipse cx="162" cy="130" rx="16" ry="6" fill="#7dd3fc" />
          </g>

          <text x="490" y="120" font-family="'Sarabun', sans-serif" font-size="20" font-weight="bold" fill="#0369a1">💧 น้ำขึ้นเต็มตลิ่งใสบริสุทธิ์</text>
          <text x="490" y="150" font-family="'Sarabun', sans-serif" font-size="15" fill="#0284c7">คนขยันรีบตักน้ำใส่ตุ่มเก็บไว้ใช้</text>
        `
      },
      {
        filename: 'water-rise-fetch-2.webp',
        step: 2,
        total: 3,
        phase: 'ผลลัพธ์',
        alt: 'คนผัดวันประกันพรุ่งนั่งเล่นจนน้ำลดแห้งกลายเป็นโคลน อดได้น้ำดี',
        caption: 'คนผัดวันประกันพรุ่งนั่งเล่นจนน้ำลดแห้งกลายเป็นโคลน อดได้น้ำดี',
        themeColor: '#b45309',
        bgColor1: '#fefce8',
        bgColor2: '#fed7aa',
        illustration: `
          <!-- Scorching Afternoon Sun -->
          <circle cx="700" cy="80" r="45" fill="#f97316" opacity="0.9" />
          <!-- Dried Cracked River Bed (น้ำแห้งขอด) -->
          <rect x="0" y="240" width="800" height="140" fill="#78350f" />
          <!-- Mud & Cracks -->
          <path d="M 50 280 L 150 310 L 250 270 L 350 320 L 500 280 L 650 320" stroke="#451a03" stroke-width="3" fill="none" />
          <path d="M 120 300 L 180 340 L 300 300 L 420 350 L 580 300" stroke="#451a03" stroke-width="2.5" fill="none" />
          <ellipse cx="480" cy="300" rx="60" ry="15" fill="#451a03" />

          <!-- Regretful Person holding Empty Bucket -->
          <g transform="translate(240, 140)">
            <circle cx="60" cy="45" r="26" fill="#fed7aa" stroke="#ea580c" stroke-width="2" />
            <!-- Sad Crying Eyes & Sweats -->
            <path d="M 48 45 Q 54 40 60 45" stroke="#1e293b" stroke-width="2.5" fill="none" />
            <path d="M 68 45 Q 74 40 80 45" stroke="#1e293b" stroke-width="2.5" fill="none" />
            <ellipse cx="64" cy="58" rx="8" ry="6" fill="#1e293b" />
            <circle cx="45" cy="55" r="3" fill="#38bdf8" />
            <circle cx="83" cy="55" r="3" fill="#38bdf8" />
            <!-- Dropped Empty Bucket -->
            <rect x="42" y="75" width="36" height="50" rx="8" fill="#e2e8f0" />
            <polygon points="120,130 155,130 150,165 125,165" fill="#94a3b8" stroke="#475569" stroke-width="2" />
            <text x="140" y="152" font-family="'Sarabun', sans-serif" font-size="11" fill="#1e293b" text-anchor="middle">ว่างเปล่า</text>
          </g>

          <text x="440" y="140" font-family="'Sarabun', sans-serif" font-size="18" font-weight="bold" fill="#b91c1c">❌ น้ำลดแห้งขอด สายเกินไป!</text>
          <text x="440" y="170" font-family="'Sarabun', sans-serif" font-size="15" fill="#78350f">ผัดวันประกันพรุ่งจนเสียโอกาสดี</text>
        `
      },
      {
        filename: 'water-rise-fetch-3.webp',
        step: 3,
        total: 3,
        phase: 'คติสอนใจ',
        alt: 'เมื่อโอกาสทองหรือโอกาสดีมาถึงควรรีบฉวยไว้ อย่าปล่อยให้หลุดลอย',
        caption: 'เมื่อโอกาสทองหรือโอกาสดีมาถึงควรรีบฉวยไว้ อย่าปล่อยให้หลุดลอย',
        themeColor: '#eab308',
        bgColor1: '#fefce8',
        bgColor2: '#fef08a',
        illustration: `
          <!-- Golden Gateway of Opportunity -->
          <g transform="translate(400, 180)">
            <!-- Archway Glow -->
            <ellipse cx="0" cy="20" rx="180" ry="140" fill="#fde047" opacity="0.35" filter="url(#glow)" />
            <!-- Golden Door Arch -->
            <path d="M -90 140 L -90 20 Q -90 -70 0 -70 Q 90 -70 90 20 L 90 140 Z" fill="#ffffff" stroke="#eab308" stroke-width="6" />
            <!-- Radiant Beams -->
            <line x1="0" y1="-70" x2="0" y2="-120" stroke="#f59e0b" stroke-width="3" />
            <line x1="-50" y1="-60" x2="-80" y2="-100" stroke="#f59e0b" stroke-width="3" />
            <line x1="50" y1="-60" x2="80" y2="-100" stroke="#f59e0b" stroke-width="3" />

            <!-- Golden Trophy & Star of Success -->
            <circle cx="0" cy="20" r="40" fill="#facc15" stroke="#ca8a04" stroke-width="3" />
            <text x="0" y="32" font-family="'Segoe UI Emoji', sans-serif" font-size="32" text-anchor="middle">⭐</text>
          </g>

          <!-- Golden Lesson Pill -->
          <g transform="translate(240, 75)">
            <rect width="320" height="42" rx="21" fill="#ca8a04" />
            <text x="160" y="27" font-family="'Sarabun', sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">✨ โอกาสดีมีจำกัด จงรีบคว้าไว้!</text>
          </g>
        `
      }
    ]
  },

  // 4. กระต่ายตื่นตูม
  {
    word: 'กระต่ายตื่นตูม',
    panels: [
      {
        filename: 'rabbit-alarmist-1.webp',
        step: 1,
        total: 3,
        phase: 'จุดเริ่มต้น',
        alt: 'ลูกตาลหล่นตูมข้างตัวกระต่ายที่กำลังนอนหลับใต้ต้นไม้',
        caption: 'ลูกตาลหล่นตูมข้างตัวกระต่ายที่กำลังนอนหลับใต้ต้นไม้',
        themeColor: '#10b981',
        bgColor1: '#f0fdf4',
        bgColor2: '#bbf7d0',
        illustration: `
          <!-- Tall Palm / Palmyra Tree on Left -->
          <rect x="90" y="30" width="28" height="310" rx="6" fill="#78350f" />
          <circle cx="104" cy="40" r="75" fill="#15803d" />
          <circle cx="60" cy="50" r="50" fill="#16a34a" />
          <circle cx="150" cy="50" r="50" fill="#16a34a" />

          <!-- Falling Ripe Palm Fruit ("ตูม!") -->
          <g transform="translate(320, 240)">
            <!-- Falling Palm Fruit -->
            <ellipse cx="20" cy="20" rx="24" ry="20" fill="#3b0764" stroke="#581c87" stroke-width="3" />
            <ellipse cx="20" cy="8" rx="10" ry="5" fill="#701a75" />
            <!-- Impact Dust & Explosion Lines -->
            <path d="M -15 35 Q 20 15 55 35" stroke="#ca8a04" stroke-width="4" fill="none" />
            <text x="20" y="-15" font-family="'Sarabun', sans-serif" font-size="24" font-weight="900" fill="#dc2626" text-anchor="middle">ตูม! 💥</text>
          </g>

          <!-- Startled Little White Bunny -->
          <g transform="translate(430, 180)">
            <!-- Body jumping up -->
            <ellipse cx="60" cy="90" rx="36" ry="28" fill="#ffffff" stroke="#cbd5e1" stroke-width="3" />
            <!-- Fluffy Tail -->
            <circle cx="18" cy="90" r="12" fill="#ffffff" />
            <!-- Head & Huge Long Ears sticking straight up -->
            <circle cx="90" cy="70" r="28" fill="#ffffff" stroke="#cbd5e1" stroke-width="3" />
            <ellipse cx="80" cy="25" rx="9" ry="30" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
            <ellipse cx="80" cy="25" rx="5" ry="22" fill="#fbcfe8" />
            <ellipse cx="100" cy="25" rx="9" ry="30" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
            <ellipse cx="100" cy="25" rx="5" ry="22" fill="#fbcfe8" />
            <!-- Shocked Round Eyes -->
            <circle cx="85" cy="65" r="5" fill="#1e293b" />
            <circle cx="98" cy="65" r="5" fill="#1e293b" />
            <circle cx="92" cy="75" r="3" fill="#f43f5e" />
          </g>
        `
      },
      {
        filename: 'rabbit-alarmist-2.webp',
        step: 2,
        total: 3,
        phase: 'ตกใจเกินเหตุ',
        alt: 'กระต่ายวิ่งเตลิดร้องบอกสัตว์ทั้งป่าว่าฟ้าถล่มจนโกลาหล',
        caption: 'กระต่ายวิ่งเตลิดร้องบอกสัตว์ทั้งป่าว่าฟ้าถล่มจนโกลาหล',
        themeColor: '#f97316',
        bgColor1: '#fff7ed',
        bgColor2: '#fed7aa',
        illustration: `
          <!-- Dusty Panic Trail -->
          <ellipse cx="200" cy="300" rx="160" ry="35" fill="#e2e8f0" opacity="0.6" />
          <ellipse cx="450" cy="300" rx="180" ry="35" fill="#e2e8f0" opacity="0.6" />

          <!-- Bunny Screaming "ฟ้าถล่มแล้ว!" -->
          <g transform="translate(180, 140)">
            <ellipse cx="60" cy="80" rx="40" ry="26" fill="#ffffff" stroke="#cbd5e1" stroke-width="3" />
            <circle cx="105" cy="60" r="28" fill="#ffffff" stroke="#cbd5e1" stroke-width="3" />
            <!-- Wide open shouting mouth -->
            <ellipse cx="118" cy="68" rx="8" ry="12" fill="#dc2626" />
            <!-- Ears flying backwards in wind -->
            <ellipse cx="65" cy="40" rx="25" ry="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
            <ellipse cx="50" cy="30" rx="25" ry="8" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
            <!-- Shouting Speech Balloon -->
            <g transform="translate(60, -60)">
              <rect width="180" height="42" rx="12" fill="#fef2f2" stroke="#dc2626" stroke-width="2" />
              <text x="90" y="27" font-family="'Sarabun', sans-serif" font-size="15" font-weight="bold" fill="#b91c1c" text-anchor="middle">ฟ้าถล่มแล้ว! หนีเร็ว! 😱</text>
            </g>
          </g>

          <!-- Forest Animals Panicking (Deer & Monkey) -->
          <g transform="translate(480, 160)">
            <!-- Deer running -->
            <ellipse cx="80" cy="70" rx="45" ry="28" fill="#d97706" />
            <circle cx="130" cy="45" r="20" fill="#d97706" />
            <polygon points="120,25 130,5 140,25" fill="#78350f" />
            <circle cx="125" cy="42" r="4" fill="#1e293b" />
            <!-- Monkey -->
            <circle cx="190" cy="80" r="22" fill="#78350f" />
            <circle cx="190" cy="80" r="14" fill="#fed7aa" />
          </g>
        `
      },
      {
        filename: 'rabbit-alarmist-3.webp',
        step: 3,
        total: 3,
        phase: 'คติสอนใจ',
        alt: 'พญาราชสีห์พาไปดูความจริงว่าแค่ลูกตาลตก เตือนสติอย่าตื่นตระหนกโดยไม่สืบความจริง',
        caption: 'พญาราชสีห์พาไปดูความจริงว่าแค่ลูกตาลตก เตือนสติอย่าตื่นตระหนกโดยไม่สืบความจริง',
        themeColor: '#3b82f6',
        bgColor1: '#eff6ff',
        bgColor2: '#bfdbfe',
        illustration: `
          <!-- Wise King Lion (พญาราชสีห์) -->
          <g transform="translate(180, 120)">
            <!-- Lion Mane (แผงคอสีทองสง่างาม) -->
            <circle cx="90" cy="90" r="65" fill="#f59e0b" stroke="#b45309" stroke-width="3" />
            <circle cx="90" cy="90" r="45" fill="#fed7aa" stroke="#ea580c" stroke-width="2" />
            <!-- Calm, Wise Face -->
            <ellipse cx="78" cy="85" rx="5" ry="6" fill="#1e293b" />
            <ellipse cx="102" cy="85" rx="5" ry="6" fill="#1e293b" />
            <polygon points="90,92 84,100 96,100" fill="#b45309" />
            <!-- Royal Crown -->
            <polygon points="65,40 90,15 115,40 105,48 75,48" fill="#eab308" stroke="#ca8a04" stroke-width="2" />
            <!-- Pointing Paw -->
            <line x1="130" y1="110" x2="220" y2="135" stroke="#f59e0b" stroke-width="10" stroke-linecap="round" />
          </g>

          <!-- Harmless Palm Fruit on Ground -->
          <g transform="translate(440, 240)">
            <ellipse cx="30" cy="30" rx="28" ry="20" fill="#3b0764" stroke="#581c87" stroke-width="3" />
            <text x="30" y="70" font-family="'Sarabun', sans-serif" font-size="14" font-weight="bold" fill="#581c87" text-anchor="middle">แค่ลูกตาลสุก 1 ผล 🌴</text>
          </g>

          <!-- Embarrassed Bunny scratching head -->
          <g transform="translate(580, 160)">
            <circle cx="40" cy="50" r="24" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
            <!-- Embarrassed Blush -->
            <circle cx="28" cy="54" r="6" fill="#f43f5e" opacity="0.6" />
            <circle cx="52" cy="54" r="6" fill="#f43f5e" opacity="0.6" />
            <!-- One ear drooping -->
            <ellipse cx="30" cy="18" rx="6" ry="18" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
            <ellipse cx="50" cy="25" rx="16" ry="6" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" />
            <text x="40" y="95" font-family="'Sarabun', sans-serif" font-size="13" font-weight="bold" fill="#64748b" text-anchor="middle">เขินจัง... 🐰</text>
          </g>
        `
      }
    ]
  },

  // 5. คางคกขึ้นวอ
  {
    word: 'คางคกขึ้นวอ',
    panels: [
      {
        filename: 'toad-on-palanquin-1.webp',
        step: 1,
        total: 3,
        phase: 'จุดเริ่มต้น',
        alt: 'คางคกตัวน้อยในโคลนหนองน้ำ',
        caption: 'คางคกตัวน้อยในโคลนหนองน้ำ',
        themeColor: '#059669',
        bgColor1: '#ecfdf5',
        bgColor2: '#a7f3d0',
        illustration: `
          <!-- Swamp & Pond Background -->
          <rect x="0" y="240" width="800" height="140" fill="#065f46" />
          <ellipse cx="400" cy="300" rx="350" ry="70" fill="#047857" />
          <!-- Lotus Leaves (ใบบัว) -->
          <ellipse cx="180" cy="290" rx="65" ry="25" fill="#10b981" />
          <ellipse cx="620" cy="290" rx="75" ry="28" fill="#10b981" />
          <circle cx="630" cy="275" r="14" fill="#f472b6" />

          <!-- Little Humble Toad (คางคกน้อย) -->
          <g transform="translate(350, 180)">
            <!-- Toad Body with Warts -->
            <ellipse cx="50" cy="70" rx="48" ry="38" fill="#4d7c0f" stroke="#365314" stroke-width="3" />
            <circle cx="35" cy="55" r="4" fill="#365314" />
            <circle cx="65" cy="58" r="5" fill="#365314" />
            <circle cx="50" cy="75" r="4" fill="#365314" />
            <!-- Big Bulbous Eyes -->
            <circle cx="32" cy="38" r="14" fill="#a3e635" stroke="#365314" stroke-width="2" />
            <circle cx="32" cy="38" r="6" fill="#1e293b" />
            <circle cx="68" cy="38" r="14" fill="#a3e635" stroke="#365314" stroke-width="2" />
            <circle cx="68" cy="38" r="6" fill="#1e293b" />
            <!-- Friendly Smile -->
            <path d="M 32 75 Q 50 85 68 75" stroke="#365314" stroke-width="3" fill="none" />
          </g>
          <text x="400" y="140" font-family="'Sarabun', sans-serif" font-size="18" font-weight="bold" fill="#065f46" text-anchor="middle">🐸 คางคกธรรมดาในหนองน้ำธรรมชาติ</text>
        `
      },
      {
        filename: 'toad-on-palanquin-2.webp',
        step: 2,
        total: 3,
        phase: 'ได้ดิบได้ดี',
        alt: 'ได้รับแต่งตั้งขึ้นไปนั่งบนวอคานหามทองคำหรูหรา',
        caption: 'ได้รับแต่งตั้งขึ้นไปนั่งบนวอคานหามทองคำหรูหรา',
        themeColor: '#eab308',
        bgColor1: '#fefce8',
        bgColor2: '#fef08a',
        illustration: `
          <!-- Royal Procession Background -->
          <rect x="0" y="280" width="800" height="100" fill="#fde047" opacity="0.4" />

          <!-- Golden Palanquin (วอคานหามทองคำ) -->
          <g transform="translate(250, 100)">
            <!-- Long Carrying Poles -->
            <rect x="-80" y="160" width="460" height="14" rx="7" fill="#b45309" stroke="#78350f" stroke-width="2" />

            <!-- Golden Throne Base & Roof -->
            <rect x="50" y="120" width="200" height="50" rx="10" fill="#f59e0b" stroke="#b45309" stroke-width="3" />
            <!-- Ornate Roof -->
            <polygon points="30,80 150,20 270,80" fill="#d97706" stroke="#92400e" stroke-width="3" />
            <line x1="60" y1="80" x2="60" y2="120" stroke="#b45309" stroke-width="4" />
            <line x1="240" y1="80" x2="240" y2="120" stroke="#b45309" stroke-width="4" />

            <!-- Red Silk Cushion -->
            <ellipse cx="150" cy="120" rx="70" ry="16" fill="#dc2626" />

            <!-- Toad Sitting like a King -->
            <g transform="translate(100, 45)">
              <ellipse cx="50" cy="50" rx="35" ry="28" fill="#4d7c0f" stroke="#365314" stroke-width="2" />
              <!-- Eyes with Sunglass / Crown -->
              <circle cx="38" cy="30" r="10" fill="#a3e635" />
              <circle cx="62" cy="30" r="10" fill="#a3e635" />
              <!-- Golden Crown -->
              <polygon points="35,18 50,0 65,18" fill="#facc15" stroke="#a16207" stroke-width="2" />
              <!-- Velvet Cape -->
              <path d="M 20 50 Q 50 40 80 50 L 90 75 L 10 75 Z" fill="#991b1b" />
            </g>
          </g>
          <text x="400" y="70" font-family="'Sarabun', sans-serif" font-size="18" font-weight="bold" fill="#b45309" text-anchor="middle">👑 ได้ขึ้นวอทองคำ มีข้าราชบริพารแห่แหน</text>
        `
      },
      {
        filename: 'toad-on-palanquin-3.webp',
        step: 3,
        total: 3,
        phase: 'คติสอนใจ',
        alt: 'คางคกเชิดหน้ายโสโอหัง ลืมตัว ไม่ทักทายเพื่อนเก่า เตือนใจคนได้ดีแล้วลืมกำพืด',
        caption: 'คางคกเชิดหน้ายโสโอหัง ลืมตัว ไม่ทักทายเพื่อนเก่า เตือนใจคนได้ดีแล้วลืมกำพืด',
        themeColor: '#dc2626',
        bgColor1: '#fef2f2',
        bgColor2: '#fee2e2',
        illustration: `
          <!-- Toad on Palanquin Looking Down Snobbishly -->
          <g transform="translate(420, 90)">
            <rect width="240" height="90" rx="12" fill="#fef08a" stroke="#ca8a04" stroke-width="3" />
            <!-- Snobbish Toad Nose Up -->
            <circle cx="120" cy="50" r="30" fill="#4d7c0f" stroke="#365314" stroke-width="2" />
            <!-- Crown -->
            <polygon points="105,25 120,8 135,25" fill="#facc15" />
            <!-- Eyes Closed Arrogantly -->
            <line x1="108" y1="45" x2="118" y2="45" stroke="#1e293b" stroke-width="3" />
            <line x1="126" y1="45" x2="136" y2="45" stroke="#1e293b" stroke-width="3" />
            <path d="M 115 60 Q 120 55 128 60" stroke="#1e293b" stroke-width="3" fill="none" />
            <text x="120" y="80" font-family="'Sarabun', sans-serif" font-size="12" font-weight="bold" fill="#78350f" text-anchor="middle">"ฉันไม่รู้จักพวกเธอหรอก เชิด!"</text>
          </g>

          <!-- Old Frog Friends Below Looking Disappointed -->
          <g transform="translate(140, 220)">
            <!-- Pond ground -->
            <ellipse cx="120" cy="80" rx="110" ry="35" fill="#6ee7b7" />
            <!-- Frog 1 waving -->
            <circle cx="60" cy="60" r="22" fill="#22c55e" />
            <text x="60" y="100" font-family="'Sarabun', sans-serif" font-size="12" font-weight="bold" fill="#065f46" text-anchor="middle">สวัสดีเพื่อนคางคก!</text>
            <!-- Frog 2 disappointed -->
            <circle cx="160" cy="60" r="22" fill="#16a34a" />
            <text x="160" y="100" font-family="'Sarabun', sans-serif" font-size="12" font-weight="bold" fill="#065f46" text-anchor="middle">เขาไม่มองเราเลย...</text>
          </g>

          <!-- Warning Tag: คนได้ดีแล้วลืมกำพืด -->
          <g transform="translate(240, 35)">
            <rect width="320" height="38" rx="19" fill="#dc2626" />
            <text x="160" y="24" font-family="'Sarabun', sans-serif" font-size="15" font-weight="bold" fill="#ffffff" text-anchor="middle">⚠️ เตือนสติ: คนได้ดีแล้วอย่าลืมตัวลืมกำพืด</text>
          </g>
        `
      }
    ]
  },

  // 6. รักดีหามจั่ว รักชั่วหามเสา
  {
    word: 'รักดีหามจั่ว รักชั่วหามเสา',
    panels: [
      {
        filename: 'good-carry-gable-1.webp',
        step: 1,
        total: 3,
        phase: 'รักดีหามจั่ว',
        alt: 'เด็กตั้งใจเรียนหนังสือ ได้ทำงานเบาสบาย ยกจั่วไม้โปร่งบนหลังคา ยิ้มแย้มมีความสุข',
        caption: 'เด็กตั้งใจเรียนหนังสือ ได้ทำงานเบาสบาย ยกจั่วไม้โปร่งบนหลังคา ยิ้มแย้มมีความสุข',
        themeColor: '#16a34a',
        bgColor1: '#f0fdf4',
        bgColor2: '#bbf7d0',
        illustration: `
          <!-- Sunny Thai Roof Framing -->
          <g transform="translate(240, 90)">
            <!-- Light Airy Gable Triangle (จั่วเรือนไทยโปร่งเบา) -->
            <polygon points="160,30 20,170 300,170" fill="none" stroke="#16a34a" stroke-width="14" stroke-linejoin="round" />
            <line x1="160" y1="30" x2="160" y2="170" stroke="#22c55e" stroke-width="8" />
            <line x1="90" y1="100" x2="230" y2="100" stroke="#22c55e" stroke-width="8" />

            <!-- Smiling Student lifting gable lightly with two fingers -->
            <circle cx="160" cy="220" r="30" fill="#fed7aa" stroke="#ea580c" stroke-width="2" />
            <!-- Smiling Eyes & Face -->
            <path d="M 148 220 Q 154 226 160 220" stroke="#1e293b" stroke-width="2" fill="none" />
            <path d="M 166 220 Q 172 226 178 220" stroke="#1e293b" stroke-width="2" fill="none" />
            <path d="M 152 232 Q 160 240 168 232" stroke="#15803d" stroke-width="3" fill="none" />
            <!-- Light feather symbol -->
            <text x="240" y="80" font-family="'Sarabun', sans-serif" font-size="16" font-weight="bold" fill="#15803d">เบาสบาย 🪶</text>
          </g>
          <text x="400" y="60" font-family="'Sarabun', sans-serif" font-size="20" font-weight="bold" fill="#15803d" text-anchor="middle">🏠 "รักดีหามจั่ว" ตั้งใจศึกษา งานเบาสบาย ได้ผลดี</text>
        `
      },
      {
        filename: 'good-carry-gable-2.webp',
        step: 2,
        total: 3,
        phase: 'รักชั่วหามเสา',
        alt: 'คนเกเร ไม่ตั้งใจ ต้องแบกเสาซุงท่อนยักษ์ที่หนักหน่วงเหน็ดเหนื่อย',
        caption: 'คนเกเร ไม่ตั้งใจ ต้องแบกเสาซุงท่อนยักษ์ที่หนักหน่วงเหน็ดเหนื่อย',
        themeColor: '#b91c1c',
        bgColor1: '#fef2f2',
        bgColor2: '#fecaca',
        illustration: `
          <!-- Heavy Dark Log on Ground -->
          <g transform="translate(180, 110)">
            <!-- Giant Heavy Solid Timber Pillar (เสาซุงท่อนตันยักษ์) -->
            <rect x="0" y="60" width="440" height="70" rx="14" fill="#78350f" stroke="#451a03" stroke-width="5" />
            <ellipse cx="20" cy="95" rx="14" ry="35" fill="#92400e" stroke="#451a03" stroke-width="3" />
            <text x="220" y="102" font-family="'Sarabun', sans-serif" font-size="20" font-weight="bold" fill="#fef08a" text-anchor="middle">เสาไม้ซุงท่อนตัน หนัก 500 กก. 🪵</text>

            <!-- Exhausted Straining Worker Under Log -->
            <g transform="translate(180, 130)">
              <circle cx="40" cy="40" r="28" fill="#fed7aa" stroke="#ea580c" stroke-width="2" />
              <!-- Straining face & Sweats -->
              <path d="M 28 38 L 38 42" stroke="#1e293b" stroke-width="3" />
              <path d="M 52 42 L 42 38" stroke="#1e293b" stroke-width="3" />
              <ellipse cx="40" cy="52" rx="8" ry="5" fill="#991b1b" />
              <path d="M 68 20 Q 72 5 76 20 Z" fill="#38bdf8" />
              <path d="M 12 20 Q 16 5 20 20 Z" fill="#38bdf8" />
            </g>
          </g>
          <text x="400" y="60" font-family="'Sarabun', sans-serif" font-size="20" font-weight="bold" fill="#991b1b" text-anchor="middle">🪵 "รักชั่วหามเสา" ไม่ใฝ่ดี ต้องทำงานหนักเหน็ดเหนื่อย</text>
        `
      },
      {
        filename: 'good-carry-gable-3.webp',
        step: 3,
        total: 3,
        phase: 'คติสอนใจ',
        alt: 'ใฝ่ดีจะได้รับความสุขสบายในอนาคต ส่วนใฝ่ชั่วจะต้องลำบากยากเข็ญ',
        caption: 'ใฝ่ดีจะได้รับความสุขสบายในอนาคต ส่วนใฝ่ชั่วจะต้องลำบากยากเข็ญ',
        themeColor: '#059669',
        bgColor1: '#f8fafc',
        bgColor2: '#e2e8f0',
        illustration: `
          <!-- Two Paths Comparison Side by Side -->
          <g transform="translate(100, 80)">
            <!-- Left Side: Good Road (รักดี) -->
            <rect width="280" height="260" rx="16" fill="#f0fdf4" stroke="#16a34a" stroke-width="3" />
            <text x="140" y="40" font-family="'Sarabun', sans-serif" font-size="18" font-weight="bold" fill="#15803d" text-anchor="middle">✨ ใฝ่ดี มีวิชาความรู้</text>
            <circle cx="140" cy="110" r="45" fill="#bbf7d0" />
            <text x="140" y="122" font-family="'Segoe UI Emoji', sans-serif" font-size="40" text-anchor="middle">🎓</text>
            <text x="140" y="190" font-family="'Sarabun', sans-serif" font-size="15" font-weight="bold" fill="#166534" text-anchor="middle">อนาคตสดใส เบาสบาย</text>
            <text x="140" y="220" font-family="'Sarabun', sans-serif" font-size="13" fill="#15803d" text-anchor="middle">มีความสุขและความเจริญ</text>
          </g>

          <g transform="translate(420, 80)">
            <!-- Right Side: Bad Road (รักชั่ว) -->
            <rect width="280" height="260" rx="16" fill="#fef2f2" stroke="#dc2626" stroke-width="3" />
            <text x="140" y="40" font-family="'Sarabun', sans-serif" font-size="18" font-weight="bold" fill="#b91c1c" text-anchor="middle">⚠️ เกเร ละเลยการเรียน</text>
            <circle cx="140" cy="110" r="45" fill="#fecaca" />
            <text x="140" y="122" font-family="'Segoe UI Emoji', sans-serif" font-size="40" text-anchor="middle">🪵</text>
            <text x="140" y="190" font-family="'Sarabun', sans-serif" font-size="15" font-weight="bold" fill="#991b1b" text-anchor="middle">อนาคตลำบากยากเข็ญ</text>
            <text x="140" y="220" font-family="'Sarabun', sans-serif" font-size="13" fill="#b91c1c" text-anchor="middle">ต้องเหน็ดเหนื่อยตรากตรำ</text>
          </g>
        `
      }
    ]
  },

  // 7. กบในกะลาครอบ
  {
    word: 'กบในกะลาครอบ',
    panels: [
      {
        filename: 'frog-in-coconut-shell-1.webp',
        step: 1,
        total: 3,
        phase: 'ในกะลา',
        alt: 'กบน้อยนั่งมองโลกในกะลามะพร้าว คิดว่าท้องฟ้ามีขนาดกว้างเท่ากะลา',
        caption: 'กบน้อยนั่งมองโลกในกะลามะพร้าว คิดว่าท้องฟ้ามีขนาดกว้างเท่ากะลา',
        themeColor: '#78350f',
        bgColor1: '#fefce8',
        bgColor2: '#fef08a',
        illustration: `
          <!-- Coconut Shell Covering (กะลาครอบ) -->
          <g transform="translate(400, 210)">
            <!-- Dark Coconut Shell Dome -->
            <path d="M -180 120 C -180 -80 180 -80 180 120 Z" fill="#451a03" stroke="#292524" stroke-width="6" />
            <!-- Interior Darkness -->
            <path d="M -160 115 C -160 -60 160 -60 160 115 Z" fill="#1c1917" />
            <!-- Small Coconut Eye Hole with tiny beam of light -->
            <circle cx="0" cy="-30" r="14" fill="#fef08a" />
            <polygon points="-8,-30 8,-30 40,115 -40,115" fill="#fef08a" opacity="0.25" />

            <!-- Frog Sitting Smugly Inside -->
            <g transform="translate(-40, 20)">
              <ellipse cx="40" cy="50" rx="36" ry="28" fill="#22c55e" stroke="#16a34a" stroke-width="3" />
              <!-- Frog Eyes -->
              <circle cx="28" cy="30" r="10" fill="#a3e635" />
              <circle cx="28" cy="30" r="5" fill="#1e293b" />
              <circle cx="52" cy="30" r="10" fill="#a3e635" />
              <circle cx="52" cy="30" r="5" fill="#1e293b" />
              <!-- Smug smile -->
              <path d="M 28 55 Q 40 65 52 55" stroke="#166534" stroke-width="3" fill="none" />
            </g>
          </g>

          <text x="400" y="70" font-family="'Sarabun', sans-serif" font-size="18" font-weight="bold" fill="#78350f" text-anchor="middle">"โลกและท้องฟ้าทั้งใบ มีอยู่แค่นี้เอง!" 🥥</text>
        `
      },
      {
        filename: 'frog-in-coconut-shell-2.webp',
        step: 2,
        total: 3,
        phase: 'เปิดโลก',
        alt: 'มีคนยกกะลาออก พบว่าท้องฟ้า ทะเล และภูเขากว้างใหญ่ไพศาลไร้ขอบเขต',
        caption: 'มีคนยกกะลาออก พบว่าท้องฟ้า ทะเล และภูเขากว้างใหญ่ไพศาลไร้ขอบเขต',
        themeColor: '#0284c7',
        bgColor1: '#f0f9ff',
        bgColor2: '#bae6fd',
        illustration: `
          <!-- Vast Open Panorama: Mountains, Sea, Blue Sky -->
          <path d="M 0 240 Q 200 130 400 230 T 800 220 L 800 380 L 0 380 Z" fill="#6ee7b7" />
          <path d="M 0 280 Q 250 200 500 280 T 800 270 L 800 380 L 0 380 Z" fill="#0284c7" />

          <!-- Coconut Shell Being Lifted Up into the Air -->
          <g transform="translate(400, 100)">
            <path d="M -90 60 C -90 -40 90 -40 90 60 Z" fill="#78350f" stroke="#451a03" stroke-width="4" />
            <!-- Motion Upward lines -->
            <line x1="0" y1="70" x2="0" y2="110" stroke="#f59e0b" stroke-width="4" stroke-dasharray="6,4" />
          </g>

          <!-- Stunned Frog with Huge Eyes looking around -->
          <g transform="translate(360, 220)">
            <ellipse cx="40" cy="50" rx="40" ry="30" fill="#22c55e" stroke="#16a34a" stroke-width="3" />
            <!-- Wide Stunned Eyes -->
            <circle cx="25" cy="25" r="16" fill="#ffffff" stroke="#166534" stroke-width="2" />
            <circle cx="25" cy="25" r="7" fill="#1e293b" />
            <circle cx="55" cy="25" r="16" fill="#ffffff" stroke="#166534" stroke-width="2" />
            <circle cx="55" cy="25" r="7" fill="#1e293b" />
            <!-- Open mouth in awe :O -->
            <ellipse cx="40" cy="55" rx="10" ry="12" fill="#166534" />
          </g>

          <text x="400" y="60" font-family="'Sarabun', sans-serif" font-size="20" font-weight="bold" fill="#0369a1" text-anchor="middle">✨ โลกภายนอกกว้างใหญ่ไพศาล ไร้ขอบเขต!</text>
        `
      },
      {
        filename: 'frog-in-coconut-shell-3.webp',
        step: 3,
        total: 3,
        phase: 'คติสอนใจ',
        alt: 'คนที่มีความรู้น้อยแต่นึกว่าตนเองรู้รอบ เตือนให้เปิดใจเรียนรู้สิ่งใหม่',
        caption: 'คนที่มีความรู้น้อยแต่นึกว่าตนเองรู้รอบ เตือนให้เปิดใจเรียนรู้สิ่งใหม่',
        themeColor: '#7c3aed',
        bgColor1: '#f5f3ff',
        bgColor2: '#ddd6fe',
        illustration: `
          <!-- Explorer Frog with Glasses, Map & Books -->
          <g transform="translate(240, 110)">
            <!-- Globe & Books on Table -->
            <circle cx="70" cy="90" r="45" fill="#38bdf8" stroke="#0284c7" stroke-width="3" />
            <path d="M 50 70 Q 70 85 90 70" stroke="#15803d" stroke-width="8" fill="none" />
            <rect x="20" y="145" width="100" height="25" rx="5" fill="#f43f5e" />
            <rect x="25" y="170" width="110" height="25" rx="5" fill="#f59e0b" />
          </g>

          <!-- Wise Explorer Frog -->
          <g transform="translate(420, 120)">
            <ellipse cx="50" cy="70" rx="42" ry="32" fill="#22c55e" stroke="#16a34a" stroke-width="3" />
            <!-- Round Glasses (แว่นตานักปราชญ์) -->
            <circle cx="36" cy="50" r="14" fill="#ffffff" stroke="#1e293b" stroke-width="3" />
            <circle cx="64" cy="50" r="14" fill="#ffffff" stroke="#1e293b" stroke-width="3" />
            <line x1="50" y1="50" x2="50" y2="50" stroke="#1e293b" stroke-width="3" />
            <!-- Happy Smart Smile -->
            <path d="M 38 75 Q 50 85 62 75" stroke="#166534" stroke-width="3" fill="none" />
          </g>

          <!-- Golden Knowledge Banner -->
          <g transform="translate(200, 45)">
            <rect width="400" height="42" rx="21" fill="#7c3aed" />
            <text x="200" y="27" font-family="'Sarabun', sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">📖 อย่าสำคัญตนว่ารู้รอบ จงเปิดใจเรียนรู้สิ่งใหม่</text>
          </g>
        `
      }
    ]
  },

  // 8. ชุบมือเปิบ
  {
    word: 'ชุบมือเปิบ',
    panels: [
      {
        filename: 'dip-hand-take-food-1.webp',
        step: 1,
        total: 2,
        phase: 'ลงแรง',
        alt: 'เพื่อนๆ ช่วยกันก่อไฟ หุงข้าว ปรุงอาหารจนเหงื่อไหลไคลย้อย',
        caption: 'เพื่อนๆ ช่วยกันก่อไฟ หุงข้าว ปรุงอาหารจนเหงื่อไหลไคลย้อย',
        themeColor: '#ea580c',
        bgColor1: '#fff7ed',
        bgColor2: '#fed7aa',
        illustration: `
          <!-- Cooking Kitchen Ground -->
          <rect x="0" y="270" width="800" height="110" fill="#d97706" />

          <!-- Campfire & Steaming Rice Pot -->
          <g transform="translate(350, 160)">
            <!-- Fire Logs & Flames -->
            <line x1="-30" y1="120" x2="30" y2="120" stroke="#78350f" stroke-width="12" stroke-linecap="round" />
            <polygon points="-25,120 0,60 25,120" fill="#ef4444" />
            <polygon points="-15,120 0,75 15,120" fill="#fbbf24" />

            <!-- Big Cooking Pot with Steam -->
            <rect x="-40" y="40" width="80" height="50" rx="8" fill="#475569" stroke="#1e293b" stroke-width="3" />
            <!-- Steam puffs -->
            <ellipse cx="-15" cy="15" rx="8" ry="12" fill="#ffffff" opacity="0.8" />
            <ellipse cx="15" cy="10" rx="10" ry="14" fill="#ffffff" opacity="0.8" />
          </g>

          <!-- Diligent Friend 1 Chopping Firewood (Left) -->
          <g transform="translate(180, 140)">
            <circle cx="40" cy="40" r="24" fill="#fed7aa" stroke="#ea580c" stroke-width="2" />
            <!-- Sweating face -->
            <path d="M 58 25 Q 62 15 66 25 Z" fill="#38bdf8" />
            <rect x="25" y="65" width="30" height="45" rx="6" fill="#3b82f6" />
            <!-- Axe chopping log -->
            <line x1="55" y1="75" x2="85" y2="120" stroke="#78350f" stroke-width="4" />
            <rect x="80" y="115" width="20" height="12" fill="#64748b" />
            <text x="40" y="130" font-family="'Sarabun', sans-serif" font-size="12" font-weight="bold" fill="#1e293b" text-anchor="middle">ตัดฟืน 🔥</text>
          </g>

          <!-- Diligent Friend 2 Stirring Pot with Wooden Ladle (Right) -->
          <g transform="translate(520, 140)">
            <circle cx="40" cy="40" r="24" fill="#fed7aa" stroke="#ea580c" stroke-width="2" />
            <!-- Sweating face -->
            <path d="M 18 25 Q 22 15 26 25 Z" fill="#38bdf8" />
            <rect x="25" y="65" width="30" height="45" rx="6" fill="#10b981" />
            <line x1="15" y1="80" x2="-35" y2="90" stroke="#78350f" stroke-width="4" />
            <text x="40" y="130" font-family="'Sarabun', sans-serif" font-size="12" font-weight="bold" fill="#1e293b" text-anchor="middle">ปรุงอาหาร 🍲</text>
          </g>

          <text x="400" y="60" font-family="'Sarabun', sans-serif" font-size="18" font-weight="bold" fill="#c2410c" text-anchor="middle">💪 ช่วยกันเหน็ดเหนื่อย ก่อไฟ หุงข้าว ทำกับข้าว</text>
        `
      },
      {
        filename: 'dip-hand-take-food-2.webp',
        step: 2,
        total: 2,
        phase: 'ฉวยโอกาส',
        alt: 'คนขี้เกียจที่ไม่ได้ช่วยทำ เอามือจุ่มน้ำสะอาดแล้วมานั่งเปิบข้าวกินหน้าตาเฉย เตือนสติคนฉวยประโยชน์',
        caption: 'คนขี้เกียจที่ไม่ได้ช่วยทำ เอามือจุ่มน้ำสะอาดแล้วมานั่งเปิบข้าวกินหน้าตาเฉย เตือนสติคนฉวยประโยชน์',
        themeColor: '#dc2626',
        bgColor1: '#fef2f2',
        bgColor2: '#fee2e2',
        illustration: `
          <!-- Delicious Feast Table Set -->
          <rect x="120" y="240" width="560" height="110" rx="14" fill="#d97706" stroke="#92400e" stroke-width="4" />
          <!-- Platter of Rice & Food -->
          <ellipse cx="300" cy="275" rx="70" ry="25" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" />
          <ellipse cx="300" cy="270" rx="55" ry="18" fill="#fef08a" />
          <text x="300" y="276" font-family="'Sarabun', sans-serif" font-size="14" font-weight="bold" fill="#78350f" text-anchor="middle">สำรับอาหาร 🍗</text>

          <!-- Free-loader Dipping Hand in Water Basin & Eating (ชุบมือเปิบ) -->
          <g transform="translate(480, 110)">
            <!-- Water Bowl (ขันน้ำล้างมือ) -->
            <ellipse cx="-40" cy="140" rx="30" ry="14" fill="#38bdf8" stroke="#0284c7" stroke-width="3" />
            <text x="-40" y="175" font-family="'Sarabun', sans-serif" font-size="12" font-weight="bold" fill="#0369a1" text-anchor="middle">ขันน้ำชุบมือ 💧</text>

            <!-- Selfish Person Eating Carelessly -->
            <circle cx="50" cy="50" r="30" fill="#fed7aa" stroke="#ea580c" stroke-width="2" />
            <!-- Sneaky Smug Eyes -->
            <path d="M 38 48 Q 45 42 52 48" stroke="#1e293b" stroke-width="3" fill="none" />
            <path d="M 58 48 Q 65 42 72 48" stroke="#1e293b" stroke-width="3" fill="none" />
            <!-- Hand grabbing rice directly -->
            <line x1="30" y1="85" x2="-90" y2="155" stroke="#ea580c" stroke-width="6" stroke-linecap="round" />
            <text x="50" y="110" font-family="'Sarabun', sans-serif" font-size="14" font-weight="bold" fill="#dc2626" text-anchor="middle">กินหน้าตาเฉย!</text>
          </g>

          <!-- Disappointed Friends in Background -->
          <g transform="translate(160, 130)">
            <circle cx="30" cy="40" r="20" fill="#fed7aa" stroke="#64748b" stroke-width="2" />
            <circle cx="70" cy="40" r="20" fill="#fed7aa" stroke="#64748b" stroke-width="2" />
            <text x="50" y="80" font-family="'Sarabun', sans-serif" font-size="13" font-weight="bold" fill="#64748b" text-anchor="middle">ไม่ช่วยแต่แย่งกิน...</text>
          </g>

          <!-- Moral Warning Pill -->
          <g transform="translate(200, 35)">
            <rect width="400" height="38" rx="19" fill="#dc2626" />
            <text x="200" y="24" font-family="'Sarabun', sans-serif" font-size="15" font-weight="bold" fill="#ffffff" text-anchor="middle">⚠️ เตือนสติ: อย่าฉวยประโยชน์จากน้ำพักน้ำแรงของผู้อื่น</text>
          </g>
        `
      }
    ]
  },

  // 9. ศรศิลป์ไม่กินกัน
  {
    word: 'ศรศิลป์ไม่กินกัน',
    panels: [
      {
        filename: 'bow-arrow-not-eat-1.webp',
        step: 1,
        total: 2,
        phase: 'ปะทะ',
        alt: 'สองฝ่ายแผลงศรใส่กันด้วยความขัดแย้ง แต่ลูกศรกลายเป็นดอกไม้ร่วงหล่น',
        caption: 'สองฝ่ายแผลงศรใส่กันด้วยความขัดแย้ง แต่ลูกศรกลายเป็นดอกไม้ร่วงหล่น',
        themeColor: '#7c3aed',
        bgColor1: '#faf5ff',
        bgColor2: '#e9d5ff',
        illustration: `
          <!-- Golden Bow & Arrow 1 (Left Warrior) -->
          <g transform="translate(140, 160)">
            <!-- Golden Bow Curved -->
            <path d="M 60 10 Q 0 80 60 150" fill="none" stroke="#eab308" stroke-width="8" stroke-linecap="round" />
            <line x1="60" y1="10" x2="60" y2="150" stroke="#f8fafc" stroke-width="2" />
            <!-- Arrow drawn -->
            <line x1="20" y1="80" x2="160" y2="80" stroke="#eab308" stroke-width="4" />
            <polygon points="160,75 180,80 160,85" fill="#f59e0b" />
          </g>

          <!-- Golden Bow & Arrow 2 (Right Warrior) -->
          <g transform="translate(560, 160)">
            <!-- Golden Bow Curved -->
            <path d="M 40 10 Q 100 80 40 150" fill="none" stroke="#eab308" stroke-width="8" stroke-linecap="round" />
            <line x1="40" y1="10" x2="40" y2="150" stroke="#f8fafc" stroke-width="2" />
            <!-- Arrow drawn -->
            <line x1="80" y1="80" x2="-60" y2="80" stroke="#eab308" stroke-width="4" />
            <polygon points="-60,75 -80,80 -60,85" fill="#f59e0b" />
          </g>

          <!-- Center Clash: Arrows Transform Into Falling Flowers & Lotus Petals -->
          <g transform="translate(400, 240)">
            <!-- Flower Blossom Cluster -->
            <circle cx="0" cy="0" r="22" fill="#f43f5e" />
            <circle cx="-18" cy="-12" r="16" fill="#fb7185" />
            <circle cx="18" cy="-12" r="16" fill="#fb7185" />
            <circle cx="-14" cy="18" r="16" fill="#fb7185" />
            <circle cx="14" cy="18" r="16" fill="#fb7185" />
            <circle cx="0" cy="0" r="12" fill="#fef08a" />
            <!-- Sparkles & Petals Floating Down -->
            <text x="0" y="60" font-family="'Sarabun', sans-serif" font-size="14" font-weight="bold" fill="#be185d" text-anchor="middle">ลูกศรกลายเป็นดอกไม้ 🌸</text>
          </g>

          <text x="400" y="60" font-family="'Sarabun', sans-serif" font-size="18" font-weight="bold" fill="#6b21a8" text-anchor="middle">🏹 แผลงศรเข้าหากัน แต่ศรศิลป์ทำร้ายกันไม่ได้</text>
        `
      },
      {
        filename: 'bow-arrow-not-eat-2.webp',
        step: 2,
        total: 2,
        phase: 'คติสอนใจ',
        alt: 'คนที่ไม่ถูกชะตากัน หรือคนที่มีสายเลือดเดียวกันทำร้ายกันไม่ลง',
        caption: 'คนที่ไม่ถูกชะตากัน หรือคนที่มีสายเลือดเดียวกันทำร้ายกันไม่ลง',
        themeColor: '#db2777',
        bgColor1: '#fdf2f8',
        bgColor2: '#fbcfe8',
        illustration: `
          <!-- Two Figures Back-to-Back with Kind Hearts -->
          <g transform="translate(320, 140)">
            <!-- Left Character -->
            <circle cx="30" cy="50" r="28" fill="#fed7aa" stroke="#ea580c" stroke-width="2" />
            <!-- Right Character -->
            <circle cx="130" cy="50" r="28" fill="#fed7aa" stroke="#ea580c" stroke-width="2" />

            <!-- Golden Bond Thread (สายใยผูกพัน) -->
            <path d="M 58 50 Q 80 20 102 50" stroke="#f59e0b" stroke-width="4" fill="none" stroke-dasharray="4,4" />

            <!-- Giant Heart of Peace Above -->
            <circle cx="80" cy="0" r="25" fill="#f43f5e" />
            <text x="80" y="9" font-family="'Segoe UI Emoji', sans-serif" font-size="28" text-anchor="middle">💖</text>
          </g>

          <g transform="translate(180, 40)">
            <rect width="440" height="42" rx="21" fill="#be185d" />
            <text x="220" y="27" font-family="'Sarabun', sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">🤝 สายเลือดเดียวกันหรือชะตาผูกพัน ย่อมทำร้ายกันไม่ลง</text>
          </g>
        `
      }
    ]
  },

  // 10. ชักแม่น้ำทั้งห้า
  {
    word: 'ชักแม่น้ำทั้งห้า',
    panels: [
      {
        filename: 'draw-five-rivers-1.webp',
        step: 1,
        total: 2,
        phase: 'หว่านล้อม',
        alt: 'คนพูดยกแม่น้ำ 5 สาย (คงคา ยมุนา อจิรวดี สรภู มหิมา) บรรยายยาวยืด',
        caption: 'คนพูดยกแม่น้ำ 5 สาย (คงคา ยมุนา อจิรวดี สรภู มหิมา) บรรยายยาวยืด',
        themeColor: '#0284c7',
        bgColor1: '#f0f9ff',
        bgColor2: '#bae6fd',
        illustration: `
          <!-- 5 Winding Rivers Cascading Across Scene -->
          <g transform="translate(80, 80)">
            <path d="M 0 50 Q 120 20 240 60 T 480 40" stroke="#0284c7" stroke-width="8" fill="none" />
            <text x="490" y="45" font-family="'Sarabun', sans-serif" font-size="12" font-weight="bold" fill="#0369a1">แม่น้ำคงคา</text>

            <path d="M 0 90 Q 140 120 260 80 T 480 100" stroke="#0ea5e9" stroke-width="8" fill="none" />
            <text x="490" y="105" font-family="'Sarabun', sans-serif" font-size="12" font-weight="bold" fill="#0284c7">แม่น้ำยมุนา</text>

            <path d="M 0 140 Q 110 160 250 130 T 480 150" stroke="#38bdf8" stroke-width="8" fill="none" />
            <text x="490" y="155" font-family="'Sarabun', sans-serif" font-size="12" font-weight="bold" fill="#0284c7">แม่น้ำอจิรวดี</text>

            <path d="M 0 190 Q 130 170 270 210 T 480 190" stroke="#06b6d4" stroke-width="8" fill="none" />
            <text x="490" y="195" font-family="'Sarabun', sans-serif" font-size="12" font-weight="bold" fill="#0891b2">แม่น้ำสรภู</text>

            <path d="M 0 240 Q 150 260 280 230 T 480 250" stroke="#0d9488" stroke-width="8" fill="none" />
            <text x="490" y="255" font-family="'Sarabun', sans-serif" font-size="12" font-weight="bold" fill="#0f766e">แม่น้ำมหิมา</text>
          </g>

          <!-- Persuasive Speaker Waving Hands Dramatically -->
          <g transform="translate(620, 160)">
            <circle cx="50" cy="50" r="32" fill="#fed7aa" stroke="#ea580c" stroke-width="2" />
            <!-- Shouting / Talking non-stop mouth -->
            <ellipse cx="60" cy="58" rx="8" ry="12" fill="#dc2626" />
            <!-- Gesturing Hands -->
            <line x1="20" y1="80" x2="-20" y2="50" stroke="#ea580c" stroke-width="5" stroke-linecap="round" />
            <line x1="60" y1="80" x2="100" y2="40" stroke="#ea580c" stroke-width="5" stroke-linecap="round" />
            <text x="50" y="115" font-family="'Sarabun', sans-serif" font-size="13" font-weight="bold" fill="#1e293b" text-anchor="middle">พูดอ้อมค้อม...</text>
          </g>

          <text x="360" y="45" font-family="'Sarabun', sans-serif" font-size="18" font-weight="bold" fill="#0369a1" text-anchor="middle">🌊 ยกแม่น้ำทั้ง 5 สายมาอ้าง เพื่อหว่านล้อม</text>
        `
      },
      {
        filename: 'draw-five-rivers-2.webp',
        step: 2,
        total: 2,
        phase: 'คติสอนใจ',
        alt: 'ผู้ฟังขอให้พูดตรงประเด็น เตือนสติคนพูดจาหว่านล้อมอ้อมค้อมเพื่อหวังผล',
        caption: 'ผู้ฟังขอให้พูดตรงประเด็น เตือนสติคนพูดจาหว่านล้อมอ้อมค้อมเพื่อหวังผล',
        themeColor: '#16a34a',
        bgColor1: '#f0fdf4',
        bgColor2: '#bbf7d0',
        illustration: `
          <!-- Direct Target / Bullseye (ตรงประเด็น) -->
          <g transform="translate(480, 190)">
            <circle cx="0" cy="0" r="70" fill="#ffffff" stroke="#ef4444" stroke-width="12" />
            <circle cx="0" cy="0" r="45" fill="#ef4444" />
            <circle cx="0" cy="0" r="25" fill="#ffffff" />
            <circle cx="0" cy="0" r="10" fill="#ef4444" />
            <!-- Direct Arrow hitting bullseye -->
            <line x1="-160" y1="0" x2="0" y2="0" stroke="#f59e0b" stroke-width="8" stroke-linecap="round" />
            <polygon points="-10,-10 10,0 -10,10" fill="#b45309" />
            <text x="0" y="105" font-family="'Sarabun', sans-serif" font-size="16" font-weight="bold" fill="#b91c1c" text-anchor="middle">🎯 พูดตรงประเด็น</text>
          </g>

          <!-- Listener Gesturing "เข้าเรื่องเลยดีกว่า" -->
          <g transform="translate(180, 140)">
            <circle cx="50" cy="50" r="32" fill="#fed7aa" stroke="#ea580c" stroke-width="2" />
            <!-- Knowing smile -->
            <path d="M 40 58 Q 50 68 60 58" stroke="#15803d" stroke-width="3" fill="none" />
            <!-- Hand palm up stop gesture -->
            <line x1="75" y1="80" x2="110" y2="60" stroke="#ea580c" stroke-width="5" stroke-linecap="round" />
            <circle cx="115" cy="58" r="8" fill="#fed7aa" />
            <text x="50" y="115" font-family="'Sarabun', sans-serif" font-size="14" font-weight="bold" fill="#15803d" text-anchor="middle">"เข้าเรื่องเลยดีกว่าครับ"</text>
          </g>

          <!-- Moral Tag -->
          <g transform="translate(180, 40)">
            <rect width="440" height="42" rx="21" fill="#15803d" />
            <text x="220" y="27" font-family="'Sarabun', sans-serif" font-size="16" font-weight="bold" fill="#ffffff" text-anchor="middle">🎯 การสื่อสารที่ดีควรตรงไปตรงมา จริงใจ ไม่อ้อมค้อม</text>
          </g>
        `
      }
    ]
  }
];

async function main() {
  console.log('🎨 Generating 27 storyboard visual panels for 10 Thai idioms...');

  let generatedCount = 0;

  for (const idiom of PILOT_IDIOMS) {
    console.log(`\nProcessing idiom: "${idiom.word}" (${idiom.panels.length} panels)`);
    for (const panel of idiom.panels) {
      const outputPath = path.join(OUTPUT_DIR, panel.filename);
      const svg = createStoryboardSvg({
        stepNumber: panel.step,
        totalSteps: panel.total,
        phase: panel.phase,
        caption: panel.caption,
        themeColor: panel.themeColor,
        bgColor1: panel.bgColor1,
        bgColor2: panel.bgColor2,
        illustrationContent: panel.illustration
      });

      await sharp(Buffer.from(svg))
        .webp({ quality: 85 })
        .toFile(outputPath);

      const stats = fs.statSync(outputPath);
      console.log(`  ✓ Generated: ${panel.filename} (${(stats.size / 1024).toFixed(1)} KB)`);
      generatedCount++;
    }
  }

  console.log(`\n✅ Generated total ${generatedCount} panels in ${OUTPUT_DIR}`);

  // Update idioms.json
  console.log('\n📝 Updating idioms.json with storyboard images arrays...');
  const idiomsData = JSON.parse(fs.readFileSync(IDIOMS_JSON_PATH, 'utf8'));

  for (const pilot of PILOT_IDIOMS) {
    const item = idiomsData.find((w) => w.word === pilot.word);
    if (!item) {
      throw new Error(`Idiom "${pilot.word}" not found in idioms.json`);
    }

    const imagesArray = pilot.panels.map((p) => ({
      step: p.step,
      phase: p.phase,
      url: `assets/idiom-visuals/${p.filename}`,
      alt: p.alt,
      caption: p.caption
    }));

    item.images = imagesArray;
    item.image_url = imagesArray[0].url;
    item.image_alt = imagesArray[0].alt;
  }

  fs.writeFileSync(IDIOMS_JSON_PATH, JSON.stringify(idiomsData, null, 2) + '\n', 'utf8');
  console.log('✅ Updated public/games/thai/thai-vocab-hub/data/words/idioms.json successfully!');
}

main().catch((err) => {
  console.error('❌ Failed processing idiom visuals:', err);
  process.exit(1);
});
