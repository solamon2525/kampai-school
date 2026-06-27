/* config.js — พารามิเตอร์เกม + แนวจอ (จูนที่นี่ที่เดียว)
   ⚠️ เปลี่ยน SLUG เป็น slug จริงก่อนใช้งาน */
window.GAME_CONFIG = {
  SLUG: '_template-orient',   // ⚠️ TODO: slug จริงเมื่อ copy ออกจากเทมเพลต
  BGM: 'cheerful',

  /* ── แนวจอ (KampaiOrient) ──
     'any'        = เล่นได้ทั้งแนวตั้ง/แนวนอน (default · แนะนำ quiz/HUD ทั่วไป)
     'landscape'  = บังคับแนวนอนบนมือถือ (runner / แข่งรถ / split-screen)
     'portrait'   = บังคับแนวตั้ง (flappy / stack / one-hand)
     LOCK_ORIENTATION_ON_START = พยายาม lock หลังเริ่ม (ไม่รองรับทุกเบราว์เซอร์) */
  ORIENTATION: 'any',
  LOCK_ORIENTATION_ON_START: false,

  // ── การเล่น ──
  SPEED: 9,
  LIVES: 3,
  TIME_SECONDS: 60,
  GOOD_POINTS: 10,
  SPAWN_START_MS: 850,
  SPAWN_MIN_MS: 380,
  STAR_THRESHOLDS: [60, 180, 360],

  ENABLE_ONLINE: false,
  ONLINE_DURATION: 60,
};
