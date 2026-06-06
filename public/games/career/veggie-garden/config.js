/* config.js — พารามิเตอร์เกม "สวนผักพอเพียง" (veggie-garden)
   แก้ค่าตรงนี้ที่เดียว ไม่ต้องแตะ game.js */
window.GAME_CONFIG = {
  SLUG: 'veggie-garden',       // ตรงกับ educational_hub_items.game_slug
  BGM: 'cheerful',             // เพลงพื้นหลัง

  // ── การเล่น ──
  LIVES: 3,                    // ชีวิต (โหมดแข่งเร็ว)
  STEP_POINTS: 5,              // คะแนนต่อขั้นที่วางถูก
  ROUND_BONUS: 12,             // โบนัสเมื่อปลูกครบ 1 ต้น
  TIME_BONUS_MAX: 15,          // โบนัสเร็ว (โหมดแข่งเร็ว) สูงสุดต่อรอบ

  // ── คอมโบ ──
  COMBO_STEP: 2,               // ปลูกครบไร้พลาดติดกันกี่ต้น คูณคะแนน +1
  COMBO_MAX: 5,                // ตัวคูณคอมโบสูงสุด

  // ── ออนไลน์ ──
  ENABLE_ONLINE: true,         // เปิดปุ่ม 🌐 ออนไลน์ (แข่งสดต่างเครื่อง)
  ONLINE_DURATION: 70,         // เวลาแข่งออนไลน์ (วินาที)
};
