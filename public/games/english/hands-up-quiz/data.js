/* data.js — เนื้อหา/โจทย์ · window.GAME_DATA
   แต่ละข้อ: { q: โจทย์, choices: [ยกมือซ้าย, ยกสองมือ, ยกมือขวา], answer: index คำตอบถูก (0|1|2) }
     0 = ยกมือซ้าย · 1 = ยกสองมือ · 2 = ยกมือขวา
   เพิ่ม/แก้โจทย์ที่นี่ (ไม่ต้องแตะ game.js) — ตัวอย่าง: คำศัพท์อังกฤษ ป.4-6 */
window.GAME_DATA = {
    questions: [
        { q: 'apple = ?', choices: ['แอปเปิล', 'กล้วย', 'ส้ม'], answer: 0 },
        { q: 'cat = ?', choices: ['สุนัข', 'แมว', 'นก'], answer: 1 },
        { q: 'book = ?', choices: ['ปากกา', 'ดินสอ', 'หนังสือ'], answer: 2 },
        { q: 'water = ?', choices: ['น้ำ', 'ไฟ', 'ลม'], answer: 0 },
        { q: 'red = ?', choices: ['เขียว', 'แดง', 'น้ำเงิน'], answer: 1 },
        { q: 'three = ?', choices: ['หนึ่ง', 'สอง', 'สาม'], answer: 2 },
        { q: 'happy = ?', choices: ['มีความสุข', 'เศร้า', 'โกรธ'], answer: 0 },
        { q: 'school = ?', choices: ['บ้าน', 'โรงเรียน', 'ตลาด'], answer: 1 },
        { q: 'run = ?', choices: ['เดิน', 'นั่ง', 'วิ่ง'], answer: 2 },
        { q: 'sun = ?', choices: ['ดวงอาทิตย์', 'ดวงจันทร์', 'ดาว'], answer: 0 }
    ]
};
