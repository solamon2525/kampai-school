export const MODULES = [
  {
    id: 'be',
    name: '1. Verb to Be',
    title: 'Verb to Be (is / am / are)',
    desc: 'ใช้บอกสถานะ เป็น อยู่ คือ หรือเชื่อมประธานกับคำคุณศัพท์ จับคู่กับประธานให้ถูกต้อง:',
    rule: '• I ➔ am (ฉัน)<br>• He / She / It / คำนามเอกพจน์ ➔ is<br>• You / We / They / คำนามพหูพจน์ ➔ are',
    examples: [
      {
        en: 'She <span class="grammar-token">is</span> a doctor at the hospital.',
        th: 'เธอเป็นคุณหมอที่โรงพยาบาล',
        img: '/games/english/vocab-hub-assets/jobs/doctor.webp',
        focus: 'is (เอกพจน์)',
        ruleNote: 'ประธาน She เป็นเอกพจน์คนเดียว จึงใช้ is เพื่อบอกอาชีพ'
      },
      {
        en: 'I <span class="grammar-token">am</span> happy with my sister.',
        th: 'ฉันมีความสุขกับน้องสาวของฉัน',
        img: '/games/english/vocab-hub-assets/family/sister.webp',
        focus: 'am (คู่กับ I)',
        ruleNote: 'ประธาน I ใช้คู่กับ am เสมอเมื่อบอกความรู้สึกหรือสภาพ'
      },
      {
        en: 'They <span class="grammar-token">are</span> playing football outside.',
        th: 'พวกเขากำลังเล่นฟุตบอลอยู่ข้างนอก',
        img: '/games/english/vocab-hub-assets/sports/football.webp',
        focus: 'are (พหูพจน์)',
        ruleNote: 'ประธาน They เป็นพหูพจน์หลายคน จึงใช้ are + กริยาเติม -ing'
      }
    ]
  },
  {
    id: 'articles',
    name: '2. Articles (a/an/the)',
    title: 'Articles คำนำหน้านาม (a, an, the)',
    desc: 'ใช้ระบุคำนามนับได้เอกพจน์ และความชี้เฉพาะเจาะจง:',
    rule: '• a + คำนามเอกพจน์ที่ขึ้นต้นด้วยเสียงพยัญชนะ (a book, a cat, a pencil)<br>• an + คำนามเอกพจน์ที่ขึ้นต้นด้วยเสียงสระ a, e, i, o, u (an apple, an egg, an orange)<br>• the + สิ่งที่มีหนึ่งเดียว หรือชี้เฉพาะเจาะจงที่ผู้ฟังเข้าใจตรงกัน (the sun, the school)',
    examples: [
      {
        en: 'I eat <span class="grammar-token">an</span> apple every morning.',
        th: 'ฉันกินแอปเปิลวันละ 1 ผลทุกเช้า',
        img: '/games/english/vocab-hub-assets/fruits/apple.webp',
        focus: 'an (เสียงสระ /æ/)',
        ruleNote: 'apple ขึ้นต้นด้วยเสียงสระ /æ/ จึงต้องใช้ an นำหน้า'
      },
      {
        en: 'He writes with <span class="grammar-token">a</span> blue pencil.',
        th: 'เขาเขียนหนังสือด้วยดินสอสีฟ้า 1 แท่ง',
        img: '/games/english/vocab-hub-assets/classroom/pencil.webp',
        focus: 'a (เสียงพยัญชนะ /p/)',
        ruleNote: 'pencil ขึ้นต้นด้วยเสียงพยัญชนะ /p/ จึงใช้ a นำหน้า'
      },
      {
        en: '<span class="grammar-token">The</span> sun shines bright in summer.',
        th: 'ดวงอาทิตย์ส่องแสงเจิดจ้าในฤดูร้อน',
        img: '/games/english/vocab-hub-assets/seasons/summer.webp',
        focus: 'The (สิ่งเดียวในโลก)',
        ruleNote: 'ดวงอาทิตย์มีเพียงดวงเดียวในโลก จึงต้องใช้ The นำหน้าเสมอ'
      }
    ]
  },
  {
    id: 'pronouns',
    name: '3. Pronouns',
    title: 'Pronouns สรรพนาม และ Possessives แสดงความเป็นเจ้าของ',
    desc: 'ใช้แทนชื่อคน สัตว์ สิ่งของ เพื่อหลีกเลี่ยงการพูดชื่อซ้ำ และแสดงว่าสิ่งของนั้นเป็นของใคร:',
    rule: '• I (ฉัน) ➔ my (ของฉัน) | me (กรรม)<br>• You (คุณ) ➔ your (ของคุณ)<br>• He (เขาผู้ชาย) ➔ his (ของเขา) | him (กรรม)<br>• She (เธอผู้หญิง) ➔ her (ของเธอ)<br>• We (พวกเรา) ➔ our (ของพวกเรา) | us (กรรม)<br>• They (พวกเขา) ➔ their (ของพวกเขา) | them (กรรม)',
    examples: [
      {
        en: 'Ken carries <span class="grammar-token">his</span> heavy school bag.',
        th: 'เคนถือกระเป๋านักเรียนอันหนักของเขา',
        img: '/games/english/vocab-hub-assets/classroom/bag.webp',
        focus: 'his (ของเขาผู้ชาย)',
        ruleNote: 'his แสดงความเป็นเจ้าของกระเป๋าของเคน (ผู้ชายคนเดียว)'
      },
      {
        en: 'Lisa rides <span class="grammar-token">her</span> new bicycle to school.',
        th: 'ลิซ่าปั่นจักรยานคันใหม่ของเธอไปโรงเรียน',
        img: '/games/english/vocab-hub-assets/transportation/bicycle.webp',
        focus: 'her (ของเธอผู้หญิง)',
        ruleNote: 'her แสดงความเป็นเจ้าของจักรยานของลิซ่า (ผู้หญิงคนเดียว)'
      },
      {
        en: 'The students love <span class="grammar-token">their</span> kind teacher.',
        th: 'นักเรียนทุกคนรักคุณครูใจดีของพวกเขา',
        img: '/games/english/vocab-hub-assets/jobs/teacher.webp',
        focus: 'their (ของพวกเขา)',
        ruleNote: 'their แสดงความเป็นเจ้าของของคุณครูของกลุ่มนักเรียนหลายคน'
      }
    ]
  },
  {
    id: 'demo',
    name: '4. Demonstratives',
    title: 'This / That / These / Those (คำชี้เฉพาะ)',
    desc: 'ใช้ระบุสิ่งของตามระยะทาง (ใกล้ vs ไกล) และจำนวน (เอกพจน์ vs พหูพจน์):',
    rule: '• This = สิ่งนี้ / คนนี้ (ใกล้ตัว + เอกพจน์ 1 สิ่ง)<br>• That = สิ่งนั้น / คนนั้น (ไกลตัว + เอกพจน์ 1 สิ่ง)<br>• These = เหล่านี้ (ใกล้ตัว + พหูพจน์ 2 สิ่งขึ้นไป)<br>• Those = เหล่านั้น (ไกลตัว + พหูพจน์ 2 สิ่งขึ้นไป)',
    examples: [
      {
        en: '<span class="grammar-token">This</span> is my favorite English book in my hand.',
        th: 'นี่คือหนังสือภาษาอังกฤษเล่มโปรดในมือฉัน',
        img: '/games/english/vocab-hub-assets/classroom/book.webp',
        focus: 'This (ใกล้ + 1 เล่ม)',
        ruleNote: 'หนังสือ 1 เล่มถืออยู่ในมือ (ใกล้ตัว) จึงใช้ This'
      },
      {
        en: 'Look at <span class="grammar-token">that</span> white airplane flying high.',
        th: 'มองดูเครื่องบินสีขาวลำนั้นที่บินอยู่บนฟ้าสิ',
        img: '/games/english/vocab-hub-assets/transportation/airplane.webp',
        focus: 'that (ไกล + 1 ลำ)',
        ruleNote: 'เครื่องบิน 1 ลำบินอยู่สูงบนท้องฟ้า (ไกลตัว) จึงใช้ That'
      },
      {
        en: 'Are <span class="grammar-token">those</span> colorful birds sitting on the tree?',
        th: 'นกหลากสีเหล่านั้นกำลังเกาะอยู่บนต้นไม้ใช่ไหม?',
        img: '/games/english/vocab-hub-assets/birds/parrot.webp',
        focus: 'those (ไกล + หลายตัว)',
        ruleNote: 'นกหลายตัวเกาะอยู่บนต้นไม้ไกลออกไป จึงใช้ Those'
      }
    ]
  },
  {
    id: 'prep',
    name: '5. Prepositions',
    title: 'Prepositions of Place (คำบุพบทบอกตำแหน่ง)',
    desc: 'ใช้ระบุตำแหน่งพิกัดของคน สัตว์ และสิ่งของในพื้นที่:',
    rule: '• in = ใน (ข้างในภาชนะ/สถานที่)<br>• on = บน (สัมผัสบนพื้นผิว)<br>• under = ใต้ (อยู่ข้างล่าง)<br>• behind = ข้างหลัง | in front of = ข้างหน้า<br>• between = ระหว่าง (อยู่ตรงกลางสองสิ่ง: between A and B)<br>• next to = ติดกัน / ข้างๆ',
    examples: [
      {
        en: 'The sleepy cat is resting <span class="grammar-token">under</span> the chair.',
        th: 'แมวง่วงนอนกำลังพักผ่อนอยู่ใต้เก้าอี้',
        img: '/games/english/vocab-hub-assets/classroom/chair.webp',
        focus: 'under (ข้างใต้)',
        ruleNote: 'under ใช้บอกว่าตัวแมวอยู่ใต้โครงเก้าอี้'
      },
      {
        en: 'The basketball is <span class="grammar-token">in</span> the big box.',
        th: 'ลูกบาสเกตบอลอยู่ในกล่องใบใหญ่',
        img: '/games/english/vocab-hub-assets/sports/basketball.webp',
        focus: 'in (ข้างใน)',
        ruleNote: 'in ใช้บอกว่าลูกบอลอยู่ภายในขอบเขตของกล่อง'
      },
      {
        en: 'The school bus stops <span class="grammar-token">in front of</span> the school gate.',
        th: 'รถโรงเรียนจอดอยู่ด้านหน้าประตูโรงเรียน',
        img: '/games/english/vocab-hub-assets/transportation/bus.webp',
        focus: 'in front of (ข้างหน้า)',
        ruleNote: 'in front of บอกตำแหน่งด้านหน้าของประตูโรงเรียน'
      }
    ]
  },
  {
    id: 'helping',
    name: '6. Do / Does / Can',
    title: 'Helping Verbs & Questions (กริยาช่วย)',
    desc: 'ใช้สร้างประโยคคำถาม ประโยคปฏิเสธ และบอกความสามารถ:',
    rule: '• Do + I / You / We / They (เช่น Do you like...?)<br>• Does + He / She / It (เช่น Does she eat...?)<br>• Can + ประธานทุกตัว (แปลว่า สามารถ/ทำได้ ตามด้วยกริยารูปเดิม)',
    examples: [
      {
        en: '<span class="grammar-token">Do</span> you like sweet ice cream?',
        th: 'คุณชอบไอศกรีมหวานๆ ไหม?',
        img: '/games/english/vocab-hub-assets/food/ice-cream.webp',
        focus: 'Do you (คำถาม)',
        ruleNote: 'ประธาน you ในประโยคคำถามปัจจุบันต้องขึ้นต้นด้วย Do'
      },
      {
        en: '<span class="grammar-token">Does</span> he read stories every night?',
        th: 'เขาอ่านนิทานทุกๆ คืนใช่ไหม?',
        img: '/games/english/vocab-hub-assets/verbs/read.webp',
        focus: 'Does he (เอกพจน์)',
        ruleNote: 'ประธาน he เป็นเอกพจน์ จึงใช้กริยาช่วย Does ในคำถาม'
      },
      {
        en: 'Parrots <span class="grammar-token">can</span> speak simple human words.',
        th: 'นกแก้วสามารถพูดเลียนคำง่ายๆ ของมนุษย์ได้',
        img: '/games/english/vocab-hub-assets/birds/parrot.webp',
        focus: 'can speak (สามารถทำได้)',
        ruleNote: 'can บอกความสามารถ ตามด้วยกริยาช่อง 1 (speak) ไม่ต้องเติม s'
      }
    ]
  }
];
