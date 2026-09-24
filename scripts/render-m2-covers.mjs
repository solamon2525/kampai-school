import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const COVERS = [
  {
    slug: 'follow-instructions-lab',
    targetDir: path.join(rootDir, 'public', 'games', 'english'),
    filename: 'follow-instructions-lab-cover.png',
    titleEn: 'Follow Instructions Lab',
    titleTh: 'ห้องทดลองทำตามคำสั่ง',
    subTitle: 'ฟังคำสั่งเสียงภาษาอังกฤษ · สัมผัสรูปทรงตามลำดับ · วงกลม สี่เหลี่ยม สามเหลี่ยม',
    curriculum: '⭐ ต 1.1 ป.3–4 · คำสั่งภาษาอังกฤษ',
    pill: 'INTERACTIVE ENGLISH LISTENING & SHAPES LAB',
    bgGradient: 'radial-gradient(circle at 50% 40%, #4338ca 0%, #312e81 50%, #0f172a 100%)',
    primaryColor: '#c084fc',
    accentColor: '#fde047',
    glowColor: 'rgba(168, 85, 247, 0.35)',
    cornerIcon: '🇬🇧',
    cornerText: 'KAMPAI ENGLISH · โรงเรียนบ้านคำไผ่',
    badges: [
      { text: '🔴 Red Circle · 🟦 Blue Square · 🔺 Green Triangle', color: 'gold' },
      { text: '🎧 เสียงอ่านคำสั่ง US/UK', color: 'cyan' },
      { text: '⭐ ฝึกปฏิบัติตามลำดับขั้น', color: 'green' }
    ],
    svgArt: `
      <!-- Left: Chibi Kid Scientist with Lab Goggles & Pointer -->
      <g transform="translate(65, 115)">
        <!-- Floor Glow -->
        <ellipse cx="65" cy="185" rx="55" ry="14" fill="#a855f7" opacity="0.3" filter="blur(8px)"/>
        
        <!-- Speech/Task Bubble -->
        <g transform="translate(10, -12)">
          <rect x="0" y="0" width="125" height="32" rx="16" fill="#0f172a" stroke="#c084fc" stroke-width="2"/>
          <polygon points="45,32 55,42 60,32" fill="#0f172a" stroke="#c084fc" stroke-width="2"/>
          <text x="62" y="21" font-size="13" font-weight="900" fill="#fde047" text-anchor="middle">Touch the circle! 🔴</text>
        </g>

        <!-- Head -->
        <circle cx="65" cy="75" r="32" fill="#fde047" stroke="#ca8a04" stroke-width="2.5"/>
        <!-- Hair (Spiky anime haircut) -->
        <path d="M35 65 C35 40 95 40 95 65 C102 60 100 75 95 80 C85 52 45 52 35 65 Z" fill="#312e81"/>
        <path d="M45 42 L55 25 L65 42 L75 25 L85 45 Z" fill="#312e81"/>
        
        <!-- Lab Safety Goggles on forehead -->
        <rect x="36" y="48" width="58" height="18" rx="8" fill="#06b6d4" stroke="#0891b2" stroke-width="2.5" opacity="0.9"/>
        <ellipse cx="50" cy="57" rx="10" ry="6" fill="#cffafe" opacity="0.7"/>
        <ellipse cx="80" cy="57" rx="10" ry="6" fill="#cffafe" opacity="0.7"/>
        <line x1="36" y1="57" x2="30" y2="57" stroke="#0891b2" stroke-width="2"/>
        <line x1="94" y1="57" x2="100" y2="57" stroke="#0891b2" stroke-width="2"/>

        <!-- Eyes with bright highlights -->
        <ellipse cx="53" cy="76" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="55" cy="74" r="2" fill="#ffffff"/>
        <circle cx="52" cy="78" r="1" fill="#ffffff"/>
        <ellipse cx="77" cy="76" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="79" cy="74" r="2" fill="#ffffff"/>
        <circle cx="76" cy="78" r="1" fill="#ffffff"/>

        <!-- Cheerful smile and blushing cheeks -->
        <path d="M59 86 Q65 92 71 86" stroke="#b45309" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <ellipse cx="46" cy="83" rx="4.5" ry="3" fill="#f43f5e" opacity="0.65"/>
        <ellipse cx="84" cy="83" rx="4.5" ry="3" fill="#f43f5e" opacity="0.65"/>

        <!-- Lab Coat & Tie -->
        <path d="M45 107 L85 107 L95 158 L35 158 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" rx="6"/>
        <polygon points="65,107 61,130 69,130" fill="#a855f7"/>
        <circle cx="65" cy="140" r="2.5" fill="#312e81"/>
        <circle cx="65" cy="150" r="2.5" fill="#312e81"/>

        <!-- Arm tapping forward with stylus -->
        <path d="M45 110 L25 125 L15 120" stroke="#f8fafc" stroke-width="9" stroke-linecap="round" fill="none"/>
        <circle cx="15" cy="120" r="5" fill="#fde047"/>
        <line x1="15" y1="120" x2="-8" y2="105" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
        <circle cx="-8" cy="105" r="5" fill="#fde047"/>
        <!-- Star spark on tip -->
        <polygon points="-8,98 -6,103 -1,105 -6,107 -8,112 -10,107 -15,105 -10,103" fill="#fde047"/>

        <!-- Right Arm resting happily -->
        <path d="M85 110 L98 128 L94 135" stroke="#f8fafc" stroke-width="9" stroke-linecap="round" fill="none"/>
        <circle cx="94" cy="135" r="5" fill="#fde047"/>

        <!-- Legs & Shoes -->
        <rect x="48" y="158" width="12" height="24" rx="4" fill="#312e81"/>
        <rect x="70" y="158" width="12" height="24" rx="4" fill="#312e81"/>
        <ellipse cx="54" cy="184" rx="9" ry="5" fill="#a855f7"/>
        <ellipse cx="76" cy="184" rx="9" ry="5" fill="#a855f7"/>
      </g>

      <!-- Right: Glowing Animated Shapes (Circle, Square, Triangle) & Science Beakers -->
      <g transform="translate(1005, 110)">
        <!-- Glowing Red Circle -->
        <g transform="translate(20, 15)">
          <circle cx="45" cy="45" r="38" fill="#ef4444" stroke="#fecaca" stroke-width="3" filter="drop-shadow(0 0 12px rgba(239, 68, 68, 0.7))"/>
          <!-- Cute anime face on Circle -->
          <circle cx="36" cy="42" r="3.5" fill="#ffffff"/>
          <circle cx="54" cy="42" r="3.5" fill="#ffffff"/>
          <path d="M41 52 Q45 56 49 52" stroke="#ffffff" stroke-width="2.5" fill="none"/>
          <text x="45" y="70" font-size="11" font-weight="900" fill="#fef2f2" text-anchor="middle">CIRCLE</text>
        </g>

        <!-- Glowing Blue Square -->
        <g transform="translate(85, 75)">
          <rect x="0" y="0" width="72" height="72" rx="16" fill="#3b82f6" stroke="#bfdbfe" stroke-width="3" filter="drop-shadow(0 0 12px rgba(59, 130, 246, 0.7))"/>
          <!-- Cute anime face on Square -->
          <circle cx="26" cy="34" r="3.5" fill="#ffffff"/>
          <circle cx="46" cy="34" r="3.5" fill="#ffffff"/>
          <path d="M32 44 Q36 49 40 44" stroke="#ffffff" stroke-width="2.5" fill="none"/>
          <text x="36" y="60" font-size="11" font-weight="900" fill="#eff6ff" text-anchor="middle">SQUARE</text>
        </g>

        <!-- Glowing Green Triangle -->
        <g transform="translate(5, 115)">
          <polygon points="40,5 75,70 5,70" fill="#10b981" stroke="#a7f3d0" stroke-width="3" filter="drop-shadow(0 0 12px rgba(16, 185, 129, 0.7))"/>
          <!-- Cute face on Triangle -->
          <circle cx="34" cy="44" r="3" fill="#ffffff"/>
          <circle cx="46" cy="44" r="3" fill="#ffffff"/>
          <path d="M38 52 Q40 55 42 52" stroke="#ffffff" stroke-width="2" fill="none"/>
          <text x="40" y="66" font-size="10" font-weight="900" fill="#f0fdf4" text-anchor="middle">TRIANGLE</text>
        </g>

        <!-- Science Beaker with bubbles -->
        <g transform="translate(90, 0)">
          <path d="M20 15 L20 30 L5 65 L45 65 L30 30 L30 15 Z" fill="rgba(192, 132, 252, 0.25)" stroke="#c084fc" stroke-width="2"/>
          <ellipse cx="25" cy="55" rx="14" ry="5" fill="#c084fc" opacity="0.6"/>
          <circle cx="22" cy="40" r="3" fill="#fde047"/>
          <circle cx="28" cy="32" r="2" fill="#38bdf8"/>
          <circle cx="24" cy="20" r="2.5" fill="#fde047"/>
        </g>
      </g>
    `
  },
  {
    slug: 'past-tense-run',
    targetDir: path.join(rootDir, 'public', 'games', 'english'),
    filename: 'past-tense-run-cover.png',
    titleEn: 'Past Tense Run',
    titleTh: 'วิ่งตะลุยอดีตกาล',
    subTitle: 'วิ่งเก็บเหรียญคำกริยา V.2 · Regular (-ed) & Irregular Verbs · ตะลุยไทม์ไลน์กาลเวลา',
    curriculum: '⭐ ต 1.1 ป.4–5 · ภาษาอังกฤษ (Past Simple Tense)',
    pill: 'ACTION VERB CONJUGATION RUNNER',
    bgGradient: 'radial-gradient(circle at 50% 40%, #0369a1 0%, #1e1b4b 60%, #020617 100%)',
    primaryColor: '#38bdf8',
    accentColor: '#fbbf24',
    glowColor: 'rgba(56, 189, 248, 0.35)',
    cornerIcon: '🇬🇧',
    cornerText: 'KAMPAI ENGLISH · โรงเรียนบ้านคำไผ่',
    badges: [
      { text: '🏃 กริยา 3 ช่อง & เติม -ed', color: 'gold' },
      { text: '🪙 went · saw · ate · played', color: 'cyan' },
      { text: '⏳ ไทม์ไลน์ทะลุมิติกาลเวลา', color: 'green' }
    ],
    svgArt: `
      <!-- Left: Chibi Speed Runner Kid in full dash pose -->
      <g transform="translate(65, 115)">
        <!-- Speed Trails & Ground Glow -->
        <ellipse cx="70" cy="185" rx="60" ry="14" fill="#38bdf8" opacity="0.35" filter="blur(8px)"/>
        <path d="M-15 155 Q35 145 80 155" stroke="#fbbf24" stroke-width="4" stroke-linecap="round" fill="none"/>
        <path d="M-25 170 Q25 160 70 170" stroke="#38bdf8" stroke-width="3" stroke-linecap="round" fill="none"/>

        <!-- Running Speech Bubble -->
        <g transform="translate(10, -12)">
          <rect x="0" y="0" width="120" height="32" rx="16" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
          <polygon points="45,32 55,42 60,32" fill="#0f172a" stroke="#38bdf8" stroke-width="2"/>
          <text x="60" y="21" font-size="13" font-weight="900" fill="#fbbf24" text-anchor="middle">I ran fast! ⚡</text>
        </g>

        <!-- Head -->
        <circle cx="70" cy="75" r="32" fill="#fde047" stroke="#ca8a04" stroke-width="2.5"/>
        <!-- Sport Headband -->
        <rect x="40" y="58" width="60" height="12" rx="4" fill="#ef4444"/>
        <polygon points="70,61 73,67 67,67" fill="#ffffff"/>

        <!-- Spiky Runner Hair -->
        <path d="M40 58 C40 35 100 35 100 58 C108 52 105 68 100 72 C90 45 50 45 40 58 Z" fill="#1e293b"/>
        <path d="M25 45 L40 52 L30 65 Z" fill="#1e293b"/>

        <!-- Determined Bright Eyes -->
        <ellipse cx="58" cy="77" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="60" cy="75" r="2" fill="#ffffff"/>
        <ellipse cx="82" cy="77" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="84" cy="75" r="2" fill="#ffffff"/>

        <!-- Happy determined mouth & rosy cheeks -->
        <path d="M64 88 Q70 94 76 88" stroke="#b45309" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <ellipse cx="50" cy="85" rx="4" ry="2.5" fill="#f43f5e" opacity="0.6"/>
        <ellipse cx="90" cy="85" rx="4" ry="2.5" fill="#f43f5e" opacity="0.6"/>

        <!-- Athletic Jersey (Dynamic Forward Lean) -->
        <path d="M50 107 L90 107 L98 152 L42 152 Z" fill="#0284c7" rx="6"/>
        <text x="70" y="136" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">V2</text>

        <!-- Forward Pumping Arms -->
        <path d="M48 112 L22 100 L12 112" stroke="#fde047" stroke-width="8" stroke-linecap="round" fill="none"/>
        <circle cx="12" cy="112" r="5" fill="#fde047"/>
        <path d="M90 112 L115 125 L125 115" stroke="#fde047" stroke-width="8" stroke-linecap="round" fill="none"/>
        <circle cx="125" cy="115" r="5" fill="#fde047"/>

        <!-- Dynamic Running Legs -->
        <rect x="48" y="152" width="14" height="26" rx="5" fill="#1e3a8a" transform="rotate(-25 48 152)"/>
        <rect x="74" y="152" width="14" height="26" rx="5" fill="#1e3a8a" transform="rotate(30 74 152)"/>
        <!-- Red Winged Sneakers -->
        <ellipse cx="34" cy="180" rx="10" ry="6" fill="#ef4444"/>
        <ellipse cx="98" cy="176" rx="10" ry="6" fill="#ef4444"/>
      </g>

      <!-- Right: Glowing Golden Time Coins (went, saw, ate, played) & Clock Portal -->
      <g transform="translate(1005, 110)">
        <!-- Time Portal Rings -->
        <ellipse cx="75" cy="95" rx="75" ry="75" fill="none" stroke="#38bdf8" stroke-width="2" stroke-dasharray="8 6" opacity="0.4"/>
        <ellipse cx="75" cy="95" rx="60" ry="60" fill="none" stroke="#fbbf24" stroke-width="1.5" stroke-dasharray="5 4" opacity="0.5"/>

        <!-- Coin 1: went -->
        <g transform="translate(10, 10)">
          <circle cx="35" cy="35" r="32" fill="#f59e0b" stroke="#fef08a" stroke-width="3" filter="drop-shadow(0 0 10px rgba(245, 158, 11, 0.8))"/>
          <text x="35" y="41" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">went</text>
          <text x="35" y="55" font-size="9" font-weight="800" fill="#fef3c7" text-anchor="middle">go ➔ went</text>
        </g>

        <!-- Coin 2: saw -->
        <g transform="translate(80, 50)">
          <circle cx="35" cy="35" r="32" fill="#10b981" stroke="#a7f3d0" stroke-width="3" filter="drop-shadow(0 0 10px rgba(16, 185, 129, 0.8))"/>
          <text x="35" y="41" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">saw</text>
          <text x="35" y="55" font-size="9" font-weight="800" fill="#ecfdf5" text-anchor="middle">see ➔ saw</text>
        </g>

        <!-- Coin 3: ate -->
        <g transform="translate(5, 95)">
          <circle cx="35" cy="35" r="30" fill="#ec4899" stroke="#fbcfe8" stroke-width="3" filter="drop-shadow(0 0 10px rgba(236, 72, 153, 0.8))"/>
          <text x="35" y="41" font-size="16" font-weight="900" fill="#ffffff" text-anchor="middle">ate</text>
          <text x="35" y="55" font-size="9" font-weight="800" fill="#fdf2f8" text-anchor="middle">eat ➔ ate</text>
        </g>

        <!-- Coin 4: played -->
        <g transform="translate(75, 135)">
          <circle cx="35" cy="35" r="32" fill="#6366f1" stroke="#c7d2fe" stroke-width="3" filter="drop-shadow(0 0 10px rgba(99, 102, 241, 0.8))"/>
          <text x="35" y="40" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">played</text>
          <text x="35" y="54" font-size="9" font-weight="800" fill="#e0e7ff" text-anchor="middle">play ➔ -ed</text>
        </g>
      </g>
    `
  },
  {
    slug: 'bone-muscle-quest',
    targetDir: path.join(rootDir, 'public', 'games', 'health'),
    filename: 'bone-muscle-quest-cover.png',
    titleEn: 'Bone & Muscle Quest',
    titleTh: 'กระดูก–กล้ามเนื้อควิซ',
    subTitle: 'ระบบโครงกระดูก 206 ชิ้น · มัดกล้ามเนื้อและการยืดหด · แคลเซียมและสารอาหารเพื่อสุขภาพ',
    curriculum: '⭐ พ 1.1 ป.4–5 · สุขศึกษาและพลศึกษา',
    pill: 'HUMAN ANATOMY & BODY HEALTH QUEST',
    bgGradient: 'radial-gradient(circle at 50% 40%, #0d9488 0%, #115e59 50%, #042f2e 100%)',
    primaryColor: '#2dd4bf',
    accentColor: '#fde047',
    glowColor: 'rgba(45, 212, 191, 0.35)',
    cornerIcon: '🏥',
    cornerText: 'KAMPAI HEALTH · สุขศึกษาและพลศึกษา',
    badges: [
      { text: '🦴 โครงกระดูกมนุษย์ 206 ชิ้น', color: 'cyan' },
      { text: '💪 มัดกล้ามเนื้อแข็งแรง', color: 'gold' },
      { text: '🥛 แคลเซียมบำรุงกระดูก', color: 'green' }
    ],
    svgArt: `
      <!-- Left: Cheerful Strong Chibi Kid flexing biceps -->
      <g transform="translate(65, 115)">
        <!-- Health Aura Glow -->
        <ellipse cx="65" cy="185" rx="55" ry="14" fill="#2dd4bf" opacity="0.35" filter="blur(8px)"/>

        <!-- Bubble Tag -->
        <g transform="translate(10, -12)">
          <rect x="0" y="0" width="120" height="32" rx="16" fill="#0f172a" stroke="#2dd4bf" stroke-width="2"/>
          <polygon points="45,32 55,42 60,32" fill="#0f172a" stroke="#2dd4bf" stroke-width="2"/>
          <text x="60" y="21" font-size="13" font-weight="900" fill="#fde047" text-anchor="middle">Strong Bones! 💪</text>
        </g>

        <!-- Head -->
        <circle cx="65" cy="75" r="32" fill="#fde047" stroke="#ca8a04" stroke-width="2.5"/>
        <!-- Sporty Haircut -->
        <path d="M35 65 C35 40 95 40 95 65 C102 60 100 75 95 80 C85 52 45 52 35 65 Z" fill="#064e3b"/>
        <!-- Eyes -->
        <ellipse cx="53" cy="76" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="55" cy="74" r="2" fill="#ffffff"/>
        <ellipse cx="77" cy="76" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="79" cy="74" r="2" fill="#ffffff"/>

        <!-- Big Proud Smile & Cheeks -->
        <path d="M57 87 Q65 95 73 87" stroke="#b45309" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <ellipse cx="46" cy="84" rx="4" ry="3" fill="#f43f5e" opacity="0.65"/>
        <ellipse cx="84" cy="84" rx="4" ry="3" fill="#f43f5e" opacity="0.65"/>

        <!-- Sport Tank Top -->
        <path d="M46 107 L84 107 L92 156 L38 156 Z" fill="#059669" rx="6"/>
        <polygon points="65,116 70,126 60,126" fill="#fde047"/>

        <!-- Flexing Left Arm with Biceps -->
        <path d="M46 112 L20 102 L14 78" stroke="#fde047" stroke-width="9" stroke-linecap="round" fill="none"/>
        <circle cx="14" cy="78" r="6" fill="#fde047"/>
        <!-- Cute Muscle Flex Puff -->
        <path d="M16 88 Q10 88 12 96" stroke="#ca8a04" stroke-width="2" fill="none"/>

        <!-- Right Arm on hip -->
        <path d="M84 112 L106 122 L98 138" stroke="#fde047" stroke-width="8" stroke-linecap="round" fill="none"/>
        <circle cx="98" cy="138" r="5" fill="#fde047"/>

        <!-- Shorts & Legs -->
        <rect x="46" y="156" width="38" height="16" rx="3" fill="#064e3b"/>
        <rect x="48" y="170" width="12" height="14" rx="4" fill="#fde047"/>
        <rect x="70" y="170" width="12" height="14" rx="4" fill="#fde047"/>
        <ellipse cx="54" cy="184" rx="9" ry="5" fill="#10b981"/>
        <ellipse cx="76" cy="184" rx="9" ry="5" fill="#10b981"/>
      </g>

      <!-- Right: Friendly Smiling Cartoon Skeleton & Health Icons -->
      <g transform="translate(1005, 110)">
        <!-- Skeleton Floor Glow -->
        <ellipse cx="65" cy="190" rx="55" ry="14" fill="#2dd4bf" opacity="0.3" filter="blur(8px)"/>

        <!-- Chibi Cartoon Skeleton -->
        <g transform="translate(10, 5)">
          <!-- Friendly Rounded Skull -->
          <ellipse cx="55" cy="55" rx="30" ry="26" fill="#f8fafc" stroke="#94a3b8" stroke-width="2.5"/>
          <!-- Big Cute Friendly Eye Sockets -->
          <ellipse cx="44" cy="52" rx="7" ry="8" fill="#1e293b"/>
          <circle cx="46" cy="49" r="2.5" fill="#38bdf8"/>
          <ellipse cx="66" cy="52" rx="7" ry="8" fill="#1e293b"/>
          <circle cx="68" cy="49" r="2.5" fill="#38bdf8"/>
          <!-- Cute Nose -->
          <polygon points="55,62 52,67 58,67" fill="#1e293b"/>
          <!-- Happy Smile with Teeth lines -->
          <path d="M43 72 Q55 78 67 72" stroke="#64748b" stroke-width="2.5" fill="none"/>
          <line x1="49" y1="71" x2="49" y2="76" stroke="#64748b" stroke-width="1.5"/>
          <line x1="55" y1="72" x2="55" y2="77" stroke="#64748b" stroke-width="1.5"/>
          <line x1="61" y1="71" x2="61" y2="76" stroke="#64748b" stroke-width="1.5"/>
          <!-- Pink cheeks on skeleton! -->
          <ellipse cx="36" cy="62" rx="4" ry="2.5" fill="#f43f5e" opacity="0.6"/>
          <ellipse cx="74" cy="62" rx="4" ry="2.5" fill="#f43f5e" opacity="0.6"/>

          <!-- Spine & Ribs -->
          <line x1="55" y1="82" x2="55" y2="135" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round"/>
          <path d="M40 95 Q55 90 70 95" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round" fill="none"/>
          <path d="M38 107 Q55 102 72 107" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round" fill="none"/>
          <path d="M42 119 Q55 114 68 119" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round" fill="none"/>

          <!-- Pelvis -->
          <path d="M40 135 Q55 142 70 135" stroke="#94a3b8" stroke-width="6" stroke-linecap="round" fill="none"/>

          <!-- Waving Bone Arm -->
          <path d="M38 95 L20 108 L15 90" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round" fill="none"/>
          <!-- Hand with 4 cute fingers -->
          <circle cx="15" cy="88" r="4" fill="#f8fafc"/>

          <!-- Leg Bones -->
          <line x1="46" y1="140" x2="46" y2="175" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round"/>
          <line x1="64" y1="140" x2="64" y2="175" stroke="#cbd5e1" stroke-width="5" stroke-linecap="round"/>
          <ellipse cx="44" cy="178" rx="7" ry="4" fill="#f8fafc"/>
          <ellipse cx="66" cy="178" rx="7" ry="4" fill="#f8fafc"/>
        </g>

        <!-- Floating Health Badges (Milk & Heart) -->
        <g transform="translate(100, 20)">
          <!-- Milk Carton -->
          <rect x="0" y="8" width="28" height="36" rx="4" fill="#f8fafc" stroke="#38bdf8" stroke-width="2"/>
          <polygon points="0,8 14,0 28,8" fill="#e0f2fe"/>
          <text x="14" y="28" font-size="10" font-weight="900" fill="#0284c7" text-anchor="middle">MILK</text>
        </g>
        <g transform="translate(95, 80)">
          <!-- Vitality Heart -->
          <path d="M15 5 C10 -5 0 0 0 10 C0 20 15 30 15 30 C15 30 30 20 30 10 C30 0 20 -5 15 5 Z" fill="#ef4444" filter="drop-shadow(0 0 8px rgba(239, 68, 68, 0.7))"/>
          <line x1="5" y1="12" x2="11" y2="12" stroke="#ffffff" stroke-width="1.5"/>
          <line x1="11" y1="12" x2="14" y2="7" stroke="#ffffff" stroke-width="1.5"/>
          <line x1="14" y1="7" x2="17" y2="17" stroke="#ffffff" stroke-width="1.5"/>
          <line x1="17" y1="17" x2="20" y2="12" stroke="#ffffff" stroke-width="1.5"/>
          <line x1="20" y1="12" x2="25" y2="12" stroke="#ffffff" stroke-width="1.5"/>
        </g>
      </g>
    `
  },
  {
    slug: 'first-aid-rush',
    targetDir: path.join(rootDir, 'public', 'games', 'health'),
    filename: 'first-aid-rush-cover.png',
    titleEn: 'First Aid Rush',
    titleTh: 'ปฐมพยาบาลด่วน',
    subTitle: 'ขั้นตอนการปฐมพยาบาลเบื้องต้น · ทำแผล ห้ามเลือด แผลไฟไหม้ · ช่วยเหลือฉุกเฉิน 1669',
    curriculum: '⭐ พ 5.1 ป.4–5 · สุขศึกษาและพลศึกษา',
    pill: 'EMERGENCY RESCUE & FIRST AID SIMULATOR',
    bgGradient: 'radial-gradient(circle at 50% 40%, #991b1b 0%, #450a0a 45%, #0f172a 100%)',
    primaryColor: '#f87171',
    accentColor: '#fde047',
    glowColor: 'rgba(239, 68, 68, 0.35)',
    cornerIcon: '🚑',
    cornerText: 'KAMPAI HEALTH · สุขศึกษาและพลศึกษา',
    badges: [
      { text: '🩹 ทำแผล ล้างแผล ใส่ยา', color: 'gold' },
      { text: '🧰 อุปกรณ์กล่องปฐมพยาบาล', color: 'cyan' },
      { text: '🚨 สายด่วนกู้ชีพ 1669', color: 'green' }
    ],
    svgArt: `
      <!-- Left: Chibi First-Aid Responder Kid holding Red Cross Kit -->
      <g transform="translate(65, 115)">
        <!-- Rescue Glow -->
        <ellipse cx="65" cy="185" rx="55" ry="14" fill="#ef4444" opacity="0.35" filter="blur(8px)"/>

        <!-- Bubble Tag -->
        <g transform="translate(10, -12)">
          <rect x="0" y="0" width="120" height="32" rx="16" fill="#0f172a" stroke="#f87171" stroke-width="2"/>
          <polygon points="45,32 55,42 60,32" fill="#0f172a" stroke="#f87171" stroke-width="2"/>
          <text x="60" y="21" font-size="13" font-weight="900" fill="#fde047" text-anchor="middle">First Aid Ready! 🚑</text>
        </g>

        <!-- Head -->
        <circle cx="65" cy="75" r="32" fill="#fde047" stroke="#ca8a04" stroke-width="2.5"/>
        <!-- Paramedic Cap with Red Cross -->
        <path d="M35 60 C35 38 95 38 95 60 Z" fill="#ffffff" stroke="#cbd5e1" stroke-width="2"/>
        <rect x="33" y="58" width="64" height="6" rx="2" fill="#ef4444"/>
        <!-- Red Cross on cap -->
        <rect x="62" y="44" width="6" height="12" fill="#ef4444"/>
        <rect x="59" y="47" width="12" height="6" fill="#ef4444"/>

        <!-- Eyes -->
        <ellipse cx="53" cy="76" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="55" cy="74" r="2" fill="#ffffff"/>
        <ellipse cx="77" cy="76" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="79" cy="74" r="2" fill="#ffffff"/>

        <!-- Kind Caring Smile & Cheeks -->
        <path d="M58 87 Q65 93 72 87" stroke="#b45309" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <ellipse cx="46" cy="84" rx="4" ry="3" fill="#f43f5e" opacity="0.65"/>
        <ellipse cx="84" cy="84" rx="4" ry="3" fill="#f43f5e" opacity="0.65"/>

        <!-- Medic Uniform (White Coat with Red Cross) -->
        <path d="M46 107 L84 107 L94 156 L36 156 Z" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" rx="6"/>
        <!-- Red Cross on Chest -->
        <rect x="62" y="118" width="6" height="16" fill="#ef4444"/>
        <rect x="57" y="123" width="16" height="6" fill="#ef4444"/>

        <!-- Holding Red Medical Cross Kit in Hands -->
        <g transform="translate(15, 120)">
          <!-- Red Kit Box -->
          <rect x="0" y="0" width="46" height="34" rx="6" fill="#dc2626" stroke="#fecaca" stroke-width="2" filter="drop-shadow(0 4px 8px rgba(0,0,0,0.5))"/>
          <!-- Handle -->
          <path d="M15 0 L15 -6 L31 -6 L31 0" stroke="#fecaca" stroke-width="2.5" fill="none"/>
          <!-- White Cross on Kit -->
          <rect x="20" y="9" width="6" height="16" fill="#ffffff"/>
          <rect x="15" y="14" width="16" height="6" fill="#ffffff"/>
        </g>
        <circle cx="20" cy="130" r="5" fill="#fde047"/>
        <circle cx="58" cy="130" r="5" fill="#fde047"/>

        <!-- Pants & Shoes -->
        <rect x="46" y="156" width="16" height="24" rx="4" fill="#1e3a8a"/>
        <rect x="68" y="156" width="16" height="24" rx="4" fill="#1e3a8a"/>
        <ellipse cx="54" cy="184" rx="9" ry="5" fill="#3b82f6"/>
        <ellipse cx="76" cy="184" rx="9" ry="5" fill="#3b82f6"/>
      </g>

      <!-- Right: Smiling Cartoon Plaster Bandage, Cotton Puff, & Antiseptic -->
      <g transform="translate(1005, 110)">
        <!-- Glowing Plaster Bandage with cute anime face -->
        <g transform="translate(15, 15) rotate(15)">
          <rect x="0" y="0" width="85" height="42" rx="21" fill="#f59e0b" stroke="#fef08a" stroke-width="2.5" filter="drop-shadow(0 0 10px rgba(245, 158, 11, 0.7))"/>
          <!-- Bandage pad in center -->
          <rect x="25" y="5" width="35" height="32" rx="6" fill="#fef3c7"/>
          <!-- Cute Face on Plaster! -->
          <circle cx="36" cy="18" r="3" fill="#1e293b"/>
          <circle cx="48" cy="18" r="3" fill="#1e293b"/>
          <path d="M39 25 Q42 28 45 25" stroke="#b45309" stroke-width="2" fill="none"/>
          <circle cx="33" cy="22" r="2" fill="#f43f5e" opacity="0.6"/>
          <circle cx="51" cy="22" r="2" fill="#f43f5e" opacity="0.6"/>
          <!-- Perforations -->
          <circle cx="12" cy="21" r="1.5" fill="#d97706"/>
          <circle cx="73" cy="21" r="1.5" fill="#d97706"/>
        </g>

        <!-- Cute Fluffy Cotton Puff with Face -->
        <g transform="translate(10, 85)">
          <circle cx="40" cy="40" r="26" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" filter="drop-shadow(0 0 10px rgba(255,255,255,0.6))"/>
          <circle cx="26" cy="35" r="16" fill="#f8fafc"/>
          <circle cx="54" cy="35" r="16" fill="#f8fafc"/>
          <circle cx="40" cy="24" r="16" fill="#f8fafc"/>
          <!-- Cute face -->
          <circle cx="34" cy="38" r="3" fill="#1e293b"/>
          <circle cx="46" cy="38" r="3" fill="#1e293b"/>
          <path d="M38 45 Q40 48 42 45" stroke="#0284c7" stroke-width="2" fill="none"/>
          <text x="40" y="68" font-size="10" font-weight="900" fill="#64748b" text-anchor="middle">COTTON</text>
        </g>

        <!-- Antiseptic Bottle -->
        <g transform="translate(90, 75)">
          <rect x="10" y="20" width="34" height="48" rx="8" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
          <rect x="20" y="10" width="14" height="10" rx="2" fill="#ffffff"/>
          <!-- Heart symbol on bottle -->
          <polygon points="27,32 32,38 22,38" fill="#ffffff"/>
          <text x="27" y="55" font-size="8" font-weight="900" fill="#ffffff" text-anchor="middle">CARE</text>
        </g>
      </g>
    `
  },
  {
    slug: 'fact-opinion-duel',
    targetDir: path.join(rootDir, 'public', 'games', 'thai'),
    filename: 'fact-opinion-duel-cover.png',
    titleEn: 'Fact vs Opinion Duel',
    titleTh: 'ข้อเท็จจริง vs ความคิดเห็น',
    subTitle: 'จำแนกข้อเท็จจริงและความคิดเห็น · คิดวิเคราะห์อย่างมีเหตุผล · การอ่านจับใจความสำคัญ',
    curriculum: '⭐ ท 1.1 ป.4–5 · ภาษาไทย (การอ่านและการคิดวิเคราะห์)',
    pill: 'THAI CRITICAL READING & FACT DUEL',
    bgGradient: 'radial-gradient(circle at 50% 40%, #581c87 0%, #3b0764 50%, #030712 100%)',
    primaryColor: '#c084fc',
    accentColor: '#fde047',
    glowColor: 'rgba(192, 132, 252, 0.35)',
    cornerIcon: '🇹🇭',
    cornerText: 'KAMPAI THAI · ภาษาไทย โรงเรียนบ้านคำไผ่',
    badges: [
      { text: '⚖️ ตาชั่งความจริง vs ความคิดเห็น', color: 'gold' },
      { text: '🔍 นักสืบตรวจพิสูจน์ข้อความ', color: 'cyan' },
      { text: '📖 อ่านจับใจความ & คิดวิเคราะห์', color: 'green' }
    ],
    svgArt: `
      <!-- Left: Cute Chibi Detective with Magnifying Glass -->
      <g transform="translate(65, 115)">
        <!-- Wisdom Floor Glow -->
        <ellipse cx="65" cy="185" rx="55" ry="14" fill="#c084fc" opacity="0.35" filter="blur(8px)"/>

        <!-- Bubble Tag -->
        <g transform="translate(10, -12)">
          <rect x="0" y="0" width="125" height="32" rx="16" fill="#0f172a" stroke="#c084fc" stroke-width="2"/>
          <polygon points="45,32 55,42 60,32" fill="#0f172a" stroke="#c084fc" stroke-width="2"/>
          <text x="62" y="21" font-size="13" font-weight="900" fill="#fde047" text-anchor="middle">True or False? 🔍</text>
        </g>

        <!-- Head -->
        <circle cx="65" cy="75" r="32" fill="#fde047" stroke="#ca8a04" stroke-width="2.5"/>
        <!-- Detective Deerstalker Hat with ear flaps -->
        <path d="M30 62 C30 35 100 35 100 62 Z" fill="#b45309" stroke="#78350f" stroke-width="2"/>
        <path d="M22 62 L108 62 L100 68 L30 68 Z" fill="#92400e"/>
        <!-- Hat ribbon -->
        <rect x="36" y="54" width="58" height="6" fill="#fde047"/>

        <!-- Inquisitive Bright Eyes -->
        <ellipse cx="53" cy="76" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="55" cy="74" r="2" fill="#ffffff"/>
        <ellipse cx="77" cy="76" rx="4.5" ry="6" fill="#0f172a"/>
        <circle cx="79" cy="74" r="2" fill="#ffffff"/>

        <!-- Clever Smile & Blushing Cheeks -->
        <path d="M59 87 Q65 92 71 87" stroke="#b45309" stroke-width="2.5" stroke-linecap="round" fill="none"/>
        <ellipse cx="46" cy="84" rx="4" ry="3" fill="#f43f5e" opacity="0.65"/>
        <ellipse cx="84" cy="84" rx="4" ry="3" fill="#f43f5e" opacity="0.65"/>

        <!-- Detective Trench Coat -->
        <path d="M46 107 L84 107 L95 158 L35 158 Z" fill="#d97706" stroke="#b45309" stroke-width="2" rx="6"/>
        <polygon points="65,107 60,128 70,128" fill="#78350f"/>
        <!-- Belt -->
        <rect x="42" y="132" width="46" height="8" fill="#78350f"/>
        <rect x="60" y="130" width="10" height="12" rx="2" fill="#fde047"/>

        <!-- Right Hand holding Big Magnifying Glass -->
        <g transform="translate(80, 75)">
          <circle cx="32" cy="25" r="22" fill="rgba(192, 132, 252, 0.3)" stroke="#fde047" stroke-width="4" filter="drop-shadow(0 0 8px rgba(253, 224, 71, 0.8))"/>
          <line x1="16" y1="40" x2="2" y2="58" stroke="#b45309" stroke-width="6" stroke-linecap="round"/>
          <polygon points="36,15 38,20 43,22 38,24 36,29 34,24 29,22 34,20" fill="#ffffff"/>
        </g>
        <circle cx="82" cy="120" r="5" fill="#fde047"/>

        <!-- Left Hand in Pocket -->
        <path d="M46 112 L30 125 L34 135" stroke="#d97706" stroke-width="8" stroke-linecap="round" fill="none"/>

        <!-- Legs & Boots -->
        <rect x="46" y="158" width="14" height="24" rx="4" fill="#78350f"/>
        <rect x="68" y="158" width="14" height="24" rx="4" fill="#78350f"/>
        <ellipse cx="53" cy="184" rx="9" ry="5" fill="#451a03"/>
        <ellipse cx="75" cy="184" rx="9" ry="5" fill="#451a03"/>
      </g>

      <!-- Right: Golden Scale of Truth & Dual Statement Banners -->
      <g transform="translate(995, 105)">
        <!-- Golden Scale of Truth -->
        <g transform="translate(20, 10)">
          <!-- Base & Stand -->
          <rect x="65" y="155" width="50" height="12" rx="6" fill="#f59e0b" stroke="#fde047" stroke-width="2"/>
          <line x1="90" y1="25" x2="90" y2="155" stroke="#f59e0b" stroke-width="6" stroke-linecap="round"/>
          <!-- Top Balance Beam -->
          <line x1="25" y1="35" x2="155" y2="35" stroke="#fde047" stroke-width="5" stroke-linecap="round"/>
          <circle cx="90" cy="35" r="8" fill="#f59e0b" stroke="#fde047" stroke-width="2"/>

          <!-- Left Pan: Fact (ข้อเท็จจริง) -->
          <line x1="30" y1="35" x2="15" y2="75" stroke="#fde047" stroke-width="2"/>
          <line x1="30" y1="35" x2="45" y2="75" stroke="#fde047" stroke-width="2"/>
          <ellipse cx="30" cy="78" rx="24" ry="7" fill="#10b981" stroke="#fde047" stroke-width="2"/>
          <!-- Checkmark Shield icon -->
          <circle cx="30" cy="98" r="18" fill="#10b981" stroke="#a7f3d0" stroke-width="2" filter="drop-shadow(0 0 8px rgba(16, 185, 129, 0.7))"/>
          <path d="M24 98 L28 103 L37 93" stroke="#ffffff" stroke-width="3" stroke-linecap="round" fill="none"/>
          <text x="30" y="128" font-size="11" font-weight="900" fill="#a7f3d0" text-anchor="middle">ข้อเท็จจริง</text>

          <!-- Right Pan: Opinion (ความคิดเห็น) -->
          <line x1="150" y1="35" x2="135" y2="75" stroke="#fde047" stroke-width="2"/>
          <line x1="150" y1="35" x2="165" y2="75" stroke="#fde047" stroke-width="2"/>
          <ellipse cx="150" cy="78" rx="24" ry="7" fill="#ec4899" stroke="#fde047" stroke-width="2"/>
          <!-- Thought Bubble icon -->
          <circle cx="150" cy="98" r="18" fill="#ec4899" stroke="#fbcfe8" stroke-width="2" filter="drop-shadow(0 0 8px rgba(236, 72, 153, 0.7))"/>
          <text x="150" y="103" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">💭</text>
          <text x="150" y="128" font-size="11" font-weight="900" fill="#fbcfe8" text-anchor="middle">ความคิดเห็น</text>
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
    font-family: 'Sarabun', 'Leelawadee UI', Tahoma, sans-serif;
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
    width: 850px;
    height: 480px;
    background: radial-gradient(circle, ${cover.glowColor} 0%, transparent 70%);
    filter: blur(50px);
  }

  /* Safe zone container (strictly within 60% vertical safe zone, Y: 150px - 570px) */
  .content-wrapper {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 1080px;
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
    font-size: 64px;
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
    font-size: 44px;
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
    font-size: 17px;
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
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0.05));
    border: 1px solid rgba(255, 255, 255, 0.2);
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
  console.log('Rendering 5 Studio-Quality Covers for M2 (1280x720 16:9)...');
  const browser = await chromium.launch({ headless: true });

  for (const c of COVERS) {
    fs.mkdirSync(c.targetDir, { recursive: true });
    const page = await browser.newPage({
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1
    });

    const html = buildHtml(c);
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const targetPath = path.join(c.targetDir, c.filename);
    await page.screenshot({
      path: targetPath,
      type: 'png',
      clip: { x: 0, y: 0, width: 1280, height: 720 }
    });
    console.log(`✅ Rendered: ${c.filename} -> ${targetPath}`);
    await page.close();
  }

  await browser.close();
  console.log('🎉 All 5 covers successfully rendered at 1280x720!');
}

renderAll().catch(err => {
  console.error('Render error:', err);
  process.exit(1);
});
