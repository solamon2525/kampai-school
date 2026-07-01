/**
 * config.js — Mini Farm Island 🌴
 * ค่าคงที่และตั้งค่าระบบเกม
 */
window.GAME_CONFIG = {
  SLUG: 'mini-farm-island',
  TITLE: 'Mini Farm Island 🌴',
  BGM: 'chill',

  /* ---------- Economy ---------- */
  START_MONEY: 100,
  PLANT_COST: 10,
  SELL_PRICE: 25,
  GROW_TIME: 6.0,          // seconds until crop is ready

  /* ---------- Versus ---------- */
  VERSUS_DURATION: 60,     // seconds per versus round
  VERSUS_TITLE: 'แข่งฟาร์ม 🌾 ใครขายได้มากกว่า!',

  /* ---------- Scoring ---------- */
  SCORE_PER_SELL: 25,      // score = money earned from selling

  /* ---------- Grid ---------- */
  PLOT_ROWS: 2,
  PLOT_COLS: 3,
  PLOT_GAP: 1.12,
  PLOT_OFFSET_X: -0.3,
  PLOT_OFFSET_Z: 0.5,

  /* ---------- Visuals ---------- */
  GROUND_Y: 0.55,
  WATER_SEG_NORMAL: 56,
  WATER_SEG_REDUCED: 24,
  SMOKE_INTERVAL: 0.5,

  /* ---------- Camera ---------- */
  CAM_POS: { x: 7.5, y: 6.5, z: 9 },
  CAM_TARGET: { x: 0.7, y: 0.6, z: 0.6 },
  CAM_FOV: 42,
  CAM_MIN_DIST: 6,
  CAM_MAX_DIST: 18,

  /* ---------- Colors ---------- */
  COLORS: {
    sand:    '#f2ddaa',
    rock:    '#8a6b4a',
    grass:   '#6ec25a',
    dirt:    '#7a4f2b',
    water:   '#3fb4e6',
    deepSea: '#1d6fa5',
    skyTop:  '#7ec2ff',
    skyMid:  '#cfe9ff',
    skyBot:  '#ffe0b0',
    trunk:   '#8a5a34',
    wall:    '#f6e7c2',
    roof:    '#c65b3b',
    door:    '#7c4a25',
    chimney: '#a24b34',
  }
};
