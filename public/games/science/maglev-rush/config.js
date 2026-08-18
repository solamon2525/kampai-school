/* config.js — Maglev Rush (รถไฟแม่เหล็ก) พารามิเตอร์ระบบเกม
   แชร์ global scope · โหลดก่อน data.js และ game.js */
window.GAME_CONFIG = {
    SLUG: 'maglev-rush',
    TITLE: 'Maglev Rush',
    SUBTITLE: 'รถไฟแม่เหล็กความเร็วสูง — แรงและการเคลื่อนที่ด้วยสนามแม่เหล็ก',
    SUBJECT: 'วิทยาศาสตร์',
    BGM: 'racer',

    // ── ระบบราง & 3D Perspective ──
    LANES: [-1, 0, 1],             // -1: เลนซ้าย, 0: เลนกลาง, 1: เลนขวา
    LANE_WIDTH_WORLD: 140,         // ระยะห่างระหว่างเลนในพิกัดโลก
    TRACK_DEPTH: 1800,             // ระยะความลึกของรางข้างหน้า (Z-axis)
    FOV: 280,                      // Field of view สำหรับ perspective projection
    CAMERA_HEIGHT: 170,            // ความสูงกล้องเหนือราง
    CAMERA_TILT: 0.12,             // มุมก้มของกล้อง

    // ── ความเร็ว & แรงขับเคลื่อน (km/h) ──
    SPEED_CRUISE_KMH: 220,         // ความเร็วลอยตัวปกติ
    SPEED_MAX_KMH: 480,            // ความเร็วสูงสุดเมื่อติดเทอร์โบผลักแม่เหล็ก
    SPEED_MIN_KMH: 100,            // ความเร็วต่ำสุดเมื่อชนสิ่งกีดขวาง
    TURBO_BOOST_KMH: 55,           // ความเร็วเพิ่มขึ้นทันทีเมื่อขั้วตรงกับขดลวด (N-N / S-S)
    ATTRACT_DRAG_KMH: 25,          // ความเร็วลดลงเมื่อขั้วต่างกับขดลวด (N-S แรงดูดฉุด)
    CRUISE_RECOVERY_RATE: 0.8,     // อัตราการคืนความเร็วกลับสู่ Cruise Speed ต่อวินาที

    // ── ระบบพลังงานแม่เหล็ก ──
    MAGNET_ENERGY_MAX: 100,
    MAGNET_ENERGY_START: 100,
    MAGNET_DRAIN_PER_SEC: 1.5,
    MAGNET_REFILL_ITEM: 12,
    MAGNET_REFILL_BOOST: 20,
    ATTRACT_RADIUS: 240,           // รัศมีสนามแม่เหล็กดูดสารแม่เหล็กเข้าหาตัว (World units)
    ATTRACT_FORCE_SPEED: 18,       // ความเร็วในการดึงดูดสารแม่เหล็กเข้าหารถไฟ

    // ── การให้คะแนน & คอมโบ ──
    POINTS_MAGNETIC_ITEM: 20,
    POINTS_TURBO_BOOST: 35,
    POINTS_SUPERCONDUCTOR: 80,
    POINTS_STATION_PERFECT: 150,
    COMBO_TIMEOUT_MS: 3000,
    COMBO_BONUS_STEP: 5,           // ทุก 5 คอมโบเพิ่มตัวคูณคะแนน +0.5x (สูงสุด 3.0x)

    // ── โหมดการเล่น ──
    SOLO_LIVES: 3,                 // ชีวิตในโหมดผจญภัย
    VERSUS_DURATION: 60,           // วินาทีในโหมดแข่ง 2 คน (Hot-seat / Online)
    STATION_INTERVAL_METERS: 2500, // ระยะทางระหว่างสถานี (เมตร)

    // ── เกณฑ์เหรียญรางวัล ──
    MEDAL_GOLD_SCORE: 1200,
    MEDAL_SILVER_SCORE: 750,
    MEDAL_BRONZE_SCORE: 350
};
