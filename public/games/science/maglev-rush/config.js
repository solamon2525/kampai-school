/* config.js — Maglev Rush (รถไฟแม่เหล็ก) พารามิเตอร์ระบบเกม
   แชร์ global scope · โหลดก่อน data.js และ game.js */
window.GAME_CONFIG = {
    SLUG: 'maglev-rush',
    TITLE: 'Maglev Rush',
    SUBTITLE: 'รถไฟแม่เหล็กความเร็วสูง — แรงและการเคลื่อนที่ด้วยสนามแม่เหล็ก',
    SUBJECT: 'วิทยาศาสตร์',
    BGM: 'racer',

    // ── ระบบราง & 3D Perspective (ปรับให้จอกว้าง โล่ง สบายตา มองเห็นง่าย) ──
    LANES: [-1, 0, 1],             // -1: เลนซ้าย, 0: เลนกลาง, 1: เลนขวา
    LANE_WIDTH_WORLD: 220,         // ขยายระยะห่างระหว่างเลนให้กว้างขึ้น ชัดเจน
    TRACK_DEPTH: 2200,             // ระยะความลึกของรางข้างหน้า (Z-axis)
    FOV: 360,                      // Field of view กว้างขึ้น มุมมองเปิดโล่ง
    CAMERA_HEIGHT: 155,            // ความสูงกล้องเหนือราง
    CAMERA_TILT: 0.08,             // มุมก้มของกล้อง

    // ── ความเร็ว & แรงขับเคลื่อน (ปรับให้เล่นง่าย สบาย ไม่เร็วเกินไปสำหรับเด็ก) ──
    SPEED_CRUISE_KMH: 160,         // ความเร็วลอยตัวปกติ (นุ่มนวล มองทัน)
    SPEED_MAX_KMH: 320,            // ความเร็วสูงสุดเมื่อติดเทอร์โบผลักแม่เหล็ก
    SPEED_MIN_KMH: 90,             // ความเร็วต่ำสุดเมื่อชนสิ่งกีดขวาง
    TURBO_BOOST_KMH: 40,           // ความเร็วเพิ่มขึ้นเมื่อขั้วตรงกับขดลวด (N-N / S-S)
    ATTRACT_DRAG_KMH: 15,          // ความเร็วลดลงเล็กน้อยเมื่อขั้วต่างกับขดลวด (N-S)
    CRUISE_RECOVERY_RATE: 0.5,     // อัตราการคืนความเร็วกลับสู่ Cruise Speed ต่อวินาที
    SPEED_STEP_MULTIPLIER: 1.15,   // ตัวคูณความเร็วจริงในการเลื่อนราง (ปรับช้าลง ให้มีเวลาคิด)

    // ── ระยะห่างการเกิดวัตถุ (เว้นช่วงให้อ่านป้ายและตัดสินใจทัน) ──
    SPAWN_GAP_MIN: 320,            // ระยะห่างขั้นต่ำระหว่างวัตถุ
    SPAWN_GAP_MAX: 480,            // ระยะห่างสูงสุด

    // ── ระบบพลังงาน & แรงดูดแม่เหล็ก (ดูดติดง่ายสะใจ) ──
    MAGNET_ENERGY_MAX: 100,
    MAGNET_ENERGY_START: 100,
    MAGNET_DRAIN_PER_SEC: 1.0,
    MAGNET_REFILL_ITEM: 15,
    MAGNET_REFILL_BOOST: 25,
    ATTRACT_RADIUS: 360,           // รัศมีสนามแม่เหล็กดูดสารแม่เหล็กเข้าหาตัว (กว้างข้ามเลน)
    ATTRACT_FORCE_SPEED: 22,       // ความเร็วในการดึงดูดสารแม่เหล็กเข้าหารถไฟ

    // ── การให้คะแนน & คอมโบ ──
    POINTS_MAGNETIC_ITEM: 20,
    POINTS_TURBO_BOOST: 35,
    POINTS_SUPERCONDUCTOR: 80,
    POINTS_STATION_PERFECT: 150,
    COMBO_TIMEOUT_MS: 3500,
    COMBO_BONUS_STEP: 5,           // ทุก 5 คอมโบเพิ่มตัวคูณคะแนน +0.5x (สูงสุด 3.0x)

    // ── โหมดการเล่น & ชีวิต ──
    SOLO_LIVES: 5,                 // เพิ่มเป็น 5 ชีวิตในโหมดผจญภัย ให้เล่นได้นานและสนุก
    INVINCIBLE_TIME_SEC: 2.5,      // เวลาเป็นอมตะหลังชนสิ่งกีดขวาง (2.5 วินาที)
    VERSUS_DURATION: 60,           // วินาทีในโหมดแข่ง 2 คน (Hot-seat / Online)
    STATION_INTERVAL_METERS: 2000, // ระยะทางระหว่างสถานี (เมตร)

    // ── เกณฑ์เหรียญรางวัล ──
    MEDAL_GOLD_SCORE: 1000,
    MEDAL_SILVER_SCORE: 600,
    MEDAL_BRONZE_SCORE: 300
};
