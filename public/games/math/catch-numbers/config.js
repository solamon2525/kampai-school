/* config.js — catch-numbers AR Catcher (จูนที่นี่ที่เดียว) */
window.GAME_CONFIG = {
    SLUG: 'catch-numbers',

    // ── MediaPipe Hands — เลื่อนตะกร้าตามตำแหน่งมือ (แม่นกว่า framediff) ──
    HANDS: {
        maxNumHands: 2,
        modelComplexity: 1,
        minConfidence: 0.58,
        filterType: 'oneeuro',
        oneEuroMinCutoff: 0.85,
        oneEuroBeta: 0.012,
        oneEuroDCutoff: 1.0,
        smoothing: 0.45,
        lostHoldMs: 220,
        sweepSteps: 3,
        minExtendedFingers: 0,   // ไม่บังคับยกนิ้ว — เห็นมือก็เลื่อนตะกร้าได้
        cameraWidth: 960,
        cameraHeight: 720
    },

    // ── เกม ──
    ROUNDS: 5,              // จำนวนรอบ
    ROUND_SEC: 30,          // วินาทีต่อรอบ
    LIVES: 3,               // ชีวิตต่อรอบ (รับผิด/ปล่อยตก = -1)

    // ── ตะกร้า ──
    BASKET_W: 0.22,         // ความกว้างตะกร้า (สัดส่วนจอ) — sprite ~515×210
    CATCH_RADIUS: 0.10,     // รัศมีจับ (สัดส่วน)
    BASKET_EDGE: 0.05,      // ขอบซ้าย-ขวาที่ clamp ตะกร้า (0..1)

    // ── Spawn / Fall ──
    SPAWN_MS: 1500,         // ms ระหว่าง spawn รอบแรก
    SPAWN_MS_DECAY: 100,    // ลดลงต่อรอบ
    FALL_SPEED: 0.0014,     // ความเร็วตก (สัดส่วนจอ/เฟรม)
    FALL_SPEED_INC: 0.0002, // เพิ่มต่อรอบ

    // ── คะแนน ──
    SCORE_CATCH: 100,       // รับถูก
    SCORE_BONUS_TIME: 5,    // โบนัสต่อวินาทีที่เหลือ (ตอนจบรอบ)

    BGM: 'cheerful'
};
