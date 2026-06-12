/* data.js — เนื้อหาเกม "รถซิ่งสูตรคูณ" */
window.GAME_DATA = {
  TABLES:  [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],   // แม่สูตรคูณ
  FACTORS: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],   // ตัวคูณที่สุ่มเจอ

  PLAYER_CAR: '🏎️',
  RIVALS: {
    easy: { name: '🤖 บอตหัดซิ่ง',   car: '🚜' },
    mid:  { name: '🤖 บอตซิ่ง',      car: '🚙' },
    hard: { name: '🤖 บอตเทอร์โบ',   car: '🚓' },
    online: { name: '🌐 ผู้นำ',       car: '🚗' },
  },

  // ไอเทม: weight ต่อโหมด (turtle เฉพาะ vs คอม — ออนไลน์บุฟตัวเองอย่างเดียวเพื่อความแฟร์)
  ITEMS: {
    nitro:  { e: '🚀', label: 'นิโทร! พุ่งเลย',     cpuW: 0.30, onlineW: 0.40 },
    shield: { e: '🛡️', label: 'โล่กันตอบผิด 1 ครั้ง', cpuW: 0.25, onlineW: 0.30 },
    star:   { e: '⭐', label: 'คะแนน ×2 10 วิ!',     cpuW: 0.25, onlineW: 0.30 },
    turtle: { e: '🐢', label: 'คู่แข่งช้าลง!',        cpuW: 0.20, onlineW: 0 },
  },
};
