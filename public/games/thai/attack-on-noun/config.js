/* config.js — พารามิเตอร์เกม ผู้พิทักษ์ลักษณะนาม */
window.GAME_CONFIG = {
    SLUG: 'attack-on-noun',
    TITLE: 'ผู้พิทักษ์ลักษณะนาม',
    GAME_DURATION: 120,     // เวลาเล่นสูงสุด (วินาที)
    LIVES_START: 5,         // จำนวนหัวใจเริ่มต้น
    INITIAL_AMMO: 20,       // จำนวนกระสุนเริ่มต้น
    BGM_PRESET: 'battle',    // เสียงดนตรีพื้นหลัง
    DIFFICULTY: {
        easy:   { duration: 150, lives: 7, ammo: 30, titanSpeed: 0.7, maxEnemies: 5,  waveCount: 5,  distractors: 1 },
        medium: { duration: 120, lives: 5, ammo: 20, titanSpeed: 1.0, maxEnemies: 8,  waveCount: 8,  distractors: 2 },
        hard:   { duration: 90,  lives: 3, ammo: 15, titanSpeed: 1.3, maxEnemies: 12, waveCount: 10, distractors: 3 }
    },
    COMBO_FEVER_THRESHOLD: 5,
    FEVER_DURATION: 10,
    FEVER_MULTIPLIER: 2,
    WAVE_TITANS: [3, 4, 5, 5, 6, 6, 7, 8, 8, 10],
    POWERUP_CHANCE: 0.15,
    SCORE: {
        normal: 100,
        abnormal: 150,
        colossal: 300,
        bird: 200,
        beast: 200,
        armored: 500,
        wrong: -20
    }
};
