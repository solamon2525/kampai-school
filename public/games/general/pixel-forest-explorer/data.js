window.GAME_DATA = {
  grass: ['#4f9f45', '#56aa49', '#48933f'],
  deepGrass: '#3e873b',
  path: ['#c59a62', '#b98b56'],
  water: ['#3f91b8', '#4aa6c8', '#67bbd3'],
  flowers: ['#fff07a', '#ff8ab8', '#f6f1ea', '#a98cff'],
  treeLeaf: ['#1f6f38', '#287f42', '#35944d'],
  treeDark: '#174f2c',
  trunk: ['#70472c', '#8a5a34'],
  hero: { hair: '#4b2e26', skin: '#f5c38b', shirt: '#315da8', cape: '#d9493f', boot: '#402e2a', sword: '#e9f1e8' },
  monsters: {
    slime: { name: 'สไลม์มอส', color: '#63c74d', dark: '#327345', hp: 18, damage: 4, speed: 20, xp: 14 },
    boar: { name: 'หมูป่าหนาม', color: '#9a6846', dark: '#54352b', hp: 32, damage: 7, speed: 24, xp: 22 },
    shaman: { name: 'ชาแมนเห็ด', color: '#b66bd3', dark: '#61347a', hp: 24, damage: 6, speed: 15, xp: 28 },
    thornling: { name: 'ภูตรากหนาม', color: '#76b852', dark: '#315f32', hp: 28, damage: 7, speed: 18, xp: 30 },
    mireling: { name: 'คางคกหมอกพิษ', color: '#91a957', dark: '#4b6038', hp: 38, damage: 9, speed: 16, xp: 38 },
    sentinel: { name: 'อัศวินศิลารูน', color: '#8d91a1', dark: '#4d5263', hp: 52, damage: 11, speed: 14, xp: 52 }
  },
  skills: [
    { id: 'blade', icon: '⚔️', name: 'คมดาบ', desc: 'พลังโจมตี +3 ต่อระดับ' },
    { id: 'heart', icon: '❤️', name: 'หัวใจนักกล้า', desc: 'HP สูงสุด +12 และฟื้นเต็ม' },
    { id: 'boots', icon: '👢', name: 'ฝีเท้าวายุ', desc: 'ความเร็วเดิน +6' },
    { id: 'crit', icon: '✨', name: 'คมดาบประกาย', desc: 'โอกาสคริติคอล +5%' }
  ],
  classes: {
    swordsman: { name: 'นักดาบพิทักษ์', icon: '⚔️', color: '#315da8', hp: 62, damage: 14, speed: 57, attack: 'ดาบวงกว้าง', active: 'พายุคมดาบ' },
    ranger: { name: 'พรานธนูพงไพร', icon: '🏹', color: '#3f8d4f', hp: 48, damage: 11, speed: 66, attack: 'ลูกธนูระยะไกล', active: 'ศรสามสาย' },
    mage: { name: 'จอมเวทรูน', icon: '🔮', color: '#754aa3', hp: 42, damage: 13, speed: 59, attack: 'ลูกแก้วเวท', active: 'ระเบิดอาคม' }
  },
  zones: {
    village: { name: 'หมู่บ้านแสงใบไม้', short: 'หมู่บ้าน', chapter: 1, grass: ['#66ad55', '#70b85d', '#5da34f'], accent: '#fff4a8', material: 'wood' },
    mosswood: { name: 'ป่ามอสนิรันดร์', short: 'ป่ามอส', chapter: 2, grass: ['#3e873b', '#478f40', '#357933'], accent: '#85ce5d', material: 'moss' },
    swamp: { name: 'หนองน้ำหมอกพิษ', short: 'หนองน้ำ', chapter: 3, grass: ['#567a45', '#607f4b', '#4a6c3d'], accent: '#c4d66b', material: 'swamp_ore' },
    ruins: { name: 'วิหารรูนโบราณ', short: 'วิหาร', chapter: 4, grass: ['#617567', '#697d70', '#56695d'], accent: '#b9a5ff', material: 'ancient_shard' }
  },
  chapters: [
    { id: 1, zone: 'village', title: 'บทที่ 1 — เสียงเรียกของผู้พิทักษ์', story: 'หัวหน้าหมู่บ้านมอบอาวุธฝึกหัดให้ฮีโร่ พิสูจน์ตนด้วยการกำจัดมอนสเตอร์หลงทาง แล้วเผชิญโกเลมฝึกหัด', quota: 3, boss: 'training-golem', unlock: 'mosswood' },
    { id: 2, zone: 'mosswood', title: 'บทที่ 2 — หัวใจแห่งพงไพร', story: 'มอสสีดำกำลังกัดกินผืนป่า จงตามหาร่องรอยและปลุกพฤกษาโบราณให้คืนสติ', quota: 5, boss: 'moss-ancient', unlock: 'swamp' },
    { id: 3, zone: 'swamp', title: 'บทที่ 3 — หมอกพิษตื่นขึ้น', story: 'แร่หนองน้ำคือกุญแจสร้างเครื่องรางต้านพิษ แต่ไฮดร้ากำลังเฝ้าต้นน้ำอยู่', quota: 6, boss: 'mire-hydra', unlock: 'ruins' },
    { id: 4, zone: 'ruins', title: 'บทที่ 4 — ประตูรูนสุดท้าย', story: 'รวบรวมเศษรูน เปิดผนึกวิหาร และโค่นรูนวาร์เดนเพื่อคืนแสงให้ป่า', quota: 7, boss: 'rune-warden', unlock: null }
  ],
  bosses: {
    'training-golem': { name: 'โกเลมฝึกหัด', color: '#b98b56', dark: '#624b39', hp: 150, damage: 8, skill: 'คลื่นกระแทก', phaseSkill: 'กำปั้นศิลาคู่', rune: 'guardian' },
    'moss-ancient': { name: 'พฤกษาโบราณ', color: '#3f8d4f', dark: '#174f2c', hp: 240, damage: 10, skill: 'รากไม้ผุด', phaseSkill: 'วงกตรากหนาม', rune: 'fury' },
    'mire-hydra': { name: 'ไฮดร้าหมอกพิษ', color: '#789d55', dark: '#425b38', hp: 330, damage: 12, skill: 'พิษแปดทิศ', phaseSkill: 'ฝนพิษไล่ล่า', rune: 'fortune' },
    'rune-warden': { name: 'รูนวาร์เดน', color: '#8e6ac8', dark: '#443267', hp: 430, damage: 15, skill: 'วาร์ปรูนสามสาย', phaseSkill: 'ผนึกดาราห้าสาย', rune: 'arcane' },
    'root-devourer': { name: 'ผู้กลืนกินราก', color: '#607f45', dark: '#2b4a31', hp: 360, damage: 13, skill: 'เขาวงกตราก', phaseSkill: 'เมล็ดมรณะ', rune: null }
  },
  dungeons: {
    root_cavern: {
      name: 'ถ้ำรากโบราณ', zone: 'mosswood', unlockBoss: 'training-golem', seconds: 100,
      waves: [
        { name: 'ห้องโถงมอส', count: 4, types: ['slime', 'thornling'] },
        { name: 'รังหนามตื่น', count: 6, types: ['boar', 'thornling'] },
        { name: 'แก่นรากต้องสาป', boss: 'root-devourer' }
      ],
      rewards: { gold: 240, gems: 6, moss: 12, wood: 8 }
    }
  },
  runes: {
    guardian: { name: 'รูนผู้พิทักษ์', desc: 'HP สูงสุด +18', color: '#6bb6d9' },
    fury: { name: 'รูนพิโรธ', desc: 'พลังโจมตี +5', color: '#e05b4f' },
    fortune: { name: 'รูนโชคลาภ', desc: 'Gold ที่ได้รับ +25%', color: '#f2d34f' },
    arcane: { name: 'รูนอาคม', desc: 'สกิลอาชีพคูลดาวน์เร็วขึ้น 25%', color: '#b98cff' }
  },
  recipes: [
    { code: 'moss-blade', name: 'อาวุธมอส', cost: 90, materials: { moss: 8, wood: 5 }, damage: 4 },
    { code: 'swamp-edge', name: 'อาวุธแร่หนองน้ำ', cost: 180, materials: { swamp_ore: 10, slime_core: 6 }, damage: 8 },
    { code: 'ancient-rune-weapon', name: 'อาวุธรูนโบราณ', cost: 320, materials: { ancient_shard: 12, swamp_ore: 8 }, damage: 13 }
  ],
  materials: { wood: 'ไม้เนื้อดี', moss: 'มอสเรืองแสง', slime_core: 'แก่นสไลม์', swamp_ore: 'แร่หนองน้ำ', ancient_shard: 'เศษรูนโบราณ' }
};
