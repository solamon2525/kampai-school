// --- การตั้งค่าเกม ตกปลามาตราตัวสะกด (Game Configuration) ---
window.GAME_CONFIG = {
  SLUG: 'fishing',
  BGM: 'calm',
  LIVES_LIMIT: 3,
  ROUNDS_LIMIT: 5,
  TARGET_SCORE_MULTIPLIER: 40, // คะแนนสะสมเพื่อให้ผ่านแต่ละด่าน = (ด่าน + 1) * 40
  MAX_FISH_SCREEN: 6,
  SPAWN_INTERVAL_BASE: 1400,
  DRIFT_SPEED_MIN: 0.4,
  DRIFT_SPEED_MAX: 1.0,
  STAR_THRESHOLDS: [60, 140, 220] // คะแนนสำหรับดาว 1, 2, 3 ดวงในจอสรุปผล
};
