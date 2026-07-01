/* config.js — พารามิเตอร์เกม AR Hand Tracking (จูนที่นี่ที่เดียว) · window.GAME_CONFIG
   ดูคำอธิบาย knob + ช่วงที่แนะนำใน AR-GAME.md (ตารางจูนประสิทธิภาพ)
   เทมเพลตนี้เหมาะสำหรับเกมที่ต้องใช้มือสัมผัส/ชนวัตถุ (เช่น เจาะลูกโป่ง, รับของตก ฯลฯ) */
window.GAME_CONFIG = {
    SLUG: '_template-ar-hands',   // ⚠️ TODO: ใส่ slug จริง (ตรงกับ game_slug ใน migration)

    // ── AR ──
    DETECTOR: 'pose',                  // 'framediff' (ไม่พึ่ง lib) | 'pose' (MediaPipe jsdelivr · แม่นยำกว่า)
    HOLD_MS: 0,                        // 0 = ไม่ต้อง hold ค้าง → ตรวจจับสัมผัสทันทีที่มือชน (เหมาะกับเกมแบบ action)
    TUNING: {                          // override DEFAULT_TUNING ของ engine (ดู kampai-ar.js)
        downsample: { w: 120, h: 90 }, // ความละเอียด framediff (ต่ำ=เบา CPU/หยาบ · สูง=แม่น/หนัก)
        diffThreshold: 30,             // ความต่างพิกเซลขั้นต่ำที่นับ "ขยับ"
        minMotionRatio: 0.015,         // สัดส่วนพิกเซลขยับขั้นต่ำ/เฟรม
        smoothing: 0.70,               // EMA smoothing (ต่ำ=ไว/สั่น · สูง=นิ่ง/หน่วง)
        intervalMs: 50,                // คาบ loop framediff (~20fps)
        minConfidence: 0.5,            // ค่าความมั่นใจ pose ขั้นต่ำ (pose mode)
        marker: true,                  // แสดงจุดตรวจจับตำแหน่งผู้เล่น
        particles: true,               // ฝุ่นเวทมนตร์เอฟเฟกต์การขยับตัว
        // ── One Euro Filter (ลด jitter ที่มือนิ่ง โดยไม่เพิ่ม latency ตอนมือไว) ──
        filterType: 'oneeuro',         // 'ema' (ค่าเริ่มต้น) | 'oneeuro' (ลดสั่นไหวดีกว่า แนะนำ)
        oneEuroMinCutoff: 1.0,         // Cutoff ขั้นต่ำ (Hz) — ต่ำ=นิ่งตอนมืออยู่นิ่ง (0.5–3.0)
        oneEuroBeta: 0.007,            // ค่าสัมประสิทธิ์ความเร็ว — สูง=ตอบสนองเร็วตอนมือไว (0.001–0.05)
        oneEuroDCutoff: 1.0            // Cutoff อนุพันธ์ (Hz) — สำหรับคำนวณความเร็ว (0.5–3.0)
    },

    // ── เกม ──
    GAME_DURATION: 60,                 // ระยะเวลาเล่นเป็นวินาที
    SPAWN_INTERVAL_MS: 1100,           // ระยะห่างในการสปอนวัตถุ (ms)
    HIT_RADIUS: 0.06,                  // รัศมีสำหรับตรวจจับการชนมือ (สัดส่วนทศนิยม 0..1 ของจอ)
    POINTS_CORRECT: 10,                // คะแนนต่อการตอบถูก/ชนถูก
    POINTS_WRONG: -5,                  // คะแนนหักต่อการตอบผิด/ชนผิด
    BGM: 'cheerful',                   // เพลงพื้นหลัง: cheerful/calm/warm/playful/bright/mellow

    // ── ออนไลน์ ──
    ENABLE_ONLINE: true,               // true = เปิดโหมดแข่งออนไลน์ (KampaiVersus)
    ONLINE_DURATION: 60                // เวลาแข่งออนไลน์ (วินาที)
};
