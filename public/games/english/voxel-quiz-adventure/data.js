// data.js — คลังโจทย์ภาษาอังกฤษ แยกหมวด + ระดับชั้น (grades: 4|5|6)
window.GAME_TOPICS = [
  { slug: 'animals', title: 'สัตว์', icon: '🐱' },
  { slug: 'colors', title: 'สี', icon: '🎨' },
  { slug: 'greetings', title: 'ทักทาย', icon: '👋' },
  { slug: 'numbers', title: 'ตัวเลข', icon: '🔢' },
];

window.GAME_DATA = {
  animals: [
    { q: "What is 'แมว' in English?", choices: ['Dog', 'Cat', 'Bird', 'Fish'], answer: 1, speak: 'cat', grades: [4, 5, 6] },
    { q: "What is 'สุนัข' in English?", choices: ['Cat', 'Dog', 'Fish', 'Bird'], answer: 1, speak: 'dog', grades: [4, 5, 6] },
    { q: "What animal says 'Moo'?", choices: ['Dog', 'Cat', 'Cow', 'Duck'], answer: 2, speak: 'cow', grades: [4, 5] },
    { q: "What animal can fly?", choices: ['Cow', 'Bird', 'Fish', 'Dog'], answer: 1, speak: 'bird', grades: [4, 5, 6] },
    { q: "What is 'ปลา' in English?", choices: ['Bird', 'Fish', 'Frog', 'Fox'], answer: 1, speak: 'fish', grades: [4, 5] },
    { q: "What is 'เป็ด' in English?", choices: ['Chicken', 'Duck', 'Goose', 'Swan'], answer: 1, speak: 'duck', grades: [5, 6] },
    { q: "What is 'ช้าง' in English?", choices: ['Elephant', 'Tiger', 'Lion', 'Bear'], answer: 0, speak: 'elephant', grades: [5, 6] },
    { q: "What is 'เสือ' in English?", choices: ['Lion', 'Tiger', 'Leopard', 'Wolf'], answer: 1, speak: 'tiger', grades: [6] },
  ],
  colors: [
    { q: "What is 'สีแดง' in English?", choices: ['Blue', 'Green', 'Red', 'Yellow'], answer: 2, speak: 'red', grades: [4, 5, 6] },
    { q: "What is 'สีเขียว' in English?", choices: ['Red', 'Blue', 'Green', 'Pink'], answer: 2, speak: 'green', grades: [4, 5, 6] },
    { q: 'What color is the sky?', choices: ['Green', 'Blue', 'Red', 'Black'], answer: 1, speak: 'blue', grades: [4, 5] },
    { q: "What is 'สีเหลือง' in English?", choices: ['Orange', 'Yellow', 'Pink', 'Purple'], answer: 1, speak: 'yellow', grades: [4, 5, 6] },
    { q: "What is 'สีดำ' in English?", choices: ['White', 'Gray', 'Black', 'Brown'], answer: 2, speak: 'black', grades: [4, 5] },
    { q: "What is 'สีขาว' in English?", choices: ['Black', 'White', 'Gray', 'Silver'], answer: 1, speak: 'white', grades: [4, 5] },
    { q: "What is 'สีส้ม' in English?", choices: ['Red', 'Orange', 'Yellow', 'Pink'], answer: 1, speak: 'orange', grades: [5, 6] },
    { q: "What is 'สีม่วง' in English?", choices: ['Pink', 'Purple', 'Blue', 'Green'], answer: 1, speak: 'purple', grades: [6] },
  ],
  greetings: [
    { q: "How do you say 'สวัสดี'?", choices: ['Goodbye', 'Thank you', 'Hello', 'Sorry'], answer: 2, speak: 'hello', grades: [4, 5, 6] },
    { q: "How do you say 'ขอบคุณ'?", choices: ['Sorry', 'Hello', 'Thank you', 'Please'], answer: 2, speak: 'thank you', grades: [4, 5, 6] },
    { q: "How do you say 'ลาก่อน'?", choices: ['Hello', 'Goodbye', 'Please', 'Welcome'], answer: 1, speak: 'goodbye', grades: [4, 5] },
    { q: "How do you say 'ขอโทษ'?", choices: ['Thank you', 'Sorry', 'Excuse me', 'Please'], answer: 1, speak: 'sorry', grades: [4, 5, 6] },
    { q: "'Please' แปลว่าอะไร?", choices: ['ขอบคุณ', 'ขอโทษ', 'กรุณา', 'สวัสดี'], answer: 2, speak: 'please', grades: [5, 6] },
    { q: "'Happy' แปลว่าอะไร?", choices: ['เศร้า', 'โกรธ', 'มีความสุข', 'กลัว'], answer: 2, speak: 'happy', grades: [4, 5, 6] },
    { q: "'Sad' แปลว่าอะไร?", choices: ['ดีใจ', 'เศร้า', 'โกรธ', 'เหนื่อย'], answer: 1, speak: 'sad', grades: [4, 5] },
    { q: "How do you say 'ยินดีต้อนรับ'?", choices: ['Goodbye', 'Welcome', 'Hello', 'Thanks'], answer: 1, speak: 'welcome', grades: [6] },
  ],
  numbers: [
    { q: "What is 'หนึ่ง' in English?", choices: ['Two', 'Three', 'One', 'Four'], answer: 2, speak: 'one', grades: [4, 5, 6] },
    { q: "What is 'สอง' in English?", choices: ['One', 'Two', 'Three', 'Four'], answer: 1, speak: 'two', grades: [4, 5, 6] },
    { q: "What is 'สาม' in English?", choices: ['Two', 'Three', 'Four', 'Five'], answer: 1, speak: 'three', grades: [4, 5, 6] },
    { q: "What is 'สี่' in English?", choices: ['Three', 'Four', 'Five', 'Six'], answer: 1, speak: 'four', grades: [4, 5] },
    { q: "What is 'ห้า' in English?", choices: ['Four', 'Five', 'Six', 'Seven'], answer: 1, speak: 'five', grades: [4, 5] },
    { q: "What is 'หก' in English?", choices: ['Five', 'Six', 'Seven', 'Eight'], answer: 1, speak: 'six', grades: [5, 6] },
    { q: "What is 'เจ็ด' in English?", choices: ['Six', 'Seven', 'Eight', 'Nine'], answer: 1, speak: 'seven', grades: [5, 6] },
    { q: "What is 'สิบ' in English?", choices: ['Eight', 'Nine', 'Ten', 'Eleven'], answer: 2, speak: 'ten', grades: [6] },
  ],
};
