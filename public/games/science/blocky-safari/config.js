/* config.js — พารามิเตอร์เกม (แก้ค่าตรงนี้ที่เดียว ไม่ต้องแตะ game.js)
   ⚠️ เปลี่ยน SLUG เป็น slug จริง (ตรงกับ educational_hub_items.game_slug) ก่อนใช้งาน */
window.GAME_CONFIG = {
  SLUG: 'blocky-safari',        // ⚠️ สลักเกลียวของเกม
  BGM: 'cheerful',              // เพลงพื้นหลัง: cheerful/calm/warm/playful/bright/mellow

  // ── การเล่น ──
  PLAYER_SPEED: 12,             // ความเร็วผู้เล่นในการเคลื่อนที่
  COLLISION_DIST: 2.5,          // ระยะการเดินเข้าใกล้เพื่อชนสัตว์
  MAP_SIZE: 500,                // แผนที่ขนาด 500x500 หน่วย (ลดขนาดลง 50%)
  TREES_COUNT: 450,             // จำนวนต้นไม้ตกแต่งที่เหมาะสมกับขนาดแผนที่
  CHASE_DIST: 60                // ระยะการมองเห็นที่สัตว์จะเริ่มวิ่งไล่จับผู้เล่น (หน่วย)
};
