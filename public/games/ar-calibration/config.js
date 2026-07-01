/* config.js — พารามิเตอร์ของระบบปรับจูนกล้อง AR · window.GAME_CONFIG */
window.GAME_CONFIG = {
    SLUG: 'ar-calibration',
    GAME_DURATION: 0, // เครื่องมือระบบ: ไม่จำกัดเวลาเล่น
    DETECTOR: 'pose', // ค่าเริ่มต้นคือ Pose
    HOLD_MS: 0,
    TUNING: {
        filterType: 'ema',
        oneEuroMinCutoff: 1.0,
        oneEuroBeta: 0.007,
        oneEuroDCutoff: 1.0,
        smoothing: 0.78,
        intervalMs: 55,
        marker: true,
        particles: true
    }
};
