/* config.js — พารามิเตอร์เกม "Line Trace Art" (ลากเส้นตามแบบ) */
window.GAME_CONFIG = {
  SLUG: 'line-trace',         // ⚠️ ต้องตรงกับ educational_hub_items.game_slug
  BGM: 'cheerful',            // เพลงพื้นหลังหลัก
  MIN_ACCURACY: 50,           // คะแนนความแม่นยำขั้นต่ำ (%) ที่ยอมรับว่าผ่านด่าน
  BASE_SCORE: 100,            // คะแนนสูงสุดที่ทำได้ในแต่ละด่าน (คูณตามเปอร์เซ็นต์ความแม่นยำ)
  STAR_THRESHOLDS: [150, 300, 450], // เกณฑ์ดาว ⭐/⭐⭐/⭐⭐⭐ (เล่นทั้งหมด 5 ด่าน)
  ENABLE_ONLINE: false
};
