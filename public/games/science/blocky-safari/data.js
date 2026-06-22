// data.js — ข้อมูลชนิดสัตว์และคลังคำถามแยกแยะประเภทสัตว์

window.ANIMAL_TYPES = {
    MAMMAL: 'สัตว์เลี้ยงลูกด้วยนม',
    BIRD: 'สัตว์ปีก',
    REPTILE: 'สัตว์เลื้อยคลาน',
    AMPHIBIAN: 'สัตว์สะเทินน้ำสะเทินบก',
    FISH: 'ปลา'
};

window.ANIMAL_DB = [
    {
        id: 'cow',
        name: 'วัว',
        type: window.ANIMAL_TYPES.MAMMAL,
        emoji: '🐄',
        color: 0xffffff,
        question: 'ฉันคือพี่วัว ฉันเป็นสัตว์ประเภทไหนจ๊ะ?',
        hint: 'คิดดีๆ นะ! ฉันมีเต้านมและให้ลูกกินน้ำนมด้วย'
    },
    {
        id: 'chicken',
        name: 'ไก่',
        type: window.ANIMAL_TYPES.BIRD,
        emoji: '🐔',
        color: 0xffaaaa,
        question: 'กระต๊าก! ฉันคือแม่ไก่ ฉันเป็นสัตว์ประเภทไหน?',
        hint: 'ฉันมีขนเป็นแผงและออกลูกเป็นไข่นะจ๊ะ'
    },
    {
        id: 'frog',
        name: 'กบ',
        type: window.ANIMAL_TYPES.AMPHIBIAN,
        emoji: '🐸',
        color: 0x4ade80,
        question: 'อ๊บ อ๊บ! ฉันคือกบ ฉันเป็นสัตว์ประเภทไหน?',
        hint: 'ตอนเด็กฉันเป็นลูกอ๊อดอยู่ในน้ำ ตอนโตฉันขึ้นมาอยู่บนบกนะ'
    },
    {
        id: 'turtle',
        name: 'เต่า',
        type: window.ANIMAL_TYPES.REPTILE,
        emoji: '🐢',
        color: 0x166534,
        question: 'ต้วมเตี้ยม... ฉันคือเต่า ฉันเป็นสัตว์ประเภทไหน?',
        hint: 'ฉันมีเกล็ด มีกระดองแข็งๆ และอาศัยบนบกเป็นหลักนะ'
    },
    {
        id: 'shark',
        name: 'ฉลาม',
        type: window.ANIMAL_TYPES.FISH,
        emoji: '🦈',
        color: 0x94a3b8,
        question: 'แฮ่! ฉันคือฉลาม ฉันเป็นสัตว์ประเภทไหน?',
        hint: 'ฉันหายใจด้วยเหงือกและว่ายน้ำอยู่ตลอดเวลา'
    }
];
