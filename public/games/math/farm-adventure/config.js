/**
 * GAME CONFIG — Farm Adventure: ภารกิจวัดความยาวในฟาร์มมหาสนุก
 * คณิตศาสตร์ ป.4 — วัดความยาว แปลงหน่วย เปรียบเทียบ บวก/ลบ โจทย์ปัญหา
 */
window.GAME_CONFIG = {
    SLUG: 'farm-adventure',
    TITLE: '🌾 Farm Adventure: ภารกิจวัดความยาวในฟาร์มมหาสนุก',
    DESCRIPTION: 'ช่วยชาวนาน้อยฟื้นฟูฟาร์ม! ทำภารกิจวัดความยาว เปรียบเทียบ แปลงหน่วย และแก้โจทย์ปัญหา',
    BGM_PRESET: 'playful',
    CONTROLS: { dpad: false, buttons: [] },

    // ─── gameplay ───
    LIVES: 5,
    TIME_LIMIT: 0,
    SCORE_CORRECT: 10,
    SCORE_WRONG: 2,
    BONUS_CLEAR: 50,
    BONUS_STREAK: 20,
    STREAK_TARGET: 5,
    QUESTIONS_PER_ROUND: 10,

    ENABLE_ONLINE: false,
};
