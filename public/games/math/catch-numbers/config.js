/* config.js — catch-numbers AR Catcher (จูนที่นี่ที่เดียว) */
window.GAME_CONFIG = {
    SLUG: 'catch-numbers',

    // ── AR Engine ──
    DETECTOR: 'framediff',   // ไม่พึ่ง CDN
    TUNING: {
        downsample: { w: 120, h: 90 },
        diffThreshold: 30,
        minMotionRatio: 0.012,
        smoothing: 0.72,      // ต่ำกว่า template = ตอบสนองไว (เกมแอ็คชั่น)
        intervalMs: 50,
        minConfidence: 0.5,
        marker: true,
        particles: true
    },

    // ── เกม ──
    ROUNDS: 5,              // จำนวนรอบ
    ROUND_SEC: 30,          // วินาทีต่อรอบ
    LIVES: 3,               // ชีวิตต่อรอบ (รับผิด/ปล่อยตก = -1)

    // ── ตะกร้า ──
    BASKET_W: 0.18,         // ความกว้างตะกร้า (สัดส่วนจอ)
    CATCH_RADIUS: 0.10,     // รัศมีจับ (สัดส่วน)

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
