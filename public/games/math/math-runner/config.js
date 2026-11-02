/* config.js — พารามิเตอร์เกม Math Runner */
window.GAME_CONFIG = {
  SLUG: 'math-runner',        // slug ของเกม
  BGM: 'playful',            // เพลงพื้นหลังสไตล์เรโทร: playful

  // ── การเล่น (Rule G: Forgiving Balance) ──
  LIVES: 6,                   // จำนวนชีวิตเริ่มต้น (โหมดผจญภัย: เริ่ม 6 หัวใจ ไม่ตายทันที)
  MAX_LIVES: 8,               // เพดานหัวใจสูงสุด (เริ่มที่ 6 เก็บเพิ่มได้ถึง 8)
  TIME_SECONDS: 60,           // เวลาโหมดแข่งเวลา (วินาที)
  
  // ── ความเร็วเลื่อนบล็อกคำตอบ (px/เฟรม ที่ 60fps) ──
  // Child Pacing: ควบคุมความเร็วเพื่อให้เวลาข้ามจอ (Screen Traversal Time) >= 6 วินาทีเสมอ
  BLOCK_START_SPEED: 2.8,     // ความเร็วเริ่มต้น (คำนวณร่วมกับ screen width >= 6.2s)
  BLOCK_MAX_SPEED: 3.8,       // ความเร็วสูงสุดเมื่อคอมโบสูง
  SPEED_RAMP: 0.15,           // ความเร็วเพิ่มขึ้นต่อเลเวล

  // ── คะแนน + ดาว ──
  CORRECT_POINTS: 10,         // คะแนนตอบถูก
  WRONG_PENALTY: 5,           // หักคะแนนตอบผิด (-5 แต้ม แทนการตายทันที)
  STAR_THRESHOLDS: [80, 200, 400], // คะแนนขั้นต่ำสำหรับ 1 / 2 / 3 ดาว

  // ── มอนสเตอร์ และ ไอเทม (Rule G: Low Cognitive Clutter) ──
  MONSTER_SPAWN_CHANCE: 0.20,  // โอกาสเกิดมอนสเตอร์เมื่อเปลี่ยนโจทย์ (ลดลงเพื่อไม่ให้รบกวนการคิดเลข)
  ITEM_SPAWN_CHANCE: 0.20,     // โอกาสเกิดไอเทมตามเลน
  ITEM_POP_CHANCE: 0.30,       // โอกาสที่ไอเทมจะเด้งออกจากบล็อกคำตอบที่ถูก
  
  BUFF_INVINCIBLE_DURATION: 8, // ระยะเวลาอมตะ (วินาที)
  DEBUFF_SLOW_DURATION: 5,     // ระยะเวลาเชื่องช้า (วินาที)
  DEBUFF_CONFUSED_DURATION: 5, // ระยะเวลาควบคุมกลับด้าน (วินาที)
  BUFF_DOUBLE_DURATION: 8,     // ระยะเวลาคะแนน ×2 (วินาที)
  BUFF_MAGNET_DURATION: 6,     // ระยะเวลาแม่เหล็กดูดเหรียญ/ไอเทม (วินาที)

  // ── หัวใจ ──
  COMBO_HEART_EVERY: 6,        // ตอบถูกติดกันครบทุก N → ได้หัวใจ 1 ดวง

  // ── ความยาก (ปุ่ม #diff-group → มีผลต่อเกมจริง) ──
  DIFF: {
    very_easy: { tierMode: 'fixed1', speedMul: 0.85, monsterMul: 0,   equationChance: 0,   wrongLosesHeart: false },
    easy:      { tierMode: 'score',  speedMul: 1.0,  monsterMul: 0.8, equationChance: 0,   wrongLosesHeart: true  },
    hard:      { tierMode: 'boost',  speedMul: 1.15, monsterMul: 1.2, equationChance: 0.4, wrongLosesHeart: true  },
  },

  // ── การแข่งขัน ──
  ENABLE_ONLINE: true,        // เปิดปุ่มแข่งขัน 2 คน (KampaiVersus)
  ONLINE_DURATION: 60,        // เวลาแข่ง (วินาที)
};
