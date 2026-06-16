/* data.js — เนื้อหาเรื่องอ่านทั้งหมดของ "📖 Reading Quest"
   4 เรื่อง · แต่ละเรื่องมี 3-4 บท · แต่ละบท 2 คำถาม + คำศัพท์ highlight */
window.GAME_DATA = {
  STORIES: [
    /* ════════════════════════════════════════
       Story 1: The Lost Puppy (Easy)
       ════════════════════════════════════════ */
    {
      id: 'lost-puppy',
      title: 'The Lost Puppy',
      titleTh: 'ลูกสุนัขหลงทาง',
      emoji: '🐶',
      difficulty: 'Easy',
      diffColor: '#22c55e',
      chapters: [
        {
          title: 'Chapter 1: A Friend in the Park',
          text: 'One sunny morning, a boy named Tom went to the park with his mom. He saw beautiful flowers and tall trees. Then he heard a small sound. "Woof! Woof!" Under a big tree, Tom found a little puppy. The puppy was brown and white. It looked sad and lost. It had no collar and no owner nearby. Tom picked up the puppy gently. "Don\'t worry, little friend," Tom said. "I will help you."',
          scene: 'park',
          vocab: [
            { word: 'park', thai: 'สวนสาธารณะ', emoji: '🌳' },
            { word: 'puppy', thai: 'ลูกสุนัข', emoji: '🐶' },
            { word: 'found', thai: 'พบ / เจอ', emoji: '🔍' },
            { word: 'lost', thai: 'หลงทาง', emoji: '😢' },
            { word: 'collar', thai: 'ปลอกคอ', emoji: '⭕' },
          ],
          questions: [
            {
              q: 'Where did Tom find the puppy?',
              thai: 'ทอมพบลูกสุนัขที่ไหน?',
              options: ['At school', 'In the park', 'At home'],
              answer: 1
            },
            {
              q: 'What did the puppy look like?',
              thai: 'ลูกสุนัขมีลักษณะอย่างไร?',
              options: ['Black and big', 'Brown and white', 'Gray and fluffy'],
              answer: 1
            }
          ]
        },
        {
          title: 'Chapter 2: Taking Care',
          text: 'Tom took the puppy home. His mom said, "We can take care of it until we find the owner." Tom gave the puppy some water and food. The puppy was very hungry! It ate all the food quickly. Tom made a soft bed from an old blanket. The puppy was happy and wagged its tail. Tom gave it a bath because it was dirty. After the bath, the puppy looked beautiful. Tom named it "Buddy" and played with it all afternoon.',
          scene: 'home',
          vocab: [
            { word: 'owner', thai: 'เจ้าของ', emoji: '👤' },
            { word: 'hungry', thai: 'หิว', emoji: '😋' },
            { word: 'blanket', thai: 'ผ้าห่ม', emoji: '🛏️' },
            { word: 'happy', thai: 'มีความสุข', emoji: '😊' },
            { word: 'bath', thai: 'อาบน้ำ', emoji: '🛁' },
          ],
          questions: [
            {
              q: 'What did Tom give the puppy first?',
              thai: 'ทอมให้อะไรลูกสุนัขเป็นอย่างแรก?',
              options: ['A toy', 'Water and food', 'A collar'],
              answer: 1
            },
            {
              q: 'What name did Tom give the puppy?',
              thai: 'ทอมตั้งชื่อลูกสุนัขว่าอะไร?',
              options: ['Lucky', 'Buddy', 'Max'],
              answer: 1
            }
          ]
        },
        {
          title: 'Chapter 3: Going Home',
          text: 'The next day, Tom and his mom put up signs around the neighborhood. The signs said "Found: Small brown and white puppy." Soon, a girl named Lily came to their house. She was very sad. "That\'s my puppy! His name is Peanut!" she said. "I lost him yesterday at the park." Lily hugged Peanut and cried happy tears. "Thank you so much, Tom!" she said. Tom was a little sad to say goodbye, but he was glad Peanut found his real home. Lily said, "You can visit Peanut anytime!" Tom smiled. He made a new friend too.',
          scene: 'neighborhood',
          vocab: [
            { word: 'signs', thai: 'ป้าย', emoji: '📋' },
            { word: 'neighborhood', thai: 'ละแวกบ้าน', emoji: '🏘️' },
            { word: 'sad', thai: 'เศร้า', emoji: '😢' },
            { word: 'goodbye', thai: 'ลาก่อน', emoji: '👋' },
            { word: 'friend', thai: 'เพื่อน', emoji: '🤝' },
          ],
          questions: [
            {
              q: 'Who was the puppy\'s real owner?',
              thai: 'ใครเป็นเจ้าของตัวจริงของลูกสุนัข?',
              options: ['Tom\'s mom', 'A girl named Lily', 'The park keeper'],
              answer: 1
            },
            {
              q: 'What was the puppy\'s real name?',
              thai: 'ชื่อจริงของลูกสุนัขคืออะไร?',
              options: ['Buddy', 'Lucky', 'Peanut'],
              answer: 2
            }
          ]
        }
      ]
    },

    /* ════════════════════════════════════════
       Story 2: The Magic Garden (Easy-Medium)
       ════════════════════════════════════════ */
    {
      id: 'magic-garden',
      title: 'The Magic Garden',
      titleTh: 'สวนมหัศจรรย์',
      emoji: '🌻',
      difficulty: 'Easy-Medium',
      diffColor: '#eab308',
      chapters: [
        {
          title: 'Chapter 1: The Hidden Place',
          text: 'Lily lived in a small house with a big backyard. One day, she was playing near the old fence behind her house. She noticed a small wooden door hidden behind some bushes. Lily opened the door slowly. Behind it was the most beautiful garden she had ever seen! There were colorful flowers everywhere — red roses, yellow sunflowers, and purple tulips. A small stream of clear water flowed through the middle. Butterflies danced in the warm sunshine. "Wow!" said Lily. "This is amazing!"',
          scene: 'garden',
          vocab: [
            { word: 'garden', thai: 'สวน', emoji: '🌿' },
            { word: 'flowers', thai: 'ดอกไม้', emoji: '🌸' },
            { word: 'beautiful', thai: 'สวยงาม', emoji: '✨' },
            { word: 'sunshine', thai: 'แสงแดด', emoji: '☀️' },
            { word: 'hidden', thai: 'ซ่อนอยู่', emoji: '🔮' },
          ],
          questions: [
            {
              q: 'Where did Lily find the garden?',
              thai: 'ลิลลี่พบสวนที่ไหน?',
              options: ['At school', 'Behind her house', 'In the forest'],
              answer: 1
            },
            {
              q: 'What was flowing through the garden?',
              thai: 'มีอะไรไหลผ่านสวน?',
              options: ['A river of milk', 'A stream of clear water', 'A river of juice'],
              answer: 1
            }
          ]
        },
        {
          title: 'Chapter 2: The Talking Flowers',
          text: 'Lily visited the garden every day. One morning, something amazing happened. "Good morning, Lily!" said a sunflower. Lily jumped in surprise! "You can talk?" she asked. "Of course!" said the rose. "All flowers can talk, but only kind children can hear us." The tulip said, "We have been waiting for someone to take care of our garden. It has been lonely here." Lily felt special. She promised to help them. The flowers sang a happy song together, and Lily danced with the butterflies.',
          scene: 'garden-talk',
          vocab: [
            { word: 'surprise', thai: 'ประหลาดใจ', emoji: '😲' },
            { word: 'kind', thai: 'ใจดี', emoji: '💖' },
            { word: 'lonely', thai: 'เหงา', emoji: '😔' },
            { word: 'promised', thai: 'สัญญา', emoji: '🤞' },
            { word: 'sang', thai: 'ร้องเพลง', emoji: '🎵' },
          ],
          questions: [
            {
              q: 'Who can hear the flowers talk?',
              thai: 'ใครสามารถได้ยินดอกไม้พูดได้?',
              options: ['All people', 'Only kind children', 'Only adults'],
              answer: 1
            },
            {
              q: 'What did the flowers want Lily to do?',
              thai: 'ดอกไม้ต้องการให้ลิลลี่ทำอะไร?',
              options: ['Pick them', 'Take care of the garden', 'Sell them'],
              answer: 1
            }
          ]
        },
        {
          title: 'Chapter 3: Growing Together',
          text: 'Lily learned to take care of the garden. Every morning, she watered the flowers. She pulled out the weeds and planted new seeds. The sunflower taught her, "We need water, sunshine, and love to grow." As the weeks went by, the garden grew even more beautiful. New flowers bloomed in many colors. Lily\'s mom noticed that Lily was happier and kinder than before. "This garden taught me that when you take care of something with love, it grows," Lily told her mom. The secret garden was Lily\'s favorite place in the whole world.',
          scene: 'garden-grow',
          vocab: [
            { word: 'watered', thai: 'รดน้ำ', emoji: '💧' },
            { word: 'seeds', thai: 'เมล็ดพันธุ์', emoji: '🌱' },
            { word: 'grow', thai: 'เติบโต', emoji: '🌿' },
            { word: 'bloomed', thai: 'ผลิบาน', emoji: '🌺' },
            { word: 'love', thai: 'ความรัก', emoji: '❤️' },
          ],
          questions: [
            {
              q: 'What do flowers need to grow?',
              thai: 'ดอกไม้ต้องการอะไรเพื่อเติบโต?',
              options: ['Only water', 'Water, sunshine, and love', 'Only sunshine'],
              answer: 1
            },
            {
              q: 'What did the garden teach Lily?',
              thai: 'สวนสอนอะไรให้ลิลลี่?',
              options: ['How to cook', 'Taking care with love makes things grow', 'How to draw'],
              answer: 1
            }
          ]
        }
      ]
    },

    /* ════════════════════════════════════════
       Story 3: A Day at the Market (Medium)
       ════════════════════════════════════════ */
    {
      id: 'market-day',
      title: 'A Day at the Market',
      titleTh: 'วันหนึ่งที่ตลาด',
      emoji: '🏪',
      difficulty: 'Medium',
      diffColor: '#f59e0b',
      chapters: [
        {
          title: 'Chapter 1: The Morning Market',
          text: 'It was Saturday morning. Mom woke up Nid early. "Let\'s go to the market!" she said. Nid was excited because she loved the morning market. It was always busy and full of interesting things. When they arrived, Nid could smell delicious food cooking. There were many stalls selling fresh fruits, vegetables, meat, and fish. "First, let\'s buy some vegetables," Mom said. They walked past a stall with beautiful fresh flowers. An old woman was selling jasmine garlands. "Sawadee ka!" the woman smiled.',
          scene: 'market',
          vocab: [
            { word: 'market', thai: 'ตลาด', emoji: '🏪' },
            { word: 'fresh', thai: 'สด', emoji: '🥬' },
            { word: 'vegetables', thai: 'ผัก', emoji: '🥕' },
            { word: 'stalls', thai: 'แผงลอย', emoji: '🏬' },
            { word: 'delicious', thai: 'อร่อย', emoji: '😋' },
          ],
          questions: [
            {
              q: 'What day did they go to the market?',
              thai: 'พวกเขาไปตลาดวันอะไร?',
              options: ['Sunday', 'Saturday', 'Monday'],
              answer: 1
            },
            {
              q: 'What did Mom want to buy first?',
              thai: 'แม่ต้องการซื้ออะไรก่อน?',
              options: ['Fruits', 'Flowers', 'Vegetables'],
              answer: 2
            }
          ]
        },
        {
          title: 'Chapter 2: Shopping Together',
          text: 'Mom and Nid went to the vegetable stall. They bought green beans, carrots, and tomatoes. "Can I choose the fruits?" Nid asked. "Of course!" said Mom. Nid picked the sweetest mangoes, a big watermelon, and some small bananas. Then they went to the fish stall. Mom chose two big fresh fish. "These will be perfect for tom yum!" Mom said. Nid also saw a stall selling coconut ice cream. "Can I have one, please?" she asked. Mom laughed and bought her a coconut ice cream. Nid was so happy!',
          scene: 'market-shop',
          vocab: [
            { word: 'fruits', thai: 'ผลไม้', emoji: '🍎' },
            { word: 'mangoes', thai: 'มะม่วง', emoji: '🥭' },
            { word: 'fish', thai: 'ปลา', emoji: '🐟' },
            { word: 'chose', thai: 'เลือก', emoji: '👆' },
            { word: 'bought', thai: 'ซื้อ', emoji: '💰' },
          ],
          questions: [
            {
              q: 'What fruits did Nid choose?',
              thai: 'นิดเลือกผลไม้อะไรบ้าง?',
              options: ['Apples and oranges', 'Mangoes, watermelon, and bananas', 'Grapes and strawberries'],
              answer: 1
            },
            {
              q: 'What did Mom want to cook with the fish?',
              thai: 'แม่จะเอาปลาไปทำอะไร?',
              options: ['Fried fish', 'Tom yum', 'Fish soup'],
              answer: 1
            }
          ]
        },
        {
          title: 'Chapter 3: Cooking Together',
          text: 'When they got home, Mom and Nid started cooking. Mom washed the vegetables while Nid helped cut the fruits. Mom made tom yum with the fresh fish. It smelled amazing! Nid helped make a simple salad with tomatoes and carrots. She also arranged the fruits on a big plate. "You are a great helper, Nid!" Mom said. They set the table together. When Dad came home, he was surprised. "What a wonderful lunch!" he said. They all sat down and ate together. The food was delicious because it was fresh from the market and made with love.',
          scene: 'kitchen',
          vocab: [
            { word: 'cook', thai: 'ทำอาหาร', emoji: '👩‍🍳' },
            { word: 'washed', thai: 'ล้าง', emoji: '🚿' },
            { word: 'salad', thai: 'สลัด', emoji: '🥗' },
            { word: 'wonderful', thai: 'วิเศษ', emoji: '🤩' },
            { word: 'together', thai: 'ด้วยกัน', emoji: '👨‍👩‍👧' },
          ],
          questions: [
            {
              q: 'What did Nid help make?',
              thai: 'นิดช่วยทำอะไร?',
              options: ['Tom yum', 'A salad and arranged fruits', 'Fried rice'],
              answer: 1
            },
            {
              q: 'Why was the food delicious?',
              thai: 'ทำไมอาหารถึงอร่อย?',
              options: ['It was expensive', 'It was from a restaurant', 'It was fresh and made with love'],
              answer: 2
            }
          ]
        }
      ]
    },

    /* ════════════════════════════════════════
       Story 4: The Brave Little Bird (Medium-Hard)
       ════════════════════════════════════════ */
    {
      id: 'brave-bird',
      title: 'The Brave Little Bird',
      titleTh: 'นกน้อยผู้กล้าหาญ',
      emoji: '🐦',
      difficulty: 'Medium-Hard',
      diffColor: '#ef4444',
      chapters: [
        {
          title: 'Chapter 1: Time to Fly',
          text: 'In a tall oak tree, there lived a small bird named Pip. Pip had bright blue feathers and tiny wings. Autumn was coming, and the leaves were turning orange and red. "It\'s time to fly south for winter," said Pip\'s mother. "The journey is long, but we must go where it is warm." Pip was scared. He had never flown so far before. His wings were small and he was the youngest bird in the family. "What if I can\'t make it?" Pip asked. His mother smiled. "You are braver than you think, little one. Just keep flying and never give up."',
          scene: 'tree',
          vocab: [
            { word: 'brave', thai: 'กล้าหาญ', emoji: '💪' },
            { word: 'feathers', thai: 'ขนนก', emoji: '🪶' },
            { word: 'journey', thai: 'การเดินทาง', emoji: '🗺️' },
            { word: 'south', thai: 'ทิศใต้', emoji: '⬇️' },
            { word: 'winter', thai: 'ฤดูหนาว', emoji: '❄️' },
            { word: 'scared', thai: 'กลัว', emoji: '😨' },
          ],
          questions: [
            {
              q: 'Why did the birds need to fly south?',
              thai: 'ทำไมนกต้องบินไปทางใต้?',
              options: ['To find food', 'Because winter was coming', 'To visit friends'],
              answer: 1
            },
            {
              q: 'Why was Pip scared?',
              thai: 'ทำไมพิพถึงกลัว?',
              options: ['He was sick', 'He had never flown so far', 'He didn\'t like the south'],
              answer: 1
            }
          ]
        },
        {
          title: 'Chapter 2: The Big Storm',
          text: 'The birds began their journey early in the morning. Pip flew with his family for many hours. His wings were tired, but he kept going. On the second day, dark clouds filled the sky. A big storm was coming! The wind blew hard, and rain fell heavily. Many birds stopped and hid under trees. Pip was blown away from his family by the strong wind. He was alone in the storm. Pip was very scared, but he remembered his mother\'s words: "Never give up." He found a small cave and waited for the storm to pass. Inside the cave, he was safe and dry.',
          scene: 'storm',
          vocab: [
            { word: 'storm', thai: 'พายุ', emoji: '⛈️' },
            { word: 'wings', thai: 'ปีก', emoji: '🦅' },
            { word: 'cave', thai: 'ถ้ำ', emoji: '🕳️' },
            { word: 'alone', thai: 'อยู่คนเดียว', emoji: '😟' },
            { word: 'strong', thai: 'แรง / แข็งแกร่ง', emoji: '💨' },
          ],
          questions: [
            {
              q: 'What happened on the second day?',
              thai: 'เกิดอะไรขึ้นในวันที่สอง?',
              options: ['They arrived', 'A big storm came', 'They found food'],
              answer: 1
            },
            {
              q: 'Where did Pip hide from the storm?',
              thai: 'พิพหลบพายุที่ไหน?',
              options: ['Under a tree', 'In a cave', 'Behind a rock'],
              answer: 1
            }
          ]
        },
        {
          title: 'Chapter 3: Helping Others',
          text: 'When the storm stopped, Pip flew out of the cave. He saw a baby squirrel stuck on a broken branch over the river. "Help! Help!" the squirrel cried. Pip was small, but he was brave. He flew down and carried the squirrel to safety. "Thank you, little bird!" said the squirrel. Later, Pip found a lost butterfly who couldn\'t find her way. Pip said, "Follow me! I will show you the way south." The butterfly happily followed Pip. Soon, a friendly eagle saw them. "You are very kind, little bird," said the eagle. "Let me carry you on my back. I know the way south." Pip, the squirrel, and the butterfly all rode on the eagle\'s back!',
          scene: 'river',
          vocab: [
            { word: 'stuck', thai: 'ติดอยู่', emoji: '🆘' },
            { word: 'safety', thai: 'ความปลอดภัย', emoji: '🛡️' },
            { word: 'carried', thai: 'พา / แบก', emoji: '🤲' },
            { word: 'butterfly', thai: 'ผีเสื้อ', emoji: '🦋' },
            { word: 'eagle', thai: 'นกอินทรี', emoji: '🦅' },
          ],
          questions: [
            {
              q: 'Who did Pip help first?',
              thai: 'พิพช่วยใครเป็นคนแรก?',
              options: ['A butterfly', 'A baby squirrel', 'An eagle'],
              answer: 1
            },
            {
              q: 'How did they travel south?',
              thai: 'พวกเขาเดินทางไปทางใต้อย่างไร?',
              options: ['They walked', 'On an eagle\'s back', 'By boat'],
              answer: 1
            }
          ]
        },
        {
          title: 'Chapter 4: A New Home',
          text: 'The eagle flew them to a warm, beautiful land in the south. There were green trees, bright flowers, and a big blue lake. Pip\'s family was already there! "Pip! You made it!" his mother cried happily. "We were so worried!" Pip told everyone about his adventure — the storm, the cave, the squirrel, the butterfly, and the eagle. "I was scared, but I didn\'t give up," Pip said proudly. His mother hugged him with her wings. "I told you — you are braver than you think." Pip made many new friends that winter. He learned that being brave doesn\'t mean you are not scared. It means you keep going even when you are afraid.',
          scene: 'lake',
          vocab: [
            { word: 'arrived', thai: 'มาถึง', emoji: '🏁' },
            { word: 'adventure', thai: 'การผจญภัย', emoji: '🗺️' },
            { word: 'proudly', thai: 'อย่างภาคภูมิใจ', emoji: '🏆' },
            { word: 'nest', thai: 'รัง', emoji: '🪺' },
            { word: 'fly', thai: 'บิน', emoji: '🕊️' },
          ],
          questions: [
            {
              q: 'What did Pip learn from his journey?',
              thai: 'พิพได้เรียนรู้อะไรจากการเดินทาง?',
              options: ['How to swim', 'Being brave means not giving up', 'How to build a nest'],
              answer: 1
            },
            {
              q: 'What did Pip find in the south?',
              thai: 'พิพพบอะไรในแดนใต้?',
              options: ['Snow and ice', 'His family and new friends', 'A big city'],
              answer: 1
            }
          ]
        }
      ]
    }
  ]
};
