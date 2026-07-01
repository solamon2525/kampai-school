/**
 * data.js — Mini Farm Island 🌴
 * ข้อมูลต้นไม้ ดอกไม้ และ SVG assets
 */
window.GAME_DATA = {

  /* ---------- Tree placements ---------- */
  TREES: [
    { x: -3.0, z: 1.7, s: 1.05 },
    { x: -1.6, z: 2.6, s: 0.85 },
    { x:  3.0, z: -1.4, s: 1.0 },
    { x:  2.4, z: 2.3, s: 0.75 },
  ],

  /* ---------- Leaf colors ---------- */
  LEAF_COLORS: ['#3f8f3a', '#4fa544', '#67b354'],

  /* ---------- Pebbles ---------- */
  PEBBLES: [
    { x: -3.4, z: -0.6, s: 0.28 },
    { x:  3.6, z:  0.9, s: 0.22 },
    { x: -0.4, z: -3.0, s: 0.25 },
  ],

  /* ---------- Flower colors ---------- */
  FLOWER_COLORS: ['#ff6b81', '#ffd166', '#ff9ff3', '#a29bfe'],
  FLOWER_COUNT: 10,
  FLOWER_RADIUS_MIN: 2.6,
  FLOWER_RADIUS_MAX: 4.0,

  /* ---------- Particle burst colors ---------- */
  PLANT_BURST: ['#8a5a34', '#a06a38'],
  HARVEST_BURST: ['#ef4444', '#f6b93b', '#7fe06a', '#ffffff'],
  READY_BURST: ['#ffe07a', '#ffffff'],

  /* ---------- Crop growth colors ---------- */
  CROP_START_COLOR: '#5fa83a',
  CROP_END_COLOR:   '#79c24a',
  FRUIT_COLOR:      '#ef4444',
  FRUIT_EMISSIVE:   '#b91c1c',

  /* ---------- Thai messages ---------- */
  MSG: {
    notEnough: 'เงินไม่พอ ต้องใช้ 10 เหรียญ',
    planted:   'ปลูกแล้ว! รอต้นโต 🌱',
    growing:   'ยังโตไม่เต็มที่ • อีก {n} วิ',
    harvested: 'เก็บเกี่ยวสำเร็จ +1 🥕',
    sold:      'ขายได้ +{n} เหรียญ 🪙',
    noSell:    'ยังไม่มีผลผลิตให้ขาย',
    hintText:  'คลิกแปลงดิน <b>ปลูก</b> → รอต้นโตเต็มที่ → คลิก <b>เก็บเกี่ยว</b>',
    loading:   'กำลังสร้างเกาะ...',
    sellBtn:   'ขายผลผลิตทั้งหมด',
    moneyUnit: 'เหรียญ',
    cropsUnit: 'ชิ้น',
    money:     'เงิน',
    crops:     'ผลผลิตในยุ้ง',
    legendPlant: 'ปลูก −10',
    legendSell:  'ขาย +25 / ชิ้น',
    versusBtn:   '🏆 แข่ง 2 คน',
  }
};
