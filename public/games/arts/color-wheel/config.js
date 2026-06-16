/* config.js — พารามิเตอร์เกม "Color Wheel Explorer" (วงล้อสี) */
window.GAME_CONFIG = {
  SLUG: 'color-wheel',       // ⚠️ ต้องตรงกับ educational_hub_items.game_slug
  BGM: 'playful',            // เพลงพื้นหลังหลัก
  LIVES: 3,                  // จำนวนชีวิตสำหรับโหมดคำถาม (Quiz)
  BASE_SCORE: 20,            // คะแนนพื้นฐานต่อคำตอบที่ถูกต้อง
  STAR_THRESHOLDS: [100, 250, 400], // เกณฑ์ดาว ⭐/⭐⭐/⭐⭐⭐
  ENABLE_ONLINE: false
};
