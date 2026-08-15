/* config.js — พารามิเตอร์เกม Animal Feast · window.GAME_CONFIG */
window.GAME_CONFIG = {
    SLUG: 'animal-feast',
    TITLE: '🐾 Animal Feast (ยอดนักป้อนอาหารสัตว์)',
    DESCRIPTION: 'เกมวิทยาศาสตร์แสนสนุก ป้อนอาหารสัตว์กินพืช สัตว์กินเนื้อ และสัตว์กินทั้งพืชและสัตว์ให้ถูกต้อง!',

    // ── ระบบเวลาและคะแนน ──
    GAME_DURATION: 60,          // เวลาต่อรอบ (วินาที)
    POINTS_CORRECT: 20,         // ป้อนอาหารถูกต้อง
    COMBO_BONUS: 5,             // โบนัสคอมโบต่อครั้ง
    PENALTY_WRONG: -10,         // ป้อนอาหารผิด
    FRENZY_COMBO_COUNT: 5,      // คอมโบถึง 5 ครั้งจะเข้าสู่ Frenzy Feast (คะแนน x2)
    FRENZY_DURATION_SEC: 6,     // เวลา Frenzy

    BGM: 'cheerful',

    // ── ออนไลน์ ──
    ENABLE_ONLINE: true,
    ONLINE_DURATION: 60
};
