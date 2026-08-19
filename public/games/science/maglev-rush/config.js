/* config.js — Maglev Rush (รถไฟแม่เหล็ก) พารามิเตอร์ระบบเกม
   แชร์ global scope · โหลดก่อน data.js และ game.js
   ปรับขนาดจอใหญ่สุด (Full-width panoramic), ตัวหนังสือคมชัดขนาดใหญ่, รถไฟโปร่งแสงไม่บังจอ, สปีดช้าเล่นง่าย */
window.GAME_CONFIG = {
    SLUG: 'maglev-rush',
    TITLE: 'Maglev Rush',
    SUBTITLE: 'รถไฟแม่เหล็กความเร็วสูง — แรงและการเคลื่อนที่ด้วยสนามแม่เหล็ก',
    SUBJECT: 'วิทยาศาสตร์',
    BGM: 'racer',

    // ── ระบบราง & 3D Perspective (ขยายเต็มหน้าจอ มุมมองกว้างใหญ่ Panoramic) ──
    LANES: [-1, 0, 1],             // -1: เลนซ้าย, 0: เลนกลาง, 1: เลนขวา
    LANE_WIDTH_WORLD: 280,         // ขยายระยะห่างระหว่างเลนให้กว้างสะใจ เต็มจอ
    TRACK_DEPTH: 2600,             // ระยะความลึกของรางข้างหน้า (Z-axis)
    FOV: 420,                      // Field of view กว้างพิเศษ มุมมองเปิดโล่ง
    CAMERA_HEIGHT: 150,            // ความสูงกล้องเหนือราง
    CAMERA_TILT: 0.06,             // มุมก้มของกล้อง

    // ── ความเร็ว & แรงขับเคลื่อน (ช้า นุ่มนวล มองทัน อ่านสบาย) ──
    SPEED_CRUISE_KMH: 100,         // ความเร็วลอยตัวปกติ ช้าสบายๆ มองเห็นแต่ไกล
    SPEED_MAX_KMH: 220,            // ความเร็วสูงสุดตอนเทอร์โบ
    SPEED_MIN_KMH: 60,             // ความเร็วต่ำสุด
    TURBO_BOOST_KMH: 30,           // ความเร็วเพิ่มขึ้นเมื่อขั้วตรงกับขดลวด (N-N / S-S)
    ATTRACT_DRAG_KMH: 5,           // แทบไม่ลดความเร็วเมื่อขั้วต่าง (ไม่ลงโทษเด็ก)
    CRUISE_RECOVERY_RATE: 0.3,     // อัตราการคืนความเร็วกลับสู่ Cruise Speed
    SPEED_STEP_MULTIPLIER: 0.55,   // ลดความเร็วจริงในการเลื่อนราง มีเวลาอ่าน 8-10 วินาที!

    // ── ระยะห่างการเกิดวัตถุ (เว้นช่วงกว้างมาก ไม่แออัด) ──
    SPAWN_GAP_MIN: 580,            // ระยะห่างขั้นต่ำระหว่างวัตถุ
    SPAWN_GAP_MAX: 880,            // ระยะห่างสูงสุด

    // ── ระบบพลังงาน & ซูเปอร์แม่เหล็ก (ดูดสารแม่เหล็กอัตโนมัติครอบคลุมทั้ง 3 เลน) ──
    MAGNET_ENERGY_MAX: 100,
    MAGNET_ENERGY_START: 100,
    MAGNET_DRAIN_PER_SEC: 0.5,
    MAGNET_REFILL_ITEM: 20,
    MAGNET_REFILL_BOOST: 30,
    ATTRACT_RADIUS: 650,           // รัศมีสนามแม่เหล็กกว้างครอบคลุมทุกเลน ดูดติดง่ายสุดๆ!
    ATTRACT_FORCE_SPEED: 38,       // ความเร็วในการดึงดูดสารแม่เหล็กพุ่งเข้าหารถไฟ

    // ── การให้คะแนน & คอมโบ ──
    POINTS_MAGNETIC_ITEM: 20,
    POINTS_TURBO_BOOST: 35,
    POINTS_SUPERCONDUCTOR: 80,
    POINTS_STATION_PERFECT: 150,
    COMBO_TIMEOUT_MS: 4500,
    COMBO_BONUS_STEP: 5,

    // ── โหมดการเล่น & ชีวิต (7 ชีวิต + อมตะ 3.5 วินาที + ฟื้นเลือดได้) ──
    SOLO_LIVES: 7,
    INVINCIBLE_TIME_SEC: 3.5,
    HEAL_EVERY_ITEMS: 6,           // เก็บสารแม่เหล็กครบทุก 6 ชิ้น ฟื้นฟู +1 ชีวิต ❤️
    VERSUS_DURATION: 60,
    STATION_INTERVAL_METERS: 1800,

    // ── เกณฑ์เหรียญรางวัล ──
    MEDAL_GOLD_SCORE: 800,
    MEDAL_SILVER_SCORE: 450,
    MEDAL_BRONZE_SCORE: 200
};
