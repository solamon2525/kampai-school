// scripts/gen-english-picture-mcq.mjs
// Generates 60 Grade 4 English Picture-based MCQ questions (ตอบคำถามจากภาพ)

export function generateEnglishPictureMcq() {
  const list = [];

  function add(topic, diff, bloom, text, options, ansIdx, exp, imgPath) {
    list.push({
      topic,
      difficulty: diff,
      bloom,
      text,
      options,
      answer: String(ansIdx),
      explanation: exp,
      indicator_code: 'ต 1.1 ป.4/3',
      indicator_desc: 'เลือก/ระบุภาพ หรือสัญลักษณ์ หรือเครื่องหมายตรงตามความหมายของประโยคและข้อความสั้นๆ ที่ฟังหรืออ่าน',
      media_image_url: imgPath,
      media_title: 'คลังคำศัพท์ภาษาอังกฤษ ป.4 (Visual English Hub)'
    });
  }

  // =========================================================================
  // 1. Colors & Shapes (10 ข้อ)
  // =========================================================================
  const colorShapeItems = [
    {
      q: 'Look at the picture. What color is this?',
      img: '/games/english/vocab-hub-assets/colors/red.webp',
      correct: 'Red',
      wrong: ['Blue', 'Green', 'Yellow'],
      exp: 'จากภาพคือ สีแดง ภาษาอังกฤษตรงกับคำว่า "Red"'
    },
    {
      q: 'Look at the picture. What color is this?',
      img: '/games/english/vocab-hub-assets/colors/blue.webp',
      correct: 'Blue',
      wrong: ['Pink', 'Orange', 'Black'],
      exp: 'จากภาพคือ สีน้ำเงิน ภาษาอังกฤษตรงกับคำว่า "Blue"'
    },
    {
      q: 'Look at the picture. What color is this?',
      img: '/games/english/vocab-hub-assets/colors/green.webp',
      correct: 'Green',
      wrong: ['Purple', 'Brown', 'White'],
      exp: 'จากภาพคือ สีเขียว ภาษาอังกฤษตรงกับคำว่า "Green"'
    },
    {
      q: 'Look at the picture. What color is this?',
      img: '/games/english/vocab-hub-assets/colors/yellow.webp',
      correct: 'Yellow',
      wrong: ['Red', 'Gray', 'Blue'],
      exp: 'จากภาพคือ สีเหลือง ภาษาอังกฤษตรงกับคำว่า "Yellow"'
    },
    {
      q: 'Look at the picture. What color is this?',
      img: '/games/english/vocab-hub-assets/colors/pink.webp',
      correct: 'Pink',
      wrong: ['Black', 'Green', 'Brown'],
      exp: 'จากภาพคือ สีชมพู ภาษาอังกฤษตรงกับคำว่า "Pink"'
    },
    {
      q: 'Look at the picture. What shape is this?',
      img: '/games/english/vocab-hub-assets/shapes/circle.webp',
      correct: 'Circle',
      wrong: ['Square', 'Triangle', 'Star'],
      exp: 'จากภาพคือ รูปวงกลม ภาษาอังกฤษตรงกับคำว่า "Circle"'
    },
    {
      q: 'Look at the picture. What shape is this?',
      img: '/games/english/vocab-hub-assets/shapes/square.webp',
      correct: 'Square',
      wrong: ['Heart', 'Oval', 'Diamond'],
      exp: 'จากภาพคือ รูปสี่เหลี่ยมจัตุรัส ภาษาอังกฤษตรงกับคำว่า "Square"'
    },
    {
      q: 'Look at the picture. What shape is this?',
      img: '/games/english/vocab-hub-assets/shapes/triangle.webp',
      correct: 'Triangle',
      wrong: ['Circle', 'Rectangle', 'Star'],
      exp: 'จากภาพคือ รูปสามเหลี่ยม ภาษาอังกฤษตรงกับคำว่า "Triangle"'
    },
    {
      q: 'Look at the picture. What shape is this?',
      img: '/games/english/vocab-hub-assets/shapes/star.webp',
      correct: 'Star',
      wrong: ['Triangle', 'Oval', 'Heart'],
      exp: 'จากภาพคือ รูปดาว ภาษาอังกฤษตรงกับคำว่า "Star"'
    },
    {
      q: 'Look at the picture. What shape is this?',
      img: '/games/english/vocab-hub-assets/shapes/heart.webp',
      correct: 'Heart',
      wrong: ['Circle', 'Square', 'Diamond'],
      exp: 'จากภาพคือ รูปหัวใจ ภาษาอังกฤษตรงกับคำว่า "Heart"'
    }
  ];

  colorShapeItems.forEach((item, idx) => {
    const opts = [item.correct, ...item.wrong].sort(() => 0.5 - ((idx * 3) % 2));
    const ans = opts.indexOf(item.correct);
    add(
      'Visual Vocabulary: Colors & Shapes',
      idx % 3 === 0 ? 'easy' : (idx % 3 === 1 ? 'medium' : 'hard'),
      'L1',
      item.q,
      opts,
      ans,
      item.exp,
      item.img
    );
  });

  // =========================================================================
  // 2. Classroom Objects & School Supplies (10 ข้อ)
  // =========================================================================
  const classroomItems = [
    {
      q: 'Look at the picture. What is this?',
      img: '/games/english/vocab-hub-assets/classroom/pencil.webp',
      correct: 'It is a pencil.',
      wrong: ['It is a ruler.', 'It is an eraser.', 'It is a book.'],
      exp: 'จากภาพคือ ดินสอ ภาษาอังกฤษตรงกับคำว่า "pencil"'
    },
    {
      q: 'Look at the picture. What is this?',
      img: '/games/english/vocab-hub-assets/classroom/book.webp',
      correct: 'It is a book.',
      wrong: ['It is a bag.', 'It is a chair.', 'It is a pen.'],
      exp: 'จากภาพคือ หนังสือ ภาษาอังกฤษตรงกับคำว่า "book"'
    },
    {
      q: 'Look at the picture. What is this?',
      img: '/games/english/vocab-hub-assets/classroom/ruler.webp',
      correct: 'It is a ruler.',
      wrong: ['It is a pencil.', 'It is scissors.', 'It is a crayon.'],
      exp: 'จากภาพคือ ไม้บรรทัด ภาษาอังกฤษตรงกับคำว่า "ruler"'
    },
    {
      q: 'Look at the picture. What are these?',
      img: '/games/english/vocab-hub-assets/classroom/scissors.webp',
      correct: 'They are scissors.',
      wrong: ['They are pencils.', 'They are rulers.', 'They are books.'],
      exp: 'จากภาพคือ กรรไกร ภาษาอังกฤษใช้คำพหูพจน์ว่า "scissors"'
    },
    {
      q: 'Look at the picture. What is this?',
      img: '/games/english/vocab-hub-assets/classroom/bag.webp',
      correct: 'It is a school bag.',
      wrong: ['It is a notebook.', 'It is a calculator.', 'It is a desk.'],
      exp: 'จากภาพคือ กระเป๋านักเรียน ภาษาอังกฤษตรงกับคำว่า "school bag"'
    },
    {
      q: 'Look at the picture. What is this?',
      img: '/games/english/vocab-hub-assets/classroom/pen.webp',
      correct: 'It is a pen.',
      wrong: ['It is a pencil.', 'It is a ruler.', 'It is an eraser.'],
      exp: 'จากภาพคือ ปากกา ภาษาอังกฤษตรงกับคำว่า "pen"'
    },
    {
      q: 'Look at the picture. What is this?',
      img: '/games/english/vocab-hub-assets/classroom/chair.webp',
      correct: 'It is a chair.',
      wrong: ['It is a table.', 'It is a door.', 'It is a window.'],
      exp: 'จากภาพคือ เก้าอี้ ภาษาอังกฤษตรงกับคำว่า "chair"'
    },
    {
      q: 'Look at the picture. What is this?',
      img: '/games/english/vocab-hub-assets/classroom/crayon.webp',
      correct: 'It is a crayon.',
      wrong: ['It is a pen.', 'It is a brush.', 'It is a book.'],
      exp: 'จากภาพคือ สีเทียน ภาษาอังกฤษตรงกับคำว่า "crayon"'
    },
    {
      q: 'Look at the picture. What is this?',
      img: '/games/english/vocab-hub-assets/classroom/notebook.webp',
      correct: 'It is a notebook.',
      wrong: ['It is a bag.', 'It is a ruler.', 'It is scissors.'],
      exp: 'จากภาพคือ สมุดบันทึก ภาษาอังกฤษตรงกับคำว่า "notebook"'
    },
    {
      q: 'Look at the picture. What is this?',
      img: '/games/english/vocab-hub-assets/classroom/calculator.webp',
      correct: 'It is a calculator.',
      wrong: ['It is a clock.', 'It is a computer.', 'It is a phone.'],
      exp: 'จากภาพคือ เครื่องคิดเลข ภาษาอังกฤษตรงกับคำว่า "calculator"'
    }
  ];

  classroomItems.forEach((item, idx) => {
    const opts = [item.correct, ...item.wrong].sort(() => 0.5 - ((idx * 5) % 2));
    const ans = opts.indexOf(item.correct);
    add(
      'Visual Vocabulary: Classroom Objects',
      idx % 3 === 0 ? 'easy' : (idx % 3 === 1 ? 'medium' : 'hard'),
      'L1',
      item.q,
      opts,
      ans,
      item.exp,
      item.img
    );
  });

  // =========================================================================
  // 3. Animals & Pets (10 ข้อ)
  // =========================================================================
  const animalItems = [
    {
      q: 'Look at the picture. What animal is this?',
      img: '/games/english/vocab-hub-assets/animals/elephant.webp',
      correct: 'An elephant',
      wrong: ['A lion', 'A tiger', 'A zebra'],
      exp: 'จากภาพคือ ช้าง ภาษาอังกฤษตรงกับคำว่า "An elephant"'
    },
    {
      q: 'Look at the picture. What animal is this?',
      img: '/games/english/vocab-hub-assets/animals/cat.webp',
      correct: 'A cat',
      wrong: ['A dog', 'A rabbit', 'A duck'],
      exp: 'จากภาพคือ แมว ภาษาอังกฤษตรงกับคำว่า "A cat"'
    },
    {
      q: 'Look at the picture. What animal is this?',
      img: '/games/english/vocab-hub-assets/animals/dog.webp',
      correct: 'A dog',
      wrong: ['A cat', 'A wolf', 'A bear'],
      exp: 'จากภาพคือ สุนัข ภาษาอังกฤษตรงกับคำว่า "A dog"'
    },
    {
      q: 'Look at the picture. What animal is this?',
      img: '/games/english/vocab-hub-assets/animals/rabbit.webp',
      correct: 'A rabbit',
      wrong: ['A frog', 'A bird', 'A monkey'],
      exp: 'จากภาพคือ กระต่าย ภาษาอังกฤษตรงกับคำว่า "A rabbit"'
    },
    {
      q: 'Look at the picture. What animal is this?',
      img: '/games/english/vocab-hub-assets/animals/lion.webp',
      correct: 'A lion',
      wrong: ['A tiger', 'A bear', 'A giraffe'],
      exp: 'จากภาพคือ สิงโต ภาษาอังกฤษตรงกับคำว่า "A lion"'
    },
    {
      q: 'Look at the picture. What animal is this?',
      img: '/games/english/vocab-hub-assets/animals/giraffe.webp',
      correct: 'A giraffe',
      wrong: ['A horse', 'A zebra', 'A kangaroo'],
      exp: 'จากภาพคือ ยีราฟคอยาว ภาษาอังกฤษตรงกับคำว่า "A giraffe"'
    },
    {
      q: 'Look at the picture. What animal is this?',
      img: '/games/english/vocab-hub-assets/animals/monkey.webp',
      correct: 'A monkey',
      wrong: ['A panda', 'A koala', 'A fox'],
      exp: 'จากภาพคือ ลิง ภาษาอังกฤษตรงกับคำว่า "A monkey"'
    },
    {
      q: 'Look at the picture. What animal is this?',
      img: '/games/english/vocab-hub-assets/animals/zebra.webp',
      correct: 'A zebra',
      wrong: ['A horse', 'A cow', 'A deer'],
      exp: 'จากภาพคือ ม้าลาย ภาษาอังกฤษตรงกับคำว่า "A zebra"'
    },
    {
      q: 'Look at the picture. What animal is this?',
      img: '/games/english/vocab-hub-assets/animals/fish.webp',
      correct: 'A fish',
      wrong: ['A duck', 'A frog', 'A bird'],
      exp: 'จากภาพคือ ปลา ภาษาอังกฤษตรงกับคำว่า "A fish"'
    },
    {
      q: 'Look at the picture. What animal is this?',
      img: '/games/english/vocab-hub-assets/animals/bird.webp',
      correct: 'A bird',
      wrong: ['A bat', 'An owl', 'A peacock'],
      exp: 'จากภาพคือ นก ภาษาอังกฤษตรงกับคำว่า "A bird"'
    }
  ];

  animalItems.forEach((item, idx) => {
    const opts = [item.correct, ...item.wrong].sort(() => 0.5 - ((idx * 7) % 2));
    const ans = opts.indexOf(item.correct);
    add(
      'Visual Vocabulary: Animals & Pets',
      idx % 3 === 0 ? 'easy' : (idx % 3 === 1 ? 'medium' : 'hard'),
      'L1',
      item.q,
      opts,
      ans,
      item.exp,
      item.img
    );
  });

  // =========================================================================
  // 4. Food, Fruits & Drinks (10 ข้อ)
  // =========================================================================
  const foodItems = [
    {
      q: 'Look at the picture. What fruit is this?',
      img: '/games/english/vocab-hub-assets/fruits/apple.webp',
      correct: 'An apple',
      wrong: ['An orange', 'A mango', 'A banana'],
      exp: 'จากภาพคือ ผลแอปเปิ้ล ภาษาอังกฤษตรงกับคำว่า "An apple"'
    },
    {
      q: 'Look at the picture. What fruit is this?',
      img: '/games/english/vocab-hub-assets/fruits/banana.webp',
      correct: 'A banana',
      wrong: ['A papaya', 'A pineapple', 'A watermelon'],
      exp: 'จากภาพคือ ผลกล้วย ภาษาอังกฤษตรงกับคำว่า "A banana"'
    },
    {
      q: 'Look at the picture. What fruit is this?',
      img: '/games/english/vocab-hub-assets/fruits/orange.webp',
      correct: 'An orange',
      wrong: ['A lemon', 'An apple', 'A strawberry'],
      exp: 'จากภาพคือ ผลส้ม ภาษาอังกฤษตรงกับคำว่า "An orange"'
    },
    {
      q: 'Look at the picture. What fruit is this?',
      img: '/games/english/vocab-hub-assets/fruits/watermelon.webp',
      correct: 'A watermelon',
      wrong: ['A coconut', 'A peach', 'A grape'],
      exp: 'จากภาพคือ แตงโม ภาษาอังกฤษตรงกับคำว่า "A watermelon"'
    },
    {
      q: 'Look at the picture. What fruit is this?',
      img: '/games/english/vocab-hub-assets/fruits/strawberry.webp',
      correct: 'A strawberry',
      wrong: ['A cherry', 'A grape', 'A plum'],
      exp: 'จากภาพคือ สตรอว์เบอร์รี ภาษาอังกฤษตรงกับคำว่า "A strawberry"'
    },
    {
      q: 'Look at the picture. What drink is this?',
      img: '/games/english/vocab-hub-assets/food/milk.webp',
      correct: 'Milk',
      wrong: ['Juice', 'Tea', 'Water'],
      exp: 'จากภาพคือ แก้วนมสด ภาษาอังกฤษตรงกับคำว่า "Milk"'
    },
    {
      q: 'Look at the picture. What food is this?',
      img: '/games/english/vocab-hub-assets/food/bread.webp',
      correct: 'Bread',
      wrong: ['Rice', 'Pizza', 'Cake'],
      exp: 'จากภาพคือ ขนมปังแถว ภาษาอังกฤษตรงกับคำว่า "Bread"'
    },
    {
      q: 'Look at the picture. What is this?',
      img: '/games/english/vocab-hub-assets/food/egg.webp',
      correct: 'An egg',
      wrong: ['Cheese', 'Butter', 'Meat'],
      exp: 'จากภาพคือ ไข่ไก่ ภาษาอังกฤษตรงกับคำว่า "An egg"'
    },
    {
      q: 'Look at the picture. What food is this?',
      img: '/games/english/vocab-hub-assets/food/pizza.webp',
      correct: 'Pizza',
      wrong: ['Hamburger', 'Sandwich', 'Noodles'],
      exp: 'จากภาพคือ ถาดพิซซ่า ภาษาอังกฤษตรงกับคำว่า "Pizza"'
    },
    {
      q: 'Look at the picture. What dessert is this?',
      img: '/games/english/vocab-hub-assets/food/ice-cream.webp',
      correct: 'Ice cream',
      wrong: ['Cake', 'Chocolate', 'Cookie'],
      exp: 'จากภาพคือ ไอศกรีมโคน ภาษาอังกฤษตรงกับคำว่า "Ice cream"'
    }
  ];

  foodItems.forEach((item, idx) => {
    const opts = [item.correct, ...item.wrong].sort(() => 0.5 - ((idx * 4) % 2));
    const ans = opts.indexOf(item.correct);
    add(
      'Visual Vocabulary: Food & Fruits',
      idx % 3 === 0 ? 'easy' : (idx % 3 === 1 ? 'medium' : 'hard'),
      'L1',
      item.q,
      opts,
      ans,
      item.exp,
      item.img
    );
  });

  // =========================================================================
  // 5. Body Parts & Clothes (10 ข้อ)
  // =========================================================================
  const bodyClothesItems = [
    {
      q: 'Look at the picture. What is this part of the body?',
      img: '/games/english/vocab-hub-assets/body/eye.webp',
      correct: 'Eye',
      wrong: ['Ear', 'Nose', 'Mouth'],
      exp: 'จากภาพคือ ดวงตา ภาษาอังกฤษตรงกับคำว่า "Eye"'
    },
    {
      q: 'Look at the picture. What is this part of the body?',
      img: '/games/english/vocab-hub-assets/body/ear.webp',
      correct: 'Ear',
      wrong: ['Eye', 'Head', 'Arm'],
      exp: 'จากภาพคือ ใบหู ภาษาอังกฤษตรงกับคำว่า "Ear"'
    },
    {
      q: 'Look at the picture. What is this part of the body?',
      img: '/games/english/vocab-hub-assets/body/nose.webp',
      correct: 'Nose',
      wrong: ['Mouth', 'Hand', 'Leg'],
      exp: 'จากภาพคือ จมูก ภาษาอังกฤษตรงกับคำว่า "Nose"'
    },
    {
      q: 'Look at the picture. What is this part of the body?',
      img: '/games/english/vocab-hub-assets/body/mouth.webp',
      correct: 'Mouth',
      wrong: ['Nose', 'Foot', 'Ear'],
      exp: 'จากภาพคือ ปาก ภาษาอังกฤษตรงกับคำว่า "Mouth"'
    },
    {
      q: 'Look at the picture. What is this part of the body?',
      img: '/games/english/vocab-hub-assets/body/hand.webp',
      correct: 'Hand',
      wrong: ['Foot', 'Arm', 'Leg'],
      exp: 'จากภาพคือ ฝ่ามือ ภาษาอังกฤษตรงกับคำว่า "Hand"'
    },
    {
      q: 'Look at the picture. What is this?',
      img: '/games/english/vocab-hub-assets/clothes/hat.webp',
      correct: 'A hat',
      wrong: ['A shirt', 'Pants', 'Shoes'],
      exp: 'จากภาพคือ หมวก ภาษาอังกฤษตรงกับคำว่า "A hat"'
    },
    {
      q: 'Look at the picture. What is this?',
      img: '/games/english/vocab-hub-assets/clothes/shirt.webp',
      correct: 'A shirt',
      wrong: ['A dress', 'A jacket', 'A scarf'],
      exp: 'จากภาพคือ เสื้อเชิ้ต ภาษาอังกฤษตรงกับคำว่า "A shirt"'
    },
    {
      q: 'Look at the picture. What is this?',
      img: '/games/english/vocab-hub-assets/clothes/dress.webp',
      correct: 'A dress',
      wrong: ['Pants', 'Boots', 'Socks'],
      exp: 'จากภาพคือ ชุดกระโปรงเดรส ภาษาอังกฤษตรงกับคำว่า "A dress"'
    },
    {
      q: 'Look at the picture. What are these?',
      img: '/games/english/vocab-hub-assets/clothes/shoes.webp',
      correct: 'Shoes',
      wrong: ['Socks', 'Gloves', 'Boots'],
      exp: 'จากภาพคือ รองเท้าคู่ ภาษาอังกฤษตรงกับคำว่า "Shoes"'
    },
    {
      q: 'Look at the picture. What are these?',
      img: '/games/english/vocab-hub-assets/clothes/socks.webp',
      correct: 'Socks',
      wrong: ['Shoes', 'Pants', 'Gloves'],
      exp: 'จากภาพคือ ถุงเท้าคู่ ภาษาอังกฤษตรงกับคำว่า "Socks"'
    }
  ];

  bodyClothesItems.forEach((item, idx) => {
    const opts = [item.correct, ...item.wrong].sort(() => 0.5 - ((idx * 3) % 2));
    const ans = opts.indexOf(item.correct);
    add(
      'Visual Vocabulary: Body Parts & Clothes',
      idx % 3 === 0 ? 'easy' : (idx % 3 === 1 ? 'medium' : 'hard'),
      'L1',
      item.q,
      opts,
      ans,
      item.exp,
      item.img
    );
  });

  // =========================================================================
  // 6. Actions, Vehicles & Weather (10 ข้อ)
  // =========================================================================
  const actionVehicleWeatherItems = [
    {
      q: 'Look at the picture. What is the boy doing?',
      img: '/games/english/vocab-hub-assets/verbs/run.webp',
      correct: 'He is running.',
      wrong: ['He is sleeping.', 'He is reading.', 'He is swimming.'],
      exp: 'จากภาพคือ เด็กผู้ชายกำลังวิ่ง ภาษาอังกฤษตรงกับ "He is running."'
    },
    {
      q: 'Look at the picture. What is the girl doing?',
      img: '/games/english/vocab-hub-assets/verbs/swim.webp',
      correct: 'She is swimming.',
      wrong: ['She is dancing.', 'She is cooking.', 'She is jumping.'],
      exp: 'จากภาพคือ กำลังว่ายน้ำ ภาษาอังกฤษตรงกับ "She is swimming."'
    },
    {
      q: 'Look at the picture. What is he doing?',
      img: '/games/english/vocab-hub-assets/verbs/read.webp',
      correct: 'He is reading a book.',
      wrong: ['He is writing.', 'He is eating.', 'He is drinking.'],
      exp: 'จากภาพคือ กำลังอ่านหนังสือ ภาษาอังกฤษตรงกับ "He is reading a book."'
    },
    {
      q: 'Look at the picture. What is the child doing?',
      img: '/games/english/vocab-hub-assets/verbs/sleep.webp',
      correct: 'Sleeping',
      wrong: ['Dancing', 'Singing', 'Walking'],
      exp: 'จากภาพคือ กำลังนอนหลับ ภาษาอังกฤษตรงกับคำว่า "Sleeping"'
    },
    {
      q: 'Look at the picture. What vehicle is this?',
      img: '/games/english/vocab-hub-assets/transportation/car.webp',
      correct: 'A car',
      wrong: ['A bus', 'A bicycle', 'A train'],
      exp: 'จากภาพคือ รถยนต์ ภาษาอังกฤษตรงกับคำว่า "A car"'
    },
    {
      q: 'Look at the picture. What vehicle is this?',
      img: '/games/english/vocab-hub-assets/transportation/bicycle.webp',
      correct: 'A bicycle',
      wrong: ['A motorcycle', 'A boat', 'An airplane'],
      exp: 'จากภาพคือ รถจักรยาน ภาษาอังกฤษตรงกับคำว่า "A bicycle"'
    },
    {
      q: 'Look at the picture. What vehicle is this?',
      img: '/games/english/vocab-hub-assets/transportation/airplane.webp',
      correct: 'An airplane',
      wrong: ['A helicopter', 'A ship', 'A train'],
      exp: 'จากภาพคือ เครื่องบิน ภาษาอังกฤษตรงกับคำว่า "An airplane"'
    },
    {
      q: 'Look at the picture. How is the weather?',
      img: '/games/english/vocab-hub-assets/weather/sunny.webp',
      correct: 'It is sunny.',
      wrong: ['It is rainy.', 'It is snowy.', 'It is cloudy.'],
      exp: 'จากภาพคือ ท้องฟ้าแจ่มใสมีแดดจัด ภาษาอังกฤษตรงกับ "It is sunny."'
    },
    {
      q: 'Look at the picture. How is the weather?',
      img: '/games/english/vocab-hub-assets/weather/rainy.webp',
      correct: 'It is rainy.',
      wrong: ['It is windy.', 'It is stormy.', 'It is cold.'],
      exp: 'จากภาพคือ สภาพอากาศมีฝนตก ภาษาอังกฤษตรงกับ "It is rainy."'
    },
    {
      q: 'Look at the picture. What do you see in the sky?',
      img: '/games/english/vocab-hub-assets/weather/rainbow.webp',
      correct: 'A rainbow',
      wrong: ['A cloud', 'The sun', 'Stars'],
      exp: 'จากภาพคือ รุ้งกินน้ำบนท้องฟ้า ภาษาอังกฤษตรงกับคำว่า "A rainbow"'
    }
  ];

  actionVehicleWeatherItems.forEach((item, idx) => {
    const opts = [item.correct, ...item.wrong].sort(() => 0.5 - ((idx * 6) % 2));
    const ans = opts.indexOf(item.correct);
    add(
      'Visual Vocabulary: Actions, Vehicles & Weather',
      idx % 3 === 0 ? 'easy' : (idx % 3 === 1 ? 'medium' : 'hard'),
      'L2',
      item.q,
      opts,
      ans,
      item.exp,
      item.img
    );
  });

  return list;
}
