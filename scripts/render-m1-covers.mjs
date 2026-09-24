import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const COVERS = [
  // 1. Clock Quest (Math)
  {
    id: 'clock-quest',
    targetPath: path.join(rootDir, 'public', 'games', 'math', 'clock-quest-cover.png'),
    titleEn: 'Clock Quest',
    titleTh: 'นาฬิกาแสนสนุก',
    subTitle: 'อ่านหน้าปัดนาฬิกาอนาล็อก · เข็มสั้นบอกชั่วโมง เข็มยาวบอกนาที · บอกเวลาเช้า-บ่าย 24 ชม.',
    curriculum: '⭐ ค 2.1 ป.2–ป.3 · คณิตศาสตร์ (เวลา)',
    pill: 'MATH TIME ADVENTURE · สนุกกับเข็มนาฬิกา',
    bgGradient: 'radial-gradient(circle at 50% 30%, #0284c7 0%, #0369a1 35%, #075985 70%, #0c4a6e 100%)',
    primaryColor: '#38bdf8',
    accentColor: '#fde047',
    glowColor: 'rgba(56, 189, 248, 0.3)',
    cornerIcon: '⏰',
    cornerText: 'KAMPAI MATH · โรงเรียนบ้านคำไผ่',
    badges: [
      { text: '⏰ เข็มสั้นชั่วโมง · เข็มยาวนาที', color: 'gold' },
      { text: '⏱️ อ่านเวลา 5–60 นาที และ 24 ชม.', color: 'cyan' },
      { text: '🎯 ภารกิจหมุนเวลาพิชิตด่าน', color: 'green' }
    ],
    svgArt: `
      <!-- LEFT: Cute Chibi Time Explorer Boy -->
      <g transform="translate(60, 140)">
        <!-- Island shadow & grass base -->
        <ellipse cx="90" cy="340" rx="90" ry="24" fill="#042f2e" opacity="0.6"/>
        <path d="M10 330 C40 310 140 310 170 330 C180 350 160 370 90 370 C20 370 0 350 10 330 Z" fill="#16a34a"/>
        <ellipse cx="90" cy="335" rx="75" ry="18" fill="#22c55e"/>
        <!-- Small daisies on grass -->
        <circle cx="45" cy="332" r="5" fill="#ffffff"/><circle cx="45" cy="332" r="2.5" fill="#facc15"/>
        <circle cx="135" cy="338" r="5" fill="#ffffff"/><circle cx="135" cy="338" r="2.5" fill="#facc15"/>
        
        <!-- Speech Bubble -->
        <g transform="translate(20, 10)">
          <rect x="0" y="0" width="135" height="34" rx="17" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
          <polygon points="60,34 70,44 75,34" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
          <text x="67" y="22" font-family="'Sarabun', sans-serif" font-size="14" font-weight="900" fill="#fde047" text-anchor="middle">กี่โมงแล้วนะ? ⏱️</text>
        </g>

        <!-- Chibi Boy Body -->
        <!-- Shadow under feet -->
        <ellipse cx="90" cy="315" rx="30" ry="8" fill="#14532d" opacity="0.5"/>
        
        <!-- Legs & Shoes -->
        <rect x="76" y="275" width="11" height="30" rx="5" fill="#fde047"/>
        <rect x="93" y="275" width="11" height="30" rx="5" fill="#fde047"/>
        <ellipse cx="80" cy="308" rx="10" ry="6" fill="#b91c1c"/>
        <ellipse cx="98" cy="308" rx="10" ry="6" fill="#b91c1c"/>
        <!-- Shorts -->
        <rect x="72" y="245" width="36" height="34" rx="6" fill="#1e3a8a"/>

        <!-- Torso & Explorer Shirt -->
        <path d="M68 185 L112 185 L120 250 L60 250 Z" fill="#0284c7" rx="8"/>
        <!-- Neckerchief -->
        <polygon points="90,195 82,215 98,215" fill="#f97316"/>
        <circle cx="90" cy="195" r="4" fill="#facc15"/>

        <!-- Left Arm holding Staff/Clock Hand -->
        <path d="M68 190 L35 220 L42 230 L72 202 Z" fill="#0284c7"/>
        <circle cx="35" cy="225" r="7" fill="#fde047"/>

        <!-- GIANT GOLDEN HOUR HAND (Staff) -->
        <g transform="translate(30, 90)">
          <!-- Staff Pole -->
          <rect x="0" y="30" width="8" height="170" rx="4" fill="#ca8a04" stroke="#eab308" stroke-width="1.5"/>
          <!-- Pointer Arrow Top -->
          <polygon points="4,0 -16,40 24,40" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
          <circle cx="4" cy="25" r="6" fill="#e11d48"/>
          <circle cx="4" cy="40" r="14" fill="#fde047" opacity="0.3" filter="blur(4px)"/>
        </g>

        <!-- Right Arm waving -->
        <path d="M112 190 L135 170 L144 178 L118 202 Z" fill="#0284c7"/>
        <circle cx="140" cy="172" r="7" fill="#fde047"/>

        <!-- Head -->
        <circle cx="90" cy="140" r="34" fill="#fde047" stroke="#ca8a04" stroke-width="2.5"/>
        <!-- Hair (Neat Chibi style) -->
        <path d="M60 135 C58 95 122 95 120 135 C128 128 126 148 120 152 C110 115 70 115 60 135 Z" fill="#1e293b"/>
        <!-- Explorer Scout Hat -->
        <path d="M52 118 Q90 102 128 118 L138 120 Q90 92 42 120 Z" fill="#d97706"/>
        <path d="M62 116 Q90 85 118 116 Z" fill="#b45309"/>
        <circle cx="90" cy="104" r="5" fill="#facc15"/>

        <!-- Big Anime Eyes -->
        <ellipse cx="80" cy="138" rx="5" ry="7" fill="#0f172a"/>
        <circle cx="81" cy="135" r="2.5" fill="#fff"/>
        <circle cx="78" cy="141" r="1.5" fill="#fff"/>
        <ellipse cx="100" cy="138" rx="5" ry="7" fill="#0f172a"/>
        <circle cx="101" cy="135" r="2.5" fill="#fff"/>
        <circle cx="98" cy="141" r="1.5" fill="#fff"/>
        <!-- Rosy Cheeks -->
        <ellipse cx="73" cy="147" rx="5" ry="3" fill="#f43f5e" opacity="0.65"/>
        <ellipse cx="107" cy="147" rx="5" ry="3" fill="#f43f5e" opacity="0.65"/>
        <!-- Cheerful Smile -->
        <path d="M84 152 Q90 160 96 152" stroke="#b45309" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      </g>

      <!-- RIGHT: Cheerful Smiling Analog Clock Character -->
      <g transform="translate(1000, 130)">
        <!-- Ambient Golden Clock Glow -->
        <circle cx="120" cy="200" r="130" fill="#facc15" opacity="0.2" filter="blur(16px)"/>
        
        <!-- Twin Alarm Bells on Top -->
        <!-- Left Bell -->
        <ellipse cx="60" cy="90" rx="30" ry="18" transform="rotate(-30, 60, 90)" fill="#eab308" stroke="#ca8a04" stroke-width="3"/>
        <!-- Right Bell -->
        <ellipse cx="180" cy="90" rx="30" ry="18" transform="rotate(30, 180, 90)" fill="#eab308" stroke="#ca8a04" stroke-width="3"/>
        <!-- Bell Hammer handle -->
        <path d="M100 105 L120 85 L140 105" stroke="#78716c" stroke-width="5" fill="none"/>
        <circle cx="120" cy="85" r="9" fill="#e11d48"/>

        <!-- Clock Feet -->
        <polygon points="50,290 35,330 65,330" fill="#ca8a04"/>
        <polygon points="190,290 175,330 205,330" fill="#ca8a04"/>

        <!-- Clock Outer Golden Frame -->
        <circle cx="120" cy="200" r="105" fill="#f59e0b" stroke="#ca8a04" stroke-width="4"/>
        <circle cx="120" cy="200" r="96" fill="#fef08a"/>
        <!-- Clock White Dial Face -->
        <circle cx="120" cy="200" r="88" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>

        <!-- Clock 12 Hour Numbers (Strictly Clear & Legible 1-12) -->
        <text x="120" y="132" font-family="'Sarabun', sans-serif" font-weight="900" font-size="20" fill="#1e293b" text-anchor="middle">12</text>
        <text x="160" y="145" font-family="'Sarabun', sans-serif" font-weight="900" font-size="17" fill="#1e293b" text-anchor="middle">1</text>
        <text x="186" y="172" font-family="'Sarabun', sans-serif" font-weight="900" font-size="17" fill="#1e293b" text-anchor="middle">2</text>
        <text x="194" y="207" font-family="'Sarabun', sans-serif" font-weight="900" font-size="20" fill="#1e293b" text-anchor="middle">3</text>
        <text x="186" y="242" font-family="'Sarabun', sans-serif" font-weight="900" font-size="17" fill="#1e293b" text-anchor="middle">4</text>
        <text x="160" y="268" font-family="'Sarabun', sans-serif" font-weight="900" font-size="17" fill="#1e293b" text-anchor="middle">5</text>
        <text x="120" y="278" font-family="'Sarabun', sans-serif" font-weight="900" font-size="20" fill="#1e293b" text-anchor="middle">6</text>
        <text x="80" y="268" font-family="'Sarabun', sans-serif" font-weight="900" font-size="17" fill="#1e293b" text-anchor="middle">7</text>
        <text x="54" y="242" font-family="'Sarabun', sans-serif" font-weight="900" font-size="17" fill="#1e293b" text-anchor="middle">8</text>
        <text x="46" y="207" font-family="'Sarabun', sans-serif" font-weight="900" font-size="20" fill="#1e293b" text-anchor="middle">9</text>
        <text x="54" y="172" font-family="'Sarabun', sans-serif" font-weight="900" font-size="17" fill="#1e293b" text-anchor="middle">10</text>
        <text x="80" y="145" font-family="'Sarabun', sans-serif" font-weight="900" font-size="17" fill="#1e293b" text-anchor="middle">11</text>

        <!-- Hour Hand (Blue, pointing at 10) -->
        <line x1="120" y1="200" x2="82" y2="168" stroke="#0284c7" stroke-width="7" stroke-linecap="round"/>
        <!-- Minute Hand (Red, pointing at 2) -->
        <line x1="120" y1="200" x2="168" y2="160" stroke="#e11d48" stroke-width="5" stroke-linecap="round"/>
        <!-- Second Hand (Gold) -->
        <line x1="120" y1="200" x2="120" y2="140" stroke="#f59e0b" stroke-width="2" stroke-linecap="round"/>
        <!-- Center Pin -->
        <circle cx="120" cy="200" r="7" fill="#1e293b" stroke="#ffffff" stroke-width="2"/>

        <!-- Cute Anime Face on Clock (10:10 smile!) -->
        <ellipse cx="106" cy="216" rx="3.5" ry="4.5" fill="#0f172a"/>
        <circle cx="107" cy="214" r="1.5" fill="#fff"/>
        <ellipse cx="134" cy="216" rx="3.5" ry="4.5" fill="#0f172a"/>
        <circle cx="135" cy="214" r="1.5" fill="#fff"/>
        <ellipse cx="98" cy="222" rx="4" ry="2" fill="#f43f5e" opacity="0.6"/>
        <ellipse cx="142" cy="222" rx="4" ry="2" fill="#f43f5e" opacity="0.6"/>
        <path d="M114 224 Q120 230 126 224" stroke="#0f172a" stroke-width="2" fill="none" stroke-linecap="round"/>

        <!-- Floating Time Badges around Clock -->
        <g transform="translate(-15, 60)">
          <circle cx="18" cy="18" r="18" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
          <text x="18" y="24" font-family="'Sarabun', sans-serif" font-size="14" font-weight="900" fill="#38bdf8" text-anchor="middle">12</text>
        </g>
        <g transform="translate(195, 230)">
          <circle cx="18" cy="18" r="18" fill="#1e293b" stroke="#facc15" stroke-width="2"/>
          <text x="18" y="24" font-family="'Sarabun', sans-serif" font-size="13" font-weight="900" fill="#fde047" text-anchor="middle">24h</text>
        </g>
        <g transform="translate(10, 270)">
          <circle cx="15" cy="15" r="15" fill="#1e293b" stroke="#22c55e" stroke-width="2"/>
          <text x="15" y="20" font-family="'Sarabun', sans-serif" font-size="12" font-weight="900" fill="#86efac" text-anchor="middle">60m</text>
        </g>
      </g>
    `
  },

  // 2. Light Sort (Science)
  {
    id: 'light-sort',
    targetPath: path.join(rootDir, 'public', 'games', 'science', 'light-sort-cover.png'),
    titleEn: 'Light Sort',
    titleTh: 'แสงผ่านได้ไหม?',
    subTitle: 'สำรวจตัวกลางของแสง 3 ชนิด · วัตถุโปร่งใส โปร่งแสง และทึบแสง · การเดินทางและการเกิดเงา',
    curriculum: '⭐ ว 2.3 ป.4–ป.5 · วิทยาศาสตร์ (ตัวกลางของแสง)',
    pill: 'SCIENCE LIGHT LAB · ห้องทดลองแสงมหัศจรรย์',
    bgGradient: 'radial-gradient(circle at 50% 30%, #0d9488 0%, #0f766e 35%, #115e59 70%, #042f2e 100%)',
    primaryColor: '#2dd4bf',
    accentColor: '#fde047',
    glowColor: 'rgba(45, 212, 191, 0.3)',
    cornerIcon: '🔦',
    cornerText: 'KAMPAI SCIENCE · โรงเรียนบ้านคำไผ่',
    badges: [
      { text: '💎 โปร่งใส (แสงผ่านได้ 100%)', color: 'cyan' },
      { text: '🌫️ โปร่งแสง (แสงผ่านได้บางส่วน)', color: 'gold' },
      { text: '📦 ทึบแสง (แสงผ่านไม่ได้ เกิดเงา)', color: 'green' }
    ],
    svgArt: `
      <!-- LEFT: Cute Chibi Scientist Girl with Flashlight -->
      <g transform="translate(55, 140)">
        <!-- Lab Table / Platform Base -->
        <ellipse cx="95" cy="345" rx="85" ry="22" fill="#042f2e" opacity="0.6"/>
        <rect x="25" y="325" width="140" height="25" rx="10" fill="#134e4a" stroke="#2dd4bf" stroke-width="1.5"/>

        <!-- Speech Bubble -->
        <g transform="translate(25, 10)">
          <rect x="0" y="0" width="135" height="34" rx="17" fill="#0f172a" stroke="#2dd4bf" stroke-width="2"/>
          <polygon points="65,34 75,44 80,34" fill="#0f172a" stroke="#2dd4bf" stroke-width="2"/>
          <text x="67" y="22" font-family="'Sarabun', sans-serif" font-size="14" font-weight="900" fill="#a7f3d0" text-anchor="middle">ส่องไฟดูเลย! 🔦</text>
        </g>

        <!-- Girl Legs & Shoes -->
        <rect x="80" y="270" width="11" height="35" rx="5" fill="#fde047"/>
        <rect x="97" y="270" width="11" height="35" rx="5" fill="#fde047"/>
        <ellipse cx="85" cy="308" rx="10" ry="6" fill="#0284c7"/>
        <ellipse cx="102" cy="308" rx="10" ry="6" fill="#0284c7"/>

        <!-- Lab Coat & Torso -->
        <path d="M72 185 L116 185 L124 255 L64 255 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" rx="8"/>
        <!-- Inner Shirt & ID Badge -->
        <rect x="86" y="195" width="16" height="40" fill="#0d9488"/>
        <rect x="74" y="210" width="14" height="10" rx="2" fill="#3b82f6"/>

        <!-- Arms holding Giant Flashlight -->
        <path d="M72 190 L110 215 L105 225 L68 200 Z" fill="#f8fafc"/>
        <path d="M116 190 L140 215 L135 225 L110 200 Z" fill="#f8fafc"/>

        <!-- GIANT YELLOW FLASHLIGHT -->
        <g transform="translate(110, 205)">
          <!-- Flashlight Body -->
          <rect x="0" y="0" width="45" height="24" rx="6" fill="#eab308" stroke="#ca8a04" stroke-width="2"/>
          <!-- On/Off Switch -->
          <rect x="15" y="-5" width="12" height="6" rx="2" fill="#ef4444"/>
          <!-- Lamp Head Cone -->
          <polygon points="45,-4 68,-14 68,38 45,28" fill="#facc15" stroke="#ca8a04" stroke-width="2"/>
          <ellipse cx="68" cy="12" rx="4" ry="26" fill="#fef08a"/>
          
          <!-- RADIANT LIGHT BEAM PROJECTING RIGHTWARD -->
          <polygon points="72,-10 180,-40 180,64 72,34" fill="url(#beamGrad)" opacity="0.75" filter="blur(2px)"/>
          <line x1="72" y1="12" x2="190" y2="12" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.9"/>
        </g>

        <!-- Head -->
        <circle cx="94" cy="140" r="34" fill="#fde047" stroke="#ca8a04" stroke-width="2.5"/>
        <!-- Twin Buns Hair -->
        <circle cx="58" cy="115" r="16" fill="#78350f"/>
        <circle cx="130" cy="115" r="16" fill="#78350f"/>
        <path d="M64 135 C60 95 128 95 124 135 C132 128 130 148 124 152 C114 115 74 115 64 135 Z" fill="#78350f"/>
        
        <!-- Safety Goggles on Forehead -->
        <rect x="66" y="112" width="24" height="18" rx="6" fill="#06b6d4" stroke="#0891b2" stroke-width="2" opacity="0.9"/>
        <rect x="98" y="112" width="24" height="18" rx="6" fill="#06b6d4" stroke="#0891b2" stroke-width="2" opacity="0.9"/>
        <line x1="90" y1="121" x2="98" y2="121" stroke="#0891b2" stroke-width="3"/>

        <!-- Anime Eyes (Excited) -->
        <ellipse cx="84" cy="140" rx="5" ry="7" fill="#0f172a"/>
        <circle cx="85" cy="137" r="2.5" fill="#fff"/>
        <circle cx="82" cy="143" r="1.5" fill="#fff"/>
        <ellipse cx="104" cy="140" rx="5" ry="7" fill="#0f172a"/>
        <circle cx="105" cy="137" r="2.5" fill="#fff"/>
        <circle cx="102" cy="143" r="1.5" fill="#fff"/>
        <!-- Cheeks & Smile -->
        <ellipse cx="77" cy="148" rx="5" ry="3" fill="#f43f5e" opacity="0.6"/>
        <ellipse cx="111" cy="148" rx="5" ry="3" fill="#f43f5e" opacity="0.6"/>
        <path d="M88 152 Q94 160 100 152" stroke="#b45309" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      </g>

      <!-- RIGHT: 3 Medium Demonstration Objects (Clear, Translucent, Opaque) -->
      <g transform="translate(1000, 120)">
        <!-- Container card glow -->
        <rect x="0" y="20" width="230" height="340" rx="24" fill="#0f172a" opacity="0.85" stroke="#2dd4bf" stroke-width="2" filter="drop-shadow(0 10px 20px rgba(0,0,0,0.5))"/>

        <!-- 1. Transparent: Glass Cup with Water -->
        <g transform="translate(20, 35)">
          <rect x="0" y="0" width="190" height="90" rx="16" fill="rgba(45, 212, 191, 0.12)" stroke="#5eead4" stroke-width="1.5"/>
          <!-- Glass beaker graphic -->
          <path d="M25 20 L25 70 Q45 80 65 70 L65 20 Z" fill="rgba(255,255,255,0.2)" stroke="#a7f3d0" stroke-width="2.5"/>
          <ellipse cx="45" cy="45" rx="18" ry="6" fill="#38bdf8" opacity="0.6"/>
          <!-- Light passing straight through -->
          <line x1="5" y1="45" x2="85" y2="45" stroke="#fde047" stroke-width="3" stroke-dasharray="4,2"/>
          <polygon points="85,42 92,45 85,48" fill="#fde047"/>
          <!-- Text -->
          <text x="100" y="38" font-family="'Sarabun', sans-serif" font-weight="900" font-size="16" fill="#5eead4">1. วัตถุโปร่งใส</text>
          <text x="100" y="58" font-family="'Sarabun', sans-serif" font-weight="700" font-size="13" fill="#ffffff">แก้วน้ำใสแจ๋ว</text>
          <text x="100" y="74" font-family="'Sarabun', sans-serif" font-weight="600" font-size="11" fill="#bae6fd">✨ แสงผ่านได้ 100%</text>
        </g>

        <!-- 2. Translucent: Tracing Paper / Frosted Glass -->
        <g transform="translate(20, 140)">
          <rect x="0" y="0" width="190" height="90" rx="16" fill="rgba(251, 191, 36, 0.12)" stroke="#facc15" stroke-width="1.5"/>
          <!-- Frosted Sheet -->
          <rect x="25" y="20" width="40" height="50" rx="6" fill="rgba(255,255,255,0.5)" stroke="#fde047" stroke-width="2"/>
          <!-- Light ray scattered -->
          <line x1="5" y1="45" x2="25" y2="45" stroke="#fde047" stroke-width="3"/>
          <path d="M65 45 Q75 35 85 30" stroke="#fde047" stroke-width="1.5" stroke-dasharray="2,2"/>
          <path d="M65 45 L85 45" stroke="#fde047" stroke-width="2"/>
          <path d="M65 45 Q75 55 85 60" stroke="#fde047" stroke-width="1.5" stroke-dasharray="2,2"/>
          <!-- Text -->
          <text x="100" y="38" font-family="'Sarabun', sans-serif" font-weight="900" font-size="16" fill="#fde047">2. วัตถุโปร่งแสง</text>
          <text x="100" y="58" font-family="'Sarabun', sans-serif" font-weight="700" font-size="13" fill="#ffffff">กระดาษไข / หมอก</text>
          <text x="100" y="74" font-family="'Sarabun', sans-serif" font-weight="600" font-size="11" fill="#fef08a">🌫️ แสงผ่านได้บางส่วน</text>
        </g>

        <!-- 3. Opaque: Wooden Box -->
        <g transform="translate(20, 245)">
          <rect x="0" y="0" width="190" height="90" rx="16" fill="rgba(168, 85, 247, 0.12)" stroke="#c084fc" stroke-width="1.5"/>
          <!-- Solid Wooden Box -->
          <rect x="25" y="22" width="42" height="42" rx="6" fill="#b45309" stroke="#78350f" stroke-width="2"/>
          <line x1="25" y1="22" x2="67" y2="64" stroke="#78350f" stroke-width="1.5"/>
          <!-- Light blocked, Shadow cast -->
          <line x1="5" y1="43" x2="25" y2="43" stroke="#fde047" stroke-width="3"/>
          <polygon points="67,22 88,30 88,64 67,64" fill="#020617" opacity="0.6"/>
          <!-- Text -->
          <text x="100" y="38" font-family="'Sarabun', sans-serif" font-weight="900" font-size="16" fill="#c084fc">3. วัตถุทึบแสง</text>
          <text x="100" y="58" font-family="'Sarabun', sans-serif" font-weight="700" font-size="13" fill="#ffffff">กล่องไม้ / ก้อนหิน</text>
          <text x="100" y="74" font-family="'Sarabun', sans-serif" font-weight="600" font-size="11" fill="#e9d5ff">📦 บล็อกแสง เกิดเงา</text>
        </g>
      </g>

      <defs>
        <linearGradient id="beamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#fef08a" stop-opacity="0.95"/>
          <stop offset="60%" stop-color="#facc15" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
        </linearGradient>
      </defs>
    `
  },

  // 3. Moon Phases Race (Science / Astronomy)
  {
    id: 'moon-phases-race',
    targetPath: path.join(rootDir, 'public', 'games', 'science', 'moon-phases-race-cover.png'),
    titleEn: 'Moon Phases Race',
    titleTh: 'แข่งเฟสดวงจันทร์',
    subTitle: 'ซิ่งยานอวกาศจิ๋วสำรวจดวงจันทร์ · ข้างขึ้น-ข้างแรม 8 ระยะ · จันทร์เพ็ญ จันทร์เสี้ยว จันทร์ดับ',
    curriculum: '⭐ ว 3.1 ป.4–ป.5 · วิทยาศาสตร์ (ดวงจันทร์และอวกาศ)',
    pill: 'ASTRONOMY SPACE RACE · สำรวจข้างขึ้นข้างแรม',
    bgGradient: 'radial-gradient(circle at 50% 30%, #312e81 0%, #1e1b4b 35%, #0f172a 70%, #020617 100%)',
    primaryColor: '#818cf8',
    accentColor: '#fef08a',
    glowColor: 'rgba(129, 140, 248, 0.3)',
    cornerIcon: '🚀',
    cornerText: 'KAMPAI ASTRONOMY · โรงเรียนบ้านคำไผ่',
    badges: [
      { text: '🌕 จันทร์เพ็ญ (ขึ้น 15 ค่ำ)', color: 'gold' },
      { text: '🌓 จันทร์ครึ่งดวง & เสี้ยว', color: 'cyan' },
      { text: '🌑 จันทร์ดับ (แรม 15 ค่ำ)', color: 'green' }
    ],
    svgArt: `
      <!-- LEFT: Cute Chibi Astronaut in Mini Rocket Spaceship -->
      <g transform="translate(50, 135)">
        <!-- Thruster Plasma Flame -->
        <ellipse cx="40" cy="275" rx="30" ry="12" transform="rotate(45, 40, 275)" fill="#f97316" filter="blur(4px)"/>
        <polygon points="50,250 20,295 70,270" fill="#facc15"/>
        <polygon points="52,252 35,285 62,272" fill="#ffffff"/>

        <!-- Spaceship Trail Stars -->
        <circle cx="20" cy="310" r="3" fill="#38bdf8"/>
        <circle cx="10" cy="325" r="2" fill="#fde047"/>
        <circle cx="35" cy="335" r="2.5" fill="#ffffff"/>

        <!-- Speech Bubble -->
        <g transform="translate(20, 15)">
          <rect x="0" y="0" width="140" height="34" rx="17" fill="#0f172a" stroke="#818cf8" stroke-width="2"/>
          <polygon points="60,34 70,44 75,34" fill="#0f172a" stroke="#818cf8" stroke-width="2"/>
          <text x="70" y="22" font-family="'Sarabun', sans-serif" font-size="14" font-weight="900" fill="#fde047" text-anchor="middle">ซิ่งสู่ดวงจันทร์! 🚀</text>
        </g>

        <!-- RETRO-CHIBI ROCKET SHIP -->
        <g transform="translate(60, 110)">
          <!-- Rocket Wings / Fins -->
          <polygon points="0,110 -25,145 10,135" fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>
          <polygon points="70,110 95,145 60,135" fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>
          
          <!-- Main Fuselage -->
          <path d="M35 10 C0 60 5 130 35 140 C65 130 70 60 35 10 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2.5"/>
          <!-- Red Nose Cone -->
          <path d="M35 10 C22 30 20 45 35 45 C50 45 48 30 35 10 Z" fill="#ef4444"/>
          <!-- Body Stripe -->
          <rect x="18" y="110" width="34" height="12" rx="3" fill="#3b82f6"/>

          <!-- Cockpit Bubble Window -->
          <circle cx="35" cy="72" r="24" fill="#38bdf8" stroke="#0284c7" stroke-width="2.5"/>
          <circle cx="35" cy="72" r="20" fill="#0284c7"/>

          <!-- Cute Chibi Astronaut Inside Cockpit -->
          <!-- Helmet -->
          <circle cx="35" cy="70" r="16" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
          <ellipse cx="35" cy="70" rx="12" ry="9" fill="#fde047" stroke="#ca8a04" stroke-width="1"/>
          <!-- Helmet Antenna -->
          <line x1="35" y1="54" x2="35" y2="48" stroke="#cbd5e1" stroke-width="2"/>
          <circle cx="35" cy="47" r="3" fill="#ef4444"/>
          <!-- Astronaut Big Eyes -->
          <circle cx="31" cy="69" r="2.5" fill="#0f172a"/>
          <circle cx="39" cy="69" r="2.5" fill="#0f172a"/>
          <circle cx="32" cy="68" r="1" fill="#fff"/>
          <circle cx="40" cy="68" r="1" fill="#fff"/>
          <!-- Happy Smile -->
          <path d="M33 74 Q35 77 37 74" stroke="#0f172a" stroke-width="1.5" fill="none"/>

          <!-- Waving Glove Hand outside -->
          <circle cx="66" cy="65" r="7" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
        </g>
      </g>

      <!-- RIGHT: Glowing Moon Orbit & The 4 Key Lunar Phases -->
      <g transform="translate(990, 120)">
        <!-- Ambient Lunar Glow -->
        <circle cx="125" cy="180" r="120" fill="#fef08a" opacity="0.18" filter="blur(20px)"/>

        <!-- Orbital Ellipse Line -->
        <ellipse cx="125" cy="180" rx="105" ry="90" fill="none" stroke="#818cf8" stroke-width="2" stroke-dasharray="6,4" opacity="0.6"/>

        <!-- CENTER: Giant Smiling Full Moon 🌕 -->
        <circle cx="125" cy="180" r="62" fill="#fef08a" stroke="#facc15" stroke-width="3"/>
        <!-- Moon Craters (Soft gold) -->
        <circle cx="100" cy="155" r="10" fill="#fde047" opacity="0.7"/>
        <circle cx="148" cy="158" r="8" fill="#fde047" opacity="0.7"/>
        <circle cx="145" cy="205" r="12" fill="#fde047" opacity="0.7"/>
        <circle cx="95" cy="205" r="7" fill="#fde047" opacity="0.7"/>

        <!-- Smiling Anime Face on Full Moon -->
        <ellipse cx="113" cy="178" rx="4" ry="5.5" fill="#713f12"/>
        <circle cx="114" cy="176" r="1.5" fill="#fff"/>
        <ellipse cx="137" cy="178" rx="4" ry="5.5" fill="#713f12"/>
        <circle cx="138" cy="176" r="1.5" fill="#fff"/>
        <!-- Cheeks & Smile -->
        <ellipse cx="104" cy="185" rx="5" ry="3" fill="#f43f5e" opacity="0.65"/>
        <ellipse cx="146" cy="185" rx="5" ry="3" fill="#f43f5e" opacity="0.65"/>
        <path d="M120 188 Q125 195 130 188" stroke="#713f12" stroke-width="2.5" fill="none" stroke-linecap="round"/>

        <!-- Center Label -->
        <rect x="80" y="248" width="90" height="26" rx="13" fill="#0f172a" stroke="#facc15" stroke-width="1.5"/>
        <text x="125" y="265" font-family="'Sarabun', sans-serif" font-weight="900" font-size="13" fill="#fef08a" text-anchor="middle">จันทร์เพ็ญ 15 ค่ำ</text>

        <!-- ORBITING MOON PHASES AROUND -->
        <!-- 1. Top: First Quarter (จันทร์ครึ่งดวง) -->
        <g transform="translate(105, 65)">
          <circle cx="20" cy="20" r="20" fill="#1e1b4b" stroke="#818cf8" stroke-width="1.5"/>
          <path d="M20 0 A20 20 0 0 1 20 40 Z" fill="#fde047"/>
          <text x="20" y="-8" font-family="'Sarabun', sans-serif" font-size="11" font-weight="800" fill="#a5b4fc" text-anchor="middle">ขึ้น 8 ค่ำ</text>
        </g>

        <!-- 2. Right: Waxing Crescent (จันทร์เสี้ยว) -->
        <g transform="translate(200, 160)">
          <circle cx="20" cy="20" r="20" fill="#1e1b4b" stroke="#818cf8" stroke-width="1.5"/>
          <path d="M20 0 A20 20 0 0 1 20 40 A14 20 0 0 0 20 0 Z" fill="#fde047"/>
          <text x="50" y="24" font-family="'Sarabun', sans-serif" font-size="11" font-weight="800" fill="#fef08a">เสี้ยว</text>
        </g>

        <!-- 3. Bottom: New Moon (จันทร์ดับ) -->
        <g transform="translate(105, 290)">
          <circle cx="20" cy="20" r="20" fill="#0f172a" stroke="#6366f1" stroke-width="2"/>
          <circle cx="20" cy="20" r="18" fill="#020617"/>
          <text x="20" y="48" font-family="'Sarabun', sans-serif" font-size="11" font-weight="800" fill="#c7d2fe" text-anchor="middle">แรม 15 ค่ำ</text>
        </g>

        <!-- 4. Left: Waning Crescent -->
        <g transform="translate(5, 160)">
          <circle cx="20" cy="20" r="20" fill="#1e1b4b" stroke="#818cf8" stroke-width="1.5"/>
          <path d="M20 0 A20 20 0 0 0 20 40 A14 20 0 0 1 20 0 Z" fill="#fde047"/>
        </g>

        <!-- Cute Saturn in top corner -->
        <g transform="translate(190, 40)">
          <ellipse cx="20" cy="20" rx="26" ry="7" transform="rotate(-20, 20, 20)" fill="none" stroke="#f472b6" stroke-width="3"/>
          <circle cx="20" cy="20" r="12" fill="#fb7185"/>
        </g>
      </g>
    `
  },

  // 4. Maglev Rush (Science / Physics)
  {
    id: 'maglev-rush',
    targetPath: path.join(rootDir, 'public', 'games', 'science', 'maglev-rush', 'cover.png'),
    titleEn: 'Maglev Rush',
    titleTh: 'รถไฟแม่เหล็กความเร็วสูง',
    subTitle: 'พลังแม่เหล็กลอยตัวความเร็วสูง · แรงผลักขั้วเหมือน แรงดูดขั้วต่าง · สลับขั้วเร่งความเร็ว 500 KM/H',
    curriculum: '⭐ ว 2.2 ป.1–ป.6 · วิทยาศาสตร์ (แรงและแม่เหล็ก)',
    pill: 'HIGH-SPEED MAGLEV SIMULATOR · วิ่งฉิวไร้แรงเสียดทาน',
    bgGradient: 'radial-gradient(circle at 50% 30%, #1e40af 0%, #1e3a8a 35%, #0f172a 70%, #030712 100%)',
    primaryColor: '#38bdf8',
    accentColor: '#fbbf24',
    glowColor: 'rgba(56, 189, 248, 0.35)',
    cornerIcon: '🚅',
    cornerText: 'KAMPAI PHYSICS · โรงเรียนบ้านคำไผ่',
    badges: [
      { text: '🧲 ขั้วแม่เหล็ก N & S', color: 'cyan' },
      { text: '⚡ ลอยตัวเหนือราง 500 KM/H', color: 'gold' },
      { text: '🎮 แข่งขันความเร็ว 2 คน', color: 'green' }
    ],
    svgArt: `
      <!-- LEFT: High-Speed Futuristic Maglev Bullet Train -->
      <g transform="translate(45, 140)">
        <!-- Perspective Rail Track Base -->
        <polygon points="10,345 220,345 180,270 50,270" fill="#0f172a" stroke="#1e293b" stroke-width="2"/>
        <line x1="30" y1="345" x2="65" y2="270" stroke="#38bdf8" stroke-width="3"/>
        <line x1="200" y1="345" x2="165" y2="270" stroke="#38bdf8" stroke-width="3"/>

        <!-- Magnetic Levitation Cushion Glow -->
        <ellipse cx="115" cy="275" rx="90" ry="18" fill="#38bdf8" opacity="0.5" filter="blur(8px)"/>
        <!-- Electric sparks under train -->
        <path d="M40 270 L55 260 L50 280 L65 270" stroke="#facc15" stroke-width="2.5" fill="none"/>
        <path d="M190 270 L175 260 L180 280 L165 270" stroke="#38bdf8" stroke-width="2.5" fill="none"/>

        <!-- Speedometer HUD Badge -->
        <g transform="translate(35, 15)">
          <rect x="0" y="0" width="160" height="34" rx="17" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
          <text x="80" y="23" font-family="'Sarabun', sans-serif" font-size="15" font-weight="900" fill="#38bdf8" text-anchor="middle">⚡ 500 KM/H</text>
        </g>

        <!-- STREAMLINED BULLET TRAIN NOSE (Front-3/4 View) -->
        <g transform="translate(30, 85)">
          <!-- Train Main Body -->
          <path d="M85 20 C45 45 20 95 22 175 L148 175 C150 95 125 45 85 20 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2.5"/>
          
          <!-- Aerodynamic Blue Side Stripes -->
          <path d="M22 135 L45 135 L42 175 L22 175 Z" fill="#0284c7"/>
          <path d="M148 135 L125 135 L128 175 L148 175 Z" fill="#0284c7"/>

          <!-- Cockpit Windshield (Glowing Cyan Tint) -->
          <path d="M85 45 C55 65 40 95 40 118 L130 118 C130 95 115 65 85 45 Z" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
          <ellipse cx="85" cy="82" rx="35" ry="16" fill="#38bdf8" opacity="0.4"/>

          <!-- Front LED Headlights -->
          <ellipse cx="48" cy="150" rx="8" ry="5" fill="#fef08a" stroke="#facc15" stroke-width="1.5"/>
          <ellipse cx="122" cy="150" rx="8" ry="5" fill="#fef08a" stroke="#facc15" stroke-width="1.5"/>

          <!-- Dual Magnet Badges on Train Front -->
          <rect x="42" y="158" width="40" height="18" rx="5" fill="#ef4444" stroke="#ffffff" stroke-width="1.5"/>
          <text x="62" y="172" font-family="'Sarabun', sans-serif" font-weight="900" font-size="12" fill="#ffffff" text-anchor="middle">N เหนือ</text>

          <rect x="88" y="158" width="40" height="18" rx="5" fill="#3b82f6" stroke="#ffffff" stroke-width="1.5"/>
          <text x="108" y="172" font-family="'Sarabun', sans-serif" font-weight="900" font-size="12" fill="#ffffff" text-anchor="middle">S ใต้</text>
        </g>
      </g>

      <!-- RIGHT: Friendly Cartoon N & S Magnet Characters & Collectibles -->
      <g transform="translate(1000, 120)">
        <!-- Ambient Magnet Sparkles -->
        <circle cx="115" cy="170" r="120" fill="#38bdf8" opacity="0.15" filter="blur(20px)"/>

        <!-- Magnetic Force Arcs between N and S -->
        <path d="M70 120 Q120 165 70 210" stroke="#facc15" stroke-width="3" fill="none" stroke-dasharray="5,3"/>
        <path d="M150 120 Q100 165 150 210" stroke="#38bdf8" stroke-width="3" fill="none" stroke-dasharray="5,3"/>

        <!-- 1. TOP: Friendly Cartoon N-Pole Magnet (Red) -->
        <g transform="translate(45, 45)">
          <rect x="0" y="0" width="130" height="65" rx="16" fill="#ef4444" stroke="#b91c1c" stroke-width="3"/>
          <text x="35" y="44" font-family="'Sarabun', sans-serif" font-weight="900" font-size="34" fill="#ffffff">N</text>
          
          <!-- Cute Anime Face on Magnet -->
          <ellipse cx="80" cy="30" rx="4" ry="5.5" fill="#0f172a"/>
          <circle cx="81" cy="28" r="1.5" fill="#fff"/>
          <ellipse cx="102" cy="30" rx="4" ry="5.5" fill="#0f172a"/>
          <circle cx="103" cy="28" r="1.5" fill="#fff"/>
          <ellipse cx="73" cy="36" rx="4" ry="2" fill="#fbcfe8"/>
          <ellipse cx="109" cy="36" rx="4" ry="2" fill="#fbcfe8"/>
          <path d="M86 42 Q91 48 96 42" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round"/>

          <!-- Label -->
          <rect x="15" y="-12" width="100" height="20" rx="10" fill="#0f172a" stroke="#ef4444" stroke-width="1.5"/>
          <text x="65" y="2" font-family="'Sarabun', sans-serif" font-weight="800" font-size="11" fill="#fca5a5" text-anchor="middle">ขั้วเหนือ ⚡</text>
        </g>

        <!-- 2. BOTTOM: Friendly Cartoon S-Pole Magnet (Blue) -->
        <g transform="translate(45, 195)">
          <rect x="0" y="0" width="130" height="65" rx="16" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/>
          <text x="35" y="44" font-family="'Sarabun', sans-serif" font-weight="900" font-size="34" fill="#ffffff">S</text>

          <!-- Cute Anime Face on Magnet -->
          <ellipse cx="80" cy="30" rx="4" ry="5.5" fill="#0f172a"/>
          <circle cx="81" cy="28" r="1.5" fill="#fff"/>
          <ellipse cx="102" cy="30" rx="4" ry="5.5" fill="#0f172a"/>
          <circle cx="103" cy="28" r="1.5" fill="#fff"/>
          <ellipse cx="73" cy="36" rx="4" ry="2" fill="#bfdbfe"/>
          <ellipse cx="109" cy="36" rx="4" ry="2" fill="#bfdbfe"/>
          <path d="M86 42 Q91 48 96 42" stroke="#ffffff" stroke-width="2.5" fill="none" stroke-linecap="round"/>

          <!-- Label -->
          <rect x="15" y="55" width="100" height="20" rx="10" fill="#0f172a" stroke="#3b82f6" stroke-width="1.5"/>
          <text x="65" y="69" font-family="'Sarabun', sans-serif" font-weight="800" font-size="11" fill="#93c5fd" text-anchor="middle">ขั้วใต้ 🧲</text>
        </g>

        <!-- Floating Magnetic Collectible Bubbles -->
        <!-- Nail Fe -->
        <g transform="translate(0, 135)">
          <circle cx="20" cy="20" r="22" fill="#1e293b" stroke="#facc15" stroke-width="2"/>
          <text x="20" y="27" font-size="20" text-anchor="middle">🔩</text>
          <text x="20" y="52" font-family="'Sarabun', sans-serif" font-size="10" font-weight="800" fill="#fde047" text-anchor="middle">Fe เหล็ก</text>
        </g>
        <!-- Coin Ni -->
        <g transform="translate(180, 135)">
          <circle cx="20" cy="20" r="22" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
          <text x="20" y="27" font-size="20" text-anchor="middle">🪙</text>
          <text x="20" y="52" font-family="'Sarabun', sans-serif" font-size="10" font-weight="800" fill="#7dd3fc" text-anchor="middle">Ni นิกเกิล</text>
        </g>
      </g>
    `
  },

  // 5. Animal Feast (Science / Biology)
  {
    id: 'animal-feast',
    targetPath: path.join(rootDir, 'public', 'games', 'science', 'animal-feast', 'cover.png'),
    titleEn: 'Animal Feast',
    titleTh: 'ยอดนักป้อนอาหารสัตว์',
    subTitle: 'เรียนรู้ประเภทอาหารของสัตว์ · สัตว์กินพืช สัตว์กินเนื้อ และสัตว์กินทั้งพืชและเนื้อ · สวนสัตว์แสนสนุก',
    curriculum: '⭐ ว 1.2 ป.1–ป.3 · วิทยาศาสตร์ (สิ่งมีชีวิตและโซ่อาหาร)',
    pill: 'ANIMAL DIET & FEEDING ADVENTURE · สวนสัตว์หรรษา',
    bgGradient: 'radial-gradient(circle at 50% 30%, #059669 0%, #047857 35%, #064e3b 70%, #022c22 100%)',
    primaryColor: '#34d399',
    accentColor: '#fde047',
    glowColor: 'rgba(52, 211, 153, 0.3)',
    cornerIcon: '🦁',
    cornerText: 'KAMPAI BIOLOGY · โรงเรียนบ้านคำไผ่',
    badges: [
      { text: '🥕 สัตว์กินพืช (Herbivore)', color: 'green' },
      { text: '🥩 สัตว์กินเนื้อ (Carnivore)', color: 'gold' },
      { text: '🍌 สัตว์กินพืชและเนื้อ (Omnivore)', color: 'cyan' }
    ],
    svgArt: `
      <!-- LEFT: Cute Chibi Zoo Feeder Child with Food Basket -->
      <g transform="translate(55, 140)">
        <!-- Grassy Ground Base -->
        <ellipse cx="90" cy="340" rx="85" ry="22" fill="#022c22" opacity="0.6"/>
        <path d="M15 330 C40 310 140 310 165 330 C175 350 155 365 90 365 C25 365 5 350 15 330 Z" fill="#15803d"/>
        <ellipse cx="90" cy="334" rx="70" ry="16" fill="#22c55e"/>

        <!-- Speech Bubble -->
        <g transform="translate(20, 10)">
          <rect x="0" y="0" width="145" height="34" rx="17" fill="#0f172a" stroke="#34d399" stroke-width="2"/>
          <polygon points="65,34 75,44 80,34" fill="#0f172a" stroke="#34d399" stroke-width="2"/>
          <text x="72" y="22" font-family="'Sarabun', sans-serif" font-size="14" font-weight="900" fill="#fde047" text-anchor="middle">ได้เวลากินแล้ว! 🍽️</text>
        </g>

        <!-- Child Legs & Safari Boots -->
        <rect x="76" y="275" width="11" height="30" rx="5" fill="#fde047"/>
        <rect x="93" y="275" width="11" height="30" rx="5" fill="#fde047"/>
        <ellipse cx="80" cy="308" rx="10" ry="6" fill="#78350f"/>
        <ellipse cx="98" cy="308" rx="10" ry="6" fill="#78350f"/>
        <!-- Shorts -->
        <rect x="72" y="245" width="36" height="34" rx="6" fill="#15803d"/>

        <!-- Safari Vest & Shirt -->
        <path d="M68 185 L112 185 L120 250 L60 250 Z" fill="#f59e0b" rx="8"/>
        <!-- Khaki Vest Pockets -->
        <rect x="66" y="195" width="16" height="45" rx="3" fill="#d97706"/>
        <rect x="98" y="195" width="16" height="45" rx="3" fill="#d97706"/>
        <circle cx="90" cy="205" r="4" fill="#ffffff"/>

        <!-- Left Hand holding GIANT FOOD BASKET -->
        <g transform="translate(10, 195)">
          <!-- Woven Basket -->
          <polygon points="10,40 5 80 45 80 40 40" fill="#a16207" stroke="#713f12" stroke-width="2"/>
          <!-- Fresh Carrot sticking out -->
          <polygon points="12,18 20,42 16,42" fill="#ea580c"/>
          <path d="M12 18 Q8 10 14 6" stroke="#22c55e" stroke-width="2.5" fill="none"/>
          <!-- Meat Drumstick sticking out -->
          <circle cx="34" cy="28" r="9" fill="#dc2626"/>
          <rect x="30" y="32" width="8" height="15" fill="#fef2f2"/>
          <!-- Banana sticking out -->
          <path d="M22 25 Q32 15 36 28" stroke="#facc15" stroke-width="5" stroke-linecap="round" fill="none"/>
        </g>

        <!-- Right Arm waving happily -->
        <path d="M112 190 L135 170 L144 178 L118 202 Z" fill="#f59e0b"/>
        <circle cx="140" cy="172" r="7" fill="#fde047"/>

        <!-- Head -->
        <circle cx="90" cy="140" r="34" fill="#fde047" stroke="#ca8a04" stroke-width="2.5"/>
        <!-- Hair -->
        <path d="M60 135 C58 95 122 95 120 135 C128 128 126 148 120 152 C110 115 70 115 60 135 Z" fill="#451a03"/>

        <!-- Safari Pith Helmet -->
        <path d="M50 118 Q90 100 130 118 L140 120 Q90 90 40 120 Z" fill="#ca8a04"/>
        <path d="M60 116 Q90 82 120 116 Z" fill="#a16207"/>
        <circle cx="90" cy="102" r="5" fill="#22c55e"/>

        <!-- Anime Eyes -->
        <ellipse cx="80" cy="138" rx="5" ry="7" fill="#0f172a"/>
        <circle cx="81" cy="135" r="2.5" fill="#fff"/>
        <circle cx="78" cy="141" r="1.5" fill="#fff"/>
        <ellipse cx="100" cy="138" rx="5" ry="7" fill="#0f172a"/>
        <circle cx="101" cy="135" r="2.5" fill="#fff"/>
        <circle cx="98" cy="141" r="1.5" fill="#fff"/>
        <!-- Cheeks & Smile -->
        <ellipse cx="73" cy="147" rx="5" ry="3" fill="#f43f5e" opacity="0.65"/>
        <ellipse cx="107" cy="147" rx="5" ry="3" fill="#f43f5e" opacity="0.65"/>
        <path d="M84 152 Q90 160 96 152" stroke="#b45309" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      </g>

      <!-- RIGHT: Trio of Adorable Animals (Rabbit, Lion, Monkey) -->
      <g transform="translate(990, 115)">
        <!-- Safari Wooden Board Container -->
        <rect x="0" y="25" width="240" height="345" rx="24" fill="#0f172a" opacity="0.85" stroke="#34d399" stroke-width="2" filter="drop-shadow(0 10px 20px rgba(0,0,0,0.5))"/>

        <!-- 1. TOP: Cute White Rabbit (Herbivore กินพืช) -->
        <g transform="translate(18, 40)">
          <rect x="0" y="0" width="204" height="92" rx="16" fill="rgba(34, 197, 94, 0.15)" stroke="#4ade80" stroke-width="1.5"/>
          <!-- Rabbit Head & Long Ears -->
          <ellipse cx="40" cy="18" rx="7" ry="18" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
          <ellipse cx="40" cy="18" rx="4" ry="14" fill="#f472b6"/>
          <ellipse cx="56" cy="18" rx="7" ry="18" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
          <ellipse cx="56" cy="18" rx="4" ry="14" fill="#f472b6"/>
          <!-- Head -->
          <circle cx="48" cy="45" r="22" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5"/>
          <circle cx="42" cy="42" r="3" fill="#0f172a"/><circle cx="43" cy="41" r="1" fill="#fff"/>
          <circle cx="54" cy="42" r="3" fill="#0f172a"/><circle cx="55" cy="41" r="1" fill="#fff"/>
          <polygon points="48,48 45,46 51,46" fill="#f472b6"/>
          <!-- Chewing a big carrot 🥕 -->
          <polygon points="62,52 82,62 78,66" fill="#ea580c"/>
          <path d="M80 64 L86 68" stroke="#22c55e" stroke-width="2"/>
          <!-- Text -->
          <text x="96" y="36" font-family="'Sarabun', sans-serif" font-weight="900" font-size="15" fill="#4ade80">🐰 กระต่าย (กินพืช)</text>
          <text x="96" y="56" font-family="'Sarabun', sans-serif" font-weight="700" font-size="12" fill="#ffffff">ชอบกินแครอท &amp; หญ้า</text>
          <text x="96" y="74" font-family="'Sarabun', sans-serif" font-weight="600" font-size="11" fill="#bbf7d0">🥕 Herbivore สัตว์กินพืช</text>
        </g>

        <!-- 2. MIDDLE: Cute Golden Lion Cub (Carnivore กินเนื้อ) -->
        <g transform="translate(18, 145)">
          <rect x="0" y="0" width="204" height="92" rx="16" fill="rgba(245, 158, 11, 0.15)" stroke="#facc15" stroke-width="1.5"/>
          <!-- Lion Fluffy Mane -->
          <circle cx="48" cy="46" r="26" fill="#d97706"/>
          <!-- Lion Face -->
          <circle cx="48" cy="46" r="19" fill="#fde047"/>
          <circle cx="35" cy="28" r="6" fill="#d97706"/><circle cx="35" cy="28" r="3" fill="#fde047"/>
          <circle cx="61" cy="28" r="6" fill="#d97706"/><circle cx="61" cy="28" r="3" fill="#fde047"/>
          <!-- Eyes & Nose -->
          <circle cx="42" cy="44" r="3" fill="#0f172a"/><circle cx="43" cy="43" r="1" fill="#fff"/>
          <circle cx="54" cy="44" r="3" fill="#0f172a"/><circle cx="55" cy="43" r="1" fill="#fff"/>
          <polygon points="48,50 45,48 51,48" fill="#78350f"/>
          <!-- Cartoon Meat Drumstick 🥩 -->
          <g transform="translate(68, 48)">
            <circle cx="10" cy="10" r="9" fill="#dc2626"/>
            <rect x="10" y="8" width="12" height="4" rx="2" fill="#fef2f2"/>
          </g>
          <!-- Text -->
          <text x="96" y="36" font-family="'Sarabun', sans-serif" font-weight="900" font-size="15" fill="#fde047">🦁 สิงโต (กินเนื้อ)</text>
          <text x="96" y="56" font-family="'Sarabun', sans-serif" font-weight="700" font-size="12" fill="#ffffff">ชอบกินเนื้อ &amp; ปลา</text>
          <text x="96" y="74" font-family="'Sarabun', sans-serif" font-weight="600" font-size="11" fill="#fef08a">🥩 Carnivore สัตว์กินเนื้อ</text>
        </g>

        <!-- 3. BOTTOM: Cheerful Brown Monkey (Omnivore กินทั้งพืชและเนื้อ) -->
        <g transform="translate(18, 250)">
          <rect x="0" y="0" width="204" height="92" rx="16" fill="rgba(56, 189, 248, 0.15)" stroke="#38bdf8" stroke-width="1.5"/>
          <!-- Monkey Big Round Ears -->
          <circle cx="28" cy="46" r="10" fill="#92400e"/><circle cx="28" cy="46" r="5" fill="#fde047"/>
          <circle cx="68" cy="46" r="10" fill="#92400e"/><circle cx="68" cy="46" r="5" fill="#fde047"/>
          <!-- Monkey Head -->
          <circle cx="48" cy="46" r="20" fill="#92400e"/>
          <ellipse cx="48" cy="49" rx="14" ry="12" fill="#fed7aa"/>
          <!-- Eyes & Mouth -->
          <circle cx="43" cy="44" r="2.5" fill="#0f172a"/>
          <circle cx="53" cy="44" r="2.5" fill="#0f172a"/>
          <path d="M44 54 Q48 59 52 54" stroke="#78350f" stroke-width="2" fill="none"/>
          <!-- Yellow Banana 🍌 -->
          <path d="M68 50 Q78 40 84 52" stroke="#facc15" stroke-width="5" stroke-linecap="round" fill="none"/>
          <!-- Text -->
          <text x="96" y="36" font-family="'Sarabun', sans-serif" font-weight="900" font-size="15" fill="#38bdf8">🐒 ลิง (กินพืช+เนื้อ)</text>
          <text x="96" y="56" font-family="'Sarabun', sans-serif" font-weight="700" font-size="12" fill="#ffffff">กินกล้วย แมลง &amp; ไข่</text>
          <text x="96" y="74" font-family="'Sarabun', sans-serif" font-weight="600" font-size="11" fill="#bae6fd">🍌 Omnivore กินพืช+สัตว์</text>
        </g>
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
    font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: ${cover.bgGradient};
    position: relative;
    color: #fff;
  }
  .grid-bg {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .glow {
    position: absolute;
    top: -70px;
    left: 50%;
    transform: translateX(-50%);
    width: 900px;
    height: 480px;
    background: radial-gradient(circle, ${cover.glowColor} 0%, transparent 70%);
    filter: blur(55px);
  }

  /* Safe zone container (strictly centered within 60% vertical safe zone, Y: 190px - 530px) */
  .content-wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 820px;
    height: 330px;
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
    letter-spacing: 0.6px;
    margin-bottom: 8px;
  }
  .top-pill span.dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${cover.primaryColor};
    box-shadow: 0 0 8px ${cover.primaryColor};
  }

  .title-en {
    font-size: 60px;
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -0.5px;
    background: linear-gradient(180deg, #ffffff 25%, #f1f5f9 65%, ${cover.primaryColor} 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 6px 16px rgba(0,0,0,0.7));
    margin-bottom: 2px;
  }

  .title-th {
    font-size: 42px;
    font-weight: 900;
    color: ${cover.accentColor};
    text-shadow: 0 0 20px rgba(0,0,0,0.6), 0 4px 10px rgba(0,0,0,0.9);
    margin-bottom: 12px;
  }

  .badges-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-bottom: 12px;
  }
  .badge-chip {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(15, 23, 42, 0.90);
    border: 1.5px solid rgba(255, 255, 255, 0.25);
    padding: 7px 16px;
    border-radius: 999px;
    font-size: 15px;
    font-weight: 700;
    color: #f1f5f9;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.45);
  }
  .badge-chip.gold { border-color: rgba(251, 191, 36, 0.7); color: #fef08a; }
  .badge-chip.cyan { border-color: rgba(56, 189, 248, 0.7); color: #bae6fd; }
  .badge-chip.green { border-color: rgba(34, 197, 94, 0.7); color: #bbf7d0; }

  .subtitle {
    font-size: 16px;
    font-weight: 600;
    color: #e2e8f0;
    background: rgba(15, 23, 42, 0.75);
    padding: 6px 22px;
    border-radius: 999px;
    border: 1px solid rgba(255, 255, 255, 0.15);
  }

  /* Top corner badges */
  .corner-badge {
    position: absolute;
    top: 26px;
    left: 36px;
    display: flex;
    align-items: center;
    gap: 10px;
    z-index: 30;
  }
  .corner-logo {
    width: 38px;
    height: 38px;
    background: linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05));
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }
  .corner-text {
    font-size: 15px;
    font-weight: 800;
    color: #e2e8f0;
    text-shadow: 0 2px 4px rgba(0,0,0,0.8);
  }
  .corner-curriculum {
    position: absolute;
    top: 26px;
    right: 36px;
    font-size: 15px;
    font-weight: 700;
    color: #fde047;
    background: rgba(15, 23, 42, 0.75);
    border: 1.5px solid rgba(251, 191, 36, 0.5);
    padding: 6px 18px;
    border-radius: 999px;
    z-index: 30;
  }
</style>
</head>
<body>
  <div class="grid-bg"></div>
  <div class="glow"></div>

  <div class="corner-badge">
    <div class="corner-logo">${cover.cornerIcon}</div>
    <div class="corner-text">${cover.cornerText}</div>
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
  console.log('🚀 Starting studio cover rendering for M1 (5 covers)...');
  const browser = await chromium.launch({ headless: true });
  const tempDir = path.join(rootDir, 'scripts', 'temp-m1-covers');
  fs.mkdirSync(tempDir, { recursive: true });

  for (const c of COVERS) {
    console.log(`\n🎨 Rendering cover: [${c.id}] -> ${c.targetPath}`);
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1
    });

    const html = buildHtml(c);
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(400);

    const tempSrcPath = path.join(tempDir, `${c.id}-source.png`);
    await page.screenshot({
      path: tempSrcPath,
      type: 'png',
      clip: { x: 0, y: 0, width: 1280, height: 720 }
    });
    console.log(`📸 Rendered raw source: ${tempSrcPath}`);
    await page.close();

    // Ensure target directory exists
    const targetDir = path.dirname(c.targetPath);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    // Process through make-cover pipeline (sharp 1280x720 full bleed compression)
    console.log(`⚙️  Processing through make-cover pipeline...`);
    await sharp(tempSrcPath)
      .resize(1280, 720, { fit: 'cover', position: 'centre' })
      .png({ compressionLevel: 8 })
      .toFile(c.targetPath);

    const meta = await sharp(c.targetPath).metadata();
    const stat = fs.statSync(c.targetPath);
    console.log(`✅ Saved: ${c.targetPath} (${meta.width}x${meta.height}, ${Math.round(stat.size / 1024)} KB)`);
  }

  await browser.close();

  // Clean up temp dir
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    console.log('🧹 Cleaned up temporary source files.');
  }

  console.log('\n🎉 ALL 5 M1 COVERS GENERATED & PROCESSED SUCCESSFULLY!');
}

renderAll().catch(err => {
  console.error('❌ Render error:', err);
  process.exit(1);
});
