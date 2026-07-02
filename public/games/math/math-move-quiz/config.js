/* config.js — พารามิเตอร์เกม "ขยับตอบเลข" (จูนที่นี่ที่เดียว) · window.GAME_CONFIG
   ดูคำอธิบาย knob + ช่วงที่แนะนำใน AR-GAME.md (ตารางจูนประสิทธิภาพ) */
window.GAME_CONFIG = {
    SLUG: 'math-move-quiz',         // ตรงกับ game_slug ใน migration

    // ── AR ──
    DETECTOR: 'framediff',          // 'framediff' (ไม่พึ่ง lib ทนเครื่องโรงเรียน) | 'pose' (MediaPipe — แม่นกว่า ค้างนิ่งได้ แต่พึ่ง CDN)
    ZONES: ['left', 'right'],       // 2 ตัวเลือก: เอียงตัวซ้าย = A · เอียงตัวขวา = B
    HOLD_MS: 4000,                  // ค้างท่ากี่ ms ถึงจะคอมมิต (ช้าลง = มีเวลาคิด · ไม่เผลอตอบ)
    TUNING: {
        downsample: { w: 120, h: 90 },
        diffThreshold: 38,
        minMotionRatio: 0.022,      // ต้องขยับชัดขึ้นก่อนนับโซน (ลด false trigger)
        smoothing: 0.82,
        intervalMs: 55,
        minConfidence: 0.5,
        marker: true,
        particles: false            // กล้องเต็มจอ — ปิด particle ให้เห็นตัวเองชัด
    },

    // ── เกม ──
    ROUNDS: 10,
    ROUND_SEC: 30,                  // เวลาต่อข้อ (วินาที) — เพิ่มจาก 20
    FEEDBACK_MS: 2200,              // พักหลังเฉลยก่อนข้อถัดไป
    SCORE_BASE: 100,
    BONUS_PER_SEC: 2,               // โบนัสตอบไว (ลดจาก ×5 เพื่อไม่เร่งให้รีบเกิน)
    BGM: 'cheerful'
};
