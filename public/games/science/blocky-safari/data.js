// data.js — ข้อมูลชนิดสัตว์และคลังคำถามแยกแยะประเภทสัตว์

window.ANIMAL_TYPES = {
    MAMMAL: 'สัตว์เลี้ยงลูกด้วยนม',
    BIRD: 'สัตว์ปีก',
    REPTILE: 'สัตว์เลื้อยคลาน',
    AMPHIBIAN: 'สัตว์สะเทินน้ำสะเทินบก',
    FISH: 'ปลา'
};

window.ANIMAL_DB_LEVELS = {
    1: [
        { id: 'cow', name: 'วัว', type: window.ANIMAL_TYPES.MAMMAL, emoji: '🐄', color: 0xffffff, question: 'ฉันคือพี่วัว ฉันเป็นสัตว์ประเภทไหนจ๊ะ?', hint: 'คิดดีๆ นะ! ฉันมีเต้านมและให้ลูกกินน้ำนมด้วย' },
        { id: 'chicken', name: 'ไก่', type: window.ANIMAL_TYPES.BIRD, emoji: '🐔', color: 0xffaaaa, question: 'กระต๊าก! ฉันคือแม่ไก่ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันมีขนเป็นแผงและออกลูกเป็นไข่นะจ๊ะ' },
        { id: 'frog', name: 'กบ', type: window.ANIMAL_TYPES.AMPHIBIAN, emoji: '🐸', color: 0x4ade80, question: 'อ๊บ อ๊บ! ฉันคือกบ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ตอนเด็กฉันเป็นลูกอ๊อดอยู่ในน้ำ ตอนโตฉันขึ้นมาอยู่บนบกนะ' },
        { id: 'turtle', name: 'เต่า', type: window.ANIMAL_TYPES.REPTILE, emoji: '🐢', color: 0x166534, question: 'ต้วมเตี้ยม... ฉันคือเต่า ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันมีเกล็ด มีกระดองแข็งๆ และอาศัยบนบกเป็นหลักนะ' },
        { id: 'shark', name: 'ฉลาม', type: window.ANIMAL_TYPES.FISH, emoji: '🦈', color: 0x94a3b8, question: 'แฮ่! ฉันคือฉลาม ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันหายใจด้วยเหงือกและว่ายน้ำอยู่ตลอดเวลา' }
    ],
    2: [
        { id: 'lion', name: 'สิงโต', type: window.ANIMAL_TYPES.MAMMAL, emoji: '🦁', color: 0xf59e0b, question: 'โฮก! ฉันคือสิงโตเจ้าป่า ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันเลี้ยงลูกด้วยน้ำนม และมีขนแผงคอสง่างาม' },
        { id: 'eagle', name: 'นกอินทรี', type: window.ANIMAL_TYPES.BIRD, emoji: '🦅', color: 0xa1a1aa, question: 'กิ๊กๆ! ฉันคือนกอินทรีนักล่า ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันมีปีก มีขนเป็นแผง และสายตาเฉียบคมมาก' },
        { id: 'crocodile', name: 'จระเข้', type: window.ANIMAL_TYPES.REPTILE, emoji: '🐊', color: 0x14532d, question: 'งับ! ฉันคือจระเข้ตัวใหญ่ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ผิวหนังฉันมีเกล็ดหนาแข็ง ออกลูกเป็นไข่ และเป็นสัตว์เลือดเย็นนะ' },
        { id: 'salamander', name: 'ซาลาแมนเดอร์', type: window.ANIMAL_TYPES.AMPHIBIAN, emoji: '🦎', color: 0xf97316, question: 'จิ๊บๆ! ฉันคือซาลาแมนเดอร์ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ผิวหนังฉันเปียกชื้นไม่มีเกล็ด หายใจด้วยเหงือกตอนเด็กและปอดตอนโตนะ' },
        { id: 'goldfish', name: 'ปลาทอง', type: window.ANIMAL_TYPES.FISH, emoji: '🐠', color: 0xf59e0b, question: 'บุ๋งๆ! ฉันคือปลาทองผู้น่ารัก ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันหายใจด้วยเหงือก มีครีบช่วยว่ายน้ำ และอยู่ในน้ำตลอดชีวิต' }
    ],
    3: [
        { id: 'whale', name: 'วาฬ', type: window.ANIMAL_TYPES.MAMMAL, emoji: '🐋', color: 0x0284c7, question: 'พ่นน้ำ! ฉันคือวาฬยักษ์ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ถึงฉันจะอยู่ในน้ำเหมือนปลา แต่ฉันมีต่อมน้ำนมเลี้ยงลูกนะ!' },
        { id: 'penguin', name: 'นกเพนกวิน', type: window.ANIMAL_TYPES.BIRD, emoji: '🐧', color: 0x1f2937, question: 'แป๊กๆ! ฉันคือเพนกวินเดินเตาะแตะ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ตัวฉันบินไม่ได้แต่มีขนเป็นแผงหนาแน่น คลุมร่างและออกลูกเป็นไข่' },
        { id: 'snake', name: 'งู', type: window.ANIMAL_TYPES.REPTILE, emoji: '🐍', color: 0x22c55e, question: 'ฟู่! ฉันคืองูเขียว ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันไม่มีขา ผิวหนังมีเกล็ด และเคลื่อนที่ด้วยการเลื้อย' },
        { id: 'toad', name: 'คางคก', type: window.ANIMAL_TYPES.AMPHIBIAN, emoji: '🐸', color: 0x78350f, question: 'คางคกขึ้นวอ! ฉันเป็นสัตว์ประเภทไหน?', hint: 'ผิวหนังฉันขรุขระเป็นปุ่มปม มีต่อมพิษ ตอนเด็กเป็นลูกอ๊อด' },
        { id: 'clownfish', name: 'ปลาการ์ตูน', type: window.ANIMAL_TYPES.FISH, emoji: '🐠', color: 0xea580c, question: 'สวัสดี! ฉันคือปลาการ์ตูนนีโม่ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันอาศัยอยู่ในดอกไม้ทะเล ว่ายน้ำด้วยครีบ หายใจทางเหงือก' }
    ]
};

// Legacy fallback
window.ANIMAL_DB = window.ANIMAL_DB_LEVELS[1];
