/* config.js — พารามิเตอร์เกม "Thai Instruments" (เครื่องดนตรีไทย) */
window.GAME_CONFIG = {
  SLUG: 'thai-instruments',    // ⚠️ ต้องตรงกับ educational_hub_items.game_slug
  BGM: 'playful',             // เพลงพื้นหลังหลัก
  LIVES: 3,                   // จำนวนชีวิตสำหรับโหมดทายเสียง (Sound Quiz)
  BASE_SCORE: 20,             // คะแนนต่อข้อที่ตอบถูก
  STAR_THRESHOLDS: [100, 250, 400], // เกณฑ์ดาว ⭐/⭐⭐/⭐⭐⭐ (ทำทั้งหมด 10 ข้อ)
  ENABLE_ONLINE: false
};
