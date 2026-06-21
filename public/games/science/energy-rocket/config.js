/* config.js — เกม AR "จรวดพลังงาน" (energy meter: ออกแรง/วิ่งอยู่กับที่เติมพลัง) · window.GAME_CONFIG
   ดูคำอธิบาย knob + ช่วงที่แนะนำใน AR-GAME.md (Tier 2: energy / onEnergy) */
window.GAME_CONFIG = {
    SLUG: 'energy-rocket',

    // ── AR ──
    DETECTOR: 'framediff',          // พลังการเคลื่อนไหวใช้ framediff ได้ดี (ไม่พึ่ง CDN — ทนเครื่องโรงเรียน)
    TUNING: {
        downsample: { w: 120, h: 90 },
        diffThreshold: 35,
        minMotionRatio: 0.012,      // ต่ำลงนิด → ขยับแล้วพลังขึ้นไว
        intervalMs: 55
    },

    // ── พลัง (charge meter) ──
    CHARGE_K: 0.05,                 // ขยับ 1 หน่วยพลัง → เติม charge เท่าไร/เฟรม
    DRAIN: 0.006,                   // ถ้าหยุดนิ่ง charge ไหลลงเท่าไร/เฟรม (บังคับขยับต่อเนื่อง)
    TAP_K: 0.07,                    // แตะปุ่ม "ออกแรง" 1 ครั้ง → เติม charge (fallback/ช่วยเด็กเล็ก)

    // ── เกม ──
    ROUNDS: 6,                      // จำนวนจรวด/ความรู้ (≤ จำนวนใน data.js)
    ROUND_SEC: 15,                  // เวลาเติมพลังต่อรอบ (วินาที)
    BGM: 'cheerful'
};
