import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const dir = 'public/games/thai/thai-idiom-hub/images';
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

const svgs = {
  'cow-lost-fence.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#bae6fd"/><stop offset="100%" stop-color="#e0f2fe"/></linearGradient>
      <linearGradient id="hill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#86efac"/><stop offset="100%" stop-color="#22c55e"/></linearGradient>
      <linearGradient id="barn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fed7aa"/><stop offset="100%" stop-color="#f97316"/></linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#sky)"/>
    <circle cx="680" cy="120" r="55" fill="#fde047"/>
    <path d="M0 360 Q 200 280 420 340 T 800 320 L 800 600 L 0 600 Z" fill="url(#hill)"/>
    <!-- Empty Barn -->
    <rect x="100" y="280" width="240" height="180" rx="12" fill="url(#barn)" stroke="#c2410c" stroke-width="6"/>
    <polygon points="80,285 220,180 360,285" fill="#b91c1c"/>
    <rect x="150" y="330" width="140" height="130" fill="#451a03" rx="8"/>
    <text x="220" y="400" font-family="Sarabun" font-size="22" font-weight="bold" fill="#fef08a" text-anchor="middle">คอกว่างเปล่า!</text>
    <!-- Fence being built late -->
    <rect x="60" y="430" width="22" height="120" fill="#d97706" rx="4"/>
    <rect x="130" y="420" width="22" height="130" fill="#d97706" rx="4"/>
    <rect x="200" y="425" width="22" height="125" fill="#d97706" rx="4"/>
    <rect x="270" y="430" width="22" height="120" fill="#d97706" rx="4"/>
    <rect x="50" y="460" width="250" height="22" fill="#b45309" rx="4"/>
    <rect x="50" y="510" width="250" height="22" fill="#b45309" rx="4"/>
    <!-- Farmer hammering hurriedly -->
    <circle cx="380" cy="390" r="36" fill="#ffedd5"/>
    <rect x="355" y="425" width="50" height="80" rx="12" fill="#0284c7"/>
    <!-- Cow wandering far away -->
    <g transform="translate(580, 240) scale(0.9)">
      <ellipse cx="70" cy="60" rx="55" ry="38" fill="#ffffff" stroke="#1e293b" stroke-width="4"/>
      <circle cx="35" cy="50" r="16" fill="#1e293b"/>
      <circle cx="85" cy="70" r="18" fill="#1e293b"/>
      <circle cx="130" cy="45" r="28" fill="#ffffff" stroke="#1e293b" stroke-width="4"/>
      <ellipse cx="140" cy="52" rx="14" ry="10" fill="#fbcfe8"/>
      <circle cx="124" cy="38" r="5" fill="#1e293b"/>
      <text x="70" y="-10" font-family="Sarabun" font-size="20" font-weight="bold" fill="#047857" text-anchor="middle">วัวเดินหนีไปไกลแล้ว 🐮</text>
    </g>
  </svg>`,

  'push-mortar-mountain.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <defs>
      <linearGradient id="sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fed7aa"/><stop offset="100%" stop-color="#fef08a"/></linearGradient>
      <linearGradient id="slope" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#16a34a"/><stop offset="100%" stop-color="#15803d"/></linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#sky2)"/>
    <polygon points="0,600 800,120 800,600" fill="url(#slope)"/>
    <g transform="translate(380, 260) rotate(-30)">
      <ellipse cx="0" cy="0" rx="80" ry="75" fill="#64748b" stroke="#334155" stroke-width="8"/>
      <ellipse cx="0" cy="-25" rx="65" ry="30" fill="#475569"/>
      <rect x="-15" y="-75" width="30" height="70" rx="8" fill="#94a3b8" transform="rotate(15)" stroke="#334155" stroke-width="4"/>
      <text x="0" y="25" font-family="Sarabun" font-size="24" font-weight="bold" fill="#f8fafc" text-anchor="middle">ครกหินหนักมาก</text>
    </g>
    <g transform="translate(230, 390)">
      <circle cx="40" cy="-40" r="36" fill="#ffedd5" stroke="#ea580c" stroke-width="4"/>
      <path d="M 10 -20 Q 50 15 70 30" stroke="#2563eb" stroke-width="32" stroke-linecap="round"/>
      <path d="M 45 -25 L 120 -35" stroke="#ffedd5" stroke-width="18" stroke-linecap="round"/>
      <text x="40" y="90" font-family="Sarabun" font-size="20" font-weight="bold" fill="#ffffff" text-anchor="middle">ออกแรงเข็นขึ้นที่สูง</text>
    </g>
  </svg>`,

  'slow-gets-fine-knife.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <defs>
      <linearGradient id="bg3" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#fef3c7"/><stop offset="100%" stop-color="#fed7aa"/></linearGradient>
      <linearGradient id="blade" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#e2e8f0"/><stop offset="50%" stop-color="#ffffff"/><stop offset="100%" stop-color="#94a3b8"/></linearGradient>
    </defs>
    <rect width="800" height="600" fill="url(#bg3)"/>
    <g transform="translate(150, 240)">
      <path d="M 50 140 Q 10 160 30 200 Q 60 210 110 170 Z" fill="#78350f" stroke="#451a03" stroke-width="6"/>
      <path d="M 100 160 Q 250 80 480 90 Q 530 110 500 150 Q 320 180 110 170 Z" fill="url(#blade)" stroke="#334155" stroke-width="6"/>
      <path d="M 120 155 Q 260 95 470 105" stroke="#ffffff" stroke-width="4" fill="none"/>
      <text x="300" y="70" font-family="Sarabun" font-size="28" font-weight="800" fill="#b45309" text-anchor="middle">✨ มีดพร้าประณีต งดงาม คมกริบ ✨</text>
    </g>
    <rect x="120" y="460" width="560" height="30" rx="8" fill="#b45309"/>
    <text x="400" y="540" font-family="Sarabun" font-size="24" font-weight="bold" fill="#78350f" text-anchor="middle">ค่อย ๆ ตีเหล็กและลับมีดอย่างประณีต จนได้ผลงานชั้นเลิศ</text>
  </svg>`,

  'water-rise-fetch.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <defs>
      <linearGradient id="river" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#38bdf8"/><stop offset="100%" stop-color="#0284c7"/></linearGradient>
    </defs>
    <rect width="800" height="600" fill="#fef9c3"/>
    <rect x="0" y="280" width="800" height="320" fill="url(#river)"/>
    <path d="M0 280 Q 200 250 400 280 T 800 280 L 800 600 L 0 600 Z" fill="#0ea5e9"/>
    <rect x="80" y="220" width="260" height="120" rx="10" fill="#d97706" stroke="#78350f" stroke-width="6"/>
    <g transform="translate(200, 160)">
      <circle cx="50" cy="30" r="32" fill="#ffedd5" stroke="#ea580c" stroke-width="3"/>
      <path d="M 70 80 L 150 160" stroke="#78350f" stroke-width="8" stroke-linecap="round"/>
      <ellipse cx="160" cy="180" rx="35" ry="25" fill="#b45309" stroke="#78350f" stroke-width="4"/>
      <ellipse cx="160" cy="175" rx="30" ry="15" fill="#bae6fd"/>
    </g>
    <text x="520" y="220" font-family="Sarabun" font-size="30" font-weight="800" fill="#0369a1">💧 น้ำขึ้นเต็มตลิ่ง</text>
    <text x="520" y="265" font-family="Sarabun" font-size="22" font-weight="bold" fill="#0284c7">รีบตักเก็บไว้ใช้เมื่อมีโอกาสดี</text>
  </svg>`,

  'chicken-foot-snake-breast.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <rect width="800" height="600" fill="#f0fdf4"/>
    <g transform="translate(150, 220)">
      <ellipse cx="100" cy="120" rx="80" ry="65" fill="#fef08a" stroke="#ca8a04" stroke-width="6"/>
      <circle cx="160" cy="70" r="35" fill="#fef08a" stroke="#ca8a04" stroke-width="6"/>
      <polygon points="195,70 230,80 195,90" fill="#f97316"/>
      <text x="110" y="270" font-family="Sarabun" font-size="22" font-weight="bold" fill="#ca8a04" text-anchor="middle">ไก่เห็นตีนงู 🐔</text>
    </g>
    <g transform="translate(450, 220)">
      <path d="M 60 210 Q 120 120 180 210 Q 220 100 240 60" fill="none" stroke="#22c55e" stroke-width="36" stroke-linecap="round"/>
      <circle cx="240" cy="60" r="25" fill="#22c55e" stroke="#15803d" stroke-width="4"/>
      <text x="150" y="270" font-family="Sarabun" font-size="22" font-weight="bold" fill="#15803d" text-anchor="middle">งูเห็นนมไก่ 🐍</text>
    </g>
    <text x="400" y="120" font-family="Sarabun" font-size="28" font-weight="800" fill="#0f766e" text-anchor="middle">ต่างฝ่ายต่างรู้ความลับหรือเล่ห์เหลี่ยมของกันและกัน</text>
  </svg>`,

  'escape-tiger-meet-crocodile.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <rect width="800" height="600" fill="#fef2f2"/>
    <rect x="340" y="150" width="60" height="400" fill="#78350f"/>
    <circle cx="370" cy="210" r="28" fill="#ffedd5" stroke="#ea580c" stroke-width="3"/>
    <g transform="translate(80, 360)">
      <ellipse cx="80" cy="80" rx="60" ry="40" fill="#f97316"/>
      <text x="100" y="150" font-family="Sarabun" font-size="22" font-weight="bold" fill="#ea580c" text-anchor="middle">🐯 เสือดักอยู่ข้างล่าง</text>
    </g>
    <g transform="translate(520, 380)">
      <ellipse cx="100" cy="70" rx="90" ry="35" fill="#15803d"/>
      <text x="110" y="140" font-family="Sarabun" font-size="22" font-weight="bold" fill="#166534" text-anchor="middle">🐊 จระเข้รออยู่ในน้ำ</text>
    </g>
    <text x="400" y="80" font-family="Sarabun" font-size="28" font-weight="800" fill="#991b1b" text-anchor="middle">หนีภัยหนึ่ง กลับไปเจออีกภัยหนึ่งที่อันตรายไม่แพ้กัน</text>
  </svg>`,

  'point-burrow-squirrel.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <rect width="800" height="600" fill="#fefce8"/>
    <rect x="420" y="100" width="160" height="500" rx="20" fill="#78350f"/>
    <ellipse cx="480" cy="280" rx="40" ry="55" fill="#451a03"/>
    <g transform="translate(480, 200)">
      <ellipse cx="0" cy="0" rx="25" ry="35" fill="#ea580c"/>
      <text x="0" y="-30" font-family="Sarabun" font-size="20" font-weight="bold" fill="#c2410c" text-anchor="middle">กระรอก 🐿️</text>
    </g>
    <g transform="translate(180, 340)">
      <path d="M 0 0 L 180 -50" stroke="#f97316" stroke-width="12" stroke-linecap="round"/>
      <polygon points="195,-53 170,-65 175,-35" fill="#f97316"/>
      <text x="50" y="60" font-family="Sarabun" font-size="24" font-weight="bold" fill="#78350f">ชี้โพรงทางเข้าไม้</text>
    </g>
    <text x="400" y="70" font-family="Sarabun" font-size="28" font-weight="800" fill="#b45309" text-anchor="middle">บอกช่องทางหรือชี้แนะให้คนทำความผิด</text>
  </svg>`,

  'strike-snake-feed-crow.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <rect width="800" height="600" fill="#fafaf9"/>
    <g transform="translate(200, 360)">
      <path d="M 0 50 Q 80 0 160 50 T 320 50" fill="none" stroke="#64748b" stroke-width="18" stroke-linecap="round"/>
      <text x="160" y="100" font-family="Sarabun" font-size="22" font-weight="bold" fill="#475569" text-anchor="middle">ลงแรงตีงูจนเหนื่อย</text>
    </g>
    <g transform="translate(480, 220)">
      <ellipse cx="60" cy="60" rx="45" ry="30" fill="#1e293b"/>
      <polygon points="105,60 135,65 105,75" fill="#f59e0b"/>
      <text x="60" y="130" font-family="Sarabun" font-size="24" font-weight="bold" fill="#0f172a" text-anchor="middle">กากลับบินมาคาบไปกิน 🦅</text>
    </g>
    <text x="400" y="90" font-family="Sarabun" font-size="28" font-weight="800" fill="#334155" text-anchor="middle">ตนเองลงทุนลงแรงเหน็ดเหนื่อย แต่ผลประโยชน์กลับตกแก่ผู้อื่น</text>
  </svg>`,

  'hidden-claws-tiger.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <rect width="800" height="600" fill="#fff7ed"/>
    <g transform="translate(260, 200)">
      <ellipse cx="140" cy="140" rx="120" ry="90" fill="#fdba74" stroke="#ea580c" stroke-width="8"/>
      <circle cx="100" cy="110" r="14" fill="#1e293b"/>
      <circle cx="180" cy="110" r="14" fill="#1e293b"/>
      <!-- Soft paws hiding sharp claws -->
      <ellipse cx="70" cy="220" rx="35" ry="25" fill="#fb923c"/>
      <ellipse cx="210" cy="220" rx="35" ry="25" fill="#fb923c"/>
      <text x="140" y="280" font-family="Sarabun" font-size="22" font-weight="bold" fill="#c2410c" text-anchor="middle">ดูภายนอกนิ่งสงบ ไม่โอ้อวด</text>
    </g>
    <text x="400" y="100" font-family="Sarabun" font-size="28" font-weight="800" fill="#9a3412" text-anchor="middle">คนเก่งมีความสามารถสูง แต่เก็บตัวไม่โอ้อวดความสามารถ</text>
  </svg>`,

  'good-carry-gable.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <rect width="800" height="600" fill="#f0fdf4"/>
    <g transform="translate(100, 240)">
      <polygon points="50,140 180,60 310,140" fill="none" stroke="#16a34a" stroke-width="12"/>
      <text x="180" y="190" font-family="Sarabun" font-size="24" font-weight="bold" fill="#15803d" text-anchor="middle">รักดีหามจั่ว (เบาสบาย สบายใจ) 🏠</text>
    </g>
    <g transform="translate(480, 240)">
      <rect x="60" y="40" width="180" height="40" rx="8" fill="#991b1b"/>
      <text x="150" y="190" font-family="Sarabun" font-size="24" font-weight="bold" fill="#991b1b" text-anchor="middle">รักชั่วหามเสา (หนักหนา ลำบาก) 🪵</text>
    </g>
    <text x="400" y="100" font-family="Sarabun" font-size="28" font-weight="800" fill="#14532d" text-anchor="middle">ประพฤติตนดีจะมีความสุขสบาย หากประพฤติชั่วชีวิตจะพบแต่ความลำบาก</text>
  </svg>`,

  'speak-two-pai-quiet-tamlung.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <rect width="800" height="600" fill="#fffbeb"/>
    <g transform="translate(120, 220)">
      <circle cx="120" cy="100" r="70" fill="#e2e8f0" stroke="#94a3b8" stroke-width="6"/>
      <text x="120" y="110" font-family="Sarabun" font-size="28" font-weight="bold" fill="#475569" text-anchor="middle">พูดไปได้ 2 ไพ</text>
      <text x="120" y="210" font-family="Sarabun" font-size="20" font-weight="bold" fill="#64748b" text-anchor="middle">มีค่าน้อย อาจเกิดโทษ</text>
    </g>
    <g transform="translate(480, 200)">
      <circle cx="120" cy="120" r="95" fill="#fef08a" stroke="#eab308" stroke-width="8"/>
      <text x="120" y="130" font-family="Sarabun" font-size="28" font-weight="800" fill="#a16207" text-anchor="middle">นิ่งเสียได้ตำลึงทอง ✨</text>
      <text x="120" y="240" font-family="Sarabun" font-size="20" font-weight="bold" fill="#854d0e" text-anchor="middle">มีค่าสูงกว่ามาก</text>
    </g>
    <text x="400" y="90" font-family="Sarabun" font-size="28" font-weight="800" fill="#713f12" text-anchor="middle">บางสถานการณ์ การนิ่งเฉยมีค่ายิ่งกว่าการพูดในสิ่งที่ไม่เกิดประโยชน์</text>
  </svg>`,

  'bad-friend-wrong.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <rect width="800" height="600" fill="#f8fafc"/>
    <g transform="translate(120, 220)">
      <circle cx="100" cy="80" r="40" fill="#cbd5e1"/>
      <text x="100" y="160" font-family="Sarabun" font-size="24" font-weight="bold" fill="#dc2626" text-anchor="middle">คบคนพาลพาไปหาผิด ❌</text>
    </g>
    <g transform="translate(460, 220)">
      <circle cx="100" cy="80" r="40" fill="#bbf7d0"/>
      <text x="100" y="160" font-family="Sarabun" font-size="24" font-weight="bold" fill="#16a34a" text-anchor="middle">คบบัณฑิตบัณฑิตพาไปหาผล ✅</text>
    </g>
    <text x="400" y="100" font-family="Sarabun" font-size="28" font-weight="800" fill="#1e293b" text-anchor="middle">การเลือกคบเพื่อนส่งผลต่อความเจริญหรือความเสื่อมของตนเอง</text>
  </svg>`,

  'four-feet-stumble.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <rect width="800" height="600" fill="#f1f5f9"/>
    <g transform="translate(250, 220)">
      <ellipse cx="150" cy="100" rx="90" ry="50" fill="#cbd5e1" stroke="#475569" stroke-width="6"/>
      <path d="M 90 140 L 70 190 M 120 145 L 140 190" stroke="#475569" stroke-width="10" stroke-linecap="round"/>
      <text x="150" y="240" font-family="Sarabun" font-size="24" font-weight="bold" fill="#334155" text-anchor="middle">ม้า 4 เท้ายังอาจสะดุดก้อนหินได้ 🐴</text>
    </g>
    <text x="400" y="100" font-family="Sarabun" font-size="28" font-weight="800" fill="#0f172a" text-anchor="middle">แม้แต่ผู้เชี่ยวชาญหรือรอบรู้ก็ย่อมมีโอกาสผิดพลาดได้ จึงไม่ควรประมาท</text>
  </svg>`,

  'fall-stairs-jump.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <rect width="800" height="600" fill="#fdf4ff"/>
    <g transform="translate(180, 200)">
      <polygon points="40,240 100,240 100,180 160,180 160,120 220,120 220,60 280,60 280,300 40,300" fill="#e879f9" stroke="#a21caf" stroke-width="6"/>
      <circle cx="340" cy="180" r="30" fill="#ffedd5"/>
      <text x="240" y="340" font-family="Sarabun" font-size="24" font-weight="bold" fill="#86198f" text-anchor="middle">ตกลงมาจึงจำเป็นต้องกระโดดตามน้ำ</text>
    </g>
    <text x="400" y="90" font-family="Sarabun" font-size="28" font-weight="800" fill="#701a75" text-anchor="middle">ตกอยู่ในสถานการณ์ที่จำเป็นต้องยอมทำตามเลยตามเลย</text>
  </svg>`,

  'drink-water-not-save-drought.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <rect width="800" height="600" fill="#fff1f2"/>
    <g transform="translate(150, 220)">
      <ellipse cx="100" cy="140" rx="70" ry="40" fill="#fda4af"/>
      <text x="100" y="210" font-family="Sarabun" font-size="22" font-weight="bold" fill="#be123c">กินน้ำจนหมดขัน 🥤</text>
    </g>
    <g transform="translate(480, 220)">
      <rect x="40" y="80" width="140" height="100" rx="8" fill="#e2e8f0"/>
      <text x="110" y="210" font-family="Sarabun" font-size="22" font-weight="bold" fill="#475569">เมื่อถึงฤดูแล้งกลับไม่มีน้ำเหลือ</text>
    </g>
    <text x="400" y="100" font-family="Sarabun" font-size="28" font-weight="800" fill="#9f1239" text-anchor="middle">ใช้จ่ายฟุ่มเฟือยโดยไม่คิดถึงอนาคตหรือยามยากลำบาก</text>
  </svg>`,

  'ear-to-field-eye-to-farm.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <rect width="800" height="600" fill="#f0fdfa"/>
    <g transform="translate(260, 200)">
      <circle cx="140" cy="120" r="60" fill="#ffedd5" stroke="#0d9488" stroke-width="6"/>
      <path d="M 110 115 Q 120 125 130 115 M 150 115 Q 160 125 170 115" stroke="#0f766e" stroke-width="4" fill="none"/>
      <text x="140" y="220" font-family="Sarabun" font-size="24" font-weight="bold" fill="#115e59" text-anchor="middle">แกล้งทำเป็นไม่ได้ยิน ไม่เห็น 🌾</text>
    </g>
    <text x="400" y="90" font-family="Sarabun" font-size="28" font-weight="800" fill="#134e4a" text-anchor="middle">ทำเป็นไม่รู้ไม่เห็น เพื่อหลีกเลี่ยงความยุ่งยากหรือเรื่องรำคาญใจ</text>
  </svg>`,

  'do-good-get-good.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <rect width="800" height="600" fill="#f0fdf4"/>
    <g transform="translate(150, 200)">
      <circle cx="100" cy="100" r="70" fill="#bbf7d0" stroke="#16a34a" stroke-width="6"/>
      <text x="100" y="105" font-family="Sarabun" font-size="26" font-weight="800" fill="#15803d" text-anchor="middle">ทำดีได้ดี 🌸</text>
      <text x="100" y="210" font-family="Sarabun" font-size="20" font-weight="bold" fill="#166534" text-anchor="middle">ผลคือความสุข ความเจริญ</text>
    </g>
    <g transform="translate(450, 200)">
      <circle cx="100" cy="100" r="70" fill="#fecaca" stroke="#dc2626" stroke-width="6"/>
      <text x="100" y="105" font-family="Sarabun" font-size="26" font-weight="800" fill="#b91c1c" text-anchor="middle">ทำชั่วได้ชั่ว 🥀</text>
      <text x="100" y="210" font-family="Sarabun" font-size="20" font-weight="bold" fill="#991b1b" text-anchor="middle">ผลคือความเดือดร้อน</text>
    </g>
    <text x="400" y="90" font-family="Sarabun" font-size="28" font-weight="800" fill="#14532d" text-anchor="middle">ผลลัพธ์ย่อมเป็นไปตามการกระทำของตนเองเสมอ</text>
  </svg>`,

  'honest-never-ends.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" width="100%" height="100%">
    <rect width="800" height="600" fill="#eff6ff"/>
    <g transform="translate(140, 200)">
      <circle cx="100" cy="100" r="75" fill="#bfdbfe" stroke="#2563eb" stroke-width="6"/>
      <text x="100" y="105" font-family="Sarabun" font-size="24" font-weight="800" fill="#1d4ed8" text-anchor="middle">ซื่อกินไม่หมด 💎</text>
      <text x="100" y="210" font-family="Sarabun" font-size="20" font-weight="bold" fill="#1e40af" text-anchor="middle">ซื่อสัตย์ ชีวิตยั่งยืน</text>
    </g>
    <g transform="translate(460, 200)">
      <circle cx="100" cy="100" r="75" fill="#fed7aa" stroke="#ea580c" stroke-width="6"/>
      <text x="100" y="105" font-family="Sarabun" font-size="24" font-weight="800" fill="#c2410c" text-anchor="middle">คดกินไม่นาน ⏳</text>
      <text x="100" y="210" font-family="Sarabun" font-size="20" font-weight="bold" fill="#9a3412" text-anchor="middle">ทุจริต อยู่ได้ไม่ยั่งยืน</text>
    </g>
    <text x="400" y="90" font-family="Sarabun" font-size="28" font-weight="800" fill="#1e3a8a" text-anchor="middle">คนซื่อสัตย์สุจริตจะเจริญรุ่งเรืองยาวนาน ส่วนคนคดโกงจะประสบปัญหาในที่สุด</text>
  </svg>`
};

for (const [file, content] of Object.entries(svgs)) {
  writeFileSync(join(dir, file), content.trim(), 'utf8');
}
console.log('Successfully created', Object.keys(svgs).length, 'SVGs in', dir);
