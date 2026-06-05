/* config.js — พารามิเตอร์เกม (แก้ค่าตรงนี้ที่เดียว ไม่ต้องแตะ game.js)
   ⚠️ เปลี่ยน SLUG เป็น slug จริง (ตรงกับ educational_hub_items.game_slug) ก่อนใช้งาน */
window.GAME_CONFIG = {
  SLUG: 'placeholder-slug',   // ⚠️ TODO: ใส่ slug จริง
  BGM: 'cheerful',            // เพลงพื้นหลัง: cheerful/calm/warm/playful/bright/mellow

  SPEED: 8,                   // ความเร็วเลื่อนตะกร้า (px/เฟรม)
  SPAWN_MS: 800,              // ความถี่ปล่อยดาว (ms)
  STAR_POINTS: 10,            // คะแนนต่อดาวที่รับได้
  LIVES: 3,                   // จำนวนชีวิต

  ENABLE_ONLINE: false,       // true = เปิดปุ่ม "🌐 ออนไลน์" (แข่งสดต่างเครื่อง ผ่าน kampai-match)
  ONLINE_DURATION: 60,        // เวลาแข่งออนไลน์ (วินาที)
};
