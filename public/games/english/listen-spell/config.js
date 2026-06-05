/* config.js — พารามิเตอร์เกม "ฟังแล้วสะกด" (listen-spell)
   แอดมิน/ครู แก้ค่าตรงนี้ได้เลย (ไม่ต้องแตะ game.js) แล้ว reload เห็นผลทันที */
window.GAME_CONFIG = {
  SLUG: 'listen-spell',      // ⚠️ ต้องตรงกับ educational_hub_items.game_slug
  BGM: 'playful',            // เพลงพื้นหลัง: cheerful/calm/warm/playful/bright/mellow (หลังบ้าน override ได้)

  RACE_SECONDS: 60,          // เวลาโหมดแข่ง (วินาที)
  LIVES: 3,                  // จำนวนชีวิตโหมดฝึก (1–3)
  BASE_SCORE: 10,            // คะแนนพื้นฐานต่อคำที่สะกดถูก
  SPEED_BONUS_MAX: 12,       // โบนัสความเร็วสูงสุด (ตอบเร็วได้เพิ่ม)
  COMBO_MIN: 2,              // ตอบถูกติดกันกี่ครั้งจึงเริ่มนับคอมโบ (โบนัส = combo×2)
  DISTRACTOR: { len7: 2, len5: 1 },  // ตัวอักษรหลอกเพิ่ม: คำยาว ≥7 ตัว=+2, ≥5 ตัว=+1

  ENABLE_ONLINE: true,       // เปิดปุ่ม "🌐 ออนไลน์" (โหมดแข่งสดต่างเครื่อง) — false = ปิด
  ONLINE_DURATION: 60,       // เวลาแข่งออนไลน์ (วินาที)
};
