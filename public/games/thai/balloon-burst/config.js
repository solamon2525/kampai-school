/* config.js — พารามิเตอร์เกม (จูนที่นี่ที่เดียว) · window.GAME_CONFIG */
window.GAME_CONFIG = {
    SLUG: 'balloon-burst',
    GAME_DURATION: 60,
    SPAWN_INTERVAL_MS: 1100,
    POINTS_CORRECT: 10,
    POINTS_WRONG: -5,
    BALLOON_RADIUS_MIN: 52,
    BALLOON_RADIUS_MAX: 68,
    BALLOON_SPEED_MIN: 0.9,
    BALLOON_SPEED_MAX: 1.9,
    FINGER_HIT_PADDING: 36,   // รัศมีเพิ่มรอบปลายนิ้วชี้ตอนเช็กชนลูกโป่ง (px)
    MEDAL_GOLD_SCORE: 300,
    MEDAL_SILVER_SCORE: 150,
    BGM: 'cheerful',

    // ── MediaPipe Hands (inline — pattern เดียวกับ cyberdrop) ──
    HANDS: {
        maxNumHands: 2,
        modelComplexity: 1,
        minConfidence: 0.6,
        smoothing: 0.4,       // lerp ตำแหน่งปลายนิ้วชี้ (0.4 = cyberdrop)
        cameraWidth: 640,
        cameraHeight: 480
    }
};
