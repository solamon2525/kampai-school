/* data.js — โจทย์ภาษาอังกฤษ ป.4 (คำศัพท์ + ไวยากรณ์พื้นฐาน)
   แต่ละข้อ: { q, choices: [ซ้าย, กลาง, ขวา], answer: 0|1|2, speak?: อ่านเสียง (en) } */
window.GAME_DATA = {
    questions: [
        { q: '🔤 แปลว่า "ช้าง"', choices: ['elephant', 'tiger', 'rabbit'], answer: 0, speak: 'elephant' },
        { q: '🔤 แปลว่า "หอสมุด"', choices: ['library', 'pencil', 'ruler'], answer: 0, speak: 'library' },
        { q: '🇬🇧 "book" แปลว่า?', choices: ['หนังสือ', 'ปากกา', 'กระเป๋า'], answer: 0, speak: 'book' },
        { q: 'Which word means "doctor"?', choices: ['nurse', 'doctor', 'teacher'], answer: 1, speak: 'doctor' },
        { q: '🔤 แปลว่า "สตรอว์เบอร์รี"', choices: ['strawberry', 'mango', 'grape'], answer: 0, speak: 'strawberry' },
        { q: 'I ___ to school every day.', choices: ['walk', 'walks', 'walking'], answer: 0, speak: 'walk' },
        { q: '🔤 แปลว่า "นักบิน"', choices: ['pilot', 'driver', 'farmer'], answer: 0, speak: 'pilot' },
        { q: '🇬🇧 "purple" คือสีอะไร?', choices: ['สีม่วง', 'สีส้ม', 'สีชมพู'], answer: 0, speak: 'purple' },
        { q: 'She ___ a song.', choices: ['sing', 'sings', 'singing'], answer: 1, speak: 'sings' },
        { q: '🔤 แปลว่า "เครื่องบิน"', choices: ['airplane', 'train', 'boat'], answer: 0, speak: 'airplane' },
        { q: 'Opposite of "hot" is ___', choices: ['cold', 'rain', 'sun'], answer: 0, speak: 'cold' },
        { q: '🔤 แปลว่า "กรรไกร"', choices: ['scissors', 'ruler', 'crayon'], answer: 0, speak: 'scissors' }
    ]
};
