import fs from 'fs';

const questions = [
  // 1. Jobs & Occupations (1-10)
  {
    id: "e2000000-0000-4000-8000-000000000001",
    img: "/games/english/vocab-hub-assets/jobs/doctor.webp",
    text: "Look at the picture. What does he do?",
    options: ["He is a doctor.", "He is a farmer.", "He is a pilot.", "He is a singer."],
    ans: 0,
    exp: "จากรูปภาพคือคุณหมอ (Doctor) สวมเสื้อกาวน์และหูฟังแพทย์ ประโยคที่ถูกต้องคือ He is a doctor.",
    topic: "Visual Vocabulary: Jobs & Occupations"
  },
  {
    id: "e2000000-0000-4000-8000-000000000002",
    img: "/games/english/vocab-hub-assets/jobs/nurse.webp",
    text: "Look at the picture. Where does she work?",
    options: ["In a school", "In a hospital", "At a police station", "On a farm"],
    ans: 1,
    exp: "จากรูปภาพคือพยาบาล (Nurse) สถานที่ทำงานคือโรงพยาบาล (In a hospital)",
    topic: "Visual Vocabulary: Jobs & Occupations"
  },
  {
    id: "e2000000-0000-4000-8000-000000000003",
    img: "/games/english/vocab-hub-assets/jobs/police-officer.webp",
    text: "Look at the picture. What is his job?",
    options: ["Firefighter", "Police officer", "Teacher", "Dentist"],
    ans: 1,
    exp: "จากรูปภาพคือเจ้าหน้าที่ตำรวจ (Police officer) สวมเครื่องแบบตำรวจ",
    topic: "Visual Vocabulary: Jobs & Occupations"
  },
  {
    id: "e2000000-0000-4000-8000-000000000004",
    img: "/games/english/vocab-hub-assets/jobs/firefighter.webp",
    text: "Look at the picture. What does a firefighter do?",
    options: ["He flies an airplane.", "He catches thieves.", "He puts out fires.", "He cooks meals in a restaurant."],
    ans: 2,
    exp: "จากรูปภาพคือนักดับเพลิง (Firefighter) มีหน้าที่ดับเพลิง (He puts out fires.)",
    topic: "Visual Vocabulary: Jobs & Occupations"
  },
  {
    id: "e2000000-0000-4000-8000-000000000005",
    img: "/games/english/vocab-hub-assets/jobs/chef.webp",
    text: "Look at the picture. What does he do?",
    options: ["He is a chef.", "He is an artist.", "He is a driver.", "He is a doctor."],
    ans: 0,
    exp: "จากรูปภาพคือพ่อครัวหรือเชฟ (Chef) สวมหมวกพ่อครัวสีขาว",
    topic: "Visual Vocabulary: Jobs & Occupations"
  },
  {
    id: "e2000000-0000-4000-8000-000000000006",
    img: "/games/english/vocab-hub-assets/jobs/pilot.webp",
    text: "Look at the picture. What does a pilot fly?",
    options: ["A bus", "A bicycle", "A train", "An airplane"],
    ans: 3,
    exp: "จากรูปภาพคือนักบิน (Pilot) มีหน้าที่ขับเครื่องบิน (An airplane)",
    topic: "Visual Vocabulary: Jobs & Occupations"
  },
  {
    id: "e2000000-0000-4000-8000-000000000007",
    img: "/games/english/vocab-hub-assets/jobs/farmer.webp",
    text: "Look at the picture. Where does the farmer work?",
    options: ["At a supermarket", "On a farm", "At an airport", "In a bank"],
    ans: 1,
    exp: "จากรูปภาพคือชาวนา/เกษตรกร (Farmer) ทำงานในไร่หรือฟาร์ม (On a farm)",
    topic: "Visual Vocabulary: Jobs & Occupations"
  },
  {
    id: "e2000000-0000-4000-8000-000000000008",
    img: "/games/english/vocab-hub-assets/jobs/dentist.webp",
    text: "Look at the picture. Who takes care of your teeth?",
    options: ["A dentist", "A singer", "A driver", "A chef"],
    ans: 0,
    exp: "จากรูปภาพคือทันตแพทย์ (Dentist) เป็นผู้ดูแลรักษาฟัน",
    topic: "Visual Vocabulary: Jobs & Occupations"
  },
  {
    id: "e2000000-0000-4000-8000-000000000009",
    img: "/games/english/vocab-hub-assets/jobs/teacher.webp",
    text: "Look at the picture. What is her job?",
    options: ["She is a pilot.", "She is a teacher.", "She is a farmer.", "She is a police officer."],
    ans: 1,
    exp: "จากรูปภาพคือคุณครู (Teacher) กำลังสอนหนังสือ",
    topic: "Visual Vocabulary: Jobs & Occupations"
  },
  {
    id: "e2000000-0000-4000-8000-000000000010",
    img: "/games/english/vocab-hub-assets/jobs/singer.webp",
    text: "Look at the picture. What does she like doing?",
    options: ["Cooking soup", "Singing songs", "Fixing cars", "Playing chess"],
    ans: 1,
    exp: "จากรูปภาพคือนักร้อง (Singer) ถือไมโครโฟนร้องเพลง (Singing songs)",
    topic: "Visual Vocabulary: Jobs & Occupations"
  },

  // 2. Places in Town (11-20)
  {
    id: "e2000000-0000-4000-8000-000000000011",
    img: "/games/english/vocab-hub-assets/places/hospital.webp",
    text: "Look at the picture. Where do people go when they are sick?",
    options: ["To the zoo", "To the hospital", "To the cinema", "To the park"],
    ans: 1,
    exp: "จากรูปภาพคือโรงพยาบาล (Hospital) มีสัญลักษณ์กากบาทสีแดง",
    topic: "Visual Vocabulary: Places in Town"
  },
  {
    id: "e2000000-0000-4000-8000-000000000012",
    img: "/games/english/vocab-hub-assets/places/library.webp",
    text: "Look at the picture. What can you do in this place?",
    options: ["Swim in water", "Read and borrow books", "Buy clothes", "Watch a movie"],
    ans: 1,
    exp: "จากรูปภาพคือห้องสมุด (Library) มีชั้นหนังสือสำหรับอ่านและยืมหนังสือ",
    topic: "Visual Vocabulary: Places in Town"
  },
  {
    id: "e2000000-0000-4000-8000-000000000013",
    img: "/games/english/vocab-hub-assets/places/zoo.webp",
    text: "Look at the picture. Where can you see wild animals like lions and giraffes?",
    options: ["At the zoo", "At the post office", "At the bank", "At the airport"],
    ans: 0,
    exp: "จากรูปภาพคือสวนสัตว์ (Zoo) ที่มีสัตว์ป่าหลากหลายชนิด",
    topic: "Visual Vocabulary: Places in Town"
  },
  {
    id: "e2000000-0000-4000-8000-000000000014",
    img: "/games/english/vocab-hub-assets/places/school.webp",
    text: "Look at the picture. Where do students study every weekday?",
    options: ["At a restaurant", "At school", "At an airport", "At a market"],
    ans: 1,
    exp: "จากรูปภาพคือโรงเรียน (School) สถานที่ที่นักเรียนมาเรียนหนังสือ",
    topic: "Visual Vocabulary: Places in Town"
  },
  {
    id: "e2000000-0000-4000-8000-000000000015",
    img: "/games/english/vocab-hub-assets/places/market.webp",
    text: "Look at the picture. Where can your mother buy fresh fruits and vegetables?",
    options: ["At the market", "At the library", "At the bank", "At the post office"],
    ans: 0,
    exp: "จากรูปภาพคือตลาด (Market) มีแผงขายผักผลไม้สด",
    topic: "Visual Vocabulary: Places in Town"
  },
  {
    id: "e2000000-0000-4000-8000-000000000016",
    img: "/games/english/vocab-hub-assets/places/bank.webp",
    text: "Look at the picture. What place is this?",
    options: ["A bank", "A park", "A zoo", "A school"],
    ans: 0,
    exp: "จากรูปภาพคือธนาคาร (Bank) สถานที่สำหรับฝาก-ถอนเงิน",
    topic: "Visual Vocabulary: Places in Town"
  },
  {
    id: "e2000000-0000-4000-8000-000000000017",
    img: "/games/english/vocab-hub-assets/places/park.webp",
    text: "Look at the picture. What can children do in the park?",
    options: ["Fly an airplane", "Ride bicycles and play on grass", "Buy medicine", "Deposit money"],
    ans: 1,
    exp: "จากรูปภาพคือสวนสาธารณะ (Park) มีต้นไม้ สนามหญ้า สำหรับวิ่งเล่นและปั่นจักรยาน",
    topic: "Visual Vocabulary: Places in Town"
  },
  {
    id: "e2000000-0000-4000-8000-000000000018",
    img: "/games/english/vocab-hub-assets/places/restaurant.webp",
    text: "Look at the picture. Where do you go to eat dinner with your family?",
    options: ["A restaurant", "A library", "A hospital", "A post office"],
    ans: 0,
    exp: "จากรูปภาพคือร้านอาหาร (Restaurant) มีโต๊ะรับประทานอาหารและเมนู",
    topic: "Visual Vocabulary: Places in Town"
  },
  {
    id: "e2000000-0000-4000-8000-000000000019",
    img: "/games/english/vocab-hub-assets/places/post-office.webp",
    text: "Look at the picture. Where do you send letters and parcels?",
    options: ["At the park", "At the post office", "At the airport", "At the zoo"],
    ans: 1,
    exp: "จากรูปภาพคือที่ทำการไปรษณีย์ (Post office) มีตู้ไปรษณีย์สำหรับส่งจดหมายและพัสดุ",
    topic: "Visual Vocabulary: Places in Town"
  },
  {
    id: "e2000000-0000-4000-8000-000000000020",
    img: "/games/english/vocab-hub-assets/places/airport.webp",
    text: "Look at the picture. What place is this?",
    options: ["An airport", "A market", "A hospital", "A bank"],
    ans: 0,
    exp: "จากรูปภาพคือสนามบิน (Airport) มีรันเวย์และเครื่องบิน",
    topic: "Visual Vocabulary: Places in Town"
  },

  // 3. Actions & Verbs (21-30)
  {
    id: "e2000000-0000-4000-8000-000000000021",
    img: "/games/english/vocab-hub-assets/verbs/cook.webp",
    text: "Look at the picture. What is the boy doing?",
    options: ["He is cooking.", "He is sleeping.", "He is swimming.", "He is singing."],
    ans: 0,
    exp: "จากรูปภาพเด็กผู้ชายกำลังทำอาหาร (He is cooking.)",
    topic: "Visual Grammar: Actions & Verbs"
  },
  {
    id: "e2000000-0000-4000-8000-000000000022",
    img: "/games/english/vocab-hub-assets/verbs/dance.webp",
    text: "Look at the picture. What is the girl doing?",
    options: ["She is writing.", "She is dancing.", "She is eating.", "She is reading."],
    ans: 1,
    exp: "จากรูปภาพเด็กผู้หญิงกำลังเต้นรำอย่างสนุกสนาน (She is dancing.)",
    topic: "Visual Grammar: Actions & Verbs"
  },
  {
    id: "e2000000-0000-4000-8000-000000000023",
    img: "/games/english/vocab-hub-assets/verbs/drink.webp",
    text: "Look at the picture. What is he doing?",
    options: ["He is drinking water.", "He is cooking soup.", "He is jumping high.", "He is driving a car."],
    ans: 0,
    exp: "จากรูปภาพเด็กผู้ชายกำลังดื่มน้ำจากแก้ว (He is drinking water.)",
    topic: "Visual Grammar: Actions & Verbs"
  },
  {
    id: "e2000000-0000-4000-8000-000000000024",
    img: "/games/english/vocab-hub-assets/verbs/eat.webp",
    text: "Look at the picture. What is the girl doing?",
    options: ["She is sleeping.", "She is eating food.", "She is dancing.", "She is singing."],
    ans: 1,
    exp: "จากรูปภาพเด็กผู้หญิงกำลังรับประทานอาหาร (She is eating food.)",
    topic: "Visual Grammar: Actions & Verbs"
  },
  {
    id: "e2000000-0000-4000-8000-000000000025",
    img: "/games/english/vocab-hub-assets/verbs/jump.webp",
    text: "Look at the picture. What action is shown?",
    options: ["Walking", "Jumping", "Sitting", "Sleeping"],
    ans: 1,
    exp: "จากรูปภาพคือท่าทางกระโดด (Jumping)",
    topic: "Visual Grammar: Actions & Verbs"
  },
  {
    id: "e2000000-0000-4000-8000-000000000026",
    img: "/games/english/vocab-hub-assets/verbs/sing.webp",
    text: "Look at the picture. What is he doing?",
    options: ["He is singing a song.", "He is writing a letter.", "He is eating an apple.", "He is swimming."],
    ans: 0,
    exp: "จากรูปภาพเด็กผู้ชายถือไมโครโฟนร้องเพลง (He is singing a song.)",
    topic: "Visual Grammar: Actions & Verbs"
  },
  {
    id: "e2000000-0000-4000-8000-000000000027",
    img: "/games/english/vocab-hub-assets/verbs/walk.webp",
    text: "Look at the picture. How does the boy go to school?",
    options: ["He drives a car.", "He walks to school.", "He rides a plane.", "He swims."],
    ans: 1,
    exp: "จากรูปภาพเด็กผู้ชายกำลังเดิน (He walks to school.)",
    topic: "Visual Grammar: Actions & Verbs"
  },
  {
    id: "e2000000-0000-4000-8000-000000000028",
    img: "/games/english/vocab-hub-assets/verbs/write.webp",
    text: "Look at the picture. What is the student doing?",
    options: ["She is writing with a pen.", "She is cooking food.", "She is jumping.", "She is dancing."],
    ans: 0,
    exp: "จากรูปภาพคือนักเรียนกำลังเขียนหนังสือลงบนกระดาษ (She is writing with a pen.)",
    topic: "Visual Grammar: Actions & Verbs"
  },
  {
    id: "e2000000-0000-4000-8000-000000000029",
    img: "/games/english/vocab-hub-assets/verbs/sleep.webp",
    text: "Look at the picture. What is the boy doing in bed?",
    options: ["He is singing.", "He is jumping.", "He is sleeping.", "He is cooking."],
    ans: 2,
    exp: "จากรูปภาพเด็กผู้ชายนอนหลับอยู่บนเตียง (He is sleeping.)",
    topic: "Visual Grammar: Actions & Verbs"
  },
  {
    id: "e2000000-0000-4000-8000-000000000030",
    img: "/games/english/vocab-hub-assets/verbs/swim.webp",
    text: "Look at the picture. Where is the boy swimming?",
    options: ["In the sky", "In the pool", "In the forest", "In the classroom"],
    ans: 1,
    exp: "จากรูปภาพเด็กผู้ชายกำลังว่ายน้ำในสระน้ำ (In the pool)",
    topic: "Visual Grammar: Actions & Verbs"
  },

  // 4. Prepositions of Place (31-38)
  {
    id: "e2000000-0000-4000-8000-000000000031",
    img: "/games/english/vocab-hub-assets/directions/in.webp",
    text: "Look at the picture. Where is the object?",
    options: ["It is under the box.", "It is on the box.", "It is in the box.", "It is behind the box."],
    ans: 2,
    exp: "จากรูปภาพ วัตถุอยู่ข้างในกล่อง (in the box)",
    topic: "Visual Grammar: Prepositions of Place"
  },
  {
    id: "e2000000-0000-4000-8000-000000000032",
    img: "/games/english/vocab-hub-assets/directions/on.webp",
    text: "Look at the picture. Where is the object?",
    options: ["It is under the box.", "It is on the box.", "It is in the box.", "It is between the boxes."],
    ans: 1,
    exp: "จากรูปภาพ วัตถุอยู่บนกล่อง (on the box)",
    topic: "Visual Grammar: Prepositions of Place"
  },
  {
    id: "e2000000-0000-4000-8000-000000000033",
    img: "/games/english/vocab-hub-assets/directions/under.webp",
    text: "Look at the picture. Where is the object?",
    options: ["It is on the box.", "It is under the box.", "It is in the box.", "It is in front of the box."],
    ans: 1,
    exp: "จากรูปภาพ วัตถุอยู่ใต้กล่อง (under the box)",
    topic: "Visual Grammar: Prepositions of Place"
  },
  {
    id: "e2000000-0000-4000-8000-000000000034",
    img: "/games/english/vocab-hub-assets/directions/behind.webp",
    text: "Look at the picture. Where is the object?",
    options: ["It is in front of the box.", "It is behind the box.", "It is on the box.", "It is under the box."],
    ans: 1,
    exp: "จากรูปภาพ วัตถุอยู่ด้านหลังกล่อง (behind the box)",
    topic: "Visual Grammar: Prepositions of Place"
  },
  {
    id: "e2000000-0000-4000-8000-000000000035",
    img: "/games/english/vocab-hub-assets/directions/between.webp",
    text: "Look at the picture. Where is the object?",
    options: ["It is under the box.", "It is between the two boxes.", "It is in the box.", "It is on the box."],
    ans: 1,
    exp: "จากรูปภาพ วัตถุอยู่ระหว่างกล่องสองใบ (between the two boxes)",
    topic: "Visual Grammar: Prepositions of Place"
  },
  {
    id: "e2000000-0000-4000-8000-000000000036",
    img: "/games/english/vocab-hub-assets/directions/front.webp",
    text: "Look at the picture. Where is the object?",
    options: ["It is in front of the box.", "It is behind the box.", "It is under the box.", "It is in the box."],
    ans: 0,
    exp: "จากรูปภาพ วัตถุอยู่ข้างหน้ากล่อง (in front of the box)",
    topic: "Visual Grammar: Prepositions of Place"
  },
  {
    id: "e2000000-0000-4000-8000-000000000037",
    img: "/games/english/vocab-hub-assets/directions/up.webp",
    text: "Look at the arrow in the picture. Which way does it point?",
    options: ["Down", "Left", "Up", "Right"],
    ans: 2,
    exp: "ลูกศรในภาพชี้ขึ้นข้างบน (Up)",
    topic: "Visual Grammar: Prepositions of Place"
  },
  {
    id: "e2000000-0000-4000-8000-000000000038",
    img: "/games/english/vocab-hub-assets/directions/down.webp",
    text: "Look at the arrow in the picture. Which way does it point?",
    options: ["Up", "Right", "Down", "Left"],
    ans: 2,
    exp: "ลูกศรในภาพชี้ลงข้างล่าง (Down)",
    topic: "Visual Grammar: Prepositions of Place"
  },

  // 5. Feelings & Emotions (39-46)
  {
    id: "e2000000-0000-4000-8000-000000000039",
    img: "/games/english/vocab-hub-assets/emotions/happy.webp",
    text: "Look at the picture. How does the girl feel?",
    options: ["She feels sad.", "She feels angry.", "She feels happy.", "She feels scared."],
    ans: 2,
    exp: "จากรูปภาพเด็กผู้หญิงยิ้มแย้มสดใส รู้สึกมีความสุข (happy)",
    topic: "Visual Vocabulary: Feelings & Emotions"
  },
  {
    id: "e2000000-0000-4000-8000-000000000040",
    img: "/games/english/vocab-hub-assets/emotions/sad.webp",
    text: "Look at the picture. Why is the boy crying?",
    options: ["Because he is happy.", "Because he is sad.", "Because he is proud.", "Because he is excited."],
    ans: 1,
    exp: "จากรูปภาพเด็กผู้ชายกำลังร้องไห้ แสดงอารมณ์เศร้า (sad)",
    topic: "Visual Vocabulary: Feelings & Emotions"
  },
  {
    id: "e2000000-0000-4000-8000-000000000041",
    img: "/games/english/vocab-hub-assets/emotions/angry.webp",
    text: "Look at the picture. How does he look?",
    options: ["Tired", "Angry", "Bored", "Happy"],
    ans: 1,
    exp: "จากรูปภาพเด็กผู้ชายคิ้วขมวดและหน้าแดง แสดงอารมณ์โกรธ (angry)",
    topic: "Visual Vocabulary: Feelings & Emotions"
  },
  {
    id: "e2000000-0000-4000-8000-000000000042",
    img: "/games/english/vocab-hub-assets/emotions/scared.webp",
    text: "Look at the picture. The boy sees a spider. He feels _____.",
    options: ["scared", "happy", "bored", "proud"],
    ans: 0,
    exp: "จากรูปภาพเด็กผู้ชายแสดงอาการตกใจหวาดกลัว (scared)",
    topic: "Visual Vocabulary: Feelings & Emotions"
  },
  {
    id: "e2000000-0000-4000-8000-000000000043",
    img: "/games/english/vocab-hub-assets/emotions/tired.webp",
    text: "Look at the picture. After running 10 kilometers, he feels _____.",
    options: ["excited", "tired", "angry", "proud"],
    ans: 1,
    exp: "จากรูปภาพแสดงอาการหมดแรง เหนื่อยล้า (tired)",
    topic: "Visual Vocabulary: Feelings & Emotions"
  },
  {
    id: "e2000000-0000-4000-8000-000000000044",
    img: "/games/english/vocab-hub-assets/emotions/surprised.webp",
    text: "Look at the picture. When she opens the surprise gift, she feels _____.",
    options: ["bored", "angry", "surprised", "sad"],
    ans: 2,
    exp: "จากรูปภาพตาโตและอ้าปากค้าง แสดงอาการประหลาดใจ (surprised)",
    topic: "Visual Vocabulary: Feelings & Emotions"
  },
  {
    id: "e2000000-0000-4000-8000-000000000045",
    img: "/games/english/vocab-hub-assets/emotions/bored.webp",
    text: "Look at the picture. He has nothing to do. He feels _____.",
    options: ["happy", "excited", "bored", "scared"],
    ans: 2,
    exp: "จากรูปภาพแสดงท่าทางเบื่อหน่าย ไม่มีอะไรทำ (bored)",
    topic: "Visual Vocabulary: Feelings & Emotions"
  },
  {
    id: "e2000000-0000-4000-8000-000000000046",
    img: "/games/english/vocab-hub-assets/emotions/proud.webp",
    text: "Look at the picture. He won first place in the race. He feels _____.",
    options: ["proud", "sad", "scared", "tired"],
    ans: 0,
    exp: "จากรูปภาพแสดงความภาคภูมิใจในความสำเร็จ (proud)",
    topic: "Visual Vocabulary: Feelings & Emotions"
  },

  // 6. Sea Animals (47-54)
  {
    id: "e2000000-0000-4000-8000-000000000047",
    img: "/games/english/vocab-hub-assets/sea-animals/dolphin.webp",
    text: "Look at the picture. What sea animal can jump high and is very friendly?",
    options: ["A shark", "A dolphin", "A crab", "A jellyfish"],
    ans: 1,
    exp: "จากรูปภาพคือโลมา (Dolphin) สัตว์เลี้ยงลูกด้วยนมในทะเลที่ฉลาดและเป็นมิตร",
    topic: "Visual Vocabulary: Sea Animals"
  },
  {
    id: "e2000000-0000-4000-8000-000000000048",
    img: "/games/english/vocab-hub-assets/sea-animals/octopus.webp",
    text: "Look at the picture. How many arms does an octopus have?",
    options: ["Two arms", "Four arms", "Six arms", "Eight arms"],
    ans: 3,
    exp: "จากรูปภาพคือหมึกยักษ์ (Octopus) มีหนวดทั้งหมด 8 เส้น (Eight arms)",
    topic: "Visual Vocabulary: Sea Animals"
  },
  {
    id: "e2000000-0000-4000-8000-000000000049",
    img: "/games/english/vocab-hub-assets/sea-animals/shark.webp",
    text: "Look at the picture. What dangerous fish has sharp teeth and a dorsal fin?",
    options: ["A shark", "A goldfish", "A turtle", "A shrimp"],
    ans: 0,
    exp: "จากรูปภาพคือปลาฉลาม (Shark) นักล่าแห่งท้องทะเล",
    topic: "Visual Vocabulary: Sea Animals"
  },
  {
    id: "e2000000-0000-4000-8000-000000000050",
    img: "/games/english/vocab-hub-assets/sea-animals/turtle.webp",
    text: "Look at the picture. What animal carries a hard shell and swims in the sea?",
    options: ["A sea turtle", "A whale", "A dolphin", "An octopus"],
    ans: 0,
    exp: "จากรูปภาพคือเต่าทะเล (Sea turtle) มีกระดองแข็งปกป้องลำตัว",
    topic: "Visual Vocabulary: Sea Animals"
  },
  {
    id: "e2000000-0000-4000-8000-000000000051",
    img: "/games/english/vocab-hub-assets/sea-animals/crab.webp",
    text: "Look at the picture. What animal walks sideways and has two big claws?",
    options: ["A crab", "A jellyfish", "A whale", "A shark"],
    ans: 0,
    exp: "จากรูปภาพคือปู (Crab) เดินไปด้านข้างและมีก้ามขนาดใหญ่ 2 ก้าม",
    topic: "Visual Vocabulary: Sea Animals"
  },
  {
    id: "e2000000-0000-4000-8000-000000000052",
    img: "/games/english/vocab-hub-assets/sea-animals/jellyfish.webp",
    text: "Look at the picture. What soft and transparent sea animal is this?",
    options: ["A dolphin", "A jellyfish", "A sea turtle", "A crab"],
    ans: 1,
    exp: "จากรูปภาพคือแมงกะพรุน (Jellyfish) ลำตัวใสและนิ่ม",
    topic: "Visual Vocabulary: Sea Animals"
  },
  {
    id: "e2000000-0000-4000-8000-000000000053",
    img: "/games/english/vocab-hub-assets/sea-animals/whale.webp",
    text: "Look at the picture. What is the largest animal in the ocean?",
    options: ["A whale", "A crab", "A shrimp", "A clownfish"],
    ans: 0,
    exp: "จากรูปภาพคือวาฬ (Whale) สัตว์ที่มีขนาดใหญ่ที่สุดในมหาสมุทร",
    topic: "Visual Vocabulary: Sea Animals"
  },
  {
    id: "e2000000-0000-4000-8000-000000000054",
    img: "/games/english/vocab-hub-assets/sea-animals/shrimp.webp",
    text: "Look at the picture. What small sea animal with long antennae is this?",
    options: ["A shrimp", "A whale", "A shark", "A dolphin"],
    ans: 0,
    exp: "จากรูปภาพคือกุ้ง (Shrimp) มีหนวดยาวและตัวงอ",
    topic: "Visual Vocabulary: Sea Animals"
  },

  // 7. Sports & Activities (55-62)
  {
    id: "e2000000-0000-4000-8000-000000000055",
    img: "/games/english/vocab-hub-assets/sports/football.webp",
    text: "Look at the picture. What sport do players kick the ball into a net?",
    options: ["Basketball", "Football", "Tennis", "Badminton"],
    ans: 1,
    exp: "จากรูปภาพคือกีฬาฟุตบอล (Football) ใช้เท้าเตะลูกบอลเข้าประตู",
    topic: "Visual Vocabulary: Sports & Activities"
  },
  {
    id: "e2000000-0000-4000-8000-000000000056",
    img: "/games/english/vocab-hub-assets/sports/basketball.webp",
    text: "Look at the picture. What sport do players bounce and shoot the ball into a hoop?",
    options: ["Basketball", "Volleyball", "Boxing", "Running"],
    ans: 0,
    exp: "จากรูปภาพคือกีฬาบาสเกตบอล (Basketball) โยนลูกบอลลงห่วง",
    topic: "Visual Vocabulary: Sports & Activities"
  },
  {
    id: "e2000000-0000-4000-8000-000000000057",
    img: "/games/english/vocab-hub-assets/sports/badminton.webp",
    text: "Look at the picture. What do you need to play badminton?",
    options: ["A racket and a shuttlecock", "A football and gloves", "A basketball and a hoop", "A swimming cap"],
    ans: 0,
    exp: "จากรูปภาพคือกีฬาแบดมินตัน (Badminton) ใช้อุปกรณ์คือไม้แร็กเก็ตและลูกขนไก่ (shuttlecock)",
    topic: "Visual Vocabulary: Sports & Activities"
  },
  {
    id: "e2000000-0000-4000-8000-000000000058",
    img: "/games/english/vocab-hub-assets/sports/tennis.webp",
    text: "Look at the picture. What sport is played on a court with a green-yellow ball?",
    options: ["Tennis", "Boxing", "Football", "Volleyball"],
    ans: 0,
    exp: "จากรูปภาพคือกีฬาเทนนิส (Tennis)",
    topic: "Visual Vocabulary: Sports & Activities"
  },
  {
    id: "e2000000-0000-4000-8000-000000000059",
    img: "/games/english/vocab-hub-assets/sports/swimming.webp",
    text: "Look at the picture. What sport is done in water?",
    options: ["Running", "Swimming", "Basketball", "Boxing"],
    ans: 1,
    exp: "จากรูปภาพคือกีฬาว่ายน้ำ (Swimming)",
    topic: "Visual Vocabulary: Sports & Activities"
  },
  {
    id: "e2000000-0000-4000-8000-000000000060",
    img: "/games/english/vocab-hub-assets/sports/running.webp",
    text: "Look at the picture. What athletic activity is this?",
    options: ["Running", "Cooking", "Sleeping", "Reading"],
    ans: 0,
    exp: "จากรูปภาพคือกิจกรรมการวิ่ง (Running)",
    topic: "Visual Vocabulary: Sports & Activities"
  },
  {
    id: "e2000000-0000-4000-8000-000000000061",
    img: "/games/english/vocab-hub-assets/sports/volleyball.webp",
    text: "Look at the picture. In which sport do players hit the ball over a net using their hands?",
    options: ["Volleyball", "Football", "Swimming", "Running"],
    ans: 0,
    exp: "จากรูปภาพคือกีฬาวอลเลย์บอล (Volleyball) ตบลูกบอลข้ามตาข่ายด้วยมือ",
    topic: "Visual Vocabulary: Sports & Activities"
  },
  {
    id: "e2000000-0000-4000-8000-000000000062",
    img: "/games/english/vocab-hub-assets/sports/boxing.webp",
    text: "Look at the picture. What combat sport requires wearing padded gloves?",
    options: ["Boxing", "Tennis", "Badminton", "Basketball"],
    ans: 0,
    exp: "จากรูปภาพคือกีฬามวย (Boxing) สวมนวมชกมวย",
    topic: "Visual Vocabulary: Sports & Activities"
  },

  // 8. Rooms in the House (63-68)
  {
    id: "e2000000-0000-4000-8000-000000000063",
    img: "/games/english/vocab-hub-assets/house-rooms/kitchen.webp",
    text: "Look at the picture. Which room is used for cooking and preparing meals?",
    options: ["The bedroom", "The kitchen", "The bathroom", "The garage"],
    ans: 1,
    exp: "จากรูปภาพคือห้องครัว (Kitchen) มีเตาและอุปกรณ์ทำอาหาร",
    topic: "Visual Vocabulary: Rooms in the House"
  },
  {
    id: "e2000000-0000-4000-8000-000000000064",
    img: "/games/english/vocab-hub-assets/house-rooms/bedroom.webp",
    text: "Look at the picture. Which room has a bed where you sleep at night?",
    options: ["The bedroom", "The dining room", "The kitchen", "The garage"],
    ans: 0,
    exp: "จากรูปภาพคือห้องนอน (Bedroom) มีเตียงนอน",
    topic: "Visual Vocabulary: Rooms in the House"
  },
  {
    id: "e2000000-0000-4000-8000-000000000065",
    img: "/games/english/vocab-hub-assets/house-rooms/bathroom.webp",
    text: "Look at the picture. Where do you take a shower and brush your teeth?",
    options: ["In the kitchen", "In the bathroom", "In the bedroom", "In the garage"],
    ans: 1,
    exp: "จากรูปภาพคือห้องน้ำ (Bathroom) มีฝักบัวและอ่างล้างหน้า",
    topic: "Visual Vocabulary: Rooms in the House"
  },
  {
    id: "e2000000-0000-4000-8000-000000000066",
    img: "/games/english/vocab-hub-assets/house-rooms/living-room.webp",
    text: "Look at the picture. Where does the family sit together on sofas to watch TV?",
    options: ["In the living room", "In the bathroom", "In the garage", "In the kitchen"],
    ans: 0,
    exp: "จากรูปภาพคือห้องนั่งเล่น (Living room) มีโซฟาและโทรทัศน์",
    topic: "Visual Vocabulary: Rooms in the House"
  },
  {
    id: "e2000000-0000-4000-8000-000000000067",
    img: "/games/english/vocab-hub-assets/house-rooms/dining-room.webp",
    text: "Look at the picture. Where do family members sit around a big table to eat dinner?",
    options: ["In the dining room", "In the bathroom", "In the bedroom", "In the garage"],
    ans: 0,
    exp: "จากรูปภาพคือห้องรับประทานอาหาร (Dining room) มีโต๊ะอาหารและเก้าอี้",
    topic: "Visual Vocabulary: Rooms in the House"
  },
  {
    id: "e2000000-0000-4000-8000-000000000068",
    img: "/games/english/vocab-hub-assets/house-rooms/garage.webp",
    text: "Look at the picture. Where do people park their cars at home?",
    options: ["In the kitchen", "In the garage", "In the bathroom", "In the bedroom"],
    ans: 1,
    exp: "จากรูปภาพคือโรงจอดรถ (Garage)",
    topic: "Visual Vocabulary: Rooms in the House"
  },

  // 9. Weather & Seasons (69-74)
  {
    id: "e2000000-0000-4000-8000-000000000069",
    img: "/games/english/vocab-hub-assets/weather/cloudy.webp",
    text: "Look at the picture. There are many gray clouds in the sky. The weather is _____.",
    options: ["sunny", "cloudy", "snowy", "hot"],
    ans: 1,
    exp: "จากรูปภาพท้องฟ้ามีเมฆมาก (cloudy)",
    topic: "Visual Vocabulary: Weather & Seasons"
  },
  {
    id: "e2000000-0000-4000-8000-000000000070",
    img: "/games/english/vocab-hub-assets/weather/rainy.webp",
    text: "Look at the picture. Rain is falling from the sky. It is _____.",
    options: ["rainy", "sunny", "hot", "dry"],
    ans: 0,
    exp: "จากรูปภาพมีฝนตก (rainy) ต้องพกร่ม",
    topic: "Visual Vocabulary: Weather & Seasons"
  },
  {
    id: "e2000000-0000-4000-8000-000000000071",
    img: "/games/english/vocab-hub-assets/weather/sunny.webp",
    text: "Look at the picture. The bright sun is shining. It is _____.",
    options: ["sunny and hot", "snowy and cold", "rainy and wet", "stormy"],
    ans: 0,
    exp: "จากรูปภาพพระอาทิตย์ส่องแสงเจิดจ้า อากาศแดดจัดและอบอุ่น (sunny and hot)",
    topic: "Visual Vocabulary: Weather & Seasons"
  },
  {
    id: "e2000000-0000-4000-8000-000000000072",
    img: "/games/english/vocab-hub-assets/weather/windy.webp",
    text: "Look at the picture. The wind blows hard and trees are bending. It is _____.",
    options: ["windy", "sunny", "hot", "calm"],
    ans: 0,
    exp: "จากรูปภาพลมพัดแรงจนต้นไม้เอนเอียง (windy)",
    topic: "Visual Vocabulary: Weather & Seasons"
  },
  {
    id: "e2000000-0000-4000-8000-000000000073",
    img: "/games/english/vocab-hub-assets/weather/snowy.webp",
    text: "Look at the picture. White snowflakes are falling everywhere. It is _____.",
    options: ["hot and dry", "snowy and cold", "sunny", "rainy"],
    ans: 1,
    exp: "จากรูปภาพมีหิมะตกขาวโพลน อากาศหนาวเย็นมาก (snowy and cold)",
    topic: "Visual Vocabulary: Weather & Seasons"
  },
  {
    id: "e2000000-0000-4000-8000-000000000074",
    img: "/games/english/vocab-hub-assets/weather/stormy.webp",
    text: "Look at the picture. Dark clouds, thunder, and lightning are shown. The weather is _____.",
    options: ["stormy", "sunny", "clear", "warm"],
    ans: 0,
    exp: "จากรูปภาพมีฟ้าร้อง ฟ้าผ่า และเมฆดำมืด เป็นพายุฝนฟ้าคะนอง (stormy)",
    topic: "Visual Vocabulary: Weather & Seasons"
  },

  // 10. Toys & Objects (75-78)
  {
    id: "e2000000-0000-4000-8000-000000000075",
    img: "/games/english/vocab-hub-assets/toys/robot.webp",
    text: "Look at the picture. What mechanical toy has metal buttons and lights?",
    options: ["A robot", "A doll", "A balloon", "A kite"],
    ans: 0,
    exp: "จากรูปภาพคือของเล่นหุ่นยนต์ (Robot)",
    topic: "Visual Vocabulary: Toys & Objects"
  },
  {
    id: "e2000000-0000-4000-8000-000000000076",
    img: "/games/english/vocab-hub-assets/toys/kite.webp",
    text: "Look at the picture. What colorful toy flies high in the wind attached to a string?",
    options: ["A kite", "A car", "A teddy bear", "A puzzle"],
    ans: 0,
    exp: "จากรูปภาพคือว่าว (Kite) ที่ลอยอยู่บนฟ้าด้วยแรงลม",
    topic: "Visual Vocabulary: Toys & Objects"
  },
  {
    id: "e2000000-0000-4000-8000-000000000077",
    img: "/games/english/vocab-hub-assets/toys/teddy-bear.webp",
    text: "Look at the picture. What soft stuffed animal do children love to hug?",
    options: ["A teddy bear", "A robot", "A kite", "Blocks"],
    ans: 0,
    exp: "จากรูปภาพคือตุ๊กตาหมีขนนุ่ม (Teddy bear)",
    topic: "Visual Vocabulary: Toys & Objects"
  },
  {
    id: "e2000000-0000-4000-8000-000000000078",
    img: "/games/english/vocab-hub-assets/toys/balloon.webp",
    text: "Look at the picture. What light, colorful object floats in the air when filled with gas?",
    options: ["A balloon", "A book", "A pencil", "A chair"],
    ans: 0,
    exp: "จากรูปภาพคือลูกโป่งสวรรค์ (Balloon)",
    topic: "Visual Vocabulary: Toys & Objects"
  }
];

let sql = `-- Migration 564: Seed 78 Visual English Questions and Visual Exam Set PIN 6001
-- เพิ่มคลังข้อสอบภาษาอังกฤษ ป.4 เน้นการถาม-ตอบจากรูปภาพสื่อการสอนจริง (Visual English Questions)
-- และสร้างชุดข้อสอบมาตรฐานภาพชุดที่ 2 (PIN: 6001)

INSERT INTO public.exam_questions (
  id,
  subject,
  grade,
  topic,
  difficulty,
  bloom_level,
  question_type,
  question_text,
  options,
  answer,
  explanation,
  indicator_code,
  indicator_desc,
  media_title,
  media_image_url
) VALUES\n`;

const values = questions.map((q, idx) => {
  const diff = idx % 3 === 0 ? "easy" : (idx % 3 === 1 ? "medium" : "hard");
  const bloom = idx % 2 === 0 ? "L1" : "L2";
  const indCode = q.topic.includes("Feelings") ? "ต 1.2 ป.4/5" : "ต 1.1 ป.4/3";
  const indDesc = q.topic.includes("Feelings") 
    ? "พูดแสดงความรู้สึกของตนเองเกี่ยวกับเรื่องต่าง ๆ ใกล้ตัว และกิจกรรมต่าง ๆ ตามแบบที่ฟัง" 
    : "เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมาย ตรงตามความหมายของประโยคและข้อความสั้น ๆ ที่ฟัง หรืออ่าน";
  
  const optJson = JSON.stringify(q.options).replace(/'/g, "''");
  const ansJson = JSON.stringify(q.ans);
  const qText = q.text.replace(/'/g, "''");
  const qExp = q.exp.replace(/'/g, "''");
  const qTopic = q.topic.replace(/'/g, "''");
  
  return `(
  '${q.id}',
  'ภาษาอังกฤษ',
  'ป.4',
  '${qTopic}',
  '${diff}',
  '${bloom}',
  'mcq',
  '${qText}',
  '${optJson}'::jsonb,
  '${ansJson}'::jsonb,
  '${qExp}',
  '${indCode}',
  '${indDesc}',
  'คลังภาพคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)',
  '${q.img}'
)`;
});

sql += values.join(",\n");
sql += `\nON CONFLICT (id) DO UPDATE SET
  question_text = EXCLUDED.question_text,
  options = EXCLUDED.options,
  answer = EXCLUDED.answer,
  explanation = EXCLUDED.explanation,
  topic = EXCLUDED.topic,
  indicator_code = EXCLUDED.indicator_code,
  indicator_desc = EXCLUDED.indicator_desc,
  media_title = EXCLUDED.media_title,
  media_image_url = EXCLUDED.media_image_url;

-- สร้างชุดข้อสอบมาตรฐานภาษาอังกฤษภาพชุดที่ 2 (PIN: 6001) รวม 20 ข้อ
INSERT INTO public.exam_sets (
  id,
  title,
  subject,
  grade,
  time_limit_minutes,
  pass_threshold_pct,
  pin_code,
  is_active,
  questions
)
SELECT
  '60010000-0000-4000-8000-000000000001'::uuid,
  'แบบทดสอบภาษาอังกฤษภาพคำศัพท์และชีวิตประจำวัน ป.4 (20 ข้อ)',
  'ภาษาอังกฤษ',
  'ป.4',
  30,
  50,
  '6001',
  true,
  COALESCE(
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', q.id,
          'question_text', q.question_text,
          'options', q.options,
          'answer', q.answer,
          'question_type', q.question_type,
          'difficulty', q.difficulty,
          'bloom_level', q.bloom_level,
          'indicator_code', q.indicator_code,
          'indicator_desc', q.indicator_desc,
          'media_title', q.media_title,
          'media_image_url', q.media_image_url,
          'explanation', q.explanation
        )
      )
      FROM (
        SELECT *
        FROM public.exam_questions
        WHERE id IN (
          'e2000000-0000-4000-8000-000000000001',
          'e2000000-0000-4000-8000-000000000003',
          'e2000000-0000-4000-8000-000000000004',
          'e2000000-0000-4000-8000-000000000005',
          'e2000000-0000-4000-8000-000000000011',
          'e2000000-0000-4000-8000-000000000012',
          'e2000000-0000-4000-8000-000000000013',
          'e2000000-0000-4000-8000-000000000021',
          'e2000000-0000-4000-8000-000000000022',
          'e2000000-0000-4000-8000-000000000023',
          'e2000000-0000-4000-8000-000000000031',
          'e2000000-0000-4000-8000-000000000032',
          'e2000000-0000-4000-8000-000000000033',
          'e2000000-0000-4000-8000-000000000039',
          'e2000000-0000-4000-8000-000000000040',
          'e2000000-0000-4000-8000-000000000047',
          'e2000000-0000-4000-8000-000000000055',
          'e2000000-0000-4000-8000-000000000063',
          'e2000000-0000-4000-8000-000000000070',
          'e2000000-0000-4000-8000-000000000075'
        )
      ) q
    ),
    '[]'::jsonb
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  subject = EXCLUDED.subject,
  grade = EXCLUDED.grade,
  time_limit_minutes = EXCLUDED.time_limit_minutes,
  pass_threshold_pct = EXCLUDED.pass_threshold_pct,
  pin_code = EXCLUDED.pin_code,
  is_active = EXCLUDED.is_active,
  questions = EXCLUDED.questions;
`;

fs.writeFileSync("supabase/migrations/564_seed_english_visual_questions.sql", sql, "utf8");
console.log("Successfully wrote supabase/migrations/564_seed_english_visual_questions.sql (" + questions.length + " questions)");
