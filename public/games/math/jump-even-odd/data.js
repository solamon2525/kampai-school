/* data.js — เนื้อหา/โจทย์ · window.GAME_DATA
   แต่ละข้อ: { q: โจทย์(เลข), answer: 'jump' | 'squat' }
     jump  = เลขคู่ (กระโดด) · squat = เลขคี่ (ย่อตัว)  ← label จาก config.ACTIONS
   เพิ่ม/แก้โจทย์ที่นี่ (ไม่ต้องแตะ game.js) */
window.GAME_DATA = {
    questions: [
        { q: '8',  answer: 'jump' },
        { q: '7',  answer: 'squat' },
        { q: '12', answer: 'jump' },
        { q: '15', answer: 'squat' },
        { q: '20', answer: 'jump' },
        { q: '9',  answer: 'squat' },
        { q: '6',  answer: 'jump' },
        { q: '11', answer: 'squat' },
        { q: '14', answer: 'jump' },
        { q: '3',  answer: 'squat' },
        { q: '18', answer: 'jump' },
        { q: '5',  answer: 'squat' }
    ]
};
