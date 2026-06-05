/* data.js — เนื้อหาเกม "ฟังแล้วสะกด" (listen-spell)
   แก้/เพิ่มคำศัพท์ที่นี่ที่เดียว: แต่ละคำ { w: คำอังกฤษ (a-z พิมพ์เล็ก), e: emoji คำใบ้, t: คำแปลไทย }
   เพิ่มหมวดใหม่ = push object { id, label, emoji, words:[...] } เข้า CATEGORIES */
window.GAME_DATA = {
  CATEGORIES: [
    { id:'animals', label:'สัตว์', emoji:'🐾', words:[
      {w:'cat',e:'🐱',t:'แมว'},{w:'dog',e:'🐶',t:'สุนัข'},{w:'fish',e:'🐟',t:'ปลา'},{w:'frog',e:'🐸',t:'กบ'},
      {w:'bird',e:'🐦',t:'นก'},{w:'bear',e:'🐻',t:'หมี'},{w:'duck',e:'🦆',t:'เป็ด'},{w:'cow',e:'🐄',t:'วัว'},
      {w:'pig',e:'🐷',t:'หมู'},{w:'owl',e:'🦉',t:'นกฮูก'},{w:'fox',e:'🦊',t:'จิ้งจอก'},{w:'bee',e:'🐝',t:'ผึ้ง'},
      {w:'ant',e:'🐜',t:'มด'},{w:'tiger',e:'🐯',t:'เสือ'},{w:'lion',e:'🦁',t:'สิงโต'},{w:'snake',e:'🐍',t:'งู'},
      {w:'horse',e:'🐴',t:'ม้า'},{w:'mouse',e:'🐭',t:'หนู'},{w:'panda',e:'🐼',t:'แพนด้า'},{w:'zebra',e:'🦓',t:'ม้าลาย'},
      {w:'sheep',e:'🐑',t:'แกะ'},{w:'whale',e:'🐳',t:'วาฬ'},{w:'rabbit',e:'🐰',t:'กระต่าย'},{w:'monkey',e:'🐵',t:'ลิง'},
      {w:'turtle',e:'🐢',t:'เต่า'},{w:'chicken',e:'🐔',t:'ไก่'},{w:'elephant',e:'🐘',t:'ช้าง'},{w:'dolphin',e:'🐬',t:'โลมา'},
      {w:'penguin',e:'🐧',t:'เพนกวิน'},{w:'giraffe',e:'🦒',t:'ยีราฟ'},{w:'octopus',e:'🐙',t:'ปลาหมึก'},
    ]},
    { id:'food', label:'อาหาร', emoji:'🍎', words:[
      {w:'cake',e:'🍰',t:'เค้ก'},{w:'milk',e:'🥛',t:'นม'},{w:'egg',e:'🥚',t:'ไข่'},{w:'rice',e:'🍚',t:'ข้าว'},
      {w:'meat',e:'🍖',t:'เนื้อ'},{w:'corn',e:'🌽',t:'ข้าวโพด'},{w:'apple',e:'🍎',t:'แอปเปิล'},{w:'lemon',e:'🍋',t:'มะนาว'},
      {w:'grape',e:'🍇',t:'องุ่น'},{w:'pizza',e:'🍕',t:'พิซซ่า'},{w:'bread',e:'🍞',t:'ขนมปัง'},{w:'candy',e:'🍬',t:'ลูกอม'},
      {w:'mango',e:'🥭',t:'มะม่วง'},{w:'salad',e:'🥗',t:'สลัด'},{w:'honey',e:'🍯',t:'น้ำผึ้ง'},{w:'juice',e:'🧃',t:'น้ำผลไม้'},
      {w:'banana',e:'🍌',t:'กล้วย'},{w:'orange',e:'🍊',t:'ส้ม'},{w:'carrot',e:'🥕',t:'แครอท'},{w:'cookie',e:'🍪',t:'คุกกี้'},
      {w:'cheese',e:'🧀',t:'ชีส'},{w:'sandwich',e:'🥪',t:'แซนด์วิช'},{w:'pumpkin',e:'🎃',t:'ฟักทอง'},
    ]},
    { id:'school', label:'โรงเรียน', emoji:'🏫', words:[
      {w:'pen',e:'🖊️',t:'ปากกา'},{w:'bag',e:'👜',t:'กระเป๋า'},{w:'map',e:'🗺️',t:'แผนที่'},{w:'book',e:'📖',t:'หนังสือ'},
      {w:'desk',e:'🪑',t:'โต๊ะ'},{w:'glue',e:'🧴',t:'กาว'},{w:'ruler',e:'📏',t:'ไม้บรรทัด'},{w:'paper',e:'📄',t:'กระดาษ'},
      {w:'clock',e:'🕐',t:'นาฬิกา'},{w:'globe',e:'🌐',t:'ลูกโลก'},{w:'crayon',e:'🖍️',t:'สีเทียน'},{w:'pencil',e:'✏️',t:'ดินสอ'},
      {w:'eraser',e:'🧽',t:'ยางลบ'},{w:'school',e:'🏫',t:'โรงเรียน'},{w:'teacher',e:'🧑‍🏫',t:'ครู'},{w:'library',e:'📚',t:'ห้องสมุด'},
      {w:'backpack',e:'🎒',t:'กระเป๋าเป้'},{w:'scissors',e:'✂️',t:'กรรไกร'},
    ]},
    { id:'nature', label:'ธรรมชาติ', emoji:'🌳', words:[
      {w:'sun',e:'☀️',t:'ดวงอาทิตย์'},{w:'sky',e:'🌌',t:'ท้องฟ้า'},{w:'sea',e:'🌊',t:'ทะเล'},{w:'ice',e:'🧊',t:'น้ำแข็ง'},
      {w:'star',e:'⭐',t:'ดาว'},{w:'moon',e:'🌙',t:'ดวงจันทร์'},{w:'leaf',e:'🍃',t:'ใบไม้'},{w:'rain',e:'🌧️',t:'ฝน'},
      {w:'snow',e:'❄️',t:'หิมะ'},{w:'fire',e:'🔥',t:'ไฟ'},{w:'rock',e:'🪨',t:'หิน'},{w:'wind',e:'🌬️',t:'ลม'},
      {w:'tree',e:'🌳',t:'ต้นไม้'},{w:'plant',e:'🌱',t:'ต้นกล้า'},{w:'cloud',e:'☁️',t:'เมฆ'},{w:'river',e:'🏞️',t:'แม่น้ำ'},
      {w:'flower',e:'🌸',t:'ดอกไม้'},{w:'rainbow',e:'🌈',t:'รุ้ง'},{w:'mountain',e:'⛰️',t:'ภูเขา'},
    ]},
    { id:'things', label:'สิ่งของ', emoji:'🚗', words:[
      {w:'car',e:'🚗',t:'รถยนต์'},{w:'cup',e:'☕',t:'ถ้วย'},{w:'key',e:'🔑',t:'กุญแจ'},{w:'bed',e:'🛏️',t:'เตียง'},
      {w:'ball',e:'⚽',t:'ลูกบอล'},{w:'boat',e:'⛵',t:'เรือ'},{w:'bike',e:'🚲',t:'จักรยาน'},{w:'kite',e:'🪁',t:'ว่าว'},
      {w:'lamp',e:'💡',t:'โคมไฟ'},{w:'door',e:'🚪',t:'ประตู'},{w:'drum',e:'🥁',t:'กลอง'},{w:'house',e:'🏠',t:'บ้าน'},
      {w:'train',e:'🚆',t:'รถไฟ'},{w:'phone',e:'📱',t:'โทรศัพท์'},{w:'plane',e:'✈️',t:'เครื่องบิน'},{w:'robot',e:'🤖',t:'หุ่นยนต์'},
      {w:'guitar',e:'🎸',t:'กีตาร์'},{w:'rocket',e:'🚀',t:'จรวด'},{w:'balloon',e:'🎈',t:'ลูกโป่ง'},
    ]},
    { id:'body', label:'ร่างกาย', emoji:'🧍', words:[
      {w:'eye',e:'👁️',t:'ตา'},{w:'ear',e:'👂',t:'หู'},{w:'arm',e:'💪',t:'แขน'},{w:'leg',e:'🦵',t:'ขา'},
      {w:'hand',e:'✋',t:'มือ'},{w:'foot',e:'🦶',t:'เท้า'},{w:'nose',e:'👃',t:'จมูก'},{w:'bone',e:'🦴',t:'กระดูก'},
      {w:'hair',e:'💇',t:'ผม'},{w:'mouth',e:'👄',t:'ปาก'},{w:'tooth',e:'🦷',t:'ฟัน'},{w:'heart',e:'❤️',t:'หัวใจ'},
      {w:'brain',e:'🧠',t:'สมอง'},{w:'tongue',e:'👅',t:'ลิ้น'},
    ]},
  ],
  ALPHA: 'abcdefghijklmnopqrstuvwxyz'.split(''),
};
