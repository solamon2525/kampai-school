/* config.js — พารามิเตอร์เกมสูตรคูณตาไว (จูนที่นี่ที่เดียว) · window.GAME_CONFIG */
window.GAME_CONFIG = {
    SLUG: 'multiply-burst',
    GAME_DURATION: 60,
    SPAWN_INTERVAL_MS: 1150,
    POINTS_CORRECT: 10,
    POINTS_WRONG: -5,
    BALLOON_RADIUS_MIN: 50,
    BALLOON_RADIUS_MAX: 66,
    BALLOON_SPEED_MIN: 0.38,
    BALLOON_SPEED_MAX: 0.68,
    FINGER_HIT_PADDING: 38,
    HIT_HOLD_MS: 200,
    MAGNET_RADIUS_MUL: 1.45,
    CAMERA_RADIUS_MUL: 1.12,
    PLAY_ZONE_TOP: 0.4,
    ZONE_SLOW_MUL: 0.58,
    PRACTICE_MAX_MS: 5000,
    PRACTICE_READY_MS: 1500,
    SPAWN_CENTER_WEIGHT: 0.82,
    MEDAL_GOLD_SCORE: 280,
    MEDAL_SILVER_SCORE: 140,
    BGM: 'playful',

    TABLE_MIN: 2,
    TABLE_MAX: 9,
    CORRECT_SPAWN_WEIGHT: 0.32,

    HANDS: {
        maxNumHands: 2,
        modelComplexity: 1,
        minConfidence: 0.65,
        filterType: 'oneeuro',
        oneEuroMinCutoff: 1.0,
        oneEuroBeta: 0.012,
        oneEuroDCutoff: 1.0,
        smoothing: 0.42,
        lostHoldMs: 140,
        sweepSteps: 4,
        minExtendedFingers: 4,
        cameraWidth: 640,
        cameraHeight: 480
    }
};
