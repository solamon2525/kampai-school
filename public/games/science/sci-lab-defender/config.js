/* config.js — Sci-Lab Defender (AR วันวิทย์) พารามิเตอร์ระบบเกม
   แชร์ global scope · โหลดก่อน data.js และ game.js */
window.GAME_CONFIG = {
    SLUG: 'sci-lab-defender',
    TITLE: 'Sci-Lab Defender',
    SUBTITLE: 'AR วันวิทย์ — ผู้พิทักษ์ห้องแล็บวิทยาศาสตร์',
    SUBJECT: 'วิทยาศาสตร์',
    BGM: 'cheerful',

    TOTAL_STAGES: 3,
    STAGE_DURATION: 45,         // วินาทีต่อฐาน (45s x 3 = 135 วินาที)
    LIVES_MAX: 7,               // พลังงานเกราะป้องกันห้องทดลอง

    // ── ฐานที่ 1: สสารและเคมี (Chemistry & Matter Lab) ──
    STAGE1: {
        SPAWN_INTERVAL_MS: 2200,
        ITEM_SPEED_MIN: 1.0,
        ITEM_SPEED_MAX: 1.6,
        BEAKER_WIDTH_RATIO: 0.16, // สัดส่วนความกว้างบีกเกอร์เทียบกับหน้าจอ
        POINTS_CORRECT: 15,
        POINTS_WRONG: -5,
        POINTS_HAZARD: -10
    },

    // ── ฐานที่ 2: แสงและพลังงาน (Optics & Solar Defense) ──
    STAGE2: {
        SPAWN_INTERVAL_MS: 2000,
        LASER_SPEED_MIN: 1.2,
        LASER_SPEED_MAX: 2.0,
        SHIELD_RADIUS: 38,        // รัศมีโล่กระจกสะท้อนแสงรอบมือ (px)
        POINTS_DEFLECT: 20,
        POINTS_CORE_HIT: 35,
        POINTS_MISS: -5
    },

    // ── ฐานที่ 3: อวกาศและดาราศาสตร์ (Space Defense Fever Time) ──
    STAGE3: {
        SPAWN_INTERVAL_MS: 1200,
        TARGET_SPEED_MIN: 0.8,
        TARGET_SPEED_MAX: 1.8,
        FINGER_HIT_PADDING: 30,   // รัศมีตรวจจับชนปลายนิ้วชี้ (px)
        POINTS_TARGET: 25,
        POINTS_BONUS: 60
    },

    // ── เกณฑ์เหรียญรางวัล ──
    MEDAL_GOLD_SCORE: 300,
    MEDAL_SILVER_SCORE: 180,
    MEDAL_BRONZE_SCORE: 80,

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
