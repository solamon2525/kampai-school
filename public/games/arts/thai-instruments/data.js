/* data.js — ข้อมูลประเภทเครื่องดนตรีไทย ประวัติ และคำถามสำหรับเกม "Thai Instruments" */
window.GAME_DATA = {
  // รายชื่อเครื่องดนตรีไทยและพารามิเตอร์สังเคราะห์เสียง (Web Audio API)
  instruments: [
    // 1. ดีด (Plucked)
    {
      id: 'jakhe',
      nameTh: 'จะเข้',
      nameEn: 'Jakhe',
      category: 'ดีด',
      descTh: 'เครื่องดนตรีประเภทดีด มี 3 สาย วางราบกับพื้น ผู้เล่นนั่งพับเพียบดีดด้วยไม้ดีดปลายแหลม',
      emoji: '🐊',
      synth: {
        type: 'triangle',
        attack: 0.005,
        decay: 0.15,
        sustain: 0.0,
        release: 0.1,
        frequencyMultiplier: 1.0,
        filterCutoff: 1800
      }
    },
    {
      id: 'phin',
      nameTh: 'พิณ',
      nameEn: 'Phin',
      category: 'ดีด',
      descTh: 'เครื่องดนตรีพื้นบ้านอีสาน ประเภทดีด มี 2-4 สาย มีคอสำหรับกดเปลี่ยนระดับเสียง เสียงสูงใสสะกดใจ',
      emoji: '🎸',
      synth: {
        type: 'sawtooth',
        attack: 0.01,
        decay: 0.12,
        sustain: 0.0,
        release: 0.08,
        frequencyMultiplier: 2.0, // octave higher
        filterCutoff: 1200
      }
    },
    // 2. สี (Bowed)
    {
      id: 'saw-duang',
      nameTh: 'ซอด้วง',
      nameEn: 'Saw Duang',
      category: 'สี',
      descTh: 'ซอสองสาย เสียงแหลมสูง กะโหลกซอทำด้วยไม้ กระบอกยาวขึงด้วยหนังงู มีคันสีอยู่ระหว่างสาย',
      emoji: '🎻',
      synth: {
        type: 'sawtooth',
        attack: 0.08,
        decay: 0.08,
        sustain: 0.8,
        release: 0.15,
        frequencyMultiplier: 2.0, // เสียงสูง
        filterCutoff: 1500,
        vibrato: true
      }
    },
    {
      id: 'saw-u',
      nameTh: 'ซออู้',
      nameEn: 'Saw U',
      category: 'สี',
      descTh: 'ซอสองสาย เสียงทุ้มต่ำ นุ่มนวล กะโหลกซอทำด้วยกะลามะพร้าวตัดครึ่ง ขึงด้วยหนังวัวหรือหนังแพะ',
      emoji: '🥥',
      synth: {
        type: 'triangle',
        attack: 0.12,
        decay: 0.1,
        sustain: 0.7,
        release: 0.2,
        frequencyMultiplier: 1.0, // เสียงต่ำ
        filterCutoff: 800,
        vibrato: true
      }
    },
    // 3. ตี (Percussion / Mallets)
    {
      id: 'ranat-ek',
      nameTh: 'ระนาดเอก',
      nameEn: 'Ranat Ek',
      category: 'ตี',
      descTh: 'เครื่องตีทำด้วยไม้เนื้อแข็ง มีผืนระนาดร้อยด้วยเชือกแขวนบนราง แถบเสียงใส คมชัดด้วยไม้ตีหัวแข็ง',
      emoji: '🎹',
      synth: {
        type: 'sine',
        attack: 0.002,
        decay: 0.08,
        sustain: 0.0,
        release: 0.05,
        frequencyMultiplier: 2.0,
        filterCutoff: 2000
      }
    },
    {
      id: 'khim',
      nameTh: 'ขิม',
      nameEn: 'Khim',
      category: 'ตี',
      descTh: 'เครื่องดนตรีประเภทตี ขึงด้วยสายลวดทองเหลือง บรรเลงโดยการใช้ไม้ตีขิมหัวนุ่ม ตีสัมผัสสายทำให้เกิดเสียงกังวานหวานใส',
      emoji: '📐',
      synth: {
        type: 'triangle',
        attack: 0.004,
        decay: 0.35,
        sustain: 0.1,
        release: 0.35,
        frequencyMultiplier: 1.5,
        filterCutoff: 2500
      }
    },
    {
      id: 'klong-yao',
      nameTh: 'กลองยาว',
      nameEn: 'Klong Yao',
      category: 'ตี',
      descTh: 'กลองหน้าเดียว ตัวกลองยาวทำจากไม้ขุดกลวง ใช้ตีด้วยมือเป็นจังหวะสนุกสนานในขบวนแห่',
      emoji: '🥁',
      synth: {
        type: 'sine',
        attack: 0.001,
        decay: 0.25,
        sustain: 0.0,
        release: 0.25,
        frequencyMultiplier: 0.5, // ทุ้มต่ำมาก
        pitchDecay: true, // ลด pitch รวดเร็ว
        filterCutoff: 400
      }
    },
    // 4. เป่า (Wind)
    {
      id: 'khlui',
      nameTh: 'ขลุ่ยเพียงอ้อ',
      nameEn: 'Khlui Phiang O',
      category: 'เป่า',
      descTh: 'เครื่องเป่าประเภทไม่มีลิ้น ทำด้วยไม้รวกหรือท่อพลาสติก เจาะรูสำหรับนิ้วปิดเปิด เสียงโหยหวน นุ่มนวล',
      emoji: '🎋',
      synth: {
        type: 'sine',
        attack: 0.08,
        decay: 0.05,
        sustain: 0.85,
        release: 0.12,
        frequencyMultiplier: 1.5,
        vibrato: true,
        noiseAmount: 0.1, // ลมหายใจเป่า
        filterCutoff: 1200
      }
    }
  ],

  // คำถาม Quiz ทั่วไปและแบบทดสอบเสียง
  quizzes: [
    {
      type: 'text',
      question: 'เครื่องดนตรีไทยในข้อใด จัดอยู่ในประเภท "ดีด"?',
      options: ['จะเข้', 'ซอด้วง', 'ขลุ่ยเพียงอ้อ', 'ระนาดเอก'],
      answer: 0,
      explanation: 'จะเข้ เล่นโดยการดีดสายด้วยไม้ดีดรูปทรงพีระมิดเรียวแหลม'
    },
    {
      type: 'text',
      question: 'กะโหลกของ "ซออู้" ทำมาจากวัสดุธรรมชาติชนิดใด?',
      options: ['ไม้สักขุด', 'กะลามะพร้าว', 'กระบอกไม้ไผ่', 'ดินเผา'],
      answer: 1,
      explanation: 'กะโหลกซออู้ ทำจากกะลามะพร้าวขนาดใหญ่ตัดครึ่ง จึงให้เสียงทุ้มกังวานต่ำ'
    },
    {
      type: 'text',
      question: 'เครื่องดนตรีประเภท "สี" ที่มีระดับเสียงแหลมสูงและนำวงดนตรีคือข้อใด?',
      options: ['ซออู้', 'จะเข้', 'ซอด้วง', 'ระนาดทุ้ม'],
      answer: 2,
      explanation: 'ซอด้วง มีระดับเสียงแหลมสูง ทำหน้าที่ดำเนินทำนองนำในวงเครื่องสาย'
    },
    {
      type: 'text',
      question: 'เครื่องดนตรีใดบรรเลงโดยใช้ "ไม้ตีสองอัน" เคาะลงบนสายโลหะทองเหลือง?',
      options: ['ขิม', 'ระนาดเอก', 'จะเข้', 'พิณ'],
      answer: 0,
      explanation: 'ขิม เป็นเครื่องดนตรีประเภทตีที่ใช้ไม้ตีขิมปลายอ่อนเคาะลงบนสายโลหะ'
    },
    {
      type: 'text',
      question: 'เครื่องดนตรีไทยในข้อใด จัดอยู่ในกลุ่มเครื่อง "เป่า"?',
      options: ['ขิม', 'ขลุ่ยเพียงอ้อ', 'ซออู้', 'จะเข้'],
      answer: 1,
      explanation: 'ขลุ่ยเพียงอ้อ เป็นเครื่องเป่าดั้งเดิมของไทย ทำจากไม้รวกหรือท่อไม้ไผ่'
    },
    // คำถามอิงเสียง (จะเล่นเสียงสแกนแล้วให้ทาย)
    {
      type: 'sound',
      instrumentId: 'ranat-ek',
      question: 'เสียงเครื่องดนตรีไทยที่กำลังได้ยินนี้ คือเครื่องดนตรีประเภทใด?',
      options: ['ขิม', 'ระนาดเอก', 'จะเข้', 'ขลุ่ยเพียงอ้อ'],
      answer: 1,
      explanation: 'เสียงเคาะสั้นคมชัดและใส ไร้เสียงก้องยาว คือเอกลักษณ์ของ ระนาดเอก'
    },
    {
      type: 'sound',
      instrumentId: 'saw-u',
      question: 'เสียงทุ้มต่ำนุ่มนวลข้อใดคือเครื่องดนตรีที่ได้ยิน?',
      options: ['ซอด้วง', 'ซออู้', 'ปี่ใน', 'จะเข้'],
      answer: 1,
      explanation: 'นี่คือเสียงทุ้มต่ำและมีความต่อเนื่องจากการลากคันสีของ ซออู้'
    },
    {
      type: 'sound',
      instrumentId: 'khlui',
      question: 'เสียงเป่าลมที่พริ้วไหวและมีลูกคอเล็กน้อยนี้ คือเครื่องดนตรีชนิดใด?',
      options: ['ขลุ่ยเพียงอ้อ', 'ซออู้', 'พิณ', 'กลองยาว'],
      answer: 0,
      explanation: 'เสียงเป่าลมผ่านท่อเสียงใสโหยหวนและพริ้วไหว เป็นเสียงของ ขลุ่ยเพียงอ้อ'
    },
    {
      type: 'sound',
      instrumentId: 'jakhe',
      question: 'เสียงดีดสายโลหะสะบัดที่ได้ยินนี้ คือเครื่องดนตรีชนิดใด?',
      options: ['พิณ', 'ซอด้วง', 'จะเข้', 'ขิม'],
      answer: 2,
      explanation: 'นี่คือเสียงของ จะเข้ ที่ดีดสายด้วยไม้ดีดปลายแหลมเป็นจังหวะขาดตอนกระชับ'
    },
    {
      type: 'sound',
      instrumentId: 'khim',
      question: 'เสียงสายโลหะเคาะพริ้วกังวานและหวานใสที่ได้ยินนี้คืออะไร?',
      options: ['ขิม', 'จะเข้', 'ระนาดเอก', 'ขลุ่ยเพียงอ้อ'],
      answer: 0,
      explanation: 'นี่คือเสียง ขิม ที่มีหางเสียงก้องกังวานยาวนานจากการเคาะสายโลหะตึงหลายสาย'
    }
  ]
};
