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
    MEDAL_GOLD_SCORE: 280,
    MEDAL_SILVER_SCORE: 140,
    BGM: 'playful',

    TABLE_MIN: 2,
    TABLE_MAX: 9,
    CORRECT_SPAWN_WEIGHT: 0.32,

    HANDS: {
        maxNumHands: 2,
        modelComplexity: 1,
        minConfidence: 0.6,
        smoothing: 0.52,
        lostHoldMs: 160,
        sweepSteps: 3,
        minExtendedFingers: 4,
        cameraWidth: 640,
        cameraHeight: 480
    }
};
