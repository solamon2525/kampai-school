/* config.js — พารามิเตอร์เกม Neural Bot: AI Space Trainer */
window.GAME_CONFIG = {
  SLUG: 'neural-bot',
  TITLE: 'Neural Bot: สมองกลกู้จักรวาล',
  BGM: 'playful',            // เพลงพื้นหลัง: cheerful/calm/warm/playful/bright/mellow

  // ── กฎเกม ──
  LIVES: 3,                   // จำนวนชีวิตหุ่นยนต์
  MISSION_TIME: 45,           // เวลาต่อด่าน (วินาที)
  RUN_SPEED: 4.5,             // ความเร็ววัตถุลอยผ่านในห้วงอวกาศ
  CONFIDENCE_THRESHOLD: 0.65, // เกณฑ์ความมั่นใจของ AI ขั้นต่ำที่จะ Trigger action

  // ── คะแนน + โบนัส ──
  CORRECT_POINTS: 20,         // คะแนนเมื่อ AI จำแนกถูกต้อง
  OVERRIDE_BONUS: 15,         // โบนัสเมื่อผู้เล่นกด Override กู้ชีพ AI ได้ทันท่วงที
  PERFECT_EPOCH_BONUS: 50,    // โบนัสเมื่อเทรน AI ได้ Accuracy 100% ในช่วงแล็บ
  COMBO_MAX: 5,               // ตัวคูณคอมโบสูงสุด

  STAR_THRESHOLDS: [120, 250, 420],  // คะแนนขั้นต่ำสำหรับ 1 / 2 / 3 ดาว

  // ── แข่งขัน 2 คน / ออนไลน์ ──
  ENABLE_ONLINE: true,        // เปิดแข่งออนไลน์ผ่าน KampaiMatch
  ONLINE_DURATION: 60,        // เวลาแข่ง 60 วินาที
};

