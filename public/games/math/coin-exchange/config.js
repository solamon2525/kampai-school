/* config.js — พารามิเตอร์เกม "Coin Exchange" (แลกเหรียญ) */
window.GAME_CONFIG = {
  SLUG: 'coin-exchange',        // ⚠️ ต้องตรงกับ educational_hub_items.game_slug
  BGM: 'cheerful',             // เพลงพื้นหลังหลัก
  LIVES: 3,                    // จำนวนครั้งที่ทอนผิดได้ (หัวใจ)
  BASE_SCORE: 20,              // คะแนนพื้นฐานต่อรายการซื้อขายที่ทอนถูก
  STAR_THRESHOLDS: [100, 240, 360], // เกณฑ์ดาว ⭐/⭐⭐/⭐⭐⭐ (ทำทั้งหมด 10 ธุรกรรม)
  ENABLE_ONLINE: false
};
