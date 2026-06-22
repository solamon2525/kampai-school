/* config.js — พารามิเตอร์เกม (แก้ค่าตรงนี้ที่เดียว ไม่ต้องแตะ game.js)
   ⚠️ เปลี่ยน SLUG เป็น slug จริง (ตรงกับ educational_hub_items.game_slug) ก่อนใช้งาน */
window.GAME_CONFIG = {
  SLUG: 'blocky-safari',        // ⚠️ สลักเกลียวของเกม
  BGM: 'cheerful',              // เพลงพื้นหลัง: cheerful/calm/warm/playful/bright/mellow

  // ── การเล่น ──
  PLAYER_SPEED: 8,              // ความเร็วผู้เล่นในการเคลื่อนที่
  COLLISION_DIST: 2.5,          // ระยะการเดินเข้าใกล้เพื่อชนสัตว์
  MAP_SIZE: 40,                 // ขนาดแผนที่ (พิกเซลเสมือน)
  TREES_COUNT: 20               // จำนวนต้นไม้ตกแต่ง
};
