/* config.js — พารามิเตอร์เกม "Math-Man Co-op" (ศึกวงกตคณิตศาสตร์คู่หู) */
window.GAME_CONFIG = {
  SLUG: 'math-man-coop',        // ⚠️ ต้องตรงกับ database slug
  BGM: 'cheerful',              // เพลงหลัก
  LIVES: 3,                     // พลังชีวิตต่อผู้เล่น
  ROUNDS: 1,                    // จำนวนรอบต่อหนึ่งตาสำหรับ Versus
  ROUND_SEC: 90,                // เวลาสูงสุดของการประลอง (วินาที)
  ENABLE_ONLINE: true           // เปิดการรองรับการเชื่อมต่อแบบออนไลน์
};
