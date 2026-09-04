/* data.js — ข้อมูลภารกิจ, Features และ Training Datasets สำหรับ Neural Bot */
window.GAME_DATA = {
  CLASSES: {
    CRYSTAL: {
      id: 'crystal',
      name: 'แร่คริสตัล',
      emoji: '💎',
      color: '#38bdf8', // cyan-400
      action: 'COLLECT',
      actionText: '📥 ดูดเก็บพลังงาน',
      key: 'ArrowLeft',
      desc: 'พลังงานสูง (>0.5) นำไปเติมเชื้อเพลิงยาน',
    },
    DEBRIS: {
      id: 'debris',
      name: 'เศษขยะอวกาศ',
      emoji: '🪨',
      color: '#f97316', // orange-500
      action: 'ZAP',
      actionText: '⚡ ยิงสลายขยะ',
      key: 'ArrowRight',
      desc: 'ความหนาแน่นสูง พลังงานต่ำ ทำลายก่อนชนยาน',
    }
  },

  MISSIONS: [
    {
      id: 1,
      title: 'ระดับ 1: ปฐมบทคัดแยกแร่ (Mineral Sorter)',
      story: 'ยานสำรวจต้องการแร่คริสตัล 💎 และต้องยิงทำลายขยะอวกาศ 🪨 ฝึกสอนบอทให้แยก 2 ชนิดนี้ออกจากกัน!',
      concept: 'Linear Classification — ปรับเส้นตรงแบ่งแยกระหว่างพลังงานและความหนาแน่น',
      features: ['energy', 'density'],
      trainSet: [
        { x: 0.8, y: 0.2, label: 'crystal' },
        { x: 0.9, y: 0.3, label: 'crystal' },
        { x: 0.7, y: 0.4, label: 'crystal' },
        { x: 0.85, y: 0.15, label: 'crystal' },
        { x: 0.65, y: 0.25, label: 'crystal' },
        { x: 0.75, y: 0.35, label: 'crystal' },
        { x: 0.2, y: 0.8, label: 'debris' },
        { x: 0.3, y: 0.7, label: 'debris' },
        { x: 0.15, y: 0.9, label: 'debris' },
        { x: 0.4, y: 0.65, label: 'debris' },
        { x: 0.25, y: 0.85, label: 'debris' },
        { x: 0.35, y: 0.75, label: 'debris' },
      ],
      idealWeights: { w1: 1.4, w2: -1.4, bias: 0.0 }
    },
    {
      id: 2,
      title: 'ระดับ 2: ดักจับสัญญาณรบกวน (Noise & Bias Challenge)',
      story: 'มีเศษขยะอวกาศเปล่งรังสีปลอม! สังเกตข้อมูลให้ดี อย่าให้ AI ลำเอียง (Data Bias) จนตอบผิด',
      concept: 'Handling Noise & Outliers — ข้อมูลที่มีสัญญาณรบกวนต้องพิจารณาน้ำหนักให้รัดกุม',
      features: ['energy', 'density'],
      trainSet: [
        { x: 0.85, y: 0.3, label: 'crystal' },
        { x: 0.75, y: 0.2, label: 'crystal' },
        { x: 0.9, y: 0.4, label: 'crystal' },
        { x: 0.65, y: 0.35, label: 'crystal' },
        { x: 0.8, y: 0.1, label: 'crystal' },
        { x: 0.55, y: 0.45, label: 'debris', noise: true }, // Outlier noise
        { x: 0.2, y: 0.7, label: 'debris' },
        { x: 0.3, y: 0.85, label: 'debris' },
        { x: 0.1, y: 0.6, label: 'debris' },
        { x: 0.4, y: 0.8, label: 'debris' },
        { x: 0.25, y: 0.95, label: 'debris' },
        { x: 0.35, y: 0.65, label: 'debris' },
      ],
      idealWeights: { w1: 1.6, w2: -1.2, bias: -0.1 }
    },
    {
      id: 3,
      title: 'ระดับ 3: สมองกลกู้จักรวาลขั้นสุด (Deep Space Final)',
      story: 'พายุคลื่นคอสมิกกำลังพัดเข้าสู่ยาน! วัตถุพุ่งมาด้วยความเร็วสูง บอทต้องจำแนกอย่างแม่นยำ 100%!',
      concept: 'High-speed Inference & Model Confidence — การทำงานจริงในสภาวะวิกฤต',
      features: ['energy', 'density'],
      trainSet: [
        { x: 0.9, y: 0.2, label: 'crystal' },
        { x: 0.8, y: 0.35, label: 'crystal' },
        { x: 0.7, y: 0.25, label: 'crystal' },
        { x: 0.85, y: 0.45, label: 'crystal' },
        { x: 0.6, y: 0.15, label: 'crystal' },
        { x: 0.75, y: 0.5, label: 'crystal' },
        { x: 0.15, y: 0.8, label: 'debris' },
        { x: 0.25, y: 0.65, label: 'debris' },
        { x: 0.35, y: 0.9, label: 'debris' },
        { x: 0.45, y: 0.75, label: 'debris' },
        { x: 0.2, y: 0.95, label: 'debris' },
        { x: 0.3, y: 0.55, label: 'debris' },
      ],
      idealWeights: { w1: 1.8, w2: -1.5, bias: 0.0 }
    }
  ]
};

