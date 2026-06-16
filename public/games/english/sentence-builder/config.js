/* config.js — พารามิเตอร์เกม "สร้างประโยค" (sentence-builder)
   แอดมิน/ครู แก้ค่าตรงนี้ได้เลย (ไม่ต้องแตะ game.js) แล้ว reload เห็นผลทันที */
window.GAME_CONFIG = {
  SLUG: 'sentence-builder',   // ⚠️ ต้องตรงกับ educational_hub_items.game_slug
  BGM: 'cheerful',            // เพลงพื้นหลัง: cheerful/calm/warm/playful/bright/mellow

  TIME_SECONDS: 90,           // เวลาต่อด่าน (วินาที)
  BASE_SCORE: 20,             // คะแนนพื้นฐานต่อประโยคที่ถูก
  SPEED_BONUS_MAX: 15,        // โบนัสความเร็วสูงสุด (ตอบเร็วได้เพิ่ม)
  COMBO_STEP: 2,              // คะแนนโบนัสคอมโบต่อ streak (combo × COMBO_STEP)
  COMBO_MAX: 4,               // คอมโบสูงสุด
  HINT_PENALTY: 5,            // คะแนนที่หักเมื่อกดคำใบ้
  STAR_THRESHOLDS: [80, 200, 350], // ⭐ / ⭐⭐ / ⭐⭐⭐
  SENTENCES_PER_ROUND: 8,     // จำนวนประโยคต่อรอบ

  ENABLE_ONLINE: false,       // ปิดโหมดออนไลน์ (ยังไม่รองรับ)
  ONLINE_DURATION: 90,        // เวลาแข่งออนไลน์ (วินาที)
};
