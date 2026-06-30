/* config.js — พารามิเตอร์เกม เกมคณิตคิดไว ยกมือทายถูกผิด! */
window.GAME_CONFIG = {
  // ─── SDK & Identity ───
  SLUG: 'math-hand-raising',
  TITLE: 'เกมคณิตคิดไว ยกมือทายถูกผิด!',
  BGM: 'playful',

  // ─── Gameplay ───
  TOTAL_QUESTIONS: 10,          // จำนวนข้อต่อรอบ
  COOLDOWN_MS: 1000,            // หน่วงก่อนเริ่มรับคำตอบ (ms)
  FEEDBACK_MS: 2500,            // แสดง feedback นานเท่าไร (ms)
  FRAMES_TO_CONFIRM: 20,       // จำนวนเฟรมค้างมือก่อนส่งคำตอบ (โหมดกล้อง)

  // ─── Timer ต่อข้อ (วินาที) — แยกตามระดับชั้น ───
  TIMER: {
    4: 15,   // ป.4 — 15 วินาที
    5: 12,   // ป.5 — 12 วินาที
    6: 10,   // ป.6 — 10 วินาที
  },

  // ─── ช่วงตัวเลขของโจทย์ — แยกตามระดับชั้น ───
  DIFFICULTY: {
    4: {
      addition:       { min: 1,   max: 100 },
      subtraction:    { min: 1,   max: 100 },
      multiplication: { minA: 2,  maxA: 12,  minB: 2, maxB: 12 },
      division:       { minDiv: 2, maxDiv: 12, minAns: 2, maxAns: 12 },
    },
    5: {
      addition:       { min: 10,  max: 1000 },
      subtraction:    { min: 10,  max: 1000 },
      multiplication: { minA: 2,  maxA: 25,  minB: 2, maxB: 25 },
      division:       { minDiv: 2, maxDiv: 25, minAns: 2, maxAns: 25 },
    },
    6: {
      addition:       { min: 100, max: 10000 },
      subtraction:    { min: 100, max: 10000 },
      multiplication: { minA: 5,  maxA: 50,  minB: 5, maxB: 50 },
      division:       { minDiv: 3, maxDiv: 50, minAns: 3, maxAns: 50 },
    },
  },

  // ─── คะแนน ───
  SCORE_CORRECT: 10,            // คะแนนตอบถูก
  SCORE_BONUS_FAST: 5,          // โบนัสถ้าตอบเร็ว
  BONUS_THRESHOLD: 0.5,         // ตอบภายใน 50% ของเวลา → ได้โบนัส
};
