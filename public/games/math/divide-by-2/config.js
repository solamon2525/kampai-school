/* config.js — หารเร็วในใจ (Divide by 2 Quick) */
window.GAME_CONFIG = {
  SLUG: 'divide-by-2',
  BGM: 'playful',

  GAME_DURATION: 60,
  QUESTION_TIME: 8,
  QUESTION_TIME_MIN: 4,
  QUESTION_TIME_RAMP: 0.15,

  POINTS_CORRECT: 10,
  POINTS_WRONG: -3,
  COMBO_BONUS: 5,
  COMBO_STEP: 3,
  FAST_BONUS: 5,
  FAST_THRESHOLD: 0.45,

  STAR_THRESHOLDS: [80, 180, 300],

  DEFAULT_LEVEL: 'easy',
  LEVELS: {
    easy:   { label: 'ง่าย',  min: 4,  max: 20,  grade: 'ป.2' },
    medium: { label: 'กลาง',  min: 10, max: 40,  grade: 'ป.3' },
    hard:   { label: 'ยาก',   min: 20, max: 100, grade: 'ป.4+' },
  },

  VERSUS_DURATION: 60,
  PRACTICE_QUESTIONS: 20,
};
