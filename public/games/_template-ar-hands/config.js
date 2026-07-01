/* config.js — พารามิเตอร์เกม AR Finger Tracking (จูนที่นี่ที่เดียว) · window.GAME_CONFIG
   ใช้ KampaiHands (kampai-hands.js) — ดู AR-GAME.md § Finger Tracking */
window.GAME_CONFIG = {
    SLUG: '_template-ar-hands',   // ⚠️ TODO: ใส่ slug จริง (ตรงกับ game_slug ใน migration)

    // ── MediaPipe Hands (KampaiHands — pattern balloon-burst) ──
    HANDS: {
        maxNumHands: 2,
        modelComplexity: 1,
        minConfidence: 0.6,
        smoothing: 0.4,
        lostHoldMs: 140,
        sweepSteps: 2,
        cameraWidth: 640,
        cameraHeight: 480
    },

    // ── เกม ──
    GAME_DURATION: 60,
    SPAWN_INTERVAL_MS: 1100,
    HIT_RADIUS: 0.06,                  // รัศมีชน (สัดส่วน 0..1 ของจอ)
    POINTS_CORRECT: 10,
    POINTS_WRONG: -5,
    BGM: 'cheerful',

    // ── ออนไลน์ ──
    ENABLE_ONLINE: true,
    ONLINE_DURATION: 60
};
