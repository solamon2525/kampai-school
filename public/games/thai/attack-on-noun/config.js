/* config.js — พารามิเตอร์เกม ผู้พิทักษ์ลักษณะนาม */
window.GAME_CONFIG = {
    SLUG: 'attack-on-noun',
    TITLE: 'ผู้พิทักษ์ลักษณะนาม',
    GAME_DURATION: 120,     // เวลาเล่นสูงสุด (วินาที)
    LIVES_START: 5,         // จำนวนหัวใจเริ่มต้น
    INITIAL_AMMO: 20,       // จำนวนกระสุนเริ่มต้น
    BGM_PRESET: 'battle',    // เสียงดนตรีพื้นหลัง
    DIFFICULTY: {
        easy:   { duration: 150, lives: 7, ammo: 30, titanSpeed: 0.7, maxEnemies: 5,  waveCount: 5,  distractors: 1 },
        medium: { duration: 120, lives: 5, ammo: 20, titanSpeed: 1.0, maxEnemies: 8,  waveCount: 8,  distractors: 2 },
        hard:   { duration: 90,  lives: 3, ammo: 15, titanSpeed: 1.3, maxEnemies: 12, waveCount: 10, distractors: 3 }
    },
    COMBO_FEVER_THRESHOLD: 5,
    FEVER_DURATION: 10,
    FEVER_MULTIPLIER: 2,
    WAVE_TITANS: [3, 4, 5, 5, 6, 6, 7, 8, 8, 10],
    POWERUP_CHANCE: 0.15,
    SCORE: {
        normal: 100,
        abnormal: 150,
        colossal: 300,
        bird: 200,
        beast: 200,
        armored: 500,
        king: 1000,
        wrong: -20
    },

    // NEW: Campaign Stages (10 stages)
    STAGES: [
        { id: 1, name: "ด่านที่ 1: ทุ่งหญ้าเริ่มต้น", desc: "เรียนรู้ลักษณะนามหมวดสัตว์", category: "สัตว์", waves: 3, boss: null, dialogue: ["ผู้บังคับการ: ยินดีต้อนรับสู่นักพิทักษ์ลักษณะนาม!", "ไททันลักษณะนามกำลังบุกรุกทุ่งหญ้า! เล็งยิงคำตอบที่ถูกต้องเพื่อกำจัดพวกมัน!"] },
        { id: 2, name: "ด่านที่ 2: หมู่บ้านริมน้ำ", desc: "ทดสอบลักษณะนามหมวดของใช้", category: "ของใช้", waves: 3, boss: "normal", dialogue: ["ผู้บังคับการ: ขอบใจมาก! ตอนนี้หมู่บ้านริมน้ำกำลังต้องการความช่วยเหลือ", "กำจัดไททันและปกป้องของใช้ในหมู่บ้าน!"] },
        { id: 3, name: "ด่านที่ 3: ตลาดเก่า", desc: "ลักษณะนามหมวดอาหารและเสื้อผ้า", category: "อาหาร", waves: 4, boss: "abnormal", dialogue: ["ผู้บังคับการ: ไททันวิ่งเร็ว Abnormal กำลังบุกตลาด!", "ระวังตัวด้วย! ปลดล็อกชุดนักรบกำแพงเมื่อผ่านด่านนี้!"] },
        { id: 4, name: "ด่านที่ 4: ป่าลึกลับ", desc: "ลักษณะนามหมวดธรรมชาติ", category: "ธรรมชาติ", waves: 4, boss: "beast", dialogue: ["ผู้บังคับการ: ป่าแห่งนี้มีไททันอสูร Beast Titan ซ่อนอยู่!", "มันสามารถกระโดดทับได้ ระวังตัวด้วย!"] },
        { id: 5, name: "ด่านที่ 5: ถนนสายหลัก", desc: "ลักษณะนามหมวดยานพาหนะ", category: "ยานพาหนะ", waves: 5, boss: "armored", dialogue: ["ผู้บังคับการ: ขุนพลเกราะ Armored Titan ขวางทางบนถนน!", "ทำลายเกราะของมันด้วยการตอบคำถาม 2 ข้อ!"] },
        { id: 6, name: "ด่านที่ 6: โรงเรียนร้าง", desc: "ลักษณะนามหมวดสิ่งก่อสร้าง", category: "สิ่งก่อสร้าง", waves: 5, boss: "bird", dialogue: ["ผู้บังคับการ: ไททันวิหค Bird Titan บินอยู่เหนือโรงเรียนร้าง!", "คอยหลบกระสุนของมันและยิงโต้กลับ!"] },
        { id: 7, name: "ด่านที่ 7: ลานดนตรี", desc: "ลักษณะนามหมวดดนตรีและอาวุธ", category: "ดนตรี", waves: 5, boss: "colossal", dialogue: ["ผู้บังคับการ: ไททันมหึมา Colossal Titan ปรากฏตัว!", "มันมีความอึดสูง ต้องยิงทำลาย 2 รอบ!"] },
        { id: 8, name: "ด่านที่ 8: ชายแดนกำแพง", desc: "ลักษณะนามหมวดคำพิเศษ", category: "คำพิเศษ", waves: 6, boss: "abnormal", dialogue: ["ผู้บังคับการ: คำลักษณะนามพิเศษที่ยากขึ้นกำลังมา!", "ตั้งสติและเลือกคำตอบให้ถูกต้อง!"] },
        { id: 9, name: "ด่านที่ 9: เมืองหลวง", desc: "ทบทวนคำลักษณะนามทุกหมวด", category: null, waves: 6, boss: "armored", dialogue: ["ผู้บังคับการ: ศัตรูบุกเข้าถึงเมืองหลวงแล้ว!", "นี่คือการรบครั้งใหญ่ก่อนเผชิญหน้ากับราชาไททัน!"] },
        { id: 10, name: "ด่านที่ 10: ยอดกำแพงสุดท้าย", desc: "ศึกตัดสินกับราชาไททัน King Titan", category: null, waves: 7, boss: "king", dialogue: ["ผู้บังคับการ: ราชาไททัน King Titan อยู่ตรงหน้าเราแล้ว!", "จงใช้ความรู้ลักษณะนามทั้งหมดเพื่อพิชิตชัยชนะ และปลดล็อกสกินวีรบุรุษในตำนาน!"] }
    ],

    // NEW: Skins (5 skins)
    SKINS: [
        { id: 'default', name: 'นักเรียนพื้นฐาน', color: '#2196F3', req: 'ปลดล็อกเริ่มต้น' },
        { id: 'wall_guard', name: 'นักรบกำแพง', color: '#4CAF50', req: 'ผ่านด่านที่ 3' },
        { id: 'armor_guard', name: 'นักรบเกราะ', color: '#9E9E9E', req: 'ผ่านด่านที่ 5' },
        { id: 'hero', name: 'วีรบุรุษ', color: '#FFD700', req: 'ผ่านด่านที่ 10' },
        { id: 'legend', name: 'ผู้พิทักษ์ในตำนาน', color: '#FF5722', req: 'สะสมลักษณะนามครบ 100%' }
    ]
};
