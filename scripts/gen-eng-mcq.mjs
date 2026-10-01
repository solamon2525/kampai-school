// scripts/gen-eng-mcq.mjs
// Generates 150 Grade 4 English MCQ questions

export function generateEngMcq() {
  const list = [];

  function add(topic, diff, bloom, text, options, ansIdx, exp, code, desc) {
    list.push({
      topic,
      difficulty: diff,
      bloom,
      text,
      options,
      answer: String(ansIdx),
      explanation: exp,
      indicator_code: code || 'ต 1.1 ป.4/2',
      indicator_desc: desc || 'อ่านออกเสียงคำ สะกดคำ อ่านกลุ่มคำ ประโยค'
    });
  }

  // 1. Everyday Vocabulary & School Life (30 ข้อ)
  const vocabItems = [
    { q: 'Where do students borrow books at school?', correct: 'Library', wrong: ['Canteen', 'Gym', 'Playground'] },
    { q: 'Where do students eat lunch at school?', correct: 'Canteen', wrong: ['Library', 'Computer room', 'Restroom'] },
    { q: 'What object do you use to erase pencil marks?', correct: 'Eraser', wrong: ['Ruler', 'Scissors', 'Glue'] },
    { q: 'What do you use to measure the length of a line?', correct: 'Ruler', wrong: ['Pencil sharpener', 'Stapler', 'Crayon'] },
    { q: 'What do you use to cut paper into pieces?', correct: 'Scissors', wrong: ['Glue', 'Tape', 'Notebook'] },
    { q: 'Who teaches you English and Math at school?', correct: 'Teacher', wrong: ['Doctor', 'Police officer', 'Driver'] },
    { q: 'Who helps sick people in a hospital?', correct: 'Doctor and Nurse', wrong: ['Cook and Waiter', 'Pilot and Driver', 'Farmer and Fisher'] },
    { q: 'Who flies an airplane in the sky?', correct: 'Pilot', wrong: ['Sailor', 'Soldier', 'Mechanic'] },
    { q: 'Who grows rice and vegetables on the farm?', correct: 'Farmer', wrong: ['Engineer', 'Singer', 'Barber'] },
    { q: 'Which room in a house is used for sleeping?', correct: 'Bedroom', wrong: ['Kitchen', 'Bathroom', 'Living room'] },
    { q: 'Which room in a house is used for cooking meals?', correct: 'Kitchen', wrong: ['Garage', 'Bedroom', 'Balcony'] },
    { q: 'Which animal is known as "man\'s best friend"?', correct: 'Dog', wrong: ['Tiger', 'Snake', 'Crocodile'] },
    { q: 'Which animal has a very long neck and eats leaves from tall trees?', correct: 'Giraffe', wrong: ['Elephant', 'Zebra', 'Hippo'] },
    { q: 'Which animal is the largest land mammal with a long trunk?', correct: 'Elephant', wrong: ['Rhino', 'Lion', 'Bear'] },
    { q: 'What day comes after Tuesday?', correct: 'Wednesday', wrong: ['Monday', 'Thursday', 'Friday'] },
    { q: 'What day comes before Sunday?', correct: 'Saturday', wrong: ['Friday', 'Monday', 'Thursday'] },
    { q: 'How many months are there in a year?', correct: '12 months', wrong: ['10 months', '7 months', '24 months'] },
    { q: 'Which month is the first month of the year?', correct: 'January', wrong: ['February', 'December', 'April'] },
    { q: 'Which month comes after October?', correct: 'November', wrong: ['September', 'December', 'August'] },
    { q: 'What clothing do you wear on your feet before putting on shoes?', correct: 'Socks', wrong: ['Gloves', 'Hat', 'Belt'] },
    { q: 'What do you wear to protect your eyes from the bright sun?', correct: 'Sunglasses', wrong: ['Earrings', 'Watch', 'Necklace'] },
    { q: 'Which fruit is red and has small seeds on the outside?', correct: 'Strawberry', wrong: ['Watermelon', 'Banana', 'Mango'] },
    { q: 'Which drink comes from cows and makes bones strong?', correct: 'Milk', wrong: ['Coffee', 'Soda', 'Tea'] },
    { q: 'What part of your body do you use to smell flowers?', correct: 'Nose', wrong: ['Eyes', 'Ears', 'Mouth'] },
    { q: 'What part of your body do you use to hear sounds?', correct: 'Ears', wrong: ['Tongue', 'Hands', 'Feet'] },
    { q: 'What part of your body do you use to see things?', correct: 'Eyes', wrong: ['Nose', 'Teeth', 'Knees'] },
    { q: 'Which subject teaches you about numbers, shapes, and equations?', correct: 'Mathematics', wrong: ['Art', 'History', 'Music'] },
    { q: 'Which subject teaches you how to draw, paint, and color pictures?', correct: 'Art', wrong: ['Science', 'Physical Education', 'Social Studies'] },
    { q: 'What do you call your father\'s brother?', correct: 'Uncle', wrong: ['Aunt', 'Cousin', 'Grandfather'] },
    { q: 'What do you call your mother\'s sister?', correct: 'Aunt', wrong: ['Uncle', 'Niece', 'Nephew'] }
  ];

  vocabItems.forEach((item, idx) => {
    const opts = [item.correct, ...item.wrong].sort(() => 0.5 - ((idx * 3) % 2));
    const ans = opts.indexOf(item.correct);
    add('Everyday Vocabulary', idx % 3 === 0 ? 'easy' : (idx % 3 === 1 ? 'medium' : 'hard'), 'L1', item.q, opts, ans, `Correct answer is: ${item.correct}`, 'ต 1.1 ป.4/2', 'อ่านออกเสียงคำและสะกดคำ');
  });

  // 2. Tenses & Grammar (30 ข้อ)
  const grammarItems = [
    { q: 'He ________ to school by bus every morning.', correct: 'goes', wrong: ['go', 'going', 'is go'] },
    { q: 'They ________ football in the school field every Friday.', correct: 'play', wrong: ['plays', 'playing', 'played'] },
    { q: 'She ________ like eating spicy food.', correct: 'does not', wrong: ['do not', 'is not', 'are not'] },
    { q: 'We ________ happy to study at Kampai School.', correct: 'are', wrong: ['is', 'am', 'be'] },
    { q: 'I ________ a student in Grade 4.', correct: 'am', wrong: ['is', 'are', 'be'] },
    { q: 'Look! The birds ________ in the sky.', correct: 'are flying', wrong: ['fly', 'is flying', 'flew'] },
    { q: 'Listen! Somchai ________ the guitar right now.', correct: 'is playing', wrong: ['plays', 'are playing', 'played'] },
    { q: 'What are you doing? - I ________ my homework.', correct: 'am doing', wrong: ['do', 'doing', 'is doing'] },
    { q: 'Yesterday, my family ________ to Bangkok.', correct: 'went', wrong: ['go', 'goes', 'going'] },
    { q: 'Last night, Jane ________ a delicious chocolate cake.', correct: 'ate', wrong: ['eat', 'eats', 'eating'] },
    { q: 'Two days ago, I ________ a cute little puppy in the garden.', correct: 'saw', wrong: ['see', 'sees', 'seeing'] },
    { q: 'My mother ________ a new school bag for me yesterday.', correct: 'bought', wrong: ['buy', 'buys', 'buying'] },
    { q: 'He ________ not come to school yesterday because he was sick.', correct: 'did', wrong: ['does', 'do', 'is'] },
    { q: 'There ________ three apples on the table.', correct: 'are', wrong: ['is', 'am', 'be'] },
    { q: 'There ________ a pencil in my pencil case.', correct: 'is', wrong: ['are', 'am', 'were'] },
    { q: 'Does she have a pet dog? - Yes, she ________.', correct: 'does', wrong: ['do', 'has', 'is'] },
    { q: 'Do they like reading cartoons? - No, they ________.', correct: 'do not', wrong: ['does not', 'are not', 'is not'] },
    { q: 'What is the plural form of "knife"?', correct: 'knives', wrong: ['knifes', 'knifees', 'knifis'] },
    { q: 'What is the plural form of "man"?', correct: 'men', wrong: ['mans', 'mens', 'manes'] },
    { q: 'What is the plural form of "foot"?', correct: 'feet', wrong: ['foots', 'feets', 'footies'] },
    { q: 'Which word is the comparative form of "tall"?', correct: 'taller', wrong: ['tallest', 'more tall', 'tallly'] },
    { q: 'An elephant is ________ than a monkey.', correct: 'bigger', wrong: ['big', 'biggest', 'more big'] },
    { q: 'A cheetah is the ________ animal on land.', correct: 'fastest', wrong: ['faster', 'fast', 'most fast'] },
    { q: 'She can ________ English very well.', correct: 'speak', wrong: ['speaks', 'speaking', 'spoke'] },
    { q: 'You must ________ your teeth twice a day.', correct: 'brush', wrong: ['brushes', 'brushing', 'brushed'] },
    { q: 'Tom ________ TV every evening.', correct: 'watches', wrong: ['watch', 'watching', 'watched'] },
    { q: 'My sister always ________ her hands before eating.', correct: 'washes', wrong: ['wash', 'washing', 'washed'] },
    { q: 'The sun ________ in the east.', correct: 'rises', wrong: ['rise', 'rising', 'rose'] },
    { q: 'Water ________ at 100 degrees Celsius.', correct: 'boils', wrong: ['boil', 'boiling', 'boiled'] },
    { q: 'Did you finish your project? - Yes, I ________.', correct: 'did', wrong: ['do', 'does', 'finished'] }
  ];

  grammarItems.forEach((item, idx) => {
    const opts = [item.correct, ...item.wrong].sort(() => 0.5 - ((idx * 3) % 2));
    const ans = opts.indexOf(item.correct);
    add('Tenses and Grammar', idx % 3 === 0 ? 'easy' : (idx % 3 === 1 ? 'medium' : 'hard'), 'L2', item.q, opts, ans, `Correct answer is: ${item.correct}`, 'ต 1.2 ป.4/1', 'พูดและเขียนเพื่อขอและให้ข้อมูล');
  });

  // 3. Prepositions & Articles (20 ข้อ)
  const prepItems = [
    { q: 'The cat is sleeping ________ the sofa.', correct: 'on', wrong: ['at', 'to', 'from'] },
    { q: 'The ball rolled ________ the car.', correct: 'under', wrong: ['on', 'above', 'in'] },
    { q: 'She keeps her pens and pencils ________ her bag.', correct: 'in', wrong: ['at', 'on', 'under'] },
    { q: 'The school library is ________ the science lab.', correct: 'next to', wrong: ['under', 'on', 'inside of'] },
    { q: 'The teacher stands ________ the blackboard.', correct: 'in front of', wrong: ['under', 'inside', 'below'] },
    { q: 'We go to school ________ Monday to Friday.', correct: 'from', wrong: ['at', 'in', 'under'] },
    { q: 'I was born ________ October.', correct: 'in', wrong: ['on', 'at', 'to'] },
    { q: 'My birthday is ________ October 5th.', correct: 'on', wrong: ['in', 'at', 'by'] },
    { q: 'The school bell rings ________ 8:00 AM.', correct: 'at', wrong: ['on', 'in', 'to'] },
    { q: 'He lives ________ Nakhon Ratchasima.', correct: 'in', wrong: ['on', 'at', 'into'] },
    { q: 'She has ________ apple in her lunchbox.', correct: 'an', wrong: ['a', 'the', 'some'] },
    { q: 'There is ________ umbrella behind the door.', correct: 'an', wrong: ['a', 'the', 'two'] },
    { q: 'My brother is ________ honest student.', correct: 'an', wrong: ['a', 'the', 'some'] },
    { q: 'He wants to buy ________ bicycle.', correct: 'a', wrong: ['an', 'the', 'these'] },
    { q: 'Look at ________ moon! It is very bright tonight.', correct: 'the', wrong: ['a', 'an', 'some'] },
    { q: 'She plays ________ piano very well.', correct: 'the', wrong: ['a', 'an', 'any'] },
    { q: 'He likes playing ________ football with his classmates.', correct: '(no article)', wrong: ['the', 'a', 'an'] },
    { q: 'The dog is barking ________ the stranger.', correct: 'at', wrong: ['on', 'in', 'with'] },
    { q: 'We travel to school ________ foot.', correct: 'on', wrong: ['by', 'in', 'with'] },
    { q: 'They go to the city ________ train.', correct: 'by', wrong: ['on', 'in', 'with'] }
  ];

  prepItems.forEach((item, idx) => {
    const opts = [item.correct, ...item.wrong].sort(() => 0.5 - ((idx * 3) % 2));
    const ans = opts.indexOf(item.correct);
    add('Prepositions and Articles', idx % 3 === 0 ? 'easy' : (idx % 3 === 1 ? 'medium' : 'hard'), 'L1', item.q, opts, ans, `Correct answer is: ${item.correct}`, 'ต 1.1 ป.4/2', 'ใช้คำบุพบทและคำนำหน้านามได้ถูกต้อง');
  });

  // 4. Daily Conversations & Expressions (30 ข้อ)
  const convItems = [
    { q: 'What do you say when you meet someone at 8:00 AM?', correct: 'Good morning', wrong: ['Good afternoon', 'Good evening', 'Good night'] },
    { q: 'What do you say when you go to bed at night?', correct: 'Good night', wrong: ['Good morning', 'Good afternoon', 'Good bye'] },
    { q: 'A: "How are you today?" - B: "________"', correct: 'I am fine, thank you.', wrong: ['I am 10 years old.', 'My name is Somchai.', 'I go to school.'] },
    { q: 'A: "Thank you very much for your help!" - B: "________"', correct: 'You are welcome.', wrong: ['I am sorry.', 'Never mind.', 'Good luck.'] },
    { q: 'You accidentally step on someone\'s foot. What should you say?', correct: 'I am so sorry.', wrong: ['Thank you.', 'You are welcome.', 'Congratulations.'] },
    { q: 'A: "May I go to the restroom, please?" - Teacher: "________"', correct: 'Yes, you may.', wrong: ['No, I am not.', 'Yes, I do.', 'Thank you.'] },
    { q: 'A: "Can I borrow your pencil, please?" - B: "________"', correct: 'Sure, here you are.', wrong: ['No, thank you.', 'I am fine.', 'You are welcome.'] },
    { q: 'A: "Nice to meet you." - B: "________"', correct: 'Nice to meet you, too.', wrong: ['I am fine.', 'Good morning.', 'Thank you.'] },
    { q: 'A: "How much is this book?" - B: "________"', correct: 'It is 50 baht.', wrong: ['It is 5 o\'clock.', 'It is blue.', 'It is very big.'] },
    { q: 'A: "What time is it now?" - B: "________"', correct: 'It is half past nine.', wrong: ['It is Monday.', 'It is sunny.', 'It is 20 baht.'] },
    { q: 'A: "How do you go to school?" - B: "________"', correct: 'By bicycle.', wrong: ['At 7 o\'clock.', 'In the classroom.', 'With a book.'] },
    { q: 'A: "What is your favorite color?" - B: "________"', correct: 'I like blue.', wrong: ['I like apples.', 'I like dogs.', 'I like playing game.'] },
    { q: 'A: "Where are you from?" - B: "________"', correct: 'I am from Thailand.', wrong: ['I am a student.', 'I am ten years old.', 'I like Thai food.'] },
    { q: 'Teacher: "Please open your book to page 25." What should students do?', correct: 'Open their book to page 25', wrong: ['Close their book', 'Put the book in their bag', 'Stand up'] },
    { q: 'Teacher: "Be quiet, please." What should students do?', correct: 'Stop talking and keep silent', wrong: ['Shout loudly', 'Run around the room', 'Sing a song'] },
    { q: 'A friend is going to take an important exam. What do you say to him?', correct: 'Good luck!', wrong: ['Happy birthday!', 'Happy New Year!', 'See you yesterday!'] },
    { q: 'Today is your friend\'s birthday. What do you say to her?', correct: 'Happy birthday to you!', wrong: ['Congratulations!', 'Good morning!', 'Get well soon!'] },
    { q: 'Your friend is sick in the hospital. What card message do you send?', correct: 'Get well soon!', wrong: ['Happy birthday!', 'Good night!', 'Welcome!'] },
    { q: 'A: "Would you like some orange juice?" - B: "________, please."', correct: 'Yes', wrong: ['No', 'Never', 'Not'] },
    { q: 'A: "Would you like some more rice?" - B: "________, thank you. I am full."', correct: 'No', wrong: ['Yes', 'Sure', 'Always'] },
    { q: 'A: "What is the weather like today?" - B: "________"', correct: 'It is warm and sunny.', wrong: ['It is 3 o\'clock.', 'It is 100 baht.', 'It is delicious.'] },
    { q: 'A: "Goodbye, see you tomorrow!" - B: "________"', correct: 'See you!', wrong: ['I am sorry.', 'Good morning.', 'Thank you.'] },
    { q: 'A: "Whose bag is this?" - B: "________"', correct: 'It is Mary\'s bag.', wrong: ['It is a bag.', 'It is blue.', 'It is on the table.'] },
    { q: 'A: "How old are you?" - B: "________"', correct: 'I am ten years old.', wrong: ['I am fine.', 'I am in Grade 4.', 'I have two brothers.'] },
    { q: 'A: "What grade are you in?" - B: "________"', correct: 'I am in Grade 4.', wrong: ['I am 10 years old.', 'I am fine.', 'I like English.'] },
    { q: 'A: "What is your father\'s job?" - B: "________"', correct: 'He is a police officer.', wrong: ['He is 40 years old.', 'He is fine.', 'He likes fish.'] },
    { q: 'A: "Can you swim?" - B: "________, I can."', correct: 'Yes', wrong: ['No', 'Not', 'Never'] },
    { q: 'A: "Where is the post office?" - B: "________"', correct: 'It is opposite the bank.', wrong: ['It is 50 baht.', 'It is red.', 'It is 9 o\'clock.'] },
    { q: 'A: "Excuse me, where is the restroom?" - B: "________"', correct: 'Go straight and turn left.', wrong: ['I am fine.', 'Thank you.', 'Yes, please.'] },
    { q: 'What do you say when greeting a teacher at 1:30 PM?', correct: 'Good afternoon, teacher.', wrong: ['Good morning, teacher.', 'Good night, teacher.', 'Good bye.'] }
  ];

  convItems.forEach((item, idx) => {
    const opts = [item.correct, ...item.wrong].sort(() => 0.5 - ((idx * 3) % 2));
    const ans = opts.indexOf(item.correct);
    add('Daily Conversations and Expressions', idx % 3 === 0 ? 'easy' : (idx % 3 === 1 ? 'medium' : 'hard'), 'L2', item.q, opts, ans, `Correct answer is: ${item.correct}`, 'ต 1.2 ป.4/1', 'ใช้ภาษาท่าทางและถ้อยคำในการสื่อสารตามกาลเทศะ');
  });

  // 5. Question Words (Wh-questions) (20 ข้อ)
  const questionWords = [
    { q: '________ is that tall man? - He is our new science teacher.', correct: 'Who', wrong: ['Where', 'What', 'When'] },
    { q: '________ are my glasses? - They are on your desk.', correct: 'Where', wrong: ['Who', 'Why', 'When'] },
    { q: '________ do you go to bed? - At nine o\'clock.', correct: 'When', wrong: ['Where', 'Who', 'Whose'] },
    { q: '________ are you crying? - Because I lost my favorite pen.', correct: 'Why', wrong: ['What', 'Where', 'Who'] },
    { q: '________ is in that big box? - There are fresh fruits.', correct: 'What', wrong: ['Who', 'When', 'Where'] },
    { q: '________ pen is this on the floor? - It is Somchai\'s pen.', correct: 'Whose', wrong: ['Who', 'Which', 'Why'] },
    { q: '________ students are there in your class? - There are 30 students.', correct: 'How many', wrong: ['How much', 'How old', 'How tall'] },
    { q: '________ milk do you want? - Just a glass, please.', correct: 'How much', wrong: ['How many', 'How long', 'How often'] },
    { q: '________ do you visit your grandparents? - Every weekend.', correct: 'How often', wrong: ['How many', 'How much', 'How long'] },
    { q: '________ is the river? - It is about 50 kilometers long.', correct: 'How long', wrong: ['How many', 'How much', 'How old'] },
    { q: '________ is your school bag? - It is the blue one.', correct: 'Which', wrong: ['Who', 'Why', 'Whose'] },
    { q: '________ is your telephone number? - It is 081-234-5678.', correct: 'What', wrong: ['Where', 'Who', 'When'] },
    { q: '________ is your English teacher from? - She is from the UK.', correct: 'Where', wrong: ['What', 'Who', 'When'] },
    { q: '________ do you like English? - Because it is fun and useful.', correct: 'Why', wrong: ['What', 'Where', 'Who'] },
    { q: '________ season do you like best? - I like winter best.', correct: 'Which', wrong: ['Who', 'Whose', 'Where'] },
    { q: '________ is the boy wearing a green cap? - He is Danai.', correct: 'Who', wrong: ['Where', 'What', 'Why'] },
    { q: '________ did you buy at the supermarket? - Some milk and bread.', correct: 'What', wrong: ['Where', 'When', 'Who'] },
    { q: '________ did you go last holiday? - We went to Chiang Mai.', correct: 'Where', wrong: ['When', 'What', 'Who'] },
    { q: '________ old is your little sister? - She is four years old.', correct: 'How', wrong: ['What', 'Where', 'Who'] },
    { q: '________ is that bicycle? - It is 2,500 baht.', correct: 'How much', wrong: ['How many', 'How old', 'How long'] }
  ];

  questionWords.forEach((item, idx) => {
    const opts = [item.correct, ...item.wrong].sort(() => 0.5 - ((idx * 3) % 2));
    const ans = opts.indexOf(item.correct);
    add('Question Words (Wh-questions)', idx % 3 === 0 ? 'easy' : (idx % 3 === 1 ? 'medium' : 'hard'), 'L2', item.q, opts, ans, `Correct answer is: ${item.correct}`, 'ต 1.2 ป.4/1', 'ใช้คำถาม Wh-questions ได้ถูกต้อง');
  });

  // 6. Reading Comprehension & Phonics (20 ข้อ)
  const readingItems = [
    { q: 'Read: "Ben has a brown dog named Lucky. Lucky loves chasing red balls in the park." What color is Lucky\'s ball?', correct: 'Red', wrong: ['Brown', 'Green', 'Yellow'] },
    { q: 'Read: "Ben has a brown dog named Lucky. Lucky loves chasing red balls in the park." What is the dog\'s name?', correct: 'Lucky', wrong: ['Ben', 'Brown', 'Park'] },
    { q: 'Read: "Sarah is a doctor. She works in a children\'s hospital. She helps sick boys and girls get well." Where does Sarah work?', correct: 'In a children\'s hospital', wrong: ['At a school', 'At an airport', 'In a restaurant'] },
    { q: 'Read: "The traffic light is RED." What should drivers do?', correct: 'Stop their cars', wrong: ['Drive fast', 'Turn left immediately', 'Blow the horn'] },
    { q: 'Read the sign: "NO SMOKING". What does this sign mean?', correct: 'You cannot smoke here', wrong: ['You can eat here', 'You must wash your hands', 'You can take photos'] },
    { q: 'Read the sign: "PLEASE KEEP OFF THE GRASS". Where would you see this sign?', correct: 'In a public park or garden', wrong: ['In a swimming pool', 'Inside a bus', 'In an elevator'] },
    { q: 'Read the sign: "QUIET, PLEASE". Where would you most likely see this sign?', correct: 'In a hospital or library', wrong: ['In a football stadium', 'In a night market', 'At an amusement park'] },
    { q: 'Which word has the same initial consonant sound as "chair"?', correct: 'cheese', wrong: ['ship', 'shoes', 'cat'] },
    { q: 'Which word has the sound /ʃ/ (sh)?', correct: 'ship', wrong: ['chip', 'trip', 'lip'] },
    { q: 'Which word rhymes with "cat"?', correct: 'hat', wrong: ['dog', 'car', 'cup'] },
    { q: 'Which word rhymes with "cake"?', correct: 'bake', wrong: ['cook', 'book', 'back'] },
    { q: 'Which word rhymes with "tree"?', correct: 'bee', wrong: ['tea', 'try', 'tie'] },
    { q: 'Which word contains the long vowel sound /i:/?', correct: 'green', wrong: ['pin', 'sit', 'pen'] },
    { q: 'Which word contains the sound /θ/ as in "think"?', correct: 'three', wrong: ['tree', 'free', 'the'] },
    { q: 'Read: "Tom gets up at 6:00 AM. He brushes his teeth and eats breakfast at 6:30 AM." What time does Tom eat breakfast?', correct: 'At 6:30 AM', wrong: ['At 6:00 AM', 'At 7:00 AM', 'At 8:00 AM'] },
    { q: 'Read: "Emma loves animals. She has two cats, three birds, and one goldfish." How many birds does Emma have?', correct: 'Three birds', wrong: ['Two birds', 'One bird', 'Six birds'] },
    { q: 'Read the notice: "DO NOT FEED THE ANIMALS". What are you forbidden to do?', correct: 'Give food to the animals', wrong: ['Take pictures of animals', 'Touch the fence', 'Walk near the animals'] },
    { q: 'Which pair of words are OPPOSITES?', correct: 'clean - dirty', wrong: ['big - large', 'happy - glad', 'small - little'] },
    { q: 'Which pair of words are SYNONYMS (same meaning)?', correct: 'quick - fast', wrong: ['hot - cold', 'tall - short', 'easy - difficult'] },
    { q: 'Which word is spelled correctly?', correct: 'Elephant', wrong: ['Elefant', 'Eliphant', 'Elephunt'] }
  ];

  readingItems.forEach((item, idx) => {
    const opts = [item.correct, ...item.wrong].sort(() => 0.5 - ((idx * 3) % 2));
    const ans = opts.indexOf(item.correct);
    add('Reading Comprehension and Phonics', idx % 3 === 0 ? 'easy' : (idx % 3 === 1 ? 'medium' : 'hard'), 'L2', item.q, opts, ans, `Correct answer is: ${item.correct}`, 'ต 1.1 ป.4/4', 'ตอบคำถามจากการฟังและอ่านประโยค');
  });

  return list;
}
