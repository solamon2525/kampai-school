/**
 * Mario Math Run — Configuration File
 * Single Source of Configuration Parameters
 */
window.GAME_CONFIG = {
  SLUG: 'mario-math-run',
  TITLE: 'Mario Math Run — มาริโอ้ลุยโจทย์คณิต',
  SUBJECT: 'คณิตศาสตร์',
  DURATION: 60,
  INITIAL_LIVES: 3,
  GRAVITY: 0.55,
  JUMP_FORCE: -11.5,
  MOVE_SPEED: 4.5,
  AUTO_SCROLL_SPEED: 2.0,
  ENEMY_SPEED: 1.2,
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 450,
  BLOCK_SIZE: 48,
  MODES: [
    { id: 'add', label: '➕ บวกเลข (1-20)', key: 'add' },
    { id: 'sub', label: '➖ ลบเลข (1-20)', key: 'sub' },
    { id: 'mul', label: '✖️ สูตรคูณ (แม่ 2-12)', key: 'mul' },
    { id: 'div', label: '➗ หารเลข (ลงตัว)', key: 'div' },
    { id: 'mixed', label: '🎲 ผสม (+ - × ÷)', key: 'mixed' }
  ]
};
