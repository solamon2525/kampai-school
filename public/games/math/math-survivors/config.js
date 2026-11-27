/* config.js — ค่าคงที่ของเกม Math Survivors: อารีนาคณิตศาสตร์ ป.4-ป.6 */
window.GAME_CONFIG = {
  SLUG: 'math-survivors',
  TITLE_TH: 'อารีนาคณิตศาสตร์ ป.4–ป.6',
  TITLE_EN: 'Math Survivors',
  BGM: 'none',
  ENABLE_ONLINE: true,
  ONLINE_DURATION: 120,
  RUN_DURATION_SEC: 180,
  ARENA_SIZE: 2200,
  SAFE_SPAWN_MIN_DIST: 270,
  SAFE_SPAWN_MAX_DIST: 440,
  MAX_ENEMIES: 72,
  MAX_HP: 100,
  BASE_SPEED: 185,
  BASE_PICKUP_RADIUS: 86,
  MATH_ORB_INTERVAL_SEC: 1.8,
  MATH_CORRECT_SCORE: 150,
  MATH_STREAK_BONUS: 25,
  MATH_WRONG_DAMAGE: 12,
  STAR_THRESHOLDS: [900, 2400, 4500],
  ACTS: [
    { id: 1, name: 'องก์ 1 · ป่าสไลม์บวกลบ (ป.4)', startSec: 0, spawnRate: 0.75, hpMult: 1.0, speedMult: 1.0, bossAt: 52, bossName: '👑 ราชาสไลม์บวกลบ' },
    { id: 2, name: 'องก์ 2 · ป้อมคูณหารสายฟ้า (ป.5)', startSec: 60, spawnRate: 0.58, hpMult: 1.55, speedMult: 1.15, bossAt: 112, bossName: '🛡️ อัศวินคูณหาร' },
    { id: 3, name: 'องก์ 3 · บัลลังก์สมการมังกร (ป.6)', startSec: 120, spawnRate: 0.44, hpMult: 2.25, speedMult: 1.28, bossAt: 168, bossName: '🐉 มังกรสมการป.6' }
  ]
};
