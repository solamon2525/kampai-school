/* config.js — พารามิเตอร์เกม "Phonics Pop" (เสียงพาสนุก)
   แอดมิน/ครู แก้ค่าตรงนี้ได้เลย (ไม่ต้องแตะ game.js) แล้ว reload เห็นผลทันที */
window.GAME_CONFIG = {
  SLUG: 'phonics-pop',        // ⚠️ ต้องตรงกับ educational_hub_items.game_slug
  BGM: 'playful',             // เพลงพื้นหลัง: cheerful/calm/warm/playful/bright/mellow

  LIVES: 5,                   // จำนวนชีวิต
  BASE_SCORE: 10,             // คะแนนพื้นฐานต่อคำตอบถูก
  COMBO_STEP: 3,              // ตอบถูกติดกี่ครั้งจึงเริ่มคูณคอมโบ
  COMBO_MAX: 5,               // ตัวคูณคอมโบสูงสุด
  BALLOON_SPEED_START: 1.2,   // ความเร็วลอยเริ่มต้น (px/frame)
  BALLOON_SPEED_MAX: 3.0,     // ความเร็วลอยสูงสุด
  SPAWN_INTERVAL_START: 2500, // ระยะเวลาระหว่าง round เริ่มต้น (ms)
  SPAWN_INTERVAL_MIN: 1200,   // ระยะเวลาระหว่าง round ขั้นต่ำ (ms)
  BALLOONS_PER_ROUND: 4,      // จำนวนลูกโป่งต่อ round
  LEVEL_EVERY: 5,             // ตอบถูกกี่ข้อถึงเลื่อนเลเวล
  STAR_THRESHOLDS: [50, 150, 300],  // เกณฑ์ดาว

  ENABLE_ONLINE: false,
};
