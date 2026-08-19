/* config.js — Maglev Rush (รถไฟแม่เหล็ก) พารามิเตอร์ระบบเกม
   แชร์ global scope · โหลดก่อน data.js และ game.js
   ระดับประถมศึกษา (ป.1 - ป.6) — เล่นง่ายมาก ไม่ตาย ไม่หัวร้อน ดูดสารแม่เหล็กอัตโนมัติ สนุกและได้ความรู้ */
window.GAME_CONFIG = {
    SLUG: 'maglev-rush',
    TITLE: 'Maglev Rush',
    SUBTITLE: 'รถไฟแม่เหล็กหรรษา — สนุกกับแรงแม่เหล็กสำหรับระดับประถม',
    SUBJECT: 'วิทยาศาสตร์',
    BGM: 'cheerful',

    // ── ระบบราง & 3D Perspective (ขยายเต็มหน้าจอ มองเห็นง่าย สบายตา) ──
    LANES: [-1, 0, 1],             // -1: เลนซ้าย, 0: เลนกลาง, 1: เลนขวา
    LANE_WIDTH_WORLD: 280,         // ขยายระยะห่างระหว่างเลนให้กว้างเต็มจอ
    TRACK_DEPTH: 2600,             // ระยะความลึกของรางข้างหน้า (Z-axis)
    FOV: 420,                      // Field of view กว้างพิเศษ มุมมองเปิดโล่ง
    CAMERA_HEIGHT: 150,            // ความสูงกล้องเหนือราง
    CAMERA_TILT: 0.06,             // มุมก้มของกล้อง

    // ── ความเร็ว & แรงขับเคลื่อน (ช้า นุ่มนวล ปลอดภัย เหมาะกับเด็กประถม) ──
    SPEED_CRUISE_KMH: 70,          // ความเร็วปกติ ช้าสบายๆ เพลิดเพลิน
    SPEED_MAX_KMH: 150,            // ความเร็วสูงสุดตอนเทอร์โบสายรุ้ง
    SPEED_MIN_KMH: 50,             // ความเร็วต่ำสุด
    TURBO_BOOST_KMH: 25,           // ความเร็วเพิ่มขึ้นเมื่อขั้วตรงกับขดลวด (N-N / S-S)
    ATTRACT_DRAG_KMH: 0,           // ไม่ลดความเร็วเมื่อขั้วต่าง (ไม่ลงโทษเด็ก)
    CRUISE_RECOVERY_RATE: 0.2,     // อัตราการคืนความเร็วกลับสู่ Cruise Speed
    SPEED_STEP_MULTIPLIER: 0.35,   // สปีดช้าพิเศษ มีเวลาดูและอ่าน 12-15 วินาที!

    // ── ระยะห่างการเกิดวัตถุ (เว้นช่วงกว้าง โล่ง ไม่แออัด) ──
    SPAWN_GAP_MIN: 650,            // ระยะห่างขั้นต่ำระหว่างวัตถุ
    SPAWN_GAP_MAX: 950,            // ระยะห่างสูงสุด

    // ── ระบบซูเปอร์แม่เหล็ก (ดูดสารแม่เหล็กอัตโนมัติทั้ง 3 เลน) ──
    MAGNET_ENERGY_MAX: 100,
    MAGNET_ENERGY_START: 100,
    MAGNET_DRAIN_PER_SEC: 0,       // พลังงานไม่มีวันหมด เล่นได้ต่อเนื่อง
    MAGNET_REFILL_ITEM: 20,
    MAGNET_REFILL_BOOST: 30,
    ATTRACT_RADIUS: 800,           // รัศมีสนามแม่เหล็กกว้างคลุมทุกเลน ดูดติดง่าย 100%
    ATTRACT_FORCE_SPEED: 42,       // ความเร็วในการดึงดูดสารแม่เหล็กพุ่งเข้าหารถไฟ

    // ── การให้คะแนน & คอมโบ ──
    POINTS_MAGNETIC_ITEM: 25,
    POINTS_TURBO_BOOST: 50,
    POINTS_SUPERCONDUCTOR: 100,
    POINTS_STATION_PERFECT: 150,
    COMBO_TIMEOUT_MS: 6000,        // เวลารักษาคอมโบนาน 6 วินาที
    COMBO_BONUS_STEP: 3,           // ทุก 3 คอมโบเพิ่มตัวคูณคะแนน +0.5x

    // ── โหมดการเล่น (ระดับประถม: ไม่มี Game Over สะสมคะแนนและดาวอย่างมีความสุข) ──
    TOTAL_STATIONS_ADVENTURE: 3,   // วิ่งผ่าน 3 สถานีเพื่อจบการผจญภัยรับ 3 ดาว ⭐⭐⭐
    STATION_INTERVAL_METERS: 1200, // ระยะทางระหว่างสถานี (สั้นลง ถึงสถานีไว)
    VERSUS_DURATION: 60,           // วินาทีในโหมดแข่ง 2 คน

    // ── เกณฑ์เหรียญรางวัล ──
    MEDAL_GOLD_SCORE: 500,
    MEDAL_SILVER_SCORE: 300,
    MEDAL_BRONZE_SCORE: 150
};
