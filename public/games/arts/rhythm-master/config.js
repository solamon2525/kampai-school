/* config.js — พารามิเตอร์เกม "Rhythm Master" (จังหวะดนตรี) */
window.GAME_CONFIG = {
  SLUG: 'rhythm-master',       // ⚠️ ต้องตรงกับ educational_hub_items.game_slug
  BGM: 'cheerful',              // เพลงพื้นหลังหลัก

  LIVES: 5,                     // จำนวนครั้งที่จังหวะหลุดได้ (Miss) ก่อนจบเกม
  BASE_SCORE: 15,               // คะแนนพื้นฐานต่อตัวโน้ตที่เคาะถูก
  COMBO_MULTIPLIER_STEP: 10,     // เคาะถูกติดกันกี่ครั้งเพื่อเพิ่มตัวคูณ (เช่น ทุกๆ 10 คอมโบตัวคูณ +1)
  COMBO_MULTIPLIER_MAX: 4,      // ตัวคูณคะแนนสูงสุด
  NOTE_SPEED: 4,                // ความเร็วการเคลื่อนที่ของตัวโน้ต (พิกเซลต่อเฟรม)
  STAR_THRESHOLDS: [150, 400, 800], // เกณฑ์ดาว ⭐/⭐⭐/⭐⭐⭐

  // ช่วงเวลากดปุ่มเพื่อตัดสินคะแนนความแม่นยำ (มิลลิวินาทีจากช่วงตรงเป้าเป๊ะ)
  ACCURACY_MS: {
    PERFECT: 80,
    GREAT: 150,
    GOOD: 250
  },

  ENABLE_ONLINE: false
};
