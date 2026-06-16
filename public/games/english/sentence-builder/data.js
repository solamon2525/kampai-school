/* data.js — เนื้อหาเกม "สร้างประโยค" (sentence-builder)
   แก้/เพิ่มประโยคที่นี่: แต่ละประโยค { words: [...], correct: 'full sentence', thai: 'คำแปลไทย', hint: 'โครงสร้างคำใบ้' }
   เพิ่มหมวดใหม่ = push object { id, label, emoji, sentences:[...] } เข้า CATEGORIES */
window.GAME_DATA = {
  CATEGORIES: [
    /* ═══ 1. Present Simple ═══ */
    { id: 'present', label: 'Present Simple', emoji: '📝', sentences: [
      { words: ['I','go','to','school'], correct: 'I go to school', thai: 'ฉันไปโรงเรียน', hint: 'Subject + Verb + Preposition + Place' },
      { words: ['She','likes','ice','cream'], correct: 'She likes ice cream', thai: 'เธอชอบไอศกรีม', hint: 'Subject + Verb + Object' },
      { words: ['We','play','football','every','day'], correct: 'We play football every day', thai: 'เราเล่นฟุตบอลทุกวัน', hint: 'Subject + Verb + Object + Time' },
      { words: ['He','reads','a','book'], correct: 'He reads a book', thai: 'เขาอ่านหนังสือ', hint: 'Subject + Verb + Article + Object' },
      { words: ['They','eat','rice','for','lunch'], correct: 'They eat rice for lunch', thai: 'พวกเขากินข้าวตอนเที่ยง', hint: 'Subject + Verb + Object + Prep + Time' },
      { words: ['My','cat','drinks','milk'], correct: 'My cat drinks milk', thai: 'แมวของฉันดื่มนม', hint: 'Possessive + Subject + Verb + Object' },
      { words: ['The','sun','rises','in','the','morning'], correct: 'The sun rises in the morning', thai: 'ดวงอาทิตย์ขึ้นในตอนเช้า', hint: 'Article + Subject + Verb + Prep + Article + Time' },
      { words: ['I','have','two','brothers'], correct: 'I have two brothers', thai: 'ฉันมีพี่น้องสองคน', hint: 'Subject + Verb + Number + Object' },
      { words: ['She','walks','to','school','every','morning'], correct: 'She walks to school every morning', thai: 'เธอเดินไปโรงเรียนทุกเช้า', hint: 'Subject + Verb + Prep + Place + Time' },
      { words: ['Birds','fly','in','the','sky'], correct: 'Birds fly in the sky', thai: 'นกบินบนท้องฟ้า', hint: 'Subject + Verb + Prep + Article + Place' },
    ]},

    /* ═══ 2. Past Simple ═══ */
    { id: 'past', label: 'Past Simple', emoji: '⏪', sentences: [
      { words: ['I','went','to','the','park'], correct: 'I went to the park', thai: 'ฉันไปสวนสาธารณะ', hint: 'Subject + Verb(past) + Prep + Article + Place' },
      { words: ['She','ate','a','big','cake'], correct: 'She ate a big cake', thai: 'เธอกินเค้กก้อนใหญ่', hint: 'Subject + Verb(past) + Article + Adj + Object' },
      { words: ['We','played','games','yesterday'], correct: 'We played games yesterday', thai: 'เราเล่นเกมเมื่อวาน', hint: 'Subject + Verb(past) + Object + Time' },
      { words: ['He','saw','a','bird','in','the','tree'], correct: 'He saw a bird in the tree', thai: 'เขาเห็นนกบนต้นไม้', hint: 'Subject + Verb(past) + Article + Object + Prep + Article + Place' },
      { words: ['They','drank','water','after','school'], correct: 'They drank water after school', thai: 'พวกเขาดื่มน้ำหลังเลิกเรียน', hint: 'Subject + Verb(past) + Object + Prep + Time' },
      { words: ['My','mom','cooked','dinner','last','night'], correct: 'My mom cooked dinner last night', thai: 'แม่ทำอาหารเย็นเมื่อคืน', hint: 'Possessive + Subject + Verb(past) + Object + Time' },
      { words: ['I','studied','English','at','home'], correct: 'I studied English at home', thai: 'ฉันเรียนภาษาอังกฤษที่บ้าน', hint: 'Subject + Verb(past) + Object + Prep + Place' },
      { words: ['The','dog','ran','very','fast'], correct: 'The dog ran very fast', thai: 'สุนัขวิ่งเร็วมาก', hint: 'Article + Subject + Verb(past) + Adv + Adv' },
      { words: ['We','had','fun','at','the','beach'], correct: 'We had fun at the beach', thai: 'เราสนุกที่ชายหาด', hint: 'Subject + Verb(past) + Object + Prep + Article + Place' },
      { words: ['She','sang','a','beautiful','song'], correct: 'She sang a beautiful song', thai: 'เธอร้องเพลงเพราะ', hint: 'Subject + Verb(past) + Article + Adj + Object' },
    ]},

    /* ═══ 3. Future (will) ═══ */
    { id: 'future', label: 'Future (will)', emoji: '🚀', sentences: [
      { words: ['I','will','go','to','the','zoo'], correct: 'I will go to the zoo', thai: 'ฉันจะไปสวนสัตว์', hint: 'Subject + will + Verb + Prep + Article + Place' },
      { words: ['She','will','eat','lunch','at','school'], correct: 'She will eat lunch at school', thai: 'เธอจะกินข้าวเที่ยงที่โรงเรียน', hint: 'Subject + will + Verb + Object + Prep + Place' },
      { words: ['We','will','play','together','tomorrow'], correct: 'We will play together tomorrow', thai: 'เราจะเล่นด้วยกันพรุ่งนี้', hint: 'Subject + will + Verb + Adverb + Time' },
      { words: ['He','will','read','a','new','book'], correct: 'He will read a new book', thai: 'เขาจะอ่านหนังสือเล่มใหม่', hint: 'Subject + will + Verb + Article + Adj + Object' },
      { words: ['They','will','visit','their','grandma'], correct: 'They will visit their grandma', thai: 'พวกเขาจะไปเยี่ยมคุณยาย', hint: 'Subject + will + Verb + Possessive + Object' },
      { words: ['I','will','be','a','good','student'], correct: 'I will be a good student', thai: 'ฉันจะเป็นนักเรียนที่ดี', hint: 'Subject + will + be + Article + Adj + Object' },
      { words: ['We','will','have','a','party','next','week'], correct: 'We will have a party next week', thai: 'เราจะจัดปาร์ตี้สัปดาห์หน้า', hint: 'Subject + will + Verb + Article + Object + Time' },
      { words: ['She','will','help','her','friends'], correct: 'She will help her friends', thai: 'เธอจะช่วยเพื่อนๆ ของเธอ', hint: 'Subject + will + Verb + Possessive + Object' },
      { words: ['It','will','rain','tomorrow','morning'], correct: 'It will rain tomorrow morning', thai: 'ฝนจะตกพรุ่งนี้เช้า', hint: 'Subject + will + Verb + Time' },
      { words: ['My','dad','will','buy','a','new','car'], correct: 'My dad will buy a new car', thai: 'พ่อจะซื้อรถใหม่', hint: 'Possessive + Subject + will + Verb + Article + Adj + Object' },
    ]},

    /* ═══ 4. Questions ═══ */
    { id: 'questions', label: 'Questions', emoji: '❓', sentences: [
      { words: ['Do','you','like','English?'], correct: 'Do you like English?', thai: 'คุณชอบภาษาอังกฤษไหม?', hint: 'Do + Subject + Verb + Object?' },
      { words: ['What','is','your','name?'], correct: 'What is your name?', thai: 'คุณชื่ออะไร?', hint: 'Wh-word + Verb + Possessive + Object?' },
      { words: ['Where','do','you','live?'], correct: 'Where do you live?', thai: 'คุณอยู่ที่ไหน?', hint: 'Wh-word + do + Subject + Verb?' },
      { words: ['How','old','are','you?'], correct: 'How old are you?', thai: 'คุณอายุเท่าไหร่?', hint: 'How + Adj + Verb + Subject?' },
      { words: ['Can','you','swim','in','the','pool?'], correct: 'Can you swim in the pool?', thai: 'คุณว่ายน้ำในสระได้ไหม?', hint: 'Can + Subject + Verb + Prep + Article + Place?' },
      { words: ['Is','she','your','sister?'], correct: 'Is she your sister?', thai: 'เธอเป็นพี่สาว/น้องสาวของคุณหรือเปล่า?', hint: 'Verb + Subject + Possessive + Object?' },
      { words: ['What','time','do','you','wake','up?'], correct: 'What time do you wake up?', thai: 'คุณตื่นนอนกี่โมง?', hint: 'Wh-word + Noun + do + Subject + Verb + Particle?' },
      { words: ['Does','he','play','the','guitar?'], correct: 'Does he play the guitar?', thai: 'เขาเล่นกีตาร์ไหม?', hint: 'Does + Subject + Verb + Article + Object?' },
      { words: ['Where','is','the','library?'], correct: 'Where is the library?', thai: 'ห้องสมุดอยู่ที่ไหน?', hint: 'Wh-word + Verb + Article + Object?' },
      { words: ['How','many','pets','do','you','have?'], correct: 'How many pets do you have?', thai: 'คุณมีสัตว์เลี้ยงกี่ตัว?', hint: 'How + Adj + Object + do + Subject + Verb?' },
    ]},

    /* ═══ 5. Negatives ═══ */
    { id: 'negatives', label: 'Negatives', emoji: '🚫', sentences: [
      { words: ['I','do','not','like','snakes'], correct: 'I do not like snakes', thai: 'ฉันไม่ชอบงู', hint: 'Subject + do + not + Verb + Object' },
      { words: ['She','does','not','eat','meat'], correct: 'She does not eat meat', thai: 'เธอไม่กินเนื้อสัตว์', hint: 'Subject + does + not + Verb + Object' },
      { words: ['We','cannot','fly','like','birds'], correct: 'We cannot fly like birds', thai: 'เราบินเหมือนนกไม่ได้', hint: 'Subject + cannot + Verb + Prep + Object' },
      { words: ['He','did','not','go','to','school'], correct: 'He did not go to school', thai: 'เขาไม่ได้ไปโรงเรียน', hint: 'Subject + did + not + Verb + Prep + Place' },
      { words: ['They','do','not','have','a','car'], correct: 'They do not have a car', thai: 'พวกเขาไม่มีรถยนต์', hint: 'Subject + do + not + Verb + Article + Object' },
      { words: ['I','am','not','hungry','now'], correct: 'I am not hungry now', thai: 'ฉันไม่หิวตอนนี้', hint: 'Subject + am + not + Adj + Time' },
      { words: ['It','is','not','cold','today'], correct: 'It is not cold today', thai: 'วันนี้ไม่หนาว', hint: 'Subject + is + not + Adj + Time' },
      { words: ['She','will','not','come','to','the','party'], correct: 'She will not come to the party', thai: 'เธอจะไม่มางานเลี้ยง', hint: 'Subject + will + not + Verb + Prep + Article + Object' },
      { words: ['We','did','not','finish','our','homework'], correct: 'We did not finish our homework', thai: 'เราทำการบ้านไม่เสร็จ', hint: 'Subject + did + not + Verb + Possessive + Object' },
      { words: ['The','cat','does','not','like','water'], correct: 'The cat does not like water', thai: 'แมวไม่ชอบน้ำ', hint: 'Article + Subject + does + not + Verb + Object' },
    ]},
  ],
};
