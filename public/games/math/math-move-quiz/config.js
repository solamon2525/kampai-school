/* config.js — พารามิเตอร์เกม "ขยับตอบเลข" (จูนที่นี่ที่เดียว) · window.GAME_CONFIG
   ดูคำอธิบาย knob + ช่วงที่แนะนำใน AR-GAME.md (ตารางจูนประสิทธิภาพ) */
window.GAME_CONFIG = {
    SLUG: 'math-move-quiz',         // ตรงกับ game_slug ใน migration

    // ── AR ──
    DETECTOR: 'framediff',          // 'framediff' (ไม่พึ่ง lib ทนเครื่องโรงเรียน) | 'pose' (MediaPipe — แม่นกว่า ค้างนิ่งได้ แต่พึ่ง CDN)
    ZONES: ['left', 'right'],       // 2 ตัวเลือก: เอียงตัวซ้าย = A · เอียงตัวขวา = B (engine ตั้งเส้นแบ่งที่ 0.5 ให้เอง)
    HOLD_MS: 1800,                  // ค้างท่ากี่ ms ถึงจะคอมมิตคำตอบ (1200–2500 = พอมีเวลาตัดสินใจ)
    TUNING: {                       // override DEFAULT_TUNING ของ engine (ดู kampai-ar.js)
        downsample: { w: 120, h: 90 },
        diffThreshold: 35,
        minMotionRatio: 0.015,
        smoothing: 0.78,
        intervalMs: 55,
        minConfidence: 0.5
    },

    // ── เกม ──
    ROUNDS: 10,                     // จำนวนข้อต่อรอบ (≤ จำนวนใน data.js — ที่เหลือเป็นบัฟเฟอร์ให้สุ่มไม่ซ้ำ)
    ROUND_SEC: 15,                  // เวลาต่อข้อ (วินาที)
    BGM: 'cheerful'                 // เพลงพื้นหลังเริ่มต้น (หลังบ้าน override ได้)
};
