/* data.js — คลังคำศัพท์ภาษาไทย (คำถูก vs คำมักเขียนผิด) และข้อมูล 3 ด่าน */
window.GAME_DATA = {
  title: '🍄 มาริโอตะลุยคำไทย',
  subtitle: 'กระโดดเก็บคำที่สะกดถูกต้อง · ห้ามเก็บคำผิด! (มีหัวใจ 5 ดวง)',
  tips: [
    'ใช้ปุ่ม ◀ ▶ หรือ A / D เพื่อวิ่ง · Space / ▲ / W เพื่อกระโดด (กดค้างกระโดดสูง)',
    'เก็บป้ายคำที่สะกดถูกต้อง (+100 คะแนน) และเหยียบหัวมอนสเตอร์ (+50)',
    'ระวัง! เก็บคำที่สะกดผิด ชนศัตรู หรือตกเหว จะเสียหัวใจ 1 ดวง (มีทั้งหมด 5 ดวง)',
    'โหม่งบล็อก ? สีทอง เพื่อลุ้นเหรียญทองและหัวใจ 1-UP ลับประจำด่าน!'
  ],

  WORLDS: [
    {
      id: '1-1',
      name: 'ด่าน 1-1: ทุ่งคำวิสรรชนีย์',
      theme: 'overworld',
      skyColor: '#5c94fc',
      bgmTheme: 'overworld',
      lengthTiles: 108,
      pits: [
        [24, 25],
        [49, 51],
        [75, 76]
      ],
      // ท่อเขียว: { tileX, heightTiles }
      pipes: [
        { tileX: 16, heightTiles: 2 },
        { tileX: 35, heightTiles: 3 },
        { tileX: 60, heightTiles: 2 },
        { tileX: 84, heightTiles: 3 }
      ],
      // แท่นอิฐและบล็อก ? (tileY นับจากบนลงล่าง โดยพื้นอยู่ที่ row 12 ใน 14 rows)
      // type: 'brick' | 'q_coin' | 'q_heart'
      blocks: [
        { tileX: 10, tileY: 8, type: 'q_coin' },
        { tileX: 11, tileY: 8, type: 'brick' },
        { tileX: 12, tileY: 8, type: 'q_coin' },
        { tileX: 13, tileY: 8, type: 'brick' },

        { tileX: 28, tileY: 8, type: 'brick' },
        { tileX: 29, tileY: 8, type: 'q_heart' },
        { tileX: 30, tileY: 8, type: 'brick' },

        { tileX: 42, tileY: 8, type: 'brick' },
        { tileX: 43, tileY: 8, type: 'q_coin' },
        { tileX: 44, tileY: 8, type: 'brick' },
        { tileX: 43, tileY: 5, type: 'q_coin' },

        { tileX: 67, tileY: 8, type: 'brick' },
        { tileX: 68, tileY: 8, type: 'q_coin' },
        { tileX: 69, tileY: 8, type: 'brick' },

        { tileX: 90, tileY: 8, type: 'brick' },
        { tileX: 91, tileY: 8, type: 'q_coin' },
        { tileX: 92, tileY: 8, type: 'brick' }
      ],
      // โซนวางคู่คำศัพท์ (8 จุดในด่าน; 1 จุดมีคำถูก 1 คำ + คำผิด 1 คำ อยู่คนละระดับความสูง)
      wordZones: [
        { tileX: 11, highY: 5.8, lowY: 10.6 },
        { tileX: 21, highY: 8.2, lowY: 10.6 },
        { tileX: 31, highY: 5.8, lowY: 10.6 },
        { tileX: 43, highY: 6.4, lowY: 10.6 },
        { tileX: 55, highY: 8.2, lowY: 10.6 },
        { tileX: 68, highY: 5.8, lowY: 10.6 },
        { tileX: 79, highY: 8.2, lowY: 10.6 },
        { tileX: 91, highY: 5.8, lowY: 10.6 }
      ],
      enemies: [19, 32, 46, 64, 81, 88],
      checkpointTileX: 54,
      flagTileX: 100,
      pairs: [
        { correct: 'กะเพรา', wrong: 'กระเพรา', hint: 'กะเพรา ไม่มี ร.เรือ ควบกล้ำที่ตัว ก' },
        { correct: 'กะทิ', wrong: 'กระทิ', hint: 'กะทิ ไม่มี ร.เรือ ควบกล้ำที่ตัว ก' },
        { correct: 'ปะการัง', wrong: 'ประการัง', hint: 'ปะการัง ไม่มี ร.เรือ ควบกล้ำที่ตัว ป' },
        { correct: 'กะทัดรัด', wrong: 'กระทัดรัด', hint: 'กะทัดรัด ไม่มี ร.เรือ ที่คำว่า กะ' },
        { correct: 'กะหล่ำ', wrong: 'กระหล่ำ', hint: 'กะหล่ำปลี ไม่มี ร.เรือ ควบกล้ำ' },
        { correct: 'กะทันหัน', wrong: 'กระทันหัน', hint: 'กะทันหัน ไม่มี ร.เรือ ควบกล้ำ' },
        { correct: 'ตะกร้า', wrong: 'ตระกร้า', hint: 'ตะกร้า ไม่มี ร.เรือ ที่ตัว ต' },
        { correct: 'ตะไคร้', wrong: 'ตระไคร้', hint: 'ตะไคร้ คำว่า ตะ ไม่มี ร.เรือ' },
        { correct: 'ตะหลิว', wrong: 'ตระหลิว', hint: 'ตะหลิว ไม่มี ร.เรือ' },
        { correct: 'สะพาน', wrong: 'สระพาน', hint: 'ข้ามสะพาน ไม่มี ร.เรือ' },
        { correct: 'สะดุด', wrong: 'สระดุด', hint: 'สะดุดล้ม ไม่มี ร.เรือ' },
        { correct: 'ขะมักเขม้น', wrong: 'ขมักเขม้น', hint: 'ขะมักเขม้น ต้องมีสระอะที่ตัว ข' }
      ]
    },
    {
      id: '1-2',
      name: 'ด่าน 1-2: ถ้ำคำสมาสและตัวสะกด',
      theme: 'underground',
      skyColor: '#101830',
      bgmTheme: 'underground',
      lengthTiles: 112,
      pits: [
        [22, 24],
        [45, 47],
        [70, 72],
        [89, 91]
      ],
      pipes: [
        { tileX: 15, heightTiles: 2 },
        { tileX: 37, heightTiles: 3 },
        { tileX: 62, heightTiles: 2 },
        { tileX: 83, heightTiles: 3 }
      ],
      blocks: [
        { tileX: 9, tileY: 8, type: 'brick' },
        { tileX: 10, tileY: 8, type: 'q_coin' },
        { tileX: 11, tileY: 8, type: 'brick' },

        { tileX: 28, tileY: 8, type: 'brick' },
        { tileX: 29, tileY: 8, type: 'q_coin' },
        { tileX: 30, tileY: 8, type: 'q_heart' },
        { tileX: 31, tileY: 8, type: 'brick' },

        { tileX: 52, tileY: 8, type: 'brick' },
        { tileX: 53, tileY: 8, type: 'q_coin' },
        { tileX: 54, tileY: 8, type: 'brick' },

        { tileX: 75, tileY: 8, type: 'brick' },
        { tileX: 76, tileY: 8, type: 'q_coin' },
        { tileX: 77, tileY: 8, type: 'brick' },
        { tileX: 76, tileY: 5, type: 'q_coin' },

        { tileX: 95, tileY: 8, type: 'brick' },
        { tileX: 96, tileY: 8, type: 'q_coin' },
        { tileX: 97, tileY: 8, type: 'brick' }
      ],
      wordZones: [
        { tileX: 10, highY: 5.8, lowY: 10.6 },
        { tileX: 19, highY: 8.2, lowY: 10.6 },
        { tileX: 30, highY: 5.8, lowY: 10.6 },
        { tileX: 41, highY: 8.2, lowY: 10.6 },
        { tileX: 53, highY: 5.8, lowY: 10.6 },
        { tileX: 66, highY: 8.2, lowY: 10.6 },
        { tileX: 76, highY: 6.4, lowY: 10.6 },
        { tileX: 96, highY: 5.8, lowY: 10.6 }
      ],
      enemies: [18, 27, 42, 58, 67, 79, 94],
      checkpointTileX: 56,
      flagTileX: 104,
      pairs: [
        { correct: 'อนุญาต', wrong: 'อนุญาติ', hint: 'อนุญาต ไม่มีสระอิ (ถ้า ญาติพี่น้อง ถึงจะมีสระอิ)' },
        { correct: 'สังเกต', wrong: 'สังเกตุ', hint: 'สังเกต ไม่มีสระอุ (แต่ สาเหตุ มีสระอุ)' },
        { correct: 'โอกาส', wrong: 'โอกาศ', hint: 'โอกาส ต้องใช้ ส.เสือ สะกด (อากาศ ใช้ ศ.ศาลา)' },
        { correct: 'กาลเทศะ', wrong: 'กาละเทศะ', hint: 'กาลเทศะ เขียนติดกัน ไม่ต้องมีสระอะตรงกลาง' },
        { correct: 'ภารกิจ', wrong: 'ภาระกิจ', hint: 'ภารกิจ เขียนติดกันโดยไม่ประวิสรรชนีย์' },
        { correct: 'อิสรภาพ', wrong: 'อิสระภาพ', hint: 'อิสรภาพ ไม่ประวิสรรชนีย์ตรงกลาง' },
        { correct: 'สุขภาพ', wrong: 'สุขะภาพ', hint: 'สุขภาพ ไม่ประวิสรรชนีย์ตรงกลาง' },
        { correct: 'วัฒนธรรม', wrong: 'วัฒนะธรรม', hint: 'วัฒนธรรม เขียนติดกันไม่มีสระอะตรงกลาง' },
        { correct: 'คมนาคม', wrong: 'คมมะนาคม', hint: 'คมนาคม ไม่มีสระอะตรงกลาง' },
        { correct: 'พยาบาล', wrong: 'พะยาบาล', hint: 'พยาบาล ไม่ประวิสรรชนีย์ที่ตัว พ' },
        { correct: 'มังคุด', wrong: 'มังขุด', hint: 'มังคุด ใช้ ค.ควาย สะกด' },
        { correct: 'พะยูน', wrong: 'พยูร', hint: 'พะยูน สัตว์ทะเล ใช้ น.หนู สะกด' }
      ]
    },
    {
      id: '1-3',
      name: 'ด่าน 1-3: ปราสาทตัวการันต์และคำพ้อง',
      theme: 'castle',
      skyColor: '#3b5dc9',
      bgmTheme: 'castle',
      lengthTiles: 116,
      pits: [
        [20, 22],
        [41, 43],
        [63, 65],
        [86, 88]
      ],
      pipes: [
        { tileX: 14, heightTiles: 2 },
        { tileX: 35, heightTiles: 3 },
        { tileX: 57, heightTiles: 3 },
        { tileX: 80, heightTiles: 2 }
      ],
      blocks: [
        { tileX: 9, tileY: 8, type: 'q_coin' },
        { tileX: 10, tileY: 8, type: 'brick' },
        { tileX: 11, tileY: 8, type: 'q_coin' },

        { tileX: 27, tileY: 8, type: 'brick' },
        { tileX: 28, tileY: 8, type: 'q_heart' },
        { tileX: 29, tileY: 8, type: 'brick' },

        { tileX: 48, tileY: 8, type: 'brick' },
        { tileX: 49, tileY: 8, type: 'q_coin' },
        { tileX: 50, tileY: 8, type: 'brick' },
        { tileX: 49, tileY: 5, type: 'q_coin' },

        { tileX: 71, tileY: 8, type: 'brick' },
        { tileX: 72, tileY: 8, type: 'q_coin' },
        { tileX: 73, tileY: 8, type: 'brick' },

        { tileX: 95, tileY: 8, type: 'brick' },
        { tileX: 96, tileY: 8, type: 'q_coin' },
        { tileX: 97, tileY: 8, type: 'brick' }
      ],
      wordZones: [
        { tileX: 10, highY: 5.8, lowY: 10.6 },
        { tileX: 17, highY: 8.2, lowY: 10.6 },
        { tileX: 28, highY: 5.8, lowY: 10.6 },
        { tileX: 39, highY: 8.2, lowY: 10.6 },
        { tileX: 49, highY: 6.4, lowY: 10.6 },
        { tileX: 60, highY: 8.2, lowY: 10.6 },
        { tileX: 72, highY: 5.8, lowY: 10.6 },
        { tileX: 96, highY: 5.8, lowY: 10.6 }
      ],
      enemies: [16, 25, 38, 53, 68, 76, 92, 99],
      checkpointTileX: 58,
      flagTileX: 108,
      pairs: [
        { correct: 'คำนวณ', wrong: 'คำนวน', hint: 'คำนวณ ใช้ ณ.เณร สะกด' },
        { correct: 'ลายเซ็น', wrong: 'ลายเซ็นต์', hint: 'ลายเซ็น ไม่มี ต์ การันต์' },
        { correct: 'รางวัล', wrong: 'รางวัลย์', hint: 'รางวัล ไม่มี ย์ การันต์' },
        { correct: 'เครื่องสำอาง', wrong: 'เครื่องสำอางค์', hint: 'เครื่องสำอาง ไม่มี ค์ การันต์' },
        { correct: 'โควตา', wrong: 'โควต้า', hint: 'โควตา คำทับศัพท์ ไม่ต้องใส่ไม้โท' },
        { correct: 'ประณีต', wrong: 'ปราณีต', hint: 'ประณีตบรรจง ใช้ ปร สระอะ ไม่ใช่ ปรา' },
        { correct: 'ทัศนคติ', wrong: 'ทรรศนคติ', hint: 'ทัศนคติ ใช้ ศ.ศาลา สระอะกึ่งมาตรา' },
        { correct: 'พรรณนา', wrong: 'พันนา', hint: 'พรรณนา ใช้ รร (ร หัน) และ ณ.เณร' },
        { correct: 'จำนง', wrong: 'จำนงค์', hint: 'ความจำนง ไม่มี ค์ การันต์' },
        { correct: 'ประวัติศาสตร์', wrong: 'ประวัติศาสตร์ย์', hint: 'ประวัติศาสตร์ จบที่ ตร์ การันต์' },
        { correct: 'สูจิบัตร', wrong: 'สูจิบัตรย์', hint: 'สูจิบัตร ไม่มี ย์ การันต์' },
        { correct: 'ละเอียด', wrong: 'ละเอีด', hint: 'ละเอียด ต้องมี ย.ยักษ์ ในสระเอีย' }
      ]
    }
  ]
};
