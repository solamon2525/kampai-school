/* data.js — คลังข้อมูลวิทยาศาสตร์สำหรับเกม Sci-Lab Defender AR · window.GAME_DATA */
window.GAME_DATA = {
    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 1: 🧪 เคมีและสถานะของสาร (Matter & Chemical Lab)
    // ═══════════════════════════════════════════════════════════════════════
    stage1: {
        title: '🧪 ฐานที่ 1: นักคัดแยกสสารในห้องแล็บ',
        description: 'เลื่อนมือถือบีกเกอร์รับสสารให้ตรงกับสถานะที่กำหนด',
        goals: [
            {
                type: 'liquid',
                name: 'ของเหลว (Liquid)',
                icon: '💧',
                hint: 'ไหลตามภาชนะ ปริมาตรคงที่ เช่น น้ำ นม น้ำผลไม้',
                targetCount: 4,
                validItems: ['water', 'milk', 'oil', 'juice', 'honey']
            },
            {
                type: 'solid',
                name: 'ของแข็ง (Solid)',
                icon: '🧊',
                hint: 'รูปร่างและปริมาตรคงที่ อนุภาคเรียงชิดกัน เช่น น้ำแข็ง ก้อนหิน แท่งเหล็ก',
                targetCount: 4,
                validItems: ['ice', 'rock', 'iron', 'gold', 'salt']
            },
            {
                type: 'gas',
                name: 'แก๊ส (Gas)',
                icon: '💨',
                hint: 'ฟุ้งกระจายเต็มภาชนะ รูปร่างไม่คงที่ เช่น ไอน้ำ ออกซิเจน ฮีเลียม',
                targetCount: 4,
                validItems: ['steam', 'oxygen', 'helium', 'co2', 'wind']
            }
        ],
        items: [
            // ของแข็ง (Solid)
            { id: 'ice', name: 'น้ำแข็ง', icon: '🧊', state: 'solid', color: '#60a5fa' },
            { id: 'rock', name: 'ก้อนหิน', icon: '🪨', state: 'solid', color: '#94a3b8' },
            { id: 'iron', name: 'แท่งเหล็ก', icon: '🔩', state: 'solid', color: '#cbd5e1' },
            { id: 'gold', name: 'ทองคำ', icon: '🪙', state: 'solid', color: '#facc15' },
            { id: 'salt', name: 'เกลือแกง', icon: '🧂', state: 'solid', color: '#f8fafc' },

            // ของเหลว (Liquid)
            { id: 'water', name: 'น้ำบริสุทธิ์', icon: '💧', state: 'liquid', color: '#38bdf8' },
            { id: 'milk', name: 'นมสด', icon: '🥛', state: 'liquid', color: '#f1f5f9' },
            { id: 'oil', name: 'น้ำมันพืช', icon: '🛢️', state: 'liquid', color: '#fbbf24' },
            { id: 'juice', name: 'น้ำส้ม', icon: '🧃', state: 'liquid', color: '#fb923c' },
            { id: 'honey', name: 'น้ำผึ้ง', icon: '🍯', state: 'liquid', color: '#f59e0b' },

            // แก๊ส (Gas)
            { id: 'steam', name: 'ไอน้ำ', icon: '💨', state: 'gas', color: '#e2e8f0' },
            { id: 'oxygen', name: 'ออกซิเจน', icon: '🫧', state: 'gas', color: '#67e8f9' },
            { id: 'helium', name: 'ฮีเลียม', icon: '🎈', state: 'gas', color: '#f472b6' },
            { id: 'co2', name: 'คาร์บอนฯ', icon: '🌫️', state: 'gas', color: '#a1a1aa' },
            { id: 'wind', name: 'ลมร้อน', icon: '🌬️', state: 'gas', color: '#f87171' },

            // สิ่งกีดขวาง/อันตราย (Hazard)
            { id: 'poison', name: 'สารพิษ!', icon: '☠️', state: 'hazard', color: '#a855f7', penalty: true },
            { id: 'rad', name: 'กัมมันตรังสี!', icon: '☢️', state: 'hazard', color: '#22c55e', penalty: true }
        ]
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 2: ⚡ แสงและพลังงานสะอาด (Optics & Energy Lab)
    // ═══════════════════════════════════════════════════════════════════════
    stage2: {
        title: '⚡ ฐานที่ 2: ยอดนักสะท้อนแสงพลังงาน',
        description: 'ใช้สองมือเป็นกระจกเงาสะท้อนลำแสงเลเซอร์เข้าสู่แท่นชาร์จโซลาร์เซลล์',
        levels: [
            {
                targetColor: '#38bdf8',
                targetName: 'แท่นชาร์จโซลาร์เซลล์พลังน้ำ (สีฟ้า)',
                requiredHits: 4,
                sourcePos: { x: 0.1, y: 0.2 },
                targetPos: { x: 0.9, y: 0.25 }
            },
            {
                targetColor: '#fbbf24',
                targetName: 'แผงโซลาร์เซลล์แสงอาทิตย์ (สีทอง)',
                requiredHits: 4,
                sourcePos: { x: 0.12, y: 0.75 },
                targetPos: { x: 0.88, y: 0.22 }
            },
            {
                targetColor: '#4ade80',
                targetName: 'ปริซึมพลังงานลมชีวภาพ (สีเขียว)',
                requiredHits: 5,
                sourcePos: { x: 0.85, y: 0.8 },
                targetPos: { x: 0.15, y: 0.25 }
            }
        ],
        facts: [
            '💡 แสงเดินทางเป็นเส้นตรงในตัวกลางโปร่งใสชนิดเดียวกัน',
            '🪞 มุมตกกระทบเท่ากับมุมสะท้อนเสมอ ตามกฎการสะท้อนของแสง',
            '🌈 เมื่อแสงขาวผ่านปริซึม จะกระจายออกเป็นสเปกตรัม 7 สี',
            '☀️ โซลาร์เซลล์เปลี่ยนพลังงานแสงอาทิตย์เป็นพลังงานไฟฟ้าสะอาด'
        ]
    },

    // ═══════════════════════════════════════════════════════════════════════
    // STAGE 3: 🪐 อวกาศและดาราศาสตร์ (Space & Meteor Buster)
    // ═══════════════════════════════════════════════════════════════════════
    stage3: {
        title: '🪐 ฐานที่ 3: ผู้พิทักษ์โลกจากอุกกาบาต',
        description: 'ใช้นิ้วชี้จิ้มระเบิดอุกกาบาตและขยะอวกาศเพื่อสะสมแต้มคอมโบ Fever!',
        targets: [
            { id: 'meteor', name: 'อุกกาบาตหิน', icon: '☄️', points: 10, radius: 0.065, speed: 1.0, isThreat: true },
            { id: 'debris', name: 'ขยะอวกาศ', icon: '🛰️', points: 15, radius: 0.055, speed: 1.2, isThreat: true },
            { id: 'comet', name: 'เศษดาวหาง', icon: '❄️', points: 20, radius: 0.06, speed: 1.4, isThreat: true },
            { id: 'alien', name: 'ไวรัสอวกาศ', icon: '👾', points: 25, radius: 0.06, speed: 1.3, isThreat: true },
            
            // ดาวเคราะห์โบนัส (แตะได้คะแนนพิเศษ)
            { id: 'earth', name: 'ดาวโลก', icon: '🌍', points: 50, radius: 0.08, speed: 0.7, isBonus: true },
            { id: 'saturn', name: 'ดาวเสาร์', icon: '🪐', points: 50, radius: 0.085, speed: 0.6, isBonus: true },
            { id: 'mars', name: 'ดาวอังคาร', icon: '🔴', points: 40, radius: 0.07, speed: 0.8, isBonus: true },
            { id: 'star', name: 'ดาวนำโชค', icon: '⭐', points: 30, radius: 0.06, speed: 1.1, isBonus: true }
        ],
        knowledge: [
            '🪐 ระบบสุริยะมีดาวเคราะห์ 8 ดวง โดยมีดวงอาทิตย์เป็นศูนย์กลาง',
            '🌍 โลกเป็นดาวเคราะห์ดวงเดียวที่พบสิ่งมีชีวิตและน้ำในสถานะของเหลว',
            '☄️ อุกกาบาตที่เผาไหม้ไม่หมดในชั้นบรรยากาศและตกลงสู่พื้นผิวเรียกว่า ลูกอุกกาบาต',
            '⭐ ดวงอาทิตย์เป็นดาวฤกษ์เพียงดวงเดียวในระบบสุริยะของเรา'
        ]
    }
};
