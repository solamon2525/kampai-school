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
    ROUNDS: 6,              // จำนวนรอบ (บวก ลบ คูณ หาร มากกว่า น้อยกว่า)
    ROUND_SEC: 30,          // วินาทีต่อรอบ
    LIVES: 3,               // ชีวิตต่อรอบ (รับผิด/ปล่อยตก = -1)

    // ── ตะกร้า ──
    BASKET_W: 0.17,         // ความกว้างตะกร้า (สัดส่วนจอ)
    CATCH_RADIUS: 0.085,    // รัศมีจับ (สัดส่วน)
    BASKET_EDGE: 0.05,      // ขอบซ้าย-ขวาที่ clamp ตะกร้า (0..1)

    // ── Spawn / Fall ──
    SPAWN_MS: 2400,         // ms ระหว่าง spawn รอบแรก
    SPAWN_MS_DECAY: 60,     // ลดลงต่อรอบ
    SPAWN_MS_MIN: 1400,     // spawn เร็วสุดต่อรอบ
    SPAWN_MIN_GAP_Y: 0.14,  // ระยะห่างแนวตั้งขั้นต่ำก่อน spawn ใหม่ (0..1)
    FALL_SPEED: 0.00085,    // ความเร็วตก (สัดส่วนจอ/เฟรม) — คงที่ทุกรอบ
    FALL_SPEED_INC: 0,      // ไม่เพิ่มความเร็วต่อรอบ

    // ── คะแนน ──
    SCORE_CATCH: 100,       // รับถูก
    SCORE_BONUS_TIME: 5,    // โบนัสต่อวินาทีที่เหลือ (ตอนจบรอบ)

    BGM: 'cheerful'
};
