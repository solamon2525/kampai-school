/* config.js — พารามิเตอร์เกม มาริโอตะลุยคำไทย (Phaser 4.2.1) */
window.GAME_CONFIG = {
  SLUG: 'thai-mario-vocab',
  BGM: 'none', // ใช้ระบบเสียง Chiptune 8-bit เฉพาะของเกมใน audio.js (เคารพปุ่ม toggle ของ KAMPAI.sound)

  ORIENTATION: 'landscape',
  LOCK_ORIENTATION_ON_START: false,

  // ── ระบบชีวิตและคะแนน ──
  LIVES: 5,
  MAX_LIVES: 5,
  TIME_SECONDS: 150,
  CORRECT_WORD_POINTS: 100,
  STREAK_BONUS: 25,
  COIN_POINTS: 20,
  STOMP_POINTS: 50,
  STAGE_CLEAR_BONUS: 250,
  HEART_BONUS_POINTS: 80,
  STAR_THRESHOLDS: [600, 1500, 2600],

  // ── ฟิสิกส์ 2D Platformer (คำนวณจาก jump_tuner.py สำหรับ tile 40px @ 60Hz) ──
  TILE_SIZE: 40,
  RUN_SPEED: 280,
  SPRINT_SPEED: 355,
  GROUND_ACCEL: 2400,
  GROUND_DECEL: 2200,
  AIR_ACCEL: 1560,
  AIR_DECEL: 650,
  JUMP_VELOCITY: -800,
  RISE_GRAVITY: 2222,
  FALL_GRAVITY: 3889,
  MAX_FALL_SPEED: 880,
  APEX_THRESHOLD: 160,
  APEX_GRAVITY_MULT: 0.55,
  JUMP_CUT: 0.48,
  COYOTE_MS: 100,
  BUFFER_MS: 117,
  CORNER_CORRECT_PX: 10,
  INVULN_MS: 1700,

  ENABLE_ONLINE: true,
  ONLINE_DURATION: 120,
};
