/* config.js — พารามิเตอร์เกม "Measure Up!" (วัดและเปรียบเทียบ) */
window.GAME_CONFIG = {
  SLUG: 'measure-up',          // ⚠️ ต้องตรงกับ educational_hub_items.game_slug
  BGM: 'cheerful',             // เพลงพื้นหลังหลัก
  LIVES: 3,                    // จำนวนหัวใจ/ชีวิต
  BASE_SCORE: 20,              // คะแนนพื้นฐานต่อคำตอบที่ถูกต้อง
  STAR_THRESHOLDS: [100, 240, 360], // เกณฑ์ดาว ⭐/⭐⭐/⭐⭐⭐
  ENABLE_ONLINE: false
};
