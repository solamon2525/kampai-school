// data.js — คลังคำศัพท์ภาษาอังกฤษแบ่งตามหมวดหมู่การเรียนรู้
window.GAME_DATA = {
  animals: [
    { en: 'CAT', th: 'แมว', emoji: '🐱' },
    { en: 'DOG', th: 'สุนัข', emoji: '🐶' },
    { en: 'LION', th: 'สิงโต', emoji: '🦁' },
    { en: 'BIRD', th: 'นก', emoji: '🐦' },
    { en: 'FISH', th: 'ปลา', emoji: '🐟' },
    { en: 'TIGER', th: 'เสือ', emoji: '🐯' },
    { en: 'MONKEY', th: 'ลิง', emoji: '🐵' },
    { en: 'RABBIT', th: 'กระต่าย', emoji: '🐰' }
  ],
  fruits: [
    { en: 'APPLE', th: 'แอปเปิ้ล', emoji: '🍎' },
    { en: 'BANANA', th: 'กล้วย', emoji: '🍌' },
    { en: 'ORANGE', th: 'ส้ม', emoji: '🍊' },
    { en: 'GRAPE', th: 'องุ่น', emoji: '🍇' },
    { en: 'PEACH', th: 'ลูกท้อ', emoji: '🍑' },
    { en: 'LEMON', th: 'มะนาวเหลือง', emoji: '🍋' },
    { en: 'MELON', th: 'เมลอน', emoji: '🍈' },
    { en: 'MANGO', th: 'มะม่วง', emoji: '🥭' }
  ],
  colors: [
    { en: 'RED', th: 'สีแดง', emoji: '🔴' },
    { en: 'BLUE', th: 'สีน้ำเงิน', emoji: '🔵' },
    { en: 'GREEN', th: 'สีเขียว', emoji: '🟢' },
    { en: 'PINK', th: 'สีชมพู', emoji: '🌸' },
    { en: 'BLACK', th: 'สีดำ', emoji: '⚫' },
    { en: 'WHITE', th: 'สีขาว', emoji: '⚪' },
    { en: 'YELLOW', th: 'สีเหลือง', emoji: '🟡' },
    { en: 'ORANGE', th: 'สีส้ม', emoji: '🟠' }
  ],
  vehicles: [
    { en: 'BUS', th: 'รถบัส', emoji: '🚌' },
    { en: 'CAR', th: 'รถยนต์', emoji: '🚗' },
    { en: 'TRAIN', th: 'รถไฟ', emoji: '🚆' },
    { en: 'SHIP', th: 'เรือใหญ่', emoji: '🚢' },
    { en: 'PLANE', th: 'เครื่องบิน', emoji: '✈️' },
    { en: 'BIKE', th: 'จักรยาน', emoji: '🚲' },
    { en: 'TRUCK', th: 'รถบรรทุก', emoji: '🚚' },
    { en: 'BOAT', th: 'เรือเล็ก', emoji: '⛵' }
  ],
  school: [
    { en: 'BOOK', th: 'หนังสือ', emoji: '📖' },
    { en: 'PEN', th: 'ปากกา', emoji: '🖊️' },
    { en: 'RULER', th: 'ไม้บรรทัด', emoji: '📏' },
    { en: 'DESK', th: 'โต๊ะเรียน', emoji: ' desks ' }, // เลี่ยง emoji แปลกๆ
    { en: 'CHAIR', th: 'เก้าอี้', emoji: '🪑' },
    { en: 'PENCIL', th: 'ดินสอ', emoji: '✏️' },
    { en: 'PAPER', th: 'กระดาษ', emoji: '📄' },
    { en: 'BOARD', th: 'กระดานดำ', emoji: ' blackboard ' }
  ]
};

// ข้อมูลเมตาสำหรับแสดงในเมนูเลือกหัวข้อ
window.GAME_TOPICS = [
  { slug: 'animals', title: 'สัตว์น่ารัก', icon: '🦁', count: 8 },
  { slug: 'fruits', title: 'ผลไม้แสนอร่อย', icon: '🍎', count: 8 },
  { slug: 'colors', title: 'สีสันสดใส', icon: '🎨', count: 8 },
  { slug: 'vehicles', title: 'ยานพาหนะ', icon: '🚗', count: 8 },
  { slug: 'school', title: 'อุปกรณ์การเรียน', icon: '✏️', count: 8 }
];
