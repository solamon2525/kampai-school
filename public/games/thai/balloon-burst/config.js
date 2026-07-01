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
    MEDAL_GOLD_SCORE: 300,
    MEDAL_SILVER_SCORE: 150,
    BGM: 'cheerful',

    // ── AR ──
    DETECTOR: 'pose', // 'framediff' (ไม่พึ่ง lib) | 'pose' (MediaPipe jsdelivr)
    HOLD_MS: 0,            // เจาะทันทีที่สัมผัส/เคลื่อนทับ ไม่ต้อง hold
    TUNING: {              // override DEFAULT_TUNING ของ engine (ดู kampai-ar.js)
        downsample: { w: 120, h: 90 },
        diffThreshold: 30,
        minMotionRatio: 0.015,
        smoothing: 0.70,
        intervalMs: 50,
        marker: true,      // แสดงจุดตรวจจับตำแหน่งของผู้เล่น
        particles: true,   // แสดงฝุ่นเวทมนตร์เอฟเฟกต์การขยับตัว
        // ── One Euro Filter (v1.2.0) — ลดสั่นไหวตอนมือค้าง + ตอบสนองทันทีตอนมือไว ──
        filterType: 'oneeuro',         // เปิดใช้ One Euro Filter แทน EMA
        oneEuroMinCutoff: 1.0,         // Cutoff ขั้นต่ำ (Hz) — นิ่งตอนค้างชี้ลูกโป่ง
        oneEuroBeta: 0.007,            // ค่าสัมประสิทธิ์ความเร็ว — ไวตอนยื่นมือเจาะ
        oneEuroDCutoff: 1.0            // Cutoff อนุพันธ์ (Hz)
    }
};
