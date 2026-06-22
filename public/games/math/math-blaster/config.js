/* config.js — พารามิเตอร์เกม Super Math-Blaster */
window.GAME_CONFIG = {
  SLUG: 'math-blaster',
  TITLE: 'Super Math-Blaster: Galactic Duel',
  BGM_PRESET: 'cheerful',    // เพลงพื้นหลัง: cheerful

  // ── การเล่น ──
  LIVES: 5,                   // จำนวนชีวิตต่อผู้เล่น
  TIME_LIMIT: 120,            // เวลาเล่นต่อด่าน (วินาที)
  DEFAULT_DIFFICULTY: 4,      // ระดับความยากเริ่มต้น (1-5)
  DEFAULT_CATEGORY: 'mixed',  // หมวดหมู่เริ่มต้น: mixed

  // ── ปรับปรุงเพิ่มเติม ──
  TTS_ENABLED: true,          // ออกเสียงโจทย์เลขภาษาไทยผ่าน TTS
  COMBO_FIRE_THRESHOLD: 3,    // จำนวนข้อถูกต่อเนื่องเพื่อโชว์เอฟเฟกต์ไฟลุก
  BOSS_SHIELD_ANSWERS: 3,     // จำนวนข้อที่ต้องตอบถูกเพื่อทำลายเกราะบอสและชนะด่าน
};
