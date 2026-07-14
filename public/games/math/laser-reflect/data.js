/* data.js — ข้อมูลด่านในเกม Laser Reflect */
window.GAME_DATA = {
  // ด่านในโหมดผจญภัย (Adventure Mode)
  stages: [
    {
      id: 1,
      title: "ด่าน 1: จุดหักเหพิกัดฉาก",
      hint: "ยิงแสงไปทางขวา วางกระจกไว้ที่พิกัด (5, 5) และปรับมุม 45 องศา เพื่อหักลำแสงชี้ขึ้นทิศเหนือไปยังเป้าหมายที่พิกัด (5, 8)",
      emitter: { x: 2, y: 5, angle: 0 }, // angle: องศา (0 = ขวา, 90 = บน, 180 = ซ้าย, 270 = ล่าง)
      target: { x: 5, y: 8, radius: 0.35 },
      mirrors: [
        { id: 1, x: 5, y: 3, angle: 0, requiredX: 5, requiredY: 5, requiredAngle: 45 }
      ],
      maxMirrors: 1,
      obstacles: []
    },
    {
      id: 2,
      title: "ด่าน 2: อ้อมสิ่งกีดขวางเดี่ยว",
      hint: "มีกำแพงทึบแสงกั้นที่พิกัด X=5 ให้ใช้กระจก 2 บาน เพื่อสะท้อนลำแสงอ้อมหลบข้ามสิ่งกีดขวางไปหาเป้าหมาย",
      emitter: { x: 1, y: 3, angle: 0 },
      target: { x: 9, y: 3, radius: 0.35 },
      mirrors: [
        { id: 1, x: 3, y: 1, angle: 0 },
        { id: 2, x: 7, y: 1, angle: 0 }
      ],
      maxMirrors: 2,
      obstacles: [
        { x: 5, y: 2, w: 1, h: 3, type: 'wall' } // กำแพงกั้นตั้งแต่ Y=2 ถึง Y=5
      ]
    },
    {
      id: 3,
      title: "ด่าน 3: สะท้อนทแยงมุม",
      hint: "เป้าหมายอยู่ที่ (6, 2) ลองยิงเลเซอร์ลงล่างแล้วสะท้อนให้หักเหไปยังเป้าหมายที่อยู่ต่ำกว่า",
      emitter: { x: 2, y: 8, angle: 0 },
      target: { x: 6, y: 2, radius: 0.35 },
      mirrors: [
        { id: 1, x: 6, y: 8, angle: 0 }
      ],
      maxMirrors: 1,
      obstacles: []
    },
    {
      id: 4,
      title: "ด่าน 4: เส้นทางหลบสิ่งกีดขวางอันตราย",
      hint: "หลบวัตถุอันตรายสีแดงที่พิกัด (5, 5) วางกระจกไว้ที่พิกัดรอบๆ เพื่อหักลำแสงเลเซอร์เป็นรูปตัว U",
      emitter: { x: 2, y: 2, angle: 0 },
      target: { x: 2, y: 8, radius: 0.35 },
      mirrors: [
        { id: 1, x: 8, y: 2, angle: 0 },
        { id: 2, x: 8, y: 8, angle: 0 }
      ],
      maxMirrors: 2,
      obstacles: [
        { x: 5, y: 4, w: 1, h: 2, type: 'danger' } // กล่องอันตรายตรงกลาง
      ]
    },
    {
      id: 5,
      title: "ด่าน 5: แสงสะท้อนสวนทาง",
      hint: "เลเซอร์ถูกยิงขึ้นด้านบนตรง (3, 3) แต่เป้าหมายอยู่ที่ด้านล่างขวา (7, 3) ต้องใช้กระจกหักเหทิศทางสวนกลับลงมา",
      emitter: { x: 3, y: 3, angle: 90 },
      target: { x: 7, y: 3, radius: 0.35 },
      mirrors: [
        { id: 1, x: 3, y: 8, angle: 0 },
        { id: 2, x: 7, y: 8, angle: 0 }
      ],
      maxMirrors: 2,
      obstacles: [
        { x: 5, y: 4, w: 1, h: 3, type: 'wall' }
      ]
    },
    {
      id: 6,
      title: "ด่าน 6: เขาวงกตพิกัดแคบ",
      hint: "ระวังกำแพงทึบสองฝั่งด้านซ้ายและขวา ใช้กระจก 2 บาน ส่งลำแสงหักเลี้ยวขึ้นบนขวาและตรงไปยังเป้าหมาย",
      emitter: { x: 2, y: 1, angle: 90 },
      target: { x: 8, y: 9, radius: 0.35 },
      mirrors: [
        { id: 1, x: 2, y: 5, angle: 0 },
        { id: 2, x: 8, y: 5, angle: 0 }
      ],
      maxMirrors: 2,
      obstacles: [
        { x: 5, y: 1, w: 1, h: 4, type: 'wall' },
        { x: 5, y: 6, w: 1, h: 3, type: 'wall' }
      ]
    },
    {
      id: 7,
      title: "ด่าน 7: ห่วงเลเซอร์สามทิศทาง",
      hint: "ใช้กระจกสะท้อน 3 บาน เพื่อหลบแกนกลางพิกัดตาราง และย้อนแสงกลับมาชนเป้าหมายที่อยู่ใกล้ตัวยิง",
      emitter: { x: 1, y: 2, angle: 0 },
      target: { x: 1, y: 8, radius: 0.35 },
      mirrors: [
        { id: 1, x: 9, y: 2, angle: 0 },
        { id: 2, x: 9, y: 8, angle: 0 },
        { id: 3, x: 5, y: 8, angle: 0 }
      ],
      maxMirrors: 3,
      obstacles: [
        { x: 4, y: 4, w: 3, h: 2, type: 'wall' }
      ]
    },
    {
      id: 8,
      title: "ด่าน 8: บททดสอบแชมเปี้ยนเลเซอร์",
      hint: "ด่านสุดท้าย! มีเสากั้นแนวตั้งสองเสาขวางอยู่ ต้องคำนวณพิกัดและเอียงมุม 45 องศาทั้ง 3 บานให้ซิกแซกอย่างสมบูรณ์แบบเพื่อยิงเข้าเป้ากลาง",
      emitter: { x: 1, y: 5, angle: 0 },
      target: { x: 5, y: 5, radius: 0.35 },
      mirrors: [
        { id: 1, x: 3, y: 2, angle: 0 },
        { id: 2, x: 5, y: 8, angle: 0 },
        { id: 3, x: 7, y: 2, angle: 0 }
      ],
      maxMirrors: 3,
      obstacles: [
        { x: 3, y: 4, w: 1, h: 5, type: 'wall' },
        { x: 7, y: 1, w: 1, h: 5, type: 'wall' }
      ]
    }
  ]
};
