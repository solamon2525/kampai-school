/* config.js — เกม AR "ยกมือตอบ" (ยกมือซ้าย/ขวา/สองมือ เลือกคำตอบ) · window.GAME_CONFIG
   ดูคำอธิบาย knob + ช่วงที่แนะนำใน AR-GAME.md (ตารางจูน + Tier 2: hands) */
window.GAME_CONFIG = {
    SLUG: 'hands-up-quiz',

    // ── AR ──
    DETECTOR: 'pose',               // ยกมือต้องใช้ pose (จับข้อมือ/ไหล่) — โหลด lib ไม่ได้จะ fallback framediff เอง
    MODE: 'hands',                  // โซน = การยกมือ ซ้าย/ขวา/สองมือ (แทนตำแหน่งยืน)
    ZONES: ['left', 'right', 'both'],
    HOLD_MS: 1500,                  // ยกมือค้างกี่ ms ถึงคอมมิต (มือค้างง่ายกว่ายืน → สั้นลงได้)
    TUNING: {
        minConfidence: 0.5,
        handRaiseMargin: 0.04,      // ข้อมือต้องสูงกว่าไหล่เกินค่านี้ ถึงนับว่า "ยก"
        smoothing: 0.6
    },

    // ── เกม ──
    ROUNDS: 8,                      // จำนวนข้อ (≤ จำนวนใน data.js)
    ROUND_SEC: 15,                  // เวลาต่อข้อ (วินาที)
    BGM: 'cheerful'
};
