/* config.js — พารามิเตอร์เกมยิงธนู AR + KampaiHands · window.GAME_CONFIG
   ใช้ KampaiHands (kampai-hands.js) — ดู AR-GAME.md § Finger Tracking
   Gameplay: ดึงสาย + ปล่อย (bow-draw mechanic) */
window.GAME_CONFIG = {
    SLUG: 'archery-verb',

    // ── MediaPipe Hands (KampaiHands) ──
    HANDS: {
        maxNumHands: 2,
        modelComplexity: 1,
        minConfidence: 0.6,
        smoothing: 0.4,
        lostHoldMs: 160,
        sweepSteps: 2,
        cameraWidth: 640,
        cameraHeight: 480
    },

    // ── รอบ / คะแนน ──
    TOTAL_ROUNDS: 15,
    TARGETS_PER_ROUND: 3,        // 1 กริยา + 2 คำนามหลอก
    POINTS_HIT_VERB: 10,
    POINTS_HIT_DECOY: -5,
    POINTS_VERB_MISS: -5,

    // ── ธนู ──
    NOCK_RADIUS: 0.10,           // ระยะที่มือขวาต้องเข้าใกล้เพื่อเกาะสาย
    MAX_DRAW: 0.28,              // ระยะดึงสูงสุด (normalized)
    ARROW_MIN_SPEED: 0.009,      // ความเร็วลูกธนูขั้นต่ำ
    ARROW_MAX_SPEED: 0.028,      // ความเร็วลูกธนูเต็มแรง
    GRAVITY: 0.00008,            // แรงโน้มถ่วงลูกธนู (ต่อเฟรม)

    // ── เป้า ──
    TARGET_FALL_BASE: 0.00025,   // ความเร็วตกเริ่มต้น
    TARGET_FALL_INCR: 0.00002,   // เพิ่มตาม round
    TARGET_HIT_R: 0.055,         // รัศมีชนเป้า (normalized)

    // ── เสียง / ออนไลน์ ──
    BGM: 'epic',
    ENABLE_ONLINE: true,
    ONLINE_DURATION: 120
};
