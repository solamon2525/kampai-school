/* data.js — Sci-Lab Defender (AR วันวิทย์) ข้อมูลบทเรียนและองค์ประกอบวิทยาศาสตร์
   แชร์ global scope · โหลดหลัง config.js */
window.GAME_DATA = {
    // ── ข้อมูล 3 ฐานกิจกรรมวันวิทยาศาสตร์ ──
    STAGES: [
        {
            id: 1,
            title: 'ฐานที่ 1: สสารและเคมี',
            subtitle: 'Chemistry & States of Matter',
            icon: '🧪',
            color: '#38bdf8',
            desc: 'เลื่อนมือถือบีกเกอร์รับสสารให้ถูกต้องตามสถานะที่กำหนด (ของแข็ง/ของเหลว/แก๊ส) และระวังสารพิษ!',
            speech: 'ฐานที่ 1 สสารและเคมี เลื่อนบีกเกอร์รับสสารตามสถานะที่กำหนด'
        },
        {
            id: 2,
            title: 'ฐานที่ 2: แสงและพลังงาน',
            subtitle: 'Optics & Solar Energy',
            icon: '⚡',
            color: '#facc15',
            desc: 'ใช้มือทั้งสองข้างเป็นโล่กระจกสะท้อนลำแสงเลเซอร์เข้าสู่แท่นชาร์จโซลาร์เซลล์ด้านข้าง!',
            speech: 'ฐานที่ 2 แสงและพลังงาน ใช้มือสะท้อนลำแสงเลเซอร์เข้าสู่แท่นชาร์จโซลาร์เซลล์'
        },
        {
            id: 3,
            title: 'ฐานที่ 3: อวกาศและดาราศาสตร์',
            subtitle: 'Space Defense Fever Time',
            icon: '🚀',
            color: '#ec4899',
            desc: 'ใช้นิ้วชี้ทั้งสองข้างจิ้มระเบิดอุกกาบาตและขยะอวกาศที่พุ่งเข้ามาอย่างรวดเร็วในโหมด Fever Time!',
            speech: 'ฐานที่ 3 อวกาศและดาราศาสตร์ ใช้นิ้วชี้จิ้มทำลายอุกกาบาตและสะเก็ดดาว'
        }
    ],

    // ── ฐานที่ 1: สสารและเคมี — ชุดภารกิจแบ่งตามช่วงเวลา ──
    STAGE1_WAVES: [
        {
            waveId: 1,
            targetState: 'liquid',
            targetName: 'ของเหลว (Liquid)',
            taskPrompt: '💧 เก็บเฉพาะ "ของเหลว (Liquid)"!',
            speechPrompt: 'ภารกิจที่หนึ่ง เก็บเฉพาะของเหลว',
            items: [
                { name: 'น้ำบริสุทธิ์', sub: 'H₂O', state: 'liquid', icon: '💧', color: '#38bdf8' },
                { name: 'น้ำผลไม้', sub: 'Juice', state: 'liquid', icon: '🧃', color: '#fb923c' },
                { name: 'นมสด', sub: 'Milk', state: 'liquid', icon: '🥛', color: '#f8fafc' },
                { name: 'แอลกอฮอล์', sub: 'Ethanol', state: 'liquid', icon: '🧴', color: '#67e8f9' },
                { name: 'น้ำมันพืช', sub: 'Vegetable Oil', state: 'liquid', icon: '🫒', color: '#facc15' },
                { name: 'น้ำผึ้ง', sub: 'Honey', state: 'liquid', icon: '🍯', color: '#eab308' },
                { name: 'ก้อนน้ำแข็ง', sub: 'Solid Ice', state: 'solid', icon: '🧊', color: '#a5f3fc' },
                { name: 'ก้อนหิน', sub: 'Stone', state: 'solid', icon: '🪨', color: '#94a3b8' },
                { name: 'แก๊สออกซิเจน', sub: 'Oxygen', state: 'gas', icon: '💨', color: '#a7f3d0' },
                { name: 'สารเคมีมีพิษ', sub: 'Toxic Waste', state: 'hazard', icon: '☣️', color: '#ef4444', isHazard: true }
            ]
        },
        {
            waveId: 2,
            targetState: 'solid',
            targetName: 'ของแข็ง (Solid)',
            taskPrompt: '🧊 เก็บเฉพาะ "ของแข็ง (Solid)"!',
            speechPrompt: 'ภารกิจที่สอง เปลี่ยนเป็นเก็บเฉพาะของแข็ง',
            items: [
                { name: 'ก้อนน้ำแข็ง', sub: 'Ice', state: 'solid', icon: '🧊', color: '#67e8f9' },
                { name: 'หินแร่ควอตซ์', sub: 'Quartz', state: 'solid', icon: '💎', color: '#e0e7ff' },
                { name: 'เม็ดเกลือ', sub: 'Salt Crystal', state: 'solid', icon: '🧂', color: '#f1f5f9' },
                { name: 'แท่งเหล็ก', sub: 'Iron Bar', state: 'solid', icon: '🔩', color: '#94a3b8' },
                { name: 'แร่ทองคำ', sub: 'Gold Mineral', state: 'solid', icon: '🪙', color: '#fbbf24' },
                { name: 'ถ่านหิน', sub: 'Coal', state: 'solid', icon: '🪨', color: '#64748b' },
                { name: 'น้ำส้มคั้น', sub: 'Orange Juice', state: 'liquid', icon: '🧃', color: '#fb923c' },
                { name: 'น้ำมันพืช', sub: 'Cooking Oil', state: 'liquid', icon: '🫒', color: '#facc15' },
                { name: 'แก๊สฮีเลียม', sub: 'Helium Gas', state: 'gas', icon: '🎈', color: '#f43f5e' },
                { name: 'กรดเข้มข้นอันตราย', sub: 'Danger Acid', state: 'hazard', icon: '🧪', color: '#dc2626', isHazard: true }
            ]
        },
        {
            waveId: 3,
            targetState: 'gas',
            targetName: 'แก๊ส (Gas)',
            taskPrompt: '💨 เก็บเฉพาะ "แก๊ส (Gas)"!',
            speechPrompt: 'ภารกิจที่สาม เปลี่ยนเป็นเก็บเฉพาะแก๊ส',
            items: [
                { name: 'แก๊สออกซิเจน', sub: 'Oxygen (O₂)', state: 'gas', icon: '💨', color: '#34d399' },
                { name: 'คาร์บอนไดออกไซด์', sub: 'CO₂ Gas', state: 'gas', icon: '🌫️', color: '#a3e635' },
                { name: 'ไอน้ำเดือด', sub: 'Water Vapor', state: 'gas', icon: '♨️', color: '#e2e8f0' },
                { name: 'แก๊สฮีเลียม', sub: 'Helium (He)', state: 'gas', icon: '🎈', color: '#ec4899' },
                { name: 'แก๊สไนโตรเจน', sub: 'Nitrogen (N₂)', state: 'gas', icon: '🌬️', color: '#60a5fa' },
                { name: 'ก้อนหินแร่', sub: 'Rock Solid', state: 'solid', icon: '🪨', color: '#94a3b8' },
                { name: 'น้ำดื่มบริสุทธิ์', sub: 'Liquid Water', state: 'liquid', icon: '💧', color: '#38bdf8' },
                { name: 'กากกัมมันตรังสี', sub: 'Radioactive', state: 'hazard', icon: '☣️', color: '#ef4444', isHazard: true }
            ]
        }
    ],

    // ── ฐานที่ 2: แสงและพลังงาน — ลำแสงเลเซอร์และโฟตอน ──
    STAGE2_BEAMS: [
        { name: 'ลำแสงโซลาร์', sub: 'Solar Light Beam', color: '#facc15', glow: '#fef08a', icon: '☀️', power: 20 },
        { name: 'เลเซอร์โฟตอนเขียว', sub: 'Green Photon', color: '#22c55e', glow: '#86efac', icon: '🟢', power: 25 },
        { name: 'พลาสมาเลเซอร์ฟ้า', sub: 'Plasma Laser', color: '#06b6d4', glow: '#67e8f9', icon: '⚡', power: 30 },
        { name: 'รังสีอัลตราไวโอเลต', sub: 'UV Light Beam', color: '#a855f7', glow: '#d8b4fe', icon: '🟣', power: 35 }
    ],

    // ── ฐานที่ 3: อวกาศและดาราศาสตร์ — วัตถุอวกาศที่ต้องจิ้มระเบิด ──
    STAGE3_TARGETS: [
        { name: 'อุกกาบาตเพลิง', sub: 'Meteorite', type: 'meteor', icon: '☄️', points: 25, radius: 46, color: '#f97316' },
        { name: 'สะเก็ดดาวหาง', sub: 'Comet Fragment', type: 'comet', icon: '🌠', points: 30, radius: 42, color: '#06b6d4' },
        { name: 'หินอุกกาบาต', sub: 'Asteroid Rock', type: 'asteroid', icon: '🪨', points: 20, radius: 40, color: '#a8a29e' },
        { name: 'ขยะอวกาศ', sub: 'Space Debris', type: 'debris', icon: '🛰️', points: 20, radius: 38, color: '#94a3b8' },
        { name: '⭐ ซูเปอร์โนวาโบนัส', sub: 'Supernova Star', type: 'star', icon: '🌟', points: 60, radius: 52, color: '#fbbf24', isBonus: true },
        { name: '💎 คริสตัลอวกาศ', sub: 'Cosmic Crystal', type: 'crystal', icon: '💎', points: 45, radius: 44, color: '#c084fc', isBonus: true }
    ]
};
