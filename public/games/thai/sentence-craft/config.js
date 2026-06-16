/* config.js — พารามิเตอร์เกม "แต่งประโยคภาษาไทย" (sentence-craft) */
window.GAME_CONFIG = {
  SLUG: 'sentence-craft',      // ⚠️ ต้องตรงกับ educational_hub_items.game_slug
  BGM: 'warm',                  // เพลงพื้นหลัง: cheerful/calm/warm/playful/bright/mellow

  TIME_SECONDS: 90,             // เวลาต่อด่าน (วินาที)
  BASE_SCORE: 20,               // คะแนนพื้นฐานต่อประโยคที่ถูก
  SPEED_BONUS_MAX: 15,          // โบนัสความเร็วสูงสุด
  COMBO_STEP: 2,                // ตอบถูกติดกันกี่ครั้งเพื่อเพิ่มคอมโบ
  COMBO_MAX: 4,                 // คอมโบสูงสุด
  HINT_PENALTY: 5,              // หักคะแนนเมื่อกดใบ้
  STAR_THRESHOLDS: [80, 200, 350], // เกณฑ์ดาว ⭐/⭐⭐/⭐⭐⭐
  SENTENCES_PER_ROUND: 8,       // จำนวนประโยคต่อรอบ

  ENABLE_ONLINE: false,         // ปิดโหมดออนไลน์สำหรับเกมนี้
};
