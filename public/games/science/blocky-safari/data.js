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
        // Level 1: Farm & Savannah Animals
        { id: 'cow', name: 'วัว', type: window.ANIMAL_TYPES.MAMMAL, emoji: '🐄', color: 0xffffff, question: 'ฉันคือพี่วัว ฉันเป็นสัตว์ประเภทไหนจ๊ะ?', hint: 'คิดดีๆ นะ! ฉันมีเต้านมและให้ลูกกินน้ำนมด้วย' },
        { id: 'dog', name: 'สุนัข', type: window.ANIMAL_TYPES.MAMMAL, emoji: '🐶', color: 0xd97706, question: 'โฮ่งๆ! ฉันคือสุนัขแสนรู้ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันตกลูกเป็นตัว เลี้ยงลูกด้วยน้ำนม และมีขนปกคลุมร่างกาย' },
        { id: 'cat', name: 'แมว', type: window.ANIMAL_TYPES.MAMMAL, emoji: '🐱', color: 0xf59e0b, question: 'เหมียวๆ! ฉันคือแมวเหมียว ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันเป็นสัตว์มีกระดูกสันหลังที่ตกลูกเป็นตัวและกินน้ำนมตอนเด็ก' },
        { id: 'horse', name: 'ม้า', type: window.ANIMAL_TYPES.MAMMAL, emoji: '🐴', color: 0x78350f, question: 'ฮี้ๆ! ฉันคือม้าวิ่งเร็ว ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันวิ่งเร็ว มีกีบเท้าเดียว และเลี้ยงลูกด้วยน้ำนมนะ' },
        
        { id: 'chicken', name: 'ไก่', type: window.ANIMAL_TYPES.BIRD, emoji: '🐔', color: 0xff8888, question: 'กระต๊าก! ฉันคือแม่ไก่ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันมีขนเป็นแผง มีปีก และออกลูกเป็นไข่ที่มีเปลือกแข็งหุ้ม' },
        { id: 'duck', name: 'เป็ด', type: window.ANIMAL_TYPES.BIRD, emoji: '🦆', color: 0xfef08a, question: 'ก้าบๆ! ฉันคือเป็ดว่ายน้ำ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันมีจะงอยปากแบน มีพังผืดที่เท้าช่วยว่ายน้ำ และมีขนเป็นแผง' },
        { id: 'pigeon', name: 'นกพิราบ', type: window.ANIMAL_TYPES.BIRD, emoji: '🐦', color: 0x94a3b8, question: 'กู๊ๆ! ฉันคือนกพิราบขาว ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันบินบนฟ้า มีกระดูกโปร่งเบา มีปีกและออกลูกเป็นไข่' },
        
        { id: 'turtle', name: 'เต่า', type: window.ANIMAL_TYPES.REPTILE, emoji: '🐢', color: 0x166534, question: 'ต้วมเตี้ยม... ฉันคือเต่า ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันมีกระดองแข็งปกคลุม ผิวหนังแห้งมีเกล็ด และออกลูกเป็นไข่บนบก' },
        { id: 'lizard', name: 'กิ้งก่า', type: window.ANIMAL_TYPES.REPTILE, emoji: '🦎', color: 0x22c55e, question: 'แวบๆ! ฉันคือกิ้งก่าเปลี่ยนสี ฉันเป็นสัตว์ประเภทไหน?', hint: 'ผิวหนังฉันมีเกล็ดปกคลุมตัว เป็นสัตว์เลือดเย็น และออกลูกเป็นไข่' },
        
        { id: 'frog', name: 'กบ', type: window.ANIMAL_TYPES.AMPHIBIAN, emoji: '🐸', color: 0x4ade80, question: 'อ๊บ อ๊บ! ฉันคือกบ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ตอนเด็กฉันเป็นลูกอ๊อดอาศัยและหายใจในน้ำ ตอนโตหายใจด้วยปอดและผิวหนังเปียกชื้น' },
        { id: 'toadlet', name: 'เขียด', type: window.ANIMAL_TYPES.AMPHIBIAN, emoji: '🐸', color: 0x84cc16, question: 'จิ๊บๆ! ฉันคือเขียดตัวเล็ก ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันผิวหนังเปียกชื้น ไม่มีเกล็ด วางไข่ในน้ำ และตัวอ่อนมีหางหายใจด้วยเหงือก' },
        
        { id: 'goldfish', name: 'ปลาทอง', type: window.ANIMAL_TYPES.FISH, emoji: '🐠', color: 0xea580c, question: 'บุ๋งๆ! ฉันคือปลาทองผู้น่ารัก ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันหายใจด้วยเหงือก มีครีบช่วยว่ายน้ำ และอาศัยอยู่ในน้ำตลอดชีวิต' },
        { id: 'guppy', name: 'ปลาหางนกยูง', type: window.ANIMAL_TYPES.FISH, emoji: '🐟', color: 0x06b6d4, question: 'ว่ายน้ำ... ฉันคือปลาหางนกยูง ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันหายใจด้วยเหงือก มีครีบ และมีรูปทรงปราดเปรียวว่ายน้ำในอ่าง' }
    ],
    2: [
        // Level 2: Jungle & Exotic Animals
        { id: 'lion', name: 'สิงโต', type: window.ANIMAL_TYPES.MAMMAL, emoji: '🦁', color: 0xf59e0b, question: 'โฮก! ฉันคือสิงโตเจ้าป่า ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันเลี้ยงลูกด้วยน้ำนม มีขนแผงคอสง่างาม และเป็นสัตว์กินเนื้อขนาดใหญ่' },
        { id: 'elephant', name: 'ช้าง', type: window.ANIMAL_TYPES.MAMMAL, emoji: '🐘', color: 0x6b7280, question: 'แปร๋นๆ! ฉันคือช้างป่าตัวใหญ่ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันมีงวงยาว มีงาคู่สวยงาม และเลี้ยงลูกด้วยน้ำนม' },
        { id: 'monkey', name: 'ลิง', type: window.ANIMAL_TYPES.MAMMAL, emoji: '🐒', color: 0xb45309, question: 'เจี๊ยกๆ! ฉันคือลิงซุกซน ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันปีนป่ายต้นไม้เก่ง มีสมองพัฒนาดี และคลอดลูกเป็นตัวเลี้ยงด้วยน้ำนม' },
        { id: 'bat', name: 'ค้างคาว', type: window.ANIMAL_TYPES.MAMMAL, emoji: '🦇', color: 0x1e1b4b, question: 'จี๊ดๆ! ฉันคือค้างคาวบินกลางคืน ฉันเป็นสัตว์ประเภทไหน?', hint: 'แม้ฉันจะบินได้เหมือนนก แต่ฉันไม่มีขนเป็นแผงและเลี้ยงลูกด้วยน้ำนมนะ!' },
        
        { id: 'eagle', name: 'นกอินทรี', type: window.ANIMAL_TYPES.BIRD, emoji: '🦅', color: 0xa1a1aa, question: 'กิ๊กๆ! ฉันคือนกอินทรีนักล่า ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันมีปีก มีขนเป็นแผง สายตาคมกริบ และออกลูกเป็นไข่' },
        { id: 'parrot', name: 'นกแก้ว', type: window.ANIMAL_TYPES.BIRD, emoji: '🦜', color: 0x10b981, question: 'สวัสดี! ฉันคือนกแก้วพูดได้ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ปากฉันโค้งแข็งแรง ขนมีสีสันสดใสเป็นแผง และบินได้เก่ง' },
        { id: 'owl', name: 'นกฮูก', type: window.ANIMAL_TYPES.BIRD, emoji: '🦉', color: 0x78716c, question: 'ฮูกๆ! ฉันคือนกฮูกตาโต ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันล่าเหยื่อตอนกลางคืน บินได้เงียบเชียบ มีปีกและกระดูกโปร่ง' },
        
        { id: 'crocodile', name: 'จระเข้', type: window.ANIMAL_TYPES.REPTILE, emoji: '🐊', color: 0x14532d, question: 'งับ! ฉันคือจระเข้ตัวใหญ่ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ผิวหนังฉันมีเกล็ดหนาแข็ง ออกลูกเป็นไข่ และเป็นสัตว์เลือดเย็นอาศัยตามริมน้ำ' },
        { id: 'python', name: 'งูเหลือม', type: window.ANIMAL_TYPES.REPTILE, emoji: '🐍', color: 0x0f766e, question: 'ฟู่ๆ... ฉันคืองูเหลือมตัวยาว ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันไม่มีขา เคลื่อนที่ด้วยการเลื้อย ผิวหนังมีเกล็ดแข็ง และมีกระดูกสันหลัง' },
        { id: 'gecko', name: 'ตุ๊กแก', type: window.ANIMAL_TYPES.REPTILE, emoji: '🦎', color: 0x6b21a8, question: 'ต๊อกแก! ฉันคือตุ๊กแกลายเสือ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ตีนฉันมีปุ่มดูดเกาะผนัง ผิวแห้งมีเกล็ด และเป็นสัตว์เลือดเย็นออกลูกเป็นไข่' },
        
        { id: 'salamander', name: 'ซาลาแมนเดอร์', type: window.ANIMAL_TYPES.AMPHIBIAN, emoji: '🦎', color: 0xf97316, question: 'เดินช้า... ฉันคือซาลาแมนเดอร์ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ผิวหนังฉันเปียกชื้นไม่มีสะเก็ด วางไข่ in น้ำ ตัวเต็มวัยขึ้นมาอยู่บนบกได้' },
        { id: 'bullfrog', name: 'อึ่งอ่าง', type: window.ANIMAL_TYPES.AMPHIBIAN, emoji: '🐸', color: 0xa16207, question: 'อึ่งอ่างท้องป่อง! ฉันเป็นสัตว์ประเภทไหน?', hint: 'ผิวหนังเปียกลื่น ไม่มีเกล็ด หายใจด้วยปอดและผิวหนังเมื่อโตขึ้น' },
        
        { id: 'carp', name: 'ปลาคาร์ป', type: window.ANIMAL_TYPES.FISH, emoji: '🐟', color: 0xef4444, question: 'ว่ายวน... ฉันคือปลาคาร์ปสีแดง ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันหายใจด้วยเหงือก ผิวหนังมีเกล็ด และใช้ครีบในการเคลื่อนที่ในน้ำ' },
        { id: 'fightingfish', name: 'ปลากัด', type: window.ANIMAL_TYPES.FISH, emoji: '🐟', color: 0x3b82f6, question: 'พองใส่! ฉันคือปลากัดยอดนักสู้ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ครีบฉันยาวสวยงาม มีเหงือกช่วยหายใจ และอยู่ในน้ำตลอดชีวิต' }
    ],
    3: [
        // Level 3: Ocean & Extreme Environment Animals
        { id: 'whale', name: 'วาฬ', type: window.ANIMAL_TYPES.MAMMAL, emoji: '🐋', color: 0x0284c7, question: 'พ่นน้ำ! ฉันคือวาฬยักษ์ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ถึงฉันจะอยู่ในทะเลลึกเหมือนปลา แต่ฉันตกลูกเป็นตัวและมีต่อมน้ำนมเลี้ยงลูกนะ!' },
        { id: 'dolphin', name: 'โลมา', type: window.ANIMAL_TYPES.MAMMAL, emoji: '🐬', color: 0x38bdf8, question: 'เอิ๊กๆ! ฉันคือโลมาแสนดี ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันไม่ใช่ปลา ฉันเป็นสัตว์เลือดอุ่นที่เลี้ยงลูกด้วยน้ำนมและหายใจด้วยปอด' },
        { id: 'camel', name: 'อูฐ', type: window.ANIMAL_TYPES.MAMMAL, emoji: '🐫', color: 0xd97706, question: 'เดินทราย... ฉันคืออูฐทะเลทราย ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันมีโหนกเก็บไขมัน ทนแล้งเก่ง คลอดลูกเป็นตัวและเลี้ยงด้วยนม' },
        { id: 'polarbear', name: 'หมีขั้วโลก', type: window.ANIMAL_TYPES.MAMMAL, emoji: '🐻', color: 0xf3f4f6, question: 'คำราม! ฉันคือหมีขั้วโลกขนสีขาว ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันมีชั้นไขมันหนาอยู่ใต้ผิวหนัง เลี้ยงลูกด้วยน้ำนมท่ามกลางน้ำแข็ง' },
        
        { id: 'penguin', name: 'นกเพนกวิน', type: window.ANIMAL_TYPES.BIRD, emoji: '🐧', color: 0x1f2937, question: 'แป๊กๆ! ฉันคือเพนกวินเดินเตาะแตะ ฉันเป็นสัตว์ประเภทไหน?', hint: 'แม้ฉันจะบินไม่ได้ แต่ฉันมีกระดูกโปร่งเบา มีขนแผงกันน้ำ และออกลูกเป็นไข่' },
        { id: 'seagull', name: 'นกนางนวล', type: window.ANIMAL_TYPES.BIRD, emoji: '🐦', color: 0xe2e8f0, question: 'ร้องก้อง! ฉันคือนกนางนวลริมทะเล ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันบินร่อนตามเรือ มีกระดูกกลวงเบา มีปีก และมีขนเป็นแผงรอบตัว' },
        { id: 'ostrich', name: 'นกกระจอกเทศ', type: window.ANIMAL_TYPES.BIRD, emoji: '🦩', color: 0xf472b6, question: 'วิ่งเร็ว! ฉันคือนกกระจอกเทศตัวใหญ่ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันตัวใหญ่ที่สุดในกลุ่ม บินไม่ได้แต่วิ่งเร็ว มีขนเป็นแผงและออกไข่ใบยักษ์' },
        
        { id: 'rattlesnake', name: 'งูหางกระดิ่ง', type: window.ANIMAL_TYPES.REPTILE, emoji: '🐍', color: 0x4b5563, question: 'แช่ๆ! ฉันคืองูหางกระดิ่งมีพิษ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันไม่มีขา ผิวหนังแห้งมีเกล็ด ใช้การเลื้อยคลาน และออกลูกเป็นไข่' },
        { id: 'desertlizard', name: 'กิ้งก่าทะเลทราย', type: window.ANIMAL_TYPES.REPTILE, emoji: '🦎', color: 0xca8a04, question: 'วิ่งไว! ฉันคือกิ้งก่าทะเลทราย ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันชอบอาบแดด ผิวแห้งตกสะเก็ด มีเกล็ดหนากันเสียน้ำ และเป็นสัตว์เลือดเย็น' },
        { id: 'leatherback', name: 'เต่ามะเฟือง', type: window.ANIMAL_TYPES.REPTILE, emoji: '🐢', color: 0x1e3a8a, question: 'ว่ายน้ำ... ฉันคือเต่ามะเฟืองยักษ์ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันวางไข่บนหาดทราย ผิวหนังหนาไม่มีเกล็ดชัดเจนเหมือนเต่าบกแต่จัดอยู่ในกลุ่มเลื้อยคลาน' },
        
        { id: 'toad', name: 'คางคกยักษ์', type: window.ANIMAL_TYPES.AMPHIBIAN, emoji: '🐸', color: 0x78350f, question: 'ผิวขรุขระ! ฉันคือคางคกยักษ์ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ผิวหนังขรุขระเป็นปุ่มปมมีต่อมพิษ ไม่มีเกล็ด ตอนเด็กเป็นลูกอ๊อดอยู่ชื้นแฉะ' },
        { id: 'newt', name: 'นิวต์', type: window.ANIMAL_TYPES.AMPHIBIAN, emoji: '🦎', color: 0x047857, question: 'หางยาว... ฉันคือนิวต์น้ำครึ่งบกครึ่งน้ำ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันหางแบนช่วยว่ายน้ำ ผิวหนังลื่นไม่มีเกล็ด และวางไข่ในน้ำจ๊ะ' },
        
        { id: 'shark', name: 'ฉลาม', type: window.ANIMAL_TYPES.FISH, emoji: '🦈', color: 0x94a3b8, question: 'แฮ่! ฉันคือฉลามนักล่าแห่งมหาสมุทร ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันหายใจด้วยเหงือก มีกระดูกอ่อน ครีบแหลมคม และอาศัยในน้ำ' },
        { id: 'clownfish', name: 'ปลาการ์ตูน', type: window.ANIMAL_TYPES.FISH, emoji: '🐠', color: 0xea580c, question: 'สวัสดี! ฉันคือปลาการ์ตูนนีโม่ ฉันเป็นสัตว์ประเภทไหน?', hint: 'ฉันอาศัยในดอกไม้ทะเล หายใจทางเหงือก และใช้ครีบว่ายน้ำทรงตัว' },
        { id: 'stingray', name: 'ปลากระเบน', type: window.ANIMAL_TYPES.FISH, emoji: '🐟', color: 0x334155, question: 'แบนราบ... ฉันคือปลากระเบนแบน ฉันเป็นสัตว์ประเภทไหน?', hint: 'ตัวฉันแบนราบ หายใจทางช่องเหงือกด้านล่าง และมีครีบขนาดใหญ่กระพือเหมือนปีก' }
    ]
};

// Legacy fallback
window.ANIMAL_DB = window.ANIMAL_DB_LEVELS[1];
