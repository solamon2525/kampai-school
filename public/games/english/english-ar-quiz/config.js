/* config.js — เกม "English AR Quiz" ภาษาอังกฤษ ป.4 (เลือกตอบ AR) */
window.GAME_CONFIG = {
    SLUG: 'english-ar-quiz',

    // ── AR ──
    DETECTOR: 'framediff',
    ZONES: ['left', 'center', 'right'],
    HOLD_MS: 2500,
    TUNING: {
        downsample: { w: 120, h: 90 },
        diffThreshold: 35,
        minMotionRatio: 0.015,
        smoothing: 0.78,
        intervalMs: 55,
        minConfidence: 0.5
    },

    // ── เกม ──
    ROUNDS: 10,
    ROUND_SEC: 20,
    BGM: 'playful'
};
