/* config.js — พารามิเตอร์เกม "📖 Reading Quest" (อ่านผจญภัย)
   แอดมิน/ครู แก้ค่าตรงนี้ได้เลย (ไม่ต้องแตะ game.js) แล้ว reload เห็นผลทันที */
window.GAME_CONFIG = {
  SLUG: 'reading-quest',       // ⚠️ ต้องตรงกับ educational_hub_items.game_slug
  BGM: 'calm',                 // เพลงพื้นหลัง: cheerful/calm/warm/playful/bright/mellow

  LIVES: 3,                    // จำนวนชีวิต (ตอบผิดหมด = จบเกม)
  BASE_SCORE: 25,              // คะแนนพื้นฐานต่อคำตอบที่ถูก
  SPEED_BONUS: 10,             // โบนัสตอบเร็ว (≤10 วินาที)
  PERFECT_BONUS: 50,           // โบนัสถ้าตอบถูกหมดทุกข้อในเรื่อง (ไม่ผิดเลย)
  STAR_THRESHOLDS: [100, 200, 350],  // เกณฑ์ดาว ⭐/⭐⭐/⭐⭐⭐
  CHAPTER_TIME_LIMIT: 60,      // เวลาต่อบท (วินาที) สำหรับ speed bonus

  ENABLE_ONLINE: false,        // ปิดโหมดออนไลน์สำหรับเกมนี้
};
