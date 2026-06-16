/* config.js — พารามิเตอร์เกม "Thai Vocab Hub" (คลังคำศัพท์ภาษาไทย ป.4) */
window.GAME_CONFIG = {
  SLUG: 'thai-vocab-hub',       // ⚠️ ต้องตรงกับ educational_hub_items.game_slug
  BGM: 'cheerful',             // เพลงพื้นหลังหลัก
  LIVES: 5,                    // จำนวนครั้งที่สะกดผิดได้ในโหมดเขียนตามคำบอก
  BASE_SCORE: 10,              // คะแนนพื้นฐานต่อคำตอบที่ถูกต้อง
  STAR_THRESHOLDS: [50, 100, 150], // เกณฑ์ดาว ⭐/⭐⭐/⭐⭐⭐
  ENABLE_ONLINE: false
};
