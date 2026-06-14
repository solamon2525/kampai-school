/* config.js — พารามิเตอร์เกม Math Runner */
window.GAME_CONFIG = {
  SLUG: 'math-runner',        // slug ของเกม
  BGM: 'playful',            // เพลงพื้นหลังสไตล์เรโทร: playful

  // ── การเล่น ──
  LIVES: 3,                   // จำนวนชีวิต (โหมดผจญภัย)
  TIME_SECONDS: 60,           // เวลาโหมดแข่งเวลา (วินาที)
  
  // ── ความเร็วเลื่อนบล็อกคำตอบ (px/เฟรม) ──
  BLOCK_START_SPEED: 4.5,     // ความเร็วเริ่มต้นของบล็อกที่ลอยมา
  BLOCK_MAX_SPEED: 11,        // ความเร็วสูงสุด
  SPEED_RAMP: 0.4,            // ความเร็วเพิ่มขึ้นต่อเลเวล

  // ── คะแนน + ดาว ──
  CORRECT_POINTS: 10,         // คะแนนตอบถูก
  WRONG_PENALTY: 5,           // หักคะแนนตอบผิด
  STAR_THRESHOLDS: [80, 200, 400], // คะแนนขั้นต่ำสำหรับ 1 / 2 / 3 ดาว

  // ── ออนไลน์ ──
  ENABLE_ONLINE: true,        // เปิดปุ่มออนไลน์
  ONLINE_DURATION: 60,        // เวลาแข่งโหมดออนไลน์ (วินาที)
};
