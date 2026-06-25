/* data.js — โจทย์แต่ละรอบ · window.GAME_DATA
   rounds: กติกาแต่ละรอบ — label, emoji, check(n)→bool
   numbers: pool ตัวเลข 1-100 ที่ใช้ spawn (สุ่มจาก pool นี้)
   แก้เนื้อหาที่นี่ ไม่ต้องแตะ game.js */
window.GAME_DATA = {
    rounds: [
        {
            label: 'รับเลขคู่!',
            labelEN: 'Even Numbers',
            emoji: '2️⃣',
            hint: 'เลขที่หารด้วย 2 ลงตัว',
            check: function(n){ return n % 2 === 0; }
        },
        {
            label: 'รับเลขคี่!',
            labelEN: 'Odd Numbers',
            emoji: '1️⃣',
            hint: 'เลขที่หารด้วย 2 ไม่ลงตัว',
            check: function(n){ return n % 2 !== 0; }
        },
        {
            label: 'รับพหุคูณ 3!',
            labelEN: 'Multiples of 3',
            emoji: '3️⃣',
            hint: 'หารด้วย 3 ลงตัว',
            check: function(n){ return n % 3 === 0; }
        },
        {
            label: 'รับพหุคูณ 5!',
            labelEN: 'Multiples of 5',
            emoji: '5️⃣',
            hint: 'ลงท้ายด้วย 0 หรือ 5',
            check: function(n){ return n % 5 === 0; }
        },
        {
            label: 'รับ > 50!',
            labelEN: 'Greater than 50',
            emoji: '🔢',
            hint: 'มากกว่าห้าสิบ',
            check: function(n){ return n > 50; }
        }
    ],
    numbers: [
        1,2,3,4,5,6,7,8,9,10,
        11,12,13,14,15,16,17,18,19,20,
        21,22,24,25,27,28,30,32,33,35,
        36,40,42,44,45,48,50,54,55,60,
        63,64,66,70,72,75,77,80,81,90,
        99,100
    ]
};
