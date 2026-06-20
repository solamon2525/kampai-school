/* data.js — เนื้อหา/โจทย์ · window.GAME_DATA  (TODO: ใส่เนื้อหาจริงของเกม)
   แต่ละข้อ: { q: โจทย์, choices: [ซ้าย, กลาง, ขวา], answer: index ของคำตอบถูก (0|1|2) }
   เพิ่ม/แก้โจทย์ที่นี่ (ไม่ต้องแตะ game.js) */
window.GAME_DATA = {
    questions: [
        { q: 'โจทย์ตัวอย่าง 1', choices: ['ก', 'ข', 'ค'], answer: 0 },
        { q: 'โจทย์ตัวอย่าง 2', choices: ['ก', 'ข', 'ค'], answer: 1 },
        { q: 'โจทย์ตัวอย่าง 3', choices: ['ก', 'ข', 'ค'], answer: 2 }
        // … เพิ่มให้ครบตามจำนวน ROUNDS ใน config.js
    ]
};
