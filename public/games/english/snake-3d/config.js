// config.js — การตั้งค่าพารามิเตอร์เริ่มต้นของเกม
window.GAME_CONFIG = {
  SLUG: 'snake-3d',               // ต้องตรงกับใน educational_hub_items.game_slug
  GRID_SIZE: 19,                  // ขนาดกริดแผนที่ 19x19
  INITIAL_SPEED: 350,             // ความเร็วเริ่มต้น (มิลลิวินาทีต่อบล็อก)
  SPEED_UP_RATIO: 0.96,           // ตัวคูณลดดีเลย์ความเร็วเมื่อกินอักษรสำเร็จ
  MIN_SPEED: 120,                 // ดีเลย์ความเร็วต่ำสุด
  LIVES_LIMIT: 3,                 // พลังชีวิตเริ่มต้น (หัวใจ 3 ดวง)
  DISTRACTORS_COUNT: 4            // จำนวนตัวอักษรหลอกที่สุ่มมาวางเสริมในด่าน
};
