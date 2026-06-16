/* config.js — พารามิเตอร์เกม "นิทานโต้ตอบ" (thai-story) */
window.GAME_CONFIG = {
  SLUG: 'thai-story',           // ⚠️ ต้องตรงกับ educational_hub_items.game_slug
  BGM: 'warm',                  // เพลงพื้นหลัง: cheerful/calm/warm/playful/bright/mellow

  LIVES: 3,                     // จำนวนชีวิต
  BASE_SCORE: 20,               // คะแนนต่อข้อ
  SPEED_BONUS: 10,              // โบนัสตอบเร็ว (ใน 15 วินาที)
  PERFECT_BONUS: 50,            // โบนัสไม่ผิดเลยต่อเรื่อง
  STAR_THRESHOLDS: [80, 180, 300], // เกณฑ์ดาว ⭐/⭐⭐/⭐⭐⭐
  CHAPTER_TIME_LIMIT: 60,       // วินาทีต่อตอนสำหรับการคิดโบนัสความเร็ว

  ENABLE_ONLINE: false,         // ปิดโหมดออนไลน์
};
