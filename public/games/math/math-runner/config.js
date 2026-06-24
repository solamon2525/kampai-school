/* config.js — พารามิเตอร์เกม Math Runner */
window.GAME_CONFIG = {
  SLUG: 'math-runner',        // slug ของเกม
  BGM: 'playful',            // เพลงพื้นหลังสไตล์เรโทร: playful

  // ── การเล่น ──
  LIVES: 3,                   // จำนวนชีวิต (โหมดผจญภัย)
  TIME_SECONDS: 60,           // เวลาโหมดแข่งเวลา (วินาที)
  
  // ── ความเร็วเลื่อนบล็อกคำตอบ (px/เฟรม) ──
  BLOCK_START_SPEED: 6.0,     // ความเร็วเริ่มต้นของบล็อกที่ลอยมา
  BLOCK_MAX_SPEED: 13.5,      // ความเร็วสูงสุด
  SPEED_RAMP: 0.5,            // ความเร็วเพิ่มขึ้นต่อเลเวล

  // ── คะแนน + ดาว ──
  CORRECT_POINTS: 10,         // คะแนนตอบถูก
  WRONG_PENALTY: 5,           // หักคะแนนตอบผิด
  STAR_THRESHOLDS: [80, 200, 400], // คะแนนขั้นต่ำสำหรับ 1 / 2 / 3 ดาว

  // ── มอนสเตอร์ และ ไอเทม ──
  MONSTER_SPAWN_CHANCE: 0.35,  // โอกาสเกิดมอนสเตอร์เมื่อเปลี่ยนโจทย์ (35%)
  ITEM_SPAWN_CHANCE: 0.25,     // โอกาสเกิดไอเทมตามเลน (25%)
  ITEM_POP_CHANCE: 0.30,       // โอกาสที่ไอเทมจะเด้งออกจากบล็อกคำตอบที่ถูก (30%)
  
  BUFF_INVINCIBLE_DURATION: 8, // ระยะเวลาอมตะ (วินาที)
  DEBUFF_SLOW_DURATION: 5,     // ระยะเวลาเชื่องช้า (วินาที)
  DEBUFF_CONFUSED_DURATION: 5, // ระยะเวลาควบคุมกลับด้าน (วินาที)
  BUFF_DOUBLE_DURATION: 8,     // ระยะเวลาคะแนน ×2 (วินาที)
  BUFF_MAGNET_DURATION: 6,     // ระยะเวลาแม่เหล็กดูดเหรียญ/ไอเทม (วินาที)

  // ── หัวใจ ──
  MAX_LIVES: 5,                // เพดานหัวใจสูงสุด (เริ่มที่ LIVES เก็บเพิ่มได้ถึงนี่)
  COMBO_HEART_EVERY: 8,        // ตอบถูกติดกันครบทุก N → ได้หัวใจ 1 ดวง

  // ── ความยาก (ปุ่ม #diff-group → มีผลต่อเกมจริง) ──
  DIFF: {
    very_easy: { tierMode: 'fixed1', speedMul: 0.8, monsterMul: 0,   equationChance: 0,   wrongLosesHeart: false },
    easy:      { tierMode: 'score',  speedMul: 1.0, monsterMul: 1.0, equationChance: 0,   wrongLosesHeart: true  },
    hard:      { tierMode: 'boost',  speedMul: 1.2, monsterMul: 1.3, equationChance: 0.5, wrongLosesHeart: true  },
  },

  // ── ออนไลน์ ──
  ENABLE_ONLINE: true,        // เปิดปุ่มออนไลน์
  ONLINE_DURATION: 60,        // เวลาแข่งโหมดออนไลน์ (วินาที)
};
