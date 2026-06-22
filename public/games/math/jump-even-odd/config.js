/* config.js — เกม AR "กระโดดเลขคู่-คี่" (gesture: กระโดด/ย่อตัว) · window.GAME_CONFIG
   ดูคำอธิบาย knob + ช่วงที่แนะนำใน AR-GAME.md (ตารางจูน + Tier 2: gesture jump/squat) */
window.GAME_CONFIG = {
    SLUG: 'jump-even-odd',

    // ── AR ──
    DETECTOR: 'pose',               // gesture กระโดด/ย่อ ต้องใช้ pose (จับสะโพก) — โหลดไม่ได้ → tap เล่นได้
    HOLD_MS: 2500,                  // (ไม่ใช้ในเกมนี้ — gesture คอมมิตทันที)
    TUNING: {
        minConfidence: 0.5,
        jumpVel: 0.05,              // กระโดด: สะโพกขึ้นเร็วเกินค่านี้
        squatVel: 0.05,             // ย่อ: สะโพกลงเร็วเกินค่านี้
        gestureCooldownMs: 800
    },

    // ── การกระทำ 2 ทาง (gesture → คำตอบ) ──
    ACTIONS: {
        jump:  { tag: '⬆️ กระโดด', label: 'เลขคู่' },
        squat: { tag: '⬇️ ย่อตัว',  label: 'เลขคี่' }
    },

    // ── เกม ──
    ROUNDS: 10,                     // จำนวนข้อ (≤ จำนวนใน data.js)
    ROUND_SEC: 20,                  // เวลาต่อข้อ (วินาที)
    BGM: 'cheerful'
};
