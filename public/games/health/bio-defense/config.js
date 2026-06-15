/* config.js — พารามิเตอร์เกม Bio-Defense (ศึกภูมิคุ้มกันร่างกาย) */
window.GAME_CONFIG = {
  SLUG: 'bio-defense',
  BGM: 'calm',               // เพลงช่วงเตรียมการ/คลื่นศัตรู

  // ── ข้อมูลสเตตผู้เล่น ──
  BASE_LIVES: 20,            // พลังชีวิตร่างกายเริ่มต้น
  START_ENERGY: 150,         // พลังงานชีวภาพเริ่มต้น (Bio-Energy)
  TRIVIA_COOLDOWN_MS: 8000,  // คูลดาวน์ปุ่มตอบคำถามกรณีตอบผิด (ms)
  TRIVIA_ENERGY_REWARD: 50,  // พลังงานรางวัลเมื่อตอบควิซถูก

  // ── สเปกป้อมเม็ดเลือดขาว (Towers) ──
  TOWERS: {
    neutrophil: {
      name: 'นิวโทรฟิล',
      cost: 50,
      range: 115,            // รัศมียิง (พิกเซล)
      damage: 4,             // พลังทำลาย
      fireRateMs: 400,       // ระยะเวลาระหว่างกระสุน (ms)
      color: '#34d399',      // สีป้อม
      bulletColor: '#6ee7b7'
    },
    macrophage: {
      name: 'แมคโครฟาจ',
      cost: 100,
      range: 65,
      damage: 14,
      fireRateMs: 1000,      // คลื่นกลืนกินรอบตัวทุกๆ 1 วินาที
      color: '#3b82f6',
      bulletColor: '#60a5fa' // ใช้วาดคลื่นรัศมี
    },
    bcell: {
      name: 'บีเซลล์',
      cost: 150,
      range: 135,
      damage: 3,
      fireRateMs: 900,       // ยิงแอนติบอดี
      color: '#a78bfa',
      bulletColor: '#c084fc',
      slowFactor: 0.6,       // เดินช้าเหลือ 60% (สโลว์ 40%)
      slowDurationMs: 2000   // ระยะเวลาสโลว์ (ms)
    }
  },

  // ── ระบบการอัปเกรดและขายป้อม ──
  UPGRADE_COST: 60,          // ราคาอัปเกรดป้อม
  UPGRADE_MULT_DAMAGE: 1.35, // พลังโจมตีเพิ่มขึ้น 35% ต่อขั้น
  UPGRADE_MULT_RANGE: 1.20,  // รัศมีขยายขึ้น 20% ต่อขั้น
  SELL_REFUND_FACTOR: 0.60,  // ขายป้อมได้รับพลังงานคืน 60%

  // ── ท่าไม้ตายคูลดาวน์ ──
  ULTIMATE_COOLDOWN_MS: 30000, // คูลดาวน์ระเบิดยาปฏิชีวนะ (30 วินาที)
  ULTIMATE_DAMAGE: 80,         // ความเสียหายระเบิดยาปฏิชีวนะกวาดจอ

  // ── สเปกประเภทเชื้อโรค (Pathogens) ──
  PATHOGENS: {
    rhinovirus: {
      name: 'ไวรัสไข้หวัด',
      hp: 15,
      speed: 1.8,            // ความเร็วเดินตามทาง (พิกเซล/เฟรม)
      reward: 5,             // พลังงานเมื่อกำจัดได้
      score: 10,             // คะแนนเมื่อกำจัดได้
      color: '#22c55e',      // สีเขียวของไวรัส
      emoji: '🦠',
      size: 15               // ขนาดรัศมีชน
    },
    streptococcus: {
      name: 'แบคทีเรียเจ็บคอ',
      hp: 36,
      speed: 1.1,
      reward: 10,
      score: 20,
      color: '#ec4899',      // สีชมพู
      emoji: '🧫',
      size: 18
    },
    parasite: {
      name: 'พยาธิร้าย (Boss)',
      hp: 190,
      speed: 0.6,
      reward: 35,
      score: 80,
      color: '#a855f7',      // สีม่วงพยาธิยักษ์
      emoji: '🐛',
      size: 24
    }
  },

  // ── กำหนดค่าระดับเวฟ (Waves Spec) ──
  WAVES: [
    // เวฟ 1: ไวรัสไข้หวัดมาเรียนรู้
    { spawn: [{ type: 'rhinovirus', count: 8, delay: 1000 }] },
    // เวฟ 2: ไวรัสผสมแบคทีเรียตัวบาง
    { spawn: [
        { type: 'rhinovirus', count: 10, delay: 800 },
        { type: 'streptococcus', count: 4, delay: 1500 }
      ] 
    },
    // เวฟ 3: แบคทีเรียบุกเป็นกลุ่ม
    { spawn: [{ type: 'streptococcus', count: 12, delay: 1200 }] },
    // เวฟ 4: เชื้อโรคผสมผสานพร้อมบอสพยาธิ 1 ตัว
    { spawn: [
        { type: 'rhinovirus', count: 12, delay: 700 },
        { type: 'streptococcus', count: 8, delay: 1000 },
        { type: 'parasite', count: 1, delay: 3000 }
      ] 
    },
    // เวฟ 5: อภิมหาเชื้อโรคบุกระลอกสุดท้าย (บอส 3 ตัว)
    { spawn: [
        { type: 'streptococcus', count: 15, delay: 900 },
        { type: 'parasite', count: 3, delay: 2500 }
      ] 
    }
  ],

  // ── ออนไลน์ ──
  ENABLE_ONLINE: true,
  ONLINE_DURATION: 90,        // เวลารวมสำหรับการแข่งออนไลน์ 90 วินาที
};
