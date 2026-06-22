/**
 * GAME CONFIG — Genetic Treasure Quest
 * เกมสำรวจและตามล่าหีบสมบัติพันธุศาสตร์ ป.6/ม.ต้น
 */
window.GAME_CONFIG = {
    SLUG: 'genetic-quest',
    TITLE: '🧬 Genetic Treasure Quest',
    DESCRIPTION: 'ออกผจญภัยในเกาะจีโนม ค้นหาหีบสมบัติพันธุศาสตร์ ตอบคำถามเพื่อเก็บสะสมยีนและชิ้นส่วนดีเอ็นเอ!',
    BGM_PRESET: 'playful',
    CONTROLS: { dpad: true, buttons: [] },

    // ─── Gameplay parameters ───
    HP_MAX: 100,
    CHESTS_TOTAL: 50,
    EXP_BASE: 100, // EXP base needed for level 1 (req = level * 100)
    MONSTER_ATTACK_DAMAGE: 15,
};
