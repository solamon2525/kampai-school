/* config.js — พารามิเตอร์เกม มาริโอตะลุยคำไทย (Godot 4.4.1 GDScript + WebAssembly) */
window.GAME_CONFIG = {
  SLUG: 'thai-mario-vocab',
  BGM: 'none', // เสียง Chiptune 8-bit ทำงานใน Godot AudioSynth (Master/Music/SFX)

  ORIENTATION: 'landscape',
  LOCK_ORIENTATION_ON_START: false,

  LIVES: 5,
  MAX_LIVES: 5,
  TIME_SECONDS: 150,
  STAR_THRESHOLDS: [600, 1500, 2600],

  ENABLE_ONLINE: true,
  ONLINE_DURATION: 120
};
