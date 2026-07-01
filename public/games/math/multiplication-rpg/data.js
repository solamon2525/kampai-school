/* data.js — คลังข้อมูลคำถามคณิตศาสตร์ ป.4 เรื่องการคูณ, อาชีพตัวละคร และมอนสเตอร์สำหรับ RPG */
window.GAME_DATA = {
    // ── ข้อมูลอาชีพของตัวละครผู้เล่น (Chibi Styles - Inline SVG) ──
    CHARACTERS: [
        {
            id: 'mage',
            name: 'จอมเวทตัวเลข',
            desc: 'ใช้พลังมนตราสุ่มตัวเลข คาถาทำลายล้างระยะไกล',
            weapon: 'คทาเลขฐานสิบ',
            maxHp: 100,
            color: '#a29bfe',
            // Chibi Wizard holding a glowing staff
            svg: `<svg viewBox="0 0 100 100" width="100%" height="100%">
                <!-- Background shadow -->
                <ellipse cx="50" cy="85" rx="25" ry="6" fill="rgba(0,0,0,0.2)"/>
                <!-- Wizard Cloak -->
                <path d="M30 80 L50 45 L70 80 Z" fill="#5f27cd" stroke="#341f97" stroke-width="2"/>
                <path d="M40 80 L50 50 L60 80 Z" fill="#ff9f43"/>
                <!-- Head -->
                <circle cx="50" cy="40" r="16" fill="#ffdbb5" stroke="#341f97" stroke-width="2"/>
                <!-- Eyes -->
                <circle cx="44" cy="38" r="2.5" fill="#341f97"/>
                <circle cx="56" cy="38" r="2.5" fill="#341f97"/>
                <path d="M42 34 Q45 32 47 34" stroke="#341f97" stroke-width="1.5" fill="none"/>
                <path d="M58 34 Q55 32 53 34" stroke="#341f97" stroke-width="1.5" fill="none"/>
                <path d="M48 46 Q50 48 52 46" stroke="#341f97" stroke-width="1.5" fill="none"/>
                <!-- Mage Hat -->
                <path d="M30 30 Q50 34 70 30 C70 30 65 10 50 5 C35 10 30 30 30 30 Z" fill="#341f97" stroke="#222f3e" stroke-width="2"/>
                <path d="M32 30 Q50 33 68 30" stroke="#f39c12" stroke-width="3" fill="none"/>
                <polygon points="50,5 53,-1 47,-1" fill="#f1c40f"/>
                <!-- Staff -->
                <rect x="72" y="30" width="4" height="55" rx="2" fill="#d63031"/>
                <circle cx="74" cy="25" r="7" fill="#00d2d3" stroke="#01a3a4" stroke-width="2" class="glow-pulse"/>
                <text x="74" y="28" font-family="monospace" font-weight="bold" font-size="10" fill="#fff" text-anchor="middle">×</text>
            </svg>`
        },
        {
            id: 'knight',
            name: 'อัศวินเรขาคณิต',
            desc: 'พลังป้องกันสูงด้วยโล่เหลี่ยมเพชร และดาบสั้นฟันเหล็ก',
            weapon: 'ดาบสามเหลี่ยมและโล่สี่เหลี่ยม',
            maxHp: 150,
            color: '#74b9ff',
            // Chibi Knight with metal armor and shield
            svg: `<svg viewBox="0 0 100 100" width="100%" height="100%">
                <ellipse cx="50" cy="85" rx="25" ry="6" fill="rgba(0,0,0,0.2)"/>
                <!-- Armor Body -->
                <rect x="32" y="52" width="36" height="30" rx="6" fill="#c8d6e5" stroke="#222f3e" stroke-width="2"/>
                <rect x="42" y="58" width="16" height="20" fill="#576574"/>
                <!-- Head & Helmet -->
                <circle cx="50" cy="38" r="15" fill="#ffdbb5" stroke="#222f3e" stroke-width="2"/>
                <path d="M32 35 C32 15 68 15 68 35 Z" fill="#8395a7" stroke="#222f3e" stroke-width="2"/>
                <rect x="36" y="30" width="28" height="6" rx="2" fill="#576574"/>
                <!-- Visor slits -->
                <line x1="42" y1="33" x2="42" y2="33.5" stroke="#ff9f43" stroke-width="2"/>
                <line x1="50" y1="33" x2="50" y2="33.5" stroke="#ff9f43" stroke-width="2"/>
                <line x1="58" y1="33" x2="58" y2="33.5" stroke="#ff9f43" stroke-width="2"/>
                <path d="M50 15 L50 5" stroke="#d63031" stroke-width="3" fill="none"/>
                <!-- Shield -->
                <path d="M15 50 L28 45 L28 65 L21 72 L15 65 Z" fill="#ee5253" stroke="#222f3e" stroke-width="1.5"/>
                <text x="21" y="62" font-weight="bold" font-size="10" fill="#fff" text-anchor="middle">+</text>
                <!-- Sword -->
                <path d="M72 75 L80 40 L84 43 L76 77 Z" fill="#c8d6e5" stroke="#222f3e" stroke-width="1.5"/>
                <rect x="70" y="74" width="10" height="3" rx="1" fill="#f1c40f" transform="rotate(-15 75 75)"/>
                <rect x="74" y="77" width="3" height="8" fill="#d63031"/>
            </svg>`
        },
        {
            id: 'archer',
            name: 'นักธนูสถิติ',
            desc: 'ยิงธนูด้วยความเร็วสูงและสถิติแม่นยำ สลายร่างศัตรูทันที',
            weapon: 'คันธนูภูมิศาสตร์คณิต',
            maxHp: 110,
            color: '#55efc4',
            // Chibi Archer with forest green hood
            svg: `<svg viewBox="0 0 100 100" width="100%" height="100%">
                <ellipse cx="50" cy="85" rx="25" ry="6" fill="rgba(0,0,0,0.2)"/>
                <!-- Archer Body -->
                <path d="M33 80 C33 60 67 60 67 80 Z" fill="#10ac84" stroke="#222f3e" stroke-width="2"/>
                <!-- Head -->
                <circle cx="50" cy="40" r="16" fill="#ffdbb5" stroke="#222f3e" stroke-width="2"/>
                <path d="M32 36 Q50 10 68 36 Z" fill="#10ac84" stroke="#222f3e" stroke-width="2"/>
                <!-- Eyes -->
                <circle cx="44" cy="41" r="2.5" fill="#222f3e"/>
                <circle cx="56" cy="41" r="2.5" fill="#222f3e"/>
                <path d="M43 45 Q50 48 57 45" stroke="#222f3e" stroke-width="1.5" fill="none"/>
                <!-- Bow -->
                <path d="M76 25 Q68 50 76 75" stroke="#ff9f43" stroke-width="3" fill="none"/>
                <line x1="76" y1="25" x2="76" y2="75" stroke="#c8d6e5" stroke-width="1"/>
                <!-- Arrow -->
                <line x1="60" y1="50" x2="84" y2="50" stroke="#222f3e" stroke-width="2"/>
                <polygon points="84,50 80,47 80,53" fill="#ff9f43"/>
            </svg>`
        },
        {
            id: 'rogue',
            name: 'นักดาบสมการ',
            desc: 'ว่องไว ดาบคู่ฟันสองจังหวะ สร้างความเสียหายคริติคอลสูง',
            weapon: 'ดาบคู่สมการคูณ',
            maxHp: 120,
            color: '#ff7675',
            // Chibi Rogue with dual daggers
            svg: `<svg viewBox="0 0 100 100" width="100%" height="100%">
                <ellipse cx="50" cy="85" rx="25" ry="6" fill="rgba(0,0,0,0.2)"/>
                <!-- Body Cloak -->
                <path d="M32 80 L50 50 L68 80 Z" fill="#2c3e50" stroke="#222f3e" stroke-width="2"/>
                <!-- Head with red bandana -->
                <circle cx="50" cy="40" r="15" fill="#ffdbb5" stroke="#222f3e" stroke-width="2"/>
                <path d="M33 34 C33 20 67 20 67 34 Z" fill="#ee5253" stroke="#222f3e" stroke-width="1.5"/>
                <rect x="33" y="32" width="34" height="4" fill="#ee5253"/>
                <!-- Eyes (sharp look) -->
                <path d="M41 38 L47 40" stroke="#222f3e" stroke-width="2"/>
                <path d="M59 38 L53 40" stroke="#222f3e" stroke-width="2"/>
                <circle cx="44" cy="43" r="1.5" fill="#222f3e"/>
                <circle cx="56" cy="43" r="1.5" fill="#222f3e"/>
                <!-- Red mask covering mouth -->
                <path d="M38 46 L50 55 L62 46 Z" fill="#ee5253" stroke="#222f3e" stroke-width="1"/>
                <!-- Dual Daggers -->
                <path d="M22 75 L14 48 L17 48 L25 75 Z" fill="#c8d6e5" stroke="#222f3e" stroke-width="1.5"/>
                <path d="M78 75 L86 48 L83 48 L75 75 Z" fill="#c8d6e5" stroke="#222f3e" stroke-width="1.5"/>
            </svg>`
        }
    ],

    // ── บทเรียนทั้ง 3 (Chapters) ──
    CHAPTERS: [
        {
            id: 1,
            title: 'บทที่ 1: หนึ่งหลักถล่มด่าน',
            desc: 'การคูณจำนวน 1 หลักกับจำนวนมากกว่า 4 หลัก',
            bossName: 'อสูรหลักหน่วยสไลม์ยักษ์',
            themeColor: '#4be07a'
        },
        {
            id: 2,
            title: 'บทที่ 2: สองหลักประจัญบาน',
            desc: 'การคูณจำนวน 2 หลักกับจำนวน 2-3 หลัก',
            bossName: 'โกเลมตารางร้อยกิโล',
            themeColor: '#ffce54'
        },
        {
            id: 3,
            title: 'บทที่ 3: โจทย์ปัญหาเวหาคูณ',
            desc: 'การวิเคราะห์และแก้ไขโจทย์ปัญหาการคูณในชีวิตจริง',
            bossName: 'มังกรคูณวิเคราะห์สามหัว',
            themeColor: '#ff5c72'
        }
    ],

    // ── มอนสเตอร์ทั่วไปและบอส (Chibi Styles - Inline SVG) ──
    MONSTERS: {
        // --- มอนสเตอร์บทที่ 1 (ธีมสไลม์/ธรรมชาติ) ---
        slime: {
            name: 'สไลม์คูณหนึ่ง',
            hp: 200,
            svg: `<svg viewBox="0 0 100 100" width="100%" height="100%">
                <ellipse cx="50" cy="85" rx="30" ry="8" fill="rgba(0,0,0,0.15)"/>
                <path d="M20 70 Q10 40 50 20 Q90 40 80 70 C80 82 20 82 20 70 Z" fill="#2ed573" stroke="#26af5f" stroke-width="3"/>
                <circle cx="38" cy="50" r="4" fill="#fff"/>
                <circle cx="39" cy="51" r="1.5" fill="#000"/>
                <circle cx="62" cy="50" r="4" fill="#fff"/>
                <circle cx="61" cy="51" r="1.5" fill="#000"/>
                <path d="M45 62 Q50 67 55 62" stroke="#222f3e" stroke-width="2" fill="none"/>
                <!-- Slime Core -->
                <text x="50" y="38" font-family="sans-serif" font-weight="bold" font-size="12" fill="#10ac84" text-anchor="middle">×</text>
            </svg>`
        },
        bat: {
            name: 'ค้างคาวศูนย์ลวงตา',
            hp: 250,
            svg: `<svg viewBox="0 0 100 100" width="100%" height="100%">
                <ellipse cx="50" cy="85" rx="20" ry="5" fill="rgba(0,0,0,0.15)"/>
                <!-- Wings -->
                <path d="M30 45 L10 25 L20 50 L35 55 Z" fill="#2f3542" stroke="#000" stroke-width="2"/>
                <path d="M70 45 L90 25 L80 50 L65 55 Z" fill="#2f3542" stroke="#000" stroke-width="2"/>
                <!-- Body -->
                <circle cx="50" cy="50" r="18" fill="#57606f" stroke="#2f3542" stroke-width="2"/>
                <!-- Ears -->
                <polygon points="38,36 34,22 44,32" fill="#2f3542"/>
                <polygon points="62,36 66,22 56,32" fill="#2f3542"/>
                <!-- Eyes -->
                <circle cx="44" cy="46" r="3" fill="#ff4757"/>
                <circle cx="56" cy="46" r="3" fill="#ff4757"/>
                <polygon points="46,56 50,52 54,56" fill="#fff"/>
            </svg>`
        },
        boss1: {
            name: 'อสูรหลักหน่วยสไลม์ยักษ์ (บอสบทที่ 1)',
            hp: 400,
            isBoss: true,
            svg: `<svg viewBox="0 0 100 100" width="100%" height="100%">
                <ellipse cx="50" cy="88" rx="40" ry="10" fill="rgba(0,0,0,0.2)"/>
                <path d="M10 75 Q-5 35 50 10 Q105 35 90 75 C90 90 10 90 10 75 Z" fill="#ff4757" stroke="#ea2027" stroke-width="4"/>
                <circle cx="35" cy="45" r="7" fill="#fff"/>
                <circle cx="37" cy="47" r="3" fill="#000"/>
                <circle cx="65" cy="45" r="7" fill="#fff"/>
                <circle cx="63" cy="47" r="3" fill="#000"/>
                <!-- Angry eyebrows -->
                <path d="M28 35 L42 41" stroke="#222f3e" stroke-width="3"/>
                <path d="M72 35 L58 41" stroke="#222f3e" stroke-width="3"/>
                <path d="M40 65 Q50 55 60 65" stroke="#222f3e" stroke-width="3" fill="none"/>
                <!-- King Crown -->
                <polygon points="35,14 42,-2 50,10 58,-2 65,14" fill="#f1c40f" stroke="#d35400" stroke-width="2"/>
            </svg>`
        },

        // --- มอนสเตอร์บทที่ 2 (ธีมเหล็ก/ตารางเศษส่วน) ---
        gear: {
            name: 'ฟันเฟืองทวีคูณ',
            hp: 300,
            svg: `<svg viewBox="0 0 100 100" width="100%" height="100%">
                <ellipse cx="50" cy="85" rx="26" ry="6" fill="rgba(0,0,0,0.15)"/>
                <!-- Outer gear shape -->
                <circle cx="50" cy="50" r="28" fill="#747d8c" stroke="#2f3542" stroke-width="2"/>
                <rect x="44" y="16" width="12" height="68" rx="2" fill="#747d8c" transform="rotate(0 50 50)"/>
                <rect x="44" y="16" width="12" height="68" rx="2" fill="#747d8c" transform="rotate(45 50 50)"/>
                <rect x="44" y="16" width="12" height="68" rx="2" fill="#747d8c" transform="rotate(90 50 50)"/>
                <rect x="44" y="16" width="12" height="68" rx="2" fill="#747d8c" transform="rotate(135 50 50)"/>
                <circle cx="50" cy="50" r="22" fill="#a4b0be" stroke="#2f3542" stroke-width="2"/>
                <!-- Center Core -->
                <circle cx="50" cy="50" r="10" fill="#57606f"/>
                <!-- Face -->
                <circle cx="44" cy="46" r="2" fill="#fff"/>
                <circle cx="56" cy="46" r="2" fill="#fff"/>
                <line x1="45" y1="54" x2="55" y2="54" stroke="#fff" stroke-width="2"/>
            </svg>`
        },
        golem: {
            name: 'หุ่นยนต์ศิลากลาง',
            hp: 350,
            svg: `<svg viewBox="0 0 100 100" width="100%" height="100%">
                <ellipse cx="50" cy="85" rx="28" ry="7" fill="rgba(0,0,0,0.18)"/>
                <!-- Stone block body -->
                <rect x="25" y="45" width="50" height="36" rx="4" fill="#a4b0be" stroke="#57606f" stroke-width="3"/>
                <!-- Arms -->
                <rect x="14" y="48" width="10" height="28" rx="3" fill="#747d8c" stroke="#57606f" stroke-width="2"/>
                <rect x="76" y="48" width="10" height="28" rx="3" fill="#747d8c" stroke="#57606f" stroke-width="2"/>
                <!-- Head -->
                <rect x="36" y="24" width="28" height="20" rx="3" fill="#a4b0be" stroke="#57606f" stroke-width="2.5"/>
                <!-- Eye visor -->
                <rect x="40" y="30" width="20" height="5" fill="#f1c40f" stroke="#d35400" stroke-width="1"/>
            </svg>`
        },
        boss2: {
            name: 'โกเลมตารางร้อยกิโล (บอสบทที่ 2)',
            hp: 600,
            isBoss: true,
            svg: `<svg viewBox="0 0 100 100" width="100%" height="100%">
                <ellipse cx="50" cy="88" rx="38" ry="9" fill="rgba(0,0,0,0.22)"/>
                <!-- Giant Stone Block Body -->
                <rect x="20" y="38" width="60" height="46" rx="5" fill="#57606f" stroke="#2f3542" stroke-width="4"/>
                <!-- Grid pattern on body -->
                <line x1="35" y1="38" x2="35" y2="84" stroke="#2f3542" stroke-width="2"/>
                <line x1="50" y1="38" x2="50" y2="84" stroke="#2f3542" stroke-width="2"/>
                <line x1="65" y1="38" x2="65" y2="84" stroke="#2f3542" stroke-width="2"/>
                <line x1="20" y1="53" x2="80" y2="53" stroke="#2f3542" stroke-width="2"/>
                <line x1="20" y1="68" x2="80" y2="68" stroke="#2f3542" stroke-width="2"/>
                <!-- Oversized Glowing Arms -->
                <rect x="6" y="42" width="14" height="38" rx="4" fill="#2f3542" stroke="#000" stroke-width="2"/>
                <rect x="80" y="42" width="14" height="38" rx="4" fill="#2f3542" stroke="#000" stroke-width="2"/>
                <!-- Head -->
                <rect x="35" y="16" width="30" height="22" rx="3" fill="#747d8c" stroke="#2f3542" stroke-width="3"/>
                <!-- Giant red glowing eye visor -->
                <rect x="40" y="22" width="20" height="6" rx="2" fill="#ff4757" stroke="#ff2222" stroke-width="1.5" class="glow-pulse"/>
            </svg>`
        },

        // --- มอนสเตอร์บทที่ 3 (ธีมมังกร/อัญมณีเวทมนตร์) ---
        griffin: {
            name: 'กริฟฟินตัวแปรต้น',
            hp: 400,
            svg: `<svg viewBox="0 0 100 100" width="100%" height="100%">
                <ellipse cx="50" cy="85" rx="26" ry="6" fill="rgba(0,0,0,0.15)"/>
                <!-- Wings -->
                <path d="M12 40 Q30 20 42 45 Z" fill="#f1c40f" stroke="#d35400" stroke-width="2"/>
                <path d="M88 40 Q70 20 58 45 Z" fill="#f1c40f" stroke="#d35400" stroke-width="2"/>
                <!-- Body -->
                <path d="M35 75 C35 55 65 55 65 75 Z" fill="#e67e22" stroke="#d35400" stroke-width="2"/>
                <!-- Eagle Head -->
                <circle cx="50" cy="40" r="15" fill="#f1c40f" stroke="#d35400" stroke-width="2"/>
                <!-- Beak -->
                <polygon points="50,42 62,38 50,34" fill="#f39c12" stroke="#d35400" stroke-width="1.5"/>
                <!-- Eyes -->
                <circle cx="46" cy="36" r="2" fill="#000"/>
            </svg>`
        },
        dragon: {
            name: 'ลูกมังกรทวีผล',
            hp: 450,
            svg: `<svg viewBox="0 0 100 100" width="100%" height="100%">
                <ellipse cx="50" cy="85" rx="28" ry="6" fill="rgba(0,0,0,0.15)"/>
                <!-- Tail -->
                <path d="M30 75 Q15 80 20 65 Q25 55 35 70" stroke="#9b59b6" stroke-width="5" fill="none"/>
                <!-- Body -->
                <path d="M35 75 C35 50 65 50 65 75 Z" fill="#9b59b6" stroke="#8e44ad" stroke-width="2"/>
                <!-- Head -->
                <circle cx="50" cy="38" r="16" fill="#9b59b6" stroke="#8e44ad" stroke-width="2.5"/>
                <!-- Horns -->
                <polygon points="40,24 35,10 46,20" fill="#8e44ad"/>
                <polygon points="60,24 65,10 54,20" fill="#8e44ad"/>
                <!-- Eyes -->
                <circle cx="44" cy="36" r="2.5" fill="#2ecc71"/>
                <circle cx="56" cy="36" r="2.5" fill="#2ecc71"/>
                <!-- Cheeks -->
                <circle cx="40" cy="42" r="2" fill="#ff7675"/>
                <circle cx="60" cy="42" r="2" fill="#ff7675"/>
            </svg>`
        },
        boss3: {
            name: 'มังกรคูณวิเคราะห์สามหัว (บอสใหญ่บทที่ 3)',
            hp: 900,
            isBoss: true,
            svg: `<svg viewBox="0 0 100 100" width="100%" height="100%">
                <ellipse cx="50" cy="90" rx="42" ry="10" fill="rgba(0,0,0,0.25)"/>
                <!-- Large Dragon Body -->
                <path d="M25 80 C25 45 75 45 75 80 Z" fill="#44bd32" stroke="#2d8a1e" stroke-width="4"/>
                <!-- Wings -->
                <path d="M25 60 L2 35 L12 65 Z" fill="#2f3640" stroke="#000" stroke-width="2"/>
                <path d="M75 60 L98 35 L88 65 Z" fill="#2f3640" stroke="#000" stroke-width="2"/>
                <!-- Left Head -->
                <path d="M30 55 L22 30 Q16 28 20 22 L34 40 Z" fill="#44bd32" stroke="#2d8a1e" stroke-width="2"/>
                <circle cx="21" cy="26" r="2" fill="#e1b12c"/>
                <!-- Right Head -->
                <path d="M70 55 L78 30 Q84 28 80 22 L66 40 Z" fill="#44bd32" stroke="#2d8a1e" stroke-width="2"/>
                <circle cx="79" cy="26" r="2" fill="#e1b12c"/>
                <!-- Main Center Head -->
                <path d="M50 50 L50 24 L44 14 Q50 8 56 14 L56 24 Z" fill="#4cfa22" stroke="#2d8a1e" stroke-width="3"/>
                <polygon points="44,14 36,-2 48,8" fill="#e1b12c"/>
                <polygon points="56,14 64,-2 52,8" fill="#e1b12c"/>
                <!-- Main Eyes -->
                <circle cx="47" cy="22" r="3" fill="#e1b12c" stroke="#44bd32" stroke-width="1"/>
                <circle cx="53" cy="22" r="3" fill="#e1b12c" stroke="#44bd32" stroke-width="1"/>
            </svg>`
        }
    },

    // ── คลังคำถามวิชาคณิตศาสตร์เรื่องการคูณ (ป.4) แยกตามบทเรียน ──
    QUESTIONS: {
        // --- บทที่ 1: คูณ 1 หลักกับจำนวนมากกว่า 4 หลัก ---
        chapter1: [
            {
                q: 'ผลคูณของ 4 × 23,410 มีค่าเท่ากับเท่าใด?',
                choices: ['93,640', '92,840', '89,640', '95,640'],
                answer: 0,
                hint: 'ลองเริ่มคูณจากหลักหน่วย: 4 × 0 = 0, จากนั้น 4 × 1 = 4, 4 × 4 = 16 (ใส่ 6 ทด 1)...',
                explain: '4 × 23,410 = 93,640'
            },
            {
                q: 'ผลคูณของ 6 × 12,055 มีค่าเท่ากับเท่าใด?',
                choices: ['72,030', '72,330', '70,230', '72,130'],
                answer: 1,
                hint: 'ตั้งคูณจากขวาไปซ้าย: 6 × 5 = 30 (ใส่ 0 ทด 3), 6 × 5 = 30 บวกทด 3 ได้ 33 (ใส่ 3 ทด 3)...',
                explain: '6 × 12,055 = 72,330'
            },
            {
                q: 'ผลคูณของ 7 × 43,121 มีค่าเท่ากับเท่าใด?',
                choices: ['301,847', '299,847', '302,647', '287,847'],
                answer: 0,
                hint: 'คูณทีละหลัก: 7 × 1 = 7, 7 × 2 = 14 (ใส่ 4 ทด 1), 7 × 1 + 1 = 8...',
                explain: '7 × 43,121 = 301,847'
            },
            {
                q: 'ผลคูณของ 3 × 95,200 มีค่าเท่ากับเท่าใด?',
                choices: ['285,600', '275,600', '285,000', '295,600'],
                answer: 0,
                hint: 'ใส่ศูนย์สองตัวข้างหลังไว้ล่วงหน้า แล้วนำ 3 คูณกับ 952',
                explain: '3 × 952 = 2,856 เติม 00 ได้ 285,600'
            },
            {
                q: 'ผลคูณของ 8 × 15,110 มีค่าเท่ากับเท่าใด?',
                choices: ['120,880', '118,880', '121,880', '122,880'],
                answer: 0,
                hint: '8 × 10 = 80, 8 × 100 = 800, 8 × 5,000 = 40,000...',
                explain: '8 × 15,110 = 120,880'
            },
            {
                q: 'ถ้า 5 × A = 250,550 ค่าของ A คือข้อใด?',
                choices: ['50,110', '50,011', '50,101', '50,111'],
                answer: 0,
                hint: 'นำ 250,550 หารด้วย 5 เพื่อหาค่า A หรือลองนำตัวเลือกคูณด้วย 5',
                explain: '5 × 50,110 = 250,550'
            },
            {
                q: 'ผลคูณของ 9 × 30,250 มีค่าเท่ากับเท่าใด?',
                choices: ['272,250', '270,250', '272,000', '271,850'],
                answer: 0,
                hint: 'คิดแบบแยกส่วน: 9 × 30,000 = 270,000 และ 9 × 250 = 2,250',
                explain: '270,000 + 2,250 = 272,250'
            },
            {
                q: 'ผลคูณของ 2 × 84,399 มีค่าเท่ากับเท่าใด?',
                choices: ['168,798', '168,698', '168,788', '167,798'],
                answer: 0,
                hint: 'ลองปัดเศษเป็น 2 × 84,400 = 168,800 แล้วหักออกไป 2',
                explain: '2 × 84,399 = 168,798'
            },
            {
                q: 'ผลคูณของ 6 × 50,005 มีค่าเท่ากับเท่าใด?',
                choices: ['300,030', '300,300', '300,003', '303,030'],
                answer: 0,
                hint: '6 × 50,000 = 300,000 และ 6 × 5 = 30',
                explain: '300,000 + 30 = 300,030'
            },
            {
                q: 'ข้อใดมีผลคูณมากที่สุด?',
                choices: ['3 × 60,000', '4 × 40,000', '2 × 95,000', '5 × 35,000'],
                answer: 2,
                hint: 'คำนวณผลคูณแต่ละข้อ: A = 180k, B = 160k, C = 190k, D = 175k',
                explain: '2 × 95,000 = 190,000 ซึ่งเป็นจำนวนที่มากที่สุดในตัวเลือก'
            }
        ],

        // --- บทที่ 2: คูณ 2 หลักกับจำนวน 2-3 หลัก ---
        chapter2: [
            {
                q: 'ผลคูณของ 12 × 45 มีค่าเท่ากับเท่าใด?',
                choices: ['540', '480', '520', '560'],
                answer: 0,
                hint: 'คิดง่ายๆ: 10 × 45 = 450 และ 2 × 45 = 90 จากนั้นบวกกัน',
                explain: '450 + 90 = 540'
            },
            {
                q: 'ผลคูณของ 25 × 150 มีค่าเท่ากับเท่าใด?',
                choices: ['3,750', '3,550', '3,650', '3,850'],
                answer: 0,
                hint: 'คุณรู้หรือไม่ 4 × 25 = 100 ดังนั้น 150 × 25 = (150/4) × 100',
                explain: '25 × 150 = 3,750'
            },
            {
                q: 'ผลคูณของ 15 × 60 มีค่าเท่ากับเท่าใด?',
                choices: ['900', '750', '850', '950'],
                answer: 0,
                hint: '10 × 60 = 600 และ 5 × 60 = 300',
                explain: '600 + 300 = 900'
            },
            {
                q: 'ผลคูณของ 99 × 48 มีค่าเท่ากับเท่าใด?',
                choices: ['4,752', '4,852', '4,652', '4,762'],
                answer: 0,
                hint: 'ใช้สูตรลัด: 100 × 48 = 4,800 แล้วลบออกด้วย 48',
                explain: '4,800 - 48 = 4,752'
            },
            {
                q: 'ผลคูณของ 35 × 200 มีค่าเท่ากับเท่าใด?',
                choices: ['7,000', '6,500', '7,500', '8,000'],
                answer: 0,
                hint: '35 × 2 = 70 จากนั้นเติม 0 ต่อท้ายสองตัว',
                explain: '35 × 200 = 7,000'
            },
            {
                q: 'ผลคูณของ 11 × 234 มีค่าเท่ากับเท่าใด?',
                choices: ['2,574', '2,474', '2,564', '2,374'],
                answer: 0,
                hint: '10 × 234 = 2,340 บวกกับอีก 1 × 234 = 234',
                explain: '2,340 + 234 = 2,574'
            },
            {
                q: 'ผลคูณของ 20 × 850 มีค่าเท่ากับเท่าใด?',
                choices: ['17,000', '16,000', '17,500', '18,000'],
                answer: 0,
                hint: '2 × 85 = 170 จากนั้นเติม 0 สองตัวที่เหลือต่อท้าย',
                explain: '170 ต่อ 00 ได้ 17,000'
            },
            {
                q: 'ผลคูณของ 50 × 120 มีค่าเท่ากับเท่าใด?',
                choices: ['6,000', '5,000', '6,500', '5,500'],
                answer: 0,
                hint: '5 × 12 = 60 แล้วเติมนูลสองตัวตามหลัง',
                explain: '50 × 120 = 6,000'
            },
            {
                q: 'ผลคูณของ 44 × 25 มีค่าเท่ากับเท่าใด?',
                choices: ['1,100', '1,000', '1,200', '1,050'],
                answer: 0,
                hint: 'เปลี่ยน 44 × 25 เป็น 11 × 4 × 25 = 11 × 100',
                explain: '11 × 100 = 1,100'
            },
            {
                q: 'ผลคูณของ 13 × 300 มีค่าเท่ากับเท่าใด?',
                choices: ['3,900', '3,600', '4,200', '3,800'],
                answer: 0,
                hint: '13 × 3 = 39 จากนั้นเติม 0 สองตัว',
                explain: '13 × 300 = 3,900'
            }
        ],

        // --- บทที่ 3: โจทย์ปัญหาการคูณเชิงวิเคราะห์ ---
        chapter3: [
            {
                q: 'แม่ค้าจัดส้มใส่ตะกร้า 15 ตะกร้า ตะกร้าละ 120 ผล แม่ค้ามีส้มทั้งหมดกี่ผล?',
                choices: ['1,800 ผล', '1,500 ผล', '1,650 ผล', '2,000 ผล'],
                answer: 0,
                hint: 'คำนวณด้วยสมการคูณ: 15 × 120 ผล',
                explain: '15 × 120 = 1,800 ผล'
            },
            {
                q: 'โรงเรียนจัดเก้าอี้ 24 แถว แถวละ 15 ตัว โรงเรียนจัดเก้าอี้ทั้งหมดกี่ตัว?',
                choices: ['360 ตัว', '340 ตัว', '350 ตัว', '380 ตัว'],
                answer: 0,
                hint: 'คำนวณจาก 24 × 15 ตัว',
                explain: '24 × 15 = 360 ตัว'
            },
            {
                q: 'ตั๋วรถไฟราคาใบละ 350 บาท หากซื้อตั๋ว 12 ใบ ต้องจ่ายเงินทั้งหมดกี่บาท?',
                choices: ['4,200 บาท', '4,000 บาท', '3,900 บาท', '4,500 บาท'],
                answer: 0,
                hint: 'ตั้งสมการ: 350 × 12 บาท',
                explain: '350 × 12 = 4,200 บาท'
            },
            {
                q: 'ชาวสวนปลูกมะพร้าวเป็นแนว 8 แถว แถวละ 1,250 ต้น ชาวสวนปลูกมะพร้าวทั้งหมดกี่ต้น?',
                choices: ['10,000 ต้น', '9,000 ต้น', '8,000 ต้น', '11,000 ต้น'],
                answer: 0,
                hint: 'ตั้งคูณ: 8 × 1,250 ต้น',
                explain: '8 × 1,250 = 10,000 ต้น'
            },
            {
                q: 'พ่อค้ามีข้าวสาร 50 ถุง ถุงละ 45 กิโลกรัม พ่อค้ามีข้าวสารรวมกี่กิโลกรัม?',
                choices: ['2,250 กิโลกรัม', '2,000 กิโลกรัม', '2,500 กิโลกรัม', '2,150 กิโลกรัม'],
                answer: 0,
                hint: '50 × 45 กิโลกรัม',
                explain: '50 × 45 = 2,250 กิโลกรัม'
            },
            {
                q: 'ออมสินหยอดกระปุกวันละ 45 บาท เป็นเวลา 30 วัน ออมสินจะมีเงินรวมกี่บาท?',
                choices: ['1,350 บาท', '1,200 บาท', '1,400 บาท', '1,500 บาท'],
                answer: 0,
                hint: 'นำเงินออมต่อวัน คูณจำนวนวัน: 45 × 30',
                explain: '45 × 30 = 1,350 บาท'
            },
            {
                q: 'หนังสือเล่มหนึ่งมี 12 บท แต่ละบทมี 18 หน้า หนังสือเล่มนี้มีหน้าทั้งหมดกี่หน้า?',
                choices: ['216 หน้า', '196 หน้า', '206 หน้า', '226 หน้า'],
                answer: 0,
                hint: 'คำนวณจาก 12 × 18 หน้า',
                explain: '12 × 18 = 216 หน้า'
            },
            {
                q: 'ตึกหลังหนึ่งมี 15 ชั้น แต่ละชั้นมีหลอดไฟ 80 ดวง ตึกหลังนี้มีหลอดไฟทั้งหมดกี่ดวง?',
                choices: ['1,200 ดวง', '1,000 ดวง', '1,500 ดวง', '1,100 ดวง'],
                answer: 0,
                hint: 'ตั้งคูณ: 15 × 80',
                explain: '15 × 80 = 1,200 ดวง'
            },
            {
                q: 'น้ำดื่ม 1 แพ็ก มี 12 ขวด หากซื้อน้ำดื่ม 40 แพ็ก จะได้น้ำดื่มทั้งหมดกี่ขวด?',
                choices: ['480 ขวด', '400 ขวด', '500 ขวด', '450 ขวด'],
                answer: 0,
                hint: 'คูณจำนวนขวดต่อแพ็กด้วยจำนวนแพ็ก: 12 × 40',
                explain: '12 × 40 = 480 ขวด'
            },
            {
                q: 'ที่ดินแปลงหนึ่งปลูกยางพารา 25 แถว แถวละ 250 ต้น รวมมียางพารากี่ต้น?',
                choices: ['6,250 ต้น', '5,000 ต้น', '6,000 ต้น', '6,500 ต้น'],
                answer: 0,
                hint: 'ตั้งคูณ: 25 × 250',
                explain: '25 × 250 = 6,250 ต้น'
            }
        ]
    }
};
