/* config.js — Sci-Lab Defender (AR วันวิทย์) พารามิเตอร์ระบบเกม
   แชร์ global scope · โหลดก่อน data.js และ game.js */
window.GAME_CONFIG = {
    SLUG: 'sci-lab-defender',
    TITLE: 'Sci-Lab Defender',
    SUBTITLE: 'AR วันวิทย์ — ผู้พิทักษ์ห้องแล็บวิทยาศาสตร์',
    SUBJECT: 'วิทยาศาสตร์',
    BGM: 'cheerful',

    TOTAL_STAGES: 3,
    STAGE_DURATION: 30,         // วินาทีต่อฐาน (30s x 3 = 90 วินาที)
    LIVES_MAX: 5,               // พลังงานเกราะป้องกันห้องทดลอง

    // ── ฐานที่ 1: สสารและเคมี (Chemistry & Matter Lab) ──
    STAGE1: {
        SPAWN_INTERVAL_MS: 1100,
        ITEM_SPEED_MIN: 1.8,
        ITEM_SPEED_MAX: 2.8,
        BEAKER_WIDTH_RATIO: 0.16, // สัดส่วนความกว้างบีกเกอร์เทียบกับหน้าจอ
        POINTS_CORRECT: 15,
        POINTS_WRONG: -10,
        POINTS_HAZARD: -20
    },

    // ── ฐานที่ 2: แสงและพลังงาน (Optics & Solar Defense) ──
    STAGE2: {
        SPAWN_INTERVAL_MS: 1300,
        LASER_SPEED_MIN: 2.0,
        LASER_SPEED_MAX: 3.2,
        SHIELD_RADIUS: 38,        // รัศมีโล่กระจกสะท้อนแสงรอบมือ (px)
        POINTS_DEFLECT: 20,
        POINTS_CORE_HIT: 35,
        POINTS_MISS: -10
    },

    // ── ฐานที่ 3: อวกาศและดาราศาสตร์ (Space Defense Fever Time) ──
    STAGE3: {
        SPAWN_INTERVAL_MS: 750,
        TARGET_SPEED_MIN: 1.6,
        TARGET_SPEED_MAX: 3.0,
        FINGER_HIT_PADDING: 30,   // รัศมีตรวจจับชนปลายนิ้วชี้ (px)
        POINTS_TARGET: 25,
        POINTS_BONUS: 60
    },

    // ── เกณฑ์เหรียญรางวัล ──
    MEDAL_GOLD_SCORE: 500,
    MEDAL_SILVER_SCORE: 320,
    MEDAL_BRONZE_SCORE: 180,

    // ── MediaPipe Hands Engine Config (KampaiHands) ──
    HANDS: {
        maxNumHands: 2,
        modelComplexity: 1,
        minConfidence: 0.6,
        filterType: 'oneeuro',
        oneEuroMinCutoff: 1.0,
        oneEuroBeta: 0.01,
        lostHoldMs: 200,
        sweepSteps: 4,
        minExtendedFingers: 0,    // 0 = รองรับทั้งขยับบีกเกอร์และจิ้มปลายนิ้ว
        cameraWidth: 640,
        cameraHeight: 480
    }
};
