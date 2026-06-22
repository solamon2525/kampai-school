/**
 * GAME CONFIG — Digestive System AR Explorer
 * กายวิภาคระบบย่อยอาหาร ป.4-6 — ลากวางจำลองด้วย AR/เมาส์/สัมผัส
 */
window.GAME_CONFIG = {
    SLUG: 'digestive-ar',
    TITLE: '🧬 Digestive System AR Explorer',
    DESCRIPTION: 'เรียนรู้ระบบย่อยอาหารด้วยเทคโนโลยี AR และแอนิเมชันเสมือนจริง ลากส่วนประกอบของอวัยวะจัดวางในร่างกายให้ถูกต้อง',
    BGM_PRESET: 'calm',
    CONTROLS: { dpad: false, buttons: [] },

    // ─── Gameplay ───
    LIVES: 0,           // ไม่จำกัดชีวิต
    TIME_LIMIT: 0,      // ไม่จำกัดเวลา (วัดเป็นความเร็วแทน)
    SCORE_CORRECT: 10,  // ตอบถูก
    SCORE_WRONG: 0,
    BONUS_CLEAR: 50,
    ENABLE_ONLINE: false,
};
