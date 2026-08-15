/* config.js — พารามิเตอร์เกม Maglev Rush (จูนที่นี่ที่เดียว) · window.GAME_CONFIG */
window.GAME_CONFIG = {
    SLUG: 'maglev-rush',
    TITLE: '🧲 Maglev Rush (รถไฟแม่เหล็กและแรงมหัศจรรย์)',
    DESCRIPTION: 'เกมซิ่งรถไฟแม่เหล็กความเร็วสูง สลับขั้ว N-S สร้างแรงผลักเทอร์โบ ดูดสารแม่เหล็ก และเบรกจอดสถานี',

    // ── ระบบการวิ่งและฟิสิกส์ ──
    TRACK_LANES: 3,             // 3 เลน (ซ้าย=0, กลาง=1, ขวา=2)
    GAME_DURATION: 65,          // วินาทีต่อรอบ
    STATION_INTERVAL_M: 1000,   // ระยะทางต่อ 1 สถานี (เมตร)
    BASE_SPEED_KMH: 140,        // ความเร็วปกติ (กม./ชม.)
    BOOST_SPEED_KMH: 280,       // ความเร็วตอนเทอร์โบแรงผลัก (กม./ชม.)
    MAX_SPEED_KMH: 360,         // ความเร็วสูงสุด

    // ── คะแนนและโบนัส ──
    POINTS_MAGNETIC: 15,        // ดูดเก็บสารแม่เหล็ก
    POINTS_REPEL_BOOST: 25,     // ผ่านเกตแรงผลักสำเร็จ (ขั้วเหมือนกัน)
    POINTS_STATION_STOP: 50,    // โบนัสจอดสถานี Perfect Stop
    PENALTY_NON_MAGNETIC: -10,  // ชนวัตถุที่ไม่ใช่แม่เหล็ก
    PENALTY_OPPOSITE_GATE: -5,  // ผ่านเกตขั้วตรงข้าม (ดูดหน่วงความเร็ว)

    BGM: 'racer',

    // ── ออนไลน์ ──
    ENABLE_ONLINE: true,
    ONLINE_DURATION: 65
};
