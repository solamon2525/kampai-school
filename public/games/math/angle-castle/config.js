/* config.js — ค่ากำหนดตั้งค่าของเกม Angle Castle: ศึกปราสาทมุมองศา */

window.GAME_CONFIG = {
    SLUG: 'angle-castle',
    TITLE: 'Angle Castle (ศึกปราสาทมุมองศา)',
    BGM: 'playful', // เพลงพื้นหลังในระบบ: cheerful/calm/warm/playful/bright/mellow
    
    // ── คุณลักษณะของอัศวินและฟิสิกส์ ──
    PLAYER_SPEED: 4.5,
    PROJECTILE_SPEED: 12,
    MAX_PROJECTILES: 5,
    ANGLE_TOLERANCE: 5, // ความลาดเอียงเผื่อความถูกต้องขององศา (องศา)
    COOLDOWN_MS: 400, // ดีเลย์การยิงต่อครั้ง
    MAX_SHIELDS: 3,
    
    // ── กำหนดชนิดของอาวุธคทา ──
    WANDS: {
        reflector: {
            name: 'คทาสะท้อนดวงดาว',
            desc: 'กระสุนเวทสะท้อนกำแพงกระจกเงาได้สูงสุด 5 ครั้ง',
            icon: '🔮',
            maxBounces: 5,
            color: '#00f0ff'
        },
        splitter: {
            name: 'คทาสามแฉก',
            desc: 'ยิงแยกรังสีออกเป็น 3 ทิศทาง ทำมุมเอียง 45 องศา',
            icon: '🔱',
            maxBounces: 2,
            color: '#ff00ff'
        },
        beam: {
            name: 'คทาเลเซอร์นำทาง',
            desc: 'ลำแสงเลเซอร์ต่อเนื่อง แสดงเส้นทางมุมสะท้อนแบบเรียลไทม์',
            icon: '⚡',
            maxBounces: 4,
            color: '#ffeb3b'
        }
    },

    // ── นิยามช่วงมุมและสีเรืองแสงนีออน ──
    ANGLE_TYPES: {
        ACUTE: {
            id: 'acute',
            name: 'มุมแหลม',
            en: 'Acute Angle',
            min: 1,
            max: 89,
            color: '#00e5ff', // นีออนฟ้า
            desc: 'มุมที่มีขนาดมากกว่า 0° แต่สะกดน้อยกว่า 90°'
        },
        RIGHT: {
            id: 'right',
            name: 'มุมฉาก',
            en: 'Right Angle',
            min: 90,
            max: 90,
            color: '#00e676', // นีออนเขียว
            desc: 'มุมที่มีขนาดเท่ากับ 90° พอดี'
        },
        OBTUSE: {
            id: 'obtuse',
            name: 'มุมป้าน',
            en: 'Obtuse Angle',
            min: 91,
            max: 179,
            color: '#ff4081', // นีออนชมพู
            desc: 'มุมที่มีขนาดมากกว่า 90° แต่สะกดน้อยกว่า 180°'
        },
        STRAIGHT: {
            id: 'straight',
            name: 'มุมตรง',
            en: 'Straight Angle',
            min: 180,
            max: 180,
            color: '#e040fb', // นีออนม่วง
            desc: 'มุมที่มีขนาดเท่ากับ 180° พอดี'
        },
        REFLEX: {
            id: 'reflex',
            name: 'มุมกลับ',
            en: 'Reflex Angle',
            min: 181,
            max: 359,
            color: '#ff9100', // นีออนส้ม
            desc: 'มุมที่มีขนาดมากกว่า 180° แต่สะกดน้อยกว่า 360°'
        }
    },

    // ── กำหนดแต้มและตัวคูณโหมดออนไลน์ ──
    POINTS: {
        CORRECT_HIT: 10,
        PERFECT_ANGLE: 20, // ยิงตรงเป้าพิกัดองศาพอดีโดยไม่มีความคลาดเคลื่อน
        BOUNCE_BONUS: 5,   // แต้มพิเศษชิ่งกระจกโดนศัตรู
        COMBO_MAX: 5
    },

    ENABLE_ONLINE: true,
    ONLINE_DURATION: 75
};
