/* config.js — พารามิเตอร์เกม AR Sci-Lab Defender (จูนที่นี่ที่เดียว) · window.GAME_CONFIG
   ใช้ KampaiHands (kampai-hands.js) — ดู AR-GAME.md § Finger Tracking */
window.GAME_CONFIG = {
    SLUG: 'sci-lab-defender',
    TITLE: '🧪 Sci-Lab Defender AR (ผู้พิทักษ์ห้องแล็บอวกาศ)',
    DESCRIPTION: 'เกม AR กิจกรรมวันวิทยาศาสตร์ ผสาน 3 ฐานการทดลอง: เคมีสสาร, สะท้อนแสงเลเซอร์, และพิทักษ์โลกจากอุกกาบาต',

    // ── MediaPipe Hands (KampaiHands) ──
    HANDS: {
        maxNumHands: 2,
        modelComplexity: 1,
        minConfidence: 0.58,
        filterType: 'oneeuro',
        oneEuroMinCutoff: 0.9,
        oneEuroBeta: 0.01,
        lostHoldMs: 200,
        sweepSteps: 4,
        minExtendedFingers: 0,
        cameraWidth: 960,
        cameraHeight: 720
    },

    // ── สเตจและการจับเวลา ──
    STAGE_DURATION: 25,          // วินาทีต่อสเตจ (3 สเตจ = 75 วินาที)
    TOTAL_STAGES: 3,
    GAME_DURATION: 75,           // รวมทั้งหมด 75 วินาที

    // ── สเกลและคะแนน ──
    HIT_RADIUS: 0.07,            // รัศมีชน (สัดส่วน 0..1 ของจอ)
    POINTS_CORRECT: 10,          // ตอบถูก/รับสารถูก
    POINTS_WRONG: -5,            // รับสารผิด/โดนสิ่งกีดขวาง
    POINTS_STAGE_CLEAR: 50,      // โบนัสผ่านแต่ละสเตจ
    COMBO_STEP: 5,               // ทุกๆ คอมโบ 5 เพิ่มคะแนนพิเศษ
    BGM: 'cheerful',

    // ── ออนไลน์ ──
    ENABLE_ONLINE: true,
    ONLINE_DURATION: 75
};
