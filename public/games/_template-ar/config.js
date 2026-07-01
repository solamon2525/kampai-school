/* config.js — พารามิเตอร์เกม (จูนที่นี่ที่เดียว) · window.GAME_CONFIG
   ดูคำอธิบาย knob + ช่วงที่แนะนำใน AR-GAME.md (ตารางจูนประสิทธิภาพ) */
window.GAME_CONFIG = {
    SLUG: '_template-ar',       // ⚠️ TODO: ใส่ slug จริง (ตรงกับ game_slug ใน migration)

    // ── AR ──
    DETECTOR: 'framediff',          // 'framediff' (ไม่พึ่ง lib) | 'pose' (MediaPipe jsdelivr)
    ZONES: ['left', 'center', 'right'],
    HOLD_MS: 2500,                  // ค้างท่ากี่ ms ถึงคอมมิต (1200–2500 = พอมีเวลาตัดสินใจ)
    TUNING: {                       // override DEFAULT_TUNING ของ engine (ดู kampai-ar.js)
        downsample: { w: 120, h: 90 },
        diffThreshold: 35,
        minMotionRatio: 0.015,
        smoothing: 0.78,
        intervalMs: 55,
        minConfidence: 0.5,
        // ── One Euro Filter (v1.2.0) — ลดสั่นไหวดีกว่า EMA (ใช้ได้ทั้ง framediff+pose) ──
        filterType: 'ema',             // 'ema' (ค่าเริ่มต้น เสถียร) | 'oneeuro' (ลดสั่น แนะนำ)
        oneEuroMinCutoff: 1.0,         // Cutoff ขั้นต่ำ (Hz) — ต่ำ=นิ่งตอนอยู่เฉย (0.5–3.0)
        oneEuroBeta: 0.007,            // ค่าสัมประสิทธิ์ความเร็ว — สูง=ตอบเร็วตอนขยับเร็ว (0.001–0.05)
        oneEuroDCutoff: 1.0            // Cutoff อนุพันธ์ (Hz) (0.5–3.0)
    },

    // ── เกม ──
    ROUNDS: 10,                     // จำนวนข้อ (≤ จำนวนใน data.js)
    ROUND_SEC: 20,                  // เวลาต่อข้อ (วินาที)
    BGM: 'cheerful'                 // เพลงพื้นหลังเริ่มต้น (หลังบ้าน override ได้)
};
